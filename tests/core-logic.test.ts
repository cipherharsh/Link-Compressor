import { describe, it, expect } from 'vitest';
import { sanitizeAndCleanUrl } from '../src/lib/trackingStripper';
import { compressUrl, decompressCode } from '../src/lib/compressor';
import { calculateContrastRatio, evaluateScanReliability, recommendErrorCorrection } from '../src/lib/qrEngine';

describe('trackingStripper', () => {
  it('strips UTM and ad click tracking parameters', () => {
    const raw = 'https://example.com/product?id=42&utm_source=twitter&utm_medium=social&fbclid=IwAR123&gclid=XYZ999';
    const result = sanitizeAndCleanUrl(raw, true);

    expect(result.isValid).toBe(true);
    expect(result.cleanedUrl).toBe('https://example.com/product?id=42');
    expect(result.hasTrackingParams).toBe(true);
    expect(result.strippedParams.length).toBe(4);
    expect(result.strippedParams.map((p) => p.key)).toEqual(
      expect.arrayContaining(['utm_source', 'utm_medium', 'fbclid', 'gclid'])
    );
  });

  it('preserves clean URLs without tracking', () => {
    const raw = 'https://github.com/cipherharsh/Link-Compressor';
    const result = sanitizeAndCleanUrl(raw, true);

    expect(result.isValid).toBe(true);
    expect(result.cleanedUrl).toBe(raw);
    expect(result.hasTrackingParams).toBe(false);
    expect(result.strippedParams.length).toBe(0);
  });

  it('rejects malicious javascript: and data: protocols', () => {
    expect(sanitizeAndCleanUrl('javascript:alert(1)').isValid).toBe(false);
    expect(sanitizeAndCleanUrl('data:text/html;base64,PHNjcmlwdD4=').isValid).toBe(false);
  });

  it('normalizes bare domains by prepending https://', () => {
    const result = sanitizeAndCleanUrl('google.com/search?q=test');
    expect(result.isValid).toBe(true);
    expect(result.cleanedUrl).toBe('https://google.com/search?q=test');
  });
});

describe('compressor', () => {
  it('losslessly compresses and roundtrips URLs', () => {
    const url = 'https://en.wikipedia.org/wiki/Lossless_compression';
    const outcome = compressUrl(url, true);

    expect(outcome.shortCode).toBeTruthy();
    expect(outcome.originalLength).toBe(url.length);

    const decoded = decompressCode(outcome.shortCode);
    expect(decoded).toBe(url);
  });

  it('strips tracking params during compression and decodes cleanly', () => {
    const raw = 'https://amazon.com/dp/B08N5WRWNW?utm_source=newsletter&tag=affiliate-20';
    const outcome = compressUrl(raw, true);

    expect(outcome.cleanedUrl).not.toContain('utm_source');
    const decoded = decompressCode(outcome.shortCode);
    expect(decoded).toBe(outcome.cleanedUrl);
  });
});

describe('qrEngine', () => {
  it('correctly calculates contrast ratio', () => {
    // Black (#000000) on White (#ffffff) = 21:1
    const highContrast = calculateContrastRatio('#000000', '#ffffff');
    expect(highContrast).toBeCloseTo(21, 0);

    // Very low contrast
    const lowContrast = calculateContrastRatio('#888888', '#999999');
    expect(lowContrast).toBeLessThan(3.0);
  });

  it('evaluates optical scan reliability', () => {
    const good = evaluateScanReliability(21, 25, 'M');
    expect(good.label).toBe('Excellent');
    expect(good.score).toBeGreaterThanOrEqual(85);

    const bad = evaluateScanReliability(1.5, 25, 'M');
    expect(bad.label).toBe('Low Contrast');
    expect(bad.score).toBeLessThanOrEqual(40);
  });

  it('recommends appropriate error correction level', () => {
    expect(recommendErrorCorrection(30)).toBe('M');
    expect(recommendErrorCorrection(120)).toBe('L');
  });
});
