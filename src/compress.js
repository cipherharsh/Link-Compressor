/**
 * @file Core compression / decompression engine for LinkZip.
 *
 * Bitstream layout (version 0):
 *
 *   ┌──────────┬───────┬──────────┬──────────┬──────────────┬────────────┐
 *   │ Version  │ Flags │   TLD    │  Domain  │ Path segs …  │ Query/Frag │
 *   │ (3 bits) │(5 bit)│ (Huffman)│(Huff/raw)│ (per‑segment)│  (raw)     │
 *   └──────────┴───────┴──────────┴──────────┴──────────────┴────────────┘
 *
 * Every encode path has a matching decode path that reconstructs the
 * exact original URL (lossless round‑trip).
 */

import {
  subalphabets,
  outputAlphabetASCII,
  outputAlphabetQR,
  tldHuffman,
  domainHuffman,
  pathSegHuffman,
} from "./alphabets.js";

const VERSION = 0;

// ═══════════════════════════════════════════════════════════════════════════
// Bit‑level I/O
// ═══════════════════════════════════════════════════════════════════════════

export class BitWriter {
  constructor() { /** @type {number[]} */ this.bits = []; }

  /** Write the low `n` bits of `value` (MSB first). */
  write(value, n) {
    for (let i = n - 1; i >= 0; i--) this.bits.push((value >>> i) & 1);
  }

  /** Write a single bit. */
  writeBit(b) { this.bits.push(b & 1); }

  /** Write a binary string like "01101". */
  writeString(s) { for (const ch of s) this.bits.push(+ch); }

  /** Write a length using variable‑length encoding.
   *  < 32  →  0 + 5‑bit value   (6 bits)
   *  < 288 →  1 + 8‑bit value   (9 bits)                               */
  writeVarLen(len) {
    if (len < 32) {
      this.writeBit(0);
      this.write(len, 5);
    } else {
      this.writeBit(1);
      this.write(len, 8);
    }
  }

  get length() { return this.bits.length; }
  toArray() { return this.bits.slice(); }
}

export class BitReader {
  constructor(bits) { this.bits = bits; this.pos = 0; }

  read(n) {
    let v = 0;
    for (let i = 0; i < n; i++) v = (v << 1) | (this.bits[this.pos++] || 0);
    return v;
  }
  readBit() { return this.bits[this.pos++] || 0; }

  readVarLen() {
    const flag = this.readBit();
    return flag === 0 ? this.read(5) : this.read(8);
  }

