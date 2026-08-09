(function () {
  const { COLORS, HOST_CODE } = window.PARTY_DATA;

  const pageEl = document.getElementById("page");
  mountAmbientLights(pageEl);

  const code = getCodeFromURL();

  if (code && code === HOST_CODE) {
    window.location.replace(buildLink("host.html", code));
    return;
  }

  if (!isFirebaseConfigured()) {
    show("state-unconfigured");
    return;
  }

  if (!code) {
    show("state-invalid");
    return;
  }

  let currentGuestsObj = {};
  let rendered = false;

  subscribeGuests((guestsObj) => {
    currentGuestsObj = guestsObj;
    const me = guestsObj[code];

    if (!me) {
      show("state-pending");
      return;
    }

    show("state-invite");
    if (!rendered) {
      rendered = true;
      document.getElementById("guest-name").textContent = me.name;
      wireGroupsToggle();
    }
    renderReveal(me);
    if (!document.getElementById("all-groups").classList.contains("hidden")) {
      renderAllGroups();
    }
  });

  subscribeEvent((event) => {
    document.getElementById("event-title").textContent = (event.title || "Color Party").toUpperCase();
    document.getElementById("host-line").textContent = event.hostFirstName
      ? `l'anniversaire de ${event.hostFirstName}`
      : "";
    fillEventInfo(document.getElementById("state-invite"), event);
  });

  function renderReveal(me) {
    const color = colorByKey(me.colorKey);
    if (!color) return;
    const card = document.getElementById("reveal-card");
    card.style.setProperty("--accent", color.hex);

    document.getElementById("reveal-color-name").textContent = color.label;
    document.getElementById("reveal-color-name").style.color = color.hex;

    const teammates = Object.values(currentGuestsObj).filter((g) => g.colorKey === me.colorKey);
    const list = document.getElementById("my-team-list");
    list.innerHTML = "";
    teammates.forEach((g) => {
      const li = document.createElement("li");
      li.textContent = g.name;
      if (g.name === me.name) li.classList.add("is-you");
      list.appendChild(li);
    });
  }

  function wireGroupsToggle() {
    document.getElementById("toggle-groups-btn").addEventListener("click", (e) => {
      const wrap = document.getElementById("all-groups");
      const willShow = wrap.classList.contains("hidden");
      wrap.classList.toggle("hidden");
      e.target.textContent = willShow
        ? "Cacher la composition des équipes"
        : "Voir la composition de toutes les équipes";
      if (willShow) renderAllGroups();
    });
  }

  function renderAllGroups() {
    const grid = document.getElementById("groups-grid");
    grid.innerHTML = "";
    const me = currentGuestsObj[code];
    COLORS.forEach((c) => {
      const members = Object.values(currentGuestsObj).filter((g) => g.colorKey === c.key);
      const card = document.createElement("div");
      card.className = "group-card";
      card.style.setProperty("--accent", c.hex);
      const membersHTML = members
        .map((g) => `<li${me && g.name === me.name ? ' class="is-you"' : ""}>${escapeHTML(g.name)}</li>`)
        .join("") || `<li class="muted">Personne pour l'instant</li>`;
      card.innerHTML = `
        <span class="swatch" style="--dot:${c.hex}"><span class="swatch-dot"></span>${c.label} · ${members.length}</span>
        <ul class="group-list" style="margin-top:10px;">${membersHTML}</ul>
      `;
      grid.appendChild(card);
    });
  }

  function show(id) {
    document.querySelectorAll("#page > section").forEach((s) => s.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
  }
})();

/* Remplit les champs [data-event] à partir d'un objet event donné. */
function fillEventInfo(root, event) {
  root.querySelectorAll("[data-event]").forEach((node) => {
    const key = node.getAttribute("data-event");
    const val = event[key];
    if (val) {
      node.textContent = val;
      node.closest(".info-item")?.classList.remove("hidden");
    } else if (node.hasAttribute("data-hide-if-empty")) {
      node.closest(".info-item")?.classList.add("hidden");
    }
  });
}
