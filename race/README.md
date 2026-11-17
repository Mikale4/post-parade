# Umamusume: Post Parade

A racing game you prepare for rather than play. Racers run on Umamusume-style stats and
spend their own cards according to temperament. You choose the racer, build the deck,
level them up — and during the race your only lever is the **Callout**.

```bash
python -m http.server 8712
```

Run it from the project folder, the one above `race/` (or double-click `Play Post
Parade.bat` there), then open <http://localhost:8712/race/index.html>. It must be served
over HTTP, and from that folder: the art and music live next to `race/` (`Racers/`,
`backgrounds/`, `audio/`), and opening `index.html` off disk blocks both them and the
module scripts. It is also published at <https://mikale4.github.io/post-parade/>.

## Files

| File | What it is |
|---|---|
| `sim.js` | The race model. No DOM; runs in node and the browser. |
| `roster.js` | The 11 exhibition racers: personality, passives, blurb. Its `ROSTER` returns them with the real-game fields from `rosterdata.js`. |
| `rosterdata.js` | All 26 racers, objectives included. **Generated** by `tools/genroster.js` from the real game (`tools/gametora-*.json`). |
| `careerdata.js` | The URA Finale race calendar, 404 races. **Generated** alongside it. |
| `carddata.js` | The 112-card pool. **Generated** — edit `cards/generate.py`. |
| `cards.js` | Generic interpreter over card data: legality and effects. |
| `ai.js` | Personalities, deck handling, the Callout, and when a racer fires a card. Full-deck races and the sharp read (the Dream Trophy). |
| `career.js` | Career mode's rules, both scenarios (`SCENARIOS`): training, races, goals, the finale, payouts. No DOM. |
| `ui-career.js` | Career screens: scenario and racer pick, the turn screen, schedule, race days, the ending. |
| `ui-decks.js` | The deck screens: whose deck, her decks, and the builder (sort, filter, search, the deck board, undo), with *Let her decide*. |
| `carddetail.js` | A card's details in plain words, and the press-and-hold that opens them. The builder and the race HUD share it. |
| `uniques.js` | Signature skills and their trigger conditions. |
| `progression.js` | Levels, stat growth, passives. |
| `index.html` | Screen shell, race view, stable, deck builder, results. |
| `theme.css` | The race-day visual language: tokens, buttons, panels, front of house. |
| `theme-meta.css` | The same language for scout, stable, decks, quests and every career screen. |
| `icons.js` | Every icon, drawn as pixel art on a 12×12 grid. `Icon("carrot")`. |
| `ui-lab.html` | The icon set and type samples on one page. |
| `auth.js` | Accounts: register, sign in, per-account save keys. |
| `settings.js` | Device preferences, and what reads each one. |
| `shell.js` | Title, register/sign-in, main menu, introduction, guided tutorial. |
| `fx.js` | Sparkles, confetti, wipes, screen shake, typewriter. |
| `scoutfx.js` | The scout's reveal, after the real game's gacha: the door and the gate for racers, the album and the deal for cards, the rarity tells, each pull in turn, the results grid. `ScoutFX.play(results, { kind })`. |
| `voxel.js` | The race in 3D voxels: course, scenery, every racer's model, cameras; the trainer model; each racer's voxel bust (`Voxel.bust`), the portrait on the deck screens. |
| `voxel-lab.html` | The whole roster lined up as voxel models, standing or running. |
| `attract.js` | The title screen's live race: random racers in a real G1, drawn by voxel.js. |
| `lobby.js` | The main menu in voxels: the academy's hall, the trainer's office, the cafeteria, the dorm, the school wing's classrooms and the training track outside, walked as your trainer or a racer, the others about their day, every mode a door that opens. |
| `trainer.js` | The trainer creator: your own character, made at registration, with a turning 3D preview. |
| `lines.js` | What the racers say in the lobby: each in her own voice, to the trainer, to a classmate, and to her pair. |
| `manifest.webmanifest`, `sw.js`, `icons/` | The game as an installable app: its name, colours and icons, and the offline copy. See "Installing it as an app". |
| `routines.js` | Where each racer is at each hour of the academy's day, and what she is doing: class, lunch, dawn training, the lab, the council room, asleep in her room. Her lines for the hour, and a word for her friends and rivals. Pure data and logic; `validate-routines.js` checks it. |
| `reactions.js` | How each racer takes her result after a race: a few moves and lines of her own for a win, a place, the middle of the field and the back. |
| `weather.js` | The season and the day's weather over the career screens (falling petals, leaves, rain, snow), and the names for them. The race does its own in 3D (`voxel.js` `applySeason`). |
| `rivals.js` | Rivalries: two racers neck and neck long enough clash, both their signatures fire, and each says to herself how she will beat the other. |
| `ambience.js` | The race's own sound under the music: every footfall synthesised and placed where she is, the crowd building to the finish, the surges. Drives the caller. |
| `caller.js` | The race caller, as captions: the break, the leader, the final turn, the straight, a charge, a close finish, the winner. |
| `validate.js` | Race model harness. `node race/validate.js 300` |
| `validate-personality.js` | Deck-vs-personality harness. |
| `validate-balance.js` | Card pool balance: cost curve, per-tier value, Callout value; the same for full-deck races, Callout timing, the sharp field, and both exhibition modes. |
| `validate-career.js` | Whole careers, both scenarios, side by side: goals, finale, the same race against both fields, payout. `node race/validate-career.js 60` |
| `validate-career-stress.js` | Career invariants over hundreds of erratic runs in both scenarios, old saves included. |
| `validate-kinds.js` | Is each card kind situational? Spread per kind vs the Burst control. |
| `validate-autodeck.js` | Does "Let her decide" build good decks, for each focus, running style, distance and track, within the two-copy limit, and do the planned decks beat the old builder? `node race/validate-autodeck.js` |
| `deckplans.js` | The deck plans "Let her decide" follows, per race context. **Generated** by `tools/gendeckplans.js`. |
| `quests.js` | Daily and weekly quests, trainer tasks (first steps and the tiered chains), awards. One `Quests.record(event)` feeds them all. |
| `validate-economy.js` | The stable, the scout, the unlock tree and the quest board: what it pays against the economy, a normal day and week played through, tiers, old saves. `node race/validate-economy.js` |
| `guests.js` | The guest racers, who visit from outside Umamusume: Sonic and Hatsune Miku. Hand-written from their own canon, given to every trainer, never scouted. See "Guest racers". |
| `adventure.js`, `adventure-stages.js`, `adventure-sprites.js`, `adventure-badniks.js` | Post Parade Adventure 2, the arcade cabinet in the hall: a side-on platformer in the race's voxels for thirteen runners in Sonic Battle's sprites (or sprites in its style), its thirteen stages drawn as text by `tools/genstages.py`, its frame tables generated by `tools/pack-sonic-battle.py` (the runners) and `tools/pack-badniks.py` (Eggman's badniks, from Sonic Advance 1-3 and TheKnucklesMainG4's Modern Sonic Badniks). See "Post Parade Adventure 2". |
| `validate-adventure.js` | Checks the thirteen stages: their shape, one start and one winning post, three horseshoes each, and a rough walk showing every part can be reached. `node race/validate-adventure.js` |
| `assets/guests/` | The guests' portraits, rendered from their voxel models (the screens that show a picture rather than a live bust); `sb-<who>.png`, the thirteen runners' sprite atlases for Post Parade Adventure 2; and `badniks.png`, its badniks. |

Card art is rendered by `cards/build.py`; `assets/cards/` holds the thumbnails.

## Installing it as an app

Post Parade installs like an app, the same way KNOCK//BACK does: an icon on your home screen or desktop, full screen, and offline play once it has loaded.

The pieces:
- **`manifest.webmanifest`:** the name, the colours, full screen.
- **`icons/`:** the game's pixel horseshoe, in gold on mown turf, made with Pillow. Sizes: 192 and 512, a maskable 512, and the 180 Apple touch icon.
- **`sw.js`:** the offline copy (a service worker).
- **A small script at the top of `index.html`:** keeps `AppInstall`. It catches the browser's install offer as soon as it comes, before the game's scripts are in, and registers `sw.js`.

The install button:
- **Settings > Install the game** (`shell.js` `installHtml`) shows **Install Post Parade** when the browser offers it.
- On an iPhone or iPad, where there is no offer, it gives the Share > Add to Home Screen steps.
- Once installed, it says so.

**The offline copy goes to the network first, always.** The scripts are stamped with the load time (`?v=`), so they would be new names every load and a copy-first cache would only pile up stale ones. Instead:
- Each response is kept under its address without the stamp, one copy each, overwritten as it comes.
- The copy is served only when there is no connection.
- Music streamed in ranges isn't kept.
- Bump `VERSION` in `sw.js` to clear the old copies.

**Only the live site installs.** A copy served from this computer has neither the manifest nor the offline copy. That covers `localhost`, `127.0.0.1` and `*.localhost`: `Play Post Parade.bat` and the test servers.
- An app installed from one of those would only run while that server window is open, and every edit has to show up there at once anyway. An app installed from `localhost` opened to a bare, unstyled page once the server had stopped.
- On such a copy, Settings explains this and links to the live site.
- `?sw=1` turns both on there, for a test.

**If the files never arrive** (the local server is not running, or there is no connection and no offline copy yet), the page says so and offers Reload, instead of showing its bare markup.

## Front of house

The game opens on a title screen offering **Log In** and **Register** (plus *Continue*
when a session is live), then an eight-beat introduction in Tazuna's voice, and a main
menu. First-time trainers are offered a guided tutorial.

Behind the title runs **a live race** (`attract.js`): a real G1 off the calendar, eight
launch racers who suit its trip and ground, run by the real sim with the card AI and
their real uniques, drawn by the voxel race view at 1.6x under the Auto director, with
a broadcast caption of the race and its leader. When the field pulls up, the next race
is drawn. `Voxel.setupRace(stage, G, { attract: true })` forces Auto whatever view the
player keeps, draws no "you" ring, and lifts the frame a fifth of the screen so the
racers run above the logo. Nothing is saved. Without WebGL the key art
(`assets/ui/title.jpg`) shows instead.

### The lobby

The main menu is **the academy's main hall, walked** (`lobby.js`), after the game's own
lobby: cream marble squares, columns under a mezzanine with a balustrade, navy wainscot
over red carpet, burgundy drapes with gold fringe, and the library's doors between two bookcases.
Every mode is a place in it: the notice board is Quests, the library's deck archive is Decks, the
academy terminal by the jukebox is Settings, the classroom door opens on the school wing (Tutorials), the glass doors to the track are
Exhibition, the side doors on the right lead out to the training track (Scouting) and to the Dormitory, the arcade
cabinet beside the dorm doors is Post Parade Adventure 2, and the reception desk is How to play. A tag over each says which; walk up to one and press **E** (or click
the tag, or the door) to go in. The dock along the bottom has every mode too, so nobody has
to walk. Nine places in all: the hall, the trainer's office, the library, the cafeteria, the dorm
corridor, a dorm room, the school corridor, a classroom, and outside, the training track.
The hall and the office are built at the start; the rest the first time you go in.

The double doors at the back are **the trainer's office**, a second room. It is
wood-panelled, with the trainer's desk and chair, a whiteboard with the week's training
on it, a sofa and a tea table, a sideboard with the kettle, a cabinet of trophies,
shelves of race records, and a rug. **The trainer** works there: you, as you made yourself
(below). Walk in as one of your racers and the trainer is at the desk typing, at the
whiteboard, the window, the shelves, the kettle or the sofa, and says a word to her when
she comes near. Walk as the trainer and the office is empty, since you are the one in it.
Its far door, on the right, is **the stable**: that is Career, the career page itself.

The office shares a wall with the hall, and **a window** in it beside the door. Both
rooms are built once and both go on living all the time, the hall's racers and the trainer
alike. The window is a real opening onto the other room (`paintWindow`). Each frame it is
on screen, the room you are not in is drawn from where your camera would be if the wall were
glass: your camera is carried through the window and turned about, with the same lens, and
everything beyond that room's wall is clipped off. The picture lands on the pane pixel for
pixel, read by screen position. So people through the window are their true size, everyone
is moving, and the view shifts as you walk past.

**The library** is through the doors at the back left of the hall, between two bookcases
(the hall's tag says "Library · Deck archive"). Like the office it is behind the hall's back
wall, so it faces the other way (`yaw`): the camera looks back at the doors you came in by.
Its far wall, with the windows, is the end of the building, beside the cafeteria's corner,
so the stretch of that wall nearer the hall has no windows.

- **The shelves:** tall cases along the back wall and the left wall, each with a rolling
  ladder on a brass rail, and two stacks standing between them, plated "A - K, Race
  history" and "L - Z, Training", books lying on top. The books come in runs of a height,
  like sets of volumes, with a gap here and there where one is out (`bookcase`).
- **The desk:** the librarian (`STAFF.library`: a cardigan, glasses, grey hair in a bun)
  works at her screen behind the checkout desk by the doors. There's a pile of returns, a
  bell and a green lamp. She looks up when you come to the desk and has a word for you.
- **The deck archive** is on the other side of the doors. It's a card catalogue of
  thirty-two drawers with brass pulls and cards in their holders, one drawer pulled out, a
  deck fanned on top by a lamp. The best decks are pinned up over it in a frame. It is
  **Decks**: its tag is the shell's Decks station (`onEnter("deck")`), which used to stand
  in the hall.
- **To sit:** two long reading tables with green leather tops and banker's lamps, two
  chairs down each side; a reading corner of two leather wing chairs on a rug, with a low
  table between them; and seats in two of the tall windows, which have green curtains.
- **Around the room:** a globe on a stand, a returns cart, the library's notice board, a
  clock, a QUIET, PLEASE sign and paintings over the shelves, and a green runner from the
  doors. The walls are 6.5 m, tall enough to fill a phone held upright.
- **Who's there:** a few racers (`library`, from the shell). They study at the tables,
  read in the wing chairs and the window seats, browse the stacks and the archive's
  drawers, read the notices, look out of the window, and whisper in the aisle.

The camera never turns toward a side wall in the library. It looks straight down the aisles
between the stacks, which a turn would hide behind them.

**The cafeteria** is through the doors on the hall's left wall, drawn the way *Cinderella
Gray* draws a canteen:

- **The counter** runs along the back: a steel front with a tray rail, pans of rice,
  curry, karaage, salad and glazed carrots, a rice cooker, a soup pot, a stack of trays.
- **The kitchen** is behind it, through a hatch hung with an indigo noren: a stove under
  its hood, a bench of vegetables, pots on a shelf, a fridge. The cook works at the pans
  (`STAFF.cafe`, the trainer model with an apron and a cap).
- **The menu** is chalked on a green board over the counter.
- **The tables** are four long ones with chairs down both sides, green lamps hung over them.
- **By the door** is a glass case of plastic food. There's also a tray return, a water
  machine, and tall windows onto the grounds on the left.

Most of the cafeteria's company sit down to eat (a tray appears on the table in front of
each). **Oguri Cap** goes to the cafeteria rather than the hall. She has her own place
at the end of a table, and while she eats, empty bowls pile up beside her in towers
(`updateFeast`), cleared once she leaves.

**The dorms** are through the hall's right-hand doors, which used to open the Stable page
directly. Every racer in the roster has a room in the dorm the real game puts her in, two to
a room with the game's own roommates (`DORM_ROOMS`, after umamusu.wiki's list):

- **Ritto Dorm, ground floor** (101–108): Special Week & Silence Suzuka, Tokai Teio &
  Mayano Top Gun, Vodka & Daiwa Scarlet, Oguri Cap & Tamamo Cross, King Halo & Haru Urara,
  Agnes Tachyon & Agnes Digital, Mejiro McQueen & Ikuno Dictus, Gold Ship & Stay Gold.
- **Ritto Dorm, 2F** (201–208), up the stairs at the far end: Super Creek & Narita Taishin,
  Nice Nature & Marvelous Sunday, T.M. Opera O & Biwa Hayahide, Winning Ticket & Tosen
  Jordan, Air Groove & Fine Motion, Matikanefukukitaru & Matikanetannhauser, Maruzensky,
  Kitasan Black & Satono Diamond.
- **Miho Dorm** (101–108), the other dorm, over a covered walkway from Ritto's ground-floor
  far end: El Condor Pasa & Grass Wonder, Taiki Shuttle & Mejiro Dober, Rice Shower & Zenno
  Rob Roy, Mejiro Ryan & Ines Fujin, Symboli Rudolf, Sakura Bakushin O, Manhattan Cafe &
  Yukino Bijin, Seiun Sky & Sakura Laurel.

The game names no roommate for Rudolf or Bakushin, and lists Maruzensky as living alone
without naming a dorm. So they have rooms to themselves, the other bed made up plain for
nobody, and Maruzensky's being in Ritto is this game's choice. A few rooms are for pairs
outside the roster (Kitasan and Satono, Manhattan Cafe and Yukino, Seiun Sky and Sakura
Laurel). They fill out the floors, are dressed in colours of their own, and nobody is ever
home in them. Someone not in the roster still has her name on her door and her bed.

It is one corridor, dressed for whichever floor you're on (`dressCorridor`):

- **Doors:** eight room doors, each with a plate giving the room number and who lives there.
- **Ends:** Ritto's ground floor has the hall's doors at the near end and the walkway's
  glass doors at the far end. Upstairs, the near end is wall and the far end a window. Miho
  has the walkway's doors at its near end and a window at the far end. Outside, the hedge
  breaks where the walkway's doors swing open, and a paved way leads off (`outdoors`'s
  `gap`). Each end's sign hangs clear of its door frame, and its tag floats above the sign.
- **Stairs:** the stairwell off the far end goes up from the ground floor and down from 2F;
  Miho's is walled up.
- **Signs and runner:** each floor has its own signs. Ritto's runner is green, Miho's blue.
- **The residents' board** by the entrance is the Stable, so the hall's tag for these doors
  still reads Stable.
- **Room tags** show just the number until you're at the door, then who lives there.
- **The drinking fountain** stands by the board. A runner goes down the middle, with
  squares of sun on the floor between the doors.
- **The corridor's company** each keep to their own dorm's floor. Leaving a room puts you
  back at its door on its floor.

**A dorm room** is one room, dressed for whoever lives in it (`dressRoom`), and kept once
built:

