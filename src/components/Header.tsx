/*
 * PURPOSE: Application navigation header with branding, privacy guarantee, and theme controls.
 * INPUTS: Current theme mode, onThemeToggle callback, onOpenHistory callback, historyCount.
 * OUTPUTS: Semantic <header> landmark with accessible buttons and keyboard shortcut hints.
 * DEPENDS_ON: React, lucide-react, types.ts.
 * WHY_THIS_DESIGN: Direct, professional identity with zero emoji clutter and explicit offline status.
 */

import React from 'react';
import { QrCode, Sun, Moon, Laptop, History, ShieldCheck } from 'lucide-react';
import type { ThemeMode } from '../lib/types';

interface HeaderProps {
  theme: ThemeMode;
  onThemeToggle: () => void;
  onOpenHistory: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onThemeToggle,
  onOpenHistory,
  historyCount
}) => {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  return (
    <header className="site-header" role="banner">
      <div className="header-container">
        {/* Brand Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-contrast)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <QrCode size={18} strokeWidth={2} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 700,
                  fontSize: 'var(--text-md)',
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)'
                }}
              >
                LinkZip
              </span>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                v2.0
              </span>
            </div>
          </div>
        </div>

        {/* Privacy Pill & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {/* Privacy Guarantee Badge (Desktop) */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-success-bg)',
              color: 'var(--color-success)',
              fontSize: 'var(--text-xs)',
              fontWeight: 500
            }}
            className="privacy-badge"
            title="All URL encoding, tracking stripping, and QR rendering execute purely in your browser."
          >
            <ShieldCheck size={14} strokeWidth={2} />
            <span>100% Client-Side</span>
          </div>

          {/* Keyboard Hint (Desktop) */}
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)'
            }}
            className="keyboard-hint"
            title="Press Cmd/Ctrl+K to focus input, Cmd/Ctrl+C to copy short link"
          >
            {isMac ? '⌘K' : 'Ctrl+K'}
          </span>

          {/* Local History Toggle */}
          <button
            onClick={onOpenHistory}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: 'var(--text-xs)' }}
            aria-label={`Open link history (${historyCount} saved)`}
            title="Local Link History"
          >
            <History size={14} strokeWidth={1.75} />
            <span>History</span>
            {historyCount > 0 && (
              <span
                style={{
                  padding: '1px 5px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                  fontWeight: 600,
                  fontSize: '11px'
                }}
              >
                {historyCount}
              </span>
            )}
          </button>

          {/* Theme Mode Toggle */}
          <button
            onClick={onThemeToggle}
            className="btn btn-ghost"
            style={{ padding: '8px', minHeight: 34 }}
            aria-label={`Toggle theme (currently ${theme})`}
            title={`Theme: ${theme}`}
          >
            {theme === 'light' && <Sun size={16} strokeWidth={1.75} />}
            {theme === 'dark' && <Moon size={16} strokeWidth={1.75} />}
            {theme === 'system' && <Laptop size={16} strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .privacy-badge, .keyboard-hint {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;
