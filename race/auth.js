/*
 * Accounts.
 *
 * Real registration and sign-in against a persisted account store, with each account
 * owning its own save data. Previously a "profile" was one object that any new name
 * overwrote, and every trainer shared a single stable -- so switching trainers did not
 * switch anything. Accounts are now keyed by id, and `Auth.saveKey()` namespaces the
 * racer/deck save per account.
 *
 * On passwords: this is browser localStorage. Anyone with the machine and devtools can
 * read the store, so this is NOT a security boundary and should never be treated as one.
 * It is salted SHA-256 rather than plaintext for one practical reason -- people reuse
 * passwords, and a local game has no business keeping one in the clear.
 *
 * Exposes Auth. All credential calls are async (SubtleCrypto).
 */
(function (root) {
  "use strict";

  const ACCOUNTS_KEY = "postparade.accounts";
  const SESSION_KEY  = "postparade.session";
  const LEGACY_KEYS  = { profile: "postparade.profile", save: "postparade.v1" };

  const read = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  const store = () => read(ACCOUNTS_KEY) || {};
  const persist = a => write(ACCOUNTS_KEY, a);

  const norm = u => String(u || "").trim().toLowerCase();
  const uid = () => "acc_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // ---------------------------------------------------------------- hashing
  function randomSalt() {
    const b = new Uint8Array(16);
    (root.crypto || {}).getRandomValues
      ? root.crypto.getRandomValues(b)
      : b.forEach((_, i) => b[i] = (Math.random() * 256) | 0);
    return Array.from(b, x => x.toString(16).padStart(2, "0")).join("");
  }

  async function hash(password, salt) {
    const data = new TextEncoder().encode(salt + "|" + password);
    if (root.crypto && root.crypto.subtle) {
      const buf = await root.crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(buf), x => x.toString(16).padStart(2, "0")).join("");
    }
    // file:// or an ancient browser -- degrade rather than refuse to run
    let h = 0;
    for (const c of salt + "|" + password) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
    return "weak:" + (h >>> 0).toString(16);
  }

  // ---------------------------------------------------------------- validation
  function checkUsername(user, accounts) {
    const u = String(user || "").trim();
    if (u.length < 3) return "Username needs at least 3 characters.";
    if (u.length > 16) return "Username can be at most 16 characters.";
    if (!/^[a-zA-Z0-9 _-]+$/.test(u)) return "Letters, numbers, spaces, - and _ only.";
    if (Object.values(accounts || store()).some(a => norm(a.user) === norm(u)))
      return "That username is already taken.";
    return null;
  }
  function checkPassword(pw) {
    if (String(pw || "").length < 4) return "Password needs at least 4 characters.";
    if (String(pw).length > 64) return "That password is too long.";
    return null;
  }

  // ---------------------------------------------------------------- api
  function list() {
    return Object.values(store())
      .map(a => ({ id: a.id, user: a.user, emblem: a.emblem, races: a.races || 0,
                   wins: a.wins || 0, lastLogin: a.lastLogin || a.created }))
      .sort((x, y) => (y.lastLogin || 0) - (x.lastLogin || 0));
  }

  async function register(user, password, emblem) {
    const accounts = store();
    const uErr = checkUsername(user, accounts);
    if (uErr) return { ok: false, error: uErr, field: "user" };
    const pErr = checkPassword(password);
    if (pErr) return { ok: false, error: pErr, field: "pass" };

    const salt = randomSalt();
    const acc = {
      id: uid(), user: String(user).trim(), salt, hash: await hash(password, salt),
      emblem: emblem || "turf", created: Date.now(), lastLogin: Date.now(),
      races: 0, wins: 0, seenIntro: false, seenTutorial: false,
    };
    accounts[acc.id] = acc;
    persist(accounts);
    write(SESSION_KEY, acc.id);
    return { ok: true, account: publicOf(acc) };
  }

  async function login(user, password) {
    const accounts = store();
    const acc = Object.values(accounts).find(a => norm(a.user) === norm(user));
    // deliberately the same message for both cases -- do not confirm which names exist
    const bad = { ok: false, error: "Username or password is incorrect.", field: "pass" };
    if (!acc) return bad;
    if (await hash(password, acc.salt) !== acc.hash) return bad;
    acc.lastLogin = Date.now();
    persist(accounts);
    write(SESSION_KEY, acc.id);
    return { ok: true, account: publicOf(acc) };
  }

  const publicOf = a => a && ({
    id: a.id, user: a.user, emblem: a.emblem, races: a.races || 0, wins: a.wins || 0,
    seenIntro: !!a.seenIntro, seenTutorial: !!a.seenTutorial,
    created: a.created, lastLogin: a.lastLogin,
    trainer: a.trainer || null,                        // the trainer's looks (trainer.js), once made
  });

  function current() {
    const id = read(SESSION_KEY);
    const acc = id && store()[id];
    return acc ? publicOf(acc) : null;
  }

  function logout() { try { localStorage.removeItem(SESSION_KEY); } catch (e) {} }

  /** Merge fields into the signed-in account (career stats, tutorial flags, emblem). */
  function update(patch) {
    const id = read(SESSION_KEY);
    const accounts = store();
    if (!id || !accounts[id]) return null;
    Object.assign(accounts[id], patch || {});
    persist(accounts);
    return publicOf(accounts[id]);
  }

  /** Where this account's racers and decks live. Each account keeps its own stable. */
  function saveKey() {
    const id = read(SESSION_KEY);
    return id ? "postparade.save." + id : "postparade.save.guest";
  }

  function removeAccount(id) {
    const accounts = store();
    if (!accounts[id]) return false;
    delete accounts[id];
    persist(accounts);
    try { localStorage.removeItem("postparade.save." + id); } catch (e) {}
    if (read(SESSION_KEY) === id) logout();
    return true;
  }

  /**
   * One-time lift of the pre-accounts save. The old build kept a single `profile` and a
   * single shared stable; if they are still there, hand them to the first account created
   * so nobody loses the racers they levelled.
   */
  function claimLegacyData(accountId) {
    const legacySave = read(LEGACY_KEYS.save);
    if (legacySave && Object.keys(legacySave).length) {
      const dest = "postparade.save." + accountId;
      if (!read(dest)) write(dest, legacySave);
    }
    try {
      localStorage.removeItem(LEGACY_KEYS.profile);
      localStorage.removeItem(LEGACY_KEYS.save);
    } catch (e) {}
  }
  const hasLegacyData = () => {
    const s = read(LEGACY_KEYS.save);
    return !!(s && Object.keys(s).length);
  };

  const api = { list, register, login, logout, current, update, saveKey,
                removeAccount, checkUsername, checkPassword,
                claimLegacyData, hasLegacyData };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Auth = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