- **Furniture:** two beds, heads to the back wall, with a desk each between them and a shelf
  of books over each desk. There's a wardrobe each, a rug and a low table with cushions, the
  door from the corridor on the left and a window onto the grounds on the right.
- **Her things:** each resident's bedspread and pennant are in her colour from the game
  data, with a plush on her pillow. Something of hers is on her desk: Tachyon's test tubes,
  Oguri's, Spe's and Gold Ship's snacks, a trophy for the ones out to win, Vodka's helmet,
  Mayano's model jet, Suzuka's photo, Urara's carrot plush.
- **Who's home:** up to six residents are in their rooms each time the lobby opens
  (`home`, chosen by the shell). They keep to their own side: their own bed, their own desk.
  In a room with one resident, the other bed is made up plain, with books on its desk.

**The training track** is out through the Scouting doors on the hall's right: the
academy's old practice course. It's built after the early Kasamatsu track in *Cinderella
Gray*: a small, worn local course of deep sand by a river, older facilities and a tight
budget.

- **The course:** a stadium-shaped sand oval (`OVAL`), darker along the line they run.
  - Its white rails are worn: some lengths are rust-grey, a few posts are gone, and there
    are gaps to get onto the track and into the infield.
  - Red-and-white furlong poles stand round the inside, with a winning post on the near
    straight.
  - The worn infield has a row of cones for drills.
- **Around it:**
  - an old grandstand of concrete steps under a tin roof, signed TRAINING TRACK;
  - a tin shed, an outdoor tap, benches by the rail, a chain-link fence along the far side;
  - floodlights at the four corners;
  - sidewalks along the school and the road;
  - the school's side, where the Scouting doors come out under a canopy;
  - trees round the edge.
- **Beyond it:** the river's levee with a path on top, the river, an iron railway bridge
  over it, and mountains. All of it is outdoors under a sky that follows the hour
  (`OUT_MAT`, `SKY_MAT`).
- **Racers** (`track`, from the shell):
  - they warm up: jogging a lap or two of the oval at their own pace, kicking up the sand;
  - they stretch in front of the coach, do high-knee drills at the cones, sit on the
    benches or the grandstand's front step, drink at the tap, or have a word with a
    trainer at the rail. You can sit in the grandstand too (**Sit and watch**): eight
    places, two in each bay between its roof posts.
- **Trainers** (`STAFF.track`), each with their own look:
  - the veteran times them with a stopwatch, his eyes on whoever is running nearest;
  - the rookie takes notes on a clipboard;
  - the coach calls out the stretches;
  - the scout recruits at a folding table.
  
  Each has their own lines when you come near.
- **Scout stations:** the **recruiting table** and **the rail** both open the scout screen,
  the way the lobby always has (`onEnter("scout")`).
- **After dark:**
  - the floodlights come on: glows at the lamps, pools of light on the track, and the
    whole track lit;
  - the racers stop what they're doing and go in through the school's doors; the trainers
    go too, all but the veteran, who stays on;
  - in the morning they all come back out.

**The school wing** is through the classroom door at the back of the hall (the hall's
Tutorials tag, "School wing"). It is a corridor of classrooms, Tracen-style, one for each
tutorial (`LESSONS`, from `Stable.TUTORIALS` through the shell, seven at most):

- **The corridor:**
  - Sliding doors with glass in their tops (a `slide` door runs its leaf into the wall),
    each with its lesson's plate overhead: the name, its number, and "done" in green once
    taken.
  - Banks of steel lockers between the doors, with vents, handles and name cards.
  - A drinking fountain and a window at the far end, and sun on the floor between the doors.
  - The timetable by the entrance lists every lesson with a tick by the ones taken. It is
    the plain Tutorials list (station `tutorial`); the dock has it too.
  - Each classroom's tag says whether its lesson is done.
