/**
 * ===================================================================
 * GESTOR DE CONFIRMACIÓN DE ASISTENCIA (asistencia.js)
 * Sincronizado con Firebase Firestore & Doble Confirmación
 * ===================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  initAsistenciaForm();
  initCompanionsSystem();
  initAllergyToggle();
});

let dbInstance = null;
let pendingConfirmationData = null;

function normalizeGuestName(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

async function hasDuplicateGuestName(data) {
  const submittedNames = [data.fullName, ...(data.companions || []).map(companion => companion.name)]
    .map(normalizeGuestName)
    .filter(Boolean);

  if (new Set(submittedNames).size !== submittedNames.length) {
    return true;
  }

  let existingRecords = [];
  if (dbInstance && typeof ENABLE_FIREBASE !== "undefined" && ENABLE_FIREBASE) {
    const collectionName = typeof FIRESTORE_COLLECTION !== "undefined" ? FIRESTORE_COLLECTION : "confirmaciones_boda";
    const snapshot = await dbInstance.collection(collectionName).get();
    snapshot.forEach(doc => existingRecords.push(doc.data()));
  } else {
    existingRecords = JSON.parse(localStorage.getItem("confirmaciones_boda") || "[]");
  }

  const existingNames = new Set();
  existingRecords.forEach(record => {
    if (record.fullName) existingNames.add(normalizeGuestName(record.fullName));
    (record.companions || []).forEach(companion => existingNames.add(normalizeGuestName(companion.name)));
  });
  return submittedNames.some(name => existingNames.has(name));
}

async function setupFirebaseIfAvailable() {
  if (typeof ENABLE_FIREBASE !== "undefined" && ENABLE_FIREBASE && typeof firebase !== "undefined") {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
      dbInstance = firebase.firestore();
      console.log("Firebase Firestore inicializado.");
    } catch (err) {
      console.error("Error al inicializar Firebase:", err);
    }
  }
}

/**
 * 1. Control de Acompañantes (Segmented Buttons: Pareja / Adulto vs Niño / Niña)
 */
function initCompanionsSystem() {
  const companionCheckbox = document.getElementById("hasCompanion");
  const companionsBlock = document.getElementById("companions-block");
  const addBtn = document.getElementById("btn-add-companion");
  const container = document.getElementById("companions-list");

  if (!companionCheckbox || !companionsBlock || !addBtn || !container) return;

  companionCheckbox.addEventListener("change", (e) => {
    if (e.target.checked) {
      companionsBlock.classList.add("active");
      if (container.children.length === 0) {
        addCompanionRow();
      }
    } else {
      companionsBlock.classList.remove("active");
      container.innerHTML = "";
    }
  });

  addBtn.addEventListener("click", () => {
    addCompanionRow();
  });

  function addCompanionRow() {
    const count = container.children.length + 1;
    const row = document.createElement("div");
    row.className = "companion-row-item";
    row.innerHTML = `
      <div class="companion-row-header">
        <span class="companion-num-tag">Acompañante #${count}</span>
        <button type="button" class="btn-del-companion" title="Eliminar acompañante">Eliminar &times;</button>
      </div>
      <div class="companion-inputs-grid">
        <input type="text" class="form-input companion-name" placeholder="Nombre y apellidos" required autocomplete="off" />
        
        <div class="companion-type-selector-wrapper">
          <input type="hidden" class="companion-type-val" value="pareja" />
          <div class="companion-type-segmented">
            <button type="button" class="type-pill-btn active" data-type="pareja">
              <span class="inline-svg-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 0a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2m-1 0v-2a5 5 0 0 1 5-5h1a5 5 0 0 1 5 5v2"/></svg></span><span>Pareja / Adulto</span>
            </button>
            <button type="button" class="type-pill-btn" data-type="niño">
              <span class="inline-svg-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 22a8 8 0 0 1 16 0M9 4 7 2m8 2 2-2"/></svg></span><span>Niño / Niña</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Manejar el toggle segmentado sin select nativo
    const typeButtons = row.querySelectorAll(".type-pill-btn");
    const hiddenVal = row.querySelector(".companion-type-val");

    typeButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        typeButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        if (hiddenVal) {
          hiddenVal.value = btn.getAttribute("data-type");
        }
      });
    });

    row.querySelector(".btn-del-companion").addEventListener("click", () => {
      row.remove();
      updateCompanionNumbers();
      if (container.children.length === 0) {
        companionCheckbox.checked = false;
        companionsBlock.classList.remove("active");
      }
    });

    container.appendChild(row);
  }

  function updateCompanionNumbers() {
    Array.from(container.children).forEach((row, idx) => {
      const tag = row.querySelector(".companion-num-tag");
      if (tag) tag.textContent = `Acompañante #${idx + 1}`;
    });
  }
}

