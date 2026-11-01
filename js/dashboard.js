/**
 * ===================================================================
 * MOTOR DEL PANEL DE GESTIÓN (dashboard.js)
 * Sincronizado con Firebase Firestore, Edición en Vivo y Exportación PDF
 * ===================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  checkAuthAndLoad();
});

let allConfirmations = [];
let activeFilter = "all";
let searchQuery = "";
let dbInstance = null;

function checkAuthAndLoad() {
  const gate = document.getElementById("login-gate");
  if (typeof REQUIRE_AUTH !== "undefined" && REQUIRE_AUTH) {
    if (!sessionStorage.getItem("admin_authenticated")) {
      if (gate) gate.classList.add("active");
      initLoginForm();
      return;
    }
  }

  initFirebaseDashboard();
  initToolbar();
  initEditModal();
}

function initLoginForm() {
  const form = document.getElementById("admin-login-form");
  const errEl = document.getElementById("login-err-msg");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const pin = document.getElementById("adminPin")?.value.trim();
    if (pin === "22052027" || pin === "admin") {
      sessionStorage.setItem("admin_authenticated", "true");
      document.getElementById("login-gate")?.classList.remove("active");
      initFirebaseDashboard();
      initToolbar();
      initEditModal();
    } else {
      if (errEl) {
        errEl.textContent = "Clave incorrecta. Pista: fecha del enlace (22052027)";
        errEl.style.display = "block";
      }
    }
  });
}

function initFirebaseDashboard() {
  if (typeof ENABLE_FIREBASE !== "undefined" && ENABLE_FIREBASE && typeof firebase !== "undefined") {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
      dbInstance = firebase.firestore();
      console.log("🔥 Dashboard conectado a Firestore.");

      const collectionName = typeof FIRESTORE_COLLECTION !== "undefined" ? FIRESTORE_COLLECTION : "confirmaciones_boda";
      
      // Escucha en tiempo real de nuevas confirmaciones
      dbInstance.collection(collectionName).onSnapshot(
        (snapshot) => {
          const list = [];
          snapshot.forEach(doc => {
            list.push({ id: doc.id, ...doc.data() });
          });
          list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          allConfirmations = list;
          renderDashboard();
        },
        (error) => {
          console.warn("Error en tiempo real de Firestore, cargando de respaldo local:", error);
          loadFromLocal();
        }
      );
      return;
    } catch (err) {
      console.warn("Fallo al inicializar Firebase en dashboard:", err);
    }
  }

  loadFromLocal();
}

function loadFromLocal() {
  const localData = JSON.parse(localStorage.getItem("confirmaciones_boda") || "[]");
  localData.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  allConfirmations = localData;
  renderDashboard();
}

function renderDashboard() {
  renderStats();
  renderTable();
}

function renderStats() {
  let totalResp = allConfirmations.length;
  let totalAttending = 0;
  let totalAdults = 0;
  let totalChildren = 0;
  let totalDeclined = 0;
  let totalAllergies = 0;

  allConfirmations.forEach(c => {
    if (c.attendance === "yes") {
      totalAttending += 1;
      totalAdults += 1;

      if (c.companions && Array.isArray(c.companions)) {
        c.companions.forEach(comp => {
          totalAttending += 1;
          if (comp.type === "niño") {
            totalChildren += 1;
          } else {
            totalAdults += 1;
          }
        });
      }
    } else {
      totalDeclined += 1;
    }

    if (c.hasAllergies && c.allergiesDetails && c.allergiesDetails !== "Ninguna") {
      totalAllergies += 1;
    }
  });

  document.getElementById("stat-total-resp").textContent = totalResp;
  document.getElementById("stat-total-people").textContent = totalAttending;
  document.getElementById("stat-total-adults").textContent = totalAdults;
  document.getElementById("stat-total-children").textContent = totalChildren;
  document.getElementById("stat-total-declined").textContent = totalDeclined;
  document.getElementById("stat-total-allergies").textContent = totalAllergies;
}

function renderTable() {
  const tbody = document.getElementById("confirmations-tbody");
  if (!tbody) return;

  const filtered = allConfirmations.filter(item => {
    if (activeFilter === "yes" && item.attendance !== "yes") return false;
    if (activeFilter === "no" && item.attendance !== "no") return false;
    if (activeFilter === "allergies" && (!item.hasAllergies || item.allergiesDetails === "Ninguna")) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const inMain = item.fullName ? item.fullName.toLowerCase().includes(q) : false;
      const inComps = item.companions && item.companions.some(c => c.name.toLowerCase().includes(q));
      const inDiet = item.allergiesDetails && item.allergiesDetails.toLowerCase().includes(q);
      const inDed = item.dedication && item.dedication.toLowerCase().includes(q);
      return inMain || inComps || inDiet || inDed;
    }

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-table-state">
          <div class="empty-icon">📜</div>
          <p>No hay confirmaciones que coincidan con este filtro.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((item, idx) => {
    const isYes = item.attendance === "yes";
    const statusBadge = isYes
      ? `<span class="badge-status yes">✓ Asistirá</span>`
      : `<span class="badge-status no">✕ No asistirá</span>`;

    let companionsHtml = `<span style="color: var(--text-muted); font-size: 0.82rem;">Ninguno</span>`;
    if (isYes && item.companions && item.companions.length > 0) {
      companionsHtml = item.companions.map(c => `
        <span class="badge-companion" title="${c.type === 'niño' ? 'Niño / Niña' : 'Pareja / Adulto'}">
          ${c.type === 'niño' ? '🧒 Niño/a:' : '👤'} ${c.name}
        </span>
      `).join("");
    }

    const totalPersons = isYes ? (1 + (item.companions ? item.companions.length : 0)) : 0;

    let allergyHtml = `<span style="color: var(--text-muted); font-size: 0.82rem;">Ninguna</span>`;
    if (item.hasAllergies && item.allergiesDetails && item.allergiesDetails !== "Ninguna") {
      allergyHtml = `<span class="badge-allergy">⚠️ ${item.allergiesDetails}</span>`;
    }

    let dedicationHtml = `<span style="color: var(--text-muted); font-size: 0.82rem;">-</span>`;
    if (item.dedication) {
      dedicationHtml = `<span style="font-size: 0.85rem; font-style: italic;">"${item.dedication}"</span>`;
    }

    let dateStr = "";
    if (item.createdAt) {
      const d = new Date(item.createdAt);
      dateStr = `${d.toLocaleDateString("es-ES")} <small>${d.toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}</small>`;
    }

    return `
      <tr>
        <td><strong>#${idx + 1}</strong></td>
        <td><strong>${item.fullName}</strong></td>
        <td>${statusBadge}</td>
        <td>${companionsHtml}</td>
        <td><strong>${totalPersons}</strong></td>
        <td>${allergyHtml}</td>
        <td>${dedicationHtml}</td>
        <td><small style="color: var(--text-muted);">${dateStr}</small></td>
        <td style="text-align: center;">
          <button type="button" class="btn-action-edit" data-id="${item.id}">
            <span>✏️ Editar</span>
          </button>
        </td>
      </tr>
    `;
  }).join("");

  // Conectar botones de edición
  document.querySelectorAll(".btn-action-edit").forEach(btn => {
    btn.addEventListener("click", () => {
      const recordId = btn.getAttribute("data-id");
      openEditModal(recordId);
    });
  });
}

function initToolbar() {
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.getAttribute("data-filter");
      renderTable();
    });
  });

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim();
      renderTable();
    });
  }

  // Exportar a PDF
  const exportPdfBtn = document.getElementById("btn-export-pdf");
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener("click", exportToPDF);
  }

  const refreshBtn = document.getElementById("btn-refresh-data");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      initFirebaseDashboard();
    });
  }
}

/**
 * 4. Exportar a PDF con jsPDF y AutoTable
 */
