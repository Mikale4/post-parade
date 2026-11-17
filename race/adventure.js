/*
 * Post Parade Adventure 2 -- the arcade cabinet in the hall.
 *
 * A side-on platformer in the race's own voxels: the same mesher, the same light, seen from
 * the side. Its runners are fourteen, each in their own 2D sprites in Sonic Battle's style: Sonic,
 * Tails, Knuckles, Amy, Rouge, Shadow, Cream, Chaos and Chaos Gamma from SEGA's Sonic Battle
 * (Game Boy Advance, 2003), ripped by QuadFactor (The Spriters Resource); Dr. Eggman, Metal
 * Sonic, Mighty and Silver drawn in its style by TheKnucklesMainG4 (DeviantArt).
 * Emerl, the fourteenth, fights with the moves he has copied off the others (adventure-emerl.js,
 * tools/pack-emerl.py): Sonic Battle's sheets of him, re-ripped by Dinoshi 64 (some rips by Mr. C).
 * adventure-sprites.js holds the frames, tools/pack-sonic-battle.py cuts them. Thirteen stages
 * run left to right to a winning post, each one runner's own ground, as Sonic Battle gives each
 * fighter a home arena -- Sonic's clifftops over the sea, Tails' workshop and airstrip, Amy's
 * home seen from the floor up, Knuckles' shrines up a snowy mountain, Rouge's club and the
 * casino street, Shadow's road out of the city at sundown, Cream's natural history hall,
 * Chaos's springs under the old shrine, Mighty's canyon, Silver's burning city two hundred
 * years on, Gamma's storage depot in Eggman's hideout, Metal Sonic's racecourse among the
 * stars, and last Eggman's own station in orbit -- each long and tall the way the Genesis and
 * Game Boy Advance acts are, with a low road, a high one and the sky over both. In them are
 * Eggman's badniks, in their own sprites -- from Sonic Advance 1, 2 and 3 in the first six,
 * TheKnucklesMainG4's Modern Sonic Badniks in the rest (adventure-badniks.js;
 * tools/pack-badniks.py cuts them) -- each doing what it does in its own game.
 *
 * The fighting is Sonic Battle's, every move off the runner's own sheet. That game puts its
 * attacks on B and its specials on R; here they are three buttons:
 *   Space       jump; again in the air, the runner's air action
 *   Z           light attack: the sheet's 1st, 2nd and 3rd attacks, a combo
 *   X           heavy attack (a combo ends well in one); Up + X the upper attack; Down + X
 *               the aim attack, a dash at the nearest thing and a blow; dashing, the dash
 *               attack; in the air, the air attack
 *   C           special: the shot; Up + C the power; Down + C the trap, and again to set it
 *               off. In the air each is its air version. (Sonic Battle has the player slot
 *               one special for the ground and one for the air before a match; here all
 *               three are always to hand.)
 *   a double tap of a direction: the dash, each runner's own. Down: crouch (the landing
 *   frames). Down + Space: a Spin Dash for everyone but Rouge (for her it does nothing), or
 *   a drop through a plank.
 *   Only Sonic's sheet has a Spin Dash; the others spin his, in their own colours.
 * The moving is their platformers': everyone sinks in deep water and needs air, as in the
 * classic games (Tails alone swims, by flying).
 *   Sonic     the fastest feet; Spin Dash (Sonic 2). In the
 *             air, Sonic Ballet: a second jump that homes on anything near, curled, as the
 *             Homing Attack does (Sonic Adventure).
 *   Tails     flies (Sonic 2 & 3): Space again in the air, tapped to climb, until he tires
 *             after about five seconds; under water the same stroke swims. Spin Dash.
 *   Knuckles  the slowest and lowest jumper, the hardest hitter. Space again in the air,
 *             held, glides; a glide into a wall grabs it, and Up and Down climb (Sonic &
 *             Knuckles), over the top when it ends. Spin Dash. Sonic Battle draws no climb, so
 *             his grab, cling, climb and pull-up are Sonic Advance's (ripped by AsuharaMoon),
 *             in his Sonic Battle colours.
 *   Amy       her Piko Piko Hammer is in her heavy, upper and air attacks, and Up + X
 *             swings her into a Hammer Jump (Sonic Advance). Double Jump. Spin Dash.
 *   Rouge     flies on her wings for a short while, then glides down slowly; Down lets go
 *             (Rouge Catch). Kicks, and Spiral Dive drills down through rock.
 *   Shadow    the fastest in Sonic Battle, skating on his Air Shoes; Chaos Control: Space in
 *             the air teleports him ahead, twice a jump, drifting down. Z in the air is his
 *             Homing Attack. Spin Dash; Chaos Spear (his shot) and Chaos Burst.
 *   Cream     the highest jump; flies on her ears (Space again in the air, tapped), and Cheese
 *             the Chao does her fighting, in every blow and special. Spin Dash.
 *   Chaos     water itself: swims, a stroke for each Space, and never needs air; a double tap
 *             melts him into Chaos Dive, nothing touching him; Chaos Flight, a little more height.
 *   Gamma     walks slowly; a double tap is Drive Mode, fast and steerable while held; Flight
 *             Mode in the air, sinking slowly; Devastator charges while C is held; Meltdown
 *             (Up + C) costs him a heart.
 *   Eggman    his Egg Mobile hovers off the ground; Egg Hover holds him up a while in the air,
 *             then he sinks slowly. The Death Egg Cannon, missiles, bombs.
 *   Metal     the fastest after Shadow; his jet in the air, a burst ahead and a hover; the
 *             Black Shield (Up + C) lets nothing through. Spin Dash.
 *   Mighty    Shell Launch, straight up, and a wall jump off any wall (Knuckles' Chaotix);
 *             curled, spikes can't hurt him; Hammer Drop (Up + C in the air) breaks rock and
 *             sends a shockwave both ways (Sonic Mania Plus). Spin Dash.
 *   Silver    the Air Psycho Dash: ahead, a hover, then Space held floats him down; Psycho
 *             Knife, Surge and Orb. Spin Dash.
 *
 * The main menu (after the title) has six: Story, Free Exhibition, Battle, Training, Options
 * and Exit.
 *   Story     The Golden Horseshoes (adventure-story.js): twenty chapters, each a scene of talk
 *             between the cast in their Sonic Battle portraits, then a stage to run or a battle
 *             to win as one of them, then the talk after, on thirteen stages of its own.
 *   Free Exhibition  any runner on any stage opened: the thirteen stages, run for time, carrots,
 *             grades and the Golden Horseshoes (clearing one opens the next).
 *   Battle    Sonic Battle's fights with health: up to four fighters, players or CPUs (Easy,
 *             Normal, Hard), everyone for themselves or Red against Blue, in any runner's
 *             arena; a KO match or Survival, a time limit. Down guards, and held still heals.
 *             Two players share the keyboard (Options sets their keys) or a pad each.
 *   Training  The same fight on a dummy that stands, guards, walks, jumps or fights back.
 *   Options   Music, sound, dialogue speed and screen shake (the game's own settings), and the
 *             two players' keys.
 *
 * Stages are drawn as text in adventure-stages.js (tools/genstages.py draws them): a grid of
 * one-metre tiles 32 rows tall, read left to right. The legend is there. Clearing a stage opens the next; each hides three
 * Golden Horseshoes. Best times, grades and horseshoes are kept per trainer; first clears
 * and first finds pay carrots into the stable.
 *
 *   Adventure.open(el, { onExit })   -- builds the cabinet's screens in `el` and runs
 *   Adventure.close()
 */
(function (root) {
  "use strict";
  const THREE = root.THREE, V = root.Voxel;
  if (!THREE || !V || !V.ok || !V.kit) { root.Adventure = { ok: false }; return; }
  const { Vox, meshVox, mulC, mixC, mulberry32 } = V.kit;
  const PI = Math.PI;
  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  const lerp = (a, b, k) => a + (b - a) * k;
  const sgn = v => v < 0 ? -1 : v > 0 ? 1 : 0;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ico = (n, s) => (root.Icon ? root.Icon(n, s) : "");
  const LOW_POWER = !!(root.matchMedia && matchMedia("(pointer:coarse)").matches) || (navigator.hardwareConcurrency || 8) <= 4;
  const TOUCH = !!(root.matchMedia && matchMedia("(pointer:coarse)").matches);

  // ---------------------------------------------------------------- the six
  /* Speeds in metres a second, gravity 34 m/s^2: a 12.4 jump clears two metres; a spring
     throws anyone about six and a half. Run speeds follow Sonic Battle's ratings (Shadow 8,
     Sonic 7, Tails and Amy 6, Rouge 5, Knuckles 3, of 9); every jump still clears two
     metres, the stages' rule. A jump out of a Spin Dash or a roll stays a ball and hurts what
     it touches; any other jump is the runner's own jumping frames. */
  const CAST = [
    { id: "sonic", name: "Sonic", w: 0.56, h: 1.02, run: 14.6, accel: 22, airAccel: 14, jump: 12.4,
      spinDash: true, air: "ballet", from: "Sonic the Hedgehog",
      moves: "Spin Dash · Sonic Ballet",
      grades: { Speed: "S", Jump: "B", Air: "B", Power: "B" },
      text: "The fastest feet. Down + Space revs a Spin Dash; jump out of it as a ball. In the air, Sonic Ballet homes on anything near." },
    { id: "tails", name: "Tails", w: 0.56, h: 0.96, run: 13.6, accel: 19, airAccel: 14, jump: 12.1,
      spinDash: true, air: "fly", flyTime: 5, from: "Miles \"Tails\" Prower",
      moves: "Flight · Energy Ball",
      grades: { Speed: "A", Jump: "C", Air: "S", Power: "C" },
      text: "Space again in the air to fly, tapping to climb, until he tires; under water he swims. Energy Ball, and a Big Hand." },
    { id: "knuckles", name: "Knuckles", w: 0.62, h: 1.06, run: 11.6, accel: 16, airAccel: 11, jump: 12.0,
      spinDash: true, air: "glide", climb: true, from: "Knuckles the Echidna",
      moves: "Glide · Climb",
      grades: { Speed: "C", Jump: "C", Air: "A", Power: "S" },
      text: "Hold Space in the air to glide; glide into a wall to grab it, then climb with Up and Down. Slow, and hits the hardest." },
    { id: "amy", name: "Amy", w: 0.54, h: 1.0, run: 13.6, accel: 20, airAccel: 13, jump: 12.1,
      spinDash: true, air: "double", from: "Amy Rose",
      moves: "Piko Piko Hammer",
      grades: { Speed: "A", Jump: "B", Air: "B", Power: "A" },
      text: "A Double Jump, a Spin Dash, and her Piko Piko Hammer: Up + X swings her into a Hammer Jump. The quickest fists of the six." },
    { id: "rouge", name: "Rouge", w: 0.56, h: 1.14, run: 12.9, accel: 18, airAccel: 15, jump: 12.4,
      air: "fly", flyTime: 3, glides: true, from: "Rouge the Bat",
      moves: "Flight · Spiral Dive",
      grades: { Speed: "B", Jump: "B", Air: "A", Power: "B" },
      text: "Space again in the air to fly a while, then she glides down; Down lets go. Up + C in the air: Spiral Dive, down through rock." },
    { id: "shadow", name: "Shadow", w: 0.56, h: 1.06, run: 15.4, accel: 24, airAccel: 15, jump: 12.8,
      spinDash: true, air: "teleport", from: "Shadow the Hedgehog",
      moves: "Chaos Control",
      grades: { Speed: "S", Jump: "A", Air: "A", Power: "A" },
      text: "Chaos Control: Space in the air teleports him ahead, twice a jump. Z in the air is a Homing Attack; C a Chaos Spear." },
    /* The second seven. Cream, Chaos and Chaos Gamma are Sonic Battle's own; Eggman, Metal
       Sonic, Mighty and Silver are drawn in its style by TheKnucklesMainG4. Their moves are
       the ones their sheets and Sonic Battle give them; their moving is their own games'. */
    { id: "cream", name: "Cream", w: 0.54, h: 0.98, run: 12.3, accel: 19, airAccel: 15, jump: 13.2,
      spinDash: true, air: "fly", flyTime: 4, flyK: 0.7, from: "Cream the Rabbit",
      moves: "Flight · Cheese the Chao",
      grades: { Speed: "C", Jump: "S", Air: "S", Power: "C" },
      text: "The highest jump. Space again in the air: she flies on her ears, tapping to climb. Cheese the Chao does her fighting." },
    { id: "chaos", name: "Chaos", w: 0.6, h: 1.12, run: 10.6, accel: 15, airAccel: 11, jump: 12.0,
      air: "float", swims: true, dashK: 1.55, dashT: 0.5, dashInv: true, from: "Chaos (Chaos 0)",
      moves: "Chaos Dive · swims",
      grades: { Speed: "C", Jump: "C", Air: "C", Power: "B" },
      text: "Water itself: he swims, Space for each stroke, and never runs out of air. A double tap melts him into Chaos Dive, untouchable." },
    { id: "gamma", name: "Chaos Gamma", w: 0.66, h: 1.2, run: 10.8, accel: 14, airAccel: 10, jump: 12.2,
      air: "hover", flyTime: 2.4, sink: 1.2, flyK: 1.25, dashK: 1.7, dashT: 0.75, steer: true, from: "Chaos Gamma",
      moves: "Drive Mode · Flight Mode",
      grades: { Speed: "C", Jump: "B", Air: "A", Power: "S" },
      text: "Walks slowly; a double tap is Drive Mode, fast and steerable. Space in the air: Flight Mode. Hold C to charge Devastator." },
    /* the Egg Mobile is a hovercraft: it floats `lift` metres off the ground, bobbing, its
       shadow on the floor under it (his body is that much taller to things over him) */
    { id: "eggman", name: "Dr. Eggman", w: 0.92, h: 1.6, lift: 0.42, run: 12.5, accel: 17, airAccel: 13, jump: 12.4,
      air: "hover", flyTime: 2.2, sink: 0, glides: true, flyK: 0.9, from: "Dr. Ivo \"Eggman\" Robotnik",
      moves: "Egg Hover · Death Egg Cannon",
      grades: { Speed: "B", Jump: "B", Air: "A", Power: "A" },
      text: "In his Egg Mobile. Space in the air holds him up a while, then he sinks slowly; Down lets go. Missiles, bombs and a cannon." },
    { id: "metal", name: "Metal Sonic", w: 0.56, h: 1.04, run: 15.0, accel: 23, airAccel: 15, jump: 12.4,
      spinDash: true, air: "jet", dashK: 1.4, from: "Metal Sonic",
      moves: "Spin Dash · Jet",
      grades: { Speed: "S", Jump: "B", Air: "A", Power: "A" },
      text: "Built to outrun Sonic. Space in the air fires his jet: a burst ahead and a moment's hover. Up + C raises the Black Shield." },
    { id: "mighty", name: "Mighty", w: 0.58, h: 1.04, run: 13.6, accel: 20, airAccel: 13, jump: 12.2,
      spinDash: true, air: "launch", from: "Mighty the Armadillo",
      moves: "Shell Launch · Hammer Drop",
      grades: { Speed: "A", Jump: "B", Air: "B", Power: "S" },
      text: "Space in the air: Shell Launch, straight up; against a wall, a wall jump. Curled, spikes can't hurt him. Up + C in the air: Hammer Drop." },
    /* Emerl, Sonic Battle's Gizoid: he copies what he sees. His move set is his own until he wins
       fights, and every win teaches him one move of someone else's -- one of eight he has seen, at
       random, never one he knows -- which he can then use in its slot in place of his own
       (Emerl's Skills). What his CAST entry says is his own, before he has learned anything. */
    { id: "emerl", name: "Emerl", w: 0.56, h: 1.04, run: 12.6, accel: 18, airAccel: 13, jump: 12.2,
      air: "double", from: "Emerl (Gizoid)",
      moves: "Copies the moves he wins",
      grades: { Speed: "B", Jump: "B", Air: "B", Power: "B" },
      text: "A Gizoid that copies what it sees. Each battle he wins teaches him one move of someone else's; set them in Emerl's Skills." },
    { id: "silver", name: "Silver", w: 0.58, h: 1.12, run: 13.9, accel: 21, airAccel: 15, jump: 12.2,
      spinDash: true, air: "psy", from: "Silver the Hedgehog",
      moves: "Psychokinesis",
      grades: { Speed: "A", Jump: "B", Air: "A", Power: "A" },
      text: "Space in the air: an Air Psycho Dash ahead, a hover, then hold Space to float down. Psycho Knife, Psycho Surge, Psycho Orb." },
  ];
  const castOf = id => CAST.find(c => c.id === id) || CAST[0];
  /** which runner a move of p's comes from: their own, or for Emerl whose he copied in that slot */
  const srcOf = (p, slot) => (p.c.emerl && p.c.emerl[SLOT_OF[slot] || slot]) || p.c.id;
  const SLOT_OF = { idle: "pose", run: "run", skid: "run", start: "run", dash: "dash", jump: "jump", fall: "jump", land: "jump", seek: "aim" };

  /* The attacks, per runner, by the sheet's own rows: fps, and how far in front the blow
     reaches (metres). The blow lands in the middle of the animation; `step` is how far it
     carries the runner forward (m/s). Knuckles is slow and Amy quick, as Sonic Battle has
     them; Tails' Magic Hook and Amy's Girl Crush reach the furthest. */
  const BLOWS = {
    base:     { atk1: [22, 0.7, 2], atk2: [22, 0.75, 2.4], atk3: [20, 0.9, 3.4], heavy: [24, 1.15, 3.5], upper: [20, 0.85, 1.2],
                dashatk: [20, 1.0, 0], airatk: [20, 0.9, 0], aim: [22, 1.0, 2] },
    tails:    { heavy: [24, 1.8, 1] },
    knuckles: { atk1: [17, 0.8, 2.6], atk2: [17, 0.85, 3], atk3: [16, 0.95, 3.6], heavy: [20, 1.2, 4], upper: [16, 0.9, 1] },
    amy:      { atk1: [27, 0.65, 2], atk2: [27, 0.7, 2.2], atk3: [25, 0.8, 3], heavy: [24, 1.65, 3], upper: [20, 1.1, 0], airatk: [20, 1.15, 0] },
    rouge:    { heavy: [24, 1.1, 4.5], dashatk: [20, 1.05, 0] },
    shadow:   { atk1: [25, 0.7, 2.4], atk2: [25, 0.8, 2.6], atk3: [24, 0.9, 3.6], heavy: [26, 1.1, 4] },
    /* Cheese does Cream's hitting, out in front of her (Chao Arch, Winder, Salom, Tornado ...);
       Chaos's arms stretch; Gamma's and Eggman's machines are slow and long; Eggman's arms,
       drill and wrecking ball reach furthest of all */
    cream:    { atk1: [22, 1.1, 1], atk2: [22, 1.1, 1.2], atk3: [22, 1.2, 1.6], heavy: [24, 1.35, 1], upper: [16, 1.0, 0.5],
                dashatk: [12, 1.2, 0], airatk: [12, 1.1, 0], aim: [12, 1.2, 2] },
    chaos:    { atk1: [28, 0.95, 2], atk2: [28, 1.0, 2.2], atk3: [26, 1.15, 3], heavy: [24, 1.3, 3], upper: [24, 1.0, 1],
                dashatk: [16, 1.1, 0], airatk: [20, 1.1, 0], aim: [20, 1.1, 2] },
    gamma:    { atk1: [34, 0.95, 2], atk2: [24, 1.0, 2.2], atk3: [30, 1.15, 3], heavy: [36, 1.35, 2.5], upper: [34, 1.0, 1],
                dashatk: [26, 1.3, 0], airatk: [22, 1.1, 0], aim: [30, 1.2, 2] },
    eggman:   { atk1: [30, 1.3, 1.5], atk2: [22, 1.4, 1.8], atk3: [20, 1.5, 2.5], heavy: [26, 1.6, 2.5], upper: [22, 1.4, 0.5],
                dashatk: [22, 2.0, 0], airatk: [26, 2.0, 0], aim: [24, 1.5, 2] },
    metal:    { atk1: [24, 0.75, 2.4], atk2: [28, 0.8, 2.6], atk3: [24, 0.95, 3.6], heavy: [26, 1.35, 3], upper: [26, 0.9, 1.2],
                dashatk: [18, 1.5, 0], airatk: [20, 0.95, 0] },
    mighty:   { atk1: [24, 0.75, 2.4], atk2: [24, 0.8, 2.6], atk3: [22, 0.95, 3.6], heavy: [26, 1.15, 3.5], upper: [22, 0.9, 1.2],
                dashatk: [20, 1.05, 0] },
    silver:   { atk1: [22, 0.75, 2], atk2: [22, 0.8, 2.4], atk3: [22, 1.1, 3.2], heavy: [22, 1.3, 3], upper: [26, 0.9, 1],
                dashatk: [18, 1.05, 0], airatk: [20, 1.0, 0] },
  };
  /* What Cheese does in each of Cream's blows: Chao Arch, Chao Winder, Chao Salom, Chao Tornado,
     Chao Upper (and Chao Dunk), Chao Dash (and Chao Circle) */
  const CHEESE = { atk1: "fx.cheese1", atk2: "fx.cheese2", atk3: "fx.cheese3", heavy: "fx.cheese4", upper: "fx.cheese5", aim: "fx.cheese5",
                   dashatk: "fx.cheese6", airatk: "fx.cheese6" };
  const blow = (c, name) => { const b = (BLOWS[c.id] || {})[name] || BLOWS.base[name]; return { fps: b[0], reach: b[1], step: b[2] }; };
  /* How a blow lands, by its row: the freeze-frame when it connects (seconds), the jolt through
     the picture, the size of the hit spark (metres), and the knock it gives what it hits (m/s
     forward, up). The finishers -- the third jab, the heavies, the upper, the dash and aim
     attacks -- hold the picture longest and throw furthest. Knuckles hits hardest of the six,
     and Amy's hammer blows land like a hammer. A hit spark is in the runner's colour. */
  const HITS = {
    atk1:    { stop: 0.035, shake: 0.04, spark: 0.95, kick: [6, 4] },
    atk2:    { stop: 0.04,  shake: 0.05, spark: 1.05, kick: [7, 4.5] },
    atk3:    { stop: 0.07,  shake: 0.14, spark: 1.4,  kick: [12, 7],  heavy: true },
    heavy:   { stop: 0.085, shake: 0.18, spark: 1.6,  kick: [15, 6],  heavy: true },
    upper:   { stop: 0.075, shake: 0.16, spark: 1.5,  kick: [3, 16],  heavy: true },
    dashatk: { stop: 0.07,  shake: 0.16, spark: 1.5,  kick: [16, 5],  heavy: true },
    airatk:  { stop: 0.05,  shake: 0.1,  spark: 1.2,  kick: [10, 2] },
    aim:     { stop: 0.06,  shake: 0.12, spark: 1.3,  kick: [11, 6],  heavy: true },
  };
  const HIT_C = { sonic: 0x9ad4ff, tails: 0xfff070, knuckles: 0xff9030, amy: 0xff80c0, rouge: 0xff70d0, shadow: 0xff4060,
                  emerl: 0xffa030, cream: 0x8ad8ff, chaos: 0x70c8ff, gamma: 0xff6040, eggman: 0xffc040, metal: 0x6a90ff, mighty: 0xff4a4a, silver: 0x70f0d0 };
  const hitWeight = (c, name) => c.id === "knuckles" || c.id === "mighty" ? 1.3 : c.id === "gamma" || c.id === "eggman" ? 1.2 :
                                 c.id === "amy" && /^(heavy|upper|airatk)$/.test(name) ? 1.25 : 1;

  /* How hard each lands: `charge` is the colour of the energy gathered while the move winds up;
     `pow` what its release does (a flash of that colour and size, a jolt through the picture,
     a recoil, a freeze-frame of `stop` seconds); `trail` the colour a shot leaves behind it, `k`
     its size, `ghost` a see-through one (wind, sound); `land` what a lobbed rock does when it
     comes down; `bits: 0` none of the flying bits. A `muzzle` is where on the firing frame the
     shot leaves from (metres ahead of the runner, metres up): Tails' cannon, Rouge's hand. The
     charge gathers there from frame `gfrom`, and the release bursts out of it the way the shot
     goes.

     The specials, as Sonic Battle has each one (Sonic Center's character FAQ and the Green
     Hill Zone's guide): `body` the runner's frames, `at` the frame it happens on, then what
     happens. Shots fly (`wave` ones run along the ground, `lob` ones arc and burst); powers
     strike an `area` in front or around, or move the runner (`drive`, `dive`, `tornado`);
     traps sit, or `chase`, or `orbit`, till something touches them or Down + C sets them off. */
  const SPECIALS = {
    sonic: {
      /* Sonic Wave: he spins in place, faster and faster, then lets go a sonic boom -- air
         breaking the sound barrier, so you can see through it -- that tears along the ground
         and throws him back. Sonic Storm is the same from the air, angled down. */
      shot:     { body: "rev", windup: 0.5, wave: "fx.shot", speed: 28, life: 0.5, recoil: 7, ghost: 1.3 },
      airshot:  { body: "rev", windup: 0.4, fly: "fx.airshot", speed: 26, down: 0.55, life: 0.45, recoil: 6, ghost: 1.3 },
      power:    { body: "power", fps: 18, at: 3, drive: true, pow: { c: 0x9ad4ff, flash: 2.2, shake: 0.12 } },   // Sonic Drive: throws a ring, spins after it
      airpower: { body: "ball", fps: 24, at: 0, dive: "meteor", pow: { c: 0x9ad4ff, flash: 2.8, shake: 0.26, stop: 0.05 } }, // Sonic Meteor
      trap:     { body: "trap", fps: 16, at: 4, trap: "mine" },                                                 // Sonic Cracker: a landmine
      airtrap:  { body: "airtrap", fps: 16, at: 4, trap: "mine", toss: true } },
    tails: {
      shot:     { body: "shot", fps: 30, at: 9, fly: "fx.shot", speed: 20, life: 0.7, loop: true, k: 1.5, trail: 0xfff070,   // Energy Ball, from his arm cannon
                  muzzle: [0.68, 0.55], gfrom: 6, charge: 0xfff070, pow: { c: 0xfff070, flash: 2.2, shake: 0.12, recoil: 3 } },
      airshot:  { body: "shot", fps: 30, at: 9, fly: "fx.shot", speed: 20, down: 0.6, life: 0.6, loop: true, k: 1.5, trail: 0xfff070,
                  muzzle: [0.68, 0.55], gfrom: 6, charge: 0xfff070, pow: { c: 0xfff070, flash: 2.2, shake: 0.12, recoil: 3 } },
      power:    { body: "power", fps: 16, at: 3, area: "fx.power", ax: 1.5, ay: 0.7, w: 2.1, h: 2.2, k: 1.5,           // Flick: a Big Hand
                  charge: 0xffffff, pow: { c: 0xffffff, flash: 3, shake: 0.22, stop: 0.06 } },
      airpower: { body: "airpower", fps: 16, at: 3, area: "fx.power", ax: 1.5, ay: 0.55, w: 2.1, h: 2.2, k: 1.5,
                  charge: 0xffffff, pow: { c: 0xffffff, flash: 3, shake: 0.22, stop: 0.06 } },
      trap:     { body: "trap", fps: 16, at: 3, trap: "chase" },                                                // Chu² Bomb: crawls after its mark
      airtrap:  { body: "airtrap", fps: 16, at: 3, trap: "chase", toss: true } },
    knuckles: {
      /* no dust or flying bits on his: the rock, the punch and the blast land on their light,
         the jolt and the freeze alone */
      shot:     { body: "shot", fps: 20, at: 8, lob: "fx.shot", speed: 8, rise: 9, k: 1.35, bits: 0,              // Rock Free Fall: a rock, lobbed
                  charge: 0xffc080, land: { c: 0xffc080, flash: 2.4, shake: 0.26, stop: 0.04, bits: 0 } },
      airshot:  { body: "airshot", fps: 18, at: 3, lob: "fx.shot", speed: 9, rise: -7, k: 1.35, bits: 0,            // Meteor Crush: hurled down
                  land: { c: 0xffc080, flash: 2.4, shake: 0.26, stop: 0.04, bits: 0 } },
      power:    { body: "power", fps: 32, at: 29, area: "fx.power", ax: 1.2, ay: 0.7, w: 2.6, h: 2.4, step: 1.6, k: 1.7, bits: 0, // Deep Impact: the punch goes off
                  charge: 0xff9030, pow: { c: 0xff9030, flash: 4.5, shake: 0.4, stop: 0.09, recoil: 2, bits: 0 } },
      airpower: { body: "airpower", fps: 20, at: 0, dive: "erupt", bits: 0, pow: { c: 0xff9030, flash: 4, shake: 0.38, stop: 0.08, bits: 0 } }, // Major Eruption: dives, burrows, bursts out
      trap:     { body: "trap", fps: 18, at: 5, trap: "mine", faint: true },                                    // Mole Bomb: a landmine you can barely see
      airtrap:  { body: "airtrap", fps: 18, at: 3, trap: "mine", faint: true, toss: true } },
    amy: {
      /* Pink Typhoon: a tornado off her hammer -- wind, so you can see through it */
      shot:     { body: "shot", fps: 24, at: 7, wave: "fx.shot", speed: 15, life: 0.8, ghost: 1.5, trail: 0xffa0d0,
                  charge: 0xff80c0, pow: { c: 0xff80c0, flash: 2.2, shake: 0.14, recoil: 2.5 } },
      airshot:  { body: "airshot", fps: 22, at: 4, fly: "fx.airshot", speed: 16, down: 0.6, life: 0.6, ghost: 1.5, trail: 0xffa0d0,
                  pow: { c: 0xff80c0, flash: 2.2, shake: 0.14, recoil: 2.5 } },
      power:    { body: "shot", fps: 22, at: 4, tornado: [4, 7], charge: 0xff80c0, pow: { c: 0xff80c0, flash: 2.2, shake: 0.1 } }, // Girl Tornado: frames 4-7, six times round
      airpower: { body: "airshot", fps: 22, at: 4, tornado: [4, 6], pow: { c: 0xff80c0, flash: 2.2, shake: 0.1 } },
      trap:     { body: "trap", fps: 18, at: 8, trap: "gift" },                                                 // Gift
      airtrap:  { body: "airtrap", fps: 18, at: 4, trap: "gift", toss: true } },
    rouge: {
      /* Beauty Shock: an ultrasonic shriek -- sound, so you can see through it; short reach */
      shot:     { body: "shot", fps: 22, at: 7, fly: "fx.shot", speed: 18, life: 0.35, loop: true, ghost: 1.6, trail: 0xffb0f0,
                  muzzle: [0.64, 0.68], gfrom: 4, charge: 0xff70d0, pow: { c: 0xff70d0, flash: 2, shake: 0.1, recoil: 2 } },
      airshot:  { body: "airshot", fps: 22, at: 6, fly: "fx.shot", speed: 18, down: 0.7, life: 0.35, loop: true, ghost: 1.6, trail: 0xffb0f0,
                  muzzle: [0.63, 0.72], gfrom: 3, charge: 0xff70d0, pow: { c: 0xff70d0, flash: 2, shake: 0.1, recoil: 2 } },
      power:    { body: "power", fps: 22, at: 3, area: "fx.power", ax: 1.5, ay: 0.6, w: 2.4, h: 1.8, k: 1.5,           // Silent Size
                  charge: 0xa0ff70, pow: { c: 0xa0ff70, flash: 3, shake: 0.22, stop: 0.06 } },
      airpower: { body: "airpower", fps: 22, at: 0, dive: "drill", pow: { c: 0xff70d0, flash: 2.4, shake: 0.22, stop: 0.04 } }, // Spiral Dive: spins down, through rock
      trap:     { body: "trap", fps: 22, at: 7, trap: "chase", flies: true },                                   // Bat Cracker: a bat mine that hunts
      airtrap:  { body: "airtrap", fps: 22, at: 6, trap: "chase", flies: true } },
    shadow: {
      shot:     { body: "shot", fps: 22, at: 6, fly: "fx.shot", speed: 30, life: 0.4, hold: 0.25, k: 1.25, trail: 0xffe060, // Chaos Magic (Chaos Spear): held, it flies further
                  charge: 0xff4060, pow: { c: 0xffe060, flash: 2.4, shake: 0.14, recoil: 3.5 } },
      airshot:  { body: "airshot", fps: 22, at: 5, fly: "fx.shot", speed: 26, down: 0.6, life: 0.4, ahead: 1.8, k: 1.25, trail: 0xffe060, // appears a few steps ahead
                  charge: 0xff4060, pow: { c: 0xffe060, flash: 2.4, shake: 0.14, recoil: 3.5 } },
      power:    { body: "power", fps: 30, at: 8, area: "fx.power", ax: 0, ay: 0.7, w: 4.0, h: 3.2, around: true, k: 1.45, // Chaos Burst
                  charge: 0xff4060, pow: { c: 0xff70a0, flash: 5, shake: 0.4, stop: 0.1 } },
      airpower: { body: "airpower", fps: 24, at: 0, dive: "burst", pow: { c: 0xff70a0, flash: 5, shake: 0.4, stop: 0.1 } }, // Air Chaos Burst: drops, then bursts
      trap:     { body: "trap", fps: 20, at: 5, trap: "orbit" },                                                // Roaming Chaos: circles him
      airtrap:  { body: "airtrap", fps: 20, at: 4, trap: "orbit" } },
    cream: {
      /* Cheese does it all: Chao Cannon, Cheese wrapped in energy and flown at what's ahead;
         Chao Rush, a whirlwind round Cheese; Cream Cracker, an Omochao that flies off to hunt */
      shot:     { body: "shot", fps: 22, at: 3, fly: "fx.shot", speed: 15, life: 0.75, k: 1.2, trail: 0x8ad8ff,
                  muzzle: [0.55, 0.55], charge: 0x8ad8ff, pow: { c: 0x8ad8ff, flash: 2, shake: 0.1 } },
      airshot:  { body: "airshot", fps: 14, at: 1, fly: "fx.airshot", speed: 15, down: 0.5, life: 0.65, k: 1.2, trail: 0x8ad8ff,
                  pow: { c: 0x8ad8ff, flash: 2, shake: 0.1 } },
      power:    { body: "power", fps: 20, at: 4, area: "fx.power", ax: 1.7, ay: 1.0, w: 2.4, h: 2.6, k: 1.3,
                  charge: 0x8ad8ff, pow: { c: 0x8ad8ff, flash: 3, shake: 0.2, stop: 0.05 } },
      airpower: { body: "airpower", fps: 14, at: 1, area: "fx.power", ax: 1.6, ay: 0.6, w: 2.4, h: 2.6, k: 1.3,
                  pow: { c: 0x8ad8ff, flash: 3, shake: 0.2, stop: 0.05 } },
      trap:     { body: "trap", fps: 18, at: 6, trap: "chase", flies: true },
      airtrap:  { body: "airtrap", fps: 14, at: 1, trap: "chase", flies: true } },
    chaos: {
      /* Chaos Shot, a ball of water that bursts; Chaos Crush, his arm along the ground (from the
         air, down it: a column of water); Chaos Splash, a puddle that throws up tentacles */
      shot:     { body: "shot", fps: 20, at: 4, fly: "fx.shot", speed: 14, life: 0.7, k: 1.15, trail: 0x9ad8ff,
                  muzzle: [0.7, 0.55], gfrom: 1, charge: 0x70c8ff, pow: { c: 0x9ad8ff, flash: 2, shake: 0.1 } },
      airshot:  { body: "airshot", fps: 20, at: 4, fly: "fx.shot", speed: 14, down: 0.5, life: 0.6, k: 1.15, trail: 0x9ad8ff,
                  muzzle: [0.7, 0.55], pow: { c: 0x9ad8ff, flash: 2, shake: 0.1 } },
      power:    { body: "power", fps: 20, at: 4, area: "fx.power", ax: 2.0, ay: 0.75, w: 3.4, h: 1.7, k: 1.3,
                  charge: 0x70c8ff, pow: { c: 0x9ad8ff, flash: 2.6, shake: 0.2, stop: 0.05 } },
      airpower: { body: "airpower", fps: 18, at: 4, area: "fx.airpower", ax: 0.55, ay: -0.5, w: 1.3, h: 3.4, k: 1.1,
                  pow: { c: 0x9ad8ff, flash: 2.6, shake: 0.2, stop: 0.05 } },
      trap:     { body: "trap", fps: 14, at: 4, trap: "mine" },
      airtrap:  { body: "airtrap", fps: 16, at: 4, trap: "mine", toss: true } },
    gamma: {
      /* Devastator, out of his arm cannon; held, it charges -- the charging frames, only while
         the button is down -- and lets go bigger and further. Meltdown: his reactor goes up,
         and him with it (a heart of his own). Blinker: a mine, blinking. */
      shot:     { body: "shot", fps: 16, at: 4, fly: "fx.shot", speed: 21, life: 0.6, loop: true, k: 1.3, trail: 0xc0b0ff,
                  muzzle: [1.0, 0.62], gfrom: 1, charge: 0xc0b0ff, pow: { c: 0xc0b0ff, flash: 2.4, shake: 0.14, recoil: 2 },
                  charged: { at: 2, body: "shotcharge", max: 1.2, release: "shotfull", rat: 8 } },
      airshot:  { body: "airshot", fps: 16, at: 3, fly: "fx.shot", speed: 21, down: 0.4, life: 0.6, loop: true, k: 1.3, trail: 0xc0b0ff,
                  muzzle: [1.0, 0.5], gfrom: 1, charge: 0xc0b0ff, pow: { c: 0xc0b0ff, flash: 2.4, shake: 0.14, recoil: 2 },
                  charged: { at: 2, body: "airshotcharge", max: 1.2, release: "airshotfull", rat: 7 } },
      power:    { body: "power", fps: 8, at: 3, blast: true, w: 5.4, h: 4.4, k: 3.2, charge: 0xff6040,
                  pow: { c: 0xffa040, flash: 7, shake: 0.6, stop: 0.12 } },
      airpower: { body: "airpower", fps: 8, at: 3, blast: true, w: 5.4, h: 4.4, k: 3.2, charge: 0xff6040,
                  pow: { c: 0xffa040, flash: 7, shake: 0.6, stop: 0.12 } },
      trap:     { body: "trap", fps: 22, at: 8, trap: "mine" },
      airtrap:  { body: "airtrap", fps: 18, at: 5, trap: "mine", toss: true } },
    eggman: {
      /* (his muzzles are where they are with the Egg Mobile off the ground) the Death Egg Cannon
         out of the Egg Mobile's front, a ball of fire; Missile Launch, a
         missile that goes off where it hits; Bomb Drop, a bomb out of the bottom, its fuse lit */
      shot:     { body: "shot", fps: 18, at: 7, fly: "fx.shot", speed: 17, life: 0.75, loop: true, k: 1.45, trail: 0xff7040,
                  muzzle: [0.95, 0.87], gfrom: 3, charge: 0xff7040, pow: { c: 0xff9050, flash: 3, shake: 0.2, recoil: 3 } },
      airshot:  { body: "airshot", fps: 18, at: 7, fly: "fx.shot", speed: 17, down: 0.45, life: 0.7, loop: true, k: 1.45, trail: 0xff7040,
                  muzzle: [0.95, 0.87], gfrom: 3, charge: 0xff7040, pow: { c: 0xff9050, flash: 3, shake: 0.2, recoil: 3 } },
      power:    { body: "power", fps: 14, at: 3, fly: "fx.power", range: [0, 7], speed: 13, life: 1.1, k: 1.4, trail: 0xc8c8c8,
                  muzzle: [0.8, 0.77], bursts: 1.6, boom: 1.4, land: { c: 0xffa040, flash: 3, shake: 0.26, stop: 0.04 } },
      airpower: { body: "airpower", fps: 14, at: 3, fly: "fx.power", range: [0, 7], speed: 13, down: 0.35, life: 1.0, k: 1.4, trail: 0xc8c8c8,
                  muzzle: [0.8, 0.77], bursts: 1.6, boom: 1.4, land: { c: 0xffa040, flash: 3, shake: 0.26, stop: 0.04 } },
      trap:     { body: "trap", fps: 10, at: 2, trap: "mine" },
      airtrap:  { body: "airtrap", fps: 10, at: 2, trap: "mine", toss: true } },
    metal: {
      /* Electric Bolt; Black Shield, a crystal round him that nothing gets through and that
         breaks what it meets; Plasma Grenade, thrown */
      shot:     { body: "shot", fps: 20, at: 6, fly: "fx.shot", speed: 24, life: 0.55, loop: true, k: 1.25, trail: 0xfff070,
                  muzzle: [0.6, 0.6], charge: 0x80c0ff, pow: { c: 0xfff070, flash: 2.4, shake: 0.14, recoil: 2.5 } },
      airshot:  { body: "airshot", fps: 20, at: 5, fly: "fx.shot", speed: 24, down: 0.55, life: 0.5, loop: true, k: 1.25, trail: 0xfff070,
                  muzzle: [0.6, 0.6], charge: 0x80c0ff, pow: { c: 0xfff070, flash: 2.4, shake: 0.14, recoil: 2.5 } },
      power:    { body: "power", fps: 10, at: 1, shield: true, pow: { c: 0x9ad4ff, flash: 3, shake: 0.18 } },
      airpower: { body: "airpower", fps: 10, at: 1, shield: true, pow: { c: 0x9ad4ff, flash: 3, shake: 0.18 } },
      trap:     { body: "trap", fps: 18, at: 5, trap: "mine", toss: true, far: 5.5 },
      airtrap:  { body: "airtrap", fps: 16, at: 3, trap: "mine", toss: true, far: 4.5 } },
    mighty: {
      /* Mighty Cyclone, a tornado along the ground (a ring of fire from the air); Hammer Spin,
         curled and spinning on, three times round; Hammer Drop (Sonic Mania Plus), straight
         down, through cracked rock, a shockwave both ways where he lands; Peacemaker */
      shot:     { body: "shot", fps: 24, at: 7, wave: "fx.shot", speed: 11, life: 1.0, k: 1.15, trail: 0xffc080,
                  pow: { c: 0xffa060, flash: 2.2, shake: 0.14, recoil: 2 } },
      airshot:  { body: "airshot", fps: 22, at: 2, fly: "fx.airshot", speed: 14, down: 0.5, life: 0.75, k: 1.2, trail: 0xff8040,
                  pow: { c: 0xffa060, flash: 2.2, shake: 0.14, recoil: 2 } },
      power:    { body: "power", fps: 18, at: 4, tornado: [5, 8], pow: { c: 0xff4a4a, flash: 2.2, shake: 0.1 } },
      airpower: { body: "airpower", fps: 20, at: 0, dive: "hammer", bits: 0, pow: { c: 0xffa060, flash: 4.5, shake: 0.42, stop: 0.08, bits: 0 } },
      trap:     { body: "trap", fps: 18, at: 6, trap: "mine" },
      airtrap:  { body: "airtrap", fps: 18, at: 3, trap: "mine", toss: true } },
    silver: {
      /* Psycho Knife, a blade of psychokinesis, gone in a moment; Psycho Surge, a whirlwind of
         it round him; Psycho Orb, sent ahead to hang in the air -- one at a time */
      shot:     { body: "shot", fps: 20, at: 4, fly: "fx.shot", speed: 19, life: 0.45, k: 1.15, trail: 0x70f0d0,
                  muzzle: [0.6, 0.65], charge: 0x70f0d0, pow: { c: 0x70f0d0, flash: 2.2, shake: 0.12, recoil: 2 } },
      airshot:  { body: "airshot", fps: 18, at: 3, fly: "fx.shot", speed: 19, down: 0.45, life: 0.45, k: 1.15, trail: 0x70f0d0,
                  muzzle: [0.6, 0.65], pow: { c: 0x70f0d0, flash: 2.2, shake: 0.12, recoil: 2 } },
      power:    { body: "power", fps: 18, at: 4, area: "fx.power", ax: 0, ay: 0.95, w: 3.4, h: 3.2, around: true, k: 1.3,
                  charge: 0x70f0d0, pow: { c: 0x70f0d0, flash: 4, shake: 0.32, stop: 0.08 } },
      airpower: { body: "airpower", fps: 18, at: 3, area: "fx.power", ax: 0, ay: 0.8, w: 3.4, h: 3.2, around: true, k: 1.3,
                  pow: { c: 0x70f0d0, flash: 4, shake: 0.32, stop: 0.08 } },
      trap:     { body: "trap", fps: 18, at: 4, trap: "float", one: true },
      airtrap:  { body: "airtrap", fps: 18, at: 3, trap: "float", one: true } },
  };
  /* How a runner's trap looks: `from` the frame it starts on, `loop` the frames it then goes
     round (else all of them), `k` its size; `boom` its own blast (from frame `bfrom`, `bk` its
     size, `bmid` about its middle) in place of the explosion */
  const TRAP_LOOK = {
    cream:  { from: 2, loop: [5, 6], boom: "fx.trapboom", bmid: true, bk: 1.6 },     // an Omochao flies off; the Cream Cracker
    chaos:  { loop: [0, 3], boom: "fx.trap", bfrom: 4, bk: 1.7 },                    // a puddle, that throws up tentacles
    eggman: { from: 2, loop: [4, 10] },                                              // his bomb, the fuse burning down
    mighty: { k: 1.8 },
    silver: { loop: [5, 11] },                                                       // the orb gathers, then hangs there
  };

  // ---------------------------------------------------------------- the sprites
  /* Each runner is a flat card in the voxel world with crisp pixels, facing the way they run
     and casting a shadow of their shape. A runner's frames and effects share one texture
     (assets/guests/sb-<who>.png); a card shows a frame by its own UVs. Body frames stand on
     their feet, effects on their middle. */
  const SHEETS = root.AdventureSprites || {};
  /* the stage items -- Sonic Advance 3's monitors and shields (adventure-items.js,
     tools/pack-items.py) -- drawn as cards the same way */
  if (root.AdventureItems) SHEETS.items = root.AdventureItems;
  const ITEMS = !!SHEETS.items;
  const PX = 1.1 / 33;                              // metres to a sprite pixel: Sonic's idle is 33 tall, about 1.1m
  const MATS = {};
  function sheetMats(who) {
    if (MATS[who]) return MATS[who];
    const tex = SHEETS[who].canvas ? new THREE.CanvasTexture(SHEETS[who].canvas) : new THREE.TextureLoader().load(SHEETS[who].url);
    tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
    return (MATS[who] = {
      mat: new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide }),
      fx: new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide }),
      faint: new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, transparent: true, opacity: 0.38, depthWrite: false }),
      ghost: new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.02, side: THREE.DoubleSide, transparent: true, opacity: 0.55, depthWrite: false }),
      depth: new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5, side: THREE.DoubleSide }),
    });
  }
  function makeCard(who, kind) {
    const M = sheetMats(who);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), M[kind] && kind !== "depth" ? M[kind] : M.mat);
    if (kind !== "fx" && kind !== "faint" && kind !== "ghost") { mesh.castShadow = true; mesh.customDepthMaterial = M.depth; }
    mesh.userData.who = who;
    return mesh;
  }
  const framesOf = (who, name) => (SHEETS[who] && SHEETS[who].f[name]) || null;
  /** Which frame `t` seconds into a run of `n` frames: looping, or held on the last. */
  const frameAt = (n, t, fps, loop) => { const i = Math.floor(t * fps); return loop ? i % n : Math.min(i, n - 1); };
  /** Show frame `i` of `name` on a card, facing `face`, its feet (or its middle) at x, y, `k` times size. */
  function setFrame(mesh, name, i, face, x, y, mid, z, k) {
    k = k || 1;
    const who = mesh.userData.who, A = SHEETS[who], list = A.f[name] || A.f.idle;
    const [fx, fy, fw, fh, cx] = list[clamp(i, 0, list.length - 1)];
    let u0 = fx / A.w, u1 = (fx + fw) / A.w;
    if (face < 0) { const t = u0; u0 = u1; u1 = t; }
    const v1 = 1 - fy / A.h, v0 = 1 - (fy + fh) / A.h, uv = mesh.geometry.attributes.uv;
    uv.setXY(0, u0, v1); uv.setXY(1, u1, v1); uv.setXY(2, u0, v0); uv.setXY(3, u1, v0); uv.needsUpdate = true;
    mesh.scale.set(fw * PX * k, fh * PX * k, 1);
    mesh.position.set(x + (fw / 2 - cx) * PX * k * face, mid ? y : y + fh * PX * k / 2, z == null ? 0.06 : z);
  }
  /* A card in the cabinet's menu: the runner's Sonic Battle portrait, the one their sheet draws
     with a white outline, at twice size with crisp pixels, standing on the card's floor. */
  const IMGS = {};
  function paintCard(cv, who, frame, k) {
    const A = SHEETS[who]; if (!A) return;
    const img = IMGS[who] || (IMGS[who] = Object.assign(new Image(), { src: A.url }));
    const k0 = k || 2;
    const go = () => {
      const g = cv.getContext("2d"), f = (A.f[frame || "portrait"] || A.f.idle)[0];
      g.clearRect(0, 0, cv.width, cv.height); g.imageSmoothingEnabled = false;
      let k = k0; while (k > 1 && f[2] * k > cv.width) k--;      // a wide one (Emerl's) at a size that shows him
      /* a portrait taller than the card (Eggman's, Silver's) shows its top: a bust, the face in */
      /* (Emerl's is a bust under a tall crest: `faceY` drops the crop to his face) */
      const fy = (!frame || frame === "portrait") && A.faceY ? A.faceY * k : 0;
      const dy = f[3] * k > cv.height ? -Math.min(fy, f[3] * k - cv.height) : cv.height - f[3] * k;
      g.drawImage(img, f[0], f[1], f[2], f[3], Math.round((cv.width - f[2] * k) / 2), dy, f[2] * k, f[3] * k);
    };
    if (img.complete && img.naturalWidth) go(); else img.addEventListener("load", go, { once: true });
  }

  // ---------------------------------------------------------------- Emerl
  /* Emerl's frames (adventure-emerl.js, tools/pack-emerl.py): his own sheet, and one for each of the
     eight he copies, every move drawn as him. Which move is in each slot is his loadout (kept per
     trainer); the runner the game makes of him is his own size, with each slot's move from its
     source -- its numbers, its frames, its effects -- and one picture made of all of it, put together
     here from the sheets (a card can show only one). */
  const EM = root.AdventureEmerl || null;
  const EM_SRC = ["tails", "knuckles", "amy", "rouge", "shadow", "cream", "chaos", "gamma"];
  const EM_SLOTS = [["pose", "Fighting pose"], ["run", "Run"], ["dash", "Dash"], ["jump", "Jump"], ["air", "Air action"], ["atk1", "1st attack"],
    ["atk2", "2nd attack"], ["atk3", "3rd attack"], ["heavy", "Heavy attack"], ["upper", "Upper attack"], ["dashatk", "Dash attack"],
    ["airatk", "Air attack"], ["aim", "Pursuit attack"], ["shot", "Ground shot"], ["airshot", "Air shot"], ["power", "Ground power"],
    ["airpower", "Air power"], ["trap", "Ground trap"], ["airtrap", "Air trap"]];
  /* which of his frames each slot brings (the air action's are named as each runner's are drawn) */
  const EM_NAMES = { pose: ["idle"], run: ["run", "skid"], dash: ["dash"], jump: ["jump", "fall", "land"], air: ["fly", "glide", "double", "teleport", "catch"],
    atk1: ["atk1"], atk2: ["atk2"], atk3: ["atk3"], heavy: ["heavy"], upper: ["upper"], dashatk: ["dashatk"], airatk: ["airatk"], aim: ["seek", "aim"],
    shot: ["sp.shot"], airshot: ["sp.airshot"], power: ["sp.power"], airpower: ["sp.airpower"], trap: ["sp.trap"], airtrap: ["sp.airtrap"] };
  if (EM) { SHEETS.emerl = Object.assign({ faceY: 14 }, EM.emerl); for (const k of EM_SRC) if (EM[k]) SHEETS["emerl." + k] = EM[k]; }
  /* every move he could learn: a slot of one of the eight's, with a name */
  const emerlAll = () => EM ? EM_SRC.flatMap(src => EM_SLOTS.map(([slot]) => src + "." + slot).filter(k => EM.names[k.split(".")[0]][k.split(".")[1]])) : [];
  function emerlSave() {
    const e = saveData.emerl = saveData.emerl || {};
    e.learned = e.learned || []; e.loadout = e.loadout || {};
    for (const [slot] of EM_SLOTS) if (e.loadout[slot] && !e.learned.includes(e.loadout[slot] + "." + slot)) delete e.loadout[slot];
    return e;
  }
  /** One move learned, after a win: at random, of those he does not know yet. Null when he knows them all. */
  function emerlLearn() {
    const e = emerlSave(), left = emerlAll().filter(k => !e.learned.includes(k));
    if (!left.length) return null;
    const k = left[Math.floor(Math.random() * left.length)];
    e.learned.push(k); save(saveData);
    const [src, slot] = k.split(".");
    return { src, slot, name: EM.names[src][slot], slotName: EM_SLOTS.find(s => s[0] === slot)[1] };
  }
  const EM_IMGS = {};
  function emerlImgs() {
    if (!EM) return false;
    let ok = true;
    for (const k of ["emerl"].concat(EM_SRC)) {
      const A = k === "emerl" ? EM.emerl : EM[k]; if (!A) continue;
      const im = EM_IMGS[k] || (EM_IMGS[k] = Object.assign(new Image(), { src: A.url }));
      if (!im.complete || !im.naturalWidth) ok = false;
    }
    return ok;
  }
  /* The runner made of Emerl's loadout: his size; each slot's numbers from the runner it copies;
     and his frames put together into one picture. Without the sheets loaded yet, his own. */
  const EM_BUILT = {};
  function emerlCast() {
    const base = castOf("emerl"), lo = (saveData && emerlSave().loadout) || {};
    const from = {}; for (const [slot] of EM_SLOTS) from[slot] = lo[slot] || "emerl";
    if (!emerlImgs()) for (const k in from) from[k] = "emerl";
    const key = "emerl#" + EM_SLOTS.map(([s]) => from[s].slice(0, 3)).join("");
    const c = Object.assign({}, base, { emerl: from, sheet: key, spinDash: false, climb: false, swims: false });
    const of = slot => from[slot] === "emerl" ? null : castOf(from[slot]);
    const r = of("run"), j = of("jump"), a = of("air"), d = of("dash");
    if (r) Object.assign(c, { run: r.run, accel: r.accel });
    if (j) Object.assign(c, { jump: j.jump, airAccel: j.airAccel });
    if (a) Object.assign(c, { air: a.air, flyTime: a.flyTime, flyK: a.flyK, glides: a.glides, sink: a.sink });
    if (d) Object.assign(c, { dashK: d.dashK, dashT: d.dashT, steer: d.steer, dashInv: d.dashInv, dashFrom: d.id });
    else c.dashFrom = "emerl";
    if (!EM_BUILT[key]) EM_BUILT[key] = emerlSheet(from);
    SHEETS[key] = EM_BUILT[key];
    return c;
  }
  /* one picture of the frames each slot brings, shelf-packed onto a canvas */
  function emerlSheet(from) {
    const want = [];
    const add = (name, k, src) => { const A = k === "emerl" ? EM.emerl : EM[k]; const fs = A && A.f[src]; if (fs) want.push([name, k, fs]); };
    for (const [slot] of EM_SLOTS) for (const nm of EM_NAMES[slot]) add(nm, from[slot], nm);
    for (const nm of ["hit", "out", "portrait"]) add(nm, "emerl", nm);
    add("spin", "emerl", "double"); add("ball", "emerl", "double");                 // curled: his own air action's spin
    if (!want.some(w => w[0] === "fly") && from.air === "rouge") add("fly", "rouge", "fall");
    const runF = want.find(w => w[0] === "run"); if (runF) want.push(["start", runF[1], [runF[2][0]]]);
    const cv = document.createElement("canvas"); cv.width = 512;
    let x = 1, y = 1, sh = 0; const place = [];
    for (const [name, k, fs] of want) for (const f of fs) {
      if (x + f[2] + 1 > 512) { x = 1; y += sh + 1; sh = 0; }
      place.push([name, k, f, x, y]); x += f[2] + 1; sh = Math.max(sh, f[3]);
    }
    let H = 64; while (H < y + sh + 1) H *= 2;
    cv.height = H;
    const g = cv.getContext("2d"), table = {};
    for (const [name, k, f, px, py] of place) {
      g.drawImage(EM_IMGS[k], f[0], f[1], f[2], f[3], px, py, f[2], f[3]);
      (table[name] = table[name] || []).push([px, py, f[2], f[3], f[4]]);
    }
    return { canvas: cv, url: EM.emerl.url, w: 512, h: H, f: table };
  }
  /* A special of Emerl's: the move in that slot -- his own (Sonic's, as Sonic Battle gives him
     them) or the one he copied -- its data from the runner it is, its body his frames for it, timed
     to them, and its effects from its source's sheet */
  function emerlSpecial(p, slot) {
    const src = p.c.emerl[slot] || "emerl", from = src === "emerl" ? "sonic" : src;
    const S0 = SPECIALS[from][slot], S = Object.assign({}, S0, { body: "sp." + slot, fxWho: from });
    delete S.charged;                                     // (no frames of his for Gamma's held charge)
    const nE = (framesOf(p.c.sheet, "sp." + slot) || [0]).length, nO = (framesOf(from, S0.body) || [0]).length * (S0.loops || 1);
    if (nE && nO && !S0.windup) {
      const k = nE / nO;
      S.fps = (S0.fps || 16) * k; S.at = Math.min(nE - 1, Math.round((S0.at || 0) * k));
      if (S0.tornado) S.tornado = [Math.min(nE - 2, S0.tornado[0]), Math.min(nE - 1, S0.tornado[1])];
      S.loops = 1;
    }
    return S;
  }

  // ---------------------------------------------------------------- the badniks
  /* Eggman's robots, in their own sprites from SEGA's Sonic Advance, Sonic Advance 2 and Sonic
     Advance 3 (adventure-badniks.js, cut by tools/pack-badniks.py), each doing what it does in
     its own game, as Sonic Retro describes them:
       gamigami   a crab: walks sideways, stops, fires an energy ball up out of each claw
       rhinotank  trundles; sees you ahead and charges till it meets a wall or an edge
       stinger    a bee on a propeller: flies to and fro, stops to fire at you
       kiki       a monkey: stops to lob a bomb at you, that goes off where it lands
       hanabii    a lizard on wheels: stops to launch a firework that bursts overhead
       slot       a bat: flies to and fro, stops to drop a coin on you
       pierrot    a clown on a ball: blows bounce off the ball; jump on him, or come in curled
       yukimaru   a snowman: stops to throw a snowball up and over
       pen        a penguin: stops to lob a snowball at you
       leon       a chameleon: crawls, and shoots its tongue out at you close up
       wamu       a caterpillar, floating to and fro
       mirror     a mirrored octahedron, spinning (nothing hurts it), that opens to fire
       oct        an octopus: flies to and fro, stops to fire straight down
       senbon     a pufferfish: floats to and fro, puffs out its spikes now and then
       mogu       a mole: hides in its hole, pops out when you come close, and goes back
       pikopiko   a clown with a giant mallet: comes at you and brings it down
       star       spins in its points (nothing hurts it), then stops and opens up
       gaogao     a wind-up lion: its face takes any blow; hit it from behind or above
       bubu       a piggy bank on wheels, scooting to and fro
       guards     toy soldiers, marching in threes, firing bombs out of their trumpets
       akatento   a ladybird car, driving to and fro
       aotento    its blue twin: lifts off into the air when you come close
       condor     a jet: cruises high, and dives at you when you pass under it
     `act` is the way it moves; `air` it flies; `every` seconds between shots; `see` how near
     you have to be (metres) for it to act. */
  const BADS = root.AdventureBadniks || null;
  const BADNIKS = {
    gamigami:  { act: "walkshoot", speed: 1.3, every: 2.6, see: 9, fire: 0.35, dur: 0.75, shot: "claws" },
    rhinotank: { act: "charge", speed: 1.2, dash: 7.5, see: 8 },
    stinger:   { act: "fly", air: true, speed: 1.7, range: 3.5, every: 2.4, see: 7, fire: 0.3, dur: 0.7, shot: "aim" },
    kiki:      { act: "walkshoot", speed: 1.0, every: 2.4, see: 9, fire: 0.25, dur: 0.6, shot: "bomb" },
    hanabii:   { act: "walkshoot", speed: 1.1, every: 3.0, see: 9, fire: 0.2, dur: 0.7, shot: "firework" },
    slot:      { act: "fly", air: true, speed: 1.9, range: 4, every: 2.2, see: 6, fire: 0.25, dur: 0.6, shot: "coin" },
    pierrot:   { act: "walk", speed: 1.3, armor: "ball" },
    yukimaru:  { act: "walkshoot", speed: 0.8, every: 2.4, see: 9, fire: 0.3, dur: 0.8, shot: "snowup" },
    pen:       { act: "walkshoot", speed: 1.3, every: 2.2, see: 7, fire: 0.2, dur: 0.5, shot: "snowball" },
    leon:      { act: "tongue", speed: 0.9, see: 2.6, reach: 2.2 },
    wamu:      { act: "fly", air: true, speed: 1.3, range: 3, wave: 0.8 },
    mirror:    { act: "guardshoot", air: true, speed: 1.0, range: 2.5, every: 2.2, see: 9, dur: 1.1, fire: 0.45, shot: "beam" },
    oct:       { act: "fly", air: true, speed: 1.4, range: 3.5, every: 2.2, see: 5, fire: 0.3, dur: 0.7, shot: "down" },
    senbon:    { act: "guardfly", air: true, speed: 1.1, range: 3 },
    mogu:      { act: "pop", see: 3.6 },
    pikopiko:  { act: "mallet", speed: 1.3, see: 5, reach: 1.8 },
    star:      { act: "guardhover", air: true },
    gaogao:    { act: "walk", speed: 1.0, armor: "front" },
    bubu:      { act: "walk", speed: 1.9 },
    guards:    { act: "walkshoot", speed: 1.0, every: 2.8, see: 10, fire: 0.45, dur: 0.85, shot: "trumpet" },
    akatento:  { act: "walk", speed: 2.6 },
    aotento:   { act: "liftoff", speed: 2.2, see: 3.4 },
    condor:    { act: "dive", air: true, speed: 2.4, range: 5, see: 5 },
    /* The second seven's stages have TheKnucklesMainG4's Modern Sonic Badniks, each doing what
       it does in the game it comes from (Sonic Retro):
         motobug     a ladybird on a wheel, driving to and fro (Sonic 1)
         buzzbomber  a wasp: flies over, stops, fires down at 45 degrees, flies on (Sonic 1);
         buzzer      its Sonic 2 cousin, the same
         crabmeat    walks sideways, stops, fires a ball up out of each claw (Sonic 1)
         chopper     a piranha that leaps up out of the water (Sonic 1)
         jawz        a shark, swimming to and fro (Sonic 1's Jaws)
         orbinaut    spike balls going round it; come near and it fires them at you, one by one
                     (Sonic 1's Unidus); starnaut the gold one
         nebula      hovers on its propeller; drops a bomb when you pass under (Sonic 2)
         balkiry     a jet: waits ahead, then comes straight at you, fast, and is gone (Sonic 2)
         snail       Snail Blaster: its shell shut, nothing hurts it; it opens it to fire twice (Sonic 3)
         butterdroid flies to and fro, and comes after you when you come close (Sonic & Knuckles)
         spiny       crawls; lobs a spiked ball up at you (Sonic 2)
         slicer      a mantis: throws its two blades, that home in on you a while (Sonic 2)
         asteron     a starfish: flashes when you come near and bursts, its five points flying (Sonic 2)
         grabber     a spider on a thread: drops on you when you pass under (Sonic 2)
         grounder    behind a wall till you come near: out through the bricks, and at you (Sonic 2)
         rhinobot    sees you ahead and charges, skids and turns (Sonic 3)
         crawl       holds a bumper out in front: hit it from behind or above (Sonic 2)
         spinner     hovers; spots you and comes after you (Sonic Adventure)
         espinner    the Electro Spinner: crackles with electricity now and then -- don't touch
         mspinner    the Metal Spinner: armoured; only a jump on it, or a ball, breaks it
         klagen      a jellyfish robot, drifting after you (Sonic Heroes); eklagen the electric one
       `k` draws one smaller (the sheet's Jawz is a big shark). */
    motobug:     { act: "walk", speed: 2.2 },
    buzzbomber:  { act: "fly", air: true, speed: 2.4, range: 4, every: 2.2, see: 7, fire: 0.3, dur: 0.75, shot: "diag" },
    buzzer:      { act: "fly", air: true, speed: 2.8, range: 4.5, every: 2.0, see: 7, fire: 0.3, dur: 0.7, shot: "diag" },
    crabmeat:    { act: "walkshoot", speed: 1.0, every: 2.6, see: 9, fire: 0.35, dur: 0.75, shot: "claws" },
    chopper:     { act: "leap", every: 1.6, jump: 11 },
    jawz:        { act: "fly", air: true, speed: 1.4, range: 3.5, wave: 0.12, k: 0.62 },
    orbinaut:    { act: "orbit", speed: 0.5, see: 5, every: 0.9, shot: "orb" },
    starnaut:    { act: "orbit", speed: 0.5, see: 5, every: 0.9, shot: "orb" },
    nebula:      { act: "fly", air: true, speed: 1.2, range: 3, every: 1.8, see: 4, fire: 0.35, dur: 0.8, shot: "drop" },
    balkiry:     { act: "jet", air: true, speed: 10, see: 16 },
    snail:       { act: "shell", speed: 0.6, every: 2.8, see: 8, fire: 0.6, dur: 1.5, shot: "pair", armor: "shell" },
    butterdroid: { act: "flutter", air: true, speed: 1.1, range: 3, see: 5 },
    spiny:       { act: "walkshoot", speed: 0.9, every: 2.2, see: 7, fire: 0.2, dur: 0.5, shot: "lob" },
    slicer:      { act: "walkshoot", speed: 0.8, every: 3.6, see: 7, fire: 0.25, dur: 1.2, shot: "blades" },
    asteron:     { act: "burst", air: true, see: 3.4, shot: "points" },
    grabber:     { act: "grab", air: true, see: 1.4 },
    grounder:    { act: "wall", speed: 2.4, see: 4.5 },
    rhinobot:    { act: "charge", speed: 1.2, dash: 9, see: 9 },
    crawl:       { act: "walk", speed: 0.9, armor: "front" },
    spinner:     { act: "chase", air: true, speed: 2.0, see: 6 },
    espinner:    { act: "chase", air: true, speed: 1.8, see: 6, zap: true },
    mspinner:    { act: "chase", air: true, speed: 3.0, see: 7, armor: "ball" },
    klagen:      { act: "chase", air: true, speed: 1.1, see: 5 },
    eklagen:     { act: "chase", air: true, speed: 1.0, see: 5, zap: true },
  };
  /* What a shot is: the frames it shows (its own badnik's "shot", or a borrowed one), how it
     falls, whether it goes off where it lands, how big it hurts. */
  const SHOTS = {
    claws:    { g: 24, r: 0.25 },
    aim:      { g: 0, r: 0.22 },
    bomb:     { g: 22, r: 0.3, boom: true },
    firework: { g: 9, r: 0.25, burst: true },
    coin:     { g: 18, r: 0.25 },
    snowup:   { g: 22, r: 0.25 },
    snowball: { g: 20, r: 0.25 },
    beam:     { g: 0, r: 0.25 },
    down:     { g: 0, r: 0.22 },
    trumpet:  { g: 7, r: 0.22, boom: true },
    diag:     { g: 0, r: 0.22 },                         // Buzz Bomber's, Buzzer's: down at 45 degrees
    orb:      { g: 0, r: 0.3, k: 0.7 },                  // an Orbinaut's spike ball, flung at you
    drop:     { g: 20, r: 0.3, boom: true },             // Nebula's bomb
    pair:     { g: 0, r: 0.22 },                         // Snail Blaster's two
    lob:      { g: 20, r: 0.25 },                        // Spiny's spiked ball
    blades:   { g: 0, r: 0.25, home: 1.6 },              // Slicer's, homing in a while
    points:   { g: 0, r: 0.22 },                         // Asteron's five points
  };
  let BAD_M = null;
  function badMats() {
    if (BAD_M) return BAD_M;
    const tex = new THREE.TextureLoader().load(BADS.url);
    tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
    /* struck, a badnik shows pure white: its silhouette, the atlas with every pixel white */
    const white = new THREE.MeshBasicMaterial({ color: 0xffffff, alphaTest: 0.5, side: THREE.DoubleSide });
    white.visible = false;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
      const g = c.getContext("2d"); g.drawImage(img, 0, 0); g.globalCompositeOperation = "source-in"; g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
      const t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
      white.map = t; white.visible = true; white.needsUpdate = true;
    };
    img.src = BADS.url;
    BAD_M = { mat: new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide }), white,
              depth: new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5, side: THREE.DoubleSide }) };
    return BAD_M;
  }
  function badCard() {
    const M = badMats(), m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), M.mat);
    m.castShadow = true; m.customDepthMaterial = M.depth; m.userData.bad = true;
    return m;
  }
  const badFrames = (key, anim) => { const F = BADS.f[key]; return F[anim] || F.walk || F.fly || F.guard || F.pop || F.boom; };
  /** Show frame `i` of a badnik's `anim`, facing `face` (the sheets face left), standing on x, y. */
  function setBad(m, key, anim, i, face, x, y, k) {
    const L = badFrames(key, anim), [fx, fy, fw, fh, ax, ay] = L[((i % L.length) + L.length) % L.length];
    k = k || 1;
    let u0 = fx / BADS.w, u1 = (fx + fw) / BADS.w;
    if (face > 0) { const t = u0; u0 = u1; u1 = t; }
    const v1 = 1 - fy / BADS.h, v0 = 1 - (fy + fh) / BADS.h, uv = m.geometry.attributes.uv;
    uv.setXY(0, u0, v1); uv.setXY(1, u1, v1); uv.setXY(2, u0, v0); uv.setXY(3, u1, v0); uv.needsUpdate = true;
    m.scale.set(fw * PX * k, fh * PX * k, 1);
    m.position.set(x - face * (fw / 2 - ax) * PX * k, y + (ay - fh / 2) * PX * k, 0.04);
  }

  /* A badnik's turn: walking (it turns at walls and edges and keeps to the ground, slopes
     too), and whatever its kind does. `p` is the runner. */
  /** The ground's height at x, slopes and ledges included, from a little over y down; or null. */
  function groundAt(x, y) {
    const ci = Math.floor(x);
    for (let j = Math.floor(y + 1.2); j >= Math.floor(y - 1.6); j--) {
      const c = tile(ci, j);
      if (c === "/" || c === "\\") return slopeY(c, ci, j, x);
      if (solid(c) || c === "-") return j + 1;
    }
    return null;
  }
  /* A badnik walking: on along the ground, up and down slopes as it goes; it turns at a wall (a
     step a whole tile high, or a hurdle) and at an edge. A slope is no wall: the ground under the
     next step of a slope is not in its way. A wide one stands on the higher of its two halves,
     so it never sinks into a slope it is on. */
  function walkOn(e, speed, dt) {
    const ahead = e.x + e.dir * (e.w / 2 + 0.05), ai = Math.floor(ahead);
    const slopeAhead = [-0.1, 0.4, 0.9, 1.4].some(d => { const c = tile(ai, Math.floor(e.y + d)); return c === "/" || c === "\\"; });
    const ga = groundAt(ahead, e.y);
    const wall = (!slopeAhead && solid(tile(ai, Math.floor(e.y + 0.3)))) || (ga !== null && ga - e.y > (slopeAhead ? 1.2 : 0.55)) ||
                 world.solids.some(b => b.alive && ahead > b.x0 && ahead < b.x1 && e.y < b.y1);
    const floor = ga !== null && ga > e.y - 1.1;
    if (wall || !floor) { e.dir = -e.dir; return false; }
    e.vx = e.dir * speed; e.x += e.vx * dt;
    const g0 = groundAt(e.x - e.w * 0.25, e.y), g1 = groundAt(e.x + e.w * 0.25, e.y), gc = groundAt(e.x, e.y);
    const gy = [g0, g1, gc].filter(g => g !== null && g <= e.y + 0.9).reduce((a, b) => Math.max(a, b), -1e9);
    if (gy > -1e8) e.y = gy; else e.y -= 6 * dt;
    return true;
  }
  function setMode(e, mode) { e.mode = mode; e.t = 0; e.at = 0; e.fired = false; }
  function stepBadnik(e, dt, p) {
    const B = e.B, dx = p.x - e.x, dy = p.y + 0.5 - (e.y + e.h / 2), near = Math.abs(dx) < (B.see || 0) && Math.abs(dy) < 4;
    e.t += dt; e.at += dt;
    const fly = () => {                                   // to and fro about where it was put, bobbing
      e.ph += dt * B.speed / Math.max(1, B.range);
      const nx = e.x0 + Math.sin(e.ph) * B.range;
      e.dir = nx >= e.x ? 1 : -1; e.x = nx;
      e.y = e.y0 + Math.sin(e.ph * 2.6) * (B.wave || 0.3);
    };
    switch (B.act) {
      case "walk": walkOn(e, B.speed, dt); e.face = e.dir; break;
      case "walkshoot":
        if (e.mode === "shoot") {
          if (!e.fired && e.t > B.fire) { e.fired = true; badShot(e, p); }
          if (e.t > B.dur) setMode(e, "walk");
        } else {
          walkOn(e, B.speed, dt); e.face = e.dir;
          if (near && e.t > B.every) { setMode(e, "shoot"); e.face = sgn(dx) || e.face; }
        }
        break;
      case "charge":                                       // Rhinotank
        if (e.mode === "charge") {
          if (!walkOn(e, B.dash, dt)) setMode(e, "turn");
          e.face = e.dir === -1 ? -1 : 1;
          if (e.t > 3) setMode(e, "walk");
        } else if (e.mode === "turn") { if (e.t > 0.35) setMode(e, "walk"); }
        else {
          walkOn(e, B.speed, dt); e.face = e.dir;
          if (near && sgn(dx) === e.dir && Math.abs(dy) < 1.5 && e.t > 0.6) setMode(e, "charge");
        }
        break;
      case "fly":
        if (e.mode === "shoot") {
          if (!e.fired && e.t > B.fire) { e.fired = true; badShot(e, p); }
          if (e.t > B.dur) setMode(e, "walk");
        } else {
          fly(); e.face = e.dir;
          if (B.shot && near && e.t > B.every && (B.shot !== "down" && B.shot !== "coin" && B.shot !== "drop" || Math.abs(dx) < 1.6) && dy < 0.5) { setMode(e, "shoot"); e.face = sgn(dx) || e.face; }
        }
        break;
      case "guardshoot":                                   // Mirror: spins shut, opens to fire
        if (e.mode === "shoot") {
          e.guard = false;
          if (!e.fired && e.t > B.fire) { e.fired = true; badShot(e, p); }
          if (e.t > B.dur) setMode(e, "walk");
        } else {
          e.guard = true; fly();
          if (near && e.t > B.every) { setMode(e, "shoot"); e.face = sgn(dx) || e.face; }
        }
        break;
      case "guardfly":                                     // Senbon: spikes out every few seconds
        fly(); e.face = e.dir;
        if (e.mode === "guard") { e.guard = true; if (e.t > 1.4) { setMode(e, "walk"); e.guard = false; } }
        else if (e.t > 2.2) setMode(e, "guard");
        break;
      case "guardhover":                                   // Star: spins, then opens
        e.y = e.y0 + Math.sin(e.ph += dt * 1.6) * 0.25;
        if (e.mode === "open") { e.guard = false; if (e.t > 1.4) setMode(e, "walk"); }
        else { e.guard = true; if (e.t > 2.4) setMode(e, "open"); }
        break;
      case "pop":                                          // Mogu: up out of its hole and back
        if (e.mode === "up") { e.hidden = e.t < 0.2 || e.t > 1.75; if (e.t > 2) setMode(e, "down"); }
        else { e.hidden = true; if (e.t > 1.2 && near) setMode(e, "up"); }
        break;
      case "tongue":                                       // Leon
        if (e.mode === "shoot") {
          const k = Math.floor(e.t * 9);
          e.reach = k >= 1 && k <= 3 ? B.reach : 0;
          if (e.t > 0.6) { setMode(e, "walk"); e.reach = 0; }
        } else {
          walkOn(e, B.speed, dt); e.face = e.dir;
          if (near && sgn(dx) === e.face && Math.abs(dy) < 1.2 && e.t > 1) setMode(e, "shoot");
        }
        break;
      case "mallet":                                       // Piko-piko: up goes the mallet, down it comes
        if (e.mode === "raise") { if (e.t > 0.35) setMode(e, "smash"); }
        else if (e.mode === "smash") {
          e.reach = e.t < 0.2 ? B.reach : 0;
          if (e.t < 0.05) { shakeCam(0.08); SFX.stomp(); }
          if (e.t > 0.6) { setMode(e, "walk"); e.reach = 0; }
        } else {
          if (near) e.dir = sgn(dx) || e.dir;
          walkOn(e, B.speed, dt); e.face = e.dir;
          if (Math.abs(dx) < B.reach && Math.abs(dy) < 1.2 && e.t > 0.8) { e.face = sgn(dx) || e.face; setMode(e, "raise"); }
        }
        break;
      case "liftoff":                                      // Aotento: drives, then lifts off when you come close
        if (e.mode === "fly") {
          e.y = e.y0 + Math.min(2.4, e.t * 5) - Math.max(0, e.t - 1.4) * 5;
          if (e.y <= e.y0 && e.t > 1.4) { e.y = e.y0; setMode(e, "walk"); }
        } else {
          walkOn(e, B.speed, dt); e.face = e.dir; e.y0 = e.y;
          if (near && e.t > 1) setMode(e, "fly");
        }
        break;
      case "leap":                                         // Chopper: up out of the water, and back down
        if (e.mode === "jump") { e.vy -= 24 * dt; e.y += e.vy * dt; if (e.y <= e.y0 && e.vy < 0) { e.y = e.y0; setMode(e, "walk"); } }
        else { e.y = e.y0; if (e.t > B.every) { setMode(e, "jump"); e.vy = B.jump; } }
        e.face = sgn(dx) || e.face;
        break;
      case "orbit": {                                      // Orbinaut: its spike balls go round; near, it fires them
        if (e.balls == null) e.balls = 4;
        e.spin = (e.spin || 0) + dt * 2.4;
        walkOn(e, B.speed, dt); e.face = e.dir;
        if (near && e.balls > 0 && e.t > B.every) { e.t = 0; e.balls--; badShot(e, p); }
        if (!p.dead && p.star <= 0 && !(p.c.id === "mighty" && p.curl)) for (let k = 0; k < e.balls; k++) {
          const a = e.spin + k * PI / 2, bx = e.x + Math.cos(a) * 0.8, by = e.y + e.h / 2 + Math.sin(a) * 0.8;
          if (Math.abs(p.x - bx) < p.c.w / 2 + 0.2 && by > p.y - 0.2 && by < p.y + p.hh + 0.2) hurt(p, bx);
        }
        break;
      }
      case "flutter": case "chase": {                      // Butterdroid, the Spinners, Klagen: near, they come after you
        if (e.hx == null) { e.hx = e.x0; e.hy = e.y0; }
        if (B.zap) {                                       // the electric ones crackle now and then: don't touch
          if (e.mode === "zap") { e.guard = true; if (e.t > 1.1) { setMode(e, "walk"); e.guard = false; } }
          else if (e.t > 2.6 && near) { setMode(e, "zap"); SFX.charge(0.4); }
        }
        if (near && e.mode !== "zap") {
          const tx = clamp(p.x, e.hx - 6, e.hx + 6), ty = clamp(p.y + 0.2, e.hy - 3, e.hy + 2);
          e.x += clamp(tx - e.x, -1, 1) * B.speed * dt; e.y += clamp(ty - e.y, -1, 1) * B.speed * 0.6 * dt;
          e.face = sgn(dx) || e.face; e.x0 = e.x; e.y0 = e.y; e.ph = 0;
        } else if (B.act === "flutter") { fly(); e.face = e.dir; }
        else { e.y = e.y0 + Math.sin(e.t * 2.2 + e.hx) * 0.15; e.face = sgn(dx) || e.face; }          // hovering, bobbing
        break;
      }
      case "shell":                                        // Snail Blaster: shut, nothing hurts it; open, it fires
        if (e.mode === "open") {
          if (!e.fired && e.t > B.fire) { e.fired = true; badShot(e, p); }
          if (e.t > B.dur) setMode(e, "walk");
        } else {
          walkOn(e, B.speed, dt); e.face = e.dir;
          if (near && e.t > B.every) { setMode(e, "open"); e.face = sgn(dx) || e.face; }
        }
        break;
      case "burst":                                        // Asteron: near, it flashes, and goes off in five points
        if (e.mode === "flash") {
          if (e.t > 0.6) {
            badShot(e, p); e.alive = false; e.m.visible = false;
            burst(e.x, e.y + e.h / 2, [0xff8040, 0xffd060, 0xffffff], 10, 4); SFX.boom();
          }
        } else if (near && e.t > 0.5) setMode(e, "flash");
        break;
      case "jet":                                          // Balkiry: waits ahead; then straight at you, fast, and gone
        e.face = -1;
        if (e.mode === "go") { e.x -= B.speed * dt; if (e.x < e.x0 - 32) { e.alive = false; e.m.visible = false; } }
        else { e.y = e.y0 + Math.sin(e.t * 3) * 0.08; if (dx < 0 && -dx < B.see && e.t > 0.5) setMode(e, "go"); }
        break;
      case "grab":                                         // Grabber: down its thread when you pass under, and back up
        if (e.mode === "drop") { e.y = Math.max(e.ty, e.y - 9 * dt); if (e.t > 1.2) setMode(e, "rise"); }
        else if (e.mode === "rise") { e.y = Math.min(e.y0, e.y + 3 * dt); if (e.y >= e.y0) setMode(e, "walk"); }
        else { e.y = e.y0; if (Math.abs(dx) < B.see && p.y < e.y0 - 0.5 && e.t > 1) { setMode(e, "drop"); e.ty = Math.max(p.y + 0.3, e.y0 - 7); } }
        e.face = sgn(dx) || e.face;
        break;
      case "wall":                                         // Grounder: behind its wall; out through the bricks, and at you
        if (!e.out) {
          e.hidden = true; e.face = sgn(dx) || -1;
          if (near && Math.abs(dx) < B.see) {
            e.out = true; e.hidden = false; setMode(e, "pop");
            burst(e.x, e.y + 0.6, [0xb85a3a, 0x8a3a2a, 0xd8a080, 0x6a6a6a], 16, 6); SFX.breakIt();
          }
        } else if (e.mode === "pop") { if (e.t > 0.45) setMode(e, "drive"); }
        else { e.dir = sgn(dx) || e.dir; walkOn(e, B.speed, dt); e.face = e.dir; }
        break;
      case "dive":                                         // Condor
        if (e.mode === "dive") {
          const tx = e.tx - e.x, ty = e.ty - e.y, d = Math.hypot(tx, ty) || 1;
          if (e.t < 0.9 && d > 0.3) { e.x += tx / d * 9 * dt; e.y += ty / d * 9 * dt; e.face = sgn(tx) || e.face; }
          else setMode(e, "climb");
        } else if (e.mode === "climb") {
          e.y = Math.min(e.y0, e.y + 4 * dt); e.x += (e.x0 - e.x) * dt;
          if (e.y >= e.y0 - 0.01) { e.ph = Math.asin(clamp((e.x - e.x0) / B.range, -1, 1)); setMode(e, "walk"); }
        } else {
          fly(); e.face = e.dir;
          if (Math.abs(dx) < B.see && dy < -1.5 && e.t > 1.5) { setMode(e, "dive"); e.tx = p.x; e.ty = p.y + 0.4; }
        }
        break;
    }
  }
  /* What it fires, from where, and which way. */
  function badShot(e, p) {
    const B = e.B, s = SHOTS[B.shot], f = e.face, at = (vx, vy, ox, oy) =>
      world.eshots.push({ key: BADS.f[e.key].shot ? e.key : "kiki", x: e.x + (ox || 0) * f, y: e.y + (oy == null ? e.h * 0.6 : oy), vx, vy, g: s.g, r: s.r, boom: s.boom, burst: s.burst,
                          k: s.k, home: s.home, fi: fi, t: 0, m: null });
    let fi = null;
    const dx = p.x - e.x, dy = p.y + 0.5 - (e.y + e.h * 0.6);
    switch (B.shot) {
      case "claws": at(-3.2, 9.5, -0.6 * f, 0.7); at(3.2, 9.5, 0.6 * f, 0.7); break;
      case "aim": { const d = Math.hypot(dx, dy) || 1; at(dx / d * 6.5, dy / d * 6.5, 0.2, 0.2); break; }
      case "bomb": at(clamp(dx * 0.9, -6.5, 6.5), 8, 0.3, 1.1); break;
      case "firework": at(0, 13, 0.2, 0.9); break;
      case "coin": at(0, 0, 0, -0.1); break;
      case "snowup": at(sgn(dx) * 2.6, 11, 0.2, 0.9); break;
      case "snowball": at(sgn(dx) * 5.5, 5, 0.3, 0.7); break;
      case "beam": at(f * 7, 0, 0.5, e.h * 0.5); break;
      case "down": at(0, -6.5, 0, 0); break;
      case "trumpet": at(f * 6, 1.6, 0.45, 0.85); break;
      case "diag": at(sgn(dx || f) * 5, -5, 0.3, 0.1); break;
      case "orb": { const d = Math.hypot(dx, dy) || 1; at(dx / d * 6, dy / d * 6, 0, e.h / 2); break; }
      case "drop": at(0, -1, 0, 0); break;
      case "pair": { const a = Math.atan2(dy, dx); for (const da of [-0.22, 0.22]) at(Math.cos(a + da) * 6, Math.sin(a + da) * 6, 0.4, 0.5); break; }
      case "lob": at(clamp(dx * 0.75, -5.5, 5.5), 9.5, 0, 0.6); break;
      case "blades": { const d = Math.hypot(dx, dy) || 1; at(dx / d * 4, dy / d * 4 + 2.5, 0.3, 0.9); at(dx / d * 4, dy / d * 4 - 1, -0.3, 0.8); break; }
      case "points":                                     // a star's five: up, and out and down both ways
        for (const [deg, k] of [[90, 0], [162, 2], [18, 2], [-54, 2], [-126, 2]]) { fi = k; at(Math.cos(deg * PI / 180) * 7, Math.sin(deg * PI / 180) * 7, 0, e.h / 2); }
        break;
    }
    SFX.shot();
  }
  function stepEnemyShots(dt, p) {
    const w = world;
    for (const s of w.eshots) {
      if (s.gone) continue;
      s.t += dt; s.vy -= s.g * dt; s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.home > 0 && !p.dead) {                       // Slicer's blades come after you a while
        s.home -= dt; const hx = p.x - s.x, hy = p.y + 0.6 - s.y, hd = Math.hypot(hx, hy) || 1;
        s.vx += (hx / hd * 5 - s.vx) * dt * 2.5; s.vy += (hy / hd * 5 - s.vy) * dt * 2.5;
      }
      if (!s.m) { s.m = badCard(); s.m.castShadow = false; w.group.add(s.m); }
      if (s.burst && s.vy < 0) { badBoom(s.x, s.y, "hanabii", 1.1); s.gone = true; }
      else if (solid(tile(Math.floor(s.x), Math.floor(s.y))) || s.y < -3 || s.t > 6) { if (s.boom) badBoom(s.x, s.y + 0.2, "kiki", 0.75); s.gone = true; }
      else if (!p.dead && Math.abs(p.x - s.x) < p.c.w / 2 + s.r && s.y > p.y - s.r && s.y < p.y + p.hh + s.r) {
        if (s.boom) badBoom(s.x, s.y, "kiki", 0.75); else hurt(p, s.x);
        s.gone = true;
      }
      if (s.gone) { w.group.remove(s.m); s.m.geometry.dispose(); }
    }
    if (w.eshots.length > 24) w.eshots = w.eshots.filter(s => !s.gone);
    // explosions: Kiki's bomb, Guards' bomb, Hanabii's burst -- they hurt while they flare
    for (const b of w.booms) {
      if (b.gone) continue;
      b.t += dt;
      const n = badFrames(b.key, "boom").length;
      if (b.t * 14 >= n) { b.gone = true; w.group.remove(b.m); b.m.geometry.dispose(); continue; }
      if (b.t < 0.25 && !p.dead && Math.hypot(p.x - b.x, p.y + p.hh / 2 - b.y) < b.r + 0.3) hurt(p, b.x);
    }
    if (w.booms.length > 16) w.booms = w.booms.filter(b => !b.gone);
  }
  function badBoom(x, y, key, r) {
    const m = badCard(); m.castShadow = false; world.group.add(m);
    world.booms.push({ key, x, y, r, t: 0, m });
    SFX.boom();
  }
  /* Which frame a badnik shows, from what it is doing. */
  function drawBadnik(e) {
    const B = e.B, k = e.key, T = world.t;
    let anim = "walk", i = Math.floor(e.at * 8);
    switch (B.act) {
      case "fly": case "guardfly": anim = e.mode === "shoot" ? "shoot" : e.mode === "guard" ? "guard" : "fly"; i = Math.floor(e.at * (e.mode === "shoot" ? 6 : 10)); break;
      case "guardshoot": anim = e.mode === "shoot" ? "shoot" : "walk"; i = e.mode === "shoot" ? Math.min(2, Math.floor(e.t * 8)) : Math.floor(T * 12); break;
      case "guardhover": anim = e.mode === "open" ? "open" : "guard"; i = e.mode === "open" ? Math.min(2, Math.floor(e.t * 8)) : Math.floor(T * 14); break;
      case "walkshoot": anim = e.mode === "shoot" ? "shoot" : "walk"; i = e.mode === "shoot" ? Math.min(badFrames(k, "shoot").length - 1, Math.floor(e.t / B.dur * badFrames(k, "shoot").length)) : Math.floor(e.at * 8); break;
      case "charge": anim = e.mode === "charge" ? "charge" : e.mode === "turn" ? "turn" : "walk"; i = Math.floor(e.at * (e.mode === "charge" ? 14 : 8)); break;
      case "pop": anim = "pop"; i = e.mode === "up" ? Math.min(3, Math.floor(e.t * 10)) + (e.t > 1.75 ? 1 + Math.floor((e.t - 1.75) * 10) : 0) : 0; i = Math.min(i, 6); break;
      case "tongue": anim = e.mode === "shoot" ? "shoot" : "walk"; i = e.mode === "shoot" ? Math.min(4, Math.floor(e.t * 9)) : Math.floor(e.at * 6); break;
      case "mallet": anim = e.mode === "raise" ? "raise" : e.mode === "smash" ? "smash" : "walk"; i = 0; break;
      case "liftoff": anim = e.mode === "fly" ? "fly" : "walk"; i = Math.floor(e.at * 10); break;
      case "dive": anim = e.mode === "dive" ? "dive" : "fly"; i = Math.floor(e.at * 10); break;
      case "leap": anim = "jump"; i = Math.floor(e.at * 10); break;
      case "flutter": case "chase": anim = e.mode === "zap" ? "zap" : "fly"; i = Math.floor(e.at * (e.mode === "zap" ? 14 : 12)); break;
      case "jet": anim = "fly"; i = Math.floor(e.at * 12); break;
      case "shell": anim = e.mode === "open" ? "open" : "walk"; i = e.mode === "open" ? Math.min(4, Math.floor(e.t * 10)) : Math.floor(e.at * 5); break;
      case "burst": anim = e.mode === "flash" && Math.floor(e.t * 14) % 2 ? "flash" : "walk"; i = Math.floor(T * 4); break;
      case "grab": anim = e.mode === "drop" ? "grab" : "walk"; i = Math.floor(e.at * (e.mode === "drop" ? 10 : 6)); break;
      case "wall": anim = e.mode === "pop" ? "pop" : "walk"; i = e.mode === "pop" ? Math.min(2, Math.floor(e.t * 7)) : Math.floor(e.at * 10); break;
      case "orbit": anim = "walk"; i = Math.floor(T * 4); break;
    }
    setBad(e.m, k, anim, i, e.face, e.x, e.y, B.k);
    e.m.visible = !(B.act === "wall" && !e.out);                // Grounder, behind its wall
    if (B.act === "orbit") {                               // Orbinaut's spike balls, the ones it still has
      if (!e.orbs) { e.orbs = [0, 1, 2, 3].map(() => { const m = badCard(); world.group.add(m); return m; }); }
      e.orbs.forEach((m, n) => {
        m.visible = e.alive && !e.fling && n < (e.balls == null ? 4 : e.balls);
        const a = (e.spin || 0) + n * PI / 2;
        setBad(m, k, "shot", 0, 1, e.x + Math.cos(a) * 0.8, e.y + e.h / 2 + Math.sin(a) * 0.8 - 0.21, 0.7);
      });
    }
    if (B.act === "grab") {                                // Grabber's thread, up to where it hangs from
      if (!e.thread) { e.thread = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 1), new THREE.MeshBasicMaterial({ color: 0xdedede })); world.group.add(e.thread); }
      const len = e.y0 - e.y + 0.9; e.thread.visible = e.alive && !e.fling;
      e.thread.scale.y = len; e.thread.position.set(e.x, e.y + e.h * 0.8 + len / 2, 0.02);
    }
  }
  function drawEnemyShots() {
    const w = world;
    for (const s of w.eshots) if (!s.gone && s.m) setBad(s.m, s.key, "shot", s.fi != null ? s.fi : Math.floor(s.t * 10), sgn(s.vx) || 1, s.x, s.y - 0.2 * (s.k || 1), s.k);
    for (const b of w.booms) if (!b.gone) setBad(b.m, b.key, "boom", Math.floor(b.t * 14), 1, b.x, b.y - (b.key === "hanabii" ? 1.05 : 0.5));
  }

  // ---------------------------------------------------------------- the thirteen places
  /* Each stage is one runner's own ground, as Sonic Battle gives each fighter a home arena:
     Sonic's seaside, Tails' workshop, Amy's home, Knuckles' ruins in the snow, Rouge's club,
     Shadow's highway, Cream's museum, Chaos's springs, Mighty's canyon, Silver's ruined city,
     Gamma's depot, Metal Sonic's racecourse, Eggman's station -- each built here as a place of
     its own. A theme is its sky, its light, what its ground, blocks and ledges are made of,
     what stands in it and who lives there.
       blocks   = tiles: stone, steel (riveted plate), books (spines on a shelf), carved
                  (old carved stone), glass (dark tile, neon edged), concrete, marble, mossy
                  (carved stone under moss), sandstone, ruin (cracked, fire in the cracks), hull
       planks   - tiles: wood, grate, shelf, rail (gold), girder
       hurdle   h: brush, barrier, books, cairn, rope, stones, crate
       tree     T: palm, windsock, plant, pillar, lamp, streetlamp, column, lantern, cactus,
                   crates, console
       foes     who lives there: the badnik each of k, r, b, n, p in a stage stands for (BADNIKS)
       far      the backdrop (buildFar) */
  const THEMES = {
    /* Sonic: green turf on white chalk, banded with flint, the sea all the way to the sky */
    cape: {
      sky: [0x2a86ec, 0xd6f0fa], fog: [0xd8eef8, 60, 320], sun: [0xfff4dc, 0.9, [10, 32, 22]], hemi: [0xffffff, 0x94b88a, 0.6],
      top: [0x52b43a, 0x60c044, 0x48a632], drip: 0x44a02e, soil: [0xe4dac2, 0xc8ba9a, 0xd6c8aa], deep: 0xb2a282,
      block: [0xb4bec8, 0xa0aab6], blocks: "stone", plank: 0xc8965a, planks: "wood", water: 0x1ca8e0, crack: 0xa8a49a, back: 0x8a7e68,
      tufts: [0x6cc84a, 0x7ad254], flowers: [0xffffff, 0xf2d040, 0x8aa8f0, 0xf08ac0], hurdle: "stones", tree: "palm",
      foes: { k: "gamigami", r: "rhinotank", b: "stinger", n: "kiki" }, far: "cape", music: "career" },
    /* Tails: the airfield grass, the workshop's riveted steel and grating, belts and fans */
    works: {
      sky: [0x3f8ee6, 0xdcecf6], fog: [0xd8e6f0, 55, 300], sun: [0xfff2dc, 0.9, [12, 30, 22]], hemi: [0xffffff, 0x9ab08a, 0.62],
      top: [0x5aac3c, 0x66b846, 0x50a034], drip: 0x4c9a34, soil: [0x8a6a4a, 0x7a5c3e, 0x947456], deep: 0x5a4632,
      block: [0xa8b4c0, 0x909cab], blocks: "steel", plank: 0x7a8694, planks: "grate", water: 0x2f8ac8, crack: 0x9a9a9e, back: 0x7a8494, indoors: 14,
      tufts: [0x72c44c, 0x80cc56], flowers: [0xffffff, 0xf2d040], hurdle: "barrier", tree: "windsock",
      foes: { k: "star", r: "senbon", b: "oct", n: "mogu" }, far: "works", music: "track" },
    /* Amy: her home, from the floor up -- a pink rug on the floorboards, shelves, books, cushions */
    parlour: {
      sky: [0xf4bcd2, 0xfde6ef], fog: [0xfbe2ec, 50, 230], sun: [0xfff0e2, 0.8, [8, 30, 26]], hemi: [0xfff6fa, 0xd8a8bc, 0.72],
      top: [0xf07aa8, 0xf48ab4, 0xe86c9c], drip: 0xfff4f8, soil: [0xd6a46e, 0xc8925c, 0xe0b07a], deep: 0x9a6a40,
      block: [0xf6efe6, 0xe8ddd0], blocks: "books", plank: 0xf6efe6, planks: "shelf", water: 0x7ccaf0, crack: 0xf0c890, back: 0xc88aa0,
      tufts: [0xf8a8c8, 0xffffff], flowers: [0xff4a7a, 0xffd23a, 0x8ad0f8], hurdle: "books", tree: "plant", indoor: true,
      foes: { k: "bubu", r: "gaogao", n: "guards", p: "pikopiko" }, far: "parlour", music: "friends", balloon: [0xff5a8a, 0xff8ab0] },
    /* Knuckles: snow on black volcanic rock, the old carved stone of the shrines */
    peak: {
      sky: [0x5a80c0, 0xe2ecf6], fog: [0xdce6f2, 45, 230], sun: [0xfff6ea, 0.72, [14, 28, 22]], hemi: [0xf4f8ff, 0xa8b4c4, 0.74],
      top: [0xf4f8fc, 0xe6eef6, 0xfafcff], drip: 0xe0eaf4, soil: [0x5a5254, 0x4e4648, 0x665c5c], deep: 0x3a3234,
      block: [0xbcb29c, 0xa89e88], blocks: "carved", plank: 0x8a6a4a, planks: "wood", water: 0x3a7ab0, crack: 0x9a948a, back: 0x2e2628,
      tufts: [0xffffff], flowers: [], snowfall: true, hurdle: "cairn", tree: "pillar",
      foes: { k: "pen", r: "leon", b: "wamu", n: "yukimaru" }, far: "peak", music: "night", tint: 0xeef2fa },
    /* Rouge: red carpet on black marble, dark glass edged in neon, gold rails, after midnight */
    club: {
      sky: [0x0a0618, 0x2c1444], fog: [0x1c0e30, 40, 210], sun: [0xe4d0ff, 0.6, [6, 30, 24]], hemi: [0xe0c8ff, 0x3a2448, 0.7],
      top: [0xb02e52, 0xbc3a5e, 0xa02448], drip: 0xe8c050, soil: [0x2c2632, 0x362e3c, 0x26202c], deep: 0x1a161e,
      block: [0x4a2a6a, 0x5a3480], blocks: "glass", plank: 0xe8c050, planks: "rail", water: 0x2a8ad8, crack: 0x8a8a9a, back: 0x3a2850, indoors: 6,
      tufts: [], flowers: [], stars: true, hurdle: "rope", tree: "lamp",
      foes: { k: "pierrot", r: "mirror", b: "slot", n: "hanabii" }, far: "club", music: "idea", tint: 0xe2daf4 },
    /* Shadow: asphalt and concrete, red girders, the sun going down behind the city */
    expressway: {
      sky: [0x34265a, 0xf4925a], fog: [0xe8946a, 55, 280], sun: [0xffb478, 1.0, [-20, 16, 20]], hemi: [0xffdcc0, 0x5a4048, 0.58],
      top: [0x3c3c44, 0x44444c, 0x36363e], drip: 0x8a8a92, soil: [0x9a948e, 0x8a847e, 0xa49e98], deep: 0x6a6460,
      block: [0xb0aaa2, 0x9c968e], blocks: "concrete", plank: 0xc03a2e, planks: "girder", water: 0x3a6a8a, crack: 0x8a847e, back: 0x2a2428,
      tufts: [], flowers: [], lanes: true, hurdle: "barrier", tree: "streetlamp",
      foes: { k: "akatento", r: "aotento", b: "condor" }, far: "city", music: "finale", tint: 0xffe6d4 },
    /* Cream: a natural history hall -- white marble, dark wood, a velvet rope to keep you off
       the exhibits, the great skeletons standing about */
    museum: {
      sky: [0xd8ccb4, 0xf6efe0], fog: [0xf2ead8, 50, 240], sun: [0xfff4e2, 0.82, [10, 30, 24]], hemi: [0xfffaf0, 0xc8b89a, 0.72],
      top: [0xeee8dc, 0xf6f2ea, 0xe4ddce], drip: 0xc8a050, soil: [0xe0d8c8, 0xd2c8b4, 0xe8e0d0], deep: 0xa89a82,
      block: [0xf2eee6, 0xdcd4c8], blocks: "marble", plank: 0x7a4a2a, planks: "wood", water: 0x6ab8e0, crack: 0xd8ccb0, back: 0xb8a888,
      checker: 0xb4a088, tufts: [], flowers: [], hurdle: "rope", tree: "column",
      foes: { k: "snail", r: "motobug", b: "butterdroid", n: "buzzbomber" }, far: "museum", music: "school", balloon: [0xff9a40, 0x7ac8f0] },
    /* Chaos: the springs under the old shrine, at night -- mossy carved stone, clear water
       everywhere, stone lanterns lit, the moon */
    springs: {
      sky: [0x0e1a34, 0x3a6a8a], fog: [0x1e3a52, 40, 220], sun: [0xd8e8ff, 0.62, [-8, 30, 20]], hemi: [0xc8e0ff, 0x2a4a3a, 0.72],
      top: [0x3e8a4a, 0x4a9a54, 0x367a42], drip: 0x2e6a3a, soil: [0x5a6260, 0x4e5654, 0x66706c], deep: 0x2e3634,
      block: [0x8a948c, 0x76807a], blocks: "mossy", plank: 0x7a5a3a, planks: "wood", water: 0x2ab4c8, crack: 0x8a948a, back: 0x24302e,
      tufts: [0x4a9a54, 0x5aaa60], flowers: [0x9ad8ff, 0xffffff], hurdle: "stones", tree: "lantern",
      foes: { k: "crabmeat", r: "orbinaut", b: "jawz", n: "chopper" }, far: "springs", music: "home_night", tint: 0xe6f0f8 },
    /* Mighty: canyon country -- red rock in bands, sand on top, cacti, the mesas going on for ever */
    canyon: {
      sky: [0x2e7ad0, 0xf6dcae], fog: [0xf2d8b0, 60, 320], sun: [0xfff0d0, 1.0, [14, 34, 18]], hemi: [0xfff4e0, 0xc08a5a, 0.6],
      top: [0xe8b878, 0xf0c488, 0xdcaa68], drip: 0xd8984e, soil: [0xc8643c, 0xb05232, 0xd47a4c], deep: 0x7a3420,
      block: [0xd8885a, 0xc06a40], blocks: "sandstone", plank: 0x8a6440, planks: "wood", water: 0x3a9ad0, crack: 0xc89a6a, back: 0x6a3020,
      tufts: [0xb8a050, 0x9a8a40], flowers: [0xff6a5a, 0xf2d040], hurdle: "stones", tree: "cactus",
      foes: { k: "rhinobot", r: "spiny", b: "asteron", n: "motobug" }, far: "canyon", music: "training_senior" },
    /* Silver: his city two hundred years on, burning -- cracked roads, black concrete lit by
       the fires in it, rusted girders, the sky red, embers coming down */
    ruins: {
      sky: [0x1a0a0e, 0xc8482a], fog: [0x6a2a1e, 40, 220], sun: [0xffa070, 0.85, [-14, 24, 20]], hemi: [0xffc0a0, 0x3a2020, 0.6],
      top: [0x4a4246, 0x544a4e, 0x403a3e], drip: 0x8a3a24, soil: [0x5a504c, 0x4a4240, 0x645a56], deep: 0x2a2224,
      block: [0x58504e, 0x4a4240], blocks: "ruin", plank: 0x8a4a2a, planks: "girder", water: 0x3a6070, crack: 0x7a6a62, back: 0x1e1618,
      tufts: [], flowers: [], snowfall: 0xffa050, hurdle: "barrier", tree: "streetlamp", lanes: true,
      foes: { k: "rhinotank", r: "grounder", b: "spinner", n: "espinner", p: "klagen" }, far: "ruins", music: "setback", tint: 0xffe0d0 },
    /* Chaos Gamma: a storage depot deep in Eggman's hideout -- steel floors striped for the
       forklifts, grating, belts, crates by the thousand, lamps hanging in the dark */
    depot: {
      sky: [0x0c1016, 0x2a3440], fog: [0x1a222c, 40, 200], sun: [0xe8f0ff, 0.7, [8, 30, 22]], hemi: [0xdce8f6, 0x2a3038, 0.72],
      top: [0x5e6874, 0x687280, 0x56606a], drip: 0xf2c030, soil: [0x3a424c, 0x343c44, 0x424a54], deep: 0x22282e,
      block: [0x7a8696, 0x667282], blocks: "steel", plank: 0x6a7684, planks: "grate", water: 0x2a7aa0, crack: 0x8a8e94, back: 0x1a2028, indoors: 10,
      tufts: [], flowers: [], hurdle: "crate", tree: "crates",
      foes: { k: "crawl", r: "grounder", b: "grabber", n: "rhinobot" }, far: "depot", music: "rival", tint: 0xe4eaf2 },
    /* Metal Sonic: a racecourse out among the stars -- dark track lit blue and white, gold
       rails, lane lines, the planets going by */
    stars: {
      sky: [0x02020a, 0x161040], fog: [0x0e0a26, 60, 320], sun: [0xe0e8ff, 0.75, [6, 30, 24]], hemi: [0xd0d8ff, 0x1a1830, 0.72],
      top: [0x22223a, 0x2a2a44, 0x1c1c32], drip: 0x7ad8ff, soil: [0x2a2a3e, 0x24243a, 0x30304a], deep: 0x14142a,
      block: [0x1e2240, 0x2a3060], blocks: "glass", neon: [0xffffff, 0x7ad8ff], plank: 0xe8c050, planks: "rail", water: 0x3a5ad8, crack: 0x6a6a8a, back: 0x0a0a1a,
      tufts: [], flowers: [], stars: true, lanes: true, hurdle: "barrier", tree: "lamp",
      foes: { k: "starnaut", r: "crawl", b: "nebula", n: "balkiry" }, far: "stars", music: "race_g1", tint: 0xe6e8ff },
    /* Dr. Eggman: his station in orbit -- grey hull plating, warning lights, grating over the
       machinery, consoles, and out of the windows the world turning below: the last stage */
    station: {
      sky: [0x020208, 0x0e1430], fog: [0x0a0e20, 60, 300], sun: [0xf0f4ff, 0.8, [10, 32, 22]], hemi: [0xe0e8ff, 0x2a2a38, 0.7],
      top: [0x8a909c, 0x949aa6, 0x7e848e], drip: 0xe84a3a, soil: [0x5a606c, 0x50565e, 0x646a76], deep: 0x2e3238,
      block: [0x9aa0aa, 0x80868e], blocks: "hull", plank: 0x5a6068, planks: "grate", water: 0x3a7ad8, crack: 0x8a8e96, back: 0x1a1c24, indoors: 10,
      tufts: [], flowers: [], stars: true, hurdle: "crate", tree: "console",
      foes: { k: "slicer", r: "crawl", b: "mspinner", n: "eklagen", p: "grabber" }, far: "station", music: "rival_final", tint: 0xeef0fa },
  };

  // ---------------------------------------------------------------- reading a stage
  /* A stage is as tall as its chunks (all of a stage's the same): the stages are 32 rows, room
     for a low road, a high one and the sky over both. H is the stage being run. */
  let H = 32;
  const SOLIDS = "#=XBImC{}";
  const ENTS = "PGKEc*JHS>rbknphMVUOT^Qo";
  function parse(def) {
    const chunks = def.chunks.map(raw => {
      const lines = raw.split("\n");
      while (lines.length && !lines[0].trim()) lines.shift();
      while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
      return lines;
    });
    const H = chunks[0].length;
    const rows = Array.from({ length: H }, () => []);
    for (const lines of chunks) {
      if (lines.length !== H) throw new Error(def.id + ": a chunk has " + lines.length + " rows, not " + H);
      const w = Math.max(...lines.map(l => l.length));
      lines.forEach((l, r) => { for (let i = 0; i < w; i++) rows[r].push(!l[i] || l[i] === " " ? "." : l[i]); });
    }
    const W = rows[0].length;
    const grid = [];
    for (let j = 0; j < H; j++) grid.push(rows[H - 1 - j].slice());
    const ents = [];
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const c = grid[j][i];
      if (ENTS.indexOf(c) < 0) continue;
      if (c === "^") { ents.push({ t: c, i, j }); continue; }          // thorns stay in the grid
      if ((c === "M" || c === "V") && i > 0 && grid[j][i - 1] === c + "_") { grid[j][i] = "."; continue; }
      let len = 1;
      if (c === "M" || c === "V") { while (grid[j][i + len] === c) { grid[j][i + len] = c + "_"; len++; } }
      ents.push({ t: c, i, j, len });
      grid[j][i] = ".";
    }
    // anything placed in water is in water
    for (const e of ents) {
      const row = grid[e.j];
      if (e.t !== "^" && (row[e.i - 1] === "~" || row[e.i + 1] === "~" || (grid[e.j + 1] && grid[e.j + 1][e.i] === "~"))) row[e.i] = "~";
    }
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (grid[j][i].length > 1) grid[j][i] = ".";
    return { W, H, grid, ents };
  }

  // ---------------------------------------------------------------- drawing in voxels
  const GR = 0.25;                     // the ground's grain: four to a tile, the lobby building's
  const F = 1 / 16;                    // props: the racers' own
  const ZF = 4, ZB = -6, ZDEEP = -16;  // tile depth in grain: front face at 1.25m, back at -1.5m, the top strip to -4m
  let MAT = null;
  function materials() {
    if (MAT) return MAT;
    MAT = {
      vox: new THREE.MeshLambertMaterial({ vertexColors: true }),
      water: new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.58, depthWrite: false }),
      glow: new THREE.MeshBasicMaterial({ vertexColors: true }),
      cube: new THREE.MeshLambertMaterial({ color: 0xffffff }),
    };
    return MAT;
  }
  const jit = (rnd, c, a) => mulC(c, 1 - a + rnd() * a * 2);
  const pick = (rnd, a) => a[Math.floor(rnd() * a.length) % a.length];

  /* A block (=) in the theme's own make. `open`: nothing stands on it. */
  const hash2 = (i, j) => { let h = (i * 374761393 + j * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return (h ^ (h >>> 16)) >>> 0; };
  const BOOKS = [0xe8506a, 0x5a8ee0, 0xf2c040, 0x6ac06a, 0xa86ae0, 0xf08a40, 0x40b8c0, 0xf6f2e8];
  /* old glyphs cut in the shrine stone, 4x4, one bit a grain */
  const GLYPHS = [0x6996, 0xf99f, 0x4e4a, 0x9669, 0x2772, 0xa5a5, 0x7557, 0x0f60];
  function blockCol(T, i, j, sx, sy, z, rnd, open) {
    const B = T.block, front = z === ZF;
    switch (T.blocks) {
      case "steel": {                                    // riveted plate; a hazard stripe along a top that is stood on
        if (open && sy === 3 && front) return ((i * 4 + sx) & 3) < 2 ? 0xf2c030 : 0x2a2a30;
        if (front && (sx === 0 || sx === 3) && (sy === 0 || sy === 3)) return 0x5a6470;
        return sx === 0 || sy === 0 ? mulC(B[1], 0.9) : jit(rnd, B[0], 0.03);
      }
      case "books": {                                    // rows of books on end, two metres tall, a spine every two grains
        const k = hash2(i * 2 + (sx >> 1), j >> 1), spine = BOOKS[k % BOOKS.length], topRow = (j & 1) && sy === 3;
        if (topRow && !front) return (k & 4) ? 0xf6efe0 : 0xefe4cc;   // the pages, along the top of each row
        if (topRow) return mulC(spine, 0.78);
        if (front && !(j & 1) && sy === 1 && (k & 8)) return 0xe8c050;  // gold lettering
        return jit(rnd, spine, 0.03);
      }
      case "carved": {                                   // shrine stone, a glyph cut in the face, snow on top
        if (open && sy === 3) return jit(rnd, 0xf4f8fc, 0.02);
        if (front && (GLYPHS[hash2(i, j) % GLYPHS.length] >> (sy * 4 + sx)) & 1) return (hash2(j, i) & 3) === 0 ? 0x4ab87a : mulC(B[1], 0.62);
        return sx === 0 || sy === 0 ? mulC(B[1], 0.86) : jit(rnd, pick(rnd, B), 0.04);
      }
      case "glass": {                                    // dark tile, neon round the face (pink and blue; white and blue among the stars)
        if (front && (sx === 0 || sy === 0 || sx === 3 || sy === 3)) return (T.neon || [0xff5ac8, 0x7ad8ff])[(i + j) & 1 ? 0 : 1];
        return jit(rnd, pick(rnd, B), 0.04);
      }
      case "marble": {                                   // white marble, grey veins, a gilt band along a top that is stood on
        if (open && sy === 3 && front) return 0xd8b050;
        if (((sx * 3 + sy * 5 + i * 7 + j * 11) % 13) === 0) return 0xbab6ae;
        return sx === 0 || sy === 0 ? mulC(B[1], 0.96) : jit(rnd, B[0], 0.02);
      }
      case "mossy": {                                    // the old carved stone, moss over its top and down its face
        if (open && sy === 3) return jit(rnd, (hash2(i * 4 + sx, j) & 3) ? 0x4a9a54 : 0x3a7a44, 0.04);
        if (open && sy === 2 && front && (hash2(i * 4 + sx, j) & 1)) return 0x3e8a4a;
        if (front && (GLYPHS[hash2(i, j) % GLYPHS.length] >> (sy * 4 + sx)) & 1) return (hash2(j, i) & 3) === 0 ? 0x5ad8e8 : mulC(B[1], 0.62);
        return sx === 0 || sy === 0 ? mulC(B[1], 0.86) : jit(rnd, pick(rnd, B), 0.04);
      }
      case "sandstone": {                                // red rock laid down in bands
        const band = (j * 4 + sy) % 7;
        return jit(rnd, band < 2 ? mulC(B[1], 0.9) : band === 4 ? 0xe8a070 : B[0], 0.04);
      }
      case "ruin": {                                     // black concrete, cracked, the fire glowing in the cracks
        const k = hash2(i * 4 + sx, j * 4 + sy);
        if (front && k % 23 === 0) return 0xff8a3a;
        if (front && k % 23 === 1) return 0xd84a20;
        if (sy === 0 || (front && sx === 0)) return mulC(B[1], 0.8);
        return jit(rnd, pick(rnd, B), 0.05);
      }
      case "hull": {                                     // hull plating: panel seams, a light now and then, a warning stripe along a top
        if (open && sy === 3 && front) return ((i * 4 + sx) & 3) < 2 ? 0xe84a3a : 0x3a3c44;
        if (front && sx === 1 && sy === 1 && hash2(i, j) % 5 === 0) return hash2(j, i) & 1 ? 0x7ad8ff : 0xffb040;
        return sx === 0 || sy === 0 ? mulC(B[1], 0.82) : jit(rnd, B[0], 0.025);
      }
      case "concrete": {
        if (sy === 0 || (front && sx === 0)) return mulC(B[1], 0.82);
        if (rnd() < 0.03) return 0x8a7462;
        return jit(rnd, pick(rnd, B), 0.04);
      }
      default: {
        const edge = sx === 0 || sy === 0 || (front && (sx === 3 || sy === 3));
        return edge ? mulC(B[1], 0.9) : jit(rnd, pick(rnd, B), 0.05);
      }
    }
  }
  /* A plank (-), one way up, in the theme's make. */
  function plankVox(v, T, i, lx, ly, rnd) {
    const P = T.plank;
    switch (T.planks) {
      case "grate":                                      // steel grating: see through it
        for (let sx = 0; sx < 4; sx++) for (let z = ZB; z <= ZF; z++)
          if (sx === 0 || z === ZB || z === ZF || ((sx + z) & 1) === 0) v.set(lx + sx, ly + 3, z, jit(rnd, P, 0.04));
        if (i % 3 === 0) for (const z of [ZB, ZF]) v.box(lx + 1, ly + 1, z, lx + 1, ly + 2, z, mulC(P, 0.7));
        return;
      case "shelf":                                      // a white shelf on brass brackets
        for (let sx = 0; sx < 4; sx++) for (let z = ZB; z <= ZF; z++) v.set(lx + sx, ly + 3, z, jit(rnd, z === ZF ? mulC(P, 0.92) : P, 0.02));
        if (i % 3 === 0) for (const z of [ZB + 1, ZF - 1]) { v.set(lx + 1, ly + 2, z, 0xd8a840); v.set(lx + 1, ly + 1, z, 0xd8a840); }
        return;
      case "rail":                                       // a gold ledge, its edge lit
        for (let sx = 0; sx < 4; sx++) for (let z = ZB; z <= ZF; z++) v.set(lx + sx, ly + 3, z, z === ZF ? 0xfff0a0 : jit(rnd, P, 0.04));
        for (let sx = 0; sx < 4; sx++) v.set(lx + sx, ly + 2, ZF, mulC(P, 0.7));
        return;
      case "girder":                                     // a red I-beam: two flanges and the web
        for (let sx = 0; sx < 4; sx++) {
          for (let z = ZB; z <= ZF; z++) v.set(lx + sx, ly + 3, z, jit(rnd, P, 0.04));
          for (let z = ZB; z <= ZF; z += 1) if (z === ZB || z === ZF || z === -1) v.set(lx + sx, ly + 1, z, mulC(P, 0.8));
          v.set(lx + sx, ly + 2, -1, mulC(P, 0.7));
        }
        v.set(lx + 1, ly + 3, ZF, 0x5a1a14); v.set(lx + 3, ly + 3, ZF, 0x5a1a14);
        return;
      default:
        for (let sx = 0; sx < 4; sx++) for (let z = ZB; z <= ZF; z++) v.set(lx + sx, ly + 3, z, jit(rnd, ((z & 3) === 0) ? mulC(P, 0.8) : P, 0.05));
        if (i % 3 === 0) for (const z of [ZB + 1, ZF - 1]) v.set(lx + 1, ly + 2, z, mulC(P, 0.75));
    }
  }

  /** The ground, a chunk of sixteen tiles at a time. */
  function buildChunk(S, T, i0, i1) {
    const v = new Vox(), w = new Vox(), rnd = mulberry32(i0 * 7919 + 13);
    const g = (i, j) => (i < 0 || i >= S.W || j < 0 || j >= H) ? "." : S.grid[j][i];
    const solidish = c => SOLIDS.indexOf(c) >= 0 || c === "/" || c === "\\";
    for (let i = i0; i < i1; i++) for (let j = 0; j < H; j++) {
      const c = g(i, j), lx = (i - i0) * 4, ly = j * 4;
      if (c === "~") {
        const surf = g(i, j + 1) !== "~" && !solidish(g(i, j + 1));
        for (let sx = 0; sx < 4; sx++) for (let sy = 0; sy < 4; sy++) for (let z = ZB; z <= ZF; z++) {
          if (surf && sy === 3) continue;                              // the surface sits a little low
          w.set(lx + sx, ly + sy, z, surf && sy === 2 ? mixC(T.water, 0xffffff, 0.22) : jit(rnd, T.water, 0.05));
        }
        continue;
      }
      if (c === "#" || c === "=" || c === "I" || c === "m" || c === "/" || c === "\\") {
        const above = g(i, j + 1), open = !solidish(above) && above !== "~", wet = above === "~";
        const surface = c !== "=" && c !== "I" && open;
        /* buried ground shows only its front, unless a side of it faces open air */
        const buried = !open && solidish(g(i - 1, j)) && solidish(g(i + 1, j)) && c === "#";
        const z0 = surface ? ZDEEP : buried ? ZF - 1 : ZB;
        /* the top of a stretch of ground (or a block) with more under it and on both sides: only
           its top layer runs back; the rest is never seen but from the front */
        const thin = (c === "#" || c === "=") && solidish(g(i, j - 1)) && solidish(g(i - 1, j)) && solidish(g(i + 1, j));
        // how deep this tile is under the surface, for the soil's bands
        let depth = 0; while (depth < 5 && solidish(g(i, j + depth + 1))) depth++;
        for (let sx = 0; sx < 4; sx++) for (let sy = 0; sy < 4; sy++) {
          if (c === "/" && sy > sx) continue;
          if (c === "\\" && sy > 3 - sx) continue;
          const topHere = (c === "/" ? sy === sx : c === "\\" ? sy === 3 - sx : sy === 3);
          for (let z = (c === "/" || c === "\\") ? ZDEEP : thin && sy < 3 ? ZF - 2 : z0; z <= ZF; z++) {
            let col;
            if (c === "=") {
              col = blockCol(T, i, j, sx, sy, z, rnd, open);
            } else if (c === "I") {
              col = ((sx + sy + z) % 5 === 0) ? 0xf4fcff : jit(rnd, 0xbfe2f2, 0.04);
            } else if (c === "m" && topHere && open) {
              col = rnd() < 0.18 ? 0x8a6a48 : jit(rnd, 0x5e4028, 0.06);                 // wet, with a shine on it
            } else if (c === "m" && sy === 2 && z === ZF) {
              col = jit(rnd, 0x6a4a30, 0.06);
            } else if ((topHere && (open || c !== "#")) && !wet) {
              col = jit(rnd, pick(rnd, T.top), 0.06);
              if (T.checker && (((i * 4 + sx) >> 2) + ((z - ZDEEP) >> 2)) & 1) col = jit(rnd, T.checker, 0.03);   // a marble floor laid in squares
              /* a road: white dashes down the middle, a solid line along the far side */
              if (T.lanes && (z === -5 && ((i * 4 + sx) & 7) < 4 || z === ZDEEP + 2)) col = z === -5 ? 0xf2f0e8 : 0xe8c040;
            } else if (z === ZF && sy >= 2 && open && depth === 0 && !wet && rnd() < 0.55) {
              col = T.drip;                                          // the grass hangs over the front
            } else {
              const band = (depth * 4 + (3 - sy)) % 7 < 3 ? 0 : 1;
              col = jit(rnd, depth >= 3 ? T.deep : T.soil[band + (rnd() < 0.12 ? 1 : 0)], 0.07);
              if (rnd() < 0.015) col = 0x8a8a8e;                     // a stone
            }
            v.set(lx + sx, ly + sy, z, col);
          }
        }
        // what grows on top: tufts, the odd flower, along the strip behind
        if (open && c === "#" && !wet && T.tufts.length) for (let k = 0; k < 4; k++) {
          const sx = Math.floor(rnd() * 4), z = Math.floor(ZDEEP + rnd() * (ZF - ZDEEP - 1));
          if (rnd() < 0.5) continue;
          const fl = T.flowers.length && rnd() < 0.18;
          v.set(lx + sx, ly + 4, z, fl ? pick(rnd, T.flowers) : pick(rnd, T.tufts));
          if (!fl && rnd() < 0.4) v.set(lx + sx, ly + 5, z, pick(rnd, T.tufts));
        }
        continue;
      }
      if (c === "-") { plankVox(v, T, i, lx, ly, rnd); continue; }
      if (c === "{" || c === "}") {                                  // a conveyor belt: chevrons the way it runs
        const d = c === "}" ? 1 : -1;
        for (let sx = 0; sx < 4; sx++) for (let sy = 0; sy < 4; sy++) for (let z = ZB; z <= ZF; z++) {
          let col;
          if (sy === 3) col = (((i * 4 + sx) * -d + Math.abs(z + 1)) % 6 + 6) % 6 === 0 ? 0xf2c030 : jit(rnd, 0x2c2c34, 0.05);
          else if (sy === 0) col = 0x5a6470;
          else if (z === ZF || z === ZB) col = (sx === 1 || sx === 2) && (sy === 1 || sy === 2) ? 0x3a3e46 : 0x8a96a4;
          else col = 0x6a7480;
          v.set(lx + sx, ly + sy, z, col);
        }
        continue;
      }
      /* a cave: an empty tile with ground just above it (or a roof two thick) gets a back
         wall -- not the open air under a ledge */
      if (c !== "~") {
        let roofed = false;
        for (let k = 1; k <= 2; k++) {
          const r = g(i, j + k);
          if (SOLIDS.indexOf(r) >= 0) { roofed = r === "#" || r === "X" || SOLIDS.indexOf(g(i, j + k + 1)) >= 0; break; }
        }
        /* indoors (the hangar, a vault): anything under a roof of blocks has a wall behind it */
        if (!roofed && T.indoors) for (let k = 1; k <= T.indoors; k++) if ("=X".indexOf(g(i, j + k)) >= 0 && "=X".indexOf(g(i, j + k + 1)) >= 0) { roofed = true; break; }
        if (roofed) for (let sx = 0; sx < 4; sx++) for (let sy = 0; sy < 4; sy++) v.set(lx + sx, ly + sy, ZB, jit(rnd, T.back, 0.08));
      }
    }
    const out = [];
    /* faces nobody sees go: every back face (the camera is always in front), and an underside
       with ground under it (the hollow inside a stretch of ground) */
    const keep = (x, y, z, nx, ny, nz) => nz >= 0 && !(ny < 0 && "#=Im{}".indexOf(g(i0 + (x >> 2), (y - 1) >> 2)) >= 0);   // never over something that can break
    if (v.m.size) { const m = new THREE.Mesh(meshVox(v, GR, keep), materials().vox); m.position.x = i0; m.receiveShadow = true; m.castShadow = true; out.push(m); }
    if (w.m.size) { const m = new THREE.Mesh(meshVox(w, GR), materials().water); m.position.x = i0; m.renderOrder = 2; out.push(m); }
    return out;
  }

  /* The ground runs on past either end of the stage at the height it starts and finishes,
     and every column that reaches the bottom row goes on down out of sight. */
  function skirts(S, T) {
    const v = new Vox(), rnd = mulberry32(77), g = new THREE.Group();
    const topOf = i => { for (let j = H - 1; j >= 0; j--) if (SOLIDS.indexOf(S.grid[j][i]) >= 0) return j + 1; return 0; };
    const strip = (x0, x1, top) => {
      const m = new Vox();
      for (let x = 0; x < (x1 - x0) * 4; x++) for (let y = -12; y < top * 4; y++) for (let z = (y >= top * 4 - 4 ? ZDEEP : ZF - 2); z <= ZF; z++)
        m.set(x, y, z, y === top * 4 - 1 ? jit(rnd, pick(rnd, T.top), 0.06) : jit(rnd, y > top * 4 - 12 ? T.soil[(y >> 2) & 1] : T.deep, 0.07));
      const mesh = new THREE.Mesh(meshVox(m, GR), materials().vox); mesh.position.x = x0; mesh.receiveShadow = true; g.add(mesh);
    };
    strip(-14, 0, topOf(0)); strip(S.W, S.W + 14, topOf(S.W - 1));
    for (let i0 = 0; i0 < S.W; i0 += 64) {
      for (let i = i0; i < Math.min(S.W, i0 + 64); i++) {
        if (SOLIDS.indexOf(S.grid[0][i]) < 0 && S.grid[0][i] !== "/" && S.grid[0][i] !== "\\") continue;
        for (let sx = 0; sx < 4; sx++) for (let y = -12; y < 0; y++) for (let z = ZF - 1; z <= ZF; z++)
          v.set((i - i0) * 4 + sx, y, z, jit(rnd, T.deep, 0.07));
      }
      const mesh = new THREE.Mesh(meshVox(v, GR), materials().vox); mesh.position.x = i0; g.add(mesh);
      v.m.clear();
    }
    return g;
  }

  /** One tile on its own -- cracked rock, a crate, a crumbling ledge -- so it can go. */
  function tileGeo(kind, T) {
    const v = new Vox(), rnd = mulberry32(kind.charCodeAt(0) * 31);
    for (let sx = 0; sx < 4; sx++) for (let sy = 0; sy < 4; sy++) for (let z = ZB; z <= ZF; z++) {
      let col;
      if (kind === "X") {
        col = jit(rnd, T.crack, 0.07);
        if ((z === ZF || z === ZB) && (sx === sy || sx === 3 - sy && sy > 1)) col = mulC(T.crack, 0.45);
      } else if (kind === "B") {
        const frame = sx === 0 || sx === 3 || sy === 0 || sy === 3;
        col = frame ? 0x8a5a2c : ((sx + sy) % 2 ? 0xc8904a : 0xb8803e);
        if (z !== ZF && z !== ZB && !frame) col = 0xb8803e;
      } else {
        if (sy < 2) continue;
        col = sy === 3 ? jit(rnd, T.block[0], 0.06) : jit(rnd, mulC(T.block[1], 0.85), 0.06);
        if (z === ZF && (sx + z) % 3 === 0 && sy === 2) col = mulC(T.block[1], 0.55);
      }
      v.set(sx, sy, z, col);
    }
    return meshVox(v, GR);
  }

  // ---------------------------------------------------------------- props, at the racers' grain
  function vox(fn, scale) { const v = new Vox(); fn(v); return meshVox(v, scale || F); }
  const PROPS = {};
  function propGeo(name, T) {
    const key = name + (T ? ":" + T.id : "");
    if (PROPS[key]) return PROPS[key];
    let g;
    switch (name) {
      case "ring": g = vox(v => ringVox(v, 0, 6, 5, 3.6, [0xf2b705, 0xfff3a0, 0xd89a00])); break;   // a gold ring, as every Sonic stage strews them
      case "redring": g = vox(v => {                   // a Red Star Ring: a big red ring, a gold star in it
        ringVox(v, 0, 8, 7.5, 5.6, [0xe42630, 0xff8a8a, 0xa8141c]);
        starVox(v, 0, 8, 3.6, 0xffd21a);
      }); break;
      case "monitor_ring": case "monitor_shield": case "monitor_star": case "monitor_speed": g = vox(v => monitorVox(v, name.slice(8))); break;
      case "bird": g = vox(v => {                       // a little blue bird out of a badnik, as in the classic games
        v.box(-2, 1, -1, 2, 4, 1, 0x3a8ae0); v.box(-1, 2, -1, 1, 3, 1, 0x5aa8f0); v.box(2, 3, -1, 3, 5, 1, 0x3a8ae0);
        v.set(3, 5, 1, 0xffffff); v.set(4, 4, 0, 0xf2b705); v.box(-3, 2, -2, -1, 4, -2, 0x2a6ac0); v.box(-1, 0, 0, 0, 0, 0, 0xf2b705);
      }); break;
      case "bunny": g = vox(v => {                      // a little rabbit, hopping off
        v.box(-2, 0, -1, 2, 3, 1, 0xf0e6d8); v.box(1, 3, -1, 3, 5, 1, 0xf0e6d8); v.box(1, 6, 0, 1, 8, 0, 0xf0e6d8); v.box(3, 6, 0, 3, 8, 0, 0xf0e6d8);
        v.set(3, 5, 1, 0x2a2a2a); v.set(-3, 2, 0, 0xffffff); v.box(1, 7, 1, 1, 7, 1, 0xf0a8b8);
      }); break;
      /* a spring, in voxels after Sonic Advance 3's: a red base, a silver coil (its own part, so
         it can stretch), a red cap with a gold rim round the top */
      case "springBase": g = vox(v => vdisc(v, 0, 2, 6.5, (x, y, z, d) => y === 2 && d > 5.2 ? 0xff5a3a : d > 5.6 ? 0xa8141c : 0xd8261e)); break;
      case "springCoil": g = vox(v => {
        for (let y = 0; y < 8; y++) vdisc(v, y, y, y % 2 ? 4.4 : 3.6, (x, yy, z, d) => d < 2.4 ? null : y % 2 ? (x < 0 ? 0xf2f4fa : 0xb8bcc8) : 0x585c68);
      }); break;
      case "springCap": g = vox(v => vdisc(v, 0, 3, 7.5, (x, y, z, d) => {
        if (y === 3) return d > 6.2 ? 0xffd21a : d > 4.6 ? 0xff8a10 : 0xe8302a;   // the top: a gold rim round red
        if (y === 0) return 0x8a1014;
        return x < -2 && z > 0 ? 0xff6a4a : d > 6.6 ? 0xb81c1c : 0xe02a24;
      })); break;
      case "dash": g = vox(v => {
        v.box(-7, 0, -10, 8, 0, 9, 0x2a2a34);
        for (const ox of [-6, 0, 6]) for (let k = 0; k < 4; k++) { v.box(ox + k - 2, 1, -6 + k, ox + k - 2, 1, -6 + k + 1, 0xf2d040); v.box(ox + k - 2, 1, 5 - k, ox + k - 2, 1, 5 - k + 1, 0xf2d040); }
      }); break;
      case "pole": case "poleDone": g = vox(v => {     // a Star Post: a grey post, its lamp blue till it is passed, then red
        v.box(-1, 0, -1, 0, 30, 0, 0x9aa0ac); v.box(-3, 0, -3, 2, 1, 2, 0x6a6e78); v.box(-2, 30, -2, 1, 31, 1, 0x6a6e78);
        const c = name === "poleDone" ? [0xe42630, 0xff8a8a] : [0x2a6ae0, 0x9ac8ff];
        for (let x = -4; x <= 3; x++) for (let y = -4; y <= 3; y++) for (let z = -4; z <= 3; z++) {
          const d = Math.hypot(x + 0.5, y + 0.5, z + 0.5);
          if (d <= 4.2) v.set(x, 36 + y, z, x < -1 && y > 0 ? c[1] : c[0]);
        }
      }); break;
      case "goal": g = vox(v => {                      // the goal signpost: a grey post, a round sign that spins when passed
        v.box(-1, 0, -1, 0, 46, 0, 0x9aa0ac); v.box(-3, 0, -3, 2, 1, 2, 0x6a6e78);
        for (let x = -11; x <= 10; x++) for (let y = -11; y <= 10; y++) {
          const d = Math.hypot(x + 0.5, y + 0.5);
          if (d > 11) continue;
          const col = d > 9.4 ? 0xf2f2f2 : d > 8.2 ? 0x050a22 : 0x1f58e0;
          v.box(x, 58 + y, -1, x, 58 + y, 0, col);
        }
        starVox(v, 0, 58, 6, 0xffd21a, 1);
      }); break;
      case "relic": g = vox(v => {                     // a story stage's end: a Red Star Ring on a stone plinth
        v.box(-9, 0, -7, 8, 3, 6, 0x8a8a96); v.box(-7, 4, -5, 6, 17, 4, 0xbcbcc8); v.box(-9, 18, -7, 8, 20, 6, 0x8a8a96);
        ringVox(v, 0, 32, 11, 8, [0xe42630, 0xff8a8a, 0xa8141c]);
        starVox(v, 0, 32, 5.5, 0xffd21a);
      }); break;
      case "hurdle": g = vox(v => hurdleVox(v, T ? T.hurdle : "brush")); break;
      case "vent": g = vox(v => { v.box(-5, 0, -5, 4, 2, 4, 0x6a7078); v.box(-3, 2, -3, 2, 3, 2, 0x2a2e34); }); break;
      case "bubble": g = vox(v => {
        for (let x = -4; x <= 4; x++) for (let y = -4; y <= 4; y++) for (let z = -4; z <= 4; z++) {
          const d = Math.hypot(x, y, z);
          if (d < 4.4 && d > 3.2) v.set(x, y, z, (x < -1 && y > 1) ? 0xffffff : 0xbfeaff);
        }
      }); break;
      case "balloon": g = vox(v => {                   // a balloon on a string: a heart in Amy's home, round elsewhere
        const C = (T && T.balloon) || [0xff5a5a, 0xffb0a8], heart = T && T.id === "parlour";
        for (let x = -8; x <= 8; x++) for (let y = -8; y <= 9; y++) for (let z = -4; z <= 4; z++) {
          let inside;
          if (heart) { const X = x / 7.5, Y = (y + 1) / 7.5, k = X * X + Y * Y - 1; inside = k * k * k - X * X * Y * Y * Y <= 0 && Math.abs(z) <= 4 - Math.abs(x) / 4; }
          else inside = Math.hypot(x, y * 0.9, z * 1.6) <= 7;
          if (inside) v.set(x, y, z, (x < -2 && y > 2 && z > 1) ? C[1] : C[0]);
        }
        v.box(0, -10, 0, 0, -9, 0, mulC(C[0], 0.7));
        for (let y = -20; y < -10; y++) v.set(Math.round(Math.sin(y * 0.6)), y, 0, 0xf6f6f2);
      }); break;
      case "bumper": g = vox(v => {                    // a round bumper on the wall behind: ringed, a star in the middle
        const ring = T && T.id === "club" ? 0xff5ac8 : 0xd8303a;
        for (let x = -10; x <= 10; x++) for (let y = -10; y <= 10; y++) {
          const d = Math.hypot(x, y); if (d > 10.4) continue;
          const a = Math.atan2(y, x), star = d < 6.5 * (0.55 + 0.45 * Math.abs(Math.cos(a * 2.5)));
          for (let z = -3; z <= (d < 8 ? 2 : 1); z++) v.set(x, y, z, d > 8 ? ring : d > 7 ? 0xf6f6f2 : star ? 0xf2c030 : 0x3a2a5a);
        }
      }); break;
      case "tree": g = vox(v => treeVox(v, T), 1 / 12); break;
    }
    return (PROPS[key] = g);
  }
  /* h: something across the course to jump, or smash. */
  /* a solid disc, lying flat, rows y0 to y1, radius r; col(x, y, z, d) picks the colour (or null) */
  function vdisc(v, y0, y1, r, col) {
    const n = Math.ceil(r);
    for (let y = y0; y <= y1; y++) for (let x = -n; x < n; x++) for (let z = -n; z < n; z++) {
      const d = Math.hypot(x + 0.5, z + 0.5);
      if (d > r) continue;
      const c = col(x, y, z, d);
      if (c != null) v.set(x, y, z, c);
    }
  }
  /* a ring of voxels on its edge, facing the camera: radius r1 outside, r0 inside, lit at the
     top left (C: face, light, shade) */
  function ringVox(v, cx, cy, r1, r0, C) {
    const n = Math.ceil(r1);
    for (let x = -n; x <= n; x++) for (let y = -n; y <= n; y++) {
      const d = Math.hypot(x, y);
      if (d > r1 || d < r0) continue;
      const a = Math.atan2(y, x), col = a > 1.6 && a < 2.9 ? C[1] : a < -0.6 && a > -2.4 ? C[2] : C[0];
      v.box(cx + x, cy + y, -1, cx + x, cy + y, 0, col);
    }
  }
  /* a five-pointed star, flat, facing the camera, `dz` forward of the face */
  function starVox(v, cx, cy, R, col, dz) {
    const n = Math.ceil(R), pts = [];
    for (let k = 0; k < 10; k++) { const a = PI / 2 + k * PI / 5, r = k % 2 ? R * 0.42 : R; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
    const inside = (x, y) => { let c = false; for (let i = 0, j = 9; i < 10; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
    for (let x = -n; x <= n; x++) for (let y = -n; y <= n; y++) if (inside(x, y)) v.set(cx + x, cy + y, dz || 0, col);
  }
  /* An item monitor -- Sonic's TV of a box -- on its little stand, its screen showing what is
     in it: ten rings, a shield, invincibility's stars, the speed shoes. */
  function monitorVox(v, kind) {
    v.box(-6, 0, -4, 5, 1, 3, 0x6a6e78);
    v.box(-6, 2, -4, 5, 13, 3, 0xc8ccd6); v.box(-6, 13, -4, 5, 13, 3, 0xe8ecf4);
    v.box(-5, 4, 3, 4, 11, 4, 0x182040);
    if (kind === "ring") ringVox({ box: (a, b, c, d, e, f, col) => v.box(a, b, 5, d, e, 5, col) }, 0, 7.5, 3.2, 1.6, [0xf2b705, 0xfff3a0, 0xd89a00]);
    else if (kind === "shield") { for (let x = -3; x <= 3; x++) for (let y = -3; y <= 3; y++) if (Math.hypot(x, y) <= 3.2) v.set(x, 8 + y, 5, Math.hypot(x, y) > 2.2 ? 0x6ac8ff : 0x2a6ae0); }
    else if (kind === "star") { starVox(v, -1, 9, 2.6, 0xffd21a, 5); v.set(2, 6, 5, 0xff6ad8); v.set(3, 9, 5, 0x6affb0); v.set(-3, 5, 5, 0xffffff); }
    else { v.box(-3, 5, 5, 2, 6, 5, 0xe42630); v.box(-3, 7, 5, -1, 9, 5, 0xe42630); v.box(-3, 5, 5, 2, 5, 5, 0xffffff); v.set(1, 7, 5, 0xffffff); }
  }
  const HURDLE_C = { brush: [0x3a7e32, 0x2a6a2a, 0xf6f6f2], barrier: [0xd8303a, 0xf6f6f2, 0x8a8a92], books: BOOKS.slice(0, 4),
                     cairn: [0x8a8478, 0x6a645a, 0xf4f8fc], rope: [0xb01e3a, 0xe8c050, 0x7a1428],
                     stones: [0x7e786c, 0x5a544a, 0x4a9a54], crate: [0xc8904a, 0x8a5a2c, 0xe0b070] };
  function hurdleVox(v, kind) {
    switch (kind) {
      case "barrier":                                  // a road barrier: striped boards on white trestles, a lamp at each end
        for (const z of [-17, 16]) { v.box(-2, 0, z, 2, 1, z + 1, 0x8a8a92); v.box(-1, 2, z, 0, 15, z + 1, 0xf0f0ea); v.box(-1, 16, z, 0, 17, z + 1, 0xf2b020); }
        for (const [y0, y1] of [[4, 7], [10, 13]]) for (let z = -18; z <= 18; z++) v.box(-1, y0, z, 0, y1, z, ((z + 18) >> 2) & 1 ? 0xf6f6f2 : 0xd8303a);
        return;
      case "books": {                                  // books standing in a row, as on a shelf
        let z = -18, k = 0;
        while (z < 18) {
          const t = 2 + (k % 3 === 0 ? 1 : 0), h = 11 + ((k * 7) % 5), c = BOOKS[(k * 5) % BOOKS.length];
          v.box(-3, 0, z, 3, h, z + t - 1, c); v.box(-2, h, z, 2, h, z + t - 1, 0xf6efe0); v.box(3, 2, z, 3, 2, z + t - 1, 0xe8c050);
          z += t; k++;
        }
        return;
      }
      case "cairn":                                    // stones piled up, snow on the top
        for (let y = 0; y < 15; y++) {
          const layer = Math.floor(y / 3), rz = 18 - layer * 2, rx = 3 - (layer > 2 ? 1 : 0);
          for (let z = -rz; z <= rz; z++) for (let x = -rx; x <= rx; x++) {
            const edge = y % 3 === 2 && (Math.abs(z) + layer * 3) % 7 === 0;
            v.set(x, y, z, y >= 13 ? 0xf4f8fc : edge ? 0x5a544a : ((x + z + y) % 5 === 0 ? 0x9a9488 : 0x7e786c));
          }
        }
        return;
      case "stones":                                   // stones piled up by the old shrine, moss on the top
        for (let y = 0; y < 15; y++) {
          const layer = Math.floor(y / 3), rz = 18 - layer * 2, rx = 3 - (layer > 2 ? 1 : 0);
          for (let z = -rz; z <= rz; z++) for (let x = -rx; x <= rx; x++) {
            const edge = y % 3 === 2 && (Math.abs(z) + layer * 3) % 7 === 0;
            v.set(x, y, z, y >= 13 ? ((x + z) & 1 ? 0x4a9a54 : 0x3e8a4a) : edge ? 0x5a544a : ((x + z + y) % 5 === 0 ? 0x9a9488 : 0x7e786c));
          }
        }
        return;
      case "crate":                                    // crates stacked, two and one: smash them
        for (const [y0, y1, z0, z1] of [[0, 10, -18, -1], [0, 10, 0, 17], [11, 18, -9, 8]]) {
          v.box(-3, y0, z0, 3, y1, z1, 0xc8904a);
          v.box(-3, y0, z1, 3, y0, z1, 0x8a5a2c); v.box(-3, y1, z1, 3, y1, z1, 0x8a5a2c);
          for (let y = y0; y <= y1; y++) { v.set(-3, y, z1, 0x8a5a2c); v.set(3, y, z1, 0x8a5a2c); v.set(0, y, z1, 0xa8743a); }
          v.box(-3, y1, z0, 3, y1, z1, 0xd8a060);
        }
        return;
      case "rope":                                     // a velvet rope between brass posts
        for (const z of [-17, 16]) { v.box(-2, 0, z - 1, 2, 1, z + 2, 0xc8a040); v.box(-1, 2, z, 0, 15, z + 1, 0xe8c050); v.box(-1, 16, z, 0, 17, z + 1, 0xfff0a0); }
        for (let z = -16; z <= 15; z++) { const y = Math.round(13 - 4 * (1 - (z / 16) * (z / 16))); v.box(-1, y - 1, z, 0, y, z, 0xb01e3a); }
        return;
      default:                                         // a brush hurdle: green brush in a white frame
        v.box(-3, 0, -18, 3, 1, 18, 0xf6f6f2);
        for (let z = -16; z <= 16; z++) for (let y = 2; y < 15; y++) for (let x = -2; x <= 2; x++) {
          if (y > 12 && ((z + x * 3) & 3) === 0) continue;
          v.set(x, y, z, ((x + y + z) % 4 === 0) ? 0x2a6a2a : ((y * 3 + z) % 5 === 0 ? 0x4a9a3a : 0x3a7e32));
        }
        for (const z of [-18, 18]) v.box(-3, 0, z, 3, 15, z, 0xf6f6f2);
        v.box(-3, 15, -18, 3, 15, 18, 0xf6f6f2);
    }
  }
  /* T: what stands along the back of the course, at a twelfth of a metre. */
  function treeVox(v, T) {
    switch (T.tree) {
      case "windsock": {                               // a windsock on its mast, blown out by the sea breeze
        v.box(-3, 0, -3, 2, 1, 2, 0x8a8a92);
        v.box(-1, 2, -1, 0, 44, 0, 0xe8e8e2);
        v.box(-2, 42, -2, 1, 43, 1, 0x6a6a72);
        for (let s = 0; s < 18; s++) {
          const r = 3.6 - s * 0.13, cy = 41 - s * 0.12, col = Math.floor(s / 4) % 2 ? 0xf6f6f2 : 0xf08a24;
          for (let a = 0; a < 24; a++) { const t = a / 24 * PI * 2; v.set(1 + s, Math.round(cy + Math.sin(t) * r), Math.round(Math.cos(t) * r), col); }
        }
        return;
      }
      case "plant": {                                  // a pot of tulips on the floor
        for (let y = 0; y < 13; y++) { const r = 6 + Math.floor(y / 5); for (let x = -r; x <= r; x++) for (let z = -r; z <= r; z++) if (Math.hypot(x, z) <= r) v.set(x, y, z, y === 9 || y === 10 ? 0xf4a8c4 : 0xd8784a); }
        for (let x = -6; x <= 6; x++) for (let z = -6; z <= 6; z++) if (Math.hypot(x, z) <= 6) v.set(x, 13, z, 0x6a4a32);
        const F = [[-3, 30, 0, 0xff5a8a], [2, 34, -2, 0xf2c030], [4, 27, 3, 0xffffff], [-1, 37, 2, 0xe8304a], [-5, 25, -3, 0xff8ab0]];
        for (const [fx, fy, fz, c] of F) {
          for (let y = 14; y < fy; y++) v.set(Math.round(fx * (y - 14) / (fy - 14)), y, Math.round(fz * (y - 14) / (fy - 14)), 0x4a9a3a);
          v.box(fx - 2, fy, fz - 2, fx + 2, fy + 4, fz + 2, c); v.box(fx - 1, fy + 5, fz - 1, fx + 1, fy + 5, fz + 1, c);
          v.box(fx - 1, fy + 1, fz - 1, fx + 1, fy + 4, fz + 1, mulC(c, 0.85));
        }
        for (const s of [-1, 1]) for (let k = 0; k < 9; k++) v.box(s * (2 + k), 14 + k * 1.2 | 0, 0, s * (2 + k), 15 + k * 1.2 | 0, 1, 0x5ab84a);
        return;
      }
      case "pillar": {                                 // a carved pillar of the old shrines, snow on its head
        v.box(-6, 0, -6, 5, 3, 5, 0xa89e88);
        for (let y = 4; y < 38; y++) for (let x = -4; x <= 3; x++) for (let z = -4; z <= 3; z++) {
          if (x > -4 && x < 3 && z > -4 && z < 3) continue;
          const band = y % 9 < 2, glyph = !band && z === 3 && ((x * 7 + y * 3) % 5 === 0);
          v.set(x, y, z, band ? 0x948a74 : glyph ? 0x4ab87a : ((x + y) % 4 === 0 ? 0xb4aa94 : 0xc4baa4));
        }
        v.box(-6, 38, -6, 5, 41, 5, 0xa89e88); v.box(-6, 42, -6, 5, 43, 5, 0xf4f8fc); v.box(-4, 44, -4, 3, 44, 3, 0xfafcff);
        return;
      }
      case "column": {                                 // a marble column, fluted, a gilt band at its head
        v.box(-7, 0, -7, 6, 3, 6, 0xdcd4c8); v.box(-6, 4, -6, 5, 5, 5, 0xe8e2d8);
        for (let y = 6; y < 44; y++) for (let x = -5; x <= 4; x++) for (let z = -5; z <= 4; z++) {
          const r = Math.hypot(x + 0.5, z + 0.5); if (r > 5.2 || r < 3.6) continue;
          v.set(x, y, z, Math.round(Math.atan2(z + 0.5, x + 0.5) * 4) & 1 ? 0xe4ded2 : 0xf4f0e8);
        }
        v.box(-6, 44, -6, 5, 45, 5, 0xd8b050); v.box(-7, 46, -7, 6, 48, 6, 0xf2eee6);
        return;
      }
      case "lantern": {                                // a stone lantern of the old shrine, lit, moss on its roof
        v.box(-5, 0, -5, 4, 2, 4, 0x7a827c); v.box(-2, 3, -2, 1, 16, 1, 0x8a928c); v.box(-5, 17, -5, 4, 18, 4, 0x7a827c);
        v.box(-4, 19, -4, 3, 25, 3, 0x8a928c); v.box(-3, 20, 3, 2, 24, 3, 0xffe8a0); v.box(-3, 20, -4, 2, 24, -4, 0xffe8a0);
        v.box(-7, 26, -7, 6, 27, 6, 0x6a726c); v.box(-5, 28, -5, 4, 29, 4, 0x4a8a54); v.box(-1, 30, -1, 0, 32, 0, 0x7a827c);
        return;
      }
      case "cactus": {                                 // a saguaro, an arm up either side
        for (let y = 0; y < 40; y++) v.box(-2, y, -2, 2, y, 2, y % 3 ? 0x4a8a3a : 0x3a7a2e);
        v.box(-1, 40, -1, 1, 41, 1, 0x5a9a48);
        for (const [sd, y0, h] of [[-1, 14, 14], [1, 20, 12]]) {
          for (let x = 3; x <= 6; x++) v.box(sd * x - 1, y0, -1, sd * x + 1, y0 + 2, 1, 0x4a8a3a);
          for (let y = y0; y < y0 + h; y++) v.box(sd * 6 - 1, y, -1, sd * 6 + 1, y, 1, y % 3 ? 0x4a8a3a : 0x3a7a2e);
        }
        return;
      }
      case "crates": {                                 // crates stacked up, stencilled
        for (const [cx, cy, cz] of [[0, 0, 0], [12, 0, 0], [6, 11, 0], [-12, 0, -2]]) {
          v.box(cx - 5, cy, cz - 5, cx + 5, cy + 10, cz + 5, 0xb07e40);
          v.box(cx - 5, cy, cz + 5, cx + 5, cy, cz + 5, 0x7a522a); v.box(cx - 5, cy + 10, cz + 5, cx + 5, cy + 10, cz + 5, 0x7a522a);
          v.box(cx - 2, cy + 4, cz + 6, cx + 2, cy + 6, cz + 6, 0x2a2a2a);
        }
        return;
      }
      case "console": {                                // a console, its screen lit, its buttons
        v.box(-8, 0, -5, 7, 14, 4, 0x6a707a); v.box(-8, 15, -5, 7, 16, 0, 0x5a606a);
        v.box(-7, 17, -5, 6, 30, -3, 0x4a505a); v.box(-6, 18, -2, 5, 29, -2, 0x3ad8a0);
        for (let k = 0; k < 4; k++) v.set(-6 + k * 3, 15, 3, [0xe84a3a, 0xf2c030, 0x7ad8ff, 0x6ac06a][k]);
        return;
      }
      case "lamp": case "streetlamp": {                // a lamp: ornate on the strip, tall and plain on the road
        if (T.tree === "lamp") {
          v.box(-3, 0, -3, 2, 2, 2, 0x2a2430); v.box(-1, 3, -1, 0, 34, 0, 0x2a2430);
          for (const y of [10, 22, 33]) v.box(-2, y, -2, 1, y, 1, 0xe8c050);
          v.box(-3, 35, -3, 2, 41, 2, 0xfff2b0); v.box(-4, 42, -4, 3, 43, 3, 0x2a2430); v.box(-1, 44, -1, 0, 46, 0, 0xe8c050);
        } else {
          v.box(-2, 0, -2, 1, 2, 1, 0x6a6a72); v.box(-1, 3, -1, 0, 56, 0, 0x8a8a92);
          for (let x = 0; x < 12; x++) v.set(x, 56 + Math.floor(x / 4), 0, 0x8a8a92);
          v.box(9, 57, -2, 15, 59, 1, 0x6a6a72); v.box(10, 56, -1, 14, 56, 0, 0xfff2c8);
        }
        return;
      }
      default: {                                       // a palm bent by the sea wind: the trunk ringed and leaning, seven fronds and coconuts
        let lx = 0;
        for (let y = 0; y < 38; y++) { lx = Math.round(y * y / 150); v.box(lx - 1, y, -1, lx + 1, y, 1, y % 4 === 0 ? 0x7a5a3a : 0x9a7448); }
        for (let k = 0; k < 7; k++) {
          const a = k / 7 * PI * 2 + 0.3;
          for (let s = 1; s < 14; s++) {
            const fx = lx + Math.round(Math.cos(a) * s), fz = Math.round(Math.sin(a) * s), fy = 39 - Math.round(s * s / 14);
            v.set(fx, fy, fz, s % 4 === 0 ? 0x2f8a2a : 0x4cae3a);
            if (s > 2 && s < 11) v.set(fx, fy - 1, fz, 0x3a9a30);
          }
        }
        v.box(lx - 1, 36, -1, lx + 1, 37, 1, 0x6a4a2a); v.box(lx - 2, 34, 1, lx - 1, 35, 2, 0x8a5a2a); v.box(lx + 1, 34, -2, lx + 2, 35, -1, 0x8a5a2a);
      }
    }
  }
  /* Where a lamp's light hangs, in metres from its foot (twelve grains a metre), for its glow. */
  const LAMP_AT = { lamp: [0, 38 / 12], streetlamp: [12 / 12, 56 / 12], lantern: [0, 22 / 12] };

  // ---------------------------------------------------------------- far away
  /* What stands behind each stage, built coarse and set back so the perspective camera
     gives it parallax for free. */
  function buildFar(T, S, rnd, group) {
    const M = materials(), W = S.W;
    group.userData.anim = [];
    const topOf0 = (() => { for (let j = H - 1; j >= 0; j--) if (SOLIDS.indexOf(S.grid[j][0]) >= 0) return j + 1; return 0; })();
    /* a floor for the backdrop, `depth` deep back from z = front (never nearer than the stage's back) */
    const plane = (color, y, front, depth) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(W + 900, depth), new THREE.MeshLambertMaterial({ color })); m.rotation.x = -PI / 2; m.position.set(W / 2, y, Math.min(front, -5) - depth / 2); group.add(m); return m; };
    const clouds = k => cloudBank(group, W, rnd, Math.round(W / 30 * k));
    const add = (geo, x, y, z, s) => { const m = new THREE.Mesh(geo, M.vox); m.position.set(x, y, z); if (s) m.scale.setScalar(s); group.add(m); return m; };
    const band = (grain, z0, z1, base, amp, freq, cols, seed) => {
      const v = new Vox(), r = mulberry32(seed);
      const n = Math.ceil((W + 120) / grain);
      for (let x = 0; x < n; x++) {
        const X = x * grain - 60;
        const h = Math.max(1, Math.round((base + Math.sin(X * freq + seed) * amp + Math.sin(X * freq * 2.7 + seed * 2) * amp * 0.4) / grain));
        for (let z = Math.round(z0 / grain); z <= Math.round(z1 / grain); z++) for (let y = 0; y < h; y++)
          v.set(x, y, z, jit(r, y === h - 1 ? cols[1] : cols[0], 0.05));
      }
      const m = new THREE.Mesh(meshVox(v, grain), M.vox); m.position.x = -60; group.add(m); return m;
    };
    const trees = (z, n, y) => { for (let k = 0; k < n; k++) add(propGeo("tree", T), rnd() * (W + 40) - 20, y, z - rnd() * 6, 1 + rnd() * 0.4); };
    switch (T.far) {
      case "cape": {
        /* the open sea below the clifftops; headlands of the same chalk across the bay; a
           torii out on a rock, sails, and clouds */
        const sea = new THREE.Mesh(new THREE.PlaneGeometry(W + 900, 700), new THREE.MeshLambertMaterial({ color: 0x1f8fd0 }));
        sea.rotation.x = -PI / 2; sea.position.set(W / 2, -0.5, -355); group.add(sea);
        const glint = vox(v => { for (let k = 0; k < 160; k++) { const x = Math.floor(rnd() * 1600), z = Math.floor(rnd() * 240); v.set(x, 0, z, 0xffffff); if (rnd() < 0.5) v.set(x + 1, 0, z, 0xd8f2fc); } }, 0.25);
        for (let x = -60; x < W + 60; x += 400) { const m = new THREE.Mesh(glint, M.glow); m.position.set(x, -0.5, -75); group.add(m); }
        {                                                         // chalk, sheer to the water, turf on top
          const v = new Vox(), r = mulberry32(31), g = 3;
          for (let x = 0; x < (W + 260) / g; x++) {
            const X = x * g, s = Math.sin(X * 0.022) + Math.sin(X * 0.057) * 0.35;
            if (s < 0.15) continue;                               // open water between the headlands
            const h = Math.round((5 + s * 7) / g);
            for (let y = 0; y < h; y++) for (let z = 0; z < 4; z++)
              v.set(x, y, z, y >= h - 1 ? jit(r, 0x5ea04a, 0.05) : jit(r, (y % 3 === 1) ? 0xcabfa4 : 0xe8e0cc, 0.03));
          }
          const m = new THREE.Mesh(meshVox(v, g), M.vox); m.position.set(-130, -0.5, -160); group.add(m);
          /* a lighthouse on the broadest headland in each stretch, standing on its turf */
          for (let x0 = 0; x0 < W + 120; x0 += 260) {
            let best = null;
            for (let X = x0; X < x0 + 260; X += g) { const s = Math.sin(X * 0.022) + Math.sin(X * 0.057) * 0.35; if (s > 0.15 && (!best || s > best.s)) best = { X, s }; }
            if (best) lighthouse(group, best.X - 130 + 1.5, -0.5 + Math.round((5 + best.s * 7) / g) * g, -155);
          }
        }
        /* the coast across the bay: green hills to the horizon, behind the headlands */
        band(4, -262, -250, 18, 9, 0.009, [0x4a8a5a, 0x5ea04a], 37);
        /* rocks standing in the bay, their tops in grass, a palm or two on each */
        for (let x = 10; x < W + 40; x += 44 + rnd() * 34) seaStack(group, x, -36 - rnd() * 44, 3 + Math.floor(rnd() * 8), rnd, T);
        for (let x = 30; x < W; x += 110) torii(group, x + rnd() * 30, -48 - rnd() * 10);
        for (let k = 0; k < Math.round(W / 40); k++) {
          const b = vox(v => { v.box(-4, 0, -1, 4, 1, 1, 0xf6f6f2); v.box(-5, 1, -1, 5, 1, 1, 0x3a5a8a); for (let y = 2; y < 12; y++) v.box(0, y, 0, Math.round((12 - y) * 0.45), y, 0, 0xfaf8f0); v.box(0, 2, 0, 0, 13, 0, 0x8a6a4a); }, 0.5);
          const m = new THREE.Mesh(b, M.vox); m.position.set(rnd() * (W + 80) - 40, -0.5, -70 - rnd() * 60); m.rotation.y = rnd() < 0.5 ? 0 : PI; group.add(m);
        }
        for (let k = 0; k < Math.round(W / 30); k++) {
          const v = new Vox(), r = mulberry32(k * 13 + 7), n = 3 + Math.floor(r() * 4);
          for (let c = 0; c < n; c++) {
            const cx = c * 5 + Math.floor(r() * 3), rad = 3 + Math.floor(r() * 3) - (c === 0 || c === n - 1 ? 1 : 0);
            for (let x = -rad; x <= rad; x++) for (let y = 0; y <= rad; y++) for (let z = -2; z <= 2; z++)
              if (Math.hypot(x, y * 1.2, z * 1.5) <= rad) v.set(cx + x, y, z, y === 0 ? 0xe6eef6 : 0xffffff);
          }
          const m = new THREE.Mesh(meshVox(v, 1.4), new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }));
          m.position.set(rnd() * (W + 300) - 150, 26 + rnd() * 26, -230 - rnd() * 40); group.add(m);
        }
        break;
      }
      case "works": {
        /* Tails' airfield: grass to the sea, a runway, hangars, the control tower, wind
           turbines turning on the hills, his planes going over */
        plane(0x62a844, 0, -5, 300);
        plane(0x2a90d0, 0.1, -300, 400);
        plane(0x4a4a52, 0.05, -41, 14);                           // the runway
        { const v = new Vox(); for (let x = 0; x < W + 240; x += 6) v.box(x, 0, 0, x + 2, 0, 1, 0xf2f0e8); const m = new THREE.Mesh(meshVox(v, 1), M.vox); m.position.set(-120, 0.12, -49); group.add(m); }
        band(2, -150, -140, 7, 4, 0.025, [0x7aa070, 0x86ac7a], 41);
        band(2, -112, -100, 4, 2.5, 0.035, [0x5e9a46, 0x6aac50], 43);
        for (let x = 0; x < W + 40; x += 9 + rnd() * 8) oak(group, x, 0, -88 - rnd() * 8, 0.9 + rnd() * 0.5, rnd);
        for (let x = 20; x < W; x += 95) { hangar(group, x + rnd() * 20, -70, rnd); fuelTank(group, x + 42 + rnd() * 6, -66); }
        for (let x = 140; x < W; x += 320) tower(group, x, -58);
        for (let x = 0; x < W + 100; x += 60) group.userData.anim.push(turbine(group, x + rnd() * 30, -135 - rnd() * 10, 10 + rnd() * 4));
        for (let k = 0; k < 3; k++) group.userData.anim.push(biplane(group, W, k, rnd));
        clouds(0.8);
        break;
      }
      case "parlour": {
        /* Amy's home, from the floor up: the floorboards running back to a papered wall, and
           what stands along it -- the bed, a dresser with a heart mirror, shelves of books, a
           window on the city, pictures, a clock, fairy lights -- all of it huge */
        const base = topOf0;
        plane(0xc8925c, base - 0.02, -5, 34);
        wallpaper(group, W, base, -38);
        const kit = [bed, dresser, windowOn, shelves, pictures, windowOn, dresser, pictures];
        let k = 0;
        for (let x = 6; x < W + 20; x += 34 + Math.floor(rnd() * 8)) kit[k++ % kit.length](group, x, base, -30, rnd);
        for (let x = -10; x < W + 20; x += 24) fairyLights(group, x, base + 26, -37.5);
        break;
      }
      case "peak": {
        /* Knuckles' mountain: snowfields and black rock, the old shrines stepping up the
           slopes, carved pillars in the snow, and at the summit a light that does not go out */
        plane(0xeef3f8, 0, -5, 400);
        mountains(group, W, -230, 3, 70, 0x8a96aa, 1);
        mountains(group, W, -120, 2, 34, 0x6a6470, 2);
        for (let x = 30; x < W; x += 140) shrine(group, x + rnd() * 30, -70 - rnd() * 14, rnd);
        trees(-16, Math.round(W / 22), 0);
        for (let x = 60; x < W + 60; x += 300) beacon(group, x + rnd() * 60, -200);
        clouds(0.6);
        break;
      }
      case "club": {
        /* Rouge's street after midnight: the casinos and clubs lit up in neon, signs in the
           four suits, searchlights crossing the sky, a full moon; her own club at the end */
        plane(0x1c1428, 0, -5, 400);
        casinos(group, W, -34, rnd);
        casinos(group, W, -70, rnd, 1.6);
        { const m = new THREE.Mesh(new THREE.CircleGeometry(14, 40), new THREE.MeshBasicMaterial({ color: 0xfff6e0, fog: false })); m.position.set(W * 0.6, 70, -280); group.add(m);
          const s = new THREE.Sprite(glowMat(0xd8c8ff, 0.5)); s.scale.set(70, 70, 1); s.position.set(W * 0.6, 70, -279); group.add(s); }
        for (let x = 40; x < W; x += 120) group.userData.anim.push(searchlight(group, x + rnd() * 40, -90, rnd));
        clubFront(group, W - 12, -16);
        break;
      }
      case "city": {
        /* Shadow's road out of the city at sundown: the sun on the horizon, the towers dark
           against it, a raised road behind with its traffic, lamps along it */
        plane(0x5a4650, 0, -5, 400);
        { const m = new THREE.Mesh(new THREE.CircleGeometry(26, 48), new THREE.MeshBasicMaterial({ color: 0xffd080, fog: false })); m.position.set(W * 0.5, 16, -300); group.add(m);
          const s = new THREE.Sprite(glowMat(0xff9a50, 0.8)); s.scale.set(150, 150, 1); s.position.set(W * 0.5, 16, -299); group.add(s); }
        skyline(group, W, -250, 0x6a4a6a, 0.0, 60, 1.6);
        skyline(group, W, -150, 0x4a3448, 0.25, 44, 1.2);
        skyline(group, W, -85, 0x2e2230, 0.5, 30, 0.9);
        overpass(group, W, -32);
        group.userData.anim.push(traffic(group, W, -32));
        break;
      }
      case "museum": {
        /* the hall, from its floor: marble running back to the far wall, tall arched windows in
           it full of daylight and banners between; the great skeletons on their plinths, glass
           cases of fossils, a whale's skeleton hung from the ceiling */
        const base = topOf0;
        plane(0xcbbda2, base - 0.02, -5, 64);
        museumWall(group, W, base, -66);
        let k = 0;
        for (let x = 10; x < W + 20; x += 36 + Math.floor(rnd() * 10)) {
          if (k % 3 === 2) displayCases(group, x, base, -24); else skeleton(group, x, base, -36 - rnd() * 8, k % 2);
          k++;
        }
        hallCeiling(group, W, base + 34, -2, -66, 0xb8ab90, 0x8a7e66, 0xfff6d8);
        for (let x = 40; x < W; x += 150) whale(group, x, base + 24, -50, base + 34);
        break;
      }
      case "springs": {
        /* the springs at night: still water running back to the cliffs, waterfalls down them,
           the old shrine at the top of its steps, stone lanterns, fireflies, the moon */
        plane(0x1e6a7a, -0.3, -5, 400);
        band(3, -120, -110, 26, 10, 0.02, [0x3a4a48, 0x3e7a4a], 81);
        const cliffAt = bandAt(3, 26, 10, 0.02, 81);
        band(4, -200, -190, 44, 16, 0.012, [0x2a3634, 0x2e5a3a], 82);
        for (let x = 20; x < W; x += 70 + rnd() * 40) waterfall(group, x, -107, cliffAt(x + 2));
        for (let x = 60; x < W; x += 170) shrineSteps(group, x + rnd() * 30, -64);
        trees(-14, Math.round(W / 26), 0);
        disc(group, W * 0.4, 62, -262, 13, 0xeef6ff, 0xc8e0ff);
        group.userData.anim.push(fireflies(group, W, rnd));
        break;
      }
      case "canyon": {
        /* canyon country: sand running back to red mesas laid down in bands, buttes standing
           alone, the far rims pale in the heat; cacti; the sun high */
        plane(0xe0aa70, 0, -5, 400);
        band(4, -240, -228, 46, 14, 0.008, [0xd8a07a, 0xe8bc94], 91);
        band(3, -150, -140, 28, 12, 0.014, [0xb8603a, 0xd88a5a], 92);
        band(2, -84, -78, 12, 6, 0.03, [0xa84e30, 0xc87a4a], 93);
        for (let x = 30; x < W; x += 90 + rnd() * 60) butte(group, x, -112 - rnd() * 18, 14 + Math.floor(rnd() * 12), rnd);
        trees(-12, Math.round(W / 18), 0);
        disc(group, W * 0.7, 74, -290, 12, 0xfff6d8, 0xffd890);
        clouds(0.3);
        break;
      }
      case "ruins": {
        /* the city burning: towers broken off against a red sky, the fires in them, and pieces
           of the city hanging in the air -- his power holding them up */
        plane(0x2a2224, 0, -5, 400);
        disc(group, W * 0.5, 26, -300, 22, 0xff9a50, 0xff5a20);
        skyline(group, W, -240, 0x3a1e1e, 0.0, 70, 1.6);
        skyline(group, W, -150, 0x2a1616, 0.15, 50, 1.2);
        brokenBlocks(group, W, -72, rnd);
        rubble(group, W, -30, rnd);
        group.userData.anim.push(fires(group, W, rnd));
        break;
      }
      case "depot": {
        /* the depot: the floor running back under racks of crates three high to the wall,
           steel columns, lamps hanging on chains */
        const base = topOf0;
        plane(0x4a525c, base - 0.02, -5, 70);
        depotWall(group, W, base, -72);
        for (let x = 0; x < W + 40; x += 26) rack(group, x + rnd() * 4, base, -36 - rnd() * 6, rnd);
        hallCeiling(group, W, base + 26, -2, -72, 0x2e343c, 0x4a525c, 0xf2c030);
        for (let x = 10; x < W; x += 22) hangLamp(group, x, base + 20, -16 - rnd() * 10, base + 26);
        break;
      }
      case "stars": {
        /* the course out among the stars: a ringed planet, a nebula's glow, the track's other
           turns floating far off in ribbons of light, grandstands lit up, rocks drifting by */
        nebula(group, W);
        ringedPlanet(group, W * 0.3, 44, -300);
        plane(0x3c3850, 0, -5, 420);
        band(4, -250, -238, 20, 12, 0.01, [0x34304a, 0x4a4466], 61);
        band(3, -140, -132, 8, 5, 0.025, [0x3e3a54, 0x524c6c], 62);
        craters(group, W, rnd);
        for (let x = -100; x < W + 200; x += 170) trackRibbon(group, x, -150 - rnd() * 40, rnd);
        for (let x = 40; x < W; x += 120) grandstand(group, x + rnd() * 30, -60, rnd);
        break;
      }
      case "station": {
        /* his station in orbit: the hull's inner wall with great windows in it, and through them
           the world turning far below; pipes, and warning lights going round */
        group.userData.anim.push(worldBelow(group, W));
        plane(0x3a3e48, topOf0 - 0.02, -5, 36);                   // the deck, back to the wall: the world is out of the windows
        { const m = new THREE.Mesh(new THREE.PlaneGeometry(W + 900, 64), new THREE.MeshLambertMaterial({ color: 0x14161c }));
          m.rotation.x = -PI / 2; m.position.set(W / 2, -1.5, -22); group.add(m); }   // and the shafts' floors, far down in the dark
        stationWall(group, W, topOf0, -40);
        group.userData.anim.push(warnLights(group, W, topOf0, -39));
        break;
      }
    }
    // a clear night: stars, far off, past the fog
    if (T.stars) {
      const n = 420, pos = new Float32Array(n * 3);
      for (let k = 0; k < n; k++) { pos[k * 3] = Math.random() * (W + 400) - 200; pos[k * 3 + 1] = 25 + Math.random() * 140; pos[k * 3 + 2] = -260 - Math.random() * 40; }
      const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      group.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, fog: false, transparent: true, opacity: 0.85 })));
    }
  }
  /* ---- the backdrops' pieces. Each is built in voxels at its own grain and set far enough
     back for the camera to give it parallax; `anim` ones hand back a function of the time. */
  const voxMesh = (v, g, x, y, z, mat) => { const m = new THREE.Mesh(meshVox(v, g), mat || materials().vox); m.position.set(x, y, z); return m; };
  function cloudBank(group, W, rnd, n, y0) {
    for (let k = 0; k < n; k++) {
      const v = new Vox(), r = mulberry32(k * 13 + 7), c = 3 + Math.floor(r() * 4);
      for (let q = 0; q < c; q++) {
        const cx = q * 5 + Math.floor(r() * 3), rad = 3 + Math.floor(r() * 3) - (q === 0 || q === c - 1 ? 1 : 0);
        for (let x = -rad; x <= rad; x++) for (let y = 0; y <= rad; y++) for (let z = -2; z <= 2; z++)
          if (Math.hypot(x, y * 1.2, z * 1.5) <= rad) v.set(cx + x, y, z, y === 0 ? 0xe6eef6 : 0xffffff);
      }
      group.add(voxMesh(v, 1.4, rnd() * (W + 300) - 150, (y0 || 26) + rnd() * 26, -230 - rnd() * 40, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false })));
    }
  }
  function hangar(group, x, z, rnd) {                  // an arched hangar, its doors run back
    const v = new Vox(), r = mulberry32(x | 0), wall = [0xdcd8d0, 0xc8c4bc], roof = 0x6a86a6;
    for (let X = -22; X <= 22; X++) {
      const top = 14 + Math.round(Math.sqrt(1 - (X / 23) * (X / 23)) * 9);
      for (let y = 0; y <= top; y++) for (let Z = 0; Z < 26; Z++) {
        if (X > -22 && X < 22 && Z > 0 && Z < 25 && y < top) continue;
        let c = y >= top - 1 ? (Z % 4 === 0 ? mulC(roof, 0.8) : roof) : wall[(X + 22 >> 1) & 1];
        if (Z === 25 && Math.abs(X) < 15 && y < 13) c = Math.abs(X) > 12 ? 0x8a929c : 0x262a32;
        v.set(X, y, Z, jit(r, c, 0.03));
      }
    }
    v.box(-6, 15, 26, 5, 17, 26, 0xf08a24);                       // a stripe of Tails' orange over the door
    group.add(voxMesh(v, 0.5, x, 0, z));
  }
  function tower(group, x, z) {                         // the control tower
    const v = new Vox();
    v.box(-4, 0, -4, 3, 44, 3, 0xe8e6e0); for (let y = 6; y < 44; y += 6) v.box(-4, y, 4, 3, y, 4, 0xc8c6c0);
    v.box(-7, 45, -7, 6, 52, 6, 0x6ab8e0); for (const X of [-7, 6]) v.box(X, 45, -7, X, 52, 6, 0xe8e6e0);
    v.box(-8, 53, -8, 7, 54, 7, 0x3a4048); v.box(0, 55, 0, 0, 62, 0, 0x8a8e96);
    group.add(voxMesh(v, 0.5, x, 0, z));
    const s = new THREE.Sprite(glowMat(0xff4a3a, 0.9)); s.scale.set(3, 3, 1); s.position.set(x, 31.5, z); group.add(s);
  }
  function turbine(group, x, z, h) {                    // a wind turbine on the hills: it turns
    const v = new Vox(); v.box(-1, 0, -1, 0, Math.round(h * 2), 0, 0xf2f2ee); v.box(-2, Math.round(h * 2), -2, 1, Math.round(h * 2) + 2, 3, 0xe8e8e4);
    group.add(voxMesh(v, 0.5, x, 0, z));
    const b = new Vox(); for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2; for (let s = 1; s < 18; s++) b.set(Math.round(Math.cos(a) * s), Math.round(Math.sin(a) * s), 0, s > 15 ? 0xd8303a : 0xf6f6f2); }
    const m = voxMesh(b, 0.5, x, h + 1, z + 2); group.add(m);
    const ph = x * 0.37;
    return t => { m.rotation.z = t * 1.3 + ph; };
  }
  function biplane(group, W, k, rnd) {                  // a biplane going over, across the whole field and round again
    const v = new Vox(), C = [[0xf08a24, 0xf6f6f2], [0x3a7ae0, 0xf2d040], [0xd8303a, 0xf6f6f2]][k % 3];
    v.box(-8, 0, -1, 7, 2, 1, C[0]); v.box(8, 0, -1, 9, 2, 1, 0x3a3a40); v.box(10, -3, 0, 10, 5, 0, 0xc8ccd4);
    for (const y of [-1, 4]) v.box(0, y, -9, 4, y, 9, C[1]); for (const Z of [-7, 7]) v.box(2, -1, Z, 2, 4, Z, 0x8a6a4a);
    v.box(-8, 3, 0, -6, 6, 0, C[0]); v.box(-8, 2, -3, -6, 2, 3, C[1]); v.box(2, 3, 0, 4, 4, 0, 0x5ab4e0);
    const m = voxMesh(v, 0.25, 0, 0, -70 - k * 25); group.add(m);
    const sp = 7 + k * 2, off = rnd() * W, y0 = 24 + k * 6;
    return t => { m.position.x = ((t * sp + off) % (W + 260)) - 130; m.position.y = y0 + Math.sin(t * 0.6 + k) * 1.5; };
  }
  function wallpaper(group, W, base, z) {               // Amy's wallpaper: pink stripes and little hearts, a white dado below
    const c = document.createElement("canvas"); c.width = c.height = 32;
    const g = c.getContext("2d");
    for (let x = 0; x < 32; x += 8) { g.fillStyle = "#f6c2d4"; g.fillRect(x, 0, 4, 32); g.fillStyle = "#fad6e2"; g.fillRect(x + 4, 0, 4, 32); }
    g.fillStyle = "#ec7aa6";
    for (const [hx, hy] of [[6, 6], [22, 22]]) { g.fillRect(hx, hy, 2, 2); g.fillRect(hx + 3, hy, 2, 2); g.fillRect(hx - 1, hy + 1, 7, 2); g.fillRect(hx, hy + 3, 5, 1); g.fillRect(hx + 1, hy + 4, 3, 1); g.fillRect(hx + 2, hy + 5, 1, 1); }
    const t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set((W + 300) / 5, 90 / 5);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(W + 300, 90), new THREE.MeshLambertMaterial({ map: t }));
    wall.position.set(W / 2, base + 45, z); group.add(wall);
    const dado = new THREE.Mesh(new THREE.PlaneGeometry(W + 300, 7), new THREE.MeshLambertMaterial({ color: 0xfaf4ee })); dado.position.set(W / 2, base + 3.5, z + 0.05); group.add(dado);
    for (const [y, hgt, c2] of [[0.35, 0.7, 0xe6d6cc], [7, 0.5, 0xf4e8e0]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(W + 300, hgt), new THREE.MeshLambertMaterial({ color: c2 })); m.position.set(W / 2, base + y, z + 0.1); group.add(m); }
  }
  function bed(group, x, base, z) {                     // the bed: a pink quilt with hearts, pillows, a heart in the headboard
    const v = new Vox();
    for (const X of [0, 54]) for (const Z of [0, 20]) v.box(X, 0, Z, X + 2, 4, Z + 2, 0xf6efe6);
    v.box(0, 5, 0, 56, 10, 22, 0xf8f4ee);
    for (let X = 2; X <= 56; X++) for (let Z = -1; Z <= 23; Z++) for (let y = 11; y <= 13; y++) {
      const heart = ((X >> 2) + (Z >> 2)) % 3 === 0 && (X & 3) === 1 && (Z & 3) === 1;
      v.set(X, y, Z, heart ? 0xffffff : y === 11 && (Z === -1 || Z === 23) ? 0xe86c9c : 0xf48ab4);
    }
    v.box(4, 14, 2, 14, 17, 10, 0xffffff); v.box(4, 14, 12, 14, 17, 20, 0xfad0de);
    v.box(-2, 0, -1, 1, 30, 23, 0xf6efe6);
    for (let y = -6; y <= 6; y++) for (let Z = -6; Z <= 6; Z++) {
      const X = Z / 5, Y = (y + 1) / 5, k = X * X + Y * Y - 1;
      if (k * k * k - X * X * Y * Y * Y <= 0) v.set(2, 22 + y, 11 + Z, 0xf06a9c);
    }
    group.add(voxMesh(v, 0.5, x, base, z));
  }
  function dresser(group, x, base, z) {                 // a white dresser, gold knobs; on it a heart-shaped mirror and bottles
    const v = new Vox();
    v.box(0, 0, 0, 24, 22, 12, 0xf8f2ea);
    for (const y of [3, 10, 17]) { v.box(1, y, 13, 23, y + 5, 13, 0xf2e8de); v.box(11, y + 2, 14, 12, y + 3, 14, 0xe8c050); }
    v.box(-1, 23, -1, 25, 23, 13, 0xf6efe6);
    for (let y = -10; y <= 10; y++) for (let X = -10; X <= 10; X++) {
      const a = X / 9, b2 = (y + 1) / 9, k = a * a + b2 * b2 - 1, k2 = (X / 7.5) ** 2 + ((y + 1) / 7.5) ** 2 - 1;
      if (k * k * k - a * a * b2 * b2 * b2 > 0) continue;
      v.set(12 + X, 36 + y, 5, k2 * k2 * k2 - (X / 7.5) ** 2 * ((y + 1) / 7.5) ** 3 <= 0 ? ((X + y) % 7 === 0 ? 0xffffff : 0xbfe2f2) : 0xe8c050);
    }
    v.box(11, 24, 5, 13, 26, 5, 0xe8c050);
    v.box(2, 24, 6, 4, 29, 8, 0xf48ab4); v.box(3, 30, 7, 3, 31, 7, 0xe8c050); v.box(19, 24, 6, 22, 27, 9, 0xb070e0); v.box(20, 28, 7, 21, 28, 8, 0xffffff);
    group.add(voxMesh(v, 0.5, x, base, z));
  }
  function windowOn(group, x, base, z) {                // a window on the city, the curtains drawn back
    const v = new Vox(), sky = [0x7ac0f0, 0x9ad0f4, 0xbfe2f8];
    for (let X = 0; X <= 32; X++) for (let y = 0; y <= 40; y++) {
      const frame = X === 0 || X === 32 || y === 0 || y === 40 || X === 16 || y === 20;
      let c = frame ? 0xf8f6f2 : sky[Math.min(2, Math.floor((40 - y) / 14))];
      if (!frame && y < 10 && ((X * 7) % 5 < 3) && y < 4 + ((X * 13) % 7)) c = 0x8aa0c0;     // rooftops
      if (!frame && y > 26 && y < 31 && X > 4 && X < 13) c = 0xffffff;                        // a cloud
      v.set(X, y, 0, c);
    }
    v.box(-2, -1, 1, 34, -1, 3, 0xf8f6f2);
    for (const [X0, s] of [[-7, 1], [33, -1]]) for (let y = -4; y <= 42; y++) for (let k = 0; k < 6; k++) v.set(X0 + k + (s > 0 ? 0 : 0), y, 1 + ((k + y) % 3 === 0 ? 1 : 0), (k + (y >> 2)) % 3 === 0 ? 0xe86c9c : 0xf48ab4);
    v.box(-8, 43, 1, 40, 44, 2, 0xe8c050);
    group.add(voxMesh(v, 0.5, x, base + 14, z - 7.5));
  }
  function shelves(group, x, base, z) {                 // a tall bookcase, books of every colour, a pot plant on top
    const v = new Vox();
    v.box(0, 0, 0, 22, 60, 1, 0xf2ece4); for (const X of [0, 22]) v.box(X, 0, 0, X, 60, 10, 0xf8f2ea);
    for (let s = 0; s <= 4; s++) {
      const y = s * 15; v.box(0, y, 0, 22, y, 10, 0xf8f2ea);
      if (s === 4) continue;
      let X = 1, k = s * 5;
      while (X < 21) { const t = 1 + (k % 3 === 0 ? 1 : 0), h = 8 + (k * 7) % 5; v.box(X, y + 1, 2, Math.min(21, X + t - 1), y + h, 9, BOOKS[k % BOOKS.length]); X += t; k++; }
    }
    v.box(8, 61, 3, 14, 66, 9, 0xd8784a); v.box(9, 67, 5, 13, 72, 7, 0x5ab84a); v.box(10, 73, 5, 12, 74, 7, 0xff5a8a);
    group.add(voxMesh(v, 0.5, x, base, z));
  }
  function pictures(group, x, base, z) {                // two pictures and a clock on the wall
    const v = new Vox(), P = [[0, 0xff8ab0, 0x5ab84a], [18, 0x7ac0f0, 0xf2c040]];
    for (const [X0, c1, c2] of P) for (let X = 0; X <= 12; X++) for (let y = 0; y <= 15; y++) {
      const edge = X === 0 || X === 12 || y === 0 || y === 15;
      v.set(X0 + X, y, 0, edge ? 0xe8c050 : (Math.hypot(X - 6, y - 9) < 3 ? c1 : y < 5 ? c2 : 0xfaf6ee));
    }
    for (let X = -6; X <= 6; X++) for (let y = -6; y <= 6; y++) { const d = Math.hypot(X, y); if (d > 6.4) continue; v.set(40 + X, 26 + y, 0, d > 5.2 ? 0xf06a9c : (X === 0 && y >= 0 && y < 5) || (y === 0 && X >= 0 && X < 4) ? 0x2a2a30 : 0xfaf6ee); }
    group.add(voxMesh(v, 0.5, x, base + 13, z - 7.6));
  }
  function fairyLights(group, x, y, z) {                // a string of fairy lights along the wall, sagging between pins
    const C = [0xff8ab0, 0xfff0a0, 0xffffff, 0x9ad8ff];
    for (let k = 0; k <= 8; k++) {
      const t = k / 8, sx = x + t * 24, sy = y - Math.sin(t * PI) * 2.2;
      const s = new THREE.Sprite(glowMat(C[k % 4], 0.85)); s.scale.set(1.6, 1.6, 1); s.position.set(sx, sy, z); group.add(s);
    }
  }
  function mountains(group, W, z, g, height, rock, seed) {   // snow-capped peaks, black rock below the snowline
    const v = new Vox(), r = mulberry32(seed * 31);
    for (let x = 0; x < (W + 600) / g; x++) {
      const X = x * g, s = 0.5 + 0.5 * Math.sin(X * 0.011 + seed) * Math.sin(X * 0.023 + seed * 3), h = Math.max(2, Math.round((height * (0.35 + s * 0.65)) / g));
      for (let y = 0; y < h; y++) for (let Z = 0; Z < 3; Z++) {
        const snow = y > h * 0.55 + Math.sin(X * 0.3) * 1.5 || y === h - 1;
        v.set(x, y, Z, jit(r, snow ? 0xf4f8fc : rock, 0.05));
      }
    }
    group.add(voxMesh(v, g, -300, 0, z));
  }
  function shrine(group, x, z, rnd) {                   // an old shrine stepping up the slope, snow on every step
    const v = new Vox(), r = mulberry32(x | 0);
    for (let t = 0; t < 6; t++) {
      const w = 22 - t * 3, y0 = t * 5;
      for (let X = -w; X <= w; X++) for (let y = y0; y < y0 + 5; y++) for (let Z = -8 + t; Z <= 8 - t; Z++)
        v.set(X, y, Z, y === y0 + 4 ? 0xf4f8fc : ((X * 7 + y * 3) % 11 === 0 ? 0x4ab87a : jit(r, (y & 1) ? 0xbcb29c : 0xb0a690, 0.04)));
    }
    v.box(-3, 0, 9, 3, 10, 9, 0x2a2228);
    for (const X of [-12, 12]) { v.box(X - 1, 0, 10, X + 1, 22, 12, 0xc4baa4); v.box(X - 2, 23, 9, X + 2, 24, 13, 0xf4f8fc); }
    group.add(voxMesh(v, 0.5, x, 0, z));
  }
  const SUITS = [                                       // the four suits, 7x7
    [0x08, 0x1c, 0x3e, 0x7f, 0x3e, 0x1c, 0x08],
    [0x36, 0x7f, 0x7f, 0x7f, 0x3e, 0x1c, 0x08],
    [0x08, 0x1c, 0x3e, 0x7f, 0x7f, 0x2a, 0x1c],
    [0x1c, 0x1c, 0x6b, 0x7f, 0x6b, 0x08, 0x1c]];
  function casinos(group, W, z, rnd, k) {               // a street of casinos and clubs, every one lit
    k = k || 1;
    const NEON = [0xff5ac8, 0x7ad8ff, 0xffd060, 0xa070ff, 0xff7a5a];
    let x = -60;
    while (x < W + 60) {
      const v = new Vox(), gl = new Vox(), r = mulberry32((x * 3 + z) | 0);
      let X = 0;
      for (let b = 0; b < 6 && X < 300; b++) {
        const bw = 11 + Math.floor(r() * 12), bh = 16 + Math.floor(r() * 32), neon = NEON[Math.floor(r() * NEON.length)], body = r() < 0.5 ? 0x2a2236 : 0x221c2e;
        for (let i = 0; i < bw; i++) for (let y = 0; y < bh; y++) v.set(X + i, y, 0, body);
        for (let i = 2; i < bw - 2; i += 2) for (let y = 11; y < bh - 3; y += 3) if (r() < 0.45) gl.set(X + i, y, 1, r() < 0.7 ? 0xffe6a0 : 0xfff6e0);
        for (let i = 0; i < bw; i++) gl.set(X + i, bh, 1, neon);
        for (let y = 0; y < bh; y++) { gl.set(X, y, 1, neon); gl.set(X + bw - 1, y, 1, neon); }
        for (let i = 1; i < bw - 1; i += 2) gl.set(X + i, 6, 1, (i >> 1) & 1 ? 0xfff0a0 : 0xffffff);      // the marquee
        if (bh > 24) { const S = SUITS[Math.floor(r() * 4)], sx = X + (bw >> 1) - 3, sy = bh - 11, sc = NEON[Math.floor(r() * NEON.length)];
          for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) if ((S[j] >> (6 - i)) & 1) gl.set(sx + i, sy + 6 - j, 2, sc); }
        X += bw + 1 + Math.floor(r() * 3);
      }
      group.add(voxMesh(v, 0.8 * k, x, 0, z)); group.add(voxMesh(gl, 0.8 * k, x, 0, z, materials().glow));
      x += X * 0.8 * k;
    }
  }
  function searchlight(group, x, z, rnd) {              // a searchlight's beam, swinging across the sky
    const geo = new THREE.ConeGeometry(5, 150, 16, 1, true); geo.translate(0, -75, 0);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xe8e0ff, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    m.position.set(x, 0, z); m.rotation.z = PI; group.add(m);
    const ph = rnd() * 6;
    return t => { m.rotation.z = PI + Math.sin(t * 0.35 + ph) * 0.55; };
  }
  function clubFront(group, x, z) {                     // her club: black and gold, and a great neon heart over the door
    const v = new Vox(), gl = new Vox();
    v.box(-30, 0, 0, 30, 46, 4, 0x1e1626); v.box(-8, 0, 5, 8, 12, 5, 0x0e0a14); v.box(-12, 13, 5, 12, 14, 9, 0xb01e3a);
    for (let X = -30; X <= 30; X += 2) gl.set(X, 46, 5, 0xe8c050);
    for (let y = -12; y <= 12; y++) for (let X = -13; X <= 13; X++) {
      const a = X / 11, b = (y + 1) / 11, k = a * a + b * b - 1, a2 = X / 9, b2 = (y + 1) / 9, k2 = a2 * a2 + b2 * b2 - 1;
      if (k * k * k - a * a * b * b * b <= 0 && !(k2 * k2 * k2 - a2 * a2 * b2 * b2 * b2 <= 0)) gl.set(X, 30 + y, 6, 0xff4aa8);
    }
    group.add(voxMesh(v, 0.5, x, 0, z)); group.add(voxMesh(gl, 0.5, x, 0, z, materials().glow));
    const s = new THREE.Sprite(glowMat(0xff4aa8, 0.6)); s.scale.set(22, 22, 1); s.position.set(x, 15, z + 4); group.add(s);
  }
  function skyline(group, W, z, color, lit, maxH, g) {  // towers against the sunset, a few windows lit
    let x = -150;
    while (x < W + 150) {
      const v = new Vox(), gl = new Vox(), r = mulberry32((x * 7 + z) | 0);
      let X = 0;
      while (X < 200) {
        const bw = 6 + Math.floor(r() * 14), bh = Math.round((maxH * (0.3 + r() * 0.7)) / g);
        for (let i = 0; i < bw; i++) for (let y = 0; y < bh; y++) v.set(X + i, y, 0, color);
        if (r() < 0.3) v.box(X + (bw >> 1), bh, 0, X + (bw >> 1), bh + 4, 0, color);
        for (let i = 1; i < bw - 1; i += 2) for (let y = 2; y < bh - 1; y += 2) if (r() < lit * 0.35) gl.set(X + i, y, 1, r() < 0.5 ? 0xffd890 : 0xffb070);
        X += bw + Math.floor(r() * 3);
      }
      group.add(voxMesh(v, g, x, 0, z)); if (gl.m.size) group.add(voxMesh(gl, g, x, 0, z, materials().glow));
      x += X * g;
    }
  }
  function overpass(group, W, z) {                      // a raised road behind, on pillars, lamps along it
    for (let x0 = -60; x0 < W + 60; x0 += 120) {
      const v = new Vox();
      for (let X = 0; X < 120; X++) { v.box(X, 12, 0, X, 13, 7, 0xa8a29a); v.set(X, 14, 0, 0x8a847e); v.set(X, 14, 7, 0x8a847e); if (X % 22 === 0) v.box(X, 0, 2, X + 1, 11, 4, 0x9a948e); }
      group.add(voxMesh(v, 1, x0, 0, z - 3.5));
    }
    for (let x = 0; x < W; x += 30) { const s = new THREE.Sprite(glowMat(0xffd8a0, 0.7)); s.scale.set(3, 3, 1); s.position.set(x, 16, z + 0.2); group.add(s); }
  }
  function traffic(group, W, z) {                       // the traffic on it: headlights one way, tail lights the other
    const cars = [];
    for (let k = 0; k < 12; k++) {
      const dir = k % 2 ? 1 : -1, v = new Vox(), C = [0x2a3a5a, 0x5a2a2a, 0xd8d8d8, 0x3a3a40][k % 4];
      v.box(0, 0, 0, 15, 4, 6, C); v.box(3, 5, 1, 11, 7, 5, mulC(C, 0.8));
      const m = voxMesh(v, 0.25, 0, 13.5, z + (dir > 0 ? -2 : 1)); group.add(m);
      const s = new THREE.Sprite(glowMat(dir > 0 ? 0xfff0c0 : 0xff4030, 0.9)); s.scale.set(1.4, 1.4, 1); group.add(s);
      cars.push({ m, s, dir, off: k * 97 % (W + 200), sp: 14 + (k * 7) % 9 });
    }
    return t => { for (const c of cars) { const x = ((c.off + t * c.sp * c.dir) % (W + 200) + (W + 200)) % (W + 200) - 100; c.m.position.x = x; c.s.position.set(x + (c.dir > 0 ? 4 : 0), 14.2, c.m.position.z + 1.6); } };
  }
  /* ---- the second seven's backdrops */
  function disc(group, x, y, z, r, color, glow) {       // the sun or the moon, and its glow
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 40), new THREE.MeshBasicMaterial({ color, fog: false })); m.position.set(x, y, z); group.add(m);
    const s = new THREE.Sprite(glowMat(glow, 0.6)); s.scale.set(r * 5, r * 5, 1); s.position.set(x, y, z + 1); group.add(s);
  }
  function museumWall(group, W, base, z) {             // the far wall: cream stone, arched windows full of daylight, banners
    for (let x0 = -60; x0 < W + 60; x0 += 120) {
      const v = new Vox(), gl = new Vox();
      for (let X = 0; X < 120; X++) {
        const wx = (((X + x0) % 30) + 30) % 30;
        for (let y = 0; y < 40; y++) {
          const top = 26 + (wx >= 13 && wx <= 17 ? 2 : 0) + (wx === 15 ? 1 : 0);
          if (wx >= 11 && wx <= 19 && y >= 8 && y <= top) { gl.set(X, y, 0, (y % 6 === 0 || wx === 15) ? 0xa89a82 : ((wx + y) % 7 === 0 ? 0xffffff : 0xd8eef8)); continue; }
          v.set(X, y, 0, y < 2 ? 0xb8a888 : y > 36 ? 0xd8c8a8 : (wx <= 2 || wx >= 28) ? 0xf2eadc : y === 31 ? 0xc8b48c : 0xe8dcc4);
        }
        if (wx === 5 || wx === 6 || wx === 24 || wx === 25) for (let y = 13; y < 28; y++) v.set(X, y, 1, y > 25 ? 0xd8b050 : ((X + x0) % 60 + 60) % 60 < 30 ? 0xf08a3a : 0x5aa0e0);
      }
      group.add(voxMesh(v, 1, x0, base, z)); group.add(voxMesh(gl, 1, x0, base, z, materials().glow));
    }
  }
  function skeleton(group, x, base, z, kind) {         // a dinosaur's skeleton on its plinth: a long-neck, or a tyrant
    const v = new Vox(), B = 0xf2ead6, D = 0xc8bc9c;
    v.box(-15, 0, -4, 15, 2, 4, 0x6a3e22); v.box(-14, 3, -3, 14, 3, 3, 0xd8b050);
    const ribs = (s, y, n) => { for (let r = 1; r < n; r++) { v.set(s, y - r, -2, B); v.set(s, y - r, 2, B); } v.set(s, y - n, -1, D); v.set(s, y - n, 1, D); };
    if (kind) {                                          // the long-neck: four legs, the neck going up and up
      for (const lx of [-7, -4, 5, 8]) { v.box(lx, 4, -2, lx, 12, -2, B); v.box(lx, 4, 2, lx, 12, 2, B); }
      for (let sx = -24; sx <= 22; sx++) {
        const y = Math.round(sx < 0 ? 15 + sx * 0.4 : sx < 8 ? 15 + sx * 0.12 : 16 + (sx - 8) * 1.25);
        v.set(sx, y, 0, B); if (sx >= -8 && sx <= 8 && !(sx & 1)) ribs(sx, y, 5);
      }
      v.box(21, 34, -1, 25, 36, 1, B); v.set(24, 35, 2, 0x3a3020);
    } else {                                             // the tyrant: two great legs, little arms, the skull
      for (const [lx, z0] of [[-2, -2], [3, 2]]) { for (let y = 4; y < 15; y++) v.set(lx + Math.round((y - 4) * 0.25), y, z0, B); v.box(lx - 1, 4, z0, lx + 3, 4, z0, B); }
      for (let sx = -22; sx <= 10; sx++) {
        const y = Math.round(sx < 0 ? 17 + sx * 0.3 : 17 + sx * 0.35);
        v.set(sx, y, 0, B); if (sx >= -6 && sx <= 8 && !(sx & 1)) ribs(sx, y, 5);
      }
      v.box(10, 20, -2, 18, 25, 2, B); v.box(11, 17, -1, 18, 19, 1, D); v.set(15, 23, 3, 0x3a3020); v.set(15, 23, -3, 0x3a3020);
      for (let x2 = 11; x2 <= 18; x2 += 2) v.set(x2, 19, 2, 0xffffff);
      v.box(8, 13, 2, 9, 14, 2, B); v.box(9, 12, 2, 9, 12, 2, B);
    }
    group.add(voxMesh(v, 0.5, x, base, z));
  }
  function displayCases(group, x, base, z) {          // glass cases on dark wood, a fossil in each
    const v = new Vox(), gl = new Vox();
    for (let c = 0; c < 3; c++) {
      const cx = c * 9;
      v.box(cx, 0, 0, cx + 7, 6, 4, 0x6a3e22); v.box(cx, 7, 0, cx + 7, 7, 4, 0xd8b050);
      for (let X = cx; X <= cx + 7; X++) for (let y = 8; y <= 13; y++) gl.set(X, y, 0, (X + y) % 5 === 0 ? 0xffffff : 0xcfe8f0);
      v.box(cx, 14, 0, cx + 7, 14, 4, 0x6a3e22); v.box(cx, 8, 4, cx, 13, 4, 0xd8b050); v.box(cx + 7, 8, 4, cx + 7, 13, 4, 0xd8b050);
      const f = [0xd8c8a0, 0xe8a070, 0xb8c8d8][c];       // an ammonite, a trilobite, a bone
      v.box(cx + 2, 8, 2, cx + 5, 10, 2, f); v.box(cx + 3, 11, 2, cx + 4, 11, 2, f);
    }
    group.add(voxMesh(v, 0.5, x, base, z)); group.add(voxMesh(gl, 0.5, x, base, z, materials().glow));
  }
  function whale(group, x, y, z, top) {                // a whale's skeleton, hung from the ceiling on wires
    const v = new Vox(), B = 0xf2ead6, wire = Math.round(((top || y + 17) - y) / 0.5);
    for (let sx = 0; sx < 60; sx++) {
      const yy = Math.round(Math.sin(sx / 60 * PI) * 3); v.set(sx, yy, 0, B);
      if (sx > 12 && sx < 42 && sx % 3 === 0) for (let r = 1; r < 6 - Math.abs(sx - 27) / 6; r++) { v.set(sx, yy - r, -2, B); v.set(sx, yy - r, 2, B); }
    }
    v.box(0, -3, -2, 9, 1, 2, B); v.box(52, -1, -4, 58, 0, 4, B);
    for (const sx of [14, 44]) v.box(sx, 2, 0, sx, wire, 0, 0x8a8a8a);
    group.add(voxMesh(v, 0.5, x, y, z));
  }
  function waterfall(group, x, z, h) {                 // a waterfall over the cliff's lip, foaming at its foot
    const v = new Vox();
    h = Math.round(h);
    for (let X = -1; X < 5; X++) v.set(X, h, -1, 0x7ad0e0);                                // over the edge
    for (let y = 0; y < h; y++) for (let X = 0; X < 4; X++) v.set(X, y, 0, (X + y * 2) % 5 === 0 ? 0xffffff : (X === 0 || X === 3) ? 0x7ad0e0 : 0xb8ecf6);
    for (let X = -2; X < 6; X++) v.set(X, 0, 1, 0xffffff);
    group.add(voxMesh(v, 1, x, 0, z, materials().glow));
  }
  function shrineSteps(group, x, z) {                  // the old shrine: stone steps up to it, a red gate at their foot
    const v = new Vox();
    for (let k = 0; k < 18; k++) v.box(k * 2, 0, 0, k * 2 + 1, k, 6, k % 2 ? 0x7a827c : 0x8a928c);
    const tx = 37, ty = 18;
    v.box(tx, 0, 0, tx + 15, ty, 6, 0x6a726c);
    for (const px of [tx + 2, tx + 13]) v.box(px, ty + 1, 1, px, ty + 7, 1, 0xc83a2a);
    v.box(tx + 3, ty + 1, 2, tx + 12, ty + 6, 5, 0x6a4a32); v.box(tx + 6, ty + 1, 1, tx + 9, ty + 4, 1, 0xffd890);
    for (let k = 0; k < 4; k++) v.box(tx - 2 + k * 2, ty + 8 + k, 0, tx + 17 - k * 2, ty + 8 + k, 6, k ? 0x2a3040 : 0x3a4252);
    for (const px of [-5, 5]) v.box(px, 0, 3, px, 11, 3, 0xc83a2a);
    v.box(-7, 11, 3, 7, 11, 3, 0xc83a2a); v.box(-8, 12, 3, 8, 12, 3, 0x2a2a2a); v.box(-6, 9, 3, 6, 9, 3, 0xc83a2a);
    group.add(voxMesh(v, 1, x, -0.3, z));
  }
  function fireflies(group, W, rnd) {                  // fireflies over the water, blinking
    const fl = [];
    for (let k = 0; k < Math.round(W / 8); k++) {
      const s = new THREE.Sprite(glowMat(0xc8ff90, 0.8)); s.scale.set(0.6, 0.6, 1); group.add(s);
      fl.push({ s, x: rnd() * W, y: 1 + rnd() * 9, z: -4 - rnd() * 22, p: rnd() * 10 });
    }
    return t => { for (const f of fl) { f.s.position.set(f.x + Math.sin(t * 0.5 + f.p) * 2, f.y + Math.sin(t * 0.8 + f.p * 2), f.z); f.s.material.opacity = 0.45 + 0.45 * Math.sin(t * 3 + f.p); } };
  }
  function butte(group, x, z, h, rnd) {                // a butte standing alone, red rock in bands
    const v = new Vox(), w = 5 + Math.floor(rnd() * 5);
    for (let y = 0; y < h; y++) {
      const ww = w - Math.max(0, y - h + 3);
      for (let X = -ww; X <= ww; X++) for (let Z = -3; Z <= 3; Z++) v.set(X, y, Z, y % 5 < 2 ? 0xb8603a : y % 5 === 4 ? 0xe8a070 : 0xd07a4a);
    }
    group.add(voxMesh(v, 1.5, x, 0, z));
  }
  function brokenBlocks(group, W, z, rnd) {            // the near ruins: towers broken off, girders bent out of them
    for (let x0 = -60; x0 < W + 60; x0 += 100) {
      const v = new Vox(), gl = new Vox(); let X = 0;
      while (X < 100) {
        const bw = 6 + Math.floor(rnd() * 10), bh = 8 + Math.floor(rnd() * 22);
        for (let i = 0; i < bw; i++) {
          const top = bh - Math.floor(Math.abs(Math.sin(i * 1.7 + bh)) * 5);
          for (let y = 0; y < top; y++) for (let Z = 0; Z < 3; Z++) v.set(X + i, y, Z, (y % 4 === 0 || i % 4 === 0) ? 0x2e2426 : 0x3a3032);
          for (let y = 2; y < top - 1; y += 3) if (i % 3 === 1 && rnd() < 0.25) gl.set(X + i, y, 3, rnd() < 0.5 ? 0xff7a30 : 0xffb050);
        }
        if (rnd() < 0.5) for (let k = 0; k < 6; k++) v.set(X + bw - 1 + k, bh - 3 + (k >> 1), 1, 0x8a4a2a);
        X += bw + 2 + Math.floor(rnd() * 4);
      }
      group.add(voxMesh(v, 1, x0, 0, z)); group.add(voxMesh(gl, 1, x0, 0, z, materials().glow));
    }
  }
  function fires(group, W, rnd) {                      // the fires burning in the city, flickering
    const fl = [];
    for (let k = 0; k < Math.round(W / 14); k++) {
      const s = new THREE.Sprite(glowMat(rnd() < 0.5 ? 0xff7a30 : 0xffa040, 0.8)); group.add(s);
      fl.push({ s, x: rnd() * (W + 100) - 50, y: 3 + rnd() * 22, z: -70 - rnd() * 90, r: 5 + rnd() * 9, p: rnd() * 10 });
    }
    return t => { for (const f of fl) { const k = 1 + Math.sin(t * 7 + f.p) * 0.12 + Math.sin(t * 13 + f.p * 3) * 0.08; f.s.scale.set(f.r * k, f.r * k * 1.2, 1); f.s.position.set(f.x, f.y, f.z); } };
  }

  /* ---- what the backdrops stand on, and what stands on them */
  /** The height of a band() at world x: its ground's top there. */
  function bandAt(grain, base, amp, freq, seed) {
    return wx => { const x = Math.floor((wx + 60) / grain), X = x * grain - 60;
      return Math.max(1, Math.round((base + Math.sin(X * freq + seed) * amp + Math.sin(X * freq * 2.7 + seed * 2) * amp * 0.4) / grain)) * grain; };
  }
  function seaStack(group, x, z, h, rnd, T) {           // a rock standing in the bay, banded chalk, turf on top
    const v = new Vox(), w = 2 + Math.floor(rnd() * 3);
    for (let y = 0; y < h; y++) {
      const ww = w + (y < 2 ? 1 : 0);
      for (let X = -ww; X <= ww; X++) for (let Z = -2; Z <= 2; Z++)
        v.set(X, y, Z, y === h - 1 ? 0x5ea04a : y === h - 2 && (X + Z) % 2 ? 0x4a8a3a : (y % 3 === 1) ? 0xcabfa4 : 0xe8e0cc);
    }
    const top = h * 1.5 - 0.5;
    group.add(voxMesh(v, 1.5, x, -0.5, z));
    const palm = new THREE.Mesh(propGeo("tree", T), materials().vox);
    palm.position.set(x - 0.6, top, z); palm.scale.setScalar(1.4 + rnd() * 0.4); group.add(palm);
  }
  function lighthouse(group, x, y, z) {                 // a lighthouse on the headland's turf, its lamp lit
    const v = new Vox();
    for (let k = 0; k < 22; k++) { const r = k < 2 ? 3 : 2; for (let X = -r; X <= r; X++) for (let Z = -r; Z <= r; Z++) if (X * X + Z * Z <= r * r + 1) v.set(X, k, Z, k < 2 ? 0xb0a890 : (k >> 2) % 2 ? 0xe03a30 : 0xfaf8f0); }
    v.box(-3, 22, -3, 3, 22, 3, 0x3a3a42); v.box(-1, 23, -1, 1, 24, 1, 0xfff2b0); v.box(-2, 25, -2, 2, 25, 2, 0xe03a30);
    group.add(voxMesh(v, 1, x, y, z));
    const s = new THREE.Sprite(glowMat(0xfff2b0, 0.85)); s.scale.set(10, 10, 1); s.position.set(x, y + 24, z + 2); group.add(s);
  }
  function oak(group, x, y, z, k, rnd) {                // a broad tree on its trunk
    const v = new Vox(), r = 3 + Math.floor(rnd() * 2);
    v.box(0, 0, 0, 0, 4, 0, 0x6a4a2e);
    for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) for (let c = -r; c <= r; c++)
      if (Math.hypot(a, b * 1.15, c) <= r + 0.3) v.set(a, 5 + r + b, c, (a + b * 2 + c) % 5 === 0 ? 0x4a8a3a : 0x5aa046);
    group.add(voxMesh(v, 0.5 * k, x, y, z));
  }
  function fuelTank(group, x, z) {                      // a fuel tank on its footing, a ladder up its side
    const v = new Vox();
    v.box(-5, 0, -5, 5, 0, 5, 0x8a8a86);
    for (let y = 1; y < 9; y++) for (let X = -4; X <= 4; X++) for (let Z = -4; Z <= 4; Z++) if (X * X + Z * Z <= 17) v.set(X, y, Z, y === 8 ? 0xd8d8d2 : y === 4 ? 0x3a6ad0 : 0xf2f0e8);
    for (let y = 1; y < 9; y++) v.set(5, y, 0, 0x5a5a5a);
    group.add(voxMesh(v, 0.6, x, 0, z));
  }
  function beacon(group, x, z) {                        // a stone beacon on the snow, the light that does not go out on top
    const v = new Vox();
    for (let y = 0; y < 30; y++) { const r = y < 3 ? 4 : y > 26 ? 3 : 2; for (let X = -r; X <= r; X++) for (let Z = -r; Z <= r; Z++) v.set(X, y, Z, y % 6 === 0 ? 0x8a8478 : (y > 26 ? 0xf4f8fc : 0xa8a090)); }
    group.add(voxMesh(v, 1.4, x, 0, z));
    const s = new THREE.Sprite(glowMat(0x6af0a0, 0.9)); s.scale.set(22, 22, 1); s.position.set(x, 30 * 1.4 + 3, z + 2); group.add(s);
  }
  function rubble(group, W, z, rnd) {                    // heaps of broken concrete on the ground, rebar out of them, a wall still standing
    for (let x0 = -60; x0 < W + 60; x0 += 80) {
      const v = new Vox();
      for (let k = 0; k < 6; k++) {
        const cx = Math.floor(rnd() * 80), r = 3 + Math.floor(rnd() * 4);
        for (let a = -r; a <= r; a++) for (let c = -2; c <= 2; c++) {
          const h = Math.max(0, Math.round((r - Math.abs(a)) * 0.8 + rnd() * 1.5));
          for (let y = 0; y < h; y++) v.set(cx + a, y, c, (a * 3 + y * 5 + c) % 7 === 0 ? 0x2a2224 : y === h - 1 ? 0x5a5052 : 0x463c3e);
        }
        if (rnd() < 0.7) for (let y = 0; y < r + 3; y++) v.set(cx + 1 + (y >> 2), y + 1, 0, 0x8a4a2a);
        if (rnd() < 0.35) { const ww = 4 + Math.floor(rnd() * 5), hh = 6 + Math.floor(rnd() * 8);
          for (let a = 0; a < ww; a++) for (let y = 0; y < hh - (a % 3 ? 0 : 2); y++) v.set(cx + r + a, y, 2, (y % 4 === 0) ? 0x2e2426 : 0x3a3032); }
      }
      group.add(voxMesh(v, 1, x0, 0, z));
    }
  }
  /* a hall's roof, seen from below: beams across it front to back, and lit panes (skylights, or lamps) between */
  function hallCeiling(group, W, y, z0, z1, col, beam, light) {
    for (let x0 = -60; x0 < W + 60; x0 += 120) {
      const v = new Vox(), gl = new Vox(), d = Math.round(z0 - z1);
      for (let X = 0; X < 120; X++) for (let Z = 0; Z < d; Z++) {
        v.set(X, 1, Z, col);
        if (X % 12 === 0) v.set(X, 0, Z, beam);
        else if (X % 12 > 3 && X % 12 < 9 && Z % 10 > 2 && Z % 10 < 8) gl.set(X, 0.5 | 0, Z, light);
      }
      for (let X = 0; X < 120; X++) v.set(X, 0, 0, beam);
      group.add(voxMesh(v, 1, x0, y, z1)); group.add(voxMesh(gl, 1, x0, y, z1, materials().glow));
    }
  }
  function depotWall(group, W, base, z) {              // the depot's far wall: steel, ribbed, a hazard stripe along its foot
    for (let x0 = -60; x0 < W + 60; x0 += 120) {
      const v = new Vox();
      for (let X = 0; X < 120; X++) for (let y = 0; y < 32; y++)
        v.set(X, y, 0, y < 2 ? (((X >> 1) & 1) ? 0xf2c030 : 0x2a2a30) : X % 12 === 0 ? 0x4a525c : y % 8 === 0 ? 0x3e464e : 0x343c44);
      for (let X = 3; X < 120; X += 40) for (let y = 14; y < 26; y++) for (let i = 0; i < 6; i++) v.set(X + i, y, 1, y > 23 || i === 0 || i === 5 ? 0x6a2a20 : 0xc83a2a);   // banners
      group.add(voxMesh(v, 1, x0, base, z));
    }
  }
  function rack(group, x, base, z, rnd) {              // a storage rack, three shelves high, crates on every one
    const v = new Vox();
    for (const px of [0, 15]) v.box(px, 0, 0, px, 23, 0, 0xe86a20), v.box(px, 0, 4, px, 23, 4, 0xe86a20);
    for (const y of [0, 8, 16]) {
      v.box(0, y + 7, 0, 15, y + 7, 4, 0x2e66b0);
      for (let c = 0; c < 3; c++) if (rnd() < 0.85) {
        const cx = 1 + c * 5, h = 4 + Math.floor(rnd() * 3), col = rnd() < 0.6 ? 0xb07e40 : 0x7a8696;
        v.box(cx, y + 7 - h, 1, cx + 3, y + 6, 3, col); v.box(cx, y + 6, 3, cx + 3, y + 6, 3, mulC(col, 0.75));
      }
    }
    group.add(voxMesh(v, 0.5, x, base, z));
  }
  function hangLamp(group, x, y, z, top) {             // a lamp hanging on its chain from the roof, lit
    const v = new Vox();
    v.box(0, 1, 0, 0, top ? Math.round((top - y) / 0.25) : 14, 0, 0x5a5a62); v.box(-2, 0, -2, 2, 0, 2, 0x3a3a42); v.box(-1, -1, -1, 1, -1, 1, 0xfff2c8);
    group.add(voxMesh(v, 0.25, x, y, z));
    const s = new THREE.Sprite(glowMat(0xfff0c8, 0.5)); s.scale.set(4, 4, 1); s.position.set(x, y - 0.3, z + 0.2); group.add(s);
  }
  function nebula(group, W) {                          // the glow of a nebula across the sky
    for (let k = 0; k < 6; k++) {
      const s = new THREE.Sprite(glowMat([0x7a3ad8, 0x3a7ad8, 0xd83a9a][k % 3], 0.35)); s.scale.set(220, 120, 1);
      s.position.set((W + 200) * k / 6 - 100, 60 + (k % 2) * 30, -310); group.add(s);
    }
  }
  function ringedPlanet(group, x, y, z) {              // a ringed planet, far off
    const m = new THREE.Mesh(new THREE.CircleGeometry(30, 48), new THREE.MeshBasicMaterial({ color: 0xd89a6a, fog: false })); m.position.set(x, y, z); group.add(m);
    const sh = new THREE.Mesh(new THREE.CircleGeometry(30, 48, -PI * 0.15, PI), new THREE.MeshBasicMaterial({ color: 0x8a5a3a, fog: false })); sh.position.set(x, y, z + 0.2); group.add(sh);
    const ring = new THREE.Mesh(new THREE.RingGeometry(38, 50, 64), new THREE.MeshBasicMaterial({ color: 0xe8d0a8, fog: false, side: THREE.DoubleSide, transparent: true, opacity: 0.8 }));
    ring.position.set(x, y, z + 0.5); ring.scale.y = 0.28; ring.rotation.z = 0.25; group.add(ring);
  }
  function trackRibbon(group, x, z, rnd) {             // the track's far turns: a ribbon of light up on pylons from the ground
    const v = new Vox(), gl = new Vox(), y0 = 8 + Math.floor(rnd() * 14);
    for (let X = 0; X < 160; X++) {
      const y = y0 + Math.round(Math.sin(X * 0.04) * 6);
      gl.set(X, y, 0, X % 6 < 3 ? 0x7ad8ff : 0xffffff); v.set(X, y - 1, 0, 0x2a2a44);
      if (X % 20 === 10) for (let k = 0; k < y - 1; k++) { v.set(X, k, 0, k % 4 === 0 ? 0x5a5a7a : 0x44445e); v.set(X + 1, k, 0, 0x3a3a52); }
    }
    group.add(voxMesh(v, 1, x, 0, z)); group.add(voxMesh(gl, 1, x, 0, z, materials().glow));
  }
  function grandstand(group, x, z, rnd) {              // a grandstand on the ground by the course, every seat lit
    const v = new Vox(), gl = new Vox();
    for (let k = 0; k < 8; k++) for (let X = k; X < 36 - k; X++) {
      for (let y = 0; y <= k; y++) v.set(X, y, k, y === k ? 0x3a3a52 : 0x2a2a3c);
      if (rnd() < 0.6) gl.set(X, k + 1, k, [0xff5ac8, 0x7ad8ff, 0xf2d040, 0xffffff][Math.floor(rnd() * 4)]);
    }
    for (const X of [0, 35]) for (let y = 0; y < 14; y++) v.set(X, y, 8, 0x5a5a7a);
    for (let X = 0; X < 36; X++) v.set(X, 14, 8, 0x7ad8ff);
    group.add(voxMesh(v, 0.5, x, 0, z)); group.add(voxMesh(gl, 0.5, x, 0, z, materials().glow));
  }
  /* the little world under the course: craters and loose rocks on its grey ground */
  function craters(group, W, rnd) {
    for (let x0 = -60; x0 < W + 60; x0 += 120) {
      const v = new Vox();
      for (let k = 0; k < 14; k++) {
        const cx = Math.floor(rnd() * 120), cz = -Math.floor(rnd() * 90), r = 2 + Math.floor(rnd() * 5);
        for (let a = -r - 1; a <= r + 1; a++) for (let b = -r - 1; b <= r + 1; b++) {
          const d = Math.hypot(a, b);
          if (d > r - 0.5 && d <= r + 1) v.set(cx + a, 0, cz + b, 0x5a5476);              // its rim
          else if (d <= r - 0.5) v.set(cx + a, -1, cz + b, 0x26233a);                   // and its floor, sunk
        }
      }
      for (let k = 0; k < 26; k++) { const rx = Math.floor(rnd() * 120), rz = -Math.floor(rnd() * 90), h = 1 + Math.floor(rnd() * 3);
        for (let y = 0; y < h; y++) v.box(rx, y, rz, rx + h - y, y, rz + 1, y === h - 1 ? 0x6a6488 : 0x4e4a66); }
      group.add(voxMesh(v, 1, x0, 0.02, -8));
    }
  }

  function worldBelow(group, W) {                      // the world, turning far below the station's windows
    const c = document.createElement("canvas"); c.width = 256; c.height = 128;
    const g = c.getContext("2d"), r = mulberry32(77);
    g.fillStyle = "#2a6ad0"; g.fillRect(0, 0, 256, 128);
    for (let k = 0; k < 26; k++) { g.fillStyle = r() < 0.6 ? "#4a9a4a" : "#b89a5a"; g.beginPath(); g.ellipse(r() * 256, 20 + r() * 88, 8 + r() * 26, 5 + r() * 14, r() * PI, 0, PI * 2); g.fill(); }
    for (let k = 0; k < 40; k++) { g.fillStyle = "rgba(255,255,255,.75)"; g.beginPath(); g.ellipse(r() * 256, r() * 128, 6 + r() * 20, 2 + r() * 4, 0, 0, PI * 2); g.fill(); }
    const tex = new THREE.CanvasTexture(c); tex.wrapS = THREE.RepeatWrapping;
    const m = new THREE.Mesh(new THREE.SphereGeometry(260, 48, 24), new THREE.MeshBasicMaterial({ map: tex, fog: false }));
    m.position.set(W / 2, -250, -420); group.add(m);
    const s = new THREE.Sprite(glowMat(0x6ab0ff, 0.5)); s.scale.set(800, 160, 1); s.position.set(W / 2, 6, -300); group.add(s);
    return t => { m.rotation.y = t * 0.01; };
  }
  function stationWall(group, W, base, z) {            // the station's inner wall: plating, great windows, pipes along it
    for (let x0 = -60; x0 < W + 60; x0 += 120) {
      const v = new Vox(), gl = new Vox();
      for (let X = 0; X < 120; X++) {
        const wx = (((X + x0) % 40) + 40) % 40;
        for (let y = 0; y < 34; y++) {
          if (wx >= 8 && wx <= 32 && y >= 6 && y <= 24) { if (wx === 8 || wx === 32 || y === 6 || y === 24 || wx === 20) v.set(X, y, 1, 0x4a505a); continue; }   // a window
          v.set(X, y, 0, y === 3 || y === 28 ? 0x5a606a : X % 10 === 0 ? 0x6a707a : 0x7e848e);
        }
        v.set(X, 27, 2, 0x9a6a3a); v.set(X, 29, 2, 0x5a8a9a);                                   // pipes
        if (wx === 2) for (let y = 8; y < 22; y++) gl.set(X, y, 1, y % 4 === 0 ? 0xffd040 : 0x2a2a30);   // a lit strip
      }
      group.add(voxMesh(v, 1, x0, base, z)); group.add(voxMesh(gl, 1, x0, base, z, materials().glow));
    }
  }
  function warnLights(group, W, base, z) {             // warning lights over the doors, going round
    const ls = [];
    for (let x = 20; x < W; x += 40) { const s = new THREE.Sprite(glowMat(0xff3a2a, 0.8)); s.scale.set(3, 3, 1); s.position.set(x, base + 30, z); group.add(s); ls.push(s); }
    return t => { ls.forEach((s, k) => { s.material.opacity = 0.2 + 0.7 * Math.max(0, Math.sin(t * 4 + k)); }); };
  }
  function torii(group, x, z) {                       // a red gate out on a rock in the sea
    const v = new Vox(), r = mulberry32(x | 0);
    for (let y = 0; y < 5; y++) { const w = 7 - Math.floor(y / 2); v.box(-w, y, -4, w, y, 4, jit(r, y === 4 ? 0x7a7468 : 0x8a8478, 0.06)); }
    for (const px of [-4, 3]) v.box(px, 5, -1, px + 1, 19, 0, 0xd8402e);
    v.box(-6, 15, -1, 6, 15, 0, 0xd8402e);                          // the tie beam
    v.box(-7, 19, -1, 7, 20, 0, 0xd8402e); v.box(-8, 21, -1, 8, 21, 0, 0x2a2a30);
    v.set(-9, 22, -1, 0x2a2a30); v.set(9, 22, -1, 0x2a2a30); v.set(-9, 22, 0, 0x2a2a30); v.set(9, 22, 0, 0x2a2a30);
    v.box(0, 16, -1, 0, 18, 0, 0xd8402e);
    const m = new THREE.Mesh(meshVox(v, 0.5), materials().vox); m.position.set(x, -0.8, z); group.add(m);
  }
  let GLOW_TEX = null;
  function glowMat(color, op) {
    if (!GLOW_TEX) {
      const c = document.createElement("canvas"); c.width = c.height = 64;
      const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,.45)"); gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      GLOW_TEX = new THREE.CanvasTexture(c);
    }
    return new THREE.SpriteMaterial({ map: GLOW_TEX, color, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending });
  }
  function skyTexture(T) {
    const c = document.createElement("canvas"); c.width = 2; c.height = 256;
    const g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 256);
    const hex = n => "#" + n.toString(16).padStart(6, "0");
    gr.addColorStop(0, hex(T.sky[0])); gr.addColorStop(0.75, hex(T.sky[1])); gr.addColorStop(1, hex(T.sky[1]));
    g.fillStyle = gr; g.fillRect(0, 0, 2, 256);
    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.LinearFilter;
    return t;
  }

  // ---------------------------------------------------------------- sound
  /* Little synthesised effects, at the game's own sfx volume. The music is Sound's. */
  let AC = null;
  function sfxVol() { try { const v = root.Settings && Settings.get("sfxVolume"); return v == null ? 0.7 : v; } catch (e) { return 0.7; } }
  function tone(f0, f1, dur, type, vol, delay) {
    try {
      AC = AC || new (root.AudioContext || root.webkitAudioContext)();
      if (AC.state === "suspended") AC.resume();
      const t = AC.currentTime + (delay || 0), o = AC.createOscillator(), g = AC.createGain();
      o.type = type || "square"; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
      const v = (vol || 0.12) * sfxVol();
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch (e) {}
  }
  function noise(dur, vol, hp) {
    try {
      AC = AC || new (root.AudioContext || root.webkitAudioContext)();
      const n = Math.floor(AC.sampleRate * dur), b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const s = AC.createBufferSource(), g = AC.createGain(), f = AC.createBiquadFilter();
      f.type = "highpass"; f.frequency.value = hp || 600;
      s.buffer = b; g.gain.value = (vol || 0.15) * sfxVol();
      s.connect(f); f.connect(g); g.connect(AC.destination); s.start();
    } catch (e) {}
  }
  const SFX = {
    jump: () => tone(300, 620, 0.12, "square", 0.07),
    double: () => tone(520, 900, 0.12, "triangle", 0.09),
    coin: () => { tone(1568, 1568, 0.05, "square", 0.05); tone(2093, 2093, 0.14, "square", 0.05, 0.05); },        // a ring
    ringLoss: () => { for (let k = 0; k < 6; k++) tone(2093 - k * 140, 1568 - k * 140, 0.06, "square", 0.04, k * 0.035); },
    shoe: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, f, 0.12, "triangle", 0.1, i * 0.07)),
    juice: () => tone(400, 900, 0.25, "sine", 0.12),
    spring: () => tone(180, 900, 0.3, "triangle", 0.12),
    dash: () => noise(0.25, 0.1, 1800),
    stomp: () => { tone(220, 90, 0.12, "square", 0.1); noise(0.08, 0.08, 400); },
    breakIt: () => noise(0.22, 0.18, 300),
    swing: heavy => noise(heavy ? 0.16 : 0.08, heavy ? 0.09 : 0.05, heavy ? 900 : 1800),
    hit: () => { tone(260, 110, 0.09, "square", 0.08); noise(0.06, 0.07, 700); },
    cast: () => tone(500, 760, 0.1, "triangle", 0.06),
    charge: d => tone(240, 820, d, "triangle", 0.045),
    impact: () => { noise(0.22, 0.2, 180); tone(170, 48, 0.24, "square", 0.09); },
    windup: d => { tone(160, 1300, d, "sawtooth", 0.045); tone(80, 650, d, "square", 0.03); },
    blast: () => { noise(0.5, 0.26, 240); tone(1500, 110, 0.35, "sawtooth", 0.07); tone(95, 38, 0.45, "square", 0.1); },
    shot: () => tone(900, 300, 0.18, "sawtooth", 0.05),
    boom: () => { noise(0.4, 0.2, 160); tone(120, 40, 0.35, "square", 0.08); },
    set: () => tone(660, 440, 0.12, "square", 0.06),
    ring: () => [1319, 1760].forEach((f, i) => tone(f, f, 0.08, "triangle", 0.07, i * 0.05)),
    dive: () => tone(900, 200, 0.25, "sawtooth", 0.06),
    flap: () => noise(0.07, 0.06, 2400),
    glide: () => noise(0.25, 0.04, 2200),
    grab: () => tone(180, 140, 0.08, "square", 0.08),
    teleport: () => { tone(1400, 300, 0.16, "sine", 0.08); tone(300, 1400, 0.16, "sine", 0.06, 0.12); },
    rev: k => tone(200 + k * 400, 300 + k * 500, 0.08, "sawtooth", 0.05),
    roll: () => tone(180, 700, 0.18, "sawtooth", 0.08),
    homing: () => tone(700, 1400, 0.12, "triangle", 0.08),
    hurt: () => { tone(400, 120, 0.3, "sawtooth", 0.1); },
    splash: () => noise(0.3, 0.1, 500),
    bubble: () => tone(300, 900, 0.15, "sine", 0.1),
    warn: () => tone(880, 880, 0.08, "square", 0.06),
    check: () => [523, 659, 784].forEach((f, i) => tone(f, f, 0.12, "triangle", 0.1, i * 0.08)),
    fall: () => tone(600, 80, 0.6, "triangle", 0.1),
    goal: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, f, 0.18, "square", 0.07, i * 0.11)),
    star: () => [784, 988, 1175, 1319, 1568].forEach((f, i) => tone(f, f, 0.1, "triangle", 0.08, i * 0.05)),
    stumble: () => tone(260, 140, 0.15, "square", 0.08),
    pop: () => { noise(0.07, 0.12, 1600); tone(880, 1500, 0.08, "triangle", 0.07); },
    bumper: () => { tone(620, 980, 0.09, "square", 0.08); tone(1320, 1320, 0.07, "triangle", 0.05, 0.05); },
  };

  // ---------------------------------------------------------------- the save
  const KEY = () => "postparade.adventure." + ((root.Auth && Auth.current && Auth.current()) ? Auth.current().id : "guest");
  function load() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(KEY())); } catch (e) {}
    s = s && typeof s === "object" ? s : {};
    s.stages = s.stages || {}; s.cast = s.cast || "sonic";
    return s;
  }
  function save(s) { try { localStorage.setItem(KEY(), JSON.stringify(s)); } catch (e) {} }
  const PAY = { clear: 60, shoe: 20, sRank: 40 };

  // ---------------------------------------------------------------- the running game
  let host = null, opts0 = null, R = null, scene = null, camera = null, sun = null, hemi = null;
  let world = null, player = null, raf = 0, last = 0, acc = 0, mode = "menu", paused = false;
  let saveData = null, stageIdx = 0, castId = "sonic";
  const keys = {}, duoKeys = [{}, {}], pad = { L: 0, R: 0, U: 0, D: 0, J: 0, Z: 0, X: 0, C: 0 }, touch = { L: 0, R: 0, U: 0, D: 0, J: 0, Z: 0, X: 0, C: 0 };
  /* `input` is the hands of whoever is moving now: the one runner's (INPUT0), or in a battle each
     fighter's own in turn -- a player's keys or pad, or the CPU's. */
  const newInput = () => ({ L: 0, R: 0, U: 0, D: 0, J: 0, Z: 0, X: 0, C: 0, jp: 0, zp: 0, xp: 0, cp: 0, dash: 0 });
  const INPUT0 = newInput();
  let input = INPUT0;
  /* A battle (or training) under way: its fighters and rules (see "battle" below). `actor` is
     the fighter whose blow, shot or trap is landing now; `hitTok` the blow itself, so it lands
     on each fighter once; `hitDmg` and `hitKnock` how hard. */
  let battle = null, actor = null, hitTok = null, hitDmg = 8, hitKnock = 0.85;

  function stages() { return (root.AdventureStages && AdventureStages.LIST) || []; }

  function ensureRenderer() {
    if (R) return true;
    try { R = new THREE.WebGLRenderer({ antialias: !LOW_POWER, powerPreference: "high-performance" }); }
    catch (e) { R = null; return false; }
    R.setPixelRatio(Math.min(root.devicePixelRatio || 1, LOW_POWER ? 1 : 1.75));
    R.shadowMap.enabled = !LOW_POWER; R.shadowMap.type = THREE.PCFSoftShadowMap;
    return true;
  }

  function buildWorld(def) {
    const T = Object.assign({ id: def.theme }, THEMES[def.theme] || THEMES.cape);
    const S = parse(def);
    H = S.H;
    scene = new THREE.Scene();
    scene.background = skyTexture(T);
    scene.fog = new THREE.Fog(T.fog[0], T.fog[1], T.fog[2]);
    hemi = new THREE.HemisphereLight(T.hemi[0], T.hemi[1], T.hemi[2]); scene.add(hemi);
    sun = new THREE.DirectionalLight(T.sun[0], T.sun[1]);
    sun.castShadow = !LOW_POWER;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 16, bottom: -10, near: 1, far: 90 });
    sun.shadow.bias = -0.0006;
    scene.add(sun, sun.target);
    camera = new THREE.PerspectiveCamera(34, 1, 0.3, 600);

    const W = S.W, rnd = mulberry32(def.id.length * 97 + 5);
    const group = new THREE.Group(); scene.add(group);
    /* the ground near the start is built now, the rest a little at a time as the camera
       comes near it (buildAhead): a long stage opens without a wait */
    const pending = [];
    for (let i0 = 0; i0 < W; i0 += 16) { if (i0 < 64) for (const m of buildChunk(S, T, i0, Math.min(W, i0 + 16))) group.add(m); else pending.push(i0); }
    const far = new THREE.Group(); scene.add(far);
    buildFar(T, S, rnd, far);
    group.add(skirts(S, T));

    const w = { def, T, S, W, group, far, pending, tiles: {}, ents: [], carrots: [], solids: [], plats: [], enemies: [], vents: [], bubbles: [],
                shots: [], fx: [], traps: [], flashes: [], eshots: [], booms: [], drafts: [], hazards: [], checks: [], start: { x: 2, y: 5 }, goal: null, shoes: [], total: 0,
                parts: null, t: 0 };
    const M = materials();
    // tiles that can go
    const TG = { X: tileGeo("X", T), B: tileGeo("B", T), C: tileGeo("C", T) };
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const c = S.grid[j][i];
      if (!TG[c]) continue;
      const m = new THREE.Mesh(TG[c], M.vox); m.position.set(i, j, 0); m.castShadow = m.receiveShadow = true; group.add(m);
      w.tiles[i + "," + j] = { c, m, i, j, t: 0, gone: 0 };
    }
    // the rings, as one instanced mesh (`carrots` inside: the stage's c)
    const cs = S.ents.filter(e => e.t === "c");
    const cm = new THREE.InstancedMesh(propGeo("ring"), M.vox, Math.max(1, cs.length));
    cm.castShadow = true; group.add(cm);
    w.carrotMesh = cm;
    cs.forEach((e, k) => w.carrots.push({ x: e.i + 0.5, y: e.j + 0.35, k, got: false }));
    w.total = cs.length;
    const put = (geo, x, y, z) => { const m = new THREE.Mesh(geo, M.vox); m.position.set(x, y, z || 0); m.castShadow = true; group.add(m); return m; };
    let shoeN = 0;
    for (const e of S.ents) {
      const x = e.i + 0.5, y = e.j;
      switch (e.t) {
        case "P": w.start = { x, y }; break;
        case "G":
          w.goal = { x, y, m: put(propGeo(def.story ? "relic" : "goal"), x, y, def.story ? 0 : -0.4), spin: 0 };
          if (def.story) { const g = new THREE.Sprite(glowMat(0xff7060, 0.7)); g.scale.set(3.6, 3.6, 1); g.position.set(x, y + 2.0, -0.3); group.add(g); }
          break;
        case "K": w.checks.push({ x, y, on: false, m: put(propGeo("pole"), x, y, -0.9) }); break;
        /* item monitors: * holds invincibility or the speed shoes, J ten rings or a shield, by turns along the stage */
        case "*": case "J": {
          const kind = e.t === "*" ? ((e.i + e.j) % 2 ? "speed" : "star") : ["ring", "shield", "magnet"][(e.i + e.j) % 3];
          let m;
          if (ITEMS) { m = makeCard("items"); group.add(m); setFrame(m, "mon." + kind, 0, 1, x, y, false, 0.1, 0.9); }
          else m = put(propGeo("monitor_" + (kind === "magnet" ? "shield" : kind)), x, y, 0);
          w.ents.push({ t: "monitor", kind, x, y, m });
          break;
        }
        case "E": w.arena = { x0: e.i, y }; break;          // Eggman's arena: its left edge (the boss, below)
        case "H": w.shoes.push({ t: "shoe", n: shoeN, x, y: y + 0.2, m: put(propGeo("redring"), x, y + 0.2) }); shoeN++; break;   // a Red Star Ring
        case "S": {                                     // a spring, its coil squashed down at rest
          const m = new THREE.Group(), part = n => { const q = new THREE.Mesh(propGeo(n), M.vox); q.castShadow = q.receiveShadow = true; m.add(q); return q; };
          part("springBase"); const coil = part("springCoil"), cap = part("springCap");
          m.position.set(x, y, 0); group.add(m);
          w.ents.push({ t: "spring", x, y, m, coil, cap, sq: 0 });
          springPose({ coil, cap, sq: 0 });
          break;
        }
        case ">": w.ents.push({ t: "dash", x, y, m: put(propGeo("dash"), x, y + 0.01) }); break;
        case "h": { const m = put(propGeo("hurdle", T), x, y); w.solids.push({ t: "hurdle", x0: x - 0.2, x1: x + 0.2, y0: y, y1: y + 1.0, m, alive: true }); break; }
        case "Q": w.ents.push({ t: "bumper", x, y: y + 0.5, m: put(propGeo("bumper", T), x, y + 0.5, -0.3), sq: 0, cd: 0 }); break;
        case "o": w.ents.push({ t: "balloon", x, y: y + 0.3, y0: y + 0.3, m: put(propGeo("balloon", T), x, y + 0.3), back: 0 }); break;
        case "M": case "V": {
          const len = e.len || 3;
          const v = new Vox(); for (let sx = 0; sx < len * 4; sx++) for (let z = ZB; z <= ZF; z++) v.set(sx, 3, z, jit(rnd, ((sx & 3) === 0) ? mulC(T.plank, 0.75) : T.plank, 0.05));
          for (let sx = 0; sx < len * 4; sx++) v.set(sx, 2, ZF, mulC(T.plank, 0.7));
          const m = new THREE.Mesh(meshVox(v, GR), M.vox); m.castShadow = true; group.add(m);
          w.plats.push({ t: e.t, i: e.i, j: e.j, len, x0: e.i, y0: e.j, x: e.i, y: e.j, dx: 0, dy: 0, m, ph: (e.i * 0.37) % (PI * 2), range: 3 });
          break;
        }
        case "k": case "r": case "b": case "n": case "p": {      // a badnik: which, the theme says
          const key = T.foes && T.foes[e.t];
          if (!key || !BADS || !BADS.f[key]) break;
          const B = BADNIKS[key], box = BADS.f[key].box, m = badCard(); group.add(m);
          const y0 = B.air ? y + 0.4 : y;
          w.enemies.push({ key, B, x, y: y0, x0: x, y0, w: box[0] * PX * 0.82 * (B.k || 1), h: box[1] * PX * 0.88 * (B.k || 1), m, alive: true,
                           ph: e.i * 1.3, t: (e.i % 7) * 0.3, at: 0, mode: "walk", dir: -1, face: -1, vx: 0, vy: 0, reach: 0 });
          break;
        }
        case "U": w.drafts.push({ x0: e.i, x1: e.i + 1, y0: e.j, y1: e.j + 8 }); break;
        case "O": w.vents.push({ x, y, t: (e.i % 3) * 0.8, m: put(propGeo("vent"), x, y) }); break;
        case "T": {
          put(propGeo("tree", T), x, y, -2.6).scale.setScalar(1.1);
          const L = LAMP_AT[T.tree];                       // a lamp's light
          if (L) { const s = new THREE.Sprite(glowMat(T.tree === "lamp" ? 0xffd890 : 0xfff0c8, 0.8)); s.scale.set(2.6, 2.6, 1); s.position.set(x + L[0] * 1.1, y + L[1] * 1.1, -2.4); group.add(s); }
          break;
        }
        case "^": {
          const m = new THREE.Mesh(vox(v => { for (let k = -7; k <= 7; k += 2) for (let z = -20; z <= 18; z += 4) v.box(k, 0, z + (k & 3), k, 4 + ((k + z) & 3), z + (k & 3), (k & 2) ? 0x3a6a2a : 0x6a3a5a); }), M.vox);
          m.position.set(x, y, 0); group.add(m); w.hazards.push({ x0: e.i + 0.1, x1: e.i + 0.9, y0: e.j, y1: e.j + 0.45 });
          break;
        }
      }
    }
    // updraft columns: drifting motes
    for (const d of w.drafts) {
      const geo = vox(v => v.box(0, 0, 0, 0, 1, 0, typeof T.snowfall === "number" ? T.snowfall : T.snowfall ? 0xffffff : 0xd8f0d0));
      d.motes = [];
      for (let k = 0; k < 7; k++) { const m = new THREE.Mesh(geo, M.glow); m.position.set(d.x0 + Math.random(), d.y0 + Math.random() * 8, 0.3); group.add(m); d.motes.push(m); }
    }
    // particles: a pool of little cubes
    const pg = new THREE.BoxGeometry(1, 1, 1);
    const pm = new THREE.InstancedMesh(pg, M.cube, 320);
    pm.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    pm.setColorAt(0, new THREE.Color(1, 1, 1));
    group.add(pm);
    w.parts = { mesh: pm, list: [] };
    // snow falling past the camera
    if (T.snowfall) {
      const n = LOW_POWER ? 200 : 500, pos = new Float32Array(n * 3);
      for (let k = 0; k < n; k++) { pos[k * 3] = Math.random() * 40 - 20; pos[k * 3 + 1] = Math.random() * 20; pos[k * 3 + 2] = Math.random() * 14 - 4; }
      const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      w.snow = new THREE.Points(geo, new THREE.PointsMaterial({ color: typeof T.snowfall === "number" ? T.snowfall : 0xffffff, size: 0.12, transparent: true, opacity: 0.9, depthWrite: false }));
      scene.add(w.snow);
    }
    shoeN = 0;
    if (w.arena && def.boss && def.last && BSH && BOSS[def.boss]) w.boss = newBoss(def.boss, w);   // Eggman, waiting in his arena
    return w;
  }

  /* Build the next ground chunk the camera is coming to: the nearest unbuilt within forty
     metres, every other frame -- every frame once it is nearly in sight. */
  function buildAhead(w) {
    const P = w.pending; if (!P.length) return;
    let best = -1, bd = 1e9;
    for (let k = 0; k < P.length; k++) { const d = Math.abs(P[k] + 8 - camX); if (d < bd) { bd = d; best = k; } }
    w.buildT = (w.buildT || 0) + 1;
    if (bd > 40 || (bd > 22 && w.buildT % 2)) return;
    const i0 = P.splice(best, 1)[0];
    for (const m of buildChunk(w.S, w.T, i0, Math.min(w.W, i0 + 16))) w.group.add(m);
  }

  function disposeWorld() {
    if (!scene) return;
    scene.traverse(o => {
      if (o.geometry && !o.userData.keep && !Object.values(PROPS).includes(o.geometry)) o.geometry.dispose();
    });
    if (scene.background && scene.background.dispose) scene.background.dispose();
    scene = null; world = null;
  }

  // ---------------------------------------------------------------- the runner
  function makePlayer(c) {
    if (c.id === "emerl" && !c.emerl) c = emerlCast();
    sheetMats(c.sheet || c.id).mat.color.setHex(world.T.tint || 0xffffff);
    if (BADS) badMats().mat.color.setHex(world.T.tint || 0xffffff);        // the badniks in the same light
    if (ITEMS) sheetMats("items").mat.color.setHex(world.T.tint || 0xffffff);  // and the monitors
    const spr = makeCard(c.sheet || c.id); world.group.add(spr);
    // Sonic Advance's Spin Dash dust, kicked up behind a rev
    const dust = framesOf(c.id, "fx.rev") ? makeCard(c.id, "fx") : null;
    if (dust) { dust.visible = false; world.group.add(dust); }
    return { c, spr, dust, x: world.start.x, y: world.start.y, vx: 0, vy: 0, face: 1, ground: true, curl: false, coyote: 0, on: null,
             state: "run", st: 0, inv: 0, carrots: 0, ringsGot: 0, shield: false, speedT: 0, shoes: world.shoes.map(() => false), falls: 0,
             check: { x: world.start.x, y: world.start.y }, airMove: false, airSp: false, airUses: 0, cd: { shot: 0, power: 0, trap: 0 },
             rev: 0, star: 0, air: AIR, inWater: false, wasWater: false, jumping: false, dead: 0, target: null, onTile: null,
             flyLeft: c.flyTime || 0, hh: c.h, warnAt: 0, mv: null, sp: null, anim: { key: null, t: 0 }, landT: 0, drop: false };
  }
  const AIR = 16;                                    // seconds of breath under water: everyone, as in the classic games
  const BELT = 3.6;                                  // a conveyor belt's speed, m/s
  const GRAV = 34;

  const tile = (i, j) => (i < 0 || i >= world.W) ? "#" : (j < 0 || j >= H) ? "." : world.S.grid[j][i];
  const solid = c => SOLIDS.indexOf(c) >= 0;
  const slopeY = (c, i, j, x) => c === "/" ? j + clamp(x - i, 0, 1) : j + 1 - clamp(x - i, 0, 1);
  const surfaceAt = (x, y) => tile(Math.floor(x), Math.floor(y - 0.05));
  /* the runner's whole body hurts what it touches: curled, rolling, gliding, diving, in the
     live frames of a blow, or with the rainbow's shine */
  const BODY_HITS = { roll: 1, charge: 1, homing: 1, glide: 1, dive: 1, tornado: 1, jet: 1 };
  const attacking = p => p.star > 0 || !!BODY_HITS[p.state] || (p.state === "atk" && p.mv.live) ||
                         (p.curl && !p.ground && p.state !== "hurt");
  /** The ground under (x, y), slopes and planks included, within a metre or so; or null. */
  function groundY(x, y) {
    const ci = Math.floor(x);
    for (let j = Math.floor(y + 0.6); j >= Math.floor(y - 1.2); j--) {
      const c = tile(ci, j);
      if (c === "/" || c === "\\") return slopeY(c, ci, j, x);
      if (solid(c) || c === "-") return j + 1;
    }
    return null;
  }

  /** The highest thing to stand on under the runner, between yHi and yLo. */
  function floorBetween(p, yHi, yLo) {
    let best = null, on = null, tl = null;
    const x0 = p.x - p.c.w / 2 + 0.04, x1 = p.x + p.c.w / 2 - 0.04;
    for (let i = Math.floor(x0); i <= Math.floor(x1); i++) for (let j = Math.floor(yHi); j >= Math.floor(yLo) - 1; j--) {
      const c = tile(i, j);
      if (solid(c) || (c === "-" && !p.drop)) {
        const top = j + 1;
        if (top <= yHi + 1e-4 && top >= yLo - 1e-4 && (best === null || top > best)) { best = top; tl = solid(c) ? { i, j } : null; }
      }
    }
    const ci = Math.floor(p.x);
    for (let j = Math.floor(yHi) + 1; j >= Math.floor(yLo) - 1; j--) {
      const c = tile(ci, j);
      if (c === "/" || c === "\\") {
        const s = slopeY(c, ci, j, p.x);
        if (s <= yHi + 0.02 && s >= yLo - 1e-4 && (best === null || s > best)) { best = s; tl = null; }
      }
    }
    for (const q of world.plats) {
      if (x1 < q.x || x0 > q.x + q.len) continue;
      const top = q.y + 1;
      if (top <= yHi + Math.max(0, q.dy) + 1e-3 && top >= yLo - 1e-3 && (best === null || top > best)) { best = top; on = q; tl = null; }
    }
    for (const b of world.solids) {
      if (!b.alive || x1 < b.x0 || x0 > b.x1) continue;
      if (b.y1 <= yHi + 1e-4 && b.y1 >= yLo - 1e-4 && (best === null || b.y1 > best)) { best = b.y1; tl = null; on = null; }
    }
    return best === null ? null : { y: best, on, tl };
  }

  function breakTile(i, j) {
    const t = world.tiles[i + "," + j];
    if (!t || t.gone) return false;
    if (t.c === "C") return false;
    world.S.grid[j][i] = ".";
    t.gone = 1; t.m.visible = false;
    burst(i + 0.5, j + 0.5, t.c === "B" ? [0xc8904a, 0x8a5a2c, 0xe0b070] : [world.T.crack, mulC(world.T.crack, 0.6), 0xbcbcc4], 14, 6);
    SFX.breakIt();
    if (t.c === "B") for (let k = 0; k < 3; k++) spawnLoose(i + 0.5, j + 0.7, (k - 1) * 2.2, 7 + k);
    return true;
  }
  /* Rings loose: a crate's, which jump out and can be caught; or a runner's own, knocked out of
     them by a hit, flying every way, to be caught again in the few seconds before they vanish. */
  function spawnLoose(x, y, vx, vy, own) {
    const m = new THREE.Mesh(propGeo("ring"), materials().vox); m.position.set(x, y, 0); world.group.add(m);
    world.ents.push({ t: "loose", x, y, vx, vy, m, life: own ? 4.2 : 6, wait: own ? 0.6 : 0.3, own: !!own });
  }
  /* what a beaten badnik lets go: the animal inside it, which hops or flies off, as in the classic games */
  /* a spring's coil, stretched by how lately it threw someone (sq 1 just now, 0 at rest): it
     shoots up, overshoots, and settles back squashed, as Sonic Advance 3's does */
  function springPose(e) {
    const k = e.sq > 0 ? 1 - e.sq : 1;
    const s = e.sq > 0 ? 0.45 + 2.0 * Math.exp(-k * 4) * Math.abs(Math.cos(k * 7)) : 0.45;
    e.coil.position.y = 3 / 16; e.coil.scale.y = s;
    e.cap.position.y = (3 + 8 * s) / 16;
  }
  function spawnCritter(x, y) {
    const bird = Math.random() < 0.5, m = new THREE.Mesh(propGeo(bird ? "bird" : "bunny"), materials().vox);
    m.position.set(x, y, 0.2); world.group.add(m);
    world.ents.push({ t: "critter", bird, x, y, vx: (Math.random() < 0.5 ? -1 : 1) * (bird ? 3.5 : 3), vy: bird ? 5 : 6, m, life: 2.6 });
  }
  /* a hit with rings: they fly out of the runner every way -- thirty-two at most, as in the games */
  function scatterRings(p) {
    const n = Math.min(32, p.carrots);
    p.carrots = 0;
    for (let k = 0; k < n; k++) {
      const a = PI / 2 + (k % 16 - 7.5) * 0.19 * (k < 16 ? 1 : 1.6), sp = k < 16 ? 7 : 4.5;
      spawnLoose(p.x, p.y + p.hh * 0.5, Math.cos(a) * sp * (k % 2 ? 1 : -1), Math.abs(Math.sin(a)) * sp + 3, true);
    }
    SFX.ringLoss();
  }
  /* an item monitor broken open: what it held */
  function openMonitor(p, e) {
    e.gone = true; e.m.visible = false;
    if (ITEMS) effect("items", "smoke", e.x, e.y + 0.45, 1, 16, true, "fx", 0.9);                  // it goes up in smoke
    else burst(e.x, e.y + 0.5, [0xc8ccd6, 0xffffff, 0x182040], 12, 5);
    SFX.pop();
    if (e.kind === "ring") { p.carrots += 10; p.ringsGot += 10; SFX.coin(); hudToast("Super Ring: ten rings"); }
    else if (e.kind === "shield") { p.shield = "green"; SFX.set(); hudToast("Shield: it takes one hit for you"); }
    else if (e.kind === "magnet") { p.shield = "magnet"; SFX.set(); hudToast("Magnetic Shield: rings come to you"); }
    else if (e.kind === "star") { p.star = 15; SFX.star(); hudToast("Invincibility"); }
    else { p.speedT = 12; SFX.dash(); hudToast("Speed Shoes"); }
  }
  /** A blow lands on a box of the world: whatever is in it -- things alive, cracked rock,
      crates, hurdles -- is beaten or broken, things alive knocked by `kick` (see defeat).
      Returns how many; world.hitAt is where the first one was met. */
  function strike(x0, x1, y0, y1, kick) {
    let n = 0;
    const at = (a0, a1, b0, b1) => { if (!n) world.hitAt = { x: (Math.max(x0, a0) + Math.min(x1, a1)) / 2, y: (Math.max(y0, b0) + Math.min(y1, b1)) / 2 }; };
    world.hitAt = null;
    for (const e of world.enemies) if (e.alive && !e.hidden && e.x + e.w / 2 > x0 && e.x - e.w / 2 < x1 && e.y + e.h > y0 && e.y < y1) {
      at(e.x - e.w / 2, e.x + e.w / 2, e.y, e.y + e.h);
      /* a blow (not a blast) glances off spikes, a spin, Pierrot's ball and Gao-gao's face */
      if (!(kick && kick.r) && (e.guard || e.B.armor === "ball" || (e.B.armor === "shell" && e.mode !== "open") ||
                                (e.B.armor === "front" && sgn((x0 + x1) / 2 - e.x) === e.face))) { glance(e); continue; }
      defeat(e, kick); n++;
    }
    for (let i = Math.floor(x0); i <= Math.floor(x1 - 0.01); i++) for (let j = Math.floor(y0); j <= Math.floor(y1 - 0.01); j++) {
      const t = tile(i, j);
      if ((t === "X" || t === "B") && breakTile(i, j)) { at(i, i + 1, j, j + 1); n++; }
    }
    for (const b of world.solids) if (b.alive && b.x1 > x0 && b.x0 < x1 && b.y1 > y0 && b.y0 < y1) { at(b.x0, b.x1, b.y0, b.y1); smashHurdle(b); n++; }
    if (world.boss && !battle) n += bossStrike(x0, x1, y0, y1);
    /* in a battle, the other side's fighters (not one's own team) */
    if (battle && actor) for (const q of battle.fs) {
      if (!rivals(actor, q) || q.ko || q.out) continue;
      const qx0 = q.x - q.c.w / 2, qx1 = q.x + q.c.w / 2;
      if (qx1 <= x0 || qx0 >= x1 || q.y + q.hh <= y0 || q.y >= y1) continue;
      if (hitFighter(q, kick, (x0 + x1) / 2)) { at(qx0, qx1, q.y, q.y + q.hh); n++; }
    }
    return n;
  }

  /* Walls: tiles, and hurdles while they stand. A glide into a wall grabs it. */
  /* A tile in the way whose top is no more than half a metre over the feet, with nothing on
     it, is a lip, not a wall: the foot of a slope and the edge at its top are such lips (the
     ground under the next stretch of slope is a hand-width or two over the feet, because a
     runner moves along before the ground lifts them -- the more, the faster they go). Every
     tile step in a stage is a whole metre, so no real wall is ever a lip. */
  /* (a wide runner -- Eggman's Egg Mobile -- reaches the next tile sooner, while the ground is
     still further from lifting them: their lip is that much higher) */
  const isLip = (p, i, j) => j + 1 - p.y <= 0.5 + Math.max(0, p.c.w / 2 - 0.3) && !solid(tile(i, j + 1));
  function moveX(p, dx) {
    p.x += dx;
    const hb = p.hh;
    const yb = p.y + (p.ground ? 0.36 : 0.06), yt = p.y + hb - 0.06;
    let lift = null;
    for (let pass = 0; pass < 2; pass++) {
      const edge = dx > 0 ? p.x + p.c.w / 2 : p.x - p.c.w / 2;
      const i = Math.floor(edge);
      let hit = false;
      for (let j = Math.floor(yb); j <= Math.floor(yt); j++) {
        const c = tile(i, j);
        if (!solid(c)) continue;
        if ((c === "X" || c === "B") && attacking(p)) { breakTile(i, j); continue; }
        if (isLip(p, i, j)) { if (!lift || j + 1 > lift.y) lift = { y: j + 1, i, j }; continue; }   // run (or fly, glide, roll) up onto it
        hit = true; break;
      }
      if (hit) {
        p.x = dx > 0 ? i - p.c.w / 2 - 1e-3 : i + 1 + p.c.w / 2 + 1e-3;
        if (p.state === "homing" || p.state === "seek" || p.state === "dash" || p.state === "jet" || p.state === "psy") { p.state = "run"; p.st = 0; }
        if (p.state === "glide" && p.c.climb) { startClimb(p, sgn(dx)); return; }
        p.vx = 0;
        if (p.state === "roll") p.state = "run";
      }
    }
    /* up onto a lip: stand on it -- and, coming down onto it from the air, land */
    if (lift && lift.y > p.y) {
      p.y = lift.y;
      if (!p.ground && p.vy <= 0) land(p, { on: null, tl: { i: lift.i, j: lift.j } });
    }
    for (const b of world.solids) {
      if (!b.alive) continue;
      if (p.x + p.c.w / 2 <= b.x0 || p.x - p.c.w / 2 >= b.x1 || yt <= b.y0 || yb >= b.y1) continue;
      if (attacking(p)) { smashHurdle(b); continue; }
      p.x = dx > 0 ? b.x0 - p.c.w / 2 - 1e-3 : b.x1 + p.c.w / 2 + 1e-3;
      if (Math.abs(p.vx) > 7 && p.ground) { p.vx = -sgn(p.vx) * 3; p.state = "stumble"; p.st = 0.35; SFX.stumble(); }
      else p.vx = 0;
    }
  }
  function smashHurdle(b) {
    b.alive = false; b.m.visible = false;
    burst((b.x0 + b.x1) / 2, b.y0 + 0.5, HURDLE_C[world.T.hurdle] || HURDLE_C.brush, 16, 7);
    SFX.breakIt();
  }

  const AIR_STATES = { homing: 1, fly: 1, glide: 1, teleport: 1, seek: 1, climb: 1, jet: 1, psy: 1 };
  function land(p, hit) {
    if (!p.ground && p.vy < -14 && !(p.state === "dive" && p.diveS && p.diveS.bits === 0)) burst(p.x, p.y, [0xd8d0c0, 0xc8c0b0], 5, 2);
    if (!p.ground && p.vy < -4) p.landT = 0.14;
    const fell = p.vy;
    p.ground = true; p.vy = 0; p.airMove = false; p.airSp = false; p.airUses = 0; p.jumping = false; p.flyLeft = p.c.flyTime || 0;
    p.on = hit.on; p.onTile = hit.tl;
    if (p.state !== "roll") p.curl = false;
    if (p.state === "dive") diveLand(p, fell);
    else if (AIR_STATES[p.state]) p.state = "run";
    else if (p.state === "atk" && p.mv.air && p.mv.name !== "aim") { p.state = "run"; p.mv = null; }
  }

  /* Hurt, the Sonic way: a shield takes the hit and goes; else the rings fly out; with no rings
     at all, the runner is down, and goes back to the last Star Post. */
  function hurt(p, fromX) {
    if (p.inv > 0 || p.star > 0 || p.dead) return;
    p.inv = 1.6;
    p.vx = -sgn(fromX - p.x || p.face) * 7; p.vy = 8; p.ground = false;
    p.state = "hurt"; p.st = 0.45; p.curl = false; p.mv = null; p.sp = null;
    SFX.hurt(); flashHud();
    burst(p.x, p.y + 1, [0xffffff, 0xf2d040], 8, 4);
    if (p.shield) { p.shield = false; burst(p.x, p.y + p.hh / 2, [0x6ac8ff, 0xffffff], 14, 5); return; }
    if (p.carrots > 0) scatterRings(p);
    else die(p, "beaten");
  }
  function die(p, why) {
    if (p.dead) return;
    p.dead = 1.1; p.why = why; p.falls++;
    SFX.fall();
  }
  function respawn(p) {
    p.dead = 0; p.carrots = 0; p.shield = false; p.speedT = 0; p.x = p.check.x; p.y = p.check.y + 0.02; p.vx = 0; p.vy = 0; p.inv = 1.4;
    p.state = "run"; p.ground = false; p.air = AIR; p.star = 0; p.rev = 0; p.mv = null; p.sp = null; p.curl = false;
    snapCamera();
  }

  // ---------------------------------------------------------------- moving
  function step(dt) {
    const p = player, w = world, c = p.c;
    if (!battle) w.t += dt;                               // (a battle keeps one clock for everyone)
    if (p.ko) { stepKO(p, dt); return; }
    if (p.dead) {
      p.dead -= dt;
      if (p.dead <= 0) respawn(p);
      return;
    }
    if (mode === "goal") { p.vx *= Math.pow(0.02, dt); goalStep(p, dt); if (!p.ground) p.vy = Math.max(p.vy - GRAV * dt, -22); integrate(p, dt); return; }
    p.inv = Math.max(0, p.inv - dt); p.star = Math.max(0, p.star - dt); p.speedT = Math.max(0, (p.speedT || 0) - dt);
    for (const k in p.cd) p.cd[k] = Math.max(0, p.cd[k] - dt);
    p.comboT = Math.max(0, (p.comboT || 0) - dt);
    p.drop = false;
    const dir = input.R - input.L;
    // where they are
    const midTile = tile(Math.floor(p.x), Math.floor(p.y + p.hh * 0.5));
    const headTile = tile(Math.floor(p.x), Math.floor(p.y + p.hh - 0.1));
    p.wasWater = p.inWater;
    p.inWater = midTile === "~";
    if (p.inWater !== p.wasWater && Math.abs(p.vy) > 3) { SFX.splash(); burst(p.x, Math.floor(p.y + p.hh * 0.5) + 1, [0xffffff, mixC(w.T.water, 0xffffff, 0.5)], 10, 4); }
    const under = p.ground ? (p.onTile ? tile(p.onTile.i, p.onTile.j) : surfaceAt(p.x, p.y)) : null;
    const ice = under === "I", mud = under === "m";
    // breath
    if (headTile === "~" && !c.swims) {                  // (Chaos is water: he never runs out of air)
      p.air -= dt;
      if (p.air < 6 && w.t > p.warnAt) { SFX.warn(); p.warnAt = w.t + 1; }
      if (p.air <= 0) { die(p, "air"); return; }
    } else p.air = AIR;
    let top = c.run * (p.star > 0 ? 1.22 : 1) * (p.speedT > 0 ? 1.35 : 1), acc = (p.ground ? c.accel : c.airAccel) * (p.speedT > 0 ? 1.3 : 1), fr = p.ground ? 30 : 4;
    if (p.inWater) { if (c.swims) { acc *= 1.2; fr = 12; } else { top *= 0.62; acc *= 0.6; fr = 8; } }
    if (mud) top *= 0.5;
    if (ice) { acc *= 0.32; fr = 2.2; }
    p.st -= dt;
    if (battle) guardUpkeep(p, dt);
    p.hh = (p.state === "crouch" || p.state === "roll" || p.state === "charge") && !c.lift ? 0.72 : c.h;
    if (p.state === "ledge") { stepLedge(p, dt); interact(p, dt); return; }

    // what they are in the middle of
    switch (p.state) {
      case "hurt": case "stumble":
        if (battle && p.ground && p.state === "hurt") p.vx *= Math.pow(0.03, dt);     // knocked along the floor, sliding to a stop
        if (p.st <= 0) p.state = "run";
        break;
      case "crouch":
        p.vx = Math.abs(p.vx) <= fr * dt ? 0 : p.vx - sgn(p.vx) * fr * dt;
        if (!input.D || !p.ground) { p.state = "run"; p.landT = 0.1; }
        else if (battle) stepGuard(p, dt);                // in a battle, Down guards, and held, heals
        break;
      case "charge":                                       // a Spin Dash, revving: tap Space, let go of Down
        p.vx *= Math.pow(0.0005, dt);
        p.rev = Math.min(1, p.rev + dt * 0.5);
        if (input.jp) { p.rev = Math.min(1, p.rev + 0.2); p.revKick = 1; SFX.rev(p.rev); if (p.rev > 0.45) revSpark(p); }
        if (!input.D) {
          p.state = "roll"; p.vx = p.face * (13 + p.rev * 10) * (p.inWater ? 0.7 : 1); p.rev = 0;
          SFX.roll(); effect(c.id, "fx.dust", p.x - p.face * 0.6, p.y, -p.face, 22, false);
        }
        if (!p.ground) p.state = "run";
        break;
      case "roll":
        if (p.driveT > 0) { p.driveT -= dt; p.vx = p.face * 19; }
        else {
          p.vx -= sgn(p.vx) * 3.2 * dt;
          if (dir && sgn(dir) !== sgn(p.vx)) p.vx -= sgn(p.vx) * 9 * dt;
        }
        if (Math.abs(p.vx) < 3 && p.ground) p.state = input.D ? "crouch" : "run";
        if (!p.ground && !(p.driveT > 0)) p.state = "run";
        break;
      case "dash":                                         // a double tap: each runner's own burst
        if (c.id !== "knuckles" && dir && dir !== p.face) { if (c.steer) p.face = dir; else { p.state = "run"; break; } }
        if (c.steer && dir && (p.driveT2 = (p.driveT2 || 0) + dt) < 2.5) p.st = Math.max(p.st, 0.08);   // Drive Mode: on while held
        p.vx = p.face * Math.max(c.steer ? 0 : Math.abs(p.vx), c.run * dashK(c));
        if (p.st <= 0) p.state = "run";
        break;
      case "atk": stepBlow(p, dt); break;
      case "seek": stepSeek(p, dt); break;
      case "homing": stepHoming(p); break;
      case "special": stepSpecial(p, dt); break;
      case "tornado": stepTornado(p, dt); break;
      case "dive": stepDive(p, dt); break;
      case "erupt": stepErupt(p, dt); break;
      case "climb": stepClimb(p, dir); break;
      case "teleport": if (p.st <= 0) p.state = "run"; break;
      case "jet": case "psy":                              // Metal's jet, Silver's Psycho Dash: a burst ahead, easing off
        p.vx = p.face * Math.max(Math.abs(p.vx) - (p.state === "psy" ? 14 : 8) * dt, c.run * 0.9);
        if (p.st <= 0) { if (p.state === "psy") p.floatT = 1.6; p.state = "run"; }
        break;
      case "recoil":                                       // thrown back by his own blast, braking
        p.vx = Math.abs(p.vx) <= 16 * dt ? 0 : p.vx - sgn(p.vx) * 16 * dt;
        if (p.st <= 0) p.state = "run";
        break;
      case "fly":
        p.flyLeft -= dt;
        if (input.D) { p.state = "run"; p.catchT = 0.3; }        // Rouge Catch: lets go
        else if (p.inWater && srcOf(p, "air") !== "tails") p.state = "run";
        else if (c.air === "hover" && p.flyLeft <= 0 && !c.glides) p.state = "run";   // Gamma's Flight Mode runs out
        break;
      case "glide":
        if (!input.J || p.ground) { p.state = "run"; break; }
        if (dir && dir !== p.face) { p.face = dir; p.vx = dir * 4; }
        p.vx = p.face * clamp(Math.abs(p.vx) + 6 * dt, 4, p.inWater ? 5 : 10);
        break;
    }
    // running, and steering in the air
    if (p.state === "run" || p.state === "fly" || p.state === "teleport") {
      const t2 = p.state === "fly" ? Math.min(top * 1.3, c.run * (c.flyK || (srcOf(p, "air") === "rouge" ? 0.8 : 0.66))) : top;
      if (dir) {
        if (sgn(p.vx) !== dir && Math.abs(p.vx) > 0.4) p.vx += dir * acc * (ice ? 1 : 2.4) * dt;
        else if (Math.abs(p.vx) < t2) p.vx = clamp(p.vx + dir * acc * dt, -t2, t2);
        else p.vx -= sgn(p.vx) * Math.min(Math.abs(p.vx) - t2, 9 * dt);
        p.face = dir;
      } else {
        const d = fr * dt;
        p.vx = Math.abs(p.vx) <= d ? 0 : p.vx - sgn(p.vx) * d;
      }
    }

    // the buttons
    const free = p.state === "run" || p.state === "crouch" || p.state === "fly" || p.state === "glide" || p.state === "dash" ||
                 p.state === "roll" || p.state === "teleport" || p.state === "jet" || p.state === "psy";
    if (p.ground) p.coyote = 0.1; else p.coyote -= dt;
    if (input.jp && free) {
      const onPlank = p.ground && p.onTile === null && !p.on && tile(Math.floor(p.x), Math.floor(p.y - 0.1)) === "-";
      if (input.D && onPlank) { p.drop = true; p.ground = false; p.y -= 0.12; p.state = "run"; }
      else if (input.D && p.ground && c.spinDash && p.state !== "roll") startCharge(p);
      else if (input.D && p.ground && !c.spinDash) { /* no Spin Dash (Rouge, Chaos, Gamma, Eggman): Down + Space does nothing */ }
      else if ((p.ground || p.coyote > 0) && p.state !== "fly" && p.state !== "glide") jump(p, mud);
      else airAction(p);
    }
    if (p.jumping && !input.J && p.vy > 5 && p.state === "run") { p.vy = 5; p.jumping = false; }
    if (free) {
      if (input.dash && p.ground && (p.state === "run" || p.state === "crouch")) startDash(p, input.dash);
      else if ((input.zp || input.xp) && free) startAttack(p, input.zp ? "light" : "heavy");
      else if (input.cp && free) startSpecial(p);
    }
    // Down: crouch when still, curl into a roll when running (everyone with a Spin Dash)
    if (p.state === "run" && p.ground && input.D) {
      if (c.spinDash && Math.abs(p.vx) > 4) { p.state = "roll"; p.curl = true; SFX.roll(); }
      else if (Math.abs(p.vx) < 4) p.state = "crouch";
    }

    // gravity
    let g = GRAV, maxFall = 22;
    if (p.inWater) { g *= c.swims ? 0.3 : 0.45; maxFall = c.swims ? 4 : 6; }
    switch (p.state) {
      case "homing": case "seek": case "climb": case "dive": g = 0; break;
      case "fly":
        if (c.air === "hover") {                                   // Gamma and Eggman: no climbing, held up, sinking
          if (p.flyLeft > 0) { g = 0; p.vy = lerp(p.vy, -(c.sink || 0), Math.min(1, dt * 5)); }
          else { g *= 0.25; maxFall = 1.8; }                       // Eggman, out of it, sinks slowly
        } else if (p.flyLeft > 0) { g *= 0.3; maxFall = 2.4; }
        else if (c.glides) { g *= 0.25; maxFall = 1.6; }           // Rouge, tired, glides down on her wings
        else { g *= 0.5; maxFall = 4; }
        break;
      case "glide": if (p.vy > -1.5) g *= 0.5; else { p.vy = p.inWater ? -1 : -1.5; g = 0; } break;
      case "teleport": g *= 0.25; maxFall = 2; break;
      case "jet": g *= 0.15; maxFall = 0.8; break;
      case "psy": g = 0; p.vy = lerp(p.vy, 0, Math.min(1, dt * 10)); break;
      case "atk": if (p.mv.air) g *= 0.6; break;
      case "special": if (p.sp.air) { g *= 0.3; maxFall = 2.5; } break;
      case "tornado": if (p.tor.air) { g *= 0.15; maxFall = 1.2; } break;
    }
    // an updraft lifts anyone in it; one flying or gliding goes up it fastest
    /* Silver, after his Psycho Dash, floats down while Space is held; Mighty's Shell Launch is
       curled on the way up and uncurls at the top */
    if (p.floatT > 0) { p.floatT -= dt; if (p.state === "run" && !p.ground && input.J && p.vy < 0) maxFall = Math.min(maxFall, 2.4); }
    if (p.launchT > 0) { p.launchT -= dt; if (p.launchT <= 0 && p.state === "run") p.curl = false; }
    const floaty = p.state === "fly" || p.state === "glide";
    for (const d of w.drafts) if (p.x > d.x0 - 0.25 && p.x < d.x1 + 0.25 && p.y > d.y0 - 0.5 && p.y < d.y1 && p.state !== "climb") {
      p.vy = Math.min(p.vy + (floaty ? 60 : 46) * dt, floaty ? 8 : 4.5); p.ground = false;
      if (floaty) maxFall = 2.0;
    }
    p.vy = Math.max(p.vy - g * dt, -maxFall);
    // slopes pull
    if (p.ground && (p.state === "run" || p.state === "roll")) {
      const st = tile(Math.floor(p.x), Math.floor(p.y - 0.02));
      const s2 = tile(Math.floor(p.x), Math.floor(p.y + 0.02));
      const sl = (st === "/" || st === "\\") ? st : (s2 === "/" || s2 === "\\") ? s2 : null;
      if (sl) p.vx += (sl === "/" ? -1 : 1) * (p.state === "roll" ? 14 : 5.5) * dt;
    }
    integrate(p, dt);
    interact(p, dt);
  }

  function jump(p, mud) {
    const c = p.c;
    p.vy = c.jump * (mud ? 0.82 : 1) * (p.inWater ? 0.82 : 1);
    p.ground = false; p.coyote = 0; p.jumping = true; p.on = null;
    p.curl = p.state === "roll";                         // out of a Spin Dash or a roll: still a ball
    if (p.state !== "roll") p.state = "run";
    SFX.jump();
  }
  /** Space again in the air: the runner's air action. */
  function airAction(p) {
    const c = p.c;
    if (p.inWater && c.swims) {                          // Chaos swims: a stroke for every press, as long as he likes
      p.vy = Math.max(p.vy, 6.5); p.jumping = false; p.curl = false; SFX.flap();
      burst(p.x, p.y + 0.2, [0xffffff, mixC(world.T.water, 0xffffff, 0.6)], 4, 2);
      return;
    }
    switch (c.air) {
      case "ballet": {                                     // Sonic Ballet: a second jump that homes on what's near
        if (p.airUses) return;
        p.airUses = 1;
        const t = homingTarget(p, 6.5);
        if (t) { p.state = "homing"; p.target = t; p.st = 0.6; p.curl = true; SFX.homing(); }
        else { p.vy = Math.max(p.vy, 9.5); p.vx = p.face * Math.max(Math.abs(p.vx), 10); p.balT = 0.32; p.curl = false; SFX.double(); }
        burst(p.x, p.y + 0.5, [0x9ad4ff, 0xffffff], 6, 3);
        break;
      }
      case "fly":                                          // Tails' tails and Rouge's wings: tap to climb, till tired
        if (p.inWater && srcOf(p, "air") !== "tails") return;
        if (p.state !== "fly") { if (p.flyLeft <= 0) return; p.state = "fly"; p.curl = false; p.jumping = false; }
        /* each stroke lifts, but not past the top of the stage: there is nothing to fly over */
        if (p.flyLeft > 0) { p.vy = p.y > H - 3 ? Math.min(p.vy, 0.5) : Math.min(Math.max(p.vy, 0) + (srcOf(p, "air") === "tails" ? 4.4 : 4), 5.2); SFX.flap(); }
        break;
      case "glide":                                        // Knuckles: hold Space
        if (p.state === "glide") return;
        p.state = "glide"; p.curl = false; p.jumping = false;
        p.vx = p.face * Math.max(Math.abs(p.vx), 5); SFX.glide();
        break;
      case "double":                                       // Amy: stops, and jumps again
        if (p.airUses) return;
        p.airUses = 1; p.vy = c.jump * 0.9; p.jumping = true; p.dblT = 0.2; SFX.double();
        burst(p.x, p.y, [0xf08ac0, 0xffffff], 6, 2);
        break;
      case "teleport":                                     // Chaos Control
        if (p.airUses >= 2) return;
        p.airUses++; chaosControl(p);
        break;
      case "float":                                        // Chaos Flight: a little more height, once
        if (p.airUses) return;
        p.airUses = 1; p.vy = Math.max(p.vy, 8.5); p.jumping = true; p.curl = false; SFX.double();
        burst(p.x, p.y + 0.1, [0x9ad8ff, 0xffffff], 7, 2);
        break;
      case "hover":                                        // Gamma's Flight Mode, Eggman's Egg Hover
        if (p.state === "fly" || p.flyLeft <= 0 || p.inWater) return;
        p.state = "fly"; p.curl = false; p.jumping = false; p.vy = Math.max(p.vy, c.sink ? 0 : 1.5); SFX.flap();
        break;
      case "jet":                                          // Metal Sonic: a burst of his jet, and a moment's hover
        if (p.airUses) return;
        p.airUses = 1; p.state = "jet"; p.st = 0.42; p.curl = false; p.jumping = false;
        p.vx = p.face * Math.max(Math.abs(p.vx), 18); p.vy = Math.max(p.vy, 1.2);
        burst(p.x - p.face * 0.4, p.y + 0.55, [0x80c0ff, 0xffffff, 0xfff070], 9, 3); SFX.dash();
        break;
      case "psy":                                          // Silver's Air Psycho Dash: ahead, a hover, then he floats down
        if (p.airUses) return;
        p.airUses = 1; p.state = "psy"; p.st = 0.5; p.curl = false; p.jumping = false;
        p.vx = p.face * Math.max(Math.abs(p.vx), 15.5); p.vy = Math.max(p.vy, 0.5);
        burst(p.x, p.y + 0.6, [0x70f0d0, 0xffffff], 9, 3); SFX.dash();
        break;
      case "launch": {                                     // Mighty
        /* against a wall, a wall jump (Knuckles' Chaotix): off it and up, the launch his again */
        for (const d of [p.face, -p.face]) {
          const wi = Math.floor(p.x + d * (c.w / 2 + 0.12));
          if (solid(tile(wi, Math.floor(p.y + 0.4))) && solid(tile(wi, Math.floor(p.y + 0.9)))) {
            p.face = -d; p.vx = -d * 9; p.vy = 12; p.jumping = true; p.curl = false; p.launchT = 0; p.airUses = 0; SFX.jump();
            burst(p.x + d * c.w / 2, p.y + 0.5, [0xffffff, 0xd8d0c0], 6, 3);
            return;
          }
        }
        if (p.airUses) return;                             // Shell Launch: curled, straight up
        p.airUses = 1; p.vy = Math.max(p.vy, 12); p.vx *= 0.35; p.curl = true; p.launchT = 0.42; p.jumping = false; SFX.double();
        burst(p.x, p.y + 0.2, [0xff4a4a, 0xffffff], 6, 2);
        break;
      }
    }
  }
  /* Shadow vanishes and is a few metres on: never through a wall, and nothing touches him in between. */
  function chaosControl(p) {
    const from = { x: p.x, y: p.y };
    const blocked = x => { for (let j = Math.floor(p.y + 0.1); j <= Math.floor(p.y + p.hh - 0.1); j++) {
      const i = Math.floor(x + p.face * p.c.w / 2); if (solid(tile(i, j)) && !isLip(p, i, j)) return true; } return false; };
    for (let d = 0; d < 3.6; d += 0.1) {
      if (blocked(p.x + p.face * 0.1)) break;
      p.x += p.face * 0.1;
      const gy = groundY(p.x, p.y + 0.3);                 // along a slope: up it, never into it
      if (gy !== null && gy > p.y) p.y = gy;
    }
    p.vy = Math.max(p.vy, 1.5); p.state = "teleport"; p.st = 0.28; p.inv = Math.max(p.inv, 0.3); p.curl = false; p.jumping = false;
    if (framesOf(p.c.sheet || p.c.id, "after")) effect(p.c.sheet || p.c.id, "after", from.x, from.y, p.face, 18, false, "body");
    burst(from.x, from.y + 0.5, [0xf03a4a, 0xffe060, 0xffffff], 8, 3);
    SFX.teleport();
  }
  function startCharge(p) { p.state = "charge"; p.curl = true; p.rev = 0.15; SFX.rev(0.1); }
  const dashK = c => c.dashK || (c.id === "shadow" ? 1.45 : 1.25);
  const dashFrom = c => c.dashFrom || c.id;           // whose dash this is (Emerl's copies one)
  function startDash(p, d) {
    const c = p.c;
    p.state = "dash"; p.face = d; p.st = c.dashT || (dashFrom(c) === "knuckles" ? 0.42 : 0.3); p.driveT2 = 0;
    p.vx = d * c.run * dashK(c);
    if (dashFrom(c) === "sonic" || dashFrom(c) === "tails") { p.vy = 4.5; p.ground = false; p.on = null; }    // Sonic Dash and Tails Hop are hops
    if (dashFrom(c) === "shadow" || c.dashInv) p.inv = Math.max(p.inv, p.st);                        // gone while he dashes; Chaos a puddle
    SFX.dash();
  }
  function startClimb(p, wall) { p.state = "climb"; p.wall = wall; p.face = wall; p.vx = 0; p.vy = 0; p.curl = false; p.grabT = 0.14; SFX.grab(); }
  /* Knuckles on a wall: Up and Down climb, over the top when it ends; Space leaps off. */
  function stepClimb(p, dir) {
    const c = p.c;
    p.vx = 0; p.vy = input.U ? 3.2 : input.D ? -3.2 : 0;
    const wx = p.x + p.wall * (c.w / 2 + 0.06);
    const wallMid = solid(tile(Math.floor(wx), Math.floor(p.y + p.hh * 0.5)));
    const wallFeet = solid(tile(Math.floor(wx), Math.floor(p.y + 0.05)));
    if (!wallMid) {
      if (wallFeet) {                                      // over the top: he pulls himself up onto the ledge
        p.state = "ledge"; p.vx = p.vy = 0;
        p.ledge = { t: 0, x0: p.x, y0: p.y, x1: p.x + p.wall * (c.w / 2 + 0.35), y1: Math.floor(p.y + 0.05) + 1 };
      } else p.state = "run";
      return;
    }
    if (input.jp) {
      p.state = "run"; p.face = -p.wall; p.vx = -p.wall * 7; p.vy = 10.5; p.jumping = true; p.curl = false; p.airUses = 0;
      input.jp = 0;                                        // the leap, not a glide as well
      SFX.jump();
    } else if (dir === -p.wall) p.state = "run";
  }

  /* Over the top of a wall: Sonic Advance's pull-up, up first and then onto the ledge. */
  const LEDGE_T = 0.32;
  function stepLedge(p, dt) {
    const L = p.ledge; L.t += dt;
    const k = Math.min(1, L.t / LEDGE_T), e = k * k * (3 - 2 * k);
    p.x = lerp(L.x0, L.x1, e); p.y = lerp(L.y0, L.y1, Math.min(1, e * 1.5)); p.vx = p.vy = 0;
    if (k >= 1) { p.state = "run"; p.ground = true; p.y = L.y1; p.on = null; p.onTile = null; p.airUses = 0; p.flyLeft = 0; p.landT = 0.1; p.ledge = null; }
  }

  // ---------------------------------------------------------------- the blows
  /** Z or X: which blow, from where they are and the direction held. */
  function startAttack(p, kind) {
    const c = p.c;
    let name;
    if (p.state === "dash" && kind === "heavy") return startBlow(p, "dashatk");
    if (p.ground && p.comboT > 0) {                         // just after a blow: the chain goes on
      const next = kind === "light" ? p.comboNext : /^atk[123]$/.test(p.comboLast) ? (input.U ? "upper" : input.D ? "aim" : "heavy") : null;
      p.comboT = 0;
      if (next === "aim") return startSeek(p);
      if (next) return startBlow(p, next);
    }
    if (!p.ground) {
      if (p.airMove) return;
      p.airMove = true;
      if (kind === "heavy" && input.D) return startSeek(p);
      if (kind === "light" && srcOf(p, "airatk") === "shadow") {         // his Homing Attack
        const t = homingTarget(p, 7.5);
        if (t) { p.state = "homing"; p.target = t; p.st = 0.6; p.curl = true; SFX.homing(); return; }
      }
      name = "airatk";
    } else if (kind === "light") name = "atk1";
    else if (input.U) name = "upper";
    else if (input.D) return startSeek(p);
    else if (p.state === "dash" || p.state === "roll" || Math.abs(p.vx) > c.run * 0.85) name = "dashatk";
    else name = "heavy";
    startBlow(p, name);
  }
  function startBlow(p, name) {
    const bw = srcOf(p, name), b = blow(castOf(bw), name), n = (framesOf(p.c.sheet || p.c.id, name) || framesOf(p.c.sheet || p.c.id, "atk1")).length;
    const h0 = Math.floor(n * 0.3), h1 = Math.max(h0, Math.ceil(n * 0.7) - 1);
    p.state = "atk"; p.curl = false;
    p.mv = { name, t: 0, fps: b.fps, n, reach: b.reach, step: b.step, h0, h1, live: false, queue: null, air: !p.ground, struck: false,
             speed: Math.max(Math.abs(p.vx), p.c.run * 0.9) };
    if (name === "airatk") p.vy = Math.max(p.vy, 4);
    /* Cream's blows are Cheese's: out in front of her, keeping time with her */
    if (CHEESE[name] && framesOf(bw, CHEESE[name])) {
      const nm = CHEESE[name], up = name === "upper" ? 0.95 : 0.55;
      effect(bw, nm, p.x + p.face * 0.8, p.y + up, p.face, framesOf(bw, nm).length * b.fps / n, true, "fx", 1, 0, { p, ox: 0.8, oy: up });
    }
    SFX.swing(name === "heavy" || name === "dashatk" || name === "upper");
  }
  function stepBlow(p, dt) {
    const m = p.mv, c = p.c;
    m.t += dt;
    const i = Math.floor(m.t * m.fps);
    m.live = i >= m.h0 && i <= m.h1;
    if (m.name === "dashatk") p.vx = p.face * m.speed * (i <= m.h1 ? 1 : 0.45);
    else if (!m.air) p.vx = p.face * m.step * (i <= m.h1 ? 1 : 0.2);
    // Amy's upper is her hammer swung at the ground: a Hammer Jump
    if (srcOf(p, "upper") === "amy" && m.name === "upper" && i >= m.h0 && !m.launched) { m.launched = true; p.vy = 16.5; p.ground = false; p.on = null; SFX.spring(); }
    if (m.live) {
      const up = m.name === "upper" ? 0.9 : 0;
      const x0 = p.face > 0 ? p.x : p.x - c.w / 2 - m.reach, x1 = p.face > 0 ? p.x + c.w / 2 + m.reach : p.x;
      tok(m, blowDmg(p, m.name), m.name === "atk1" || m.name === "atk2" ? 0.35 : 0.85);
      if (strike(x0, x1, p.y + 0.08, p.y + p.hh + up, blowKick(p)) && !m.struck) landBlow(p);
    }
    // the combo: the next blow, pressed once this one has landed
    if (i >= m.h0 && !m.air) {
      if (input.zp && m.name === "atk1") m.queue = "atk2";
      else if (input.zp && m.name === "atk2") m.queue = "atk3";
      else if (input.xp && /^atk[123]$/.test(m.name)) m.queue = input.U ? "upper" : input.D ? "aim" : "heavy";
    }
    if (i >= m.n) {
      p.mv = null; p.state = "run";
      if (m.queue && p.ground) { if (m.queue === "aim") startSeek(p); else startBlow(p, m.queue); }
      else if (/^atk[123]$/.test(m.name)) { p.comboT = 0.25; p.comboLast = m.name; p.comboNext = m.name === "atk1" ? "atk2" : m.name === "atk2" ? "atk3" : null; }
    }
  }
  /** The knock a blow gives what it hits: forward and up, by its row and the runner's weight. */
  function blowKick(p) {
    const H = HITS[p.mv.name] || HITS.atk1, k = hitWeight(castOf(srcOf(p, p.mv.name)), p.mv.name);
    return { vx: p.face * H.kick[0] * k, vy: H.kick[1] * k };
  }
  /** A blow connects: a hit spark in the runner's colour where it met, a flash, and the picture
      stops dead for a few hundredths of a second and jolts -- longest and hardest for a finisher,
      while what it hit shakes white and is then thrown. Once a blow. */
  function landBlow(p) {
    const m = p.mv; if (!m || m.struck) return;
    m.struck = true;
    const H = HITS[m.name] || HITS.atk1, k = hitWeight(castOf(srcOf(p, m.name)), m.name), col = HIT_C[p.c.id] || 0xffffff;
    const h = world.hitAt || { x: p.x + p.face * (p.c.w / 2 + m.reach * 0.6), y: p.y + p.hh * 0.55 };
    hitSpark(h.x, h.y, H.spark * k, col);
    flash(h.x, h.y, H.spark * 1.5 * k, col);
    hitStop(H.stop * k); shakeCam(H.shake * k);
    SFX.hit(); if (H.heavy) SFX.impact();
  }
  /* Down + X: the aim attack -- a dash at the nearest thing, then the blow. */
  function startSeek(p) {
    p.target = homingTarget(p, 8); p.state = "seek"; p.st = p.target ? 0.7 : 0.25; p.curl = false;
    if (!p.ground) p.airMove = true;
    SFX.homing();
  }
  function stepSeek(p) {
    const t = p.target;
    const strikeNow = () => { const air = !p.ground; startBlow(p, "aim"); p.mv.air = air; p.vx = p.face * 2; if (air) p.vy = Math.max(p.vy, 3); };
    if (t && t.alive !== false) {
      const ty = (t.y || 0) + (t.h ? t.h / 2 : 0.4), dx = t.x - p.x, dy = ty - (p.y + 0.5), d = Math.hypot(dx, dy) || 1;
      p.face = sgn(dx) || p.face;
      if (d < 1.1 || p.st <= 0) return strikeNow();
      p.vx = dx / d * 16; p.vy = p.ground && dy < 0.6 ? 0 : dy / d * 16;
    } else {
      p.vx = p.face * 14;
      if (p.st <= 0) strikeNow();
    }
  }
  function stepHoming(p) {
    const t = p.target;
    if (!t || t.alive === false || p.st <= 0) { p.state = "run"; p.vx = clamp(p.vx, -p.c.run, p.c.run); return; }
    const ty = (t.y || 0) + (t.h ? t.h / 2 : 0.4), dx = t.x - p.x, dy = ty - (p.y + 0.5), d = Math.hypot(dx, dy) || 1;
    p.vx = dx / d * 24; p.vy = dy / d * 24; p.face = sgn(dx) || p.face;
  }
  function homingTarget(p, range) {
    let best = null, bd = range;
    const consider = (t, x, y) => {
      const dx = x - p.x, dy = y - (p.y + 0.5);
      if (dx * p.face < -0.3 || dy > 3.5 || dy < -6) return;
      const d = Math.hypot(dx, dy);
      if (d < bd) { bd = d; best = t; }
    };
    for (const e of world.enemies) if (e.alive && !e.hidden && !e.guard) consider(e, e.x, e.y + e.h / 2);
    for (const e of world.ents) if (e.t === "spring") consider(e, e.x, e.y + 0.3);
      else if ((e.t === "balloon" && !e.back) || e.t === "bumper") consider(e, e.x, e.y - 0.4);
    for (const b of world.solids) if (b.alive) consider(Object.assign(b, { x: (b.x0 + b.x1) / 2, y: b.y0, h: 1 }), (b.x0 + b.x1) / 2, b.y0 + 0.5);
    if (battle) for (const q of battle.fs) if (rivals(p, q) && !q.ko && !q.out) consider(q, q.x, q.y + q.hh / 2);
    return best;
  }

  // ---------------------------------------------------------------- the specials
  /** C: the shot; Up + C the power; Down + C the trap, or sets off the traps already down. */
  function startSpecial(p) {
    const c = p.c, air = !p.ground, kind = input.U ? "power" : input.D ? "trap" : "shot";
    if (kind === "trap" && world.traps.some(t => !t.gone && mine(t, p))) { world.traps.forEach(t => { if (!t.gone && mine(t, p)) boomTrap(t); }); return; }
    if (p.cd[kind] > 0 || (air && p.airSp)) return;
    if (air) p.airSp = true;
    const slot = (air ? "air" : "") + kind;
    let S = SPECIALS[c.id] && SPECIALS[c.id][slot];
    if (c.emerl) S = emerlSpecial(p, slot);           // Emerl: the move he copied in that slot, in his own frames
    p.cd[kind] = kind === "power" ? 1.4 : kind === "trap" ? 0.7 : 0.45;
    p.state = "special"; p.curl = false; p.jumping = false;
    p.sp = Object.assign({ t: 0, fired: false, air, kind }, S, { n: (framesOf(c.sheet || c.id, S.body) || [0]).length * (S.loops || 1) });
    if (air && !S.dive) p.vy = Math.max(p.vy, 1);
    SFX.cast();
  }
  function stepSpecial(p, dt) {
    const s = p.sp;
    s.t += dt;
    if (s.windup) return stepWindup(p, s, dt);
    if (s.charged && stepCharged(p, s, dt)) return;
    const i = Math.floor(s.t * s.fps);
    if (!s.air) p.vx = s.step ? p.face * s.step : p.vx * Math.pow(0.001, dt);
    if (!s.fired && s.charge && s.at > 1) {
      if (!s.hum) { s.hum = true; SFX.charge(s.at / s.fps); }
      s.glow = (s.glow || 0) - dt;
      if (s.glow <= 0 && s.bits !== 0 && i >= (s.gfrom || 0)) { s.glow = s.muzzle ? 0.02 : 0.03; gather(p, s.charge, s); }
    }
    if (!s.fired && i >= s.at) { s.fired = true; fire(p, s); if (p.state !== "special") { p.sp = null; return; } }
    if (s.shield && s.fired && tok(s, 6)) strike(p.x - 1.0, p.x + 1.0, p.y - 0.1, p.y + 1.9, { r: 10, cx: p.x, cy: p.y + 0.9 });   // the Black Shield breaks what it meets
    if (i >= s.n) {
      p.sp = null; p.state = "run";
      if (s.shield) effect(s.fxWho || p.c.id, "fx.power", p.x, p.y + 0.9, p.face, 14, true, "fx", 1.3);        // and breaks up
      if (s.drive) {
        p.state = "roll"; p.curl = true; p.vx = p.face * 19; p.driveT = 0.42; SFX.roll();
        const dw = s.fxWho || p.c.id;
        if (p.ground && framesOf(dw, "fx.dust")) effect(dw, "fx.dust", p.x - p.face * 0.6, p.y, -p.face, 22, false);
        impact(p.x - p.face * 0.3, p.y + 0.4, { c: 0x9ad4ff, flash: 1.8, shake: 0.12 });
      }
    }
  }
  /* Gamma's Devastator, held: past its `at` frame with the button still down he charges -- the
     charging frames, round and round, energy gathering at the cannon -- till it is let go or
     full; then the charged release, bigger and further the longer it was held. */
  function stepCharged(p, s, dt) {
    const H = s.charged;
    if (!s.phase) {
      if (s.fired || Math.floor(s.t * s.fps) < H.at || !input.C || !framesOf(p.c.sheet || p.c.id, H.body)) return false;
      s.phase = "charge"; s.ct = 0; s.body = H.body; s.t = 0; SFX.charge(H.max);
    }
    if (s.phase !== "charge") return false;              // the release plays as any special does
    s.ct += dt;
    p.vx *= Math.pow(0.001, dt); if (s.air) p.vy = Math.max(p.vy, -0.5);
    s.glow = (s.glow || 0) - dt;
    if (s.glow <= 0) { s.glow = 0.025; gather(p, s.charge || 0xffffff, { muzzle: s.muzzle, t: Math.min(s.ct, H.max), fps: 1, at: H.max }); }
    if (!input.C || s.ct >= H.max) {
      const k = 1 + Math.min(1, s.ct / H.max) * 0.8;
      s.phase = "release"; s.body = H.release; s.t = 0; s.at = H.rat; s.n = framesOf(p.c.sheet || p.c.id, H.release).length;
      s.k = (s.k || 1) * k; s.life *= k; s.speed *= 1.1; s.pow = Object.assign({}, s.pow, { flash: s.pow.flash * k, shake: s.pow.shake * k });
    }
    return true;
  }
  /* A special that winds up (Sonic Wave, Sonic Storm): he spins in place, the spin speeding up
     from a turn to a blur, dust kicking up and then sparks; at the top of it, the blast, a flash
     of light, a jolt through the picture, and he is thrown back. */
  function stepWindup(p, s, dt) {
    const k = Math.min(1, s.t / s.windup);
    if (!s.sound) { s.sound = true; SFX.windup(s.windup); }
    s.spin = (s.spin || 0) + dt * (7 + 48 * k * k);
    p.vx *= Math.pow(0.0005, dt);
    if (s.air) p.vy = Math.max(p.vy, -0.4);
    s.puff = (s.puff || 0) - dt;
    if (s.puff <= 0) {
      s.puff = 0.05 - k * 0.025;
      if (k > 0.4 && Math.random() < 0.55) revSpark(p);
    }
    if (k >= 1) {
      s.fired = true; fire(p, s);
      const f = p.face;
      flash(p.x + f * 0.9, p.y + (s.air ? 0.3 : 0.55), 3.2);
      const fy = p.y + (s.air ? 0.35 : 0.5);
      const fw = s.fxWho || p.c.id;
      if (framesOf(fw, "fx.flare")) effect(fw, "fx.flare", p.x + f * 1.3, fy, f, 26, true, "fx", 1.1);
      if (framesOf(fw, "fx.crescent")) effect(fw, "fx.crescent", p.x + f * 1.1, fy, f, 30, true, "ghost", 1.8);
      burst(p.x + f * 0.8, p.y + 0.4, [0xffffff, 0xcfe8ff, 0x9ad4ff], 16, 6);
      if (p.ground && framesOf(fw, "fx.dust")) effect(fw, "fx.dust", p.x - f * 0.5, p.y, -f, 24, false);
      shakeCam(0.28); SFX.blast();
      p.sp = null; p.state = "recoil"; p.st = 0.32; p.curl = false;
      p.vx = -f * s.recoil;
      if (s.air) p.vy = Math.max(p.vy, 3.5);
    }
  }
  /** A spark off a hard rev (Sonic Advance's): somewhere about the runner's feet and front. */
  function revSpark(p) {
    if (!framesOf(p.c.id, "fx.spark")) return;
    effect(p.c.id, "fx.spark", p.x + (Math.random() - 0.3) * p.face * 0.9, p.y + 0.15 + Math.random() * 0.55, Math.random() < 0.5 ? 1 : -1, 32, true);
  }
  /** A burst of light that swells and fades. */
  function flash(x, y, size, color) {
    const sp = new THREE.Sprite(glowMat(color || 0xffffff, 0.95)); sp.position.set(x, y, 0.4); sp.scale.setScalar(size * 0.3);
    world.group.add(sp); world.flashes.push({ s: sp, size, t: 0, life: 0.24 });
  }
  /** A blow landing: a flash of its colour, a jolt through the picture, sparks, and for the
      heaviest a freeze-frame -- everything stops for a few hundredths of a second. With `cone`
      (a facing) the sparks blow out of a muzzle the way the shot goes (`down` its slope), not
      up in a spray; with `bits: 0` there are none. */
  function impact(x, y, o) {
    if (!o) return;
    flash(x, y, o.flash || 1.5, o.c);
    if (o.shake) shakeCam(o.shake);
    if (o.stop) hitStop(o.stop);
    if (o.bits === 0) return;
    const cols = [o.c || 0xffffff, 0xffffff, mixC(o.c || 0xffffff, 0x000000, 0.25)];
    if (o.cone) {
      const a0 = Math.atan2(-(o.down || 0), 1);
      for (let k = 0, n = Math.round(10 + (o.flash || 1.5) * 4); k < n; k++) {
        const a = a0 + (Math.random() - 0.5) * 0.9, sp = 4 + Math.random() * 7, life = 0.12 + Math.random() * 0.12;
        world.parts.list.push({ x, y, z: (Math.random() - 0.5) * 0.3, vx: o.cone * Math.cos(a) * sp, vy: Math.sin(a) * sp + 9 * life, vz: (Math.random() - 0.5) * 2,
                                life, s: 0.05 + Math.random() * 0.05, c: cols[k % 3] });
      }
      return;
    }
    burst(x, y, cols, Math.round(8 + (o.flash || 1.5) * 4), 3 + (o.flash || 1.5));
  }
  /* energy gathering to the hand while a move winds up; with a muzzle, to the mouth of the
     cannon (or the hand) itself, a glow swelling there as it fills */
  function gather(p, color, s) {
    const m = s && s.muzzle;
    if (m) {
      const hx = p.x + p.face * m[0], hy = p.y + m[1], L = 0.16, fill = Math.min(1, s.t * s.fps / s.at);
      for (let k = 0; k < 3; k++) {
        const a = Math.random() * PI * 2, r = 0.4 + Math.random() * 0.35, x = hx + Math.cos(a) * r, y = hy + Math.sin(a) * r;
        world.parts.list.push({ x, y, z: 0.2, vx: (hx - x) / L, vy: (hy - y) / L + 9 * L, vz: 0, life: L, s: 0.06, c: Math.random() < 0.5 ? color : 0xffffff });
      }
      if ((s.glows = (s.glows || 0) + 1) % 3 === 1) flash(hx, hy, 0.45 + fill * 0.6, color);
      return;
    }
    const hx = p.x + p.face * 0.55, hy = p.y + p.hh * 0.55;
    for (let k = 0; k < 2; k++) {
      const a = Math.random() * PI * 2, r = 0.7 + Math.random() * 0.4, x = hx + Math.cos(a) * r, y = hy + Math.sin(a) * r;
      world.parts.list.push({ x, y, z: 0.2, vx: (hx - x) * 6, vy: (hy - y) * 6 + 2.2, vz: 0, life: 0.16, s: 0.07, c: Math.random() < 0.5 ? color : 0xffffff });
    }
  }
  /* A hit spark: an eight-pointed star of a landed blow, drawn in pixels -- the runner's colour
     round a white heart, popping out and gone in a few hundredths of a second (it holds through
     the freeze-frame). */
  let SPARK_TEX = null;
  function sparkMat(color) {
    if (!SPARK_TEX) {
      const N = 32, c = document.createElement("canvas"); c.width = c.height = N;
      const g = c.getContext("2d"); g.fillStyle = "#fff"; g.beginPath();
      for (let k = 0; k < 16; k++) {
        const a = k * PI / 8, r = k % 2 ? 3.6 : k % 4 === 0 ? 15.5 : 9;
        g[k ? "lineTo" : "moveTo"](16 + Math.cos(a) * r, 16 + Math.sin(a) * r);
      }
      g.closePath(); g.fill();
      SPARK_TEX = new THREE.CanvasTexture(c);
      SPARK_TEX.magFilter = SPARK_TEX.minFilter = THREE.NearestFilter; SPARK_TEX.generateMipmaps = false;
    }
    return new THREE.SpriteMaterial({ map: SPARK_TEX, color, alphaTest: 0.5, depthWrite: false, rotation: (Math.random() - 0.5) * 0.7 });
  }
  function hitSpark(x, y, size, color) {
    const a = new THREE.Sprite(sparkMat(color)), b = new THREE.Sprite(sparkMat(0xffffff));
    b.material.rotation = a.material.rotation;
    a.position.set(x, y, 0.45); b.position.set(x, y, 0.47);
    a.scale.setScalar(size); b.scale.setScalar(size * 0.5);
    world.group.add(a, b); world.flashes.push({ s: a, s2: b, size, t: 0, life: 0.17, spark: true });
  }
  let fireDmg = 8;
  function fire(p, s) {
    const who = s.fxWho || p.c.id, f = p.face;           // (Emerl's copied moves: their source's effects)
    fireDmg = spDmg(p, s);
    // the release: a flash at the hand, a jolt, and a push back
    const mz = s.muzzle;
    if (s.pow && !s.dive && !s.blast) {
      if (mz) impact(p.x + f * mz[0], p.y + mz[1], Object.assign({ cone: f, down: s.air ? s.down || 0 : 0 }, s.pow));
      else impact(p.x + f * 0.75, p.y + p.hh * 0.55, s.pow);
      if (s.pow.recoil) { p.vx = -f * s.pow.recoil; if (s.air) p.vy = Math.max(p.vy, 2.5); }
    }
    const k = s.k || s.ghost || 1;
    if (s.wave) shoot(who, { fx: s.wave, x: p.x + f * 0.7, y: p.y, vx: f * s.speed, vy: 0, life: s.life, ground: true,
                             w: 1.0 * k, h: 1.3 * k, k, face: f, ghost: s.ghost, trail: s.trail });
    else if (s.fly) {
      const held = s.hold && input.C ? s.hold : 0;
      shoot(who, { fx: s.fly, x: mz ? p.x + f * (mz[0] + 0.3 * k) : p.x + f * (0.6 + (s.ahead || 0)), y: mz ? p.y + mz[1] : p.y + p.hh * 0.55,
                   vx: f * s.speed, vy: -(s.down || 0) * s.speed,
                   life: s.life + held, loop: s.loop, mid: true, w: 0.8 * k, h: 0.8 * k, k, face: f, ghost: s.ghost, trail: s.trail,
                   range: s.range, bursts: s.bursts, boom: s.boom, land: s.land });
      if (!s.ghost) SFX.shot();
    } else if (s.lob) {
      shoot(who, { fx: s.lob, x: p.x + f * 0.5, y: p.y + p.hh + 0.5, vx: f * s.speed, vy: s.rise, g: 26, life: 3, loop: true, mid: true,
                   w: 0.9 * k, h: 0.9 * k, k, face: f, bursts: 1.8, trail: s.trail, land: s.land, bits: s.bits });
      SFX.shot();
    } else if (s.area) {
      const ax = p.x + f * s.ax, ay = p.y + s.ay;
      effect(who, s.area, ax, ay, f, 22, true, "fx", k);
      tok(s, spDmg(p, s));
      if (strike(ax - s.w / 2, ax + s.w / 2, ay - s.h / 2, ay + s.h / 2, { r: 11, cx: ax - f * 0.6, cy: ay - 0.3 })) hitStop(0.05);
      SFX.boom();
    } else if (s.drive) {
      shoot(who, { fx: "fx.ring", x: p.x + f * 0.8, y: p.y + 0.5, vx: f * 14, vy: 0, life: 0.42, loop: true, mid: true, w: 0.5, h: 0.5, face: f, ring: true, trail: 0xfff070 });
      SFX.ring();
    } else if (s.dive) { p.diveS = s; startDive(p, s.dive); }
    else if (s.tornado) { p.state = "tornado"; p.tor = { t: s.t, from: s.tornado[0], to: s.tornado[1], left: 1.4, body: s.body, fps: s.fps, air: s.air }; SFX.swing(true); }
    else if (s.trap) setTrap(p, s);
    else if (s.blast) {                                    // Gamma's Meltdown: his reactor goes up, and him with it
      const by = p.y + 1.0;
      effect(who, "fx.boom", p.x, by, f, 16, true, "fx", s.k);
      impact(p.x, by, s.pow); burst(p.x, by, [0xfff3a0, 0xf08a24, 0xffffff, 0xe8403a], 30, 9);
      tok(s, 22); strike(p.x - s.w / 2, p.x + s.w / 2, p.y - 0.6, p.y + s.h, { r: 14, cx: p.x, cy: p.y + 0.4 });
      if (battle) p.hp = Math.max(1, p.hp - 10);          // (in a battle it costs him health)
      else if (p.carrots > 0) { p.carrots = Math.max(0, p.carrots - 10); flashHud(); }   // (on a stage, rings)
      p.inv = Math.max(p.inv, 1.2); SFX.boom(); SFX.impact();
    } else if (s.shield) { p.inv = Math.max(p.inv, (s.n - s.at) / s.fps + 0.2); SFX.set(); }   // Metal's Black Shield: nothing gets through
  }
  /* Air powers that dive: Sonic Meteor (curled, down and ahead), Spiral Dive (Rouge, drills
     straight down through rock), Major Eruption (Knuckles: dives, burrows, bursts out) and
     Air Chaos Burst (Shadow drops, then bursts). */
  function startDive(p, kind) {
    p.state = "dive"; p.dive = kind; p.diveT = 0; p.curl = kind === "meteor" || kind === "hammer";
    p.vx = kind === "meteor" ? p.face * 11 : 0;
    SFX.dive();
  }
  function stepDive(p, dt) {
    p.diveT += dt;
    p.vy = p.dive === "burst" || p.dive === "hammer" ? -24 : p.dive === "meteor" ? -14 : -17;
    if (p.dive !== "meteor") p.vx = 0;
    // through cracked rock and crates on the way down
    for (let i = Math.floor(p.x - p.c.w / 2 + 0.05); i <= Math.floor(p.x + p.c.w / 2 - 0.05); i++) {
      const j = Math.floor(p.y - 0.05), t = tile(i, j);
      if (t === "X" || t === "B") breakTile(i, j);
    }
    if (p.dive === "drill" && p.diveT > 0.9) p.state = "run";      // high up, it stops short
  }
  function diveLand(p, fell) {
    const kind = p.dive;
    if (kind === "meteor" || kind === "drill") {
      tok(p.diveS || p, 12); strike(p.x - 1.0, p.x + 1.0, p.y - 0.2, p.y + 1.2, { r: 9, cx: p.x, cy: p.y });
      burst(p.x, p.y + 0.1, [0xd8d0c0, 0xffffff, kind === "drill" ? 0xb070c0 : 0x5a9ae0], 16, 5);
      impact(p.x, p.y + 0.3, p.diveS && p.diveS.pow);
      const dw = (p.diveS && p.diveS.fxWho) || p.c.id;
      if (framesOf(dw, "fx.dust")) { effect(dw, "fx.dust", p.x - 0.5, p.y, -1, 22, false); effect(dw, "fx.dust", p.x + 0.5, p.y, 1, 22, false); }
      p.state = "run"; p.vy = 6; p.ground = false; SFX.stomp(); SFX.impact();
    } else if (kind === "hammer") {                       // Mighty's Hammer Drop: a shockwave both ways, then he uncurls
      effect((p.diveS && p.diveS.fxWho) || p.c.id, "fx.power", p.x, p.y, p.face, 20, false, "fx", 1.35);
      impact(p.x, p.y + 0.3, p.diveS && p.diveS.pow);
      tok(p.diveS || p, 13); strike(p.x - 2.4, p.x + 2.4, p.y - 0.2, p.y + 1.3, { r: 12, cx: p.x, cy: p.y });
      SFX.boom(); SFX.impact(); p.curl = false;
      p.state = "erupt"; p.vx = 0; p.er = { t: 0, body: p.c.emerl ? "sp.airpower" : "airpower", from: 3, to: 8, at: 99, fps: 18, fired: true };
    } else {
      p.state = "erupt"; p.vx = 0;
      const ab = p.c.emerl ? "sp.airpower" : "airpower", an = (framesOf(p.c.sheet || p.c.id, ab) || [0]).length - 1;
      p.er = kind === "erupt" ? { t: 0, body: ab, from: Math.min(4, an), to: Math.min(16, an), at: 10, fps: 18, r: 1.9, fired: false }
                              : { t: 0, body: ab, from: Math.min(6, an), to: Math.min(13, an), at: 1, fps: 18, r: 1.9, fired: false, fx: "fx.power" };
    }
  }
  function stepErupt(p, dt) {
    const e = p.er; e.t += dt; p.vx = 0;
    const i = e.from + Math.floor(e.t * e.fps);
    if (!e.fired && i >= e.from + e.at) {
      e.fired = true;
      const ew = (p.diveS && p.diveS.fxWho) || p.c.id;
      if (e.fx) {                                          // Shadow's Air Chaos Burst, kicking up dust
        effect(ew, e.fx, p.x, p.y + 0.7, p.face, 22, true, "fx", 1.45);
        if (framesOf(ew, "fx.dust")) { effect(ew, "fx.dust", p.x - 0.7, p.y, -1, 20, false); effect(ew, "fx.dust", p.x + 0.7, p.y, 1, 20, false); }
      } else effect(ew, "fx.boom", p.x, p.y + 0.6, p.face, 22, true, "fx", 1.5);   // Knuckles' Major Eruption: the blast alone
      impact(p.x, p.y + 0.7, p.diveS && p.diveS.pow);
      tok(e, 14); strike(p.x - e.r, p.x + e.r, p.y - 0.3, p.y + 2.2, { r: 12, cx: p.x, cy: p.y });
      SFX.boom(); SFX.impact();
    }
    if (i > e.to) { p.state = "run"; p.er = null; }
  }
  /* Amy's Girl Tornado: the hammer swung round and round, carrying her along. */
  function stepTornado(p, dt) {
    const T = p.tor; T.t += dt;
    const i = Math.floor(T.t * T.fps);
    if (i >= T.from) {
      T.left -= dt;
      p.vx = p.face * (T.air ? 3.5 : 4.5);
      const col = HIT_C[p.c.id] || 0xff80c0;
      if ((T.hitT = (T.hitT || 0) - dt) <= 0) { T.hitT = 0.22; T.tok = {}; }    // round and round: it can hit again each turn
      tok(T.tok, 3, 0.5);
      if (strike(p.x - 0.9, p.x + 0.9, p.y + 0.05, p.y + p.hh + 0.2, { vx: p.face * 10, vy: 8 })) { impact(p.x + p.face * 0.6, p.y + 0.6, { c: col, flash: 1.4, shake: 0.08 }); hitStop(0.03); SFX.hit(); }
      T.whirl = (T.whirl || 0) - dt;
      if (T.whirl <= 0) {                                  // the wind of the swing, round and round
        T.whirl = 0.035; const a = T.t * 18;
        world.parts.list.push({ x: p.x + Math.cos(a) * 0.9, y: p.y + 0.5 + Math.sin(a) * 0.25, z: Math.sin(a) * 0.6, vx: -Math.sin(a) * 4, vy: 2, vz: 0, life: 0.22, s: 0.07, c: Math.random() < 0.5 ? mixC(col, 0xffffff, 0.3) : 0xffffff });
      }
      if ((T.swish = (T.swish || 0) - dt) <= 0) { T.swish = 0.18; SFX.swing(true); }
      if (T.left <= 0) { p.state = "run"; p.tor = null; }
    }
  }

  // ---------------------------------------------------------------- shots, effects and traps
  /** A shot: a card of the runner's sheet that flies and hits what it meets. */
  function shoot(who, o) {
    const card = makeCard(who, o.ghost ? "ghost" : "fx"); world.group.add(card);
    world.shots.push(Object.assign({ card, who, t: 0, life0: o.life, gone: false, owner: actor, dmg: fireDmg }, o));
  }
  /** An effect that only shows: plays once where it is put. */
  function effect(who, name, x, y, face, fps, mid, kind, k, from, follow) {
    const card = makeCard(who, kind === "body" ? "body" : "fx"); world.group.add(card);
    world.fx.push({ card, name, x, y, face, fps, mid, k, t: 0, from: from || 0, n: framesOf(who, name).length - (from || 0), follow });
  }
  function setTrap(p, s) {
    const live = world.traps.filter(t => !t.gone && mine(t, p));
    if (s.one) live.forEach(boomTrap);                   // Psycho Orb: one at a time
    else if (live.length >= 2) boomTrap(live[0]);
    const tw = s.fxWho || p.c.id;                        // (whose trap it is: Emerl's copies look like their source's)
    const f = p.face, card = makeCard(tw, s.faint ? "faint" : "fx"), float = s.trap === "float"; world.group.add(card);
    world.traps.push({ card, who: tw, owner: p, kind: s.trap, x: p.x + f * 0.7, y: p.y + (s.flies || float ? 1.0 : 0), vx: float ? f * 7 : s.toss ? f * (s.far || 3) : 0, vy: s.toss ? 2 : 0,
                       t: 0, life: s.trap === "orbit" ? 6 : 9, a: 0, flies: !!s.flies || float, grounded: !s.toss && !s.flies && !float && s.trap !== "orbit", gone: false, face: f });
    SFX.set();
  }
  function boomTrap(t) {
    if (t.gone) return;
    t.gone = true; world.group.remove(t.card); t.card.geometry.dispose();
    const by = t.y + (t.flies || t.kind === "orbit" ? 0 : 0.5), knux = t.who === "knuckles";   // his Mole Bomb: the blast alone
    const L = TRAP_LOOK[t.who] || {}, col = L.boom ? HIT_C[t.who] : 0xffb040;
    if (L.boom) effect(t.who, L.boom, t.x, L.bmid ? by : t.y, 1, 18, !!L.bmid, "fx", L.bk || 1.4, L.bfrom);   // Cream Cracker, Chaos Splash
    else effect(t.who, "fx.boom", t.x, by, 1, 22, true, "fx", 1.6);
    if (!knux) burst(t.x, by, L.boom ? [col, 0xffffff, mixC(col, 0xffffff, 0.5)] : [0xfff3a0, 0xf08a24, 0xffffff, 0xe8403a], 24, 7);
    impact(t.x, by, { c: col, flash: 3.6, shake: 0.28, stop: 0.05, bits: knux ? 0 : 1 });
    const a0 = actor; actor = t.owner || actor; tok(t, 12);
    strike(t.x - 1.5, t.x + 1.5, t.y - 0.6, t.y + 1.8, { r: 11, cx: t.x, cy: by - 0.4 });
    actor = a0;
    SFX.boom(); SFX.impact();
  }
  /* what a hunting trap goes after: a badnik, or in a battle a fighter of the other side */
  function nearestFoe(x, y, range, owner) {
    let best = nearestEnemy(x, y, range), bd = best ? Math.hypot(best.x - x, best.y + best.h / 2 - y) : range;
    if (battle) for (const q of battle.fs) if (rivals(owner, q) && !q.ko && !q.out) { const d = Math.hypot(q.x - x, q.y + q.hh / 2 - y); if (d < bd) { bd = d; best = q; } }
    return best;
  }
  function nearestEnemy(x, y, range) {
    let best = null, bd = range;
    for (const e of world.enemies) if (e.alive && !e.hidden) { const d = Math.hypot(e.x - x, e.y + e.h / 2 - y); if (d < bd) { bd = d; best = e; } }
    return best;
  }
  function stepShots(dt) {
    const w = world;
    for (const s of w.shots) {
      if (s.gone) continue;
      actor = s.owner || null; tok(s, s.dmg || 8);
      s.t += dt; s.life -= dt;
      if (s.g) s.vy -= s.g * dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.ground) { const gy = groundY(s.x, s.y); if (gy === null) s.life = 0; else s.y = gy; }
      const ty = s.mid ? s.y : s.y + 0.4, t = tile(Math.floor(s.x), Math.floor(ty));
      if (t === "X" || t === "B") breakTile(Math.floor(s.x), Math.floor(ty));
      else if (solid(t) || (s.mid && (t === "/" || t === "\\"))) { if (s.bursts) boomAt(s.x, s.y, s.bursts, s); s.life = 0; }
      if (s.life > 0) {
        const n = strike(s.x - s.w / 2, s.x + s.w / 2, s.mid ? s.y - s.h / 2 : s.y, s.mid ? s.y + s.h / 2 : s.y + s.h, s.bursts ? null : { vx: sgn(s.vx) * 11, vy: 5 });
        if (n) { SFX.hit(); if (!s.bursts) { impact(s.x, s.mid ? s.y : s.y + 0.5, { c: s.trail || 0xffffff, flash: 1.3, shake: 0.06 }); hitStop(0.03); } }
        if (n && s.bursts) { boomAt(s.x, s.y, s.bursts, s); s.life = 0; }
      }
      if (s.ring) { const o = s.owner || player; if (Math.abs(o.x - s.x) < 0.7 && o.state === "roll") s.life = 0; }
      if (s.trail && s.bits !== 0 && Math.random() < 0.7) world.parts.list.push({ x: s.x - sgn(s.vx) * 0.35 * (s.k || 1), y: (s.mid ? s.y : s.y + 0.3 + Math.random() * 0.8) + (Math.random() - 0.5) * 0.3,
        z: (Math.random() - 0.5) * 0.3, vx: -s.vx * 0.06, vy: 0.5 + Math.random(), vz: 0, life: 0.22, s: 0.07, c: Math.random() < 0.6 ? s.trail : 0xffffff });
      if (s.ghost && !s.trail && Math.random() < 0.6) world.parts.list.push({ x: s.x - sgn(s.vx) * 0.5, y: s.y + (s.mid ? 0 : 0.2 + Math.random() * 0.9), z: (Math.random() - 0.5) * 0.4,
        vx: -s.vx * 0.08, vy: 1 + Math.random() * 1.5, vz: 0, life: 0.25, s: 0.06, c: Math.random() < 0.5 ? 0xffffff : 0xcfe8ff });
      if (s.y < -3) s.life = 0;
      if (s.life <= 0) { s.gone = true; w.group.remove(s.card); s.card.geometry.dispose(); }
    }
    actor = null;
    if (w.shots.length > 30) w.shots = w.shots.filter(s => !s.gone);
    for (const f of w.flashes) {
      if (f.gone) continue;
      f.t += dt; const k = f.t / f.life;
      if (f.spark) {                                       // a hit spark: pops, then shrinks away
        const sc = f.size * (k < 0.3 ? 1 + k * 0.6 : 1.18 - (k - 0.3) * 1.4);
        f.s.scale.setScalar(Math.max(0.01, sc)); f.s2.scale.setScalar(Math.max(0.01, sc * 0.5));
        if (k >= 1) { f.gone = true; w.group.remove(f.s, f.s2); f.s.material.dispose(); f.s2.material.dispose(); }
        continue;
      }
      f.s.scale.setScalar(f.size * (0.3 + k * 1.4)); f.s.material.opacity = 0.95 * (1 - k);
      if (k >= 1) { f.gone = true; w.group.remove(f.s); f.s.material.dispose(); }
    }
    if (w.flashes.length > 12) w.flashes = w.flashes.filter(f => !f.gone);
    for (const e of w.fx) {
      if (e.gone) continue;
      e.t += dt;
      if (e.follow) { e.x = e.follow.p.x + e.face * e.follow.ox; e.y = e.follow.p.y + e.follow.oy; }
      if (Math.floor(e.t * e.fps) >= e.n) { e.gone = true; w.group.remove(e.card); e.card.geometry.dispose(); }
    }
    if (w.fx.length > 30) w.fx = w.fx.filter(e => !e.gone);
    const p = player;
    for (const t of w.traps) {
      if (t.gone) continue;
      t.t += dt; t.life -= dt;
      if (t.kind === "orbit") {                            // Roaming Chaos keeps to Shadow
        const o = t.owner || p; t.a += dt * 4; t.x = o.x + Math.cos(t.a) * 1.2; t.y = o.y + 0.3 + Math.sin(t.a) * 0.8;
      } else if (t.kind === "float") {                     // Silver's Psycho Orb: ahead, slowing, then hangs there
        t.vx *= Math.pow(0.03, dt);
        const nx = t.x + t.vx * dt;
        if (solid(tile(Math.floor(nx), Math.floor(t.y)))) t.vx = 0; else t.x = nx;
        t.y += Math.sin(t.t * 3) * 0.35 * dt;
      } else if (t.flies) {                                // Bat Cracker hunts
        const e = nearestFoe(t.x, t.y, 9, t.owner);
        if (e) { const dx = e.x - t.x, dy = e.y + e.h / 2 - t.y, d = Math.hypot(dx, dy) || 1; t.x += dx / d * 3.5 * dt; t.y += dy / d * 3.5 * dt; t.face = sgn(dx) || t.face; }
        else t.y += Math.sin(t.t * 4) * 0.4 * dt;
      } else if (!t.grounded) {                            // tossed: falls to the ground
        t.vy -= GRAV * 0.8 * dt; t.x += t.vx * dt; t.y += t.vy * dt;
        const gy = groundY(t.x, t.y + 0.3);
        if (gy !== null && t.vy < 0 && t.y <= gy) { t.y = gy; t.grounded = true; t.vx = 0; t.landT = t.t; }
        if (t.y < -3) { t.gone = true; w.group.remove(t.card); t.card.geometry.dispose(); continue; }
      } else if (t.kind === "chase") {                     // the Chu² Bomb crawls after its mark
        const e = nearestFoe(t.x, t.y, 8, t.owner);
        if (e) { const nx = t.x + sgn(e.x - t.x) * 3 * dt, gy = groundY(nx, t.y); if (gy !== null) { t.x = nx; t.y = gy; t.face = sgn(e.x - t.x) || t.face; } }
      }
      for (const e of w.enemies) if (e.alive && !e.hidden && Math.abs(e.x - t.x) < e.w / 2 + 0.35 && t.y > e.y - 0.5 && t.y < e.y + e.h + 0.3) { boomTrap(t); break; }
      if (!t.gone && battle) for (const q of battle.fs) if (rivals(t.owner, q) && !q.ko && !q.out && Math.abs(q.x - t.x) < q.c.w / 2 + 0.35 && t.y > q.y - 0.5 && t.y < q.y + q.hh + 0.3) { boomTrap(t); break; }
      if (!t.gone && t.life <= 0) boomTrap(t);
    }
    if (w.traps.length > 12) w.traps = w.traps.filter(t => !t.gone);
  }
  /* A lobbed rock comes down (Knuckles'): no dust, only its light, the jolt and the freeze. */
  function boomAt(x, y, r, s) {
    if (s && s.boom) { effect(s.who, "fx.boom", x, y, 1, 22, true, "fx", s.boom); burst(x, y, [0xfff3a0, 0xf08a24, 0xffffff], 14, 6); }   // Eggman's missile
    else if (s && s.bits !== 0) burst(x, y, [0x9a7a62, 0x7a5a44, 0xd8c8a8, 0xb08a5a], 22, 7);
    if (s && s.land) impact(x, y, s.land);
    strike(x - r, x + r, y - r * 0.6, y + r, { r: 9, cx: x, cy: y - 0.5 });
    SFX.breakIt(); if (s && s.land) SFX.impact();
  }

  function integrate(p, dt) {
    // horizontal, in small steps so a fast runner cannot pass through a wall
    const dx = p.vx * dt, n = Math.max(1, Math.ceil(Math.abs(dx) / 0.2));
    for (let k = 0; k < n; k++) { moveX(p, dx / n); if (p.state === "climb") break; }
    /* come at a slope from the side (low, in a jump, a glide, a teleport) and the feet can be
       under its surface: they are set on it -- coming down, landed -- never left inside it */
    if (p.state !== "climb") {
      const ci = Math.floor(p.x), cj = Math.floor(p.y + 0.02), sc = tile(ci, cj);
      if (sc === "/" || sc === "\\") {
        const s = slopeY(sc, ci, cj, p.x);
        if (s > p.y) { p.y = s; if (!p.ground && p.vy <= 0) land(p, { on: null, tl: null }); }
      }
    }
    if (p.on && p.ground) { p.x += p.on.dx; }
    if (p.ground && p.onTile) {                           // a conveyor belt carries what stands on it
      const bt = tile(p.onTile.i, p.onTile.j);
      if (bt === "}" || bt === "{") moveX(p, (bt === "}" ? BELT : -BELT) * dt);
    }
    if (p.ground) {
      const reach = 0.18 + Math.abs(p.vx) * dt * 1.3 + (p.on ? Math.abs(p.on.dy) + 0.05 : 0);
      const hit = floorBetween(p, p.y + 0.52 + (p.on ? Math.max(0, p.on.dy) : 0), p.y - reach);   // up onto such a lip
      if (hit && p.vy <= 0.01) { p.y = hit.y; p.vy = 0; p.on = hit.on; p.onTile = hit.tl; }
      else { p.ground = false; p.on = null; p.onTile = null; }
    }
    if (!p.ground) {
      const prev = p.y;
      p.y += p.vy * dt;
      if (p.vy <= 0) {
        const hit = floorBetween(p, prev + 0.01, p.y);
        if (hit) { p.y = hit.y; land(p, hit); }
      } else {
        const hb = p.hh;
        const j = Math.floor(p.y + hb);
        for (let i = Math.floor(p.x - p.c.w / 2 + 0.05); i <= Math.floor(p.x + p.c.w / 2 - 0.05); i++) {
          const c = tile(i, j);
          if (solid(c)) {                                  // (a slope always stands on something: it is never a ceiling)
            if (c === "B" || (c === "X" && attacking(p))) { breakTile(i, j); continue; }
            p.y = j - hb - 1e-3; p.vy = 0; p.jumping = false;
            break;
          }
        }
      }
    }
    if (p.x < 0.4) { p.x = 0.4; p.vx = Math.max(0, p.vx); }
    if (p.y < -3 && !p.dead) die(p, "fell");
  }

  function interact(p, dt) {
    const w = world;
    const bx0 = p.x - p.c.w / 2, bx1 = p.x + p.c.w / 2, by0 = p.y, by1 = p.y + p.hh;
    const touches = (x, y, r) => x + r > bx0 && x - r < bx1 && y + r > by0 && y - r < by1;
    // rings -- and with the magnetic shield, the ones near fly in
    if (p.shield === "magnet") for (const k of w.carrots) {
      if (k.got) continue;
      const dx = p.x - k.x, dy = p.y + 0.4 - k.y, d = Math.hypot(dx, dy);
      if (d < 3.4 && d > 0.05) { k.x += dx / d * 10 * dt; k.y += dy / d * 10 * dt; }
    }
    for (const k of w.carrots) if (!k.got && touches(k.x, k.y + 0.35, 0.38)) {
      k.got = true; p.carrots++; p.ringsGot++; SFX.coin();
      burst(k.x, k.y + 0.4, [0xfff3a0, 0xffffff], 4, 2);
    }
    for (const e of w.ents) {
      if (e.gone) continue;
      if (e.t === "loose") continue;
      if (e.t === "spring") {
        if (p.vy <= 0.5 && touches(e.x, e.y + 0.3, 0.42) && p.y >= e.y - 0.1) {
          p.vy = 21; p.ground = false; p.y = Math.max(p.y, e.y + 0.5); p.airMove = false; p.airSp = false; p.airUses = 0; p.jumping = false;
          p.flyLeft = p.c.flyTime || 0;
          p.curl = p.state === "roll"; if (p.state !== "roll") p.state = "run"; e.sq = 1; SFX.spring();
        }
      } else if (e.t === "dash") {
        if (p.ground && touches(e.x, e.y + 0.1, 0.6)) { if (p.vx < 18) { p.vx = 18; p.face = 1; SFX.dash(); burst(p.x, p.y + 0.2, [0xf2d040, 0xffffff], 5, 3); } }
      } else if (e.t === "balloon") {                      // pops, and throws whoever touched it up, their air moves back
        if (!e.back && touches(e.x, e.y, 0.55)) {
          e.back = 3.5; e.m.visible = false;
          p.vy = 15; p.ground = false; p.on = null; p.jumping = false; p.airMove = false; p.airSp = false; p.airUses = 0; p.flyLeft = p.c.flyTime || 0;
          if (p.state !== "roll" && p.state !== "fly") p.state = "run";
          burst(e.x, e.y, (w.T.balloon || [0xff5a5a, 0xffb0a8]).concat([0xffffff]), 12, 4); SFX.pop();
        }
      } else if (e.t === "bumper") {                       // knocks whoever touches it straight away from its middle
        const dx = p.x - e.x, dy = p.y + p.hh / 2 - e.y, d = Math.hypot(dx, dy) || 1;
        if (e.cd <= 0 && d < 0.66 + p.c.w / 2) {
          p.vx = dx / d * 15; p.vy = Math.max(dy / d * 15, 4); p.ground = false; p.on = null; p.jumping = false; p.airMove = false; p.airUses = 0;
          if (p.state !== "roll") p.state = "run";
          if (Math.abs(p.vx) > 0.5) p.face = sgn(p.vx);
          e.sq = 1; e.cd = 0.2; SFX.bumper(); flash(e.x, e.y, 1.4, w.T.id === "club" ? 0xff7ad8 : 0xffd060);
        }
      } else if (e.t === "monitor") {                      // break it open: jump on it, roll or dash into it, or hit it
        if (!(bx1 > e.x - 0.42 && bx0 < e.x + 0.42 && by0 < e.y + 0.95 && by1 > e.y)) continue;
        const above = p.vy < 0 && p.y > e.y + 0.5;
        if (above || attacking(p) || p.state === "atk" || p.state === "seek" || p.state === "dash") {
          openMonitor(p, e);
          if (above) { p.vy = input.J ? 11 : 8; p.ground = false; p.airMove = false; p.airUses = 0; }
        } else if (p.y < e.y + 0.6) {                      // otherwise it stands in the way
          p.x = p.x < e.x ? e.x - 0.42 - p.c.w / 2 : e.x + 0.42 + p.c.w / 2; p.vx = 0;
        }
      }
    }
    for (const s of w.shoes) if (!s.got && touches(s.x, s.y + 0.4, 0.45)) {
      s.got = true; s.m.visible = false; p.shoes[s.n] = true; SFX.shoe();
      burst(s.x, s.y + 0.5, [0xf2b705, 0xfff3c4], 14, 4);
      hudToast("Red Star Ring " + (s.n + 1) + " of 3");
    }
    // checkpoints and the post
    for (const k of w.checks) if (!k.on && p.x >= k.x - 0.3) {
      k.on = true; p.check = { x: k.x, y: k.y }; SFX.check();
      k.m.geometry = propGeo("poleDone"); k.spin = 1; hudToast("Star Post: you'll start again here");
    }
    if (w.goal && p.x >= w.goal.x && mode === "play") { if (!w.def.story) w.goal.spin = 2.6; finish(p); }
    // thorns
    const shell = p.c.id === "mighty" && p.curl;             // Mighty's shell shrugs off spikes (Sonic Mania Plus)
    for (const z of w.hazards) if (bx1 > z.x0 && bx0 < z.x1 && by0 < z.y1 && by1 > z.y0 && !shell) hurt(p, p.x + p.face);
    // badniks
    for (const e of w.enemies) {
      if (!e.alive || e.hidden) continue;
      if (e.reach && p.state !== "teleport") {               // Leon's tongue, Piko-piko's mallet, out in front
        const rx0 = e.face > 0 ? e.x : e.x - e.reach, rx1 = e.face > 0 ? e.x + e.reach : e.x;
        if (bx1 > rx0 && bx0 < rx1 && by0 < e.y + e.h && by1 > e.y) hurt(p, e.x);
      }
      const ex0 = e.x - e.w / 2, ex1 = e.x + e.w / 2, ey0 = e.y, ey1 = e.y + e.h;
      if (bx1 < ex0 || bx0 > ex1 || by1 < ey0 || by0 > ey1) continue;
      const stomp = p.vy < -0.5 && by0 > ey0 + e.h * 0.4;
      if (e.guard && p.star <= 0) {                         // spikes out, or spinning: it hurts, whatever touches it
        glance(e);
        if (shell) { p.vx = (sgn(p.x - e.x) || -p.face) * 6; p.vy = Math.max(p.vy, 7); p.ground = false; }
        else if (p.state !== "teleport") hurt(p, e.x);
        continue;
      }
      const armoured = p.star <= 0 && (e.B.armor === "ball" ? !(stomp || p.curl) : e.B.armor === "front" ? !stomp && sgn(p.x - e.x) === e.face :
                                         e.B.armor === "shell" ? e.mode !== "open" : false);
      if (armoured && stomp && e.B.armor === "shell") { glance(e); p.vy = input.J ? 12 : 9; p.ground = false; continue; }   // a shut shell: off it
      /* a blow that meets it lands -- in its wind-up too, so a heavy's step never carries the
         runner into a hurt -- and so does the aim attack's dash */
      const swinging = p.state === "seek" || (p.state === "atk" && p.mv && Math.floor(p.mv.t * p.mv.fps) <= p.mv.h1);
      if (armoured && (swinging || attacking(p))) {         // it takes the blow: the runner bounces off, neither hurt
        glance(e);
        p.vx = (sgn(p.x - e.x) || -p.face) * 6; if (!p.ground) p.vy = Math.max(p.vy, 5);
        if (p.state !== "run" && p.state !== "fly" && p.state !== "glide") { p.state = "run"; p.mv = null; }
        continue;
      }
      if (swinging || attacking(p)) {
        if (swinging) {
          if (p.state === "seek") { const air = !p.ground; startBlow(p, "aim"); p.mv.air = air; p.vx = p.face * 2; }
          world.hitAt = { x: clamp(p.x + p.face * (p.c.w / 2 + 0.2), ex0, ex1), y: clamp(p.y + p.hh * 0.55, ey0, ey1) };
          defeat(e, blowKick(p)); landBlow(p); continue;
        }
        const homing = p.state === "homing", v = Math.max(8, Math.abs(p.vx) * 0.8);
        defeat(e, { vx: (sgn(p.vx) || p.face) * v, vy: homing ? 6 : 7 });
        hitSpark((e.x + p.x) / 2, clamp(p.y + p.hh * 0.5, ey0, ey1), homing ? 1.3 : 1.1, HIT_C[p.c.id] || 0xffffff);
        hitStop(homing ? 0.05 : 0.035); shakeCam(homing ? 0.1 : 0.06); SFX.hit();
        if (p.state === "homing") { p.state = "run"; p.vy = 10; p.vx = p.face * 4; p.airMove = false; p.airUses = 0; p.curl = true; }
        else if (p.curl && !p.ground && p.vy < 0) p.vy = input.J ? 12 : 9;
      } else if (stomp) {
        defeat(e); hitSpark(p.x, ey1, 0.9, 0xffffff); hitStop(0.025);
        p.vy = input.J ? 13 : 9.5; p.ground = false; p.airMove = false; p.airUses = 0; SFX.stomp();
        if (p.state !== "fly" && p.state !== "glide") p.state = "run";
      } else if (p.state !== "teleport") hurt(p, e.x);
    }
    // a homing attack that reaches a spring or a hurdle
    if (p.state === "homing" && p.target && p.target.t === "hurdle" && !p.target.alive) { p.state = "run"; p.vy = 9; p.airMove = false; p.airUses = 0; }
    // bubbles
    for (const b of w.bubbles) if (!b.gone && touches(b.x, b.y, 0.5)) { b.gone = true; b.m.visible = false; p.air = AIR; SFX.bubble(); }
    // a crumbling ledge underfoot
    if (p.ground && p.onTile) {
      const t = w.tiles[p.onTile.i + "," + p.onTile.j];
      if (t && t.c === "C" && !t.t && !t.gone) t.t = 0.45;
    }
  }
  /** Beaten. Knocked by a blow or a blast -- `kick` a push {vx, vy}, or {r, cx, cy}: r m/s away
      from a point -- it shows white through the freeze-frame, then flies off tumbling and
      bursts where it hits something or after a moment; stomped, it bursts at once. */
  function defeat(e, kick) {
    e.alive = false;
    if (kick) {
      let vx = kick.vx, vy = kick.vy;
      if (kick.r) {
        const dx = e.x - kick.cx, dy = e.y + e.h / 2 - kick.cy, d = Math.hypot(dx, dy) || 1;
        vx = dx / d * kick.r + (sgn(dx) || 1) * 2; vy = Math.max(5, dy / d * kick.r + 5);
      }
      e.fling = { vx, vy, t: 0, rot: 0, spin: -(sgn(vx) || 1) * (11 + Math.random() * 6) };
      whiten(e.m, true);
      return;
    }
    pop(e); SFX.stomp();
  }
  function pop(e, lost) {
    if (e.fling) SFX.stomp();
    e.fling = null; e.m.visible = false; whiten(e.m, false);
    burst(e.x, e.y + e.h / 2, [0xffffff, 0xf2d040, 0xc8ccd8], 10, 5);
    if (!lost) {                                           // Sonic Advance's puff of smoke, and the animal it was running on
      const m = badCard(); m.castShadow = false; world.group.add(m);
      world.booms.push({ key: "boom", x: e.x, y: e.y + e.h / 2, r: -9, t: 0, m });
      spawnCritter(e.x, e.y + 0.3);
    }
  }
  /* A blow that does not land: a white spark and a clink, and nothing else. */
  function glance(e) {
    if (e.clink > world.t) return;
    e.clink = world.t + 0.25;
    hitSpark(e.x, e.y + e.h / 2, 0.7, 0xffffff); SFX.grab();
  }
  /* a thing struck shows pure white for a moment */
  let WHITE = null;
  function whiten(m, on) {
    WHITE = WHITE || new THREE.MeshBasicMaterial({ color: 0xffffff });
    if (m.userData.bad) {                                   // a sprite: its own white silhouette
      if (on && !m.userData.m0) { m.userData.m0 = m.material; m.material = badMats().white; }
      else if (!on && m.userData.m0) { m.material = m.userData.m0; m.userData.m0 = null; }
      return;
    }
    m.traverse(o => {
      if (!o.isMesh) return;
      if (on && !o.userData.m0) { o.userData.m0 = o.material; o.material = WHITE; }
      else if (!on && o.userData.m0) { o.material = o.userData.m0; o.userData.m0 = null; }
    });
  }

  // ---------------------------------------------------------------- everything else that moves
  function worldStep(dt) {
    const w = world, p = player;
    if (w.boss && (mode === "play" || mode === "goal")) stepBoss(dt);
    for (const q of w.plats) {
      const k = Math.sin(w.t * 0.9 + q.ph) * q.range;
      const nx = q.t === "M" ? q.x0 + k : q.x0, ny = q.t === "V" ? q.y0 + k : q.y0;
      q.dx = nx - q.x; q.dy = ny - q.y; q.x = nx; q.y = ny;
      q.m.position.set(q.x, q.y, 0);
      if (p.on === q && p.ground) { p.y = q.y + 1; }
    }
    for (const e of w.enemies) if (e.fling) {               // knocked flying: tumbles off, bursts where it hits
      const F = e.fling; F.t += dt;
      if (F.t > 0.05 && !F.lit) { F.lit = true; whiten(e.m, false); }
      F.vy -= 30 * dt; F.rot += F.spin * dt;
      const nx = e.x + F.vx * dt, ny = e.y + F.vy * dt;
      /* it bursts on a wall or the ground -- a slope's surface too, never sailing on into it */
      const mc = tile(Math.floor(nx), Math.floor(ny + e.h / 2)), lo = tile(Math.floor(nx), Math.floor(ny + 0.05));
      const inSlope = ((mc === "/" || mc === "\\") && ny + e.h / 2 < slopeY(mc, Math.floor(nx), Math.floor(ny + e.h / 2), nx)) ||
                      ((lo === "/" || lo === "\\") && F.vy < 0 && ny < slopeY(lo, Math.floor(nx), Math.floor(ny + 0.05), nx));
      if (F.t > 0.45 || ny < -2 || solid(mc) || inSlope) pop(e, ny < -2);
      else { e.x = nx; e.y = ny; }
    }
    for (const e of w.enemies) {                            // the badniks near enough to matter
      if (!e.alive || Math.abs(e.x - p.x) > 28) continue;
      stepBadnik(e, dt, p);
      if (e.y < -3) e.alive = false;
    }
    stepEnemyShots(dt, p);
    // balloons come back, bumpers ready again
    for (const e of w.ents) {
      if (e.t === "balloon" && e.back > 0) { e.back -= dt; if (e.back <= 0) { e.back = 0; e.m.visible = true; } }
      else if (e.t === "bumper") e.cd = Math.max(0, e.cd - dt);
    }
    // shots, effects and traps
    stepShots(dt);
    // loose rings, bouncing, and the animals let out of the badniks
    for (const e of w.ents) {
      if (e.gone) continue;
      if (e.t === "critter") {
        e.life -= dt; e.x += e.vx * dt;
        if (e.bird) e.y += 4.5 * dt;
        else { e.vy -= GRAV * 0.8 * dt; e.y += e.vy * dt; const g = groundY(e.x, e.y + 0.3); if (g !== null && e.vy < 0 && e.y <= g) { e.y = g; e.vy = 6; } }
        e.m.position.set(e.x, e.y, 0.2); e.m.scale.x = sgn(e.vx) || 1; e.m.rotation.z = e.bird ? Math.sin(w.t * 30) * 0.2 : 0;
        if (e.life <= 0 || e.y < -3) { e.gone = true; e.m.visible = false; }
        continue;
      }
      if (e.t !== "loose") continue;
      e.life -= dt; e.wait -= dt; e.vy -= GRAV * 0.7 * dt; e.x += e.vx * dt; e.y += e.vy * dt;
      const below = tile(Math.floor(e.x), Math.floor(e.y)), side = tile(Math.floor(e.x + sgn(e.vx) * 0.2), Math.floor(e.y + 0.3));
      if ((solid(below) || below === "-") && e.vy < 0) { e.y = Math.floor(e.y) + 1; e.vy = -e.vy * 0.6; e.vx *= 0.85; }
      if (solid(side)) e.vx = -e.vx * 0.6;
      if (e.wait <= 0 && Math.abs(e.x - p.x) < 0.7 && e.y > p.y - 0.4 && e.y < p.y + p.hh && !p.dead) {
        e.gone = true; e.m.visible = false; p.carrots++; if (!e.own) p.ringsGot++; SFX.coin();
      }
      if (e.life <= 0 || e.y < -3) { e.gone = true; e.m.visible = false; }
      e.m.position.set(e.x, e.y, 0); e.m.rotation.y += dt * 9; e.m.visible = !e.gone && (e.life > 1.2 || Math.sin(e.life * 30) > 0);
    }
    // crumbling ledges
    for (const k in w.tiles) {
      const t = w.tiles[k];
      if (t.c !== "C") continue;
      if (t.t > 0 && !t.gone) {
        t.t -= dt;
        t.m.position.x = t.i + Math.sin(w.t * 60) * 0.03;
        if (t.t <= 0) { t.gone = 4.5; w.S.grid[t.j][t.i] = "."; t.fall = 0; }
      } else if (t.gone) {
        t.fall = (t.fall || 0) + dt;
        t.m.position.y = t.j - t.fall * t.fall * 9; t.m.visible = t.fall < 1.2;
        t.gone -= dt;
        const clear = !(p.x + p.c.w / 2 > t.i && p.x - p.c.w / 2 < t.i + 1 && p.y < t.j + 1.1 && p.y + p.hh > t.j);
        if (t.gone <= 0 && clear) { t.gone = 0; t.t = 0; w.S.grid[t.j][t.i] = "C"; t.m.position.set(t.i, t.j, 0); t.m.visible = true; }
        else if (t.gone <= 0) t.gone = 0.1;
      }
    }
    // air bubbles from the vents
    for (const v of w.vents) {
      v.t -= dt;
      if (v.t <= 0) {
        v.t = 2.6;
        const m = new THREE.Mesh(propGeo("bubble"), materials().water); m.renderOrder = 3; w.group.add(m);
        w.bubbles.push({ x: v.x, y: v.y + 0.3, m, life: 7 });
      }
    }
    for (const b of w.bubbles) {
      if (b.gone) continue;
      b.life -= dt; b.y += 1.5 * dt; b.x += Math.sin(w.t * 3 + b.life) * 0.4 * dt;
      if (tile(Math.floor(b.x), Math.floor(b.y + 0.3)) !== "~" || b.life <= 0) { b.gone = true; b.m.visible = false; }
      b.m.position.set(b.x, b.y, 0.1); b.m.scale.setScalar(1 + Math.sin(w.t * 6 + b.life) * 0.06);
    }
    if (w.bubbles.length > 40) w.bubbles = w.bubbles.filter(b => !b.gone);
    for (const d of w.drafts) for (const m of d.motes) { m.position.y += dt * 4.5; if (m.position.y > d.y1) m.position.y = d.y0; m.position.x = d.x0 + 0.5 + Math.sin(m.position.y * 2 + d.x0) * 0.35; }
    // particles
    const P = w.parts, M4 = new THREE.Matrix4(), col = new THREE.Color();
    let n = 0;
    for (const q of P.list) {
      q.life -= dt; if (q.life <= 0) continue;
      q.vy -= 18 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
      const s = q.s * Math.min(1, q.life * 3);
      M4.makeScale(s, s, s); M4.setPosition(q.x, q.y, q.z);
      P.mesh.setMatrixAt(n, M4); P.mesh.setColorAt(n, col.setHex(q.c)); n++;
      if (n >= 320) break;
    }
    P.list = P.list.filter(q => q.life > 0);
    P.mesh.count = n; P.mesh.instanceMatrix.needsUpdate = true; if (P.mesh.instanceColor) P.mesh.instanceColor.needsUpdate = true;
  }
  function burst(x, y, cols, n, sp) {
    if (!world) return;
    for (let k = 0; k < n; k++) world.parts.list.push({ x, y, z: (Math.random() - 0.5) * 0.6, vx: (Math.random() - 0.5) * sp * 2, vy: Math.random() * sp + 1,
      vz: (Math.random() - 0.5) * sp, life: 0.5 + Math.random() * 0.5, s: 0.08 + Math.random() * 0.09, c: cols[k % cols.length] });
  }

  // ---------------------------------------------------------------- the picture
  let camX = 0, camY = 0, shake = 0, stopT = 0;
  const hitStop = s => { stopT = Math.max(stopT, s); };
  const shakeCam = s => { if (!root.Settings || Settings.get("shake") !== false) shake = Math.max(shake, s); };   // Options can turn it off
  const CAM_D = 17;
  function snapCamera() { if (!player) return; camX = player.x + 2; camY = Math.max(6.1, player.y + 2.1); }
  /** The runner's frame, from what they are doing. */
  function drawRunner(p, dt) {
    const c = p.c, a = p.anim, sp = Math.abs(p.vx), id = c.sheet || c.id;
    const airId = srcOf(p, "air"), runId = srcOf(p, "run");
    p.landT = Math.max(0, p.landT - dt); p.dblT = Math.max(0, (p.dblT || 0) - dt);
    p.balT = Math.max(0, (p.balT || 0) - dt); p.catchT = Math.max(0, (p.catchT || 0) - dt); p.grabT = Math.max(0, (p.grabT || 0) - dt);
    const count = nm => framesOf(id, nm).length;
    let name, fps = 10, loop = true, face = p.face, pick = null;
    if (p.dead || p.ko) { name = "out"; fps = 8; loop = false; }
    else switch (p.state) {
      case "hurt": case "stumble": name = "hit"; fps = 12; loop = false; break;
      case "atk": name = p.mv.name; pick = () => Math.floor(p.mv.t * p.mv.fps); break;
      case "special":
        name = p.sp.body;
        pick = p.sp.windup ? () => Math.floor(p.sp.spin || 0) % count(name) : () => Math.floor(p.sp.t * p.sp.fps) % count(name);
        break;
      case "recoil": name = p.ground ? "skid" : "fall"; fps = 12; loop = false; break;   // braced, facing his blast
      case "seek": name = "seek"; fps = 14; loop = false; break;
      case "homing": name = "spin"; fps = 30; break;
      case "charge": name = "rev"; fps = 14 + p.rev * 22; break;              // Sonic's Spin Dash, in their colours
      case "roll": name = "spin"; fps = 12 + sp * 1.4; break;
      case "dash": name = "dash"; fps = 16; loop = !!c.steer; break;              // Gamma's Drive Mode rolls on
      case "crouch": {                                     // the landing frames, down to the deepest, held
        const L = framesOf(id, "land"); let k = 0;
        L.forEach((f, j) => { if (f[3] < L[k][3]) k = j; });
        name = "land"; pick = t => Math.min(Math.floor(t * 20), k);
        break;
      }
      case "climb":                                        // Sonic Advance's climb: he faces the wall
        if (p.grabT > 0) { name = "grab"; pick = () => 0; }
        else if (p.vy) { name = "climb"; pick = () => { const n = count("climb"), k = Math.floor(p.y / 0.16); return ((k % n) + n) % n; }; }
        else { name = "cling"; fps = 2.5; }
        break;
      case "ledge": name = "ledge"; pick = () => Math.floor(p.ledge.t / LEDGE_T * count("ledge")); break;
      case "glide": name = "glide"; pick = t => t * 12 < 2 ? Math.floor(t * 12) : 2 + Math.floor(t * 10) % 3; break;
      case "fly":
        if (airId === "tails" && !c.emerl) { name = "fly"; pick = t => 1 + Math.floor(t * (p.flyLeft > 0 ? 16 : 7)) % 4; }
        else if (airId === "cream" && !c.emerl) { name = "fly"; pick = t => p.flyLeft > 0 ? 2 + Math.floor(t * 12) % 3 : 5; }   // her ears flap; tired, held out
        else if (framesOf(id, "fly")) { name = "fly"; fps = airId === "gamma" ? 14 : 10; }                            // Flight Mode, the Egg Mobile's jets
        else { name = "fall"; fps = p.flyLeft > 0 ? 14 : 6; }
        break;
      case "jet": name = "jet"; fps = 14; break;
      case "psy": name = "airdash"; pick = t => Math.min(count("airdash") - 1, Math.floor(t * 18)); break;
      case "teleport": name = "teleport"; fps = 20; loop = false; break;
      case "dive":
        if (p.dive === "meteor") { name = framesOf(id, "ball") ? "ball" : "sp.airpower"; fps = 30; }
        else { name = c.emerl ? "sp.airpower" : "airpower"; pick = t => p.dive === "drill" ? Math.floor(t * 22) % count(name) : Math.floor(t * 20) % Math.min(count(name), p.dive === "hammer" ? 3 : 4); }
        break;
      case "erupt": name = p.er.body; pick = () => Math.min(p.er.from + Math.floor(p.er.t * p.er.fps), p.er.to); break;
      case "tornado": {
        const T = p.tor; name = T.body;
        pick = () => { const k = Math.floor(T.t * T.fps); return k < T.from ? k : T.from + (k - T.from) % (T.to - T.from + 1); };
        break;
      }
      default:
        if (!p.ground) {
          if (p.launchT > 0 && framesOf(id, "launch")) { name = "launch"; pick = t => t < 0.3 ? Math.floor(t * 20) % 3 : Math.min(5, 3 + Math.floor((t - 0.3) * 14)); }
          else if (p.dblT > 0) { name = "double"; fps = 12; loop = false; }
          else if (p.floatT > 0 && input.J && p.vy < 0 && framesOf(id, "airdash")) { name = "airdash"; pick = t => 5 + Math.floor(t * 8) % 4; }   // Silver floats down
          else if (p.balT > 0) { name = "spark"; fps = 16; loop = false; }
          else if (p.catchT > 0 && airId === "rouge" && framesOf(id, "catch")) { name = "catch"; fps = 8; loop = false; }
          else if (p.curl) { name = "spin"; fps = 12 + sp * 1.4; }          // out of a roll: the Spin Dash ball
          else { name = p.vy > 0 ? "jump" : "fall"; loop = false; }
        }
        else if (p.landT > 0) { name = "land"; fps = 22; loop = false; }
        else if (sp < 0.6) { name = "idle"; fps = 7; }
        else if (sp > 4 && (input.R - input.L) && sgn(input.R - input.L) !== sgn(p.vx)) { name = "skid"; fps = 12; loop = false; face = sgn(p.vx); }
        else if (sp < 2.2) name = "start";
        else { name = "run"; fps = runId === "shadow" && !c.emerl ? 8 + sp * 1.7 : 5 + sp * 1.15; }
    }
    const key = name + "|" + p.state;
    if (a.key !== key) { a.key = key; a.t = 0; } else a.t += dt;
    const i = pick ? pick(a.t) : frameAt(count(name), a.t, fps, loop);
    const lift = c.lift && !p.dead && !p.ko ? c.lift + Math.sin(world.t * 3.4) * 0.05 : 0;          // Eggman's Egg Mobile, hovering
    setFrame(p.spr, name, i, face, p.x, p.y + lift);
    p.spr.visible = !GLIDE[mode] && !p.out && !(p.inv > 0 && !p.dead && p.state !== "dash" && p.state !== "teleport" && !(p.sp && p.sp.shield) && Math.sin(world.t * 40) > 0.4);
  }
  /* The dust behind a rev: Sonic Advance's spray, looping faster and swelling as the rev
     builds (each tap of Space kicks it up), at the runner's heels, trailing away from them. */
  function drawDust(p, dt) {
    const d = p.dust; if (!d) return;
    const winding = p.state === "special" && p.sp && p.sp.windup && p.ground;
    const on = p.state === "charge" || winding;
    d.visible = on && !p.dead;
    if (!on) { p.dustT = 0; return; }
    const rev = p.state === "charge" ? p.rev : Math.min(1, p.sp.t / p.sp.windup);
    p.revKick = Math.max(0, (p.revKick || 0) - dt * 5);
    p.dustT = (p.dustT || 0) + dt * (12 + rev * 18);
    const n = framesOf(p.c.id, "fx.rev").length;
    setFrame(d, "fx.rev", Math.floor(p.dustT) % n, -p.face, p.x - p.face * 0.62, p.y, false, 0.12, 0.8 + rev * 0.55 + p.revKick * 0.25);
  }
  /* Shots, effects and traps, each at its frame. A trap about to go off blinks. */
  function drawCards() {
    const w = world;
    for (const s of w.shots) if (!s.gone) {
      const n = framesOf(s.who, s.fx).length;
      const i = s.range ? s.range[0] + Math.floor(s.t * 16) % (s.range[1] - s.range[0] + 1)          // a part of the row, round (Eggman's missile)
              : s.loop ? Math.floor(s.t * 16) % n : Math.min(n - 1, Math.floor((1 - s.life / s.life0) * n));
      setFrame(s.card, s.fx, i, s.face, s.x, s.y, s.mid, 0.2, s.k || s.ghost);
    }
    for (const e of w.fx) if (!e.gone) setFrame(e.card, e.name, e.from + Math.floor(e.t * e.fps), e.face, e.x, e.y, e.mid, e.mid ? 0.25 : 0.04, e.k);
    for (const t of w.traps) if (!t.gone) {
      const n = framesOf(t.who, "fx.trap").length, k = Math.floor(t.t * 8);
      let name = "fx.trap", i = t.who === "amy" ? Math.min(k, n - 1) : t.who === "rouge" ? (k < 3 ? k : 3 + (k - 3) % (n - 3)) : k % n;
      /* Sonic Cracker tumbles as it goes down, settles, then sits armed, blinking, till it goes */
      const set = framesOf(t.who, "fx.trapset");
      if (set && t.grounded) {
        const since = t.t - (t.landT || 0);
        if (since < n / 12) i = Math.min(Math.floor(since * 12), n - 1);
        else { name = "fx.trapset"; i = Math.floor(since * 8) % set.length; }
      }
      const L = TRAP_LOOK[t.who];
      if (L && !set) { const a = L.from || 0, lp = L.loop || [a, n - 1], j = a + k; i = j < lp[0] ? j : lp[0] + (j - lp[0]) % (lp[1] - lp[0] + 1); }
      setFrame(t.card, name, i, t.face, t.x, t.y, t.flies || t.kind === "orbit", 0.15, L && L.k);
      t.card.visible = !(t.life < 1.6 && Math.sin(t.t * 30) > 0.3);
    }
  }
  function draw(dt) {
    const p = player, w = world;
    if (battle) {                                          // everyone in the fight, each with their own hands
      for (const f of battle.fs) { input = f.inp; drawRunner(f, dt); drawDust(f, dt); drawAura(f, dt); }
      input = INPUT0;
    } else { drawRunner(p, dt); drawDust(p, dt); drawAura(p, dt); }
    drawCards();
    for (const f of battle ? battle.fs : [p]) {
      if (f.out || f.ko) continue;
      if (f.star > 0 && Math.random() < (ITEMS ? 0.15 : 0.5)) burst(f.x, f.y + Math.random() * f.hh, [0xffffff, 0x9ad8ff, 0xfff070], 1, 1);
      if ((Math.abs(f.vx) > 13 || f.speedT > 0) && f.ground && Math.random() < (f.speedT > 0 ? 0.8 : 0.4)) burst(f.x - f.face * 0.3, f.y + 0.05, [0xd8d0c0, 0xffffff], 1, 1.5);
    }
    // the rings spin, all together, as they do
    const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s1 = new THREE.Vector3(1, 1, 1), s0 = new THREE.Vector3(0, 0, 0), pos = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    for (const k of w.carrots) {
      q.setFromAxisAngle(up, w.t * 3.2);
      pos.set(k.x, k.y + 0.12 + Math.sin(w.t * 3 + k.k) * 0.08, 0);
      M4.compose(pos, q, k.got ? s0 : s1);
      w.carrotMesh.setMatrixAt(k.k, M4);
    }
    w.carrotMesh.instanceMatrix.needsUpdate = true;
    for (const k of w.checks) if (k.spin > 0) { k.spin = Math.max(0, k.spin - dt); k.m.rotation.y = (1 - k.spin) * PI * 4; }
    if (w.goal && w.goal.spin > 0) { w.goal.spin = Math.max(0, w.goal.spin - dt); w.goal.m.rotation.y += dt * (2 + w.goal.spin * 14); if (!w.goal.spin) w.goal.m.rotation.y = 0; }
    for (const e of w.ents) if (e.t === "spring") { e.sq = Math.max(0, e.sq - dt * 2.6); springPose(e); }
      else if (e.t === "bumper") { e.sq = Math.max(0, e.sq - dt * 5); e.m.scale.set(1 + e.sq * 0.3, 1 + e.sq * 0.3, 1); }
      else if (e.t === "balloon") { e.m.position.y = e.y + Math.sin(w.t * 2.2 + e.x) * 0.12; e.m.rotation.z = Math.sin(w.t * 1.3 + e.x) * 0.12; }
    for (const s of w.shoes) if (!s.got) { s.m.rotation.y = w.t * 2.6; s.m.position.y = s.y + Math.sin(w.t * 2.5 + s.x) * 0.12; }
    for (const e of w.enemies) {
      if (e.fling) {                                       // shaking through the freeze-frame, then spinning away
        drawBadnik(e);
        const j = stopT > 0 ? 0.09 : 0;
        e.m.position.x += (Math.random() - 0.5) * j; e.m.position.y += (Math.random() - 0.5) * j * 0.5;
        e.m.rotation.z = e.fling.rot;
        continue;
      }
      if (e.alive && Math.abs(e.x - camX) < 30) drawBadnik(e);
    }
    drawEnemyShots();
    if (w.snow) {
      const a = w.snow.geometry.attributes.position;
      for (let k = 0; k < a.count; k++) {
        let y = a.getY(k) - dt * 1.6, x = a.getX(k) + Math.sin(w.t + k) * dt * 0.4;
        if (y < camY - 8) y += 18;
        a.setXY(k, x, y);
      }
      a.needsUpdate = true; w.snow.position.x = camX - 0;
    }
    for (const f of w.far.userData.anim) f(w.t);
    buildAhead(w);
    if (w.goal && w.goal.fire) fireworks(dt);
    // the camera
    const aspect = R.domElement.width / Math.max(1, R.domElement.height);
    /* a tall phone screen backs the camera off until twelve metres of the stage fit across */
    let D = clamp(12.5 / (2 * Math.tan(17 * PI / 180) * aspect), CAM_D, 42);
    if (battle) D = battleView(aspect, dt);              // a battle frames everyone in it
    else {
      const halfW = Math.tan(17 * PI / 180) * D * aspect, halfH = Math.tan(17 * PI / 180) * D;
      const lead = clamp(p.vx * 0.28, -4.5, 4.5) + p.face * 1.2;
      let tx = clamp(p.x + lead, halfW - 0.5, w.W - halfW + 0.5);
      w.viewHalfW = halfW;
      if (w.boss && w.boss.lock) tx = bossCamX(w.boss, halfW);           // a boss's arena: the camera holds on it
      let ty = clamp(p.y + 2.1, p.y < 3.5 ? 3.8 : 6.1, H - 3.2);             // lower when she is down in the water
      if (D > CAM_D) ty = Math.max(ty, halfH - 3);
      camX = lerp(camX, tx, 1 - Math.exp(-dt * 3.6));
      camY = lerp(camY, ty, 1 - Math.exp(-dt * (p.ground ? 4 : 1.8)));
    }
    camera.position.set(camX, camY + 1.9, D);
    if (shake > 0) {                                       // a blast shakes the picture, briefly
      shake = Math.max(0, shake - dt);
      camera.position.x += (Math.random() - 0.5) * shake * 1.6; camera.position.y += (Math.random() - 0.5) * shake * 1.6;
    }
    camera.lookAt(camX, camY, 0);
    if (w.snow) w.snow.position.set(camX, 0, 0);
    sun.position.set(camX + w.T.sun[2][0], w.T.sun[2][1], w.T.sun[2][2]);
    sun.target.position.set(camX, camY - 2, 0);
    if (battle) placeTags();
    if (w.boss) drawBoss();
    R.render(scene, camera);
  }

  // ---------------------------------------------------------------- Eggman's bosses
  /* Each zone's Act 2 ends in Eggman's arena (E in the stage marks where it starts). Run in and it
     shuts behind you, the camera holds still, and the boss comes in. Every boss is the zone's own
     from the Sonic Advance games (adventure-bosses.js, tools/pack-bosses.py), doing what it does
     there, as far as the guides and the Sonic wikis tell it:
       hammer   Egg Hammer Tank (Advance): drives to and fro, its hammer going round in front;
                hit the cockpit from above or behind. Hurt, it hops, the hammer slamming down.
       aero     Aero Egg (Advance 2): flies over, dropping bombs that burst into flame; swoops
                low now and then, and that is the time to hit it.
       cube     Egg Cube (Advance 3): rises over you and slams down; throws a spiked mace that
                bounces at you, and sends out toy soldiers.
       mecha    Mecha Knuckles (Advance): Knuckles to look at, till it is hurt -- walks, punches,
                glides, spin-dashes; then its own silver, and missiles from afar.
       ball     Egg Ball (Advance): goes from tube to tube while a spiked ball runs between them.
       bomber   Egg Bomber Tank (Advance 2), a chase: it drives off down the road, firing back
                shells that burst into flame; catch it up and hit it.
       totem    Egg Totem (Advance 2): rolls to and fro on its electric spring, firing spiked bars
                low and high; the cockpit on top is the place to hit.
       spider   Egg Spider (Advance): hangs from the ceiling, drops icicles, and comes down to
                stamp; hit it low.
       press    Egg Press (Advance): bounds on its spring; a big jump shakes the ground on landing
                (be in the air); the cockpit on top is the place to hit, never the spring.
       hammer3  Gemerl first (Advance 3: stands, then dashes across; hit him standing, four
                times), then the Egg Hammer 3, its hammer on a chain, slamming down.
       snake    Egg Snake (Advance): two spiked balls going round it on chains; its top opens
                and shuts -- hit it open; it fires.
       saucer   Egg Saucer (Advance 2), a chase: the great ring flies on ahead, its giant fists
                slamming the road; it dips low after, and the cockpit in the ring can be hit.
       frog     Egg Frog (Advance 2): leaps from side to side, shaking the floor where it lands;
                breathes flame and fires; hit it when it is down.
     Eight hits (Gemerl four first), each a flash and a moment untouchable; past half, the boss
     fights harder. Then it blows apart, Eggman gets away in the Egg Mobile, and a capsule drops:
     jump on it and the animals go free -- the zone is clear. Going down in the arena puts the
     runner back at the Star Post before it, and the boss back as it was. */
  const BSH = root.AdventureBosses || null;
  if (BSH) SHEETS.bosses = BSH;
  const BOSS = {
    hammer: { name: "Egg Hammer Tank", hp: 8, k: 1.1 },
    aero: { name: "Aero Egg", hp: 8, k: 1 },
    cube: { name: "Egg Cube", hp: 8, k: 0.95 },
    mecha: { name: "Mecha Knuckles", hp: 8, k: 1.12 },
    ball: { name: "Egg Ball", hp: 8, k: 1.05 },
    bomber: { name: "Egg Bomber Tank", hp: 8, k: 1, chase: true },
    totem: { name: "Egg Totem", hp: 8, k: 0.9 },
    spider: { name: "Egg Spider", hp: 8, k: 1.05 },
    press: { name: "Egg Press", hp: 8, k: 0.95 },
    hammer3: { name: "Egg Hammer 3", hp: 8, k: 1.1, gemerl: 4 },
    snake: { name: "Egg Snake", hp: 8, k: 1 },
    saucer: { name: "Egg Saucer", hp: 8, k: 0.85, chase: true },
    frog: { name: "Egg Frog", hp: 8, k: 1.05, music: "finale" },
  };
  const ROAD_LEN = 360, BOSS_W = 18;
  const ovl = (A, B) => A[0] < B[1] && A[1] > B[0] && A[2] < B[3] && A[3] > B[2];
  const fr = name => (BSH && BSH.f[name]) || [[0, 0, 1, 1, 0, 0]];
  /* a sprite's size in metres, at the boss's scale */
  const bw = (b, name, i) => fr(name)[i || 0][2] * PX * b.C.k, bh = (b, name, i) => fr(name)[i || 0][3] * PX * b.C.k;

  function newBoss(key, w) {
    const C = BOSS[key], x0 = w.arena.x0, chase = !!C.chase;
    const a0 = chase ? x0 : x0 + 11, a1 = chase ? x0 + ROAD_LEN : x0 + 11 + BOSS_W;
    return { key, C, x0, a0, a1, gy: w.arena.y, state: "wait", mode: "in", t: 0, t2: 0, at: 1.2, hp: C.hp, gem: C.gemerl || 0,
             x: a1 + 4, y: w.arena.y, vx: 0, vy: 0, face: -1, inv: 0, cards: {}, shots: [], fires: [], booms: [], camX: a0, lock: false, n: 0 };
  }
  function resetBoss(b) {
    for (const k in b.cards) world.group.remove(b.cards[k]);
    const nb = newBoss(b.key, world);
    world.boss = nb; music();
    return nb;
  }
  /* into the arena: it shuts, the camera holds, the boss comes */
  function lockArena(b) {
    b.lock = true; b.state = "fight"; b.mode = "in"; b.t = 0; b.camX = b.C.chase ? player.x + 3 : (b.a0 + b.a1) / 2;
    if (b.C.chase) { b.x = player.x + 14; b.y = b.gy; }
    sheetMats("bosses").mat.color.setHex(world.T.tint || 0xffffff);
    try { if (root.Sound && Sound.play) Sound.play(b.C.music || "rival"); } catch (e) {}
    hudToast(b.gem ? "Gemerl!" : b.C.name);
    SFX.warn();
  }
  const pinchOf = b => b.hp <= b.C.hp / 2;
  function bossHit(b, p) {
    if (b.inv > 0) return;
    b.inv = 0.9;
    if (b.gem > 0) { b.gem--; if (!b.gem) { b.mode = "gemout"; b.t2 = 0; } }
    else b.hp--;
    hitSpark(p.x + sgn(b.x - p.x) * 0.4, p.y + p.hh * 0.6, 1.5, 0xffffff); hitStop(0.07); shakeCam(0.14); SFX.hit(); SFX.impact();
    p.vx = -(sgn(b.x - p.x) || p.face) * 7; p.vy = Math.max(p.vy, 9); p.ground = false; p.airMove = false; p.airUses = 0;
    if (p.state === "homing" || p.state === "seek" || p.state === "dash" || p.state === "roll" || p.state === "glide") p.state = "run";
    p.curl = true;
    if (b.hp <= 0 && !b.gem) { b.state = "boom"; b.t = 0; b.shots.length = 0; b.fires.length = 0; SFX.boom(); }
  }
  /* a blow, a shot or a blast that reaches its weak spot (strike) */
  function bossStrike(x0, x1, y0, y1) {
    const b = world.boss;
    if (!b || b.state !== "fight" || b.inv > 0) return 0;
    const wk = BRAIN[b.key].weak(b);
    if (!wk || !ovl([x0, x1, y0, y1], wk)) return 0;
    bossHit(b, player);
    return 1;
  }
  /* a shot: falls if it has weight, bursts or bounces where it meets the floor */
  function bshot(b, o) { b.shots.push(Object.assign({ x: b.x, y: b.y + 1, vx: 0, vy: 0, g: 0, r: 0.35, life: 6, t: 0, fps: 12, mid: true }, o)); }
  function bfire(b, x, h, life) { b.fires.push({ x, t: 0, h: h || 1.8, life: life || 1.1 }); }
  function quake(b, x, range) {
    shakeCam(0.3); impact(x, b.gy, { c: 0xd8c8a8, flash: 1.2, shake: 0.2 });
    burst(x, b.gy + 0.1, [0xd8d0c0, 0xb0a890], 18, 6);
    const p = player;
    if (p.ground && Math.abs(p.x - x) < range) hurt(p, x);
  }
  const toward = (b, p) => (sgn(p.x - b.x) || b.face);

  /* each boss's mind: step, its weak spot, what hurts, and how it is drawn */
  const BRAIN = {
    hammer: {
      step(b, dt, p, pn) {
        const sp = pn ? 3.6 : 2.4;
        if (b.mode === "in") { b.x -= 5 * dt; b.face = -1; if (b.x <= b.a1 - 3) b.mode = "drive"; return; }
        if (b.mode === "drive") {
          b.x += b.face * sp * dt;
          if (b.x < b.a0 + 2.2) { b.x = b.a0 + 2.2; b.face = 1; } if (b.x > b.a1 - 2.2) { b.x = b.a1 - 2.2; b.face = -1; }
          b.at -= dt;
          if (pn && b.at <= 0 && Math.abs(p.x - b.x) < 6) { b.mode = "hop"; b.vy = 9; b.at = 2.6; }
        } else if (b.mode === "hop") {
          b.vy -= GRAV * dt; b.y += b.vy * dt; b.x += b.face * 1.5 * dt;
          if (b.y <= b.gy) { b.y = b.gy; b.mode = "drive"; quake(b, b.x + b.face * 1.6, 3.2); }
        }
      },
      weak(b) { const p = player, w = bw(b, "hammer.body"), h = bh(b, "hammer.body");
        const above = p.y > b.y + h * 0.55, behind = sgn(p.x - b.x) === -b.face;
        return above || behind ? [b.x - w * 0.42, b.x + w * 0.42, b.y + h * 0.3, b.y + h + 0.3] : null; },
      harm(b) { const w = bw(b, "hammer.body"), h = bh(b, "hammer.body"), f = b.face;
        return [[Math.min(b.x + f * w * 0.15, b.x + f * (w * 0.5 + 0.7)), Math.max(b.x + f * w * 0.15, b.x + f * (w * 0.5 + 0.7)), b.y, b.y + h * 0.8],
                [b.x - w * 0.45, b.x + w * 0.45, b.y, b.y + h * 0.35]]; },
      draw(b, show) { show("body", "hammer.body", Math.floor(world.t * 7) % 3, b.face, b.x, b.y, false, true); },
    },
    aero: {
      step(b, dt, p, pn) {
        const hi = b.gy + 2.8, lo = b.gy + 1.1;
        if (b.mode === "in") { b.x -= 6 * dt; b.y = hi; if (b.x <= b.a1 - 3) { b.mode = "fly"; b.at = 1.2; b.t2 = 0; } return; }
        b.t2 += dt;
        if (b.mode === "fly") {
          b.x += b.face * (pn ? 4.2 : 3) * dt;
          if (b.x < b.a0 + 1.5) b.face = 1; if (b.x > b.a1 - 1.5) b.face = -1;
          b.y = lerp(b.y, hi + Math.sin(b.t2 * 2) * 0.3, 1 - Math.exp(-dt * 3));
          b.at -= dt;
          if (b.at <= 0) { bshot(b, { name: "aero.bomb", y: b.y, vx: b.face * 1, g: 14, r: 0.3, land: "fire", fps: 10 }); b.at = pn ? 0.9 : 1.5; b.n++; }
          if (b.n >= (pn ? 4 : 3)) { b.mode = "swoop"; b.n = 0; b.t2 = 0; b.face = toward(b, p); }
        } else if (b.mode === "swoop") {
          b.y = lerp(b.y, lo, 1 - Math.exp(-dt * 4)); b.x += b.face * 2.2 * dt;
          if (b.x < b.a0 + 1.5) b.face = 1; if (b.x > b.a1 - 1.5) b.face = -1;
          if (b.t2 > 2.6) { b.mode = "fly"; b.at = 0.8; }
        }
      },
      weak(b) { const w = bw(b, "aero.body"), h = bh(b, "aero.body"); return [b.x - w * 0.45, b.x + w * 0.45, b.y, b.y + h]; },
      harm(b) { const w = bw(b, "aero.body"); return [[b.x - w * 0.2, b.x + w * 0.2, b.y - 0.4, b.y]]; },
      draw(b, show) { show("body", "aero.body", Math.floor(world.t * 10) % 3, b.face, b.x, b.y, false, true); },
    },
    cube: {
      step(b, dt, p, pn) {
        const top = b.gy + 5.5;
        if (b.mode === "in") { b.y = top; b.x -= 6 * dt; if (b.x <= b.a1 - 3) { b.mode = "hover"; b.t2 = 0; } return; }
        b.t2 += dt;
        if (b.mode === "hover") {
          b.y = lerp(b.y, top, 1 - Math.exp(-dt * 4)); b.x = lerp(b.x, clamp(p.x, b.a0 + 1.5, b.a1 - 1.5), 1 - Math.exp(-dt * (pn ? 2.6 : 1.8)));
          if (b.t2 > (pn ? 1.3 : 1.9)) { b.mode = "drop"; b.vy = 0; }
        } else if (b.mode === "drop") {
          b.vy -= GRAV * 1.4 * dt; b.y += b.vy * dt;
          if (b.y <= b.gy) { b.y = b.gy; b.mode = "sit"; b.t2 = 0; quake(b, b.x, 2.6); b.n++;
            if (b.n % 2 === 0) bshot(b, { name: "cube.mace", x: b.x + toward(b, p) * 1.2, y: b.gy + 0.8, vx: toward(b, p) * (pn ? 6 : 4.5), vy: 7, g: GRAV * 0.8, r: 0.6, bounce: 0.8, life: 4, fps: 10 });
            else for (const d of [-1, 1]) bshot(b, { name: "cube.soldier", x: b.x + d * 1.2, y: b.gy, vx: d * 2.2, g: 0, r: 0.4, walker: true, life: 5, fps: 8, mid: false }); }
        } else if (b.mode === "sit") { if (b.t2 > 1.6) { b.mode = "hover"; b.t2 = 0; } }
      },
      weak(b) { const w = bw(b, "cube.body"), h = bh(b, "cube.body"); return b.mode === "sit" ? [b.x - w * 0.5, b.x + w * 0.5, b.y, b.y + h] : null; },
      harm(b) { const w = bw(b, "cube.body"), h = bh(b, "cube.body"); return b.mode === "drop" || b.mode === "hover" ? [[b.x - w * 0.45, b.x + w * 0.45, b.y, b.y + h]] : []; },
      draw(b, show) { show("body", b.mode === "sit" ? "cube.body" : "cube.dark", b.mode === "sit" ? 2 : Math.floor(world.t * 6) % 2, 1, b.x, b.y, false, true); },
    },
    mecha: {
      step(b, dt, p, pn) {
        const sp = pn ? 1.35 : 1;
        if (b.mode === "in") { b.x -= 3 * dt; b.face = -1; if (b.x <= b.a1 - 3) { b.mode = "walk"; b.at = 1.2; } return; }
        b.t2 += dt; b.at -= dt;
        switch (b.mode) {
          case "walk":
            b.face = toward(b, p); b.x += b.face * 2.6 * sp * dt;
            if (Math.abs(p.x - b.x) < 1.5 && Math.abs(p.y - b.y) < 1.5) { b.mode = "punch"; b.t2 = 0; }
            else if (b.at <= 0) {
              const r = Math.random(); b.t2 = 0; b.at = 1.5 / sp;
              if (pn && Math.abs(p.x - b.x) > 5 && r < 0.45) b.mode = "shoot";
              else if (r < 0.6) { b.mode = "jump"; b.vy = 12.5; b.vx = b.face * 2.5; }
              else b.mode = "spin";
            }
            break;
          case "punch": if (b.t2 > 0.65) { b.mode = "walk"; b.at = 0.9; } break;
          case "jump": b.vy -= GRAV * dt; b.y += b.vy * dt; b.x += b.vx * dt; if (b.vy < 1) { b.mode = "glide"; b.face = toward(b, p); } break;
          case "glide": b.x += b.face * 7 * sp * dt; b.y -= 1.4 * dt;
            if (b.y <= b.gy || b.x <= b.a0 + 0.6 || b.x >= b.a1 - 0.6) { b.mode = "fall"; b.vy = 0; } break;
          case "fall": b.vy -= GRAV * dt; b.y += b.vy * dt; if (b.y <= b.gy) { b.y = b.gy; b.mode = "land"; b.t2 = 0; } break;
          case "land": if (b.t2 > 0.7) { b.mode = "walk"; b.at = 1; } break;
          case "spin": if (b.t2 > 0.45) b.x += b.face * 11 * sp * dt; if (b.t2 > 1.4 || b.x <= b.a0 + 0.6 || b.x >= b.a1 - 0.6) { b.mode = "land"; b.t2 = 0.25; } break;
          case "shoot": if (b.t2 > 0.35 && !b.fired) { b.fired = true; SFX.shot();
              bshot(b, { name: "mecha.missile", y: b.y + 0.7, vx: b.face * 8, r: 0.35, home: 1.6, life: 2.4, fps: 14 }); }
            if (b.t2 > 0.9) { b.mode = "walk"; b.fired = false; b.at = 1.2; } break;
        }
        b.x = clamp(b.x, b.a0 + 0.6, b.a1 - 0.6);
        if (b.mode !== "jump" && b.mode !== "glide" && b.mode !== "fall") b.y = b.gy;
      },
      weak(b) { return /^(walk|land|punch|shoot)$/.test(b.mode) ? [b.x - 0.45, b.x + 0.45, b.y, b.y + 1.3] : null; },
      harm(b) {
        if (b.mode === "punch" && b.t2 > 0.2 && b.t2 < 0.5) return [[Math.min(b.x, b.x + b.face * 1.4), Math.max(b.x, b.x + b.face * 1.4), b.y + 0.3, b.y + 1.1]];
        if (/^(glide|spin|jump)$/.test(b.mode)) return [[b.x - 0.6, b.x + 0.6, b.y, b.y + 1.1]];
        return [];
      },
      draw(b, show) {
        const m = pinchOf(b) ? "mecha.m" : "mecha.", t = world.t;
        const [n, i] = b.mode === "walk" || b.mode === "in" ? ["walk", Math.floor(t * 10) % 5] : b.mode === "punch" ? ["punch", Math.min(3, Math.floor(b.t2 * 8))] :
          b.mode === "glide" ? ["glide", Math.floor(t * 8) % 2] : b.mode === "jump" || b.mode === "spin" || b.mode === "fall" ? ["ball", Math.floor(t * 16) % 4] : ["stand", Math.floor(t * 3) % 2];
        show("body", m + n, i, b.face, b.x, b.y, false, true);
      },
    },
    ball: {
      step(b, dt, p, pn) {
        const L = b.a0 + 2, R = b.a1 - 2, sp = pn ? 1.4 : 1;
        if (b.mode === "in") { b.x = R; b.y = b.gy - 2; b.mode = "rise"; b.t2 = 0; b.side = 1; return; }
        b.t2 += dt;
        if (b.mode === "rise") { b.y = lerp(b.y, b.gy + 2.6, 1 - Math.exp(-dt * 5)); if (b.t2 > 0.8) { b.mode = "arc"; b.t2 = 0; b.from = b.x; b.to = b.side > 0 ? L : R; b.peak = 2.2 + Math.random() * 2.2; } }
        else if (b.mode === "arc") {
          const T = 2.2 / sp, u = Math.min(1, b.t2 / T);
          b.x = lerp(b.from, b.to, u); b.y = b.gy + 2.6 + Math.sin(u * PI) * b.peak;
          if (u >= 1) { b.mode = "sink"; b.t2 = 0; b.side = -b.side; }
        } else if (b.mode === "sink") { b.y = lerp(b.y, b.gy - 2, 1 - Math.exp(-dt * 5)); if (b.t2 > 0.9) { b.mode = "rise"; b.t2 = 0; } }
        b.at -= dt;
        if (b.at <= 0) {                                     // the spiked ball: out of one tube, low or high, into the other
          const fromR = Math.random() < 0.5, high = Math.random() < 0.4;
          bshot(b, { name: "ball.spike", x: fromR ? R : L, y: b.gy + (high ? 2.4 : 0.55), vx: (fromR ? -1 : 1) * (pn ? 7.5 : 5.5), r: 0.6, life: 3.6, fps: 8 });
          b.at = pn ? 1.6 : 2.4;
        }
      },
      weak(b) { return b.mode === "arc" ? [b.x - 0.7, b.x + 0.7, b.y - 0.8, b.y + 0.8] : null; },
      harm(b) { return []; },
      draw(b, show) {
        for (const [k, x] of [["tl", b.a0 + 2], ["tr", b.a1 - 2]]) for (let s = 0; s < 3; s++) show(k + s, "ball.tube", 0, 1, x, b.gy + s * bh(b, "ball.tube"), false);
        if (b.y > b.gy - 0.5) show("body", "ball.body", Math.floor(world.t * 6) % 2, b.face, b.x, b.y, true, true);
      },
    },
    bomber: {
      step(b, dt, p, pn) {
        const v = pn ? 8.4 : 7.2, end = b.a1 - 14;
        if (b.mode === "in") { b.mode = "drive"; b.at = 1.5; }
        if (b.x < end) { b.x += v * dt; b.face = 1; } else b.x = end;
        b.camX = Math.min(b.x - 3.5, end - 3.5);
        if (p.x > b.x - 0.8) b.x = Math.min(end, b.x + (p.x - b.x + 0.8) * dt * 4);
        b.at -= dt;
        if (b.at <= 0) {
          SFX.shot(); b.at = pn ? 1.1 : 1.7;
          bshot(b, { name: "bomber.ball", x: b.x - 1.2, y: b.y + 1.9, vx: -(3 + Math.random() * 3), vy: 7, g: GRAV * 0.7, r: 0.35, land: "fire", fps: 10 });
        }
      },
      weak(b) { const w = bw(b, "bomber.body"), h = bh(b, "bomber.body"); return [b.x - w * 0.45, b.x + w * 0.3, b.y + h * 0.35, b.y + h]; },
      harm(b) { const w = bw(b, "bomber.body"), h = bh(b, "bomber.body"); return [[b.x - w * 0.45, b.x + w * 0.45, b.y, b.y + h * 0.35]]; },
      draw(b, show) { show("body", b.inv > 0.6 ? "bomber.flash" : "bomber.body", Math.floor(world.t * 8) % 3, -b.face, b.x, b.y, false, true); },
    },
    totem: {
      step(b, dt, p, pn) {
        if (b.mode === "in") { b.x -= 3 * dt; b.face = -1; if (b.x <= b.a1 - 3) { b.mode = "roll"; b.at = 1.4; } return; }
        b.x += b.face * (pn ? 2.2 : 1.4) * dt;
        if (b.x < b.a0 + 1.5) b.face = 1; if (b.x > b.a1 - 1.5) b.face = -1;
        b.at -= dt;
        if (b.at <= 0) {
          const d = toward(b, p), high = (b.n++ % (pn ? 2 : 3)) === 2 || (pn && Math.random() < 0.4);
          bshot(b, { name: "totem.bar", x: b.x + d * 1.2, y: b.gy + (high ? 1.7 : 0.45), vx: d * (pn ? 7 : 5.5), r: 0.5, w: 1.2, life: 3.5, fps: 12 });
          b.at = pn ? 1.2 : 1.8; SFX.shot();
        }
        b.zap = (b.at < 0.5);
      },
      weak(b) { const w = bw(b, "totem.body"), h = bh(b, "totem.body"); return [b.x - w * 0.5, b.x + w * 0.5, b.y + h * 0.72, b.y + h + 0.3]; },
      harm(b) { const w = bw(b, "totem.body"), h = bh(b, "totem.body"); return [[b.x - w * 0.42, b.x + w * 0.42, b.y, b.y + h * (b.zap ? 0.72 : 0.25)]]; },
      draw(b, show) { const h = bh(b, "totem.body"); show("body", "totem.body", Math.floor(world.t * 8) % 3, b.face, b.x, b.y, false, true);
        if (b.zap) show("zap", "totem.spark", Math.floor(world.t * 20) % 5, 1, b.x, b.y + h * 0.48, true); },
    },
    spider: {
      step(b, dt, p, pn) {
        const hang = b.gy + 3.6, low = b.gy + 0.9;
        if (b.mode === "in") { b.x = (b.a0 + b.a1) / 2; b.y = b.gy + 9; b.mode = "down"; return; }
        b.t2 += dt;
        if (b.mode === "down") { b.y = lerp(b.y, hang, 1 - Math.exp(-dt * 3)); if (Math.abs(b.y - hang) < 0.1) { b.mode = "hang"; b.t2 = 0; b.at = 1; } }
        else if (b.mode === "hang") {
          b.x = lerp(b.x, clamp(p.x, b.a0 + 1.5, b.a1 - 1.5), 1 - Math.exp(-dt * (pn ? 1.6 : 1.1))); b.y = hang + Math.sin(b.t2 * 3) * 0.15;
          b.at -= dt;
          if (b.at <= 0) { for (let k = 0; k < (pn ? 4 : 3); k++) bshot(b, { name: "spider.ice", x: b.a0 + 1.5 + Math.random() * (b.a1 - b.a0 - 3), y: b.gy + 7 + k * 0.8, g: 18, r: 0.35, life: 3, fps: 1, mid: true, shatter: true });
            b.at = pn ? 2 : 2.8; shakeCam(0.12); SFX.impact(); }
          if (b.t2 > (pn ? 4 : 5.5)) { b.mode = "stamp"; b.t2 = 0; }
        } else if (b.mode === "stamp") { b.y = lerp(b.y, low, 1 - Math.exp(-dt * 7)); if (b.t2 > 0.35 && !b.stamped) { b.stamped = true; quake(b, b.x, 1.6); } if (b.t2 > 1.8) { b.mode = "down"; b.stamped = false; } }
      },
      weak(b) { const w = bw(b, "spider.body"), h = bh(b, "spider.body"); return [b.x - w * 0.42, b.x + w * 0.42, b.y, b.y + h * 0.75]; },
      harm(b) { const w = bw(b, "spider.body"); return b.mode === "stamp" && b.t2 < 0.5 ? [[b.x - w * 0.5, b.x + w * 0.5, b.y - 0.3, b.y + 0.4]] : []; },
      draw(b, show) {
        show("body", "spider.body", b.mode === "stamp" ? 3 + Math.floor(world.t * 8) % 3 : Math.floor(world.t * 5) % 3, 1, b.x, b.y, false, true);
        for (let k = 0; k < 6; k++) show("th" + k, "snake.shot", 1, 1, b.x, b.y + bh(b, "spider.body") + 0.3 + k * 0.5, true, false, 0.6);    // its thread
      },
    },
    press: {
      step(b, dt, p, pn) {
        if (b.mode === "in") { b.x -= 4 * dt; b.y = b.gy; if (b.x <= b.a1 - 3) { b.mode = "set"; b.t2 = 0; b.n = 0; } return; }
        b.t2 += dt;
        if (b.mode === "set") { if (b.t2 > (pn ? 0.3 : 0.5)) { b.mode = "air"; b.n++; const big = b.n % 3 === 0; b.big = big; b.vy = big ? 15 : 8.5; b.face = toward(b, p); b.vx = b.face * (big ? 2.5 : (pn ? 4 : 3)); } }
        else if (b.mode === "air") {
          b.vy -= GRAV * dt; b.y += b.vy * dt; b.x += b.vx * dt;
          if (b.x < b.a0 + 1.3 || b.x > b.a1 - 1.3) { b.x = clamp(b.x, b.a0 + 1.3, b.a1 - 1.3); b.vx = -b.vx; }
          if (b.y <= b.gy) { b.y = b.gy; b.mode = "set"; b.t2 = 0; if (b.big) quake(b, b.x, BOSS_W); SFX.spring(); }
        }
      },
      weak(b) { const w = bw(b, "press.body"), h = bh(b, "press.body"); return [b.x - w * 0.5, b.x + w * 0.5, b.y + h * 0.55, b.y + h + 0.2]; },
      harm(b) { const w = bw(b, "press.body"), h = bh(b, "press.body"); return [[b.x - w * 0.25, b.x + w * 0.25, b.y, b.y + h * 0.5]]; },
      draw(b, show) { show("body", "press.body", b.mode === "set" ? 3 + Math.min(2, Math.floor(b.t2 * 10)) : b.vy > 4 ? 0 : 1, b.face, b.x, b.y, false, true); },
    },
    hammer3: {
      step(b, dt, p, pn) {
        b.t2 += dt;
        if (b.mode === "in") { b.x = b.a1 + 2; b.y = b.gy; b.mode = "gstand"; b.t2 = 0; b.face = -1; b.x = b.a1 - 3; return; }
        if (b.mode === "gstand") { b.face = toward(b, p); if (b.t2 > 1.2) { b.mode = "gdash"; b.t2 = 0; } return; }
        if (b.mode === "gdash") { b.x += b.face * 10 * dt; if (b.x <= b.a0 + 1 || b.x >= b.a1 - 1) { b.x = clamp(b.x, b.a0 + 1, b.a1 - 1); b.mode = "gstand"; b.t2 = 0; } return; }
        if (b.mode === "gemout") { b.y += 9 * dt; b.x += 4 * dt; if (b.t2 > 1.2) { b.mode = "drop"; b.t2 = 0; b.x = (b.a0 + b.a1) / 2; b.y = b.gy + 10; hudToast(b.C.name); } return; }
        const hi = b.gy + 4.4;
        if (b.mode === "drop") { b.y = lerp(b.y, hi, 1 - Math.exp(-dt * 3)); if (b.t2 > 1.4) { b.mode = "swing"; b.t2 = 0; } }
        else if (b.mode === "swing") {
          b.x = lerp(b.x, clamp(p.x - sgn(p.x - b.x) * 0.5, b.a0 + 1.5, b.a1 - 1.5), 1 - Math.exp(-dt * (pn ? 1.8 : 1.2))); b.y = hi;
          if (b.t2 > (pn ? 2 : 2.8)) { b.mode = "slam"; b.t2 = 0; }
        } else if (b.mode === "slam") {
          b.y = lerp(b.y, b.gy + 1.7, 1 - Math.exp(-dt * 9));
          if (b.t2 > 0.3 && !b.slammed) { b.slammed = true; quake(b, b.x, 1.8); }
          if (b.t2 > 1.7) { b.mode = "swing"; b.t2 = 0; b.slammed = false; }
        }
      },
      weak(b) {
        if (b.mode === "gstand") return [b.x - 0.45, b.x + 0.45, b.y, b.y + 1.5];
        if (/^g/.test(b.mode) || b.mode === "drop") return null;
        const w = bw(b, "hammer3.pod"); return [b.x - w * 0.5, b.x + w * 0.5, b.y, b.y + w];
      },
      harm(b) {
        if (b.mode === "gdash") return [[b.x - 0.6, b.x + 0.6, b.y, b.y + 1.4]];
        if (/^g/.test(b.mode)) return [];
        const sw = b.mode === "swing" ? Math.sin(b.t2 * 3.2) * 1.4 : 0, hx = b.x + sw, w = bw(b, "hammer3.head"), hy = b.y - 1.6;
        return [[hx - w * 0.45, hx + w * 0.45, hy - 0.4, hy + 0.6]];
      },
      draw(b, show) {
        if (/^g/.test(b.mode)) {
          const [n, i] = b.mode === "gdash" ? ["gemerl.dash", Math.floor(world.t * 12) % 2] : b.mode === "gemout" ? ["gemerl.hurt", 0] : ["gemerl.stand", Math.floor(world.t * 3) % 2];
          show("gem", n, i, b.face, b.x, b.y, false, true, 1.2); return;
        }
        const sw = b.mode === "swing" ? Math.sin(b.t2 * 3.2) * 1.4 : 0, hy = b.y - 1.6;
        for (let k = 1; k <= 3; k++) show("l" + k, "hammer3.link", 0, 1, b.x + sw * k / 4, b.y - k * 0.4, true);
        show("head", b.inv > 0.5 ? "hammer3.headhit" : "hammer3.head", 0, 1, b.x + sw, hy - 0.4, false);
        show("body", b.inv > 0.5 ? "hammer3.podhit" : "hammer3.pod", Math.floor(world.t * 6) % 3, 1, b.x, b.y, false, true);
      },
    },
    snake: {
      step(b, dt, p, pn) {
        if (b.mode === "in") { b.x -= 4 * dt; b.y = b.gy + 0.3; if (b.x <= b.a1 - 3) { b.mode = "shut"; b.t2 = 0; b.at = 1.5; } return; }
        b.t2 += dt; b.spin = (b.spin || 0) + dt * (pn ? 3.2 : 2.2);
        b.x += b.face * (pn ? 2.4 : 1.6) * dt;
        if (b.x < b.a0 + 2.5) b.face = 1; if (b.x > b.a1 - 2.5) b.face = -1;
        if (b.mode === "shut" && b.t2 > 2.4) { b.mode = "open"; b.t2 = 0; }
        else if (b.mode === "open" && b.t2 > (pn ? 1.6 : 2.2)) { b.mode = "shut"; b.t2 = 0; }
        b.at -= dt;
        if (b.at <= 0) { const d = toward(b, p); bshot(b, { name: "snake.shot", x: b.x + d, y: b.y + 0.8, vx: d * 6, vy: 0, r: 0.25, life: 3, fps: 10 }); b.at = pn ? 1.3 : 2; SFX.shot(); }
      },
      balls(b) { return [0, PI].map(a => [b.x + Math.cos(b.spin + a) * 2, b.y + 1 + Math.sin(b.spin + a) * 1.4]); },
      weak(b) { const w = bw(b, "snake.body"), h = bh(b, "snake.body"); return b.mode === "open" ? [b.x - w * 0.5, b.x + w * 0.5, b.y + h * 0.4, b.y + h + 0.3] : null; },
      harm(b) { const w = bw(b, "snake.body"), h = bh(b, "snake.body");
        return BRAIN.snake.balls(b).map(([x, y]) => [x - 0.5, x + 0.5, y - 0.5, y + 0.5]).concat(b.mode === "shut" ? [[b.x - w * 0.5, b.x + w * 0.5, b.y, b.y + h]] : []); },
      draw(b, show) {
        show("body", "snake.body", b.mode === "open" ? (Math.floor(world.t * 4) % 2 ? 0 : 5) : 1 + Math.floor(world.t * 8) % 3, 1, b.x, b.y, false, true);
        BRAIN.snake.balls(b).forEach(([x, y], k) => {
          for (let c = 1; c <= 3; c++) show("c" + k + c, "snake.shot", 1, 1, lerp(b.x, x, c / 4), lerp(b.y + 1, y, c / 4), true, false, 0.7);
          show("s" + k, "snake.spike", 0, 1, x, y, true);
        });
      },
    },
    saucer: {
      step(b, dt, p, pn) {
        const v = pn ? 8.2 : 7, end = b.a1 - 16;
        if (b.mode === "in") { b.mode = "fly"; b.at = 1.6; b.y = b.gy + 2.6; }
        if (b.x < end) b.x += v * dt; else b.x = end;
        b.camX = Math.min(b.x - 3, end - 3);
        if (p.x > b.x + 1) b.x = Math.min(end, b.x + (p.x - b.x - 1) * dt * 4);
        b.t2 += dt; b.at -= dt;
        if (b.mode === "fly") { b.y = lerp(b.y, b.gy + 2.6, 1 - Math.exp(-dt * 3));
          if (b.at <= 0) { b.mode = "fists"; b.t2 = 0; b.fx = [p.x + 2.2, p.x - 1.6]; b.fy = b.gy + 4.6; } }
        else if (b.mode === "fists") {
          b.fy = b.t2 < 0.7 ? b.gy + 4.6 : Math.max(b.gy, b.fy - 30 * dt);
          if (b.fy <= b.gy && !b.slam) { b.slam = true; quake(b, b.fx[0], 0.9); quake(b, b.fx[1], 0.9); }
          if (b.t2 > 1.6) { b.mode = "dip"; b.t2 = 0; b.slam = false; }
        } else if (b.mode === "dip") { b.y = lerp(b.y, b.gy + 0.4, 1 - Math.exp(-dt * 5)); if (b.t2 > 2.2) { b.mode = "fly"; b.at = pn ? 1.4 : 2.2; } }
      },
      weak(b) { const w = bw(b, "saucer.pod"), h = bh(b, "saucer.ring"); const cy = b.y + h * 0.5; return [b.x - w * 0.55, b.x + w * 0.55, cy - w * 0.6, cy + w * 0.6]; },
      harm(b) { if (b.mode !== "fists") return []; return b.fx.map(x => [x - 0.6, x + 0.6, b.fy, b.fy + 1.2]); },
      draw(b, show) {
        const h = bh(b, "saucer.ring");
        show("ring", "saucer.ring", Math.floor(world.t * 10) % 6, 1, b.x, b.y, false, false, undefined, -0.05);
        show("body", b.inv > 0.5 ? "saucer.podhit" : "saucer.pod", 0, 1, b.x, b.y + h * 0.5, true, true);
        if (b.mode === "fists") b.fx.forEach((x, k) => show("f" + k, "saucer.fist", 0, k ? 1 : -1, x, b.fy, false));
        else [-1, 1].forEach((d, k) => show("f" + k, "saucer.hand", 0, -d, b.x + d * bw(b, "saucer.ring") * 0.62, b.y + h * 0.35, false));
      },
    },
    frog: {
      step(b, dt, p, pn) {
        if (b.mode === "in") { b.x = b.a1 - 3; b.y = b.gy + 10; b.vy = 0; b.mode = "fall"; return; }
        b.t2 += dt;
        if (b.mode === "fall" || b.mode === "leap") {
          b.vy -= GRAV * dt; b.y += b.vy * dt; b.x += (b.vx || 0) * dt;
          if (b.y <= b.gy) { b.y = b.gy; b.vx = 0; b.mode = "sit"; b.t2 = 0; quake(b, b.x, 2.4); b.fired = 0; }
        } else if (b.mode === "sit") {
          b.face = toward(b, p);
          if (b.t2 > 0.5 && b.fired === 0) { b.fired = 1;
            if (Math.random() < 0.5) { for (let k = 0; k < 4; k++) bfire(b, b.x + b.face * (1.4 + k * 0.7), 0.9, 0.9); SFX.blast(); }
            else for (let k = -1; k <= 1; k++) bshot(b, { name: "frog.shot", x: b.x + b.face * 1, y: b.y + 1.2, vx: b.face * 6, vy: k * 2.4, r: 0.25, life: 3, fps: 12 }); }
          if (b.t2 > (pn ? 1.3 : 1.9)) { b.mode = "leap"; b.t2 = 0; const to = b.x < (b.a0 + b.a1) / 2 ? b.a1 - 3 : b.a0 + 3; b.vy = pn ? 16 : 14; b.vx = (to - b.x) / (2 * b.vy / GRAV); }
        }
      },
      weak(b) { const w = bw(b, "frog.body"), h = bh(b, "frog.body"); return b.mode === "sit" ? [b.x - w * 0.5, b.x + w * 0.5, b.y, b.y + h] : null; },
      harm(b) { const w = bw(b, "frog.body"), h = bh(b, "frog.body"); return b.mode !== "sit" ? [[b.x - w * 0.45, b.x + w * 0.45, b.y, b.y + h]] : []; },
      draw(b, show) { show("body", b.inv > 0.6 ? "frog.flash" : pinchOf(b) ? "frog.hurt" : "frog.body", b.mode === "sit" ? Math.floor(world.t * 6) % 5 : 0, b.face, b.x, b.y, false, true); },
    },
  };

  function stepBoss(dt) {
    const w = world, b = w.boss, p = player;
    if (!b || battle || !p) return;
    if (p.dead) { if (b.lock && b.state !== "done" && b.state !== "capsule") b.reset = true; return; }
    if (b.reset) { resetBoss(b); return; }
    if (b.state === "wait") { if (p.x > b.a0 + (b.C.chase ? 2 : 1.5)) lockArena(b); return; }
    b.t += dt; b.inv = Math.max(0, b.inv - dt);
    /* the arena's walls: one screen (or, on a chase, the camera's view, going on with the boss) */
    const hw = w.viewHalfW || 8;
    const L = b.C.chase ? b.camX - hw + 0.6 : b.a0 + 0.5, R = b.C.chase ? b.camX + hw - 0.6 : b.a1 - 0.5;
    if (b.lock) { if (p.x < L) { p.x = L; if (p.vx < 0) p.vx = 0; } if (p.x > R) { p.x = R; if (p.vx > 0) p.vx = 0; } }
    if (b.state === "fight") {
      const B = BRAIN[b.key];
      B.step(b, dt, p, pinchOf(b));
      if (b.mode !== "in") {
        const P = [p.x - p.c.w / 2, p.x + p.c.w / 2, p.y, p.y + p.hh];
        const hitting = attacking(p) || p.state === "seek" || (p.state === "atk" && p.mv);
        const wk = B.weak(b), stomp = p.vy < -0.5 && wk && p.y > (wk[2] + wk[3]) / 2;
        if (wk && ovl(P, wk) && (hitting || stomp)) bossHit(b, p);
        else if (p.inv <= 0 && p.star <= 0) for (const h of B.harm(b)) if (ovl(P, h)) { hurt(p, b.x); break; }
      }
    } else if (b.state === "boom") {
      if (b.t % 0.14 < dt) { b.booms.push({ x: b.x + (Math.random() - 0.5) * 2.4, y: b.y + Math.random() * 2.2, t: 0 }); SFX.boom(); shakeCam(0.08); }
      if (b.t > 2.4) { b.state = "flee"; b.t = 0; b.my = b.y + 1.2; b.mx = b.x;
        b.cap = { x: b.C.chase ? b.camX + 2 : clamp(p.x + 3, b.a0 + 2, b.a1 - 2), y: b.gy + 11, vy: 0, open: false, t: 0 };
        for (let k = 0; k < 10; k++) burst(b.x + (Math.random() - 0.5) * 2, b.y + Math.random() * 2, [0x8a8a8a, 0x5a5a5a, 0xffd040], 6, 7); }
    } else if (b.state === "flee" || b.state === "capsule" || b.state === "done") {
      b.mx += 7 * dt; b.my += 3.2 * dt;
      const c = b.cap;
      if (!c.landed) { c.vy -= GRAV * 0.6 * dt; c.y = Math.max(b.gy, c.y + c.vy * dt); if (c.y <= b.gy) { c.landed = true; shakeCam(0.12); SFX.impact(); b.state = "capsule"; } }
      const cw = bw(b, "flee.capsule") * 0.42, ch = bh(b, "flee.capsule");
      if (!c.open) {
        /* its walls: a runner stands on it, or is stopped by its sides */
        if (p.x + p.c.w / 2 > c.x - cw && p.x - p.c.w / 2 < c.x + cw && p.y < c.y + ch - 0.3 && p.y + p.hh > c.y) { p.x = p.x < c.x ? c.x - cw - p.c.w / 2 : c.x + cw + p.c.w / 2; p.vx = 0; }
        if (c.landed && Math.abs(p.x - c.x) < cw && p.y >= c.y + ch - 0.4 && p.y <= c.y + ch + 0.6 && p.vy <= 0) {
          c.open = true; c.t = 0; b.state = "done"; p.y = c.y + ch - 0.45; p.vy = 6; p.ground = false;
          SFX.pop(); SFX.check(); burst(c.x, c.y + ch, [0xffffff, 0xffd040], 16, 6);
          for (let k = 0; k < 8; k++) setTimeout(() => world && spawnCritter(c.x + (Math.random() - 0.5) * 1.6, c.y + 0.6), k * 120);
        }
      } else {
        c.t += dt;
        if (c.t > 1.6 && mode === "play") { try { music(); } catch (e) {} finish(p); }
      }
    }
    // shots
    for (const s of b.shots) {
      s.t += dt; s.life -= dt;
      if (s.home) s.vy += clamp((p.y + 0.6 - s.y) * s.home, -6, 6) * dt;
      if (s.g) s.vy -= s.g * dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.y - (s.mid ? s.r : 0) <= b.gy && s.vy <= 0) {
        if (s.land === "fire") { bfire(b, s.x, 1.8, 1.1); s.life = 0; SFX.blast(); }
        else if (s.shatter) { burst(s.x, b.gy + 0.2, [0xc8f0ff, 0xffffff], 8, 4); s.life = 0; }
        else if (s.bounce) { s.y = b.gy + s.r; s.vy = Math.abs(s.vy) * s.bounce; if (s.vy < 3) s.vy = 7; }
        else if (s.walker) { s.y = b.gy; s.vy = 0; }
      }
      if (!b.C.chase && (s.x < b.a0 - 1 || s.x > b.a1 + 1)) { if (s.walker || s.bounce) s.vx = -s.vx; else s.life = 0; }
      const r = s.r, hw2 = s.w || r;
      const box = s.mid ? [s.x - hw2, s.x + hw2, s.y - r, s.y + r] : [s.x - hw2, s.x + hw2, s.y, s.y + r * 2.4];
      const P = [p.x - p.c.w / 2, p.x + p.c.w / 2, p.y, p.y + p.hh];
      if (s.life > 0 && ovl(P, box)) {
        if (s.walker && (attacking(p) || p.vy < -0.5)) { s.life = 0; burst(s.x, s.y + 0.4, [0xffffff, 0xd8d8d8], 8, 4); SFX.stomp(); if (p.vy < 0) p.vy = 9; }
        else if (p.inv <= 0 && p.star <= 0) { hurt(p, s.x); if (!s.bounce && !s.walker) s.life = 0; }
      }
    }
    b.shots = b.shots.filter(s => s.life > 0);
    for (const f of b.fires) {
      f.t += dt;
      const P = [p.x - p.c.w / 2, p.x + p.c.w / 2, p.y, p.y + p.hh];
      if (p.inv <= 0 && p.star <= 0 && ovl(P, [f.x - 0.35, f.x + 0.35, b.gy, b.gy + f.h * Math.min(1, f.t * 4)])) hurt(p, f.x);
    }
    b.fires = b.fires.filter(f => f.t < f.life);
    for (const o of b.booms) o.t += dt;
    b.booms = b.booms.filter(o => o.t < 0.42);
  }
  /* the camera on a locked arena: held on it (on a chase, running with the boss) */
  function bossCamX(b, halfW) {
    if (b.C.chase) return b.camX;
    const c = (b.a0 + b.a1) / 2;
    return halfW * 2 >= b.a1 - b.a0 ? c : clamp(camX, b.a0 + halfW, b.a1 - halfW);
  }
  function drawBoss() {
    const b = world.boss; if (!b || battle) return;
    for (const k in b.cards) b.cards[k].visible = false;
    if (b.state === "wait") return;
    const flick = b.inv > 0 && Math.floor(world.t * 30) % 2 === 0;
    /* a piece of it: frame i of `name`, facing `face` (-1 left, as the sheets draw them; 1 right),
       at x, y (its feet, or its middle) */
    const show = (id, name, i, face, x, y, mid, body, k, z) => {
      if (body && flick) return;
      let m = b.cards[id];
      if (!m) { m = b.cards[id] = makeCard("bosses"); world.group.add(m); }
      m.visible = true;
      setFrame(m, name, i, face < 0 ? 1 : -1, x, y, mid, z == null ? 0.05 : z, b.C.k * (k || 1));
    };
    if (b.state === "fight") BRAIN[b.key].draw(b, show);
    b.shots.forEach((s, k) => show("shot" + k, s.name, Math.floor(s.t * s.fps) % fr(s.name).length, s.vx > 0 ? 1 : -1, s.x, s.y, s.mid, false));
    b.fires.forEach((f, k) => show("fire" + k, "aero.fire", Math.floor(f.t * 12) % 7, 1, f.x, b.gy, false, false, f.h / 1.9));
    b.booms.forEach((o, k) => show("boom" + k, "hammer.boom", Math.floor(o.t * 12), 1, o.x, o.y, true, false));
    if (b.state === "boom" && !flick) BRAIN[b.key].draw(b, (id, name, i, face, x, y, mid, body, k, z) => show(id, name, i, face, x, y, mid, false, k, z));
    if (b.cap) {
      show("mobile", "flee.mobile", Math.floor(world.t * 8) % 4, 1, b.mx, b.my, true, false);
      show("cap", b.cap.open ? "flee.open" : "flee.capsule", 0, 1, b.cap.x, b.cap.y, false, false);
    }
  }

  // ---------------------------------------------------------------- the finish
  function finish(p) {
    mode = "goal"; p.state = "run";
    if (world.goal) { world.goal.fire = 2.5; world.goal.fireT = 0; }
    SFX.goal();
    const time = world.t;
    const st = curDef();
    const prev = saveData.stages[st.id] || {};
    const shoesBefore = (prev.shoes || []).slice(0, p.shoes.length).concat(p.shoes.map(() => false)).slice(0, p.shoes.length);
    const shoes = shoesBefore.map((b, i) => b || p.shoes[i]);
    const pct = world.total ? Math.min(1, p.ringsGot / world.total) : 1;
    const par = st.par || 90;
    let score = 0;
    score += time <= par ? 2 : time <= par * 1.35 ? 1 : 0;
    score += pct >= 0.8 ? 2 : pct >= 0.5 ? 1 : 0;
    score += p.falls === 0 ? 1 : 0;
    const grade = score >= 5 ? "S" : score >= 4 ? "A" : score >= 2 ? "B" : "C";
    const order = "CBAS";
    let earned = 0;
    if (!prev.clear) earned += PAY.clear;
    shoes.forEach((b, i) => { if (b && !shoesBefore[i]) earned += PAY.shoe; });
    if (grade === "S" && prev.grade !== "S") earned += PAY.sRank;
    const best = prev.best == null || time < prev.best;
    saveData.stages[st.id] = {
      clear: true, best: best ? time : prev.best, shoes,
      grade: prev.grade && order.indexOf(prev.grade) > order.indexOf(grade) ? prev.grade : grade,
      carrots: Math.max(prev.carrots || 0, p.carrots), by: best ? p.c.id : prev.by,
    };
    save(saveData);
    if (earned && root.Stable && Stable.grant) Stable.grant(earned, "adventure");
    setTimeout(() => results({ time, best, grade, carrots: p.carrots, total: world.total, shoes: p.shoes, shoesAll: shoes, falls: p.falls, earned, par }), 1700);
  }
  function goalStep(p) { if (p.ground && Math.abs(p.vx) < 0.5) p.face = 1; }
  function fireworks(dt) {
    const g = world.goal;
    g.fire -= dt; g.fireT -= dt;
    if (g.fireT <= 0 && g.fire > 0) {
      g.fireT = 0.28;
      const C = [[0xe8403a, 0xfff3a0], [0x3a8ae0, 0xffffff], [0xf2b705, 0xffffff], [0x5ab84a, 0xe8fffc], [0x39c5bb, 0xf08ac0]];
      burst(g.x + (Math.random() - 0.3) * 8, g.y + 5 + Math.random() * 3, C[Math.floor(Math.random() * C.length)], 26, 7);
      tone(200 + Math.random() * 300, 60, 0.3, "triangle", 0.05);
    }
  }

  // ---------------------------------------------------------------- input
  /* Space jumps; Z, X and C are the light attack, the heavy attack and the special; the
     arrows or WASD move, and Up and Down pick the heavy or the special. A pad: A jumps, X,
     Y and B are light, heavy and special. */
  const KEYS = { ArrowLeft: "L", a: "L", A: "L", ArrowRight: "R", d: "R", D: "R", ArrowDown: "D", s: "D", S: "D", ArrowUp: "U", w: "U", W: "U",
                 " ": "J", z: "Z", Z: "Z", x: "X", X: "X", c: "C", C: "C" };
  function onKey(e, down) {
    if (!host) return;
    if (rebind) { if (down) takeRebind(e); e.preventDefault(); return; }   // Options: the next key pressed is the new one
    const k = e.key, duo = !!(battle && battle.duo);
    const b = KEYS[k];
    if (menuKey(e, down)) return;
    if (k === "Escape" || ((k === "p" || k === "P") && !duo)) { if (down && mode === "play") togglePause(); e.preventDefault(); return; }
    if (duo) {                                           // two on one keyboard: each their own keys
      const hit = duoKey(e.code);
      if (hit) { e.preventDefault(); duoKeys[hit[0]][hit[1]] = down ? 1 : 0; }
      return;
    }
    if (!b) return;
    if (mode === "play" || mode === "goal") e.preventDefault();
    keys[b] = down ? 1 : 0;
  }
  const kd = e => onKey(e, true), ku = e => onKey(e, false);

  /* The menus by keyboard. Enter goes on from the title to the stage select, starts the
     stage from the stage select, and opens and closes the pause menu in a run; in any menu the
     arrows move between its buttons (to the nearest one that way), Z presses the one picked
     (Enter too, on the pause and results screens) and X backs out: to the hall from the
     title, to the title from the stage select, back into the run from the pause menu, to the
     stage select from the results. Returns true if it took the key. */
  let kbFocus = null, kbUsed = false;
  const NAV = { ArrowLeft: "L", ArrowRight: "R", ArrowUp: "U", ArrowDown: "D" };
  function menuKey(e, down) {
    const k = e.key, inMenu = GLIDE[mode] || mode === "menu" || mode === "results" || (mode === "play" && paused);
    if (k === "Enter" && mode === "play" && !paused) { if (down && !e.repeat) { kbUsed = true; togglePause(); } e.preventDefault(); return true; }
    if (mode === "scene") {                              // the story's talk: Z, Enter or Space on, X skips the scene
      const go = k === "z" || k === "Z" || k === "Enter" || k === " ", skip = k === "x" || k === "X";
      if (!go && !skip) return !!NAV[k];
      e.preventDefault();
      if (down && !e.repeat) { if (go) sceneNext(); else sceneSkip(); }
      return true;
    }
    if (!inMenu) return false;
    const z = k === "z" || k === "Z", x = k === "x" || k === "X";
    if (!(NAV[k] || z || x || k === "Enter")) return false;
    e.preventDefault();
    if (!down) return true;
    kbUsed = true;
    const ov = host.querySelector(".adv-ov"), click = sel => { const el = ov && ov.querySelector(sel); if (el && !el.disabled) el.click(); };
    if (NAV[k]) { moveFocus(NAV[k]); return true; }
    if (e.repeat) return true;
    if (k === "Enter") {                                 // a screen's own Enter button, or the one picked
      if (mode === "play") togglePause();
      else { const el = ov && ov.querySelector("[data-enter]"); if (el && !el.disabled) el.click(); else pressFocus(); }
      return true;
    }
    if (z) { pressFocus(); return true; }
    if (mode === "play") togglePause();
    else click("[data-back]");                           // each screen marks its way back
    return true;
  }
  function menuItems() {
    const ov = host && host.querySelector(".adv-ov");
    return ov ? [...ov.querySelectorAll("button:not([disabled])")].filter(el => el.offsetParent !== null) : [];
  }
  function defaultFocus() {
    const ov = host.querySelector(".adv-ov"), items = menuItems();
    return (ov && (ov.querySelector("[data-focus]") || ov.querySelector("#advRes") || ov.querySelector("#advNext") || ov.querySelector("#advMenu") || ov.querySelector("#advStart") || ov.querySelector("#advTStart"))) || items[0] || null;
  }
  function setFocus(el) {
    if (kbFocus) kbFocus.classList.remove("kb");
    kbFocus = el;
    if (!el) return;
    el.classList.add("kb");
    try { el.focus({ preventScroll: true }); } catch (err) {}
    el.scrollIntoView({ block: "nearest" });
  }
  /* to the nearest button that way: the closest straight ahead, a step aside counting double */
  function moveFocus(dir) {
    const items = menuItems();
    if (!items.includes(kbFocus)) { setFocus(defaultFocus()); return; }
    const r0 = kbFocus.getBoundingClientRect(), cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
    let best = null, bd = Infinity;
    for (const el of items) {
      if (el === kbFocus) continue;
      const r = el.getBoundingClientRect(), dx = r.left + r.width / 2 - cx, dy = r.top + r.height / 2 - cy;
      const along = dir === "L" ? -dx : dir === "R" ? dx : dir === "U" ? -dy : dy;
      if (along <= 4) continue;
      const d = along + 2 * (dir === "L" || dir === "R" ? Math.abs(dy) : Math.abs(dx));
      if (d < bd) { bd = d; best = el; }
    }
    if (best) setFocus(best);
  }
  function pressFocus() {
    if (!menuItems().includes(kbFocus)) { setFocus(defaultFocus()); return; }
    const el = kbFocus;
    el.click();
    if (el.isConnected && menuItems().includes(el)) setFocus(el);      // a runner or stage picked: stay on it
  }
  /* a menu just drawn: if the keys are in use, start on its first choice */
  function autoFocus() { kbFocus = null; if (kbUsed && host) setFocus(defaultFocus()); }
  /* A player's hands into `inp`: the keys, a pad, the touch buttons. On one keyboard (and in a
     battle with one player) the keys are the ones above and the first pad and the touch pad are
     theirs too; in a battle with two players each has their own keys (Options sets them) and
     pad, and the touch pad is Player 1's. */
  function readInput(inp, slot) {
    inp = inp || INPUT0; slot = slot || 0;
    const duo = !!(battle && battle.duo);
    const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(g => g && g.connected) : [];
    const gp = duo ? pads[KEYMAP.padSwap ? 1 - slot : slot] : pads[0];
    for (const k in pad) pad[k] = 0;
    if (gp) {
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0, B = i => gp.buttons[i] && gp.buttons[i].pressed ? 1 : 0;
      pad.L = ax < -0.35 || B(14) ? 1 : 0; pad.R = ax > 0.35 || B(15) ? 1 : 0; pad.D = ay > 0.5 || B(13) ? 1 : 0; pad.U = ay < -0.5 || B(12) ? 1 : 0;
      pad.J = B(0); pad.Z = B(2); pad.X = B(3) || B(5); pad.C = B(1) || B(7);
      if (B(9) && !inp._start && mode === "play") togglePause();
      inp._start = B(9);
    }
    const src = duo ? duoKeys[slot] : keys, tc = slot === 0 ? touch : {};
    const on = k => src[k] || pad[k] || tc[k] ? 1 : 0;
    const now = performance.now(), tapAt = inp._tap || (inp._tap = { L: 0, R: 0 });
    inp.dash = 0;
    for (const d of ["L", "R"]) {                    // a double tap: the dash
      const v = on(d);
      if (v && !inp[d]) { if (now - tapAt[d] < 260) inp.dash = d === "L" ? -1 : 1; tapAt[d] = now; }
      inp[d] = v;
    }
    inp.U = on("U"); inp.D = on("D");
    for (const b of ["J", "Z", "X", "C"]) { const v = on(b); inp[b.toLowerCase() + "p"] = v && !inp[b] ? 1 : 0; inp[b] = v; }
  }

  // ---------------------------------------------------------------- the loop
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - (last || now)) / 1000); last = now;
    if (!world || !player) return;
    resize();
    if (mode === "play" || mode === "goal") {
      if (!paused) {
        if (stopT > 0) { stopT = Math.max(0, stopT - dt); acc = 0; }     // a freeze-frame: the world holds still
        else acc += dt;
        const h = 1 / 120;
        let n = 0;
        while (acc >= h && n < 14 && (mode === "play" || mode === "goal")) {
          if (battle) battleTick(h);
          else { readInput(); step(h); worldStep(h); input.jp = input.zp = input.xp = input.cp = 0; input.dash = 0; }
          acc -= h; n++;
        }
        if (mode === "play" || mode === "goal") { if (battle) battleHud(); else { hud(); storyBeats(dt); } }
      }
    } else if (GLIDE[mode]) {
      /* the title and the menus: the camera goes along the stage on its own (the cast parades
         below the title); a story scene's talk goes on over it */
      world.t += dt; titleGlide(dt); worldStep(dt * 0.6); drawParade(dt);
      if (mode === "scene") sceneTick(dt);
    } else {
      // the menu: she waits at the start, the world goes on around her
      world.t += dt; worldStep(dt * 0.6);
      player.state = "run"; player.vx = 0;
    }
    if (!paused) draw(dt);
  }
  function resize() {
    const box = host.querySelector(".adv-3d");
    if (!box) return;
    const W = box.clientWidth || innerWidth, Hh = box.clientHeight || innerHeight;
    const cv = R.domElement;
    if (cv.__w === W && cv.__h === Hh) return;
    cv.__w = W; cv.__h = Hh;
    R.setSize(W, Hh, false); camera.aspect = W / Hh; camera.updateProjectionMatrix();
  }

  // ---------------------------------------------------------------- battle
  /* Sonic Battle's fighting, with health. Up to four fighters in one runner's arena -- players
     or CPUs, everyone for themselves or two teams -- each with a hundred health (Options of
     the match: 60, 100 or 150). Blows, shots, traps and a curled body take it off; at none a
     fighter is KO'd and drops back in a moment later. A KO match goes to the first to so many
     KOs; in Survival each fighter has so many lives and the last side standing wins. Down is
     Sonic Battle's guard button: a tap raises a shield for half a second, and held still the
     runner heals, slowly, with nothing to stop a blow. Training is the same fight on a
     dummy that does as it is told, and never ends. */

  /* the screens where nobody runs: the stage goes by behind them on its own */
  const GLIDE = { title: 1, main: 1, setup: 1, options: 1, story: 1, scene: 1 };

  /* whether a and b are on opposite sides: everyone for themselves, or by team */
  const rivals = (a, b) => !!a && !!b && a !== b && (!battle || !battle.teams || a.team !== b.team);
  const mine = (t, p) => !battle || t.owner === p;
  const tok = (o, d, k) => { hitTok = o; hitDmg = d; hitKnock = k == null ? 0.85 : k; return true; };
  /* Damage, of a hundred: the third jab and the heavies the most; the runner's Power grade
     scales it, S a fifth more and C a tenth less. Powers hit harder than shots, traps between. */
  const DMG = { atk1: 4, atk2: 4, atk3: 7, heavy: 11, upper: 10, aim: 8, dashatk: 9, airatk: 7 };
  const POW = { S: 1.2, A: 1.1, B: 1, C: 0.9 };
  const powK = c => POW[c.grades && c.grades.Power] || 1;
  const blowDmg = (p, name) => Math.round((DMG[name] || 6) * powK(p.c));
  const spDmg = (p, s) => Math.round((s.kind === "power" ? 13 : s.kind === "trap" ? 11 : 8) * powK(p.c));
  /* how well each heals, held still on Down: Knuckles and Cream best, Sonic worst (as Sonic
     Battle has them), health a second */
  const HEAL = { knuckles: 9, cream: 9, chaos: 8, gamma: 7, sonic: 4, shadow: 4.5, metal: 4.5 };
  const GUARD_T = 0.55;
  const SLOT_C = ["#e8403a", "#3a7ae0", "#e8b020", "#3aa04a"], TEAM_C = ["#e8403a", "#3a7ae0"], TEAM_N = ["Red", "Blue"];
  const tagCol = f => battle && battle.teams ? TEAM_C[f.team] : SLOT_C[f.slot];
  const tagText = f => f.ctl === "p1" ? "1P" : f.ctl === "p2" ? "2P" : "CPU";

  /** A fighter is hit. Unless their guard is up (the shield takes it: a clink, a push back),
      the damage comes off their health and they are knocked away -- a jab barely moves them,
      a finisher throws them across the arena or up into the air -- and reel a moment; at no
      health left, they are KO'd. Each blow lands on each fighter once. */
  function hitFighter(q, kick, cx) {
    if (q.inv > 0 || q.state === "teleport" || q.ko || q.out) return false;
    if (hitTok) { if (q.hits.has(hitTok)) return false; q.hits.add(hitTok); }
    const by = actor, from = by ? by.x : cx, away = sgn(q.x - from) || -q.face;
    if (q.guardT > 0) {
      q.vx = away * 3.5; q.blocked++;
      hitSpark(q.x - away * 0.35, q.y + q.hh * 0.55, 0.85, 0xbfe8ff); SFX.grab(); hitStop(0.03);
      return false;
    }
    /* a CPU's blows on a player are softer the easier it is: Easy three-quarters, Normal nine-tenths */
    const dmg = hitDmg * (by && by.ctl === "cpu" && q.ctl !== "cpu" ? [0.75, 0.9, 1][clamp(by.lvl, 0, 2)] : 1), k = hitKnock;
    let vx, vy;
    if (kick && kick.r) {
      const dx = q.x - kick.cx, dy = q.y + q.hh / 2 - kick.cy, d = Math.hypot(dx, dy) || 1;
      vx = dx / d * kick.r * 0.8 + (sgn(dx) || away) * 1.5; vy = Math.max(5, dy / d * kick.r * 0.8 + 4);
    } else if (kick) { vx = kick.vx * k; vy = kick.vy * k; }
    else { vx = away * 6; vy = 5; }
    const stunned = q.state === "hurt";
    q.cmb = stunned ? { n: q.cmb.n + 1, dmg: q.cmb.dmg + dmg } : { n: 1, dmg };
    q.hp = Math.max(0, q.hp - dmg); q.sinceHit = 0; q.lastDmg = dmg;
    if (by) { by.dealt += dmg; by.landed++; by.lastCmb = q.cmb; }
    q.state = "hurt"; q.st = 0.24 + dmg * 0.014; q.mv = null; q.sp = null; q.tor = null; q.er = null; q.curl = false; q.target = null;
    q.guardT = 0; q.healing = false; q.crouchT = 0;
    q.vx = vx;
    if (vy > 3 || !q.ground) { q.vy = vy; q.ground = false; q.on = null; }
    if (q.cmb.n >= 6) q.inv = Math.max(q.inv, 0.5);       // a long string: they break out of it
    if (q.hp <= 0) {
      if (battle.cfg.kind === "training") { q.hp = q.hpMax; caption("KO!"); }   // the dummy never goes down for good
      else koFighter(q, by);
    }
    return true;
  }
  function guardUpkeep(p, dt) {
    if (p.guardT > 0 && (p.guardT -= dt) <= 0) { p.guardT = 0; p.guardCd = 0.35; }
    p.guardCd = Math.max(0, (p.guardCd || 0) - dt);
    if (p.state !== "crouch") { if (p.guardT > 0) { p.guardT = 0; p.guardCd = 0.25; } p.crouchT = 0; p.healing = false; }
  }
  /* Down, still on the ground: the shield for half a second, then (held) healing */
  function stepGuard(p, dt) {
    if (!p.crouchT && !(p.guardCd > 0)) { p.guardT = GUARD_T; SFX.set(); }
    p.crouchT = (p.crouchT || 0) + dt;
    p.healing = p.crouchT > 0.8 && p.hp < p.hpMax;
    if (p.healing) p.hp = Math.min(p.hpMax, p.hp + (HEAL[p.c.id] || 6) * dt);
  }
  /* the shield, a bubble of light round them; healing, green sparks rising */
  function drawAura(f, dt) {
    if (!f.aura) { f.aura = new THREE.Sprite(glowMat(0x9ad8ff, 0.5)); f.aura.visible = false; world.group.add(f.aura); }
    const card = ITEMS && f.shield && !f.dead;                 // a shield: Sonic Advance 3's own, see-through, turning
    if (ITEMS) {
      if (!f.shCard) { f.shCard = makeCard("items", "ghost"); world.group.add(f.shCard); }
      f.shCard.visible = !!card;
      if (card) setFrame(f.shCard, f.shield === "magnet" ? "shield.magnet" : "shield.green", Math.floor(world.t * 14) % 6, 1, f.x, f.y + f.hh * 0.5 + (f.c.lift || 0), true, 0.32, 1.05);
      /* invincibility: eight little sparkles circling the runner like a turning ball of stars --
         two tilted rings going round, the near side in front of the runner, the far side behind,
         each twinkling through the sparkle's frames */
      if (!f.spCards) { f.spCards = []; for (let k = 0; k < 8; k++) { const m = makeCard("items", "fx"); world.group.add(m); f.spCards.push(m); } }
      const lit = f.star > 0 && !f.dead, cy = f.y + f.hh * 0.5 + (f.c.lift || 0), R = 0.62 + f.c.w * 0.25;
      f.spCards.forEach((m, k) => {
        m.visible = lit;
        if (!lit) return;
        const ring = k % 2, lat = ring ? 0.5 : -0.5, a = world.t * (ring ? 5.2 : -4.4) + k * PI / 4, hr = R * Math.cos(lat);
        setFrame(m, "sparkle", (Math.floor(world.t * 20) + k * 2) % 6, 1, f.x + Math.cos(a) * hr, cy + R * Math.sin(lat) + Math.sin(a * 2) * 0.08,
                 true, 0.06 + Math.sin(a) * hr, 0.34 + 0.08 * Math.sin(a));
      });
    }
    const on = (f.guardT > 0 || (f.shield && !ITEMS)) && !f.ko && !f.out && !f.dead;
    f.aura.visible = on;
    if (on) { const k = 2.4 + Math.sin(world.t * 30) * 0.08; f.aura.scale.set(k, k, 1); f.aura.position.set(f.x, f.y + f.hh * 0.5 + (f.c.lift || 0), 0.35); }
    if (f.healing && Math.random() < dt * 16) world.parts.list.push({ x: f.x + (Math.random() - 0.5) * 0.9, y: f.y + 0.2, z: 0.3, vx: 0, vy: 4 + Math.random() * 2, vz: 0,
      life: 0.45, s: 0.07, c: Math.random() < 0.55 ? 0x7ae08a : 0xffffff });
  }

  /* KO'd: thrown up and down, flat out a moment; then back in from above, unless their lives
     are spent (Survival), or the match is over */
  function koFighter(q, by) {
    const B = battle;
    q.ko = true; q.koT = 2.2; q.hp = 0; q.state = "run"; q.guardT = 0; q.healing = false;
    q.vy = Math.max(q.vy, 9); q.vx = (sgn(q.x - (by ? by.x : q.x)) || -q.face) * 5; q.ground = false; q.on = null;
    hitStop(0.22); shakeCam(0.3);
    flash(q.x, q.y + q.hh * 0.5, 3.6, HIT_C[by ? by.c.id : q.c.id] || 0xffffff);
    burst(q.x, q.y + q.hh * 0.5, [0xffffff, 0xf2d040, 0xe8403a], 22, 7);
    SFX.impact(); SFX.fall();
    q.downs++;
    if (B.cfg.rule === "stock") { q.lives--; if (q.lives <= 0) q.elim = true; }
    else if (by && rivals(by, q)) by.score++;
    if (by && rivals(by, q)) by.kos++;
    caption("KO!");
    checkWin();
  }
  function stepKO(p, dt) {
    p.koT -= dt; p.state = "run"; p.vx *= Math.pow(0.15, dt);
    if (!p.ground) p.vy = Math.max(p.vy - GRAV * dt, -22);
    integrate(p, dt);
    if (p.koT <= 0) { if (p.elim) p.out = true; else if (battle && !battle.over) respawnFighter(p); else p.koT = 0.5; }
  }
  const spawnXs = W => [8.5, W - 8.5, 13.5, W - 13.5];
  /** the floor at x: the highest ground under the open sky (not a ledge) */
  function floorAt(x) {
    const i = Math.floor(x);
    for (let j = H - 2; j >= 0; j--) { const c = tile(i, j); if (c === "/" || c === "\\") return slopeY(c, i, j, x); if (solid(c)) return j + 1; }
    return 4;
  }
  function respawnFighter(p) {
    const B = battle, W = world.W;
    let best = spawnXs(W)[0], bd = -1;
    for (const x of spawnXs(W)) {
      const d = Math.min(99, ...B.fs.filter(f => f !== p && !f.out && !f.ko).map(f => Math.abs(f.x - x)));
      if (d > bd) { bd = d; best = x; }
    }
    Object.assign(p, { ko: false, x: best, y: floorAt(best) + 5, vx: 0, vy: 0, ground: false, on: null, onTile: null, state: "run", hp: p.hpMax, inv: 1.6,
                       curl: false, mv: null, sp: null, tor: null, er: null, airUses: 0, airMove: false, airSp: false, flyLeft: p.c.flyTime || 0,
                       star: 0, rev: 0, dead: 0, guardT: 0, healing: false, crouchT: 0, cmb: { n: 0, dmg: 0 } });
    p.face = best < W / 2 ? 1 : -1;
    burst(p.x, p.y + 0.5, [0xffffff, 0xfff3a0], 10, 3);
  }
  /* Bodies: a fighter curled, rolling, homing, gliding or diving hurts the other side's when they
     meet, as a badnik is beaten; one dropping on a head bounces off it, and hurts a little.
     Fighters standing in each other are eased apart. */
  function contacts(dt) {
    const fs = battle.fs.filter(f => !f.ko && !f.out);
    for (const p of fs) {
      p.bodyT = Math.max(0, (p.bodyT || 0) - dt);
      for (const q of fs) {
        if (q === p || !rivals(p, q) || q.ko) continue;
        const ox = Math.min(p.x + p.c.w / 2, q.x + q.c.w / 2) - Math.max(p.x - p.c.w / 2, q.x - q.c.w / 2);
        const oy = Math.min(p.y + p.hh, q.y + q.hh) - Math.max(p.y, q.y);
        if (ox <= 0 || oy <= 0) continue;
        if (!p.bodyTok || p.bodyT <= 0) { p.bodyTok = {}; p.bodyT = 0.4; }
        actor = p;
        if (attacking(p) && p.state !== "atk" && p.state !== "tornado") {
          const homing = p.state === "homing", v = Math.max(8, Math.abs(p.vx) * 0.8);
          tok(p.bodyTok, homing ? 7 : 6, 0.8);
          if (hitFighter(q, { vx: (sgn(p.vx) || p.face) * v, vy: homing ? 6 : 7 }, p.x)) {
            hitSpark((p.x + q.x) / 2, q.y + q.hh * 0.5, 1.1, HIT_C[p.c.id] || 0xffffff); hitStop(0.04); shakeCam(0.08); SFX.hit();
            if (homing) { p.state = "run"; p.vy = 10; p.vx = p.face * 4; p.airMove = false; p.airUses = 0; p.curl = true; }
            else if (p.curl && !p.ground && p.vy < 0) p.vy = 9;
            else if (p.state === "roll" || p.state === "dash") p.vx *= 0.4;
          }
        } else if (p.vy < -2 && !p.ground && p.y > q.y + q.hh * 0.55 && p.state !== "hurt") {
          tok(p.bodyTok, 4, 0.3);
          if (hitFighter(q, { vx: 0, vy: 0 }, p.x)) { p.vy = p.inp.J ? 12 : 9.5; p.airMove = false; p.airUses = 0; hitSpark(p.x, q.y + q.hh, 0.8, 0xffffff); SFX.stomp(); }
        }
        actor = null;
      }
    }
    for (let a = 0; a < fs.length; a++) for (let b = a + 1; b < fs.length; b++) {
      const p = fs[a], q = fs[b], ox = (p.c.w + q.c.w) / 2 * 0.8 - Math.abs(p.x - q.x);
      if (ox <= 0 || Math.abs(p.y - q.y) > 0.9) continue;
      const d = sgn(p.x - q.x) || (a % 2 ? 1 : -1), push = Math.min(ox / 2, 0.05);
      moveX(p, d * push); moveX(q, -d * push);
    }
  }

  /* Each runner's stage has its arena: forty metres of its own ground, walled at both ends by
     nothing you can see (as Sonic Battle's are), ledges to fight from -- three layouts, by turns:
     ledges over the floor; a mound in the middle; raised ends and one long ledge. */
  const ARENA_W = 40;
  function arenaDef(i) {
    const st = stages()[i] || stages()[0], W = ARENA_W, HH = 32;
    const g = Array.from({ length: HH }, () => Array(W).fill("."));
    for (let j = 0; j < 4; j++) for (let x = 0; x < W; x++) g[j][x] = "#";
    const plank = (x0, x1, j) => { for (let x = x0; x <= x1; x++) g[j][x] = "-"; };
    const L = i % 3;
    if (L === 0) { plank(5, 11, 7); plank(28, 34, 7); plank(16, 23, 10); }
    else if (L === 1) { g[4][15] = "/"; for (let x = 16; x <= 23; x++) g[4][x] = "="; g[4][24] = "\\"; plank(4, 10, 8); plank(29, 35, 8); plank(17, 22, 11); }
    else { for (let x = 0; x <= 5; x++) g[4][x] = "="; g[4][6] = "\\"; for (let x = 34; x < W; x++) g[4][x] = "="; g[4][33] = "/"; plank(12, 27, 8); plank(4, 9, 11); plank(30, 35, 11); }
    g[4][12] = "T"; g[4][28] = "T"; g[6][20] = "P";
    const lines = [];
    for (let r = 0; r < HH; r++) lines.push(g[HH - 1 - r].join(""));
    return { id: "arena-" + st.id, name: st.name, sub: st.sub, theme: st.theme, who: st.who, arena: true, chunks: [lines.join("\n")] };
  }
  const stageAt = id => Math.max(0, stages().findIndex(s => s.id === id));
  /* An arena's picture, for the setups (as Sonic Battle shows the stage you pick): its world
     built to one side, every chunk of it, seen from where a battle's camera stands when it is
     furthest out, rendered once at twice the size and kept, smoothed down, as a little canvas. */
  const ARENA_PICS = {};
  function arenaPic(i) {
    if (ARENA_PICS[i]) return ARENA_PICS[i];
    if (!R) return null;
    const keep = { scene, camera, sun, hemi, H };
    let out = null, rt = null;
    try {
      const w = buildWorld(arenaDef(i));
      for (const i0 of w.pending.splice(0)) for (const m of buildChunk(w.S, w.T, i0, Math.min(w.W, i0 + 16))) w.group.add(m);
      for (const f of w.far.userData.anim) f(0);
      const PW = 640, PH = 360, T = Math.tan(17 * PI / 180), D = 34, cx = w.W / 2, cy = 4 + T * D * 0.62;
      camera.aspect = PW / PH; camera.updateProjectionMatrix();
      camera.position.set(cx, cy + 1.9, D); camera.lookAt(cx, cy, 0);
      sun.position.set(cx + w.T.sun[2][0], w.T.sun[2][1], w.T.sun[2][2]); sun.target.position.set(cx, cy - 2, 0);
      rt = new THREE.WebGLRenderTarget(PW, PH);
      rt.texture.encoding = R.outputEncoding;
      R.setRenderTarget(rt); R.render(scene, camera);
      const px = new Uint8Array(PW * PH * 4);
      R.readRenderTargetPixels(rt, 0, 0, PW, PH, px);
      const big = document.createElement("canvas"); big.width = PW; big.height = PH;
      const img = big.getContext("2d").createImageData(PW, PH), row = PW * 4;
      for (let y = 0; y < PH; y++) img.data.set(px.subarray((PH - 1 - y) * row, (PH - y) * row), y * row);   // GL's rows run bottom up
      big.getContext("2d").putImageData(img, 0, 0);
      out = document.createElement("canvas"); out.width = PW / 2; out.height = PH / 2;
      const g = out.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(big, 0, 0, PW / 2, PH / 2);
      scene.traverse(o => { if (o.geometry && !o.userData.keep && !Object.values(PROPS).includes(o.geometry)) o.geometry.dispose(); });
      if (scene.background && scene.background.dispose) scene.background.dispose();
    } catch (e) { out = null; }
    finally {
      if (R) R.setRenderTarget(null);
      if (rt) rt.dispose();
      ({ scene, camera, sun, hemi, H } = keep);
    }
    return (ARENA_PICS[i] = out);
  }
  /* the setups' arena picker: the picture over the arrows */
  const arenaPick = i => `
    <div class="adv-arena">
      <div class="adv-arena-pic${ARENA_PICS[i] ? " in" : ""}"><canvas width="320" height="180" data-arena="${i}"></canvas></div>
      ${arrows("arena", esc(stages()[i].name))}
    </div>`;
  function paintArena(ov) {
    const cv = ov.querySelector("canvas[data-arena]"); if (!cv) return;
    const i = +cv.dataset.arena;
    const go = () => { if (!cv.isConnected) return; const pic = arenaPic(i); if (pic) { cv.getContext("2d").drawImage(pic, 0, 0); cv.parentNode.classList.add("in"); } };
    if (ARENA_PICS[i]) go(); else setTimeout(go, 160);   // built once the picker rests on it, not for each arena gone past
  }

  /** Start a fight: cfg = { kind: "battle" | "training" | "story", slots: [{ who, ctl: "p1" |
      "p2" | "cpu", lvl, team, dummy }], teams, arena, rule: "ko" | "stock", goal, time, hp }. */
  function startBattle(cfg) {
    endBattle();
    disposeWorld();
    world = buildWorld(arenaDef(cfg.arena));
    const W = world.W, xs = spawnXs(W);
    const fs = cfg.slots.map((s, i) => {
      const f = makePlayer(castOf(s.who)), x = xs[i];
      return Object.assign(f, { x, y: floorAt(x), face: x < W / 2 ? 1 : -1, slot: i, ctl: s.ctl, lvl: s.lvl == null ? 1 : s.lvl, team: cfg.teams ? s.team : i,
        inp: newInput(), hits: new WeakSet(), hpMax: cfg.hp, hp: cfg.hp, score: 0, lives: cfg.rule === "stock" ? cfg.goal : 0, kos: 0, downs: 0, dealt: 0,
        landed: 0, blocked: 0, cmb: { n: 0, dmg: 0 }, sinceHit: 9, ai: aiNew(s), alive: true, h: f.hh, guardT: 0, guardCd: 0, check: { x, y: 6 } });
    });
    const humans = fs.filter(f => f.ctl !== "cpu");
    battle = { cfg, fs, live: false, over: false, intro: cfg.kind === "training" ? 0.6 : 1.7, clock: cfg.time || 0, duo: fs.some(f => f.ctl === "p2"),
               teams: !!cfg.teams, lead: humans[0] || fs[0], t: 0, endT: 0 };
    player = battle.lead;
    for (const k in keys) keys[k] = 0;
    duoKeys.forEach(m => { for (const k in m) m[k] = 0; });
    camX = W / 2; camY = 8; camD = 24; acc = 0; last = 0; stopT = 0; shake = 0;
    const box = host.querySelector(".adv-3d");
    if (box && R.domElement.parentNode !== box) box.appendChild(R.domElement);
    R.domElement.__w = 0;
    mode = "play"; paused = false;
    host.querySelector(".adv-ov").innerHTML = "";
    host.classList.add("playing");
    buildBattleHud();
    caption(cfg.kind === "training" ? "Training" : "Ready");
    music();
  }
  /* the fighters off the stage: the world stays (a story scene goes on in front of it) */
  function endBattle() {
    if (!battle) return;
    for (const f of battle.fs) for (const m of [f.spr, f.dust, f.aura, f.shCard, ...(f.spCards || [])]) if (m) world.group.remove(m);
    battle = null; actor = null; input = INPUT0;
    duoKeys.forEach(m => { for (const k in m) m[k] = 0; });
    if (world) player = makePlayer(castOf(runnerId()));
    const h = host && host.querySelector(".adv-hud"); if (h) { h.classList.remove("on"); h.innerHTML = ""; }
  }
  function battleTick(h) {
    const B = battle, w = world;
    w.t += h; B.t += h;
    if (!B.live && !B.over) { B.intro -= h; if (B.intro <= 0) { B.live = true; if (B.cfg.kind !== "training") caption("Go!"); } }
    if (B.live && !B.over && B.cfg.time && B.cfg.kind === "battle") { B.clock -= h; if (B.clock <= 0) { B.clock = 0; timeUp(); } }
    if (B.over) {
      B.endT -= h;
      if (B.endT < 1.9 && !B.said) { B.said = true; caption(B.winner == null ? "Draw" : winnerLine(B.winner), true); SFX.goal(); }
      if (B.endT <= 0) { battleOver(); return; }
    }
    for (const f of B.fs) {
      f.alive = !f.ko && !f.out; f.h = f.hh; f.sinceHit += h;
      if (f.out) continue;
      if (f.ctl === "cpu") aiThink(f, h);
      else if (B.live && !B.over) readInput(f.inp, f.ctl === "p2" ? 1 : 0);
      else { const I = f.inp; I.L = I.R = I.U = I.D = I.J = I.Z = I.X = I.C = 0; }
      if (B.cfg.kind === "training" && f.sinceHit > 1.6 && f.hp < f.hpMax) f.hp = Math.min(f.hpMax, f.hp + 40 * h);   // health comes back, between strings
    }
    for (const f of B.fs) { if (f.out) continue; player = f; input = f.inp; actor = f; step(h); }
    actor = null; input = INPUT0; player = B.lead;
    contacts(h);
    worldStep(h);
    for (const f of B.fs) { const I = f.inp; I.jp = I.zp = I.xp = I.cp = 0; I.dash = 0; }
  }
  /* each side's tally: KOs, lives and health left, fighters still in */
  function sides() {
    const m = new Map();
    for (const f of battle.fs) {
      const t = m.get(f.team) || { team: f.team, score: 0, lives: 0, hp: 0, alive: 0, fs: [] };
      t.score += f.score; t.lives += f.elim ? 0 : f.lives; t.hp += f.out ? 0 : f.hp / f.hpMax; t.alive += f.elim ? 0 : 1; t.fs.push(f);
      m.set(f.team, t);
    }
    return [...m.values()];
  }
  function checkWin() {
    const B = battle; if (!B || B.over || B.cfg.kind === "training") return;
    const S = sides();
    if (B.cfg.rule === "stock") { const left = S.filter(t => t.alive > 0); if (left.length <= 1) winBattle(left.length ? left[0].team : null); }
    else { const top = S.find(t => t.score >= B.cfg.goal); if (top) winBattle(top.team); }
  }
  /* time: the most KOs win; in Survival the most lives, then the most health; level is a draw */
  function timeUp() {
    caption("Time!");
    const key = t => battle.cfg.rule === "stock" ? t.lives * 1000 + t.hp : t.score;
    const S = sides().sort((a, b) => key(b) - key(a));
    winBattle(S.length > 1 && key(S[0]) === key(S[1]) ? null : S[0].team);
  }
  function winBattle(team) {
    const B = battle; B.over = true; B.live = false; B.winner = team; B.endT = 3.4;
  }
  function winnerLine(team) {
    const fs = battle.fs.filter(f => f.team === team);
    if (battle.teams) return (fs.length > 1 ? fs.map(f => f.c.name).join(" & ") + " win!" : fs[0].c.name + " wins!");
    return fs[0].c.name + " wins!";
  }

  // ---------------------------------------------------------------- the CPU
  /* A CPU fighter reads the fight a few times a second (Easy slowest, Hard quickest): far off it
     closes in, dashing, or fires its shot across; nearer it jumps in with an air attack or
     springs its aim attack; close up it turns to face its mark and strings jabs into a heavy,
     an upper, its power or a trap. When a blow or a shot is coming it may see it in time and
     guard; hurt and out of reach it may stop to heal. */
  const AI_LV = [
    { think: 0.5, guard: 0.12, sp: 0.1, combo: [1, 2], fin: 0.25, aim: 0.05, jumpIn: 0.15, air: 2 },
    { think: 0.28, guard: 0.38, sp: 0.18, combo: [2, 3], fin: 0.55, aim: 0.1, jumpIn: 0.22, air: 5 },
    { think: 0.15, guard: 0.62, sp: 0.24, combo: [3, 3], fin: 0.85, aim: 0.14, jumpIn: 0.26, air: 9 },
  ];
  const aiNew = s => ({ t: 0.4 + Math.random() * 0.4, q: [], qt: 0, dir: 0, hold: 0, D: 0, U: 0, mU: 0, mD: 0, mod: 0, jt: 0, ct: 0,
                        dummy: s.dummy || null, wander: Math.random() < 0.5 ? -1 : 1, wt: 0 });
  function press(f, a) {
    const I = f.inp, A = f.ai;
    if (a.U) { A.mU = 1; I.U = 1; } if (a.D) { A.mD = 1; I.D = 1; }
    if (a.U || a.D) A.mod = 0.12;
    if (a.k === "j") { I.jp = 1; I.J = 1; A.jt = a.hold || 0.2; }
    else if (a.k === "z") { I.zp = 1; I.Z = 1; }
    else if (a.k === "x") { I.xp = 1; I.X = 1; }
    else if (a.k === "c") { I.cp = 1; I.C = 1; A.ct = a.hold || 0.05; }
  }
  function aiTarget(f) {
    let best = null, bd = 1e9;
    for (const q of battle.fs) if (rivals(f, q) && !q.ko && !q.out) { const d = Math.abs(q.x - f.x) + Math.abs(q.y - f.y) * 1.5 - (q === f.ai.tgt ? 2 : 0); if (d < bd) { bd = d; best = q; } }
    return (f.ai.tgt = best);
  }
  /* a blow or a shot on its way to f */
  function danger(f) {
    for (const q of battle.fs) {
      if (!rivals(q, f) || q.ko || q.out) continue;
      const dx = f.x - q.x;
      if (Math.abs(dx) < 2.7 && Math.abs(f.y - q.y) < 1.6 && sgn(dx) === q.face &&
          (q.state === "atk" || q.state === "seek" || q.state === "special" || q.state === "tornado" || attacking(q))) return true;
    }
    for (const s of world.shots) if (!s.gone && s.owner && rivals(s.owner, f) && Math.abs(s.x - f.x) < 4 && sgn(f.x - s.x) === sgn(s.vx) && Math.abs(s.y - (f.y + 0.6)) < 1.6) return true;
    return false;
  }
  function aiThink(f, dt) {
    const I = f.inp, A = f.ai, B = battle, L = AI_LV[clamp(f.lvl, 0, 2)];
    I.jp = I.zp = I.xp = I.cp = 0; I.dash = 0;
    if (!B.live || B.over || f.ko) { I.L = I.R = I.U = I.D = I.J = I.Z = I.X = I.C = 0; A.q = []; A.hold = 0; return; }
    if (A.hold > 0) A.hold -= dt; else { A.dir = 0; A.D = 0; A.U = 0; }
    if (A.mod > 0) A.mod -= dt; else { A.mU = 0; A.mD = 0; }
    if (A.jt > 0) A.jt -= dt;
    if (A.ct > 0) A.ct -= dt;
    I.L = A.dir < 0 ? 1 : 0; I.R = A.dir > 0 ? 1 : 0; I.U = A.U || A.mU ? 1 : 0; I.D = A.D || A.mD ? 1 : 0; I.J = A.jt > 0 ? 1 : 0;
    I.Z = 0; I.X = 0; I.C = A.ct > 0 ? 1 : 0;
    if (A.q.length) { A.qt += dt; while (A.q.length && A.qt >= A.q[0].at) press(f, A.q.shift()); }
    const tgt = aiTarget(f);
    if (A.dummy && A.dummy !== "fight") return dummyThink(f, dt);
    if (!tgt) return;
    const dx = tgt.x - f.x, dy = tgt.y - f.y, adx = Math.abs(dx), toward = sgn(dx) || f.face;
    // a blow or a shot coming: it may see it in time and guard
    const threat = danger(f);
    if (threat && !A.seen) {
      A.seen = true;
      if (f.ground && f.state !== "atk" && f.state !== "special" && Math.random() < L.guard) { A.q = []; A.dir = 0; A.D = 1; A.hold = 0.42; A.t = 0.45; return; }
    } else if (!threat) A.seen = false;
    // in the air near its mark: the air attack
    if (!f.ground && !f.airMove && f.state === "run" && adx < 1.9 && Math.abs(dy) < 1.4 && Math.random() < dt * L.air) press(f, { k: "z" });
    // a wall in the way: over it
    if (A.dir && f.ground && Math.abs(f.vx) < 0.5 && solid(tile(Math.floor(f.x + A.dir * (f.c.w / 2 + 0.3)), Math.floor(f.y + 0.5))) && !A.q.length) press(f, { k: "j", hold: 0.3 });
    A.t -= dt;
    if (A.t > 0 || A.q.length || A.hold > 0) return;
    A.t = L.think * (0.7 + Math.random() * 0.6);
    A.qt = 0;
    const r = Math.random(), faced = f.face === toward, level = Math.abs(dy) < 1;
    if (f.hp < f.hpMax * 0.3 && adx > 9 && f.ground && r < 0.35) { A.dir = 0; A.D = 1; A.hold = 1.4; return; }   // out of reach and hurt: heal
    if (adx > 6) {
      A.dir = toward; A.hold = A.t + 0.05;
      if (f.ground && faced && level && r < L.sp) { A.dir = 0; A.q = [{ at: 0, k: "c" }]; }                  // a shot across the arena
      else if (f.ground && r > 0.86) I.dash = toward;
      if (dy > 1.5 && f.ground && !A.q.length) A.q = [{ at: 0, k: "j", hold: 0.3 }];
    } else if (adx > 2.2) {
      A.dir = toward; A.hold = A.t + 0.05;
      if (r < L.aim && faced) A.q = [{ at: 0, k: "x", D: 1 }];                                                // the aim attack
      else if (r < L.aim + L.jumpIn && f.ground) A.q = [{ at: 0, k: "j", hold: 0.3 }, { at: 0.3, k: "z" }];  // jump in
      else if (r < L.aim + L.jumpIn + L.sp * 0.5 && faced && level) { A.dir = 0; A.q = [{ at: 0, k: "c" }]; }
      else if (dy > 1.5 && f.ground) A.q = [{ at: 0, k: "j", hold: 0.3 }];
    } else {
      if (!faced) { A.dir = toward; A.hold = 0.04; A.t = 0.05; return; }                                      // turn to it first
      A.dir = 0;
      if (dy > 1.3) A.q = r < 0.6 ? [{ at: 0, k: "x", U: 1 }] : [{ at: 0, k: "j", hold: 0.25 }, { at: 0.22, k: "z" }];
      else if (r < L.sp * 0.6) A.q = [{ at: 0, k: "c", U: 1 }];                                              // the power
      else if (r < L.sp * 0.6 + 0.06) A.q = [{ at: 0, k: "c", D: 1 }];                                       // a trap
      else {
        const n = L.combo[0] + Math.floor(Math.random() * (L.combo[1] - L.combo[0] + 1));
        for (let k = 0; k < n; k++) A.q.push({ at: k * 0.13, k: "z" });
        if (n >= 3 || Math.random() < L.fin) A.q.push({ at: n * 0.13, k: "x", U: Math.random() < 0.3 ? 1 : 0 });
      }
    }
  }
  /* Training's dummy: stands, guards whatever comes, walks to and fro, jumps, or fights (as a
     Normal CPU) */
  const DUMMY = [["stand", "Stand"], ["guard", "Guard"], ["walk", "Walk"], ["jump", "Jump"], ["fight", "Fight"]];
  function dummyThink(f, dt) {
    const A = f.ai;
    if (A.dummy === "guard") { if (danger(f) && f.ground && !(f.guardCd > 0) && f.state !== "crouch" && f.state !== "hurt") { A.D = 1; A.hold = 0.42; } }
    else if (A.dummy === "walk") {
      A.wt += dt;
      if (A.wt > 2.4 || f.x < 5 || f.x > world.W - 5) { if (A.wt > 0.5) { A.wander = f.x < 5 ? 1 : f.x > world.W - 5 ? -1 : -A.wander; A.wt = 0; } }
      A.dir = A.wander; A.hold = 0.05;
    } else if (A.dummy === "jump") { A.wt += dt; if (A.wt > 1.1 && f.ground) { A.wt = 0; press(f, { k: "j", hold: 0.3 }); } }
  }

  // ---------------------------------------------------------------- the battle's picture and HUD
  /* the camera frames everyone in the fight, backing off as they spread out, the floor kept
     near the bottom of the picture */
  let camD = CAM_D;
  function battleView(aspect, dt) {
    const fs = battle.fs.filter(f => !f.out);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const f of fs) { x0 = Math.min(x0, f.x); x1 = Math.max(x1, f.x); y0 = Math.min(y0, f.y); y1 = Math.max(y1, f.y + f.hh); }
    if (!fs.length) { x0 = x1 = world.W / 2; y0 = 4; y1 = 5; }
    const T = Math.tan(17 * PI / 180), W = world.W;
    const want = clamp(Math.max(((x1 - x0) / 2 + 4.5) / (T * aspect), ((y1 - y0) / 2 + 3.2) / T, 12.5 / (2 * T * aspect)), CAM_D, 34);
    camD = lerp(camD, want, 1 - Math.exp(-dt * 2.5));
    const halfW = T * camD * aspect, halfH = T * camD;
    const tx = halfW * 2 > W ? W / 2 : clamp((x0 + x1) / 2, halfW - 0.5, W - halfW + 0.5);
    const ty = Math.max((y0 + y1) / 2 + 0.6, 4 + halfH * 0.62);
    camX = lerp(camX, tx, 1 - Math.exp(-dt * 4)); camY = lerp(camY, ty, 1 - Math.exp(-dt * 3));
    return camD;
  }
  /* each fighter's tag (1P, 2P, CPU) over their head, in their colour */
  const TV = new THREE.Vector3();
  function placeTags() {
    const box = host.querySelector(".adv-3d"), wrap = host.querySelector(".adv-tags"); if (!box || !wrap) return;
    camera.updateMatrixWorld();
    const W = box.clientWidth, Hh = box.clientHeight;
    battle.fs.forEach((f, i) => {
      const el = wrap.children[i]; if (!el) return;
      if (f.out || f.ko) { el.style.display = "none"; return; }
      TV.set(f.x, f.y + f.hh + (f.c.lift || 0) + 0.3, 0).project(camera);
      el.style.display = "";
      el.style.transform = `translate(${Math.round((TV.x + 1) / 2 * W)}px,${Math.round((1 - TV.y) / 2 * Hh)}px) translate(-50%,-100%)`;
    });
  }
  function padHtml() {
    return `<div class="adv-pad">
        <div class="adv-pad-l"><button data-t="U" class="up" aria-label="Up">${ico("down")}</button><button data-t="L" aria-label="Left">${ico("back")}</button><button data-t="D" class="dn-k" aria-label="Down">${ico("down")}</button><button data-t="R" aria-label="Right">${ico("next")}</button></div>
        <div class="adv-pad-r"><button data-t="Z">Light</button><button data-t="X">Heavy</button><button data-t="C">Special</button><button data-t="J" class="jp">Jump</button></div>
      </div>`;
  }
  function wirePad(el) {
    el.querySelectorAll("[data-t]").forEach(b => {
      const k = b.dataset.t, on = e => { e.preventDefault(); touch[k] = 1; b.classList.add("dn"); }, off = e => { e.preventDefault(); touch[k] = 0; b.classList.remove("dn"); };
      b.addEventListener("pointerdown", on); b.addEventListener("pointerup", off); b.addEventListener("pointercancel", off); b.addEventListener("pointerleave", off);
    });
  }
  function buildBattleHud() {
    const B = battle, h = host.querySelector(".adv-hud"), tr = B.cfg.kind === "training";
    h.classList.add("on");
    h.innerHTML = `
      <div class="adv-fcards n${B.fs.length}">${B.fs.map((f, i) => `
        <div class="adv-fc" data-i="${i}" style="--tc:${tagCol(f)}">
          <canvas class="adv-fc-face" width="44" height="40"></canvas>
          <div class="adv-fc-r">
            <div class="adv-fc-nm"><b>${esc(f.c.name)}</b><i>${tagText(f)}</i></div>
            <div class="adv-hp"><span></span></div>
            <div class="adv-fc-sc"></div>
          </div>
        </div>`).join("")}</div>
      <div class="adv-hr">
        ${B.cfg.time && B.cfg.kind === "battle" ? `<span class="adv-clock num"></span>` : ""}
        <button class="adv-pause" title="Pause (Enter)" aria-label="Pause">II</button>
      </div>
      ${tr ? `<div class="adv-combo"><b class="num"></b><i></i></div>` : ""}
      <div class="adv-cap"></div>
      <div class="adv-tags">${B.fs.map(f => `<span class="adv-tag" style="--tc:${tagCol(f)}">${tagText(f)}</span>`).join("")}</div>
      ${TOUCH && B.fs.some(f => f.ctl === "p1") ? padHtml() : ""}`;
    h.querySelectorAll(".adv-fc-face").forEach((cv, i) => paintCard(cv, B.fs[i].c.id, "portrait", 1));
    h.querySelector(".adv-pause").onclick = () => togglePause();
    wirePad(h);
    hudCache = {};
  }
  function scoreHtml(f) {
    const B = battle;
    if (B.cfg.kind === "training") return `<b class="num">${Math.ceil(f.hp)}</b><i class="num">/${f.hpMax}</i>`;
    if (B.cfg.rule === "stock") return `<span class="adv-lives">${Array.from({ length: B.cfg.goal }, (_, k) => `<em class="${k < f.lives ? "on" : ""}"></em>`).join("")}</span>`;
    return `<b class="num">${f.score}</b><i class="num">/${B.cfg.goal}</i><small>KO</small>`;
  }
  function battleHud() {
    const B = battle, h = host.querySelector(".adv-hud"); if (!h || !B) return;
    const set = (key, val, fn) => { if (hudCache[key] !== val) { hudCache[key] = val; fn(val); } };
    B.fs.forEach((f, i) => {
      const card = h.querySelector(`.adv-fc[data-i="${i}"]`); if (!card) return;
      const pct = Math.max(0, Math.round(f.hp / f.hpMax * 100));
      set("hp" + i, pct, v => { card.querySelector(".adv-hp span").style.width = v + "%"; card.classList.toggle("low", v <= 30); });
      set("sc" + i, scoreHtml(f), v => { card.querySelector(".adv-fc-sc").innerHTML = v; });
      set("out" + i, !!f.out, v => card.classList.toggle("out", v));
      set("heal" + i, !!f.healing, v => card.classList.toggle("heal", v));
    });
    const ck = h.querySelector(".adv-clock");
    if (ck) set("clk", Math.ceil(B.clock), v => { ck.textContent = Math.floor(v / 60) + ":" + String(v % 60).padStart(2, "0"); ck.classList.toggle("low", v <= 10); });
    const cb = h.querySelector(".adv-combo");
    if (cb) {                                              // training: what the last string did
      const me = B.lead, c = me.lastCmb, live = c && c.n >= 1 && B.fs.some(f => f !== me && f.sinceHit < 1.6);
      set("cmb", live ? c.n + "|" + c.dmg : "", v => {
        cb.classList.toggle("on", !!v);
        if (v) { cb.querySelector("b").textContent = c.n > 1 ? c.n + " hits" : "1 hit"; cb.querySelector("i").textContent = c.dmg + " damage"; }
      });
    }
  }
  /* a word across the middle of the screen: Ready, Go!, KO!, Time!, who won */
  function caption(text, stay) {
    const c = host && host.querySelector(".adv-cap"); if (!c) return;
    c.textContent = text || ""; c.classList.remove("on", "stay"); void c.offsetWidth;
    if (text) c.classList.add(stay ? "stay" : "on");
  }

  // ---------------------------------------------------------------- the main menu
  const runnerId = () => storyRun ? storyRun.ch.who : castId;
  /* the menus glide over one of the stages, never an arena */
  function ensureStageWorld() { if (!world || world.def !== actDef(stageIdx, actIdx)) load3d(stageIdx); }
  function screenOn(m) {
    endBattle();
    mode = m; paused = false; parade = null; talk = null;
    host.querySelector(".adv-hud").classList.remove("on");
    host.classList.remove("playing");
    return host.querySelector(".adv-ov");
  }
  function mainMenu() {
    storyRun = null;
    const ov = screenOn("main");
    ensureStageWorld();
    const list = STORY(), done = storyDone();
    const items = [
      ["story", "book", "Story", `The Red Star Rings: ${list.length} chapters, thirteen stages of its own, the whole cast`,
        done >= list.length ? "Cleared" : done ? `Chapter ${done + 1}` : ""],
      ["exhibition", "flag", "Free Exhibition", "Any runner in any zone you've opened, Act 1 or Act 2 and its boss: for time, rings and Red Star Rings",
        `${stages().filter((st, i) => cleared(i)).length}/${stages().length}`],
      ["battle", "trophy", "Battle", "Up to four fighters with health, players or CPUs, in any runner's arena", ""],
      ["training", "dumbbell", "Training", "Every move on a dummy that does as it's told", ""],
      ["options", "gear", "Options", "Music, sound, screen shake and the two-player keys", ""],
      ["exit", "door", "Exit", "Back to the hall", ""],
    ];
    ov.innerHTML = `
      <div class="adv-main pop">
        <div class="adv-brand">
          <div class="adv-kicker">POST PARADE</div>
          <div class="adv-logo">ADVENTURE 2</div>
        </div>
        <div class="adv-mm">
          ${items.map(([id, ic, t, sub, note], i) => `
            <button class="adv-mi" data-mm="${id}" data-k="mm-${id}" ${i === 0 ? "data-focus" : ""}>
              <span class="adv-mi-ic">${ico(ic)}</span>
              <span class="adv-mi-tx"><b>${t}</b><i>${sub}</i></span>
              ${note ? `<em>${note}</em>` : ""}
            </button>`).join("")}
        </div>
        <button hidden data-back id="advMMBack"></button>
      </div>`;
    const go = { story: storyMenu, exhibition: () => { load3d(stageIdx); menu(); }, battle: () => battleSetup(true), training: () => trainingSetup(true), options: () => optionsScreen(true), exit: () => exit() };
    ov.querySelectorAll("[data-mm]").forEach(b => b.onclick = () => go[b.dataset.mm]());
    ov.querySelector("#advMMBack").onclick = () => title();
    autoFocus();
  }

  // ---------------------------------------------------------------- the battle and training screens
  /* The battle's setup, kept per trainer: up to four slots (a player, the second player, a CPU
     at its level, or nobody), everyone for themselves or Red against Blue, the arena, and the
     rules. A few ready-made matches set the slots in one go. */
  const PRESETS = [
    ["1P vs CPU", ["p1", "cpu", "off", "off"]],
    ["1P vs 2P", ["p1", "p2", "off", "off"]],
    ["CPU vs CPU", ["cpu", "cpu", "off", "off"]],
    ["1P & 2P vs CPU", ["p1", "p2", "cpu", "off"], [0, 0, 1, 1]],
    ["Three-way", ["p1", "cpu", "cpu", "off"]],
    ["Four-way", ["p1", "cpu", "cpu", "cpu"]],
    ["2 vs 2", ["p1", "cpu", "cpu", "cpu"], [0, 0, 1, 1]],
  ];
  const CTL_N = { p1: "Player 1", p2: "Player 2", cpu: "CPU", off: "Nobody" };
  const LV_N = ["Easy", "Normal", "Hard"];
  function bset() {
    const d = { slots: [{ who: castId, ctl: "p1", lvl: 1, team: 0 }, { who: "shadow", ctl: "cpu", lvl: 1, team: 1 },
                        { who: "knuckles", ctl: "off", lvl: 1, team: 0 }, { who: "amy", ctl: "off", lvl: 1, team: 1 }],
                teams: false, arena: 0, rule: "ko", goal: 3, time: 180, hp: 100 };
    const b = saveData.battle = Object.assign(d, saveData.battle || {});
    b.slots = d.slots.map((s, i) => Object.assign({}, s, (b.slots || [])[i] || {}));
    return b;
  }
  /* a row of choices, the picked one lit: Options' own segmented control */
  const seg = (key, opts, cur) => `<div class="seg adv-seg">${opts.map(([v, l]) => `<button data-seg="${key}" data-v="${v}" data-k="${key}-${v}" class="${String(v) === String(cur) ? "sel" : ""}">${l}</button>`).join("")}</div>`;
  const row = (label, help, control) => `<div class="setrow"><div class="setlab"><b>${label}</b>${help ? `<i>${help}</i>` : ""}</div>${control}</div>`;
  const arrows = (key, label) => `<div class="adv-pick"><button class="adv-arr" data-arr="${key}" data-d="-1" data-k="${key}-prev" aria-label="Previous">${ico("back")}</button><b>${label}</b><button class="adv-arr" data-arr="${key}" data-d="1" data-k="${key}-next" aria-label="Next">${ico("next")}</button></div>`;
  const cycle = (arr, cur, d) => arr[(arr.indexOf(cur) + d + arr.length) % arr.length];
  function slotCard(s, i, o) {
    const off = s.ctl === "off", col = o.teams ? TEAM_C[s.team] : SLOT_C[i];
    return `
      <div class="adv-slot ${off ? "off" : ""}" style="--tc:${col}">
        <button class="adv-slot-ctl" data-ctl="${i}" data-k="ctl-${i}">${o.fixed ? o.fixed : off ? "Add a fighter" : CTL_N[s.ctl]}</button>
        <div class="adv-slot-face"><canvas class="adv-spr" width="176" height="144" data-who="${off ? "" : s.who}"></canvas></div>
        ${off ? "" : arrows("who" + i, esc(castOf(s.who).name))}
        ${!off && s.ctl === "cpu" && !o.noLevel ? seg("lvl" + i, LV_N.map((l, k) => [k, l]), s.lvl) : ""}
        ${!off && o.teams ? seg("team" + i, TEAM_N.map((l, k) => [k, l]), s.team) : ""}
      </div>`;
  }
  function keysLine() {
    const K = KEYMAP.p, f = (m, acts) => acts.map(a => m[a].map(keyName).join(" or ") || "none").join(" ");
    return `<b>Player 1</b> ${f(K[0], ["U", "L", "D", "R"])} to move &middot; ${f(K[0], ["J"])} jump &middot; ${f(K[0], ["Z", "X", "C"])} light, heavy, special<br>
            <b>Player 2</b> ${f(K[1], ["U", "L", "D", "R"])} to move &middot; ${f(K[1], ["J"])} jump &middot; ${f(K[1], ["Z", "X", "C"])} light, heavy, special`;
  }
  function battleSetup(first) {
    const b = bset(), ov = screenOn("setup");
    if (first) ensureStageWorld();
    const n = b.slots.filter(s => s.ctl !== "off").length, duo = b.slots.some(s => s.ctl === "p2");
    const preset = PRESETS.findIndex(([, ctl, tm]) => ctl.every((c, i) => b.slots[i].ctl === c) && !!tm === !!b.teams && (!tm || tm.every((t, i) => ctl[i] === "off" || b.slots[i].team === t)));
    ov.innerHTML = `
      <div class="adv-menu pop">
        <div class="panel adv-panel adv-bset">
          <div class="panel-hd">${ico("trophy")}Battle</div>
          <div class="adv-presets">${PRESETS.map(([l], i) => `<button data-pre="${i}" data-k="pre-${i}" class="${i === preset ? "sel" : ""}">${l}</button>`).join("")}</div>
          <div class="adv-slots">${b.slots.map((s, i) => slotCard(s, i, b)).join("")}</div>
          <div class="adv-rules">
            ${row("Sides", "", seg("teams", [[0, "Everyone for themselves"], [1, "Red against Blue"]], b.teams ? 1 : 0))}
            ${row("Arena", esc(stages()[b.arena].sub), arenaPick(b.arena))}
            ${row("Rule", b.rule === "stock" ? "Each fighter has lives; the last side standing wins." : "The first to so many KOs wins.", seg("rule", [["ko", "KO match"], ["stock", "Survival"]], b.rule))}
            ${row(b.rule === "stock" ? "Lives" : "KOs to win", "", seg("goal", [[1, "1"], [3, "3"], [5, "5"]], b.goal))}
            ${row("Time", "", seg("time", [[120, "2:00"], [180, "3:00"], [300, "5:00"], [0, "None"]], b.time))}
            ${row("Health", "", seg("hp", [[60, "60"], [100, "100"], [150, "150"]], b.hp))}
          </div>
          <div class="adv-go">
            <button class="btn lg" id="advFight" data-enter data-focus data-k="fight" ${n < 2 ? "disabled" : ""}>${ico("flag")}Fight</button>
            <button class="btn ghost" id="advBSk" data-k="emskill">Emerl's Skills</button>
            <button class="btn ghost" id="advBBack" data-back data-k="back">${ico("back")}Main menu</button>
          </div>
          <div class="adv-keys">${duo ? keysLine() + "<br>" : ""}<b>Down</b> guards, and held still heals &middot; Options sets the two players' keys</div>
        </div>
      </div>`;
    paintSlots(ov); paintArena(ov);
    const redo = () => { save(saveData); battleSetup(); };
    ov.querySelectorAll("[data-pre]").forEach(el => el.onclick = () => {
      const [, ctl, tm] = PRESETS[+el.dataset.pre];
      b.slots.forEach((s, i) => { s.ctl = ctl[i]; if (tm) s.team = tm[i]; });
      b.teams = !!tm; redo();
    });
    ov.querySelectorAll("[data-ctl]").forEach(el => el.onclick = () => {
      const i = +el.dataset.ctl, s = b.slots[i];
      const order = i < 2 ? ["p1", "p2", "cpu"] : ["p1", "p2", "cpu", "off"];
      s.ctl = cycle(order, s.ctl, 1);
      if (s.ctl === "p1" || s.ctl === "p2") b.slots.forEach((o, k) => { if (k !== i && o.ctl === s.ctl) o.ctl = "cpu"; });   // one of each player
      redo();
    });
    ov.querySelectorAll("[data-arr]").forEach(el => el.onclick = () => {
      const key = el.dataset.arr, d = +el.dataset.d;
      if (key === "arena") b.arena = (b.arena + d + stages().length) % stages().length;
      else { const s = b.slots[+key.slice(3)]; s.who = cycle(CAST.map(c => c.id), s.who, d); }
      redo();
    });
    ov.querySelectorAll("[data-seg]").forEach(el => el.onclick = () => {
      const key = el.dataset.seg, v = el.dataset.v;
      if (key === "teams") b.teams = v === "1";
      else if (key === "rule") b.rule = v;
      else if (key === "goal" || key === "time" || key === "hp") b[key] = +v;
      else if (key.startsWith("lvl")) b.slots[+key.slice(3)].lvl = +v;
      else if (key.startsWith("team")) b.slots[+key.slice(4)].team = +v;
      redo();
    });
    ov.querySelector("#advFight").onclick = () => {
      let slots = b.slots.filter(s => s.ctl !== "off").map(s => Object.assign({}, s));
      if (!slots.some(s => s.ctl === "p1")) { const p2 = slots.find(s => s.ctl === "p2"); if (p2) p2.ctl = "p1"; }   // a lone second player is the first
      if (b.teams && new Set(slots.map(s => s.team)).size < 2) slots = slots.map((s, i) => Object.assign(s, { team: i % 2 }));
      startBattle({ kind: "battle", slots, teams: b.teams, arena: b.arena, rule: b.rule, goal: b.goal, time: b.time, hp: b.hp });
    };
    ov.querySelector("#advBBack").onclick = () => mainMenu();
    ov.querySelector("#advBSk").onclick = () => emerlSkills(() => battleSetup(true));
    if (first) autoFocus();
  }
  function paintSlots(ov) { ov.querySelectorAll(".adv-slot canvas[data-who]").forEach(cv => { if (cv.dataset.who) paintCard(cv, cv.dataset.who); }); }

  function tset() {
    const d = { you: castId, dummy: "knuckles", act: "stand", arena: 0 };
    return (saveData.training = Object.assign(d, saveData.training || {}));
  }
  function trainingSetup(first) {
    const t = tset(), ov = screenOn("setup");
    if (first) ensureStageWorld();
    ov.innerHTML = `
      <div class="adv-menu pop">
        <div class="panel adv-panel adv-bset adv-tset">
          <div class="panel-hd">${ico("dumbbell")}Training</div>
          <div class="adv-slots">
            ${slotCard({ who: t.you, ctl: "p1" }, 0, { fixed: "You" }).replace(/who0/g, "you")}
            ${slotCard({ who: t.dummy, ctl: "cpu" }, 1, { fixed: "The dummy", noLevel: true }).replace(/who1/g, "dummy")}
          </div>
          <div class="adv-rules">
            ${row("The dummy", "What it does while you practise. You can change it from the pause menu.", seg("act", DUMMY, t.act))}
            ${row("Arena", esc(stages()[t.arena].sub), arenaPick(t.arena))}
          </div>
          <div class="adv-go">
            <button class="btn lg" id="advTrain" data-enter data-focus data-k="train">${ico("flag")}Start training</button>
            <button class="btn ghost" id="advTSk" data-k="emskill">Emerl's Skills</button>
            <button class="btn ghost" id="advTBack2" data-back data-k="back">${ico("back")}Main menu</button>
          </div>
          <div class="adv-keys">Health comes back between strings, and nobody goes down for good. Pause for the move list.</div>
        </div>
      </div>`;
    paintSlots(ov); paintArena(ov);
    ov.querySelectorAll(".adv-slot-ctl").forEach(el => el.disabled = true);
    const redo = () => { save(saveData); trainingSetup(); };
    ov.querySelectorAll("[data-arr]").forEach(el => el.onclick = () => {
      const key = el.dataset.arr, d = +el.dataset.d;
      if (key === "arena") t.arena = (t.arena + d + stages().length) % stages().length;
      else t[key] = cycle(CAST.map(c => c.id), t[key], d);
      redo();
    });
    ov.querySelectorAll("[data-seg]").forEach(el => el.onclick = () => { t.act = el.dataset.v; redo(); });
    ov.querySelector("#advTrain").onclick = () => startTraining();
    ov.querySelector("#advTBack2").onclick = () => mainMenu();
    ov.querySelector("#advTSk").onclick = () => emerlSkills(() => trainingSetup(true));
    if (first) autoFocus();
  }
  function startTraining() {
    const t = tset();
    startBattle({ kind: "training", slots: [{ who: t.you, ctl: "p1", team: 0 }, { who: t.dummy, ctl: "cpu", lvl: 1, team: 1, dummy: t.act }],
                  teams: true, arena: t.arena, rule: "ko", goal: 99, time: 0, hp: 100 });
  }
  /* the move list: the same buttons for everyone; what the air action and the moves are, the
     runner's own */
  const AIR_DESC = { ballet: "Sonic Ballet, a second jump that homes on anything near", fly: "flight: tap to climb, until tired",
    glide: "a glide while held; glide into a wall to climb it", double: "a Double Jump", teleport: "Chaos Control, twice a jump",
    float: "Chaos Flight, a little more height", jet: "a burst of the jet ahead, and a hover", psy: "the Air Psycho Dash; then hold Space to float down",
    launch: "Shell Launch, straight up; against a wall, a wall jump" };
  const airDesc = c => c.air === "hover" ? (c.id === "eggman" ? "Egg Hover: held up a while, then sinking slowly" : "Flight Mode: held up a while, sinking") : AIR_DESC[c.air] || "";
  function movesHtml(c) {
    const R = (k, t) => `<div class="adv-mv-r"><b>${k}</b><span>${t}</span></div>`;
    return `<div class="adv-mlist">
      <div class="adv-mv-hd"><b>${esc(c.name)}</b><i>${esc(c.moves)}</i></div>
      ${R("Z", "Light attack: three in a row; X straight after for the heavy")}
      ${R("X", "Heavy attack. Up + X upper, Down + X aim attack, dashing the dash attack")}
      ${R("Z or X in the air", "Air attack" + (c.id === "shadow" ? " (Z: Homing Attack)" : ""))}
      ${R("C", "Shot. Up + C power, Down + C trap (again to set it off); each has an air version")}
      ${R("Space", "Jump; again in the air, " + airDesc(c))}
      ${R("Twice left or right", "Dash")}
      ${R("Down", "Guard (half a second); held still, heal")}
      ${c.spinDash ? R("Down + Space", "Spin Dash: tap Space to rev, let go of Down") : ""}
      <p>${esc(c.text)}</p>
    </div>`;
  }
  function battlePause(ov) {
    const B = battle, tr = B.cfg.kind === "training", story = B.cfg.kind === "story";
    const dum = tr ? B.fs[1].ai.dummy : null;
    ov.innerHTML = `
      <div class="panel adv-small pop ${tr ? "adv-tpause" : ""}">
        <div class="panel-hd">${ico("info")}Paused</div>
        ${tr ? `<div class="adv-rules">${row("The dummy", "", seg("dum", DUMMY, dum))}</div>` : ""}
        <div class="adv-btns">
          <button class="btn" id="advRes" data-k="res">${ico("next")}Keep ${tr ? "training" : "fighting"}</button>
          ${tr ? `<button class="btn ghost" id="advReset" data-k="reset">Start again from the corners</button>
                  <button class="btn ghost" id="advMoves" data-k="moves">Move list</button>`
               : `<button class="btn ghost" id="advRe" data-k="re">Start the ${story ? "battle" : "match"} again</button>`}
          <button class="btn ghost" id="advSetup" data-k="setup">${story ? `${ico("book")}Story` : tr ? "Training setup" : "Battle setup"}</button>
          ${story ? "" : `<button class="btn ghost" id="advMain" data-k="main">${ico("back")}Main menu</button>`}
        </div>
        <div class="adv-mwrap" hidden>${movesHtml(B.lead.c)}</div>
      </div>`;
    const q = s => ov.querySelector(s);
    q("#advRes").onclick = () => togglePause();
    if (q("#advRe")) q("#advRe").onclick = () => { paused = false; startBattle(B.cfg); };
    if (q("#advReset")) q("#advReset").onclick = () => { paused = false; startBattle(B.cfg); };
    if (q("#advMoves")) q("#advMoves").onclick = () => { const m = q(".adv-mwrap"); m.hidden = !m.hidden; };
    q("#advSetup").onclick = () => { paused = false; if (story) storyMenu(); else if (tr) trainingSetup(true); else battleSetup(true); };
    if (q("#advMain")) q("#advMain").onclick = () => { paused = false; mainMenu(); };
    ov.querySelectorAll("[data-seg]").forEach(el => el.onclick = () => {
      B.fs[1].ai.dummy = el.dataset.v; B.cfg.slots[1].dummy = el.dataset.v; tset().act = el.dataset.v; save(saveData);
      ov.querySelectorAll("[data-seg]").forEach(x => x.classList.toggle("sel", x === el));
    });
    autoFocus();
  }
  /* the end of a match: who won, and everyone's numbers on the board */
  function battleOver() {
    const B = battle;
    if (B.cfg.kind === "story") return storyBattleOver(B);
    mode = "results";
    host.querySelector(".adv-hud").classList.remove("on");
    /* a player's Emerl on the winning side learns one move of someone else's (Sonic Battle's skill card) */
    const won = B.winner != null && B.fs.some(f => f.team === B.winner && f.c.id === "emerl" && f.ctl !== "cpu");
    const got = won && !B.taught ? (B.taught = emerlLearn() || "all") : null;
    const order = B.fs.slice().sort((a, b) => (b.team === B.winner) - (a.team === B.winner) || b.score - a.score || b.lives - a.lives || b.dealt - a.dealt);
    const ov = host.querySelector(".adv-ov");
    ov.innerHTML = `
      <div class="panel adv-small adv-bres pop">
        <div class="panel-hd gold">${ico("trophy")}${B.winner == null ? "A draw" : esc(winnerLine(B.winner).replace(/!$/, ""))}</div>
        ${got && got !== "all" ? `
        <div class="adv-skill">
          <canvas width="88" height="72" data-face="${got.src}"></canvas>
          <div><em>New skill</em><b>${esc(got.name)}</b><i>${esc(castOf(got.src).name)}'s ${esc(got.slotName.toLowerCase())}: Emerl copied it. Set it in Emerl's Skills.</i></div>
        </div>` : got === "all" ? `<p class="adv-note">Emerl knows every move there is to learn.</p>` : ""}
        <div class="adv-board">
          <div class="adv-row adv-bhd"><span></span><em>KOs</em><em>Down</em><em>Damage</em></div>
          ${order.map(f => `
            <div class="adv-row adv-frow ${f.team === B.winner ? "win" : ""}">
              <span><canvas width="44" height="40" data-face="${f.c.id}"></canvas><b>${esc(f.c.name)}</b><i style="--tc:${tagCol(f)}">${tagText(f)}</i></span>
              <b class="num">${f.kos}</b><b class="num">${f.downs}</b><b class="num">${Math.round(f.dealt)}</b>
            </div>`).join("")}
        </div>
        <div class="adv-btns">
          <button class="btn" id="advAgainB" data-focus data-k="again">${ico("flag")}Rematch</button>
          ${got && got !== "all" ? `<button class="btn ghost" id="advBSkill" data-k="skill">Emerl's Skills</button>` : ""}
          <button class="btn ghost" id="advBSet" data-k="set">Battle setup</button>
          <button class="btn ghost" id="advBMain" data-back data-k="main">${ico("back")}Main menu</button>
        </div>
      </div>`;
    ov.querySelectorAll("[data-face]").forEach(cv => paintCard(cv, cv.dataset.face, "portrait", 1));
    ov.querySelector("#advAgainB").onclick = () => startBattle(B.cfg);
    ov.querySelector("#advBSet").onclick = () => battleSetup(true);
    ov.querySelector("#advBMain").onclick = () => mainMenu();
    if (ov.querySelector("#advBSkill")) ov.querySelector("#advBSkill").onclick = () => emerlSkills(() => battleSetup(true));
    setTimeout(autoFocus, 0);
  }

  /* Emerl's Skills: his slots, each set to his own move or one he has learned (Sonic Battle's skill
     cards, without the points: any mix goes). The arrows go through what he knows for that slot. */
  function emerlSkills(back) {
    const e = emerlSave(), ov = screenOn("setup");
    const all = emerlAll(), n = e.learned.length;
    const opts = slot => ["emerl"].concat(EM_SRC.filter(src => e.learned.includes(src + "." + slot)));
    const label = (slot, src) => src === "emerl" ? "His own" : `${EM.names[src][slot]} (${castOf(src).name})`;
    ov.innerHTML = `
      <div class="adv-menu pop">
        <div class="panel adv-panel adv-opts adv-emsk">
          <div class="panel-hd">${ico("cards")}Emerl's Skills</div>
          <div class="adv-emtop">
            <canvas width="88" height="72" data-face="emerl"></canvas>
            <div><b class="sx-big">${n}<i>/${all.length}</i></b><span>moves learned. Each battle Emerl wins as a player's fighter teaches him one more, at random.</span></div>
          </div>
          <div class="adv-rules">
            ${EM_SLOTS.map(([slot, nm]) => { const o = opts(slot), cur = e.loadout[slot] || "emerl";
              return row(nm, o.length > 1 ? `${o.length - 1} learned` : "Nothing learned yet", o.length > 1 ? arrows("em-" + slot, esc(label(slot, cur))) : `<div class="adv-pick"><b>${esc(label(slot, cur))}</b></div>`); }).join("")}
          </div>
          <div class="adv-go">
            <button class="btn lg" id="advEmDone" data-back data-focus data-k="done">${ico("check")}Done</button>
            <button class="btn ghost" id="advEmOwn" data-k="own">All his own</button>
          </div>
        </div>
      </div>`;
    ov.querySelectorAll("[data-face]").forEach(cv => paintCard(cv, cv.dataset.face));
    ov.querySelectorAll("[data-arr]").forEach(el => el.onclick = () => {
      const slot = el.dataset.arr.slice(3), o = opts(slot), cur = e.loadout[slot] || "emerl";
      const nx = o[(o.indexOf(cur) + +el.dataset.d + o.length) % o.length];
      if (nx === "emerl") delete e.loadout[slot]; else e.loadout[slot] = nx;
      save(saveData); emerlSkills(back);
    });
    ov.querySelector("#advEmOwn").onclick = () => { e.loadout = {}; save(saveData); emerlSkills(back); };
    ov.querySelector("#advEmDone").onclick = () => back();
    if (!kbFocus || !kbFocus.isConnected) autoFocus();
  }

  // ---------------------------------------------------------------- options
  /* Options: the game's own music, sound, dialogue-speed and screen-shake settings (the same
     ones the rest of Post Parade uses), and the keys two players share a keyboard with. A key is
     set by picking it and pressing the new one (Esc leaves it as it was); a key does one thing,
     so taking it from one place clears it from another. */
  const KEYMAP_KEY = "postparade.adventure.keys";
  const ACTS = [["L", "Left"], ["R", "Right"], ["U", "Up"], ["D", "Down"], ["J", "Jump"], ["Z", "Light"], ["X", "Heavy"], ["C", "Special"]];
  const KEYS_DEF = () => ({
    p: [{ L: ["KeyA"], R: ["KeyD"], U: ["KeyW"], D: ["KeyS"], J: ["Space"], Z: ["KeyV"], X: ["KeyB"], C: ["KeyN"] },
        { L: ["ArrowLeft"], R: ["ArrowRight"], U: ["ArrowUp"], D: ["ArrowDown"], J: ["Numpad0", "Quote"], Z: ["Numpad1", "KeyK"], X: ["Numpad2", "KeyL"], C: ["Numpad3", "Semicolon"] }],
    padSwap: false });
  let KEYMAP = KEYS_DEF();
  try { const k = JSON.parse(localStorage.getItem(KEYMAP_KEY)); if (k && k.p && k.p.length === 2) KEYMAP = Object.assign(KEYS_DEF(), k); } catch (e) {}
  const saveKeys = () => { try { localStorage.setItem(KEYMAP_KEY, JSON.stringify(KEYMAP)); } catch (e) {} };
  function duoKey(code) {
    if (!code) return null;
    for (let s = 0; s < 2; s++) for (const [a] of ACTS) if ((KEYMAP.p[s][a] || []).includes(code)) return [s, a];
    return null;
  }
  const KEY_NAMES = { Space: "Space", ArrowLeft: "←", ArrowRight: "→", ArrowUp: "↑", ArrowDown: "↓", Semicolon: ";", Quote: "'", Comma: ",",
    Period: ".", Slash: "/", Backslash: "\\", BracketLeft: "[", BracketRight: "]", Minus: "-", Equal: "=", Backquote: "`", ShiftLeft: "Left Shift",
    ShiftRight: "Right Shift", ControlLeft: "Left Ctrl", ControlRight: "Right Ctrl", AltLeft: "Left Alt", AltRight: "Right Alt", Tab: "Tab", Backspace: "Backspace",
    NumpadDecimal: "Num .", NumpadAdd: "Num +", NumpadSubtract: "Num -", NumpadMultiply: "Num *", NumpadDivide: "Num /" };
  const keyName = c => KEY_NAMES[c] || (/^Key./.test(c) ? c.slice(3) : /^Digit./.test(c) ? c.slice(5) : /^Numpad\d$/.test(c) ? "Num " + c.slice(6) : c);
  let rebind = null;
  function takeRebind(e) {
    const r = rebind; rebind = null;
    if (e.key !== "Escape" && e.code && !/^(Enter|NumpadEnter|Escape)$/.test(e.code)) {
      for (const m of KEYMAP.p) for (const [a] of ACTS) m[a] = (m[a] || []).filter(c => c !== e.code);
      KEYMAP.p[r.slot][r.act] = [e.code];
      saveKeys();
    }
    optionsScreen();
  }
  function optionsScreen(first) {
    const ov = screenOn("options");
    const S = root.Settings, def = id => S && S.DEFS.find(d => d.id === id);
    const setSeg = id => { const d = def(id); return d ? seg("set:" + id, d.choices, S.get(id)) : ""; };
    const K = KEYMAP.p;
    ov.innerHTML = `
      <div class="adv-menu pop">
        <div class="panel adv-panel adv-opts">
          <div class="panel-hd">${ico("gear")}Options</div>
          <div class="adv-rules">
            ${row("Music", "", setSeg("musicVolume"))}
            ${row("Sound effects", "", setSeg("sfxVolume"))}
            ${row("Dialogue speed", "How quickly the story's talk types out.", setSeg("textSpeed"))}
            ${row("Screen shake", "The jolt when a heavy blow lands.", seg("set:shake", [[1, "On"], [0, "Off"]], S && S.get("shake") === false ? 0 : 1))}
          </div>
          <p class="adv-note">Music, sound, dialogue speed and screen shake are Post Parade's own settings: they change for the whole game.</p>
          <div class="panel-hd adv-hd2">${ico("arcade")}Two players, one keyboard</div>
          <div class="adv-kmap">
            <div class="adv-kh"><span></span><b style="--tc:${SLOT_C[0]}">Player 1</b><b style="--tc:${SLOT_C[1]}">Player 2</b></div>
            ${ACTS.map(([a, l]) => `
              <div class="adv-kr"><span>${l}</span>
                ${[0, 1].map(s => `<button data-key="${s}:${a}" data-k="key-${s}-${a}" class="${rebind && rebind.slot === s && rebind.act === a ? "wait" : ""}">${
                  rebind && rebind.slot === s && rebind.act === a ? "Press a key" : (K[s][a] || []).map(keyName).join(" or ") || "None"}</button>`).join("")}
              </div>`).join("")}
          </div>
          <div class="adv-rules">
            ${row("Gamepads", "With two pads plugged in, which one is Player 1's.", seg("pad", [[0, "The first is Player 1's"], [1, "The first is Player 2's"]], KEYMAP.padSwap ? 1 : 0))}
          </div>
          <p class="adv-note">With one player the keys are always the arrows or W A S D, Space, Z, X and C. These are for a battle between two.</p>
          <div class="adv-go">
            <button class="btn lg" id="advODone" data-back data-focus data-k="done">${ico("check")}Done</button>
            <button class="btn ghost" id="advOReset" data-k="reset">Put the keys back as they were</button>
          </div>
        </div>
      </div>`;
    ov.querySelectorAll("[data-seg]").forEach(el => el.onclick = () => {
      const key = el.dataset.seg, v = el.dataset.v;
      if (key === "pad") { KEYMAP.padSwap = v === "1"; saveKeys(); }
      else if (key === "set:shake") S && S.set("shake", v === "1");
      else if (S) { const d = def(key.slice(4)); const c = d && d.choices.find(c => String(c[0]) === v); if (c) S.set(d.id, c[0]); }
      optionsScreen();
    });
    ov.querySelectorAll("[data-key]").forEach(el => el.onclick = () => {
      const [s, a] = el.dataset.key.split(":");
      rebind = { slot: +s, act: a }; optionsScreen();
    });
    ov.querySelector("#advOReset").onclick = () => { KEYMAP = KEYS_DEF(); saveKeys(); optionsScreen(); };
    ov.querySelector("#advODone").onclick = () => { rebind = null; mainMenu(); };
    if (first) autoFocus();
    else if (kbUsed && rebind) { const el = ov.querySelector(`[data-k="key-${rebind.slot}-${rebind.act}"]`); if (el) setFocus(el); }
  }

  // ---------------------------------------------------------------- story
  /* The story: chapters in adventure-story.js, each a scene of talk, then a stage to run (the
     story's own) or a battle to win as one of the cast, then the talk after. Clearing one opens
     the next; a cleared one can be played again. */
  const STORY = () => (root.AdventureStory && AdventureStory.CHAPTERS) || [];
  let storyRun = null, talk = null;
  const storyDone = () => (saveData.story && saveData.story.done) || 0;
  function chapterLine(ch) {
    const who = castOf(ch.who).name;
    if (ch.kind === "run") return `${who}: ${storyDef(ch).name}`;
    const foes = ch.foes.map(f => castOf(f.who).name).join(" & "), with_ = (ch.allies || []).map(a => castOf(a).name);
    return `${[who].concat(with_).join(" & ")} against ${foes}, at ${stages()[stageAt(ch.arena)].name}`;
  }
  function storyMenu() {
    storyRun = null;
    const ov = screenOn("story");
    ensureStageWorld();
    const list = STORY(), done = storyDone(), next = Math.min(done, list.length - 1);
    ov.innerHTML = `
      <div class="adv-menu pop">
        <div class="panel adv-panel">
          <div class="panel-hd">${ico("book")}Story: ${esc((root.AdventureStory && AdventureStory.TITLE) || "")}</div>
          <div class="adv-stages adv-chs">
            ${list.map((ch, i) => { const open = i <= done; return `
              <button class="adv-st ${i === next ? "on" : ""} ${open ? "" : "locked"}" data-ch="${i}" data-k="ch-${i}" ${open ? "" : "disabled"}>
                <span class="adv-n">${i + 1}</span>
                <canvas class="adv-st-who" width="36" height="38" data-face="${ch.who}"></canvas>
                <span class="adv-st-tx"><b>${esc(ch.title)}</b><i>${esc(chapterLine(ch))}</i></span>
                <span class="adv-chk">${!open ? `${ico("lock")}Locked` : i < done ? `${ico("check")}Cleared` : ch.kind === "battle" ? "Battle" : "Stage"}</span>
              </button>`; }).join("")}
          </div>
          <div class="adv-go">
            <button class="btn lg" id="advCont" data-enter data-focus data-k="cont">${ico("book")}${done >= list.length ? `Play chapter ${list.length} again` : done ? `Go on: chapter ${next + 1}` : "Begin the story"}</button>
            <button class="btn ghost" id="advSBack" data-back data-k="back">${ico("back")}Main menu</button>
          </div>
        </div>
      </div>`;
    ov.querySelectorAll("[data-face]").forEach(cv => paintCard(cv, cv.dataset.face, "idle", 1));
    ov.querySelectorAll("[data-ch]").forEach(b => b.onclick = () => { if (+b.dataset.ch <= done) playChapter(+b.dataset.ch); });
    ov.querySelector("#advCont").onclick = () => playChapter(next);
    ov.querySelector("#advSBack").onclick = () => mainMenu();
    autoFocus();
    const on = ov.querySelector(".adv-st.on"); if (on) on.scrollIntoView({ block: "nearest" });
  }
  function playChapter(i) {
    const ch = STORY()[i]; if (!ch) return;
    endBattle();
    storyRun = { i, ch };
    if (ch.kind === "run") { storyRun.def = storyDef(ch); loadDef(storyRun.def); glideX = 12; camX = 15; }
    else { disposeWorld(); world = buildWorld(arenaDef(stageAt(ch.arena))); player = makePlayer(castOf(ch.who)); glideX = world.W / 2; snapCamera(); }
    music();
    playScene(ch.before, () => storyAction(i));
  }
  function storyAction(i) {
    const ch = STORY()[i];
    if (ch.kind === "run") { play(); return; }
    const slots = [{ who: ch.who, ctl: "p1", team: 0 }].concat((ch.allies || []).map(a => ({ who: a, ctl: "cpu", lvl: 1, team: 0 })),
                  ch.foes.map(f => ({ who: f.who, ctl: "cpu", lvl: f.lvl == null ? 1 : f.lvl, team: 1 })));
    startBattle({ kind: "story", slots, teams: true, arena: stageAt(ch.arena), rule: "stock", goal: 1, time: 0, hp: 100 });
  }
  const storyDef = ch => storyStages().find(s => s.id === ch.stage) || stages()[stageAt(ch.stage)];
  /* A word from someone mid-run: a chapter's `beats` are [how far along (0 to 1), who, words];
     each comes once a run, in a speech box up top, while the running goes on. */
  function storyBeats(dt) {
    const R = storyRun; if (!R || !R.ch.beats || !world || !world.goal || paused || mode !== "play") return;
    const el = host.querySelector(".adv-comm"); if (!el) return;
    R.said = R.said || {};
    R.commT = Math.max(0, (R.commT || 0) - dt);
    if (R.commT <= 0) el.classList.remove("on");
    if (R.commT > 0.4 || world.t < 2.4) return;
    const at = player.x / world.goal.x;
    const k = R.ch.beats.findIndex((b, n) => !R.said[n] && at >= b[0]);
    if (k < 0) return;
    const [, who, text] = R.ch.beats[k];
    R.said[k] = true;
    paintCard(el.querySelector("canvas"), who);
    el.style.setProperty("--tc", "#" + (HIT_C[who] || 0x4a9dff).toString(16).padStart(6, "0"));
    el.querySelector("b").textContent = castOf(who).name; el.querySelector("span").textContent = text;
    el.classList.add("on"); R.commT = 2.4 + text.length * 0.05;
  }
  function storyBattleOver(B) {
    const won = B.winner === B.fs[0].team;
    if (won) { storyAfter(storyRun.i); return; }
    mode = "results";
    host.querySelector(".adv-hud").classList.remove("on");
    const ov = host.querySelector(".adv-ov");
    ov.innerHTML = `
      <div class="panel adv-small pop">
        <div class="panel-hd">${ico("info")}Beaten</div>
        <p class="adv-note">${esc(castOf(storyRun.ch.who).name)} is down. Down guards, and held still heals; the move list is in Training.</p>
        <div class="adv-btns">
          <button class="btn" id="advTry" data-focus data-k="try">${ico("flag")}Try again</button>
          <button class="btn ghost" id="advSt" data-back data-k="st">${ico("book")}Story</button>
        </div>
      </div>`;
    ov.querySelector("#advTry").onclick = () => startBattle(B.cfg);
    ov.querySelector("#advSt").onclick = () => storyMenu();
    setTimeout(autoFocus, 0);
  }
  /* the talk after a cleared chapter, over the stage or the arena it was won in */
  function storyAfter(i) {
    const ch = STORY()[i];
    endBattle();
    if (world && world.def.arena) glideX = world.W / 2;
    else if (world) { glideX = Math.max(12, Math.min(world.W - 31, (world.goal ? world.goal.x : world.W) - 22)); camX = glideX + 3; }
    playScene(ch.after, () => chapterClear(i));
  }
  function chapterClear(i) {
    saveData.story = saveData.story || {};
    saveData.story.done = Math.max(storyDone(), i + 1); save(saveData);
    const list = STORY(), next = i + 1 < list.length ? i + 1 : -1, ch = list[i];
    const ov = screenOn("story");
    ov.innerHTML = `
      <div class="panel adv-small pop">
        <div class="panel-hd gold">${ico("check")}Chapter ${i + 1}: ${esc(ch.title)}</div>
        <p class="adv-note">${next >= 0 ? `Next, chapter ${next + 1}: <b>${esc(list[next].title)}</b>. ${esc(chapterLine(list[next]))}.` : "The end of the story. Thank you for playing."}</p>
        <div class="adv-btns">
          ${next >= 0 ? `<button class="btn" id="advNextCh" data-focus data-enter data-k="next">${ico("next")}Chapter ${next + 1}</button>` : ""}
          <button class="btn ${next >= 0 ? "ghost" : ""}" id="advToStory" data-back data-k="story" ${next >= 0 ? "" : "data-focus"}>${ico("book")}Story</button>
        </div>
      </div>`;
    if (next >= 0) ov.querySelector("#advNextCh").onclick = () => playChapter(next);
    ov.querySelector("#advToStory").onclick = () => storyMenu();
    autoFocus();
  }

  /* A scene: the speaker's Sonic Battle portrait on their side (the first to speak on the
     left, the next on the right; a third takes the place of whoever spoke longest ago), their
     name, and their words typed out at the dialogue speed Options sets. Z, Enter or a tap goes
     on (all of a line at once, then the next); X skips the rest. Narration has no portrait. */
  const lineOf = x => Array.isArray(x) ? { who: x[0], text: x[1] } : x;
  function playScene(lines, done) {
    lines = (lines || []).map(lineOf);
    if (!lines.length) { done(); return; }
    const ov = screenOn("scene");
    ov.innerHTML = `
      <div class="adv-talk">
        <canvas class="adv-tk-face l" width="176" height="144"></canvas>
        <canvas class="adv-tk-face r" width="176" height="144"></canvas>
        <div class="adv-tk-box">
          <div class="adv-tk-name"></div>
          <div class="adv-tk-text"></div>
          <div class="adv-tk-hint">${TOUCH ? "Tap to go on" : "<b>Z</b> or <b>Enter</b> to go on &middot; <b>X</b> skips the scene"}</div>
        </div>
        <button class="btn ghost adv-tk-skip" data-k="skip">Skip</button>
      </div>`;
    talk = { lines, i: -1, done, shown: 0, t: 0, sides: { l: null, r: null }, last: "r", ov };
    ov.querySelector(".adv-talk").onclick = e => { if (e.target.closest(".adv-tk-skip")) sceneSkip(); else sceneNext(); };
    sceneNext();
  }
  const textMs = () => { const v = root.Settings && Settings.get("textSpeed"); return v == null ? 18 : v; };
  function sceneNext() {
    const T = talk; if (!T) return;
    const L = T.lines[T.i];
    if (L && T.shown < L.text.length) { T.shown = L.text.length; paintTalk(); return; }
    T.i++;
    if (T.i >= T.lines.length) { talk = null; T.done(); return; }
    const n = T.lines[T.i];
    T.shown = 0; T.t = 0;
    if (n.who) {
      let side = T.sides.l === n.who ? "l" : T.sides.r === n.who ? "r" : null;
      if (!side) {
        side = T.sides.l == null ? "l" : T.sides.r == null ? "r" : T.last === "l" ? "r" : "l";
        T.sides[side] = n.who;
        const cv = T.ov.querySelector(".adv-tk-face." + side); paintCard(cv, n.who); cv.classList.add("in");
      }
      T.last = side;
    }
    if (!textMs()) T.shown = n.text.length;
    paintTalk();
  }
  function sceneTick(dt) {
    const T = talk; if (!T) return;
    const L = T.lines[T.i]; if (!L || T.shown >= L.text.length) return;
    T.t += dt * 1000;
    const n = Math.min(L.text.length, Math.floor(T.t / Math.max(1, textMs())));
    if (n !== T.shown) { T.shown = n; paintTalk(); }
  }
  function paintTalk() {
    const T = talk, L = T.lines[T.i], ov = T.ov;
    const nm = ov.querySelector(".adv-tk-name"), tx = ov.querySelector(".adv-tk-text");
    nm.textContent = L.who ? (L.name || castOf(L.who).name) : ""; nm.hidden = !L.who;
    nm.style.setProperty("--tc", L.who ? "#" + (HIT_C[L.who] || 0xffffff).toString(16).padStart(6, "0") : "");
    tx.textContent = L.text.slice(0, T.shown);
    tx.classList.toggle("narr", !L.who);
    const box = ov.querySelector(".adv-tk-box");
    box.classList.toggle("done", T.shown >= L.text.length);
    box.classList.toggle("tl", !!L.who && T.last === "l"); box.classList.toggle("tr", !!L.who && T.last === "r");
    for (const s of ["l", "r"]) ov.querySelector(".adv-tk-face." + s).classList.toggle("talking", !!L.who && T.last === s && T.sides[s] === L.who);
  }
  function sceneSkip() { const T = talk; if (!T) return; talk = null; T.done(); }

  // ---------------------------------------------------------------- screens
  const fmt = t => { if (t == null) return "--:--.-"; const m = Math.floor(t / 60), s = t - m * 60; return m + ":" + (s < 10 ? "0" : "") + s.toFixed(1); };
  /* open once the stage before it is cleared -- or once this one has been, so a stage added
     ahead of the others never locks what a player has already run */
  /* a stage that took the place of an older one (`was`) counts that one's clear */
  const cleared = i => actCleared(i, nActs(i) - 1);
  const unlocked = i => i === 0 || cleared(i - 1) || cleared(i);

  /* The zones' Acts. A zone (adventure-stages.js) is two: Act 1 ends at the goal signpost, Act 2
     in Eggman's arena. An Act's def is the zone's with that Act's map, par and its own id
     ("seabreeze-1"), which its record is kept under. */
  let actIdx = 0;
  const ACT_DEFS = {};
  function actDef(i, a) {
    const z = stages()[i]; if (!z || !z.acts) return z;
    a = clamp(a | 0, 0, z.acts.length - 1);
    const id = z.id + "-" + (a + 1);
    return ACT_DEFS[id] || (ACT_DEFS[id] = Object.assign({}, z, z.acts[a], { id, zone: z, actN: a + 1, last: a === z.acts.length - 1, acts: null }));
  }
  const nActs = i => (stages()[i] && stages()[i].acts ? stages()[i].acts.length : 1);
  /* an Act cleared -- or its whole zone, in a record from before the zones had Acts */
  const actCleared = (i, a) => { const z = stages()[i]; return !!((saveData.stages[z.id + "-" + (a + 1)] || {}).clear || (saveData.stages[z.id] || {}).clear || (z.was && (saveData.stages[z.was] || {}).clear)); };
  const actOpen = (i, a) => unlocked(i) && (a === 0 || actCleared(i, a - 1) || actCleared(i, a));
  /* a zone's Red Star Rings got: across its Acts (or in an older record of the whole stage) */
  const zoneShoes = i => { const z = stages()[i], old = ((saveData.stages[z.id] || {}).shoes || []).filter(Boolean).length;
    let n = 0; for (let a = 0; a < nActs(i); a++) n += ((saveData.stages[z.id + "-" + (a + 1)] || {}).shoes || []).filter(Boolean).length;
    return Math.max(old, n); };

  /* the stage up now: a story chapter's own, or the Act picked on the stage select */
  const storyStages = () => (root.AdventureStages && AdventureStages.STORY) || [];
  const curDef = () => (storyRun && storyRun.def) || actDef(stageIdx, actIdx);
  function load3d(i, a) { stageIdx = i; if (a != null) actIdx = a; actIdx = clamp(actIdx, 0, nActs(i) - 1); loadDef(actDef(i, actIdx)); }
  function loadDef(def) {
    disposeWorld();
    world = buildWorld(def);
    player = makePlayer(castOf(runnerId()));
    snapCamera();
    acc = 0; last = 0;
    const box = host.querySelector(".adv-3d");
    if (box && R.domElement.parentNode !== box) box.appendChild(R.domElement);
    R.domElement.__w = 0;
  }

  /* The title screen: the stage going by behind, slowly, from its start to its end and round
     again; the logo; Press Enter; the trainer's record on a little tote board; and along the
     bottom the whole cast in a post parade -- the thirteen of them going by in a line along
     a strip of checkered soil under grass, each in their own running frames. */
  let glideX = 12, parade = null;
  function title() {
    endBattle(); storyRun = null; talk = null;
    if (mode !== "title" && mode !== "main" && world) { glideX = Math.max(12, world.start.x); camX = glideX + 3; }
    mode = "title"; paused = false;
    const ov = host.querySelector(".adv-ov"), list = stages();
    host.querySelector(".adv-hud").classList.remove("on");
    host.classList.remove("playing");
    const clearedN = list.filter((s, i) => cleared(i)).length;
    const shoes = list.reduce((n, s, i) => n + zoneShoes(i), 0);
    const sGrades = list.reduce((n, s, i) => { let k = 0; for (let a = 0; a < nActs(i); a++) if ((saveData.stages[s.id + "-" + (a + 1)] || {}).grade === "S") k++; return n + k; }, 0);
    ov.innerHTML = `
      <div class="adv-title pop">
        <div class="adv-brand">
          <div class="adv-kicker">POST PARADE</div>
          <div class="adv-logo">ADVENTURE 2</div>
        </div>
        <div class="adv-press">${TOUCH ? "Tap Start" : "Press Enter"}</div>
        <div class="adv-tgo">
          <button class="btn lg" id="advTStart" data-enter>${ico("flag")}Start</button>
          <button class="btn ghost" id="advTBack" data-back>${ico("back")}Back to the hall</button>
        </div>
        <div class="adv-tote">
          <div><b class="num">${clearedN}<i>/${list.length}</i></b><small>Zones cleared</small></div>
          <div><b class="num">${shoes}<i>/${list.length * 3}</i></b><small>Red Star Rings</small></div>
          <div><b class="num">${sGrades}</b><small>S grades</small></div>
        </div>
      </div>
      <canvas class="adv-parade"></canvas>
      <div class="adv-legal">A fan-made cabinet, not affiliated with SEGA. Sonic and his friends, rivals and Dr. Eggman belong to SEGA.</div>`;
    parade = { cv: ov.querySelector(".adv-parade"), t: 0 };
    ov.querySelector("#advTStart").onclick = () => mainMenu();
    ov.querySelector("#advTBack").onclick = () => exit();
    autoFocus();
  }
  /* the camera goes along the stage's low road on its own; nobody is there to see */
  function titleGlide(dt) {
    const p = player, w = world;
    if (w.def.arena) glideX = w.W / 2 + Math.sin(w.t * 0.22) * (w.W / 2 - 12);         // an arena: to and fro across it
    else {
      glideX += dt * 4.2;
      if (glideX > w.W - 30) { glideX = Math.max(12, w.start.x); camX = glideX + 3; }   // round again, a cut
    }
    let y = 0;
    for (let j = 0; j < H; j++) { const c = tile(Math.floor(glideX), j); if (!solid(c) && c !== "~" && c !== "/" && c !== "\\") { y = j; break; } }
    p.x = glideX; p.y = y; p.vx = 0; p.vy = 0; p.face = 1; p.state = "run"; p.inv = 99; p.dead = 0;
  }
  /* the post parade along the bottom: everyone's running frames from their own atlas, crisp,
     at a whole number of times size; Eggman's Egg Mobile floats over the turf */
  function drawParade(dt) {
    const cv = parade && parade.cv;
    if (!cv || !cv.isConnected) return;
    parade.t += dt;
    const dpr = Math.min(2, root.devicePixelRatio || 1), W = cv.clientWidth, Hh = cv.clientHeight;
    if (!W || !Hh) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(Hh * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr); }
    const g = cv.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, Hh); g.imageSmoothingEnabled = false;
    const k = Hh >= 110 ? 2 : 1.5, track = Math.round(Hh * 0.3), top = Hh - track, t = parade.t;
    // the ground: checkered soil in two browns under a lip of grass, going by slowly
    const sq = 12, o = (t * 24) % (sq * 2);
    for (let r = 0, y = top + 8; y < Hh; r++, y += sq) for (let c = 0, x = -o - sq * 2; x < W + sq; c++, x += sq) {
      g.fillStyle = (c + r) & 1 ? "#b8641e" : "#7a3e12"; g.fillRect(x, y, sq, sq);
    }
    g.fillStyle = "#2fb844"; g.fillRect(0, top, W, 6);
    g.fillStyle = "#1c7a2a"; g.fillRect(0, top + 6, W, 3);
    g.fillStyle = "#050a22"; g.fillRect(0, top + 9, W, 2);
    g.fillStyle = "#2fb844";
    for (let x = -((t * 24) % 16); x < W; x += 16) { g.fillRect(x, top - 3, 4, 3); g.fillRect(x + 9, top - 2, 3, 2); }
    // the parade
    const gap = 46 * k, period = W + CAST.length * gap + 120, base = (t * 64) % period, feet = top + 3;
    CAST.forEach((c, n) => {
      const A = SHEETS[c.id]; if (!A) return;
      const img = IMGS[c.id] || (IMGS[c.id] = Object.assign(new Image(), { src: A.url }));
      if (!img.complete || !img.naturalWidth) return;
      const X = base - n * gap - 60;
      if (X < -80 || X > W + 80) return;
      const run = A.f.run || A.f.idle, f = run[Math.floor(t * 11 + n * 3) % run.length];
      const lift = c.lift ? Math.round(c.lift / PX * k * 0.6 + Math.sin(t * 3.4 + n) * 2) : 0;
      g.fillStyle = "rgba(10,30,14,.35)"; g.beginPath(); g.ellipse(X, feet + 1, f[2] * k * 0.32, 3.5, 0, 0, PI * 2); g.fill();
      g.drawImage(img, f[0], f[1], f[2], f[3], Math.round(X - f[4] * k), Math.round(feet - f[3] * k - lift), f[2] * k, f[3] * k);
    });
  }

  function menu() {
    endBattle(); storyRun = null; talk = null;
    mode = "menu"; paused = false; parade = null;
    const ov = host.querySelector(".adv-ov"), list = stages();
    host.querySelector(".adv-hud").classList.remove("on");
    host.classList.remove("playing");
    ov.innerHTML = `
      <div class="adv-menu pop">
        <div class="panel adv-panel">
          <div class="panel-hd">${ico("person")}Free Exhibition: who runs</div>
          <div class="adv-cast">
            ${CAST.map(c => `
              <button class="adv-who ${c.id === castId ? "on" : ""}" data-cast="${c.id}">
                <div class="adv-bust"><canvas class="adv-spr" width="176" height="144" data-who="${c.id}"></canvas></div>
                <div class="adv-who-tx">
                  <b>${esc(c.name)}</b>
                  <span class="adv-mv">${ico("star")}${esc(c.moves)}</span>
                  <span class="adv-gr">${Object.entries(c.grades).map(([k, g]) => `<i>${k}<b class="g g${g}">${g}</b></i>`).join("")}</span>
                  <small>${esc(c.text)}</small>
                </div>
              </button>`).join("")}
          </div>
          <div class="panel-hd adv-hd2">${ico("flag")}Zone</div>
          <div class="adv-acts"></div>
          <div class="adv-stages">
            ${list.map((s, i) => {
              const recs = Array.from({ length: nActs(i) }, (_, a) => saveData.stages[s.id + "-" + (a + 1)] || {}), open = unlocked(i), got = zoneShoes(i);
              const bests = recs.map(r => r.best), order = "CBAS", gr = recs.map(r => r.grade).filter(Boolean).sort((a, b) => order.indexOf(b) - order.indexOf(a))[0];
              const r = { best: bests.every(b => b != null) ? bests.reduce((a, b) => a + b, 0) : null, grade: gr }, sh = [0, 1, 2].map(k => k < got);
              return `
              <button class="adv-st ${i === stageIdx ? "on" : ""} ${open ? "" : "locked"}" data-st="${i}" ${open ? "" : "disabled"}>
                <span class="adv-n">${i + 1}</span>
                ${s.who ? `<canvas class="adv-st-who" width="36" height="38" data-face="${s.who}" title="${esc(castOf(s.who).name)}'s stage"></canvas>` : ""}
                <span class="adv-st-tx"><b>${esc(s.name)}</b><i>${esc(s.sub)}</i></span>
                ${open ? `
                  <span class="adv-shoes">${[0, 1, 2].map(k => `<em class="${sh[k] ? "got" : ""}">${RED_I}</em>`).join("")}</span>
                  <span class="adv-best num">${r.best != null ? fmt(r.best) : "--:--.-"}</span>
                  <span class="adv-grade">${r.grade ? `<b class="g g${r.grade}">${r.grade}</b>` : ""}</span>`
                : `<span class="adv-lock">${ico("lock")}Clear zone ${i} first</span>`}
              </button>`;
            }).join("")}
          </div>
          <div class="adv-go">
            <button class="btn lg" id="advStart" data-enter>${ico("flag")}Start</button>
            <button class="btn ghost" id="advBack" data-back>${ico("back")}Main menu</button>
          </div>
          <div class="adv-keys">${TOUCH ? "On screen: the pad moves, crouches and picks a move (Up or Down with Heavy or Special); Jump, Light, Heavy and Special." :
            `<b>&larr; &rarr;</b> run, twice to dash &middot; <b>Space</b> jump, again in the air &middot; <b>Z</b> light &middot; <b>X</b> heavy &middot; <b>C</b> special<br>
             <b>&uarr;</b> or <b>&darr;</b> with <b>X</b> or <b>C</b> for another move &middot; <b>&darr;</b> crouch &middot; <b>&darr; + Space</b> Spin Dash, or drop through &middot; <b>Enter</b> start, and pause<br>
             In the menus: <b>arrows</b> to choose &middot; <b>Z</b> to confirm &middot; <b>X</b> to go back`}</div>
          <div class="adv-credit">Sonic and his friends, his rivals and Dr. Eggman belong to SEGA. Sonic, Tails, Knuckles, Amy, Rouge, Shadow, Cream, Chaos and Chaos Gamma are from SEGA's Sonic Battle (Game Boy Advance, 2003), ripped by QuadFactor; Emerl, and every move he copies, re-ripped by Dinoshi 64 (some rips by Mr. C); Knuckles' climbing and the Spin Dash rev, dust and blast effects are from Sonic Advance (2001), ripped by AsuharaMoon; all from The Spriters Resource. Dr. Eggman, Metal Sonic, Mighty and Silver are drawn in Sonic Battle's style by TheKnucklesMainG4 (DeviantArt). The badniks are from Sonic Advance, Sonic Advance 2 and Sonic Advance 3, ripped by SpitfyaUK and Techokami, Fatazz and SkyLights (The Spriters Resource), and from TheKnucklesMainG4's Modern Sonic Badniks sheet (DeviantArt). The monitors and shields are Sonic Advance 3's, ripped by SpitfyaUK and Techokami (The Spriters Resource). Eggman's bosses, Gemerl and the capsule are from Sonic Advance, Sonic Advance 2 and Sonic Advance 3, ripped by SonicDash57, Flare, raidlandguy, SkyLights, Shade and Sonikku (The Spriters Resource).</div>
        </div>
      </div>`;
    ov.querySelectorAll(".adv-spr").forEach(cv => paintCard(cv, cv.dataset.who));
    ov.querySelectorAll("[data-face]").forEach(cv => paintCard(cv, cv.dataset.face, "idle", 1));
    ov.querySelectorAll("[data-cast]").forEach(b => b.onclick = () => {
      castId = b.dataset.cast; saveData.cast = castId; save(saveData);
      ov.querySelectorAll("[data-cast]").forEach(x => x.classList.toggle("on", x === b));
      world.group.remove(player.spr); if (player.dust) world.group.remove(player.dust);
      player = makePlayer(castOf(castId)); snapCamera();
    });
    ov.querySelectorAll("[data-st]").forEach(b => b.onclick = () => {
      const i = +b.dataset.st; if (!unlocked(i) || i === stageIdx) return;
      ov.querySelectorAll("[data-st]").forEach(x => x.classList.toggle("on", x === b));
      load3d(i, firstAct(i)); music(); paintActs(ov);
    });
    paintActs(ov);
    ov.querySelector("#advStart").onclick = () => play();
    ov.querySelector("#advBack").onclick = () => mainMenu();
    autoFocus();
  }
  /* the zone's Acts, to pick from: each one's best time and grade; Act 2 opens once Act 1 is cleared */
  const firstAct = i => { for (let a = 0; a < nActs(i); a++) if (!actCleared(i, a)) return a; return 0; };
  function paintActs(ov) {
    const el = ov.querySelector(".adv-acts"); if (!el) return;
    const z = stages()[stageIdx];
    el.innerHTML = Array.from({ length: nActs(stageIdx) }, (_, a) => {
      const r = saveData.stages[z.id + "-" + (a + 1)] || {}, open = actOpen(stageIdx, a), last = a === nActs(stageIdx) - 1;
      return `<button class="adv-act ${a === actIdx ? "on" : ""}" data-act="${a}" data-k="act-${a}" ${open ? "" : "disabled"}>
        <b>Act ${a + 1}</b><i>${esc(z.name)}<br>${last ? "Eggman's " + esc(BOSS[z.boss] ? BOSS[z.boss].name : "boss") : "To the goal signpost"}</i>
        <span class="num">${open ? (r.best != null ? fmt(r.best) : "--:--.-") : ""}</span>${open ? (r.grade ? `<b class="g g${r.grade}">${r.grade}</b>` : "") : ico("lock")}
      </button>`;
    }).join("");
    el.querySelectorAll("[data-act]").forEach(b => b.onclick = () => {
      const a = +b.dataset.act; if (!actOpen(stageIdx, a) || a === actIdx) return;
      load3d(stageIdx, a); music(); paintActs(ov);
    });
  }
  function music() {
    const T = THEMES[world && world.def ? world.def.theme : stages()[stageIdx].theme] || THEMES.cape;
    try { if (root.Sound && Sound.play) Sound.play(T.music); } catch (e) {}
  }

  function play() {
    // the stage the menu has standing is fresh: run it; anything already played is built again
    if (world && world.def === curDef() && !world.played) {
      world.group.remove(player.spr); if (player.dust) world.group.remove(player.dust);
      world.t = 0; player = makePlayer(castOf(runnerId())); snapCamera(); acc = 0; last = 0;
    } else loadDef(curDef());
    world.played = true;
    if (storyRun) { storyRun.said = {}; storyRun.commT = 0; }
    mode = "play"; paused = false;
    host.querySelector(".adv-ov").innerHTML = "";
    host.classList.add("playing");
    const st = curDef();
    const hudEl = host.querySelector(".adv-hud");
    hudEl.classList.add("on");
    hudEl.innerHTML = `
      <div class="adv-hl">
        <span class="adv-car">${RING_I}<b class="num">0</b><i class="num">/${world.total}</i></span>
        <span class="adv-hs"></span>
      </div>
      <div class="adv-air"><i>Air</i><b class="num"></b></div>
      <div class="adv-hr">
        <span class="adv-clock num">0:00.0</span>
        <button class="adv-pause" title="Pause (Esc)" aria-label="Pause">II</button>
      </div>
      <div class="adv-toast"></div>
      <div class="adv-name"><b>${esc(st.name)}</b>${st.actN ? `<em class="num">Act ${st.actN}</em>` : ""}<i>${esc(st.sub)}</i></div>
      ${storyRun && storyRun.ch.beats ? `<div class="adv-comm"><canvas width="88" height="72"></canvas><div><b></b><span></span></div></div>` : ""}
      ${TOUCH ? padHtml() : ""}`;
    hudEl.querySelector(".adv-pause").onclick = () => togglePause();
    wirePad(hudEl);
    hudCache = {};
    setTimeout(() => { const n = host && host.querySelector(".adv-name"); if (n) n.classList.add("off"); }, 2600);
    music();
  }

  /* the cabinet's own icons: a gold ring (the counter) and a Red Star Ring */
  const RING_I = `<svg class="ico sx-ring" viewBox="0 0 16 16"><circle cx="8" cy="8" r="5.6" fill="none" stroke="#050a22" stroke-width="4.6"/><circle cx="8" cy="8" r="5.6" fill="none" stroke="#ffd21a" stroke-width="2.6"/><path d="M3.6 6.2A5 5 0 0 1 6.4 3.1" fill="none" stroke="#fff6b0" stroke-width="1.3"/></svg>`;
  const RED_I = `<svg class="ico sx-ring" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="#050a22" stroke-width="4"/><circle cx="8" cy="8" r="6" fill="none" stroke="#e42630" stroke-width="2.2"/><path d="M8 4.6l1 2.2 2.3.2-1.8 1.5.6 2.3L8 9.6l-2.1 1.2.6-2.3-1.8-1.5 2.3-.2z" fill="#ffd21a" stroke="#050a22" stroke-width=".6"/></svg>`;
  let hudCache = {};
  function hud() {
    const h = host.querySelector(".adv-hud"); if (!h || !player) return;
    const p = player, set = (key, val, fn) => { if (hudCache[key] !== val) { hudCache[key] = val; fn(val); } };
    set("car", p.carrots, v => { const c = h.querySelector(".adv-car"); c.querySelector("b").textContent = v; c.classList.toggle("zero", !v); });   // none: the counter flashes red
    set("hs", p.shoes.join(), () => h.querySelector(".adv-hs").innerHTML = p.shoes.map(b => `<em class="${b ? "got" : ""}">${RED_I}</em>`).join(""));
    set("clock", fmt(world.t), v => h.querySelector(".adv-clock").textContent = v);
    const under = p.air < AIR - 0.05;
    set("air", under ? Math.ceil(p.air) : -1, v => {
      const a = h.querySelector(".adv-air"); a.classList.toggle("on", v >= 0); a.classList.toggle("low", v >= 0 && v <= 5);
      a.querySelector("b").textContent = v >= 0 ? v : "";
    });
  }
  function hudToast(text) {
    const t = host && host.querySelector(".adv-toast"); if (!t) return;
    t.textContent = text; t.classList.remove("on"); void t.offsetWidth; t.classList.add("on");
  }
  function flashHud() { const h = host && host.querySelector(".adv-car"); if (h) { h.classList.remove("hit"); void h.offsetWidth; h.classList.add("hit"); } }

  function togglePause() {
    if (mode !== "play") return;
    paused = !paused;
    const ov = host.querySelector(".adv-ov");
    if (!paused) { ov.innerHTML = ""; last = 0; return; }
    if (battle) return battlePause(ov);
    ov.innerHTML = `
      <div class="panel adv-small pop">
        <div class="panel-hd">${ico("info")}Paused</div>
        <div class="adv-btns">
          <button class="btn" id="advRes">${ico("next")}Keep going</button>
          <button class="btn ghost" id="advRe">Start the stage again</button>
          <button class="btn ghost" id="advQuit">${ico("back")}${storyRun ? "Story" : "Stage select"}</button>
        </div>
      </div>`;
    ov.querySelector("#advRes").onclick = () => togglePause();
    ov.querySelector("#advRe").onclick = () => { paused = false; play(); };
    ov.querySelector("#advQuit").onclick = () => { paused = false; if (storyRun) storyMenu(); else { load3d(stageIdx); menu(); } };
    autoFocus();
  }

  function results(r) {
    if (!host) return;
    mode = "results";
    host.querySelector(".adv-hud").classList.remove("on");
    const list = stages(), moreActs = !storyRun && actIdx + 1 < nActs(stageIdx);
    const next = moreActs ? stageIdx : stageIdx + 1 < list.length ? stageIdx + 1 : -1, nextAct = moreActs ? actIdx + 1 : 0;
    const ov = host.querySelector(".adv-ov");
    ov.innerHTML = `
      <div class="panel adv-small adv-res pop">
        <div class="panel-hd gold">${ico("trophy")}${esc(curDef().name)}${curDef().actN ? " Act " + curDef().actN : ""}: clear</div>
        <div class="adv-board">
          <div class="adv-row"><span>Time</span><b class="num">${fmt(r.time)}</b>${r.best ? `<em>Best</em>` : ""}</div>
          <div class="adv-row"><span>Rings</span><b class="num">${r.carrots}<i>/${r.total}</i></b></div>
          <div class="adv-row"><span>Red Star Rings</span><b class="adv-hs">${r.shoes.map(b => `<em class="${b ? "got" : ""}">${RED_I}</em>`).join("")}</b></div>
          <div class="adv-row"><span>Falls</span><b class="num">${r.falls}</b></div>
          <div class="adv-row adv-big"><span>Grade</span><b class="g g${r.grade}">${r.grade}</b></div>
        </div>
        ${r.earned ? `<div class="adv-pay">${ico("carrot")}<b class="num">+${r.earned}</b> carrots to your stable</div>` : ""}
        <div class="adv-btns">
          ${storyRun ? `<button class="btn" id="advSCont" data-focus>${ico("book")}Go on with the story</button>`
            : next >= 0 ? `<button class="btn" id="advNext">${ico("next")}Next: ${esc(list[next].name)} Act ${nextAct + 1}</button>` : `<button class="btn" id="advMenu">${ico("flag")}All thirteen zones cleared</button>`}
          <button class="btn ghost" id="advAgain">Run it again</button>
          <button class="btn ghost" id="advSel" data-back>${ico("back")}${storyRun ? "Story" : "Stage select"}</button>
        </div>
      </div>`;
    const go = id => { const b = ov.querySelector(id); return b; };
    if (go("#advNext")) go("#advNext").onclick = () => { stageIdx = next; actIdx = nextAct; play(); };
    if (go("#advMenu")) go("#advMenu").onclick = () => { load3d(stageIdx); menu(); };
    setTimeout(autoFocus, 0);
    go("#advAgain").onclick = () => play();
    go("#advSel").onclick = () => { if (storyRun) { storyMenu(); return; } if (next >= 0) { stageIdx = next; actIdx = nextAct; } load3d(stageIdx); menu(); };
    if (go("#advSCont")) go("#advSCont").onclick = () => storyAfter(storyRun.i);
  }

  // ---------------------------------------------------------------- open / close
  function open(el, opts) {
    close();
    if (!ensureRenderer()) {
      el.innerHTML = `<div class="scr-wrap"><div class="panel pop"><div class="panel-hd">${ico("info")}No 3D here</div><p style="padding:16px">This browser can't draw the voxels the cabinet needs.</p></div></div>`;
      return false;
    }
    host = el; opts0 = opts || {};
    battle = null; storyRun = null; talk = null; rebind = null; actor = null; input = INPUT0;
    saveData = load();
    emerlImgs();                                         // Emerl's sheets, ready for when he is picked
    castId = CAST.some(c => c.id === saveData.cast) ? saveData.cast : "sonic";
    const list = stages();
    if (!list.length) return false;
    stageIdx = 0;
    for (let i = list.length - 1; i >= 0; i--) if (unlocked(i)) { stageIdx = i; break; }
    if (cleared(stageIdx) && stageIdx + 1 < list.length && unlocked(stageIdx + 1)) stageIdx++;
    actIdx = firstAct(stageIdx);
    el.innerHTML = `<div class="adv"><div class="adv-3d"></div><div class="adv-hud"></div><div class="adv-ov"></div></div>`;
    host = el.querySelector(".adv");
    host.addEventListener("pointerdown", () => { kbUsed = false; if (kbFocus) kbFocus.classList.remove("kb"); kbFocus = null; });
    load3d(stageIdx);
    title(); music();
    addEventListener("keydown", kd); addEventListener("keyup", ku);
    raf = requestAnimationFrame(frame);
    return true;
  }
  function exit() {
    const cb = opts0 && opts0.onExit;
    close();
    if (cb) cb();
  }
  function close() {
    if (raf) cancelAnimationFrame(raf); raf = 0;
    removeEventListener("keydown", kd); removeEventListener("keyup", ku);
    for (const k in keys) keys[k] = 0;
    for (const k in touch) touch[k] = 0;
    duoKeys.forEach(m => { for (const k in m) m[k] = 0; });
    battle = null; storyRun = null; talk = null; rebind = null; actor = null; input = INPUT0;
    disposeWorld(); player = null;
    if (R && R.domElement.parentNode) R.domElement.parentNode.removeChild(R.domElement);
    host = null;
  }

  root.Adventure = { ok: true, open, close, CAST, THEMES,
    _debug: { get world() { return world; }, get player() { return player; }, step: (s, n) => { for (let k = 0; k < (n || 1); k++) { readInput(); step(s); worldStep(s); input.jp = input.zp = input.xp = input.cp = 0; } },
              play: (i, id, a) => { if (id) castId = id; if (i != null) stageIdx = i; actIdx = a || 0; play(); }, draw: dt => draw(dt || 1 / 60), input: INPUT0, keys, touch, parse,
              get battle() { return battle; }, get mode() { return mode; }, get talk() { return talk; }, startBattle, mainMenu, storyMenu, playChapter, battleSetup,
              trainingSetup, optionsScreen, arenaDef, emerlLearn, emerlSkills, emerlCast, get saveData() { return saveData; },
              bossWeak: () => world && world.boss && BRAIN[world.boss.key].weak(world.boss), tick: (n, h) => { for (let k = 0; k < (n || 1); k++) { if (battle) battleTick(h || 1 / 120); } } } };
})(typeof globalThis !== "undefined" ? globalThis : this);
