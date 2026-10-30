/*
 * The opening scene of a career, written for the racer who is running it.
 *
 * It used to be four lines of Tazuna saying the same thing to everyone, which made the
 * moment a career actually begins the most anonymous screen in the game. Each racer now
 * opens her own run, in her own voice, saying what she is here for.
 *
 * TWO SOURCES, in this order:
 *
 *   1. AUTHORED. The eleven hand-written racers have scenes written for them, because
 *      they are the ones whose characters this game actually establishes (roster.js
 *      gives them blurbs, personalities and uniques that were chosen, not derived).
 *
 *   2. COMPOSED. The other 126 come out of tools/genroster.js, and what is true about
 *      them is what that generator decided: her running style, the trip she is graded
 *      for, the ground she prefers, and the unique skill she was given. Her scene is
 *      built from exactly those facts, so it is about HER even though nobody wrote it.
 *
 * This is not the real game's scenario script. I have not reproduced those and could
 * not without the source text; what this does is make every racer's opening specific to
 * her rather than generic. Anything in AUTHORED can be replaced with the real dialogue
 * at any time -- the shape is already right, it is a list of beats.
 *
 * A beat is { who, text, show } where `show` optionally reveals a panel:
 *   "apt"    her aptitude grades
 *   "unique" her unique skill
 *   "legacy" what she inherited
 *   "goal"   the first thing the board wants
 *
 * Exposes Intros.
 */
