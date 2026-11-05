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
    accent: 'var(--color-accent)',
  },
  {
    id: 'qr',
    title: 'Voxel QR Optimization',
    pitch: 'Alphanumeric QR encoding generates 30% more efficient matrices for instant camera scanning.',
    cta: 'Scan Ready',
    icon: '📱',
    accent: 'var(--color-accent-2)',
  },
  {
    id: 'gamified',
    title: 'Gamified Dev Experience',
    pitch: 'Earn XP, keep a daily streak, and collect achievements as you compress.',
    cta: 'Play & Earn',
    icon: '🏆',
    accent: 'var(--color-xp)',
  },
];

const Hero: React.FC<{ onScrollExplore?: () => void }> = ({ onScrollExplore }) => {
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-rotate the feature cards every 4s, pausing while hovered.
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveCardIndex((prev) => (prev + 1) % HERO_CARDS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovered]);

  const activeCard = HERO_CARDS[activeCardIndex];

  return (
    <section className="hero">
      <div className="hero__head">
        <h1 className="hero__title">Compress links into living 3D voxels.</h1>
        <p className="hero__lead">
          Zero backend. Zero database. Watch chaotic URL strands fold into high-density,
          phone-scannable QR voxels in under 2 seconds.
        </p>
      </div>

      <div
        className="hero-card"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ borderColor: isHovered ? activeCard.accent : undefined }}
      >
        <div className="hero-card__top">
          <span className="hero-card__icon">{activeCard.icon}</span>
          <div className="hero-card__dots">
            {HERO_CARDS.map((card, i) => (
              <button
                key={card.id}
                className={`hero-dot${i === activeCardIndex ? ' is-active' : ''}`}
                onClick={() => setActiveCardIndex(i)}
                aria-label={`Show ${card.title}`}
                style={{ backgroundColor: i === activeCardIndex ? activeCard.accent : undefined }}
              />
            ))}
          </div>
        </div>

        <h3 className="hero-card__title">{activeCard.title}</h3>
        <p className="hero-card__pitch">{activeCard.pitch}</p>

        <div className="hero-card__foot">
          <span className="hero-card__cta" style={{ color: activeCard.accent }}>
            {activeCard.cta} →
          </span>
          <span className="hero-card__state">{isHovered ? 'Paused' : 'Auto-rotating'}</span>
        </div>
      </div>

      <button className="scroll-cue" onClick={onScrollExplore}>
        <span>Scroll to Explore</span>
        <span className="scroll-cue__arrow">↓</span>
      </button>
    </section>
  );
};

export default Hero;
