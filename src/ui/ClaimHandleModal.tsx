/*
 * PURPOSE: Accessible modal dialog for claiming player handles and syncing leaderboard profiles.
 * INPUTS: User input (handle, email), trigger element focus reference.
 * OUTPUTS: Updated player profile in gameStore and confirmation feedback.
 * DEPENDS_ON: React, gameStore.ts, tokens.css.
 * WHY_THIS_DESIGN: Focus trapping, Escape dismissal, and return-focus ensure WCAG AA keyboard accessibility.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../state/gameStore';

interface ClaimHandleModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export const ClaimHandleModal: React.FC<ClaimHandleModalProps> = ({
  isOpen,
  onClose,
  triggerRef
}) => {
  const currentHandle = useGameStore((s) => s.handle);
  const currentEmail = useGameStore((s) => s.email);
  const setHandle = useGameStore((s) => s.setHandle);

  const [inputHandle, setInputHandle] = useState(currentHandle === 'Anonymous' ? '' : currentHandle);
  const [inputEmail, setInputEmail] = useState(currentEmail);
  const [isSuccess, setIsSuccess] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsSuccess(false);
      return;
    }

    // Focus first input on open
    setTimeout(() => {
      firstInputRef.current?.focus();
    }, 50);

    // Escape key listener & focus trapping
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      triggerRef?.current?.focus();
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputHandle.trim()) return;
    setHandle(inputHandle.trim(), inputEmail.trim());
    setIsSuccess(true);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal)' as unknown as number,
        backgroundColor: 'rgba(11, 13, 18, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-handle-title"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          padding: '32px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)'
        }}
      >
        {isSuccess ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
            <h3
              id="claim-handle-title"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-h3)',
                fontWeight: 700,
                marginBottom: '12px',
                color: 'var(--color-accent)'
              }}
            >
              Handle Claimed!
            </h3>
            <p
              style={{
                color: 'var(--color-muted)',
                fontSize: 'var(--text-small)',
                marginBottom: '24px',
                lineHeight: 1.5
              }}
            >
              Welcome to the LinkZip grid, <strong>{inputHandle}</strong>. Your stats and achievements are linked to this profile.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: '10px 24px',
                background: 'var(--color-accent)',
                color: 'var(--color-bg)',
                border: 'none',
                borderRadius: 'var(--radius-pill)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3
                id="claim-handle-title"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-h3)',
                  fontWeight: 700,
                  color: 'var(--color-text)'
                }}
              >
                Claim Player Handle
              </h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-muted)',
                  fontSize: '1.2rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-small)', marginBottom: '24px' }}>
              Claim your tag to preserve high-ratio streaks and appear on the LinkZip live leaderboard.
            </p>

            <div style={{ marginBottom: '18px' }}>
              <label
                htmlFor="input-handle"
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-muted)',
                  marginBottom: '6px'
                }}
              >
                PLAYER HANDLE *
              </label>
              <input
                id="input-handle"
                ref={firstInputRef}
                type="text"
                required
                maxLength={24}
                value={inputHandle}
                onChange={(e) => setInputHandle(e.target.value)}
                placeholder="e.g. VoxelZero"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-small)'
                }}
              />
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label
                htmlFor="input-email"
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-muted)',
                  marginBottom: '6px'
                }}
              >
                EMAIL (OPTIONAL)
              </label>
              <input
                id="input-email"
                type="email"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                placeholder="dev@example.com"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-small)'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 18px',
                  background: 'none',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-muted)',
                  borderRadius: 'var(--radius-pill)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-small)'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '10px 22px',
                  background: 'var(--color-accent)',
                  color: 'var(--color-bg)',
                  border: 'none',
                  borderRadius: 'var(--radius-pill)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  fontSize: 'var(--text-small)'
                }}
              >
                Save Profile
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ClaimHandleModal;
