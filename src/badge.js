/**
 * @file Generates shareable "compression proof" badges showing bytes saved,
 *       compression ratio, and optional personal‑best indicators.
 */

import { getPersonalBests, recordCompressionResult } from "./config.js";

// ── SVG Badge ────────────────────────────────────────────────────────────────

/**
 * Generate a shields.io‑style SVG badge.
 *
 * @param {number} originalLen   Original URL character count.
 * @param {number} compressedLen Compressed string character count.
 * @returns {{ svg: string, isNewBest: boolean }}
 */
export function generateBadge(originalLen, compressedLen) {
  const saved   = originalLen - compressedLen;
  const pct     = Math.round((1 - compressedLen / originalLen) * 100);
  const isNew   = recordCompressionResult(originalLen, compressedLen);
  const trophy  = isNew ? " 🏆" : "";

  const label     = "LinkZip";
  const value     = `${pct}% smaller (${saved} chars saved)${trophy}`;
  const labelW    = label.length * 7.5 + 16;
  const valueW    = value.length * 6.5 + 16;
  const totalW    = labelW + valueW;

  const labelColor = "#555";
  const valueColor = pct >= 50 ? "#4c1" : pct >= 25 ? "#a4a61d" : pct >= 0 ? "#fe7d37" : "#e05d44";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="20" role="img"
  aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${totalW}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelW}" height="20" fill="${labelColor}"/>
    <rect x="${labelW}" width="${valueW}" height="20" fill="${valueColor}"/>
    <rect width="${totalW}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif"
     font-size="11" text-rendering="geometricPrecision">
    <text x="${labelW / 2}" y="14">${escSVG(label)}</text>
    <text x="${labelW + valueW / 2}" y="14">${escSVG(value)}</text>
  </g>
</svg>`;

  return { svg, isNewBest: isNew };
}

function escSVG(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── PNG export ───────────────────────────────────────────────────────────────

/**
 * Render the SVG badge to a PNG data‑URL via an off‑screen canvas.
 *
 * @param {string} svg  SVG markup.
 * @returns {Promise<string>} PNG data‑URL.
 */
export async function badgeToPNG(svg) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url  = URL.createObjectURL(blob);

    img.onload = () => {
      const c   = document.createElement("canvas");
      const s   = 2; // retina
      c.width   = img.naturalWidth * s;
      c.height  = img.naturalHeight * s;
      const ctx = c.getContext("2d");
      ctx.scale(s, s);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Badge render failed")); };
    img.src = url;
  });
}

// ── Copy snippets ────────────────────────────────────────────────────────────

/**
 * Generate copyable embed snippets for the badge.
 *
 * @param {string} svg   Raw SVG string.
 * @returns {{ markdown: string, html: string }}
 */
export function badgeSnippets(svg) {
  const b64 = typeof btoa === "function"
    ? btoa(unescape(encodeURIComponent(svg)))
    : Buffer.from(svg).toString("base64");
  const dataURI = "data:image/svg+xml;base64," + b64;
  return {
    markdown: `![LinkZip compression badge](${dataURI})`,
    html:     `<img src="${dataURI}" alt="LinkZip compression badge" />`,
  };
}

// ── Leaderboard ──────────────────────────────────────────────────────────────

/**
 * Return the top personal‑best compression ratios.
 *
 * @param {number} n  Max entries.
 * @returns {{ ratio: number, originalLen: number, compressedLen: number, date: number }[]}
 */
export function getLeaderboard(n = 10) {
  return getPersonalBests().slice(0, n);
}
