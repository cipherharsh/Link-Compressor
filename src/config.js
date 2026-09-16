/**
 * @file User-configurable settings for LinkZip.
 *
 * All state is persisted in localStorage (no backend).
 * Domain profiles let the user manage multiple branded short domains.
 */

const STORAGE_PREFIX = "linkzip_";
const DEFAULT_DOMAIN = "linkzip.pages.dev";

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
  return get("active_domain", DEFAULT_DOMAIN);
}
export function setDomain(domain) {
  set("active_domain", domain.replace(/\/+$/, "").trim());
}
export function getDefaultDomain() { return DEFAULT_DOMAIN; }

// ── Domain profiles ──────────────────────────────────────────────────────────

export function getDomainProfiles() {
  return get("domain_profiles", [{ name: "Default", domain: DEFAULT_DOMAIN }]);
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
    profiles = [{ name: "Default", domain: DEFAULT_DOMAIN }];
  }
  set("domain_profiles", profiles);
  // If removed profile was active, fall back to first
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
