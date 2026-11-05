import React, { useEffect, useState } from 'react';
import { liveFeed, type LiveActivityEvent } from '../api/liveFeed';

const LiveCounterStrip: React.FC = () => {
  const [totalLinks, setTotalLinks] = useState(12480);
  const [currentToast, setCurrentToast] = useState<LiveActivityEvent | null>(null);

  useEffect(() => {
    liveFeed.start();

    const unsubStats = liveFeed.onStats((stats) => setTotalLinks(stats.totalLinks));

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
    <div className="live-strip">
      <div className="live-pill">
        <span className="live-pill__dot" aria-hidden="true" />
        <span className="live-pill__label">LIVE</span>
        <span>{totalLinks.toLocaleString()} links processed</span>
      </div>

      {currentToast && (
        <div className="live-toast" role="status" aria-live="polite">
          <span aria-hidden="true">⚡</span>
          <span>
            Someone saved <strong>{currentToast.ratioPercent}%</strong> ({currentToast.bytesSaved} bytes)!
          </span>
        </div>
      )}
    </div>
  );
};

export default LiveCounterStrip;
