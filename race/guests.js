/*
 * Guest racers: characters from outside Umamusume who visit Tracen Academy.
 *
 * Everyone in rosterdata.js is her real self, taken from the real game's data. A guest
 * cannot be, so guests live here, hand-written, and say so: `guest: true`, a "Guest" tag in
 * the stable, never offered by the scout, no duplicates. Every trainer who has picked a
 * starter has them (Stable gives them out); they race, train and walk the academy like
 * anyone else. Sonic also runs in Post Parade Adventure 2 (adventure.js), the arcade
 * cabinet in the hall, with five of his friends.
 *
 * What each guest is rests on their own canon, researched (November 2026):
 *
 * SONIC THE HEDGEHOG (SEGA)
 *   - 100cm and 35kg, 15 years old, born 23 June (the day the first game came out)
 *   - "the world's fastest hedgehog": runs at supersonic speed
 *   - a free spirit who lives the way he wants; easygoing and quick-witted, but short-tempered
 *     and impatient with anything slow; a daredevil, loyal, keeps his promises; loves chili dogs
 *   - the Spin Dash (Sonic 2: rev in place, then blast off) and the Homing Attack
 *     (Sonic Adventure)
 *   - cannot swim: he "sinks like a rock" -- Yuji Naka's choice
 *   - SEGA has said it usually has no problem with Sonic fan games that are not monetised
 *   So: a front runner, A from sprint to mile, Reckless, and a signature skill that is a Spin
 *   Dash out of the gate.
 *
 * HATSUNE MIKU (Crypton Future Media)
 *   - 16, 158cm, 42kg (piapro.net); her name is "the first sound of the future"; released
 *     31 August 2007; voiced by Saki Fujita; designed by KEI in Yamaha-synthesizer blue-green
 *   - a virtual singer who performs live in front of real crowds; Project SEKAI plays her
 *     cheerful, at home in every genre, and quietly there for her friends
 *   - Racing Miku, Good Smile Racing's mascot in SUPER GT since 2008; SNOW MIKU,
 *     the Sapporo Snow Festival's, since 2010; a guest racer in Sonic Racing: CrossWorlds (2025)
 *   - the Piapro Character License allows non-commercial fan works of her, credited to Crypton
 *   So: a pace chaser good from a mile to the middle distance, Calculating (she keeps
 *   perfect time), and a signature skill named for her name, timed for the encore.
 *
 * Exposes Guests { LIST, ids, isGuest(id), credit }, and appends LIST to RosterData.ROSTER.
 */
