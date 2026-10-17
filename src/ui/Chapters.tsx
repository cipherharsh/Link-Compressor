/*
 * PURPOSE: Scroll narrative container orchestrating Lenis smooth scroll, chapters, and stage cards.
 * INPUTS: Window scroll events, virtual container height (500vh), scrollProgress from sceneStore.
 * OUTPUTS: Normalized scroll progress (0.0 to 1.0) and responsive DOM narrative chapters.
 * DEPENDS_ON: React, Lenis, sceneStore.ts, Hero.tsx, tokens.css.
 * WHY_THIS_DESIGN: Virtual scroll drives full-bleed 3D choreography while keeping DOM sections accessible.
 */

import React, { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { useSceneStore } from '../state/sceneStore';
import Hero from './Hero';

interface ChaptersProps {
  childrenChapter3?: React.ReactNode;
  childrenChapter4?: React.ReactNode;
}

export const Chapters: React.FC<ChaptersProps> = ({
  childrenChapter3,
  childrenChapter4
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollProgress = useSceneStore((s) => s.scrollProgress);
  const setScrollProgress = useSceneStore((s) => s.setScrollProgress);

  useEffect(() => {
    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const lenis = new Lenis({
      duration: prefersReducedMotion ? 0.01 : 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !prefersReducedMotion
    });

    function onScroll() {
      if (!containerRef.current) return;
      const totalScroll = containerRef.current.scrollHeight - window.innerHeight;
      if (totalScroll <= 0) return;
      const progress = Math.max(0, Math.min(1, window.scrollY / totalScroll));
      setScrollProgress(progress);
    }

    lenis.on('scroll', onScroll);

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Fallback native listener
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      window.removeEventListener('scroll', onScroll);
    };
  }, [setScrollProgress]);

  const scrollToSection = (targetYRatio: number) => {
    if (!containerRef.current) return;
    const totalScroll = containerRef.current.scrollHeight - window.innerHeight;
    window.scrollTo({
      top: totalScroll * targetYRatio,
      behavior: 'smooth'
    });
  };

  // Chapter 2 Stage Card Highlight States
  // 0.2 to 0.55 range divided into 4 intervals
  const stageIndex = Math.min(
    3,
    Math.max(0, Math.floor(((scrollProgress - 0.2) / 0.35) * 4))
  );
  const isChapter2Active = scrollProgress >= 0.18 && scrollProgress < 0.55;

  const PIPELINE_STAGES = [
    {
      step: '01',
      title: 'Strip Boilerplate',
      desc: 'Eliminates http/https schemes, www prefixes, and index.html into single flag bits.',
      savings: '~15 bytes'
    },
    {
      step: '02',
      title: 'Dictionary & TLD Match',
      desc: '500+ top second-level domains and 1500+ TLDs compressed via precomputed Huffman codes.',
      savings: '~60% domain size'
    },
    {
      step: '03',
      title: 'Entropy Packing',
      desc: 'Path segments fit into the smallest matching subalphabet (numbers, lowercase, or base64url).',
      savings: 'Up to 3 bits/char'
    },
    {
      step: '04',
      title: 'QR Alphanumeric Serializer',
      desc: 'Generates ISO/IEC 18004 alphanumeric codes for 30% denser, phone-scannable QR codes.',
      savings: '1-2 QR versions lower'
    }
  ];

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', minHeight: '500vh' }}>
      {/* Chapter 1: Overview */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <Hero onScrollExplore={() => scrollToSection(0.25)} />
      </div>

      {/* Chapter 2: Compress / Pipeline */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '80px 24px',
          position: 'relative',
          zIndex: 10
        }}
      >
        <div style={{ maxWidth: '840px', width: '100%', textAlign: 'center' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '12px'
            }}
          >
            The Four-Stage Compression Engine
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-h1)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              marginBottom: '20px'
            }}
          >
            Watch URLs dissolve into tree leaves.
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              color: 'var(--color-muted)',
              fontSize: 'var(--text-body)',
              maxWidth: '620px',
              margin: '0 auto 48px auto',
              lineHeight: 1.6
            }}
          >
            Unlike traditional link shorteners that depend on centralized SQL tables, LinkZip relies purely on mathematics and reversible bitstream serialization.
          </p>

          {/* 4 Sequential Stage Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
              textAlign: 'left'
            }}
          >
            {PIPELINE_STAGES.map((st, i) => {
              const isCurrent = isChapter2Active && stageIndex === i;
              return (
                <div
                  key={st.step}
                  style={{
                    background: isCurrent ? 'var(--color-surface-hover)' : 'var(--color-surface-glass)',
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${isCurrent ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-card)',
                    padding: '24px',
                    transition: 'all 0.3s ease',
                    boxShadow: isCurrent ? '0 8px 32px rgba(108, 242, 194, 0.15)' : 'none',
                    transform: isCurrent ? 'translateY(-4px)' : 'none'
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      color: isCurrent ? 'var(--color-accent)' : 'var(--color-muted)',
                      marginBottom: '8px'
                    }}
                  >
                    STAGE {st.step}
                  </div>
                  <h4
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      marginBottom: '8px',
                      color: 'var(--color-text)'
                    }}
                  >
                    {st.title}
                  </h4>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 'var(--text-small)',
                      color: 'var(--color-muted)',
                      marginBottom: '16px',
                      lineHeight: 1.45
                    }}
                  >
                    {st.desc}
                  </p>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: isCurrent ? 'var(--color-accent-2)' : 'var(--color-muted)',
                      borderTop: '1px solid var(--color-border)',
                      paddingTop: '10px'
                    }}
                  >
                    Expected saving: {st.savings}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Chapter 3: Play / Playground Container */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '80px 24px',
          position: 'relative',
          zIndex: 10
        }}
      >
        {childrenChapter3}
      </section>

      {/* Chapter 4: Join Container */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '80px 24px 120px 24px',
          position: 'relative',
          zIndex: 10
        }}
      >
        {childrenChapter4}
      </section>
    </div>
  );
};

export default Chapters;
