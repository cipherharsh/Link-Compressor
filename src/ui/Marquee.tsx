/*
 * PURPOSE: Infinite horizontal looping ticker displaying community reviews and feedback cards.
 * INPUTS: Sample feedback cards, hover pause state, prefers-reduced-motion media query.
 * OUTPUTS: Seamlessly scrolling marquee row pausing on hover and conforming to accessibility guidelines.
 * DEPENDS_ON: React, tokens.css.
 * WHY_THIS_DESIGN: CSS-driven keyframe animation allows GPU-accelerated looping with zero JS overhead.
 */

import React, { useState } from 'react';

interface MarqueeCard {
  id: string;
  name: string;
  role: string;
  quote: string;
  avatar: string;
}

const SAMPLE_FEEDBACK: MarqueeCard[] = [
  {
    id: '1',
    name: 'Alex Rivera',
    role: 'Frontend Architect',
    quote: 'Zero backend URL compression in pure client JS is sorcery. The 3D collapse effect is breathtaking.',
    avatar: '👨‍💻'
  },
  {
    id: '2',
    name: 'Elena Rostova',
    role: 'Creative Technologist',
    quote: 'Phone scanning works on 100% of our test devices even in direct sunlight. Flatten QR mode is genius.',
    avatar: '👩‍🔬'
  },
  {
    id: '3',
    name: 'Marcus Chen',
    role: 'DevRel Engineer',
    quote: 'We embedded LinkZip links across our slide decks. 30% smaller QR codes mean instant crowd scans.',
    avatar: '⚡'
  },
  {
    id: '4',
    name: 'Sarah Lindqvist',
    role: 'Game Developer',
    quote: 'The gamified XP and streak HUD turned an everyday dev utility into an addictive daily habit.',
    avatar: '🎮'
  }
];

export const Marquee: React.FC = () => {
  const [isPaused, setIsPaused] = useState(false);

  // Duplicate cards for seamless loop
  const cards = [...SAMPLE_FEEDBACK, ...SAMPLE_FEEDBACK];

  return (
    <div
      style={{
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
        padding: '32px 0 64px 0'
      }}
      aria-label="Community reviews marquee"
    >
      {/* Notice header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}
        >
          Community Voices • (Sample content)
        </span>
      </div>

      {/* Infinite loop track */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{
          display: 'flex',
          gap: '24px',
          width: 'max-content',
          animation: 'marqueeLoop 36s linear infinite',
          animationPlayState: isPaused ? 'paused' : 'running'
        }}
      >
        {cards.map((c, i) => (
          <div
            key={`${c.id}-${i}`}
            style={{
              width: '340px',
              background: 'var(--color-surface-glass)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-card)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-small)',
                color: 'var(--color-text)',
                lineHeight: 1.55,
                marginBottom: '20px'
              }}
            >
              "{c.quote}"
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem'
                }}
              >
                {c.avatar}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-small)', color: 'var(--color-text)' }}>
                  {c.name}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-muted)' }}>
                  {c.role} • <span style={{ color: 'var(--color-xp)' }}>Sample content</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes marqueeLoop {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="animation: marqueeLoop"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Marquee;
