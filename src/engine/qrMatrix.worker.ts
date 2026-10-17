/*
 * PURPOSE: Off-main-thread Web Worker computing boolean module matrices for 3D Voxel QR generation.
 * INPUTS: Message event containing { text: string, ecLevel?: string }.
 * OUTPUTS: PostMessage returning { matrix: boolean[][], size: number, version: number }.
 * DEPENDS_ON: src/qrcode.js.
 * WHY_THIS_DESIGN: Prevents Reed-Solomon polynomial math and matrix construction from blocking 60fps main thread animations.
 */

import { generateQR } from '../qrcode.js';

self.onmessage = (e: MessageEvent<{ text: string; ecLevel?: 'L' | 'M' | 'Q' | 'H' }>) => {
  const { text, ecLevel = 'M' } = e.data;
  if (!text) {
    self.postMessage({ error: 'Text payload is required.' });
    return;
  }

  try {
    const result = generateQR(text, ecLevel);
    self.postMessage({
      matrix: result.matrix,
      size: result.size,
      version: result.version
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to generate QR matrix.';
    self.postMessage({ error: msg });
  }
};
