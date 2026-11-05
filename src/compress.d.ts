/** Type declarations for the vanilla-JS compression engine (compress.js). */

export type OutputMode = 'ascii' | 'qr' | 'emoji';

export interface CompressionStageInfo {
  name: string;
  bitsUsed?: number;
  saved?: number;
  method?: string;
}

export interface CompressionAnalytics {
  stages: CompressionStageInfo[];
  originalLength?: number;
  compressedLength?: number;
  totalCompressedBits?: number;
  ratio?: number;
}

export interface EncodeResult {
  encoded: string;
  analytics: CompressionAnalytics;
}

export interface CompressResult {
  bits: number[];
  analytics: CompressionAnalytics;
}

export class BitWriter {
  length: number;
  writeBit(bit: number): void;
  write(value: number, bitCount: number): void;
  toArray(): number[];
}

export class BitReader {
  constructor(bits: number[]);
  read(bitCount: number): number;
  readBit(): number;
}

export function parseURL(url: string): Record<string, unknown>;
export function buildURL(parts: Record<string, unknown>): string;
export function compress(url: string): CompressResult;
export function decompress(bits: number[]): string;
export function bitsToString(bits: number[], alphabet: string): string;
export function stringToBits(str: string, alphabet: string): number[];
export function encode(url: string, mode?: OutputMode): EncodeResult;
export function decode(str: string, mode?: OutputMode): string;
