/*
 * Settings.
 *
 * Device-level preferences, not account data: they describe how this machine should
 * present the game, so switching trainers does not change them. Persisted to
 * `postparade.settings`.
 *
 * Everything here has to be honoured by something concrete -- a toggle that changes
 * nothing is worse than no toggle. Each entry names what reads it.
 *
 * Exposes Settings.
 */
(function (root) {
  "use strict";

  const KEY = "postparade.settings";

  const DEFS = [
    { id: "raceSpeed", label: "Default race speed", type: "choice", def: 1,
      choices: [[1, "1×"], [2, "2×"], [4, "4×"]],
      help: "Speed a race starts at. You can still change it mid-race." },

    { id: "cutscenes", label: "Skill cutscenes", type: "toggle", def: true,
      help: "A short cutscene when a racer's signature skill fires. The race waits for it; click to skip." },

    /* Read by index.html's cutscene(). A separate choice rather than turning the toggle
       into one, so a saved true/false keeps meaning what it meant. */
    { id: "cutsceneWho", label: "Cutscenes for", type: "choice", def: "all",
      choices: [["all", "All racers"], ["mine", "Only mine"]],
      help: "Whose signature skills get a cutscene. A rival's is shorter than yours." },

    /* Read by index.html's preRace(). The fanfare is the real game's, and as long. */
    { id: "raceIntro", label: "Pre-race fanfare", type: "toggle", def: true,
      help: "The fanfare and a camera sweep over the field in the gate before the start. Click to skip it any time." },

    { id: "effects", label: "Sparkles and confetti", type: "toggle", def: true,
      help: "Celebration effects on wins, level-ups and card plays." },

    { id: "shake", label: "Screen shake", type: "toggle", def: true,
      help: "A jolt at the finish. Turn off if it bothers you." },

    { id: "textSpeed", label: "Dialogue speed", type: "choice", def: 18,
      choices: [[34, "Relaxed"], [18, "Normal"], [7, "Fast"], [0, "Instant"]],
      help: "How quickly story and tutorial text types out." },

    { id: "showHints", label: "Callout hints", type: "toggle", def: true,
      help: "The line under the Callout button telling you whether now is the moment." },

    { id: "confirmQuit", label: "Confirm before quitting a race", type: "toggle", def: true,
      help: "Ask before abandoning a race in progress." },

    /* Read by sound.js. Choices rather than a slider because the settings panel has no
       slider control, and four steps is plenty for background music. */
    { id: "musicVolume", label: "Music", type: "choice", def: 0.55,
      choices: [[0, "Off"], [0.3, "Quiet"], [0.55, "Normal"], [0.85, "Loud"]],
      help: "Background music on menus, career turns and races." },

    { id: "sfxVolume", label: "Sound effects", type: "choice", def: 0.7,
      choices: [[0, "Off"], [0.4, "Quiet"], [0.7, "Normal"], [1, "Loud"]],
      help: "Race stings, the field running and the crowd." },

    /* Read by caller.js. */
    { id: "raceCaller", label: "Race caller", type: "toggle", def: true,
      help: "The race called in captions under the action: the break, the leader, the final turn, the finish." },

    /* Read by sound.js: the track picked at the jukebox in the lobby's main hall, played in
       place of the home theme ("" for the academy's own). It is chosen at the jukebox, not
       on the settings screen, so `hidden` keeps it off that list. */
    { id: "jukebox", label: "Lobby music", type: "choice", def: "", choices: [], hidden: true,
      help: "Chosen at the jukebox in the main hall." },
  ];

  const defaults = () => {
    const o = {};
    for (const d of DEFS) o[d.id] = d.def;
    return o;
  };

  let cache = null;
  /* What a save is written as. Saves before version 2 hold raceSpeed 2 for everyone who
     changed any setting at all -- set() writes them all -- so the old default cannot be
     told from a choice; those go back to the default (now 1x), once. */
  const VERSION = 2;

  function all() {
    if (cache) return cache;
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (saved && saved._v !== VERSION) delete saved.raceSpeed;
    cache = Object.assign(defaults(), saved || {});
    return cache;
  }
  const get = id => all()[id];

  function set(id, value) {
    const s = all();
    s[id] = value;
    try { localStorage.setItem(KEY, JSON.stringify({ ...s, _v: VERSION })); } catch (e) {}
    apply();
    for (const fn of listeners) fn(id, value);
    return value;
  }

  function reset() {
    cache = defaults();
    try { localStorage.setItem(KEY, JSON.stringify({ ...cache, _v: VERSION })); } catch (e) {}
    apply();
    for (const fn of listeners) fn(null, null);
  }

  const listeners = [];
  const onChange = fn => listeners.push(fn);

  /** Reflect settings that CSS can act on directly. */
  function apply() {
    const s = all();
    const r = document.documentElement;
    if (!r) return;
    r.classList.toggle("no-fx", !s.effects);
    r.classList.toggle("no-shake", !s.shake);
  }

  const api = { DEFS, all, get, set, reset, onChange, apply, defaults };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Settings = api;
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply);
    else apply();
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
