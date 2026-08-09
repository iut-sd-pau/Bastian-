/* ============================================================
   DATA.JS — configuration statique du site.
   Les invités et les infos de la fête, eux, sont gérés en direct
   depuis l'espace organisateur (host.html) et stockés dans Firebase
   (voir js/firebase-config.js) — ce n'est plus ici qu'il faut les
   modifier.
   ============================================================ */

// ---------- Les 7 couleurs d'équipe ----------
// L'ordre ici = l'ordre d'affichage partout sur le site.
const COLORS = [
  { key: "rouge", label: "Rouge", hex: "#c8465c" },
  { key: "jaune", label: "Jaune", hex: "#dba847" },
  { key: "vert", label: "Vert", hex: "#4f9e73" },
  { key: "bleuciel", label: "Bleu ciel", hex: "#4a8fae" },
  { key: "violet", label: "Violet", hex: "#8a63b0" },
  { key: "orange", label: "Orange", hex: "#cf7a3c" },
  { key: "rose", label: "Rose", hex: "#c96b93" },
];

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

window.PARTY_DATA = { COLORS, HOST_CODE, DEFAULT_EVENT, INITIAL_GUESTS };
