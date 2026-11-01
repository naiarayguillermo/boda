/**
 * ===================================================================
 * MOTOR DEL PANEL DE GESTIÓN (dashboard.js)
 * Sincronizado con Firebase Firestore + Firebase Authentication
 * Acceso exclusivo para el usuario autorizado (naiarayguillermo)
 * ===================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  initAuth();
});

let allConfirmations = [];
let activeFilter = "all";
let searchQuery = "";
let dbInstance = null;
let authInstance = null;

/* ===================================================================
   1. AUTENTICACIÓN CON FIREBASE AUTH
   =================================================================== */

function initAuth() {
  // Si Firebase Auth está disponible, usarlo como fuente de verdad
  if (typeof firebase !== "undefined" && ENABLE_FIREBASE) {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
      authInstance = firebase.auth();
      dbInstance = firebase.firestore();

      // Escuchar cambios de sesión (se llama automáticamente al cargar)
      authInstance.onAuthStateChanged((user) => {
        const allowedEmail = typeof ALLOWED_USER_EMAIL !== "undefined"
          ? ALLOWED_USER_EMAIL
          : "naiarayguillermo@boda.es";

        if (user && user.email === allowedEmail) {
          // Usuario autorizado → mostrar dashboard
          hiddenGate();
          showLogoutButton(user.email);
          initFirebaseDashboard();
          initToolbar();
          initEditModal();
        } else {
          if (user) {
            // Usuario logueado pero NO autorizado → cerrar sesión inmediatamente
            authInstance.signOut();
          }
          // Mostrar pantalla de acceso restringido
          showGate();
        }
      });

      initLoginForm();
      return;
    } catch (err) {
      console.warn("Error al inicializar Firebase Auth:", err);
    }
  }

  // Fallback: sin Firebase, acceso directo (solo en desarrollo)
  hiddenGate();
  loadFromLocal();
  initToolbar();
  initEditModal();
}

function showGate() {
  const gate = document.getElementById("login-gate");
  if (gate) gate.classList.add("active");
}

function hiddenGate() {
  const gate = document.getElementById("login-gate");
  if (gate) gate.classList.remove("active");
}

function showLogoutButton(email) {
  const logoutContainer = document.getElementById("logout-container");
  if (logoutContainer) {
    logoutContainer.innerHTML = `
      <span style="font-size: 0.8rem; color: var(--text-muted); margin-right: 0.5rem;">
        🔓 ${email}
      </span>
      <button type="button" id="btn-logout" class="btn-viking btn-viking-outline"
        style="min-height: 36px; padding: 0.3rem 0.8rem; font-size: 0.78rem; color: #ff6b6b; border-color: rgba(231,76,60,0.4);">
        <span>Cerrar sesión</span>
      </button>
    `;
    document.getElementById("btn-logout")?.addEventListener("click", () => {
      if (authInstance) {
        authInstance.signOut();
      }
    });
    logoutContainer.style.display = "flex";
    logoutContainer.style.alignItems = "center";
    logoutContainer.style.gap = "0.5rem";
  }
}

function initLoginForm() {
  const form = document.getElementById("admin-login-form");
  const errEl = document.getElementById("login-err-msg");
  const spinner = document.getElementById("login-spinner");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("adminEmail")?.value.trim();
    const password = document.getElementById("adminPassword")?.value;

    if (!email || !password) return;

    if (errEl) errEl.style.display = "none";
    if (spinner) spinner.style.display = "block";

    const submitBtn = form.querySelector("[type='submit']");
    if (submitBtn) submitBtn.disabled = true;

    try {
      await authInstance.signInWithEmailAndPassword(email, password);
      // onAuthStateChanged se encargará de mostrar/ocultar el gate
    } catch (err) {
      console.warn("Error de login:", err.code);
      let msg = "Credenciales incorrectas. Inténtalo de nuevo.";
      if (err.code === "auth/user-not-found") msg = "Usuario no encontrado.";
      if (err.code === "auth/wrong-password") msg = "Contraseña incorrecta.";
      if (err.code === "auth/invalid-email") msg = "Email no válido.";
      if (err.code === "auth/too-many-requests") msg = "Demasiados intentos. Espera unos minutos.";

      if (errEl) {
        errEl.textContent = msg;
        errEl.style.display = "block";
      }
    } finally {
      if (spinner) spinner.style.display = "none";
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

/* ===================================================================
   2. CARGA DE DATOS DE FIRESTORE
   =================================================================== */

function initFirebaseDashboard() {
  if (dbInstance) {
    const collectionName = typeof FIRESTORE_COLLECTION !== "undefined"
      ? FIRESTORE_COLLECTION
      : "confirmaciones_boda";

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
        console.warn("Error en tiempo real de Firestore:", error);
        loadFromLocal();
      }
    );
    return;
  }

  loadFromLocal();
}

