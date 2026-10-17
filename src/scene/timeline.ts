/*
 * PURPOSE: GSAP-driven 1.8s collapse animation coordinating WildStrand, HuffmanTree, and VoxelQR.
 * INPUTS: Successful compression response event, duration (1.8s).
 * OUTPUTS: Frame-by-frame collapse progress value streamed into sceneStore.
 * DEPENDS_ON: gsap, sceneStore.ts.
 * WHY_THIS_DESIGN: Deterministic GSAP easing guarantees 1.8s multi-stage collapse matching user specification.
 */

import gsap from 'gsap';
import { useSceneStore } from '../state/sceneStore';
import type { CompressionStage } from '../engine/localCompress';

let currentCollapseTween: gsap.core.Tween | null = null;

export function playCollapseAnimation(opts: {
  url: string;
  stages: CompressionStage[];
  qrPayload: string;
  onComplete?: () => void;
}): void {
  const store = useSceneStore.getState();

  // Reset any running tween
  if (currentCollapseTween) {
    currentCollapseTween.kill();
  }

  store.triggerCollapse({
    url: opts.url,
    stages: opts.stages,
    qrPayload: opts.qrPayload
  });

  const animState = { progress: 0 };

  // 1.8s multi-stage collapse timeline
  currentCollapseTween = gsap.to(animState, {
    progress: 1.0,
    duration: 1.8,
    ease: 'power3.inOut',
    onUpdate: () => {
      useSceneStore.getState().setCollapseProgress(animState.progress);
    },
    onComplete: () => {
      useSceneStore.getState().finishCollapse();
      opts.onComplete?.();
    }
  });
}
