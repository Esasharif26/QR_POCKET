const form = document.getElementById("qr-form");
const urlInput = document.getElementById("url-input");
const fileNameInput = document.getElementById("filename-input");
const statusText = document.getElementById("status-text");
const resultUrl = document.getElementById("result-url");
const downloadBtn = document.getElementById("download-btn");
const shareBtn = document.getElementById("share-btn");
const installBtn = document.getElementById("install-btn");
const historyList = document.getElementById("history-list");
const clearHistoryBtn = document.getElementById("clear-history-btn");
const viewsCount = document.getElementById("views-count");
const installsCount = document.getElementById("installs-count");
const analyticsStatus = document.getElementById("analytics-status");
const qrImage = document.getElementById("qr-image");
const qrCanvas = document.getElementById("qr-canvas");

const HISTORY_KEY = "qr-generator-history";
const HISTORY_LIMIT = 8;
const VISIT_TRACKED_KEY = "qr-pocket-visit-tracked";
const COUNTER_API_BASE = "https://api.counterapi.dev/v1";
const COUNTER_NAMESPACE = "esasharif26-qr-pocket";
const COUNTER_KEYS = {
  visits: "site-visits",
  installs: "pwa-installs",
};

let deferredInstallPrompt = null;
const qr = new QRious({
  element: qrCanvas,
  value: "https://example.com",
  size: 320,
  padding: 16,
  background: "#ffffff",
  foreground: "#2d1b0f",
  level: "H",
});

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.classList.toggle("error", isError);
}

function setAnalyticsStatus(message) {
  analyticsStatus.textContent = message;
}

function makeSafeFileName(value) {
  return (
    value
      .trim()
      .replace(/\.png$/i, "")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "qr-code"
  );
}

function normalizeUrl(rawValue) {
  const trimmed = rawValue.trim();

  if (!trimmed) {
    throw new Error("Please enter a URL.");
  }

  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(normalized);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Use an HTTP or HTTPS URL.");
  }

  return parsed.toString();
}

function getHistory() {
  try {
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function formatCount(value) {
  return new Intl.NumberFormat().format(value);
}

function extractCounterValue(payload) {
  const candidate = payload?.value ?? payload?.data ?? payload?.count;
  return Number.isFinite(candidate) ? candidate : Number(candidate) || 0;
}

async function getCounterValue(name) {
  const response = await fetch(`${COUNTER_API_BASE}/${COUNTER_NAMESPACE}/${name}`);

  if (!response.ok) {
    throw new Error("Could not load analytics.");
  }

  const data = await response.json();
  return extractCounterValue(data);
}

async function incrementCounter(name) {
  const response = await fetch(`${COUNTER_API_BASE}/${COUNTER_NAMESPACE}/${name}/up`);

  if (!response.ok) {
    throw new Error("Could not update analytics.");
  }

  const data = await response.json();
  return extractCounterValue(data);
}

async function refreshAnalytics(options = {}) {
  const { incrementVisit = false } = options;

  try {
    setAnalyticsStatus("Updating stats...");

    const visitPromise = incrementVisit
      ? incrementCounter(COUNTER_KEYS.visits)
      : getCounterValue(COUNTER_KEYS.visits);

    const [visitValue, installValue] = await Promise.all([
      visitPromise,
      getCounterValue(COUNTER_KEYS.installs),
    ]);

    viewsCount.textContent = formatCount(visitValue);
    installsCount.textContent = formatCount(installValue);
    setAnalyticsStatus("Stats updated");
  } catch (error) {
    setAnalyticsStatus("Stats unavailable right now");
  }
}

async function trackVisitOnce() {
  if (sessionStorage.getItem(VISIT_TRACKED_KEY) === "true") {
    await refreshAnalytics();
    return;
  }

  sessionStorage.setItem(VISIT_TRACKED_KEY, "true");
  await refreshAnalytics({ incrementVisit: true });
}

function updateHistory(url, fileName) {
  const nextHistory = getHistory()
    .filter((entry) => !(entry.url === url && entry.fileName === fileName));
  nextHistory.unshift({ url, fileName });
  saveHistory(nextHistory.slice(0, HISTORY_LIMIT));
  renderHistory();
}

function renderHistory() {
  const history = getHistory();
  historyList.innerHTML = "";

  if (!history.length) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "history-item empty";
    emptyItem.textContent = "No history yet. Generate your first QR code to see it here.";
    historyList.appendChild(emptyItem);
    return;
  }

  history.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "history-item";

    const main = document.createElement("div");
    main.className = "history-item-main";

    const name = document.createElement("p");
    name.className = "history-item-name";
    name.textContent = `${entry.fileName}.png`;

    const url = document.createElement("p");
    url.className = "history-item-url";
    url.textContent = entry.url;

    const useBtn = document.createElement("button");
    useBtn.type = "button";
    useBtn.className = "ghost-btn history-item-btn";
    useBtn.textContent = "Use again";
    useBtn.addEventListener("click", async () => {
      urlInput.value = entry.url;
      fileNameInput.value = entry.fileName;
      await renderQr(entry.url, entry.fileName, false);
    });

    main.append(name, url);
    item.append(main, useBtn);
    historyList.appendChild(item);
  });
}

