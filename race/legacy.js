/*
 * Legacy -- the inheritance metagame layered over career mode.
 *
 * A finished career does not hand its stats or skills to the next trainee. It rolls
 * SPARKS, and sparks are what descendants inherit:
 *
 *   blue   stats       -- starting stat points
 *   pink   aptitudes   -- distance / surface / running-style grades, raised a step
 *   green  unique      -- a weakened copy of that racer's signature skill
 *   white  skills      -- hints, which our skill shop already understands as both
 *                         "this is now buyable" and "this is cheaper"
 *
 * Inheritance draws on SIX veterans: two parents and their four parents. Affinity
 * between the trainee and that tree scales how much of it lands, so picking the two
 * strongest veterans is not automatically the right call.
 *
 * Pure logic, no DOM. Persisted per account under `postparade.legacy.<accountId>`.
 * Exposes Legacy.
 */
(function (root) {
  "use strict";

  const Career = typeof require !== "undefined" ? require("./career.js") : root.Career;
  const Skills = typeof require !== "undefined" ? require("./skills.js") : root.Skills;

  const STATS = ["speed", "stamina", "power", "guts", "wit"];
  const DISTS = ["sprint", "mile", "medium", "long"];
  const SURFACES = ["turf", "dirt"];
  const STYLES = ["front", "pace", "late", "ender"];
  const GRADES = ["G", "F", "E", "D", "C", "B", "A", "S"];

  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  const now = () => Date.now();

  /* How much one star is worth. Deliberately generous on stats: a specialised line is
     the whole point of the system, and a 9-star speed tree should visibly change how a
     career opens rather than being a rounding error. */
  const STAT_PER_STAR = 12;
  const STARS_PER_GRADE = 3;        // pink stars needed to raise an aptitude one step
  const GREEN_SCALE = 0.6;          // an inherited unique is a weaker copy
  const MAX_SPARKS = 8;             // per veteran, so a card stays readable

  // ---------------------------------------------------------------- sparks
  /** Stars for a finished stat. The thresholds sit near what a good career reaches. */
  function statStars(v) {
    if (v >= 1100) return 3;
    if (v >= 800) return 2;
    if (v >= 550) return 1;
    return 0;
  }
  const gradeIndex = g => Math.max(0, GRADES.indexOf(g));
  function aptStars(grade) {
    const i = gradeIndex(grade);
    if (i >= 7) return 3;            // S
    if (i >= 6) return 2;            // A
    if (i >= 5) return 1;            // B
    return 0;
  }

  /**
   * Roll the sparks a finished career leaves behind. Deterministic given the career's
   * own random stream, so the same run always produces the same veteran.
   */
  function rollSparks(state, def) {
    const rnd = () => Career.rnd(state);
    const out = [];

    // ---- blue: her best stats
    const ranked = STATS.slice().sort((a, b) => state.stats[b] - state.stats[a]);
    for (const k of ranked.slice(0, 2)) {
      const stars = statStars(state.stats[k]);
      if (stars > 0) out.push({ kind: "blue", key: k, stars, label: k });
    }

    // ---- pink: the trip and surface she actually ran, and how she ran it
    const apt = def.aptitude || {};
    const ranDist = Object.keys(state.distCount || {})
      .sort((a, b) => state.distCount[b] - state.distCount[a])[0];
    if (ranDist) {
      const stars = Math.max(1, aptStars(apt[ranDist]));
      out.push({ kind: "pink", group: "dist", key: ranDist, stars, label: Career.DIST_LABEL[ranDist] });
    }
    const ranSurf = (state.surfCount || {}).dirt > (state.surfCount || {}).turf ? "dirt" : "turf";
    if (state.raceHistory.length) {
      const stars = Math.max(1, aptStars(apt[ranSurf]));
      out.push({ kind: "pink", group: "surface", key: ranSurf, stars,
                 label: ranSurf === "dirt" ? "Dirt" : "Turf" });
    }
    if (state.style) {
      out.push({ kind: "pink", group: "style", key: state.style,
                 stars: 1 + (state.finale.won.length >= 1 ? 1 : 0),
                 label: STYLE_LABEL[state.style] || state.style });
    }

    // ---- green: her signature skill, if the run was good enough to be worth passing on
    if (def.unique && (state.finale.won.length || state.raceHistory.some(r => r.placing === 1))) {
      out.push({ kind: "green", key: def.id, stars: state.finale.won.length >= 3 ? 3
                 : state.finale.won.length ? 2 : 1,
                 label: def.unique.name, unique: def.unique });
    }

    // ---- white: learned skills, each with a chance to carry over as a hint
    for (const s of (state.skills || [])) {
      if (out.length >= MAX_SPARKS) break;
      if (rnd() < 0.55) {
        const sk = Skills.byId[s];
        if (sk) out.push({ kind: "white", key: s, stars: rnd() < 0.25 ? 2 : 1, label: sk.name });
      }
    }
    return out.slice(0, MAX_SPARKS);
  }

  const STYLE_LABEL = { front: "Front Runner", pace: "Pace Chaser",
                        late: "Late Surger", ender: "End Closer" };

  // ---------------------------------------------------------------- storage
  const KEY = () => {
    const a = (root.Auth && Auth.current && Auth.current()) ? Auth.current().id : "guest";
    return "postparade.legacy." + a;
  };

  let cache = null, cacheKey = null;

  function load() {
    const k = KEY();
    if (cache && cacheKey === k) return cache;
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(k)); } catch (e) {}
    cache = saved && Array.isArray(saved.veterans) ? saved : { veterans: [], seq: 1 };
    cacheKey = k;
    return cache;
  }
  function save() {
    if (!cache) return;
    try { localStorage.setItem(cacheKey, JSON.stringify(cache)); } catch (e) {}
  }
  function reload() { cache = null; cacheKey = null; return load(); }

  const veterans = () => load().veterans.slice().sort((a, b) => b.finished - a.finished);
  const byId = id => load().veterans.find(v => v.id === id) || null;

  /**
   * File a finished career as a veteran. `parents` are the ids this run itself
   * inherited from, which is what makes the tree deepen generation by generation.
   */
  function addVeteran(state, def, parents) {
    const s = load();
    const base = Career.veteran(state);
    const vet = Object.assign({}, base, {
      id: "vet" + (s.seq++) + "_" + (now() % 100000),
      sparks: rollSparks(state, def),
      parents: (parents || []).filter(Boolean).slice(0, 2),
      sprite: state.sprite,
      style: state.style,
      aptitude: def.aptitude,
    });
    s.veterans.unshift(vet);
    if (s.veterans.length > 60) s.veterans.length = 60;    // keep the stable readable
    save();
    return vet;
  }

  function removeVeteran(id) {
    const s = load();
    const i = s.veterans.findIndex(v => v.id === id);
    if (i < 0) return false;
    s.veterans.splice(i, 1);
    save();
    return true;
  }

  // ---------------------------------------------------------------- the tree
  /**
   * The six veterans a pairing actually draws on: two parents and their parents.
   * Grandparents contribute at half weight -- present, but not equal to a parent.
   */
  function tree(parentAId, parentBId) {
    const out = [];
    for (const pid of [parentAId, parentBId]) {
      const p = byId(pid);
      if (!p) continue;
      out.push({ vet: p, weight: 1.0, role: "parent" });
      for (const gid of p.parents || []) {
        const g = byId(gid);
        if (g) out.push({ vet: g, weight: 0.5, role: "grandparent" });
      }
    }
    return out;
  }

  /**
   * Affinity, 0..1. Shared blood counts most, then whether the parents actually ran the
   * way this trainee runs. This is why two strong-but-unrelated veterans can be a worse
   * pairing than a matched line.
   */
  function affinity(def, parentAId, parentBId) {
    const nodes = tree(parentAId, parentBId);
    if (!nodes.length) return 0;

    let score = 0, max = 0;
    /* Shared ancestry: the same racer appearing more than once in the tree. Only counted
       once there are grandparents to share -- otherwise a first-generation pairing is
       measured against a ceiling it cannot reach and every early run reads as a bad
       match no matter how well suited the parents are. */
    const hasGrandparents = nodes.some(n => n.role === "grandparent");
    if (hasGrandparents) {
      const counts = {};
      for (const n of nodes) counts[n.vet.racerId] = (counts[n.vet.racerId] || 0) + 1;
      const shared = Object.values(counts).filter(c => c > 1).length;
      score += Math.min(3, shared) * 1.5;
      max += 4.5;
    }

    for (const n of nodes) {
      max += 3 * n.weight;
      if (n.vet.style === def.style) score += 1.5 * n.weight;
      // did they race the trip this trainee is built for?
      const best = bestAptOf(def);
      if (n.vet.sparks.some(sp => sp.kind === "pink" && sp.key === best)) score += 1.5 * n.weight;
    }
    return clamp(max ? score / max : 0, 0, 1);
  }

  const bestAptOf = def => {
    const apt = def.aptitude || {};
    return DISTS.slice().sort((a, b) => gradeIndex(apt[b]) - gradeIndex(apt[a]))[0];
  };

  /** Affinity as a multiplier on what actually lands: a poor match still gives something. */
  const affinityMul = a => 0.55 + 0.75 * a;

  // ---------------------------------------------------------------- inheritance
  /**
   * Why this veteran cannot be one of the trainee's parents, or null if she can. A racer
   * inherits from someone else: never from a past run of herself, and the two parents are
   * two different racers. `otherId` is the other parent already chosen, if any.
   * (Her grandparents are her parents' business; only the two parents are checked.)
   */
  function parentBlock(def, vetId, otherId) {
    const v = byId(vetId);
    if (!v) return "No such veteran.";
    if (def && v.racerId === def.id) return `${def.name} cannot inherit from herself.`;
    const o = otherId && otherId !== vetId ? byId(otherId) : null;
    if (o && o.racerId === v.racerId) return `${v.name} is already her other parent.`;
    return null;
  }

  /** The parents a pairing may actually use: in order, each allowed against the ones before. */
  function validParents(def, ids) {
    const out = [];
    for (const id of ids || []) {
      if (!id || out.length >= 2) continue;
      if (!parentBlock(def, id, out[0])) out.push(id);
    }
    return out;
  }

  /**
   * Work out what a trainee would inherit from a pairing. Pure -- returns a plan, and
   * `applyToCareer` is what spends it, so the UI can preview before committing. A parent
   * the rules above refuse is dropped here as well, whoever asks.
   */
  function inheritanceFor(def, parentAId, parentBId) {
    [parentAId, parentBId] = validParents(def, [parentAId, parentBId]);
    const nodes = tree(parentAId, parentBId);
    const aff = affinity(def, parentAId, parentBId);
    const mul = affinityMul(aff);

    const blue = {}, pink = {}, hints = {}, greens = [];
    for (const n of nodes) {
      for (const sp of n.vet.sparks || []) {
        const w = sp.stars * n.weight;
        if (sp.kind === "blue") blue[sp.key] = (blue[sp.key] || 0) + w;
        else if (sp.kind === "pink") pink[sp.key] = (pink[sp.key] || 0) + w;
        else if (sp.kind === "white") hints[sp.key] = (hints[sp.key] || 0) + Math.round(w);
        else if (sp.kind === "green" && sp.unique)
          greens.push({ stars: w, unique: sp.unique, from: n.vet.name });
      }
    }

    // blue -> starting stat points
    const stats = {};
    for (const k of STATS) {
      const v = Math.round((blue[k] || 0) * STAT_PER_STAR * mul);
      if (v > 0) stats[k] = v;
    }

    // pink -> aptitude upgrades, one grade per three stars, never past S
    const aptitude = {};
    const apt = def.aptitude || {};
    for (const key in pink) {
      const steps = Math.floor((pink[key] * mul) / STARS_PER_GRADE);
      if (steps <= 0) continue;
      if (DISTS.indexOf(key) < 0 && SURFACES.indexOf(key) < 0) continue;   // style is flavour
      const from = apt[key] || "C";
      const to = GRADES[Math.min(GRADES.length - 1, gradeIndex(from) + steps)];
      if (to !== from) aptitude[key] = { from, to };
    }

    // green -> the strongest inherited unique, weakened
    let unique = null;
    if (greens.length) {
      greens.sort((a, b) => b.stars - a.stars);
      const g = greens[0];
      /* It runs as a career skill, whose durations are plain seconds. A real-game unique
         (it carries `ref`) is timed per 1000 m, so it is set at a 2000 m trip; one saved
         by an older veteran is already in seconds. `when` may be a list of alternatives,
         so it is copied whole rather than spread into an object. */
      const perKm = g.unique.ref != null ? 2 : 1;
      unique = {
        name: g.unique.name + " (Inherited)",
        text: g.unique.text,
        from: g.from,
        when: JSON.parse(JSON.stringify(g.unique.when || {})),
        effects: (g.unique.effects || []).map(e => Object.assign({}, e, {
          amount: e.amount != null ? +(e.amount * GREEN_SCALE).toFixed(3) : e.amount,
          dur: e.dur != null ? +(e.dur * perKm).toFixed(2) : e.dur,
        })),
      };
    }

    return { affinity: aff, mul, stats, aptitude, unique,
             hints, nodes: nodes.length,
             parents: [parentAId, parentBId].filter(Boolean) };
  }

  /** Spend an inheritance plan on a fresh career state. Call right after Career.create. */
  function applyToCareer(state, plan, def) {
    if (!plan) return state;
    for (const k in plan.stats) state.stats[k] += plan.stats[k];

    // aptitude upgrades ride on the career, leaving the roster definition untouched
    state.aptitude = Object.assign({}, def.aptitude);
    for (const k in plan.aptitude) state.aptitude[k] = plan.aptitude[k].to;

    if (plan.unique) state.inheritedUnique = plan.unique;
    state.hints = state.hints || {};
    for (const id in plan.hints)
      state.hints[id] = (state.hints[id] || 0) + plan.hints[id];

    state.legacy = { parents: plan.parents, affinity: plan.affinity };
    /* Inspiration fires later in the run as well as at the start -- see inspirationAt. */
    state.inspirationsLeft = 2;
    return state;
  }

  /* Mid-career inspiration. The real game re-activates the family tree partway through;
     ours pays a smaller version of the same plan at the start of Classic and Senior. */
  const INSPIRATION_TURNS = [24, 48];
  const inspirationAt = turn => INSPIRATION_TURNS.indexOf(turn) >= 0;

  /**
   * Fire an inspiration event. Returns what it gave, or null if there is nothing to give.
   */
  function inspire(state, def) {
    if (!state.legacy || !state.inspirationsLeft) return null;
    const plan = inheritanceFor(def, state.legacy.parents[0], state.legacy.parents[1]);
    state.inspirationsLeft--;

    const gained = { stats: {}, hints: [] };
    for (const k in plan.stats) {
      const v = Math.round(plan.stats[k] * 0.35);
      if (v > 0) { state.stats[k] = Math.min(Career.STAT_CAP, state.stats[k] + v); gained.stats[k] = v; }
    }
    // one fresh hint, weighted toward what the line was built for
    const hint = Skills.rollHint(state, () => Career.rnd(state));
    if (hint) gained.hints.push(hint);
    state.skillPoints += 40;
    gained.skillPoints = 40;
    return gained;
  }

  // ---------------------------------------------------------------- display
  const SPARK_COLOR = { blue: "#4f8fd6", pink: "#e8478f", green: "#57b84a", white: "#b9b4ab" };
  const SPARK_NAME = { blue: "Stat", pink: "Aptitude", green: "Unique", white: "Skill" };

  /** A one-line summary of a veteran's sparks, for cards and lists. */
  const summarise = vet => (vet.sparks || [])
    .map(s => s.label + " " + "★".repeat(s.stars)).join(" · ");

  const api = { STATS, DISTS, SURFACES, STYLES, GRADES, STYLE_LABEL,
                STAT_PER_STAR, STARS_PER_GRADE, GREEN_SCALE,
                SPARK_COLOR, SPARK_NAME, INSPIRATION_TURNS,
                statStars, aptStars, gradeIndex, rollSparks,
                load, save, reload, veterans, byId, addVeteran, removeVeteran,
                tree, affinity, affinityMul, bestAptOf,
                parentBlock, validParents,
                inheritanceFor, applyToCareer, inspirationAt, inspire, summarise };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Legacy = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
