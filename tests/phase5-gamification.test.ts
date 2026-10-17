/*
 * PURPOSE: Automated test verification for Phase 5 Playground and Gamification acceptance criteria.
 * INPUTS: 5 Hand-checked XP formula evaluations, level calculations, achievement triggers.
 * OUTPUTS: Vitest test assertions.
 * DEPENDS_ON: vitest, src/state/gameStore.ts.
 * WHY_THIS_DESIGN: Directly verifies Phase 5 acceptance criteria: exact formula math, single-unlock achievements, and persistence.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, xpForLevel, calculateLevel } from '../src/state/gameStore';

// In-memory localStorage polyfill for Node test environment
if (typeof globalThis.localStorage === 'undefined') {
  let store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (i: number) => Object.keys(store)[i] ?? null,
    length: 0
  } as unknown as Storage;
}

describe('Phase 5 Gamification Acceptance', () => {
  beforeEach(() => {
    localStorage.clear();
    useGameStore.setState({
      xp: 0,
      level: 1,
      streakDays: 1,
      lastActiveDay: null,
      bytesSavedSession: 0,
      totalCompressions: 0,
      achievements: [
        { id: 'first_squeeze', name: 'First Squeeze', description: 'Complete 1 compression', unlockedAt: null },
        { id: 'half_size', name: 'Half Size', description: 'Achieve a ratio of 50% or better', unlockedAt: null },
        { id: 'tiny_titan', name: 'Tiny Titan', description: 'Compressed output of 20 characters or fewer', unlockedAt: null },
        { id: 'streak_7', name: 'Seven Day Streak', description: 'Compress URLs 7 consecutive days', unlockedAt: null },
        { id: 'decoder', name: 'Round Trip', description: 'Decode your own compressed link successfully', unlockedAt: null },
        { id: 'scanner', name: 'Scan Ready', description: 'Use the Flatten QR toggle then download the QR', unlockedAt: null }
      ]
    });
  });

  // Example 1: Standard 50% compression with streak 1
  it('Example 1: floor((1 - 50/100) * 1000) = 500 XP (plus 100 first of day = 600)', () => {
    const store = useGameStore.getState();
    const gained = store.recordCompression({
      originalLength: 100,
      compressedLength: 50,
      hasDictionaryHit: false
    });
    // First compression of day adds +100 bonus
    expect(gained).toBe(600);
    expect(useGameStore.getState().xp).toBe(600);
  });

  // Example 2: Compression on same day without first_of_day bonus
  it('Example 2: 70% compression without first_of_day bonus = 700 XP', () => {
    const today = new Date().toISOString().split('T')[0];
    useGameStore.setState({ lastActiveDay: today, streakDays: 1 });

    const store = useGameStore.getState();
    const gained = store.recordCompression({
      originalLength: 100,
      compressedLength: 30,
      hasDictionaryHit: false
    });
    expect(gained).toBe(700);
    expect(useGameStore.getState().xp).toBe(700);
  });

  // Example 3: Dictionary hit bonus (+50 XP)
  it('Example 3: 75% compression + dictionary match = 750 + 50 = 800 XP', () => {
    const today = new Date().toISOString().split('T')[0];
    useGameStore.setState({ lastActiveDay: today, streakDays: 1 });

    const store = useGameStore.getState();
    const gained = store.recordCompression({
      originalLength: 80,
      compressedLength: 20,
      hasDictionaryHit: true
    });
    expect(gained).toBe(800);
    expect(useGameStore.getState().xp).toBe(800);
  });

  // Example 4: Streak multiplier (3 consecutive days = x1.2)
  it('Example 4: 40% compression (400) + dict match (50) with 3-day streak (x1.2) = 540 XP', () => {
    const today = new Date().toISOString().split('T')[0];
    useGameStore.setState({ lastActiveDay: today, streakDays: 3 });

    const store = useGameStore.getState();
    const gained = store.recordCompression({
      originalLength: 100,
      compressedLength: 60,
      hasDictionaryHit: true
    });
    // (400 + 50) * 1.2 = 540
    expect(gained).toBe(540);
    expect(useGameStore.getState().xp).toBe(540);
  });

  // Example 5: Level curve verification: round(100 * n^1.5)
  it('Example 5: Level curve formula matches round(100 * n^1.5)', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(283); // round(100 * 2^1.5)
    expect(xpForLevel(3)).toBe(520); // round(100 * 3^1.5)
    expect(xpForLevel(4)).toBe(800); // round(100 * 4^1.5)
    expect(xpForLevel(5)).toBe(1118); // round(100 * 5^1.5)

    const lvlData = calculateLevel(600);
    expect(lvlData.level).toBe(3); // > 520, < 800
  });

  it('achievements unlock exactly once and persist unlock timestamp', () => {
    const store = useGameStore.getState();
    store.unlockAchievement('first_squeeze');

    const firstUnlock = useGameStore.getState().achievements.find((a) => a.id === 'first_squeeze');
    expect(firstUnlock?.unlockedAt).not.toBeNull();
    const timestamp = firstUnlock!.unlockedAt;

    // Second unlock attempt must not overwrite or duplicate
    store.unlockAchievement('first_squeeze');
    const secondUnlock = useGameStore.getState().achievements.find((a) => a.id === 'first_squeeze');
    expect(secondUnlock?.unlockedAt).toBe(timestamp);
  });

  it('state survives reload via localStorage persistence', () => {
    const store = useGameStore.getState();
    store.setHandle('CyberPioneer', 'cyber@linkzip.dev');
    store.recordCompression({ originalLength: 100, compressedLength: 20, hasDictionaryHit: true });

    // Check localStorage content
    const raw = localStorage.getItem('linkzip_player_gamestate_v1');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.handle).toBe('CyberPioneer');
    expect(parsed.email).toBe('cyber@linkzip.dev');
    expect(parsed.xp).toBeGreaterThan(0);
  });
});
