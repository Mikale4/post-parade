/*
 * Unique skills -- a racer's signature ability.
 *
 * These are not deck cards. Nobody chooses them and nobody triggers them: each racer
 * has exactly one, it fires at most once per race, and only when that racer's own
 * situation matches. They are deliberately stronger than anything in the card pool,
 * because they are the character rather than the loadout.
 *
 * Every racer carries her real unique from the Global game. tools/genroster.js maps the
 * condition GameTora publishes for it (tools/gametora-launch.json) onto this file's
 * vocabulary field for field, so the trigger here is the one in the game:
 *
 *   when: { phase, fracMin, fracMax, hpBelow, hpAbove, distMin, distMax, surface, style,
 *           rankBetter, rankWorse, rankIs, leading, trailing, pctMax, pctMin,
 *           remainMin, remainMax, zone, passing, passesLate, gapAheadMax, gapBehindMax,
 *           gapBehindMin, closing, duel, blocked, nearCount, spreadMax, spurting, randomMid }
 *
 * An array of blocks means any one of them (the game's "@"). A unique may also carry
 * `groups`, tried in order -- the game's alternative condition groups, such as McQueen's
 * stronger long-distance version. A group's `pre` has to have held at some earlier
 * moment before its `when` is looked at (Teio has to have been closing on someone before
 * the final straight counts), and a `follow` group is a second activation that can only
 * come after the first (Silence Suzuka's). Without `groups`, `when` + `effects` is the
 * one group.
 *
 * Durations are per 1000 m, as in the game: a 5-second skill lasts 8 s over a mile and
 * 12 s over 2400 m.
 *
 * Depends on Sim. Exposes Uniques.
 */
