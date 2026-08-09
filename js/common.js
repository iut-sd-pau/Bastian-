/* Petits utilitaires partagés par toutes les pages */

function getCodeFromURL() {
  const params = new URLSearchParams(window.location.search);
  return (params.get("c") || "").trim().toLowerCase();
}

function buildLink(basePage, code) {
  const url = new URL(basePage, window.location.href);
  url.searchParams.set("c", code);
  return url.toString();
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[m]));
}

function slug(str) {
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function colorByKey(key) {
  return window.PARTY_DATA.COLORS.find((c) => c.key === key) || null;
}

/* Ambiance "lumières de bar" : quelques halos flous qui dérivent
   lentement en fond, dans les tons chauds + couleurs d'équipe. */
function mountAmbientLights(container, count = 9) {
  const { COLORS } = window.PARTY_DATA;
  const field = document.createElement("div");
  field.className = "ambient-field";
  const palette = ["#d8a94a", "#e07a3f", ...COLORS.map((c) => c.hex)];
  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    const color = palette[i % palette.length];
    const size = 140 + Math.random() * 220;
    el.className = "ambient-light";
    el.style.left = Math.random() * 100 + "vw";
    el.style.top = Math.random() * 100 + "vh";
    el.style.width = size + "px";
    el.style.height = size + "px";
    el.style.background = color;
    el.style.animationDuration = 18 + Math.random() * 16 + "s";
    el.style.animationDelay = -(Math.random() * 20) + "s";
    field.appendChild(el);
  }
  container.appendChild(field);
}
