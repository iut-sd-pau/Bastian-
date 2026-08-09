(function () {
  const { COLORS, HOST_CODE } = window.PARTY_DATA;

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

  let currentGuestsObj = {};

  setupEventForm();
  setupAddGuestForm();
  setupImportButton();

  subscribeGuests((guestsObj) => {
    currentGuestsObj = guestsObj;
    const count = Object.keys(guestsObj).length;
    document.getElementById("count-pill").textContent = `${count} invité${count > 1 ? "s" : ""} · 7 équipes`;
    renderGroups(guestsObj);
    renderLinkTable(guestsObj);
  });

  function renderGroups(guestsObj) {
    const grid = document.getElementById("groups-grid");
    grid.innerHTML = "";
    COLORS.forEach((c) => {
      const entries = Object.entries(guestsObj).filter(([, g]) => g.colorKey === c.key);
      const card = document.createElement("div");
      card.className = "group-card";
      card.style.setProperty("--accent", c.hex);
      const membersHTML =
        entries
          .map(
            ([guestCode, g]) =>
              `<li>${escapeHTML(g.name)}<button class="remove-x" data-code="${escapeHTML(guestCode)}" title="Retirer">✕</button></li>`
          )
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
        const name = currentGuestsObj[guestCode]?.name || "cette personne";
        if (!confirm(`Retirer ${name} de la liste ?`)) return;
        try {
          await removeGuest(guestCode);
        } catch (e) {
          alert(e.message);
        }
      });
    });
  }

  function renderLinkTable(guestsObj) {
    const tbody = document.getElementById("link-table-body");
    tbody.innerHTML = "";
    const entries = Object.entries(guestsObj).sort((a, b) => a[1].name.localeCompare(b[1].name, "fr"));

    entries.forEach(([guestCode, g]) => {
      const color = colorByKey(g.colorKey);
      const link = buildLink("index.html", guestCode);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHTML(g.name)}</td>
        <td>${color ? `<span class="swatch" style="--dot:${color.hex}"><span class="swatch-dot"></span>${color.label}</span>` : "—"}</td>
        <td class="link-cell">${escapeHTML(link)}</td>
        <td><button class="copy-btn" data-link="${escapeHTML(link)}">Copier</button></td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".copy-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const link = btn.getAttribute("data-link");
        navigator.clipboard?.writeText(link).then(() => {
          const original = btn.textContent;
          btn.textContent = "Copié ✓";
          setTimeout(() => (btn.textContent = original), 1500);
        });
      });
    });
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
        const color = colorByKey(colorKey);
        status.textContent = `✓ ${name} ajouté·e — équipe ${color.label}.`;
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
