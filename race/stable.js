/*
 * The stable: what a trainer OWNS, and the economy that changes it.
 *
 * A new account starts with 1000 carrots and no racers at all -- the roster is a
 * catalogue of who exists, not a list of who you have. Everything playable is unlocked
 * through this module:
 *   - one starter racer, chosen from five, who arrives with five cards suited to her
 *   - carrots, spent on the racer scout, the card scout, or a stamina refill
 *   - stamina, the mobile-RPG style gate on starting a career or an exhibition race
 *   - tutorials, which pay carrots once each
 *
 * Persisted per account under `postparade.stable.<accountId>`, so two trainers on the
 * same device never see each other's racers. Separate from the race save so the two
 * can be reasoned about independently.
 *
 * Exposes Stable.
 */
(function (root) {
  "use strict";

  /* rosterdata.js is the full catalogue (the 26-racer Global launch roster) plus the unlock tree; roster.js is
     the eleven hand-authored ones and is a subset of it. Fall back to the small roster
     only if the generated file is missing, so the game still boots. */
  const Data   = typeof require !== "undefined" ? require("./rosterdata.js") : root.RosterData;
  const Roster = Data || (typeof require !== "undefined" ? require("./roster.js") : root.Roster);
  const Cards  = typeof require !== "undefined" ? require("./cards.js")  : root.Cards;
  /* ai.js owns the personality table and the spirit economy. Resolved lazily in the
     browser because the module load order puts ai.js after this file. */
  const AI = () => (typeof require !== "undefined" ? require("./ai.js") : root.Racers);
  const UNLOCKS = (Data && Data.UNLOCKS) || {};

  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  const now = () => Date.now();

  // ---------------------------------------------------------------- economy
  const START_CARROTS = 1000;

  const COSTS = {
    cardScout: 100, cardScout10: 900,      // ten-pull is one free scout
    racerScout: 500, racerScout10: 4500,
    staminaRefill: 80,
  };

  /* Stamina works the way the real game's TP does: a career run is the purchase, not
     each race inside it, so a run is never stranded half-finished. */
  const STAMINA = {
    max: 100,
    regenMs: 4 * 60 * 1000,                // one point every four minutes
    careerRun: 30,
    exhibition: 5,
  };

  // ---------------------------------------------------------------- catalogue
  /* Rarity is carried on the racer itself (authored for the original eleven, derived
     from the character name for the rest -- see tools/genroster.js). */
  const defOf = id => Roster.ROSTER.find(r => r.id === id) || null;
  const rarityOf = id => { const d = defOf(id); return (d && d.rarity) || 1; };

  /* Five starters spanning every running style, the whole distance range and dirt, so no
     first pick is a wrong one. Deliberately no 3-star: with the real game's rarities the
     scout is where those come from, so it has to be worth something. One- and two-stars,
     as a new trainer's first partners are in the game. */
  const STARTERS = (Data && Data.STARTERS) ||
    ["sakura-bakushin-o", "el-condor-pasa", "vodka", "goldship", "urara"];

  const STARTER_BLURB = {
    "sakura-bakushin-o": "A sprinter who goes flat out from the gate. Simple, fast, and done by a mile.",
    "el-condor-pasa":    "Mile to middle distance, on turf or dirt. The most forgiving of the five.",
    vodka:               "Mile to middle on turf, from off the pace. Raw power.",
    goldship:            "An enormous stayer who comes from last. Long trips, and no plan at all.",
    urara:               "The underdog. Weakest on paper, a dirt sprinter with enormous heart.",
  };

  // ---------------------------------------------------------------- state
  const KEY = () => {
    const id = (root.Auth && Auth.current && Auth.current()) ? Auth.current().id : "guest";
    return "postparade.stable." + id;
  };

  /* Consumables. Quests and achievements pay in these as well as in carrots, so a
     reward can be "a free scout" rather than only ever being a number going up. */
  const ITEMS = [
    // `icon` names a pixel icon in icons.js
    { id: "staminaDrink", name: "Carrot Juice",  text: "Restores 50 stamina.",
      icon: "juice" },
    { id: "cardTicket",   name: "Scout Ticket",  text: "One free card scout.",
      icon: "ticket" },
    { id: "racerTicket",  name: "Scout Pass",    text: "One free racer scout.",
      icon: "pass" },
  ];
  const itemDef = id => ITEMS.find(i => i.id === id) || null;

  function blank() {
    return {
      carrots: START_CARROTS,
      racers: {},                 // id -> { got: ts, dupes: n }
      cards: {},                  // id -> count owned
      items: {},                  // id -> count owned
      stamina: { cur: STAMINA.max, at: now() },
      tutorials: {},              // id -> ts completed
      /* Which racers the scout is allowed to offer. Starts as the five starters and
         widens every time a career is completed -- see unlockFrom(). */
      unlocked: STARTERS.reduce((o, id) => (o[id] = 0, o), {}),
      starter: null,
      scoutPity: 0,               // racer scouts since the last 3-star
      history: [],                // recent scout results, newest first
      /* Decks belong to a racer: you pick who you are building for, then build. So each
         deck carries its owner, and `equipped` names which of her own she races with. */
      decks: [],                  // [{ id, racerId, name, cards: [cardId,...], made: ts }]
      equipped: {},               // racerId -> deckId
    };
  }

  let cache = null, cacheKey = null;

  function load() {
    const k = KEY();
    if (cache && cacheKey === k) return cache;
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(k)); } catch (e) {}
    cache = Object.assign(blank(), saved || {});
    // an older save may predate a field; blank() above covers that, but nested ones need care
    if (!cache.stamina || typeof cache.stamina.cur !== "number") cache.stamina = { cur: STAMINA.max, at: now() };
    if (!cache.racers) cache.racers = {};
    if (!cache.cards) cache.cards = {};
    if (!cache.items) cache.items = {};
    if (!cache.tutorials) cache.tutorials = {};
    if (!cache.unlocked) cache.unlocked = {};
    if (!Array.isArray(cache.decks)) cache.decks = [];
    if (!cache.equipped) cache.equipped = {};
    /* The catalogue was cut from 137 racers to the Global launch roster, so an older save
       can own, unlock or equip someone who no longer exists. Forget the racer; her decks
       lose their owner and are re-homed just below like any other orphan. */
    for (const map of [cache.racers, cache.unlocked, cache.equipped])
      for (const id of Object.keys(map)) if (!defOf(id)) delete map[id];
    for (const d of cache.decks) if (d.racerId && !defOf(d.racerId)) d.racerId = null;
    /* Decks predate belonging to a racer. An orphan is given to whoever has it equipped,
       and failing that to the first racer owned -- dropping it silently would lose work
       the trainer did. */
    for (const d of cache.decks) {
      if (d.racerId) continue;
      const holder = Object.keys(cache.equipped).find(r => cache.equipped[r] === d.id);
      d.racerId = holder || Object.keys(cache.racers)[0] || null;
    }
    for (const id of STARTERS) if (cache.unlocked[id] == null) cache.unlocked[id] = 0;
    cacheKey = k;
    return cache;
  }

  function save() {
    if (!cache) return;
    try { localStorage.setItem(cacheKey, JSON.stringify(cache)); } catch (e) {}
    for (const fn of listeners) fn(cache);
  }

  const listeners = [];
  const onChange = fn => listeners.push(fn);

  /** Drop the cached view, e.g. after switching accounts. */
  function reload() { cache = null; cacheKey = null; return load(); }

  // ---------------------------------------------------------------- carrots
  const carrots = () => load().carrots;

  function grant(n, reason) {
    const s = load();
    s.carrots += Math.max(0, Math.round(n));
    save();
    return s.carrots;
  }

  /** Returns false and changes nothing when they cannot afford it. */
  function spend(n, reason) {
    const s = load();
    n = Math.max(0, Math.round(n));
    if (s.carrots < n) return false;
    s.carrots -= n;
    save();
    return true;
  }

  // ---------------------------------------------------------------- stamina
  /* Regen is computed from the clock rather than ticked, so it accrues while the game
     is closed and cannot be farmed by leaving the tab open. */
  function stamina() {
    const s = load(), st = s.stamina;
    if (st.cur >= STAMINA.max) { st.at = now(); return view(st); }
    const elapsed = now() - st.at;
    const gained = Math.floor(elapsed / STAMINA.regenMs);
    if (gained > 0) {
      st.cur = clamp(st.cur + gained, 0, STAMINA.max);
      st.at += gained * STAMINA.regenMs;
      if (st.cur >= STAMINA.max) st.at = now();
      save();
    }
    return view(st);
  }
  function view(st) {
    const full = st.cur >= STAMINA.max;
    return {
      cur: st.cur, max: STAMINA.max, full,
      nextIn: full ? 0 : Math.max(0, STAMINA.regenMs - (now() - st.at)),
      fullIn: full ? 0 : (STAMINA.max - st.cur) * STAMINA.regenMs - (now() - st.at),
    };
  }

  const canAfford = n => stamina().cur >= n;

  function spendStamina(n) {
    const s = load();
    stamina();                                  // settle regen before charging
    if (s.stamina.cur < n) return false;
    if (s.stamina.cur >= STAMINA.max) s.stamina.at = now();   // start the clock now
    s.stamina.cur -= n;
    save();
    return true;
  }

  /** Buy a full stamina bar. Refuses when already full so carrots cannot be wasted. */
  function refillStamina() {
    const s = load();
    if (stamina().full) return { ok: false, error: "Stamina is already full." };
    if (!spend(COSTS.staminaRefill)) return { ok: false, error: "Not enough carrots." };
    s.stamina.cur = STAMINA.max;
    s.stamina.at = now();
    save();
    return { ok: true, cur: STAMINA.max };
  }

  // ---------------------------------------------------------------- ownership
  const owns = id => !!load().racers[id];
  const ownedRacers = () => Roster.ROSTER.filter(r => owns(r.id));
  const ownedIds = () => Object.keys(load().racers);

  const cardCount = id => load().cards[id] || 0;
  const ownsCard = id => cardCount(id) > 0;
  const ownedCards = () => Cards.CARDS.filter(c => cardCount(c.id) > 0);

  function addRacer(id, source) {
    const s = load();
    if (s.racers[id]) { s.racers[id].dupes++; return false; }
    /* She arrives at level 1 with no passives, wearing her default outfit. Every other
       outfit is hers to switch to immediately -- costumes are free. Levels come from
       finishing careers with her; passives come from pulling her again. */
    s.racers[id] = { got: now(), dupes: 0, source: source || "scout",
                     level: 1, xp: 0, passives: 0, outfit: "o0" };
    return true;
  }

  // ---------------------------------------------------------------- passives
  const PASSIVE_SLOTS = 3;

  /**
   * Duplicates feed straight into the racer -- a repeat pull is never wasted, it is
   * progress toward her next passive. How many it takes scales INVERSELY with rarity,
   * because rarity already decides how often she turns up: a 3-star appears in 10% of
   * pulls, a 1-star in 55%, so asking the same number of copies of both would make the
   * rare racer the one you can never finish.
   *
   * Chosen so the three passives land at roughly the same real effort per tier, and so
   * the first one arrives early enough to feel like the system is working.
   */
  const PASSIVE_THRESHOLDS = { 3: [1, 3, 6], 2: [2, 5, 9], 1: [3, 7, 12] };
  const thresholdsFor = id => PASSIVE_THRESHOLDS[rarityOf(id)] || PASSIVE_THRESHOLDS[1];

  /** Duplicates fed in so far. */
  const dupesOf = id => { const o = load().racers[id]; return o ? (o.dupes || 0) : 0; };

  /** How many passive slots this racer actually has (some define fewer than three). */
  const passiveSlotsOf = id => {
    const d = defOf(id);
    return Math.min(PASSIVE_SLOTS, ((d && d.passives) || []).length);
  };

  /** How many of her passives the duplicates fed in so far have unlocked. */
  function passivesOf(id) {
    const own = load().racers[id];
    if (!own) return 0;
    const th = thresholdsFor(id), dup = dupesOf(id);
    let n = 0;
    for (let i = 0; i < passiveSlotsOf(id); i++) if (dup >= th[i]) n++;
    return n;
  }

  /** What the next passive is and how many more copies it needs, for the UI. */
  function nextPassive(id) {
    if (!load().racers[id]) return null;
    const have = passivesOf(id), slots = passiveSlotsOf(id);
    if (have >= slots) return null;
    const def = defOf(id), th = thresholdsFor(id);
    return { key: def.passives[have], at: th[have],
             have: dupesOf(id), need: th[have] - dupesOf(id) };
  }

  const passivesMaxed = id => passivesOf(id) >= passiveSlotsOf(id);

  /** Feed duplicates in directly. Returns the passives unlocked by doing so. */
  function addDupes(id, n) {
    const own = load().racers[id];
    if (!own) return [];
    const before = passivesOf(id);
    own.dupes = (own.dupes || 0) + (n == null ? 1 : n);
    const after = passivesOf(id);
    const def = defOf(id);
    save();
    return def.passives.slice(before, after);
  }

  /** The saved record a racer enters a race with: level, xp and passive count. */
  function saveFor(id) {
    const own = load().racers[id];
    return own ? { level: own.level || 1, xp: own.xp || 0, passives: passivesOf(id) }
               : { level: 1, xp: 0, passives: 0 };
  }

  /** Career completions are the only source of levels. */
  function addXp(id, gained) {
    const own = load().racers[id];
    if (!own) return null;
    const Progress = (typeof require !== "undefined") ? require("./progression.js") : root.Progress;
    const after = Progress.applyXp({ level: own.level || 1, xp: own.xp || 0 }, gained);
    own.level = after.level; own.xp = after.xp;
    save();
    return after;
  }

  // ---------------------------------------------------------------- outfits
  /* Every costume in the asset folder is a selectable outfit, and all of them are FREE:
     once a racer is yours, you may dress her however you like. Cosmetics are not part
     of the progression -- passives are (see the duplicate ladder in pullRacer). */
  const outfitsOf = id => { const d = defOf(id); return (d && d.outfits) || []; };

  /** Every outfit she has, which for an owned racer is all of them. */
  const ownedOutfits = id => (load().racers[id] ? outfitsOf(id) : []);
  /** Nothing is ever locked; kept so callers can ask without special-casing. */
  const lockedOutfits = () => [];

  /** The art to draw for this racer right now. Safe for unowned racers too. */
  function spriteFor(id) {
    const d = defOf(id);
    if (!d) return "";
    const own = load().racers[id];
    const all = d.outfits || [];
    if (!own || !all.length) return d.sprite;
    const chosen = all.find(o => o.id === own.outfit);
    return (chosen && chosen.art) || d.sprite;
  }

  /** Switch her outfit. Free and instant for any racer you own. */
  function setOutfit(id, outfitId) {
    const s = load(), own = s.racers[id];
    if (!own) return { ok: false, error: "You do not have that racer." };
    if (!outfitsOf(id).some(o => o.id === outfitId))
      return { ok: false, error: "She has no such outfit." };
    own.outfit = outfitId;
    save();
    return { ok: true, sprite: spriteFor(id) };
  }
  function addCard(id, n) {
    const s = load();
    s.cards[id] = (s.cards[id] || 0) + (n || 1);
  }

  // ---------------------------------------------------------------- unlocks
  /* A racer has to be UNLOCKED before the scout will offer her, and owning her is a
     separate step. The roster opens up as a tree: finishing a career with someone adds
     the racers hanging off her, and those in turn unlock more. */
  const isUnlocked = id => load().unlocked[id] != null;
  const unlockedIds = () => Object.keys(load().unlocked);
  const unlockedRacers = () => Roster.ROSTER.filter(r => isUnlocked(r.id));

  /** The racers a completed career with `id` would add. Used to preview the reward. */
  const unlocksFrom = id => (UNLOCKS[id] || []).filter(x => !isUnlocked(x));

  /**
   * Called when a career is COMPLETED with this racer. Returns the racers newly added
   * to the scout pool, so the results screen can show what the run opened up.
   */
  function unlockFrom(id) {
    const s = load();
    const added = [];
    for (const kid of UNLOCKS[id] || []) {
      if (s.unlocked[kid] != null) continue;
      s.unlocked[kid] = now();
      const def = defOf(kid);
      if (def) added.push(def);
    }
    if (added.length) save();
    return added;
  }

  /** How far through the roster this account has opened up. */
  function unlockProgress() {
    const total = Roster.ROSTER.length;
    const open = unlockedIds().length;
    return { open, total, owned: ownedIds().length, pct: total ? open / total : 0 };
  }

  // ---------------------------------------------------------------- items
  const itemCount = id => load().items[id] || 0;

  function addItem(id, n) {
    const s = load();
    s.items[id] = (s.items[id] || 0) + (n || 1);
    save();
    return s.items[id];
  }

  /** Consumes one and applies its effect. Returns what happened, or an error. */
  function useItem(id) {
    const s = load();
    if (!itemCount(id)) return { ok: false, error: "You have none of those." };
    if (id === "staminaDrink") {
      const st = stamina();
      if (st.full) return { ok: false, error: "Stamina is already full." };
      if (s.stamina.cur >= STAMINA.max) s.stamina.at = now();
      s.stamina.cur = clamp(s.stamina.cur + 50, 0, STAMINA.max);
      s.items[id]--;
      save();
      return { ok: true, effect: "stamina", cur: s.stamina.cur };
    }
    if (id === "cardTicket" || id === "racerTicket") {
      // spend the ticket by crediting exactly what the scout costs, then scouting
      const cost = id === "cardTicket" ? COSTS.cardScout : COSTS.racerScout;
      s.items[id]--;
      save();
      grant(cost);
      const res = id === "cardTicket" ? pullCard(1) : pullRacer(1);
      if (!res.ok) { spend(cost); addItem(id, 1); return res; }   // put it back
      return Object.assign({ effect: "scout" }, res);
    }
    return { ok: false, error: "That item does nothing yet." };
  }

  // ---------------------------------------------------------------- starter
  /**
   * The first real choice a trainer makes. Her five cards are her own signature cards
   * first, then the best-fitting cards for the trip she runs -- the pool only carries
   * two cards per racer, so a themed starter deck has to be built on suitability.
   */
  function starterCards(racerId) {
    const def = Roster.ROSTER.find(r => r.id === racerId);
    if (!def) return [];
    const mine = Cards.CARDS.filter(c => c.name === def.name);
    const rest = Cards.CARDS.filter(c => c.name !== def.name);

    /* Score by what this racer actually needs: a front runner wants to hold a lead, a
       closer wants a finishing burst, a stayer wants stamina back. Cheap cards first --
       a starter deck that cannot be played is not a gift. */
    const wantKind = {
      front: { Tempo: 3, Recovery: 2, Burst: 2, Support: 1, Counter: 0, Gamble: 0 },
      pace:  { Burst: 3, Counter: 2, Recovery: 2, Support: 1, Tempo: 1, Gamble: 0 },
      late:  { Burst: 3, Counter: 3, Recovery: 1, Gamble: 1, Support: 1, Tempo: 0 },
      ender: { Burst: 3, Counter: 3, Gamble: 2, Recovery: 1, Support: 0, Tempo: 0 },
    }[def.style] || {};
    const scored = rest.map(c => ({
      c,
      score: (wantKind[c.kind] || 0) * 2 - c.cost +
             (c.rarity === "C" ? 1.5 : c.rarity === "R" ? 0.5 : 0),
    })).sort((a, b) => b.score - a.score);

    const out = mine.slice(0, 5);
    /* Two guards, both learned from what the raw scoring produced: several cards share
       an ability name across different racers' art, so filtering only by id hands out
       what looks like the same card twice; and a pure score sort gives a Pace racer
       five Bursts, which is a monotone deck to hand someone right before the deck
       -building tutorial. Cap each kind so the starter shows what a mixed deck is. */
    const kindCap = 2;
    const kinds = {}, abilities = {};
    for (const c of out) { kinds[c.kind] = (kinds[c.kind] || 0) + 1; abilities[c.ability] = 1; }
    for (const pass of [0, 1]) {                 // second pass relaxes the kind cap
      for (const s of scored) {
        if (out.length >= 5) break;
        const c = s.c;
        if (abilities[c.ability]) continue;
        if (!pass && (kinds[c.kind] || 0) >= kindCap) continue;
        out.push(c);
        kinds[c.kind] = (kinds[c.kind] || 0) + 1;
        abilities[c.ability] = 1;
      }
    }
    return out.slice(0, 5);
  }

  /** Irreversible, and only available once. */
  function pickStarter(racerId) {
    const s = load();
    if (s.starter) return { ok: false, error: "You have already chosen a starter." };
    if (STARTERS.indexOf(racerId) < 0) return { ok: false, error: "Not a starter racer." };
    addRacer(racerId, "starter");
    const cards = starterCards(racerId);
    for (const c of cards) addCard(c.id, 1);
    s.starter = racerId;
    save();
    return { ok: true, racerId, cards };
  }

  // ---------------------------------------------------------------- scouting
  const CARD_RATES = [["C", 0.65], ["R", 0.27], ["E", 0.08]];
  const RACER_RATES = [[1, 0.55], [2, 0.35], [3, 0.10]];
  const PITY_AT = 40;                     // guaranteed 3-star this many scouts after one

  function roll(rates, rnd) {
    let x = rnd, acc = 0;
    for (const [k, p] of rates) { acc += p; if (x < acc) return k; }
    return rates[rates.length - 1][0];
  }
  const pick = (arr, rnd) => arr[Math.floor(rnd * arr.length) % arr.length];

  /**
   * Card scout. Duplicates are not a dead pull: a second copy lets that card be run
   * twice in the same 15, which is a real deck-building option.
   */
  function pullCard(n) {
    n = n === 10 ? 10 : 1;
    const cost = n === 10 ? COSTS.cardScout10 : COSTS.cardScout;
    if (!spend(cost)) return { ok: false, error: "Not enough carrots." };

    const out = [];
    for (let i = 0; i < n; i++) {
      let rar = roll(CARD_RATES, Math.random());
      // a ten-pull owes at least one R or better
      if (n === 10 && i === 9 && !out.some(o => o.card.rarity !== "C")) rar = "R";
      const pool = Cards.CARDS.filter(c => c.rarity === rar);
      const card = pick(pool, Math.random());
      const isNew = !ownsCard(card.id);
      addCard(card.id, 1);
      out.push({ card, isNew, copies: cardCount(card.id) });
    }
    remember(load(), { kind: "card", at: now(), items: out.map(o => o.card.id) });
    save();
    return { ok: true, results: out, spent: cost };
  }

  /**
   * Racer scout. A duplicate refunds carrots rather than being silently swallowed, and
   * once every racer is owned the scout says so instead of taking the money.
   */
  const DUPE_REFUND = { 1: 120, 2: 260, 3: 600 };

  function pullRacer(n) {
    n = n === 10 ? 10 : 1;
    const s = load();
    /* The scout can only offer racers this account has unlocked, which is what makes
       finishing careers the way the roster opens up. */
    const available = unlockedRacers();
    if (!available.length)
      return { ok: false, error: "No racers are unlocked yet." };
    if (available.every(r => owns(r.id) && passivesMaxed(r.id)))
      return { ok: false, error: "Every unlocked racer is owned with all passives. Finish a career to unlock more." };

    const cost = n === 10 ? COSTS.racerScout10 : COSTS.racerScout;
    if (!spend(cost)) return { ok: false, error: "Not enough carrots." };

    const out = [];
    let refunded = 0;
    for (let i = 0; i < n; i++) {
      let want = roll(RACER_RATES, Math.random());
      if (s.scoutPity + 1 >= PITY_AT) want = 3;
      // a ten-pull owes at least one 2-star or better
      if (n === 10 && i === 9 && !out.some(o => o.rarity >= 2)) want = Math.max(want, 2);

      // prefer an unowned racer at that rarity, then any unowned, then anyone unlocked
      let pool = available.filter(r => rarityOf(r.id) === want && !owns(r.id));
      if (!pool.length) pool = available.filter(r => !owns(r.id));
      if (!pool.length) pool = available.filter(r => rarityOf(r.id) === want);
      if (!pool.length) pool = available;

      const def = pick(pool, Math.random());
      const rar = rarityOf(def.id);
      const maxed = owns(def.id) && passivesMaxed(def.id);
      const before = owns(def.id) ? passivesOf(def.id) : 0;
      const isNew = addRacer(def.id, "scout");     // a duplicate feeds itself in here
      s.scoutPity = rar >= 3 ? 0 : s.scoutPity + 1;

      /* A duplicate is never wasted: it counts toward her next passive, and only once
         all of them are unlocked does it convert to carrots instead. Outfits are not on
         this ladder -- they are free the moment you own her. */
      let refund = 0, passive = null, progress = null;
      if (!isNew) {
        if (maxed) { refund = DUPE_REFUND[rar] || 120; refunded += refund; }
        else {
          const after = passivesOf(def.id);
          if (after > before) passive = def.passives[after - 1];
          progress = nextPassive(def.id);          // null once this pull maxed her out
        }
      }
      out.push({ def, rarity: rar, isNew, refund, passive, progress,
                 dupes: dupesOf(def.id) });
    }
    if (refunded) grant(refunded);
    remember(s, { kind: "racer", at: now(), items: out.map(o => o.def.id) });
    save();
    return { ok: true, results: out, spent: cost, refunded };
  }

  function remember(s, entry) {
    s.history = s.history || [];
    s.history.unshift(entry);
    if (s.history.length > 30) s.history.length = 30;
  }

  // ---------------------------------------------------------------- tutorials
  /* Each pays once. The amounts are set so finishing all of them roughly doubles the
     starting purse -- enough for a ten-card scout plus a racer scout. */
  const TUTORIALS = [
    { id: "race",   name: "Race Basics",     carrots: 100, text: "How a race runs and what a Callout does." },
    { id: "deck",   name: "Deck Building",   carrots: 200, text: "Building a 15-card deck that actually plays." },
    { id: "scout",  name: "Scouting",        carrots: 200, text: "Recruiting racers and cards with carrots." },
    { id: "career", name: "Career Mode",     carrots: 500, text: "A full URA Finale run, start to finish." },
  ];

  const tutorialDone = id => !!load().tutorials[id];

  /** Pays out once; calling it again is a no-op rather than an error. */
  function completeTutorial(id) {
    const s = load();
    const t = TUTORIALS.find(t => t.id === id);
    if (!t) return { ok: false, error: "Unknown tutorial." };
    if (s.tutorials[id]) return { ok: false, already: true, carrots: 0 };
    s.tutorials[id] = now();
    grant(t.carrots);                              // grant() saves
    return { ok: true, carrots: t.carrots, name: t.name };
  }

  // ---------------------------------------------------------------- summary
  /** Everything the UI needs for a header, in one call. */
  function summary() {
    const s = load();
    return {
      carrots: s.carrots,
      stamina: stamina(),
      racers: ownedIds().length,
      rosterTotal: Roster.ROSTER.length,
      unlocked: unlockedIds().length,
      cards: ownedCards().length,
      cardTotal: Cards.CARDS.length,
      items: ITEMS.reduce((a, i) => a + itemCount(i.id), 0),
      starter: s.starter,
      tutorialsLeft: TUTORIALS.filter(t => !s.tutorials[t.id]).length,
    };
  }

  // ---------------------------------------------------------------- decks
  /* A deck is a named list of card ids BELONGING TO ONE RACER. Deck building is something
     you do inside a racer -- you pick who you are building for, then build -- so a deck
     carries the racer it was made for and equipping is just choosing which of her own
     decks she takes to the gate.

     It may hold the SAME card more than once, but never more copies than the trainer
     owns -- that is what a duplicate pull is for, and it is the reason `cards` is a list
     rather than a set. Five is the floor because a deck that thin cannot answer a race;
     fifteen is the ceiling the whole spirit economy is balanced around. */
  const DECK_MIN = 5;
  const DECK_MAX = 15;

  const decks = () => load().decks;
  const deckById = id => decks().find(d => d.id === id) || null;
  /** Just this racer's decks, newest last. */
  const decksFor = racerId => decks().filter(d => d.racerId === racerId);
  const deckName = s => String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, 24);

  /** Every reason a deck might be refused, in one place, so the UI and the API agree. */
  function checkDeck(name, cards) {
    const nm = deckName(name);
    if (!nm) return "Give the deck a name.";
    if (!Array.isArray(cards)) return "No cards.";
    if (cards.length < DECK_MIN) return `A deck needs at least ${DECK_MIN} cards.`;
    if (cards.length > DECK_MAX) return `A deck holds at most ${DECK_MAX} cards.`;
    const used = {};
    for (const id of cards) {
      if (!Cards.byId[id]) return "That deck names a card that does not exist.";
      used[id] = (used[id] || 0) + 1;
      if (used[id] > cardCount(id))
        return `You only own ${cardCount(id)} × ${Cards.byId[id].ability}.`;
    }
    return null;
  }

  function createDeck(name, cards, racerId) {
    if (!owns(racerId)) return { ok: false, error: "Build the deck for a racer you have." };
    const err = checkDeck(name, cards);
    if (err) return { ok: false, error: err };
    const s = load();
    const deck = { id: "d" + now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
                   racerId, name: deckName(name), cards: cards.slice(), made: now() };
    s.decks.push(deck);
    save();
    return { ok: true, deck };
  }

  /** Replace a deck's contents in place, so equipping survives an edit. */
  function updateDeck(id, name, cards) {
    const d = deckById(id);
    if (!d) return { ok: false, error: "No such deck." };
    const err = checkDeck(name, cards);
    if (err) return { ok: false, error: err };
    d.name = deckName(name);
    d.cards = cards.slice();
    save();
    return { ok: true, deck: d };
  }

  function renameDeck(id, name) {
    const d = deckById(id);
    if (!d) return { ok: false, error: "No such deck." };
    const nm = deckName(name);
    if (!nm) return { ok: false, error: "Give the deck a name." };
    d.name = nm;
    save();
    return { ok: true, deck: d };
  }

  function deleteDeck(id) {
    const s = load();
    const i = s.decks.findIndex(d => d.id === id);
    if (i < 0) return { ok: false, error: "No such deck." };
    s.decks.splice(i, 1);
    // a deleted deck cannot stay equipped to anyone
    for (const r in s.equipped) if (s.equipped[r] === id) delete s.equipped[r];
    save();
    return { ok: true };
  }

  /** The deck she takes to the gate. It has to be one of her own. */
  function equipDeck(deckId, racerId) {
    const s = load();
    const d = deckById(deckId);
    if (!d) return { ok: false, error: "No such deck." };
    if (!owns(racerId)) return { ok: false, error: "You do not have that racer." };
    if (d.racerId !== racerId)
      return { ok: false, error: "That deck was built for someone else." };
    s.equipped[racerId] = deckId;
    save();
    return { ok: true };
  }
  function unequipRacer(racerId) {
    const s = load();
    if (s.equipped[racerId]) { delete s.equipped[racerId]; save(); }
    return { ok: true };
  }

  /** The deck a racer takes to the gate, or null if she has not been given one. */
  const deckForRacer = racerId => deckById(load().equipped[racerId]);
  /** Who is currently running this deck. */
  const racersUsing = deckId =>
    Object.keys(load().equipped).filter(r => load().equipped[r] === deckId);

  // ---------------------------------------------------------------- auto-build
  /* "Let her decide": the deck this racer would build for herself out of what the trainer
     owns. Everything it weighs is something the game already decides elsewhere --

       kind      what each kind of card is worth to anyone (KIND_WANTS, measured)
       style     the running style it is built for, read card by card (styleFit, below)
       character her personality's own preferences, straight off Racers.PERSONALITIES
       cost      the one that dominates. Spirit is 15 for a whole race and she draws five
                 at a time, so an expensive deck is a deck that sits in her hand. This is
                 the finding validate-balance measured and it is weighted like it.
       hers      a card carrying her own name, which is thematically her signature

     Deliberately NOT a pure sort: a top-scoring sort hands a Pace Chaser fifteen Bursts,
     which loses to a mixed deck because a monotone hand has nothing to offer when the
     race asks a different question. The kind cap is what stops that.

     KIND_WANTS used to be a table per running style (front: Tempo 3, Recovery 2, ...).
     Raced against each other, the deck it built for a front runner was the best deck for
     EVERY style -- it was ranking decks, not fitting them. So every style now starts from
     one appetite, ordered the way the per-style probe in the README measured the kinds
     (Tempo's investment best, Gamble worst), and the style moves only the cards whose
     value really depends on it. Measured, that alone took the Balanced deck from level
     with a random fifteen to half a place ahead of it. */
  const KIND_WANTS = { Tempo: 3, Burst: 2.5, Recovery: 2, Counter: 2, Support: 0.5, Gamble: 0 };

  /* Three ways to build, and the weights behind each were SET BY MEASUREMENT rather than
     intuition -- see race/validate-autodeck.js, which races every one of them against
     cheapest, priciest and random, for both a player who spends Callouts and one who
     never does.

     The first attempt at this weighted cheap cards heavily, reasoning that spirit is the
     binding constraint. Measured, that deck came LAST. What actually wins is card impact:
     a rare card's effect outweighs the extra plays a cheap deck buys back, even for a
     player who never redraws. `mix` is that finding, and it is the default.

     Measured over ~750 races per style (validate-autodeck 34, both players): mix 4.99
     mean place, expensive 5.14, cheap 5.53, against cheapest 5.67 and random 5.55. Cheap
     is genuinely behind, and it is kept because it is a real strategy a player is
     entitled to choose -- it plays half again as many cards, which is its own kind of
     fun. (Before KIND_WANTS replaced the per-style table, mix had slipped to level with
     random as the sim moved on: 5.29 against 5.36.) */
  const PICK_STYLES = {
    mix: {
      name: "Balanced",
      note: "Impact where it counts, still affordable. Measured ahead of Expensive, and the safer pick if you do not watch every race.",
      w: { style: 1.9, cost: 0.35, rarityE: 2.6, rarityR: 1.3, hers: 1.1, base: 1.0 },
    },
    expensive: {
      name: "Expensive",
      note: "The biggest effects she owns. Fewer cards get played and each one lands harder. Measures a little behind Balanced.",
      /* fitW: rarity is weighted so hard here that, at the usual strength, the running
         style moved only two cards in fifteen. Doubled, it moves three or four. */
      w: { style: 1.9, cost: -0.9, rarityE: 3.4, rarityR: 1.7, hers: 0.8, base: 1.0, fitW: 2 },
    },
    cheap: {
      name: "Cheap",
      note: "Half again as many plays per race, but measurably the weakest of the three. Only worth it if you spend Callouts on every dead hand.",
      w: { style: 1.9, cost: 1.5, rarityE: 0.7, rarityR: 0.35, hers: 1.1, base: 3.4 },
    },
  };
  const PICK_W = PICK_STYLES.mix.w;

  /** The weights for a named style, or a weights object passed straight through. */
  function weightsFor(style) {
    if (style && typeof style === "object") return style;             // the validator sweeps raw
    const s = PICK_STYLES[style] || PICK_STYLES.mix;
    return s.w;
  }

  // ---------------------------------------------------------------- building for a style
  /* The second question "Let her decide" asks: which running style to build for. Her own
     by default; any of the four if the trainer wants a deck for another kind of race.

     No card says which style it suits, and none is tagged here. What a card ASKS of the
     race is read off its own data; what a style can GIVE is read off its line in
     Sim.STYLES. A new card, or a retuned style, is scored without touching this file.

       the card asks (its data)                   the style gives (Sim.STYLES)
       opening only      phases [0]                lead   gap: on the lead .. 18m back
       final only        phases [2]                kick   phase[2] - phase[0]: pace held
       a rival ahead     steal, draft, gambit,            back for the straight
                         a "leader" target,        tank   hpCoef: how deep the pool is
                         cond.blocked
       stamina back      heal, a drain cut
       stamina spent     a drain penalty
       running on empty  cond.hpBelow
       paid in the       invest (Tempo)
         straight

     How much each pairing is worth was MEASURED, by splashing six of a class into an
     all-Burst deck and racing it in each style (the per-style table in the README):
     stamina cards are the one big lever -- worth ~1.9 places to a front runner on a short
     pool and ~0.5 to an Ender -- burning stamina hurts the closers more, and Tempo's
     payoff suits them. Phase and position barely register, and are sized like it. */
  const BUILD_FOR = {
    front: { note: "Heals to last from the gate, and opening bursts." },
    pace:  { note: "Some heals, some cards for the straight." },
    late:  { note: "Fewer heals, more cards that pay off in the straight." },
    ender: { note: "Built for the straight: final spurts, Tempo payoffs, fewest heals." },
  };

  /* Each style's place on the three scales, 0..1 across the four. */
  let situations = null;
  function situationOf(key) {
    if (!situations) {
      const Sim = typeof require !== "undefined" ? require("./sim.js") : root.Sim;
      const all = Object.keys(Sim.STYLES).map(k => Sim.STYLES[k]);
      const span = (f, st) => {
        const xs = all.map(f), lo = Math.min.apply(null, xs), hi = Math.max.apply(null, xs);
        return hi > lo ? (f(st) - lo) / (hi - lo) : 0.5;
      };
      situations = {};
      for (const st of all) situations[st.key] = {
        lead: 1 - span(s => s.gap, st),
        kick: span(s => s.phase[2] - s.phase[0], st),
        tank: span(s => s.hpCoef, st),
      };
    }
    return situations[key] || situations.pace;
  }

  /* Roughly what a racer burns per second at race pace, as a share of her pool -- enough
     to put a drain cut and a heal on one scale. */
  const DRAIN_PER_S = 0.006;

  /**
   * What a card needs from the race, from its phases, conditions and effects alone.
   * `refuel` is how much of her pool it gives back (a heal counts its average desperation
   * bonus, a drain cut what it saves at race pace), so a full heal outweighs a passing cut.
   */
  function cardAsks(c) {
    const ph = c.phases && c.phases.length && c.phases.length < 3 ? c.phases : null;
    const has = t => c.effects.some(e => e.t === t);
    let refuel = 0, burn = 0;
    for (const e of c.effects) {
      if (e.t === "heal") refuel += e.amount + (e.scale || 0) / 2;
      if (e.t === "drain") {
        const share = Math.abs(e.amount) * (e.dur || 1) * DRAIN_PER_S;
        if (e.amount < 0) refuel += share; else burn += share;
      }
    }
    const cond = c.cond || {};
    return {
      opening: !!ph && ph.every(p => p === 0),
      final:   !!ph && ph.every(p => p === 2),
      ahead:   c.target === "leader" || has("steal") || has("draft") || has("gambit") || !!cond.blocked,
      refuel:  Math.min(1, refuel / 0.2),
      empty:   cond.hpBelow != null,
      burn:    burn > 0,
      bank:    has("invest"),
    };
  }

  /* How much each pairing moves a card's score, in the units KIND_WANTS uses. Each term
     is centred, so a card that asks nothing scores the same for every style. */
  const FIT = { refuel: 1.4, empty: 0.4, burn: 0.8, bank: 0.8, opening: 0.6, final: 0.6, ahead: 0.5 };

  /** How well this card suits a racer running `runStyle`. Centred on 0. */
  function styleFit(c, runStyle, k) {
    k = k || FIT;
    const a = cardAsks(c), s = situationOf(runStyle);
    const toward = v => (v - 0.5) * 2;                          // 0..1 -> -1..1
    let f = 0;
    /* The big one. A short pool is the one that runs dry, so stamina back is worth most
       to a front runner -- measured, ~1.9 places on a short pool against ~0.5 for an Ender.
       Reading her own stamina as well was tried: it pulled the front-runner and Ender
       decks together and the advantage of building for the right style disappeared. */
    if (a.refuel)  f -= k.refuel  * a.refuel * toward(s.tank);
    if (a.empty)   f -= k.empty   * toward(s.tank);
    /* Stamina burnt late costs most for whoever is running fastest in the straight, which
       is the closers: Gamble and the dear Counter both measure worse for them. */
    if (a.burn)    f -= k.burn    * toward(s.kick);
    /* Tempo's payoff lands in the final phase and grows with what is left in the tank:
       the closers' pace and the closers' pool. */
    if (a.bank)    f += k.bank    * toward(s.kick);
    /* Smaller, but the right way round: an opening burst is ground a leader keeps and a
       closer gives back to the pack; a final-phase card is spent where closers race; a
       card that needs someone ahead is dead from the front. */
    if (a.opening) f += k.opening * toward(s.lead);
    if (a.final)   f += k.final   * toward(s.kick);
    if (a.ahead)   f -= k.ahead   * toward(s.lead);
    return f;
  }

  /** Score one card for one racer. Exposed so the validator can sweep the weights. */
  function cardScore(c, def, style, runStyle) {
    const w = weightsFor(style);
    const run = runStyle || def.style;
    const wants = w.kinds || KIND_WANTS;
    const ai = AI();
    const pers = (ai && ai.PERSONALITIES) ? ai.PERSONALITIES[def.personality] : null;
    const favour = (pers && pers.favours && pers.favours[c.kind] != null) ? pers.favours[c.kind] : 1;

    let s = (wants[c.kind] || 0) * w.style * favour;
    s += styleFit(c, run, w.fit) * (w.fitW == null ? 1 : w.fitW);
    s += w.base - c.cost * w.cost;
    if (c.name === def.name) s += w.hers;
    s += c.rarity === "E" ? w.rarityE : c.rarity === "R" ? w.rarityR : 0;
    return s;
  }

  /**
   * Up to DECK_MAX card ids, from cards this account owns, never more copies of one card
   * than are owned. Returns fewer when the trainer simply has fewer. `runStyle` is the
   * running style to build for, her own when left out.
   */
  function suggestDeck(racerId, style, runStyle) {
    const def = defOf(racerId);
    if (!def) return [];
    const pool = ownedCards();
    if (!pool.length) return [];

    const scored = pool.map(c => ({ c, score: cardScore(c, def, style, runStyle) }))
                       .sort((a, b) => b.score - a.score || a.c.id.localeCompare(b.c.id));

    const out = [], kinds = {}, used = {};
    /* Three passes, each relaxing a limit: a mixed deck first, then a second copy of the
       cards that earned one, then whatever is left to reach fifteen. A deck that is short
       because the trainer owns little is fine; a deck that is short because the picker was
       fussy is not. */
    const KIND_CAP = 4;
    for (const pass of [0, 1, 2]) {
      for (const { c } of scored) {
        if (out.length >= DECK_MAX) break;
        const have = cardCount(c.id), mine = used[c.id] || 0;
        if (mine >= have) continue;
        if (pass === 0 && mine >= 1) continue;               // one of each first
        if (pass < 2 && (kinds[c.kind] || 0) >= KIND_CAP) continue;
        out.push(c.id);
        used[c.id] = mine + 1;
        kinds[c.kind] = (kinds[c.kind] || 0) + 1;
      }
      if (out.length >= DECK_MAX) break;
    }
    return out;
  }

  /** A name for an auto-built deck, unique among the ones she already has. A deck built
      for a style she does not run says so, so it cannot be mistaken for her own. */
  function suggestDeckName(racerId, style, runStyle) {
    const def = defOf(racerId);
    const Sim = typeof require !== "undefined" ? require("./sim.js") : root.Sim;
    const taken = decksFor(racerId).map(d => d.name.toLowerCase());
    const st = PICK_STYLES[style];
    let base = st && style !== "mix" ? "Her " + st.name : "Her Pick";
    if (def && runStyle && runStyle !== def.style && Sim.STYLES[runStyle])
      base = Sim.STYLES[runStyle].name + " " + (st && style !== "mix" ? st.name : "Pick");
    if (taken.indexOf(base.toLowerCase()) < 0) return base;
    for (let i = 2; i < 99; i++)
      if (taken.indexOf((base + " " + i).toLowerCase()) < 0) return base + " " + i;
    return base;
  }

  const api = {
    START_CARROTS, COSTS, STAMINA, STARTERS, STARTER_BLURB, TUTORIALS, ITEMS, itemDef,
    DECK_MIN, DECK_MAX, decks, decksFor, deckById, checkDeck, createDeck, updateDeck,
    suggestDeck, suggestDeckName, cardScore, KIND_WANTS, PICK_W, PICK_STYLES,
    BUILD_FOR, FIT, styleFit, cardAsks,
    renameDeck, deleteDeck, equipDeck, unequipRacer, deckForRacer, racersUsing,
    ROSTER: Roster.ROSTER, UNLOCKS, defOf, rarityOf,
    CARD_RATES, RACER_RATES, DUPE_REFUND, PITY_AT,
    isUnlocked, unlockedIds, unlockedRacers, unlocksFrom, unlockFrom, unlockProgress,
    outfitsOf, ownedOutfits, lockedOutfits, spriteFor, setOutfit,
    PASSIVE_SLOTS, PASSIVE_THRESHOLDS, thresholdsFor, passiveSlotsOf,
    passivesOf, nextPassive, passivesMaxed, dupesOf, addDupes, saveFor, addXp,
    load, save, reload, onChange, summary,
    carrots, grant, spend,
    stamina, canAfford, spendStamina, refillStamina,
    itemCount, addItem, useItem,
    owns, ownedRacers, ownedIds, cardCount, ownsCard, ownedCards, addRacer, addCard,
    starterCards, pickStarter,
    pullCard, pullRacer,
    tutorialDone, completeTutorial,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Stable = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
