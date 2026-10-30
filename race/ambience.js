/*
 * The race's own sound, under the music: the field running, the crowd, and the caller.
 *
 *   The field. Every footfall is its own hoof strike, synthesised here (a thump, the
 *   impact, then grass brushing or grit spraying) and timed to her stride as voxel.js
 *   draws it -- a foot comes down as her body dips -- so the beat you hear is the legs you
 *   see. Each strike is placed where she is: louder the nearer she is to the camera,
 *   panned to her side of the frame, harder at a gallop than a canter. Whoever is too far
 *   off to pick out joins a low rumble instead, so an aerial shot still sounds like
 *   eleven of them running.
 *
 *   The crowd. A bed of cheering (a CC0 recording, audio/sfx/) runs the whole race,
 *   filtered down to a murmur in the opening and opening up as the race gets to its
 *   business: the final corner, then the straight, louder the nearer the leader is to
 *   the line. Over it, surges from a second CC0 recording of a stadium reacting: as the
 *   gates open, building through the final corner to break as they straighten, at a
 *   signature, at a rivalry's clash (after the stands go quiet for the stare-down, with
 *   the music), and the roar for the winner.
 *
 *   The caller (caller.js) calls the race in captions; this drives it, and holds it in a
 *   cutscene. Nobody speaks: a synthesised voice for the racers and browser speech for
 *   the caller were both tried and cut.
 *
 * Volume follows Settings' sfxVolume. All of it pauses with the race (the audio clock is
 * suspended, so a surge picks up where it was), and goes quiet when the race screen is
 * left.
 *
 *   Ambience.raceStart(G)                        a new race
 *   Ambience.tick(G, rate)                       every frame, from index.html's loop
 *   Ambience.signature(r, mine, unique, heroMs)  her signature cutscene has started
 *   Ambience.rival(a, b, clashMs, mine)          a rivalry; the clash lands `clashMs` from now
 *   Ambience.cutEnd()                            a cutscene is over (or skipped)
 *   Ambience.state()                             what is sounding, and how loud, for checking
 *
 * Exposes Ambience.
 */