- **A classroom** is one room, dressed for its lesson (`dressClass`):
  - The blackboard across the front sits on a low platform. On it, chalked up: which lesson
    of seven, its name, what it covers, a chalk drawing of it (a track, a starting gate,
    cards, a star, a calendar...), and "Done" ringed in pink once taken.
  - The teacher's desk by the windows has the register, chalk and flowers. There are three
    rows of desks with their chairs, a notice board by the door, a clock, ceiling lights,
    and tall windows onto the grounds (north, as the dorm rooms').
- **The lesson** starts at the board ("Start the lesson", or "Done · take it again"). It goes
  through the lobby's `onLesson` and starts the way the Tutorials list starts it: a scripted
  tutorial with `Tutorials.start`, a race one (race, dream, rival) with the shell's
  `startTutorial`.
- **Who's there:** a couple of racers stand about the corridor (`school`). The ones in
  class (`classes`) are spread over the classrooms and sit at the desks to study.

**Day and night.** The academy keeps its own clock: a real minute is an hour there, so a
whole day takes 24 minutes. It runs off the real clock (`hourNow`), so it's the same hour
on every screen and keeps going while you're away. The clock sits bottom left, with a sun
or a moon, the time on a 12-hour clock ("6:42 PM"), and what part of the day it is. The phases are night, before dawn,
dawn, sunrise, morning, midday, afternoon, the golden hour, sunset, dusk, twilight and
night again.

`SKY` gives how each hour looks, and `daylight()` blends between them every frame:

- **The light in the rooms:** its colour and strength, warm lamplight at night.
- **Where the light comes from:** the sun rises in the east, leans south at noon, and sets
  in the west, so shadows swing and lengthen through the day. It hands over to a little
  moonlight at night. Each room turns that into its own frame (`yaw`): the office faces the
  other way from the hall, a dorm room a quarter turn. Morning sun comes in at the dorm
  corridor's east window and evening sun at the cafeteria's west windows.
- **The sky and grounds beyond the windows:** they darken and tint with the hour, as does
  the glass in the hall's windows and what lies beyond the rooms.
- **The lamps:** sconces, the cafeteria's pendants, the corridor and dorm-room lights, the
  desk lamps. They glow from dusk until after sunrise.

`Lobby._debug.setHour(h)` jumps the clock, for checking.

**Where everyone is, by the hour** (`routines.js`). The clock also decides who is where.
Each of the 26 racers has a routine, band by band:

| Band | Hours | Most of the academy | Her own way |
|---|---|---|---|
| Late night | 0–5 | asleep in her dorm room | Tachyon in her lab; Nature up with a snack; Gold Ship roaming the corridor |
| Dawn | 5–7 | asleep, or out early | Suzuka running alone; Rice, Oguri, Ticket, Taiki, Opera O on the track; McQueen's tea; Groove and Grass at the flowers; Ryan at the gym; Fukukitaru at the shrine; Rudolf at her paperwork |
| Breakfast | 7–8 | cafeteria | |
| Classes | 8–12, 13–15 | classrooms | Gold Ship on the roof; Tachyon half in her lab; Urara napping with Seiun Sky |
| Lunch | 12–13 | cafeteria | Rudolf and Groove in the council room; Scarlet in the library; Fukukitaru's fortune stall and Opera O's matinee in the hall; Bakushin patrolling the corridor |
| After school | 15–18 | the track | Rice in the library; Maruzensky out driving; Mayano shopping; Tachyon watching with a notebook |
| Dinner | 18–20 | cafeteria | |
| Evening | 20–22 | dorm rooms and corridors | Rudolf at chess in the library; Suzuka stargazing on the roof |
| Curfew | 22–24 | in her room | |

The routines come from the games, the anime, *Road to the Top*, the film and *Cinderella Gray*:
- **From canon:** McQueen's morning tea, Tachyon's night hours, and Teio falling asleep to classical music.
- **Inferred from character:** hours the sources don't give, e.g. Suzuka running before anyone is up.

A band can carry odds ("track:jog 60, home:sleep 40"). Each pick holds for the whole band that day, and each racer moves up to half an hour off the hour, so rooms empty gradually, not all in one tick.

Nobody runs like a clock, though:
- **Whims:** on a given day, a racer can be somewhere else for a band. That happens about one band in eight, rarely when her own routine pins her, and seldom at night (up for a drink, a word in the corridor). `WANDER` lists where whims take her.
- **Never empty** (`ABOUT`): at any hour there are at least 5 racers about the main hall (3 at night), 2 on the training track, 2 in the cafeteria and 1 in the library.
  - Anyone short is filled from whoever isn't pinned elsewhere, the ones still awake first at night. A racer whose day ever takes her to that place is a little likelier.
  - Nobody is pulled out of a place that would then fall short itself. A fresh draw comes every hour and a half.
  - At 3 AM that can mean a midnight snack in the cafeteria, a moonlit lap, or Rudolf over her books in the library.
- **`keep`:** bands a racer never strays from. Rice Shower stays in at night (she is afraid of ghosts), Suzuka always takes her dawn run, and Oguri is always at her meals.

How the lobby uses them:
- **Coming and going:** in the room you are in, a racer due elsewhere gets up, walks to the door that leads there, opens it and goes through. One due here comes in through the door she is coming from.
- **Out of sight:** a room you aren't in is simply right when you walk in. At night the racers in a dorm room are already asleep in their beds, with the odd "Zzz...".
- **Doing her thing:** in a room, each racer leans toward her routine's activity: a lap or a drill on the track, a seat at a cafeteria table, a desk in the library, her own bed.
- **Talking:** she has lines for her hour, plus a word for particular racers when they share a room (Spe calling after Suzuka, Gold Ship ambushing McQueen). Every line is written for this game; none is quoted.
- **Crowd sizes:** each room holds a set number. Racers already there keep their places first, then those always there at that hour. Phones get fewer.
- **The staff keep hours:** Tazuna at the front desk 7 AM–9 PM, the cook 6 AM–8:30 PM, the librarian 8 AM–9 PM. Tazuna knows where everyone off-screen is: "Looking for Gold Ship? She's up on the roof."
- **Fallback:** without `routines.js`, the shell's fixed room lists still work.

Checks:
- `node race/validate-routines.js`: every routine reads, every racer has one, and the academy keeps its hours (mostly in bed at 2:30 AM, in class at 10, at dinner at 7). It also checks that whims happen, that the `ABOUT` places are never empty, and that `keep` holds.
- `Lobby._debug.whereNow(def)` and `dueIn(room)` show what the lobby makes of it.

**Doors open.** At a door she turns to it, it swings open (each leaf on its own hinge),
she walks through, and the camera comes down behind her. Then the screen fades to the
next room, where she steps out of its door and it shuts behind her, or to the mode. Coming
back from a mode, she walks out of the door she went in by. Places without a door just
fade.

**Detail.** The building is voxels a quarter of a metre across; the furniture, the doors
and the fittings are a sixteenth, the racers' own grain:

- **Vending machine:** cans on three shelves behind its window, a button under each, a
  red readout, coin and note slots, and a pick-up flap.
- **Jukebox:** an arched cabinet with coloured bubble tubes round it, a record behind
  its dome, title cards and a speaker grille. It is a real jukebox (below).
- **Academy terminal** (Settings): a self-service kiosk on a steel foot, with a card reader
  and the school's green crest on its front. Its screen tilts up at you: a blue title bar
  over rows of options, each with its switch. It glows at night.
- **Benches:** slatted, on metal frames.
- **Notice board:** pinned lists, a race poster and a calendar.
- **Reception desk:** panelled, with a bell, leaflets and a monitor.
- **Doors:** each its own, from panelled glass to a crimson pair with gold stars,
  green stable doors and the glass doors to the track.

Faces nobody can see are left out of the meshes (`meshVox`'s `keep`): the undersides of
floors, the outsides of walls, the hall's ceiling. That keeps both rooms at 60 fps in the
browser pane.

You walk as **your trainer, or one of your own racers** in her signature outfit, as every
racer wears it everywhere in this game (WASD or
arrows, Shift to run, or click the floor). **Walking as…** at the top right picks which;
the choice is kept per account (`postparade.lobbyRacer.<id>`, `trainer` for yourself),
and the trainer is the default. Up to fourteen others share the hall, the rest of your
own racers first: they gather in twos and threes to talk, read the board, get a drink,
listen to the jukebox, browse the shelves, sit on the benches, or just cross the hall.
The camera follows you to every wall, and as you near a side wall it turns toward it, so
the doors there face you instead of being seen edge on.

**What they say.** Every launch racer talks in her own voice, as she is in the games, the
shows and the films (`lines.js`, written for this game): Spe hungry and homesick for
Hokkaido, Teio boasting, McQueen prim, Gold Ship selling yakisoba, Oguri asking after the
rice. Each has six lines for the trainer and four for a classmate, and some pairs have
lines just for each other (Spe and Suzuka, Vodka and Scarlet, Grass and El, Teio with
McQueen and with Rudolf), said more often than not when it's her you're walking as.
Nobody asks you where you are: a line that names you is skipped when it's you she's
talking to. They speak:

- **when you click one;**
- **when you pass close by,** now and then (half the time, never two at once, and each
  holds her tongue for a while after);
- **in their huddles,** sometimes a real line among the dots.

Tazuna has her own lines, and the trainer in the office greets the racer you walk in as by
name. A racer not in `lines.js` falls back on a few plain ones.

The academy's **staff** keep their posts (`STAFF` in lobby.js). Tazuna Hayakawa is at the
information desk, beside its monitor, in her green suit and hat. She types while nobody is
near, looks up as you come to the desk, greets you, and has a word if you click her. She is
built on the trainer model, with colours, a tie, a hat, tights and shoes outside the
creator's lists (`custom`).

**Things to do.** A gold hint (**E** and what it does) shows over the nearest thing you can
use; E or a click on it does it (`HALL_THINGS`, `OFFICE_THINGS`):

- **Seats:** sit on a bench, the sofa, or at the trainer's desk, where the trainer gets to
  work typing. A step, a click or E again gets you up. Seats are the same ones the others
  use, so a seat someone is in isn't offered, and the one you're in is kept for you.
- **Vending machine:** pay, a can drops, you pick it up, turn round and drink. You carry
  it after, sipping now and then while you stand, until you **throw it in a bin**. The can
  flies in an arc. Or you finish it, after a minute. One drink at a time.
- **Kettle (office):** make a cup of tea, which steams in your hand while you sip. Put it
  down there again when you're done.
- **Window, trophies and whiteboard (office):** look out over the hall, admire the
  trophies (they sparkle), or check the board. You say what you think of it.
- **Lunch (cafeteria):** the cook hands a tray over the counter and you carry it in both
  hands. Sit at any table and it goes down in front of you, and you eat. Get up and you
  take the tray, empty now, to **the tray return**. A tray left in your hands stays in the
  cafeteria when you leave. There's also water from the machine, the menu to read, the
  plastic food to look at, and the windows.
- **Dorm:** a drink at the corridor's fountain; in a room, **a nap** (you lie back on
  either bed, head on the pillow, and drift off), **study** at either desk, or look out of
  the window.
- **School:** a drink at the corridor's fountain and the view from its window; in a
  classroom, **take a seat** at any desk (and get writing), or look out of the window.
- **Library:**
  - **study** at a reading table;
  - **sit and read** in a wing chair, or **sit by the window**, a book open in your lap;
  - **pull a book** from the tall case, or **browse the shelves** of a stack;
  - **read the notices** or **check the returns** cart;
  - **look out** of the middle window;
  - **spin the globe**: a push, and it spins and slows.

  You say what you found.
- **Training track:** **jog a lap** of the oval with the others (from the gap in the outer
  rail, a full lap on their line), **stretch** on the infield, sit on a bench by the rail,
  or have a drink at the tap.
- **The jukebox (hall):** as in the real game, it plays any music you've already heard
  somewhere in the game. That's every looping track, but no fanfares or stings. It opens
  `UIMeta.jukebox()` (through the lobby's `onJukebox`), listing:
  - the heard tracks, home screen first, each titled from its file and labelled with where
    it's heard;
  - "The academy's own" (the home theme, by day or night) to go back to it;
  - how many of the 80 you've heard so far.

  Your pick plays in place of the home theme. That covers the lobby and every screen that
  borrows the home theme (Stable, Quests, How to play, Settings). A screen with music of its
  own (scouting, a career, a race) plays that instead, and coming back brings your pick back,
  from where it left off.
  - The pick is the `jukebox` setting. It's in `settings.js` but `hidden`, so it's off the
    Settings screen.
  - Heard tracks are remembered on this machine (`postparade.heard`, written by `sound.js`
    as each track starts).
  - It plays at the music volume, and a change of volume reaches it at once.
  - While your pick plays, coloured lights rise off the jukebox's dome.

**Places with music of their own.** Three places in the lobby have their own music, from the
same rip as the rest. It plays while you're there, in place of the home theme:

- **The school wing** (its corridor and every classroom): "URA Classes" and "Fun Behind
  the School".
- **The training track:** "Dark Bay Swaying in the Wind" and "Training Camp by the
  Seaside".
- **The library:** the quiet `ambient` tracks ("Silence", "It Will Be All Right" and the
  rest), already in the folder.

How it works:
- The lobby names each room's music (`music` on the room) and tells the shell as you go
  in (`onMusic`, which calls `Sound.area`).
- Each place's pair plays one after the other. Walking between its rooms doesn't restart
  it, and back in the hall the home theme picks up where it left off.
- A jukebox pick still plays everywhere, these places included.
- The files are bound by role (`school`, `track` in `tools/genaudio.js`). They join the
  jukebox once heard, labelled with where they play.

While you're at something you stay at (a seat, the window, the trophies, the board), its
E prompt (**Get up** or **Done**) sits above the dock rather than over your head, where it
would cover what you say and what you're looking at.

At a spot someone else is using (the machine, the kettle, the window), they step aside
for you. `tools/dev/lobby-harness.html` runs the lobby on its own, with no account, and
`Lobby._debug.tick(secs)` runs it forward from the console without waiting for frames.

**Portraits.** The small portraits around the game are live voxel busts of each racer,
from the chest up and turned at an angle (`Voxel.bustHTML`). That covers the deck screens,
the pickers (Walking as…, a deck plan), the career's veteran cards, the results board and
the list of newly unlocked racers. Each breathes, looks about, glances off now and then and
blinks. One shared renderer draws every visible bust about 25 times a second into its own
small canvas; any bust tag put in the page starts itself. The big illustrations stay as
art.

**The trainer** is made when the account is (`trainer.js`, the screen after
registration). An account from before there were trainers makes theirs the next time it
opens the menu, and **Your trainer** at the top of the lobby changes it later. The
choices are:

- **Body:** a man or a woman.
- **Skin:** five tones.
- **Hair:** eight colours, and five cuts each: short, spiky, swept back, a buzz cut or shaggy
  for a man; a bob, long, a ponytail, a bun or a pixie cut for a woman.
- **Eyes:** five colours.
- **Attire:** a suit and tie, a tracksuit, a sweater over a shirt, or a polo and cap, in
  eight colours.
- **Bottoms:** trousers, jeans or shorts for anyone, and for a woman a skirt, a pleated skirt or a
  long skirt as well.
- **Glasses:** with or without -- the anime kind, the lenses white with glare.

The preview turns on a round of turf and can be dragged. The choices are saved on the
account (`Auth`, `trainer`) as indices into voxel.js's `TRAINER` lists. `kit.trainer.make`
builds the figure on the racers' rig, a little taller, with a person's ears and no tail,
so it walks, sits and turns its head with the same `pose()`.

Everybody walks by **path**, not in a straight line: the floor is a quarter-metre grid,
each cell open if a racer fits there, and A* finds the way round the pillars and the
furniture. A path starts with a step out to the nearest open cell, because the machine,
the board and the shelves are used from inside their own collision margins. It ends
with the step back in to the spot itself. A bench is sat on from the floor in front of it:
she walks up, turns round and slides back onto the seat as she sits. She stands up the
same way, so she never starts a walk from inside the bench. Only the keys steer
directly, sliding along whatever is in the way.

When you come back from a mode you are where you left off, in the room you left it from.
The shell stops the lobby (`stopAmbient`) on every screen change. Without WebGL the old flat menu (`homeBuild`)
shows instead.

### Accounts

`auth.js` keeps a real account store, not a single overwritable profile:

- `postparade.accounts` — every registered trainer, keyed by id
- `postparade.session` — who is signed in
- `postparade.save.<accountId>` — **that account's own stable**

The last one is the important part. An earlier build kept one global save key, so every
trainer shared the same racers and signing in as someone else changed nothing. Registering
now creates an empty stable; signing back in restores yours. The first account created on
a device inherits any pre-accounts save rather than orphaning it.

Registration validates the username (3–16 chars, no duplicates, case-insensitive) and
password length; sign-in returns the **same message for a wrong password and an unknown
user**, so the form never confirms which names exist.

Passwords are salted SHA-256 via SubtleCrypto. **This is not a security boundary** —
it is browser localStorage and anyone with the machine can read the store. It is hashed
rather than plaintext for one practical reason: people reuse passwords, and a local game
has no business keeping one in the clear.

`shell.js` owns all of that and drives the game through a deliberately small surface —
`Game.showStable()`, `Game.showDeck()`, `Game.startTutorialRace()` — so the front end
never has to know anything about the simulation. The race reports back through
`Shell.notify(event)`, which is how the tutorial knows when the racer has actually played
a card or the player has spent a Callout.

### The tutorials

Seven, on the Tutorials board (`Stable.TUTORIALS`), in the order a new trainer meets them.
Each pays **200 carrots** the first time through, and finishing every one of them pays a
**Scout Pass** on top, once (`Stable.completeTutorial`, `tutorialsAllDone`).

| Tutorial | Where | What it teaches |
|---|---|---|
| Race Basics | a race (`shell.js`) | her hand, spirit, and the Callout on a dead hand |
| Exhibition | the stable and pre-race sheet | the two modes, passives, courses, 5 stamina, the gate draw |
| Deck Building | the Decks screen | 15 cards, two copies at most, kinds, and "Let her decide" |
| Scouting | the scout | the two scouts, tickets and passes, unlocking, copies and passives |
| Career Mode | a demonstration career | the turn screen, training, goals, and the two scenarios |
| Dream Rules | a whole-deck race on the Mile | the whole deck in reach, and calling in the run-in |
| Rivalries | a race on the Mile where she is sure to meet one | what triggers a rivalry and what the clash does |

The three race ones run on `Game.startTutorialRace(opts)`: `fullDeck` for Dream Rules, and
`forceRival` for Rivalries, which pairs her with the nearest runner at 70% of the trip (the
last third, so it is the Zone). The others drive the screens (`tutorials.js`).

How a step works, in both coaches:
- **Every step ends on the player's click.** Nothing moves on by itself: not the last line,
  and not a step that waits for something in the race.
- **Waiting for an event.** A step can wait for something real to happen: `cardPlayed`,
  `callout`, `runIn` (the Dream run-in, signalled by the whole-deck panel), `rivalry` (sent
  when her clash's cutscene ends), `trained`. Until it happens the race runs. When it does,
  the race holds on that moment and asks for the click. A `timeout` only offers the click
  early, so a step can never strand anyone.
- **Spotlights.** A step can ring a UI element with a gold ring.
- **The Callout is held** in a tutorial race (`G.calloutLocked`, `Game.lockCallout`) until
  the step that asks for one. Otherwise a player could spend both before the lesson and
  leave that step with nothing to wait for. The button says why it is held.
- **Cutscenes.** While a cutscene has the screen, the coach steps aside (`body.in-cut`).
- **Order matters.** Anticipate first, pay off after: an early draft had Tazuna say "There,
  she spent one" *before* the card was played.

### Quests, trainer tasks and awards

The notice board (`quests.js`, drawn by `questsBuild` in `ui-meta.js`) has four tabs, each
with its own count of rewards waiting; **Claim all** takes only the tab in front of you.

| Tab | What is on it | Resets |
|---|---|---|
| Daily | 14 quests from a normal day: races, wins, top threes, both exhibition modes, career turns and races, a scout, a Callout used well, a rivalry, a deck, the academy; and **Busy day** for claiming 8 of the others | midnight |
| Weekly | 18: win, race and podium counts, Dream week, a G1, a career and a Dream Trophy run finished, 60 training turns, scouting, a duplicate and a passive, Callouts, rivalries won, decks, the academy, 30 dailies claimed, and a tutorial while any are left | Monday |
| Trainer tasks | **First steps** (ten one-off tasks for a new trainer) while any are unclaimed, then **39 chains in 10 categories**: Racing, Careers, Dream Trophy, Collection, Scouting, Decks, Race craft, Rivalries, Academy, Dedication | never |
| Awards | **205 medals in 10 categories**, paid the moment they unlock: Racing, Careers, Champions, Collection, Scouting, Decks, Rivalries, Academy, Dedication, Secrets | never |

**Everything goes through one call.** The game reports what happened, `Quests.record(event,
data)`, and `EVENTS` says which counters that adds to, in three bags at once: `life`, `day`
and `week`. Where it is reported:

| Event | From | Notes |
|---|---|---|
| `race`, `raceWin`, `g1Win`, `careerStart`, `careerEnd`, `train`, `champion`, `dreamChampion` | `ui-career.js` | carry `scenario` (`ura` or `dream`) and the race's `place` |
| `exRace`, `exWin` | `index.html` results | `mode` (Normal or Dream), `place`, style and distance |
| `rivalry`, `rivalWin`, `calloutWell` | `index.html` results, career and exhibition alike | won = she beat her rival home; well = a Callout in a Dream race's run-in, or both spent with 6+ cards played |
| `callout` | the Callout button | `runIn` when a full-deck race's Callout lands in the last tenth |
| `scoutCard`, `scoutRacer` | `ui-meta.js` | carry the pull's `results`: new, duplicate, passive unlocked |
| `deckSaved`, `deckAuto` | `stable.js` (`createDeck`, `updateDeck`, `suggestDeck`) | the builder, *Let her decide* and the tutorial all end up there |
| `lobbyRoom`, `lobbyThing` | `lobby.js` | a room walked into (and which dorm room); a thing done (sit, drink, tea, music, a meal) |
| `raceDone` | `index.html` results, career and exhibition alike | the race's facts for the medal case: place, field, margin, her place at the final corner (`G.corner`, two-thirds of the trip), stamina left, course, cards played, Callouts |
| `itemUsed`, `jukebox` | `stable.js` (`payScout`, `useItem`), `ui-meta.js` | a Ticket, Pass or Carrot Juice spent; a track picked |

Some numbers are read live from the stable instead (`ctx().owned`): cards and racers owned,
racers unlocked, passives, fully awakened racers, the top racer level, racers with a deck,
tutorials done (and done this week). The academy's quests only show where the 3D lobby runs.

**Chains.** A chain is one number and a ladder of targets, I to V (`CHAINS`). Tiers are
claimed in order, and one Claim takes every tier reached, so a veteran's first visit is one
click per chain rather than five. What a tier pays is a shared schedule (`TIER_PAY`: 100,
250, 500 and a Scout Ticket, 1,000 and two, 2,000 and a Scout Pass) times the chain's
`weight`, so every ladder pays more at the top. Where a chain counts what an award already
counts (wins, URA titles, cards), its ladder starts above the award.

**The medal case.** Awards are one-off feats rather than counts (`AWARDS`, filed by
`AWARD_CATS`): streaks, margins, comebacks from the final corner, every exhibition course,
wins in the rain and the snow, on every going and in every season (a career race's turn
weather, `Career.weatherOf`, reaches `raceDone` through the race config),
both exhibition rules; a career's own feats (unbeaten, G1s in one run, all five stats); every
racer's URA Finale and Dream Trophy, 52 titles, shown as one tile a racer; the binder by
rarity and kind, the stable by stars, outfits, the purse; lucky scouts; deck shapes (seven
pairs, one kind, all six); twelve rival pairs the game writes lines for (`rivals.js` `vs`);
every academy room, dorm room and thing to do, and the jukebox; clean sweeps of the boards;
and eleven **secrets**, "???" with a hint until earned. What they read is in `life.feats` (a
key per feat) and `life.best` (best-ever numbers), filled in by `feats()` from the events
above, or live off the stable. The tab has a category row with counts and bars and an
All / To earn / Earned switch. Three toasts at most when many unlock together.

**What it pays** (`validate-economy.js` holds these). A Scout Ticket is valued as any ×1
scout (500) and a Scout Pass as any ×10 (4,500), so Passes are kept for milestones: the URA
Finale and Dream Trophy titles and tier V of a chain. A day's dailies pay 1,140 carrots and a
Carrot Juice, under a URA Finale win (2,500); the week's quests 6,500 carrots plus items; a
whole week of both stays under four racer ten-pulls. Every chain's first two tiers together
come to about 15,500; every tier of every chain about 240,000, which is months. Each medal
pays what its metal says (bronze up to 500, silver 1,500, gold 10,000), the whole case about
180,000, and a new trainer's first week of medals stays under two racer ten-pulls. The
validator also plays a normal day (a career session, five exhibitions, a scout, a deck, the
academy: 55 stamina) and a normal week through, and fails if any daily or weekly is out of
reach; and it plays feats through to their awards.

**Old saves.** Nothing is dropped: the 21 awards, every claim and every counter stay, and the
first six trainer tasks keep their ids as the first steps. A save from before the chains
(`v` 1) is brought forward once (`migrate`): exhibitions were never reported before, so the
account's own race and win counts (`Auth`) fill them in; decks already saved are credited
(the old *Build a deck* task read a counter nothing bumped); every win counts as a podium.
A `v` 2 save gains the medal case (`v` 3): every award it held stays, and each racer's titles
and unbeaten runs are credited from the veterans the legacy keeps (its last 60 careers).
`life.champions` still counts URA Finale wins only; the Dream Trophy's lock reads it.

### Settings and pausing

`settings.js` holds device-level preferences (not account data — switching trainers does
not change how the game presents itself). Reachable from the main menu and inline in the
pause menu, so you can turn something off the moment it annoys you rather than quitting
first.

Every setting is honoured by something concrete; a toggle that changes nothing is worse
than no toggle. Default race speed (1× unless you pick otherwise; saves from before this
default changed had 2× written into them by any change of setting, so theirs goes back to
1× once), skill cutscenes, sparkles/confetti, screen shake,
dialogue speed (including Instant), Callout hints, quit confirmation, music and sound
effect volumes (the field and the crowd are sound effects), and the race caller's
captions. Account actions
live there too: restore defaults, erase this stable, delete the account.

**Esc** or **P** pauses mid-race, as does the `II` button in the top bar. Resume, restart,
settings inline, or quit.

Pausing is not as simple as it looks. Sim time is derived from the wall clock, so the
first attempt — compensating a little each frame while paused — silently failed whenever
the browser throttled `requestAnimationFrame`: almost no frames ran during the pause, the
elapsed real time was never given back, and the race **jumped four seconds forward** on
resume. The paused interval is now settled once, on resume, from the wall clock, which is
independent of how many frames happened to fire.

### Visual language: race day

The interface is dressed as a race meeting rather than a web app. The pass before this one
looked generated — soft gradients, pill buttons, emoji for icons, stacks of differently
coloured buttons — so `theme.css` and `theme-meta.css` were rebuilt from things a
racecourse actually has:

- **Race-card paper under mown turf.** Panels are paper (`--paper`, hairline `--rule`)
  under a header of two greens in broad stripes with a gold underline (`.panel-hd`;
  `.blue`, `.gold` and the dark `.board` are the variants). Headers are sentence case with
  an icon, never shouted in capitals.
- **Block buttons.** `.btn` is a solid face over a hard base edge (`--face` / `--edge`)
  that it presses down onto. One green action per screen and the rest `.ghost`; colour
  only where it means something (Rest blue, Recreation pink, Equip blue, Delete red, the
  Callout red).
- **The tote board.** Anything that is a result or a running number sits on `--board`
  with amber `--led` digits: the race clock, the exhibition result (`.rb` + `table.tote`),
  the career result (`.res-top` + `.res-board`), the ending's totals, the inheritance
  preview. On a phone the board drops to place, name, time and margin.
- **Three faces.** Dela Gothic One for display (titles, names, headings), M PLUS Rounded
  1c for interface text, Barlow Condensed italic for every number — stats, times,
  placings, costs (`.num`).
- **Gate colours.** `--w1`…`--w8` are the eight saddle-cloth colours; a racer's number is
  shown in her gate's colour on the home screen, starter cards and her racer page.
- **Grades.** Letter grades (`.g .gS` … `.gG`) colour stats and aptitudes the same way on
  every screen. Race grades wear the JRA's colours: **G1 blue, G2 red, G3 green, OP
  orange**, Debut purple.
- **Pixel icons, no emoji.** Emoji render differently on every machine and were the
  quickest tell. `icons.js` draws each icon as crisp SVG runs; glyphs drawn in
  `currentColor` (`back`, `check`, the skill glyphs) take the colour of their text. Skill
  types are coloured chips with a white glyph — chevrons for speed, a surge for
  acceleration, a cross for recovery, stalls for the gate, swap for lane, an eye for
  observation, a star for passives, a down arrow for debuffs — set in `skills.js` `TYPES`
  as an icon name plus a colour.
- **A real scene behind every screen** via `Bg.layer(role)`, the introduction included:
  Tazuna meets you in the trainer's office. (Her uniform is turf green, so she is never
  put on a turf backdrop — it swallows her.)

Three things that kept biting:

- **Race-only CSS must stay in the race.** `index.html`'s inline styles cover the race
  HUD (`#scr-game`) and its sheet (`#modal`) and are scoped to them. Bare class names
  leaked everywhere: `.rate` repainted the scout's rate chips, `.bar` reached the stat
  bars on the racer page, and an old global `button:hover` turned every home tile navy.
  The deck-card rules (`.dcard`, `.dgrid`, `.tick`, `.fit`) are the only ones shared on
  purpose — the deck builder's card pool uses them. Plain buttons there are styled through
  `:where()`, at zero specificity, so `.btn` and `.pick` win without `!important`.
- **Class names collide across files.** The home cloth's `.gate` was theme-meta's
  full-screen gate overlay; the FX sparkle particle used `.spark` (now `.fx-spark`), which
  made every inheritance spark spin away to nothing; the turn screen's `.cal-turn` restyled
  the career schedule. Search for a name before giving it to something new.
- **Entrances animate with `backwards`, never a base `opacity:0`** — see the note in
  `theme.css`. A row that only becomes visible if its animation runs stays invisible
  whenever it does not.

## The roster: Global launch

`rosterdata.js` holds the **26 racers Umamusume's Global release launched with** on
26 June 2025: the 25 standard trainees plus T.M. Opera O, the limited banner that opened
on launch day. `Racers/` still holds art for ~137 characters; `tools/genroster.js` only
generates the names in its `GLOBAL_LAUNCH` list, so adding a later arrival is one line
there and a re-run.

**Every racer is her real self.** Rarity, aptitude grades (distance, surface and running
style), starting stats, stat bonuses, colour, unique skill and career objectives all come
from GameTora's database, applied by `applyReal` in the generator. To refresh them:

```
node tools/pull-gametora.js     # GameTora's static JSON -> tools/gametora-*.json
node tools/genroster.js         # -> race/rosterdata.js and race/careerdata.js
```

`gametora-launch.json` is each character's original card; `gametora-career.json` is the
URA Finale calendar and every racer's objectives. Only facts are kept -- names, numbers,
conditions -- and every description in the game is our own wording.

- **stats** are her starting stats at her real rarity, x10 onto the sim's 0..1200 scale,
  so a 3-star arrives stronger, as on a pull in the game;
- **growth** is her stat bonuses: every card's add to 30%, and 0.88 + 2% per point keeps
  the roster's average growth at exactly 1.0 (Taiki's +20% speed is 1.28);
- **running style** is her best real strategy grade; where two tie (Special Week is A
  as a pace chaser and as a late surger) the authored preference breaks it.

What the game has no equivalent for is ours: personality, passives and the blurb, in
`roster.js` for the exhibition eleven and `DESIGN` in the generator for the rest.
Passives are still derived from a hash of the name, so regenerating moves nobody.

An older save can own, unlock or equip someone who was cut. `Stable.load()` forgets
those racers and re-homes their decks like any other orphaned deck; cards are owned
separately and are not lost.

Rarities are Global's star tiers: ten 3-star, eight 2-star, eight 1-star. The five
starters are all 1- or 2-star, so the 3-stars are what the scout is for: Sakura Bakushin
O (a front-running sprinter), El Condor Pasa (a miler at home on dirt), Vodka (a late-
running miler), Gold Ship (a closing stayer) and Haru Urara (a dirt sprinter) -- every
running style, every distance, and dirt. Three of them are not among the eleven
hand-authored racers, so exhibition offers any racer the account owns and runs her
against those eleven (`fieldFor` in index.html), keeping the field at eleven.

**Stamina** works like the real game's TP (`STAMINA` in stable.js): a bar of 100 that
refills a point every four minutes, or all at once for carrots.
- **A career run costs 30.** It's paid once, when the run starts, so a run is never
  stranded halfway.
- **An exhibition race costs 5,** charged as each one starts: "To the gate", "Race
  again", or Restart from the pause menu (`startExhibition` in index.html). The price is
  on the button, so it asks no confirmation. Without enough stamina the race doesn't start
  and a note says so.
- The tutorial race and the races inside a career cost nothing.

**Passives** come from duplicates, not levels. Each racer has up to three, unlocked by
scouting her again (`PASSIVE_THRESHOLDS` in stable.js): a 3-star after 1, 3 and 6 copies,
a 2-star after 2, 5 and 9, a 1-star after 3, 7 and 12, since commoner racers turn up more
often. The racer scout can't be aimed at anyone. It offers the account's unlocked
racers (the five starters, plus whoever finished careers have opened up), new ones first
at the rarity it rolls. Once all three passives are unlocked, further copies refund carrots.

The stable keeps the count, and every race reads it: a career through `Stable.saveFor`,
an exhibition for the racer you enter. Exhibition used to build her from its own save
(level, XP and deck only), so she raced with no passives at all. Exhibition opponents
still race without theirs.

### Scouting

Two scouts on one screen (`UIMeta.scoutBuild`): **cards** (×1 for 100 carrots, ×10 for
900, the tenth an R or better) and **racers** (×1 for 500, ×10 for 4,500, the tenth a
2-star or better). Pulls are `Stable.scout(kind, n, pay)`.

**Scout Tickets and Scout Passes** are free scouts, told apart by size rather than by
scout: a **Scout Ticket** is one free ×1, a **Scout Pass** one free ×10, each on
whichever scout you spend it. `ITEMS` carries the size (`scout: 1 | 10`) and `SCOUT_ITEM`
maps a size to its item. The ids, `cardTicket` and `racerTicket`, are older than that
rule (they once meant a card ×1 and a racer ×1) and stay so saves carry over. A Pass is
worth up to 4,500 carrots on the racer scout, so it is the bigger reward.

**What a button spends is on the button**, and is never changed behind it. Each scout
button carries `data-pay` ("carrots" or "item") through to `Stable.scout`, which refuses
an item scout when the item is gone (*You have no Scout Tickets left.*) instead of
quietly charging carrots. The screen is rebuilt the moment a scout is paid, under the
reveal, so a spent Ticket's count and button are gone at once. One scout runs at a time,
so a double tap cannot start a second, and the buttons that charge carrots come first
and never move: when the last Ticket goes, its button goes, and nothing slides into its
place. "Again" under the results offers the same size both ways, carrots first.

**The reveal** (`scoutfx.js`) follows the real game's gacha, whose tells Altema, GameWith
and Game8 document: each one can only ever be good news. Everything is built in voxels
with the race's own kit (`Voxel.kit`), and the words are ours.
- *Racers*: the academy door, plain, or trimmed in gold with a horseshoe across it only
  when a 3-star is in the gate. It opens on the course at night: the gate under a pink
  sign whose line reads the best racer inside (*Anyone's race.* / *A favourite in the
  gate.* / *Clear of the field.*). The gate is silver, then steps up to gold and to the
  rainbow (the eight saddle-cloth colours) as far as the best of them warrants. The doors
  spring and the pulled racers, their own voxel models, run at you. Then each racer in
  turn: a 3-star gets a cut-in with a line of her own (`Lines.line`), a new racer *Joins
  your stable* with her blurb, and a duplicate says what it did.
- *Cards*: an album on a desk by a window, by day, or at night when the pull holds more
  than one Epic. The horseshoe on its cover is plain, or the rainbow when an Epic is
  inside. The cover opens and the pages turn, and a sticky note in them steps up from
  silver to gold and to the rainbow. The cards are dealt face down, each back edged in its
  own rarity, and turned over in order, with the Epics last and alone.
- A ten ends on a five-by-two results grid in the order they came out, New marked; a
  single ends on its one result. A tap moves on one beat. Skip (or Escape) goes to the
  results, but, as in the real game, it still stops on each top-tier pull not yet seen.
- The system's reduced-motion setting opens straight on the results. "Sparkles and
  confetti" governs every sparkle, confetti and flash here, and "Screen shake" the shake.
  Without WebGL the gate is drawn flat in CSS, with the same sign and step-ups, and the
  album is skipped. On a touch or low-core device the scene renders at 1.25x, as the race
  and the lobby do.
- Sound: the scout screen's own theme from the game (am220, *A Gathering of Shining
  Characters*) plays under the reveal. The gamerip names no cue as the gacha's pull or
  rarity stings, so none were added rather than guess.

