/**
 * API surface for the UI. LinkZip is zero-backend: every call runs the local
 * in-browser engine, so the async signatures below just wrap the synchronous
 * engine in resolved promises. The state helpers exist so the UI can show that
 * compression happens entirely in the browser.
 */

import {
  localCompress,
  localDecompress,
  extractPayload,
  getLocalStats,
  getLocalLeaderboard,
  type CompressResponse,
  type DecompressResponse,
  type StatsResponse,
  type LeaderboardEntry,
} from '../engine/localCompress';

export type { CompressResponse, DecompressResponse, StatsResponse, LeaderboardEntry };
export { extractPayload };

export interface ApiState {
  /** Always true: LinkZip runs the compression engine locally, with no backend. */
  isOffline: boolean;
  lastError: string | null;
}

const LOCAL_STATE: ApiState = { isOffline: true, lastError: null };

export function getApiState(): ApiState {
  return LOCAL_STATE;
}

/** Notifies the listener of the (static) local state and returns a no-op unsubscribe. */
export function subscribeApiState(listener: (state: ApiState) => void): () => void {
  listener(LOCAL_STATE);
  return () => {};
}

export const api = {
  compress(url: string): Promise<CompressResponse> {
    return Promise.resolve(localCompress(url));
  },

  decompress(code: string): Promise<DecompressResponse> {
    return Promise.resolve(localDecompress(extractPayload(code)));
  },

  getStats(): Promise<StatsResponse> {
    return Promise.resolve(getLocalStats());
  },

  getLeaderboard(): Promise<LeaderboardEntry[]> {
    return Promise.resolve(getLocalLeaderboard());
  },
};
