/* ============================================================
   DATA.JS — configuration de démarrage.
   Les couleurs, les invités et les infos de la fête sont ensuite
   gérés en direct depuis l'espace organisateur (host.html) et
   stockés dans Firebase — ce n'est qu'un point de départ, servant
   aussi de valeurs par défaut si Firebase n'est pas encore configuré.
   ============================================================ */

// ---------- Couleurs d'équipe de départ ----------
// L'anniversaireux peut en ajouter d'autres depuis l'espace
// organisateur si le nombre d'invités grandit — ceci n'est que le
// point de départ (importé une seule fois dans Firebase).
const INITIAL_COLORS = {
  rouge: { label: "Rouge", hex: "#c8465c", order: 0 },
  jaune: { label: "Jaune", hex: "#dba847", order: 1 },
  vert: { label: "Vert", hex: "#4f9e73", order: 2 },
  bleuciel: { label: "Bleu ciel", hex: "#4a8fae", order: 3 },
  violet: { label: "Violet", hex: "#8a63b0", order: 4 },
  orange: { label: "Orange", hex: "#cf7a3c", order: 5 },
  rose: { label: "Rose", hex: "#c96b93", order: 6 },
};

// ---------- Code d'accès de l'anniversaireux ----------
// À garder secret, à donner uniquement à la personne fêtée.
// Son lien : host.html?c=hote-2026
const HOST_CODE = "hote-2026";

// ---------- Valeurs affichées tant que l'anniversaireux n'a rien renseigné ----------
const DEFAULT_EVENT = {
  hostFirstName: "",
  title: "Color Party",
  date: "Date à venir",
  time: "",
  address: "",
  addressNote: "",
  dressCode: "Un maximum de ta couleur d'équipe sur toi, le reste est libre.",
  rsvpNote: "Confirme ta présence en répondant au message qui t'a envoyé ce lien.",
  extraInfo: "",
};

// ---------- Liste de départ, pour import en un clic depuis l'espace organisateur ----------
const INITIAL_GUESTS = [
  "Roy", "Jérémie", "Nejla", "Noémie", "Yessi", "Antonio", "Steed", "Paul",
  "Anaïcka", "Hans", "Michel", "Michael", "Anaïs", "Elykia", "Kharl",
  "Moecha", "Ilan", "Mallaury", "Faïza", "Athalie", "Loïcia",
];

window.PARTY_DATA = { INITIAL_COLORS, HOST_CODE, DEFAULT_EVENT, INITIAL_GUESTS };

