/*
 * Rivalries: two racers neck and neck long enough lock eyes, and a clash begins.
 *
 * The rule. Two of the front 60% of the field, past half-way, within three metres of each
 * other (a length or so, in any lanes) for eight seconds of race time -- two and a half in
 * the final third, where duels are run -- are rivals. Each racer has at most one rivalry a
 * race. A rivalry fires both racers' signature skills there and then, whatever their
 * conditions and even if they have already fired. It does not count as a use: a skill not
 * yet used on its own can still fire normally later (Uniques.force). Over a large run of
 * simulated races this comes to about two a race (none in 1 race in 25), one of them in
 * the final third, the typical one 60% of the way round; a given racer is in one in a
 * little over a third of her races.
 *
 * What they tell themselves, eyeing each other: it depends on how well they know each other.
 *   vs     her lines for one rival in particular -- a roommate, a teammate she has history
 *          with, the rival of her life
 *   known  for anyone she knows: the same team, the same generation, the same family
 *          ({rival} is the other's name)
 *   any    for a stranger, in her own voice
 * Written for this game, from who they are in the games, the shows and the films.
 *
 *   Rivals.check(S, course, dt)   -> [{ a, b, final }] new this tick (marks them)
 *   Rivals.lines(a, b)            -> { a: text, b: text }  what each says to herself
 */
