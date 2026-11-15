/*
 * Post Parade Adventure 2 -- the arcade cabinet in the hall.
 *
 * A side-on platformer in the race's own voxels: the same mesher, the same racers, the
 * same light, seen from the side -- Sonic excepted, who is his own 2D sprites from Sonic
 * Battle (below, SONIC_SPRITES). Three can play: Gold Ship, and the academy's two guests
 * (guests.js), Sonic and Hatsune Miku. Six stages run left to right to a winning post, each
 * a place with its own ground and weather -- grass hills behind the academy, a river, a
 * quarry of red rock, the summer camp by the sea, a snowfield in Hokkaido, and Nakayama's
 * jump course at night -- with platforms, water, springs, hurdles, things to collect and
 * things in the way.
 *
 * Each runner plays the way her canon says she would:
 *   Gold Ship  her dropkick (the greeting the academy knows her for) smashes cracked rock,
 *              crates and hurdles, and anything in the way; once on the ground, once in
 *              the air. The highest jump of the three: she is a big stayer.
 *   Sonic      the fastest by a distance. Jumping, he is a spinning ball that hurts what it
 *              touches. Hold the move on the ground to rev a Spin Dash (Sonic 2) and let go
 *              to blast off; in the air it is a Homing Attack (Sonic Adventure) at the
 *              nearest thing to hit. He cannot swim -- he sinks like a rock, walks the bottom,
 *              and has to find air bubbles before his breath runs out.
 *   Miku       light on her feet: a second jump in mid-air, and holding jump spreads her
 *              knee-length twin tails to glide. Her move is a note, sung, that flies ahead
 *              and breaks what it hits.
 *
 * Stages are drawn as text in adventure-stages.js: a 16-row grid of one-metre tiles, read
 * left to right. The legend is there. Clearing a stage opens the next; each hides three
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
  const { Vox, meshVox, makeRacer, pose, mulC, mixC, mulberry32 } = V.kit;
  const PI = Math.PI;
  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  const lerp = (a, b, k) => a + (b - a) * k;
  const sgn = v => v < 0 ? -1 : v > 0 ? 1 : 0;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ico = (n, s) => (root.Icon ? root.Icon(n, s) : "");
  const LOW_POWER = !!(root.matchMedia && matchMedia("(pointer:coarse)").matches) || (navigator.hardwareConcurrency || 8) <= 4;
  const TOUCH = !!(root.matchMedia && matchMedia("(pointer:coarse)").matches);

  // ---------------------------------------------------------------- the three
  /* Speeds in metres a second, gravity 34 m/s^2: a 12.4 jump clears two metres; a spring
     throws anyone about six and a half. */
  const CAST = [
    { id: "goldship", look: "Gold Ship", name: "Gold Ship", roster: "goldship",
      w: 0.62, h: 1.72, run: 11.5, accel: 15, airAccel: 11, jump: 13.1, swim: true,
      move: "kick", moveName: "Dropkick",
      grades: { Speed: "B", Jump: "A", Air: "C", Water: "B" },
      text: "Her dropkick smashes cracked rock, crates and hurdles, and anything in her way, once on the ground and once in the air. The highest jump of the three." },
    { id: "sonic", look: "Sonic", name: "Sonic", roster: "sonic", sprite: true,
      w: 0.56, h: 1.02, run: 14.6, accel: 22, airAccel: 14, jump: 12.4, swim: false, sinks: true,
      move: "spin", moveName: "Spin Dash",
      grades: { Speed: "S", Jump: "B", Air: "B", Water: "G" },
      text: "Hold the move to rev a Spin Dash, let go to blast off; in the air, a Homing Attack. He can't swim: under water he walks the bottom and needs air bubbles." },
    { id: "miku", look: "Hatsune Miku", name: "Hatsune Miku", roster: "miku",
      w: 0.58, h: 1.6, run: 10.8, accel: 17, airAccel: 13, jump: 12.4, swim: true, double: true, glide: true,
      move: "sing", moveName: "Sing",
      grades: { Speed: "C", Jump: "A", Air: "S", Water: "A" },
      text: "A second jump in mid-air, and hold jump to glide on her twin tails. Her song flies ahead and breaks whatever it hits." },
  ];
  const castOf = id => CAST.find(c => c.id === id) || CAST[0];

  // ---------------------------------------------------------------- Sonic, in 2D
  /* Here Sonic is not a voxel model: he is his own sprites from Sonic Battle (Game Boy
     Advance), ripped by QuadFactor (The Spriters Resource); the sprites are SEGA's and Sonic
     Team's. tools/pack-sonic-battle.py cuts the frames he uses out of the sheet into
     assets/guests/sonic-battle.png and prints this table: each frame [x, y, w, h, the
     column of his head's centre], anchored at his feet. He stands in the voxel world as a
     flat card with crisp pixels, facing the way he runs, casting a shadow of his shape. */
  const SONIC_SPRITES = { w: 256, h: 512, f: {"idle":[[1,1,22,32,10.9],[24,1,22,34,10.8],[47,1,24,35,11.5],[72,1,24,35,11.3],[97,1,26,32,11.3],[124,1,24,31,11.6]],"run":[[149,1,31,32,16.0],[181,1,30,32,16.3],[212,1,23,34,11.6],[1,37,28,35,15.3],[30,37,30,33,15.0],[61,37,28,33,15.4],[90,37,23,34,11.6],[114,37,28,35,16.3]],"start":[[143,37,24,33,12.2]],"skid":[[168,37,26,34,10.9],[195,37,35,34,17.9],[1,73,35,35,19.0],[37,73,25,34,10.7]],"jump":[[63,73,22,40,11.3],[86,73,22,40,10.8],[109,73,24,36,12.5],[134,73,23,34,12.2],[158,73,22,31,11.3]],"fall":[[181,73,25,34,10.2],[207,73,30,36,14.3],[1,114,35,39,21.0],[37,114,35,40,20.5]],"land":[[73,114,27,30,14.7],[101,114,26,30,15.5],[128,114,22,30,12.6]],"dash":[[151,114,25,33,13.1],[177,114,30,32,17.1],[208,114,30,32,16.5],[1,155,24,34,10.6],[26,155,31,34,13.4],[58,155,35,29,17.3],[94,155,34,29,17.4]],"ball":[[129,155,26,26,12.9],[156,155,24,24,12.0],[181,155,24,24,12.1],[206,155,24,24,12.0]],"rev":[[231,155,22,22,13.2],[1,190,21,23,12.4],[23,190,22,23,12.6],[46,190,20,22,11.8]],"hit":[[67,190,34,34,15.8],[102,190,31,32,13.0],[134,190,25,32,10.8]],"out":[[160,190,27,35,15.8],[188,190,29,36,18.3],[218,190,23,39,11.2],[1,230,26,39,11.7]]} };
  const SPRITE_URL = "assets/guests/sonic-battle.png";
  const SPRITE_PX = 1.1 / 33;                       // metres to a sprite pixel: his idle is 33 tall, about 1.1m
  let SPRITE_TEX = null, ATLAS_IMG = null;
  function spriteTexture() {
    if (SPRITE_TEX) return SPRITE_TEX;
    SPRITE_TEX = new THREE.TextureLoader().load(SPRITE_URL);
    SPRITE_TEX.magFilter = SPRITE_TEX.minFilter = THREE.NearestFilter;
    SPRITE_TEX.generateMipmaps = false;
    return SPRITE_TEX;
  }
  function makeSprite(T) {
    const tex = spriteTexture(), geo = new THREE.PlaneGeometry(1, 1);
    geo.translate(0, 0.5, 0);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, color: T.tint || 0xffffff }));
    mesh.castShadow = true;
    mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5, side: THREE.DoubleSide });
    mesh.userData.anim = { name: null, t: 0 };
    return mesh;
  }
  /** Show frame `t` seconds into animation `name`, his feet at (x, y), facing `face`. */
  function spriteFrame(mesh, name, t, fps, loop, face, x, y) {
    const list = SONIC_SPRITES.f[name];
    let i = Math.floor(t * fps);
    i = loop ? i % list.length : Math.min(i, list.length - 1);
    const [fx, fy, fw, fh, cx] = list[i], A = SONIC_SPRITES, tex = mesh.material.map;
    tex.repeat.set(fw / A.w, fh / A.h);
    tex.offset.set(fx / A.w, 1 - (fy + fh) / A.h);
    mesh.scale.set(fw * SPRITE_PX * face, fh * SPRITE_PX, 1);
    mesh.position.set(x + (fw / 2 - cx) * SPRITE_PX * face, y, 0.06);
  }
  /** His frames, from what he is doing. */
  function drawSprite(p, dt) {
    const s = p.spr, a = s.userData.anim, sp = Math.abs(p.vx);
    p.landT = Math.max(0, (p.landT || 0) - dt); p.dashT = Math.max(0, (p.dashT || 0) - dt);
    let name, fps = 10, loop = true, face = p.face;
    if (p.dead) { name = "out"; fps = 8; loop = false; }
    else if (p.state === "hurt" || p.state === "stumble") { name = "hit"; fps = 12; loop = false; }
    else if (p.state === "charge") { name = "rev"; fps = 14 + p.rev * 22; }
    else if (p.state === "roll" || p.state === "homing" || (p.curl && !p.ground)) { name = "ball"; fps = p.state === "homing" ? 30 : 12 + sp * 1.4; }
    else if (!p.ground) {
      if (p.dashT > 0) { name = "dash"; fps = 18; loop = false; }
      else { name = p.vy > 0 ? "jump" : "fall"; loop = false; }
    }
    else if (p.landT > 0) { name = "land"; fps = 22; loop = false; }
    else if (sp < 0.6) { name = "idle"; fps = 7; }
    else if (sp > 4 && (input.R - input.L) && sgn(input.R - input.L) !== sgn(p.vx)) { name = "skid"; fps = 12; loop = false; face = sgn(p.vx); }
    else if (sp < 2.2) name = "start";
    else { name = "run"; fps = 5 + sp * 1.15; }
    if (a.name !== name) { a.name = name; a.t = 0; } else a.t += dt;
    spriteFrame(s, name, a.t, fps, loop, face, p.x, p.y);
    s.visible = !(p.inv > 0 && !p.dead && Math.sin(world.t * 40) > 0.4);
  }
  /* His card in the cabinet's menu: the idle, drawn twice size with crisp pixels. */
  function paintCard(cv, i) {
    if (!ATLAS_IMG) { ATLAS_IMG = new Image(); ATLAS_IMG.src = SPRITE_URL; }
    const go = () => {
      const g = cv.getContext("2d"), f = SONIC_SPRITES.f.idle[i % 6], k = 2;
      g.clearRect(0, 0, cv.width, cv.height); g.imageSmoothingEnabled = false;
      g.drawImage(ATLAS_IMG, f[0], f[1], f[2], f[3], Math.round(cv.width / 2 - f[4] * k), cv.height - f[3] * k - 6, f[2] * k, f[3] * k);
    };
    if (ATLAS_IMG.complete && ATLAS_IMG.naturalWidth) go(); else ATLAS_IMG.addEventListener("load", go, { once: true });
  }
  let card = null;

  // ---------------------------------------------------------------- the six places
  /* Each stage names a theme: its sky, its light, what its ground is made of, and who lives
     there. Colours are the lobby's and the race's own family. */
  const THEMES = {
    hills: {
      sky: [0x5aa6e6, 0xdcefF4], fog: [0xd8eaf0, 45, 160], sun: [0xfff2da, 0.85, [14, 30, 20]], hemi: [0xfff8ea, 0x9ab07a, 0.62],
      top: [0x5fae3e, 0x6cbf47, 0x52a038], drip: 0x4f9a36, soil: [0x8a5a36, 0x7a4e2e, 0x9a6a42], deep: 0x5e3c24,
      block: [0xe8e0cc, 0xd8cdb2], plank: 0xb07a44, water: 0x3a9ad8, crack: 0x8e8c94, back: 0x4a3424,
      tufts: [0x7ccf52, 0x8ad35a], flowers: [0xffffff, 0xf2d040, 0xf08ac0], rail: true,
      roller: "hay", bird: "crow", walker: "beetle", far: "hills", music: "track" },
    river: {
      sky: [0x4a9ae0, 0xe6f2f2], fog: [0xd6e8e6, 40, 150], sun: [0xfff6e2, 0.8, [10, 30, 22]], hemi: [0xf6fff0, 0x7a9a6a, 0.66],
      top: [0x4f9e3a, 0x5aaa42, 0x468e34], drip: 0x3f8a30, soil: [0x6e5038, 0x7a5a40, 0x625040], deep: 0x46362a,
      block: [0x9a9a96, 0x86888a], plank: 0x8a5a30, water: 0x2f8ac8, crack: 0x7a7a80, back: 0x3a3028,
      tufts: [0x6cbf47, 0x5aaa42], flowers: [0xffffff, 0x9ad0f0], rail: false,
      roller: "log", bird: "crow", walker: "beetle", far: "forest", music: "friends" },
    quarry: {
      sky: [0x3a5aa0, 0xf2a868], fog: [0xe8b080, 40, 150], sun: [0xffc890, 0.95, [-18, 18, 20]], hemi: [0xffe0c0, 0x8a5a40, 0.6],
      top: [0xb07a4a, 0xbc8654, 0xa46e40], drip: 0x9a6038, soil: [0xa8502e, 0xc06a3a, 0x8a3e24], deep: 0x6a2e1a,
      block: [0xd8a86a, 0xc8945a], plank: 0x9a6a3a, water: 0x5a8a7a, crack: 0x8a6a50, back: 0x4a2418,
      tufts: [0xc89a5a], flowers: [], rail: false,
      roller: "boulder", bird: "crow", walker: "beetle", far: "mesas", music: "idea", tint: 0xffe4c8 },
    beach: {
      sky: [0x3a9cf0, 0xe8f6fa], fog: [0xdff0f6, 50, 170], sun: [0xfff6e0, 0.95, [8, 34, 22]], hemi: [0xffffff, 0xd8c890, 0.62],
      top: [0xf0dca0, 0xe8d290, 0xf4e4b0], drip: 0xe0cc8a, soil: [0xdcc488, 0xd0b878, 0xe4cc90], deep: 0xb89a62,
      block: [0xc89a5a, 0xb88a4a], plank: 0xe8dcc0, water: 0x22aed8, crack: 0xb8a888, back: 0x9a8058,
      tufts: [0x8ac860], flowers: [0xf6f2e8], rail: false,
      roller: "ball", bird: "gull", walker: "crab", far: "sea", music: "friends" },
    snow: {
      sky: [0x8aa8cc, 0xe8eef4], fog: [0xe2eaf2, 30, 120], sun: [0xeef2ff, 0.55, [12, 26, 24]], hemi: [0xf4f8ff, 0xb8c4d0, 0.78],
      top: [0xf4f8fc, 0xe6eef6, 0xfafcff], drip: 0xe0eaf4, soil: [0x6a5a5a, 0x5e5050, 0x746262], deep: 0x463a3a,
      block: [0xd8e0e8, 0xc6d0dc], plank: 0x8a6a4a, water: 0x4a7aa8, crack: 0x9aa4b0, back: 0x3a3236,
      tufts: [0xffffff], flowers: [], rail: false, snowfall: true,
      roller: "snowball", bird: "crow", walker: "penguin", far: "snow", music: "night", tint: 0xeef2fa },
    night: {
      sky: [0x070c22, 0x24305a], fog: [0x1a2240, 40, 160], sun: [0xc8d4ff, 0.45, [6, 30, 24]], hemi: [0xb8c8ff, 0x2a2a3a, 0.5],
      top: [0x3a8a3a, 0x449a42, 0x347e34], drip: 0x2f7430, soil: [0x5a4030, 0x4e382a, 0x664834], deep: 0x2e2018,
      block: [0x8a8a96, 0x7a7a86], plank: 0xc8c8d0, water: 0x2a5a8a, crack: 0x6a6a74, back: 0x22181a,
      tufts: [0x5ab84a], flowers: [], rail: true, stars: true,
      roller: "hay", bird: "owl", walker: "beetle", far: "stands", music: "finale", tint: 0xb8c0d8 },
  };

  // ---------------------------------------------------------------- reading a stage
  const H = 16;
  const SOLIDS = "#=XBImC";
  const ENTS = "PGKc*JHS>rbkhMVUOT^";
  function parse(def) {
    const rows = Array.from({ length: H }, () => []);
    for (const raw of def.chunks) {
      const lines = raw.split("\n");
      while (lines.length && !lines[0].trim()) lines.shift();
      while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
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
    return { W, grid, ents };
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
      snow: new THREE.MeshLambertMaterial({ color: 0xd8e6f2 }),
      cube: new THREE.MeshLambertMaterial({ color: 0xffffff }),
    };
    return MAT;
  }
  const jit = (rnd, c, a) => mulC(c, 1 - a + rnd() * a * 2);
  const pick = (rnd, a) => a[Math.floor(rnd() * a.length) % a.length];

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
        const z0 = surface ? ZDEEP : buried ? ZF - 2 : ZB;
        // how deep this tile is under the surface, for the soil's bands
        let depth = 0; while (depth < 5 && solidish(g(i, j + depth + 1))) depth++;
        for (let sx = 0; sx < 4; sx++) for (let sy = 0; sy < 4; sy++) {
          if (c === "/" && sy > sx) continue;
          if (c === "\\" && sy > 3 - sx) continue;
          const topHere = (c === "/" ? sy === sx : c === "\\" ? sy === 3 - sx : sy === 3);
          for (let z = (c === "/" || c === "\\") ? ZDEEP : z0; z <= ZF; z++) {
            let col;
            if (c === "=") {
              const edge = sx === 0 || sy === 0 || (z === ZF && (sx === 3 || sy === 3));
              col = edge ? mulC(T.block[1], 0.9) : jit(rnd, pick(rnd, T.block), 0.05);
            } else if (c === "I") {
              col = ((sx + sy + z) % 5 === 0) ? 0xf4fcff : jit(rnd, 0xbfe2f2, 0.04);
            } else if (c === "m" && topHere && open) {
              col = rnd() < 0.18 ? 0x8a6a48 : jit(rnd, 0x5e4028, 0.06);                 // wet, with a shine on it
            } else if (c === "m" && sy === 2 && z === ZF) {
              col = jit(rnd, 0x6a4a30, 0.06);
            } else if ((topHere && (open || c !== "#")) && !wet) {
              col = jit(rnd, pick(rnd, T.top), 0.06);
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
        // the white inside rail of a racecourse, along the back of the ground
        if (T.rail && open && c === "#") {
          for (let sx = 0; sx < 4; sx++) v.set(lx + sx, ly + 8, ZDEEP + 1, 0xf6f6f2);
          if (i % 2 === 0) for (let y = 4; y < 8; y++) v.set(lx, ly + y, ZDEEP + 1, 0xf0f0ec);
        }
        continue;
      }
      if (c === "-") {
        for (let sx = 0; sx < 4; sx++) for (let z = ZB; z <= ZF; z++) v.set(lx + sx, ly + 3, z, jit(rnd, ((z & 3) === 0) ? mulC(T.plank, 0.8) : T.plank, 0.05));
        if (i % 3 === 0) for (const z of [ZB + 1, ZF - 1]) v.set(lx + 1, ly + 2, z, mulC(T.plank, 0.75));
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
        if (roofed) for (let sx = 0; sx < 4; sx++) for (let sy = 0; sy < 4; sy++) v.set(lx + sx, ly + sy, ZB, jit(rnd, T.back, 0.08));
      }
    }
    const out = [];
    if (v.m.size) { const m = new THREE.Mesh(meshVox(v, GR), materials().vox); m.position.x = i0; m.receiveShadow = true; m.castShadow = true; out.push(m); }
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
      case "hurdle": g = vox(v => {                    // a brush hurdle: green brush in a white frame
        v.box(-3, 0, -18, 3, 1, 18, 0xf6f6f2);
        for (let z = -16; z <= 16; z++) for (let y = 2; y < 15; y++) for (let x = -2; x <= 2; x++) {
          if (y > 12 && ((z + x * 3) & 3) === 0) continue;
          v.set(x, y, z, ((x + y + z) % 4 === 0) ? 0x2a6a2a : ((y * 3 + z) % 5 === 0 ? 0x4a9a3a : 0x3a7e32));
        }
        for (const z of [-18, 18]) v.box(-3, 0, z, 3, 15, z, 0xf6f6f2);
        v.box(-3, 15, -18, 3, 15, 18, 0xf6f6f2);
      }); break;
      case "vent": g = vox(v => { v.box(-5, 0, -5, 4, 2, 4, 0x6a7078); v.box(-3, 2, -3, 2, 3, 2, 0x2a2e34); }); break;
      case "note": g = vox(v => {                      // a sung note: a quaver in her colour
        v.box(-2, 0, -1, 1, 2, 0, 0x39c5bb); v.box(1, 2, -1, 1, 9, 0, 0x39c5bb); v.box(2, 7, -1, 3, 9, 0, 0x39c5bb); v.box(3, 5, -1, 3, 6, 0, 0x39c5bb);
        v.set(-2, 2, 1, 0xe8fffc);
      }); break;
      case "bubble": g = vox(v => {
        for (let x = -4; x <= 4; x++) for (let y = -4; y <= 4; y++) for (let z = -4; z <= 4; z++) {
          const d = Math.hypot(x, y, z);
          if (d < 4.4 && d > 3.2) v.set(x, y, z, (x < -1 && y > 1) ? 0xffffff : 0xbfeaff);
        }
      }); break;
      case "ball": g = vox(v => {                      // Sonic, curled up
        for (let x = -7; x <= 7; x++) for (let y = -7; y <= 7; y++) for (let z = -6; z <= 6; z++) {
          const d = Math.hypot(x, y, z * 1.1);
          if (d > 7.2) continue;
          let c = ((x + y * 2 + z) % 5 === 0) ? 0x1a4ab0 : 0x1f56c8;
          if (Math.abs(y) < 2 && x > 3) c = 0xf2c88a;
          v.set(x, y, z, c);
        }
        for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2; v.box(Math.round(Math.cos(a) * 8), Math.round(Math.sin(a) * 8), -2, Math.round(Math.cos(a) * 8), Math.round(Math.sin(a) * 8), 1, 0x1a4ab0); }
      }); break;
      case "tree": g = vox(v => {
        v.box(-2, 0, -2, 1, 26, 1, 0x7a4e2e);
        const L = T.id === "snow" ? [0x2a5a3a, 0xf4f8fc] : T.id === "quarry" ? [0x6a7a3a, 0x7a8a42] : [0x3f8a34, 0x5aaa42];
        if (T.id === "snow") {
          for (let y = 10; y < 44; y++) { const r = Math.round((44 - y) / 3); v.box(-r, y, -r, r, y, r, y % 6 < 2 ? L[1] : L[0]); }
        } else if (T.id === "beach") {
          for (let k = 0; k < 5; k++) { const a = k / 5 * PI * 2; for (let s = 0; s < 12; s++) v.set(Math.round(Math.cos(a) * s), 34 - Math.round(s * s / 18), Math.round(Math.sin(a) * s), s % 3 ? 0x4aa83a : 0x3a8a2a); }
          v.box(-2, 26, -2, 1, 34, 1, 0x9a6a3a);
        } else {
          for (let x = -10; x <= 10; x++) for (let y = 18; y <= 40; y++) for (let z = -10; z <= 10; z++) {
            if (Math.hypot(x, (y - 29) * 0.95, z) > 10.5) continue;
            v.set(x, y, z, ((x * 3 + y + z * 5) % 7 === 0) ? L[1] : L[0]);
          }
        }
      }, 1 / 12); break;
    }
    return (PROPS[key] = g);
  }

  /* Who lives where: the roller (a hay bale, a log, a boulder, a beach ball, a snowball),
     the flyer (a crow, a gull, an owl) and the walker (a beetle, a crab, a penguin). */
  function enemyGeo(kind) {
    const key = "enemy:" + kind;
    if (PROPS[key]) return PROPS[key];
    let g;
    if (["hay", "log", "boulder", "ball", "snowball"].includes(kind)) {
      const C = { hay: [0xe8c060, 0xc8a040], log: [0x8a5a30, 0xc89a60], boulder: [0x9a7a62, 0x7a5a44],
                  ball: [0xf6f6f6, 0xe8403a], snowball: [0xf6f8fc, 0xd8e4f0] }[kind];
      g = vox(v => {
        for (let x = -7; x <= 7; x++) for (let y = -7; y <= 7; y++) for (let z = -6; z <= 6; z++) {
          const round = kind === "hay" || kind === "log" ? Math.hypot(x, y) : Math.hypot(x, y, z);
          if (round > 7.3) continue;
          let c = ((x + y) & 3) === 0 ? C[1] : C[0];
          if (kind === "log" && Math.abs(z) === 6) c = Math.round(Math.hypot(x, y)) % 3 === 0 ? 0x6a4020 : 0xc89a60;
          if (kind === "hay" && Math.abs(z) < 2 && Math.abs(Math.hypot(x, y) - 7) < 0.8) c = 0x8a3a2a;
          if (kind === "ball") c = (Math.atan2(y, x) * 3 / PI + 3) % 2 < 1 ? 0xf6f6f6 : (z > 0 ? 0xe8403a : 0x3a7ae0);
          v.set(x, y, z, c);
        }
        if (kind === "boulder" || kind === "snowball") { v.box(-3, 2, 6, -2, 3, 6, 0x22222a); v.box(2, 2, 6, 3, 3, 6, 0x22222a); }
      });
    } else if (["crow", "gull", "owl"].includes(kind)) {
      const C = { crow: [0x26262e, 0x3a3a46, 0xf2c040], gull: [0xf6f6f6, 0xb8bcc4, 0xf2b020], owl: [0x8a6a4a, 0xc8a87a, 0xf2d040] }[kind];
      g = {
        body: vox(v => { v.box(-4, -3, -3, 4, 3, 3, C[0]); v.box(3, 0, -2, 7, 5, 2, C[0]); v.box(8, 2, -1, 9, 3, 0, C[2]);
                         v.set(6, 4, 2, 0xffffff); v.set(6, 4, -3, 0xffffff); v.box(-7, -1, -2, -5, 1, 1, C[1]); }),
        wing: vox(v => { for (let z = 0; z < 9; z++) v.box(-3 + Math.floor(z / 3), 0, z, 3 - Math.floor(z / 4), 0, z, z > 6 ? C[1] : C[0]); }),
      };
    } else {
      g = vox(v => {
        if (kind === "crab") {
          v.box(-6, 2, -4, 5, 6, 3, 0xe0503a); v.box(-4, 7, -3, 3, 7, 2, 0xf06a50);
          for (const z of [-6, 5]) for (let x = -5; x <= 4; x += 3) v.box(x, 0, z, x, 2, z, 0xc0402a);
          v.box(5, 4, -6, 9, 7, -5, 0xe0503a); v.box(5, 4, 4, 9, 7, 5, 0xe0503a);
          v.box(2, 8, -2, 2, 10, -2, 0x22222a); v.box(2, 8, 1, 2, 10, 1, 0x22222a);
        } else if (kind === "penguin") {
          v.box(-4, 0, -4, 3, 13, 3, 0x22222a); v.box(-1, 1, 3, 3, 11, 3, 0xf6f6f6); v.box(3, 1, -3, 3, 11, 2, 0xf6f6f6);
          v.box(4, 9, -1, 5, 10, 0, 0xf2a020); v.set(3, 12, 2, 0xffffff); v.set(3, 12, -3, 0xffffff);
          v.box(0, -1, -3, 3, 0, -1, 0xf2a020); v.box(0, -1, 0, 3, 0, 2, 0xf2a020);
        } else {                                      // a stag beetle
          v.box(-6, 2, -4, 4, 6, 3, 0x2a2238); v.box(-5, 7, -3, 3, 7, 2, 0x4a3a62);
          v.box(5, 3, -2, 7, 5, 1, 0x2a2238); v.box(8, 4, -3, 11, 5, -3, 0x5a4a2a); v.box(8, 4, 2, 11, 5, 2, 0x5a4a2a);
          for (const z of [-5, 4]) for (let x = -4; x <= 2; x += 3) v.box(x, 0, z, x, 2, z, 0x1a1626);
        }
      });
    }
    return (PROPS[key] = g);
  }

  // ---------------------------------------------------------------- far away
  /* What stands behind each stage, built coarse and set back so the perspective camera
     gives it parallax for free. */
  function buildFar(T, W, rnd, group) {
    const M = materials();
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
      case "hills":
        band(2, -70, -60, 9, 5, 0.03, [0x8ab0c8, 0x9cc0d4], 3);
        band(1, -34, -26, 5, 2.5, 0.07, [0x5c9a3e, 0x6aaa48], 7);
        band(1, -18, -14, 3, 1.2, 0.11, [0x4f9236, 0x5fa840], 11);
        trees(-15, Math.round(W / 9), 3);
        academy(group, W * 0.5, -50);
        break;
      case "forest":
        band(2, -80, -66, 16, 7, 0.025, [0x7a98b8, 0x8aa8c8], 5);
        band(1, -36, -26, 8, 3, 0.06, [0x2f6a34, 0x3a7a3e], 9);
        band(1, -18, -14, 4, 1.5, 0.12, [0x3a7a36, 0x468a40], 13);
        trees(-15, Math.round(W / 6), 4); trees(-26, Math.round(W / 8), 7);
        for (let x = 40; x < W; x += 70) waterfall(group, x, -25);
        break;
      case "mesas": {
        /* buttes, flat-topped and striped, in three ranks going back into the dusk */
        for (let k = 0; k < 3; k++) {
          const v = new Vox(), r = mulberry32(21 + k);
          const z0 = [-30, -55, -95][k], g = [1, 2, 3][k];
          for (let x = 0; x < (W + 120) / g; x++) {
            const X = x * g, up = Math.sin(X * [0.07, 0.045, 0.03][k] + k * 2) > 0.35;
            const h = Math.round(([1.5, 3, 6][k] + (up ? [5, 10, 18][k] : 0)) / g);
            for (let y = 0; y < h; y++) for (let z = 0; z < 4; z++)
              v.set(x, y, z, jit(r, (y % 3 === 0) ? 0xb8603a : (y % 3 === 1 ? 0xc87444 : 0xa8502e), 0.04));
          }
          const m = new THREE.Mesh(meshVox(v, g), M.vox); m.position.set(-60, 0, z0); group.add(m);
        }
        break;
      }
      case "sea": {
        const sea = new THREE.Mesh(new THREE.PlaneGeometry(W + 900, 600), new THREE.MeshLambertMaterial({ color: 0x2a8ac8 }));
        sea.rotation.x = -PI / 2; sea.position.set(W / 2, 1.6, -310); group.add(sea);
        band(2, -160, -150, 6, 4, 0.04, [0x6a9a6a, 0x7aaa7a], 17);
        trees(-6, Math.round(W / 14), 4);
        lighthouse(group, W - 14, -12);
        break;
      }
      case "snow":
        band(2, -80, -64, 22, 9, 0.03, [0xc8d4e4, 0xf4f8fc], 19);
        band(1, -34, -26, 8, 3, 0.07, [0xe6eef6, 0xffffff], 23);
        trees(-15, Math.round(W / 7), 4); trees(-24, Math.round(W / 9), 6);
        snowMiku(group, W * 0.55, -20);
        break;
      case "stands":
        stands(group, W);
        break;
    }
    // a clear night: stars, far off, past the fog
    if (T.stars) {
      const n = 420, pos = new Float32Array(n * 3);
      for (let k = 0; k < n; k++) { pos[k * 3] = Math.random() * (W + 400) - 200; pos[k * 3 + 1] = 25 + Math.random() * 140; pos[k * 3 + 2] = -260 - Math.random() * 40; }
      const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      group.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, fog: false, transparent: true, opacity: 0.85 })));
    }
  }
  function academy(group, x, z) {                     // Tracen Academy, far off: cream walls, a clock tower
    const v = new Vox();
    v.box(-30, 0, 0, 30, 10, 6, 0xeee6d2); v.box(-30, 11, 0, 30, 12, 6, 0x3a5a8a);
    for (let wx = -28; wx <= 28; wx += 4) for (const wy of [3, 7]) v.box(wx, wy, 7, wx + 1, wy + 1, 7, 0x9ab8d8);
    v.box(-5, 0, -1, 4, 24, 7, 0xf2ead8); v.box(-6, 25, -2, 5, 26, 8, 0x3a5a8a); v.box(-3, 27, 0, 2, 30, 5, 0x3a5a8a);
    v.box(-2, 17, 8, 1, 20, 8, 0xf6f6f2); v.set(0, 19, 9, 0x2a2a30); v.set(0, 18, 9, 0x2a2a30);
    const m = new THREE.Mesh(meshVox(v, 0.5), materials().vox); m.position.set(x, 2, z); group.add(m);
  }
  function waterfall(group, x, z) {
    const v = new Vox(), r = mulberry32(x | 0);
    v.box(-6, 0, 0, 6, 24, 4, 0x6a6a66);
    for (let y = 0; y < 24; y++) for (let k = -2; k <= 2; k++) v.set(k, y, 5, r() < 0.3 ? 0xffffff : 0x9ad4f4);
    v.box(-4, 0, 6, 4, 1, 9, 0xd8f0fc);
    const m = new THREE.Mesh(meshVox(v, 0.5), materials().vox); m.position.set(x, 0, z); group.add(m);
  }
  function lighthouse(group, x, z) {
    const v = new Vox();
    for (let y = 0; y < 30; y++) { const r = 3 - Math.floor(y / 12); v.box(-r, y, -r, r, y, r, Math.floor(y / 5) % 2 ? 0xd8303a : 0xf6f6f2); }
    v.box(-2, 30, -2, 2, 33, 2, 0xfff2a0); v.box(-3, 34, -3, 3, 35, 3, 0x2a2a30);
    const m = new THREE.Mesh(meshVox(v, 0.5), materials().vox); m.position.set(x, 2, z); group.add(m);
  }
  /* SNOW MIKU: the Sapporo Snow Festival has had a Miku of its own since 2010, first as a
     snow sculpture. Here she is one, on the far slope. */
  function snowMiku(group, x, z) {
    const m = makeRacer("Hatsune Miku");
    m.root.traverse(o => { if (o.isMesh) { o.material = materials().snow; o.userData.keep = true; } });
    // up on a mound of packed snow, so she stands clear of the slopes in front of her
    m.root.scale.setScalar(4.6); m.root.position.set(x, 9.5, z); m.root.rotation.y = 0.3;
    m.armR.rotation.z = 2.4; m.armL.rotation.z = -0.3;
    const base = new THREE.Mesh(vox(v => {
      for (let y = 0; y < 19; y++) { const r = 34 - y; v.box(-r, y, -14, r, y, 14, y === 18 ? 0xf4f8fc : (y % 4 === 0 ? 0xd2dce8 : 0xe2eaf2)); }
    }, 1 / 2), materials().vox);
    base.position.set(x, 0, z); group.add(base, m.root);
  }
  /* Nakayama at night: the grandstand lit up behind the course, floodlight towers, a crowd. */
  function stands(group, W) {
    const r = mulberry32(5);
    for (let seg = 0; seg * 200 < W + 80; seg++) {
    const v = new Vox();
    for (let x = 0; x < 400; x++) {
      for (let tier = 0; tier < 7; tier++) for (let d = 0; d < 3; d++) v.set(x, tier * 2, -tier * 2 - d, tier % 2 ? 0x5a5e6a : 0x4a4e5a);
      for (let tier = 0; tier < 7; tier++) if (r() < 0.6) v.set(x, tier * 2 + 1, -tier * 2 - 1, pick(r, [0xd8303a, 0xf2d040, 0x3a7ae0, 0xf6f6f2, 0x5ab84a, 0xf08ac0, 0x2a2a30]));
      v.set(x, 16, -16, 0x2a2e3a); v.set(x, 17, -15, 0x2a2e3a);
      if (x % 6 === 0) v.set(x, 15, -14, 0xfff2c0);
    }
    const m = new THREE.Mesh(meshVox(v, 0.5), materials().vox); m.position.set(-40 + seg * 200, 0, -62); group.add(m);
    }
    for (let x = 10; x < W; x += 48) {
      const t = new THREE.Mesh(vox(w => { w.box(-1, 0, -1, 0, 60, 0, 0x8a8e9a); w.box(-6, 60, -1, 5, 66, 0, 0x3a3e4a); w.box(-5, 61, 0, 4, 65, 0, 0xfffbe0); }, 0.5), materials().vox);
      t.position.set(x, 0, -46); group.add(t);
      const s = new THREE.Sprite(glowMat(0xfff4c0, 0.9)); s.scale.set(16, 16, 1); s.position.set(x, 31.5, -45); group.add(s);
    }
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
  const PENTA = [523, 587, 659, 784, 880, 1047, 1175];
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
    kick: () => { noise(0.14, 0.08, 1200); tone(160, 60, 0.12, "square", 0.08); },
    rev: k => tone(200 + k * 400, 300 + k * 500, 0.08, "sawtooth", 0.05),
    roll: () => tone(180, 700, 0.18, "sawtooth", 0.08),
    homing: () => tone(700, 1400, 0.12, "triangle", 0.08),
    note: () => { const f = PENTA[Math.floor(Math.random() * PENTA.length)]; tone(f, f, 0.22, "sine", 0.12); tone(f * 2, f * 2, 0.18, "triangle", 0.03); },
    hurt: () => { tone(400, 120, 0.3, "sawtooth", 0.1); },
    splash: () => noise(0.3, 0.1, 500),
    bubble: () => tone(300, 900, 0.15, "sine", 0.1),
    warn: () => tone(880, 880, 0.08, "square", 0.06),
    check: () => [523, 659, 784].forEach((f, i) => tone(f, f, 0.12, "triangle", 0.1, i * 0.08)),
    fall: () => tone(600, 80, 0.6, "triangle", 0.1),
    goal: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, f, 0.18, "square", 0.07, i * 0.11)),
    star: () => [784, 988, 1175, 1319, 1568].forEach((f, i) => tone(f, f, 0.1, "triangle", 0.08, i * 0.05)),
    stumble: () => tone(260, 140, 0.15, "square", 0.08),
  };

  // ---------------------------------------------------------------- the save
  const KEY = () => "postparade.adventure." + ((root.Auth && Auth.current && Auth.current()) ? Auth.current().id : "guest");
  function load() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(KEY())); } catch (e) {}
    s = s && typeof s === "object" ? s : {};
    s.stages = s.stages || {}; s.cast = s.cast || "goldship";
    return s;
  }
  function save(s) { try { localStorage.setItem(KEY(), JSON.stringify(s)); } catch (e) {} }
  const PAY = { clear: 60, shoe: 20, sRank: 40 };

  // ---------------------------------------------------------------- the running game
  let host = null, opts0 = null, R = null, scene = null, camera = null, sun = null, hemi = null;
  let world = null, player = null, raf = 0, last = 0, acc = 0, mode = "menu", paused = false;
  let saveData = null, stageIdx = 0, castId = "goldship";
  const keys = {}, pad = { L: 0, R: 0, J: 0, A: 0, D: 0 }, touch = { L: 0, R: 0, J: 0, A: 0 };
  const input = { L: 0, R: 0, D: 0, J: 0, A: 0, jp: 0, ap: 0, pj: 0, pa: 0 };

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
    const T = Object.assign({ id: def.theme }, THEMES[def.theme] || THEMES.hills);
    const S = parse(def);
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
    for (let i0 = 0; i0 < W; i0 += 16) for (const m of buildChunk(S, T, i0, Math.min(W, i0 + 16))) group.add(m);
    const far = new THREE.Group(); scene.add(far);
    buildFar(T, W, rnd, far);
    group.add(skirts(S, T));

    const w = { def, T, S, W, group, far, tiles: {}, ents: [], carrots: [], solids: [], plats: [], enemies: [], vents: [], bubbles: [],
                notes: [], drafts: [], hazards: [], checks: [], start: { x: 2, y: 5 }, goal: null, shoes: [], total: 0,
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
        case "h": { const m = put(propGeo("hurdle"), x, y); w.solids.push({ t: "hurdle", x0: x - 0.2, x1: x + 0.2, y0: y, y1: y + 1.0, m, alive: true }); break; }
        case "M": case "V": {
          const len = e.len || 3;
          const v = new Vox(); for (let sx = 0; sx < len * 4; sx++) for (let z = ZB; z <= ZF; z++) v.set(sx, 3, z, jit(rnd, ((sx & 3) === 0) ? mulC(T.plank, 0.75) : T.plank, 0.05));
          for (let sx = 0; sx < len * 4; sx++) v.set(sx, 2, ZF, mulC(T.plank, 0.7));
          const m = new THREE.Mesh(meshVox(v, GR), M.vox); m.castShadow = true; group.add(m);
          w.plats.push({ t: e.t, i: e.i, j: e.j, len, x0: e.i, y0: e.j, x: e.i, y: e.j, dx: 0, dy: 0, m, ph: (e.i * 0.37) % (PI * 2), range: 3 });
          break;
        }
        case "r": case "k": case "b": {
          const kind = e.t === "r" ? T.roller : e.t === "b" ? T.bird : T.walker;
          const g = enemyGeo(kind);
          let m;
          if (g.body) {
            m = new THREE.Group(); const b = new THREE.Mesh(g.body, M.vox); m.add(b);
            const wl = new THREE.Mesh(g.wing, M.vox), wr = new THREE.Mesh(g.wing, M.vox); wl.position.set(0, 3 * F, 3 * F); wr.position.set(0, 3 * F, -3 * F); wr.scale.z = -1;
            m.add(wl, wr); m.userData.wings = [wl, wr]; group.add(m);
          } else m = put(g, x, y);
          const roll = e.t === "r";
          w.enemies.push({ t: e.t, kind, x, y, x0: x, y0: y + (e.t === "b" ? 0.4 : 0), vx: roll ? -2.2 : -1.3, vy: 0, w: roll ? 0.9 : 0.8,
                           h: roll ? 0.9 : e.t === "b" ? 0.7 : 0.65, m, alive: true, ph: e.i * 1.3, spin: 0 });
          break;
        }
        case "U": w.drafts.push({ x0: e.i, x1: e.i + 1, y0: e.j, y1: e.j + 8 }); break;
        case "O": w.vents.push({ x, y, t: (e.i % 3) * 0.8, m: put(propGeo("vent"), x, y) }); break;
        case "T": put(propGeo("tree", T), x, y, -2.6).scale.setScalar(1.1); break;
        case "^": {
          const m = new THREE.Mesh(vox(v => { for (let k = -7; k <= 7; k += 2) for (let z = -20; z <= 18; z += 4) v.box(k, 0, z + (k & 3), k, 4 + ((k + z) & 3), z + (k & 3), (k & 2) ? 0x3a6a2a : 0x6a3a5a); }), M.vox);
          m.position.set(x, y, 0); group.add(m); w.hazards.push({ x0: e.i + 0.1, x1: e.i + 0.9, y0: e.j, y1: e.j + 0.45 });
          break;
        }
      }
    }
    // updraft columns: drifting motes
    for (const d of w.drafts) {
      const geo = vox(v => v.box(0, 0, 0, 0, 1, 0, T.id === "snow" ? 0xffffff : 0xd8f0d0));
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
    // a voxel racer, or (Sonic) a sprite; `obj` is whichever stands in the world
    let rig = null, spr = null, obj, ball = null;
    if (c.sprite) obj = spr = makeSprite(world.T);
    else {
      rig = makeRacer(c.look);
      rig.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.userData.keep = true; } });
      obj = rig.root;
      if (c.move === "spin") { ball = new THREE.Mesh(propGeo("ball"), materials().vox); ball.visible = false; ball.castShadow = true; world.group.add(ball); }
    }
    world.group.add(obj);
    return { c, rig, spr, obj, ball, x: world.start.x, y: world.start.y, vx: 0, vy: 0, face: 1, ground: true, curl: false, coyote: 0, on: null,
             state: "run", st: 0, hearts: 3, inv: 0, carrots: 0, nextHeal: 50, shoes: [false, false, false], falls: 0,
             check: { x: world.start.x, y: world.start.y }, usedDouble: false, airMove: false, cd: 0, rev: 0, star: 0,
             air: AIR, inWater: false, wasWater: false, jumping: false, dead: 0, gliding: false, target: null, onTile: null,
             hh: c.h, warnAt: 0 };
  }
  const AIR = 16;                                    // seconds of breath under water (Sonic)
  const GRAV = 34;

  const tile = (i, j) => (i < 0 || i >= world.W) ? "#" : (j < 0 || j >= H) ? "." : world.S.grid[j][i];
  const solid = c => SOLIDS.indexOf(c) >= 0;
  const slopeY = (c, i, j, x) => c === "/" ? j + clamp(x - i, 0, 1) : j + 1 - clamp(x - i, 0, 1);
  const surfaceAt = (x, y) => tile(Math.floor(x), Math.floor(y - 0.05));
  const attacking = p => p.star > 0 || p.state === "kick" || p.state === "roll" || p.state === "homing" ||
                         (p.c.move === "spin" && p.curl && !p.ground && p.state !== "hurt") || (p.c.move === "spin" && p.state === "charge");

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

  function breakTile(i, j, by) {
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

  /* Walls: tiles, and hurdles while they stand. */
  function moveX(p, dx) {
    p.x += dx;
    const hb = p.state === "roll" || p.state === "charge" ? 0.8 : p.hh;
    const yb = p.y + (p.ground ? 0.36 : 0.06), yt = p.y + hb - 0.06;
    for (let pass = 0; pass < 2; pass++) {
      const edge = dx > 0 ? p.x + p.c.w / 2 : p.x - p.c.w / 2;
      const i = Math.floor(edge);
      let hit = false;
      for (let j = Math.floor(yb); j <= Math.floor(yt); j++) {
        const c = tile(i, j);
        if (!solid(c)) continue;
        if ((c === "X" || c === "B") && attacking(p)) { breakTile(i, j); continue; }
        hit = true; break;
      }
      if (hit) {
        p.x = dx > 0 ? i - p.c.w / 2 - 1e-3 : i + 1 + p.c.w / 2 + 1e-3;
        if (p.state === "kick" || p.state === "homing") endMove(p);
        p.vx = 0;
        if (p.state === "roll") p.state = "run";
      }
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
    burst((b.x0 + b.x1) / 2, b.y0 + 0.5, [0x3a7e32, 0x2a6a2a, 0xf6f6f2], 16, 7);
    SFX.breakIt();
  }

  function land(p, hit) {
    if (!p.ground && p.vy < -14) burst(p.x, p.y, [0xd8d0c0, 0xc8c0b0], 5, 2);
    if (!p.ground && p.vy < -4) p.landT = 0.14;
    p.ground = true; p.vy = 0; p.usedDouble = false; p.airMove = false; p.jumping = false; p.gliding = false;
    p.on = hit.on; p.onTile = hit.tl;
    if (p.state !== "roll") p.curl = false;
    if (p.state === "homing" || p.state === "jump") p.state = "run";
    if (p.state === "kick") p.st = Math.min(p.st, 0.12);
  }

  function endMove(p) { p.state = "run"; p.st = 0; }

  function hurt(p, fromX) {
    if (p.inv > 0 || p.star > 0 || p.dead) return;
    p.hearts--; p.inv = 1.6;
    p.vx = -sgn(fromX - p.x || p.face) * 7; p.vy = 8; p.ground = false;
    p.state = "hurt"; p.st = 0.45; p.curl = false;
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
    p.state = "run"; p.ground = false; p.air = AIR; p.star = 0; p.rev = 0;
    snapCamera();
  }

  function step(dt) {
    const p = player, w = world, c = p.c;
    w.t += dt;
    if (p.dead) {
      p.dead -= dt;
      if (p.dead <= 0) respawn(p);
      return;
    }
    if (mode === "goal") { p.vx *= Math.pow(0.02, dt); goalStep(p, dt); if (!p.ground) p.vy = Math.max(p.vy - GRAV * dt, -22); integrate(p, dt, 0, 0); return; }
    p.inv = Math.max(0, p.inv - dt); p.cd = Math.max(0, p.cd - dt); p.star = Math.max(0, p.star - dt);
    const L = input.L, Rr = input.R, dir = Rr - L;
    // where she is
    const midTile = tile(Math.floor(p.x), Math.floor(p.y + p.hh * 0.5));
    const headTile = tile(Math.floor(p.x), Math.floor(p.y + p.hh - 0.1));
    p.wasWater = p.inWater;
    p.inWater = midTile === "~";
    if (p.inWater !== p.wasWater && Math.abs(p.vy) > 3) { SFX.splash(); burst(p.x, Math.floor(p.y + p.hh * 0.5) + 1, [0xffffff, mixC(w.T.water, 0xffffff, 0.5)], 10, 4); }
    const under = p.ground ? (p.onTile ? tile(p.onTile.i, p.onTile.j) : surfaceAt(p.x, p.y)) : null;
    const ice = under === "I", mud = under === "m";
    // breath, for one who cannot swim
    if (c.sinks) {
      if (headTile === "~") {
        p.air -= dt;
        if (p.air < 6 && w.t > p.warnAt) { SFX.warn(); p.warnAt = w.t + 1; }
        if (p.air <= 0) { die(p, "air"); return; }
      } else p.air = AIR;
    }
    // the move
    let top = c.run * (p.star > 0 ? 1.22 : 1), acc = p.ground ? c.accel : c.airAccel, fr = p.ground ? 30 : 4;
    if (p.inWater) { top *= c.sinks ? 0.62 : 0.6; acc *= 0.6; fr = 8; }
    if (mud) top *= 0.5;
    if (ice) { acc *= 0.32; fr = 2.2; }
    if (p.gliding) top = Math.min(top, 9.5);
    p.st -= dt;
    switch (p.state) {
      case "hurt": if (p.st <= 0) p.state = "run"; break;
      case "stumble": if (p.st <= 0) p.state = "run"; break;
      case "kick":
        p.vx = p.face * (p.inWater ? 9 : 16.5);
        if (p.st <= 0) { p.state = "run"; p.vx = p.face * Math.min(top, 12); }
        break;
      case "homing": {
        const t = p.target;
        if (!t || (t.alive === false) || p.st <= 0) { p.state = "jump"; p.vx = clamp(p.vx, -top, top); break; }
        const tx = t.x, ty = (t.y || 0) + (t.h ? t.h / 2 : 0.4), dx = tx - p.x, dy = ty - (p.y + 0.5), d = Math.hypot(dx, dy) || 1;
        p.vx = dx / d * 24; p.vy = dy / d * 24; p.face = sgn(dx) || p.face;
        break;
      }
      case "charge":
        p.vx *= Math.pow(0.0005, dt);
        p.rev = Math.min(1, p.rev + dt * 1.1);
        if (input.ap) { p.rev = Math.min(1, p.rev + 0.18); SFX.rev(p.rev); }
        if (!input.A) { p.state = "roll"; p.vx = p.face * (13 + p.rev * 10); p.rev = 0; SFX.roll(); burst(p.x - p.face * 0.4, p.y + 0.1, [0xd8d0c0, 0xffffff], 8, 3); }
        if (!p.ground) p.state = "jump";
        break;
      case "roll":
        p.vx -= sgn(p.vx) * 3.2 * dt;
        if (dir && sgn(dir) !== sgn(p.vx)) p.vx -= sgn(p.vx) * 9 * dt;
        if (Math.abs(p.vx) < 3 && p.ground) p.state = "run";
        break;
      default:
        if (dir) {
          if (sgn(p.vx) !== dir && Math.abs(p.vx) > 0.4) p.vx += dir * acc * (ice ? 1 : 2.4) * dt;
          else if (Math.abs(p.vx) < top) p.vx = clamp(p.vx + dir * acc * dt, -top, top);
          else p.vx -= sgn(p.vx) * Math.min(Math.abs(p.vx) - top, 9 * dt);
          p.face = dir;
        } else {
          const d = fr * dt;
          p.vx = Math.abs(p.vx) <= d ? 0 : p.vx - sgn(p.vx) * d;
        }
    }
    const free = p.state !== "hurt" && p.state !== "kick" && p.state !== "homing" && p.state !== "stumble";
    // jumping
    if (p.ground) p.coyote = 0.1; else p.coyote -= dt;
    p.drop = input.D && input.jp && p.ground && p.onTile === null && tile(Math.floor(p.x), Math.floor(p.y - 0.1)) === "-";
    if (input.jp && free && p.state !== "charge") {
      if (p.drop) { p.ground = false; p.y -= 0.12; }
      else if (p.ground || p.coyote > 0) {
        p.vy = c.jump * (mud ? 0.82 : 1) * (p.inWater ? (c.sinks ? 0.82 : 0.62) : 1);
        p.ground = false; p.coyote = 0; p.jumping = true; p.on = null;
        p.state = "jump"; p.curl = c.move === "spin";
        SFX.jump();
      } else if (p.inWater && c.swim) {
        // a stroke; at the surface, a jump out onto the bank
        if (headTile !== "~") { p.vy = c.jump * 0.92; p.jumping = true; } else p.vy = Math.max(p.vy, 6.4);
        SFX.splash();
      } else if (c.double && !p.usedDouble) {
        p.vy = c.jump * 0.88; p.usedDouble = true; p.jumping = true; SFX.double();
        burst(p.x, p.y, [0x39c5bb, 0xe8fffc], 6, 2);
      }
    }
    if (p.jumping && !input.J && p.vy > 5) { p.vy = 5; p.jumping = false; }
    // the special move
    if (input.ap && free && p.cd <= 0) special(p);
    // gliding
    p.gliding = !!(c.glide && !p.ground && !p.inWater && input.J && p.vy < 0 && p.usedDouble !== "x" && p.state !== "hurt");
    // gravity
    let g = GRAV;
    if (p.inWater) g *= c.sinks ? 0.45 : 0.3;
    if (p.state === "kick") g *= 0.35;
    if (p.state === "homing") g = 0;
    let maxFall = p.inWater ? (c.sinks ? 6 : 2.6) : 22;
    if (p.gliding) maxFall = 2.0;
    /* an updraft lifts anyone in it, faster than they fall; one gliding on her twin tails
       (holding jump, rising or falling) goes up it fastest */
    const floaty = c.glide && input.J && !p.ground && !p.inWater;
    for (const d of w.drafts) if (p.x > d.x0 - 0.25 && p.x < d.x1 + 0.25 && p.y > d.y0 - 0.5 && p.y < d.y1) {
      p.vy = Math.min(p.vy + (floaty ? 60 : 46) * dt, floaty ? 8 : 4.5); p.ground = false;
      if (floaty) maxFall = 2.0;
    }
    p.vy = Math.max(p.vy - g * dt, -maxFall);
    // slopes pull
    if (p.ground && p.state !== "kick") {
      const st = tile(Math.floor(p.x), Math.floor(p.y - 0.02));
      const s2 = tile(Math.floor(p.x), Math.floor(p.y + 0.02));
      const sl = (st === "/" || st === "\\") ? st : (s2 === "/" || s2 === "\\") ? s2 : null;
      if (sl) p.vx += (sl === "/" ? -1 : 1) * (p.state === "roll" ? 14 : 5.5) * dt;
    }
    integrate(p, dt, top, dir);
    interact(p, dt);
  }

  function special(p) {
    const c = p.c;
    if (c.move === "kick") {
      if (!p.ground && p.airMove) return;
      p.state = "kick"; p.st = 0.42; p.cd = 0.55; p.airMove = !p.ground;
      p.vy = p.ground ? 4.6 : Math.max(p.vy, 3.4); p.ground = false; p.on = null;
      SFX.kick();
    } else if (c.move === "spin") {
      if (p.ground) {
        if (p.state === "charge" || p.state === "roll") return;
        if (Math.abs(p.vx) > 5) { p.state = "roll"; p.curl = true; SFX.roll(); }
        else { p.state = "charge"; p.curl = true; p.rev = 0.15; p.cd = 0.05; SFX.rev(0.1); }
      } else if (!p.airMove) {
        p.airMove = true; p.cd = 0.25;
        const t = homingTarget(p);
        p.curl = true;
        if (t) { p.state = "homing"; p.target = t; p.st = 0.6; }
        else { p.vx = p.face * 15; p.vy = Math.max(p.vy, 1.5); p.curl = false; p.dashT = 0.4; }
        SFX.homing(); burst(p.x, p.y + 0.5, [0x9ad4ff, 0xffffff], 6, 3);
      }
    } else if (c.move === "sing") {
      p.cd = 0.42; p.singT = 0.3;
      const m = new THREE.Mesh(propGeo("note"), materials().glow); world.group.add(m);
      world.notes.push({ x: p.x + p.face * 0.5, y: p.y + 0.72, vx: p.face * 15 + p.vx * 0.3, life: 0.65, m, ph: Math.random() * 6 });
      SFX.note();
    }
  }
  function homingTarget(p) {
    let best = null, bd = 7.5;
    const consider = (t, x, y) => {
      const dx = x - p.x, dy = y - (p.y + 0.5);
      if (dx * p.face < -0.3 || dy > 3.5 || dy < -6) return;
      const d = Math.hypot(dx, dy);
      if (d < bd) { bd = d; best = t; }
    };
    for (const e of world.enemies) if (e.alive) consider(e, e.x, e.y + e.h / 2);
    for (const e of world.ents) if (e.t === "spring") consider(e, e.x, e.y + 0.3);
    for (const b of world.solids) if (b.alive) consider(Object.assign(b, { x: (b.x0 + b.x1) / 2, y: b.y0, h: 1 }), (b.x0 + b.x1) / 2, b.y0 + 0.5);
    return best;
  }

  function integrate(p, dt, top, dir) {
    // horizontal, in small steps so a fast runner cannot pass through a wall
    const dx = p.vx * dt, n = Math.max(1, Math.ceil(Math.abs(dx) / 0.2));
    for (let k = 0; k < n; k++) moveX(p, dx / n);
    if (p.on && p.ground) { p.x += p.on.dx; }
    if (p.ground) {
      const reach = 0.18 + Math.abs(p.vx) * dt * 1.3 + (p.on ? Math.abs(p.on.dy) + 0.05 : 0);
      const hit = floorBetween(p, p.y + 0.42 + (p.on ? Math.max(0, p.on.dy) : 0), p.y - reach);
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
        const hb = (p.state === "roll" ? 0.8 : p.hh);
        const j = Math.floor(p.y + hb);
        for (let i = Math.floor(p.x - p.c.w / 2 + 0.05); i <= Math.floor(p.x + p.c.w / 2 - 0.05); i++) {
          const c = tile(i, j);
          if (solid(c) || c === "/" || c === "\\") {
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
    const bx0 = p.x - p.c.w / 2, bx1 = p.x + p.c.w / 2, by0 = p.y, by1 = p.y + (p.state === "roll" ? 0.8 : p.hh);
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
          p.vy = 21; p.ground = false; p.y = Math.max(p.y, e.y + 0.5); p.usedDouble = false; p.airMove = false; p.jumping = false;
          if (p.state !== "roll") p.state = "jump"; p.curl = p.c.move === "spin"; e.sq = 1; SFX.spring();
        }
      } else if (e.t === "dash") {
        if (p.ground && touches(e.x, e.y + 0.1, 0.6)) { if (p.vx < 18) { p.vx = 18; p.face = 1; SFX.dash(); burst(p.x, p.y + 0.2, [0xf2d040, 0xffffff], 5, 3); } }
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
    // enemies
    for (const e of w.enemies) {
      if (!e.alive) continue;
      const ex0 = e.x - e.w / 2, ex1 = e.x + e.w / 2, ey0 = e.y, ey1 = e.y + e.h;
      if (bx1 < ex0 || bx0 > ex1 || by1 < ey0 || by0 > ey1) continue;
      if (attacking(p)) {
        defeat(e);
        if (p.state === "homing") { p.state = "jump"; p.vy = 10; p.vx = p.face * 4; p.airMove = false; }
        else if (p.c.move === "spin" && !p.ground && p.vy < 0) p.vy = input.J ? 12 : 9;
      } else if (p.vy < -0.5 && by0 > ey0 + e.h * 0.4) {
        defeat(e); p.vy = input.J ? 13 : 9.5; p.ground = false; p.usedDouble = false; p.airMove = false; SFX.stomp();
      } else hurt(p, e.x);
    }
    // a homing attack that reaches a spring or a hurdle
    if (p.state === "homing" && p.target && p.target.t === "hurdle" && !p.target.alive) { p.state = "jump"; p.vy = 9; p.airMove = false; }
    // bubbles
    for (const b of w.bubbles) if (!b.gone && touches(b.x, b.y, 0.5)) { b.gone = true; b.m.visible = false; p.air = AIR; SFX.bubble(); }
    // a crumbling ledge she is standing on
    if (p.ground && p.onTile) {
      const t = w.tiles[p.onTile.i + "," + p.onTile.j];
      if (t && t.c === "C" && !t.t && !t.gone) t.t = 0.45;
    }
  }
  function defeat(e) {
    e.alive = false; e.m.visible = false;
    const C = { hay: [0xe8c060, 0xc8a040], log: [0x8a5a30, 0xc89a60], boulder: [0x9a7a62, 0x7a5a44], ball: [0xf6f6f6, 0xe8403a],
                snowball: [0xffffff, 0xd8e4f0], crow: [0x26262e, 0x3a3a46], gull: [0xffffff, 0xb8bcc4], owl: [0x8a6a4a, 0xc8a87a],
                crab: [0xe0503a, 0xf06a50], penguin: [0x22222a, 0xffffff], beetle: [0x2a2238, 0x4a3a62] }[e.kind] || [0xffffff];
    burst(e.x, e.y + e.h / 2, C.concat([0xffffff]), 14, 5);
    SFX.stomp();
    spawnLoose(e.x, e.y + 0.6, 0, 7);
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
    for (const e of w.enemies) {
      if (!e.alive) continue;
      if (e.t === "b") {
        const nx = e.x0 + Math.sin(w.t * 0.8 + e.ph) * 3.2;
        e.vx = (nx - e.x) / Math.max(dt, 1e-4); e.x = nx;
        e.y = e.y0 + Math.sin(w.t * 2.3 + e.ph) * 0.55;
        continue;
      }
      const speed = e.t === "r" ? 2.3 : (Math.sin(w.t * 1.7 + e.ph) > -0.6 ? 1.4 : 0);
      e.dir = e.dir || -1;
      const ahead = e.x + e.dir * (e.w / 2 + 0.05);
      const wall = solid(tile(Math.floor(ahead), Math.floor(e.y + 0.3))) || w.solids.some(b => b.alive && ahead > b.x0 && ahead < b.x1 && e.y < b.y1);
      const floor = solid(tile(Math.floor(ahead), Math.floor(e.y - 0.1))) || tile(Math.floor(ahead), Math.floor(e.y - 0.1)) === "-" ||
                    "/\\".indexOf(tile(Math.floor(ahead), Math.floor(e.y - 0.1))) >= 0 || "/\\".indexOf(tile(Math.floor(ahead), Math.floor(e.y + 0.1))) >= 0;
      if (wall || !floor) e.dir = -e.dir;
      e.vx = e.dir * speed;
      e.x += e.vx * dt;
      // follow the ground, slopes included
      const ci = Math.floor(e.x);
      let gy = null;
      for (let j = Math.floor(e.y + 0.6); j >= Math.floor(e.y - 1.2); j--) {
        const c = tile(ci, j);
        if (c === "/" || c === "\\") { gy = slopeY(c, ci, j, e.x); break; }
        if (solid(c) || c === "-") { gy = j + 1; break; }
      }
      if (gy !== null) e.y = gy; else e.y -= 6 * dt;
      if (e.y < -3) e.alive = false;
      e.spin += e.vx * dt / 0.45;
    }
    // notes
    for (const n of w.notes) {
      if (n.dead) continue;
      n.life -= dt; n.x += n.vx * dt; n.y += Math.sin(w.t * 14 + n.ph) * 0.02;
      const i = Math.floor(n.x), j = Math.floor(n.y);
      const c = tile(i, j);
      if (c === "X" || c === "B") { breakTile(i, j); n.life = 0; }
      else if (solid(c)) n.life = 0;
      for (const e of w.enemies) if (e.alive && Math.abs(e.x - n.x) < e.w / 2 + 0.3 && n.y > e.y - 0.35 && n.y < e.y + e.h + 0.4) { defeat(e); n.life = 0; }
      for (const b of w.solids) if (b.alive && n.x > b.x0 - 0.2 && n.x < b.x1 + 0.2 && n.y < b.y1 + 0.1 && n.y > b.y0 - 0.3) { smashHurdle(b); n.life = 0; }
      if (n.life <= 0) { n.dead = true; n.m.visible = false; burst(n.x, n.y, [0x39c5bb, 0xe8fffc], 6, 2); }
      n.m.position.set(n.x, n.y, 0.2); n.m.rotation.y = w.t * 6;
    }
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
  let camX = 0, camY = 0;
  const CAM_D = 17;
  function snapCamera() { if (!player) return; camX = player.x + 2; camY = Math.max(6.1, player.y + 2.1); }
  function draw(dt) {
    const p = player, w = world, c = p.c, m = p.rig;
    // the runner
    if (p.spr) drawSprite(p, dt);
    else {
    const ball = p.ball && (p.state === "roll" || p.state === "charge" || p.state === "homing" || (p.curl && !p.ground && p.state !== "hurt"));
    m.root.visible = !ball && !(p.dead > 0.6) && !(p.inv > 0 && Math.sin(w.t * 40) > 0.4);
    if (p.ball) {
      p.ball.visible = ball && !(p.inv > 0 && Math.sin(w.t * 40) > 0.4);
      p.ball.position.set(p.x, p.y + 0.48, 0);
      p.ball.rotation.z -= (p.state === "charge" ? 30 : p.vx * 2.2 + p.face * 6) * dt;
      p.ball.scale.setScalar(p.state === "charge" ? 1 + Math.sin(w.t * 50) * 0.06 : 1);
    }
    const yaw = p.face > 0 ? PI / 2 - 0.32 : -PI / 2 + 0.32;
    m.root.rotation.y = lerp(m.root.rotation.y, yaw, 1 - Math.exp(-dt * 16));
    m.root.position.set(p.x, p.y, 0);
    m.rig.rotation.set(0, 0, 0);
    const speed = Math.abs(p.vx);
    m.phase += dt * (p.ground ? 2 + speed * 1.15 : 0);
    const run = p.ground ? clamp(speed / 7, 0, 1) : 0;
    pose(m, run, w.t, {});
    if (p.dead) { m.rig.rotation.x = -0.6; }
    else if (p.state === "kick") {
      m.rig.rotation.x = -1.15; m.rig.position.y = 0.55;
      m.legL.rotation.x = m.legR.rotation.x = -0.35; m.armL.rotation.x = m.armR.rotation.x = 2.4;
    } else if (p.state === "hurt" || p.state === "stumble") {
      m.rig.rotation.x = -0.4; m.armL.rotation.x = m.armR.rotation.x = -2.4;
    } else if (p.inWater && !p.ground && !c.sinks) {
      m.rig.rotation.x = 1.1; m.rig.position.y = 0.5;
      m.legL.rotation.x = Math.sin(w.t * 12) * 0.5; m.legR.rotation.x = -Math.sin(w.t * 12) * 0.5;
      m.armL.rotation.x = -2.4 + Math.sin(w.t * 5) * 0.6; m.armR.rotation.x = -2.4 - Math.sin(w.t * 5) * 0.6;
    } else if (!p.ground) {
      if (p.gliding) {
        m.armL.rotation.z = -1.25; m.armR.rotation.z = 1.25; m.armL.rotation.x = m.armR.rotation.x = 0;
        m.legL.rotation.x = 0.25; m.legR.rotation.x = -0.1;
        m.locks.forEach((l, i) => { l.rotation.z = (i ? 1 : -1) * (1.25 + Math.sin(w.t * 30 + i * PI) * 0.3); l.rotation.x = 0.2; });
      } else {
        m.legL.rotation.x = -0.9; m.legR.rotation.x = 0.35; m.armL.rotation.x = -1.6; m.armR.rotation.x = 0.4;
        m.locks.forEach(l => { l.rotation.x = p.vy > 0 ? -0.5 : 0.7; });
      }
    }
    if (p.singT > 0) { p.singT -= dt; m.armR.rotation.x = -1.5; m.armR.rotation.z = 0.2; m.head.rotation.x = -0.25; }
    }
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
    for (const s of w.shoes) if (!s.got) { s.m.rotation.y = w.t * 2.2; s.m.position.y = s.y + Math.sin(w.t * 2.5 + s.x) * 0.12; }
    for (const e of w.enemies) {
      if (!e.alive) continue;
      e.m.position.set(e.x, e.y + (e.t === "r" ? 0.45 : 0), e.t === "b" ? 0 : 0);
      if (e.t === "r") e.m.rotation.z = -e.spin;
      else e.m.rotation.y = e.vx > 0 ? 0 : PI;
      if (e.t === "k") e.m.position.y = e.y + Math.abs(Math.sin(w.t * 9 + e.ph)) * 0.06;
      if (e.m.userData.wings) { const a = Math.sin(w.t * 14 + e.ph) * 0.8; e.m.userData.wings[0].rotation.x = a; e.m.userData.wings[1].rotation.x = -a; }
    }
    if (w.snow) {
      const a = w.snow.geometry.attributes.position;
      for (let k = 0; k < a.count; k++) {
        let y = a.getY(k) - dt * 1.6, x = a.getX(k) + Math.sin(w.t + k) * dt * 0.4;
        if (y < camY - 8) y += 18;
        a.setXY(k, x, y);
      }
      a.needsUpdate = true; w.snow.position.x = camX - 0;
    }
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
  function onKey(e, down) {
    if (!host) return;
    const k = e.key;
    const map = { ArrowLeft: "L", a: "L", A: "L", ArrowRight: "R", d: "R", D: "R", ArrowDown: "D", s: "D", S: "D",
                  " ": "J", ArrowUp: "J", w: "J", W: "J", z: "J", Z: "J", k: "J", K: "J",
                  Shift: "A", j: "A", J: "A", x: "A", X: "A", e: "A", E: "A" };
    const b = map[k];
    if (k === "Escape" || k === "p" || k === "P") { if (down && mode === "play") togglePause(); e.preventDefault(); return; }
    if (k === "Enter" && down && mode === "menu") { const s = host.querySelector("#advStart"); if (s && !s.disabled) s.click(); return; }
    if (!b) return;
    if (mode === "play" || mode === "goal") e.preventDefault();
    keys[b] = down ? 1 : 0;
  }
  const kd = e => onKey(e, true), ku = e => onKey(e, false);
  function readInput() {
    const gp = navigator.getGamepads ? Array.from(navigator.getGamepads()).find(g => g && g.connected) : null;
    pad.L = pad.R = pad.J = pad.A = pad.D = 0;
    if (gp) {
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0, B = i => gp.buttons[i] && gp.buttons[i].pressed ? 1 : 0;
      pad.L = ax < -0.35 || B(14) ? 1 : 0; pad.R = ax > 0.35 || B(15) ? 1 : 0; pad.D = ay > 0.5 || B(13) ? 1 : 0;
      pad.J = B(0) || B(3) ? 1 : 0; pad.A = B(1) || B(2) || B(5) || B(7) ? 1 : 0;
      if (B(9) && !pad.start && mode === "play") togglePause();
      pad.start = B(9);
    }
    const J = keys.J || pad.J || touch.J ? 1 : 0, A = keys.A || pad.A || touch.A ? 1 : 0;
    input.L = keys.L || pad.L || touch.L ? 1 : 0; input.R = keys.R || pad.R || touch.R ? 1 : 0; input.D = keys.D || pad.D ? 1 : 0;
    input.jp = J && !input.J ? 1 : 0; input.ap = A && !input.A ? 1 : 0;
    input.J = J; input.A = A;
  }

  // ---------------------------------------------------------------- the loop
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - (last || now)) / 1000); last = now;
    if (!world || !player) return;
    resize();
    if (mode === "play" || mode === "goal") {
      if (!paused) {
        acc += dt;
        const h = 1 / 120;
        let n = 0;
        while (acc >= h && n < 14) { readInput(); step(h); worldStep(h); input.jp = 0; input.ap = 0; acc -= h; n++; }
        hud();
      }
    } else {
      // the menu: she waits at the start, the world goes on around her
      world.t += dt; worldStep(dt * 0.6);
      if (card && card.cv.isConnected && (card.t += dt) > 0.14) { card.t = 0; paintCard(card.cv, ++card.i); }
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
  const unlocked = i => i === 0 || !!(saveData.stages[stages()[i - 1].id] || {}).clear;

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
    const G = root.Guests ? Guests.credit : {};
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
                <div class="adv-bust">${c.sprite ? `<canvas class="adv-spr" width="74" height="92"></canvas>` : V.bustHTML({ name: c.look, color: "" }, "")}</div>
                <div class="adv-who-tx">
                  <b>${esc(c.name)}</b>
                  <span class="adv-mv">${ico("star")}${esc(c.moveName)}</span>
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
          <div class="adv-keys">${TOUCH ? "Buttons on screen: move, jump, and her move." :
            `<b>&larr; &rarr;</b> or <b>A D</b> run &middot; <b>Space</b> jump &middot; <b>Shift</b> or <b>J</b> her move &middot; <b>Down + jump</b> drop through &middot; <b>Esc</b> pause`}</div>
          <div class="adv-credit">${esc(G.sonic || "")} His sprites are from SEGA's Sonic Battle (Game Boy Advance), ripped by QuadFactor. ${esc(G.miku || "")} Gold Ship is from Cygames' Umamusume: Pretty Derby.</div>
        </div>
      </div>`;
    const cv = ov.querySelector(".adv-spr");
    card = cv ? { cv, i: 0, t: 0 } : null;
    if (card) paintCard(cv, 0);
    ov.querySelectorAll("[data-cast]").forEach(b => b.onclick = () => {
      castId = b.dataset.cast; saveData.cast = castId; save(saveData);
      ov.querySelectorAll("[data-cast]").forEach(x => x.classList.toggle("on", x === b));
      world.group.remove(player.obj); if (player.ball) world.group.remove(player.ball);
      player = makePlayer(castOf(castId)); snapCamera();
    });
    ov.querySelectorAll("[data-st]").forEach(b => b.onclick = () => {
      const i = +b.dataset.st; if (!unlocked(i) || i === stageIdx) return;
      ov.querySelectorAll("[data-st]").forEach(x => x.classList.toggle("on", x === b));
      load3d(i); music();
    });
    ov.querySelector("#advStart").onclick = () => play();
    ov.querySelector("#advBack").onclick = () => exit();
  }
  function music() {
    const T = THEMES[stages()[stageIdx].theme] || THEMES.hills;
    try { if (root.Sound && Sound.play) Sound.play(T.music); } catch (e) {}
  }

  function play() {
    // the stage the menu has standing is fresh: run it; anything already played is built again
    if (world && world.def === stages()[stageIdx] && !world.played) {
      world.group.remove(player.obj); if (player.ball) world.group.remove(player.ball);
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
        <div class="adv-pad-l"><button data-t="L" aria-label="Left">${ico("back")}</button><button data-t="R" aria-label="Right">${ico("next")}</button></div>
        <div class="adv-pad-r"><button data-t="A" class="mv">${esc(castOf(castId).moveName)}</button><button data-t="J" class="jp">Jump</button></div>
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
    const under = p.c.sinks && p.air < AIR - 0.05;
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
    castId = CAST.some(c => c.id === saveData.cast) ? saveData.cast : "goldship";
    const list = stages();
    if (!list.length) return false;
    stageIdx = 0;
    for (let i = list.length - 1; i >= 0; i--) if (unlocked(i)) { stageIdx = i; break; }
    if ((saveData.stages[list[stageIdx].id] || {}).clear && stageIdx + 1 < list.length && unlocked(stageIdx + 1)) stageIdx++;
    el.innerHTML = `<div class="adv"><div class="adv-3d"></div><div class="adv-hud"></div><div class="adv-ov"></div></div>`;
    host = el.querySelector(".adv");
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
    _debug: { get world() { return world; }, get player() { return player; }, step: (s, n) => { for (let k = 0; k < (n || 1); k++) { readInput(); step(s); worldStep(s); } }, input, keys, parse } };
})(typeof globalThis !== "undefined" ? globalThis : this);
