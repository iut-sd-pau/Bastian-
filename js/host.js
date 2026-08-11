(function () {
  const { HOST_CODE } = window.PARTY_DATA;

  const pageEl = document.getElementById("page");
  mountAmbientLights(pageEl);

  const code = getCodeFromURL();

  if (code !== HOST_CODE) {
    show("state-denied");
    return;
  }

  if (!isFirebaseConfigured()) {
    show("state-unconfigured");
    return;
  }

  show("state-dashboard");
  document.getElementById("firebase-status").textContent = firebaseStatusLabel();

  const generalLink = new URL("index.html", window.location.href).toString();
  document.getElementById("general-link").textContent = generalLink;
  document.getElementById("copy-general-link").addEventListener("click", (e) => {
    navigator.clipboard?.writeText(generalLink).then(() => {
      const btn = e.target;
      const original = btn.textContent;
      btn.textContent = "Copié ✓";
      setTimeout(() => (btn.textContent = original), 1500);
    });
  });

  let latestGuests = {};
  let latestColors = {};

  seedColorsIfEmpty();

  setupEventForm();
  setupAddGuestForm();
  setupImportButton();
  setupAddColorForm();

  subscribeColors((colorsObj) => {
    latestColors = colorsObj;
    renderColors();
    renderGroups();
  });

  subscribeGuests((guestsObj) => {
    latestGuests = guestsObj;
    const count = Object.keys(guestsObj).length;
    document.getElementById("count-pill").textContent = `${count} invité${count > 1 ? "s" : ""}`;
    renderGroups();
    renderColors();
    renderDrinksSummary();
  });

  function renderColors() {
    const grid = document.getElementById("colors-grid");
    grid.innerHTML = "";
    const counts = countByColor(latestGuests, latestColors);
    sortedColorEntries(latestColors).forEach(([key, c]) => {
      const count = counts[key] || 0;
      const card = document.createElement("div");
      card.className = "group-card";
      card.style.setProperty("--accent", c.hex);
      card.innerHTML = `
        <div class="row" style="justify-content:space-between;">
          <span class="swatch" style="--dot:${c.hex}"><span class="swatch-dot"></span>${escapeHTML(c.label)} · ${count}</span>
          ${count === 0 ? `<button class="btn--danger btn btn--sm remove-color-btn" data-key="${escapeHTML(key)}">Retirer</button>` : ""}
        </div>
      `;
      grid.appendChild(card);
    });

    grid.querySelectorAll(".remove-color-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const key = btn.getAttribute("data-key");
        if (!confirm("Retirer cette couleur d'équipe ?")) return;
        try {
          await removeColor(key);
        } catch (e) {
          alert(e.message);
        }
      });
    });
  }

  function renderGroups() {
    const grid = document.getElementById("groups-grid");
    grid.innerHTML = "";
    sortedColorEntries(latestColors).forEach(([key, c]) => {
      const entries = Object.entries(latestGuests).filter(([, g]) => g.colorKey === key);
      const card = document.createElement("div");
      card.className = "group-card";
      card.style.setProperty("--accent", c.hex);
      const membersHTML =
        entries
          .map(([guestCode, g]) => {
            const drinkIcon = g.drinks === true ? " 🍸" : g.drinks === false ? " 🙅" : "";
            return `<li>${escapeHTML(g.name)}${drinkIcon}<button class="remove-x" data-code="${escapeHTML(guestCode)}" title="Retirer">✕</button></li>`;
          })
          .join("") || `<li class="muted">Personne pour l'instant</li>`;
      card.innerHTML = `
        <span class="swatch" style="--dot:${c.hex}"><span class="swatch-dot"></span>${c.label} · ${entries.length}</span>
        <ul class="group-list" style="margin-top:10px;">${membersHTML}</ul>
      `;
      grid.appendChild(card);
    });

    grid.querySelectorAll(".remove-x").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const guestCode = btn.getAttribute("data-code");
        const name = latestGuests[guestCode]?.name || "cette personne";
        if (!confirm(`Retirer ${name} de la liste ?`)) return;
        try {
          await removeGuest(guestCode);
        } catch (e) {
          alert(e.message);
        }
      });
    });
  }

  function renderDrinksSummary() {
    const all = Object.values(latestGuests);
    const yes = all.filter((g) => g.drinks === true).length;
    const no = all.filter((g) => g.drinks === false).length;
    const pending = all.length - yes - no;
    document.getElementById("drinks-summary").textContent = all.length
      ? `🍸 ${yes} boivent · 🙅 ${no} ne boivent pas${pending ? ` · ❓ ${pending} pas encore répondu` : ""}`
      : "";
  }

  function setupAddGuestForm() {
    const form = document.getElementById("add-guest-form");
    const input = document.getElementById("new-guest-name");
    const status = document.getElementById("add-status");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = input.value.trim();
      if (!name) return;
      status.textContent = "Ajout en cours...";
      try {
        const { colorKey } = await addGuest(name);
        const color = latestColors[colorKey];
        status.textContent = `✓ ${name} ajouté·e — équipe ${color ? color.label : colorKey}.`;
        input.value = "";
        input.focus();
      } catch (err) {
        status.textContent = "⚠ " + err.message;
      }
    });
  }

  function setupImportButton() {
    const btn = document.getElementById("import-btn");
    const status = document.getElementById("import-status");
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      status.textContent = "Import en cours...";
      try {
        const added = await importInitialGuests(window.PARTY_DATA.INITIAL_GUESTS);
        status.textContent = added > 0 ? `✓ ${added} invité·e(s) importé·e(s).` : "Déjà tous présents.";
      } catch (err) {
        status.textContent = "⚠ " + err.message;
      } finally {
        btn.disabled = false;
      }
    });
  }

  function setupAddColorForm() {
    const form = document.getElementById("add-color-form");
    const labelInput = document.getElementById("new-color-label");
    const hexInput = document.getElementById("new-color-hex");
    const status = document.getElementById("add-color-status");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const label = labelInput.value.trim();
      if (!label) return;
      status.textContent = "Ajout en cours...";
      try {
        await addColor(label, hexInput.value);
        status.textContent = `✓ Couleur "${label}" ajoutée.`;
        labelInput.value = "";
      } catch (err) {
        status.textContent = "⚠ " + err.message;
      }
    });
  }

  function setupEventForm() {
    const form = document.getElementById("event-form");
    const saveStatus = document.getElementById("save-status");
    const saveBtn = document.getElementById("save-event-btn");
    let prefilled = false;
    let latest = {};

    subscribeEvent((event) => {
      latest = event;
      if (!prefilled) {
        prefilled = true;
        Object.entries(event).forEach(([key, val]) => {
          const field = form.elements.namedItem(key);
          if (field) field.value = val || "";
        });
      }
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = { ...latest };
      formData.forEach((val, key) => (data[key] = val));

      saveBtn.disabled = true;
      saveStatus.textContent = "Enregistrement...";
      try {
        await saveEvent(data);
        saveStatus.textContent = "✓ Enregistré — visible par tous les invités.";
      } catch (err) {
        saveStatus.textContent = "⚠ " + err.message;
      } finally {
        saveBtn.disabled = false;
      }
    });
  }

  function show(id) {
    document.querySelectorAll("#page > section").forEach((s) => s.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
  }
})();
