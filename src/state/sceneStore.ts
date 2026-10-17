/*
 * PURPOSE: Reactive 3D scene state coordinating camera, shaders, collapse timelines, and device capability.
 * INPUTS: Scroll delta events, compress lifecycle triggers, FPS monitor telemetry.
 * OUTPUTS: Normalized scene properties consumed by R3F canvas components and HUD indicators.
 * DEPENDS_ON: zustand, localCompress.ts.
 * WHY_THIS_DESIGN: Isolates high-frequency render state so canvas updates do not trigger unnecessary DOM re-renders.
 */

import { create } from 'zustand';
import type { CompressionStage } from '../engine/localCompress';

export type UnsupportedReason =
  | 'Not supported device'
  | 'Not supported browser'
  | 'Not supported WebGL'
  | 'Not supported orientation'
  | null;

export type QualityTier = 'high' | 'medium' | 'low' | 'fallback2d';

interface SceneState {
  // Virtual scroll & narrative
  scrollProgress: number; // 0.0 to 1.0
  currentChapter: 1 | 2 | 3 | 4;
  chapterLabel: string;

  // Collapse animation
  isCollapsing: boolean;
  collapseProgress: number; // 0.0 to 1.0
  activeUrl: string;
  activeStages: CompressionStage[];
  activeQrPayload: string | null;
  flattenQR: boolean; // scan safety toggle

  // Capabilities & performance
  webglSupported: boolean;
  unsupportedReason: UnsupportedReason;
  loaderFinished: boolean;
  qualityTier: QualityTier;
  fps: number;

  // Actions
  setScrollProgress: (progress: number) => void;
  triggerCollapse: (opts: { url: string; stages: CompressionStage[]; qrPayload: string }) => void;
  setCollapseProgress: (p: number) => void;
  finishCollapse: () => void;
  setFlattenQR: (flatten: boolean) => void;
  toggleFlattenQR: () => void;
  setCapability: (supported: boolean, reason?: UnsupportedReason) => void;
  setLoaderFinished: (finished: boolean) => void;
  setFpsAndTier: (fps: number, tier: QualityTier) => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  scrollProgress: 0,
  currentChapter: 1,
  chapterLabel: 'Overview',

  isCollapsing: false,
  collapseProgress: 0,
  activeUrl: '',
  activeStages: [],
  activeQrPayload: null,
  flattenQR: false,

  webglSupported: true,
  unsupportedReason: null,
  loaderFinished: false,
  qualityTier: 'high',
  fps: 60,

  setScrollProgress: (progress: number) => {
    const clamped = Math.max(0, Math.min(1, progress));
    let currentChapter: 1 | 2 | 3 | 4 = 1;
    let chapterLabel = 'Overview';

    if (clamped < 0.2) {
      currentChapter = 1;
      chapterLabel = 'Overview';
    } else if (clamped < 0.55) {
      currentChapter = 2;
      chapterLabel = 'Compress';
    } else if (clamped < 0.85) {
      currentChapter = 3;
      chapterLabel = 'Play';
    } else {
      currentChapter = 4;
      chapterLabel = 'Join';
    }

    set({ scrollProgress: clamped, currentChapter, chapterLabel });
  },

  triggerCollapse: ({ url, stages, qrPayload }) => {
    set({
      isCollapsing: true,
      collapseProgress: 0,
      activeUrl: url,
      activeStages: stages,
      activeQrPayload: qrPayload
    });
  },

  setCollapseProgress: (collapseProgress: number) => {
    set({ collapseProgress });
  },

  finishCollapse: () => {
    set({ isCollapsing: false, collapseProgress: 1 });
  },

  setFlattenQR: (flattenQR: boolean) => {
    set({ flattenQR });
  },

  toggleFlattenQR: () => {
    set(s => ({ flattenQR: !s.flattenQR }));
  },

  setCapability: (webglSupported: boolean, unsupportedReason: UnsupportedReason = null) => {
    set({
      webglSupported,
      unsupportedReason,
      qualityTier: webglSupported ? 'high' : 'fallback2d'
    });
  },

  setLoaderFinished: (loaderFinished: boolean) => {
    set({ loaderFinished });
  },

  setFpsAndTier: (fps: number, qualityTier: QualityTier) => {
    set({ fps, qualityTier });
  }
}));
