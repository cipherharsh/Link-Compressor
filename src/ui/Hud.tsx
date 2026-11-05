import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore, calculateLevel } from '../state/gameStore';
import { useSceneStore } from '../state/sceneStore';
import Achievements from './Achievements';
import ClaimHandleModal from './ClaimHandleModal';

const Hud: React.FC = () => {
  const xp = useGameStore((s) => s.xp);
  const handle = useGameStore((s) => s.handle);
  const streakDays = useGameStore((s) => s.streakDays);
  const bytesSavedSession = useGameStore((s) => s.bytesSavedSession);
  const activeNotices = useGameStore((s) => s.activeNotices);
  const clearNotice = useGameStore((s) => s.clearNotice);

  const flattenQR = useSceneStore((s) => s.flattenQR);
  const toggleFlattenQR = useSceneStore((s) => s.toggleFlattenQR);
  const webglSupported = useSceneStore((s) => s.webglSupported);

  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const claimTriggerRef = useRef<HTMLButtonElement>(null);

  const { level, currentLevelXp, nextLevelXp } = calculateLevel(xp);
  const progressPercent = Math.min(100, Math.max(0, (currentLevelXp / Math.max(1, nextLevelXp)) * 100));

  // Dismiss the dropdown on outside pointer/touch or Escape.
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (isModalOpen) return;
      const target = e.target as Node;
      if (dropdownRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isModalOpen) setIsOpen(false);
    };

    // Delay slightly so the opening click doesn't immediately dismiss it.
    const timer = window.setTimeout(() => {
      document.addEventListener('mousedown', handlePointerDown);
      document.addEventListener('touchstart', handlePointerDown, { passive: true });
      document.addEventListener('keydown', handleKeyDown);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isModalOpen]);

  return (
    <>
      <div ref={dropdownRef} className="hud">
        {/* Floating +N XP toasts, anchored above the trigger */}
        <div className="hud-toasts">
          {activeNotices.map((n) => (
            <div key={n.id} className="hud-toast" onAnimationEnd={() => clearNotice(n.id)}>
              +{n.amount} XP {n.label && `• ${n.label}`}
            </div>
          ))}
        </div>

        <button
          className={`hud-trigger${isOpen ? ' is-open' : ''}`}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-haspopup="true"
          aria-expanded={isOpen}
          aria-controls="hud-dropdown-panel"
          aria-label={`Player HUD: ${handle}, Level ${level}, ${streakDays} day streak`}
          title="Toggle Player Stats & HUD"
        >
          <span className="hud-trigger__id">
            <span aria-hidden="true">👤</span>
            <span className="hud-trigger-handle">{handle}</span>
          </span>
          <span className="hud-trigger-lvl">LVL {level}</span>
          <span className="hud-trigger-streak">🔥 {streakDays}d</span>
          <span className="hud-trigger__caret" aria-hidden="true">▼</span>
        </button>

        {isOpen && typeof document !== 'undefined' &&
          createPortal(
            <>
              <div className="hud-backdrop" onClick={() => setIsOpen(false)} aria-hidden="true" />
              <div
                id="hud-dropdown-panel"
                ref={panelRef}
                className="hud-panel"
                role="region"
                aria-label="Player profile and game status details"
              >
                <div className="hud-mobile-header">
                  <span className="hud-mobile-header__title">Player Profile</span>
                  <button className="hud-close" onClick={() => setIsOpen(false)} aria-label="Close Player HUD">
                    ✕ Close
                  </button>
                </div>

                <div className="hud-row">
                  <button
                    ref={claimTriggerRef}
                    className="hud-handle-btn"
                    onClick={() => setIsModalOpen(true)}
                    title="Click to claim player handle"
                  >
                    <span>👤 {handle}</span>
                    <span className="hud-handle-btn__edit">✏️</span>
                  </button>

                  <div className="hud-controls">
                    {webglSupported && (
                      <button
                        className={`hud-flatten-btn${flattenQR ? ' is-active' : ''}`}
                        onClick={toggleFlattenQR}
                        title="Toggle top-down flat scan mode"
                      >
                        {flattenQR ? '3D View' : 'Flatten QR'}
                      </button>
                    )}

                    <div className="hud-streak" title={`${streakDays} consecutive day streak`}>
                      🔥 {streakDays}d
                    </div>
                  </div>
                </div>

                <div>
                  <div className="hud-progress__meta">
                    <span className="lvl">LVL {level}</span>
                    <span className="xp">{xp} XP ({progressPercent.toFixed(0)}%)</span>
                  </div>
                  <div className="hud-progress__track">
                    <div className="hud-progress__fill" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>

                <div className="hud-metrics">
                  <span>Saved: {bytesSavedSession} bytes</span>
                  <span className="hud-metrics__engine">⚡ In-browser engine</span>
                </div>

                <div className="hud-achievements">
                  <Achievements />
                </div>
              </div>
            </>,
            document.body,
          )}
      </div>

      <ClaimHandleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        triggerRef={claimTriggerRef}
      />
    </>
  );
};

export default Hud;
