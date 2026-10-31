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
 * A deck may hold a card twice (Stable.COPY_MAX), if two copies are owned -- that is what
 * a duplicate pull buys, so the grid counts rather than toggles.
 *
 * The builder itself is a collection and a deck side by side: the pool sorted, filtered
 * and searched on the left, the deck with its board (count, cost curve, kind mix) down
 * the right, staying in view while the pool scrolls. A click adds; holding a card opens
 * what it does (carddetail.js, the same view the race HUD uses).
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
  /* "Let her decide". First, how much to plan: her simple thoughts (one tap -- her own
     style, her best distance and track, the Balanced plan) or a planned strategy, four
     questions: the focus, the running style, the distance, the track. Every answer moves
     the deck: stable.js builds it from plans measured per race (deckplans.js). Back on any
     question returns to the one before; cancelling the first ends it. */
  const aptOf = (def, k) => ((def && def.aptitude) || {})[k] || "?";
  const styleName = k => (root.Sim && Sim.STYLES[k]) ? Sim.STYLES[k].name : k;

  async function askMode(def) {
    const best = Stable.bestFor(def), D = Stable.DISTANCES[best.distance], T = Stable.TRACKS[best.surface];
    return UIMeta.choose({
      title: "Let " + esc(def.name) + " decide",
      message: "She builds from the cards you own. How much should she plan?",
      options: [
        { value: "simple", label: "Her simple thoughts", art: Stable.spriteFor(def.id), bust: def,
          note: "She picks what she feels is best for her overall: running as a " + styleName(def.style) +
                ", over her best distance (" + D.name + ") on her best track (" + T.name + ")." },
        { value: "planned", label: "Her planned strategy",
          note: "You talk it through: how to spend, which running style, what distance, which track." },
      ],
    });
  }

  async function askFocus(def) {
    const F = Stable.FOCUSES;
    return UIMeta.choose({
      title: "Planned strategy",
      message: "How should " + esc(def.name) + " spend?",
      options: Object.keys(F).map(k => ({ value: k, label: F[k].name, note: F[k].note, sel: k === "mix" })),
      cancel: "Back",
    });
  }

  /* Her own style is the default and is marked as hers. Listed lead to back. */
  async function askRunStyle(def, focus) {
    const B = Stable.BUILD_FOR;
    return UIMeta.choose({
      title: Stable.FOCUSES[focus].name + " build",
      message: "Which running style should she build for? She races as " +
        (/^[AEIOU]/.test(styleName(def.style)) ? "an " : "a ") + "<b>" + esc(styleName(def.style)) + "</b>.",
      options: Object.keys(B).map(k => ({
        value: k, sel: k === def.style,
        label: styleName(k) + (k === def.style ? " · hers" : ""),
        note: B[k].note,
      })),
      cancel: "Back",
    });
  }

  /* Her aptitude on each, so the trainer can see where she is strong. Her best is marked. */
  async function askDistance(def, focus) {
    const D = Stable.DISTANCES, best = Stable.bestFor(def).distance;
    return UIMeta.choose({
      title: Stable.FOCUSES[focus].name + " build",
      message: "What distance is it for? Long races, and races her stamina will not last, want heals; short ones want pace.",
      options: Object.keys(D).map(k => ({
        value: k, sel: k === best,
        label: D[k].name + " · " + D[k].range + (k === best ? " · her best" : ""),
        note: "Her aptitude: " + aptOf(def, k),
      })),
      cancel: "Back",
    });
  }

  async function askTrack(def, focus) {
    const T = Stable.TRACKS, best = Stable.bestFor(def).surface;
    return UIMeta.choose({
      title: Stable.FOCUSES[focus].name + " build",
      message: "Which track? On ground she is weak on (C or worse) she runs behind, and cards that work on the racer in front pay more.",
      options: Object.keys(T).map(k => ({
        value: k, sel: k === best,
        label: T[k].name + (k === best ? " · her best" : ""),
        note: "Her aptitude: " + aptOf(def, k),
      })),
      cancel: "Back",
    });
  }

  /** The questions. Back steps to the previous one; null means cancelled. */
  async function askBuild(def) {
    for (;;) {
      const mode = await askMode(def);
      if (!mode) return null;
      if (mode === "simple") {
        const best = Stable.bestFor(def);
        return { simple: true, focus: "mix", runStyle: def.style, distance: best.distance, surface: best.surface };
      }
      const steps = [
        p => askFocus(def).then(v => v && (p.focus = v)),
        p => askRunStyle(def, p.focus).then(v => v && (p.runStyle = v)),
        p => askDistance(def, p.focus).then(v => v && (p.distance = v)),
        p => askTrack(def, p.focus).then(v => v && (p.surface = v)),
      ];
      const pick = {};
      let i = 0;
      while (i >= 0 && i < steps.length) i = (await steps[i](pick)) ? i + 1 : i - 1;
      if (i === steps.length) return pick;
      // Back from the first planned question: ask simple or planned again
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

    const opts = { distance: pick.distance, surface: pick.surface, simple: !!pick.simple };
    const ctx = Stable.planContext(def, pick.runStyle, opts);
    const cards = Stable.suggestDeck(racerId, pick.focus, pick.runStyle, opts);
    const res = Stable.createDeck(Stable.suggestDeckName(racerId, pick.focus, pick.runStyle, opts), cards, racerId);
    if (!res.ok) return UIMeta.notify(res.error);
    Stable.equipDeck(res.deck.id, racerId);
    selected = res.deck.id;
    racerBuild(el, racerId);

    const picked = cards.map(id => Cards.byId[id]).filter(Boolean);
    const avg = picked.length ? (picked.reduce((a, c) => a + c.cost, 0) / picked.length).toFixed(1) : "0";
    const twice = new Set(cards.filter((id, i) => cards.indexOf(id) !== i)).size;
    const D = Stable.DISTANCES[ctx.distance], T = Stable.TRACKS[ctx.surface];
    const reading = [ctx.tight ? "her stamina runs short here" : "", ctx.weak ? "she runs behind on this track" : ""]
      .filter(Boolean).join("; ");
    await UIMeta.reward({
      kicker: pick.simple ? "Her simple thoughts" : Stable.FOCUSES[pick.focus].name + " build",
      title: res.deck.name,
      message: def.name + " picked these, and is running them." + (reading ? " She reckons " + reading + "." : ""),
      items: [
        { icon: "flag", label: "Built for", amount: styleName(pick.runStyle) },
        { icon: "calendar", label: "Race", amount: D.name + " " + T.name },
        { icon: "cards", label: "Cards", amount: picked.length + (twice ? " (" + twice + " doubled)" : "") },
        { icon: "bolt", label: "Average cost", amount: avg },
        { icon: "sparkle", label: "Shape", amount: kindMix(picked) || "—" },
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
  /* `working` is a LIST, not a set: the same card can appear twice, if two are owned.
     `saved` and `savedName` are the deck as the builder opened it, so leaving can ask
     before it throws changes away; `undo` holds every earlier list, newest last. */
  let working = null;

  function edit(racerId, id) {
    const d = id ? Stable.deckById(id) : null;
    const cards = d ? d.cards.slice() : [];
    const name = d ? d.name : suggestName(racerId);
    working = { racerId, id: d ? d.id : null, name, cards, saved: cards.slice(), savedName: name, undo: [] };
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

  const dirty = () => !!working && (working.name.trim() !== working.savedName.trim() ||
    working.cards.slice().sort().join() !== working.saved.slice().sort().join());

  // ---------------------------------------------------------------- sorting and filtering
  /* The pool is every card she could put in. It is sorted, filtered and searched here and
     never changed. How it is shown lasts the session; the sort is also remembered on this
     device, since a trainer who sorts by cost wants it that way every time. */
  const KINDS = ["Burst", "Gamble", "Recovery", "Tempo", "Counter", "Support"];
  const RARITY = { C: "Common", R: "Rare", E: "Epic" };
  const RANK = { C: 1, R: 2, E: 3 };
  const TIMING = { any: "Any phase", opening: "Opening only", final: "Final only" };
  const SORT_KEY = "postparade.deckSort";

  /* Each sort's own order (cheapest, rarest, most owned first), then one tie-break for
     all of them, so cards that sort equal never shuffle between redraws. */
  const SORTS = {
    cost:   { name: "Cost", dirs: ["Low first", "High first"],
              cmp: (a, b) => a.cost - b.cost },
    kind:   { name: "Kind", dirs: ["Burst first", "Support first"],
              cmp: (a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind) },
    rarity: { name: "Rarity", dirs: ["Epic first", "Common first"],
              cmp: (a, b) => RANK[b.rarity] - RANK[a.rarity] },
    name:   { name: "Name", dirs: ["A to Z", "Z to A"],
              cmp: (a, b) => a.ability.localeCompare(b.ability) || a.name.localeCompare(b.name) },
    owned:  { name: "Copies owned", dirs: ["Most first", "Fewest first"],
              cmp: (a, b) => Stable.cardCount(b.id) - Stable.cardCount(a.id) },
    deck:   { name: "In deck first", dirs: ["In deck first", "In deck last"],
              cmp: (a, b, used) => (used[b.id] || 0) - (used[a.id] || 0) },
  };
  const tieBreak = (a, b) => a.cost - b.cost || KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind) ||
    a.ability.localeCompare(b.ability) || a.id.localeCompare(b.id);

  const view = { q: "", sort: "cost", dir: 1, kinds: [], costs: [], rars: [], timings: [], notIn: false, open: null };
  try {
    const s = JSON.parse(localStorage.getItem(SORT_KEY) || "null");
    if (s && SORTS[s.sort]) { view.sort = s.sort; view.dir = s.dir === -1 ? -1 : 1; }
  } catch (e) {}
  const keepSort = () => {
    try { localStorage.setItem(SORT_KEY, JSON.stringify({ sort: view.sort, dir: view.dir })); } catch (e) {}
  };

  const timingOf = c => !c.phases || c.phases.length >= 3 ? "any"
    : c.phases.every(p => p === 0) ? "opening" : c.phases.every(p => p === 2) ? "final" : "other";
  const filterCount = () => [view.kinds.length, view.costs.length, view.rars.length,
    view.timings.length, view.notIn].filter(Boolean).length;
  const flip = (arr, v) => { const i = arr.indexOf(v); if (i < 0) arr.push(v); else arr.splice(i, 1); };
  const countIn = cards => { const m = {}; for (const id of cards) m[id] = (m[id] || 0) + 1; return m; };
  const costsOf = () => Array.from(new Set(Cards.CARDS.map(c => c.cost))).sort((a, b) => a - b);
  const touchFirst = () => !!(root.matchMedia && matchMedia("(hover: none)").matches);

  /* What a search reads: the face of the card, and the plain words of its details, so
     "slipstream" or "stamina back" finds the cards that do it. Built once per card. */
  const hayCache = {};
  function searchText(c) {
    if (hayCache[c.id]) return hayCache[c.id];
    const d = root.CardDetail ? CardDetail.describe(c) : { does: [], when: [], traits: [] };
    const words = [c.ability, c.name, c.kind, RARITY[c.rarity], c.blurb]
      .concat(d.does, d.when, d.traits).join(" ").replace(/<[^>]+>/g, "");
    return (hayCache[c.id] = words.toLowerCase());
  }

  function shown(used) {
    const words = view.q.toLowerCase().split(/\s+/).filter(Boolean);
    const S = SORTS[view.sort] || SORTS.cost;
    return Stable.ownedCards().filter(c => {
      if (view.kinds.length && view.kinds.indexOf(c.kind) < 0) return false;
      if (view.costs.length && view.costs.indexOf(c.cost) < 0) return false;
      if (view.rars.length && view.rars.indexOf(c.rarity) < 0) return false;
      if (view.timings.length && view.timings.indexOf(timingOf(c)) < 0) return false;
      if (view.notIn && used[c.id]) return false;
      if (words.length) {
        const hay = searchText(c);
        if (!words.every(w => hay.indexOf(w) >= 0)) return false;
      }
      return true;
    }).sort((a, b) => view.dir * S.cmp(a, b, used) || tieBreak(a, b));
  }

  // ---------------------------------------------------------------- drawing
  /* The screen is laid out once; after that only the parts a change touches are redrawn.
     Rebuilding the whole screen per click (as the first builder did) threw away the
     scroll position, the caret in the search box and the focused card every time. */
  let shownIds = [];

  function editBuild(el) {
    if (!working) return listBuild(el);
    const def = Stable.defOf(working.racerId);
    if (view.open == null) view.open = !(root.matchMedia && matchMedia("(max-width: 859px)").matches);
    shownIds = [];

    el.innerHTML = `
      ${Bg.layer("stable")}
      <div class="scr-wrap">
        ${UIMeta.resourceBar({ back: false })}
        <div class="panel pop de-panel">
          <div class="panel-hd blue">${Icon("cards")}${working.id ? "Edit deck" : "New deck"}${
            def ? " &middot; " + esc(def.name) : ""}</div>

          <div class="de-head">
            <label class="de-name">
              <span>Deck name</span>
              <input id="deName" type="text" maxlength="24" value="${esc(working.name)}"
                     placeholder="Name this deck" autocomplete="off">
            </label>
          </div>

          <div class="de-cols">
            <section class="de-side" aria-label="This deck">
              <div class="de-board" id="deBoard"></div>
              <div class="de-strip" id="deStrip"></div>
              <div class="de-side-acts">
                <button class="btn ghost sm" id="deUndo" title="Undo (Ctrl+Z)">Undo</button>
                <button class="btn ghost sm" id="deClear">Clear</button>
              </div>
              <button class="btn gold" id="deAuto">Let ${def ? esc(def.name) : "her"} decide</button>
              <div class="de-save">
                <button class="btn" id="deSave">${working.id ? "Save changes" : "Create deck"}</button>
                <button class="btn ghost" id="deCancel">Cancel</button>
              </div>
            </section>

            <section class="de-main" aria-label="Your cards">
              <div class="de-tools" id="deFilters">
                <div class="de-trow">
                  <input class="de-search" id="deSearch" type="search" placeholder="Search cards"
                         aria-label="Search cards" autocomplete="off" value="${esc(view.q)}">
                  <label class="de-sort"><span>Sort</span>
                    <select id="deSort">${Object.keys(SORTS).map(k =>
                      `<option value="${k}" ${k === view.sort ? "selected" : ""}>${SORTS[k].name}</option>`).join("")}
                    </select></label>
                  <button class="de-dir" id="deSortDir" type="button"></button>
                  <button class="de-ftog" id="deFiltTog" type="button" aria-controls="deFGroups"></button>
                </div>
                <div class="de-fgroups" id="deFGroups">
                  <div class="de-fg"><span class="de-fl">Kind</span><div class="de-seg">${KINDS.map(k =>
                    `<button type="button" data-fk="${k}"><i class="kdot k${k}"></i>${k}</button>`).join("")}</div></div>
                  <div class="de-fg"><span class="de-fl">Cost</span><div class="de-seg">${costsOf().map(n =>
                    `<button type="button" class="num" data-fc="${n}">${n}</button>`).join("")}</div></div>
                  <div class="de-fg"><span class="de-fl">Rarity</span><div class="de-seg">${["C", "R", "E"].map(r =>
                    `<button type="button" data-fr="${r}">${RARITY[r]}</button>`).join("")}</div></div>
                  <div class="de-fg"><span class="de-fl">Timing</span><div class="de-seg">${Object.keys(TIMING).map(t =>
                    `<button type="button" data-ft="${t}">${TIMING[t]}</button>`).join("")}</div></div>
                  <div class="de-fg"><span class="de-fl">Deck</span><div class="de-seg"><button
                    type="button" data-fn="1">Not in deck</button></div></div>
                </div>
                <div class="de-showing" id="deShowing"></div>
              </div>
              <div class="dgrid de-pool" id="dePool"></div>
            </section>
          </div>
        </div>
      </div>`;

    UIMeta.wireResourceBar(el);
    paintTools(el);
    paint(el);

    /* Typing re-validates without a redraw: a redraw would take the caret with it. */
    const nameEl = el.querySelector("#deName");
    nameEl.oninput = () => { working.name = nameEl.value; paintBoard(el); };

    // the pool: a click adds, the minus drops one, Enter / Delete do the same from the keys
    const pool = el.querySelector("#dePool");
    pool.onclick = e => {
      if (e.target.closest("[data-reset]")) return resetFilters(el);
      const minus = e.target.closest("[data-minus]");
      if (minus) return dropCard(el, minus.dataset.minus);
      const t = e.target.closest("[data-card]");
      if (t) addCard(el, t.dataset.card);
    };
    pool.onkeydown = e => {
      const t = e.target.closest("[data-card]");
      if (!t) return;
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); addCard(el, t.dataset.card); }
      else if (e.key === "Delete" || e.key === "Backspace" || e.key === "-") {
        e.preventDefault(); dropCard(el, t.dataset.card);
      } else if (/^Arrow/.test(e.key)) { e.preventDefault(); moveFocus(pool, t, e.key); }
    };
    // the deck: a click drops that card's last copy
    const strip = el.querySelector("#deStrip");
    strip.onclick = e => { const b = e.target.closest("[data-drop]"); if (b) dropCard(el, b.dataset.drop); };
    // hold, right-click or I: the card's details (carddetail.js), never an add
    if (root.CardDetail) {
      CardDetail.hold(pool, { open: id => detail(el, id, false) });
      CardDetail.hold(strip, { open: id => detail(el, id, true) });
    }

    const tools = el.querySelector("#deFilters");
    tools.onclick = e => {
      const b = e.target.closest("button");
      if (!b) return;
      const d = b.dataset;
      if (d.fk) flip(view.kinds, d.fk);
      else if (d.fc) flip(view.costs, +d.fc);
      else if (d.fr) flip(view.rars, d.fr);
      else if (d.ft) flip(view.timings, d.ft);
      else if (d.fn) view.notIn = !view.notIn;
      else if (d.reset) return resetFilters(el);
      else if (b.id === "deFiltTog") { view.open = !view.open; return paintTools(el); }
      else if (b.id === "deSortDir") { view.dir = -view.dir; keepSort(); }
      else return;
      paintTools(el);
      paintPool(el);
    };
    const sortEl = el.querySelector("#deSort");
    sortEl.onchange = () => { view.sort = sortEl.value; view.dir = 1; keepSort(); paintTools(el); paintPool(el); };
    const search = el.querySelector("#deSearch");
    search.oninput = () => { view.q = search.value; paintPool(el); };
    search.onkeydown = e => {
      if (e.key === "Escape" && search.value) {
        e.preventDefault(); e.stopPropagation();
        search.value = view.q = "";
        paintPool(el);
      }
    };
    // Ctrl+Z undoes a card (not typing, which has its own undo); / jumps to the search
    el.onkeydown = e => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      if (typing) return;
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === "z" || e.key === "Z")) { e.preventDefault(); undo(el); }
      else if (e.key === "/") { e.preventDefault(); search.focus(); }
    };

    el.querySelector("#deUndo").onclick = () => undo(el);
    el.querySelector("#deClear").onclick = () => {
      if (!working.cards.length) return;
      change(el, []);
      toast(el, "Cleared. Undo puts them back.");
    };

    /* In the builder it fills the working set rather than creating a deck, so the pick
       is a starting point you can still edit -- and Undo takes it back. */
    el.querySelector("#deAuto").onclick = async () => {
      if (!def) return;
      if (!Stable.ownedCards().length) return UIMeta.notify("You own no cards yet. Scout some first.");
      const pick = await askBuild(def);
      if (!pick || !working) return;
      const opts = { distance: pick.distance, surface: pick.surface, simple: !!pick.simple };
      change(el, Stable.suggestDeck(working.racerId, pick.focus, pick.runStyle, opts));
      if (!working.id) {
        working.name = nameEl.value = Stable.suggestDeckName(working.racerId, pick.focus, pick.runStyle, opts);
        paintBoard(el);
      }
      toast(el, def.name + " picked " + working.cards.length + ". Undo puts yours back.");
    };
    el.querySelector("#deCancel").onclick = async () => {
      if (dirty() && !await UIMeta.ask({
        title: "Leave the builder", danger: true,
        message: "Throw away your changes to this deck?",
        confirm: "Discard", cancel: "Keep building",
      })) return;
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

  function paint(el) { paintBoard(el); paintStrip(el); paintPool(el); }

  /* The board: how full, how dear, the cost curve, the kind mix and when the cards can be
     played -- the shape of the deck at a glance, and Stable's verdict on it. */
  function paintBoard(el) {
    const cards = working.cards.map(id => Cards.byId[id]).filter(Boolean);
    const n = cards.length;
    const err = Stable.checkDeck(working.name, working.cards);
    const avg = n ? (cards.reduce((a, c) => a + c.cost, 0) / n).toFixed(1) : "–";
    const costs = costsOf();
    const curve = costs.map(k => cards.filter(c => c.cost === k).length);
    const peak = Math.max(1, ...curve);
    const mix = KINDS.map(k => [k, cards.filter(c => c.kind === k).length]).filter(x => x[1]);
    const t = { any: 0, opening: 0, final: 0 };
    for (const c of cards) { const k = timingOf(c); if (k in t) t[k]++; }

    el.querySelector("#deBoard").innerHTML = `
      <div class="db-top">
        <div class="db-count ${err ? "bad" : "ok"}"><b>${n}</b><i>/ ${MAX()}</i></div>
        <div class="db-avg"><b>${avg}</b><i>avg cost</i></div>
        <div class="db-curve" role="img" aria-label="Cost curve: ${
          costs.map((k, i) => curve[i] + " costing " + k).join(", ")}">${costs.map((k, i) => `
          <span><em>${curve[i] || ""}</em><i style="height:${Math.round(curve[i] / peak * 28)}px"></i><u>${k}</u></span>`).join("")}
        </div>
      </div>
      <div class="db-mix">${mix.length ? mix.map(([k, m]) => `<i class="kdot k${k}" style="flex:${m}"></i>`).join("")
        : `<i class="none"></i>`}</div>
      <div class="db-legend">${mix.length ? mix.map(([k, m]) => `<span><i class="kdot k${k}"></i>${m} ${k}</span>`).join("")
        : "<span>No cards yet</span>"}</div>
      <div class="db-time">${n ? [t.any && t.any + " any time", t.opening && t.opening + " opening only",
        t.final && t.final + " final only"].filter(Boolean).join(" &middot; ") : "&nbsp;"}</div>
      <div class="db-msg ${err ? "bad" : "ok"}">${err ? esc(err) : "Ready to race."}</div>`;

    el.querySelector("#deSave").disabled = !!err;
    el.querySelector("#deUndo").disabled = !working.undo.length;
    el.querySelector("#deClear").disabled = !n;
  }

  /** The deck's cards once each, cheapest first, the way the board reads them. */
  function stripIds() {
    const seen = {};
    return working.cards.filter(id => !seen[id] && (seen[id] = true))
      .map(id => Cards.byId[id]).filter(Boolean).sort(tieBreak).map(c => c.id);
  }

  /* The deck itself: one entry per card, its copies counted on it. A list down the side on
     a wide screen, a row of chips on a phone -- the same buttons, laid out by CSS. */
  function paintStrip(el) {
    const strip = el.querySelector("#deStrip");
    const used = countIn(working.cards);
    const ids = stripIds();
    // keep the keyboard where it was: on the same card, or the one that took its place
    const act = document.activeElement;
    const had = act && strip.contains(act) ? act.dataset.card : null;
    const hadAt = had ? [...strip.querySelectorAll("[data-card]")].indexOf(act) : -1;

    strip.innerHTML = ids.length ? ids.map(id => {
      const c = Cards.byId[id], n = used[id];
      return `<button class="de-item" type="button" data-card="${id}" data-drop="${id}"
          aria-label="${esc(c.ability)}, cost ${c.cost}${n > 1 ? ", " + n + " copies" : ""}. Remove one.">
        <span class="de-cost">${c.cost}</span>
        <img src="assets/cards/${id}.png" alt="" draggable="false">
        <span class="de-nm"><b>${esc(c.ability)}</b><i>${esc(c.name)}</i></span>
        ${n > 1 ? `<span class="de-n">&times;${n}</span>` : ""}
        <span class="de-x" aria-hidden="true">&minus;</span>
      </button>`;
    }).join("") : `<p class="de-none">Empty. Add at least ${MIN()} cards from your collection.</p>`;

    if (had) {
      const items = strip.querySelectorAll("[data-card]");
      const back = strip.querySelector('[data-card="' + had + '"]') || items[Math.min(hadAt, items.length - 1)];
      if (back) back.focus({ preventScroll: true });
    }
  }

  const tileClass = (n, allowed) => "dcard" + (n ? " in" : "") + (n && n >= allowed ? " cap" : "") +
    (!n && (working.cards.length >= MAX() || allowed < 1) ? " full" : "");
  const tileLabel = (c, n, allowed) =>
    `${c.ability}, ${c.kind}, ${RARITY[c.rarity]}, cost ${c.cost}. ${n} of ${allowed} in deck.`;
  const minusHTML = c => `<button class="de-minus" type="button" data-minus="${c.id}" data-nohold="1" tabindex="-1"
    aria-label="Remove a copy of ${esc(c.ability)}">&minus;</button>`;

  function ownHTML(n, allowed, have) {
    const slots = Array.from({ length: Math.max(1, allowed) }, (_, i) =>
      `<i class="${i < n ? "on" : ""}"></i>`).join("");
    return `<span class="de-slots">${slots}</span>${n} of ${allowed} in deck${
      have > allowed ? ` <em>&middot; own ${have}</em>` : ""}`;
  }

  function tileHTML(c, used) {
    const n = used[c.id] || 0, allowed = Stable.copiesAllowed(c.id);
    return `
      <div class="${tileClass(n, allowed)}" role="button" tabindex="0" data-card="${c.id}"
           aria-label="${esc(tileLabel(c, n, allowed))}">
        <div class="cost">${c.cost}</div>
        <img src="assets/cards/${c.id}.png" alt="" draggable="false">
        ${n ? minusHTML(c) : ""}
        <div class="ci">
          <div class="kind"><i class="kdot k${c.kind}"></i>${c.kind} &middot; ${RARITY[c.rarity]}</div>
          <div class="cn">${esc(c.ability)}</div>
          <div class="cb cw">${esc(c.name)}</div>
          <div class="cb">${esc(c.blurb)}</div>
          <div class="de-own">${ownHTML(n, allowed, Stable.cardCount(c.id))}</div>
        </div>
      </div>`;
  }

  /* A tile whose card is still shown in the same place is patched where it stands, so
     the art is not reloaded and the focus stays on it. */
  function patchTile(node, c, used) {
    const n = used[c.id] || 0, allowed = Stable.copiesAllowed(c.id);
    node.className = tileClass(n, allowed);
    node.setAttribute("aria-label", tileLabel(c, n, allowed));
    node.querySelector(".de-own").innerHTML = ownHTML(n, allowed, Stable.cardCount(c.id));
    const m = node.querySelector(".de-minus");
    if (n && !m) node.querySelector("img").insertAdjacentHTML("afterend", minusHTML(c));
    else if (!n && m) m.remove();
  }

  function paintPool(el) {
    const pool = el.querySelector("#dePool");
    const used = countIn(working.cards);
    const list = shown(used);
    const ids = list.map(c => c.id);
    if (ids.length && ids.join() === shownIds.join() && pool.children.length === ids.length) {
      for (const node of pool.children) patchTile(node, Cards.byId[node.dataset.card], used);
    } else {
      const act = document.activeElement;
      const had = act && pool.contains(act) ? act.dataset.card : null;
      pool.innerHTML = list.length ? list.map(c => tileHTML(c, used)).join("")
        : `<p class="de-none">No cards match.${filterCount() || view.q
            ? ` <button type="button" class="btn ghost sm" data-reset="1">Clear filters</button>` : ""}</p>`;
      shownIds = ids;
      const back = had && pool.querySelector('[data-card="' + had + '"]');
      if (back) back.focus({ preventScroll: true });
    }
    const all = Stable.ownedCards().length;
    el.querySelector("#deShowing").innerHTML =
      `<span>Showing <b>${list.length}</b> of ${all}</span>` +
      (filterCount() || view.q ? `<button type="button" class="de-reset" data-reset="1">Clear filters</button>` : "") +
      `<span class="de-hint">${touchFirst() ? "Tap to add &middot; hold to read"
        : "Click to add &middot; hold or right-click to read"}</span>`;
  }

  function paintTools(el) {
    const mark = (sel, on) => el.querySelectorAll(sel).forEach(b => {
      const v = !!on(b);
      b.classList.toggle("on", v);
      b.setAttribute("aria-pressed", v ? "true" : "false");
    });
    mark("[data-fk]", b => view.kinds.indexOf(b.dataset.fk) >= 0);
    mark("[data-fc]", b => view.costs.indexOf(+b.dataset.fc) >= 0);
    mark("[data-fr]", b => view.rars.indexOf(b.dataset.fr) >= 0);
    mark("[data-ft]", b => view.timings.indexOf(b.dataset.ft) >= 0);
    mark("[data-fn]", () => view.notIn);
    const S = SORTS[view.sort] || SORTS.cost;
    const dir = el.querySelector("#deSortDir");
    dir.textContent = S.dirs[view.dir > 0 ? 0 : 1];
    dir.title = "Reverse: " + S.dirs[view.dir > 0 ? 1 : 0];
    const n = filterCount(), tog = el.querySelector("#deFiltTog");
    tog.innerHTML = "Filters" + (n ? ` <b>${n}</b>` : "");
    tog.classList.toggle("on", !!view.open);
    tog.setAttribute("aria-expanded", view.open ? "true" : "false");
    el.querySelector("#deFGroups").hidden = !view.open;
  }

  function resetFilters(el) {
    view.kinds = []; view.costs = []; view.rars = []; view.timings = []; view.notIn = false; view.q = "";
    el.querySelector("#deSearch").value = "";
    paintTools(el);
    paintPool(el);
  }

  function moveFocus(pool, t, key) {
    const tiles = [...pool.querySelectorAll("[data-card]")];
    const i = tiles.indexOf(t);
    const cols = Math.max(1, getComputedStyle(pool).gridTemplateColumns.split(" ").length);
    const j = key === "ArrowRight" ? i + 1 : key === "ArrowLeft" ? i - 1
            : key === "ArrowDown" ? i + cols : i - cols;
    if (tiles[j]) tiles[j].focus();
  }

  // ---------------------------------------------------------------- changing the deck
  /* Every rule is Stable's: an add is refused for whatever Stable.cantAdd says, the same
     reasons Stable.checkDeck gives for a whole deck. */
  function change(el, next) {
    working.undo.push(working.cards);
    if (working.undo.length > 80) working.undo.shift();
    working.cards = next;
    paint(el);
  }

  function addCard(el, id) {
    const why = Stable.cantAdd(working.cards, id);
    if (why) return toast(el, why);
    change(el, working.cards.concat(id));
    if (root.Shell && Shell.notify) Shell.notify("deckAdd");
  }

  function dropCard(el, id) {
    const i = working.cards.lastIndexOf(id);
    if (i < 0) return;
    const next = working.cards.slice();
    next.splice(i, 1);
    change(el, next);
    if (root.Shell && Shell.notify) Shell.notify("deckDrop");
  }

  function undo(el) {
    if (!working || !working.undo.length) return;
    working.cards = working.undo.pop();
    paint(el);
  }

  /* A refusal is a line at the foot of the screen, not a dialog to dismiss: on a phone
     the deck is scrolled out of sight, and this is the only sign the add did not land. */
  let toastTimer = 0;
  function toast(el, msg) {
    let t = el.querySelector(".de-toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "de-toast";
      t.setAttribute("role", "status");
      el.appendChild(t);
    }
    t.textContent = msg;
    t.classList.remove("on");
    void t.offsetWidth;
    t.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("on"), 2600);
  }

  /* The card's details, with Add and Remove on them, stepping through the cards in the
     order they were opened from: the pool as sorted and filtered, or the deck. */
  function detail(el, id, fromDeck) {
    CardDetail.open(id, {
      list: fromDeck ? stripIds() : shownIds.slice(),
      info: cid => {
        const why = Stable.cantAdd(working.cards, cid);
        return {
          deck: { owned: Stable.cardCount(cid), allowed: Stable.copiesAllowed(cid),
                  inDeck: working.cards.filter(x => x === cid).length, copyMax: Stable.COPY_MAX },
          // the copy limits are on the slots already; a full deck is the one to spell out
          note: why && working.cards.length >= MAX() ? why : null,
        };
      },
      actions: cid => [
        { value: "add", label: "Add a copy", disabled: !!Stable.cantAdd(working.cards, cid) },
        { value: "drop", label: "Remove a copy", cls: "ghost", disabled: working.cards.indexOf(cid) < 0 },
      ],
      onAction: (v, cid) => v === "add" ? addCard(el, cid) : dropCard(el, cid),
    });
  }

  const api = { listBuild, racerBuild, editBuild };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.UIDecks = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
