/*
 * PURPOSE: Animated stat counters fetching live or local statistics and counting up over 1.2s.
 * INPUTS: api.getStats() response (totalLinks, totalBytesSaved, avgRatio).
 * OUTPUTS: High-visibility editorial metrics counters with smooth numeric interpolation.
 * DEPENDS_ON: React, adapter.ts, tokens.css.
 * WHY_THIS_DESIGN: Numeric count-up creates dynamic engagement while honoring Sandra-style typography.
 */

import React, { useEffect, useState, useRef } from 'react';
import { api, type StatsResponse } from '../api/adapter';

export const Stats: React.FC = () => {
  const [stats, setStats] = useState<StatsResponse>({
    totalLinks: 12480,
    totalBytesSaved: 489200,
    avgRatio: 0.58
  });

  const [displayLinks, setDisplayLinks] = useState(0);
  const [displayBytes, setDisplayBytes] = useState(0);
  const [displayRatio, setDisplayRatio] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    api.getStats().then((data) => setStats(data)).catch(() => {});
  }, []);

  // IntersectionObserver triggers count-up when scrolled into view
  useEffect(() => {
    if (hasAnimated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasAnimated(true);

          const duration = 1200; // 1.2s duration
          const startTime = performance.now();

          function step(now: number) {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);

            setDisplayLinks(Math.floor(ease * stats.totalLinks));
            setDisplayBytes(Math.floor(ease * stats.totalBytesSaved));
            setDisplayRatio(Math.floor(ease * stats.avgRatio * 100));

            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              setDisplayLinks(stats.totalLinks);
              setDisplayBytes(stats.totalBytesSaved);
              setDisplayRatio(Math.round(stats.avgRatio * 100));
            }
          }

          requestAnimationFrame(step);
        }
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated, stats]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        maxWidth: '960px',
        margin: '0 auto 64px auto',
        padding: '0 20px'
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
          textAlign: 'center'
        }}
      >
        {/* Metric 1 */}
        <div
          style={{
            background: 'var(--color-surface-glass)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-card)',
            padding: '36px 24px'
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.5rem, 6vw, 4rem)',
              fontWeight: 700,
              color: 'var(--color-accent)',
              letterSpacing: '-0.03em',
              marginBottom: '8px',
              lineHeight: 1
            }}
          >
            {displayLinks.toLocaleString()}+
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-small)', color: 'var(--color-muted)', textTransform: 'uppercase' }}>
            Links Compressed
          </div>
        </div>

        {/* Metric 2 */}
        <div
          style={{
            background: 'var(--color-surface-glass)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-card)',
            padding: '36px 24px'
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.5rem, 6vw, 4rem)',
              fontWeight: 700,
              color: 'var(--color-accent-2)',
              letterSpacing: '-0.03em',
              marginBottom: '8px',
              lineHeight: 1
            }}
          >
            {Math.floor(displayBytes / 1024).toLocaleString()} KB
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-small)', color: 'var(--color-muted)', textTransform: 'uppercase' }}>
            Total Bandwidth Saved
          </div>
        </div>

        {/* Metric 3 */}
        <div
          style={{
            background: 'var(--color-surface-glass)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-card)',
            padding: '36px 24px'
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.5rem, 6vw, 4rem)',
              fontWeight: 700,
              color: 'var(--color-xp)',
              letterSpacing: '-0.03em',
              marginBottom: '8px',
              lineHeight: 1
            }}
          >
            {displayRatio}%
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-small)', color: 'var(--color-muted)', textTransform: 'uppercase' }}>
            Average Compression Ratio
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
