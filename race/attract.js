/*
 * The title screen's race: random launch racers running a real race behind the logo.
 *
 * It is this game's own race, not a loop of footage: the simulation (sim.js), the card
 * AI (ai.js) and every racer's real unique, drawn by the voxel race view with its Auto
 * director cutting between broadcast shots. Each race is a real G1 off the calendar,
 * run by eight racers who suit its trip and ground, and when the field has pulled up the
 * next one is drawn. Nobody's account is touched -- nothing here is saved or paid.
 *
 * Without three.js or WebGL it does nothing, and the title keeps its key art.
 *
 *   Attract.start(host, caption)   -> true if a race is running in `host`
 *   Attract.stop()
 */
(function (root) {
  "use strict";

  const FIELD = 8;
  const RATE = 1.6;              // faster than life, slower than the 2x a player races at
  const HOLD = 4.5;              // seconds on the finish before the next race is drawn
  const APT = { S: 6, A: 5, B: 4, C: 3, D: 2, E: 1, F: 0, G: -1 };
  const DIST_CLASS = m => m <= 1400 ? "sprint" : m <= 1800 ? "mile" : m <= 2400 ? "medium" : "long";

  let raf = 0, G = null, host = null, caption = null, last = 0, endAt = 0, shown = 0;

  const rand = n => Math.floor(Math.random() * n);
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const suits = (d, course) => (APT[d.aptitude[DIST_CLASS(course.distance)]] || 0) >= 3 &&
                               (APT[d.aptitude[course.surface]] || 0) >= 3;

  /** A real G1 and eight racers who could win it. */
  function draw() {
    const roster = (root.RosterData && root.RosterData.ROSTER) || [];
    const cal = ((root.CareerData && root.CareerData.CALENDAR) || [])
      .filter(r => r.grade === "G1" && r.metres >= 1200 && r.metres <= 2500);
    for (let tries = 0; tries < 12; tries++) {
      const r = cal.length ? cal[rand(cal.length)] : { id: "mile", name: "Yasuda Kinen", metres: 1600, surface: "turf" };
      const course = { id: r.id, name: r.name, distance: r.metres, surface: r.surface };
      const able = shuffle(roster.filter(d => suits(d, course)));
      if (able.length >= 6 || tries === 11) {
        const rest = shuffle(roster.filter(d => able.indexOf(d) < 0));
        return { course, field: able.concat(rest).slice(0, FIELD) };
      }
    }
    return null;
  }

  function newRace() {
    const pick = draw();
    if (!pick) return false;
    const seed = (Math.random() * 1e9) | 0;
    // a spread of form, so the race is a race and not eight identical lines
    const defs = pick.field.map(d => root.Progress.build(d, { level: 12 + rand(30) }));
    const S = root.Sim.createRace(defs, pick.course, seed);
    root.Uniques.arm(S, defs);
    const personalities = {};
    for (const d of defs) personalities[d.id] = d.personality;
    const ctrls = root.Racers.createField(S, personalities, seed);
    // the director's featured runner, the one its hero shots go to
    const me = S.racers[rand(S.racers.length)];
    G = { S, me, course: pick.course, ctrls, done: false, paused: false, atGate: false };
    last = 0; shown = 0;
    return root.Voxel.setupRace(host, G, { attract: true });
  }

  function step(dt) {
    let left = dt * RATE;
    while (left > 1e-6 && !G.S.over) {
      const h = Math.min(0.02, left);
      root.Sim.step(G.S, h);
      root.Racers.updateAll(G.ctrls, G.S, G.course, h);
      for (const u of root.Uniques.check(G.S, G.course)) root.Voxel.signature(u.racer, u.unique, G);
      G.S.events.length = 0;
      left -= h;
    }
  }

  /* The broadcast caption: which race this is and who leads it, then who won. */
  function paintCaption(now) {
    if (!caption || now - shown < 250) return;
    shown = now;
    const order = root.Sim.standings(G.S);
    const lead = order[0];
    const m = G.course.distance + "m " + G.course.surface;
    caption.innerHTML =
      `<span class="tl-tag">${G.done ? "Result" : "Live"}</span>` +
      `<span class="tl-race"><b>${esc(G.course.name)}</b><i>${m}</i></span>` +
      (lead ? `<span class="tl-lead"><em>${G.done ? "Won by" : "Leading"}</em>${esc(lead.name)}</span>` : "");
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function frame(now) {
    if (!G) return;
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    if (!G.done) {
      step(dt);
      if (G.S.over) { G.done = true; endAt = now + HOLD * 1000; }
    } else if (now > endAt) {
      if (!newRace()) return stop();
    }
    root.Voxel.render(G, now);
    paintCaption(now);
  }

  function start(el, cap) {
    stop();
    if (!root.Voxel || !root.Voxel.ok || !root.Sim || !root.Racers || !root.Progress) return false;
    host = el; caption = cap || null;
    try { if (!newRace()) { stop(); return false; } }
    catch (e) { stop(); return false; }
    raf = requestAnimationFrame(frame);
    return true;
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0; G = null; host = null; caption = null;
  }

  const api = { start, stop, get running() { return !!G; } };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Attract = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
