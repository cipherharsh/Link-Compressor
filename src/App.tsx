/*
 * PURPOSE: Root application workspace orchestrating two-pane layout, theme, and client-side processing.
 * INPUTS: Window events, keyboard shortcuts, user inputs.
 * OUTPUTS: High-performance, zero-backend URL compressor & QR optimizer.
 * DEPENDS_ON: React, lucide-react, compressor.ts, trackingStripper.ts, qrEngine.ts, historyStorage.ts.
 * WHY_THIS_DESIGN: Immediate two-pane workspace on desktop, ergonomic single column on mobile, zero artificial delays.
 */

import React, { useState, useEffect, useRef, useMemo, Suspense, lazy } from 'react';
import Header from './components/Header';
import UrlInputSection from './components/UrlInputSection';
import CompressionStats from './components/CompressionStats';
import QrPreviewSection from './components/QrPreviewSection';
import QrCustomizer from './components/QrCustomizer';
import HistoryDrawer from './components/HistoryDrawer';
import MobileActionBar from './components/MobileActionBar';
import ToastAnnouncer from './components/ToastAnnouncer';

import { sanitizeAndCleanUrl } from './lib/trackingStripper';
import { compressUrl } from './lib/compressor';
import { generateQrDetails, renderQrToCanvas, getExportFilename, downloadPNG } from './lib/qrEngine';
import {
  getHistory,
  addHistoryItem,
  togglePin,
  deleteHistoryItem,
  clearHistory
} from './lib/historyStorage';

import type {
  ThemeMode,
  ErrorCorrectionLevel,
  QrConfig,
  CompressionOutcome,
  HistoryItem
} from './lib/types';
import { Box } from 'lucide-react';

// Lazy-load optional 3D voxel density viewer
const VoxelPreview = lazy(() => import('./components/VoxelPreview'));

const DEFAULT_SAMPLE_URL = 'https://github.com/cipherharsh/Link-Compressor?utm_source=twitter&utm_medium=social&utm_campaign=launch';

