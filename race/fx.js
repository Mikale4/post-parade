/*
 * Presentation effects. Nothing here touches the simulation -- it is all sugar, and it
 * is deliberately cheap: DOM nodes that remove themselves, plus one shared canvas for
 * anything that needs to be drawn per frame.
 *
 * Exposes FX.
 */
(function (root) {
  "use strict";

  /* A toggle that changes nothing is worse than no toggle, so every effect checks the
     setting that claims to control it. Settings may not be loaded yet (fx.js is listed
     first), hence the guards. */
  const pref = (id, dflt) => {
    const S = root.Settings;
    if (!S) return dflt;
    const v = S.get(id);
    return v === undefined ? dflt : v;
  };

  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[(Math.random() * arr.length) | 0];

  const STARS = ["✦", "✧", "✵", "✪", "✹"];

  /** A burst of sparkles at a page coordinate. */
  function sparkle(x, y, opts) {
    if (!pref("effects", true)) return;
    opts = opts || {};
    const n = opts.count || 10;
    const spread = opts.spread || 70;
    const colors = opts.colors || ["#fff", "#ffe98a", "#ffd0e6", "#c9f5a8"];
    for (let i = 0; i < n; i++) {
      const el = document.createElement("div");
      el.className = "fx-spark";   // not .spark: that is the inheritance tag
      el.textContent = pick(STARS);
      el.style.left = (x + rnd(-spread, spread)) + "px";
      el.style.top = (y + rnd(-spread, spread)) + "px";
      el.style.fontSize = rnd(11, 26) + "px";
      el.style.color = pick(colors);
      el.style.animationDelay = rnd(0, .35) + "s";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2000);
    }
  }

  /** Sparkles centred on an element. */
  function sparkleOn(el, opts) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    sparkle(r.left + r.width / 2, r.top + r.height / 2,
            Object.assign({ spread: Math.max(r.width, r.height) * .45 }, opts));
  }

  /* ---- confetti: one canvas, physics, removes itself when empty ---- */
  let confCanvas = null, confParts = [], confRAF = 0;
  function confetti(opts) {
    if (!pref("effects", true)) return;
    opts = opts || {};
    const n = opts.count || 90;
    if (!confCanvas) {
      confCanvas = document.createElement("canvas");
      confCanvas.style.cssText =
        "position:fixed;inset:0;pointer-events:none;z-index:880";
      document.body.appendChild(confCanvas);
    }
    const w = confCanvas.width = innerWidth, h = confCanvas.height = innerHeight;
    const colors = opts.colors || ["#57c527", "#ff67a4", "#ffc63f", "#48c6ea", "#9b6dd6", "#fff"];
    for (let i = 0; i < n; i++) {
      confParts.push({
        x: opts.x != null ? opts.x : rnd(0, w),
        y: opts.y != null ? opts.y : rnd(-h * .3, 0),
        vx: rnd(-2.4, 2.4), vy: rnd(1.5, 5),
        w: rnd(6, 13), h: rnd(8, 17),
        rot: rnd(0, 6.28), vr: rnd(-.16, .16),
        c: pick(colors), life: rnd(2.4, 4.2),
      });
    }
    if (!confRAF) confRAF = requestAnimationFrame(confStep);
  }
  let confLast = 0;
  function confStep(now) {
    const dt = Math.min(.05, (now - (confLast || now)) / 1000);
    confLast = now;
    const ctx = confCanvas.getContext("2d");
    ctx.clearRect(0, 0, confCanvas.width, confCanvas.height);
    for (const p of confParts) {
      p.life -= dt;
      p.vy += 9 * dt; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    confParts = confParts.filter(p => p.life > 0 && p.y < confCanvas.height + 40);
    if (confParts.length) confRAF = requestAnimationFrame(confStep);
    else { confRAF = 0; ctx.clearRect(0, 0, confCanvas.width, confCanvas.height); }
  }

  /** Full-screen diagonal wipe. `mid` runs while the screen is covered. */
  function wipe(mid) {
    const el = document.getElementById("wipe");
    if (!el) { if (mid) mid(); return; }
    el.classList.remove("run");
    void el.offsetWidth;                 // restart the animation
    el.classList.add("run");
    setTimeout(() => { if (mid) mid(); }, 300);
    setTimeout(() => el.classList.remove("run"), 700);
  }

  /** Screen shake, for a finish or a big hit. */
  function shake(ms, px) {
    if (!pref("shake", true)) return;
    const t = document.querySelector(".shakeable") || document.body;
    const amt = px || 7, until = performance.now() + (ms || 380);
    (function step(now) {
      if (now > until) { t.style.transform = ""; return; }
      const k = (until - now) / (ms || 380);
      t.style.transform = `translate(${rnd(-amt, amt) * k}px,${rnd(-amt, amt) * k}px)`;
      requestAnimationFrame(step);
    })(performance.now());
  }

  /**
   * Typewriter. Returns a handle with .skip() so a click can jump to the end --
   * never make someone wait through text they have already read.
   */
  function typeText(el, text, opts) {
    opts = opts || {};
    // dialogue speed is a setting; 0 means show it all at once
    const pspeed = pref("textSpeed", 18);
    const speed = pspeed === 0 ? 0 : (opts.speed || pspeed);
    if (speed === 0) {
      el.textContent = text;
      if (opts.onDone) opts.onDone();
      return { skip(){}, isDone: () => true };
    }
    let i = 0, done = false, timer = 0;
    el.textContent = "";
    function finish() {
      done = true; clearTimeout(timer);
      el.textContent = text;
      if (opts.onDone) opts.onDone();
    }
    function tick() {
      if (done) return;
      i++;
      el.textContent = text.slice(0, i);
      if (i >= text.length) return finish();
      const ch = text[i - 1];
      const pause = ".!?".includes(ch) ? speed * 9 : ",;".includes(ch) ? speed * 4 : speed;
      timer = setTimeout(tick, pause);
    }
    timer = setTimeout(tick, speed);
    return { skip: finish, isDone: () => done };
  }

  /** A floating "+120 XP" style number that drifts up and fades. */
  function popNumber(x, y, text, color) {
    if (!pref("effects", true)) return;
    const el = document.createElement("div");
    el.textContent = text;
    el.style.cssText =
      "position:fixed;left:" + x + "px;top:" + y + "px;transform:translate(-50%,-50%);" +
      "font:900 26px 'Segoe UI',sans-serif;pointer-events:none;z-index:890;" +
      "color:" + (color || "#fff") + ";text-shadow:0 3px 0 rgba(0,0,0,.35),0 0 14px rgba(255,255,255,.6);" +
      "animation:pop-num 1.5s cubic-bezier(.2,.9,.3,1) forwards";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }

  /* keyframes that only FX needs, injected once */
  const style = document.createElement("style");
  style.textContent =
    "@keyframes pop-num{0%{opacity:0;transform:translate(-50%,-20%) scale(.6)}" +
    "22%{opacity:1;transform:translate(-50%,-60%) scale(1.15)}" +
    "100%{opacity:0;transform:translate(-50%,-160%) scale(1)}}";
  document.head.appendChild(style);

  /** Ambient drifting petals/sparkles behind a menu. Returns a stop() function. */
  function ambient(container, opts) {
    if (!pref("effects", true)) return () => {};
    opts = opts || {};
    let alive = true;
    const every = opts.every || 420;
    (function spawn() {
      if (!alive) return;
      const el = document.createElement("div");
      el.textContent = pick(STARS);
      const size = rnd(10, 22);
      el.style.cssText =
        "position:absolute;pointer-events:none;color:rgba(255,255,255,." + rnd(35, 80) / 100 + ");" +
        "font-size:" + size + "px;left:" + rnd(0, 100) + "%;top:105%;" +
        "animation:amb " + rnd(7, 14) + "s linear forwards";
      container.appendChild(el);
      setTimeout(() => el.remove(), 15000);
      setTimeout(spawn, rnd(every * .5, every * 1.6));
    })();
    return () => { alive = false; };
  }
  const ambStyle = document.createElement("style");
  ambStyle.textContent =
    "@keyframes amb{to{top:-12%;transform:translateX(60px) rotate(220deg)}}";
  document.head.appendChild(ambStyle);

  const api = { sparkle, sparkleOn, confetti, wipe, shake, typeText, popNumber, ambient };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FX = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
