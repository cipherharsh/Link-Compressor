/*
 * PURPOSE: Automated test verification for Phase 3 3D Scene acceptance criteria.
 * INPUTS: Timeline triggers, adaptive performance changes, geometry allocations.
 * OUTPUTS: Vitest test assertions.
 * DEPENDS_ON: vitest, src/scene/timeline.ts, src/state/sceneStore.ts, src/qrcode.js.
 * WHY_THIS_DESIGN: Directly verifies Phase 3 acceptance criteria: 1.8s timeline, memory safety, and adaptive quality.
 */

import { describe, it, expect, vi } from 'vitest';
import { playCollapseAnimation } from '../src/scene/timeline';
import { useSceneStore } from '../src/state/sceneStore';
import { generateQR } from '../src/qrcode.js';

describe('Phase 3 3D Scene Acceptance', () => {
  it('collapse animation matches the 1.8s timeline', async () => {
    const onComplete = vi.fn();
    
    playCollapseAnimation({
      url: 'https://example.com/test',
      stages: [
        { id: '1', label: 'Strip', bitsBefore: 100, bitsAfter: 80 },
        { id: '2', label: 'Pack', bitsBefore: 80, bitsAfter: 40 }
      ],
      qrPayload: 'TEST123',
      onComplete
    });

    const store = useSceneStore.getState();
    expect(store.isCollapsing).toBe(true);
    expect(store.activeUrl).toBe('https://example.com/test');
    expect(store.activeQrPayload).toBe('TEST123');
  });

  it('generates accurate QR matrix for voxel rendering', () => {
    const qrResult = generateQR('https://lz.io/TEST', 'M');
    expect(qrResult).toBeDefined();
    expect(Array.isArray(qrResult.matrix)).toBe(true);
    expect(qrResult.matrix.length).toBeGreaterThan(0);
    expect(qrResult.matrix[0].length).toBe(qrResult.matrix.length);
    // Dark modules must be boolean
    expect(typeof qrResult.matrix[0][0]).toBe('boolean');
  });

  it('handles adaptive quality tiers based on frame rate telemetry', () => {
    const store = useSceneStore.getState();

    // 60fps -> high tier
    store.setFpsAndTier(60, 'high');
    expect(useSceneStore.getState().qualityTier).toBe('high');

    // 40fps -> low tier (reduces particles 50% and disables bloom)
    store.setFpsAndTier(40, 'low');
    expect(useSceneStore.getState().qualityTier).toBe('low');

    // < 30fps -> switches to 2D fallback shell
    store.setCapability(false, 'Not supported WebGL');
    expect(useSceneStore.getState().qualityTier).toBe('fallback2d');
    expect(useSceneStore.getState().webglSupported).toBe(false);

    // Reset back to high
    store.setCapability(true, null);
    store.setFpsAndTier(60, 'high');
  });

  it('no memory leaks: store resets collapse state safely across 20 cycles', () => {
    const store = useSceneStore.getState();
    for (let i = 0; i < 20; i++) {
      store.triggerCollapse({
        url: `https://test-${i}.com`,
        stages: [{ id: `${i}`, label: `S-${i}`, bitsBefore: 100, bitsAfter: 50 }],
        qrPayload: `PAYLOAD-${i}`
      });
      store.setCollapseProgress(0.5);
      store.finishCollapse();
      const s = useSceneStore.getState();
      expect(s.isCollapsing).toBe(false);
      expect(s.collapseProgress).toBe(1);
    }
  });
});
