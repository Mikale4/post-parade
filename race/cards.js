/*
 * Card rules -- a generic interpreter over the generated pool in carddata.js.
 *
 * Cards are data, not code: a card is a list of typed effects plus the conditions under
 * which it is legal. Hand-written per-card functions do not survive a hundred-card pool,
 * and having one interpreter means a balance change lands everywhere at once.
 *
 * Effect types:
 *   speed    fraction of pace, for `dur` seconds
 *   drain    fraction of stamina burn, for `dur` seconds; negative saves stamina
 *   `delay`  optional, on speed/drain: the effect starts this many seconds later. Used
 *            for the crash after a Gamble, which must cost something even on a short
 *            trip where the stamina pool is too deep for a drain penalty to bite.
 *   heal     fraction of the stamina pool, applied instantly
 *   unblock  immune to traffic for `dur` seconds
 *   invest   Tempo: cut drain now, then a speed payoff scaled by stamina still in hand.
 *            With `whenPhase` the payoff waits for that phase instead of a stopwatch, so
 *            the card is played early and collected in the straight -- and wasted if the
 *            race ends first.
 *   steal    Counter: the racer DIRECTLY AHEAD loses pace and you gain it
 *   draft    Support: live pace bonus scaled by closeness to the racer ahead
 *   gambit   a burst that judges itself. After `dur` the sim checks whether the racer
 *            gained a place: if so they get `reward` stamina back, if not they eat a
 *            `crash` speed penalty for `crashDur`. Resolved in sim.js, reported on
 *            S.events so the UI can show the outcome.
 */
