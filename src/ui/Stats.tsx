import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../state/gameStore';

/** Linearly eases a counter from 0 to `target` over `duration` ms, writing each frame via `setter`. */
function countUp(target: number, duration: number, setter: (v: number) => void) {
  const start = performance.now();
  const step = (now: number) => {
    const progress = Math.min(1, (now - start) / duration);
    const ease = 1 - Math.pow(1 - progress, 3);
    setter(ease * target);
    if (progress < 1) requestAnimationFrame(step);
    else setter(target);
  };
  requestAnimationFrame(step);
}

const Stats: React.FC = () => {
  const totalCompressions = useGameStore((s) => s.totalCompressions);
  const totalBytesSaved = useGameStore((s) => s.totalBytesSaved);
  const totalOriginalChars = useGameStore((s) => s.totalOriginalChars);

  const avgRatio = totalOriginalChars > 0 ? totalBytesSaved / totalOriginalChars : 0;

  const [displayLinks, setDisplayLinks] = useState(0);
  const [displayBytes, setDisplayBytes] = useState(0);
  const [displayRatio, setDisplayRatio] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Count up once the section scrolls into view.
  useEffect(() => {
    if (hasAnimated) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        setHasAnimated(true);
        countUp(totalCompressions, 1200, setDisplayLinks);
        countUp(totalBytesSaved, 1200, setDisplayBytes);
        countUp(avgRatio * 100, 1200, setDisplayRatio);
      },
      { threshold: 0.2 },
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [hasAnimated, totalCompressions, totalBytesSaved, avgRatio]);

  // Keep the numbers live if the viewer compresses more while the section is visible.
  useEffect(() => {
    if (!hasAnimated) return;
    setDisplayLinks(totalCompressions);
    setDisplayBytes(totalBytesSaved);
    setDisplayRatio(avgRatio * 100);
  }, [hasAnimated, totalCompressions, totalBytesSaved, avgRatio]);

  return (
    <div id="stats" ref={containerRef} className="stats">
      <div className="faq__head">
        <div className="eyebrow">Your LinkZip Activity</div>
        <h3 className="faq__title">Real numbers from this browser.</h3>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__value accent">{Math.round(displayLinks).toLocaleString()}</div>
          <div className="stat-card__label">Links You've Compressed</div>
        </div>

        <div className="stat-card">
          <div className="stat-card__value accent2">{Math.round(displayBytes).toLocaleString()}</div>
          <div className="stat-card__label">Characters Saved</div>
        </div>

        <div className="stat-card">
          <div className="stat-card__value xp">{Math.round(displayRatio)}%</div>
          <div className="stat-card__label">Average Compression Ratio</div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
