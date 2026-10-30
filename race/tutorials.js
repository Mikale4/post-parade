/*
 * The guided tutorials: scouting, deck building, and a full career walkthrough.
 *
 * shell.js owns the in-race tutorial, which is welded to the race view. This is the
 * general version: a coach that can drive ANY screen, navigate between them, spotlight
 * an element, and wait either for a click or for a named event.
 *
 * A step is:
 *   { text, spot, wait, enter, timeout, last }
 *     enter    runs before the step -- this is where a step changes screen
 *     spot     CSS selector to ring; re-measured on resize
 *     wait     "click", or an event name passed to Tutorials.notify()
 *     timeout  ms before an event-gated step gives up and moves on, so a tutorial can
 *              never strand the player waiting for something that will not happen
 *
 * The career tutorial runs on a racer the player does NOT own and pays out nothing to
 * the stable -- it is a demonstration. The only reward is the tutorial's own carrots.
 *
 * Exposes Tutorials.
 */
(function (root) {
  "use strict";

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"]/g,
    c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  let run = null;          // { id, i, steps, done, typing, timer }

  // ---------------------------------------------------------------- scripts
  /* Each script assumes nothing about where the player was: the first step navigates. */
  const SCRIPTS = {

    // ------------------------------------------------------------ scouting
    scout: {
      name: "Scouting",
      steps: [
        { enter: () => Shell.go("scr-scout", UIMeta.scoutBuild),
          text: "Every racer and every card in this game is recruited. You start with " +
                "one racer and five cards, and everything else comes through here.",
          wait: "click" },
        { text: "Carrots are the currency. You earn them from races, careers, quests and " +
                "awards — and you spend them here.",
          spot: ".res.carrot", wait: "click" },
        { text: "Two scouts. Cards first: every card in the game can turn up. A second " +
                "copy is not wasted — it lets you run that card twice in the same fifteen.",
          spot: ".scout-tabs", wait: "click" },
        { text: "A ten-scout costs the price of nine and guarantees at least one Rare " +
                "or better. If you are saving, save for that.",
          spot: ".scout-actions", wait: "click" },
        { text: "Now the racer scout. This is the important rule: it only ever offers " +
                "racers you have UNLOCKED.",
          enter: () => { const t = $('[data-tab="racer"]'); if (t) t.click(); },
          spot: ".scout-tabs", wait: "click" },
        { text: "You unlock racers by finishing careers. Complete a run with someone and " +
                "the next few in her line appear here. That is how the roster opens up.",
          spot: ".scout-info", wait: "click" },
        { text: "Pull a racer you already have and the copy feeds straight into her — " +
                "duplicates are how she earns her passive skills. Nothing is ever wasted.",
          spot: ".scout-info", wait: "click" },
        { text: "That is the scout. Unlock through careers, recruit with carrots, and " +
                "keep the duplicates coming.",
          wait: "click", last: true },
      ],
    },

    // ------------------------------------------------------------ deck building
    deck: {
      name: "Deck Building",
      steps: [
        { enter: () => { Shell.show("scr-game"); Game.showDeck(); },
          text: "This is the part you actually control. You do not play cards during a " +
                "race — you decide which fifteen she carries into it.",
          wait: "click" },
        { text: "Fifteen cards in the deck. When the gate opens she draws five of them, " +
                "and she decides when to spend them. Your say is which fifteen.",
          spot: "#sheet", wait: "click" },
        { text: "Every card costs spirit, and spirit fills as she runs. A deck of " +
                "expensive cards looks strong and sits in her hand unplayed.",
          spot: "#sheet", wait: "click" },
        { text: "Cheap cards get played. That is the whole lesson — a fifteen she can " +
                "afford beats a fifteen she cannot.",
          spot: "#sheet", wait: "click" },
        { text: "Kinds matter too. Bursts are pace, Recovery buys stamina back, Counters " +
                "take from whoever is ahead, Gambles pay big and can backfire.",
          spot: "#sheet", wait: "click" },
        { text: "Mix them. A deck that only does one thing has nothing to offer when the " +
                "race asks a different question.",
          spot: "#sheet", wait: "click" },
        { text: "Build the fifteen, then let her run. Come back and change it whenever a " +
                "race tells you something new.",
          wait: "click", last: true },
      ],
    },

    // ------------------------------------------------------------ career
    /* Runs on a racer the player does not own. Nothing here touches the stable. */
    career: {
      name: "Career Mode",
      steps: [
        { enter: startDemoCareer,
          text: "Career mode is three years of her life. Seventy-two turns, then the URA " +
                "Finale. This is a demonstration — she is not yours and nothing here is kept.",
          wait: "click" },
        { text: "Here is where you are. Each month is two turns, and the year runs " +
                "Junior, Classic, Senior.",
          spot: ".car-when", wait: "click" },
        { text: "This is your goal. Every racer has her own — the races she really ran " +
                "for — and missing one by its deadline ends the run there.",
          spot: ".car-goal", wait: "click" },
        { text: "Energy and mood. Training below sixty energy starts to fail, and a " +
                "failure costs stats and mood both. Great mood trains twenty percent harder.",
          spot: ".car-vitals", wait: "click" },
        { text: "Five stats, capped at 1400 — though everything above 1200 comes at half " +
                "rate. Build toward the trip she runs, not evenly.",
          spot: ".car-stats", wait: "click" },
        { text: "Training. Each shows what it pays, what it costs in energy, and the " +
                "chance it goes wrong. Wit is the odd one — it gives energy back.",
          spot: ".trainrow", wait: "click" },
        { text: "Train four times at the same facility and it levels up, paying more " +
                "every session after. Focus is rewarded.",
          spot: ".trainrow", wait: "click" },
        { text: "Go on — pick one. I will wait.",
          spot: ".trainrow", wait: "trained", timeout: 40000 },
        { text: "That is a turn. Rest when energy runs low, Recreation when her mood " +
                "drops, and the Infirmary when she picks something up.",
          spot: ".restrow", wait: "click" },
        { text: "Skill points build up as you train and race. They buy skills that fire " +
                "by themselves during a race — and a bad finish can leave a condition " +
                "that costs points to shake off.",
          spot: ".skillvit", wait: "click" },
        { text: "When races are on, Race instead swaps training for the card. Races are " +
                "where fans come from, and a goal race is the one turn she has to run.",
          wait: "click" },
        { text: "Finish the three years and she runs the URA Finale: Qualifier, Semifinal, " +
                "Final. She has to win all three.",
          wait: "click" },
        { text: "Finish a career and two things happen — the next racers in her line " +
                "unlock for the scout, and she becomes a veteran your future trainees " +
                "can inherit from.",
          wait: "click" },
        { text: "That is career mode. Train to a shape, meet the goals, and see how far " +
                "she goes.",
          wait: "click", last: true },
      ],
      onEnd: endDemoCareer,
    },
  };

  /** A racer the player does NOT own, so the demo cannot be mistaken for a real run. */
  function startDemoCareer() {
    const owned = Stable.ownedIds();
    const pool = Stable.ROSTER.filter(r => owned.indexOf(r.id) < 0);
    const def = pool[0] || Stable.ROSTER[0];
    UICareer.begin(def.id, { tutorial: true });
  }
  function endDemoCareer() {
    // leave no trace: the demo career is dropped rather than saved
    if (root.UICareer && UICareer.state) UICareer.abandonTutorial();
  }

  // ---------------------------------------------------------------- coach
  function coachEl() {
    let c = document.getElementById("coach");
    if (!c) {
      c = document.createElement("div");
      c.id = "coach";
      document.body.appendChild(c);
    }
    return c;
  }

  function buildCoach() {
    const c = coachEl();
    c.className = "coach on";
    c.innerHTML = `
      <img class="coach-art" src="assets/portraits/tazuna.png" alt="">
      <div class="coach-bubble">
        <div class="coach-name">Tazuna Hayakawa</div>
        <div class="coach-text" id="tutText"></div>
        <div class="coach-cta" id="tutCta"></div>
      </div>
      <button class="btn ghost sm coach-skip" id="tutSkip">Skip tutorial</button>`;
    c.querySelector("#tutSkip").onclick = e => { e.stopPropagation(); finish(false); };
    c.onclick = () => {
      const s = current();
      if (!s) return;
      if (run.typing && !run.typing.isDone()) { run.typing.skip(); return; }
      if (s.wait === "click") next();
    };
  }

  const current = () => run && run.steps[run.i];

  /* The spotlight is re-measured rather than remembered: steps change screens, and a
     ring drawn around where an element used to be is worse than no ring at all. */
  function spotlight(sel) {
    $$(".spot-ring").forEach(n => n.remove());
    if (!sel) return;
    const t = document.querySelector(sel);
    if (!t) return;
    const r = t.getBoundingClientRect();
    if (!r.width && !r.height) return;
    const ring = document.createElement("div");
    ring.className = "spot-ring";
    ring.style.cssText =
      `left:${r.left - 10}px;top:${r.top - 10}px;width:${r.width + 20}px;height:${r.height + 20}px`;
    document.body.appendChild(ring);
  }

  function next() {
    if (!run || run.done) return;
    run.i++;
    const s = current();
    if (!s) return finish(true);

    clearTimeout(run.timer);
    if (s.enter) { try { s.enter(); } catch (e) {} }

    /* A screen change needs a frame to land before anything can be measured, so the
       step body runs after the navigation settles. */
    const delay = s.enter ? 520 : 0;
    setTimeout(() => {
      if (!run || run.done || current() !== s) return;
      spotlight(s.spot);
      const cta = document.getElementById("tutCta");
      if (cta) cta.textContent = s.wait === "click" ? "click to continue"
        : s.wait === "trained" ? "pick a training to continue"
        : "";
      const txt = document.getElementById("tutText");
      if (txt) run.typing = FX.typeText(txt, s.text, {});
      if (s.timeout) {
        const at = run.i;
        run.timer = setTimeout(() => {
          if (run && !run.done && run.i === at) next();
        }, s.timeout);
      }
      if (s.last) run.timer = setTimeout(() => { if (run && !run.done) finish(true); }, 11000);
    }, delay);
  }

  /** Anything the game does that a tutorial step might be waiting on. */
  function notify(evt) {
    if (!run || run.done) return;
    const s = current();
    if (!s || s.wait !== evt) return;
    setTimeout(next, 600);
  }

  function start(id) {
    const script = SCRIPTS[id];
    if (!script) return;
    if (run && !run.done) finish(false);
    run = { id, i: -1, steps: script.steps, done: false, script };
    buildCoach();
    next();
  }

  /** Pays out once, via Stable, and always cleans up whatever the script started. */
  function finish(completed) {
    if (!run) return;
    const script = run.script;
    run.done = true;
    clearTimeout(run.timer);
    const id = run.id;
    run = null;
    $$(".spot-ring").forEach(n => n.remove());
    const c = document.getElementById("coach");
    if (c) { c.className = "coach"; c.onclick = null; }
    if (script && script.onEnd) { try { script.onEnd(); } catch (e) {} }

    let paid = null;
    if (completed) {
      const res = Stable.completeTutorial(id);
      if (res.ok) paid = res.carrots;
      Quests.record("tutorial");
      const got = Quests.checkAwards();
      if (got.length) UIMeta.toastAwards(got);
      FX.confetti({ count: 90 });
    }
    setTimeout(async () => {
      Shell.go("scr-tutorials", listBuild);
      /* Say what was won, rather than leaving the player to notice the carrot counter
         moved. A replay pays nothing and gets no box -- there is nothing to celebrate. */
      if (paid) {
        await UIMeta.reward({
          kicker: "Tutorial complete",
          title: script ? script.name : "Tutorial",
          message: "That one only pays the first time through.",
          reward: { carrots: paid },
        });
      }
    }, completed ? 800 : 150);
  }

  const active = () => !!(run && !run.done);

  // ---------------------------------------------------------------- the menu
  /* One screen listing all four, so a player can find the one they need rather than
     being offered a tutorial once and never again. */
  function listBuild(el) {
    const done = id => Stable.tutorialDone(id);
    el.innerHTML = `
      ${Bg.layer("tutorials")}
      <div class="scr-wrap">
        ${UIMeta.resourceBar()}
        <div class="panel pop">
          <div class="panel-hd">${Icon("cap")}Tutorials</div>
          <div class="tut-body">
            <p class="fine">Each one pays out once. They can be replayed any time,
               but the carrots only come the first time through.</p>
            <div class="tut-list">
              ${Stable.TUTORIALS.map((t, i) => `
                <div class="tut ${done(t.id) ? "done" : ""}">
                  <span class="tut-n">${done(t.id) ? Icon("check") : i + 1}</span>
                  <div class="tut-main">
                    <b>${esc(t.name)}</b>
                    <i>${esc(t.text)}</i>
                  </div>
                  <div class="tut-side">
                    <span class="rw">${done(t.id) ? "claimed" : Icon("carrot") + " " + t.carrots}</span>
                    <button class="btn sm ${done(t.id) ? "ghost" : ""}" data-tut="${t.id}">
                      ${done(t.id) ? "Replay" : "Start"}</button>
                  </div>
                </div>`).join("")}
            </div>
          </div>
        </div>
      </div>`;
    UIMeta.wireResourceBar(el);
    el.querySelectorAll("[data-tut]").forEach(b => b.onclick = () => {
      const id = b.dataset.tut;
      // the in-race tutorial belongs to shell.js; the rest are ours
      if (id === "race") return Shell.startRaceTutorial();
      start(id);
    });
  }

  const api = { SCRIPTS, start, notify, active, finish, listBuild };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Tutorials = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
