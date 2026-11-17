/*
 * Post Parade Adventure 2: the story, "The Red Star Rings".
 *
 * An original story for the cabinet's cast, in twenty chapters. Thirty-nine Red Star Rings, each
 * holding a star's worth of power, have fallen across the world with the shooting stars: the
 * ones hidden three to a stage. Dr. Eggman means to set every one of them in his Star Engine
 * aboard the Egg Orbital -- power without end, so he never loses again -- though an engine that
 * strong would drain the power out of everything else. Each chapter is a scene of talk, then a
 * stage to run or a battle to win as one of the cast, then the talk after.
 *
 * Runs are on the story's own stages (adventure-stages.js, STORY), places in the plot: Eggman's
 * dig on the cliffs, the runway the engine is carried off along, the shrines, the rooftops,
 * the convoy road, the Chao's pools, the vault, the launch track, the Star Engine's core. Mid-run,
 * the cast and Eggman have their say (`beats`: how far along, who, the words). Battles are in
 * the runners' arenas.
 *
 * The characters are written to their canon (researched on Wikipedia, Sonic Retro and TV
 * Tropes):
 * - Sonic is easy-going, cocky and kind, quick with a quip ("Too easy!"), and can't swim.
 * - Tails looks up to Sonic and talks machines.
 * - Knuckles guards his people's old shrines, has a hot temper, and is tricked by Eggman yet
 *   again (the series' running joke).
 * - Amy is loud, sunny and quick with her hammer: her fortune cards, her love for Sonic (all
 *   of her motive in Sonic Battle), and the kindness that turned E-102 Gamma.
 * - Rouge is the self-styled world's greatest treasure hunter, a government spy on the side,
 *   who loves to rile Knuckles.
 * - Shadow is the Ultimate Life Form: aloof, snarky to Sonic, keeping his promise to protect
 *   the world.
 * - Cream is six, polite ("Mr." and "Miss"), hates fighting and loves ice cream; Cheese the
 *   Chao does the fighting.
 * - Chaos is the old spirit of the water, protector of the Chao, who never speaks.
 * - Chaos Gamma is the robot Eggman built on E-102 Gamma's design, who speaks as a machine.
 * - Mighty is a strong, gentle traveller who loves nature and dislikes violence.
 * - Silver is fourteen, from a ruined future: hopeful, earnest, naive, and once more sure that
 *   Sonic is to blame.
 * - Metal Sonic is Eggman's silent copy of Sonic, who cannot bear to be second.
 * - Eggman is the self-proclaimed genius with an IQ of 300, a ham who names everything after
 *   himself ("Get a load of THIS!", "No way! I can't believe this!").
 * Sonic and his friends, rivals and Dr. Eggman belong to SEGA; the story and its places are
 * the cabinet's own.
 *
 * A chapter: { title, who (the one played), kind: "run" | "battle", stage (a run's story stage)
 * or arena (a battle's: a free-run stage id), foes: [{ who, lvl: 0 Easy | 1 Normal | 2 Hard }],
 * allies (CPUs on the player's side), before, beats (a run's, mid-stage), after }. A line is
 * [speaker, text]; "" is narration. A beat is [how far along the stage, 0 to 1, speaker, text].
 */
