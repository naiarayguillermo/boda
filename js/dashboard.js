/**
 * ===================================================================
 * MOTOR DEL PANEL DE GESTIÓN (dashboard.js)
 * Sincronizado con Firebase Firestore & LocalStorage
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
          // Ordenar por fecha descendente
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
      return inMain || inComps || inDiet;
    }

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-table-state">
          <div class="empty-icon">📜</div>
          <p>No hay confirmaciones registradas en la base de datos todavía.</p>
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

    let companionsHtml = `<span style="color: var(--text-muted); font-size: 0.85rem;">Ninguno</span>`;
    if (isYes && item.companions && item.companions.length > 0) {
      companionsHtml = item.companions.map(c => `
        <span class="badge-companion" title="${c.type === 'niño' ? 'Niño / Niña' : 'Pareja / Adulto'}">
          ${c.type === 'niño' ? '🧒 Niño/a:' : '👤'} ${c.name}
        </span>
      `).join("");
    }

    const totalPersons = isYes ? (1 + (item.companions ? item.companions.length : 0)) : 0;

    let allergyHtml = `<span style="color: var(--text-muted); font-size: 0.85rem;">Ninguna</span>`;
    if (item.hasAllergies && item.allergiesDetails && item.allergiesDetails !== "Ninguna") {
      allergyHtml = `<span class="badge-allergy">⚠️ ${item.allergiesDetails}</span>`;
    }

    let dateStr = "";
    if (item.createdAt) {
      const d = new Date(item.createdAt);
      dateStr = `${d.toLocaleDateString("es-ES")} ${d.toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}`;
    }

    return `
      <tr>
        <td><strong>#${idx + 1}</strong></td>
        <td><strong>${item.fullName}</strong></td>
        <td>${statusBadge}</td>
        <td>${companionsHtml}</td>
        <td><strong>${totalPersons}</strong></td>
        <td>${allergyHtml}</td>
        <td><small style="color: var(--text-muted);">${dateStr}</small></td>
      </tr>
    `;
  }).join("");
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

  const exportBtn = document.getElementById("btn-export-csv");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportToCSV);
  }

  const refreshBtn = document.getElementById("btn-refresh-data");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      initFirebaseDashboard();
    });
  }
}

function exportToCSV() {
  if (allConfirmations.length === 0) {
    alert("No hay confirmaciones para exportar.");
    return;
  }

  let csv = "ID,Nombre,Asistencia,Acompañantes,Total Personas,Alergias o Intolerancias,Fecha\n";

  allConfirmations.forEach(item => {
    const isYes = item.attendance === "yes" ? "Sí" : "No";
    const totalP = item.attendance === "yes" ? (1 + (item.companions ? item.companions.length : 0)) : 0;
    const comps = item.companions ? item.companions.map(c => `${c.name} (${c.type === 'niño' ? 'Niño/a' : 'Adulto'})`).join(" / ") : "";
    const diet = (item.hasAllergies ? item.allergiesDetails : "Ninguna").replace(/"/g, '""');

    csv += `"${item.id || ''}","${item.fullName || ''}","${isYes}","${comps}","${totalP}","${diet}","${item.createdAt || ''}"\n`;
  });

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `asistencia_boda_naiara_guillermo_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
