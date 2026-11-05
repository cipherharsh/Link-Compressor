import React from 'react';
import { useGameStore, type Achievement } from '../state/gameStore';

const BADGE_ICONS: Record<string, string> = {
  first_squeeze: '⚡',
  half_size: '✂️',
  tiny_titan: '💎',
  streak_7: '🔥',
  decoder: '🔄',
  scanner: '📷',
};

const Achievements: React.FC = () => {
  const achievements = useGameStore((s) => s.achievements);

  return (
    <div className="achievements" role="list" aria-label="Achievements">
      {achievements.map((a: Achievement) => {
        const isUnlocked = a.unlockedAt !== null;
        return (
          <div
            key={a.id}
            role="listitem"
            className={`achievement${isUnlocked ? ' is-unlocked' : ''}`}
            title={`${a.name}: ${a.description} ${isUnlocked ? '✓ (Unlocked)' : '🔒'}`}
          >
            <span aria-hidden="true">{BADGE_ICONS[a.id] ?? '🏆'}</span>
            <span>{a.name}</span>
          </div>
        );
      })}
    </div>
  );
};

export default Achievements;
