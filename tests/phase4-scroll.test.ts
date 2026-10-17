/*
 * PURPOSE: Automated test verification for Phase 4 Scroll narrative acceptance criteria.
 * INPUTS: Simulated scroll progress delta values (0.0 to 1.0 forward and backward).
 * OUTPUTS: Vitest test assertions.
 * DEPENDS_ON: vitest, src/state/sceneStore.ts.
 * WHY_THIS_DESIGN: Directly verifies Phase 4 acceptance criteria: chapter indicators update at defined ranges and transitions are perfectly reversible.
 */

import { describe, it, expect } from 'vitest';
import { useSceneStore } from '../src/state/sceneStore';

describe('Phase 4 Scroll Narrative Acceptance', () => {
  it('updates chapter indicator accurately across defined ranges', () => {
    const store = useSceneStore.getState();

    // Range [0.0, 0.2) -> Chapter 1: Overview
    store.setScrollProgress(0.0);
    expect(useSceneStore.getState().currentChapter).toBe(1);
    expect(useSceneStore.getState().chapterLabel).toBe('Overview');

    store.setScrollProgress(0.18);
    expect(useSceneStore.getState().currentChapter).toBe(1);

    // Range [0.2, 0.55) -> Chapter 2: Compress
    store.setScrollProgress(0.20);
    expect(useSceneStore.getState().currentChapter).toBe(2);
    expect(useSceneStore.getState().chapterLabel).toBe('Compress');

    store.setScrollProgress(0.54);
    expect(useSceneStore.getState().currentChapter).toBe(2);

    // Range [0.55, 0.85) -> Chapter 3: Play
    store.setScrollProgress(0.55);
    expect(useSceneStore.getState().currentChapter).toBe(3);
    expect(useSceneStore.getState().chapterLabel).toBe('Play');

    store.setScrollProgress(0.84);
    expect(useSceneStore.getState().currentChapter).toBe(3);

    // Range [0.85, 1.0] -> Chapter 4: Join
    store.setScrollProgress(0.85);
    expect(useSceneStore.getState().currentChapter).toBe(4);
    expect(useSceneStore.getState().chapterLabel).toBe('Join');

    store.setScrollProgress(1.0);
    expect(useSceneStore.getState().currentChapter).toBe(4);
  });

  it('scrolling forward and backward is perfectly reversible', () => {
    const store = useSceneStore.getState();

    // Scroll forward
    const forwardSteps = [0.05, 0.25, 0.65, 0.95];
    const forwardChapters = forwardSteps.map((p) => {
      store.setScrollProgress(p);
      return useSceneStore.getState().currentChapter;
    });
    expect(forwardChapters).toEqual([1, 2, 3, 4]);

    // Scroll backward
    const backwardSteps = [0.95, 0.65, 0.25, 0.05];
    const backwardChapters = backwardSteps.map((p) => {
      store.setScrollProgress(p);
      return useSceneStore.getState().currentChapter;
    });
    expect(backwardChapters).toEqual([4, 3, 2, 1]);
  });
});
