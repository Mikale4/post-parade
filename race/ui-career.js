/*
 * Career mode's screen: the turn loop, the training board, race days, and the ending.
 *
 * All the rules live in career.js. This file shows the state and calls into it -- if a
 * number appears here that career.js does not know about, that is a bug.
 *
 * A run in progress is written to `postparade.career.<accountId>` after every turn, so
 * closing the tab mid-career loses nothing. Career state is deliberately serialisable
 * (see the rng note in career.js).
 *
 * Exposes UICareer.
 */
(function (root) {
  "use strict";

  const esc = s => String(s).replace(/[&<>"]/g,
    c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const art = p => encodeURI(String(p || ""));
  const num = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  /** 1st, 2nd, 3rd, 4th. Used by the result panel and the schedule. */
  const ord = n => ["th", "st", "nd", "rd"][(n % 100 - n % 10 !== 10) * 1 && n % 10 < 4 ? n % 10 : 0];
  const go = (id, build, opts) => Shell.go(id, build, opts);

  const KEY = () => {
    const a = (root.Auth && Auth.current()) ? Auth.current().id : "guest";
    return "postparade.career." + a;
  };

  let S = null;              // the live career state
  let tutorial = false;      // a tutorial run pays nothing and saves nothing
  const scn = () => Career.scenarioOf(S);     // this run's scenario: URA Finale or the Dream Trophy

  /* Which scenario the picker has selected. Remembered on this device so a trainer who
     runs the Dream Trophy does not have to pick it again every time. */
  const SCN_KEY = "postparade.scenario";
  function pickedScenario() {
    try { const v = localStorage.getItem(SCN_KEY); if (Career.SCENARIOS[v]) return v; } catch (e) {}
    return "ura";
  }
  function setPickedScenario(id) { try { localStorage.setItem(SCN_KEY, id); } catch (e) {} }
  const staminaFor = id => Stable.STAMINA[Career.scenarioOf(id).stamina];

  // ---------------------------------------------------------------- persistence
  function persist() {
    if (tutorial) return;
    try { localStorage.setItem(KEY(), JSON.stringify(S)); } catch (e) {}
  }
  function clearSaved() {
    try { localStorage.removeItem(KEY()); } catch (e) {}
  }
  function saved() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY()));
      return raw && !raw.done ? raw : null;
    } catch (e) { return null; }
  }
  const hasRun = () => !!saved();

  // ---------------------------------------------------------------- entry
  /**
   * Start a career with a racer the player owns. Costs stamina, because the run -- not
   * each race inside it -- is the thing being bought.
   */
  async function begin(racerId, opts) {
    opts = opts || {};
    tutorial = !!opts.tutorial;
    const def = Stable.defOf(racerId);
    if (!def) return UIMeta.notify("No such racer.");
    if (!tutorial && !Stable.owns(racerId))
      return UIMeta.notify(`You do not have ${def.name} yet. Scout her first.`);

    const existing = saved();
    if (!tutorial && existing) {
      const who = Stable.defOf(existing.racerId);
      const fresh = await UIMeta.ask({ title: "Career in progress", danger: true,
        message: `${who ? who.name : "Someone"} is mid-career (${Career.turnLabel(existing.turn, existing)}).`,
        detail: "Starting a new run abandons it.",
        confirm: "Start a new run", cancel: "Continue that one" });
      if (!fresh) return resume();
      clearSaved();
    }

    /* Which scenario. The picker always says; a career started from anywhere else (her
       page in the stable) asks. The tutorial is always a URA Finale. */
    let scenario = tutorial ? "ura" : opts.scenario;
    if (!scenario) {
      scenario = await chooseScenario();
      if (!scenario) return;
    }
    const scen = Career.scenarioOf(scenario);

    if (!tutorial) {
      const cost = staminaFor(scenario);
      const st = Stable.stamina();
      if (st.cur < cost) {
        return UIMeta.notify(`A ${scen.name} run costs ${cost} stamina and you have ${st.cur}. ` +
          `It refills on its own, or you can buy a refill with carrots.`, { title: "Not enough stamina" });
      }
      /* Once there are veterans to inherit from, choosing them is part of starting a
         run -- so the pairing screen comes before the stamina is spent, not after. */
      if (root.Legacy && Legacy.veterans().length && !opts.parents)
        return go("scr-parents", e2 => parentsBuild(e2, racerId, scenario));

      const equipped = Stable.deckForRacer(racerId);
      const start = await UIMeta.ask({ title: scen.title,
        message: `Three years with ${def.name}, then the ${scen.finale}.`,
        detail: `This costs ${cost} stamina.` + (scen.fullDeck
          ? ` Every race is run with her whole deck, and her rivals bring decks of their own` +
            (equipped ? ` — she takes ${equipped.name}.` : `. She has no deck equipped: build her one first.`)
          : ""),
        confirm: "To the gate" });
      if (!start) return;
      Stable.spendStamina(cost);
    }

    /* The career starts from a fraction of her rated ability, and her level and passives
       ride along as the mods the sim reads. */
    const sv = Stable.saveFor(racerId);
    const built = Progress.build(def, sv);
    S = Career.create(Object.assign({}, built, { sprite: Stable.spriteFor(racerId) }), { scenario });
    S.level = sv.level;
    S.mods = built.mods;
    S.tutorial = tutorial;

    /* Inheritance is spent here, on a fresh state: starting stats, aptitude grades, an
       inherited unique and skill hints all land before the first turn. */
    if (!tutorial && opts.parents && opts.parents.length && root.Legacy) {
      const plan = Legacy.inheritanceFor(def, opts.parents[0], opts.parents[1]);
      Legacy.applyToCareer(S, plan, def);
      S.legacyPlan = plan;
    }
    if (!tutorial) { Quests.record("careerStart"); persist(); }
    /* A career is three years of someone's life and it used to open on a spreadsheet.
       The tutorial career skips it -- that run has its own narration. */
    if (tutorial) return go("scr-career", careerBuild);
    go("scr-career", el => careerIntro(el, () => go("scr-career", careerBuild)));
  }

  function resume() {
    const raw = saved();
    if (!raw) return UIMeta.notify("No career in progress.");
    S = raw; tutorial = false;
    go("scr-career", careerBuild);
  }

  /** Ask which scenario, for a career started away from the picker. Null if cancelled. */
  function chooseScenario() {
    const sel = pickedScenario();
    return UIMeta.choose({ title: "Which career?", options: Object.keys(Career.SCENARIOS).map(id => {
      const c = Career.SCENARIOS[id];
      return { value: id, label: c.title, sel: id === sel,
               note: `${c.blurb} ${staminaFor(id)} stamina.` };
    }) }).then(v => { if (v) setPickedScenario(v); return v; });
  }

  // ---------------------------------------------------------------- moments
  /* A career is 78 turns long and almost all of it used to resolve silently: a year
     turned over, a goal cleared, the Finale arrived, and nothing marked any of it. These
     are the beats worth stopping for. Queued rather than fired directly, because a
     single turn can trigger two (clear the last Junior goal AND roll into Classic). */
  let momentQueue = [];

  function moment(opts) {
    return new Promise(resolve => {
      const el = document.createElement("div");
      el.className = "cmoment k" + (opts.kind || "year");
      el.innerHTML =
        (opts.bg ? `<div class="cm-bg" style="background-image:url('${Bg.url(opts.bg)}')"></div>` : "") +
        '<div class="cm-scrim"></div>' +
        '<div class="cm-body">' +
          (opts.kicker ? `<div class="cm-kicker">${esc(opts.kicker)}</div>` : "") +
          `<div class="cm-title">${esc(opts.title || "")}</div>` +
          (opts.sub ? `<div class="cm-sub">${esc(opts.sub)}</div>` : "") +
          (opts.art ? `<img class="cm-art" src="${art(opts.art)}" alt="">` : "") +
        '</div>';
      document.body.appendChild(el);
      requestAnimationFrame(() => el.classList.add("in"));

      let done = false;
      const close = () => {
        if (done) return;
        done = true;
        clearTimeout(t);
        el.classList.remove("in");
        el.classList.add("out");
        setTimeout(() => { el.remove(); resolve(); }, 420);
      };
      el.onclick = close;
      const t = setTimeout(close, opts.hold == null ? 2200 : opts.hold);
    });
  }

  /** Play everything queued, in order, then continue. */
  async function playMoments() {
    while (momentQueue.length) {
      const m = momentQueue.shift();
      await moment(m);
    }
  }

  const YEAR_SUB = [
    "She is new to all of this. Build the base.",
    "The year the good ones separate themselves.",
    "Last chance. Everything she has, spent well.",
  ];

  /** Compare a snapshot from before the turn against now, and queue what changed. */
  function collectMoments(before) {
    if (!S || tutorial) return;
    const yr = Career.turnYear(S.turn);

    // a goal cleared
    const nowMet = Career.goalStatus(S).filter(g => g.met).length;
    if (nowMet > before.goalsMet) {
      const just = Career.goalStatus(S).filter(g => g.met).slice(-1)[0];
      momentQueue.push({ kind: "goal", kicker: "Goal cleared", title: "Objective met",
        sub: just ? just.text : "", bg: Bg.fileFor("result"), hold: 1900 });
    }
    // the year turned over
    if (S.turn < Career.TRAINING_TURNS && yr > before.year) {
      momentQueue.push({ kind: "year", kicker: "A new season",
        title: Career.YEARS[yr] + " Year", sub: YEAR_SUB[yr] || "",
        bg: Bg.fileFor("career", { month: Career.turnMonth(S.turn) }),
        art: S.sprite, hold: 2400 });
    }
    // summer camp opened
    if (Career.isSummerCamp(S.turn) && !before.camp) {
      momentQueue.push({ kind: "camp", kicker: "Summer camp", title: "Every facility at level 5",
        sub: "Two months of the best training she will get all year.",
        bg: Bg.fileFor("recreation"), hold: 2200 });
    }
    // into the Finale
    if (S.turn >= Career.TRAINING_TURNS && before.turn < Career.TRAINING_TURNS) {
      const st = scn().stages;
      momentQueue.push({ kind: "finale" + (scn().fullDeck ? " dream" : ""), kicker: "Three years done",
        title: scn().finale.toUpperCase(),
        sub: `${st.Qualifier}, ${st.Semifinal}, ${st.Finals}. She has to win all three.`,
        bg: Bg.fileFor("finale", { crowd: true }), art: S.sprite, hold: 3000 });
    }
  }

  const snapshot = () => ({
    turn: S.turn, year: Career.turnYear(S.turn),
    camp: Career.isSummerCamp(S.turn),
    goalsMet: Career.goalStatus(S).filter(g => g.met).length,
  });

  // ---------------------------------------------------------------- opening
  /* The scenario opening. Four short beats before the first turn: who she is, what she
     is built for, what the line behind her gave her, and what the board wants first.
     Click to advance, skip at any time. Shown once per run, never in the tutorial. */
  function careerIntro(el, done) {
    const def = Stable.defOf(S.racerId) || {};
    const goal = Career.currentGoal(S);
    const apt = S.aptitude || def.aptitude || {};
    const plan = S.legacyPlan;

    /* Her scene, not a generic one -- intros.js writes it from who she is. It opens with
       Tazuna framing the three years, then hands over to the racer. */
    /* The Dream Trophy opens on its own terms: who she is up against, and what changes in
       a race -- a trainer who has only run URA Finales needs telling once, at the gate. */
    const dream = scn().fullDeck;
    const equipped = Stable.deckForRacer(S.racerId);
    const beats = (dream ? [
      { who: "Tazuna Hayakawa",
        text: `The Dream Trophy. The best racers in the country, and they do not wait three ` +
              `years for anyone. ${S.racerName} is yours from today — Junior, Classic, Senior, ` +
              `against the strongest field there is.` },
      { who: "Tazuna Hayakawa", show: "dream",
        text: `Every race here is run with her whole deck in hand. Nothing is drawn, so spirit ` +
              `is the only limit — and a Callout tells her to play the card that is due, free. ` +
              `Save it for the run-in. Her rivals bring decks of their own, and they know when to call.` },
      { who: "Tazuna Hayakawa",
        text: equipped ? `She takes ${equipped.name} to the gate. Make it the best one she has.`
                       : `She has no deck equipped. Leave the run for a moment and give her one on ` +
                         `the Decks screen — the run waits for you.` },
    ] : [
      { who: "Tazuna Hayakawa",
        text: `Three years, then the URA Finale. ${S.racerName} is yours from today — ` +
              `Junior, Classic, Senior, and whatever she makes of them.` },
    ]).concat(root.Intros ? Intros.forRacer(def, S) : [
      { who: "Tazuna Hayakawa",
        text: `Look at what she is built for before you plan anything.`, show: "apt" },
      { who: "Tazuna Hayakawa",
        text: goal ? `First thing the board wants: ${goal.text}.` : `Just win.`,
        show: "goal" },
    ]);

    let i = -1, typing = null;

    function paint() {
      const b = beats[i];
      el.innerHTML = `
        ${Bg.layer("career", { month: 0, scrim: "deep" })}
        <div class="cintro">
          <img class="cintro-art" src="${art(S.sprite)}" alt="">
          <div class="cintro-side">
            <div class="cintro-name">${esc(S.racerName)}</div>
            ${b.show === "apt" ? `
              ${UIMeta.aptGrid({ aptitude: apt })}` : ""}
            ${b.show === "legacy" && plan ? `
              <div class="cintro-legacy">
                ${Object.keys(plan.stats).map(k => `<span>${k} +${plan.stats[k]}</span>`).join("")}
                ${plan.unique ? `<span class="hl">${esc(plan.unique.name)}</span>` : ""}
              </div>` : ""}
            ${b.show === "unique" && def.unique ? `
              <div class="cintro-uni">
                <b>${Icon("sparkle")} ${esc(def.unique.name)}</b>
                <i>${esc(def.unique.text || "")}</i>
              </div>` : ""}
            ${b.show === "goal" && goal ? `
              <div class="cintro-goal"><b>Goal</b> ${esc(goal.text)}</div>` : ""}
            ${b.show === "dream" ? `
              <div class="cintro-dream">
                <b>${esc(scn().title)}</b>
                <span>Her whole deck in every race</span>
                <span>A Callout plays the card that is due, free</span>
                <span>Rivals stronger, on decks of their own, and sharper</span>
              </div>` : ""}
          </div>
          <div class="cintro-box ${b.self ? "her" : ""}">
            <div class="coach-name ${b.self ? "her" : ""}">${esc(b.who)}</div>
            <div class="cintro-text" id="ciText"></div>
            <div class="cintro-cta">click to continue</div>
          </div>
          <button class="btn ghost sm cintro-skip" id="ciSkip">Skip</button>
        </div>`;
      typing = FX.typeText(el.querySelector("#ciText"), b.text, {});
      el.querySelector("#ciSkip").onclick = e => { e.stopPropagation(); done(); };
      el.querySelector(".cintro").onclick = () => {
        if (typing && !typing.isDone()) return typing.skip();
        next();
      };
    }
    function next() { i++; if (i >= beats.length) return done(); paint(); }
    next();
  }

  // ---------------------------------------------------------------- parents
  /* Choosing an inheritance line. The preview updates as parents are picked, because
     the whole point is that the strongest two veterans are not automatically the best
     pairing -- affinity decides how much of them actually lands. */
  let pickedParents = [];

  function parentsBuild(el, racerId, scenario) {
    const def = Stable.defOf(racerId);
    const vets = Legacy.veterans();
    pickedParents = pickedParents.filter(id => Legacy.byId(id));
    const plan = pickedParents.length
      ? Legacy.inheritanceFor(def, pickedParents[0], pickedParents[1]) : null;

    el.innerHTML = `
      ${Bg.layer("parents")}
      <div class="scr-wrap">
        ${UIMeta.resourceBar()}
        <div class="panel pop">
          <div class="panel-hd">${Icon("blossom")}Choose an inheritance line</div>
          <div class="par-body">
            <p class="fine">Pick up to two veterans. Their own parents come along with
              them, so a settled line contributes six racers in all. Affinity decides how
              much of it lands &mdash; a matched line beats two strong strangers.</p>

            ${plan ? `
              <div class="par-preview">
                <div class="par-aff">
                  <i>Affinity</i>
                  <span class="affbar"><b style="width:${(plan.affinity * 100).toFixed(0)}%"></b></span>
                  <em>${(plan.affinity * 100).toFixed(0)}%</em>
                  <small>${plan.nodes} veteran${plan.nodes === 1 ? "" : "s"} in the tree</small>
                </div>
                <div class="par-gains">
                  ${Object.keys(plan.stats).length ? `
                    <div class="pg"><i>Starting stats</i><b>${
                      Object.keys(plan.stats).map(k => `${k} +${plan.stats[k]}`).join(", ")}</b></div>` : ""}
                  ${Object.keys(plan.aptitude).length ? `
                    <div class="pg"><i>Aptitude</i><b>${
                      Object.keys(plan.aptitude).map(k =>
                        `${k} ${plan.aptitude[k].from}→${plan.aptitude[k].to}`).join(", ")}</b></div>` : ""}
                  ${plan.unique ? `
                    <div class="pg"><i>Inherited skill</i><b>${esc(plan.unique.name)}</b></div>` : ""}
                  ${Object.keys(plan.hints).length ? `
                    <div class="pg"><i>Skill hints</i><b>${Object.keys(plan.hints).length}</b></div>` : ""}
                  ${!Object.keys(plan.stats).length && !plan.unique
                    ? `<div class="pg"><i>Nothing yet</i><b>these veterans have no sparks to give</b></div>` : ""}
                </div>
              </div>` : `<div class="par-preview empty-pre">
                 <p>No parents selected &mdash; she will run on her own merits.</p></div>`}

            <div class="vet-grid">
              ${vets.map(v => {
                const on = pickedParents.indexOf(v.id) >= 0;
                return `
                <button class="vetcard ${on ? "sel" : ""}" data-vet="${v.id}">
                  <div class="vc-art">${root.Voxel && Voxel.ok && Voxel.bustHTML ? Voxel.bustHTML(v, "", art(v.sprite)) : `<img src="${art(v.sprite)}" alt="">`}</div>
                  <div class="vc-main">
                    <b>${esc(v.name)}</b>
                    <span class="vc-meta"><em class="g${v.grade === "SS" ? "S" : v.grade}">${v.grade}</em>
                      ${num(v.fans)} fans &middot; ${v.wins}W</span>
                    <div class="vc-sparks">
                      ${(v.sparks || []).map(sp => `
                        <span class="spark k${sp.kind}">${esc(sp.label)}
                          <em>${"★".repeat(sp.stars)}</em></span>`).join("")}
                    </div>
                    ${(v.parents || []).length
                      ? `<small class="vc-line">carries ${v.parents.length} ancestor${v.parents.length > 1 ? "s" : ""}</small>`
                      : `<small class="vc-line">first generation</small>`}
                  </div>
                </button>`;
              }).join("")}
            </div>

            <div class="par-actions">
              <button class="btn lg" id="parGo">Begin career${
                pickedParents.length ? ` with ${pickedParents.length} parent${pickedParents.length > 1 ? "s" : ""}` : ""}</button>
              <button class="btn ghost" id="parSkip">Run without inheritance</button>
              <button class="btn ghost sm" id="parBack">Back</button>
            </div>
          </div>
        </div>
      </div>`;

    UIMeta.wireResourceBar(el, () => go("scr-careerpick", pickerBuild));
    el.querySelectorAll("[data-vet]").forEach(b => b.onclick = () => {
      const id = b.dataset.vet, i = pickedParents.indexOf(id);
      if (i >= 0) pickedParents.splice(i, 1);
      else if (pickedParents.length < 2) pickedParents.push(id);
      else pickedParents = [pickedParents[1], id];      // oldest drops off
      parentsBuild(el, racerId, scenario);
    });
    el.querySelector("#parGo").onclick = () =>
      begin(racerId, { parents: pickedParents.slice(), scenario });
    el.querySelector("#parSkip").onclick = () => {
      pickedParents = [];
      begin(racerId, { parents: [], scenario });
    };
    el.querySelector("#parBack").onclick = () => go("scr-careerpick", pickerBuild);
  }

  // ---------------------------------------------------------------- screen
  /* Mood is a five-step meter and a word, not a face emoji: the meter shows how far
     from "Great" she is, which is the thing the player is actually managing. */
  const moodMeter = m => `<span class="moodm m${m}">${[0, 1, 2, 3, 4].map(i =>
    `<i class="${i <= m ? "on" : ""}"></i>`).join("")}</span>`;
  /* Career stats as the real game grades them, on its 1200-and-up scale. */
  const CAREER_GRADES = [[1150, "SS"], [1050, "S+"], [950, "S"], [850, "A+"], [750, "A"], [650, "B+"], [550, "B"],
    [450, "C+"], [350, "C"], [280, "D+"], [220, "D"], [170, "E+"], [120, "E"], [70, "F"], [0, "G"]];
  const careerGrade = v => (CAREER_GRADES.find(([t]) => v >= t) || [0, "G"])[1];
  const STAT_ICON = { speed: "shoe", stamina: "heart", power: "dumbbell", guts: "flame", wit: "bulb" };
  const STAT_NAME = { speed: "Speed", stamina: "Stamina", power: "Power", guts: "Guts", wit: "Wit" };

  function careerBuild(el) {
    if (!S) return Shell.toMenu();
    /* The turn screen's music follows the year -- URA training for the first two, the
       senior theme for the last and the Finale -- and a finished run gets the ending's.
       Builds run before the screen's music is chosen, so this lands in time. */
    if (window.Sound && Sound.setCareerYear)
      Sound.setCareerYear(S.done ? (S.failed ? "failed" : "complete") : Career.turnYear(Math.min(S.turn, 71)));
    if (S.done) return endingBuild(el);

    const finale = Career.finaleRace(S);
    const races = Career.racesOn(S);
    const forced = Career.goalRacesNow(S);
    const goal = Career.currentGoal(S);
    const raceBoard = !!(finale || forced.length || (raceBoardTurn === S.turn && races.length));
    const camp = Career.isSummerCamp(S.turn);
    const pctYear = ((S.turn % 24) / 24 * 100).toFixed(0);

    /* The real game's training screen, in this game's language: the date as a calendar
       block and the goal as a plate across the top, the trainee standing in the middle of
       her own screen with how she feels beside her, the turn's choices as big tiles on the
       right, and the five stats -- graded -- along the bottom. The old screen was a stack
       of white dashboard cards. */
    const [yr, day] = String(Career.turnLabel(S.turn, S)).split(" · ");
    const energyPct = Math.round(S.energy / S.maxEnergy * 100);
    el.innerHTML = `
      ${Bg.layer(raceBoard ? "raceday" : "career", { month: Career.turnMonth(S.turn), time: (S.turn % 2) ? "sunset" : "day",   crowd: raceBoard })}
      <div class="cv career">
        <div class="cv-res">${UIMeta.resourceBar({ back: false })}</div>
        <div class="cv-head pop">
          <div class="car-when cal ${camp ? "camp" : ""} ${scn().fullDeck ? "dream" : ""}">
            <span class="cal-yr">${esc(yr || "")}</span>
            ${scn().fullDeck && S.turn < Career.TRAINING_TURNS ? `<span class="cal-scn">${esc(scn().name)}</span>` : ""}
            <span class="cal-day">${esc(day || yr || "")}</span>
            <span class="cal-turn"><b>${S.turn + 1}</b>/${Career.TOTAL_TURNS}${camp ? " · Summer camp" : ""}</span>
            <span class="cal-bar"><i style="width:${pctYear}%"></i></span>
          </div>
          ${goal ? `<div class="car-goal ${goal.turnsLeft <= 4 ? "urgent" : ""}">
              <span class="gl-lab">Goal</span>
              <span class="gl-txt">${esc(goal.text)}</span>
              <span class="gl-left">${goal.kind === "fans" ? `<em>${num(S.fans)} / ${num(goal.fans)} fans</em>`
                : goal.kind === "g1place" ? `<em>${goal.have} / ${goal.count} done</em>` : ""}<b>${goal.turnsLeft}</b> turn${goal.turnsLeft === 1 ? "" : "s"} left</span>
            </div>` : `<div class="car-goal done"><span class="gl-lab">Goal</span><span class="gl-txt">All goals met. Now win the ${esc(scn().finale)}.</span></div>`}
          <div class="car-tools">
            <button class="btn sm" id="carCal">${Icon("calendar")}Schedule</button>
            <button class="btn ghost sm" id="carQuit">${Icon("door")}Leave</button>
          </div>
        </div>

        <div class="cv-stage">
          <img class="cv-hero" src="${art(S.sprite)}" alt="">
          <div class="cv-cloth"><b>${esc(S.racerName)}</b><i>Lv ${S.level || 1} · ${esc(S.style)}</i></div>
          <div class="car-vitals cv-vitals">
            <div class="vit vit-energy">
              <i>Energy</i>
              <span class="ebar ${S.energy < 40 ? "low" : ""}"><b style="width:${energyPct}%"></b></span>
              <em><b>${S.energy}</b>/${S.maxEnergy}</em>
            </div>
            <div class="vit"><i>Mood</i><em class="mood m${S.mood}">${moodMeter(S.mood)}${Career.moodName(S)}</em></div>
            <div class="vit"><i>Fans</i><em class="num">${num(S.fans)}</em></div>
            <div class="vit skillvit">
              <i>Skill pts</i><em class="num">${num(S.skillPoints)}</em>
              <button class="btn sm gold" id="carSkills">${Icon("star")}Skills${affordable() ? `<span class="badge">${affordable()}</span>` : ""}</button>
            </div>
            ${S.conditions.length ? `<div class="vit conds"><i>Condition</i><em>${
              S.conditions.map(c => esc(Career.condName(c))).join(", ")}</em></div>` : ""}
          </div>
        </div>

        <div class="car-actions cv-board" id="carActions">
          ${finale ? finaleCard(finale)
            : forced.length ? raceDay(forced, true)
            : raceBoardTurn === S.turn && races.length ? raceDay(races, false)
            : trainingBoard(races.length)}
        </div>

        <div class="car-stats cv-stats">
          ${Career.STATS.map(k => {
            const v = S.stats[k], g = careerGrade(v);
            const soft = v >= Career.SOFT_CAP;
            return `<div class="cst" data-stat="${k}">
              <i>${Icon(STAT_ICON[k] || "star")}${STAT_NAME[k] || k}</i>
              <span class="cst-v"><strong class="g g${g[0]}">${g}</strong><em>${v}</em></span>
              <span class="bar"><b class="${soft ? "soft" : ""}" style="width:${(v / Career.STAT_CAP * 100).toFixed(0)}%"></b></span>
            </div>`;
          }).join("")}
        </div>

        ${S.log.length ? `<div class="car-log">${S.log.slice(-4).reverse().map(l =>
          `<span>${esc(l.label)}: ${esc(l.action === "train" ? l.stat + " training" : l.action)}${
            l.failed ? " (failed)" : ""}</span>`).join("")}</div>` : ""}
      </div>`;

    wire(el);
  }

  /** How many skills she could buy right now -- drives the badge on the Skills button. */
  function affordable() {
    if (!S || !root.Skills) return 0;
    const buyable = Skills.shop(S).filter(x => x.afford).length;
    const clearable = Skills.heldDetriments(S)
      .filter(d => S.skillPoints >= d.cost).length;
    return buyable + clearable;
  }

  // ---------------------------------------------------------------- skills
  /* Buying skills costs no turn, which is why this is a screen you step into and back
     out of rather than an action on the board. */
  /* A skill's type as the real game shows it: a coloured chip with a white glyph. A
     skill with no listed type (the gold finishers) gets the gold chip. */
  const skBadge = (t, s) => `<div class="sk-icon" title="${esc(t.name || s.type)}"
    style="--sk:${t.color || "var(--gold)"}">${Icon(t.icon || "starg")}</div>`;

  function skillsBuild(el) {
    if (!S) return Shell.toMenu();
    const shelf = Skills.shop(S);
    const have = Skills.owned(S);
    const bad = Skills.heldDetriments(S);

    el.innerHTML = `
      ${Bg.layer("skills")}
      <div class="scr-wrap">
        <div class="resbar">
          <button class="btn ghost sm" id="skBack">&lsaquo; Back to training</button>
          <div class="res carrot"><span class="ri">${Icon("bulb")}</span><b>${num(S.skillPoints)}</b><i>SP</i></div>
          <div class="res"><span class="ri">${Icon("horseshoe")}</span><b>${esc(S.racerName)}</b></div>
        </div>

        ${bad.length ? `
          <div class="panel pop">
            <div class="panel-hd board">Conditions to shake off</div>
            <div class="skill-list">
              ${bad.map(d => `
                <div class="sk bad">
                  <div class="sk-main"><b>${esc(d.name)}</b><i>${esc(d.text)}</i></div>
                  <div class="sk-buy">
                    <span class="sp">${d.cost} SP</span>
                    <button class="btn sm" data-clear="${d.id}"
                      ${S.skillPoints >= d.cost ? "" : "disabled"}>Clear</button>
                  </div>
                </div>`).join("")}
            </div>
          </div>` : ""}

        <div class="panel pop">
          <div class="panel-hd">${Icon("sparkle")}Skills to learn</div>
          ${shelf.length ? `
            <div class="skill-list">
              ${shelf.map(x => {
                const s = x.skill, t = Skills.TYPES[s.type] || {};
                return `
                <div class="sk ${x.afford ? "" : "poor"} r${s.rarity}">
                  ${skBadge(t, s)}
                  <div class="sk-main">
                    <b>${esc(s.name)}<span class="sk-type">${esc(t.name || s.type)}</span></b>
                    <i>${esc(s.text)}</i>
                    ${x.hints ? `<small class="hintline">${x.hints} hint${x.hints > 1 ? "s" : ""}
                       &middot; ${Math.round(x.discount * 100)}% off</small>` : ""}
                  </div>
                  <div class="sk-buy">
                    <span class="sp ${x.discount ? "sp-cut" : ""}">${x.cost} SP</span>
                    <button class="btn sm ${s.rarity === "gold" ? "gold" : ""}"
                      data-buy="${s.id}" ${x.afford ? "" : "disabled"}>Learn</button>
                  </div>
                </div>`;
              }).join("")}
            </div>` : `
            <div class="empty"><p>Nothing available yet.
              Hints from training and races open new skills up.</p></div>`}
        </div>

        ${have.length ? `
          <div class="panel pop">
            <div class="panel-hd board">Already learned (${have.length})</div>
            <div class="skill-list">
              ${have.map(s => {
                const t = Skills.TYPES[s.type] || {};
                return `<div class="sk known">
                  ${skBadge(t, s)}
                  <div class="sk-main"><b>${esc(s.name)}<span class="sk-type">${esc(t.name || s.type)}</span></b>
                    <i>${esc(s.text)}</i></div>
                </div>`;
              }).join("")}
            </div>
          </div>` : ""}
      </div>`;

    el.querySelector("#skBack").onclick = () => go("scr-career", careerBuild);
    el.querySelectorAll("[data-buy]").forEach(b => b.onclick = () => {
      const r = Skills.buy(S, b.dataset.buy);
      if (!r.ok) return UIMeta.notify(r.error);
      if (!tutorial) persist();
      FX.sparkleOn(b, { count: 14 });
      FX.popNumber(innerWidth / 2, 120, "-" + r.cost + " SP", "#c9a3ff");
      skillsBuild(el);
    });
    el.querySelectorAll("[data-clear]").forEach(b => b.onclick = () => {
      const r = Skills.clearDetriment(S, b.dataset.clear);
      if (!r.ok) return UIMeta.notify(r.error);
      if (!tutorial) persist();
      FX.sparkleOn(b, { count: 12 });
      skillsBuild(el);
    });
  }

  // ---- training ------------------------------------------------------
  /* Which board the turn is showing. Races are a choice on any turn they are on, so the
     board opens on training and "Race instead" swaps it -- for this turn only. */
  let raceBoardTurn = -1;

  function trainingBoard(raceCount) {
    const acts = Career.STATS.map(k => {
      const p = Career.trainPreview(S, k);
      const risky = p.fail > 0.15;
      const gains = Object.keys(p.gains)
        .map(g => `<span>${(STAT_NAME[g] || g).slice(0, 3)}<b>+${p.gains[g]}</b></span>`).join("");
      return `
        <button class="trainbtn ${risky ? "risky" : ""}" data-train="${k}">
          <span class="tb-ic">${Icon(STAT_ICON[k] || "star")}</span>
          <span class="tb-main">
            <span class="tb-head"><b>${Career.TRAIN_LABEL[k]}</b><span class="fac">Lv${p.level}${p.camp ? "!" : ""}</span></span>
            <span class="tb-gain">${gains}</span>
          </span>
          <span class="tb-foot">
            <span class="${p.energy > 0 ? "good" : ""}">${p.energy > 0 ? "+" : ""}${p.energy}<small>energy</small></span>
            ${p.fail > 0.01 ? `<span class="risk">${(p.fail * 100).toFixed(0)}%<small>fail</small></span>` : ""}
          </span>
        </button>`;
    }).join("");

    return `
      <div class="board-head">Training</div>
      <div class="trainrow">${acts}</div>
      <div class="board-head">Or</div>
      <div class="restrow">
        <button class="btn blue" data-act="rest">${Icon("bolt")}<span>Rest<i>+30 to 70 energy</i></span></button>
        <button class="btn pink" data-act="recreation">${Icon("heart")}<span>Recreation<i>lifts mood</i></span></button>
        <button class="btn ghost" data-act="infirmary" ${S.conditions.length ? "" : "disabled"}>
          ${Icon("juice")}<span>Infirmary<i>${S.conditions.length ? "treat a condition" : "nothing to treat"}</i></span></button>
        ${raceCount ? `<button class="btn gold" data-act="races">${Icon("flag")}<span>Race instead<i>${
          raceCount} race${raceCount === 1 ? "" : "s"} this turn</i></span></button>` : ""}
      </div>`;
  }

  // ---- race day ------------------------------------------------------
  /* `forced`: her goal race is on, and she has to run it -- the only turn a race takes
     training away, as in the game. Otherwise it is the turn's other choice. */
  function raceDay(races, forced) {
    return `
      <div class="board-head">${forced ? "Goal race &mdash; she has to run" : "Races this turn"}</div>
      <div class="racelist">
        ${races.map(r => {
          const can = Career.canEnter(S, r);
          const fit = aptOf(r.dist) + aptOf(r.surface);
          const goal = Career.isGoalRace(S, r.id);
          return `
          <button class="racecard g${r.grade.replace(/\W/g, "")} ${can ? "" : "locked"} ${goal ? "goal" : ""}"
                  data-race="${r.id}" ${can ? "" : "disabled"}>
            <div class="rc-grade">${esc(r.grade)}</div>
            <div class="rc-info">
              <b>${esc(r.name)}${goal ? ` <em class="cr-must">goal</em>` : ""}</b>
              <i>${Career.raceMetres(r)}m ${esc(r.surface)} &middot; ${esc(Career.DIST_LABEL[r.dist])}</i>
            </div>
            <div class="rc-pay">
              <span>${Icon("person")} ${num(r.fans)} fans</span>
              ${can ? `<span class="rc-fit f${fit >= 9 ? "3" : fit >= 6 ? "2" : "1"}">${
                fit >= 9 ? "suits her" : fit >= 6 ? "runnable" : "wrong trip"}</span>`
                : `<span class="need">needs ${num(r.need)} fans</span>`}
            </div>
          </button>`;
        }).join("")}
      </div>
      ${forced ? "" : `<div class="restrow">
        <button class="btn ghost" data-act="trainboard">${Icon("back")}<span>Back to training<i>no turn spent</i></span></button>
      </div>`}`;
  }

  const APT_RANK = { S: 6, A: 5, B: 4, C: 3, D: 2, E: 1, F: 0, G: -1 };
  const aptOf = k => {
    const v = APT_RANK[(S.aptitude || {})[k]];
    return v == null ? 3 : v;
  };

  // ---- the finale ----------------------------------------------------
  function finaleCard(r) {
    const won = S.finale.won;
    return `
      <div class="ura ${scn().fullDeck ? "dream" : ""}">
        <div class="ura-steps">
          ${["Qualifier", "Semifinal", "Finals"].map(w => `
            <span class="ustep ${won.includes(w) ? "won" : r.finale === w ? "now" : ""}">${
              esc(Career.stageName(S, w))}</span>`).join("")}
        </div>
        <div class="ura-card">
          <div class="ura-title">${esc(scn().finale.toUpperCase())} &mdash; ${esc(Career.stageName(S, r.finale)).toUpperCase()}</div>
          <div class="ura-sub">${Career.DIST_METRES[r.dist]}m ${esc(r.surface)}
            &middot; chosen from the trips she ran most</div>
          <p>She has to <b>win</b>. Anything else ends the run here.</p>
          <button class="btn gold lg" data-race="__finale">Go to the gate</button>
        </div>
      </div>`;
  }

  // ---------------------------------------------------------------- wiring
  function wire(el) {
    const bar = el.querySelector(".resbar");
    if (bar) UIMeta.wireResourceBar(el);

    const sk = el.querySelector("#carSkills");
    if (sk) sk.onclick = () => go("scr-skills", skillsBuild);

    /* The three years, laid out. A run is meant to be planned, and the training board
       only ever shows the turn you are standing on. */
    const cal = el.querySelector("#carCal");
    if (cal) cal.onclick = () => go("scr-schedule", scheduleBuild);

    el.querySelector("#carQuit").onclick = async () => {
      const ok = await UIMeta.ask({ title: tutorial ? "End the demonstration" : "Leave this career",
        message: tutorial ? "End the tutorial career?"
                          : "Leave this career for now?",
        detail: tutorial ? "Nothing here is saved anyway."
                         : "It is saved — you can pick it up again from the menu.",
        confirm: tutorial ? "End it" : "Leave" });
      if (!ok) return;
      if (tutorial) { S = null; tutorial = false; return Shell.toMenu(); }
      persist(); S = null; Shell.toMenu();
    };

    el.querySelectorAll("[data-train]").forEach(b => b.onclick = () => {
      const before = snapshot();
      const res = Career.train(S, b.dataset.train);
      if (!res.ok) return;
      if (!tutorial) Quests.record("train");
      if (root.Tutorials) Tutorials.notify("trained");
      afterTurn(el, res, before);
    });

    el.querySelectorAll("[data-act]").forEach(b => b.onclick = () => {
      const a = b.dataset.act;
      const before = snapshot();
      // swapping boards spends nothing: the turn is still hers to use
      if (a === "races") { raceBoardTurn = S.turn; return careerBuild(el); }
      if (a === "trainboard") { raceBoardTurn = -1; return careerBuild(el); }
      const res = Career[a](S);
      if (!res || !res.ok) return;
      afterTurn(el, res, before);
    });

    el.querySelectorAll("[data-race]").forEach(b => b.onclick = () => {
      const id = b.dataset.race;
      const race = id === "__finale" ? Career.finaleRace(S)
                                     : Career.racesOn(S).find(r => r.id === id);
      if (race) runRace(race);
    });
  }

  /** Show what the turn paid, then redraw. `before` is the pre-action snapshot. */
  async function afterTurn(el, res, before) {
    if (!tutorial) persist();
    if (res && res.gains) {
      const box = el.querySelector("#carActions");
      const r = box ? box.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2 };
      let i = 0;
      for (const k in res.gains) {
        const v = res.gains[k];
        FX.popNumber(r.left + 90 + i * 90, r.top + 20,
                     (v > 0 ? "+" : "") + v + " " + k.slice(0, 3),
                     v > 0 ? "#7fe07f" : "#ff8a8a");
        i++;
      }
    }
    if (res && res.failed) FX.shake(240, 5);
    if (res && res.facilityUp) FX.confetti({ count: 40 });
    checkCareerAwards();

    /* Anything worth stopping for -- a year turning, a goal clearing, the Finale --
       plays before the board comes back, so the board never quietly changes underneath
       the player. */
    if (before) collectMoments(before);
    if (momentQueue.length) { await playMoments(); }

    /* Inspiration: the family tree activates again partway through the run, not only at
       the gate. Fires at the start of Classic and Senior year. */
    if (root.Legacy && Legacy.inspirationAt(S.turn) && S.legacy && S.inspirationsLeft) {
      const got = Legacy.inspire(S, Stable.defOf(S.racerId));
      if (got) {
        if (!tutorial) persist();
        FX.confetti({ count: 70 });
        return go("scr-career", e2 => inspirationBuild(e2, got));
      }
    }
    careerBuild(el);
    react(el, res);
  }

  /* The board is a wall of numbers, so the ones that just changed say so, and she reacts
     to how the session went. Small, but it is the most repeated action in the mode. */
  function react(el, res) {
    if (!res) return;
    const who = el.querySelector(".car-who img");
    if (who) {
      who.classList.remove("good", "bad");
      void who.offsetWidth;                       // restart the animation
      who.classList.add(res.failed ? "bad" : "good");
    }
    if (res.gains) {
      for (const k in res.gains) {
        const row = el.querySelector('.cst[data-stat="' + k + '"]');
        if (!row) continue;
        row.classList.add(res.gains[k] < 0 ? "lost" : "bumped");
      }
    }
    if (res.facilityUp) {
      const t = el.querySelector('.trainbtn[data-train="' + res.stat + '"] .fac');
      if (t) t.classList.add("levelled");
    }
  }

  function checkCareerAwards() {
    if (tutorial) return;
    const best = Math.max(...Career.STATS.map(k => S.stats[k]));
    const got = Quests.record("careerTick", { stat: best, fans: S.fans });
    if (Career.turnYear(S.turn) >= 1) Quests.record("classic");
    if (S.turn >= Career.TRAINING_TURNS && scn().id === "ura") Quests.record("ura");
    if (got && got.awards && got.awards.length) UIMeta.toastAwards(got.awards);
  }

  /* Inspiration gets its own beat rather than a line in the log -- it is the family
     tree paying out, and the player chose that tree. */
  function inspirationBuild(el, got) {
    el.innerHTML = `
      ${Bg.layer("inspiration")}
      <div class="scr-wrap">
        <div class="panel pop insp-panel">
          <div class="panel-hd gold">${Icon("star")}Inspiration</div>
          <div class="insp-body">
            <p>Something from her bloodline surfaces &mdash; ${esc(S.racerName)} feels
               the run her ancestors made.</p>
            <div class="insp-gains">
              ${Object.keys(got.stats).map(k =>
                `<div><i>${k}</i><b>+${got.stats[k]}</b></div>`).join("")}
              ${got.skillPoints ? `<div><i>Skill points</i><b>+${got.skillPoints}</b></div>` : ""}
            </div>
            ${got.hints.length ? `<p class="fine">Hint gained:
              <b>${got.hints.map(h => esc(h.skill.name)).join(", ")}</b></p>` : ""}
            <button class="btn lg" id="inspGo">Back to training</button>
          </div>
        </div>
      </div>`;
    el.querySelector("#inspGo").onclick = () => go("scr-career", careerBuild);
  }

  // ---------------------------------------------------------------- the calendar
  /* Three years of fixtures, laid out so a run can be PLANNED rather than discovered a
     turn at a time. The screen the training board never was: every race that exists, what
     it asks for, whether she can enter it, and how well it suits her -- next to the goals
     that decide whether the run survives.

     Everything here is read from Career.RACE_CAL and Career.GOALS. There is no second
     copy of the schedule. */
  /* `aptOf` is defined with the training board above -- one grade scale, not two. */
  const raceFit = r => (r.adaptive ? 12 : aptOf(r.dist) + aptOf(r.surface));

  let scheduleAll = false;

  function scheduleBuild(el) {
    if (!S) return go("scr-menu", Shell.menuBuild);

    const ran = {};
    for (const h of S.raceHistory || []) ran[h.id] = h.placing;
    const goals = Career.goalStatus(S);
    const goalRaces = {};
    for (const g of goals) for (const id of g.races || []) goalRaces[id] = g;

    /* The real calendar runs to 200-odd races, so this opens on the ones that matter to
       her -- her goals, the G1s, and whatever suits her -- with the full card a click away. */
    const cal = Career.calOf(S).map(r => Career.resolveRace(S, r));
    const forHer = r => goalRaces[r.id] || r.adaptive || ran[r.id] || r.grade === "G1" || raceFit(r) >= 9;
    const shown = cal.filter(r => scheduleAll || forHer(r));

    /* One row per race turn, in order, plus the finale at the end. */
    const turns = [...new Set(shown.map(r => r.turn))].sort((a, b) => a - b);

    const yearOf = t => Career.turnYear(t);
    let lastYear = -1;
    const rows = [];

    /* Most turns are training turns, so `S.turn` usually is not a race turn at all. The
       marker has to answer "where am I in this?", which means the next fixture she can
       still reach, not an exact match that is only true one turn in four. */
    const nextTurn = turns.find(t => t >= S.turn);

    for (const t of turns) {
      const y = yearOf(t);
      if (y !== lastYear) {
        lastYear = y;
        const goalsHere = goals.filter(g => Career.turnYear(g.by) === y);
        rows.push(`
          <div class="cal-year">
            <span class="cy-name">${esc(Career.YEARS[y] || "Year " + (y + 1))}</span>
            ${goalsHere.map(g => `<span class="cy-goal ${g.met ? "met" : g.overdue ? "late" : ""}">
              ${g.met ? Icon("check") : ""}${esc(g.text)}</span>`).join("")}
          </div>`);
      }

      const here = shown.filter(r => r.turn === t);
      const isNow = t === nextTurn;
      const exactly = t === S.turn;
      const past = t < S.turn;
      rows.push(`
        <div class="cal-turn ${isNow ? "now" : ""} ${past ? "past" : ""}">
          <div class="ct-when">
            <b>${esc(Career.turnLabel(t, S).split(" · ").pop())}</b>
            <i>turn ${t + 1}</i>
            ${isNow ? `<span class="ct-tag">${exactly ? "race day" : "next up"}</span>` : ""}
          </div>
          <div class="ct-races">
            ${here.map(r => {
              const goal = goalRaces[r.id];
              const placed = ran[r.id];
              const canEnter = !past && Career.canEnter(S, r);
              const fit = raceFit(r);
              const fitTxt = r.adaptive ? "runs at her best trip"
                : fit >= 9 ? "suits her" : fit >= 6 ? "runnable" : "wrong trip";
              const fitCls = r.adaptive ? "f3" : fit >= 9 ? "f3" : fit >= 6 ? "f2" : "f1";
              return `
              <div class="calrace ${placed ? "done" : ""} ${goal ? "goal" : ""}">
                <span class="cr-grade g${esc(String(r.grade).replace(/\W/g, ""))}">${esc(r.grade)}</span>
                <span class="cr-main">
                  <b>${esc(r.name)}${goal ? ` <em class="cr-must">goal</em>` : ""}</b>
                  <i>${Career.raceMetres(r)}m ${esc(r.surface)} · ${esc(Career.DIST_LABEL[r.dist])}${
                     r.adaptive ? " · her debut" : ""}</i>
                </span>
                <span class="cr-pay">${Icon("person")}${num(r.fans)}</span>
                <span class="cr-note ${placed ? "ok" : canEnter ? fitCls : "lock"}">${
                  placed ? (placed === 1 ? "won" : placed + ord(placed))
                  : past ? "missed"
                  : goal ? (goal.place >= 18 ? "run in it" : goal.place === 1 ? "must win" : "top " + goal.place)
                  : r.need && S.fans < r.need ? "needs " + num(r.need) + " fans"
                  : fitTxt}</span>
              </div>`;
            }).join("")}
          </div>
        </div>`);
    }

    /* The finale is not in RACE_CAL -- it is generated per run -- so it is described from
       the same source the run itself uses. */
    const finTurns = [];
    for (let t = Career.TRAINING_TURNS; t < Career.TOTAL_TURNS; t++) {
      const which = Career.finaleRaceAt(t);
      if (which) finTurns.push({ t, which });
    }
    const dream = scn().fullDeck;
    rows.push(`
      <div class="cal-year finale ${dream ? "dream" : ""}"><span class="cy-name">${esc(scn().finale)}</span>
        <span class="cy-goal">Win all three</span>
        ${dream ? `<span class="cy-goal">Whole decks &middot; the strongest field there is</span>` : ""}</div>`);
    for (const f of finTurns) {
      const won = (S.finale && S.finale.won || []).indexOf(f.which) >= 0;
      const stage = Career.stageName(S, f.which);
      rows.push(`
        <div class="cal-turn ${S.turn === f.t ? "now" : ""} ${S.turn > f.t ? "past" : ""}">
          <div class="ct-when"><b>${esc(stage)}</b><i>turn ${f.t + 1}</i>
            ${S.turn === f.t ? `<span class="ct-tag">you are here</span>` : ""}</div>
          <div class="ct-races">
            <div class="calrace ${won ? "done" : ""} goal">
              <span class="cr-grade gG1">G1</span>
              <span class="cr-main"><b>${esc(scn().finale)} ${esc(stage)}
                <em class="cr-must">must win</em></b>
                <i>${Career.DIST_METRES[Career.finaleDistance(S)]}m ${esc(Career.finaleSurface(S))}
                   · chosen from the trips she ran most</i></span>
              <span class="cr-pay">${Icon("person")}${num(scn().finaleFans[f.which])}</span>
              <span class="cr-note ${won ? "ok" : "f1"}">${won ? "won" : "must win"}</span>
            </div>
          </div>
        </div>`);
    }

    el.innerHTML = `
      ${Bg.layer("career", { turn: S.turn })}
      <div class="scr-wrap">
        <div class="panel pop">
          <div class="panel-hd">${Icon("calendar")}Career schedule</div>
          <p class="cal-lead">The real three years, race by race. Her <b>goals</b> are what the
             run is judged on &mdash; miss one and it ends there &mdash; and everything else is
             yours to choose. Plan the trips she is being built for, then train toward them.</p>
          <div class="cal-filter">
            <button class="btn sm ${scheduleAll ? "ghost" : ""}" data-cal="her">Races for her</button>
            <button class="btn sm ${scheduleAll ? "" : "ghost"}" data-cal="all">All races (${cal.length})</button>
          </div>
          <div class="cal-list">${rows.join("")}</div>
          <div class="deck-acts">
            <span class="spacer"></span>
            <button class="btn" id="calBack">Back to training</button>
          </div>
        </div>
      </div>`;

    el.querySelector("#calBack").onclick = () => go("scr-career", careerBuild);
    el.querySelectorAll("[data-cal]").forEach(b => b.onclick = () => {
      scheduleAll = b.dataset.cal === "all";
      scheduleBuild(el);
    });
    /* Open on the turn she is actually on, rather than at January of Junior year. */
    const now = el.querySelector(".cal-turn.now");
    if (now) setTimeout(() => now.scrollIntoView({ block: "center" }), 60);
  }

  // ---------------------------------------------------------------- races
  /* The race itself is the ordinary simulation. Career mode hands it a field and gets
     back a placing -- it does not have a race engine of its own. */
  function runRace(race) {
    const setup = Career.raceSetup(S, race, Stable.ROSTER);
    const deck = deckFor();
    Game.startCareerRace({
      field: setup.field, course: setup.course, deck, rules: setup.rules,
      label: race.finale ? scn().finale : race.grade,
      onDone(placing, fieldSize, board) {
        const isFinale = !!race.finale;
        const res = isFinale ? Career.applyFinaleResult(S, race, placing, fieldSize)
                             : Career.applyRaceResult(S, race, placing, fieldSize);
        /* Every race turn has to be passed, the finale's included. `applyFinaleResult`
           records the win but does not move the calendar, and `finaleRace` answers for
           whatever turn we are on -- so skipping this re-offered the same Qualifier
           after winning it, forever. A run that just ended (a Finals win, or any loss)
           has nowhere left to advance to. */
        if (!S.done) Career.passTurn(S);
        if (!tutorial) {
          Quests.record(placing === 1 ? "raceWin" : "race",
                        { style: S.style, dist: race.dist });
          if (placing === 1 && race.grade === "G1") Quests.record("g1Win");
          if (isFinale && placing === 1 && scn().id === "ura") Quests.record("uraWin");
          persist();
        }
        /* No music request: Sound.raceFinish is mid-sequence -- fanfare now, result
           music in a couple of seconds -- and asking this screen for career music would
           cut the fanfare off after a second. */
        go("scr-career", el => raceResult(el, race, placing, fieldSize, res, board),
           { music: null });
      },
    });
  }

  /** The deck she races with: the one equipped to her, else whatever she owns. */
  function deckFor() {
    /* Named decks are the real answer now -- equip one to her on the Decks screen and she
       takes it to every race in the run. The fallbacks below only cover a trainee who has
       never been given one, so a career is never raced with an empty hand. */
    const equipped = Stable.deckForRacer(S.racerId);
    let ids = equipped ? equipped.cards.slice() : null;

    if (!ids) {
      // no deck of her own: the cheapest cards she owns, so she is never empty
      ids = Stable.ownedCards().sort((a, b) => a.cost - b.cost)
              .slice(0, Racers.DECK_SIZE).map(c => c.id);
    }
    const deck = ids.map(id => Cards.byId[id]).filter(Boolean);
    return deck.length ? deck : Cards.CARDS.slice(0, Racers.DECK_SIZE);
  }

  /* The board the race hands back. Career mode used to throw it away and print one
     number, which read as "WIN / of 8" -- a placing with nothing to place her against.
     Now the whole field is listed the way the exhibition result already listed it.
     Stamina is deliberately NOT a column: the sim is fast-forwarded to the last finisher
     before the board is taken, so by then almost everyone reads as empty and the column
     says "spent" down the whole field regardless of how the race actually went. */
  function finishBoard(board) {
    if (!board || !board.length) return "";
    return `
      <table class="res-board"><thead><tr>
        <th>#</th><th>Racer</th><th>Style</th><th>Time</th><th>Margin</th>
      </tr></thead><tbody>
      ${board.map(b => `
        <tr class="${b.me ? "me" : ""}">
          <td class="rk"><span class="pl p${b.rank <= 3 ? b.rank : "n"}">${b.rank}</span></td>
          <td class="nm">${b.sprite ? root.Voxel && Voxel.ok && Voxel.bustHTML ? Voxel.bustHTML(b, "", art(b.sprite)) : `<img src="${art(b.sprite)}" alt="">` : ""}
            <span>${esc(b.name)}</span>${b.me ? ` <i class="you">you</i>` : ""}</td>
          <td>${esc(b.style || "")}</td>
          <td>${b.time == null ? "&mdash;" : b.time.toFixed(2) + "s"}</td>
          <td>${b.margin == null ? (b.rank === 1 ? "&mdash;" : "") : "+" + b.margin.toFixed(2)}</td>
        </tr>`).join("")}
      </tbody></table>`;
  }

  function raceResult(el, race, placing, fieldSize, res, board) {
    const won = placing === 1;
    el.innerHTML = `
      ${Bg.layer("result", { crowd: true })}
      <div class="scr-wrap">
        <div class="panel pop res-panel">
          <div class="panel-hd ${won ? "gold" : ""}"><span class="cr-grade g${
            esc(String(race.finale ? "G1" : race.grade).replace(/\W/g, ""))}">${esc(race.finale ? "G1" : race.grade)}</span>${
            esc(race.name)}</div>
          <div class="res-body">
            <div class="res-top">
              <div class="res-place ${won ? "win" : ""}">${placing}<small>${ord(placing)}</small></div>
              <div class="res-of"><b>${esc(S.racerName)}</b>${won ? `won, ${fieldSize} ran`
                : `finished ${placing}${ord(placing)} of ${fieldSize}`}</div>
              <div class="res-gains">
                <div><i>Fans</i><b>+${num(res.fans)}</b></div>
                <div><i>Skill pts</i><b>+${num(res.skillPoints)}</b></div>
                ${res.allStats ? `<div><i>All stats</i><b>+${res.allStats}</b></div>` : ""}
              </div>
            </div>
            ${finishBoard(board)}
            ${race.finale && !won
              ? `<p class="res-note bad">She had to win to go through. The run ends here.</p>`
              : race.finale && race.finale === "Finals"
              ? `<p class="res-note good">${esc(scn().finale)} champion.</p>` : ""}
            <div class="res-go"><button class="btn lg" id="resGo">Continue</button></div>
          </div>
        </div>
      </div>`;
    if (won) { FX.confetti({ count: 120 }); FX.shake(420, 8); }
    el.querySelector("#resGo").onclick = () => {
      // how a career ends has its own music: the run complete, or the goal missed
      if (S.done) return go("scr-career", endingBuild, { music: S.failed ? "career_failed" : "career_complete" });
      go("scr-career", careerBuild);
    };
  }

  // ---------------------------------------------------------------- ending
  /* The payoff for seventy-eight turns. The grade used to simply be present on a panel;
     now it is arrived at -- a wind-up, then the letter lands. A failed run gets the same
     structure without the celebration, because it still took the same three years. */
  function gradeReveal(v, champion, failed) {
    return new Promise(resolve => {
      const el = document.createElement("div");
      el.className = "greveal g" + v.grade + (champion ? " champ" : "") + (failed ? " failed" : "");
      el.innerHTML =
        '<div class="gr-rays"></div>' +
        `<img class="gr-art" src="${art(S.sprite)}" alt="">` +
        '<div class="gr-body">' +
          `<div class="gr-kicker">${failed ? "The run ends here" : "Three years" +
            (scn().fullDeck ? " · " + esc(scn().name) : "")}</div>` +
          `<div class="gr-name">${esc(S.racerName)}</div>` +
          '<div class="gr-ring"></div>' +
          `<div class="gr-grade">${esc(v.grade)}</div>` +
          `<div class="gr-rating">${num(v.rating)} rating</div>` +
          (champion ? `<div class="gr-champ ${scn().fullDeck ? "dream" : ""}">${esc(scn().finale)} champion</div>` : "") +
        '</div>' +
        '<div class="gr-skip">click to continue</div>';
      document.body.appendChild(el);
      requestAnimationFrame(() => el.classList.add("in"));

      const big = champion || v.grade === "SS" || v.grade === "S";
      const land = setTimeout(() => {
        el.classList.add("landed");
        if (!failed) {
          FX.shake(big ? 460 : 240, big ? 10 : 5);
          FX.confetti({ count: big ? 200 : 80 });
        }
      }, 1500);

      let done = false;
      const close = () => {
        if (done) return;
        done = true;
        clearTimeout(land); clearTimeout(auto);
        el.classList.add("out");
        setTimeout(() => { el.remove(); resolve(); }, 460);
      };
      el.onclick = close;
      const auto = setTimeout(close, failed ? 3200 : 4200);
    });
  }

  /** Bring the results panel in a section at a time, with the numbers arriving. */
  function animateEnding(el, v, carrots) {
    el.querySelectorAll(".end-side > *").forEach((n, i) => {
      n.classList.add("es");
      setTimeout(() => n.classList.add("in"), 90 * i);
    });
    UIMeta.countUp(el.querySelector(".count-rating"), v.rating, 900);
    UIMeta.countUp(el.querySelector(".count-fans"), v.fans, 1000);
    if (carrots) UIMeta.countUp(el.querySelector(".count-carrots"), carrots, 800);
    // sparks are the reason to finish a bad run, so they arrive one at a time
    el.querySelectorAll(".sparks .spark").forEach((sp, i) => {
      sp.classList.add("pending");
      setTimeout(() => {
        sp.classList.remove("pending");
        FX.sparkleOn(sp, { count: 6, spread: 22 });
      }, 700 + 220 * i);
    });
  }

  async function endingBuild(el) {
    const v = Career.veteran(S);
    const champion = v.ending === "champion";
    const failed = v.ending === "failed";

    // once per run: re-entering this screen must not replay it
    if (!S.gradeShown) { S.gradeShown = true; await gradeReveal(v, champion, failed); }

    /* Payouts happen once, here, and only for a real run. A tutorial career is a
       demonstration -- it must not touch the stable. */
    /* What the run pays is Career.payout's -- carrots by ending, the Dream Trophy's prize
       money for every win and its haul of items -- so the screen and validate-career
       agree on it. Kept on the state, so coming back to this screen shows it again. */
    const dream = scn().fullDeck;
    let unlocked = [], xp = null, vet = null;
    if (!tutorial && !S.paidOut) {
      S.paidOut = true;
      const pay = S.paid = Career.payout(S);
      if (!failed) {
        unlocked = Stable.unlockFrom(S.racerId);
        if (pay.xp) xp = Stable.addXp(S.racerId, pay.xp);
        /* The run itself becomes an inheritance resource. This is what makes a career
           worth finishing even when the racing went badly. */
        vet = Legacy.addVeteran(S, Stable.defOf(S.racerId),
                                (S.legacy && S.legacy.parents) || []);
      }
      Stable.grant(pay.carrots);
      for (const id in pay.items) Stable.addItem(id, pay.items[id]);
      Quests.record("careerEnd", { rating: v.rating, grade: v.grade, fans: v.fans });
      if (champion) {
        // URA Finale's awards count URA Finale wins; the Dream Trophy has its own
        const got = Quests.record(dream ? "dreamChampion" : "champion");
        if (got.awards && got.awards.length) UIMeta.toastAwards(got.awards);
      }
      clearSaved();
      FX.confetti({ count: champion ? (dream ? 320 : 200) : 80 });
    }
    const pay = S.paid || { carrots: 0, prize: 0, items: {} };
    const carrots = pay.carrots;

    el.innerHTML = `
      ${Bg.layer(champion ? "ending" : "result")}
      <div class="scr-wrap">
        <div class="panel pop end-panel ${dream ? "dream" : ""}">
          <div class="panel-hd ${champion ? (dream ? "board" : "gold") : failed ? "board" : ""}">
            ${Icon(champion ? "crown" : failed ? "flag" : "trophy")}${
              champion ? esc(scn().finale) + " champion" : failed ? "Career ended"
                : dream ? "Dream Trophy complete" : "Career complete"}</div>
          <div class="end-body">
            <img class="end-art float-y" src="${art(S.sprite)}" alt="">
            <div class="end-side">
              <div class="end-id">
                <div class="end-grade g${v.grade}">${v.grade}</div>
                <div><h2>${esc(S.racerName)}</h2><span class="end-sub">${
                  failed ? "Three years, cut short" : "Three years, done"}</span></div>
              </div>
              ${failed ? `<p class="bad">Failed: ${esc(S.failed || "a goal was missed")}</p>` : ""}
              ${tutorial ? `<p class="fine">Tutorial run &mdash; nothing here is saved to your stable.</p>` : ""}
              <div class="end-stats">
                ${Career.STATS.map(k => {
                  const g = careerGrade(S.stats[k]);
                  return `<div><i>${Icon(STAT_ICON[k] || "star")}${STAT_NAME[k] || k}</i>
                    <b>${S.stats[k]}<span class="g g${g[0]}">${g}</span></b></div>`; }).join("")}
              </div>
              <div class="end-lines">
                <div><i>Rating</i><b class="count-rating">0</b></div>
                <div><i>Fans</i><b class="count-fans">0</b></div>
                <div><i>Races won</i><b>${v.wins} of ${v.races}</b></div>
                ${v.finale.length ? `<div><i>Finale</i><b>${v.finale.map(w => esc(Career.stageName(S, w))).join(", ")}</b></div>` : ""}
              </div>
              ${!tutorial ? `
                <div class="end-rewards">
                  <div><i>Carrots</i><b>+<span class="count-carrots">0</span></b>${
                    pay.prize ? `<small>${num(pay.prize)} of it prize money</small>` : ""}</div>
                  ${Object.keys(pay.items).map(id => {
                    const it = Stable.itemDef(id) || { name: id };
                    return `<div><i>${esc(it.name)}</i><b>&times;${pay.items[id]}</b></div>`; }).join("")}
                  ${xp ? `<div><i>${esc(S.racerName)}</i><b>Lv ${xp.level}</b></div>` : ""}
                </div>
                ${vet && vet.sparks.length ? `
                  <div class="end-unlocks sparkbox">
                    <b>Sparks &mdash; she can be inherited from now</b>
                    <div class="sparks">${vet.sparks.map(sp => `
                      <span class="spark k${sp.kind}">
                        <i>${Legacy.SPARK_NAME[sp.kind]}</i>
                        ${esc(sp.label)} <em>${"★".repeat(sp.stars)}</em></span>`).join("")}</div>
                  </div>` : ""}
                ${unlocked.length ? `
                  <div class="end-unlocks">
                    <b>New racers in the scout</b>
                    <div class="ulist">${unlocked.map(d => `
                      <span class="ul">${root.Voxel && Voxel.ok && Voxel.bustHTML ? Voxel.bustHTML(d, "", art(d.sprite)) : `<img src="${art(d.sprite)}" alt="">`}${esc(d.name)}</span>`).join("")}</div>
                  </div>` : (!failed ? `<p class="fine">No new racers from this line &mdash;
                     her branch of the roster is already open.</p>` : "")}
              ` : ""}
              <button class="btn lg" id="endGo">Done</button>
            </div>
          </div>
        </div>
      </div>`;

    animateEnding(el, v, tutorial ? 0 : carrots);

    el.querySelector("#endGo").onclick = () => {
      const wasTutorial = tutorial;
      S = null; tutorial = false;
      if (wasTutorial && root.UITutorial) return UITutorial.finishCareerTutorial();
      Shell.toMenu();
    };
  }

  // ---------------------------------------------------------------- picker
  /** Choosing who to run a career with -- only racers the player actually owns. */
  /* What each scenario is, side by side, so the choice is made knowing the price and the
     prize. Every number is read from Career.SCENARIOS and Stable.STAMINA. */
  function scenarioCard(id, on) {
    const c = Career.SCENARIOS[id], pay = c.pay;
    const items = pay.items.champion ? Object.keys(pay.items.champion).map(k =>
      `${(Stable.itemDef(k) || { name: k }).name} ×${pay.items.champion[k]}`) : [];
    return `
      <button class="scn s-${id} ${on ? "sel" : ""}" data-scn="${id}" aria-pressed="${on}">
        <span class="scn-hd">${esc(c.title.split(": ")[0])}</span>
        <span class="scn-name">${esc(c.name)}</span>
        <span class="scn-blurb">${esc(c.blurb)}</span>
        <span class="scn-facts">
          <span><i>Races</i>${c.fullDeck ? "Whole deck in reach, Callout plays the card that is due"
                                         : `Draw ${Racers.ACTIVE_SIZE} of ${Racers.DECK_SIZE}, Callout redraws`}</span>
          <span><i>Rivals</i>${c.fullDeck ? `${Math.round((c.field - 1) * 100)}% stronger, own decks, sharper`
                                          : "Share her deck"}</span>
          <span><i>Champion</i>${num(pay.carrots.champion)} carrots${items.length ? ", " + items.join(", ") : ""}${
            pay.prize ? ", prize money for every win" : ""}</span>
          <span><i>Costs</i>${staminaFor(id)} stamina</span>
        </span>
      </button>`;
  }

  function pickerBuild(el) {
    const owned = Stable.ownedRacers();
    const run = saved();
    const sel = pickedScenario();
    el.innerHTML = `
      ${Bg.layer("career")}
      <div class="scr-wrap">
        ${UIMeta.resourceBar()}
        <div class="panel pop">
          <div class="panel-hd">${Icon("trophy")}Career</div>
          <div class="pick-body">
            ${run ? `
              <div class="resume-box">
                <b>Career in progress</b>
                <span>${esc((Stable.defOf(run.racerId) || {}).name || "")} &middot;
                      ${esc(Career.scenarioOf(run).name)} &middot; ${esc(Career.turnLabel(run.turn, run))}</span>
                <button class="btn gold" id="carResume">Continue</button>
              </div>` : ""}
            <div class="scn-pick">
              ${Object.keys(Career.SCENARIOS).map(id => scenarioCard(id, id === sel)).join("")}
            </div>
            <p class="fine">A ${esc(Career.scenarioOf(sel).name)} run costs ${staminaFor(sel)} stamina.
               Finishing one unlocks the next racers in her line for the scout,
               and leaves behind a veteran your future trainees can inherit from.${
               Career.scenarioOf(sel).fullDeck ? ` Bring her best deck: on a starter's, the
               Dream Trophy is very nearly out of reach.` : ""}</p>
            ${root.Legacy && Legacy.veterans().length ? `
              <div class="legacy-note">
                <b>${Legacy.veterans().length} veteran${Legacy.veterans().length === 1 ? "" : "s"}
                   in your records.</b>
                <span>You will choose an inheritance line after picking a racer.</span>
              </div>` : ""}
            ${owned.length ? `
              <div class="stable-grid">
                ${owned.map(d => {
                  const sv = Stable.saveFor(d.id);
                  const next = (Stable.UNLOCKS[d.id] || []).filter(x => !Stable.isUnlocked(x));
                  return `
                  <button class="rcard" data-start="${d.id}">
                    <div class="rc-art"><img src="${art(Stable.spriteFor(d.id))}" alt=""></div>
                    <div class="rc-name">${esc(d.name)}</div>
                    <div class="rc-meta"><span class="lv">Lv ${sv.level}</span>
                      <span class="stars">${"★".repeat(d.rarity || 1)}</span></div>
                    <div class="rc-unlock">${next.length
                      ? `unlocks ${next.length}` : "line open"}</div>
                  </button>`;
                }).join("")}
              </div>` : `
              <div class="empty">
                <p>Career mode needs a racer of your own.</p>
                <button class="btn" id="pickScout">Go to the Scout</button>
              </div>`}
          </div>
        </div>
      </div>`;
    UIMeta.wireResourceBar(el);
    const rs = el.querySelector("#carResume");
    if (rs) rs.onclick = () => resume();
    const ps = el.querySelector("#pickScout");
    if (ps) ps.onclick = () => go("scr-scout", UIMeta.scoutBuild);
    el.querySelectorAll("[data-scn]").forEach(b => b.onclick = () => {
      setPickedScenario(b.dataset.scn);
      pickerBuild(el);
    });
    el.querySelectorAll("[data-start]").forEach(b =>
      b.onclick = () => begin(b.dataset.start, { scenario: pickedScenario() }));
  }

  /** Drop a demonstration career without saving or paying out anything. */
  function abandonTutorial() {
    if (!tutorial) return false;
    S = null; tutorial = false;
    return true;
  }

  const api = { begin, resume, hasRun, pickerBuild, careerBuild, endingBuild, skillsBuild,
                scheduleBuild,
                parentsBuild, inspirationBuild, abandonTutorial,
                get state() { return S; },
                get isTutorial() { return tutorial; } };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.UICareer = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
