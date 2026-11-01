/**
 * ===================================================================
 * GESTOR DE CONFIRMACIÓN DE ASISTENCIA (asistencia.js)
 * ===================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  initAsistenciaForm();
  initCompanionsSystem();
  initAllergyToggle();
});

let dbInstance = null;

async function setupFirebaseIfAvailable() {
  if (typeof ENABLE_FIREBASE !== "undefined" && ENABLE_FIREBASE && typeof firebase !== "undefined") {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
      dbInstance = firebase.firestore();
      console.log("🔥 Firebase Firestore inicializado.");
    } catch (err) {
      console.error("Error al inicializar Firebase:", err);
    }
  }
}

/**
 * 1. Control de Acompañantes
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
              <span>👤 Pareja / Adulto</span>
            </button>
            <button type="button" class="type-pill-btn" data-type="niño">
              <span>🧒 Niño / Niña</span>
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
 * 3. Envío del Formulario
 */
function initAsistenciaForm() {
  const form = document.getElementById("form-asistencia");
  const submitBtn = document.getElementById("btn-submit-asistencia");
  const statusMsg = document.getElementById("asistencia-status-msg");

  if (!form) return;

  setupFirebaseIfAvailable();

  // Controlar campos si marca "No podré asistir"
  const attendanceRadios = form.querySelectorAll('input[name="attendance"]');
  const detailsSection = document.getElementById("attendance-extra-fields");

  attendanceRadios.forEach(radio => {
    radio.addEventListener("change", (e) => {
      if (e.target.value === "no") {
        if (detailsSection) detailsSection.style.display = "none";
      } else {
        if (detailsSection) detailsSection.style.display = "flex";
      }
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Registrando confirmación...</span>`;
    }

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

    const confirmationData = {
      id: "conf_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      fullName: (formData.get("fullName") || "").trim(),
      attendance: attendanceVal,
      hasCompanion: hasCompanion,
      companionsCount: companions.length,
      companions: companions,
      hasAllergies: hasAllergies,
      allergiesDetails: hasAllergies ? (formData.get("dietaryDetails") || "").trim() : "Ninguna",
      createdAt: new Date().toISOString()
    };

    try {
      if (dbInstance && typeof ENABLE_FIREBASE !== "undefined" && ENABLE_FIREBASE) {
        const collectionName = typeof FIRESTORE_COLLECTION !== "undefined" ? FIRESTORE_COLLECTION : "confirmaciones_boda";
        await dbInstance.collection(collectionName).add(confirmationData);
        console.log("✅ Confirmación guardada en Firebase Firestore:", confirmationData);
      } else {
        // Almacenamiento local de respaldo
        const stored = JSON.parse(localStorage.getItem("confirmaciones_boda") || "[]");
        stored.push(confirmationData);
        localStorage.setItem("confirmaciones_boda", JSON.stringify(stored));
      }

      // También guardamos una copia en localStorage por seguridad offline
      try {
        const backup = JSON.parse(localStorage.getItem("confirmaciones_boda") || "[]");
        backup.push(confirmationData);
        localStorage.setItem("confirmaciones_boda", JSON.stringify(backup));
      } catch (e) {}

      showSuccessModal(confirmationData);
      form.reset();
      // Reset dinámicos
      const companionsBlock = document.getElementById("companions-block");
      const allergyBox = document.getElementById("allergy-details-box");
      if (companionsBlock) companionsBlock.classList.remove("active");
      if (allergyBox) allergyBox.classList.remove("active");
      const companionsList = document.getElementById("companions-list");
      if (companionsList) companionsList.innerHTML = "";
    } catch (err) {
      console.error("Error al registrar asistencia:", err);
      if (statusMsg) {
        statusMsg.textContent = "Hubo un error al guardar tu respuesta. Por favor, avisa directamente a Naiara o Guillermo.";
        statusMsg.style.display = "block";
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Confirmar Asistencia</span>`;
      }
    }
  });
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

