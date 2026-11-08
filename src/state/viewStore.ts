/** Zustand store for the page style: the full 3D scene or a minimal 2D page. */

import { create } from 'zustand';
import { useSceneStore } from './sceneStore';

export type ViewMode = '3d' | '2d';

const STORAGE_KEY = 'linkzip_view';

function readSavedView(): ViewMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === '2d' ? '2d' : '3d';
  } catch {
    return '3d';
  }
}

interface ViewState {
  view: ViewMode;
  /** Switches the page style and remembers the choice for the next visit. */
  setView: (view: ViewMode) => void;
}

export const useViewStore = create<ViewState>((set) => ({
  view: readSavedView(),

  setView: (view) => {
    try {
      localStorage.setItem(STORAGE_KEY, view);
    } catch {
      // Storage unavailable (private mode); the choice just won't persist.
    }
    // The flat scan view belongs to the 3D scene, so leave it when going 2D.
    if (view === '2d') useSceneStore.getState().setFlattenQR(false);
    set({ view });
  },
}));

/** True when the 3D scene should run: the visitor wants it and the device can draw it. */
export function useShow3D(): boolean {
  const view = useViewStore((s) => s.view);
  const webglSupported = useSceneStore((s) => s.webglSupported);
  return view === '3d' && webglSupported;
}
