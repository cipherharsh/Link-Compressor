/*
 * PURPOSE: Accessible notification banner and screen-reader live region for action feedback.
 * INPUTS: message, isVisible, onClose.
 * OUTPUTS: ARIA live region (polite) and non-blocking toast.
 * DEPENDS_ON: React, lucide-react.
 * WHY_THIS_DESIGN: Ensures accessibility compliance for blind/screen-reader users on clipboard copy.
 */

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastAnnouncerProps {
  message: string | null;
}

export const ToastAnnouncer: React.FC<ToastAnnouncerProps> = ({ message }) => {
  return (
    <>
      {/* Screen Reader Live Region */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {message || ''}
      </div>

      {/* Visual Floating Toast */}
      {message && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-lg)',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            animation: 'toastSlideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          className="toast-box"
        >
          <CheckCircle2 size={15} color="var(--color-success)" strokeWidth={2.5} />
          <span>{message}</span>
        </div>
      )}

      <style>{`
        @keyframes toastSlideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 640px) {
          .toast-box {
            bottom: 74px !important;
            right: 16px !important;
            left: 16px !important;
            justify-content: center !important;
          }
        }
      `}</style>
    </>
  );
};

export default ToastAnnouncer;
