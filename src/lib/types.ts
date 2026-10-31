/*
 * PURPOSE: Shared domain types and data contracts for LinkZip.
 * INPUTS: N/A (type definitions).
 * OUTPUTS: Exported interfaces for URL normalization, QR metrics, and history.
 * DEPENDS_ON: TypeScript.
 * WHY_THIS_DESIGN: Centralized interfaces guarantee type safety across UI components and pure computation libraries.
 */

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface StrippedParam {
  key: string;
  value: string;
}

export interface CleanUrlResult {
  originalUrl: string;
  cleanedUrl: string;
  strippedParams: StrippedParam[];
  hasTrackingParams: boolean;
  isValid: boolean;
  errorMessage?: string;
}

export interface QrConfig {
  errorCorrection: ErrorCorrectionLevel;
  fgColor: string;
  bgColor: string;
  resolution: 512 | 1024 | 2048;
  margin: number;
}

export interface QrMetrics {
  version: number;
  moduleCount: number;
  errorCorrection: ErrorCorrectionLevel;
  recommendedEc: ErrorCorrectionLevel;
  contrastRatio: number;
  isContrastWcagAa: boolean;
  reliabilityScore: number; // 0 - 100
  reliabilityLabel: 'Excellent' | 'Good' | 'Fair' | 'Low Contrast';
}

export interface CompressionOutcome {
  originalUrl: string;
  cleanedUrl: string;
  strippedParams: StrippedParam[];
  originalLength: number;
  cleanedLength: number;
  compressedLength: number;
  bytesSaved: number;
  ratioPercent: number;
  shortCode: string;
  shortUrl: string;
  qrPayload: string;
}

export interface HistoryItem {
  id: string;
  originalUrl: string;
  cleanedUrl: string;
  shortCode: string;
  shortUrl: string;
  originalLength: number;
  compressedLength: number;
  bytesSaved: number;
  ratioPercent: number;
  strippedCount: number;
  errorCorrection: ErrorCorrectionLevel;
  timestamp: number;
  isPinned: boolean;
}

export type ThemeMode = 'system' | 'light' | 'dark';
