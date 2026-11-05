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

// QR-link payloads in the shapes LinkZip generates: an uppercase host plus a
// "*"-prefixed QR-alphabet code (fully alphanumeric), and the GitHub Pages
// variant whose case-sensitive "/Link-Compressor/" path forces mixed segments.
const qrLinkPayloads = [
  "HTTPS://LINKCP.VERCEL.APP/*3K$8.Q-Z+0P*7AB",
  "HTTPS://LINKCP.VERCEL.APP/*1A2B3C4D5E6F7G8H9I0J",
  "HTTPS://CIPHERHARSH.GITHUB.IO/Link-Compressor/*9Z$P.Q+R-S*T0U1V2W3",
  "HTTP://LOCALHOST:3000/*ABC123$-+*.",
  "TEST123",
];

const payloads = [...testUrls, ...qrLinkPayloads];

// The alphanumeric mode must actually be used and produce a smaller symbol.
{
  const alnum = "HTTPS://LINKCP.VERCEL.APP/*1A2B3C4D5E6F7G8H9I0J1A2B3C4D5E6F7G8H9I";
  const asBytes = alnum.toLowerCase(); // same length, but lowercase forces byte mode
  const a = generateQR(alnum, "M");
  const b = generateQR(asBytes, "M");
  total++;
  if (a.mode !== "alphanumeric" || a.version >= b.version) {
    failures.push({ check: "alphanumeric is denser", alnumMode: a.mode, alnumVersion: a.version, byteVersion: b.version });
  } else {
    passed++;
    console.log(`Alphanumeric QR: version ${a.version} vs byte version ${b.version} for the same length`);
  }
}

for (const url of payloads) {
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