# Post Parade

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
| `ai.js` | Personalities, deck handling, the Callout, and when a racer fires a card. |
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
| `voxel.js` | The race in 3D voxels: course, scenery, every racer's model, cameras; the trainer model; each racer's voxel bust (`Voxel.bust`), the portrait on the deck screens. |
| `voxel-lab.html` | The whole roster lined up as voxel models, standing or running. |
| `attract.js` | The title screen's live race: random racers in a real G1, drawn by voxel.js. |
| `lobby.js` | The main menu in voxels: the academy's hall, the trainer's office, the cafeteria and the dorm, walked as your trainer or a racer, the others about their day, every mode a door that opens. |
| `trainer.js` | The trainer creator: your own character, made at registration, with a turning 3D preview. |
| `lines.js` | What the racers say in the lobby: each in her own voice, to the trainer, to a classmate, and to her pair. |
| `reactions.js` | How each racer takes her result after a race: a few moves and lines of her own for a win, a place, the middle of the field and the back. |
| `rivals.js` | Rivalries: two racers neck and neck long enough clash, both their signatures fire, and each says to herself how she will beat the other. |
| `ambience.js` | The race's own sound under the music: every footfall synthesised and placed where she is, the crowd building to the finish, the surges. Drives the caller. |
| `caller.js` | The race caller, as captions: the break, the leader, the final turn, the straight, a charge, a close finish, the winner. |
| `validate.js` | Race model harness. `node race/validate.js 300` |
| `validate-personality.js` | Deck-vs-personality harness. |
| `validate-balance.js` | Card pool balance: cost curve, per-tier value, Callout value. |
| `validate-kinds.js` | Is each card kind situational? Spread per kind vs the Burst control. |
| `validate-autodeck.js` | Does "Let her decide" build good decks, for each focus and each running style? `node race/validate-autodeck.js` |

Card art is rendered by `cards/build.py`; `assets/cards/` holds the thumbnails.

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
over red carpet, burgundy drapes with gold fringe, and a library through an archway.
Every mode is a place in it: the notice board is Quests, the library is Decks, the
academy terminal by the jukebox is Settings, the classroom is Tutorials, the glass doors to the track are
Exhibition, the side doors on the right are Scouting and the Dormitory, and the reception
desk is How to play. A tag over each says which; walk up to one and press **E** (or click
the tag, or the door) to go in. The dock along the bottom has every mode too, so nobody has
to walk. Five rooms in all: the hall, the trainer's office, the cafeteria, the dorm corridor
and a dorm room. The hall and the office are built at the start; the rest the first time
you go in.

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

**Day and night.** The academy keeps its own clock: a real minute is an hour there, so a
whole day takes 24 minutes. It runs off the real clock (`hourNow`), so it's the same hour
on every screen and keeps going while you're away. The clock sits bottom left, with a sun
or a moon, the time, and what part of the day it is. The phases are night, before dawn,
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

### The tutorial

Eight steps, each gated on a *condition* rather than a timer, so the coach never talks
over something the player has not seen yet. Steps can spotlight a UI element (a gold ring
with the rest of the screen dimmed) and wait for a real event — `cardPlayed`, `callout` —
before advancing.

Two things that had to be got right:

- **Order matters.** An early draft had Tazuna say "There, she spent one" *before* the
  card was played, then wait for it. Anticipate first, pay off after.
- **Event-gated steps need a timeout.** If the race never produces the event, the
  tutorial must move on rather than stranding the player.

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
      between their eyes.
    - The camera goes in on each in turn as she sizes up the other and tells herself how
      she'll beat her.
    - Then the clash: both skill names, a white flash, and both signature effects at once.
  - **What they think** depends on how well they know each other. There are lines for a
    particular rival (Spe and Suzuka, Teio and Rudolf or McQueen, Vodka and Scarlet, Grass
    and El, Oguri and Creek, Rice and McQueen, Urara and King Halo…), lines that name
    someone she knows (a teammate, her generation, her family), and lines in her own voice
    for a stranger.
  - **In the final third it is the Zone:** the sky darkens, light streams back from their
    eyes the whole way, and the clash brings out three effects. Each racer's own comes
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

## Letting her build her own deck

**Let her decide** (on her deck screen, and in the builder) asks two questions:

1. **How to spend**: Balanced, Expensive or Cheap. This sets how cost and rarity are
   weighed against each other.
2. **Which running style to build for**: Front Runner, Pace Chaser, Late Surger or Ender,
   listed lead to back. Her own style is the default, highlighted and marked *hers*, and
   Enter takes it. **Back** returns to the first question.

In a race she still runs her own style, which is who she is, so building for another one
is the trainer's experiment; the measurement below says what it costs. A deck built for a
style she does not run is named after it (*Front Runner Pick*, *Ender Expensive*), so it is
never mistaken for her own. The payout box says which style the deck was built for and
when its cards can be played.

The builder is `Stable.suggestDeck(racerId, focus, runStyle)` in `stable.js`.

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