(function (root) {
  "use strict";
  const N = "";
  const CHAPTERS = [
    // ------------------------------------------------------------------ 1
    { title: "A Lucky Find", who: "sonic", kind: "run", stage: "s-dig",
      before: [
        [N, "Seabreeze Cape, first thing in the morning. A blue hedgehog is stretched out on the warm grass at the top of the cliffs, doing nothing at all."],
        ["sonic", "Clear skies, sea breeze, nowhere to be. Now this is my kind of day."],
        [N, "Something glints in the grass by his hand: a ring, red as the sunrise, with a gold star in it, humming with power."],
        ["sonic", "Huh. A Red Star Ring? Haven't seen one of these in a while. Guess today's my lucky day."],
        ["eggman", "Hohoho! Not for long, hedgehog! That ring belongs to me!"],
        ["sonic", "Eggman? What's a guy like you want with a ring?"],
        ["eggman", "Thirty-nine Red Star Rings have fallen on this world with the shooting stars, and every one holds a star's worth of power! Only a genius with an IQ of 300 could have worked it out!"],
        ["eggman", "Set them all in my Star Engine, and the Egg Orbital will have power without end! I'll never lose again. Not to you, not to anyone!"],
        ["sonic", "You know power was never your problem, right? It's the giant robots. They keep blowing up."],
        ["eggman", "Silence! Badniks, dig up this whole cape! Bring me every Red Star Ring on it!"],
        ["sonic", "And there goes my day off. Okay, let's do this!"],
      ],
      beats: [
        [0.08, "eggman", "Dig, my badniks, dig! Every Red Star Ring on this cape is property of the Eggman Empire!"],
        [0.4, "sonic", "He's turned the whole clifftop into Swiss cheese. Rude."],
        [0.72, "eggman", "What?! Somebody stop that hedgehog!"],
        [0.94, "sonic", "There's the dig rig. Too easy!"],
      ],
      after: [
        ["sonic", "Piece of cake. Three more of these up on the cliffs, and Eggman's robots were after every one."],
        ["tails", "Sonic! There you are! My instruments went haywire an hour ago. Something's putting out a huge energy reading, all over the world!"],
        ["sonic", "Let me guess. Shaped like this?"],
        ["tails", "A Red Star Ring? That's it! That's the reading! Come back to the workshop with me, I need to take a proper look at it."],
      ] },

    // ------------------------------------------------------------------ 2
    { title: "The Workshop", who: "tails", kind: "run", stage: "s-runway",
      before: [
        [N, "Tails' workshop, out by the airstrip. The hangar doors hang open, and something has been through it in a hurry."],
        ["tails", "Oh no. My tools are everywhere... and they took the Tornado's spare engine!"],
        ["sonic", "Badniks. They must have tracked the ring here."],
        ["tails", "There's one carrying the engine down the runway! If it gets away, the Tornado won't fly for weeks."],
        ["sonic", "Your workshop, your call, little buddy. Want me to grab it?"],
        ["tails", "No... I can do this. I'll get it back myself. Just watch!"],
      ],
      beats: [
        [0.1, "tails", "There it is, past the belts! It's heading for the end of the runway!"],
        [0.5, "sonic", "Go, Tails! You've got it!"],
        [0.82, "tails", "Almost there... Don't you dare drop that engine!"],
      ],
      after: [
        ["tails", "Got it! The engine's fine. And look what the badnik dropped: another Red Star Ring!"],
        ["tails", "I scanned them. They don't just hold power, they pull it in. Near one, my batteries go flat and the lights flicker."],
        ["sonic", "And Eggman wants a whole machine full of them. Great."],
        ["tails", "With all thirty-nine in one engine, it could drain the power out of the whole world. I'll build a radar to find the rest... Huh. It's picking one up already. At Amy's house!"],
      ] },

    // ------------------------------------------------------------------ 3
    { title: "Fortune Cards", who: "amy", kind: "run", stage: "s-teacup",
      before: [
        [N, "Amy's house. To a badnik the size of a teacup, her parlour is a whole country."],
        ["amy", "Hey! Get off my bookshelf! Those are my favourite books!"],
        ["amy", "This morning my fortune cards said a shining star would fall into my life. And then a star ring came right through my window! It has to be a sign."],
        ["amy", "A sign that Sonic and I are meant to be together. Obviously!"],
        ["amy", "And now these little robots think they can take it? Not a chance. Piko Piko Hammer, let's tidy up!"],
      ],
      beats: [
        [0.1, "amy", "Shoo! Out of my kitchen! Out, out, out!"],
        [0.45, "amy", "They're after my fortune cards too?! That does it!"],
        [0.85, "amy", "There's my star ring! Nobody touches my lucky charm!"],
      ],
      after: [
        ["sonic", "Amy! You okay? Tails' radar said there was a Red Star Ring here."],
        ["amy", "Sonic! You came to save me! ...Well, I already saved me. But it's the thought that counts!"],
        ["sonic", "Great. So, about that ring..."],
        ["amy", "It's my lucky charm, Sonic. If you want it, you'll have to win it! Spar with me! And if I win, you take me on a date."],
        ["sonic", "Why does everything with you end in a date?"],
      ] },

    // ------------------------------------------------------------------ 4
    { title: "Hammer Time", who: "sonic", kind: "battle", arena: "parlour", foes: [{ who: "amy", lvl: 0 }],
      before: [
        ["amy", "Ready, Sonic? And don't you dare go easy on me!"],
        ["sonic", "Wouldn't dream of it. Come on, show me what you've got!"],
      ],
      after: [
        ["amy", "Hmph! Fine, you win. Take the ring."],
        ["amy", "But I'm coming with you! Somebody has to make sure you don't run off without me again."],
        ["sonic", "Heh. Wouldn't have it any other way."],
        ["tails", "Guys! The radar just lit up! There's a whole cluster of Red Star Rings up on Guardian Peak!"],
        ["sonic", "Knuckles' mountain. He's gonna love having visitors."],
      ] },

    // ------------------------------------------------------------------ 5
    { title: "Tricked Again", who: "knuckles", kind: "battle", arena: "peak", foes: [{ who: "sonic", lvl: 1 }],
      before: [
        [N, "Guardian Peak. Snow falls on the old echidna shrines at the summit, where Knuckles keeps watch."],
        ["eggman", "Knuckles! Thank goodness I found you! I came all this way to warn you!"],
        ["knuckles", "Eggman. You've got five seconds to get off my mountain."],
        ["eggman", "Sonic is on his way up here to steal the star rings from your shrines! He wants every last one for himself!"],
        ["knuckles", "The rings in the shrines? They fell here long ago, and my people kept them safe. Nobody touches them."],
        ["eggman", "See for yourself! He'll be here any second. Hohoho!"],
        ["sonic", "Hey, Knuckles! Listen, Eggman's after the..."],
        ["knuckles", "Save it, Sonic! Nobody takes anything from these shrines while I'm guarding them!"],
        ["sonic", "Oh, come on. He tricked you again? Seriously?"],
      ],
      after: [
        ["knuckles", "Ha! Had enough?"],
        ["sonic", "Knuckles. Look up the mountain."],
        [N, "High on the slopes, a line of badniks is carrying the shrines' rings away. The Egg Mobile floats along behind them."],
        ["knuckles", "Eggman! He tricked me so I'd keep you busy! ...Again!"],
        ["sonic", "Want some help?"],
        ["knuckles", "No! This is my mountain. I'll handle it myself."],
      ] },

    // ------------------------------------------------------------------ 6
    { title: "Summit Shrines", who: "knuckles", kind: "run", stage: "s-shrines",
      before: [
        ["knuckles", "Up the mountain, through the snow, and every one of those robots goes down."],
        ["knuckles", "Nobody makes a fool of me twice in one day!"],
      ],
      beats: [
        [0.08, "eggman", "Hohoho! Thank you for your cooperation, Knuckles! I couldn't have done it without you!"],
        [0.45, "knuckles", "Laugh while you can, Eggman. I'm coming for you!"],
        [0.85, "knuckles", "There's the top shrine. Almost there!"],
      ],
      after: [
        ["knuckles", "That's the last of them. The rings are safe."],
        ["knuckles", "...Hey. There were seven of them in the top shrine. Now there are six."],
        ["rouge", "Six is still plenty, handsome. You won't miss one."],
        ["knuckles", "Rouge! Put that back!"],
        ["rouge", "If you want it, come and find me tonight at the Diamond Club. Ciao!"],
      ] },

    // ------------------------------------------------------------------ 7
    { title: "Neon Rooftops", who: "rouge", kind: "run", stage: "s-rooftops",
      before: [
        [N, "The city after midnight. Over the neon of the club street, Eggman's courier robots are flying Red Star Rings across the rooftops."],
        ["rouge", "Jewels, starlight and a little danger. Now this is a job I can enjoy."],
        ["rouge", "The client wants to know where Eggman's couriers are taking these. And the world's greatest treasure hunter wants a few for herself. Everybody wins."],
      ],
      beats: [
        [0.1, "rouge", "There go the couriers, heading for the edge of town. Let's not keep them waiting."],
        [0.5, "rouge", "Mm, another one. These really are the shiniest things I've seen all year."],
        [0.86, "rouge", "And that's the last drop-off point. Now I know where they're going."],
      ],
      after: [
        ["rouge", "Three more for my collection. Not bad for one night's work."],
        ["knuckles", "There you are! Hand over the ring from my shrine!"],
        ["rouge", "So persistent. Fine. Beat me, and it's yours."],
      ] },

    // ------------------------------------------------------------------ 8
    { title: "Night Moves", who: "rouge", kind: "battle", arena: "club", foes: [{ who: "knuckles", lvl: 1 }],
      before: [
        ["knuckles", "I'm not going easy on you just because you're a thief!"],
        ["rouge", "Treasure hunter, sweetie. Get it right."],
      ],
      after: [
        ["rouge", "Too slow, Knuckles."],
        ["knuckles", "Grr... All right. You win this round."],
        ["rouge", "Relax. You can have your little ring back. This is government work, and the government pays better than jewels."],
        ["knuckles", "You're working for... what?!"],
        ["rouge", "A girl's allowed her secrets. But I've asked a friend to look at the expressway. Eggman's couriers hand everything to a blue blur there. And it isn't Sonic."],
      ] },

    // ------------------------------------------------------------------ 9
    { title: "Convoy Road", who: "shadow", kind: "run", stage: "s-convoy",
      before: [
        [N, "The expressway out of the city, as the sun goes down. Rouge's call has reached the one she asked."],
        ["rouge", "A convoy of Eggman's trucks, full of star rings, heading out of town. Think you can stop them, Shadow?"],
        ["shadow", "Hmph. Robots and trucks. This won't take long."],
        ["rouge", "Watch out for whatever's out in front of them. It's fast. Very fast."],
        ["shadow", "Nothing outruns the Ultimate Life Form."],
      ],
      beats: [
        [0.12, "shadow", "There's the convoy."],
        [0.5, "rouge", "That blur's at the front of the line, Shadow. Don't let it get away."],
        [0.86, "shadow", "Blue... and fast. So it's him."],
      ],
      after: [
        ["shadow", "The trucks are stopped. The one in front got away."],
        ["sonic", "Hey, Shadow! You seen a bunch of red rings come through here?"],
        ["shadow", "I saw you. Running at the head of Eggman's convoy."],
        ["sonic", "Wasn't me. I've been up a mountain all afternoon."],
        ["shadow", "Then prove it."],
      ] },

    // ------------------------------------------------------------------ 10
    { title: "Rivals", who: "shadow", kind: "battle", arena: "expressway", foes: [{ who: "sonic", lvl: 1 }],
      before: [
        ["sonic", "You know, you could just believe me for once."],
        ["shadow", "I believe what I see. Show me what you've really got."],
      ],
      after: [
        ["shadow", "...You're fast. But the one on the road was faster in a straight line. And it never once looked back."],
        ["sonic", "Faster than me? Okay, now I'm offended."],
        ["shadow", "It was a machine, Sonic. One built to beat you."],
        ["sonic", "Metal Sonic. So he's back."],
        ["shadow", "I made a promise to protect this world. I'll find where it's taking the rings. Stay out of my way."],
      ] },

    // ------------------------------------------------------------------ 11
    { title: "The Sky Gallery", who: "cream", kind: "run", stage: "s-gallery",
      before: [
        [N, "Petal Hall Museum. Upstairs, a new exhibit: Things That Fell From the Sky."],
        ["cream", "Look, Cheese! The sign says this Red Star Ring fell with a shooting star, a long, long time ago."],
        [N, "Cheese the Chao spins happily in the air. Then the skylights shatter, and badniks pour into the gallery."],
        ["cream", "Oh no! They're going to take the star ring! I don't like fighting... but Mr. Sonic always helps people in trouble."],
        ["cream", "Come on, Cheese. Let's be brave together! And after, we can have ice cream."],
      ],
      beats: [
        [0.1, "cream", "Excuse me, Mr. Robot! Please put that back!"],
        [0.5, "cream", "Cheese, up to the balcony! The gift shop balloons can carry us!"],
        [0.86, "cream", "There's the star ring's case. We're almost there!"],
      ],
      after: [
        ["cream", "We did it, Cheese! The museum's treasures are safe."],
        ["amy", "Cream! Are you all right? We came as fast as we could!"],
        ["cream", "Miss Amy! The robots took one ring away. They flew off toward the pools in the forest where the Chao live."],
        ["amy", "The Chao? Then that's where we're going. You were really brave, Cream."],
        ["cream", "Thank you very much, Miss Amy!"],
      ] },

    // ------------------------------------------------------------------ 12
    { title: "Chao Pools", who: "chaos", kind: "run", stage: "s-chaopools",
      before: [
        [N, "The Chao pools under the old shrine. The water is so clear that it shines under the moon, and the Chao sleep beside it."],
        [N, "Eggman's machines have come in the night. They are pumping the pools dry to reach a Red Star Ring at the bottom, and the Chao have nowhere to go."],
        ["chaos", "(The surface trembles. A figure of living water rises out of the deepest pool, and turns toward the machines.)"],
        [N, "Long ago this water had a guardian, and it has not forgotten the Chao."],
      ],
      beats: [
        [0.12, "eggman", "What is THAT?! Pump faster! Get me that ring before... whatever it is!"],
        [0.5, "chaos", "(The water rises around the pumps. The Chao gather behind it.)"],
        [0.86, "eggman", "No way! I can't believe this! Retreat!"],
      ],
      after: [
        ["chaos", "(Chaos sinks back into the pool. The water settles, and the ring shines on the bottom, where it has always been.)"],
        ["cream", "He was protecting the Chao. And I think he wants the ring to stay there, with them."],
        ["amy", "Then we'll leave it with him. That's one ring Eggman will never get."],
        ["tails", "Guys, the readings are moving fast. Something's heading west, toward Redstone Canyon!"],
      ] },

    // ------------------------------------------------------------------ 13
    { title: "Blasting Site", who: "mighty", kind: "run", stage: "s-blasting",
      before: [
        [N, "Redstone Canyon. A long way from anywhere."],
        ["mighty", "I came all the way out here for some peace and quiet. Red rock, blue sky, birds, nobody around for miles."],
        ["mighty", "Then a fleet of Eggman's machines shows up and starts blasting the canyon walls apart, looking for star rings. The animals out here have nowhere to hide."],
        ["mighty", "I don't like fighting. But I like bullies even less."],
      ],
      beats: [
        [0.12, "mighty", "Easy, little guys. I'll get these machines out of your home."],
        [0.5, "eggman", "An armadillo? Get a load of THIS! Blasting crews, double the charges!"],
        [0.86, "mighty", "That's the last of the blasting rigs. Nearly done."],
      ],
      after: [
        ["mighty", "That should keep them out of the canyon for a while."],
        ["sonic", "Mighty! Long time no see!"],
        ["mighty", "Sonic! I figured you'd turn up wherever Eggman's robots are. What's all this about red rings?"],
        ["sonic", "Long story. Eggman wants every one of them, and somebody's been helping him at top speed."],
        ["mighty", "A machine that looks a lot like you? It came through here an hour ago. Somebody was chasing it. A silver hedgehog, I think."],
      ] },

    // ------------------------------------------------------------------ 14
    { title: "The Last Street", who: "silver", kind: "run", stage: "s-laststreet",
      before: [
        [N, "Two hundred years from now. The city is burning, and has been for as long as anyone can remember."],
        ["silver", "This is my world. Nothing has gone right here for a long, long time."],
        ["silver", "Machines die. Buildings fall. The sky is dim. It's as if all the power was drained out of the world at once, long ago."],
        ["silver", "The old records say it began the day one man set thirty-nine red star rings into an engine. And they say who brought him the last one: a blue hedgehog."],
        ["silver", "If I can stop that from happening, maybe this future never comes. I won't give up hope. Not ever."],
      ],
      beats: [
        [0.12, "silver", "The old tower's at the end of this street. The way back opens there."],
        [0.5, "silver", "Hang on, everyone. I'm going to fix this. I promise."],
        [0.86, "silver", "There it is. Two hundred years, here I come."],
      ],
      after: [
        [N, "Silver steps through, two hundred years into the past, and lands on the floor of Redstone Canyon."],
        ["sonic", "Whoa! Where'd you come from?"],
        ["silver", "A blue hedgehog. Fast. It's you. You're the one who brings him the last ring."],
        ["sonic", "I'm the one who what now?"],
      ] },

    // ------------------------------------------------------------------ 15
    { title: "The Blue Blur", who: "silver", kind: "battle", arena: "canyon", foes: [{ who: "sonic", lvl: 1 }],
      before: [
        ["silver", "I'm sorry. I can't let my future happen."],
        ["sonic", "Hold on, you've got the wrong guy!"],
        ["silver", "It's no use! For the future!"],
      ],
      after: [
        ["silver", "You never once went for the ring I'm carrying. Why not?"],
        ["sonic", "Because I don't want it! There's a machine running around that looks just like me. I bet your records got the two of us mixed up."],
        ["mighty", "He's telling the truth. I saw it with my own eyes."],
        ["silver", "Then I almost... I'm sorry, Sonic. I was wrong about you."],
        ["sonic", "Don't sweat it. Help us catch the real one."],
        ["tails", "Everyone! I've found Eggman's base. It's a storage depot under the mountains, and most of the rings are there! But... Amy already went in."],
      ] },

    // ------------------------------------------------------------------ 16
    { title: "Vault Corridor", who: "gamma", kind: "run", stage: "s-vault",
      before: [
        [N, "Iron Hold Depot, deep in Eggman's hideout. Amy went in ahead of everyone, and now she sits in a cell by the vault, with a robot standing guard."],
        ["gamma", "Unit Chaos Gamma. Built on the design of E-102 Gamma. Assignment: guard the star ring vault, and the prisoner."],
        ["amy", "You know, you don't have to do everything he tells you."],
        ["gamma", "Query. Explain."],
        ["amy", "That Star Engine will drain the power out of everything. The little animals in his badniks, the Chao, everyone. You can see that, can't you? You're not like the others."],
        ["eggman", "Gamma! Intruders! Stop anyone who comes near my star rings!"],
        ["gamma", "...Data found. An old unit of my line once made this same choice. New assignment: free the prisoner. Stop the Star Engine."],
      ],
      beats: [
        [0.1, "eggman", "Gamma! What do you think you're doing?! Stop at once!"],
        [0.5, "amy", "Go, Gamma! You can do it!"],
        [0.86, "gamma", "Vault door located. Opening."],
      ],
      after: [
        ["gamma", "Vault open. Star rings secured. The animals in the badniks I stopped are free."],
        ["amy", "Thank you, Gamma. I knew you were a good one."],
        ["gamma", "Report. The Doctor's last shipment has already left. The robot in Sonic's shape is carrying it up a launch track, to his station among the stars."],
        ["sonic", "Metal Sonic, taking them to the Egg Orbital. We've got to stop him before he gets there."],
      ] },

    // ------------------------------------------------------------------ 17
    { title: "Metal's Orders", who: "metal", kind: "run", stage: "s-launch",
      before: [
        [N, "Meanwhile, high above the world..."],
        ["eggman", "Metal Sonic! Do you have them?"],
        ["metal", "(Metal Sonic's eyes flash red. It holds up a case full of Red Star Rings.)"],
        ["eggman", "Excellent! Take them up the launch track to the station, and let nobody stop you. Least of all that hedgehog!"],
        ["metal", "(It turns toward the track. Its jet roars.)"],
      ],
      beats: [
        [0.12, "eggman", "Faster, Metal! Show them who the real fastest thing alive is!"],
        [0.55, "metal", "(Its eyes narrow. Somewhere behind it, something blue is gaining.)"],
        [0.88, "eggman", "The dock is just ahead! Hurry!"],
      ],
      after: [
        ["metal", "(Metal Sonic reaches the top of the track. It stops, and turns around.)"],
        ["sonic", "Okay, copycat. End of the line."],
        ["metal", "(Its eyes burn red. The engine in its chest whines higher and higher.)"],
      ] },

    // ------------------------------------------------------------------ 18
    { title: "The Real Thing", who: "sonic", kind: "battle", arena: "stars", foes: [{ who: "metal", lvl: 2 }],
      before: [
        ["sonic", "You've been second best your whole life, Metal. Let's keep it that way."],
        ["metal", "(It drops into a crouch. Its jet flares.)"],
      ],
      after: [
        [N, "Metal Sonic staggers, sparks pouring from its joints. The case of rings slides away across the track."],
        ["sonic", "That was tight! But that's the last delivery you'll ever make."],
        ["eggman", "NO! Metal, get up! Ugh... no matter! I already have more than enough rings up here to start the Star Engine!"],
        ["eggman", "Come and get me if you dare, Sonic! The Egg Orbital is waiting!"],
      ] },

    // ------------------------------------------------------------------ 19
    { title: "Engine Core", who: "sonic", kind: "run", stage: "s-core",
      before: [
        ["tails", "The Tornado can get you as far as the station's outer hull. After that, you're on your own."],
        ["sonic", "Story of my life. Let's go!"],
        ["shadow", "I'm coming too. The Doctor has something that belongs to everyone."],
        ["sonic", "Ha! Look who decided to trust me."],
        ["shadow", "Don't push it."],
      ],
      beats: [
        [0.1, "tails", "Sonic, the Star Engine is right at the core! Follow the power lines in!"],
        [0.5, "eggman", "Welcome to the Egg Orbital, hedgehog! Every room on it is named after me, you know!"],
        [0.88, "shadow", "The engine room's ahead. Chaos Control!"],
      ],
      after: [
        [N, "At the heart of the station, the Star Engine turns, set all round with Red Star Rings. Dr. Eggman waits in front of it in the Egg Mobile."],
        ["eggman", "You're too late, Sonic! The Engine is running! Every scrap of power in the world is pouring into this station!"],
        ["sonic", "Funny thing about power, Eggman. It doesn't help much when the other guy's faster."],
      ] },

    // ------------------------------------------------------------------ 20
    { title: "The Star Engine", who: "sonic", kind: "battle", arena: "station", allies: ["shadow"],
      foes: [{ who: "eggman", lvl: 2 }, { who: "metal", lvl: 1 }],
      before: [
        ["eggman", "With all the power in the world on my side, I can't lose! Metal Sonic, rise! We finish this together!"],
        ["metal", "(Metal Sonic rises behind him, sparking, its eyes burning red.)"],
        ["shadow", "I'm the Ultimate Life Form. Your engine won't save you, Doctor."],
        ["sonic", "Two of us, two of you. Let's do this!"],
      ],
      after: [
        ["eggman", "No way! I can't believe this! I had all the power in the world! You little... I'll get you for this, Sonic!"],
        [N, "The Egg Mobile spins away into the dark, smoke trailing behind it. The Star Engine slows, shudders, and stops."],
        [N, "One by one the Red Star Rings shake loose, and fall back toward the world like shooting stars."],
        ["silver", "It's working. I can feel it. My future... it's changing!"],
        ["sonic", "Told you. Nobody's out of luck while there's somebody around to help."],
        ["tails", "The rings are landing all over the world again. Should we go and find them?"],
        ["sonic", "Nah. Let them land wherever they want. Somebody out there could use a little luck."],
        [N, "The end. Every stage still hides three Red Star Rings, for anybody who goes looking."],
      ] },
  ];

  const api = { TITLE: "The Red Star Rings", CHAPTERS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.AdventureStory = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
