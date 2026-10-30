/*
 * After the line: how each racer takes her result, in her own way -- as she is in the
 * games, the shows and the films, written for this game.
 *
 * For each racer, a few reactions to each kind of finish, one picked at random each race:
 *   win    first
 *   close  second or third
 *   mid    the middle of the field
 *   back   the last three
 * Each is [move, line]: what she does once she has pulled up (voxel.js's MOVES) and what
 * she says. A racer not written here falls back on PLAIN.
 *
 *   Reactions.pick(name, rank, fieldSize)  -> { move, line }
 *   Reactions.bracket(rank, fieldSize)     -> "win" | "close" | "mid" | "back"
 */
(function (root) {
  "use strict";

  const R = {
    "Special Week": {
      win:   [["cheer", "I did it! Mom, did you see?!"], ["fist", "Best in Japan, here I come!"], ["wave", "Thank you, everyone! Thank you!"]],
      close: [["fist", "So close... next time, for sure!"], ["wave", "Thank you for cheering!"]],
      mid:   [["breath", "Huff... I'm starving..."], ["headHold", "Aww, I can do better than that!"]],
      back:  [["cry", "I won't give up. I promised!"], ["pout", "Next time. Definitely next time."]],
    },
    "Silence Suzuka": {
      win:   [["wave", "...The view from the front. Nobody else in it."], ["curtsy", "Thank you. That felt good."]],
      close: [["think", "I wanted to be in front the whole way."], ["breath", "...Next time, from the gate."]],
      mid:   [["breath", "I lost the lead. I lost the view."], ["pout", "..."]],
      back:  [["pout", "...I'm sorry."], ["headHold", "That wasn't my race at all."]],
    },
    "Tokai Teio": {
      win:   [["teioStep", "Teio Step! Did you see that?"], ["point", "Unbeatable! That's Teio for you!"], ["cheer", "Ehehe, too easy!"]],
      close: [["stomp", "Hmph! I'll get you next time!"], ["fist", "Almost! Almost had it!"]],
      mid:   [["headHold", "No way! That one didn't count!"], ["stomp", "Mou! I wasn't even trying!"]],
      back:  [["pout", "...I'm not crying."], ["cry", "Again. I'll do it again."]],
    },
    "Maruzensky": {
      win:   [["wave", "Superb! That was a real burner~"], ["peace", "Did you feel the wind, kids?"]],
      close: [["wave", "Ooh, you young ones are quick!"], ["shrug", "Not bad, not bad at all~"]],
      mid:   [["shrug", "Oh my, not my day~"], ["breath", "Phew, I need a spin in the car."]],
      back:  [["pout", "Hmm. I'll take that as a lesson."], ["shrug", "Even big sisters have off days~"]],
    },
    "Oguri Cap": {
      win:   [["fist", "...I won. Now, food."], ["belly", "I'm hungry."], ["wave", "For everyone back home."]],
      close: [["belly", "...I need more rice."], ["think", "I'll be faster. After lunch."]],
      mid:   [["belly", "I'm hungry..."], ["breath", "I ran out of rice somewhere."]],
      back:  [["pout", "..."], ["belly", "I'll eat. Then train more."]],
    },
    "Taiki Shuttle": {
      win:   [["cheer", "Yeehaw! Group hug, everybody!"], ["flex", "Big win! Bigger hugs!"]],
      close: [["clap", "Good race, y'all!"], ["wave", "Whoo! What a ride!"]],
      mid:   [["shrug", "Whew! That one bucked me off!"], ["breath", "Gotta run that one back!"]],
      back:  [["pout", "Shucks..."], ["shrug", "Can't win 'em all, partner."]],
    },
    "Mejiro McQueen": {
      win:   [["curtsy", "As is fitting for a Mejiro."], ["wave", "Thank you for your support."], ["bow", "I believe I've earned one parfait. Just one."]],
      close: [["stomp", "This is... unacceptable!"], ["think", "My form must be reviewed."]],
      mid:   [["headHold", "How could I...?"], ["stomp", "Not a word about the sweets."]],
      back:  [["pout", "A Mejiro does not cry in public."], ["cry", "Grandmother..."]],
    },
    "Symboli Rudolf": {
      win:   [["point", "As it should be."], ["wave", "Thank you. Truly."], ["cool", "A victory for every student here."]],
      close: [["think", "A fine race. I learned a great deal."], ["clap", "Well run, all of you."]],
      mid:   [["think", "There is always another day."], ["cool", "Hm. Noted."]],
      back:  [["think", "A lesson worth remembering."], ["shrug", "Even an emperor must rein it in."]],
    },
    "Rice Shower": {
      win:   [["cry", "Rice... won? Rice won!"], ["wave", "Th-thank you, everyone!"]],
      close: [["clap", "Rice tried her very best..."], ["think", "Rice can still be faster."]],
      mid:   [["breath", "Huff... Rice is okay..."], ["pout", "Rice is sorry..."]],
      back:  [["cry", "S-sorry... Rice will try harder."], ["pout", "...Rice is fine. Really."]],
    },
    "T.M. Opera O": {
      win:   [["bow", "Bask in the glory of the Opera!"], ["twirl", "A triumph worthy of an encore!"]],
      close: [["bow", "A noble second act!"], ["twirl", "The drama! The suspense!"]],
      mid:   [["despair", "Oh, cruel fate!"], ["bow", "Even a middle act has its beauty."]],
      back:  [["despair", "Tragedy! But tragedy, too, is art!"], ["cry", "The curtain falls... for now!"]],
    },
    "Gold Ship": {
      win:   [["kick", "Golshi's win! Who wants a dropkick?"], ["dance", "Victory fishing trip! Everyone in!"]],
      close: [["kick", "Second's just first from the other side."], ["dance", "Eh, I was busy looking at a cloud."]],
      mid:   [["dance", "Whatever. Yakisoba time."], ["kick", "Where's my trainer? I have a kick saved."]],
      back:  [["sit", "Last? It's called a long game."], ["kick", "Nobody saw that. Got it?"]],
    },
    "Vodka": {
      win:   [["cool", "Cool, right?"], ["fist", "That's what a real cool racer looks like."]],
      close: [["stomp", "Tch. Not cool."], ["fist", "Next time I take it. Count on it."]],
      mid:   [["stomp", "Damn it! Next time..."], ["headHold", "That was so uncool."]],
      back:  [["pout", "...Don't look at me."], ["cool", "I'm... letting the others shine."]],
    },
    "Daiwa Scarlet": {
      win:   [["cheer", "Number one! Obviously!"], ["point", "First. That's where I belong."]],
      close: [["stomp", "Second?! No way!"], ["headHold", "Not first... not first!"]],
      mid:   [["stomp", "This isn't over!"], ["pout", "Hmph. Don't say anything."]],
      back:  [["cry", "I'll be first next time. I will!"], ["stomp", "Unbelievable!"]],
    },
    "Grass Wonder": {
      win:   [["curtsy", "Thank you very much."], ["wave", "A calm heart wins in the end."]],
      close: [["curtsy", "A wonderful race. Thank you."], ["think", "I was too gentle in the stretch."]],
      mid:   [["think", "I see. I'll reflect on this."], ["breath", "Haah... I must be stronger."]],
      back:  [["pout", "...How shameful."], ["think", "A samurai learns from defeat."]],
    },
    "El Condor Pasa": {
      win:   [["cheer", "El is number one in the WORLD!"], ["flex", "Condor power!"]],
      close: [["stomp", "Muy mal! Rematch!"], ["fist", "El was almost the world's best!"]],
      mid:   [["headHold", "El... lost?!"], ["stomp", "This mask is still undefeated!"]],
      back:  [["pout", "Grass, don't laugh..."], ["cry", "El will come back stronger!"]],
    },
    "Air Groove": {
      win:   [["cool", "As planned."], ["wave", "Good. Discipline pays off."]],
      close: [["think", "Not good enough. Again."], ["cool", "Acceptable. Barely."]],
      mid:   [["stomp", "Unacceptable."], ["think", "I'll be reviewing every stride."]],
      back:  [["pout", "...Not a word to the council."], ["stomp", "This will not happen twice."]],
    },
    "Mayano Top Gun": {
      win:   [["twirl", "Mayano, mission complete!"], ["peace", "Did you see Mayano fly?"]],
      close: [["peace", "Aww, so close~"], ["twirl", "Mayano's still the coolest!"]],
      mid:   [["shrug", "Mayano got bored halfway~"], ["pout", "Mou, that was no fun."]],
      back:  [["pout", "No fair! Mayano wasn't ready!"], ["sit", "Mayano's taking a break~"]],
    },
    "Super Creek": {
      win:   [["clap", "Well done, everyone~"], ["wave", "Ufufu, I did my best."]],
      close: [["clap", "Everyone ran so well~"], ["wave", "Is everyone all right? Good~"]],
      mid:   [["clap", "Let's all rest up now~"], ["breath", "Oh my, I'm a little tired."]],
      back:  [["breath", "Oh dear... I'm all worn out."], ["clap", "Next time, I'll pamper myself first~"]],
    },
    "Mejiro Ryan": {
      win:   [["flex", "My muscles did it!"], ["fist", "All that training paid off!"]],
      close: [["flex", "Good burn! More training!"], ["fist", "Close! My legs want another go!"]],
      mid:   [["breath", "My legs need more work."], ["flex", "Back to the weights room."]],
      back:  [["breath", "Haah... squats. So many squats."], ["pout", "My muscles let me down..."]],
    },
    "Agnes Tachyon": {
      win:   [["think", "Hypothesis confirmed!"], ["point", "Fascinating! Simply fascinating!"]],
      close: [["think", "Interesting... very interesting."], ["shrug", "The data says I was close."]],
      mid:   [["think", "Data is data. I'll take it."], ["shrug", "The variables misbehaved."]],
      back:  [["shrug", "A failed experiment is still an experiment."], ["think", "Now where did I leave that flask..."]],
    },
    "Winning Ticket": {
      win:   [["cheer", "WINNING! Let's GOOO!"], ["fist", "Yeah! I'm burning up!"]],
      close: [["fist", "Argh! So close! Again!"], ["cheer", "That was AMAZING!"]],
      mid:   [["headHold", "Noooo!"], ["fist", "I'll run until I win!"]],
      back:  [["cry", "I'm not crying! It's sweat!"], ["headHold", "WHY?!"]],
    },
    "Sakura Bakushin O": {
      win:   [["salute", "BAKUSHIN!"], ["cheer", "As class rep, first is only natural!"]],
      close: [["salute", "Bakushin continues!"], ["cheer", "Excellent! Excellent work, everyone!"]],
      mid:   [["salute", "A short rest, then Bakushin!"], ["fist", "Onward! Bakushin!"]],
      back:  [["salute", "Bakushin, bakushin!"], ["cheer", "A class rep never gives up!"]],
    },
    "Haru Urara": {
      win:   [["cheer", "Urara won! Yay!"], ["twirl", "Did you see? Did you see?!"]],
      close: [["cheer", "That was so much fun!"], ["wave", "Everyone, thank you!"]],
      mid:   [["cheer", "Fun! Let's run again!"], ["wave", "Urara's still smiling!"]],
      back:  [["cheer", "Ehehe, Urara had fun!"], ["wave", "Next time Urara will win!"]],
    },
    "Matikanefukukitaru": {
      win:   [["cheer", "The fortune was right!"], ["twirl", "Fortune smiles on Fukukitaru!"]],
      close: [["headHold", "The stars misaligned!"], ["think", "My charm was only ninety percent!"]],
      mid:   [["headHold", "My lucky charm failed!"], ["despair", "Bad luck! Bad luck everywhere!"]],
      back:  [["despair", "A curse! Definitely a curse!"], ["sit", "I'll redo my fortune..."]],
    },
    "Nice Nature": {
      win:   [["shrug", "Eh? Me? ...Huh. Neat."], ["wave", "Not bad for a background character."]],
      close: [["shrug", "Third. Yep, that's about me."], ["wave", "Hey, a podium. I'll take it."]],
      mid:   [["shrug", "Well, that's about right."], ["breath", "Phew. Average, as usual."]],
      back:  [["pout", "Figures..."], ["shrug", "It's fine. Totally fine."]],
    },
    "King Halo": {
      win:   [["bow", "Oh-ho-ho! As expected!"], ["point", "Bow before the King!"]],
      close: [["stomp", "Unthinkable!"], ["point", "A first-class runner-up, at least!"]],
      mid:   [["stomp", "This is not first class!"], ["headHold", "My mother must not hear of this."]],
      back:  [["headHold", "Impossible!"], ["pout", "...The King is merely resting."]],
    },
  };
  const PLAIN = {
    win:   [["cheer", "I did it!"], ["fist", "Yes!"]],
    close: [["wave", "So close!"], ["fist", "Next time!"]],
    mid:   [["breath", "Huff... huff..."], ["shrug", "Not my day."]],
    back:  [["pout", "Next time..."], ["breath", "That was hard..."]],
  };

  /** Which kind of finish: first, the places, the middle, or the last three (in a field of four or more). */
  function bracket(rank, n) {
    if (rank <= 1) return "win";
    if (rank <= 3) return "close";
    if (n >= 4 && rank > n - 3) return "back";
    return "mid";
  }
  function pick(name, rank, n) {
    const L = R[String(name || "").replace(/​/g, "")] || PLAIN, list = L[bracket(rank, n)];
    const [move, line] = list[Math.floor(Math.random() * list.length)];
    return { move, line };
  }

  root.Reactions = { pick, bracket, R };
})(typeof globalThis !== "undefined" ? globalThis : this);
