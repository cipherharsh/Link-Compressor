/**
 * @file UI glue — wires DOM events to the compression engine, QR generator,
 *       analytics, badge, and settings panel.
 */

import { encode, decode }                    from "./compress.js";
import { generateQR, renderToCanvas, renderToSVG, downloadPNG, downloadSVG } from "./qrcode.js";
import { analyzeCompression, renderBreakdownHTML } from "./analytics.js";
import { generateBadge, badgeSnippets }      from "./badge.js";
import {
  getDomain, setDomain, getDomainProfiles, addDomainProfile, removeDomainProfile,
  getErrorCorrectionLevel, setErrorCorrectionLevel,
  getTheme, setTheme,
} from "./config.js";

// ═══════════════════════════════════════════════════════════════════════════
// DOM references
// ═══════════════════════════════════════════════════════════════════════════

const $ = id => document.getElementById(id);

const inputURL          = $("input-url");
const inputDecode       = $("input-decode");
const resultCard        = $("result-card");
const resultText        = $("result-text");
const ratioBadge        = $("ratio-badge");
const breakdownEl       = $("breakdown-container");
const qrCanvas          = $("qr-canvas");
const qrVersion         = $("qr-version");
const qrMode            = $("qr-mode");
const badgePreview      = $("badge-preview");
const decodeResultCard  = $("decode-result-card");
const decodeResultText  = $("decode-result-text");
const compressError     = $("compress-error");
const decodeError       = $("decode-error");
const toast             = $("toast");
const settingsModal     = $("settings-modal");

let currentSVG = "";
let debounceTimer = null;

// ═══════════════════════════════════════════════════════════════════════════
// Theme
// ═══════════════════════════════════════════════════════════════════════════

function applyTheme() {
  const theme = getTheme();
  if (theme === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);
}
applyTheme();

// ═══════════════════════════════════════════════════════════════════════════
// Mode toggle
// ═══════════════════════════════════════════════════════════════════════════

$("tab-compress").addEventListener("click", () => {
  $("tab-compress").classList.add("active");
  $("tab-decode").classList.remove("active");
  $("compress-panel").style.display = "";
  $("decode-panel").style.display = "none";
});

$("tab-decode").addEventListener("click", () => {
  $("tab-decode").classList.add("active");
  $("tab-compress").classList.remove("active");
  $("decode-panel").style.display = "";
  $("compress-panel").style.display = "none";
});

// ═══════════════════════════════════════════════════════════════════════════
// Compress
// ═══════════════════════════════════════════════════════════════════════════

function doCompress() {
  const url = inputURL.value.trim();
  if (!url) {
    resultCard.classList.remove("visible");
    compressError.classList.remove("visible");
    return;
  }

  // Basic URL validation
  if (!/^https?:\/\//i.test(url)) {
    showError(compressError, "URL must start with http:// or https://");
    resultCard.classList.remove("visible");
    return;
  }

  try {
    const domain   = getDomain();
    const ecLevel  = getErrorCorrectionLevel();

    // ── ASCII encoding for link ──────────────────────────────────────
    const { encoded, analytics } = encode(url, "ascii");
    const protocol = (typeof window !== "undefined" && window.location.protocol === "http:") ? "http://" : "https://";
    const shortLink = `${protocol}${domain}/${encoded}`;

    resultText.textContent = shortLink;
    compressError.classList.remove("visible");
    resultCard.classList.add("visible");

    // ── Ratio badge ──────────────────────────────────────────────────
    const analysis = analyzeCompression(url, analytics);
    ratioBadge.textContent = `${analysis.percentage}% smaller · ${analysis.originalLength} → ${analysis.compressedLength} chars`;
    ratioBadge.className = `ratio-badge ratio-${analysis.rating}`;

    // ── Breakdown ────────────────────────────────────────────────────
    breakdownEl.innerHTML = renderBreakdownHTML(analysis);

    // ── QR code (encodes full short URL so phones open website) ─────
    try {
      const qr = generateQR(shortLink, ecLevel);
      renderToCanvas(qrCanvas, qr.matrix, { scale: 8, margin: 4 });
      currentSVG = renderToSVG(qr.matrix, { scale: 8, margin: 4 });
      qrVersion.textContent = `Version: ${qr.version}`;
      qrMode.textContent    = `Mode: ${qr.mode}`;
    } catch (qrErr) {
      console.warn("QR generation failed:", qrErr);
      qrVersion.textContent = "Version: —";
      qrMode.textContent    = "QR error";
    }

    // ── Badge ────────────────────────────────────────────────────────
    try {
      const { svg, isNewBest } = generateBadge(analysis.originalLength, analysis.compressedLength);
      badgePreview.innerHTML = svg;
      if (isNewBest) showToast("🏆 New personal best!");
    } catch (e) {
      console.warn("Badge generation failed:", e);
    }

  } catch (err) {
    showError(compressError, `Compression failed: ${err.message}`);
    resultCard.classList.remove("visible");
  }
}

inputURL.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(doCompress, 300);
});

// ═══════════════════════════════════════════════════════════════════════════
// Decode
// ═══════════════════════════════════════════════════════════════════════════

