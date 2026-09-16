/**
 * @file Self-contained encode/decode module for LinkZip.
 *
 * Re-exports the high-level encode() and decode() from compress.js
 * so that 404.html, the browser extension, and Node.js scripts can
 * use a single import point.
 */

export { encode, decode, compress, decompress, bitsToString, stringToBits } from "./compress.js";
export { outputAlphabetASCII, outputAlphabetQR } from "./alphabets.js";
