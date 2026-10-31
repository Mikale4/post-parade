/*
 * Career mode -- "The Beginning: URA Finale".
 *
 * Follows the real scenario (umamusu.wiki/Game:URA_Finale, game8.co/.../536520):
 *   - three years (Junior / Classic / Senior), each month split into Early and Late,
 *     giving 72 training turns
 *   - then a 6-turn Finale: one training turn before each of the Qualifier, Semifinal
 *     and Finals, and every one of those three must be WON to advance
 *   - the Finale trip is whichever distance she raced most, ties broken toward shorter
 *   - goals must be met by their deadline or the run ends there
 *   - stat cap 1400, but gains above 1200 are halved
 *   - facilities level up with use (4 sessions per level, max 5)
 *   - summer camp, Early Jul..Late Aug of Classic and Senior, runs every facility at 5
 *   - mood scales training by +/-20% and race performance by +/-4%
 *
 * Pure logic, no DOM, so validate-career.js can play thousands of runs headlessly.
 * Races are handed to the existing sim rather than resolved here.
 *
 * Two scenarios share all of the above (SCENARIOS, below): URA Finale, and "The Summit:
 * Dream Trophy", the hard road -- full-deck races, a field of specialists that is
 * stronger, better equipped and better read, and a payout to match. A run saved before
 * scenarios existed has no `scenario` and is a URA Finale run.
 *
 * Exposes Career.
 */
