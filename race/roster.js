/*
 * The eleven hand-authored racers -- the exhibition field -- and the courses.
 *
 * Who a racer IS comes from the real game. Her rarity, aptitude grades, starting stats,
 * stat bonuses, colour and unique skill are all GameTora's (tools/gametora-launch.json),
 * applied to every racer by tools/genroster.js into rosterdata.js. What stays here is
 * only what the real game has no equivalent for:
 *
 *   personality  how she spends the cards you give her (PERSONALITIES in ai.js)
 *   passives     unlocked by duplicate scout pulls, in the order listed
 *   style        the running style to prefer when her real strategy grades tie
 *                (Special Week is A as a pace chaser AND a late surger)
 *   sprite, blurb
 *
 * `ROSTER` is these eleven as rosterdata.js has them, so anything that reads this file
 * gets the real numbers. `HAND` is the raw list, for the generator.
 */
(function (root) {
  "use strict";

  const HAND = [
    { id: "taiki", name: "Taiki Shuttle", style: "pace", personality: "aggressive",
      sprite: "assets/racers/taiki-shuttle.png",
      passives: ["fast_break", "closers_kick", "deep_reserves"],
      blurb: "Sprint-mile specialist. Devastating over 1600m, empty past 2000m." },
    { id: "suzuka", name: "Silence Suzuka", style: "front", personality: "patient",
      sprite: "assets/racers/silence-suzuka.png",
      passives: ["front_heart", "economy", "cool_head"],
      blurb: "Runs away from the field and dares it to follow. Fragile if caught." },
    { id: "specialweek", name: "Special Week", style: "late", personality: "relentless",
      sprite: "assets/racers/special-week.png",
      passives: ["iron_lungs", "closers_kick", "second_wind"],
      blurb: "All-rounder with a genuine closing kick. Strong everywhere from 2000m up." },
    { id: "goldship", name: "Gold Ship", style: "ender", personality: "erratic",
      sprite: "assets/racers/gold-ship.png",
      passives: ["iron_lungs", "second_wind", "rail_runner"],
      blurb: "Enormous stayer, terrible judgement. Wins from last or loses by twenty." },
    { id: "rudolf", name: "Symboli Rudolf", style: "pace", personality: "calculating",
      sprite: "assets/racers/symboli-rudolf.png",
      passives: ["cool_head", "economy", "deep_reserves"],
      blurb: "Never out of position. The most efficient runner in the field." },
    { id: "vodka", name: "Vodka", style: "late", personality: "reckless",
      sprite: "assets/racers/vodka.png",
      passives: ["fast_break", "mud_lover", "closers_kick"],
      blurb: "Raw power. Comes from off the pace and takes the lead by force." },
    { id: "mcqueen", name: "Mejiro McQueen", style: "pace", personality: "cautious",
      sprite: "assets/racers/mejiro-mcqueen.png",
      passives: ["iron_lungs", "economy", "rail_runner"],
      blurb: "Stayer. Strong from 2000m and untouchable over the long trips." },
    { id: "urara", name: "Haru Urara", style: "late", personality: "relentless",
      sprite: "assets/racers/haru-urara.png",
      passives: ["second_wind", "iron_lungs", "mud_lover"],
      blurb: "Dirt sprinter. Never won a race, never stopped trying. Hopeless on turf." },
    { id: "oguri", name: "Oguri Cap", style: "late", personality: "opportunist",
      sprite: "assets/racers/oguri-cap.png",
      passives: ["rail_runner", "mud_lover", "closers_kick"],
      blurb: "The people's horse. A mile to 2400m, on turf or dirt." },
    { id: "teio", name: "Tokai Teio", style: "pace", personality: "relentless",
      sprite: "assets/racers/tokai-teio.png",
      passives: ["second_wind", "closers_kick", "cool_head"],
      blurb: "Comeback specialist. Closes on the leaders, then flies down the straight." },
    { id: "grass", name: "Grass Wonder", style: "late", personality: "calculating",
      sprite: "assets/racers/grass-wonder.png",
      passives: ["cool_head", "rail_runner", "closers_kick"],
      blurb: "Precise closer. Times the run to the metre when the gap opens." },
  ];

  const COURSES = [
    { id: "sprint",  name: "Nakayama Sprint",   distance: 1200, surface: "turf" },
    { id: "mile",    name: "Yasuda Mile",       distance: 1600, surface: "turf" },
    { id: "classic", name: "Tokyo Classic",     distance: 2400, surface: "turf" },
    { id: "stayer",  name: "Kyoto Spring Stay", distance: 3200, surface: "turf" },
  ];

  /* rosterdata.js loads after this file in the browser, so the lookup waits until
     someone asks. Without it (the generator itself) the raw list is all there is. */
  let merged = null;
  function data() {
    if (typeof require !== "undefined") {
      try { return require("./rosterdata.js"); } catch (e) { return null; }
    }
    return root.RosterData || null;
  }
  const api = {
    HAND, COURSES,
    get ROSTER() {
      if (merged) return merged;
      const D = data();
      if (!D) return HAND;
      return (merged = HAND.map(h => D.ROSTER.find(r => r.id === h.id) || h));
    },
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Roster = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
