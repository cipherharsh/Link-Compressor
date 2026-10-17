/*
 * PURPOSE: Automated test verification for Phase 7 Live Data acceptance criteria.
 * INPUTS: Simulated network disconnects and rapid activity toast dispatches.
 * OUTPUTS: Vitest test assertions.
 * DEPENDS_ON: vitest, src/api/liveFeed.ts, src/api/adapter.ts.
 * WHY_THIS_DESIGN: Directly verifies Phase 7 acceptance criteria: 6s toast rate-limiting, privacy preservation, and offline resilience.
 */

import { describe, it, expect, vi } from 'vitest';
import { liveFeed, type LiveActivityEvent } from '../src/api/liveFeed';

describe('Phase 7 Live Data Acceptance', () => {
  it('toasts never exceed one per 6 seconds', () => {
    const receivedEvents: LiveActivityEvent[] = [];
    const unsub = liveFeed.onActivity((e) => receivedEvents.push(e));

    // Fire 5 rapid activities
    liveFeed.dispatchThrottledActivity(55, 120);
    liveFeed.dispatchThrottledActivity(60, 140);
    liveFeed.dispatchThrottledActivity(65, 180);
    liveFeed.dispatchThrottledActivity(70, 200);
    liveFeed.dispatchThrottledActivity(75, 220);

    // Only the first one within 6s should have been dispatched
    expect(receivedEvents.length).toBe(1);
    expect(receivedEvents[0].ratioPercent).toBe(55);
    expect(receivedEvents[0].bytesSaved).toBe(120);

    unsub();
  });

  it('preserves privacy: never transmits or stores raw URLs in live events', () => {
    let captured: LiveActivityEvent | null = null;
    const unsub = liveFeed.onActivity((e) => { captured = e; });

    // Wait > 6s artificially or mock time to dispatch next
    vi.setSystemTime(Date.now() + 7000);
    liveFeed.dispatchThrottledActivity(62, 190);

    expect(captured).not.toBeNull();
    // Verify properties
    expect((captured as unknown as Record<string, unknown>).url).toBeUndefined();
    expect((captured as unknown as Record<string, unknown>).rawUrl).toBeUndefined();
    expect(captured!.ratioPercent).toBe(62);
    expect(captured!.bytesSaved).toBe(190);

    vi.useRealTimers();
    unsub();
  });

  it('disconnecting network switches to offline mode without crashing', () => {
    expect(() => {
      liveFeed.start();
      // Simulate network going offline
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('offline'));
      } else {
        (liveFeed as unknown as { handleNetworkChange: (online: boolean) => void }).handleNetworkChange(false);
      }
      liveFeed.stop();
    }).not.toThrow();
  });
});
