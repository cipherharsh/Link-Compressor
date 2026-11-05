/** Local in-browser compression engine, wrapping compress.js / config.js in the UI contract. */

import { encode, decode } from '../compress.js';
import { getDomain } from '../config.js';

export interface CompressionStage {
  id: string;
  label: string;
  bitsBefore: number;
  bitsAfter: number;
}

export interface CompressResponse {
  code: string;
  shortUrl: string;
  originalLength: number;
  compressedLength: number;
  qrPayload: string;
  stages: CompressionStage[];
}

export interface DecompressResponse {
  url: string;
}

export interface StatsResponse {
  totalLinks: number;
  totalBytesSaved: number;
  avgRatio: number;
}

export interface LeaderboardEntry {
  handle: string;
  xp: number;
  bestRatio: number;
}

// Local mock stats for offline mode, persisted in memory/localStorage
const STORAGE_KEY_STATS = 'linkzip_offline_stats';

function getStoredStats(): StatsResponse {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STATS);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { totalLinks: 12480, totalBytesSaved: 489200, avgRatio: 0.58 };
}

function updateStoredStats(bytesSaved: number, ratio: number): StatsResponse {
  const current = getStoredStats();
  const next = {
    totalLinks: current.totalLinks + 1,
    totalBytesSaved: current.totalBytesSaved + Math.max(0, bytesSaved),
    avgRatio: Number(((current.avgRatio * current.totalLinks + ratio) / (current.totalLinks + 1)).toFixed(2))
  };
  try {
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

/**
 * Extracts a compressed code from various user input formats:
 * - Direct codes: "144fWYB4XvoHE2CZgUN5F9e5HDJMzPPHM"
 * - Domain paths: "localhost:3000/144fWYB4XvoHE2CZgUN5F9e5HDJMzPPHM"
 * - Full URLs: "http://localhost:3000/144fWYB4XvoHE2CZgUN5F9e5HDJMzPPHM"
 * - Hash URLs: "https://lz.io/#144fWYB4XvoHE2CZgUN5F9e5HDJMzPPHM"
 * - Query URLs: "https://linkzip.pages.dev/?c=144fWYB4XvoHE2CZgUN5F9e5HDJMzPPHM"
 */
export function extractPayload(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let str = raw.trim();

  // 1. Hash prefix: #144f... or #/144f...
  if (str.startsWith('#')) {
    return str.replace(/^#\/?/, '').trim();
  }

  // 2. Parse as URL if it contains protocol or host/path separators
  const hasProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(str);
  let parsed: URL | null = null;
  try {
    parsed = new URL(hasProtocol ? str : `http://${str}`);
  } catch {
    parsed = null;
  }

  if (parsed) {
    // Check hash first (e.g. localhost:3000/#144fWY... or linkzip.pages.dev/#/144fWY...)
    if (parsed.hash && parsed.hash.length > 1) {
      const hashClean = parsed.hash.replace(/^#\/?/, '').trim();
      if (hashClean) return hashClean;
    }

    // Check query params (?c=... or ?code=... or ?p=... or ?l=...)
    if (parsed.search && parsed.search.length > 1) {
      const p = parsed.searchParams.get('c') ||
                parsed.searchParams.get('code') ||
                parsed.searchParams.get('p') ||
                parsed.searchParams.get('l');
      if (p) return p.trim();
      const rawQ = parsed.search.replace(/^\?/, '').trim();
      if (rawQ && !rawQ.includes('=')) return rawQ;
    }

    // Check pathname segments (e.g. /144fWYB4XvoHE2CZgUN5F9e5HDJMzPPHM or /app/144fWY...)
    const segs = parsed.pathname.split('/').map((s) => s.trim()).filter(Boolean);
    if (segs.length > 0) {
      const last = segs[segs.length - 1];
      if (last && last !== 'index.html' && last !== '404.html' && last !== '404') {
        return last;
      }
    }
  }

  // Fallback: If string contains slashes, take the last non-empty segment
  if (str.includes('/')) {
    const parts = str.split('/').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) {
      return parts[parts.length - 1];
    }
  }

  return str;
}

export function localCompress(url: string): CompressResponse {
  if (!url || typeof url !== 'string') {
    throw new Error('A valid URL string is required.');
  }

  const trimmed = url.trim();
  const asciiResult = encode(trimmed, 'ascii');

  const baseDomain = typeof window !== 'undefined' ? getDomain() : 'https://lz.io';
  const cleanDomain = baseDomain.replace(/\/+$/, '');
  let domainWithProto = cleanDomain;
  if (!/^https?:\/\//i.test(domainWithProto)) {
    const proto = (typeof window !== 'undefined' && window.location?.protocol === 'http:') ? 'http://' : 'https://';
    domainWithProto = `${proto}${cleanDomain}`;
  }
  const shortUrl = `${domainWithProto}/${asciiResult.encoded}`;

  // Map internal analytics stages to API contract
  let accumulatedBits = trimmed.length * 8;
  const stages: CompressionStage[] = [];

  const analyticsObj = asciiResult.analytics as { stages?: Array<{ name: string; bitsUsed?: number; saved?: number }>; ratio?: number } | undefined;

  if (analyticsObj && Array.isArray(analyticsObj.stages)) {
    analyticsObj.stages.forEach((st, index: number) => {
      const bitsAfter = Math.max(8, accumulatedBits - ((st.saved || 0) * 8));
      stages.push({
        id: `stage-${index + 1}`,
        label: st.name,
        bitsBefore: accumulatedBits,
        bitsAfter: bitsAfter
      });
      accumulatedBits = bitsAfter;
    });
  }

  // If no stages recorded, provide synthetic steps for visualization
  if (stages.length === 0) {
    const origBits = trimmed.length * 8;
    const finalBits = asciiResult.encoded.length * 6; // ~6 bits per ASCII char
    stages.push(
      { id: 'stage-1', label: 'Strip Protocol & Flags', bitsBefore: origBits, bitsAfter: Math.round(origBits * 0.85) },
      { id: 'stage-2', label: 'Dictionary & Huffman Match', bitsBefore: Math.round(origBits * 0.85), bitsAfter: Math.round(origBits * 0.55) },
      { id: 'stage-3', label: 'Entropy Packing', bitsBefore: Math.round(origBits * 0.55), bitsAfter: Math.round(origBits * 0.45) },
      { id: 'stage-4', label: 'Alphanumeric Serialization', bitsBefore: Math.round(origBits * 0.45), bitsAfter: finalBits }
    );
  }

  const bytesSaved = trimmed.length - asciiResult.encoded.length;
  const ratio = analyticsObj?.ratio ?? (1 - (asciiResult.encoded.length / trimmed.length));
  updateStoredStats(bytesSaved, ratio);

  return {
    code: asciiResult.encoded,
    shortUrl,
    originalLength: trimmed.length,
    compressedLength: asciiResult.encoded.length,
    qrPayload: shortUrl,
    stages
  };
}

export function localDecompress(code: string): DecompressResponse {
  if (!code || typeof code !== 'string') {
    throw new Error('A compressed code or short link is required.');
  }

  const cleanCode = extractPayload(code);
  if (!cleanCode) {
    throw new Error('Could not extract a valid compressed code from input.');
  }

  // 1. Try decoding as ASCII mode first
  let asciiError: Error | null = null;
  try {
    const url = decode(cleanCode, 'ascii');
    if (/^https?:\/\//i.test(url)) {
      return { url };
    }
  } catch (err: unknown) {
    asciiError = err instanceof Error ? err : new Error(String(err));
  }

  // 2. Try decoding as QR mode
  let qrError: Error | null = null;
  try {
    const url = decode(cleanCode, 'qr');
    if (/^https?:\/\//i.test(url)) {
      return { url };
    }
  } catch (err: unknown) {
    qrError = err instanceof Error ? err : new Error(String(err));
  }

  // 3. Informative error dispatch
  // If the cleanCode contains lowercase letters, it cannot be QR alphabet (which is uppercase only).
  if (/[a-z]/.test(cleanCode) && asciiError) {
    throw asciiError;
  }

  throw qrError || asciiError || new Error('Invalid or corrupted compressed code.');
}

export function getLocalStats(): StatsResponse {
  return getStoredStats();
}

export function getLocalLeaderboard(): LeaderboardEntry[] {
  return [
    { handle: 'BitMaster', xp: 4820, bestRatio: 0.76 },
    { handle: 'VoxelZip', xp: 3950, bestRatio: 0.72 },
    { handle: 'HuffmanGhost', xp: 3200, bestRatio: 0.69 },
    { handle: 'EntropyZero', xp: 2750, bestRatio: 0.65 },
    { handle: 'StrandRunner', xp: 2100, bestRatio: 0.61 }
  ];
}