async function renderQr(url, fileName, shouldStore = true) {
  qr.value = url;
  qrImage.src = qr.toDataURL("image/png");

  resultUrl.textContent = url;
  fileNameInput.value = fileName;
  setStatus("QR code generated successfully.");

  if (shouldStore) {
    updateHistory(url, fileName);
  }
}

function canvasToBlob() {
  return new Promise((resolve, reject) => {
    qrCanvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Could not prepare the QR image for download."));
      }
    }, "image/png");
  });
}

async function downloadCurrentQr() {
  const blob = await canvasToBlob();
  const safeName = makeSafeFileName(fileNameInput.value || resultUrl.textContent);
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = downloadUrl;
  link.download = `${safeName}.png`;
  link.click();

  setTimeout(() => URL.revokeObjectURL(downloadUrl), 500);
}

async function shareCurrentQr() {
  const safeName = makeSafeFileName(fileNameInput.value || resultUrl.textContent);
  const blob = await canvasToBlob();
  const file = new File([blob], `${safeName}.png`, { type: "image/png" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      title: "QR Pocket",
      text: resultUrl.textContent,
      files: [file],
    });
    setStatus("Share dialog opened.");
    return;
  }

  if (navigator.share) {
    await navigator.share({
      title: "QR Pocket",
      text: resultUrl.textContent,
      url: resultUrl.textContent,
    });
    setStatus("Share dialog opened.");
    return;
  }

  await navigator.clipboard.writeText(resultUrl.textContent);
  setStatus("Share is not available here, so the URL was copied instead.");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const validUrl = normalizeUrl(urlInput.value);
    const safeFileName = makeSafeFileName(
      fileNameInput.value || new URL(validUrl).hostname
    );
    urlInput.value = validUrl;
    await renderQr(validUrl, safeFileName);
  } catch (error) {
    setStatus(error.message, true);
  }
});

downloadBtn.addEventListener("click", async () => {
  try {
    await downloadCurrentQr();
  } catch (error) {
    setStatus(error.message, true);
  }
});

shareBtn.addEventListener("click", async () => {
  try {
    await shareCurrentQr();
  } catch (error) {
    setStatus(error.message, true);
  }
});

clearHistoryBtn.addEventListener("click", () => {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
  setStatus("History cleared.");
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installBtn.hidden = false;
});

installBtn.addEventListener("click", async () => {
  if (!deferredInstallPrompt) {
    return;
  }

  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installBtn.hidden = true;
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installBtn.hidden = true;
  setStatus("App installed successfully.");

  incrementCounter(COUNTER_KEYS.installs)
    .then((installValue) => {
      installsCount.textContent = formatCount(installValue);
      setAnalyticsStatus("Install tracked");
    })
    .catch(() => {
      setAnalyticsStatus("Install happened, but tracking is unavailable");
    });
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js");
  });
}

renderHistory();
renderQr("https://example.com", "example", false);
trackVisitOnce();
