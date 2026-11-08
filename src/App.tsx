import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useSceneStore } from './state/sceneStore';
import { useThemeStore } from './state/themeStore';
import { localDecompress } from './engine/localCompress';
import Loader from './ui/Loader';
import Fallback2D from './ui/Fallback2D';
import SceneBoundary from './scene/SceneBoundary';
import Chapters from './ui/Chapters';
import Hud from './ui/Hud';
import Playground from './ui/Playground';
import Stats from './ui/Stats';
import { Faq } from './ui/Faq';
import { MenuOverlay } from './ui/MenuOverlay';
import Footer from './ui/Footer';
import LiveCounterStrip from './ui/LiveCounterStrip';
import SettingsModal from './ui/SettingsModal';
import { getDomain } from './config.js';

// three.js, R3F, drei, and postprocessing are most of the bundle; load them separately.
const Scene = lazy(() => import('./scene/Scene'));

// Labels for the progress indicator, matching the on-page section order.
const CHAPTER_LABELS = ['', 'Compress', 'Overview', 'Pipeline', 'Join'];

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);

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
  const scrollProgress = useSceneStore((s) => s.scrollProgress);
  const webglSupported = useSceneStore((s) => s.webglSupported);
  const loaderFinished = useSceneStore((s) => s.loaderFinished);
  const setCapability = useSceneStore((s) => s.setCapability);
  const flattenQR = useSceneStore((s) => s.flattenQR);
  const setFlattenQR = useSceneStore((s) => s.setFlattenQR);

  // Start downloading the 3D scene only once the browser is idle, so the
  // compressor is interactive first on slow connections and phones.
  const [load3D, setLoad3D] = useState(false);
  useEffect(() => {
    const start = () => setLoad3D(true);
    // Safari has no requestIdleCallback; fall back to a short timeout there.
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(start, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = window.setTimeout(start, 300);
    return () => clearTimeout(timer);
  }, []);

  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [linkDomain, setLinkDomain] = useState(() => getDomain());
  const isHeaderSolid = scrollProgress > 0.02;

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

  // Esc leaves the flat (scan) view.
  useEffect(() => {
    if (!flattenQR) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFlattenQR(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flattenQR, setFlattenQR]);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={`lz-app${flattenQR ? ' is-flat-view' : ''}`}>
      {!loaderFinished && <Loader />}

      <div id="webgl-container" aria-hidden="true">
        {webglSupported && load3D && (
          <SceneBoundary onError={() => setCapability(false, 'Not supported WebGL')}>
            <Suspense fallback={null}>
              <Scene />
            </Suspense>
          </SceneBoundary>
        )}
      </div>

      <header className={`site-header${isHeaderSolid ? ' is-scrolled' : ''}`}>
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
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
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
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={() => setLinkDomain(getDomain())}
      />

      {flattenQR && (
        <div className="flat-view-bar" role="status">
          <span>Point your phone camera at the code</span>
          <button className="btn-accent flat-view-bar__exit" onClick={() => setFlattenQR(false)}>
            Exit flat view
          </button>
        </div>
      )}

      <div className="chapter-progress">
        Chapter {currentChapter} / 4 — <strong>{CHAPTER_LABELS[currentChapter]}</strong>
      </div>

      <main>
        <Chapters
          compressor={
            <div id="playground" className="compressor-section">
              <div className="compressor-intro">
                <div className="eyebrow">Client-side URL compressor</div>
                <h1 className="compressor-title">Shrink any link into a tiny, scannable code.</h1>
              </div>
              <Playground linkDomain={linkDomain} onOpenSettings={() => setIsSettingsOpen(true)} />
              {!webglSupported && <Fallback2D />}
            </div>
          }
          join={
            <div className="chapter-inner--join">
              <Stats />
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
