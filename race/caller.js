/*
 * The race caller, as captions. The real game's races are called live at the moments that
 * matter: the break, who leads, the final corner, the straight, a finish too close to
 * call, the winner. This puts the same calls on screen, a broadcast caption under the
 * action with the names in gold. No voice: it was tried with the browser's speech and cut
 * -- the captions are the caller. The lines are written for this game.
 *
 * It watches the race from ambience.js's tick and decides what is worth a call; it never
 * runs two calls over each other (a bigger moment replaces a smaller one; a stale line is
 * dropped), and it stays off the screen while the race is paused, in a cutscene, or while
 * Tazuna is talking.
 *
 * Setting: raceCaller (on/off).
 *
 *   Caller.raceStart(G)          a new race
 *   Caller.tick(G, hold, rate)   every frame; `hold` true while it must keep quiet
 *   Caller.rivalry(a, b)         two racers have just clashed (called once play resumes)
 *   Caller.stop()                off the race screen: gone, now
 *
 * Exposes Caller.
 */
(function (root) {
  "use strict";

  const bare = s => String(s || "").replace(/​/g, "");
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const on = () => {
    const S = root.Settings, v = S ? S.get("raceCaller") : true;
    return v !== false && v !== "off";
  };

  /* Each call; {a} and {b} are names. A few of each, so the same race does not read the
     same twice. */
  const LINES = {
    off:       ["And they're off!", "The gates open, and away they go!", "A clean break, all away together!"],
    early:     ["{a} goes to the front!", "{a} takes it up, {b} tracking her.", "{a} leads, {b} right behind."],
    mid:       ["Halfway, and it's {a} in front.", "Past halfway, still {a} at the head of affairs."],
    midNew:    ["A change at the front: {a}!", "{a} has taken over the lead!"],
    corner:    ["Into the final turn, {a} leads!", "Round the final turn, {a} in front, {b} closing!"],
    straight:  ["Into the home straight!", "Into the straight, and it's {a}!"],
    outside:   ["{a} on the outside! Here she comes!"],
    inside:    ["{a} finding room on the inside!"],
    charge:    ["{a} is flying!", "{a} is eating up the ground!"],
    change:    ["{a} hits the front!", "{a} breaks clear!"],
    fading:    ["{a} is feeling it now!"],
    last200:   ["Two hundred to go!"],
    close:     ["{a} or {b}!", "{a} and {b}, nothing between them!"],
    win:       ["{a} wins it!", "It's {a}! {a} has won!"],
    winFar:    ["{a} by a distance! Far too good!"],
    winNarrow: ["{a}, by the barest of margins!"],
    winLate:   ["{a} comes from behind to win it!"],
    winWire:   ["{a} makes every yard and wins!"],
    rival:     ["{a} and {b}, locked in a duel!", "{a} and {b}, neither giving an inch!"],
  };
  // how much each call matters: a bigger one replaces a smaller one on screen
  const PRIO = { off: 3, early: 2, mid: 2, midNew: 2, corner: 3, straight: 3, outside: 3, inside: 3,
                 charge: 3, change: 3, fading: 2, last200: 1, close: 4, rival: 3,
                 win: 5, winFar: 5, winNarrow: 5, winLate: 5, winWire: 5 };

  // ---------------------------------------------------------------- the caption
  function capEl() {
    let el = document.getElementById("callerCap");
    if (!el) {
      const stage = document.querySelector("#scr-game .stage");
      if (!stage) return null;
      el = document.createElement("div");
      el.id = "callerCap";
      stage.appendChild(el);
    }
    return el;
  }
  function hideCap() {
    const el = document.getElementById("callerCap");
    if (el) el.classList.remove("on");
  }

  // ---------------------------------------------------------------- showing a call
  const now_ = () => (root.performance ? performance.now() : Date.now());
  let showing = null, queued = null, lastUsed = {}, hush = false;

  function build(key, a, b) {
    const pool = LINES[key];
    // not the one used last time
    let i = Math.floor(Math.random() * pool.length);
    if (pool.length > 1 && lastUsed[key] === i) i = (i + 1) % pool.length;
    lastUsed[key] = i;
    const nA = bare(a && a.name), nB = bare(b && b.name);
    const fill = (s, f) => s.replace(/\{a\}/g, f(nA)).replace(/\{b\}/g, f(nB));
    return { key, prio: PRIO[key] || 1, born: now_(),
             text: fill(pool[i], n => n), html: fill(esc(pool[i]), n => "<b>" + esc(n) + "</b>") };
  }

  function call(key, a, b, rate) {
    // at 4x the race outruns any caller: only the moments that matter
    if (rate >= 4 && (PRIO[key] || 1) < 3) return;
    const it = build(key, a, b);
    it.ttl = (it.prio >= 5 ? 6000 : 2600) / Math.max(1, rate * 0.6);
    // up long enough to read, a little less when the race is run fast
    it.len = Math.max(1600, (1400 + it.text.length * 40) / Math.sqrt(rate));
    if (showing) {
      /* A bigger moment takes over at once; one as big takes over once the last has been
         up long enough to read -- at 4x the straight comes before the turn's call is down. */
      const read = now_() - showing.at > 900;
      if ((it.prio >= 4 && it.prio > showing.prio) || (it.prio >= 3 && it.prio >= showing.prio && read)) {
        clear(); return show(it);
      }
      if (!queued || it.prio >= queued.prio) queued = it;
      return;
    }
    show(it);
  }

  function show(it) {
    if (hush || !on()) return;
    const el = capEl();
    if (!el) return;
    showing = it;
    it.at = now_();
    el.innerHTML = it.html;
    el.classList.add("on");
    it.timer = setTimeout(() => {
      if (showing !== it) return;
      showing = null;
      hideCap();
      // the next one after the fade, not on top of it
      setTimeout(next, 250);
    }, it.len);
  }

  function next() {
    const it = queued;
    queued = null;
    if (it && !showing && now_() - it.born < it.ttl) show(it);
  }

  /** Take the call off the screen. */
  function clear() {
    if (showing) clearTimeout(showing.timer);
    showing = null;
    hideCap();
  }
  function stop() { queued = null; pendingRival = null; clear(); }

  // ---------------------------------------------------------------- the race
  let R = null, pendingRival = null;
  function raceStart(G) {
    stop();
    R = { off: false, early: false, mid: false, corner: false, straight: false, close: false,
          won: false, last200: false, leaders: [], cornerRank: null, lead: null, changeAt: -9,
          charged: new Set(), charges: 0, faded: false, straightRank: new Map(), lastCallT: -9 };
  }

  function rivalry(a, b) { pendingRival = { a, b }; }

  const Z = () => root.Uniques;

  function tick(G, hold, rate) {
    if (!G || !R) return;
    rate = rate || 1;
    const coach = document.querySelector("#coach.on");
    const quiet = hold || !!coach;
    if (quiet !== hush) {
      hush = quiet;
      if (quiet) { queued = null; clear(); }
    }
    if (G.atGate || G.done) return;
    const S = G.S, d = G.course.distance;
    if (!S || !S.racers || !S.racers.length) return;
    const order = S.racers.slice().sort((x, y) =>
      (y.finished - x.finished) || (x.finished ? x.finishT - y.finishT : y.pos - x.pos));
    const lead = order[0], second = order[1];
    const say = (key, a, b) => { if (!quiet) { call(key, a, b, rate); R.lastCallT = S.t; } };

    // the moments are marked whether or not anyone sees them, so a pause does not save
    // them up and pour them out on resume
    if (!R.off && S.t > 0) { R.off = true; say("off"); }

    if (pendingRival && !quiet) { const p = pendingRival; pendingRival = null; say("rival", p.a, p.b); }

    // the winner: the first one home
    const first = S.racers.find(r => r.rank === 1);
    if (first && !R.won) {
      R.won = true;
      // how she won: by how far, from where
      const by = second && !second.finished && second.v > 0 ? (first.pos - second.pos) / Math.max(1, second.v) : 1;
      const wire = R.leaders.length >= 3 && R.leaders.every(n => n === first);
      const late = R.cornerRank != null && R.cornerRank.get(first) >= 4;
      const key = by > 0.9 ? "winFar" : by < 0.12 ? "winNarrow" : wire ? "winWire" : late ? "winLate" : "win";
      queued = null;
      if (!quiet) { clear(); call(key, first, null, rate); }
      return;
    }
    if (lead.finished) return;

    const lf = lead.pos / d;
    const zone = Z() ? Z().zoneOf(G.course, lead.pos) : { lastStraight: lf > 0.85, finalCorner: lf > 0.7 && lf <= 0.85, remain: d - lead.pos };

    if (!R.early && lf >= 0.07) {
      R.early = true; R.leaders.push(lead);
      say("early", lead, second);
    }
    if (!R.mid && lf >= 0.45 && !zone.finalCorner && !zone.lastStraight) {
      R.mid = true;
      say(R.leaders.length && R.leaders[R.leaders.length - 1] !== lead ? "midNew" : "mid", lead, second);
      R.leaders.push(lead);
    }
    if (!R.corner && zone.finalCorner) {
      R.corner = true; R.leaders.push(lead);
      R.cornerRank = new Map(order.map((r, i) => [r, i + 1]));
      say("corner", lead, second);
    }
    if (!R.straight && zone.lastStraight) {
      R.straight = true; R.leaders.push(lead); R.lead = lead; R.changeAt = S.t;
      if (!R.cornerRank) R.cornerRank = new Map(order.map((r, i) => [r, i + 1]));
      R.straightRank = new Map(order.map((r, i) => [r, i + 1]));
      say("straight", lead);
      return;
    }
    if (!R.straight) return;

    // the straight: the run to the line
    const gap = second ? lead.pos - second.pos : 99;
    if (!R.close && zone.remain < 110 && gap < 1.6 && second && !second.finished) {
      R.close = true; say("close", lead, second); return;
    }
    if (R.lead !== lead && S.t - R.changeAt > 1.6) {
      R.lead = lead; R.changeAt = S.t;
      say("change", lead); return;
    }
    if (!R.faded && lead.exhausted && zone.remain > 120) { R.faded = true; say("fading", lead); return; }
    // someone flying from behind: well up on where she entered the straight, and quicker than the leader
    if (R.charges < 2 && S.t - R.lastCallT > 1.8) {
      for (let i = 1; i < Math.min(5, order.length); i++) {
        const r = order[i];
        if (R.charged.has(r) || r.v < lead.v + 0.7) continue;
        const was = R.straightRank.get(r) || i + 1;
        if (was - (i + 1) < 2) continue;
        R.charged.add(r); R.charges++;
        const lanes = S.laneCount || 8;
        say(r.lane >= lanes * 0.55 ? "outside" : r.lane <= 1 ? "inside" : "charge", r);
        return;
      }
    }
    if (!R.last200 && zone.remain <= 200 && S.t - R.lastCallT > 1.5) { R.last200 = true; say("last200"); }
  }

  const api = { raceStart, tick, rivalry, stop, LINES,
                state: () => ({ showing: showing && showing.text, queued: queued && queued.text, hush }) };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Caller = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
