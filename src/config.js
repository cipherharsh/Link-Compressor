/**
 * @file User-configurable settings for LinkZip.
 *
 * All state is persisted in localStorage (no backend).
 * Domain profiles let the user manage multiple branded short domains.
 */

const STORAGE_PREFIX = "linkzip_";
const FALLBACK_DOMAIN = "linkzip.pages.dev";

export function detectCurrentDomain() {
  if (typeof window !== "undefined" && window.location) {
    const host = window.location.host;
    if (!host) return FALLBACK_DOMAIN;
    let path = window.location.pathname
      .replace(/\/index\.html$/i, "")
      .replace(/\/404\.html$/i, "");
    if (path.endsWith("/")) path = path.slice(0, -1);
    const full = (host + path).replace(/\/+$/, "");
    return full || FALLBACK_DOMAIN;
  }
  return FALLBACK_DOMAIN;
}

export function getDefaultDomain() {
  return detectCurrentDomain();
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function get(key, fallback) {
  try {
    if (typeof localStorage === "undefined") return fallback;
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch { return fallback; }
}
function set(key, value) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    }
  } catch {}
}

// ── Active domain ────────────────────────────────────────────────────────────

export function getDomain() {
  const current = detectCurrentDomain();
  const saved = get("active_domain", null);
  if (saved && saved !== FALLBACK_DOMAIN) return saved;
  return current;
}
export function setDomain(domain) {
  set("active_domain", domain.replace(/\/+$/, "").trim());
}

// ── Domain profiles ──────────────────────────────────────────────────────────

export function getDomainProfiles() {
  const current = detectCurrentDomain();
  const defaultProfiles = current !== FALLBACK_DOMAIN
    ? [{ name: "Current Domain", domain: current }, { name: "LinkZip Default", domain: FALLBACK_DOMAIN }]
    : [{ name: "Default", domain: FALLBACK_DOMAIN }];
  return get("domain_profiles", defaultProfiles);
}
export function addDomainProfile(name, domain) {
  const profiles = getDomainProfiles();
  const d = domain.replace(/\/+$/, "").trim();
  if (profiles.some(p => p.domain === d)) return false; // duplicate
  profiles.push({ name, domain: d });
  set("domain_profiles", profiles);
  return true;
}
export function removeDomainProfile(domain) {
  let profiles = getDomainProfiles();
  profiles = profiles.filter(p => p.domain !== domain);
  if (profiles.length === 0) {
    profiles = [{ name: "Default", domain: detectCurrentDomain() }];
  }
  set("domain_profiles", profiles);
  if (getDomain() === domain) setDomain(profiles[0].domain);
}

// ── QR error correction ─────────────────────────────────────────────────────

export function getErrorCorrectionLevel() {
  return get("ec_level", "M"); // L, M, Q, H
}
export function setErrorCorrectionLevel(level) {
  if (["L","M","Q","H"].includes(level)) set("ec_level", level);
}

// ── Personal‑best tracking (for badges) ──────────────────────────────────────

export function getPersonalBests() {
  return get("personal_bests", []);
}
export function recordCompressionResult(originalLen, compressedLen) {
  const ratio = 1 - compressedLen / originalLen;
  const bests = getPersonalBests();
  const isNewBest = bests.length === 0 || ratio > Math.max(...bests.map(b => b.ratio));
  bests.push({ ratio, originalLen, compressedLen, date: Date.now() });
  // Keep top 20
  bests.sort((a, b) => b.ratio - a.ratio);
  set("personal_bests", bests.slice(0, 20));
  return isNewBest;
}

// ── Theme ────────────────────────────────────────────────────────────────────

export function getTheme() {
  return get("theme", "auto"); // auto, light, dark
}
export function setTheme(theme) {
  if (["auto","light","dark"].includes(theme)) set("theme", theme);
}