(function (root) {
  "use strict";

  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  const pref = (id, dflt) => {
    const S = root.Settings;
    if (!S) return dflt;
    const v = S.get(id);
    return v === undefined ? dflt : v;
  };
  const sfxVol = () => clamp(pref("sfxVolume", 0.7), 0, 1);
  const dB = x => Math.pow(10, x / 20);
  const now = () => (root.performance ? performance.now() : Date.now());

  /* Both from Freesound, CC0 (public domain). See README, "Race ambience". */
  const FILES = {
    crowd: "../audio/sfx/crowd - Crowd Cheer (freesound 397434).mp3",
    surge: "../audio/sfx/crowd_surge - Millerntor Stadium Crowd Reaction (freesound 829453).mp3",
  };
  /* The surge recording is six takes of one stadium reacting, with silence between them:
     [start, end] seconds into the file, and when each one peaks. */
  const TAKES = {
    pop:   [0.2, 6.0, 1.0],     // quick up, quick down: the gates open
    lift:  [6.9, 13.1, 0.9],
    swell: [14.0, 20.7, 1.6],   // slower to rise: a signature
    burst: [21.9, 31.6, 0.8],   // up at once and long: a rivalry's clash
    roar:  [33.3, 45.3, 1.8],   // the biggest, held: the winner
    build: [46.2, 63.0, 6.8],   // six seconds of rising before it breaks: into the straight
  };

  function rng(seed) {
    let a = seed | 0;
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------------------------------------------------------------- the hoof strike
  /**
   * One footfall, as samples: the thump of her weight landing, the impact itself, a
   * second, smaller knock as the shoe settles, then what it throws up -- grass brushing
   * on turf, grit spraying on dirt. Six of each are made per race surface, so a field of
   * them never repeats one sound.
   */
  function strike(sr, dirt, seed) {
    const R = rng(seed), N = Math.floor(sr * 0.2), out = new Float32Array(N);
    const f0 = (dirt ? 118 : 96) * (0.85 + R() * 0.3);
    const tTh = 0.03 + R() * 0.02, tCl = dirt ? 0.016 : 0.009, knock = 0.011 + R() * 0.008;
    const kLo = 1 - Math.exp(-2 * Math.PI * (dirt ? 2400 : 1300) / sr);
    const kHi = 1 - Math.exp(-2 * Math.PI * 4500 / sr);
    let ph = 0, lo = 0, hiLp = 0;
    for (let i = 0; i < N; i++) {
      const t = i / sr, att = Math.min(1, t / 0.0012);
      ph += 2 * Math.PI * f0 * (0.6 + 0.4 * Math.exp(-t / 0.016)) / sr;
      const n = R() * 2 - 1;
      lo += (n - lo) * kLo;
      hiLp += (n - hiLp) * kHi;
      const hi = n - hiLp;
      const thump = Math.sin(ph) * Math.exp(-t / tTh) * att;
      const hit = lo * (Math.exp(-t / tCl) + (t > knock ? 0.35 * Math.exp(-(t - knock) / tCl) : 0)) * att * (dirt ? 1.5 : 1.1);
      const tail = dirt ? hi * 0.2 * Math.min(1, t / 0.008) * Math.exp(-Math.max(0, t - 0.008) / 0.06)
                        : hi * 0.07 * Math.exp(-t / 0.03);
      out[i] = thump * 0.85 + hit + tail;
    }
    let p = 0;
    for (let i = 0; i < N; i++) p = Math.max(p, Math.abs(out[i]));
    const g = 0.8 / (p || 1), F = Math.floor(sr * 0.012);
    for (let i = 0; i < N; i++) out[i] *= g * (i > N - F ? (N - i) / F : 1);
    return out;
  }

  /** Brown noise that loops without a seam: the distant field's rumble, before its filter. */
  function rumbleNoise(sr, secs) {
    const R = rng(7), N = Math.floor(sr * secs), X = Math.floor(sr * 0.3), raw = new Float32Array(N + X);
    let b = 0, p = 0;
    for (let i = 0; i < raw.length; i++) { b = b * 0.997 + (R() * 2 - 1) * 0.06; raw[i] = b; p = Math.max(p, Math.abs(b)); }
    const out = new Float32Array(N);
    for (let i = 0; i < N; i++) out[i] = raw[i] / p;
    // the head is faded in over what follows the end, so the end runs into the beginning
    for (let i = 0; i < X; i++) {
      const k = i / X;
      out[i] = (raw[i] * Math.sin(k * Math.PI / 2) + raw[N + i] * Math.cos(k * Math.PI / 2)) / p;
    }
    return out;
  }

  // ---------------------------------------------------------------- the graph
  let ctx = null, master = null, sfxBus = null, hoofBus = null, crowdBus = null;
  let bedF = null, bedG = null, rumbleF = null, rumbleG = null, rumbleSrc = null;
  let bed = [], bufs = {}, loading = null, strikes = { turf: [], dirt: [] }, meters = {};
  let active = false, paused = false, sleepT = 0;

  function ensure() {
    if (ctx) return ctx;
    const AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.connect(master);
    /* Against the music: a pack thundering past the camera peaks around the race theme's
       level, and the field on average sits a few dB under it. Pulled down to 0.36 once,
       it was lost under the music altogether. */
    hoofBus = ctx.createGain(); hoofBus.gain.value = 0.72; hoofBus.connect(sfxBus);
    crowdBus = ctx.createGain(); crowdBus.connect(sfxBus);
    bedF = ctx.createBiquadFilter(); bedF.type = "lowpass"; bedF.frequency.value = 600; bedF.Q.value = 0.5;
    bedG = ctx.createGain(); bedG.gain.value = 0;
    bedF.connect(bedG); bedG.connect(crowdBus);
    rumbleF = ctx.createBiquadFilter(); rumbleF.type = "lowpass"; rumbleF.frequency.value = 170;
    rumbleG = ctx.createGain(); rumbleG.gain.value = 0;
    rumbleF.connect(rumbleG); rumbleG.connect(hoofBus);
    for (const [k, node] of [["master", master], ["hooves", hoofBus], ["crowd", crowdBus]]) {
      const a = ctx.createAnalyser(); a.fftSize = 2048; node.connect(a); meters[k] = a;
    }
    volumes();
    const sr = ctx.sampleRate;
    for (let i = 0; i < 6; i++) {
      for (const dirt of [false, true]) {
        const s = strike(sr, dirt, 101 + i * 17 + (dirt ? 5 : 0)), b = ctx.createBuffer(1, s.length, sr);
        b.getChannelData(0).set(s);
        strikes[dirt ? "dirt" : "turf"].push(b);
      }
    }
    const rn = rumbleNoise(sr, 4), rb = ctx.createBuffer(1, rn.length, sr);
    rb.getChannelData(0).set(rn);
    bufs.rumble = rb;
    return ctx;
  }

  /* An AudioContext made before the player has touched the page starts suspended. */
  if (typeof document !== "undefined") {
    const wakeCtx = () => { if (ctx && ctx.state === "suspended" && !paused) ctx.resume().catch(() => {}); };
    for (const ev of ["pointerdown", "keydown", "touchstart"]) document.addEventListener(ev, wakeCtx, true);
  }

  function volumes() {
    if (!ctx) return;
    sfxBus.gain.setTargetAtTime(sfxVol(), ctx.currentTime, 0.05);
  }
  if (root.Settings && root.Settings.onChange)
    root.Settings.onChange(id => { if (!id || /volume/i.test(id)) volumes(); });

  function decode(ab) {
    return new Promise((res, rej) => {
      const p = ctx.decodeAudioData(ab, res, rej);
      if (p && p.then) p.then(res, rej);
    });
  }
  /* The decoder can leave a few milliseconds of silence at either end of an MP3 (encoder
     padding); a loop has to start and end on the sound itself or it clicks every lap. */
  function bounds(buf) {
    const d = buf.getChannelData(0), th = 1e-3;
    let a = 0, b = d.length - 1;
    while (a < b && Math.abs(d[a]) < th) a++;
    while (b > a && Math.abs(d[b]) < th) b--;
    return [a / buf.sampleRate, (b + 1) / buf.sampleRate];
  }
  function load() {
    if (loading || !ctx || typeof fetch === "undefined") return loading;
    const one = (k, u) => fetch(encodeURI(u).replace(/\(/g, "%28").replace(/\)/g, "%29"))
      .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(decode).then(b => { bufs[k] = b; if (k === "crowd") bufs.crowdAt = bounds(b); })
      .catch(() => { /* no file: that layer stays silent, the rest still plays */ });
    loading = Promise.all(Object.entries(FILES).map(([k, u]) => one(k, u))).then(() => { if (active) startBeds(); });
    return loading;
  }

  function startBeds() {
    if (!ctx) return;
    if (!rumbleSrc && bufs.rumble) {
      rumbleSrc = ctx.createBufferSource(); rumbleSrc.buffer = bufs.rumble; rumbleSrc.loop = true;
      rumbleSrc.connect(rumbleF); rumbleSrc.start();
    }
    if (bed.length || !bufs.crowd) return;
    /* Two of the same bed, half a lap apart and either side of centre: twice the crowd,
       and a repeat in one is covered by the other. */
    const [a, b] = bufs.crowdAt || [0, bufs.crowd.duration];
    for (const [off, pan, rate] of [[0, -0.35, 1], [0.5, 0.35, 0.985]]) {
      const s = ctx.createBufferSource();
      s.buffer = bufs.crowd; s.loop = true; s.loopStart = a; s.loopEnd = b; s.playbackRate.value = rate;
      const g = ctx.createGain(); g.gain.value = dB(-3);
      let out = g;
      if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); out = p; }
      s.connect(g); out.connect(bedF);
      s.start(ctx.currentTime + 0.02, a + (b - a) * off);
      bed.push(s);
    }
  }
  function stopBeds() {
    for (const s of bed) { try { s.stop(); } catch (e) {} }
    bed = [];
    if (rumbleSrc) { try { rumbleSrc.stop(); } catch (e) {} rumbleSrc = null; }
  }

  // ---------------------------------------------------------------- one-shots
  const live = new Set();          // surges sounding, so leaving can end them
  function track(src, g) {
    const o = { src, g };
    live.add(o);
    src.onended = () => { live.delete(o); try { g.disconnect(); } catch (e) {} };
    return o;
  }
  function panned(gain, pan, dest) {
    const g = ctx.createGain(); g.gain.value = gain;
    if (pan && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1);
      g.connect(p); p.connect(dest);
    } else g.connect(dest);
    return g;
  }

  /** One of the stadium's takes, `gain` loud. */
  function surge(name, gain, delay) {
    if (!ctx || !bufs.surge || !active) return;
    const [a, b] = TAKES[name], s = ctx.createBufferSource();
    s.buffer = bufs.surge;
    const g = panned(gain, 0, crowdBus);
    s.connect(g);
    s.start(ctx.currentTime + (delay || 0), a, b - a);
    track(s, g);
  }

  let hits = 0;
  function hit(o, dirt, delay) {
    const run = clamp((o.v - 2) / 15, 0, 1);
    if (run <= 0) return;
    const near = 1 / (1 + (o.dist / 7) * (o.dist / 7));
    const g = Math.pow(run, 1.3) * near * 0.9;
    if (g < 0.012 || hits > 48) return;              // too far to pick out: she is in the rumble
    const set = strikes[dirt ? "dirt" : "turf"], s = ctx.createBufferSource();
    s.buffer = set[(Math.random() * set.length) | 0];
    s.playbackRate.value = 0.92 + Math.random() * 0.16;
    const out = panned(g * (0.85 + Math.random() * 0.3), o.pan * 0.85, hoofBus);
    s.connect(out);
    hits++;
    s.onended = () => { hits--; try { out.disconnect(); } catch (e) {} };
    s.start(ctx.currentTime + 0.004 + (delay || 0) + Math.random() * 0.006);
  }

  /* What a cutscene still has to come (a surge on its beat), dropped if it is skipped. */
  const timers = new Set();
  function later(fn, ms) {
    const h = setTimeout(() => { timers.delete(h); fn(); }, ms);
    timers.add(h);
  }

  // ---------------------------------------------------------------- the race
  let R = null;
  const feet = new Map();
  const crowd = { e: 0, hush: false, clash: 0, applause: 0 };

  function raceStart(G) {
    // the captions need no sound, so they start whatever the audio can do
    if (root.Caller) root.Caller.raceStart(G);
    if (!ensure()) { R = { G, captionsOnly: true }; return; }
    load();
    for (const h of timers) clearTimeout(h);
    timers.clear();
    feet.clear();
    R = { G, off: false, build: false, won: false, lastT: now(), simT: 0 };
    crowd.e = 0.06; crowd.hush = false; crowd.applause = 0;
    if (crowdBus) crowdBus.gain.setTargetAtTime(1, ctx.currentTime, 0.05);
    wake();
  }

  function wake() {
    if (!ctx) return;
    clearTimeout(sleepT);
    active = true;
    if (ctx.state === "suspended" && !paused) ctx.resume().catch(() => {});
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(1, ctx.currentTime, 0.08);
    startBeds();
  }
  /** Off the race screen: everything out, quickly, and the loops stopped. */
  function sleep() {
    if (!active) return;
    active = false;
    if (root.Caller) root.Caller.stop();
    for (const h of timers) clearTimeout(h);
    timers.clear();
    if (!ctx) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
    clearTimeout(sleepT);
    sleepT = setTimeout(() => {
      if (active) return;
      stopBeds();
      for (const o of live) { try { o.src.stop(); } catch (e) {} }
      live.clear();
    }, 900);
  }

  /* Paused: the whole audio clock stops, so whatever was sounding resumes mid-breath. */
  function hold(on) {
    if (on === paused || !ctx) return;
    paused = on;
    if (on) {
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
      setTimeout(() => { if (paused) ctx.suspend().catch(() => {}); }, 90);
    } else {
      ctx.resume().catch(() => {});
      master.gain.setTargetAtTime(1, ctx.currentTime, 0.06);
    }
  }

  const screenOn = () => {
    const el = typeof document !== "undefined" && document.getElementById("scr-game");
    return !!el && el.classList.contains("on");
  };

  /* How worked up the stands are, 0..1, from where the leader is. */
  function excitement(G) {
    if (G.atGate) return 0.1;
    const S = G.S, d = G.course.distance;
    let lead = S.racers[0], second = null;
    for (const r of S.racers) if (r.pos > lead.pos) lead = r;
    for (const r of S.racers) if (r !== lead && (!second || r.pos > second.pos)) second = r;
    const U = root.Uniques, z = U ? U.zoneOf(G.course, lead.pos) : null, lf = lead.pos / d;
    let t = lf < 1 / 6 ? 0.26 : 0.2 + 0.08 * clamp((lf - 1 / 6) * 2, 0, 1);
    if (z && U.TRACK) {
      const bend = Math.PI * (U.TRACK.R[G.course.surface] || U.TRACK.R.turf), into = U.TRACK.finishInto;
      if (z.finalCorner) t = 0.34 + 0.2 * clamp(1 - (z.remain - into) / bend, 0, 1);
      if (z.lastStraight) t = 0.58 + 0.34 * clamp(1 - z.remain / into, 0, 1);
      if (z.lastStraight && second && lead.pos - second.pos < 2) t += 0.06;
    } else if (lf > 0.75) t = 0.5 + (lf - 0.75) * 1.6;
    return clamp(t, 0, 0.96);
  }
  /* What the bed sounds like at a given excitement: how loud (dB), and how open (Hz). */
  /* Measured against the race music (about -24 dBFS at the default volume): a murmur
     12 dB under it in the opening, a few dB under it down the straight, level with it
     only for the roar at the line. */
  const BED = [[0, -24], [0.25, -16], [0.5, -12.5], [0.9, -9], [1, -6]];
  function bedDb(e) {
    for (let i = 1; i < BED.length; i++) if (e <= BED[i][0]) {
      const [e0, d0] = BED[i - 1], [e1, d1] = BED[i];
      return d0 + (d1 - d0) * (e - e0) / (e1 - e0);
    }
    return BED[BED.length - 1][1];
  }

  function tick(G, rate) {
    rate = rate || 1;
    if (!G || !screenOn()) { sleep(); return; }
    if (!R || R.G !== G) { if (G.done) return; raceStart(G); }
    const cutting = !!(G.cutHold || (root.Voxel && Voxel.inCut && Voxel.inCut()));
    if (root.Caller) root.Caller.tick(G, !!G.paused || cutting, rate);
    if (!ctx) return;                                       // no Web Audio: captions only
    if (!active && !G.done) wake();
    hold(!!G.paused);
    const t = now(), wdt = clamp((t - R.lastT) / 1000, 0, 0.25);
    R.lastT = t;
    if (G.paused || !active) return;

    const S = G.S;
    // ---- events
    if (!R.off && S.t > 0 && !G.atGate) { R.off = true; surge("pop", 0.16); }
    let lead = S.racers[0];
    for (const r of S.racers) if (r.pos > lead.pos) lead = r;
    const U = root.Uniques;
    if (U && U.TRACK && !R.build && !lead.finished) {
      // start the build so that it breaks as they turn in: six seconds out, at this speed
      const into = U.TRACK.finishInto, ahead = TAKES.build[2] * Math.max(12, lead.v) * rate;
      const toStraight = (G.course.distance - lead.pos) - into;
      if (toStraight > 0 && toStraight <= ahead && U.zoneOf(G.course, lead.pos).finalOn) { R.build = true; surge("build", 0.34); }
    }
    const first = S.racers.find(r => r.rank === 1);
    if (first && !R.won) {
      R.won = true; surge("roar", 0.42); crowd.e = Math.max(crowd.e, 0.9); crowd.applause = t;
    }

    // ---- the crowd
    let want = excitement(G);
    if (R.won) want = (t - crowd.applause) < 5000 ? 1 : 0.55;
    if (G.done) want = 0;                                   // the results are up
    const k = 1 - Math.exp(-wdt * (want > crowd.e ? 1.6 : 0.5));
    crowd.e += (want - crowd.e) * k;
    const e = crowd.e;
    bedG.gain.setTargetAtTime(G.done && e < 0.05 ? 0 : dB(bedDb(e)), ctx.currentTime, 0.12);
    bedF.frequency.setTargetAtTime(450 * Math.pow(2, 4.6 * e), ctx.currentTime, 0.15);

    // ---- the field
    const E = root.Voxel && Voxel.ok && Voxel.ears ? Voxel.ears() : null;
    let far = 0;
    if (E) {
      for (const o of E.racers) {
        const f = feet.get(o.r), n = Math.floor(o.phase / Math.PI);
        if (f == null) { feet.set(o.r, n); continue; }
        if (n > f) {
          // a foot down each time her body dips; at 4x two can land in one frame
          for (let i = 0; i < Math.min(2, n - f); i++) hit(o, E.dirt, i * 0.035);
          feet.set(o.r, n);
        }
        const run = clamp((o.v - 2) / 15, 0, 1), near = 1 / (1 + (o.dist / 7) * (o.dist / 7));
        far += run * (1 - near) / (1 + o.dist / 70);
      }
    } else if (!cutting && !G.atGate) {
      // the flat view: no camera to place them by, so all of them a little way off
      const simDt = Math.max(0, S.t - R.simT);
      for (const r of S.racers) {
        const v = r.finished ? 0 : r.v, ph = (feet.get(r) || 0) + Math.min(simDt * (1.6 + v * 0.19), wdt * 6.5) * Math.PI * 2;
        const f = Math.floor((feet.get(r) || 0) / Math.PI);
        feet.set(r, ph);
        if (Math.floor(ph / Math.PI) > f) hit({ v, dist: 14, pan: ((r.lane || 0) / Math.max(1, S.laneCount - 1) - 0.5) * 0.6 }, G.course.surface === "dirt", 0);
        far += clamp((v - 2) / 15, 0, 1) * 0.4;
      }
    }
    R.simT = S.t;
    rumbleG.gain.setTargetAtTime(cutting ? 0 : clamp(far / 5, 0, 1) * 0.16, ctx.currentTime, 0.1);
  }

  /** Her signature cutscene: the stands rise with the skill's name on screen. */
  function signature(r, mine, unique, heroMs) {
    if (!ctx || !active) return;
    later(() => surge("swell", mine ? 0.28 : 0.14), heroMs || 0);
  }

  /** A rivalry: the stands go quiet with the music while they stare each other down, and
      come back as one at the clash. The caller has it once play resumes. With no cutscene,
      `clashMs` is 0 and it all happens now. */
  function rival(a, b, clashMs, mine) {
    if (root.Caller) root.Caller.rivalry(a, b);
    if (!ctx || !active) return;
    const clash = () => {
      crowd.hush = false;
      crowdBus.gain.setTargetAtTime(1, ctx.currentTime, 0.08);
      surge("burst", mine ? 0.32 : 0.18);
      crowd.e = Math.min(1, crowd.e + 0.12);
    };
    if (!clashMs) return clash();
    crowd.hush = true;
    crowdBus.gain.setTargetAtTime(0.22, ctx.currentTime, 0.08);
    later(clash, clashMs);
  }

  /** A cutscene is over or was clicked away: anything it had still to come is dropped. */
  function cutEnd() {
    for (const h of timers) clearTimeout(h);
    timers.clear();
    if (ctx && crowd.hush) { crowd.hush = false; crowdBus.gain.setTargetAtTime(1, ctx.currentTime, 0.1); }
  }

  /* How loud each bus is right now (RMS dBFS), for checking the mix. */
  function level(a) {
    const d = new Float32Array(a.fftSize);
    a.getFloatTimeDomainData(d);
    let s = 0;
    for (let i = 0; i < d.length; i++) s += d[i] * d[i];
    return +(10 * Math.log10(s / d.length + 1e-12)).toFixed(1);
  }
  function state() {
    const lv = {};
    if (ctx) for (const k in meters) lv[k] = level(meters[k]);
    return { ctx: ctx && ctx.state, active, paused, excitement: +crowd.e.toFixed(2), hush: crowd.hush,
             loaded: Object.keys(bufs).filter(k => bufs[k] && k !== "crowdAt"), beds: bed.length,
             strikesSounding: hits, oneShots: live.size, levels: lv,
             caller: root.Caller && root.Caller.state ? root.Caller.state() : null };
  }

  const api = { raceStart, tick, signature, rival, cutEnd, state, strike, rumbleNoise, FILES, TAKES };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Ambience = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
