import React from 'react';
import { useGameStore } from '../state/gameStore';

/** Compact header pill showing how many links have actually been compressed in this browser. */
const LiveCounterStrip: React.FC = () => {
  const total = useGameStore((s) => s.totalCompressions);

  return (
    <div className="live-strip">
      <div className="live-pill">
        <span className="live-pill__dot" aria-hidden="true" />
        <span>
          {total.toLocaleString()} {total === 1 ? 'link' : 'links'} compressed here
        </span>
      </div>
    </div>
  );
};

export default LiveCounterStrip;
