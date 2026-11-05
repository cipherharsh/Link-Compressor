import React, { useEffect, useState } from 'react';
import { useSceneStore } from './state/sceneStore';
import { localDecompress } from './engine/localCompress';
import Loader from './ui/Loader';
import Fallback2D from './ui/Fallback2D';
import Scene from './scene/Scene';
import Chapters from './ui/Chapters';
import Hud from './ui/Hud';
import Playground from './ui/Playground';
import Stats from './ui/Stats';
import { Marquee } from './ui/Marquee';
import { Faq } from './ui/Faq';
import { MenuOverlay } from './ui/MenuOverlay';
import Footer from './ui/Footer';
import LiveCounterStrip from './ui/LiveCounterStrip';

/** Reads a compressed code from the current URL (path, hash, or query), if present. */
function readCompressedCandidate(): string {
  const { pathname, hash, search } = window.location;

  if (hash && hash.length > 1) {
    return hash.replace(/^#\/?/, '').trim();
  }
  if (search && search.length > 1) {
    const params = new URLSearchParams(search);
    return (params.get('c') || params.get('code') || params.get('p') || params.get('l') || search.slice(1)).trim();
  }
  if (pathname && pathname !== '/' && !pathname.endsWith('/index.html') && !pathname.endsWith('/404.html')) {
    const segments = pathname.split('/').map((s) => s.trim()).filter(Boolean);
    if (segments.length > 0) return segments[segments.length - 1];
  }
  return '';
}

export const App: React.FC = () => {
  const currentChapter = useSceneStore((s) => s.currentChapter);
  const chapterLabel = useSceneStore((s) => s.chapterLabel);
  const webglSupported = useSceneStore((s) => s.webglSupported);
  const loaderFinished = useSceneStore((s) => s.loaderFinished);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // If the app was loaded via a compressed short link, decode it and redirect.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.location) return;

    const candidate = readCompressedCandidate();
    if (!candidate || candidate === 'compress' || candidate === 'decode') return;

    try {
      const { url } = localDecompress(candidate);
      if (url && /^https?:\/\//i.test(url)) {
        window.location.replace(url);
      }
    } catch {
      // Not a valid compressed code; render the app normally.
    }
  }, []);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="lz-app">
      {!loaderFinished && <Loader />}

      <div id="webgl-container" aria-hidden="true">
        {webglSupported && <Scene />}
      </div>

      <header className="site-header">
        <div className="site-header__group">
          <span className="site-brand" aria-hidden="true">🔗</span>
          <span className="site-brand-text">LinkZip</span>
          <span className="local-badge">In-browser</span>
          <div className="hide-on-mobile">
            <LiveCounterStrip />
          </div>
        </div>

        <div className="site-header__group">
          <Hud />
          <button
            className="btn-pill menu-trigger"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            Menu ☰
          </button>
        </div>
      </header>

      <MenuOverlay
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigate={scrollToSection}
      />

      <div className="chapter-progress">
        Chapter {currentChapter} / 4 — <strong>{chapterLabel}</strong>
      </div>

      <main>
        <Chapters
          childrenChapter3={
            <div id="playground" className="chapter-inner--play">
              {!webglSupported && <Fallback2D />}
              <Playground />
            </div>
          }
          childrenChapter4={
            <div className="chapter-inner--join">
              <Stats />
              <Marquee />
              <Faq />
              <Footer />
            </div>
          }
        />
      </main>
    </div>
  );
};

export default App;
