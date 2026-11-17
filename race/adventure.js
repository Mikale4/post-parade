/*
 * Post Parade Adventure 2 -- the arcade cabinet in the hall.
 *
 * A side-on platformer in the race's own voxels: the same mesher, the same light, seen from
 * the side. Its runners are Sonic and five friends, each in their own 2D sprites from SEGA's
 * Sonic Battle (Game Boy Advance, 2003), ripped by QuadFactor (The Spriters Resource):
 * adventure-sprites.js holds the frames, tools/pack-sonic-battle.py cuts them. Six stages
 * run left to right to a winning post, each one runner's own ground, as Sonic Battle gives each
 * fighter a home arena -- Sonic's clifftops over the sea, Tails' workshop and airstrip, Amy's
 * home seen from the floor up, Knuckles' shrines up a snowy mountain, Rouge's club and the
 * casino street, Shadow's road out of the city at sundown -- each long and tall the way the
 * Genesis and Game Boy Advance acts are, with a low road, a high one and the sky over both.
 * In them are Eggman's badniks, in their own sprites from Sonic Advance 1, 2 and 3
 * (adventure-badniks.js; tools/pack-badniks.py cuts them), each doing what it does there.
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
  ];
  const castOf = id => CAST.find(c => c.id === id) || CAST[0];

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
  };
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
  const HIT_C = { sonic: 0x9ad4ff, tails: 0xfff070, knuckles: 0xff9030, amy: 0xff80c0, rouge: 0xff70d0, shadow: 0xff4060 };
  const hitWeight = (c, name) => c.id === "knuckles" ? 1.3 : c.id === "amy" && /^(heavy|upper|airatk)$/.test(name) ? 1.25 : 1;

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
  };

  // ---------------------------------------------------------------- the sprites
  /* Each runner is a flat card in the voxel world with crisp pixels, facing the way they run
     and casting a shadow of their shape. A runner's frames and effects share one texture
     (assets/guests/sb-<who>.png); a card shows a frame by its own UVs. Body frames stand on
     their feet, effects on their middle. */
  const SHEETS = root.AdventureSprites || {};
  const PX = 1.1 / 33;                              // metres to a sprite pixel: Sonic's idle is 33 tall, about 1.1m
  const MATS = {};
  function sheetMats(who) {
    if (MATS[who]) return MATS[who];
    const tex = new THREE.TextureLoader().load(SHEETS[who].url);
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
    k = k || 2;
    const go = () => {
      const g = cv.getContext("2d"), f = (A.f[frame || "portrait"] || A.f.idle)[0];
      g.clearRect(0, 0, cv.width, cv.height); g.imageSmoothingEnabled = false;
      g.drawImage(img, f[0], f[1], f[2], f[3], Math.round((cv.width - f[2] * k) / 2), cv.height - f[3] * k, f[2] * k, f[3] * k);
    };
    if (img.complete && img.naturalWidth) go(); else img.addEventListener("load", go, { once: true });
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
  function walkOn(e, speed, dt) {
    const ahead = e.x + e.dir * (e.w / 2 + 0.05);
    const wall = solid(tile(Math.floor(ahead), Math.floor(e.y + 0.3))) || world.solids.some(b => b.alive && ahead > b.x0 && ahead < b.x1 && e.y < b.y1);
    const fl = tile(Math.floor(ahead), Math.floor(e.y - 0.1)), fl2 = tile(Math.floor(ahead), Math.floor(e.y + 0.1));
    const floor = solid(fl) || fl === "-" || "/\\".indexOf(fl) >= 0 || "/\\".indexOf(fl2) >= 0;
    if (wall || !floor) { e.dir = -e.dir; return false; }
    e.vx = e.dir * speed; e.x += e.vx * dt;
    const ci = Math.floor(e.x);
    let gy = null;
    for (let j = Math.floor(e.y + 0.6); j >= Math.floor(e.y - 1.2); j--) {
      const c = tile(ci, j);
      if (c === "/" || c === "\\") { gy = slopeY(c, ci, j, e.x); break; }
      if (solid(c) || c === "-") { gy = j + 1; break; }
    }
    if (gy !== null) e.y = gy; else e.y -= 6 * dt;
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
          if (B.shot && near && e.t > B.every && (B.shot !== "down" && B.shot !== "coin" || Math.abs(dx) < 1.6) && dy < 0.5) { setMode(e, "shoot"); e.face = sgn(dx) || e.face; }
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
      world.eshots.push({ key: BADS.f[e.key].shot ? e.key : "kiki", x: e.x + (ox || 0) * f, y: e.y + (oy == null ? e.h * 0.6 : oy), vx, vy, g: s.g, r: s.r, boom: s.boom, burst: s.burst, t: 0, m: null });
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
    }
    SFX.shot();
  }
  function stepEnemyShots(dt, p) {
    const w = world;
    for (const s of w.eshots) {
      if (s.gone) continue;
      s.t += dt; s.vy -= s.g * dt; s.x += s.vx * dt; s.y += s.vy * dt;
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
    }
    setBad(e.m, k, anim, i, e.face, e.x, e.y);
  }
  function drawEnemyShots() {
    const w = world;
    for (const s of w.eshots) if (!s.gone && s.m) setBad(s.m, s.key, "shot", Math.floor(s.t * 10), sgn(s.vx) || 1, s.x, s.y - 0.2);
    for (const b of w.booms) if (!b.gone) setBad(b.m, b.key, "boom", Math.floor(b.t * 14), 1, b.x, b.y - (b.key === "hanabii" ? 1.05 : 0.5));
  }

  // ---------------------------------------------------------------- the six places
  /* Each stage is one runner's own ground, as Sonic Battle gives each fighter a home arena:
     Sonic's seaside, Tails' workshop, Amy's home, Knuckles' ruins in the snow, Rouge's club,
     Shadow's highway -- each built here as a place of its own. A theme is its sky, its light,
     what its ground, blocks and ledges are made of, what stands in it and who lives there.
       blocks   = tiles: stone, steel (riveted plate), books (spines on a shelf), carved
                  (old carved stone), glass (dark tile, neon edged), concrete
       planks   - tiles: wood, grate, shelf, rail (gold), girder
       hurdle   h: brush, barrier, books, cairn, rope
       tree     T: palm, windsock, plant, pillar, lamp, streetlamp
       foes     who lives there: the badnik each of k, r, b, n, p in a stage stands for (BADNIKS)
       far      the backdrop (buildFar) */
  const THEMES = {
    /* Sonic: green turf on white chalk, banded with flint, the sea all the way to the sky */
    cape: {
      sky: [0x2a86ec, 0xd6f0fa], fog: [0xd8eef8, 60, 320], sun: [0xfff4dc, 0.9, [10, 32, 22]], hemi: [0xffffff, 0x94b88a, 0.6],
      top: [0x52b43a, 0x60c044, 0x48a632], drip: 0x44a02e, soil: [0xe4dac2, 0xc8ba9a, 0xd6c8aa], deep: 0xb2a282,
      block: [0xb4bec8, 0xa0aab6], blocks: "stone", plank: 0xc8965a, planks: "wood", water: 0x1ca8e0, crack: 0xa8a49a, back: 0x8a7e68,
      tufts: [0x6cc84a, 0x7ad254], flowers: [0xffffff, 0xf2d040, 0x8aa8f0, 0xf08ac0], hurdle: "brush", tree: "palm",
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
  };

  // ---------------------------------------------------------------- reading a stage
  /* A stage is as tall as its chunks (all of a stage's the same): the stages are 32 rows, room
     for a low road, a high one and the sky over both. H is the stage being run. */
  let H = 32;
  const SOLIDS = "#=XBImC{}";
  const ENTS = "PGKc*JHS>rbknphMVUOT^Qo";
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
      case "glass": {                                    // dark tile, neon round the face
        if (front && (sx === 0 || sy === 0 || sx === 3 || sy === 3)) return (i + j) & 1 ? 0xff5ac8 : 0x7ad8ff;
        return jit(rnd, pick(rnd, B), 0.04);
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
      case "carrot": g = vox(v => {
        for (let y = 0; y < 8; y++) { const r = y < 3 ? 0 : y < 6 ? 1 : 1; v.box(-r, y, -r, r, y, r, y % 3 === 0 ? 0xd8701c : 0xf08a24); }
        v.box(0, -2, 0, 0, -1, 0, 0xe07a1c);
        v.box(-1, 8, 0, -1, 10, 0, 0x3f9a34); v.box(1, 8, 0, 1, 11, 0, 0x5ab84a); v.box(0, 8, -1, 0, 9, 1, 0x3f9a34);
      }); break;
      case "rainbow": g = vox(v => {
        const C = [0xe8403a, 0xf08a24, 0xf2d040, 0x5ab84a, 0x3a8ae0, 0x8a5ad0];
        for (let y = 0; y < 9; y++) { const r = y < 3 ? 0 : 1; v.box(-r, y, -r, r, y, r, C[Math.floor(y / 1.5) % 6]); }
        v.box(0, -2, 0, 0, -1, 0, 0xe8403a);
        v.box(-1, 9, 0, -1, 12, 0, 0xffffff); v.box(1, 9, 0, 1, 11, 0, 0xfff3a0);
      }); break;
      case "juice": g = vox(v => {
        v.box(-2, 0, -2, 1, 6, 1, 0xf6f6f2);
        v.box(-2, 1, -2, 1, 4, 1, 0xf08a24); v.set(-2, 3, 1, 0xffffff);
        v.box(0, 7, 0, 0, 10, 0, 0xd8303a); v.set(1, 10, 0, 0xd8303a);
      }); break;
      case "shoe": g = vox(v => {
        for (let y = 0; y < 8; y++) for (const x of [-4, 3]) v.box(x, y + 2, -1, x, y + 2, 0, y > 5 ? 0xfff3c4 : 0xf2b705);
        v.box(-3, 1, -1, 2, 1, 0, 0xf2b705); v.box(-4, 2, -1, -4, 2, 0, 0xf2b705); v.box(-2, 0, -1, 1, 0, 0, 0xd89a00);
        for (const x of [-4, 3]) v.set(x, 5, 1, 0x7a4a00);
      }); break;
      case "spring": g = vox(v => {
        v.box(-6, 0, -5, 5, 1, 4, 0x6a6a74);
        for (let y = 2; y < 6; y++) v.box(-4 + (y % 2), y, -3, 3 - (y % 2), y, 2, 0xb8bcc4);
        v.box(-7, 6, -6, 6, 7, 5, 0xd8303a); v.box(-5, 8, -4, 4, 8, 3, 0xf2f2f2);
      }); break;
      case "dash": g = vox(v => {
        v.box(-7, 0, -10, 8, 0, 9, 0x2a2a34);
        for (const ox of [-6, 0, 6]) for (let k = 0; k < 4; k++) { v.box(ox + k - 2, 1, -6 + k, ox + k - 2, 1, -6 + k + 1, 0xf2d040); v.box(ox + k - 2, 1, 5 - k, ox + k - 2, 1, 5 - k + 1, 0xf2d040); }
      }); break;
      case "pole": g = vox(v => {                      // a furlong pole
        v.box(-1, 0, -1, 0, 40, 0, 0xf6f6f2);
        v.box(-6, 34, -1, 5, 43, 0, 0xf6f6f2); v.box(-5, 35, -1, 4, 42, 0, 0xd8303a); v.box(-2, 36, -1, 1, 41, 0, 0xf6f6f2);
      }); break;
      case "poleDone": g = vox(v => {
        v.box(-1, 0, -1, 0, 40, 0, 0xf6f6f2);
        v.box(-6, 34, -1, 5, 43, 0, 0xfff3c4); v.box(-5, 35, -1, 4, 42, 0, 0xf2b705); v.box(-2, 36, -1, 1, 41, 0, 0xfff3c4);
      }); break;
      case "goal": g = vox(v => {                      // the winning post: a tall white post, the round plate
        v.box(-1, 0, -1, 1, 62, 1, 0xf6f6f2);
        for (let x = -9; x <= 9; x++) for (let y = -9; y <= 9; y++) {
          const d = Math.hypot(x, y);
          if (d > 9.4) continue;
          v.set(x, 70 + y, 2, d > 7.6 ? 0xd8303a : d < 2.2 ? 0xd8303a : 0xf6f6f2);
        }
        v.box(-1, 61, 0, 1, 61, 2, 0xf6f6f2);
        for (let z = -24; z <= 18; z += 2) v.box(-1, 0, z, 1, 0, z, 0xffffff);   // the line across the ground
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
  const HURDLE_C = { brush: [0x3a7e32, 0x2a6a2a, 0xf6f6f2], barrier: [0xd8303a, 0xf6f6f2, 0x8a8a92], books: BOOKS.slice(0, 4),
                     cairn: [0x8a8478, 0x6a645a, 0xf4f8fc], rope: [0xb01e3a, 0xe8c050, 0x7a1428] };
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
  const LAMP_AT = { lamp: [0, 38 / 12], streetlamp: [12 / 12, 56 / 12] };

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
        }
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
        for (let x = 20; x < W; x += 95) hangar(group, x + rnd() * 20, -70, rnd);
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
        { const s = new THREE.Sprite(glowMat(0x6af0a0, 0.9)); s.scale.set(26, 26, 1); s.position.set(W + 30, 62, -228); group.add(s); }
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
    carrot: () => { tone(988, 988, 0.05, "square", 0.06); tone(1319, 1319, 0.09, "square", 0.06, 0.05); },
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
  const keys = {}, pad = { L: 0, R: 0, U: 0, D: 0, J: 0, Z: 0, X: 0, C: 0 }, touch = { L: 0, R: 0, U: 0, D: 0, J: 0, Z: 0, X: 0, C: 0 };
  const input = { L: 0, R: 0, U: 0, D: 0, J: 0, Z: 0, X: 0, C: 0, jp: 0, zp: 0, xp: 0, cp: 0, dash: 0 };
  let padStart = 0;

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
    // carrots, as one instanced mesh
    const cs = S.ents.filter(e => e.t === "c");
    const cm = new THREE.InstancedMesh(propGeo("carrot"), M.vox, Math.max(1, cs.length));
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
        case "G": w.goal = { x, y, m: put(propGeo("goal"), x, y, 0) }; break;
        case "K": w.checks.push({ x, y, on: false, m: put(propGeo("pole"), x, y, -0.9) }); break;
        case "*": w.ents.push({ t: "star", x, y: y + 0.3, m: put(propGeo("rainbow"), x, y + 0.3) }); break;
        case "J": w.ents.push({ t: "juice", x, y: y + 0.2, m: put(propGeo("juice"), x, y + 0.2) }); break;
        case "H": w.shoes.push({ t: "shoe", n: shoeN, x, y: y + 0.3, m: put(propGeo("shoe"), x, y + 0.3) }); shoeN++; break;
        case "S": w.ents.push({ t: "spring", x, y, m: put(propGeo("spring"), x, y), sq: 0 }); break;
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
          w.enemies.push({ key, B, x, y: y0, x0: x, y0, w: box[0] * PX * 0.82, h: box[1] * PX * 0.88, m, alive: true,
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
      const geo = vox(v => v.box(0, 0, 0, 0, 1, 0, T.snowfall ? 0xffffff : 0xd8f0d0));
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
      w.snow = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.9, depthWrite: false }));
      scene.add(w.snow);
    }
    shoeN = 0;
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
    sheetMats(c.id).mat.color.setHex(world.T.tint || 0xffffff);
    if (BADS) badMats().mat.color.setHex(world.T.tint || 0xffffff);        // the badniks in the same light
    const spr = makeCard(c.id); world.group.add(spr);
    // Sonic Advance's Spin Dash dust, kicked up behind a rev
    const dust = framesOf(c.id, "fx.rev") ? makeCard(c.id, "fx") : null;
    if (dust) { dust.visible = false; world.group.add(dust); }
    return { c, spr, dust, x: world.start.x, y: world.start.y, vx: 0, vy: 0, face: 1, ground: true, curl: false, coyote: 0, on: null,
             state: "run", st: 0, hearts: 3, inv: 0, carrots: 0, nextHeal: 50, shoes: [false, false, false], falls: 0,
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
  const BODY_HITS = { roll: 1, charge: 1, homing: 1, glide: 1, dive: 1, tornado: 1 };
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
  /* A crate's carrots jump out and can be caught. */
  function spawnLoose(x, y, vx, vy) {
    const m = new THREE.Mesh(propGeo("carrot"), materials().vox); m.position.set(x, y, 0); world.group.add(m);
    world.ents.push({ t: "loose", x, y, vx, vy, m, life: 6 });
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
      if (!(kick && kick.r) && (e.guard || e.B.armor === "ball" || (e.B.armor === "front" && sgn((x0 + x1) / 2 - e.x) === e.face))) { glance(e); continue; }
      defeat(e, kick); n++;
    }
    for (let i = Math.floor(x0); i <= Math.floor(x1 - 0.01); i++) for (let j = Math.floor(y0); j <= Math.floor(y1 - 0.01); j++) {
      const t = tile(i, j);
      if ((t === "X" || t === "B") && breakTile(i, j)) { at(i, i + 1, j, j + 1); n++; }
    }
    for (const b of world.solids) if (b.alive && b.x1 > x0 && b.x0 < x1 && b.y1 > y0 && b.y0 < y1) { at(b.x0, b.x1, b.y0, b.y1); smashHurdle(b); n++; }
    return n;
  }

  /* Walls: tiles, and hurdles while they stand. A glide into a wall grabs it. */
  /* A tile in the way whose top is no more than half a metre over the feet, with nothing on
     it, is a lip, not a wall: the foot of a slope and the edge at its top are such lips (the
     ground under the next stretch of slope is a hand-width or two over the feet, because a
     runner moves along before the ground lifts them -- the more, the faster they go). Every
     tile step in a stage is a whole metre, so no real wall is ever a lip. */
  const isLip = (p, i, j) => j + 1 - p.y <= 0.5 && !solid(tile(i, j + 1));
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
        if (p.state === "homing" || p.state === "seek" || p.state === "dash") { p.state = "run"; p.st = 0; }
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

  const AIR_STATES = { homing: 1, fly: 1, glide: 1, teleport: 1, seek: 1, climb: 1 };
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

  function hurt(p, fromX) {
    if (p.inv > 0 || p.star > 0 || p.dead) return;
    p.hearts--; p.inv = 1.6;
    p.vx = -sgn(fromX - p.x || p.face) * 7; p.vy = 8; p.ground = false;
    p.state = "hurt"; p.st = 0.45; p.curl = false; p.mv = null; p.sp = null;
    SFX.hurt(); flashHud();
    burst(p.x, p.y + 1, [0xffffff, 0xf2d040], 8, 4);
    if (p.hearts <= 0) die(p, "beaten");
  }
  function die(p, why) {
    if (p.dead) return;
    p.dead = 1.1; p.why = why; p.falls++;
    SFX.fall();
  }
  function respawn(p) {
    p.dead = 0; p.hearts = 3; p.x = p.check.x; p.y = p.check.y + 0.02; p.vx = 0; p.vy = 0; p.inv = 1.4;
    p.state = "run"; p.ground = false; p.air = AIR; p.star = 0; p.rev = 0; p.mv = null; p.sp = null; p.curl = false;
    snapCamera();
  }

  // ---------------------------------------------------------------- moving
  function step(dt) {
    const p = player, w = world, c = p.c;
    w.t += dt;
    if (p.dead) {
      p.dead -= dt;
      if (p.dead <= 0) respawn(p);
      return;
    }
    if (mode === "goal") { p.vx *= Math.pow(0.02, dt); goalStep(p, dt); if (!p.ground) p.vy = Math.max(p.vy - GRAV * dt, -22); integrate(p, dt); return; }
    p.inv = Math.max(0, p.inv - dt); p.star = Math.max(0, p.star - dt);
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
    if (headTile === "~") {
      p.air -= dt;
      if (p.air < 6 && w.t > p.warnAt) { SFX.warn(); p.warnAt = w.t + 1; }
      if (p.air <= 0) { die(p, "air"); return; }
    } else p.air = AIR;
    let top = c.run * (p.star > 0 ? 1.22 : 1), acc = p.ground ? c.accel : c.airAccel, fr = p.ground ? 30 : 4;
    if (p.inWater) { top *= 0.62; acc *= 0.6; fr = 8; }
    if (mud) top *= 0.5;
    if (ice) { acc *= 0.32; fr = 2.2; }
    p.st -= dt;
    p.hh = (p.state === "crouch" || p.state === "roll" || p.state === "charge") ? 0.72 : c.h;
    if (p.state === "ledge") { stepLedge(p, dt); interact(p, dt); return; }

    // what they are in the middle of
    switch (p.state) {
      case "hurt": case "stumble": if (p.st <= 0) p.state = "run"; break;
      case "crouch":
        p.vx = Math.abs(p.vx) <= fr * dt ? 0 : p.vx - sgn(p.vx) * fr * dt;
        if (!input.D || !p.ground) { p.state = "run"; p.landT = 0.1; }
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
        if (c.id !== "knuckles" && dir && dir !== p.face) { p.state = "run"; break; }
        p.vx = p.face * Math.max(Math.abs(p.vx), c.run * (c.id === "shadow" ? 1.45 : 1.25));
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
      case "recoil":                                       // thrown back by his own blast, braking
        p.vx = Math.abs(p.vx) <= 16 * dt ? 0 : p.vx - sgn(p.vx) * 16 * dt;
        if (p.st <= 0) p.state = "run";
        break;
      case "fly":
        p.flyLeft -= dt;
        if (input.D) { p.state = "run"; p.catchT = 0.3; }        // Rouge Catch: lets go
        else if (p.inWater && c.id !== "tails") p.state = "run";
        break;
      case "glide":
        if (!input.J || p.ground) { p.state = "run"; break; }
        if (dir && dir !== p.face) { p.face = dir; p.vx = dir * 4; }
        p.vx = p.face * clamp(Math.abs(p.vx) + 6 * dt, 4, p.inWater ? 5 : 10);
        break;
    }
    // running, and steering in the air
    if (p.state === "run" || p.state === "fly" || p.state === "teleport") {
      const t2 = p.state === "fly" ? Math.min(top, c.run * (c.id === "rouge" ? 0.8 : 0.66)) : top;
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
                 p.state === "roll" || p.state === "teleport";
    if (p.ground) p.coyote = 0.1; else p.coyote -= dt;
    if (input.jp && free) {
      const onPlank = p.ground && p.onTile === null && !p.on && tile(Math.floor(p.x), Math.floor(p.y - 0.1)) === "-";
      if (input.D && onPlank) { p.drop = true; p.ground = false; p.y -= 0.12; p.state = "run"; }
      else if (input.D && p.ground && c.spinDash && p.state !== "roll") startCharge(p);
      else if (input.D && p.ground && !c.spinDash) { /* no Spin Dash (Rouge): Down + Space does nothing */ }
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
    if (p.inWater) { g *= 0.45; maxFall = 6; }
    switch (p.state) {
      case "homing": case "seek": case "climb": case "dive": g = 0; break;
      case "fly":
        if (p.flyLeft > 0) { g *= 0.3; maxFall = 2.4; }
        else if (c.glides) { g *= 0.25; maxFall = 1.6; }           // Rouge, tired, glides down on her wings
        else { g *= 0.5; maxFall = 4; }
        break;
      case "glide": if (p.vy > -1.5) g *= 0.5; else { p.vy = p.inWater ? -1 : -1.5; g = 0; } break;
      case "teleport": g *= 0.25; maxFall = 2; break;
      case "atk": if (p.mv.air) g *= 0.6; break;
      case "special": if (p.sp.air) { g *= 0.3; maxFall = 2.5; } break;
      case "tornado": if (p.tor.air) { g *= 0.15; maxFall = 1.2; } break;
    }
    // an updraft lifts anyone in it; one flying or gliding goes up it fastest
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
        if (p.inWater && c.id !== "tails") return;
        if (p.state !== "fly") { if (p.flyLeft <= 0) return; p.state = "fly"; p.curl = false; p.jumping = false; }
        /* each stroke lifts, but not past the top of the stage: there is nothing to fly over */
        if (p.flyLeft > 0) { p.vy = p.y > H - 3 ? Math.min(p.vy, 0.5) : Math.min(Math.max(p.vy, 0) + (c.id === "tails" ? 4.4 : 4), 5.2); SFX.flap(); }
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
    effect(p.c.id, "after", from.x, from.y, p.face, 18, false, "body");
    burst(from.x, from.y + 0.5, [0xf03a4a, 0xffe060, 0xffffff], 8, 3);
    SFX.teleport();
  }
  function startCharge(p) { p.state = "charge"; p.curl = true; p.rev = 0.15; SFX.rev(0.1); }
  function startDash(p, d) {
    const c = p.c;
    p.state = "dash"; p.face = d; p.st = c.id === "knuckles" ? 0.42 : 0.3;
    p.vx = d * c.run * (c.id === "shadow" ? 1.45 : 1.25);
    if (c.id === "sonic" || c.id === "tails") { p.vy = 4.5; p.ground = false; p.on = null; }    // Sonic Dash and Tails Hop are hops
    if (c.id === "shadow") p.inv = Math.max(p.inv, 0.3);                                      // he is gone while he dashes
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
      if (kind === "light" && c.id === "shadow") {         // his Homing Attack
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
    const b = blow(p.c, name), n = framesOf(p.c.id, name).length;
    const h0 = Math.floor(n * 0.3), h1 = Math.max(h0, Math.ceil(n * 0.7) - 1);
    p.state = "atk"; p.curl = false;
    p.mv = { name, t: 0, fps: b.fps, n, reach: b.reach, step: b.step, h0, h1, live: false, queue: null, air: !p.ground, struck: false,
             speed: Math.max(Math.abs(p.vx), p.c.run * 0.9) };
    if (name === "airatk") p.vy = Math.max(p.vy, 4);
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
    if (c.id === "amy" && m.name === "upper" && i >= m.h0 && !m.launched) { m.launched = true; p.vy = 16.5; p.ground = false; p.on = null; SFX.spring(); }
    if (m.live) {
      const up = m.name === "upper" ? 0.9 : 0;
      const x0 = p.face > 0 ? p.x : p.x - c.w / 2 - m.reach, x1 = p.face > 0 ? p.x + c.w / 2 + m.reach : p.x;
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
    const H = HITS[p.mv.name] || HITS.atk1, k = hitWeight(p.c, p.mv.name);
    return { vx: p.face * H.kick[0] * k, vy: H.kick[1] * k };
  }
  /** A blow connects: a hit spark in the runner's colour where it met, a flash, and the picture
      stops dead for a few hundredths of a second and jolts -- longest and hardest for a finisher,
      while what it hit shakes white and is then thrown. Once a blow. */
  function landBlow(p) {
    const m = p.mv; if (!m || m.struck) return;
    m.struck = true;
    const H = HITS[m.name] || HITS.atk1, k = hitWeight(p.c, m.name), col = HIT_C[p.c.id] || 0xffffff;
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
    return best;
  }

  // ---------------------------------------------------------------- the specials
  /** C: the shot; Up + C the power; Down + C the trap, or sets off the traps already down. */
  function startSpecial(p) {
    const c = p.c, air = !p.ground, kind = input.U ? "power" : input.D ? "trap" : "shot";
    if (kind === "trap" && world.traps.some(t => !t.gone)) { world.traps.forEach(t => { if (!t.gone) boomTrap(t); }); return; }
    if (p.cd[kind] > 0 || (air && p.airSp)) return;
    if (air) p.airSp = true;
    const S = SPECIALS[c.id][(air ? "air" : "") + kind];
    p.cd[kind] = kind === "power" ? 1.4 : kind === "trap" ? 0.7 : 0.45;
    p.state = "special"; p.curl = false; p.jumping = false;
    p.sp = Object.assign({ t: 0, fired: false, air }, S, { n: framesOf(c.id, S.body).length * (S.loops || 1) });
    if (air && !S.dive) p.vy = Math.max(p.vy, 1);
    SFX.cast();
  }
  function stepSpecial(p, dt) {
    const s = p.sp;
    s.t += dt;
    if (s.windup) return stepWindup(p, s, dt);
    const i = Math.floor(s.t * s.fps);
    if (!s.air) p.vx = s.step ? p.face * s.step : p.vx * Math.pow(0.001, dt);
    if (!s.fired && s.charge && s.at > 1) {
      if (!s.hum) { s.hum = true; SFX.charge(s.at / s.fps); }
      s.glow = (s.glow || 0) - dt;
      if (s.glow <= 0 && s.bits !== 0 && i >= (s.gfrom || 0)) { s.glow = s.muzzle ? 0.02 : 0.03; gather(p, s.charge, s); }
    }
    if (!s.fired && i >= s.at) { s.fired = true; fire(p, s); if (p.state !== "special") { p.sp = null; return; } }
    if (i >= s.n) {
      p.sp = null; p.state = "run";
      if (s.drive) {
        p.state = "roll"; p.curl = true; p.vx = p.face * 19; p.driveT = 0.42; SFX.roll();
        if (p.ground) effect(p.c.id, "fx.dust", p.x - p.face * 0.6, p.y, -p.face, 22, false);
        impact(p.x - p.face * 0.3, p.y + 0.4, { c: 0x9ad4ff, flash: 1.8, shake: 0.12 });
      }
    }
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
      if (framesOf(p.c.id, "fx.flare")) effect(p.c.id, "fx.flare", p.x + f * 1.3, fy, f, 26, true, "fx", 1.1);
      if (framesOf(p.c.id, "fx.crescent")) effect(p.c.id, "fx.crescent", p.x + f * 1.1, fy, f, 30, true, "ghost", 1.8);
      burst(p.x + f * 0.8, p.y + 0.4, [0xffffff, 0xcfe8ff, 0x9ad4ff], 16, 6);
      if (p.ground) effect(p.c.id, "fx.dust", p.x - f * 0.5, p.y, -f, 24, false);
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
  function fire(p, s) {
    const who = p.c.id, f = p.face;
    // the release: a flash at the hand, a jolt, and a push back
    const mz = s.muzzle;
    if (s.pow && !s.dive) {
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
                   life: s.life + held, loop: s.loop, mid: true, w: 0.8 * k, h: 0.8 * k, k, face: f, ghost: s.ghost, trail: s.trail });
      if (!s.ghost) SFX.shot();
    } else if (s.lob) {
      shoot(who, { fx: s.lob, x: p.x + f * 0.5, y: p.y + p.hh + 0.5, vx: f * s.speed, vy: s.rise, g: 26, life: 3, loop: true, mid: true,
                   w: 0.9 * k, h: 0.9 * k, k, face: f, bursts: 1.8, trail: s.trail, land: s.land, bits: s.bits });
      SFX.shot();
    } else if (s.area) {
      const ax = p.x + f * s.ax, ay = p.y + s.ay;
      effect(who, s.area, ax, ay, f, 22, true, "fx", k);
      if (strike(ax - s.w / 2, ax + s.w / 2, ay - s.h / 2, ay + s.h / 2, { r: 11, cx: ax - f * 0.6, cy: ay - 0.3 })) hitStop(0.05);
      SFX.boom();
    } else if (s.drive) {
      shoot(who, { fx: "fx.ring", x: p.x + f * 0.8, y: p.y + 0.5, vx: f * 14, vy: 0, life: 0.42, loop: true, mid: true, w: 0.5, h: 0.5, face: f, ring: true, trail: 0xfff070 });
      SFX.ring();
    } else if (s.dive) { p.diveS = s; startDive(p, s.dive); }
    else if (s.tornado) { p.state = "tornado"; p.tor = { t: s.t, from: s.tornado[0], to: s.tornado[1], left: 1.4, body: s.body, fps: s.fps, air: s.air }; SFX.swing(true); }
    else if (s.trap) setTrap(p, s);
  }
  /* Air powers that dive: Sonic Meteor (curled, down and ahead), Spiral Dive (Rouge, drills
     straight down through rock), Major Eruption (Knuckles: dives, burrows, bursts out) and
     Air Chaos Burst (Shadow drops, then bursts). */
  function startDive(p, kind) {
    p.state = "dive"; p.dive = kind; p.diveT = 0; p.curl = kind === "meteor";
    p.vx = kind === "meteor" ? p.face * 11 : 0;
    SFX.dive();
  }
  function stepDive(p, dt) {
    p.diveT += dt;
    p.vy = p.dive === "burst" ? -24 : p.dive === "meteor" ? -14 : -17;
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
      strike(p.x - 1.0, p.x + 1.0, p.y - 0.2, p.y + 1.2, { r: 9, cx: p.x, cy: p.y });
      burst(p.x, p.y + 0.1, [0xd8d0c0, 0xffffff, kind === "drill" ? 0xb070c0 : 0x5a9ae0], 16, 5);
      impact(p.x, p.y + 0.3, p.diveS && p.diveS.pow);
      if (framesOf(p.c.id, "fx.dust")) { effect(p.c.id, "fx.dust", p.x - 0.5, p.y, -1, 22, false); effect(p.c.id, "fx.dust", p.x + 0.5, p.y, 1, 22, false); }
      p.state = "run"; p.vy = 6; p.ground = false; SFX.stomp(); SFX.impact();
    } else {
      p.state = "erupt"; p.vx = 0;
      p.er = kind === "erupt" ? { t: 0, body: "airpower", from: 4, to: 16, at: 10, fps: 18, r: 1.9, fired: false }
                              : { t: 0, body: "airpower", from: 6, to: 13, at: 1, fps: 18, r: 1.9, fired: false, fx: "fx.power" };
    }
  }
  function stepErupt(p, dt) {
    const e = p.er; e.t += dt; p.vx = 0;
    const i = e.from + Math.floor(e.t * e.fps);
    if (!e.fired && i >= e.from + e.at) {
      e.fired = true;
      if (e.fx) {                                          // Shadow's Air Chaos Burst, kicking up dust
        effect(p.c.id, e.fx, p.x, p.y + 0.7, p.face, 22, true, "fx", 1.45);
        if (framesOf(p.c.id, "fx.dust")) { effect(p.c.id, "fx.dust", p.x - 0.7, p.y, -1, 20, false); effect(p.c.id, "fx.dust", p.x + 0.7, p.y, 1, 20, false); }
      } else effect(p.c.id, "fx.boom", p.x, p.y + 0.6, p.face, 22, true, "fx", 1.5);   // Knuckles' Major Eruption: the blast alone
      impact(p.x, p.y + 0.7, p.diveS && p.diveS.pow);
      strike(p.x - e.r, p.x + e.r, p.y - 0.3, p.y + 2.2, { r: 12, cx: p.x, cy: p.y });
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
      if (strike(p.x - 0.9, p.x + 0.9, p.y + 0.05, p.y + p.hh + 0.2, { vx: p.face * 10, vy: 8 })) { impact(p.x + p.face * 0.6, p.y + 0.6, { c: 0xff80c0, flash: 1.4, shake: 0.08 }); hitStop(0.03); SFX.hit(); }
      T.whirl = (T.whirl || 0) - dt;
      if (T.whirl <= 0) {                                  // the wind of the swing, round and round
        T.whirl = 0.035; const a = T.t * 18;
        world.parts.list.push({ x: p.x + Math.cos(a) * 0.9, y: p.y + 0.5 + Math.sin(a) * 0.25, z: Math.sin(a) * 0.6, vx: -Math.sin(a) * 4, vy: 2, vz: 0, life: 0.22, s: 0.07, c: Math.random() < 0.5 ? 0xffa0d0 : 0xffffff });
      }
      if ((T.swish = (T.swish || 0) - dt) <= 0) { T.swish = 0.18; SFX.swing(true); }
      if (T.left <= 0) { p.state = "run"; p.tor = null; }
    }
  }

  // ---------------------------------------------------------------- shots, effects and traps
  /** A shot: a card of the runner's sheet that flies and hits what it meets. */
  function shoot(who, o) {
    const card = makeCard(who, o.ghost ? "ghost" : "fx"); world.group.add(card);
    world.shots.push(Object.assign({ card, who, t: 0, life0: o.life, gone: false }, o));
  }
  /** An effect that only shows: plays once where it is put. */
  function effect(who, name, x, y, face, fps, mid, kind, k) {
    const card = makeCard(who, kind === "body" ? "body" : "fx"); world.group.add(card);
    world.fx.push({ card, name, x, y, face, fps, mid, k, t: 0, n: framesOf(who, name).length });
  }
  function setTrap(p, s) {
    const live = world.traps.filter(t => !t.gone);
    if (live.length >= 2) boomTrap(live[0]);
    const f = p.face, card = makeCard(p.c.id, s.faint ? "faint" : "fx"); world.group.add(card);
    world.traps.push({ card, who: p.c.id, kind: s.trap, x: p.x + f * 0.7, y: p.y + (s.flies ? 1.0 : 0), vx: s.toss ? f * 3 : 0, vy: s.toss ? 2 : 0,
                       t: 0, life: s.trap === "orbit" ? 6 : 9, a: 0, flies: !!s.flies, grounded: !s.toss && !s.flies && s.trap !== "orbit", gone: false, face: f });
    SFX.set();
  }
  function boomTrap(t) {
    if (t.gone) return;
    t.gone = true; world.group.remove(t.card); t.card.geometry.dispose();
    const by = t.y + (t.flies || t.kind === "orbit" ? 0 : 0.5), knux = t.who === "knuckles";   // his Mole Bomb: the blast alone
    effect(t.who, "fx.boom", t.x, by, 1, 22, true, "fx", 1.6);
    if (!knux) burst(t.x, by, [0xfff3a0, 0xf08a24, 0xffffff, 0xe8403a], 24, 7);
    impact(t.x, by, { c: 0xffb040, flash: 3.6, shake: 0.28, stop: 0.05, bits: knux ? 0 : 1 });
    strike(t.x - 1.5, t.x + 1.5, t.y - 0.6, t.y + 1.8, { r: 11, cx: t.x, cy: by - 0.4 });
    SFX.boom(); SFX.impact();
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
      if (s.ring && Math.abs(player.x - s.x) < 0.7 && player.state === "roll") s.life = 0;
      if (s.trail && s.bits !== 0 && Math.random() < 0.7) world.parts.list.push({ x: s.x - sgn(s.vx) * 0.35 * (s.k || 1), y: (s.mid ? s.y : s.y + 0.3 + Math.random() * 0.8) + (Math.random() - 0.5) * 0.3,
        z: (Math.random() - 0.5) * 0.3, vx: -s.vx * 0.06, vy: 0.5 + Math.random(), vz: 0, life: 0.22, s: 0.07, c: Math.random() < 0.6 ? s.trail : 0xffffff });
      if (s.ghost && !s.trail && Math.random() < 0.6) world.parts.list.push({ x: s.x - sgn(s.vx) * 0.5, y: s.y + (s.mid ? 0 : 0.2 + Math.random() * 0.9), z: (Math.random() - 0.5) * 0.4,
        vx: -s.vx * 0.08, vy: 1 + Math.random() * 1.5, vz: 0, life: 0.25, s: 0.06, c: Math.random() < 0.5 ? 0xffffff : 0xcfe8ff });
      if (s.y < -3) s.life = 0;
      if (s.life <= 0) { s.gone = true; w.group.remove(s.card); s.card.geometry.dispose(); }
    }
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
      if (Math.floor(e.t * e.fps) >= e.n) { e.gone = true; w.group.remove(e.card); e.card.geometry.dispose(); }
    }
    if (w.fx.length > 30) w.fx = w.fx.filter(e => !e.gone);
    const p = player;
    for (const t of w.traps) {
      if (t.gone) continue;
      t.t += dt; t.life -= dt;
      if (t.kind === "orbit") {                            // Roaming Chaos keeps to Shadow
        t.a += dt * 4; t.x = p.x + Math.cos(t.a) * 1.2; t.y = p.y + 0.3 + Math.sin(t.a) * 0.8;
      } else if (t.flies) {                                // Bat Cracker hunts
        const e = nearestEnemy(t.x, t.y, 9);
        if (e) { const dx = e.x - t.x, dy = e.y + e.h / 2 - t.y, d = Math.hypot(dx, dy) || 1; t.x += dx / d * 3.5 * dt; t.y += dy / d * 3.5 * dt; t.face = sgn(dx) || t.face; }
        else t.y += Math.sin(t.t * 4) * 0.4 * dt;
      } else if (!t.grounded) {                            // tossed: falls to the ground
        t.vy -= GRAV * 0.8 * dt; t.x += t.vx * dt; t.y += t.vy * dt;
        const gy = groundY(t.x, t.y + 0.3);
        if (gy !== null && t.vy < 0 && t.y <= gy) { t.y = gy; t.grounded = true; t.vx = 0; t.landT = t.t; }
        if (t.y < -3) { t.gone = true; w.group.remove(t.card); t.card.geometry.dispose(); continue; }
      } else if (t.kind === "chase") {                     // the Chu² Bomb crawls after its mark
        const e = nearestEnemy(t.x, t.y, 8);
        if (e) { const nx = t.x + sgn(e.x - t.x) * 3 * dt, gy = groundY(nx, t.y); if (gy !== null) { t.x = nx; t.y = gy; t.face = sgn(e.x - t.x) || t.face; } }
      }
      for (const e of w.enemies) if (e.alive && !e.hidden && Math.abs(e.x - t.x) < e.w / 2 + 0.35 && t.y > e.y - 0.5 && t.y < e.y + e.h + 0.3) { boomTrap(t); break; }
      if (!t.gone && t.life <= 0) boomTrap(t);
    }
    if (w.traps.length > 12) w.traps = w.traps.filter(t => !t.gone);
  }
  /* A lobbed rock comes down (Knuckles'): no dust, only its light, the jolt and the freeze. */
  function boomAt(x, y, r, s) {
    if (s && s.bits !== 0) burst(x, y, [0x9a7a62, 0x7a5a44, 0xd8c8a8, 0xb08a5a], 22, 7);
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
    // carrots
    for (const k of w.carrots) if (!k.got && touches(k.x, k.y + 0.3, 0.38)) {
      k.got = true; p.carrots++; SFX.carrot();
      burst(k.x, k.y + 0.4, [0xf08a24, 0xffc27a], 4, 2);
      if (p.carrots >= p.nextHeal) { p.nextHeal += 50; if (p.hearts < 3) { p.hearts++; SFX.juice(); } }
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
      } else if (touches(e.x, e.y + 0.4, 0.42)) {
        e.gone = true; e.m.visible = false;
        if (e.t === "juice") { p.hearts = Math.min(3, p.hearts + 1); SFX.juice(); }
        if (e.t === "star") { p.star = 8; SFX.star(); }
        burst(e.x, e.y + 0.5, [0xfff3a0, 0xffffff], 8, 3);
      }
    }
    for (const s of w.shoes) if (!s.got && touches(s.x, s.y + 0.4, 0.45)) {
      s.got = true; s.m.visible = false; p.shoes[s.n] = true; SFX.shoe();
      burst(s.x, s.y + 0.5, [0xf2b705, 0xfff3c4], 14, 4);
      hudToast("Golden Horseshoe " + (s.n + 1) + " of 3");
    }
    // checkpoints and the post
    for (const k of w.checks) if (!k.on && p.x >= k.x - 0.3) {
      k.on = true; p.check = { x: k.x, y: k.y }; SFX.check();
      k.m.geometry = propGeo("poleDone"); hudToast("Furlong pole: you'll start again here");
    }
    if (w.goal && p.x >= w.goal.x && mode === "play") finish(p);
    // thorns
    for (const z of w.hazards) if (bx1 > z.x0 && bx0 < z.x1 && by0 < z.y1 && by1 > z.y0) hurt(p, p.x + p.face);
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
        glance(e); if (p.state !== "teleport") hurt(p, e.x);
        continue;
      }
      const armoured = p.star <= 0 && (e.B.armor === "ball" ? !(stomp || p.curl) : e.B.armor === "front" ? !stomp && sgn(p.x - e.x) === e.face : false);
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
    if (!lost) {                                           // Sonic Advance's puff of smoke, and what it was carrying
      const m = badCard(); m.castShadow = false; world.group.add(m);
      world.booms.push({ key: "boom", x: e.x, y: e.y + e.h / 2, r: -9, t: 0, m });
      spawnLoose(e.x, e.y + 0.6, 0, 7);
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
      if (F.t > 0.45 || ny < -2 || solid(tile(Math.floor(nx), Math.floor(ny + e.h / 2)))) pop(e, ny < -2);
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
    // loose carrots
    for (const e of w.ents) {
      if (e.t !== "loose" || e.gone) continue;
      e.life -= dt; e.vy -= GRAV * 0.7 * dt; e.x += e.vx * dt; e.y += e.vy * dt;
      const below = tile(Math.floor(e.x), Math.floor(e.y));
      if ((solid(below) || below === "-") && e.vy < 0) { e.y = Math.floor(e.y) + 1; e.vy = -e.vy * 0.4; e.vx *= 0.7; }
      if (e.life < 5.7 && Math.abs(e.x - p.x) < 0.7 && e.y > p.y - 0.4 && e.y < p.y + p.hh) {
        e.gone = true; e.m.visible = false; p.carrots++; SFX.carrot();
      }
      if (e.life <= 0 || e.y < -3) { e.gone = true; e.m.visible = false; }
      e.m.position.set(e.x, e.y, 0); e.m.rotation.y += dt * 4; e.m.visible = !e.gone && (e.life > 1.5 || Math.sin(e.life * 30) > 0);
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
  const shakeCam = s => { shake = Math.max(shake, s); };
  const CAM_D = 17;
  function snapCamera() { if (!player) return; camX = player.x + 2; camY = Math.max(6.1, player.y + 2.1); }
  /** The runner's frame, from what they are doing. */
  function drawRunner(p, dt) {
    const c = p.c, a = p.anim, sp = Math.abs(p.vx), id = c.id;
    p.landT = Math.max(0, p.landT - dt); p.dblT = Math.max(0, (p.dblT || 0) - dt);
    p.balT = Math.max(0, (p.balT || 0) - dt); p.catchT = Math.max(0, (p.catchT || 0) - dt); p.grabT = Math.max(0, (p.grabT || 0) - dt);
    const count = nm => framesOf(id, nm).length;
    let name, fps = 10, loop = true, face = p.face, pick = null;
    if (p.dead) { name = "out"; fps = 8; loop = false; }
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
      case "dash": name = "dash"; fps = 16; loop = false; break;
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
        if (id === "tails") { name = "fly"; pick = t => 1 + Math.floor(t * (p.flyLeft > 0 ? 16 : 7)) % 4; }
        else { name = "fall"; fps = p.flyLeft > 0 ? 14 : 6; }
        break;
      case "teleport": name = "teleport"; fps = 20; loop = false; break;
      case "dive":
        if (p.dive === "meteor") { name = "ball"; fps = 30; }
        else { name = "airpower"; pick = t => p.dive === "drill" ? Math.floor(t * 22) % count("airpower") : Math.floor(t * 20) % 4; }
        break;
      case "erupt": name = p.er.body; pick = () => Math.min(p.er.from + Math.floor(p.er.t * p.er.fps), p.er.to); break;
      case "tornado": {
        const T = p.tor; name = T.body;
        pick = () => { const k = Math.floor(T.t * T.fps); return k < T.from ? k : T.from + (k - T.from) % (T.to - T.from + 1); };
        break;
      }
      default:
        if (!p.ground) {
          if (p.dblT > 0) { name = "double"; fps = 12; loop = false; }
          else if (p.balT > 0) { name = "spark"; fps = 16; loop = false; }
          else if (p.catchT > 0 && id === "rouge") { name = "catch"; fps = 8; loop = false; }
          else if (p.curl) { name = "spin"; fps = 12 + sp * 1.4; }          // out of a roll: the Spin Dash ball
          else { name = p.vy > 0 ? "jump" : "fall"; loop = false; }
        }
        else if (p.landT > 0) { name = "land"; fps = 22; loop = false; }
        else if (sp < 0.6) { name = "idle"; fps = 7; }
        else if (sp > 4 && (input.R - input.L) && sgn(input.R - input.L) !== sgn(p.vx)) { name = "skid"; fps = 12; loop = false; face = sgn(p.vx); }
        else if (sp < 2.2) name = "start";
        else { name = "run"; fps = id === "shadow" ? 8 + sp * 1.7 : 5 + sp * 1.15; }
    }
    const key = name + "|" + p.state;
    if (a.key !== key) { a.key = key; a.t = 0; } else a.t += dt;
    const i = pick ? pick(a.t) : frameAt(count(name), a.t, fps, loop);
    setFrame(p.spr, name, i, face, p.x, p.y);
    p.spr.visible = !(p.inv > 0 && !p.dead && p.state !== "dash" && p.state !== "teleport" && Math.sin(world.t * 40) > 0.4);
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
      const i = s.loop ? Math.floor(s.t * 16) % n : Math.min(n - 1, Math.floor((1 - s.life / s.life0) * n));
      setFrame(s.card, s.fx, i, s.face, s.x, s.y, s.mid, 0.2, s.k || s.ghost);
    }
    for (const e of w.fx) if (!e.gone) setFrame(e.card, e.name, Math.floor(e.t * e.fps), e.face, e.x, e.y, e.mid, e.mid ? 0.25 : 0.04, e.k);
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
      setFrame(t.card, name, i, t.face, t.x, t.y, t.flies || t.kind === "orbit", 0.15);
      t.card.visible = !(t.life < 1.6 && Math.sin(t.t * 30) > 0.3);
    }
  }
  function draw(dt) {
    const p = player, w = world;
    drawRunner(p, dt);
    drawDust(p, dt);
    drawCards();
    if (p.star > 0 && Math.random() < 0.5) burst(p.x, p.y + Math.random() * p.hh, [0xe8403a, 0xf2d040, 0x5ab84a, 0x3a8ae0, 0x8a5ad0], 1, 1);
    if (Math.abs(p.vx) > 13 && p.ground && Math.random() < 0.4) burst(p.x - p.face * 0.3, p.y + 0.05, [0xd8d0c0, 0xffffff], 1, 1.5);
    // carrots spin and bob
    const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s1 = new THREE.Vector3(1, 1, 1), s0 = new THREE.Vector3(0, 0, 0), pos = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    for (const k of w.carrots) {
      q.setFromAxisAngle(up, w.t * 2.4 + k.k * 0.3);
      pos.set(k.x, k.y + 0.12 + Math.sin(w.t * 3 + k.k) * 0.08, 0);
      M4.compose(pos, q, k.got ? s0 : s1);
      w.carrotMesh.setMatrixAt(k.k, M4);
    }
    w.carrotMesh.instanceMatrix.needsUpdate = true;
    for (const e of w.ents) if (!e.gone && e.m && (e.t === "juice" || e.t === "star")) { e.m.rotation.y = w.t * 2; e.m.position.y = e.y + Math.sin(w.t * 3 + e.x) * 0.1; }
    for (const e of w.ents) if (e.t === "spring") { e.sq = Math.max(0, e.sq - dt * 4); e.m.scale.y = 1 + e.sq * 0.6; }
      else if (e.t === "bumper") { e.sq = Math.max(0, e.sq - dt * 5); e.m.scale.set(1 + e.sq * 0.3, 1 + e.sq * 0.3, 1); }
      else if (e.t === "balloon") { e.m.position.y = e.y + Math.sin(w.t * 2.2 + e.x) * 0.12; e.m.rotation.z = Math.sin(w.t * 1.3 + e.x) * 0.12; }
    for (const s of w.shoes) if (!s.got) { s.m.rotation.y = w.t * 2.2; s.m.position.y = s.y + Math.sin(w.t * 2.5 + s.x) * 0.12; }
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
    const D = clamp(12.5 / (2 * Math.tan(17 * PI / 180) * aspect), CAM_D, 42);
    const halfW = Math.tan(17 * PI / 180) * D * aspect, halfH = Math.tan(17 * PI / 180) * D;
    const lead = clamp(p.vx * 0.28, -4.5, 4.5) + p.face * 1.2;
    const tx = clamp(p.x + lead, halfW - 0.5, w.W - halfW + 0.5);
    let ty = clamp(p.y + 2.1, p.y < 3.5 ? 3.8 : 6.1, H - 3.2);             // lower when she is down in the water
    if (D > CAM_D) ty = Math.max(ty, halfH - 3);
    camX = lerp(camX, tx, 1 - Math.exp(-dt * 3.6));
    camY = lerp(camY, ty, 1 - Math.exp(-dt * (p.ground ? 4 : 1.8)));
    camera.position.set(camX, camY + 1.9, D);
    if (shake > 0) {                                       // a blast shakes the picture, briefly
      shake = Math.max(0, shake - dt);
      camera.position.x += (Math.random() - 0.5) * shake * 1.6; camera.position.y += (Math.random() - 0.5) * shake * 1.6;
    }
    camera.lookAt(camX, camY, 0);
    if (w.snow) w.snow.position.set(camX, 0, 0);
    sun.position.set(camX + w.T.sun[2][0], w.T.sun[2][1], w.T.sun[2][2]);
    sun.target.position.set(camX, camY - 2, 0);
    R.render(scene, camera);
  }

  // ---------------------------------------------------------------- the finish
  function finish(p) {
    mode = "goal"; p.state = "run";
    world.goal.fire = 2.5; world.goal.fireT = 0;
    SFX.goal();
    const time = world.t;
    const st = stages()[stageIdx];
    const prev = saveData.stages[st.id] || {};
    const shoesBefore = prev.shoes || [false, false, false];
    const shoes = shoesBefore.map((b, i) => b || p.shoes[i]);
    const pct = world.total ? p.carrots / world.total : 1;
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
    const k = e.key;
    const b = KEYS[k];
    if (menuKey(e, down)) return;
    if (k === "Escape" || k === "p" || k === "P") { if (down && mode === "play") togglePause(); e.preventDefault(); return; }
    if (!b) return;
    if (mode === "play" || mode === "goal") e.preventDefault();
    keys[b] = down ? 1 : 0;
  }
  const kd = e => onKey(e, true), ku = e => onKey(e, false);

  /* The menus by keyboard. Enter starts the stage from the stage select, and opens and
     closes the pause menu in a run; in any menu the arrows move between its buttons (to the
     nearest one that way), Z presses the one picked (Enter too, on the pause and results
     screens) and X backs out: to the hall from the stage select, back into the run from the
     pause menu, to the stage select from the results. Returns true if it took the key. */
  let kbFocus = null, kbUsed = false;
  const NAV = { ArrowLeft: "L", ArrowRight: "R", ArrowUp: "U", ArrowDown: "D" };
  function menuKey(e, down) {
    const k = e.key, inMenu = mode === "menu" || mode === "results" || (mode === "play" && paused);
    if (k === "Enter" && mode === "play" && !paused) { if (down && !e.repeat) { kbUsed = true; togglePause(); } e.preventDefault(); return true; }
    if (!inMenu) return false;
    const z = k === "z" || k === "Z", x = k === "x" || k === "X";
    if (!(NAV[k] || z || x || k === "Enter")) return false;
    e.preventDefault();
    if (!down) return true;
    kbUsed = true;
    const ov = host.querySelector(".adv-ov"), click = sel => { const el = ov && ov.querySelector(sel); if (el && !el.disabled) el.click(); };
    if (NAV[k]) { moveFocus(NAV[k]); return true; }
    if (e.repeat) return true;
    if (k === "Enter") {
      if (mode === "menu") click("#advStart");
      else if (mode === "play") togglePause();
      else pressFocus();
      return true;
    }
    if (z) { pressFocus(); return true; }
    if (mode === "menu") click("#advBack");
    else if (mode === "play") togglePause();
    else click("#advSel");
    return true;
  }
  function menuItems() {
    const ov = host && host.querySelector(".adv-ov");
    return ov ? [...ov.querySelectorAll("button:not([disabled])")].filter(el => el.offsetParent !== null) : [];
  }
  function defaultFocus() {
    const ov = host.querySelector(".adv-ov"), items = menuItems();
    return (ov && (ov.querySelector("#advRes") || ov.querySelector("#advNext") || ov.querySelector("#advMenu") || ov.querySelector("#advStart"))) || items[0] || null;
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
  const tapAt = { L: 0, R: 0 };
  function readInput() {
    const gp = navigator.getGamepads ? Array.from(navigator.getGamepads()).find(g => g && g.connected) : null;
    for (const k in pad) pad[k] = 0;
    if (gp) {
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0, B = i => gp.buttons[i] && gp.buttons[i].pressed ? 1 : 0;
      pad.L = ax < -0.35 || B(14) ? 1 : 0; pad.R = ax > 0.35 || B(15) ? 1 : 0; pad.D = ay > 0.5 || B(13) ? 1 : 0; pad.U = ay < -0.5 || B(12) ? 1 : 0;
      pad.J = B(0); pad.Z = B(2); pad.X = B(3) || B(5); pad.C = B(1) || B(7);
      if (B(9) && !padStart && mode === "play") togglePause();
      padStart = B(9);
    }
    const on = k => keys[k] || pad[k] || touch[k] ? 1 : 0;
    const now = performance.now();
    input.dash = 0;
    for (const d of ["L", "R"]) {                    // a double tap: the dash
      const v = on(d);
      if (v && !input[d]) { if (now - tapAt[d] < 260) input.dash = d === "L" ? -1 : 1; tapAt[d] = now; }
      input[d] = v;
    }
    input.U = on("U"); input.D = on("D");
    for (const b of ["J", "Z", "X", "C"]) { const v = on(b); input[b.toLowerCase() + "p"] = v && !input[b] ? 1 : 0; input[b] = v; }
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
        while (acc >= h && n < 14) { readInput(); step(h); worldStep(h); input.jp = input.zp = input.xp = input.cp = 0; input.dash = 0; acc -= h; n++; }
        hud();
      }
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

  // ---------------------------------------------------------------- screens
  const fmt = t => { if (t == null) return "--:--.-"; const m = Math.floor(t / 60), s = t - m * 60; return m + ":" + (s < 10 ? "0" : "") + s.toFixed(1); };
  /* open once the stage before it is cleared -- or once this one has been, so a stage added
     ahead of the others never locks what a player has already run */
  /* a stage that took the place of an older one (`was`) counts that one's clear */
  const cleared = i => { const st = stages()[i]; return !!((saveData.stages[st.id] || {}).clear || (st.was && (saveData.stages[st.was] || {}).clear)); };
  const unlocked = i => i === 0 || cleared(i - 1) || cleared(i);

  function load3d(i) {
    disposeWorld();
    stageIdx = i;
    world = buildWorld(stages()[i]);
    player = makePlayer(castOf(castId));
    snapCamera();
    acc = 0; last = 0;
    const box = host.querySelector(".adv-3d");
    if (box && R.domElement.parentNode !== box) box.appendChild(R.domElement);
    R.domElement.__w = 0;
  }

  function menu() {
    mode = "menu"; paused = false;
    const ov = host.querySelector(".adv-ov"), list = stages();
    host.querySelector(".adv-hud").classList.remove("on");
    host.classList.remove("playing");
    ov.innerHTML = `
      <div class="adv-menu pop">
        <div class="adv-brand">
          <div class="uma-title adv-kicker">POST PARADE</div>
          <div class="uma-title adv-logo">ADVENTURE 2</div>
        </div>
        <div class="panel adv-panel">
          <div class="panel-hd">${ico("person")}Who runs</div>
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
          <div class="panel-hd adv-hd2">${ico("flag")}Stage</div>
          <div class="adv-stages">
            ${list.map((s, i) => {
              const r = saveData.stages[s.id] || {}, open = unlocked(i), sh = r.shoes || [];
              return `
              <button class="adv-st ${i === stageIdx ? "on" : ""} ${open ? "" : "locked"}" data-st="${i}" ${open ? "" : "disabled"}>
                <span class="adv-n" style="background:var(--w${(i % 8) + 1});${i === 0 || i === 4 ? "color:var(--ink)" : ""}">${i + 1}</span>
                ${s.who ? `<canvas class="adv-st-who" width="36" height="38" data-face="${s.who}" title="${esc(castOf(s.who).name)}'s stage"></canvas>` : ""}
                <span class="adv-st-tx"><b>${esc(s.name)}</b><i>${esc(s.sub)}</i></span>
                ${open ? `
                  <span class="adv-shoes">${[0, 1, 2].map(k => `<em class="${sh[k] ? "got" : ""}">${ico("goldshoe")}</em>`).join("")}</span>
                  <span class="adv-best num">${r.best != null ? fmt(r.best) : "--:--.-"}</span>
                  <span class="adv-grade">${r.grade ? `<b class="g g${r.grade}">${r.grade}</b>` : ""}</span>`
                : `<span class="adv-lock">${ico("lock")}Clear stage ${i} first</span>`}
              </button>`;
            }).join("")}
          </div>
          <div class="adv-go">
            <button class="btn lg" id="advStart">${ico("flag")}Start</button>
            <button class="btn ghost" id="advBack">${ico("back")}Back to the hall</button>
          </div>
          <div class="adv-keys">${TOUCH ? "On screen: the pad moves, crouches and picks a move (Up or Down with Heavy or Special); Jump, Light, Heavy and Special." :
            `<b>&larr; &rarr;</b> run, twice to dash &middot; <b>Space</b> jump, again in the air &middot; <b>Z</b> light &middot; <b>X</b> heavy &middot; <b>C</b> special<br>
             <b>&uarr;</b> or <b>&darr;</b> with <b>X</b> or <b>C</b> for another move &middot; <b>&darr;</b> crouch &middot; <b>&darr; + Space</b> Spin Dash, or drop through &middot; <b>Enter</b> start, and pause<br>
             In the menus: <b>arrows</b> to choose &middot; <b>Z</b> to confirm &middot; <b>X</b> to go back`}</div>
          <div class="adv-credit">Sonic, Tails, Knuckles, Amy, Rouge and Shadow belong to SEGA. Their sprites are from SEGA's Sonic Battle (Game Boy Advance, 2003), ripped by QuadFactor; Knuckles' climbing and the Spin Dash rev, dust and blast effects are from Sonic Advance (2001), ripped by AsuharaMoon. The badniks are from Sonic Advance, Sonic Advance 2 and Sonic Advance 3, ripped by SpitfyaUK and Techokami, Fatazz and SkyLights. All from The Spriters Resource.</div>
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
      load3d(i); music();
    });
    ov.querySelector("#advStart").onclick = () => play();
    ov.querySelector("#advBack").onclick = () => exit();
    autoFocus();
  }
  function music() {
    const T = THEMES[stages()[stageIdx].theme] || THEMES.cape;
    try { if (root.Sound && Sound.play) Sound.play(T.music); } catch (e) {}
  }

  function play() {
    // the stage the menu has standing is fresh: run it; anything already played is built again
    if (world && world.def === stages()[stageIdx] && !world.played) {
      world.group.remove(player.spr); if (player.dust) world.group.remove(player.dust);
      world.t = 0; player = makePlayer(castOf(castId)); snapCamera(); acc = 0; last = 0;
    } else load3d(stageIdx);
    world.played = true;
    mode = "play"; paused = false;
    host.querySelector(".adv-ov").innerHTML = "";
    host.classList.add("playing");
    const st = stages()[stageIdx];
    const hudEl = host.querySelector(".adv-hud");
    hudEl.classList.add("on");
    hudEl.innerHTML = `
      <div class="adv-hl">
        <span class="adv-hearts"></span>
        <span class="adv-car">${ico("carrot")}<b class="num">0</b><i class="num">/${world.total}</i></span>
        <span class="adv-hs"></span>
      </div>
      <div class="adv-air"><i>Air</i><b class="num"></b></div>
      <div class="adv-hr">
        <span class="adv-clock num">0:00.0</span>
        <button class="adv-pause" title="Pause (Esc)" aria-label="Pause">II</button>
      </div>
      <div class="adv-toast"></div>
      <div class="adv-name"><b>${esc(st.name)}</b><i>${esc(st.sub)}</i></div>
      ${TOUCH ? `<div class="adv-pad">
        <div class="adv-pad-l"><button data-t="U" class="up" aria-label="Up">${ico("down")}</button><button data-t="L" aria-label="Left">${ico("back")}</button><button data-t="D" class="dn-k" aria-label="Down">${ico("down")}</button><button data-t="R" aria-label="Right">${ico("next")}</button></div>
        <div class="adv-pad-r"><button data-t="Z">Light</button><button data-t="X">Heavy</button><button data-t="C">Special</button><button data-t="J" class="jp">Jump</button></div>
      </div>` : ""}`;
    hudEl.querySelector(".adv-pause").onclick = () => togglePause();
    hudEl.querySelectorAll("[data-t]").forEach(b => {
      const k = b.dataset.t, on = e => { e.preventDefault(); touch[k] = 1; b.classList.add("dn"); }, off = e => { e.preventDefault(); touch[k] = 0; b.classList.remove("dn"); };
      b.addEventListener("pointerdown", on); b.addEventListener("pointerup", off); b.addEventListener("pointercancel", off); b.addEventListener("pointerleave", off);
    });
    hudCache = {};
    setTimeout(() => { const n = host && host.querySelector(".adv-name"); if (n) n.classList.add("off"); }, 2600);
    music();
  }

  let hudCache = {};
  function hud() {
    const h = host.querySelector(".adv-hud"); if (!h || !player) return;
    const p = player, set = (key, val, fn) => { if (hudCache[key] !== val) { hudCache[key] = val; fn(val); } };
    set("hearts", p.hearts, v => h.querySelector(".adv-hearts").innerHTML = [0, 1, 2].map(i => `<em class="${i < v ? "" : "off"}">${ico("heart")}</em>`).join(""));
    set("car", p.carrots, v => h.querySelector(".adv-car b").textContent = v);
    set("hs", p.shoes.join(), () => h.querySelector(".adv-hs").innerHTML = p.shoes.map(b => `<em class="${b ? "got" : ""}">${ico("goldshoe")}</em>`).join(""));
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
  function flashHud() { const h = host && host.querySelector(".adv-hearts"); if (h) { h.classList.remove("hit"); void h.offsetWidth; h.classList.add("hit"); } }

  function togglePause() {
    if (mode !== "play") return;
    paused = !paused;
    const ov = host.querySelector(".adv-ov");
    if (!paused) { ov.innerHTML = ""; last = 0; return; }
    ov.innerHTML = `
      <div class="panel adv-small pop">
        <div class="panel-hd">${ico("info")}Paused</div>
        <div class="adv-btns">
          <button class="btn" id="advRes">${ico("next")}Keep going</button>
          <button class="btn ghost" id="advRe">Start the stage again</button>
          <button class="btn ghost" id="advQuit">${ico("back")}Stage select</button>
        </div>
      </div>`;
    ov.querySelector("#advRes").onclick = () => togglePause();
    ov.querySelector("#advRe").onclick = () => { paused = false; play(); };
    ov.querySelector("#advQuit").onclick = () => { paused = false; load3d(stageIdx); menu(); };
    autoFocus();
  }

  function results(r) {
    if (!host) return;
    mode = "results";
    host.querySelector(".adv-hud").classList.remove("on");
    const list = stages(), next = stageIdx + 1 < list.length ? stageIdx + 1 : -1;
    const ov = host.querySelector(".adv-ov");
    ov.innerHTML = `
      <div class="panel adv-small adv-res pop">
        <div class="panel-hd gold">${ico("trophy")}${esc(list[stageIdx].name)}: clear</div>
        <div class="adv-board">
          <div class="adv-row"><span>Time</span><b class="num">${fmt(r.time)}</b>${r.best ? `<em>Best</em>` : ""}</div>
          <div class="adv-row"><span>Carrots</span><b class="num">${r.carrots}<i>/${r.total}</i></b></div>
          <div class="adv-row"><span>Golden Horseshoes</span><b class="adv-hs">${r.shoes.map(b => `<em class="${b ? "got" : ""}">${ico("goldshoe")}</em>`).join("")}</b></div>
          <div class="adv-row"><span>Falls</span><b class="num">${r.falls}</b></div>
          <div class="adv-row adv-big"><span>Grade</span><b class="g g${r.grade}">${r.grade}</b></div>
        </div>
        ${r.earned ? `<div class="adv-pay">${ico("carrot")}<b class="num">+${r.earned}</b> carrots to your stable</div>` : ""}
        <div class="adv-btns">
          ${next >= 0 ? `<button class="btn" id="advNext">${ico("next")}Next: ${esc(list[next].name)}</button>` : `<button class="btn" id="advMenu">${ico("flag")}All six cleared</button>`}
          <button class="btn ghost" id="advAgain">Run it again</button>
          <button class="btn ghost" id="advSel">${ico("back")}Stage select</button>
        </div>
      </div>`;
    const go = id => { const b = ov.querySelector(id); return b; };
    if (go("#advNext")) go("#advNext").onclick = () => { stageIdx = next; play(); };
    if (go("#advMenu")) go("#advMenu").onclick = () => { load3d(stageIdx); menu(); };
    setTimeout(autoFocus, 0);
    go("#advAgain").onclick = () => play();
    go("#advSel").onclick = () => { if (next >= 0) stageIdx = next; load3d(stageIdx); menu(); };
  }

  // ---------------------------------------------------------------- open / close
  function open(el, opts) {
    close();
    if (!ensureRenderer()) {
      el.innerHTML = `<div class="scr-wrap"><div class="panel pop"><div class="panel-hd">${ico("info")}No 3D here</div><p style="padding:16px">This browser can't draw the voxels the cabinet needs.</p></div></div>`;
      return false;
    }
    host = el; opts0 = opts || {};
    saveData = load();
    castId = CAST.some(c => c.id === saveData.cast) ? saveData.cast : "sonic";
    const list = stages();
    if (!list.length) return false;
    stageIdx = 0;
    for (let i = list.length - 1; i >= 0; i--) if (unlocked(i)) { stageIdx = i; break; }
    if ((saveData.stages[list[stageIdx].id] || {}).clear && stageIdx + 1 < list.length && unlocked(stageIdx + 1)) stageIdx++;
    el.innerHTML = `<div class="adv"><div class="adv-3d"></div><div class="adv-hud"></div><div class="adv-ov"></div></div>`;
    host = el.querySelector(".adv");
    host.addEventListener("pointerdown", () => { kbUsed = false; if (kbFocus) kbFocus.classList.remove("kb"); kbFocus = null; });
    load3d(stageIdx);
    menu(); music();
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
    disposeWorld(); player = null;
    if (R && R.domElement.parentNode) R.domElement.parentNode.removeChild(R.domElement);
    host = null;
  }

  root.Adventure = { ok: true, open, close, CAST, THEMES,
    _debug: { get world() { return world; }, get player() { return player; }, step: (s, n) => { for (let k = 0; k < (n || 1); k++) { readInput(); step(s); worldStep(s); input.jp = input.zp = input.xp = input.cp = 0; } },
              play: (i, id) => { if (id) castId = id; if (i != null) stageIdx = i; play(); }, draw: dt => draw(dt || 1 / 60), input, keys, touch, parse } };
})(typeof globalThis !== "undefined" ? globalThis : this);
