import React, { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { useSceneStore } from '../state/sceneStore';
import Hero from './Hero';

interface ChaptersProps {
  /** The compressor panel, shown as the dedicated first section. */
  compressor?: React.ReactNode;
  /** The closing group (stats, reviews, FAQ, footer). */
  join?: React.ReactNode;
}

const PIPELINE_STAGES = [
  {
    step: '01',
    title: 'Strip Boilerplate',
    desc: 'Eliminates http/https schemes, www prefixes, and index.html into single flag bits.',
    savings: '~15 bytes',
  },
  {
    step: '02',
    title: 'Dictionary & TLD Match',
    desc: '500+ top second-level domains and 1500+ TLDs compressed via precomputed Huffman codes.',
    savings: '~60% domain size',
  },
  {
    step: '03',
    title: 'Entropy Packing',
    desc: 'Path segments fit into the smallest matching subalphabet (numbers, lowercase, or base64url).',
    savings: 'Up to 3 bits/char',
  },
  {
    step: '04',
    title: 'QR Alphanumeric Serializer',
    desc: 'Writes the QR link in ISO/IEC 18004 alphanumeric mode, which packs 5.5 bits per character instead of 8.',
    savings: 'Often 1 QR version smaller',
  },
];

const Chapters: React.FC<ChaptersProps> = ({ compressor, join }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollProgress = useSceneStore((s) => s.scrollProgress);
  const currentChapter = useSceneStore((s) => s.currentChapter);
  const setScrollProgress = useSceneStore((s) => s.setScrollProgress);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const lenis = new Lenis({
      duration: prefersReducedMotion ? 0.01 : 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !prefersReducedMotion,
    });

    const onScroll = () => {
      if (!containerRef.current) return;
      const totalScroll = containerRef.current.scrollHeight - window.innerHeight;
      if (totalScroll <= 0) return;
      setScrollProgress(Math.max(0, Math.min(1, window.scrollY / totalScroll)));
    };

    lenis.on('scroll', onScroll);

    let rafId = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    });

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      window.removeEventListener('scroll', onScroll);
    };
  }, [setScrollProgress]);

  // The pipeline is the third section; highlight one of its four cards by scroll depth.
  const isPipelineActive = currentChapter === 3;
  const stageIndex = Math.min(3, Math.max(0, Math.floor(((scrollProgress - 0.55) / 0.3) * 4)));

  return (
    <div ref={containerRef} className="chapters">
      {/* 1. Compressor — the dedicated opening section */}
      <section className="chapter">{compressor}</section>

      {/* 2. Hero narrative */}
      <div className="chapter-hero-wrap">
        <Hero />
      </div>

      {/* 3. The compression pipeline */}
      <section id="pipeline" className="chapter">
        <div className="chapter-inner chapter-inner--pipeline">
          <div className="eyebrow">The Four-Stage Compression Engine</div>
          <h2 className="section-title">From long URL to tiny code in four steps.</h2>
          <p className="section-lead">
            Unlike traditional link shorteners that depend on centralized SQL tables, LinkZip relies
            purely on mathematics and reversible bitstream serialization.
          </p>

          <div className="pipeline-grid">
            {PIPELINE_STAGES.map((stage, i) => {
              const isCurrent = isPipelineActive && stageIndex === i;
              return (
                <div
                  key={stage.step}
                  className={`pipeline-card${isCurrent ? ' pipeline-card--active' : ''}`}
                >
                  <div className="pipeline-card__step">STAGE {stage.step}</div>
                  <h4 className="pipeline-card__title">{stage.title}</h4>
                  <p className="pipeline-card__desc">{stage.desc}</p>
                  <div className="pipeline-card__saving">Expected saving: {stage.savings}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Stats, reviews, FAQ, footer */}
      <section className="chapter chapter--last">{join}</section>
    </div>
  );
};

export default Chapters;