(function (root) {
  "use strict";

  const Sim = typeof require !== "undefined" ? require("./sim.js") : root.Sim;

  /* The course every race is run on, as voxel.js builds it: a 520 m home straight with
     the finish 80% of the way down it, and a half-lap bend either end (radius 150 m on
     turf, 122 m on dirt). The sim itself is only distance; this is what lets "the final
     corner" and "the final straight" mean the same metres the camera is showing. */
  const TRACK = { straight: 520, finishInto: 416, R: { turf: 150, dirt: 122 } };
  const LENGTH = 2.5;            // one length (bashin), for the gap conditions

  function zoneOf(course, pos) {
    const remain = course.distance - pos;
    const bend = Math.PI * (TRACK.R[course.surface] || TRACK.R.turf);
    const lap = 2 * TRACK.straight + 2 * bend;
    let s = (TRACK.finishInto - remain) % lap;           // 0 = start of the home straight
    if (s < 0) s += lap;
    const corner = (s >= TRACK.straight && s < TRACK.straight + bend) || s >= 2 * TRACK.straight + bend;
    return {
      remain, corner,
      lastStraight: remain <= TRACK.finishInto,
      finalCorner: remain > TRACK.finishInto && remain <= TRACK.finishInto + bend,
      finalCornerLate: remain > TRACK.finishInto && remain <= TRACK.finishInto + bend / 2,
      finalOn: remain <= TRACK.finishInto + bend,            // the final corner, or later
    };
  }

  /* The game's absolute places ("5th or better", "3rd or worse") are written for its
     18-runner fields; ours run 8 to 11. A place is scaled to the same share of this
     field -- never past 2nd, so "not in front" keeps its meaning, and never looser than
     the original. Exact places (Nice Nature's 3rd) are hers and are left alone. */
  const FULL_FIELD = 18;
  const fieldRank = (k, N) => k <= 1 ? k : Math.min(k, Math.max(2, Math.ceil(k * N / FULL_FIELD)));
  const fieldCount = (k, N) => Math.max(1, Math.min(k, Math.ceil(k * N / FULL_FIELD)));

  /* Shut in: someone right in front, in her lane or the next one in. The sim stops
     resolving traffic once a racer is in her spurt (and stops changing lanes with it),
     so its own `blocked` flag cannot answer this late in a race. */
  function boxedIn(S, r) {
    for (const o of S.racers) {
      if (o === r || o.finished) continue;
      const d = o.pos - r.pos;
      if (d > 0 && d < LENGTH && Math.abs(o.lane - r.lane) <= 1.05) return true;
    }
    return false;
  }

  /** Rank by track position, 1 = in front. Cheap enough to run per racer per tick. */
  function rankOf(S, r) {
    let n = 1;
    for (const o of S.racers) if (o !== r && o.pos > r.pos) n++;
    return n;
  }

  /* Per-race memory the conditions read: who she has passed and when, how long she has
     been locked side by side with someone. Updated every tick for everyone, so purchased
     career skills (which reuse `matches`) can read it too. */
  function track(S, r) {
    const u = r._u || (r._u = { rank: null, passedAt: -99, passesLate: 0, duelT: 0, lastT: S.t, randAt: 0.4 });
    const dt = Math.max(0, S.t - u.lastT);
    u.lastT = S.t;
    const rank = rankOf(S, r);
    if (u.rank != null && rank < u.rank) {
      u.passedAt = S.t;
      if (r.pos / S.course.distance >= 2 / 3) u.passesLate += u.rank - rank;
    }
    u.rank = rank;
    let side = false;
    for (const o of S.racers) {
      if (o === r || o.finished) continue;
      /* locked in a challenge: a rival within a length, alongside or on her heels. The
         game asks for one beside her, but in an 8-runner field that keeps its lanes
         through the spurt, nobody is ever beside anybody for two seconds. */
      if (Math.abs(o.pos - r.pos) < LENGTH) { side = true; break; }
    }
    u.duelT = side ? u.duelT + dt : 0;
  }

  function matches(when, r, S, course) {
    if (!when) return false;
    if (Array.isArray(when)) return when.some(w => matches(w, r, S, course));
    const frac = r.pos / course.distance;
    const hpF = r.hp / r.maxHp;
    const u = r._u || {};

    if (when.phase != null && Sim.phaseOf(frac) !== when.phase) return false;
    if (when.fracMin != null && frac < when.fracMin) return false;
    if (when.fracMax != null && frac > when.fracMax) return false;
    if (when.hpBelow != null && !(hpF < when.hpBelow)) return false;
    if (when.hpAbove != null && !(hpF > when.hpAbove)) return false;
    if (when.distMin != null && course.distance < when.distMin) return false;
    if (when.distMax != null && course.distance > when.distMax) return false;
    if (when.surface && course.surface !== when.surface) return false;
    if (when.style && r.styleKey !== when.style) return false;
    if (when.spurting && !(r.spurting && !r.exhausted)) return false;
    if (when.randomMid && !(Sim.phaseOf(frac) === 1 && frac >= (u.randAt || 0.4))) return false;

    if (when.remainMin != null || when.remainMax != null || when.zone) {
      const z = zoneOf(course, r.pos);
      if (when.remainMin != null && z.remain < when.remainMin) return false;
      if (when.remainMax != null && z.remain > when.remainMax) return false;
      if (when.zone && !(when.zone === "corner" ? z.corner : z[when.zone])) return false;
    }

    if (when.rankBetter != null || when.rankWorse != null || when.rankIs != null ||
        when.leading != null || when.trailing != null || when.pctMax != null || when.pctMin != null) {
      const N = S.racers.length, rank = rankOf(S, r);
      if (when.rankBetter != null && rank > fieldRank(when.rankBetter, N)) return false;
      if (when.rankWorse != null && rank < fieldRank(when.rankWorse, N)) return false;
      if (when.rankIs != null && rank !== when.rankIs) return false;
      if (when.leading === true && rank !== 1) return false;
      if (when.trailing === true && rank <= Math.ceil(N / 2)) return false;
      if (when.pctMax != null || when.pctMin != null) {
        /* A share of the field, as whole places. A band too narrow to hold one (Ryan's
           65-70% in an 8-runner race) means the place nearest its middle. */
        let lo = when.pctMin != null ? Math.ceil(N * when.pctMin / 100 - 1e-9) : 1;
        let hi = when.pctMax != null ? Math.floor(N * when.pctMax / 100 + 1e-9) : N;
        if (lo > hi) lo = hi = Math.round(N * ((when.pctMin || 0) + (when.pctMax || 100)) / 200);
        if (rank < Math.max(1, lo) || rank > Math.max(1, hi)) return false;
      }
    }

    if (when.passing && !(S.t - (u.passedAt == null ? -99 : u.passedAt) <= 1.0)) return false;
    if (when.passesLate != null && (u.passesLate || 0) < fieldCount(when.passesLate, S.racers.length)) return false;
    if (when.duel && !((u.duelT || 0) >= 2)) return false;
    if (when.blocked && !boxedIn(S, r)) return false;

    if (when.gapAheadMax != null || when.gapBehindMax != null || when.gapBehindMin != null ||
        when.nearCount != null || when.spreadMax != null || when.closing) {
      let ahead = Infinity, behind = Infinity, near = 0, lead = r.pos, last = r.pos, closing = false;
      for (const o of S.racers) {
        if (o === r) continue;
        const d = o.pos - r.pos;
        // the game's "overtaking": someone within reach ahead, and she is the faster
        if (d > 0 && d <= 2 * LENGTH && r.v > o.v) closing = true;
        if (d > 0 && d < ahead) ahead = d;
        if (d < 0 && -d < behind) behind = -d;
        if (Math.abs(d) <= 4) near++;
        if (o.pos > lead) lead = o.pos;
        if (o.pos < last) last = o.pos;
      }
      if (when.closing && !closing) return false;
      if (when.gapAheadMax != null && !(ahead <= when.gapAheadMax)) return false;
      if (when.gapBehindMax != null && !(behind <= when.gapBehindMax)) return false;
      if (when.gapBehindMin != null && !(behind >= when.gapBehindMin)) return false;
      if (when.nearCount != null && near < when.nearCount) return false;
      if (when.spreadMax != null && lead > last &&
          (lead - r.pos) / (lead - last) * 100 > when.spreadMax) return false;
    }
    return true;
  }

  const groupsOf = u => u.groups || [{ when: u.when, effects: u.effects }];

  /** Attach per-race trigger state. Call once after createRace. */
  function arm(S, defs) {
    const byId = Object.fromEntries(defs.map(d => [d.id, d]));
    for (const r of S.racers) {
      const d = byId[r.id];
      r.unique = d && d.unique ? d.unique : null;
      r.uniqueFired = false;
      r.uniqueSpent = {};
      r.uniquePre = {};
      r.styleKey = d ? d.style : null;
      r._u = null;
      track(S, r);
      // the "some moment mid-race" a random-point unique is waiting for, fixed per race
      const rnd = r._rng ? r._rng() : Math.random();
      r._u.randAt = 1 / 6 + rnd * (2 / 3 - 1 / 6) * 0.9;
    }
  }

  function apply(S, course, r, g) {
    const km = course.distance / 1000;
    for (const e of g.effects || []) {
      const until = S.t + (e.dur || 0) * km;
      switch (e.t) {
        case "heal":
          r.hp = Math.min(r.maxHp, r.hp + r.maxHp * e.amount);
          if (r.hp > 0) r.exhausted = false;
          break;
        case "speed":
        case "drain":
        case "accel":
          Sim.applyBuff(r, { stat: e.t, amount: e.amount, mul: true, until, label: r.unique.name });
          break;
        case "unblock":
          Sim.applyBuff(r, { stat: "unblock", amount: 1, mul: false, until, label: "Clear" });
          break;
      }
    }
  }

  /**
   * Check every racer. Returns events for any that fired this tick -- only the first
   * activation is an event (it is the cutscene); a follow-up applies quietly.
   * Firing applies the effects immediately, exactly like a card.
   */
  function check(S, course) {
    const events = [];
    for (const r of S.racers) {
      if (r.finished) continue;
      track(S, r);
      if (!r.unique) continue;
      const gs = groupsOf(r.unique);
      gs.forEach((g, i) => {
        if (g.pre && !r.uniquePre[i] && matches(g.pre, r, S, course)) r.uniquePre[i] = true;
      });
      for (let i = 0; i < gs.length; i++) {
        const g = gs[i];
        if (r.uniqueSpent[i]) continue;
        if (g.follow ? !r.uniqueFired : r.uniqueFired) continue;
        if (g.pre && !r.uniquePre[i]) continue;
        if (!matches(g.when, r, S, course)) continue;
        r.uniqueSpent[i] = true;
        apply(S, course, r, g);
        if (!g.follow) {
          r.uniqueFired = true;
          r.uniqueFiredAt = S.t;
          r.uniqueGroup = i;
          events.push({ racer: r, unique: r.unique });
        }
        break;
      }
    }
    return events;
  }

  /**
   * Fire her unique now, whatever its conditions and whether it has fired already: a
   * rivalry's doing (rivals.js). It does not count as a use -- nothing is marked, so a
   * unique she has not used yet can still fire on its own later in the race. Returns the
   * event, or null if she has no unique.
   */
  function force(S, course, r) {
    if (!r.unique) return null;
    const gs = groupsOf(r.unique);
    apply(S, course, r, gs.find(g => !g.follow) || gs[0]);
    return { racer: r, unique: r.unique, forced: true };
  }

  /* The trigger in words, for the glossary and the racer page. One clause per field. */
  const STYLE_NAME = { front: "a front runner", pace: "a pace chaser", late: "a late surger", ender: "an end closer" };
  const ZONE_NAME = { lastStraight: "she is on the final straight", finalCorner: "she is on the final corner",
                      finalCornerLate: "she is in the back half of the final corner", corner: "she is on a corner",
                      finalOn: "she has reached the final corner" };
  function describe(when) {
    if (!when) return [];
    if (Array.isArray(when)) return [when.map(w => describe(w).join(" and ")).join("; or ")];
    const t = [];
    if (when.phase === 2 || (when.fracMin != null && Math.abs(when.fracMin - 2 / 3) < 0.01)) t.push("the race reaches its final third");
    else if (when.phase === 1) t.push("the race is in its middle stretch");
    else if (when.fracMin != null) t.push("she is past " + Math.round(when.fracMin * 100) + "% of the trip");
    if (when.fracMax != null) t.push("she has not yet reached " + Math.round(when.fracMax * 100) + "%");
    if (when.randomMid) t.push("at a chance moment mid-race");
    if (when.zone) t.push(ZONE_NAME[when.zone]);
    if (when.remainMax != null && when.remainMin != null && when.remainMax - when.remainMin < 10)
      t.push("there are " + Math.round((when.remainMax + when.remainMin) / 2) + "m to go");
    else if (when.remainMax != null) t.push("there are " + Math.round(when.remainMax) + "m or less to go");
    if (when.leading) t.push("she is in front");
    if (when.rankIs != null) t.push("she is running " + when.rankIs + ["th", "st", "nd", "rd"][when.rankIs < 4 ? when.rankIs : 0]);
    if (when.rankBetter != null) t.push("she is in the first " + when.rankBetter);
    if (when.rankWorse != null) t.push("she is " + when.rankWorse + ["th", "st", "nd", "rd"][when.rankWorse < 4 ? when.rankWorse : 0] + " or further back");
    if (when.pctMax != null) t.push("she is in the front " + when.pctMax + "% of the field");
    if (when.pctMin != null) t.push("she is in the back " + (100 - when.pctMin) + "% of the field");
    if (when.spreadMax != null) t.push("she is within the leading " + when.spreadMax + "% of the spread");
    if (when.passing) t.push("she has just passed someone");
    if (when.closing) t.push("she is closing on the runner ahead");
    if (when.passesLate != null) t.push("she has passed " + when.passesLate + " runners in the final third");
    if (when.gapAheadMax != null) t.push("she is within a length of the runner ahead");
    if (when.gapBehindMax != null) t.push("someone is within a length behind her");
    if (when.gapBehindMin != null) t.push("she leads by at least a length");
    if (when.duel) t.push("she has been locked side by side with a rival for two seconds");
    if (when.blocked) t.push("her way ahead is shut");
    if (when.nearCount != null) t.push("there is a runner right beside her");
    if (when.spurting) t.push("she is in her full final spurt");
    if (when.hpAbove != null) t.push("she still has over " + Math.round(when.hpAbove * 100) + "% stamina");
    if (when.hpBelow != null) t.push("her stamina is under " + Math.round(when.hpBelow * 100) + "%");
    if (when.distMin != null && when.distMax != null && when.distMin === when.distMax) t.push("the race is " + when.distMin + "m");
    else {
      if (when.distMin != null) t.push("the race is " + when.distMin + "m or longer");
      if (when.distMax != null) t.push("the race is " + when.distMax + "m or shorter");
    }
    if (when.surface) t.push("the ground is " + when.surface);
    if (when.style) t.push("she is running as " + STYLE_NAME[when.style]);
    return t;
  }

  const api = { arm, check, force, matches, rankOf, zoneOf, describe, TRACK };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Uniques = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
