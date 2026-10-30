/*
 * The trainer: the player's own character, made when the account is.
 *
 * A man or a woman; skin; a haircut and its colour; eyes; what they wear to work -- a
 * suit and tie, a tracksuit, a sweater over a shirt, a polo and a cap -- in one of eight
 * colours; trousers or a skirt; glasses or not. The choices are kept on the account
 * (Auth, `trainer`) as indices into voxel.js's TRAINER lists, and voxel.js builds the
 * figure from them (kit.trainer.make): the same rig as the racers, so the lobby can walk
 * it, sit it at the office desk, and pose it like anyone else.
 *
 *   Trainer.build(el, { initial, title, lead, done, onDone(choices), onBack })
 *   Trainer.stop()            -- the preview's renderer, when the screen goes
 *   Trainer.def(account)      -- the lobby's description of her: { id: "trainer", name, trainer }
 */
(function (root) {
  "use strict";

  const THREE = root.THREE, V = root.Voxel;
  const K = V && V.ok && V.kit && V.kit.trainer;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const hex = n => "#" + n.toString(16).padStart(6, "0");

  const STYLE_NAMES = { short: "Short", spiky: "Spiky", slick: "Swept back", buzz: "Buzz cut", shaggy: "Shaggy",
                        bob: "Bob", long: "Long", ponytail: "Ponytail", bun: "Bun", pixie: "Pixie" };
  const BOTTOM_NAMES = { trousers: "Trousers", jeans: "Jeans", shorts: "Shorts", skirt: "Skirt", pleated: "Pleated skirt", long: "Long skirt" };
  const ATTIRE_NAMES = { suit: "Suit", tracksuit: "Tracksuit", sweater: "Sweater", polo: "Polo and cap" };
  /* The rows of choices: a segmented control for words, a row of swatches for colours. The
     cuts and the bottoms are a man's or a woman's own, so those rows follow the first. */
  const ROWS = [
    { key: "sex", label: "Trainer", seg: () => [["m", "Man"], ["f", "Woman"]] },
    { key: "skin", label: "Skin", sw: "skins" },
    { key: "style", label: "Hair", seg: c => K.OPTIONS.styles[c.sex].map(s => [s, STYLE_NAMES[s]]), bySex: true },
    { key: "hair", label: "Hair colour", sw: "hairs" },
    { key: "eyes", label: "Eyes", sw: "eyes" },
    { key: "attire", label: "Attire", seg: () => K.OPTIONS.attires.map(a => [a, ATTIRE_NAMES[a]]) },
    { key: "colour", label: "Colour", sw: "colours" },
    { key: "bottoms", label: "Bottoms", seg: c => K.OPTIONS.bottoms[c.sex].map(b => [b, BOTTOM_NAMES[b]]), bySex: true },
    { key: "glasses", label: "Glasses", seg: () => [[false, "None"], [true, "Glasses"]] },
  ];

  // ---------------------------------------------------------------- the preview
  /* The trainer on a little round of turf, turning slowly; drag to turn them yourself. */
  let P = null;
  function preview(host, choices) {
    stop();
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(root.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(0, 1.2, 5.2); camera.lookAt(0, 0.92, 0);
    scene.add(new THREE.HemisphereLight(0xfff8ea, 0xb8c8a8, 0.85));
    const sun = new THREE.DirectionalLight(0xfff0d8, 0.6);
    sun.position.set(2, 5, 4); sun.castShadow = true; sun.shadow.mapSize.set(512, 512);
    scene.add(sun);
    const turf = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.95, 0.12, 40),
      new THREE.MeshLambertMaterial({ color: 0x4f9a42 }));
    turf.position.y = -0.06; turf.receiveShadow = true; scene.add(turf);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.025, 6, 48), new THREE.MeshBasicMaterial({ color: 0xf6f2e6 }));
    rim.rotation.x = Math.PI / 2; rim.position.y = 0.005; scene.add(rim);
    const st = { renderer, scene, camera, host, model: null, yaw: 0.5, drag: null, spin: 0.45, raf: 0, last: 0 };
    const set = c => {
      if (st.model) scene.remove(st.model.root);
      st.model = K.make(c);
      st.model.root.rotation.y = st.yaw;
      scene.add(st.model.root);
    };
    set(choices);
    const cv = renderer.domElement;
    cv.addEventListener("pointerdown", e => { st.drag = e.clientX; st.spin = 0; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener("pointermove", e => { if (st.drag == null) return; st.yaw += (e.clientX - st.drag) * 0.012; st.drag = e.clientX; });
    const up = () => { st.drag = null; st.spin = 0.45; };
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    const frame = now => {
      st.raf = requestAnimationFrame(frame);
      const dt = st.last ? Math.min(0.05, (now - st.last) / 1000) : 0;
      st.last = now;
      const w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      const sz = renderer.getSize(new THREE.Vector2());
      if (sz.x !== w || sz.y !== h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
      st.yaw += st.spin * dt;
      st.model.root.rotation.y = st.yaw;
      V.kit.pose(st.model, 0, now / 1000, {});
      renderer.render(scene, camera);
    };
    st.raf = requestAnimationFrame(frame);
    P = { set, st };
    return P;
  }
  function stop() {
    if (!P) return;
    cancelAnimationFrame(P.st.raf);
    P.st.renderer.dispose();
    P.st.renderer.domElement.remove();
    P = null;
  }

  // ---------------------------------------------------------------- the screen
  function build(el, o) {
    o = o || {};
    const c = Object.assign({}, K.defaults(o.initial && o.initial.sex), o.initial || {});
    const O = K.OPTIONS;
    const segButtons = r => r.seg(c).map(([v, t]) => `<button data-v="${esc(JSON.stringify(v))}">${esc(t)}</button>`).join("");
    const row = r => {
      if (r.sw) return `<div class="tc-row"><span>${r.label}</span><div class="tc-sw" data-key="${r.key}">` +
        O[r.sw].map((col, i) => `<button data-v="${i}" style="--sw:${hex(col)}" title="${r.label} ${i + 1}"></button>`).join("") + `</div></div>`;
      return `<div class="tc-row"><span>${r.label}</span><div class="seg tc-seg" data-key="${r.key}">${segButtons(r)}</div></div>`;
    };
    el.innerHTML = `
      <div class="stripes login-bg"></div>
      <div class="panel tc-panel pop">
        <div class="panel-hd">${root.Icon ? Icon("person") : ""}${esc(o.title || "Your trainer")}</div>
        <div class="tc-body">
          <div class="tc-prev"><i class="tc-hint">Drag to turn</i></div>
          <div class="tc-opts">
            <p class="login-lead">${esc(o.lead || "This is you: the one walking the academy's halls, and waiting in the office for your racers.")}</p>
            ${ROWS.map(row).join("")}
            <div class="login-actions">
              <button class="btn lg" id="tcDone">${esc(o.done || "Continue")}</button>
              <button class="btn ghost sm" id="tcRandom">Surprise me</button>
              ${o.onBack ? `<button class="btn ghost sm" id="tcBack">${root.Icon ? Icon("back") : ""}Back</button>` : ""}
            </div>
          </div>
        </div>
      </div>`;
    const sync = () => {
      el.querySelectorAll("[data-key]").forEach(g => {
        const k = g.dataset.key;
        g.querySelectorAll("button").forEach(b => {
          const v = g.classList.contains("tc-sw") ? +b.dataset.v : JSON.parse(b.dataset.v);
          b.classList.toggle("sel", v === c[k]);
        });
      });
      if (P) P.set(c);
    };
    el.querySelectorAll("[data-key]").forEach(g => g.onclick = e => {
      const b = e.target.closest("button");
      if (!b) return;
      const k = g.dataset.key, v = g.classList.contains("tc-sw") ? +b.dataset.v : JSON.parse(b.dataset.v);
      // a change of body brings that body's own cuts and bottoms, starting from its usual ones
      const sexChange = k === "sex" && v !== c.sex;
      if (sexChange) { const d = K.defaults(v); c.style = d.style; c.bottoms = d.bottoms; }
      c[k] = v;
      if (sexChange) bySex();
      sync();
    });
    const bySex = () => ROWS.filter(r => r.bySex).forEach(r => { el.querySelector(`[data-key="${r.key}"]`).innerHTML = segButtons(r); });
    el.querySelector("#tcRandom").onclick = () => {
      const r = n => Math.floor(Math.random() * n), any = a => a[r(a.length)];
      c.sex = Math.random() < 0.5 ? "m" : "f";
      c.skin = r(O.skins.length); c.hair = r(O.hairs.length); c.eyes = r(O.eyes.length);
      c.style = any(O.styles[c.sex]); c.attire = any(O.attires); c.bottoms = any(O.bottoms[c.sex]);
      c.colour = r(O.colours.length); c.glasses = Math.random() < 0.25;
      bySex();
      sync();
    };
    el.querySelector("#tcDone").onclick = () => { stop(); if (o.onDone) o.onDone(Object.assign({}, c)); };
    if (o.onBack) el.querySelector("#tcBack").onclick = () => { stop(); o.onBack(); };
    if (K && THREE) preview(el.querySelector(".tc-prev"), c);
    sync();
  }

  /** The lobby's idea of her: walked as, or sat in the office. */
  const def = acc => ({ id: "trainer", name: (acc && acc.user) || "Trainer",
                        trainer: (acc && acc.trainer) || (K ? K.defaults("m") : {}) });

  root.Trainer = { ok: !!(K && THREE), build, stop, def };
})(typeof globalThis !== "undefined" ? globalThis : this);
