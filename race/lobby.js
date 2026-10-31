/*
 * The home screen: Tracen Academy, in voxels, to walk around in.
 *
 * Nine places. The main hall is the real game's home screen: a polished cream marble floor,
 * square pillars holding up a mezzanine, red carpet along a navy-panelled wall, burgundy
 * drapery with gold fringe and little teal crystals, a vending machine and a jukebox,
 * benches, a notice board, the library's doors between bookcases, and the academy's racers in
 * their signature outfits going about their day in it. Every mode lives somewhere in the building:
 * the doors to the track are Exhibition, the library's deck archive is where decks are built,
 * the notice board holds the quests, and the double doors at the back are the trainer's
 * office. That is the second room: the trainer works there, and its far door opens on the
 * stable, where a career is begun. The doors on the left go through to the cafeteria; the
 * ones on the right to the dorm, a corridor of rooms two to a room, each room dressed for
 * the pair who live in it. The classroom door at the back opens on the school wing, a
 * corridor of classrooms, one for each tutorial, the lesson taught at its board. And the
 * Scouting doors go outside, to the old training track, where the racers warm up and the
 * trainers watch from the rail. The library, through the doors at the back left, is stacks
 * and reading tables, the librarian at her desk, and the card catalogue of decks.
 *
 * Doors open. Walk up to one and press E (or click its sign): she turns, the door swings,
 * the camera follows her through, and afterwards she comes back out of the same door.
 *
 * Built with voxel.js's kit (the same mesher and racer models as the race), on its own
 * renderer: the building at a quarter-metre grain, and the furniture and the doors at the
 * racers' own (a sixteenth). Without WebGL, Lobby.ok is false and the shell keeps the flat
 * home screen.
 *
 *   Lobby.start(host, { me, cast, office, cafe, corridor, home, stations, tags, onEnter, safeTop })
 *     -> true when running. cast: the hall's company; office, cafe, corridor: those rooms';
 *     home: dorm residents who are in their rooms today (Lobby.residents: who has one);
 *     onJukebox(): the hall's jukebox was used -- the shell offers the music to choose from;
 *     school, classes: the school wing's corridor, and who is in class; lessons: the
 *     tutorials, a classroom each ({ id, name, text, done }); onLesson(id): one was started
 *     at its classroom's board; onMusic(role): she has gone into a place with music of its
 *     own (null: back where the home theme plays); track, library: who is out on the
 *     training track, and who is in the library
 *   Lobby.stop()
 *   Lobby.setPlayer(def)
 */
(function (root) {
  "use strict";

  const THREE = root.THREE, V = root.Voxel;
  if (!THREE || !V || !V.ok || !V.kit) { root.Lobby = { ok: false }; return; }
  const { Vox, meshVox, makeRacer, pose, mulC, mixC, mulberry32 } = V.kit;
  const PI = Math.PI;
  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => k * k * (3 - 2 * k);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---------------------------------------------------------------- drawing in voxels
  /* Two grains: the building in quarter-metre voxels, and everything in it -- furniture,
     doors, fittings -- in sixteenths, the racers' own, fine enough for a vending machine
     to have a coin slot. */
  const S = 0.25, F = 0.0625;

  /** A voxel canvas measured in metres. `box` fills [x0,x1) x [y0,y1) x [z0,z1); a colour
      function gets each voxel's low corner and may return null to carve it, or undefined
      to leave it as it was. */
  function canvas(grain, seed) {
    const v = new Vox(), rnd = mulberry32(seed || 7);
    const q = m => Math.round(m / grain);
    const box = (x0, y0, z0, x1, y1, z1, c) => {
      if (typeof c !== "function") return v.box(q(x0), q(y0), q(z0), q(x1) - 1, q(y1) - 1, q(z1) - 1, c);
      v.box(q(x0), q(y0), q(z0), q(x1) - 1, q(y1) - 1, q(z1) - 1, (x, y, z) => {
        const r = c(x * grain, y * grain, z * grain);
        return r === undefined ? v.get(x, y, z) : r;
      });
    };
    return {
      v, rnd, g: grain, h: grain / 2, box, q,
      clear: (x0, y0, z0, x1, y1, z1) => box(x0, y0, z0, x1, y1, z1, null),
      jit: (c, a) => mulC(c, 1 - a + rnd() * a * 2),
      // `keep(X, Y, Z, nx, ny, nz)`, in metres, drops faces that can never be seen
      mesh: keep => meshVox(v, grain, keep && ((x, y, z, nx, ny, nz) => keep(x * grain, y * grain, z * grain, nx, ny, nz))),
    };
  }
  /* Nobody looks at the underside of anything standing on the floor. */
  const notUnder = (X, Y, Z, nx, ny) => !(ny < 0 && Y < F);
  /** A vertical cylinder centred on (cx, cz). */
  function cyl(c, cx, cz, r, y0, y1, col) {
    c.box(cx - r, y0, cz - r, cx + r, y1, cz + r, (X, Y, Z) =>
      Math.hypot(X + c.h - cx, Z + c.h - cz) <= r ? (typeof col === "function" ? col(X, Y, Z) : col) : undefined);
  }
  /** A clump of leaves: an ellipsoid, ragged at its skin, lighter on top. */
  function leaves(c, cx, cy, cz, rx, ry, rz) {
    c.box(cx - rx, cy - ry, cz - rz, cx + rx, cy + ry, cz + rz, (X, Y, Z) => {
      const d = ((X + c.h - cx) / rx) ** 2 + ((Y + c.h - cy) / ry) ** 2 + ((Z + c.h - cz) / rz) ** 2;
      if (d > 1 || (d > 0.72 && c.rnd() < 0.45)) return undefined;
      return c.rnd() < 0.16 ? C.leafD : (Y - cy) / ry > 0.3 ? C.leafL : C.leaf;
    });
  }
  const near = (a, b) => Math.abs(a - b) < 1e-6;

  const C = {
    floorA: 0xf0e9dc, floorB: 0xe6ddca, grout: 0xcfc2aa, border: 0xbfa988,
    carpet: 0x9a2236, carpetEdge: 0xd8b048,
    wall: 0xf3ecdd, wallTop: 0xece3d0, panel: 0x2c3354, rail: 0x7a4e30, skirt: 0x4a3022,
    column: 0xf5efe3, colBase: 0x5a3a28, colCap: 0xe2d6bf,
    mezz: 0xf0e8d8, mezzEdge: 0x7a4e30, baluster: 0xf6f2ea,
    drape: 0x8c1f32, drapeD: 0x6c1626, fringe: 0xd8b048, crystal: 0x4ac8d4,
    doorBlue: 0x8db6d6, glass: 0xbfdcec, glassHi: 0xeef8fc, frame: 0xf8f6f0,
    wood: 0x8a5a36, woodD: 0x63402a, woodL: 0xa8744a,
    brass: 0xd8a640, brassD: 0xa87a26, chrome: 0xdcdfe6, chromeD: 0x9aa0ac, metal: 0x4a4a54,
    cork: 0xb88a5a, corkD: 0x9a6e44,
    vend: 0x2a64c4, vendFace: 0xf2f4f8, juke: 0x7a3e22, amber: 0xf2b23e, lit: 0xfff1cc,
    benchO: 0xe8902a, benchY: 0xf0c040,
    leaf: 0x3d9a3d, leafL: 0x5cb84a, leafD: 0x2a7a2c, pot: 0xf2ece0, soil: 0x4a3426,
    libFloor: 0xc87a44, shelf: 0x8a5a36,
    window: 0xc6e4f4, ceiling: 0xf4eee2, lamp: 0xfff6d8,
    plankA: 0xb07a48, plankB: 0xa06a3c, plankC: 0xbc8650, seam: 0x6e4a2c,
    wainscot: 0x7e5232, wainTop: 0xa8744a, paper: 0xf0e6d2, paperD: 0xe8dcc4, crown: 0xf8f2e6,
    green: 0x2f6a4e, greenD: 0x23523c, greenL: 0x3f7e5e, leather: 0x5a3424, leatherD: 0x43261a,
    rugA: 0x2c3a5c, rugB: 0x8c2a3a,
  };
  const BOOKS = [0xc0302a, 0x2a5ab0, 0x3a9a4a, 0xe0a030, 0x7a3a8a, 0xf2ead8, 0x2a2a3a, 0xd86a8a];

  // ---------------------------------------------------------------- furniture, either room
  function plant(c, x, z, s) {
    const r = 0.3 * s, ph = 0.625 * s;
    cyl(c, x, z, r, 0, ph, (X, Y) => Y >= ph - 0.1875 && Y < ph - 0.125 ? C.brass : C.pot);
    cyl(c, x, z, r + F, ph - F, ph, C.pot);                                   // the rim
    cyl(c, x, z, r - F, ph - F, ph, C.soil);
    c.box(x - F, ph - F, z - F, x + F, 1.55 * s, z + F, 0x6a4a30);            // the trunk
    leaves(c, x, 1.75 * s, z, 0.34 * s, 0.3 * s, 0.34 * s);
    leaves(c, x - 0.24 * s, 1.35 * s, z + 0.08 * s, 0.26 * s, 0.22 * s, 0.26 * s);
    leaves(c, x + 0.24 * s, 1.2 * s, z - 0.06 * s, 0.26 * s, 0.22 * s, 0.24 * s);
    leaves(c, x + 0.04 * s, 1.0 * s, z + 0.2 * s, 0.22 * s, 0.18 * s, 0.2 * s);
  }
  /** A row of books standing on a shelf at height y, spines to +z. */
  function books(c, x0, x1, y, z0, z1, maxH) {
    let x = x0;
    while (x < x1 - F) {
      const w = c.rnd() < 0.35 ? 2 * F : c.rnd() < 0.2 ? 3 * F : F;
      if (x + w > x1) break;
      const hgt = Math.min(maxH, 0.1875 + Math.floor(c.rnd() * 4) * F), col = BOOKS[Math.floor(c.rnd() * BOOKS.length)];
      // a pale band near the top of the spine, where the title goes
      c.box(x, y, z0, x + w, y + hgt, z1, (X, Y) => w > F && Y >= y + hgt - 0.125 && Y < y + hgt - F ? mixC(col, 0xf6efd8, 0.6) : col);
      x += w + (c.rnd() < 0.07 ? F : 0);
    }
  }
  /** A cup on a plinth: base, stem, bowl, handles. Its axis runs up through (x, z). */
  function trophy(c, x, y, z, col) {
    const dark = 0x3a2418, colD = mulC(col, 0.8);
    c.box(x - 2 * F, y, z - 2 * F, x + 2 * F, y + F, z + 2 * F, dark);
    c.box(x - F, y + F, z - F, x + F, y + 3 * F, z + F, colD);
    c.box(x - 2 * F, y + 3 * F, z - 2 * F, x + 2 * F, y + 6 * F, z + 2 * F, col);
    c.box(x - F, y + 5 * F, z - F, x + F, y + 6 * F, z + F, colD);            // its mouth
    c.box(x - 3 * F, y + 4 * F, z - F, x - 2 * F, y + 5 * F, z, col);
    c.box(x + 2 * F, y + 4 * F, z - F, x + 3 * F, y + 5 * F, z, col);
  }
  const star = (dx, dy) => {
    const r = Math.hypot(dx, dy), k = Math.cos(5 * (Math.atan2(dy, dx) - PI / 2));
    return r < 0.1 + 0.17 * ((k + 1) / 2) ** 3;
  };
  const horseshoe = (dx, dy) => { const r = Math.hypot(dx, dy); return r >= 0.12 && r <= 0.22 && dy < 0.07; };

  // ---------------------------------------------------------------- doors
  /* A door is built facing +z -- the room on the +z side, the wall's inner face at z = 0,
     the wall itself z -0.25..0 -- and then set into its wall by position and turn. Its
     leaves hang on hinges at the jambs and swing away from the room. A leaf is drawn once,
     from its hinge (x = 0) to its free edge (x = lw); a second leaf is the first mirrored. */
  function leafPanelGlass(col) {
    const colD = mulC(col, 0.86);
    return (c, lw, h) => {
      const panel = (X, Y) => X >= 0.1875 && X < lw - 0.1875 && Y >= 0.25 && Y < 1.1875;
      const glass = (X, Y) => X >= 0.1875 && X < lw - 0.1875 && Y >= 1.4375 && Y < h - 0.25;
      c.box(0, 0, -F, lw, h, F, col);
      for (const z of [F, -2 * F]) {
        // stiles and rails a voxel proud; the panel and the glass sit back
        c.box(0, 0, z, lw, h, z + F, (X, Y) => panel(X, Y) || glass(X, Y) ? undefined : col);
        c.box(0.3125, 0.375, z, lw - 0.3125, 1.0625, z + F, colD);              // the raised field
        c.box(F, 0, z, lw - F, 0.125, z + F, C.brass);                         // kick plate
      }
      // the glass: glazing bars in a cross, and a streak of light across it
      const mx = Math.floor(lw / 2 / F) * F, my = Math.floor((1.4375 + h - 0.25) / 2 / F) * F;
      c.box(0.1875, 1.4375, -F, lw - 0.1875, h - 0.25, F, (X, Y) =>
        near(X, mx) || near(Y, my) ? C.frame : ((X + Y * 0.7) % 0.7) < 0.09 ? C.glassHi : C.glass);
      for (const z of [2 * F, -3 * F]) c.box(lw - 0.25, 0.9375, z, lw - 0.1875, 1.5625, z + F, C.brass);   // pulls
    };
  }
  function leafGlass(c, lw, h) {
    c.box(0, 0, -F, lw, h, F, (X, Y) => X < 0.125 || X >= lw - 0.125 || Y < 0.3125 || Y >= h - 0.125 ? C.chromeD
      : ((X + Y * 0.7) % 0.8) < 0.1 ? C.glassHi : C.glass);
    for (const z of [F, -2 * F]) {
      c.box(0.125, 1.0, z, lw - 0.125, 1.0625, z + F, C.chrome);               // push bar
      c.box(F, 0, z, lw - F, 0.25, z + F, C.chromeD);                          // kick rail
    }
  }
  function leafClass(c, lw, h) {
    const col = C.woodL, w0 = Math.round((lw / 2 - 0.125) / F) * F, w1 = w0 + 0.25;
    const win = (X, Y) => X >= w0 && X < w1 && Y >= 1.375 && Y < 2.375;
    c.box(0, 0, -F, lw, h, F, col);
    for (const z of [F, -2 * F]) {
      c.box(0, 0, z, lw, h, z + F, (X, Y) => win(X, Y) || (X >= 0.1875 && X < lw - 0.1875 && Y >= 0.25 && Y < 1.1875) ? undefined : col);
      c.box(0.3125, 0.375, z, lw - 0.3125, 1.0625, z + F, C.wood);
      c.box(F, 0, z, lw - F, 0.125, z + F, C.chromeD);
    }
    c.box(w0, 1.375, -F, w1, 2.375, F, (X, Y) => ((X + Y) % 0.5) < 0.07 ? C.glassHi : C.glass);
    for (const z of [2 * F, -3 * F]) c.box(lw - 0.3125, 1.0, z, lw - F, 1.0625, z + F, C.chrome);    // a lever
  }
  /** A painted leaf: a trim line inset round its edge, and an emblem on its upper half. */
  function leafEmblem(col, trim, emblem) {
    return (c, lw, h) => {
      c.box(0, 0, -F, lw, h, F, col);
      const ex = lw / 2, ey = h * 0.66;
      for (const z of [F, -2 * F]) {
        c.box(0.125, 0.125, z, lw - 0.125, h - 0.125, z + F, (X, Y) =>
          Math.min(X - 0.125, lw - 0.1875 - X, Y - 0.125, h - 0.1875 - Y) < 0.001 ? trim : undefined);
        c.box(ex - 0.3125, ey - 0.3125, z, ex + 0.3125, ey + 0.3125, z + F, (X, Y) => emblem(X + c.h - ex, Y + c.h - ey) ? trim : undefined);
        c.box(F, 0, z, lw - F, 0.125, z + F, trim);
      }
      for (const z of [2 * F, -3 * F]) c.box(lw - 0.25, 1.0, z, lw - 0.1875, 1.5, z + F, C.brass);
    };
  }
  /** A stable door: green boards, a wooden frame with a brace across it, iron straps. */
  function leafBarn(c, lw, h) {
    c.box(0, 0, -F, lw, h, F, X => Math.floor(X / 0.1875) % 2 ? C.green : C.greenD);
    for (const z of [F, -2 * F]) {
      c.box(0, 0, z, lw, h, z + F, (X, Y) => {
        if (X < 0.125 || X >= lw - 0.125 || Y < 0.125 || Y >= h - 0.125 || Math.abs(Y + c.h - h / 2) < 0.0625) return C.woodL;
        const t = (Y % (h / 2)) / (h / 2);
        return Math.abs(X - t * lw) < 0.09 ? C.woodL : undefined;                 // the brace
      });
      const zz = z > 0 ? 2 * F : -3 * F;
      for (const y of [0.375, h - 0.5]) c.box(0, y, zz, 0.5, y + 0.125, zz + F, C.metal);   // strap hinges
      c.box(lw - 0.3125, 1.0, zz, lw - 0.1875, 1.375, zz + F, C.metal);                     // a ring pull
    }
  }

  /** The usual frame: an architrave proud of the wall, plinth blocks, a cornice over it. */
  function frameArch(col, head, extra) {
    return (c, w, h) => {
      const a = 0.1875;
      c.box(-w / 2 - a, 0, 0, -w / 2, h + a, F, col);
      c.box(w / 2, 0, 0, w / 2 + a, h + a, F, col);
      c.box(-w / 2, h, 0, w / 2, h + a, F, col);
      c.box(-w / 2 - a - F, 0, 0, -w / 2 - a + F, 0.3125, 2 * F, mulC(col, 0.85));
      c.box(w / 2 + a - F, 0, 0, w / 2 + a + F, 0.3125, 2 * F, mulC(col, 0.85));
      c.box(-w / 2 - a - F, h + a, 0, w / 2 + a + F, h + a + 0.125, 2 * F, head);
      c.box(-w / 2, 0, -0.25, w / 2, F, 0, C.brassD);                          // the threshold
      if (extra) extra(c, w, h);
    };
  }
  /** The doors to the track: glass doors between glass sidelights, a glass transom over all. */
  function frameTrack(c, w, h) {
    const W = 3, H = ENTRANCE.h, post = 0.125;
    const glassFn = (X, Y) => ((X * 0.8 + Y * 0.6 + 10) % 0.8) < 0.09 ? C.glassHi : C.glass;
    for (const px of [-W, -w / 2 - post, w / 2, W - post]) c.box(px, 0, -0.25, px + post, H, F, C.wood);
    c.box(-W, h, -0.25, W, h + post, F, C.wood);
    c.box(-W, H - post, -0.25, W, H, F, C.wood);
    for (const [a, b] of [[-W + post, -w / 2 - post], [w / 2 + post, W - post]]) {
      c.box(a, 0, -0.1875, b, 0.75, -F, C.wood);
      c.box(a, 0.75, -0.1875, b, h, -F, glassFn);
    }
    c.box(-W + post, h + post, -0.1875, W - post, H - post, -F, (X, Y) => ((X + W) % 1) < F ? C.wood : glassFn(X, Y));
    c.box(-w / 2, 0, -0.25, w / 2, F, 0, C.brassD);
  }

  /** What a door shows when it is open: a lit backdrop, and a floor to step out onto. */
  function backdrop(b, w, h) {
    const cv = document.createElement("canvas");
    cv.width = 64; cv.height = 128;
    const g = cv.getContext("2d"), hex = n => "#" + n.toString(16).padStart(6, "0");
    const gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, hex(b.top)); gr.addColorStop(1, hex(b.bottom));
    g.fillStyle = gr; g.fillRect(0, 0, 64, 128);
    if (b.turf) { g.fillStyle = hex(b.floor); g.fillRect(0, 104, 64, 24); g.fillStyle = "#ffffff"; g.fillRect(0, 101, 64, 3); }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), fog: false }));
    return m;
  }
  function makeDoor(d) {
    const g = new THREE.Group();
    g.position.set(d.x, 0, d.z); g.rotation.y = d.yaw;
    const n = d.leaves || 1, lw = d.w / n, pivots = [];
    const lc = canvas(F, 11); d.leaf(lc, lw, d.h);
    const geo = lc.mesh();
    for (let i = 0; i < n; i++) {
      const p = new THREE.Group(), m = new THREE.Mesh(geo, MAT);
      p.position.set(i ? d.w / 2 : -d.w / 2, 0, -0.125);
      if (i) m.scale.x = -1;                         // the second leaf, mirrored, hinged on the right
      /* A sliding leaf runs into a pocket inside the wall, so it is made thinner than the
         wall: as thick as it, its faces would lie in the wall's own and flicker through them. */
      if (d.slide) m.scale.z = 0.7;
      m.receiveShadow = true;
      p.add(m); g.add(p); pivots.push({ p, s: i ? -1 : 1, x0: p.position.x });
    }
    if (d.frame) {
      const fc = canvas(F, 12); d.frame(fc, d.w, d.h);
      const fm = new THREE.Mesh(fc.mesh(), MAT); fm.receiveShadow = true; g.add(fm);
    }
    // beyond it, just past where the leaves swing to
    const deep = 0.125 + lw + 0.3, bw = d.w + (d.wide || 1.5), bh = d.h + 2.5;
    const back = backdrop(d.beyond, bw, bh);
    back.position.set(0, bh / 2 - 0.25, -deep); g.add(back);
    if (d.beyond.turf || d.beyond.out) skyDoors.push(back);          // outdoors: it takes the hour's light (daylight)
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(bw, deep), new THREE.MeshBasicMaterial({ color: d.beyond.floor }));
    fl.rotation.x = -PI / 2; fl.position.set(0, 0.002, -deep / 2 - 0.125); g.add(fl);
    return { g, pivots, open: 0, target: 0, x: d.x, z: d.z, yaw: d.yaw, w: d.w, h: d.h, back, slide: d.slide || 0, lw };
  }
  /* A hinged door swings its leaves away from the room; a sliding one (`slide`: which way
     along the wall, -1 or 1) runs its leaf along the track into the wall beside the opening. */
  function swingDoor(d, dt) {
    d.open += clamp(d.target - d.open, -dt * 1.7, dt * 1.7);
    const a = ease(d.open);
    for (const p of d.pivots) {
      if (d.slide) p.p.position.x = p.x0 + d.slide * a * d.lw * 0.94;
      else p.p.rotation.y = p.s * a * 1.5;
    }
  }

  /** A painted sign: words on a board, for doors and the notice board. */
  function sign(text, w, h, bg, fg) {
    const cv = document.createElement("canvas");
    cv.width = 512; cv.height = Math.round(512 * h / w);
    const tex = new THREE.CanvasTexture(cv);
    const paint = () => {
      const g = cv.getContext("2d");
      g.fillStyle = bg; g.fillRect(0, 0, cv.width, cv.height);
      g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 8; g.strokeRect(10, 10, cv.width - 20, cv.height - 20);
      g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle";
      g.font = `400 ${Math.round(cv.height * 0.42)}px "Dela Gothic One", "Arial Black", sans-serif`;
      g.fillText(text, cv.width / 2, cv.height / 2 + 4);
      tex.needsUpdate = true;
    };
    paint();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(paint);
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
  }
  function hangSign(g, text, x, y, z, yaw, scale, bg, fg) {
    const s = sign(text, 3, 0.55, bg || "#2c3354", fg || "#f6efdc");
    s.position.set(x, y, z); s.rotation.y = yaw || 0; s.scale.setScalar(scale || 1);
    g.add(s);
  }

  // ================================================================ the main hall
  /* Metres. The hall runs along x; the back wall, with the mezzanine over it, is at
     z = -11, and the camera looks at it from the open side, as the game's does. */
  const HALL = { x0: -24, x1: 24, z0: -11, z1: 15, h: 11 };
  const WALK = { x0: -23.5, x1: 23.5, z0: -10.6, z1: 7.5 };
  const MEZZ = { z: -7, y: 5 };
  const COLS = [-20, -12, -4, 4, 12, 20];               // under the mezzanine edge
  const PILLARS = [[-11, 2.5], [11, 2.5]];              // the two out in the hall
  const ENTRANCE = { z0: -4, z1: 2, h: 4.25 };

  const HALL_DOORS = {
    office: { x: 0, z: HALL.z0, yaw: 0, w: 3, h: 3, leaves: 2, leaf: leafPanelGlass(C.doorBlue), frame: frameArch(C.frame, C.colCap),
              beyond: { top: 0xf6e6c8, bottom: 0xc8966a, floor: 0xb07a48 } },
    class:  { x: 19, z: HALL.z0, yaw: 0, w: 1.5, h: 2.75, leaf: leafClass,
              frame: frameArch(C.woodD, C.woodD, (c, w) => {
                // the room's plate beside the door
                c.box(w / 2 + 0.3125, 1.9375, 0, w / 2 + 0.6875, 2.1875, F, (X, Y) =>
                  near(Y, 1.9375) || near(Y, 2.125) || near(X, w / 2 + 0.3125) || near(X, w / 2 + 0.625) ? C.panel
                    : (Y > 2.0 && Y < 2.07 && X > w / 2 + 0.375 && X < w / 2 + 0.6) ? C.panel : 0xf6f2e8);
              }),
              beyond: { top: 0xeef2ea, bottom: 0xc8d4c0, floor: 0xc8a878 } },
    library: { x: -18, z: HALL.z0, yaw: 0, w: 3, h: 3.25, leaves: 2, leaf: leafPanelGlass(C.woodL), frame: frameArch(C.woodD, C.woodD),
               beyond: { top: 0xf4e6c8, bottom: 0xc8946a, floor: C.libFloor } },
    scout:  { x: HALL.x1, z: -5.5, yaw: -PI / 2, w: 2.5, h: 3, leaves: 2, leaf: leafEmblem(0xb8343a, C.fringe, star),
              frame: frameArch(C.fringe, C.brassD), beyond: { top: 0xf6e2d6, bottom: 0xd8a890, floor: 0xa86a4a } },
    dorm:   { x: HALL.x1, z: 0.5, yaw: -PI / 2, w: 2.5, h: 3, leaves: 2, leaf: leafEmblem(C.woodL, C.brass, horseshoe),
              frame: frameArch(C.woodD, C.woodD), beyond: { top: 0xf4ead8, bottom: 0xd8c0a0, floor: 0xb89068 } },
    track:  { x: HALL.x0, z: -1, yaw: PI / 2, w: 3, h: 3.25, leaves: 2, leaf: leafGlass, frame: frameTrack, wide: 4,
              beyond: { top: 0xbfe0f6, bottom: 0xf8f6e8, floor: 0x7ab85a, turf: true } },
    cafe:   { x: HALL.x0, z: -7.5, yaw: PI / 2, w: 2.5, h: 3, leaves: 2, leaf: leafPanelGlass(0xd8b890), frame: frameArch(C.frame, C.colCap),
              beyond: { top: 0xf8f0e0, bottom: 0xe2dccf, floor: 0xe2dccf } },
  };

  function hallShell() {
    const c = canvas(S, 1987), { box, clear, jit, v } = c;
    const vi = m => Math.round(m / S);
    // floor: two-metre marble squares, grout between, a darker band along the walls
    box(HALL.x0, -0.25, HALL.z0, HALL.x1, 0, HALL.z1, (X, Y, Z) => {
      const x = X - HALL.x0, z = Z - HALL.z0;
      if (x < 1 || x > (HALL.x1 - HALL.x0) - 1) return jit(C.border, 0.03);
      if (x % 2 < S || z % 2 < S) return C.grout;
      return jit((Math.floor(x / 2) + Math.floor(z / 2)) % 2 ? C.floorA : C.floorB, 0.025);
    });
    // the red runner under the mezzanine, gold at its edge
    box(HALL.x0, -0.25, HALL.z0, HALL.x1, 0, -9, (X, Y, Z) => Z >= -9.25 ? C.carpetEdge : jit(C.carpet, 0.04));
    // the walls: skirting, navy panelling, a wooden rail, cream above
    const wallFn = (X, Y) => Y < 0.25 ? C.skirt : Y < 1.25 ? C.panel : Y < 1.5 ? C.rail : (Y > 9 ? C.wallTop : C.wall);
    box(HALL.x0, 0, HALL.z0 - 0.25, HALL.x1, HALL.h, HALL.z0, wallFn);
    box(HALL.x0 - 0.25, 0, HALL.z0, HALL.x0, HALL.h, HALL.z1, wallFn);
    box(HALL.x1, 0, HALL.z0, HALL.x1 + 0.25, HALL.h, HALL.z1, wallFn);
    // upper windows over the mezzanine
    for (let x = -22; x <= 22; x += 4) {
      box(x - 1.25, 6.5, HALL.z0 - 0.25, x + 1.25, 9.75, HALL.z0, C.frame);
      box(x - 1, 6.75, HALL.z0 - 0.25, x + 1, 9.5, HALL.z0, (X, Y) => (Y > 8.1 && Y < 8.35) ? C.frame : C.window);
    }
    // the front wall: tall windows, the academy's main doors standing open. The camera is
    // always on this side of it; it is only ever seen through the office's window
    box(HALL.x0, 0, HALL.z1, HALL.x1, HALL.h, HALL.z1 + 0.25, (X, Y) => {
      const u = ((X % 4) + 4) % 4;
      if (Y >= 1.5 && Y < 4.5 && u >= 1 && u < 3 && Math.abs(X) > 3) return Y >= 2.75 && Y < 3.0 ? C.frame : C.window;
      if (Y >= 6.5 && Y < 9.5 && u >= 1 && u < 3) return C.window;
      return wallFn(X, Y);
    });
    clear(-2, 0, HALL.z1, 2, 4, HALL.z1 + 0.25);
    // the window into the trainer's office, beside its door (what it shows: paintWindow)
    clear(HALL_WINDOW.x0, HALL_WINDOW.y0, HALL.z0 - 0.25, HALL_WINDOW.x1, HALL_WINDOW.y1, HALL.z0);
    // (no ceiling: the camera never looks that far up)
    // the mezzanine: its floor, a wooden edge, a balustrade
    box(HALL.x0, MEZZ.y, HALL.z0, HALL.x1, MEZZ.y + 0.5, MEZZ.z, (X, Y, Z) => Z >= MEZZ.z - 0.25 ? C.mezzEdge : C.mezz);
    for (let x = vi(HALL.x0); x < vi(HALL.x1); x++) {
      if (x % 2 === 0) for (let y = vi(MEZZ.y + 0.5); y < vi(MEZZ.y + 1.5); y++) v.set(x, y, vi(MEZZ.z) - 1, C.baluster);
      v.set(x, vi(MEZZ.y + 1.5), vi(MEZZ.z) - 1, C.rail);
    }
    // columns under it, and the two pillars out in the hall
    const column = (cx, cz, w, top) => {
      box(cx - w / 2 - 0.25, 0, cz - w / 2 - 0.25, cx + w / 2 + 0.25, 0.5, cz + w / 2 + 0.25, C.colBase);
      box(cx - w / 2, 0.5, cz - w / 2, cx + w / 2, top, cz + w / 2, () => jit(C.column, 0.015));
      box(cx - w / 2 - 0.25, top - 0.5, cz - w / 2 - 0.25, cx + w / 2 + 0.25, top, cz + w / 2 + 0.25, C.colCap);
    };
    for (const cx of COLS) column(cx, MEZZ.z + 0.5, 1, MEZZ.y);
    for (const [cx, cz] of PILLARS) column(cx, cz, 1.25, HALL.h);
    // drapery: burgundy swags between the columns, gold fringe, a teal crystal in each
    for (let i = 0; i < COLS.length - 1; i++) {
      const a = COLS[i] + 0.75, b = COLS[i + 1] - 0.75, mid = (a + b) / 2, half = (b - a) / 2;
      for (let x = vi(a); x < vi(b); x++) {
        const k = (x * S - mid) / half, yb = MEZZ.y - 0.25 - 1.1 * (1 - k * k);
        for (let y = vi(yb); y < vi(MEZZ.y); y++)
          v.set(x, y, vi(MEZZ.z), y === vi(yb) ? C.fringe : (((x + y) % 5) ? C.drape : C.drapeD));
      }
      const cy = MEZZ.y - 1.6;
      v.set(vi(mid), vi(cy), vi(MEZZ.z), C.crystal); v.set(vi(mid), vi(cy) - 1, vi(MEZZ.z), C.crystal);
      v.set(vi(mid), vi(cy) + 1, vi(MEZZ.z), C.fringe);
    }
    // the doorways: the doors themselves hang in them (makeDoor)
    for (const id in HALL_DOORS) {
      const d = HALL_DOORS[id];
      if (id === "track") clear(HALL.x0 - 0.25, 0, ENTRANCE.z0, HALL.x0, ENTRANCE.h, ENTRANCE.z1);
      else if (d.yaw === 0) clear(d.x - d.w / 2, 0, HALL.z0 - 0.25, d.x + d.w / 2, d.h, HALL.z0);
      else if (d.x < 0) clear(HALL.x0 - 0.25, 0, d.z - d.w / 2, HALL.x0, d.h, d.z + d.w / 2);
      else clear(HALL.x1, 0, d.z - d.w / 2, HALL.x1 + 0.25, d.h, d.z + d.w / 2);
    }
    // the camera is always inside: no floor's underside, no wall's outside
    return c.mesh((X, Y, Z, nx, ny, nz) => !(ny < 0 && Y < 0) && !(nz < 0 && Z < HALL.z0 - 0.2)
      && !(nz > 0 && Z >= HALL.z1) && !(nx < 0 && X < HALL.x0 - 0.2) && !(nx > 0 && X >= HALL.x1));
  }

  // ---- the hall's furniture, at the fine grain
  function noticeBoard(c) {
    const z = HALL.z0, x0 = -10.75, x1 = -7.25, y0 = 1.5, y1 = 3.25;
    c.box(x0, y0, z, x1, y1, z + 0.1875, C.woodD);                                     // the frame
    c.clear(x0 + 0.125, y0 + 0.125, z + 0.125, x1 - 0.125, y1 - 0.125, z + 0.1875);
    c.box(x0 + 0.125, y0 + 0.125, z + F, x1 - 0.125, y1 - 0.125, z + 0.125, () => c.rnd() < 0.12 ? C.corkD : c.jit(C.cork, 0.06));
    c.box(x0, y0 - F, z, x1, y0, z + 0.25, C.wood);                                    // a ledge under it
    const SHEETS = [
      { x: -10.5, y: 1.875, w: 0.5, h: 0.75, c: 0xf6f2e8, k: "list", pin: 0xd8302a },
      { x: -9.875, y: 2.3125, w: 0.5, h: 0.6875, c: 0xf0c8d8, k: "list", pin: 0x3a8ad0 },
      { x: -9.25, y: 1.75, w: 0.75, h: 0.5625, c: 0xc8e0f0, k: "poster", pin: 0xf0c040 },
      { x: -9.25, y: 2.4375, w: 0.5, h: 0.5, c: 0xf6e0a0, k: "list", pin: 0xd8302a },
      { x: -8.375, y: 1.9375, w: 0.625, h: 0.875, c: 0xf6f2e8, k: "grid", pin: 0x5ab84a },
      { x: -7.6875, y: 2.25, w: 0.3125, h: 0.5, c: 0xd8f0c8, k: "list", pin: 0x3a8ad0 },
    ];
    for (const s of SHEETS) {
      const top = s.y + s.h;
      c.box(s.x, s.y, z + 0.125, s.x + s.w, top, z + 0.1875, (X, Y) => {
        const u = X - s.x, d = top - Y;                     // across it, and down from its top
        const inside = u > F / 2 && u < s.w - F * 1.5;
        if (s.k === "poster") {
          if (d < 0.1875) return inside && d > F / 2 ? 0x2c3354 : s.c;                   // its title
          if (Y < s.y + 0.1875) return 0x5ab84a;                                         // turf
          if (Y < s.y + 0.25) return 0xf6f6f6;                                           // the rail
          return s.c;
        }
        if (s.k === "grid") {                                                            // a calendar
          if (d < 0.125) return inside && d > F / 2 ? 0xd8302a : s.c;
          const gx = (u - F) % 0.125, gy = (d - 0.1875) % 0.125;
          return inside && d > 0.1875 && Y > s.y + F / 2 && (gx < F / 2 || gy < F / 2) ? 0x9aa0ac : s.c;
        }
        // a list: a heading, then lines of writing of uneven lengths
        if (d < 0.125) return d > F / 2 && u > F / 2 && u < s.w * 0.7 ? 0x3c4660 : s.c;
        const row = Math.floor((d - 0.1875) / F + 1e-6);
        return d >= 0.1875 && row % 2 === 0 && u > F / 2 && u < s.w - F - ((row * 5) % 3) * F * 2 && Y > s.y + F / 2 ? 0x8a90a0 : s.c;
      });
      const px = Math.round((s.x + s.w / 2) / F) * F;
      c.box(px, top - 0.125, z + 0.1875, px + F, top - F, z + 0.25, s.pin);              // its pin
    }
  }
  function bench(c, x0, x1, col) {
    const z0 = -10.625, z1 = -9.8125, top = 0.5, colD = mulC(col, 0.82);
    for (const ex of [x0 + F, x1 - 0.1875]) {
      c.box(ex, 0, z0 + F, ex + 0.125, top - F, z0 + 0.1875, C.metal);               // legs
      c.box(ex, 0, z1 - 0.1875, ex + 0.125, top - F, z1 - F, C.metal);
      c.box(ex, top - 0.125, z0, ex + 0.125, top - F, z1, C.metal);                  // the rail under the seat
      c.box(ex, top - F, z0, ex + 0.125, 1.0625, z0 + 0.125, C.metal);               // the back's post
      c.box(ex, 0.6875, z0 + 0.125, ex + 0.125, 0.75, z1 - 0.125, C.metal);          // the arm
      c.box(ex, top, z1 - 0.1875, ex + 0.125, 0.6875, z1 - 0.125, C.metal);
    }
    for (let i = 0; i < 4; i++) {                                                    // the seat's slats
      const sz = z0 + F + i * 0.1875;
      c.box(x0, top - F, sz, x1, top, sz + 0.125, () => i === 3 ? colD : c.jit(col, 0.03));
    }
    for (const y of [0.625, 0.875]) c.box(x0, y, z0, x1, y + 0.125, z0 + F, () => c.jit(col, 0.03));
  }
  function vendingMachine(c, x0, zf) {               // x0: its left side; zf: its front
    const x1 = x0 + 1.5, zb = zf - 0.875, H = 2.125;
    c.box(x0, 0.0625, zb, x1, H, zf - F, C.vend);                                     // the cabinet
    c.box(x0 + F, 0, zb + F, x1 - F, 0.0625, zf, 0x24242c);                          // plinth
    c.box(x0, 0.0625, zf - F, x1, H, zf, C.vendFace);                                // the white front
    for (const sx of [x0, x1 - F]) c.box(sx, 1.25, zb, sx + F, 1.375, zf - F, C.vendFace);   // a stripe down each side
    // the header: a lit panel with a red wave across it
    c.box(x0 + F, 1.8125, zf, x1 - F, H - F, zf + F, (X, Y) =>
      Math.abs(Y + c.h - (1.9375 + Math.sin((X - x0) / 1.5 * 9.4) * 0.05)) < 0.04 ? 0xd8302a : 0xeaf3ff);
    // the display: three shelves of drinks behind the glass, a lit button under each
    const wx0 = x0 + 0.125, wx1 = x0 + 1.125, wy0 = 0.8125, wy1 = 1.75;
    c.box(wx0 - F, wy0 - F, zf, wx1 + F, wy1 + F, zf + F, C.chrome);                 // the window's frame
    c.clear(wx0, wy0, zf - 3 * F, wx1, wy1, zf + F);
    c.box(wx0, wy0, zf - 4 * F, wx1, wy1, zf - 3 * F, 0x1c2840);
    const DRINKS = [0xd8302a, 0x3a9ae0, 0xf0c040, 0x5ab84a, 0xf07a2a, 0xe8e8f0, 0x8a4ac8, 0xe86a9a];
    for (let r = 0; r < 3; r++) {
      const sy = wy0 + r * 0.3125;
      c.box(wx0, sy, zf - 3 * F, wx1, sy + F, zf - F, C.chrome);                     // the shelf
      for (let i = 0; i < 5; i++) {
        const cx = wx0 + F + i * 0.1875, col = DRINKS[(r * 3 + i * 2) % DRINKS.length];
        c.box(cx, sy + F, zf - 3 * F, cx + 0.125, sy + 0.25, zf - 2 * F, (X, Y) =>
          Y >= sy + 0.1875 ? 0xd8dce4 : Y >= sy + 0.125 ? 0xf6f6f6 : col);           // a can: body, label, lid
        c.box(cx, sy, zf - F, cx + F, sy + F, zf, r === 2 && i === 4 ? 0xff5a3a : 0xffd23a);
      }
    }
    // the money: a red readout, a coin slot, a note slot, the return lever
    const px0 = x0 + 1.1875, px1 = x1 - F;
    c.box(px0, 0.8125, zf, px1, 1.75, zf + F, 0x4a5060);
    c.box(px0 + F, 1.5625, zf + F, px1 - F, 1.6875, zf + 2 * F, X => near(X, px0 + 2 * F) ? 0x14161c : 0xff4a30);
    c.box(px0 + F, 1.3125, zf + F, px0 + 2 * F, 1.4375, zf + 2 * F, 0x14161c);
    c.box(px0 + F, 1.125, zf + F, px1 - F, 1.1875, zf + 2 * F, 0x14161c);
    c.box(px0 + F, 0.9375, zf + F, px0 + 3 * F, 1.0, zf + 2 * F, C.chrome);
    // where the drink drops: a dark slot behind a hinged flap
    c.clear(x0 + 0.25, 0.1875, zf - 3 * F, x0 + 1.0, 0.5, zf);
    c.box(x0 + 0.25, 0.1875, zf - 4 * F, x0 + 1.0, 0.5, zf - 3 * F, 0x14141a);
    c.box(x0 + 0.25, 0.3125, zf - F, x0 + 1.0, 0.5, zf, 0x7a808c);
    c.box(x0 + 0.5, 0.3125, zf, x0 + 0.75, 0.375, zf + F, C.chrome);
  }
  function bin(c, cx, cz, col, mark) {
    cyl(c, cx, cz, 0.25, 0, 0.8125, (X, Y) => Y >= 0.4375 && Y < 0.5625 ? 0xf4f6fa : col);
    cyl(c, cx, cz, 0.28, 0.8125, 0.875, mulC(col, 0.78));                              // the lid's rim
    cyl(c, cx, cz, 0.22, 0.875, 0.9375, mulC(col, 0.78));
    cyl(c, cx, cz, 0.09, 0.875, 0.9375, 0x1a1a20);                                     // the hole in it
    c.box(cx - F, 0.4375, cz + 0.1875, cx + F, 0.5625, cz + 0.25, mark);
  }
  function jukebox(c, cx, zf) {
    const hw = 0.75, zb = zf - 0.625, spring = 1.125, H = 1.875;
    const half = y => y < spring ? hw : hw * Math.sqrt(Math.max(0, 1 - ((y - spring) / (H - spring)) ** 2));
    // the cabinet: wood, its top an arch with a chrome crown
    c.box(cx - hw, 0, zb, cx + hw, H, zf, (X, Y) => {
      const ax = Math.abs(X + c.h - cx), hy = half(Y + c.h);
      if (ax > hy) return undefined;
      return Y + c.h > spring && hy - ax < F ? C.chrome : C.juke;
    });
    // its face, a voxel proud: bubble tubes of light round the arch, the record behind
    // dark glass, rows of title cards, a speaker grille
    c.box(cx - hw, 0.125, zf, cx + hw, H, zf + F, (X, Y) => {
      const x = X + c.h - cx, y = Y + c.h, hy = half(y), inA = hy - Math.abs(x);
      if (inA < 0) return undefined;
      if (inA < 0.125 && y > 0.25) return [0xff5a3a, 0xffa030, 0xffe070, 0x6ad0ff][Math.floor(y / 0.125 + (x < 0 ? 0 : 2)) % 4];
      if (inA < 0.1875 && y > 0.25) return C.chrome;
      if (y > 1.0) {
        const d = Math.hypot(x, y - 1.375);
        if (d < F) return 0xf2c040;                                                   // the label
        if (d < 0.25) return Math.floor(d / F) % 2 ? 0x1a1a1e : 0x2e2e36;             // grooves
        return 0x3a2a4a;
      }
      if (y > 0.9375) return C.chrome;
      if (y > 0.625) return Math.floor((y - 0.625) / F) % 2 === 0 && Math.floor((x + hw) / F) % 5 !== 0 ? 0xf6f0dc : 0x2a2a30;
      if (y > 0.5625) return Math.floor((x + hw) / F) % 2 ? C.chrome : 0xd8302a;     // the buttons
      return Math.floor((x + hw) / F) % 2 ? 0x3a2418 : C.chrome;                     // the grille
    });
  }
  /** The academy terminal, where Settings lives: a slim grey stand on a steel foot, a card
      reader and the school's green crest on its front, and a screen tilted back toward
      whoever is using it -- a blue title bar over rows of options, each with its switch. */
  function terminal(c, cx, zw) {
    const hw = 0.3125, zf = zw + 0.375, top = 1.0, head = 1.5;
    c.box(cx - 0.375, 0, zw, cx + 0.375, F, zf + 0.0625, C.chromeD);
    c.box(cx - hw, F, zw, cx + hw, top, zf, (X, Y) => Y < 0.1875 ? 0x3a3e48 : 0xdfe2e8);
    c.box(cx - 0.125, 0.4375, zf, cx + 0.125, 0.6875, zf + F, (X, Y) =>
      Math.abs(X + c.h - cx) < 0.07 && Math.abs(Y + c.h - 0.5625) < 0.07 ? 0xf2e6c0 : 0x2f6a4e);          // the crest
    c.box(cx - 0.1875, 0.8125, zf, cx + 0.1875, 0.875, zf + F, 0x2a2a30);                                   // card reader
    c.box(cx + 0.0625, 0.8125, zf + F, cx + 0.125, 0.875, zf + 2 * F, 0x5ab84a);                            // its light
    // the head, its face leaning back as it rises
    c.box(cx - 0.375, top, zw, cx + 0.375, head, zf + 0.0625, (X, Y, Z) => {
      const front = zf + 0.0625 - (Y + c.h - top) * 0.5;
      if (Z + c.h > front) return undefined;
      if (Z + F + c.h <= front) return 0xc8ccd4;                                     // the casing behind
      const x = X + c.h - cx, y = Y + c.h;
      if (Math.abs(x) > hw - F || y < top + F || y > head - F) return 0x3a3e48;       // the bezel
      if (y > head - 0.125) return 0x3a8ad0;                                         // a title bar
      const row = Math.floor((y - top - F) / 0.125);
      if (row % 2 === 0) return x > 0.1 ? (row % 4 ? 0x5ab84a : 0x8a92a0) : 0x9ab4d8;    // an option, its switch
      return 0x1e2a44;
    });
  }
  function sconce(c, x, zw, y) {
    c.box(x - F, y - 0.125, zw, x + F, y + F, zw + F, C.brass);                       // backplate
    c.box(x - F, y, zw + F, x + F, y + F, zw + 0.1875, C.brass);                      // arm
    for (let i = 0; i < 4; i++) {                                                     // the shade, narrowing
      const r = 0.1875 - i * F / 2;
      c.box(x - r, y + F + i * F, zw + 0.1875 - r, x + r, y + 2 * F + i * F, zw + 0.1875 + r, C.lit);
    }
  }
  function reception(c) {
    const x0 = -17.5, x1 = -12.5, zb = 3.5, zf = 4.5, top = 1.0625;
    c.box(x0, 0, zb, x1, top, zf, C.wood);
    // its face: pilasters, sunk panels between them, a dark kick at the foot
    c.box(x0, 0, zf, x1, top - F, zf + F, (X, Y) => {
      if (Y < 0.125) return C.woodD;
      const u = (X - x0) % 1.25;
      if (u < 0.125 || u >= 1.125 || Y > top - 0.25) return C.woodL;
      return u >= 0.25 && u < 1.0 && Y >= 0.25 && Y < top - 0.375 ? undefined : C.wood;
    });
    // the counter: cream stone, overhanging, a dark edge
    c.box(x0 - 0.125, top, zb - 0.125, x1 + 0.125, top + 0.125, zf + 0.1875, (X, Y, Z) => Z >= zf + 0.125 ? C.colBase : C.colCap);
    const t = top + 0.125;
    // a service bell
    cyl(c, -13.5, 4.125, 0.09375, t, t + F, 0x2a2a30);
    cyl(c, -13.5, 4.125, 0.0625, t + F, t + 0.125, C.brass);
    c.box(-13.5625, t + 0.125, 4.0625, -13.4375, t + 0.1875, 4.1875, C.brass);
    // leaflets, fanned
    for (let i = 0; i < 4; i++) c.box(-16.75 + i * F, t + i * F, 3.875, -16.25 + i * F, t + (i + 1) * F, 4.25, [0xf6f2e8, 0x8ac0e8, 0xf0c8d8, 0xf6e0a0][i]);
    // the monitor, its back to the hall, on a stand
    c.box(-15.375, t, 3.75, -14.625, t + F, 4.0, 0x3a3e48);
    c.box(-15.0625, t + F, 3.8125, -14.9375, t + 0.25, 3.9375, 0x3a3e48);
    c.box(-15.5, t + 0.25, 3.75, -14.5, t + 0.75, 3.8125, 0x2a2e38);
    c.box(-15.0625, t + 0.4375, 3.8125, -14.9375, t + 0.5625, 3.875, C.chromeD);
    // a pot of pens
    cyl(c, -16.0, 4.125, 0.0625, t, t + 0.125, 0x3a8ad0);
    c.box(-16.0625, t + 0.125, 4.0625, -16.0, t + 0.25, 4.125, 0xd8302a);
    c.box(-16.0, t + 0.125, 4.125, -15.9375, t + 0.3125, 4.1875, 0x2a2a3a);
  }
  function hallProps() {
    const c = canvas(F, 2024);
    noticeBoard(c);
    bench(c, -5.5, -2.5, C.benchO);
    bench(c, 2.75, 5.75, C.benchY);
    vendingMachine(c, 6.25, -10.0625);
    bin(c, 8.25, -10.5, 0x3a8ad0, C.leafL);
    bin(c, 8.9375, -10.5, 0xb8bcc6, 0xf6f2e8);
    jukebox(c, 13, -10.25);
    terminal(c, 14.875, HALL.z0);
    for (const x of [-13.5, 5.75, 15.5]) sconce(c, x, HALL.z0, 2.5);
    // bookcases either side of the library's doors
    bookcase(c, { a0: -22.5, a1: -20.0, b: HALL.z0, dir: 1, h: 2.5 });
    bookcase(c, { a0: -16.0, a1: -14.0, b: HALL.z0, dir: 1, h: 2.5 });
    // the office window's frame on this side: white, its glazing bars where the office's are
    {
      const W = HALL_WINDOW, z = HALL.z0;
      c.box(W.x0 - 0.1875, W.y0 - 0.1875, z, W.x1 + 0.1875, W.y1 + 0.1875, z + F, C.frame);
      c.clear(W.x0, W.y0, z, W.x1, W.y1, z + F);
      for (const bx of [-3.6875, -5.375]) c.box(bx, W.y0, z - 0.1875, bx + F, W.y1, z - 0.125, C.frame);
      c.box(W.x0, 2.75, z - 0.1875, W.x1, 2.8125, z - 0.125, C.frame);
      c.box(W.x0 - 0.25, W.y0 - F, z, W.x1 + 0.25, W.y0, z + 0.25, C.frame);          // the sill
    }
    for (const [x, z] of [[-13, -10.2], [10.25, -10.2], [16.25, -10.2], [-23, 6.5], [23, 6.5]]) plant(c, x, z, 1);
    reception(c);
    return c.mesh(notUnder);
  }

  /* Each mode's place: where to stand to use it (`x`, `z`), which way she faces there,
     where its tag floats (`ax`, `ay`, `az`), and the door she goes through, if any. A
     place with `room` leads to another room, arriving through that room's place `arrive`. */
  const HALL_PLACES = {
    career:   { station: "career", x: 0, z: -9.4, face: PI, ax: 0, ay: 3.9, az: -10.8, door: "office", room: "office", arrive: "hall" },
    quests:   { station: "quests", x: -9, z: -9.4, face: PI, ax: -9, ay: 3.7, az: -10.8 },
    library:  { label: "Library", sub: "Deck archive", icon: "book", x: -18, z: -9.4, face: PI, ax: -18, ay: 4.45, az: -10.8,
                door: "library", room: "library", arrive: "hall" },
    settings: { station: "settings", x: 14.875, z: -9.75, face: PI, ax: 14.875, ay: 2.15, az: -10.7 },
    tutorial: { station: "tutorial", x: 19, z: -9.4, face: PI, ax: 19, ay: 3.9, az: -10.8, door: "class", room: "school", arrive: "hall" },
    race:     { station: "race", x: -22.4, z: -1, face: -PI / 2, ax: -23.8, ay: 5.1, az: -1, door: "track" },
    scout:    { station: "scout", x: 22.4, z: -5.5, face: PI / 2, ax: 23.8, ay: 3.9, az: -5.5, door: "scout", room: "track", arrive: "hall" },
    stable:   { station: "stable", x: 22.4, z: 0.5, face: PI / 2, ax: 23.8, ay: 3.9, az: 0.5, door: "dorm", room: "dorm", arrive: "hall" },
    howto:    { station: "howto", x: -15, z: 5.4, face: PI, ax: -15, ay: 2.4, az: 4 },
    cafe:     { label: "Cafeteria", sub: "Lunch is on", icon: "carrot", x: -22.4, z: -7.5, face: -PI / 2, ax: -23.8, ay: 3.9, az: -7.5,
                door: "cafe", room: "cafe", arrive: "hall" },
  };
  /* Where the others go when they are not just walking about. */
  const HALL_POIS = [
    { x: 6.9, z: -9.4, face: PI, act: "drink", icon: "juice" },
    { x: -9.6, z: -9.6, face: PI, act: "read", icon: "clipboard" },
    { x: -8.3, z: -9.6, face: PI, act: "read", icon: "clipboard" },
    { x: 12.6, z: -9.4, face: PI, act: "listen", icon: "sparkle" },
    { x: -21.75, z: -9.95, face: PI, act: "browse", icon: "book" },
    { x: -20.75, z: -9.95, face: PI, act: "browse" },
    { x: -15.0, z: -9.95, face: PI, act: "browse", icon: "book" },
    { x: -4.75, z: -10.1, face: 0, act: "sit" }, { x: -3.25, z: -10.1, face: 0, act: "sit" },
    { x: 3.5, z: -10.1, face: 0, act: "sit" }, { x: 5, z: -10.1, face: 0, act: "sit", icon: "carrot" },
    { x: -15.6, z: 5.4, face: PI, act: "ask", icon: "info" },
    { x: -21.6, z: 0.5, face: -PI / 2, act: "look" },
    { x: 17.6, z: -9.2, face: PI, act: "look" },
  ];
  /* Where they gather to talk: two or three around a point. */
  const HALL_HUDDLES = [[-6, -3.5], [2, -2.5], [8.5, 1.5], [-15.5, -1], [16, -4], [-3, 4.5], [14.5, 5]];
  // to a racer walking the hall, a classmate's word; to the trainer, the lines below
  /* The academy's own people, not racers, each at a post: Tazuna Hayakawa at the information
     desk, beside its monitor (not behind it, where it would hide her face). They stay where
     they work, look up when someone comes near, and have a word for them. Made like the
     trainer (kit.trainer.make), dressed outside the creator's lists. */
  const STAFF = {
    hall: [{ id: "staff-tazuna", name: "Tazuna Hayakawa", x: -14.0, z: 2.95, yaw: 0, monitor: -1,
             trainer: { sex: "f", style: "long", attire: "suit", bottoms: "skirt",
                        custom: { colour: 0x3a9a4a, hair: 0x6a3a26, eyes: 0x3aa070, tie: 0xf0c040,
                                  hat: { c: 0x3a9a4a, band: 0xf0c040 }, legs: 0x2a2a30, shoes: 0xd8a83a } },
             lines: ["Welcome to Tracen! Anything I can help with?", "New here? Ask away -- the rules are all in my folder.",
                     "Busy day today. Good luck out there!", "Today's requests are up on the notice board.",
                     "Don't forget to rest your racers now and then."] }],
    office: [],
    // the cafeteria's cook, behind the counter at the pans: an apron and a cap over her whites
    cafe: [{ id: "staff-cook", name: "The cook", x: -1.0, z: -6.5, yaw: 0, monitor: 0, work: "ladle",
             trainer: { sex: "f", style: "bun", attire: "polo", bottoms: "trousers",
                        custom: { colour: 0xf2c4c8, hair: 0x3a2a22, apron: 0xfaf8f2, hat: { c: 0xfaf8f2, band: 0xfaf8f2 },
                                  shoes: 0xf2f2f2 } },
             lines: ["Today's special is the carrot hamburg steak!", "Eat up -- you've got training this afternoon.",
                     "Seconds? Of course. Thirds? ...We'll see.", "Oguri-chan's been back four times already.",
                     "Don't leave your vegetables, now."] }],
    dorm: [], room: [],
  };
  const HALL_PEER_LINES = ["Morning!", "Did you see the new schedule?", "Let's do our best today!", "Training together later?",
                           "The cafeteria has carrot cake today.", "Race you to the track!", "My legs feel great today!"];
  const HALL_LINES = ["Morning, Trainer!", "Did you see the new schedule?", "Let's do our best today!",
                      "I'm off to practice.", "The cafeteria has carrot cake today.", "My legs feel great!",
                      "Are you training with us later?", "One more lap after class!", "The race is this weekend..."];
  // obstacles, as boxes on the floor (with a little margin), for walking around
  const HALL_BLOCKS = [
    ...COLS.map(x => [x - 0.85, MEZZ.z - 0.35, x + 0.85, MEZZ.z + 1.35]),
    ...PILLARS.map(([x, z]) => [x - 1, z - 1, x + 1, z + 1]),
    [6.1, -11, 7.9, -9.6], [7.9, -11, 9.4, -10.1], [12.1, -11, 13.9, -9.7], [14.4, -11, 15.35, -10.45],
    [-5.6, -11, -2.4, -9.6], [2.65, -11, 5.85, -9.6],
    [-13.5, -11, -12.5, -9.7], [9.75, -11, 10.75, -9.7], [15.75, -11, 16.75, -9.7],
    [-23.6, 6, -22.4, 7.1], [22.4, 6, 23.6, 7.1],
    [-17.9, 3.1, -12.1, 4.9],
    [-22.6, -11, -19.9, -10.6], [-16.1, -11, -13.9, -10.6],            // the bookcases by the library
  ];
  function hallWalkable(x, z, r) {
    if (x < WALK.x0 + r || x > WALK.x1 - r || z < WALK.z0 + r || z > WALK.z1) return false;
    for (const b of HALL_BLOCKS) if (x > b[0] - r && x < b[2] + r && z > b[1] - r && z < b[3] + r) return false;
    return true;
  }
  function buildHall(R) {
    const g = new THREE.Group();
    const shell = new THREE.Mesh(hallShell(), MAT); shell.receiveShadow = true; g.add(shell);
    const props = new THREE.Mesh(hallProps(), MAT); props.receiveShadow = true; g.add(props);
    g.add(portalPane(PORTALS.hall, officeView));
    // the glass in the windows high on the back wall and in the front wall (seen through the
    // office's window) takes the colour of the sky at this hour
    const glass = (w, h, x, y, z, yaw) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), WIN_MAT); m.position.set(x, y, z); m.rotation.y = yaw; g.add(m); };
    for (let x = -22; x <= 22; x += 4) { glass(2, 1.35, x, 7.425, HALL.z0 + 0.01, 0); glass(2, 1.15, x, 8.925, HALL.z0 + 0.01, 0); }
    for (let x = -22; x <= 22; x += 4) {
      glass(2, 3, x, 8, HALL.z1 - 0.01, PI);
      if (Math.abs(x) > 3) { glass(2, 1.25, x, 2.125, HALL.z1 - 0.01, PI); glass(2, 1.5, x, 3.75, HALL.z1 - 0.01, PI); }
    }
    for (const x of [-13.5, 5.75, 15.5]) glow(g, x, 2.75, HALL.z0 + 0.2, 1.4);         // the sconces, lit at night
    glow(g, 14.875, 1.3, HALL.z0 + 0.3, 0.7);                                            // and the terminal's screen
    R.doors = {};
    for (const id in HALL_DOORS) { const d = makeDoor(HALL_DOORS[id]); R.doors[id] = d; g.add(d.g); }
    hangSign(g, "TRAINER'S OFFICE", 0, 3.62, HALL.z0 + 0.14, 0, 0.85);
    hangSign(g, "CLASSROOM", 19, 3.34, HALL.z0 + 0.07, 0, 0.62);
    hangSign(g, "LIBRARY", -18, 3.95, HALL.z0 + 0.14, 0, 0.9);
    hangSign(g, "TO THE TRACK", HALL.x0 + 0.08, ENTRANCE.h + 0.42, -1, PI / 2, 1);
    hangSign(g, "SCOUTING", HALL.x1 - 0.08, 3.62, -5.5, -PI / 2, 0.8);
    hangSign(g, "DORMITORY", HALL.x1 - 0.08, 3.62, 0.5, -PI / 2, 0.8);
    hangSign(g, "CAFETERIA", HALL.x0 + 0.08, 3.62, -7.5, PI / 2, 0.8);
    hangSign(g, "INFORMATION", -15, 0.62, 4.58, 0, 0.62);
    hangSign(g, "NOTICE BOARD", -9, 3.55, HALL.z0 + 0.28, 0, 0.8, "#7a4e30", "#fff6dc");
    return g;
  }

  // ================================================================ the trainer's office
  /* A wood-panelled room: a big window onto the track behind the trainer's desk, the door
     back to the hall on its left, the door to the stable on its right, a whiteboard, a
     sofa and a tea table, a cabinet of trophies, shelves of race records. */
  const OFFICE = { x0: -7, x1: 7, z0: -5.5, z1: 6, h: 5.5 };
  const OW = { x0: -6.75, x1: 6.75, z0: -5.25, z1: 4.75 };
  const OFFICE_DOORS = {
    hall:   { x: -4.5, z: OFFICE.z0, yaw: 0, w: 2.5, h: 3, leaves: 2, leaf: leafPanelGlass(C.doorBlue), frame: frameArch(C.frame, C.colCap),
              beyond: { top: 0xf8f2e6, bottom: 0xe6ddca, floor: 0xe6ddca } },
    stable: { x: OFFICE.x1, z: -2.5, yaw: -PI / 2, w: 2.5, h: 3, leaves: 2, leaf: leafBarn,
              frame: frameArch(C.woodD, C.woodD, (c, w, h) => {
                c.box(-0.3125, h + 0.375, 0, 0.3125, h + 0.875, F, (X, Y) => horseshoe(X + c.h, Y + c.h - (h + 0.625)) ? C.brass : undefined);
              }),
              beyond: { top: 0xf8e8c0, bottom: 0xd8b070, floor: 0xd8b860 } },
  };
  const officeWall = (X, Y, Z) => Y < 0.25 ? C.skirt : Y < 1.0 ? C.wainscot : Y < 1.25 ? C.wainTop
    : Y >= OFFICE.h - 0.5 ? C.crown : (((X + Z) % 1.5 + 1.5) % 1.5 < S ? C.paperD : C.paper);
  /* The office has no fourth wall -- the camera stands where it would be -- except when the
     hall's window is drawn, looking in from the other side, which needs something at the far end. */
  function officeFront() {
    const c = canvas(S, 78), O = OFFICE;
    c.box(O.x0, 0, O.z1, O.x1, O.h, O.z1 + 0.25, officeWall);
    return c.mesh((X, Y, Z, nx, ny, nz) => nz < 0);
  }
  function officeShell() {
    const c = canvas(S, 77), { box, clear, jit } = c, O = OFFICE;
    // floorboards: quarter-metre planks along x, each its own shade, their joints staggered
    box(O.x0, -0.25, O.z0, O.x1, 0, O.z1, (X, Y, Z) => {
      const row = Math.round((Z - O.z0) / S), k = Math.floor((X - O.x0 + (row % 4) * 0.5) / 1.5);
      return jit([C.plankA, C.plankB, C.plankC][((row * 7 + k * 13) % 3 + 3) % 3], 0.04);
    });
    clear(-3, -0.25, -2.25, 3, 0, 2.25);                  // where the rug lies, flush with the boards
    const wallFn = officeWall;
    box(O.x0, 0, O.z0 - 0.25, O.x1, O.h, O.z0, wallFn);
    box(O.x0 - 0.25, 0, O.z0 - 0.25, O.x0, O.h, O.z1, wallFn);
    box(O.x1, 0, O.z0 - 0.25, O.x1 + 0.25, O.h, O.z1, wallFn);
    box(O.x0 - 0.25, O.h, O.z0 - 0.25, O.x1 + 0.25, O.h + 0.25, O.z1, C.ceiling);
    clear(-2.5, 1.5, O.z0 - 0.25, 2.5, 4.0, O.z0);                                     // the window onto the hall
    for (const id in OFFICE_DOORS) {
      const d = OFFICE_DOORS[id];
      if (d.yaw === 0) clear(d.x - d.w / 2, 0, O.z0 - 0.25, d.x + d.w / 2, d.h, O.z0);
      else clear(O.x1, 0, d.z - d.w / 2, O.x1 + 0.25, d.h, d.z + d.w / 2);
    }
    return c.mesh((X, Y, Z, nx, ny, nz) => !(ny < 0 && Y < 0) && !(ny > 0 && Y >= O.h) && !(nz < 0 && Z < O.z0 - 0.2)
      && !(nx < 0 && X < O.x0 - 0.2) && !(nx > 0 && X >= O.x1));
  }
  function officeProps() {
    const c = canvas(F, 4242), O = OFFICE, zw = O.z0;
    // the rug: navy, a gold border, a red one inside it, a medallion in the middle. It lies
    // in the floor (officeShell cuts its place out of the boards), its top at floor level,
    // so feet stand on it rather than in it
    c.box(-3, -F, -2.25, 3, 0, 2.25, (X, Y, Z) => {
      const e = Math.min(X + 3, 3 - F - X, Z + 2.25, 2.25 - F - Z);
      if (e < 0.125) return C.fringe;
      if (e >= 0.25 && e < 0.375) return C.rugB;
      const m = Math.abs(X + c.h) / 1.2 + Math.abs(Z + c.h) / 0.9;
      if (m < 1) return m > 0.82 ? C.fringe : m < 0.35 ? C.fringe : C.rugB;
      return C.rugA;
    });
    // raised panels along the wainscot
    const panels = (fixed, a0, a1, along) => {
      for (let a = a0 + 0.125; a + 1.0 <= a1; a += 1.25) {
        const ring = (A, Y) => near(A, a) || near(A, a + 1.0 - F) || near(Y, 0.375) || near(Y, 0.875 - F) ? C.wainTop : undefined;
        if (along === "x") c.box(a, 0.375, fixed, a + 1.0, 0.875, fixed + F, (X, Y) => ring(X, Y));
        else if (along === "z+") c.box(fixed, 0.375, a, fixed + F, 0.875, a + 1.0, (X, Y, Z) => ring(Z, Y));
        else c.box(fixed - F, 0.375, a, fixed, 0.875, a + 1.0, (X, Y, Z) => ring(Z, Y));
      }
    };
    panels(zw, -2.75, 2.75, "x");
    panels(O.x0, -5.5, 5.5, "z+");
    // the right wall's, either side of the stable door and its frame
    const sd = OFFICE_DOORS.stable, sa = sd.z - sd.w / 2 - 0.25, sb = sd.z + sd.w / 2 + 0.25;
    panels(O.x1, -5.5, sa, "z-");
    panels(O.x1, sb, 5.5, "z-");

    // the window onto the hall: a white frame, glazing bars, a sill; the hall is behind it (paintWindow)
    c.box(-2.6875, 1.3125, zw, 2.6875, 4.1875, zw + F, C.frame);
    c.clear(-2.5, 1.5, zw, 2.5, 4.0, zw + F);
    for (const bx of [-0.875, 0.8125]) c.box(bx, 1.5, zw - 0.125, bx + F, 4.0, zw - F, C.frame);
    c.box(-2.5, 2.75, zw - 0.125, 2.5, 2.8125, zw - F, C.frame);
    c.box(-2.75, 1.4375, zw, 2.75, 1.5, zw + 0.25, C.frame);                           // the sill
    // curtains either side, gathered by gold ties, and a valance with a fringe over them
    for (const [a, b] of [[-3.0, -2.6875], [2.6875, 3.0]]) {
      c.box(a, 0.375, zw, b, 4.5, zw + 0.1875, (X, Y, Z) => {
        const fold = Math.floor((X - a) / 0.125) % 2;
        if (Y >= 1.75 && Y < 1.875) return C.fringe;
        if (fold && Z >= zw + 0.125) return undefined;
        return fold ? C.greenD : C.green;
      });
    }
    c.box(-3.0, 4.25, zw, 3.0, 4.75, zw + 0.25, (X, Y) => Y < 4.3125 ? C.fringe : (Math.floor((X + 3.0) / 0.25) % 2 ? C.green : C.greenD));
    // a clock on the left wall, over the whiteboard: a white face, quarter marks, ten past ten
    {
      const x = O.x0, cz = -3.0, cy = 3.25, r = 0.3125;
      c.box(x, cy - r, cz - r, x + 2 * F, cy + r, cz + r, (X, Y, Z) => {
        const dz = Z + c.h - cz, dy = Y + c.h - cy, d = Math.hypot(dz, dy);
        if (d > r) return undefined;
        if (d > r - F) return C.woodD;
        if (X < x + F) return 0xf8f6f0;
        const a = Math.atan2(-dz, dy);                     // facing +x, her right hand is -z
        if (d > r - 2.5 * F && (Math.abs(dz) < F || Math.abs(dy) < F)) return 0x2a2a30;
        if (d < F) return 0x2a2a30;
        if (d < r - 1.5 * F && Math.abs(a - 1.05) < 0.16) return 0x2a2a30;            // the minute hand, at two
        if (d < r * 0.6 && Math.abs(a + 1.05) < 0.24) return 0x2a2a30;                // the hour hand, at ten
        return undefined;
      });
    }

    // the trainer's desk, the side toward the room panelled
    const dx0 = -1.8125, dx1 = 1.8125, dz0 = -4.0, dz1 = -3.0, top = 0.75;
    c.box(dx0, top, dz0, dx1, top + F, dz1, (X, Y, Z) => Z >= dz1 - F ? C.woodD : C.woodL);
    c.box(dx0 + F, 0, dz0 + F, dx0 + 0.8125, top, dz1 - F, C.wood);                      // pedestals
    c.box(dx1 - 0.8125, 0, dz0 + F, dx1 - F, top, dz1 - F, C.wood);
    c.box(dx0 + 0.8125, 0.25, dz1 - 0.1875, dx1 - 0.8125, top, dz1 - 0.125, C.wood);     // modesty panel
    // mouldings on the pedestals' fronts: two panels each
    c.box(dx0 + F, F, dz1 - F, dx1 - F, top - F, dz1, (X, Y) => {
      if (X >= dx0 + 0.8125 && X < dx1 - 0.8125) return undefined;
      const u = X < 0 ? X - (dx0 + F) : X - (dx1 - 0.8125);
      return u < F || u >= 0.6875 || near(Y, F) || near(Y, top - 2 * F) || near(Y, 0.375) ? C.woodL : undefined;
    });
    for (const px of [dx0 + 0.375, dx1 - 0.4375]) for (const y of [0.25, 0.5])           // drawer pulls, round the back
      c.box(px, y, dz0 - F, px + F, y + F, dz0, C.brass);
    const t = top + F;
    // a laptop (its lid's back to us), a stack of folders, a banker's lamp, a mug, a nameplate
    c.box(-0.375, t, -3.875, 0.375, t + F, -3.375, 0x8a909c);
    c.box(-0.375, t + F, -3.875, 0.375, t + 0.4375, -3.8125, (X, Y) =>
      Math.hypot(X + c.h, Y + c.h - t - 0.25) < 0.07 ? 0xf2f4f8 : 0x5a606c);
    for (let i = 0; i < 4; i++) c.box(0.75 + (i % 2) * F, t + i * F, -3.6875, 1.25 + (i % 2) * F, t + (i + 1) * F, -3.25, [0xd8302a, 0x3a6ac0, 0xf0c040, 0x3a9a4a][i]);
    cyl(c, -1.375, -3.5, 0.09375, t, t + F, C.brass);
    c.box(-1.4375, t + F, -3.5625, -1.3125, t + 0.3125, -3.4375, C.brass);
    c.box(-1.625, t + 0.3125, -3.625, -1.125, t + 0.4375, -3.375, (X, Y) => Y < t + 0.375 ? C.lit : C.green);
    cyl(c, 0.5, -3.25, 0.0625, t, t + 0.125, 0xf6f6f6);
    c.box(0.5625, t + F, -3.3125, 0.625, t + 2 * F, -3.25, 0xf6f6f6);
    c.box(-0.3125, t, -3.0625, 0.3125, t + 0.125, -3.0, (X, Y) => near(Y, t + F) && X > -0.25 && X < 0.25 ? 0x3a2418 : C.brass);
    // the chair behind it: leather, buttoned, on a five-legged base
    const ch0 = -0.4375, ch1 = 0.4375, cz0 = -4.875, cz1 = -4.25;
    c.box(-0.0625, 0.0625, -4.625, 0.0625, 0.375, -4.5, C.chromeD);
    for (const [ax, az] of [[1, 0], [0.31, 0.95], [-0.81, 0.59], [-0.81, -0.59], [0.31, -0.95]]) {
      for (let k = 0; k < 5; k++) c.box(ax * k * 0.07 - F, 0.0625, -4.5625 + az * k * 0.07 - F, ax * k * 0.07 + F, 0.125, -4.5625 + az * k * 0.07 + F, 0x2a2a30);
      c.box(ax * 0.34 - F, 0, -4.5625 + az * 0.34 - F, ax * 0.34 + F, 0.0625, -4.5625 + az * 0.34 + F, 0x1a1a1e);
    }
    c.box(ch0, 0.375, cz0, ch1, 0.5, cz1, (X, Y, Z) => Y >= 0.4375 && (Math.floor((X - ch0) / 0.1875) + Math.floor((Z - cz0) / 0.1875)) % 3 === 0 && c.rnd() < 0.3 ? C.leatherD : C.leather);
    c.box(ch0, 0.5, cz0, ch1, 1.375, cz0 + 0.125, (X, Y) => (near((X - ch0) % 0.25, 0.125) && near((Y - 0.5) % 0.25, 0.125)) ? C.leatherD : C.leather);
    for (const ax of [ch0 - F, ch1]) c.box(ax, 0.5, cz0 + 0.125, ax + F, 0.75, cz1 - F, C.leatherD);

    // shelves in the back corners: binders and records of every race
    for (const [x0, x1] of [[-6.9375, -6.0], [6.0, 6.9375]]) {
      c.box(x0, 0, -5.5, x1, 2.5, -4.9375, C.wood);
      c.clear(x0 + F, 0.125, -5.4375, x1 - F, 2.4375, -4.9375);
      for (let s = 0; s < 5; s++) {
        const y = 0.125 + s * 0.4625;
        c.box(x0 + F, y, -5.4375, x1 - F, y + F, -4.9375, C.woodD);
        if (s < 4) books(c, x0 + F, x1 - F, y + F, -5.375, -5.0, 0.375);
      }
    }
    trophy(c, -6.5, 2.5, -5.2, C.brass);
    // the whiteboard: a week of training, a race plan, magnets
    {
      const x = O.x0, z0 = -4.25, z1 = -1.75, y0 = 1.0, y1 = 2.5;
      c.box(x, y0, z0, x + F, y1, z1, (X, Y, Z) => {
        const u = Z - z0, h = y1 - Y;
        // a curve, the pace across a race, along the top
        const cy = y1 - 0.3125 - Math.sin(u / (z1 - z0) * PI * 1.3) * 0.18;
        if (Math.abs(Y + c.h - cy) < 0.04 && u > 0.125 && u < z1 - z0 - 0.125) return 0xd8302a;
        // the week, in a grid below it, with notes stuck on some days
        if (h > 0.625 && h < 1.4375 && u > 0.125 && u < z1 - z0 - 0.125) {
          const gu = (u - 0.125) % 0.4375, gh = (h - 0.625) % 0.25;
          if (gu < F / 2 || gh < F / 2) return 0x9aa0ac;
          const cell = Math.floor((u - 0.125) / 0.4375) * 7 + Math.floor((h - 0.625) / 0.25) * 3;
          if (cell % 5 === 1 && gu > 0.125 && gu < 0.3125 && gh > F && gh < 0.1875) return [0xf0c040, 0xf0a0c0, 0x8ac0e8][cell % 3];
        }
        return 0xfafaf8;
      });
      c.box(x, y0 - F, z0 - F, x + 2 * F, y1 + F, z1 + F, (X, Y, Z) => Y < y0 || Y >= y1 || Z < z0 || Z >= z1 ? C.chromeD : undefined);
      c.box(x, y0 - 0.125, z0, x + 0.1875, y0 - F, z1, C.chromeD);                       // the tray
      for (const [zz, col] of [[-3.75, 0xd8302a], [-3.5, 0x3a6ac0], [-3.25, 0x2a2a30]]) c.box(x + F, y0 - F, zz, x + 0.125, y0, zz + 0.1875, col);
    }
    // a pennant over the sofa
    c.box(O.x0, 2.0, -0.25, O.x0 + F, 2.75, 1.75, (X, Y, Z) => {
      const k = (Z + 0.25) / 2, half = 0.375 * (1 - k);
      if (Math.abs(Y + c.h - 2.375) > half) return undefined;
      return Math.abs(Y + c.h - 2.375) < half * 0.3 ? C.fringe : C.green;
    });
    // the sofa, against the left wall, facing into the room
    {
      const x0 = O.x0, xs = -5.9375, z0 = -0.625, z1 = 2.25, seat = 0.5;
      c.box(x0, 0, z0, x0 + 0.125, F, z0 + 0.125, C.woodD); c.box(xs - 0.125, 0, z0, xs, F, z0 + 0.125, C.woodD);
      c.box(x0, 0, z1 - 0.125, x0 + 0.125, F, z1, C.woodD); c.box(xs - 0.125, 0, z1 - 0.125, xs, F, z1, C.woodD);
      c.box(x0, F, z0, xs, 0.3125, z1, C.greenD);                                         // the base
      c.box(x0 + 0.25, 0.3125, z0 + 0.1875, xs, seat, z1 - 0.1875, (X, Y, Z) => {
        if (near(Z, 0.8125)) return C.greenD;                                           // the seam between the cushions
        return X >= xs - F && near(Y, seat - F) ? C.fringe : C.green;                   // piping along the front
      });
      c.box(x0, 0.3125, z0, x0 + 0.25, 1.0625, z1, C.greenD);                             // the back
      c.box(x0 + 0.25, seat, z0 + 0.1875, x0 + 0.4375, 0.9375, z1 - 0.1875, (X, Y, Z) => near(Z, 0.8125) ? C.greenD : C.greenL);
      for (const [a, b] of [[z0, z0 + 0.1875], [z1 - 0.1875, z1]]) c.box(x0, 0.3125, a, xs, 0.75, b, (X, Y) => Y >= 0.6875 && X >= xs - F ? undefined : C.greenD);
      c.box(x0 + 0.4375, seat, z0 + 0.1875, x0 + 0.6875, 0.8125, z0 + 0.5, 0xf2e6c8);   // cushions at the ends
      c.box(x0 + 0.4375, seat, z1 - 0.5, x0 + 0.6875, 0.8125, z1 - 0.1875, C.fringe);
    }
    // the tea table in front of it, a pot and cups and a plate of carrot biscuits
    {
      const x0 = -4.8125, x1 = -4.0, z0 = 0.1875, z1 = 1.4375, top = 0.375;
      c.box(x0, top, z0, x1, top + F, z1, C.woodD);
      for (const [lx, lz] of [[x0 + F, z0 + F], [x1 - 2 * F, z0 + F], [x0 + F, z1 - 2 * F], [x1 - 2 * F, z1 - 2 * F]]) c.box(lx, 0, lz, lx + F, top, lz + F, C.woodD);
      const tt = top + F, china = 0xf8f6f0;
      cyl(c, -4.4375, 0.8125, 0.125, tt, tt + 0.1875, (X, Y) => near(Y, tt + F) ? C.brass : china);   // the pot, banded in gold
      c.box(-4.5, tt + 0.1875, 0.75, -4.375, tt + 0.25, 0.875, C.brass);                              // its lid's knob
      c.box(-4.6875, tt + F, 0.75, -4.5625, tt + 2 * F, 0.875, china);                                // the spout
      c.box(-4.3125, tt + F, 0.75, -4.25, tt + 0.1875, 0.875, china);                                 // the handle
      for (const [cx, cz] of [[-4.625, 0.4375], [-4.25, 0.4375]]) {                                   // cups on saucers
        cyl(c, cx, cz, 0.09375, tt, tt + F, china);
        c.box(cx - F, tt + F, cz - F, cx + F, tt + 3 * F, cz + F, (X, Y) => near(Y, tt + 2 * F) ? 0x8a4a22 : china);
      }
      cyl(c, -4.375, 1.25, 0.125, tt, tt + F, china);                                                // a plate of carrot biscuits
      for (const [bx, bz] of [[-4.4375, 1.1875], [-4.3125, 1.25], [-4.4375, 1.3125], [-4.375, 1.125]]) c.box(bx, tt + F, bz, bx + F, tt + 2 * F, bz + F, 0xf08a24);
    }
    // the trophy cabinet on the right wall: a cupboard below, three shelves of silverware above
    {
      const x0 = 6.375, x1 = O.x1, z0 = 0.25, z1 = 3.125, top = 2.5;
      c.box(x0, 0, z0, x1, top, z1, C.wood);
      c.clear(x0, 0.875, z0 + F, x1 - F, top - 0.125, z1 - F);
      c.box(x1 - 2 * F, 0.875, z0 + F, x1 - F, top - 0.125, z1 - F, 0x3a2418);           // its dark back
      c.box(x0 - F, 0.0625, z0 + F, x0, 0.8125, z1 - F, (X, Y, Z) =>                     // cupboard doors, panelled
        near(Z, (z0 + z1) / 2) || near(Y, 0.0625) || near(Y, 0.75) || near(Z, z0 + F) || near(Z, z1 - 2 * F) ? C.woodL : undefined);
      for (const zz of [(z0 + z1) / 2 - 0.125, (z0 + z1) / 2 + F]) c.box(x0 - 2 * F, 0.4375, zz, x0 - F, 0.5, zz + F, C.brass);
      for (const zz of [z0 + F, z1 - 2 * F]) c.box(x0, 0.875, zz, x0 + F, top - 0.125, zz + F, C.woodL);   // the open front's frame
      const golds = [C.brass, 0xdcdfe6, C.brass, 0xc88a4a, C.brass, 0xdcdfe6, C.brass, C.brass, 0xdcdfe6];
      for (let s = 0; s < 3; s++) {
        const y = 0.875 + s * 0.5;
        c.box(x0, y, z0 + F, x1 - 2 * F, y + F, z1 - F, C.woodD);
        for (let i = 0; i < 3; i++) trophy(c, x0 + 0.3125, y + F, z0 + 0.4375 + i * 0.9375, golds[s * 3 + i]);
      }
    }
    // a sideboard against the back wall with the tea things on it, and a race poster over it
    {
      const x0 = 3.5, x1 = 5.5, z0 = zw, z1 = zw + 0.5, top = 0.875;
      c.box(x0, F, z0, x1, top, z1, C.wood);
      c.box(x0 - F, top, z0, x1 + F, top + F, z1 + F, C.woodD);
      c.box(x0 + F, 0, z0 + F, x1 - F, F, z1 - F, C.woodD);
      c.box(x0, 0.125, z1, x1, top - F, z1 + F, (X, Y) =>                                  // two doors, panelled
        near(X, x0) || near(X, x1 - F) || near(X, (x0 + x1) / 2 - F) || near(X, (x0 + x1) / 2) || near(Y, 0.125) || near(Y, top - 2 * F) ? C.woodL : undefined);
      for (const kx of [(x0 + x1) / 2 - 0.1875, (x0 + x1) / 2 + 0.125]) c.box(kx, 0.5, z1 + F, kx + F, 0.5625, z1 + 2 * F, C.brass);
      const t = top + F;
      cyl(c, 4.0, zw + 0.25, 0.125, t, t + 0.3125, (X, Y) => Y >= t + 0.25 ? 0x2a2a30 : 0xf2f4f8);   // the kettle
      c.box(3.75, t + 0.125, zw + 0.1875, 3.875, t + 0.25, zw + 0.3125, 0x2a2a30);
      for (let i = 0; i < 3; i++) c.box(4.5, t + i * F, zw + 0.125, 4.75, t + (i + 1) * F, zw + 0.375, [0xf6f6f6, 0xd8302a, 0xf6f6f6][i]);
      cyl(c, 5.125, zw + 0.25, 0.09375, t, t + 0.25, (X, Y) => Y >= t + 0.1875 ? C.brass : 0x3a6ac0);   // a tea caddy
      c.box(3.75, 1.375, zw, 5.25, 2.75, zw + F, C.woodD);
      c.box(3.8125, 1.4375, zw + F, 5.1875, 2.6875, zw + 2 * F, (X, Y) => {
        if (Y < 1.75) return 0x5ab84a;
        if (Y < 1.8125) return 0xf6f6f6;
        const dx = X + c.h - 4.5, dy = Y + c.h - 2.0;
        if (Math.hypot(dx * 1.4, dy) < 0.16 && dy > -0.12) return 0x6a3c26;              // a racer at full stretch, roughly
        return Y > 2.5 ? 0x2c3354 : 0xbfe0f6;
      });
    }
    plant(c, -6.45, 4.05, 0.9);
    plant(c, 6.45, 4.05, 0.9);
    return c.mesh(notUnder);
  }
  const OFFICE_PLACES = {
    hall:   { label: "Main hall", sub: "Back out", icon: "door", x: -4.5, z: -3.9, face: PI, ax: -4.5, ay: 3.75, az: -5.4,
              door: "hall", room: "hall", arrive: "career" },
    career: { station: "career", sub: "The stable", x: 6.0, z: -2.5, face: PI / 2, ax: 6.95, ay: 4.6, az: -2.5, door: "stable" },
  };
  /* The trainer's day, when the player is out walking as one of her racers: most of it at
     the desk (into the chair from behind the desk, `from`, and on with the work), the rest
     at the whiteboard, the window, the shelves, the trophies, the kettle, the sofa. */
  const OFFICE_POIS = [
    { x: 0, z: -4.5625, face: 0, act: "work", seat: true, from: { x: -1.15, z: -4.65 } },
    { x: 0, z: -4.5625, face: 0, act: "work", seat: true, from: { x: -1.15, z: -4.65 }, icon: "clipboard" },
    { x: -6.4, z: 0.75, face: PI / 2, act: "sit", seat: true, icon: "juice" },
    { x: -6.2, z: -3.0, face: -PI / 2, act: "read", icon: "clipboard" },
    { x: -2.3, z: -4.85, face: PI, act: "look" },
    { x: -6.35, z: -4.45, face: PI, act: "browse", icon: "book" }, { x: 6.35, z: -4.45, face: PI, act: "browse", icon: "book" },
    { x: 5.85, z: 1.7, face: PI / 2, act: "look", icon: "trophy" },
    { x: 4.5, z: -4.45, face: PI, act: "drink", icon: "juice" },
  ];
  const OFFICE_HUDDLES = [];
  /* Things she can do herself, with E (or a click) when she is by them. A seat is one of the
     seats the others use (`poi`, so whoever is in it keeps it, and nobody sits on her); a
     spot the others use is kept for her too while she is at it. `ax/ay/az`: where the hint
     floats. `needs: "held"`: only with something in her hand. */
  const HALL_THINGS = [
    ...HALL_POIS.map((p, i) => p.act === "sit" ? { kind: "sit", label: "Sit", poi: [i] } : null).filter(Boolean),
    { kind: "vend", label: "Buy a drink", poi: [0], x: 6.9, z: -9.4, face: PI, ax: 7.0, ay: 2.45, az: -10.1 },
    { kind: "bin", label: "Throw it away", needs: "held", x: 8.6, z: -9.6, face: PI, ax: 8.6, ay: 1.3, az: -10.5, at: { x: 8.6, y: 0.95, z: -10.5 } },
    // the jukebox: what plays in the hall (opts.onJukebox, the shell's chooser)
    { kind: "juke", label: "Choose the music", poi: [3], x: 13, z: -9.2, face: PI, ax: 13, ay: 2.3, az: -10.4 },
  ];
  const OFFICE_THINGS = [
    { kind: "sit", label: "Sit at the desk", work: "Get to work", poi: [0, 1] },
    { kind: "sit", label: "Sit", poi: [2] },
    { kind: "tea", label: "Make tea", put: "Put the cup down", poi: [8], x: 4.5, z: -4.45, face: PI, ax: 4.0, ay: 1.5, az: -5.2 },
    { kind: "look", label: "Look out", poi: [4], x: -2.3, z: -4.85, face: PI, ax: -1.7, ay: 2.6, az: -5.4 },
    { kind: "admire", label: "Admire the trophies", poi: [7], x: 5.85, z: 1.7, face: PI / 2, ax: 6.6, ay: 2.75, az: 1.7,
      say: ["Look at all those cups...", "One day, one of those will be ours.", "Every one of these was a hard race."] },
    { kind: "read", label: "Check the board", poi: [3], x: -6.2, z: -3.0, face: -PI / 2, ax: -6.95, ay: 2.8, az: -3.0,
      say: ["Speed work on Tuesday, then a rest.", "The next race is circled in red.", "Pace plan: hold back, then go at the turn."] },
  ];
  // what the trainer says to the racer who has come in
  const OFFICE_LINES = ["There you are, {name}. Ready for today?", "Let's go over your schedule, {name}.",
                        "Good work in the last race, {name}.", "Rest up, {name}. There's a big one coming.",
                        "The tea's still warm, if you want some.", "I've been studying your splits, {name}. Promising."];
  const OFFICE_BLOCKS = [
    [-1.9, -4.1, 1.9, -2.9], [-0.55, -5.0, 0.55, -4.15],
    [-7, -5.5, -5.9, -4.85], [5.9, -5.5, 7, -4.85],
    [-7, -0.7, -5.95, 2.3], [-4.9, 0.1, -3.9, 1.5],
    [6.3, 0.15, 7, 3.2], [3.4, -5.5, 5.6, -4.9],
    [-6.9, 3.6, -6.0, 4.5], [6.0, 3.6, 6.9, 4.5],
  ];
  function officeWalkable(x, z, r) {
    if (x < OW.x0 + r || x > OW.x1 - r || z < OW.z0 + r || z > OW.z1 - r) return false;
    for (const b of OFFICE_BLOCKS) if (x > b[0] - r && x < b[2] + r && z > b[1] - r && z < b[3] + r) return false;
    return true;
  }
  function buildOffice(R) {
    const g = new THREE.Group();
    const shell = new THREE.Mesh(officeShell(), MAT); shell.receiveShadow = true; g.add(shell);
    const props = new THREE.Mesh(officeProps(), MAT); props.receiveShadow = true; g.add(props);
    // the window looks out on the main hall, the other side of this wall (paintWindow)
    g.add(portalPane(PORTALS.office, hallView));
    glow(g, -1.375, 1.2, -3.5, 1.0);                                                    // the banker's lamp
    R.front = new THREE.Mesh(officeFront(), MAT); R.front.visible = false; g.add(R.front);
    R.doors = {};
    for (const id in OFFICE_DOORS) { const d = makeDoor(OFFICE_DOORS[id]); R.doors[id] = d; g.add(d.g); }
    hangSign(g, "MAIN HALL", -4.5, 3.6, OFFICE.z0 + 0.14, 0, 0.7);
    hangSign(g, "STABLE", OFFICE.x1 - 0.03, 4.25, -2.5, -PI / 2, 0.7, "#2f6a4e", "#f6efdc");
    return g;
  }

  // ================================================================ the time of day
  /* The academy keeps its own clock, a minute of ours to an hour of its, so a whole day goes
     by in twenty-four minutes: night, the grey before dawn, dawn, sunrise, morning, midday,
     afternoon, the golden hour, sunset, dusk, twilight, and night again. It runs off the
     real clock, so it is the same hour on every screen and carries on while she is away.
     SKY says how things look at each hour, and in between they blend:
     - the sky beyond the windows, horizon to zenith, and how dark it is out there;
     - the light in the rooms, its colour and strength;
     - where the light comes from: the sun rises past the east windows and sets past the
       west ones, leaning south at noon, and hands over to a little moonlight at night;
     - the lamps, coming on at dusk and off after sunrise. */
  const GAME_HOUR = 60000;                               // ms of ours to an hour of the academy's
  let clockShift = 0;                                    // (moved by _debug.setHour, for checking)
  const hourNow = () => (((Date.now() + clockShift) / GAME_HOUR) % 24 + 24) % 24;
  // sky: zenith and horizon; sun, sunI: the light from outside; hemi, ground, hemiI: the
  // light all round; room: what the space beyond the rooms turns to; out: how lit the grounds are
  const NIGHT = { top: 0x0a1028, low: 0x1a2448, sun: 0x8aa0d8, sunI: 0.12, hemi: 0xffd6a4, ground: 0x4a3e48, hemiI: 0.52,
                  room: 0x1c2236, out: 0x283252, lamps: 1 };
  const DAY = { top: 0x76b4e8, low: 0xeaf3f6, sun: 0xfff0d8, sunI: 0.5, hemi: 0xfff8ea, ground: 0xd6c6a6, hemiI: 0.78,
                room: 0xffffff, out: 0xffffff, lamps: 0 };
  const SKY = [
    { h: 0, ...NIGHT },
    { h: 4, ...NIGHT },
    { h: 5, top: 0x1c2858, low: 0x564a7c, sun: 0x9aa0d0, sunI: 0.15, hemi: 0xf2d4bc, ground: 0x5a4e5a, hemiI: 0.54,
      room: 0x343454, out: 0x3c4266, lamps: 0.9 },                                                     // before dawn
    { h: 5.75, top: 0x42609c, low: 0xf2a48a, sun: 0xffb090, sunI: 0.26, hemi: 0xffdcc6, ground: 0x8a7a80, hemiI: 0.6,
      room: 0x9a8aa0, out: 0x8e86a0, lamps: 0.55 },                                                    // dawn
    { h: 6.5, top: 0x6a9ad8, low: 0xffd2a0, sun: 0xffc890, sunI: 0.46, hemi: 0xfff0dc, ground: 0xc8b49a, hemiI: 0.7,
      room: 0xf0e2d0, out: 0xdccab8, lamps: 0.1 },                                                     // sunrise
    { h: 8, ...DAY },
    { h: 16, ...DAY },
    { h: 17.2, top: 0x7aa8dc, low: 0xffe2aa, sun: 0xffd090, sunI: 0.56, hemi: 0xfff0d6, ground: 0xd8c09a, hemiI: 0.74,
      room: 0xf8e6c8, out: 0xf4dcb4, lamps: 0.05 },                                                    // the golden hour
    { h: 18.25, top: 0x5a6fb0, low: 0xff9a5a, sun: 0xff9a60, sunI: 0.42, hemi: 0xffdcbc, ground: 0xa88a7a, hemiI: 0.66,
      room: 0xcc9e92, out: 0xc89888, lamps: 0.4 },                                                     // sunset
    { h: 19.25, top: 0x2e3a78, low: 0xc06a7a, sun: 0xc08aa8, sunI: 0.2, hemi: 0xf4d4c0, ground: 0x6a5a6a, hemiI: 0.57,
      room: 0x5c4e70, out: 0x5a5a7c, lamps: 0.85 },                                                    // dusk
    { h: 20.25, top: 0x16204e, low: 0x34447e, sun: 0x8a9ad8, sunI: 0.14, hemi: 0xffd8ac, ground: 0x524a5a, hemiI: 0.53,
      room: 0x262c48, out: 0x30385a, lamps: 1 },                                                       // twilight
    { h: 21.5, ...NIGHT },
    { h: 24, ...NIGHT },
  ];
  const PHASES = [[0, "Night"], [4, "Before dawn"], [5, "Dawn"], [6, "Sunrise"], [7, "Morning"], [11, "Midday"],
                  [14, "Afternoon"], [17, "Golden hour"], [18, "Sunset"], [19, "Dusk"], [20, "Twilight"], [21, "Night"]];
  const phaseOf = h => PHASES.reduce((p, [a, name]) => h >= a ? name : p, "Night");
  const SKY_COLOURS = ["top", "low", "sun", "hemi", "ground", "room", "out"], SKY_AMOUNTS = ["sunI", "hemiI", "lamps"];
  const sky = { dir: new THREE.Vector3(0, 1, 0), hour: -1 };
  for (const k of SKY_COLOURS) sky[k] = new THREE.Color();
  const skyA = new THREE.Color(), sunV = new THREE.Vector3(), MOON = new THREE.Vector3(-0.35, 0.85, 0.4).normalize();
  const between = (a, b, x) => ease(clamp((x - a) / (b - a), 0, 1));
  /** How everything looks at hour `h` (into `sky`). */
  function skyAt(h) {
    let i = 0;
    while (i < SKY.length - 2 && h >= SKY[i + 1].h) i++;
    const a = SKY[i], b = SKY[i + 1], k = between(a.h, b.h, h);
    for (const key of SKY_COLOURS) sky[key].setHex(a[key]).lerp(skyA.setHex(b[key]), k);
    for (const key of SKY_AMOUNTS) sky[key] = lerp(a[key], b[key], k);
    // the sun's arc, east (+x) at six to west at half past six, south (+z) of overhead at
    // noon; the moon through the night; one handing over to the other at dawn and at dusk
    const arc = clamp((h - 6) / 12.5, 0, 1) * PI;
    sunV.set(Math.cos(arc), 0.1 + Math.sin(arc) * 0.9, 0.12 + Math.sin(arc) * 0.45).normalize();
    const night = h < 12 ? 1 - between(4.5, 6, h) : between(18.5, 20, h);
    sky.dir.copy(sunV).lerp(MOON, night).normalize();
    sky.hour = h;
  }
  // what follows the hour besides the lights: the sky through the windows (a gradient,
  // horizon to zenith), the grounds out there (lit by the rooms' lights, so dimmed here to
  // the hour's own), the hall's windows, and the lamps' glow
  const SKY_MAT = new THREE.ShaderMaterial({
    uniforms: { top: { value: sky.top }, low: { value: sky.low } }, side: THREE.BackSide,
    vertexShader: "varying float vy; void main() { vy = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform vec3 top; uniform vec3 low; varying float vy;" +
      "void main() { gl_FragColor = vec4(mix(low, top, pow(clamp((vy + 40.0) / 80.0, 0.0, 1.0), 0.7)), 1.0); }",
  });
  const OUT_MAT = new THREE.MeshLambertMaterial({ vertexColors: true });
  const FLOODLIT = new THREE.Color(0x9a9890);              // how the floodlights leave the training track
  const outFlats = [];                                   // the grass, the path, the far trees: { m, base }
  const skyDoors = [];                                   // what shows past a door that opens outdoors (makeDoor)
  const WIN_MAT = new THREE.MeshBasicMaterial({ color: 0xc6e4f4 });
  const LAMP_MAT = new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffd28a, transparent: true, opacity: 0,
                                              depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  function glowTexture() {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 64;
    const g = cv.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,.45)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(cv);
  }
  /** A lamp's glow at (x, y, z), `s` across: nothing by day, warm at night. */
  function glow(g, x, y, z, s) {
    const m = new THREE.Sprite(LAMP_MAT);
    m.position.set(x, y, z); m.scale.setScalar(s);
    g.add(m);
  }
  /** The hour, everywhere: the lights, the sky, the grounds, the glass, the lamps, the clock. */
  function daylight() {
    skyAt(hourNow());
    hemiLight.color.copy(sky.hemi); hemiLight.groundColor.copy(sky.ground); hemiLight.intensity = sky.hemiI;
    sunLight.color.copy(sky.sun); sunLight.intensity = sky.sunI;
    OUT_MAT.color.copy(sky.out);
    // out on the training track after dark, the floodlights are on: it is lit, if not as by day
    if (room && room.outdoor) OUT_MAT.color.lerp(FLOODLIT, sky.lamps * 0.5);
    for (const f of outFlats) f.m.material.color.setHex(f.base).multiply(sky.out);
    WIN_MAT.color.copy(sky.low).lerp(sky.top, 0.35);
    LAMP_MAT.opacity = sky.lamps * 0.8;
    POOL_MAT.opacity = sky.lamps * 0.45;                        // the floodlights' light on the track
    for (const b of skyDoors) b.material.color.copy(sky.out);
    lookOf(room);
    if (clockEl) {
      // a 12-hour clock: "6:42 PM", not "18:42"
      const h = Math.floor(sky.hour), m = Math.floor((sky.hour - h) * 60);
      const text = `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
      if (clockEl.dataset.text !== text) {
        clockEl.dataset.text = text;
        const day = sky.hour >= 6 && sky.hour < 18.5;
        if (clockEl.dataset.icon !== String(day)) { clockEl.dataset.icon = String(day); clockEl.querySelector(".ci").innerHTML = root.Icon ? Icon(day ? "sun" : "moon") : ""; }
        clockEl.querySelector("b").textContent = text;
        clockEl.querySelector("i").textContent = phaseOf(sky.hour);
      }
    }
  }

  // ================================================================ out of the windows
  /* What a window in an outside wall looks onto: the academy's grounds -- a hedge under the
     window, a path, grass, trees and more trees beyond, sky over them. All of it stands on the
     far side of that wall, so it is seen through the window and from nowhere else. `x`: the
     wall's outer face; `dir`: which way is out along x (+1 or -1); `z0..z1`: how far along the
     wall it runs (never past the room's open front, where the camera would see round it);
     `gap`: z from..to, a door out through the wall -- no hedge there, where its leaves swing
     open, but a paved way out from it. */
  function outdoors(o) {
    const g = new THREE.Group(), out = d => o.x + o.dir * d, far = 90, zc = (o.z0 + o.z1) / 2, zl = o.z1 - o.z0;
    // the sky: the inside of a box beyond the wall, the hour's colours (SKY_MAT)
    const skyM = new THREE.Mesh(new THREE.BoxGeometry(far, 80, zl), SKY_MAT);
    skyM.position.set(out(far / 2 + 0.3), 38, zc); g.add(skyM);
    // the rest is lit as the rooms are, then dimmed to the hour outside (daylight)
    const outdoor = (geo, base, x, y, z) => {
      const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: base, fog: false }));
      m.position.set(x, y, z == null ? zc : z); g.add(m); outFlats.push({ m, base });
      return m;
    };
    outdoor(new THREE.PlaneGeometry(far, zl), 0x8cc468, out(far / 2), -0.02).rotation.x = -PI / 2;     // grass
    outdoor(new THREE.PlaneGeometry(1.5, zl), 0xd8c69c, out(4.25), -0.01).rotation.x = -PI / 2;        // a path along the building
    outdoor(new THREE.BoxGeometry(2, 5, zl), 0x4f8a48, out(58), 2.5);                                    // a far tree line
    if (o.gap) outdoor(new THREE.PlaneGeometry(14, o.gap[1] - o.gap[0]), 0xcfc6b4, out(7), -0.008, (o.gap[0] + o.gap[1]) / 2)
      .rotation.x = -PI / 2;                                                                               // the way out from the door
    // the hedge and the trees, voxels like everything else
    const c = canvas(S, o.seed || 5);
    c.box(Math.min(out(0.75), out(1.75)), 0, o.z0, Math.max(out(0.75), out(1.75)), 0.75, o.z1,
      (X, Y, Z) => o.gap && Z >= o.gap[0] && Z < o.gap[1] ? null : c.rnd() < 0.18 ? C.leafD : c.rnd() < 0.25 ? C.leafL : C.leaf);
    const tree = (d, z, s) => {
      const x = out(d);
      c.box(x - 0.25, 0, z - 0.25, x + 0.25, 2.25 * s, z + 0.25, 0x6a4a30);
      leaves(c, x, 3.0 * s, z, 1.6 * s, 1.3 * s, 1.6 * s);
      leaves(c, x - 0.9 * s, 2.5 * s, z + 0.4 * s, 1.0 * s, 0.85 * s, 1.0 * s);
      leaves(c, x + 0.8 * s, 2.6 * s, z - 0.5 * s, 1.0 * s, 0.85 * s, 1.0 * s);
    };
    for (let z = o.z1 - 2, i = 0; z > o.z0 + 2; z -= 5.5, i++) {
      tree(7 + (i % 2) * 1.5, z + (c.rnd() - 0.5), 0.9 + c.rnd() * 0.25);
      tree(17 + c.rnd() * 3, z - 2.5, 1.25 + c.rnd() * 0.3);
    }
    const m = new THREE.Mesh(c.mesh(notUnder), OUT_MAT); m.receiveShadow = true; g.add(m);
    return g;
  }
  /** Glass in a window: barely there, a little light on it. */
  function pane(w, h, x, y, z, yaw) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: 0xe8f6fc, transparent: true, opacity: 0.13, depthWrite: false }));
    m.position.set(x, y, z); m.rotation.y = yaw || 0;
    return m;
  }
  /** A small plate on a wall: a big first line (a room's number), smaller ones under it. */
  function plate(lines, w, h, bg, fg) {
    const cv = document.createElement("canvas");
    cv.width = 256; cv.height = Math.round(256 * h / w);
    const tex = new THREE.CanvasTexture(cv);
    const paint = () => {
      const g = cv.getContext("2d"), W = cv.width, H = cv.height, big = Math.round(H * 0.34), small = Math.round(H * 0.17);
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      g.strokeStyle = "rgba(0,0,0,.28)"; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, H - 6);
      g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle";
      const fit = (t, px, font) => { let s = px; g.font = font(s); while (g.measureText(t).width > W - 24 && s > 8) g.font = font(--s); };
      fit(lines[0], big, s => `400 ${s}px "Dela Gothic One", "Arial Black", sans-serif`);
      g.fillText(lines[0], W / 2, H * 0.27);
      for (let i = 1; i < lines.length; i++) {
        fit(lines[i], small, s => `700 ${s}px "M PLUS Rounded 1c", "Segoe UI", sans-serif`);
        g.fillText(lines[i], W / 2, H * 0.27 + big * 0.62 + (i - 0.5) * small * 1.3);
      }
      tex.needsUpdate = true;
    };
    paint();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(paint);
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
  }

  // ================================================================ the cafeteria
  /* Through the doors on the hall's left wall: the academy's cafeteria, the way Cinderella
     Gray draws one -- the serving counter along the back, steel and steaming pans, the
     kitchen behind it with the cook at work and a noren over the hatch, the day's menu
     chalked up above; long tables with chairs down both sides; a case of plastic food by
     the door; tall windows onto the grounds. Oguri Cap has her own place at the end of a
     table, and the empty bowls pile up beside her. */
  const CAFE = { x0: -10, x1: 10, z0: -6, z1: 7, h: 6.5 };
  const CW = { x0: -9.7, x1: 9.7, z0: -5.7, z1: 6.2 };
  const KITCHEN = { x0: -7, x1: 3, z0: -8.5, h: 3 };
  const CAFE_TABLES = [[-5, -1.5], [5, -1.5], [-5, 2.75], [5, 2.75]];
  const CAFE_WINDOWS = [[-5, -1.25], [0.5, 4.25]];                    // in the left wall, z from..to
  const CAFE_DOORS = {
    hall: { x: CAFE.x1, z: 1, yaw: -PI / 2, w: 2.5, h: 3, leaves: 2, leaf: leafPanelGlass(0xd8b890), frame: frameArch(C.frame, C.colCap),
            beyond: { top: 0xf8f2e6, bottom: 0xe6ddca, floor: 0xe6ddca } },
  };
  /* Four chairs down each side of each table: she walks round behind the chair (`from`) and
     sits in to the table; her tray goes on the table in front of her (`table`). */
  const CAFE_SEATS = [];
  for (const [tx, tz] of CAFE_TABLES) for (const dx of [-2.25, -0.75, 0.75, 2.25]) for (const s of [-1, 1])
    CAFE_SEATS.push({ x: tx + dx, z: tz + s * 0.8, face: s < 0 ? 0 : PI, act: "eat", seat: true,
                      from: { x: tx + dx, z: tz + s * 1.55 }, table: { x: tx + dx, z: tz + s * 0.22 } });
  // Oguri's place: the end of a table, facing the room, with space beside her for the bowls
  Object.assign(CAFE_SEATS.find(p => p.x === -7.25 && p.z === 1.95), { who: "Oguri Cap", feast: true });
  const cafeWall = (X, Y) => Y < 0.25 ? C.skirt : Y < 1.0 ? 0xc89a68 : Y < 1.25 ? C.woodL : Y >= CAFE.h - 0.25 ? C.crown : 0xf6efe0;
  function cafeShell() {
    const c = canvas(S, 31), { box, clear, jit } = c, A = CAFE, K = KITCHEN;
    // half-metre tiles, cream and pale grey, a grey border round the walls
    box(A.x0, -0.25, A.z0, A.x1, 0, A.z1, (X, Y, Z) => {
      const x = X - A.x0, z = Z - A.z0;
      if (x < 0.5 || x >= A.x1 - A.x0 - 0.5 || z < 0.5) return jit(0xb4ada0, 0.03);
      return jit((Math.floor(x / 0.5) + Math.floor(z / 0.5)) % 2 ? 0xf2ede2 : 0xdcd7cb, 0.02);
    });
    box(A.x0, 0, A.z0 - 0.25, A.x1, A.h, A.z0, cafeWall);
    box(A.x0 - 0.25, 0, A.z0 - 0.25, A.x0, A.h, A.z1, cafeWall);
    box(A.x1, 0, A.z0 - 0.25, A.x1 + 0.25, A.h, A.z1, cafeWall);
    for (const [a, b] of CAFE_WINDOWS) clear(A.x0 - 0.25, 1.0, a, A.x0, 4.25, b);
    for (const id in CAFE_DOORS) { const d = CAFE_DOORS[id]; clear(A.x1, 0, d.z - d.w / 2, A.x1 + 0.25, d.h, d.z + d.w / 2); }
    // the kitchen, through the back wall behind the counter: white tiles, a low ceiling
    clear(K.x0, 0, A.z0 - 0.25, K.x1, K.h, A.z0);
    box(K.x0, -0.25, K.z0, K.x1, 0, A.z0 - 0.25, (X, Y, Z) => (Math.round(X / S) + Math.round(Z / S)) % 2 ? 0xa4a8ae : 0x9298a0);
    const tiles = (X, Y, Z) => Y < 0.25 ? 0x8a9098 : (Math.round(X / S) + Math.round(Y / S) + Math.round(Z / S)) % 2 ? 0xf4f6f4 : 0xe4e8e6;
    box(K.x0, 0, K.z0 - 0.25, K.x1, K.h, K.z0, tiles);
    box(K.x0 - 0.25, 0, K.z0 - 0.25, K.x0, K.h, A.z0 - 0.25, tiles);
    box(K.x1, 0, K.z0 - 0.25, K.x1 + 0.25, K.h, A.z0 - 0.25, tiles);
    box(K.x0 - 0.25, K.h, K.z0 - 0.25, K.x1 + 0.25, K.h + 0.25, A.z0 - 0.25, 0xeceae4);
    return c.mesh((X, Y, Z, nx, ny, nz) => !(ny < 0 && Y < 0) && !(ny > 0 && Y >= K.h && Z < A.z0 - 0.2)
      && !(nz < 0 && Z < A.z0 - 0.2) && !(nx < 0 && X < A.x0 - 0.2) && !(nx > 0 && X >= A.x1));
  }
  function cafeChair(c, x, z, face) {
    const s = 0.1875, top = 0.4375, zb = face === 0 ? z - s : z + s - F;      // the back is away from the table
    for (const dx of [-s, s - F]) for (const dz of [-s, s - F]) c.box(x + dx, 0, z + dz, x + dx + F, top, z + dz + F, C.chromeD);
    c.box(x - s, top, z - s, x + s, top + F, z + s, C.woodL);
    c.box(x - s, top + F, zb, x - s + F, top + 0.4375, zb + F, C.chromeD);
    c.box(x + s - F, top + F, zb, x + s, top + 0.4375, zb + F, C.chromeD);
    c.box(x - s, top + 0.1875, zb, x + s, top + 0.4375, zb + F, C.wood);
  }
  function cafeProps() {
    const c = canvas(F, 5150), { box } = c, A = CAFE, K = KITCHEN, z0 = A.z0;
    // ---- the serving counter: a steel front in panels, a tray rail along it, a steel top
    const cb = -5.75, cf = -4.875, top = 0.9375;
    box(K.x0, 0, cb, K.x1, top, cf, (X, Y) => Y < 0.125 ? 0x5a5e68 : ((X - K.x0) % 0.75) < F ? C.chromeD : C.chrome);
    box(K.x0 - F, top, cb - F, K.x1 + F, top + F, cf + F, 0xe6e8ec);
    for (let x = K.x0 + 0.25; x < K.x1; x += 1.25) box(x, 0.6875, cf, x + F, 0.8125, cf + 0.375, C.chromeD);   // brackets
    for (const dz of [0.0625, 0.1875, 0.3125]) box(K.x0, 0.8125, cf + dz, K.x1, 0.875, cf + dz + F, C.chrome);
    // food in steel pans along the top: rice, curry, karaage, salad, glazed carrots
    const FOODS = [0xf8f6ee, 0x9a5a1e, 0xd89a3a, 0x6ab84a, 0xf08a2a];
    FOODS.forEach((col, i) => {
      const x0 = -4.5 + i * 1.125, x1 = x0 + 0.875, za = -5.625, zb = -5.125, t = top + F;
      box(x0, t, za, x1, t + F, zb, (X, Y, Z) => X < x0 + F || X >= x1 - F || Z < za + F || Z >= zb - F ? C.chrome : c.jit(col, 0.08));
      box(x0 + 0.1875, t + F, za + 0.125, x1 - 0.1875, t + 2 * F, zb - 0.125, () => c.jit(col, 0.1));     // heaped
    });
    // a big rice cooker, a soup pot with its ladle, a stack of trays, chopsticks in a box
    cyl(c, 2.375, -5.3125, 0.25, top + F, top + 0.375, (X, Y) => Y >= top + 0.3125 ? 0xb8bcc4 : 0xf2f0ea);
    c.box(2.3125, top + 0.375, -5.375, 2.4375, top + 0.4375, -5.25, 0x5a5e68);
    cyl(c, 1.625, -5.3125, 0.1875, top + F, top + 0.3125, (X, Y) => Y >= top + 0.25 ? 0xb0743a : C.chromeD);
    c.box(1.5625, top + 0.25, -5.3125, 1.625, top + 0.5, -5.25, C.chrome);
    for (let i = 0; i < 9; i++) box(-6.875, top + F + i * F, -5.5, -6.375, top + 2 * F + i * F, -5.125, i % 2 ? 0xc8743a : 0xa85a2a);
    box(-6.0, top + F, -5.375, -5.75, top + 0.1875, -5.1875, C.wood);
    for (const x of [-5.9375, -5.8125]) box(x, top + 0.1875, -5.3125, x + F, top + 0.375, -5.25, 0x3a2418);
    // the hatch into the kitchen: steel trim round it, an indigo noren hanging in it, slit
    box(K.x0 - 0.125, 0, z0, K.x0, K.h + 0.125, z0 + F, C.chromeD);
    box(K.x1, 0, z0, K.x1 + 0.125, K.h + 0.125, z0 + F, C.chromeD);
    box(K.x0, K.h, z0, K.x1, K.h + 0.125, z0 + F, C.chromeD);
    box(K.x0, K.h - 0.5, z0 - 2 * F, K.x1, K.h, z0 - F, (X, Y) => ((X - K.x0 + 0.03) % 1.25) < F ? undefined
      : Y < K.h - 0.4375 ? 0x223a6e : Math.abs(((X - K.x0) % 1.25) - 0.625) < 0.1875 && Y > K.h - 0.375 && Y < K.h - 0.125 ? 0xf2f0ea : 0x2a4a8a);
    // the kitchen: a stove under its hood with a pot on, a steel bench of vegetables, pots on a
    // shelf, a big fridge
    const kz = K.z0;
    box(-6.75, 0, kz, -4.75, 0.875, kz + 0.75, C.chrome);
    for (const bx of [-6.25, -5.25]) cyl(c, bx, kz + 0.375, 0.1875, 0.875, 0.9375, 0x2a2a30);
    cyl(c, -6.25, kz + 0.375, 0.25, 0.9375, 1.375, C.chromeD);
    box(-6.875, 2.0, kz, -4.625, 2.5, kz + 0.875, C.chrome);
    box(-6.0625, 2.5, kz, -5.5625, K.h, kz + 0.25, C.chromeD);                       // its duct
    box(-4.25, 0, kz, 0.75, 0.875, kz + 0.6875, C.chromeD);
    box(-4.25, 0.875, kz, 0.75, 0.9375, kz + 0.6875, 0xe6e8ec);
    box(-3.5, 0.9375, kz + 0.1875, -2.75, 0.9875, kz + 0.5625, 0xe8d8b8);           // a chopping board, carrots on it
    for (let i = 0; i < 4; i++) box(-3.4375 + i * 0.1875, 0.9875, kz + 0.25, -3.3125 + i * 0.1875, 1.05, kz + 0.5, 0xf08a2a);
    cyl(c, -1.5, kz + 0.375, 0.25, 0.9375, 1.1875, 0xd8dce4);                          // bowls of things
    cyl(c, -0.625, kz + 0.375, 0.1875, 0.9375, 1.125, 0xf2f0ea);
    box(-4.25, 1.75, kz, 0.75, 1.8125, kz + 0.375, C.chromeD);                          // the shelf, pots on it
    for (const px of [-3.75, -2.75, -1.75, -0.75, 0.25]) cyl(c, px, kz + 0.1875, 0.1875, 1.8125, 2.0625, px > -1 ? C.chrome : 0x9aa0ac);
    box(1.25, 0, kz, 2.75, 2.0, kz + 0.75, 0xe8eaee);                                  // the fridge
    box(1.9375, 0, kz + 0.75, 2.0, 2.0, kz + 0.8125, 0xb8bcc4);
    for (const hx of [1.75, 2.1875]) box(hx, 0.875, kz + 0.75, hx + F, 1.375, kz + 0.875, C.chromeD);
    // ---- the menu, chalked up over the counter (the board itself: buildCafe), in a frame
    box(-6.625, 3.375, z0, 2.625, 4.875, z0 + F, C.woodD);
    // ---- the tables: a light top with a darker edge, steel legs; salt, soy and pepper
    for (const [tx, tz] of CAFE_TABLES) {
      box(tx - 3, 0.6875, tz - 0.4375, tx + 3, 0.75, tz + 0.4375, (X, Y, Z) => Z < tz - 0.375 || Z >= tz + 0.375 || X < tx - 2.9375 || X >= tx + 2.9375 ? C.wood : C.woodL);
      for (const lx of [tx - 2.75, tx - F, tx + 2.6875]) for (const lz of [tz - 0.3125, tz + 0.25]) box(lx, 0, lz, lx + F, 0.6875, lz + F, C.chromeD);
      for (const ox of [-1.5, 1.5]) {
        box(tx + ox - 0.125, 0.75, tz - 0.0625, tx + ox + 0.125, 0.8125, tz + 0.0625, C.wood);
        box(tx + ox - 0.0625, 0.8125, tz - F, tx + ox, 0.9375, tz, 0x3a2418);                  // soy
        box(tx + ox + F, 0.8125, tz - F, tx + ox + 2 * F, 0.875, tz, 0xf6f4ee);                // salt
      }
    }
    for (const p of CAFE_SEATS) cafeChair(c, p.x, p.z, p.face);
    // ---- the tray return, steel shelves with trays slid in; the water and tea machine
    box(4.25, 0, z0, 4.375, 1.75, z0 + 0.5625, C.chromeD); box(6.625, 0, z0, 6.75, 1.75, z0 + 0.5625, C.chromeD);
    for (const y of [0.4375, 0.9375, 1.4375]) {
      box(4.375, y, z0, 6.625, y + F, z0 + 0.5625, C.chrome);
      for (let x = 4.5; x < 6.4; x += 0.625) {
        box(x, y + F, z0 + 0.0625, x + 0.5, y + 2 * F, z0 + 0.5, x > 5.5 ? 0xa85a2a : 0xc8743a);
        cyl(c, x + 0.1875, z0 + 0.25, 0.0625 * 1.5, y + 2 * F, y + 0.1875, 0xf6f2ea);       // a bowl left on it
      }
    }
    box(7.25, 0, z0, 8.5, 0.875, z0 + 0.5625, 0xeceae4);
    box(7.375, 0.875, z0, 8.125, 1.5625, z0 + 0.4375, C.chrome);
    box(7.375, 1.5625, z0, 8.125, 1.625, z0 + 0.4375, C.chromeD);
    for (const [tx, col] of [[7.5625, 0x3a8ad0], [7.9375, 0xd8302a]]) {
      box(tx - F, 1.25, z0 + 0.4375, tx + F, 1.3125, z0 + 0.5625, col);                                   // the taps
      box(tx - F, 1.125, z0 + 0.5, tx + F, 1.25, z0 + 0.5625, C.chromeD);
    }
    box(7.4375, 0.875, z0 + 0.4375, 8.0625, 0.9375, z0 + 0.5625, C.chromeD);                                 // drip tray
    for (let i = 0; i < 6; i++) cyl(c, 8.3125, z0 + 0.25, 0.0625, 0.875 + i * F, 0.875 + (i + 1) * F, i % 2 ? 0xe8e8e2 : 0xf8f8f4);   // a stack of cups
    // ---- by the door: a glass case of plastic food, each dish on its plate with a price card
    const dx0 = A.x1 - 0.625, dz0 = -4, dz1 = -1.75;
    box(dx0, 0, dz0, A.x1, 0.75, dz1, C.woodD);
    for (const [y0, y1] of [[0.75, 0.8125], [1.5625, 1.625]]) box(dx0, y0, dz0, A.x1, y1, dz1, C.chromeD);
    for (const pz of [dz0, dz1 - F]) box(dx0, 0.8125, pz, dx0 + F, 1.5625, pz + F, C.chromeD);
    box(dx0 + 0.0625, 1.1875, dz0, A.x1, 1.25, dz1, C.glass);                                                 // a glass shelf
    const SAMPLES = [[0x9a5a1e, 0xf8f6ee], [0x6a3a1e, 0xf08a2a], [0xe0a040, 0xf6e0a0], [0xf2eedc, 0x6ab84a], [0xf6c8d8, 0xf6f2ea], [0xf08a2a, 0xf6efe0]];
    SAMPLES.forEach(([a, b], i) => {
      const y = i < 3 ? 0.8125 : 1.25, z = dz0 + 0.375 + (i % 3) * 0.75, x = dx0 + 0.3125;
      box(x - 0.1875, y, z - 0.1875, x + 0.1875, y + F, z + 0.1875, 0xf8f8f6);                              // the plate
      box(x - 0.125, y + F, z - 0.125, x + 0.0625, y + 0.1875, z + 0.0625, a);
      box(x - 0.0625, y + F, z, x + 0.125, y + 0.125, z + 0.125, b);
      box(dx0 + 0.0625, y + F, z - 0.0625, dx0 + 0.125, y + 0.125, z + 0.0625, 0xf8f6ee);                    // its price card
    });
    // ---- the windows on the left: white frames, glazing bars, a deep sill
    for (const [a, b] of CAFE_WINDOWS) {
      box(A.x0, 0.8125, a - 0.1875, A.x0 + F, 4.4375, b + 0.1875, C.frame);
      c.clear(A.x0, 1.0, a, A.x0 + F, 4.25, b);
      for (let z = a + 1.25; z < b - 0.5; z += 1.25) box(A.x0 - 0.1875, 1.0, z, A.x0 - 0.125, 4.25, z + F, C.frame);
      box(A.x0 - 0.1875, 3.25, a, A.x0 - 0.125, 3.3125, b, C.frame);
      box(A.x0, 0.9375, a - 0.25, A.x0 + 0.25, 1.0, b + 0.25, C.frame);
    }
    // ---- lamps hung over the tables, a clock over the door, plants in the corners
    for (const [tx, tz] of CAFE_TABLES) for (const ox of [-1.5, 1.5]) {
      const x = tx + ox;
      box(x, 3.6875, tz, x + F, A.h, tz + F, 0x3a3a40);
      cyl(c, x + F / 2, tz + F / 2, 0.25, 3.375, 3.6875, (X, Y) => Y < 3.4375 ? C.lit : 0x2f6a4e);   // a green drum shade, lit beneath
      box(x - 0.0625, 3.6875, tz - 0.0625, x + 0.125, 3.75, tz + 0.125, 0x3a3a40);
    }
    c.box(A.x1 - F, 3.5, 0.625, A.x1, 4.25, 1.375, (X, Y, Z) => {
      const dy = Y + c.h - 3.875, dz = Z + c.h - 1.0, r = Math.hypot(dy, dz);
      if (r > 0.375) return undefined;
      if (r > 0.3) return 0x3a3a40;
      if ((Math.abs(dz) < 0.04 && dy > 0 && dy < 0.22) || (Math.abs(dy) < 0.04 && dz > -0.17 && dz < 0)) return 0x2a2a30;
      return 0xf8f6f0;
    });
    plant(c, -9.3, -5.3, 1); plant(c, 9.3, -5.3, 1); plant(c, 9.3, 6.2, 1);
    return c.mesh(notUnder);
  }
  /** A tray of lunch: rice, miso soup, a hamburg steak with carrots on a plate, chopsticks.
      `food` is everything edible on it, to clear once it is eaten. Built in metres. */
  const trayGeo = {}, trayMat = {};
  function trayMesh() {
    const g = new THREE.Group(), food = new THREE.Group();
    const part = (w, h, d, col, x, y, z, into) => {
      const key = w + ":" + h + ":" + d;
      const m = new THREE.Mesh(trayGeo[key] || (trayGeo[key] = new THREE.BoxGeometry(w, h, d)),
                               trayMat[col] || (trayMat[col] = new THREE.MeshLambertMaterial({ color: col })));
      m.position.set(x, y, z); (into || g).add(m);
    };
    part(0.42, 0.02, 0.3, 0xc8743a, 0, 0.01, 0);
    part(0.1, 0.06, 0.1, 0xf6f2ea, -0.12, 0.05, 0.07); part(0.08, 0.02, 0.08, 0xfdfcf6, -0.12, 0.085, 0.07, food);   // rice
    part(0.09, 0.05, 0.09, 0x8a2a22, 0.0, 0.045, 0.08); part(0.07, 0.01, 0.07, 0xc08a4a, 0.0, 0.07, 0.08, food);     // miso
    part(0.18, 0.012, 0.13, 0xf8f8f6, 0.07, 0.026, -0.06);                                                           // the plate
    part(0.09, 0.035, 0.065, 0x6a3a1e, 0.05, 0.05, -0.06, food); part(0.03, 0.02, 0.05, 0xf08a2a, 0.12, 0.045, -0.06, food);
    part(0.02, 0.01, 0.2, 0x3a2418, 0.17, 0.026, 0.06); part(0.02, 0.01, 0.2, 0x3a2418, 0.19, 0.026, 0.06);           // chopsticks
    g.add(food); g.userData.food = food;
    return g;
  }
  const CAFE_POIS = [
    ...CAFE_SEATS,
    { id: "order", x: -1, z: -4.25, face: PI, act: "read", icon: "carrot" },
    { id: "order2", x: 1.25, z: -4.25, face: PI, act: "read" },
    { id: "menu", x: -4, z: -3.9, face: PI, act: "read", icon: "clipboard" },
    { id: "return", x: 5.5, z: -5.0, face: PI, act: "idle" },
    { id: "water", x: 7.75, z: -5.0, face: PI, act: "drink", icon: "juice" },
    { id: "case", x: 9.0, z: -2.9, face: PI / 2, act: "look" },
    { id: "window", x: -9.2, z: -3.0, face: -PI / 2, act: "look" },
    { id: "window2", x: -9.2, z: 2.5, face: -PI / 2, act: "look" },
  ];
  const cafeIx = id => CAFE_POIS.findIndex(p => p.id === id);
  const CAFE_HUDDLES = [[0, 0.6], [-3, 5.3], [4, 5.3]];
  const CAFE_THINGS = [
    ...CAFE_SEATS.map((p, i) => ({ kind: "sit", label: "Sit", eat: true, poi: [i] })),
    { kind: "food", label: "Get some lunch", poi: [cafeIx("order")], x: -1, z: -4.25, face: PI, ax: -1, ay: 1.75, az: -5.3 },
    { kind: "rtray", label: "Return the tray", needs: "tray", poi: [cafeIx("return")], x: 5.5, z: -5.0, face: PI, ax: 5.5, ay: 2.0, az: -5.7,
      at: { x: 5.5, y: 0.95, z: -5.75 } },
    { kind: "tea", label: "Get some water", put: "Put the cup back", water: true, ahh: "Ahh, nice and cold.", poi: [cafeIx("water")],
      x: 7.75, z: -5.0, face: PI, ax: 7.75, ay: 2.0, az: -5.7 },
    { kind: "read", label: "Read the menu", poi: [cafeIx("menu")], x: -4, z: -3.9, face: PI, ax: -4, ay: 3.1, az: -5.9,
      say: ["Carrot hamburg steak... that's the one.", "Curry, katsudon, udon... why choose?", "Carrot cake for afters. Obviously."] },
    { kind: "look", label: "Look at the samples", poi: [cafeIx("case")], x: 9.0, z: -2.9, face: PI / 2, ax: 9.7, ay: 1.95, az: -2.9,
      say: ["They look so real. Now I'm hungry.", "Is the plastic katsudon bigger than the real one?", "That parfait isn't on today. Tragic."] },
    { kind: "look", label: "Look out", poi: [cafeIx("window")], x: -9.2, z: -3.0, face: -PI / 2, ax: -9.9, ay: 2.6, az: -3.0,
      say: ["Nice out. We could eat outside.", "Somebody's already running laps out there.", "The trees are full of sparrows."] },
  ];
  const CAFE_PLACES = {
    hall: { label: "Main hall", sub: "Back out", icon: "door", x: 8.6, z: 1, face: PI / 2, ax: 9.9, ay: 3.75, az: 1,
            door: "hall", room: "hall", arrive: "cafe" },
  };
  const CAFE_BLOCKS = [
    [KITCHEN.x0 - 0.2, -6.5, KITCHEN.x1 + 0.2, -4.6],
    [4.2, -6, 6.8, -5.35], [7.2, -6, 8.55, -5.35],
    [CAFE.x1 - 0.65, -4.05, CAFE.x1, -1.7],
    [-9.65, -5.65, -8.95, -4.95], [8.95, -5.65, 9.65, -4.95], [8.95, 5.85, 9.65, 6.55],
    ...CAFE_TABLES.map(([tx, tz]) => [tx - 3.15, tz - 1.1, tx + 3.15, tz + 1.1]),
  ];
  function cafeWalkable(x, z, r) {
    if (x < CW.x0 + r || x > CW.x1 - r || z < CW.z0 + r || z > CW.z1 - r) return false;
    for (const b of CAFE_BLOCKS) if (x > b[0] - r && x < b[2] + r && z > b[1] - r && z < b[3] + r) return false;
    return true;
  }
  /** The menu over the counter, chalked on a green board. */
  function menuBoard(w, h) {
    const cv = document.createElement("canvas");
    cv.width = 2048; cv.height = Math.round(2048 * h / w);
    const tex = new THREE.CanvasTexture(cv);
    const paint = () => {
      const g = cv.getContext("2d"), W = cv.width, H = cv.height, rnd = mulberry32(9);
      g.fillStyle = "#2c4a3a"; g.fillRect(0, 0, W, H);
      g.fillStyle = "rgba(255,255,255,.04)";
      for (let i = 0; i < 50; i++) g.fillRect(rnd() * W, rnd() * H, 80 + rnd() * 280, 6 + rnd() * 18);    // old chalk
      g.textBaseline = "middle";
      g.fillStyle = "#f6e27a"; g.textAlign = "center"; g.font = `400 ${Math.round(H * 0.2)}px "Dela Gothic One", "Arial Black", sans-serif`;
      g.fillText("TODAY'S MENU", W / 2, H * 0.17);
      // three to a row, the price after each
      const items = [["Carrot hamburg steak", 520], ["Curry rice", 450], ["Katsudon", 480], ["Kitsune udon", 380], ["Grilled fish set", 500], ["Carrot cake", 250]];
      g.font = `700 ${Math.round(H * 0.135)}px "M PLUS Rounded 1c", "Segoe UI", sans-serif`;
      items.forEach(([n, p], i) => {
        const col = i % 3, y = H * (0.44 + Math.floor(i / 3) * 0.22), x0 = W * (0.03 + col / 3), x1 = W * ((col + 1) / 3 - 0.025);
        g.fillStyle = "#f4f2ea"; g.textAlign = "left"; g.fillText(n, x0, y);
        g.fillStyle = "#f6c8d0"; g.textAlign = "right"; g.fillText("¥" + p, x1, y);
      });
      g.fillStyle = "#bfe3c8"; g.textAlign = "center"; g.font = `700 ${Math.round(H * 0.11)}px "M PLUS Rounded 1c", "Segoe UI", sans-serif`;
      g.fillText("Seconds are free. Thirds, ask nicely.", W / 2, H * 0.89);
      tex.needsUpdate = true;
    };
    paint();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(paint);
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
  }
  function buildCafe(R) {
    const g = new THREE.Group(), A = CAFE;
    const shell = new THREE.Mesh(cafeShell(), MAT); shell.receiveShadow = true; g.add(shell);
    const props = new THREE.Mesh(cafeProps(), MAT); props.receiveShadow = true; g.add(props);
    const menu = menuBoard(9, 1.375); menu.position.set(-2, 4.125, A.z0 + F + 0.004); g.add(menu);
    for (const [a, b] of CAFE_WINDOWS) g.add(pane(b - a, 3.25, A.x0 - 0.16, 2.625, (a + b) / 2, PI / 2));
    g.add(outdoors({ x: A.x0 - 0.25, dir: -1, z0: -40, z1: 4.5, seed: 21 }));
    for (const [tx, tz] of CAFE_TABLES) for (const ox of [-1.5, 1.5]) glow(g, tx + ox + F / 2, 3.3, tz + F / 2, 2.2);
    R.doors = {};
    for (const id in CAFE_DOORS) { const d = makeDoor(CAFE_DOORS[id]); R.doors[id] = d; g.add(d.g); }
    hangSign(g, "MAIN HALL", A.x1 - 0.03, 3.62, 1 - 1.5, -PI / 2, 0.55);
    hangSign(g, "TRAY RETURN", 5.5, 2.15, A.z0 + 0.03, 0, 0.5, "#7a4e30", "#fff6dc");
    hangSign(g, "EAT WELL, RUN WELL", A.x1 - 0.03, 2.5, 4.6, -PI / 2, 0.9, "#c0303a", "#fff6dc");
    // a tray in front of each chair, out on the table while somebody is eating there
    for (const p of CAFE_SEATS) {
      const t = trayMesh(); t.position.set(p.table.x, 0.75, p.table.z); t.rotation.y = p.face; t.visible = false;
      g.add(t); p.tray = t;
    }
    // and Oguri's bowls, in towers beside her place, emptied one after another
    const bowl = new THREE.CylinderGeometry(0.08, 0.055, 0.06, 10), white = new THREE.MeshLambertMaterial({ color: 0xf6f2ea });
    const band = new THREE.CylinderGeometry(0.081, 0.081, 0.012, 10), blue = new THREE.MeshLambertMaterial({ color: 0x3a5ab0 });
    const f = CAFE_SEATS.find(p => p.feast), bowls = [];
    for (const [ox, oz] of [[-0.42, 0.05], [0.42, 0.05], [0.0, 0.42], [-0.42, 0.4], [0.42, 0.4]])
      for (let k = 0; k < 8; k++) {
        const b = new THREE.Group(), m = new THREE.Mesh(bowl, white), r = new THREE.Mesh(band, blue);
        r.position.y = 0.022; b.add(m, r);
        b.position.set(f.x + ox, 0.78 + k * 0.062, f.table.z + oz - 0.05); b.visible = false;
        g.add(b); bowls.push(b);
      }
    // (they fill tower by tower, each to eight high before the next is started)
    R.feast = { i: CAFE_POIS.indexOf(f), bowls, t: 0 };
    return g;
  }

  // ================================================================ the dormitory
  /* Through the hall's right-hand doors: Ritto Dorm, a corridor of rooms two to a room,
     paired as the real game pairs them, with its second floor up the stairs at the far
     end; and over a covered walkway from there, the academy's other dorm, Miho. Every racer
     has her room in the dorm the game puts her in. One corridor, dressed for whichever
     floor she is on (dressCorridor): the plates on its doors, its signs, its two ends (the
     doors to the hall or the walkway, a window, or plain wall), and whether the stairs go on
     up. The residents' board by the entrance is the stable. The sun comes in on this side,
     between the doors, from the windows the camera looks in through. */
  const DORM = { x0: -17, x1: 17, z0: -1.5, z1: 3, h: 3.75 };
  const DW = { x0: -16.7, x1: 16.7, z0: -1.2, z1: 2.75 };
  const FLOORS = [{ dorm: "Ritto", n: 1 }, { dorm: "Ritto", n: 2 }, { dorm: "Miho", n: 1 }];
  /* Who lives where: the real game's pairs (umamusu.wiki's list of roommates), `f` the
     floor (FLOORS). The colour of a resident's things is hers in the game; `col` for anyone
     this game has no model for. A room with one name has its second bed made up for nobody:
     the game gives Rudolf and Bakushin no roommate, and has Maruzensky living alone (it
     names no dorm for her; she has a room to herself here). Rooms whose two residents are
     both outside this game's roster fill out the floors. */
  const DORM_ROOMS = [
    { f: 0, no: 101, names: ["Special Week", "Silence Suzuka"] },
    { f: 0, no: 102, names: ["Tokai Teio", "Mayano Top Gun"] },
    { f: 0, no: 103, names: ["Vodka", "Daiwa Scarlet"] },
    { f: 0, no: 104, names: ["Oguri Cap", "Tamamo Cross"], col: [null, 0x3a6ad8] },
    { f: 0, no: 105, names: ["King Halo", "Haru Urara"] },
    { f: 0, no: 106, names: ["Agnes Tachyon", "Agnes Digital"], col: [null, 0xe86aa0] },
    { f: 0, no: 107, names: ["Mejiro McQueen", "Ikuno Dictus"], col: [null, 0x4a7a52] },
    { f: 0, no: 108, names: ["Gold Ship", "Stay Gold"], col: [null, 0x3a3048] },
    { f: 1, no: 201, names: ["Super Creek", "Narita Taishin"], col: [null, 0xd86aa8] },
    { f: 1, no: 202, names: ["Nice Nature", "Marvelous Sunday"], col: [null, 0xf0a030] },
    { f: 1, no: 203, names: ["T.M. Opera O", "Biwa Hayahide"], col: [null, 0x5a7ac0] },
    { f: 1, no: 204, names: ["Winning Ticket", "Tosen Jordan"], col: [null, 0xe8607a] },
    { f: 1, no: 205, names: ["Air Groove", "Fine Motion"], col: [null, 0x6ac0a8] },
    { f: 1, no: 206, names: ["Matikanefukukitaru", "Matikanetannhauser"], col: [null, 0x8a6ad0] },
    { f: 1, no: 207, names: ["Maruzensky"] },
    { f: 1, no: 208, names: ["Kitasan Black", "Satono Diamond"], col: [0x2a2a3a, 0x2a5ad8] },
    { f: 2, no: 101, names: ["El Condor Pasa", "Grass Wonder"] },
    { f: 2, no: 102, names: ["Taiki Shuttle", "Mejiro Dober"], col: [null, 0x7a4aa8] },
    { f: 2, no: 103, names: ["Rice Shower", "Zenno Rob Roy"], col: [null, 0x4a6a3a] },
    { f: 2, no: 104, names: ["Mejiro Ryan", "Ines Fujin"], col: [null, 0x3a8ad0] },
    { f: 2, no: 105, names: ["Symboli Rudolf"] },
    { f: 2, no: 106, names: ["Sakura Bakushin O"] },
    { f: 2, no: 107, names: ["Manhattan Cafe", "Yukino Bijin"], col: [0x2a2a2a, 0xa8c8e8] },
    { f: 2, no: 108, names: ["Seiun Sky", "Sakura Laurel"], col: [0x6ab0e0, 0xf0a0b8] },
  ];
  // each room's door along its floor's corridor, 0 to 7 from the entrance
  DORM_ROOMS.forEach(r => r.slot = DORM_ROOMS.filter(q => q.f === r.f).indexOf(r));
  const floorOf = name => { const r = DORM_ROOMS.find(r => r.names.includes(name)); return r ? r.f : 0; };
  const doorX = i => -11.5 + 3.5 * i;
  const STAIRS = { x0: 14.25, x1: 16.25, h: 3 };          // the stairwell, off the back wall at the far end
  /** A dorm room's door: plain light wood, a sunk panel low and a long one high, a lever, a spyhole. */
  function leafDorm(c, lw, h) {
    const col = 0xcca06a, colD = mulC(col, 0.86);
    c.box(0, 0, -F, lw, h, F, col);
    for (const z of [F, -2 * F]) {
      c.box(0, 0, z, lw, h, z + F, (X, Y) => X >= 0.1875 && X < lw - 0.1875 && ((Y >= 0.25 && Y < 0.875) || (Y >= 1.0625 && Y < h - 0.25)) ? undefined : col);
      c.box(0.25, 0.3125, z, lw - 0.25, 0.8125, z + F, colD);
      c.box(0.25, 1.125, z, lw - 0.25, h - 0.3125, z + F, colD);
    }
    for (const z of [2 * F, -3 * F]) c.box(lw - 0.25, 0.9375, z, lw - F, 1.0, z + F, C.chrome);
    c.box(Math.round(lw / 2 / F) * F, 1.5, F, Math.round(lw / 2 / F) * F + F, 1.5625, 2 * F, C.chromeD);
  }
  // the hall's doors at the west end of Ritto's ground floor; the walkway's glass doors,
  // Ritto's at its east end and Miho's at its west; the eight rooms' doors
  const WALKWAY = { top: 0xbfe0f6, bottom: 0xf4eedc, floor: 0xd8c69c, out: true };
  const DORM_DOORS = {
    hall: { x: DORM.x0, z: 0.5, yaw: PI / 2, w: 2.5, h: 3, leaves: 2, leaf: leafEmblem(C.woodL, C.brass, horseshoe), frame: frameArch(C.woodD, C.woodD),
            beyond: { top: 0xf8f2e6, bottom: 0xe6ddca, floor: 0xe6ddca } },
    east: { x: DORM.x1, z: 0.5, yaw: -PI / 2, w: 2.5, h: 3, leaves: 2, leaf: leafGlass, frame: frameArch(C.woodD, C.woodD), beyond: WALKWAY },
    west: { x: DORM.x0, z: 0.5, yaw: PI / 2, w: 2.5, h: 3, leaves: 2, leaf: leafGlass, frame: frameArch(C.woodD, C.woodD), beyond: WALKWAY },
  };
  for (let i = 0; i < 8; i++) DORM_DOORS["s" + i] = { x: doorX(i), z: DORM.z0, yaw: 0, w: 1, h: 2.25, leaf: leafDorm,
    frame: frameArch(C.woodD, C.woodD), beyond: { top: 0xf6eee0, bottom: 0xe0cdb0, floor: 0xb88a5a } };
  const dormWall = (X, Y) => Y < 0.25 ? C.skirt : Y < 1.0 ? 0xb88a5a : Y < 1.125 ? C.wainTop : Y >= DORM.h - 0.25 ? C.crown : 0xf4ecdc;
  function dormShell() {
    const c = canvas(S, 61), { box, clear, jit } = c, D = DORM;
    // floorboards along the corridor, a green runner down it, and squares of sun on this side
    box(D.x0, -0.25, D.z0, D.x1, 0, D.z1, (X, Y, Z) => {
      const row = Math.round((Z - D.z0) / S), k = Math.floor((X - D.x0 + (row % 4) * 0.75) / 2);
      let col = [0xc89a64, 0xbc8e58, 0xd4a670][((row * 7 + k * 13) % 3 + 3) % 3];
      if (Z >= -0.25 && Z < 1.0) col = Z < 0 || Z >= 0.75 ? 0xe8d8a8 : 0x2f6a4e;
      else if (Z >= 1.25 && ((X + 10.5) % 3.5 + 3.5) % 3.5 < 1.5) col = mixC(col, 0xfff4cc, 0.4);
      return jit(col, 0.03);
    });
    box(D.x0, 0, D.z0 - 0.25, D.x1, D.h, D.z0, dormWall);
    box(D.x0 - 0.25, 0, D.z0 - 0.25, D.x0, D.h, D.z1, dormWall);
    box(D.x1, 0, D.z0 - 0.25, D.x1 + 0.25, D.h, D.z1, dormWall);
    box(D.x0 - 0.25, D.h, D.z0 - 0.25, D.x1 + 0.25, D.h + 0.25, D.z1, C.ceiling);
    // the doorways (a floor with a window or a wall at an end fills it: dormEnds), and the stairwell's
    for (const id in DORM_DOORS) {
      const d = DORM_DOORS[id];
      if (d.yaw === 0) clear(d.x - d.w / 2, 0, D.z0 - 0.25, d.x + d.w / 2, d.h, D.z0);
      else { const wx = d.x < 0 ? D.x0 - 0.25 : D.x1; clear(wx, 0, d.z - d.w / 2, wx + 0.25, d.h, d.z + d.w / 2); }
    }
    clear(STAIRS.x0, 0, D.z0 - 0.25, STAIRS.x1, STAIRS.h, D.z0);
    return c.mesh((X, Y, Z, nx, ny, nz) => !(ny < 0 && Y < 0) && !(ny > 0 && Y >= D.h) && !(nz < 0 && Z < D.z0 - 0.2)
      && !(nx < 0 && X < D.x0 - 0.2) && !(nx > 0 && X >= D.x1));
  }
  function dormProps() {
    const c = canvas(F, 6161), { box } = c, D = DORM, z0 = D.z0;
    // the residents' board: everyone's name on a tag, turned red when she is out
    box(-16, 1.0, z0, -14, 2.3125, z0 + 3 * F, C.woodD);
    c.clear(-15.875, 1.125, z0 + F, -14.125, 2.1875, z0 + 3 * F);
    box(-15.875, 1.125, z0 + F, -14.125, 2.1875, z0 + 2 * F, () => c.jit(C.cork, 0.06));
    for (let row = 0; row < 4; row++) for (let col = 0; col < 6; col++) {
      const x = -15.75 + col * 0.25, y = 1.25 + row * 0.25, out = c.rnd() < 0.3;
      box(x, y, z0 + 2 * F, x + 0.1875, y + 0.125, z0 + 3 * F, (X, Y) => Y < y + F ? (out ? 0xd8302a : 0x3a9a5a) : 0xf6f2e8);
    }
    // the drinking fountain by the board, and an extinguisher on the wall by the stairs
    const fx = -13.25;
    box(fx - 0.25, 0, z0, fx + 0.25, 0.75, z0 + 0.375, C.chromeD);
    box(fx - 0.375, 0.75, z0, fx + 0.375, 0.875, z0 + 0.5, C.chrome);
    box(fx - 0.3125, 0.8125, z0 + F, fx + 0.3125, 0.875, z0 + 0.4375, 0x8ab0c8);
    box(fx - 0.0625, 0.875, z0 + 0.0625, fx + 0.0625, 1.0, z0 + 0.25, C.chromeD);
    box(16.5, 0.125, z0, 16.75, 0.6875, z0 + 0.25, 0xd8302a);
    box(16.5625, 0.6875, z0 + 0.0625, 16.6875, 0.8125, z0 + 0.1875, 0x2a2a30);
    // ceiling lights between the doors
    for (let i = -1; i < 8; i++) {
      const x = doorX(i) + 1.75;
      box(x - 0.5, D.h - F, 0.25, x + 0.5, D.h, 0.75, C.lamp);
      box(x - 0.5625, D.h - F, 0.1875, x + 0.5625, D.h, 0.25, 0xd8d2c4);
    }
    return c.mesh(notUnder);
  }
  /** What differs at the ends from floor to floor, each its own mesh to show or hide
      (dressCorridor): the stairwell, or wall where it would be; the far end's window, or the
      walkway's door; the near end's doors, or wall. */
  function dormEnds(g) {
    const D = DORM, piece = (grain, seed, draw) => {
      const c = canvas(grain, seed); draw(c);
      const m = new THREE.Mesh(c.mesh(notUnder), MAT); m.receiveShadow = true; g.add(m);
      return m;
    };
    const E = {};
    // the stairs: twelve steps away from the corridor between two walls, a handrail on the
    // left -- up to a landing on the ground floor (`dir` 1), down to one upstairs (-1)
    const flight = (dir, seed) => {
      const fg = new THREE.Group(), z = D.z0 - 0.25, { x0, x1 } = STAIRS, deep = -3.5;
      fg.add(piece(S, seed, c => {
        c.box(x0, deep, z, x1, 0, D.z0, C.plankB);                                         // the threshold, under the opening
        for (let i = 0; i < 12; i++) {
          const top = dir * (i + 1) * 0.25;
          c.box(x0, deep, z - (i + 1) * 0.25, x1, top, z - i * 0.25, (X, Y) => Y >= top - 0.25 ? (i % 2 ? C.plankA : C.plankC) : 0xd8ccb4);
        }
        c.box(x0, deep, z - 3.75, x1, dir * 3, z - 3, C.plankB);                           // the landing
        c.box(x0 - 0.25, deep, z - 4, x0, 4.5, z, dormWall);
        c.box(x1, deep, z - 4, x1 + 0.25, 4.5, z, dormWall);
        c.box(x0, deep, z - 4, x1, 4.5, z - 3.75, dormWall);
      }));
      fg.add(piece(F, seed + 1, c => {
        for (let i = 0; i < 12; i++) {
          const y = 0.875 + dir * (i + (dir > 0 ? 0 : 1)) * 0.25;
          c.box(x0, y, z - (i + 1) * 0.25, x0 + F, y + F, z - i * 0.25, C.wood);
        }
      }));
      glow(fg, 15.25, dir > 0 ? 3.6 : 1.2, -4.0, 2.0);
      g.add(fg);
      return fg;
    };
    E.up = flight(1, 63);
    E.down = flight(-1, 69);
    E.stairPlug = piece(S, 65, c => c.box(STAIRS.x0, 0, D.z0 - 0.25, STAIRS.x1, STAIRS.h, D.z0, dormWall));
    // the far end's window: a sill under it, its frame, a bar across, glass
    E.window = new THREE.Group(); g.add(E.window);
    E.window.add(piece(S, 66, c => c.box(D.x1, 0, -0.75, D.x1 + 0.25, 1.0, 1.75, dormWall)));
    E.window.add(piece(F, 67, c => {
      const x = D.x1;
      c.box(x - F, 0.8125, -0.9375, x, 3.1875, 1.9375, C.frame);
      c.clear(x - F, 1.0, -0.75, x, 3.0, 1.75);
      c.box(x + 0.0625, 1.0, 0.5, x + 0.125, 3.0, 0.5625, C.frame);
      c.box(x + 0.0625, 2.25, -0.75, x + 0.125, 2.3125, 1.75, C.frame);
      c.box(x - 0.25, 0.9375, -0.9375, x, 1.0, 1.9375, C.frame);
    }));
    E.window.add(pane(2.5, 2, D.x1 + 0.09, 2.0, 0.5, -PI / 2));
    // and the near end walled up, upstairs, where downstairs the doors to the hall are
    E.wall = piece(S, 68, c => c.box(D.x0 - 0.25, 0, -0.75, D.x0, 3, 1.75, dormWall));
    return E;
  }
  /** Each floor's places: the way out (the hall, or the walkway), the stairs, the residents'
      board, and its eight rooms' doors. (The end doors' tags float up by the ceiling, over
      the dorm's sign rather than across it.) */
  function floorPlaces(f) {
    const fl = FLOORS[f], P = {
      stable: { station: "stable", sub: "Residents' board", x: -15, z: -0.75, face: PI, ax: -15, ay: 2.95, az: -1.4 },
    };
    if (f === 0) {
      P.hall = { label: "Main hall", sub: "Back out", icon: "door", x: -15.6, z: 0.5, face: -PI / 2, ax: -16.9, ay: 3.75, az: 0.5,
                 door: "hall", room: "hall", arrive: "stable" };
      P.miho = { label: "Miho Dorm", sub: "Over the walkway", icon: "door", x: 15.6, z: 0.5, face: PI / 2, ax: 16.9, ay: 3.75, az: 0.5,
                 door: "east", room: "dorm", v: 2, arrive: "ritto" };
    }
    if (fl.dorm === "Miho") P.ritto = { label: "Ritto Dorm", sub: "Over the walkway", icon: "door", x: -15.6, z: 0.5, face: -PI / 2,
                                        ax: -16.9, ay: 3.75, az: 0.5, door: "west", room: "dorm", v: 0, arrive: "miho" };
    else P.stairs = { label: fl.n === 1 ? "Upstairs" : "Downstairs", sub: `Ritto Dorm, ${fl.n === 1 ? 2 : 1}F`, icon: "chevrons",
                      x: 15.25, z: -0.6, face: PI, ax: 15.25, ay: 3.6, az: -1.4, room: "dorm", v: fl.n === 1 ? 1 : 0, arrive: "stairs" };
    DORM_ROOMS.forEach((r, i) => {
      if (r.f === f) P["r" + i] = { label: "Room " + r.no, sub: r.names.join(" & "), icon: "door", quiet: true,
        x: doorX(r.slot), z: -0.6, face: PI, ax: doorX(r.slot), ay: 2.85, az: -1.4, door: "s" + r.slot, room: "room", v: i, arrive: "door" };
    });
    return P;
  }
  const DORM_FLOOR_PLACES = FLOORS.map((fl, f) => floorPlaces(f));
  const DORM_POIS = [
    { x: 16.25, z: 0.5, face: PI / 2, act: "look" },
    { x: -13.25, z: -0.8, face: PI, act: "drink", icon: "juice" },
    { x: -15.4, z: -0.8, face: PI, act: "read", icon: "clipboard" }, { x: -14.6, z: -0.8, face: PI, act: "read" },
    // calling on a friend: at her door, knocking
    ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => ({ x: doorX(i) + 0.15, z: -0.75, face: PI, act: "knock" })),
  ];
  const DORM_HUDDLES = [[-6.25, 0.9], [4.25, 0.9], [11.25, 0.9]];
  const DORM_THINGS = [
    { kind: "fountain", label: "Have a drink", poi: [1], x: -13.25, z: -0.8, face: PI, ax: -13.25, ay: 1.6, az: -1.4 },
    { kind: "look", label: "Look out", poi: [0], x: 16.25, z: 0.5, face: PI / 2, ax: 16.95, ay: 2.5, az: 0.5,
      say: ["The cherry trees along there are something in spring.", "Quiet out. Everyone must be at practice.", "Nice day for a run."] },
  ];
  const DORM_BLOCKS = [[-13.65, -1.5, -12.85, -0.95], [16.45, -1.5, 16.8, -1.2]];
  function dormWalkable(x, z, r) {
    if (x < DW.x0 + r || x > DW.x1 - r || z < DW.z0 + r || z > DW.z1 - r) return false;
    for (const b of DORM_BLOCKS) if (x > b[0] - r && x < b[2] + r && z > b[1] - r && z < b[3] + r) return false;
    return true;
  }
  function buildDorm(R) {
    const g = new THREE.Group(), D = DORM;
    const shell = new THREE.Mesh(dormShell(), MAT); shell.receiveShadow = true; g.add(shell);
    const props = new THREE.Mesh(dormProps(), MAT); props.receiveShadow = true; g.add(props);
    // (the walkway's doors open out through the far end: the hedge leaves room for them)
    g.add(outdoors({ x: D.x1 + 0.25, dir: 1, z0: -30, z1: 2.75, seed: 33, gap: [-1.25, 2.25] }));
    for (let i = -1; i < 8; i++) glow(g, doorX(i) + 1.75, D.h - 0.2, 0.5, 2.4);
    R.ends = dormEnds(g);
    R.doors = {};
    for (const id in DORM_DOORS) { const d = makeDoor(DORM_DOORS[id]); R.doors[id] = d; g.add(d.g); }
    hangSign(g, "RESIDENTS", -15, 2.55, D.z0 + 0.03, 0, 0.5);
    // each floor's own: the plates by its doors (the room's number, who lives there), its
    // signs, and in Miho a blue runner for Ritto's green
    R.floors = FLOORS.map((fl, f) => {
      const fg = new THREE.Group(), miho = fl.dorm === "Miho";
      DORM_ROOMS.filter(r => r.f === f).forEach(r => {
        const p = plate([String(r.no), ...r.names], 0.5, 0.4, "#f6f0e2", "#3a2a1e");
        p.position.set(doorX(r.slot) + 0.95, 1.7, D.z0 + 0.01); fg.add(p);
      });
      // (the end signs sit clear of the doors' frames, which reach 3.3 m, under the ceiling)
      hangSign(fg, `${fl.dorm.toUpperCase()} DORM${fl.n > 1 ? " " + fl.n + "F" : ""}`, D.x0 + 0.03, 3.52, 0.5, PI / 2, 0.6,
               miho ? "#2c3a6e" : "#2f6a4e", "#f6efdc");
      if (!miho) hangSign(fg, fl.n === 1 ? "UP TO 2F" : "DOWN TO 1F", 15.25, 3.35, D.z0 + 0.03, 0, 0.5);
      if (f === 0) hangSign(fg, "MIHO DORM", D.x1 - 0.03, 3.52, 0.5, -PI / 2, 0.6, "#2c3a6e", "#f6efdc");
      if (miho) {
        const run = new THREE.Mesh(new THREE.PlaneGeometry(D.x1 - D.x0, 0.75), new THREE.MeshLambertMaterial({ color: 0x2c4a8a }));
        run.rotation.x = -PI / 2; run.position.set(0, 0.006, 0.375); fg.add(run);
      }
      g.add(fg);
      return fg;
    });
    return g;
  }
  /** Dress the corridor as floor `f`: its places, its ends, its plates and signs. */
  function dressCorridor(R, f) {
    const E = R.ends, miho = FLOORS[f].dorm === "Miho";
    R.v = f;
    R.places = DORM_FLOOR_PLACES[f];
    R.things = DORM_THINGS.filter(th => th.kind !== "look" || f !== 0);    // the ground floor's far end is the walkway door
    R.doors.hall.g.visible = f === 0; R.doors.east.g.visible = f === 0; R.doors.west.g.visible = miho;
    E.wall.visible = f === 1; E.window.visible = f !== 0;
    E.up.visible = !miho && FLOORS[f].n === 1; E.down.visible = !miho && FLOORS[f].n === 2; E.stairPlug.visible = miho;
    R.floors.forEach((fg, i) => fg.visible = i === f);
  }

  // ================================================================ a room in the dorm
  /* Two to a room: a bed each, their heads to the back wall; a desk each between them, a
     shelf of books over it; a wardrobe each; a rug and a low table between them; the door
     from the corridor on the left, a window onto the grounds on the right. One room, dressed
     for whoever lives in it (roomDress): her bedspread and her pennant in her colours, a plush
     on her pillow, something of hers on her desk. */
  const ROOMD = { x0: -3.25, x1: 3.25, z0: -3, z1: 3.5, h: 3.5 };
  const RW = { x0: -3.15, x1: 3.15, z0: -2.9, z1: 2.8 };
  const ROOMD_WINDOW = { z0: -0.5, z1: 1.5, y0: 1.0, y1: 2.5 };
  const ROOMD_DOORS = {
    door: { x: ROOMD.x0, z: 1.75, yaw: PI / 2, w: 1, h: 2.25, leaf: leafDorm, frame: frameArch(C.woodD, C.woodD),
            beyond: { top: 0xf6eee0, bottom: 0xe0cdb0, floor: 0xc89a64 } },
  };
  const roomWall = (X, Y) => Y < 0.25 ? C.skirt : Y >= ROOMD.h - 0.25 ? C.crown : 0xf6eedf;
  function roomShell() {
    const c = canvas(S, 71), { box, clear, jit } = c, O = ROOMD, W = ROOMD_WINDOW;
    box(O.x0, -0.25, O.z0, O.x1, 0, O.z1, (X, Y, Z) => {
      const col = Math.round((X - O.x0) / S), k = Math.floor((Z - O.z0 + (col % 4) * 0.5) / 1.5);
      return jit([C.plankA, C.plankB, C.plankC][((col * 7 + k * 13) % 3 + 3) % 3], 0.04);
    });
    clear(-1.5, -0.25, -1.25, 1.5, 0, 1.75);                                          // the rug lies in the floor
    box(O.x0, 0, O.z0 - 0.25, O.x1, O.h, O.z0, roomWall);
    box(O.x0 - 0.25, 0, O.z0 - 0.25, O.x0, O.h, O.z1, roomWall);
    box(O.x1, 0, O.z0 - 0.25, O.x1 + 0.25, O.h, O.z1, roomWall);
    box(O.x0 - 0.25, O.h, O.z0 - 0.25, O.x1 + 0.25, O.h + 0.25, O.z1, C.ceiling);
    const d = ROOMD_DOORS.door;
    clear(O.x0 - 0.25, 0, d.z - d.w / 2, O.x0, d.h, d.z + d.w / 2);
    clear(O.x1, W.y0, W.z0, O.x1 + 0.25, W.y1, W.z1);
    return c.mesh((X, Y, Z, nx, ny, nz) => !(ny < 0 && Y < 0) && !(ny > 0 && Y >= O.h) && !(nz < 0 && Z < O.z0 - 0.2)
      && !(nx < 0 && X < O.x0 - 0.2) && !(nx > 0 && X >= O.x1));
  }
  // the two sides of the room: her bed (x0..x1), her desk and chair
  const SIDES = [{ bx0: -3.25, bx1: -2.125, dx: -1.0 }, { bx0: 2.125, bx1: 3.25, dx: 1.0 }];
  function roomProps() {
    const c = canvas(F, 7171), { box } = c, O = ROOMD, W = ROOMD_WINDOW, z0 = O.z0;
    // the rug, flush with the boards: cream, a soft green border
    box(-1.5, -0.25, -1.25, 1.5, 0, 1.75, (X, Y, Z) =>
      Math.min(X + 1.5, 1.5 - F - X, Z + 1.25, 1.75 - F - Z) < 0.125 ? 0x6a9a6a : c.jit(0xf0e6cc, 0.03));
    for (const s of SIDES) {
      const { bx0, bx1 } = s;
      // the bed: a frame on short legs, a headboard to the wall, a white mattress and pillow
      for (const lx of [bx0 + F, bx1 - 2 * F]) for (const lz of [z0 + F, -0.9375 - F]) box(lx, 0, lz, lx + F, 0.1875, lz + F, C.woodD);
      box(bx0, 0.1875, z0, bx1, 0.3125, -0.875, C.woodL);
      box(bx0, 0.3125, z0 + 0.0625, bx1, 0.5, -0.9375, 0xf6f4ee);
      box(bx0, 0, z0, bx1, 0.9375, z0 + 0.0625, C.wood);
      box(bx0, 0.875, z0, bx1, 0.9375, z0 + 0.125, C.woodL);
      box(bx0 + 0.1875, 0.5, z0 + 0.125, bx1 - 0.1875, 0.625, z0 + 0.5, 0xfbfaf6);
      // the desk: drawers down one side, a lamp, a pot of pens; a shelf of books over it
      const dx0 = s.dx - 0.8125, dx1 = s.dx + 0.8125;
      box(dx0, 0.6875, z0, dx1, 0.75, z0 + 0.625, C.woodL);
      const dr = s.dx < 0 ? dx0 : dx1 - 0.4375;
      box(dr, 0, z0, dr + 0.4375, 0.6875, z0 + 0.5625, C.wood);
      for (const y of [0.1875, 0.4375]) box(dr + 0.0625, y, z0 + 0.5625, dr + 0.375, y + 0.1875, z0 + 0.625, C.woodL);
      const leg = s.dx < 0 ? dx1 - F : dx0;
      box(leg, 0, z0 + 0.5, leg + F, 0.6875, z0 + 0.5625, C.wood);
      const lx = s.dx < 0 ? dx0 + 0.25 : dx1 - 0.3125;
      box(lx - F, 0.75, z0 + 0.125, lx + 2 * F, 0.8125, z0 + 0.25, 0x3a3a40);              // a lamp: base, stem, shade
      box(lx, 0.8125, z0 + 0.1875, lx + F, 1.125, z0 + 0.25, 0x3a3a40);
      box(lx - 0.125, 1.125, z0 + 0.125, lx + 0.1875, 1.25, z0 + 0.375, 0xf6e6b0);
      cyl(c, s.dx < 0 ? dx1 - 0.25 : dx0 + 0.25, z0 + 0.25, 0.0625, 0.75, 0.875, 0x3a8ad0);
      box(dx0, 1.5, z0, dx1, 1.5625, z0 + 0.25, C.wood);
      books(c, dx0 + 0.0625, dx1 - 0.0625, 1.5625, z0 + 0.0625, z0 + 0.1875, 0.3125);
      // her chair, its back to the room
      const cx = s.dx, cz = -2.0625;
      for (const ox of [-0.1875, 0.125]) for (const oz of [-0.1875, 0.125]) box(cx + ox, 0, cz + oz, cx + ox + F, 0.4375, cz + oz + F, C.woodD);
      box(cx - 0.1875, 0.4375, cz - 0.1875, cx + 0.1875, 0.5, cz + 0.1875, C.woodL);
      box(cx - 0.1875, 0.5, cz + 0.125, cx + 0.1875, 0.9375, cz + 0.1875, C.woodL);
    }
    // the wardrobes: one by the door, one in the front corner on the window side
    const wardrobe = (x0, x1, za, zb, face) => {
      box(x0, 0, za, x1, 2.0, zb, C.woodL);
      box(x0, 2.0, za, x1, 2.0625, zb, C.wood);
      const fx = face > 0 ? x1 : x0 - F, mid = (za + zb) / 2;
      box(fx, 0.0625, mid - F, fx + F, 1.9375, mid, C.wood);                          // where its doors meet
      for (const hz of [mid - 0.125, mid + 0.0625]) box(fx, 0.9375, hz, fx + F, 1.1875, hz + F, C.brassD);
    };
    wardrobe(O.x0, O.x0 + 0.625, 0.0625, 0.9375, 1);
    wardrobe(O.x1 - 0.625, O.x1, 1.625, 2.625, -1);
    // the low table on the rug, with tea and a bowl of oranges; cushions round it
    cyl(c, 0, 0.5, 0.4375, 0.25, 0.3125, C.woodL);
    cyl(c, 0, 0.5, 0.0625, 0, 0.25, C.wood);
    cyl(c, -0.125, 0.375, 0.0625, 0.3125, 0.4375, 0xf6f2ea);
    cyl(c, 0.1875, 0.625, 0.125, 0.3125, 0.375, 0xd8dce4);
    for (const [ox, oz] of [[0.125, 0.5625], [0.1875, 0.625], [0.25, 0.5625]]) box(ox, 0.375, oz, ox + F, 0.4375, oz + F, 0xf08a2a);
    for (const [ox, oz, col] of [[-0.8125, 0.5, 0xd86a8a], [0.8125, 0.5, 0x5a8ac8]]) box(ox - 0.25, 0, oz - 0.25, ox + 0.25, 0.125, oz + 0.25, col);
    // the window: white frame, a bar across, a sill; curtains drawn back either side
    {
      const x = O.x1;
      box(x - F, W.y0 - 0.1875, W.z0 - 0.1875, x, W.y1 + 0.1875, W.z1 + 0.1875, C.frame);
      c.clear(x - F, W.y0, W.z0, x, W.y1, W.z1);
      box(x + 0.0625, W.y0, (W.z0 + W.z1) / 2, x + 0.125, W.y1, (W.z0 + W.z1) / 2 + F, C.frame);
      box(x - 0.25, W.y0 - F, W.z0 - 0.25, x, W.y0, W.z1 + 0.25, C.frame);
      box(x - 0.125, W.y1 + 0.25, W.z0 - 0.5, x - F, W.y1 + 0.3125, W.z1 + 0.5, C.brassD);   // the rod
      for (const [za, zb] of [[W.z0 - 0.5, W.z0 - 0.125], [W.z1 + 0.125, W.z1 + 0.5]])
        box(x - 0.1875, W.y0 - 0.25, za, x - F, W.y1 + 0.25, zb, (X, Y, Z) => ((Z - za) % 0.125) < F ? 0xe0c8a0 : 0xf2e2c0);
    }
    // a round light on the ceiling, a calendar and a clock on the walls
    cyl(c, 0, 0.25, 0.375, O.h - 0.0625, O.h, C.lamp);
    box(-0.375, 2.0, z0, 0.375, 2.75, z0 + F, (X, Y) => Y > 2.5 ? 0xd8302a : ((Math.round(X / F) + Math.round(Y / F)) % 3 ? 0xf8f6f0 : 0xd8d2c4));
    c.box(O.x0, 2.5, 0.0, O.x0 + F, 3.0, 0.5, (X, Y, Z) => {
      const dy = Y + c.h - 2.75, dz = Z + c.h - 0.25, r = Math.hypot(dy, dz);
      if (r > 0.25) return undefined;
      if (r > 0.19) return 0x5a3a28;
      return (Math.abs(dz) < 0.035 && dy > 0 && dy < 0.15) || (Math.abs(dy) < 0.035 && dz > 0 && dz < 0.11) ? 0x2a2a30 : 0xf8f6f0;
    });
    return c.mesh(notUnder);
  }
  /* Her things, in her colours. A few of them have something of their own on the desk:
     Tachyon her flasks, Oguri and Spe and Gold Ship their snacks, the ones who mean to win
     a trophy, Vodka her helmet, Mayano a model jet, Suzuka a photo, Urara a carrot plush. */
  const DESK_THINGS = { "Agnes Tachyon": "flasks", "Oguri Cap": "snacks", "Special Week": "snacks", "Gold Ship": "snacks",
    "Daiwa Scarlet": "trophy", "Tokai Teio": "trophy", "Mejiro McQueen": "trophy", "King Halo": "trophy",
    "Vodka": "helmet", "Mayano Top Gun": "jet", "Silence Suzuka": "photo", "Haru Urara": "carrot" };
  /** Her colour: the game's own for her (on her def), else the strongest in her outfit. */
  function residentColours(r, s) {
    const name = r.names[s], L = V.kit.lookFor(name);
    const d = [player && player.def].concat(...Object.values(casts)).find(d => d && d.color && bareName(d.name) === name);
    const pale = c => ((c >> 16) & 255) + ((c >> 8) & 255) + (c & 255) > 600;
    const main = (r.col && r.col[s]) || (d && parseInt(String(d.color).replace("#", ""), 16))
      || (!pale(L.skirt) ? L.skirt : !pale(L.trim) ? L.trim : L.top);
    return { main, accent: L.hair || 0x6a4a3a };
  }
  function roomDress(i) {
    const r = DORM_ROOMS[i], c = canvas(F, 700 + i), { box } = c, z0 = ROOMD.z0;
    r.names.forEach((name, s) => {
      const { bx0, bx1, dx } = SIDES[s], { main, accent } = residentColours(r, s), dark = mulC(main, 0.82);
      const inner = s ? bx0 - F : bx1, cx = (bx0 + bx1) / 2;
      // the bedspread: over the mattress, turned down at the top, hanging down her side and the foot
      box(bx0, 0.5, -2.375, bx1, 0.5625, -0.875, (X, Y, Z) => Z < -2.25 ? 0xfbfaf6 : (Math.round(Z / F) % 6 ? main : dark));
      box(inner, 0.25, -2.375, inner + F, 0.5625, -0.875, dark);
      box(bx0, 0.25, -0.875, bx1, 0.5625, -0.8125, dark);
      // a plush on the pillow: a body, a head, two ears
      const soft = mixC(main, 0xffffff, 0.35);
      box(cx - 0.125, 0.625, z0 + 0.25, cx + 0.125, 0.8125, z0 + 0.4375, soft);
      box(cx - 0.125, 0.8125, z0 + 0.25, cx + 0.125, 0.9375, z0 + 0.4375, soft);
      for (const ex of [cx - 0.125, cx + 0.0625]) box(ex, 0.9375, z0 + 0.3125, ex + F, 1.0, z0 + 0.375, dark);
      // her pennant over the bed, on a stick, a white stripe near its base
      const px = s ? bx1 - 0.125 : bx0 + 0.125, dir = s ? -1 : 1;
      box(Math.min(px, px + dir * F), 1.3125, z0, Math.max(px, px + dir * F), 2.3125, z0 + F, 0x6a4a30);
      for (let k = 0; k < 14; k++) {
        const y = 1.375 + k * F, half = 0.4375, len = 0.875 * (1 - Math.abs(y + F / 2 - (1.375 + half)) / half);
        if (len < F) continue;
        const a = px + dir * F, b = a + dir * len;
        box(Math.min(a, b), y, z0, Math.max(a, b), y + F, z0 + F, (X) => Math.abs(X - a) < 0.1875 && Math.abs(X - a) >= 0.125 ? 0xfbfaf6 : main);
      }
      // and something of hers on the desk
      const tx = dx + (s ? -0.375 : 0.375), tz = z0 + 0.3125, ty = 0.75;
      switch (DESK_THINGS[name]) {
        case "flasks":                                     // test tubes, half full of something bright
          [[0, 0x7af07a], [0.1875, 0xf07ad8], [-0.1875, 0xf0e05a]].forEach(([ox, col]) =>
            box(tx + ox - F, ty, tz - F, tx + ox + F, ty + 0.25, tz + F, (X, Y) => Y < ty + 0.125 ? col : 0xd8eef4));
          break;
        case "snacks":
          [[0, 0, 0xd8302a], [0.125, 0, 0xf0c040], [-0.125, 0.0625, 0x3a8ad0], [0.0625, 0.125, 0x5ab84a], [-0.0625, 0.1875, 0xf07a2a]].forEach(([ox, oy, col]) =>
            box(tx + ox - 0.0625, ty + oy, tz - 0.0625, tx + ox + 0.0625, ty + oy + 0.0625, tz + 0.125, col));
          break;
        case "trophy": trophy(c, tx, ty, tz, C.brass); break;
        case "helmet":
          c.box(tx - 0.1875, ty, tz - 0.1875, tx + 0.1875, ty + 0.25, tz + 0.1875, (X, Y, Z) =>
            Math.hypot(X + c.h - tx, (Y + c.h - ty) * 0.8, Z + c.h - tz) < 0.19 ? (Y < ty + 0.125 && Z + c.h > tz + 0.06 ? 0x8ab0c8 : 0x26262c) : undefined);
          break;
        case "jet":                                        // on its stand: fuselage, wings, a fin in her colour
          box(tx, ty, tz - F, tx + F, ty + F, tz, 0x3a3a40);
          box(tx - 0.25, ty + F, tz - F, tx + 0.1875, ty + 2 * F, tz + F, 0x9aa4b0);
          box(tx - 0.0625, ty + F, tz - 0.1875, tx + 0.0625, ty + 2 * F, tz + 0.1875, 0x9aa4b0);
          box(tx - 0.25, ty + 2 * F, tz - F, tx - 0.1875, ty + 4 * F, tz, main);
          break;
        case "photo":
          box(tx - 0.125, ty, tz, tx + 0.125, ty + 0.25, tz + F, C.woodD);
          box(tx - 0.0625, ty + 0.0625, tz + F, tx + 0.0625, ty + 0.1875, tz + 2 * F, (X, Y) => Y < ty + 0.125 ? 0x6ab84a : 0x9ad0f0);
          break;
        case "carrot":                                     // a carrot plush, lying down
          box(tx - F, ty, tz - 0.125, tx + F, ty + 2 * F, tz + 0.125, 0xf08a2a);
          box(tx - F, ty, tz + 0.125, tx + F, ty + F, tz + 0.1875, 0xf08a2a);
          box(tx - F, ty + F, tz - 0.25, tx + F, ty + 3 * F, tz - 0.125, C.leafL);
          break;
        default: books(c, tx - 0.25, tx + 0.25, ty, z0 + 0.0625, z0 + 0.25, 0.25);
      }
    });
    // a room with one resident: the other bed made up plain for nobody, a few books on its desk
    for (let s = r.names.length; s < 2; s++) {
      const { bx0, bx1, dx } = SIDES[s], plain = 0xd8d2c4, inner = s ? bx0 - F : bx1;
      box(bx0, 0.5, -2.375, bx1, 0.5625, -0.875, (X, Y, Z) => Z < -2.25 ? 0xfbfaf6 : plain);
      box(inner, 0.25, -2.375, inner + F, 0.5625, -0.875, mulC(plain, 0.88));
      box(bx0, 0.25, -0.875, bx1, 0.5625, -0.8125, mulC(plain, 0.88));
      const tx = dx + (s ? -0.375 : 0.375);
      books(c, tx - 0.25, tx + 0.25, 0.75, z0 + 0.0625, z0 + 0.25, 0.25);
    }
    const m = new THREE.Mesh(c.mesh(notUnder), MAT); m.receiveShadow = true;
    return m;
  }
  const ROOMD_PLACES = {
    door: { label: "Corridor", sub: "Back out", icon: "door", x: -2.0, z: 1.75, face: -PI / 2, ax: -3.15, ay: 2.75, az: 1.75,
            door: "door", room: "dorm", v: () => DORM_ROOMS[ROOMS.room.v].f, arrive: () => "r" + ROOMS.room.v },
  };
  /* Each resident keeps to her own side: her bed, her desk (`owner`, her place in the room's names). */
  const ROOMD_POIS = [
    { x: -2.45, z: -1.35, face: PI / 2, act: "sit", seat: true, owner: 0, from: { x: -1.5, z: -1.3 } },
    { x: 2.45, z: -1.35, face: -PI / 2, act: "sit", seat: true, owner: 1, from: { x: 1.5, z: -1.3 } },
    { x: -1.0, z: -2.0625, face: PI, act: "study", seat: true, owner: 0, from: { x: -1.0, z: -1.25 } },
    { x: 1.0, z: -2.0625, face: PI, act: "study", seat: true, owner: 1, from: { x: 1.0, z: -1.25 } },
    { x: 2.55, z: 0.4, face: PI / 2, act: "look" },
    { x: -2.2, z: 0.4, face: -PI / 2, act: "browse", owner: 0 },
    { x: 1.9, z: 2.1, face: PI / 2, act: "browse", owner: 1 },
  ];
  const ROOMD_HUDDLES = [[0, 0.5]];
  const ROOMD_THINGS = [
    ...SIDES.map((s, i) => ({ kind: "nap", label: "Take a nap", poi: [i], x: (s.bx0 + s.bx1) / 2, z: -0.45, face: 0,
                               ax: (s.bx0 + s.bx1) / 2, ay: 1.2, az: -1.9, bed: { x: (s.bx0 + s.bx1) / 2, y: 0.5625, z: -1.0 } })),
    { kind: "sit", label: "Study", pose: "study", poi: [2] },
    { kind: "sit", label: "Study", pose: "study", poi: [3] },
    { kind: "look", label: "Look out", poi: [4], x: 2.55, z: 0.4, face: PI / 2, ax: 3.15, ay: 2.4, az: 0.4,
      say: ["Nice day for a run.", "You can hear the track from here, if you listen.", "The sparrows are back on the sill."] },
  ];
  const ROOMD_BLOCKS = [
    [-3.25, -3, -2.125, -0.8], [2.125, -3, 3.25, -0.8],
    [-1.9, -3, 1.9, -1.75],
    [-3.25, 0.0, -2.6, 0.95], [2.6, 1.6, 3.25, 2.65],
    [-0.45, 0.05, 0.45, 0.95],
  ];
  function roomWalkable(x, z, r) {
    if (x < RW.x0 + r || x > RW.x1 - r || z < RW.z0 + r || z > RW.z1 - r) return false;
    for (const b of ROOMD_BLOCKS) if (x > b[0] - r && x < b[2] + r && z > b[1] - r && z < b[3] + r) return false;
    return true;
  }
  function buildRoom(R) {
    const g = new THREE.Group(), O = ROOMD, W = ROOMD_WINDOW;
    const shell = new THREE.Mesh(roomShell(), MAT); shell.receiveShadow = true; g.add(shell);
    const props = new THREE.Mesh(roomProps(), MAT); props.receiveShadow = true; g.add(props);
    g.add(pane(W.z1 - W.z0, W.y1 - W.y0, O.x1 + 0.09, (W.y0 + W.y1) / 2, (W.z0 + W.z1) / 2, -PI / 2));
    g.add(outdoors({ x: O.x1 + 0.25, dir: 1, z0: -30, z1: 1.75, seed: 45 }));
    glow(g, 0, O.h - 0.15, 0.25, 2.6);                                                    // the ceiling light,
    glow(g, -1.53, 1.15, O.z0 + 0.25, 0.8); glow(g, 1.53, 1.15, O.z0 + 0.25, 0.8);       // and the desk lamps
    R.doors = {};
    for (const id in ROOMD_DOORS) { const d = makeDoor(ROOMD_DOORS[id]); R.doors[id] = d; g.add(d.g); }
    R.dressed = {};
    return g;
  }
  /** Dress the room for room `v` of the corridor (built the first time, kept after). */
  function dressRoom(R, v) {
    R.v = v;
    for (const k in R.dressed) R.dressed[k].visible = false;
    if (!R.dressed[v]) { R.dressed[v] = roomDress(v); R.group.add(R.dressed[v]); }
    R.dressed[v].visible = true;
  }

  // ================================================================ the school wing
  /* Through the classroom door at the back of the hall: the school wing, a corridor of
     classrooms the way Tracen's are. Sliding doors with glass in their tops, each with its
     plate overhead; banks of lockers between them; the timetable by the entrance, which
     is the Tutorials list; a drinking fountain and a window at the far end; and the sun on
     the floor from the windows on this side. Each classroom teaches one of the tutorials
     (LESSONS): the lesson is chalked up on its board, and it starts at the board. */
  const SCHOOL = { x0: -19, x1: 19, z0: -1.5, z1: 3.25, h: 3.75 };
  const SW = { x0: -18.7, x1: 18.7, z0: -1.2, z1: 3.0 };
  const classX = i => -13.5 + 4.5 * i;
  /* The lessons: the tutorials as the shell passes them (opts.lessons -- each one's id,
     name, what it covers, its carrots, and whether it is done), seven at most, a classroom
     each. Without them, the names alone. */
  const LESSONS_PLAIN = [["race", "Race Basics"], ["exhibition", "Exhibition"], ["deck", "Deck Building"], ["scout", "Scouting"],
    ["career", "Career Mode"], ["dream", "Dream Rules"], ["rival", "Rivalries"]].map(([id, name]) => ({ id, name, text: "", done: false }));
  let LESSONS = LESSONS_PLAIN;
  /** A classroom's sliding door: a light wood frame, two panes of glass in its top half, a
      panel below, a finger pull. */
  function leafSlide(c, lw, h) {
    const col = 0xd8b07a, colD = mulC(col, 0.85), gy0 = 1.25, gy1 = h - 0.1875;
    c.box(0, 0, -F, lw, h, F, (X, Y) => X >= 0.125 && X < lw - 0.125 && Y >= gy0 && Y < gy1
      ? (Math.abs(X + c.h - lw / 2) < F ? col : ((X + Y) % 0.6) < 0.07 ? C.glassHi : C.glass) : col);
    for (const z of [F, -2 * F]) {
      c.box(0.1875, 0.25, z, lw - 0.1875, 1.0625, z + F, colD);
      c.box(lw - 0.3125, 0.875, z, lw - 0.1875, 1.125, z + F, 0x5a3a24);
    }
  }
  const SCHOOL_DOORS = {
    // the far side of the hall's classroom door, the same door
    hall: { x: SCHOOL.x0, z: 0.75, yaw: PI / 2, w: 1.5, h: 2.75, leaf: leafClass, frame: frameArch(C.woodD, C.woodD),
            beyond: { top: 0xf8f2e6, bottom: 0xe6ddca, floor: 0xe6ddca } },
  };
  for (let i = 0; i < 7; i++) SCHOOL_DOORS["s" + i] = { x: classX(i), z: SCHOOL.z0, yaw: 0, w: 1.5, h: 2.25, leaf: leafSlide, slide: -1,
    frame: frameArch(C.woodD, C.woodD), beyond: { top: 0xf6f2e6, bottom: 0xd8dcc8, floor: 0xc8b48a } };
  const schoolWall = (X, Y) => Y < 0.25 ? 0x5e6a60 : Y < 1.0 ? 0x9cbfa6 : Y < 1.125 ? 0xe4e8da : Y >= SCHOOL.h - 0.25 ? C.crown : 0xf4f2e8;
  function schoolShell() {
    const c = canvas(S, 81), { box, clear, jit } = c, D = SCHOOL;
    // half-metre tiles, pale and speckled, and squares of sun between the doors on this side
    box(D.x0, -0.25, D.z0, D.x1, 0, D.z1, (X, Y, Z) => {
      let col = (Math.floor((X - D.x0) / 0.5) + Math.floor((Z - D.z0) / 0.5)) % 2 ? 0xdcd9ce : 0xd0cdc0;
      if (Z >= 1.5 && ((X + 12.25) % 4.5 + 4.5) % 4.5 < 2.0) col = mixC(col, 0xfff4cc, 0.4);
      return jit(col, 0.03);
    });
    box(D.x0, 0, D.z0 - 0.25, D.x1, D.h, D.z0, schoolWall);
    box(D.x0 - 0.25, 0, D.z0 - 0.25, D.x0, D.h, D.z1, schoolWall);
    box(D.x1, 0, D.z0 - 0.25, D.x1 + 0.25, D.h, D.z1, schoolWall);
    box(D.x0 - 0.25, D.h, D.z0 - 0.25, D.x1 + 0.25, D.h + 0.25, D.z1, C.ceiling);
    for (const id in SCHOOL_DOORS) {
      const d = SCHOOL_DOORS[id];
      if (d.yaw === 0) clear(d.x - d.w / 2, 0, D.z0 - 0.25, d.x + d.w / 2, d.h, D.z0);
      else clear(D.x0 - 0.25, 0, d.z - d.w / 2, D.x0, d.h, d.z + d.w / 2);
    }
    clear(D.x1, 1.0, -0.75, D.x1 + 0.25, 3.0, 1.75);                                   // the window at the far end
    return c.mesh((X, Y, Z, nx, ny, nz) => !(ny < 0 && Y < 0) && !(ny > 0 && Y >= D.h) && !(nz < 0 && Z < D.z0 - 0.2)
      && !(nx < 0 && X < D.x0 - 0.2) && !(nx > 0 && X >= D.x1));
  }
  // banks of lockers: between the doors, and one more past the last
  const LOCKERS = [0, 1, 2, 3, 4, 5].map(i => classX(i) + 2.25).concat([15.875]);
  /** A bank of steel lockers against the back wall: four across, two high, each door with
      its vents, its handle and a name card. */
  function lockers(c, cx, zw) {
    const x0 = cx - 0.875, x1 = cx + 0.875, zf = zw + 0.4375, top = 1.8125, body = 0x8a9ab0;
    c.box(x0, 0, zw, x1, F, zf, 0x4a5260);                                               // the plinth
    c.box(x0, F, zw, x1, top, zf, body);
    c.box(x0 - F, top, zw, x1 + F, top + F, zf + F, mulC(body, 0.86));
    c.box(x0, F, zf, x1, top, zf + F, (X, Y) => {
      const u = (X - x0) % 0.4375, v = (Y - F) % 0.875;
      if (u < F || v < F) return mulC(body, 0.72);                                        // where the doors meet
      if (v >= 0.625 && v < 0.75 && u >= 0.125 && u < 0.3125 && Math.round(Y / F) % 2) return 0x3a4250;   // vents
      if (v >= 0.375 && v < 0.5 && u >= 0.3125 && u < 0.375) return C.chrome;              // the handle
      if (v >= 0.5 && v < 0.5625 && u >= 0.125 && u < 0.25) return 0xf6f2e8;               // a name card
      return mixC(body, 0xffffff, 0.06);
    });
  }
  function schoolProps() {
    const c = canvas(F, 8181), { box } = c, D = SCHOOL, z0 = D.z0;
    for (const x of LOCKERS) lockers(c, x, z0);
    // the timetable's frame (the timetable itself, the lessons and which are done: buildSchool)
    box(-18.375, 0.875, z0, -15.625, 2.625, z0 + F, C.woodD);
    // the drinking fountain by the window, its extinguisher by it
    const fx = 17.75;
    box(fx - 0.25, 0, z0, fx + 0.25, 0.75, z0 + 0.375, C.chromeD);
    box(fx - 0.375, 0.75, z0, fx + 0.375, 0.875, z0 + 0.5, C.chrome);
    box(fx - 0.3125, 0.8125, z0 + F, fx + 0.3125, 0.875, z0 + 0.4375, 0x8ab0c8);
    box(fx - 0.0625, 0.875, z0 + 0.0625, fx + 0.0625, 1.0, z0 + 0.25, C.chromeD);
    box(18.5, 0.125, z0, 18.75, 0.6875, z0 + 0.25, 0xd8302a);
    box(18.5625, 0.6875, z0 + 0.0625, 18.6875, 0.8125, z0 + 0.1875, 0x2a2a30);
    // long ceiling lights between the doors
    for (let i = -1; i < 7; i++) {
      const x = classX(i) + 2.25;
      box(x - 0.75, D.h - F, 0.25, x + 0.75, D.h, 0.75, C.lamp);
      box(x - 0.8125, D.h - F, 0.1875, x + 0.8125, D.h, 0.25, 0xd8d2c4);
    }
    // the far window: frame, a bar across and one down, a sill
    const x = D.x1;
    box(x - F, 0.8125, -0.9375, x, 3.1875, 1.9375, C.frame);
    c.clear(x - F, 1.0, -0.75, x, 3.0, 1.75);
    box(x + 0.0625, 1.0, 0.5, x + 0.125, 3.0, 0.5625, C.frame);
    box(x + 0.0625, 2.25, -0.75, x + 0.125, 2.3125, 1.75, C.frame);
    box(x - 0.25, 0.9375, -0.9375, x, 1.0, 1.9375, C.frame);
    return c.mesh(notUnder);
  }
  /** The timetable by the entrance: every lesson, a tick by the ones she has done. */
  function timetablePaint(cv) {
    const g = cv.getContext("2d"), W = cv.width, H = cv.height;
    g.fillStyle = "#f6f2e6"; g.fillRect(0, 0, W, H);
    g.fillStyle = "#2f6a4e"; g.fillRect(0, 0, W, H * 0.17);
    g.fillStyle = "#f6efdc"; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = `400 ${Math.round(H * 0.1)}px "Dela Gothic One", "Arial Black", sans-serif`;
    g.fillText("LESSONS", W / 2, H * 0.09);
    const rows = LESSONS.length, rh = H * 0.8 / rows;
    LESSONS.forEach((L, i) => {
      const y = H * 0.19 + rh * (i + 0.5);
      g.fillStyle = i % 2 ? "#ebe6d6" : "#f6f2e6"; g.fillRect(0, y - rh / 2, W, rh);
      g.fillStyle = "#2a3a2e"; g.textAlign = "left"; g.font = `700 ${Math.round(rh * 0.5)}px "M PLUS Rounded 1c", "Segoe UI", sans-serif`;
      g.fillText(`${i + 1}  ${L.name}`, W * 0.06, y);
      g.strokeStyle = L.done ? "#2f8a4e" : "#b8b2a2"; g.lineWidth = rh * 0.09;
      g.strokeRect(W * 0.84, y - rh * 0.28, rh * 0.56, rh * 0.56);
      if (L.done) { g.beginPath(); g.moveTo(W * 0.84 + rh * 0.1, y); g.lineTo(W * 0.84 + rh * 0.24, y + rh * 0.16); g.lineTo(W * 0.84 + rh * 0.5, y - rh * 0.2); g.stroke(); }
    });
  }
  function schoolPlaces() {
    const P = {
      hall:    { label: "Main hall", sub: "Back out", icon: "door", x: -17.6, z: 0.75, face: -PI / 2, ax: -18.9, ay: 3.6, az: 0.75,
                 door: "hall", room: "hall", arrive: "tutorial" },
      lessons: { station: "tutorial", sub: "Timetable", x: -17, z: -0.75, face: PI, ax: -17, ay: 2.95, az: -1.4 },
    };
    LESSONS.slice(0, 7).forEach((L, i) => P["c" + i] = {
      label: L.name, sub: L.done ? "Classroom · done" : "Classroom", icon: "cap",
      x: classX(i), z: -0.6, face: PI, ax: classX(i), ay: 3.2, az: -1.4, door: "s" + i, room: "class", v: i, arrive: "door" });
    return P;
  }
  const SCHOOL_POIS = [
    { x: 18.25, z: 0.6, face: PI / 2, act: "look" },
    { x: 17.75, z: -0.8, face: PI, act: "drink", icon: "juice" },
    { x: -17.4, z: -0.8, face: PI, act: "read", icon: "clipboard" }, { x: -16.6, z: -0.8, face: PI, act: "read" },
    // at her locker
    ...LOCKERS.map(x => ({ x: x + 0.3, z: -0.55, face: PI, act: "browse" })),
  ];
  const SCHOOL_HUDDLES = [[-9, 1.1], [2.25, 1.1], [11.25, 1.1]];
  const SCHOOL_THINGS = [
    { kind: "fountain", label: "Have a drink", poi: [1], x: 17.75, z: -0.8, face: PI, ax: 17.75, ay: 1.6, az: -1.4 },
    { kind: "look", label: "Look out", poi: [0], x: 18.25, z: 0.6, face: PI / 2, ax: 18.95, ay: 2.5, az: 0.6,
      say: ["Somebody's doing laps out there already.", "Not long till the bell.", "The track looks fast today."] },
  ];
  const SCHOOL_BLOCKS = [...LOCKERS.map(x => [x - 0.95, -1.5, x + 0.95, -1.0]), [17.35, -1.5, 18.15, -0.95], [18.45, -1.5, 18.8, -1.2]];
  function schoolWalkable(x, z, r) {
    if (x < SW.x0 + r || x > SW.x1 - r || z < SW.z0 + r || z > SW.z1 - r) return false;
    for (const b of SCHOOL_BLOCKS) if (x > b[0] - r && x < b[2] + r && z > b[1] - r && z < b[3] + r) return false;
    return true;
  }
  function buildSchool(R) {
    const g = new THREE.Group(), D = SCHOOL;
    const shell = new THREE.Mesh(schoolShell(), MAT); shell.receiveShadow = true; g.add(shell);
    const props = new THREE.Mesh(schoolProps(), MAT); props.receiveShadow = true; g.add(props);
    g.add(pane(2.5, 2, D.x1 + 0.09, 2.0, 0.5, -PI / 2));
    g.add(outdoors({ x: D.x1 + 0.25, dir: 1, z0: -30, z1: 3.0, seed: 57 }));
    for (let i = -1; i < 7; i++) glow(g, classX(i) + 2.25, D.h - 0.2, 0.5, 2.6);
    R.doors = {};
    for (const id in SCHOOL_DOORS) { const d = makeDoor(SCHOOL_DOORS[id]); R.doors[id] = d; g.add(d.g); }
    hangSign(g, "SCHOOL WING", D.x0 + 0.03, 3.4, 0.75, PI / 2, 0.6, "#2f6a4e", "#f6efdc");
    // the timetable, repainted each time she comes in (dressSchool)
    const cv = document.createElement("canvas"); cv.width = 512; cv.height = 320;
    R.timetable = { cv, tex: new THREE.CanvasTexture(cv) };
    const tt = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.5625), new THREE.MeshBasicMaterial({ map: R.timetable.tex }));
    tt.position.set(-17, 1.75, D.z0 + F + 0.004); g.add(tt);
    // a plate over each door, the lesson and whether it is done (dressSchool)
    R.plates = [];
    for (let i = 0; i < 7; i++) { const slot = new THREE.Group(); slot.position.set(classX(i), 2.85, D.z0 + 0.01); g.add(slot); R.plates.push({ slot, key: "" }); }
    return g;
  }
  /** The corridor as it stands today: the lessons on the doors, done or not, and on the timetable. */
  function dressSchool(R) {
    R.places = schoolPlaces();
    R.plates.forEach((p, i) => {
      const L = LESSONS[i], key = L ? L.id + (L.done ? ":done" : "") : "";
      if (p.key === key) return;
      p.key = key;
      for (const m of p.slot.children.slice()) { p.slot.remove(m); m.material.map.dispose(); m.material.dispose(); m.geometry.dispose(); }
      if (L) p.slot.add(plate([L.name, `Lesson ${i + 1}${L.done ? " · done" : ""}`], 1.25, 0.4, L.done ? "#e4efe0" : "#f6f0e2", "#2a3a2e"));
    });
    timetablePaint(R.timetable.cv); R.timetable.tex.needsUpdate = true;
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { timetablePaint(R.timetable.cv); R.timetable.tex.needsUpdate = true; });
  }

  // ================================================================ a classroom
  /* The classroom for one lesson: the blackboard across the front on a low platform, the
     lesson chalked up on it (classBoard); the teacher's desk to one side of it; three rows
     of three desks, each with its chair; the sliding door from the corridor on the left;
     tall windows onto the grounds on the right; a clock over the board; a notice board by
     the door. One room, dressed for the lesson she came in for (dressClass). */
  const CLASS = { x0: -4.25, x1: 4.25, z0: -3.75, z1: 4.75, h: 3.75 };
  const CLW = { x0: -4.0, x1: 4.0, z0: -3.5, z1: 3.75 };
  const DESK_X = [-1.75, 0.375, 2.5], DESK_Z = [-1.25, 0.25, 1.75];
  const CLASS_WINDOWS = [[-3.0, -0.75], [-0.25, 2.0]];
  const CLASS_DOORS = {
    door: { x: CLASS.x0, z: 2.25, yaw: PI / 2, w: 1.5, h: 2.25, leaf: leafSlide, slide: 1, frame: frameArch(C.woodD, C.woodD),
            beyond: { top: 0xf6f2e6, bottom: 0xdcd9ce, floor: 0xd0cdc0 } },
  };
  function classShell() {
    const c = canvas(S, 91), { box, clear, jit } = c, O = CLASS;
    box(O.x0, -0.25, O.z0, O.x1, 0, O.z1, (X, Y, Z) => {
      const col = Math.round((X - O.x0) / S), k = Math.floor((Z - O.z0 + (col % 4) * 0.5) / 1.5);
      return jit([C.plankA, C.plankB, C.plankC][((col * 7 + k * 13) % 3 + 3) % 3], 0.04);
    });
    const wall = (X, Y) => Y < 0.25 ? 0x5e6a60 : Y < 1.0 ? 0xc8d6c4 : Y < 1.125 ? 0xe4e8da : Y >= O.h - 0.25 ? C.crown : 0xf4f2e8;
    box(O.x0, 0, O.z0 - 0.25, O.x1, O.h, O.z0, wall);
    box(O.x0 - 0.25, 0, O.z0 - 0.25, O.x0, O.h, O.z1, wall);
    box(O.x1, 0, O.z0 - 0.25, O.x1 + 0.25, O.h, O.z1, wall);
    box(O.x0 - 0.25, O.h, O.z0 - 0.25, O.x1 + 0.25, O.h + 0.25, O.z1, C.ceiling);
    const d = CLASS_DOORS.door;
    clear(O.x0 - 0.25, 0, d.z - d.w / 2, O.x0, d.h, d.z + d.w / 2);
    for (const [a, b] of CLASS_WINDOWS) clear(O.x1, 1.0, a, O.x1 + 0.25, 2.75, b);
    return c.mesh((X, Y, Z, nx, ny, nz) => !(ny < 0 && Y < 0) && !(ny > 0 && Y >= O.h) && !(nz < 0 && Z < O.z0 - 0.2)
      && !(nx < 0 && X < O.x0 - 0.2) && !(nx > 0 && X >= O.x1));
  }
  function classProps() {
    const c = canvas(F, 9191), { box } = c, O = CLASS, z0 = O.z0;
    // the platform along the front, and the blackboard's frame and chalk tray (the board: classBoard)
    box(-3.25, 0, z0, 3.25, 0.1875, -2.75, (X, Y, Z) => Z >= -2.8125 ? C.woodD : C.wood);
    box(-2.875, 0.875, z0, 2.875, 2.5, z0 + F, 0xb8bcc4);
    box(-2.875, 0.875, z0 + F, 2.875, 0.9375, z0 + 0.1875, 0xb8bcc4);
    for (const [x, col] of [[-2.25, 0xf6f6f2], [-2.0, 0xf2c8d0], [-1.8125, 0xf6e6a0]]) box(x, 0.9375, z0 + 0.0625, x + 0.125, 1.0, z0 + 0.125, col);   // chalk
    box(2.25, 0.9375, z0 + F, 2.5, 1.0, z0 + 0.1875, 0x3a3a40);                              // the eraser
    // the teacher's desk, on the platform by the windows: the register, a pot of chalk, flowers
    const tt = 0.1875 + 0.75;
    box(1.75, 0.1875, -3.4375, 3.0, tt - F, -2.875, C.wood);
    box(1.6875, tt - F, -3.5, 3.0625, tt, -2.8125, C.woodL);
    box(2.0, tt, -3.25, 2.4375, tt + F, -2.9375, 0x2a4a8a);
    cyl(c, 2.75, -3.125, 0.0625, tt, tt + 0.1875, 0xf6f2ea);
    for (const [ox, col] of [[-0.0625, 0xf07aa8], [0.0625, 0xf0c040]]) box(2.75 + ox, tt + 0.1875, -3.1875, 2.75 + ox + F, tt + 0.25, -3.125, col);
    // the desks: a light top on steel legs, a shelf under it, the chair behind
    for (const dx of DESK_X) for (const dz of DESK_Z) {
      const top = 0.6875;
      box(dx - 0.3125, top, dz - 0.25, dx + 0.3125, top + F, dz + 0.1875, C.woodL);
      box(dx - 0.3125, top - 0.125, dz - 0.25, dx + 0.3125, top - F, dz + 0.0625, 0x8a92a0);
      for (const lx of [dx - 0.3125, dx + 0.25]) for (const lz of [dz - 0.25, dz + 0.125]) box(lx, 0, lz, lx + F, top, lz + F, 0x8a92a0);
      const cz = dz + 0.5625;
      for (const lx of [dx - 0.1875, dx + 0.125]) for (const lz of [cz - 0.1875, cz + 0.125]) box(lx, 0, lz, lx + F, 0.4375, lz + F, 0x8a92a0);
      box(dx - 0.1875, 0.4375, cz - 0.1875, dx + 0.1875, 0.5, cz + 0.1875, C.woodL);
      box(dx - 0.1875, 0.5, cz + 0.125, dx + 0.1875, 0.875, cz + 0.1875, C.woodL);
    }
    // the windows: white frames, a bar across, the sills; curtains drawn back between them
    for (const [a, b] of CLASS_WINDOWS) {
      const x = O.x1;
      box(x - F, 0.8125, a - 0.1875, x, 2.9375, b + 0.1875, C.frame);
      c.clear(x - F, 1.0, a, x, 2.75, b);
      box(x + 0.0625, 1.875, a, x + 0.125, 1.9375, b, C.frame);
      box(x + 0.0625, 1.0, (a + b) / 2, x + 0.125, 2.75, (a + b) / 2 + F, C.frame);
      box(x - 0.25, 0.9375, a - 0.1875, x, 1.0, b + 0.1875, C.frame);
    }
    box(O.x1 - 0.1875, 0.75, -0.6875, O.x1 - F, 2.9375, -0.3125, (X, Y, Z) => ((Z + 0.6875) % 0.125) < F ? 0xe8d8a8 : 0xf6eac0);
    // a clock over the board, and a notice board between the board and the door
    c.box(-0.3125, 2.625, z0, 0.3125, 3.25, z0 + F, (X, Y) => {
      const dx = X + c.h, dy = Y + c.h - 2.9375, r = Math.hypot(dx, dy);
      if (r > 0.3125) return undefined;
      if (r > 0.25) return 0x3a3a40;
      return (Math.abs(dx) < 0.035 && dy > 0 && dy < 0.2) || (Math.abs(dy) < 0.035 && dx > 0 && dx < 0.14) ? 0x2a2a30 : 0xf8f6f0;
    });
    box(O.x0, 1.125, -1.75, O.x0 + F, 2.375, 0.75, C.woodD);
    box(O.x0 + F, 1.1875, -1.6875, O.x0 + 2 * F, 2.3125, 0.6875, () => c.jit(C.cork, 0.06));
    [[-1.5, 1.5, 0xf6f2e8], [-0.75, 1.75, 0xf0c8d8], [0.0, 1.375, 0xc8e0f0], [-1.125, 1.9375, 0xf6e0a0]].forEach(([z, y, col]) =>
      box(O.x0 + 2 * F, y, z, O.x0 + 3 * F, y + 0.3125, z + 0.4375, col));
    // two rows of lights across the ceiling
    for (const lx of [-1.5, 1.5]) box(lx - 0.125, O.h - F, -2.5, lx + 0.125, O.h, 2.5, C.lamp);
    return c.mesh(notUnder);
  }
  /** The lesson on the board: its name, what it covers, a chalk drawing of it, which lesson
      of how many; ringed "Done" once she has taken it. */
  const CHALK_DRAW = {
    race: (g, x, y, s) => { g.beginPath(); g.ellipse(x, y, 1.7 * s, s, 0, 0, PI * 2); g.stroke();
      g.setLineDash([s * 0.15, s * 0.15]); g.beginPath(); g.ellipse(x, y, 1.35 * s, 0.7 * s, 0, PI * 0.2, PI * 1.6); g.stroke(); g.setLineDash([]);
      g.beginPath(); g.moveTo(x + 1.7 * s, y); g.lineTo(x + 1.7 * s, y - 0.9 * s); g.lineTo(x + 2.2 * s, y - 0.75 * s); g.lineTo(x + 1.7 * s, y - 0.6 * s); g.stroke(); },
    exhibition: (g, x, y, s) => { for (let i = 0; i < 6; i++) { g.strokeRect(x - 1.8 * s + i * 0.6 * s, y - 0.6 * s, 0.5 * s, 1.2 * s);
      g.fillText(String(i + 1), x - 1.55 * s + i * 0.6 * s, y + 0.95 * s); } },
    deck: (g, x, y, s) => { for (let i = 0; i < 3; i++) { g.save(); g.translate(x + (i - 1) * 0.55 * s, y); g.rotate((i - 1) * 0.25);
      g.strokeRect(-0.4 * s, -0.6 * s, 0.8 * s, 1.2 * s); g.restore(); } g.fillText("×2", x + 1.5 * s, y - 0.7 * s); },
    scout: (g, x, y, s) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, r = i % 2 ? 0.45 * s : s;
      g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.stroke();
      for (const [dx, dy] of [[1.4, -0.7], [-1.4, 0.6], [1.2, 0.8]]) { g.beginPath(); g.moveTo(x + dx * s - 0.15 * s, y + dy * s); g.lineTo(x + dx * s + 0.15 * s, y + dy * s);
        g.moveTo(x + dx * s, y + dy * s - 0.15 * s); g.lineTo(x + dx * s, y + dy * s + 0.15 * s); g.stroke(); } },
    career: (g, x, y, s) => { for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) g.strokeRect(x - 1.6 * s + k * 0.8 * s, y - 0.9 * s + r * 0.6 * s, 0.8 * s, 0.6 * s);
      g.beginPath(); g.arc(x + 0.8 * s, y + 0.6 * s, 0.32 * s, 0, PI * 2); g.stroke(); },
    dream: (g, x, y, s) => { g.beginPath(); g.arc(x - 0.6 * s, y, 0.55 * s, PI * 0.5, PI * 1.5); g.arc(x, y - 0.4 * s, 0.6 * s, PI, PI * 2);
      g.arc(x + 0.7 * s, y, 0.5 * s, PI * 1.5, PI * 0.5); g.closePath(); g.stroke(); g.fillText("!", x + 1.6 * s, y - 0.5 * s); },
    rival: (g, x, y, s) => { for (const d of [-1, 1]) { g.beginPath(); g.moveTo(x + d * 1.8 * s, y); g.lineTo(x + d * 0.5 * s, y);
      g.moveTo(x + d * 0.8 * s, y - 0.3 * s); g.lineTo(x + d * 0.5 * s, y); g.lineTo(x + d * 0.8 * s, y + 0.3 * s); g.stroke(); }
      g.beginPath(); g.moveTo(x + 0.1 * s, y - 0.7 * s); g.lineTo(x - 0.15 * s, y); g.lineTo(x + 0.15 * s, y); g.lineTo(x - 0.1 * s, y + 0.7 * s); g.stroke(); },
  };
  function boardPaint(cv, L, i) {
    const g = cv.getContext("2d"), W = cv.width, H = cv.height, rnd = mulberry32(31 + i);
    g.fillStyle = "#2c4a3a"; g.fillRect(0, 0, W, H);
    g.fillStyle = "rgba(255,255,255,.045)";
    for (let k = 0; k < 40; k++) g.fillRect(rnd() * W, rnd() * H, 60 + rnd() * 200, 4 + rnd() * 12);         // old chalk
    const chalk = "rgba(244,242,232,.92)";
    g.fillStyle = chalk; g.strokeStyle = chalk; g.lineWidth = H * 0.016; g.lineCap = "round"; g.lineJoin = "round";
    g.textBaseline = "middle"; g.textAlign = "left";
    g.font = `700 ${Math.round(H * 0.075)}px "M PLUS Rounded 1c", "Segoe UI", sans-serif`;
    g.fillText(`Lesson ${i + 1} of ${LESSONS.length}`, W * 0.04, H * 0.12);
    g.font = `400 ${Math.round(H * 0.17)}px "Dela Gothic One", "Arial Black", sans-serif`;
    g.fillText(L.name, W * 0.04, H * 0.32);
    // what it covers, wrapped
    g.font = `700 ${Math.round(H * 0.085)}px "M PLUS Rounded 1c", "Segoe UI", sans-serif`;
    const words = String(L.text || "").split(" "), lines = [];
    let line = "";
    for (const w of words) { const t = line ? line + " " + w : w; if (g.measureText(t).width > W * 0.58 && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line);
    lines.slice(0, 4).forEach((t, k) => g.fillText(t, W * 0.04, H * (0.55 + k * 0.12)));
    g.font = `700 ${Math.round(H * 0.11)}px "M PLUS Rounded 1c", "Segoe UI", sans-serif`; g.textAlign = "center";
    const draw = CHALK_DRAW[L.id];
    if (draw) draw(g, W * 0.81, H * 0.5, H * 0.17);
    if (L.done) {                                                                            // ringed in pink chalk
      g.strokeStyle = g.fillStyle = "rgba(246,170,190,.95)";
      g.beginPath(); g.ellipse(W * 0.81, H * 0.86, W * 0.07, H * 0.09, -0.08, 0, PI * 2); g.stroke();
      g.font = `400 ${Math.round(H * 0.09)}px "Dela Gothic One", "Arial Black", sans-serif`; g.fillText("Done", W * 0.81, H * 0.865);
    }
  }
  const CLASS_PLACES_DOOR = { label: "Corridor", sub: "Back out", icon: "door", x: -2.75, z: 2.25, face: -PI / 2, ax: -4.15, ay: 2.8, az: 2.25,
                              door: "door", room: "school", arrive: () => "c" + ROOMS.class.v };
  // the desks' chairs (got into from the aisle beside each), the window, the board
  const CLASS_SEATS = [];
  for (const dz of DESK_Z) for (const dx of DESK_X)
    CLASS_SEATS.push({ x: dx, z: dz + 0.5625, face: PI, act: "study", seat: true, from: { x: dx + 0.75, z: dz + 0.5625 } });
  const CLASS_POIS = [...CLASS_SEATS, { x: 3.55, z: 0.9, face: PI / 2, act: "look" }, { x: -1.5, z: -2.3, face: PI, act: "read" }];
  const CLASS_HUDDLES = [[-3.15, 0.0]];
  const CLASS_THINGS = [
    ...CLASS_SEATS.map((p, i) => ({ kind: "sit", label: "Take a seat", pose: "study", poi: [i] })),
    { kind: "look", label: "Look out", poi: [CLASS_SEATS.length], x: 3.55, z: 0.9, face: PI / 2, ax: 4.15, ay: 2.4, az: 0.9,
      say: ["I can see the track from up here.", "Eyes front... in a minute.", "The bell's going to go any second."] },
  ];
  const CLASS_BLOCKS = [
    [-3.25, -3.75, 3.25, -2.75],
    ...DESK_X.flatMap(dx => DESK_Z.map(dz => [dx - 0.375, dz - 0.3, dx + 0.375, dz + 0.8])),
    [CLASS.x0, -1.8, CLASS.x0 + 0.2, 0.8],
  ];
  function classWalkable(x, z, r) {
    if (x < CLW.x0 + r || x > CLW.x1 - r || z < CLW.z0 + r || z > CLW.z1 - r) return false;
    for (const b of CLASS_BLOCKS) if (x > b[0] - r && x < b[2] + r && z > b[1] - r && z < b[3] + r) return false;
    return true;
  }
  function buildClass(R) {
    const g = new THREE.Group(), O = CLASS;
    const shell = new THREE.Mesh(classShell(), MAT); shell.receiveShadow = true; g.add(shell);
    const props = new THREE.Mesh(classProps(), MAT); props.receiveShadow = true; g.add(props);
    for (const [a, b] of CLASS_WINDOWS) g.add(pane(b - a, 1.75, O.x1 + 0.09, 1.875, (a + b) / 2, -PI / 2));
    g.add(outdoors({ x: O.x1 + 0.25, dir: 1, z0: -30, z1: 2.25, seed: 66 }));
    for (const lx of [-1.5, 1.5]) for (const lz of [-1.5, 1.5]) glow(g, lx, O.h - 0.15, lz, 2.0);
    R.doors = {};
    for (const id in CLASS_DOORS) { const d = makeDoor(CLASS_DOORS[id]); R.doors[id] = d; g.add(d.g); }
    // the board, its lesson chalked up for whichever lesson she came in for (dressClass)
    const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 280;
    R.board = { cv, tex: new THREE.CanvasTexture(cv) };
    const b = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 1.5), new THREE.MeshBasicMaterial({ map: R.board.tex }));
    b.position.set(0, 1.6875, O.z0 + F + 0.004); g.add(b);
    return g;
  }
  /** Dress the classroom for lesson `v`: its board, and the place at the board that starts it. */
  function dressClass(R, v) {
    R.v = v;
    const L = LESSONS[v] || LESSONS[0];
    R.places = {
      door: CLASS_PLACES_DOOR,
      lesson: { label: L.name, sub: L.done ? "Done · take it again" : "Start the lesson", icon: "cap", lesson: L.id,
                x: 0, z: -2.3, face: PI, ax: 0, ay: 2.75, az: -3.6 },
    };
    const paint = () => { boardPaint(R.board.cv, L, v); R.board.tex.needsUpdate = true; };
    paint();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(paint);
  }

  // ================================================================ the training track
  /* Out through the Scouting doors on the hall's right: the academy's old training track,
     the way Cinderella Gray draws Kasamatsu's -- a small local course by a river. A deep-sand
     oval with tired white rails (a gap here and there, rust where the paint has gone), a worn
     infield, an old roofed grandstand of concrete steps, a tin shed, floodlights at the
     corners, a chain-link fence, a sidewalk along the school and one along the road, the
     river's levee behind with a path on top, an iron railway bridge over the river beyond it,
     and the mountains. Racers warm up: jogging laps, kicking up the sand; stretching; drills.
     Trainers at the rail time them, take notes, coach, and recruit at a table -- those are
     the scout stations. After dark the floodlights come on and the racers go in. Everything
     out here is lit as the grounds are (OUT_MAT), so it follows the hour. */
  const TRACK = { x0: -22, x1: 26, z0: -24, z1: 11 };
  const TW = { x0: -21.6, x1: 25.0, z0: -17.6, z1: 10.0 };
  // the oval: a stadium shape round (cx, cz), its straights 2L long, the rails at rin and
  // rout, the line they jog at rjog; run right-handed (the near straight right to left)
  const OVAL = { cx: 5, cz: -5, L: 7, rin: 5, rout: 8.75, rjog: 6.875 };
  const ovalD = (x, z) => Math.hypot(Math.max(Math.abs(x - OVAL.cx) - OVAL.L, 0), z - OVAL.cz);
  const ovalLen = r => 4 * OVAL.L + 2 * PI * r;
  /** The point `s` metres round the oval at radius r, from the near straight's right end. */
  function ovalAt(r, s) {
    const { cx, cz, L } = OVAL, P = ovalLen(r), arc = PI * r;
    s = ((s % P) + P) % P;
    if (s < 2 * L) return { x: cx + L - s, z: cz + r };
    s -= 2 * L;
    if (s < arc) { const a = PI / 2 + s / r; return { x: cx - L + r * Math.cos(a), z: cz + r * Math.sin(a) }; }
    s -= arc;
    if (s < 2 * L) return { x: cx - L + s, z: cz - r };
    s -= 2 * L;
    const a = -PI / 2 + s / r;
    return { x: cx + L + r * Math.cos(a), z: cz + r * Math.sin(a) };
  }
  // the gaps in the rails, to cross onto the track and into the infield (near straight, x from..to)
  const RAIL_GAPS = { out: [-1.5, 1.5], in: [8.5, 11] };
  const inGap = (which, x, z) => z > OVAL.cz && x >= RAIL_GAPS[which][0] && x <= RAIL_GAPS[which][1];
  // where they join the jogging line (through the outer gap), and how far round that is
  const JOG = { r: OVAL.rjog, P: ovalLen(OVAL.rjog), entry: { x: 0, z: OVAL.cz + OVAL.rjog }, s0: OVAL.cx + OVAL.L };
  const TRACK_EXIT = { x: -20.25, z: -5.5 };                // the school's doors: where they go in at night
  const afterDark = () => sky.hour >= 19.25 || sky.hour < 5.75;
  const TRACK_DOORS = {
    hall: { x: TRACK.x0, z: -5.5, yaw: PI / 2, w: 2.5, h: 3, leaves: 2, leaf: leafEmblem(0xb8343a, C.fringe, star), frame: frameArch(C.fringe, C.brassD),
            beyond: { top: 0xf8f2e6, bottom: 0xe6ddca, floor: 0xe6ddca } },
  };
  // a bench (seats along x, facing the track), the floodlights, the trees: where they stand
  const TRACK_BENCHES = [6.5, 10.5];
  const FLOODS = [[-9.5, 7.5], [19.5, 7.5], [-6.5, -16.5], [19.5, -16.5]];
  const TRACK_TREES = [[23.25, -15], [23.5, -8.5], [23.25, 8.5], [-17.5, 8.25], [-12.5, 9.0], [-19, -14.5]];
  function trackTree(c, x, z, s) {
    c.box(x - 0.25, 0, z - 0.25, x + 0.25, 2.25 * s, z + 0.25, 0x6a4a30);
    leaves(c, x, 3.0 * s, z, 1.6 * s, 1.3 * s, 1.6 * s);
    leaves(c, x - 0.9 * s, 2.5 * s, z + 0.4 * s, 1.0 * s, 0.85 * s, 1.0 * s);
    leaves(c, x + 0.8 * s, 2.6 * s, z - 0.5 * s, 1.0 * s, 0.85 * s, 1.0 * s);
  }
  /** The ground and everything built at the building's grain: the track, the levee, the
      school's side, the grandstand, the shed, the floodlights' poles, the bridge, the trees. */
  function trackWorks() {
    const c = canvas(S, 101), { box, clear, jit, rnd } = c, T = TRACK, O = OVAL;
    // the ground: sand on the oval, darker where they run; a worn infield; grass, worn by the
    // stand; the sidewalk along the school and the one along the road
    box(T.x0, -0.25, T.z0, T.x1, 0, T.z1, (X, Y, Z) => {
      const x = X + S / 2, z = Z + S / 2, d = ovalD(x, z);
      if (x < -19.75 || (z > 8.5 && z < 10.25)) return jit(0xc8c4b8, 0.03);
      if (z >= 10.25) return jit(0x8a8a86, 0.03);                                            // the road's edge
      if (d >= O.rin && d <= O.rout) return jit(Math.abs(d - O.rjog) < 0.6 ? 0xa8845a : 0xc2a276, 0.06);
      if (d < O.rin) return rnd() < 0.22 ? jit(0x9a8a5a, 0.05) : jit(0x7cb05a, 0.07);
      if (x < -7 && z < -12) return rnd() < 0.5 ? jit(0x9a8a5a, 0.05) : jit(0x84ac5a, 0.06);
      return rnd() < 0.1 ? jit(0x8a9a5a, 0.05) : jit(0x7cb25c, 0.06);
    });
    // the levee: up from the grass to a paved path along its top, and down to the river
    for (let z = -18; z > -23.25; z -= S) {
      const k = -18 - z, h = k < 2 ? 2.25 * k / 2 : k < 3.5 ? 2.25 : 2.25 * Math.max(0, 1 - (k - 3.5) / 1.5);
      if (h < S / 2) continue;
      box(-34, 0, z - S, 58, Math.round(h / S) * S, z, (X, Y) =>
        k >= 2 && k < 3.5 && Y >= 2.0 ? (k < 2.25 || k >= 3.25 ? 0xe8e6de : jit(0x8c8c88, 0.04)) : jit(0x7cb25c, 0.07));
    }
    // the school's side: two storeys, windows, a cornice; the Scouting doors (makeDoor)
    box(T.x0 - 0.25, 0, -18, T.x0, 8.5, T.z1, (X, Y, Z) => {
      if (Y < 0.5) return 0x8a8478;
      const u = ((Z + 16) % 3 + 3) % 3, win = u >= 0.75 && u < 2.25 && Math.abs(Z - -5.5) > 2;
      if (win && ((Y >= 1.25 && Y < 2.75) || (Y >= 5 && Y < 6.5))) return Y % 1.5 < 0.25 ? C.frame : 0x8ab4cc;
      return Y >= 8.0 ? C.colCap : jit(C.wall, 0.02);
    });
    box(T.x0 - 0.25, 8.25, -18, T.x0 + 0.25, 8.5, T.z1, C.colCap);
    const d = TRACK_DOORS.hall;
    clear(T.x0 - 0.25, 0, d.z - d.w / 2, T.x0, d.h, d.z + d.w / 2);
    // the grandstand: four concrete steps up under a tin roof on posts, a wall behind
    const g0 = -18, g1 = -8;
    for (let k = 0; k < 4; k++)
      box(g0, 0, -15.25 - 0.75 * k, g1, 0.5 * (k + 1), -14.5 - 0.75 * k, (X, Y) =>
        Y >= 0.5 * k + 0.25 ? (rnd() < 0.1 ? 0x9a948a : 0x8a6a4a) : jit(0xb8b4aa, 0.05));
    box(g0, 0, -17.75, g1, 3.75, -17.5, (X, Y) => Y < 2.25 ? jit(0xb0aca2, 0.05) : jit(0xc8c4b8, 0.04));
    for (let x = g0; x <= g1 - 0.25; x += 2.5) box(x, 0, -14.5, x + 0.25, 3.75, -14.25, 0x7a8288);
    box(g0 - 0.25, 3.75, -17.75, g1 + 0.25, 4.0, -14.0, (X, Y, Z) =>
      Math.round(X / S) % 2 ? (rnd() < 0.15 ? 0x9a5a3a : 0x5a8a86) : (rnd() < 0.15 ? 0x8a4a2a : 0x4e7c78));
    // the tin shed by the far curve: ribbed walls, a door, a flat roof
    box(22, 0, 2, 25, 2.75, 5, (X, Y, Z) => (Math.round(X / S) + Math.round(Z / S)) % 2 ? 0x8a9aa0 : 0x7a8a90);
    box(22, 0, 3, 22.25, 2.0, 4.25, 0x5a4a3a);
    box(21.75, 2.75, 1.75, 25.25, 3.0, 5.25, (X) => rnd() < 0.2 ? 0x9a5a3a : 0x6a7a80);
    // the floodlights' poles
    for (const [x, z] of FLOODS) box(x - 0.125, 0, z - 0.125, x + 0.125, 9, z + 0.125, 0x8a8e94);
    // over the river: an iron railway bridge, its deck on piers, a truss along each side
    const bz0 = -52, bz1 = -50;
    box(-60, 3, bz0, 80, 3.25, bz1, 0x6a6a6a);
    for (let x = -55; x <= 75; x += 20) box(x - 0.5, -1, bz0, x + 0.5, 3, bz1, 0xa8a49a);
    for (const z of [bz0, bz1 - 0.25]) {
      box(-60, 3.25, z, 80, 3.5, z + 0.25, 0x9a3a2e);
      box(-60, 6.0, z, 80, 6.25, z + 0.25, 0x9a3a2e);
      for (let x = -60; x < 80; x += 5) {
        box(x, 3.5, z, x + 0.25, 6.0, z + 0.25, 0x9a3a2e);
        for (let t = 0; t < 10; t++) box(x + t * 0.5, 3.5 + t * 0.25, z, x + t * 0.5 + 0.5, 3.75 + t * 0.25, z + 0.25, 0x8a3226);
      }
    }
    // trees round the edge
    for (const [x, z] of TRACK_TREES) trackTree(c, x, z, 1.0 + rnd() * 0.25);
    return c.mesh((X, Y, Z, nx, ny) => !(ny < 0 && Y < 0) && !(nx < 0 && X < TRACK.x0 - 0.2));
  }
  /** The fine work: the rails (worn, gapped), the furlong poles and the winning post, the
      benches, the recruiting table, the tap, cones in the infield, the floodlights' lamps,
      the chain-link fence along the far side, a canopy over the school's doors. */
  function trackFittings() {
    const c = canvas(F, 1010), { box, rnd } = c, O = OVAL;
    for (const [r, which] of [[O.rin, "in"], [O.rout, "out"]]) {
      const P = ovalLen(r);
      let worn = false, gone = false;
      for (let s = 0; s < P; s += F) {
        const p = ovalAt(r, s);
        if (inGap(which, p.x, p.z)) continue;
        if (Math.round(s / F) % 24 === 0) { worn = rnd() < 0.18; gone = rnd() < 0.05; }
        if (gone) continue;
        const col = worn ? 0xa09a8c : 0xf2f0e8, x = Math.floor(p.x / F) * F, z = Math.floor(p.z / F) * F;
        box(x, 0.8125, z, x + F, 0.9375, z + F, col);
        if (Math.round(s / F) % 24 === 0) box(x, 0, z, x + F, 0.8125, z + F, worn ? 0x8a867c : 0xe6e4dc);   // a post
      }
    }
    // furlong poles round the inside, red and white; the winning post on the near straight
    for (let k = 0; k < 4; k++) {
      const p = ovalAt(O.rin - 0.25, ovalLen(O.rin - 0.25) * (k + 0.5) / 4), x = Math.floor(p.x / F) * F, z = Math.floor(p.z / F) * F;
      box(x, 0, z, x + 0.125, 1.625, z + 0.125, (X, Y) => Math.floor(Y / 0.25) % 2 ? 0xd8302a : 0xf6f2e8);
    }
    box(6, 0, -0.25, 6.125, 2.125, -0.125, 0xf6f2e8);
    c.box(5.6875, 1.75, -0.25, 6.4375, 2.5, -0.1875, (X, Y) => {
      const r = Math.hypot(X + c.h - 6.0625, Y + c.h - 2.125);
      return r > 0.375 ? undefined : r > 0.25 ? 0xd8302a : 0xf6f2e8;
    });
    // the benches by the rail, facing the track: slats on steel, a back on the far side
    for (const bx of TRACK_BENCHES) {
      box(bx - 0.8125, 0.375, 5.5, bx + 0.8125, 0.4375, 5.875, (X, Y, Z) => Math.round(Z / F) % 2 ? C.wood : C.woodL);
      box(bx - 0.8125, 0.5625, 5.8125, bx + 0.8125, 0.875, 5.875, C.woodL);
      for (const lx of [bx - 0.75, bx + 0.6875]) { box(lx, 0, 5.5625, lx + F, 0.375, 5.8125, C.chromeD); box(lx, 0.4375, 5.8125, lx + F, 0.875, 5.875, C.chromeD); }
    }
    // the recruiting table: a folding table of papers, a stopwatch, a box of forms, a chair behind
    box(-5.625, 0.6875, 5.25, -4.375, 0.75, 5.875, 0xe8e2d0);
    for (const lx of [-5.5625, -4.4375]) box(lx, 0, 5.3125, lx + F, 0.6875, 5.8125, C.chromeD);
    for (let i = 0; i < 3; i++) box(-5.4375 + i * 0.25, 0.75, 5.375, -5.25 + i * 0.25, 0.75 + F, 5.625, [0xf6f2e8, 0xf0e6c0, 0xf6f2e8][i]);
    box(-4.75, 0.75, 5.4375, -4.5, 0.9375, 5.6875, 0xb08a5a);
    cyl(c, -4.9375, 5.75, 0.0625, 0.75, 0.75 + F, 0xc0c4cc);
    box(-6.3125, 0, 5.4375, -5.9375, 0.4375, 5.8125, 0x5a6a7a); box(-6.3125, 0.4375, 5.4375, -6.25, 0.875, 5.8125, 0x5a6a7a);   // a folding chair beside it
    // the outdoor tap by the shed: a concrete post, a trough, three taps
    box(21.375, 0, 7.75, 21.625, 0.625, 8.0, 0xa8a49a);
    box(21.0, 0.625, 7.5, 22.0, 0.75, 8.25, 0xb8b4aa);
    box(21.0625, 0.6875, 7.5625, 21.9375, 0.75, 8.1875, 0x8ab0c8);
    for (const tx of [21.1875, 21.4375, 21.6875]) box(tx, 0.75, 8.125, tx + F, 0.9375, 8.1875, C.chromeD);
    // cones in the infield for drills
    for (let x = 2.5; x <= 7.5; x += 1.25) for (let i = 0; i < 4; i++) {
      const r = 0.125 - i * F / 2;
      box(x - r, i * 0.0625, -3.0 - r, x + r + F, (i + 1) * 0.0625, -3.0 + r + F, i === 2 ? 0xf6f2e8 : 0xf07a2a);
    }
    // the floodlights' lamps, turned in toward the track
    for (const [x, z] of FLOODS) {
      box(x - 0.5, 8.75, z - 0.375, x + 0.5, 9.375, z + 0.375, 0x5a5e66);
      box(x - 0.4375, 8.8125, z + (z > 0 ? -0.4375 : 0.375), x + 0.4375, 9.3125, z + (z > 0 ? -0.375 : 0.4375), C.lit);
    }
    // the chain-link fence along the far side, on posts
    c.box(25.5, 0, -17.5, 25.5 + F, 1.75, 10.25, (X, Y, Z) => {
      const i = Math.round(Y / F), j = Math.round(Z / F);
      if (((Z + 17.5) % 2.5) < F) return 0x8a8e94;
      if (Y >= 1.6875) return 0x8a8e94;
      return (i + j) % 4 === 0 || (i - j) % 4 === 0 ? 0xa8acb2 : undefined;
    });
    // a canopy over the school's doors
    box(TRACK.x0, 3.375, -7.0, TRACK.x0 + 1.0, 3.5, -4.0, 0x6a6e76);
    return c.mesh(notUnder);
  }
  /** Far off: the mountains, painted, behind everything. */
  function mountains() {
    const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 256;
    const g = cv.getContext("2d"), rnd = mulberry32(77);
    for (const [base, col, amp] of [[150, "#8aa4b8", 70], [190, "#6a8a7a", 45]]) {
      g.fillStyle = col; g.beginPath(); g.moveTo(0, 256);
      for (let x = 0; x <= 1024; x += 16) g.lineTo(x, base - amp * (0.5 + 0.5 * Math.sin(x / 140 + base) * Math.sin(x / 57 + rnd())));
      g.lineTo(1024, 256); g.closePath(); g.fill();
    }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(420, 105),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, fog: false }));
    m.position.set(10, 20, -125);
    return m;
  }
  // the floodlights' light on the ground at night (daylight sets how much)
  const POOL_MAT = new THREE.MeshBasicMaterial({ map: LAMP_MAT.map, color: 0xfff2cc, transparent: true, opacity: 0,
                                                 depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  function buildTrack(R) {
    const g = new THREE.Group();
    for (const geo of [trackWorks(), trackFittings()]) { const m = new THREE.Mesh(geo, OUT_MAT); m.receiveShadow = true; g.add(m); }
    // the sky all round, the ground beyond, the river, the mountains
    const skyM = new THREE.Mesh(new THREE.BoxGeometry(420, 80, 420), SKY_MAT); skyM.position.set(0, 38, 0); g.add(skyM);
    const flat = (w, d, base, x, y, z) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ color: base, fog: true }));
      m.rotation.x = -PI / 2; m.position.set(x, y, z); g.add(m); outFlats.push({ m, base });
    };
    flat(420, 420, 0x84b45e, 0, -0.03, 0);
    flat(420, 42, 0x5a8ab0, 0, 0.012, -44);                                          // the river, the bridge over it
    const mt = mountains(); g.add(mt); skyDoors.push(mt);
    // the floodlights: a glow at each lamp, light on the track below it
    for (const [x, z] of FLOODS) {
      glow(g, x, 9.05, z + (z > 0 ? -0.5 : 0.5), 4.0);
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), POOL_MAT);
      pool.rotation.x = -PI / 2; pool.position.set(x + (x < 5 ? 5 : -5), 0.02, z + (z > 0 ? -5 : 5)); g.add(pool);
    }
    R.doors = {};
    for (const id in TRACK_DOORS) {
      const d = makeDoor(TRACK_DOORS[id]); R.doors[id] = d; g.add(d.g);
      d.g.traverse(o => { if (o.material === MAT) o.material = OUT_MAT; });          // out of doors, lit as the grounds are
    }
    hangSign(g, "MAIN HALL", TRACK.x0 + 0.03, 3.95, -5.5, PI / 2, 0.6);
    hangSign(g, "TRAINING TRACK", -13, 4.35, -13.95, 0, 1.1, "#2f6a4e", "#f6efdc");
    return g;
  }
  /* Who works out here: the trainers, each at their post, made like the trainer, each with
     their own look. One watches with a stopwatch, one takes notes, one coaches the stretching,
     one recruits at the table; only the old hand stays on after dark. */
  STAFF.track = [
    { id: "staff-veteran", name: "Veteran trainer", x: 4.5, z: 4.55, yaw: PI, work: "watch", hold: "stopwatch", night: true,
      trainer: { sex: "m", style: "slick", hair: 6, skin: 1, attire: "suit", colour: 1, bottoms: "trousers" },
      lines: ["Forty-one flat down the back. Not bad on this sand.", "Every spring I come out here and tell myself: this is the year.",
              "A track like this builds tough legs. The city lot never learn that.", "Heard there's a grey-haired girl who eats like ten and runs like the wind."] },
    { id: "staff-rookie", name: "Rookie trainer", x: 8.5, z: 4.55, yaw: PI, work: "clipboard", hold: "clipboard",
      trainer: { sex: "f", style: "ponytail", hair: 3, skin: 0, attire: "tracksuit", colour: 6, bottoms: "trousers", glasses: true },
      lines: ["I'm meant to be writing all this down... how are they all this fast?", "Would any of them sign with a rookie like me, do you think?",
              "Number three, number three -- she's pulling away again!"] },
    { id: "staff-coach", name: "Track coach", x: 5.0, z: -4.5, yaw: PI, work: "coach",
      trainer: { sex: "m", style: "buzz", hair: 0, skin: 3, attire: "tracksuit", colour: 3, bottoms: "trousers" },
      lines: ["Loosen up those hamstrings! Ten more!", "Knees up! Drive with your arms!", "Good. Now walk it off and get some water."] },
    { id: "staff-scout", name: "Scout", x: -5.0, z: 6.3, yaw: PI, work: "clipboard", hold: "clipboard",
      trainer: { sex: "f", style: "bob", hair: 1, skin: 2, attire: "suit", colour: 4, bottoms: "skirt" },
      lines: ["Looking to recruit? The sign-up sheets are on the table.", "Plenty of hidden talent on a track like this.",
              "Take your time. Watch how they run, not just how fast."] },
  ];
  const TRACK_PLACES = {
    hall:  { label: "Main hall", sub: "Back in", icon: "door", x: -19.6, z: -5.5, face: -PI / 2, ax: -21.9, ay: 4.5, az: -5.5,
             door: "hall", room: "hall", arrive: "scout" },
    table: { station: "scout", label: "Scout", sub: "Recruiting table", x: -5, z: 4.6, face: 0, ax: -5, ay: 2.4, az: 5.6 },
    rail:  { station: "scout", label: "Scout", sub: "Watch from the rail", x: 13, z: 4.6, face: PI, ax: 13, ay: 2.3, az: 3.75 },
  };
  const TRACK_SEATS = [
    ...TRACK_BENCHES.flatMap(bx => [bx - 0.4, bx + 0.4].map(x => ({ x, z: 5.6875, face: PI, act: "sit", seat: true }))),
    /* The grandstand's front step, half a metre up like a bench: two places in each bay
       between the roof posts, sat on near its edge with the legs over it, facing the track.
       She gets on from the grass in front -- the stand itself is blocked to walking. */
    ...[-16.625, -14.125, -11.625, -9.125].flatMap(bx => [bx - 0.55, bx + 0.55].map(x =>
      ({ x, z: -14.7, face: 0, act: "sit", seat: true, stand: true, from: { x, z: -13.55 } }))),
  ];
  const TRACK_POIS = [
    // stretching in the infield in front of the coach, and drills along the cones
    { x: 3.5, z: -6.25, face: 0, act: "stretch" }, { x: 5.0, z: -6.75, face: 0, act: "stretch" }, { x: 6.5, z: -6.25, face: 0, act: "stretch" },
    { x: 2.5, z: -3.75, face: PI / 2, act: "drill" }, { x: 7.5, z: -3.75, face: -PI / 2, act: "drill" },
    ...TRACK_SEATS,
    { x: 21.5, z: 7.0, face: 0, act: "drink", icon: "juice" },
    // a word with the trainers at the rail
    { x: 5.3, z: 4.7, face: -PI / 2, act: "chat" }, { x: 9.3, z: 4.7, face: -PI / 2, act: "chat" },
  ];
  const TRACK_HUDDLES = [[0.5, -1.75], [14.5, 7.25], [-14, 2]];
  const TRACK_THINGS = [
    ...TRACK_SEATS.map((p, i) => ({ kind: "sit", label: p.stand ? "Sit and watch" : "Sit", poi: [5 + i] })),
    { kind: "fountain", label: "Have a drink", poi: [5 + TRACK_SEATS.length], x: 21.5, z: 7.0, face: 0, ax: 21.5, ay: 1.5, az: 7.9 },
    { kind: "stretch", label: "Stretch", poi: [0], x: 3.5, z: -6.25, face: 0, ax: 3.5, ay: 2.0, az: -6.25 },
    { kind: "jog", label: "Jog a lap", x: JOG.entry.x, z: JOG.entry.z, face: -PI / 2, ax: 0, ay: 1.9, az: JOG.entry.z },
  ];
  const TRACK_BLOCKS = [
    [-18.1, -18, -7.9, -14.1],                                                   // the grandstand
    [21.8, 1.8, 25.3, 5.3],                                                      // the shed
    [20.9, 7.4, 22.1, 8.35], [-5.7, 5.2, -4.3, 5.95], [-6.35, 5.4, -5.9, 5.85],  // the tap, the table, its chair
    ...TRACK_BENCHES.map(bx => [bx - 0.85, 5.45, bx + 0.85, 5.95]),
    ...FLOODS.map(([x, z]) => [x - 0.25, z - 0.25, x + 0.25, z + 0.25]),
    ...TRACK_TREES.map(([x, z]) => [x - 0.4, z - 0.4, x + 0.4, z + 0.4]),
  ];
  function trackWalkable(x, z, r) {
    if (x < TW.x0 + r || x > TW.x1 - r || z < TW.z0 + r || z > TW.z1 - r) return false;
    for (const b of TRACK_BLOCKS) if (x > b[0] - r && x < b[2] + r && z > b[1] - r && z < b[3] + r) return false;
    // the rails, except at their gaps
    const d = ovalD(x, z);
    if (Math.abs(d - OVAL.rin) < 0.1 + r && !inGap("in", x, z)) return false;
    if (Math.abs(d - OVAL.rout) < 0.1 + r && !inGap("out", x, z)) return false;
    return true;
  }
  /** A trainer's stopwatch or clipboard, in their right hand (metres; the arm is in voxels). */
  function trainerProp(kind) {
    const g = new THREE.Group(), lam = c => new THREE.MeshLambertMaterial({ color: c });
    const part = (w, h, d, c, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lam(c)); m.position.set(x, y, z); g.add(m); };
    if (kind === "stopwatch") { part(0.07, 0.07, 0.025, 0xc0c4cc); part(0.05, 0.05, 0.01, 0xf6f6f2, 0, 0, 0.014); part(0.015, 0.02, 0.015, 0xc0c4cc, 0, 0.045, 0); }
    else { part(0.22, 0.3, 0.015, 0xb08a5a); part(0.18, 0.24, 0.005, 0xf6f2e8, 0, -0.01, 0.01); part(0.08, 0.025, 0.02, 0xc0c4cc, 0, 0.14, 0.01); }
    return g;
  }

  // ================================================================ the library
  /* Through the doors at the back of the hall, left of the office: the academy's library.
     It is behind the hall's back wall, as the office is, so it faces the other way -- the
     camera looks back at the wall it shares with the hall, and the doors in it. Tall cases
     along that wall and the one beside it, rolling ladders to reach their tops; two stacks
     standing between them; long reading tables with green lamps; the librarian at her desk
     by the doors; on the other side of them the card catalogue, which is the deck archive --
     every deck filed in its drawers, the best pinned up over it; tall windows onto the
     grounds, with seats in two of them; a reading corner of leather chairs on a rug; a
     globe, a returns cart, the library's own notice board. Its far side, the windows' wall,
     is the end of the building, over the cafeteria's corner. */
  const LIBR = { x0: -8.5, x1: 8.5, z0: -6, z1: 7, h: 6.5 };                    // (tall enough to fill a phone's screen, upright)
  const LW = { x0: -8.2, x1: 8.2, z0: -5.7, z1: 6.75 };
  const LIB_WINDOWS = [[-1.75, 0.25], [1.75, 3.75], [5.0, 6.5]];      // in the right wall, z from..to
  const LIB_TABLES = [[5.25, -1.0], [5.25, 2.75]];
  const LIB_STACKS = [-6.25, -4.0], STACK_Z = [-2.75, 2.0];            // each stack's spine (x), and how far along z they run
  const LIB_DESK = { x0: -3.5, x1: 0.25, z0: -4.5, z1: -3.875, h: 1.0 };
  const LIB_CHAIRS = [[-6.25, 4.75, PI / 2], [-3.25, 4.75, -PI / 2]];   // the reading corner's: x, z, which way each faces
  const GLOBE = { x: -1.25, z: 4.75, y: 1.0625 };
  const LIB_DOORS = {
    // the far side of the hall's library doors (beyond them, the hall's red carpet)
    hall: { x: 2.5, z: LIBR.z0, yaw: 0, w: 3, h: 3.25, leaves: 2, leaf: leafPanelGlass(C.woodL), frame: frameArch(C.woodD, C.woodD),
            beyond: { top: 0xf6eee0, bottom: 0xe2d6bf, floor: C.carpet } },
  };
  /** Boxes laid out along x, or along z (`alongZ`): (along, up, across), corners either way round. */
  const alongPut = (c, alongZ) => (u0, y0, w0, u1, y1, w1, col) => {
    const p0 = Math.min(w0, w1), p1 = Math.max(w0, w1), q0 = Math.min(u0, u1), q1 = Math.max(u0, u1);
    if (alongZ) c.box(p0, y0, q0, p1, y1, q1, col); else c.box(q0, y0, p0, q1, y1, p1, col);
  };
  /** A bookcase at the fine grain: a back, uprights about `bay` apart, a board every `step`
      with books along it, a plinth, a cornice a little proud. It runs from `a0` to `a1` along x
      (along z: `alongZ`), its back at `b`, facing `dir` (+1 or -1) across that; `rail`: the
      brass rail a rolling ladder hangs from. The books stand back against the back, so their
      own backs are never drawn, and come in runs of a height, as sets of volumes do. */
  function bookcase(c, o) {
    const { a0, a1, b, dir, h } = o, deep = o.deep || 0.3125, step = o.step || 0.5, f = b + dir * deep, put = alongPut(c, o.alongZ);
    put(a0, 0, b, a1, h, b + dir * F, C.woodD);                                   // the back
    put(a0, 0, b, a1, 0.125, f, C.woodD);                                         // the plinth
    put(a0 - F, h - 0.125, b, a1 + F, h, f + dir * F, C.woodD);                   // the cornice
    const n = Math.max(1, Math.round((a1 - a0) / (o.bay || 1))), w = (a1 - a0) / n;
    for (let i = 0; i <= n; i++) { const u = Math.min(a1 - F, a0 + i * w); put(u, 0.125, b, u + F, h - 0.125, f, C.wood); }
    const rows = [];
    for (let y = 0.125; y < h - 0.4375; y += step) rows.push(y);
    rows.forEach((y, k) => {
      const top = k + 1 < rows.length ? rows[k + 1] - F : h - 0.125;          // the next board up, or the cornice
      if (k) put(a0, y - F, b, a1, y, f, C.wood);                             // the board this row stands on
      for (let i = 0; i < n; i++) {
        const end = a0 + (i + 1) * w;
        let bh = 0, run = 0;
        for (let u = a0 + i * w + F; u < end - F;) {
          const bw = c.rnd() < 0.35 ? 2 * F : c.rnd() < 0.2 ? 3 * F : F;
          if (u + bw > end) break;
          if (run-- <= 0) { bh = Math.min(top - y - F, 0.25 + Math.floor(c.rnd() * 4) * F); run = 2 + Math.floor(c.rnd() * 5); }
          const col = BOOKS[Math.floor(c.rnd() * BOOKS.length)];
          // (now and then a gap, where one is out)
          if (c.rnd() > 0.05) put(u, y, b + dir * F, u + bw, y + bh, f - dir * F,
            (X, Y) => bw > F && Y >= y + bh - 0.125 && Y < y + bh - F ? mixC(col, 0xf6efd8, 0.6) : col);
          u += bw;
        }
      }
    });
    if (o.rail) put(a0, h - 0.5, f, a1, h - 0.4375, f + dir * F, C.brass);
  }
  /** A library ladder leaning on a case's front (`f`, the case facing `dir`), at `u` along it:
      two rails, a rung every so often, castors at its feet, its hooks over the rail at the top. */
  function ladder(c, o) {
    const put = alongPut(c, o.alongZ), top = o.h - 0.4375, foot = 0.875;
    for (let y = 0; y < top; y += F) {
      const w = o.f + o.dir * (F + foot * (1 - y / top));
      for (const du of [0, 0.4375]) put(o.u + du, y, w, o.u + du + F, y + F, w + o.dir * 2 * F, 0xdcae6e);   // pale, against the books
      if (y > 0.2 && y % 0.3125 < F / 2) put(o.u + F, y, w, o.u + 0.4375, y + F, w + o.dir * F, 0xc8965a);
    }
    for (const du of [0, 0.4375]) put(o.u + du, 0, o.f + o.dir * (F + foot), o.u + du + F, F, o.f + o.dir * (3 * F + foot), 0x2a2a30);
    put(o.u - F, top, o.f, o.u + 0.5625, top + F, o.f + o.dir * 2 * F, C.brass);
  }
  /** A green banker's lamp standing at (x, y, z): a brass foot and stem, the shade. */
  function bankerLamp(c, x, z, y) {
    c.box(x - 0.125, y, z - 0.0625, x + 0.125, y + F, z + 0.0625, C.brassD);
    c.box(x, y + F, z, x + F, y + 0.3125, z + F, C.brass);
    c.box(x - 0.1875, y + 0.3125, z - 0.0625, x + 0.25, y + 0.375, z + 0.125, C.green);
    c.box(x - 0.125, y + 0.375, z - F, x + 0.1875, y + 0.4375, z + 0.0625, C.greenL);
  }
  /** A reading-room chair: plain legs, a green seat, a back of two rails, its back away from the table (`face` 0 or PI). */
  function libChair(c, x, z, face) {
    const s = 0.1875, top = 0.4375, zb = face === 0 ? z - s : z + s - F;
    for (const dx of [-s, s - F]) for (const dz of [-s, s - F]) c.box(x + dx, 0, z + dz, x + dx + F, top, z + dz + F, C.woodD);
    c.box(x - s, top, z - s, x + s, top + F, z + s, C.green);
    for (const dx of [-s, s - F]) c.box(x + dx, top + F, zb, x + dx + F, top + 0.5, zb + F, C.woodD);
    for (const y of [top + 0.25, top + 0.4375]) c.box(x - s, y, zb, x + s, y + F, zb + F, C.wood);
  }
  /** A long reading table, green leather let into its top, a lamp in the middle, books open at some of its places. */
  function readingTable(c, tx, tz) {
    const x0 = tx - 1.5, x1 = tx + 1.5, z0 = tz - 0.5, z1 = tz + 0.5, top = 0.75;
    for (const lx of [x0 + F, x1 - 3 * F]) for (const lz of [z0 + F, z1 - 3 * F]) c.box(lx, 0, lz, lx + 2 * F, top - 0.125, lz + 2 * F, C.woodD);
    c.box(x0 + F, top - 0.125, z0 + F, x1 - F, top - F, z1 - F, C.wood);
    c.box(x0, top - F, z0, x1, top, z1, (X, Y, Z) => X >= x0 + 0.25 && X < x1 - 0.25 && Z >= z0 + 0.1875 && Z < z1 - 0.1875 ? C.greenL : C.woodL);
    bankerLamp(c, tx, tz, top);
    for (const [ox, oz] of [[-0.75, -0.3125], [0.75, 0.125]]) {                  // open books, the spine down the middle
      const bx = tx + ox - 0.1875, bz = tz + oz;
      c.box(bx, top, bz, bx + 0.375, top + F, bz + 0.1875, X => X >= bx + 0.1875 - F && X < bx + 0.1875 + F ? 0xb8a888 : 0xf6f0e0);
    }
    for (let i = 0; i < 3; i++) c.box(x1 - 0.4375 + (i % 2) * F, top + i * F, tz - 0.125, x1 - 0.1875 + (i % 2) * F, top + (i + 1) * F, tz + 0.1875, BOOKS[(i * 5 + 2) % BOOKS.length]);
  }
  /** A leather wing chair facing `dir` along x (+1 or -1): short feet, a deep seat, rolled arms, wings by her head. */
  function wingChair(c, x, z, dir) {
    const put = alongPut(c, false), A = a => x + dir * a;
    for (const a of [-0.3125, 0.25]) for (const b of [-0.3125, 0.25]) put(A(a), 0, z + b, A(a + F), 0.125, z + b + F, C.woodD);
    put(A(-0.375), 0.125, z - 0.375, A(0.375), 0.3125, z + 0.375, C.leatherD);
    put(A(-0.25), 0.3125, z - 0.25, A(0.375), 0.5, z + 0.25, C.leather);
    put(A(-0.375), 0.3125, z - 0.375, A(-0.25), 1.1875, z + 0.375, (X, Y, Z) => Y > 0.5 && Y < 1.125 && ((Y + Z) * 8 | 0) % 3 === 0 ? C.leatherD : C.leather);
    for (const s of [-1, 1]) {
      put(A(-0.375), 0.3125, z + s * 0.25, A(0.375), 0.6875, z + s * 0.375, C.leatherD);     // the arms
      put(A(-0.375), 0.6875, z + s * 0.25, A(-0.125), 1.125, z + s * 0.375, C.leather);      // the wings
    }
  }
  /** The checkout desk by the doors: a panelled counter, the screen turned to the librarian
      (its back to the room), her keyboard, a pile of returns, the bell, a green lamp. */
  function libraryDesk(c) {
    const D = LIB_DESK, top = D.h, sx = -0.6;
    c.box(D.x0, 0, D.z0, D.x1, top - F, D.z1, (X, Y, Z) => Z >= D.z1 - F && Y > 0.1875 && Y < top - 0.1875
      && (X - D.x0) % 0.75 > 0.125 && (X - D.x0) % 0.75 < 0.625 ? C.wood : C.woodD);
    c.box(D.x0 - F, top - F, D.z0 - F, D.x1 + F, top, D.z1 + 0.0625, C.woodL);
    c.box(sx - 0.25, top + F, D.z0 + 0.0625, sx + 0.25, top + 0.4375, D.z0 + 0.1875, (X, Y, Z) =>
      Z < D.z0 + 0.125 && X >= sx - 0.1875 && X < sx + 0.1875 && Y >= top + 0.125 && Y < top + 0.375 ? 0x8ab8d8 : 0x2a2a30);
    c.box(sx - F, top, D.z0 + 0.125, sx + F, top + F, D.z0 + 0.3125, 0x2a2a30);
    c.box(-1.875, top, D.z0 + 0.0625, -1.3125, top + F, D.z0 + 0.25, 0xd8dce4);
    for (let i = 0; i < 4; i++) c.box(-3.25 + (i % 2) * F, top + i * F, D.z0 + 0.125, -2.8125 + (i % 2) * F, top + (i + 1) * F, D.z0 + 0.4375, BOOKS[(i * 3 + 1) % BOOKS.length]);
    c.box(-0.1875, top, D.z1 - 0.25, -0.0625, top + F, D.z1 - 0.125, C.brassD);
    c.box(-0.1875 + F, top + F, D.z1 - 0.25 + F, -0.0625, top + 0.125, D.z1 - 0.125, C.brass);    // the bell
    bankerLamp(c, -2.25, D.z0 + 0.25, top);
  }
  /** The deck archive: a card catalogue against the back wall, eight drawers across and four
      high, each with its pull and a card in its holder, one of them out; a deck fanned on top
      by a lamp; and over it, in a frame, the best decks pinned up. */
  function catalogue(c) {
    const x0 = 4.75, x1 = 7.75, zb = LIBR.z0, zf = zb + 0.625, top = 1.25, cw = 0.375, rh = 0.25;
    c.box(x0, 0, zb, x1, 0.25, zf, C.woodD);
    c.box(x0, 0.25, zb, x1, top, zf - F, C.wood);
    c.box(x0, 0.25, zf - F, x1, top, zf, (X, Y) => {
      const u = Math.round(((X - x0) % cw) / F), v = Math.round(((Y - 0.25) % rh) / F);
      if (u === 0 || v === 0) return C.woodD;
      return v === 2 && (u === 2 || u === 3) ? 0xf6f0e0 : C.woodL;
    });
    for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) c.box(x0 + i * cw + 2 * F, 0.25 + j * rh + F, zf, x0 + i * cw + 4 * F, 0.25 + j * rh + 2 * F, zf + F, C.brass);
    // the drawer that is out: its cards standing in it
    const ox = x0 + 3 * cw, oy = 0.25 + 2 * rh;
    c.box(ox + F, oy + F, zf - F, ox + cw, oy + rh, zf, 0x2a1a10);
    c.box(ox + F, oy + F, zf, ox + cw, oy + rh, zf + 0.3125, C.woodL);
    c.clear(ox + 2 * F, oy + 2 * F, zf, ox + cw - F, oy + rh, zf + 0.25);
    c.box(ox + 2 * F, oy + 2 * F, zf + F, ox + cw - F, oy + rh - F, zf + 0.25, (X, Y, Z) => Math.round(Z / F) % 2 ? 0xf6f0e0 : 0xd8ccb0);
    c.box(x0 - F, top, zb, x1 + F, top + F, zf + F, C.woodD);
    bankerLamp(c, x1 - 0.375, zb + 0.25, top + F);
    for (let k = 0; k < 5; k++) c.box(5.0 + k * 0.1875, top + F, zb + 0.25 + (k % 2) * F, 5.3125 + k * 0.1875, top + 2 * F, zb + 0.5 + (k % 2) * F,
      X => X >= 5.25 + k * 0.1875 ? 0xf6f0e0 : BOOKS[k]);
    // the frame over it: green baize, ten cards pinned in two rows
    c.box(4.9375, 1.75, zb, 7.5625, 2.8125, zb + 0.125, C.woodD);
    c.clear(5.0, 1.8125, zb + F, 7.5, 2.75, zb + 0.125);
    c.box(5.0, 1.8125, zb, 7.5, 2.75, zb + F, C.greenD);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) {
      const x = 5.125 + i * 0.5, y = 1.875 + j * 0.4375;
      c.box(x, y, zb + F, x + 0.375, y + 0.375, zb + 2 * F, (X, Y) =>
        X < x + F || X >= x + 0.375 - F || Y < y + F || Y >= y + 0.375 - F ? 0xf6f0e0 : BOOKS[(i + j * 3) % BOOKS.length]);
    }
  }
  /** The library's notice board, on the solid stretch of the window wall. */
  function libNotices(c) {
    const xw = LIBR.x1, z0 = -5.375, z1 = -3.375, y0 = 1.375, y1 = 2.625;
    c.box(xw - 0.1875, y0, z0, xw, y1, z1, C.woodD);
    c.clear(xw - 0.1875, y0 + 0.125, z0 + 0.125, xw - 0.125, y1 - 0.125, z1 - 0.125);
    c.box(xw - 0.125, y0 + 0.125, z0 + 0.125, xw - F, y1 - 0.125, z1 - 0.125, () => c.rnd() < 0.12 ? C.corkD : c.jit(C.cork, 0.06));
    for (const [z, y, w, h, col, pin] of [[-5.125, 1.625, 0.5, 0.625, 0xf6f2e8, 0xd8302a], [-4.5, 1.875, 0.4375, 0.5, 0xc8e0f0, 0xf0c040],
      [-3.9375, 1.5625, 0.375, 0.5625, 0xf0c8d8, 0x3a8ad0], [-4.5, 1.5, 0.375, 0.3125, 0xf6e0a0, 0x5ab84a]]) {
      c.box(xw - 0.1875, y, z, xw - 0.125, y + h, z + w, col);
      c.box(xw - 0.25, y + h - 0.125, z + 0.1875, xw - 0.1875, y + h - F, z + 0.25, pin);
    }
  }
  /** The returns cart: two shelves of books between wooden ends, castors, a handle. */
  function returnsCart(c, x0, z0) {
    const x1 = x0 + 1.0, z1 = z0 + 0.5;
    for (const [wx, wz] of [[x0 + F, z0], [x1 - 2 * F, z0], [x0 + F, z1 - F], [x1 - 2 * F, z1 - F]]) c.box(wx, 0, wz, wx + F, 0.125, wz + F, 0x2a2a30);
    for (const x of [x0, x1 - F]) c.box(x, 0.125, z0, x + F, 0.875, z1, C.wood);
    for (const y of [0.1875, 0.5625]) c.box(x0, y, z0, x1, y + F, z1, C.woodL);
    books(c, x0 + F, x1 - F, 0.25, z0 + F, z1 - F, 0.3125);
    books(c, x0 + F, x1 - F, 0.625, z0 + F, z1 - F, 0.25);
    for (const z of [z0 + 0.0625, z1 - 0.125]) c.box(x1, 0.625, z, x1 + 0.125, 0.6875, z + F, C.chromeD);
    c.box(x1 + 0.0625, 0.625, z0 + 0.0625, x1 + 0.125, 0.875, z1 - 0.0625, C.chromeD);
  }
  /** The ball of the globe, on its own so that it can be spun: seas, land, the ice at the poles. */
  function globeBall() {
    const gc = canvas(F, 404);
    gc.box(-0.3125, -0.3125, -0.3125, 0.3125, 0.3125, 0.3125, (X, Y, Z) => {
      const px = X + gc.h, py = Y + gc.h, pz = Z + gc.h, r = Math.hypot(px, py, pz);
      if (r > 0.29) return undefined;
      const lon = Math.atan2(pz, px), lat = Math.asin(clamp(py / r, -1, 1));
      if (Math.abs(lat) > 1.2) return 0xf2f2ea;
      const land = Math.sin(lon * 2 + 0.6) * Math.cos(lat * 2.4) + 0.55 * Math.sin(lon * 5 - lat * 3) > 0.5;
      return land ? (gc.rnd() < 0.3 ? 0xc8b070 : 0x6a9a4a) : gc.jit(0x3a6ab0, 0.06);
    });
    return gc.mesh();
  }
  const libWall = (X, Y) => Y < 0.25 ? C.skirt : Y < 1.25 ? C.wainscot : Y < 1.375 ? C.wainTop
    : Y >= 4.5 && Y < 4.75 ? C.wainTop : Y >= LIBR.h - 0.25 ? C.crown : 0xf2e8d2;              // (a picture rail over the tall cases)
  /** A painting for over the shelves: the academy's racecourse, or the hills behind it. */
  function painting(kind, w, h) {
    const cv = document.createElement("canvas");
    cv.width = 256; cv.height = Math.round(256 * h / w);
    const g = cv.getContext("2d"), W = cv.width, H = cv.height, sky = g.createLinearGradient(0, 0, 0, H * 0.6);
    sky.addColorStop(0, "#8cbce0"); sky.addColorStop(1, "#f4e8cc");
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    if (kind === "hills") {
      for (const [y, col, k] of [[0.5, "#7a9ab0", 3], [0.62, "#5a8a5a", 5], [0.78, "#4a7a3a", 7]]) {
        g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
        for (let x = 0; x <= W; x += 8) g.lineTo(x, H * y + Math.sin(x / W * k + y * 9) * H * 0.06);
        g.lineTo(W, H); g.fill();
      }
    } else {
      g.fillStyle = "#e8e0d0"; g.fillRect(W * 0.08, H * 0.34, W * 0.3, H * 0.2);           // the grandstand
      g.fillStyle = "#b84a3a"; g.fillRect(W * 0.06, H * 0.3, W * 0.34, H * 0.06);
      g.fillStyle = "#5aa04a"; g.fillRect(0, H * 0.54, W, H * 0.46);                          // the turf, the rail
      g.fillStyle = "#f8f8f2"; g.fillRect(0, H * 0.66, W, H * 0.025);
      ["#d8302a", "#2a5ab0", "#f0c040", "#7a3a8a"].forEach((col, i) => {                      // and the field, racing by
        const x = W * (0.42 + i * 0.12), y = H * (0.74 + (i % 2) * 0.07);
        g.fillStyle = "#3a2a1e"; g.fillRect(x, y, W * 0.07, H * 0.06);
        g.fillStyle = col; g.fillRect(x + W * 0.02, y - H * 0.06, W * 0.03, H * 0.06);
      });
    }
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(cv) }));
  }
  const LIB_PAINTINGS = [["track", -7.0, 5.25], ["hills", -2.0, 5.25], ["track", 6.25, 5.25]];   // over the back wall's cases and the archive
  function libraryShell() {
    const c = canvas(S, 4747), { box, clear, jit } = c, L = LIBR;
    // parquet: a metre square of four boards, the next square turned the other way; a dark band round the walls
    box(L.x0, -0.25, L.z0, L.x1, 0, L.z1, (X, Y, Z) => {
      const x = X - L.x0, z = Z - L.z0;
      if (x < 0.5 || x >= L.x1 - L.x0 - 0.5 || z < 0.5) return jit(C.seam, 0.04);
      const k = Math.floor(((Math.floor(x) + Math.floor(z)) % 2 ? x : z) % 1 / 0.25);
      return jit([C.plankA, C.plankB, C.plankC, C.plankB][k], 0.035);
    });
    // a green runner from the doors, gold at its edges
    box(1.5, -0.25, L.z0, 3.5, 0, L.z1, X => X < 1.75 || X >= 3.25 ? C.fringe : jit(C.green, 0.04));
    box(L.x0, 0, L.z0 - 0.25, L.x1, L.h, L.z0, libWall);
    box(L.x0 - 0.25, 0, L.z0 - 0.25, L.x0, L.h, L.z1, libWall);
    box(L.x1, 0, L.z0 - 0.25, L.x1 + 0.25, L.h, L.z1, libWall);
    for (const id in LIB_DOORS) { const d = LIB_DOORS[id]; clear(d.x - d.w / 2, 0, L.z0 - 0.25, d.x + d.w / 2, d.h, L.z0); }
    for (const [a, b] of LIB_WINDOWS) clear(L.x1, 1.0, a, L.x1 + 0.25, 4.0, b);
    return c.mesh((X, Y, Z, nx, ny, nz) => !(ny < 0 && Y < 0) && !(nz < 0 && Z < L.z0 - 0.2)
      && !(nx < 0 && X < L.x0 - 0.2) && !(nx > 0 && X >= L.x1));
  }
  function libraryProps() {
    const c = canvas(F, 4848), { box } = c, L = LIBR;
    // the tall cases on the back wall and the left one, each with its ladder; the two stacks
    bookcase(c, { a0: L.x0, a1: -0.75, b: L.z0, dir: 1, h: 4, rail: true });
    bookcase(c, { alongZ: true, a0: L.z0 + 0.375, a1: 6.75, b: L.x0, dir: 1, h: 4, rail: true });
    ladder(c, { u: -7.75, f: L.z0 + 0.3125, dir: 1, h: 4 });
    ladder(c, { alongZ: true, u: 2.5, f: L.x0 + 0.3125, dir: 1, h: 4 });
    for (const xs of LIB_STACKS) {
      for (const dir of [-1, 1]) bookcase(c, { alongZ: true, a0: STACK_Z[0], a1: STACK_Z[1], b: xs, dir, h: 2.25, bay: 0.95 });
      for (const z of [STACK_Z[0] - F, STACK_Z[1]]) box(xs - 0.375, 0, z, xs + 0.375, 2.25, z + F, C.woodD);
      // on top: a few books lying flat, a brass bookend pair holding up some more
      const t = 2.25;
      for (let i = 0; i < 3; i++) box(xs - 0.1875 + (i % 2) * F, t + i * F, -1.5, xs + 0.1875 + (i % 2) * F, t + (i + 1) * F, -1.125, BOOKS[(i * 3 + (xs > -5 ? 2 : 5)) % BOOKS.length]);
      for (const z of [0.25, 0.875]) box(xs - 0.125, t, z, xs + 0.125, t + 0.25, z + F, C.brass);
      for (let z = 0.25 + F, k = 0; z < 0.875; z += F, k++) box(xs - 0.125, t, z, xs + 0.125, t + 0.1875 + (k % 3) * F, z + F, BOOKS[(k * 5 + 1) % BOOKS.length]);
    }
    libraryDesk(c);
    catalogue(c);
    libNotices(c);
    for (const [tx, tz] of LIB_TABLES) readingTable(c, tx, tz);
    for (const p of LIB_SEATS) if (p.act === "study") libChair(c, p.x, p.z, p.face);
    // the reading corner: a rug, the two wing chairs, a low round table between them, a cup and a book on it
    box(-7.0, 0, 3.5, -2.5, F, 6.0, (X, Y, Z) => {
      const u = X + c.h + 7.0, v = Z + c.h - 3.5, e = Math.min(u, 4.5 - u, v, 2.5 - v), m = Math.abs(u - 2.25) / 1.6 + Math.abs(v - 1.25) / 0.8;
      return e < 0.125 ? C.fringe : e < 0.25 ? C.rugA : m < 0.8 ? C.rugA : m < 1 ? C.fringe : C.rugB;
    });
    for (const [x, z, face] of LIB_CHAIRS) wingChair(c, x, z, face > 0 ? 1 : -1);
    cyl(c, -4.75, 3.875, 0.1875, F, 2 * F, C.woodD);
    cyl(c, -4.75, 3.875, 0.0625, 2 * F, 0.3125, C.wood);
    cyl(c, -4.75, 3.875, 0.375, 0.3125, 0.375, C.woodD);
    cyl(c, -4.5625, 3.75, 0.0625, 0.375, 0.4375, 0xf6f2ea);
    box(-5.0, 0.375, 3.875, -4.6875, 0.4375, 4.125, C.green);
    // the globe's stand and its brass meridian (the ball: buildLibrary)
    box(GLOBE.x - 0.3125, 0, GLOBE.z - F, GLOBE.x + 0.3125, F, GLOBE.z + F, C.woodD);
    box(GLOBE.x - F, 0, GLOBE.z - 0.3125, GLOBE.x + F, F, GLOBE.z + 0.3125, C.woodD);
    cyl(c, GLOBE.x, GLOBE.z, 0.0625, F, 0.625, C.wood);
    cyl(c, GLOBE.x, GLOBE.z, 0.125, 0.625, 0.6875, C.woodD);
    box(GLOBE.x - 0.375, 0.6875, GLOBE.z, GLOBE.x + 0.375, GLOBE.y + 0.375, GLOBE.z + F, (X, Y) =>
      Math.abs(Math.hypot(X + c.h - GLOBE.x, Y + c.h - GLOBE.y) - 0.34) < 0.035 ? C.brass : undefined);
    returnsCart(c, -2.5, 0.5);
    // the windows: white frames, a bar down and a transom across, the sills, green curtains drawn back
    for (const [a, b] of LIB_WINDOWS) {
      const x = L.x1, m = (a + b) / 2;
      box(x - F, 0.8125, a - 0.1875, x, 4.1875, b + 0.1875, C.frame);
      c.clear(x - F, 1.0, a, x, 4.0, b);
      box(x + 0.0625, 1.0, m, x + 0.125, 4.0, m + F, C.frame);
      box(x + 0.0625, 3.25, a, x + 0.125, 3.3125, b, C.frame);
      box(x - 0.25, 0.9375, a - 0.1875, x, 1.0, b + 0.1875, C.frame);
      for (const z of [a - 0.4375, b + 0.1875]) box(x - 0.1875, 0.625, z, x - F, 4.3125, z + 0.25, (X, Y, Z) => Math.round(Z / F) % 2 ? C.green : C.greenD);
      box(x - 0.25, 4.1875, a - 0.4375, x - F, 4.5, b + 0.4375, C.greenD);
    }
    // seats in the first window and the last, a radiator under the middle one
    for (const [a, b] of [LIB_WINDOWS[0], LIB_WINDOWS[2]]) {
      box(7.875, 0, a + 0.0625, L.x1, 0.375, b - 0.0625, (X, Y, Z) => X < 7.875 + F && Y > F && Y < 0.3125 && (Z - a) % 0.5 > 0.125 ? C.wood : C.woodD);
      box(7.875 + F, 0.375, a + 0.0625, L.x1, 0.5, b - 0.0625, (X, Y) => X < 7.875 + 2 * F && Y >= 0.4375 ? C.fringe : C.greenL);
    }
    box(8.25, 0.25, 1.9375, L.x1, 0.875, 3.5625, (X, Y, Z) => Math.round(Z / F) % 2 ? 0xeae6dc : 0xd6d2c6);
    // a clock between the shelves and the doors, a lamp under it; a plant in the corner
    box(-0.3125, 2.6875, L.z0, 0.3125, 3.3125, L.z0 + F, (X, Y) => {
      const dx = X + c.h, dy = Y + c.h - 3.0, r = Math.hypot(dx, dy);
      if (r > 0.3125) return undefined;
      if (r > 0.25) return C.woodD;
      return (Math.abs(dx) < 0.035 && dy > 0 && dy < 0.2) || (Math.abs(dy) < 0.035 && dx < 0 && dx > -0.14) ? 0x2a2a30 : 0xf8f2e2;
    });
    sconce(c, 0, L.z0, 1.75);
    plant(c, -7.5, 6.3, 1.0);
    for (const [, x, y] of LIB_PAINTINGS) box(x - 0.875, y - 0.625, L.z0, x + 0.875, y + 0.625, L.z0 + 0.125, C.brassD);   // their frames
    return c.mesh((X, Y, Z, nx, ny, nz) => notUnder(X, Y, Z, nx, ny) && !(nz < 0 && Z < L.z0 + F)
      && !(nx < 0 && X < L.x0 + F) && !(nx > 0 && X >= L.x1 - F));
  }
  /* Where they sit: at the reading tables, two down each side of each, got into from behind
     the chair; in the reading corner's wing chairs; on the window seats. */
  const LIB_SEATS = [];
  for (const [tx, tz] of LIB_TABLES) for (const dx of [-0.75, 0.75]) for (const s of [-1, 1])
    LIB_SEATS.push({ x: tx + dx, z: tz + s * 0.8, face: s < 0 ? 0 : PI, act: "study", seat: true, from: { x: tx + dx, z: tz + s * 1.55 } });
  for (const [x, z, face] of LIB_CHAIRS) LIB_SEATS.push({ x, z, face, act: "read", seat: true });
  for (const [a, b] of [LIB_WINDOWS[0], LIB_WINDOWS[2]]) for (const z of [a + 0.375, b - 0.375])
    LIB_SEATS.push({ x: 8.2, z, face: -PI / 2, act: "read", seat: true, from: { x: 7.35, z } });
  const LIB_N = LIB_SEATS.length;
  const LIBRARY_POIS = [
    ...LIB_SEATS,
    { x: -7.45, z: -1.0, face: -PI / 2, act: "browse", icon: "book" },          // the case along the wall
    { x: -7.2, z: 1.0, face: PI / 2, act: "browse" },                           // the first stack, both sides
    { x: -5.3, z: -1.75, face: -PI / 2, act: "browse", icon: "book" },
    { x: -4.95, z: 0.75, face: PI / 2, act: "browse" },                         // the second
    { x: -3.05, z: -1.75, face: -PI / 2, act: "browse" },
    { x: -6.0, z: -4.85, face: PI, act: "browse", icon: "book" },               // the case on the back wall
    { x: 5.4, z: -4.6, face: PI, act: "browse", icon: "cards" },                // the deck archive's drawers
    { x: 7.7, z: -4.4, face: PI / 2, act: "read", icon: "clipboard" },          // the notice board
    { x: 7.75, z: 2.75, face: PI / 2, act: "look" },                            // out of the middle window
    { x: GLOBE.x + 0.8, z: GLOBE.z, face: -PI / 2, act: "look" },               // the globe (from beside it: in front, it hides her)
    { x: -2.0, z: 0.0, face: 0, act: "browse" },                                // the returns cart
  ];
  const LIBRARY_HUDDLES = [[1.0, 5.25]];
  const LIBRARY_LINES = ["Oh -- Trainer. I was just reading up on the next course.", "Shh... the librarian's watching.",
                         "I'm studying for the written exam.", "Have you read this one? It's all about pacing.",
                         "I always end up falling asleep in here.", "The race records go back years and years."];
  const LIBRARY_PEER_LINES = ["Shh!", "Studying too?", "Have you read this one?", "I can't find the book I wanted.",
                              "The written exam's next week...", "These chairs are so comfy."];
  const LIBRARY_THINGS = [
    ...LIB_SEATS.map((p, i) => p.act === "study" ? { kind: "sit", label: "Study", pose: "study", poi: [i] }
      : { kind: "sit", label: p.x > 0 ? "Sit by the window" : "Sit and read", pose: "read", poi: [i] }),
    { kind: "read", label: "Pull a book", poi: [LIB_N], x: -7.45, z: -1.0, face: -PI / 2, ax: -8.0, ay: 2.5, az: -1.0,
      say: ["'Patience Wins Races.' I'll borrow this one.", "'A Short History of the Derby'... six hundred pages?",
            "'Carrots, and Other Training Foods.' Hm.", "This one's been checked out forty times."] },
    { kind: "read", label: "Browse the shelves", poi: [LIB_N + 4], x: -3.05, z: -1.75, face: -PI / 2, ax: -3.7, ay: 2.6, az: -1.75,
      say: ["Race records, all the way back to the first Derby.", "Somebody's put Training Theory back in the wrong place.",
            "So many books on stamina..."] },
    { kind: "read", label: "Read the notices", poi: [LIB_N + 7], x: 7.7, z: -4.4, face: PI / 2, ax: 8.4, ay: 3.45, az: -4.375,
      say: ["Quiet hours after six.", "The written exam is next week. Study hard!", "Lost: one pink ribbon. Ask at the desk."] },
    { kind: "look", label: "Look out", poi: [LIB_N + 8], x: 7.75, z: 2.75, face: PI / 2, ax: 8.4, ay: 2.6, az: 2.75,
      say: ["It's so peaceful out there.", "Somebody's running laps already.", "The sun's lovely through this window."] },
    { kind: "look", label: "Spin the globe", spin: true, poi: [LIB_N + 9], x: GLOBE.x + 0.8, z: GLOBE.z, face: -PI / 2, ax: GLOBE.x, ay: 1.75, az: GLOBE.z,
      say: ["Longchamp is... about here.", "The world's a big place to race in.", "Round and round it goes."] },
    { kind: "read", label: "Check the returns", poi: [LIB_N + 10], x: -2.0, z: 0.0, face: 0, ax: -2.0, ay: 1.5, az: 0.75,
      say: ["'Mastering the Final Corner.' Due back yesterday.", "Someone left a bookmark in this one.", "A whole stack on the Japan Cup."] },
  ];
  const LIBRARY_PLACES = {
    hall: { label: "Main hall", sub: "Back out", icon: "door", x: 2.5, z: -4.4, face: PI, ax: 2.5, ay: 4.5, az: -5.9,
            door: "hall", room: "hall", arrive: "library" },
    // the deck archive, which is Decks
    deck: { station: "deck", sub: "Deck archive", x: 6.6, z: -4.55, face: PI, ax: 6.25, ay: 3.8, az: -5.8 },
  };
  const LIB_BLOCKS = [
    [LIBR.x0, -6, -0.7, -5.55], [LIBR.x0, -6, -8.1, 7],                                 // the cases along the walls
    ...LIB_STACKS.map(x => [x - 0.4, STACK_Z[0] - 0.1, x + 0.4, STACK_Z[1] + 0.1]),
    [-7.85, -5.7, -7.15, -4.7], [-8.2, 2.4, -7.2, 3.1],                                 // the ladders' feet
    [LIB_DESK.x0 - 0.1, -6, LIB_DESK.x1 + 0.1, LIB_DESK.z1 + 0.1],                      // the desk, and the librarian behind it
    [4.65, -6, 7.85, -5.25],                                                             // the card catalogue
    ...LIB_TABLES.map(([tx, tz]) => [tx - 1.65, tz - 1.1, tx + 1.65, tz + 1.1]),         // the tables and their chairs
    ...LIB_CHAIRS.map(([x, z]) => [x - 0.45, z - 0.45, x + 0.45, z + 0.45]),
    [-5.15, 3.45, -4.35, 4.25],                                                          // the low table
    [GLOBE.x - 0.4, GLOBE.z - 0.4, GLOBE.x + 0.4, GLOBE.z + 0.4],
    [-2.6, 0.4, -1.4, 1.1],                                                              // the returns cart
    ...[LIB_WINDOWS[0], LIB_WINDOWS[2]].map(([a, b]) => [7.85, a + 0.05, 8.5, b - 0.05]),  // the window seats
    [8.2, 1.9, 8.5, 3.6],                                                                // the radiator
    [-7.85, 6.0, -7.15, 6.6],                                                            // the plant
  ];
  function libraryWalkable(x, z, r) {
    if (x < LW.x0 + r || x > LW.x1 - r || z < LW.z0 + r || z > LW.z1 - r) return false;
    for (const b of LIB_BLOCKS) if (x > b[0] - r && x < b[2] + r && z > b[1] - r && z < b[3] + r) return false;
    return true;
  }
  function buildLibrary(R) {
    const g = new THREE.Group(), L = LIBR;
    const shell = new THREE.Mesh(libraryShell(), MAT); shell.receiveShadow = true; g.add(shell);
    const props = new THREE.Mesh(libraryProps(), MAT); props.receiveShadow = true; g.add(props);
    for (const [a, b] of LIB_WINDOWS) g.add(pane(b - a, 3, L.x1 + 0.09, 2.5, (a + b) / 2, -PI / 2));
    g.add(outdoors({ x: L.x1 + 0.25, dir: 1, z0: -2.5, z1: 6.75, seed: 73 }));
    // the lamps: the green ones on the tables and the desk, the catalogue's, the one by the doors
    for (const [tx, tz] of LIB_TABLES) glow(g, tx, 1.15, tz, 1.4);
    glow(g, -2.25, 1.4, LIB_DESK.z0 + 0.25, 1.0);
    glow(g, 7.375, 1.65, L.z0 + 0.25, 0.9);
    glow(g, 0, 1.95, L.z0 + 0.2, 1.2);
    // the globe's ball, on its own so that it can be spun (updateAct)
    R.globe = new THREE.Mesh(globeBall(), MAT);
    R.globe.position.set(GLOBE.x, GLOBE.y, GLOBE.z); g.add(R.globe);
    R.doors = {};
    for (const id in LIB_DOORS) { const d = makeDoor(LIB_DOORS[id]); R.doors[id] = d; g.add(d.g); }
    hangSign(g, "MAIN HALL", 2.5, 3.95, L.z0 + 0.14, 0, 0.6);
    hangSign(g, "DECK ARCHIVE", 6.25, 3.25, L.z0 + 0.03, 0, 0.65, "#7a4e30", "#fff6dc");
    hangSign(g, "QUIET, PLEASE", -4.5, 5.25, L.z0 + 0.03, 0, 0.8, "#2f6a4e", "#f6efdc");
    for (const [kind, x, y] of LIB_PAINTINGS) { const p = painting(kind, 1.5, 1.0); p.position.set(x, y, L.z0 + 0.13); g.add(p); }
    hangSign(g, "LIBRARY NEWS", L.x1 - 0.03, 2.95, -4.375, -PI / 2, 0.5, "#7a4e30", "#fff6dc");
    // what each stack holds, on the end of it that faces the room
    [["A - K", "Race history"], ["L - Z", "Training"]].forEach((lines, i) => {
      const p = plate(lines, 0.625, 0.3125, "#f6f0e2", "#3a2a1e");
      p.position.set(LIB_STACKS[i], 1.85, STACK_Z[1] + F + 0.004); g.add(p);
    });
    return g;
  }
  /* The librarian, at her desk by the doors: a cardigan, her glasses, her hair in a bun; at
     her screen until somebody comes to the desk. */
  STAFF.library = [{ id: "staff-librarian", name: "The librarian", x: -1.6, z: -5.05, yaw: 0, monitor: 1,
    trainer: { sex: "f", style: "bun", hair: 6, skin: 0, eyes: 4, attire: "sweater", colour: 5, bottoms: "long", glasses: true },
    lines: ["Welcome to the library. Quietly, please.", "Your decks are filed in the archive, by the doors.",
            "Returns go on the cart, dear.", "Shh... some of them are studying for the written exam.", "That one's overdue. Again."] }];

  // ================================================================ the window between them
  /* The office shares a wall with the hall, and a window in it. Both rooms go on living all
     the time, and the window is a real opening onto the other: each frame it is on screen,
     the room she is not in is drawn from where her camera would be if the wall were glass --
     the camera carried through the window, turned about to face the other way, with the same
     lens -- everything on the far side of that room's wall clipped off. The picture lands on
     the pane pixel for pixel (it is read by screen position), so things through the window
     are their true size and shift as she walks past, the way a view through glass does. */
  const HALL_WINDOW = { x0: -7, x1: -2, y0: 1.5, y1: 4.0 };
  // each side of the opening: its centre in the middle of the wall, and the wall's face on
  // the room's side (where the other room is cut off when drawn through it)
  const PORTALS = {
    hall:   { c: new THREE.Vector3((HALL_WINDOW.x0 + HALL_WINDOW.x1) / 2, 2.75, HALL.z0 - 0.125), face: HALL.z0, w: 5, h: 2.5 },
    office: { c: new THREE.Vector3(0, 2.75, OFFICE.z0 - 0.125), face: OFFICE.z0, w: 5, h: 2.5 },
  };
  const VIEW_SCALE = 0.5;                                 // the other room is drawn at half resolution
  const portalVert = "void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
  const portalFrag = "uniform sampler2D map; uniform vec2 res; void main() { gl_FragColor = texture2D(map, gl_FragCoord.xy / res); }";
  const portalRes = new THREE.Vector2(1, 1);
  /** The pane in a room's side of the opening, showing `target` by screen position. */
  function portalPane(P, target) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(P.w, P.h), new THREE.ShaderMaterial({
      uniforms: { map: { value: target.texture }, res: { value: portalRes } }, vertexShader: portalVert, fragmentShader: portalFrag,
    }));
    m.position.set(P.c.x, P.c.y, P.c.z - 0.075);           // behind the glazing bars, inside the wall
    P.box = new THREE.Box3().setFromCenterAndSize(P.c, new THREE.Vector3(P.w, P.h, 0.3));
    return m;
  }
  /** Room R's look at this hour: what lies beyond it, and where the light comes in from --
      the sky's direction turned into the room's own frame (`yaw`: the office faces the
      other way from the hall, a dorm room a quarter turn). */
  const UP = new THREE.Vector3(0, 1, 0), bgC = new THREE.Color(), lightV = new THREE.Vector3();
  function lookOf(R) {
    if (R.outdoor) bgC.copy(sky.low);                          // out of doors: the horizon
    else bgC.setHex(R.bg).multiply(sky.room);
    renderer.setClearColor(bgC);
    scene.fog.color.copy(bgC); scene.fog.near = R.fog[0]; scene.fog.far = R.fog[1];
    lightV.copy(sky.dir).applyAxisAngle(UP, R.yaw || 0).multiplyScalar(45);
    sunLight.position.copy(sunLight.target.position).add(lightV);
  }
  /** Show one room -- its building and its company -- and hide the other. */
  function showRoom(R) {
    for (const k in ROOMS) {
      const on = ROOMS[k] === R;
      if (ROOMS[k].group) ROOMS[k].group.visible = on;
      for (const n of crowds[k]) n.m.root.visible = on && !n.gone;          // (gone in for the night: not there)
    }
  }
  const viewFrustum = new THREE.Frustum(), viewPV = new THREE.Matrix4(), portalM = new THREE.Matrix4(), portalT = new THREE.Matrix4();
  const portalTurn = new THREE.Matrix4().makeRotationY(PI), portalClip = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  /** Draw the room she is not in, as seen through the window from where her camera is. */
  function paintWindow() {
    const A = PORTALS[room.id];
    if (!A) return;                                            // a room with no window onto the other
    const R = room === ROOMS.hall ? ROOMS.office : ROOMS.hall, B = PORTALS[R.id];
    // not on screen: nothing to draw
    viewPV.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    viewFrustum.setFromProjectionMatrix(viewPV);
    if (!viewFrustum.intersectsBox(A.box)) return;
    // her camera, carried from this side of the opening to the other and turned about
    portalM.makeTranslation(B.c.x, B.c.y, B.c.z).multiply(portalTurn).multiply(portalT.makeTranslation(-A.c.x, -A.c.y, -A.c.z));
    portalM.multiply(camera.matrixWorld);
    portalM.decompose(viewCam.position, viewCam.quaternion, viewCam.scale);
    viewCam.fov = camera.fov; viewCam.aspect = camera.aspect; viewCam.near = camera.near; viewCam.far = camera.far;
    viewCam.updateProjectionMatrix();
    portalClip.constant = -B.face;                            // keep only what is in that room
    showRoom(R);
    player.m.root.visible = false; ring.visible = false;
    for (const p of motes) p.m.visible = false;              // sparkles and steam are this room's
    if (R.front) R.front.visible = true;
    lookOf(R);
    renderer.clippingPlanes = [portalClip];
    renderer.setRenderTarget(R.id === "hall" ? hallView : officeView);
    renderer.render(scene, viewCam);
    renderer.setRenderTarget(null);
    renderer.clippingPlanes = [];
    if (R.front) R.front.visible = false;
    showRoom(room);
    player.m.root.visible = true; ring.visible = true;
    for (const p of motes) p.m.visible = true;
    lookOf(room);
  }
  /** The targets follow the size of the screen; the panes read them by screen position. */
  function sizePortals() {
    const buf = renderer.getDrawingBufferSize(new THREE.Vector2());
    portalRes.copy(buf);
    const w = Math.max(2, Math.round(buf.x * VIEW_SCALE)), h = Math.max(2, Math.round(buf.y * VIEW_SCALE));
    hallView.setSize(w, h); officeView.setSize(w, h);
  }

  // ================================================================ the rooms
  /* Each room: how to build it, where she can walk, its places and its spots for the
     others, how the camera hangs over it, and its finding-the-way grid. The camera
     follows her within `x` and `z`, and turns toward a side wall as she nears it (`turn`:
     from what distance, to what distance, by how much), so the doors on it face the camera
     instead of standing edge on. */
  const ROOMS = {
    hall: { id: "hall", build: buildHall, walkable: hallWalkable, places: HALL_PLACES, pois: HALL_POIS,
            huddles: HALL_HUDDLES, lines: HALL_LINES, peerLines: HALL_PEER_LINES, things: HALL_THINGS, bg: 0xf2ead8, fog: [34, 70],
            cam: { x: [-21, 21], z: [-9, 5], h: 6.4, d: 10, ly: 1.2, la: 2.4, fov: 40, turn: [13, 21.5, 0.62], wall: HALL.z1 },
            nav: { x0: -24, z0: -15.5, nx: 192, nz: 94 }, spawn: { x: 0, z: 3, yaw: PI },
            roam: { x: [-22, 22], z: [-6.5, 6.5] } },
    office: { id: "office", yaw: PI, build: buildOffice, walkable: officeWalkable, places: OFFICE_PLACES, pois: OFFICE_POIS,
              huddles: OFFICE_HUDDLES, lines: OFFICE_LINES, things: OFFICE_THINGS, bg: 0xefe4cf, fog: [40, 80], greet: true,
              cam: { x: [-2, 2], z: [-2.5, 2.5], h: 5, d: 8.5, ly: 1.0, la: 2.6, fov: 45, turn: [1.0, 5.0, 0.5] },
              nav: { x0: -7, z0: -5.5, nx: 56, nz: 44 }, spawn: { x: 0, z: 1.5, yaw: PI },
              roam: { x: [-5, 5], z: [-2.2, 3.8] } },
    cafe: { id: "cafe", build: buildCafe, walkable: cafeWalkable, places: CAFE_PLACES, pois: CAFE_POIS,
            huddles: CAFE_HUDDLES, lines: HALL_LINES, peerLines: HALL_PEER_LINES, things: CAFE_THINGS, bg: 0xf2ead8, fog: [40, 90],
            cam: { x: [-5.5, 5.5], z: [-2.5, 3], h: 6.2, d: 9.5, ly: 1.0, la: 2.4, fov: 42, turn: [5, 9.5, 0.55] },
            nav: { x0: -10, z0: -6, nx: 80, nz: 52 }, spawn: { x: 0, z: 0.6, yaw: PI },
            roam: { x: [-8.5, 8.5], z: [-3.5, 5.5] } },
    // one corridor, dressed for whichever floor of which dorm she is on (dressCorridor)
    dorm: { id: "dorm", build: buildDorm, dress: dressCorridor, v: 0, walkable: dormWalkable, places: DORM_FLOOR_PLACES[0], pois: DORM_POIS,
            huddles: DORM_HUDDLES, lines: HALL_LINES, peerLines: HALL_PEER_LINES, things: DORM_THINGS, bg: 0xf2ead8, fog: [40, 90],
            cam: { x: [-13, 13], z: [0.5, 0.9], h: 3.55, d: 5.2, ly: 0.9, la: 1.2, fov: 50, turn: [11, 16.5, 0.5] },
            nav: { x0: -17, z0: -1.5, nx: 136, nz: 18 }, spawn: { x: -14, z: 0.6, yaw: PI / 2 },
            roam: { x: [-15, 15], z: [-0.6, 1.8] } },
    // one room, dressed for whichever door she came in by (dressRoom), its company who lives there
    room: { id: "room", yaw: -PI / 2, build: buildRoom, dress: dressRoom, walkable: roomWalkable, places: ROOMD_PLACES, pois: ROOMD_POIS,
            huddles: ROOMD_HUDDLES, lines: HALL_LINES, peerLines: HALL_PEER_LINES, things: ROOMD_THINGS, bg: 0xf2ead8, fog: [40, 90],
            cam: { x: [-0.6, 0.6], z: [-0.2, 0.6], h: 3.3, d: 6.0, ly: 0.5, la: 1.3, fov: 50, turn: [0.7, 2.6, 0.32] },
            nav: { x0: -3.25, z0: -3, nx: 26, nz: 24 }, spawn: { x: -1.6, z: 1.75, yaw: PI / 2 },
            roam: { x: [-1.4, 1.4], z: [-1.2, 2.4] }, v: 0 },
    // the school wing's corridor, its doors and timetable showing which lessons are done (dressSchool)
    school: { id: "school", music: "school", build: buildSchool, dress: dressSchool, v: 0, walkable: schoolWalkable, places: {}, pois: SCHOOL_POIS,
              huddles: SCHOOL_HUDDLES, lines: HALL_LINES, peerLines: HALL_PEER_LINES, things: SCHOOL_THINGS, bg: 0xf2ead8, fog: [40, 90],
              cam: { x: [-15, 15], z: [0.6, 1.0], h: 3.55, d: 5.2, ly: 0.9, la: 1.2, fov: 50, turn: [13, 18.5, 0.5] },
              nav: { x0: -19, z0: -1.5, nx: 152, nz: 19 }, spawn: { x: -16.5, z: 0.75, yaw: PI / 2 },
              roam: { x: [-17, 17], z: [-0.5, 2.5] } },
    // one classroom, dressed for the lesson whose door she came in by (dressClass); north of the
    // corridor, so its frame is the dorm room's: the board to the west, the windows north
    class: { id: "class", music: "school", yaw: -PI / 2, build: buildClass, dress: dressClass, v: 0, walkable: classWalkable, places: {}, pois: CLASS_POIS,
             huddles: CLASS_HUDDLES, lines: HALL_LINES, peerLines: HALL_PEER_LINES, things: CLASS_THINGS, bg: 0xf2ead8, fog: [40, 90],
             cam: { x: [-0.8, 0.8], z: [-0.5, 1.2], h: 3.5, d: 7.2, ly: 0.5, la: 1.6, fov: 52, turn: [1.2, 3.4, 0.3] },
             nav: { x0: -4.25, z0: -3.75, nx: 34, nz: 32 }, spawn: { x: -2.75, z: 2.25, yaw: PI / 2 },
             roam: { x: [-3.4, 3.4], z: [-2.2, 3.2] } },
    // outside: the training track (`outdoor`: what lies beyond it is the sky; `jog`: the line
    // its racers run laps on)
    track: { id: "track", music: "track", outdoor: true, build: buildTrack, walkable: trackWalkable, places: TRACK_PLACES, pois: TRACK_POIS,
             huddles: TRACK_HUDDLES, lines: HALL_LINES, peerLines: HALL_PEER_LINES, things: TRACK_THINGS, bg: 0xbfe0f6, fog: [60, 190],
             cam: { x: [-12, 16], z: [-9, 4], h: 8, d: 14, ly: 0.5, la: 6, fov: 42, turn: [15, 23, 0.4] },
             nav: { x0: -22, z0: -18, nx: 192, nz: 116 }, spawn: { x: -19.6, z: -5.5, yaw: PI / 2 },
             roam: { x: [-18, 22], z: [-12, 8] }, jog: JOG },
    // the library: behind the hall's back wall like the office, so it faces the other way. The
    // camera never turns toward a side wall here: it looks straight down the aisles between the
    // stacks, which a turn would hide behind them
    library: { id: "library", music: "ambient", yaw: PI, build: buildLibrary, walkable: libraryWalkable, places: LIBRARY_PLACES, pois: LIBRARY_POIS,
               huddles: LIBRARY_HUDDLES, lines: LIBRARY_LINES, peerLines: LIBRARY_PEER_LINES, things: LIBRARY_THINGS, bg: 0xf0e4cc, fog: [40, 90],
               cam: { x: [-5.25, 4.5], z: [-2.5, 4], h: 6.2, d: 9.5, ly: 1.0, la: 2.4, fov: 42 },
               nav: { x0: -8.5, z0: -6, nx: 68, nz: 52 }, spawn: { x: 2.5, z: -4.4, yaw: 0 },
               roam: { x: [-7.5, 7.5], z: [-5, 6] } },
  };
  // who has a room in the dorm, for the shell to send some of them home
  const RESIDENTS = DORM_ROOMS.flatMap(r => r.names);
  const bareName = s => String(s || "").replace(/​/g, "");
  // where she can walk: the room she is in (the others each have their own, n.R)
  const walkable = (x, z, r) => room.walkable(x, z, r);

  // ---------------------------------------------------------------- finding the way
  /* A grid over each room's floor, a quarter-metre to the cell, and A* across it: everyone
     walks a path round the pillars and the furniture rather than into them. A path starts
     with a step out to the nearest open cell (the machines and the shelves are used from
     inside their own margins) and ends with the step back in to the spot itself. */
  const CELL = 0.25, NAV_R = 0.32;
  const cellX = (R, i) => R.nav.x0 + (i + 0.5) * CELL, cellZ = (R, j) => R.nav.z0 + (j + 0.5) * CELL;
  function navGrid(R) {
    const N = R.nav;
    if (N.open) return N.open;
    const n = N.nx * N.nz;
    N.open = new Uint8Array(n);
    for (let j = 0; j < N.nz; j++) for (let i = 0; i < N.nx; i++)
      N.open[j * N.nx + i] = R.walkable(cellX(R, i), cellZ(R, j), NAV_R) ? 1 : 0;
    N.cost = new Float32Array(n); N.from = new Int32Array(n);
    N.seen = new Uint32Array(n); N.shut = new Uint32Array(n); N.gen = 0;
    return N.open;
  }
  /** The open cell nearest (x, z), looking outward ring by ring; -1 if none is close. */
  function nearestOpen(R, x, z) {
    const g = navGrid(R), N = R.nav;
    const i0 = clamp(Math.floor((x - N.x0) / CELL), 0, N.nx - 1), j0 = clamp(Math.floor((z - N.z0) / CELL), 0, N.nz - 1);
    for (let rad = 0; rad < 24; rad++) {
      let best = -1, bd = Infinity;
      for (let j = Math.max(0, j0 - rad); j <= Math.min(N.nz - 1, j0 + rad); j++)
        for (let i = Math.max(0, i0 - rad); i <= Math.min(N.nx - 1, i0 + rad); i++) {
          if (Math.max(Math.abs(i - i0), Math.abs(j - j0)) !== rad || !g[j * N.nx + i]) continue;
          const d = (cellX(R, i) - x) ** 2 + (cellZ(R, j) - z) ** 2;
          if (d < bd) { bd = d; best = j * N.nx + i; }
        }
      if (best >= 0) return best;
    }
    return -1;
  }
  /** Nothing in the way along the straight line from a to b? */
  function clearLine(R, a, b) {
    const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.1);
    for (let k = 1; k < n; k++) if (!R.walkable(a.x + (b.x - a.x) * k / n, a.z + (b.z - a.z) * k / n, NAV_R)) return false;
    return true;
  }
  /** Waypoints in room R from (sx, sz) to (gx, gz), the last of them the goal itself; null if there is no way. */
  function findPath(R, sx, sz, gx, gz) {
    const g = navGrid(R), N = R.nav, W = N.nx;
    const s = nearestOpen(R, sx, sz), e = nearestOpen(R, gx, gz);
    if (s < 0 || e < 0) return null;
    const gen = ++N.gen, ei = e % W, ej = (e / W) | 0;
    const h = c => { const dx = Math.abs(c % W - ei), dz = Math.abs(((c / W) | 0) - ej); return Math.max(dx, dz) + 0.4142 * Math.min(dx, dz); };
    // a binary heap of cells by cost so far + the estimate left
    const hc = [], hf = [];
    const push = (c, f) => {
      let k = hc.length; hc.push(c); hf.push(f);
      while (k > 0) { const p = (k - 1) >> 1; if (hf[p] <= f) break; hc[k] = hc[p]; hf[k] = hf[p]; k = p; }
      hc[k] = c; hf[k] = f;
    };
    const pop = () => {
      const top = hc[0], lc = hc.pop(), lf = hf.pop();
      if (hc.length) {
        let k = 0;
        for (;;) {
          let m = 2 * k + 1;
          if (m >= hc.length) break;
          if (m + 1 < hc.length && hf[m + 1] < hf[m]) m++;
          if (hf[m] >= lf) break;
          hc[k] = hc[m]; hf[k] = hf[m]; k = m;
        }
        hc[k] = lc; hf[k] = lf;
      }
      return top;
    };
    N.seen[s] = gen; N.cost[s] = 0; N.from[s] = -1; push(s, h(s));
    let found = false;
    while (hc.length) {
      const c = pop();
      if (N.shut[c] === gen) continue;
      N.shut[c] = gen;
      if (c === e) { found = true; break; }
      const ci = c % W, cj = (c / W) | 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const i = ci + di, j = cj + dj;
        if (i < 0 || j < 0 || i >= W || j >= N.nz) continue;
        const nc = j * W + i;
        if (!g[nc] || N.shut[nc] === gen) continue;
        // no cutting a corner past a blocked cell
        if (di && dj && (!g[cj * W + i] || !g[j * W + ci])) continue;
        const cost = N.cost[c] + (di && dj ? 1.4142 : 1);
        if (N.seen[nc] === gen && N.cost[nc] <= cost) continue;
        N.seen[nc] = gen; N.cost[nc] = cost; N.from[nc] = c;
        push(nc, cost + h(nc));
      }
    }
    if (!found) return null;
    const cells = [];
    for (let c = e; c >= 0; c = N.from[c]) cells.push({ x: cellX(R, c % W), z: cellZ(R, (c / W) | 0) });
    cells.reverse();
    // pull the string tight: from each corner, straight on to the farthest cell in plain view
    const pts = [{ x: sx, z: sz }, ...cells, { x: gx, z: gz }], out = [];
    let a = 0;
    while (a < pts.length - 1) {
      let b = a + 1;
      while (b + 1 < pts.length - 1 && clearLine(R, pts[a], pts[b + 1])) b++;
      if (b === pts.length - 2 && clearLine(R, pts[a], pts[b + 1])) b++;
      out.push(pts[b]); a = b;
    }
    return out;
  }
  /** Walk `o` along its path at `v` m/s; true once it is at the end. */
  function follow(o, v, dt) {
    const p = o.path;
    let step = v * dt;
    while (p && p.length && step > 0) {
      const t = p[0], dx = t.x - o.x, dz = t.z - o.z, d = Math.hypot(dx, dz);
      if (d <= step) { o.x = t.x; o.z = t.z; step -= d; p.shift(); continue; }
      o.x += dx / d * step; o.z += dz / d * step;
      o.yaw = turn(o.yaw, Math.atan2(dx, dz), dt * 9);
      step = 0;
    }
    return !p || !p.length;
  }

  // ---------------------------------------------------------------- state
  let renderer = null, scene = null, camera = null, viewCam = null, ring = null, MAT = null, fadeEl = null, clockEl = null;
  let hemiLight = null, sunLight = null;
  let hallView = null, officeView = null;                // what each side of the window shows
  let room = null;                                       // the room she is in
  let host = null, tagsEl = null, raf = 0, last = 0, opts = null, safeTop = -1;
  let player = null, tags = [], keys = {}, nearId = null, clickGoal = null;
  const crowds = { hall: [], office: [], cafe: [], dorm: [], room: [], school: [], class: [], track: [], library: [] };   // everyone else, room by room
  let npcs = crowds.hall;                                // the company of the room she is in
  let seq = null;                                        // a walk through a door, under way
  let saved = { room: "hall", x: 0, z: 3, yaw: PI, via: null, v: 0 };   // where she was last time
  // who is where: `home` are the dorm's residents who are in their rooms today, `classes`
  // the ones in class, a classroom each by turns
  const casts = { hall: [], office: [], cafe: [], dorm: [], home: [], school: [], classes: [], track: [], library: [] };
  let camYaw = 0, snapCam = true;
  const camTarget = new THREE.Vector3(), tmp = new THREE.Vector3(), ray = new THREE.Raycaster();
  const PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  /* A phone (a touch screen, or few cores) starts on a smaller budget: fewer pixels and a
     coarser shadow map. Then the governor watches the frames; if they keep running long it
     steps the budget down, one notch each time, and never back up -- a picture that keeps
     sharpening and blurring is worse than one that is a little soft. */
  const LOW_POWER = !!(root.matchMedia && matchMedia("(pointer:coarse)").matches) || (navigator.hardwareConcurrency || 8) <= 4;
  const gov = { level: 0, slow: 0, t: 0 };
  function budget() {
    const dpr = root.devicePixelRatio || 1;
    renderer.setPixelRatio(Math.min(dpr, [LOW_POWER ? 1.25 : 1.5, 1, 1, 0.8][gov.level]));
    if (sunLight) {
      const size = gov.level >= 2 ? 512 : LOW_POWER ? 1024 : 2048;
      if (sunLight.shadow.mapSize.x !== size) {
        sunLight.shadow.mapSize.set(size, size);
        if (sunLight.shadow.map) { sunLight.shadow.map.dispose(); sunLight.shadow.map = null; }
      }
    }
  }
  function govern(dt) {
    if (!dt || document.hidden || gov.level >= 3) return;
    // the share of recent frames slower than 24 a second: not 30, which is where a phone on
    // battery saver holds every page however little it draws
    gov.slow += ((dt > 1 / 24 ? 1 : 0) - gov.slow) * 0.05;
    gov.t += dt;
    if (gov.t < 2.5 || gov.slow < 0.5) return;
    gov.level++; gov.t = 0; gov.slow = 0;
    budget();
    renderer.setSize(host.clientWidth, host.clientHeight, false);
    sizePortals();
  }

  function ensure() {
    if (renderer) return true;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" }); }
    catch (e) { renderer = null; return false; }
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = "lobby-gl";
    MAT = new THREE.MeshLambertMaterial({ vertexColors: true });
    hallView = new THREE.WebGLRenderTarget(2, 2);
    officeView = new THREE.WebGLRenderTarget(2, 2);
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xf2ead8, 34, 70);
    camera = new THREE.PerspectiveCamera(40, 1, 0.3, 200);
    viewCam = new THREE.PerspectiveCamera(40, 1, 0.3, 200);
    // the light all round and the light from outside, both set by the hour (daylight)
    hemiLight = new THREE.HemisphereLight(0xfff8ea, 0xd6c6a6, 0.78);
    scene.add(hemiLight);
    const sun = sunLight = new THREE.DirectionalLight(0xfff0d8, 0.5);
    sun.position.set(6, 24, 14); sun.target.position.set(0, 0, -2);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera; sc.left = -30; sc.right = 30; sc.top = 24; sc.bottom = -24; sc.near = 1; sc.far = 110;
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03;
    scene.add(sun, sun.target);
    budget();
    // the gold circle under the player, the way the race marks her
    ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.55, 32),
      new THREE.MeshBasicMaterial({ color: 0xf2b705, transparent: true, opacity: 0.85 }));
    ring.rotation.x = -PI / 2; ring.position.y = 0.02;
    // the hall and the office, built now (each is seen through the other's window); the rest
    // the first time she goes in. They all stand in the same space, one shown at a time
    for (const k of ["hall", "office"]) built(ROOMS[k]);
    return true;
  }
  function built(R) {
    if (!R.group) { R.group = R.build(R); R.group.visible = false; scene.add(R.group); }
    return R;
  }

  /** The company of room R: its cast, and its staff. A dorm room's is whoever lives in it and
      is at home today. */
  function people(R) {
    for (const n of crowds[R.id]) dropNpc(n);
    R.taken = new Map();
    const names = R.id === "room" ? DORM_ROOMS[R.v].names : null;
    const due = routined(R) ? dueIn(R) : null;
    const defs = due ? due.map(o => o.d)
      : names ? casts.home.filter(d => names.includes(bareName(d.name)))
      : R.id === "dorm" ? casts.dorm.filter(d => floorOf(bareName(d.name)) === R.v)     // in the corridor of her own floor
      : R.id === "class" ? casts.classes.filter((d, i) => i % LESSONS.length === R.v)   // in this lesson's class
      : R.jog && LOW_POWER ? casts[R.id].slice(0, 2)                                   // the big outdoors: fewer out on a phone
      : casts[R.id] || [];
    crowds[R.id] = defs.map((d, i) => {
      const n = makeNpc(d, R);
      if (names) n.home = names.indexOf(bareName(d.name));          // her side of the room
      if (due) { n.want = due[i].w.act; if (n.want === "sleep") tuck(n, performance.now()); }   // in bed already
      else if (R.jog && afterDark()) goneIn(n);                      // out on the track after dark: already gone in
      return n;
    }).concat((STAFF[R.id] || []).map(st => staffNpc(st, R)));
    R.peopled = true;
  }

  // ---------------------------------------------------------------- routines
  /* With the whole academy handed over (`opts.academy`) and routines.js loaded, who is
     where is down to the hour: in class in the morning, at lunch at noon, out on the track
     at dawn and after school, asleep in their rooms at night, each by her own lights (Suzuka
     running alone before anyone is up, Oguri wherever the food is, Tachyon in her lab long
     after lights out). The rooms fill and empty to match. As a band turns over, whoever is
     due elsewhere gets up, walks out through the door that way and is gone; whoever is due
     here comes in through the door she is coming from. The office keeps its own company. */
  let academy = [], syncAt = 0;
  const ROUTINE_CAP = { hall: 10, cafe: 9, track: 8, library: 6, school: 4, class: 4, dorm: 5, room: 2 };
  const ROUTINE_CAP_LOW = { hall: 7, cafe: 6, track: 2, library: 4 };   // on a phone: fewer to draw
  const routined = R => academy.length > 0 && ROUTINE_CAP[R.id] != null;
  const academyDay = () => Math.floor((Date.now() + clockShift) / GAME_HOUR / 24);
  /** The whole academy's whereabouts now (Routines.plan: each racer's day, a whim or two, a
      handful always about the hall), worked out afresh every three academy minutes. */
  let planKey = "", planMap = null;
  function planNow() {
    const h = hourNow(), key = academyDay() + ":" + Math.floor(h * 20) + ":" + academy.length;
    if (key !== planKey) { planKey = key; planMap = Routines.plan(academy.map(a => bareName(a.name)), h, academyDay()); }
    return planMap;
  }
  /** Where racer `d` is at `hour` (now, by default): a room id and which (`v`), what she is
      at there (`act`), or `away` and where, in words. */
  function whereNow(d, hour) {
    const name = bareName(d.name);
    const w = (hour == null ? planNow() : Routines.plan(academy.map(a => bareName(a.name)), hour, academyDay())).get(name)
      || Routines.where(name, hour == null ? hourNow() : hour, academyDay());
    if (w.place === "home") {
      const v = DORM_ROOMS.findIndex(r => r.names.includes(name));
      return v >= 0 ? { id: "room", v, act: w.act, sure: w.sure } : { id: "away", away: "in her room" };
    }
    if (w.place === "corridor") return { id: "dorm", v: floorOf(name), act: w.act, sure: w.sure };
    if (w.place === "class") return { id: "class", v: Routines.hash(name) % LESSONS.length, act: w.act, sure: w.sure };
    if (w.place === "away") return { id: "away", away: w.away };
    return { id: w.place, act: w.act, sure: w.sure };
  }
  const isIn = (w, R) => w.id === R.id && (w.v == null || w.v === R.v);
  /** Who is due in room R now: whoever her routine puts here, as many as it holds -- the ones
      already in it first, so nobody sat at her lunch is turned out for somebody new; then the
      ones who are always here at this hour (Suzuka on the track at dawn) before the maybes;
      then the same order all day, so the room does not reshuffle. */
  function dueIn(R) {
    const day = academyDay(), cap = (LOW_POWER && ROUTINE_CAP_LOW[R.id]) || ROUTINE_CAP[R.id];
    const here = new Set((crowds[R.id] || []).filter(n => !n.fixed && !n.out && !n.leaving).map(n => n.def.id));
    const rank = o => (here.has(o.d.id) ? 0 : 2 * 4294967296) + (o.w.sure ? 0 : 4294967296) + Routines.hash(o.d.name + day);
    return academy.map(d => ({ d, w: whereNow(d) })).filter(o => isIn(o.w, R) && !(player && player.def.id === o.d.id))
      .sort((a, b) => rank(a) - rank(b)).slice(0, cap);
  }
  /** The way out of room R toward `to` (a whereNow): the place leading there, else the way
      to the dorms, the school or the hall, else any door. */
  function doorToward(R, to) {
    const ps = Object.values(R.places || {}).filter(p => p.room);
    const want = to.id === "away" ? (R.id === "hall" ? "school" : "hall") : to.id;
    return ps.find(p => p.room === want && (p.v == null || to.v == null || p.v === to.v))
      || (want === "room" || want === "dorm" ? ps.find(p => p.room === "dorm") : null)
      || (want === "class" ? ps.find(p => p.room === "school") : null)
      || ps.find(p => p.room === "hall") || ps[0] || null;
  }
  /** Room R as the hour has it. In view, the comings and goings walk through the doors;
      out of view, they just happen. */
  function syncRoom(R, now) {
    if (!routined(R) || !R.peopled) return;
    const due = dueIn(R), crowd = crowds[R.id], seen = R === room;
    for (const n of crowd) {
      if (n.fixed || n.leaving || n.out) continue;
      const o = due.find(o => o.d.id === n.def.id);
      if (o) {
        // still here, at something else now: she gets round to it shortly
        if (o.w.act !== n.want) { n.want = o.w.act; if (n.state === "stay") n.until = Math.min(n.until, now + Math.random() * 4000); }
      } else if (seen) leave(n, whereNow(n.def), now);
      else n.out = true;
    }
    for (const o of due) {
      if (crowd.some(n => n.def.id === o.d.id && !n.out)) continue;
      const n = makeNpc(o.d, R);
      n.want = o.w.act;
      if (R.id === "room") n.home = DORM_ROOMS[R.v].names.indexOf(bareName(o.d.name));
      if (seen) comeIn(n, now);
      crowd.push(n);
    }
  }
  /** Off to `to`: up off her seat, over to the door that way, and out through it. */
  function leave(n, to, now) {
    const p = doorToward(n.R, to);
    if (!p) { n.out = true; return; }
    n.leaving = p; n.until = 0;
    if (n.state === "jog" || n.state === "walk") n.state = "idle";
    if (n.perch > 0 && n.state !== "rise") n.state = "rise";
  }
  /** In through the door she is coming from (where she was a little while ago). */
  function comeIn(n, now) {
    const was = whereNow(n.def, hourNow() - 0.75);
    const p = doorToward(n.R, isIn(was, n.R) ? { id: "hall" } : was);
    if (!p) return;
    n.door = { p, t: 0 }; n.state = "in";
    n.x = n.rx = p.x + Math.sin(p.face) * DOORWAY; n.z = n.rz = p.z + Math.cos(p.face) * DOORWAY;
    n.yaw = p.face + PI;
  }
  /** The door at place `p` held open a moment for somebody going through it. */
  function holdDoor(p, now) {
    const d = p.door && room.doors[p.door];
    if (d) d.npcUntil = now + 700;
  }
  /** Her bed, in her dorm room: the room's nap spot on her side. */
  const bedOf = n => n.R.id === "room" && n.home != null && n.home >= 0
    ? (n.R.things || []).find(t => t.kind === "nap" && t.poi && t.poi[0] === n.home) : null;
  function bedGoal(n) {
    const th = bedOf(n);
    if (!th || n.R.taken.has("p" + n.home)) return null;
    n.slot = "p" + n.home; n.R.taken.set(n.slot, n);
    return { x: th.x, z: th.z, face: th.face, bed: th.bed, act: "sleep", stay: 600000 };
  }
  /** Asleep in her bed already, as she is found when the door opens at night. */
  function tuck(n, now) {
    const g = bedGoal(n);
    if (!g) return;
    n.goal = g; n.x = n.rx = g.x; n.z = n.rz = g.z; n.yaw = g.face;
    n.state = "stay"; n.act = "sleep"; n.perch = 1; n.until = now + g.stay;
  }
  /* What her routine has her doing, as the spots in a room that suit it. */
  const WANT_POIS = { eat: ["eat"], study: ["study"], read: ["read", "browse"], browse: ["browse", "look"], look: ["look", "browse"],
                      sit: ["sit", "study"], stretch: ["stretch"], train: ["drill", "stretch"], sleep: ["sit"] };
  /** A goal for what she is here to do, if the room has one free; false if not. */
  function wantGoal(n, now) {
    const R = n.R, w = n.want;
    if (w === "sleep") { const g = bedGoal(n); if (g) { n.goal = g; n.state = "walk"; return true; } }
    if (R.jog && (w === "jog" || (w === "train" && Math.random() < 0.45))) {
      n.goal = { x: R.jog.entry.x + (Math.random() - 0.5) * 2, z: R.jog.entry.z, act: "jog", jog: true, stay: 0 };
      n.state = "walk"; return true;
    }
    const acts = WANT_POIS[w];
    if (!acts) return false;
    const free = R.pois.map((p, i) => ({ p, i })).filter(o => acts.includes(o.p.act) && !R.taken.has("p" + o.i) && !o.p.who
      && (o.p.owner == null || n.home == null || o.p.owner === n.home));
    if (!free.length) return false;
    goPoi(n, free[Math.floor(Math.random() * free.length)]);
    return true;
  }
  /** Who is in the room with her, by name: for a word to somebody in particular. */
  const company = n => (n.R === room ? npcs : crowds[n.R.id]).filter(o => o !== n && !o.fixed && !o.out).map(o => bareName(o.def.name));
  /** In for the night, off the track: at the school's doors, out of sight, until morning. */
  function goneIn(n) {
    if (n.slot) { n.R.taken.delete(n.slot); n.slot = null; }
    n.gone = true; n.state = "gone"; n.path = null; n.goal = null; n.perch = 0;
    n.x = n.rx = TRACK_EXIT.x; n.z = n.rz = TRACK_EXIT.z;
    n.m.root.visible = false; n.bubble.hidden = true;
  }

  /** Into a room (`v`: which room of the dorms, or which floor): its doors shut, its tags, its company. The room
      she leaves carries on. */
  function enterRoom(id, v) {
    if (act && player && room) cancelAct();                   // whatever she was at stays behind
    if (scene) clearMotes();
    if (held && held.kind === "tray" && id !== "cafe") dropHeld();   // a tray stays in the cafeteria
    nearThing = null;
    for (const n of npcs) n.bubble.hidden = true;
    room = built(ROOMS[id] || ROOMS.hall);
    if (opts && opts.onMusic) opts.onMusic(room.music || null);         // a place with music of its own, or the home theme
    if (root.Quests) Quests.record("lobbyRoom", { room: room.id, v });  // "make the rounds", which dorm room (quests.js)
    if (room.dress) room.dress(room, v || 0);
    if (!room.peopled || room.dress || routined(room)) people(room);    // (by the hour, with routines)
    npcs = crowds[room.id];
    showRoom(room);
    lookOf(room);
    fitCamera();
    for (const k in room.doors) { const d = room.doors[k]; d.open = d.target = 0; swingDoor(d, 0); }
    placeTags();
    if (room.greet) for (const n of npcs) n.greeted = false;    // a word for her each time she comes in
    snapCam = true;
  }

  // ---------------------------------------------------------------- racers
  /** A figure for `def`: a racer in her signature racing outfit -- what she wears everywhere
      in this game -- or, if it is the trainer, the trainer. */
  function racerFor(def) {
    const m = def.trainer ? V.kit.trainer.make(def.trainer) : makeRacer(def.name, def.color);
    scene.add(m.root);
    return m;
  }
  // what the others in this room say to her: the trainer is "Trainer", a racer a classmate
  const linesFor = R => player && !player.def.trainer && R.peerLines ? R.peerLines : R.lines;
  const pickOf = a => a[Math.floor(Math.random() * a.length)];
  /** Something for `n` to say to her, in her own voice (lines.js): to the trainer, or to the
      racer the player is walking as. The staff and the trainer have their own. */
  function lineOf(n) {
    if (n.def.lines) return pickOf(n.def.lines);
    // her own, for the hour and what she is at, or for somebody here (routines.js)
    if (academy.length && !n.def.trainer && Math.random() < 0.6) {
      const l = Routines.line(bareName(n.def.name), hourNow(), n.act || n.want, company(n));
      if (l) return l;
    }
    if (n.def.trainer) return pickOf(OFFICE_LINES).replace("{name}", player ? player.def.name : "");
    if (root.Lines && player) return Lines.line(n.def.name, player.def.trainer ? { trainer: true } : player.def);
    return pickOf(linesFor(n.R));
  }
  const sayLine = (n, ms) => say(n, `<b>${esc(n.def.name)}</b>${esc(lineOf(n))}`, ms || 3400);
  let chatterAt = 0;                                       // the next time anyone may speak up unasked

  function placeTags() {
    for (const t of tags) t.el.remove();
    tags = [];
    for (const id in room.places) {
      const p = room.places[id], st = p.station ? (opts.stations || {})[p.station] : null;
      if (p.station && !st) continue;                    // a mode the shell is not offering
      const label = p.label || st.label, sub = p.sub || (st && st.sub), icon = p.icon || (st && st.icon) || "star";
      const el = document.createElement("button");
      el.className = "lb-tag" + (p.station === "career" ? " lead" : "") + (p.quiet ? " quiet" : "");
      el.dataset.place = id;
      el.innerHTML = `${root.Icon ? Icon(icon) : ""}<span><b>${esc(label)}</b>${sub ? `<i>${esc(sub)}</i>` : ""}</span>` +
                     (st && st.badge ? `<em class="badge">${st.badge}</em>` : "") + `<kbd>E</kbd>`;
      el.onclick = e => { e.stopPropagation(); if (!seq) goTo(id); };
      tagsEl.appendChild(el);
      tags.push({ id, el, p });
    }
  }

  /** One of the others, somewhere in room R. */
  function makeNpc(def, R) {
    const m = racerFor(def), A = R.roam;
    let x = 0, z = 0, guard = 0;
    do { x = lerp(A.x[0], A.x[1], Math.random()); z = lerp(A.z[0], A.z[1], Math.random()); } while (!R.walkable(x, z, 0.35) && guard++ < 60);
    m.root.visible = R === room;
    const n = { def, m, R, x, z, yaw: Math.random() * 6.283, speed: 1.2 + Math.random() * 0.5, state: "idle",
                until: performance.now() + Math.random() * 4000, goal: null, slot: null, act: null, last: { x, z, t: 0 },
                perch: 0, rx: x, rz: z, path: null, greeted: false, bubble: null, bubbleUntil: 0 };
    const b = document.createElement("div");
    b.className = "lb-bub"; b.hidden = true;
    tagsEl.appendChild(b);
    n.bubble = b;
    return n;
  }
  function dropNpc(n) {
    scene.remove(n.m.root);
    if (n.slot) n.R.taken.delete(n.slot);
    n.bubble.remove();
  }

  /** A bubble over her -- only where the player can see it. */
  function say(n, html, ms) {
    if (n.R !== room || n.gone) return;
    n.bubble.innerHTML = html;
    n.bubble.hidden = false; n.bsz = null;
    n.bubbleUntil = performance.now() + (ms || 2600);
  }

  // a seat is reached from the floor this far in front of it; the hips rise this much to sit on it
  const SIT_STEP = 0.9, SIT_RATE = 2.2;
  function plan(n, now) {
    const R = n.R, taken = R.taken;
    if (n.slot) { taken.delete(n.slot); n.slot = null; }
    if (n.goal && n.goal.seat && n.goal.seat.tray) n.goal.seat.tray.visible = false;   // her lunch goes with her
    n.last = { x: n.x, z: n.z, t: now };
    n.act = null; n.perch = 0; n.path = null;
    // due elsewhere (her routine): over to the door that way
    if (n.leaving) {
      n.goal = { x: n.leaving.x, z: n.leaving.z, act: "idle", leave: true, stay: 0 };
      n.state = "walk"; return;
    }
    // a place of her own (Oguri's, at the end of the table): most of the time, she is there
    const own = R.pois.findIndex(p => p.who && p.who === bareName(n.def.name));
    if (own >= 0 && !taken.has("p" + own) && Math.random() < 0.8) return goPoi(n, { p: R.pois[own], i: own });
    // what her routine has her here for leads, most of the time: lunch, a lap, her books, her bed
    if (n.want && n.want !== "chat" && Math.random() < 0.75 && wantGoal(n, now)) return;
    // out on the track, a good share of the time she goes for a jog: over to the line, and round
    if (R.jog && Math.random() < 0.4) {
      n.goal = { x: R.jog.entry.x + (Math.random() - 0.5) * 2, z: R.jog.entry.z, act: "jog", jog: true, stay: 0 };
      n.state = "walk"; return;
    }
    const r = n.want === "chat" && Math.random() < 0.6 ? 0 : Math.random();   // out to talk: a huddle, mostly
    if (r < 0.38) {
      // a huddle: prefer one somebody is already standing in
      const order = R.huddles.map((h, i) => ({ h, i, busy: [0, 1, 2].filter(k => taken.has("h" + i + ":" + k)).length }))
        .filter(o => o.busy < 3).sort((a, b) => b.busy - a.busy || Math.random() - 0.5);
      const o = order[0];
      if (o) {
        const k = [0, 1, 2].find(k => !taken.has("h" + o.i + ":" + k));
        const a = k * 2.094 + o.i, gx = o.h[0] + Math.cos(a) * 0.8, gz = o.h[1] + Math.sin(a) * 0.8;
        if (R.walkable(gx, gz, 0.3)) {
          n.slot = "h" + o.i + ":" + k; taken.set(n.slot, n);
          n.goal = { x: gx, z: gz, faceTo: { x: o.h[0], z: o.h[1] }, act: "chat", stay: 9000 + Math.random() * 12000 };
          n.state = "walk"; return;
        }
      }
    }
    if (r < 0.8) {
      // anywhere free that is hers to use: not somebody's own place, nor the other girl's side of the room
      const free = R.pois.map((p, i) => ({ p, i })).filter(o => !taken.has("p" + o.i) && !o.p.who
        && (o.p.owner == null || n.home == null || o.p.owner === n.home));
      if (free.length) return goPoi(n, free[Math.floor(Math.random() * free.length)]);
    }
    // otherwise, just somewhere
    const A = R.roam;
    for (let i = 0; i < 20; i++) {
      const gx = lerp(A.x[0], A.x[1], Math.random()), gz = lerp(A.z[0], A.z[1], Math.random());
      if (R.walkable(gx, gz, 0.35)) { n.goal = { x: gx, z: gz, act: "idle", stay: 2000 + Math.random() * 5000 }; n.state = "walk"; return; }
    }
    n.state = "idle"; n.until = now + 2000;
  }
  /** Off to spot `o` ({ p, i }) of her room. A seat: she walks up to the front of it (or
      wherever it is got into from), turns, and sits back onto it. */
  function goPoi(n, o) {
    n.slot = "p" + o.i; n.R.taken.set(n.slot, n);
    const sit = o.p.act === "sit" || !!o.p.seat, from = o.p.from;
    n.goal = { x: from ? from.x : o.p.x + (sit ? Math.sin(o.p.face) * SIT_STEP : 0),
               z: from ? from.z : o.p.z + (sit ? Math.cos(o.p.face) * SIT_STEP : 0),
               seat: sit ? o.p : null, face: o.p.face, act: o.p.act, icon: o.p.icon,
               stay: o.p.feast ? 45000 + Math.random() * 30000 : (sit ? 12000 : 6000) + Math.random() * 10000 };
    n.state = "walk";
  }

  /** Steer toward (gx, gz) at `v` m/s, sliding along anything in the way: the keys. */
  function stepToward(o, gx, gz, v, dt, r) {
    const dx = gx - o.x, dz = gz - o.z, d = Math.hypot(dx, dz);
    if (d < 0.08) return true;
    const s = Math.min(d, v * dt), ux = dx / d, uz = dz / d;
    const nx = o.x + ux * s, nz = o.z + uz * s;
    // already inside the margin round something (stood at the vending machine, say): every
    // step from there is in it too, so she would never get out -- let her, as long as she
    // keeps off the thing itself
    if (!walkable(o.x, o.z, r)) r = 0.05;
    if (walkable(nx, nz, r)) { o.x = nx; o.z = nz; }
    else if (walkable(nx, o.z, r)) o.x = nx;
    else if (walkable(o.x, nz, r)) o.z = nz;
    o.yaw = turn(o.yaw, Math.atan2(ux, uz), dt * 9);
    return false;
  }
  function turn(a, b, k) {
    let d = ((b - a + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI;
    return a + d * clamp(k, 0, 1);
  }

  /** One of the staff, at her post (see STAFF). */
  function staffNpc(st, R) {
    const n = makeNpc(st, R);
    n.x = n.rx = st.x; n.z = n.rz = st.z; n.yaw = st.yaw; n.fixed = st; n.state = "staff";
    if (st.hold) {                                            // a trainer's stopwatch or clipboard, in her hand
      const p = trainerProp(st.hold);
      p.scale.setScalar(1 / n.m.rig.scale.x); p.position.set(0, -6.6, 1.0); p.rotation.x = -0.9;
      n.m.armR.add(p);
    }
    return n;
  }
  /* The staff's hours, by room: Tazuna at the front desk, the cook at the pans, the librarian
     at the desk. Outside them the place is theirs no longer. (The track's go in after dark.) */
  const STAFF_HOURS = { hall: [7, 21], cafe: [6, 20.5], library: [8, 21] };
  /** What one of the staff says. Tazuna, who knows where everybody is, often says that:
      "Looking for Symboli Rudolf? She's in the student council room." */
  function staffLine(st) {
    if (st.id === "staff-tazuna" && academy.length && Math.random() < 0.45) {
      const off = academy.map(d => ({ d, w: whereNow(d) })).filter(o => o.w.id === "away" && o.w.away && o.w.away !== "out");
      if (off.length) { const o = off[Math.floor(Math.random() * off.length)]; return `Looking for ${bareName(o.d.name)}? She's ${o.w.away}.`; }
    }
    return st.lines[Math.floor(Math.random() * st.lines.length)];
  }
  function updateStaff(n, dt, now) {
    const st = n.fixed, m = n.m, t = now / 1000 + m.seed;
    // out on the track, only the old hand stays on after dark; indoors, the staff keep their hours
    const hours = STAFF_HOURS[n.R.id];
    if (n.R.jog || hours) {
      const h = hourNow();
      const away = n.R.jog ? !st.night && afterDark() : !(h >= hours[0] && h < hours[1]);
      if (away !== !!n.gone) { n.gone = away; m.root.visible = !away && n.R === room; if (away) n.bubble.hidden = true; }
      if (away) return;
    }
    const d = player && n.R === room ? Math.hypot(player.x - st.x, player.z - st.z) : 99;
    m.root.position.set(st.x, 0, st.z);
    m.root.rotation.y = st.yaw;
    pose(m, 0, now / 1000, {});
    if (st.work === "watch" || st.work === "clipboard" || st.work === "coach") {
      // trainers at the track: an eye on whoever is running nearest, or on the player close by
      let tx = null, tz = null, best = 14;
      for (const o of n.R === room ? npcs : crowds[n.R.id]) {
        if (o.fixed || o.gone) continue;
        const dd = Math.hypot(o.rx - st.x, o.rz - st.z);
        if ((o.state === "jog" || st.work === "coach") && dd < best) { best = dd; tx = o.rx; tz = o.rz; }
      }
      if (d < 3.5) { tx = player.x; tz = player.z; }
      if (tx != null) m.head.rotation.y = clamp(turn(0, Math.atan2(tx - st.x, tz - st.z) - st.yaw, 1), -0.9, 0.9);
      if (st.work === "watch") { m.armR.rotation.x = -1.35; m.armR.rotation.z = 0.15; m.head.rotation.x = -0.05; }    // the stopwatch up
      else if (st.work === "clipboard") {                                                                              // taking notes
        m.armR.rotation.x = -1.2; m.armL.rotation.x = -1.0 + Math.sin(t * 6) * 0.05; m.head.rotation.x = Math.sin(t * 0.7) > 0.3 ? 0.35 : 0;
      } else if (Math.sin(t * 0.9) > 0.2) { m.armR.rotation.x = -1.6 + Math.sin(t * 5) * 0.3; m.armR.rotation.z = 0.3; }  // calling it out
    } else if (now < (n.serving || 0)) {
      // handing a tray over the counter
      m.armL.rotation.x = m.armR.rotation.x = -1.35;
      m.head.rotation.x = 0.1;
    } else if (d < 4.5) {
      // somebody at the desk: she looks up at them
      const a = turn(0, Math.atan2(player.x - st.x, player.z - st.z) - st.yaw, 1);
      m.head.rotation.y = clamp(a, -0.8, 0.8);
      m.armL.rotation.x = m.armR.rotation.x = -0.35;
    } else if (st.work === "ladle") {
      // at the pans: stirring, an eye on the pot
      m.armR.rotation.x = -1.1 + Math.sin(t * 3) * 0.12; m.armR.rotation.z = 0.25 + Math.cos(t * 3) * 0.12;
      m.armL.rotation.x = -0.6; m.head.rotation.x = 0.28;
    } else {
      // at her work: hands at the keyboard, an eye on the screen
      m.armL.rotation.x = -0.95 + Math.sin(t * 8) * 0.04; m.armR.rotation.x = -0.95 - Math.sin(t * 8) * 0.04;
      m.head.rotation.y = st.monitor * 0.45 + Math.sin(t * 0.4) * 0.05;
      m.head.rotation.x = 0.12;
    }
    if (d < 3 && !n.greeted && !seq) {
      n.greeted = true;
      say(n, `<b>${esc(n.def.name)}</b>${esc(staffLine(st))}`, 3400);
    }
    if (d > 6) n.greeted = false;                         // a word again the next time
    if (!n.bubble.hidden && now > n.bubbleUntil) n.bubble.hidden = true;
  }

  function updateNpc(n, dt, now) {
    if (n.fixed) return updateStaff(n, dt, now);
    let run = 0;
    const here = n.R === room;
    // out on the track: in at dusk (off the seat, to the school's doors, gone), out again in the
    // morning -- unless routines keep the hours, and take her in themselves
    if (n.R.jog && !academy.length) {
      const dark = afterDark();
      if (n.gone) {
        if (dark) return;
        n.gone = false; n.state = "idle"; n.until = now + Math.random() * 6000;
        n.x = n.rx = TRACK_EXIT.x; n.z = n.rz = TRACK_EXIT.z; n.m.root.visible = here;
      } else if (dark && !(n.goal && n.goal.home)) {
        if (n.slot) { n.R.taken.delete(n.slot); n.slot = null; }
        n.perch = 0; n.act = null; n.path = null;
        n.goal = { x: TRACK_EXIT.x, z: TRACK_EXIT.z, act: "idle", home: true, stay: 0 }; n.state = "walk";
      }
    }
    if (n.state === "jog") {
      // a lap of the oval at her own pace, the sand flying
      const J = n.R.jog, v = n.jogV;
      n.lap.s += v * dt; n.lap.left -= v * dt;
      const p = ovalAt(J.r, n.lap.s), q = ovalAt(J.r, n.lap.s + 0.4);
      n.x = p.x; n.z = p.z; n.yaw = turn(n.yaw, Math.atan2(q.x - p.x, q.z - p.z), dt * 10);
      run = 0.62;
      if (here && Math.random() < dt * 5) mote(n.x + (Math.random() - 0.5) * 0.3, 0.08, n.z + (Math.random() - 0.5) * 0.3, 0xcaa878, 0.07, 0.7, 0.35);
      if (n.lap.left <= 0) plan(n, now);
    }
    if (n.state === "through" || n.state === "in") {
      // through a doorway (routines): out of the room and gone, or in from beyond it and on in
      const p = n.door.p, out = n.state === "through";
      n.door.t = Math.min(1, n.door.t + dt / 1.1);
      const k = out ? n.door.t : 1 - n.door.t;
      n.x = p.x + Math.sin(p.face) * DOORWAY * k; n.z = p.z + Math.cos(p.face) * DOORWAY * k;
      n.yaw = turn(n.yaw, out ? p.face : p.face + PI, dt * 8);
      run = 0.3;
      if (here) holdDoor(p, now);
      if (n.door.t >= 1) {
        if (out) { n.out = true; n.m.root.visible = false; n.bubble.hidden = true; return; }
        n.door = null; n.state = "idle"; n.until = now + 300;
      }
    }
    if (n.state === "idle" || n.state === "stay") {
      // getting up off a seat comes first: off it, back onto the floor in front
      if (now > n.until) { if (n.perch > 0) n.state = "rise"; else plan(n, now); }
    }
    if (n.state === "rise") {
      n.perch = Math.max(0, n.perch - dt * (n.goal && n.goal.bed ? LIES : SIT_RATE));
      if (n.perch === 0) plan(n, now);
    }
    if (n.state === "walk" && n.goal && !n.path) {
      n.path = findPath(n.R, n.x, n.z, n.goal.x, n.goal.z);
      // nowhere to go from here after all: stand a moment and think of something else (or,
      // on her way out, just go)
      if (!n.path && n.leaving) { n.out = true; n.m.root.visible = false; return; }
      if (!n.path) { if (n.slot) { n.R.taken.delete(n.slot); n.slot = null; } n.state = "idle"; n.until = now + 1500; }
    }
    if (n.state === "walk" && n.goal) {
      const arrived = follow(n, n.speed, dt);
      run = 0.3;
      // stuck: nobody walks into a pillar for ever
      if (now - n.last.t > 1200) {
        if (Math.hypot(n.x - n.last.x, n.z - n.last.z) < 0.15) { plan(n, now); }
        n.last = { x: n.x, z: n.z, t: now };
      }
      if (arrived && n.goal.home) { goneIn(n); return; }                      // in for the night
      if (arrived && n.goal.leave) { n.state = "through"; n.door = { p: n.leaving, t: 0 }; }   // at the door: out
      else if (arrived && n.goal.jog) {                                               // on the line: off she goes, a lap or two
        n.state = "jog"; n.jogV = 2.8 + Math.random() * 1.0;
        n.lap = { s: n.R.jog.s0 - n.x, left: n.R.jog.P * (1 + Math.floor(Math.random() * 2)) };   // (the entry is on the near straight)
      } else if (arrived) {
        n.state = "stay"; n.act = n.goal.act; n.until = now + n.goal.stay;
        if (n.goal.icon && Math.random() < 0.8) say(n, root.Icon ? Icon(n.goal.icon) : "", 2400);
      }
    }
    if (n.state === "stay" && n.goal) {
      const want = n.goal.faceTo ? Math.atan2(n.goal.faceTo.x - n.x, n.goal.faceTo.z - n.z) : n.goal.face;
      if (want != null) n.yaw = turn(n.yaw, want, dt * 4);
      // turned round with the seat behind her: down she sits
      if (n.goal.seat && Math.abs(turn(0, n.goal.face - n.yaw, 1)) < 0.3) n.perch = Math.min(1, n.perch + dt * SIT_RATE);
      // at her bed: in it, and asleep, now and then saying so
      if (n.goal.bed) {
        n.perch = Math.min(1, n.perch + dt * LIES);
        if (here && n.perch === 1 && n.bubble.hidden && Math.random() < dt * 0.06) say(n, "Zzz...", 1800);
      }
      // the talking: a "..." over somebody in the huddle every so often -- or a word, often for
      // somebody in particular (routines.js)
      if (n.act === "chat" && n.bubble.hidden && Math.random() < dt * 0.12) {
        const mine = academy.length && Math.random() < 0.45 ? Routines.line(bareName(n.def.name), hourNow(), "chat", company(n)) : null;
        if (mine) say(n, `<b>${esc(n.def.name)}</b>${esc(mine)}`, 3200);
        else if (root.Lines && Math.random() < 0.35) say(n, `<b>${esc(n.def.name)}</b>${esc(Lines.line(n.def.name, null))}`, 3000);
        else say(n, "<span class='dots'><i></i><i></i><i></i></span>", 2200);
      }
    }
    // stride
    if (run > 0) n.m.phase += dt * (1.6 + n.speed * 0.5) * PI * 2;
    // where she is drawn: n.x/n.z stays on the floor in front of the seat, so the walking
    // never starts from inside the furniture; the perch carries the model back onto it
    // (on a bed, laid back along it, her head on the pillow, as the player naps)
    const k = ease(n.perch), seat = n.goal && n.goal.seat, bed = n.goal && n.goal.bed;
    n.rx = n.x; n.rz = n.z;
    if (bed && k > 0) {
      n.m.root.position.set(lerp(n.x, bed.x, k), (bed.y + 3.5 * n.m.rig.scale.x) * k, lerp(n.z, bed.z, k));
      n.m.root.rotation.set(-PI / 2 * k, n.yaw, 0, "YXZ");
      n.rx = lerp(n.x, bed.x, k); n.rz = lerp(n.z, bed.z - 1.2, k);              // her bubble over her head
    } else {
      if (k > 0 && seat) { n.rx += (seat.x - n.x) * k; n.rz += (seat.z - n.z) * k; }
      n.m.root.position.set(n.rx, 0, n.rz);
      n.m.root.rotation.set(0, n.yaw, 0);
    }
    pose(n.m, run, now / 1000, {});
    if (k > 0 && !bed) {
      // thighs out level along the seat, hips just above it
      n.m.legL.rotation.x = n.m.legR.rotation.x = -1.45 * k;
      n.m.rig.position.y = n.m.sitLift * k;
      n.m.body.rotation.x -= 0.07 * k;
    }
    // sat down to lunch: her tray is on the table in front of her
    const tray = seat && seat.tray;
    if (tray && tray.visible !== (n.perch > 0.7 && n.act === "eat")) { tray.visible = !tray.visible; tray.userData.food.visible = true; }
    if (n.state === "stay") gesture(n, now);
    // a glance at the player when she passes close by; in the office, a word for her trainer
    if (here && player && run === 0 && n.perch === 0) {
      const d = Math.hypot(player.x - n.x, player.z - n.z);
      if (d < 2.6) {
        const a = turn(0, Math.atan2(player.x - n.x, player.z - n.z) - n.yaw, 1);
        n.m.head.rotation.y = clamp(a, -0.8, 0.8);
      }
    }
    const asleep = !!bed && n.perch > 0;                  // (no words from her: she is asleep)
    if (here && !asleep && !room.greet && player && !seq && n.bubble.hidden && now > (n.spoke || 0) && now > chatterAt
        && Math.hypot(player.x - n.rx, player.z - n.rz) < 1.9) {
      n.spoke = now + 25000; chatterAt = now + 3500;
      if (Math.random() < 0.5) sayLine(n);
    }
    if (here && !asleep && room.greet && player && !n.greeted && !seq && Math.hypot(player.x - n.rx, player.z - n.rz) < 2.2) {
      n.greeted = true;
      sayLine(n);
    }
    if (!n.bubble.hidden && now > n.bubbleUntil) n.bubble.hidden = true;
  }

  /** Eating at a table: chopsticks up to her mouth, back down to the tray. */
  function eatPose(m, t) {
    const k = t * 0.9 % 1;
    if (k < 0.3) { m.armR.rotation.x = -2.05; m.armR.rotation.z = 0.28; m.head.rotation.x = 0.02; }
    else { m.armR.rotation.x = -1.1; m.armR.rotation.z = 0.12; m.head.rotation.x = 0.24 + Math.sin(t * 9) * 0.02; }
    m.armL.rotation.x = -0.95;
  }
  /** High knees on the spot, arms pumping: a drill at the cones. */
  function drillPose(m, t) {
    const s = Math.sin(t * 9);
    m.legL.rotation.x = -Math.max(0, s) * 1.3; m.legR.rotation.x = -Math.max(0, -s) * 1.3;
    m.armL.rotation.x = s * 0.9; m.armR.rotation.x = -s * 0.9;
    m.rig.position.y = Math.abs(s) * 0.06;
  }
  /** Bent over her desk, writing. */
  function studyPose(m, t) {
    m.armR.rotation.x = -1.05 + Math.sin(t * 7) * 0.06; m.armR.rotation.z = 0.1;
    m.armL.rotation.x = -0.95; m.head.rotation.x = 0.3;
  }
  /** Sat with a book open in her lap, a page turned now and then. */
  function readPose(m, t) {
    m.armL.rotation.x = -0.85; m.armR.rotation.x = -0.85 - (Math.sin(t * 0.7) > 0.93 ? 0.35 : 0);
    m.armL.rotation.z = -0.15; m.armR.rotation.z = 0.15; m.head.rotation.x = 0.32;
  }
  /** What she does with herself once she is there. */
  function gesture(n, now) {
    const m = n.m, t = now / 1000 + m.seed;
    switch (n.act) {
      case "sit":
        if (n.goal.icon && n.perch === 1) { m.armR.rotation.x = -1.9 + Math.sin(t * 3) * 0.15; m.armR.rotation.z = 0.3; }
        break;
      case "drink":
        m.armR.rotation.x = -1.6 + Math.sin(t * 0.8) * 0.4; m.armR.rotation.z = 0.2;
        break;
      case "chat":
        if (Math.sin(t * 0.9) > 0.55) { m.armR.rotation.x = -0.9 + Math.sin(t * 6) * 0.25; m.armR.rotation.z = 0.35; }
        m.head.rotation.x += Math.sin(t * 2.3) * 0.05;
        break;
      case "listen":
        m.body.rotation.z = Math.sin(t * 2.4) * 0.06;
        m.head.rotation.z = Math.sin(t * 2.4) * 0.12;
        break;
      case "read": case "browse":
        if (n.perch === 1) { readPose(m, t); break; }                     // in a chair, with a book
        m.head.rotation.x = n.act === "browse" ? 0.12 : -0.1;
        m.armL.rotation.x = -0.5; m.armR.rotation.x = -0.5;
        break;
      case "look":
        // hands behind her back, looking out
        m.armL.rotation.x = m.armR.rotation.x = 0.35;
        m.head.rotation.x = -0.08 + Math.sin(t * 0.5) * 0.04;
        m.head.rotation.y = Math.sin(t * 0.35) * 0.25;
        break;
      case "work":
        // at the keyboard, head down over it
        if (n.perch === 1) {
          const s = Math.sin(t * 9);
          m.armL.rotation.x = -1.15 + s * 0.05; m.armR.rotation.x = -1.15 - s * 0.05;
          m.head.rotation.x = 0.2;
        }
        break;
      case "eat":
        // a bite, and chew, and another (Oguri twice as fast, at her own place)
        if (n.perch === 1) eatPose(m, t * (n.goal.seat && n.goal.seat.feast ? 1.9 : 1));
        break;
      case "study":
        if (n.perch === 1) studyPose(m, t);
        break;
      case "knock":
        // at a friend's door: a knock now and then, then waiting
        if (Math.sin(t * 0.8) > 0.45) { m.armR.rotation.x = -1.75 + Math.abs(Math.sin(t * 12)) * 0.22; m.armR.rotation.z = 0.25; }
        break;
      case "stretch": {
        const s = Math.sin(t * 1.1);
        m.armL.rotation.x = m.armR.rotation.x = -2.9 + s * 0.08;
        m.armL.rotation.z = -0.25; m.armR.rotation.z = 0.25;
        m.body.rotation.z = s * 0.12;
        break;
      }
      case "drill": drillPose(m, t); break;
    }
  }

  // ---------------------------------------------------------------- things she does
  /* With E by a thing (see HALL_THINGS): sit on a bench or the sofa or at the desk; buy a
     can from the machine -- pay, it drops, she picks it up, turns and drinks, and carries it
     after, sipping now and then -- and toss it in a bin; make a cup of tea, steaming; look
     out of the window; admire the trophies; read the board. A step, a click or E again
     ends the ones she stays at. */
  let act = null, held = null, nearThing = null, hintEl = null;
  const hintBox = { el: null, s: null };                  // the hint, as clearOf sees it
  const motes = [];
  const STAYS = { sit: true, look: true, admire: true, read: true, nap: true };
  const LIES = 1.4;                                              // how fast she lies down on a bed, and gets up
  /** A thing's spot, worked out once: where she stands for it, which way, where its hint is. */
  function spotOf(R, th) {
    if (th._at) return th;
    if (th.kind === "sit") {
      const p = R.pois[th.poi[0]], f = p.from;
      th.seat = p; th.face = p.face;
      th.x = f ? f.x : p.x + Math.sin(p.face) * SIT_STEP; th.z = f ? f.z : p.z + Math.cos(p.face) * SIT_STEP;
      th.ax = p.x; th.ay = 1.25; th.az = p.z;
    }
    th._at = true;
    return th;
  }
  const isFree = (R, th) => !(th.poi || []).some(i => R.taken.has("p" + i) && R.taken.get("p" + i) !== player);
  // a seat (or a bed) is first come; at anything else, whoever is there steps aside for her
  // (startThing). One thing in her hands at a time
  const fullTray = () => held && held.kind === "tray" && !held.empty;
  const usable = (R, th) => (th.needs !== "held" || !!held) && (th.needs !== "tray" || (held && held.kind === "tray"))
    && ((th.kind !== "sit" && th.kind !== "nap") || isFree(R, th))
    && !((th.kind === "vend" || th.kind === "food") && held) && !(th.kind === "tea" && held && held.kind !== "cup");
  function labelOf(th) {
    if (th.kind === "sit" && th.work && player.def.trainer) return th.work;
    if (th.kind === "sit" && th.eat && fullTray()) return "Sit and eat";
    if (th.kind === "tea" && held && held.kind === "cup") return th.put;
    return th.label;
  }
  function startThing(th) {
    if (seq || act || !player || !usable(room, th)) return;
    clickGoal = null; keys = {};
    act = { th, kind: th.kind, phase: "go", t: 0 };
    if (root.Quests) Quests.record("lobbyThing", { kind: th.kind });    // a thing done in the academy (quests.js)
    const now = performance.now();
    for (const i of th.poi || []) {
      const n = room.taken.get("p" + i);
      if (n && n !== player && n.state !== undefined) plan(n, now);     // "after you": off she goes elsewhere
      room.taken.set("p" + i, player);
    }
    player.path = findPath(room, player.x, player.z, th.x, th.z) || [{ x: th.x, z: th.z }];
  }
  function release() {
    if (act) for (const i of act.th.poi || []) if (room.taken.get("p" + i) === player) room.taken.delete("p" + i);
  }
  /** Done with it: up off a seat first; anything else just stops. */
  function endAct() {
    if (!act) return;
    if ((act.kind === "sit" || act.kind === "nap") && player.perch > 0) { act.phase = "rise"; return; }
    release(); act = null;
  }
  /** Dropped at once: through a door, a change of who she is, leaving. */
  function cancelAct() {
    if (act && act.eating != null) act.th.seat.tray.visible = false;
    release(); act = null;
    if (player) player.perch = 0;
  }
  /** What E does: ends what she stays at, else the thing by her, else the door by her. */
  function pressE() {
    if (!player || seq) return false;
    if (act) { if (act.phase === "do" && STAYS[act.kind]) endAct(); return true; }
    if (nearThing) { startThing(nearThing); return true; }
    if (nearId) { startSeq(nearId); return true; }
    return false;
  }

  // what she holds: a can from the machine, a cup of tea -- built in metres, carried in her
  // right hand (her arm is in voxel units, hence the scale)
  const DRINK_CANS = [0xd8302a, 0x3a9ae0, 0xf0c040, 0x5ab84a, 0xf07a2a, 0x8a4ac8];
  function makeHeld(kind) {
    const g = new THREE.Group(), lam = c => new THREE.MeshLambertMaterial({ color: c });
    const box = (w, h, d, c, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lam(c)); m.position.set(x || 0, y || 0, z || 0); g.add(m); };
    if (kind === "tray") return trayMesh();
    if (kind === "can") {
      box(0.07, 0.12, 0.07, DRINK_CANS[Math.floor(Math.random() * DRINK_CANS.length)]);
      box(0.06, 0.012, 0.06, 0xd8dce4, 0, 0.066, 0);
      box(0.072, 0.03, 0.072, 0xf6f6f6, 0, 0.005, 0);                       // its label
    } else if (kind === "water") {
      box(0.06, 0.08, 0.06, 0xdcecf4);                                     // a glass of water
      box(0.05, 0.004, 0.05, 0x8ac4ea, 0, 0.03, 0);
    } else {
      box(0.07, 0.06, 0.07, 0xf8f6f0);
      box(0.056, 0.004, 0.056, 0x8a4a22, 0, 0.029, 0);                       // the tea
      box(0.015, 0.035, 0.03, 0xf8f6f0, 0.045, 0, 0);                         // the handle
      box(0.1, 0.01, 0.1, 0xf8f6f0, 0, -0.035, 0);                            // the saucer
    }
    return g;
  }
  function holdItem(kind, mesh) {
    const now = performance.now();
    mesh.scale.setScalar(1 / player.m.rig.scale.x);
    mesh.rotation.set(0, 0, 0);
    // a tray in both hands, in front of her; anything else in her right hand
    if (kind === "tray") { mesh.position.set(0, 3.0, 5.0); player.m.body.add(mesh); }
    else { mesh.position.set(0, -7.0, 0.9); player.m.armR.add(mesh); }
    held = { kind, mesh, until: kind === "tray" ? Infinity : now + (kind === "can" ? 60000 : 45000), nextSip: now + 4000, sipUntil: 0, steam: 0 };
  }
  function dropHeld() {
    if (!held) return;
    if (held.mesh.parent) held.mesh.parent.remove(held.mesh);
    held = null;
  }
  const worldOf = o => { const v = new THREE.Vector3(); o.getWorldPosition(v); return v; };

  // little things in the air: sparkles over the trophies, steam off the tea
  const moteGeo = new THREE.BoxGeometry(1, 1, 1);
  function mote(x, y, z, colour, size, life, vy) {
    const m = new THREE.Mesh(moteGeo, new THREE.MeshBasicMaterial({ color: colour, transparent: true, opacity: 0.9, depthWrite: false }));
    m.position.set(x, y, z); m.scale.setScalar(size);
    scene.add(m);
    motes.push({ m, t: 0, life, vy, vx: (Math.random() - 0.5) * 0.08, vz: (Math.random() - 0.5) * 0.08 });
  }
  function updateMotes(dt) {
    for (let i = motes.length - 1; i >= 0; i--) {
      const p = motes[i];
      p.t += dt;
      p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt;
      p.m.material.opacity = 0.9 * Math.max(0, 1 - p.t / p.life);
      p.m.rotation.y += dt * 2;
      if (p.t >= p.life) { scene.remove(p.m); p.m.material.dispose(); motes.splice(i, 1); }
    }
  }
  function clearMotes() { for (const p of motes) { scene.remove(p.m); p.m.material.dispose(); } motes.length = 0; }

  function sayMe(text, ms) {
    if (!player || !player.bubble) return;
    player.bubble.innerHTML = `<b>${esc(player.def.trainer ? "You" : player.def.name)}</b>${esc(text)}`;
    player.bubble.hidden = false; player.bsz = null;
    player.bubbleUntil = performance.now() + (ms || 2600);
  }

  /** One frame of what she is doing; returns how much she is striding. */
  function updateAct(dt, now) {
    const a = act, th = a.th;
    a.t += dt;
    if (a.phase === "go") {
      if (!follow(player, 2.8, dt)) return 0.34;
      a.phase = "turn"; a.t = 0;
    }
    if (a.phase === "turn") {
      player.yaw = turn(player.yaw, th.face, dt * 9);
      if (Math.abs(turn(0, th.face - player.yaw, 1)) > 0.1 && a.t < 0.7) return 0;
      a.phase = "do"; a.t = 0;
      if (th.say) sayMe(th.say[Math.floor(Math.random() * th.say.length)], 3400);
      if (th.kind === "tea" && held && held.kind === "cup") a.putting = true;
      if ((th.kind === "bin" || th.kind === "rtray") && held) {
        // out of her hands and away, in an arc, into the bin (or onto the rack)
        a.from = worldOf(held.mesh); a.fly = held.mesh;
        a.fly.parent.remove(a.fly); a.fly.scale.setScalar(1); a.fly.position.copy(a.from); scene.add(a.fly);
        held = null;
      }
      return 0;
    }
    if (a.phase === "rise") {
      player.perch = Math.max(0, player.perch - dt * (a.kind === "nap" ? LIES : SIT_RATE));
      if (player.perch === 0) {
        // up from lunch: she takes her tray with her, empty or not
        if (a.eating != null) { th.seat.tray.visible = false; holdItem("tray", makeHeld("tray")); held.empty = !!a.ate; held.mesh.userData.food.visible = !a.ate; }
        release(); act = null;
      }
      return 0;
    }
    const t = a.t;
    switch (a.kind) {
      case "sit":
        player.perch = Math.min(1, player.perch + dt * SIT_RATE);
        // at a cafeteria table with her lunch: it goes down in front of her, and she eats
        if (th.eat && player.perch === 1 && a.eating == null && fullTray()) {
          dropHeld(); a.eating = 0;
          th.seat.tray.visible = true; th.seat.tray.userData.food.visible = true;
        }
        if (a.eating != null && !a.ate) {
          a.eating += dt;
          if (!a.said) { a.said = 1; sayMe("Thanks for the food!", 2000); }
          if (a.eating > 6 && a.said === 1) { a.said = 2; sayMe(["Mm, that's good.", "The hamburg steak is perfect today.", "I needed this."][Math.floor(Math.random() * 3)], 2400); }
          if (a.eating > 13) { a.ate = true; th.seat.tray.userData.food.visible = false; sayMe("That was delicious!", 2400); }
        }
        break;
      case "nap":
        // she lies back on the bed; once she is down, she drifts off
        player.perch = Math.min(1, player.perch + dt * LIES);
        if (player.perch === 1 && t > (a.zz || 1.6)) { a.zz = t + 3.2; sayMe(a.zz < 5 ? "Just five minutes..." : "Zzz...", 2200); }
        break;
      case "food":
        // the cook hands a tray over the counter; she takes it, and turns round with it
        if (t > 0.35 && !a.served) {
          a.served = true;
          const cook = crowds.cafe.find(n => n.fixed && n.fixed.work === "ladle");
          if (cook) { cook.serving = now + 1300; say(cook, `<b>${esc(cook.def.name)}</b>${esc(["Here you go! Eat up.", "One carrot hamburg set, coming up!", "Extra rice in that one."][Math.floor(Math.random() * 3)])}`, 2600); }
        }
        if (t > 1.3 && !held) holdItem("tray", makeHeld("tray"));
        if (t > 1.6 && t < 2.4) player.yaw = turn(player.yaw, 0, dt * 6);
        if (t > 2.5) { release(); act = null; }
        break;
      case "fountain":
        // a bend over the fountain for a drink
        if (t > 2.6 && !a.ahh) { a.ahh = true; sayMe("Ahh. Cold.", 1800); }
        if (t > 3.2) { release(); act = null; }
        break;
      case "stretch":
        // arms up and a lean either way, a few times over
        if (t > 3.2 && !a.ahh) { a.ahh = true; sayMe(["Ahh, that's better.", "Loosened up!", "Okay, legs, wake up."][Math.floor(Math.random() * 3)], 2000); }
        if (t > 4.2) { release(); act = null; }
        break;
      case "jog": {
        // a lap of the oval, the way the others run it, the sand flying
        const J = room.jog;
        if (a.s == null) { a.s = J.s0 - player.x; a.left = J.P; }
        a.s += 3.4 * dt; a.left -= 3.4 * dt;
        const p = ovalAt(J.r, a.s), q = ovalAt(J.r, a.s + 0.4);
        player.x = p.x; player.z = p.z; player.yaw = turn(player.yaw, Math.atan2(q.x - p.x, q.z - p.z), dt * 10);
        if (Math.random() < dt * 5) mote(p.x + (Math.random() - 0.5) * 0.3, 0.08, p.z + (Math.random() - 0.5) * 0.3, 0xcaa878, 0.07, 0.7, 0.35);
        if (a.left <= 0) { sayMe(["Phew! This sand really works the legs.", "One lap down!", "That felt good."][Math.floor(Math.random() * 3)], 2400); release(); act = null; return 0; }
        return 0.62;
      }
      case "look":
        // the library's globe: a push, and it spins, slowing
        if (th.spin && room.globe && t > 0.3) room.globe.rotation.y += dt * 7 * Math.max(0, 1 - (t - 0.3) / 4);
        break;
      case "juke":
        // a press of the buttons, and the choice is the shell's (it has the music)
        if (t > 0.55 && !a.asked) {
          a.asked = true;
          if (opts && opts.onJukebox) opts.onJukebox(); else sayMe("It isn't plugged in.", 1800);
        }
        if (t > 0.8) { release(); act = null; }
        break;
      case "admire":
        // the cups catch the light
        if (t < 1.4 && Math.random() < dt * 18) mote(th.ax + (Math.random() - 0.5) * 0.3, th.ay - 1.6 + Math.random() * 1.4,
          th.az + (Math.random() - 0.5) * 2.4, 0xffe27a, 0.05, 1.1 + Math.random() * 0.5, 0.35);
        break;
      case "vend":
        if (t > 0.75 && !a.can && !held) { a.can = makeHeld("can"); a.can.position.set(6.875, 0.31, -10.02); scene.add(a.can); }   // clunk
        if (t > 1.35 && a.can) { scene.remove(a.can); holdItem("can", a.can); a.can = null; }   // into her hand
        if (t > 1.6 && t < 2.3) player.yaw = turn(player.yaw, 0, dt * 6);                      // round to face the hall
        if (t > 3.5 && !a.ahh) { a.ahh = true; sayMe("Ahh! That hits the spot.", 2000); }
        if (t > 6.6) { release(); act = null; if (held) held.nextSip = now + 5000; }
        break;
      case "tea":
        if (a.putting) { if (t > 0.6) dropHeld(); if (t > 0.8) { release(); act = null; } break; }
        if (t > 1.2 && !held) { holdItem("cup", makeHeld(th.water ? "water" : "cup")); held.cold = !!th.water; }
        if (t > 1.3 && t < 1.9) player.yaw = turn(player.yaw, 0, dt * 6);
        if (t > 3.0 && !a.ahh) { a.ahh = true; sayMe(th.ahh || "Just the right temperature.", 2000); }
        if (t > 5.6) { release(); act = null; if (held) held.nextSip = now + 4000; }
        break;
      case "bin": case "rtray": {
        // a can is tossed, turning over; a tray is slid onto the rack, level
        const tray = a.kind === "rtray", k = Math.min(1, t / (tray ? 0.45 : 0.55));
        if (a.fly) {
          a.fly.position.set(lerp(a.from.x, th.at.x, k), lerp(a.from.y, th.at.y, k) + Math.sin(k * PI) * (tray ? 0.08 : 0.5), lerp(a.from.z, th.at.z, k));
          if (!tray) a.fly.rotation.x += dt * 12;
          if (k >= 1) { scene.remove(a.fly); a.fly = null; }
        }
        if (t > 0.8) { if (tray) sayMe("Thank you for the meal!", 1800); release(); act = null; }
        break;
      }
    }
    return 0;
  }
  /** Her arms and head for it, over the pose. */
  function actPose(a, now) {
    if (a.phase !== "do") return;
    const m = player.m, t = a.t, s = now / 1000;
    const sip = () => { m.armR.rotation.x = -2.55; m.armR.rotation.z = 0.15; m.head.rotation.x = -0.18; };
    switch (a.kind) {
      case "sit":
        if (a.th.work && player.def.trainer && player.perch === 1) {             // at the keyboard
          m.armL.rotation.x = -1.15 + Math.sin(s * 9) * 0.05; m.armR.rotation.x = -1.15 - Math.sin(s * 9) * 0.05;
          m.head.rotation.x = 0.2;
        }
        if (a.th.pose === "study" && player.perch === 1) studyPose(m, s);
        if (a.th.pose === "read" && player.perch === 1) readPose(m, s);
        if (a.eating != null && !a.ate) eatPose(m, s);
        break;
      case "nap":                                         // arms by her sides, her head propped on the pillow
        m.armL.rotation.x = m.armR.rotation.x = 0; m.head.rotation.set(0.3, 0, 0);
        break;
      case "food":
        if (t > 0.9 && t < 1.4) { m.armL.rotation.x = m.armR.rotation.x = -1.3; }   // reaching for it
        break;
      case "fountain":
        if (t > 0.3 && t < 2.6) { m.body.rotation.x = 0.75; m.head.rotation.x = 0.1; m.armL.rotation.x = m.armR.rotation.x = -0.6; }
        break;
      case "juke": m.armR.rotation.x = -1.25 + Math.sin(t * 18) * 0.06; m.body.rotation.x = 0.12; m.head.rotation.x = 0.15; break;
      case "stretch": {
        const k = Math.sin(s * 1.6);
        m.armL.rotation.x = m.armR.rotation.x = -2.9 + k * 0.08;
        m.armL.rotation.z = -0.25; m.armR.rotation.z = 0.25; m.body.rotation.z = k * 0.2;
        break;
      }
      case "vend":
        if (t < 0.7) { m.armR.rotation.x = -1.3; m.armR.rotation.z = 0.35; }          // coins in
        else if (t > 0.9 && t < 1.6) { m.body.rotation.x = 0.42; m.armR.rotation.x = -0.5; }   // down for it
        else if (t > 2.3 && ((t - 2.3) % 2.2) < 1.1) sip();
        break;
      case "tea":
        if (a.putting) { m.armR.rotation.x = -1.2; break; }
        if (t < 1.2) { m.armR.rotation.x = -1.25 + Math.sin(s * 6) * 0.08; m.armL.rotation.x = -0.9; }   // pouring
        else if (t > 1.9 && ((t - 1.9) % 2.0) < 1.0) sip();
        break;
      case "bin": m.armR.rotation.x = t < 0.25 ? -2.4 : -1.2; break;
      case "look":
        if (a.th.spin && t < 0.6) { m.armR.rotation.x = -1.3; m.armR.rotation.z = 0.2 - t * 0.5; m.head.rotation.x = 0.2; break; }   // a push
        m.armL.rotation.x = m.armR.rotation.x = 0.35;
        m.head.rotation.x = a.th.spin ? 0.2 : -0.1; m.head.rotation.y = Math.sin(s * 0.5) * 0.3;
        break;
      case "admire":
        m.armL.rotation.x = m.armR.rotation.x = -0.3;
        m.head.rotation.x = -0.12; m.head.rotation.y = Math.sin(s * 0.7) * 0.25;
        break;
      case "read": m.armL.rotation.x = m.armR.rotation.x = -0.5; m.head.rotation.x = -0.05; break;
    }
  }
  /** Carrying her drink: held in front of her, a sip now and then while she stands, steam
      off the tea; when it is finished, it is gone. */
  function heldPose(now, run, dt) {
    const m = player.m, h = held;
    if (h.kind === "tray") {                                      // carried level in both hands
      m.armL.rotation.x = m.armR.rotation.x = -1.0 + Math.sin(m.phase) * 0.04 * run;
      m.armL.rotation.z = 0.2; m.armR.rotation.z = -0.2;
      return;
    }
    if (!act && !run && now > h.nextSip) { h.sipUntil = now + 1100; h.nextSip = now + 5000 + Math.random() * 4000; }
    if (now < h.sipUntil && !run) { m.armR.rotation.x = -2.55; m.armR.rotation.z = 0.15; m.head.rotation.x = -0.18; }
    else { m.armR.rotation.x = -0.8 + m.armR.rotation.x * 0.15; m.armR.rotation.z = 0.12; }
    if (h.kind === "cup" && !h.cold && (h.steam -= dt) <= 0) {
      h.steam = 0.22;
      const p = worldOf(h.mesh);
      mote(p.x + (Math.random() - 0.5) * 0.04, p.y + 0.05, p.z + (Math.random() - 0.5) * 0.04, 0xffffff, 0.025, 1.2, 0.22);
    }
    if (now > h.until) dropHeld();
  }

  // ---------------------------------------------------------------- the player
  function goTo(id) {
    const p = room.places[id];
    if (!p) return;
    if (act) cancelAct();
    walkTo(p.x, p.z, id);
  }
  /** Set her off along a path to (x, z), and through the place `id` at the end of it, if any. */
  function walkTo(x, z, id) {
    const path = findPath(room, player.x, player.z, x, z);
    if (!path) return;
    clickGoal = { x, z, enter: id || null };
    player.path = path;
    player.last = { x: player.x, z: player.z, t: performance.now() };
  }

  /* ---- through a door
     Out: she turns to it, it swings open, she walks through and the camera comes down
     behind her, and the screen fades: then the next room, or the mode. In: she appears in
     the doorway of the room she has come to, walks in, the door shuts behind her and the
     camera lifts back to its place. A place without a door just fades. */
  const THROUGH = 2.2, DOORWAY = 1.9;
  function startSeq(id) {
    const p = room.places[id];
    if (!p || seq) return;
    const door = p.door ? room.doors[p.door] : null;
    seq = { kind: "out", id, p, door, phase: "turn", t: 0, cam: 0, fade: 0 };
    clickGoal = null; player.path = null; keys = {};
    if (door) door.target = 1;
  }
  function arriveSeq(id) {
    const p = room.places[id], door = p && p.door ? room.doors[p.door] : null;
    if (!door) { if (p) { player.x = p.x; player.z = p.z; player.yaw = p.face + PI; } return; }
    player.x = p.x + Math.sin(p.face) * DOORWAY; player.z = p.z + Math.cos(p.face) * DOORWAY;
    player.yaw = p.face + PI;
    player.path = [{ x: p.x, z: p.z }];
    door.open = door.target = 1; swingDoor(door, 0);
    seq = { kind: "in", id, p, door, t: 0, cam: 1, fade: 1 };
  }
  /** One frame of it; returns how much she is striding. */
  function updateSeq(dt) {
    const s = seq;
    if (s.done) return 0;
    s.t += dt;
    if (s.kind === "in") {
      s.fade = Math.max(0, s.fade - dt / 0.4);
      if (s.t > 0.2) s.cam = Math.max(0, s.cam - dt / 1.2);
      const at = follow(player, 2.2, dt);
      if (at && !s.shut) { s.shut = true; s.door.target = 0; }
      if (s.shut && s.cam === 0 && s.fade === 0) seq = null;
      return at ? 0 : 0.34;
    }
    const p = s.p, door = s.door;
    if (door) s.cam = Math.min(1, s.cam + dt / 1.1);
    if (s.phase === "turn") {
      player.yaw = turn(player.yaw, p.face, dt * 8);
      if (!door) { if (s.t > 0.25) { s.phase = "fade"; s.t = 0; } return 0; }
      if (door.open > 0.6 && s.t > 0.3) {
        s.phase = "through"; s.t = 0;
        player.path = [{ x: p.x + Math.sin(p.face) * THROUGH, z: p.z + Math.cos(p.face) * THROUGH }];
      }
      return 0;
    }
    if (s.phase === "through") {
      follow(player, 2.2, dt);
      if (s.t > 0.6) { s.phase = "fade"; s.t = 0; }
      return 0.34;
    }
    // fading out
    if (door) follow(player, 2.2, dt);
    s.fade = Math.min(1, s.fade + dt / 0.35);
    if (s.fade < 1) return door ? 0.34 : 0;
    if (p.room) {
      // (where she comes out may hang on where she was: back out of a dorm room, at its door)
      const arrive = typeof p.arrive === "function" ? p.arrive() : p.arrive;
      enterRoom(p.room, typeof p.v === "function" ? p.v() : p.v);
      seq = null;
      arriveSeq(arrive);
      return 0;
    }
    // a mode: the shell takes it from here, and she comes back out of this same door
    saved = { room: room.id, x: p.x, z: p.z, yaw: p.face + PI, via: door ? s.id : null, v: room.v };
    s.done = true;
    // a classroom's board starts its lesson; anywhere else, a mode
    if (p.lesson && opts && opts.onLesson) opts.onLesson(p.lesson);
    else if (opts && opts.onEnter) opts.onEnter(p.station || s.id);
    return 0;
  }

  function updatePlayer(dt, now, seqRun) {
    let run = 0;
    const stepping = keys.ArrowLeft || keys.KeyA || keys.ArrowRight || keys.KeyD || keys.ArrowUp || keys.KeyW || keys.ArrowDown || keys.KeyS ||
                     !!(stick && stick.on);
    if (seqRun !== null) {
      run = seqRun;
      if (run) player.m.phase += dt * (1.6 + 2.2 * 0.45) * PI * 2;
    } else if (act) {
      // a step away ends what she stays at (up off a seat first), or calls off the walk to it
      if (stepping) { if (act.phase === "go") cancelAct(); else if (act.phase === "do" && STAYS[act.kind]) endAct(); }
      if (act) {
        run = updateAct(dt, now);
        if (run) player.m.phase += dt * (1.6 + 2.8 * 0.45) * PI * 2;
      }
    }
    if (seqRun === null && !act) {
      let mx = 0, mz = 0;
      if (keys.ArrowLeft || keys.KeyA) mx -= 1;
      if (keys.ArrowRight || keys.KeyD) mx += 1;
      if (keys.ArrowUp || keys.KeyW) mz -= 1;
      if (keys.ArrowDown || keys.KeyS) mz += 1;
      let running = keys.ShiftLeft || keys.ShiftRight;
      if (stick && stick.on) {
        // the stick points on the screen; the floor's directions turn with the camera
        const sy = Math.sin(camYaw), cy = Math.cos(camYaw);
        mx = cy * stick.dx - sy * stick.dy; mz = sy * stick.dx + cy * stick.dy;
        running = stick.run;
      }
      if (mx || mz) {
        clickGoal = null; player.path = null;
        const l = Math.hypot(mx, mz), v = running ? 5.5 : 2.8;
        stepToward(player, player.x + mx / l * 2, player.z + mz / l * 2, v, dt, NAV_R);
        run = running ? 0.7 : 0.34;
        player.m.phase += dt * (1.6 + v * 0.45) * PI * 2;
      } else if (clickGoal) {
        const v = Math.hypot(clickGoal.x - player.x, clickGoal.z - player.z) > 6 ? 5 : 2.8;
        const arrived = follow(player, v, dt);
        run = v > 3 ? 0.65 : 0.34;
        player.m.phase += dt * (1.6 + v * 0.45) * PI * 2;
        if (now - player.last.t > 900) {
          if (Math.hypot(player.x - player.last.x, player.z - player.last.z) < 0.1 && !arrived) {
            // walled off from it: if it was a door, she is close enough to use it anyway
            const id = clickGoal.enter;
            clickGoal = null;
            if (id && Math.hypot(room.places[id].x - player.x, room.places[id].z - player.z) < 3) { startSeq(id); return; }
          }
          player.last = { x: player.x, z: player.z, t: now };
        }
        if (arrived && clickGoal) {
          const id = clickGoal.enter;
          clickGoal = null;
          if (id) { startSeq(id); return; }
        }
      }
    }
    // drawn where she is; on a seat, the perch carries her back onto it, as it does the others;
    // on a bed, it lays her back along it, her head on the pillow
    const k = ease(player.perch || 0), seat = act && act.th.seat, bed = act && act.kind === "nap" && act.th.bed;
    player.rx = player.x; player.rz = player.z;
    if (bed) {
      const lift = bed.y + 3.5 * player.m.rig.scale.x;
      player.m.root.position.set(lerp(player.x, bed.x, k), lift * k, lerp(player.z, bed.z, k));
      player.m.root.rotation.set(-PI / 2 * k, player.yaw, 0, "YXZ");
      player.rx = lerp(player.x, bed.x, k); player.rz = lerp(player.z, bed.z - 1.2, k);   // her bubble over her head
    } else {
      if (k > 0 && seat) { player.rx += (seat.x - player.x) * k; player.rz += (seat.z - player.z) * k; }
      player.m.root.position.set(player.rx, 0, player.rz);
      player.m.root.rotation.set(0, player.yaw, 0);
    }
    pose(player.m, run, now / 1000, {});
    if (k > 0 && !bed) {
      player.m.legL.rotation.x = player.m.legR.rotation.x = -1.45 * k;
      player.m.rig.position.y = player.m.sitLift * k;
      player.m.body.rotation.x -= 0.07 * k;
    }
    if (act) actPose(act, now);
    if (held && (!act || STAYS[act.kind] || held.kind === "tray")) heldPose(now, run, dt);
    ring.position.set(player.rx, 0.02, player.rz);
    ring.material.opacity = seq || act ? 0 : 0.55 + Math.sin(now / 300) * 0.25;

    // which place she is standing at, and which thing she is by; the nearer of the two is
    // what E does
    nearId = null; nearThing = null;
    if (seq || act) return;
    let best = 2.1;
    for (const id in room.places) {
      const p = room.places[id];
      if (p.station && !(opts.stations || {})[p.station]) continue;
      const d = Math.hypot(p.x - player.x, p.z - player.z);
      if (d < best) { best = d; nearId = id; }
    }
    let bestT = 1.4;
    for (const th of room.things) {
      spotOf(room, th);
      if (!usable(room, th)) continue;
      const d = Math.hypot(th.x - player.x, th.z - player.z);
      if (d < bestT) { bestT = d; nearThing = th; }
    }
    if (nearThing && nearId) { if (best < bestT) nearThing = null; else nearId = null; }
  }

  // ---------------------------------------------------------------- camera and overlay
  function project(x, y, z, w, h) {
    tmp.set(x, y, z).project(camera);
    return { x: (tmp.x * 0.5 + 0.5) * w, y: (-tmp.y * 0.5 + 0.5) * h, vis: tmp.z < 1 && tmp.z > -1 };
  }

  /* An upright phone sees a third of the width a monitor does at the same field of view:
     the hall was one door wide, and she walked out of the picture to either side. Under
     ASPECT the view widens a little (fov) and the camera stands back along its line of
     sight the rest of the way (camBack), until the room shows as much across as it would
     on a squarer screen. A desktop window never gets here. */
  const ASPECT = 0.95;
  let camBack = 1;
  function fitCamera() {
    const f = room.cam.fov, a = camera.aspect;
    let fov = f;
    camBack = 1;
    if (a < ASPECT) {
      const want = Math.tan(f * PI / 360) * ASPECT;              // tan of half the width it should see
      fov = Math.min(f * 1.3, 2 * Math.atan(want / a) * 180 / PI);
      camBack = Math.min(1.75, want / (Math.tan(fov * PI / 360) * a));
    }
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }

  function placeCamera(dt) {
    const cam = room.cam;
    const tx = clamp(player.x, cam.x[0], cam.x[1]), tz = clamp(player.z, cam.z[0], cam.z[1]);
    const T = cam.turn, side = T ? clamp((Math.abs(player.x) - T[0]) / (T[1] - T[0]), 0, 1) * Math.sign(player.x) * T[2] : 0;
    const k = snapCam ? 1 : 1 - Math.exp(-dt * 3.5);
    snapCam = false;
    camTarget.x += (tx - camTarget.x) * k; camTarget.z += (tz - camTarget.z) * k;
    camYaw += (side - camYaw) * k;
    const sy = Math.sin(camYaw), cy = Math.cos(camYaw);
    let lx = camTarget.x + sy * cam.la, ly = cam.ly, lz = camTarget.z - cy * cam.la;
    // back along the line from what it looks at (camBack, for a narrow screen); in a room with
    // a wall behind the camera (`wall`: its z) it climbs instead of backing through it, but
    // not so far that she is seen from overhead
    let hb = (cam.d + cam.la) * camBack, vb = (cam.h - cam.ly) * camBack;
    if (cam.wall) {
      const fit = Math.max((cam.wall - lz) / Math.max(cy, 0.2), cam.d + cam.la);
      if (hb > fit) { vb = Math.min(Math.sqrt(hb * hb + vb * vb - fit * fit), fit * 0.7); hb = fit; }
    }
    let px = lx - sy * hb, py = ly + vb, pz = lz + cy * hb;
    // through a door, the camera comes down in front of it
    if (seq && seq.door && seq.cam > 0) {
      const d = seq.door, e = ease(seq.cam), fx = Math.sin(d.yaw), fz = Math.cos(d.yaw);
      px = lerp(px, d.x + fx * 5.2, e); py = lerp(py, 2.5, e); pz = lerp(pz, d.z + fz * 5.2, e);
      lx = lerp(lx, d.x, e); ly = lerp(ly, 1.5, e); lz = lerp(lz, d.z, e);
    }
    camera.position.set(px, py, pz);
    camera.lookAt(lx, ly, lz);
  }

  /** Everyone's moves for one frame; false if the lobby closed under it (a door into a mode). */
  function step(dt, now) {
    const seqRun = seq ? updateSeq(dt) : null;
    if (!host || !player) return false;
    updatePlayer(dt, now, seqRun);
    // the rooms as the hour has them (routines): the one she is in, and the hall through its window
    if (academy.length && now > syncAt) {
      syncAt = now + 1000;
      syncRoom(room, now);
      if (room !== ROOMS.hall) syncRoom(ROOMS.hall, now);
    }
    for (const k in crowds) for (const n of crowds[k]) updateNpc(n, dt, now);
    // whoever has gone out of a door is gone
    for (const k in crowds) {
      const c = crowds[k];
      for (let i = c.length - 1; i >= 0; i--) if (c[i].out) { dropNpc(c[i]); c.splice(i, 1); }
    }
    // a door somebody is going through stays open for them, and shuts after
    for (const k in room.doors) {
      const d = room.doors[k];
      if (d.npcUntil) {
        if (now < d.npcUntil) d.target = 1;
        else { d.npcUntil = 0; if (!seq || seq.door !== d) d.target = 0; }
      }
    }
    for (const k in room.doors) swingDoor(room.doors[k], dt);
    updateMotes(dt);
    updateFeast(dt);
    jukeNotes(dt);
    return true;
  }
  /** While the jukebox is playing her pick, little lights rise off its dome, the colours of its tubes. */
  let noteT = 0;
  function jukeNotes(dt) {
    if (room !== ROOMS.hall || !root.Sound || Sound.current !== "jukebox" || (noteT -= dt) > 0) return;
    noteT = 0.28 + Math.random() * 0.3;
    mote(13 + (Math.random() - 0.5) * 1.1, 1.9, -9.95, [0xff5a3a, 0xffa030, 0xffe070, 0x6ad0ff][Math.floor(Math.random() * 4)],
         0.11, 2.6, 0.5);
  }
  /** Oguri's bowls: while somebody is eating at her place, another empty one joins the
      towers every few seconds; when the place is empty again, they are cleared away. */
  function updateFeast(dt) {
    const R = ROOMS.cafe, f = R.feast;
    if (!f || !R.taken) return;
    const who = R.taken.get("p" + f.i);
    const eating = who === player ? !!(act && act.eating != null && !act.ate) : !!(who && who.perch === 1 && who.act === "eat");
    if (eating) f.t += dt; else if (!who) f.t = Math.max(0, f.t - dt * 8);
    const n = Math.min(f.bowls.length, Math.floor(f.t / 3));
    for (let i = 0; i < f.bowls.length; i++) f.bowls[i].visible = i < n;
  }
  /** For checking from the console: run the lobby `secs` forward without waiting on frames. */
  function tick(secs) {
    let t = performance.now();
    for (let s = 0; s < secs && host; s += 0.05) { t += 50; step(0.05, t); }
  }

  /** A sign's (or the hint's) box on screen, from where it is pinned: the bottom centre.
      Measured once per look (`key`), since a sign grows its E key when she is near. */
  function boxOf(o, s, key) {
    const sz = o.sz || (o.sz = {});
    const z = sz[key] || { w: o.el.offsetWidth, h: o.el.offsetHeight };
    if (z.w) sz[key] = z;                                 // not laid out yet: measure again next frame
    return { x: s.x, y: s.y, w: z.w, h: z.h };
  }
  /** Where a bubble's bottom goes so it covers none of `blocks`: as it is if it is clear,
      else just over the one it hits (under it, if there is no room above). Both carry a
      6px tail below the box. Two passes, for a bubble moved up into the next one. */
  function clearOf(o, s, blocks) {
    if (!blocks.length) return s.y;
    const z = o.bsz || { w: o.bubble.offsetWidth, h: o.bubble.offsetHeight };
    if (z.w) o.bsz = z;
    let y = s.y;
    for (let pass = 0; pass < 2; pass++) {
      let moved = false;
      for (const b of blocks) {
        if (Math.abs(s.x - b.x) * 2 >= z.w + b.w) continue;
        if (y + 6 <= b.y - b.h || y - z.h >= b.y + 6) continue;
        const up = b.y - b.h - 8;
        y = up - z.h >= safeTop ? up : b.y + 8 + z.h;
        moved = true;
      }
      if (!moved) break;
    }
    return y;
  }

  function frame(now) {
    if (!host) return;
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    const sz = renderer.getSize(new THREE.Vector2());
    if (sz.x !== w || sz.y !== h) { renderer.setSize(w, h, false); camera.aspect = w / h; fitCamera(); safeTop = -1; sizePortals(); }
    govern(dt);
    // the strip along the top (resources, sign out) is the shell's; the signs keep below it
    if (safeTop < 0) safeTop = opts.safeTop ? Math.max(0, opts.safeTop() - host.getBoundingClientRect().top) : 0;

    if (!step(dt, now)) return;                           // the shell has moved on
    daylight();
    placeCamera(dt);
    camera.updateMatrixWorld();
    // the other room, through the window, from where the camera now is
    paintWindow();
    renderer.render(scene, camera);

    fadeEl.style.opacity = seq ? seq.fade.toFixed(3) : "0";
    tagsEl.classList.toggle("busy", !!seq);
    for (const t of tags) {
      const s = project(t.p.ax, t.p.ay, t.p.az, w, h);
      s.y = Math.max(s.y, safeTop + (t.h || (t.h = t.el.offsetHeight)) + 14);
      t.el.style.transform = `translate(${s.x.toFixed(1)}px,${s.y.toFixed(1)}px) translate(-50%,-100%)`;
      t.el.hidden = !s.vis;
      t.el.classList.toggle("near", nearId === t.id);
      t.s = s;
    }
    // the hint: for the thing she is by, or for getting up from what she stays at
    // (getting up is pinned above the dock rather than over her head, where it would sit on
    // top of what she says and of the thing she is looking at)
    let hint = null;
    const staying = !seq && act && act.phase === "do" && STAYS[act.kind];
    if (staying) hint = { pinned: true, text: act.kind === "sit" || act.kind === "nap" ? "Get up" : "Done" };
    else if (!seq && !act && nearThing) hint = { x: nearThing.ax, y: nearThing.ay, z: nearThing.az, text: labelOf(nearThing) };
    hintEl.hidden = !hint;
    hintEl.classList.toggle("pinned", !!(hint && hint.pinned));
    if (hint) {
      if (hintEl.dataset.text !== hint.text) { hintEl.dataset.text = hint.text; hintEl.querySelector("b").textContent = hint.text; }
      if (hint.pinned) hintEl.style.transform = "";
      else {
        const s = project(hint.x, hint.y, hint.z, w, h);
        hintEl.style.transform = `translate(${s.x.toFixed(1)}px,${s.y.toFixed(1)}px) translate(-50%,-100%)`;
        hintBox.s = s;
      }
    }
    /* What someone says has to stay readable: the recruiter at the scout table talked
       straight into the table's own sign. A bubble that would land on a sign or the hint
       moves clear of it -- see clearOf. Signs are only measured while someone is talking. */
    const blocks = [];
    if (!player.bubble.hidden || npcs.some(n => !n.bubble.hidden)) {
      for (const t of tags) if (!t.el.hidden) blocks.push(boxOf(t, t.s, t.el.classList.contains("near") ? "near" : "far"));
      if (hint && !hint.pinned) blocks.push(boxOf(hintBox, hintBox.s, hint.text));
    }
    for (const n of npcs) {
      if (n.bubble.hidden) continue;
      const s = project(n.rx, 2.35 - 0.4 * n.perch, n.rz, w, h);
      s.y = clearOf(n, s, blocks);
      n.bubble.style.transform = `translate(${s.x.toFixed(1)}px,${s.y.toFixed(1)}px) translate(-50%,-100%)`;
    }
    if (!player.bubble.hidden) {
      if (now > player.bubbleUntil) player.bubble.hidden = true;
      const s = project(player.rx, 2.35 - 0.4 * player.perch, player.rz, w, h);
      s.y = clearOf(player, s, blocks);
      player.bubble.style.transform = `translate(${s.x.toFixed(1)}px,${s.y.toFixed(1)}px) translate(-50%,-100%)`;
    }
  }

  // ---------------------------------------------------------------- input
  const typing = e => /INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || "") ||
                      !!document.querySelector("#ask.on");
  function onKey(e) {
    if (!host || typing(e) || seq) return;
    const MOVE = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyW", "KeyA", "KeyS", "KeyD", "ShiftLeft", "ShiftRight"];
    if (e.type === "keydown" && (e.code === "KeyE" || e.code === "Enter" || e.code === "Space")) {
      if (!e.repeat && pressE()) e.preventDefault();
      return;
    }
    if (MOVE.indexOf(e.code) >= 0) {
      keys[e.code] = e.type === "keydown";
      if (e.code.indexOf("Arrow") === 0) e.preventDefault();
    }
  }
  function onBlur() { keys = {}; endPress(); }

  /* The mouse and a finger alike. A press that lets go where it began is a tap: go there, or
     to the door, the thing or the racer under it. A press that travels is a thumb stick: it
     appears where the press began and steers her the way it points, she runs once it is
     pushed to its rim, and the rim follows the thumb, so a long drag never runs out of room.
     Taps are taken on release, so steering never also sends her off somewhere. */
  const STICK_R = 56, DRAG_PX = 10;
  let press = null, stick = null, stickEl = null, tapEl = null;
  function onDown(e) {
    if (!host || seq || press || (e.pointerType === "mouse" && e.button > 0)) return;
    press = { id: e.pointerId, x0: e.clientX, y0: e.clientY, bx: e.clientX, by: e.clientY, touch: e.pointerType !== "mouse", drag: false };
    try { renderer.domElement.setPointerCapture(e.pointerId); } catch (err) { /* not capturable: moves still arrive */ }
  }
  function onMove(e) {
    if (!press || e.pointerId !== press.id) return;
    if (!press.drag) {
      if (Math.hypot(e.clientX - press.x0, e.clientY - press.y0) < DRAG_PX || seq) return;
      press.drag = true;
      stick = { on: false, dx: 0, dy: 0, run: false };
    }
    let dx = e.clientX - press.bx, dy = e.clientY - press.by;
    const d = Math.hypot(dx, dy);
    if (d > STICK_R) {                                             // the rim follows the thumb
      press.bx = e.clientX - dx / d * STICK_R; press.by = e.clientY - dy / d * STICK_R;
      dx = e.clientX - press.bx; dy = e.clientY - press.by;
    }
    const m = Math.min(d, STICK_R) / STICK_R;
    stick.on = m > 0.15;
    stick.dx = dx / (d || 1); stick.dy = dy / (d || 1);
    stick.run = stick.run ? m > 0.8 : m > 0.95;                    // a little give, so it does not flicker
    drawStick(dx, dy);
  }
  function onUp(e) {
    if (!press || e.pointerId !== press.id) return;
    const p = press;
    endPress();
    if (e.type === "pointerup" && !p.drag) onTap(p.x0, p.y0, p.touch);
  }
  function endPress() {
    press = null; stick = null;
    if (stickEl) stickEl.hidden = true;
  }
  function drawStick(dx, dy) {
    if (!stickEl) {
      stickEl = document.createElement("div");
      stickEl.className = "lb-stick"; stickEl.innerHTML = "<i></i>";
      host.appendChild(stickEl);
    }
    const r = host.getBoundingClientRect();
    stickEl.hidden = false;
    stickEl.classList.toggle("run", stick.run);
    stickEl.style.transform = `translate(${(press.bx - r.left).toFixed(1)}px,${(press.by - r.top).toFixed(1)}px)`;
    stickEl.firstChild.style.transform = `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px)`;
  }
  /** A gold ring where a tap sent her, so a finger that covers the spot still sees it land. */
  function tapMark(x, y) {
    if (!tapEl) {
      tapEl = document.createElement("div");
      tapEl.className = "lb-tap";
      host.appendChild(tapEl);
    }
    const r = host.getBoundingClientRect();
    tapEl.style.left = (x - r.left).toFixed(1) + "px"; tapEl.style.top = (y - r.top).toFixed(1) + "px";
    tapEl.classList.remove("on"); void tapEl.offsetWidth; tapEl.classList.add("on");
  }

  function onTap(x, y, touch) {
    if (!host || seq) return;
    if (act) {
      if (act.phase === "go") cancelAct();
      else { if (act.phase === "do" && STAYS[act.kind]) endAct(); return; }
    }
    // a fingertip covers more than a cursor does: on a touch screen everything is easier to hit
    const loose = touch ? 1.35 : 1;
    const r = renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    // a racer first: clicking one has her say something
    let hitN = null, bestD = Infinity;
    for (const n of npcs) {
      tmp.set(n.rx, 1.1, n.rz);
      const d = ray.ray.distanceToPoint(tmp);
      const along = tmp.clone().sub(ray.ray.origin).dot(ray.ray.direction);
      if (d < (touch ? 0.75 : 0.6) && along < bestD) { bestD = along; hitN = n; }
    }
    if (hitN) {
      sayLine(hitN);
      if ((hitN.state === "stay" || hitN.state === "idle") && hitN.perch === 0) hitN.yaw = Math.atan2(player.x - hitN.x, player.z - hitN.z);
      return;
    }
    const p = ray.ray.intersectPlane(PLANE, new THREE.Vector3());
    if (!p) return;
    // a click on a thing (a bench, the machine...) means "go and do it"
    for (const th of room.things) {
      spotOf(room, th);
      if (usable(room, th) && (Math.hypot(th.ax - p.x, th.az - p.z) < 0.9 * loose || Math.hypot(th.x - p.x, th.z - p.z) < 0.5 * loose)) return startThing(th);
    }
    // a click on a door, anywhere up it (the floor behind it is not what was meant), or on
    // the floor by one, means "go in there"
    const toFloor = ray.ray.origin.distanceTo(p);
    for (const id in room.places) {
      const pl = room.places[id];
      if (pl.station && !(opts.stations || {})[pl.station]) continue;
      if (pl.ax == null) continue;
      const top = new THREE.Vector3(pl.ax, Math.max(1, Math.min(pl.ay - 0.6, 3)), pl.az), on = new THREE.Vector3();
      const d2 = ray.ray.distanceSqToSegment(tmp.set(pl.ax, 0.2, pl.az), top, on);
      if (d2 < (0.9 * loose) ** 2 && ray.ray.origin.distanceTo(on) < toFloor + 0.5) return goTo(id);
    }
    for (const id in room.places) {
      const pl = room.places[id];
      if (pl.station && !(opts.stations || {})[pl.station]) continue;
      if (Math.hypot(pl.x - p.x, pl.z - p.z) < 1.4 * loose) return goTo(id);
    }
    // anywhere else on the floor: there, or as near it as she can stand
    const c = nearestOpen(room, p.x, p.z);
    if (c >= 0) {
      const ox = cellX(room, c % room.nav.nx), oz = cellZ(room, (c / room.nav.nx) | 0);
      if (walkable(p.x, p.z, NAV_R)) { walkTo(p.x, p.z); tapMark(x, y); }
      else if (Math.hypot(ox - p.x, oz - p.z) < 2.5 * loose) { walkTo(ox, oz); tapMark(x, y); }
    }
  }

  // ---------------------------------------------------------------- lifetime
  function start(el, o) {
    stop();
    if (!ensure()) return false;
    host = el; opts = o || {}; tagsEl = opts.tags || el; safeTop = -1;
    const me = opts.me;
    if (!me) { host = null; return false; }
    el.insertBefore(renderer.domElement, el.firstChild);
    fadeEl = document.createElement("div");
    fadeEl.className = "lobby-fade";
    el.appendChild(fadeEl);
    const others = list => (list || []).filter(d => d.id !== me.id);
    casts.hall = others(opts.cast);
    casts.office = others(opts.office).slice(0, 3);
    casts.cafe = others(opts.cafe); casts.dorm = others(opts.corridor); casts.home = others(opts.home);
    casts.school = others(opts.school); casts.classes = others(opts.classes); casts.track = others(opts.track);
    casts.library = others(opts.library);
    academy = root.Routines ? others(opts.academy) : [];      // who is where is then down to the hour
    LESSONS =opts.lessons && opts.lessons.length ? opts.lessons.slice(0, 7) : LESSONS_PLAIN;
    room = ROOMS[saved.room] || ROOMS.hall;
    // the hall and the office have their company from the start (the window shows the one she
    // is not in); the others when she first goes in
    for (const k in ROOMS) { ROOMS[k].taken = new Map(); ROOMS[k].peopled = false; crowds[k] = []; }
    people(ROOMS.hall); people(ROOMS.office);
    npcs = crowds[room.id];
    skyAt(hourNow());
    enterRoom(room.id, saved.v);
    // the academy's clock: the hour and what part of the day it is
    clockEl = document.createElement("div");
    clockEl.className = "lb-clock";
    clockEl.innerHTML = `<span class="ci"></span><span><b></b><i></i></span>`;
    tagsEl.appendChild(clockEl);
    player = { def: me, m: racerFor(me), x: saved.x, z: saved.z, yaw: saved.yaw, path: null, last: { x: saved.x, z: saved.z, t: 0 },
               perch: 0, rx: saved.x, rz: saved.z, bubble: null, bubbleUntil: 0 };
    scene.add(ring);
    // her own bubble, and the hint for the thing she is by
    player.bubble = document.createElement("div");
    player.bubble.className = "lb-bub me"; player.bubble.hidden = true;
    tagsEl.appendChild(player.bubble);
    hintEl = document.createElement("button");
    hintEl.className = "lb-tag lb-hint"; hintEl.hidden = true; hintBox.el = hintEl;
    hintEl.innerHTML = `<kbd>E</kbd><span><b></b></span>`;
    hintEl.onclick = e => { e.stopPropagation(); pressE(); };
    tagsEl.appendChild(hintEl);
    // back from a mode: out of the door she went in by
    if (saved.via && room.places[saved.via]) arriveSeq(saved.via);
    else if (!walkable(player.x, player.z, NAV_R)) { player.x = room.spawn.x; player.z = room.spawn.z; player.yaw = room.spawn.yaw; }
    saved.via = null;
    camTarget.set(player.x, 0, player.z); camYaw = 0; snapCam = true;
    last = 0;
    addEventListener("keydown", onKey); addEventListener("keyup", onKey); addEventListener("blur", onBlur);
    const cv = renderer.domElement;
    cv.addEventListener("pointerdown", onDown); cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerup", onUp); cv.addEventListener("pointercancel", onUp);
    raf = requestAnimationFrame(frame);
    return true;
  }

  /** Walk as someone else: she takes over where the last one was standing. If she was one
      of the others in the room, they swap places, and the last one stays in the building. */
  function setPlayer(def) {
    if (!player || !def || def.id === player.def.id || seq) return false;
    cancelAct(); dropHeld();
    scene.remove(player.m.root);
    const was = player.def;
    let at = null;
    for (const k in crowds) {
      const i = crowds[k].findIndex(n => n.def.id === def.id);
      if (i < 0) continue;
      const n = crowds[k][i];
      if (n.R === room) at = { x: n.x, z: n.z, yaw: n.yaw };
      dropNpc(n);
      crowds[k].splice(i, 1);
    }
    for (const k in casts) casts[k] = casts[k].filter(d => d.id !== def.id);
    // with routines, the one she was keeps her own hours from here on
    if (academy.length) { academy = academy.filter(d => d.id !== def.id); if (!was.trainer) academy.push(was); planKey = ""; }
    // the one she was goes home: the trainer to the office, a racer to the hall
    const into = was.trainer ? "office" : "hall";
    if (!casts[into].some(d => d.id === was.id)) casts[into].push(was);
    if (!crowds[into].some(n => n.def.id === was.id)) {
      const n = makeNpc(was, ROOMS[into]);
      if (at && into === room.id) { n.x = n.rx = at.x; n.z = n.rz = at.z; n.yaw = at.yaw; }
      crowds[into].push(n);
    }
    player.def = def;
    player.m = racerFor(def);
    if (opts) opts.me = def;
    return true;
  }

  function stop() {
    // however she leaves (the dock, a key), she is back where she stood; through a door,
    // updateSeq has already said where
    if (player && room && !(seq && seq.done)) saved = { room: room.id, x: player.x, z: player.z, yaw: player.yaw, via: null, v: room.v };
    if (player && room) cancelAct();
    act = null; held = null; nearThing = null; hintEl = null; clockEl = null;
    if (scene) clearMotes();
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    removeEventListener("keydown", onKey); removeEventListener("keyup", onKey); removeEventListener("blur", onBlur);
    if (renderer) {
      const cv = renderer.domElement;
      cv.removeEventListener("pointerdown", onDown); cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerup", onUp); cv.removeEventListener("pointercancel", onUp);
    }
    endPress();
    if (stickEl) { stickEl.remove(); stickEl = null; }
    if (tapEl) { tapEl.remove(); tapEl = null; }
    for (const k in crowds) { for (const n of crowds[k]) dropNpc(n); crowds[k] = []; ROOMS[k].peopled = false; }
    npcs = crowds.hall;
    if (scene && player) scene.remove(player.m.root);
    if (fadeEl) { fadeEl.remove(); fadeEl = null; }
    player = null; host = null; keys = {}; clickGoal = null; nearId = null; seq = null; room = null;
    if (tagsEl) { tagsEl.innerHTML = ""; tagsEl.classList.remove("busy"); }
    tags = []; tagsEl = null;
  }

  root.Lobby = { ok: true, start, stop, setPlayer, residents: RESIDENTS, get running() { return !!host; },
                 get player() { return player ? player.def : null; },
                 get room() { return room ? room.id : null; },
                 /* exposed for checking it from the console */
                 _debug: { get player() { return player; }, get npcs() { return npcs; }, get room() { return room; },
                           get seq() { return seq; }, get act() { return act; }, get held() { return held; }, get camera() { return camera; },
                           get hour() { return hourNow(); }, setHour: h => { clockShift += ((h - hourNow()) % 24) * GAME_HOUR; },
                           get nearThing() { return nearThing; }, get academy() { return academy; }, whereNow, dueIn, syncRoom, startThing, pressE, tick, crowds, ROOMS, walkable, makeNpc, walkTo, startSeq, enterRoom, casts,
                           findPath: (sx, sz, gx, gz) => findPath(room, sx, sz, gx, gz) } };
})(typeof globalThis !== "undefined" ? globalThis : this);
