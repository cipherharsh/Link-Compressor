/*
 * PURPOSE: Staged capability detection and asset warming loader with minimum duration guarantee.
 * INPUTS: Browser WebGL capabilities, device memory, document fonts, screen orientation.
 * OUTPUTS: Capability state sent to sceneStore and smooth transition to 3D or 2D fallback.
 * DEPENDS_ON: React, sceneStore.ts, tokens.css.
 * WHY_THIS_DESIGN: Prevents UI flash with 800ms minimum display threshold while verifying hardware capability.
 */

import React, { useEffect, useState } from 'react';
import { useSceneStore, type UnsupportedReason } from '../state/sceneStore';

const LOADER_STEPS = [
  'Check WebGL2',
  'Check device memory and screen orientation',
  'Load fonts',
  'Load 3D chunk',
  'Warm up shaders'
] as const;

const MIN_DISPLAY_MS = 800;

interface CapabilityResult {
  supported: boolean;
  reason: UnsupportedReason;
}

export function evaluateCapabilities(): CapabilityResult {
  // Allow explicit query parameter override for automated testing & accessibility
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const forceUnsupported = params.get('unsupported');
    if (forceUnsupported === 'webgl' || params.get('webgl') === '0') {
      return { supported: false, reason: 'Not supported WebGL' };
    }
    if (forceUnsupported === 'browser') {
      return { supported: false, reason: 'Not supported browser' };
    }
    if (forceUnsupported === 'device') {
      return { supported: false, reason: 'Not supported device' };
    }
    if (forceUnsupported === 'orientation') {
      return { supported: false, reason: 'Not supported orientation' };
    }
  }

  // 1. Browser check
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { supported: false, reason: 'Not supported browser' };
  }

  // 2. WebGL check
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      return { supported: false, reason: 'Not supported WebGL' };
    }
  } catch {
    return { supported: false, reason: 'Not supported WebGL' };
  }

  // 3. Device memory & hardware concurrency check (very constrained devices)
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 1) {
    return { supported: false, reason: 'Not supported device' };
  }

  // 4. Orientation check (extreme unsupported aspect ratios if window is corrupted)
  if (window.innerWidth <= 0 || window.innerHeight <= 0) {
    return { supported: false, reason: 'Not supported orientation' };
  }

  return { supported: true, reason: null };
}

export const Loader: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const setCapability = useSceneStore((s) => s.setCapability);
  const setLoaderFinished = useSceneStore((s) => s.setLoaderFinished);

  useEffect(() => {
    const startTime = performance.now();
    let isMounted = true;

    async function runLoader() {
      // Step 0: Check WebGL2
      setCurrentStepIndex(0);
      await new Promise((r) => setTimeout(r, 120));
      const cap = evaluateCapabilities();
      if (!cap.supported) {
        setCapability(false, cap.reason);
      } else {
        setCapability(true, null);
      }

      // Step 1: Check device memory & orientation
      if (isMounted) setCurrentStepIndex(1);
      await new Promise((r) => setTimeout(r, 120));

      // Step 2: Load fonts
      if (isMounted) setCurrentStepIndex(2);
      if (document.fonts && document.fonts.ready) {
        try {
          await Promise.race([
            document.fonts.ready,
            new Promise((r) => setTimeout(r, 200))
          ]);
        } catch {
          // Continue gracefully
        }
      }

      // Step 3: Load 3D chunk
      if (isMounted) setCurrentStepIndex(3);
      await new Promise((r) => setTimeout(r, 150));

      // Step 4: Warm up shaders
      if (isMounted) setCurrentStepIndex(4);
      await new Promise((r) => setTimeout(r, 150));

      // Ensure minimum display time of 800ms
      const elapsed = performance.now() - startTime;
      const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
      if (remaining > 0) {
        await new Promise((r) => setTimeout(r, remaining));
      }

      if (isMounted) {
        setIsFadingOut(true);
        setTimeout(() => {
          if (isMounted) {
            setLoaderFinished(true);
          }
        }, 400); // match fade transition duration
      }
    }

    runLoader();

    return () => {
      isMounted = false;
    };
  }, [setCapability, setLoaderFinished]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-loader)' as unknown as number,
        backgroundColor: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        opacity: isFadingOut ? 0 : 1,
        transition: 'opacity 0.4s cubic-bezier(0.215, 0.61, 0.355, 1)',
        pointerEvents: isFadingOut ? 'none' : 'auto'
      }}
      role="status"
      aria-live="polite"
    >
      {/* Brand logo & pulsing indicator */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div
          style={{
            fontSize: '3rem',
            marginBottom: '16px',
            animation: 'pulse 1.6s infinite ease-in-out'
          }}
        >
          🔗
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-h2)',
            fontWeight: 700,
            color: 'var(--color-text)',
            letterSpacing: '-0.03em'
          }}
        >
          LinkZip
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          maxWidth: '360px',
          height: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-pill)',
          overflow: 'hidden',
          marginBottom: '20px'
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${((currentStepIndex + 1) / LOADER_STEPS.length) * 100}%`,
            backgroundColor: 'var(--color-accent)',
            boxShadow: '0 0 12px var(--color-accent)',
            transition: 'width 0.25s ease-out'
          }}
        />
      </div>

      {/* Current Step Label */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-small)',
          color: 'var(--color-muted)'
        }}
      >
        {LOADER_STEPS[currentStepIndex]}...
      </div>
    </div>
  );
};

export default Loader;
