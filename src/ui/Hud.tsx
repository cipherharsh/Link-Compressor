/*
 * PURPOSE: Heads-Up Display (HUD) collapsible dropdown displaying player level, XP progress, streak, and floating feedback.
 * INPUTS: Reactive state from gameStore, sceneStore, and api adapter.
 * OUTPUTS: Header-integrated dropdown dashboard with audio mute, flatten QR toggle, handle management, and floating +N XP notices.
 * DEPENDS_ON: React, gameStore.ts, sceneStore.ts, adapter.ts, Achievements.tsx, ClaimHandleModal.tsx, tokens.css.
 * WHY_THIS_DESIGN: Collapsible dropdown trigger in header eliminates layout blocking while keeping player progression instantly accessible.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useGameStore, calculateLevel } from '../state/gameStore';
import { useSceneStore } from '../state/sceneStore';
import { getApiState } from '../api/adapter';
import Achievements from './Achievements';
import ClaimHandleModal from './ClaimHandleModal';

export const Hud: React.FC = () => {
  const xp = useGameStore((s) => s.xp);
  const handle = useGameStore((s) => s.handle);
  const streakDays = useGameStore((s) => s.streakDays);
  const bytesSavedSession = useGameStore((s) => s.bytesSavedSession);
  const isMuted = useGameStore((s) => s.isMuted);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const activeNotices = useGameStore((s) => s.activeNotices);
  const clearNotice = useGameStore((s) => s.clearNotice);

  const flattenQR = useSceneStore((s) => s.flattenQR);
  const toggleFlattenQR = useSceneStore((s) => s.toggleFlattenQR);
  const webglSupported = useSceneStore((s) => s.webglSupported);

  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const claimTriggerRef = useRef<HTMLButtonElement>(null);

  const apiState = getApiState();
  const { level, currentLevelXp, nextLevelXp } = calculateLevel(xp);
  const progressPercent = Math.min(100, Math.max(0, (currentLevelXp / Math.max(1, nextLevelXp)) * 100));

  // Dismiss dropdown on click/touch outside or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (isModalOpen) return;
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isModalOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isModalOpen]);

  return (
    <>
      <div
        ref={dropdownRef}
        className="hud-dropdown-container"
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center'
        }}
      >
        {/* Floating XP Gain Toasts (+N XP) - Renders above trigger pill even when collapsed */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: 'calc(100% + 6px)',
            height: 0,
            pointerEvents: 'none'
          }}
        >
          {activeNotices.map((n) => (
            <div
              key={n.id}
              onAnimationEnd={() => clearNotice(n.id)}
              style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                whiteSpace: 'nowrap',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '13px',
                color: 'var(--color-xp)',
                textShadow: '0 0 12px rgba(255, 209, 102, 0.85)',
                animation: 'floatUpAndFade 0.9s cubic-bezier(0.215, 0.61, 0.355, 1) forwards'
              }}
            >
              +{n.amount} XP {n.label && `• ${n.label}`}
            </div>
          ))}
        </div>

        {/* Compact Dropdown Trigger Pill */}
        <button
          className="hud-trigger-btn"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-haspopup="true"
          aria-expanded={isOpen}
          aria-controls="hud-dropdown-panel"
          aria-label={`Player HUD: ${handle}, Level ${level}, ${streakDays} day streak`}
          title="Toggle Player Stats & HUD"
          style={{
            background: isOpen ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
            border: isOpen ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
            borderRadius: 'var(--radius-pill)',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            padding: '6px 14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: isOpen ? '0 0 12px rgba(108, 242, 194, 0.25)' : 'none'
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span>👤</span>
            <span className="hud-trigger-handle" style={{ maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {handle}
            </span>
          </span>
          <span className="hud-trigger-lvl" style={{ color: 'var(--color-accent)', fontWeight: 700 }}>LVL {level}</span>
          <span className="hud-trigger-streak" style={{ color: 'var(--color-xp)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
            🔥 {streakDays}d
          </span>
          <span
            style={{
              fontSize: '9px',
              color: 'var(--color-muted)',
              display: 'inline-block',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              marginLeft: '2px'
            }}
          >
            ▼
          </span>
        </button>

        {/* Dropdown Menu Panel (Desktop Dropdown / Mobile Bottom Sheet) */}
        {isOpen && (
          <>
            {/* Mobile backdrop overlay */}
            <div
              className="hud-backdrop"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <div
              id="hud-dropdown-panel"
              className="hud-dropdown-modal"
              role="region"
              aria-label="Player profile and game status details"
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: '340px',
                maxWidth: 'calc(100vw - 32px)',
                background: 'rgba(20, 24, 33, 0.98)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-card)',
                padding: '14px 14px',
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.65), 0 0 1px rgba(255, 255, 255, 0.15)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {/* Mobile handle indicator & Close button */}
              <div className="hud-mobile-header" style={{ display: 'none', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-accent)' }}>
                    Player Profile
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close Player HUD"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-pill)',
                    color: 'var(--color-text)',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    padding: '4px 10px',
                    cursor: 'pointer'
                  }}
                >
                  ✕ Close
                </button>
              </div>

              {/* Top Row: Handle / Edit, Mute SFX, Flatten QR, Streak */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  ref={claimTriggerRef}
                  onClick={() => setIsModalOpen(true)}
                  title="Click to claim player handle"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-pill)',
                    color: 'var(--color-text)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-small)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    transition: 'border-color 0.2s ease'
                  }}
                >
                  <span>👤 {handle}</span>
                  <span style={{ fontSize: '10px', color: 'var(--color-muted)' }}>✏️</span>
                </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Audio mute toggle */}
                <button
                  onClick={toggleMute}
                  title={isMuted ? 'Unmute SFX' : 'Mute SFX'}
                  aria-label={isMuted ? 'Unmute SFX' : 'Mute SFX'}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-pill)',
                    color: isMuted ? 'var(--color-muted)' : 'var(--color-accent)',
                    fontSize: '12px',
                    padding: '4px 8px',
                    cursor: 'pointer'
                  }}
                >
                  {isMuted ? '🔇' : '🔊'}
                </button>

                {/* Flatten QR toggle */}
                {webglSupported && (
                  <button
                    onClick={toggleFlattenQR}
                    title="Toggle top-down flat scan mode"
                    style={{
                      background: flattenQR ? 'var(--color-accent)' : 'rgba(255, 255, 255, 0.05)',
                      color: flattenQR ? 'var(--color-bg)' : 'var(--color-text)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-pill)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {flattenQR ? '3D View' : 'Flatten QR'}
                  </button>
                )}

                {/* Streak */}
                <div
                  title={`${streakDays} consecutive day streak`}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-xp)',
                    background: 'rgba(255, 209, 102, 0.12)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-pill)'
                  }}
                >
                  🔥 {streakDays}d
                </div>
              </div>
            </div>

            {/* Level Progress Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>LVL {level}</span>
                <span style={{ color: 'var(--color-muted)' }}>{xp} XP ({progressPercent.toFixed(0)}%)</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '5px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-pill)',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-2))',
                    transition: 'width 0.4s ease'
                  }}
                />
              </div>
            </div>

            {/* Session Metrics & Offline Indicator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}>
              <span>Saved: {bytesSavedSession} bytes</span>
              {apiState.isOffline && (
                <span style={{ color: 'var(--color-xp)' }}>⚡ Offline Engine</span>
              )}
            </div>

              {/* Achievements Strip */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                <Achievements />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Claim Handle Modal */}
      <ClaimHandleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        triggerRef={claimTriggerRef}
      />

      {/* Animation Styles */}
      <style>{`
        @keyframes floatUpAndFade {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-24px);
          }
        }
        @keyframes hudDropdownSlideIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
};

export default Hud;
