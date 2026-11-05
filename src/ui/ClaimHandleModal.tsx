import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../state/gameStore';

interface ClaimHandleModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

const ClaimHandleModal: React.FC<ClaimHandleModalProps> = ({ isOpen, onClose, triggerRef }) => {
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

    const focusTimer = window.setTimeout(() => firstInputRef.current?.focus(), 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
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
    const returnFocusTo = triggerRef?.current;

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      returnFocusTo?.focus();
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
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-handle-title"
    >
      <div className="modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        {isSuccess ? (
          <div className="modal__success">
            <div className="modal__success-icon" aria-hidden="true">🎉</div>
            <h3 id="claim-handle-title" className="modal__success-title">Handle Claimed!</h3>
            <p className="modal__success-text">
              Welcome to the LinkZip grid, <strong>{inputHandle}</strong>. Your stats and achievements
              are linked to this profile.
            </p>
            <button className="modal__btn-close" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal__head">
              <h3 id="claim-handle-title" className="modal__title">Claim Player Handle</h3>
              <button type="button" className="modal__close" onClick={onClose} aria-label="Close modal">
                ✕
              </button>
            </div>

            <p className="modal__intro">
              Claim your tag to preserve high-ratio streaks and appear on the LinkZip live leaderboard.
            </p>

            <div className="modal__field">
              <label htmlFor="input-handle" className="field-label">PLAYER HANDLE *</label>
              <input
                id="input-handle"
                ref={firstInputRef}
                className="modal__input"
                type="text"
                required
                maxLength={24}
                value={inputHandle}
                onChange={(e) => setInputHandle(e.target.value)}
                placeholder="e.g. VoxelZero"
              />
            </div>

            <div className="modal__field modal__field--last">
              <label htmlFor="input-email" className="field-label">EMAIL (OPTIONAL)</label>
              <input
                id="input-email"
                className="modal__input"
                type="email"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                placeholder="dev@example.com"
              />
            </div>

            <div className="modal__actions">
              <button type="button" className="modal__btn-cancel" onClick={onClose}>Cancel</button>
              <button type="submit" className="modal__btn-save">Save Profile</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ClaimHandleModal;
