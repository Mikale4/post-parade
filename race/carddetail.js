/*
 * Card details: what a card does, in plain words, and the press-and-hold that opens them.
 *
 * One view for every place a card is met. In the deck builder a click adds a copy, and in
 * a race the chips are the hand she is holding, so reading a card is a gesture of its
 * own: press and hold it (finger or mouse), right-click it, or focus it and press I. A
 * hold that opens the view swallows the click that would follow, so reading never adds.
 *
 * The words are built from the card's own data -- effects, phases, cond, target -- with
 * the numbers cards.js and sim.js run on, so they cannot drift from what the card does
 * the way a hand-written note can. The blurb on the card face stays the short form.
 *
 * In a race the view holds the clock (Game.setPaused) while it is open, and gives it back
 * on close only if it was the one that took it: reading the hand should not cost the
 * race, and a pause the player made themselves is theirs to end.
 *
 * Exposes CardDetail: describe(card), open(id, opts), hold(container, opts), isOpen().
 */
(function (root) {
  "use strict";

  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g,
    c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pct = x => Math.round(Math.abs(x) * 100) + "%";
  const secs = d => d + (d === 1 ? " second" : " seconds");
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const RARITY = { C: "Common", R: "Rare", E: "Epic" };
  const PHASE = ["opening", "middle", "final"];
  const COUNT = ["no", "one", "two", "three", "four"];
  const HOLD_MS = 450;

  /* Each kind's job in a line, in the words the README uses for it. */
  const KIND_NOTE = {
    Burst:    "The yardstick: straight pace, nothing to set up.",
    Gamble:   "The bet: a big burst that only pays if she gets past rivals in it.",
    Recovery: "Insurance: stamina back, worth most when she is running on empty.",
    Tempo:    "Planning: burn less now, collect it as pace in the final phase.",
    Counter:  "Duelling: takes pace off the racer directly ahead. Dead weight in front.",
    Support:  "Drafting: the slipstream of the racer ahead pays, most when she is tight behind.",
  };

  // ================================================================ the words
  function does(c) {
    const out = [];
    for (const e of c.effects) {
      switch (e.t) {
        case "speed":
          out.push((e.delay ? "After " + secs(e.delay) + ", she" : "She") + " runs <b>" + pct(e.amount) +
            (e.amount < 0 ? " slower" : " faster") + "</b> for <b>" + secs(e.dur) + "</b>.");
          break;
        case "drain":
          out.push("She burns <b>" + pct(e.amount) + (e.amount < 0 ? " less" : " more") +
            " stamina</b> for <b>" + secs(e.dur) + "</b>.");
          break;
        case "heal":
          out.push(e.scale
            ? "She gets back <b>" + pct(e.amount) + "</b> of her stamina, rising to <b>" +
              pct(e.amount + e.scale) + "</b> the emptier she is."
            : "She gets back a flat <b>" + pct(e.amount) + "</b> of her stamina.");
          break;
        case "unblock":
          out.push("Traffic cannot box her in for <b>" + secs(e.dur) + "</b>.");
          break;
        case "invest":
          // sim.js pays it over the 30-90% stamina band: the bare minimum at 30% or less
          out.push("She burns <b>" + pct(e.amount) + " less stamina</b> for <b>" + secs(e.dur) + "</b>.");
          out.push((e.whenPhase != null ? "Then, once the " + PHASE[e.whenPhase] + " phase is on" : "When that ends") +
            ", she gets <b>+" + pct(e.min) + " to +" + pct(e.max) + " pace</b> for <b>" + secs(e.payDur) +
            "</b>: the full " + pct(e.max) + " with 90% of her stamina left, " + pct(e.min) + " at 30% or less." +
            (e.whenPhase != null ? " If the race ends first, it never pays." : ""));
          break;
        case "steal": {
          const keep = e.keep == null ? 1 : e.keep;
          out.push("The racer directly ahead of her loses <b>" + pct(e.amount) + " pace</b> for <b>" +
            secs(e.dur) + "</b>, and she takes " + (keep === 1 ? "all" : keep === 0.5 ? "half" : pct(keep)) +
            " of it (<b>+" + pct(e.amount * keep) + "</b>).");
          break;
        }
        case "draft":
          out.push("For <b>" + secs(e.dur) + "</b> she rides the slipstream of the racer ahead: up to <b>+" +
            pct(e.amount) + " pace</b>, most when she is tight behind, nothing in clear air. " +
            "Traffic cannot box her in while it lasts.");
          break;
        case "gambit": {
          const n = e.places || 1;
          out.push("She runs <b>" + pct(e.amount) + " faster</b> for <b>" + secs(e.dur) + "</b>, and has to pass <b>" +
            (n === 1 ? "a rival" : (COUNT[n] || n) + " rivals") + "</b> in that time.");
          out.push("If she does not, she loses <b>" + pct(e.crash) + " pace</b> for <b>" + secs(e.crashDur) + "</b>." +
            (e.reward ? " If she does, she gets " + pct(e.reward) + " of her stamina back." : ""));
          break;
        }
      }
    }
    return out;
  }

  function when(c) {
    const out = [];
    const ph = c.phases && c.phases.length ? c.phases : [0, 1, 2];
    out.push(ph.length >= 3 ? "Any phase of the race."
      : cap(ph.map(p => "the " + PHASE[p]).join(" or ")) + " phase only.");
    const k = c.cond || {};
    if (k.hpBelow != null) out.push("Only while her stamina is below <b>" + pct(k.hpBelow) + "</b>.");
    if (k.hpAbove != null) out.push("Only while her stamina is above <b>" + pct(k.hpAbove) + "</b>.");
    if (k.blocked) out.push("Only while she is boxed in.");
    if (c.target === "leader" || c.effects.some(e => e.t === "steal" || e.t === "draft"))
      out.push("Only with a racer ahead of her. From the front it cannot be played.");
    if (c.target === "leader") out.push("It lands on the race leader, not on her.");
    out.push("It costs <b>" + c.cost + " spirit</b>. Spirit builds as she runs, and she decides when to spend it.");
    return out;
  }

  /* The short read stable.js uses to fit cards to a race (Stable.cardAsks). */
  function traits(c) {
    const a = root.Stable && Stable.cardAsks ? Stable.cardAsks(c) : null;
    if (!a) return [];
    return [
      a.refuel > 0 && "Gives stamina back",
      a.burn && "Costs extra stamina",
      a.bank && "Pays out later",
      a.ahead && "Wants a racer ahead",
      a.empty && "For when she runs low",
      a.opening && "Opening card",
      a.final && "Final-phase card",
    ].filter(Boolean);
  }

  /** Everything the view says about a card, as HTML lines. */
  function describe(c) {
    return { kind: KIND_NOTE[c.kind] || "", does: does(c), when: when(c), traits: traits(c) };
  }

  // ================================================================ the view
  let host = null, cur = null;

  function hostEl() {
    if (!host) {
      host = document.createElement("div");
      host.id = "cardDetail";
      document.body.appendChild(host);
    }
    return host;
  }

  const isOpen = () => !!cur;

  /* What the card means where it was opened: copies against the deck in the builder, or
     whether she can play it this moment in a race. */
  function placeHTML(c, inf) {
    if (inf.deck) {
      const d = inf.deck;
      const slots = Array.from({ length: Math.max(1, d.allowed) }, (_, i) =>
        `<i class="${i < d.inDeck ? "on" : ""}"></i>`).join("");
      const more = d.owned < d.copyMax
        ? `You own ${d.owned}. A deck can run ${d.copyMax} if you scout another.`
        : d.owned > d.copyMax
          ? `You own ${d.owned}; a deck holds at most ${d.copyMax}.`
          : `You own ${d.owned}.`;
      return `<div class="cd-place">
          <span class="de-slots">${slots}</span>
          <span><b>${d.inDeck}</b> of ${d.allowed} in this deck &middot; ${more}</span>
        </div>` + (inf.note ? `<div class="cd-note">${esc(inf.note)}</div>` : "");
    }
    if (inf.race) {
      const r = inf.race;
      if (r.state === "spent") return `<div class="cd-place spent"><b>Played</b> already this race.</div>`;
      if (r.state === "ready")
        return `<div class="cd-place ready"><b>Ready.</b> She can play it now; when is her call.</div>`;
      const sp = r.spirit != null ? Math.max(0, Math.floor(r.spirit)) : null;
      return `<div class="cd-place wait"><b>Not now:</b> ${esc(r.why || "she cannot play it yet")}.${
        sp != null ? ` She has <b>${sp}</b> spirit; it costs ${c.cost}.` : ""}</div>`;
    }
    return "";
  }

  function render() {
    const { id, opts } = cur;
    const c = Cards.byId[id];
    if (!c) return close();
    const d = describe(c);
    const inf = (opts.info && opts.info(id)) || {};
    const acts = (opts.actions && opts.actions(id)) || [];
    const list = cur.list, at = list.indexOf(id);
    const li = s => `<li>${s}</li>`;

    hostEl().innerHTML = `
      <div class="cd-card pop" role="dialog" aria-modal="true" aria-labelledby="cdName">
        <div class="panel-hd blue">${root.Icon ? Icon("cards") : ""}Card${
          list.length > 1 ? `<span class="cd-pos">${at + 1} / ${list.length}</span>` : ""}</div>
        <div class="cd-body">
          <div class="cd-art">
            <img src="assets/cards/${esc(c.id)}.png" alt="${esc(c.ability)}" draggable="false">
            <span class="cd-cost"><b>${c.cost}</b><i>spirit</i></span>
          </div>
          <div class="cd-head">
            <div class="cd-kind"><span class="cchip k${esc(c.kind)}">${esc(c.kind)}</span><span
              class="cd-rar r${esc(c.rarity)}">${RARITY[c.rarity] || ""}</span></div>
            <h2 class="cd-name" id="cdName">${esc(c.ability)}</h2>
            <div class="cd-who">${esc(c.name)}</div>
            <p class="cd-knote">${esc(d.kind)}</p>
          </div>
          <div class="cd-text">
            ${placeHTML(c, inf)}
            <h3 class="cd-h">What it does</h3>
            <ul class="cd-list">${d.does.map(li).join("")}</ul>
            <h3 class="cd-h">When she can play it</h3>
            <ul class="cd-list">${d.when.map(li).join("")}</ul>
            ${d.traits.length ? `<div class="cd-tags">${d.traits.map(t => `<span>${t}</span>`).join("")}</div>` : ""}
          </div>
        </div>
        <div class="cd-foot">
          ${list.length > 1 ? `<button class="btn ghost sm cd-nav" data-cd="prev" aria-label="Previous card">&lsaquo;</button><button
            class="btn ghost sm cd-nav" data-cd="next" aria-label="Next card">&rsaquo;</button>` : ""}
          <span class="spacer"></span>
          ${acts.map((a, i) => `<button class="btn ${a.cls || ""}" data-act="${i}" ${a.disabled ? "disabled" : ""}>${
            esc(a.label)}</button>`).join("")}
          <button class="btn ${opts.closeCls == null ? "ghost" : opts.closeCls}" data-cd="close">${esc(opts.close || "Close")}</button>
        </div>
      </div>`;

    host.querySelectorAll("[data-act]").forEach(b => b.onclick = () => {
      const a = acts[+b.dataset.act];
      if (!a || a.disabled || !cur) return;
      if (opts.onAction) opts.onAction(a.value, id);
      if (cur) { render(); focusIn('[data-act="' + b.dataset.act + '"]'); }
    });
    host.querySelectorAll("[data-cd]").forEach(b => b.onclick = () => {
      const k = b.dataset.cd;
      if (k === "close") close();
      else step(k === "next" ? 1 : -1);
    });
  }

  /* Keep focus where it was after a re-render, or on Close if that control went away. */
  function focusIn(sel) {
    const b = host.querySelector(sel);
    (b && !b.disabled ? b : host.querySelector('[data-cd="close"]')).focus();
  }

  function step(dir) {
    if (!cur || cur.list.length < 2) return;
    const i = cur.list.indexOf(cur.id);
    cur.id = cur.list[(i + dir + cur.list.length) % cur.list.length];
    render();
    focusIn('[data-cd="' + (dir > 0 ? "next" : "prev") + '"]');
  }

  function onKey(e) {
    if (!cur) return;
    // nothing behind the view hears a key while it is up: no Callout, no pause menu
    e.stopPropagation();
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    else if (e.key === "ArrowLeft")  { e.preventDefault(); step(-1); }
    else if (e.key === "Tab") {
      // keep focus inside the dialog
      const f = [...host.querySelectorAll("button:not(:disabled)")];
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  }

  /**
   * Show a card. Resolves once it is closed.
   *   list            ids to step through with the arrows (defaults to just this one)
   *   info(id)        { deck: {owned, allowed, inDeck, copyMax}, note } or
   *                   { race: {state: "ready"|"wait"|"spent", why, spirit} }
   *   actions(id)     [{ value, label, cls, disabled }], shown before Close
   *   onAction(v, id) called on an action; the view stays open and redraws
   *   pause           hold the race still while it is open
   *   close           the Close button's label; closeCls its button class (default ghost)
   */
  function open(id, opts) {
    opts = opts || {};
    if (!Cards.byId[id]) return Promise.resolve();
    if (cur) close();
    const list = (opts.list && opts.list.length ? opts.list : [id]).filter(x => Cards.byId[x]);
    if (list.indexOf(id) < 0) list.unshift(id);
    let held = false;
    const G = root.Game;
    if (opts.pause && G && G.isRacing && G.isRacing() && !G.isPaused())
      held = !!G.setPaused(true);
    return new Promise(resolve => {
      cur = { id, opts, list, held, resolve, back: document.activeElement, at: performance.now() };
      const el = hostEl();
      el.className = "on";
      render();
      document.addEventListener("keydown", onKey, true);
      // the press that opened it lets go over the backdrop; that must not close it again
      el.onclick = e => {
        const now = performance.now();
        if (e.target === el && now - cur.at > 350 && now >= swallowUntil) close();
      };
      el.oncontextmenu = e => e.preventDefault();
      setTimeout(() => { if (cur) focusIn('[data-cd="close"]'); }, 30);
    });
  }

  function close() {
    if (!cur) return;
    const c = cur;
    cur = null;
    document.removeEventListener("keydown", onKey, true);
    host.className = "";
    host.innerHTML = "";
    const G = root.Game;
    if (c.held && G && G.isPaused && G.isPaused()) G.setPaused(false);
    if (c.back && c.back.isConnected && c.back.focus) c.back.focus({ preventScroll: true });
    // after the race has its clock back, so a tutorial step that waits on it can hold it again
    if (root.Shell && Shell.notify) Shell.notify("cardDetail");
    c.resolve();
  }

  // ================================================================ press and hold
  /* One press is tracked at a time, page-wide, so a container that is redrawn while the
     finger is down (the race HUD redraws its chips four times a second) loses nothing:
     the press remembers the card id, not the element. */
  let press = null, swallowUntil = 0, ring = null;

  function ringAt(x, y) {
    if (!ring) {
      ring = document.createElement("div");
      ring.id = "cdRing";
      ring.innerHTML = '<svg viewBox="0 0 36 36" aria-hidden="true"><circle class="bg" cx="18" cy="18" r="15"/>' +
                       '<circle class="fg" cx="18" cy="18" r="15"/></svg>';
      document.body.appendChild(ring);
    }
    ring.style.left = x + "px";
    ring.style.top = y + "px";
    ring.className = "";
    void ring.offsetWidth;                 // restart the fill
    ring.className = "on";
  }
  const ringOff = () => { if (ring) ring.className = ""; };

  function endPress() {
    if (!press) return;
    clearTimeout(press.timer);
    press = null;
    ringOff();
  }

  if (typeof window !== "undefined") {
    window.addEventListener("pointermove", e => {
      if (press && e.pointerId === press.pid &&
          Math.hypot(e.clientX - press.x, e.clientY - press.y) > 10) endPress();
    }, true);
    // the click that ends a hold that opened the view is swallowed, briefly
    const letGo = () => {
      endPress();
      if (swallowUntil === Infinity) swallowUntil = performance.now() + 400;
    };
    window.addEventListener("pointerup", letGo, true);
    window.addEventListener("pointercancel", letGo, true);
    window.addEventListener("blur", endPress);
  }

  /**
   * Make every card inside `container` (matching `selector`, default [data-card]) open on
   * a hold, a right-click, or I. `open(id, node)` does the opening; `idOf(node)` reads the
   * id (default data-card). Safe to call again on the same container.
   */
  function hold(container, opts) {
    if (!container || container._cdHold) return;
    opts = opts || {};
    const sel = opts.selector || "[data-card]";
    const idOf = opts.idOf || (n => n.dataset.card);
    const launch = node => {
      endPress();
      const id = idOf(node);
      if (id && !cur) opts.open(id, node);
    };
    container._cdHold = true;
    container.classList.add("cd-holdable");

    container.addEventListener("pointerdown", e => {
      if (e.button !== 0 || cur) return;   // the right button is the context menu's
      const node = e.target.closest(sel);
      if (!node || !container.contains(node) || e.target.closest("[data-nohold]")) return;
      endPress();
      const touch = e.pointerType === "touch";
      press = { pid: e.pointerId, x: e.clientX, y: e.clientY };
      // above a finger, which would hide it; at the pointer for a mouse
      ringAt(e.clientX, e.clientY - (touch ? 46 : 0));
      press.timer = setTimeout(() => { swallowUntil = Infinity; launch(node); }, HOLD_MS);
    });
    container.addEventListener("click", e => {
      if (performance.now() < swallowUntil) { e.stopPropagation(); e.preventDefault(); swallowUntil = 0; }
    }, true);
    container.addEventListener("contextmenu", e => {
      const node = e.target.closest(sel);
      if (!node || !container.contains(node)) return;
      e.preventDefault();
      // a long touch fires this too, after the hold has already opened the view
      if (!cur && swallowUntil !== Infinity) launch(node);
    });
    container.addEventListener("keydown", e => {
      if (e.key !== "i" && e.key !== "I") return;
      const node = e.target.closest(sel);
      if (!node || !container.contains(node)) return;
      e.preventDefault();
      launch(node);
    });
    container.addEventListener("dragstart", e => { if (e.target.closest(sel)) e.preventDefault(); });
  }

  const api = { describe, open, close, hold, isOpen, KIND_NOTE, HOLD_MS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.CardDetail = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
