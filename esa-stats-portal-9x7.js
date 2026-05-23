const ADMIN_KEY_STORAGE = "qr-pocket-admin-auth";
const ADMIN_CODE = "EsaSharif26@QRstats";
const COUNTER_API_BASE = "https://api.counterapi.dev/v1";
const COUNTER_NAMESPACE = "esasharif26-qr-pocket";
const COUNTER_KEYS = {
  visits: "site-visits",
  installs: "pwa-installs",
  generations: "qr-generations",
};

const loginCard = document.getElementById("login-card");
const dashboardCard = document.getElementById("dashboard-card");
const loginForm = document.getElementById("admin-login-form");
const adminPasscode = document.getElementById("admin-passcode");
const adminStatus = document.getElementById("admin-status");
const adminStatsStatus = document.getElementById("admin-stats-status");
const adminVisits = document.getElementById("admin-visits");
const adminInstalls = document.getElementById("admin-installs");
const adminGenerations = document.getElementById("admin-generations");
const refreshStatsBtn = document.getElementById("refresh-stats-btn");
const logoutBtn = document.getElementById("logout-btn");

function formatCount(value) {
  return new Intl.NumberFormat().format(value);
}

function extractCounterValue(payload) {
  const candidate = payload?.value ?? payload?.data ?? payload?.count;
  return Number.isFinite(candidate) ? candidate : Number(candidate) || 0;
}

function setAdminStatus(message, isError = false) {
  adminStatus.textContent = message;
  adminStatus.classList.toggle("error", isError);
}

function setStatsStatus(message, isError = false) {
  adminStatsStatus.textContent = message;
  adminStatsStatus.classList.toggle("error", isError);
}

function showDashboard() {
  loginCard.hidden = true;
  dashboardCard.hidden = false;
}

function showLogin() {
  loginCard.hidden = false;
  dashboardCard.hidden = true;
}

async function getCounterValue(name) {
  const response = await fetch(`${COUNTER_API_BASE}/${COUNTER_NAMESPACE}/${name}`);

  if (!response.ok) {
    throw new Error("Could not load stats.");
  }

  const data = await response.json();
  return extractCounterValue(data);
}

async function loadStats() {
  try {
    setStatsStatus("Loading stats...");

    const [visits, installs, generations] = await Promise.all([
      getCounterValue(COUNTER_KEYS.visits),
      getCounterValue(COUNTER_KEYS.installs),
      getCounterValue(COUNTER_KEYS.generations),
    ]);

    adminVisits.textContent = formatCount(visits);
    adminInstalls.textContent = formatCount(installs);
    adminGenerations.textContent = formatCount(generations);
    setStatsStatus("Stats updated");
  } catch (error) {
    setStatsStatus("Could not load stats right now.", true);
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (adminPasscode.value !== ADMIN_CODE) {
    setAdminStatus("Wrong admin code.", true);
    return;
  }

  sessionStorage.setItem(ADMIN_KEY_STORAGE, "true");
  setAdminStatus("Access granted.");
  showDashboard();
  await loadStats();
});

refreshStatsBtn.addEventListener("click", async () => {
  await loadStats();
});

logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem(ADMIN_KEY_STORAGE);
  adminPasscode.value = "";
  setAdminStatus("Only the admin can view these stats.");
  showLogin();
});

if (sessionStorage.getItem(ADMIN_KEY_STORAGE) === "true") {
  showDashboard();
  loadStats();
} else {
  showLogin();
}
