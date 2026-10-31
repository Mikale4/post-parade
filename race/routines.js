/* Routines: where everyone at the academy is, hour by hour, and what she is up to.
 *
 * The walkable academy (lobby.js) keeps its own clock -- a real minute to an hour -- and
 * asks this where each racer should be. A day is cut into bands (late night, dawn,
 * breakfast, classes, lunch, after school, dinner, the evening, curfew), and each racer
 * has her own answer for each, drawn from who she is in the games, the anime and
 * Cinderella Gray: Suzuka out running alone at dawn, Oguri at the cafeteria whenever it
 * is open, Rudolf in the student council room, Tachyon in her lab long after lights out.
 *
 * A band's answer is one place or a few with weights ("track:jog 60, home:sleep 40").
 * Places:
 *   hall, cafe, track, school (the school corridor), class (a classroom), library,
 *   home (her dorm room), corridor (her dorm's corridor), away (somewhere not walked:
 *   `away` says where, for anyone who asks after her).
 * The word after the colon is what she does there, for the lobby to lean her toward:
 *   sleep, eat, jog, train, stretch, study, read, chat, browse, look, sit.
 *
 * Choices are seeded by name, day and band, so she stays put for the band rather than
 * dithering, and each racer keeps a personal offset of up to half an hour on every
 * change, so the academy does not empty in one tick.
 *
 * Pure data and logic, no DOM: validate-routines.js checks it under node.
 */
