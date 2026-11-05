import React, { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { useSceneStore } from '../state/sceneStore';
import Hero from './Hero';

interface ChaptersProps {
  childrenChapter3?: React.ReactNode;
  childrenChapter4?: React.ReactNode;
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
    desc: 'Generates ISO/IEC 18004 alphanumeric codes for 30% denser, phone-scannable QR codes.',
    savings: '1-2 QR versions lower',
  },
];

const Chapters: React.FC<ChaptersProps> = ({ childrenChapter3, childrenChapter4 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollProgress = useSceneStore((s) => s.scrollProgress);
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

  // Chapter 2 highlights one of the four stage cards based on scroll depth (0.2–0.55).
  const stageIndex = Math.min(3, Math.max(0, Math.floor(((scrollProgress - 0.2) / 0.35) * 4)));
  const isChapter2Active = scrollProgress >= 0.18 && scrollProgress < 0.55;

  return (
    <div ref={containerRef} className="chapters">
      <div className="chapter-hero-wrap">
        <Hero onScrollExplore={() => scrollToSection(containerRef.current, 0.25)} />
      </div>

      {/* Chapter 2: the compression pipeline */}
      <section id="pipeline" className="chapter">
        <div className="chapter-inner chapter-inner--pipeline">
          <div className="eyebrow">The Four-Stage Compression Engine</div>
          <h2 className="section-title">Watch URLs dissolve into tree leaves.</h2>
          <p className="section-lead">
            Unlike traditional link shorteners that depend on centralized SQL tables, LinkZip relies
            purely on mathematics and reversible bitstream serialization.
          </p>

          <div className="pipeline-grid">
            {PIPELINE_STAGES.map((stage, i) => {
              const isCurrent = isChapter2Active && stageIndex === i;
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

      {/* Chapter 3: interactive playground */}
      <section className="chapter">{childrenChapter3}</section>

      {/* Chapter 4: stats, reviews, FAQ, footer */}
      <section className="chapter chapter--last">{childrenChapter4}</section>
    </div>
  );
};

/** Smooth-scrolls to a fraction (0–1) of the narrative container's scrollable height. */
function scrollToSection(container: HTMLDivElement | null, targetYRatio: number) {
  if (!container) return;
  const totalScroll = container.scrollHeight - window.innerHeight;
  window.scrollTo({ top: totalScroll * targetYRatio, behavior: 'smooth' });
}

export default Chapters;