function extractPayload(raw) {
  let encoded = raw.trim();
  if (/^https?:\/\//i.test(encoded)) {
    try {
      const u = new URL(encoded);
      if (u.hash && u.hash.length > 1) {
        encoded = u.hash.replace(/^#\/?/, "");
      } else if (u.search && u.search.length > 1) {
        const params = new URLSearchParams(u.search);
        encoded = params.get("c") || params.get("p") || params.get("l") || u.search.replace(/^\?/, "");
      } else {
        const parts = u.pathname.split("/").filter(Boolean);
        encoded = parts[parts.length - 1] || "";
      }
    } catch {
      encoded = encoded.replace(/^https?:\/\/[^\/]+\/?/, "");
    }
  } else if (encoded.includes("/")) {
    const parts = encoded.split("/").filter(Boolean);
    encoded = parts[parts.length - 1] || "";
  }
  return encoded;
}

function doDecode() {
  const raw = inputDecode.value.trim();
  if (!raw) {
    decodeResultCard.classList.remove("visible");
    decodeError.classList.remove("visible");
    return;
  }

  try {
    const encoded = extractPayload(raw);

    let url;
    try {
      url = decode(encoded, "ascii");
    } catch {
      url = decode(encoded, "qr");
    }

    decodeResultText.textContent = url;
    decodeResultText.href = url;
    decodeError.classList.remove("visible");
    decodeResultCard.classList.add("visible");
  } catch (err) {
    showError(decodeError, `Decode failed: ${err.message}`);
    decodeResultCard.classList.remove("visible");
  }
}

inputDecode.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(doDecode, 300);
});

// Check if loaded with a hash or query payload (e.g. index.html#ABC or index.html?c=ABC)
(function checkInitialPayload() {
  if (typeof window === "undefined" || !window.location) return;
  let initPayload = "";
  if (window.location.hash && window.location.hash.length > 1) {
    initPayload = window.location.hash.replace(/^#\/?/, "");
  } else if (window.location.search && window.location.search.length > 1) {
    const params = new URLSearchParams(window.location.search);
    initPayload = params.get("c") || params.get("p") || params.get("l") || window.location.search.slice(1);
  }
  if (initPayload && initPayload !== "compress" && initPayload !== "decode") {
    try {
      let targetUrl;
      try {
        targetUrl = decode(initPayload, "ascii");
      } catch {
        targetUrl = decode(initPayload, "qr");
      }
      if (/^https?:\/\//i.test(targetUrl)) {
        window.location.replace(targetUrl);
        return;
      }
    } catch {}

    // Fallback: populate decode tab
    $("tab-decode").click();
    inputDecode.value = initPayload;
    doDecode();
  }
})();

// ═══════════════════════════════════════════════════════════════════════════
// Clipboard
// ═══════════════════════════════════════════════════════════════════════════

$("btn-copy").addEventListener("click", () => {
  navigator.clipboard.writeText(resultText.textContent).then(() => showToast("Copied!"));
});

$("btn-copy-decoded").addEventListener("click", () => {
  navigator.clipboard.writeText(decodeResultText.textContent).then(() => showToast("Copied!"));
});

// ═══════════════════════════════════════════════════════════════════════════
// QR download
// ═══════════════════════════════════════════════════════════════════════════

$("btn-dl-png").addEventListener("click", () => downloadPNG(qrCanvas));
$("btn-dl-svg").addEventListener("click", () => {
  if (currentSVG) downloadSVG(currentSVG);
});

// ═══════════════════════════════════════════════════════════════════════════
// Badge snippets
// ═══════════════════════════════════════════════════════════════════════════

$("btn-badge-md").addEventListener("click", () => {
  const svg = badgePreview.innerHTML;
  if (svg) {
    const { markdown } = badgeSnippets(svg);
    navigator.clipboard.writeText(markdown).then(() => showToast("Markdown copied!"));
  }
});

$("btn-badge-html").addEventListener("click", () => {
  const svg = badgePreview.innerHTML;
  if (svg) {
    const { html } = badgeSnippets(svg);
    navigator.clipboard.writeText(html).then(() => showToast("HTML copied!"));
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// Settings
// ═══════════════════════════════════════════════════════════════════════════

$("btn-settings").addEventListener("click", () => {
  openSettings();
  settingsModal.classList.add("open");
});

$("btn-close-settings").addEventListener("click", () => {
  settingsModal.classList.remove("open");
  // Apply settings
  setDomain($("setting-domain").value || getDomain());
  setErrorCorrectionLevel($("setting-ec").value);
  setTheme($("setting-theme").value);
  applyTheme();
  // Re‑compress if URL is present
  if (inputURL.value.trim()) doCompress();
});

settingsModal.addEventListener("click", (e) => {
  if (e.target === settingsModal) settingsModal.classList.remove("open");
});

function openSettings() {
  $("setting-domain").value = getDomain();
  $("setting-ec").value     = getErrorCorrectionLevel();
  $("setting-theme").value  = getTheme();
  renderDomainList();
}

function renderDomainList() {
  const list = $("domain-list");
  const profiles = getDomainProfiles();
  list.innerHTML = profiles.map(p =>
    `<li>
      <span><strong>${esc(p.name)}</strong> — ${esc(p.domain)}</span>
      <button class="btn-icon" data-remove-domain="${esc(p.domain)}" title="Remove">✕</button>
    </li>`
  ).join("");

  list.querySelectorAll("[data-remove-domain]").forEach(btn => {
    btn.addEventListener("click", () => {
      removeDomainProfile(btn.dataset.removeDomain);
      renderDomainList();
    });
  });
}

$("btn-add-profile").addEventListener("click", () => {
  const name   = $("new-profile-name").value.trim();
  const domain = $("new-profile-domain").value.trim();
  if (name && domain) {
    addDomainProfile(name, domain);
    $("new-profile-name").value = "";
    $("new-profile-domain").value = "";
    renderDomainList();
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

function showError(el, msg) {
  el.textContent = msg;
  el.classList.add("visible");
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
