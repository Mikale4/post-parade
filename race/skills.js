/*
 * Skills -- what career skill points actually buy.
 *
 * Modelled on the real game's system (umamusu.wiki/Game:Skills):
 *   - bought with SP between turns, never costing a turn
 *   - a skill must be AVAILABLE before it can be bought: either it naturally suits the
 *     trainee, or a hint has turned up for it during the run
 *   - every hint knocks ~8% off the price, to a floor of 40% off
 *   - passive skills add flat stats at the gate, and are allowed to push past the
 *     scenario stat cap -- they are not career training
 *   - finishing badly can saddle a trainee with a DETRIMENTAL skill, and the only way
 *     to be rid of it is to spend SP
 *
 * Skills are not deck cards. Nobody plays them: they arm a condition and fire on their
 * own, exactly like a unique, and they reuse Uniques.matches so there is one trigger
 * language in the game rather than two.
 *
 * Pure logic, no DOM. Depends on Sim and Uniques. Exposes Skills.
 */
(function (root) {
  "use strict";

  const Sim = typeof require !== "undefined" ? require("./sim.js") : root.Sim;
  const Uniques = typeof require !== "undefined" ? require("./uniques.js") : root.Uniques;

  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;

  /* Hints. Each one is ~8% off, and the discount stops at 40% -- past that a skill
     costs so little that saving SP stops being a decision. */
  const HINT_STEP = 0.08;
  const HINT_MAX = 0.40;

  /* `icon` names a glyph in icons.js and `color` is the badge it sits on, so a type reads
     the same everywhere it is shown. */
  const TYPES = {
    speed:    { name: "Speed",        icon: "chevrons", color: "#e0821a", text: "Raises her pace when it fires." },
    accel:    { name: "Acceleration", icon: "surge",    color: "#d6303c", text: "A short, sharp surge." },
    recovery: { name: "Recovery",     icon: "cross",    color: "#2f9a4a", text: "Gives her stamina back." },
    gate:     { name: "Starting Gate",icon: "stalls",   color: "#6b5a9a", text: "A cleaner break from the gate." },
    lane:     { name: "Lane Change",  icon: "swap",     color: "#2f8fb0", text: "Finds a way out of traffic." },
    vision:   { name: "Observation",  icon: "eye",      color: "#2f6fd0", text: "Reads the race better." },
    passive:  { name: "Passive",      icon: "starg",    color: "#b98400", text: "A flat stat gain at the gate." },
    debuff:   { name: "Debuff",       icon: "down",     color: "#5a2a4a", text: "Slows the racer in front." },
  };

  const RARITY = {
    normal: { name: "Normal", mul: 1.00 },
    rare:   { name: "Rare",   mul: 1.00 },
    gold:   { name: "Gold",   mul: 1.00 },
  };

  /* ---------------------------------------------------------------- catalogue
     `fit` is natural availability -- a skill she can buy without ever seeing a hint,
     because it suits how she runs. Anything outside her fit needs a hint first.
     `when` reuses the unique-skill trigger language (see uniques.js).
     Costs are tuned against measured SP income; see validate-skills.js. */
  const SKILLS = [
    // ---- Speed: the bread and butter, one per phase and running style
    { id: "sk_earlypace", name: "Settle In", type: "speed", rarity: "normal", cost: 90,
      text: "Opening phase: finds a comfortable rhythm.",
      when: { phase: 0, fracMin: 0.10 }, effects: [{ t: "speed", amount: 0.06, dur: 12 }],
      fit: { style: ["front", "pace"] } },
    { id: "sk_midsurge", name: "Second Gear", type: "speed", rarity: "normal", cost: 105,
      text: "Middle phase: lifts her pace through the back straight.",
      when: { phase: 1, fracMin: 0.40 }, effects: [{ t: "speed", amount: 0.08, dur: 12 }],
      fit: { style: ["pace", "late"] } },
    { id: "sk_homestretch", name: "Home Straight", type: "speed", rarity: "normal", cost: 120,
      text: "Final phase: one more push for the line.",
      when: { phase: 2, fracMin: 0.80 }, effects: [{ t: "speed", amount: 0.10, dur: 8 }],
      fit: {} },
    { id: "sk_frontrun", name: "Clear Ahead", type: "speed", rarity: "rare", cost: 175,
      text: "Leading in the middle phase: nobody to look at but the track.",
      when: { phase: 1, leading: true }, effects: [{ t: "speed", amount: 0.11, dur: 14 }],
      fit: { style: ["front"] } },
    { id: "sk_chasedown", name: "Run Them Down", type: "speed", rarity: "rare", cost: 180,
      text: "Final phase from off the pace.",
      when: { phase: 2, rankWorse: 4 }, effects: [{ t: "speed", amount: 0.14, dur: 9 }],
      fit: { style: ["late", "ender"] } },
    { id: "sk_lastgasp", name: "Line Call", type: "gold", rarity: "gold", cost: 260,
      text: "Inside the last stretch and in the first three: the winning move.",
      when: { phase: 2, fracMin: 0.90, rankBetter: 3 },
      effects: [{ t: "speed", amount: 0.18, dur: 6 }], fit: {} },

    // ---- Acceleration: short, sharp, and about position rather than top speed
    { id: "sk_kick", name: "Quick Kick", type: "accel", rarity: "normal", cost: 100,
      text: "Final phase: a sudden change of gear.",
      when: { phase: 2, fracMin: 0.70 }, effects: [{ t: "speed", amount: 0.16, dur: 4 }],
      fit: { style: ["late", "ender"] } },
    { id: "sk_corner", name: "Off the Turn", type: "accel", rarity: "normal", cost: 95,
      text: "Middle phase: quickens coming off the bend.",
      when: { phase: 1, fracMin: 0.55 }, effects: [{ t: "speed", amount: 0.13, dur: 5 }],
      fit: { style: ["pace", "late"] } },
    { id: "sk_breakaway", name: "Break Away", type: "accel", rarity: "rare", cost: 190,
      text: "Leading in the final phase: kicks clear of the chasers.",
      when: { phase: 2, leading: true }, effects: [{ t: "speed", amount: 0.17, dur: 6 }],
      fit: { style: ["front"] } },
    { id: "sk_swoop", name: "Wide Swoop", type: "accel", rarity: "gold", cost: 275,
      text: "Final phase, back half of the field: comes around them all.",
      when: { phase: 2, rankWorse: 5 },
      effects: [{ t: "speed", amount: 0.20, dur: 7 }, { t: "unblock", dur: 7 }],
      fit: { style: ["ender"] } },

    // ---- Recovery: the stayer's answer, and the long-trip insurance
    { id: "sk_breather", name: "Catch a Breath", type: "recovery", rarity: "normal", cost: 110,
      text: "Middle phase: eases off just long enough to recover.",
      when: { phase: 1, fracMin: 0.35 }, effects: [{ t: "heal", amount: 0.10 }],
      fit: { dist: ["medium", "long"] } },
    { id: "sk_economy", name: "Measured Effort", type: "recovery", rarity: "normal", cost: 115,
      text: "Middle phase: burns noticeably less for a while.",
      when: { phase: 1 }, effects: [{ t: "drain", amount: -0.30, dur: 18 }],
      fit: { style: ["front", "pace"] } },
    { id: "sk_deepwell", name: "Deep Well", type: "recovery", rarity: "rare", cost: 185,
      text: "Below a third of her reserves: finds more than she had.",
      when: { hpBelow: 0.34 }, effects: [{ t: "heal", amount: 0.16 }],
      fit: { dist: ["long"] } },
    { id: "sk_ironwill", name: "Iron Will", type: "recovery", rarity: "gold", cost: 270,
      text: "Final phase on empty: refuses to stop.",
      when: { phase: 2, hpBelow: 0.18 },
      effects: [{ t: "heal", amount: 0.14 }, { t: "speed", amount: 0.10, dur: 8 }],
      fit: { dist: ["medium", "long"] } },

    // ---- Gate, lane and vision: passive mods rather than timed triggers
    { id: "sk_gate", name: "Clean Break", type: "gate", rarity: "normal", cost: 85,
      text: "Leaves the gate faster.", mods: { openAccelMul: 1.22 }, fit: {} },
    { id: "sk_gate2", name: "Gate Sense", type: "gate", rarity: "rare", cost: 165,
      text: "A markedly better start.", mods: { openAccelMul: 1.45 },
      fit: { style: ["front", "pace"] } },
    { id: "sk_lane", name: "Find a Gap", type: "lane", rarity: "normal", cost: 100,
      text: "Cannot be boxed in through the final phase.",
      mods: { ignoreTrafficFinal: true }, fit: { style: ["late", "ender"] } },
    { id: "sk_vision", name: "Read the Race", type: "vision", rarity: "normal", cost: 105,
      text: "Halves how badly she misjudges the race.",
      mods: { biasMul: 0.5 }, fit: {} },
    { id: "sk_vision2", name: "Cool Head", type: "vision", rarity: "rare", cost: 170,
      text: "Judges the race almost perfectly, and holds two more spirit.",
      mods: { biasMul: 0.25, spirit: 2 }, fit: {} },

    // ---- Passive stats. These add at the gate, so they push past the career cap.
    { id: "sk_pspeed", name: "Natural Pace", type: "passive", rarity: "normal", cost: 120,
      text: "+40 speed at the gate.", stats: { speed: 40 }, fit: {} },
    { id: "sk_pstam", name: "Lung Capacity", type: "passive", rarity: "normal", cost: 120,
      text: "+40 stamina at the gate.", stats: { stamina: 40 }, fit: {} },
    { id: "sk_ppow", name: "Strong Frame", type: "passive", rarity: "normal", cost: 120,
      text: "+40 power at the gate.", stats: { power: 40 }, fit: {} },
    { id: "sk_pguts", name: "Stubborn Streak", type: "passive", rarity: "normal", cost: 115,
      text: "+40 guts at the gate.", stats: { guts: 40 }, fit: {} },
    { id: "sk_pwit", name: "Race Sense", type: "passive", rarity: "normal", cost: 125,
      text: "+40 wit at the gate.", stats: { wit: 40 }, fit: {} },
    { id: "sk_allround", name: "All-Rounder", type: "passive", rarity: "rare", cost: 210,
      text: "+25 to every stat at the gate.",
      stats: { speed: 25, stamina: 25, power: 25, guts: 25, wit: 25 }, fit: {} },
    { id: "sk_bigheart", name: "Big Heart", type: "passive", rarity: "gold", cost: 290,
      text: "+80 stamina and a tenth more in reserve.",
      stats: { stamina: 80 }, mods: { maxHpMul: 1.10 }, fit: { dist: ["medium", "long"] } },

    // ---- Debuffs: aimed at whoever is directly in front
    { id: "sk_pressure", name: "Apply Pressure", type: "debuff", rarity: "normal", cost: 110,
      text: "Middle phase: makes the racer ahead work harder.",
      when: { phase: 1, fracMin: 0.45 }, target: "ahead",
      effects: [{ t: "drain", amount: 0.35, dur: 12 }], fit: { style: ["pace", "late"] } },
    { id: "sk_hound", name: "Hound Them", type: "debuff", rarity: "rare", cost: 180,
      text: "Final phase: takes the run out of the racer in front.",
      when: { phase: 2, fracMin: 0.72 }, target: "ahead",
      effects: [{ t: "speed", amount: -0.09, dur: 8 }], fit: { style: ["late", "ender"] } },
    { id: "sk_shadow", name: "Cast a Shadow", type: "debuff", rarity: "gold", cost: 265,
      text: "Final phase: the leader feels her coming and folds.",
      when: { phase: 2, rankWorse: 2 }, target: "leader",
      effects: [{ t: "speed", amount: -0.11, dur: 9 }, { t: "drain", amount: 0.30, dur: 9 }],
      fit: { style: ["ender"] } },

    // ---- Surface and trip specialists: cheap, but only for the right racer
    { id: "sk_mud", name: "Mud Runner", type: "passive", rarity: "normal", cost: 100,
      text: "+6% pace on dirt.", mods: { dirtPaceMul: 1.06 }, fit: { surface: "dirt" } },
    { id: "sk_sprintburst", name: "Sprinter's Burst", type: "speed", rarity: "rare", cost: 170,
      text: "Sprint trips only: a devastating turn of foot.",
      when: { phase: 2, distMax: 1400 }, effects: [{ t: "speed", amount: 0.16, dur: 7 }],
      fit: { dist: ["sprint"] } },
    { id: "sk_stayer", name: "Stayer's Heart", type: "speed", rarity: "rare", cost: 175,
      text: "Long trips only: still going when the others are not.",
      when: { phase: 2, distMin: 2600 },
      effects: [{ t: "speed", amount: 0.12, dur: 12 }, { t: "drain", amount: -0.25, dur: 12 }],
      fit: { dist: ["long"] } },
  ];

  const byId = {};
  for (const s of SKILLS) byId[s.id] = s;

  /* ---------------------------------------------------------------- detrimentals
     Picked up by finishing badly. They cost SP to shed, which is the second sink on
     skill points and makes a bad race sting beyond the fan count. */
  const DETRIMENTS = [
    { id: "dt_slow", name: "Lost Confidence", cost: 80,
      text: "-30 speed at the gate.", stats: { speed: -30 } },
    { id: "dt_gate", name: "Gate Shy", cost: 75,
      text: "A poor break from the gate.", mods: { openAccelMul: 0.80 } },
    { id: "dt_puff", name: "Short of Wind", cost: 90,
      text: "Burns 12% more stamina all race.", mods: { drainMul: 1.12 } },
    { id: "dt_panic", name: "Rattled", cost: 85,
      text: "Misjudges the race far more often.", mods: { biasMul: 1.8 } },
  ];
  const detrimentById = {};
  for (const d of DETRIMENTS) detrimentById[d.id] = d;

  // ---------------------------------------------------------------- availability
  /** Does this skill suit her naturally? An empty `fit` suits everyone. */
  function suits(skill, state) {
    const f = skill.fit || {};
    if (!f.style && !f.dist && !f.surface) return true;
    if (f.style && f.style.indexOf(state.style) >= 0) return true;
    if (f.dist) {
      const apt = (state.aptitude || {});
      for (const d of f.dist) if ("SAB".indexOf(apt[d]) >= 0) return true;
    }
    if (f.surface && "SAB".indexOf((state.aptitude || {})[f.surface]) >= 0) return true;
    return false;
  }

  const hintsOn = (state, id) => (state.hints || {})[id] || 0;
  const owns = (state, id) => (state.skills || []).indexOf(id) >= 0;

  /** Available to buy: suits her, or a hint has turned up. Already-owned are excluded. */
  const isAvailable = (state, skill) =>
    !owns(state, skill.id) && (suits(skill, state) || hintsOn(state, skill.id) > 0);

  /** Price after hint discounts. */
  function costFor(state, skill) {
    const off = Math.min(HINT_MAX, hintsOn(state, skill.id) * HINT_STEP);
    return Math.max(10, Math.round(skill.cost * (1 - off)));
  }

  /** Everything she could buy right now, cheapest first, with prices resolved. */
  function shop(state) {
    return SKILLS.filter(s => isAvailable(state, s))
      .map(s => ({ skill: s, cost: costFor(state, s), hints: hintsOn(state, s.id),
                   discount: Math.min(HINT_MAX, hintsOn(state, s.id) * HINT_STEP),
                   afford: state.skillPoints >= costFor(state, s) }))
      .sort((a, b) => a.cost - b.cost);
  }

  /** Skills she already has, in purchase order. */
  const owned = state => (state.skills || []).map(id => byId[id]).filter(Boolean);
  const heldDetriments = state =>
    (state.detriments || []).map(id => detrimentById[id]).filter(Boolean);

  // ---------------------------------------------------------------- buying
  function buy(state, id) {
    const skill = byId[id];
    if (!skill) return { ok: false, error: "No such skill." };
    if (owns(state, id)) return { ok: false, error: "She already knows that." };
    if (!isAvailable(state, skill))
      return { ok: false, error: "Not available yet -- she needs a hint for it." };
    const cost = costFor(state, skill);
    if (state.skillPoints < cost)
      return { ok: false, error: `Needs ${cost} SP and she has ${state.skillPoints}.` };
    state.skillPoints -= cost;
    (state.skills = state.skills || []).push(id);
    return { ok: true, skill, cost };
  }

  /** Shedding a detrimental is a purchase like any other. */
  function clearDetriment(state, id) {
    const d = detrimentById[id];
    if (!d) return { ok: false, error: "No such condition." };
    const i = (state.detriments || []).indexOf(id);
    if (i < 0) return { ok: false, error: "She does not have that." };
    if (state.skillPoints < d.cost)
      return { ok: false, error: `Needs ${d.cost} SP and she has ${state.skillPoints}.` };
    state.skillPoints -= d.cost;
    state.detriments.splice(i, 1);
    return { ok: true, detriment: d, cost: d.cost };
  }

  // ---------------------------------------------------------------- hints
  /**
   * Drop a hint. Hints are what open up skills outside her natural fit, and each one
   * makes the skill cheaper -- so a run slowly reveals its own options.
   * `rnd` is the career's own seeded stream, so hints replay identically.
   */
  function addHint(state, id) {
    if (!byId[id]) return null;
    state.hints = state.hints || {};
    if (owns(state, id)) return null;
    state.hints[id] = (state.hints[id] || 0) + 1;
    return { id, skill: byId[id], hints: state.hints[id] };
  }

  /** A hint for something she cannot already buy, weighted toward what suits her. */
  function rollHint(state, rnd) {
    const pool = SKILLS.filter(s => !owns(state, s.id));
    if (!pool.length) return null;
    // two thirds of the time, offer something that fits how she runs
    const fitting = pool.filter(s => suits(s, state));
    const from = (fitting.length && rnd() < 0.66) ? fitting : pool;
    return addHint(state, from[Math.floor(rnd() * from.length) % from.length].id);
  }

  /** After a bad race, she may pick something up. Mirrors the real 6th-or-worse rule. */
  function rollDetriment(state, placing, rnd) {
    if (placing < 6) return null;
    if (rnd() > 0.35) return null;
    state.detriments = state.detriments || [];
    const pool = DETRIMENTS.filter(d => state.detriments.indexOf(d.id) < 0);
    if (!pool.length) return null;
    const d = pool[Math.floor(rnd() * pool.length) % pool.length];
    state.detriments.push(d.id);
    return d;
  }

  // ---------------------------------------------------------------- race time
  /**
   * Fold purchased skills into the racer definition handed to the sim: flat stats and
   * passive mods are applied here, and timed skills are attached for `check` to fire.
   * Detrimentals go through the same path with the opposite sign.
   */
  /* The full mods shape the simulation expects. It must be complete: sim.js only falls
     back to its own defaults when `def.mods` is absent entirely, so handing it a
     half-filled object multiplies against undefined and NaNs the racer's stamina pool. */
  const emptyMods = () => ({
    maxHpMul: 1, drainMul: 1, openAccelMul: 1, finalPaceMul: 1, leadPaceMul: 1,
    dirtPaceMul: 1, spirit: 0, biasMul: 1, ignoreTrafficFinal: false, secondWind: 0,
  });

  function applyToDef(def, state) {
    const out = Object.assign({}, def);
    out.stats = Object.assign({}, def.stats);
    const mods = Object.assign(emptyMods(), def.mods || {});
    const timed = [];

    const apply = entry => {
      if (entry.stats)
        for (const k in entry.stats)
          out.stats[k] = Math.max(1, (out.stats[k] || 0) + entry.stats[k]);
      if (entry.mods)
        for (const k in entry.mods) {
          const v = entry.mods[k];
          if (typeof v === "boolean") mods[k] = v;
          else if (k === "spirit") mods[k] = (mods[k] || 0) + v;
          else mods[k] = (mods[k] == null ? 1 : mods[k]) * v;
        }
      if (entry.when && entry.effects) timed.push(entry);
    };

    for (const s of owned(state)) apply(s);
    for (const d of heldDetriments(state)) apply(d);

    out.mods = mods;
    out.skills = timed;
    return out;
  }

  /** Attach per-race skill state. Call after createRace, alongside Uniques.arm. */
  function arm(S, defs) {
    const byRacer = {};
    for (const d of defs) byRacer[d.id] = d.skills || [];
    for (const r of S.racers) {
      r.skills = byRacer[r.id] || [];
      r.skillFired = {};
    }
  }

  /** Whichever racer a debuff should land on. */
  function targetOf(S, r, which) {
    if (which === "leader") {
      let best = null;
      for (const o of S.racers) if (!o.finished && (!best || o.pos > best.pos)) best = o;
      return best && best !== r ? best : null;
    }
    // "ahead": the racer directly in front on the track
    let best = null;
    for (const o of S.racers) {
      if (o === r || o.finished || o.pos <= r.pos) continue;
      if (!best || o.pos < best.pos) best = o;
    }
    return best;
  }

  /**
   * Fire any skill whose condition is met. Each fires once per race, like a unique.
   * Returns events so the UI can announce them.
   */
  function check(S, course) {
    const events = [];
    for (const r of S.racers) {
      if (r.finished || !r.skills || !r.skills.length) continue;
      for (const sk of r.skills) {
        if (r.skillFired[sk.id]) continue;
        if (!Uniques.matches(sk.when, r, S, course)) continue;
        r.skillFired[sk.id] = true;

        const victim = sk.target ? targetOf(S, r, sk.target) : null;
        if (sk.target && !victim) { r.skillFired[sk.id] = false; continue; }
        const on = victim || r;

        for (const e of sk.effects) {
          switch (e.t) {
            case "heal":
              on.hp = Math.min(on.maxHp, on.hp + on.maxHp * e.amount);
              if (on.hp > 0) on.exhausted = false;
              break;
            case "speed":
              Sim.applyBuff(on, { stat: "speed", amount: e.amount, mul: true,
                                  until: S.t + e.dur, label: sk.name });
              break;
            case "drain":
            case "accel":            // an inherited acceleration unique
              Sim.applyBuff(on, { stat: e.t, amount: e.amount, mul: true,
                                  until: S.t + e.dur, label: sk.name });
              break;
            case "unblock":
              Sim.applyBuff(on, { stat: "unblock", amount: 1, mul: false,
                                  until: S.t + e.dur, label: "Clear" });
              break;
          }
        }
        events.push({ racer: r, skill: sk, target: victim });
      }
    }
    return events;
  }

  const api = { SKILLS, DETRIMENTS, TYPES, RARITY, byId, detrimentById,
                HINT_STEP, HINT_MAX, emptyMods,
                suits, isAvailable, costFor, shop, owned, heldDetriments, hintsOn, owns,
                buy, clearDetriment, addHint, rollHint, rollDetriment,
                applyToDef, arm, check, targetOf };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Skills = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
