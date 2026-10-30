/*
 * The deck builder: choose a racer, then work on her decks.
 *
 * Decks used to be a single unnamed array hanging off a racer's save, editable only from
 * the pre-race modal -- one deck each, no name, no way to keep a second around.
 *
 * Building happens from INSIDE a racer: pick who you are building for, then build. That
 * is the order the question actually arrives in -- a fifteen is built for a particular
 * racer's style and trip, never in the abstract -- and it makes equipping one click,
 * because everything on screen already belongs to her.
 *
 * All the rules live in stable.js (Stable.checkDeck is the single source of what is
 * legal). This file shows what it returns and never decides anything itself.
 *
 * A deck may hold the same card more than once, up to the number of copies owned --
 * that is what a duplicate pull buys, so the grid counts rather than toggles.
 *
 * Exposes UIDecks.
 */
(function (root) {
  "use strict";

  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g,
    c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const art = p => encodeURI(String(p || ""));
  /** Her small portrait: a live bust of her voxel model (Voxel.bustHTML), or her picture without 3D. */
  const bustTag = (d, cls) => root.Voxel && Voxel.ok && Voxel.bustHTML
    ? Voxel.bustHTML(d, cls, art(Stable.spriteFor(d.id)))
    : `<img class="${cls}" src="${art(Stable.spriteFor(d.id))}" alt="">`;
  const go = (id, build) => Shell.go(id, build);

  const MIN = () => Stable.DECK_MIN;
  const MAX = () => Stable.DECK_MAX;

  let selected = null;      // deck id highlighted within the current racer

  /* The card that represents a deck on its tile. The most expensive card is the one the
     deck is built around often enough to be a fair thumbnail, and it is stable -- a
     thumbnail that changes every time you reorder the list is worse than a dull one. */
  function heroCard(deck) {
    const cards = deck.cards.map(id => Cards.byId[id]).filter(Boolean);
    if (!cards.length) return null;
    const rank = { E: 3, R: 2, C: 1 };
    return cards.slice().sort((a, b) =>
      b.cost - a.cost || (rank[b.rarity] || 0) - (rank[a.rarity] || 0) ||
      a.id.localeCompare(b.id))[0];
  }

  const kindMix = cards => {
    const mix = {};
    for (const c of cards) mix[c.kind] = (mix[c.kind] || 0) + 1;
    return Object.entries(mix).sort((a, b) => b[1] - a[1])
      .map(([k, n]) => n + " " + k).join(", ");
  };

  // ================================================================ pick a racer
  /* The first question is always "whose deck?", so it is the first screen. */
  function listBuild(el) {
    const owned = Stable.ownedRacers();
    const totalCards = Stable.ownedCards().reduce((a, c) => a + Stable.cardCount(c.id), 0);

    el.innerHTML = `
      ${Bg.layer("stable")}
      <div class="scr-wrap">
        ${UIMeta.resourceBar()}
        <div class="panel pop">
          <div class="panel-hd blue">${Icon("cards")}Decks</div>
          <div class="deck-sum">
            <span><b>${owned.length}</b> racer${owned.length === 1 ? "" : "s"}</span>
            <span><b>${totalCards}</b> card${totalCards === 1 ? "" : "s"} owned</span>
            <span class="fine">Pick who you are building for. Each racer keeps her own
              decks and races with whichever one she has equipped.</span>
          </div>
          ${owned.length ? `
            <div class="dr-grid">
              ${owned.map(d => {
                const mine = Stable.decksFor(d.id);
                const on = Stable.deckForRacer(d.id);
                return `
                <button class="drow" data-racer="${d.id}">
                  ${bustTag(d, "dr-art")}
                  <span class="dr-txt">
                    <b>${esc(d.name)}</b>
                    <i>${mine.length ? mine.length + " deck" + (mine.length === 1 ? "" : "s")
                                     : "no decks yet"}</i>
                  </span>
                  <span class="dr-eq ${on ? "" : "none"}">${
                    on ? esc(on.name) : "nothing equipped"}</span>
                </button>`;
              }).join("")}
            </div>`
            : `<p class="fine deck-empty">You have no racers yet. Scout one first.</p>`}
          <div class="deck-acts">
            <span class="spacer"></span>
            <button class="btn ghost" data-back="1">Back to menu</button>
          </div>
        </div>
      </div>`;

    UIMeta.wireResourceBar(el);
    el.querySelectorAll("[data-racer]").forEach(b =>
      b.onclick = () => { selected = null; go("scr-decks", e2 => racerBuild(e2, b.dataset.racer)); });
    const back = el.querySelector("[data-back]");
    if (back) back.onclick = () => Shell.toMenu();
  }

  // ================================================================ one racer's decks
  function racerBuild(el, racerId) {
    const def = Stable.defOf(racerId);
    if (!def) return listBuild(el);
    const decks = Stable.decksFor(racerId);
    const equipped = Stable.deckForRacer(racerId);
    const totalCopies = Stable.ownedCards().reduce((a, c) => a + Stable.cardCount(c.id), 0);
    if (selected && !decks.some(d => d.id === selected)) selected = null;
    if (!selected && decks.length) selected = (equipped || decks[0]).id;
    const sel = selected ? Stable.deckById(selected) : null;
    const isEquipped = !!(sel && equipped && sel.id === equipped.id);
    const styleName = (root.Sim && Sim.STYLES[def.style]) ? Sim.STYLES[def.style].name : "";

    el.innerHTML = `
      ${Bg.layer("stable")}
      <div class="scr-wrap">
        ${UIMeta.resourceBar()}
        <div class="panel pop">
          <div class="panel-hd blue">${Icon("cards")}${esc(def.name)} &middot; decks</div>

          <div class="dr-head">
            ${bustTag(def, "dr-art big")}
            <div class="dr-headtxt">
              <div class="dr-name">${esc(def.name)}</div>
              <div class="dr-sub">${esc(styleName)} &middot;
                ${decks.length} deck${decks.length === 1 ? "" : "s"} &middot;
                ${totalCopies} cards owned</div>
              <div class="dr-now">${equipped
                ? `Races with <b>${esc(equipped.name)}</b>`
                : `<span class="warn">No deck equipped</span> &mdash; she will race with
                   whatever she can find.`}</div>
            </div>
          </div>

          <div class="deck-grid">
            ${decks.map(d => {
              const hero = heroCard(d);
              const on = equipped && equipped.id === d.id;
              return `
              <button class="dtile ${d.id === selected ? "sel" : ""}" data-deck="${d.id}">
                <div class="dt-case">
                  ${hero ? `<img class="dt-art" src="assets/cards/${hero.id}.png" alt="">`
                         : `<div class="dt-art empty"></div>`}
                  <div class="dt-box"><i></i><i></i><i></i></div>
                </div>
                <div class="dt-name">${esc(d.name)}</div>
                <div class="dt-meta">${d.cards.length} card${d.cards.length === 1 ? "" : "s"}</div>
                <div class="dt-eq ${on ? "" : "none"}">${on ? "Equipped" : "not equipped"}</div>
              </button>`;
            }).join("")}
            <button class="dtile new" data-new="1">
              <div class="dt-case"><div class="dt-plus">+</div></div>
              <div class="dt-name">New deck</div>
              <div class="dt-meta">build a fifteen</div>
            </button>
          </div>

          ${decks.length ? "" : `<p class="fine deck-empty"><b>${esc(def.name)}</b> has no
            decks yet. <b>Create</b> one and equip it to her.</p>`}

          <div class="deck-acts">
            <button class="btn" data-act="create">Create</button>
            <button class="btn gold" data-act="auto">Let ${esc(def.name)} decide</button>
            <button class="btn" data-act="edit"   ${sel ? "" : "disabled"}>Edit</button>
            <button class="btn" data-act="rename" ${sel ? "" : "disabled"}>Rename</button>
            <button class="btn blue" data-act="equip" ${sel && !isEquipped ? "" : "disabled"}>${
              isEquipped ? "Equipped" : "Equip"}</button>
            <span class="spacer"></span>
            <button class="btn pink" data-act="delete" ${sel ? "" : "disabled"}>Delete</button>
            <button class="btn ghost" data-act="back">Change racer</button>
          </div>
        </div>
      </div>`;

    UIMeta.wireResourceBar(el);
    el.querySelectorAll("[data-deck]").forEach(b => {
      b.onclick = () => { selected = b.dataset.deck; racerBuild(el, racerId); };
      // the tile is the deck; opening it should not need a trip to the button row
      b.ondblclick = () => edit(racerId, b.dataset.deck);
    });
    const newBtn = el.querySelector("[data-new]");
    if (newBtn) newBtn.onclick = () => edit(racerId, null);

    el.querySelectorAll("[data-act]").forEach(b => b.onclick = () => {
      const act = b.dataset.act;
      if (act === "back")   return go("scr-decks", listBuild);
      if (act === "create") return edit(racerId, null);
      if (act === "auto")   return autoCreate(el, racerId);
      if (!selected) return;
      if (act === "edit")   return edit(racerId, selected);
      if (act === "rename") return rename(el, racerId, selected);
      if (act === "delete") return remove(el, racerId, selected);
      if (act === "equip")  return equip(el, racerId, selected);
    });
  }

  // ---------------------------------------------------------------- auto-build
  /* "Let her decide", in two questions: how to spend (the focus), then which running
     style to build for. Three focuses, because there is no single right answer --
     stable.js measured them and the notes below are what the measurement says, not
     flavour text. `mix` is offered first because it wins most often. */
  async function askFocus(def) {
    const S = Stable.PICK_STYLES;
    return UIMeta.choose({
      title: "Let " + esc(def.name) + " decide",
      message: "She builds from the cards you own. Which way?",
      options: ["mix", "expensive", "cheap"].map(k => ({
        value: k, label: S[k].name, note: S[k].note, art: Stable.spriteFor(def.id), bust: def,
      })),
    });
  }

  /* The second question. Her own style is the default and is marked as hers; the others
     are there because the player asked to be able to build for them. Listed in race order,
     lead to back, so the four read as one scale. */
  async function askRunStyle(def, focus) {
    const B = Stable.BUILD_FOR;
    const name = k => (root.Sim && Sim.STYLES[k]) ? Sim.STYLES[k].name : k;
    return UIMeta.choose({
      title: Stable.PICK_STYLES[focus].name + " build",
      message: "Which running style should she build for? She races as " +
        (/^[AEIOU]/.test(name(def.style)) ? "an " : "a ") + "<b>" + esc(name(def.style)) + "</b>.",
      options: Object.keys(B).map(k => ({
        value: k, sel: k === def.style,
        label: name(k) + (k === def.style ? " \u00b7 hers" : ""),
        note: B[k].note,
      })),
      cancel: "Back",
    });
  }

  /** Both questions. Back on the second returns to the first; null means cancelled. */
  async function askBuild(def) {
    for (;;) {
      const focus = await askFocus(def);
      if (!focus) return null;
      const runStyle = await askRunStyle(def, focus);
      if (runStyle) return { focus, runStyle };
    }
  }

  /* When the cards in a deck can be played, which is where decks built for different
     styles differ most visibly. */
  const timing = cards => {
    const n = p => cards.filter(c => c.phases && c.phases.length === 1 && c.phases[0] === p).length;
    const open = n(0), fin = n(2);
    if (!open && !fin) return "any time";
    return [open && open + " opening", fin && fin + " final"].filter(Boolean).join(", ") + " only";
  };

  /** Build a whole new deck for her and equip it. */
  async function autoCreate(el, racerId) {
    const def = Stable.defOf(racerId);
    if (!def) return;
    if (!Stable.ownedCards().length)
      return UIMeta.notify("You own no cards yet. Scout some first.");
    const pick = await askBuild(def);
    if (!pick) return;

    const cards = Stable.suggestDeck(racerId, pick.focus, pick.runStyle);
    const res = Stable.createDeck(Stable.suggestDeckName(racerId, pick.focus, pick.runStyle), cards, racerId);
    if (!res.ok) return UIMeta.notify(res.error);
    Stable.equipDeck(res.deck.id, racerId);
    selected = res.deck.id;
    racerBuild(el, racerId);

    const picked = cards.map(id => Cards.byId[id]).filter(Boolean);
    const avg = picked.length ? (picked.reduce((a, c) => a + c.cost, 0) / picked.length).toFixed(1) : "0";
    const styleName = (root.Sim && Sim.STYLES[pick.runStyle]) ? Sim.STYLES[pick.runStyle].name : pick.runStyle;
    await UIMeta.reward({
      kicker: Stable.PICK_STYLES[pick.focus].name + " build",
      title: res.deck.name,
      message: def.name + " picked these, and is running them.",
      items: [
        { icon: "flag", label: "Built for", amount: styleName },
        { icon: "cards", label: "Cards", amount: String(picked.length) },
        { icon: "bolt", label: "Average cost", amount: avg },
        { icon: "sparkle", label: "Shape", amount: kindMix(picked) || "\u2014" },
        { icon: "calendar", label: "Timing", amount: timing(picked) },
      ],
      close: "Nice",
    });
  }

  // ---------------------------------------------------------------- rename
  async function rename(el, racerId, id) {
    const d = Stable.deckById(id);
    if (!d) return;
    const name = await UIMeta.prompt({
      title: "Rename deck", message: "What should &ldquo;" + esc(d.name) + "&rdquo; be called?",
      value: d.name, placeholder: "Deck name", confirm: "Rename",
    });
    if (name == null) return;
    const res = Stable.renameDeck(id, name);
    if (!res.ok) return UIMeta.notify(res.error);
    racerBuild(el, racerId);
  }

  // ---------------------------------------------------------------- delete
  async function remove(el, racerId, id) {
    const d = Stable.deckById(id);
    if (!d) return;
    const equipped = Stable.deckForRacer(racerId);
    const isOn = !!(equipped && equipped.id === id);
    const ok = await UIMeta.ask({
      title: "Delete deck", danger: true,
      message: "Delete “" + d.name + "”?",
      detail: isOn ? "She is running it, and will go back to racing without a deck."
                   : "This cannot be undone.",
      confirm: "Delete", cancel: "Keep it",
    });
    if (!ok) return;
    Stable.deleteDeck(id);
    selected = null;
    racerBuild(el, racerId);
  }

  // ---------------------------------------------------------------- equip
  /* One click: you are already inside the racer, so there is nobody to choose between. */
  function equip(el, racerId, id) {
    const res = Stable.equipDeck(id, racerId);
    if (!res.ok) return UIMeta.notify(res.error);
    const tile = el.querySelector('[data-deck="' + id + '"]');
    if (tile && root.FX) FX.sparkleOn(tile, { count: 14 });
    racerBuild(el, racerId);
  }

  // ================================================================ the builder
  /* `working` is a LIST, not a set: the same card can appear as many times as the
     trainer owns copies of it. */
  let working = null;

  function edit(racerId, id) {
    const d = id ? Stable.deckById(id) : null;
    working = {
      racerId,
      id: d ? d.id : null,
      name: d ? d.name : suggestName(racerId),
      cards: d ? d.cards.slice() : [],
    };
    go("scr-deckedit", editBuild);
  }

  function suggestName(racerId) {
    const taken = Stable.decksFor(racerId).map(d => d.name.toLowerCase());
    for (let i = 1; i < 99; i++) {
      const n = "Deck " + i;
      if (taken.indexOf(n.toLowerCase()) < 0) return n;
    }
    return "New Deck";
  }

  function editBuild(el) {
    if (!working) return listBuild(el);
    const def = Stable.defOf(working.racerId);
    const owned = Stable.ownedCards();
    const inDeck = {};
    for (const id of working.cards) inDeck[id] = (inDeck[id] || 0) + 1;

    const cards = working.cards.map(i => Cards.byId[i]).filter(Boolean);
    const cost = cards.reduce((a, c) => a + c.cost, 0);
    const avg = cards.length ? (cost / cards.length).toFixed(1) : "0.0";
    const err = Stable.checkDeck(working.name, working.cards);

    el.innerHTML = `
      ${Bg.layer("stable")}
      <div class="scr-wrap">
        ${UIMeta.resourceBar({ back: false })}
        <div class="panel pop">
          <div class="panel-hd blue">${Icon("cards")}${working.id ? "Edit deck" : "New deck"}${
            def ? " &middot; " + esc(def.name) : ""}</div>

          <div class="de-head">
            <label class="de-name">
              <span>Deck name</span>
              <input id="deName" type="text" maxlength="24" value="${esc(working.name)}"
                     placeholder="Name this deck">
            </label>
            <div class="de-count ${err ? "bad" : "ok"}">
              <b>${working.cards.length}</b> / ${MAX()}
              <small>${err ? esc(err) : "avg cost " + avg + " &middot; " + kindMix(cards)}</small>
            </div>
          </div>

          <div class="de-strip">
            ${working.cards.length ? working.cards.map((cid, i) => {
              const c = Cards.byId[cid];
              return `<button class="de-chip" data-drop="${i}" title="Remove ${esc(c.ability)}">
                <img src="assets/cards/${c.id}.png" alt="">
                <span class="de-cost">${c.cost}</span>
                <span class="de-x">&times;</span></button>`;
            }).join("") : `<span class="fine">Empty &mdash; pick at least ${MIN()} cards below.</span>`}
          </div>

          <h3 class="de-h3">Your cards <span class="fine">click to add, again for a second copy</span></h3>
          <div class="dgrid de-pool">
            ${owned.map(c => {
              const have = Stable.cardCount(c.id), used = inDeck[c.id] || 0;
              const full = used >= have || working.cards.length >= MAX();
              return `
              <div class="dcard ${used ? "in" : ""} ${full ? "maxed" : ""}" data-add="${c.id}">
                <span class="tick">&times;${used} in deck</span>
                <div class="cost">${c.cost}</div>
                <img src="assets/cards/${c.id}.png" alt="">
                <div class="ci">
                  <div class="kind">${c.kind} &middot;
                    ${c.rarity === "E" ? "Epic" : c.rarity === "R" ? "Rare" : "Common"}</div>
                  <div class="cn">${esc(c.ability)}</div>
                  <div class="cb cw">${esc(c.name)}</div>
                  <div class="cb">${esc(c.blurb)}</div>
                  <div class="de-own">you own ${have}${used ? " &middot; using " + used : ""}</div>
                </div>
              </div>`;
            }).join("")}
          </div>

          <div class="deck-acts">
            <button class="btn" id="deSave" ${err ? "disabled" : ""}>
              ${working.id ? "Save changes" : "Create deck"}</button>
            <button class="btn gold" id="deAuto">Let ${
              def ? esc(def.name) : "her"} decide</button>
            <button class="btn" id="deClear">Clear</button>
            <span class="spacer"></span>
            <button class="btn ghost" id="deCancel">Cancel</button>
          </div>
        </div>
      </div>`;

    UIMeta.wireResourceBar(el);

    /* Typing re-validates without rebuilding: a rebuild would take the caret with it. */
    const nameEl = el.querySelector("#deName");
    nameEl.oninput = () => {
      working.name = nameEl.value;
      const e2 = Stable.checkDeck(working.name, working.cards);
      el.querySelector("#deSave").disabled = !!e2;
      const box = el.querySelector(".de-count");
      box.className = "de-count " + (e2 ? "bad" : "ok");
      box.querySelector("small").textContent = e2 || ("avg cost " + avg + " · " + kindMix(cards));
    };

    el.querySelectorAll("[data-add]").forEach(n => n.onclick = () => {
      const id = n.dataset.add;
      const used = working.cards.filter(x => x === id).length;
      if (working.cards.length >= MAX())
        return UIMeta.notify("A deck holds " + MAX() + " cards. Drop one first.");
      if (used >= Stable.cardCount(id))
        return UIMeta.notify("You own " + Stable.cardCount(id) + " cop" +
          (Stable.cardCount(id) === 1 ? "y" : "ies") + " of that card. Scout another to run more.");
      working.cards.push(id);
      editBuild(el);
    });
    el.querySelectorAll("[data-drop]").forEach(n => n.onclick = () => {
      working.cards.splice(+n.dataset.drop, 1);
      editBuild(el);
    });

    /* In the builder it fills the working set rather than creating a deck, so the pick
       is a starting point you can still edit. */
    el.querySelector("#deAuto").onclick = async () => {
      if (!def) return;
      const pick = await askBuild(def);
      if (!pick) return;
      working.cards = Stable.suggestDeck(working.racerId, pick.focus, pick.runStyle);
      if (!working.id) working.name = Stable.suggestDeckName(working.racerId, pick.focus, pick.runStyle);
      editBuild(el);
    };
    el.querySelector("#deClear").onclick = () => { working.cards = []; editBuild(el); };
    el.querySelector("#deCancel").onclick = () => {
      const r = working.racerId; working = null;
      go("scr-decks", e2 => racerBuild(e2, r));
    };
    el.querySelector("#deSave").onclick = () => {
      const res = working.id
        ? Stable.updateDeck(working.id, working.name, working.cards)
        : Stable.createDeck(working.name, working.cards, working.racerId);
      if (!res.ok) return UIMeta.notify(res.error);
      const r = working.racerId;
      selected = res.deck.id;
      working = null;
      go("scr-decks", e2 => racerBuild(e2, r));
    };
  }

  const api = { listBuild, racerBuild, editBuild };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.UIDecks = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
