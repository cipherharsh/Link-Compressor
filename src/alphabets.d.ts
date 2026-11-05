/** Type declarations for the vanilla-JS alphabet & Huffman tables (alphabets.js). */

export type HuffmanTable = Record<string, string>;

export const subalphabets: string[];
export const outputAlphabetASCII: string[];
export const outputAlphabetQR: string[];
export const outputAlphabetEmoji: string[];
export function buildHuffmanTable(symbols: string[]): HuffmanTable;
export const TLD_LIST: string[];
export const DOMAIN_LIST: string[];
export const PATH_SEGMENT_LIST: string[];
export const tldHuffman: HuffmanTable;
export const domainHuffman: HuffmanTable;
export const pathSegHuffman: HuffmanTable;
