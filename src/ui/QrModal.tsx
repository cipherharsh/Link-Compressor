import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { generateQR, renderToCanvas, renderToSVG, downloadPNG, downloadSVG } from '../qrcode.js';
import { useGameStore } from '../state/gameStore';
import { useThemeStore } from '../state/themeStore';
import { copyText, canShare, shareLink } from './shareActions';

/** QR "ink": the theme's darkest colour. Always drawn on white for reliable scanning. */
export const QR_INK = { dark: '#06110C', light: '#08098B' } as const;
const QR_PAPER = '#FFFFFF';
const QUIET_ZONE = 4; // modules of empty border required by the QR spec

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Text encoded in the QR (the dense uppercase QR link). */
  qrPayload: string;
  /** Link shown, copied, and shared (classic or emoji). */
  displayUrl: string;
}

/** Downloads the QR as PNG or SVG in the current theme's ink. */
export function downloadQr(qrPayload: string, ink: string, type: 'png' | 'svg') {
  const qr = generateQR(qrPayload, 'M');
  const opts = { scale: 10, margin: QUIET_ZONE, foreground: ink, background: QR_PAPER };
  if (type === 'png') {
    const canvas = document.createElement('canvas');
    renderToCanvas(canvas, qr.matrix, opts);
    downloadPNG(canvas, 'linkzip-qr.png');
  } else {
    downloadSVG(renderToSVG(qr.matrix, opts), 'linkzip-qr.svg');
  }
}

const QrModal: React.FC<QrModalProps> = ({ isOpen, onClose, qrPayload, displayUrl }) => {
  const theme = useThemeStore((s) => s.theme);
  const recordScanReady = useGameStore((s) => s.recordScanReady);
  const ink = QR_INK[theme];

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const qr = useMemo(() => (isOpen ? generateQR(qrPayload, 'M') : null), [isOpen, qrPayload]);

  // Draw at a high resolution; CSS scales it down crisply.
  useEffect(() => {
    if (!qr || !canvasRef.current) return;
    const scale = Math.max(4, Math.floor(640 / (qr.size + QUIET_ZONE * 2)));
    renderToCanvas(canvasRef.current, qr.matrix, {
      scale,
      margin: QUIET_ZONE,
      foreground: ink,
      background: QR_PAPER,
    });
  }, [qr, ink]);

  // Opening the QR counts toward the "Scan Ready" achievement.
  useEffect(() => {
    if (isOpen) recordScanReady();
  }, [isOpen, recordScanReady]);

  // Focus management: focus Close on open, trap Tab, close on Escape, restore focus after.
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 30);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>('button, [href]');
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) setCopyState('idle');
  }, [isOpen]);

  if (!isOpen || !qr || typeof document === 'undefined') return null;

  const handleCopy = async () => {
    setCopyState((await copyText(displayUrl)) ? 'copied' : 'failed');
    window.setTimeout(() => setCopyState('idle'), 2000);
  };

  return createPortal(
    <div className="qr-modal-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="qr-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="qr-modal__head">
          <h3 id="qr-modal-title" className="qr-modal__title">Scan to open</h3>
          <button ref={closeRef} className="qr-modal__close" onClick={onClose} aria-label="Close QR code">
            ✕
          </button>
        </div>

        <div className="qr-modal__paper">
          <canvas
            ref={canvasRef}
            className="qr-modal__canvas"
            role="img"
            aria-label={`QR code for ${displayUrl}`}
          />
        </div>

        <p className="qr-modal__hint">Point your phone camera at the code.</p>
        <div className="qr-modal__link">{displayUrl}</div>
        <p className="qr-modal__meta">
          {qr.mode === 'byte' ? 'Standard' : 'Compact alphanumeric'} QR · version {qr.version} ({qr.size}×{qr.size})
        </p>

        <div className="qr-modal__actions">
          <button className="btn-accent qr-modal__btn" onClick={() => downloadQr(qrPayload, ink, 'png')}>
            Download PNG
          </button>
          <button className="toolbar-btn qr-modal__btn" onClick={() => downloadQr(qrPayload, ink, 'svg')}>
            Download SVG
          </button>
          <button className={`toolbar-btn qr-modal__btn${copyState === 'copied' ? ' is-active' : ''}`} onClick={handleCopy}>
            {copyState === 'copied' ? 'Copied ✓' : copyState === 'failed' ? 'Copy failed' : 'Copy link'}
          </button>
          {canShare() && (
            <button className="toolbar-btn qr-modal__btn" onClick={() => shareLink(displayUrl)}>
              Share
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default QrModal;
