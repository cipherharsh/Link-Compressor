/*
 * PURPOSE: Client-side URL sanitizer and tracking parameter stripper.
 * INPUTS: Raw user input URL string and stripTracking boolean toggle.
 * OUTPUTS: CleanUrlResult containing normalized URL, validity, and list of stripped tracking parameters.
 * DEPENDS_ON: Standard Web URL API, types.ts.
 * WHY_THIS_DESIGN: Zero-backend URL cleaning protects user privacy and reduces payload length before bitstream compression.
 */

import type { CleanUrlResult, StrippedParam } from './types';

// Exhaustive catalog of known analytics, ad-tracking, and click IDs
const TRACKING_PATTERNS = [
  // Google / UTM
  /^utm_(source|medium|campaign|term|content|id|reader|name|cid|swu)$/i,
  /^gclid$/i,
  /^gclsrc$/i,
  /^dclid$/i,
  /^wbraid$/i,
  /^gbraid$/i,
  // Meta / Facebook
  /^fbclid$/i,
  /^fbc$/i,
  /^fbp$/i,
  // Twitter / X
  /^twclid$/i,
  /^ref_src$/i,
  /^ref_url$/i,
  // Mailchimp & Marketing Newsletters
  /^mc_cid$/i,
  /^mc_eid$/i,
  // Microsoft / Bing
  /^msclkid$/i,
  // TikTok & ByteDance
  /^ttclid$/i,
  // Pinterest
  /^epik$/i,
  // Instagram
  /^igshid$/i,
  // Yandex
  /^yclid$/i,
  /^ymclid$/i,
  // HubSpot
  /^_hsenc$/i,
  /^_hsmi$/i,
  /^hsCtsTracking$/i,
  // Adobe / Omniture
  /^s_kwcid$/i,
  /^sc_cid$/i,
  // Generic click identifiers
  /^action_object_map$/i,
  /^action_type_map$/i,
  /^action_ref_map$/i,
  /^_ga$/i,
  /^_gl$/i,
  /^campaign_id$/i,
  /^ad_id$/i,
  /^tracker_id$/i
];

function isTrackingParam(key: string): boolean {
  return TRACKING_PATTERNS.some((pattern) => pattern.test(key));
}

/**
 * Validates, normalizes, and strips tracking parameters from a raw URL.
 */
export function sanitizeAndCleanUrl(rawInput: string, stripTracking: boolean = true): CleanUrlResult {
  const trimmed = rawInput.trim();

  if (!trimmed) {
    return {
      originalUrl: '',
      cleanedUrl: '',
      strippedParams: [],
      hasTrackingParams: false,
      isValid: false,
      errorMessage: 'Please enter a URL'
    };
  }

  // Security check: strictly disallow dangerous protocol schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return {
      originalUrl: trimmed,
      cleanedUrl: '',
      strippedParams: [],
      hasTrackingParams: false,
      isValid: false,
      errorMessage: 'Security restriction: executable or data schemes are not permitted'
    };
  }

  // Prepend scheme if user entered naked domain (e.g., "example.com/path")
  let normalizedInput = trimmed;
  if (!/^https?:\/\//i.test(trimmed)) {
    // If it looks like a domain or localhost
    if (/^([a-z0-9-]+\.)+[a-z]{2,}(\/.*)?$/i.test(trimmed) || /^localhost(:[0-9]+)?(\/.*)?$/i.test(trimmed)) {
      normalizedInput = 'https://' + trimmed;
    }
  }

  let parsed: URL;
  try {
    parsed = new URL(normalizedInput);
  } catch {
    return {
      originalUrl: trimmed,
      cleanedUrl: '',
      strippedParams: [],
      hasTrackingParams: false,
      isValid: false,
      errorMessage: 'Invalid URL format. Please include a valid web address.'
    };
  }

  const strippedParams: StrippedParam[] = [];
  const cleanUrlObj = new URL(parsed.toString());

  if (stripTracking) {
    const keysToRemove: string[] = [];
    cleanUrlObj.searchParams.forEach((val, key) => {
      if (isTrackingParam(key)) {
        strippedParams.push({ key, value: val });
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach((key) => {
      cleanUrlObj.searchParams.delete(key);
    });
  }

  // Strip trailing ? if query is completely emptied
  let cleaned = cleanUrlObj.toString();
  if (cleaned.endsWith('?')) {
    cleaned = cleaned.slice(0, -1);
  }

  return {
    originalUrl: trimmed,
    cleanedUrl: cleaned,
    strippedParams,
    hasTrackingParams: strippedParams.length > 0,
    isValid: true
  };
}
