/*
 * PURPOSE: Real-time ticking activity strip and non-blocking toast notifications for live compressions.
 * INPUTS: liveFeed events (stats updates, throttled compression activities).
 * OUTPUTS: Ticking "Live" counter and anonymized activity toasts (e.g., "Someone saved 62%").
 * DEPENDS_ON: React, liveFeed.ts, tokens.css.
 * WHY_THIS_DESIGN: Rate-limited toasts (max 1 per 6s) and URL anonymization ensure privacy and comfort.
 */

import React, { useEffect, useState } from 'react';
import { liveFeed, type LiveActivityEvent } from '../api/liveFeed';

export const LiveCounterStrip: React.FC = () => {
  const [totalLinks, setTotalLinks] = useState(12480);
  const [currentToast, setCurrentToast] = useState<LiveActivityEvent | null>(null);

  useEffect(() => {
    liveFeed.start();

    const unsubStats = liveFeed.onStats((stats) => {
      setTotalLinks(stats.totalLinks);
    });

    const unsubActivity = liveFeed.onActivity((act) => {
      setCurrentToast(act);
      const timer = setTimeout(() => {
        setCurrentToast((prev) => (prev?.id === act.id ? null : prev));
      }, 4500);
      return () => clearTimeout(timer);
    });

    return () => {
      unsubStats();
      unsubActivity();
      liveFeed.stop();
    };
  }, []);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        position: 'relative'
      }}
    >
      {/* Ticking Live Counter Pill */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(20, 24, 33, 0.85)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-pill)',
          padding: '4px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-muted)'
        }}
      >
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--color-accent)',
            boxShadow: '0 0 8px var(--color-accent)',
            animation: 'pulse 1.8s infinite ease-in-out'
          }}
        />
        <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>LIVE</span>
        <span>{totalLinks.toLocaleString()} links processed</span>
      </div>

      {/* Anonymized Floating Activity Toast */}
      {currentToast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 'var(--z-toast)' as unknown as number,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-accent)',
            borderRadius: 'var(--radius-pill)',
            padding: '8px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
            animation: 'slideUp 0.35s cubic-bezier(0.215, 0.61, 0.355, 1)'
          }}
        >
          <span>⚡</span>
          <span>
            Someone saved <strong>{currentToast.ratioPercent}%</strong> ({currentToast.bytesSaved} bytes)!
          </span>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default LiveCounterStrip;
