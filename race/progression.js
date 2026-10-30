/*
 * Racer progression: levels, stat growth, and passives.
 *
 * Pure functions -- given a base racer definition and a saved {level, xp}, produce the
 * racer as they currently are. Storage is the UI's problem, so this stays testable and
 * the sim never has to know a save file exists.
 *
 * Passives resolve into a flat `mods` object that sim.js and ai.js read. Adding a
 * passive means adding an entry here and one hook wherever it applies.
 */
(function (root) {
  "use strict";

  const MAX_LEVEL = 40;
  const STAT_PER_LEVEL = 9;      // before growth rate; ~+260 on an A-growth stat by L30
  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;

  /* XP needed to go from L to L+1. Gentle curve: a racer improves noticeably over the
     first handful of races and then settles into slower gains. */
  const xpToNext = lvl => Math.round(90 + Math.pow(lvl, 1.55) * 26);

  function totalXpFor(level) {
    let t = 0;
    for (let l = 1; l < level; l++) t += xpToNext(l);
    return t;
  }

  /* XP from a race. Finishing is worth something; winning a long race is worth more. */
  function xpForResult(rank, fieldSize, course) {
    const placing = clamp((fieldSize - rank + 1) / fieldSize, 0, 1);
    const trip = 0.75 + course.distance / 4000;
    return Math.round((28 + 88 * Math.pow(placing, 2.1)) * trip);
  }

  function applyXp(save, gained) {
    let { level, xp } = { level: save.level || 1, xp: save.xp || 0 };
    xp += gained;
    const levelsGained = [];
    while (level < MAX_LEVEL && xp >= xpToNext(level)) {
      xp -= xpToNext(level);
      level++;
      levelsGained.push(level);
    }
    if (level >= MAX_LEVEL) xp = 0;
    return { level, xp, levelsGained };
  }

  // ---- passives --------------------------------------------------------
  /* `apply` mutates the shared mods object. Keep each one to a single lever so the
     interactions stay predictable. */
  const PASSIVES = {
    iron_lungs:    { name: "Iron Lungs",     text: "+10% stamina pool.",
                     apply: m => { m.maxHpMul *= 1.10; } },
    economy:       { name: "Economy",        text: "-8% stamina burn at any pace.",
                     apply: m => { m.drainMul *= 0.92; } },
    fast_break:    { name: "Fast Break",     text: "+25% acceleration out of the gate.",
                     apply: m => { m.openAccelMul *= 1.25; } },
    closers_kick:  { name: "Closer's Kick",  text: "+4% pace through the final phase.",
                     apply: m => { m.finalPaceMul *= 1.04; } },
    rail_runner:   { name: "Rail Runner",    text: "Cannot be boxed in during the final phase.",
                     apply: m => { m.ignoreTrafficFinal = true; } },
    second_wind:   { name: "Second Wind",    text: "Once per race, recover 12% on first dropping below a quarter.",
                     apply: m => { m.secondWind = Math.max(m.secondWind, 0.12); } },
    deep_reserves: { name: "Deep Reserves",  text: "+3 spirit over the race — roughly one extra card.",
                     apply: m => { m.spirit += 3; } },
    cool_head:     { name: "Cool Head",      text: "Halves this racer's misjudgement of the race.",
                     apply: m => { m.biasMul *= 0.5; } },
    front_heart:   { name: "Front Runner's Heart", text: "+5% pace while leading the field.",
                     apply: m => { m.leadPaceMul *= 1.05; } },
    mud_lover:     { name: "Mud Lover",      text: "+6% pace on dirt.",
                     apply: m => { m.dirtPaceMul *= 1.06; } },
  };

  /* Passives are NOT unlocked by levelling. Levels come only from finishing careers,
     which makes them slow and guaranteed; passives come from pulling a duplicate of
     the racer in the scout, which makes them a grind you can choose to chase. One
     duplicate unlocks one passive, in the order the racer lists them. */
  const PASSIVE_SLOTS = 3;

  function emptyMods() {
    return {
      maxHpMul: 1, drainMul: 1, openAccelMul: 1, finalPaceMul: 1,
      leadPaceMul: 1, dirtPaceMul: 1, spirit: 0, biasMul: 1,
      ignoreTrafficFinal: false, secondWind: 0,
    };
  }

  /** The first `count` of this racer's passives -- one per duplicate pulled. */
  function unlockedPassives(def, count) {
    return (def.passives || []).slice(0, clamp(count || 0, 0, PASSIVE_SLOTS));
  }

  function modsFor(def, count) {
    const m = emptyMods();
    for (const key of unlockedPassives(def, count)) {
      const p = PASSIVES[key];
      if (p) p.apply(m);
    }
    return m;
  }

  function statsFor(def, level) {
    const g = def.growth || {};
    const out = {};
    for (const k of ["speed", "stamina", "power", "guts", "wit"]) {
      const gain = Math.round(STAT_PER_LEVEL * (g[k] != null ? g[k] : 1) * (level - 1));
      out[k] = clamp(def.stats[k] + gain, 1, 1600);
    }
    return out;
  }

  /**
   * The racer as they currently are: base definition + level growth + passive mods.
   * Feed the result straight to Sim.createRace.
   */
  function build(def, save) {
    const level = clamp((save && save.level) || 1, 1, MAX_LEVEL);
    // `passives` is a count of duplicates spent, not a level threshold
    const owned = clamp((save && save.passives) || 0, 0, PASSIVE_SLOTS);
    const mods = modsFor(def, owned);
    return Object.assign({}, def, {
      level,
      stats: statsFor(def, level),
      mods,
      passiveBonus: { spirit: mods.spirit },
      unlocked: unlockedPassives(def, owned),
    });
  }

  const api = { MAX_LEVEL, STAT_PER_LEVEL, PASSIVE_SLOTS, PASSIVES,
                xpToNext, totalXpFor, xpForResult, applyXp,
                unlockedPassives, modsFor, statsFor, emptyMods, build };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Progress = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
