/*
 * PURPOSE: Hero section with oversized editorial typography, rotating feature cards, and scroll cue.
 * INPUTS: Auto-rotation timer (4s), user hover state, scroll trigger handler.
 * OUTPUTS: Interactive hero view with rotating cards (Compress, Decode, Play) and scroll cue.
 * DEPENDS_ON: React, tokens.css, sceneStore.ts.
 * WHY_THIS_DESIGN: Editorial oversized typography and rotating cards provide studio-grade aesthetic without bloat.
 */

import React, { useState, useEffect } from 'react';

interface HeroCard {
  id: string;
  title: string;
  pitch: string;
  cta: string;
  icon: string;
  accent: string;
}

const HERO_CARDS: HeroCard[] = [
  {
    id: 'compress',
    title: 'Zero-Server Compression',
    pitch: 'Pack domains, Huffman dictionaries, and URL boilerplate into micro payloads client-side.',
    cta: 'Explore Engine',
    icon: '⚡',
    accent: 'var(--color-accent)'
  },
  {
    id: 'qr',
    title: 'Voxel QR Optimization',
    pitch: 'Alphanumeric QR encoding generates 30% more efficient matrices for instant camera scanning.',
    cta: 'Scan Ready',
    icon: '📱',
    accent: 'var(--color-accent-2)'
  },
  {
    id: 'gamified',
    title: 'Gamified Dev Experience',
    pitch: 'Earn XP, unlock voxel themes, maintain streaks, and climb the LinkZip leaderboard.',
    cta: 'Play & Earn',
    icon: '🏆',
    accent: 'var(--color-xp)'
  }
];

export const Hero: React.FC<{ onScrollExplore?: () => void }> = ({ onScrollExplore }) => {
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-rotate hero cards every 4 seconds, pausing when hovered
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveCardIndex((prev) => (prev + 1) % HERO_CARDS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovered]);

  const activeCard = HERO_CARDS[activeCardIndex];

  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '100px 16px 40px 16px',
        textAlign: 'center',
        position: 'relative'
      }}
    >
      {/* Editorial Headline */}
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-display)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 0.98,
            marginBottom: '28px',
            color: 'var(--color-text)'
          }}
        >
          Compress links into living 3D voxels.
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(1.1rem, 2.2vw, 1.35rem)',
            color: 'var(--color-muted)',
            maxWidth: '680px',
            margin: '0 auto 48px auto',
            lineHeight: 1.6
          }}
        >
          Zero backend. Zero database. Watch chaotic URL strands fold into high-density, phone-scannable QR voxels in under 2 seconds.
        </p>
      </div>

      {/* Rotating Hero Cards */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--color-surface-glass)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          padding: '20px 20px',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)',
          marginBottom: '36px',
          textAlign: 'left',
          transition: 'border-color 0.3s ease, transform 0.2s ease',
          borderColor: isHovered ? activeCard.accent : 'var(--color-border)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ fontSize: '1.8rem' }}>{activeCard.icon}</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {HERO_CARDS.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setActiveCardIndex(i)}
                aria-label={`Show ${c.title}`}
                style={{
                  width: i === activeCardIndex ? '20px' : '6px',
                  height: '6px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: i === activeCardIndex ? activeCard.accent : 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>

        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-h3)',
            fontWeight: 700,
            color: 'var(--color-text)',
            marginBottom: '8px'
          }}
        >
          {activeCard.title}
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-small)',
            color: 'var(--color-muted)',
            marginBottom: '18px',
            lineHeight: 1.5
          }}
        >
          {activeCard.pitch}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: activeCard.accent,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            {activeCard.cta} →
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-muted)'
            }}
          >
            {isHovered ? 'Paused' : 'Auto-rotating'}
          </span>
        </div>
      </div>

      {/* Scroll to Explore Cue */}
      <button
        onClick={onScrollExplore}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-muted)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase'
        }}
      >
        <span>Scroll to Explore</span>
        <span
          style={{
            animation: 'bounce 2s infinite ease-in-out',
            fontSize: '1.2rem',
            color: 'var(--color-accent)'
          }}
        >
          ↓
        </span>
      </button>
    </section>
  );
};

export default Hero;
