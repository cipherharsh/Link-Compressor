/** Web Worker: builds a QR module matrix off the main thread for the 3D voxel QR. */

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
