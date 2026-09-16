import urls from './test-urls.js';

(async () => {
  let encode, decode;
  try {
    const compress = await import('../src/compress.js');
    encode = compress.encode;
    decode = compress.decode;
  } catch (err) {
    console.error('Failed to import compress.js:', err);
    process.exit(1);
  }

  let totalTests = 0;
  let passed = 0;
  let failed = 0;
  const failures = [];
  const expanded = [];
  
  const compressionRatios = [];

  for (const url of urls) {
    for (const mode of ['ascii', 'qr']) {
      totalTests++;
      try {
        const result = encode(url, mode);
        const encodedStr = result.encoded;
        const decoded = decode(encodedStr, mode);
        
        if (decoded !== url) {
          failed++;
          failures.push({ url, mode, expected: url, actual: decoded });
        } else {
          passed++;
        }
        
        const ratio = encodedStr.length / url.length;
        compressionRatios.push(ratio);
        
        if (encodedStr.length > url.length) {
          expanded.push({ url, mode, originalLen: url.length, encodedLen: encodedStr.length });
        }
        
      } catch (err) {
        failed++;
        failures.push({ url, mode, error: err.message });
      }
    }
  }

  // Calculate statistics
  let minRatio = Infinity;
  let maxRatio = -Infinity;
  let sumRatio = 0;
  
  for (const ratio of compressionRatios) {
    if (ratio < minRatio) minRatio = ratio;
    if (ratio > maxRatio) maxRatio = ratio;
    sumRatio += ratio;
  }
  
  const meanRatio = compressionRatios.length ? sumRatio / compressionRatios.length : 0;
  
  let medianRatio = 0;
  if (compressionRatios.length) {
    const sorted = [...compressionRatios].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    medianRatio = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  console.log(`\n--- Test Results ---`);
  console.log(`Total tests run: ${totalTests}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  console.log(`\n--- Compression Ratio Stats ---`);
  console.log(`Min:    ${minRatio.toFixed(4)}`);
  console.log(`Max:    ${maxRatio.toFixed(4)}`);
  console.log(`Mean:   ${meanRatio.toFixed(4)}`);
  console.log(`Median: ${medianRatio.toFixed(4)}`);
  
  if (expanded.length > 0) {
    console.log(`\n--- URLs that expanded (${expanded.length}) ---`);
    for (let i = 0; i < Math.min(expanded.length, 10); i++) {
      const e = expanded[i];
      console.log(`[${e.mode}] ${e.url.substring(0, 50)}${e.url.length > 50 ? '...' : ''} (${e.originalLen} -> ${e.encodedLen})`);
    }
    if (expanded.length > 10) {
      console.log(`... and ${expanded.length - 10} more`);
    }
  }

  if (failed > 0) {
    console.log(`\n--- Failures ---`);
    for (const failure of failures) {
      console.log(`\nURL:  ${failure.url}`);
      console.log(`Mode: ${failure.mode}`);
      if (failure.error) {
        console.log(`Error: ${failure.error}`);
      } else {
        console.log(`Expected: ${failure.expected}`);
        console.log(`Actual:   ${failure.actual}`);
      }
    }
    process.exit(1);
  } else {
    console.log(`\n✅ All tests passed!`);
    process.exit(0);
  }
})();
