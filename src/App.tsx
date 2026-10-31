/*
 * PURPOSE: Root application component hosting the pinned canvas background and scroll overlay layers.
 * INPUTS: Global state from gameStore, sceneStore, and api adapter.
 * OUTPUTS: Rendered interactive view with HUD, staged chapters, and canvas container.
 * DEPENDS_ON: React, gameStore, sceneStore, adapter, tokens.css.
 * WHY_THIS_DESIGN: Pinned full-screen viewport structure decouples 3D WebGL rendering from DOM accessibility.
 */

import React, { useEffect, useState } from 'react';
import './styles/tokens.css';
import { useSceneStore } from './state/sceneStore';
import { subscribeApiState, type ApiState } from './api/adapter';
import { localDecompress } from './engine/localCompress';
import Loader from './ui/Loader';
import Fallback2D from './ui/Fallback2D';
import Scene from './scene/Scene';
import Chapters from './ui/Chapters';
import Hud from './ui/Hud';
import Playground from './ui/Playground';
import Stats from './ui/Stats';
import Marquee from './ui/Marquee';
import Faq from './ui/Faq';
import MenuOverlay from './ui/MenuOverlay';
import Footer from './ui/Footer';
import LiveCounterStrip from './ui/LiveCounterStrip';

export const App: React.FC = () => {
  const currentChapter = useSceneStore((s) => s.currentChapter);
  const chapterLabel = useSceneStore((s) => s.chapterLabel);
  const webglSupported = useSceneStore((s) => s.webglSupported);
  const loaderFinished = useSceneStore((s) => s.loaderFinished);

  const [apiState, setApiState] = useState<ApiState>({ isOffline: true, lastError: null });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const unsub = subscribeApiState(setApiState);

    // Automatic shortlink redirection if loaded with a compressed code
    if (typeof window !== 'undefined' && window.location) {
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      const search = window.location.search;

      let candidate = '';
      if (hash && hash.length > 1) {
        candidate = hash.replace(/^#\/?/, '').trim();
      } else if (search && search.length > 1) {
        const p = new URLSearchParams(search);
        candidate = (p.get('c') || p.get('code') || p.get('p') || p.get('l') || search.slice(1)).trim();
      } else if (pathname && pathname !== '/' && !pathname.endsWith('/index.html') && !pathname.endsWith('/404.html')) {
        const segs = pathname.split('/').map((s) => s.trim()).filter(Boolean);
        if (segs.length > 0) {
          candidate = segs[segs.length - 1];
        }
      }

      if (candidate && candidate !== 'compress' && candidate !== 'decode') {
        try {
          const res = localDecompress(candidate);
          if (res.url && /^https?:\/\//i.test(res.url)) {
            window.location.replace(res.url);
          }
        } catch {
          // Not a valid compressed code; render SPA normally
        }
      }
    }

    return unsub;
  }, []);

  return (
    <div className="linkzip-app" style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Staged capability loader */}
      {!loaderFinished && <Loader />}

      {/* Pinned background canvas anchor */}
      <div id="webgl-container" aria-hidden="true">
        {webglSupported && <Scene />}
      </div>

      {/* Main DOM Layer */}
      <header className="site-header" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 'var(--z-hud)' as unknown as number,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        backdropFilter: 'blur(12px)',
        background: 'var(--color-surface-glass)',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.3rem' }}>🔗</span>
          <span className="site-brand-text" style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '1.25rem',
            letterSpacing: '-0.02em',
            color: 'var(--color-text)'
          }}>
            LinkZip
          </span>
          {apiState.isOffline && (
            <span style={{
              fontSize: '10px',
              background: 'rgba(255, 209, 102, 0.15)',
              color: 'var(--color-xp)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid rgba(255, 209, 102, 0.3)',
              fontFamily: 'var(--font-mono)'
            }}>
              Offline
            </span>
          )}
          <div className="hide-on-mobile"><LiveCounterStrip /></div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Hud />
          <button
            className="menu-trigger-btn"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open navigation menu"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-pill)',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              padding: '6px 14px',
              cursor: 'pointer'
            }}
          >
            Menu ☰
          </button>
        </div>
      </header>

      {/* Full-Screen Navigation Menu Overlay */}
      <MenuOverlay
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigate={(sec) => {
          if (sec === 'playground') window.scrollTo({ top: window.innerHeight * 2.5, behavior: 'smooth' });
          else if (sec === 'pipeline') window.scrollTo({ top: window.innerHeight * 1.2, behavior: 'smooth' });
          else if (sec === 'stats' || sec === 'faq' || sec === 'contact') window.scrollTo({ top: window.innerHeight * 4.0, behavior: 'smooth' });
        }}
      />

      {/* Narrative Progress Indicator */}
      <div style={{
        position: 'fixed',
        bottom: '16px',
        left: '12px',
        zIndex: 'var(--z-hud)' as unknown as number,
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-muted)',
        background: 'var(--color-surface-glass)',
        padding: '4px 10px',
        borderRadius: 'var(--radius-pill)',
        border: '1px solid var(--color-border)'
      }}>
        Chapter {currentChapter} / 4 — <span style={{ color: 'var(--color-accent)' }}>{chapterLabel}</span>
      </div>

      {/* Main Narrative Scroll Layers */}
      <main style={{ position: 'relative', zIndex: 'var(--z-content)' as unknown as number }}>
        <Chapters
          childrenChapter3={
            <div style={{ width: '100%', maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              {!webglSupported && <Fallback2D />}
              <Playground />
            </div>
          }
          childrenChapter4={
            <div style={{ width: '100%', maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <Stats />
              <Marquee />
              <Faq />
              <Footer />
            </div>
          }
        />
      </main>
      <style>{`
        @media (max-width: 640px) {
          .hide-on-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default App;