(function (root) {
  "use strict";

  const Data = typeof require !== "undefined" ? require("./carddata.js") : root.CardData;
  const CARDS = Data.CARD_DATA;
  const byId = Object.fromEntries(CARDS.map(c => [c.id, c]));

  const PHASE_NAME = ["opening", "middle", "final"];

  /** Null when the card can be played right now, else a short reason why not. */
  function playable(card, r, S, spirit, phase) {
    if (r.finished) return "race over";
    if (spirit < card.cost) return "not enough spirit";
    if (card.phases && !card.phases.includes(phase)) {
      return card.phases.length === 1
        ? PHASE_NAME[card.phases[0]] + " phase only"
        : "wrong phase";
    }
    const c = card.cond;
    if (c) {
      const hpF = r.hp / r.maxHp;
      if (c.hpBelow != null && !(hpF < c.hpBelow)) return "needs low stamina";
      if (c.hpAbove != null && !(hpF > c.hpAbove)) return "needs high stamina";
      if (c.blocked && !r.blocked) return "not boxed in";
    }
    const needsSomeoneAhead = card.target === "leader" ||
                              card.effects.some(e => e.t === "steal" || e.t === "draft");
    if (needsSomeoneAhead && !S.racers.some(o => o !== r && !o.finished && o.pos > r.pos)) {
      return "you are in front";
    }
    return null;
  }

  function resolveTarget(card, r, S) {
    if (card.target !== "leader") return r;
    let lead = null;
    for (const o of S.racers) {
      if (o === r || o.finished) continue;
      if (!lead || o.pos > lead.pos) lead = o;
    }
    return lead || r;
  }

  /**
   * Apply a card. Caller owns spirit and the active set.
   * Returns {target, msg}.
   */
  function play(card, r, S, Sim) {
    const tgt = resolveTarget(card, r, S);
    for (const e of card.effects) {
      switch (e.t) {
        case "heal": {
          /* `scale` makes Recovery a desperation card: it returns `amount` at full
             stamina and `amount + scale` at empty, so holding it is a real decision
             rather than a formality. */
          const frac = Math.max(0, Math.min(1, tgt.hp / tgt.maxHp));
          const amt = e.amount + (e.scale || 0) * (1 - frac);
          tgt.hp = Math.min(tgt.maxHp, tgt.hp + tgt.maxHp * amt);
          if (tgt.hp > 0) tgt.exhausted = false;
          break;
        }
        case "invest":
          // pace yourself now, cash it in later -- payoff scales with what is left
          Sim.applyBuff(tgt, { stat: "drain", amount: e.amount, mul: true,
                               until: S.t + e.dur, label: card.ability });
          Sim.schedule(tgt, { kind: "invest", at: S.t + e.dur, min: e.min, max: e.max,
                              payDur: e.payDur, whenPhase: e.whenPhase,
                              label: card.ability });
          break;
        case "steal": {
          /* Counter aimed at whoever is directly in front, not the distant leader:
             they lose the pace and you take it. Useless from the front, which is the
             point -- it is a card for the racer doing the chasing. */
          const victim = Sim.racerAhead(S, r);
          if (!victim) break;
          Sim.applyBuff(victim, { stat: "speed", amount: -e.amount, mul: true,
                                  until: S.t + e.dur, label: card.ability });
          Sim.applyBuff(r, { stat: "speed", amount: e.amount * (e.keep || 1), mul: true,
                             until: S.t + e.dur, label: card.ability });
          break;
        }
        case "draft":
          // pace scaled every tick by how close the racer ahead is; nothing in clear air
          Sim.applyBuff(tgt, { stat: "draft", amount: e.amount, mul: true,
                               until: S.t + e.dur, label: card.ability });
          break;
        case "speed":
          Sim.applyBuff(tgt, { stat: "speed", amount: e.amount, mul: true,
                               from: S.t + (e.delay || 0),
                               until: S.t + (e.delay || 0) + e.dur, label: card.ability });
          break;
        case "drain":
          Sim.applyBuff(tgt, { stat: "drain", amount: e.amount, mul: true,
                               from: S.t + (e.delay || 0),
                               until: S.t + (e.delay || 0) + e.dur, label: card.ability });
          break;
        case "unblock":
          Sim.applyBuff(tgt, { stat: "unblock", amount: 1, mul: false,
                               until: S.t + e.dur, label: "Clear" });
          break;
        case "gambit":
          /* Go for it, then find out. The burst runs now; when it ends the sim checks
             whether the racer actually gained a place. Won: a breath back. Lost: the
             crash. The card is worth playing or not depending on whether the move comes
             off, which is what a gamble is supposed to mean. */
          Sim.applyBuff(tgt, { stat: "speed", amount: e.amount, mul: true,
                               until: S.t + e.dur, label: card.ability });
          Sim.schedule(tgt, {
            kind: "gambit", at: S.t + e.dur, rankAt: Sim.rankOf(S, tgt),
            places: e.places || 1, crash: e.crash, crashDur: e.crashDur, label: card.ability,
          });
          break;
      }
    }
    return { target: tgt, msg: card.ability + (tgt !== r ? " → " + tgt.name : "") };
  }

  /** Rough power score, used by the AI to prefer the better of two legal cards. */
  function weight(card) {
    let w = 0;
    for (const e of card.effects) {
      if (e.t === "speed") w += Math.abs(e.amount) * (e.dur || 1) * 10;
      else if (e.t === "heal") w += e.amount * 14;
      else if (e.t === "drain") w += Math.max(0, -e.amount) * (e.dur || 1) * 3;
      else if (e.t === "unblock") w += (e.dur || 1) * 0.35;
      else if (e.t === "gambit") w += Math.abs(e.amount) * (e.dur || 1) * 8;
      else if (e.t === "invest") w += ((e.max || 0) * (e.payDur || 1)) * 7;
      else if (e.t === "steal") w += Math.abs(e.amount) * (e.dur || 1) * 14;
      else if (e.t === "draft") w += Math.abs(e.amount) * (e.dur || 1) * 6;
    }
    return w;
  }

  const api = { CARDS, byId, playable, play, weight, resolveTarget, PHASE_NAME };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Cards = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