(function (root) {
  "use strict";

  const NEAR = 3.0;                              // metres apart, whatever their lanes: a length or so
  /* Race seconds of it before they are rivals. Through the middle of the race the pack runs
     together, so it takes a long spell there; the final third is where duels are run. */
  const HOLD = 8.0, HOLD_FINAL = 2.5;
  const FROM = 0.5, CONTENDERS = 0.6;            // not before half-way; only between the front 60% of the field

  /** Pairs of contenders that have stayed close this race, and for how long. Out of the
      gate the whole field runs together at the same pace, so nothing before half-way, and
      nobody at the back is duelling for anything. */
  function check(S, course, dt) {
    const out = [], T = S._rivalT || (S._rivalT = new Map());
    const front = S.racers.filter(r => !r.finished).sort((a, b) => b.pos - a.pos)
      .slice(0, Math.ceil(S.racers.length * CONTENDERS));
    const live = front.filter(r => !r.rivalDone && r.pos / course.distance >= FROM), close = new Set();
    for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
      const a = live[i], b = live[j];
      if (a.rivalDone || b.rivalDone) continue;
      if (Math.abs(a.pos - b.pos) < NEAR) {
        // the same pair whichever of them is ahead: this close, they swap all the time
        const key = a.id < b.id ? a.id + "|" + b.id : b.id + "|" + a.id;
        const t = (T.get(key) || 0) + dt, final = Math.max(a.pos, b.pos) / course.distance >= 2 / 3;
        T.set(key, t); close.add(key);
        if (t >= (final ? HOLD_FINAL : HOLD)) {
          a.rivalDone = b.rivalDone = true; a.rival = b; b.rival = a;
          out.push({ a, b, final });
        }
      }
    }
    // anyone apart, or out of contention, starts again from nothing
    for (const key of T.keys()) if (!close.has(key)) T.delete(key);
    return out;
  }

  const bare = s => String(s || "").replace(/​/g, "");
  // what they call each other
  const CALL = {
    "Special Week": "Spe", "Silence Suzuka": "Suzuka", "Tokai Teio": "Teio", "Oguri Cap": "Oguri",
    "Taiki Shuttle": "Taiki", "Mejiro McQueen": "McQueen", "Symboli Rudolf": "Rudolf", "T.M. Opera O": "Opera O",
    "Daiwa Scarlet": "Scarlet", "Grass Wonder": "Grass", "El Condor Pasa": "El", "Mayano Top Gun": "Mayano",
    "Super Creek": "Creek", "Mejiro Ryan": "Ryan", "Agnes Tachyon": "Tachyon", "Winning Ticket": "Ticket",
    "Sakura Bakushin O": "Bakushin", "Haru Urara": "Urara", "Matikanefukukitaru": "Fukukitaru",
    "Nice Nature": "Nature", "King Halo": "King",
  };
  // who knows whom: a team, a generation, a family
  const CIRCLES = [
    ["Special Week", "Silence Suzuka", "Tokai Teio", "Mejiro McQueen", "Gold Ship", "Vodka", "Daiwa Scarlet"],   // Team Spica
    ["Symboli Rudolf", "Air Groove", "Taiki Shuttle", "Grass Wonder", "El Condor Pasa", "Maruzensky"],          // Team Rigil
    ["Special Week", "Grass Wonder", "El Condor Pasa", "King Halo"],                                             // one generation
    ["Mejiro McQueen", "Mejiro Ryan"],                                                                           // the Mejiro
    ["Oguri Cap", "Super Creek"],
  ];
  // the ones who make it their business to know everyone: the president, and a scientist
  const KNOWS_ALL = new Set(["Symboli Rudolf", "Agnes Tachyon"]);

  const L = {
    "Special Week": {
      vs: { "Silence Suzuka": ["Suzuka-san... I've chased that back so long. Today I pass it!", "I promised to run beside you. Now I'll run past you!"],
            "El Condor Pasa": ["El-chan, the world can wait. This one's mine!", "You won't fly away this time!"],
            "Grass Wonder": ["Grass-chan... no holding back. Not even for you!", "Calm or not, I'm coming through!"],
            "King Halo": ["King-chan, sorry! First place is promised to Mom!"] },
      known: ["{rival}! I know your race. And mine's stronger!", "Not today, {rival}! Japan's best needs this one!"],
      any: ["Whoever you are, I'm not losing!", "Mom, watch me! I'm going!", "Dig in... dig in... now!"],
    },
    "Silence Suzuka": {
      vs: { "Special Week": ["Spe-chan... you've grown so fast. But the front is mine.", "Run with me, Spe-chan. Just not in front."],
            "El Condor Pasa": ["El... that wind of yours won't reach me."],
            "Grass Wonder": ["Grass... I won't let you see my back up close."] },
      known: ["{rival}. The view ahead only has room for one.", "...I'll leave you behind, {rival}."],
      any: ["The scenery up front... I want it.", "Nobody ahead. That's how it should be.", "Faster... just a little faster."],
    },
    "Tokai Teio": {
      vs: { "Symboli Rudolf": ["Kaichou! Watch me -- I'll beat even you!", "Seven crowns? I'm taking more!"],
            "Mejiro McQueen": ["McQueen! You're slow today! Teio wins!", "Not this time, McQueen. My legs are fine!"],
            "Nice Nature": ["Nature, you're always right there. Not anymore!"],
            "Mayano Top Gun": ["Mayano, this isn't a game! ...Okay, a bit. And I'm winning it!"] },
      known: ["{rival}? Ehehe. Watch the Teio Step!", "Sorry, {rival}, the invincible Teio's coming through!"],
      any: ["Unbeatable Teio, coming through!", "Too easy! Watch this!", "I'm not losing to anyone. Ever!"],
    },
    "Maruzensky": {
      known: ["Oh, {rival}~ Let big sister show you real speed!", "Cute, {rival}. Now hang on tight~"],
      any: ["Time to floor it~", "Super car mode. Ready, set, vroom~", "You're fun! But I'm faster~"],
    },
    "Oguri Cap": {
      vs: { "Super Creek": ["Creek... you never let up. Neither do I.", "We've done this before, Creek. I'm still hungry."] },
      known: ["{rival}. ...I won't give this up.", "I came a long way to run here, {rival}."],
      any: ["Kasamatsu is cheering. I can hear it.", "...I'm not done yet.", "One more push. Then food."],
    },
    "Taiki Shuttle": {
      known: ["{rival}! Let's ride! Last one home buys dinner!", "Howdy, {rival}! Hold on to your hat!"],
      any: ["Yeehaw! Full gallop!", "Big heart, big legs, big finish!", "Ain't nobody passing Taiki!"],
    },
    "Mejiro McQueen": {
      vs: { "Tokai Teio": ["Teio. I will not lose to you, of all people.", "Your step is light, Teio. Mine is a Mejiro's!"],
            "Rice Shower": ["Rice Shower... this time I'll be ready.", "Not again. Not to you, not here."],
            "Gold Ship": ["Gold Ship! Stop grinning at me and RUN!", "I refuse to lose to whatever you are!"],
            "Mejiro Ryan": ["Ryan! The Mejiro name rides with me today!"] },
      known: ["{rival}, a Mejiro does not yield.", "Grace under pressure, {rival}. Watch closely."],
      any: ["The Mejiro name rests on this stride.", "Elegance... and endurance!", "One parfait at the finish. Focus!"],
    },
    "Symboli Rudolf": {
      vs: { "Tokai Teio": ["Teio. Show me how far you've come.", "You chase my shadow, Teio. Then catch it."],
            "Air Groove": ["Air Groove. Discipline against discipline. Good."] },
      known: ["{rival}. I know your record well. And its limits.", "A worthy challenge, {rival}. I accept."],
      any: ["The emperor does not waver.", "Every student deserves my best. Here it is.", "Composure. Then strength."],
    },
    "Rice Shower": {
      vs: { "Mejiro McQueen": ["McQueen-san... Rice won't be scared this time.", "Rice will be the blue rose... and bloom!"] },
      known: ["{rival}-san... Rice won't give up!", "Rice can do this... Rice will catch {rival}-san!"],
      any: ["Rice wants to make someone happy...", "Don't look back... just run!", "Rice won't be the villain. Rice will win!"],
    },
    "T.M. Opera O": {
      known: ["Ah, {rival}! A worthy co-star for my aria!", "Bow, {rival}, for the curtain falls on you!"],
      any: ["The stage is set! The Opera begins!", "Behold my overture!", "An encore for the Opera!"],
    },
    "Gold Ship": {
      vs: { "Mejiro McQueen": ["McQueen! Race you to the dropkick!", "Hey McQueen, wanna see a trick? Watch my heels!"] },
      known: ["Yo, {rival}! Fancy a race to Pluto?", "{rival}! Prepare for the Golshi special!"],
      any: ["Time to go full warp drive!", "Who said I'd run straight? Surprise!", "Yakisoba on the line! Go go go!"],
    },
    "Vodka": {
      vs: { "Daiwa Scarlet": ["Scarlet! Don't think you can beat me, you show-off!", "Number one? Not today. Today's MY day, Scarlet!"] },
      known: ["{rival}, check out a real cool finish.", "Heh. Cool racers don't lose, {rival}."],
      any: ["Full throttle. Coolest way to win.", "Pedal to the metal!", "This is gonna look so cool."],
    },
    "Daiwa Scarlet": {
      vs: { "Vodka": ["Vodka! First place is MINE, got it?!", "You again?! I'll beat you by a mile!"] },
      known: ["{rival}, I'll be first. Always first!", "Out of my way, {rival}! Number one coming through!"],
      any: ["First! Nothing but first!", "Watch me take the top!", "I'm the best. I'll prove it right now!"],
    },
    "Grass Wonder": {
      vs: { "El Condor Pasa": ["El... forgive me. I'll win this one.", "Your wings against my resolve, El."],
            "Special Week": ["Spe-chan, a samurai never holds back.", "Forgive me, Spe-chan. Here I go."],
            "Silence Suzuka": ["Suzuka-san... this time I'll reach you."] },
      known: ["{rival}-san, I'll show you a calm, strong finish.", "Patience... and now, {rival}-san, the blade."],
      any: ["A still heart. A swift stride.", "Now is the moment.", "Gently... then all at once."],
    },
    "El Condor Pasa": {
      vs: { "Grass Wonder": ["Grass! El is flying past you!", "The world's best condor won't lose to her roommate!"],
            "Special Week": ["Spe-chan! Rematch time, and El wins!"],
            "Silence Suzuka": ["Suzuka! El will catch you this time!"] },
      known: ["{rival}! Prepare for the condor's dive!", "Out of the way, {rival}! El is world class!"],
      any: ["El is number one in the world!", "Condor power, maximum!", "Fly, El! Fly!"],
    },
    "Air Groove": {
      vs: { "Symboli Rudolf": ["President. Today, I surpass you.", "No mercy. Even for you, President."] },
      known: ["{rival}. Your stride's sloppy. Mine isn't.", "Stay in line, {rival}. Behind me."],
      any: ["Discipline. Precision. Victory.", "No wasted motion.", "The Empress does not yield."],
    },
    "Mayano Top Gun": {
      vs: { "Tokai Teio": ["Teio-chan! Mayano's way cooler, watch!", "Roommate showdown! Mayano, fox two!"] },
      known: ["{rival}, Mayano's locked on!", "Bogey spotted: {rival}! Engaging!"],
      any: ["Mayano, maximum thrust!", "Afterburners on!", "Mayano's taking flight!"],
    },
    "Super Creek": {
      vs: { "Oguri Cap": ["Oguri-chan... let me take care of this one.", "You're always so hungry, Oguri-chan. So am I, today."] },
      known: ["Ufufu, {rival}-chan. Let me pamper you... by winning.", "Don't worry, {rival}-chan. I'll be gentle. Mostly."],
      any: ["Let's all do our best~ But me most.", "A little more... there we go~", "Leave it to big sister~"],
    },
    "Mejiro Ryan": {
      vs: { "Mejiro McQueen": ["McQueen! Mejiro versus Mejiro! Let's go!", "My muscles against your stamina, McQueen!"] },
      known: ["{rival}! Feel the burn!", "Let's see whose training was harder, {rival}!"],
      any: ["Muscles, don't fail me now!", "Every squat was for this moment!", "Power through!"],
    },
    "Agnes Tachyon": {
      known: ["{rival}... your data says you fade here. Let's test it.", "Fascinating, {rival}. Now observe the result."],
      any: ["The experiment reaches its conclusion.", "Speed beyond limits... let's measure it.", "Hypothesis: I win."],
    },
    "Winning Ticket": {
      known: ["{rival}! I'm burning up! Let's GO!", "Can't beat my spirit, {rival}!"],
      any: ["WINNING! Here I come!", "Fired up! All the way!", "I'll win! I'll win! I'll WIN!"],
    },
    "Sakura Bakushin O": {
      known: ["{rival}-san! The class rep leads the way! Bakushin!", "Follow me, {rival}-san! Bakushin!"],
      any: ["BAKUSHIN! BAKUSHIN!", "As class rep, I go first!", "Full speed ahead! Bakushin!"],
    },
    "Haru Urara": {
      vs: { "King Halo": ["King-chan! Let's run together! Urara's gonna win!", "Roommate race! Urara won't lose, King-chan!"] },
      known: ["{rival}-chan! Let's have fun! Urara's gonna win!", "Urara's right here, {rival}-chan!"],
      any: ["Urara's gonna do her best!", "So fun! Faster, faster!", "Urara's gonna win this time!"],
    },
    "Matikanefukukitaru": {
      known: ["{rival}-san, my fortune says I win this!", "The spirits favour me today, {rival}-san!"],
      any: ["Fortune, smile on me!", "Lucky charm: equipped! Go!", "The cards said today! Today!"],
    },
    "Nice Nature": {
      vs: { "Tokai Teio": ["Teio... just once, let the background win.", "Hey, Teio. Not third. Not today."] },
      known: ["{rival}, sorry. The supporting role's taking the lead.", "Fine, {rival}. I'll try. For real."],
      any: ["Okay, Nature. Just this once, aim higher.", "Not third. Not this time.", "Ehh... why not win?"],
    },
    "King Halo": {
      vs: { "Special Week": ["Spe-san! The King refuses to lose to you!", "Witness first-class talent, Spe-san!"],
            "Haru Urara": ["Urara-san! A King must win, even against her roommate!"] },
      known: ["{rival}-san, bow before the King!", "Oh-ho-ho, {rival}-san! First class only!"],
      any: ["First class! Only first class!", "The King's moment has come!", "Watch, Mother. Watch me."],
    },
  };
  const PLAIN = { known: ["I know you, {rival}. And I'm winning.", "Not this time, {rival}!"],
                  any: ["I'm not losing!", "Now! Go!", "Everything I've got!"] };

  const pick = a => a[Math.floor(Math.random() * a.length)];
  /** How well `a` knows `b`: "vs" (a rival of hers by name), "known", or "any". */
  function bond(a, b) {
    const A = bare(a), B = bare(b), lines = L[A] || PLAIN;
    if (lines.vs && lines.vs[B]) return "vs";
    if (KNOWS_ALL.has(A) || CIRCLES.some(c => c.includes(A) && c.includes(B))) return "known";
    return "any";
  }
  function lineFor(a, b) {
    const A = bare(a), B = bare(b), lines = L[A] || PLAIN, how = bond(A, B);
    const list = how === "vs" ? lines.vs[B] : how === "known" ? (lines.known || PLAIN.known) : (lines.any || PLAIN.any);
    return pick(list).replace(/\{rival\}/g, CALL[B] || B);
  }
  function lines(a, b) {
    return { a: lineFor(a.name, b.name), b: lineFor(b.name, a.name) };
  }

  const api = { check, lines, bond, L };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Rivals = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
