/*
 * PURPOSE: Resilient API adapter connecting the frontend to remote endpoints with automatic offline fallback.
 * INPUTS: Remote requests for compress, decompress, stats, and leaderboard.
 * OUTPUTS: Typed promises resolving to contract responses, whether online or locally computed.
 * DEPENDS_ON: localCompress.ts, import.meta.env.VITE_API_BASE_URL.
 * WHY_THIS_DESIGN: Protects user experience with 8s timeouts, 1 backoff retry, and instantaneous local fallback.
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
  type LeaderboardEntry
} from '../engine/localCompress';

export type { CompressResponse, DecompressResponse, StatsResponse, LeaderboardEntry };
export { extractPayload };

export interface ApiState {
  isOffline: boolean;
  lastError: string | null;
}

// Global API state listeners
type StateListener = (state: ApiState) => void;
const listeners: Set<StateListener> = new Set();
let currentState: ApiState = {
  isOffline: !import.meta.env.VITE_API_BASE_URL,
  lastError: null
};

export function subscribeApiState(listener: StateListener): () => void {
  listeners.add(listener);
  listener(currentState);
  return () => listeners.delete(listener);
}

function updateApiState(isOffline: boolean, lastError: string | null = null) {
  currentState = { isOffline, lastError };
  listeners.forEach(fn => fn(currentState));
}

export function getApiState(): ApiState {
  return currentState;
}

const TIMEOUT_MS = 8000;

async function fetchWithTimeoutAndRetry<T>(
  url: string,
  options: RequestInit = {},
  retriesLeft = 1
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    updateApiState(false, null);
    return json as T;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (retriesLeft > 0) {
      // 500ms backoff before retry
      await new Promise(r => setTimeout(r, 500));
      return fetchWithTimeoutAndRetry<T>(url, options, retriesLeft - 1);
    }
    const message = err instanceof Error ? err.message : 'Unknown network failure';
    updateApiState(true, message);
    throw err;
  }
}

export const api = {
  async compress(url: string): Promise<CompressResponse> {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    if (!baseUrl) {
      updateApiState(true, null);
      return localCompress(url);
    }

    try {
      return await fetchWithTimeoutAndRetry<CompressResponse>(`${baseUrl}/api/compress`, {
        method: 'POST',
        body: JSON.stringify({ url })
      });
    } catch {
      // Graceful fallback to local engine
      return localCompress(url);
    }
  },

  async decompress(code: string): Promise<DecompressResponse> {
    const cleanCode = extractPayload(code);
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    if (!baseUrl) {
      updateApiState(true, null);
      return localDecompress(cleanCode);
    }

    try {
      return await fetchWithTimeoutAndRetry<DecompressResponse>(`${baseUrl}/api/decompress`, {
        method: 'POST',
        body: JSON.stringify({ code: cleanCode })
      });
    } catch {
      return localDecompress(cleanCode);
    }
  },

  async getStats(): Promise<StatsResponse> {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    if (!baseUrl) {
      updateApiState(true, null);
      return getLocalStats();
    }

    try {
      return await fetchWithTimeoutAndRetry<StatsResponse>(`${baseUrl}/api/stats`, {
        method: 'GET'
      });
    } catch {
      return getLocalStats();
    }
  },

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    if (!baseUrl) {
      updateApiState(true, null);
      return getLocalLeaderboard();
    }

    try {
      return await fetchWithTimeoutAndRetry<LeaderboardEntry[]>(`${baseUrl}/api/leaderboard`, {
        method: 'GET'
      });
    } catch {
      return getLocalLeaderboard();
    }
  }
};
