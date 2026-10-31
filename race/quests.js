/*
 * Awards, quests and trainer tasks.
 *
 * Everything the player does is reported here through one call -- `Quests.record(event)`
 * -- which bumps a set of counters and then re-checks every award against them. Nothing
 * else in the game needs to know what an award or a quest is.
 *
 * Counters are kept in three scopes at once: `life` (never reset), `day` and `week`.
 * Daily and weekly quests read the short scopes, trainer tasks and awards the lifetime
 * one, so the same event feeds all of them without any duplicated bookkeeping. A few
 * things are read live from the stable instead of counted (cards and racers owned,
 * passives, decks, tutorials), because the stable already knows them exactly.
 *
 * Four boards:
 *   DAILY    reset at midnight; small jobs from a normal day's play
 *   WEEKLY   reset on Monday; the week's bigger goals
 *   TRAINER  trainer tasks: FIRST steps for a new trainer, then CHAINS -- tiered goals
 *            (I, II, III ...) in categories, each tier a higher target and a bigger reward
 *   AWARDS   one-off medals that pay the moment they unlock
 *
 * Awards pay out the moment they unlock. Quests and tiers have to be claimed, because a
 * reward the player never saw arrive may as well not have been given.
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
  /** Midnight on the Monday that starts this week. */
  function weekStart(t) {
    const d = new Date(t || now());
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (d.getDay() + 6) % 7);          // Monday = 0
    return d;
  }
  function weekKey(t) {
    const d = weekStart(t);
    return d.getFullYear() + "-w" + (d.getMonth() + 1) + "-" + d.getDate();
  }
  /** When the day's and the week's quests next come back, for the board's headings. */
  function resets() {
    const d = new Date(); d.setHours(24, 0, 0, 0);
    const w = weekStart(); w.setDate(w.getDate() + 7);
    return { day: d.getTime() - now(), week: w.getTime() - now() };
  }

  const DISTS = ["sprint", "mile", "medium", "long"];
  const STYLES = ["front", "pace", "late", "ender"];
  const minOver = (bag, keys) => Math.min(...keys.map(k => (bag || {})[k] || 0));
  const size = bag => Object.keys(bag || {}).length;
  /* The academy is the 3D lobby: without WebGL the shell shows the flat home and there is
     nowhere to walk, so its quests stay off the board. Headless (the validators) it counts. */
  const academy = () => !root.document || !!(root.Lobby && root.Lobby.ok);

  // ---------------------------------------------------------------- awards
  /* `check` reads the counter bag and returns true once earned. Retroactive by
     construction: a check that was already true is caught the next time anything is
     recorded, so adding an award later still credits an existing account.

     The medal case is long, so it is filed by category (AWARD_CATS) and the screen filters
     on it. `goal(c)` gives a progress bar; `hidden` shows "???" and its `hint` until it is
     earned; `when(c)` keeps one off the case where it cannot be done (the academy's,
     without the 3D lobby). The original 21 keep their ids, so nothing earned is lost.

     Feats are kept as keys in `life.feats` (race facts from `raceDone`, a scout's luck, a
     room walked into) and best-ever numbers in `life.best`; see record(). */
  const AWARD_CATS = [
    { id: "racing",     name: "Racing" },
    { id: "careers",    name: "Careers" },
    { id: "champions",  name: "Champions" },
    { id: "collection", name: "Collection" },
    { id: "scouting",   name: "Scouting" },
    { id: "decks",      name: "Decks" },
    { id: "rivals",     name: "Rivalries" },
    { id: "academy",    name: "Academy" },
    { id: "dedication", name: "Dedication" },
    { id: "secrets",    name: "Secrets" },
  ];
  const F  = (c, k) => (c.life.feats || {})[k] || 0;                 // a feat, by key
  const B  = (c, k) => (c.life.best || {})[k] || 0;                  // a best ever
  const FN = (c, pre) => Object.keys(c.life.feats || {}).filter(k => k.startsWith(pre)).length;
  const T1 = { cardTicket: 1 }, T2 = { cardTicket: 2 }, PASS = { racerTicket: 1 };
  const award = (cat, id, name, tier, desc, check, reward, more) =>
    Object.assign({ cat, id, name, tier, desc, check, reward }, more || {});
  /* A count toward a target: the progress bar and the check in one. The target may be read
     off the bag too (every card, every racer). */
  const atLeast = (f, n) => ({ goal: c => [f(c), typeof n === "function" ? n(c) : n] });
  /* Rivals the game itself has lines for (rivals.js `vs`): race as one, meet the other. */
  const PAIRS = [
    ["Vodka", "Daiwa Scarlet"], ["Tokai Teio", "Mejiro McQueen"], ["Special Week", "Silence Suzuka"],
    ["Oguri Cap", "Super Creek"], ["Grass Wonder", "El Condor Pasa"], ["Tokai Teio", "Symboli Rudolf"],
    ["Rice Shower", "Mejiro McQueen"], ["Gold Ship", "Mejiro McQueen"], ["Haru Urara", "King Halo"],
    ["Special Week", "Grass Wonder"], ["Symboli Rudolf", "Air Groove"], ["Mejiro Ryan", "Mejiro McQueen"],
  ];
  const pairKey = (a, b) => [a, b].sort().join("|");
  const slug = s => s.toLowerCase().replace(/[^a-z]+/g, "");
  /* What the academy holds to find (lobby.js): its rooms, the dorm's rooms, the things to do. */
  const ACADEMY_ROOMS = ["hall", "office", "cafe", "dorm", "room", "school"];
  const DORM_ROOMS = 24;
  const THINGS = ["sit", "vend", "bin", "juke", "tea", "look", "admire", "read", "food", "rtray",
                  "fountain", "nap", "jog", "stretch"];
  const KINDS = ["Tempo", "Burst", "Recovery", "Counter", "Support", "Gamble"];
  const lobbyOnly = { when: academy };
  const inLobby = more => Object.assign(more, lobbyOnly);

  const AWARDS = [
    // ---- racing
    award("racing", "first_race", "Post Parade", "bronze", "Run your first race.",
          c => c.life.races >= 1, { carrots: 100 }),
    award("racing", "first_win", "Winner's Circle", "bronze", "Win your first race.",
          c => c.life.wins >= 1, { carrots: 200 }),
    award("racing", "ten_wins", "Regular Feature", "silver", "Win 10 races.", null,
          { carrots: 400, items: T1 }, atLeast(c => c.life.wins, 10)),
    award("racing", "fifty_wins", "Household Name", "gold", "Win 50 races.", null,
          { carrots: 1200, items: T2 }, atLeast(c => c.life.wins, 50)),
    award("racing", "rc_wins100", "Centurion", "gold", "Win 100 races.", null,
          { carrots: 2000, items: T1 }, atLeast(c => c.life.wins, 100)),
    award("racing", "all_styles", "Every Way to Win", "silver", "Win a race with all four running styles.", null,
          { carrots: 1000, items: T1 }, atLeast(c => size(c.life.styleWins), 4)),
    award("racing", "all_dists", "Any Trip", "silver", "Win a race at all four distances.", null,
          { carrots: 1000, items: T1 }, atLeast(c => size(c.life.distWins), 4)),
    award("racing", "rc_streak3", "Hat-trick", "silver", "Win 3 races in a row.", null,
          { carrots: 400 }, atLeast(c => B(c, "streak"), 3)),
    award("racing", "rc_streak5", "On a Roll", "silver", "Win 5 races in a row.", null,
          { carrots: 800 }, atLeast(c => B(c, "streak"), 5)),
    award("racing", "rc_streak10", "Unbeatable", "gold", "Win 10 races in a row.", null,
          { carrots: 2000, items: T1 }, atLeast(c => B(c, "streak"), 10)),
    award("racing", "rc_podium10", "Never Out of the Frame", "silver", "Finish in the top three in 10 races running.", null,
          { carrots: 600 }, atLeast(c => B(c, "podStreak"), 10)),
    award("racing", "rc_nose", "By a Nose", "silver", "Win by less than a twentieth of a second.",
          c => F(c, "nose") > 0, { carrots: 400 }),
    award("racing", "rc_clear", "Clear of Them", "bronze", "Win by a second or more.",
          c => F(c, "clear") > 0, { carrots: 200 }),
    award("racing", "rc_distance", "Won by a Distance", "silver", "Win by two seconds or more.",
          c => F(c, "distance") > 0, { carrots: 600 }),
    award("racing", "rc_wire", "Wire to Wire", "bronze", "Lead at the final corner and win.",
          c => F(c, "wire") > 0, { carrots: 200 }),
    award("racing", "rc_comeback", "From the Clouds", "silver", "Win from 6th or worse at the final corner.",
          c => F(c, "comeback") > 0, { carrots: 500 }),
    award("racing", "rc_lastfirst", "Last to First", "gold", "Win from last place at the final corner.",
          c => F(c, "lastFirst") > 0, { carrots: 1500 }),
    award("racing", "rc_empty", "Running on Empty", "silver", "Win with her stamina spent.",
          c => F(c, "empty") > 0, { carrots: 500 }),
    award("racing", "rc_fresh", "Barely Broke a Sweat", "bronze", "Win with half her stamina left.",
          c => F(c, "fresh") > 0, { carrots: 200 }),
    award("racing", "rc_dirt", "Dirt Track", "bronze", "Win a race on dirt.",
          c => F(c, "win:dirt") > 0, { carrots: 200 }),
    // the weather and the going (a career race runs in its turn's: Career.weatherOf)
    award("racing", "rc_rain", "Rain Runner", "bronze", "Win a race in the rain.",
          c => F(c, "win:weather:rain") > 0, { carrots: 200 }),
    award("racing", "rc_snow", "Snow Day", "silver", "Win a race in the snow.",
          c => F(c, "win:weather:snow") > 0, { carrots: 400 }),
    award("racing", "rc_heavy", "Mudlark", "silver", "Win on heavy ground.",
          c => F(c, "win:ground:heavy") > 0, { carrots: 400 }),
    award("racing", "rc_seasons", "All Seasons", "silver", "Win a race in spring, summer, autumn and winter.", null,
          { carrots: 600 }, atLeast(c => FN(c, "win:season:"), 4)),
    award("racing", "rc_goings", "Any Going", "gold", "Win on firm, good, soft and heavy ground.", null,
          { carrots: 1000 }, atLeast(c => FN(c, "win:ground:"), 4)),
    award("racing", "rc_courses", "Every Course", "bronze", "Run every exhibition course.", null,
          { carrots: 200 }, atLeast(c => FN(c, "course:"), c => c.owned.courses)),
    award("racing", "rc_courses_win", "Course Specialist", "silver", "Win on every exhibition course.", null,
          { carrots: 600 }, atLeast(c => FN(c, "courseWin:"), c => c.owned.courses)),
    award("racing", "rc_exnormal", "Exhibition Winner", "bronze", "Win a Normal Exhibition.",
          c => c.life.exNormalWins >= 1, { carrots: 100 }),
    award("racing", "rc_exdream", "Dream Winner", "bronze", "Win a Dream Exhibition.",
          c => c.life.exDreamWins >= 1, { carrots: 200 }),
    award("racing", "rc_exdream10", "Living the Dream", "silver", "Win 10 Dream Exhibitions.", null,
          { carrots: 800 }, atLeast(c => c.life.exDreamWins, 10)),
    award("racing", "rc_both25", "Both Rules", "gold", "Win 25 Normal and 25 Dream Exhibitions.", null,
          { carrots: 1500, items: T1 }, atLeast(c => Math.min(c.life.exNormalWins, c.life.exDreamWins), 25)),
    award("racing", "rc_nocall", "Didn't Need Them", "bronze", "Win a Normal race with both Callouts unspent.",
          c => F(c, "noCall") > 0, { carrots: 200 }),
    award("racing", "rc_cards10", "Whole Repertoire", "silver", "Play 10 cards in one race.", null,
          { carrots: 500 }, atLeast(c => B(c, "cards"), 10)),
    award("racing", "rc_runin2", "Saved for the Line", "silver", "Call both Callouts in the run-in of a Dream race, and win it.",
          c => F(c, "runInBoth") > 0, { carrots: 600 }),

    // ---- careers
    award("careers", "g1_win", "Grade One", "silver", "Win a G1 race.",
          c => c.life.g1Wins >= 1, { carrots: 500 }),
    award("careers", "career_first", "Three Years", "silver", "See a career through to the end.",
          c => c.life.careersFinished >= 1, { carrots: 600, items: T1 }),
    award("careers", "cr_goals", "Kept Every Promise", "bronze", "Finish a career without missing a goal.",
          c => F(c, "goals") > 0, { carrots: 300 }),
    award("careers", "ura_champion", "URA Champion", "gold", "Win the URA Finale.",
          c => c.life.champions >= 1, { carrots: 2000, items: PASS }),
    award("careers", "ura_thrice", "Dynasty", "gold", "Win the URA Finale three times.", null,
          { carrots: 5000, racer: { rarity: 3 } }, atLeast(c => c.life.champions, 3)),
    award("careers", "dream_champion", "The Summit", "gold", "Win the Dream Trophy.",
          c => c.life.dreamChampions >= 1, { carrots: 5000, items: PASS }),
    award("careers", "cr_dream3", "Dream Dynasty", "gold", "Win the Dream Trophy three times.", null,
          { carrots: 5000, items: T2 }, atLeast(c => c.life.dreamChampions, 3)),
    award("careers", "cr_both", "Both Summits", "gold", "Win the URA Finale and the Dream Trophy with the same racer.",
          c => Stable.ROSTER.some(r => F(c, "ura:" + r.id) && F(c, "dream:" + r.id)), { carrots: 3000 }),
    award("careers", "cr_rated_b", "Rated B", "bronze", "Finish a career with a B rating or better.",
          c => ["B", "A", "S", "SS"].includes(c.life.bestGrade), { carrots: 200 }),
    award("careers", "cr_rated_a", "Rated A", "silver", "Finish a career with an A rating or better.",
          c => ["A", "S", "SS"].includes(c.life.bestGrade), { carrots: 600 }),
    award("careers", "grade_s", "Rated S", "gold", "Finish a career with an S rating or better.",
          c => ["S", "SS"].includes(c.life.bestGrade), { carrots: 1500 }),
    award("careers", "grade_ss", "Rated SS", "gold", "Finish a career with an SS rating.",
          c => c.life.bestGrade === "SS", { carrots: 3000, racer: { rarity: 3 } }),
    award("careers", "cr_g1s5", "Big-Race Regular", "silver", "Win 5 G1 races in one career.", null,
          { carrots: 800 }, atLeast(c => B(c, "g1s"), 5)),
    award("careers", "cr_g1s10", "Grand Slam", "gold", "Win 10 G1 races in one career.", null,
          { carrots: 2000, items: T1 }, atLeast(c => B(c, "g1s"), 10)),
    award("careers", "cr_unbeaten", "Unbeaten", "gold", "Win every race of a career, the finale included.",
          c => F(c, "unbeaten") > 0, { carrots: 3000, items: T1 }),
    award("careers", "maxed", "Four Figures", "silver", "Train any stat to 1200.", null,
          { carrots: 800 }, atLeast(c => c.life.maxStat, 1200)),
    award("careers", "capped", "At the Ceiling", "gold", "Train any stat to 1400.", null,
          { carrots: 2000 }, atLeast(c => c.life.maxStat, 1400)),
    award("careers", "cr_low600", "All-Rounder", "silver", "Train all five stats to 600 in one career.", null,
          { carrots: 600 }, atLeast(c => B(c, "low"), 600)),
    award("careers", "cr_low900", "Complete Athlete", "gold", "Train all five stats to 900 in one career.", null,
          { carrots: 1500 }, atLeast(c => B(c, "low"), 900)),
    award("careers", "cr_legacy", "Family Tree", "bronze", "Begin a career with two parents.",
          c => F(c, "legacy") > 0, { carrots: 200 }),

    // ---- champions: every racer's URA Finale and Dream Trophy (the screen lays these out by racer)
    award("champions", "cr_ura10", "Champion of Champions", "gold", "Win the URA Finale with 10 different racers.", null,
          { carrots: 3000, items: T1 }, atLeast(c => FN(c, "ura:"), 10)),
    award("champions", "cr_dream10", "Dream Team", "gold", "Win the Dream Trophy with 10 different racers.", null,
          { carrots: 5000, items: T2 }, atLeast(c => FN(c, "dream:"), 10)),
    ...[].concat(...Stable.ROSTER.map(r => [
      award("champions", "ch_ura_" + r.id, "URA Finale: " + r.name, "silver", `Win the URA Finale with ${r.name}.`,
            c => F(c, "ura:" + r.id) > 0, { carrots: 300 }, { racer: r.id, scn: "ura" }),
      award("champions", "ch_dream_" + r.id, "Dream Trophy: " + r.name, "gold", `Win the Dream Trophy with ${r.name}.`,
            c => F(c, "dream:" + r.id) > 0, { carrots: 800 }, { racer: r.id, scn: "dream" }),
    ])),

    // ---- collection (read live from the stable)
    award("collection", "collector_10", "Starting a Collection", "bronze", "Own 10 different cards.", null,
          { carrots: 150 }, atLeast(c => c.owned.cards, 10)),
    award("collection", "collector_50", "Serious Collection", "silver", "Own 50 different cards.", null,
          { carrots: 600 }, atLeast(c => c.owned.cards, 50)),
    award("collection", "collector_all", "Complete Set", "gold", "Own every card.", null,
          { carrots: 4000 }, atLeast(c => c.owned.cards, c => c.owned.cardTotal)),
    award("collection", "col_epic", "First Epic", "bronze", "Own an Epic card.",
          c => c.owned.byRarity.E > 0, { carrots: 200 }),
    award("collection", "col_common_all", "Every Common", "silver", "Own every Common card.", null,
          { carrots: 600 }, atLeast(c => c.owned.byRarity.C, c => c.owned.rarityTotal.C)),
    award("collection", "col_rare_all", "Every Rare", "silver", "Own every Rare card.", null,
          { carrots: 1000 }, atLeast(c => c.owned.byRarity.R, c => c.owned.rarityTotal.R)),
    award("collection", "col_epic_all", "Every Epic", "gold", "Own every Epic card.", null,
          { carrots: 2000, items: T1 }, atLeast(c => c.owned.byRarity.E, c => c.owned.rarityTotal.E)),
    ...KINDS.map(k => award("collection", "col_kind_" + k.toLowerCase(), "The " + k + " Set", "silver", `Own every ${k} card.`, null,
          { carrots: 500 }, atLeast(c => c.owned.byKind[k] || 0, c => c.owned.kindTotal[k] || 0))),
    award("collection", "col_doubles", "Two of Each", "silver", "Own two copies of 20 different cards.", null,
          { carrots: 500 }, atLeast(c => c.owned.doubles, 20)),
    award("collection", "stable_3", "A Real Stable", "bronze", "Own 3 racers.", null,
          { carrots: 300 }, atLeast(c => c.owned.racers, 3)),
    award("collection", "col_starters", "Old Friends", "silver", "Own all five starters.", null,
          { carrots: 800 }, atLeast(c => c.owned.starters, c => c.owned.starterTotal)),
    award("collection", "col_3star", "Three Stars", "bronze", "Own a 3-star racer.",
          c => c.owned.racersBy[3] > 0, { carrots: 300 }),
    award("collection", "col_1star_all", "Every 1-Star", "silver", "Own every 1-star racer.", null,
          { carrots: 1000 }, atLeast(c => c.owned.racersBy[1], c => c.owned.racerTotal[1])),
    award("collection", "col_2star_all", "Every 2-Star", "silver", "Own every 2-star racer.", null,
          { carrots: 1500 }, atLeast(c => c.owned.racersBy[2], c => c.owned.racerTotal[2])),
    award("collection", "col_3star_all", "Every 3-Star", "gold", "Own every 3-star racer.", null,
          { carrots: 3000, items: T1 }, atLeast(c => c.owned.racersBy[3], c => c.owned.racerTotal[3])),
    award("collection", "stable_all", "Full Stable", "gold", "Own every racer.", null,
          { carrots: 5000 }, atLeast(c => c.owned.racers, c => c.owned.rosterTotal)),
    award("collection", "col_awake3", "Wide Awake", "silver", "Unlock every passive on a 3-star racer.",
          c => c.owned.awakened3 > 0, { carrots: 800 }),
    award("collection", "col_outfit", "New Look", "bronze", "Dress a racer in another outfit.",
          c => c.owned.dressed > 0, { carrots: 100 }),
    award("collection", "col_outfits5", "Wardrobe", "silver", "Dress 5 racers in another outfit.", null,
          { carrots: 300 }, atLeast(c => c.owned.dressed, 5)),
    award("collection", "col_rich", "Nest Egg", "bronze", "Hold 10,000 carrots at once.", null,
          { carrots: 200 }, atLeast(c => c.owned.carrots, 10000)),
    award("collection", "col_rich50", "Carrot Baron", "silver", "Hold 50,000 carrots at once.", null,
          { carrots: 800 }, atLeast(c => c.owned.carrots, 50000)),
    award("collection", "col_items", "Stocked Up", "bronze", "Hold a Carrot Juice, a Scout Ticket and a Scout Pass at once.",
          c => c.owned.itemKinds >= 3, { carrots: 150 }),

    // ---- scouting (what a pull brought, and the items)
    award("scouting", "sc_ten", "Ten at Once", "bronze", "Scout ten at once.",
          c => F(c, "ten") > 0, { carrots: 100 }),
    award("scouting", "sc_epic1", "Lucky Draw", "silver", "Draw an Epic card from a single scout.",
          c => F(c, "epicSingle") > 0, { carrots: 400 }),
    award("scouting", "sc_epic2", "Double Epic", "gold", "Draw two Epic cards in one ten-pull.",
          c => F(c, "epicTwo") > 0, { carrots: 1000 }),
    award("scouting", "sc_allnew", "All New", "silver", "Ten new cards from one ten-pull.",
          c => F(c, "allNew") > 0, { carrots: 400 }),
    award("scouting", "sc_3star", "Star Find", "silver", "Scout a 3-star racer.",
          c => F(c, "threeStar") > 0, { carrots: 500 }),
    award("scouting", "sc_3star2", "Starry Night", "gold", "Scout two 3-star racers in one ten-pull.",
          c => F(c, "threeTwo") > 0, { carrots: 2000 }),
    award("scouting", "sc_maxdupe", "Seen Her Before", "bronze", "Scout a racer who already has every passive.",
          c => F(c, "maxedDupe") > 0, { carrots: 200 }),
    award("scouting", "sc_ticket", "On the House", "bronze", "Use a Scout Ticket.",
          c => F(c, "used:cardTicket") > 0, { carrots: 100 }),
    award("scouting", "sc_pass", "Ten on the House", "bronze", "Use a Scout Pass.",
          c => F(c, "used:racerTicket") > 0, { carrots: 100 }),
    award("scouting", "sc_juice", "Refreshed", "bronze", "Drink a Carrot Juice.",
          c => F(c, "used:staminaDrink") > 0, { carrots: 100 }),

    // ---- decks (the saved decks are read live)
    award("decks", "dk_first", "First Deck", "bronze", "Build a deck.",
          c => c.life.decksBuilt >= 1 || c.owned.decks > 0, { carrots: 100 }),
    award("decks", "dk_doubles", "Doubled Up", "bronze", "Save a full 15-card deck that runs a card twice.",
          c => c.owned.deck.pairs >= 1, { carrots: 200 }),
    award("decks", "dk_pairs7", "Seven Pairs", "silver", "Save a full deck with seven cards doubled.", null,
          { carrots: 500 }, atLeast(c => c.owned.deck.pairs, 7)),
    award("decks", "dk_cheap", "Shoestring", "bronze", "Save a full deck that costs 2 or less on average.",
          c => c.owned.deck.cheap, { carrots: 200 }),
    award("decks", "dk_heavy", "Heavy Artillery", "silver", "Save a full deck that costs 4 or more on average.",
          c => c.owned.deck.heavy, { carrots: 400 }),
    award("decks", "dk_mono", "One-Track Mind", "silver", "Save a full deck of a single kind of card.",
          c => c.owned.deck.mono, { carrots: 500 }),
    award("decks", "dk_six", "A Bit of Everything", "bronze", "Save a full deck with all six kinds of card in it.",
          c => c.owned.deck.six, { carrots: 200 }),
    award("decks", "dk_five", "Options", "bronze", "Have five decks built for one racer.", null,
          { carrots: 200 }, atLeast(c => c.owned.deck.most, 5)),
    award("decks", "dk_auto", "Her Own Idea", "bronze", "Let a racer build her own deck.",
          c => c.life.autoBuilds >= 1, { carrots: 100 }),
    award("decks", "dk_plans", "Ready for Anything", "silver", "Let her plan a deck for every distance.", null,
          { carrots: 400 }, atLeast(c => FN(c, "plan:"), 4)),

    // ---- rivalries
    award("rivals", "rv_first", "First Clash", "bronze", "Lock eyes with a rival.",
          c => c.life.rivalries >= 1, { carrots: 100 }),
    award("rivals", "rv_zone", "In the Zone", "bronze", "Be drawn into a rivalry in the final third.",
          c => F(c, "zone") > 0, { carrots: 200 }),
    award("rivals", "rv_zone_win", "Won the Duel", "silver", "Win a rivalry that began in the final third.",
          c => F(c, "zoneWin") > 0, { carrots: 400 }),
    award("rivals", "rv_10", "Seen Them All", "silver", "Lock eyes with 10 different rivals.", null,
          { carrots: 600 }, atLeast(c => FN(c, "rival:"), 10)),
    award("rivals", "rv_20", "Everyone's Rival", "gold", "Lock eyes with 20 different rivals.", null,
          { carrots: 1500 }, atLeast(c => FN(c, "rival:"), 20)),
    ...PAIRS.map(([a, b]) => award("rivals", "rv_pair_" + slug(a) + "_" + slug(b), a + " vs " + b, "silver",
          `Race as one of them and lock eyes with the other.`, c => F(c, "pair:" + pairKey(a, b)) > 0, { carrots: 300 })),

    // ---- the academy and the tutorials
    award("academy", "ac_lesson", "First Lesson", "bronze", "Complete a tutorial.",
          c => c.owned.tutorials >= 1, { carrots: 100 }),
    award("academy", "tutorial_all", "Read the Manual", "bronze", "Complete every tutorial.",
          () => Stable.TUTORIALS.every(t => Stable.tutorialDone(t.id)), { carrots: 300 }),
    award("academy", "ac_tour", "Grand Tour", "silver", "Walk into every room of the academy.", null,
          { carrots: 300 }, inLobby(atLeast(c => ACADEMY_ROOMS.filter(r => c.life.rooms[r]).length, ACADEMY_ROOMS.length))),
    award("academy", "ac_school", "Back to School", "bronze", "Walk into the school wing.",
          c => !!c.life.rooms.school, { carrots: 100 }, inLobby({})),
    award("academy", "ac_dorm", "Home Away from Home", "bronze", "Step into a dorm room.",
          c => !!c.life.rooms.room, { carrots: 100 }, inLobby({})),
    award("academy", "ac_dorm8", "Good Neighbour", "silver", "Visit 8 different dorm rooms.", null,
          { carrots: 300 }, inLobby(atLeast(c => FN(c, "dorm:"), 8))),
    award("academy", "ac_dorm_all", "Every Door on the Corridor", "gold", `Visit all ${DORM_ROOMS} dorm rooms.`, null,
          { carrots: 1000 }, inLobby(atLeast(c => FN(c, "dorm:"), DORM_ROOMS))),
    award("academy", "ac_things10", "Making Yourself at Home", "silver", "Do 10 different things in the academy.", null,
          { carrots: 300 }, inLobby(atLeast(c => THINGS.filter(k => c.life.things[k]).length, 10))),
    award("academy", "ac_things_all", "Done It All", "gold", `Do all ${THINGS.length} things there are to do in the academy.`, null,
          { carrots: 800 }, inLobby(atLeast(c => THINGS.filter(k => c.life.things[k]).length, THINGS.length))),
    award("academy", "ac_lunch", "Lunch Break", "bronze", "Get some lunch in the cafeteria.",
          c => !!c.life.things.food, { carrots: 100 }, inLobby({})),
    award("academy", "ac_tea", "Tea's Up", "bronze", "Make tea in the trainer's office.",
          c => !!c.life.things.tea, { carrots: 100 }, inLobby({})),
    award("academy", "ac_jog", "A Lap of the Grounds", "bronze", "Go for a jog.",
          c => !!c.life.things.jog, { carrots: 100 }, inLobby({})),
    award("academy", "ac_jukebox", "Requests", "bronze", "Choose the music at the jukebox.",
          c => F(c, "jukebox") > 0, { carrots: 100 }, inLobby({})),
    award("academy", "ac_tracks10", "Music Lover", "silver", "Hear 10 different tracks.", null,
          { carrots: 300 }, Object.assign(atLeast(c => c.owned.tracks, 10), { when: c => c.owned.trackTotal > 0 })),
    award("academy", "ac_tracks_all", "Heard Them All", "gold", "Hear every track in the game.", null,
          { carrots: 1000 }, Object.assign(atLeast(c => c.owned.tracks, c => c.owned.trackTotal), { when: c => c.owned.trackTotal > 0 })),

    // ---- dedication: the boards themselves
    award("dedication", "dd_sweep", "Clean Sweep", "silver", "Claim every daily quest in one day.",
          c => F(c, "sweepDay") > 0, { carrots: 400 }),
    award("dedication", "dd_sweep7", "A Week of Sweeps", "gold", "Claim every daily quest on 7 different days.", null,
          { carrots: 1500 }, atLeast(c => F(c, "sweepDay"), 7)),
    award("dedication", "dd_week", "Perfect Week", "gold", "Claim every weekly quest in one week.",
          c => F(c, "sweepWeek") > 0, { carrots: 1500 }),
    award("dedication", "dd_tiers25", "Climber", "silver", "Claim 25 trainer-task tiers.", null,
          { carrots: 600 }, atLeast(c => c.owned.tiers, 25)),
    award("dedication", "dd_tiers100", "Top of the Ladders", "gold", "Claim 100 trainer-task tiers.", null,
          { carrots: 2000, items: T1 }, atLeast(c => c.owned.tiers, 100)),
    award("dedication", "dd_awards50", "Medal Case", "silver", "Earn 50 other awards.", null,
          { carrots: 800 }, atLeast(c => c.owned.awards, 50)),
    award("dedication", "dd_awards100", "Trophy Room", "gold", "Earn 100 other awards.", null,
          { carrots: 2000, items: T1 }, atLeast(c => c.owned.awards, 100)),

    // ---- secrets: "???" until earned, with a hint
    award("secrets", "sx_last", "Somebody Has to Be Last", "bronze", "Finish last.",
          c => F(c, "last") > 0, { carrots: 100 }, { hidden: true, hint: "Not every award is for winning." }),
    award("secrets", "sx_photo", "Photo Finish", "bronze", "Finish second by less than a fiftieth of a second.",
          c => F(c, "photo") > 0, { carrots: 200 }, { hidden: true, hint: "So close you would need the camera." }),
    award("secrets", "sx_night", "Night Owl", "bronze", "Finish a race between midnight and 4 a.m.",
          c => F(c, "night") > 0, { carrots: 150 }, { hidden: true, hint: "Mind the hour." }),
    award("secrets", "sx_early", "Early Bird", "bronze", "Finish a race between 5 and 7 a.m.",
          c => F(c, "early") > 0, { carrots: 150 }, { hidden: true, hint: "Up with the lark." }),
    award("secrets", "sx_bakushin", "Bakushin!", "silver", "Win a sprint with Sakura Bakushin O.",
          c => F(c, "win:sakura-bakushin-o:sprint") > 0, { carrots: 300 }, { hidden: true, hint: "The class rep, at full speed." }),
    award("secrets", "sx_urara", "Never Give Up", "silver", "Win a race with Haru Urara.",
          c => F(c, "win:urara") > 0, { carrots: 300 }, { hidden: true, hint: "The underdog's day." }),
    award("secrets", "sx_goldship", "Unsinkable", "gold", "Win from last at the final corner with Gold Ship.",
          c => F(c, "lastFirst:goldship") > 0, { carrots: 800 }, { hidden: true, hint: "Only she would try it." }),
    award("secrets", "sx_suzuka", "The View from the Front", "silver", "Lead at the final corner and win with Silence Suzuka.",
          c => F(c, "wire:suzuka") > 0, { carrots: 400 }, { hidden: true, hint: "Nobody sees her but the camera." }),
    award("secrets", "sx_oguri", "Bottomless", "bronze", "Sit down to 10 meals in the cafeteria.",
          c => c.life.meals >= 10, { carrots: 200 }, inLobby({ hidden: true, hint: "Oguri would approve." })),
    award("secrets", "sx_bin", "Tidy", "bronze", "Throw a can away.",
          c => !!c.life.things.bin, { carrots: 100 }, inLobby({ hidden: true, hint: "Leave the hall as you found it." })),
    award("secrets", "sx_nap", "Forty Winks", "bronze", "Take a nap.",
          c => !!c.life.things.nap, { carrots: 100 }, inLobby({ hidden: true, hint: "Racing is tiring." })),
  ];
  // a counted award is earned when its count reaches the target
  for (const a of AWARDS) if (!a.check) a.check = c => { const [h, n] = a.goal(c); return n > 0 && h >= n; };

  // ---------------------------------------------------------------- quests
  /* A quest reads one number off the counter bag: `stat` in its `scope`, or `value(c)`
     when it needs more than one counter. `when(c)`, if given, keeps it off the board until
     it can be done at all.

     Dailies are sized so every one fits in a normal day -- a career session, a handful of
     exhibitions, a scout, a walk round the academy -- and validate-economy plays exactly
     that day through to prove it. Each pays 60-120; the whole board about half a URA
     Finale. Weeklies are the week's real goals and pay a few hundred to a thousand each,
     with the items. */
  const DAILY = [
    { id: "d_race",   name: "Get out there",     desc: "Run 3 races, career or exhibition.",  scope: "day", stat: "races",       goal: 3,  reward: { carrots: 80 } },
    { id: "d_win",    name: "Make it count",     desc: "Win 2 races.",                        scope: "day", stat: "wins",        goal: 2,  reward: { carrots: 120 } },
    { id: "d_podium", name: "In the frame",      desc: "Finish in the top three 3 times.",    scope: "day", stat: "podiums",     goal: 3,  reward: { carrots: 80 } },
    { id: "d_exhib",  name: "Exhibition day",    desc: "Run 2 Normal Exhibitions.",           scope: "day", stat: "exNormal",    goal: 2,  reward: { carrots: 80 } },
    { id: "d_dream",  name: "Dream rehearsal",   desc: "Run a Dream Exhibition.",             scope: "day", stat: "exDream",     goal: 1,  reward: { carrots: 80 } },
    { id: "d_train",  name: "Put in the work",   desc: "Complete 10 training turns.",         scope: "day", stat: "trainings",   goal: 10, reward: { carrots: 80 } },
    { id: "d_crace",  name: "Race day",          desc: "Run 2 races in a career.",            scope: "day", stat: "careerRaces", goal: 2,  reward: { carrots: 80 } },
    { id: "d_scout",  name: "Fresh blood",       desc: "Scout once.",                         scope: "day", stat: "scouts",      goal: 1,  reward: { carrots: 100 } },
    { id: "d_callout",name: "Right on cue",      desc: "Use a Callout well: in the run-in of a Dream race, or both spent with 6 cards played.",
                                                                                              scope: "day", stat: "calloutsWell",goal: 1,  reward: { carrots: 80 } },
    { id: "d_rival",  name: "Eye to eye",        desc: "Be drawn into a rivalry.",            scope: "day", stat: "rivalries",   goal: 1,  reward: { carrots: 80 } },
    { id: "d_deck",   name: "Deck work",         desc: "Save a deck, or let her build one.",  scope: "day", value: c => c.day.decksSaved + c.day.autoBuilds,
                                                                                                                                 goal: 1,  reward: { carrots: 60 } },
    { id: "d_lobby",  name: "Around the academy",desc: "Do 3 different things in the academy: sit down, buy a drink, make tea, choose the music.",
                                                                                              scope: "day", value: c => size(c.day.things), goal: 3, reward: { carrots: 60 }, when: academy },
    { id: "d_rounds", name: "Make the rounds",   desc: "Walk through to 3 rooms beyond the main hall.",
                                                                                              scope: "day", value: c => roomsBeyond(c.day), goal: 3, reward: { carrots: 60 }, when: academy },
    { id: "d_sweep",  name: "Busy day",          desc: "Claim 8 other daily quests.",         scope: "day", stat: "dailyClaims", goal: 8,  reward: { carrots: 100, items: { staminaDrink: 1 } } },
  ];
  const WEEKLY = [
    { id: "w_wins",    name: "A good week",       desc: "Win 10 races.",                      scope: "week", stat: "wins",         goal: 10, reward: { carrots: 400, items: { cardTicket: 1 } } },
    { id: "w_races",   name: "Race fit",          desc: "Run 30 races.",                      scope: "week", stat: "races",        goal: 30, reward: { carrots: 250, items: { staminaDrink: 1 } } },
    { id: "w_podium",  name: "Always in the frame",desc: "Finish in the top three 15 times.", scope: "week", stat: "podiums",      goal: 15, reward: { carrots: 250 } },
    { id: "w_exhib",   name: "Exhibition circuit",desc: "Run 15 exhibition races.",           scope: "week", stat: "exhibitions",  goal: 15, reward: { carrots: 250 } },
    { id: "w_dream",   name: "Dream week",        desc: "Run 5 Dream Exhibitions.",           scope: "week", stat: "exDream",      goal: 5,  reward: { carrots: 250, items: { staminaDrink: 1 } } },
    { id: "w_g1",      name: "Big-race day",      desc: "Win a G1 race in a career.",         scope: "week", stat: "g1Wins",       goal: 1,  reward: { carrots: 400, items: { cardTicket: 1 } } },
    { id: "w_career",  name: "See it through",    desc: "Finish a career.",                   scope: "week", stat: "careersFinished", goal: 1, reward: { carrots: 1000, items: { cardTicket: 1 } } },
    { id: "w_summit",  name: "The long climb",    desc: "Finish a Dream Trophy run.",         scope: "week", stat: "dreamFinished",goal: 1,  reward: { carrots: 700, items: { cardTicket: 1 } } },
    { id: "w_train",   name: "Long hours",        desc: "Complete 60 training turns.",        scope: "week", stat: "trainings",    goal: 60, reward: { carrots: 250 } },
    { id: "w_scout",   name: "Talent search",     desc: "Scout 10 times.",                    scope: "week", stat: "scouts",       goal: 10, reward: { carrots: 400, items: { staminaDrink: 1 } } },
    { id: "w_dupe",    name: "Familiar face",     desc: "Scout a racer you already have.",    scope: "week", stat: "racerDupes",   goal: 1,  reward: { carrots: 300 } },
    { id: "w_passive", name: "Coming into her own",desc: "Unlock a passive with a duplicate.",scope: "week", stat: "passivesUnlocked", goal: 1, reward: { carrots: 400 } },
    { id: "w_callout", name: "Called it",         desc: "Use Callouts well in 8 races.",      scope: "week", stat: "calloutsWell", goal: 8,  reward: { carrots: 250 } },
    { id: "w_rival",   name: "Rivalry week",      desc: "Win 5 rivalries: finish ahead of the racer you locked eyes with.",
                                                                                              scope: "week", stat: "rivalWins",    goal: 5,  reward: { carrots: 300 } },
    { id: "w_deck",    name: "Workshop",          desc: "Save 3 decks, or let her build them.",scope: "week", value: c => c.week.decksSaved + c.week.autoBuilds,
                                                                                                                                   goal: 3,  reward: { carrots: 200 } },
    { id: "w_lobby",   name: "Part of the furniture", desc: "Do 20 things around the academy.", scope: "week", stat: "lobbyThings", goal: 20, reward: { carrots: 200 }, when: academy },
    { id: "w_daily",   name: "Every day counts",  desc: "Claim 30 daily quests.",             scope: "week", stat: "dailyClaims",  goal: 30, reward: { carrots: 500, items: { cardTicket: 1 } } },
    /* Tutorials happen once, so this one is only on the board while some are left (or one
       was finished this week). It reads the stable, which knows when each was done. */
    { id: "w_tut",     name: "Back to class",     desc: "Complete a tutorial.",               scope: "week", value: c => c.owned.tutorialsWeek, goal: 1, reward: { carrots: 200 },
      when: c => c.owned.tutorialsLeft > 0 || c.owned.tutorialsWeek > 0 },
  ];
  function roomsBeyond(bag) { return size(bag.rooms) - (bag.rooms && bag.rooms.hall ? 1 : 0); }

  // ---------------------------------------------------------------- trainer tasks
  /* First steps: one-time tasks that walk a new trainer through the game in the right
     order. The first six are the original trainer tasks, ids unchanged, so a claim made
     before the chains existed still stands. */
  const FIRST = [
    { id: "p_starter", name: "Choose a partner", desc: "Pick your starter racer.",          scope: "life", stat: "starterPicked", goal: 1, reward: { carrots: 200 } },
    { id: "p_deck",    name: "Build a deck",     desc: "Save a full 15-card deck.",         scope: "life", stat: "fullDecks",     goal: 1, reward: { carrots: 200 } },
    { id: "p_scout",   name: "First scout",      desc: "Scout a card or a racer.",          scope: "life", stat: "scouts",        goal: 1, reward: { carrots: 150 } },
    { id: "p_exhib",   name: "To the gate",      desc: "Run an exhibition race.",           scope: "life", stat: "exhibitions",   goal: 1, reward: { carrots: 150 } },
    { id: "p_career",  name: "Begin a career",   desc: "Start a career run.",               scope: "life", stat: "careers",       goal: 1, reward: { carrots: 300 } },
    { id: "p_classic", name: "Into the Classic", desc: "Reach Classic year in a career.",   scope: "life", stat: "reachedClassic",goal: 1, reward: { carrots: 400 } },
    { id: "p_ura",     name: "The big stage",    desc: "Reach the URA Finale.",             scope: "life", stat: "reachedUra",    goal: 1, reward: { carrots: 800, items: { cardTicket: 1 } } },
    { id: "p_dream",   name: "Dream rules",      desc: "Run a Dream Exhibition.",           scope: "life", stat: "exDream",       goal: 1, reward: { carrots: 150 } },
    { id: "p_rival",   name: "Locked eyes",      desc: "Be drawn into a rivalry.",          scope: "life", stat: "rivalries",     goal: 1, reward: { carrots: 150 } },
    { id: "p_rounds",  name: "Find your way",    desc: "Visit the office, the cafeteria and the dorm.",
                                                                                            scope: "life", value: c => roomsBeyond(c.life), goal: 3, reward: { carrots: 150 }, when: academy },
  ];

  /* The chains. Each is one number and a ladder of targets; the tiers are claimed in
     order and pay on a shared schedule (TIER_PAY) scaled by the chain's weight -- 1 for
     the ordinary ladders, more where the climb is steep, less where it is a stroll -- so
     every ladder pays more at the top than at the bottom without twenty tables to keep
     in step. A chain whose number matches an award starts its ladder above it. */
  const CATEGORIES = [
    { id: "racing",     name: "Racing" },
    { id: "careers",    name: "Careers" },
    { id: "dream",      name: "Dream Trophy" },
    { id: "collection", name: "Collection" },
    { id: "scouting",   name: "Scouting" },
    { id: "decks",      name: "Decks" },
    { id: "craft",      name: "Race craft" },
    { id: "rivals",     name: "Rivalries" },
    { id: "academy",    name: "Academy" },
    { id: "dedication", name: "Dedication" },
  ];
  const L = k => c => c.life[k] || 0;
  const O = k => c => c.owned[k] || 0;
  const CHAINS = [
    // racing
    { id: "t_races",    cat: "racing", name: "Miles on the clock", desc: "Run {n} races.",                        value: L("races"),       tiers: [10, 50, 150, 400, 1000], weight: 1 },
    { id: "t_wins",     cat: "racing", name: "First past the post", desc: "Win {n} races.",                       value: L("wins"),        tiers: [5, 25, 75, 200, 500],    weight: 1.2 },
    { id: "t_podiums",  cat: "racing", name: "In the money",       desc: "Finish in the top three {n} times.",    value: L("podiums"),     tiers: [10, 50, 150, 400, 1000], weight: 1 },
    { id: "t_exhib",    cat: "racing", name: "Exhibition regular", desc: "Run {n} exhibition races.",             value: L("exhibitions"), tiers: [10, 50, 150, 400],       weight: 0.8 },
    { id: "t_exwins",   cat: "racing", name: "Showpiece",          desc: "Win {n} exhibition races.",             value: L("exWins"),      tiers: [5, 25, 75, 200],         weight: 1 },
    { id: "t_dists",    cat: "racing", name: "Any distance",       desc: "Win {n} races at every distance: sprint, mile, medium and long.",
                                                                    value: c => minOver(c.life.distWins, DISTS),              tiers: [3, 10, 25, 60],          weight: 1.5 },
    { id: "t_styles",   cat: "racing", name: "Any way round",      desc: "Win {n} races with every running style.",
                                                                    value: c => minOver(c.life.styleWins, STYLES),            tiers: [3, 10, 25],              weight: 1.5 },
    // careers
    { id: "t_careers",  cat: "careers", name: "Seen it through",   desc: "Finish {n} careers.",                   value: L("careersFinished"), tiers: [3, 10, 25, 50, 100], weight: 1.5 },
    { id: "t_train",    cat: "careers", name: "Training log",      desc: "Complete {n} training turns.",          value: L("trainings"),   tiers: [100, 400, 1200, 3000, 7500], weight: 1 },
    { id: "t_cwins",    cat: "careers", name: "Race record",       desc: "Win {n} races in careers.",             value: L("careerWins"),  tiers: [10, 40, 120, 300, 750],  weight: 1 },
    { id: "t_g1",       cat: "careers", name: "Big-race winner",   desc: "Win {n} G1 races.",                     value: L("g1Wins"),      tiers: [3, 10, 30, 75, 150],     weight: 1.5 },
    { id: "t_ura",      cat: "careers", name: "Finale regular",    desc: "Win the URA Finale {n} times.",         value: L("champions"),   tiers: [2, 5, 10, 20],           weight: 2 },
    // dream trophy
    { id: "t_dfinish",  cat: "dream", name: "The long climb",      desc: "Finish {n} Dream Trophy runs.",         value: L("dreamFinished"), tiers: [1, 3, 10, 25, 50],     weight: 1.5 },
    { id: "t_dwins",    cat: "dream", name: "Dream racer",         desc: "Win {n} races in the Dream Trophy.",    value: L("dreamWins"),   tiers: [5, 25, 75, 200, 500],    weight: 1.2 },
    { id: "t_dchamp",   cat: "dream", name: "Top of the world",    desc: "Win the Dream Trophy {n} times.",       value: L("dreamChampions"), tiers: [2, 5, 10, 20],        weight: 3 },
    { id: "t_dex",      cat: "dream", name: "Dream rehearsals",    desc: "Run {n} Dream Exhibitions.",            value: L("exDream"),     tiers: [5, 25, 75, 200],         weight: 0.8 },
    // collection (read live from the stable)
    { id: "t_cards",    cat: "collection", name: "Card binder",    desc: "Own {n} different cards.",              value: O("cards"),       tiers: [20, 35, 65, 90],         weight: 1 },
    { id: "t_racers",   cat: "collection", name: "Full house",     desc: "Own {n} racers.",                       value: O("racers"),      tiers: [5, 10, 15, 20],          weight: 1.5 },
    { id: "t_passives", cat: "collection", name: "Awakening",      desc: "Unlock {n} passives across your racers.", value: O("passives"),  tiers: [1, 5, 15, 30, 60],       weight: 1.2 },
    { id: "t_awake",    cat: "collection", name: "Fully awakened", desc: "Unlock every passive on {n} racers.",   value: O("awakened"),    tiers: [1, 3, 8, 15],            weight: 1.5 },
    { id: "t_roster",   cat: "collection", name: "Open roster",    desc: "Unlock {n} racers for the scout.",      value: O("unlocked"),    tiers: [8, 12, 18, 24],          weight: 1 },
    // scouting
    { id: "t_scouts",   cat: "scouting", name: "Talent scout",     desc: "Scout {n} times.",                      value: L("scouts"),      tiers: [10, 50, 150, 400, 1000], weight: 1 },
    { id: "t_rscouts",  cat: "scouting", name: "Recruiter",        desc: "Scout a racer {n} times.",              value: L("racerScouts"), tiers: [10, 40, 120, 300],       weight: 1.2 },
    { id: "t_dupes",    cat: "scouting", name: "Familiar faces",   desc: "Scout {n} racers you already have.",    value: L("racerDupes"),  tiers: [5, 20, 60, 150],         weight: 1.2 },
    // decks
    { id: "t_decks",    cat: "decks", name: "Deck builder",        desc: "Build {n} new decks.",                  value: L("decksBuilt"),  tiers: [2, 5, 12, 25],           weight: 0.8 },
    { id: "t_auto",     cat: "decks", name: "Let her decide",      desc: "Let a racer build her own deck {n} times.", value: L("autoBuilds"), tiers: [1, 5, 15, 40],        weight: 0.6 },
    { id: "t_deckfor",  cat: "decks", name: "Everyone ready",      desc: "Have a deck built for {n} different racers.", value: O("deckRacers"), tiers: [2, 5, 10, 20],      weight: 1 },
    // race craft
    { id: "t_callouts", cat: "craft", name: "Voice of the stable", desc: "Use {n} Callouts.",                     value: L("callouts"),    tiers: [10, 50, 200, 500, 1200], weight: 0.8 },
    { id: "t_well",     cat: "craft", name: "Right on cue",        desc: "Use Callouts well in {n} races.",       value: L("calloutsWell"),tiers: [5, 25, 75, 200],         weight: 1 },
    { id: "t_runin",    cat: "craft", name: "Into the run-in",     desc: "Use {n} Callouts in the run-in of a Dream race.", value: L("runInCalls"), tiers: [5, 25, 75, 200], weight: 1 },
    // rivalries
    { id: "t_rivals",   cat: "rivals", name: "Eye to eye",         desc: "Be drawn into {n} rivalries.",          value: L("rivalries"),   tiers: [3, 15, 50, 150, 400],    weight: 1 },
    { id: "t_rivalwins",cat: "rivals", name: "Got the better of her", desc: "Win {n} rivalries.",                 value: L("rivalWins"),   tiers: [1, 10, 30, 100, 250],    weight: 1.2 },
    // academy
    { id: "t_things",   cat: "academy", name: "Part of the place", desc: "Do {n} things around the academy.",     value: L("lobbyThings"), tiers: [10, 50, 150, 400],       weight: 0.6, when: academy },
    { id: "t_rooms",    cat: "academy", name: "Know your way around", desc: "Visit {n} of the academy's rooms.",  value: c => size(c.life.rooms), tiers: [3, 5],             weight: 0.5, when: academy },
    { id: "t_meals",    cat: "academy", name: "Cafeteria regular", desc: "Sit down to {n} meals in the cafeteria.", value: L("meals"),     tiers: [3, 15, 50],              weight: 0.5, when: academy },
    { id: "t_lessons",  cat: "academy", name: "Top of the class",  desc: "Complete {n} tutorials.",               value: O("tutorials"),   tiers: [1, 3, 5],                weight: 0.6 },
    // dedication
    { id: "t_daily",    cat: "dedication", name: "Daily rounds",   desc: "Claim {n} daily quests.",               value: L("dailyClaims"), tiers: [10, 50, 150, 400, 1000], weight: 1 },
    { id: "t_weekly",   cat: "dedication", name: "Week in, week out", desc: "Claim {n} weekly quests.",           value: L("weeklyClaims"),tiers: [5, 25, 75, 200],         weight: 1.2 },
    { id: "t_level",    cat: "dedication", name: "Seasoned",       desc: "Raise a racer to level {n}.",           value: O("topLevel"),    tiers: [5, 10, 20, 30, 40],      weight: 1 },
  ];
  /* What a tier pays, by its place on the ladder (I to V), before the chain's weight.
     Carrots double each step; items join from III, and V brings a Scout Pass. */
  const TIER_PAY = [
    { carrots: 100 },
    { carrots: 250 },
    { carrots: 500,  items: { cardTicket: 1 } },
    { carrots: 1000, items: { cardTicket: 2 } },
    { carrots: 2000, items: { racerTicket: 1 } },
  ];
  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
  function tierReward(ch, i) {
    const p = TIER_PAY[Math.min(i, TIER_PAY.length - 1)];
    const r = { carrots: Math.max(50, Math.round(p.carrots * ch.weight / 50) * 50) };
    if (p.items) r.items = Object.assign({}, p.items);
    return r;
  }
  const tierDesc = (ch, n) => ch.desc.replace("{n}", n.toLocaleString("en-US"));
  for (const ch of CHAINS) ch.rewards = ch.tiers.map((n, i) => tierReward(ch, i));

  const ALL_QUESTS = DAILY.concat(WEEKLY, FIRST);
  const questById = id => ALL_QUESTS.find(q => q.id === id) || null;
  const chainById = id => CHAINS.find(c => c.id === id) || null;

  // ---------------------------------------------------------------- state
  const KEY = () => {
    const id = (root.Auth && Auth.current && Auth.current()) ? Auth.current().id : "guest";
    return "postparade.quests." + id;
  };
  const VERSION = 3;

  const blankCounters = () => ({
    races: 0, wins: 0, podiums: 0, g1Wins: 0,
    exhibitions: 0, exNormal: 0, exDream: 0, exWins: 0, exNormalWins: 0, exDreamWins: 0,
    careerRaces: 0, careerWins: 0, dreamRaces: 0, dreamWins: 0,
    trainings: 0, careers: 0, uraStarts: 0, dreamStarts: 0,
    careersFinished: 0, uraFinished: 0, dreamFinished: 0,
    champions: 0, uraWins: 0, dreamChampions: 0,
    scouts: 0, cardScouts: 0, racerScouts: 0, newCards: 0, newRacers: 0, racerDupes: 0, passivesUnlocked: 0,
    decksBuilt: 0, decksSaved: 0, fullDecks: 0, autoBuilds: 0,
    callouts: 0, runInCalls: 0, calloutsWell: 0,
    rivalries: 0, rivalWins: 0,
    lobbyThings: 0, meals: 0, drinks: 0,
    dailyClaims: 0, weeklyClaims: 0,
    starterPicked: 0, reachedClassic: 0, reachedUra: 0,
    maxStat: 0, maxFans: 0, bestRating: 0, bestGrade: "",
    styleWins: {}, distWins: {}, rooms: {}, things: {},
    streak: 0, podStreak: 0,         // wins and top threes in a row, as they stand
    feats: {}, best: {},             // lifetime only: see feats()
  });

  function blank() {
    return {
      v: VERSION,
      life: blankCounters(),
      day: blankCounters(), dayKey: dayKey(),
      week: blankCounters(), weekKey: weekKey(),
      awards: {},          // id -> ts unlocked
      claimed: {},         // questId -> ts claimed (period-stamped for day/week)
      tiers: {},           // chainId -> how many of its tiers are claimed
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
    if (!saved) cache.v = VERSION;
    else if (!(saved.v >= 1)) cache.v = 1;                  // written before saves were versioned
    cache.life = Object.assign(blankCounters(), cache.life || {});
    cache.day = Object.assign(blankCounters(), cache.day || {});
    cache.week = Object.assign(blankCounters(), cache.week || {});
    cache.awards = cache.awards || {};
    cache.claimed = cache.claimed || {};
    cache.tiers = cache.tiers || {};
    cache.log = cache.log || [];
    cacheKey = k;
    if (cache.v < VERSION) { migrate(cache); try { localStorage.setItem(k, JSON.stringify(cache)); } catch (e) {} }
    rollPeriods();
    return cache;
  }

  /* An older save, brought forward. Nothing it holds is dropped: awards, claims and every
     counter stay as they were. What it never counted is filled in from what the game does
     know, where it knows it:
       - exhibitions were never reported here, only career races, but the account has
         counted every race and win since it was made, so the difference is exhibitions;
       - the old "Build a deck" task read a counter nothing bumped: the decks already saved
         are credited, so it can be claimed;
       - every win was a podium. */
  function migrate(s) {
    const T = s.life;
    if (s.v < 2) migrate2(s, T);
    /* v3: the medal case grew to ~200. Per-racer titles and unbeaten runs are credited
       from the veterans the legacy keeps (its last 60 careers). */
    if (s.v < 3) {
      let Leg = root.Legacy;
      if (!Leg && typeof require !== "undefined") { try { Leg = require("./legacy.js"); } catch (e) { Leg = null; } }
      let vets = [];
      try { vets = Leg && Leg.veterans ? Leg.veterans() : []; } catch (e) {}
      const F = T.feats;
      for (const v of vets) {
        if (v.ending !== "failed") F.goals = (F.goals || 0) + 1;
        if (v.ending === "champion" && v.racerId) {
          const k = (v.scenario === "dream" ? "dream:" : "ura:") + v.racerId;
          F[k] = (F[k] || 0) + 1;
          if (v.races && v.wins >= v.races) F.unbeaten = (F.unbeaten || 0) + 1;
        }
      }
    }
    s.v = VERSION;
  }
  function migrate2(s, T) {
    T.careerRaces = Math.max(T.careerRaces, T.races);
    T.careerWins = Math.max(T.careerWins, T.wins);
    const acct = root.Auth && Auth.current ? Auth.current() : null;
    if (acct) {
      T.exhibitions = Math.max(T.exhibitions, (acct.races || 0) - T.careerRaces);
      T.exWins = Math.max(T.exWins, (acct.wins || 0) - T.careerWins);
      T.races = Math.max(T.races, acct.races || 0);
      T.wins = Math.max(T.wins, acct.wins || 0);
    }
    T.podiums = Math.max(T.podiums, T.wins);
    const decks = Stable.decks();
    T.decksBuilt = Math.max(T.decksBuilt, decks.length);
    T.decksSaved = Math.max(T.decksSaved, decks.length);
    T.fullDecks = Math.max(T.fullDecks, decks.filter(d => (d.cards || []).length >= Stable.DECK_MAX).length);
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

  /** The bag every check reads: the counters, plus live numbers off the stable. */
  function ctx() {
    const s = load(), sum = Stable.summary(), st = Stable.load();
    const ids = Stable.ownedIds();
    const since = weekStart().getTime();
    const tut = st.tutorials || {};
    return { life: s.life, day: s.day, week: s.week,
             owned: { racers: sum.racers, rosterTotal: sum.rosterTotal,
                      cards: sum.cards, cardTotal: sum.cardTotal, unlocked: sum.unlocked,
                      passives: ids.reduce((a, id) => a + Stable.passivesOf(id), 0),
                      awakened: ids.filter(id => Stable.passiveSlotsOf(id) > 0 && Stable.passivesMaxed(id)).length,
                      topLevel: ids.reduce((a, id) => Math.max(a, (st.racers[id] && st.racers[id].level) || 1), 0),
                      deckRacers: new Set(Stable.decks().map(d => d.racerId).filter(Boolean)).size,
                      tutorials: Stable.TUTORIALS.filter(t => tut[t.id]).length,
                      tutorialsLeft: Stable.TUTORIALS.filter(t => !tut[t.id]).length,
                      tutorialsWeek: Stable.TUTORIALS.filter(t => tut[t.id] >= since).length,
                      ...collection(s, st, ids) } };
  }

  /** The rest of what the medal case reads off the stable: the binder by kind and rarity,
      the stable by stars, outfits, the purse, the saved decks, the jukebox. */
  function collection(s, st, ids) {
    const byKind = {}, kindTotal = {}, byRarity = { C: 0, R: 0, E: 0 }, rarityTotal = { C: 0, R: 0, E: 0 };
    let doubles = 0;
    for (const card of Cards.CARDS) {
      const n = (st.cards || {})[card.id] || 0;
      kindTotal[card.kind] = (kindTotal[card.kind] || 0) + 1;
      rarityTotal[card.rarity] = (rarityTotal[card.rarity] || 0) + 1;
      if (n) { byKind[card.kind] = (byKind[card.kind] || 0) + 1; byRarity[card.rarity] = (byRarity[card.rarity] || 0) + 1; }
      if (n >= 2) doubles++;
    }
    const racersBy = { 1: 0, 2: 0, 3: 0 }, racerTotal = { 1: 0, 2: 0, 3: 0 };
    for (const r of Stable.ROSTER) {
      const k = Stable.rarityOf(r.id);
      racerTotal[k]++;
      if (Stable.owns(r.id)) racersBy[k]++;
    }
    // the full decks: their best pairs, and whether any is cheap, heavy, one kind or all six
    const deck = { pairs: 0, cheap: false, heavy: false, mono: false, six: false, most: 0 };
    const decks = Stable.decks(), per = {};
    for (const d of decks) {
      per[d.racerId] = (per[d.racerId] || 0) + 1;
      const cards = (d.cards || []).map(id => Cards.byId[id]).filter(Boolean);
      if (cards.length < Stable.DECK_MAX) continue;
      const seen = {};
      for (const c of cards) seen[c.id] = (seen[c.id] || 0) + 1;
      deck.pairs = Math.max(deck.pairs, Object.values(seen).filter(n => n >= 2).length);
      const avg = cards.reduce((a, c) => a + c.cost, 0) / cards.length;
      const kinds = new Set(cards.map(c => c.kind)).size;
      if (avg <= 2) deck.cheap = true;
      if (avg >= 4) deck.heavy = true;
      if (kinds === 1) deck.mono = true;
      if (kinds >= KINDS.length) deck.six = true;
    }
    deck.most = Math.max(0, ...Object.values(per));
    let tracks = 0, trackTotal = 0;
    try {
      if (root.Sound && Sound.jukebox) {
        const J = Sound.jukebox();
        tracks = J.tracks.filter(t => t.heard).length; trackTotal = J.tracks.length;
      }
    } catch (e) {}
    return {
      byKind, kindTotal, byRarity, rarityTotal, doubles, racersBy, racerTotal,
      starters: Stable.STARTERS.filter(id => Stable.owns(id)).length, starterTotal: Stable.STARTERS.length,
      awakened3: ids.filter(id => Stable.rarityOf(id) === 3 && Stable.passiveSlotsOf(id) > 0 && Stable.passivesMaxed(id)).length,
      dressed: ids.filter(id => st.racers[id] && st.racers[id].outfit && st.racers[id].outfit !== "o0").length,
      carrots: st.carrots || 0,
      itemKinds: Stable.ITEMS.filter(i => ((st.items || {})[i.id] || 0) > 0).length,
      decks: decks.length, deck, tracks, trackTotal,
      courses: ((Roster && Roster.COURSES) || []).length,
      tiers: Object.values(s.tiers || {}).reduce((a, n) => a + n, 0),
      awards: Object.keys(s.awards || {}).length,
    };
  }

  // ---------------------------------------------------------------- recording
  /* What each event adds, given how many (`n`) and what came with it (`d`). Kept as data so
     adding an event is one line and every scope stays in step automatically.

     Races carry `place` (a top three is a podium) and, from a career, `scenario`; an
     exhibition carries `mode`. A scout carries the pull's `results`, which say what was
     new, what was a duplicate and what that duplicate unlocked. */
  const dream = d => d.scenario === "dream" ? 1 : 0;
  const top3 = d => d.place != null && d.place <= 3 ? 1 : 0;
  const count = (list, f) => (list || []).filter(f).length;
  const EVENTS = {
    // a career race (ui-career.js)
    race:        (n, d) => ({ races: n, careerRaces: n, dreamRaces: dream(d) * n, podiums: top3(d) * n }),
    raceWin:     (n, d) => ({ races: n, wins: n, podiums: n, careerRaces: n, careerWins: n,
                              dreamRaces: dream(d) * n, dreamWins: dream(d) * n }),
    // an exhibition (index.html): Normal or Dream
    exRace:      (n, d) => ({ races: n, exhibitions: n, exNormal: d.mode === "dream" ? 0 : n,
                              exDream: d.mode === "dream" ? n : 0, podiums: top3(d) * n }),
    exWin:       (n, d) => ({ races: n, wins: n, podiums: n, exhibitions: n, exWins: n,
                              exNormal: d.mode === "dream" ? 0 : n, exDream: d.mode === "dream" ? n : 0,
                              exNormalWins: d.mode === "dream" ? 0 : n, exDreamWins: d.mode === "dream" ? n : 0 }),
    g1Win:       n => ({ g1Wins: n }),
    train:       n => ({ trainings: n }),
    careerStart: (n, d) => ({ careers: n, dreamStarts: dream(d) * n, uraStarts: (1 - dream(d)) * n }),
    careerEnd:   (n, d) => ({ careersFinished: n, dreamFinished: dream(d) * n, uraFinished: (1 - dream(d)) * n }),
    uraWin:      n => ({ uraWins: n }),
    champion:    n => ({ champions: n }),
    dreamChampion: n => ({ dreamChampions: n }),           // the Dream Trophy's Grand Final
    scoutCard:   (n, d) => ({ scouts: n, cardScouts: n, newCards: count(d.results, r => r.isNew) }),
    scoutRacer:  (n, d) => ({ scouts: n, racerScouts: n, newRacers: count(d.results, r => r.isNew),
                              racerDupes: count(d.results, r => !r.isNew),
                              passivesUnlocked: count(d.results, r => r.passive) }),
    // a deck saved (stable.js): `created` for a new one, `full` at fifteen cards
    deckSaved:   (n, d) => ({ decksSaved: n, decksBuilt: d.created ? n : 0, fullDecks: d.full ? n : 0 }),
    deckAuto:    n => ({ autoBuilds: n }),                   // "Let her decide"
    // the race (index.html): every Callout, whether a Dream race's was in the run-in
    callout:     (n, d) => ({ callouts: n, runInCalls: d.runIn ? n : 0 }),
    calloutWell: n => ({ calloutsWell: n }),
    rivalry:     n => ({ rivalries: n }),
    rivalWin:    n => ({ rivalries: n, rivalWins: n }),     // she finished ahead of her rival
    // the academy (lobby.js): something she did there, by its kind
    lobbyThing:  (n, d) => ({ lobbyThings: n, meals: d.kind === "food" ? n : 0,
                              drinks: d.kind === "vend" || d.kind === "tea" ? n : 0 }),
    starter:     n => ({ starterPicked: n }),
    classic:     n => ({ reachedClassic: n }),
    ura:         n => ({ reachedUra: n }),
  };

  /**
   * The one entry point. `data` may carry `n` (how many), `place`, `scenario`, `mode`,
   * `results`, `style`, `dist`, `stat`, `fans`, `rating`, `grade`, `kind`, `room`. Returns
   * whatever this call unlocked, so the caller can celebrate it.
   */
  function record(event, data) {
    data = data || {};
    const s = load();
    const fn = EVENTS[event];
    const scopes = [s.life, s.day, s.week];
    if (fn) {
      const add = fn(data.n == null ? 1 : data.n, data);
      for (const bag of scopes) for (const k in add) if (add[k]) bag[k] = (bag[k] || 0) + add[k];
    }
    // sets: which styles and distances she has won at, which rooms she has walked into and
    // what she has done there
    for (const bag of scopes) {
      if (event === "raceWin" || event === "exWin") {
        if (data.style) bag.styleWins[data.style] = (bag.styleWins[data.style] || 0) + 1;
        if (data.dist)  bag.distWins[data.dist]   = (bag.distWins[data.dist]   || 0) + 1;
      }
      if (event === "lobbyRoom" && data.room) bag.rooms[data.room] = (bag.rooms[data.room] || 0) + 1;
      if (event === "lobbyThing" && data.kind) bag.things[data.kind] = (bag.things[data.kind] || 0) + 1;
    }
    // maxima, lifetime only -- "best ever" is not a daily concept
    const T = s.life;
    if (data.stat   != null) T.maxStat    = Math.max(T.maxStat, data.stat);
    if (data.fans   != null) T.maxFans    = Math.max(T.maxFans, data.fans);
    if (data.rating != null) T.bestRating = Math.max(T.bestRating, data.rating);
    if (data.grade) {
      const order = ["E", "D", "C", "B", "A", "S", "SS"];
      if (order.indexOf(data.grade) > order.indexOf(T.bestGrade)) T.bestGrade = data.grade;
    }
    feats(T, event, data);
    save();
    return { awards: checkAwards() };
  }

  const bare = n => String(n || "").replace(/​/g, "");
  const idOfName = n => { const r = Stable.ROSTER.find(x => x.name === bare(n)); return r ? r.id : null; };

  /**
   * Feats: what a race, a scout, a career or a walk round the academy was like, beyond how
   * many -- kept as keys in `life.feats` (a count each) and best-ever numbers in `life.best`.
   * `raceDone` (index.html, career race or exhibition) carries the race's facts: `place`,
   * `field`, `margin` (seconds: to second place in a win, to the winner otherwise),
   * `corner` (her place at the final corner, two-thirds of the trip), `exhausted`, `hp`
   * (stamina left, 0-1), `surface`, `dist`, `course` (exhibitions only), `weather`, `season`
   * and `ground` (the going) where the race has them, `played` (cards),
   * `unspent` (a Normal race with both Callouts still in hand), `runIn` (Callouts called in
   * a Dream race's run-in), and her `name`.
   */
  function feats(T, event, d) {
    const Fs = T.feats, Bs = T.best;
    const add = k => { Fs[k] = (Fs[k] || 0) + 1; };
    const best = (k, v) => { if (v > (Bs[k] || 0)) Bs[k] = v; };
    if (event === "raceDone") {
      const win = d.place === 1, id = idOfName(d.name);
      T.streak = win ? T.streak + 1 : 0;
      T.podStreak = d.place <= 3 ? T.podStreak + 1 : 0;
      best("streak", T.streak); best("podStreak", T.podStreak); best("cards", d.played || 0);
      if (d.course) add("course:" + d.course);
      if (d.field > 1 && d.place === d.field) add("last");
      if (d.place === 2 && d.margin != null && d.margin < 0.02) add("photo");
      const h = new Date().getHours();
      if (h < 4) add("night"); else if (h >= 5 && h < 7) add("early");
      if (!win) return;
      if (d.margin != null) {
        if (d.margin < 0.05) add("nose");
        if (d.margin >= 1) add("clear");
        if (d.margin >= 2) add("distance");
      }
      const lastFirst = d.field > 1 && d.corner === d.field;
      if (d.corner === 1) add("wire");
      if (d.corner >= 6) add("comeback");
      if (lastFirst) add("lastFirst");
      if (d.exhausted) add("empty"); else if (d.hp >= 0.5) add("fresh");
      if (d.surface) add("win:" + d.surface);
      if (d.weather) add("win:weather:" + d.weather);
      if (d.season) add("win:season:" + d.season);
      if (d.ground) add("win:ground:" + d.ground);
      if (d.course) add("courseWin:" + d.course);
      if (d.unspent) add("noCall");
      if (d.runIn >= 2) add("runInBoth");
      if (id) {
        add("win:" + id);
        if (d.dist) add("win:" + id + ":" + d.dist);
        if (d.corner === 1) add("wire:" + id);
        if (lastFirst) add("lastFirst:" + id);
      }
      return;
    }
    if (event === "rivalry" || event === "rivalWin") {
      if (d.final) add("zone");
      if (d.final && event === "rivalWin") add("zoneWin");
      if (d.rival) add("rival:" + bare(d.rival));
      if (d.rival && d.me) add("pair:" + pairKey(bare(d.me), bare(d.rival)));
    }
    if (event === "scoutCard" || event === "scoutRacer") {
      const res = d.results || [], n = d.n || 1;
      if (n === 10) add("ten");
      if (event === "scoutCard") {
        const epics = res.filter(r => r.card && r.card.rarity === "E").length;
        if (epics && n === 1) add("epicSingle");
        if (epics >= 2) add("epicTwo");
        if (n === 10 && res.length === 10 && res.every(r => r.isNew)) add("allNew");
      } else {
        const stars = res.filter(r => r.rarity >= 3).length;
        if (stars) add("threeStar");
        if (stars >= 2) add("threeTwo");
        if (res.some(r => r.refund > 0)) add("maxedDupe");
      }
    }
    if (event === "itemUsed" && d.id) add("used:" + d.id);
    if (event === "jukebox") add("jukebox");
    if (event === "deckAuto" && d.distance) add("plan:" + d.distance);
    if (event === "lobbyRoom" && d.room === "room" && d.v != null) add("dorm:" + d.v);
    if (event === "careerStart" && d.parents >= 2) add("legacy");
    if (event === "careerTick" && d.low != null) best("low", d.low);
    if (event === "careerEnd") {
      if (!d.failed) add("goals");
      if (d.g1s != null) best("g1s", d.g1s);
      if (d.unbeaten) add("unbeaten");
    }
    if ((event === "champion" || event === "dreamChampion") && d.racer)
      add((event === "champion" ? "ura:" : "dream:") + d.racer);
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

  /** Several reward bundles as one, for a claim that pays more than one thing at once. */
  function mergeRewards(list) {
    const out = { carrots: 0, items: {} };
    for (const r of list) {
      if (!r) continue;
      out.carrots += r.carrots || 0;
      for (const id in r.items || {}) out.items[id] = (out.items[id] || 0) + r.items[id];
    }
    return out;
  }

  // ---------------------------------------------------------------- awards api
  /** Unlock and pay anything newly earned. Safe to call as often as you like. */
  function checkAwards() {
    const s = load(), c = ctx(), out = [];
    for (const a of AWARDS) {
      if (s.awards[a.id] || !shown(a, c)) continue;
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

  /** Every award on this device's case with its progress, for the awards screen. One that
      was earned is always shown, whatever its `when` says now. */
  function awards() {
    const s = load(), c = ctx();
    return AWARDS.filter(a => s.awards[a.id] || shown(a, c)).map(a => {
      let have = null, need = null;
      if (a.goal) { try { [have, need] = a.goal(c); have = Math.min(have || 0, need); } catch (e) {} }
      const unlocked = !!s.awards[a.id];
      return { id: a.id, cat: a.cat, name: a.name, desc: a.desc, tier: a.tier, reward: a.reward,
               hidden: !!a.hidden && !unlocked, hint: a.hint || null,
               racer: a.racer || null, scn: a.scn || null,
               unlocked, at: s.awards[a.id] || null,
               have, need,
               pct: need ? Math.min(1, (have || 0) / need) : (unlocked ? 1 : 0) };
    });
  }

  // ---------------------------------------------------------------- quests api
  const valueOf = (q, c) => {
    try { return (q.value ? q.value(c) : c[q.scope][q.stat]) || 0; } catch (e) { return 0; }
  };
  const shown = (q, c) => { try { return !q.when || !!q.when(c); } catch (e) { return false; } };

  function questView(q, c) {
    const s = load();
    c = c || ctx();
    const have = Math.min(valueOf(q, c), q.goal);
    return { id: q.id, name: q.name, desc: q.desc, scope: q.scope, reward: q.reward,
             have, need: q.goal, pct: q.goal ? have / q.goal : 0,
             done: have >= q.goal, claimed: !!s.claimed[q.id] };
  }
  const board = list => { const c = ctx(); return list.filter(q => shown(q, c)).map(q => questView(q, c)); };
  const daily  = () => board(DAILY);
  const weekly = () => board(WEEKLY);
  const first  = () => board(FIRST);
  /** The first steps, under the name the menu has always used for them. */
  const tasks  = first;

  /** One chain as the board shows it: where it stands, and the tier it is working on. */
  function chainView(ch, c) {
    const s = load();
    c = c || ctx();
    const value = valueOf(ch, c);
    const claimed = Math.min(s.tiers[ch.id] || 0, ch.tiers.length);
    const reached = ch.tiers.filter(n => value >= n).length;
    const at = claimed;                                     // the tier it is on: the first unclaimed
    const complete = at >= ch.tiers.length;
    const need = complete ? ch.tiers[ch.tiers.length - 1] : ch.tiers[at];
    return {
      id: ch.id, cat: ch.cat, name: ch.name, value, complete,
      tier: complete ? ch.tiers.length : at + 1, of: ch.tiers.length,
      roman: ROMAN[complete ? ch.tiers.length - 1 : at],
      desc: tierDesc(ch, need),
      have: value, need, pct: need ? Math.min(1, value / need) : 1,     // the true count, past the target too
      reward: complete ? null : ch.rewards[at],
      ready: Math.max(0, reached - claimed),                // tiers reached and not yet claimed
      claimed,
      steps: ch.tiers.map((n, i) => ({ n, roman: ROMAN[i], desc: tierDesc(ch, n), claimed: i < claimed,
                                       reached: value >= n, reward: ch.rewards[i] })),
    };
  }
  /** Trainer tasks by category, each with its chains and how many tiers are claimed. */
  function trainer() {
    const c = ctx();
    return CATEGORIES.map(cat => {
      const chains = CHAINS.filter(ch => ch.cat === cat.id && shown(ch, c)).map(ch => chainView(ch, c));
      return { id: cat.id, name: cat.name, chains,
               claimed: chains.reduce((a, v) => a + v.claimed, 0),
               total: chains.reduce((a, v) => a + v.of, 0),
               ready: chains.reduce((a, v) => a + v.ready, 0) };
    }).filter(cat => cat.chains.length);
  }

  /** How many rewards are sitting there waiting, by board: the tabs' badges. */
  function claimableBy() {
    const ready = list => list.filter(q => q.done && !q.claimed).length;
    const tiers = trainer().reduce((a, cat) => a + cat.ready, 0);
    return { daily: ready(daily()), weekly: ready(weekly()), tasks: ready(first()) + tiers };
  }
  /** All of them -- for the badge on the menu button. */
  const claimable = () => { const b = claimableBy(); return b.daily + b.weekly + b.tasks; };

  /**
   * Claim a quest, a first step, or a chain. A chain pays every tier it has reached and
   * not yet claimed, in order, as one claim -- the board shows one ladder, not five rows.
   */
  function claim(id) {
    const s = load();
    const ch = chainById(id);
    if (ch) {
      const v = chainView(ch);
      if (!v.ready) return { ok: false, error: v.complete ? "Already claimed." : "Not finished yet." };
      const from = v.claimed, to = v.claimed + v.ready;
      const rewards = ch.rewards.slice(from, to);
      s.tiers[id] = to;
      const reward = mergeRewards(rewards);
      const got = payout(reward);
      s.log.unshift({ kind: "tier", id, tier: to, at: now() });
      if (s.log.length > 40) s.log.length = 40;
      save();
      const awarded = checkAwards();                        // the ladders count toward some
      const name = ch.name + " " + (to - from > 1 ? ROMAN[from] + "–" + ROMAN[to - 1] : ROMAN[from]);
      return { ok: true, quest: { id, name, reward }, tiers: to - from, got, awards: awarded };
    }
    const q = questById(id);
    if (!q) return { ok: false, error: "Unknown quest." };
    const v = questView(q);
    if (!v.done) return { ok: false, error: "Not finished yet." };
    if (v.claimed) return { ok: false, error: "Already claimed." };
    s.claimed[id] = now();
    // claims are counted too: the bonus daily, "Every day counts" and the Dedication chains
    const bump = q.scope === "day" ? "dailyClaims" : q.scope === "week" ? "weeklyClaims" : null;
    if (bump) for (const bag of [s.life, s.day, s.week]) bag[bump]++;
    const got = payout(q.reward);
    s.log.unshift({ kind: "quest", id, at: now() });
    if (s.log.length > 40) s.log.length = 40;
    // the last of the day's (or the week's) board claimed: a clean sweep
    const all = q.scope === "day" ? DAILY : q.scope === "week" ? WEEKLY : null;
    if (all && board(all).every(v => v.claimed)) {
      const k = q.scope === "day" ? "sweepDay" : "sweepWeek";
      s.life.feats[k] = (s.life.feats[k] || 0) + 1;
    }
    save();
    return { ok: true, quest: q, got, awards: checkAwards() };
  }

  /**
   * Claim everything that is ready, so the player is not clicking forty buttons. `which`
   * narrows it to one board ("daily", "weekly", "tasks"). Runs until nothing is left,
   * because claiming can finish something else (the bonus daily counts claims).
   */
  function claimAll(which) {
    const out = [];
    for (let guard = 0; guard < 5; guard++) {
      const list = [];
      if (!which || which === "daily")  list.push(...daily());
      if (!which || which === "weekly") list.push(...weekly());
      if (!which || which === "tasks") {
        list.push(...first());
        for (const cat of trainer()) for (const v of cat.chains) if (v.ready) list.push({ id: v.id, done: true });
      }
      let any = false;
      for (const q of list) {
        if (!q.done || q.claimed) continue;
        const r = claim(q.id);
        if (r.ok) { out.push(r); any = true; }
      }
      if (!any) break;
    }
    return out;
  }

  // ---------------------------------------------------------------- summary
  function summary() {
    const s = load();
    const tiers = trainer();
    return {
      awardsUnlocked: Object.keys(s.awards).filter(id => AWARDS.some(a => a.id === id)).length,
      awardsTotal: awards().length,
      tiersClaimed: tiers.reduce((a, c) => a + c.claimed, 0),
      tiersTotal: tiers.reduce((a, c) => a + c.total, 0),
      claimable: claimable(),
      wins: s.life.wins, races: s.life.races,
      champions: s.life.champions,
      bestGrade: s.life.bestGrade || "-",
    };
  }

  const api = { AWARDS, AWARD_CATS, DAILY, WEEKLY, FIRST, TASKS: FIRST, CHAINS, CATEGORIES, TIER_PAY, ROMAN, EVENTS, VERSION,
                load, save, reload, onChange, record, summary, resets, dayKey, weekKey,
                awards, awardUnlocked, checkAwards,
                daily, weekly, first, tasks, trainer, chainView, claim, claimAll, claimable, claimableBy,
                payout, mergeRewards };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Quests = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
