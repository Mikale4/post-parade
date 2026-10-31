/*
 * Music and sound.
 *
 * Deliberately NOT called `Audio` -- that is the browser's own constructor, and shadowing
 * it would break every `new Audio()` in this file.
 *
 * Two ideas carry the whole module:
 *
 *   Roles, not filenames. Screens ask for "menu" or "race_final"; audiodata.js decides
 *   what that is, and falls back to a related role when a track is missing. A screen
 *   never knows how many files are in the folder.
 *
 *   The race is a CUE LIST, not a track. Modelled on how the real game does it: the
 *   paddock plays before the gate, then the music changes with the race phase, and the
 *   finish gets its own sting. `raceTick` is fed the phase and swaps when it changes.
 *
 * Browsers refuse to play audio before the user has interacted with the page, so the
 * first request is remembered and started on the first real gesture instead of being
 * lost.
 *
 * Exposes Sound.
 */
(function (root) {
  "use strict";

  const Data = typeof require !== "undefined" ? require("./audiodata.js") : root.AudioData;

  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  const pref = (id, dflt) => {
    const S = root.Settings;
    if (!S) return dflt;
    const v = S.get(id);
    return v === undefined ? dflt : v;
  };

  const musicVol = () => clamp(pref("musicVolume", 0.55), 0, 1);
  const sfxVol   = () => clamp(pref("sfxVolume", 0.7), 0, 1);

  // ---------------------------------------------------------------- resolution
  /* Which track each POOL is currently on. Keyed by the role that actually owns the
     files, not by the role that asked -- menu, quests, scout and stable all fall back to
     `ambient`, so they must land on the SAME track or the music changes every time you
     move between two screens. Picking at random per call did exactly that. */
  const poolPick = Object.create(null);

  /**
   * Resolve a role to { track, source, list }, following fallbacks.
   * `source` is the role that supplied the files, which is what the pool position is
   * keyed on. Null when nothing covers the role.
   */
  function resolve(role, seen) {
    if (!Data || !role) return null;
    // the track picked at the lobby's jukebox: one file, played on repeat
    if (role === "jukebox") {
      const t = picked();
      return t ? { track: { file: t.file, loop: true }, source: role, list: [t] } : null;
    }
    seen = seen || {};
    if (seen[role]) return null;
    seen[role] = 1;
    const list = Data.TRACKS[role];
    if (list && list.length) {
      if (poolPick[role] == null) poolPick[role] = Math.floor(Math.random() * list.length);
      return { track: list[poolPick[role] % list.length], source: role, list };
    }
    for (const alt of (Data.FALLBACK[role] || [])) {
      const r = resolve(alt, seen);
      if (r) return r;
    }
    return null;
  }

  // ---------------------------------------------------------------- the jukebox
  /* As in the real game, the jukebox in the lobby plays any music you have already heard
     somewhere in the game: every track that loops (no fanfares, no stings), each once,
     with its title from its filename and where it is heard from its role. Heard tracks
     are remembered on this machine; the pick is a setting ("jukebox", settings.js). */
  const HEARD_KEY = "postparade.heard";
  let heardSet = null;
  function heardFiles() {
    if (heardSet) return heardSet;
    try { heardSet = new Set(JSON.parse(localStorage.getItem(HEARD_KEY)) || []); } catch (e) { heardSet = new Set(); }
    return heardSet;
  }
  function hear(file) {
    const s = heardFiles();
    if (s.has(file)) return;
    s.add(file);
    try { localStorage.setItem(HEARD_KEY, JSON.stringify([...s])); } catch (e) {}
  }
  const WHERE = [
    [/^home/, "Home screen"], [/^(title|prologue|intro|tutorial)/, "Title and story"], [/^scout/, "Scouting"],
    [/^(career|training|setback|legacy|finale|ending|idea|friends)/, "Career"],
    [/^(race|paddock|rival)/, "Races"], [/^result/, "Race results"], [/./, "Around the academy"],
  ];
  /* "home_day - Home Screen Day (dm011).mp3" -> "Home Screen Day": the role before the
     dash and the cue number in brackets go; a bracket that is part of the name stays. */
  const titleOf = file => decodeURI(file).split("/").pop().replace(/\.mp3$/i, "").replace(/^[^-]*-\s*/, "")
    .replace(/\s*\((?:[a-z]{2})?\d+[a-z]?(?:-\d+)?\)$/i, "");
  let library = null;
  /** Every track the jukebox could ever play: the home screen's first, then by where it is heard, then by title. */
  function jukeboxTracks() {
    if (library) return library;
    library = [];
    if (!Data) return library;
    const seenFile = new Set(), at = role => WHERE.findIndex(([re]) => re.test(role));
    for (const role of Object.keys(Data.TRACKS)) for (const t of Data.TRACKS[role]) {
      if (t.loop === false || seenFile.has(t.file)) continue;
      seenFile.add(t.file);
      library.push({ file: t.file, title: titleOf(t.file), where: WHERE[at(role)][1], order: at(role) });
    }
    library.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
    return library;
  }
  /** The jukebox: every track it knows, which of them have been heard, and which is picked. */
  function jukebox() {
    const heard = heardFiles(), cur = picked();
    return { tracks: jukeboxTracks().map(t => ({ ...t, heard: heard.has(t.file) })), picked: cur ? cur.file : "" };
  }
  /** The picked track, if there is one and it is still in the folder. */
  function picked() {
    const f = pref("jukebox", "");
    return f ? jukeboxTracks().find(t => t.file === f) || null : null;
  }

  /** The file for a role, following fallbacks. Null when nothing covers it. */
  function trackFor(role) { const r = resolve(role); return r ? r.track : null; }
  const has = role => !!trackFor(role);
  const url = p => encodeURI(p).replace(/'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29");

  // ---------------------------------------------------------------- the deck
  /* Two elements so one can fade out while the other fades in. Anything else clicks. */
  let deck = null, cur = null, curRole = null, pending = null, unlocked = false;
  /* `seq` invalidates anything scheduled before the latest play/stop. Without it the
     post-race sequence (a sting, then result music 2.6s later) fires over whatever
     screen the player has since moved to. */
  let seq = 0;
  /* Where each role had got to, so returning to a screen picks its music back up
     rather than restarting the same track from the top every time. */
  const resumeAt = Object.create(null);
  const live = new Set();      // one-shots currently sounding
  let lastScreen = null;

  function build() {
    if (deck) return deck;
    const mk = () => {
      const a = new window.Audio();
      a.preload = "auto";
      a.volume = 0;
      return a;
    };
    deck = [mk(), mk()];
    cur = 0;
    return deck;
  }

  /* Retiring an element has to detach its `ended` handler as well as stop it. A playlist
     element keeps that handler, and a retired track finishing would otherwise start the
     next one on top of whatever has since taken over -- which is exactly what bleeding
     sounds like. */
  function retire(el) {
    if (!el) return;
    el.onended = null;
    try { el.pause(); } catch (e) {}
    el.src = "";
  }

  /* Fades are done by hand rather than with the Web Audio API: these are long streamed
     files and the element pipeline handles that better than decoding them whole. */
  const fades = new Map();
  function fadeTo(el, target, ms, done) {
    if (fades.has(el)) { clearInterval(fades.get(el)); fades.delete(el); }
    if (!ms) { el.volume = clamp(target, 0, 1); if (done) done(); return; }
    const from = el.volume, step = 40, ticks = Math.max(1, Math.round(ms / step));
    let i = 0;
    const h = setInterval(() => {
      i++;
      el.volume = clamp(from + (target - from) * (i / ticks), 0, 1);
      if (i >= ticks) {
        clearInterval(h); fades.delete(el);
        if (done) done();
      }
    }, step);
    fades.set(el, h);
  }

  /**
   * Play the track for `role`, crossfading from whatever is playing.
   * Asking for the role that is already playing does nothing, so a screen can call this
   * on every rebuild without restarting the music.
   */
  function play(role, opts) {
    opts = opts || {};
    if (!Data) return false;
    if (role === curRole && !opts.restart) return true;

    const res = resolve(role);
    if (!res) { if (opts.stopIfMissing) stop(); return false; }
    const track = res.track;

    if (!unlocked) { pending = { role, opts }; return false; }

    /* Two roles sharing a pool resolve to the same file. Restarting it would make the
       music jump every time the player crosses between those screens, so adopt the new
       role and let the track keep running. */
    const wantSrc = url(track.file);
    if (!opts.restart && deck) {
      const playing = deck[cur];
      if (playing && !playing.paused && playing.src === new URL(wantSrc, location.href).href) {
        curRole = role;
        return true;
      }
    }

    seq++;                                   // anything scheduled before now is stale
    build();
    const from = deck[cur], to = deck[1 - cur];
    /* Short enough that two busy tracks never sit on top of each other long enough to
       sound muddy, long enough not to click. */
    const fade = opts.fade == null ? 420 : opts.fade;

    /* Positions are keyed by FILE, not role: a role can resolve to different files, and
       seeking a new track to an old track's position is just wrong. */
    if (from && from.src && !from.paused) resumeAt[from.src] = from.currentTime;

    to.src = wantSrc;
    /* A pool with more than one track is a playlist: play through and step to the next
       when it ends, so variety comes from time passing rather than from navigating. */
    const multi = res.list.length > 1;
    to.loop = multi ? false : (track.loop !== false && opts.loop !== false);
    const mySeq = seq;
    to.onended = multi ? () => {
      // only the element that is still live, on the run that started it, may advance
      if (seq !== mySeq || deck[cur] !== to) return;
      poolPick[res.source] = (poolPick[res.source] + 1) % res.list.length;
      play(role, { fade: 600, restart: true });
    } : (opts.onEnd ? () => {
      // a single track that does not loop -- a fanfare -- tells its caller it is done
      if (seq === mySeq && deck[cur] === to) opts.onEnd();
    } : null);
    const at = resumeAt[to.src];
    if (at && !opts.restart) {
      /* Only safe once metadata is in; setting currentTime too early is ignored. */
      const seek = () => { try { if (at < to.duration - 1) to.currentTime = at; } catch (e) {} };
      if (to.readyState >= 1) seek(); else to.addEventListener("loadedmetadata", seek, { once: true });
    } else {
      to.currentTime = 0;
    }
    to.volume = 0;
    if (to.loop || multi) hear(track.file);                  // music, not a sting: the jukebox may play it now
    const p = to.play();
    if (p && p.catch) p.catch(() => { /* blocked; the unlock handler retries */ });

    fadeTo(to, musicVol(), fade);
    if (from && !from.paused) fadeTo(from, 0, fade, () => retire(from));
    /* A one-shot belongs to the moment it was fired for, and new music means that moment
       is over. Without this, leaving the result screen while the finish fanfare is still
       running leaves it ringing underneath whatever plays next -- `stop()` cleared these
       but `play()` did not, so only navigating to a silent screen ever ended one. */
    for (const a of live) endSfx(a, fade);

    cur = 1 - cur;
    curRole = role;
    return true;
  }

  function stop(opts) {
    opts = opts || {};
    seq++;
    pending = null;
    if (deck) {
      const el = deck[cur];
      if (el && el.src && !el.paused) resumeAt[el.src] = el.currentTime;
    }
    curRole = null;
    for (const a of live) { try { a.pause(); } catch (e) {} a.src = ""; }
    live.clear();
    if (!deck) return;
    for (const el of deck) {
      if (el.paused) continue;
      fadeTo(el, 0, opts.fade == null ? 500 : opts.fade, () => retire(el));
    }
  }

  /** The music drops away for `ms` -- a rivalry's stare-down -- and comes back hard. */
  let hushT = 0;
  function hush(ms) {
    const el = deck && deck[cur];
    if (!el || el.paused) return;
    fadeTo(el, 0, 220);
    clearTimeout(hushT);
    hushT = setTimeout(() => fadeTo(el, musicVol(), 300), ms);
  }

  /** Re-read the volume setting on whatever is currently playing. */
  function refreshVolume() {
    if (!deck) return;
    const v = musicVol();
    for (const el of deck) if (!el.paused) fadeTo(el, v, 200);
  }

  // ---------------------------------------------------------------- unlocking
  /* Autoplay is blocked until the user does something. Rather than lose the first
     request, it is held and started on the first gesture. */
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    /* The held request can be several screens out of date -- the gesture that unlocks
       audio is often the very click that navigates away. Prefer the screen actually on
       show, and fall back to the held request only if that screen has no music. */
    const p = pending;
    pending = null;
    if (lastScreen && forScreen(lastScreen)) return;
    if (p) play(p.role, p.opts);
  }
  const isUnlocked = () => unlocked;

  if (typeof document !== "undefined") {
    const once = () => {
      unlock();
      for (const ev of ["pointerdown", "keydown", "touchstart"])
        document.removeEventListener(ev, once, true);
    };
    for (const ev of ["pointerdown", "keydown", "touchstart"])
      document.addEventListener(ev, once, true);
  }

  // ---------------------------------------------------------------- sfx
  /* One-shots get their own short-lived elements so overlapping plays do not cut each
     other off. Only used when a role actually has audio; otherwise silent. */
  function sfx(role, opts) {
    opts = opts || {};
    if (!unlocked) return null;
    const track = trackFor(role);
    if (!track) return null;
    const a = new window.Audio(url(track.file));
    a.volume = clamp(sfxVol() * (opts.gain == null ? 1 : opts.gain), 0, 1);
    const p = a.play();
    if (p && p.catch) p.catch(() => {});
    // tracked, so stop() can silence a sting that is still ringing out on a new screen
    live.add(a);
    a.addEventListener("ended", () => { live.delete(a); a.src = ""; });
    /* Returns the element so a caller that knows when its moment is over can end it.
       Nothing here can assume a one-shot is short: these roles are filled by whatever
       audio the folder has, and "win" is currently a three-minute orchestral track. */
    return a;
  }

  /** Fade a one-shot out and drop it, for a caller ending it early. */
  function endSfx(a, ms) {
    if (!a || !live.has(a)) return;
    fadeTo(a, 0, ms == null ? 600 : ms, () => { live.delete(a); retire(a); });
  }

  // ---------------------------------------------------------------- race cues
  /* The race's cue list. `phase` is the simulation's own 0/1/2, and the last stretch
     gets its own cue so the finish lifts. State is kept here so the race loop can call
     this every frame without thinking about it. */
  let raceCue = null;

  /* The real game plays one theme per grade of race, then cuts to that grade's "The
     Last Competition" for the final stretch. `opts.grade` is the career label ("Debut",
     "OP", "G3", "G2", "G1", "URA Finale"); an exhibition has none and gets the Daily
     Race music. Each tier falls back down the grades, and finally to the generic race
     cues, so a folder without the rip still plays something. */
  // the Dream Trophy's finale runs to the URA Finale's music: the biggest the game has
  const TIER = { Debut: "open", OP: "open", G3: "g3", G2: "g2", G1: "g1", "URA Finale": "g1", "Dream Trophy": "g1" };
  const tierOf = opts => (opts && opts.finale) ? "g1" : (TIER[opts && opts.grade] || "daily");
  const graded = opts => ["g3", "g2", "g1"].includes(tierOf(opts));
  /* Where the final-stretch track takes over: once she is into the last quarter, or the
     leader is about to be -- the climax belongs to the race, not only to her. */
  const LAST_FROM = 0.75;

  /**
   * Called from the race loop. `opts.frac` is how far through the race she is,
   * `opts.leadFrac` how far the leader is.
   */
  function raceTick(phase, opts) {
    opts = opts || {};
    // a rivalry's track has the race (none starts before half-way, so a hold seen at the
    // start is left over from a race that was quit)
    if ((opts.frac || 0) < 0.1) rivalUntil = 0;
    if (performance.now() < rivalUntil) return;
    const base = "race_" + tierOf(opts);
    const late = Math.max(opts.frac || 0, (opts.leadFrac || 0) - 0.04) >= LAST_FROM;
    let want = late ? base + "_last" : base;
    // no rip at all: the old phase cues
    if (!has(want)) want = late ? "race_final" : (["race_opening", "race_middle", "race_final"][phase] || "race");
    if (want === raceCue) return;
    // do not restart when the resolved file is the same one (common with fallbacks)
    const nextT = trackFor(want), curT = trackFor(raceCue);
    raceCue = want;
    if (nextT && curT && nextT.file === curT.file) return;
    play(want, { fade: 900 });
  }

  /* A rivalry's clash (rivals.js) brings in a track of its own, picked at random from its
     pool -- one of the other race modes' "Last Competition" tracks for a clash in the final
     stretch, a duel theme for one mid-race -- and it keeps the race to the line, past the
     cutscene and over the race's own cue changes, until the result music. */
  let rivalUntil = 0;
  function raceRival(final) {
    const role = final ? "rival_final" : "rival", res = resolve(role);
    if (!res) return false;
    clearTimeout(hushT);                                 // the stare-down is over
    poolPick[res.source] = Math.floor(Math.random() * res.list.length);
    raceCue = role;
    rivalUntil = Infinity;
    return play(role, { fade: 300, restart: true });
  }

  /** Before the gate: the paddock music for this tier of race. */
  function racePaddock(opts) {
    rivalUntil = 0;
    raceCue = "paddock";
    play(graded(opts) ? "paddock_graded" : "paddock_open", { fade: 600 });
  }

  /**
   * The fanfare as the field goes into the gate -- G1, graded, open, or the URA
   * Finale's own. `onEnd` fires when it finishes. Returns false when there is no
   * fanfare to play (or audio is still locked), so the caller does not wait on silence.
   */
  function raceFanfare(opts, onEnd) {
    const t = tierOf(opts);
    const role = (opts && (opts.finale || opts.grade === "URA Finale" || opts.grade === "Dream Trophy")) ? "fanfare_ura"
               : t === "g1" ? "fanfare_g1" : (t === "g3" || t === "g2") ? "fanfare_graded" : "fanfare_open";
    rivalUntil = 0;
    if (!unlocked || !has(role) || musicVol() <= 0) return false;
    raceCue = "fanfare";
    return play(role, { fade: 250, restart: true, onEnd });
  }

  /* How long the fanfare gets before the result music takes over, and how long the two
     overlap while it hands off. */
  /* The result music waits for the jingle to finish, but never longer than this: the
     fallback "win" is a full-length track, not a jingle. */
  const STING_MAX = 9000, STING_HANDOFF = 800;

  /** After the line: the result jingle, then that result's music -- first, or not. */
  function raceFinish(won) {
    raceCue = null; rivalUntil = 0;
    const sting = won ? "win_jingle" : "lose_jingle";
    const after = won ? "result_win" : "result_lose";
    if (has(sting)) {
      stop({ fade: 250 });
      const mine = seq;                      // stop() bumped it; this run owns that value
      setTimeout(() => {
        if (seq !== mine) return;            // something else took over
        const a = sfx(sting, { gain: 1 });
        let landed = false;
        const land = () => {
          if (landed || seq !== mine) return;  // ...and again before the music lands
          landed = true;
          /* `play` fades the jingle out as the result music comes in, so a long fallback
             "win" track cannot sit under it for minutes -- which is what bleeding was. */
          play(after, { fade: STING_HANDOFF });
        };
        if (a) a.addEventListener("ended", land, { once: true });
        setTimeout(land, a ? STING_MAX : 0);
      }, 260);
    } else {
      play(after, { fade: 700 });
    }
  }

  /** Which screen maps to which music. Screens call `Sound.forScreen(id)`. */
  /* As the real game does it: every menu-like screen plays the home screen theme (by
     day or by night), the career setup has its own, and training follows the year.
     "home" and "training" are not files -- forScreen resolves them just below. */
  const SCREEN_ROLE = {
    "scr-title": "title",
    "scr-login": "title",
    "scr-intro": "prologue",
    "scr-menu": "home",
    "scr-howto": "home",
    "scr-settings": "home",
    "scr-starter": "prologue",
    "scr-scout": "scout",
    "scr-stable": "home",
    "scr-racer": "home",
    "scr-quests": "home",
    "scr-tutorials": "tracen",
    "scr-careerpick": "career_prep",
    "scr-parents": "career_prep",
    "scr-career": "training",
    "scr-skills": "training",
    "scr-legacy": "legacy",
  };

  /* The home theme has a night version, chosen by the player's own clock. */
  const isNight = () => { const h = new Date().getHours(); return h >= 18 || h < 6; };
  /* Career mode reports its year (0 Junior, 1 Classic, 2 Senior) each time it builds the
     turn screen -- the senior year, and the URA Finale after it, get the senior music --
     or "complete" / "failed" once the run is over. */
  let careerYear = 0;
  function setCareerYear(y) { careerYear = y; }
  function screenRole(role) {
    // the home theme is what the jukebox replaces: on the lobby, and every screen that borrows it
    if (role === "home" && picked()) return "jukebox";
    if (role === "home") return isNight() && has("home_night") ? "home_night" : "home_day";
    if (role === "training") {
      if (careerYear === "complete") return "career_complete";
      if (careerYear === "failed") return "career_failed";
      return careerYear >= 2 ? "training_senior" : "training_junior";
    }
    return role;
  }

  /** Play whatever suits this screen. The race screen is left alone -- it has cues. */
  function forScreen(id, opts) {
    lastScreen = id;
    if (id === "scr-game") return false;     // the race runs its own cue list
    const role = SCREEN_ROLE[id];
    if (!role) return false;
    return play(screenRole(role), opts);
  }

  // ---------------------------------------------------------------- info
  /** What the folder actually covers, for a settings readout or a report. */
  function coverage() {
    if (!Data) return { roles: 0, own: 0, fallback: 0, silent: 0 };
    const roles = Object.keys(Data.ROLES);
    const own = roles.filter(r => (Data.TRACKS[r] || []).length);
    const fb = roles.filter(r => !own.includes(r) && has(r));
    return {
      roles: roles.length, own: own.length, fallback: fb.length,
      silent: roles.length - own.length - fb.length,
      files: Object.values(Data.TRACKS).reduce((a, v) => a + v.length, 0),
    };
  }

  /* The deck elements are created with `new Audio()` and never enter the document, so
     they cannot be inspected with a DOM query. This reports what is actually playing. */
  function state() {
    return {
      unlocked, role: curRole, pending: pending && pending.role,
      cue: raceCue, volume: musicVol(),
      deck: (deck || []).map((el, i) => ({
        slot: i, active: i === cur,
        src: el.src ? decodeURI(el.src).split("/").pop() : null,
        paused: el.paused, time: +el.currentTime.toFixed(2),
        volume: +el.volume.toFixed(2), loop: el.loop,
        error: el.error ? el.error.code : null,
      })),
    };
  }

  const api = { play, stop, sfx, hush, forScreen, raceTick, raceRival, racePaddock, raceFanfare, raceFinish, setCareerYear,
                resumeAt, resolve, poolPick,
                unlock, isUnlocked, refreshVolume, trackFor, has, coverage, state,
                SCREEN_ROLE, jukebox,
                get current() { return curRole; } };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Sound = api;

  /* Settings changes: the volume, on whatever is playing, and a new pick at the jukebox,
     at once wherever the home theme would play -- the screen on show is asked again from
     scratch, so "jukebox" (or the theme it replaced) is looked up afresh rather than taken
     as already playing. settings.js loads after this file, so the watch is set up once
     everything has loaded. */
  function watchSettings() {
    if (!root.Settings || !root.Settings.onChange) return;
    root.Settings.onChange(id => {
      if (!id || /volume/i.test(id)) refreshVolume();
      if ((!id || id === "jukebox") && lastScreen && SCREEN_ROLE[lastScreen] === "home") { curRole = null; forScreen(lastScreen); }
    });
  }
  if (root.Settings) watchSettings();
  else if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", watchSettings, { once: true });
})(typeof globalThis !== "undefined" ? globalThis : this);
