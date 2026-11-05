/** 3D scene colours per UI theme, kept in step with the CSS tokens in tokens.css. */

import type { Theme } from '../state/themeStore';
import { useThemeStore } from '../state/themeStore';

export interface SceneTheme {
  fog: string;
  dust: string;
  dustOpacity: number;
  /** Strand ribbon gradient, start to end. */
  strandA: string;
  strandB: string;
  /** Additive glow reads well on dark backgrounds but vanishes on light ones. */
  additive: boolean;
  treeNode: string;
  treeLine: string;
  voxel: string;
  voxelEmissive: number;
  lightA: string;
  lightB: string;
  /** Bloom and vignette only suit the dark theme (on ivory they wash out the page). */
  postFx: boolean;
}

export const SCENE_THEMES: Record<Theme, SceneTheme> = {
  dark: {
    fog: '#06110C',
    dust: '#98A096',
    dustOpacity: 0.35,
    strandA: '#CDF22B',
    strandB: '#F4F1EC',
    additive: true,
    treeNode: '#CDF22B',
    treeLine: '#F4F1EC',
    voxel: '#CDF22B',
    voxelEmissive: 0.3,
    lightA: '#CDF22B',
    lightB: '#E5534B',
    postFx: true,
  },
  light: {
    fog: '#FAF8F3',
    dust: '#5C5E80',
    dustOpacity: 0.3,
    strandA: '#08098B',
    strandB: '#5E7A00',
    additive: false,
    treeNode: '#08098B',
    treeLine: '#5C5E80',
    voxel: '#08098B',
    voxelEmissive: 0.05,
    lightA: '#FFFFFF',
    lightB: '#A31C18',
    postFx: false,
  },
};

/** The scene colours for the current UI theme. */
export function useSceneTheme(): SceneTheme {
  return SCENE_THEMES[useThemeStore((s) => s.theme)];
}

/** Colours for the flattened, scannable QR: dark squares on white paper in both themes. */
export const FLAT_QR = { paper: '#FFFFFF', ink: { dark: '#06110C', light: '#08098B' } } as const;
