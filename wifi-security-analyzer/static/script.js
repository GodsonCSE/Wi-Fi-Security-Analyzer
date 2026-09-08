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

    const barColorClass = getSignalColorClass(net.signal);
    const securityBadgeHTML = getSecurityBadgeHTML(net.security);
    const statusPillHTML = statusBadge(net.status, net.security);

    row.innerHTML = `
      <td class="ssid-cell">${escapeHtml(net.ssid)}</td>
      <td>
        ${net.signal} dBm
        <div class="signal-quality">${escapeHtml(net.signal_quality || "")}</div>
      </td>
      <td>
        <div class="signal-bar-wrap">
          <div class="signal-bar ${barColorClass}" style="width: ${signalPercentClamped}%;"></div>
        </div>
      </td>
      <td>${securityBadgeHTML}</td>
      <td>${statusPillHTML}</td>
    `;

    resultsBody.appendChild(row);
  });
}

// Helper: Signal Strength Color Class based on dBm
function getSignalColorClass(signal) {
  if (signal > -65) return "strong";      // Green
  if (signal >= -78) return "fair";       // Yellow
  return "weak";                           // Red
}

// Helper: Visual Security Badges
function getSecurityBadgeHTML(securityText) {
  const sec = (securityText || "").toUpperCase();
  let cssClass = "badge-sec-red";

  if (sec.includes("WPA3") || sec.includes("ENTERPRISE")) {
    cssClass = "badge-sec-green";
  } else if (sec.includes("WPA2")) {
    cssClass = "badge-sec-yellow";
  }

  return `<span class="badge-security ${cssClass}">${escapeHtml(securityText)}</span>`;
}

// Helper: Pill-Style Status Badge
function statusBadge(status, security) {
  const sec = (security || "").toUpperCase();
  const isRisky = status === "RISK" || status === "HIGH RISK" || sec.includes("OPEN") || sec.includes("WEP");

  if (isRisky) {
    return `<span class="status-pill risky">⚠️ RISKY</span>`;
  }
  return `<span class="status-pill safe">🛡️ SAFE</span>`;
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
  scanBtnText.textContent = isLoading ? "Scanning..." : "Scan";
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