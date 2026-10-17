/*
 * PURPOSE: Resilient real-time live feed subscribing to SSE/WebSocket with 10s polling fallback and rate-limited toasts.
 * INPUTS: Remote stream /api/live or periodic /api/stats responses, online/offline network events.
 * OUTPUTS: Throttled activity events (max 1 per 6s) and live counter updates dispatched to UI listeners.
 * DEPENDS_ON: adapter.ts, localCompress.ts.
 * WHY_THIS_DESIGN: Unified interface guarantees real-time metrics when backend is live while surviving offline disconnects without crashing.
 */

import { api, type StatsResponse } from './adapter';

export interface LiveActivityEvent {
  id: string;
  type: 'compression';
  ratioPercent: number;
  bytesSaved: number;
  timestamp: number;
}

type LiveStatsListener = (stats: StatsResponse) => void;
type ActivityListener = (event: LiveActivityEvent) => void;

class LiveFeedService {
  private statsListeners: Set<LiveStatsListener> = new Set();
  private activityListeners: Set<ActivityListener> = new Set();
  private pollingTimer: number | null = null;
  private sse: EventSource | null = null;
  private lastToastTimestamp = 0;
  private isDestroyed = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  public start() {
    this.isDestroyed = false;
    const baseUrl = import.meta.env.VITE_API_BASE_URL;

    if (baseUrl && typeof EventSource !== 'undefined') {
      try {
        this.sse = new EventSource(`${baseUrl}/api/live`);
        this.sse.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'stats') {
              this.notifyStats(data);
            } else if (data.type === 'compression') {
              this.dispatchThrottledActivity(data.ratioPercent, data.bytesSaved);
            }
          } catch {
            // Ignore malformed payloads
          }
        };
        this.sse.onerror = () => {
          // SSE failed or disconnected, fall back to 10s polling
          this.sse?.close();
          this.sse = null;
          this.startPolling();
        };
        return;
      } catch {
        // Fall back to polling
      }
    }

    this.startPolling();
  }

  private startPolling() {
    if (this.pollingTimer !== null || this.isDestroyed) return;

    const poll = async () => {
      try {
        const stats = await api.getStats();
        this.notifyStats(stats);
      } catch {
        // Safe offline fallback
      }
    };

    poll();
    this.pollingTimer = setInterval(poll, 10000) as unknown as number; // 10s polling
  }

  public dispatchThrottledActivity(ratioPercent: number, bytesSaved: number) {
    const now = Date.now();
    // Constraint: Toasts never exceed one per 6s (6000ms)
    if (now - this.lastToastTimestamp < 6000) {
      return;
    }
    this.lastToastTimestamp = now;

    // Privacy rule: Never display raw URLs. Only anonymized ratio percentages and byte savings.
    const event: LiveActivityEvent = {
      id: `${now}-${Math.random()}`,
      type: 'compression',
      ratioPercent: Math.round(ratioPercent),
      bytesSaved,
      timestamp: now
    };

    this.activityListeners.forEach((fn) => fn(event));
  }

  private notifyStats(stats: StatsResponse) {
    this.statsListeners.forEach((fn) => fn(stats));
  }

  private handleNetworkChange(isOnline: boolean) {
    if (!isOnline) {
      if (this.sse) {
        this.sse.close();
        this.sse = null;
      }
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer);
        this.pollingTimer = null;
      }
    } else {
      this.start();
    }
  }

  public onStats(fn: LiveStatsListener): () => void {
    this.statsListeners.add(fn);
    return () => this.statsListeners.delete(fn);
  }

  public onActivity(fn: ActivityListener): () => void {
    this.activityListeners.add(fn);
    return () => this.activityListeners.delete(fn);
  }

  public stop() {
    this.isDestroyed = true;
    if (this.sse) {
      this.sse.close();
      this.sse = null;
    }
    if (this.pollingTimer !== null) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }
}

export const liveFeed = new LiveFeedService();
