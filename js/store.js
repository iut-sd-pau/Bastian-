/* Couche de données Firebase : infos de la fête + liste des invités.
   Tout est en temps réel (on écoute les changements), pour que l'ajout
   ou la suppression d'un invité par l'anniversaireux se reflète tout
   de suite chez les invités qui ont leur page ouverte. */

const DB_ROOT = "colorParty2026";

function isFirebaseConfigured() {
  const cfg = window.FIREBASE_CONFIG || {};
  return Boolean(cfg.apiKey) && !String(cfg.apiKey).startsWith("REMPLACE_");
}

let firebaseReady = false;
function ensureFirebase() {
  if (!isFirebaseConfigured() || typeof firebase === "undefined") return false;
  if (!firebaseReady && !firebase.apps.length) {
    firebase.initializeApp(window.FIREBASE_CONFIG);
    firebaseReady = true;
  }
  return true;
}

function eventRef() {
  return firebase.database().ref(`${DB_ROOT}/event`);
}
function guestsRef() {
  return firebase.database().ref(`${DB_ROOT}/guests`);
}

/** Écoute les infos de la fête en direct. callback(event) à chaque changement. */
function subscribeEvent(callback) {
  const defaults = window.PARTY_DATA.DEFAULT_EVENT;
  if (!ensureFirebase()) {
    callback({ ...defaults });
    return () => {};
  }
  const ref = eventRef();
  const handler = (snap) => callback({ ...defaults, ...(snap.val() || {}) });
  ref.on("value", handler);
  return () => ref.off("value", handler);
}

async function saveEvent(data) {
  if (!ensureFirebase()) throw new Error("Firebase non configuré (js/firebase-config.js).");
  await eventRef().set(data);
}

/** Écoute la liste des invités en direct. callback(guestsObject) à chaque changement.
 *  guestsObject = { [code]: { name, colorKey } } */
function subscribeGuests(callback) {
  if (!ensureFirebase()) {
    callback({});
    return () => {};
  }
  const ref = guestsRef();
  const handler = (snap) => callback(snap.val() || {});
  ref.on("value", handler);
  return () => ref.off("value", handler);
}

function countByColor(guestsObj) {
  const { COLORS } = window.PARTY_DATA;
  const counts = {};
  COLORS.forEach((c) => (counts[c.key] = 0));
  Object.values(guestsObj || {}).forEach((g) => {
    if (g && counts[g.colorKey] !== undefined) counts[g.colorKey]++;
  });
  return counts;
}

/** Choisit la couleur la moins remplie (aléatoire entre les couleurs à égalité). */
function pickBalancedColor(guestsObj) {
  const { COLORS } = window.PARTY_DATA;
  const counts = countByColor(guestsObj);
  const min = Math.min(...COLORS.map((c) => counts[c.key]));
  const candidates = COLORS.filter((c) => counts[c.key] === min);
  return candidates[Math.floor(Math.random() * candidates.length)].key;
}

function makeGuestCode(name, existingCodes) {
  const base = slug(name) || "invite";
  let code;
  do {
    code = `${base}-${Math.floor(100 + Math.random() * 900)}`;
  } while (existingCodes.has(code));
  return code;
}

/** Ajoute un invité, lui attribue automatiquement la couleur la moins remplie. */
async function addGuest(name) {
  if (!ensureFirebase()) throw new Error("Firebase non configuré (js/firebase-config.js).");
  const cleanName = String(name || "").trim();
  if (!cleanName) throw new Error("Le nom ne peut pas être vide.");

  const snap = await guestsRef().get();
  const current = snap.val() || {};
  const existingCodes = new Set(Object.keys(current));
  const code = makeGuestCode(cleanName, existingCodes);
  const colorKey = pickBalancedColor(current);

  await guestsRef().child(code).set({ name: cleanName, colorKey });
  return { code, colorKey };
}

async function removeGuest(code) {
  if (!ensureFirebase()) throw new Error("Firebase non configuré (js/firebase-config.js).");
  await guestsRef().child(code).remove();
}

/** Importe en une fois les invités de INITIAL_GUESTS qui ne sont pas déjà présents (par nom). */
async function importInitialGuests(names) {
  if (!ensureFirebase()) throw new Error("Firebase non configuré (js/firebase-config.js).");
  const snap = await guestsRef().get();
  const current = snap.val() || {};
  const existingNames = new Set(
    Object.values(current).map((g) => (g.name || "").trim().toLowerCase())
  );
  let added = 0;
  for (const name of names) {
    if (existingNames.has(name.trim().toLowerCase())) continue;
    await addGuest(name);
    added++;
  }
  return added;
}

function firebaseStatusLabel() {
  return isFirebaseConfigured()
    ? "Connecté — synchronisation en direct"
    : "Non configuré — voir js/firebase-config.js";
}
