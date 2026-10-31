/*
 * PURPOSE: QR code generation, density analysis, contrast validation, and multi-format export.
 * INPUTS: Encoded link/payload, error correction level, color config, resolution.
 * OUTPUTS: Scaled canvas rendering, vector SVG, contrast metrics, scan reliability scores, and downloads.
 * DEPENDS_ON: src/qrcode.js, types.ts.
 * WHY_THIS_DESIGN: Evaluates real-time optical scan reliability and gives users exact module density metrics.
 */

import { generateQR, renderToCanvas, renderToSVG, downloadPNG, downloadSVG } from '../qrcode.js';
import type { ErrorCorrectionLevel, QrConfig, QrMetrics } from './types';

// Convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16)
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16)
    };
  }
  return null;
}

// Compute relative luminance (sRGB / WCAG standard)
function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Calculates WCAG contrast ratio between foreground and background.
 */
export function calculateContrastRatio(fgHex: string, bgHex: string): number {
  const fg = hexToRgb(fgHex) || { r: 0, g: 0, b: 0 };
  const bg = hexToRgb(bgHex) || { r: 255, g: 255, b: 255 };

  const l1 = getLuminance(fg.r, fg.g, fg.b);
  const l2 = getLuminance(bg.r, bg.g, bg.b);

  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);

  return Number(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
}

/**
 * Automatically recommends optimal error correction based on payload length.
 */
export function recommendErrorCorrection(payloadLength: number): ErrorCorrectionLevel {
  if (payloadLength <= 40) return 'M'; // Standard balanced density
  if (payloadLength <= 90) return 'M';
  return 'L'; // Lowest module density for longer payloads ensures fast camera acquisition
}

/**
 * Evaluates scan reliability score (0-100) based on contrast, module size, and error correction.
 */
export function evaluateScanReliability(
  contrastRatio: number,
  moduleCount: number,
  ecLevel: ErrorCorrectionLevel
): { score: number; label: QrMetrics['reliabilityLabel'] } {
  let score = 100;

  // Contrast penalty
  if (contrastRatio < 3.0) {
    score -= 65;
  } else if (contrastRatio < 4.5) {
    score -= 30;
  } else if (contrastRatio < 7.0) {
    score -= 10;
  }

  // Density penalty (higher module count is harder for phone cameras to resolve at a distance)
  if (moduleCount > 50) {
    score -= 20;
  } else if (moduleCount > 35) {
    score -= 10;
  }

  // EC bonus
  if (ecLevel === 'M' || ecLevel === 'Q') {
    score += 5;
  }

  score = Math.max(10, Math.min(100, score));

  if (contrastRatio < 3.0) return { score, label: 'Low Contrast' };
  if (score >= 85) return { score, label: 'Excellent' };
  if (score >= 65) return { score, label: 'Good' };
  return { score, label: 'Fair' };
}

/**
 * Generates full QR details and computed metrics for a given payload.
 */
export function generateQrDetails(
  payload: string,
  config: Partial<QrConfig> = {}
): {
  matrix: boolean[][];
  size: number;
  metrics: QrMetrics;
  svgString: string;
} {
  const text = payload || 'https://linkcp.vercel.app';
  const ec = config.errorCorrection || recommendErrorCorrection(text.length);
  const fg = config.fgColor || '#000000';
  const bg = config.bgColor || '#ffffff';
  const margin = config.margin !== undefined ? config.margin : 4;

  const result = generateQR(text, ec);
  const matrix = result.matrix;
  const size = result.size;
  const version = result.version;

  const contrast = calculateContrastRatio(fg, bg);
  const isWcag = contrast >= 4.5;
  const reliability = evaluateScanReliability(contrast, size, ec);

  const metrics: QrMetrics = {
    version,
    moduleCount: size,
    errorCorrection: ec,
    recommendedEc: recommendErrorCorrection(text.length),
    contrastRatio: contrast,
    isContrastWcagAa: isWcag,
    reliabilityScore: reliability.score,
    reliabilityLabel: reliability.label
  };

  const svgString = renderToSVG(matrix, {
    scale: 10,
    margin,
    foreground: fg,
    background: bg
  });

  return {
    matrix,
    size,
    metrics,
    svgString
  };
}

/**
 * Draws the QR matrix to an HTML canvas at a target resolution.
 */
export function renderQrToCanvas(
  canvas: HTMLCanvasElement,
  matrix: boolean[][],
  config: Partial<QrConfig> = {}
): void {
  const resolution = config.resolution || 1024;
  const margin = config.margin !== undefined ? config.margin : 4;
  const fg = config.fgColor || '#000000';
  const bg = config.bgColor || '#ffffff';

  const size = matrix.length;
  const totalModules = size + margin * 2;
  const scale = resolution / totalModules;

  renderToCanvas(canvas, matrix, {
    scale,
    margin,
    foreground: fg,
    background: bg
  });
}

/**
 * Copies the rendered canvas QR code as PNG to system clipboard.
 */
export async function copyQrImageToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.clipboard || !window.ClipboardItem) {
    throw new Error('Clipboard image copy not supported in this browser');
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Failed to generate image blob'));
        return;
      }
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        resolve(true);
      } catch (err) {
        reject(err);
      }
    }, 'image/png');
  });
}

/**
 * Generates a clean, readable filename for exported QR images.
 */
export function getExportFilename(rawUrl: string, extension: 'png' | 'svg'): string {
  try {
    const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(rawUrl);
    const parsed = new URL(hasScheme ? rawUrl : `https://${rawUrl}`);
    const host = parsed.hostname.replace(/^www\./, '').replace(/[^a-zA-Z0-9]/g, '-');
    return `linkzip-${host || 'qr'}.${extension}`;
  } catch {
    return `linkzip-qr.${extension}`;
  }
}

export { downloadPNG, downloadSVG };
