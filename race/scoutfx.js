/*
 * The scout's reveal, after the real game's gacha but in this game's own blocks.
 *
 * The real game hides its rarity in a run of tells, each of which can only ever be good
 * news (Altema, GameWith and Game8 list them):
 *   - trainees: a door that is plain, or ornate when a 3-star is coming; the starting gate
 *     under a sign whose line says how good the odds are; the gate itself silver, gold or
 *     rainbow, stepping up as the doors are about to open; the doors spring, the field
 *     runs at you, and a 3-star gets a cut-in with a line of her own.
 *   - support cards: an album on a desk by a window; a rainbow emblem on its cover for
 *     the top rarity; a sticky note in the pages, silver, gold or rainbow, that steps up
 *     as the pages turn; a night sky for an exceptional pull.
 * All of that is here, built in voxels with three.js through the race's own kit, with our
 * own words on the sign. A card scout then deals its cards face down -- each back edged in
 * its own rarity -- and turns them, the Epics last and alone. A racer scout shows each
 * racer in turn. A ten ends on a five-by-two results grid in the order they came out.
 *
 * Every tell is the truth: it is set by what is actually in the pull, and a step up never
 * passes the best thing there. White, gold, rainbow: Common or 1-star, Rare or 2-star,
 * Epic or 3-star.
 *
 * A tap moves it on one beat; Skip (or Escape) goes to the results -- except that, as in
 * the real game, a skip still stops for each top-tier pull so it is seen. With the
 * system's reduced motion it opens straight on the results; the "Sparkles and confetti"
 * setting governs every sparkle, confetti and flash here, and "Screen shake" the shake.
 * Without WebGL the gate is drawn flat and the album is skipped.
 *
 * Exposes ScoutFX.play(results, { kind: "card" | "racer" }) -> Promise, resolved when the
 * player closes the results.
 */
