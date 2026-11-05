import React, { useEffect, useRef } from 'react';
import { useSceneStore } from '../state/sceneStore';
import { useThemeStore } from '../state/themeStore';
import { generateQR, renderToCanvas } from '../qrcode.js';
import { QR_INK } from './QrModal';

const PLACEHOLDER_STAGES = [
  { id: '1', label: 'Strip', bitsBefore: 100, bitsAfter: 80 },
  { id: '2', label: 'Dict', bitsBefore: 80, bitsAfter: 50 },
  { id: '3', label: 'Pack', bitsBefore: 50, bitsAfter: 40 },
  { id: '4', label: 'QR', bitsBefore: 40, bitsAfter: 30 },
];

const Fallback2D: React.FC = () => {
  const unsupportedReason = useSceneStore((s) => s.unsupportedReason);
  const activeStages = useSceneStore((s) => s.activeStages);
  const activeQrPayload = useSceneStore((s) => s.activeQrPayload);
  const isCollapsing = useSceneStore((s) => s.isCollapsing);
  const theme = useThemeStore((s) => s.theme);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Re-render the 2D QR whenever the payload or theme changes. Dark-on-white keeps it scannable.
  useEffect(() => {
    if (!canvasRef.current) return;
    try {
      const fallbackTarget = typeof window !== 'undefined' ? window.location.href.split('#')[0] : '';
      const qr = generateQR(activeQrPayload || fallbackTarget, 'M');
      renderToCanvas(canvasRef.current, qr.matrix, {
        scale: 6,
        margin: 4,
        foreground: QR_INK[theme],
        background: '#FFFFFF',
      });
    } catch {
      // Leave the canvas blank if QR generation fails.
    }
  }, [activeQrPayload, theme]);

  const stages = activeStages.length > 0 ? activeStages : PLACEHOLDER_STAGES;

  return (
    <div className="fallback">
      <div className="fallback__notice">
        <span aria-hidden="true">⚡</span>
        <span>2D Mode: {unsupportedReason || 'Standard visualizer active'}</span>
      </div>

      <div className="fallback__wave-wrap">
        <div className="fallback__wave-label">Pipeline Compression Wave</div>
        <svg className="fallback__wave" viewBox="0 0 400 80">
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-accent)" />
              <stop offset="50%" stopColor="var(--color-accent-2)" />
              <stop offset="100%" stopColor="var(--color-xp)" />
            </linearGradient>
          </defs>

          <path
            d={
              isCollapsing
                ? 'M 10 40 Q 100 20, 200 40 T 390 40'
                : 'M 10 40 Q 50 15, 100 40 T 200 40 T 300 40 T 390 40'
            }
            fill="none"
            stroke="url(#waveGradient)"
            strokeWidth="3"
            strokeDasharray={isCollapsing ? '8 4' : 'none'}
            style={{ transition: 'all 0.6s cubic-bezier(0.215, 0.61, 0.355, 1)' }}
          />

          {stages.map((st, i, arr) => {
            const x = 30 + (i / Math.max(1, arr.length - 1)) * 340;
            return (
              <g key={st.id || i}>
                <circle cx={x} cy={40} r={5} fill="var(--color-accent)" />
                <text x={x} y={65} fontSize="12" textAnchor="middle" fill="var(--color-muted)" fontFamily="var(--font-mono)">
                  {st.label.slice(0, 8)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="fallback__qr-wrap">
        <div className="fallback__qr-frame">
          <canvas ref={canvasRef} className="fallback__qr" />
        </div>
        <div className="fallback__qr-caption">2D Scan-Optimized Matrix</div>
      </div>
    </div>
  );
};

export default Fallback2D;
