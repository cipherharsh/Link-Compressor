/**
 * @file Parity test for the self-contained decoder inlined in public/404.html.
 * It loads the page's own decode functions and checks that every link style the
 * app generates (classic, "*"-marked QR, emoji) decodes back to the original URL,
 * including the percent-encoding browsers apply to paths.
 */

import fs from 'node:fs';
import vm from 'node:vm';
import { encode } from '../src/compress.js';
import testUrls from './test-urls.js';

const html = fs.readFileSync(new URL('../public/404.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
// Keep the decoder definitions; drop the code that reads window.location and
// redirects, and unwrap the IIFE so the functions land in the test context.
const decoderSource = script
  .split('// ── Extraction and Redirection Logic')[0]
  .replace(/^\s*\(function\s*\(\)\s*\{/, '');

const context = vm.createContext({ BigInt, Map, Array, String, Object, Math, Error, decodeURIComponent });
vm.runInContext(`${decoderSource}\nthis.decodeAny = decodeAny;`, context);
const { decodeAny } = context;

console.log('Testing 404.html decoder parity with src/compress.js...');

let passed = 0;
const failures = [];
for (const url of testUrls) {
  const cases = [
    ['ascii', encode(url, 'ascii').encoded],
    ['qr-link', '*' + encode(url, 'qr').encoded],
    ['emoji (percent-encoded)', encodeURIComponent(encode(url, 'emoji').encoded)],
  ];
  for (const [label, code] of cases) {
    try {
      const got = decodeAny(code);
      if (got === url) passed++;
      else failures.push({ url, label, got });
    } catch (err) {
      failures.push({ url, label, error: err.message });
    }
  }
}

console.log('\n--- 404.html Decoder Results ---');
console.log('Total assertions: ' + (passed + failures.length));
console.log('Passed: ' + passed);
console.log('Failed: ' + failures.length);

if (failures.length > 0) {
  failures.slice(0, 10).forEach((f) => console.error(f));
  process.exit(1);
}
console.log('\n✅ 404.html decodes every link style identically to src/compress.js!');
