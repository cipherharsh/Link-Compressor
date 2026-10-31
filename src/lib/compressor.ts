/*
 * PURPOSE: Pure client-side compression & decompression facade.
 * INPUTS: Target URLs or compressed string codes.
 * OUTPUTS: CompressionOutcome with reduction metrics and lossless roundtrip decompression.
 * DEPENDS_ON: src/compress.js, types.ts, trackingStripper.ts.
 * WHY_THIS_DESIGN: Reversible Huffman bitstream compression runs synchronously with zero network requests.
 */

import { encode, decode } from '../compress.js';
import { sanitizeAndCleanUrl } from './trackingStripper';
import type { CompressionOutcome } from './types';

/**
 * Extracts raw payload code from any URL or short link string.
 */
export function extractPayloadCode(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();

  // Handle hash route (#CODE or #/CODE)
  if (trimmed.startsWith('#')) {
    return trimmed.replace(/^#\/?/, '').trim();
  }

  // Parse if it looks like a URL or host path
  try {
    const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed);
    const parsed = new URL(hasScheme ? trimmed : `https://${trimmed}`);

    if (parsed.hash && parsed.hash.length > 1) {
      return parsed.hash.replace(/^#\/?/, '').trim();
    }

    const queryCode = parsed.searchParams.get('c') ||
      parsed.searchParams.get('code') ||
      parsed.searchParams.get('p') ||
      parsed.searchParams.get('l');
    if (queryCode) {
      return queryCode.trim();
    }

    const segments = parsed.pathname.split('/').map((s) => s.trim()).filter(Boolean);
    if (segments.length > 0) {
      return segments[segments.length - 1];
    }
  } catch {
    // Treat as raw code directly
  }

  return trimmed;
}

/**
 * Compresses a URL client-side and returns detailed metrics.
 */
export function compressUrl(rawUrl: string, stripTracking: boolean = true): CompressionOutcome {
  const sanitizeResult = sanitizeAndCleanUrl(rawUrl, stripTracking);

  if (!sanitizeResult.isValid) {
    throw new Error(sanitizeResult.errorMessage || 'Invalid URL');
  }

  const targetUrl = sanitizeResult.cleanedUrl;

  // Use ASCII mode for compact web share links and QR mode for dense QR matrices
  const asciiResult = encode(targetUrl, 'ascii');
  const asciiCode = typeof asciiResult === 'object' && asciiResult !== null ? asciiResult.encoded : asciiResult;

  const qrResult = encode(targetUrl, 'qr');
  const qrCode = typeof qrResult === 'object' && qrResult !== null ? qrResult.encoded : qrResult;

  // Base short URL format (works with 404.html redirection on GitHub/Vercel)
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://linkcp.vercel.app';
  const shortUrl = `${currentOrigin}/${asciiCode}`;

  const originalLength = rawUrl.trim().length;
  const cleanedLength = targetUrl.length;
  const compressedLength = shortUrl.length;
  const bytesSaved = Math.max(0, originalLength - compressedLength);
  const ratioPercent = originalLength > 0 ? Math.round((1 - compressedLength / originalLength) * 100) : 0;

  return {
    originalUrl: rawUrl.trim(),
    cleanedUrl: targetUrl,
    strippedParams: sanitizeResult.strippedParams,
    originalLength,
    cleanedLength,
    compressedLength,
    bytesSaved,
    ratioPercent,
    shortCode: asciiCode,
    shortUrl,
    qrPayload: qrCode
  };
}

/**
 * Decompresses an encoded payload back into the original URL.
 */
export function decompressCode(rawCodeOrUrl: string): string {
  const code = extractPayloadCode(rawCodeOrUrl);
  if (!code) {
    throw new Error('Please enter a compressed code or link');
  }

  // Try ASCII first
  try {
    return decode(code, 'ascii');
  } catch (asciiErr) {
    // If code has uppercase only, try QR mode
    try {
      return decode(code, 'qr');
    } catch {
      throw asciiErr instanceof Error ? asciiErr : new Error('Invalid compressed string');
    }
  }
}