(function (root) {
  "use strict";

  const BANDS = [
    { id: "late", from: 0, to: 5, name: "late night" },
    { id: "dawn", from: 5, to: 7, name: "dawn" },
    { id: "breakfast", from: 7, to: 8, name: "breakfast" },
    { id: "morning", from: 8, to: 12, name: "morning classes" },
    { id: "lunch", from: 12, to: 13, name: "lunch" },
    { id: "afternoon", from: 13, to: 15, name: "afternoon classes" },
    { id: "after", from: 15, to: 18, name: "after school" },
    { id: "dinner", from: 18, to: 20, name: "dinner" },
    { id: "evening", from: 20, to: 22, name: "the evening" },
    { id: "curfew", from: 22, to: 24, name: "curfew" },
  ];
  const PLACES = ["hall", "cafe", "track", "school", "class", "library", "home", "corridor", "away"];
  const ACTS = ["sleep", "eat", "jog", "train", "stretch", "study", "read", "chat", "browse", "look", "sit"];

  /** Anyone without a routine of her own keeps a student's ordinary day. */
  const DEFAULT = {
    late: "home:sleep",
    dawn: "home:sleep 75, track:jog 25",
    breakfast: "cafe:eat 80, home 20",
    morning: "class:study",
    lunch: "cafe:eat 70, hall:chat 30",
    afternoon: "class:study",
    after: "track:train 55, hall:chat 20, library:study 15, cafe 10",
    dinner: "cafe:eat 80, home 20",
    evening: "home 45, corridor:chat 30, hall:chat 15, library:read 10",
    curfew: "home",
  };

  /* Each racer: `at`, her day band by band (anything left out falls back on DEFAULT);
     `away`, where she is when she is nowhere to be walked to (one place, or one per band
     with a `default`); `lines`, what she says, by band or by what she is doing (`dawn`,
     `night`, and any act or band id); `meet`, a word for somebody in particular, when
     they are in the same room. Lines are ours, in her voice -- none is quoted. */
  const ROUTINES = {
    "Special Week": {   // a Hokkaido farm girl: up early, eats like three, writes home to her mothers
      at: { dawn: "track:jog 50, home:sleep 50", breakfast: "cafe:eat", lunch: "cafe:eat", after: "track:train",
            dinner: "cafe:eat", evening: "home:study 60, corridor:chat 40" },
      lines: { dawn: ["Morning already? I can smell the rice from here!"],
               night: ["Dear Mom, I ran my very best again today."],
               eat: ["Curry's the special today. I just knew it!", "Seconds? ...Thirds would be polite, right?"] },
      meet: { "Silence Suzuka": "Suzuka-san! Wait for me!", "Oguri Cap": "Oguri-san, rematch at dinner? Most bowls wins!" } },
    "Silence Suzuka": { // runs alone at the front, and before anyone is up; circles when she thinks
      at: { dawn: "track:jog", breakfast: "cafe:eat 70, track:jog 30", lunch: "cafe:eat", after: "track:jog 60, track:train 40",
            dinner: "cafe:eat", evening: "home:sit 80, away 20" },
      away: { evening: "stargazing on the roof with Admire Vega", default: "out on a long run" },
      lines: { dawn: ["Nobody here yet. Just me and the wind."],
               night: ["Still awake? Let's rest. We run tomorrow."],
               jog: ["The view from the front... I want to see it again."],
               look: ["Oh... was I walking in circles again? Sorry."] },
      meet: { "Special Week": "Spe-chan. Breakfast together, after my run?" } },
    "Tokai Teio": {     // sleeps through dawn (classical music puts her out), worships Kaichou, honey for everything
      at: { dawn: "home:sleep", breakfast: "cafe:eat", lunch: "cafe:eat 60, away 40", after: "track:train 70, away 30",
            dinner: "cafe:eat", evening: "home:chat" },
      away: { lunch: "in the student council room, helping Kaichou", after: "at the arcade, or the honey drink stand",
              default: "off somewhere, doing the Teio Step" },
      lines: { dawn: ["Five more minutes... champions need their sleep!"],
               night: ["Classical music again... works every... zzz."],
               eat: ["Honey drink when I win, honey drink when I lose. Rules!"] },
      meet: { "Symboli Rudolf": "Kaichou! Kaichou! Did you see my Teio Step?", "Mejiro McQueen": "McQueen! Race you to the cake counter!" } },
    "Mejiro McQueen": { // tea at dawn, a Mejiro's manners, a losing war with dessert, a secret baseball fan
      at: { dawn: "home:read", breakfast: "cafe:eat", lunch: "cafe:eat", after: "track:train 80, away 20",
            dinner: "cafe:eat", evening: "home:read" },
      away: "taking afternoon tea at the Mejiro estate",
      lines: { dawn: ["Tea first. A Mejiro never rushes her morning."],
               night: ["One slice of cake... no. Absolutely not. Perhaps half."],
               eat: ["I am only looking at the parfait. Looking is free."],
               evening: ["Swing, swing! ...Ahem. I was merely stretching."] },
      meet: { "Gold Ship": "Gold Ship. Whatever is in that sack, the answer is no.", "Tokai Teio": "Teio. I trust you have been training, not snacking." } },
    "Gold Ship": {      // no pattern at all, on principle; a sack for recruits, a Rubik's cube, McQueen as target
      at: { late: "home:sleep 60, corridor 40", dawn: "away", breakfast: "cafe:eat", morning: "class:study 50, away 50",
            lunch: "cafe:eat", after: "track:train 50, hall:look 50", dinner: "cafe:eat", evening: "corridor:chat" },
      away: { dawn: "doing something she will not explain", morning: "up on the roof", default: "off who knows where" },
      lines: { dawn: ["Rise and shine! Golshi's got a sack and a plan."],
               night: ["Midnight Rubik's run. Don't tell the dorm leader."],
               look: ["New recruit spotted. Where did I put my sack..."],
               study: ["The answer is 42. Probably. Next question."] },
      meet: { "Mejiro McQueen": "McQueen! Perfect timing. Hold this. Don't ask." } },
    "Oguri Cap": {      // the cafeteria whenever it is open; thanks the meal even alone; sways when happy
      at: { dawn: "track:jog", breakfast: "cafe:eat", lunch: "cafe:eat", after: "track:train 80, cafe:eat 20",
            dinner: "cafe:eat", evening: "home:chat" },
      lines: { dawn: ["I'm hungry. Is the cafeteria open yet?"],
               night: ["Tamamo, is there any rice left? Just a little."],
               eat: ["Thank you for the meal. ...One more bowl, please.", "This is good. All of it is good."] },
      meet: { "Special Week": "Spe. Most bowls wins. Again.", "Super Creek": "Creek. ...Do you have snacks?" } },
    "Agnes Tachyon": {  // a night owl in an empty classroom turned lab; sugar in the tea; data on everyone else
      at: { late: "away", dawn: "away 60, home:sleep 40", breakfast: "away", morning: "away 50, class:study 50",
            lunch: "away", afternoon: "class:study 50, away 50", after: "track:look", dinner: "cafe:eat 50, away 50",
            evening: "away", curfew: "away 60, home:sleep 40" },
      away: { dawn: "asleep at her lab desk", default: "in her lab, the empty classroom she has taken over" },
      lines: { dawn: ["Morning already? Fascinating. I seem to have skipped sleep."],
               night: ["One more sample, if you would. For science."],
               look: ["Hold still. I am measuring your stride.", "Interesting... her cadence drops on the turn."],
               eat: ["More sugar. More. Bitterness is simply inefficient."] } },
    "Haru Urara": {     // never wins, never minds; carrots; dragonflies; kanji are the real enemy
      at: { dawn: "track:jog", breakfast: "cafe:eat", lunch: "cafe:eat", afternoon: "class:study 60, away 40",
            after: "track:train 70, away 30", dinner: "cafe:eat", evening: "home:study" },
      away: { afternoon: "napping in the sun with Seiun Sky", after: "catching dragonflies down by the river", default: "out playing" },
      lines: { dawn: ["Good morning! Today I win, I just know it!"],
               night: ["King-chan, tuck me in? ...Zzz."],
               study: ["This kanji has so many lines... is it even real?"],
               train: ["Lost again, but that was super fun!"] },
      meet: { "King Halo": "King-chan! Help me with my homework later?", "Rice Shower": "Rice-chan! Let's run together!" } },
    "Super Creek": {    // "Mama": looks after everyone in reach
      at: { dawn: "home:sit", breakfast: "cafe:eat", lunch: "cafe:eat", after: "track:train 70, away 30",
            dinner: "cafe:eat", evening: "home:chat" },
      away: "helping out at the daycare",
      lines: { dawn: ["Good morning. Did you eat? Let Mama check."],
               night: ["It's late. Shall I tuck you in?"],
               eat: ["Here, have some of mine. You need it more."] },
      meet: { "Oguri Cap": "Oguri-chan, chew properly. There's plenty." } },
    "Symboli Rudolf": { // the council president: paperwork at dawn, a working lunch, chess, puns
      at: { dawn: "away", breakfast: "cafe:eat", lunch: "away", after: "away 50, track:train 30, hall:look 20",
            dinner: "cafe:eat", evening: "away 50, library:read 50", curfew: "home:read" },
      away: "in the student council room",
      lines: { dawn: ["Morning stamps, each one perfectly straight. A fine start."],
               night: ["Rest well. Recovery is training too."],
               look: ["Everything in order. As it should be."],
               read: ["Chess teaches patience. So does a long race."] },
      meet: { "Air Groove": "Let's not horse around, Groove. ...That was a joke.", "Tokai Teio": "Teio. Your form is coming along." } },
    "Air Groove": {     // the vice president: on schedule to the minute; a flower garden; Chopin to unwind
      at: { dawn: "away", breakfast: "cafe:eat", lunch: "away", after: "track:train 60, away 40",
            dinner: "cafe:eat", evening: "home:read 70, corridor:look 30" },
      away: { dawn: "tending the flower garden", default: "in the student council room" },
      lines: { dawn: ["Garden first, then training. Exactly on schedule."],
               night: ["Ramen at this hour? Absolutely not. Bed."],
               look: ["Walk. Rules exist for a reason."] },
      meet: { "Symboli Rudolf": "President. The forms are on your desk.", "Silence Suzuka": "Suzuka. Don't overdo it." } },
    "Rice Shower": {    // trains twice as hard, alone; picture books; afraid of ghosts, so never out at night
      at: { dawn: "track:train", breakfast: "cafe:eat", lunch: "cafe:eat", after: "track:train 70, library:read 30",
            dinner: "cafe:eat", evening: "home:study" },
      lines: { dawn: ["Rice will try her best today... for everyone."],
               night: ["Something in the corridor? R-Rice is staying inside."],
               read: ["The blue rose book again... Rice never gets tired of it."],
               stretch: ["Twice as long as everyone. That's Rice's rule."] },
      meet: { "Mejiro McQueen": "McQueen-san... thank you for always watching out for Rice.", "Haru Urara": "Urara-chan... let's do our best." } },
    "Vodka": {          // everything has to be cool; saving for a motorcycle; out the door ahead of Scarlet
      at: { dawn: "track:jog 60, home:sleep 40", breakfast: "cafe:eat", lunch: "cafe:eat 60, track:train 40", after: "track:train",
            dinner: "cafe:eat", evening: "home:read", curfew: "home:sleep 70, corridor:chat 30" },
      lines: { dawn: ["Up before Scarlet. Day's already cool."],
               night: ["One day it's a real bike. Count on it."],
               eat: ["Watch this. One clean slide down the counter... cool."] },
      meet: { "Daiwa Scarlet": "Scarlet! Last one to the track is uncool!" } },
    "Daiwa Scarlet": {  // has to be number one at everything, grades included; goals in red, fixes in blue
      at: { dawn: "track:jog 50, home:sit 50", breakfast: "cafe:eat", lunch: "library:study 60, cafe:eat 40", after: "track:train",
            dinner: "cafe:eat", evening: "home:study" },
      lines: { dawn: ["First one up. Obviously."],
               night: ["Red for goals, blue for fixes. Tomorrow I win."],
               study: ["Top of the class isn't luck. It's this."],
               train: ["That didn't count! Again. Right now!"] },
      meet: { "Vodka": "Vodka! Bet I beat you there. Again." } },
    "El Condor Pasa": { // the mask never comes off; loud whenever awake; Grass gets her out of bed
      at: { dawn: "home:sleep", breakfast: "cafe:eat", lunch: "cafe:eat", after: "track:train",
            dinner: "cafe:eat", evening: "home:chat 60, corridor:chat 40" },
      lines: { dawn: ["The condor is awake! ...Five more minutes, Grass."],
               night: ["One more match! Champions don't sleep early!"],
               eat: ["Mama sent steak again! Everybody, come eat!"] },
      meet: { "Grass Wonder": "Grass! Watch my new move! ...Gently, gently!", "Special Week": "Spe-chan! Want some of Mama's steak?" } },
    "Grass Wonder": {   // Japanese culture, tea, the flowerbeds; gentle, and not to be crossed
      at: { dawn: "away", breakfast: "cafe:eat", lunch: "cafe:eat", after: "track:train 70, away 30",
            dinner: "cafe:eat", evening: "home:read" },
      away: { dawn: "watering the school flowerbeds", default: "in the tea room" },
      lines: { dawn: ["The flowers drink first. Then I take my tea."],
               night: ["The lights, El. I will not ask twice."],
               train: ["I will remember this race. Next time is mine."] },
      meet: { "El Condor Pasa": "El. Your homework, before your wrestling." } },
    "King Halo": {      // first-class, always; keeps Urara on time; a losing streak she refuses to quit over
      at: { dawn: "home:sit", breakfast: "cafe:eat", lunch: "cafe:eat 50, library:read 50", after: "track:train 70, away 30",
            dinner: "cafe:eat", evening: "home:sit", curfew: "home:study" },
      away: "browsing the boutiques in town",
      lines: { dawn: ["Up, Urara-san! A first-class lady is never late."],
               night: ["That heroine is hopeless. I would never act so."],
               train: ["Chin up, King. First-class means running again."] },
      meet: { "Haru Urara": "Urara-san, your ribbon is crooked. Hold still." } },
    "Maruzensky": {     // the big sister with the red supercar; coffee milk after her shower; Eurobeat
      at: { dawn: "home:sit", breakfast: "cafe:eat", lunch: "cafe:eat", after: "track:train 60, away 40",
            dinner: "cafe:eat 70, away 30", evening: "home:sit" },
      away: { after: "out for a drive in her red supercar", dinner: "in the staff lounge, having coffee", default: "out for a drive" },
      lines: { dawn: ["Shower, coffee milk. The supercar is warmed up!"],
               night: ["The car's tucked in. Nighty-night, everyone~"],
               eat: ["Feeling down? Hop in after. A spin fixes anything."] },
      meet: { "Symboli Rudolf": "Rudolf! All work again? Let big sis take you for a drive." } },
    "Matikanefukukitaru": { // luck is everything: the shrine at dawn, a fortune stall, a lucky seat
      at: { dawn: "away", breakfast: "cafe:eat", lunch: "hall:chat", after: "track:train 60, hall:chat 40",
            dinner: "cafe:eat", evening: "home:sit", curfew: "home:sit" },
      away: "at the shrine, asking for today's fortune",
      lines: { dawn: ["Shiraoki-sama, grant me luck today! ...Please?"],
               night: ["The cards say sleep. Fuku obeys!"],
               chat: ["Fortune, anyone? Today's lucky colour is... carrot orange!"],
               train: ["Black cat! Stay parallel, stay parallel!"] },
      meet: { "Silence Suzuka": "Suzuka-san! Your luck today is... excellent! Probably!" } },
    "Mayano Top Gun": { // a natural who sleeps half the day away; pilot talk; shopping
      at: { dawn: "home:sleep", breakfast: "cafe:eat 70, home:sleep 30", morning: "class:study", after: "track:train 60, away 40",
            dinner: "cafe:eat", evening: "home:chat" },
      away: "shopping in town",
      lines: { dawn: ["Mmh... Maya's still on autopilot..."],
               night: ["Ever been in love, Teio-chan? No? So young!"],
               train: ["I have control! Maya, takeoff!"] },
      meet: { "Tokai Teio": "Teio-chan! Fly with Maya after class?" } },
    "Mejiro Ryan": {    // the gym at dawn and after; a secret shojo manga habit
      at: { dawn: "away", breakfast: "cafe:eat", lunch: "cafe:eat", after: "track:train 60, away 40",
            dinner: "cafe:eat", evening: "home:read" },
      away: "in the gym, lifting",
      lines: { dawn: ["Morning, muscles! Let's earn breakfast."],
               night: ["One more chapter... fine, the whole volume."],
               read: ["Th-this manga? It's Scarlet's! I'm just holding it!"] },
      meet: { "Mejiro McQueen": "McQueen! Squats after class? Good for the sweets, too." } },
    "Nice Nature": {    // the self-styled side character: up late with a snack, works hard while pretending not to
      at: { late: "home:sit 60, home:sleep 40", dawn: "home:sleep", breakfast: "cafe:eat", lunch: "cafe:eat 60, away 40",
            after: "track:train", dinner: "cafe:eat 70, corridor:chat 30", evening: "home:sit", curfew: "home:sit" },
      away: "at the convenience store, on a snack run",
      lines: { dawn: ["Yeah, yeah, I'm up. Louder than an alarm, honestly."],
               night: ["A little snack. Nobody watches the side character."],
               train: ["Third. Classic Nature-san. ...Next time, though."] },
      meet: { "Tokai Teio": "Teio. Don't get used to being in front, okay?" } },
    "T.M. Opera O": {   // the self-crowned Overlord: arias at dawn, performances in the hall, homework under protest
      at: { dawn: "track:jog", breakfast: "cafe:eat", lunch: "hall:chat", after: "track:train 70, away 30",
            dinner: "cafe:eat", evening: "home:study" },
      away: "at the opera house",
      lines: { dawn: ["Rise, sun! Your Overlord woke first today!"],
               night: ["Even my dreams will play to a full house."],
               chat: ["Gather round! The Overlord's matinee begins!"],
               study: ["Must an Overlord know algebra? ...Very well."] } },
    "Taiki Shuttle": {  // a farm girl from America: hugs for everyone, barbecues, a daily vlog
      at: { dawn: "track:jog", breakfast: "cafe:eat", lunch: "cafe:eat", after: "track:train 70, away 30",
            dinner: "cafe:eat 60, corridor:chat 40", evening: "home:sit" },
      away: "at a barbecue with Hishi Akebono",
      lines: { dawn: ["Howdy, sunshine! Who needs a morning hug?"],
               night: ["Vlog's up! Night-night, everybody!"],
               chat: ["Nobody's busy? Then let's plan a party!"] },
      meet: { "Silence Suzuka": "Suzuka! I'll be cheering at your next race, promise!" } },
    "Winning Ticket": { // the Derby is everything; all-out at dawn; cries at every finish, tissues by the box
      at: { dawn: "track:train", breakfast: "cafe:eat", lunch: "cafe:eat", after: "track:train",
            dinner: "cafe:eat", evening: "home:sit", curfew: "home:sleep 70, corridor:chat 30" },
      lines: { dawn: ["Good morning, track! All out today!"],
               night: ["That Derby finish... crying again. Tissues!"],
               train: ["You did it! I'm not crying, you are!"] },
      meet: { "Maruzensky": "Maruzensky-san! Take me for a drive again? Please?" } },
    "Sakura Bakushin O": { // the class rep: first up, fastest in the bath, patrolling the halls at full speed
      at: { dawn: "track:train", breakfast: "cafe:eat", lunch: "school:look 50, cafe:eat 50", after: "track:train 70, school:look 30",
            dinner: "cafe:eat", evening: "corridor:chat" },
      lines: { dawn: ["First one up, as a class rep should be! Bakushin!"],
               night: ["Bath finished in record time! Lights out!"],
               look: ["Halt! No running in the halls! ...Except me, briefly!"],
               study: ["A class rep solves the problem first! Bakushin!"] } },
  };

  // ---------------------------------------------------------------- the working
  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  const unit = s => hash(s) / 4294967296;

  /** "track:jog 60, home:sleep 40" -> [{ place, act, w }]. */
  const parsed = new Map();
  function parse(spec) {
    if (parsed.has(spec)) return parsed.get(spec);
    const out = String(spec).split(",").map(part => {
      const m = part.trim().match(/^([a-z]+)(?::([a-z]+))?(?:\s+(\d+))?$/);
      return m ? { place: m[1], act: m[2] || null, w: m[3] ? +m[3] : 1 } : null;
    }).filter(Boolean);
    parsed.set(spec, out);
    return out;
  }

  /** Her personal offset on every change: up to half an hour either way. */
  const shiftOf = name => (unit("shift:" + name) - 0.5);

  /** The band at `hour` (0..24), as she keeps it. */
  function bandAt(hour, name) {
    const h = ((hour + (name ? shiftOf(name) : 0)) % 24 + 24) % 24;
    return BANDS.find(b => h >= b.from && h < b.to) || BANDS[0];
  }

  /** Where `name` is at `hour` on academy day `day`: { place, act, band, away }. */
  function where(name, hour, day) {
    const r = ROUTINES[name] || {};
    const band = bandAt(hour, name);
    const opts = parse((r.at && r.at[band.id]) || DEFAULT[band.id]);
    const total = opts.reduce((s, o) => s + o.w, 0);
    let x = unit(name + "|" + (day || 0) + "|" + band.id) * total, pick = opts[opts.length - 1];
    for (const o of opts) { if ((x -= o.w) < 0) { pick = o; break; } }
    // `sure`: the band has her in one place, no odds about it (Suzuka on the track at dawn)
    return { place: pick.place, act: pick.act, band: band.id, away: pick.place === "away" ? awayOf(r, band.id) : null,
             sure: opts.length === 1 };
  }
  /** Where she is when she is not anywhere to be walked to, in words: "in her lab". */
  function awayOf(r, band) {
    const a = r.away;
    if (!a) return "out";
    return typeof a === "string" ? a : a[band] || a.default || "out";
  }

  /** Something she would say right now, doing `act`, with `others` (names) in the room --
      or null, for the usual lines. Somebody she has a word for, if there, often gets it. */
  function line(name, hour, act, others) {
    const r = ROUTINES[name];
    if (!r) return null;
    if (r.meet && others) {
      const them = others.filter(o => r.meet[o]);
      if (them.length && Math.random() < 0.45) return r.meet[them[Math.floor(Math.random() * them.length)]];
    }
    if (!r.lines) return null;
    const band = bandAt(hour, name).id;
    const night = band === "late" || band === "curfew" || band === "evening";
    const pool = [].concat(r.lines[act] || [], r.lines[band] || [],
                           night ? r.lines.night || [] : [], band === "dawn" ? r.lines.dawn || [] : []);
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  }

  root.Routines = { BANDS, PLACES, ACTS, DEFAULT, ROUTINES, where, line, bandAt, awayOf, parse, hash };
})(typeof globalThis !== "undefined" ? globalThis : this);