export const App: React.FC = () => {
  // Theme state
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('linkzip_theme') as ThemeMode;
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    }
    return 'system';
  });

  // Sync theme attribute on <html> element
  useEffect(() => {
    const applyTheme = () => {
      let active = themeMode;
      if (themeMode === 'system') {
        active = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', active);
    };

    applyTheme();

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      if (themeMode === 'system') applyTheme();
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [themeMode]);

  const handleToggleTheme = () => {
    const next: ThemeMode = themeMode === 'system' ? 'light' : themeMode === 'light' ? 'dark' : 'system';
    setThemeMode(next);
    try {
      localStorage.setItem('linkzip_theme', next);
    } catch {
      // ignore
    }
    announce(`Theme switched to ${next}`);
  };

  // Primary URL State
  const [rawInputUrl, setRawInputUrl] = useState<string>(DEFAULT_SAMPLE_URL);
  const [stripTracking, setStripTracking] = useState<boolean>(true);
  const [activeEc, setActiveEc] = useState<ErrorCorrectionLevel>('M');
  const [qrConfig, setQrConfig] = useState<QrConfig>({
    errorCorrection: 'M',
    fgColor: '#000000',
    bgColor: '#ffffff',
    resolution: 1024,
    margin: 4
  });

  // 3D Voxel viewer toggle (off by default)
  const [showVoxel, setShowVoxel] = useState(false);

  // History state
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(() => getHistory());
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Accessible toast announcement
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const announceTimeout = useRef<number | null>(null);

  const announce = (msg: string) => {
    setAnnouncement(msg);
    if (announceTimeout.current) clearTimeout(announceTimeout.current);
    announceTimeout.current = window.setTimeout(() => setAnnouncement(null), 3000);
  };

  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Compute Cleaned URL & Tracking Diff
  const cleanResult = useMemo(() => {
    return sanitizeAndCleanUrl(rawInputUrl, stripTracking);
  }, [rawInputUrl, stripTracking]);

  // Compute Compression
  const compressionOutcome = useMemo<CompressionOutcome | null>(() => {
    if (!cleanResult.isValid || !cleanResult.cleanedUrl) return null;
    try {
      return compressUrl(rawInputUrl, stripTracking);
    } catch {
      return null;
    }
  }, [rawInputUrl, stripTracking, cleanResult]);

  // Compute QR Details & Metrics
  const qrDetails = useMemo(() => {
    const payload = compressionOutcome?.qrPayload || cleanResult.cleanedUrl || 'https://linkcp.vercel.app';
    return generateQrDetails(payload, {
      ...qrConfig,
      errorCorrection: activeEc
    });
  }, [compressionOutcome, cleanResult, qrConfig, activeEc]);

  // Render QR to Canvas whenever details or colors change
  useEffect(() => {
    if (!canvasRef.current || !qrDetails) return;
    renderQrToCanvas(canvasRef.current, qrDetails.matrix, {
      ...qrConfig,
      errorCorrection: activeEc
    });
  }, [qrDetails, qrConfig, activeEc]);

  // Auto-save to local history on valid compression (debounced 500ms)
  useEffect(() => {
    if (!compressionOutcome) return;
    const timer = setTimeout(() => {
      const updated = addHistoryItem({
        originalUrl: compressionOutcome.originalUrl,
        cleanedUrl: compressionOutcome.cleanedUrl,
        shortCode: compressionOutcome.shortCode,
        shortUrl: compressionOutcome.shortUrl,
        originalLength: compressionOutcome.originalLength,
        compressedLength: compressionOutcome.compressedLength,
        bytesSaved: compressionOutcome.bytesSaved,
        ratioPercent: compressionOutcome.ratioPercent,
        strippedCount: compressionOutcome.strippedParams.length,
        errorCorrection: activeEc
      });
      setHistoryItems(updated);
    }, 600);

    return () => clearTimeout(timer);
  }, [compressionOutcome, activeEc]);

  // Keyboard Shortcuts (Cmd/Ctrl+K to focus input, Cmd/Ctrl+C to copy)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        announce('URL input focused');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // History action handlers
  const handleSelectHistoryItem = (item: HistoryItem) => {
    setRawInputUrl(item.cleanedUrl);
    setActiveEc(item.errorCorrection);
    setIsHistoryOpen(false);
    announce(`Loaded link /${item.shortCode}`);
  };

  const handleTogglePin = (id: string) => {
    const updated = togglePin(id);
    setHistoryItems(updated);
  };

  const handleDeleteHistory = (id: string) => {
    const updated = deleteHistoryItem(id);
    setHistoryItems(updated);
    announce('Item deleted from history');
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear all stored link history?')) {
      const updated = clearHistory(false);
      setHistoryItems(updated);
      announce('History cleared');
    }
  };

  // Mobile quick actions
  const [mobileCopied, setMobileCopied] = useState(false);
  const handleMobileCopy = async () => {
    if (!compressionOutcome) return;
    try {
      await navigator.clipboard.writeText(compressionOutcome.shortUrl);
      setMobileCopied(true);
      announce('Short link copied to clipboard');
      setTimeout(() => setMobileCopied(false), 2000);
    } catch {
      announce('Failed to copy');
    }
  };

  const handleMobileDownload = () => {
    if (!canvasRef.current || !cleanResult.cleanedUrl) return;
    const filename = getExportFilename(cleanResult.cleanedUrl, 'png');
    downloadPNG(canvasRef.current, filename);
    announce(`Saved ${filename}`);
  };

  return (
    <div className="app-wrapper">
      {/* Top Header */}
      <Header
        theme={themeMode}
        onThemeToggle={handleToggleTheme}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={historyItems.length}
      />

      {/* Main Workspace */}
      <main className="main-content">
        <div className="workspace-grid">
          {/* ═══ LEFT PANE: INPUT, TRACKING DIFF, REDUCTION STATS ═══ */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <UrlInputSection
              inputUrl={rawInputUrl}
              onChangeUrl={setRawInputUrl}
              stripTracking={stripTracking}
              onToggleStripTracking={setStripTracking}
              strippedParams={cleanResult.strippedParams}
              errorMessage={cleanResult.isValid ? undefined : cleanResult.errorMessage}
              inputRef={inputRef}
              onAnnounce={announce}
            />

            <CompressionStats
              outcome={compressionOutcome}
              qrModuleCount={qrDetails.size}
            />

            {/* Optional 3D Voxel Density Panel Toggle */}
            <div className="card-panel-compact" style={{ marginTop: 'var(--space-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Visual Density Inspector
                </span>
                <button
                  type="button"
                  onClick={() => setShowVoxel(!showVoxel)}
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '11px', minHeight: 28 }}
                >
                  <Box size={13} strokeWidth={2} />
                  <span>{showVoxel ? 'Hide 3D' : 'Inspect 3D Voxels'}</span>
                </button>
              </div>

              {showVoxel && (
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <Suspense fallback={<div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading 3D canvas...</div>}>
                    <VoxelPreview matrix={qrDetails.matrix} size={qrDetails.size} />
                  </Suspense>
                </div>
              )}
            </div>
          </div>

          {/* ═══ RIGHT PANE: QR PREVIEW, RELIABILITY & EXPORT ═══ */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <QrPreviewSection
              canvasRef={canvasRef}
              metrics={qrDetails.metrics}
              selectedEc={activeEc}
              onSelectEc={setActiveEc}
              targetUrl={compressionOutcome?.shortUrl || cleanResult.cleanedUrl}
            />

            <QrCustomizer
              canvasRef={canvasRef}
              svgString={qrDetails.svgString}
              config={qrConfig}
              onChangeConfig={setQrConfig}
              shortUrl={compressionOutcome?.shortUrl || ''}
              targetUrl={cleanResult.cleanedUrl}
              onAnnounce={announce}
            />
          </div>
        </div>
      </main>

      {/* Accessible Action Feedback Toast */}
      <ToastAnnouncer message={announcement} />

      {/* Local History Slide-over Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        items={historyItems}
        onSelect={handleSelectHistoryItem}
        onTogglePin={handleTogglePin}
        onDelete={handleDeleteHistory}
        onClear={handleClearHistory}
        onAnnounce={announce}
      />

      {/* Mobile Safe-Area Bottom Action Bar */}
      <MobileActionBar
        shortUrl={compressionOutcome?.shortUrl || ''}
        onCopy={handleMobileCopy}
        onDownload={handleMobileDownload}
        isCopied={mobileCopied}
        disabled={!cleanResult.isValid}
      />
    </div>
  );
};

export default App;
