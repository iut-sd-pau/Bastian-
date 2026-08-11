/* Couche de données Firebase : couleurs, infos de la fête, invités
   (avec préférence alcool). Tout est en temps réel. */

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

function eventRef() { return firebase.database().ref(`${DB_ROOT}/event`); }
function guestsRef() { return firebase.database().ref(`${DB_ROOT}/guests`); }
function colorsRef() { return firebase.database().ref(`${DB_ROOT}/colors`); }

/* ---------------- Événement ---------------- */

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

/* ---------------- Couleurs ---------------- */

/** Si aucune couleur n'existe encore dans Firebase, y importe les 7 de départ. */
async function seedColorsIfEmpty() {
  if (!ensureFirebase()) return;
  const snap = await colorsRef().get();
  if (!snap.exists()) {
    await colorsRef().set(window.PARTY_DATA.INITIAL_COLORS);
  }
}

function subscribeColors(callback) {
  if (!ensureFirebase()) {
    callback({ ...window.PARTY_DATA.INITIAL_COLORS });
    return () => {};
  }
  const ref = colorsRef();
  const handler = (snap) => callback(snap.val() || {});
  ref.on("value", handler);
  return () => ref.off("value", handler);
}

function sortedColorEntries(colorsObj) {
  return Object.entries(colorsObj || {}).sort((a, b) => (a[1].order ?? 0) - (b[1].order ?? 0));
}

/** Ajoute une nouvelle couleur d'équipe (nom + hex), retourne sa clé. */
async function addColor(label, hex) {
  if (!ensureFirebase()) throw new Error("Firebase non configuré (js/firebase-config.js).");
  const cleanLabel = String(label || "").trim();
  if (!cleanLabel) throw new Error("Donne un nom à la couleur.");

  const snap = await colorsRef().get();
  const current = snap.val() || {};
  let key = slug(cleanLabel) || "couleur";
  let i = 2;
  while (current[key]) key = `${slug(cleanLabel)}${i++}`;

  const maxOrder = Object.values(current).reduce((m, c) => Math.max(m, c.order ?? 0), -1);
  await colorsRef().child(key).set({ label: cleanLabel, hex: hex || "#c8a24a", order: maxOrder + 1 });
  return key;
}

/** Supprime une couleur — l'appelant doit vérifier qu'elle n'a plus personne dedans. */
async function removeColor(key) {
  if (!ensureFirebase()) throw new Error("Firebase non configuré (js/firebase-config.js).");
  await colorsRef().child(key).remove();
}

/* ---------------- Invités ---------------- */

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

function countByColor(guestsObj, colorsObj) {
  const counts = {};
  Object.keys(colorsObj || {}).forEach((key) => (counts[key] = 0));
  Object.values(guestsObj || {}).forEach((g) => {
    if (g && counts[g.colorKey] !== undefined) counts[g.colorKey]++;
  });
  return counts;
}

/** Choisit la couleur la moins remplie parmi les couleurs existantes (aléatoire si égalité). */
function pickBalancedColor(guestsObj, colorsObj) {
  const keys = Object.keys(colorsObj || {});
  if (keys.length === 0) throw new Error("Aucune couleur d'équipe n'existe encore.");
  const counts = countByColor(guestsObj, colorsObj);
  const min = Math.min(...keys.map((k) => counts[k]));
  const candidates = keys.filter((k) => counts[k] === min);
  return candidates[Math.floor(Math.random() * candidates.length)];
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

  const [guestsSnap, colorsSnap] = await Promise.all([guestsRef().get(), colorsRef().get()]);
  const currentGuests = guestsSnap.val() || {};
  const currentColors = colorsSnap.val() || {};
  const existingCodes = new Set(Object.keys(currentGuests));
  const code = makeGuestCode(cleanName, existingCodes);
  const colorKey = pickBalancedColor(currentGuests, currentColors);

  await guestsRef().child(code).set({ name: cleanName, colorKey, drinks: null });
  return { code, colorKey };
}

async function removeGuest(code) {
  if (!ensureFirebase()) throw new Error("Firebase non configuré (js/firebase-config.js).");
  await guestsRef().child(code).remove();
}

/** Enregistre la réponse à la question alcool pour un invité (true / false). */
async function setDrinks(code, drinks) {
  if (!ensureFirebase()) throw new Error("Firebase non configuré (js/firebase-config.js).");
  await guestsRef().child(code).update({ drinks });
}

/** Cherche un invité par prénom exact (insensible à la casse/accents). Retourne [code, guest] ou null. */
function findGuestByName(guestsObj, name) {
  const target = slug(name);
  const entry = Object.entries(guestsObj || {}).find(([, g]) => slug(g.name) === target);
  return entry || null;
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