function loadFromLocal() {
  const localData = JSON.parse(localStorage.getItem("confirmaciones_boda") || "[]");
  localData.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  allConfirmations = localData;
  renderDashboard();
}

/* ===================================================================
   3. RENDER DEL PANEL
   =================================================================== */

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
      companionsHtml = `<div class="companions-cell">${item.companions.map(c => `
        <span class="badge-companion" title="${c.type === 'niño' ? 'Niño / Niña' : 'Pareja / Adulto'}">
          ${c.type === 'niño' ? '🧒' : '👤'} ${c.name}
          <em style="font-size:0.72rem; opacity:0.7;">${c.type === 'niño' ? 'niño/a' : 'adulto'}</em>
        </span>
      `).join("")}</div>`;
    }

    const totalPersons = isYes ? (1 + (item.companions ? item.companions.length : 0)) : 0;

    let allergyHtml = `<span style="color: var(--text-muted); font-size: 0.82rem;">Ninguna</span>`;
    if (item.hasAllergies && item.allergiesDetails && item.allergiesDetails !== "Ninguna") {
      allergyHtml = `<span class="badge-allergy">⚠️ ${item.allergiesDetails}</span>`;
    }

    let dedicationHtml = `<span style="color: var(--text-muted); font-size: 0.82rem;">-</span>`;
    if (item.dedication) {
      dedicationHtml = `<span class="dedication-text">"${item.dedication}"</span>`;
    }

    let dateStr = "";
    if (item.createdAt) {
      const d = new Date(item.createdAt);
      dateStr = `${d.toLocaleDateString("es-ES")} <small>${d.toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}</small>`;
    }

    return `
      <tr>
        <td class="col-num"><strong>#${idx + 1}</strong></td>
        <td class="col-name"><strong>${item.fullName}</strong></td>
        <td class="col-status">${statusBadge}</td>
        <td class="col-companions">${companionsHtml}</td>
        <td class="col-total"><strong>${totalPersons > 0 ? totalPersons : "—"}</strong></td>
        <td class="col-allergy">${allergyHtml}</td>
        <td class="col-dedication">${dedicationHtml}</td>
        <td class="col-date"><small style="color: var(--text-muted);">${dateStr}</small></td>
        <td class="col-actions">
          <button type="button" class="btn-action-edit" data-id="${item.id}">
            <span>✏️ Editar</span>
          </button>
        </td>
      </tr>
    `;
  }).join("");

  document.querySelectorAll(".btn-action-edit").forEach(btn => {
    btn.addEventListener("click", () => {
      const recordId = btn.getAttribute("data-id");
      openEditModal(recordId);
    });
  });
}

/* ===================================================================
   4. TOOLBAR: FILTROS, BÚSQUEDA, PDF, REFRESH
   =================================================================== */

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

