/** Type declarations for the single-import engine entry point (standalone.js). */

export {
  encode,
  decode,
  compress,
  decompress,
  bitsToString,
  stringToBits,
} from './compress.js';
export { outputAlphabetASCII, outputAlphabetQR } from './alphabets.js';
