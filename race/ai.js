/*
 * Racer card AI -- every runner in the field, including the player's.
 *
 * Nobody plays cards by hand. Each racer fires the cards in their own deck according
 * to their PERSONALITY, and the player's leverage is deck construction: give a racer
 * cards their temperament will actually use well.
 *
 * Two dials, deliberately separate:
 *   personality -- WHAT they want to do (fire early, hoard, play safe, act at random)
 *   wit         -- HOW ACCURATELY they execute that intent
 * A reckless racer with high wit is reliably reckless. A calculating racer with low
 * wit means well and mistimes it anyway.
 *
 * Depends on Sim and Cards. Exposes Racers.
 */
(function (root) {
  "use strict";

  const Sim   = typeof require !== "undefined" ? require("./sim.js")   : root.Sim;
  const Cards = typeof require !== "undefined" ? require("./cards.js") : root.Cards;

  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;

  /*
   * fracBias  + means they think the race is further along than it is, so they fire early
   * hpBias    + means they overestimate what is left in the tank
   * poise     how tightly they hold to their own intent; low poise fires on noise
   * favours   per-card-kind appetite; >1 means they reach for that kind of card
   * The deck-building puzzle lives in `favours`: hand a Reckless racer a patient
   * closing card and they will spend it on the back stretch.
   */
  const PERSONALITIES = {
    calculating: { name: "Calculating", fracBias:  0.00, hpBias:  0.00, poise: 1.00,
      favours: { Burst: 1.0, Gamble: 0.7, Recovery: 1.0, Tempo: 1.2, Counter: 1.1, Support: 1.0 },
      blurb: "Reads the race properly and waits for the right moment." },
    patient: { name: "Patient", fracBias: -0.14, hpBias: -0.04, poise: 0.92,
      favours: { Burst: 1.25, Gamble: 0.8, Recovery: 0.9, Tempo: 1.1, Counter: 1.0, Support: 0.9 },
      blurb: "Sits on everything until the straight. Wasted on cheap early cards." },
    aggressive: { name: "Aggressive", fracBias: 0.16, hpBias: 0.10, poise: 0.80,
      favours: { Burst: 1.3, Gamble: 1.2, Recovery: 0.6, Tempo: 0.9, Counter: 1.0, Support: 0.7 },
      blurb: "Goes early and often. Wants cheap bursts, not slow value." },
    reckless: { name: "Reckless", fracBias: 0.34, hpBias: 0.28, poise: 0.55,
      favours: { Burst: 1.4, Gamble: 1.6, Recovery: 0.4, Tempo: 0.6, Counter: 0.9, Support: 0.5 },
      blurb: "Spends everything the moment it is affordable. Give her cheap cards." },
    cautious: { name: "Cautious", fracBias: -0.06, hpBias: -0.18, poise: 0.88,
      favours: { Burst: 0.7, Gamble: 0.3, Recovery: 1.6, Tempo: 1.4, Counter: 1.0, Support: 1.4 },
      blurb: "Protects the stamina pool first. Rarely wastes a card, rarely wins big." },
    relentless: { name: "Relentless", fracBias: 0.06, hpBias: -0.10, poise: 0.75,
      favours: { Burst: 1.0, Gamble: 0.8, Recovery: 1.5, Tempo: 1.0, Counter: 0.8, Support: 1.3 },
      blurb: "Refuses to fade. Keeps topping up rather than swinging for the lead." },
    opportunist: { name: "Opportunist", fracBias: -0.04, hpBias: 0.02, poise: 0.95,
      favours: { Burst: 1.15, Gamble: 0.9, Recovery: 1.0, Tempo: 1.0, Counter: 1.5, Support: 1.0 },
      blurb: "Watches the field rather than the clock. Punishes a rival's mistake." },
    erratic: { name: "Erratic", fracBias: 0.10, hpBias: 0.10, poise: 0.18,
      favours: { Burst: 1.1, Gamble: 1.5, Recovery: 0.9, Tempo: 0.9, Counter: 1.1, Support: 0.9 },
      blurb: "No pattern anyone has ever identified. Deck-build for chaos." },
  };

  /** A racer's signature card is the one printed with their name. */
  function signatureFor(racerName) {
    return Cards.CARDS.find(c => c.name === racerName) || null;
  }

  /* How much of a racer's misjudgement comes from temperament rather than from WIT.
     Wit carries the weight -- it is the stat the player levels, so it should decide
     whether a deck gets used well. Personality is flavour on top: it colours WHICH
     cards a racer reaches for, not whether they are competent. Measured at 0.12, the
     wit spread runs about twice the personality spread. */
  const PERSONALITY_WEIGHT = 0.12;

  const DECK_SIZE = 15;      // what the player constructs
  const ACTIVE_SIZE = 5;     // drawn from the deck at the gate
  const CALLOUTS = 2;        // redraws the coach may spend, any time
  /* Tuned three times, and the number matters more than it looks.
     14: spirit was the limit, ~4 cards affordable, and refreshing the hand bought
         nothing -- Callouts measured actively HARMFUL.
     22: the hand became the constraint, but an all-Epic deck could still fill every
         slot, so cost stopped meaning anything -- cost-5 decks won every race.
     15: measured flattest. Cheap decks must spend Callouts to convert their spirit
         surplus into plays; expensive decks cannot use Callouts at all because they
         run out of spirit, not cards. That trade is the point. */
  const SPIRIT_BUDGET = 15;
  const SPIRIT_CAP = 8;

  /* Full-deck races (the Dream Trophy career): no hand, no draw. All fifteen cards are in
     reach from the gate, so the deck cannot run dry and spirit is the only thing that
     limits her. A Callout cannot redraw anything, so it changes meaning: the trainer
     shouts "now", and she plays the card that is right for this moment -- read by the
     trainer, not through her own wit -- without paying spirit for it. Same two per race,
     same button. `spirit` was set by validate-balance's full-deck section. */
  const FULL_DECK = { spirit: 15, callouts: 2 };

  /* The Dream Trophy field reads a race better than the URA field does: less of the wit
     misjudgement (the lever the Cool Head passive halves), and they spend their own
     Callouts -- which no URA rival ever does. Measured with validate-career's same-race
     comparison, the read is the part that tells: against rivals racing decks as good as
     hers, x0.5 took her from winning 87% of the races she won in a URA field to 72%, and
     steadier hands (less impulsive firing) measured nothing, so they are not here. 0.85
     is the setting the whole scenario was tuned at. validate-balance shows the full
     effect at parity. */
  const SHARP = { biasMul: 0.85, calls: true };

  function shuffle(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = (rng() * (i + 1)) | 0;
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  /** A stand-in deck for racers the player has not built one for. */
  function buildDeck(racer, rng) {
    const sig = Cards.CARDS.filter(c => c.name === racer.name);
    const rest = shuffle(Cards.CARDS.filter(c => c.name !== racer.name).slice(), rng);
    const deck = sig.slice(0, 3);
    while (deck.length < DECK_SIZE && rest.length) deck.push(rest.shift());
    return deck;
  }

  /** How badly this racer misreads the race, from wit alone. 0 at 1200 wit, ~0.42 at 100. */
  function witBias(wit) {
    return (1 - clamp(wit / 1200, 0, 1)) * 0.46;
  }

  /**
   * How good is playing this card RIGHT NOW, through this racer's eyes? Roughly 0..1.
   * `p` is the personality; its biases are what make one racer fire on the back
   * stretch and another hold for the straight.
   */
  /* The frac at which a card stops being legal. Phase 0 ends at 1/6, phase 1 at 2/3. */
  function windowEnd(card) {
    if (!card.phases || card.phases.length >= 3) return 1;
    const last = Math.max.apply(null, card.phases);
    return last === 0 ? 1 / 6 : last === 1 ? 2 / 3 : 1;
  }
  function windowStart(card) {
    if (!card.phases || card.phases.length >= 3) return 0;
    const first = Math.min.apply(null, card.phases);
    return first === 0 ? 0 : first === 1 ? 1 / 6 : 2 / 3;
  }

  function timingScore(card, r, S, course, p, bias) {
    const b = bias || 0;
    const frac = clamp(r.pos / course.distance + b + p.fracBias * PERSONALITY_WEIGHT, 0, 1);
    const hpF  = clamp(r.hp / r.maxHp + b * 0.5 + p.hpBias * PERSONALITY_WEIGHT, 0, 1);
    let score;

    switch (card.kind) {
      case "Recovery":
        score = hpF > 0.75 ? 0 : clamp((0.75 - hpF) / 0.55, 0, 1);
        break;
      case "Burst":
      case "Gamble": {
        if (hpF < 0.18) { score = 0.1; break; }
        const late = clamp((frac - 0.58) / 0.30, 0, 1);
        score = late * clamp(hpF * 1.6, 0, 1);
        break;
      }
      case "Tempo":
        score = clamp((0.80 - frac) / 0.6, 0, 1) * (r.blocked ? 1 : 0.62);
        break;
      case "Counter":
        score = frac > 0.5 && S.racers.some(o => o !== r && o.pos > r.pos + 1) ? 0.85 : 0.05;
        break;
      case "Support":
        score = r.blocked ? 0.9 : (hpF > 0.7 ? 0.15 : clamp((0.7 - hpF) / 0.5, 0, 1));
        break;
      default:
        score = clamp((frac - 0.6) / 0.3, 0, 1);
    }
    /* Use it or lose it. A card whose legal window is closing gets more urgent, which
       is the only thing that makes opening-only cards playable at all: their natural
       score is zero for the whole time they are legal, so without this they can never
       be fired and simply rot in the deck. */
    const end = windowEnd(card);
    if (end < 1) {
      const start = windowStart(card);
      const through = clamp((r.pos / course.distance - start) / Math.max(0.01, end - start), 0, 1);
      score = Math.max(score, through * 0.95);
    }

    const raw = p.favours[card.kind] || 1;
    return score * (1 + (raw - 1) * PERSONALITY_WEIGHT * 1.6);
  }

  /**
   * Build the controller for one racer. `deck` is the constructed 15; ACTIVE_SIZE of
   * them are drawn at the gate. Played cards are spent -- the active set only refills
   * when the coach spends a Callout.
   *
   * `rules` (optional): { fullDeck } puts the whole deck in reach and turns the Callout
   * into "play the right card now"; { sharp } is the Dream Trophy field's better read.
   */
  function makeController(racer, personalityKey, seed, deck, rules) {
    rules = rules || {};
    const rng = Sim.mulberry32(seed >>> 0);
    const p = PERSONALITIES[personalityKey] || PERSONALITIES.calculating;
    const full = shuffle((deck && deck.length ? deck.slice() : buildDeck(racer, rng)), rng);
    const fullDeck = !!rules.fullDeck, sharp = !!rules.sharp;
    return {
      racer, rng, p, personality: personalityKey, fullDeck, sharp,
      library: fullDeck ? [] : full.slice(ACTIVE_SIZE),
      active: fullDeck ? full : full.slice(0, ACTIVE_SIZE),
      discard: [], played: [], spent: 0, cooldown: 0,
      callouts: fullDeck ? FULL_DECK.callouts : CALLOUTS,
      bias: witBias(racer.stats.wit) * ((racer.mods && racer.mods.biasMul) || 1) *
            (sharp ? SHARP.biasMul : 1),
      poise: clamp((0.20 + 0.80 * clamp(racer.stats.wit / 1150, 0, 1.1)) *
                   (0.72 + 0.28 * p.poise), 0.08, 1),
      budget: (fullDeck ? FULL_DECK.spirit : SPIRIT_BUDGET) +
              ((racer.mods && racer.mods.spirit) || 0),
    };
  }

  /* `rules` is either one rules object for the whole field or a function of the racer,
     so a career can hand the trainee and her rivals different ones. */
  function createField(S, personalities, seed, decks, rules) {
    return S.racers.map((r, i) => makeController(
      r,
      (personalities && personalities[r.id]) || "calculating",
      (seed + i * 6151) >>> 0,
      decks && decks[r.id],
      typeof rules === "function" ? rules(r) : rules
    ));
  }

  function spiritOf(ct, course) {
    const frac = clamp(ct.racer.pos / course.distance, 0, 1);
    return Math.min(SPIRIT_CAP, 2 + (ct.budget - 2) * frac - ct.spent);
  }

  /**
   * Spend a Callout: the current hand is DISCARDED -- those cards are gone for the rest
   * of the race -- and a fresh set is drawn from what is left of the deck.
   *
   * Discarding rather than reshuffling is what gives the Callout a price. Under the old
   * rule the hand went back into the library, so calling out with five playable cards
   * cost nothing and the correct play was close to "call out whenever". Now it burns
   * five cards, so the decision is genuinely about whether this hand is worth keeping.
   *
   * The deck size is not a coincidence: 15 cards is exactly three hands of five, so the
   * opening draw plus both Callouts consume the deck and no card is unreachable.
   *
   * Refuses when the library is empty -- discarding a hand for nothing is never right,
   * and the UI should not offer it.
   */
  function callout(ct, S, course) {
    if (ct.fullDeck) return callNow(ct, S, course);
    if (ct.callouts <= 0 || !ct.library.length) return false;
    ct.callouts--;
    for (const c of ct.active) if (c) ct.discard.push(c);
    ct.active = ct.library.splice(0, ACTIVE_SIZE);
    ct.cooldown = Math.max(ct.cooldown, 0.35);   // a beat before the new set is read
    return true;
  }

  /* The trainer's read: no wit misjudgement, no temperament. Whatever her personality
     would have reached for, the rail sees the race as it is. */
  const TRAINER_EYE = { fracBias: 0, hpBias: 0, poise: 1,
    favours: { Burst: 1, Gamble: 1, Recovery: 1, Tempo: 1, Counter: 1, Support: 1 } };

  /**
   * The card a full-deck Callout would play right now, or null. Legal now apart from
   * spirit (the Callout pays for it), and the best-timed by the trainer's read; when
   * nothing is timed for this moment at all, the strongest.
   */
  function callPick(ct, S, course) {
    const r = ct.racer;
    if (!S || !course || r.finished) return null;
    const phase = Sim.phaseOf(clamp(r.pos / course.distance, 0, 1));
    let best = -1, bestScore = -1;
    for (let i = 0; i < ct.active.length; i++) {
      const c = ct.active[i];
      if (!c || Cards.playable(c, r, S, 99, phase)) continue;
      const w = Cards.weight(c);
      const sc = timingScore(c, r, S, course, TRAINER_EYE, 0) * (1 + w * 0.012) + w * 1e-4;
      if (sc > bestScore) { best = i; bestScore = sc; }
    }
    return best < 0 ? null : { idx: best, card: ct.active[best], score: bestScore };
  }

  /** Full-deck Callout: she plays the pick now, free. Returns the play, as update() does. */
  function callNow(ct, S, course) {
    if (ct.callouts <= 0) return false;
    const pick = callPick(ct, S, course);
    if (!pick) return false;
    ct.callouts--;
    return fire(ct, pick.idx, S, true);
  }

  /** Would a Callout actually give this racer anything? */
  const canCallout = (ct, S, course) => ct.callouts > 0 &&
    (ct.fullDeck ? !S || !!callPick(ct, S, course) : ct.library.length > 0);

  /** Spend a card from the active set. `free` is a full-deck Callout's play. */
  function fire(ct, idx, S, free) {
    const card = ct.active[idx];
    if (!free) ct.spent += card.cost;
    ct.active.splice(idx, 1);
    ct.discard.push(card);
    ct.played.push(card.id);
    ct.cooldown = 1.1;
    const res = Cards.play(card, ct.racer, S, Sim);
    return { racer: ct.racer, card, msg: card.ability, target: res.target, free: !!free };
  }

  /* When a full-deck Callout is well spent: in the run-in, the last tenth of the trip, on
     a card that is actually timed for it. Measured at parity (validate-balance), across
     weak, middling and strong fields alike, this was the one rule that always paid --
     about two places. Earlier is worse, not better: the free card she plays as the final
     phase opens is usually pace she then cannot afford, and calls at the gate go on cards
     that would have come good anyway. The race screen marks the moment; sharp rivals
     call on it. */
  const RUN_IN = 0.9;
  function callDue(ct, S, course) {
    if (!ct.fullDeck || ct.callouts <= 0 || ct.racer.finished) return null;
    if (ct.racer.pos / course.distance <= RUN_IN) return null;
    const pick = callPick(ct, S, course);
    return pick && pick.score > 0.1 ? pick : null;
  }

  /** A sharp rival spends her own Callouts, and spends them when they pay. */
  function sharpCall(ct, S, course) {
    if (!ct.sharp || !SHARP.calls || ct.cooldown > 0) return null;
    const pick = callDue(ct, S, course);
    if (!pick) return null;
    ct.callouts--;
    return fire(ct, pick.idx, S, true);
  }

  function update(ct, S, course, dt) {
    const r = ct.racer;
    if (r.finished || !ct.active.length) return null;

    ct.cooldown -= dt;
    if (ct.cooldown > 0) return null;

    const called = sharpCall(ct, S, course);
    if (called) return called;

    const frac = clamp(r.pos / course.distance, 0, 1);
    const spirit = spiritOf(ct, course);
    const phase = Sim.phaseOf(frac);

    let best = null, bestScore = 0, bestIdx = -1;
    for (let i = 0; i < ct.active.length; i++) {
      const c = ct.active[i];
      if (!c || Cards.playable(c, r, S, spirit, phase)) continue;
      // among equally-timed options, prefer the stronger card
      const sc = timingScore(c, r, S, course, ct.p, ct.bias) * (1 + Cards.weight(c) * 0.012);
      if (sc > bestScore) { best = c; bestScore = sc; bestIdx = i; }
    }
    if (!best) return null;

    const BAR = 0.62;
    let go = bestScore >= BAR;
    if (!go && bestScore > 0.15) {
      const impulse = (1 - ct.poise) * 0.55;
      if (ct.rng() < impulse * dt) go = true;
    }
    if (!go && frac > 0.88 && bestScore > 0.10) go = true;
    if (!go) return null;
    return fire(ct, bestIdx, S, false);
  }

  function updateAll(controllers, S, course, dt) {
    const events = [];
    for (const ct of controllers) {
      const e = update(ct, S, course, dt);
      if (e) events.push(e);
    }
    return events;
  }

  const api = { PERSONALITIES, DECK_SIZE, ACTIVE_SIZE, CALLOUTS, SPIRIT_BUDGET, FULL_DECK, SHARP,
                RUN_IN, createField, makeController, updateAll, update, callout, canCallout,
                callPick, callDue, spiritOf, timingScore, buildDeck, shuffle };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Racers = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