(function (root) {
  "use strict";

  const LIST = [
    {
      id: "sonic", name: "Sonic", guest: true, from: "SEGA's Sonic the Hedgehog",
      sprite: "assets/guests/sonic.png",
      outfits: [{ id: "o0", name: "Default", art: "assets/guests/sonic.png" }],
      passives: ["fast_break", "front_heart", "second_wind"],
      personality: "reckless",
      blurb: "The world's fastest hedgehog. Out of the gate first and gone. Hates waiting, hates water.",
      rarity: 3, title: "the blue blur", color: "#1F56C8",
      style: "front",
      /* Sprint A, not S: with S he won seven sprints in ten against the field, where the
         real game's sprint queen (Sakura Bakushin O) wins about half. A free guest should
         be good, not the end of sprinting. */
      aptitude: { sprint: "A", mile: "A", medium: "C", long: "F", turf: "A", dirt: "A" },
      stats: { speed: 930, stamina: 560, power: 820, guts: 820, wit: 690 },
      growth: { speed: 1.3, stamina: 0.88, power: 1.08, guts: 0.98, wit: 0.88 },
      specialty: "sprint",
      unique: {
        name: "Spin Dash Getaway",
        text: "He revs in the gate and blasts out of it -- and if he is in the first three on the final straight, he goes again.",
        when: { fracMax: 0.1 },
        effects: [{ t: "accel", amount: 0.9, dur: 3 }, { t: "speed", amount: 0.08, dur: 3 }],
        groups: [
          { when: { fracMax: 0.1 }, effects: [{ t: "accel", amount: 0.9, dur: 3 }, { t: "speed", amount: 0.08, dur: 3 }] },
          { when: { zone: "lastStraight", rankBetter: 3 }, effects: [{ t: "speed", amount: 0.15, dur: 4 }], follow: true },
        ],
      },
      career: {
        debut: { metres: 1200, surface: "turf" },
        goals: [
          { kind: "race", by: 11, place: 18, races: ["debut"] },
          { kind: "race", by: 20, place: 5, races: ["keio-hai-junior-stakes-1"] },
          { kind: "race", by: 32, place: 5, races: ["nhk-mile-cup-2"] },
          { kind: "race", by: 41, place: 3, races: ["sprinters-stakes-2"] },
          { kind: "race", by: 53, place: 3, races: ["takamatsunomiya-kinen-3"] },
          { kind: "race", by: 58, place: 1, races: ["yasuda-kinen-3"] },
          { kind: "race", by: 65, place: 1, races: ["sprinters-stakes-3"] },
          { kind: "race", by: 69, place: 1, races: ["mile-championship-3"] },
        ],
      },
    },
    {
      id: "miku", name: "Hatsune Miku", guest: true, from: "Crypton Future Media",
      sprite: "assets/guests/miku.png",
      outfits: [{ id: "o0", name: "Default", art: "assets/guests/miku.png" }],
      passives: ["cool_head", "economy", "closers_kick"],
      personality: "calculating",
      blurb: "The virtual singer, visiting from the future. Keeps perfect time, saves her voice for the encore.",
      rarity: 3, title: "first sound of the future", color: "#39C5BB",
      style: "pace",
      aptitude: { sprint: "C", mile: "A", medium: "A", long: "B", turf: "A", dirt: "B" },
      stats: { speed: 840, stamina: 790, power: 720, guts: 800, wit: 930 },
      growth: { speed: 1.08, stamina: 1.08, power: 0.88, guts: 0.88, wit: 1.28 },
      specialty: "medium",
      unique: {
        name: "First Sound of the Future",
        text: "On the final straight, from the front half of the field, the crowd calls for an encore -- she gets her breath back and sings it.",
        when: { zone: "lastStraight", pctMax: 50 },
        effects: [{ t: "heal", amount: 0.06 }, { t: "speed", amount: 0.17, dur: 5 }],
      },
      career: {
        debut: { metres: 1600, surface: "turf" },
        goals: [
          { kind: "race", by: 11, place: 18, races: ["debut"] },
          { kind: "race", by: 22, place: 5, races: ["asahi-hai-futurity-stakes-1"] },
          { kind: "race", by: 30, place: 5, races: ["oka-sho-2"] },
          { kind: "race", by: 43, place: 3, races: ["shuuka-sho-2"] },
          { kind: "race", by: 53, place: 3, races: ["osaka-hai-3"] },
          { kind: "race", by: 58, place: 1, races: ["yasuda-kinen-3"] },
          { kind: "race", by: 67, place: 1, races: ["tenno-sho-autumn-3"] },
          { kind: "race", by: 71, place: 1, races: ["arima-kinen-3"] },
        ],
      },
    },
  ];

  /* Shown wherever a guest is credited (the stable, the README). */
  const credit = {
    sonic: "Sonic the Hedgehog is SEGA's. A guest in a free fan game, not for sale.",
    miku: "Hatsune Miku © Crypton Future Media, Inc. 2007 — piapro.net. Used under the Piapro Character License.",
  };

  const ids = LIST.map(g => g.id);
  const isGuest = id => ids.indexOf(id) >= 0;

  /* rosterdata.js loads just before this file: guests join the catalogue there, so anything
     that looks a racer up (the stable, the race, the lobby) finds them. */
  const D = root.RosterData;
  if (D && Array.isArray(D.ROSTER)) for (const g of LIST) if (!D.ROSTER.some(r => r.id === g.id)) D.ROSTER.push(g);

  const api = { LIST, ids, isGuest, credit };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Guests = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
