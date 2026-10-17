/*
 * PURPOSE: Interactive visual strip of player achievements with unlock states and tooltips.
 * INPUTS: Achievement list from gameStore (id, name, description, unlockedAt).
 * OUTPUTS: Compact glowing badges for unlocked achievements and muted indicators for locked ones.
 * DEPENDS_ON: React, gameStore.ts, tokens.css.
 * WHY_THIS_DESIGN: Immediate visual feedback reinforces dev mastery and gamification progression.
 */

import React from 'react';
import { useGameStore, type Achievement } from '../state/gameStore';

export const Achievements: React.FC = () => {
  const achievements = useGameStore((s) => s.achievements);

  const getBadgeIcon = (id: string) => {
    switch (id) {
      case 'first_squeeze': return '⚡';
      case 'half_size': return '✂️';
      case 'tiny_titan': return '💎';
      case 'streak_7': return '🔥';
      case 'decoder': return '🔄';
      case 'scanner': return '📷';
      default: return '🏆';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        alignItems: 'center'
      }}
      role="list"
      aria-label="Achievements"
    >
      {achievements.map((a: Achievement) => {
        const isUnlocked = a.unlockedAt !== null;
        return (
          <div
            key={a.id}
            role="listitem"
            title={`${a.name}: ${a.description} ${isUnlocked ? '✓ (Unlocked)' : '🔒'}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-pill)',
              background: isUnlocked ? 'rgba(108, 242, 194, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${isUnlocked ? 'var(--color-accent)' : 'var(--color-border)'}`,
              color: isUnlocked ? 'var(--color-text)' : 'var(--color-muted)',
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-mono)',
              opacity: isUnlocked ? 1 : 0.5,
              transition: 'all 0.3s ease',
              boxShadow: isUnlocked ? '0 0 10px rgba(108, 242, 194, 0.2)' : 'none'
            }}
          >
            <span>{getBadgeIcon(a.id)}</span>
            <span>{a.name}</span>
          </div>
        );
      })}
    </div>
  );
};

export default Achievements;
