/*
 * PURPOSE: Safe local storage manager for link compression history.
 * INPUTS: History items to persist, search query, pin/delete requests.
 * OUTPUTS: Synced history list sorted by pinned state and timestamp.
 * DEPENDS_ON: types.ts.
 * WHY_THIS_DESIGN: Graceful try/catch guarantees no crashes in private browsing or disabled storage modes.
 */

import type { HistoryItem } from './types';

const STORAGE_KEY = 'linkzip_local_history';
const MAX_HISTORY_ITEMS = 50;

/**
 * Safely reads all history items from localStorage.
 */
export function getHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Graceful fallback for quota or private mode restrictions
  }
  return [];
}

/**
 * Safely persists history items to localStorage.
 */
function saveHistory(items: HistoryItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_HISTORY_ITEMS)));
  } catch {
    // Ignore storage quota error
  }
}

/**
 * Adds a new compression record or bumps an existing one.
 */
export function addHistoryItem(item: Omit<HistoryItem, 'id' | 'timestamp' | 'isPinned'>): HistoryItem[] {
  const current = getHistory();
  const existingIdx = current.findIndex((h) => h.shortCode === item.shortCode);

  let updatedItem: HistoryItem;
  let remaining: HistoryItem[];

  if (existingIdx >= 0) {
    const existing = current[existingIdx];
    updatedItem = {
      ...existing,
      ...item,
      timestamp: Date.now()
    };
    remaining = current.filter((_, idx) => idx !== existingIdx);
  } else {
    updatedItem = {
      ...item,
      id: `lz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      isPinned: false
    };
    remaining = current;
  }

  // Pinned items stay at the top, then newest unpinned items
  const pinned = remaining.filter((h) => h.isPinned);
  const unpinned = remaining.filter((h) => !h.isPinned);

  let nextList: HistoryItem[];
  if (updatedItem.isPinned) {
    nextList = [updatedItem, ...pinned, ...unpinned];
  } else {
    nextList = [...pinned, updatedItem, ...unpinned];
  }

  saveHistory(nextList);
  return nextList;
}

/**
 * Toggles the pinned status of a history entry.
 */
export function togglePin(id: string): HistoryItem[] {
  const current = getHistory();
  const nextList = current.map((item) => {
    if (item.id === id) {
      return { ...item, isPinned: !item.isPinned };
    }
    return item;
  });

  // Re-sort: pinned first, then by timestamp descending
  nextList.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.timestamp - a.timestamp;
  });

  saveHistory(nextList);
  return nextList;
}

/**
 * Removes a single history item by id.
 */
export function deleteHistoryItem(id: string): HistoryItem[] {
  const current = getHistory();
  const nextList = current.filter((item) => item.id !== id);
  saveHistory(nextList);
  return nextList;
}

/**
 * Clears all unpinned history items, or all items if specified.
 */
export function clearHistory(onlyUnpinned: boolean = false): HistoryItem[] {
  if (onlyUnpinned) {
    const current = getHistory();
    const nextList = current.filter((item) => item.isPinned);
    saveHistory(nextList);
    return nextList;
  }
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  return [];
}

/**
 * Filters history items by text search query.
 */
export function searchHistory(items: HistoryItem[], query: string): HistoryItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (item) =>
      item.originalUrl.toLowerCase().includes(q) ||
      item.cleanedUrl.toLowerCase().includes(q) ||
      item.shortCode.toLowerCase().includes(q)
  );
}