/**
 * 2. Control de Alergias e Intolerancias
 */
function initAllergyToggle() {
  const allergyCheck = document.getElementById("hasAllergies");
  const allergyBox = document.getElementById("allergy-details-box");
  const allergyInput = document.getElementById("dietaryDetails");

  if (!allergyCheck || !allergyBox) return;

  allergyCheck.addEventListener("change", (e) => {
    if (e.target.checked) {
      allergyBox.classList.add("active");
      if (allergyInput) allergyInput.focus();
    } else {
      allergyBox.classList.remove("active");
      if (allergyInput) allergyInput.value = "";
    }
  });
}

/**
 * 3. Envío del Formulario & Doble Confirmación
 */
function initAsistenciaForm() {
  const form = document.getElementById("form-asistencia");
  const submitBtn = document.getElementById("btn-submit-asistencia");
  const statusMsg = document.getElementById("asistencia-status-msg");

  // Modales
  const reviewModal = document.getElementById("asistencia-review-modal");
  const reviewContent = document.getElementById("review-summary-content");
  const btnCancelReview = document.getElementById("btn-cancel-review");
  const btnConfirmFinal = document.getElementById("btn-confirm-final");

  if (!form) return;

  setupFirebaseIfAvailable();

  // Controlar campos si marca "Sí" o "No"
  const attendanceRadios = form.querySelectorAll('input[name="attendance"]');
  const extraYesFields = document.getElementById("attendance-extra-fields");
  const extraNoFields = document.getElementById("decline-extra-fields");

  attendanceRadios.forEach(radio => {
    radio.addEventListener("change", (e) => {
      if (e.target.value === "no") {
        if (extraYesFields) extraYesFields.style.display = "none";
        if (extraNoFields) extraNoFields.style.display = "block";
      } else {
        if (extraYesFields) extraYesFields.style.display = "flex";
        if (extraNoFields) extraNoFields.style.display = "none";
      }
    });
  });

  // Interceptar submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const attendanceVal = formData.get("attendance") || "yes";
    const hasCompanion = document.getElementById("hasCompanion")?.checked || false;
    const hasAllergies = document.getElementById("hasAllergies")?.checked || false;

    // Recoger acompañantes
    const companions = [];
    if (hasCompanion && attendanceVal === "yes") {
      document.querySelectorAll(".companion-row-item").forEach(row => {
        const name = row.querySelector(".companion-name")?.value.trim();
        const type = row.querySelector(".companion-type-val")?.value || "pareja";
        if (name) {
          companions.push({ name, type });
        }
      });
    }

    const data = {
      id: "conf_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      fullName: (formData.get("fullName") || "").trim(),
      attendance: attendanceVal,
      hasCompanion: hasCompanion,
      companionsCount: companions.length,
      companions: companions,
      hasAllergies: hasAllergies,
      allergiesDetails: hasAllergies ? (formData.get("dietaryDetails") || "").trim() : "Ninguna",
      dedication: (formData.get("declineMessage") || "").trim(),
      createdAt: new Date().toISOString()
    };

    pendingConfirmationData = data;

    // Si ASISTE: mostrar DOBLE CONFIRMACIÓN con resumen
    if (attendanceVal === "yes") {
      showReviewModal(data);
    } else {
      // Si NO asiste: guardar directamente
      executeFinalSubmit(data);
    }
  });

  // Botón cancelar en la doble confirmación
  if (btnCancelReview) {
    btnCancelReview.addEventListener("click", () => {
      if (reviewModal) reviewModal.classList.remove("active");
    });
  }

  // Botón confirmar definitivamente
  if (btnConfirmFinal) {
    btnConfirmFinal.addEventListener("click", () => {
      if (reviewModal) reviewModal.classList.remove("active");
      if (pendingConfirmationData) {
        executeFinalSubmit(pendingConfirmationData);
      }
    });
  }

  function showReviewModal(data) {
    if (!reviewModal || !reviewContent) return;

    let companionsSummary = `<span style="color: var(--text-muted);">Sin acompañantes (1 persona en total)</span>`;
    if (data.companions.length > 0) {
      companionsSummary = `
        <div style="margin-top: 0.3rem;">
          ${data.companions.map(c => `
            <span class="review-companion-badge">
              <span class="inline-svg-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M5 22a7 7 0 0 1 14 0"/></svg></span> ${c.type === 'niño' ? 'Niño/a:' : 'Pareja/Adulto:'} <strong>${c.name}</strong>
            </span>
          `).join("")}
        </div>
        <div style="font-size: 0.85rem; color: var(--gold-light); margin-top: 0.4rem;">
          Total grupo: <strong>${1 + data.companions.length} personas</strong>
        </div>
      `;
    }

    let allergySummary = `<span style="color: var(--text-muted);">Ninguna</span>`;
    if (data.hasAllergies && data.allergiesDetails) {
      allergySummary = `<strong style="color: #f39c12;"><span class="inline-svg-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m12 3 10 18H2L12 3zm0 6v5m0 3h.01"/></svg></span> ${data.allergiesDetails}</strong>`;
    }

    reviewContent.innerHTML = `
      <div class="review-item-row">
        <span class="review-label">Titular Principal</span>
        <span class="review-val"><strong>${data.fullName}</strong></span>
      </div>
      <div class="review-item-row">
        <span class="review-label">¿Asistirás?</span>
        <span class="review-val" style="color: #2ecc71;">✓ Sí, asistiré</span>
      </div>
      <div class="review-item-row">
        <span class="review-label">Acompañantes</span>
        <div class="review-val">${companionsSummary}</div>
      </div>
      <div class="review-item-row">
        <span class="review-label">Alergias o Intolerancias</span>
        <div class="review-val">${allergySummary}</div>
      </div>
    `;

    reviewModal.classList.add("active");
  }

  async function executeFinalSubmit(confirmationData) {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Registrando confirmación...</span>`;
    }

    try {
      if (await hasDuplicateGuestName(confirmationData)) {
        throw new Error("DUPLICATE_GUEST_NAME");
      }
      if (dbInstance && typeof ENABLE_FIREBASE !== "undefined" && ENABLE_FIREBASE) {
        const collectionName = typeof FIRESTORE_COLLECTION !== "undefined" ? FIRESTORE_COLLECTION : "confirmaciones_boda";
        await dbInstance.collection(collectionName).add(confirmationData);
        console.log("✅ Confirmación guardada en Firebase Firestore:", confirmationData);
      }

      // Guardar también copia local por respaldo
      try {
        const backup = JSON.parse(localStorage.getItem("confirmaciones_boda") || "[]");
        backup.push(confirmationData);
        localStorage.setItem("confirmaciones_boda", JSON.stringify(backup));
      } catch (e) {}

      showSuccessModal(confirmationData);
      form.reset();

      // Resetear estados dinámicos
      const companionsBlock = document.getElementById("companions-block");
      const allergyBox = document.getElementById("allergy-details-box");
      const extraYes = document.getElementById("attendance-extra-fields");
      const extraNo = document.getElementById("decline-extra-fields");
      if (companionsBlock) companionsBlock.classList.remove("active");
      if (allergyBox) allergyBox.classList.remove("active");
      if (extraYes) extraYes.style.display = "flex";
      if (extraNo) extraNo.style.display = "none";
      const companionsList = document.getElementById("companions-list");
      if (companionsList) companionsList.innerHTML = "";
    } catch (err) {
      console.error("Error al registrar asistencia:", err);
      if (statusMsg) {
        statusMsg.textContent = err.message === "DUPLICATE_GUEST_NAME"
          ? "Ese nombre ya está registrado (como titular o acompañante). Revisa los datos o contacta con Naïara o Guillermo."
          : "Hubo un error al guardar tu respuesta. Por favor, avisa directamente a Naïara o Guillermo.";
        statusMsg.style.display = "block";
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Confirmar Asistencia</span>`;
      }
    }
  }
}

