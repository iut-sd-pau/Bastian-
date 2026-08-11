(function () {
  const IDENTITY_KEY = "colorparty_me";

  const pageEl = document.getElementById("page");
  mountAmbientLights(pageEl);

  if (!isFirebaseConfigured()) {
    show("state-unconfigured");
    return;
  }

  let latestGuests = {};
  let latestColors = {};
  let identifiedCode = localStorage.getItem(IDENTITY_KEY) || null;
  let inviteRendered = false;

  subscribeEvent((event) => {
    const title = (event.title || "Color Party").toUpperCase();
    const hostLine = event.hostFirstName ? `l'anniversaire de ${event.hostFirstName}` : "";
    document.getElementById("event-title").textContent = title;
    document.getElementById("host-line").textContent = hostLine;
    document.getElementById("identify-title").textContent = title;
    document.getElementById("identify-host-line").textContent = hostLine;
    fillEventInfo(document.getElementById("state-invite"), event);
  });

  subscribeColors((colorsObj) => {
    latestColors = colorsObj;
    if (identifiedCode && latestGuests[identifiedCode]) renderInvite();
  });

  subscribeGuests((guestsObj) => {
    latestGuests = guestsObj;
    updateNameSuggestions(guestsObj);
    resolveView();
  });

  function resolveView() {
    if (identifiedCode && latestGuests[identifiedCode]) {
      show("state-invite");
      renderInvite();
    } else if (identifiedCode && !latestGuests[identifiedCode]) {
      show("state-pending");
    } else {
      show("state-identify");
    }
  }

  function updateNameSuggestions(guestsObj) {
    const list = document.getElementById("guest-names");
    list.innerHTML = "";
    Object.values(guestsObj)
      .map((g) => g.name)
      .sort((a, b) => a.localeCompare(b, "fr"))
      .forEach((name) => {
        const opt = document.createElement("option");
        opt.value = name;
        list.appendChild(opt);
      });
  }

  document.getElementById("identify-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("identify-input");
    const status = document.getElementById("identify-status");
    const name = input.value.trim();
    if (!name) return;

    const found = findGuestByName(latestGuests, name);
    if (!found) {
      status.textContent = "Prénom introuvable — vérifie l'orthographe, ou demande à être ajouté·e.";
      return;
    }
    const [code] = found;
    identifiedCode = code;
    localStorage.setItem(IDENTITY_KEY, code);
    status.textContent = "";
    input.value = "";
    resolveView();
  });

  document.getElementById("reidentify-btn").addEventListener("click", resetIdentity);
  document.getElementById("change-identity-btn").addEventListener("click", resetIdentity);

  function resetIdentity() {
    identifiedCode = null;
    localStorage.removeItem(IDENTITY_KEY);
    resolveView();
  }

  function renderInvite() {
    const me = latestGuests[identifiedCode];
    if (!me) return;

    if (!inviteRendered) {
      inviteRendered = true;
      document.getElementById("guest-name").textContent = me.name;
      wireGroupsToggle();
      wireDrinksButtons();
    }

    renderReveal(me);
    updateDrinksUI(me);
    if (!document.getElementById("all-groups").classList.contains("hidden")) {
      renderAllGroups(me);
    }
  }

  function renderReveal(me) {
    const color = latestColors[me.colorKey];
    if (!color) return;
    const card = document.getElementById("reveal-card");
    card.style.setProperty("--accent", color.hex);

    const nameEl = document.getElementById("reveal-color-name");
    nameEl.textContent = color.label;
    nameEl.style.color = color.hex;

    const teammates = Object.values(latestGuests).filter((g) => g.colorKey === me.colorKey);
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
      if (willShow) renderAllGroups(latestGuests[identifiedCode]);
    });
  }

  function renderAllGroups(me) {
    const grid = document.getElementById("groups-grid");
    grid.innerHTML = "";
    sortedColorEntries(latestColors).forEach(([key, c]) => {
      const members = Object.values(latestGuests).filter((g) => g.colorKey === key);
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

  function wireDrinksButtons() {
    document.getElementById("drinks-yes").addEventListener("click", () => saveDrinks(true));
    document.getElementById("drinks-no").addEventListener("click", () => saveDrinks(false));
  }

  async function saveDrinks(value) {
    const status = document.getElementById("drinks-status");
    status.textContent = "Enregistrement...";
    try {
      await setDrinks(identifiedCode, value);
      status.textContent = "✓ Enregistré, merci !";
    } catch (err) {
      status.textContent = "⚠ " + err.message;
    }
  }

  function updateDrinksUI(me) {
    const yesBtn = document.getElementById("drinks-yes");
    const noBtn = document.getElementById("drinks-no");
    yesBtn.classList.toggle("is-selected", me.drinks === true);
    noBtn.classList.toggle("is-selected", me.drinks === false);
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