The tells are honest by construction: every colour, sign line, door and note is set from
the pull itself, and a step up stops at the best thing in it.

### Her career is her own

Career mode runs the **real URA Finale calendar** (`careerdata.js`): all 404 races of the
three years from G1 to Pre-OP, each on its real date, at its real distance and on its
real ground, paying its real fans by placing and asking its real fan count to enter.
And each racer has **her real objectives**, in order, as the game sets them -- Taiki
Shuttle debuts on a dirt mile, must finish top 5 in the Shinzan Kinen, the NHK Mile Cup
and the Unicorn Stakes, top 3 in the Mile Championship, then win the Yasuda Kinen, the
Sprinters Stakes and the Mile Championship. Haru Urara instead has to gather 5,000,
9,000 and 12,000 fans before any graded dirt race will matter, then win the JBC Sprint.
Goals come in three kinds -- a placing in one of a set of races (Daiwa Scarlet may take
the Oaks or the Derby), a fan count, and Oguri Cap's "top 3 in two G1s" -- and missing
one by its deadline ends the run.

Races are a choice on any turn they are on: the board opens on training, and **Race
instead** swaps it for that turn's card at no cost. The one exception is her goal race,
which she has to run. Her goal races take her whatever her fan count.

Graded fields are priced below an on-pace trainee (`GRADE_FACTOR`: G1 0.72 of pace)
because real objectives ask for placings from the first year, and the sim's race-to-race
form is wide: a trainee 20% stronger than a field wins it about half the time. The URA
Finale factors were raised by the same ratio, so the finale fields are exactly what they
were. Measured by `validate-career.js` (60 runs per trainer): a focused trainer -- one
who builds toward the longest goal trip in the next dozen turns, races her goal races,
the G1s that suit her and whatever pays when a fan goal is short -- misses a goal in 28%
of runs and wins the URA Finale in 48%; one who tops up her lowest stat misses in 58%.
A run saved before all this keeps the calendar and the four generic goals it began with
(`LEGACY_CAL`, `GOALS`).

