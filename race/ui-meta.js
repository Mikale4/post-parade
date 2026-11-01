/*
 * The meta screens: choosing a starter, the scout, the stable, and the quest board.
 *
 * These are the front end for stable.js and quests.js. They own no rules of their own --
 * every button here calls into those modules and renders whatever comes back, so the
 * headless validators and the screens can never disagree about what is legal.
 *
 * Navigation borrows Shell.go/Shell.show so these screens behave like every other one.
 *
 * Exposes UIMeta.
 */
(function (root) {
  "use strict";

  const esc = s => String(s).replace(/[&<>"]/g,
    c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  /* Art lives beside the game in a folder whose filenames contain spaces, so every
     sprite path has to be encoded before it goes into a src attribute. */
  const art = p => encodeURI(String(p || ""));
  const go = (id, build) => Shell.go(id, build);
  const RARITY_STAR = n => "★".repeat(n);
  /* Her gate colour: one of the eight 枠色, fixed per racer, used wherever a number
     cloth would be. */
  const gateOf = id => (Stable.ROSTER.findIndex(r => r.id === id) % 8 + 8) % 8 + 1;
  const gateCell = id => { const g = gateOf(id);
    return `<span class="gatecell" style="background:var(--w${g});${g === 1 || g === 5 ? "color:var(--ink)" : ""}">${g}</span>`; };
  const DIST_NAME = { sprint: "Sprint", mile: "Mile", medium: "Medium", long: "Long" };
  /** Aptitude as the real game shows it: a Track row and a Distance row of letter grades. */
  function aptGrid(d) {
    const a = d.aptitude || {}, cell = (info, label, grade) =>
      `<span class="ac" data-info="${info}">${label}<b class="g g${grade}">${grade}</b></span>`;
    return `<div class="aptgrid">
      <span class="ak">Track</span>${cell("surf:turf", "Turf", a.turf)}${cell("surf:dirt", "Dirt", a.dirt)}<span class="blank"></span><span class="blank"></span>
      <span class="ak">Distance</span>${["sprint", "mile", "medium", "long"].map(k => cell("dist:" + k, DIST_NAME[k], a[k])).join("")}
    </div>`;
  }
  /* A stat as a letter, on this game's 0-1200 racer scale: the bar says how much, the
     letter says how good. */
  const STAT_GRADES = [[1100, "SS"], [1000, "S"], [900, "A"], [800, "B"], [700, "C"], [600, "D"], [500, "E"], [400, "F"], [0, "G"]];
  const statGrade = v => (STAT_GRADES.find(([t]) => v >= t) || [0, "G"])[1];
  const styleName = d => (root.Sim && Sim.STYLES[d.style]) ? Sim.STYLES[d.style].name : d.style;
  const num = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // ---------------------------------------------------------------- dialogs
  /* In-game replacements for confirm() and alert().
     Native dialogs are not usable here: embedded views auto-dismiss them (which makes
     confirm() return false and the action silently do nothing), and browsers let a user
     permanently block a page's dialogs. Gating a game action on that is a trap. These
     also simply look right next to the rest of the UI. */
  let askEl = null;

  function askHost() {
    if (!askEl) {
      askEl = document.createElement("div");
      askEl.id = "ask";
      document.body.appendChild(askEl);
    }
    return askEl;
  }

  /**
   * Ask a yes/no question. Resolves true/false -- never throws, and never leaves the
   * dialog on screen. Enter confirms, Escape and the backdrop cancel.
   */
  function ask(opts) {
    opts = opts || {};
    return new Promise(resolve => {
      const el = askHost();
      el.className = "on";
      el.innerHTML = `
        <div class="ask-card pop">
          <div class="panel-hd ${opts.danger ? "" : "blue"}">${esc(opts.title || "Confirm")}</div>
          <div class="ask-body">
            <p>${esc(opts.message || "")}</p>
            ${opts.detail ? `<p class="ask-detail">${esc(opts.detail)}</p>` : ""}
            <div class="ask-btns">
              <button class="btn ${opts.danger ? "pink" : ""}" id="askYes">${
                esc(opts.confirm || "Confirm")}</button>
              ${opts.cancel === null ? "" :
                `<button class="btn ghost" id="askNo">${esc(opts.cancel || "Cancel")}</button>`}
            </div>
          </div>
        </div>`;

      let done = false;
      const finish = v => {
        if (done) return;
        done = true;
        document.removeEventListener("keydown", onKey, true);
        el.className = "";
        el.innerHTML = "";
        resolve(v);
      };
      function onKey(e) {
        if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); finish(false); }
        else if (e.key === "Enter") { e.stopPropagation(); e.preventDefault(); finish(true); }
      }
      document.addEventListener("keydown", onKey, true);
      el.querySelector("#askYes").onclick = () => finish(true);
      const no = el.querySelector("#askNo");
      if (no) no.onclick = () => finish(false);
      el.onclick = e => { if (e.target === el) finish(false); };
      setTimeout(() => { const b = el.querySelector("#askYes"); if (b) b.focus(); }, 40);
    });
  }

  /**
   * Ask for a line of text. Resolves the string, or null if cancelled -- the same shape
   * as prompt(), which is unusable here for the reasons given above `ask`.
   */
  function prompt(opts) {
    opts = opts || {};
    return new Promise(resolve => {
      const el = askHost();
      el.className = "on";
      el.innerHTML = `
        <div class="ask-card pop">
          <div class="panel-hd blue">${esc(opts.title || "")}</div>
          <div class="ask-body">
            ${opts.message ? `<p>${opts.message}</p>` : ""}
            <input class="ask-input" id="askIn" type="text" maxlength="${opts.max || 24}"
                   placeholder="${esc(opts.placeholder || "")}"
                   value="${esc(opts.value == null ? "" : opts.value)}">
            <div class="ask-btns">
              <button class="btn" id="askYes">${esc(opts.confirm || "OK")}</button>
              <button class="btn ghost" id="askNo">${esc(opts.cancel || "Cancel")}</button>
            </div>
          </div>
        </div>`;

      let done = false;
      const finish = v => {
        if (done) return;
        done = true;
        document.removeEventListener("keydown", onKey, true);
        el.className = ""; el.innerHTML = "";
        resolve(v);
      };
      const val = () => {
        const s = (el.querySelector("#askIn") || {}).value;
        return s == null ? "" : s;
      };
      function onKey(e) {
        if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); finish(null); }
        else if (e.key === "Enter") { e.stopPropagation(); e.preventDefault(); finish(val()); }
      }
      document.addEventListener("keydown", onKey, true);
      el.querySelector("#askYes").onclick = () => finish(val());
      el.querySelector("#askNo").onclick = () => finish(null);
      el.onclick = e => { if (e.target === el) finish(null); };
      setTimeout(() => {
        const i = el.querySelector("#askIn");
        if (i) { i.focus(); i.select(); }
      }, 40);
    });
  }

  /**
   * Pick one of a list. Resolves the chosen option's `value`, or null if cancelled.
   * Options are { value, label, note, art, sel }.
   */
  function choose(opts) {
    opts = opts || {};
    const list = opts.options || [];
    return new Promise(resolve => {
      const el = askHost();
      el.className = "on";
      el.innerHTML = `
        <div class="ask-card pop wide">
          <div class="panel-hd blue">${esc(opts.title || "Choose")}</div>
          <div class="ask-body">
            ${opts.message ? `<p>${opts.message}</p>` : ""}
            <div class="ask-list">
              ${list.map(o => `
                <button class="ask-opt ${o.sel ? "sel" : ""}" data-val="${esc(o.value)}">
                  ${o.bust && root.Voxel && Voxel.ok && Voxel.bustHTML ? Voxel.bustHTML(o.bust, "", o.art ? art(o.art) : "")
                    : o.art ? `<img src="${art(o.art)}" alt="">` : ""}
                  <span class="ao-t"><b>${esc(o.label)}</b>
                    ${o.note ? `<i>${esc(o.note)}</i>` : ""}</span>
                </button>`).join("")}
            </div>
            <div class="ask-btns">
              <button class="btn ghost" id="askNo">${esc(opts.cancel || "Cancel")}</button>
            </div>
          </div>
        </div>`;

      let done = false;
      const finish = v => {
        if (done) return;
        done = true;
        document.removeEventListener("keydown", onKey, true);
        el.className = ""; el.innerHTML = "";
        resolve(v);
      };
      function onKey(e) {
        if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); finish(null); }
      }
      document.addEventListener("keydown", onKey, true);
      el.querySelectorAll("[data-val]").forEach(b => b.onclick = () => finish(b.dataset.val));
      el.querySelector("#askNo").onclick = () => finish(null);
      el.onclick = e => { if (e.target === el) finish(null); };
      // a marked option is the default, so Enter takes it
      setTimeout(() => { const b = el.querySelector(".ask-opt.sel"); if (b) b.focus(); }, 40);
    });
  }

  /**
   * An explanation panel. Unlike `notify` this renders authored HTML -- tables, card art,
   * the grade curve -- because what it exists to show is a small document, not a line of
   * text. Content comes from glossary.js and is never player-typed.
   */
  function info(opts) {
    opts = opts || {};
    return new Promise(resolve => {
      const el = askHost();
      el.className = "on";
      el.innerHTML = `
        <div class="ask-card pop info-card">
          <div class="panel-hd blue">${esc(opts.title || "")}</div>
          <div class="ask-body info-body">
            <div class="info-content">${opts.html || ""}</div>
            <div class="ask-btns">
              <button class="btn" id="askYes">${esc(opts.close || "Got it")}</button>
            </div>
          </div>
        </div>`;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        document.removeEventListener("keydown", onKey, true);
        el.className = ""; el.innerHTML = "";
        resolve();
      };
      function onKey(e) {
        if (e.key === "Escape" || e.key === "Enter") {
          e.stopPropagation(); e.preventDefault(); finish();
        }
      }
      document.addEventListener("keydown", onKey, true);
      el.querySelector("#askYes").onclick = finish;
      el.onclick = e => { if (e.target === el) finish(); };
      setTimeout(() => { const b = el.querySelector("#askYes"); if (b) b.focus(); }, 40);
    });
  }

  /**
   * Wire every [data-info] label inside `el` to its explanation.
   * The labels sit INSIDE the big racer button on the starter screen, so the click has to
   * be stopped from also choosing that racer -- reading about a grade must never commit
   * you to the racer it belongs to.
   */
  function wireInfo(el, defFor) {
    el.querySelectorAll("[data-info]").forEach(n => {
      n.setAttribute("tabindex", "0");
      const open = e => {
        e.preventDefault();
        e.stopPropagation();
        const [kind, key] = n.dataset.info.split(":");
        const owner = n.closest("[data-owner]");
        const def = typeof defFor === "function"
          ? defFor(owner ? owner.dataset.owner : null)
          : (defFor || null);
        const g = root.Glossary ? Glossary.look(kind, key, def) : null;
        if (g) info(g);
      };
      n.onclick = open;
      n.onkeydown = e => { if (e.key === "Enter" || e.key === " ") open(e); };
    });
  }

  /** Tell the player something. Replaces alert(); returns a promise but ignoring it is fine. */
  function notify(message, opts) {
    opts = opts || {};
    return ask({ title: opts.title || "Notice", message,
                 confirm: opts.ok || "OK", cancel: null })
      .then(() => undefined);
  }

  // ---------------------------------------------------------------- header
  /* One resource strip, reused on every meta screen so carrots and stamina are never
     more than a glance away. */
  function resourceBar(opts) {
    opts = opts || {};
    const s = Stable.summary();
    const st = s.stamina;
    const waiting = Quests.claimable();
    return `
      <div class="resbar">
        ${opts.back === false ? "" :
          `<button class="btn ghost sm" data-res="back">${Icon("back")}Back</button>`}
        <div class="res carrot" title="Carrots">${Icon("carrot")}<b>${num(s.carrots)}</b></div>
        <div class="res stam ${st.cur < 30 ? "low" : ""}" title="Stamina">${Icon("bolt")}<b>${st.cur}</b><i>/${st.max}</i>
          <span class="stbar"><span style="width:${(st.cur / st.max * 100).toFixed(0)}%"></span></span>
        </div>
        <button class="btn ghost sm ${waiting ? "hasnew" : ""}" data-res="quests">
          ${Icon("clipboard")}Quests${waiting ? `<span class="badge">${waiting}</span>` : ""}</button>
      </div>`;
  }

  function wireResourceBar(el, back) {
    const b = el.querySelector('[data-res="back"]');
    if (b) b.onclick = back || (() => Shell.toMenu());
    const q = el.querySelector('[data-res="quests"]');
    if (q) q.onclick = () => go("scr-quests", questsBuild);
  }

  /** Redraw just the resource strip after something spends or grants. */
  function refreshBar(el, back) {
    const bar = el.querySelector(".resbar");
    if (!bar) return;
    bar.outerHTML = resourceBar({ back: back !== false });
    wireResourceBar(el, typeof back === "function" ? back : null);
  }

  // ---------------------------------------------------------------- starter
  /* The first real decision an account makes. Shown once, and it cannot be undone, so
     the five are laid out with everything needed to choose between them. */
  function starterBuild(el) {
    const picks = Stable.STARTERS.map(id => Stable.defOf(id)).filter(Boolean);
    el.innerHTML = `
      ${Bg.layer("starter")}
      <div class="starter-wrap">
        <div class="starter-head pop">
          <div class="uma-title">Choose your first racer</div>
          <p>Yours to keep, with five cards suited to how she runs.</p>
        </div>
        <div class="starter-grid">
          ${picks.map((d, i) => {
            const cards = Stable.starterCards(d.id);
            return `
            <div class="starter-card pop-d${Math.min(i + 1, 4)}" data-owner="${d.id}">
              ${gateCell(d.id)}
              <div class="sc-art"><img src="${art(d.sprite)}" alt=""></div>
              <div class="sc-body">
                <div class="sc-name"><b>${esc(d.name)}</b><span class="stars"
                  data-info="rarity:${d.rarity || 1}">${RARITY_STAR(d.rarity || 1)}</span></div>
                <div class="sc-apt">
                  <span class="apt style" data-info="style:${d.style}">${esc(styleName(d))}</span>
                  ${d.unique ? `<span class="apt uni" data-info="unique:1">${Icon("sparkle")}${
                    esc(d.unique.name)}</span>` : ""}
                </div>
                <div class="sc-blurb">${esc(Stable.STARTER_BLURB[d.id] || d.blurb || "")}</div>
                ${aptGrid(d)}
                <div class="sc-cards"><i>Comes with</i>
                  ${cards.map(c => `<span class="cchip k${c.kind}" data-info="card:${c.id}">${
                    esc(c.ability)}</span>`).join("")}
                </div>
                <button class="btn sm sc-pick" data-pick="${d.id}">Choose ${esc(d.name)}</button>
              </div>
            </div>`;
          }).join("")}
        </div>
      </div>`;

    el.querySelectorAll("[data-pick]").forEach(b => {
      b.onclick = () => confirmStarter(b.dataset.pick);
    });
    /* Every label explains itself. The card is no longer one big button either: a screen
       where reading about a grade also picks the racer who owns it is a trap, so choosing
       is its own button now. */
    wireInfo(el, rid => Stable.defOf(rid));
  }

  async function confirmStarter(id) {
    const d = Stable.defOf(id);
    const ok = await ask({ title: "Choose " + d.name,
      message: `Start your stable with ${d.name}?`,
      detail: "This cannot be changed later.", confirm: "She's the one" });
    if (!ok) return;
    const res = Stable.pickStarter(id);
    if (!res.ok) return notify(res.error);
    Quests.record("starter");
    FX.confetti({ count: 140 });
    go("scr-starter", el => starterDone(el, d, res.cards));
  }

  function starterDone(el, def, cards) {
    el.innerHTML = `
      ${Bg.layer("starter")}
      <div class="starter-wrap">
        <div class="panel got-panel pop">
          <div class="panel-hd gold">${Icon("horseshoe")}Welcome to the stable</div>
          <div class="got-body">
            <img class="got-art float-y" src="${art(def.sprite)}" alt="">
            <div class="got-side">
              <h2>${esc(def.name)} <span class="stars">${RARITY_STAR(def.rarity || 1)}</span></h2>
              <p>${esc(Stable.STARTER_BLURB[def.id] || "")}</p>
              <div class="got-cards">
                ${cards.map(c => `
                  <div class="gc"><img src="assets/cards/${c.id}.png" alt="">
                    <b>${esc(c.ability)}</b><i>${c.cost}sp &middot; ${esc(c.kind)}</i></div>`).join("")}
              </div>
              <button class="btn lg" id="starterGo">To the lobby</button>
            </div>
          </div>
        </div>
      </div>`;
    el.querySelector("#starterGo").onclick = () => Shell.toMenu();
  }

  // ---------------------------------------------------------------- scout
  let scoutTab = "card";

  function scoutBuild(el) {
    const s = Stable.summary();
    const open = Stable.unlockedRacers().length;
    const isCard = scoutTab === "card";

    el.innerHTML = `
      ${Bg.layer("scout")}
      <div class="scr-wrap">
        ${resourceBar()}
        <div class="panel scout-panel pop">
          <div class="panel-hd">${Icon(isCard ? "ticket" : "pass")}Scout</div>
          <div class="scout-tabs">
            <button class="tab ${isCard ? "sel" : ""}" data-tab="card">${Icon("cards")}Cards</button>
            <button class="tab ${!isCard ? "sel" : ""}" data-tab="racer">${Icon("horseshoe")}Racers</button>
          </div>
          <div class="scout-body">
            <div class="scout-banner ${isCard ? "cards" : "racers"}">
              ${isCard
                ? Cards.CARDS.filter(c => c.rarity === "E").slice(0, 3).map((c, i) =>
                    `<img class="sb-card c${i}" src="assets/cards/${c.id}.png" alt="">`).join("")
                : Stable.unlockedRacers().slice().sort((a, b) => (b.rarity || 1) - (a.rarity || 1)).slice(0, 3)
                    .map((r, i) => `<img class="sb-racer r${i}" src="${art(r.sprite)}" alt="">`).join("")}
              <div class="sb-title">${isCard ? "Card scout" : "Racer scout"}</div>
            </div>
            <div class="scout-info">
              ${isCard ? `
                <p>Any card can turn up. A second copy lets you run it <b>twice</b> in one fifteen.</p>
                <div class="rates">${Stable.CARD_RATES.map(([r, p]) =>
                  `<span class="rate r${r}"><b>${r}</b>${(p * 100).toFixed(0)}%</span>`).join("")}</div>
                <p class="fine">${s.cards} of ${s.cardTotal} cards owned. Ten at once guarantees an R or better.</p>
              ` : `
                <p>Only <b>unlocked</b> racers appear. A finished career unlocks the next in her line.</p>
                <div class="rates">${Stable.RACER_RATES.map(([r, p]) =>
                  `<span class="rate s${r}"><b class="stars">${RARITY_STAR(r)}</b>${(p * 100).toFixed(0)}%</span>`).join("")}</div>
                <p class="fine">${open} of ${s.rosterTotal} unlocked &middot; ${s.racers} owned. Duplicates feed her passives.</p>
              `}
              <div class="scout-actions">
                ${scoutBtn(isCard, 1, "carrots", "lg")}
                ${scoutBtn(isCard, 10, "carrots", "gold lg")}
                ${[1, 10].map(n => Stable.itemCount(Stable.SCOUT_ITEM[n])
                  ? scoutBtn(isCard, n, "item", "blue") : "").join("")}
              </div>
            </div>
          </div>
        </div>
        <div class="scout-results" id="scoutOut"></div>
      </div>`;

    wireResourceBar(el);
    el.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => {
      scoutTab = b.dataset.tab; scoutBuild(el);
    });
    wireScoutBtns(el, el.querySelector(".scout-actions"));
  }

  /* Every scout button names what it spends -- carrots, a Scout Ticket or a Scout Pass --
     and carries that in data-pay, which goes to Stable as it is. A free scout never turns
     into a paid one: once the last Ticket is gone its button is rebuilt away, and a tap
     that reaches a stale one is refused by Stable rather than charged in carrots. */
  function scoutBtn(isCard, n, pay, cls, label) {
    const item = Stable.SCOUT_ITEM[n];
    const cost = isCard ? (n === 10 ? Stable.COSTS.cardScout10 : Stable.COSTS.cardScout)
                        : (n === 10 ? Stable.COSTS.racerScout10 : Stable.COSTS.racerScout);
    const left = Stable.itemCount(item);
    const can = pay === "item" ? left > 0 : Stable.carrots() >= cost;
    const what = pay === "item"
      ? `${Icon(Stable.itemDef(item).icon)}<small>${n === 10 ? "Scout Pass" : "Scout Ticket"}</small>${left} left`
      : `${Icon("carrot")}${num(cost)}`;
    return `<button class="btn ${cls || ""}" data-pull="${n}" data-pay="${pay}" ${can ? "" : "disabled"}>
      <span>${esc(label || "Scout")} &times;${n}</span><i>${what}</i></button>`;
  }

  function wireScoutBtns(el, box) {
    if (!box) return;
    box.querySelectorAll("[data-pull]").forEach(b => b.onclick = () => {
      if (scouting) return;
      b.disabled = true;               // this tap is spoken for, whatever the next one hits
      doScout(el, +b.dataset.pull, b.dataset.pay);
    });
  }

  /* One scout at a time. The reveal covers the screen at once, but a double tap can land
     its second click before that, on a button the first one is about to rebuild. */
  let scouting = false;

  async function doScout(el, n, pay) {
    if (scouting) return;
    scouting = true;
    try {
      const isCard = scoutTab === "card", kind = isCard ? "card" : "racer";
      /* A free scout goes through useItem, which tells the awards an item was spent. */
      const res = pay === "item" ? Stable.useItem(Stable.SCOUT_ITEM[n], kind) : Stable.scout(kind, n, "carrots");
      if (!res.ok) {
        if (pay === "item") scoutBuild(el);    // the count it showed was stale; show the real one
        return notify(res.error);
      }
      Quests.record(isCard ? "scoutCard" : "scoutRacer", { n, results: res.results });
      const unlocked = Quests.checkAwards();
      scoutBuild(el);                     // counts and costs change now, under the reveal

      /* The pull itself, results grid and all. A racer joining is announced inside it, on
         her own reveal, the way the real game gives a new trainee her moment. */
      await ScoutFX.play(res.results, { kind: isCard ? "card" : "racer" });

      renderPulls(el, res.results, res.refunded, n);
      if (unlocked.length) toastAwards(unlocked);
    } finally {
      scouting = false;
    }
  }

  // ---------------------------------------------------------------- the reveal
  /* The pull itself plays in scoutfx.js: the gate or the deal, the rarity hint, each
     result in turn and, for a ten, the grid. Tiers here rank the summary under it. */
  const RANK = { C: 0, R: 1, E: 2 };
  const tierOf = (r, isCard) => isCard ? RANK[r.card.rarity] : (r.rarity - 1);
  const TIER = ["c", "r", "e"];

  /** Count a number up, so a payout reads as something arriving rather than just being. */
  function countUp(node, to, ms) {
    if (!node) return;
    const start = performance.now(), from = 0;
    (function tick(now) {
      const k = Math.min(1, (now - start) / (ms || 700));
      node.textContent = num(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(tick);
    })(start);
  }

  function renderPulls(el, results, refunded, n) {
    n = n === 10 ? 10 : 1;
    const out = el.querySelector("#scoutOut");
    if (!out) return;
    const isCard = !!(results[0] && results[0].card);

    /* Sorted best-first so the eye lands on what matters, and the single best result is
       lifted out as a feature -- a grid of ten identical tiles buries the one good one. */
    const ranked = results.slice().sort((a, b) => tierOf(b, isCard) - tierOf(a, isCard));
    const hero = ranked[0];
    const heroTier = tierOf(hero, isCard);
    const isNew = r => isCard ? r.isNew : r.isNew;
    const newCount = results.filter(isNew).length;
    const passives = isCard ? 0 : results.filter(r => r.passive).length;

    out.innerHTML = `
      <div class="panel pop scout-res">
        <div class="panel-hd ${heroTier >= 2 ? "gold" : ""}">
          ${results.length === 1 ? "RESULT" : results.length + " RESULTS"}</div>

        <div class="res-hero t${TIER[heroTier]}">
          <div class="rh-art">${isCard
            ? `<img src="assets/cards/${hero.card.id}.png" alt="">`
            : `<img class="racer" src="${art(hero.def.sprite)}" alt="">`}</div>
          <div class="rh-info">
            <div class="rh-tag">Best of this scout</div>
            <div class="rh-name">${isCard ? esc(hero.card.ability) : esc(hero.def.name)}</div>
            <div class="rh-meta">${isCard
              ? `${hero.card.rarity === "E" ? "Epic" : hero.card.rarity === "R" ? "Rare" : "Common"}
                 &middot; ${esc(hero.card.kind)} &middot; ${hero.card.cost}sp`
              : `<span class="stars">${RARITY_STAR(hero.rarity)}</span> &middot; ${esc(hero.def.style)}`}</div>
            <div class="rh-blurb">${esc(isCard ? (hero.card.blurb || "") : (hero.def.blurb || ""))}</div>
          </div>
        </div>

        <div class="res-tally">
          <div><i>Pulled</i><b>${results.length}</b></div>
          <div><i>New</i><b class="tally-new">0</b></div>
          ${passives ? `<div><i>Passives</i><b class="tally-pass">0</b></div>` : ""}
          ${refunded ? `<div><i>Refunded</i><b>${Icon("carrot")} <span class="tally-ref">0</span></b></div>` : ""}
        </div>

        <div class="pull-grid">
          ${ranked.map((r, i) => isCard ? cardPull(r, i) : racerPull(r, i)).join("")}
        </div>
        <div class="res-again">
          ${scoutBtn(isCard, n, "carrots", "", "Again")}
          ${Stable.itemCount(Stable.SCOUT_ITEM[n]) ? scoutBtn(isCard, n, "item", "blue", "Again") : ""}
        </div>
      </div>`;

    out.scrollIntoView({ behavior: "smooth", block: "nearest" });
    countUp(out.querySelector(".tally-new"), newCount, 800);
    if (passives) countUp(out.querySelector(".tally-pass"), passives, 800);
    if (refunded) countUp(out.querySelector(".tally-ref"), refunded, 900);

    const heroEl = out.querySelector(".res-hero");
    if (heroTier >= 1) setTimeout(() => FX.sparkleOn(heroEl, { count: heroTier >= 2 ? 20 : 10, spread: 70 }), 260);

    out.querySelectorAll(".pull").forEach((p, i) =>
      setTimeout(() => {
        p.classList.add("in");
        if (p.classList.contains("big")) FX.sparkleOn(p, { count: 10, spread: 40 });
      }, 60 * i));

    /* "Again" offers the same size both ways, carrots first so that button never moves:
       when the last Ticket goes, its button goes with it and nothing slides into its place. */
    wireScoutBtns(el, out.querySelector(".res-again"));
  }

  const cardPull = (r, i) => `
    <div class="pull card r${r.card.rarity} ${r.card.rarity === "E" ? "big" : ""}">
      <img src="assets/cards/${r.card.id}.png" alt="">
      <b>${esc(r.card.ability)}</b>
      <i>${r.isNew ? "NEW" : "copy " + r.copies}</i>
    </div>`;

  /* A duplicate has to say what it did, or a repeat pull reads as a waste. */
  function racerPull(r) {
    const prog = r.progress;
    const tag = r.isNew ? "NEW"
      : r.passive ? "PASSIVE: " + (Progress.PASSIVES[r.passive] || {}).name
      : prog ? `${prog.have}/${prog.at} toward ${(Progress.PASSIVES[prog.key] || {}).name}`
      : null;
    // past her last passive a copy pays carrots back: the carrot is markup, so it stays out of esc()
    const said = tag != null ? esc(tag) : `Max copies: <span class="amt">+${Icon("carrot")} ${num(r.refund || 0)}</span>`;
    return `
      <div class="pull racer s${r.rarity} ${r.rarity >= 3 || r.passive ? "big" : ""}">
        <img src="${art(r.def.sprite)}" alt="">
        <b>${esc(r.def.name)}</b>
        <span class="stars">${RARITY_STAR(r.rarity)}</span>
        <i class="${r.passive ? "good" : ""}">${said}</i>
      </div>`;
  }

  // ---------------------------------------------------------------- stable
  function stableBuild(el) {
    const owned = Stable.ownedRacers();
    const prog = Stable.unlockProgress();
    el.innerHTML = `
      ${Bg.layer("stable")}
      <div class="scr-wrap">
        ${resourceBar()}
        <div class="panel pop">
          <div class="panel-hd">${Icon("horseshoe")}My stable</div>
          <div class="stable-sum">
            <span><b>${owned.length}</b> racer${owned.length === 1 ? "" : "s"} owned</span>
            <span><b>${prog.open}</b> of ${prog.total} unlocked</span>
            <span class="unlockbar"><i style="width:${(prog.pct * 100).toFixed(1)}%"></i></span>
          </div>
          ${owned.length ? `
            <div class="stable-grid">
              ${owned.map(d => {
                const sv = Stable.saveFor(d.id);
                const np = Stable.nextPassive(d.id);
                return `
                <button class="rcard" data-racer="${d.id}">
                  <div class="rc-art"><img src="${art(Stable.spriteFor(d.id))}" alt=""></div>
                  <div class="rc-name">${esc(d.name)}</div>
                  <div class="rc-meta">
                    <span class="stars">${RARITY_STAR(d.rarity || 1)}</span>
                    <span class="lv">Lv ${sv.level}</span>
                  </div>
                  <div class="rc-pass">
                    ${[0, 1, 2].map(i => `<i class="${i < sv.passives ? "on" : ""}"></i>`).join("")}
                    <small>${np ? `${np.need} more` : "maxed"}</small>
                  </div>
                </button>`;
              }).join("")}
            </div>` : `
            <div class="empty">
              <p>You have no racers yet.</p>
              <button class="btn" id="toScout">Go to the Scout</button>
            </div>`}
        </div>
      </div>`;
    wireResourceBar(el);
    const ts = el.querySelector("#toScout");
    if (ts) ts.onclick = () => go("scr-scout", scoutBuild);
    el.querySelectorAll("[data-racer]").forEach((b, i) => {
      b.onclick = () => go("scr-racer", e2 => racerBuild(e2, b.dataset.racer));
      // dealt in rather than all at once -- a stable of thirty should feel like a hand
      b.classList.add("deal");
      setTimeout(() => b.classList.add("in"), 30 * i);
    });
    const bar = el.querySelector(".unlockbar i");
    if (bar) { const w = bar.style.width; bar.style.width = "0%";
               setTimeout(() => { bar.style.width = w; }, 120); }
  }

  /* One racer: her card art, her outfits (all free), and what her duplicates have
     unlocked so far. */
  function racerBuild(el, id) {
    const d = Stable.defOf(id);
    if (!d) return stableBuild(el);
    const sv = Stable.saveFor(id);
    const outfits = Stable.ownedOutfits(id);
    const worn = (Stable.load().racers[id] || {}).outfit || "o0";
    const np = Stable.nextPassive(id);
    const unlocks = (Stable.UNLOCKS[id] || []).map(x => Stable.defOf(x)).filter(Boolean);

    el.innerHTML = `
      ${Bg.layer("racer")}
      <div class="scr-wrap">
        ${resourceBar()}
        <div class="panel pop racer-panel">
          <div class="panel-hd">${gateCell(d.id)}${esc(d.name)}</div>
          <div class="racer-body">
            <div class="racer-art"><img id="racerArt" src="${art(Stable.spriteFor(id))}" alt=""></div>
            <div class="racer-info">
              <div class="rrow">
                <span class="stars big" data-info="rarity:${d.rarity || 1}">${RARITY_STAR(d.rarity || 1)}</span>
                <span class="pill">Lv ${sv.level}</span>
                <span class="pill" data-info="style:${d.style}">${esc(
                  (root.Sim && Sim.STYLES[d.style]) ? Sim.STYLES[d.style].name : d.style)}</span>
                <span class="pill">${esc(Stable.dupesOf(id))} copies</span>
              </div>
              <p class="blurb">${esc(d.blurb || "")}</p>

              <h4>Aptitude <small>tap a grade for what it means</small></h4>
              ${aptGrid(d)}

              ${d.unique ? `
                <h4>Unique skill</h4>
                <button class="uniq-panel" data-info="unique:1">
                  <span class="uq-star">${Icon("sparkle")}</span>
                  <span class="uq-txt"><b>${esc(d.unique.name)}</b>
                    <i>${esc(d.unique.text || "")}</i></span>
                  <span class="uq-more">what does it do?</span>
                </button>` : ""}

              <h4>Stats</h4>
              <div class="statgrid">
                ${["speed", "stamina", "power", "guts", "wit"].map(k => {
                  const v = Progress.statsFor(d, sv.level)[k], g = statGrade(v);
                  return `
                  <div class="st" data-info="stat:${k}"><i>${k}</i>
                    <span class="bar"><b style="width:${Math.min(100, v / 12)}%"></b></span>
                    <em>${v}</em><strong class="g g${g.replace("SS", "S")}">${g}</strong></div>`; }).join("")}
              </div>

              <h4>Passives <small>unlocked by duplicate scouts</small></h4>
              <div class="passives">
                ${(d.passives || []).map((key, i) => {
                  const p = Progress.PASSIVES[key] || { name: key, text: "" };
                  const on = i < sv.passives;
                  const at = Stable.thresholdsFor(id)[i];
                  return `<div class="pv ${on ? "on" : ""}" data-info="passive:${key}">
                    <b>${esc(p.name)}</b><i>${esc(p.text)}</i>
                    <span>${on ? "unlocked" : at + " copies"}</span></div>`;
                }).join("")}
              </div>
              ${np ? `<p class="fine">${np.need} more ${np.need === 1 ? "copy" : "copies"} of
                 ${esc(d.name)} unlocks <b>${esc((Progress.PASSIVES[np.key] || {}).name)}</b>.</p>` : ""}

              <h4>Outfits <small>free &mdash; wear any of them</small></h4>
              <div class="outfits">
                ${outfits.map(o => `
                  <button class="of ${o.id === worn ? "sel" : ""}" data-of="${o.id}">
                    <img src="${art(o.art)}" alt=""><i>${esc(o.name)}</i></button>`).join("")}
              </div>

              ${unlocks.length ? `
                <h4>Completing her career unlocks</h4>
                <div class="unlocks">
                  ${unlocks.map(u => `<span class="ul ${Stable.isUnlocked(u.id) ? "done" : ""}">
                    ${esc(u.name)}</span>`).join("")}
                </div>` : ""}

              <div class="racer-actions">
                <button class="btn" id="rCareer">Start a career</button>
                <button class="btn ghost" id="rBack">Back to stable</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    wireResourceBar(el, () => go("scr-stable", stableBuild));
    /* Aptitudes, stats, passives, the star rating and her unique all explain themselves. */
    wireInfo(el, () => d);
    el.querySelector("#rBack").onclick = () => go("scr-stable", stableBuild);
    el.querySelector("#rCareer").onclick = () => UICareer.begin(id);
    el.querySelectorAll("[data-of]").forEach(b => b.onclick = () => {
      swapOutfit(el, id, b.dataset.of, b);
    });

    animateRacer(el);
  }

  /* Changing an outfit used to be an instant src swap, which read as a glitch rather
     than a choice. A light sweep passes over her, the old costume fades out from under
     the new one, and the outfit names itself. */
  function swapOutfit(el, racerId, outfitId, btn) {
    const r = Stable.setOutfit(racerId, outfitId);
    if (!r.ok) return notify(r.error);

    const holder = el.querySelector(".racer-art");
    const img = el.querySelector("#racerArt");
    el.querySelectorAll("[data-of]").forEach(x => x.classList.toggle("sel", x === btn));
    if (!holder || !img) return;

    // the outgoing costume stays on top and dissolves, so there is never a blank frame
    const ghost = img.cloneNode();
    ghost.removeAttribute("id");
    ghost.className = "of-ghost";
    holder.appendChild(ghost);

    const sweep = document.createElement("div");
    sweep.className = "of-sweep";
    holder.appendChild(sweep);

    img.src = art(r.sprite);
    img.classList.remove("of-in");
    void img.offsetWidth;                       // restart the animation
    img.classList.add("of-in");

    const outfit = Stable.outfitsOf(racerId).find(o => o.id === outfitId);
    if (outfit) {
      const tag = document.createElement("div");
      tag.className = "of-tag";
      tag.textContent = outfit.name;
      holder.appendChild(tag);
      setTimeout(() => tag.remove(), 1500);
    }
    setTimeout(() => { ghost.remove(); sweep.remove(); }, 640);
    FX.sparkleOn(holder, { count: 16, spread: 60 });
  }

  /* Her page arrives rather than appearing: art first, then each section, and the stat
     bars grow from nothing so the shape of her is read rather than just present. */
  function animateRacer(el) {
    const art0 = el.querySelector(".racer-art");
    if (art0) { art0.classList.add("enter"); }
    el.querySelectorAll(".racer-info > *").forEach((n, i) => {
      n.classList.add("es");
      setTimeout(() => n.classList.add("in"), 60 + 55 * i);
    });
    el.querySelectorAll(".statgrid .bar b").forEach((bar, i) => {
      const w = bar.style.width;
      bar.style.width = "0%";
      setTimeout(() => { bar.style.width = w; }, 220 + 60 * i);
    });
    el.querySelectorAll(".pv.on").forEach((pv, i) =>
      setTimeout(() => FX.sparkleOn(pv, { count: 5, spread: 18 }), 600 + 140 * i));
  }

  // ---------------------------------------------------------------- quests
  /* Four boards on one notice board: the day's quests, the week's, the trainer tasks (first
     steps, then the tiered chains by category) and the medal case. Each tab carries its own
     count of rewards waiting, and Claim all takes only what is on the tab in front of you. */
  let questTab = "daily";

  function questsBuild(el) {
    if (!["daily", "weekly", "tasks", "awards"].includes(questTab)) questTab = "daily";
    const tab = questTab;
    const waiting = Quests.claimableBy();
    const sum = Quests.summary();
    const ready = tab === "awards" ? 0 : waiting[tab];
    const left = Quests.resets();
    const badge = n => n ? `<span class="badge">${n}</span>` : "";
    // a claim rebuilds the board: stay where you were on it, not back at the top
    const prev = el.querySelector(".scr-wrap");
    const keep = prev && el.dataset.qtab === tab ? prev.scrollTop : 0;

    let body = "";
    if (tab === "daily") body = questGroup("Daily", Quests.daily(), "Resets in " + untilText(left.day));
    else if (tab === "weekly") body = questGroup("Weekly", Quests.weekly(), "Resets in " + untilText(left.week));
    else if (tab === "tasks") body = tasksBoard();
    else body = awardsBoard();

    el.innerHTML = `
      ${Bg.layer("quests")}
      <div class="scr-wrap">
        ${resourceBar()}
        <div class="panel pop">
          <div class="panel-hd">${Icon("clipboard")}Quests &amp; awards</div>
          <div class="scout-tabs quest-tabs">
            <button class="tab ${tab === "daily" ? "sel" : ""}" data-qtab="daily">Daily${badge(waiting.daily)}</button>
            <button class="tab ${tab === "weekly" ? "sel" : ""}" data-qtab="weekly">Weekly${badge(waiting.weekly)}</button>
            <button class="tab ${tab === "tasks" ? "sel" : ""}" data-qtab="tasks">
              Trainer tasks <small>${sum.tiersClaimed}/${sum.tiersTotal}</small>${badge(waiting.tasks)}</button>
            <button class="tab ${tab === "awards" ? "sel" : ""}" data-qtab="awards">
              Awards <small>${sum.awardsUnlocked}/${sum.awardsTotal}</small></button>
          </div>
          <div class="quest-body">
            ${ready ? `<button class="btn gold" id="claimAll">Claim all (${ready})</button>` : ""}
            ${body}
          </div>
        </div>
      </div>`;

    el.dataset.qtab = tab;
    if (keep) el.querySelector(".scr-wrap").scrollTop = keep;
    wireResourceBar(el);
    el.querySelectorAll("[data-qtab]").forEach(b => b.onclick = () => {
      questTab = b.dataset.qtab; questsBuild(el);
    });
    // the medal case's filters: a category, and what to show of it
    el.querySelectorAll("[data-acat]").forEach(b => b.onclick = () => {
      awardCat = b.dataset.acat; el.dataset.qtab = ""; questsBuild(el);
    });
    el.querySelectorAll("[data-ashow]").forEach(b => b.onclick = () => {
      awardShow = b.dataset.ashow; questsBuild(el);
    });
    const ca = el.querySelector("#claimAll");
    if (ca) ca.onclick = async () => {
      const got = Quests.claimAll(tab);
      questsBuild(el);
      /* Everything the player is given is shown to them. Claiming several at once is one
         box listing the lot rather than a stack of them. */
      if (got.length) {
        FX.sparkleOn(el.querySelector("#claimAll") || el, { count: 16 });
        await reward({
          kicker: got.length === 1 ? "Claimed" : got.length + " claimed",
          title: got.length === 1 ? (got[0].quest || {}).name || "Reward" : "Rewards",
          reward: mergeRewards(got.map(g => g.quest && g.quest.reward)),
          big: got.length > 2,
        });
        toastAwards([].concat(...got.map(g => g.awards || [])));
        questsBuild(el);
      }
    };
    el.querySelectorAll("[data-claim]").forEach(b => b.onclick = async () => {
      const r = Quests.claim(b.dataset.claim);
      if (!r.ok) return notify(r.error);
      FX.sparkleOn(b, { count: 14 });
      questsBuild(el);
      await reward({ kicker: "Claimed",
                     title: (r.quest || {}).name || "Reward",
                     reward: (r.quest || {}).reward });
      if (r.awards && r.awards.length) { toastAwards(r.awards); questsBuild(el); }
    });
  }

  /** "5h 12m", "3d 4h": how long until a board comes back. */
  function untilText(ms) {
    const m = Math.max(1, Math.ceil(ms / 60000)), h = Math.floor(m / 60), d = Math.floor(h / 24);
    return d ? `${d}d ${h % 24}h` : h ? `${h}h ${m % 60}m` : `${m}m`;
  }

  /* Waiting to be claimed first, then still to do, then what is already claimed: the board
     is long, and the thing to act on should not be below the fold. */
  const byUrgency = list => list.map((q, i) => ({ q, i, k: q.claimed ? 2 : q.done ? 0 : 1 }))
    .sort((a, b) => a.k - b.k || a.i - b.i).map(x => x.q);

  const questGroup = (title, list, note) => `
    <h4 class="qh">${title}${note ? `<small>${esc(note)}</small>` : ""}</h4>
    <div class="quest-list">
      ${byUrgency(list).map(q => `
        <div class="q ${q.done ? "done" : ""} ${q.claimed ? "claimed" : ""}">
          <div class="q-main">
            <b>${esc(q.name)}</b><i>${esc(q.desc)}</i>
            <span class="pbar"><b style="width:${(q.pct * 100).toFixed(0)}%"></b></span>
            <small>${q.have} / ${q.need}</small>
          </div>
          <div class="q-side">
            <span class="rw">${rewardText(q.reward)}</span>
            ${q.claimed ? `<span class="done-tag">Claimed</span>`
              : q.done ? `<button class="btn sm gold" data-claim="${q.id}">Claim</button>`
              : ""}
          </div>
        </div>`).join("")}
    </div>`;

  /* Trainer tasks. First steps while any are left to claim, then every chain by category.
     A chain is one card: its ladder of tiers (claimed in turf, reached and waiting in gold,
     the one being worked on outlined), the target of that tier with a bar toward it, and
     what it pays. Claim takes every tier it has reached at once. */
  function tasksBoard() {
    const first = Quests.first();
    const firstLeft = first.some(q => !q.claimed);
    const cats = Quests.trainer();
    const card = (v, ladder) => {
      const state = v.complete ? "complete" : v.ready ? "ready" : "";
      return `
        <div class="tk ${state}">
          <div class="tk-hd"><b>${esc(v.name)}</b>${ladder ? `<span class="tk-of">${v.complete ? "Complete" : "Tier " + v.roman}</span>` : ""}</div>
          <i>${esc(v.desc)}</i>
          ${ladder ? `<div class="tk-steps">${v.steps.map(st => `<span class="${st.claimed ? "got" : st.reached ? "ready" : !v.complete && st.roman === v.roman ? "cur" : ""}"
            title="${st.roman}: ${esc(st.desc)} ${esc(rewardPlain(st.reward))}">${st.roman}</span>`).join("")}</div>` : ""}
          <span class="pbar"><b style="width:${(v.pct * 100).toFixed(0)}%"></b></span>
          <div class="tk-ft">
            <small>${num(v.have)} / ${num(v.need)}</small>
            ${v.reward ? `<span class="rw">${rewardText(v.reward)}</span>` : ""}
            ${v.ready ? `<button class="btn sm gold" data-claim="${v.id}">${v.ready > 1 ? `Claim ${v.ready} tiers` : "Claim"}</button>`
              : v.claimedOne ? `<span class="done-tag">Claimed</span>` : ""}
          </div>
        </div>`;
    };
    // a first step reads like a one-tier chain
    const step = q => card({ id: q.id, name: q.name, desc: q.desc, have: q.have, need: q.need, pct: q.pct,
                             reward: q.claimed ? null : q.reward, ready: q.done && !q.claimed ? 1 : 0,
                             complete: q.claimed, claimedOne: q.claimed }, false);
    return `
      ${firstLeft ? `
        <h4 class="qh">First steps<small>${first.filter(q => q.claimed).length} / ${first.length}</small></h4>
        <div class="tk-grid">${byUrgency(first).map(step).join("")}</div>` : ""}
      ${cats.map(c => `
        <h4 class="qh">${esc(c.name)}<small>${c.claimed} / ${c.total} tiers</small></h4>
        <div class="tk-grid">${c.chains.map(v => card(v, true)).join("")}</div>`).join("")}`;
  }

  /* The medal case: ~200 awards, so it has a category row (each with its count and a bar)
     and a To earn / Earned switch. Champions are laid out by racer, her URA Finale and
     Dream Trophy side by side, since that is how anyone looks for them. Secrets read "???"
     with a hint until they are earned. */
  let awardCat = "all", awardShow = "all";
  function awardsBoard() {
    const all = Quests.awards(), cats = Quests.AWARD_CATS;
    const done = list => list.filter(a => a.unlocked).length;
    const keep = a => awardShow === "all" || (awardShow === "done" ? a.unlocked : !a.unlocked);
    if (awardCat !== "all" && !cats.some(c => c.id === awardCat)) awardCat = "all";
    const catBtn = (id, name, list) => `
      <button class="${awardCat === id ? "sel" : ""}" data-acat="${id}">${esc(name)}
        <small>${done(list)} / ${list.length}</small>
        <i><b style="width:${list.length ? (done(list) / list.length * 100).toFixed(0) : 0}%"></b></i></button>`;
    const card = a => a.hidden ? `
      <div class="aw secret t${a.tier}">
        <div class="aw-top"><b>???</b><span class="tier">${esc(a.tier)}</span></div>
        <i>${esc(a.hint || "A secret.")}</i>
        <span class="rw">${rewardText(a.reward)}</span>
      </div>` : `
      <div class="aw ${a.unlocked ? "on" : ""} t${a.tier}">
        <div class="aw-top"><b>${esc(a.name)}</b>
          <span class="tier">${esc(a.tier)}</span></div>
        <i>${esc(a.desc)}</i>
        ${a.need && !a.unlocked ? `<span class="pbar"><b style="width:${(a.pct * 100).toFixed(0)}%"></b></span>
           <small>${num(a.have)} / ${num(a.need)}</small>` : ""}
        <span class="rw">${rewardText(a.reward)}</span>
      </div>`;
    // a racer's two titles on one tile
    const champs = list => {
      const by = {};
      for (const a of list) if (a.racer) (by[a.racer] = by[a.racer] || {})[a.scn] = a;
      const mark = (a, label, cls) => a ? `<span class="champ-m ${cls}${a.unlocked ? " on" : ""}"
        title="${esc(a.desc)} ${esc(rewardPlain(a.reward))}">${label}</span>` : "";
      const tiles = Object.keys(by).filter(id => keep(by[id].ura || {}) || keep(by[id].dream || {})).map(id => {
        const d = Stable.defOf(id) || { name: id, color: "#9aa2b4" };
        return `<div class="champ"><i class="sw" style="background:${d.color || "#9aa2b4"}"></i><b>${esc(d.name)}</b>
          ${mark(by[id].ura, "URA", "ura")}${mark(by[id].dream, "Dream", "dream")}</div>`;
      });
      return tiles.length ? `<div class="champ-grid">${tiles.join("")}</div>` : "";
    };
    const section = (c, heading) => {
      const list = all.filter(a => a.cat === c.id);
      const plain = list.filter(a => !a.racer && keep(a));
      const body = (plain.length ? `<div class="award-grid">${plain.map(card).join("")}</div>` : "") +
                   (c.id === "champions" ? champs(list) : "");
      if (!body) return heading ? "" : `<p class="aw-none">Nothing here${awardShow === "done" ? " earned yet" : " left to earn"}.</p>`;
      return (heading ? `<h4 class="qh">${esc(c.name)}<small>${done(list)} / ${list.length}</small></h4>` : "") + body;
    };
    return `
      <div class="aw-bar">
        <div class="aw-total"><b>${num(done(all))}</b><small>/ ${num(all.length)} Awards</small>
          <span class="pbar"><b style="width:${(done(all) / all.length * 100).toFixed(1)}%"></b></span></div>
        <div class="seg">${[["all", "All"], ["todo", "To earn"], ["done", "Earned"]].map(([k, l]) =>
          `<button class="${awardShow === k ? "sel" : ""}" data-ashow="${k}">${l}</button>`).join("")}</div>
      </div>
      <div class="aw-cats">${catBtn("all", "All", all)}${cats.map(c => catBtn(c.id, c.name, all.filter(a => a.cat === c.id))).join("")}</div>
      ${awardCat === "all" ? cats.map(c => section(c, true)).join("") : section(cats.find(c => c.id === awardCat), false)}`;
  }

  /** A reward as plain words, for a tooltip. */
  function rewardPlain(r) {
    if (!r) return "";
    const bits = [];
    if (r.carrots) bits.push(num(r.carrots) + " carrots");
    for (const id in r.items || {}) {
      const d = Stable.itemDef(id);
      bits.push((d ? d.name : id) + (r.items[id] > 1 ? " ×" + r.items[id] : ""));
    }
    return bits.length ? "— " + bits.join(", ") : "";
  }

  function rewardText(r) {
    if (!r) return "";
    const bits = [];
    if (r.carrots) bits.push(`${Icon("carrot")} ${num(r.carrots)}`);
    for (const id in r.items || {}) {
      const d = Stable.itemDef(id);
      bits.push(`${d ? Icon(d.icon) + " " + d.name : id}${r.items[id] > 1 ? " ×" + r.items[id] : ""}`);
    }
    for (const c of r.cards || []) bits.push(`${c.n || 1} ${c.rarity || ""} card`);
    if (r.racer) bits.push(`${RARITY_STAR(r.racer.rarity)} racer`);
    return bits.join(" &middot; ");
  }

  /**
   * The payout box. Anything the player is GIVEN goes through here, so being rewarded
   * always looks the same and is never something you only notice because a number in the
   * corner moved: a tutorial finishing, a quest claimed, an award unlocking, a career
   * paying out.
   *
   * `items` are ready-made lines: { icon, label, amount }. `reward` is the raw shape the
   * rest of the game passes around, and is expanded into those lines for you.
   */
  function reward(opts) {
    opts = opts || {};
    const rows = (opts.items || []).slice();

    const r = opts.reward;
    if (r) {
      if (r.carrots) rows.push({ icon: "carrot", label: "Carrots", amount: "+" + num(r.carrots) });
      for (const id in r.items || {}) {
        const d = Stable.itemDef(id);
        rows.push({ icon: d ? d.icon : "star", label: d ? d.name : id,
                    amount: "\u00D7" + r.items[id] });
      }
      for (const c of r.cards || []) {
        rows.push({ icon: "cards",
                    label: (c.rarity === "E" ? "Epic" : c.rarity === "R" ? "Rare" : "Common") + " card",
                    amount: "\u00D7" + (c.n || 1) });
      }
      if (r.racer) rows.push({ icon: "horseshoe", label: "New racer", amount: RARITY_STAR(r.racer.rarity) });
    }

    if (!rows.length && !opts.message) return Promise.resolve();

    return new Promise(resolve => {
      const el = askHost();
      el.className = "on";
      el.innerHTML = `
        <div class="ask-card pop reward-card">
          <div class="rw-rays"></div>
          <div class="rw-head">
            <div class="rw-kicker">${esc(opts.kicker || "Complete")}</div>
            <div class="rw-title">${esc(opts.title || "Reward")}</div>
            ${opts.message ? `<p class="rw-msg">${esc(opts.message)}</p>` : ""}
          </div>
          <div class="rw-body">
            ${rows.length ? `<div class="rw-list">${rows.map((x, i) => `
              <div class="rw-row" style="animation-delay:${(0.10 + i * 0.09).toFixed(2)}s">
                <span class="rw-ic">${Icon(x.icon || "star") || esc(x.icon)}</span>
                <span class="rw-lb">${esc(x.label)}</span>
                <b class="rw-am">${esc(x.amount)}</b>
              </div>`).join("")}</div>` : ""}
            <button class="btn lg" id="rwOk">${esc(opts.close || "Claim")}</button>
          </div>
        </div>`;

      if (root.FX) {
        FX.confetti({ count: opts.big ? 180 : 110 });
        FX.shake(opts.big ? 380 : 220, opts.big ? 7 : 4);
      }

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        document.removeEventListener("keydown", onKey, true);
        el.className = ""; el.innerHTML = "";
        try { refreshBar(); } catch (e) {}
        resolve();
      };
      function onKey(e) {
        if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
          e.stopPropagation(); e.preventDefault(); finish();
        }
      }
      document.addEventListener("keydown", onKey, true);
      el.querySelector("#rwOk").onclick = finish;
      el.onclick = e => { if (e.target === el) finish(); };
      setTimeout(() => { const b = el.querySelector("#rwOk"); if (b) b.focus(); }, 60);
    });
  }

  /** Several rewards added together, so claiming a batch is one box rather than five. */
  function mergeRewards(list) {
    const out = { carrots: 0, items: {}, cards: [] };
    for (const r of list || []) {
      if (!r) continue;
      out.carrots += r.carrots || 0;
      for (const id in r.items || {}) out.items[id] = (out.items[id] || 0) + r.items[id];
      for (const c of r.cards || []) out.cards.push(c);
      if (r.racer) out.racer = r.racer;
    }
    return out;
  }

  /** A small floating notice when awards unlock mid-action. */
  function toastAwards(list) {
    if (!list || !list.length) return;
    FX.confetti({ count: 70 });
    /* A returning trainer can earn a dozen at once (the medal case grew): three by name,
       then one notice for the rest, rather than a stack of toasts for a minute. */
    const named = list.length > 4 ? list.slice(0, 3) : list;
    const toasts = named.map(x => `<b>Award unlocked</b><span>${esc(x.award.name)}</span>
                                   <i>${rewardText(x.award.reward)}</i>`);
    if (list.length > named.length)
      toasts.push(`<b>Awards unlocked</b><span>${list.length - named.length} more</span>
                   <i>Every one is in Quests, under Awards.</i>`);
    toasts.forEach((html, i) => setTimeout(() => {
      const t = document.createElement("div");
      t.className = "awtoast";
      t.innerHTML = html;
      document.body.appendChild(t);
      setTimeout(() => t.classList.add("in"), 20);
      setTimeout(() => { t.classList.remove("in"); setTimeout(() => t.remove(), 400); }, 3200);
    }, i * 900));
  }

  /**
   * The jukebox in the lobby's main hall. As in the real game, it plays any music already
   * heard somewhere in the game (Sound.jukebox), in place of the home theme, until another
   * pick. The pick is a setting, so it stays chosen; leaving for a screen with music of its
   * own plays that, and coming back plays the pick again.
   */
  async function jukebox() {
    if (!root.Sound || !Sound.jukebox || !root.Settings) return;
    const J = Sound.jukebox(), heard = J.tracks.filter(t => t.heard);
    const v = await choose({
      title: "Jukebox",
      message: `Pick the music for the academy: the lobby, and every screen that shares its theme. ` +
               `${heard.length} of ${J.tracks.length} tracks heard so far. The rest join as you hear them.`,
      options: [{ value: "", label: "The academy's own", note: "The home screen theme, by day or by night", sel: !J.picked }]
        .concat(heard.map(t => ({ value: t.file, label: t.title, note: t.where, sel: t.file === J.picked }))),
      cancel: "Close",
    });
    if (v !== null && v !== J.picked) {
      Settings.set("jukebox", v);
      if (root.Quests) toastAwards(Quests.record("jukebox").awards);     // an award for asking
    }
  }

  const api = { ask, prompt, choose, jukebox, info, wireInfo, reward, notify, countUp, resourceBar, wireResourceBar, refreshBar, rewardText, toastAwards, art, aptGrid,
                starterBuild, scoutBuild, stableBuild, racerBuild, questsBuild };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.UIMeta = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
