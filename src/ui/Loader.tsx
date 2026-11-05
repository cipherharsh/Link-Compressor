import React, { useEffect, useState } from 'react';
import { useSceneStore, type UnsupportedReason } from '../state/sceneStore';

const LOADER_STEPS = [
  'Check WebGL2',
  'Check device memory and screen orientation',
  'Load fonts',
  'Load 3D chunk',
  'Warm up shaders',
] as const;

const MIN_DISPLAY_MS = 800;

interface CapabilityResult {
  supported: boolean;
  reason: UnsupportedReason;
}

export function evaluateCapabilities(): CapabilityResult {
  // Allow a query-parameter override for automated testing and accessibility.
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

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { supported: false, reason: 'Not supported browser' };
  }

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      return { supported: false, reason: 'Not supported WebGL' };
    }
  } catch {
    return { supported: false, reason: 'Not supported WebGL' };
  }

  const nav = navigator as Navigator & { deviceMemory?: number };
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 1) {
    return { supported: false, reason: 'Not supported device' };
  }

  if (window.innerWidth <= 0 || window.innerHeight <= 0) {
    return { supported: false, reason: 'Not supported orientation' };
  }

  return { supported: true, reason: null };
}

const Loader: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const setCapability = useSceneStore((s) => s.setCapability);
  const setLoaderFinished = useSceneStore((s) => s.setLoaderFinished);

  useEffect(() => {
    const startTime = performance.now();
    let isMounted = true;

    async function runLoader() {
      setCurrentStepIndex(0);
      await new Promise((r) => setTimeout(r, 120));
      const cap = evaluateCapabilities();
      setCapability(cap.supported, cap.reason);

      if (isMounted) setCurrentStepIndex(1);
      await new Promise((r) => setTimeout(r, 120));

      if (isMounted) setCurrentStepIndex(2);
      if (document.fonts && document.fonts.ready) {
        try {
          await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 200))]);
        } catch {
          // Continue gracefully if font loading stalls.
        }
      }

      if (isMounted) setCurrentStepIndex(3);
      await new Promise((r) => setTimeout(r, 150));

      if (isMounted) setCurrentStepIndex(4);
      await new Promise((r) => setTimeout(r, 150));

      // Guarantee a minimum display time to avoid a flash.
      const remaining = Math.max(0, MIN_DISPLAY_MS - (performance.now() - startTime));
      if (remaining > 0) {
        await new Promise((r) => setTimeout(r, remaining));
      }

      if (isMounted) {
        setIsFadingOut(true);
        setTimeout(() => {
          if (isMounted) setLoaderFinished(true);
        }, 400); // match the fade transition
      }
    }

    runLoader();

    return () => {
      isMounted = false;
    };
  }, [setCapability, setLoaderFinished]);

  return (
    <div className={`loader${isFadingOut ? ' is-fading' : ''}`} role="status" aria-live="polite">
      <div className="loader__brand">
        <div className="loader__logo" aria-hidden="true">🔗</div>
        <div className="loader__name">LinkZip</div>
      </div>

      <div className="loader__track">
        <div
          className="loader__fill"
          style={{ width: `${((currentStepIndex + 1) / LOADER_STEPS.length) * 100}%` }}
        />
      </div>

      <div className="loader__step">{LOADER_STEPS[currentStepIndex]}...</div>
    </div>
  );
};

export default Loader;
