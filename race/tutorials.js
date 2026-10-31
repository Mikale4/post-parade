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
 *     timeout  ms before an event-gated step offers the click anyway, so a tutorial can
 *              never strand the player waiting for something that will not happen
 *
 * No step ever moves on by itself: every one ends on the player's click. A step waiting
 * for an event asks for that click once the event has happened.
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
                "copy is not wasted — it lets you run that card twice in the same fifteen. " +
                "Two is the most a deck can hold.",
          spot: ".scout-tabs", wait: "click" },
        { text: "A ten-scout costs the price of nine and guarantees at least one Rare " +
                "or better. If you are saving, save for that. Quests and the Dream Trophy " +
                "also pay Scout Tickets and Scout Passes — free scouts, spent here.",
          spot: ".scout-actions", wait: "click" },
        { text: "Now the racer scout. This is the important rule: it only ever offers " +
                "racers you have UNLOCKED.",
          enter: () => { const t = $('[data-tab="racer"]'); if (t) t.click(); },
          spot: ".scout-tabs", wait: "click" },
        { text: "You start with the five starters unlocked. Finish a career with someone and " +
                "the next few in her line appear here. That is how the roster opens up.",
          spot: ".scout-info", wait: "click" },
        { text: "It brings racers you do not have yet first. Once you have every unlocked " +
                "racer, it brings copies — you cannot pick whose.",
          spot: ".scout-info", wait: "click" },
        { text: "A copy feeds straight into her: duplicates are how she earns her passive " +
                "skills, up to three, and they run with her in every race. Once she has all " +
                "three, copies turn into carrots. Nothing is ever wasted.",
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
        { enter: () => Shell.go("scr-decks", UIDecks.listBuild),
          text: "This is the part you actually control. You do not play cards during a " +
                "race — you decide which fifteen she carries into it. Every racer keeps her " +
                "own decks here.",
          wait: "click" },
        { enter: openDeckPage,
          text: "Each racer can keep several decks. The one equipped is the one she races " +
                "with, in exhibitions and careers alike.",
          wait: "click" },
        { text: "Fifteen cards to a deck, and two copies of any one card at most. In a " +
                "normal race she is dealt five at the gate; in a Dream race all fifteen are " +
                "in reach.",
          spot: '[data-act="create"]', wait: "click" },
        { text: "Every card costs spirit, fifteen for the whole race. Cheap cards get played " +
                "often; rare ones land harder. Which wins depends on the race.",
          wait: "click" },
        { text: "Kinds: Bursts are pace. Recovery and Tempo keep her going. Counters and " +
                "Support work on whoever is ahead. Gambles pay big and can backfire.",
          wait: "click" },
        { text: "The quickest way to a good fifteen: let her decide. Her simple thoughts " +
                "build for her best race in one tap; a planned strategy asks how to spend, " +
                "her running style, the distance and the track.",
          spot: '[data-act="auto"]', wait: "click" },
        { text: "It knows what wins where. Long races, and races her stamina will not last, " +
                "want heals. Sprints want pace. On ground she is weak on, Counters pay. And " +
                "it doubles up her best cards.",
          spot: '[data-act="auto"]', wait: "click" },
        { text: "Build for the race in front of her, and come back whenever a race tells " +
                "you something new.",
          wait: "click", last: true },
      ],
    },

    // ------------------------------------------------------------ exhibition
    exhibition: {
      name: "Exhibition",
      steps: [
        { enter: () => { Shell.show("scr-game"); Game.showStable(); },
          text: "Exhibition is one race with any racer you own: no calendar, no goals. " +
                "Pick her here — her level, style and temperament are on her ticket.",
          spot: "#sheet .grid", wait: "click" },
        { enter: () => Game.showDeck(),
          text: "This is the sheet before the gate: the deck she has equipped, her passives, " +
                "the mode and the course.",
          spot: "#sheet", wait: "click" },
        { text: "Her passives come from duplicates in the racer scout. The ones she has " +
                "unlocked run with her here too.",
          spot: ".passrow", wait: "click" },
        { text: "Two modes. Normal deals five cards from her fifteen, and a Callout bins " +
                "them for five more. Dream puts every racer's whole deck in reach, and a " +
                "Callout plays the card that is due — free.",
          spot: ".modes", wait: "click" },
        { text: "Four courses, sprint to stayer. Which cards win depends on the distance, " +
                "so build the deck for the course you pick.",
          spot: ".courses", wait: "click" },
        { text: "A race costs 5 stamina, and the price is on the button. Stamina comes back " +
                "a point every four minutes, or fifty at a time with Carrot Juice.",
          spot: "#toRace", wait: "click" },
        { text: "At the gate every runner draws her stall at random — the gate card tells " +
                "you hers. Then it is the race, and the rest is hers.",
          wait: "click", last: true },
      ],
      onEnd: () => { const m = document.getElementById("modal"); if (m) m.style.display = "none"; },
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
        { text: "There are two scenarios. The Beginning: URA Finale costs 30 stamina. The " +
                "Summit: Dream Trophy costs 40 — every race with her whole deck, rivals with " +
                "decks of their own, and prizes far bigger. Bring a real deck to that one.",
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

  /** Her deck page, for the first racer the trainer owns (the list stays up if none). */
  function openDeckPage() {
    const id = Stable.ownedIds()[0], el = document.getElementById("scr-decks");
    if (id && el && root.UIDecks) UIDecks.racerBuild(el, id);
  }

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
      if (s.wait === "click" || run.ready) next();
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
    run.ready = run.got = false;
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
          if (!run || run.done || run.i !== at) return;
          run.ready = true;
          if (cta) cta.textContent = (cta.textContent ? cta.textContent + ", or " : "") + "click to continue";
        }, s.timeout);
      }
    }, delay);
  }

  /** Anything the game does that a tutorial step might be waiting on: once it has
      happened, the step waits for the player's click. */
  function notify(evt) {
    // `got`, not `ready`: the timeout's way out must not swallow the thing the step asked for
    if (!run || run.done || run.got) return;
    const s = current();
    if (!s || s.wait !== evt) return;
    run.got = run.ready = true;
    clearTimeout(run.timer);
    const cta = document.getElementById("tutCta");
    if (cta) cta.textContent = "click to continue";
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

    let paid = null, allItems = null;
    if (completed) {
      const res = Stable.completeTutorial(id);
      if (res.ok) { paid = res.carrots; allItems = res.items; }
      Quests.record("tutorial");
      const got = Quests.checkAwards();
      if (got.length) UIMeta.toastAwards(got);
      FX.confetti({ count: 90 });
    }
    setTimeout(async () => {
      // a tutorial started in the meantime has the screen now: do not pull it back to the board
      if (active()) return;
      Shell.go("scr-tutorials", listBuild);
      /* Say what was won, rather than leaving the player to notice the carrot counter
         moved. A replay pays nothing and gets no box -- there is nothing to celebrate. */
      if (paid) {
        await UIMeta.reward({
          kicker: "Tutorial complete",
          title: script ? script.name : "Tutorial",
          message: allItems ? "That is every tutorial done — and a Scout Pass on top, for finishing them all."
                          : "That one only pays the first time through.",
          reward: { carrots: paid, items: allItems || undefined },
        });
      }
    }, completed ? 800 : 150);
  }

  const active = () => !!(run && !run.done);

  // ---------------------------------------------------------------- the menu
  /* One screen listing every one, so a player can find the one they need rather than
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
               but the carrots only come the first time through.
               ${Stable.tutorialsAllDone && Stable.tutorialsAllDone()
                 ? "Every one finished: the Scout Pass for that is claimed."
                 : "Finish every one of them and a <b>Scout Pass</b> comes on top."}</p>
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
      // the ones run in a race belong to shell.js; the rest are ours
      if (!SCRIPTS[id]) return Shell.startRaceTutorial(id);
      start(id);
    });
  }

  const api = { SCRIPTS, start, notify, active, finish, listBuild };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Tutorials = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
