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
    avatar: '👨‍💻',
  },
  {
    id: '2',
    name: 'Elena Rostova',
    role: 'Creative Technologist',
    quote: 'Phone scanning works on 100% of our test devices even in direct sunlight. Flatten QR mode is genius.',
    avatar: '👩‍🔬',
  },
  {
    id: '3',
    name: 'Marcus Chen',
    role: 'DevRel Engineer',
    quote: 'We embedded LinkZip links across our slide decks. 30% smaller QR codes mean instant crowd scans.',
    avatar: '⚡',
  },
  {
    id: '4',
    name: 'Sarah Lindqvist',
    role: 'Game Developer',
    quote: 'The gamified XP and streak HUD turned an everyday dev utility into an addictive daily habit.',
    avatar: '🎮',
  },
];

export const Marquee: React.FC = () => {
  const [isPaused, setIsPaused] = useState(false);

  // Duplicate the cards so the loop appears seamless.
  const cards = [...SAMPLE_FEEDBACK, ...SAMPLE_FEEDBACK];

  return (
    <div className="marquee" aria-label="Community reviews marquee">
      <div className="marquee__head">
        <span className="marquee__eyebrow">Community Voices • (Sample content)</span>
      </div>

      <div
        className={`marquee__track${isPaused ? ' is-paused' : ''}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {cards.map((card, i) => (
          <div key={`${card.id}-${i}`} className="marquee-card">
            <p className="marquee-card__quote">"{card.quote}"</p>

            <div className="marquee-card__person">
              <div className="marquee-card__avatar" aria-hidden="true">{card.avatar}</div>
              <div>
                <div className="marquee-card__name">{card.name}</div>
                <div className="marquee-card__role">
                  {card.role} • <span className="sample">Sample content</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
