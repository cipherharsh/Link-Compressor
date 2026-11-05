/** Validation for the user-chosen short-link domain ("host[:port][/base/path]"). */

const DOMAIN_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)*(:\d{1,5})?(\/[A-Za-z0-9._~-]+)*$/i;

/**
 * Normalises input like "https://lz.io/" or "Example.com/links" to "lz.io" /
 * "Example.com/links". Returns null if it isn't a plain host with an optional
 * port and base path (no query, fragment, spaces, or empty segments).
 */
export function normalizeDomain(input: string): string | null {
  const value = input.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  if (!value || !DOMAIN_PATTERN.test(value)) return null;
  return value;
}
