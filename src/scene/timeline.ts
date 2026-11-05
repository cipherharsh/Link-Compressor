/** GSAP-driven 1.8s collapse animation streaming progress into the scene store. */

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
