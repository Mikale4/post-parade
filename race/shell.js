/*
 * Front-of-house: title, login, main menu, introduction, and the guided tutorial.
 *
 * The race itself lives in index.html and exposes a small surface as `Game`. This file
 * never reaches into the simulation -- it drives screens, and asks Game to start a race
 * when it wants one.
 *
 * Exposes Shell.
 */
(function (root) {
  "use strict";

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const PROFILE_KEY = "postparade.profile";

  // ---------------------------------------------------------------- account
  /* Accounts live in auth.js. `profile` here is only a cached view of whoever is signed
     in, refreshed whenever it changes. */
  let profile = Auth.current();
  const refresh = () => (profile = Auth.current());

  /* A stable's emblem: one of the pixel icons, never an emoji (they render differently
     on every machine and never match the rest of the interface). */
  const EMBLEMS = [
    { id: "turf",    label: "Turf",    cls: "turf", ico: "clover" },
    { id: "blossom", label: "Blossom", cls: "pink", ico: "blossom" },
    { id: "crown",   label: "Crown",   cls: "gold", ico: "crown" },
    { id: "comet",   label: "Comet",   cls: "cyan", ico: "comet" },
  ];

  // ---------------------------------------------------------------- screens
  let current = null, stopAmbient = null, shows = 0;

  function show(id, build, opts) {
    if (stopAmbient) { stopAmbient(); stopAmbient = null; }
    /* The deck sheet and the results sheet live in #modal, which is fixed and sits
       outside the .screen system -- so swapping screens under it left it floating over
       the new one. That is what "the transition doesn't finish, it stays on the tutorial
       page" was: the deck tutorial ends, the board renders, and the deck sheet is still
       covering it. Three call sites each remembered to clear it by hand; the rule
       belongs here, where the screen actually changes. */
    const modal = document.getElementById("modal");
    if (modal && id !== current) modal.style.display = "none";
    $$(".screen").forEach(s => s.classList.remove("on", "fadein"));
    const el = document.getElementById(id);
    if (!el) return;
    // a build may send us somewhere else instead (the menu's guards: no trainer, no
    // starter); then that screen is the one showing, and this one stands aside
    const gen = ++shows;
    if (build) build(el);
    if (gen !== shows) return;
    el.classList.add("on", "fadein");
    current = id;
    /* One call per navigation. Sound decides what a screen's music is and ignores a
       request for whatever is already playing, so this never restarts a track.
       `opts.music` overrides that for a screen whose container is shared: the career
       race result lives on scr-career but is not a training turn. `music: null` means
       something else is already sequencing the audio -- the post-race fanfare owns the
       next few seconds, and a screen change must not cut it off. */
    if (!root.Sound) return;
    const m = opts && "music" in opts ? opts.music : undefined;
    if (m === null) return;
    if (m) Sound.play(m); else Sound.forScreen(id);
  }
  function go(id, build, opts) { FX.wipe(() => show(id, build, opts)); }

  // ---------------------------------------------------------------- title
  function title() {
    show("scr-title", el => {
      refresh();
      const accounts = Auth.list();
      /* Behind the logo, a race: random launch racers running a real G1 in voxels
         (attract.js). The key art is what shows if there is no 3D to run it on. */
      el.innerHTML =
        '<div class="title-bg"></div><div class="title-race"></div>' +
        '<div class="title-vig"></div><div class="title-amb"></div>' +
        '<div class="title-live"></div>' +
        '<div class="title-fg">' +
          '<div class="title-logo pop">' +
            '<div class="uma-title logo-main">POST PARADE</div>' +
            '<div class="logo-rule"></div>' +
            '<div class="logo-sub">A RACING STORY</div>' +
          '</div>' +
          '<div class="title-menu pop-d2">' +
            (profile ? '<button class="btn lg" id="tContinue">Continue as ' + esc(profile.user) + '</button>' : '') +
            '<button class="btn ' + (profile ? 'ghost' : 'lg') + '" id="tLogin">Log in</button>' +
            '<button class="btn ghost" id="tRegister">Register a trainer</button>' +
          '</div>' +
          '<div class="title-foot">' + (accounts.length
            ? accounts.length + (accounts.length === 1 ? ' trainer registered' : ' trainers registered')
            : 'No trainers yet — register to begin') + '</div>' +
        '</div>';
      const racing = !!(root.Attract && Attract.start(el.querySelector(".title-race"), el.querySelector(".title-live")));
      el.classList.toggle("racing", racing);
      // sparkles over a live race are noise; they stay for the still key art
      const stopFx = racing ? null : FX.ambient(el.querySelector(".title-amb"), { every: 300 });
      stopAmbient = () => { if (stopFx) stopFx(); if (root.Attract) Attract.stop(); };
      const cont = el.querySelector("#tContinue");
      if (cont) cont.onclick = () => {
        FX.sparkleOn(cont, { count: 14 });
        setTimeout(() => go(profile.seenIntro ? "scr-menu" : "scr-intro",
                            profile.seenIntro ? menuBuild : introBuild), 160);
      };
      el.querySelector("#tLogin").onclick    = () => go("scr-login", e2 => authBuild(e2, "login"));
      el.querySelector("#tRegister").onclick = () => go("scr-login", e2 => authBuild(e2, "register"));
    });
  }

  // ---------------------------------------------------------------- register / sign in
  function authBuild(el, mode) {
    const reg = mode === "register";
    const accounts = Auth.list();
    const embHtml = EMBLEMS.map(e =>
      '<button class="emb ' + e.cls + '" data-emb="' + e.id + '" title="' + e.label + '">' +
      '<span>' + Icon(e.ico) + '</span><b>' + e.label + '</b></button>').join("");
    const acctHtml = accounts.map(a =>
      '<button class="acct" data-user="' + esc(a.user) + '"><b>' + esc(a.user) + '</b>' +
      '<i>' + a.races + ' race' + (a.races === 1 ? '' : 's') + ' · ' +
      a.wins + ' win' + (a.wins === 1 ? '' : 's') + '</i></button>').join("");

    el.innerHTML =
      '<div class="stripes login-bg"></div>' +
      '<div class="panel login-panel pop">' +
        '<div class="panel-hd">' + Icon("person") + (reg ? 'Trainer registration' : 'Trainer sign-in') + '</div>' +
        '<div class="login-body">' +
          '<p class="login-lead">' + (reg
            ? 'Your own stable: racers, levels and decks.'
            : 'Your stable is where you left it.') + '</p>' +
          '<label class="fld"><span>Username</span>' +
            '<input id="auUser" maxlength="16" autocomplete="off" spellcheck="false" placeholder="' +
            (reg ? '3-16 characters' : 'your trainer name') + '"></label>' +
          '<label class="fld"><span>Password</span>' +
            '<input id="auPass" type="password" maxlength="64" autocomplete="off" placeholder="' +
            (reg ? 'at least 4 characters' : '') + '"></label>' +
          (reg
            ? '<label class="fld"><span>Confirm password</span>' +
              '<input id="auPass2" type="password" maxlength="64" autocomplete="off"></label>' +
              '<div class="fld"><span>Stable emblem</span><div class="emblems">' + embHtml + '</div></div>'
            : '') +
          (!reg && accounts.length
            ? '<div class="fld"><span>Registered on this device</span>' +
              '<div class="acct-list">' + acctHtml + '</div></div>'
            : '') +
          '<div class="login-actions">' +
            '<button class="btn lg" id="auGo">' + (reg ? 'Create account' : 'Sign in') + '</button>' +
            '<button class="btn ghost sm" id="auSwap">' + (reg ? 'I have an account' : 'Register instead') + '</button>' +
            '<button class="btn ghost sm" id="auBack">' + Icon("back") + 'Back</button>' +
          '</div>' +
          '<div class="login-err" id="auErr"></div>' +
        '</div>' +
      '</div>';

    let emblem = "turf";
    el.querySelectorAll("[data-emb]").forEach(b => b.onclick = () => {
      emblem = b.dataset.emb;
      el.querySelectorAll("[data-emb]").forEach(x => x.classList.toggle("sel", x === b));
      FX.sparkleOn(b, { count: 8, spread: 26 });
    });
    const firstEmb = el.querySelector('[data-emb="turf"]');
    if (firstEmb) firstEmb.classList.add("sel");

    el.querySelectorAll("[data-user]").forEach(b => b.onclick = () => {
      el.querySelector("#auUser").value = b.dataset.user;
      el.querySelector("#auPass").focus();
    });

    const err = m => { el.querySelector("#auErr").textContent = m || ""; };
    const userIn = el.querySelector("#auUser"), passIn = el.querySelector("#auPass");
    setTimeout(() => userIn.focus(), 350);

    async function submit() {
      err("");
      const btn = el.querySelector("#auGo");
      btn.disabled = true;
      try {
        let res;
        if (reg) {
          if (passIn.value !== el.querySelector("#auPass2").value) {
            err("The two passwords do not match."); return;
          }
          res = await Auth.register(userIn.value, passIn.value, emblem);
          // the first account on a device inherits any pre-accounts stable
          if (res.ok && Auth.hasLegacyData()) Auth.claimLegacyData(res.account.id);
        } else {
          res = await Auth.login(userIn.value, passIn.value);
        }
        if (!res.ok) {
          err(res.error);
          (res.field === "user" ? userIn : passIn).focus();
          return;
        }
        refresh();
        FX.confetti({ count: 70 });
        const onward = () => go(profile.seenIntro ? "scr-menu" : "scr-intro", profile.seenIntro ? menuBuild : introBuild);
        // a new trainer makes themselves first; the menu asks anyone who never has
        setTimeout(() => reg ? go("scr-trainer", e2 => trainerBuild(e2, onward)) : onward(), 260);
      } finally { btn.disabled = false; }
    }

    el.querySelector("#auGo").onclick = submit;
    [userIn, passIn, el.querySelector("#auPass2")].forEach(i => {
      if (i) i.onkeydown = e => { if (e.key === "Enter") submit(); };
    });
    el.querySelector("#auSwap").onclick = () => authBuild(el, reg ? "login" : "register");
    el.querySelector("#auBack").onclick = () => go("scr-title", () => title());
  }

  // ---------------------------------------------------------------- intro
  const INTRO = [
    { who: "tazuna", name: "Tazuna Hayakawa",
      text: "So you're the new trainer. Good — we're short-handed, and the season starts whether we're ready or not." },
    { who: "tazuna", name: "Tazuna Hayakawa",
      text: "Here's the part that surprises everyone: you don't ride. Out there it's just her, the turf, and whatever you prepared her with." },
    { who: "specialweek", name: "Special Week",
      text: "I'll run my own race! Um — that came out louder than I meant. But I will." },
    { who: "tazuna", name: "Tazuna Hayakawa",
      text: "She means it. Every girl runs to her own temperament. Some hold back for the straight, some go the moment they see a gap." },
    { who: "tazuna", name: "Tazuna Hayakawa",
      text: "Your job is the deck. Fifteen skills, and she draws five at the gate. Give her cards her instincts will actually use." },
    { who: "goldship", name: "Gold Ship",
      text: "Or don't! Give me anything. I'll find a use for it. Probably. No promises about when." },
    { who: "tazuna", name: "Tazuna Hayakawa",
      text: "...And when the five she's holding are no good, you shout. That's a Callout. Two per race, and they don't keep." },
    { who: "tazuna", name: "Tazuna Hayakawa",
      text: "That's the whole job. Prepare her properly, read the race, and call it when it counts. Let's get you started." },
  ];

  function introBuild(el) {
    let i = 0, typing = null;
    el.innerHTML = `
      ${Bg.layer("intro")}
      <img class="intro-portrait" id="introArt" alt="">
      <div class="intro-box">
        <div class="intro-name" id="introName"></div>
        <div class="intro-text" id="introText"></div>
        <div class="intro-next" id="introNext">▼</div>
      </div>
      <button class="btn ghost sm intro-skip" id="introSkip">Skip</button>`;

    const art = el.querySelector("#introArt");
    const nameEl = el.querySelector("#introName");
    const textEl = el.querySelector("#introText");
    const next = el.querySelector("#introNext");

    function beat() {
      const b = INTRO[i];
      art.className = "intro-portrait slide-l";
      art.src = "assets/portraits/" + b.who + ".png";
      nameEl.textContent = b.name;
      next.style.opacity = 0;
      typing = FX.typeText(textEl, b.text, { speed: 20, onDone: () => { next.style.opacity = 1; } });
    }
    function advance() {
      if (typing && !typing.isDone()) { typing.skip(); next.style.opacity = 1; return; }
      i++;
      if (i >= INTRO.length) return finishIntro();
      beat();
    }
    el.onclick = advance;
    el.querySelector("#introSkip").onclick = e => { e.stopPropagation(); finishIntro(); };
    document.addEventListener("keydown", introKey);
    function introKey(e) {
      if (current !== "scr-intro") return document.removeEventListener("keydown", introKey);
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); advance(); }
    }
    function finishIntro() {
      document.removeEventListener("keydown", introKey);
      Auth.update({ seenIntro: true }); refresh();
      go(profile && profile.seenTutorial ? "scr-menu" : "scr-menu", menuBuild);
      if (profile && !profile.seenTutorial) setTimeout(() => Shell.offerTutorial(), 700);
    }
    beat();
  }

  // ---------------------------------------------------------------- menu
  /* The home screen's destinations. Career is the game, so it is the one big block; the
     rest are tiles on a race-card sheet, and the reference pages are plain links. */
  const TILES = [
    { id: "race",   label: "Exhibition", ico: "flag" },
    { id: "scout",  label: "Scout",      ico: "ticket" },
    { id: "stable", label: "Stable",     ico: "horseshoe" },
    { id: "deck",   label: "Decks",      ico: "cards" },
    { id: "quests", label: "Quests",     ico: "clipboard" },
    { id: "tutorial", label: "Tutorials", ico: "cap" },
  ];
  const LINKS = [
    { id: "howto",    label: "How to play", ico: "book" },
    { id: "settings", label: "Settings",    ico: "gear" },
  ];
  const num = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  /** Who stands on the home screen: the racer you have raced most, else your starter. */
  function homeRacer() {
    const ids = Stable.ownedIds ? Stable.ownedIds() : [];
    let best = Stable.load().starter || ids[0], lv = -1;
    for (const id of ids) {
      const l = (Stable.saveFor(id) || {}).level || 1;
      if (l > lv) { lv = l; best = id; }
    }
    const def = Stable.defOf(best);
    if (!def) return null;
    const gate = (Stable.ROSTER.findIndex(r => r.id === def.id) % 8) + 1;
    return { def, level: Math.max(1, lv), gate, sprite: Stable.spriteFor(def.id) };
  }

  /** The trainer creator (trainer.js); `next` once they are made. */
  function trainerBuild(el, next, opts) {
    if (!root.Trainer || !Trainer.ok) return next();
    Trainer.build(el, Object.assign({
      initial: profile && profile.trainer,
      onDone: t => { Auth.update({ trainer: t }); refresh(); next(); },
    }, opts || {}));
    stopAmbient = () => Trainer.stop();
  }

  function menuBuild(el) {
    refresh();
    /* Every account has a trainer, made at registration; one from before there were
       trainers makes theirs now. */
    if (profile && !profile.trainer && root.Trainer && Trainer.ok)
      return show("scr-trainer", e2 => trainerBuild(e2, () => go("scr-menu", menuBuild)));
    /* An account with no starter has nothing to play with, so the first stop is always
       choosing one. This is the guard for every route into the menu. */
    if (window.Stable && !Stable.load().starter)
      return show("scr-starter", UIMeta.starterBuild);
    /* Home is the academy's main hall, walked in voxels (lobby.js). The flat home below is
       for a machine with no WebGL to draw it on. */
    el.classList.remove("lobby-on");
    if (root.Lobby && Lobby.ok && lobbyBuild(el)) return;
    homeBuild(el);
  }

  // ---------------------------------------------------------------- the lobby
  /* Every mode, as a place in the hall: what its sign says, and what its door is. */
  const PLACES = running => ({
    career:   { label: running ? "Continue career" : "Career", sub: "Trainer's office", icon: "trophy" },
    race:     { label: "Exhibition", sub: "To the track", icon: "flag" },
    scout:    { label: "Scout", sub: "Scouting office", icon: "ticket" },
    stable:   { label: "Stable", sub: "Dormitory", icon: "horseshoe" },
    deck:     { label: "Decks", sub: "Library", icon: "cards" },
    quests:   { label: "Quests", sub: "Notice board", icon: "clipboard" },
    tutorial: { label: "Tutorials", sub: "Classroom", icon: "cap" },
    howto:    { label: "How to play", sub: "Information", icon: "book" },
    settings: { label: "Settings", sub: "Terminal", icon: "gear" },
  });
  const DOCK = ["career", "race", "scout", "stable", "deck", "quests", "tutorial", "howto", "settings"];
  const WALKER_KEY = () => "postparade.lobbyRacer." + ((Auth.current() || {}).id || "guest");

  /** Who the player walks the academy as: the trainer, or one of their own racers --
      whichever they last picked, as long as they still own her. The trainer by default. */
  const trainerDef = () => root.Trainer ? Trainer.def(profile) : null;
  function walker() {
    let id = null;
    try { id = localStorage.getItem(WALKER_KEY()); } catch (e) {}
    if (id && id !== "trainer" && Stable.owns(id) && Stable.defOf(id)) return Stable.defOf(id);
    if (root.Trainer && Trainer.ok && profile && profile.trainer) return trainerDef();
    const her = homeRacer();
    return her ? her.def : null;
  }

  const shuffled = list => {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  /** Who is in the trainer's office: the trainer -- unless the player is walking as them. */
  function officeCast(me) {
    return me.trainer || !(profile && profile.trainer) ? [] : [trainerDef()];
  }
  /** Where everyone else is: Oguri in the cafeteria (where else), a few of the dorm's
      residents at home in their rooms, her own racers and the rest of the academy in the hall,
      some at lunch, a few in the dorm corridor. */
  function whereabouts(me, office) {
    const away = new Set([me.id, ...office.map(d => d.id)]);
    const mine = Stable.ownedRacers().filter(d => !away.has(d.id));
    const rest = shuffled(Stable.ROSTER.filter(d => !away.has(d.id) && !mine.includes(d)));
    const lives = new Set(Lobby.residents || []);
    const home = rest.filter(d => lives.has(d.name) && d.name !== "Oguri Cap").slice(0, 6);
    const oguri = mine.concat(rest).find(d => d.name === "Oguri Cap");
    const left = mine.concat(rest.filter(d => !home.includes(d))).filter(d => d !== oguri);
    // (the corridor's company each keep to their own dorm's floor)
    return { cast: left.slice(0, 10), cafe: (oguri ? [oguri] : []).concat(left.slice(10, 15)), corridor: left.slice(15), home };
  }

  function lobbyBuild(el) {
    const me = walker();
    if (!me) return false;
    const p = profile || { user: "Guest", emblem: "turf", races: 0, wins: 0 };
    const st = Stable.summary();
    const waiting = Quests.claimable();
    const places = PLACES(UICareer.hasRun());
    if (waiting) places.quests.badge = waiting;
    el.innerHTML = `
      <div class="lobby"><div class="lobby-3d"></div><div class="lobby-tags"></div></div>
      <div class="menu-top pop">
        ${resStrip(p, st)}
        <span style="flex:1"></span>
        <button class="btn ghost sm lb-who" id="lbWho" title="Choose who you walk as">${Icon("person")}<span>Walking as <b>${esc(me.trainer ? "yourself" : me.name)}</b></span></button>
        ${p.trainer ? `<button class="btn ghost sm" id="lbLooks" title="Change how your trainer looks">${Icon("eye")}Your trainer</button>` : ""}
        <button class="btn ghost sm" id="signOut">${Icon("door")}Sign out</button>
      </div>
      <div class="lobby-help">${Icon("info")}<span><b>WASD</b> or arrows to walk, <b>Shift</b> to run,
        <b>E</b> to go in &mdash; or click where to go</span></div>
      <nav class="lobby-dock">${DOCK.map(id => `<button class="${id === "career" ? "career" : ""}" data-menu="${id}">
        ${Icon(places[id].icon)}<span>${esc(places[id].label)}</span>${places[id].badge ? `<em class="badge">${places[id].badge}</em>` : ""}</button>`).join("")}</nav>`;
    const office = officeCast(me);
    const ok = Lobby.start(el.querySelector(".lobby-3d"), {
      me, ...whereabouts(me, office), office, stations: places, tags: el.querySelector(".lobby-tags"),
      onEnter: id => menuPick(id),
      onJukebox: () => UIMeta.jukebox(),
      safeTop: () => el.querySelector(".menu-top").getBoundingClientRect().bottom,
    });
    if (!ok) return false;
    el.classList.add("lobby-on");
    stopAmbient = () => Lobby.stop();
    wireTop(el);
    el.querySelectorAll("[data-menu]").forEach(b => b.onclick = () => menuPick(b.dataset.menu, b));
    el.querySelector("#lbWho").onclick = async () => {
      const owned = Stable.ownedRacers();
      const cur = Lobby.player ? Lobby.player.id : me.id;
      const you = p.trainer ? [{ value: "trainer", label: p.user, sel: cur === "trainer", note: "You, the trainer", bust: { trainer: p.trainer } }] : [];
      const id = await UIMeta.choose({
        title: "Walk the academy as", message: "Yourself, or any racer you own.",
        options: you.concat(owned.map(d => ({ value: d.id, label: d.name, sel: d.id === cur, art: Stable.spriteFor(d.id), bust: d,
          note: `Lv ${Stable.saveFor(d.id).level || 1} · ${(Racers.PERSONALITIES[d.personality] || {}).name || d.style}` }))),
      });
      if (!id || id === cur) return;
      try { localStorage.setItem(WALKER_KEY(), id); } catch (e) {}
      const def = id === "trainer" ? trainerDef() : Stable.defOf(id);
      Lobby.setPlayer(def);
      el.querySelector("#lbWho b").textContent = def.trainer ? "yourself" : def.name;
    };
    const looks = el.querySelector("#lbLooks");
    if (looks) looks.onclick = () => go("scr-trainer", e2 => trainerBuild(e2, () => go("scr-menu", menuBuild), {
      title: "Your trainer", lead: "Change how you look. Your racers will know you anyway.", done: "Done",
      onBack: () => go("scr-menu", menuBuild),
    }));
    return true;
  }

  const resStrip = (p, st) => {
    const emb = EMBLEMS.find(e => e.id === p.emblem) || EMBLEMS[0];
    const pct = Math.round(st.stamina.cur / st.stamina.max * 100);
    return `
        <div class="res-strip">
          <div class="chip trainer">${Icon(emb.ico)}${esc(p.user)}</div>
          <div class="chip" title="Carrots">${Icon("carrot")}<b>${num(st.carrots)}</b></div>
          <div class="chip ${st.stamina.cur < 30 ? "low" : ""}" title="Stamina">${Icon("bolt")}<b>${st.stamina.cur}</b><i>/${st.stamina.max}</i>
            <span class="meter"><i style="width:${pct}%"></i></span></div>
          <div class="chip" title="Races won">${Icon("trophy")}<b>${p.wins}</b><i>wins</i></div>
        </div>`;
  };
  function wireTop(el) {
    el.querySelector("#signOut").onclick = () => {
      Auth.logout(); refresh();
      go("scr-title", () => title());
    };
  }

  // ---------------------------------------------------------------- the flat home
  function homeBuild(el) {
    const p = profile || { user: "Guest", emblem: "turf", races: 0, wins: 0 };
    const emb = EMBLEMS.find(e => e.id === p.emblem) || EMBLEMS[0];
    const st = Stable.summary();
    const waiting = Quests.claimable();
    const her = homeRacer();
    const running = UICareer.hasRun();
    const pct = Math.round(st.stamina.cur / st.stamina.max * 100);
    el.innerHTML = `
      ${Bg.layer("menu")}
      <div class="menu-amb"></div>
      <div class="menu-top pop">
        <div class="res-strip">
          <div class="chip trainer">${Icon(emb.ico)}${esc(p.user)}</div>
          <div class="chip" title="Carrots">${Icon("carrot")}<b>${num(st.carrots)}</b></div>
          <div class="chip ${st.stamina.cur < 30 ? "low" : ""}" title="Stamina">${Icon("bolt")}<b>${st.stamina.cur}</b><i>/${st.stamina.max}</i>
            <span class="meter"><i style="width:${pct}%"></i></span></div>
          <div class="chip" title="Races won">${Icon("trophy")}<b>${p.wins}</b><i>wins</i></div>
        </div>
        <span style="flex:1"></span>
        <button class="btn ghost sm" id="signOut">${Icon("door")}Sign out</button>
      </div>
      <div class="home">
        <div class="home-stage">
          ${her ? `<img class="home-hero" src="${encodeURI(her.sprite)}" alt="">
          <div class="home-cloth"><span class="cloth-n" style="background:var(--w${her.gate});${her.gate === 1 || her.gate === 5 ? "color:var(--ink)" : ""}">${her.gate}</span>
            <span class="who"><b>${esc(her.def.name)}</b><i>Lv ${her.level} · ${esc((Racers.PERSONALITIES[her.def.personality] || {}).name || her.def.style)}</i></span></div>` : ""}
        </div>
        <div class="home-side">
          <div class="home-brand pop">
            <div class="uma-title menu-logo">POST PARADE</div>
            <div class="menu-tag">Prepare her. Then find out.</div>
          </div>
          <div class="home-sheet pop-d1">
            <div class="sec">
              <button class="btn lg home-career" data-menu="career">
                ${Icon("trophy")}<span><b>${running ? "Continue career" : "Career"}</b>
                <i>${running ? "Your run is waiting" : "URA Finale, or the Dream Trophy"}</i></span>
              </button>
            </div>
            <div class="sec">
              <h4>RACE AND PREPARE</h4>
              <div class="tiles">
                ${TILES.map(t => `<button class="tile" data-menu="${t.id}">${Icon(t.ico)}${t.label}
                  ${t.id === "quests" && waiting ? `<span class="badge">${waiting}</span>` : ""}</button>`).join("")}
              </div>
            </div>
            <div class="sec home-links">
              ${LINKS.map(t => `<button data-menu="${t.id}">${Icon(t.ico)}${t.label}</button>`).join("")}
            </div>
          </div>
        </div>
      </div>`;
    stopAmbient = FX.ambient(el.querySelector(".menu-amb"), { every: 900 });
    el.querySelector("#signOut").onclick = () => {
      Auth.logout(); refresh();
      go("scr-title", () => title());
    };
    el.querySelectorAll("[data-menu]").forEach(b => {
      b.onclick = () => menuPick(b.dataset.menu, b);
    });
  }

  function menuPick(id, btn) {
    if (id === "tutorial") return go("scr-tutorials", Tutorials.listBuild);
    if (id === "howto")    return go("scr-howto", howtoBuild);
    if (id === "settings") return go("scr-settings", settingsBuild);
    // the meta screens own themselves
    if (id === "career") return go("scr-careerpick", UICareer.pickerBuild);
    if (id === "scout")  return go("scr-scout",  UIMeta.scoutBuild);
    if (id === "stable") return go("scr-stable", UIMeta.stableBuild);
    if (id === "quests") return go("scr-quests", UIMeta.questsBuild);
    /* Deck building is its own screen now -- named decks, equipped to racers. The race
       app's sheet is only the pre-race setup it always was. */
    if (id === "deck")   return go("scr-decks", UIDecks.listBuild);
    // the rest hand off to the race app
    FX.wipe(() => {
      show("scr-game");
      if (id === "race") Game.showDeck();
    });
  }

  // ---------------------------------------------------------------- how to play
  const HOWTO = [
    ["cards", "You never play a card", "Your racer draws five of her fifteen at the gate and spends them by her own judgement. Temperament decides what she reaches for; <b>wit</b> decides how well she times it."],
    ["megaphone", "You call her", "Twice a race you can <b>Callout</b>: bin the cards she is holding and draw five more. Binned cards are gone, so call it on a dead hand, never a good one."],
    ["heart", "Stamina is the whole risk", "Every burst is borrowed against the finish. Run the tank dry before the line and she falls apart in the straight."],
    ["flag", "The trip decides the deck", "Pace cards win sprints. Stamina cards win staying trips. The right deck at 1200m is the wrong deck at 3200m."],
    ["star", "She has one skill of her own", "Each racer carries a signature skill that fires by itself, once, only when her own moment arrives."],
  ];
  function howtoBuild(el) {
    el.innerHTML = `
      <div class="menu-bg turf-bg stripes"></div>
      <!-- .scr-wrap is what every other screen scrolls in. Without it this panel is
           centred at its full height, so on a short viewport the heading is cut off the
           top and the buttons sit below the fold with nothing to scroll. -->
      <div class="scr-wrap howto-wrap">
        <div class="panel howto-panel pop">
          <div class="panel-hd">${Icon("book")}How to play</div>
          <div class="howto-list">
            ${HOWTO.map((h, i) => `
              <div class="howto-row pop-d${Math.min(i + 1, 4)}">
                <div class="howto-ic">${Icon(h[0])}</div>
                <div><b>${h[1]}</b><p>${h[2]}</p></div>
              </div>`).join("")}
          </div>
          <div class="howto-actions">
            <button class="btn" id="htTut">Try the tutorial</button>
            <button class="btn ghost" id="htBack">Back</button>
          </div>
        </div>
      </div>`;
    el.querySelector("#htBack").onclick = () => go("scr-menu", menuBuild);
    el.querySelector("#htTut").onclick = () => startTutorial();
  }

  // ---------------------------------------------------------------- tutorial
  /* Steps advance on a condition rather than a timer, so the coach never talks over
     something the player has not seen yet. `spot` highlights an element by selector. */
  const TUT = [
    { text: "This is Tokyo, 2400 metres. Special Week is yours today — watch her, not the buttons.",
      wait: "click" },
    { text: "Down there is everything she can reach: five cards from a deck of fifteen. You cannot play them. She will, when she thinks it is time.",
      spot: "#played", wait: "click" },
    { text: "That is her spirit, and it fills as she covers ground. A card she cannot afford yet simply waits.",
      spot: "#spBar", wait: "click" },
    { text: "Now watch her hand. She will spend one the moment she judges it right — and you have no say in it.",
      spot: "#played", wait: "cardPlayed", timeout: 26000 },
    { text: "There. Her temperament picked that moment, not you. Yours was picking the card that was there to pick.",
      wait: "click" },
    { text: "Now the important bit. When the five she is holding are useless, this button bins them and draws five more.",
      spot: ".callout", wait: "click" },
    { text: "It turns amber the moment her hand goes dead. That is the only signal you need — and the cards you bin are gone, so never call it on a good hand.",
      spot: ".callout", wait: "click" },
    { text: "Watch the hint under the button. When it says she is stuck, call it. Go on — I'll wait.",
      spot: ".callout", wait: "callout", timeout: 45000 },
    { text: "That is the job. Build the deck, read the race, call her when it counts. The rest is hers.",
      wait: "click", last: true },
  ];

  let tut = null;
  function startTutorial() {
    FX.wipe(() => {
      show("scr-game");
      Game.startTutorialRace();
      tut = { i: -1, done: false };
      buildCoach();
      nextStep();
    });
  }

  function buildCoach() {
    let c = document.getElementById("coach");
    if (!c) {
      c = document.createElement("div");
      c.id = "coach";
      document.body.appendChild(c);
    }
    c.className = "coach on";
    c.innerHTML = `
      <img class="coach-art" src="assets/portraits/tazuna.png" alt="">
      <div class="coach-bubble">
        <div class="coach-name">Tazuna Hayakawa</div>
        <div class="coach-text" id="coachText"></div>
        <div class="coach-cta" id="coachCta">click to continue</div>
      </div>
      <button class="btn ghost sm coach-skip" id="coachSkip">Skip tutorial</button>`;
    c.querySelector("#coachSkip").onclick = e => { e.stopPropagation(); endTutorial(false); };
    c.addEventListener("click", () => {
      /* The listener outlives the run: the coach bar is rebuilt, not rebound, so a click
         after the tutorial ends found `tut` null and threw. */
      const s = tut && TUT[tut.i];
      if (!s) return;
      if (tut.typing && !tut.typing.isDone()) { tut.typing.skip(); return; }
      if (s.wait === "click") nextStep();
    });
  }

  function spotlight(sel) {
    $$(".spot-ring").forEach(n => n.remove());
    const coach = document.getElementById("coach");
    if (!sel) { if (coach) coach.classList.remove("at-top"); return; }
    const t = document.querySelector(sel);
    if (!t) { if (coach) coach.classList.remove("at-top"); return; }
    const r = t.getBoundingClientRect();
    const ring = document.createElement("div");
    ring.className = "spot-ring";
    ring.style.cssText =
      `left:${r.left - 10}px;top:${r.top - 10}px;width:${r.width + 20}px;height:${r.height + 20}px`;
    document.body.appendChild(ring);

    /* The coach sits along the bottom, which is exactly where the card row and the
       Callout live -- so pointing at them while covering them is useless. When the
       target is in the lower half, move her to the top for that step. */
    if (coach) {
      const targetIsLow = r.top + r.height / 2 > innerHeight * 0.55;
      coach.classList.toggle("at-top", targetIsLow);
      // the ring may now be under her, so re-measure after the move settles
      setTimeout(() => {
        const rr = t.getBoundingClientRect();
        ring.style.cssText =
          `left:${rr.left - 10}px;top:${rr.top - 10}px;width:${rr.width + 20}px;height:${rr.height + 20}px`;
      }, 30);
    }
  }

  function nextStep() {
    if (!tut || tut.done) return;
    tut.i++;
    const s = TUT[tut.i];
    if (!s) return endTutorial(true);

    /* The race is a live simulation and the player is reading. Without this it gallops
       on while she talks -- by the third step the field is a third of the way round and
       nothing she describes is still on screen. Explanatory steps hold the race; steps
       that wait FOR the race obviously let it run. */
    if (window.Game && Game.isRacing && Game.isRacing())
      Game.setPaused(s.wait === "click");

    spotlight(s.spot);
    const cta = document.getElementById("coachCta");
    cta.textContent = s.wait === "click" ? "click to continue"
      : s.wait === "cardPlayed" ? "waiting for her to play one…"
      : s.wait === "callout" ? "press the Callout button"
      : "";
    tut.typing = FX.typeText(document.getElementById("coachText"), s.text, { speed: 18 });

    /* An event-gated step must not be able to hang. If the race never produces the
       thing we are waiting for, move on rather than stranding the player. */
    clearTimeout(tut.timer);
    if (s.timeout) {
      const at = tut.i;
      tut.timer = setTimeout(() => {
        if (tut && !tut.done && tut.i === at) nextStep();
      }, s.timeout);
    }
    if (s.last) tut.timer = setTimeout(() => { if (tut && !tut.done) endTutorial(true); }, 9000);
  }

  /** The race app calls this when something the tutorial might be waiting on happens. */
  function notify(evt) {
    if (!tut || tut.done) return;
    const s = TUT[tut.i];
    if (!s || s.wait !== evt) return;

    /* The race often does the thing she is describing WHILE she is still describing it
       -- the racer spends a card a second or two in, and the step used to advance on the
       spot, cutting the sentence in half. Let her finish, then move on. */
    const at = tut.i;
    const advance = () => { if (tut && !tut.done && tut.i === at) nextStep(); };
    if (tut.typing && !tut.typing.isDone()) {
      const poll = setInterval(() => {
        if (!tut || tut.done || tut.i !== at) return clearInterval(poll);
        if (tut.typing.isDone()) { clearInterval(poll); setTimeout(advance, 750); }
      }, 120);
      return;
    }
    setTimeout(advance, 550);
  }

  function endTutorial(completed) {
    if (!tut) return;
    tut.done = true; clearTimeout(tut.timer); tut = null;
    $$(".spot-ring").forEach(n => n.remove());
    // never hand the race back still frozen
    if (window.Game && Game.isPaused && Game.isPaused()) Game.setPaused(false);
    const c = document.getElementById("coach");
    if (c) c.className = "coach";
    /* This tutorial predates the tutorial board and never paid out or returned to it --
       the other three do both through Tutorials.finish(). Same treatment here. */
    let paid = 0;
    if (completed) {
      Auth.update({ seenTutorial: true }); refresh();
      if (window.Stable) {
        const res = Stable.completeTutorial("race");     // first time only; a repeat pays 0
        if (res.ok) paid = res.carrots;
      }
      if (window.Quests) {
        Quests.record("tutorial");
        const got = Quests.checkAwards();
        if (got.length && window.UIMeta) UIMeta.toastAwards(got);
      }
    }
    Game.endTutorialRace();
    if (completed) FX.confetti({ count: 80 });
    setTimeout(async () => {
      if (window.Tutorials) go("scr-tutorials", Tutorials.listBuild);
      else go("scr-menu", menuBuild);
      if (paid) {
        await UIMeta.reward({
          kicker: "Tutorial complete",
          title: "Race Basics",
          message: "That one only pays the first time through.",
          reward: { carrots: paid },
        });
      }
    }, completed ? 900 : 200);
  }

  function offerTutorial() {
    const el = document.getElementById("scr-menu");
    if (!el || current !== "scr-menu") return;
    const box = document.createElement("div");
    box.className = "offer pop";
    box.innerHTML = `
      <img src="assets/portraits/tazuna.png" alt="">
      <div><b>First time out?</b><p>Let me walk you through a race. It takes two minutes.</p>
        <div class="offer-btns">
          <button class="btn pink sm" id="offYes">Show me</button>
          <button class="btn ghost sm" id="offNo">I'll manage</button>
        </div></div>`;
    el.appendChild(box);
    box.querySelector("#offYes").onclick = () => { box.remove(); startTutorial(); };
    box.querySelector("#offNo").onclick = () => {
      box.remove();
      Auth.update({ seenTutorial: true }); refresh();
    };
  }

  // ---------------------------------------------------------------- settings
  /* One builder, used by both the Settings screen and the pause overlay, so the two can
     never drift apart. */
  function settingsHtml() {
    return Settings.DEFS.filter(d => !d.hidden).map(d => {
      const v = Settings.get(d.id);
      let control;
      if (d.type === "toggle") {
        control = '<button class="tgl' + (v ? ' on' : '') + '" data-set="' + d.id +
                  '" role="switch" aria-checked="' + (!!v) + '"><i></i></button>';
      } else {
        control = '<div class="seg" data-set="' + d.id + '">' +
          d.choices.map(c => '<button class="' + (c[0] === v ? 'sel' : '') +
            '" data-val="' + c[0] + '">' + c[1] + '</button>').join('') + '</div>';
      }
      return '<div class="setrow"><div class="setlab"><b>' + d.label + '</b>' +
             '<i>' + d.help + '</i></div>' + control + '</div>';
    }).join("");
  }

  /* A scrolling panel has to say so. These boxes fill from the top, so the only clue
     that more exists is a scrollbar the user may never look for -- and on the pause
     menu the last rows sit below the fold at common window heights. The hint is a fade
     plus a chevron over the bottom edge, shown only while there is actually more to
     reach, and it never eats clicks. */
  function wireScrollHint(scroller, hint) {
    if (!scroller || !hint) return null;
    const update = () => {
      const more = scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop;
      hint.classList.toggle("on", more > 6);
    };
    scroller.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    scroller._hintUpdate = update;        // content can change; callers re-check
    setTimeout(update, 0);
    return update;
  }

  function wireSettings(scope) {
    scope.querySelectorAll(".tgl[data-set]").forEach(b => b.onclick = () => {
      const id = b.dataset.set;
      const next = !Settings.get(id);
      Settings.set(id, next);
      b.classList.toggle("on", next);
      b.setAttribute("aria-checked", String(next));
      if (next) FX.sparkleOn(b, { count: 6, spread: 20 });
    });
    scope.querySelectorAll(".seg[data-set]").forEach(seg => {
      seg.querySelectorAll("button").forEach(b => b.onclick = () => {
        const raw = b.dataset.val;
        Settings.set(seg.dataset.set, isNaN(+raw) ? raw : +raw);
        seg.querySelectorAll("button").forEach(x => x.classList.toggle("sel", x === b));
      });
    });
  }

  function settingsBuild(el) {
    const acc = Auth.current();
    el.innerHTML =
      Bg.layer("howto") +
      '<div class="panel set-panel pop">' +
        '<div class="panel-hd blue">' + Icon("gear") + 'Settings</div>' +
        '<div class="set-body">' + settingsHtml() +
          '<div class="set-danger">' +
            '<b>This account</b>' +
            '<div class="set-danger-row">' +
              '<button class="btn ghost sm" id="setReset">Restore defaults</button>' +
              (acc ? '<button class="btn ghost sm" id="setWipe">Erase my stable</button>' +
                     '<button class="btn ghost sm" id="setDelete">Delete account</button>' : '') +
            '</div>' +
            (acc ? '<i>Signed in as <b>' + esc(acc.user) + '</b>. Deleting removes the account and its stable from this device.</i>' : '') +
          '</div>' +
        '</div>' +
        '<div class="scroll-hint" id="setHint"><i>▾</i></div>' +
        '<div class="set-actions"><button class="btn" id="setBack">Back</button></div>' +
      '</div>';
    wireSettings(el);
    wireScrollHint(el.querySelector(".set-body"), el.querySelector("#setHint"));
    el.querySelector("#setBack").onclick = () => go("scr-menu", menuBuild);
    el.querySelector("#setReset").onclick = async () => {
      if (!await UIMeta.ask({ title: "Restore defaults",
        message: "Put every setting back to its default?" })) return;
      Settings.reset(); settingsBuild(el);
    };
    const wipe = el.querySelector("#setWipe");
    if (wipe) wipe.onclick = async () => {
      if (!await UIMeta.ask({ title: "Erase this stable", danger: true,
        message: "Erase every racer's level and deck on this account?",
        detail: "The account itself stays.", confirm: "Erase it" })) return;
      try { localStorage.removeItem(Auth.saveKey()); } catch (e) {}
      UIMeta.notify("Stable erased.");
    };
    const del = el.querySelector("#setDelete");
    if (del) del.onclick = async () => {
      if (!await UIMeta.ask({ title: "Delete account", danger: true,
        message: "Delete " + acc.user + " and everything in this stable?",
        detail: "This cannot be undone.", confirm: "Delete for good" })) return;
      Auth.removeAccount(acc.id);
      refresh();
      go("scr-title", () => title());
    };
  }

  // ---------------------------------------------------------------- pause
  /* The pause overlay is shell-owned but the freeze itself belongs to the race, which
     knows how to hold its own clock still. */
  let pauseEl = null;

  function pauseOverlay() {
    if (!pauseEl) {
      pauseEl = document.createElement("div");
      pauseEl.id = "pause";
      document.body.appendChild(pauseEl);
    }
    return pauseEl;
  }

  function isPaused() { return !!(window.Game && Game.isPaused && Game.isPaused()); }

  function openPause() {
    if (!window.Game || !Game.isRacing()) return;
    if (isPaused()) return;
    Game.setPaused(true);
    const tut = Game.isTutorial();
    const el = pauseOverlay();
    el.className = "on";
    el.innerHTML =
      '<div class="pause-card pop">' +
        '<div class="panel-hd board">Paused</div>' +
        '<div class="pause-body">' +
          '<div class="pause-btns">' +
            '<button class="btn lg" id="pResume">Resume</button>' +
            (tut ? '' : '<button class="btn ghost" id="pRestart">Restart race</button>') +
            '<button class="btn ghost" id="pSettings">' + Icon("gear") + 'Settings</button>' +
            '<button class="btn ghost" id="pQuit">' + (tut ? 'End tutorial' : 'Quit to menu') + '</button>' +
          '</div>' +
          '<div class="pause-set" id="pSet" hidden>' + settingsHtml() + '</div>' +
        '</div>' +
        '<div class="scroll-hint" id="pHint"><i>▾</i></div>' +
        '<div class="pause-foot">Esc or P to resume</div>' +
      '</div>';

    el.querySelector("#pResume").onclick = closePause;
    const pBody = el.querySelector(".pause-body");
    wireScrollHint(pBody, el.querySelector("#pHint"));
    el.querySelector("#pSettings").onclick = () => {
      const box = el.querySelector("#pSet");
      box.hidden = !box.hidden;
      if (!box.hidden) wireSettings(box);
      // the panel just changed height, so the hint has to be re-evaluated
      if (pBody && pBody._hintUpdate) setTimeout(pBody._hintUpdate, 0);
    };
    const rs = el.querySelector("#pRestart");
    if (rs) rs.onclick = async () => {
      if (!await UIMeta.ask({ title: "Restart", message: "Run this race again from the gate?" })) return;
      closePause(); Game.restartRace();
    };
    el.querySelector("#pQuit").onclick = async () => {
      const shouldAsk = !tut && Settings.get("confirmQuit");
      if (shouldAsk && !await UIMeta.ask({ title: "Abandon the race", danger: true,
        message: "Leave this race and return to the menu?", confirm: "Abandon" })) return;
      closePause();
      if (tut) { endTutorial(false); return; }
      Game.quitRace();
      go("scr-menu", menuBuild);
    };
  }

  function closePause() {
    if (pauseEl) pauseEl.className = "";
    if (window.Game && Game.setPaused) Game.setPaused(false);
  }

  function togglePause() { isPaused() ? closePause() : openPause(); }

  document.addEventListener("keydown", e => {
    if (e.key !== "Escape" && e.key !== "p" && e.key !== "P") return;
    if (current !== "scr-game") return;
    const modalUp = getComputedStyle(document.getElementById("modal")).display !== "none";
    if (modalUp) return;                       // results/deck sheets have their own way out
    if (document.activeElement && /input|textarea/i.test(document.activeElement.tagName)) return;
    e.preventDefault();
    togglePause();
  });

  // ---------------------------------------------------------------- misc
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /** Called by the race app after a race resolves, to keep career stats honest. */
  function recordResult(won) {
    const cur = Auth.current();
    if (!cur) return;
    Auth.update({ races: (cur.races || 0) + 1, wins: (cur.wins || 0) + (won ? 1 : 0) });
    refresh();
  }

  function toMenu() { go("scr-menu", menuBuild); }

  function boot() { title(); }

  /* `go` and `show` are handed out so the meta screens (scout, stable, quests, career)
     can live in their own files and still navigate the same way everything else does. */
  const Shell = { boot, toMenu, notify, offerTutorial, recordResult,
                  startRaceTutorial: startTutorial,
                  openPause, closePause, togglePause, settingsBuild,
                  go, show, menuBuild, esc,
                  get profile() { return profile; },
                  get account() { return Auth.current(); } };
  root.Shell = Shell;
})(typeof globalThis !== "undefined" ? globalThis : this);