function exportToPDF() {
  if (allConfirmations.length === 0) {
    alert("No hay confirmaciones para exportar en este momento.");
    return;
  }

  if (typeof window.jspdf === "undefined" || !window.jspdf.jsPDF) {
    alert("Cargando librería de PDF. Por favor, inténtalo en unos segundos.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  // Título y Cabecera del PDF
  doc.setFontSize(18);
  doc.setTextColor(212, 175, 55); // Color dorado vikingo
  doc.text("Boda Naiara & Guillermo · Listado de Asistencia", 14, 16);

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Fecha del Enlace: 22 de Mayo de 2027 · Asejar Viveros (Elche) | Generado: ${new Date().toLocaleDateString("es-ES")}`, 14, 23);

  // Métricas de resumen
  let totalAttending = 0;
  let totalAdults = 0;
  let totalChildren = 0;
  let totalDeclined = 0;
  let totalAllergies = 0;

  allConfirmations.forEach(c => {
    if (c.attendance === "yes") {
      totalAttending += 1;
      totalAdults += 1;
      if (c.companions) {
        c.companions.forEach(comp => {
          totalAttending += 1;
          comp.type === "niño" ? totalChildren++ : totalAdults++;
        });
      }
    } else {
      totalDeclined += 1;
    }
    if (c.hasAllergies && c.allergiesDetails !== "Ninguna") totalAllergies++;
  });

  doc.setFillColor(245, 245, 245);
  doc.roundedRect(14, 27, 269, 12, 2, 2, "F");
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text(
    `Total Respuestas: ${allConfirmations.length}  |  Asistentes Totales: ${totalAttending} (Adultos: ${totalAdults}, Niños/as: ${totalChildren})  |  No Asisten: ${totalDeclined}  |  Alergias/Dietas: ${totalAllergies}`,
    18,
    34
  );

  // Filas para la tabla
  const tableRows = allConfirmations.map((item, idx) => {
    const isYes = item.attendance === "yes";
    const status = isYes ? "SÍ Asiste" : "NO Asiste";
    const totalP = isYes ? (1 + (item.companions ? item.companions.length : 0)) : 0;
    const comps = isYes && item.companions && item.companions.length > 0
      ? item.companions.map(c => `${c.name} (${c.type === 'niño' ? 'Niño/a' : 'Adulto'})`).join(", ")
      : "-";
    const allergies = item.hasAllergies && item.allergiesDetails ? item.allergiesDetails : "Ninguna";
    const ded = item.dedication ? item.dedication : "-";

    return [
      idx + 1,
      item.fullName || "-",
      status,
      comps,
      totalP,
      allergies,
      ded
    ];
  });

  // Generar tabla con AutoTable
  doc.autoTable({
    startY: 43,
    head: [["#", "Invitado Principal", "Estado", "Acompañantes", "Total", "Alergias / Dietas", "Dedicatoria / Mensaje"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: [20, 26, 38],
      textColor: [245, 225, 151],
      fontSize: 9,
      fontStyle: "bold"
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 45 },
      2: { cellWidth: 25, halign: "center" },
      3: { cellWidth: 65 },
      4: { cellWidth: 15, halign: "center" },
      5: { cellWidth: 50 },
      6: { cellWidth: 59 }
    }
  });

  const fileName = `asistencia_boda_naiara_guillermo_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

/**
 * 5. Módulo de Edición de Invitados & Acompañantes
 */
function initEditModal() {
  const modal = document.getElementById("edit-modal");
  const form = document.getElementById("form-edit-confirmation");
  const closeBtn = document.getElementById("btn-close-edit");
  const cancelBtn = document.getElementById("btn-cancel-edit");
  const deleteBtn = document.getElementById("btn-delete-record");
  const addCompBtn = document.getElementById("btn-add-edit-companion");
  const compList = document.getElementById("edit-companions-list");

  if (!modal || !form) return;

  const closeModal = () => modal.classList.remove("active");
  if (closeBtn) closeBtn.onclick = closeModal;
  if (cancelBtn) cancelBtn.onclick = closeModal;

  // Añadir acompañante dentro del modal de edición
  if (addCompBtn && compList) {
    addCompBtn.addEventListener("click", () => {
      addEditCompanionRow("", "pareja");
    });
  }

  // Guardar cambios
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("edit-record-id").value;
    const item = allConfirmations.find(c => c.id === id);
    if (!item) return;

    const isYes = document.getElementById("edit-att-yes").checked;
    const fullName = document.getElementById("edit-fullName").value.trim();
    const dietaryDetails = document.getElementById("edit-dietaryDetails").value.trim();
    const dedication = document.getElementById("edit-dedication").value.trim();

    // Extraer acompañantes editados
    const comps = [];
    if (isYes && compList) {
      compList.querySelectorAll(".edit-companion-item").forEach(row => {
        const nameInput = row.querySelector(".edit-comp-name");
        const typeSelect = row.querySelector(".edit-comp-type");
        if (nameInput && nameInput.value.trim()) {
          comps.push({
            name: nameInput.value.trim(),
            type: typeSelect ? typeSelect.value : "pareja"
          });
        }
      });
    }

    const updatedData = {
      fullName: fullName,
      attendance: isYes ? "yes" : "no",
      hasCompanion: comps.length > 0,
      companionsCount: comps.length,
      companions: comps,
      hasAllergies: Boolean(dietaryDetails && dietaryDetails.toLowerCase() !== "ninguna"),
      allergiesDetails: dietaryDetails || "Ninguna",
      dedication: dedication,
      updatedAt: new Date().toISOString()
    };

    try {
      // 1. Actualizar en Firebase si está disponible
      if (dbInstance && typeof ENABLE_FIREBASE !== "undefined" && ENABLE_FIREBASE) {
        const col = typeof FIRESTORE_COLLECTION !== "undefined" ? FIRESTORE_COLLECTION : "confirmaciones_boda";
        await dbInstance.collection(col).doc(id).set(updatedData, { merge: true });
        console.log("✅ Registro actualizado en Firestore:", id);
      }

      // 2. Actualizar en local
      Object.assign(item, updatedData);
      try {
        const localData = JSON.parse(localStorage.getItem("confirmaciones_boda") || "[]");
        const idx = localData.findIndex(c => c.id === id);
        if (idx !== -1) {
          Object.assign(localData[idx], updatedData);
        } else {
          localData.push({ id, ...updatedData });
        }
        localStorage.setItem("confirmaciones_boda", JSON.stringify(localData));
      } catch (err) {}

      closeModal();
      renderDashboard();

      const toast = document.getElementById("copy-toast");
      if (toast) {
        toast.textContent = "¡Registro actualizado con éxito!";
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 2500);
      }
    } catch (err) {
      console.error("Error al actualizar registro:", err);
      alert("Hubo un error al guardar los cambios en la base de datos.");
    }
  });

  // Eliminar registro
  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      const id = document.getElementById("edit-record-id").value;
      if (!confirm("¿Estás seguro de que deseas eliminar este registro de confirmación?")) {
        return;
      }

      try {
        if (dbInstance && typeof ENABLE_FIREBASE !== "undefined" && ENABLE_FIREBASE) {
          const col = typeof FIRESTORE_COLLECTION !== "undefined" ? FIRESTORE_COLLECTION : "confirmaciones_boda";
          await dbInstance.collection(col).doc(id).delete();
          console.log("🗑️ Registro eliminado de Firestore:", id);
        }

        allConfirmations = allConfirmations.filter(c => c.id !== id);
        const localData = JSON.parse(localStorage.getItem("confirmaciones_boda") || "[]").filter(c => c.id !== id);
        localStorage.setItem("confirmaciones_boda", JSON.stringify(localData));

        closeModal();
        renderDashboard();
      } catch (err) {
        console.error("Error al eliminar:", err);
        alert("No se pudo eliminar el registro.");
      }
    });
  }
}

