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
  { label: 'Contact & Support', target: 'contact' },
];

export const MenuOverlay: React.FC<MenuOverlayProps> = ({ isOpen, onClose, triggerRef, onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const focusTimer = window.setTimeout(() => firstLinkRef.current?.focus(), 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap within the overlay.
      if (e.key === 'Tab' && containerRef.current) {
        const focusables = containerRef.current.querySelectorAll<HTMLElement>(
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

  const handleLinkClick = (target: string) => {
    onClose();
    onNavigate?.(target);
  };

  return (
    <div
      ref={containerRef}
      className="menu-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation Menu"
    >
      <div className="menu-overlay__top">
        <div className="menu-overlay__brand">
          <span className="menu-overlay__brand-icon" aria-hidden="true">🔗</span>
          <span className="menu-overlay__brand-text">LinkZip</span>
        </div>
        <button className="menu-close" onClick={onClose} aria-label="Close navigation menu">
          Close [ESC]
        </button>
      </div>

      <nav className="menu-nav">
        {MENU_LINKS.map((link, idx) => (
          <button
            key={link.target}
            ref={idx === 0 ? firstLinkRef : undefined}
            className="menu-link"
            onClick={() => handleLinkClick(link.target)}
          >
            {link.label}
          </button>
        ))}
      </nav>

      <div className="menu-overlay__foot">
        <div>Client-Side • Zero-Server • Open Source</div>
        <div>Built for high-density QR scanning</div>
      </div>
    </div>
  );
};

export default MenuOverlay;