(function (root) {
  "use strict";

  const Sim = typeof require !== "undefined" ? require("./sim.js") : root.Sim;

  const TAZ = "Tazuna Hayakawa";

  /* ---------------------------------------------------------------- authored
     One scene each for the racers this game has actually characterised. Her own lines
     come first: the run is hers, and the opening should sound like it. */
  const AUTHORED = {
    taiki: [
      { self: "Dirt, turf, sprint, mile — I have never much minded which. Point me at a gate and I will go." },
      { who: TAZ, text: "She is not exaggerating. Taiki Shuttle is the most forgiving racer in this stable to build, which makes her the easiest one to build badly.", show: "apt" },
      { self: "So do not be careful with me. Pick the trip, commit to it, and I will get there." },
    ],
    suzuka: [
      { self: "I go to the front. Not to lead — because that is where the running is honest." },
      { who: TAZ, text: "Silence Suzuka is the fastest thing on this campus over a mile and the most fragile if she is caught. There is no plan B in that style.", show: "apt" },
      { self: "Then give me enough to hold it. I would rather break in front than finish safe." },
    ],
    specialweek: [
      { self: "I want to be the best in Japan. I know how that sounds. I am saying it anyway." },
      { who: TAZ, text: "Special Week stays, and she has a kick at the end of it. Middle and long trips — she is one of the few here who can actually use three thousand metres.", show: "apt" },
      { self: "Then let us find out how far I can carry it." },
    ],
    goldship: [
      { self: "No plan. Plans are for people who know what is going to happen." },
      { who: TAZ, text: "Gold Ship will ignore half of what you build and win anyway, or she will do something inexplicable at the top of the straight. That is not a flaw in your training.", show: "apt" },
      { self: "Relax, trainer. It works out. Usually. Mostly." },
    ],
    rudolf: [
      { self: "I do not intend to lose. Not out of arrogance — because it is the standard I hold." },
      { who: TAZ, text: "Symboli Rudolf is the most complete racer here. Everything works, nothing is spectacular, and she has never needed it to be.", show: "apt" },
      { self: "Build me properly and I will not give you a reason to worry." },
    ],
    vodka: [
      { self: "Mile, middle, turf, dirt. I will take whatever is going and I will not complain about it." },
      { who: TAZ, text: "Vodka is the most flexible racer in this stable. That is a strength and it is a trap — flexible means you have to choose, because she will not choose for you.", show: "apt" },
      { self: "So choose. I am not fussy, but I am not going to be good at everything either." },
    ],
    mcqueen: [
      { self: "Distance is not endurance. It is composure. Anyone can be tired; the trick is to be tired and still elegant." },
      { who: TAZ, text: "Mejiro McQueen is a stayer of the old school. Give her three thousand metres and she is the best racer on the grounds.", show: "apt" },
      { self: "Then we understand each other. Long trips, and no fussing." },
    ],
    urara: [
      { self: "I have never won. Not once. I would like to try again anyway, if that is all right." },
      { who: TAZ, text: "Haru Urara is the weakest racer here on paper and it is not close. She is also a dirt sprinter with more heart than anyone I have trained.", show: "apt" },
      { self: "Paper does not run the race though. Does it?" },
    ],
    oguri: [
      { self: "I came from a small track nobody watches. I am still hungry. Both meanings." },
      { who: TAZ, text: "Oguri Cap arrived from provincial racing and outran everyone who thought that mattered. She is strong over a mile and she does not tire the way she should.", show: "apt" },
      { self: "So point me at whoever is supposed to beat me." },
    ],
    teio: [
      { self: "I have been hurt before. I came back before. I will do it again if I have to." },
      { who: TAZ, text: "Tokai Teio is brilliant and she is breakable. Watch her energy — this is the one racer where resting is not the cautious option, it is the correct one.", show: "apt" },
      { self: "Do not wrap me in cotton, though. I did not come back for that." },
    ],
    grass: [
      { self: "I am not the fastest here. I am the one who is still there at the end." },
      { who: TAZ, text: "Grass Wonder finishes. Whatever the pace has done to the field, she is coming through the last two hundred metres.", show: "apt" },
      { self: "So build the finish. The rest of the race is just getting there." },
    ],
  };

  /* ---------------------------------------------------------------- composed */
  const STYLE_LINE = {
    front: "I go to the front and I stay there. It is the only way I know how to run.",
    pace:  "I sit just off the lead, where I can see everything, and I go when it opens.",
    late:  "I let them go early. They always come back to me.",
    ender: "I come from last. Give me the straight and I will find a way through it.",
  };
  const STYLE_NOTE = {
    front: "A front runner spends her stamina on track position, so she needs enough of it to still be there at the end.",
    pace:  "A pace chaser is the most adaptable position in a race and the least forgiving of a bad read.",
    late:  "A late surger carries more fuel than most and needs somewhere to spend it — build the finish.",
    ender: "An ender starts furthest back and needs both the stamina to get there and the power to get through.",
  };
  const DIST_LINE = {
    sprint: "Short and fast. I do not want to be out there any longer than I have to be.",
    mile:   "A mile. Long enough to matter, short enough to stay honest.",
    medium: "Middle distance. Far enough that how you got there starts to count.",
    long:   "The long ones. Everyone else runs out before I do.",
  };
  const DIST_WORD = { sprint: "sprints", mile: "the mile", medium: "middle distances", long: "long trips" };

  const bestOf = (apt, keys) => {
    const rank = { S: 6, A: 5, B: 4, C: 3, D: 2, E: 1, F: 0, G: -1 };
    return keys.slice().sort((a, b) => (rank[apt[b]] || 0) - (rank[apt[a]] || 0))[0];
  };

  /** A scene assembled from what the generator actually decided about her. */
  function composed(def, apt) {
    const dist = bestOf(apt, ["sprint", "mile", "medium", "long"]);
    const surf = bestOf(apt, ["turf", "dirt"]);
    const styleName = (Sim.STYLES[def.style] || {}).name || def.style;
    const grade = apt[dist];
    const star = (def.rarity || 1) >= 3 ? "She arrives with a reputation already attached. "
               : (def.rarity || 1) === 1 ? "Nobody is expecting much of her. That has never stopped anyone. "
               : "";

    const beats = [
      { self: STYLE_LINE[def.style] || "I run my own race." },
      { who: TAZ,
        text: star + `${def.name} is a ${styleName.toLowerCase()} graded ${grade} over ` +
              `${DIST_WORD[dist]}, and she prefers ${surf}. ` + (STYLE_NOTE[def.style] || ""),
        show: "apt" },
      { self: DIST_LINE[dist] || "Point me at a race and I will run it." },
    ];

    if (def.unique) {
      beats.push({ who: TAZ,
        text: `And she has one thing nobody else does — ${def.unique.name}. ` +
              `It fires on its own, once a race. Build her so that moment is worth having.`,
        show: "unique" });
    }
    return beats;
  }

  /**
   * The scene for this run. `S` is the live career state, so the inherited-legacy beat
   * and the opening goal are appended from what this particular run actually has.
   */
  function forRacer(def, S) {
    if (!def) return [];
    const apt = (S && S.aptitude) || def.aptitude || {};
    const src = AUTHORED[def.id] || composed(def, apt);

    /* `self` is shorthand: she is speaking. */
    const beats = src.map(b => b.self
      ? { who: def.name, text: b.self, show: b.show, self: true }
      : Object.assign({}, b));

    const plan = S && S.legacyPlan;
    if (plan && (Object.keys(plan.stats || {}).length || plan.unique)) {
      beats.push({ who: TAZ,
        text: `She did not arrive empty-handed either. Her line came through — that is ` +
              `${Math.round(plan.affinity * 100)}% affinity behind her.`,
        show: "legacy" });
    }

    /* The opening scene must never be the reason a career fails to start, so the goal
       lookup cannot throw the whole thing away if the state is not what it expects. */
    let goal = null;
    try { if (S && root.Career) goal = Career.currentGoal(S); } catch (e) {}
    beats.push({ who: TAZ,
      text: goal ? `First thing the board wants: ${goal.text}. Miss it and the run ends there.`
                 : `No goals outstanding. Just win.`,
      show: "goal" });

    return beats;
  }

  const api = { forRacer, AUTHORED, authoredCount: () => Object.keys(AUTHORED).length };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Intros = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
