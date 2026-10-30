/*
 * Scene backgrounds.
 *
 * bgdata.js is the generated index (scene -> images, and screen -> scenes). This picks
 * one for a given screen and paints it, choosing the seasonal theme and time of day when
 * the scene has them -- so a career turn in December looks like December.
 *
 * Every screen used to sit on a generated diagonal-stripe gradient. That still exists as
 * the fallback, because the folder is filled in over time and a screen with no art yet
 * must not render as a blank rectangle.
 *
 * Backgrounds are photographs behind text, so every scene gets a scrim: a dark wash for
 * light art, sized so panels stay readable without the art turning to mud.
 *
 * Exposes Bg.
 */
(function (root) {
  "use strict";

  const Data = typeof require !== "undefined" ? require("./bgdata.js") : root.BgData;

  const THEME = { normal: "00", autumn: "03", snow: "04", spring: "05",
                  halloween: "07", festival: "08", party: "10" };
  const TIME = { day: 1, sunset: 2, night: 3, late: 4 };

  /* Career months map to the theme the art actually has. December through February is
     snow, March to May spring, June to August the plain summer art, and autumn covers
     September to November. */
  const MONTH_THEME = ["04", "04", "05", "05", "05", "00",
                       "00", "00", "03", "03", "03", "04"];

  const has = scene => !!(Data && Data.BG[scene] && Data.BG[scene].length);

  /** The scenes a role may use, in preference order, filtered to what exists. */
  function scenesFor(role) {
    if (!Data) return [];
    return (Data.ROLES[role] || []).filter(has);
  }

  /**
   * Choose an image.
   *   opts.theme    "00".."10", or a THEME name
   *   opts.month    0-11, used when no theme is given -- picks the season
   *   opts.time     1-4, or a TIME name
   *   opts.crowd    true to prefer a variant with people in it
   *   opts.scene    force a specific scene id, ignoring the role
   * Falls back along theme, then time, then simply the first image the scene has, so a
   * missing variant degrades instead of failing.
   */
  function pick(role, opts) {
    opts = opts || {};
    if (!Data) return null;

    const scene = opts.scene && has(opts.scene) ? opts.scene : scenesFor(role)[0];
    if (!scene) return null;
    const all = Data.BG[scene];

    let theme = opts.theme != null ? (THEME[opts.theme] || opts.theme) : null;
    if (!theme && opts.month != null) theme = MONTH_THEME[opts.month % 12];
    const time = opts.time != null ? (TIME[opts.time] || opts.time) : null;

    const score = v => {
      let s = 0;
      if (theme && v.theme === theme) s += 8;
      if (!theme && v.theme === "00") s += 4;          // plain art when nothing is asked
      if (time && v.time === time) s += 4;
      if (!time && v.time === 1) s += 2;               // daylight by default
      if (opts.crowd && v.variant > 0) s += 3;
      if (!opts.crowd && v.variant === 0) s += 1;
      return s;
    };
    return all.slice().sort((a, b) => score(b) - score(a))[0] || all[0];
  }

  const fileFor = (role, opts) => { const v = pick(role, opts); return v ? v.file : null; };

  /* Art paths contain no spaces today, but the folder is user-filled and one day will,
     so encode rather than find out later. */
  const url = p => encodeURI(p).replace(/'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29");

  /**
   * The markup for a screen's background: the scene, a scrim, and the striped gradient
   * underneath as the fallback for roles with no art yet.
   */
  function layer(role, opts) {
    const f = fileFor(role, opts);
    if (!f) return '<div class="menu-bg turf-bg stripes"></div>';
    return '<div class="scene-bg" style="background-image:url(\'' + url(f) + '\')"></div>' +
           '<div class="scene-scrim' + ((opts && opts.scrim) ? " " + opts.scrim : "") + '"></div>';
  }

  /** Paint an existing element instead of emitting markup. */
  function apply(el, role, opts) {
    if (!el) return;
    const f = fileFor(role, opts);
    if (!f) { el.className = "menu-bg turf-bg stripes"; return; }
    el.className = "scene-bg";
    el.style.backgroundImage = "url('" + url(f) + "')";
  }

  /* Warm the few that are hit constantly, so moving between menus does not flash. Only
     these -- the folder is ~60MB and preloading all of it would be worse than a flash. */
  function preload(roles) {
    for (const r of (roles || ["menu", "career", "scout", "stable"])) {
      const f = fileFor(r);
      if (f) { const i = new Image(); i.src = url(f); }
    }
  }

  /** Everything a scene can offer, for a debug or gallery view. */
  const variantsOf = scene => (Data && Data.BG[scene]) || [];
  const sceneName = scene => (Data && Data.SCENES[scene] && Data.SCENES[scene].name) || scene;
  const roles = () => (Data ? Object.keys(Data.ROLES) : []);

  const api = { THEME, TIME, MONTH_THEME, pick, fileFor, layer, apply, preload,
                scenesFor, variantsOf, sceneName, roles, url };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Bg = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
