/** Zustand store for the colour theme. index.html sets the initial data-theme before first paint. */

import { create } from 'zustand';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'linkzip_theme';

function readInitialTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function applyTheme(theme: Theme) {
  if (typeof document !== 'undefined') document.documentElement.dataset.theme = theme;
}

function hasSavedChoice(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

interface ThemeState {
  theme: Theme;
  /** Sets the theme and remembers it as the visitor's explicit choice. */
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: readInitialTheme(),

  setTheme: (theme) => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage unavailable (private mode); the choice just won't persist.
    }
    set({ theme });
  },

  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
}));

// Until the visitor picks a theme, keep following the device setting.
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    if (hasSavedChoice()) return;
    const theme: Theme = e.matches ? 'light' : 'dark';
    applyTheme(theme);
    useThemeStore.setState({ theme });
  });
}