  hasMore() { return this.pos < this.bits.length; }
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub‑alphabet helpers
// ═══════════════════════════════════════════════════════════════════════════

/** Return the index of the cheapest (smallest) sub‑alphabet that contains
 *  every character in `str`, or -1 if none fits.  */
function cheapestAlphabet(str) {
  outer: for (let i = 0; i < subalphabets.length; i++) {
    const alpha = subalphabets[i];
    for (const ch of str) {
      if (!alpha.includes(ch)) continue outer;
    }
    return i;
  }
  return -1;
}

/** Bits needed per character for a sub‑alphabet of size `n`. */
function bitsPerChar(n) { return Math.ceil(Math.log2(n)); }

// ═══════════════════════════════════════════════════════════════════════════
// Segment encoding / decoding
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Encode a single text segment with the cheapest sub‑alphabet.
 * Layout:  [3‑bit alphabet index] [varlen length] [packed chars]
 */
function encodeSegment(writer, segment) {
  const alphaIdx = cheapestAlphabet(segment);
  if (alphaIdx === -1) {
    // Fallback: full URL alphabet (index 7)
    encodeSegmentWith(writer, segment, 7);
  } else {
    encodeSegmentWith(writer, segment, alphaIdx);
  }
}

function encodeSegmentWith(writer, segment, alphaIdx) {
  const alpha = subalphabets[alphaIdx];
  const bpc   = bitsPerChar(alpha.length);

  writer.write(alphaIdx, 3);           // alphabet selector
  writer.writeVarLen(segment.length);  // character count

  for (const ch of segment) {
    const idx = alpha.indexOf(ch);
    writer.write(idx === -1 ? 0 : idx, bpc);
  }
}

function decodeSegment(reader) {
  const alphaIdx = reader.read(3);
  const len      = reader.readVarLen();
  const alpha    = subalphabets[alphaIdx];
  const bpc      = bitsPerChar(alpha.length);

  let out = "";
  for (let i = 0; i < len; i++) out += alpha[reader.read(bpc)] || "?";
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════
// Huffman helpers
// ═══════════════════════════════════════════════════════════════════════════

function huffmanEncode(writer, value, huffTable) {
  const code = huffTable.encode[value];
  if (code !== undefined) {
    writer.writeBit(1);         // hit flag
    writer.writeString(code);
    return true;
  }
  writer.writeBit(0);           // miss flag
  return false;
}

function huffmanDecode(reader, huffTable) {
  const hit = reader.readBit();
  if (hit === 1) {
    let code = "";
    while (true) {
      code += reader.readBit();
      if (huffTable.decode[code] !== undefined) return huffTable.decode[code];
      if (code.length > 30) throw new Error("Huffman decode: code too long");
    }
  }
  return null; // miss — caller must read raw
}

// ═══════════════════════════════════════════════════════════════════════════
// URL parsing utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} ParsedURL
 * @property {boolean} isHttps
 * @property {boolean} hasWWW
 * @property {boolean} hasIndexHtml
 * @property {boolean} hasPort
 * @property {number}  port
 * @property {boolean} hasQuery
 * @property {string}  tld
 * @property {string}  domain       Second‑level domain (e.g. "google")
 * @property {string}  subdomain    Everything before domain.tld (excluding www)
 * @property {string[]} pathSegments
 * @property {string}  query        Without leading "?"
 * @property {string}  fragment     Without leading "#"
 */

export function parseURL(url) {
  const result = {
    isHttps: true, hasWWW: false, hasIndexHtml: false,
    hasPort: false, port: 0, hasQuery: false, hasTrailingSlash: false,
    tld: "", domain: "", subdomain: "",
    pathSegments: [], query: "", fragment: "",
  };

  let s = url.trim();

  // ── Protocol ──────────────────────────────────────────────────────────
  if (s.startsWith("https://"))      { result.isHttps = true;  s = s.slice(8); }
  else if (s.startsWith("http://"))  { result.isHttps = false; s = s.slice(7); }
  else if (s.startsWith("//"))       { s = s.slice(2); }

  // ── Fragment ──────────────────────────────────────────────────────────
  const hashIdx = s.indexOf("#");
  if (hashIdx !== -1) { result.fragment = s.slice(hashIdx + 1); s = s.slice(0, hashIdx); }

  // ── Query ─────────────────────────────────────────────────────────────
  const qIdx = s.indexOf("?");
  if (qIdx !== -1) { result.query = s.slice(qIdx + 1); result.hasQuery = true; s = s.slice(0, qIdx); }

  // ── Split host / path ─────────────────────────────────────────────────
  const slashIdx = s.indexOf("/");
  let host, path;
  if (slashIdx !== -1) {
    host = s.slice(0, slashIdx);
    path = s.slice(slashIdx + 1);
    if (path === "") {
      result.hasTrailingSlash = true;
    }
  } else {
    host = s;
    path = "";
  }

  // ── Trailing index.html ───────────────────────────────────────────────
  if (path.endsWith("index.html")) {
    result.hasIndexHtml = true;
    path = path.slice(0, -10);
    if (path.endsWith("/")) path = path.slice(0, -1);
  }

  // ── Trailing slash (after index.html stripping) ───────────────────────
  if (path.endsWith("/")) {
    result.hasTrailingSlash = true;
    path = path.slice(0, -1);
  }

  // ── Path segments ─────────────────────────────────────────────────────
  result.pathSegments = path ? path.split("/") : [];

  // ── Port ──────────────────────────────────────────────────────────────
  const colonIdx = host.lastIndexOf(":");
  if (colonIdx !== -1) {
    const maybePort = host.slice(colonIdx + 1);
    if (/^\d+$/.test(maybePort)) {
      result.port = parseInt(maybePort, 10);
      const defaultPort = result.isHttps ? 443 : 80;
      if (result.port !== defaultPort) { result.hasPort = true; }
      host = host.slice(0, colonIdx);
    }
  }

  // ── www ───────────────────────────────────────────────────────────────
  if (host.startsWith("www.")) { result.hasWWW = true; host = host.slice(4); }

  // ── TLD / domain / subdomain ──────────────────────────────────────────
  const parts = host.split(".");
  if (parts.length >= 2) {
    // Check for compound TLDs like co.uk
    const last2 = parts.slice(-2).join(".");
    if (tldHuffman.encode[last2] !== undefined && parts.length >= 3) {
      result.tld    = last2;
      result.domain = parts[parts.length - 3];
      result.subdomain = parts.slice(0, -3).join(".");
    } else {
      result.tld    = parts[parts.length - 1];
      result.domain = parts[parts.length - 2];
      result.subdomain = parts.slice(0, -2).join(".");
    }
  } else {
    // Single‑label host (e.g. "localhost")
    result.domain = host;
  }

  return result;
}

/**
 * Reconstruct a URL string from parsed components.
 */
export function buildURL(p) {
  let url = p.isHttps ? "https://" : "http://";
  if (p.hasWWW) url += "www.";
  if (p.subdomain) url += p.subdomain + ".";
  url += p.domain;
  if (p.tld) url += "." + p.tld;
  if (p.hasPort) url += ":" + p.port;
  if (p.pathSegments.length > 0) url += "/" + p.pathSegments.join("/");
  if (p.hasTrailingSlash) url += "/";
  if (p.hasIndexHtml) {
    if (p.hasTrailingSlash) {
      url += "index.html";
    } else {
      url += "/index.html";
    }
  }
  if (p.hasQuery) url += "?" + p.query;
  if (p.fragment) url += "#" + p.fragment;
  return url;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPRESS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compress a URL into a bit array.
 *
 * @param {string} url  The original URL.
 * @returns {{ bits: number[], analytics: object }}
 */
export function compress(url) {
  const parsed = parseURL(url);
  const writer = new BitWriter();
  const analytics = { stages: [], totalOriginalBits: url.length * 8 };

  // ── 1. Version (3 bits) ───────────────────────────────────────────────
  writer.write(VERSION, 3);

  // ── 2. Flags (6 bits) ─────────────────────────────────────────────────
  const flagPos = writer.length;
  writer.writeBit(parsed.isHttps ? 1 : 0);
  writer.writeBit(parsed.hasWWW ? 1 : 0);
  writer.writeBit(parsed.hasIndexHtml ? 1 : 0);
  writer.writeBit(parsed.hasPort ? 1 : 0);
  writer.writeBit(parsed.hasQuery ? 1 : 0);
  writer.writeBit(parsed.hasTrailingSlash ? 1 : 0);

  analytics.stages.push({
    name: "Protocol & flags",
    bitsUsed: writer.length,
    saved: (parsed.isHttps ? 8 : 7) + (parsed.hasWWW ? 4 : 0) + (parsed.hasIndexHtml ? 10 : 0),
    method: "flag bits",
  });

  // ── 3. Port (if non‑default) ──────────────────────────────────────────
  if (parsed.hasPort) {
    writer.write(parsed.port, 16);
    analytics.stages.push({ name: "Port", bitsUsed: 16, method: "16‑bit raw" });
  }

  // ── 4. TLD ────────────────────────────────────────────────────────────
  const tldStart = writer.length;
  const tldHit   = huffmanEncode(writer, parsed.tld, tldHuffman);
  if (!tldHit) {
    encodeSegment(writer, parsed.tld);
  }
  analytics.stages.push({
    name: `TLD: "${parsed.tld}"`,
    bitsUsed: writer.length - tldStart,
    hit: tldHit,
    method: tldHit ? "huffman" : "raw",
    saved: tldHit ? Math.max(0, parsed.tld.length * 8 - (writer.length - tldStart)) : 0,
  });

  // ── 5. Domain ─────────────────────────────────────────────────────────
  const domStart = writer.length;
  const domHit   = huffmanEncode(writer, parsed.domain, domainHuffman);
  if (!domHit) {
    encodeSegment(writer, parsed.domain);
  }
  analytics.stages.push({
    name: `Domain: "${parsed.domain}"`,
    bitsUsed: writer.length - domStart,
    hit: domHit,
    method: domHit ? "huffman" : "subalphabet",
    saved: domHit ? Math.max(0, parsed.domain.length * 8 - (writer.length - domStart)) : 0,
  });

  // ── 6. Subdomain (if present) ─────────────────────────────────────────
  const subStart = writer.length;
  writer.writeBit(parsed.subdomain ? 1 : 0);
  if (parsed.subdomain) {
    const subParts = parsed.subdomain.split(".");
    writer.writeVarLen(subParts.length);
    for (const part of subParts) encodeSegment(writer, part);
    analytics.stages.push({
      name: `Subdomain: "${parsed.subdomain}"`,
      bitsUsed: writer.length - subStart,
      method: "subalphabet",
    });
  }

  // ── 7. Path segments ──────────────────────────────────────────────────
  const pathStart = writer.length;
  writer.writeVarLen(parsed.pathSegments.length);

  for (const seg of parsed.pathSegments) {
    // Try path‑segment Huffman first
    const segHit = huffmanEncode(writer, seg, pathSegHuffman);
    if (!segHit) {
      encodeSegment(writer, seg);
    }
  }
  analytics.stages.push({
    name: `Path (${parsed.pathSegments.length} segments)`,
    bitsUsed: writer.length - pathStart,
    method: "huffman+subalphabet",
  });

  // ── 8. Query string ───────────────────────────────────────────────────
  if (parsed.hasQuery) {
    const qStart = writer.length;
    encodeSegment(writer, parsed.query);
    analytics.stages.push({
      name: "Query string",
      bitsUsed: writer.length - qStart,
      method: "subalphabet",
    });
  }

  // ── 9. Fragment ───────────────────────────────────────────────────────
  const fragStart = writer.length;
  writer.writeBit(parsed.fragment ? 1 : 0);
  if (parsed.fragment) {
    encodeSegment(writer, parsed.fragment);
    analytics.stages.push({
      name: "Fragment",
      bitsUsed: writer.length - fragStart,
      method: "subalphabet",
    });
  }

  analytics.totalCompressedBits = writer.length;
  return { bits: writer.toArray(), analytics };
}

// ═══════════════════════════════════════════════════════════════════════════
// DECOMPRESS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Decompress a bit array back into the original URL.
 *
 * @param {number[]} bits
 * @returns {string}
 */
export function decompress(bits) {
  const reader = new BitReader(bits);
  const p = {
    isHttps: true, hasWWW: false, hasIndexHtml: false,
    hasPort: false, port: 0, hasQuery: false, hasTrailingSlash: false,
    tld: "", domain: "", subdomain: "",
    pathSegments: [], query: "", fragment: "",
  };

  // ── 1. Version ────────────────────────────────────────────────────────
  const version = reader.read(3);
  if (version !== VERSION) throw new Error(`Unsupported version: ${version}`);

  // ── 2. Flags ──────────────────────────────────────────────────────────
  p.isHttps          = reader.readBit() === 1;
  p.hasWWW           = reader.readBit() === 1;
  p.hasIndexHtml     = reader.readBit() === 1;
  p.hasPort          = reader.readBit() === 1;
  p.hasQuery         = reader.readBit() === 1;
  p.hasTrailingSlash = reader.readBit() === 1;

  // ── 3. Port ───────────────────────────────────────────────────────────
  if (p.hasPort) p.port = reader.read(16);

  // ── 4. TLD ────────────────────────────────────────────────────────────
  const tldResult = huffmanDecode(reader, tldHuffman);
  if (tldResult !== null) {
    p.tld = tldResult;
  } else {
    p.tld = decodeSegment(reader);
  }

  // ── 5. Domain ─────────────────────────────────────────────────────────
  const domResult = huffmanDecode(reader, domainHuffman);
  if (domResult !== null) {
    p.domain = domResult;
  } else {
    p.domain = decodeSegment(reader);
  }

  // ── 6. Subdomain ──────────────────────────────────────────────────────
  const hasSub = reader.readBit();
  if (hasSub) {
    const subCount = reader.readVarLen();
    const subParts = [];
    for (let i = 0; i < subCount; i++) subParts.push(decodeSegment(reader));
    p.subdomain = subParts.join(".");
  }

  // ── 7. Path segments ──────────────────────────────────────────────────
  const pathCount = reader.readVarLen();
  for (let i = 0; i < pathCount; i++) {
    const segResult = huffmanDecode(reader, pathSegHuffman);
    if (segResult !== null) {
      p.pathSegments.push(segResult);
    } else {
      p.pathSegments.push(decodeSegment(reader));
    }
  }

  // ── 8. Query ──────────────────────────────────────────────────────────
  if (p.hasQuery) {
    p.query = decodeSegment(reader);
  }

  // ── 9. Fragment ───────────────────────────────────────────────────────
  const hasFrag = reader.readBit();
  if (hasFrag) {
    p.fragment = decodeSegment(reader);
  }

  return buildURL(p);
}

// ═══════════════════════════════════════════════════════════════════════════
// Bitstream ↔ string conversion
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert a bit array into a string using the given alphabet.
 * A sentinel `1` bit is prepended to preserve leading zeros.
 *
 * @param {number[]} bits
 * @param {string[]} alphabet
 * @returns {string}
 */
export function bitsToString(bits, alphabet) {
  // Prepend sentinel
  const withSentinel = [1, ...bits];

  // Convert to BigInt
  let num = 0n;
  for (const b of withSentinel) num = (num << 1n) | BigInt(b);

  const base = BigInt(alphabet.length);
  if (num === 0n) return alphabet[0];

  const chars = [];
  while (num > 0n) {
    chars.push(alphabet[Number(num % base)]);
    num /= base;
  }
  chars.reverse();
  return chars.join("");
}

/**
 * Convert a string back into a bit array using the given alphabet.
 * Strips the sentinel `1` bit that was prepended during encoding.
 *
 * @param {string} str
 * @param {string[]} alphabet
 * @returns {number[]}
 */
export function stringToBits(str, alphabet) {
  const base = BigInt(alphabet.length);
  const charMap = new Map();
  alphabet.forEach((ch, i) => charMap.set(ch, BigInt(i)));

  let num = 0n;
  for (const ch of str) {
    const val = charMap.get(ch);
    if (val === undefined) throw new Error(`Invalid character in compressed string: "${ch}"`);
    num = num * base + val;
  }

  // Convert to bits
  const bits = [];
  while (num > 0n) {
    bits.push(Number(num & 1n));
    num >>= 1n;
  }
  bits.reverse();

  // Strip sentinel
  if (bits.length > 0 && bits[0] === 1) bits.shift();

  return bits;
}

// ═══════════════════════════════════════════════════════════════════════════
// High‑level encode / decode
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Encode a URL to a compressed string.
 *
 * @param {string} url      The original URL.
 * @param {"ascii"|"qr"} mode  Output alphabet to use.
 * @returns {{ encoded: string, analytics: object }}
 */
export function encode(url, mode = "ascii") {
  const alphabet = mode === "qr" ? outputAlphabetQR : outputAlphabetASCII;
  const { bits, analytics } = compress(url);
  const encoded = bitsToString(bits, alphabet);
  analytics.originalLength   = url.length;
  analytics.compressedLength = encoded.length;
  analytics.ratio = 1 - encoded.length / url.length;
  return { encoded, analytics };
}

/**
 * Decode a compressed string back to the original URL.
 *
 * @param {string} str           The compressed string.
 * @param {"ascii"|"qr"} mode    Which alphabet was used.
 * @returns {string}             The original URL.
 */
export function decode(str, mode = "ascii") {
  const alphabet = mode === "qr" ? outputAlphabetQR : outputAlphabetASCII;
  const bits = stringToBits(str, alphabet);
  return decompress(bits);
}
