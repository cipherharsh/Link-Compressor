/*
 * PURPOSE: Full-screen navigation menu overlay with focus trap and keyboard navigation.
 * INPUTS: Menu open state, onClose callback, trigger element focus reference.
 * OUTPUTS: Accessible full-screen overlay with quick links and smooth entry/exit animations.
 * DEPENDS_ON: React, tokens.css.
 * WHY_THIS_DESIGN: Focus trap and Escape listener ensure WCAG AA compliance for modal overlay menus.
 */

import React, { useEffect, useRef } from 'react';

interface MenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
  onNavigate?: (section: string) => void;
}

const MENU_LINKS = [
  { label: 'Play & Squeeze', target: 'playground' },
  { label: 'How it Works', target: 'pipeline' },
  { label: 'Live Stats', target: 'stats' },
  { label: 'FAQ', target: 'faq' },
  { label: 'Contact & Support', target: 'contact' }
];

export const MenuOverlay: React.FC<MenuOverlayProps> = ({
  isOpen,
  onClose,
  triggerRef,
  onNavigate
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    setTimeout(() => {
      firstLinkRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }

      // Focus trap
      if (e.key === 'Tab' && containerRef.current) {
        const focusables = containerRef.current.querySelectorAll<HTMLElement>(
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

  const handleLinkClick = (target: string) => {
    onClose();
    onNavigate?.(target);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal)' as unknown as number,
        backgroundColor: 'rgba(11, 13, 18, 0.96)',
        backdropFilter: 'blur(24px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'clamp(20px, 5vw, 36px) clamp(16px, 5vw, 48px)'
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation Menu"
    >
      {/* Top Bar with Brand & Close Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.5rem' }}>🔗</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem' }}>
            LinkZip
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close navigation menu"
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-pill)',
            color: 'var(--color-text)',
            fontSize: '1.2rem',
            padding: '8px 18px',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)'
          }}
        >
          Close [ESC]
        </button>
      </div>

      {/* Primary Navigation Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {MENU_LINKS.map((link, idx) => (
          <button
            key={link.target}
            ref={idx === 0 ? firstLinkRef : undefined}
            onClick={() => handleLinkClick(link.target)}
            style={{
              background: 'none',
              border: 'none',
              textAlign: 'left',
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 5vw, 3.8rem)',
              fontWeight: 700,
              color: 'var(--color-text)',
              cursor: 'pointer',
              letterSpacing: '-0.03em',
              transition: 'color 0.2s ease, transform 0.2s ease',
              padding: '6px 0'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-accent)';
              e.currentTarget.style.transform = 'translateX(12px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text)';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            {link.label}
          </button>
        ))}
      </nav>

      {/* Footer Details */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-muted)',
          borderTop: '1px solid var(--color-border)',
          paddingTop: '24px'
        }}
      >
        <div>Client-Side • Zero-Server • Open Source</div>
        <div>Built for high-density QR scanning</div>
      </div>
    </div>
  );
};

export default MenuOverlay;