(function (root) {
  "use strict";

  const Sim = typeof require !== "undefined" ? require("./sim.js") : root.Sim;
  /* skills.js must load before this file in the browser -- see the module list in
     index.html. Career mode owns skill POINTS; skills.js owns what they buy. */
  const Skills = typeof require !== "undefined" ? require("./skills.js") : root.Skills;

  const YEARS = ["Junior", "Classic", "Senior"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const TRAINING_TURNS = 72;          // 3 years x 12 months x 2 halves
  const FINALE_TURNS = 6;
  const TOTAL_TURNS = TRAINING_TURNS + FINALE_TURNS;

  const STAT_CAP = 1400;              // the URA Finale update raised it from 1200
  const SOFT_CAP = 1200;              // gains past here are halved
  const MAX_FACILITY = 5;
  const USES_PER_LEVEL = 4;           // "repeat training 4 times to upgrade"

  const STATS = ["speed", "stamina", "power", "guts", "wit"];
  const MOODS = ["Awful", "Bad", "Normal", "Good", "Great"];
  const MOOD_TRAIN = [0.80, 0.90, 1.00, 1.10, 1.20];   // +/-20% on training
  const MOOD_RACE  = [0.96, 0.98, 1.00, 1.02, 1.04];   // +/-4% on race performance

  /* Energy cost per session. Wit RESTORES energy in the real game, which is what makes
     it the pressure valve across a long career rather than just another stat. */
  const TRAIN_COST = { speed: 21, stamina: 19, power: 20, guts: 22, wit: -5 };
  const TRAIN_LABEL = { speed: "Speed", stamina: "Stamina", power: "Power",
                        guts: "Guts", wit: "Wit" };
  /* What one session at facility level 1 is worth in Junior year. Facility level, mood
     and the year multiplier all scale these up. */
  const TRAIN_BASE = {
    speed:   { speed: 14, power: 5 },
    stamina: { stamina: 14, guts: 5 },
    power:   { power: 14, stamina: 5 },
    guts:    { guts: 12, speed: 4, power: 4 },
    wit:     { wit: 12, speed: 4 },
  };
  const FACILITY_MUL = [1.00, 1.18, 1.38, 1.60, 1.85];   // level 1..5

  /* Training is worth far more in later years -- that is what turns 72 turns into a
     four-figure stat line rather than a slow crawl, and it is why a bad Junior year is
     survivable but a wasted Senior year is not. */
  const YEAR_MUL = [1.00, 1.60, 2.20];
  const yearMul = turn => YEAR_MUL[clamp(Math.floor(turn / 24), 0, 2)];

  /* The average stat an on-pace trainee carries at a given turn. Rival fields are built
     from this rather than from absolute roster numbers, so a Junior-year G1 is a Junior
     -year challenge and a Senior G1 is a Senior one.
     These are MEASURED from a trainer who manages energy and mood (validate-career.js),
     not guessed -- price the field against a trainee who never existed and every race
     becomes a coin flip. Re-measure if the training numbers above change. */
  const PACE = [[0, 112], [11, 148], [23, 190], [31, 230], [45, 316],
                [59, 411], [71, 488], [77, 505]];
  function expectedStat(turn) {
    if (turn <= PACE[0][0]) return PACE[0][1];
    for (let i = 1; i < PACE.length; i++) {
      if (turn <= PACE[i][0]) {
        const [t0, v0] = PACE[i - 1], [t1, v1] = PACE[i];
        return v0 + (v1 - v0) * (turn - t0) / (t1 - t0);
      }
    }
    return PACE[PACE.length - 1][1];
  }

  /* Where each grade sits against that pace. Every grade sits BELOW an on-pace trainee,
     so a career that trains well is expected to win the races it is suited to -- the
     schedule is where a fan base comes from, and a field that merely matches her turns
     every start into a coin flip. The URA Finale is the exception: it is priced above
     pace and escalates, so the three-race gauntlet is the actual test of the run. */
  /* Graded fields sit a little lower than they did when the goals were fan counts:
     every racer's real objectives ask her to place, or win, in named G1s, and those are
     races a well-built trainee should usually take. The finale factors rise by the same
     ratio, so the Qualifier, Semifinal and Finals are exactly as hard as they were. */
  const GRADE_FACTOR = { Debut: 0.56, "Pre-OP": 0.60, OP: 0.64, G3: 0.67, G2: 0.70, G1: 0.72 };
  // 0.92 x the old 0.92 / 0.97 / 1.02, over the new G1 -- the finale's own fields unchanged
  const FINALE_FACTOR = { Qualifier: 1.176, Semifinal: 1.239, Finals: 1.303 };

  /* ---------------------------------------------------------------- scenarios
     The three years are the same in both; what changes is who she races and how.

     The Summit: Dream Trophy. The country's best do not wait for the Twinkle Series to
     finish with her: every race is run with whole decks (ai.js FULL_DECK -- nothing to
     draw, and a Callout plays the card that is due, free), and her rivals are
       - `field` x stronger than a URA field of the same grade, the finale included
       - on decks of their own, built from every card in the game (Stable.rivalDeck; the
         Cheap build, which measured strongest once the whole deck is in reach)
       - sharp (ai.js SHARP): a truer read of the race, and they spend their Callouts.
     Each lever was measured alone and together (validate-career.js runs the same trainee
     through the same graded race against both fields). Two more were tried and dropped:
     drawing the racers best suited to each trip, and giving rivals their passives --
     either one on top of these ended three runs in four at a goal. As tuned, a focused
     trainer on a deck of her own misses a goal in about 40% of runs and takes the Grand
     Final in about 18% (URA Finale: 10% and 83%); on a starter deck, about 5%. The
     payout is priced against that. `stamina` names the Stable.STAMINA entry a run costs. */
  const SCENARIOS = {
    ura: {
      id: "ura", name: "URA Finale", title: "The Beginning: URA Finale",
      blurb: "Three years, then a three-race final she has to win outright.",
      finale: "URA Finale", finaleId: "ura",
      stages: { Qualifier: "Qualifier", Semifinal: "Semifinal", Finals: "Finals" },
      finaleFans: { Qualifier: 40000, Semifinal: 60000, Finals: 90000 },
      finaleSP: { Qualifier: 40, Semifinal: 60, Finals: 80 },
      field: 1, fullDeck: false, sharp: false, rivalDecks: null,
      stamina: "careerRun",
      pay: { carrots: { failed: 150, normal: 800, champion: 2500 },
             items: {}, xp: [400, 12], prize: null },
    },
    dream: {
      id: "dream", name: "Dream Trophy", title: "The Summit: Dream Trophy",
      blurb: "Every race with her whole deck, against rivals who are stronger, carry decks " +
             "of their own and read a race better. The richest prize in the game.",
      finale: "Dream Trophy", finaleId: "dream",
      stages: { Qualifier: "Invitational", Semifinal: "Semifinal", Finals: "Grand Final" },
      finaleFans: { Qualifier: 60000, Semifinal: 90000, Finals: 150000 },
      finaleSP: { Qualifier: 60, Semifinal: 90, Finals: 120 },
      field: 1.03, fullDeck: true, sharp: true, rivalDecks: "cheap",
      stamina: "dreamRun",
      /* Earned, not bought: the summit opens after three URA Finale championships on the
         account. A run already under way is never locked out mid-career. */
      unlock: { uraChampions: 3, text: "Win the URA Finale three times" },
      /* Completion carrots three to four times the URA Finale's, prize money for every win
         on the way, and a haul of items for reaching the end at all. */
      pay: { carrots: { failed: 500, normal: 3000, champion: 10000 },
             items: { normal: { cardTicket: 5, staminaDrink: 1 },
                      champion: { cardTicket: 10, racerTicket: 2, staminaDrink: 3 } },
             xp: [900, 6],
             prize: { G1: 400, G2: 250, G3: 150, other: 60 } },
    },
  };
  const scenarioOf = s => SCENARIOS[(s && (typeof s === "string" ? s : s.scenario))] || SCENARIOS.ura;

  /**
   * Whether a scenario can be started, given the account's record ({ uraChampions }).
   * Null when it is open; otherwise what it takes and how far along the trainer is, for
   * the picker to show. The screens own where the record comes from.
   */
  function scenarioLock(id, record) {
    const u = scenarioOf(id).unlock;
    if (!u) return null;
    const have = Math.max(0, (record && record.uraChampions) || 0);
    return have >= u.uraChampions ? null : { need: u.uraChampions, have, text: u.text };
  }

  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;

  // ---------------------------------------------------------------- calendar
  const turnYear  = t => clamp(Math.floor(t / 24), 0, 2);
  const turnMonth = t => Math.floor((t % 24) / 2);
  const turnHalf  = t => (t % 2) ? "Late" : "Early";

  /* The weather on a turn: its season by the month, and the day's weather drawn from the
     run's seed, so a turn looks the same every time it is opened and its race is run in
     what the turn screen showed. Odds after Japan's: June is the rainy season (tsuyu),
     autumn is the driest, and snow only falls in winter. The finale turns are in winter. */
  const SEASONS = ["winter", "winter", "spring", "spring", "spring", "summer",
                   "summer", "summer", "autumn", "autumn", "autumn", "winter"];
  const WEATHER_ODDS = {
    spring: [["clear", 0.55], ["cloudy", 0.28], ["rain", 0.17]],
    tsuyu:  [["clear", 0.25], ["cloudy", 0.3], ["rain", 0.45]],
    summer: [["clear", 0.65], ["cloudy", 0.17], ["rain", 0.18]],
    autumn: [["clear", 0.62], ["cloudy", 0.26], ["rain", 0.12]],
    winter: [["clear", 0.5], ["cloudy", 0.24], ["rain", 0.08], ["snow", 0.18]],
  };
  /* The going follows the weather, as it does at a real course: firm on a clear day, softer
     the wetter it is. It is what the weather does to a race (sim.js GROUND): the real
     game's stat penalties and stamina cost, by ground and surface. */
  const GROUND_ODDS = {
    clear:  [["firm", 0.85], ["good", 0.15]],
    cloudy: [["firm", 0.6], ["good", 0.3], ["soft", 0.1]],
    rain:   [["good", 0.2], ["soft", 0.45], ["heavy", 0.35]],
    snow:   [["good", 0.25], ["soft", 0.45], ["heavy", 0.3]],
  };
  const draw = (odds, x) => { let acc = 0; for (const [k, p] of odds) { acc += p; if (x < acc) return k; } return odds[odds.length - 1][0]; };
  function weatherOf(s, turn) {
    const t = turn == null ? (s ? s.turn : 0) : turn;
    const month = t >= TRAINING_TURNS ? 11 : turnMonth(t);
    const season = SEASONS[month];
    const rnd = Sim.mulberry32((((s && s.seed) >>> 0) + t * 104729 + 17) >>> 0);
    const weather = draw(WEATHER_ODDS[month === 5 ? "tsuyu" : season], rnd());
    const ground = draw(GROUND_ODDS[weather], rnd());
    return { month, season, weather, ground };
  }

  /** Summer camp: Early Jul .. Late Aug of Classic and Senior years. */
  function isSummerCamp(turn) {
    if (turn >= TRAINING_TURNS) return false;
    const y = turnYear(turn), m = turnMonth(turn);
    return y >= 1 && (m === 6 || m === 7);
  }

  /** `s` (a state or a scenario id) names the finale; without it, URA Finale. */
  function turnLabel(turn, s) {
    if (turn >= TOTAL_TURNS) return "Career complete";
    if (turn >= TRAINING_TURNS) {
      const scn = scenarioOf(s);
      const which = finaleRaceAt(turn);
      return scn.finale + " · " + (which ? scn.stages[which] : "Final Training");
    }
    return YEARS[turnYear(turn)] + " Year · " + turnHalf(turn) + " " + MONTHS[turnMonth(turn)];
  }

  /** Which of the 6 finale turns is a race, and which one. */
  function finaleRaceAt(turn) {
    return { 1: "Qualifier", 3: "Semifinal", 5: "Finals" }[turn - TRAINING_TURNS] || null;
  }
  /** A finale stage as this run's scenario names it: "Finals" is the Dream Trophy's Grand Final. */
  const stageName = (s, which) => scenarioOf(s).stages[which] || which;

  // ---------------------------------------------------------------- race calendar
  /* The real URA Finale calendar (careerdata.js, generated from GameTora): every G1, G2
     and G3 of the three years at its real date, distance and ground, plus the OP races
     an objective names. Races are a choice on any turn they are on -- training is never
     taken away for one -- except a racer's own goal race, which she has to run.
     `pay` is fans by placing, `fans` what winning pays, `need` the fans to enter. */
  const CD = typeof require !== "undefined" ? require("./careerdata.js") : root.CareerData;
  const DIST_CLASS = m => m <= 1400 ? "sprint" : m <= 1800 ? "mile" : m <= 2400 ? "medium" : "long";
  /* Her debut is the one race every racer runs, at the trip and on the ground the game
     gives her (Taiki Shuttle's is a dirt mile) -- `adaptive`, resolved per racer. */
  const DEBUT = { turn: 11, id: "debut", name: "Make Debut", grade: "Debut", adaptive: true,
                  need: 0, pay: [700, 280, 175, 105, 70, 63] };
  const RACE_CAL = CD ? [DEBUT].concat(CD.CALENDAR).map(r => Object.assign({}, r, {
    dist: r.metres ? DIST_CLASS(r.metres) : r.dist, fans: r.pay[0],
  })) : null;

  /* The calendar before the real one, kept only for a run saved under it: its races and
     goals are what that save's history refers to. */
  const LEGACY_CAL = [
    // ---- Junior year. Cheap to enter, because this is where a fan base is built.
    { turn: 11, id: "debut",      name: "Make Debut",         grade: "Debut", adaptive: true, fans: 1200,  need: 0 },
    { turn: 15, id: "jnr-sprint", name: "Juvenile Sprint",    grade: "OP", dist: "sprint", surface: "turf", fans: 2400, need: 0 },
    { turn: 15, id: "jnr-omile",  name: "Juvenile Mile",      grade: "OP", dist: "mile",   surface: "turf", fans: 2400, need: 0 },
    { turn: 15, id: "jnr-oroute", name: "Juvenile Route",     grade: "OP", dist: "medium", surface: "turf", fans: 2400, need: 0 },
    { turn: 15, id: "jnr-odirt",  name: "Juvenile Dirt",      grade: "OP", dist: "mile",   surface: "dirt", fans: 2400, need: 0 },
    { turn: 19, id: "jnr-g3sp",   name: "Nakayama Juvenile",  grade: "G3", dist: "sprint", surface: "turf", fans: 4000, need: 800 },
    { turn: 19, id: "jnr-g3ml",   name: "Asahi Mile Trophy",  grade: "G3", dist: "mile",   surface: "turf", fans: 4000, need: 800 },
    { turn: 19, id: "jnr-g3md",   name: "Kyoto Juvenile",     grade: "G3", dist: "medium", surface: "turf", fans: 4000, need: 800 },
    { turn: 19, id: "jnr-g3lg",   name: "Stayers Juvenile",   grade: "G3", dist: "long",   surface: "turf", fans: 4000, need: 800 },
    { turn: 19, id: "jnr-g3dt",   name: "Cattleya Dirt",      grade: "G3", dist: "mile",   surface: "dirt", fans: 4000, need: 800 },
    { turn: 23, id: "jnr-hope",   name: "Hopeful Stakes",     grade: "G1", dist: "medium", surface: "turf", fans: 9000, need: 2000 },
    { turn: 23, id: "jnr-asahi",  name: "Asahi Juvenile Cup", grade: "G1", dist: "mile",   surface: "turf", fans: 9000, need: 2000 },
    { turn: 23, id: "jnr-spg1",   name: "Juvenile Sprint Cup",grade: "G1", dist: "sprint", surface: "turf", fans: 9000, need: 2000 },
    { turn: 23, id: "jnr-dtg1",   name: "Zen-Nippon Junior",  grade: "G1", dist: "mile",   surface: "dirt", fans: 9000, need: 2000 },
    // ---- Classic year
    { turn: 27, id: "cls-satsuki",name: "Satsuki Trophy",     grade: "G2", dist: "mile",   surface: "turf", fans: 8000, need: 3000 },
    { turn: 27, id: "cls-flora",  name: "Flora Stakes",       grade: "G2", dist: "medium", surface: "turf", fans: 8000, need: 3000 },
    { turn: 27, id: "cls-hanshin",name: "Hanshin Sprint",     grade: "G2", dist: "sprint", surface: "turf", fans: 8000, need: 3000 },
    { turn: 27, id: "cls-dirtg2", name: "Unicorn Dirt",       grade: "G2", dist: "mile",   surface: "dirt", fans: 8000, need: 3000 },
    { turn: 31, id: "cls-derby",  name: "Tokyo Derby",        grade: "G1", dist: "medium", surface: "turf", fans: 22000, need: 5000 },
    { turn: 31, id: "cls-nhk",    name: "NHK Mile Cup",       grade: "G1", dist: "mile",   surface: "turf", fans: 22000, need: 5000 },
    { turn: 31, id: "cls-dirtg1", name: "Champions Dirt",     grade: "G1", dist: "medium", surface: "dirt", fans: 22000, need: 5000 },
    { turn: 35, id: "cls-takam",  name: "Takamatsu Sprint",   grade: "G1", dist: "sprint", surface: "turf", fans: 20000, need: 7000 },
    { turn: 35, id: "cls-yasuda", name: "Yasuda Mile",        grade: "G1", dist: "mile",   surface: "turf", fans: 20000, need: 7000 },
    { turn: 35, id: "cls-takara", name: "Takarazuka Cup",     grade: "G1", dist: "medium", surface: "turf", fans: 20000, need: 7000 },
    { turn: 39, id: "cls-kikuka", name: "Kikuka Stayers",     grade: "G1", dist: "long",   surface: "turf", fans: 24000, need: 9000 },
    { turn: 39, id: "cls-shuka",  name: "Shuka Route",        grade: "G1", dist: "medium", surface: "turf", fans: 24000, need: 9000 },
    { turn: 39, id: "cls-jbcdt",  name: "JBC Dirt Classic",   grade: "G1", dist: "mile",   surface: "dirt", fans: 24000, need: 9000 },
    { turn: 45, id: "cls-autumn", name: "Autumn Tenno Sho",   grade: "G1", dist: "medium", surface: "turf", fans: 26000, need: 12000 },
    { turn: 45, id: "cls-mileC",  name: "Mile Championship",  grade: "G1", dist: "mile",   surface: "turf", fans: 26000, need: 12000 },
    { turn: 45, id: "cls-sprintC",name: "Sprinters Stakes",   grade: "G1", dist: "sprint", surface: "turf", fans: 26000, need: 12000 },
    { turn: 45, id: "cls-arima",  name: "Arima Kinen",        grade: "G1", dist: "long",   surface: "turf", fans: 26000, need: 12000 },
    // ---- Senior year
    { turn: 51, id: "snr-osaka",  name: "Osaka Hai",          grade: "G1", dist: "medium", surface: "turf", fans: 30000, need: 15000 },
    { turn: 51, id: "snr-mile",   name: "Yasuda Mile",        grade: "G1", dist: "mile",   surface: "turf", fans: 30000, need: 15000 },
    { turn: 51, id: "snr-fdirt",  name: "February Dirt",      grade: "G1", dist: "mile",   surface: "dirt", fans: 30000, need: 15000 },
    { turn: 51, id: "snr-hspr",   name: "Hanshin Sprint Cup", grade: "G1", dist: "sprint", surface: "turf", fans: 30000, need: 15000 },
    { turn: 55, id: "snr-spring", name: "Spring Tenno Sho",   grade: "G1", dist: "long",   surface: "turf", fans: 34000, need: 18000 },
    { turn: 55, id: "snr-takara", name: "Takarazuka Kinen",   grade: "G1", dist: "medium", surface: "turf", fans: 34000, need: 18000 },
    { turn: 55, id: "snr-miled",  name: "Kashiwa Dirt Mile",  grade: "G1", dist: "mile",   surface: "dirt", fans: 34000, need: 18000 },
    { turn: 59, id: "snr-sprint", name: "Sprinters Stakes",   grade: "G1", dist: "sprint", surface: "turf", fans: 30000, need: 20000 },
    { turn: 59, id: "snr-mileC",  name: "Mile Championship",  grade: "G1", dist: "mile",   surface: "turf", fans: 30000, need: 20000 },
    { turn: 59, id: "snr-dsprint",name: "JBC Dirt Sprint",    grade: "G1", dist: "sprint", surface: "dirt", fans: 30000, need: 20000 },
    { turn: 63, id: "snr-tenno",  name: "Autumn Tenno Sho",   grade: "G1", dist: "medium", surface: "turf", fans: 32000, need: 22000 },
    { turn: 63, id: "snr-stayer", name: "Stayers Stakes",     grade: "G1", dist: "long",   surface: "turf", fans: 32000, need: 22000 },
    { turn: 63, id: "snr-champd", name: "Champions Dirt",     grade: "G1", dist: "medium", surface: "dirt", fans: 32000, need: 22000 },
    { turn: 67, id: "snr-cup",    name: "Japan Cup",          grade: "G1", dist: "medium", surface: "turf", fans: 40000, need: 25000 },
    { turn: 67, id: "snr-jmile",  name: "Japan Mile Cup",     grade: "G1", dist: "mile",   surface: "turf", fans: 40000, need: 25000 },
    { turn: 67, id: "snr-jsprint",name: "Japan Sprint Cup",   grade: "G1", dist: "sprint", surface: "turf", fans: 40000, need: 25000 },
    { turn: 67, id: "snr-tokyodt",name: "Tokyo Dirt Cup",     grade: "G1", dist: "medium", surface: "dirt", fans: 40000, need: 25000 },
    { turn: 70, id: "snr-arima",  name: "Arima Kinen",        grade: "G1", dist: "long",   surface: "turf", fans: 45000, need: 28000 },
    { turn: 70, id: "snr-hopef",  name: "Hopeful Finale",     grade: "G1", dist: "medium", surface: "turf", fans: 45000, need: 28000 },
    { turn: 70, id: "snr-eastdt", name: "Tokyo Daishoten",    grade: "G1", dist: "medium", surface: "dirt", fans: 45000, need: 28000 },
  ];

  const DIST_METRES = { sprint: 1200, mile: 1600, medium: 2400, long: 3200 };
  const DIST_ORDER = ["sprint", "mile", "medium", "long"];
  const DIST_LABEL = { sprint: "Sprint", mile: "Mile", medium: "Medium", long: "Long" };

  /* Goals. Missing one ends the run -- that is the spine of the mode. Each racer has her
     own, the real game's career objectives (rosterdata.js `career.goals`): Taiki Shuttle
     is a miler with three Senior G1s to win, Haru Urara a dirt runner who needs fans
     before anyone will let her into a graded race. A goal is
       { kind: "race", by, place, races: [ids] }   finish `place` or better in one of them
       { kind: "fans", by, fans }                   have this many fans by turn `by`
       { kind: "g1place", by, place, count }        `count` G1s at `place` or better, since
                                                    the previous goal
     `place` 18 means "run in it". These are the generic four, for a run saved before
     racers had their own. */
  const GOALS = [
    { by: 11, kind: "race", races: ["debut"], place: 5, text: "Run in the Make Debut and finish top 5" },
    { by: 23, kind: "fans", fans: 3000,  text: "Reach 3,000 fans by the end of Junior year" },
    { by: 45, kind: "fans", fans: 20000, text: "Reach 20,000 fans by late Classic year" },
    { by: 71, kind: "fans", fans: 45000, text: "Reach 45,000 fans by the end of Senior year" },
  ];
  const goalsOf = s => s.goals || GOALS;
  /* A run saved before the real calendar keeps racing on the one it was planned on. */
  const calOf = s => (s.goals && RACE_CAL) || LEGACY_CAL;
  const raceById = (s, id) => calOf(s).find(r => r.id === id) || null;

  const CONDITIONS = [
    { id: "slacker",  name: "Slacking Off",   text: "Training gains cut by 20%." },
    { id: "migraine", name: "Migraine",       text: "Loses 6 energy every turn." },
    { id: "sprain",   name: "Sprained Ankle", text: "Training fails 10% more often." },
  ];

  // ---------------------------------------------------------------- state
  /* The random stream is kept as a plain number on the state rather than a closure, so
     a career in progress can be written to localStorage and picked up later with the
     same rolls still ahead of it. Same algorithm as Sim.mulberry32, stepped by hand. */
  function rnd(s) {
    s.rngState = (s.rngState + 0x6D2B79F5) | 0;
    let t = s.rngState;
    t = Math.imul(t ^ t >>> 15, 1 | t);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  function create(def, opts) {
    opts = opts || {};
    const seed = opts.seed != null ? opts.seed : (Math.random() * 1e9) | 0;
    const stats = {};
    /* A career starts as a schoolgirl, not as the rated racer -- her roster line only
       shapes where she begins, and three years of training decide the rest. */
    for (const k of STATS) stats[k] = Math.round((def.stats[k] || 300) * 0.12);
    const facility = {};
    for (const k of STATS) facility[k] = { level: 1, uses: 0 };
    return {
      racerId: def.id, racerName: def.name,
      scenario: SCENARIOS[opts.scenario] ? opts.scenario : "ura",
      style: def.style, aptitude: def.aptitude, sprite: def.sprite,
      color: def.color, personality: def.personality, unique: def.unique,
      turn: 0, stats, facility,
      energy: 100, maxEnergy: 100, mood: 2, fans: 0, skillPoints: 0,
      conditions: [], raceHistory: [], distCount: {}, surfCount: {},
      /* What skill points buy. `skills` are purchased outright, `hints` make a skill
         available and progressively cheaper, `detriments` are picked up by finishing
         badly and cost SP to shed. See skills.js. */
      skills: [], hints: {}, detriments: [],
      /* Her own objectives and debut, copied in so a saved run keeps the goals it began
         with even if the roster data changes under it. */
      goals: def.career ? JSON.parse(JSON.stringify(def.career.goals)) : null,
      debut: def.career ? Object.assign({}, def.career.debut) : null,
      log: [], failed: null, done: false, ending: null,
      finale: { won: [], lost: false },
      rngState: seed >>> 0, seed,
      started: Date.now(),
    };
  }

  const moodName  = s => MOODS[clamp(s.mood, 0, 4)];
  const moodTrain = s => MOOD_TRAIN[clamp(s.mood, 0, 4)];
  const moodRace  = s => MOOD_RACE[clamp(s.mood, 0, 4)];
  const hasCond   = (s, id) => s.conditions.indexOf(id) >= 0;

  /** Effective facility level -- summer camp runs everything at 5. */
  const facilityLevel = (s, stat) =>
    isSummerCamp(s.turn) ? MAX_FACILITY : clamp(s.facility[stat].level, 1, MAX_FACILITY);

  /* Failure climbs as energy falls: it starts to matter below 60 and is severe near
     empty. Wit is gentler, which is what lets it double as a recovery action. */
  function failChance(s, stat) {
    const e = clamp(s.energy, 0, 100);
    let base = 0;
    if (e < 60) base = Math.pow((60 - e) / 60, 1.7) * 0.62;
    if (hasCond(s, "sprain")) base += 0.10;
    return clamp(stat === "wit" ? base * 0.45 : base, 0, 0.85);
  }

  /** Gains above 1200 are halved, so the last 200 points cost what the first 600 did. */
  function applyGain(s, stat, raw) {
    let cur = s.stats[stat], left = raw, gained = 0;
    if (cur < SOFT_CAP) {
      const take = Math.min(left, SOFT_CAP - cur);
      cur += take; gained += take; left -= take;
    }
    if (left > 0 && cur < STAT_CAP) {
      const take = Math.min(Math.round(left * 0.5), STAT_CAP - cur);
      cur += take; gained += take;
    }
    s.stats[stat] = cur;
    return gained;
  }

  /** A preview of what a session would pay, so the UI can show it before committing. */
  function trainPreview(s, stat) {
    const lv = facilityLevel(s, stat);
    const mult = FACILITY_MUL[lv - 1] * moodTrain(s) * yearMul(s.turn) *
                 (hasCond(s, "slacker") ? 0.80 : 1);
    const gains = {};
    for (const k in TRAIN_BASE[stat]) gains[k] = Math.max(1, Math.round(TRAIN_BASE[stat][k] * mult));
    return { stat, level: lv, gains, energy: -TRAIN_COST[stat], fail: failChance(s, stat),
             camp: isSummerCamp(s.turn) };
  }

  function train(s, stat) {
    if (s.done || s.failed) return { ok: false, reason: "run over" };
    if (!TRAIN_BASE[stat]) return { ok: false, reason: "no such training" };

    const lv = facilityLevel(s, stat);
    const failed = rnd(s) < failChance(s, stat);
    const out = { ok: true, action: "train", stat, level: lv, failed,
                  gains: {}, energy: 0, skill: 0, notes: [] };

    if (failed) {
      // a failure costs a little of the trained stat, some energy and some mood
      const lost = 5 + Math.floor(rnd(s) * 6);
      s.stats[stat] = Math.max(1, s.stats[stat] - lost);
      out.gains[stat] = -lost;
      s.mood = clamp(s.mood - 1, 0, 4);
      s.energy = clamp(s.energy - 10, 0, s.maxEnergy);
      out.energy = -10;
      out.notes.push("Training failed");
      if (rnd(s) < 0.30) {
        const c = rnd(s) < 0.5 ? "slacker" : "sprain";
        if (addCondition(s, c)) out.notes.push("Picked up " + condName(c));
      }
    } else {
      const mult = FACILITY_MUL[lv - 1] * moodTrain(s) * yearMul(s.turn) *
                   (hasCond(s, "slacker") ? 0.80 : 1) * (0.90 + rnd(s) * 0.2);
      for (const k in TRAIN_BASE[stat]) {
        const g = applyGain(s, k, Math.max(1, Math.round(TRAIN_BASE[stat][k] * mult)));
        if (g) out.gains[k] = (out.gains[k] || 0) + g;
      }
      const sp = 2 + Math.floor(rnd(s) * 3);
      s.skillPoints += sp; out.skill = sp;
      const cost = TRAIN_COST[stat];
      s.energy = clamp(s.energy - cost, 0, s.maxEnergy);
      out.energy = -cost;

      // facilities level with use, so a focused career trains harder than a scattered one
      const f = s.facility[stat];
      if (f.level < MAX_FACILITY && ++f.uses >= USES_PER_LEVEL) {
        f.uses = 0; f.level++;
        out.facilityUp = f.level;
        out.notes.push(TRAIN_LABEL[stat] + " facility is now level " + f.level);
      }

      /* Training is where most hints come from. A hint both opens a skill up and makes
         it cheaper, so the shop slowly grows into something worth saving SP for. */
      if (Skills && rnd(s) < 0.16) {
        const hint = Skills.rollHint(s, () => rnd(s));
        if (hint) {
          out.hint = hint;
          out.notes.push("Hint: " + hint.skill.name +
                         (hint.hints > 1 ? " ×" + hint.hints : ""));
        }
      }
    }
    logTurn(s, out);
    advance(s);
    return out;
  }

  function rest(s) {
    if (s.done || s.failed) return { ok: false };
    const amount = [30, 50, 70][Math.floor(rnd(s) * 3)];
    s.energy = clamp(s.energy + amount, 0, s.maxEnergy);
    const out = { ok: true, action: "rest", energy: amount, notes: [] };
    // summer camp rest lifts mood as well as energy
    if (isSummerCamp(s.turn) && s.mood < 4) { s.mood++; out.mood = 1; }
    if (s.conditions.length && rnd(s) < 0.25) {
      out.cleared = s.conditions.shift();
      out.notes.push("Shook off " + condName(out.cleared));
    }
    logTurn(s, out);
    advance(s);
    return out;
  }

  function recreation(s) {
    if (s.done || s.failed) return { ok: false };
    const up = 1 + (rnd(s) < 0.25 ? 1 : 0);
    const before = s.mood;
    s.mood = clamp(s.mood + up, 0, 4);
    const e = (isSummerCamp(s.turn) ? 15 : 5) + Math.floor(rnd(s) * 11);
    s.energy = clamp(s.energy + e, 0, s.maxEnergy);
    const out = { ok: true, action: "recreation", mood: s.mood - before, energy: e, notes: [] };
    logTurn(s, out);
    advance(s);
    return out;
  }

  function infirmary(s) {
    if (s.done || s.failed) return { ok: false };
    const e = 10 + Math.floor(rnd(s) * 11);
    s.energy = clamp(s.energy + e, 0, s.maxEnergy);
    const out = { ok: true, action: "infirmary", energy: e, notes: [] };
    if (s.conditions.length && rnd(s) < 0.75) {
      out.cleared = s.conditions.shift();
      out.notes.push("Cured " + condName(out.cleared));
    } else if (!s.conditions.length) {
      out.notes.push("Nothing to treat — a wasted turn");
    }
    logTurn(s, out);
    advance(s);
    return out;
  }

  const condName = id => {
    const c = CONDITIONS.filter(x => x.id === id)[0];
    return c ? c.name : id;
  };
  function addCondition(s, id) {
    if (s.conditions.indexOf(id) >= 0) return false;
    s.conditions.push(id);
    return true;
  }

  function logTurn(s, out) {
    s.log.push({ turn: s.turn, label: turnLabel(s.turn, s), action: out.action,
                 stat: out.stat, failed: !!out.failed });
    if (s.log.length > 120) s.log.shift();
  }

  // ---------------------------------------------------------------- races
  const raceRun = (s, id) => s.raceHistory.some(h => h.id === id);

  const APT_RANK = { S: 6, A: 5, B: 4, C: 3, D: 2, E: 1, F: 0, G: -1 };
  const aptScore = (s, key) => APT_RANK[(s.aptitude || {})[key]] != null
    ? APT_RANK[(s.aptitude || {})[key]] : 3;

  const bestDistance = s =>
    DIST_ORDER.slice().sort((a, b) => aptScore(s, b) - aptScore(s, a))[0];
  const bestSurface = s => aptScore(s, "dirt") > aptScore(s, "turf") ? "dirt" : "turf";

  /* The Make Debut is a goal race, so it has to be a trip she can actually run. Her own
     debut is the game's (a dirt mile for Taiki Shuttle); a run with none on record is
     set at whatever she is best suited to. */
  function resolveRace(s, race) {
    if (!race.adaptive) return race;
    if (s.debut) return Object.assign({}, race, { metres: s.debut.metres,
      dist: DIST_CLASS(s.debut.metres), surface: s.debut.surface });
    return Object.assign({}, race, { dist: bestDistance(s), surface: bestSurface(s) });
  }
  /** The trip in metres: the real race's own, or the class's standard one. */
  const raceMetres = race => race.metres || DIST_METRES[race.dist];

  /** Races scheduled for a turn that she has not already run. */
  const racesOn = (s, turn) => {
    const t = turn == null ? s.turn : turn;
    return calOf(s).filter(r => r.turn === t && !raceRun(s, r.id))
                   .map(r => resolveRace(s, r));
  };
  /* Her own goal races take her whatever her fan count: an objective she could be locked
     out of would end runs for want of a number nobody told her to chase. */
  const isGoalRace = (s, id) => goalsOf(s).some(g => (g.races || []).indexOf(id) >= 0);
  const canEnter = (s, race) => s.fans >= race.need || isGoalRace(s, race.id);

  /** Her current goal's race, if it is run on this turn -- the turn she has to race. */
  function goalRacesNow(s) {
    const g = currentGoal(s);
    if (!g || g.kind !== "race") return [];
    return racesOn(s).filter(r => g.races.indexOf(r.id) >= 0);
  }

  /** The next few races, so the UI can show what she is training toward. */
  const upcomingRaces = (s, within) =>
    calOf(s).filter(r => r.turn >= s.turn && r.turn <= s.turn + (within == null ? 10 : within) &&
                         !raceRun(s, r.id))
            .map(r => resolveRace(s, r));

  /**
   * Build the field for a career race: the trainee plus rivals scaled to the grade.
   * Mood rides on her stats here, which is how the +/-4% race effect gets applied
   * without the sim needing to know career mode exists.
   */
  function raceSetup(s, race, roster) {
    const scn = scenarioOf(s);
    /* Rivals are built from the expected pace for this point in the calendar, not from
       their absolute roster numbers -- otherwise a Junior debut fields full-grown G1
       racers and the trainee cannot win her own first start. The roster line is used
       only for the SHAPE of a rival's stats, so a sprinter still runs like a sprinter. */
    const target = expectedStat(race.turn != null ? race.turn : s.turn) *
                   (GRADE_FACTOR[race.grade] || 0.90) *
                   (race.finale ? FINALE_FACTOR[race.finale] : 1) * scn.field;
    const mr = moodRace(s);
    const myStats = {};
    for (const k of STATS) myStats[k] = Math.round(s.stats[k] * mr);

    let me = {
      id: "trainee", name: s.racerName, sprite: s.sprite, color: s.color || "#ffcf3f",
      style: s.style, personality: s.personality || "calculating",
      stats: myStats, aptitude: s.aptitude, unique: s.unique, level: 1,
      mods: s.mods,
    };
    /* Purchased skills fold in here: flat stats and passive mods land on the def, and
       timed skills ride along as `skills` for Skills.check to fire during the race.
       Passive stat skills are applied AFTER the cap, so they legitimately push past it
       -- they are not training. */
    // the day she runs it: weather and season and the going, for the skills that need them
    const wx = weatherOf(s, race.turn != null ? race.turn : s.turn);
    if (Skills) me = Skills.applyToDef(me, s, wx);
    /* An inherited unique is a second signature effect, and the sim only gives a racer
       one `unique`. It rides as a timed skill instead -- same trigger language, same
       firing path, and it can coexist with her own. */
    if (s.inheritedUnique) {
      me.skills = (me.skills || []).concat([{
        id: "inherited", name: s.inheritedUnique.name, type: "speed",
        when: s.inheritedUnique.when, effects: s.inheritedUnique.effects,
      }]);
    }
    const field = [me];
    const pool = (roster || []).filter(r => r.id !== s.racerId);
    // stable.js loads after this file in the browser; by race day it is there
    const Stb = typeof require !== "undefined" ? require("./stable.js") : root.Stable;
    // deterministic per race, so re-entering the same race does not reroll the field
    const rng = Sim.mulberry32(((s.seed >>> 0) + (race.turn || 0) * 7919) >>> 0);
    for (let i = 0; i < 7 && i < pool.length; i++) {
      const r = pool[(i * 3 + (race.turn || 0)) % pool.length];
      const mean = STATS.reduce((a, k) => a + (r.stats[k] || 600), 0) / STATS.length;
      const scale = target * (0.93 + rng() * 0.14);
      const st = {};
      for (const k of STATS) st[k] = Math.max(40, Math.round((r.stats[k] || 600) / mean * scale));
      const riv = { id: "riv" + i, name: r.name, sprite: r.sprite, color: r.color,
                    style: r.style, personality: r.personality, unique: r.unique,
                    stats: st, aptitude: r.aptitude, level: 1 };
      // a Dream Trophy rival brings a deck of her own (card ids); a URA rival borrows hers
      if (scn.rivalDecks && Stb && Stb.rivalDeck) riv.deck = Stb.rivalDeck(r, scn.rivalDecks);
      field.push(riv);
    }
    return {
      field, race, scenario: scn.id,
      course: { id: race.id, name: race.name,
                distance: raceMetres(race), surface: race.surface, ground: wx.ground },
      /* How each controller is built (ai.js makeController): whole decks for everyone in
         the Dream Trophy, the sharper read for her rivals only. */
      rules: d => ({ fullDeck: scn.fullDeck, sharp: scn.sharp && d.id !== "trainee" }),
    };
  }

  /** Fold a finished race back into the career. */
  function applyRaceResult(s, race, placing, fieldSize) {
    const won = placing === 1;
    // the real payout by placing where the race has one; 6th's share for anyone behind
    const share = [1, 0.55, 0.35, 0.20, 0.12][placing - 1] || 0.06;
    const fans = race.pay ? race.pay[Math.min(placing, race.pay.length) - 1]
                          : Math.round(race.fans * share);
    s.fans += fans;
    const sp = Math.round((race.grade === "G1" ? 55 : race.grade === "G2" ? 40 : 30) * (won ? 1 : 0.6));
    s.skillPoints += sp;
    // a race is worth a little of everything
    const bump = won ? 6 : 3, gains = {};
    for (const k of STATS) { const g = applyGain(s, k, bump); if (g) gains[k] = g; }
    s.energy = clamp(s.energy - 15, 0, s.maxEnergy);
    if (won) s.mood = clamp(s.mood + 1, 0, 4);
    else if (placing > Math.max(3, (fieldSize || 8) / 2)) s.mood = clamp(s.mood - 1, 0, 4);

    s.distCount[race.dist] = (s.distCount[race.dist] || 0) + 1;
    s.surfCount[race.surface] = (s.surfCount[race.surface] || 0) + 1;
    s.raceHistory.push({ id: race.id, name: race.name, grade: race.grade, placing, fans,
                         dist: race.dist, surface: race.surface, turn: s.turn });

    /* Winning teaches her something; running badly can leave a mark that costs SP to
       shed. Both mirror the real game and give skill points a second reason to exist. */
    let hint = null, detriment = null;
    if (Skills) {
      if (won || rnd(s) < 0.5) hint = Skills.rollHint(s, () => rnd(s));
      detriment = Skills.rollDetriment(s, placing, () => rnd(s));
    }
    return { fans, skillPoints: sp, won, gains, hint, detriment };
  }

  /**
   * The Finale trip: whichever distance she ran most, ties broken toward the shorter.
   * Track types count separately, so a dirt career gets a dirt final.
   * A trainee who somehow never raced falls back to her best aptitude.
   */
  function finaleDistance(s) {
    let best = null, bestN = 0;
    for (const d of DIST_ORDER) {                 // DIST_ORDER is shortest-first, so a
      const n = s.distCount[d] || 0;              // strict > keeps the shorter on a tie
      if (n > bestN) { best = d; bestN = n; }
    }
    if (best) return best;
    const rank = { S: 6, A: 5, B: 4, C: 3, D: 2, E: 1, F: 0, G: -1 };
    const apt = s.aptitude || {};
    return DIST_ORDER.slice().sort((a, b) => (rank[apt[b]] || 0) - (rank[apt[a]] || 0))[0];
  }

  function finaleSurface(s) {
    return (s.surfCount.dirt || 0) > (s.surfCount.turf || 0) ? "dirt" : "turf";
  }

  /** The race for the current finale turn, or null if this is a training turn. */
  function finaleRace(s) {
    const which = finaleRaceAt(s.turn);
    if (!which) return null;
    const scn = scenarioOf(s);
    return {
      id: scn.finaleId + "-" + which.toLowerCase(),
      name: scn.finale + " " + scn.stages[which],
      grade: "G1", dist: finaleDistance(s), surface: finaleSurface(s),
      fans: scn.finaleFans[which],
      need: 0, finale: which, turn: s.turn,
    };
  }

  /** Finale races must be won; losing one ends the run with a normal ending. */
  function applyFinaleResult(s, race, placing, fieldSize) {
    const out = Object.assign({ finale: race.finale },
                              applyRaceResult(s, race, placing, fieldSize));
    if (placing === 1) {
      s.finale.won.push(race.finale);
      const sp = scenarioOf(s).finaleSP[race.finale] || 40;
      s.skillPoints += sp;
      out.skillPoints += sp;
      out.allStats = 10;
      for (const k of STATS) applyGain(s, k, 10);
      if (race.finale === "Finals") { s.done = true; s.ending = "champion"; }
    } else {
      s.finale.lost = true;
      s.done = true;
      s.ending = "normal";
    }
    return out;
  }

  // ---------------------------------------------------------------- goals
  const num = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const ORD = ["", "1st", "2nd", "3rd", "4th", "5th"];
  const TIMES = ["", "one", "two", "three", "four", "five"];

  /* A goal in words. Ours, not the game's, but the same objective: "Place 5th or better
     in the NHK Mile Cup" reads here as "Finish top 5 in the NHK Mile Cup". */
  function goalText(s, g) {
    if (g.text) return g.text;
    if (g.kind === "fans") return `Reach ${num(g.fans)} fans`;
    if (g.kind === "g1place")
      return `Finish ${g.place === 1 ? "first" : "top " + g.place} in ${TIMES[g.count] || g.count} G1 races`;
    const names = g.races.map(id => (raceById(s, id) || { name: id }).name);
    const which = names.length > 1 ? names.slice(0, -1).join(", ") + " or the " + names[names.length - 1] : names[0];
    if (g.place >= 18) return `Run in the ${which}`;
    if (g.place === 1) return `Win the ${which}`;
    return `Finish top ${g.place} in the ${which}`;
  }

  function goalStatus(s) {
    const list = goalsOf(s);
    return list.map((g, i) => {
      let met, have = null;
      if (g.kind === "fans") met = s.fans >= g.fans;
      else if (g.kind === "g1place") {
        // counted since the goal before it, as the game counts it
        const from = i ? list[i - 1].by : -1;
        have = s.raceHistory.filter(h => h.grade === "G1" && h.placing <= g.place &&
                                         h.turn > from && h.turn <= g.by).length;
        met = have >= g.count;
      } else met = s.raceHistory.some(h => g.races.indexOf(h.id) >= 0 && h.placing <= g.place);
      return Object.assign({}, g, { text: goalText(s, g), met, have,
                                    overdue: !met && s.turn > g.by, turnsLeft: g.by - s.turn });
    });
  }
  const currentGoal = s => goalStatus(s).filter(g => !g.met)[0] || null;

  /** The trip she should be building toward: the longest of her goal races in the next
      dozen turns (stamina has to cover the longest one coming, and the Mile Championship
      two turns before the Arima Kinen is no time to start), else her next goal race's. */
  function nextGoalTrip(s, within) {
    const span = within == null ? 12 : within;
    let next = null, longest = -1;
    for (const g of goalStatus(s)) {
      if (g.met || g.kind !== "race") continue;
      const r = g.races.map(id => raceById(s, id)).filter(Boolean)[0];
      if (!r) continue;
      const d = resolveRace(s, r).dist;
      if (!next) next = d;
      if (g.by <= s.turn + span) longest = Math.max(longest, DIST_ORDER.indexOf(d));
    }
    return longest >= 0 ? DIST_ORDER[longest] : next || bestDistance(s);
  }

  /** A missed deadline ends the run. Checked on every turn boundary. */
  function checkGoals(s) {
    for (const g of goalStatus(s)) {
      if (!g.met && s.turn > g.by) {
        s.failed = g.text;
        s.done = true;
        s.ending = "failed";
        return false;
      }
    }
    return true;
  }

  function advance(s) {
    s.turn++;
    if (hasCond(s, "migraine")) s.energy = clamp(s.energy - 6, 0, s.maxEnergy);
    // mood drifts back toward normal when nothing pushes it
    if (rnd(s) < 0.12 && s.mood !== 2) s.mood += s.mood > 2 ? -1 : 1;
    if (s.turn <= TRAINING_TURNS) checkGoals(s);
    if (s.turn >= TOTAL_TURNS && !s.done) { s.done = true; s.ending = s.ending || "normal"; }
  }

  /** Spend the turn without training -- what a race turn does. */
  function passTurn(s) { advance(s); }

  // ---------------------------------------------------------------- results
  const GRADES = [[15500, "SS"], [12500, "S"], [10000, "A"], [8000, "B"],
                  [6000, "C"], [4000, "D"], [0, "E"]];

  /** A finale race in the history, whichever scenario it was run in. */
  const isFinaleRun = h => Object.keys(SCENARIOS).some(k => h.id.indexOf(SCENARIOS[k].finaleId + "-") === 0);

  function rating(s) {
    const stat = STATS.reduce((a, k) => a + s.stats[k], 0);
    const fanPts = Math.round(Math.sqrt(Math.max(0, s.fans)) * 9);
    const winPts = s.raceHistory.filter(r => r.placing === 1 && !isFinaleRun(r)).length * 200;
    const finalePts = s.finale.won.length * 900;
    return Math.round(stat * 2.2 + fanPts + winPts + finalePts);
  }
  const grade = pts => (GRADES.filter(g => pts >= g[0])[0] || GRADES[GRADES.length - 1])[1];

  /** What gets written into the stable when the run ends. */
  function veteran(s) {
    const pts = rating(s);
    return {
      racerId: s.racerId, name: s.racerName,
      scenario: scenarioOf(s).id,
      stats: Object.assign({}, s.stats),
      fans: s.fans, rating: pts, grade: grade(pts),
      ending: s.ending || "normal",
      failed: s.failed || null,
      wins: s.raceHistory.filter(r => r.placing === 1).length,
      races: s.raceHistory.length,
      finale: s.finale.won.slice(),
      finished: Date.now(),
    };
  }

  /**
   * What the stable is paid when the run ends -- the screens grant exactly this, so the
   * numbers live here where validate-career can compare the scenarios.
   *   carrots   by ending, plus `prize`: the Dream Trophy pays for every win on the way
   *   items     consumables by ending (Stable.ITEMS ids)
   *   xp        for her level, only for a run that was seen through
   */
  function payout(s) {
    const scn = scenarioOf(s), v = veteran(s);
    const ending = v.ending === "champion" ? "champion" : v.ending === "failed" ? "failed" : "normal";
    let prize = 0;
    if (scn.pay.prize)
      for (const h of s.raceHistory)
        if (h.placing === 1 && !isFinaleRun(h)) prize += scn.pay.prize[h.grade] || scn.pay.prize.other;
    const base = scn.pay.carrots[ending];
    return {
      ending, base, prize, carrots: base + prize,
      items: Object.assign({}, scn.pay.items[ending] || {}),
      xp: ending === "failed" ? 0 : scn.pay.xp[0] + Math.round(v.rating / scn.pay.xp[1]),
    };
  }

  const api = {
    YEARS, MONTHS, STATS, MOODS, TRAIN_COST, TRAIN_BASE, TRAIN_LABEL, FACILITY_MUL,
    TRAINING_TURNS, FINALE_TURNS, TOTAL_TURNS, STAT_CAP, SOFT_CAP, MAX_FACILITY,
    RACE_CAL, LEGACY_CAL, GOALS, CONDITIONS, DIST_METRES, DIST_ORDER, DIST_LABEL, DIST_CLASS,
    calOf, raceById, raceMetres, goalsOf, goalRacesNow, isGoalRace, nextGoalTrip,
    YEAR_MUL, yearMul, expectedStat, GRADE_FACTOR, FINALE_FACTOR,
    SCENARIOS, scenarioOf, scenarioLock, stageName, payout,
    create, turnLabel, turnYear, turnMonth, turnHalf, isSummerCamp, finaleRaceAt, weatherOf, SEASONS,
    rnd, moodName, moodTrain, moodRace, failChance, facilityLevel, trainPreview, condName,
    train, rest, recreation, infirmary, passTurn,
    racesOn, canEnter, upcomingRaces, resolveRace, bestDistance, bestSurface,
    raceSetup, applyRaceResult,
    finaleDistance, finaleSurface, finaleRace, applyFinaleResult,
    goalStatus, currentGoal, rating, grade, veteran,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Career = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