/* ===================================================================
   5. EXPORTAR A PDF
   =================================================================== */

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
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  doc.setFontSize(18);
  doc.setTextColor(212, 175, 55);
  doc.text("Boda Naiara & Guillermo · Listado de Asistencia", 14, 16);

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Fecha del Enlace: 22 de Mayo de 2027 · Asejar Viveros (Elche) | Generado: ${new Date().toLocaleDateString("es-ES")}`, 14, 23);

  let totalAttending = 0, totalAdults = 0, totalChildren = 0, totalDeclined = 0, totalAllergies = 0;

  allConfirmations.forEach(c => {
    if (c.attendance === "yes") {
      totalAttending += 1; totalAdults += 1;
      if (c.companions) {
        c.companions.forEach(comp => {
          totalAttending += 1;
          comp.type === "niño" ? totalChildren++ : totalAdults++;
        });
      }
    } else { totalDeclined += 1; }
    if (c.hasAllergies && c.allergiesDetails !== "Ninguna") totalAllergies++;
  });

  doc.setFillColor(245, 245, 245);
  doc.roundedRect(14, 27, 269, 12, 2, 2, "F");
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text(
    `Total Respuestas: ${allConfirmations.length}  |  Asistentes Totales: ${totalAttending} (Adultos: ${totalAdults}, Niños/as: ${totalChildren})  |  No Asisten: ${totalDeclined}  |  Alergias/Dietas: ${totalAllergies}`,
    18, 34
  );

  const tableRows = allConfirmations.map((item, idx) => {
    const isYes = item.attendance === "yes";
    const status = isYes ? "SÍ Asiste" : "NO Asiste";
    const totalP = isYes ? (1 + (item.companions ? item.companions.length : 0)) : 0;
    const comps = isYes && item.companions && item.companions.length > 0
      ? item.companions.map(c => `${c.name} (${c.type === 'niño' ? 'Niño/a' : 'Adulto'})`).join(", ")
      : "-";
    const allergies = item.hasAllergies && item.allergiesDetails ? item.allergiesDetails : "Ninguna";
    const ded = item.dedication ? item.dedication : "-";

    return [idx + 1, item.fullName || "-", status, comps, totalP, allergies, ded];
  });

  doc.autoTable({
    startY: 43,
    head: [["#", "Invitado Principal", "Estado", "Acompañantes", "Total", "Alergias / Dietas", "Dedicatoria / Mensaje"]],
    body: tableRows,
    theme: "striped",
    headStyles: { fillColor: [20, 26, 38], textColor: [245, 225, 151], fontSize: 9, fontStyle: "bold" },
    styles: { fontSize: 8.5, cellPadding: 3 },
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

/* ===================================================================
   6. MODAL DE EDICIÓN DE INVITADOS
   =================================================================== */

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

  if (addCompBtn && compList) {
    addCompBtn.addEventListener("click", () => addEditCompanionRow("", "pareja"));
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("edit-record-id").value;
    const item = allConfirmations.find(c => c.id === id);
    if (!item) return;

    const isYes = document.getElementById("edit-att-yes").checked;
    const fullName = document.getElementById("edit-fullName").value.trim();
    const dietaryDetails = document.getElementById("edit-dietaryDetails").value.trim();
    const dedication = document.getElementById("edit-dedication").value.trim();

    const comps = [];
    if (isYes && compList) {
      compList.querySelectorAll(".edit-companion-item").forEach(row => {
        const nameInput = row.querySelector(".edit-comp-name");
        const typeSelect = row.querySelector(".edit-comp-type");
        if (nameInput && nameInput.value.trim()) {
          comps.push({ name: nameInput.value.trim(), type: typeSelect ? typeSelect.value : "pareja" });
        }
      });
    }

    const updatedData = {
      fullName,
      attendance: isYes ? "yes" : "no",
      hasCompanion: comps.length > 0,
      companionsCount: comps.length,
      companions: comps,
      hasAllergies: Boolean(dietaryDetails && dietaryDetails.toLowerCase() !== "ninguna"),
      allergiesDetails: dietaryDetails || "Ninguna",
      dedication,
      updatedAt: new Date().toISOString()
    };

    try {
      if (dbInstance && ENABLE_FIREBASE) {
        const col = typeof FIRESTORE_COLLECTION !== "undefined" ? FIRESTORE_COLLECTION : "confirmaciones_boda";
        await dbInstance.collection(col).doc(id).set(updatedData, { merge: true });
      }

      Object.assign(item, updatedData);
      try {
        const localData = JSON.parse(localStorage.getItem("confirmaciones_boda") || "[]");
        const idx = localData.findIndex(c => c.id === id);
        if (idx !== -1) Object.assign(localData[idx], updatedData);
        else localData.push({ id, ...updatedData });
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

  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      const id = document.getElementById("edit-record-id").value;
      if (!confirm("¿Estás seguro de que deseas eliminar este registro de confirmación?")) return;

      try {
        if (dbInstance && ENABLE_FIREBASE) {
          const col = typeof FIRESTORE_COLLECTION !== "undefined" ? FIRESTORE_COLLECTION : "confirmaciones_boda";
          await dbInstance.collection(col).doc(id).delete();
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

  if (compList) {
    compList.innerHTML = "";
    if (item.companions && item.companions.length > 0) {
      item.companions.forEach(c => addEditCompanionRow(c.name, c.type));
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
    <input type="text" class="form-input edit-comp-name" placeholder="Nombre acompañante" value="${name}" style="min-height: 38px; padding: 0.4rem 0.8rem; font-size: 0.88rem;" />
    <select class="form-select edit-comp-type" style="min-height: 38px; padding: 0.4rem 0.8rem; font-size: 0.85rem;">
      <option value="pareja" ${type === 'pareja' ? 'selected' : ''}>👤 Pareja / Adulto</option>
      <option value="niño" ${type === 'niño' ? 'selected' : ''}>🧒 Niño / Niña</option>
    </select>
    <button type="button" class="btn-remove-edit-comp" title="Eliminar acompañante">&times;</button>
  `;

  row.querySelector(".btn-remove-edit-comp").addEventListener("click", () => row.remove());
  compList.appendChild(row);
}
