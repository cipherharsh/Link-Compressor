/*
 * PURPOSE: Color customization, resolution selection, and multi-format export toolbar.
 * INPUTS: QrConfig state, onChangeConfig, export handlers, target URL, short link.
 * OUTPUTS: Accessible color pickers with contrast checking, SVG/PNG downloads, and clipboard operations.
 * DEPENDS_ON: React, lucide-react, qrEngine.ts, types.ts.
 * WHY_THIS_DESIGN: Streamlines copy & export into clear, purposeful controls with zero popups or forced delays.
 */

import React, { useState } from 'react';
import { Copy, Download, Share2, FileCode, Check, Palette } from 'lucide-react';
import {
  copyQrImageToClipboard,
  downloadPNG,
  downloadSVG,
  getExportFilename
} from '../lib/qrEngine';
import type { QrConfig } from '../lib/types';

interface QrCustomizerProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  svgString: string;
  config: QrConfig;
  onChangeConfig: (newConfig: QrConfig) => void;
  shortUrl: string;
  targetUrl: string;
  onAnnounce: (msg: string) => void;
}

const COLOR_PRESETS = [
  { name: 'Monochrome', fg: '#000000', bg: '#ffffff' },
  { name: 'Deep Slate', fg: '#0f172a', bg: '#ffffff' },
  { name: 'Navy Contrast', fg: '#1e3a8a', bg: '#ffffff' },
  { name: 'Charcoal Warm', fg: '#1c1917', bg: '#fafaf9' }
];

export const QrCustomizer: React.FC<QrCustomizerProps> = ({
  canvasRef,
  svgString,
  config,
  onChangeConfig,
  shortUrl,
  targetUrl,
  onAnnounce
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isColorsOpen, setIsColorsOpen] = useState(false);

  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleCopyLink = async () => {
    if (!shortUrl) return;
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedLink(true);
      onAnnounce('Short link copied to clipboard');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      onAnnounce('Failed to copy link');
    }
  };

  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      await copyQrImageToClipboard(canvasRef.current);
      setCopiedImage(true);
      onAnnounce('QR image copied to clipboard');
      setTimeout(() => setCopiedImage(false), 2000);
    } catch {
      onAnnounce('Image clipboard copying not supported on this browser');
    }
  };

  const handleDownloadPNG = () => {
    if (!canvasRef.current) return;
    const filename = getExportFilename(targetUrl, 'png');
    downloadPNG(canvasRef.current, filename);
    onAnnounce(`Downloaded ${filename}`);
  };

  const handleDownloadSVG = () => {
    if (!svgString) return;
    const filename = getExportFilename(targetUrl, 'svg');
    downloadSVG(svgString, filename);
    onAnnounce(`Downloaded ${filename}`);
  };

  const handleShare = async () => {
    if (!canShare || !shortUrl) return;
    try {
      await navigator.share({
        title: 'Compressed Link by LinkZip',
        text: 'Decodes directly in your browser with zero tracking.',
        url: shortUrl
      });
      onAnnounce('Link shared');
    } catch {
      // User cancelled share
    }
  };

  return (
    <div className="card-panel" style={{ marginTop: 'var(--space-4)' }}>
      {/* Short Link Display & Copy Row */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <label
          htmlFor="generated-short-link"
          style={{
            display: 'block',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--space-2)'
          }}
        >
          Generated Clean Short Link
        </label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-canvas)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px var(--space-2) 4px var(--space-3)',
            gap: 'var(--space-2)'
          }}
        >
          <input
            id="generated-short-link"
            type="text"
            readOnly
            value={shortUrl}
            style={{
              flex: 1,
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              color: 'var(--accent)',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              fontWeight: 600,
              minWidth: 0
            }}
          />
          <button
            type="button"
            onClick={handleCopyLink}
            className="btn btn-primary"
            style={{ padding: '6px 12px', minHeight: 32, fontSize: 'var(--text-xs)' }}
            title="Copy link to clipboard"
          >
            {copiedLink ? <Check size={13} strokeWidth={3} /> : <Copy size={13} strokeWidth={2} />}
            <span>{copiedLink ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-4)'
        }}
      >
        <button
          type="button"
          onClick={handleDownloadPNG}
          className="btn btn-primary mobile-touch-target"
          style={{ width: '100%' }}
        >
          <Download size={15} strokeWidth={2} />
          <span>Download PNG</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadSVG}
          className="btn btn-secondary mobile-touch-target"
          style={{ width: '100%' }}
        >
          <FileCode size={15} strokeWidth={2} />
          <span>Download SVG</span>
        </button>

        <button
          type="button"
          onClick={handleCopyImage}
          className="btn btn-secondary mobile-touch-target"
          style={{ width: '100%' }}
        >
          {copiedImage ? <Check size={15} strokeWidth={3} /> : <Copy size={15} strokeWidth={2} />}
          <span>{copiedImage ? 'Copied QR' : 'Copy QR'}</span>
        </button>

        {canShare && (
          <button
            type="button"
            onClick={handleShare}
            className="btn btn-secondary mobile-touch-target"
            style={{ width: '100%' }}
          >
            <Share2 size={15} strokeWidth={2} />
            <span>Share</span>
          </button>
        )}
      </div>

      {/* QR Style & Resolution Controls Toggle */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
        <button
          type="button"
          onClick={() => setIsColorsOpen(!isColorsOpen)}
          className="btn btn-ghost"
          style={{
            width: '100%',
            justifyContent: 'space-between',
            padding: '4px 0',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            color: 'var(--text-secondary)'
          }}
          aria-expanded={isColorsOpen}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Palette size={14} strokeWidth={1.75} />
            Styling & Resolution Settings
          </span>
          <span>{isColorsOpen ? '▲ Close' : '▼ Customize'}</span>
        </button>

        {isColorsOpen && (
          <div style={{ marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {/* Resolution Selector */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: '6px'
                }}
              >
                PNG Export Resolution
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {([512, 1024, 2048] as const).map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => onChangeConfig({ ...config, resolution: res })}
                    className={config.resolution === res ? 'btn btn-primary' : 'btn btn-secondary'}
                    style={{ flex: 1, padding: '4px 8px', fontSize: '11px', minHeight: 28 }}
                  >
                    {res}×{res}px
                  </button>
                ))}
              </div>
            </div>

            {/* Color Presets */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: '6px'
                }}
              >
                Contrast Color Presets
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {COLOR_PRESETS.map((preset) => {
                  const isActive = config.fgColor === preset.fg && config.bgColor === preset.bg;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => onChangeConfig({ ...config, fgColor: preset.fg, bgColor: preset.bg })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border-subtle)'}`,
                        backgroundColor: 'var(--bg-subtle)',
                        fontSize: '12px'
                      }}
                    >
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          backgroundColor: preset.fg,
                          border: '1px solid #ffffff'
                        }}
                      />
                      <span>{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Hex Inputs */}
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Foreground
                </label>
                <input
                  type="color"
                  value={config.fgColor}
                  onChange={(e) => onChangeConfig({ ...config, fgColor: e.target.value })}
                  style={{ width: '100%', height: 32, cursor: 'pointer', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Background
                </label>
                <input
                  type="color"
                  value={config.bgColor}
                  onChange={(e) => onChangeConfig({ ...config, bgColor: e.target.value })}
                  style={{ width: '100%', height: 32, cursor: 'pointer', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QrCustomizer;
