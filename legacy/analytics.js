/**
 * @file Compression analytics — produces a human‑readable per‑stage
 *       breakdown explaining *why* a URL compressed well or poorly.
 */

/**
 * Analyze a compression result and produce a detailed breakdown.
 *
 * @param {string} originalURL  The input URL.
 * @param {object} analyticsRaw Raw analytics from compress().
 * @returns {object} Structured breakdown with stages, warnings, and summary.
 */
export function analyzeCompression(originalURL, analyticsRaw) {
  const stages   = analyticsRaw.stages || [];
  const origLen  = originalURL.length;
  const compLen  = analyticsRaw.compressedLength || 0;
  const ratio    = origLen > 0 ? (1 - compLen / origLen) : 0;
  const warnings = [];
  const tips     = [];

  // ── Enrich each stage with status ─────────────────────────────────────
  const enriched = stages.map(stage => {
    const s = { ...stage };
    if (stage.hit === false) {
      if (stage.name.startsWith("TLD")) {
        warnings.push(`TLD "${extractQuoted(stage.name)}" is not in the dictionary — consider adding it`);
        s.status = "miss";
      } else if (stage.name.startsWith("Domain")) {
        warnings.push(`Domain "${extractQuoted(stage.name)}" is not in the dictionary — encoded raw`);
        s.status = "miss";
      }
    } else if (stage.hit === true) {
      s.status = "hit";
    } else {
      s.status = "neutral";
    }
    return s;
  });

  // ── Check for high‑entropy segments ───────────────────────────────────
  const queryStage = stages.find(s => s.name === "Query string");
  if (queryStage && queryStage.bitsUsed > 64) {
    warnings.push("Query string is long / high‑entropy — doesn't compress well");
  }

  const pathStage = stages.find(s => s.name.startsWith("Path"));
  if (pathStage && pathStage.bitsUsed > 100) {
    tips.push("Long paths with random tokens (UUIDs, hashes) resist compression");
  }

  // ── Compute char‑level savings ────────────────────────────────────────
  const charsSaved = origLen - compLen;

  // ── Overall rating ────────────────────────────────────────────────────
  let rating;
  if (ratio >= 0.5)      rating = "excellent";
  else if (ratio >= 0.3) rating = "good";
  else if (ratio >= 0.1) rating = "modest";
  else if (ratio >= 0)   rating = "minimal";
  else                   rating = "expansion"; // compressed is longer

  if (rating === "expansion") {
    warnings.push("Compressed output is longer than input — this URL's structure doesn't benefit from LinkZip's dictionaries");
    tips.push("Very short or random URLs may expand slightly due to encoding overhead");
  }

  return {
    originalLength:   origLen,
    compressedLength: compLen,
    charsSaved,
    ratio,
    percentage:       Math.round(ratio * 100),
    rating,
    stages:           enriched,
    warnings,
    tips,
  };
}

/** Extract a "quoted" substring from a stage name like `TLD: "com"`. */
function extractQuoted(str) {
  const m = str.match(/"([^"]+)"/);
  return m ? m[1] : str;
}

/**
 * Render a breakdown panel as an HTML string.
 *
 * @param {object} analysis  Output of analyzeCompression.
 * @returns {string} HTML fragment.
 */
export function renderBreakdownHTML(analysis) {
  const rows = analysis.stages.map(s => {
    const icon = s.status === "hit" ? "✓" : s.status === "miss" ? "✗" : "•";
    const cls  = s.status === "hit" ? "stage-hit" : s.status === "miss" ? "stage-miss" : "stage-neutral";
    const bits = s.bitsUsed !== undefined ? `${s.bitsUsed} bits` : "";
    const note = s.note || s.method || "";
    return `<div class="breakdown-row ${cls}">
      <span class="breakdown-icon">${icon}</span>
      <span class="breakdown-name">${escapeHTML(s.name)}</span>
      <span class="breakdown-detail">${escapeHTML(note)}</span>
      <span class="breakdown-bits">${bits}</span>
    </div>`;
  }).join("\n");

  const warnHTML = analysis.warnings.map(w =>
    `<div class="breakdown-warning">⚠ ${escapeHTML(w)}</div>`
  ).join("\n");

  const tipHTML = analysis.tips.map(t =>
    `<div class="breakdown-tip">💡 ${escapeHTML(t)}</div>`
  ).join("\n");

  return `
    <div class="breakdown-panel">
      <div class="breakdown-summary">
        <span class="breakdown-rating breakdown-${analysis.rating}">
          ${analysis.percentage}% smaller
        </span>
        <span class="breakdown-chars">
          ${analysis.originalLength} → ${analysis.compressedLength} chars
          (saved ${analysis.charsSaved})
        </span>
      </div>
      <div class="breakdown-stages">${rows}</div>
      ${warnHTML}
      ${tipHTML}
    </div>`;
}

function escapeHTML(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