function showSuccessModal(data) {
  const modal = document.getElementById("asistencia-success-modal");
  if (!modal) return;

  const msgBody = modal.querySelector(".modal-msg-body");
  if (msgBody) {
    if (data.attendance === "yes") {
      const companionsText = data.companions.length > 0 
        ? `<br><small style="color: var(--gold-light);">Total personas registradas: ${1 + data.companions.length}</small>`
        : "";
      msgBody.innerHTML = `
        ¡Muchas gracias, <strong>${data.fullName}</strong>!<br>
        Tu confirmación de asistencia ha quedado registrada con éxito.${companionsText}<br>
        ¡Nos vemos el 22 de Mayo de 2027 en Asejar Viveros!
      `;
    } else {
      msgBody.innerHTML = `
        Agradecemos que nos lo hayas comunicado, <strong>${data.fullName}</strong>.<br>
        ${data.dedication ? `<em>"Tu dedicatoria ha sido guardada con cariño."</em><br>` : ""}
        Lamentamos que no puedas venir, ¡pero te tendremos muy presente en este día tan especial!
      `;
    }
  }

  modal.classList.add("active");

  const closeBtn = modal.querySelector(".modal-close-btn");
  if (closeBtn) {
    closeBtn.onclick = () => modal.classList.remove("active");
  }
}
