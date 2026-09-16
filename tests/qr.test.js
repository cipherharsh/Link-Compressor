/**
 * @file Automated scanner verification test for QR code generation.
 * Uses jsQR to verify that all generated QR codes can be scanned and decoded 100%.
 */

import { generateQR } from '../src/qrcode.js';
import jsQR from 'jsqr';
import testUrls from './test-urls.js';

console.log('Testing QR Code generation and camera scannability...');

let passed = 0;
let total = 0;
const failures = [];

for (const url of testUrls) {
  for (const ec of ['L', 'M', 'Q', 'H']) {
    total++;
    const qr = generateQR(url, ec);
    const margin = 4;
    const scale = 3;
    const fullSize = (qr.size + margin * 2) * scale;
    const imgData = new Uint8ClampedArray(fullSize * fullSize * 4);
    imgData.fill(255);

    for (let r = 0; r < qr.size; r++) {
      for (let c = 0; c < qr.size; c++) {
        if (qr.matrix[r][c]) {
          for (let py = 0; py < scale; py++) {
            for (let px = 0; px < scale; px++) {
              const y = (r + margin) * scale + py;
              const x = (c + margin) * scale + px;
              const idx = (y * fullSize + x) * 4;
              imgData[idx] = 0;
              imgData[idx + 1] = 0;
              imgData[idx + 2] = 0;
              imgData[idx + 3] = 255;
            }
          }
        }
      }
    }

    const res = jsQR(imgData, fullSize, fullSize);
    if (!res || res.data !== url) {
      failures.push({ url, ec, got: res ? res.data : null });
    } else {
      passed++;
    }
  }
}

console.log("\n--- QR Scanner Test Results ---");
console.log("Total QR codes generated & scanned: " + total);
console.log("Passed: " + passed);
console.log("Failed: " + failures.length);

if (failures.length > 0) {
  console.error("\n❌ Failures (" + failures.length + "):");
  failures.slice(0, 10).forEach(f => console.error(f));
  process.exit(1);
} else {
  console.log("\n✅ All " + total + " QR codes scanned with 100% accuracy!");
}