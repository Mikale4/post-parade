/*
 * Awards and quests.
 *
 * Everything the player does is reported here through one call -- `Quests.record(event)`
 * -- which bumps a set of counters and then re-checks every award and quest against
 * them. Nothing else in the game needs to know what an award is.
 *
 * Counters are kept in three scopes at once: `life` (never reset), `day` and `week`.
 * Daily and weekly quests read the short scopes, awards read the lifetime one, so the
 * same event feeds all of them without any duplicated bookkeeping.
 *
 * Awards pay out the moment they unlock. Quests have to be claimed, because a reward
 * the player never saw arrive may as well not have been given.
 *
 * Persisted per account under `postparade.quests.<accountId>`.
 *
 * Exposes Quests.
 */
(function (root) {
  "use strict";

  const Stable = typeof require !== "undefined" ? require("./stable.js") : root.Stable;
  const Cards  = typeof require !== "undefined" ? require("./cards.js")  : root.Cards;
  const Roster = typeof require !== "undefined" ? require("./roster.js") : root.Roster;

  const now = () => Date.now();

  /* Period keys. A quest set belongs to a calendar day and an ISO-ish week; when the
     key changes the counters for that scope are wiped and the quests come back. */
  function dayKey(t) {
    const d = new Date(t || now());
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }
  function weekKey(t) {
    const d = new Date(t || now());
    const day = (d.getDay() + 6) % 7;                       // Monday = 0
    d.setDate(d.getDate() - day);
    return d.getFullYear() + "-w" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  // ---------------------------------------------------------------- awards
  /* `check` reads the counter bag and returns true once earned. Retroactive by
     construction: a check that was already true is caught the next time anything is
     recorded, so adding an award later still credits an existing account. */
  const AWARDS = [
    { id: "first_race", name: "Post Parade", tier: "bronze",
      desc: "Run your first race.",
      check: c => c.life.races >= 1, reward: { carrots: 100 } },
    { id: "first_win", name: "Winner's Circle", tier: "bronze",
      desc: "Win your first race.",
      check: c => c.life.wins >= 1, reward: { carrots: 200 } },
    { id: "ten_wins", name: "Regular Feature", tier: "silver",
      desc: "Win 10 races.", goal: c => [c.life.wins, 10],
      check: c => c.life.wins >= 10, reward: { carrots: 400, items: { cardTicket: 1 } } },
    { id: "fifty_wins", name: "Household Name", tier: "gold",
      desc: "Win 50 races.", goal: c => [c.life.wins, 50],
      check: c => c.life.wins >= 50, reward: { carrots: 1200, items: { racerTicket: 1 } } },
    { id: "g1_win", name: "Grade One", tier: "silver",
      desc: "Win a G1 race.",
      check: c => c.life.g1Wins >= 1, reward: { carrots: 500 } },

    { id: "career_first", name: "Three Years", tier: "silver",
      desc: "See a career through to the end.",
      check: c => c.life.careersFinished >= 1,
      reward: { carrots: 600, items: { cardTicket: 1 } } },
    { id: "ura_champion", name: "URA Champion", tier: "gold",
      desc: "Win the URA Finale.",
      check: c => c.life.champions >= 1,
      reward: { carrots: 2000, items: { racerTicket: 1 } } },
    { id: "dream_champion", name: "The Summit", tier: "gold",
      desc: "Win the Dream Trophy.",
      check: c => c.life.dreamChampions >= 1,
      reward: { carrots: 5000, items: { racerTicket: 2 } } },
    { id: "ura_thrice", name: "Dynasty", tier: "gold",
      desc: "Win the URA Finale three times.", goal: c => [c.life.champions, 3],
      check: c => c.life.champions >= 3, reward: { carrots: 5000, racer: { rarity: 3 } } },
    { id: "grade_s", name: "Rated S", tier: "gold",
      desc: "Finish a career with an S rating or better.",
      check: c => "S SS".split(" ").includes(c.life.bestGrade), reward: { carrots: 1500 } },
    { id: "grade_ss", name: "Rated SS", tier: "gold",
      desc: "Finish a career with an SS rating.",
      check: c => c.life.bestGrade === "SS", reward: { carrots: 3000, racer: { rarity: 3 } } },

    { id: "collector_10", name: "Starting a Collection", tier: "bronze",
      desc: "Own 10 different cards.", goal: c => [c.owned.cards, 10],
      check: c => c.owned.cards >= 10, reward: { carrots: 150 } },
    { id: "collector_50", name: "Serious Collection", tier: "silver",
      desc: "Own 50 different cards.", goal: c => [c.owned.cards, 50],
      check: c => c.owned.cards >= 50, reward: { carrots: 600 } },
    { id: "collector_all", name: "Complete Set", tier: "gold",
      desc: "Own every card.", goal: c => [c.owned.cards, c.owned.cardTotal],
      check: c => c.owned.cards >= c.owned.cardTotal, reward: { carrots: 4000 } },
    { id: "stable_3", name: "A Real Stable", tier: "bronze",
      desc: "Own 3 racers.", goal: c => [c.owned.racers, 3],
      check: c => c.owned.racers >= 3, reward: { carrots: 300 } },
    { id: "stable_all", name: "Full Stable", tier: "gold",
      desc: "Own every racer.", goal: c => [c.owned.racers, c.owned.rosterTotal],
      check: c => c.owned.racers >= c.owned.rosterTotal, reward: { carrots: 5000 } },

    { id: "maxed", name: "Four Figures", tier: "silver",
      desc: "Train any stat to 1200.", goal: c => [c.life.maxStat, 1200],
      check: c => c.life.maxStat >= 1200, reward: { carrots: 800 } },
    { id: "capped", name: "At the Ceiling", tier: "gold",
      desc: "Train any stat to 1400.", goal: c => [c.life.maxStat, 1400],
      check: c => c.life.maxStat >= 1400, reward: { carrots: 2000 } },
    { id: "all_styles", name: "Every Way to Win", tier: "silver",
      desc: "Win a race with all four running styles.",
      goal: c => [Object.keys(c.life.styleWins || {}).length, 4],
      check: c => Object.keys(c.life.styleWins || {}).length >= 4,
      reward: { carrots: 1000, items: { cardTicket: 1 } } },
    { id: "all_dists", name: "Any Trip", tier: "silver",
      desc: "Win a race at all four distances.",
      goal: c => [Object.keys(c.life.distWins || {}).length, 4],
      check: c => Object.keys(c.life.distWins || {}).length >= 4,
      reward: { carrots: 1000, items: { cardTicket: 1 } } },
    { id: "tutorial_all", name: "Read the Manual", tier: "bronze",
      desc: "Complete every tutorial.",
      check: () => Stable.TUTORIALS.every(t => Stable.tutorialDone(t.id)),
      reward: { carrots: 300 } },
  ];

  // ---------------------------------------------------------------- quests
  /* `scope` picks which counter bag the quest reads, which is the only thing that makes
     a daily quest daily. */
  const DAILY = [
    { id: "d_race",  name: "Get out there",  desc: "Run 3 races.",              scope: "day", stat: "races",  goal: 3,  reward: { carrots: 150 } },
    { id: "d_win",   name: "Make it count",  desc: "Win 2 races.",              scope: "day", stat: "wins",   goal: 2,  reward: { carrots: 200 } },
    { id: "d_train", name: "Put in the work",desc: "Complete 10 training turns.",scope: "day", stat: "trainings", goal: 10, reward: { carrots: 120 } },
    { id: "d_scout", name: "Fresh blood",    desc: "Scout once.",               scope: "day", stat: "scouts", goal: 1,  reward: { carrots: 100 } },
  ];
  const WEEKLY = [
    { id: "w_wins",   name: "A good week",   desc: "Win 10 races.",             scope: "week", stat: "wins",   goal: 10, reward: { carrots: 600, items: { cardTicket: 1 } } },
    { id: "w_career", name: "See it through",desc: "Finish a career.",          scope: "week", stat: "careersFinished", goal: 1, reward: { carrots: 1000, items: { racerTicket: 1 } } },
    { id: "w_scout",  name: "Talent search", desc: "Scout 10 times.",           scope: "week", stat: "scouts", goal: 10, reward: { carrots: 500, items: { staminaDrink: 1 } } },
  ];
  /* One-time tasks that walk a new trainer through the game in the right order. */
  const TASKS = [
    { id: "p_starter", name: "Choose a partner", desc: "Pick your starter racer.",        scope: "life", stat: "starterPicked", goal: 1, reward: { carrots: 200 } },
    { id: "p_deck",    name: "Build a deck",     desc: "Save a full 15-card deck.",       scope: "life", stat: "decksBuilt",    goal: 1, reward: { carrots: 200 } },
    { id: "p_scout",   name: "First scout",      desc: "Scout a card or a racer.",        scope: "life", stat: "scouts",        goal: 1, reward: { carrots: 150 } },
    { id: "p_career",  name: "Begin a career",   desc: "Start a career run.",             scope: "life", stat: "careers",       goal: 1, reward: { carrots: 300 } },
    { id: "p_classic", name: "Into the Classic", desc: "Reach Classic year in a career.", scope: "life", stat: "reachedClassic",goal: 1, reward: { carrots: 400 } },
    { id: "p_ura",     name: "The big stage",    desc: "Reach the URA Finale.",           scope: "life", stat: "reachedUra",    goal: 1, reward: { carrots: 800, items: { racerTicket: 1 } } },
  ];
  const ALL_QUESTS = DAILY.concat(WEEKLY, TASKS);
  const questById = id => ALL_QUESTS.find(q => q.id === id) || null;

  // ---------------------------------------------------------------- state
  const KEY = () => {
    const id = (root.Auth && Auth.current && Auth.current()) ? Auth.current().id : "guest";
    return "postparade.quests." + id;
  };

  const blankCounters = () => ({
    races: 0, wins: 0, podiums: 0, g1Wins: 0,
    trainings: 0, careers: 0, careersFinished: 0, champions: 0, uraWins: 0, dreamChampions: 0,
    scouts: 0, cardScouts: 0, racerScouts: 0,
    decksBuilt: 0, starterPicked: 0, reachedClassic: 0, reachedUra: 0,
    maxStat: 0, maxFans: 0, bestRating: 0, bestGrade: "",
    styleWins: {}, distWins: {},
  });

  function blank() {
    return {
      life: blankCounters(),
      day: blankCounters(), dayKey: dayKey(),
      week: blankCounters(), weekKey: weekKey(),
      awards: {},          // id -> ts unlocked
      claimed: {},         // questId -> ts claimed (period-stamped for day/week)
      log: [],             // recent unlocks, newest first
    };
  }

  let cache = null, cacheKey = null;

  function load() {
    const k = KEY();
    if (cache && cacheKey === k) { rollPeriods(); return cache; }
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(k)); } catch (e) {}
    cache = Object.assign(blank(), saved || {});
    cache.life = Object.assign(blankCounters(), cache.life || {});
    cache.day = Object.assign(blankCounters(), cache.day || {});
    cache.week = Object.assign(blankCounters(), cache.week || {});
    cache.awards = cache.awards || {};
    cache.claimed = cache.claimed || {};
    cacheKey = k;
    rollPeriods();
    return cache;
  }

  /** Wipe the short scopes when their period has turned over. */
  function rollPeriods() {
    if (!cache) return;
    const d = dayKey(), w = weekKey();
    if (cache.dayKey !== d) {
      cache.day = blankCounters(); cache.dayKey = d;
      for (const q of DAILY) delete cache.claimed[q.id];
    }
    if (cache.weekKey !== w) {
      cache.week = blankCounters(); cache.weekKey = w;
      for (const q of WEEKLY) delete cache.claimed[q.id];
    }
  }

  function save() {
    if (!cache) return;
    try { localStorage.setItem(cacheKey, JSON.stringify(cache)); } catch (e) {}
    for (const fn of listeners) fn(cache);
  }
  const listeners = [];
  const onChange = fn => listeners.push(fn);
  function reload() { cache = null; cacheKey = null; return load(); }

  /** The bag the award checks read: counters plus live ownership numbers. */
  function ctx() {
    const s = load(), sum = Stable.summary();
    return { life: s.life, day: s.day, week: s.week,
             owned: { racers: sum.racers, rosterTotal: sum.rosterTotal,
                      cards: sum.cards, cardTotal: sum.cardTotal } };
  }

  // ---------------------------------------------------------------- recording
  /* Which counters an event bumps. Kept as data so adding an event is one line and
     every scope stays in step automatically. */
  const EVENTS = {
    race:        ["races"],
    raceWin:     ["races", "wins"],          // a win is also a race
    racePodium:  ["podiums"],
    g1Win:       ["g1Wins"],
    train:       ["trainings"],
    careerStart: ["careers"],
    careerEnd:   ["careersFinished"],
    uraWin:      ["uraWins"],
    champion:    ["champions"],
    dreamChampion: ["dreamChampions"],          // the Dream Trophy's Grand Final
    scoutCard:   ["scouts", "cardScouts"],
    scoutRacer:  ["scouts", "racerScouts"],
    deckBuilt:   ["decksBuilt"],
    starter:     ["starterPicked"],
    classic:     ["reachedClassic"],
    ura:         ["reachedUra"],
  };

  /**
   * The one entry point. `data` may carry `n` (how many), `style`, `dist`, `stat`,
   * `fans`, `rating`, `grade`. Returns whatever this call unlocked, so the caller can
   * celebrate it.
   */
  function record(event, data) {
    data = data || {};
    const s = load();
    const keys = EVENTS[event];
    if (keys) {
      const n = data.n == null ? 1 : data.n;
      for (const scope of ["life", "day", "week"])
        for (const k of keys) s[scope][k] += n;
    }
    // maxima and sets, lifetime only -- "best ever" is not a daily concept
    const L = s.life;
    if (data.stat   != null) L.maxStat    = Math.max(L.maxStat, data.stat);
    if (data.fans   != null) L.maxFans    = Math.max(L.maxFans, data.fans);
    if (data.rating != null) L.bestRating = Math.max(L.bestRating, data.rating);
    if (data.grade) {
      const order = ["E", "D", "C", "B", "A", "S", "SS"];
      if (order.indexOf(data.grade) > order.indexOf(L.bestGrade)) L.bestGrade = data.grade;
    }
    if (event === "raceWin") {
      if (data.style) L.styleWins[data.style] = (L.styleWins[data.style] || 0) + 1;
      if (data.dist)  L.distWins[data.dist]   = (L.distWins[data.dist]   || 0) + 1;
    }
    save();
    return { awards: checkAwards() };
  }

  // ---------------------------------------------------------------- payouts
  /** Hand over a reward bundle. Cards and racers are rolled here, not pre-chosen. */
  function payout(reward) {
    const got = { carrots: 0, items: [], cards: [], racers: [] };
    if (!reward) return got;
    if (reward.carrots) { Stable.grant(reward.carrots); got.carrots = reward.carrots; }
    for (const id in reward.items || {}) {
      Stable.addItem(id, reward.items[id]);
      got.items.push({ id, n: reward.items[id] });
    }
    for (const spec of reward.cards || []) {
      const pool = Cards.CARDS.filter(c => !spec.rarity || c.rarity === spec.rarity);
      for (let i = 0; i < (spec.n || 1); i++) {
        const c = pool[Math.floor(Math.random() * pool.length)];
        if (!c) break;
        Stable.addCard(c.id, 1);
        got.cards.push(c);
      }
    }
    if (reward.racer) {
      /* Only ever from the unlocked pool -- handing over a racer the player has not
         opened up yet would skip past the career progression that gates her. */
      const open = Stable.unlockedRacers();
      let pool = open.filter(r =>
        Stable.rarityOf(r.id) === reward.racer.rarity && !Stable.owns(r.id));
      if (!pool.length) pool = open.filter(r => !Stable.owns(r.id));
      const def = pool[Math.floor(Math.random() * pool.length)];
      if (def) { Stable.addRacer(def.id, "award"); got.racers.push(def); }
      else { Stable.grant(1500); got.carrots += 1500; }    // nothing left to give
    }
    Stable.save();
    return got;
  }

  // ---------------------------------------------------------------- awards api
  /** Unlock and pay anything newly earned. Safe to call as often as you like. */
  function checkAwards() {
    const s = load(), c = ctx(), out = [];
    for (const a of AWARDS) {
      if (s.awards[a.id]) continue;
      let ok = false;
      try { ok = !!a.check(c); } catch (e) { ok = false; }
      if (!ok) continue;
      s.awards[a.id] = now();
      const got = payout(a.reward);
      out.push({ award: a, got });
      s.log.unshift({ kind: "award", id: a.id, at: now() });
    }
    if (out.length) { if (s.log.length > 40) s.log.length = 40; save(); }
    return out;
  }

  const awardUnlocked = id => !!load().awards[id];

  /** Every award with its progress, for the awards screen. */
  function awards() {
    const s = load(), c = ctx();
    return AWARDS.map(a => {
      let have = null, need = null;
      if (a.goal) { try { [have, need] = a.goal(c); } catch (e) {} }
      return { id: a.id, name: a.name, desc: a.desc, tier: a.tier, reward: a.reward,
               unlocked: !!s.awards[a.id], at: s.awards[a.id] || null,
               have, need,
               pct: need ? Math.min(1, (have || 0) / need) : (s.awards[a.id] ? 1 : 0) };
    });
  }

  // ---------------------------------------------------------------- quests api
  function questView(q) {
    const s = load();
    const have = Math.min(s[q.scope][q.stat] || 0, q.goal);
    return { id: q.id, name: q.name, desc: q.desc, scope: q.scope, reward: q.reward,
             have, need: q.goal, pct: q.goal ? have / q.goal : 0,
             done: have >= q.goal, claimed: !!s.claimed[q.id] };
  }
  const daily  = () => (load(), DAILY.map(questView));
  const weekly = () => (load(), WEEKLY.map(questView));
  const tasks  = () => (load(), TASKS.map(questView));

  /** How many rewards are sitting there waiting -- for the badge on the menu button. */
  const claimable = () =>
    daily().concat(weekly(), tasks()).filter(q => q.done && !q.claimed).length;

  function claim(id) {
    const s = load(), q = questById(id);
    if (!q) return { ok: false, error: "Unknown quest." };
    const v = questView(q);
    if (!v.done) return { ok: false, error: "Not finished yet." };
    if (v.claimed) return { ok: false, error: "Already claimed." };
    s.claimed[id] = now();
    const got = payout(q.reward);
    s.log.unshift({ kind: "quest", id, at: now() });
    if (s.log.length > 40) s.log.length = 40;
    save();
    return { ok: true, quest: q, got };
  }

  /** Claim everything that is ready, so the player is not clicking twelve buttons. */
  function claimAll() {
    const out = [];
    for (const q of daily().concat(weekly(), tasks())) {
      if (!q.done || q.claimed) continue;
      const r = claim(q.id);
      if (r.ok) out.push(r);
    }
    return out;
  }

  // ---------------------------------------------------------------- summary
  function summary() {
    const s = load();
    return {
      awardsUnlocked: Object.keys(s.awards).length,
      awardsTotal: AWARDS.length,
      claimable: claimable(),
      wins: s.life.wins, races: s.life.races,
      champions: s.life.champions,
      bestGrade: s.life.bestGrade || "-",
    };
  }

  const api = { AWARDS, DAILY, WEEKLY, TASKS, EVENTS,
                load, save, reload, onChange, record, summary,
                awards, awardUnlocked, checkAwards,
                daily, weekly, tasks, claim, claimAll, claimable, payout };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Quests = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
