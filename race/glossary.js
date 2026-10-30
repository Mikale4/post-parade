/*
 * What every label on a racer card actually means.
 *
 * The stat pills on the starter picker and the stable are the densest thing in the game:
 * "MIL S", "DIRT A", a card called "Regroup". They were readable only to someone who
 * already knew the mechanics. This turns each of them into an explanation of what the
 * label is, what the grade does, and what it means for THIS racer.
 *
 * Every number here is DERIVED from sim.js at call time rather than written down. The
 * aptitude curve lives in Sim.APT and the two places it is applied are quoted below; if
 * someone retunes the curve these panels retune with it, which is the only way an
 * explanation stays true.
 *
 * Exposes Glossary.
 */
(function (root) {
  "use strict";

  const Sim = typeof require !== "undefined" ? require("./sim.js") : root.Sim;
  const Cards = typeof require !== "undefined" ? require("./cards.js") : root.Cards;

  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g,
    c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const GRADES = ["S", "A", "B", "C", "D", "E", "F", "G"];

  /* The three places aptitude is read in sim.js, mirrored as functions of the grade.
     `makeRacer` builds speedApt from both halves; `hpDrain` penalises the distance half
     only. Nothing else in the game looks at aptitude at all. */
  const aptOf = g => (Sim.APT[g] == null ? Sim.APT.A : Sim.APT[g]);
  const distSpeed = g => 0.72 + 0.30 * aptOf(g);     // sim.js makeRacer
  const surfSpeed = g => 0.80 + 0.20 * aptOf(g);     // sim.js makeRacer
  const distDrain = g => 1 / Math.max(0.35, aptOf(g));  // sim.js hpDrain

  const pctVsA = (v, base) => {
    const d = (v / base - 1) * 100;
    if (Math.abs(d) < 0.05) return "the same";
    return (d > 0 ? "+" : "−") + Math.abs(d).toFixed(1) + "%";
  };
  const times = v => (v < 0.995 || v > 1.005) ? v.toFixed(2) + "×" : "the same";

  /* The distance bands, read off Sim.DIST_CLASS rather than restated, so a change to the
     cut-offs cannot leave this text lying. */
  function bands() {
    const out = [], seen = {};
    for (let d = 1000; d <= 3600; d += 100) {
      const k = Sim.DIST_CLASS(d);
      if (!seen[k]) seen[k] = { lo: d, hi: d }; else seen[k].hi = d;
    }
    for (const k of ["sprint", "mile", "medium", "long"])
      if (seen[k]) out.push({ key: k, lo: seen[k].lo, hi: seen[k].hi });
    return out;
  }

  const DIST_LABEL = { sprint: "Sprint", mile: "Mile", medium: "Medium", long: "Long" };

  /** A small table of every grade, with this racer's own row picked out. */
  function gradeTable(rows, mine) {
    return `<table class="gl-tab"><thead><tr><th>Grade</th>${
      rows.head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${
      GRADES.map(g => `<tr class="${g === mine ? "me" : ""}">
        <td><b class="g g${g}">${g}</b></td>${
        rows.cell(g).map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }

  // ---------------------------------------------------------------- entries
  /** Distance aptitude: the one that costs stamina as well as pace. */
  function distance(key, def) {
    const g = def && def.aptitude ? def.aptitude[key] : null;
    const b = bands().find(x => x.key === key);
    const who = def ? esc(def.name) : "She";
    const range = b
      ? (key === "long" ? `${b.lo}m and up` : key === "sprint" ? `up to ${b.hi}m`
         : `${b.lo}m to ${b.hi}m`)
      : "";

    const mine = g ? `
      <p class="gl-mine"><b>${who} is ${g} here.</b> Against an A-grade racer she carries
      <b>${pctVsA(distSpeed(g), distSpeed("A"))}</b> pace over this trip and burns stamina
      <b>${times(distDrain(g) / distDrain("A"))}</b>${
        distDrain(g) / distDrain("A") > 1.01 ? " as fast" : ""}.</p>` : "";

    return {
      title: DIST_LABEL[key] + " aptitude",
      html: `
        <p><b>${DIST_LABEL[key]}</b> races are ${range}. This grade is how well she runs
        that length &mdash; it says nothing about how fast she is, only how well the trip
        suits her.</p>
        <p>Distance aptitude is the harsher of the two. It costs her pace <em>and</em> it
        makes every metre cost more stamina, so the wrong trip does not just slow her
        down, it empties her before the straight.</p>
        ${mine}
        ${gradeTable({
          head: ["Pace vs A", "Stamina burn vs A"],
          cell: gr => [pctVsA(distSpeed(gr), distSpeed("A")),
                       times(distDrain(gr) / distDrain("A"))],
        }, g)}
        <p class="gl-tip">Enter her in races that match her best grades. A racer with one
        S and three E grades is not weak &mdash; she is a specialist, and the calendar has
        races for her.</p>`,
    };
  }

  /** Surface aptitude: pace only. */
  function surface(key, def) {
    const g = def && def.aptitude ? def.aptitude[key] : null;
    const who = def ? esc(def.name) : "She";
    const label = key === "turf" ? "Turf" : "Dirt";
    const mine = g ? `
      <p class="gl-mine"><b>${who} is ${g} here.</b> On ${key} she carries
      <b>${pctVsA(surfSpeed(g), surfSpeed("A"))}</b> pace against an A-grade racer.
      Her stamina burn is unaffected.</p>` : "";

    return {
      title: label + " aptitude",
      html: `
        <p><b>${label}</b> is the ground the race is run on. Every course is one or the
        other, and the calendar has both.</p>
        <p>Surface only costs her <em>pace</em>. Unlike distance it does not touch her
        stamina, so the wrong surface makes her slower without making her run out &mdash;
        which is why a bad surface is survivable and a bad distance often is not.</p>
        ${mine}
        ${gradeTable({
          head: ["Pace vs A"],
          cell: gr => [pctVsA(surfSpeed(gr), surfSpeed("A"))],
        }, g)}
        <p class="gl-tip">The two multiply. A racer running both the wrong trip and the
        wrong ground is giving away far more than either alone.</p>`,
    };
  }

  /** A card in her starting hand. */
  function card(id, def) {
    const c = Cards.byId ? Cards.byId[id] : null;
    if (!c) return { title: "Card", html: "<p>No such card.</p>" };
    const PHASE = ["the opening", "the middle", "the final stretch"];
    const when = (c.phases || []).map(p => PHASE[p]).filter(Boolean);
    const rarity = c.rarity === "E" ? "Epic" : c.rarity === "R" ? "Rare" : "Common";
    const who = def ? esc(def.name) : "She";
    return {
      title: esc(c.ability),
      html: `
        <div class="gl-card">
          <img src="assets/cards/${esc(c.id)}.png" alt="">
          <div>
            <div class="gl-kind k${esc(c.kind)}">${esc(c.kind)} &middot; ${rarity}</div>
            <div class="gl-cost"><b>${c.cost}</b> spirit</div>
          </div>
        </div>
        <p>${esc(c.blurb)}</p>
        <p><b>When it can fire:</b> ${when.length ? when.join(", ") : "any time"}.</p>
        <p>You do not play this card. ${who} decides when to spend it, and she can only
        spend it if she has the spirit for it &mdash; spirit builds as she runs, and she
        gets <b>${Racers().SPIRIT_BUDGET}</b> across the whole race. A ${c.cost}-spirit
        card is ${c.cost <= 1 ? "cheap enough to come out several times"
          : c.cost >= 4 ? "expensive: it may sit in her hand all race if the pace never suits it"
          : "middling &mdash; affordable once the race is under way"}.</p>
        <p class="gl-tip">Cards she cannot afford clog her hand. That is what the
        <b>Callout</b> is for: bin what she is holding and draw again.</p>`,
    };
  }
  const Racers = () => (typeof require !== "undefined" ? require("./ai.js") : root.Racers);

  /** The star rating. */
  function rarity(n, def) {
    const S = root.Stable;
    const th = S && def ? S.thresholdsFor(def.id) : null;
    const rate = { 3: "10%", 2: "35%", 1: "55%" }[n] || "";
    const who = def ? esc(def.name) : "She";
    return {
      title: "★".repeat(n) + " rarity",
      html: `
        <p>Rarity is how often she turns up in the racer scout &mdash; about
        <b>${rate}</b> of pulls are ${n}-star. It is <em>not</em> a power rating: a
        one-star with the right aptitude beats a three-star running the wrong trip.</p>
        <p>What it really changes is how long her passives take. Duplicate pulls feed
        straight into her, and rarer racers need fewer copies because you see them less
        often.</p>
        ${th ? `<p class="gl-mine"><b>${who} needs ${th.join(", ")} copies</b> for her
          first, second and third passive.</p>` : ""}
        <p class="gl-tip">A duplicate is never wasted. It is progress toward a passive
        she keeps for every race afterwards.</p>`,
    };
  }

  /** Running style. */
  function style(key, def) {
    const st = Sim.STYLES[key];
    if (!st) return { title: "Running style", html: "<p>Unknown style.</p>" };
    const who = def ? esc(def.name) : "She";
    const rows = Object.keys(Sim.STYLES).map(k => {
      const s = Sim.STYLES[k];
      return `<tr class="${k === key ? "me" : ""}"><td><b>${s.name}</b></td>
        <td>${s.gap === 0 ? "the lead" : s.gap + "m back"}</td>
        <td>${(s.phase[2] * 100).toFixed(1)}%</td>
        <td>${times(s.hpCoef)}</td></tr>`;
    }).join("");
    return {
      title: st.name,
      html: `
        <p>Where she sits in the field, and when she spends what she has. She does not
        choose it and neither do you &mdash; it is who she is.</p>
        <p><b>${who} runs as a ${st.name}</b>: she settles
        ${st.gap === 0 ? "on the lead" : "about " + st.gap + "m off the pace"} and finishes
        at ${(st.phase[2] * 100).toFixed(1)}% of the field's base pace, with a stamina pool
        ${times(st.hpCoef)} the baseline.</p>
        <table class="gl-tab"><thead><tr><th>Style</th><th>Sits</th>
          <th>Final pace</th><th>Stamina</th></tr></thead><tbody>${rows}</tbody></table>
        <p class="gl-tip">Front runners trade a big stamina pool for track position;
        closers carry more fuel and need somewhere to spend it. Neither is better &mdash;
        they lose to different things.</p>`,
    };
  }

  /** The five trained stats. */
  const STAT_TEXT = {
    speed:   ["Speed", "Her top pace, and the largest single term in how fast she runs. It is worth the most in the final stretch, when everyone is trying to go faster at once."],
    stamina: ["Stamina", "The size of her fuel tank. Run out and she drops to a crawl for the rest of the race &mdash; the most brutal way to lose, because it happens with the line in sight."],
    power:   ["Power", "How quickly she reaches her pace and how well she holds position in traffic. It decides whether she can take a gap when one opens."],
    guts:    ["Guts", "What she has left when the tank is nearly empty. It keeps her going in the last stretch after stamina has stopped covering her."],
    wit:     ["Wit", "How efficiently she runs. Wit lowers the stamina cost of every metre, and it is the one training that gives energy back instead of taking it."],
  };
  function stat(key, def) {
    const t = STAT_TEXT[key];
    if (!t) return { title: "Stat", html: "<p>Unknown stat.</p>" };
    const v = def && def.stats ? def.stats[key] : null;
    return {
      title: t[0],
      html: `<p>${t[1]}</p>` +
        (v != null ? `<p class="gl-mine"><b>${def ? esc(def.name) : "She"} has ${v}.</b></p>` : "") +
        `<p class="gl-tip">Build toward the shape the trip needs rather than levelling
         everything. A specialist beats a generalist at her own distance.</p>`,
    };
  }

  /** Her unique skill: the one thing only she can do. */
  function unique(_key, def) {
    const u = def && def.unique;
    if (!u) return { title: "Unique skill",
                     html: "<p>She has no unique skill of her own.</p>" };

    /* Describe the trigger and the effects from the data, so the panel cannot drift from
       what uniques.js will actually fire. */
    const U = root.Uniques || (typeof require !== "undefined" ? require("./uniques.js") : null);
    const trig = U ? U.describe(u.when) : [];
    // a precondition held at some earlier moment, not at the same instant as the trigger
    const earlier = U && u.pre ? U.describe(u.pre) : [];

    const EFFECT = {
      heal:  a => "recovers <b>" + Math.round(a * 100) + "%</b> of her stamina",
      speed: a => "gains <b>+" + Math.round(a * 100) + "%</b> pace",
      accel: a => "accelerates <b>" + Math.round(a * 100) + "%</b> harder",
      drain: a => "burns <b>" + Math.round(Math.abs(a) * 100) + "%</b> " + (a < 0 ? "less" : "more") + " stamina",
      spirit: a => "gains <b>" + a + "</b> spirit",
    };
    // durations are per 1000 m, as in the game, so say what that comes to
    const fxList = list => (list || []).map(e => {
      const f = EFFECT[e.t];
      const body = f ? f(e.amount) : e.t + " " + e.amount;
      return "<li>" + body + (e.dur ? " for <b>" + +(e.dur * 1.6).toFixed(1) + "s</b> over a mile, " +
        "<b>" + +(e.dur * 2.4).toFixed(1) + "s</b> over 2400m" : "") + "</li>";
    }).join("");
    const fx = fxList(u.effects);
    /* The real game's extra condition groups: a stronger version (McQueen over a long
       trip) or a second activation (Suzuka, still clear late on). */
    const gs = u.groups || [];
    const main = gs.map(g => !g.follow).lastIndexOf(true);       // the headline group
    const extra = gs.filter((g, i) => i !== main).map(g => U ? `
        <p><b>${g.follow ? "And afterwards" : "Stronger still"}</b>, when
        ${U.describe(g.when).join(", and ")}:</p><ul class="gl-fx">${fxList(g.effects)}</ul>` : "").join("");

    return {
      title: esc(u.name),
      html: `
        <p class="gl-uni">${esc(u.text || "")}</p>
        <p><b>Unique skills</b> are the one thing a racer brings that nobody else has.
        Every racer has exactly one, it costs nothing, and it fires by itself &mdash; once
        per race, the first moment its condition is true.</p>
        <p><b>It fires when</b> ${trig.length ? trig.join(", and ") : "the race begins"}${
          earlier.length ? ` &mdash; but only if, earlier on, ${earlier.join(", and ")}` : ""}.</p>
        ${fx ? `<p><b>What it does</b></p><ul class="gl-fx">${fx}</ul>` : ""}${extra}
        ${def.gametora ? `<p class="gl-tip">Her real unique, from the Global game.</p>` : ""}
        <p class="gl-tip">You cannot trigger it and you cannot stop it. What you can do is
        build her so the moment it fires is a moment worth having &mdash; a stamina
        recovery is wasted on a racer who was never going to run out.</p>`,
    };
  }

  /** A passive, unlocked with duplicate pulls. */
  function passive(key, def) {
    const P = (root.Progress && Progress.PASSIVES) ? Progress.PASSIVES[key] : null;
    if (!P) return { title: "Passive", html: "<p>Unknown passive.</p>" };
    const S = root.Stable;
    const idx = def && def.passives ? def.passives.indexOf(key) : -1;
    const need = (S && def && idx >= 0) ? S.thresholdsFor(def.id)[idx] : null;
    const have = (S && def) ? S.dupesOf(def.id) : 0;
    const on = (S && def) ? have >= (need || Infinity) : false;
    return {
      title: esc(P.name),
      html: `
        <p>${esc(P.text)}</p>
        <p><b>Passives</b> are always on. They need no spirit, no card and no decision
        &mdash; once unlocked she carries them into every race for good.</p>
        ${need != null ? `<p class="gl-mine">${on
          ? `<b>Unlocked.</b> ${def ? esc(def.name) : "She"} has this in every race.`
          : `<b>Needs ${need} copies</b> of ${def ? esc(def.name) : "her"} &mdash; you have
             ${have}. Duplicate pulls feed straight in.`}</p>` : ""}
        <p class="gl-tip">Rarer racers need fewer copies, because you see them less often.</p>`,
    };
  }

  /**
   * The one entry point. `kind` names the sort of label that was clicked, `key` which
   * one, and `def` the racer it belongs to so the answer can be about her.
   */
  function look(kind, key, def) {
    switch (kind) {
      case "dist":   return distance(key, def);
      case "surf":   return surface(key, def);
      case "card":   return card(key, def);
      case "rarity": return rarity(+key, def);
      case "style":  return style(key, def);
      case "stat":   return stat(key, def);
      case "unique": return unique(key, def);
      case "passive": return passive(key, def);
      default:       return { title: "Nothing to say", html: "<p>No explanation for that yet.</p>" };
    }
  }

  const api = { look, GRADES, distSpeed, surfSpeed, distDrain, bands };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Glossary = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
