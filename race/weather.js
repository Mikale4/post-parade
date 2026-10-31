/*
 * Seasons and weather on the career screens.
 *
 * A career turn has a season (by its month) and the day's weather (Career.weatherOf: clear,
 * cloudy, rain, or snow in winter). The turn screen's backgrounds are photographs with a
 * handful of seasonal variants, so the weather itself is laid over them here: a canvas of
 * square, voxel-like particles -- sakura petals in spring, light motes in summer, falling
 * leaves in autumn, rain, snow -- and a flat wash for an overcast or wet day and for the
 * evening half of the month (the art has no evening shots).
 *
 * The race view does its own version in 3D (voxel.js applySeason); this file also names
 * the weather for both.
 *
 *   Weather.mount(container, w, { evening })   start the overlay; it stops itself when the
 *                                               container leaves the page
 *   Weather.label(w)                            "Spring · Rain · Soft"
 *
 * Off when Settings has sparkles and confetti off, and still (washes only) for anyone
 * who asks the system for reduced motion.
 *
 * Exposes Weather.
 */
(function (root) {
  "use strict";

  const SEASON_NAME = { spring: "Spring", summer: "Summer", autumn: "Autumn", winter: "Winter" };
  const WEATHER_NAME = { clear: "Clear", cloudy: "Cloudy", rain: "Rain", snow: "Snow" };
  // the going, which is what the weather does to a race (sim.js GROUND)
  const GROUND_NAME = { firm: "Firm", good: "Good", soft: "Soft", heavy: "Heavy" };
  const label = w => w ? [SEASON_NAME[w.season], WEATHER_NAME[w.weather], GROUND_NAME[w.ground]]
    .filter(Boolean).join(" · ") : "";

  /* Flat washes, laid over the art: nothing graded, just a tint. */
  const WASH = { cloudy: "rgba(70,80,96,.18)", rain: "rgba(40,52,72,.30)", snow: "rgba(220,230,244,.16)" };
  const EVENING = "rgba(255,128,48,.16)";

  /* What falls, per kind: how many, how big, how fast, and its colours. */
  const KINDS = {
    rain:   { n: 170, w: [1.5, 1.5], h: [14, 22], vy: [900, 1200], vx: [-140, -110], c: ["rgba(214,228,244,.55)", "rgba(190,210,232,.45)"] },
    snow:   { n: 120, w: [3, 6], vy: [30, 70], vx: [-20, 20], wob: 22, c: ["rgba(255,255,255,.9)", "rgba(236,242,250,.85)"] },
    petals: { n: 46,  w: [5, 8], vy: [40, 80], vx: [20, 60], wob: 30, spin: true, c: ["#f6b8cc", "#f2a2bc", "#fbd2de"] },
    leaves: { n: 36,  w: [6, 9], vy: [50, 90], vx: [-30, 30], wob: 40, spin: true, c: ["#d8762a", "#c8402a", "#e8b23a", "#b85a22"] },
    motes:  { n: 26,  w: [2, 4], vy: [-12, -4], vx: [-8, 8], wob: 10, twinkle: true, c: ["rgba(255,246,200,.75)", "rgba(255,236,170,.6)"] },
  };
  /** What a day throws up: the weather first, then the season's own. */
  function kindsFor(w) {
    if (!w) return [];
    if (w.weather === "rain") return ["rain"];
    if (w.weather === "snow") return ["snow"];
    const own = { spring: "petals", summer: "motes", autumn: "leaves" }[w.season];
    return own ? [own] : [];
  }

  const R = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const reduced = () => !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const effectsOn = () => !root.Settings || root.Settings.get("effects") !== false;

  function mount(container, w, opts) {
    if (!container || !w) return;
    opts = opts || {};
    const washes = [WASH[w.weather], opts.evening ? EVENING : null].filter(Boolean);
    for (const c of washes) {
      const d = document.createElement("div");
      d.className = "wx-wash";
      d.style.background = c;
      container.appendChild(d);
    }
    const kinds = kindsFor(w);
    if (!kinds.length || !effectsOn() || reduced()) return;

    const cv = document.createElement("canvas");
    cv.className = "wx-fx";
    container.appendChild(cv);
    const ctx = cv.getContext("2d");
    let W = 0, H = 0, dpr = 1;
    const size = () => {
      dpr = Math.min(2, root.devicePixelRatio || 1);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.max(1, Math.round(W * dpr)); cv.height = Math.max(1, Math.round(H * dpr));
    };
    size();
    // fewer on a small screen: the same density, not the same count
    const area = Math.max(0.35, Math.min(1, (W * H) / (1280 * 720)));
    const parts = [];
    for (const k of kinds) {
      const K = KINDS[k];
      for (let i = 0; i < Math.round(K.n * area); i++) parts.push(spawn(K, true));
    }
    function spawn(K, anywhere) {
      return {
        K, x: R(-40, W + 40), y: anywhere ? R(-H * 0.2, H) : R(-60, -10),
        w: R(K.w[0], K.w[1]), h: K.h ? R(K.h[0], K.h[1]) : 0,
        vx: R(K.vx[0], K.vx[1]), vy: R(K.vy[0], K.vy[1]),
        ph: R(0, 6.28), a: R(0, 6.28), va: K.spin ? R(-2.5, 2.5) : 0, c: pick(K.c),
      };
    }
    let last = performance.now();
    function frame(now) {
      if (!cv.isConnected) return;                                   // the screen moved on
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (cv.clientWidth !== W || cv.clientHeight !== H) size();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i], K = p.K;
        p.ph += dt * 1.6; p.a += p.va * dt;
        p.x += (p.vx + (K.wob ? Math.sin(p.ph) * K.wob : 0)) * dt;
        p.y += p.vy * dt;
        if (p.y > H + 30 || p.y < -80 || p.x < -80 || p.x > W + 80) { parts[i] = spawn(K, false); if (K.vy[0] < 0) parts[i].y = H + 10; continue; }
        ctx.fillStyle = p.c;
        if (K.h) {                                                    // rain: a slanted streak
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vx, p.vy) * -1);
          ctx.fillRect(-p.w / 2, -p.h, p.w, p.h); ctx.restore();
        } else if (K.spin) {                                          // a square turning as it falls
          const s = p.w * (0.55 + 0.45 * Math.abs(Math.cos(p.a)));
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a * 0.5);
          ctx.fillRect(-s / 2, -p.w / 2, s, p.w); ctx.restore();
        } else {
          if (K.twinkle) ctx.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(p.ph * 1.7));
          ctx.fillRect(Math.round(p.x), Math.round(p.y), p.w, p.w);
          ctx.globalAlpha = 1;
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  const api = { mount, label, kindsFor, SEASON_NAME, WEATHER_NAME, GROUND_NAME };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Weather = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