**Parents.** A finished run is filed as a veteran (`legacy.js`), and once there are
veterans the step before a career is choosing up to two of them to inherit from. A racer
inherits from someone else: no past run of the trainee herself can be her parent, and the
two parents are two different racers (`Legacy.parentBlock`). Those veterans stay on the
board, greyed and saying why ("Vodka cannot inherit from herself", "Gold Ship is already
her other parent"), after the ones she can take, and clicking one says the same.
`Legacy.inheritanceFor` applies the rule too, so a parent it refuses is dropped whoever
asks and the run files only the parents it really had. Grandparents are not checked: they
come with a parent, and a line may well loop back to her.

### The schedule

**Schedule** on the turn screen opens the three years as a folded fixture list
(`scheduleBuild` in `ui-career.js`, screen `scr-schedule`), so 400 races fit on a screen
or two and the way out is never a scroll away.

- **The bar on top stays put** while the list scrolls: Back, which page is showing (for
  her or all races), Filters, and the jumps: Now, Next goal, Junior, Classic, Senior and
  the finale. **Esc** goes back from anywhere on the screen.
- **A year** is a heading with what she ran and won in it, and **her goals as chips**:
  ticked when met, crossed when missed, a progress bar for a fan goal, "2/3" for a count
  of G1s, and the next one in gold with the turns left. A chip jumps to its race, or to
  the turn a fan goal falls due. A year folds to its heading and chips.
- **A month** is one line while shut: its season and the race it is named by (one she
  ran, else her goal, else the biggest), "+N" for the rest, and flags for a result, a
  goal and now. Open, it lists its two halves with each turn's weather and a line per
  race: grade, name, trip, fans for a win, and a note (suits her, needs 3,000 fans, top 5,
  won). Months with nothing in view fold into one quiet line ("Feb – May").
- **A race** opens to its date and how far off it is, the forecast, the trip against her
  aptitude grades, the fans for every placing, what it takes to enter, her result, and
  why it is a goal.
- **It opens on now**: her current turn marked "now", the next fixture "next up", and the
  months holding them and her next goal open. Past years start folded. **Open all** and
  **Close all** sit at the top of the list; Close all leaves just the years and their goals.
- **Filters**: grade (G1 to Debut), trip, ground, goals only, and races she can enter now
  (her fan count is enough, or it is her goal). Nothing picked in a group means all of
  it. A jump to a goal the filters hide clears them first. The finale always shows.
- What is open, the filters and which page stay for the rest of the session; the open
  months reset for a new run. The Dream Trophy's finale heading is a strip of the board.

### Seasons, weather and the going

Every career turn has a **season** (by its month) and the day's **weather** and **going**
(`Career.weatherOf`). They are drawn from the run's seed, so a turn is the same every
time it is opened, and its race is run in what the turn screen showed.

| | What decides it |
|---|---|
| season | Dec–Feb winter, Mar–May spring, Jun–Aug summer, Sep–Nov autumn |
| weather | clear, cloudy or rain, plus snow in winter. June is the rainy season (tsuyu): rain 45% |
| going | follows the weather: firm on most clear days, soft or heavy on most wet ones |

**What the player sees:**
- **The turn screen.** The calendar names the day ("Winter · Snow · Heavy"). Over the
  seasonal art falls what the day throws up (`weather.js`): sakura petals in spring,
  light motes in summer, red and gold leaves in autumn, rain, snow. An overcast or wet
  day has a flat wash, and the evening half of each month a warm one, since the art has
  no evening shots. The particles are off with "Sparkles and confetti" in Settings, and
  only the washes show to anyone who asks for reduced motion.
- **The race** (`applySeason` in voxel.js).
  - **The course:** the trees dress for the season: blossom, deep green, red and gold,
    or bare branches with snow on them; the conifers keep their needles.
  - **The ground:** the grass goes straw-coloured in winter, darker in the wet, and white
    under snow.
  - **The sky, fog and light:** they follow the weather, and the sun is warm in autumn
    and cool in winter.
  - **What falls:** rain, snow, petals or leaves around the camera, in one batch of
    boxes. There are half as many on a phone, and half again if the frame rate drops.
  - **The header:** it names the day.
  - **Other races:** exhibitions, the title race and the tutorials keep the course's
    own look.

**What it does to the race: the going.** As in the real game (GameTora's race mechanics),
weather acts through the ground (`Sim.GROUND`, from `course.ground`, which only a career
race sets):

| Going | Turf | Dirt | Stamina used |
|---|---|---|---|
| Firm | — | power −100 | normal |
| Good | power −50 | power −50 | normal |
| Soft | power −50 | power −100 | +2% |
| Heavy | speed −50, power −50 | speed −50, power −100 | +2% |

Over 60 races of the exhibition field at 2000m, heavy turf added 0.4s to the winning time
and more of the field ran dry on soft and heavy. The penalties fall on everyone, so
they bite hardest on a racer already short of power or stamina.

**The skills that turn it to an advantage**, the real game's ○ tier (90 skill points, in
`skills.js`, with a `need` that `Skills.applyToDef` checks against race day):
- **The going:** Firm Conditions ○ (+40 power on firm) and Wet Conditions ○ (+40 power
  on good, soft or heavy). These are on offer to everyone.
- **The weather:** Sunny, Cloudy, Rainy and Snowy Days ○ (+40 guts in that weather).
- **The season:** Spring, Summer, Fall and Winter Runner ○ (+40 speed in that season).

The weather and season ones come by hint only (`fit: { hint: true }`). A skill whose
condition does not hold on race day adds nothing.

### The second scenario: The Summit, Dream Trophy

Career setup now offers two scenarios side by side (`Career.SCENARIOS`; the picker shows
each one's rules, price and prize, and remembers the last one picked on the device). A
career started from her stable page asks which. **The Beginning: URA Finale** is
everything above, unchanged. **The Summit: Dream Trophy** is the same three years, the
same real calendar and her same objectives, against the strongest field in the game, and
it ends in the Dream Trophy: the **Invitational**, **Semifinal** and **Grand Final**,
each of which she has to win.

**It opens after three URA Finale wins** (`unlock` on the scenario, checked by
`Career.scenarioLock`). Until then the picker shows it locked, with what it pays still
readable and the progress on top ("URA Finale wins: 1/3"); clicking it, or picking it
from her stable page, says what it takes. The count is quests.js's `life.champions`, which
only a URA Finale win adds to (a Dream Trophy win is `dreamChampions`). The veteran
records are counted too and the larger number wins, so a trainer whose championships
predate that counter is not locked out. A Dream run already under way is never locked
out: it resumes and finishes as normal. The Dream Exhibition stays open to everyone.

**Every race is run with her whole deck** (`FULL_DECK` in ai.js). Nothing is drawn: all
fifteen cards are in reach from the gate, the deck cannot run dry, and spirit is the only
thing that limits what she plays. Spirit stays at 15. Measured (validate-balance, 120 runs
each), 12 flattens the cost bands but leaves the Callout worth a quarter of a place, and
18 drops the all-cost-1 deck to last.

**The Callout changes meaning**, since there is nothing to redraw: hit it and she plays
the card that is right for this moment, read by the trainer rather than through her own
wit, **free**. Same button, same key, two per race. It is a timing call, measured at
parity (probe on the control deck, mean place of 8):

```
probe calls          900 stats   800 / 600 wit
never                   4.53        4.24
at the gate             4.58        4.70     wasted on cards that would have come good anyway
as the final opens      4.06        6.37     she spends pace she cannot afford
in the run-in           2.10        1.87     the last tenth of the trip
```

So the race screen marks the **run-in** (`Racers.callDue`): the button pulses and names
the card; before it the hint says to save it, and inside it says when nothing she has
left is worth calling. The panel shows the cards she can play now in full and the rest as
faces, with why on hover. A one-time tip explains the change on her first full-deck race.

**Her rivals are tougher in three ways** (`raceSetup` in career.js):
- **Stats** 3% above a URA field of the same grade, the finale included.
- **Decks of their own**, built from every card in the game for each rival's style and
  personality (`Stable.rivalDeck`). It uses the Cheap build, which measured strongest once
  the whole deck is in reach: 3.89 mean place against 4.63 for the shared deck URA
  rivals race.
- **A sharper read** (`SHARP` in ai.js): 15% less wit misjudgement, and they spend their
  own Callouts in the run-in. No URA rival ever calls. At parity a sharp field takes a
  probe who calls well from 1.87 to 4.31.

Two more levers were measured and dropped: drawing the racers best suited to each trip,
and giving rivals their passives. Either one on top of these ended about three runs in
four at a goal.

Measured by `validate-career.js` (60 runs per trainer), focused trainer. "Own deck" is her
own pick from a full collection (the build her rivals race with); "starter" is the plain
deck the URA numbers above were always measured on:

```
                                   URA        Dream       URA        Dream
                                   own deck   own deck    starter    starter
goal failures                      10%        38%         28%        88%
champion                           83%        18%         48%        5%
race win rate                      91%        81%         82%        54%
same trainee, same graded race:
  won, Junior / Classic / Senior   86/91/97%  83/89/76%   81/84/94%  50/58/62%
carrots per run (items aside)      2,152      6,023       1,438      2,205
```

So bring a real deck: on a starter's, the Dream Trophy is very nearly out of reach, and the
picker and the opening say so. Over a run her Callouts are worth goal failures 45% → 38%
and the title 15% → 18%.

**The rewards** (`pay` in `SCENARIOS`, paid by `Career.payout`, which the ending screen
grants and the validator reads):

| | URA Finale | Dream Trophy |
|---|---|---|
| failed a goal | 150 carrots | 500 carrots |
| seen through | 800 carrots | 3,000 carrots, 5 Scout Tickets, 1 Carrot Juice |
| champion | 2,500 carrots | 10,000 carrots, 10 Scout Tickets, 2 Scout Passes, 3 Carrot Juice |
| prize money | none | every win on the way: G1 400, G2 250, G3 150, other 60 |
| her level | 400 + rating/12 XP | 900 + rating/6 XP |
| finale fans | 40k / 60k / 90k | 60k / 90k / 150k |

Winning it also unlocks its own award, **The Summit** (5,000 carrots, 2 Scout Passes);
URA Finale's awards still count only URA Finale wins.

**It costs 40 stamina** to URA Finale's 30 (`STAMINA.dreamRun`): the dearer run for the
longer odds and the bigger payout, still two to a full bar. Measured, a focused trainer
on her own deck takes home 151 carrots per stamina in the Dream Trophy against 72 in a
URA Finale, before counting the items.

On screen it wears the tote board, the dark board and its LED amber, where URA Finale
wears gold: the picker's card, the strip under the year on the turn screen, the finale
banner and card, the schedule's finale, the grade reveal and the ending's rewards. Its
finale runs to the URA Finale's own fanfare and music.

**Saves.** A run saved before scenarios existed has no `scenario` and is a URA Finale run:
same field, same rules, same finale. `validate-career-stress.js` replays one, plays every
trainer through both scenarios, and checks full decks stay whole and rival decks are real
cards.

### Exhibition: Normal or Dream

Exhibition has the same two rules, chosen under **Mode** on the pre-race sheet, between
her deck and the course (`EX_MODES` in index.html; the pick is remembered on the device):

- **Normal Exhibition**: as it always was. Five of the fifteen dealt at the gate, and a
  Callout bins the hand and draws five more.
- **Dream Exhibition**: the Dream Trophy's rule, for **every racer in the field**. Each
  has her whole deck in reach, and a Callout plays the card that is due, free. The sheet's
  explanation, the gate card, the top bar's tag and the results board all name the mode,
  and the results note coaches Callout timing (the run-in) instead of dead hands.

It is one rule, not two: `start()` passes `{ fullDeck }` to `Racers.createField` for the
whole field, the same flag the Dream Trophy career passes. Exhibition rivals are not
"sharp" (that is the Dream Trophy career's opponent tuning) and, as in a Normal Exhibition,
never spend Callouts of their own. Everything else is unchanged: 5 stamina a race, her
unlocked passives, rivals on their saved decks or the AI's stand-in, and the tutorial race
is always Normal. `validate-balance.js` section 8 builds the exhibition field the way the
page does and checks both modes deal every racer by their rule and that no full deck is
ever drawn from or lost. With her calling in the run-in she averaged 4.00 of 11 in a Dream
Exhibition against 5.70 in a Normal one (20 races each, her on the control deck).

## Guest racers

Two racers are not horse girls: **Sonic** (SEGA) and **Hatsune Miku** (Crypton Future
Media), visiting the academy. Nothing about them can come from GameTora, so they live in
`guests.js`, hand-written. Each is grounded in their own canon, researched for it:

| | Sonic | Hatsune Miku |
|---|---|---|
| Canon | 100cm, 35kg; "the world's fastest hedgehog"; a free spirit, easygoing, impatient with anything slow, a daredevil, loves chili dogs; the Spin Dash (Sonic 2) and Homing Attack (Sonic Adventure); **cannot swim** ("sinks like a rock") | 16, 158cm, 42kg (piapro.net); "the first sound of the future"; KEI's design in Yamaha-synthesizer blue-green (#39C5BB); a virtual singer on stage; Racing Miku (Good Smile Racing, SUPER GT); SNOW MIKU (Sapporo Snow Festival); a guest racer in *Sonic Racing: CrossWorlds* |
| Racer | Front runner, A from sprint to mile, Reckless; *Spin Dash Getaway*: a burst out of the gate, and again on the final straight from the first three | Pace chaser, A at mile and middle distance, Calculating; *First Sound of the Future*: the crowd calls for an encore on the final straight |
| In the lobby | On the track at every hour, at the cafeteria for meals, away at night (no room in the dorm) | By the hall's jukebox, at lunch, in the library, watching the track; away at night |
| Model | Built by `sonicParts()` in `voxel.js`: a big round head, three quills, the joined whites of his eyes, peach muzzle and arms, white gloves, red shoes with a white strap and a gold buckle; `scale` 0.62 | `LOOKS["Hatsune Miku"]`: knee-length twin tails in black-and-red square clips, a headset, teal tie and trim, detached sleeves, thigh-high boots, the red "01" on her left shoulder; `human` (no horse ears or tail), `scale` 0.93 |

Sonic is A in the sprint, not S. With S he won seven sprints in ten against the exhibition field,
where Sakura Bakushin O (the real game's sprinter) wins about half; at A he wins about half.

How a guest differs from a racer: `guest: true`; `Stable.load` gives every guest to any
trainer who has a racer of her own; the scout never offers them (they are never unlocked)
and the unlock count leaves them out; the stable tile shows a **Guest** tag and where they
are from instead of stars and passives; the title screen's live race uses launch racers
only. Credits: Sonic the Hedgehog is SEGA's (SEGA has said it is fine with non-monetised
Sonic fan games); Hatsune Miku is © Crypton Future Media, Inc. 2007, used under the Piapro
Character License, which allows non-commercial fan works.

## Post Parade Adventure 2

The arcade cabinet against the hall's right-hand wall, by the dorm doors (Adventure on the
dock): a side-on platformer in the race's own voxels -- the same mesher, racers and light,
seen from the side -- for Sonic and twelve of his friends, rivals and enemies. Thirteen
stages run left to right to a winning post, each one runner's own ground, the way Sonic
Battle gives each fighter a home arena (Emerald Beach for Sonic, Tails' Lab, Amy's Room, the
Chao Ruins on Holy Summit for Knuckles, Club Rouge, Battle Highway for Shadow, and for the
rest the places their own games put them) -- each built here as a place of its own, with a
name of its own, not as those arenas. They are long and tall the way the Genesis and Game Boy Advance acts
are: measured off Sonic Retro's full maps, Sonic 1-2's acts run 8,000-13,000 pixels by
1,000-2,000 and Sonic Advance's 7,000-13,000 by 1,300-2,900, which at Sonic's size is 200-330
metres by 25-75; the runners here are quicker, so these run 540-610 metres, 32 high, with a
low road, a high road and the sky over both, five or six furlong poles each, and take a
couple of minutes a first time:

| # | Stage | Whose | Where | What it adds |
|---|---|---|---|---|
| 1 | Seabreeze Cape | Sonic | green turf on white chalk clifftops, the open sea below; headlands, sails and a torii on a rock out in the bay | the stage it was (dash strips, a boardwalk cove, the chalk cave, the sea crossing) with high roads over it, then a run up the headland, a second cove of sliding planks, three springs up the cliff, dash strips along the top; Gami Gami, Rhinotank, Stinger, Kiki |
| 2 | Workshop Airstrip | Tails | his workshop on the airfield: hangars, the control tower, wind turbines turning, his planes going over, the sea beyond | conveyor belts, the hangar (a catwalk over the floor, the roof above, fans up through it to a sky route), the runway's dash strips and barriers, fan pits, a lift tower, the assembly line; Star, Senbon, Oct, Mogu |
| 3 | Rose Parlour | Amy | her home seen from the floor up: pink rug on the floorboards, papered walls, the bed, a dresser and its heart mirror, bookcases, windows on the city, fairy lights | stacks of books to climb, shelves with gifts to smash, cushion springs, heart balloons up to the wardrobe top, toy blocks to knock down, a fish tank, the window seat, the bed's springs; no pits; Bu-bu, Gao-gao, the Guards in threes, Piko-piko |
| 4 | Guardian Peak | Knuckles | snow on black volcanic rock; old carved shrines stepping up the slopes; a light on the summit | walls of cracked rock, cliffs to climb (ledges up them; Knuckles climbs the face), ice, a cave under the snow, shrine pillars to hop over chasms, crumbling ledges, a passage under a shrine, the summit shrine; Pen, Leon, Wamu, Yukimaru |
| 5 | Diamond Club | Rouge | her street after midnight: casinos lit in neon, signs in the four suits, searchlights, a full moon; her club at the end under a neon heart | velvet ropes, neon balconies, pinball pits crossed on bumpers, balloons to the rooftops, vaults roofed in cracked rock (drill down into the treasure), the fountain plaza; Pierrot, Mirror, Slot, Hanabii |
| 6 | Sundown Expressway | Shadow | the road out of the city at sundown: towers against the sun, a raised road behind with its traffic | barriers, dash strips, ramps onto the embankment and a broken bridge to jump, a canal under the junction, a long girder overpass with a road above it, the toll plaza, three last jumps; Akatento, Aotento, Condor |
| 7 | Petal Hall Museum | Cream | a natural history hall: a floor of marble squares, arched windows full of daylight, banners, dinosaur skeletons on their plinths, cases of fossils, a whale hung from the ceiling | velvet ropes, a long-neck's skeleton to climb (its ribs are ledges, its back a bridge), the fountain court, galleries reached by the gift shop's balloons, a spring and a heating vent's warm air, trolleys rolling over the stair-well, the hall of cases, the grand stair; Snail Blaster, Motobug, Butterdroid, Buzz Bomber |
| 8 | Moonwell Springs | Chaos | springs under an old shrine at night: clear water, mossy carved stone, stone lanterns, waterfalls down the cliffs, the shrine at the top of its steps, fireflies, the moon | pools with stepping stones (and steps under the water to climb out), the drowned passage under the terrace with its air vents, crumbling stones up the terraces, lifts over the lily pools, the waterfall's spray, the reed beds, the long lake; Crabmeat, Orbinaut, Jawz, Chopper |
| 9 | Redstone Canyon | Mighty | canyon country: sand over red rock in bands, mesas and buttes, cacti, the sun high | mesas to climb, cactus spines (curled up, Mighty doesn't feel them), cracked lids over caves to smash through, quicksand, mine planks sliding over the chasm, the slot canyon and its chimney, the gulch; Rhinobot, Spiny, Asteron, Motobug |
| 10 | Cinder City | Silver | his city two hundred years on, burning: broken towers lit by their fires, a red sky, embers falling, rubble hanging in the air in his light | the fires' hot air up to the broken overpass, rubble and ledges that give way over the fallen tower, the burning avenue, the sunken metro, the square, the collapsed underpass, the last bridge; Rhinotank, Grounder, Spinner, Electro Spinner, Klagen |
| 11 | Iron Hold Depot | Chaos Gamma | a storage depot deep in Eggman's hideout: racks of crates three high, steel striped for the forklifts, banners, lamps hanging on chains | belts both ways, crates to break and climb, low aisles under the racks where Grabbers hang, lifts, catwalks of grating, the cold store, the press line's hot plates, the sorting floor, the loading bay; Crawl, Grounder, Grabber, Rhinobot |
| 12 | Comet Circuit | Metal Sonic | a racecourse out among the stars: dark track lit blue and white, lane lines, gold rails, a ringed planet, a nebula, grandstands, rocks drifting by | dash strips everywhere, jumps over open space, the bumper chicane under the rails, planks gliding over the void, the back straight, the hairpin, the last lap; Orbinaut (gold), Crawl, Nebula, Balkiry |
| 13 | Egg Orbital | Dr. Eggman | his station in orbit, the last stage: hull plating with warning stripes, consoles, great windows on the world turning below, warning lights going round | the factory floor's belts and hot plates, lifts and collapsing walkways over the reactor shaft, the gallery under the windows, the laboratory's bumpers, the hangar, the observation deck, the gangways to his bridge; Slicer, Crawl, Metal Spinner, Electro Klagen, Grabber |

The stage list shows each stage's runner beside it. Seabreeze Cape keeps its first 224 tiles
as they were; the next five took the places of Academy Hills, Riverside Run, Sapporo
Snowfield, Nakayama Grand Jump and Red Rock Quarry, and Seaside Camp went (the cape is the
seaside now). The old stages' text is kept outside the project, in the extras folder. The
last seven are new: each opens when the one before it is cleared.

**The cast is thirteen, drawn in 2D:** Sonic, Tails, Knuckles, Amy, Rouge, Shadow, Cream,
Chaos and Chaos Gamma, each in their own sprites from SEGA's *Sonic Battle* (Game Boy
Advance, 2003), ripped by QuadFactor for The Spriters Resource (the sprites are SEGA's and
Sonic Team's); and Dr. Eggman, Metal Sonic, Mighty and Silver, who are not in Sonic Battle, in
sprite sheets drawn in its style by TheKnucklesMainG4 on DeviantArt
([Eggman](https://www.deviantart.com/theknucklesmaing4/art/Dr.-Eggman-%28Sonic-Battle%29-Sprite-Sheet-896689723), [Metal Sonic](https://www.deviantart.com/theknucklesmaing4/art/Metal-Sonic-Sprite-Sheet-911313604), [Mighty](https://www.deviantart.com/theknucklesmaing4/art/Mighty-the-Armadillo-Sprite-Sheet-935708034),
[Silver](https://www.deviantart.com/theknucklesmaing4/art/Silver-the-Hedgehog-%28Sonic-Battle%29-896294717); free to use with credit, never to be claimed as anyone else's).
`tools/pack-sonic-battle.py` (local; the full sheets are in `tools/art/sonic-battle/`)
names every animation by its sheet's own rows -- idle, run, skid, jump, fall, landing, the
dash, the 1st/2nd/3rd attacks, the heavy, upper, dash, air and aim attacks, the shots,
powers and traps and their effects -- and packs only those onto one transparent atlas per
runner, `assets/guests/sb-<who>.png`, writing the frame tables into `adventure-sprites.js`.
Sonic's mine (Sonic Cracker) tumbles as it settles, then sits armed, blinking black, blue and
white, till something sets it off.
A body frame is anchored at the feet and centred on the head, so nobody wobbles from pose to
pose; an effect is anchored at its middle. A runner stands in the voxel world as a flat card
at a thirtieth of a metre to the pixel (Sonic about 1.1m), crisp, mirrored to face the way
they run, casting a shadow of their own shape and tinted to the stage's light. A card shows
its frame by its own UVs, so all of a runner's cards share one texture. The menu's cards are
their Sonic Battle portraits, the ones each sheet draws with a white outline. Each sheet's
address carries a fingerprint of the picture (`sb-sonic.png?v=...`), so a browser holding an
older sheet fetches the new one rather than cutting new frames out of the old layout.
Everywhere else in the game Sonic is still the voxel Sonic.

**The fighting is Sonic Battle's.** That game puts every attack on B (a three-hit combo;
direction + B for the heavy and upper attacks; B while dashing, in the air, or chasing a
knocked-back foe for the dash, air and aim attacks) and its specials on R (a shot, a power
or a trap, one slotted for the ground and one for the air before each match). Here they are
three buttons, with all three specials always to hand:

| Button | On the ground | In the air |
|---|---|---|
| **Z**, light | the 1st, 2nd and 3rd attacks, a combo | the air attack (Shadow: his Homing Attack, if anything is near) |
| **X**, heavy | the heavy attack (it also ends a combo); **Up + X** the upper attack; **Down + X** the aim attack, a dash at the nearest thing and a blow; while dashing, the dash attack | the air attack; **Down + X** the aim attack |
| **C**, special | the shot; **Up + C** the power; **Down + C** the trap, and again to set it off | the air shot, power and trap |

A double tap of a direction is the runner's own dash (Sonic Dash and Tails Hop are hops,
Knuckles' cannot steer, Shadow's leaves him unseen). Down crouches (the landing frames, as
the sheets have no crouch); Down + Space is a Spin Dash for everyone but Rouge (tap Space
to rev, let go of Down; for Rouge it does nothing), or drops through a plank. Only Sonic's
sheets draw one -- Sonic Advance's rev (twelve frames of the ball squashing and flaring its
spikes) and Sonic Battle's roll (Sonic Meteor) -- so the others spin his in their own colours:
Sonic Battle's palettes line up, his four blues where they keep their own main colour, and
the packer swaps them colour for colour (Knuckles' shoes go to his green, Tails' muzzle
white). A rev kicks up Sonic Advance's dust spray behind the runner, swelling as it builds
(each tap of Space puffs it), throws sparks once it is hard, and leaves a dust puff on launch. A jump
out of a Spin Dash or a roll stays that ball and hurts what it touches; any other jump is
the runner's own jumping and falling frames. Knuckles' climb comes from *Sonic Advance*
(Game Boy Advance, 2001; ripped by AsuharaMoon, the sprites SEGA's, Sonic Team's and Dimps'),
`tools/art/sonic-battle/knuckles-advance.png`, and the rev, dust, sparks, flare and air
crescent from its Sonic sheet, `sonic-advance.png`: their palette is Sonic Battle's rounded
another way, so the packer maps them colour for colour.

**Sonic Wave hits like a sonic boom.** Sonic spins in place, a turn at first and then a blur
(half a second), the dust spray growing behind him, sparks flying and a whine rising; then
the blast goes, with Sonic Advance's white-gold flare and a see-through crescent of air at
his front, a flash, a jolt through the picture, and a shockwave -- see-through, because it is
air breaking the sound barrier -- tearing along the ground at 28 m/s for about fourteen
metres, trailing air. It throws him back a metre, braced in his braking pose. Sonic Storm is
the same from the air, angled down.

**Every special lands with weight.** While a move winds up, energy of its colour gathers in
to a rising note: to the runner's hand, or, for Tails' Energy Ball and Rouge's Beauty Shock,
to the mouth of his cannon and to her pointing hand (measured off the frame each fires on),
from the frame the cannon or hand is there, a glow swelling at it as it fills. The release
flashes that colour, jolts the picture and, for the shots, pushes the runner back; Tails'
and Rouge's blow their sparks out of the muzzle the way the shot goes, rather than up in a
spray, and the shot leaves from it. The heaviest (Deep Impact, Chaos Burst, Major Eruption,
the Big Hand, Silent Size) freeze the world for a few hundredths of a second. Shots fly
faster and bigger and leave a trail of their colour -- Tails' Energy Ball at 20 m/s,
Shadow's Chaos Spear at 30, Amy's Pink Typhoon and Rouge's Beauty Shock see-through (wind
and sound) -- and each hit flashes and catches for an instant. Knuckles' specials raise no
dust and throw no bits: his rocks, Deep Impact, Major Eruption and Mole Bomb land on their
light, the jolt and the freeze alone. Sonic Meteor and Spiral Dive come down in dust; Girl
Tornado whirls wind round Amy; every trap goes off in Knuckles' Deep Impact explosion. Each
move's colour, flash, jolt, recoil, freeze and muzzle are in `SPECIALS` in `adventure.js`.

**Every blow lands too.** When a jab, heavy, upper, dash, air or aim attack connects, a hit
spark -- an eight-pointed star in the runner's colour round a white heart -- pops where it
met, with a flash; the picture stops dead for a few hundredths of a second and jolts, the
jabs briefly and the finishers (the third jab, the heavies, the upper, the dash and aim
attacks) longest, while what was hit shows pure white. Then it is thrown, tumbling, the way
the blow sends it (an upper straight up), and bursts where it hits something or a moment
later. Knuckles hits hardest of the six, and Amy's hammer blows land like a hammer. A blow
that meets something in its wind-up lands there and then, so a heavy's step never carries
the runner into a hurt; the aim attack's dash does the same. A Spin Dash, roll or Homing
Attack that hits throws its mark the way it was going, a stomp sparks underfoot, and a
special's blast throws what it hits away from it. Each blow's freeze, jolt, spark and knock
are in `HITS` in `adventure.js`.

| | Moves in the platformers | Its Sonic Battle set |
|---|---|---|
| Sonic | the fastest; Spin Dash (Sonic 2); **Sonic Ballet**, Space again in the air: a second jump, or a Homing Attack (Sonic Adventure) at anything near | Sonic Punch, Sonic Kick, Top Kick; Sonic Flare, Sonic Updraft, Windmill, Sonic Rocket, Sonic Eagle; Sonic Wave (a shockwave along the ground) / Sonic Storm; Sonic Drive (throws a ring, spins after it) / Sonic Meteor; Sonic Cracker, a landmine |
| Tails | **flies** (Sonic 2 & 3): Space again in the air, tapped to climb, until he tires after about five seconds; under water the same stroke swims; Spin Dash | IQ200, IQ300, IQ400; Magic Hook (the longest reach), Magic Upper, Tails Cyclone, Typhoon, Tails Dunk; Energy Ball; Flick, a Big Hand; Chu² Bomb, which crawls after its mark |
| Knuckles | the slowest and lowest jumper; **glides** with Space held in the air, breaking cracked rock it meets; a glide into a wall grabs it, and Up and Down **climb**, over the top when it ends (Sonic & Knuckles), pulling himself up; Sonic Battle draws no climb, so the grab, cling, climb and pull-up are Sonic Advance's, ripped by AsuharaMoon, in his Sonic Battle colours; Spin Dash | Knuckles Straight, Chop, Upper; Megaton Hook, Enrage, Double Punch, Air Hook, Meteor Punch; Rock Free Fall, a lobbed rock / Meteor Crush; Deep Impact, an explosion / Major Eruption (dives, burrows, bursts out); Mole Bomb, a landmine you can barely see |
| Amy | **Double Jump**; her Piko Piko Hammer: **Up + X** swings her into a **Hammer Jump** (Sonic Advance); Spin Dash | Girl Jab, Straight, Upper; Girl Crush, Girl Swing, Girl Bomber, Air Girl Crush, Girl Dunk; Pink Typhoon, a tornado along the ground; Girl Tornado; Gift |
| Rouge | **flies** a short while on her wings (Sonic Heroes), then glides down slowly as in Sonic Battle; Down lets go (Rouge Catch) | Rouge Kick, Side Kick, Sobat; Charlie Kick, Secret Kick, Secret Spear, Agent Eagle, Homing Cutter; Beauty Shock, short; Silent Size / **Spiral Dive**, which drills down through rock (Sonic Adventure 2's Drill Drive); Bat Cracker, a bat mine that hunts |
| Shadow | the fastest in Sonic Battle, skating on his Air Shoes; **Chaos Control**: Space in the air teleports him a few metres on, twice a jump, drifting down; Homing Attack; Spin Dash | Shadow Chop, Kick, Back Kick; Chaos Nightmare, Chaos Upper, Shadow Slider, Shadow Rocket, Shadow Eagle; Chaos Magic, the Chaos Spear (held, it flies further); Chaos Burst / Air Chaos Burst (drops, then bursts); Roaming Chaos, which circles him |
| Cream | the highest jump, a slow skipping run; **flies** on her ears (Cream Ballet; Sonic Advance 2), Space again in the air, tapped to climb, till she tires; Spin Dash. Cheese the Chao does all her fighting, out in front of her | Chao Arch, Chao Winder, Chao Salom; Chao Tornado, Chao Upper, Chao Dash, Chao Circle, Chao Dunk; Chao Cannon, Cheese charged with energy and flown at what's ahead; Chao Rush, a whirlwind round Cheese; Cream Cracker, an Omochao that flies off to hunt and bursts |
| Chaos | the slowest run; the Spirit of Water (Sonic Adventure): **swims**, a stroke for every Space, and never needs air; Chaos Flight, a little more height; a double tap melts him into **Chaos Dive**, along the ground where nothing touches him | Stretch, Elastic and Flexible Chaos; Chaos Double Stab, Upper Chaos, Chaos Dolphin, Chaos Rocket, Chaos Impact; Chaos Shot, a ball of water; Chaos Crush, his arm along the ground (from the air, a column of water); Chaos Splash, a puddle that throws up tentacles |
| Chaos Gamma | walks slowly; a double tap is **Drive Mode**, fast and steerable for as long as the direction is held; **Flight Mode** in the air, sinking slowly | Solid Knuckle, Electric Stab, Paralyze Cut; Electric Shock, Upper Electric Shock, Buster Drill, Air Electric Shock, Air Knuckle; **Devastator**, which charges while C is held (the charging frames only while it is held) and lets go far bigger; **Meltdown**, his reactor going up, which costs him a heart; Blinker, a mine |
| Dr. Eggman | in his **Egg Mobile**, a hovercraft, floating off the ground with its shadow under it; **Egg Hover**, Space in the air: held up a while, then sinking slowly (Down lets go) | Egg Fist, Spike Jab, Egg Driver; Wrecker Swing, Upper Fist, Hidden Drill, Wrecking Ball, Fist Piledriver; the Death Egg Cannon, a ball of fire; Missile Launch, a missile that goes off where it hits; Bomb Drop, a bomb out of the bottom, its fuse lit |
| Metal Sonic | built to outrun Sonic (Sonic CD), the second fastest; his **jet** in the air, a burst ahead and a moment's hover; Spin Dash | Metal Jab, Swipe, Kick; Electrical Discharge, Electric Upper, Fireball Crash, Metal Rocket, Metal Eagle; Electric Bolt; **Black Shield**, a crystal round him that nothing gets through and that breaks what it meets; Plasma Grenade, thrown |
| Mighty | strong; **Shell Launch**, Space in the air, straight up and curled; against a wall, a **wall jump** off it (Knuckles' Chaotix); curled, spikes and thorns can't hurt him (Sonic Mania Plus); Spin Dash | Mighty Punch, Kick, Hook; Explosive Punch, Mighty Uppercut, Mighty Chop, Mighty Rocket, Axe Sledge; Mighty Cyclone, a tornado along the ground (a ring of fire from the air); Hammer Spin, three times round; **Hammer Drop** (Up + C in the air), straight down through cracked rock, a shockwave both ways where he lands; Peacemaker |
| Silver | psychokinesis (Sonic '06); the **Air Psycho Dash**, Space in the air: ahead, a hover, and then Space held floats him down; Spin Dash | Silver Punch, Jab, Kick; Psycho Shock, Psycho Upper, Silver Bash, Silver Rocket, Psycho Crush; Psycho Knife, gone in a moment; Psycho Surge, a whirlwind round him; Psycho Orb, sent ahead to hang in the air, one at a time |

Everyone sinks in deep water and has sixteen seconds of breath unless they find an air
vent's bubbles, as in the classic games; only Tails swims (by flying), and Chaos, who is
water. Every jump clears two metres (Knuckles' and Chaos's only just). Run speeds follow
Sonic Battle's ratings (Shadow 8, Sonic 7, Tails and Amy 6, Rouge 5, Cream 4, Knuckles 3,
Gamma 2 walking, Chaos 1, of 9); Eggman, Metal Sonic, Mighty and Silver, who are not in it,
are set by their own games (Metal built to outrun Sonic, Mighty and Silver about Amy's,
Eggman a little quicker than Rouge). Sources: Sonic Center's Sonic Battle character FAQ and
the Green Hill Zone's Sonic Battle page for the moves; TheKnucklesMainG4's sheets for the
four not in it; Sonic Retro, StrategyWiki and Wikipedia for the platformers.

**The badniks** are Eggman's robots from *Sonic Advance*, *Sonic Advance 2* and *Sonic
Advance 3* (Game Boy Advance), in their own sprites from the Badniks sheets ripped by
SpitfyaUK and Techokami, Fatazz and SkyLights (The Spriters Resource); the sprites are
SEGA's, Sonic Team's and Dimps'. `tools/pack-badniks.py` (local; the sheets are in
`tools/art/sonic-advance-badniks/`) cuts the frames of the twenty-three the stages use onto
one atlas, `assets/guests/badniks.png`, each frame anchored where it stands. Each does what
Sonic Retro says it does in its own game: Gami Gami walks sideways and fires a ball from
each claw; Rhinotank charges what it sees ahead; Stinger, Oct and Slot fly to and fro and
stop to fire at you, straight down, or drop a coin; Kiki lobs bombs and Guards fire them
from their trumpets; Hanabii launches fireworks that burst overhead; Yukimaru and Pen throw
snowballs; Leon shoots out its tongue and Piko-piko brings down its mallet, close up; Mogu
hides in its hole and pops out; Aotento lifts off when you come near and Condor dives at you
from above. Some cannot be hit every way: Senbon's spikes, a spinning Star and a shut Mirror
hurt whatever touches them, so wait till they open; Pierrot's ball and Gao-gao's face take
any blow, so jump on them or come in curled (or from behind); a blast (a special) beats them
all. Beaten, a badnik goes up in Sonic Advance's puff of smoke and leaves a carrot.

The last seven stages have the badniks of TheKnucklesMainG4's
[Modern Sonic Badniks](https://www.deviantart.com/theknucklesmaing4/art/Badniks-Sprite-Sheet-%28Modern-Sonic-Generations%29-914913506) sheet (DeviantArt), the classic ones and the later
ones drawn as one set; `tools/pack-badniks.py` cuts the twenty-five the stages use from it
too. Each does what Sonic Retro says it does in its own game: Motobug drives to and fro;
Buzz Bomber and Buzzer fly over and fire down at forty-five degrees; Crabmeat stops to fire a
ball out of each claw; Chopper leaps up out of the water and Jawz swims to and fro;
Orbinaut's spike balls go round it, and come near and it fires them at you one by one
(touch one and it hurts); Nebula drops a bomb when you pass under it; Balkiry waits ahead,
then comes straight at you fast, and is gone; Snail Blaster crawls with its shell shut
(nothing hurts it) and opens it to fire twice; Butterdroid comes after you when you come
close, and so do the Spinners and the Klagen; Spiny lobs a spiked ball up at you; Slicer
throws its blades, which home in on you a while; Asteron flashes when you come near and goes
off in its five points; Grabber drops on you on its thread when you pass under; Grounder
waits behind a wall and bursts out through the bricks at you; Rhinobot charges what it sees;
Crawl holds its bumper out in front, so hit it from behind or above; the Electro Spinner and
Electro Klagen crackle with electricity now and then (don't touch them then), and the Metal
Spinner is armoured, broken only by a jump on it or a ball.

**The rules.** Three hearts; a hit costs one, every fifty carrots gives one back, and Carrot
Juice heals. Pits and running out of hearts or breath send you back to the last furlong
pole. A rainbow carrot makes you untouchable for eight seconds. Each stage hides three
Golden Horseshoes. The grade (S to C) weighs the time against the stage's par, the share of
carrots, and whether you fell. Clearing a stage opens the next, and a stage once cleared
stays open; each new stage counts the clear of the one whose place it took, so nothing a
trainer had already opened is locked again (their best times start afresh, the stages being
new). First clears pay 60 carrots into the stable, each first horseshoe 20, a first S 40.
Best times, grades and horseshoes are kept per trainer (`postparade.adventure.<account>`).

**Controls.** Arrows or WASD to run (and Up and Down to pick a move, crouch or climb), Space
to jump (hold for height), Z, X and C to attack. Enter starts the stage from the stage
select and opens and closes the pause menu (Esc pauses too). In the menus the arrows move
between the choices -- to the nearest one that way, with a gold outline round it -- Z
confirms and X goes back: to the hall from the stage select, back into the run from the
pause menu, to the stage select from the results. A gamepad works (stick or d-pad; A jumps,
X light, Y heavy, B special; Start pauses). On a phone there are buttons on screen -- a pad
of four, and Light, Heavy, Special and Jump -- and the camera backs off on a tall screen so
twelve metres fit across.

**Stages are text** (`adventure-stages.js`): chunks of 32 rows, one character a one-metre
tile, with the legend at the top of the file. `tools/genstages.py` (local) draws them from
set pieces -- runs, hills, climbs, pits with stepping stones, high roads, vaults, balloon
ladders, bumper pits -- and writes the file; `node race/validate-adventure.js` checks them,
and `tools/dev/adventure-bot.js` plays them through in a test page. Besides the old pieces
there are conveyor belts (`{` `}`), bumpers (`Q`) and balloons (`o`, which pop and throw you
up, your air moves back, as Sonic Advance's do). The stage is built in sixteen-tile voxel
chunks at the lobby's quarter-metre grain, with a deep top strip along the surface (grass, a
rug, snow, carpet, road with its lanes, marble squares, moss, sand, steel), each theme's own
blocks (chalk-grey stone, riveted steel with hazard stripes, books on end, carved stone with
glowing glyphs, dark glass edged in neon, concrete, white marble with a gilt band, mossy
carved stone, red sandstone in bands, burnt concrete with the fire in its cracks, hull
plating with its lights) and ledges (planks, grating, shelves, a gold rail, red girders), caves and roofed rooms backed with a wall, things that break or crumble as their
own meshes, carrots as one instanced mesh, and each theme's scenery set back so the
perspective camera gives it parallax. Sounds are synthesised; the music is the game's own.

## The race in voxels

`voxel.js` draws the race in three.js (r128 from cdnjs, the same build the other voxel
games use), built the way Pallet Town Voxel is: a sparse voxel grid, a face-culled mesher
with baked AO, Lambert vertex colours and one shadowing sun. It reads only what the 2D
view read -- `pos`, `lane`, `v`, `hp`, buffs -- so the simulation is untouched. The flat
view is still there as `draw2D()`: offline, or without WebGL, `Voxel.ok` is false and
the race falls back to it rather than failing to start.

- **One course for every race.** A left-handed oval about Tokyo's size (520m straights,
  ~1980m round the turf rail), turf course outside, dirt course inside, hedge between.
  The finish is fixed on the home straight and each race starts `distance` metres back
  from it, so a 1200m sprint breaks from the back straight and a 2400m race passes the
  post once. Furlong poles count down from the finish; the gate is built per race with a
  stall per lane, and its doors swing open at the off.
- **Racers are voxel models from `LOOKS`**: each Global-launch racer's hair, cut, eyes
  and signature racing outfit, plus ear covers, hats, crowns, masks and capes where she
  has them. Legs, arms, tail, ponytails and capes are posed every frame from her speed.
  A name not in `LOOKS` gets a stable look hashed from her name.
- **Nameplates stay 2D.** index.html draws them on its canvas over the WebGL one, at
  points `Voxel.project()` hands it, so text stays crisp at any distance. A rival only
  gets a plate near the camera or while something is happening to her.
- **The camera is directed** (Auto, the default). It cuts between shots the way a race
  broadcast does, picked from where the race is: side tracking, a low chase, a pack
  aerial, the leader from in front, a fixed camera on the rail that the field rushes
  past, a crane on the turns. The moment the leader is into the home straight it cuts to
  the long lens down the straight, then low sprint shots, then a fixed camera at the
  winning post; when your signature fires, a hero shot of you. Fixed shots hold still
  and let the field go by, which says more about speed than a camera that keeps pace.
  **V** or the View button still cycles to Broadcast, Chase or Field, and remembers.
- **The gate draw.** As in the real game, the stall each runner starts from is drawn at
  random for every race (`createRace` in sim.js, on its own generator from the race's
  seed). Stall 1 is the rail. The gate card shows your racer's ("Gate 7 of 11"). Lanes
  used to be the order of entry, which put your racer, always entered first, on the rail
  every race. In the sim a lane only decides who boxes in whom, so no stall is worth
  distance.
- **Before the off** (after the gate card is clicked) the grade's fanfare plays while
  the camera takes in the field in the gate: an aerial swing, along the stalls face by
  face (the doors are open frames, as real ones are), in on her, then behind the gate.
  The clock is held; it lasts as long as the fanfare, a click or a key skips it, and
  Settings can turn it off.
- **Wind** says how fast they are going: speed lines rushing past your racer at half
  again her speed, wisps off every racer near the camera, dust hanging on dirt, and at
  top speed in the final phase, a spurt or a signature, anime speed lines round the
  edge of the screen (never on wide shots). The low shots kick their field of view and
  shake a little at a gallop.
- **Signature cutscenes.** When a signature skill fires the race holds and cuts away to
  her own stage -- a sky in her colours (`CUT_THEME`), a voxel floor racing away under
  her, a tunnel of light -- for three shots: her face, a slow-motion sweep round her,
  and the hero shot as her signature effect goes off and the skill's name lands. The
  clock is handed back exactly as a pause hands it back, so not a metre is run unseen.
  A rival's is the short cut (sweep and hero shot); Settings has "Cutscenes for: All
  racers / Only mine"; a click skips one.
- **Every racer's signature skill has its own effect** (`SIG` in voxel.js), built from
  who she is and the real unique she fires. Taiki Shuttle's "Shooting for Victory!" fires
  muzzle flashes on the beat into the straight, Special Week leaves a comet's
  tail under falling stars, Oguri Cap runs through lightning, El Condor Pasa spreads
  red-gold wings, Maruzensky's exhaust goes from flame to smoke, Rudolf wears a golden
  crown, Gold Ship is chaos. Each is a few layers (bursts, rings, orbits, trails, speed
  lines, rain, wings, bolts, fireworks) that fire on the skill and keep emitting for as
  long as it lasts in sim time. Particles either stay in the world, as a trail does, or
  follow her as an offset from wherever she is now, which is how an aura keeps up at
  17 m/s. A card's generic speed sparkle stands down while a signature is running.
- **"Glow" particles are unlit, not additive.** Additive light washed every colour to
  white over sunlit turf -- Special Week's violet looked like Oguri's silver.
- **Rivalries** (`rivals.js`).
  - **What triggers one:** two contenders (in the front 60% of the field) staying close
    after half-way: within 3 m of each other, in any lanes, for 8 seconds of race time
    (2.5 in the final third, where duels are run). That makes them rivals, once per racer
    per race. Out of the gate the whole field runs at one pace, so a rivalry there would
    mean nothing; through the middle the pack runs together, hence the long hold there.
    Over 200 simulated races it came to about two a race (none in 1 race in 25), about one
    in the final third, typically 60% of the way round, and a given racer was in one in
    38% of her races.
  - **What it does:** both racers' signature skills fire at once, whatever their
    conditions and even if they have already fired. This doesn't count as a use
    (`Uniques.force` marks nothing), so a skill not used yet can still fire on its own later.
  - **The cutscene** (`playRival` in voxel.js), staged after the anime's great duels
    (Tamamo and Oguri in *Cinderella Gray*, Tachyon and Jungle Pocket in *Beginning of a
    New Era*):
    - The race holds and cuts to an image space of their own, the sky split between
      their two colours with a seam of light where they meet. The music drops away until
      the clash (`Sound.hush`).
    - Side by side in slow motion, their names come up with VS, and a spark is struck
      in the gap between them.
    - The camera goes in on each in turn as she sizes up the other and tells herself how
      she'll beat her.
    - Then the clash: both skill names, a white flash, and both signature effects at once.
  - **What they think** depends on how well they know each other. There are lines for a
    particular rival (Spe and Suzuka, Teio and Rudolf or McQueen, Vodka and Scarlet, Grass
    and El, Oguri and Creek, Rice and McQueen, Urara and King Halo…), lines that name
    someone she knows (a teammate, her generation, her family), and lines in her own voice
    for a stranger.
  - **In the final third it is the Zone:** the sky darkens, light streams back off their
    shoulders the whole way, and the clash brings out three effects. Nothing is drawn on
    their faces: on a voxel face the eyes sit right above the nose, and particles there
    read as something on her nose. Each racer's own comes
    first where she has one (Oguri's grey smoke, Rice's blue flame, Tachyon's numbers, Gold
    Ship's fireworks); the rest are picked at random from lightning, flames, a shockwave,
    fireworks, comets and smoke, so no two clashes look alike.
  - **Who sees it:** your racer's rivalry gets the full cutscene, with her on the left.
    Two others get a short one (the spark and the clash, both thoughts at once) when
    cutscenes are on for everyone. A click skips it.
- **Over the line, the race runs on.** Your place is settled when you cross: the banner
  (WIN, 3rd...) comes up then and fades after a couple of seconds, and the camera circles
  your racer as she pulls up. The rest of the field comes home at its own pace behind
  her, and each pulls up past the post. The results come once they are all in and have
  had their moment (about 7 seconds after you cross), or after 9 if some are still far
  back. Those stragglers are run home under the results sheet. A click, Enter or Space
  skips to the results. Running everyone home in one frame as you crossed used to put
  the whole field level with the winner.
- **After the race, each racer reacts in her own way** (`reactions.js`, written for this
  game from how she is in the games and the shows). Each has two or three reactions for
  each kind of finish: a win, second or third, the middle of the field, and the last
  three. One is picked at random each race. A reaction is a move and a line; she says the
  line in a bubble over her plate once she has pulled up.

  Some examples:
  - Teio does her Teio Step when she wins and stamps when she loses.
  - Bakushin salutes ("BAKUSHIN!") wherever she finishes.
  - Urara cheers whatever happens.
  - Oguri wins, then says it's time for food.
  - Gold Ship flying-kicks or flops down on the turf.
  - Scarlet won't take second.
  - Rice cries, for joy or not.

  The 25 moves are in `MOVES` in voxel.js: cheering, waving, bowing, saluting, a V sign,
  hands on knees, a pout, arms folded and stamping, hands to the face, sitting down, a
  shrug and more. The winner turns to the cameras, and losers half turn away.
- `voxel-lab.html` lines up the whole roster as models -- the place to check a look.
  **Signature ▶** (or S / arrow keys) plays each racer's effect alone with the camera
  on her; **All** fires all 26 at once; **Run** makes trails stream as if she were
  moving; **After the race...** has everyone play one of the reaction moves.

Measured on Intel UHD integrated graphics, a frame went from ~37ms to ~10ms after three
fixes worth remembering:

1. **Chunked instancing only pays for nearby props.** The distant hills were split into
   64m chunks like the rails, which made ~300 draw calls of something always in view.
   They are now one InstancedMesh, never culled. Draw calls fell from ~900 to ~250.
2. **Shadows were half the frame.** Thin rails and the hedge no longer cast them, the
   sun's frustum is only as deep as the action, and the filter is plain PCF.
3. **Every hole in a voxel shape costs up to six faces.** The trees had random gaps for
   texture; they are solid now, and the crowd is one column per fan instead of two
   meshes.

And one camera trap: smoothing the camera's **position** behind a racer doing 17 m/s
leaves it a fixed lag behind, which became 30m+ whenever the frame rate dipped. The
camera now smooths its **offset** from her, which only moves when the shot changes.

### The game's own music

Every track that plays is now the real game's, from the gamerip (khinsider, *Umamusume:
Pretty Derby*, 2021), named `<role> - <title> (<cue>).mp3` so it binds exactly:

| When | Track |
|---|---|
| Menus, stable, racer page, quests, settings | Home Screen (Day), or (Night) by the player's clock |
| Career setup (trainee, parents) | Let's Go! Start! |
| Career turns, years 1-2 / senior year and Finale | URA Junior & Classic Classes / URA Senior Class |
| Career over: complete / failed | Career Run Complete / Goal Failed |
| Tutorials | Welcome to Tracen Academy |
| Gate card | Paddock (exhibition, OP), Graded Race Paddock (G3 and up) |
| Before the off | Open, Graded, G1 or URA Finale fanfare |
| The race | Daily Race (exhibition), Open Race (Debut/OP), G3, G2, G1 & URA Finale |
| The last quarter | that grade's "The Last Competition" |
| Your rivalry's clash, in the final third (`rival_final`) | one of six other race modes' "The Last Competition", at random: Champions Meeting Finals and Qualifier, Legend Race, Unity Cup Finals and Preseason, Japanese Derby / Arima Kinen / URA Finals |
| Your rivalry's clash, mid-race (`rival`) | one of My Rival Called Friend, Monster's Conflict, Faster! Faster and Faster!, at random |
| After the line | Race Results First / Unplaced: the jingle, then the result screen |

The race cue is the real game's two-part one: the grade's theme, then its "Last
Competition" once she or the leader is three quarters of the way home. A rivalry your
racer is in cuts across that: the music drops away for the stare-down (`Sound.hush`), and
at the clash her rivalry's own track comes in (`Sound.raceRival`). It keeps the race to the
line, past the cutscene and over the race's own cue changes, until the result music. A
rivalry between two others leaves the race music alone. The older,
title-guessed tracks are still on disk and still reachable as fallbacks, so a folder
without the rip plays what it did before. Title, prologue, scout and the legacy screen
are unchanged: the first two were already the real tracks, and the rip has no clearly
named track for the other two.

### Race ambience: the field, the crowd, the caller

The rip is music only, so the rest of a race day is made here (`ambience.js`, Web Audio,
under the music):

- **The field running.** Every footfall is its own hoof strike, synthesised (a thump, the
  impact and a second knock as the shoe settles, then grass brushing on turf or grit
  spraying on dirt; six of each) and timed to the stride `voxel.js` draws: a foot comes
  down each time her body dips (`Voxel.ears()` reports each racer's stride phase, speed,
  distance from the lens and side of the frame). Strikes are louder the nearer she is to
  the camera, panned to her side, harder at a gallop; anyone too far off to pick out
  joins a low rumble, so an aerial shot still sounds like the whole field.
- **The crowd.** A cheering bed runs the whole race, low-passed to a murmur in the
  opening and opening up through the final corner and the straight, louder the nearer
  the leader is to the line. Over it, surges cut from a recording of a stadium reacting:
  a pop as the gates open, a build started so it breaks as they turn into the straight,
  a swell with a signature cutscene, the roar for the winner. A rivalry's stare-down
  quiets the stands with the music (`Sound.hush`) and the clash brings them back.
- **The caller** (`caller.js`) calls the race as broadcast captions under the action,
  names in gold: the break, who leads, halfway, the final turn, the straight, a charge
  from behind, two hundred to go, a finish too close to call, the winner (by a distance,
  by a whisker, from behind, or all the way from the front), and a rivalry once its
  cutscene is over. A bigger moment replaces a smaller one; stale calls are dropped; at
  4x only the big moments are called. Nothing while paused, in a cutscene, or while
  Tazuna is talking. Settings > Race caller turns it off.

Nobody speaks. Two kinds of voice were tried and cut: a synthesised "voice" for each
racer under her lines, and browser speech for the caller (in Japanese where the browser
has a voice for it). The speech never reached the speakers in the app's browser pane: the
browser reported every line spoken while Windows' speech output went elsewhere, which is
the trap to remember. The real game's voices and SFX were not used: there is no
verifiable source for them.

Levels were set by measuring each bus against the music (about -24 dBFS at the default
volume): the crowd about 12 dB under it in the opening, a few dB under it down the
straight, level with it only for the roar at the line; the field averaging a few dB
under the music, with a close pass peaking around it. `Ambience.state()` reports each
bus's level, what is loaded and what is sounding. Everything pauses with the race (the
audio clock is suspended, so a surge resumes mid-breath), holds through cutscenes, and
stops when the race screen is left.

The two recordings, both from Freesound and **CC0** (public domain; credited anyway):

| File (`audio/sfx/`) | Source | Used for |
|---|---|---|
| `crowd - Crowd Cheer (freesound 397434).mp3` | [Crowd Cheer](https://freesound.org/people/FoolBoyMedia/sounds/397434/) by FoolBoyMedia | The bed: 13.5 s cut from 5-18.5 s of the original, crossfaded into a seamless loop and levelled; played twice, half a lap apart, either side of centre |
| `crowd_surge - Millerntor Stadium Crowd Reaction (freesound 829453).mp3` | [Millerntor Stadium Crowd Reaction Excited 01](https://freesound.org/people/itmightgetloud/sounds/829453/) by itmightgetloud | The surges, unedited: six takes separated by silence, mapped in `ambience.js` `TAKES` |

They live in `audio/sfx/`, outside the folder `tools/genaudio.js` indexes, so they are not
music roles and never reach `audiodata.js`.

### One loop, and the gate holds the clock

`loop()` never stops by itself -- it keeps drawing after the finish -- yet every race
started another. From the second race on, the previous loop was already running the
new race underneath the gate card that says *click to start*, and each race added a
full redraw per frame (cheap in 2D, not in 3D). `runLoop()` now starts the loop once
per page, and `G.atGate` holds the clock until the card is clicked away.

## The loop

**Stable → deck → race → XP.** Pick a racer, build 15 cards, run a course, level up.
Progress saves to `localStorage` under `postparade.v1`.

You never play a card. Your racer draws **5 of the 15** at the gate and spends them
when their own judgement says so. Twice per race you may **Callout**: the cards she is
holding are **binned**, and five more come off the deck. It fires at any moment with no
cooldown, but the binned cards are gone for the race.

15 is exactly three hands of five, so the opening draw plus both Callouts consume the
deck and no card is unreachable — and the second Callout empties it, after which the
button correctly refuses.

Spirit is **15** across the race, and that number decides the whole card economy — see
*Cost balance* below.

## Cost balance

Card slots, not spirit, are the real constraint: five active cards that are spent and
not replaced. That broke the cost curve badly at first — expensive cards were strictly
better, monotonically, because filling five slots with the biggest thing available was
always correct.

Measured at 150 runs, mean finish of 8:

| | before | after |
|---|---|---|
| all cost-1 deck | 5.36 | 4.59 |
| all cost-5 deck | **1.00** | 3.75 |
| Common / Rare / Epic | 4.61 / 2.76 / **1.68** | 4.13 / 4.03 / 4.16 |

The cost curve is no longer monotonic, and rarity is flat to within 0.13 places.

Three changes got there:

1. **The Burst ladder was compressed** from a 6.4× value span to ~2.9×, so cost buys a
   premium rather than a different league.
2. **Spirit dropped from 22 to 15.** At 22 an all-Epic deck could still fill every slot.
3. **Callouts became the cheap deck's engine**, which is the actual resolution. Measured
   as the gain from spending your two Callouts, holding the field constant:

```
cheap 1-2   hoarded 5.53 → spent 4.69   +0.84
mid 3                4.65 → 4.65        +0.00
pricey 4-5           4.49 → 4.49        +0.00
```

A cheap deck converts its spirit surplus into extra plays (4.9 → 8.3 cards). An
expensive deck cannot use a Callout at all, because it runs out of spirit, not cards.
That trade — volume plus Callouts against raw power — is the point of the cost curve.

### Why Callouts discard rather than reshuffle

Under an earlier rule the hand went back into the deck, which meant calling out on five
good cards cost nothing and "call out whenever" was close to correct. Binning them puts a
price on the decision, and timing now separates good play from bad:

```
never call out             6.09    0 callouts
call out immediately       5.67    2 callouts,   9.3 cards binned
call out on a full hand    5.53    1.6 callouts, 6.6 binned
call out when spent        4.67    1.5 callouts, 1.5 binned
```

A full place between calling out well and calling out carelessly — and using them badly
still beats hoarding them, so the mechanic rewards engagement before it rewards skill.

Two outright bugs surfaced during this:

- **Opening-only cards could never be played.** Their timing score is zero for exactly
  the window in which they are legal, so the AI never fired one. Cards now gain urgency
  as their legal window closes.
- **Gamble exhausted its racer in 100% of races.** Burning faster also raises the
  superlinear cost of the extra speed, so the drain penalty compounded against itself.
  Fixing it properly took a redesign — see below.

## What each card kind is about

Every kind has a hook — a situation it is *for*. A card that scores the same everywhere
is a non-choice, so `validate-kinds.js` measures each kind's **spread**: how far its
value moves between its best and worst situation. Burst is the deliberate control, held
flat on purpose, and every other kind is measured as "better or worse than the Burst it
replaced" (6 of 15 swapped, so Burst reads exactly 0 by construction).

```
  kind        1200/lo  1200/hi  1600/lo  1600/hi  2400/hi   spread    sd
  Burst         +0.00    +0.00    +0.00    +0.00    +0.00     0.00   1.37
  Gamble        +0.13    +0.28    +0.12    -0.13    -0.06     0.41   1.54
  Recovery      -1.03    -1.21    -0.73    -0.78    -0.67     5.18   2.06
  Tempo         +0.93    +1.37    +0.41    +1.01    +0.08     1.36   1.61
  Counter       +1.12    +1.34    +0.76    +0.79    +0.42     1.36   1.40
  Support       +0.44    +0.27    +0.34    +0.13    -0.12     0.57   1.34
```

**Burst — the yardstick.** Straight pace, no texture, deliberately. A pool needs one
honest baseline or there is nothing to judge the interesting cards against.

**Gamble — the bet.** The burst runs; when it ends the sim asks whether she actually
passed *two* rivals. If not, she pays. Parity on average with the highest variance in the
pool: more outright wins **and** more disasters. How often it comes off swings enormously
by running style — a Pace Chaser sitting just off the lead converts ~53%, an Ender stuck
at the back ~17%.

**Recovery — insurance.** The only kind whose value is genuinely bimodal. It is the worst
card in the pool when stamina was never going to run out (−1.2 in sprints) and the best
by a mile when it was (+4.0 over 3200m on a low-stamina racer). Spread 5.18. It also
scales with desperation: a heal returns its base at full stamina and up to triple that on
empty, so holding it is a real decision.

**Tempo — planning.** Cut your burn now; the dividend matures when you enter the **final
phase**, sized by what you still have in hand. It is the one card about thinking ahead:
play it in the first half and it pays exactly when it matters, play it late and the race
ends before it comes good.

**Counter — duelling.** It targets whoever is *directly ahead*, not the distant leader,
and transfers half their lost pace to you. A card for the racer doing the chasing, and
dead weight the moment you hit the front.

**Support — drafting.** Sitting in someone's slipstream now pays, and pays most when you
are tightest behind. It inverts traffic from a penalty into something to seek out.

Resolutions that land far from where the card was played are shown on the track, or the
player never connects cause to effect: **GOT THERE** / **WENT TOO EARLY** for a gambit,
**SAVED IT +18%** when a Tempo investment matures.

### A measurement trap worth remembering

The first version of this harness splashed the test kind into a *mixed* deck. That
quietly changed the deck's cost profile as well as its kinds, and the Burst control drifted
to −0.6 instead of 0 — so every reading was biased by about half a place and three kinds
looked stronger than they were. The control has to be a literal no-op.

Also note the `2400/lo` and `3200/lo` columns are near-degenerate: an all-Burst probe on
700 stamina exhausts and finishes last every time, so anything that also exhausts ties at
8.00 and reads as exactly 0.00. Read those cells as "floor", not as "no effect".

## Making the Callout discoverable

The measured trap is hoarding Callouts, so the race UI has to answer two questions by
itself: what does this button do, and is now the moment. It never just says "2 left".

The button carries its own explanation (`Callout / redraw all 5 cards`, bound to **C**
or **Space**), remaining uses show as pips, and a hint line underneath reports the state
of the hand:

| hand | hint | button |
|---|---|---|
| everything playable | *All 5 playable. Save it.* | calm |
| some cards wrong | *2 of 5 unplayable* | slow pulse |
| can't afford anything | *Saving spirit — a redraw would not help* | calm |
| nothing playable | *Nothing playable — 4s wasted* | amber, fast pulse |
| worn down to one | *Down to 1 card — 18s wasted* | amber, fast pulse |
| empty | *Out of cards. Redraw* | amber, fast pulse |

The "saving spirit" row matters: a Callout swaps cards, it cannot conjure spirit. Without
that distinction the UI nags you to redraw when redrawing would not help.

Afterwards the results screen quantifies what hoarding cost, using the race's own
numbers rather than a tooltip:

> **2 Callouts unspent.** Special Week finished the last 54s with no cards left at all.
> A Callout draws 5 fresh cards for free, and they do not carry over to the next race.

Spend them and the note turns green instead. A one-time tip on the very first race
explains that you do not play the cards at all, since that has no analogue in a normal
racing game.

## Who decides what gets played

Two separate dials, and keeping them separate is the point.

**Personality** is what a racer *wants*: Reckless spends the moment a card is
affordable, Patient sits on everything until the straight, Erratic follows no pattern
anyone has identified. It tints which cards they reach for.

**Wit** is how accurately they execute that intent. A low-wit racer misreads the race —
believes it is later than it is, and that there is more left in the tank than there is —
so they spend the big closing card on the back stretch. Wit carries roughly twice the
weight of personality (`PERSONALITY_WEIGHT` in `ai.js`).

## The race model

Base pace per course, calibrated to real winning times: 1200m ≈ 1:13, 1600m ≈ 1:35,
2400m ≈ 2:23, 3200m ≈ 3:18. Stamina drains superlinearly with speed above that pace, so
sitting slightly too fast is survivable and a sustained burst is not.

Measured stat sensitivity (mean finish of one probe against seven identical clones):

| | 1200m | 2400m | 3200m |
|---|---|---|---|
| speed | **+3.02** | **+3.44** | +3.59 |
| stamina | 0.00 | **+3.38** | **+7.00** |
| power | +0.22 | +0.44 | +3.34 |
| guts | +0.18 | +0.26 | +6.78 |
| wit | 0.00 | +0.70 | +6.92 |

Sprints are decided on speed alone; long trips punish everything.

## Does deck-building actually matter?

Yes, but the axis is **matchup, not temperament**. A pace deck and a stamina deck trade
places depending on the trip and on how much stamina the racer already has:

```
                    all pace   all stamina
stamina 700
  1200m sprint         *4.78          7.81
  2400m classic         4.31         *1.01
  3200m stayer          4.55         *1.00

stamina 1050
  1200m sprint         *4.78          7.81
  2400m classic        *4.64          7.01
  3200m stayer          4.49         *1.07
```

Raising stamina from 700 to 1050 pushes the crossover a full course length: at 700 the
stamina deck takes over from 2400m, at 1050 not until 3200m. Personality shifts the same
deck by about half a place — real, but secondary, which is intended.

## The deck builder

Pick a racer, then one of her decks (or **New deck**). The builder is the collection and
the deck side by side: the cards you own on the left, the deck down the right, which stays
in view while the collection scrolls. Below 860px the deck goes on top as a row of chips
and nothing sticks.

- **Sort** by cost, kind, rarity, name, copies owned, or in deck first. The button beside
  it reverses the order and says which way it runs (*Low first*, *Epic first*, *A to Z*).
  The sort is remembered on the device (`postparade.deckSort`).
- **Filter** by kind, cost, rarity, timing (any phase, opening only, final only) and *not
  in deck*. Several picks in one group mean any of them. **Search** reads the card's face
  and the plain words of its details, so *slipstream* or *stamina back* finds the cards
  that do it. *Clear filters* resets the lot.
- **The board** heads the deck: the count against 15, average cost, the cost curve, the
  kind mix in the gate colours, how many cards are opening- or final-only, and
  `Stable.checkDeck`'s verdict. Save stays off until that is clean.
- **Copies** are slots on each tile: a deck holds what you own, up to two
  (`Stable.copiesAllowed`). An add the deck cannot take is refused for whatever
  `Stable.cantAdd` says, as a line at the foot of the screen rather than a dialog to
  dismiss: on a phone the deck is scrolled out of sight, and that line is the only sign.
- **Undo** (Ctrl+Z) walks back every change, *Clear* and *Let her decide* included.
  Cancel asks before throwing away unsaved changes.
- **Keys:** Tab to a card; Enter or Space adds, Delete or Backspace drops a copy, the
  arrows move, I opens it, `/` jumps to the search.

The screen is laid out once and only the parts a change touches are redrawn. The first
builder rebuilt the whole screen on every click, which threw away the scroll position:
adding a card from the bottom of the collection jumped you back to the top.

### Reading a card

Hold any card (in the collection, in the deck, or a chip in the race HUD) and its details
open: the full art, cost, kind and rarity, what it does and when she can play it in plain
words, and the short read `Stable.cardAsks` makes of it. On a desktop a right-click or a
held click does the same; from the keyboard, I. An ordinary click still adds or drops: a
hold that opened the view swallows the click that ends it. A ring fills at the press while
the hold counts down, invisible for its first third so an ordinary click never shows it.

The words are generated from the card's data (`CardDetail.describe` in `carddetail.js`)
with the numbers `cards.js` and `sim.js` run on, so they cannot drift from what the card
does: Tempo's payout over the 30–90% stamina band, a Counter's half share, Support running
clear of traffic. In the builder the view adds and drops copies, and its arrows (or ← →)
step through the cards in the order they are sorted.

In a race it says whether she can play the card now and, if not, why, with her spirit
against the cost. **The race holds still while it is open**: reading her hand should not
cost her the race, and nothing is spent. It hands the clock back on close only if it was
the one that stopped it, so a pause the player or the tutorial made stays. The HUD redraws
its chips four times a second, so a press remembers the card, not the chip under the
finger.

For the tutorials: the builder calls `Shell.notify("deckAdd")` and `("deckDrop")`, and
the view `("cardDetail")` when it closes.

## Letting her build her own deck

**Let her decide** (on her deck screen, and in the builder) first asks how much she
should plan:

- **Her simple thoughts**: one tap. She builds the Balanced plan for herself: her own
  running style, her best distance and her best track (by her aptitudes).
- **Her planned strategy**: four questions, each with **Back** to the one before.
  1. **How to spend**: Balanced, Speed, Stamina, Pressure, Finishing kick, Big plays or
     Many plays (below).
  2. **Which running style**: Front Runner to Ender. Her own is marked *hers*.
  3. **What distance**: Sprint (1000–1400m), Mile, Medium or Long (2401m and up), each
     with her aptitude. Her best is marked.
  4. **Which track**: Turf or Dirt, with her aptitude. Her best is marked.

In a race she still runs her own style, so building for another one is the trainer's
experiment. The deck is named after what it was built for (*Her Pick*, *Speed Sprint
Dirt*, *Late Stamina Long*). The payout box says the race it was planned for, how many
cards are doubled, and what she made of the race ("her stamina runs short here", "she
runs behind on this track").

**Two copies of a card at most.** However many are owned, a deck holds no more than two
of any one card (`Stable.COPY_MAX`). Decks saved before the limit keep their first two.
Without it the best deck at every distance up to 2400m was fifteen copies of one common
card (the cost-1 "+11% pace for 5s"), which finished 1.6th of 8 on average.

### Planning for the race

Which cards win depends on the race, so the builder follows plans measured per race
(`deckplans.js`, generated by `node tools/gendeckplans.js`). The race is described four
ways:

- **distance:** Sprint, Mile, Medium or Long.
- **tank:** whether her stamina lasts the trip. It runs short below about a third of a
  point per metre (`Stable.TANK_PER_M`), read from her actual stamina stat.
- **running style.**
- **ground:** whether she is weak on the track (aptitude C or worse). She runs behind
  there.

Every card plays one of three roles:
- **pace:** Burst, Gamble.
- **sustain:** Recovery, Tempo.
- **pressure:** Counter, Support.

For each of the 64 races, the tool measures two things: every card tier stacked into a
deck on its own (what each card is worth there), and every split of the fifteen slots
between the roles. It keeps the split that raced best. The builder fills each role with
the best cards you own for that race, two of a card at most (`Stable.planDeck`).

Measured, the plans read like racing sense:
- Short races and a full tank want pace.
- A tank that runs short at 2400–3200m wants nine sustain cards.
- On weak ground the Counters (which slow the racer in front) climb, because she is the
  one behind.

The focuses lean the plan:

| Focus | What it does |
|---|---|
| Balanced | the measured plan as it is |
| Speed / Stamina / Pressure | that role gets at least 12 / 9 / 9 slots, the rest shared as the plan shares them |
| Finishing kick | prefers final-phase cards and Tempo |
| Big plays | only cards costing 3 or more |
| Many plays | only cards costing 1 or 2 |

What it is worth, measured by `validate-autodeck.js` on the exhibition field:
- **Against the old builder:** each racer at each distance with a big collection, the
  planned deck against the old one-size deck (one of each card first, at most four of a
  kind). Planned won 4.54 to 4.80 on average place over 748 paired races. Most of that
  is at 2400m (4.09 vs 4.47) and 3200m (4.38 vs 4.98). At 1200m and 1600m they are level.
- **Collection size:** a bigger collection now pays. With the old builder, decks from 10
  card scouts and from 200 finished level (4.94 and 4.86 average place), because it never
  doubled a card and capped any kind at four. Planned, the same collections finish 5.05
  and 4.61 (wins 22% and 30%), still rising at 100 scouts and beyond.

The plans measure the cards, the AI and the sim as they are. Re-run the tool after
changing any of them (about 20 minutes).

The older card-by-card scoring below (`cardScore`, `pickDeck`) is still what Dream Trophy
rivals build with, and what the builder falls back on without `deckplans.js`. The builder
is `Stable.suggestDeck(racerId, focus, runStyle, { distance, surface })` in `stable.js`.

### What suits a style is read off the cards

No card is tagged with a style. What a card asks of the race is read from its own data
(`Stable.cardAsks`), and what each style offers is read from its line in `Sim.STYLES`
(`gap`, the `phase` pace curve, `hpCoef`). A new card, or a retuned style, is scored
without editing anything.

| the card asks | read from | suits |
|---|---|---|
| stamina back | `heal` (with its average desperation bonus), a drain cut | a short pool (`hpCoef` low): the front runner |
| running on empty | `cond.hpBelow` | the same |
| stamina burnt | a drain penalty (Gamble, the dear Counter) | not the closers, who spend fastest in the straight |
| a payoff in the straight | `invest` (Tempo) | the closers, who reach the straight with the most left |
| opening only | `phases: [0]` | the lead: an opening burst is ground a leader keeps, and a closer gives back to the pack |
| final phase only | `phases: [2]` | the closers (`phase[2]` above `phase[0]`) |
| a rival ahead | `steal`, `draft`, `gambit`, a `leader` target, `cond.blocked` | anyone but the leader |

How much each pairing counts was measured, by swapping six of a card class into an
all-Burst deck and racing it in each style against the exhibition field (40 races per
cell, every course, places gained over the Bursts they replaced):

```
                     stamina 750                     stamina 1100
               front   pace   late  ender      front   pace   late  ender
Recovery       +1.85  +1.69  +0.82  +0.51      +0.28  -0.24  -0.95  -0.79
Recovery, low  +2.15  +1.80  +0.91  +0.59      +0.24  -0.30  -0.95  -0.89
Gamble         -0.33  -0.41  -0.91  -0.93      -0.74  -0.86  -0.79  -0.63
Counter, dear  -0.04  -0.22  -0.50  -0.36      -0.13  -0.38  -0.33  -0.28
Tempo invest   +0.12  +0.34  +0.37  +0.31      +0.09  +0.44  +0.28  +0.39
Burst, opening -0.15  -0.22  -0.40  -0.19      -0.36  -0.37  -0.37  -0.30
Burst, final   -0.03  -0.03  -0.11  -0.03      -0.10  -0.05  -0.10  -0.03
Counter        -0.01  -0.05  -0.06  +0.07      +0.02  +0.01  +0.02  +0.05
Support        -0.26  -0.32  -0.41  -0.38      -0.54  -0.45  -0.49  -0.53
```

Stamina is the one big lever: six heals are worth a front runner 1.1 to 1.3 places more
than they are worth an Ender. Burning stamina late, and banking it for the straight, are
real but smaller. Phase windows and "needs someone ahead" barely move in this sim; they
are kept, weighted lightly, because they point the right way and make the decks read
like the style they are for.

### Style changes the shape, not the quality

The per-style kind table the builder used to have (`front: Tempo 3, Recovery 2 ...`)
mostly made some decks better than others: measured, the deck it built for a front runner
was the best deck for every style. So every style now starts from one kind appetite
(`KIND_WANTS`), set by the same measurement, and the style only moves the cards whose
value really depends on it. That alone took Balanced from level with a random fifteen
(5.29 against 5.36, which had been failing `validate-autodeck`) to half a place clear:

```
validate-autodeck, 34 races per racer, both players       mean place
  Balanced 4.99   Expensive 5.14   Cheap 5.53   cheapest 5.67   random 5.55

front-runner deck vs Ender deck, same racer, same collection
  cards that differ        Balanced 4.7   Expensive 4.4   Cheap 3.7   of 15
  heals                    3.7 vs 2.4 per deck
  final-phase or Tempo     3.3 vs 4.8 per deck
  stamina-burning cards    0.9 vs 0.5 per deck
```

Expensive weighs the style double (`fitW: 2`), because at the usual strength its rarity
weights drowned it out and the two decks differed by only two cards.

**What it is worth in a race, honestly: a little.** Each racer was run as a front runner
and as an Ender, once with the deck built for the style she was running and once with
the deck built for the other one. The matched deck won by 0.04 to 0.12 places across four
measurements on different collections, never less than zero, about a twelfth of a place
pooled. In this sim most cards are worth much the same whatever the style; stamina is
the exception, and stamina also depends on her own stamina stat, which no style choice
changes. (Reading her stamina as well was tried. It pulled the two decks together and the
gain disappeared.) The validator checks that the matched deck is better, not by how much.

## Unique skills

Each racer has one signature skill, and it is **her real one from the Global game**.
Nobody chooses or triggers it: it fires at most once per race, only when that racer's
own situation matches, and it is stronger than anything in the card pool because it is
the character rather than the loadout.

The condition GameTora publishes for each unique is translated term by term into
`uniques.js`'s vocabulary by `tools/genroster.js` -- an unknown term is an error, never
a silent drop:

| Game | Here |
|---|---|
| `phase>=2`, `distance_rate>=50` | the final third; past 50% of the trip |
| `order<=5`, `order>=3`, `order==1` | first five; third or further back; leading |
| `order_rate<=40` | in the front 40% of the field |
| `is_finalcorner`, `is_last_straight`, `corner!=0` | the bends and straights of the voxel course, in metres remaining |
| `change_order_onetime<0`, `is_overtake` | has just passed someone; closing on the runner ahead |
| `bashin_diff_infront<=1` | within a length (2.5 m) of the runner ahead |
| `blocked_side_continuetime>=2` | locked with a rival for two seconds |
| `remain_distance` | metres to go |

Two adjustments, both because our fields are 8 to 11 runners and the game's are 18:
absolute places scale to the same share of the field (Taiki's "3rd or worse" is "2nd or
worse" among eight; never past 2nd, never looser than written), and a band of the field
too narrow to hold one place (Mejiro Ryan's 65-70%) means the place nearest its middle.
Effects: target speed reads at 0.6 per m/s (the game's "greatly", +0.45, is +27% pace
here), acceleration also lifts pace a little for its window because acceleration alone
does almost nothing in this sim, recovery at three times the game's share. Durations are
per 1000 m, as in the game.

Firing rates by course (fired % / mean place), 40 runs each, 8-runner fields, no
cards. A 0% where she is far down the field is the real skill doing what it says --
Taiki's needs her in the front 40%, and over 2400m she never is:

```
                      1200m     1600m     2400m     3200m    1600m dirt
Special Week          28%/5.2   18%/4.8   80%/2.7   95%/2.4    8%/5.5   Shooting Star
Silence Suzuka        18%/2.5   75%/1.7   78%/3.1    0%/6.8    5%/2.9   The View from the Lead Is Mine!
Tokai Teio            15%/4.8    0%/7.0   85%/2.2   33%/3.8    0%/7.3   Sky-High Teio Step
Maruzensky           100%/1.9  100%/1.8   68%/6.8    3%/6.0   98%/2.3   Red Shift/LP1211-M
Oguri Cap             45%/3.4   73%/2.1   20%/5.3    3%/5.3   40%/1.2   Triumphant Pulse
Taiki Shuttle         50%/1.3   75%/2.0    0%/7.5    0%/7.5   45%/1.5   Shooting for Victory!
Mejiro McQueen         0%/7.0    0%/7.5   88%/2.3  100%/1.3    0%/7.3   The Duty of Dignity Calls
Symboli Rudolf         0%/3.3    0%/4.7   33%/3.3   28%/2.8    0%/5.4   Behold Thine Emperor's Divine Might
Rice Shower            0%/3.2    5%/5.0   18%/3.5   70%/1.5    0%/5.3   Blue Rose Closer
T.M. Opera O           0%/6.8    0%/6.9   43%/3.0   78%/1.7    3%/6.8   This Dance Is for Vittoria!
Gold Ship            100%/7.0   88%/5.0   93%/3.0   85%/1.8   90%/5.3   Warning Shot!
Vodka                 30%/6.0   80%/2.3   25%/6.3    0%/7.3   80%/3.3   Xceleration
Daiwa Scarlet          3%/4.9   65%/1.7   65%/5.5   60%/4.8    8%/2.8   Red Ace
Grass Wonder          35%/6.5   33%/2.7   40%/6.5    0%/3.5   18%/3.0   Focused Mind
El Condor Pasa         3%/5.1   73%/2.2    0%/4.1    0%/4.4  100%/1.1   Corazón ☆ Ardiente
Air Groove             8%/2.2   10%/3.5   48%/3.1    0%/7.1    3%/3.9   Empress's Pride
Mayano Top Gun        10%/2.5    0%/6.0   73%/2.3   53%/2.4   10%/5.0   1st Place Kiss☆
Super Creek            3%/6.8    0%/7.7   45%/3.6   73%/2.0    0%/8.0   Clear Heart
Mejiro Ryan            0%/3.6   40%/4.7   43%/6.3   55%/5.5   35%/5.4   Feel the Burn!
Agnes Tachyon          0%/6.7    0%/6.3   63%/3.2   65%/4.1    0%/6.5   Introduction to Physiology
Winning Ticket         3%/6.7    0%/8.0   28%/5.1    0%/5.6    0%/7.8   V Is for Victory!
Sakura Bakushin O     35%/1.4   57%/4.7    0%/7.8    0%/7.8   15%/3.5   Class Rep + Speed = Bakushin
Haru Urara            15%/3.8    8%/7.0    0%/8.0    0%/8.0    0%/1.9   Super-Duper Stoked
Matikanefukukitaru     3%/5.5    8%/4.8   40%/3.3   30%/3.2   13%/4.5   Luck Be with Me!
Nice Nature            3%/7.3   13%/4.9   57%/3.2   70%/3.5    3%/5.3   I Can Win Sometimes, Right?
King Halo             60%/1.4   85%/3.4    8%/7.0   23%/6.3   75%/4.2   Call Me King
```

Urara's 0% on her own dirt mile is the skill again: it wants her in the back half,
and against a field of turf horses on dirt she is in front.

## Notes for extending it

- **Cards are data.** Add or rebalance in `cards/generate.py`'s `TIERS` table and re-run
  it; that writes both `cards/cards.json` (art) and `race/carddata.js` (rules). Never
  edit `carddata.js` by hand.
- **The page loads its modules with a cache-busting stamp.** Plain `<script src>` tags
  let the browser keep a stale copy after an edit, and the failure is silent and baffling:
  the page runs old code, a newly added export is simply `undefined`, and whatever calls
  it dies without a visible trace. Keep the loader.
- **Sim time is driven by the wall clock**, not frame deltas. A frame-delta loop silently
  runs the race in slow motion whenever the browser throttles `requestAnimationFrame`.
- The gate stagger at the start is **drawing-only**; staggering real positions would hand
  some racers several metres of free ground.
- `Sim.createRace(defs, course, seed)` is deterministic — same seed, same race.
- Cutscenes **queue** rather than interrupt. Two racers can trigger within a second of
  each other, and cutting one off mid-flight reads as a bug.
