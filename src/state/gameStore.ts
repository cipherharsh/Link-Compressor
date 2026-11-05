/** Zustand store for gamification: XP, levels, streaks, achievements (persisted to localStorage). */

import { create } from 'zustand';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: number | null; // timestamp or null
}

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_squeeze', name: 'First Squeeze', description: 'Complete 1 compression', unlockedAt: null },
  { id: 'half_size', name: 'Half Size', description: 'Achieve a ratio of 50% or better', unlockedAt: null },
  { id: 'tiny_titan', name: 'Tiny Titan', description: 'Compressed output of 20 characters or fewer', unlockedAt: null },
  { id: 'streak_7', name: 'Seven Day Streak', description: 'Compress URLs 7 consecutive days', unlockedAt: null },
  { id: 'decoder', name: 'Round Trip', description: 'Decode your own compressed link successfully', unlockedAt: null },
  { id: 'scanner', name: 'Scan Ready', description: 'Open or download a QR code', unlockedAt: null }
];

// XP required for level n = round(100 * n^1.5)
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(100 * Math.pow(level, 1.5));
}

// Calculate current level from total accumulated XP
export function calculateLevel(totalXp: number): { level: number; currentLevelXp: number; nextLevelXp: number } {
  let level = 1;
  while (totalXp >= xpForLevel(level + 1)) {
    level++;
  }
  const currentBase = xpForLevel(level);
  const nextBase = xpForLevel(level + 1);
  return {
    level,
    currentLevelXp: totalXp - currentBase,
    nextLevelXp: nextBase - currentBase
  };
}

export interface FloatingXpNotice {
  id: string;
  amount: number;
  label?: string;
  createdAt: number;
}

interface GameState {
  handle: string;
  email: string;
  xp: number;
  level: number;
  streakDays: number;
  lastActiveDay: string | null; // YYYY-MM-DD
  bytesSavedSession: number;
  totalCompressions: number;
  totalBytesSaved: number; // persisted across sessions
  totalOriginalChars: number; // persisted; used to derive the average ratio
  achievements: Achievement[];
  activeNotices: FloatingXpNotice[];

  // Actions
  setHandle: (handle: string, email?: string) => void;
  clearNotice: (id: string) => void;
  recordCompression: (opts: { originalLength: number; compressedLength: number; hasDictionaryHit: boolean }) => number;
  recordDecode: () => void;
  recordScanReady: () => void;
  unlockAchievement: (id: string) => void;
}

const STORAGE_KEY = 'linkzip_player_gamestate_v1';

function loadPersistedState(): Partial<GameState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

function saveState(state: Partial<GameState>) {
  try {
    const subset = {
      handle: state.handle,
      email: state.email,
      xp: state.xp,
      level: state.level,
      streakDays: state.streakDays,
      lastActiveDay: state.lastActiveDay,
      totalCompressions: state.totalCompressions,
      totalBytesSaved: state.totalBytesSaved,
      totalOriginalChars: state.totalOriginalChars,
      achievements: state.achievements
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subset));
  } catch {
    // ignore
  }
}

/**
 * Keep names and descriptions current from INITIAL_ACHIEVEMENTS while preserving
 * each saved unlock time, so copy fixes reach players who already have a save.
 */
function mergeAchievements(saved: Achievement[] | undefined): Achievement[] {
  return INITIAL_ACHIEVEMENTS.map((a) => ({
    ...a,
    unlockedAt: saved?.find((s) => s.id === a.id)?.unlockedAt ?? null,
  }));
}

const initialSaved = loadPersistedState();

export const useGameStore = create<GameState>((set, get) => ({
  handle: initialSaved.handle || 'Anonymous',
  email: initialSaved.email || '',
  xp: initialSaved.xp || 0,
  level: initialSaved.level || 1,
  streakDays: initialSaved.streakDays || 1,
  lastActiveDay: initialSaved.lastActiveDay || null,
  bytesSavedSession: 0,
  totalCompressions: initialSaved.totalCompressions || 0,
  totalBytesSaved: initialSaved.totalBytesSaved || 0,
  totalOriginalChars: initialSaved.totalOriginalChars || 0,
  achievements: mergeAchievements(initialSaved.achievements),
  activeNotices: [],

  setHandle: (handle, email = '') => {
    set({ handle, email });
    saveState(get());
  },

  clearNotice: (id) => {
    set(s => ({ activeNotices: s.activeNotices.filter(n => n.id !== id) }));
  },

  recordCompression: ({ originalLength, compressedLength, hasDictionaryHit }) => {
    const state = get();
    const today = new Date().toISOString().split('T')[0];
    
    // Streak calculation
    let streakDays = state.streakDays;
    let isFirstOfDay = false;
    if (state.lastActiveDay !== today) {
      isFirstOfDay = true;
      if (state.lastActiveDay) {
        const lastDate = new Date(state.lastActiveDay);
        const diffDays = Math.floor((new Date(today).getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streakDays += 1;
        } else if (diffDays > 1) {
          streakDays = 1;
        }
      } else {
        streakDays = 1;
      }
    }

    // Formula: floor((1 - compressedLength / originalLength) * 1000)
    const ratio = Math.max(0, 1 - compressedLength / originalLength);
    const baseGain = Math.floor(ratio * 1000);

    // Bonuses:
    // dictionary_hit: 50 XP
    // first_of_day: 100 XP
    // streak multiplier: x1.1 per day capped at x2.0
    const streakMultiplier = Math.min(2.0, 1.0 + (streakDays - 1) * 0.1);
    const bonusXp = (hasDictionaryHit ? 50 : 0) + (isFirstOfDay ? 100 : 0);
    const totalGained = Math.round((baseGain + bonusXp) * streakMultiplier);

    const nextTotalXp = state.xp + totalGained;
    const { level: nextLevel } = calculateLevel(nextTotalXp);
    const bytesSaved = Math.max(0, originalLength - compressedLength);

    const notice: FloatingXpNotice = {
      id: `${Date.now()}-${Math.random()}`,
      amount: totalGained,
      label: isFirstOfDay ? 'First of Day!' : hasDictionaryHit ? 'Dictionary Match!' : undefined,
      createdAt: Date.now()
    };

    set(s => ({
      xp: nextTotalXp,
      level: nextLevel,
      streakDays,
      lastActiveDay: today,
      bytesSavedSession: s.bytesSavedSession + bytesSaved,
      totalCompressions: s.totalCompressions + 1,
      totalBytesSaved: s.totalBytesSaved + bytesSaved,
      totalOriginalChars: s.totalOriginalChars + originalLength,
      activeNotices: [...s.activeNotices.slice(-4), notice]
    }));

    // Trigger achievement rules
    state.unlockAchievement('first_squeeze');
    if (ratio >= 0.5) state.unlockAchievement('half_size');
    if (compressedLength <= 20) state.unlockAchievement('tiny_titan');
    if (streakDays >= 7) state.unlockAchievement('streak_7');

    saveState(get());
    return totalGained;
  },

  recordDecode: () => {
    get().unlockAchievement('decoder');
  },

  recordScanReady: () => {
    get().unlockAchievement('scanner');
  },

  unlockAchievement: (id) => {
    set(s => {
      const exists = s.achievements.find(a => a.id === id);
      if (!exists || exists.unlockedAt !== null) return s;
      const next = s.achievements.map(a =>
        a.id === id ? { ...a, unlockedAt: Date.now() } : a
      );
      saveState({ ...s, achievements: next });
      return { achievements: next };
    });
  }
}));
