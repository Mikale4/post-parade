/*
 * Race simulation. Shared by the browser front-end and the node validation harness.
 *
 * Model is Umamusume-inspired rather than a clone: a base target speed set by course
 * distance, scaled per running style and race phase, with a stamina pool (HP) that
 * drains superlinearly with speed above the base pace. Running out of stamina before
 * the line is the central risk, which is what makes the card layer interesting --
 * every burst you trigger is borrowed against the finish.
 */
(function (root) {
  "use strict";

  // ---- constants -------------------------------------------------------
  /* `gap` is how many METRES behind the leader this style wants to sit through the
     opening and middle phases. A real field is strung out over ~20m, not over a
     fraction of the course -- expressing it as a fraction put closers a thousand
     metres back and made them mathematically unable to win. */
  const STYLES = {
    front: { key: "front", name: "Front Runner", phase: [1.000, 0.986, 0.962], gap: 0,  hpCoef: 0.93 },
    pace:  { key: "pace",  name: "Pace Chaser",  phase: [0.982, 0.968, 0.978], gap: 5,  hpCoef: 0.97 },
    late:  { key: "late",  name: "Late Surger",  phase: [0.958, 0.950, 0.996], gap: 12, hpCoef: 1.03 },
    ender: { key: "ender", name: "Ender",        phase: [0.944, 0.938, 1.010], gap: 18, hpCoef: 1.06 },
  };

  const APT = { S: 1.05, A: 1.00, B: 0.90, C: 0.80, D: 0.60, E: 0.40, F: 0.20, G: 0.10 };

  const DIST_CLASS = d => d <= 1400 ? "sprint" : d <= 1800 ? "mile" : d <= 2400 ? "medium" : "long";

  // ---- rng (seeded, so a race can be replayed exactly) -----------------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---- helpers ---------------------------------------------------------
  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;

  /** Track position, 1 = in front. */
  function rankOf(S, r) {
    let n = 1;
    for (const o of S.racers) if (o !== r && o.pos > r.pos) n++;
    return n;
  }

  /** The racer immediately ahead on the track, or null if leading. */
  function racerAhead(S, r) {
    let best = null;
    for (const o of S.racers) {
      if (o === r || o.finished) continue;
      if (o.pos <= r.pos) continue;
      if (!best || o.pos < best.pos) best = o;
    }
    return best;
  }

  /* Deferred effects. A card may need to look at the race again later -- a Gamble has
     to know whether the move it paid for actually worked before deciding what it costs.
     Entries are resolved in step() and reported through S.events. */
  function schedule(r, entry) { (r.pending = r.pending || []).push(entry); }

  function resolvePending(S) {
    for (const r of S.racers) {
      if (!r.pending || !r.pending.length) continue;
      const frac = r.pos / S.course.distance;
      const ripe = p => p.whenPhase != null
        ? (phaseOf(frac) >= p.whenPhase && S.t >= p.at)
        : p.at <= S.t;
      const due = r.pending.filter(ripe);
      if (!due.length) continue;
      r.pending = r.pending.filter(p => !ripe(p));
      for (const p of due) {
        if (p.kind === "invest") {
          /* Tempo cashes out: the reward for pacing yourself is having something left.
             Payoff scales with the stamina still in the tank, so an investment made too
             late (or squandered on a burst) returns almost nothing. */
          /* Scale over the 30-90% band. Across the whole 0-100% range the reserve
             clusters near 77% and the payoff never discriminates. */
          const res = clamp((r.hp / r.maxHp - 0.30) / 0.60, 0, 1);
          const gain = p.min + (p.max - p.min) * res;
          r.buffs.push({ stat: "speed", amount: gain, mul: true,
                         until: S.t + p.payDur, label: p.label });
          S.events.push({ type: "invest", racer: r, label: p.label,
                          gain, reserve: res });
          continue;
        }
        if (p.kind !== "gambit") continue;
        const now = rankOf(S, r);
        // `places` is how many positions the move has to actually gain to count
        const won = r.finished || now <= p.rankAt - (p.places || 1);
        if (won) {
          if (p.reward) {
            r.hp = Math.min(r.maxHp, r.hp + r.maxHp * p.reward);
            if (r.hp > 0) r.exhausted = false;
          }
        } else if (p.crash) {
          r.buffs.push({ stat: "speed", amount: -p.crash, mul: true,
                         until: S.t + p.crashDur, label: p.label });
        }
        S.events.push({ type: "gambit", racer: r, label: p.label, won,
                        from: p.rankAt, to: now });
      }
    }
  }

  /* Base pace for the course, m/s. Calibrated against real winning times:
     1200m ~1:08, 1600m ~1:32, 2400m ~2:23, 3200m ~3:16. */
  const baseTargetSpeed = dist => 17.0 - (dist - 2000) / 1400;

  function phaseOf(frac) {
    if (frac < 1 / 6) return 0;      // opening -- jockeying for position
    if (frac < 2 / 3) return 1;      // middle  -- settle into pace
    return 2;                        // final   -- spurt territory
  }

  /* Stats are on a 0..1200 scale like the source game. These curves are shaped so the
     gap between 600 and 1200 is meaningful but not decisive: a great racer should beat
     a poor one most of the time, not every time. */
  /* Speed is expressed as m/s relative to a reference stat of 800, so the roster
     spreads either side of the base pace instead of every racer sharing one target. */
  const speedTerm = s => (Math.sqrt(Math.max(0, s)) - Math.sqrt(800)) * 0.075;
  const PHASE_SPEED_W = [0.30, 0.40, 1.00];              // how much speed tells, per phase
  const powerTerm = p => 0.35 + Math.sqrt(p * 0.001) * 0.55;
  const gutsTerm  = g => 0.6 + Math.sqrt(g * 0.001) * 0.85;
  const witTerm   = w => Math.sqrt(w * 0.001) * 0.09;    // stamina efficiency, 0..~0.10

  /* Stamina cost per second. Superlinear in speed above the base pace, so holding a
     pace slightly too fast for your stamina is survivable but a sustained burst is
     not -- which is exactly the tension the card layer plays against. */
  function hpDrain(v, base, r, mult) {
    const eff = 1 - witTerm(r.stats.wit);
    const aptPen = 1 / Math.max(0.35, r.distApt);
    return 20 * Math.pow(Math.max(0, v - base + 12), 2) / 144 * eff * aptPen * mult * (r.groundDrain || 1);
  }

  /* The going, as the real game has it (GameTora's race mechanics): a soft or heavy track
     costs speed and power, and stamina at 2% more. Dirt is the harder going for power
     at any condition but good. Only a race that names its ground (`course.ground`, a
     career race: Career.weatherOf) is affected; one that does not runs as it always did. */
  const GROUND = {
    firm:  { speed: 0,   power: { turf: 0,   dirt: -100 }, drain: 1 },
    good:  { speed: 0,   power: { turf: -50, dirt: -50 },  drain: 1 },
    soft:  { speed: 0,   power: { turf: -50, dirt: -100 }, drain: 1.02 },
    heavy: { speed: -50, power: { turf: -50, dirt: -100 }, drain: 1.02 },
  };

  // ---- racer construction ---------------------------------------------
  function makeRacer(def, course, rng) {
    const st = STYLES[def.style] || STYLES.pace;
    const apt = def.aptitude || {};
    const distApt = APT[apt[DIST_CLASS(course.distance)] || "A"] || 1.0;
    const surfApt = APT[apt[course.surface] || "A"] || 1.0;

    /* Aptitude hits speed gently and stamina hard. Applied raw to speed it ranges
       0.10..1.05, which makes a G-aptitude racer physically unable to complete the
       course -- wrong distance should mean beaten, not stranded. The real cost of
       running the wrong trip is paid out of the stamina pool instead. */
    const speedApt = (0.72 + 0.30 * distApt) * (0.80 + 0.20 * surfApt);

    /* Stamina pool. Weighted heavily toward the stat rather than the course length --
       if the distance term dominates, every racer finishes with fuel to spare and the
       stamina stat stops meaning anything. */
    const mods = def.mods || {
      maxHpMul: 1, drainMul: 1, openAccelMul: 1, finalPaceMul: 1, leadPaceMul: 1,
      dirtPaceMul: 1, spirit: 0, biasMul: 1, ignoreTrafficFinal: false, secondWind: 0,
    };
    const maxHp = (def.stats.stamina * 2.4 + course.distance * 0.32) * st.hpCoef * mods.maxHpMul;
    const g = GROUND[course.ground];
    const stats = g ? Object.assign({}, def.stats, {
      speed: Math.max(1, def.stats.speed + g.speed),
      power: Math.max(1, def.stats.power + (g.power[course.surface] || 0)),
    }) : def.stats;

    return {
      id: def.id, name: def.name, sprite: def.sprite, color: def.color,
      stats, style: st, mods, level: def.level || 1, groundDrain: g ? g.drain : 1,
      secondWindLeft: mods.secondWind, surface: course.surface,
      apt: speedApt, distApt, surfApt,
      pos: 0, v: 0, hp: maxHp, maxHp,
      lane: 0, targetLane: 0,
      finished: false, finishT: null, rank: null,
      exhausted: false, spurting: false, blocked: false,
      buffs: [],
      // small per-race variation so the same field never runs an identical race
      form: 0.965 + rng() * 0.07,
      _rng: rng,
    };
  }

  function buffTotal(r, stat, now) {
    let add = 0, mul = 0;
    for (const b of r.buffs) {
      if (b.stat !== stat) continue;
      // a buff may be scheduled to start later -- the crash after a Gamble, say
      if (b.from != null && b.from > now) continue;
      if (b.mul) mul += b.amount; else add += b.amount;
    }
    return { add, mul };
  }

  // ---- the tick --------------------------------------------------------
  function step(S, dt) {
    const course = S.course;
    const base = baseTargetSpeed(course.distance);
    let leaderPos = 0;
    for (const r of S.racers) if (r.pos > leaderPos) leaderPos = r.pos;

    for (const r of S.racers) {
      if (r.finished) continue;
      const frac = r.pos / course.distance;
      const ph = phaseOf(frac);

      if (r.buffs.length) r.buffs = r.buffs.filter(b => b.until > S.t);

      // ---- target speed ----
      let tgt = (base * r.style.phase[ph] + speedTerm(r.stats.speed) * PHASE_SPEED_W[ph]) * r.apt * r.form;

      // last spurt: commit to max pace once the remaining distance is affordable
      if (ph === 2 && !r.exhausted) {
        const spurtV = (base * (r.style.phase[2] + 0.035) + speedTerm(r.stats.speed)) * r.apt * r.form;
        const remain = course.distance - r.pos;
        const need = hpDrain(spurtV, base, r, 1) * (remain / Math.max(1, spurtV));
        if (r.hp > need * 0.92 || frac > 0.90) r.spurting = true;
        if (r.spurting) tgt = spurtV;
      }

      // guts: dig in over the closing stretch
      if (ph === 2) tgt += 0.35 * (gutsTerm(r.stats.guts) - 0.6) * (frac - 2 / 3) * 3;

      // ---- passives that shape pace ----
      if (ph === 2) tgt *= r.mods.finalPaceMul;
      if (r.mods.leadPaceMul !== 1 && r.pos >= leaderPos - 0.01) tgt *= r.mods.leadPaceMul;
      if (r.mods.dirtPaceMul !== 1 && r.surface === "dirt") tgt *= r.mods.dirtPaceMul;

      // out of stamina -- the wall
      if (r.hp <= 0) {
        r.exhausted = true; r.spurting = false;
        const floor = 0.62 + 0.10 * (gutsTerm(r.stats.guts) - 0.6);
        tgt = base * clamp(floor, 0.55, 0.86) * r.apt;
      }

      // ---- pack behaviour: sit the style's preferred number of metres off the lead ----
      if (ph < 2) {
        const want = leaderPos - r.style.gap;
        tgt *= clamp(1 - (r.pos - want) * 0.006, 0.965, 1.035);
      }

      // ---- card buffs ----
      const sb = buffTotal(r, "speed", S.t);
      tgt = tgt * (1 + sb.mul) + sb.add;

      /* Drafting. Support turns traffic from a penalty into fuel: sitting in someone's
         slipstream pays more the closer you are, and nothing at all in clear air. The
         bonus has to be recomputed every tick, so it cannot be a flat buff. */
      const df = buffTotal(r, "draft", S.t);
      if (df.mul > 0) {
        const ahead = racerAhead(S, r);
        const gap = ahead ? ahead.pos - r.pos : 999;
        const closeness = clamp(1 - (gap - 1.2) / 7, 0, 1);
        r.drafting = closeness > 0.05 ? closeness : 0;
        tgt *= 1 + df.mul * closeness;
      } else r.drafting = 0;

      // ---- traffic ----
      r.blocked = false;
      const unblocked = r.buffs.some(b => b.stat === "unblock" || b.stat === "draft") ||
                        (r.mods.ignoreTrafficFinal && ph === 2);
      if (!unblocked && (!r.spurting || ph < 2)) {
        for (const o of S.racers) {
          if (o === r || o.finished) continue;
          const d = o.pos - r.pos;
          if (d > 0 && d < 2.2 && Math.abs(o.lane - r.lane) < 0.6) {
            r.blocked = true;
            tgt = Math.min(tgt, o.v * 0.985);
            break;
          }
        }
      }

      // ---- accelerate ----
      /* `accel` buffs come from acceleration uniques (Red Shift, Shooting for Victory!):
         they only pay while she is still getting up to her target speed. */
      const accelCap = powerTerm(r.stats.power) *
                       (ph === 0 ? 1.35 * r.mods.openAccelMul : ph === 2 ? 1.15 : 0.9) *
                       (1 + buffTotal(r, "accel", S.t).mul);
      const dv = tgt - r.v;
      const rate = dv > 0 ? accelCap : accelCap * 1.9;
      r.v = Math.max(0, r.v + clamp(dv, -rate * dt, rate * dt));

      // ---- stamina ----
      if (!r.exhausted) {
        // cards can trade drain against pace in either direction
        const drainMul = Math.max(0.2, 1 + buffTotal(r, "drain", S.t).mul) * r.mods.drainMul;
        r.hp -= hpDrain(r.v, base, r, drainMul) * dt;

        // Second Wind: one free top-up the first time the tank runs low
        if (r.secondWindLeft > 0 && r.hp < r.maxHp * 0.25) {
          r.hp = Math.min(r.maxHp, r.hp + r.maxHp * r.secondWindLeft);
          r.secondWindLeft = 0;
          r.secondWindFired = S.t;
        }
        const rec = buffTotal(r, "hp", S.t);
        if (rec.add) {
          r.hp = Math.min(r.maxHp, r.hp + rec.add);
          r.buffs = r.buffs.filter(b => b.stat !== "hp");
        }
        if (r.hp < 0) r.hp = 0;
      }

      // ---- lane drift (visual, and how traffic resolves) ----
      if (r.blocked && Math.abs(r.lane - r.targetLane) < 0.05) {
        r.targetLane = clamp(r.lane + (r._rng() < 0.5 ? -1 : 1), 0, S.laneCount - 1);
      }
      r.lane += clamp(r.targetLane - r.lane, -1.1 * dt, 1.1 * dt);

      // ---- advance ----
      r.pos += r.v * dt;
      if (r.pos >= course.distance) {
        r.pos = course.distance; r.finished = true; r.finishT = S.t;
      }
    }

    S.t += dt;
    resolvePending(S);

    const justDone = S.racers.filter(r => r.finished && r.rank === null)
                             .sort((a, b) => a.finishT - b.finishT);
    for (const r of justDone) r.rank = ++S.finishedCount;

    S.over = S.racers.every(r => r.finished) || S.t > 400;
    return S;
  }

  // ---- public api ------------------------------------------------------
  function createRace(defs, course, seed) {
    const S = {
      course, t: 0, over: false, finishedCount: 0,
      laneCount: Math.max(4, defs.length),
      events: [],
      racers: defs.map((d, i) => makeRacer(d, course, mulberry32((seed + i * 7919) >>> 0))),
      rng: mulberry32(seed >>> 0),
    };
    /* The gate draw. As in the real game, which stall each runner starts from is drawn at
       random for every race -- not her place in the entry list, which put the player's
       racer (always entered first) on the rail every time. Stall 1 is the inside lane.
       Its own generator, so the draw does not shift anything else the seed decides. */
    const draw = mulberry32((seed ^ 0x5bd1e995) >>> 0), stalls = S.racers.map((_, i) => i);
    for (let i = stalls.length - 1; i > 0; i--) {
      const j = Math.floor(draw() * (i + 1));
      [stalls[i], stalls[j]] = [stalls[j], stalls[i]];
    }
    S.racers.forEach((r, i) => { r.lane = r.targetLane = stalls[i]; r.gate = stalls[i] + 1; });
    return S;
  }

  const applyBuff = (r, buff) => r.buffs.push(buff);

  const standings = S => [...S.racers].sort((a, b) =>
    (b.finished - a.finished) || (a.finished ? a.finishT - b.finishT : b.pos - a.pos));

  function runToEnd(S, dt) {
    dt = dt || 0.05;
    let guard = 0;
    while (!S.over && guard++ < 20000) step(S, dt);
    return S;
  }

  const api = { STYLES, APT, DIST_CLASS, GROUND, createRace, step, runToEnd, standings,
                applyBuff, baseTargetSpeed, phaseOf, mulberry32, rankOf, schedule,
                racerAhead };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Sim = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
