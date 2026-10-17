/*
 * PURPOSE: Lightweight 2D fallback experience rendered when WebGL or 3D capability is unavailable.
 * INPUTS: Active compression stages and QR payload from sceneStore.
 * OUTPUTS: Animated SVG compression visualizer and high-contrast 2D QR canvas.
 * DEPENDS_ON: React, sceneStore.ts, tokens.css, qrcode.js.
 * WHY_THIS_DESIGN: Guarantees full feature parity and instant scanning utility on constrained or non-WebGL devices.
 */

import React, { useEffect, useRef } from 'react';
import { useSceneStore } from '../state/sceneStore';
import { generateQR, renderToCanvas } from '../qrcode.js';

export const Fallback2D: React.FC = () => {
  const unsupportedReason = useSceneStore((s) => s.unsupportedReason);
  const activeStages = useSceneStore((s) => s.activeStages);
  const activeQrPayload = useSceneStore((s) => s.activeQrPayload);
  const isCollapsing = useSceneStore((s) => s.isCollapsing);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render 2D QR code onto canvas whenever activeQrPayload changes
  useEffect(() => {
    if (!canvasRef.current) return;
    const textToEncode = activeQrPayload || 'https://lz.io';
    try {
      const qr = generateQR(textToEncode, 'M');
      renderToCanvas(qr, canvasRef.current, {
        scale: 6,
        margin: 4,
        darkColor: '#F2F4F8',
        lightColor: '#141821'
      });
    } catch {
      // Graceful fallback
    }
  }, [activeQrPayload]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        padding: '24px',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-card)',
        border: '1px solid var(--color-border)',
        maxWidth: '560px',
        margin: '0 auto 40px auto'
      }}
    >
      {/* Capability Warning Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-small)',
          color: 'var(--color-xp)',
          background: 'rgba(255, 209, 102, 0.1)',
          padding: '8px 16px',
          borderRadius: 'var(--radius-pill)',
          width: '100%',
          justifyContent: 'center'
        }}
      >
        <span>⚡ 2D Mode:</span>
        <span>{unsupportedReason || 'Standard visualizer active'}</span>
      </div>

      {/* Animated SVG Progress Visualization */}
      <div style={{ width: '100%', textAlign: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-muted)',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          Pipeline Compression Wave
        </div>
        <svg
          viewBox="0 0 400 80"
          style={{
            width: '100%',
            height: '80px',
            background: 'var(--color-surface-hover)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)'
          }}
        >
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-accent)" />
              <stop offset="50%" stopColor="var(--color-accent-2)" />
              <stop offset="100%" stopColor="var(--color-xp)" />
            </linearGradient>
          </defs>

          {/* Collapsing wave path */}
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
            style={{
              transition: 'all 0.6s cubic-bezier(0.215, 0.61, 0.355, 1)'
            }}
          />

          {/* Stage checkpoints */}
          {(activeStages.length > 0 ? activeStages : [
            { id: '1', label: 'Strip', bitsBefore: 100, bitsAfter: 80 },
            { id: '2', label: 'Dict', bitsBefore: 80, bitsAfter: 50 },
            { id: '3', label: 'Pack', bitsBefore: 50, bitsAfter: 40 },
            { id: '4', label: 'QR', bitsBefore: 40, bitsAfter: 30 }
          ]).map((st, i, arr) => {
            const x = 30 + (i / Math.max(1, arr.length - 1)) * 340;
            return (
              <g key={st.id || i}>
                <circle cx={x} cy={40} r={5} fill="var(--color-accent)" />
                <text
                  x={x}
                  y={65}
                  fontSize="10"
                  textAnchor="middle"
                  fill="var(--color-muted)"
                  fontFamily="var(--font-mono)"
                >
                  {st.label.slice(0, 8)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 2D QR Code Canvas */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div
          style={{
            padding: '12px',
            backgroundColor: '#141821',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              display: 'block',
              width: '200px',
              height: '200px',
              imageRendering: 'crisp-edges'
            }}
          />
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-muted)'
          }}
        >
          2D Scan-Optimized Matrix
        </div>
      </div>
    </div>
  );
};

export default Fallback2D;
