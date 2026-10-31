/*
 * The race, in voxels.
 *
 * Replaces the flat side-on canvas with a Three.js scene built the way the earlier voxel
 * games were (Pallet Town Voxel): a sparse voxel grid, a face-culled mesher with baked
 * ambient occlusion, Lambert-lit vertex colours and one shadow-casting sun.
 *
 * Nothing here knows the rules. It reads the same sim state the 2D view read -- pos,
 * lane, v, hp, buffs -- and turns it into a place: a left-handed oval with a turf course
 * outside a dirt one, a grandstand along the home straight that gets louder in the final
 * phase, and the field itself, every racer built from her own palette in LOOKS.
 * index.html still draws nameplates and callouts on its own canvas over this one, at the
 * screen points project() hands it.
 *
 * Units are metres. A racer's `pos` is metres run, so it maps straight onto distance
 * along the rail.
 */
(function (root) {
  "use strict";
  const THREE = root.THREE;
  /* three.js comes from a CDN. Offline, the race falls back to the 2D view rather than
     failing to start -- index.html checks `Voxel.ok`. */
  if (!THREE) { root.Voxel = { ok: false }; return; }

  // ---------------------------------------------------------------- small helpers
  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  const cl = v => v < 0 ? 0 : v > 255 ? 255 : v | 0;
  const mulC = (c, f) => (cl(((c >> 16) & 255) * f) << 16) | (cl(((c >> 8) & 255) * f) << 8) | cl((c & 255) * f);
  const mixC = (a, b, t) =>
    (cl(((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * t) << 16) |
    (cl(((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * t) << 8) |
    cl((a & 255) + ((b & 255) - (a & 255)) * t);
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }
  /** Shade a colour by a small amount of per-voxel noise, so a surface reads as blocks. */
  const jit = (c, rnd, amt) => mulC(c, 1 - amt + rnd() * amt * 2);

  // ---------------------------------------------------------------- voxels
  /* Sparse grid + face-culled mesher with baked AO -- the same one Pallet Town Voxel uses,
     so a racer here is built exactly the way a townsperson there is. */
  class Vox {
    constructor() { this.m = new Map(); }
    static k(x, y, z) { return ((x + 512) * 1024 + (y + 512)) * 1024 + (z + 512); }
    set(x, y, z, c) { const k = Vox.k(x, y, z); if (c == null) this.m.delete(k); else this.m.set(k, c); }
    has(x, y, z) { return this.m.has(Vox.k(x, y, z)); }
    get(x, y, z) { return this.m.get(Vox.k(x, y, z)); }
    box(x0, y0, z0, x1, y1, z1, c) {
      const f = typeof c === "function";
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++)
        this.set(x, y, z, f ? c(x, y, z) : c);
    }
    each(fn) {
      for (const [k, c] of this.m) {
        const z = k % 1024 - 512, y = Math.floor(k / 1024) % 1024 - 512, x = Math.floor(k / 1048576) - 512;
        fn(x, y, z, c);
      }
    }
  }
  const AOF = [0.52, 0.7, 0.85, 1];
  const CWC = [[0, 0], [1, 0], [1, 1], [0, 1]], CCWC = [[0, 0], [0, 1], [1, 1], [1, 0]];
  /* `keep(x, y, z, nx, ny, nz)`, if given, may drop exposed faces nobody will ever see --
     the underside of a floor, the outside of a room's walls. */
  function meshVox(v, scale, keep) {
    const pos = [], nor = [], col = [], idx = [];
    let vi = 0;
    const P = [0, 0, 0], L = [0, 0, 0], ao = [0, 0, 0, 0];
    v.each((x, y, z, c) => {
      const r = ((c >> 16) & 255) / 255, g = ((c >> 8) & 255) / 255, b = (c & 255) / 255;
      for (let d = 0; d < 3; d++) for (let s = -1; s <= 1; s += 2) {
        const nx = d === 0 ? s : 0, ny = d === 1 ? s : 0, nz = d === 2 ? s : 0;
        if (v.has(x + nx, y + ny, z + nz)) continue;
        if (keep && !keep(x, y, z, nx, ny, nz)) continue;
        const u = (d + 1) % 3, w = (d + 2) % 3, C = s > 0 ? CWC : CCWC;
        L[0] = x + nx; L[1] = y + ny; L[2] = z + nz;
        for (let i = 0; i < 4; i++) {
          const cu = C[i][0], cw = C[i][1];
          P[0] = x; P[1] = y; P[2] = z; if (s > 0) P[d] += 1; P[u] += cu; P[w] += cw;
          pos.push(P[0], P[1], P[2]); nor.push(nx, ny, nz);
          const su = cu ? 1 : -1, sw = cw ? 1 : -1;
          L[u] += su; const s1 = v.has(L[0], L[1], L[2]) ? 1 : 0;
          L[w] += sw; const s3 = v.has(L[0], L[1], L[2]) ? 1 : 0;
          L[u] -= su; const s2 = v.has(L[0], L[1], L[2]) ? 1 : 0;
          L[w] -= sw;
          const a = (s1 && s2) ? 0 : 3 - (s1 + s2 + s3); ao[i] = a; const f = AOF[a];
          col.push(r * f, g * f, b * f);
        }
        if (ao[0] + ao[2] >= ao[1] + ao[3]) idx.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3);
        else idx.push(vi + 1, vi + 2, vi + 3, vi + 1, vi + 3, vi);
        vi += 4;
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex(idx);
    if (scale && scale !== 1) geo.scale(scale, scale, scale);
    geo.computeBoundingSphere();
    return geo;
  }

  /** Axis-aligned boxes with flat vertex colours: rails, gates, frames -- props too long
      and thin to be worth a voxel grid, but still blocks. Each entry [x0,y0,z0,x1,y1,z1,c]. */
  function boxGeo(list) {
    const pos = [], nor = [], col = [], idx = [];
    let vi = 0;
    const F = [
      [[1, 0, 0], [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]]],
      [[-1, 0, 0], [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]]],
      [[0, 1, 0], [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]]],
      [[0, -1, 0], [[0, 0, 1], [0, 0, 0], [1, 0, 0], [1, 0, 1]]],
      [[0, 0, 1], [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]]],
      [[0, 0, -1], [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]]],
    ];
    for (const [x0, y0, z0, x1, y1, z1, c] of list) {
      const r = ((c >> 16) & 255) / 255, g = ((c >> 8) & 255) / 255, b = (c & 255) / 255;
      for (const [n, q] of F) {
        const shade = n[1] > 0 ? 1 : n[1] < 0 ? 0.6 : (n[0] ? 0.86 : 0.93);
        for (const [a, bb, cc] of q) {
          pos.push(a ? x1 : x0, bb ? y1 : y0, cc ? z1 : z0); nor.push(n[0], n[1], n[2]);
          col.push(r * shade, g * shade, b * shade);
        }
        idx.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3);
        vi += 4;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeBoundingSphere();
    return geo;
  }

  // ---------------------------------------------------------------- the course
  /* One racecourse for every race: a left-handed oval about Tokyo's size, the turf course
     outside and the dirt course inside it. The finish is fixed on the home straight in
     front of the stands, and each race starts `distance` metres back from it -- so a
     2400m race passes the post once, the way the real one does. */
  const STRAIGHT = 520;
  const TURF = { R: 150, W: 22 };
  const DIRT = { R: 122, W: 20 };
  const LANE_W = 1.35, LANE0 = 1.2;
  const FINISH_S = STRAIGHT * 0.8;                 // metres into the home straight
  const HALF = STRAIGHT / 2;
  const FINISH_X = -HALF + FINISH_S;
  const STAND = { x0: -210, x1: 250, z: TURF.R + TURF.W + 14, depth: 34 };

  function makePath(R) {
    const PI = Math.PI, L = 2 * STRAIGHT + 2 * PI * R;
    function at(s, off, out) {
      s = ((s % L) + L) % L;
      let x, z, tx, tz, nx, nz;
      if (s < STRAIGHT) { x = -HALF + s; z = R; tx = 1; tz = 0; nx = 0; nz = 1; }
      else if (s < STRAIGHT + PI * R) {
        const a = (s - STRAIGHT) / R, sa = Math.sin(a), ca = Math.cos(a);
        x = HALF + R * sa; z = R * ca; tx = ca; tz = -sa; nx = sa; nz = ca;
      } else if (s < 2 * STRAIGHT + PI * R) {
        const u = s - STRAIGHT - PI * R;
        x = HALF - u; z = -R; tx = -1; tz = 0; nx = 0; nz = -1;
      } else {
        const a = (s - 2 * STRAIGHT - PI * R) / R, sa = Math.sin(a), ca = Math.cos(a);
        x = -HALF - R * sa; z = -R * ca; tx = -ca; tz = sa; nx = -sa; nz = -ca;
      }
      out = out || {};
      out.x = x + nx * off; out.z = z + nz * off;
      out.tx = tx; out.tz = tz; out.nx = nx; out.nz = nz;
      return out;
    }
    return { R, L, at };
  }
  const PATHS = { turf: makePath(TURF.R), dirt: makePath(DIRT.R) };
  const yawOf = p => Math.atan2(p.tx, p.tz);

  /** Signed distance outward from a rail of radius R (the oval is a stadium shape). */
  const railDist = (x, z, R) => Math.hypot(x - clamp(x, -HALF, HALF), z) - R;
  /** Arc position along the turf rail for any ground point, for mowing stripes. */
  function arcOf(x, z) {
    const R = TURF.R;
    if (x >= -HALF && x <= HALF) return z > 0 ? x + HALF : STRAIGHT + Math.PI * R + (HALF - x);
    if (x > HALF) return STRAIGHT + R * Math.atan2(x - HALF, z);
    return 2 * STRAIGHT + Math.PI * R + R * Math.atan2(-(x + HALF), -z);
  }
  const POND = { x: -95, z: -12, rx: 72, rz: 40 };

  // ---------------------------------------------------------------- racer looks
  /* Every Global-launch racer's signature racing outfit, as voxel colours. Matched by eye
     against the portraits in Racers/ -- small 2x2 eyes and a dozen colours each, so the
     point is that you can tell Suzuka from Teio at fifty metres, not a costume study.
       hair/style/len : hair colour, cut, and how far it hangs below the head (voxels)
       eyes, streak   : iris colour; a white forelock streak if she has one
       top/trim/tie   : jacket, its trim, the bow or tie at the throat
       skirt/hem/cut  : "flare" | "skirt" | "shorts"
       legs/legWear   : stocking colour and "thigh" | "tights" | "bare" | "boots"
       shoes, sleeve  : "long" | "short" | "coat"
     plus the odd accessory -- ear covers, hat, crown, tiara, mask, cape, scarf, bow. */
  const LOOKS = {
    "Special Week":   { hair: 0x4a2c22, streak: 0xf6f2ee, style: "long", len: 4, eyes: 0x8a5ad0,
      top: 0xf6f4f8, trim: 0x9a50c8, tie: 0xe05aa0, skirt: 0xa45ad4, hem: 0xf6f4f8, cut: "flare",
      legs: 0xf6f6fa, legWear: "thigh", shoes: 0x8a4ac0, sleeve: "short" },
    "Silence Suzuka": { hair: 0xd2683a, style: "long", len: 10, eyes: 0x3aa070, ear: 0x3a9a5a,
      headband: 0xf6f6f2, top: 0x3a9a52, trim: 0xf2f2ee, tie: 0x2a2a3a, skirt: 0xf2f2ee, hem: 0x3a9a52,
      cut: "skirt", legs: 0x3a3448, legWear: "tights", shoes: 0x3a3a46, sleeve: "long" },
    "Tokai Teio":     { hair: 0x7a3a26, streak: 0xf6f2ee, style: "ponytail", len: 11, eyes: 0x3a7ad8,
      top: 0xf6f6fa, trim: 0x2a4ab8, tie: 0xf070a8, skirt: 0x2a5ad0, hem: 0xf6f6fa, cut: "flare",
      legs: 0xf2f2f8, legWear: "boots", shoes: 0xe8eefa, sleeve: "long", shoulder: 0xe0b848 },
    "Maruzensky":     { hair: 0x8a3e2a, style: "wavy", len: 11, eyes: 0x5a7ac8, bow: 0x2aa8a0,
      top: 0xd0302a, trim: 0xf2d070, tie: 0xf6f0e8, skirt: 0xd85a2a, hem: 0x8a1a1a, cut: "skirt",
      legs: 0xd8402a, legWear: "thigh", shoes: 0x7a2a1a, sleeve: "long" },
    "Oguri Cap":      { hair: 0xd2d2da, style: "long", len: 11, eyes: 0x5a6ab8, ear: 0xc8a850,
      top: 0xf4f4f6, trim: 0x2a3060, tie: 0xd0303a, skirt: 0x283058, hem: 0x283058, cut: "skirt",
      legs: 0x2a2a34, legWear: "tights", shoes: 0xd8d8e0, sleeve: "long" },
    "Taiki Shuttle":  { hair: 0xe0b060, style: "ponytail", len: 12, eyes: 0x3a9ab0, scarf: 0xd0303a,
      top: 0x4aaa4a, trim: 0xf0e0a0, skirt: 0x5ab84a, hem: 0x3a8a3a, cut: "skirt", midriff: true,
      legs: 0x6a4aa0, legWear: "boots", shoes: 0x9a6030, sleeve: "short", gloves: 0x9a6030 },
    "Mejiro McQueen": { hair: 0xc8b4e0, style: "long", len: 12, eyes: 0x8a5ab8,
      top: 0x262630, trim: 0xd8b050, tie: 0x3aa0a0, skirt: 0x262630, hem: 0xf6f6f6, cut: "flare",
      legs: 0x3a8a9a, legWear: "thigh", shoes: 0x3a3a46, sleeve: "long" },
    "Symboli Rudolf": { hair: 0x6a3a26, streak: 0xf6f0e8, style: "long", len: 12, eyes: 0x8a4ab0,
      top: 0x2a6a3a, trim: 0xd8b048, tie: 0xc8302a, skirt: 0x2a6a3a, hem: 0xd8b048, cut: "skirt",
      legs: 0x2a2a30, legWear: "tights", shoes: 0x2a2a30, sleeve: "long", cape: 0xc0302a,
      shoulder: 0xe0b848 },
    "Rice Shower":    { hair: 0x2a2232, style: "long", len: 11, eyes: 0xc03a5a, eyeCover: true,
      hat: 0x2a2a58, rose: 0x4a7ae0, top: 0x2a2a58, trim: 0x7a3a8a, tie: 0x4a7ae0, skirt: 0x2a2a50,
      hem: 0x5a3a7a, cut: "flare", legs: 0x3a2a3a, legWear: "tights", shoes: 0x2a2030, sleeve: "long" },
    "T.M. Opera O":   { hair: 0xe08a3a, style: "short", eyes: 0x8a5ad0, crown: 0xf0c040,
      top: 0xf6f2f4, trim: 0xe03a90, tie: 0xf0c040, skirt: 0xe84aa0, hem: 0xf6f2f4, cut: "flare",
      legs: 0xf6f6f6, legWear: "boots", shoes: 0xf0c040, sleeve: "long", cape: 0xc02a7a,
      shoulder: 0xf0c040 },
    "Gold Ship":      { hair: 0xd8d8e2, style: "long", len: 13, eyes: 0xc03a4a, cap: 0x2a2430,
      top: 0xc8282a, trim: 0xe8c050, skirt: 0xc8282a, hem: 0x2a2430, cut: "skirt",
      legs: 0xf2f2f6, legWear: "boots", shoes: 0x2a2a34, sleeve: "short" },
    "Vodka":          { hair: 0x3a2420, style: "short", eyes: 0xe0b030, eyeCover: true,
      top: 0x22222a, trim: 0xb8e040, skirt: 0x22222a, hem: 0x22222a, cut: "shorts",
      legs: 0x1e1e24, legWear: "boots", shoes: 0x1e1e24, sleeve: "long" },
    "Daiwa Scarlet":  { hair: 0xc8302e, style: "twintail", len: 14, eyes: 0xd04040, tiara: 0xf0c040,
      top: 0xf6f6fa, trim: 0x2a3a90, tie: 0xd0303a, skirt: 0x2a3a90, hem: 0xf6f6fa, cut: "flare",
      legs: 0xf6f6fa, legWear: "thigh", shoes: 0xf6f6fa, sleeve: "short", scarf: 0x4ab0f0 },
    "Grass Wonder":   { hair: 0xb86a3a, style: "long", len: 12, eyes: 0x4a7ad0,
      top: 0xf6f6f8, trim: 0x3a5ac0, tie: 0x3a5ac0, skirt: 0xf6f6f8, hem: 0x3a5ac0, cut: "skirt",
      legs: 0x3a3030, legWear: "tights", shoes: 0x7a4a2a, sleeve: "long" },
    "El Condor Pasa": { hair: 0x3a2620, style: "long", len: 9, eyes: 0x3a7ad0,
      mask: 0xd8303a, maskTrim: 0xf0c040, top: 0xf0c030, trim: 0xd8302a, skirt: 0x3a3ab0,
      hem: 0x2a2a8a, cut: "skirt", legs: 0x3a2a24, legWear: "tights", shoes: 0x8a3a20,
      sleeve: "short", cape: 0xd8402a },
    "Air Groove":     { hair: 0x2a2228, style: "bob", eyes: 0x4a7ad0, eyeCover: true,
      top: 0x22222c, trim: 0xd8b048, skirt: 0x3a5ad8, hem: 0x2a3a90, cut: "skirt",
      legs: 0x22222c, legWear: "thigh", shoes: 0x2a4ac0, sleeve: "long" },
    "Mayano Top Gun": { hair: 0xf0943a, style: "long", len: 12, eyes: 0xe0a030,
      top: 0x6a7040, trim: 0xf0d040, skirt: 0x3a3a30, hem: 0x3a3a30, cut: "shorts",
      legs: 0xe8902a, legWear: "thigh", shoes: 0x5a4030, sleeve: "long" },
    "Super Creek":    { hair: 0x8a4a2a, style: "braid", len: 13, eyes: 0x4a7ad0, bow: 0x3a5ad0,
      top: 0xf2f4fa, trim: 0x3a5ac0, tie: 0x3a5ac0, skirt: 0x4a6ad8, hem: 0xf2f4fa, cut: "flare",
      legs: 0x2a2a3a, legWear: "tights", shoes: 0xe8e8f0, sleeve: "long" },
    "Mejiro Ryan":    { hair: 0x7a4a2a, style: "short", eyes: 0x8a5ab0,
      top: 0xe6f2f2, trim: 0x3aa0a0, tie: 0x3a6a6a, skirt: 0x26262e, hem: 0x26262e, cut: "shorts",
      legs: 0xf0f0f0, legWear: "bare", shoes: 0xf0f0f4, sleeve: "short" },
    "Agnes Tachyon":  { hair: 0xa86a3a, style: "short", eyes: 0xc03a3a, coat: 0xf4f2ea,
      top: 0xe8c860, trim: 0xf4f2ea, tie: 0x3a3a46, skirt: 0x2a2a30, hem: 0x2a2a30, cut: "shorts",
      legs: 0x2a2a30, legWear: "tights", shoes: 0xe8e8e8, sleeve: "coat" },
    "Winning Ticket": { hair: 0x22201e, style: "short", eyes: 0x3a9a5a, ear: 0x3ac060,
      top: 0xd0302a, trim: 0x2a4ab0, skirt: 0x2a3a8a, hem: 0x2a3a8a, cut: "shorts",
      legs: 0x2a2a30, legWear: "bare", shoes: 0xd0302a, sleeve: "short" },
    "Sakura Bakushin O": { hair: 0x4a2a2a, style: "ponytail", len: 12, eyes: 0x8a4ac0, bow: 0xf0a0c0,
      top: 0xf04a8a, trim: 0xf6f2f6, tie: 0xf0c040, skirt: 0x2a2030, hem: 0x2a2030, cut: "shorts",
      legs: 0xf6f2f6, legWear: "thigh", shoes: 0xf06aa0, sleeve: "long", shoulder: 0xf0c040 },
    "Haru Urara":     { hair: 0xf08ab0, style: "twintail", len: 5, eyes: 0xd04a6a, headband: 0xf06aa0,
      top: 0xf6f4f4, trim: 0xf08ab0, skirt: 0xc82a3a, hem: 0xc82a3a, cut: "shorts",
      legs: 0xf6e0e8, legWear: "bare", shoes: 0xd83a4a, sleeve: "short" },
    "Matikanefukukitaru": { hair: 0xc07a3a, style: "long", len: 4, eyes: 0xe0a030, bow: 0xd83a3a,
      top: 0xf4f4f6, trim: 0x2a4ab0, tie: 0xd83a3a, skirt: 0x2a4ab0, hem: 0xf4f4f6, cut: "skirt",
      legs: 0xf6f6f6, legWear: "thigh", shoes: 0x5a3a2a, sleeve: "long" },
    "Nice Nature":    { hair: 0x8a3a2a, style: "twintail", len: 9, eyes: 0x3a9a5a,
      top: 0x2a3a2a, trim: 0xc8302a, tie: 0xc8302a, skirt: 0x22262a, hem: 0xc8302a, cut: "skirt",
      legs: 0x3a2a24, legWear: "thigh", shoes: 0x7a4a2a, sleeve: "long" },
    "King Halo":      { hair: 0x6a3a26, style: "wavy", len: 6, eyes: 0x8a5ab0, ear: 0x2a9a6a,
      top: 0x2a8a5a, trim: 0xf4f4f4, tie: 0xf4f4f4, skirt: 0x2a8a5a, hem: 0xf4f4f4, cut: "flare",
      legs: 0x2a2a30, legWear: "tights", shoes: 0x2a2a30, sleeve: "long" },
  };
  const SKIN = 0xf8dcc8, LASH = 0x2a1a22;

  /** Someone not in LOOKS (a later racer, a renamed career rival): a plausible look from
      her name and her pip colour, stable across races. */
  function fallbackLook(name, color) {
    const rnd = mulberry32(hashStr(name || "?"));
    const pick = a => a[Math.floor(rnd() * a.length)];
    const hairs = [0x4a2c22, 0x7a3a26, 0x2a2228, 0xd2683a, 0xe0b060, 0xc8b4e0, 0xd2d2da, 0x8a3a2a];
    const top = cssColorHex(color) || pick([0x3a6ab0, 0xc0302a, 0x2a8a5a, 0xe08a2a]);
    return { hair: pick(hairs), style: pick(["long", "short", "ponytail", "bob", "twintail"]),
      len: 6 + Math.floor(rnd() * 6), eyes: pick([0x3a7ad8, 0x8a5ad0, 0x3aa070, 0xc03a4a]),
      top, trim: 0xf6f6f6, skirt: mulC(top, 0.7), hem: 0xf6f6f6, cut: pick(["skirt", "flare"]),
      legs: pick([0xf6f6f6, 0x2a2a30]), legWear: pick(["thigh", "tights"]), shoes: 0x3a3a46,
      sleeve: "long" };
  }
  /** "#rrggbb" or "hsl(h s% l%)" (rosterdata uses both) to an int. */
  function cssColorHex(c) {
    if (!c) return null;
    try { return new THREE.Color(String(c).replace(/hsl\((\d+) (\d+)% (\d+)%\)/, "hsl($1,$2%,$3%)")).getHex(); }
    catch (e) { return null; }
  }
  const lookFor = (name, color) =>
    LOOKS[String(name || "").replace(/​/g, "")] || fallbackLook(name, color);

  // ---------------------------------------------------------------- racer models
  /* Proportions in voxels (VS metres each): legs 8, skirt 3, torso 6, neck 1, an 8-cube
     head and 3 of ear -- 29 tall, about 1.8m. Big-headed on purpose: at race distance the
     head and hair are what tells one girl from another. */
  const VS = 0.062;
  const RIG_H = 29;
  const partCache = new Map();

  function hairShade(L) {
    const H = L.hair, H2 = mulC(H, 0.8), HL = mixC(H, 0xffffff, 0.16);
    return (x, y, z) => (((x * 7 + z * 3 + y * 5) % 6 + 6) % 6 === 0) ? H2
                      : (((x + y * 2 + z) % 5 + 5) % 5 === 0 ? HL : H);
  }

  function buildHead(L) {
    const h = new Vox(), hs = hairShade(L);
    h.box(-4, 0, -4, 3, 7, 3, SKIN);
    // cap of hair: top rows, the back three layers, temples down to the jaw
    h.box(-4, 6, -4, 3, 7, 3, hs);
    h.box(-4, 0, -4, 3, 7, -2, hs);
    h.box(-4, 2, -4, -4, 7, 2, hs); h.box(3, 2, -4, 3, 7, 2, hs);
    h.box(-4, 0, -4, -4, 1, -1, hs); h.box(3, 0, -4, 3, 1, -1, hs);
    // fringe, with gaps so the forehead shows; side locks framing the face
    for (const x of [-4, -3, 0, 2, 3]) h.set(x, 5, 3, hs(x, 5, 3));
    for (const x of [-4, 3]) for (let y = 3; y <= 5; y++) h.set(x, y, 3, hs(x, y, 3));
    if (L.streak) for (const [x, y, z] of [[-1, 7, 3], [0, 7, 3], [-1, 6, 3], [0, 6, 3], [0, 5, 3],
                                          [-1, 7, 2], [0, 7, 2], [0, 7, 1]]) h.set(x, y, z, L.streak);
    // eyes: a dark lash row over the iris, a glint on the inner corner
    const iris = L.eyes, irisD = mixC(iris, LASH, 0.55), glint = mixC(iris, 0xffffff, 0.55);
    for (const [xo, xi] of [[-3, -2], [2, 1]]) {
      h.set(xo, 4, 3, LASH); h.set(xi, 4, 3, irisD);
      h.set(xo, 3, 3, iris); h.set(xi, 3, 3, glint);
    }
    h.set(-3, 2, 3, 0xf4b8ac); h.set(2, 2, 3, 0xf4b8ac);          // blush
    h.set(-1, 1, 3, 0xe4a098); h.set(0, 1, 3, 0xe4a098);          // mouth
    if (L.eyeCover) for (let y = 3; y <= 5; y++) for (const x of [1, 2]) h.set(x, y, 3, hs(x, y, 3));
    if (L.mask) {
      for (let x = -4; x <= 3; x++) for (let y = 2; y <= 5; y++) {
        if ((y === 3 || y === 4) && (x === -3 || x === -2 || x === 1 || x === 2)) continue;
        h.set(x, y, 3, (y === 2 || y === 5) ? (L.maskTrim || L.mask) : L.mask);
      }
      h.set(-1, 6, 3, L.mask); h.set(0, 6, 3, L.mask);
    }
    // hair below the head, by cut
    const len = L.len || 6;
    if (L.style === "long" || L.style === "wavy") {
      for (let y = -len; y <= -1; y++) {
        const wide = L.style === "wavy" && y <= -len + 3;
        const x0 = y <= -3 ? (wide ? -4 : -3) : -4, x1 = y <= -3 ? (wide ? 3 : 2) : 3;
        for (let x = x0; x <= x1; x++) for (let z = -4; z <= (wide ? -2 : -3); z++) {
          if (y === -len && (x === x0 || x === x1)) continue;                 // taper the ends
          if (wide && y === -len && ((x + z) & 1)) continue;
          h.set(x, y, z, hs(x, y, z));
        }
      }
    } else if (L.style === "bob") {
      h.box(-4, -2, -4, 3, -1, -2, hs);
      h.box(-4, 0, -4, -4, 1, 2, hs); h.box(3, 0, -4, 3, 1, 2, hs);
    } else {
      h.box(-3, -2, -4, 2, -1, -3, hs);                                       // nape
    }
    // ears -- through the hat if she wears one
    const e0 = L.hat ? 9 : 8;
    if (L.hat) {
      for (let x = -5; x <= 4; x++) for (let z = -5; z <= 4; z++) {
        if ((x === -5 || x === 4) && (z === -5 || z === 4)) continue;
        h.set(x, 8, z, L.hat);
      }
      h.box(-3, 9, -3, 2, 10, 2, L.hat);
      h.box(-3, 9, -3, 2, 9, 2, mixC(L.hat, 0x000000, 0.3));
      h.box(3, 9, 0, 3, 10, 2, L.rose || L.hat); h.set(4, 9, 1, L.rose || L.hat);
    }
    const earIn = mixC(L.hair, 0xffe4ec, 0.5);
    for (const [xo, xi] of [[-3, -2], [2, 1]]) {
      for (let y = e0; y <= e0 + 1; y++) for (const x of [xo, xi]) for (const z of [-1, 0]) {
        let c = hs(x, y, z);
        if (L.ear) c = L.ear;
        else if (z === 0 && x === xi) c = earIn;
        h.set(x, y, z, c);
      }
      h.set(xo, e0 + 2, -1, hs(xo, e0 + 2, -1)); h.set(xo, e0 + 2, 0, hs(xo, e0 + 2, 0));
    }
    if (L.headband) {
      for (let x = -4; x <= 3; x++) h.set(x, 8, 1, L.headband);
      for (const x of [-4, 3]) for (let y = 5; y <= 7; y++) h.set(x, y, 1, L.headband);
    }
    if (L.crown) {
      for (let x = -2; x <= 1; x++) for (let z = 1; z <= 3; z++)
        if (x === -2 || x === 1 || z === 1 || z === 3) h.set(x, 8, z, L.crown);
      for (const [x, z] of [[-2, 3], [1, 3], [-2, 1], [1, 1]]) h.set(x, 9, z, L.crown);
      h.set(-1, 8, 3, 0xd8304a); h.set(0, 8, 3, 0xd8304a);
    }
    if (L.tiara) {
      for (let x = -2; x <= 1; x++) h.set(x, 8, 3, L.tiara);
      h.set(-1, 9, 3, L.tiara); h.set(0, 9, 3, 0x4a8ae8);
    }
    if (L.cap) {
      h.box(-1, 8, -2, 1, 9, 1, L.cap); h.box(-1, 8, -2, 1, 8, 1, 0xe8c050); h.box(-1, 8, 2, 1, 8, 2, L.cap);
    }
    if (L.bow) {
      h.box(-1, 5, -5, 0, 6, -5, L.bow);
      h.box(-3, 5, -5, -2, 7, -5, L.bow); h.box(1, 5, -5, 2, 7, -5, L.bow);
    }
    return meshVox(h);
  }

  /** Hair that moves on its own: ponytails, twin tails and braids hang from a pivot. */
  function buildLocks(L) {
    const out = [], hs = hairShade(L), len = L.len || 8;
    const strand = (w, bend, band) => {
      const v = new Vox();
      for (let i = 0; i < len; i++) {
        const y = -i, z = -Math.round(i * bend);
        const thin = i >= len - 2;
        for (let x = thin ? 0 : -1; x <= 0; x++) for (let dz = thin ? 0 : -1; dz <= 0; dz++)
          v.set(x, y, z + dz, L.style === "braid" && (i % 3 === 1) ? mulC(L.hair, 0.82) : hs(x, y, z + dz));
        if (w && i < len - 3) { v.set(-2, y, z, hs(-2, y, z)); v.set(1, y, z - 1, hs(1, y, z - 1)); }
      }
      if (band) v.box(-1, 0, -1, 0, 0, 0, band);
      return meshVox(v);
    };
    if (L.style === "ponytail") out.push({ x: 0, y: 6.5, z: -5, geo: strand(true, 0.22, L.bow || null) });
    if (L.style === "braid") out.push({ x: 0, y: 0.5, z: -4.5, geo: strand(false, 0.1, L.bow || null) });
    if (L.style === "twintail") {
      const g = strand(len > 7, 0.12, null);
      out.push({ x: -5, y: 6, z: -1, geo: g }, { x: 5, y: 6, z: -1, geo: g });
    }
    return out;
  }

  function buildBody(L) {
    const b = new Vox(), top = L.top, trim = L.trim || mulC(top, 0.7);
    // skirt / shorts
    const sk = L.skirt, hem = L.hem || sk;
    if (L.cut === "shorts") b.box(-3, 0, -2, 2, 2, 1, (x, y) => y === 0 ? hem : sk);
    else {
      b.box(-3, 0, -2, 2, 2, 1, sk);
      b.box(-4, 0, -3, 3, 0, 2, hem);
      if (L.cut === "flare") { b.box(-4, 1, -3, 3, 1, 2, sk); b.box(-5, 0, -3, 4, 0, 2, hem); b.box(-4, 0, -4, 3, 0, 3, hem); }
    }
    // torso
    b.box(-3, 3, -2, 2, 8, 1, top);
    b.box(-3, 3, -2, 2, 3, 1, trim);                                         // waistband
    if (L.midriff) b.box(-3, 3, -2, 2, 4, 1, SKIN);
    b.box(-1, 4, 1, 0, 8, 1, trim);                                          // placket
    b.box(-3, 8, -2, 2, 8, 1, trim); b.box(-2, 8, -1, 1, 8, 0, top);         // collar
    if (L.tie) { b.set(-1, 7, 2, L.tie); b.set(0, 7, 2, L.tie); b.set(-1, 6, 2, L.tie); }
    if (L.shoulder) { b.box(-3, 8, -2, -3, 8, 1, L.shoulder); b.box(2, 8, -2, 2, 8, 1, L.shoulder); }
    if (L.coat) {
      b.box(-3, 3, -2, 2, 8, 1, (x, y, z) => (z === 1 && x >= -1 && x <= 0) ? top : L.coat);
      for (let y = -5; y <= 2; y++) for (let x = -4; x <= 3; x++) for (let z = -3; z <= 2; z++) {
        const shell = x === -4 || x === 3 || z === -3;
        if (shell && !(z === 2 && x > -4 && x < 3)) b.set(x, y, z, L.coat);
      }
    }
    b.box(-1, 9, -1, 0, 9, 0, SKIN);                                         // neck
    if (L.scarf) { b.box(-2, 9, -2, 1, 9, 1, L.scarf); b.box(-1, 9, -1, 0, 9, 0, SKIN); b.box(-2, 9, 1, 1, 9, 1, L.scarf); }
    return meshVox(b);
  }

  function buildArm(L) {
    const a = new Vox(), sleeve = L.coat || L.top, cuff = L.trim || sleeve;
    const hand = L.gloves || SKIN;
    for (let y = -6; y <= -1; y++) {
      let c;
      if (L.sleeve === "coat") c = sleeve;
      else if (y <= -5) c = hand;
      else if (L.sleeve === "short") c = y >= -2 ? sleeve : SKIN;
      else c = y === -4 ? cuff : sleeve;
      a.box(-1, y, -1, 0, y, 0, c);
    }
    return meshVox(a);
  }

  function buildLeg(L) {
    const g = new Vox(), st = L.legs || SKIN, sh = L.shoes || 0x3a3a46;
    for (let y = -8; y <= -1; y++) {
      let c;
      switch (L.legWear) {
        case "tights": c = st; break;
        case "bare":   c = (y === -7 || y === -6) ? st : SKIN; break;
        case "boots":  c = y <= -4 ? sh : (st === SKIN ? SKIN : (y >= -2 ? SKIN : st)); break;
        default:       c = y >= -2 ? SKIN : st;                    // thigh-highs
      }
      if (y === -8) c = sh;
      g.box(-1, y, -1, 0, y, 0, c);
    }
    g.set(-1, -8, 1, sh); g.set(0, -8, 1, sh);                    // toe
    return meshVox(g);
  }

  function buildTail(L) {
    const t = new Vox(), hs = hairShade(L), tip = mixC(L.hair, 0xffffff, 0.12);
    const path = [[0, -1], [0, -2], [-1, -3], [-1, -4], [-2, -5], [-3, -5], [-4, -6], [-5, -6], [-6, -6], [-7, -7]];
    path.forEach(([y, z], i) => {
      const thin = i >= path.length - 2;
      for (let x = thin ? 0 : -1; x <= 0; x++) for (let dy = 0; dy <= (thin ? 0 : 1); dy++)
        t.set(x, y + dy, z, thin ? tip : hs(x, y + dy, z));
    });
    return meshVox(t);
  }

  function buildCape(L) {
    const c = new Vox(), edge = L.trim || mulC(L.cape, 0.7);
    for (let x = -4; x <= 3; x++) for (let y = -12; y <= 0; y++) {
      if (y < -9 && (x === -4 || x === 3)) continue;
      c.set(x, y, 0, (x === -4 || x === 3 || y === 0) ? edge : (((x + y) % 4 === 0) ? mulC(L.cape, 0.9) : L.cape));
    }
    return meshVox(c);
  }

  /* The Tracen winter uniform, for `makeRacer(..., { uniform: true })`. Nothing asks for it
     now -- every racer wears her signature outfit everywhere, the lobby included -- but
     it is here if a scene ever wants it. Hair, eyes, ears and hair ornaments stay her own;
     whatever belongs to her racing outfit (a cape, a mask, a crown) is left in the locker. */
  const UNIFORM = { top: 0x5650a8, trim: 0xf6f4fb, tie: 0xf6f4fb, skirt: 0x6858be, hem: 0xf0eefa, cut: "flare",
                    legs: 0x2c2856, legWear: "thigh", shoes: 0x6a3c26, sleeve: "long" };
  const OFF_DUTY = ["cape", "coat", "mask", "maskTrim", "shoulder", "gloves", "scarf", "midriff",
                    "crown", "cap", "hat", "rose"];
  function uniformLook(L) {
    const u = Object.assign({}, L, UNIFORM);
    for (const k of OFF_DUTY) delete u[k];
    return u;
  }

  function partsFor(name, color, uniform) {
    const key = (uniform ? "uniform:" : "") + (name || "?");
    let p = partCache.get(key);
    if (p) return p;
    const L = uniform ? uniformLook(lookFor(name, color)) : lookFor(name, color);
    p = { head: buildHead(L), body: buildBody(L), arm: buildArm(L), leg: buildLeg(L),
          tail: buildTail(L), cape: L.cape ? buildCape(L) : null, locks: buildLocks(L), look: L };
    partCache.set(key, p);
    return p;
  }

  let MAT = null;
  function materials() {
    if (MAT) return MAT;
    MAT = {
      vox: new THREE.MeshLambertMaterial({ vertexColors: true }),
      ring: new THREE.MeshBasicMaterial({ color: 0xffd24a }),
      white: new THREE.MeshLambertMaterial({ color: 0xffffff }),
    };
    return MAT;
  }

  /** A posable racer: legs, arms, head, tail and any hair or cape that swings.
      `opts.uniform` dresses her in the school uniform instead of her racing outfit. */
  function makeRacer(name, color, opts) {
    return rigFrom(partsFor(name, color, opts && opts.uniform), VS);
  }
  /* The rig every figure shares, racer or trainer: hips at 8 voxels, the body, arms at the
     shoulders, the head on the neck, a tail (if she has one) and any locks of hair that
     swing. `sitLift` is how far the hips rise to sit on a seat half a metre up. */
  function rigFrom(P, scale) {
    const M = materials();
    const mesh = g => { const m = new THREE.Mesh(g, M.vox); m.castShadow = true; m.receiveShadow = true; return m; };
    const root = new THREE.Group(), rig = new THREE.Group();
    rig.scale.setScalar(scale); root.add(rig);
    const legL = new THREE.Group(), legR = new THREE.Group();
    legL.position.set(-1.05, 8, 0); legR.position.set(1.05, 8, 0);
    legL.add(mesh(P.leg)); legR.add(mesh(P.leg));
    const body = new THREE.Group(); body.position.set(0, 8, 0); body.add(mesh(P.body));
    const armL = new THREE.Group(), armR = new THREE.Group();
    armL.position.set(-4, 9, 0); armR.position.set(4, 9, 0);
    armL.add(mesh(P.arm)); armR.add(mesh(P.arm));
    const head = new THREE.Group(); head.position.set(0, 10, 0); head.add(mesh(P.head));
    // anything on the head finer than its grain (the trainer's glasses), at its own scale
    for (const e of P.headExtra || []) { const m = mesh(e.geo); m.scale.setScalar(e.scale); head.add(m); }
    const tail = new THREE.Group(); tail.position.set(0, 1.5, -2);
    if (P.tail) tail.add(mesh(P.tail));
    body.add(armL, armR, head, tail);
    let cape = null;
    if (P.cape) { cape = new THREE.Group(); cape.position.set(0, 9, -3.1); cape.add(mesh(P.cape)); body.add(cape); }
    const locks = P.locks.map(l => {
      const g = new THREE.Group(); g.position.set(l.x, l.y, l.z); g.add(mesh(l.geo)); head.add(g);
      return g;
    });
    rig.add(legL, legR, body);
    return { root, rig, legL, legR, body, armL, armR, head, tail, cape, locks, sitLift: 0.566 - 8 * scale,
             phase: Math.random() * 6.283, seed: Math.random() * 100 };
  }

  // ---------------------------------------------------------------- the trainer
  /* The player's own trainer: a person, not a racer -- a person's ears and no tail, adult
     eyes, and the clothes of somebody who works at the academy. Made at registration
     (trainer.js) from a handful of choices, kept on the account as indices into these
     lists. The same rig as the racers, a little taller. */
  const TRAINER = {
    skins:   [0xf8dcc8, 0xf0c8a8, 0xdcaa82, 0xb67c54, 0x7c4c30],
    hairs:   [0x22201e, 0x4a2c22, 0x7a4a2a, 0xa8642e, 0xe0b868, 0xb03a2a, 0xb8b8c0, 0x2a3a6a],
    eyes:    [0x4a3020, 0x3a6ab0, 0x3a8a5a, 0x7a4ab0, 0x8a8a90],
    colours: [0x2a3150, 0x3a3a40, 0x1e1e22, 0x2f6a4e, 0x7a2232, 0xb89a6a, 0x5a8ac8, 0xf2efe6],
    styles:  { m: ["short", "spiky", "slick", "buzz", "shaggy"],          // a man's cuts and a woman's are their own
               f: ["bob", "long", "ponytail", "bun", "pixie"] },
    bottoms: { m: ["trousers", "jeans", "shorts"],                      // skirts are a woman's only
               f: ["skirt", "pleated", "long", "trousers", "jeans", "shorts"] },
    attires: ["suit", "tracksuit", "sweater", "polo"],
  };
  const TS = VS * 1.08;
  function trainerDefault(sex) {
    return sex === "f"
      ? { sex: "f", skin: 0, hair: 1, style: "ponytail", eyes: 0, attire: "suit", colour: 0, bottoms: "skirt", glasses: false }
      : { sex: "m", skin: 0, hair: 0, style: "short", eyes: 0, attire: "suit", colour: 0, bottoms: "trousers", glasses: false };
  }
  /** The saved choices, checked, as colours. */
  function trainerLook(t) {
    const d = trainerDefault(t && t.sex);
    t = Object.assign({}, d, t || {});
    const pick = (a, i) => a[clamp(i | 0, 0, a.length - 1)], sex = t.sex === "f" ? "f" : "m";
    return { sex, skin: pick(TRAINER.skins, t.skin), hair: pick(TRAINER.hairs, t.hair),
             style: TRAINER.styles[sex].includes(t.style) ? t.style : d.style, eyes: pick(TRAINER.eyes, t.eyes),
             attire: TRAINER.attires.includes(t.attire) ? t.attire : d.attire, colour: pick(TRAINER.colours, t.colour),
             bottoms: TRAINER.bottoms[sex].includes(t.bottoms) ? t.bottoms : d.bottoms, glasses: !!t.glasses,
             // the academy's staff (lobby.js) are made the same way, dressed outside the lists:
             // their own colours, a tie, a hat, an apron, tights and shoes
             ...(t.custom || {}) };
  }
  const skirted = T => T.bottoms === "skirt" || T.bottoms === "pleated" || T.bottoms === "long";
  const DENIM = 0x3a5a8a;
  const SHIRT = 0xf6f4f0;
  // what goes with the top: a suit's trousers match it, a sweater's are charcoal, a polo's khaki
  const bottomOf = T => T.attire === "sweater" ? 0x3a3a46 : T.attire === "polo" ? 0xc8b08a : T.colour;

  function buildTrainerHead(T) {
    const h = new Vox(), hs = hairShade({ hair: T.hair }), skin = T.skin;
    h.box(-4, 0, -4, 3, 7, 3, skin);
    // eyes as the racers have them, two by two: a lid over the iris, a glint by it -- the
    // lid a lash for her, a crease for him; a little colour in her cheeks
    for (const [xo, xi] of [[-3, -2], [2, 1]]) {
      h.set(xo, 3, 3, T.eyes); h.set(xi, 3, 3, mixC(T.eyes, 0xffffff, 0.5));
      h.set(xo, 4, 3, T.sex === "f" ? LASH : mixC(T.eyes, LASH, 0.6));
      h.set(xi, 4, 3, T.sex === "f" ? mixC(T.eyes, LASH, 0.55) : mulC(skin, 0.86));
    }
    if (T.sex === "f") { h.set(-3, 2, 3, 0xf0b4a6); h.set(2, 2, 3, 0xf0b4a6); }
    h.set(-1, 1, 3, mulC(skin, 0.78)); h.set(0, 1, 3, mulC(skin, 0.78));
    // hair: the crown, the back right down to the nape, the temples -- every cut starts
    // from that (the back stopping a row short left a band of skin under long hair)
    h.box(-4, 7, -4, 3, 7, 3, hs);
    h.box(-4, 0, -4, 3, 7, -3, hs);
    h.box(-4, 3, -4, -4, 7, 0, hs); h.box(3, 3, -4, 3, 7, 0, hs);
    const fringe = (gap) => { for (let x = -4; x <= 3; x++) if (x !== gap) h.set(x, 6, 3, hs(x, 6, 3)); };
    const covered = T.style === "bob" || T.style === "long" || T.style === "shaggy";
    switch (T.style) {
      // his
      case "short": fringe(1); h.box(-4, 4, 1, -4, 6, 2, hs); h.box(3, 4, 1, 3, 6, 2, hs); break;
      case "buzz":                                                // clipped close: no fringe, the hairline high
        for (const x of [-4, 3]) h.box(x, 3, -2, x, 4, 0, skin);
        break;
      case "shaggy":
        fringe(99); for (const x of [-4, -3, -2, 1, 2, 3]) h.set(x, 5, 3, hs(x, 5, 3));
        h.box(-4, 0, -4, -4, 6, 2, hs); h.box(3, 0, -4, 3, 6, 2, hs);   // down over the ears
        h.box(-3, -2, -4, 2, -1, -3, hs);                               // and the nape
        for (let x = -4; x <= 3; x++) for (let z = -4; z <= 1; z++) if ((x * 3 + z) % 4) h.set(x, 8, z, hs(x, 8, z));
        break;
      case "spiky":
        fringe(99);
        for (let x = -4; x <= 3; x++) for (let z = -4; z <= 2; z++) if (((x + z) & 1) === 0) h.set(x, 8, z, hs(x, 8, z));
        for (const [x, z] of [[-2, -2], [1, 0], [-1, 1], [2, -3], [-3, 0]]) h.set(x, 9, z, hs(x, 9, z));
        break;
      case "slick": h.box(-4, 8, -4, 3, 8, 1, hs); h.box(-3, 8, 2, 2, 8, 2, hs); break;    // swept back, forehead clear
      // hers
      case "pixie":                                               // short, the fringe swept to one side
        fringe(99); for (const x of [-4, -3, -2]) h.set(x, 5, 3, hs(x, 5, 3)); h.set(-4, 4, 3, hs(-4, 4, 3));
        h.box(-4, 8, -3, 0, 8, 1, hs);
        break;
      case "bob":
        fringe(99); h.box(-4, 5, 3, -4, 5, 3, hs); h.box(3, 5, 3, 3, 5, 3, hs);
        h.box(-4, -2, -4, 3, -1, -2, hs);
        h.box(-4, 0, -4, -4, 2, 2, hs); h.box(3, 0, -4, 3, 2, 2, hs);
        break;
      case "long":
        fringe(-1);
        for (let y = -7; y <= -1; y++) {
          const x0 = y <= -3 ? -3 : -4, x1 = y <= -3 ? 2 : 3;
          for (let x = x0; x <= x1; x++) for (let z = -4; z <= -3; z++) if (!(y === -7 && (x === x0 || x === x1))) h.set(x, y, z, hs(x, y, z));
        }
        h.box(-4, 0, -4, -4, 2, 1, hs); h.box(3, 0, -4, 3, 2, 1, hs);
        break;
      case "ponytail": fringe(-2); break;                          // the tail itself swings (locks)
      case "bun": fringe(-2); h.box(-1, 6, -6, 0, 8, -5, hs); h.box(-2, 7, -6, 1, 7, -5, hs); break;
    }
    if (!covered) { h.set(-5, 3, 0, skin); h.set(-5, 4, 0, skin); h.set(4, 3, 0, skin); h.set(4, 4, 0, skin); }
    // (glasses are their own finer mesh: buildGlasses)
    if (T.hat) {                                                   // a uniform hat: crown, band, a short peak
      const c = T.hat.c, band = T.hat.band || mulC(c, 0.8);
      h.box(-4, 8, -4, 3, 8, 3, band); h.box(-4, 9, -4, 3, 9, 3, c); h.box(-3, 10, -3, 2, 10, 2, c);
      h.box(-3, 8, 4, 2, 8, 4, mulC(c, 0.75));
    } else if (T.attire === "polo") {                              // a cap with the polo
      const c = T.colour, cd = mulC(c, 0.8);
      h.box(-4, 8, -4, 3, 8, 3, c); h.box(-3, 9, -3, 2, 9, 2, c);
      h.box(-4, 8, 4, 3, 8, 5, cd); h.set(-1, 9, 3, 0xf6f4f0); h.set(0, 9, 3, 0xf6f4f0);
    }
    return meshVox(h);
  }
  /* Glasses, the anime way -- white lenses that hide the eyes -- built at a quarter of the
     head's grain so the frames can be thin: a rim all round each lens, a bridge between,
     and the arms back along the sides of the head, over the tops of the ears and down
     behind them. In head-voxel units, the face's front at z = 4. */
  function buildGlasses() {
    const g = new Vox(), fr = 0x26262e, lens = 0xfafcfd, q = 4;
    const box = (x0, y0, z0, x1, y1, z1, c) =>
      g.box(Math.round(x0 * q), Math.round(y0 * q), Math.round(z0 * q), Math.round(x1 * q) - 1, Math.round(y1 * q) - 1, Math.round(z1 * q) - 1, c);
    for (const [a, b] of [[-3.75, -0.5], [0.5, 3.75]]) {
      box(a, 2.25, 4, b, 5.5, 4.25, fr);                                      // the rim
      box(a + 0.25, 2.5, 4, b - 0.25, 5.25, 4.25, lens);                      // the lens in it
    }
    box(-0.5, 4.5, 4, 0.5, 4.75, 4.25, fr);                                   // the bridge
    for (const s of [-1, 1]) {
      const x0 = s < 0 ? -4.25 : 4;
      box(s < 0 ? -4.25 : 3.75, 5, 4, s < 0 ? -3.75 : 4.25, 5.25, 4.25, fr);  // hinge, out to the side
      box(x0, 5, -0.5, x0 + 0.25, 5.25, 4, fr);                               // the arm, back over the ear
      box(x0, 4.25, -0.5, x0 + 0.25, 5, -0.25, fr);                           // and down behind it
    }
    return meshVox(g);
  }
  function buildTrainerBody(T) {
    const b = new Vox(), J = T.colour, Jd = mulC(J, 0.8), bot = T.bottoms === "jeans" ? DENIM : bottomOf(T);
    switch (T.bottoms) {
      case "skirt": b.box(-3, 0, -2, 2, 2, 1, bot); b.box(-4, 0, -3, 3, 0, 2, mulC(bot, 0.9)); break;
      case "pleated":                                            // flared, the pleats in alternate shades
        b.box(-3, 0, -2, 2, 2, 1, (x) => (x & 1) ? mulC(bot, 0.86) : bot);
        b.box(-4, 0, -3, 3, 1, 2, (x) => (x & 1) ? mulC(bot, 0.86) : bot);
        b.box(-5, 0, -3, 4, 0, 2, (x) => (x & 1) ? mulC(bot, 0.86) : bot);
        break;
      case "long":                                               // down to the shin, round both legs
        b.box(-3, -4, -2, 2, 2, 1, (x, y) => y === -4 ? mulC(bot, 0.86) : bot);
        b.box(-4, -4, -3, 3, -3, 2, mulC(bot, 0.86));
        break;
      default:                                                   // trousers, jeans, shorts: a belt at the top
        b.box(-3, 0, -2, 2, 2, 1, (x, y) => y === 2 ? 0x2a2420 : bot);
    }
    b.box(-3, 3, -2, 2, 8, 1, J);
    switch (T.attire) {
      case "suit": {
        const tie = T.tie || (J === 0x7a2232 ? 0x2a3a6a : 0xc0303a);
        b.box(-3, 2, -2, 2, 2, 1, J);                                        // the jacket over the hips
        b.box(-2, 8, 1, 1, 8, 1, SHIRT); b.box(-1, 7, 1, 0, 7, 1, SHIRT);     // the shirt in its V
        b.box(-1, 4, 1, 0, 6, 1, tie);
        for (const x of [-2, 1]) for (let y = 6; y <= 7; y++) b.set(x, y, 1, Jd);   // lapels
        b.set(-2, 4, 1, 0x2a2a30);                                           // a button
        break;
      }
      case "tracksuit":
        b.box(-3, 6, -2, 2, 6, 1, SHIRT);                                    // a stripe round the chest
        b.box(-1, 3, 1, -1, 8, 1, 0xc8ccd6);                                 // the zip
        b.box(-2, 9, -2, 1, 9, 1, J);                                        // its collar, zipped up
        break;
      case "sweater":
        b.box(-3, 3, -2, 2, 8, 1, (x, y) => y === 3 ? Jd : ((x & 1) ? mulC(J, 0.92) : J));
        b.box(-2, 8, 1, 1, 8, 1, SHIRT); b.set(-2, 9, 1, SHIRT); b.set(1, 9, 1, SHIRT);   // a shirt collar out over it
        break;
      case "polo":
        b.box(-2, 8, 1, 1, 8, 1, SHIRT); b.set(-3, 8, 0, SHIRT); b.set(2, 8, 0, SHIRT);
        b.box(-1, 6, 1, -1, 7, 1, SHIRT);
        break;
    }
    if (T.apron) {                                                           // the cafeteria cook's, over it all
      b.box(-2, 0, 1, 1, 7, 1, T.apron); b.set(-2, 8, 1, T.apron); b.set(1, 8, 1, T.apron);
    }
    b.box(-1, 9, -1, 0, 9, 0, T.skin);                                       // neck
    return meshVox(b);
  }
  function buildTrainerArm(T) {
    const a = new Vox(), J = T.colour;
    for (let y = -6; y <= -1; y++) {
      let c = J;
      if (y === -6) c = T.skin;
      else if (y === -5) c = T.attire === "suit" ? SHIRT : T.attire === "sweater" ? mulC(J, 0.8) : T.skin;
      else if (T.attire === "polo" && y <= -3) c = T.skin;
      a.box(-1, y, -1, 0, y, 0, c);
    }
    if (T.attire === "tracksuit") for (let y = -4; y <= -1; y++) a.set(0, y, 0, SHIRT);
    return meshVox(a);
  }
  function buildTrainerLeg(T) {
    const g = new Vox();
    const shoe = T.shoes || (T.attire === "tracksuit" ? 0xf2f2f2 : T.attire === "polo" ? 0x8a5a3a : 0x2a2420);
    const tights = T.legs || (T.attire === "suit" || T.attire === "sweater" ? 0x3a3440 : T.skin);
    for (let y = -8; y <= -1; y++) {
      let c;
      switch (T.bottoms) {
        case "jeans":  c = DENIM; break;
        case "shorts": c = y >= -3 ? bottomOf(T) : y === -7 ? 0xf6f4f0 : T.skin; break;   // to mid-thigh, white socks
        default:       c = skirted(T) ? tights : bottomOf(T);
      }
      g.box(-1, y, -1, 0, y, 0, y === -8 ? shoe : c);
    }
    g.set(-1, -8, 1, shoe); g.set(0, -8, 1, shoe);
    return meshVox(g);
  }
  const trainerCache = new Map();
  /** The trainer, from her saved choices (see TRAINER), posable with pose() like a racer. */
  function makeTrainer(t) {
    const T = trainerLook(t), key = JSON.stringify(T);
    let P = trainerCache.get(key);
    if (!P) {
      P = { head: buildTrainerHead(T), body: buildTrainerBody(T), arm: buildTrainerArm(T), leg: buildTrainerLeg(T),
            locks: T.style === "ponytail" ? buildLocks({ hair: T.hair, style: "ponytail", len: 11 }) : [],
            headExtra: T.glasses ? [{ geo: buildGlasses(), scale: 0.25 }] : [] };
      trainerCache.set(key, P);
    }
    return rigFrom(P, TS);
  }

  /** Pose a racer. `run` is 0 (standing) to 1 (full gallop); `phase` drives the stride. */
  function pose(m, run, t, flags) {
    const s = Math.sin(m.phase), s2 = Math.sin(m.phase * 2);
    const tired = flags.exhausted ? 1 : 0, kick = flags.spurt ? 1 : 0;
    const legA = (0.95 - 0.25 * tired) * run, armA = (0.85 - 0.3 * tired) * run;
    m.legL.rotation.x = s * legA; m.legR.rotation.x = -s * legA;
    m.armL.rotation.x = -s * armA; m.armR.rotation.x = s * armA;
    m.armL.rotation.z = -0.08 - 0.06 * run; m.armR.rotation.z = 0.08 + 0.06 * run;
    const breathe = Math.sin(t * 2.1 + m.seed) * 0.012 * (1 - run);
    m.body.rotation.x = 0.03 + 0.24 * run + 0.08 * kick + 0.14 * tired * run + breathe;
    m.head.rotation.x = -m.body.rotation.x * 0.55 + 0.18 * tired;
    m.head.rotation.y = Math.sin(t * 0.7 + m.seed) * 0.12 * (1 - run);
    m.rig.position.y = Math.abs(s) * 0.075 * run;
    m.tail.rotation.x = 0.2 + 0.7 * run + s2 * 0.08 * run;
    m.tail.rotation.y = Math.sin(t * 1.7 + m.seed) * 0.28 * (1 - 0.6 * run);
    for (let i = 0; i < m.locks.length; i++) {
      const l = m.locks[i];
      l.rotation.x = 0.06 + 0.6 * run + Math.sin(m.phase * 2 + 1 + i) * 0.07 * run;
      l.rotation.z = Math.sin(t * 1.3 + i * 2 + m.seed) * 0.06 + (i ? 0.08 : -0.08) * run;
    }
    if (m.cape) m.cape.rotation.x = 0.12 + 0.5 * run + Math.sin(t * 11 + m.seed) * 0.08 * run;
  }

  // ---------------------------------------------------------------- scene state
  let renderer = null, scene = null, camera = null, stageEl = null;
  let sun = null, hemi = null, world = null, raceGroup = null;
  const U = { time: { value: 0 }, cheer: { value: 0.1 } };
  let racers = new Map();                 // sim racer -> { m, extra, vc, lastPos }
  let gate = null, ring = null, vision = null, fx = null, clouds = [];
  let camMode = 0, camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), camFresh = true;
  const camOff = new THREE.Vector3(), lookOff = new THREE.Vector3(), focus = new THREE.Vector3();
  let lastWall = 0, lastSimT = 0, animT = 0, orbit = 0;
  let course = null, path = null, startS = 0, laneCount = 8;
  const CAMS = ["Auto", "Broadcast", "Chase", "Field"];
  let camPref = 0, feel = 0;
  try { camPref = Math.max(0, CAMS.indexOf(localStorage.getItem("postparade.raceCam") || "Auto")); } catch (e) {}
  camMode = camPref;
  /* The title screen's race (attract.js) is directed by Auto whatever view the player
     keeps for her own races, and features nobody: there is no ring under anyone. */
  let attract = false;
  const camName = () => attract ? "Auto" : CAMS[camMode];

  /* A phone (a touch screen, or few cores) starts on a smaller budget: fewer pixels and a
     coarser shadow map. Then the governor watches the frames; if they keep running long it
     steps the budget down, one notch each time, and never back up -- a picture that keeps
     sharpening and blurring is worse than one that is a little soft. (lobby.js has the same.) */
  const LOW_POWER = !!(root.matchMedia && matchMedia("(pointer:coarse)").matches) || (navigator.hardwareConcurrency || 8) <= 4;
  const gov = { level: 0, slow: 0, t: 0 };
  /* What applySeason restyles: the sky dome, the ground, the trees (set by buildWorld). */
  const SCENERY = { sky: null, far: null, ground: null, trees: [], season: undefined, weather: undefined };
  function budget() {
    renderer.setPixelRatio(Math.min(root.devicePixelRatio || 1, [LOW_POWER ? 1.25 : 1.75, 1, 1, 0.8][gov.level]));
    const size = gov.level >= 2 ? 1024 : LOW_POWER ? 1536 : 2048;
    if (sun && sun.shadow.mapSize.x !== size) {
      sun.shadow.mapSize.set(size, size);
      if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
    }
  }
  function govern(dt, w, h) {
    if (!dt || document.hidden || gov.level >= 3) return;
    // the share of recent frames slower than 24 a second: not 30, which is where a phone on
    // battery saver holds every page however little it draws
    gov.slow += ((dt > 1 / 24 ? 1 : 0) - gov.slow) * 0.05;
    gov.t += dt;
    if (gov.t < 2.5 || gov.slow < 0.5) return;
    gov.level++; gov.t = 0; gov.slow = 0;
    budget();
    renderer.setSize(w, h, false);
  }

  function ensureRenderer(stage) {
    if (renderer) {
      if (renderer.domElement.parentNode !== stage) stage.insertBefore(renderer.domElement, stage.firstChild);
      stageEl = stage;
      return true;
    }
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch (e) { renderer = null; return false; }
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setClearColor(0xa8d0ee);
    renderer.domElement.className = "vox3d";
    stage.insertBefore(renderer.domElement, stage.firstChild);
    stageEl = stage;
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xcfe2f0, 260, 1500);
    camera = new THREE.PerspectiveCamera(42, 1, 0.25, 4000);
    hemi = new THREE.HemisphereLight(0xeef6ff, 0x8aa874, 0.55);
    scene.add(hemi);
    sun = new THREE.DirectionalLight(0xfff2da, 0.7);
    sun.castShadow = true;
    budget();
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.04;
    const sc = sun.shadow.camera; sc.near = 60; sc.far = 260;
    scene.add(sun, sun.target);
    buildWorld();
    raceGroup = new THREE.Group(); scene.add(raceGroup);
    return true;
  }

  // ---------------------------------------------------------------- instancing
  /* Instanced props are split into 64m chunks so the camera and the shadow pass can cull
     them -- one InstancedMesh around the whole oval would always be "in view". */
  function addInstanced(parent, geo, mat, items, opts) {
    opts = opts || {};
    const made = [];                    // the meshes, for anything that swaps their geometry later (the seasons)
    if (!items.length) return made;
    const CH = opts.chunk || 64, buckets = new Map();
    for (const it of items) {
      const k = Math.floor(it.x / CH) + "," + Math.floor(it.z / CH);
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(it);
    }
    const g = geo.clone();
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, opts.cy || 4, 0), opts.radius || CH * 0.75 + 10);
    const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(),
          ps = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
    for (const [k, arr] of buckets) {
      const [cx, cz] = k.split(",").map(Number), ox = (cx + 0.5) * CH, oz = (cz + 0.5) * CH;
      const im = new THREE.InstancedMesh(g, mat, arr.length);
      im.position.set(ox, 0, oz);
      arr.forEach((it, i) => {
        q.setFromAxisAngle(up, it.yaw || 0);
        const s = it.s || 1; sc.set(it.sx || s, it.sy || s, it.sz || s);
        ps.set(it.x - ox, it.y || 0, it.z - oz);
        mtx.compose(ps, q, sc);
        im.setMatrixAt(i, mtx);
        if (it.c != null) im.setColorAt(i, col.setHex(it.c));
      });
      im.castShadow = opts.shadow !== false; im.receiveShadow = opts.receive !== false;
      parent.add(im);
      made.push(im);
    }
    return made;
  }

  function cheerMaterial() {
    const m = new THREE.MeshLambertMaterial({ vertexColors: true });
    m.onBeforeCompile = sh => {
      sh.uniforms.uTime = U.time; sh.uniforms.uCheer = U.cheer;
      /* Lambert's vertex shader runs color_vertex before begin_vertex, so the per-fan
         phase is worked out in the first and used in both. */
      sh.vertexShader = "uniform float uTime;\nuniform float uCheer;\n" + sh.vertexShader.replace(
        "#include <color_vertex>",
        `#include <color_vertex>
#ifdef USE_INSTANCING
  vec2 ip = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
#else
  vec2 ip = vec2(0.0);
#endif
  float ph = fract(sin(dot(ip, vec2(12.9898, 78.233))) * 43758.5453);
#ifdef USE_INSTANCING_COLOR
  // the head is the one voxel not baked white: it keeps its own colour (skin, or a dark
  // head of hair for about half the crowd) and only the shirt takes the instance colour
  if (color.r - color.b > 0.08) vColor.xyz = color.xyz * mix(vec3(1.0), vec3(0.45, 0.32, 0.26), step(0.55, ph));
#endif`).replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
  float hop = max(0.0, sin(uTime * (6.0 + 4.0 * ph) + ph * 6.2831));
  transformed.y += hop * hop * uCheer * 0.38;`);
    };
    m.customProgramCacheKey = () => "cheer";
    return m;
  }

  // ---------------------------------------------------------------- the world
  function buildGroundTexture() {
    const W = 1024, H = 512, data = new Uint8Array(W * H * 4), rnd = mulberry32(0x7ab1e);
    const put = (i, c) => { data[i] = (c >> 16) & 255; data[i + 1] = (c >> 8) & 255; data[i + 2] = c & 255; data[i + 3] = 255; };
    for (let j = 0; j < H; j++) {
      const z = 256 - (j + 0.5);
      for (let i = 0; i < W; i++) {
        const x = -512 + i + 0.5, o = (j * W + i) * 4;
        const dT = railDist(x, z, TURF.R), dD = railDist(x, z, DIRT.R);
        let c;
        if (dT >= 0 && dT < TURF.W) {
          // mown in a checker, the way the JRA cuts its turf
          const s = arcOf(x, z), stripe = (Math.floor(s / 6) + Math.floor(dT / 6.5)) & 1;
          c = stripe ? 0x62b444 : 0x4c9a34;
          if (dT < 7) c = mixC(c, 0x8aa84a, 0.12 * (1 - dT / 7));               // the worn inside lanes
          if (x > FINISH_X - 0.5 && x < FINISH_X + 0.5 && z > 0) c = 0xf4f4f0;  // the line
          c = jit(c, rnd, 0.07);
        } else if (dD >= 0 && dD < DIRT.W) {
          c = (Math.floor(dD * 1.5) & 1) ? 0xa48660 : 0x9c7e58;
          if (x > FINISH_X - 0.5 && x < FINISH_X + 0.5 && z > 0) c = 0xf0ece2;
          c = jit(c, rnd, 0.07);
        } else if (dD >= DIRT.W && dT < 0) {
          c = jit(0x3a7a30, rnd, 0.08);                                          // hedge strip
        } else if (dD < 0) {
          const px = (x - POND.x) / POND.rx, pz = (z - POND.z) / POND.rz, pr = px * px + pz * pz;
          if (pr < 1) c = jit(pr > 0.86 ? 0x6a9ab8 : 0x3a78b8, rnd, 0.06);
          else if (pr < 1.18) c = jit(0xd8c89a, rnd, 0.08);                     // shore
          else {
            const chk = (Math.floor(x / 16) + Math.floor(z / 16)) & 1;
            c = jit(chk ? 0x4e8c3a : 0x48843a, rnd, 0.08);
            // flower beds in front of the big screen and round the pond
            const bed = (Math.abs(z - 52) < 5 && Math.abs(x - 40) < 34) || (pr < 1.5 && pr > 1.3);
            if (bed && rnd() < 0.55) c = [0xf06a9a, 0xf8e060, 0xf4f4f4, 0xe84a4a, 0xb07ae0][Math.floor(rnd() * 5)];
          }
        } else {
          // outside the turf course: verge, then the apron in front of the stands, then rough
          const apron = z > 0 && x > STAND.x0 - 20 && x < STAND.x1 + 20 && z > TURF.R + TURF.W + 4 && z < STAND.z + 2;
          if (dT < TURF.W + 4) c = jit(0x3c7a2e, rnd, 0.1);
          else if (apron) c = jit(((Math.floor(x / 4) + Math.floor(z / 4)) & 1) ? 0xbcbcb4 : 0xb2b2aa, rnd, 0.04);
          else {
            const path2 = Math.abs(dT - TURF.W - 30) < 2;
            c = path2 ? jit(0xc8b48a, rnd, 0.08) : jit(0x4a8236, rnd, 0.12);
          }
        }
        put(o, c);
      }
    }
    const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    tex.needsUpdate = true;
    return tex;
  }

  function railItems(p, off, spacing) {
    const out = [], n = Math.round(p.L / spacing), tmp = {};
    for (let i = 0; i < n; i++) {
      const at = p.at(i * (p.L / n), off, tmp);
      out.push({ x: at.x, z: at.z, yaw: yawOf(at) });
    }
    return out;
  }

  /* Trees: 0 a broadleaf, 1 a conifer, 2 a cherry. `season` dresses them for the time of
     year (applySeason): fresh green and blossom in spring, deep green in summer, red and
     gold in autumn, bare branches with snow on them in winter -- the conifer keeps its
     needles and only takes the snow. No season is the look the course always had. */
  const LEAVES = {
    null:   [0x4a9a3e, 0x2f6e3a, 0xf2a6c4],
    spring: [0x6ab84a, 0x356f3a, 0xf6b8cc],
    summer: [0x3f8a36, 0x2a6232, 0x3f8a36],
    autumn: [0xd8762a, 0x3a6a36, 0xc8402a],
  };
  const AUTUMN = [0xd8762a, 0xc8402a, 0xe8b23a, 0xb85a22];
  function tree(kind, seed, season) {
    const R = mulberry32(seed), v = new Vox();
    const trunk = 0x7a5232, SNOW = 0xf2f6fa;
    const winter = season === "winter";
    const leaves = (LEAVES[season] || LEAVES.null)[kind];
    const h = kind === 1 ? 4 : 3 + Math.floor(R() * 3);
    v.box(0, 0, 0, 0, h, 0, trunk);
    if (kind === 1) {                                     // conifer: stacked tiers
      for (let t = 0; t < 4; t++) {
        const r = 3 - t * 0.7, y = h - 1 + t * 2;
        for (let x = -3; x <= 3; x++) for (let z = -3; z <= 3; z++) for (let dy = 0; dy < 2; dy++)
          if (x * x + z * z <= r * r) v.set(x, y + dy, z, winter && dy === 1 && R() < 0.75 ? SNOW : jit(leaves || 0x2f6e3a, R, 0.1));
      }
    } else if (winter) {                                  // bare: a few branches, snow along the tops
      const cy = h + 1;
      v.box(0, h, 0, 0, h + 3, 0, trunk);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]]) {
        const len = 2 + Math.floor(R() * 2), y0 = cy + Math.floor(R() * 2);
        for (let i = 1; i <= len; i++) {
          v.set(dx * i, y0 + Math.floor(i / 2), dz * i, trunk);
          if (R() < 0.6) v.set(dx * i, y0 + Math.floor(i / 2) + 1, dz * i, SNOW);
        }
      }
      v.set(0, h + 4, 0, SNOW);
    } else {
      const r = 2.6 + R() * 1.2, cy = h + 2;
      for (let x = -4; x <= 4; x++) for (let y = -3; y <= 4; y++) for (let z = -4; z <= 4; z++) {
        const d = (x * x + (y * 1.2) * (y * 1.2) + z * z);
        if (d > r * r) continue;
        // autumn: every leaf its own red or gold; otherwise lighter toward the top
        const c = season === "autumn" && kind !== 1 ? AUTUMN[Math.floor(R() * AUTUMN.length)]
                : (y > 1 ? mixC(leaves, 0xffffff, 0.12) : leaves);
        v.set(x, cy + y, z, jit(c, R, 0.12));
      }
    }
    return meshVox(v, 0.5);
  }

  /** 3x5 digits for the furlong boards. */
  const FONT = {
    0: "111101101101111", 1: "010110010010111", 2: "111001111100111", 3: "111001111001111",
    4: "101101111001001", 5: "111100111001111", 6: "111100111101111", 7: "111001001001001",
    8: "111101111101111", 9: "111101111001111",
  };
  /** A furlong pole: striped post, a board facing the outside with the metres to go. */
  function furlongPole(metres) {
    const v = new Vox(), txt = String(metres), wd = txt.length * 4 + 1;
    for (let y = 0; y < 24; y++) v.set(0, y, 0, (Math.floor(y / 3) & 1) ? 0xd83a3a : 0xf6f6f2);
    // board in the post's plane (local z = along the track), readable from local -x
    for (let i = 0; i < wd; i++) for (let y = 0; y < 7; y++) v.set(-1, 24 + y, i - (wd >> 1), 0xf6f6f2);
    for (let k = 0; k < txt.length; k++) {
      const f = FONT[txt[k]];
      for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++)
        if (f[r * 3 + c] === "1") v.set(-2, 24 + 5 - r, 1 + k * 4 + c - (wd >> 1), 0x2a2a34);
    }
    return meshVox(v, 0.15);
  }

  function buildWorld() {
    world = new THREE.Group(); scene.add(world);
    const M = materials(), rnd = mulberry32(0xc0ffee);

    // sky dome
    const sky = new THREE.SphereGeometry(3000, 32, 16), sp = sky.attributes.position, sc = [];
    for (let i = 0; i < sp.count; i++) {
      const t = clamp(sp.getY(i) / 3000, 0, 1), c = new THREE.Color(mixC(0xd4e8f6, 0x5a9ae0, Math.pow(t, 0.6)));
      sc.push(c.r, c.g, c.b);
    }
    sky.setAttribute("color", new THREE.Float32BufferAttribute(sc, 3));
    SCENERY.sky = new THREE.Mesh(sky, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
    world.add(SCENERY.sky);

    // ground: the painted course, and plain country beyond it
    const far = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000).rotateX(-Math.PI / 2),
      new THREE.MeshLambertMaterial({ color: 0x5c9a3e }));
    far.position.y = -1.2; world.add(far); SCENERY.far = far;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1024, 512).rotateX(-Math.PI / 2),
      new THREE.MeshLambertMaterial({ map: buildGroundTexture() }));
    ground.receiveShadow = true; world.add(ground); SCENERY.ground = ground;
    const water = new THREE.Mesh(new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2),
      new THREE.MeshLambertMaterial({ color: 0x5aa0e0, transparent: true, opacity: 0.55 }));
    water.scale.set(POND.rx * 0.93, 1, POND.rz * 0.93); water.position.set(POND.x, 0.05, POND.z);
    world.add(water);

    // rails: inside and outside of both courses
    const railG = boxGeo([[-0.06, 0, -0.06, 0.06, 0.9, 0.06, 0xe8e8e2], [-0.09, 0.86, -1.3, 0.09, 1.0, 1.3, 0xfafaf6]]);
    for (const [p, off] of [[PATHS.turf, -0.15], [PATHS.turf, TURF.W + 0.15], [PATHS.dirt, -0.15], [PATHS.dirt, DIRT.W + 0.15]])
      addInstanced(world, railG, M.vox, railItems(p, off, 2.6), { chunk: 128, cy: 1, shadow: false });

    // the hedge between the dirt course and the turf rail
    const hedge = new Vox(), hr = mulberry32(7);
    for (let z = 0; z < 8; z++) for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++)
      if (!(y === 2 && (x === 0 || x === 2) && hr() < 0.5)) hedge.set(x - 1, y, z - 4, jit(y === 2 ? 0x4aa040 : 0x3a8a36, hr, 0.12));
    addInstanced(world, meshVox(hedge, 0.42), M.vox, railItems(PATHS.turf, -3.6, 3.36), { chunk: 128, cy: 1, shadow: false });

    // furlong poles, counted back from the finish, inside the turf rail
    for (let k = 1; k * 200 < PATHS.turf.L - 100; k++) {
      const at = PATHS.turf.at(FINISH_S - k * 200, -0.9);
      const m = new THREE.Mesh(furlongPole(k * 200), M.vox);
      m.position.set(at.x, 0, at.z); m.rotation.y = yawOf(at); m.castShadow = true;
      world.add(m);
    }

    // the winning post: tall white pole and the round sign, on both rails
    for (const off of [-0.9, TURF.W + 1]) {
      const at = PATHS.turf.at(FINISH_S, off), v = new Vox();
      v.box(0, 0, 0, 0, 38, 0, 0xf6f6f2);
      for (let y = -6; y <= 6; y++) for (let z = -6; z <= 6; z++) {
        const d = y * y + z * z;
        if (d <= 36) v.set(off < 0 ? -1 : 1, 40 + y, z, d > 20 ? 0xd83a3a : (d > 9 ? 0xf6f6f2 : 0xd83a3a));
      }
      const m = new THREE.Mesh(meshVox(v, 0.12), M.vox);
      m.position.set(at.x, 0, at.z); m.rotation.y = yawOf(at); m.castShadow = true;
      world.add(m);
    }

    buildStands(M, rnd);
    buildVision(M);

    // trees: a ring outside the course (clear of the stands) and a scatter in the infield
    const kinds = [0, 1, 2].map(k => [0, 1].map(s => tree(k, k * 31 + s * 7 + 3)));
    const treeItems = [[], [], [], [], [], []];
    for (let i = 0; i < 520; i++) {
      const x = -560 + rnd() * 1120, z = -300 + rnd() * 600;
      const dT = railDist(x, z, TURF.R), dD = railDist(x, z, DIRT.R);
      const px = (x - POND.x) / POND.rx, pz = (z - POND.z) / POND.rz;
      let ok = false;
      if (dT > TURF.W + 12 && dT < TURF.W + 110) ok = !(z > 0 && x > STAND.x0 - 40 && x < STAND.x1 + 40);
      else if (dD < -8 && px * px + pz * pz > 1.7 && !(Math.abs(z - 64) < 16 && Math.abs(x - 40) < 40)) ok = rnd() < 0.35;
      if (!ok) continue;
      const kind = dD < 0 ? (rnd() < 0.45 ? 2 : 0) : (rnd() < 0.5 ? 1 : 0);
      treeItems[kind * 2 + Math.floor(rnd() * 2)].push({ x, z, yaw: Math.floor(rnd() * 4) * Math.PI / 2, s: 0.9 + rnd() * 0.5 });
    }
    // kept by kind and variant, so applySeason can dress them for the time of year
    SCENERY.trees = treeItems.map((list, i) => ({ kind: i >> 1, variant: i & 1,
      meshes: addInstanced(world, kinds[i >> 1][i & 1], M.vox, list, { chunk: 160, cy: 4 }) }));

    /* Distant hills: a terraced landscape of 40m blocks rising toward the horizon, heights
       smooth from one block to the next so it reads as country rather than a skyline.
       One InstancedMesh, never culled -- some of it is always in view. */
    const hillM = [], hillC = [], hr2 = mulberry32(99);
    for (let ring2 = 0; ring2 < 7; ring2++) {
      const rad = 640 + ring2 * 70, step = 40 / rad;
      for (let a = 0; a < Math.PI * 2; a += step) {
        const wave = Math.sin(a * 3 + 0.6) * 0.5 + Math.sin(a * 7 + ring2 * 0.4) * 0.3 + Math.sin(a * 13) * 0.2;
        const h = Math.max(3, 6 + ring2 * 9 + wave * (10 + ring2 * 9) + hr2() * 4);
        const x = Math.cos(a) * rad * 1.3, z = Math.sin(a) * rad * 0.85;
        hillM.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z),
          new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a), new THREE.Vector3(44, h, 44)));
        hillC.push(jit(mixC(h > 60 ? 0x6a8a5a : 0x5a9844, 0x9ab8c8, ring2 * 0.09), hr2, 0.05));
      }
    }
    const hills = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
      new THREE.MeshLambertMaterial({ color: 0xffffff }), hillM.length);
    const hc = new THREE.Color();
    hillM.forEach((m, i) => { hills.setMatrixAt(i, m); hills.setColorAt(i, hc.setHex(hillC[i])); });
    hills.frustumCulled = false;
    world.add(hills);

    // clouds
    for (let i = 0; i < 16; i++) {
      const v = new Vox(), cr = mulberry32(500 + i);
      for (let k = 0; k < 7; k++) {
        const cx = Math.floor(cr() * 8) - 4, cz = Math.floor(cr() * 6) - 3, w = 2 + Math.floor(cr() * 3);
        v.box(cx - w, 0, cz - 1, cx + w, 1 + Math.floor(cr() * 2), cz + 1, 0xffffff);
      }
      const m = new THREE.Mesh(meshVox(v, 9), new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x506070 }));
      m.position.set(-1400 + cr() * 2800, 170 + cr() * 90, -900 + cr() * 1800);
      world.add(m); clouds.push(m);
    }

    // particles: turf at a gallop, card buffs, and every racer's signature effect
    fx = makeFx(world);

    // the player's marker
    const rv = [];
    for (let i = 0; i < 18; i++) {
      const a = i / 18 * Math.PI * 2, x = Math.cos(a) * 0.72, z = Math.sin(a) * 0.72;
      rv.push([x - 0.07, 0.02, z - 0.07, x + 0.07, 0.07, z + 0.07, 0xffffff]);
    }
    ring = new THREE.Mesh(boxGeo(rv), M.ring);
  }

  function buildStands(M, rnd) {
    // one 24m section, instanced along the home straight
    const v = new Vox(), sr = mulberry32(11), seats = [0x3a6ab8, 0x3a8a9a];
    for (let x = 0; x < 24; x++) {
      for (let y = 0; y < 3; y++) v.set(x, y, 0, jit(0xc8c8c0, sr, 0.03));          // front wall
      for (let r = 0; r < 13; r++) {
        const z0 = 2 + r * 2, top = 3 + r;
        for (let z = z0; z < z0 + 2; z++) for (let y = 0; y <= top; y++)
          v.set(x, y, z, y === top ? (z === z0 ? jit(seats[r & 1], sr, 0.05) : jit(0xd8d8d0, sr, 0.03)) : 0xb8b8b0);
      }
      for (let z = 28; z < 34; z++) for (let y = 0; y < 22; y++) v.set(x, y, z, y > 18 ? 0xe8e8e4 : jit(0xd0d0c8, sr, 0.03));
      for (let z = 5; z < 34; z++) v.set(x, 23, z, z < 7 ? 0x3a5a8a : 0xf2f2ee);      // roof
    }
    for (const x of [0, 23]) for (let y = 15; y < 23; y++) v.set(x, y, 27, 0x9a9aa0); // columns
    const g = meshVox(v, 1);
    const items = [];
    for (let x = STAND.x0; x + 24 <= STAND.x1; x += 24) items.push({ x, z: STAND.z });
    addInstanced(world, g, M.vox, items, { chunk: 128, cy: 12 });

    // the crowd: one voxel column per spectator, cheering by shader
    const fan = new Vox(); fan.box(0, 0, 0, 0, 1, 0, 0xffffff); fan.set(0, 2, 0, 0xf0d0b0);
    const fans = [], shirts = [0xe84a4a, 0x3a6ad8, 0xf2d040, 0xf6f6f6, 0x4ab04a, 0xf08ac0, 0x2a2a34, 0xe88a2a, 0x8a5ad0];
    for (let x = STAND.x0; x + 24 <= STAND.x1; x += 24) for (let r = 0; r < 13; r++)
      for (let i = 0; i < 24; i++) {
        if (rnd() < 0.3) continue;
        const px = x + 0.5 + i * 0.98 + rnd() * 0.2, pz = STAND.z + 2 + r * 2 + 1.3, py = 4 + r;
        fans.push({ x: px, y: py, z: pz, s: 0.32, c: shirts[Math.floor(rnd() * shirts.length)] });
      }
    addInstanced(world, meshVox(fan), cheerMaterial(), fans, { chunk: 128, cy: 10, shadow: false, receive: false });
  }

  /** The big screen in the infield, facing the stands. Shows the running order live. */
  function buildVision(M) {
    const cx = 40, cz = 64, w = 40, h = 12, y0 = 7;
    const frame = boxGeo([
      [-w / 2 - 0.6, y0 - 0.6, -0.8, w / 2 + 0.6, y0 + h + 0.6, 0, 0x3a3a44],
      [-w / 2 + 4, 0, -0.6, -w / 2 + 5.5, y0, 0.0, 0x5a5a64], [w / 2 - 5.5, 0, -0.6, w / 2 - 4, y0, 0.0, 0x5a5a64],
      [-w / 2 - 0.6, y0 + h + 0.6, -0.8, w / 2 + 0.6, y0 + h + 2, 0, 0x2a5a9a],
    ]);
    const fm = new THREE.Mesh(frame, M.vox); fm.position.set(cx, 0, cz); fm.castShadow = true; world.add(fm);
    const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 308;
    const tex = new THREE.CanvasTexture(cv);
    tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, fog: false }));
    scr.position.set(cx, y0 + h / 2, cz + 0.02);
    world.add(scr);
    vision = { cv, ctx: cv.getContext("2d"), tex, at: 0 };
  }

  function paintVision(G) {
    const { ctx, cv } = vision, W = cv.width, H = cv.height;
    ctx.fillStyle = "#0c1a2c"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#1e4a86"; ctx.fillRect(0, 0, W, 62);
    ctx.fillStyle = "#fff"; ctx.font = "800 38px Segoe UI, sans-serif"; ctx.textAlign = "left";
    ctx.fillText(G.course.name, 20, 45);
    ctx.textAlign = "right"; ctx.fillStyle = "#ffd84d";
    const togo = Math.max(0, G.course.distance - G.me.pos);
    ctx.fillText(G.done ? "RESULT" : Math.ceil(togo) + "m", W - 20, 45);
    const order = root.Sim ? root.Sim.standings(G.S) : G.S.racers;
    ctx.textAlign = "left";
    for (let i = 0; i < Math.min(5, order.length); i++) {
      const r = order[i], y = 108 + i * 46;
      ctx.fillStyle = r === G.me ? "#ffd84d" : "#e8eef8";
      ctx.font = "800 34px Segoe UI, sans-serif";
      ctx.fillText(String(i + 1), 26, y);
      ctx.fillStyle = r.color || "#888"; ctx.fillRect(70, y - 28, 12, 34);
      ctx.fillStyle = r === G.me ? "#ffd84d" : "#e8eef8";
      ctx.font = "700 32px Segoe UI, sans-serif";
      ctx.fillText(r.name, 96, y);
    }
    ctx.textAlign = "right"; ctx.fillStyle = "#9fb4d4"; ctx.font = "600 30px Segoe UI, sans-serif";
    ctx.fillText(G.S.t.toFixed(1) + "s", W - 24, H - 22);
    vision.tex.needsUpdate = true;
  }

  // ---------------------------------------------------------------- the starting gate
  const WAKU = [0xf6f6f6, 0x2a2a30, 0xd8303a, 0x3a6ad8, 0xf2d040, 0x3aa04a, 0xf08a2a, 0xf08ac0];
  function buildGate(n) {
    const g = new THREE.Group(), M = materials(), list = [], frame = 0x3a8a4a;
    const u0 = LANE0 - LANE_W / 2, u1 = LANE0 + (n - 0.5) * LANE_W, D = 1.6;
    for (let i = 0; i <= n; i++) {
      const u = u0 + i * LANE_W;
      list.push([-u - 0.07, 0, -D, -u + 0.07, 2.3, D, frame]);
    }
    list.push([-u1 - 0.1, 2.3, -D, -u0 + 0.1, 2.75, D, 0xf2f2ee]);
    list.push([-u1 - 0.4, 0, -D - 0.4, -u1 - 0.1, 2.75, D + 0.4, frame]);
    list.push([-u0 + 0.1, 0, -D - 0.4, -u0 + 0.4, 2.75, D + 0.4, frame]);
    for (let i = 0; i < n; i++) {
      const u = u0 + i * LANE_W, c = WAKU[Math.floor(i * 8 / Math.max(8, n)) % 8];
      list.push([-u - LANE_W + 0.25, 2.4, D, -u - 0.25, 2.68, D + 0.06, c]);
    }
    const fm = new THREE.Mesh(boxGeo(list), M.vox); fm.castShadow = true; fm.receiveShadow = true; g.add(fm);
    const doors = [];
    const dw = LANE_W / 2 - 0.08;
    /* Open frames, like a real gate's: a racer standing in her stall is seen through her
       doors, which is the whole point of the camera walking along them before the off. */
    const door = sgn => {
      const x0 = sgn > 0 ? 0 : -dw, x1 = sgn > 0 ? dw : 0, w = 0.06;
      return boxGeo([
        [x0, 0.25, -0.03, x0 + w, 1.85, 0.03, 0xe8e8e0], [x1 - w, 0.25, -0.03, x1, 1.85, 0.03, 0xe8e8e0],
        [x0, 1.77, -0.03, x1, 1.85, 0.03, 0xe8e8e0], [x0, 0.25, -0.03, x1, 0.33, 0.03, 0xe8e8e0],
        [x0, 1.2, -0.04, x1, 1.3, 0.04, frame],
      ]);
    };
    const doorG = door(1), doorGR = door(-1);
    for (let i = 0; i < n; i++) {
      const uL = u0 + i * LANE_W;                                   // inner edge of this stall
      const a = new THREE.Mesh(doorGR, M.vox), b = new THREE.Mesh(doorG, M.vox);
      a.position.set(-uL - 0.07, 0, D); b.position.set(-(uL + LANE_W) + 0.07, 0, D);
      a.castShadow = b.castShadow = true;
      g.add(a, b); doors.push([a, 1], [b, -1]);
    }
    return { g, doors };
  }

  // ---------------------------------------------------------------- particles
  /* Two pools of voxel particles -- solid cubes, and additive "glow" cubes for light --
     shared by everything that throws something into the air. A particle either lives in
     the world (a trail she leaves behind her) or FOLLOWS a target: its position is an
     offset from wherever the target is now, which is how an aura keeps up with someone
     doing 17 m/s. A target is anything with a live `P` ({x, z, tx, tz, nx, nz}: where she
     is, her heading, and the outward normal), so the race and the lab share all of it. */
  const SHAPE = { cube: 0, flat: 1, streak: 2 };

  function makeFx(parent, N, opts) {
    N = N || 1200;
    // a cutscene films from a couple of metres, not twelve: it scales the signatures down
    const scaleSig = (opts && opts.sigScale) || 1;
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const hide = new THREE.Matrix4().makeScale(0, 0, 0), white = new THREE.Color(1, 1, 1);
    /* "Glow" is unlit and opaque, not additive. Additive light washes every colour to
       white over a sunlit turf -- Special Week's violet came out the same as Oguri's
       silver -- while unlit cubes keep their colour and still read as light against a
       world that is shaded. Solid particles are lit like everything else. */
    const pools = [false, true].map(glow => {
      const mat = glow
        ? new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false })
        : new THREE.MeshLambertMaterial({ color: 0xffffff });
      const mesh = new THREE.InstancedMesh(geo, mat, N);
      mesh.frustumCulled = false;
      if (glow) mesh.renderOrder = 3;
      const p = [];
      for (let i = 0; i < N; i++) { p.push({ life: 0 }); mesh.setMatrixAt(i, hide); mesh.setColorAt(i, white); }
      parent.add(mesh);
      return { mesh, p, next: 0, dirty: true };
    });
    const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S3 = new THREE.Vector3(),
          P3 = new THREE.Vector3(), D3 = new THREE.Vector3(), Z3 = new THREE.Vector3(0, 0, 1), C = new THREE.Color();
    const sigs = [];

    function emit(o) {
      const pool = pools[o.glow ? 1 : 0], i = pool.next;
      pool.next = (i + 1) % N;
      const q = pool.p[i];
      q.x = o.x || 0; q.y = o.y || 0; q.z = o.z || 0;
      q.vx = o.vx || 0; q.vy = o.vy || 0; q.vz = o.vz || 0;
      q.g = o.g || 0; q.drag = o.drag || 0; q.bounce = o.bounce || 0;
      q.life = q.max = o.life || 1; q.size = o.size || 0.08; q.grow = o.grow || 0;
      q.shape = o.shape || 0; q.stretch = o.stretch || 1;
      q.follow = o.follow || null; q.orb = o.orb || null;
      q.wob = o.wob || 0; q.wph = Math.random() * 6.283;
      q.rx = Math.random() * 6.283; q.ry = Math.random() * 6.283;
      q.spin = o.spin != null ? o.spin : 3;
      q.grad = o.grad || null; q.gi = 0;
      pool.mesh.setColorAt(i, C.setHex(q.grad ? q.grad[0] : (o.c != null ? o.c : 0xffffff)));
      pool.dirty = true;
    }

    function step(dt) {
      runSigs(dt);
      for (const pool of pools) {
        const { p, mesh } = pool;
        for (let i = 0; i < N; i++) {
          const q = p[i];
          if (q.life <= 0) continue;
          q.life -= dt;
          if (q.life <= 0) { mesh.setMatrixAt(i, hide); continue; }
          q.vy -= q.g * dt;
          if (q.drag) { const k = Math.exp(-q.drag * dt); q.vx *= k; q.vy *= k; q.vz *= k; }
          if (q.orb) {
            const o = q.orb;
            o.a += o.w * dt; o.r = Math.max(0.05, o.r + o.dr * dt);
            q.x = Math.cos(o.a) * o.r; q.z = Math.sin(o.a) * o.r; q.y += q.vy * dt;
          } else { q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; }
          if (q.y < 0.03) {
            q.y = 0.03;
            if (q.bounce) { q.vy = Math.abs(q.vy) * q.bounce; q.vx *= 0.7; q.vz *= 0.7; } else q.vy = 0;
          }
          let wx = q.x, wz = q.z;
          if (q.follow && q.follow.P) { wx += q.follow.P.x; wz += q.follow.P.z; }
          if (q.wob) wx += Math.sin(q.life * 5 + q.wph) * q.wob;
          const f = q.life / q.max;
          const s = q.size * Math.min(1, f * 3) * (1 + (1 - f) * q.grow);
          if (q.shape === 2) {
            // a streak lies along its own motion -- round the circle, for one in orbit
            if (q.orb) D3.set(-Math.sin(q.orb.a) * q.orb.w * q.orb.r, q.vy, Math.cos(q.orb.a) * q.orb.w * q.orb.r);
            else D3.set(q.vx, q.vy, q.vz);
            if (D3.lengthSq() < 1e-6) D3.set(0, 1, 0);
            Q.setFromUnitVectors(Z3, D3.normalize());
            S3.set(s, s, s * q.stretch);
          } else {
            q.rx += q.spin * dt; q.ry += q.spin * 0.7 * dt;
            Q.setFromEuler(E.set(q.rx, q.ry, 0));
            if (q.shape === 1) S3.set(s * 1.5, s * 0.22, s); else S3.set(s, s, s);
          }
          mesh.setMatrixAt(i, M4.compose(P3.set(wx, q.y, wz), Q, S3));
          if (q.grad) {
            const gi = Math.min(q.grad.length - 1, Math.floor((1 - f) * q.grad.length));
            if (gi !== q.gi) { q.gi = gi; mesh.setColorAt(i, C.setHex(q.grad[gi])); pool.dirty = true; }
          }
        }
        mesh.instanceMatrix.needsUpdate = true;
        if (pool.dirty) { mesh.instanceColor.needsUpdate = true; pool.dirty = false; }
      }
    }

    // -------------------------------------------------- emitter layers
    /* Each signature effect is a list of layers. `open` layers fire once when the skill
       does; `hold` layers keep emitting for as long as it lasts -- at `rate` per second,
       or one shot every `every` seconds. */
    const R = (a, b) => a + Math.random() * (b - a);
    /* Read from the broadcast camera, twelve metres off, a signature has to be bigger and
       denser than it looks right up close in the lab. One knob for all of them. */
    const SIG_SIZE = 1.35, SIG_RATE = 1.4;
    const emitSig = o => { o.size = (o.size || 0.08) * SIG_SIZE * scaleSig; emit(o); };
    // a layer coloured over its life (grad) has no flat palette; its first stop stands in
    const pick = L => L.c ? L.c[Math.floor(Math.random() * L.c.length)] : (L.grad ? L.grad[0] : 0xffffff);
    const LAYER = {
      /** Out from her chest in every direction. */
      burst(L, T, n) {
        for (let i = 0; i < n; i++) {
          const a = R(0, 6.283), e = R(-0.3, 1.2), sp = (L.sp || 5) * R(0.5, 1);
          emitSig({ follow: T, y: L.y || 1.0, vx: Math.cos(a) * Math.cos(e) * sp, vy: Math.sin(e) * sp,
                 vz: Math.sin(a) * Math.cos(e) * sp, g: L.g != null ? L.g : 4, drag: L.drag || 2.2,
                 bounce: L.bounce, life: R(0.6, 1) * (L.life || 1.1), size: (L.size || 0.1) * R(0.7, 1.3),
                 c: pick(L), glow: L.glow, shape: L.shape, stretch: L.stretch, spin: L.spin });
        }
      },
      /** A flat ring racing outward along the ground: a gust, a shockwave, a ripple. */
      ring(L, T, n) {
        for (let i = 0; i < n; i++) {
          const a = i / n * 6.283 + R(0, 0.12), sp = L.sp || 6;
          emitSig({ follow: T, x: Math.cos(a) * 0.3, y: L.y || 0.12, z: Math.sin(a) * 0.3,
                 vx: Math.cos(a) * sp, vy: L.vy || 0, vz: Math.sin(a) * sp, drag: L.drag || 2,
                 life: L.life || 0.8, size: L.size || 0.12, c: pick(L), glow: L.glow,
                 shape: L.shape != null ? L.shape : SHAPE.flat, spin: 0 });
        }
      },
      /** Circling her. A tight, high one is a halo or a crown. */
      orbit(L, T, n) {
        for (let i = 0; i < n; i++)
          emitSig({ follow: T, y: R(L.y0 != null ? L.y0 : 0.3, L.y1 || 1.9), vy: L.vy != null ? L.vy : 0.2,
                 orb: { a: R(0, 6.283), r: R(L.r0 || 0.8, L.r1 || 1.2), w: L.w || 3, dr: L.dr || 0 },
                 life: L.life || 1.2, size: L.size || 0.08, c: pick(L), glow: L.glow,
                 shape: L.shape, stretch: L.stretch, spin: L.spin });
      },
      /** Left behind in the world as she runs: comet tails, exhaust, contrails. */
      trail(L, T, n) {
        const P = T.P, sp = T.speed || 0;
        for (let i = 0; i < n; i++) {
          const b = R(0.3, 0.7), lat = R(-0.35, 0.35);
          emitSig({ x: P.x - P.tx * b + P.nx * lat, y: R(L.y0 || 0.4, L.y1 || 1.6), z: P.z - P.tz * b + P.nz * lat,
                 vx: -P.tx * sp + R(-0.4, 0.4), vy: R(-0.2, 0.5) + (L.vy || 0), vz: -P.tz * sp + R(-0.4, 0.4),
                 g: L.g || 0, drag: L.drag || 1.2, life: R(0.6, 1) * (L.life || 0.9),
                 size: (L.size || 0.1) * R(0.7, 1.2), c: pick(L), grad: L.grad, grow: L.grow,
                 glow: L.glow, shape: L.shape, spin: L.spin });
        }
      },
      /** Anime speed lines rushing past her. */
      streaks(L, T, n) {
        const P = T.P;
        for (let i = 0; i < n; i++) {
          const ahead = R(2, 6), lat = R(-2.2, 2.2);
          if (Math.abs(lat) < 0.55) continue;                     // never through her
          emitSig({ follow: T, x: P.tx * ahead + P.nx * lat, y: R(0.2, 2.4), z: P.tz * ahead + P.nz * lat,
                 vx: -P.tx * (L.sp || 28), vz: -P.tz * (L.sp || 28), life: L.life || 0.35,
                 size: L.size || 0.05, shape: SHAPE.streak, stretch: L.stretch || 14, c: pick(L), glow: L.glow });
        }
      },
      /** Falling from above her and keeping pace: petals, stars, coins. */
      rain(L, T, n) {
        for (let i = 0; i < n; i++) {
          const a = R(0, 6.283), r = Math.sqrt(Math.random()) * (L.r || 1.8);
          emitSig({ follow: T, x: Math.cos(a) * r, y: R(L.y0 || 3, L.y1 || 4.5), z: Math.sin(a) * r,
                 vx: R(-0.3, 0.3) + (L.vx || 0), vy: -(L.sp || 1), vz: R(-0.3, 0.3),
                 g: L.g != null ? L.g : 0.6, drag: L.drag != null ? L.drag : 1.2, bounce: L.bounce,
                 wob: L.wob != null ? L.wob : 0.25, life: L.life || 2.4, size: L.size || 0.1, c: pick(L),
                 glow: L.glow, shape: L.shape != null ? L.shape : SHAPE.flat, stretch: L.stretch,
                 spin: L.spin != null ? L.spin : 4 });
        }
      },
      /** Up from her feet: flames, heat, bubbles. */
      rise(L, T, n) {
        for (let i = 0; i < n; i++) {
          const a = R(0, 6.283), r = R(0, L.r || 0.45);
          emitSig({ follow: T, x: Math.cos(a) * r, y: L.y || 0.1, z: Math.sin(a) * r,
                 vx: R(-0.3, 0.3), vy: R(L.v0 || 1.4, L.v1 || 3), vz: R(-0.3, 0.3),
                 g: L.g != null ? L.g : -0.5, drag: L.drag || 0.8, wob: L.wob || 0,
                 life: R(0.6, 1) * (L.life || 0.8), size: (L.size || 0.1) * R(0.7, 1.3), c: pick(L),
                 grad: L.grad, grow: L.grow, glow: L.glow, shape: L.shape, stretch: L.stretch, spin: L.spin });
        }
      },
      /** A pair of wings spread from her shoulders, feather by feather. */
      wings(L, T, n) {
        const P = T.P;
        for (let i = 0; i < n; i++) {
          const side = Math.random() < 0.5 ? -1 : 1, k = Math.random();
          const back = 0.35 + k * 0.6, out = 0.4 + k * (L.span || 1.9), up = 1.25 + k * 1.1 - k * k * 0.9;
          emitSig({ follow: T, x: -P.tx * back + P.nx * side * out, y: up, z: -P.tz * back + P.nz * side * out,
                 vx: -P.tx * 0.8, vy: -0.3, vz: -P.tz * 0.8, g: 0.3, drag: 1, life: L.life || 0.5,
                 size: (L.size || 0.12) * (1.2 - k * 0.5), c: k > 0.72 && L.tip ? L.tip : pick(L),
                 glow: L.glow, shape: SHAPE.flat, spin: 0.5 });
        }
      },
      /** Gold Ship. Everything, everywhere, bouncing. */
      chaos(L, T, n) {
        for (let i = 0; i < n; i++) {
          const a = R(0, 6.283), sp = R(2, 6);
          emitSig({ follow: T, y: R(0.5, 1.8), vx: Math.cos(a) * sp, vy: R(1, 6), vz: Math.sin(a) * sp,
                 g: 9, drag: 0.6, bounce: 0.55, life: R(0.8, 1.6), size: R(0.06, 0.22), c: pick(L),
                 spin: R(2, 12), shape: Math.random() < 0.3 ? SHAPE.flat : SHAPE.cube });
        }
      },
      /** A jagged bolt from the sky to the turf beside her, and the spark where it lands. */
      bolt(L, T) {
        const a = R(0, 6.283), r = R(0.7, 2.3);
        let x = Math.cos(a) * r, z = Math.sin(a) * r;
        for (let y = L.h || 6; y > 0.05; y -= 0.26) {
          x += R(-0.22, 0.22); z += R(-0.22, 0.22);
          emitSig({ follow: T, x, y, z, life: R(0.28, 0.45), size: L.size || 0.11, c: pick(L), glow: true, spin: 0 });
        }
        for (let i = 0; i < 10; i++) {
          const b = R(0, 6.283), sp = R(1.5, 3.5);
          emitSig({ follow: T, x, y: 0.1, z, vx: Math.cos(b) * sp, vy: R(1, 3), vz: Math.sin(b) * sp,
                 g: 6, drag: 1.5, life: 0.4, size: 0.06, c: pick(L), glow: true });
        }
      },
      /** A shell bursting over her head. */
      fireworks(L, T) {
        const x0 = R(-2.5, 2.5), z0 = R(-2.5, 2.5), y0 = R(3.2, 5), c = pick(L);
        for (let i = 0; i < (L.n || 26); i++) {
          const a = R(0, 6.283), e = R(-1.2, 1.2), sp = R(2.5, 4);
          emitSig({ follow: T, x: x0, y: y0, z: z0, vx: Math.cos(a) * Math.cos(e) * sp, vy: Math.sin(e) * sp,
                 vz: Math.sin(a) * Math.cos(e) * sp, g: 2.2, drag: 1.6, life: R(0.7, 1.1), size: 0.08, c, glow: true });
        }
      },
      /** A pillar of light on her: a spotlight, a summons. */
      column(L, T, n) {
        for (let i = 0; i < n; i++) {
          const a = R(0, 6.283), r = Math.sqrt(Math.random()) * (L.r || 0.8);
          emitSig({ follow: T, x: Math.cos(a) * r, y: R(0, L.h || 6), z: Math.sin(a) * r, vy: R(0.3, 1.2),
                 life: R(0.8, 1.4) * (L.life || 1), size: L.size || 0.07, c: pick(L), glow: true, spin: 1 });
        }
      },
    };
    // shots that are one event (a firework, a bolt) rather than a count of particles
    const SHOT = { bolt: true, fireworks: true };
    const fire = (L, T, n) => LAYER[L.k](L, T, SHOT[L.k] ? 1 : n);

    function runSigs(dt) {
      for (let i = sigs.length - 1; i >= 0; i--) {
        const s = sigs[i];
        if (!s.tgt.alive()) { sigs.splice(i, 1); continue; }
        s.spec.hold.forEach((L, j) => {
          if (L.every) {
            s.acc[j] -= dt;
            if (s.acc[j] <= 0) { s.acc[j] = L.every * R(0.7, 1.3); fire(L, s.tgt, L.n || 1); }
            return;
          }
          s.acc[j] += (L.rate || 20) * SIG_RATE * dt;
          const n = Math.floor(s.acc[j]);
          s.acc[j] -= n;
          if (n) fire(L, s.tgt, n);
        });
      }
    }

    /** Start a racer's signature effect on target `tgt` ({P, alive(), speed}). */
    function signature(name, tgt, look) {
      const spec = sigFor(name, look);
      for (const L of spec.open) fire(L, tgt, L.n || 20);
      sigs.push({ spec, tgt, acc: spec.hold.map(() => 0) });
      return spec;
    }

    function clear() {
      sigs.length = 0;
      for (const pool of pools) { for (const q of pool.p) q.life = Math.min(q.life, 1e-4); }
    }

    /** Fire just her signature's opening layers again -- a cutscene's climax. */
    function flourish(name, tgt, look) {
      for (const L of sigFor(name, look).open) fire(L, tgt, L.n || 20);
    }

    return { emit, step, signature, flourish, clear, get active() { return sigs.length; } };
  }

  // ---------------------------------------------------------------- signature effects
  /* One per Global-launch racer, built from who she is and the real unique she fires
     (rosterdata.js). Each is the racer's moment, so it is meant to be seen from the
     broadcast camera at race speed: big shapes first, detail second. */
  const GOLD = 0xffd84a, WHITE = 0xffffff, PALE = 0xfff4c0;
  const SIG = {
    // Shooting Star: a comet, and stars falling with her
    "Special Week": {
      open: [{ k: "burst", n: 40, c: [GOLD, WHITE, 0xd8b0ff], glow: true, sp: 6 },
             { k: "ring", n: 26, c: [0xc890ff, WHITE], glow: true, sp: 7 }],
      hold: [{ k: "trail", rate: 75, c: [0xffe680, PALE, 0xc890ff], glow: true, size: 0.13, life: 1 },
             { k: "rain", rate: 7, c: [0xfff0a0, WHITE], glow: true, shape: SHAPE.streak, stretch: 5,
               sp: 7, g: 0, drag: 0, vx: -2, life: 0.7, size: 0.06 }] },
    // the silence before anyone else arrives: a gust, wind lines, leaves in her wake
    "Silence Suzuka": {
      open: [{ k: "ring", n: 32, c: [0x9ae8b0, WHITE], glow: true, sp: 8 }],
      hold: [{ k: "streaks", rate: 60, c: [0xe8fff0, 0x9ae8b0], glow: true, size: 0.07 },
             { k: "orbit", rate: 14, c: [0x5ac070, 0x3a9a52], shape: SHAPE.flat, r0: 0.9, r1: 1.4, w: 4, life: 1.2, size: 0.13 }] },
    // the Teio step: blue and gold rising, a ripple under every stride
    "Tokai Teio": {
      open: [{ k: "column", n: 50, c: [0x8ab8ff, WHITE, GOLD] },
             { k: "burst", n: 30, c: [0x3a6ad8, GOLD, 0xf070a8], glow: true }],
      hold: [{ k: "rise", rate: 40, c: [0x8ab8ff, GOLD, WHITE], glow: true, v0: 1.2, v1: 2.6, size: 0.12 },
             { k: "trail", rate: 30, c: [0x8ab8ff, GOLD, WHITE], glow: true, size: 0.1 },
             { k: "ring", every: 0.42, n: 14, c: [0x8ab8ff, 0xf070a8], glow: true, sp: 3, life: 0.4, size: 0.09 }] },
    // the supercar: flame to smoke out of the exhaust, red speed lines
    "Maruzensky": {
      open: [{ k: "burst", n: 30, c: [0xff4a2a, 0xffb040], glow: true },
             { k: "ring", n: 24, c: [0xff6a3a], glow: true, sp: 9 }],
      hold: [{ k: "trail", rate: 70, grad: [0xfff0a0, 0xffb040, 0xff5a2a, 0x8a2a1a, 0x5a5a5a, 0x7a7a7a],
               y0: 0.3, y1: 0.8, grow: 1.6, life: 0.9, size: 0.12 },
             { k: "streaks", rate: 26, c: [0xff8a6a, 0xffd0c0], glow: true }] },
    // the grey monster: lightning, and a pulse like a heartbeat
    "Oguri Cap": {
      open: [{ k: "ring", n: 38, c: [0xbfe0ff, WHITE], glow: true, sp: 10 },
             { k: "burst", n: 24, c: [WHITE, 0x9ad0ff], glow: true }],
      hold: [{ k: "bolt", every: 0.26, c: [0xdff0ff, 0x9ad0ff, WHITE], h: 5.5 },
             { k: "ring", every: 0.9, n: 26, c: [0x9ad0ff], glow: true, sp: 6, life: 0.5 }] },
    // Shooting for Victory!: the gunslinger -- a muzzle flash to open, more on the beat
    // as she fires into the straight, stars and stripes in her wake
    "Taiki Shuttle": {
      open: [{ k: "burst", n: 36, c: [GOLD, WHITE, 0xffb040], glow: true, sp: 10, life: 0.35 },
             { k: "ring", n: 26, c: [0xff3a3a, WHITE, 0x3a7aff], glow: true, sp: 8 }],
      hold: [{ k: "burst", every: 0.32, n: 10, c: [GOLD, WHITE], glow: true, sp: 7, life: 0.22, size: 0.08 },
             { k: "trail", rate: 55, c: [0xff3a3a, WHITE, 0x3a7aff], glow: true, size: 0.11 },
             { k: "rain", rate: 6, c: [WHITE, 0xffe680], glow: true, shape: SHAPE.cube, size: 0.09, spin: 6 }] },
    // Mejiro grace over a stayer's trip: a slow lilac and gold swirl, petals
    "Mejiro McQueen": {
      open: [{ k: "column", n: 40, c: [0xd8c8ff, 0xffe8a0] },
             { k: "ring", n: 28, c: [0xe8d8ff], glow: true }],
      hold: [{ k: "orbit", rate: 22, c: [0xc8b4f0, 0xffe0a0], glow: true, r0: 0.9, r1: 1.3, w: 2, y0: 0.4, y1: 2, vy: 0.25, life: 1.6 },
             { k: "rain", rate: 4, c: [0xe8d8ff, 0xc8b4f0] }] },
    // the Emperor: a golden crown above her, emerald shards turning the other way
    "Symboli Rudolf": {
      open: [{ k: "ring", n: 40, c: [GOLD], glow: true, sp: 7 },
             { k: "column", n: 30, c: [0xffe8a0, 0x6ad08a] }],
      hold: [{ k: "orbit", rate: 28, c: [GOLD, 0xfff0b0], glow: true, r0: 0.48, r1: 0.53, y0: 1.95, y1: 2.0, vy: 0, w: 2.5, life: 1, size: 0.07 },
             { k: "orbit", rate: 10, c: [0x3aa060, GOLD], glow: true, r0: 1.2, r1: 1.6, y0: 0.2, y1: 1.4, w: -1.5,
               shape: SHAPE.streak, stretch: 3, size: 0.06 }] },
    // blue roses, and the dark she runs out of
    "Rice Shower": {
      open: [{ k: "burst", n: 36, c: [0x4a7ae0, 0x8ab0ff], shape: SHAPE.flat, g: 1, sp: 4, life: 1.6 }],
      hold: [{ k: "rain", rate: 20, c: [0x4a7ae0, 0x6a9aff, 0x2a3a90], spin: 3, size: 0.13 },
             { k: "trail", rate: 36, c: [0x4a2a6a, 0x2a1a3a, 0x3a2a5a], y0: 0.2, y1: 1, grow: 1.2, life: 0.8 }] },
    // the stage is hers: a spotlight, then confetti for the rest of the act
    "T.M. Opera O": {
      open: [{ k: "column", n: 80, c: [PALE, 0xffe080], r: 0.9, h: 7 },
             { k: "burst", n: 50, c: [0xf04aa0, GOLD, WHITE, 0x8a4ad0], shape: SHAPE.flat, g: 2, sp: 6, spin: 8, life: 2 }],
      hold: [{ k: "rain", rate: 12, c: [0xf04aa0, GOLD, WHITE, 0x8a4ad0], g: 1, spin: 8 },
             { k: "orbit", rate: 10, c: [GOLD], glow: true }] },
    // there is no plan
    "Gold Ship": {
      open: [{ k: "chaos", n: 60, c: [0xff4a4a, GOLD, 0x4ac0ff, 0x6ad84a, 0xb07ae0, WHITE] }],
      hold: [{ k: "chaos", rate: 30, c: [0xff4a4a, GOLD, 0x4ac0ff, 0x6ad84a, 0xb07ae0, WHITE] },
             { k: "fireworks", every: 1.2, c: [0xff4a4a, GOLD, 0x4ac0ff, 0x6ad84a] }] },
    // Xceleration: the bike -- electric arcs at her heels and exhaust behind
    "Vodka": {
      open: [{ k: "ring", n: 30, c: [0xc8f040], glow: true, sp: 8 },
             { k: "burst", n: 24, c: [0xe0ff60, WHITE], glow: true }],
      hold: [{ k: "bolt", every: 0.45, c: [0xd8ff50, 0xf0ffa0], h: 2.2, size: 0.07 },
             { k: "trail", rate: 45, grad: [0xe0ff60, 0x8ab030, 0x3a3a40, 0x4a4a50], y0: 0.2, y1: 0.6, grow: 1.4, life: 0.8 }] },
    // number one: crimson flames and a sparkle off the tiara
    "Daiwa Scarlet": {
      open: [{ k: "column", n: 40, c: [0xff4a4a, GOLD] },
             { k: "ring", n: 30, c: [0xff3a3a], glow: true }],
      hold: [{ k: "rise", rate: 70, grad: [0xfff0a0, 0xffc040, 0xff5a2a, 0xc0202a], glow: true, r: 0.5, v0: 1.6, v1: 3.2, size: 0.13 },
             { k: "orbit", rate: 6, c: [GOLD, WHITE], glow: true, r0: 0.4, r1: 0.5, y0: 1.95, y1: 2.02, vy: 0, w: 4, size: 0.06 }] },
    // Focused Mind: petals, and a calm ripple under her
    "Grass Wonder": {
      open: [{ k: "burst", n: 40, c: [0xffc0d8, 0xffe0ec, WHITE], shape: SHAPE.flat, g: 0.8, sp: 4, life: 2 },
             { k: "ring", n: 24, c: [0x8ab8ff], glow: true, sp: 5 }],
      hold: [{ k: "rain", rate: 16, c: [0xffb8d0, 0xffd8e8] },
             { k: "ring", every: 1, n: 20, c: [0x8ab8ff], glow: true, sp: 3, life: 0.6, y: 0.05 }] },
    // the condor: red and gold wings spread from her shoulders
    "El Condor Pasa": {
      open: [{ k: "burst", n: 30, c: [0xd8402a, 0xffc040], shape: SHAPE.flat, sp: 5 }],
      hold: [{ k: "wings", rate: 95, c: [0xd8402a, 0xb0301e, 0xf08a2a], tip: GOLD, size: 0.13, life: 0.45 },
             { k: "rain", rate: 3, c: [0xd8402a, 0xf08a2a], y0: 2, y1: 3 }] },
    // the Empress: violet and gold shards turning about her
    "Air Groove": {
      open: [{ k: "ring", n: 30, c: [0xb07ae0], glow: true, sp: 7 },
             { k: "burst", n: 24, c: [0xd8b048, 0x8a5ad0], glow: true, shape: SHAPE.streak, stretch: 3 }],
      hold: [{ k: "orbit", rate: 18, c: [0x8a5ad0, 0xd8b048, 0x6a6aa0], glow: true, shape: SHAPE.streak, stretch: 3,
               r0: 1, r1: 1.4, w: 3.5, y0: 0.3, y1: 1.9 }] },
    // the jet: a sonic boom, a contrail, the afterburner
    "Mayano Top Gun": {
      open: [{ k: "ring", n: 42, c: [WHITE, 0xd8e8ff], glow: true, sp: 11, y: 1 }],
      hold: [{ k: "trail", rate: 70, c: [WHITE, 0xeef4ff], y0: 1.2, y1: 1.5, grow: 2, life: 1.4, drag: 2 },
             { k: "trail", rate: 36, grad: [WHITE, 0xffd040, 0xff8a2a], glow: true, y0: 0.8, y1: 1.1, life: 0.35 }] },
    // gentle: bubbles rising, a soft blue ring, ribbons
    "Super Creek": {
      open: [{ k: "ring", n: 28, c: [0x8ac8ff], glow: true, sp: 5 }],
      hold: [{ k: "rise", rate: 28, c: [0xbfe6ff, 0x8ac8ff, WHITE], glow: true, wob: 0.2, v0: 0.6, v1: 1.4, g: -0.2, life: 1.8, size: 0.12 },
             { k: "orbit", rate: 8, c: [0x3a5ad0, 0x8ab8ff], shape: SHAPE.flat, r0: 0.9, r1: 1, size: 0.11 }] },
    // muscle: a dust shockwave, then a stamp of dust with every stride
    "Mejiro Ryan": {
      open: [{ k: "ring", n: 40, c: [0xd8b890, 0xc0a070], shape: SHAPE.cube, sp: 9, life: 0.7 },
             { k: "burst", n: 20, c: [0xffa040, 0x3aa0a0], glow: true }],
      hold: [{ k: "ring", every: 0.4, n: 14, c: [0xc8a878, 0xb09060], shape: SHAPE.cube, sp: 4, life: 0.45, size: 0.1 },
             { k: "rise", rate: 20, c: [0xff9a3a, 0xffc070], glow: true }] },
    // the experiment: bubbling green and violet, and lines faster than light
    "Agnes Tachyon": {
      open: [{ k: "burst", n: 36, c: [0x6aff8a, 0xc07aff], glow: true }],
      hold: [{ k: "rise", rate: 22, c: [0x7aff9a, 0xb070ff, 0x4ad8ff], glow: true, wob: 0.25, v0: 0.5, v1: 1.4, life: 1.4, grow: 1 },
             { k: "streaks", rate: 30, c: [0xb070ff, 0xd8b0ff], glow: true, sp: 40, stretch: 18 }] },
    // all heart: fireworks over her the whole way
    "Winning Ticket": {
      open: [{ k: "fireworks", c: [0xff4a4a, 0x4ad86a, GOLD] }, { k: "fireworks", c: [0x4a8aff, GOLD] },
             { k: "burst", n: 24, c: [0xff5a3a, GOLD], glow: true }],
      hold: [{ k: "fireworks", every: 0.45, n: 30, c: [0xff4a4a, 0x4ad86a, GOLD, 0x4a8aff] },
             { k: "rise", rate: 15, c: [0xff5a3a, 0xffa040], glow: true }] },
    // BAKUSHIN: a sakura explosion and a pink blaze
    "Sakura Bakushin O": {
      open: [{ k: "burst", n: 60, c: [0xffb0cc, 0xff80b0, WHITE], shape: SHAPE.flat, sp: 7, g: 1, life: 2, spin: 6 },
             { k: "ring", n: 30, c: [0xff70a8], glow: true, sp: 9 }],
      hold: [{ k: "trail", rate: 80, c: [0xff80b0, 0xffc0d8], glow: true, size: 0.12 },
             { k: "streaks", rate: 34, c: [0xffd0e4], glow: true },
             { k: "rain", rate: 6, c: [0xffb0cc, 0xffd8e8] }] },
    // Super-Duper Stoked: bouncy pink and yellow, like she is
    "Haru Urara": {
      open: [{ k: "burst", n: 40, c: [0xff8ab8, 0xffe060, WHITE], glow: true, sp: 4, g: 6, bounce: 0.6, life: 1.6 }],
      hold: [{ k: "burst", rate: 24, c: [0xff8ab8, 0xffe060], glow: true, sp: 2.5, g: 7, bounce: 0.7, y: 0.3, life: 1.2, size: 0.1 },
             { k: "rise", rate: 8, c: [0xff9ac0, WHITE], glow: true, v0: 0.8, v1: 1.5, wob: 0.2 }] },
    // fortune: a crystal ball's glow circling her, and coins raining
    "Matikanefukukitaru": {
      open: [{ k: "column", n: 36, c: [0xb090ff, 0x8ad8ff] },
             { k: "burst", n: 30, c: [GOLD, 0xf0b030], shape: SHAPE.flat, g: 6, bounce: 0.5, spin: 10 }],
      hold: [{ k: "rain", rate: 10, c: [GOLD, 0xffe880], g: 6, drag: 0.2, bounce: 0.45, spin: 10, sp: 2, wob: 0 },
             { k: "orbit", rate: 12, c: [0xb090ff, 0x8ad8ff], glow: true, r0: 0.9, r1: 1.1, y0: 1, y1: 1.6, w: 2.2 }] },
    // nothing flashy -- holly-green and berry-red leaves, and a warm glow
    "Nice Nature": {
      open: [{ k: "ring", n: 24, c: [0x6ad86a, 0xff5a4a], glow: true, sp: 5 }],
      hold: [{ k: "rain", rate: 16, c: [0x5ab84a, 0xd8302a, 0x2a8a3a], size: 0.13 },
             { k: "rise", rate: 20, c: [0xffd890, 0xffe8c0], glow: true },
             { k: "ring", every: 0.9, n: 18, c: [0x6ad86a, 0xff5a4a], glow: true, sp: 4, life: 0.6 }] },
    // the king of emeralds: a green crown, emerald shards rising
    "King Halo": {
      open: [{ k: "ring", n: 32, c: [0x3ad88a], glow: true, sp: 7 },
             { k: "burst", n: 28, c: [0x3ad88a, WHITE, GOLD], glow: true }],
      hold: [{ k: "orbit", rate: 18, c: [0x3ad88a, 0xb0ffd0], glow: true, r0: 0.48, r1: 0.53, y0: 1.95, y1: 2.0, vy: 0, w: 3, size: 0.07 },
             { k: "rise", rate: 14, c: [0x2ab870, 0xc0ffe0], glow: true, shape: SHAPE.streak, stretch: 2.5 }] },
  };

  /** Anyone not in SIG still gets something of her own, in her outfit's colours. */
  function sigFor(name, look) {
    const s = SIG[String(name || "").replace(/​/g, "")];
    if (s) return s;
    const L = look || lookFor(name);
    return { open: [{ k: "burst", n: 36, c: [L.top, L.trim || WHITE, WHITE], glow: true }],
             hold: [{ k: "rise", rate: 18, c: [L.top, L.hair, WHITE], glow: true }] };
  }

  // ---------------------------------------------------------------- per race
  // ---------------------------------------------------------------- seasons and weather
  /* A career race is run in its turn's season and weather (Career.weatherOf, carried on
     G.career.weather). The course dresses for it -- the trees (see tree), the grass, the
     sky, the fog and the light -- and the weather falls around the camera: rain, snow,
     sakura petals in spring, leaves in autumn. Anything else (exhibitions, the title race,
     the tutorials) keeps the course's own look. */
  const SKY = {                                          // [horizon, overhead]
    clear:  [0xd4e8f6, 0x5a9ae0],
    cloudy: [0xc6ced6, 0x8894a2],
    rain:   [0x9aa3ac, 0x58626c],
    snow:   [0xdde4ec, 0xa6b2c0],
  };
  const SEASON_SKY = { autumn: [0xe6dfd0, 0x5c96d6], winter: [0xdbe6f0, 0x6c9ed4] };   // clear days
  const FOG_AT = { clear: [260, 1500], cloudy: [220, 1200], rain: [120, 700], snow: [90, 620] };
  const SUN_I = { clear: 0.7, cloudy: 0.38, rain: 0.28, snow: 0.34 };
  const HEMI_I = { clear: 0.55, cloudy: 0.62, rain: 0.56, snow: 0.72 };
  const SUN_C = { null: 0xfff2da, spring: 0xfff2da, summer: 0xfff6e2, autumn: 0xffe2b8, winter: 0xeef2ff };
  // the country beyond the rails, and a tint over the course's own painted grass
  const FAR_C = { null: 0x5c9a3e, spring: 0x62a242, summer: 0x4f9236, autumn: 0x8a9646, winter: 0x948f62 };
  const GRASS_TINT = { null: 0xffffff, spring: 0xffffff, summer: 0xf4fbea, autumn: 0xf2ecd2, winter: 0xe4dcc0 };
  const seasonTrees = {};

  function applySeason(w) {
    if (!SCENERY.sky) return;
    const season = w ? w.season : null, weather = w ? w.weather : "clear";
    if (SCENERY.season === season && SCENERY.weather === weather) return setWeatherFx(wxKindOf(w));
    if (SCENERY.season !== season) {
      const key = String(season);
      if (!seasonTrees[key]) seasonTrees[key] = [0, 1, 2].map(k => [0, 1].map(s => tree(k, k * 31 + s * 7 + 3, season)));
      for (const t of SCENERY.trees) {
        if (!t.meshes.length) continue;
        // one geometry per kind, shared by its chunks as addInstanced shares it, keeping their bounds
        const old = t.meshes[0].geometry, g = seasonTrees[key][t.kind][t.variant].clone();
        g.boundingSphere = old.boundingSphere;
        for (const im of t.meshes) im.geometry = g;
        old.dispose();
      }
    }
    // the sky dome, and the fog and clear colour to match its horizon
    const [lo, hi] = (weather === "clear" && SEASON_SKY[season]) || SKY[weather] || SKY.clear;
    const pos = SCENERY.sky.geometry.attributes.position, col = SCENERY.sky.geometry.attributes.color, c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      c.setHex(mixC(lo, hi, Math.pow(clamp(pos.getY(i) / 3000, 0, 1), 0.6)));
      col.setXYZ(i, c.r, c.g, c.b);
    }
    col.needsUpdate = true;
    if (w) { scene.fog.color.setHex(lo); renderer.setClearColor(lo); }
    else { scene.fog.color.setHex(0xcfe2f0); renderer.setClearColor(0xa8d0ee); }    // the course's own
    [scene.fog.near, scene.fog.far] = FOG_AT[weather] || FOG_AT.clear;
    // the light: weaker and greyer under cloud, warm in autumn, cool in winter
    sun.intensity = SUN_I[weather]; sun.color.setHex(SUN_C[season]);
    hemi.intensity = HEMI_I[weather]; hemi.color.setHex(weather === "clear" ? 0xeef6ff : 0xdde3ea);
    // the grass: dormant and straw-coloured in winter, darker in the wet, white under snow
    SCENERY.far.material.color.setHex(weather === "snow" ? 0xe8eef2 : FAR_C[season]);
    SCENERY.ground.material.color.setHex(weather === "rain" ? mixC(GRASS_TINT[season], 0x8a96a0, 0.35)
                                        : weather === "snow" ? 0xc8ced4 : GRASS_TINT[season]);
    // under snow the painted grass is lifted toward white: a tint alone can only darken it
    SCENERY.ground.material.emissive.setHex(weather === "snow" ? 0x7a8088 : 0x000000);
    SCENERY.season = season; SCENERY.weather = weather;
    setWeatherFx(wxKindOf(w));
  }

  /* What falls: the weather first, then the season's own. Square, like everything else. */
  const WX_KIND = {
    rain:   { n: 700, s: [0.025, 0.75, 0.025], v: [-1.2, -22, -0.4], jit: 1.5, c: [0xc8d4e2, 0xaab8c8] },
    snow:   { n: 520, s: [0.16, 0.16, 0.16], v: [0, -1.6, 0], jit: 0.6, wob: 0.8, c: [0xffffff, 0xf4f8fc] },
    petals: { n: 240, s: [0.2, 0.03, 0.15], v: [0.6, -1.0, 0.3], jit: 0.4, wob: 1.0, spin: true, c: [0xf6b8cc, 0xf2a2bc, 0xfbd2de] },
    leaves: { n: 200, s: [0.22, 0.03, 0.16], v: [0, -1.6, 0], jit: 0.6, wob: 1.2, spin: true, c: AUTUMN },
  };
  const wxKindOf = w => !w ? null : w.weather === "rain" ? "rain" : w.weather === "snow" ? "snow"
                      : w.season === "spring" ? "petals" : w.season === "autumn" ? "leaves" : null;
  const WX_BOX = { x: 40, y: 22, z: 40 };                // the box round the camera they fall in
  const WX = { mesh: null, parts: [], kind: null, n: 0, K: null };
  function setWeatherFx(kind) {
    if (WX.kind === kind && (!kind || WX.mesh)) return;
    WX.kind = kind;
    if (WX.mesh) WX.mesh.visible = false;
    if (!kind || !scene) return;
    const K = WX_KIND[kind];
    let n = K.n;
    if (LOW_POWER) n = Math.round(n * 0.5);              // a phone, or a small CPU
    if (gov.level >= 2) n = Math.round(n * 0.5);         // and again if the frames are struggling
    if (!WX.mesh) {
      WX.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), 700);
      WX.mesh.frustumCulled = false; WX.mesh.castShadow = false; WX.mesh.receiveShadow = false;
      scene.add(WX.mesh);
    }
    const cam = camera.position, c = new THREE.Color(), R = (a, b) => a + Math.random() * (b - a);
    WX.parts = [];
    for (let i = 0; i < n; i++) {
      WX.parts.push({ x: cam.x + R(-0.5, 0.5) * WX_BOX.x, y: Math.max(0, cam.y) + R(0, WX_BOX.y), z: cam.z + R(-0.5, 0.5) * WX_BOX.z,
                      vx: K.v[0] + R(-0.5, 0.5) * K.jit, vy: K.v[1] * R(0.8, 1.2), vz: K.v[2] + R(-0.5, 0.5) * K.jit,
                      ph: R(0, 6.28), a: R(0, 6.28), va: K.spin ? R(-2.5, 2.5) : 0 });
      WX.mesh.setColorAt(i, c.setHex(K.c[i % K.c.length]));
    }
    WX.mesh.instanceColor.needsUpdate = true;
    WX.mesh.count = n; WX.n = n; WX.K = K; WX.mesh.visible = true;
  }
  const wxM = new THREE.Matrix4(), wxQ = new THREE.Quaternion(), wxE = new THREE.Euler(),
        wxS = new THREE.Vector3(), wxP = new THREE.Vector3();
  function stepWeather(dt) {
    if (!WX.kind || !WX.mesh || !WX.mesh.visible) return;
    const K = WX.K, cam = camera.position, hx = WX_BOX.x / 2, hz = WX_BOX.z / 2, floor = Math.max(0, cam.y - WX_BOX.y / 2);
    for (let i = 0; i < WX.n; i++) {
      const p = WX.parts[i];
      p.ph += dt; p.a += p.va * dt;
      p.x += (p.vx + (K.wob ? Math.sin(p.ph * 1.3) * K.wob : 0)) * dt;
      p.y += p.vy * dt;
      p.z += (p.vz + (K.wob ? Math.cos(p.ph) * K.wob * 0.6 : 0)) * dt;
      // what drifts out of the box round the camera comes back in the other side
      if (p.x < cam.x - hx) p.x += WX_BOX.x; else if (p.x > cam.x + hx) p.x -= WX_BOX.x;
      if (p.z < cam.z - hz) p.z += WX_BOX.z; else if (p.z > cam.z + hz) p.z -= WX_BOX.z;
      if (p.y < floor) p.y += WX_BOX.y; else if (p.y > floor + WX_BOX.y) p.y -= WX_BOX.y;
      if (K.spin) wxQ.setFromEuler(wxE.set(p.a, p.a * 0.7, p.a * 0.4)); else wxQ.identity();
      WX.mesh.setMatrixAt(i, wxM.compose(wxP.set(p.x, p.y, p.z), wxQ, wxS.set(K.s[0], K.s[1], K.s[2])));
    }
    WX.mesh.instanceMatrix.needsUpdate = true;
  }

  function setupRace(stage, G, opts) {
    if (!ensureRenderer(stage)) return false;
    applySeason(!(opts && opts.attract) && G.career && G.career.weather ? G.career.weather : null);
    attract = !!(opts && opts.attract);
    for (const { m } of racers.values()) raceGroup.remove(m.root);
    racers = new Map();
    if (gate) raceGroup.remove(gate.g);
    course = G.course;
    path = course.surface === "dirt" ? PATHS.dirt : PATHS.turf;
    startS = FINISH_S - course.distance;
    laneCount = G.S.laneCount;
    gate = buildGate(laneCount);
    const ga = path.at(startS, 0);
    gate.g.position.set(ga.x, 0, ga.z); gate.g.rotation.y = yawOf(ga);
    raceGroup.add(gate.g);
    for (const r of G.S.racers) {
      const m = makeRacer(r.name, r.color);
      raceGroup.add(m.root);
      racers.set(r, { m, extra: 0, vc: 0 });
    }
    const mine = racers.get(G.me);
    if (ring && ring.parent) ring.parent.remove(ring);
    if (mine && !attract) mine.m.root.add(ring);
    camFresh = true; lastWall = 0; lastSimT = G.S.t; animT = 0; orbit = 0; feel = 0; intro = null;
    dir.name = null; dir.last = []; dir.usedHead = false; dir.heroAt = -1;
    fx.clear();
    vision.at = -1;
    render(G, performance.now());
    return true;
  }

  const tmpA = {}, V2 = new THREE.Vector2(), V3 = new THREE.Vector3(), V3b = new THREE.Vector3();
  function racerPoint(rec, r, out) {
    return path.at(startS + r.pos + rec.extra, LANE0 + r.lane * LANE_W, out);
  }

  // ---------------------------------------------------------------- the camera director
  /* "Auto" is a director rather than a camera: it cuts between shots the way a racing
     broadcast does, and what it reaches for depends on where the race is. Tracking shots
     ride along with her; fixed shots (a camera on the rail, the long lens down the home
     straight, the one at the winning post) stay put and let the field rush past, which
     says more about speed than any camera that keeps pace. The manual cameras are still
     there on V for anyone who would rather hold one view. */
  const SHOT_LEN = { side: 7, sideLow: 4.5, chaseLow: 5, aerial: 6, leaderFront: 4.5, railCam: 7,
                     turnCrane: 6.5, hero: 3.4, headOn: 8, sprint: 4.5 };
  const dir = { name: null, t0: 0, len: 0, fixed: null, fixedS: 0, last: [], usedHead: false, heroAt: -1 };
  const CT = { pos: V3, look: V3b, focus, span: 36, fov: 42, smooth: true, cut: false, shake: 0 };
  const tmpL = {}, tmpC = {}, tmpF = {};
  let intro = null;

  /** The pre-race sweep (index.html's preRace): the field standing in the gate. */
  function startIntro() { intro = { t0: performance.now(), i: -1 }; dir.name = null; camFresh = true; }
  function endIntro() { if (!intro) return; intro = null; dir.name = null; camFresh = true; }

  const ease = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const setP = (v, p, h) => v.set(p.x, h, p.z);

  function introShot(G, now) {
    const plan = [["aerial", 5.5], ["stalls", 6], ["heroStall", 4.5], ["behind", 4]];
    const total = plan.reduce((a, p) => a + p[1], 0);
    let t = ((now - intro.t0) / 1000) % total, i = 0;
    while (t > plan[i][1]) { t -= plan[i][1]; i++; }
    const k = t / plan[i][1];
    if (i !== intro.i) { intro.i = i; CT.cut = true; }
    const mid = LANE0 + (laneCount - 1) * LANE_W / 2, G0 = path.at(startS, mid, tmpC);
    CT.smooth = false; CT.span = 40;
    switch (plan[i][0]) {
      case "aerial": {                     // high and wide, swinging round to the gate
        const a = 0.35 + ease(k) * 1.0, R = 58 - k * 16;
        CT.pos.set(G0.x + (G0.tx * Math.cos(a) + G0.nx * Math.sin(a)) * R, 30 - k * 12,
                   G0.z + (G0.tz * Math.cos(a) + G0.nz * Math.sin(a)) * R);
        CT.look.set(G0.x, 1, G0.z); CT.fov = 40; CT.span = 60;
        break;
      }
      case "stalls": {                     // along the front of the gate, face by face
        const off = (LANE0 - 1.5) + ease(k) * ((laneCount - 1) * LANE_W + 3);
        setP(CT.pos, path.at(startS + 4.4, off, tmpF), 1.45);
        setP(CT.look, path.at(startS, off, tmpF), 1.2);
        CT.fov = 40;
        break;
      }
      case "heroStall": {                  // in on her, in her stall
        const off = LANE0 + G.me.lane * LANE_W;
        setP(CT.pos, path.at(startS + 3.6 - k * 1.3, off + 0.55, tmpF), 1.5);
        setP(CT.look, path.at(startS, off, tmpF), 1.35);
        CT.fov = 34;
        break;
      }
      default: {                           // behind and above the gate, down the track
        setP(CT.pos, path.at(startS - 12 - k * 3, mid, tmpF), 6.5 + k);
        setP(CT.look, path.at(startS + 40, mid, tmpF), 0);
        CT.fov = 46; CT.span = 50;
      }
    }
  }

  function pickShot(pool) {
    const fresh = pool.filter(n => !dir.last.includes(n));
    const from = fresh.length ? fresh : pool;
    return from[Math.floor(Math.random() * from.length)];
  }

  function startShot(name, now, ctx) {
    dir.name = name; dir.t0 = now; CT.cut = true;
    dir.len = (SHOT_LEN[name] || 6) * (0.85 + Math.random() * 0.3);
    dir.last.unshift(name); dir.last.length = Math.min(dir.last.length, 2);
    dir.fixed = null;
    const off = path === PATHS.turf ? TURF.W : DIRT.W;
    if (name === "railCam") { dir.fixedS = ctx.meS + 30; dir.fixed = path.at(dir.fixedS, -1.4, {}); dir.fixed.h = 0.9; }
    if (name === "headOn") { dir.fixedS = ctx.leadS + 75; dir.fixed = path.at(dir.fixedS, off * 0.5, {}); dir.fixed.h = 2.3; }
    if (name === "finish") { dir.fixedS = startS + ctx.dist + 4; dir.fixed = path.at(dir.fixedS, off + 4.5, {}); dir.fixed.h = 1.6; }
  }

  function directed(G, rec, P, now) {
    const S = G.S, me = G.me, v = me.v;
    const order = root.Sim ? root.Sim.standings(S) : S.racers;
    const lead = order[0], lrec = racers.get(lead) || rec;
    const LP = racerPoint(lrec, lead, tmpL);
    const ctx = { meS: startS + me.pos + rec.extra, leadS: startS + lead.pos + lrec.extra, dist: G.course.distance };
    const remain = G.course.distance - me.pos, leadRemain = G.course.distance - lead.pos;
    const onTurn = Math.abs(P.tx) < 0.995 && Math.abs(P.tz) < 0.995;
    const el = (now - dir.t0) / 1000;
    let expired = !dir.name || el > dir.len;
    if (dir.name === "railCam" && ctx.meS > dir.fixedS + 8) expired = true;
    if (dir.name === "headOn" && ctx.leadS > dir.fixedS - 24) expired = true;

    let want = dir.name;
    if (S.t < 2.4) want = "gateBreak";
    else if (dir.heroAt > 0 && now - dir.heroAt < 120 && dir.name !== "hero" && remain > 150) want = "hero";
    else if (remain < 150 && !me.finished) want = "finish";
    /* The long lens is THE shot of a race broadcast, so it does not wait its turn: the
       moment the leader is into the home straight, cut to it. */
    else if (!dir.usedHead && leadRemain < 420 && leadRemain > 190 && dir.name !== "hero") { dir.usedHead = true; want = "headOn"; }
    else if (expired || dir.name === "gateBreak") {
      if (remain < 520) want = pickShot(["sprint", "chaseLow", "side", "hero"]);
      else if (onTurn) want = pickShot(["turnCrane", "aerial", "side", "chaseLow"]);
      else want = pickShot(["side", "chaseLow", "aerial", "sideLow", "leaderFront", "railCam"]);
    }
    if (want !== dir.name) startShot(want, now, ctx);
    const k = clamp((now - dir.t0) / 1000 / dir.len, 0, 1);
    const tx = P.tx, tz = P.tz, nx = P.nx, nz = P.nz;
    const kick = clamp((v - 15) * 1.2, 0, 7);
    CT.smooth = true; CT.fov = 42; CT.span = 34; CT.shake = 0;
    switch (dir.name) {
      case "gateBreak": {
        const ga = path.at(startS, LANE0 + (laneCount - 1) * LANE_W / 2, tmpC);
        CT.pos.set(ga.x + ga.tx * 15 + ga.nx * 9, 4.6, ga.z + ga.tz * 15 + ga.nz * 9);
        CT.look.set((ga.x + LP.x) / 2, 1.2, (ga.z + LP.z) / 2);
        CT.smooth = false;
        break;
      }
      case "side":
        CT.pos.set(P.x + nx * 11.5 - tx * 5, 4.4, P.z + nz * 11.5 - tz * 5);
        CT.look.set(P.x + tx * 3, 0.9, P.z + tz * 3);
        break;
      case "sideLow":
        CT.pos.set(P.x + nx * 5.5 - tx * 1.8, 1.0, P.z + nz * 5.5 - tz * 1.8);
        CT.look.set(P.x + tx * 5, 1.0, P.z + tz * 5);
        CT.fov = 50 + kick; CT.shake = 0.035;
        break;
      case "chaseLow":
        CT.pos.set(P.x - tx * 5.2 + nx * 0.7, 1.45, P.z - tz * 5.2 + nz * 0.7);
        CT.look.set(P.x + tx * 12, 1.0, P.z + tz * 12);
        CT.fov = 54 + kick; CT.shake = 0.03;
        break;
      case "aerial": {
        // the pack, not only her: the middle of everyone within 45m
        let s = 0, l = 0, n = 0;
        for (const r of S.racers) {
          const d = r.pos - me.pos;
          if (Math.abs(d) < 45) { s += r.pos; l += r.lane; n++; }
        }
        const C = path.at(startS + s / n + rec.extra, LANE0 + (l / n) * LANE_W, tmpC);
        CT.pos.set(C.x + C.nx * 24 - C.tx * 16, 21, C.z + C.nz * 24 - C.tz * 16);
        CT.look.set(C.x + C.tx * 8, 0, C.z + C.tz * 8);
        CT.fov = 40; CT.span = 55;
        break;
      }
      case "leaderFront":
        CT.pos.set(LP.x + LP.tx * 9.5 + LP.nx * 2.8, 1.9, LP.z + LP.tz * 9.5 + LP.nz * 2.8);
        CT.look.set(LP.x - LP.tx * 7, 0.9, LP.z - LP.tz * 7);
        CT.fov = 44;
        break;
      case "turnCrane":
        CT.pos.set(P.x - nx * 22 + tx * 3, 14, P.z - nz * 22 + tz * 3);
        CT.look.set(P.x + tx * 5, 0.5, P.z + tz * 5);
        CT.span = 45;
        break;
      case "hero": {                       // her moment: a slow swing round her
        const a = 0.95 - ease(k) * 1.35, R = 4.6;
        CT.pos.set(P.x + (tx * Math.cos(a) + nx * Math.sin(a)) * R, 1.45, P.z + (tz * Math.cos(a) + nz * Math.sin(a)) * R);
        CT.look.set(P.x, 1.15, P.z);
        CT.fov = 38;
        break;
      }
      case "sprint":                       // low and close, the camera falling behind her
        CT.pos.set(P.x + nx * 4.2 + tx * (1.5 - k * 3), 0.8, P.z + nz * 4.2 + tz * (1.5 - k * 3));
        CT.look.set(P.x + tx * 2, 1.1, P.z + tz * 2);
        CT.fov = 52 + kick; CT.shake = 0.04;
        break;
      case "railCam": {                    // on the inside rail; the field goes by
        const F = dir.fixed;
        CT.pos.set(F.x, F.h, F.z); CT.look.set(P.x, 1.0, P.z);
        CT.fov = 36; CT.smooth = false;
        break;
      }
      case "headOn": {                     // the long lens down the straight
        const F = dir.fixed, d = Math.hypot(LP.x - F.x, LP.z - F.z);
        CT.pos.set(F.x, F.h, F.z);
        // on the leader, leaning toward her if she is close enough to share the frame
        const w = Math.hypot(LP.x - P.x, LP.z - P.z) < 25 ? 0.35 : 0;
        CT.look.set(LP.x + (P.x - LP.x) * w, 1.0, LP.z + (P.z - LP.z) * w);
        CT.fov = clamp(3 + d * 0.1, 7, 20); CT.smooth = false; CT.span = 50;
        break;
      }
      case "finish": {                     // at the winning post, as they arrive
        const F = dir.fixed;
        CT.pos.set(F.x, F.h, F.z); CT.look.set(P.x, 1.0, P.z);
        CT.fov = clamp(18 + (1 - remain / 150) * 28, 18, 46); CT.smooth = false;
        break;
      }
    }
  }

  function cameraGoal(G, dt, now) {
    const rec = racers.get(G.me), P = racerPoint(rec, G.me, tmpA);
    const tx = P.tx, tz = P.tz, nx = P.nx, nz = P.nz;
    const pos = V3, look = V3b;
    focus.set(P.x, 0, P.z);
    CT.span = 36; CT.fov = 42; CT.smooth = true; CT.cut = false; CT.shake = 0;
    if (intro) { introShot(G, now); return CT; }
    // home: round her as she pulls up, the rest of the field coming in behind her (behind
    // the title, where "her" is anyone, only once they are all in)
    if (G.me.finished && (G.done || !attract)) {
      if (dir.name !== "orbit") { dir.name = "orbit"; CT.cut = true; }
      orbit += dt * 0.22;
      const a = orbit + Math.atan2(nz, nx);
      pos.set(P.x + Math.cos(a) * 8.5, 3.2, P.z + Math.sin(a) * 8.5);
      look.set(P.x, 1.1, P.z);
      CT.span = 30; CT.fov = 40;
      return CT;
    }
    if (camName() === "Auto") { directed(G, rec, P, now); return CT; }
    if (G.S.t < 2.4 && !G.done) {
      const ga = path.at(startS, LANE0 + (laneCount - 1) * LANE_W / 2);
      pos.set(ga.x + ga.tx * 15 + ga.nx * 9, 4.6, ga.z + ga.tz * 15 + ga.nz * 9);
      look.set(ga.x, 1.2, ga.z);
      CT.span = 30;
      return CT;
    }
    switch (camName()) {
      case "Chase":
        pos.set(P.x - tx * 6.5 + nx * 0.8, 2.5, P.z - tz * 6.5 + nz * 0.8);
        look.set(P.x + tx * 9, 1.0, P.z + tz * 9);
        CT.span = 30;
        return CT;
      case "Field":
        pos.set(P.x + nx * 46 - tx * 30, 44, P.z + nz * 46 - tz * 30);
        look.set(P.x + tx * 8, 0, P.z + tz * 8);
        CT.span = 70;
        return CT;
      default:
        pos.set(P.x + nx * 11.5 - tx * 5, 4.4, P.z + nz * 11.5 - tz * 5);
        look.set(P.x + tx * 3, 0.9, P.z + tz * 3);
        return CT;
    }
  }

  /* ---- after the line
     How she takes it, once she has pulled up: her own reaction to her place (reactions.js
     picks one of hers, at random, each race), played over pose() and blended in as she
     slows -- the winner's straight away, at the line. Then she turns: to the cameras to
     perform, half away to sulk. And she says her piece, once she has stopped (sayingOf,
     drawn by index.html over her plate). Each move sets her limbs for this frame; `A` has
     the clock, how far into it she is (k), whether she has stopped (still), and the puff()
     that throws up sparkles, sweat, gloom or dust round her. */
  const MOVES = {
    cheer(m, A) {                                    // both arms up, waving, jumping
      const { s, t } = A;
      A.to(m.armL.rotation, "x", -2.85 + s(t * 6) * 0.15); A.to(m.armR.rotation, "x", -2.85 - s(t * 6) * 0.15);
      A.to(m.armL.rotation, "z", -0.45 - s(t * 6) * 0.15); A.to(m.armR.rotation, "z", 0.45 + s(t * 6) * 0.15);
      A.to(m.head.rotation, "x", -0.25);
      m.rig.position.y += Math.max(0, s(t * 7)) * 0.16 * A.still;
      A.sparkle(0xffd84a, 6);
      return 1;
    },
    fist(m, A) {                                     // a fist pumped at the sky
      const { s, t } = A, pump = Math.max(0, s(t * 5));
      A.to(m.armR.rotation, "x", -2.0 - pump * 0.9); A.to(m.armR.rotation, "z", 0.15);
      A.to(m.armL.rotation, "x", -0.5); A.to(m.head.rotation, "x", -0.15);
      m.rig.position.y += pump * 0.06 * A.still;
      return 1;
    },
    wave(m, A) {                                     // a hand up, waving to the stands
      const { s, t } = A;
      A.to(m.armR.rotation, "x", -2.7); A.to(m.armR.rotation, "z", 0.35 + s(t * 9) * 0.35);
      A.to(m.armL.rotation, "x", -0.3); A.to(m.head.rotation, "x", -0.1);
      m.rig.position.y += Math.abs(s(t * 5)) * 0.04 * A.still;
      return 1;
    },
    peace(m, A) {                                    // a V by her face, a tilt of the head
      const { s, t } = A;
      A.to(m.armR.rotation, "x", -2.3); A.to(m.armR.rotation, "z", -0.45);
      A.to(m.armL.rotation, "z", -0.3); A.to(m.head.rotation, "z", 0.22 + s(t * 2) * 0.05);
      m.rig.position.y += Math.abs(s(t * 4)) * 0.04 * A.still;
      return 1;
    },
    twirl(m, A) {                                    // a spin on the spot, arms out
      A.to(m.armL.rotation, "z", -1.3); A.to(m.armR.rotation, "z", 1.3);
      A.to(m.head.rotation, "x", -0.2);
      A.spin = A.t * 4.5;
      A.sparkle(0xf0c8ff, 5);
      return 1;
    },
    bow(m, A) {                                      // arms flung wide, then a deep bow
      if ((A.t % 3) / 3 < 0.5) {
        A.to(m.armL.rotation, "z", -1.35); A.to(m.armR.rotation, "z", 1.35);
        A.to(m.armL.rotation, "x", -0.4); A.to(m.armR.rotation, "x", -0.4); A.to(m.head.rotation, "x", -0.3);
      } else {
        A.to(m.body.rotation, "x", 0.65); A.to(m.armR.rotation, "x", -1.4); A.to(m.armR.rotation, "z", -0.5); A.to(m.armL.rotation, "x", 0.6);
      }
      A.sparkle(0xf0c8ff, 4);
      return 1;
    },
    curtsy(m, A) {                                   // hands together, a small polite bow now and then
      const dip = Math.pow(Math.max(0, Math.sin(A.t * 1.4)), 3);
      A.to(m.armL.rotation, "x", -0.7); A.to(m.armR.rotation, "x", -0.7);
      A.to(m.armL.rotation, "z", 0.45); A.to(m.armR.rotation, "z", -0.45);
      A.to(m.body.rotation, "x", 0.08 + dip * 0.45);
      return 1;
    },
    salute(m, A) {                                   // hand to her brow, marching on the spot
      const { s, t } = A;
      A.to(m.armR.rotation, "x", -2.5); A.to(m.armR.rotation, "z", -0.95);
      A.to(m.armL.rotation, "x", 0.15); A.to(m.head.rotation, "x", -0.15);
      m.legL.rotation.x = -0.5 * Math.max(0, s(t * 7)) * A.still; m.legR.rotation.x = -0.5 * Math.max(0, -s(t * 7)) * A.still;
      return 1;
    },
    flex(m, A) {                                     // both arms up and out in a V: look at these
      A.to(m.armL.rotation, "x", -0.35); A.to(m.armR.rotation, "x", -0.35);
      A.to(m.armL.rotation, "z", -2.25); A.to(m.armR.rotation, "z", 2.25);
      A.to(m.head.rotation, "x", -0.15);
      m.rig.position.y += Math.abs(Math.sin(A.t * 3)) * 0.03 * A.still;
      return 1;
    },
    point(m, A) {                                    // one finger to the sky
      A.to(m.armR.rotation, "x", -3.05); A.to(m.armR.rotation, "z", 0.1);
      A.to(m.armL.rotation, "x", 0.1); A.to(m.head.rotation, "x", -0.35);
      A.sparkle(0xffe8a0, 3);
      return 1;
    },
    teioStep(m, A) {                                 // a skipping side-step, arms swinging
      const { s, t } = A;
      m.legL.rotation.x = -0.6 * Math.max(0, s(t * 8)) * A.still; m.legR.rotation.x = -0.6 * Math.max(0, -s(t * 8)) * A.still;
      A.to(m.armL.rotation, "z", -0.8 + s(t * 8) * 0.3); A.to(m.armR.rotation, "z", 0.8 + s(t * 8) * 0.3);
      m.body.rotation.z = s(t * 8) * 0.12 * A.k; A.to(m.head.rotation, "z", s(t * 8) * 0.15);
      m.rig.position.y += Math.abs(s(t * 8)) * 0.1 * A.still;
      return 1;
    },
    dance(m, A) {                                    // flapping, swaying, nonsense
      const { s, t } = A;
      A.to(m.armL.rotation, "x", -1.5 + s(t * 10) * 0.6); A.to(m.armR.rotation, "x", -1.5 - s(t * 10) * 0.6);
      m.body.rotation.z = s(t * 5) * 0.15 * A.k;
      m.rig.position.y += Math.abs(s(t * 5)) * 0.06 * A.still;
      return 1;
    },
    kick(m, A) {                                     // wind up, a flying kick at nobody, a dance
      const u = (A.t % 2.6) / 2.6;
      if (u < 0.25) { A.to(m.body.rotation, "x", 0.35); A.to(m.armL.rotation, "x", 0.7); A.to(m.armR.rotation, "x", 0.7); }
      else if (u < 0.55) {
        const a = (u - 0.25) / 0.3;
        m.rig.position.y += Math.sin(a * Math.PI) * 0.7 * A.still;
        A.to(m.body.rotation, "x", -0.6); A.to(m.legR.rotation, "x", -1.6); A.to(m.legL.rotation, "x", 0.4);
        A.to(m.armL.rotation, "z", -1.2); A.to(m.armR.rotation, "z", 1.2);
        if (a > 0.9) A.puff({ y: 0.08, vx: (Math.random() - 0.5) * 2, vy: 0.6, life: 0.6, size: 0.1, grow: 1, c: 0xb8a882 }, 30);
      } else return MOVES.dance(m, A);
      return 1;
    },
    clap(m, A) {                                     // clapping for everyone
      const shut = Math.abs(Math.sin(A.t * 9));
      A.to(m.armL.rotation, "x", -1.3); A.to(m.armR.rotation, "x", -1.3);
      A.to(m.armL.rotation, "z", 0.25 + shut * 0.3); A.to(m.armR.rotation, "z", -0.25 - shut * 0.3);
      return 1;
    },
    breath(m, A) {                                   // bent over, hands on her knees
      A.to(m.body.rotation, "x", 0.55 + Math.sin(A.t * 4.5) * 0.05);
      A.to(m.armL.rotation, "x", -0.6); A.to(m.armR.rotation, "x", -0.6);
      A.to(m.armL.rotation, "z", 0.15); A.to(m.armR.rotation, "z", -0.15);
      A.to(m.head.rotation, "x", -0.35);
      A.sweat(1.6);
      return 0;
    },
    pout(m, A) {                                     // head down, a kick at the turf, turned away
      A.to(m.head.rotation, "x", 0.45); A.to(m.body.rotation, "x", 0.15);
      A.to(m.armL.rotation, "x", 0.1); A.to(m.armR.rotation, "x", 0.1);
      m.body.rotation.z = Math.sin(A.t * 1.3) * 0.06 * A.k;
      m.legR.rotation.x = -0.4 * Math.pow(Math.max(0, Math.sin(A.t * 2.2)), 6) * A.still;
      A.gloom();
      return -0.5;
    },
    stomp(m, A) {                                    // arms folded, looking away, stamping
      A.to(m.armL.rotation, "x", -1.25); A.to(m.armL.rotation, "z", 0.75);
      A.to(m.armR.rotation, "x", -1.15); A.to(m.armR.rotation, "z", -0.75);
      A.to(m.head.rotation, "y", 0.55); A.to(m.head.rotation, "x", 0.1);
      const st = Math.pow(Math.max(0, Math.sin(A.t * 5.2)), 4) * A.still;
      m.legR.rotation.x = -0.55 * st;
      if (st > 0.6) A.puff({ y: 1.9, vy: 0.9, life: 0.7, size: 0.09, grow: 1.5, c: 0xf4f4f4 }, 8);
      return -0.3;
    },
    despair(m, A) {                                  // arms to the heavens, head thrown back
      A.to(m.armL.rotation, "x", -2.4); A.to(m.armR.rotation, "x", -2.4);
      A.to(m.armL.rotation, "z", -0.6); A.to(m.armR.rotation, "z", 0.6);
      A.to(m.body.rotation, "x", -0.25); A.to(m.head.rotation, "x", -0.5);
      m.body.rotation.z = Math.sin(A.t * 1.1) * 0.12 * A.k;
      return 0.5;
    },
    cry(m, A) {                                      // hands to her face, shoulders shaking, tears
      A.to(m.armL.rotation, "x", -2.15); A.to(m.armR.rotation, "x", -2.15);
      A.to(m.armL.rotation, "z", 0.55); A.to(m.armR.rotation, "z", -0.55);
      A.to(m.head.rotation, "x", 0.3);
      m.body.rotation.z = Math.sin(A.t * 14) * 0.025 * A.k;
      A.sweat(3);
      return 0.3;
    },
    shrug(m, A) {                                    // palms up, a tilt of the head: oh well
      const up = Math.pow(Math.max(0, Math.sin(A.t * 1.6)), 2);
      A.to(m.armL.rotation, "x", -0.55 - up * 0.3); A.to(m.armR.rotation, "x", -0.55 - up * 0.3);
      A.to(m.armL.rotation, "z", -0.7); A.to(m.armR.rotation, "z", 0.7);
      A.to(m.head.rotation, "z", 0.25 * up);
      return 0.6;
    },
    sit(m, A) {                                      // flat down on the turf, legs out, leaning back
      const hip = m.rig.scale.x * 8 - 0.06;
      m.rig.position.y -= hip * A.still;
      m.legL.rotation.x = m.legR.rotation.x = -1.5 * A.still;
      A.to(m.body.rotation, "x", -0.2); A.to(m.armL.rotation, "x", 0.55); A.to(m.armR.rotation, "x", 0.55);
      A.to(m.head.rotation, "x", -0.2);
      return 0.4;
    },
    headHold(m, A) {                                 // both hands on her head: no, no, no
      A.to(m.armL.rotation, "x", -2.6); A.to(m.armR.rotation, "x", -2.6);
      A.to(m.armL.rotation, "z", 1.0); A.to(m.armR.rotation, "z", -1.0);
      A.to(m.head.rotation, "y", Math.sin(A.t * 6) * 0.35);
      return 0.2;
    },
    belly(m, A) {                                    // hands on her stomach, head tipped: hungry
      A.to(m.armL.rotation, "x", -0.85); A.to(m.armR.rotation, "x", -0.85);
      A.to(m.armL.rotation, "z", 0.5); A.to(m.armR.rotation, "z", -0.5);
      A.to(m.head.rotation, "z", 0.2 + Math.sin(A.t * 1.5) * 0.05); A.to(m.head.rotation, "x", 0.1);
      return 0.5;
    },
    think(m, A) {                                    // a hand to her chin, the other under her elbow
      A.to(m.armR.rotation, "x", -2.25); A.to(m.armR.rotation, "z", -0.75);
      A.to(m.armL.rotation, "x", -1.0); A.to(m.armL.rotation, "z", 0.65);
      A.to(m.head.rotation, "x", 0.1 + Math.sin(A.t * 0.9) * 0.05);
      return 0.3;
    },
    cool(m, A) {                                     // arms folded, chin up, unbothered
      A.to(m.armL.rotation, "x", -1.25); A.to(m.armL.rotation, "z", 0.75);
      A.to(m.armR.rotation, "x", -1.15); A.to(m.armR.rotation, "z", -0.75);
      A.to(m.head.rotation, "x", -0.2); A.to(m.head.rotation, "y", 0.25);
      return 0.7;
    },
  };
  const turnTo = (a, b, k) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * clamp(k, 0, 1);
  function react(rec, r, G, t, dt) {
    const m = rec.m, P = rec.P, n = G.S.racers.length;
    if (!rec.act) {
      const R = root.Reactions, rank = r.rank || n;
      rec.act = R ? R.pick(r.name, rank, n) : { move: rank === 1 ? "cheer" : rank <= 3 ? "wave" : "breath", line: null };
    }
    // how far into it: the winner straight away, the rest as they pull up
    const k = r.rank === 1 ? 1 : clamp((5 - rec.vc) / 4, 0, 1);
    const still = clamp((2 - rec.vc) / 2, 0, 1);
    if (k <= 0) return;
    const puff = (o, rate) => { if (still > 0.5 && Math.random() < dt * rate) fx.emit(Object.assign({ follow: rec, x: (Math.random() - 0.5) * 0.5, z: (Math.random() - 0.5) * 0.5 }, o)); };
    const A = {
      t, k, still, s: Math.sin, spin: 0,
      to: (o, key, v) => { o[key] += (v - o[key]) * k; },
      puff,
      sparkle: (c, rate) => puff({ y: 1.5 + Math.random() * 0.8, vy: 0.6, g: -0.2, life: 0.9, size: 0.06, glow: true, c }, rate),
      sweat: rate => { const d = Math.random() < 0.5 ? -1 : 1; puff({ x: d * 0.18, y: 1.4, z: 0, vx: d * 0.5, vy: 1.3, g: 6, life: 0.6, size: 0.05, c: 0x9ad8ff }, rate); },
      gloom: () => puff({ y: 2.0, vy: -0.25, life: 1.4, size: 0.07, c: 0x5a5a7a }, 3),
    };
    const face = (MOVES[rec.act.move] || MOVES.breath)(m, A);
    // stopped: she says her piece, and turns -- to the cameras to perform, half away to sulk
    if (still > 0.7 && !rec.said) { rec.said = true; if (rec.act.line) rec.saying = { text: rec.act.line, from: animT }; }
    if (still > 0 && camera) {
      const track = yawOf(P), cam = Math.atan2(camera.position.x - P.x, camera.position.z - P.z);
      const want = face >= 0 ? turnTo(track, cam, face) : turnTo(track, cam + Math.PI, -face);
      rec.ry = turnTo(rec.ry == null ? track : rec.ry, want, dt * 3);
      m.root.rotation.y = turnTo(track, rec.ry, still) + A.spin * still;
    }
  }
  /** A move played in full on model `m` at time `t`, for the voxel lab: no blending, no puffs. */
  function previewMove(m, name, t) {
    const A = { t, k: 1, still: 1, s: Math.sin, spin: 0, to: (o, key, v) => { o[key] = v; },
                puff() {}, sparkle() {}, sweat() {}, gloom() {} };
    (MOVES[name] || MOVES.breath)(m, A);
    return A.spin;
  }
  const SAY_FOR = 3.4;                               // seconds a line stays up
  /** What `r` is saying after the line, and how far through it (0..1); null when nothing. */
  function sayingOf(r) {
    const rec = racers.get(r), sp = rec && rec.saying;
    if (!sp || animT - sp.from > SAY_FOR) return null;
    return { text: sp.text, age: (animT - sp.from) / SAY_FOR };
  }

  /** What the race sounds like from the camera (ambience.js): for each racer, how far she
      is from the lens, where she is across the frame (-1 left .. 1 right), her stride
      phase (a foot comes down at each multiple of pi, as her body dips) and her speed;
      and whether it is dirt underfoot. Null while a cutscene has the screen. */
  function ears() {
    if (!camera || !path || inCut()) return null;
    const out = [];
    for (const [r, rec] of racers) {
      if (!rec.P) continue;
      V3.set(rec.P.x, 1, rec.P.z).applyMatrix4(camera.matrixWorldInverse);
      out.push({ r, dist: V3.length(), pan: clamp(V3.x / (Math.abs(V3.z) + 3), -1, 1),
                 phase: rec.m.phase, v: r.finished ? rec.vc : r.v });
    }
    return { racers: out, dirt: path === PATHS.dirt };
  }

  function render(G, now) {
    if (!renderer || !G || !stageEl) return false;
    const w = stageEl.clientWidth, h = stageEl.clientHeight;
    if (!w || !h) return false;                       // the race screen is not showing
    const sz = renderer.getSize(V2);
    if (sz.x !== w || sz.y !== h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    /* Behind the title the logo and the menu fill the lower half, so the frame is lifted:
       whatever the director centres sits a fifth of the screen higher, above them. */
    const lift = attract ? Math.round(h * 0.2) : 0;
    if (lift && (!camera.view || !camera.view.enabled || camera.view.offsetY !== lift || camera.view.fullHeight !== h ||
                 camera.view.fullWidth !== w)) camera.setViewOffset(w, h, 0, lift, w, h);
    else if (!lift && camera.view && camera.view.enabled) camera.clearViewOffset();

    const wallDt = lastWall ? clamp((now - lastWall) / 1000, 0, 0.1) : 0;
    lastWall = now;
    govern(wallDt, w, h);
    // a signature cutscene has the screen; the race is held underneath it
    if (inCut()) {
      if (!G.paused) stepCut(wallDt, now);
      renderer.render(cut.scene, cut.cam);
      return true;
    }
    const live = !G.paused;
    const simDt = Math.max(0, G.S.t - lastSimT); lastSimT = G.S.t;
    const rate = clamp(simDt / Math.max(1e-4, wallDt), 1, 8);
    if (live) animT += wallDt;
    U.time.value = animT;
    const t = animT;

    // doors open in the first instant of the race
    if (gate) {
      const k = clamp(G.S.t / 0.35, 0, 1), e = 1 - Math.pow(1 - k, 3);
      for (const [d, sgn] of gate.doors) d.rotation.y = sgn * e * 1.75;
    }

    // racers
    let pi = 0;
    const stopped = G.done || G.S.over;                       // the sim has nothing left to step
    for (const [r, rec] of racers) {
      pi++;
      // past the post the sim stops moving them; let them pull up rather than freeze
      if (r.finished) {
        if (!rec.vc && !rec.coasting) { rec.vc = Math.max(r.v, 8); rec.coasting = true; }
        if (live) {
          const step = (stopped ? wallDt * rate : simDt);
          rec.extra += rec.vc * step;
          rec.vc = Math.max(0, rec.vc - 3.4 * step);
        }
      }
      const v = r.finished ? rec.vc : r.v;
      // her own point object, kept from frame to frame: effects that follow her read it
      const P = rec.P = racerPoint(rec, r, rec.P || {});
      rec.m.root.position.set(P.x, 0, P.z);
      rec.m.root.rotation.y = yawOf(P);
      const run = clamp((v - 1.2) / 11, 0, 1);
      if (live) {
        /* Stride rate follows sim time, so 4x looks like 4x -- but capped per real second,
           or at 4x the legs alias into a flicker. Once everyone is home the sim clock
           stops, and the pull-up runs on the wall clock instead. */
        const freq = run > 0 ? 1.6 + v * 0.19 : 0;
        const adv = stopped ? wallDt * Math.min(freq, 6.5) : Math.min(simDt * freq, wallDt * 6.5);
        rec.m.phase += adv * Math.PI * 2;
      }
      const buffed = r.buffs && r.buffs.some(b => b.stat === "speed" && b.amount > 0);
      pose(rec.m, run, t + pi, { exhausted: r.exhausted, spurt: r.spurting || buffed });
      if (r.finished) react(rec, r, G, t + pi, live ? wallDt : 0);
      // what the race throws up: turf clods at a gallop, gold while a card's speed buff runs
      if (live && simDt > 0 && run > 0.8 && Math.random() < wallDt * 5) {
        const turf = path === PATHS.turf, back = 0.3 + Math.random() * 0.4;
        fx.emit({ x: P.x - P.tx * back, y: 0.06, z: P.z - P.tz * back,
                  vx: -P.tx * 1.2 + (Math.random() - 0.5) * 0.6, vy: 1.2 + Math.random() * 1.2,
                  vz: -P.tz * 1.2 + (Math.random() - 0.5) * 0.6, g: 9, life: 0.42, size: 0.075,
                  c: turf ? (Math.random() < 0.75 ? 0x4a9a36 : 0x7a5a32) : 0xb08a5a });
      }
      // ...unless her signature is running, which has the stage to itself
      if (live && buffed && !(rec.sigUntil > G.S.t) && Math.random() < wallDt * 26) {
        fx.emit({ follow: rec, x: (Math.random() - 0.5) * 0.8, y: 0.4 + Math.random() * 1.4, z: (Math.random() - 0.5) * 0.8,
                  vy: 0.6 + Math.random(), g: -0.3, life: 0.8, size: 0.06, glow: true,
                  c: Math.random() < 0.5 ? 0xffd84a : 0xfff4c0 });
      }
      if (live && simDt > 0 && v > 12) wind(rec, r, P, v, wallDt, r === G.me);
    }
    if (ring) ring.rotation.y = t * 1.4;
    if (live) fx.step(wallDt);
    if (live) stepWeather(wallDt);

    /* How fast it should FEEL, 0..1, for the speed lines index.html draws round the edge
       of the screen: top speed in the final phase, a spurt, her signature. Close shots
       only -- speed lines on an aerial look like a fault. */
    {
      const me = G.me, ph = root.Sim ? root.Sim.phaseOf(me.pos / G.course.distance) : 0;
      const buffed = me.buffs && me.buffs.some(b => b.stat === "speed" && b.amount > 0);
      const mine = racers.get(me);
      let want = clamp((me.v - 15.5) / 3, 0, 1) * (ph === 2 ? 1 : 0.35)
               + (me.spurting || buffed ? 0.3 : 0) + (mine && mine.sigUntil > G.S.t ? 0.35 : 0);
      const wide = ["aerial", "turnCrane", "headOn", "finish", "gateBreak", "orbit"].includes(dir.name) && camName() === "Auto";
      if (intro || G.done || me.finished || G.atGate || wide || camName() === "Field") want = 0;
      feel += (clamp(want, 0, 1) - feel) * clamp(wallDt * 4, 0, 1);
    }

    // crowd noise follows the race
    const ph = root.Sim ? root.Sim.phaseOf(G.me.pos / G.course.distance) : 0;
    const want = G.done ? 1 : intro ? 0.55 : [0.12, 0.25, 0.85][ph] || 0.2;
    U.cheer.value += (want - U.cheer.value) * clamp(wallDt * 1.5, 0, 1);

    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i]; c.position.x += wallDt * (2 + (i % 3));
      if (c.position.x > 1500) c.position.x = -1500;
    }

    if (vision && (now - vision.at > 400 || vision.at < 0)) { vision.at = now; paintVision(G); }

    // camera
    /* Smooth the camera's offset from her, not its position in the world. Chasing a
       point moving at 17 m/s with a lerp leaves the camera a fixed lag behind -- tens of
       metres whenever the frame rate dips -- while an offset only moves when the shot
       changes: a lane, a bend, a new camera. */
    /* A director's cut snaps; a fixed camera holds still and only turns to follow; a
       tracking shot eases. The manual cameras ease more, because their shot never
       changes and every bit of smoothing goes into lane changes and bends. */
    const goal = cameraGoal(G, wallDt, now), F = goal.focus;
    if (goal.cut || camFresh || !goal.smooth) {
      camOff.copy(V3).sub(F); lookOff.copy(V3b).sub(F);
      camFresh = false;
    } else {
      const auto = camName() === "Auto";
      const k = 1 - Math.exp(-wallDt * (auto ? 6 : 3.2)), kl = 1 - Math.exp(-wallDt * (auto ? 8 : 5));
      V3.sub(F); V3b.sub(F);
      camOff.lerp(V3, k); lookOff.lerp(V3b, kl);
    }
    camPos.copy(F).add(camOff); camLook.copy(F).add(lookOff);
    camera.position.copy(camPos);
    if (goal.shake && live) {
      // the low shots at a gallop: a little of the ground coming up through the camera
      const s = goal.shake * clamp((G.me.v - 10) / 8, 0, 1);
      camera.position.x += (Math.sin(t * 37) + Math.sin(t * 23.3)) * s;
      camera.position.y += (Math.sin(t * 41.7) + Math.sin(t * 17.1)) * s * 0.8;
    }
    camera.lookAt(camLook);
    camera.fov += (goal.fov - camera.fov) * (goal.cut ? 1 : clamp(wallDt * 3, 0, 1));
    camera.updateProjectionMatrix();

    // the sun's shadow box follows what we are looking at
    const sp = goal.span;
    const sc = sun.shadow.camera;
    if (sc.right !== sp) { sc.left = -sp; sc.right = sp; sc.top = sp; sc.bottom = -sp; sc.updateProjectionMatrix(); }
    const shX = Math.round(camLook.x), shZ = Math.round(camLook.z);
    sun.target.position.set(shX, 0, shZ);
    sun.position.set(shX - 55, 100, shZ + 62);
    sun.target.updateMatrixWorld();

    renderer.render(scene, camera);
    return true;
  }

  /* Wind: what tells you how fast they are going. Speed lines streaming past the racer
     the camera is on (they move past her at half again her own speed, so the faster she
     goes the harder they rush), short wisps peeling off every racer near the camera,
     and on dirt the dust she kicks up and leaves hanging. All of it scales with speed
     and starts at a canter, so a field easing round the turn is calm and the last spurt
     is not. */
  function wind(rec, r, P, v, dt, mine) {
    const k = clamp((v - 12) / 6, 0, 1.4);
    const near = camera.position.distanceToSquared(V3.set(P.x, 1, P.z)) < 40 * 40;
    if (mine) {
      for (let n = Math.floor(k * 60 * dt + Math.random()); n > 0; n--) {
        const lat = (Math.random() < 0.5 ? -1 : 1) * (0.7 + Math.random() * 3), ahead = 2 + Math.random() * 7;
        fx.emit({ follow: rec, x: P.tx * ahead + P.nx * lat, y: 0.2 + Math.random() * 2.6, z: P.tz * ahead + P.nz * lat,
                  vx: -P.tx * v * 1.5, vz: -P.tz * v * 1.5, life: 0.28, size: 0.03, shape: SHAPE.streak, stretch: 20,
                  c: 0xf4f8ff, glow: true });
      }
    }
    if (!near) return;
    if (Math.random() < k * 6 * dt) {
      const side = (Math.random() - 0.5) * 0.8;
      fx.emit({ x: P.x - P.tx * 0.3 + P.nx * side, y: 1.1 + Math.random() * 0.7, z: P.z - P.tz * 0.3 + P.nz * side,
                vx: P.tx * v * 0.8, vz: P.tz * v * 0.8, drag: 3, life: 0.3, size: 0.025, shape: SHAPE.streak, stretch: 9,
                c: 0xffffff, glow: true });
    }
    if (path === PATHS.dirt && Math.random() < k * 7 * dt) {
      const back = 0.4 + Math.random() * 0.5, side = (Math.random() - 0.5) * 0.6;
      fx.emit({ x: P.x - P.tx * back + P.nx * side, y: 0.15, z: P.z - P.tz * back + P.nz * side,
                vx: (Math.random() - 0.5) * 0.6, vy: 0.3 + Math.random() * 0.4, vz: (Math.random() - 0.5) * 0.6,
                g: -0.1, drag: 1.5, grow: 2.5, life: 0.9, size: 0.14, spin: 0.6, c: Math.random() < 0.5 ? 0xc8a878 : 0xb8966a });
    }
  }

  /** Where to draw a racer's nameplate: just above her ears, in stage CSS pixels. */
  function project(r) {
    const rec = racers.get(r);
    if (!rec || !stageEl) return null;
    const P = racerPoint(rec, r, tmpA);
    V3.set(P.x, RIG_H * VS + 0.35, P.z);
    const dist = V3.distanceTo(camera.position);
    V3.project(camera);
    if (V3.z > 1 || V3.z < -1) return null;
    const w = stageEl.clientWidth, h = stageEl.clientHeight;
    return { x: (V3.x * 0.5 + 0.5) * w, y: (-V3.y * 0.5 + 0.5) * h, dist };
  }

  /**
   * Her signature skill fired: start her own effect (SIG), for as long as the skill
   * lasts. Durations are sim seconds, so at 4x the effect is over four times as fast,
   * exactly like the skill. It ends early if she finishes, or the race does.
   */
  function signature(r, unique, G) {
    const rec = racers.get(r);
    if (!rec || !fx || !rec.P) return;
    const dur = Math.max(4, ...((unique && unique.effects) || []).map(e => e.dur || 0));
    rec.sigUntil = G.S.t + dur;
    if (r === G.me) dir.heroAt = performance.now();         // the director cuts to her
    fx.signature(r.name, { P: rec.P, speed: 0, alive: () => !G.done && !r.finished && G.S.t < rec.sigUntil },
                 partsFor(r.name, r.color).look);
  }

  // ---------------------------------------------------------------- signature cutscenes
  /* When a signature skill fires, the race holds and cuts away, the way the real game
     does it: she is alone on a stage of her own -- a sky in her colours, a floor racing
     away under her, a tunnel of light streaming past -- and three shots tell it: in
     close on her face, a sweep round her at a fraction of real speed, then the hero shot
     as the skill lands and her signature effect (SIG) goes off. index.html holds the
     race clock for exactly as long and lays the skill's name over the last shot. A
     rival's is the short cut: the sweep and the hero shot only. */
  const CUT_THEME = {       // [sky overhead, horizon, light streaks]
    "Special Week":       [0x120c34, 0x6a3aa8, 0xffe680],
    "Silence Suzuka":     [0x0e4a3a, 0xf0d890, 0xe8fff0],
    "Tokai Teio":         [0x1a4ab8, 0xbfe0ff, 0xffd84a],
    "Maruzensky":         [0x5a0a0a, 0xff8a3a, 0xffb040],
    "Oguri Cap":          [0x0e1220, 0x4a5a80, 0xdff0ff],
    "Taiki Shuttle":      [0x1a2a8a, 0xc8202a, 0xffffff],
    "Mejiro McQueen":     [0x2a1a4a, 0xd8c8f0, 0xffe0a0],
    "Symboli Rudolf":     [0x0a2a1a, 0xc8a040, 0xffd84a],
    "Rice Shower":        [0x05050f, 0x2a3a90, 0x6a9aff],
    "T.M. Opera O":       [0x0a040a, 0x8a1a5a, 0xffd84a],
    "Gold Ship":          [0xff4a8a, 0x4ac0ff, 0xffe060],
    "Vodka":              [0x060608, 0x2a3a10, 0xd8ff50],
    "Daiwa Scarlet":      [0x2a0508, 0xff4a3a, 0xffd84a],
    "Grass Wonder":       [0x5a7ad0, 0xffd0e0, 0xffb8d0],
    "El Condor Pasa":     [0x8a1a10, 0xffd070, 0xffc040],
    "Air Groove":         [0x120a24, 0x6a4aa0, 0xd8b048],
    "Mayano Top Gun":     [0x1a5ad8, 0xe0f0ff, 0xffffff],
    "Super Creek":        [0x2a5aa8, 0xd0f0ff, 0xbfe6ff],
    "Mejiro Ryan":        [0x085a5a, 0xffa040, 0xffd090],
    "Agnes Tachyon":      [0x06120a, 0x5a2a8a, 0xb070ff],
    "Winning Ticket":     [0x14082a, 0xd83a2a, 0xffd84a],
    "Sakura Bakushin O":  [0xff6aa0, 0xffe0ec, 0xffffff],
    "Haru Urara":         [0xff8ab8, 0xfff0a0, 0xffffff],
    "Matikanefukukitaru": [0x14082e, 0xb090ff, 0xffd84a],
    "Nice Nature":        [0x1e2a14, 0xd8a060, 0xb0e890],
    "King Halo":          [0x062a1e, 0x9af0c0, 0xb0ffd0],
  };
  let cut = null;

  function buildCutStage() {
    const sc = new THREE.Scene();
    sc.fog = new THREE.Fog(0x000000, 26, 110);
    const cam = new THREE.PerspectiveCamera(40, 1, 0.05, 400);
    const skyG = new THREE.SphereGeometry(150, 32, 16);
    skyG.setAttribute("color", new THREE.Float32BufferAttribute(new Float32Array(skyG.attributes.position.count * 3), 3));
    const sky = new THREE.Mesh(skyG, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
    sc.add(sky);
    // the floor: a voxel checker scrolling away beneath her, which is what makes her run
    const floorTex = new THREE.DataTexture(new Uint8Array(4 * 4 * 4), 4, 4, THREE.RGBAFormat);
    floorTex.magFilter = THREE.NearestFilter; floorTex.minFilter = THREE.NearestFilter;
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(60, 60);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(240, 240).rotateX(-Math.PI / 2),
      new THREE.MeshLambertMaterial({ map: floorTex }));
    sc.add(floor);
    // a tunnel of light streaming past
    const TN = 260, tunnel = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }), TN);
    tunnel.frustumCulled = false;
    const streaks = [];
    for (let i = 0; i < TN; i++) {
      const a = Math.random() * Math.PI, r = 3 + Math.random() * 11;   // above the floor only
      streaks.push({ x: Math.cos(a) * r, y: 0.3 + Math.sin(a) * r, z: -60 + Math.random() * 120,
                     len: 2 + Math.random() * 6, v: 50 + Math.random() * 40, w: 0.03 + Math.random() * 0.05 });
      tunnel.setColorAt(i, new THREE.Color(1, 1, 1));
    }
    sc.add(tunnel);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.75);
    const key = new THREE.DirectionalLight(0xffffff, 0.55); key.position.set(2, 4, 6);
    const rim = new THREE.DirectionalLight(0xffffff, 0.95); rim.position.set(-2, 3, -6);
    sc.add(hemi, key, rim);
    cut = { scene: sc, cam, sky, floor, floorTex, tunnel, streaks, hemi, rim,
            fx: makeFx(sc, 800, { sigScale: 0.55 }), models: new Map(), model: null, active: null };
  }

  function themeCut(name, look) {
    const L = look || lookFor(name);
    const T = CUT_THEME[String(name || "").replace(/​/g, "")] || [mulC(L.top, 0.3), L.top, L.trim || WHITE];
    const [top, hor, streak] = T;
    const sp = cut.sky.geometry.attributes.position, sc = cut.sky.geometry.attributes.color, c = new THREE.Color();
    for (let i = 0; i < sp.count; i++) {
      const y = sp.getY(i) / 150;
      c.setHex(y >= 0 ? mixC(hor, top, Math.pow(y, 0.55)) : mixC(hor, 0x000000, Math.min(1, -y * 3)));
      sc.setXYZ(i, c.r, c.g, c.b);
    }
    sc.needsUpdate = true;
    const A = mixC(hor, 0x000000, 0.55), B = mixC(hor, 0x000000, 0.7), d = cut.floorTex.image.data;
    for (let i = 0; i < 16; i++) {
      const v = ((i & 3) >> 1) ^ ((i >> 3) & 1) ? A : B;
      d[i * 4] = (v >> 16) & 255; d[i * 4 + 1] = (v >> 8) & 255; d[i * 4 + 2] = v & 255; d[i * 4 + 3] = 255;
    }
    cut.floorTex.needsUpdate = true;
    for (let i = 0; i < cut.streaks.length; i++)
      cut.tunnel.setColorAt(i, c.setHex(mixC(streak, WHITE, Math.random() * 0.5)));
    cut.tunnel.instanceColor.needsUpdate = true;
    cut.scene.fog.color.setHex(hor);
    cut.hemi.color.setHex(mixC(hor, WHITE, 0.4)); cut.hemi.groundColor.setHex(A);
    cut.rim.color.setHex(streak);
  }

  /** Start her cutscene. Returns its length in ms, so the race can be held for it. */
  function playCut(r, unique, opts) {
    if (!renderer) return 0;
    if (!cut) buildCutStage();
    const short = !!(opts && opts.short), look = partsFor(r.name, r.color).look;
    themeCut(r.name, look);
    if (cut.model) cut.scene.remove(cut.model.root);
    let m = cut.models.get(r.name);
    if (!m) { m = makeRacer(r.name, r.color); cut.models.set(r.name, m); }
    m.root.position.set(0, 0, 0); m.root.rotation.y = 0;
    cut.scene.add(m.root); cut.model = m;
    cut.fx.clear();
    const len = short ? 2.4 : 3.6, t0 = performance.now();
    const P = { x: 0, z: 0, tx: 0, tz: 1, nx: 1, nz: 0 };
    cut.active = { t0, len, short, name: r.name, look, P, spin: (hashStr(r.name) & 1) ? 1 : -1,
                   burst: false, end: t0 + len * 1000, shot: -1 };
    cut.fx.signature(r.name, { P, speed: 18, alive: () => !!cut.active && performance.now() < cut.active.end }, look);
    return len * 1000;
  }
  function endCut() {
    if (!cut || !cut.active) return;
    cut.active = null;
    if (cut.model) { cut.scene.remove(cut.model.root); cut.model = null; }
    if (cut.pair) { for (const m of cut.pair) cut.scene.remove(m.root); cut.pair = null; }
    cut.fx.clear();
    camFresh = true;
  }
  const inCut = () => !!(cut && cut.active);

  /** The light streaming past and the floor racing away under her. */
  const scrollM = new THREE.Matrix4(), scrollQ = new THREE.Quaternion();
  function scrollStage(dt) {
    cut.streaks.forEach((s, i) => {
      s.z -= s.v * dt * 0.6;
      if (s.z < -60) s.z += 120;
      scrollM.compose(V3.set(s.x, s.y, s.z), scrollQ, V3b.set(s.w, s.w, s.len));
      cut.tunnel.setMatrixAt(i, scrollM);
    });
    cut.tunnel.instanceMatrix.needsUpdate = true;
    cut.floorTex.offset.y -= dt * 2.2;
  }

  function stepCut(dt, now) {
    if (cut.active.rival) return stepRival(dt, now);
    const A = cut.active, cam = cut.cam, m = cut.model;
    const el = (now - A.t0) / 1000;
    // slow motion: mid-stride at a third of real time, every sinew showing
    m.phase += dt * (1.6 + 17 * 0.19) * Math.PI * 2 * 0.32;
    pose(m, 1, el, { spurt: true });
    scrollStage(dt);
    const plan = A.short ? [["sweep", 1.1], ["hero", 1.3]] : [["face", 0.95], ["sweep", 1.25], ["hero", 1.4]];
    let t = Math.min(el, A.len - 1e-3), i = 0;
    while (i < plan.length - 1 && t > plan[i][1]) { t -= plan[i][1]; i++; }
    const k = clamp(t / plan[i][1], 0, 1);
    cam.up.set(0, 1, 0);
    switch (plan[i][0]) {
      case "face":                         // in close, eyes forward
        cam.position.set(0.4 * A.spin, 1.44, 1.75 - k * 0.35);
        cam.up.set(0.09 * A.spin, 1, 0).normalize(); cam.lookAt(0, 1.3, 0.3);
        cam.fov = 34;
        break;
      case "sweep": {                      // round her, low to high
        const a = A.spin * (-0.9 + ease(k) * 2.3), R = 3.0;
        cam.position.set(Math.sin(a) * R, 0.55 + k * 0.7, Math.cos(a) * R);
        cam.lookAt(0, 0.95, 0.1);
        cam.fov = 50;
        break;
      }
      default:                             // the hero shot: she comes at the lens
        if (!A.burst) { A.burst = true; cut.fx.flourish(A.name, { P: A.P }, A.look); }
        cam.position.set((1.15 - k * 0.35) * A.spin, 0.42 + k * 0.1, 3.8 - k * 1.6);
        cam.lookAt(0, 1.05, 0);
        cam.fov = 42 - k * 6;
    }
    if (i !== A.shot) A.shot = i;
    cam.aspect = camera.aspect;
    cam.updateProjectionMatrix();
    cut.fx.step(dt);
  }

  // ---------------------------------------------------------------- rivalries
  /* Two racers side by side long enough lock eyes (rivals.js), and the race holds for
     their moment, staged the way the anime stages its great duels (Tamamo and Oguri,
     Tachyon and Jungle Pocket): out of the race into an image space of their own, the sky
     split between their two colours with a seam of light where they meet. The music drops
     away (index.html). Side by side in slow motion, a spark is struck in the gap between
     them; then in close on each in turn as she sizes the other up and tells herself how she
     will beat her (index.html lays the words over); then the clash, both signatures going
     off at once. In the final third it is the Zone: the sky darkens, light streams back
     off their shoulders the whole way, a flash goes off (index.html), and the clash brings out
     three of its effects -- each racer's own where she has one (Oguri's grey smoke, Rice's
     blue flame, Tachyon's numbers...), the rest at random, so no two are alike. Two
     others' rivalry is the short cut: the spark and the clash. */
  const CLASH_OWN = {
    "Oguri Cap": "smoke", "Rice Shower": "blueFlame", "Agnes Tachyon": "numbers", "Gold Ship": "fireworks",
    "Silence Suzuka": "comets", "Special Week": "comets", "El Condor Pasa": "flames", "Daiwa Scarlet": "flames",
    "Mejiro McQueen": "lightning", "Symboli Rudolf": "lightning", "Tokai Teio": "shockwave", "Haru Urara": "fireworks",
  };
  const CLASH_ALL = ["lightning", "flames", "shockwave", "fireworks", "comets", "smoke"];
  const bareName = s => String(s || "").replace(/​/g, "");
  const themeOf = (name, L) => CUT_THEME[bareName(name)] || [mulC(L.top, 0.3), L.top, L.trim || WHITE];

  /** The split sky: hers on the left, her rival's on the right, light where they meet. */
  function themeRival(TA, TB, final) {
    const sp = cut.sky.geometry.attributes.position, sc = cut.sky.geometry.attributes.color, c = new THREE.Color();
    const half = (T, y) => {
      const top = final ? mixC(T[0], 0x05030a, 0.55) : T[0];
      return y >= 0 ? mixC(T[1], top, Math.pow(y, 0.55)) : mixC(T[1], 0x000000, Math.min(1, -y * 3));
    };
    for (let i = 0; i < sp.count; i++) {
      const x = sp.getX(i) / 150, y = sp.getY(i) / 150, w = clamp(0.5 + x * 4, 0, 1);
      let col = mixC(half(TA, y), half(TB, y), w);
      if (Math.abs(x) < 0.06 && y > -0.1) col = mixC(col, WHITE, (1 - Math.abs(x) / 0.06) * (final ? 0.75 : 0.45));
      c.setHex(col); sc.setXYZ(i, c.r, c.g, c.b);
    }
    sc.needsUpdate = true;
    const hor = mixC(TA[1], TB[1], 0.5), A = mixC(hor, 0x000000, final ? 0.7 : 0.55), B = mixC(hor, 0x000000, final ? 0.82 : 0.7);
    const d = cut.floorTex.image.data;
    for (let i = 0; i < 16; i++) {
      const v = ((i & 3) >> 1) ^ ((i >> 3) & 1) ? A : B;
      d[i * 4] = (v >> 16) & 255; d[i * 4 + 1] = (v >> 8) & 255; d[i * 4 + 2] = v & 255; d[i * 4 + 3] = 255;
    }
    cut.floorTex.needsUpdate = true;
    for (let i = 0; i < cut.streaks.length; i++)
      cut.tunnel.setColorAt(i, c.setHex(mixC((i & 1 ? TB : TA)[2], WHITE, Math.random() * 0.4)));
    cut.tunnel.instanceColor.needsUpdate = true;
    cut.scene.fog.color.setHex(hor);
    cut.hemi.color.setHex(mixC(hor, WHITE, 0.4)); cut.hemi.groundColor.setHex(A);
    cut.rim.color.setHex(WHITE);
  }

  /** Start a rivalry's cutscene: `a` on the left. Returns { len (ms), beats (ms into it), styles }. */
  function playRival(a, b, opts) {
    if (!renderer) return null;
    if (!cut) buildCutStage();
    endCut();
    const short = !!(opts && opts.short), final = !!(opts && opts.final);
    const looks = [a, b].map(r => partsFor(r.name, r.color).look);
    const T = [themeOf(a.name, looks[0]), themeOf(b.name, looks[1])];
    themeRival(T[0], T[1], final);
    cut.pair = [a, b].map((r, i) => {
      let m = cut.models.get(r.name);
      if (!m) { m = makeRacer(r.name, r.color); cut.models.set(r.name, m); }
      m.root.position.set(i ? 0.72 : -0.72, 0, 0); m.root.rotation.y = 0;
      cut.scene.add(m.root);
      return m;
    });
    cut.fx.clear();
    // what the clash brings out: theirs first, then chance; a mid-race one is just sparks
    let styles = ["sparks"];
    if (final) {
      const own = [CLASH_OWN[bareName(a.name)], CLASH_OWN[bareName(b.name)]].filter(Boolean);
      const rest = CLASH_ALL.filter(s => !own.includes(s)).sort(() => Math.random() - 0.5);
      styles = [...new Set(own.concat(rest))].slice(0, 3).concat("sparks");
    } else if (CLASH_OWN[bareName(a.name)] === "numbers" || CLASH_OWN[bareName(b.name)] === "numbers") styles.push("numbers");
    // long enough on each of them to read what she is thinking
    const plan = short ? [["lock", 1.0], ["clash", 3.0]] : [["lock", 1.2], ["glareA", 2.7], ["glareB", 2.7], ["clash", final ? 2.8 : 2.4]];
    const len = plan.reduce((s, p) => s + p[1], 0), t0 = performance.now();
    const P = [-0.72, 0.72].map(x => ({ x, z: 0, tx: 0, tz: 1, nx: 1, nz: 0 }));
    cut.active = { rival: true, t0, len, plan, short, final, names: [a.name, b.name], looks, T, P, styles,
                   end: t0 + len * 1000, shot: -1, burst: false, spark: false, every: {} };
    const beats = {};
    let at = 0;
    for (const [k, d] of plan) { beats[k] = Math.round(at * 1000); at += d; }
    return { len: len * 1000, beats, styles };
  }

  // the clash's effects, each called every frame of the clash (`e` is seconds into it)
  const R = (a, b) => a + Math.random() * (b - a), lerp = (a, b, k) => a + (b - a) * k;
  const both = A => Math.random() < 0.5 ? A.T[0][2] : A.T[1][2];
  function every(A, key, gap, dt) {                    // true once each `gap` seconds
    A.every[key] = (A.every[key] || 0) - dt;
    if (A.every[key] > 0) return false;
    A.every[key] = gap;
    return true;
  }
  const CLASH = {
    sparks(A, dt, e, eyes) {                          // the spark between them, and sparks falling from it
      const mx = (eyes[0].x + eyes[1].x) / 2, my = (eyes[0].y + eyes[1].y) / 2, n = Math.ceil(dt * 160);
      for (let i = 0; i < n; i++) {
        /* The middle of the gap only: drawn the whole way from face to face, its ends sat
           on their noses (the eyes of a voxel face are right above them). */
        const k = 0.3 + Math.random() * 0.4, j = (Math.random() - 0.5) * 0.06;
        cut.fx.emit({ x: lerp(eyes[0].x, eyes[1].x, k), y: lerp(eyes[0].y, eyes[1].y, k) + j, z: 0.35 + j, life: 0.12,
                      size: 0.035, glow: true, c: k < 0.5 ? A.T[0][2] : A.T[1][2] });
      }
      if (Math.random() < dt * 40) cut.fx.emit({ x: mx, y: my, z: 0.35, vx: R(-2, 2), vy: R(0, 2.5), vz: R(-1, 1.5), g: 7,
                                                  life: 0.55, size: 0.04, glow: true, c: 0xfff0a0, shape: SHAPE.streak, stretch: 3 });
    },
    lightning(A, dt) {                                // bolts out of the dark onto them
      if (!every(A, "bolt", 0.14, dt)) return;
      const tx = Math.random() < 0.5 ? -0.72 : 0.72, x0 = tx + R(-3, 3), c = Math.random() < 0.5 ? WHITE : both(A);
      let x = x0, y = 9, z = R(-3, 1);
      while (y > 0.2) {
        const nx = lerp(x, tx, 0.18) + R(-0.4, 0.4), ny = y - R(0.4, 0.8), nz = z + R(-0.2, 0.2);
        for (let k = 0; k < 4; k++)
          cut.fx.emit({ x: lerp(x, nx, k / 4), y: lerp(y, ny, k / 4), z: lerp(z, nz, k / 4), life: 0.16, size: 0.07, glow: true, c });
        x = nx; y = ny; z = nz;
      }
    },
    flames(A, dt, e, eyes, grad) {                    // fire round them both, rising
      const g = grad || [0xfff6c0, 0xffb040, 0xff5020, 0x8a1a10];
      for (let i = 0, n = Math.ceil(dt * 90); i < n; i++) {
        const P = A.P[i & 1];
        cut.fx.emit({ x: P.x + R(-0.35, 0.35), y: R(0, 1.4), z: R(-0.25, 0.25), vx: R(-0.2, 0.2), vy: R(1.5, 3), vz: -R(1, 3),
                      life: R(0.35, 0.6), size: R(0.06, 0.11), grow: 1.2, glow: true, grad: g });
      }
    },
    blueFlame(A, dt, e, eyes) { CLASH.flames(A, dt, e, eyes, [0xf0f8ff, 0x9ad8ff, 0x3a7aff, 0x14206a]); },
    shockwave(A, dt) {                                // rings running out over the ground from between them
      if (!every(A, "ring", 0.55, dt)) return;
      for (let i = 0; i < 64; i++) {
        const a = i / 64 * Math.PI * 2, sp = R(7, 9);
        cut.fx.emit({ x: 0, y: 0.08, z: 0, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp, life: 0.7, size: 0.09, glow: true,
                      c: i & 1 ? A.T[0][2] : A.T[1][2], shape: SHAPE.flat });
      }
    },
    fireworks(A, dt) {                                // bursts over them in both their colours
      if (!every(A, "fw", 0.3, dt)) return;
      const x = R(-4, 4), y = R(3, 6), z = R(-6, -2), c = both(A);
      for (let i = 0; i < 46; i++) {
        const u = R(-1, 1), a = R(0, Math.PI * 2), r = Math.sqrt(1 - u * u), sp = R(3, 4.5);
        cut.fx.emit({ x, y, z, vx: Math.cos(a) * r * sp, vy: u * sp, vz: Math.sin(a) * r * sp, g: 2.2, drag: 1.2,
                      life: R(0.7, 1.1), size: 0.06, glow: true, c: Math.random() < 0.2 ? WHITE : c });
      }
    },
    comets(A, dt) {                                   // light streaking past them, front to back
      for (let i = 0, n = Math.ceil(dt * 40); i < n; i++) {
        const s = Math.random() < 0.5 ? -1 : 1;
        cut.fx.emit({ x: s * R(1.2, 4), y: R(0.2, 3.2), z: 9, vz: -R(28, 40), life: 0.5, size: 0.07, glow: true,
                      c: s < 0 ? A.T[0][2] : A.T[1][2], shape: SHAPE.streak, stretch: 7 });
      }
    },
    smoke(A, dt, e, eyes) {                           // grey smoke off them, the phantom kind (off the body: from the face it sat on her nose)
      for (let i = 0, n = Math.ceil(dt * 50); i < n; i++) {
        const j = i & 1, P = A.P[j];
        cut.fx.emit({ x: P.x + R(-0.3, 0.3), y: R(0.2, 1.4), z: R(-0.35, -0.1),
                      vx: R(-0.3, 0.3), vy: R(0.2, 0.8), vz: -R(2, 4), life: R(0.6, 1), size: R(0.08, 0.14), grow: 2,
                      c: Math.random() < 0.5 ? 0x9a9aa8 : 0xd8d8e2 });
      }
    },
    numbers(A, dt) {                                  // Tachyon's data, orbiting (index.html writes the figures)
      for (let i = 0, n = Math.ceil(dt * 30); i < n; i++)
        cut.fx.emit({ x: R(-2, 2), y: R(0.3, 2.6), z: R(-1, 1), vz: -R(1, 2), life: 0.8, size: 0.05, glow: true,
                      c: Math.random() < 0.5 ? 0x7af0ff : 0xb070ff, shape: SHAPE.flat });
    },
  };

  /** Where her eyes are, in the stage's metres (the head is drawn in its voxel units). */
  const eyeAt = (m, out) => out.copy(V3.set(0, 3.5, 4.4)) && m.head.localToWorld(out);
  const EYES = [new THREE.Vector3(), new THREE.Vector3()];

  function stepRival(dt, now) {
    const A = cut.active, cam = cut.cam, el = (now - A.t0) / 1000;
    // both in slow motion, the Zone slower still; heads turned to each other
    cut.pair.forEach((m, i) => {
      m.phase += dt * (1.6 + 17 * 0.19) * Math.PI * 2 * (A.final ? 0.24 : 0.32);
      pose(m, 1, el, { spurt: true });
      m.head.rotation.y = (i ? -1 : 1) * 0.55; m.head.rotation.x = -0.04;
      m.root.updateMatrixWorld(true);
    });
    scrollStage(dt);
    const eyes = cut.pair.map((m, i) => eyeAt(m, EYES[i]));
    let t = Math.min(el, A.len - 1e-3), i = 0;
    while (i < A.plan.length - 1 && t > A.plan[i][1]) { t -= A.plan[i][1]; i++; }
    const k = clamp(t / A.plan[i][1], 0, 1), shot = A.plan[i][0];
    cam.up.set(0, 1, 0);
    switch (shot) {
      case "lock":                         // low in front of them both: they look round, and the spark is struck
        cam.position.set(0, 0.85 + k * 0.2, 3.7 - k * 0.9);
        cam.lookAt(0, 1.15, 0); cam.fov = 44;
        if (k > 0.3) {
          if (!A.spark) { A.spark = true; for (let n = 0; n < 40; n++) CLASH.sparks(A, 0.03, 0, eyes); }
          CLASH.sparks(A, dt, 0, eyes);
        }
        break;
      case "glareA": case "glareB": {      // in close on her eyes, from the side she is looking to
        const j = shot === "glareA" ? 0 : 1, s = j ? -1 : 1, hx = A.P[j].x;
        cam.position.set(hx + s * (1.45 - k * 0.25), 1.5, 1.9 - k * 0.3);       // head and shoulders, pushing in
        cam.up.set(-0.07 * s, 1, 0).normalize();
        cam.lookAt(hx + s * 0.1, eyes[j].y - 0.12, 0); cam.fov = 36;
        break;
      }
      default: {                           // the clash: pulled back, both coming at the lens, everything at once
        const e = t;
        if (!A.burst) {
          A.burst = true;
          A.names.forEach((name, j) => cut.fx.flourish(name, { P: A.P[j] }, A.looks[j]));
        }
        const sh = A.final ? Math.max(0, 0.06 - e * 0.03) : 0;
        cam.position.set(R(-sh, sh), 0.65 + k * 0.45 + R(-sh, sh), 4.4 - k * 1.3);
        cam.lookAt(0, 1.0, 0); cam.fov = 50 - k * 8;
        for (const s of A.styles) CLASH[s](A, dt, e, eyes);
      }
    }
    /* The Zone: light streaming back off their shoulders the whole way through. (It used to
       stream from their eyes, which on a voxel face put it on her nose.) */
    if (A.final) A.P.forEach((P, j) => {
      if (Math.random() < dt * 60)
        cut.fx.emit({ x: P.x + R(-0.32, 0.32), y: R(1.05, 1.5), z: -0.25, vz: -R(2.5, 4), vy: R(-0.1, 0.1), life: 0.45,
                      size: 0.035, glow: true, c: A.T[j][2], shape: SHAPE.streak, stretch: 4 });
    });
    if (i !== A.shot) A.shot = i;
    cam.aspect = camera.aspect;
    cam.updateProjectionMatrix();
    cut.fx.step(dt);
  }

  function cycleCamera() {
    camMode = (camMode + 1) % CAMS.length;
    try { localStorage.setItem("postparade.raceCam", CAMS[camMode]); } catch (e) {}
    return CAMS[camMode];
  }

  // ---------------------------------------------------------------- live busts
  /* The small portraits around the game -- the deck screens, the pickers, the results board
     -- are her voxel model from the chest up, turned at an angle, and alive: breathing, her
     hair swaying, looking about, glancing off now and then, blinking. Each is a small 2D
     canvas (`bustHTML` writes the tag; anything that puts one in the page gets it going on
     its own); one shared renderer draws every visible one in turn, about 25 times a second,
     and copies it in. */
  const BUST = 192;                                          // the shared render, square
  let bustR = null;
  const live = new Map();                                    // canvas -> its figure
  let liveRAF = 0, liveLast = 0;
  function bustRenderer() {
    if (bustR) return bustR;
    let r;
    try { r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); } catch (e) { bustR = false; return bustR; }
    r.setClearColor(0x000000, 0);
    r.setSize(BUST, BUST, false);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xfff8ea, 0xc8c0b0, 0.9));
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.55);
    keyLight.position.set(1.5, 2.5, 3); scene.add(keyLight);
    const cam = new THREE.PerspectiveCamera(28, 1, 0.1, 20);                    // room for the ears and a hat
    cam.position.set(0.55, 1.45, 2.55); cam.lookAt(0, 1.33, 0);
    bustR = { r, scene, cam };
    return bustR;
  }
  /* Eyelids for the blink: a plate of skin over each eye with a lash along its foot, hidden
     until she blinks. Not over an eye her hair covers, and not behind a trainer's glasses. */
  function addLids(m, skin, which) {
    const lid = new THREE.MeshLambertMaterial({ color: skin }), lash = new THREE.MeshLambertMaterial({ color: LASH });
    const out = [];
    for (const x of which) {
      const g = new THREE.Group();
      const plate = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 0.12), lid); plate.position.set(x + 1, 4, 4.06);
      const line = new THREE.Mesh(new THREE.BoxGeometry(2, 0.35, 0.14), lash); line.position.set(x + 1, 3.2, 4.07);
      g.add(plate, line); g.visible = false;
      m.head.add(g); out.push(g);
    }
    return out;
  }
  function startBust(cv) {
    if (live.has(cv) || !bustRenderer()) return;
    const d = cv.dataset;
    let m, lids;
    if (d.trainer) {
      const t = JSON.parse(d.trainer), T = trainerLook(t);
      m = makeTrainer(t);
      lids = T.glasses ? [] : addLids(m, T.skin, [-3, 1]);
    } else {
      const L = lookFor(d.name, d.color);
      m = makeRacer(d.name, d.color);
      lids = addLids(m, SKIN, L.eyeCover ? [-3] : [-3, 1]);
    }
    const now = performance.now();
    live.set(cv, { m, lids, seed: Math.random() * 100, blink: now + 800 + Math.random() * 3000, shut: 0, again: 0 });
    if (!liveRAF) liveRAF = requestAnimationFrame(liveFrame);
  }
  function animateBust(b, now) {
    const m = b.m, t = now / 1000 + b.seed;
    m.root.rotation.y = 0.8;                                  // turned away a little: a three-quarter view
    pose(m, 0, t, {});                                        // breathing; hair and tail sway
    // looking about: slow drifts, and now and then a glance off to one side
    const off = Math.sin(t * 0.21) > 0.72 ? 0.42 : Math.sin(t * 0.17 + 2) > 0.8 ? -0.3 : 0;
    b.look = (b.look || 0) + (off - (b.look || 0)) * 0.12;
    m.head.rotation.y = -0.2 + Math.sin(t * 0.41) * 0.14 + Math.sin(t * 1.3) * 0.03 + b.look;
    m.head.rotation.x = Math.sin(t * 0.33 + 1) * 0.07;
    m.head.rotation.z = Math.sin(t * 0.27) * 0.04;
    // blinking, every few seconds, now and then twice
    if (now > b.blink) {
      b.shut = now + 110;
      b.again = Math.random() < 0.25 ? now + 260 : 0;
      b.blink = now + 2200 + Math.random() * 3800;
    }
    const closed = now < b.shut || (b.again && now > b.again && now < b.again + 110);
    for (const l of b.lids) l.visible = !!closed;              // three.js hides only on false itself, not 0
  }
  function liveFrame(now) {
    liveRAF = requestAnimationFrame(liveFrame);
    if (now - liveLast < 38 || document.hidden) return;
    liveLast = now;
    const { r, scene, cam } = bustR, dpr = Math.min(root.devicePixelRatio || 1, 2);
    for (const [cv, b] of live) {
      if (!cv.isConnected) { live.delete(cv); continue; }
      const box = cv.getBoundingClientRect();
      if (!box.width || box.bottom < 0 || box.top > innerHeight || box.right < 0 || box.left > innerWidth) continue;
      const W = Math.max(1, Math.round(box.width * dpr)), H = Math.max(1, Math.round(box.height * dpr));
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
      animateBust(b, now);
      scene.add(b.m.root); r.render(scene, cam); scene.remove(b.m.root);
      // fill the box the way object-fit: cover would, keeping her head at the top
      let sx = 0, sw = BUST, sh = BUST;
      if (W / H < 1) { sw = BUST * W / H; sx = (BUST - sw) / 2; } else { sh = BUST * H / W; }
      const g = cv.getContext("2d");
      g.clearRect(0, 0, W, H);
      g.drawImage(r.domElement, sx, 0, sw, sh, 0, 0, W, H);
    }
    if (!live.size) { cancelAnimationFrame(liveRAF); liveRAF = 0; }
  }
  /** The tag for a live bust of `who` ({ name, color } or { trainer }), with class `cls`;
      without 3D, `fallback` as a picture instead (or nothing). */
  function bustHTML(who, cls, fallback) {
    const q = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    if (!who || !bustRenderer()) return fallback ? `<img class="${q(cls)}" src="${q(fallback)}" alt="">` : "";
    const data = who.trainer ? `data-trainer="${q(JSON.stringify(who.trainer))}"` : `data-name="${q(who.name)}" data-color="${q(who.color)}"`;
    return `<canvas class="vbust ${q(cls)}" ${data}></canvas>`;
  }
  // anything that puts a bust's canvas in the page starts it
  const wake = node => {
    if (node.nodeType !== 1) return;
    if (node.matches && node.matches("canvas.vbust")) startBust(node);
    if (node.querySelectorAll) node.querySelectorAll("canvas.vbust").forEach(startBust);
  };
  const watch = () => {
    new MutationObserver(list => { for (const mu of list) mu.addedNodes.forEach(wake); }).observe(document.body, { childList: true, subtree: true });
    wake(document.body);
  };
  if (root.document) { if (document.body) watch(); else document.addEventListener("DOMContentLoaded", watch); }

  root.Voxel = {
    ok: true, bustHTML,
    setupRace, applySeason, render, project, sayingOf, ears, signature, cycleCamera, startIntro, endIntro, playCut, playRival, endCut, inCut,
    cameraName: () => CAMS[camMode],
    speedFeel: () => feel,
    LOOKS, lookFor, SIG, makeFx,
    /* What another voxel scene builds with (the lobby): the mesher, the box builder, the
       racers and their poses, and the colour helpers. */
    kit: { Vox, meshVox, boxGeo, makeRacer, pose, lookFor, mulC, mixC, mulberry32, hashStr, VS,
           trainer: { make: makeTrainer, OPTIONS: TRAINER, defaults: trainerDefault } },
    // exposed for tools and the turntable
    _internals: { makeRacer, pose, PATHS, FINISH_S, MOVES, previewMove, get renderer() { return renderer; }, get scene() { return scene; },
                  get world() { return world; }, get sun() { return sun; },
                  get shot() { return intro ? "intro:" + intro.i : dir.name; } },
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