function openEditModal(recordId) {
  const item = allConfirmations.find(c => c.id === recordId);
  const modal = document.getElementById("edit-modal");
  const compList = document.getElementById("edit-companions-list");
  if (!item || !modal) return;

  document.getElementById("edit-record-id").value = item.id;
  document.getElementById("edit-fullName").value = item.fullName || "";

  if (item.attendance === "yes") {
    document.getElementById("edit-att-yes").checked = true;
  } else {
    document.getElementById("edit-att-no").checked = true;
  }

  document.getElementById("edit-dietaryDetails").value = item.allergiesDetails || "";
  document.getElementById("edit-dedication").value = item.dedication || "";

  // Rellenar lista de acompañantes
  if (compList) {
    compList.innerHTML = "";
    if (item.companions && item.companions.length > 0) {
      item.companions.forEach(c => {
        addEditCompanionRow(c.name, c.type);
      });
    }
  }

  modal.classList.add("active");
}

function addEditCompanionRow(name = "", type = "pareja") {
  const compList = document.getElementById("edit-companions-list");
  if (!compList) return;

  const row = document.createElement("div");
  row.className = "edit-companion-item";
  row.innerHTML = `
    <input type="text" class="form-input edit-comp-name" placeholder="Nombre acompañante" value="${name}" required style="min-height: 38px; padding: 0.4rem 0.8rem; font-size: 0.88rem;" />
    <select class="form-select edit-comp-type" style="min-height: 38px; padding: 0.4rem 0.8rem; font-size: 0.85rem;">
      <option value="pareja" ${type === 'pareja' ? 'selected' : ''}>👤 Pareja / Adulto</option>
      <option value="niño" ${type === 'niño' ? 'selected' : ''}>🧒 Niño / Niña</option>
    </select>
    <button type="button" class="btn-remove-edit-comp" title="Eliminar acompañante">&times;</button>
  `;

  row.querySelector(".btn-remove-edit-comp").addEventListener("click", () => {
    row.remove();
  });

  compList.appendChild(row);
}
