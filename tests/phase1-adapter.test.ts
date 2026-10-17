/*
 * PURPOSE: Automated test verification for Phase 1 Foundation acceptance criteria.
 * INPUTS: Test URLs, compressed codes.
 * OUTPUTS: Vitest test assertions.
 * DEPENDS_ON: vitest, src/engine/localCompress.ts, src/api/adapter.ts.
 * WHY_THIS_DESIGN: Directly verifies Phase 1 acceptance criteria: adapter returns valid data in both offline and online modes.
 */

import { describe, it, expect } from 'vitest';
import { localCompress, localDecompress, extractPayload, getLocalStats, getLocalLeaderboard } from '../src/engine/localCompress';
import { api, getApiState } from '../src/api/adapter';

describe('Phase 1 Foundation - Adapter & Local Engine Acceptance', () => {
  const testUrl = 'https://github.com/cipherharsh/Link-Compressor';

  it('localCompress returns full contract shape and valid stages', () => {
    const comp = localCompress(testUrl);
    expect(typeof comp.code).toBe('string');
    expect(comp.code.length).toBeGreaterThan(0);
    expect(comp.shortUrl).toContain(comp.code);
    expect(comp.originalLength).toBe(testUrl.length);
    expect(comp.compressedLength).toBe(comp.code.length);
    expect(typeof comp.qrPayload).toBe('string');
    expect(comp.qrPayload.length).toBeGreaterThan(0);
    expect(Array.isArray(comp.stages)).toBe(true);
    expect(comp.stages.length).toBeGreaterThanOrEqual(4);
    expect(comp.stages[0].bitsBefore).toBeGreaterThan(comp.stages[comp.stages.length - 1].bitsAfter);
  });

  it('localDecompress accurately decodes compressed code', () => {
    const comp = localCompress(testUrl);
    const decomp = localDecompress(comp.code);
    expect(decomp.url).toBe(testUrl);
  });

  it('extractPayload and localDecompress handle full short links, localhost URLs, hash routing, and query parameters', () => {
    const code = '144fWYB4XvoHE2CZgUN5F9e5HDJMzPPHM';

    // Direct code
    expect(extractPayload(code)).toBe(code);
    expect(localDecompress(code).url).toBe(testUrl);

    // Host without protocol (the exact user bug from screenshot)
    const hostWithPort = `localhost:3000/${code}`;
    expect(extractPayload(hostWithPort)).toBe(code);
    expect(localDecompress(hostWithPort).url).toBe(testUrl);

    // Full URL with protocol and trailing slash
    const fullHttp = `http://localhost:3000/${code}/`;
    expect(extractPayload(fullHttp)).toBe(code);
    expect(localDecompress(fullHttp).url).toBe(testUrl);

    // Hash fragment
    const hashUrl = `https://linkzip.pages.dev/#${code}`;
    expect(extractPayload(hashUrl)).toBe(code);
    expect(localDecompress(hashUrl).url).toBe(testUrl);

    // Query parameter
    const queryUrl = `http://localhost:3000/?c=${code}&ref=test`;
    expect(extractPayload(queryUrl)).toBe(code);
    expect(localDecompress(queryUrl).url).toBe(testUrl);
  });

  it('getLocalStats returns valid metrics', () => {
    const stats = getLocalStats();
    expect(stats.totalLinks).toBeGreaterThan(0);
    expect(typeof stats.totalBytesSaved).toBe('number');
    expect(typeof stats.avgRatio).toBe('number');
  });

  it('getLocalLeaderboard returns formatted array', () => {
    const lb = getLocalLeaderboard();
    expect(Array.isArray(lb)).toBe(true);
    expect(lb.length).toBeGreaterThanOrEqual(3);
    expect(lb[0].handle).toBeDefined();
    expect(typeof lb[0].xp).toBe('number');
  });

  it('api adapter operates seamlessly in offline mode and decodes short links', async () => {
    const comp = localCompress(testUrl);
    const apiComp = await api.compress(testUrl);
    expect(apiComp.code).toBe(comp.code);
    expect(getApiState().isOffline).toBe(true);

    const apiDecomp = await api.decompress(apiComp.code);
    expect(apiDecomp.url).toBe(testUrl);

    // Verify adapter decompress with full localhost short link
    const apiDecompLink = await api.decompress(`localhost:3000/${comp.code}`);
    expect(apiDecompLink.url).toBe(testUrl);

    const apiStats = await api.getStats();
    expect(apiStats.totalLinks).toBeGreaterThan(0);

    const apiLb = await api.getLeaderboard();
    expect(apiLb.length).toBeGreaterThan(0);
  });
});
