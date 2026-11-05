/** Type declarations for the vanilla-JS QR generator (qrcode.js). */

export type QRErrorCorrectionLevelKey = 'L' | 'M' | 'Q' | 'H';

export interface QRMatrixResult {
  matrix: boolean[][];
  size: number;
  version: number;
  mode: string;
}

export interface QRRenderOptions {
  scale?: number;
  margin?: number;
  foreground?: string;
  background?: string;
}

export const QRErrorCorrectLevel: Record<QRErrorCorrectionLevelKey, number>;

export function generateQR(text: string, ecLevelStr?: QRErrorCorrectionLevelKey): QRMatrixResult;
export function renderToCanvas(
  canvas: HTMLCanvasElement,
  matrix: boolean[][],
  opts?: QRRenderOptions
): void;
export function renderToSVG(matrix: boolean[][], opts?: QRRenderOptions): string;
export function downloadPNG(canvas: HTMLCanvasElement, filename?: string): void;
export function downloadSVG(svgString: string, filename?: string): void;
