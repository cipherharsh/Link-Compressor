import React, { useEffect, useState, useRef } from 'react';
import { api, type StatsResponse } from '../api/adapter';

const Stats: React.FC = () => {
  const [stats, setStats] = useState<StatsResponse>({
    totalLinks: 12480,
    totalBytesSaved: 489200,
    avgRatio: 0.58,
  });

  const [displayLinks, setDisplayLinks] = useState(0);
  const [displayBytes, setDisplayBytes] = useState(0);
  const [displayRatio, setDisplayRatio] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    api.getStats().then(setStats).catch(() => {});
  }, []);

  // Count up once the section scrolls into view.
  useEffect(() => {
    if (hasAnimated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        setHasAnimated(true);

        const duration = 1200;
        const startTime = performance.now();

        const step = (now: number) => {
          const progress = Math.min(1, (now - startTime) / duration);
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
        };

        requestAnimationFrame(step);
      },
      { threshold: 0.2 },
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [hasAnimated, stats]);

  return (
    <div id="stats" ref={containerRef} className="stats">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__value accent">{displayLinks.toLocaleString()}+</div>
          <div className="stat-card__label">Links Compressed</div>
        </div>

        <div className="stat-card">
          <div className="stat-card__value accent2">{Math.floor(displayBytes / 1024).toLocaleString()} KB</div>
          <div className="stat-card__label">Total Bandwidth Saved</div>
        </div>

        <div className="stat-card">
          <div className="stat-card__value xp">{displayRatio}%</div>
          <div className="stat-card__label">Average Compression Ratio</div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
