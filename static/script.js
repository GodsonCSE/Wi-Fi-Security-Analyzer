/**
 * script.js
 * ----------
 * Handles calling the Flask API, rendering results, filtering and
 * sorting, without ever reloading the page.
 */

let currentNetworks = []; // holds the most recent scan results

const scanBtn = document.getElementById("scan-btn");
const scanBtnText = document.getElementById("scan-btn-text");
const scanSpinner = document.getElementById("scan-spinner");
const resultsBody = document.getElementById("results-body");

const simulationBanner = document.getElementById("simulation-banner");
const simulationNote = document.getElementById("simulation-note");
const errorBanner = document.getElementById("error-banner");
const errorText = document.getElementById("error-text");

const filterInput = document.getElementById("filter-input");
const sortSelect = document.getElementById("sort-select");

const statTotal = document.getElementById("stat-total");
const statSecure = document.getElementById("stat-secure");
const statRisky = document.getElementById("stat-risky");
const statStrongest = document.getElementById("stat-strongest");

// ---------------------------------------------------------------------
// Scan button
// ---------------------------------------------------------------------
scanBtn.addEventListener("click", runScan);

async function runScan() {
  setLoading(true);
  hideBanners();

  try {
    const response = await fetch("/api/scan");
    const data = await response.json();

    if (!data.success) {
      showError(data.error || "Wi-Fi scan failed for an unknown reason.");
      currentNetworks = [];
      renderTable([]);
      updateStats([]);
      return;
    }

    currentNetworks = data.networks || [];

    if (data.simulation) {
      showSimulationBanner(data.note || "Showing sample data.");
    }

    applyFiltersAndSort();
  } catch (err) {
    showError("Could not reach the server. Is the Flask app running?");
    currentNetworks = [];
    renderTable([]);
    updateStats([]);
  } finally {
    setLoading(false);
  }
}

// ---------------------------------------------------------------------
// Filtering / sorting
// ---------------------------------------------------------------------
filterInput.addEventListener("input", applyFiltersAndSort);
sortSelect.addEventListener("change", applyFiltersAndSort);

function applyFiltersAndSort() {
  let networks = [...currentNetworks];

  // Filter by SSID text
  const query = filterInput.value.trim().toLowerCase();
  if (query) {
    networks = networks.filter((n) => n.ssid.toLowerCase().includes(query));
  }

  // Sort
  const sortMode = sortSelect.value;
  if (sortMode === "signal-desc") {
    networks.sort((a, b) => b.signal - a.signal);
  } else if (sortMode === "signal-asc") {
    networks.sort((a, b) => a.signal - b.signal);
  } else if (sortMode === "status") {
    const order = { "HIGH RISK": 0, RISK: 1, CAUTION: 2, SAFE: 3 };
    networks.sort(
      (a, b) => (order[a.status] ?? 99) - (order[b.status] ?? 99)
    );
  }

  renderTable(networks);
  updateStats(currentNetworks); // stats always reflect the full scan
}

// ---------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------
function renderTable(networks) {
  resultsBody.innerHTML = "";

  if (!networks || networks.length === 0) {
    const row = document.createElement("tr");
    row.className = "empty-row";
    row.innerHTML = `<td colspan="5">No networks to display.</td>`;
    resultsBody.appendChild(row);
    return;
  }

  networks.forEach((net) => {
    const row = document.createElement("tr");

    const signalPercentClamped = Math.max(
      0,
      Math.min(100, net.signal_percent ?? 0)
    );

    row.innerHTML = `
      <td class="ssid-cell">${escapeHtml(net.ssid)}</td>
      <td>
        ${net.signal} dBm
        <div class="signal-quality">${net.signal_quality}</div>
      </td>
      <td>
        <div class="signal-bar-wrap">
          <div class="signal-bar ${signalBarClass(net.signal)}" style="width: ${signalPercentClamped}%;"></div>
        </div>
      </td>
      <td>${securityBadge(net.security)}</td>
      <td>${statusBadge(net.status)}</td>
    `;

    resultsBody.appendChild(row);
  });
}

function signalBarClass(dbm) {
  if (dbm > -65) return "signal-strong";
  if (dbm >= -78) return "signal-fair";
  return "signal-weak";
}

function securityBadge(securityType) {
  const type = (securityType || "").toUpperCase();
  let cssClass = "badge-sec-yellow";
  let label = securityType || "Unknown";

  if (type.includes("WPA3") || type.includes("ENTERPRISE")) {
    cssClass = "badge-sec-green";
  } else if (type.includes("WPA2") && !type.includes("WPA/WPA2")) {
    cssClass = "badge-sec-yellow";
  } else if (
    type.includes("OPEN") ||
    type.includes("WEP") ||
    type === "WPA" ||
    type.includes("WPA/WPA2") ||
    type.includes("NONE") ||
    type === "" ||
    type === "UNKNOWN"
  ) {
    cssClass = "badge-sec-red";
  }

  return `<span class="badge ${cssClass}">${escapeHtml(label)}</span>`;
}

function statusBadge(status) {
  // Two visual tiers: SAFE (green, shield-check) and RISKY (red, warning
  // triangle). CAUTION is shown as an amber warning variant so the
  // in-between case isn't lost, but SAFE/RISKY are the two core pills.
  if (status === "SAFE") {
    return `<span class="badge badge-safe"><span class="badge-icon">🛡️✓</span>SAFE</span>`;
  }
  if (status === "CAUTION") {
    return `<span class="badge badge-caution"><span class="badge-icon">⚠️</span>CAUTION</span>`;
  }
  // RISK and HIGH RISK both render as the red "RISKY" pill
  const label = status === "HIGH RISK" ? "HIGH RISK" : "RISKY";
  const cssClass = status === "HIGH RISK" ? "badge-highrisk" : "badge-risk";
  return `<span class="badge ${cssClass}"><span class="badge-icon">⚠️</span>${label}</span>`;
}

// ---------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------
function updateStats(networks) {
  statTotal.textContent = networks.length;

  const secureCount = networks.filter((n) => n.status === "SAFE").length;
  const riskyCount = networks.filter(
    (n) => n.status === "RISK" || n.status === "HIGH RISK"
  ).length;

  statSecure.textContent = secureCount;
  statRisky.textContent = riskyCount;

  if (networks.length > 0) {
    const strongest = networks.reduce((best, n) =>
      n.signal > best.signal ? n : best
    );
    statStrongest.textContent = `${strongest.signal} dBm`;
  } else {
    statStrongest.textContent = "--";
  }
}

// ---------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------
function setLoading(isLoading) {
  scanBtn.disabled = isLoading;
  scanSpinner.classList.toggle("hidden", !isLoading);
  scanBtnText.textContent = isLoading ? "Scanning..." : "🔍 SCAN WI-FI";
}

function showSimulationBanner(note) {
  simulationNote.textContent = note;
  simulationBanner.classList.remove("hidden");
}

function showError(message) {
  errorText.textContent = message;
  errorBanner.classList.remove("hidden");
}

function hideBanners() {
  simulationBanner.classList.add("hidden");
  errorBanner.classList.add("hidden");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
