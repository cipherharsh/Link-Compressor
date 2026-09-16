/**
 * @file Extension parity test — asserts that standalone-bundle.js (used in browser extension)
 * produces 100% identical compression and decompression output to src/compress.js.
 */

import urls from "./test-urls.js";
import { encode as esmEncode, decode as esmDecode } from "../src/compress.js";
import fs from "fs";
import path from "path";
import vm from "vm";

// Load standalone-bundle.js in a clean VM context
const bundlePath = path.resolve("./extension/standalone-bundle.js");
const bundleCode = fs.readFileSync(bundlePath, "utf-8");
const context = { console };
vm.createContext(context);
vm.runInContext(bundleCode, context);
const bundle = context.LinkZip;

if (!bundle || typeof bundle.encode !== "function") {
  console.error("❌ Failed to load LinkZip from standalone-bundle.js");
  process.exit(1);
}

console.log("Testing standalone-bundle.js parity with src/compress.js...\n");

let passed = 0;
let failed = 0;

for (const url of urls) {
  for (const mode of ["ascii", "qr"]) {
    const esmRes = esmEncode(url, mode);
    const bundleRes = bundle.encode(url, mode);

    if (esmRes.encoded !== bundleRes.encoded) {
      failed++;
      console.error(`❌ Encode mismatch for [${mode}] ${url}:`);
      console.error(`   ESM:    ${esmRes.encoded}`);
      console.error(`   Bundle: ${bundleRes.encoded}`);
      continue;
    }

    const decoded = bundle.decode(bundleRes.encoded, mode);
    if (decoded !== url) {
      failed++;
      console.error(`❌ Decode mismatch in bundle for [${mode}] ${url}:`);
      console.error(`   Expected: ${url}`);
      console.error(`   Actual:   ${decoded}`);
      continue;
    }

    passed++;
  }
}

console.log(`\n--- Extension Parity Results ---`);
console.log(`Total assertions: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  console.error("\n❌ Extension parity test failed!");
  process.exit(1);
} else {
  console.log("\n✅ Extension bundle has 100% parity with src/compress.js!");
  process.exit(0);
}