(function (root) {
  "use strict";

  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g,
    c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const art = p => encodeURI(String(p || ""));
  const STARS = n => "★".repeat(n);
  const reduced = () => !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const effects = () => !(root.Settings && root.Settings.get("effects") === false);
  const sparkle = (el, o) => { if (el && effects() && root.FX) FX.sparkleOn(el, o); };
  const ease = k => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);
  const lerp = (a, b, k) => a + (b - a) * k;

  /* Three tiers on both scouts: Common / Rare / Epic cards, 1 / 2 / 3-star racers. */
  const TIER = ["c", "r", "e"];
  const CARD_RARITY = { C: 0, R: 1, E: 2 };
  const CARD_NAME = { C: "Common", R: "Rare", E: "Epic" };

  /** One shape for both scouts, so the reveal and the grid never ask which they are in. */
  function itemsOf(results, kind) {
    return results.map(r => kind === "card" ? {
      tier: CARD_RARITY[r.card.rarity] || 0,
      img: `assets/cards/${r.card.id}.png`,
      name: r.card.ability,
      rank: CARD_NAME[r.card.rarity] || "",
      isNew: r.isNew,
      tag: r.isNew ? "New" : `Copy ${r.copies}`,
    } : {
      tier: Math.max(0, Math.min(2, (r.rarity || 1) - 1)),
      img: art(r.def.sprite),
      name: r.def.name,
      look: r.def.name, color: r.def.color,
      stars: r.rarity,
      blurb: r.def.blurb || "",
      isNew: r.isNew,
      tag: r.isNew ? "New"
        : r.passive ? "Passive"
        : r.progress ? `${r.progress.have}/${r.progress.at}`
        : r.refund ? `+${r.refund}` : "Copy",
      note: r.isNew ? "" : r.passive
        ? "Passive unlocked: " + (((root.Progress && Progress.PASSIVES) || {})[r.passive] || {}).name
        : r.progress ? `${r.progress.have} of ${r.progress.at} copies toward her next passive`
        : r.refund ? `Every passive unlocked: +${r.refund} carrots` : "",
      tagIcon: !r.isNew && !r.passive && !r.progress && r.refund ? "carrot" : "",
    });
  }

  // ---------------------------------------------------------------- the overlay
  function play(results, opts) {
    opts = opts || {};
    const kind = opts.kind === "racer" ? "racer" : "card";
    const list = itemsOf(results || [], kind);
    if (!list.length) return Promise.resolve();
    const best = Math.max(...list.map(i => i.tier));

    return new Promise(resolve => {
      const host = document.createElement("div");
      host.className = `sfx k-${kind} t${TIER[best]}`;
      host.innerHTML = `
        <div class="sfx-scene"></div>
        <div class="sfx-stage"></div>
        <div class="sfx-bar">
          <span class="sfx-count"></span>
          <button class="btn ghost sm sfx-skip" type="button">Skip</button>
        </div>
        <div class="sfx-tap">Tap to continue</div>`;
      document.body.appendChild(host);

      /* The beats. Each waits for its own time or a tap, whichever comes first; Skip sets
         `skipped` and releases whatever is waiting, and every beat after that is instant. */
      let skipped = false, closed = false, release = null;
      const c = {
        host, list, best, kind,
        scene: host.querySelector(".sfx-scene"),
        stage: host.querySelector(".sfx-stage"),
        count: host.querySelector(".sfx-count"),
        shown: list.map(() => false),
        cleanup: [],
        skippedNow: () => skipped,
        wait: ms => new Promise(r => {
          if (skipped) return r();
          const t = setTimeout(go, ms);
          release = go;
          function go() { clearTimeout(t); if (release === go) release = null; r(); }
        }),
        tapWait: () => new Promise(r => {
          if (skipped) return r();
          host.classList.add("hold");
          const go = () => { host.classList.remove("hold"); if (release === go) release = null; r(); };
          release = go;
        }),
        flash: () => {
          if (!effects()) return;
          host.classList.remove("flash"); void host.offsetWidth; host.classList.add("flash");
        },
      };
      host.addEventListener("click", e => {
        if (e.target.closest(".sfx-skip, .sfx-done")) return;
        if (release) release();
      });
      const skip = () => {
        if (skipped || host.classList.contains("noskip") || host.classList.contains("at-res")) return;
        skipped = true;
        if (release) release();
      };
      host.querySelector(".sfx-skip").onclick = e => { e.stopPropagation(); skip(); };
      const onKey = e => {
        if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); skip(); }
        else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault(); e.stopPropagation();
          const done = host.querySelector(".sfx-done");
          if (done) done.click(); else if (release) release();
        }
      };
      document.addEventListener("keydown", onKey, true);
      const stopScenes = () => { c.cleanup.splice(0).forEach(f => { try { f(); } catch (e) {} }); };
      const close = () => {
        if (closed) return;
        closed = true;
        document.removeEventListener("keydown", onKey, true);
        stopScenes();
        host.classList.add("gone");
        setTimeout(() => host.remove(), reduced() ? 0 : 300);
        resolve();
      };

      (async () => {
        try {
          if (!reduced()) {
            if (kind === "racer") {
              await openGate(c);
              stopScenes();
              if (!skipped) await showEach(c, list.map((_, i) => i));
            } else {
              await openAlbum(c);
              if (!skipped) await openDeal(c);
              stopScenes();
            }
            /* A skip still stops for the top tier, the way the real game's does for a
               rainbow: whatever else is skipped, those are seen. */
            const unseen = list.map((_, i) => i).filter(i => list[i].tier >= 2 && !c.shown[i]);
            if (skipped && unseen.length) {
              skipped = false;
              host.classList.add("noskip");
              c.scene.innerHTML = "";
              await showEach(c, unseen);
            }
          }
        } catch (e) {
          console.error("scout reveal:", e);           // never strand the player on a broken reveal
        }
        stopScenes();
        resultsView(c, close);
      })();
    });
  }

  // ---------------------------------------------------------------- one at a time
  /* Each pull gets its moment: a flash, the art, a plate with its rarity and whether it is
     new. A 3-star gets her cut-in: a line of her own, in her own words (lines.js). A ten
     moves itself along at a clip unless the top tier comes up, which holds for a tap; a
     single always holds. */
  async function showEach(c, idxs) {
    const { host, stage, list, kind, count } = c;
    for (let k = 0; k < idxs.length; k++) {
      if (c.skippedNow()) break;
      const i = idxs[k], it = list[i];
      c.shown[i] = true;
      if (list.length > 1) count.textContent = `${i + 1} / ${list.length}`;
      c.flash();
      stage.innerHTML = oneHTML(it, kind);
      const el = stage.firstElementChild;
      requestAnimationFrame(() => el.classList.add("in"));
      if (it.tier >= 1) setTimeout(() => sparkle(el.querySelector(".one-art"), { count: it.tier >= 2 ? 26 : 12 }), 220);
      if (it.tier >= 2 && effects() && root.FX) FX.confetti({ count: 120 });
      if (list.length === 1 || it.tier >= 2) { await c.wait(600); await c.tapWait(); }
      else await c.wait(it.tier >= 1 ? 1150 : 720);
    }
    count.textContent = "";
    stage.innerHTML = "";
  }

  function oneHTML(it, kind) {
    const line = kind === "racer" && it.tier >= 2 && root.Lines ? Lines.line(it.name, { trainer: true }) : "";
    return `<div class="one t${TIER[it.tier]} ${kind}">
      ${line ? `<div class="one-line"><b>${esc(it.name)}</b>${esc(line)}</div>` : ""}
      <div class="one-art"><img src="${it.img}" alt=""></div>
      <div class="one-cap">
        ${it.isNew && kind === "racer" ? `<div class="one-kick">Joins your stable</div>` : ""}
        <div class="one-row">
          ${kind === "racer" ? `<span class="stars">${STARS(it.stars)}</span>` : `<span class="one-rank">${esc(it.rank)}</span>`}
          <b>${esc(it.name)}</b>
          ${it.isNew ? `<i class="one-new">New</i>` : ""}
        </div>
        ${kind === "racer" && (it.isNew ? it.blurb : it.note)
          ? `<p class="one-note">${esc(it.isNew ? it.blurb : it.note)}</p>` : ""}
      </div>
    </div>`;
  }

  // ---------------------------------------------------------------- the results
  /* A ten ends on a grid of five by two in the order they came out, New marked; a single
     ends on the one result. This is where a skip lands. */
  function resultsView(c, close) {
    const { host, stage, list, kind } = c;
    host.classList.add("at-res");
    host.classList.remove("hold", "flash", "noskip");
    c.scene.innerHTML = "";
    const ten = list.length > 1;
    stage.innerHTML = `
      <div class="sfx-res ${ten ? "ten" : "one-res"}">
        <div class="sfx-res-hd">${ten ? "Scout results" : "Scout result"}</div>
        <div class="sfx-grid">${list.map(it => tileHTML(it, kind)).join("")}</div>
        <button class="btn lg sfx-done" type="button">OK</button>
      </div>`;
    stage.querySelectorAll(".sfx-tile").forEach((t, i) => {
      if (reduced()) { t.classList.add("in"); return; }
      setTimeout(() => {
        t.classList.add("in");
        if (list[i].tier >= 2) sparkle(t, { count: 10, spread: 34 });
      }, 50 * i);
    });
    const done = stage.querySelector(".sfx-done");
    done.onclick = e => { e.stopPropagation(); close(); };
    setTimeout(() => done.focus({ preventScroll: true }), 60);
  }

  function tileHTML(it, kind) {
    return `<div class="sfx-tile t${TIER[it.tier]} ${kind}">
      <div class="st-art"><img src="${it.img}" alt="${esc(it.name)}"></div>
      ${kind === "racer" ? `<span class="stars">${STARS(it.stars)}</span>` : ""}
      <b>${esc(it.name)}</b>
      <i class="${it.isNew ? "new" : ""}">${it.tagIcon && root.Icon ? Icon(it.tagIcon) : ""}${esc(it.tag)}</i>
    </div>`;
  }

  // ---------------------------------------------------------------- the voxel stage
  /* One renderer, kept: a browser allows only a handful of live WebGL contexts and the
     race, the lobby and the portraits already hold some. Its canvas is taken off the page
     between scenes. */
  let GL = null;
  /* A full-screen scene is the heaviest thing a mid-range phone draws, so on a touch or
     low-core device it renders at 1.25x, as the race and the lobby do. */
  const LOW_POWER = !!(root.matchMedia && root.matchMedia("(pointer:coarse)").matches) ||
    ((root.navigator && navigator.hardwareConcurrency) || 8) <= 4;
  function gl() {
    if (GL !== null) return GL;
    const V = root.Voxel, THREE = root.THREE;
    if (!V || !V.ok || !V.kit || !THREE) return (GL = false);
    try {
      const r = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      r.shadowMap.enabled = true;
      r.shadowMap.type = THREE.PCFSoftShadowMap;
      r.domElement.className = "sfx-gl";
      GL = { r, THREE, kit: V.kit };
    } catch (e) { GL = false; }
    return GL;
  }

  /** A scene on the shared renderer, its frame loop, and everything to free when it stops. */
  function voxStage(c, sky) {
    const G = gl();
    if (!G) return null;
    const { THREE, r } = G;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(sky);
    const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 160);
    const own = [];
    const vox = new THREE.MeshLambertMaterial({ vertexColors: true }); own.push(vox);
    const mesh = (geo, mat, shadow) => {
      own.push(geo);
      const m = new THREE.Mesh(geo, mat || vox);
      m.castShadow = shadow !== false; m.receiveShadow = true;
      return m;
    };
    const tint = (hex, basic) => {
      const m = basic ? new THREE.MeshBasicMaterial({ color: hex, fog: false }) : new THREE.MeshLambertMaterial({ color: hex });
      own.push(m); return m;
    };
    c.scene.appendChild(r.domElement);
    const fit = () => {
      const w = c.scene.clientWidth || innerWidth, h = c.scene.clientHeight || innerHeight;
      r.setPixelRatio(Math.min(LOW_POWER ? 1.25 : 2, devicePixelRatio || 1));
      r.setSize(w, h, false);
      cam.aspect = w / h; cam.updateProjectionMatrix();
    };
    fit();
    addEventListener("resize", fit);
    let raf = 0, live = true, t = 0, last = performance.now(), each = null;
    const frame = now => {
      if (!live) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
      if (each) each(t, dt);
      r.render(scene, cam);
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (!live) return;
      live = false;
      cancelAnimationFrame(raf);
      removeEventListener("resize", fit);
      own.forEach(o => o.dispose && o.dispose());
      if (r.domElement.parentNode) r.domElement.parentNode.removeChild(r.domElement);
    };
    c.cleanup.push(stop);
    return {
      THREE, kit: G.kit, scene, cam, mesh, tint, own, vox, stop,
      run: fn => { each = fn; last = performance.now(); raf = requestAnimationFrame(frame); },
      /* The loop's own clock, for a beat to stamp when something it starts began. */
      clock: () => t,
      /* How far back to stand for `span` metres to fit across, on any screen shape. */
      fitDist: span => (span / 2) / Math.tan(cam.fov * Math.PI / 360) / Math.min(1.4, Math.max(0.5, cam.aspect)),
    };
  }

  /* The tell's colours. Silver, gold, and every saddle-cloth colour at once for the top. */
  const SILVER = 0xc9ced8, GOLD = 0xf2b705;
  const RAINBOW = [0xd6303c, 0xef8a2a, 0xf2cf2a, 0x2f9a4a, 0x2f6fd0, 0x8a5ad0, 0xf07aa8];
  const WAKU = [0xf4f2ea, 0x24272c, 0xd6303c, 0x2f6fd0, 0xf2cf2a, 0x2f9a4a, 0xef8a2a, 0xf07aa8];
  const tellColor = (tier, i, t) => tier >= 2 ? RAINBOW[(Math.floor(t * 7) + i) % RAINBOW.length]
                                  : tier === 1 ? GOLD : SILVER;

  /** A sign's face, drawn once: paper-white words on the board's colour. */
  function signTexture(THREE, text, bg) {
    const cv = document.createElement("canvas");
    cv.width = 1024; cv.height = 192;
    const g = cv.getContext("2d");
    g.fillStyle = bg; g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = "#fffdf6";
    g.textAlign = "center"; g.textBaseline = "middle";
    let size = 92;
    do { g.font = `400 ${size}px "Dela Gothic One", "M PLUS Rounded 1c", sans-serif`; size -= 4; }
    while (g.measureText(text).width > cv.width - 80 && size > 30);
    g.lineWidth = 14; g.strokeStyle = "#7a2a4a"; g.lineJoin = "round";
    g.strokeText(text, cv.width / 2, cv.height / 2 + 4);
    g.fillText(text, cv.width / 2, cv.height / 2 + 4);
    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 4;
    return tex;
  }

  /* Our words for the sign over the gate. Like the real game's, it reads the best racer in
     the gate, and only better lines mean better odds. */
  const SIGN = ["Anyone's race.", "A favourite in the gate.", "Clear of the field."];

  // ---------------------------------------------------------------- racers: door and gate
  /*
   * The academy door first, plain or -- only when a 3-star is in the gate -- trimmed in gold
   * with a horseshoe across it. It opens on the course at night: the gate across the track
   * under the lights, the pink sign over it, the racers standing in their stalls behind
   * the open frames of the doors. The gate is silver; it steps up to gold, then to the
   * rainbow, as far as the best of them warrants. Then the doors spring and the field
   * comes at you.
   */
  async function openGate(c) {
    if (document.fonts && document.fonts.ready) await Promise.race([document.fonts.ready, c.wait(300)]);
    const S = voxStage(c, 0x0b1322);
    if (!S) return openGateFlat(c);
    const { THREE, kit, scene, cam, mesh, tint } = S;
    const n = c.list.length, stalls = Math.max(n, 3), first = n === 1 ? 1 : 0;
    const LW = 1.35, D = 1.5, W = stalls * LW, x0 = -W / 2;
    /* What the camera takes in: the whole gate on a wide screen; on a tall one the middle
       stalls, or the field would be specks. */
    const span = Math.max(4.6, cam.aspect < 0.8 ? Math.min(W + 1.2, 6.2) : W + 1.2);
    scene.fog = new THREE.Fog(0x0b1322, 30, 90);

    const hemi = new THREE.HemisphereLight(0xc4d4ff, 0x1c2a14, 0.62);
    const flood = new THREE.DirectionalLight(0xfff3dc, 0.85);
    flood.position.set(-6, 16, 9); flood.castShadow = true; flood.shadow.mapSize.set(1024, 1024);
    Object.assign(flood.shadow.camera, { left: -12, right: 12, top: 10, bottom: -10, near: 1, far: 50 });
    flood.shadow.bias = -0.0006;
    scene.add(hemi, flood, flood.target);

    // the turf, mown in stripes down the track, and the inside rail
    const turf = [];
    for (let i = -16; i < 16; i++) turf.push([i * 1.6, -0.2, -40, i * 1.6 + 1.6, 0, 60, i % 2 ? 0x2b7434 : 0x31803a]);
    const rail = [];
    for (let z = -38; z < 58; z += 2.4) rail.push([x0 - 3.2, 0, z, x0 - 3.06, 1.05, z + 0.14, 0xf4f2ea]);
    rail.push([x0 - 3.24, 0.95, -38, x0 - 3.02, 1.1, 58, 0xf4f2ea]);
    scene.add(mesh(kit.boxGeo(turf)), mesh(kit.boxGeo(rail)));

    // the gate: a white beam over posts that take the tell's colour, saddle-cloth plates
    const beam = [[x0 - 0.4, 2.3, -D, x0 + W + 0.4, 2.75, D, 0xf2f2ee]];
    for (let i = 0; i < stalls; i++) beam.push([x0 + i * LW + 0.25, 2.36, D, x0 + (i + 1) * LW - 0.25, 2.5, D + 0.06, WAKU[i % 8]]);
    scene.add(mesh(kit.boxGeo(beam)));
    const postGeo = new THREE.BoxGeometry(0.14, 2.3, D * 2); S.own.push(postGeo);
    const posts = [];
    for (let i = 0; i <= stalls; i++) {
      const p = new THREE.Mesh(postGeo, tint(SILVER)); p.castShadow = p.receiveShadow = true;
      p.position.set(x0 + i * LW, 1.15, 0);
      if (i === 0 || i === stalls) p.scale.set(2.2, 1.2, 1.25), p.position.y = 1.38;
      scene.add(p); posts.push(p);
    }
    // the light the gate throws on the turf in front of it
    const glowMat = new THREE.MeshBasicMaterial({ color: SILVER, transparent: true, opacity: 0, depthWrite: false, fog: false });
    const glowGeo = new THREE.PlaneGeometry(W + 3, 4); S.own.push(glowMat, glowGeo);
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = -Math.PI / 2; glow.position.set(0, 0.02, D + 2);
    scene.add(glow);

    // the pink sign over the gate, on two legs, its frame the tell's colour too
    const sw = Math.min(W - 0.4, 6.4, span - 0.9), sh = sw * 0.19;
    const signTex = signTexture(THREE, SIGN[c.best], "#f0749e"); S.own.push(signTex);
    const signMat = new THREE.MeshBasicMaterial({ map: signTex, fog: false }); S.own.push(signMat);
    const signGeo = new THREE.PlaneGeometry(sw, sh); S.own.push(signGeo);
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 3.35 + sh / 2, 0.2);
    const signFrameMat = tint(SILVER, true);
    const sfg = new THREE.BoxGeometry(sw + 0.24, sh + 0.24, 0.1); S.own.push(sfg);
    const signFrame = new THREE.Mesh(sfg, signFrameMat);
    signFrame.position.set(0, sign.position.y, 0.13);
    scene.add(mesh(kit.boxGeo([[-sw / 3, 2.75, 0.05, -sw / 3 + 0.12, 3.3, 0.17, 0x2a3a2c],
                               [sw / 3 - 0.12, 2.75, 0.05, sw / 3, 3.3, 0.17, 0x2a3a2c]])), signFrame, sign);

    // the doors of the stalls: open frames, so she is seen standing behind them
    const dw = LW / 2 - 0.08, frameC = 0x3a8a4a, door = sgn => {
      const a = sgn > 0 ? 0 : -dw, b = sgn > 0 ? dw : 0, w = 0.06, wh = 0xe8e8e0;
      return kit.boxGeo([[a, 0.25, -0.03, a + w, 1.85, 0.03, wh], [b - w, 0.25, -0.03, b, 1.85, 0.03, wh],
        [a, 1.77, -0.03, b, 1.85, 0.03, wh], [a, 0.25, -0.03, b, 0.33, 0.03, wh], [a, 1.2, -0.04, b, 1.3, 0.04, frameC]]);
    };
    const dR = door(1), dL = door(-1); S.own.push(dR, dL);
    const doors = [];
    for (let i = 0; i < stalls; i++) {
      const x = x0 + i * LW;
      const a = new THREE.Mesh(dR, S.vox), b = new THREE.Mesh(dL, S.vox);
      a.position.set(x + 0.07, 0, D); b.position.set(x + LW - 0.07, 0, D);
      a.castShadow = b.castShadow = true;
      scene.add(a, b); doors.push([a, -1], [b, 1]);
    }

    // the racers, each in her own stall, facing out
    const field = c.list.map((it, i) => {
      const m = kit.makeRacer(it.look, it.color);
      m.root.position.set(x0 + (i + first) * LW + LW / 2, 0, -0.2);
      m.speed = 9.5 + Math.random() * 1.6 + it.tier * 0.5;
      m.delay = Math.random() * 0.18;
      scene.add(m.root);
      return m;
    });
    S.own.push({ dispose: () => field.forEach(m => scene.remove(m.root)) });

    // the academy door the camera starts behind: a wall, and two leaves that swing away
    const zF = D + Math.min(28, Math.max(6.5, S.fitDist(span) + 1.2));
    const zW = zF + 3.2, ornate = c.best >= 2;
    const wall = [[-30, 0, zW, -1.75, 14, zW + 0.4, 0xeee3c8], [1.75, 0, zW, 30, 14, zW + 0.4, 0xeee3c8],
                  [-1.75, 4.4, zW, 1.75, 14, zW + 0.4, 0xeee3c8],
                  [-30, 0, zW - 0.05, -1.95, 0.7, zW + 0.45, 0x8a6a4a], [1.95, 0, zW - 0.05, 30, 0.7, zW + 0.45, 0x8a6a4a],
                  [-1.95, 0, zW + 0.4, -1.75, 4.6, zW + 0.55, ornate ? GOLD : 0x6e4326],
                  [1.75, 0, zW + 0.4, 1.95, 4.6, zW + 0.55, ornate ? GOLD : 0x6e4326],
                  [-1.95, 4.4, zW + 0.4, 1.95, 4.6, zW + 0.55, ornate ? GOLD : 0x6e4326]];
    scene.add(mesh(kit.boxGeo(wall), null, false));
    const leaf = side => {
      const wood = 0xa46a3c, dark = 0x7a4a2a, trim = ornate ? GOLD : 0x5a3418, L = [];
      const a = side < 0 ? 0 : -1.75, b = side < 0 ? 1.75 : 0;
      L.push([a, 0, 0, b, 4.4, 0.16, wood]);
      L.push([a + 0.18, 0.3, 0.16, b - 0.18, 2.0, 0.2, dark], [a + 0.18, 2.3, 0.16, b - 0.18, 4.1, 0.2, dark]);
      L.push([a, 0, 0.16, a + 0.1, 4.4, 0.22, trim], [b - 0.1, 0, 0.16, b, 4.4, 0.22, trim]);
      if (ornate) {
        // half a horseshoe on each leaf, meeting at the seam
        const hx = side < 0 ? 1.75 : -1.75, s = side < 0 ? -1 : 1;
        for (const [dx, dy] of [[0.55, 3.45], [0.55, 3.15], [0.55, 2.85], [0.5, 2.55], [0.38, 2.3], [0.2, 2.15], [0.02, 2.11]]) {
          const x = hx + s * dx;
          L.push([Math.min(x, x + s * 0.16), dy, 0.2, Math.max(x, x + s * 0.16), dy + 0.3, 0.3, GOLD]);
        }
      }
      return kit.boxGeo(L);
    };
    const leaves = [-1, 1].map(side => {
      const g = new THREE.Group(); g.position.set(side * 1.75, 0, zW + 0.4);
      g.add(mesh(leaf(side), null, false)); scene.add(g); return [g, side];
    });
    // a lamp over the door, so it reads at night; and far enough back to see all of it
    const doorLamp = new THREE.PointLight(0xffd9a0, 1.4, 14, 1.5);
    doorLamp.position.set(0, 5.6, zW + 2.6); scene.add(doorLamp);
    const zD = zW + 0.55 + Math.max(7.6, S.fitDist(4.6) + 0.8);

    // the tell, as it stands, and the run
    let tell = 0, lit = false, opened = -1, doorsAt = -1, flyAt = -1;
    S.run((t, dt) => {
      // the camera: before the door, then through it and down to the gate
      const k = flyAt < 0 ? 0 : ease((t - flyAt) / 1.9);
      cam.position.set(Math.sin(t * 0.3) * 0.2 * k, lerp(2.3, 1.15, k), lerp(zD, zF, k));
      cam.lookAt(0, lerp(2.3, 1.3, k), lerp(zW, 0, Math.min(1, k * 1.4)));
      doorLamp.intensity = 1.4 * (1 - k);
      if (doorsAt >= 0) {
        const e = ease((t - doorsAt) / 0.7);
        for (const [g, side] of leaves) g.rotation.y = -side * e * 1.9;     // away, onto the course
      }
      for (let i = 0; i < posts.length; i++) posts[i].material.color.setHex(lit ? tellColor(tell, i, t) : 0x5b616c);
      signFrameMat.color.setHex(lit ? tellColor(tell, 3, t) : 0x5b616c);
      if (lit) {
        glowMat.color.setHex(tellColor(tell, 0, t));
        glowMat.opacity = Math.min(0.3, glowMat.opacity + dt * 0.6);
      }
      if (opened >= 0) {
        const e = ease((t - opened) / 0.28);
        for (const [d, sgn] of doors) d.rotation.y = sgn * e * 1.75;
        for (const m of field) {
          const run = Math.max(0, t - opened - m.delay);
          const v = Math.min(m.speed, run * 18);
          m.root.position.z += v * dt;
          m.phase += dt * (3 + v * 0.9);
          kit.pose(m, Math.min(1, run * 3), t, {});
        }
      } else {
        for (const m of field) { m.phase += dt; kit.pose(m, 0, t, {}); }
      }
    });

    await c.wait(ornate ? 1000 : 600);
    doorsAt = S.clock();
    await c.wait(450);
    flyAt = S.clock();
    await c.wait(1900);
    lit = true; tell = 0;
    c.host.classList.add("hinted");
    await c.wait(c.best ? 750 : 1000);
    // the step up, never past the truth
    for (let up = 1; up <= c.best && !c.skippedNow(); up++) {
      tell = up; c.flash();
      if (root.FX) FX.shake(up >= 2 ? 300 : 160, up >= 2 ? 6 : 3);
      await c.wait(up >= 2 ? 1100 : 750);
    }
    tell = c.best;
    opened = S.clock();
    await c.wait(1400);
  }

  /* No WebGL: the same beats on a flat gate -- the stalls as blocks, the posts taking the
     tell's colour and stepping up, the doors swinging. */
  async function openGateFlat(c) {
    const n = Math.max(3, c.list.length);
    c.scene.innerHTML = `<div class="gate2d"><div class="g2-sign">${esc(SIGN[c.best])}</div>${
      Array.from({ length: n }, (_, i) => `<div class="g2-stall">
        <b style="background:#${WAKU[i % 8].toString(16).padStart(6, "0")}"></b>
        <span class="g2-door l"></span><span class="g2-door r"></span></div>`).join("")}</div>`;
    const gate = c.scene.querySelector(".gate2d");
    await c.wait(900);
    gate.classList.add("h0");
    c.host.classList.add("hinted");
    await c.wait(800);
    for (let up = 1; up <= c.best && !c.skippedNow(); up++) {
      gate.className = "gate2d h" + up; c.flash();
      await c.wait(up >= 2 ? 1000 : 700);
    }
    gate.className = "gate2d h" + c.best + " open";
    await c.wait(900);
    c.scene.innerHTML = "";
  }

  // ---------------------------------------------------------------- cards: the album
  /*
   * An album on a desk by a window, in daylight -- or at night, when the pull holds more
   * than one Epic. The camera comes down onto it. Its cover's horseshoe is plain paper, or
   * the rainbow when an Epic is inside. A sticky note stands out of the pages, silver;
   * the cover opens, the pages turn, and the note steps up to gold and to the rainbow as
   * far as the best card warrants.
   */
  async function openAlbum(c) {
    const night = c.list.filter(i => i.tier >= 2).length >= 2;
    const S = voxStage(c, night ? 0x0d1530 : 0xf3e8d2);
    if (!S) return;
    const { THREE, kit, scene, cam, mesh, tint } = S;

    scene.add(new THREE.HemisphereLight(night ? 0x7080b8 : 0xfff6e6, night ? 0x201810 : 0x8a6a48, night ? 0.5 : 0.75));
    const sun = new THREE.DirectionalLight(night ? 0x9fb4ff : 0xfff0d0, night ? 0.35 : 0.8);
    sun.position.set(-3, 9, -8); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 });
    sun.shadow.bias = -0.0008;
    scene.add(sun, sun.target);
    if (night) {
      const lamp = new THREE.PointLight(0xffd59a, 1.3, 14, 1.6);
      lamp.position.set(2.6, 3.4, 0.6); lamp.castShadow = true; scene.add(lamp);
    }

    // the room: a wall with a window, the sky in it, and the desk under it
    const wallC = night ? 0x4a4660 : 0xeee3c8, frameC = 0xf8f5ec;
    const room = [
      // the wall, in four pieces round the window so the sky shows through it
      [-12, -2, -4.2, 12, 2.1, -4, wallC], [-12, 7.5, -4.2, 12, 10, -4, wallC],
      [-12, 2.1, -4.2, -2.9, 7.5, -4, wallC], [2.9, 2.1, -4.2, 12, 7.5, -4, wallC],
      // the window's frame and its cross
      [-2.9, 2.1, -4.0, 2.9, 2.3, -3.6, frameC], [-2.9, 7.3, -4.0, 2.9, 7.5, -3.6, frameC],
      [-2.9, 2.1, -4.0, -2.7, 7.5, -3.6, frameC], [2.7, 2.1, -4.0, 2.9, 7.5, -3.6, frameC],
      [-0.1, 2.1, -3.95, 0.1, 7.5, -3.7, frameC], [-2.9, 4.7, -3.95, 2.9, 4.85, -3.7, frameC]];
    // deep enough that a tall screen, which has to stand well back, still sees only desk
    const desk = [];
    for (let i = 0; i < 18; i++) desk.push([-9 + i, 0.8, -3.6, -8 + i, 1, 11, i % 2 ? 0x9a6a3e : 0x8f6238]);
    scene.add(mesh(kit.boxGeo(room), null, false), mesh(kit.boxGeo(desk)));
    const skyBits = night
      ? [[1.0, 5.6, -5.0, 1.7, 6.3, -4.9, 0xfff6d8], ...Array.from({ length: 14 }, (_, i) =>
          [-2.6 + (i * 0.37) % 5.2, 2.5 + ((i * 1.31) % 4.6), -5, -2.6 + (i * 0.37) % 5.2 + 0.07, 2.57 + ((i * 1.31) % 4.6), -4.95, 0xffffff])]
      : [[-2.2, 5.5, -5.0, -0.9, 6.0, -4.95, 0xffffff], [-1.8, 5.9, -5.0, -1.2, 6.3, -4.95, 0xffffff],
         [1.0, 3.4, -5.0, 2.3, 3.8, -4.95, 0xffffff], [1.3, 3.8, -5.0, 1.9, 4.1, -4.95, 0xffffff]];
    const skyMat = tint(night ? 0x101a36 : 0x9fd2f5, true);
    const skyGeo = new THREE.PlaneGeometry(6, 5.6); S.own.push(skyGeo);
    const skyP = new THREE.Mesh(skyGeo, skyMat); skyP.position.set(0, 4.8, -5.1); scene.add(skyP);
    const bitsMat = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }); S.own.push(bitsMat);
    scene.add(new THREE.Mesh((g => (S.own.push(g), g))(kit.boxGeo(skyBits)), bitsMat));

    // the album: a back board, the block of pages, a cover hinged at the spine
    const BW = 2.6, BD = 3.4, y0 = 1.0, spine = -BW / 2;
    scene.add(mesh(kit.boxGeo([[spine, y0, -BD / 2, spine + BW, y0 + 0.08, BD / 2, 0x1d6a2c],
                               [spine + 0.06, y0 + 0.08, -BD / 2 + 0.08, spine + BW - 0.08, y0 + 0.36, BD / 2 - 0.08, 0xf6f0de],
                               [spine - 0.06, y0, -BD / 2, spine + 0.06, y0 + 0.44, BD / 2, 0x124a1d]])));
    const hinge = (geo, y) => { const g = new THREE.Group(); g.position.set(spine, y, 0); g.add(geo); scene.add(g); return g; };
    const coverC = 0x2f8f3e;
    const coverG = mesh(kit.boxGeo([[0, 0, -BD / 2, BW, 0.08, BD / 2, coverC],
      [0.5, 0.08, -0.9, BW - 0.5, 0.1, 0.9, 0xfffdf6]]));
    const cover = hinge(coverG, y0 + 0.36);
    // the horseshoe on the cover: paper, or the rainbow when an Epic is inside
    const emblemMat = tint(0xc9b98a);
    const shoeGeo = new THREE.BoxGeometry(0.17, 0.05, 0.2); S.own.push(shoeGeo);
    const shoe = new THREE.Group();
    for (const [x, z] of [[-0.42, 0.45], [-0.42, 0.15], [-0.42, -0.15], [-0.36, -0.42], [-0.18, -0.58], [0, -0.62],
                          [0.18, -0.58], [0.36, -0.42], [0.42, -0.15], [0.42, 0.15], [0.42, 0.45]]) {
      const b = new THREE.Mesh(shoeGeo, emblemMat);
      b.position.set(x, 0, -z); shoe.add(b);            // open end away from the camera: a U
    }
    shoe.position.set(BW / 2, 0.12, 0); coverG.add(shoe);
    // three pages that turn, and the sticky note standing out of the block
    const pageGeo = new THREE.BoxGeometry(BW - 0.12, 0.02, BD - 0.2); S.own.push(pageGeo);
    pageGeo.translate((BW - 0.12) / 2, 0, 0);
    const pageMat = tint(0xfbf7ea);
    const pages = [0, 1, 2].map(i => { const p = new THREE.Mesh(pageGeo, pageMat); p.receiveShadow = true;
      return hinge(p, y0 + 0.34 + i * 0.006); });
    const noteMat = tint(SILVER, true);
    const noteGeo = new THREE.BoxGeometry(0.42, 0.03, 0.5); S.own.push(noteGeo);
    const note = new THREE.Mesh(noteGeo, noteMat);
    note.position.set(spine + BW + 0.12, y0 + 0.3, -0.7); scene.add(note);

    let tell = 0, coverAt = -1, pageAt = [-1, -1, -1];
    const dist = S.fitDist(BW + 2.4) + 1.8;
    S.run((t, dt) => {
      // a beat on the window and the desk, then down onto the album
      const k = ease((t - 0.5) / 2.2);
      cam.position.set(lerp(1.6, 0.25, k), lerp(4.8, y0 + dist * 0.8, k), lerp(9, dist * 0.6, k));
      cam.lookAt(lerp(0, 0.2, k), lerp(3.6, y0, k), lerp(-3, 0, k));
      emblemMat.color.setHex(c.best >= 2 ? tellColor(2, 0, t) : 0xc9b98a);
      noteMat.color.setHex(tellColor(tell, 0, t));
      if (coverAt >= 0) cover.rotation.z = Math.PI * ease((t - coverAt) / 0.7) * 0.995;
      pages.forEach((p, i) => { if (pageAt[i] >= 0) p.rotation.z = Math.PI * ease((t - pageAt[i]) / 0.55) * (0.985 - i * 0.004); });
    });

    await c.wait(2700);
    c.host.classList.add("hinted");
    await c.wait(c.best >= 2 ? 900 : 500);
    coverAt = S.clock();
    await c.wait(800);
    for (let i = 0; i < 3 && !c.skippedNow(); i++) {
      pageAt[i] = S.clock();
      await c.wait(420);
      if (i + 1 <= c.best) { tell = i + 1; c.flash(); await c.wait(i + 1 >= 2 ? 900 : 600); }
    }
    tell = c.best;
    await c.wait(500);
    c.flash();
  }

  // ---------------------------------------------------------------- cards: the deal
  /*
   * Out of the album, face down: one in the middle for a single, five by two for a ten.
   * Each back is edged in its own rarity, so the deal is a second, finer tell. They turn
   * over in order; an Epic is held back and turned last, alone. A tap moves it on.
   */
  async function openDeal(c) {
    const { list } = c;
    c.host.classList.add("dealt");
    c.stage.innerHTML = `<div class="deal n${list.length > 1 ? 10 : 1}">${list.map((it, i) => `
      <div class="dc t${TIER[it.tier]}" style="--i:${i}">
        <div class="dc-in">
          <div class="dc-back"><span class="dc-mark">${root.Icon ? Icon("horseshoe") : ""}</span></div>
          <div class="dc-face"><img src="${it.img}" alt="">${it.isNew ? `<i class="one-new">New</i>` : ""}</div>
        </div>
      </div>`).join("")}</div>`;
    const deal = c.stage.querySelector(".deal");
    const cards = [...deal.querySelectorAll(".dc")];
    requestAnimationFrame(() => requestAnimationFrame(() => deal.classList.add("in", "hinted")));
    await c.wait(650 + list.length * 70);
    const order = cards.map((el, i) => ({ el, i, it: list[i] }));
    for (const o of order.filter(o => o.it.tier < 2)) {
      if (c.skippedNow()) return;
      o.el.classList.add("flip");
      await c.wait(list.length > 1 ? 140 : 0);
    }
    for (const o of order.filter(o => o.it.tier >= 2)) {
      if (c.skippedNow()) return;
      await c.wait(list.length > 1 ? 700 : 300);
      if (c.skippedNow()) return;
      o.el.classList.add("flip", "glow");
      c.shown[o.i] = true;
      setTimeout(() => sparkle(o.el, { count: 20, spread: 50 }), 260);
      if (effects() && root.FX) FX.confetti({ count: 90 });
    }
    await c.wait(500);
    await c.tapWait();
  }

  root.ScoutFX = { play, itemsOf };
})(typeof globalThis !== "undefined" ? globalThis : this);
