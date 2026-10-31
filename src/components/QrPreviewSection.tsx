/*
 * PURPOSE: Interactive QR code display with scan-reliability telemetry and error correction controls.
 * INPUTS: QR canvas reference, QR metrics, active error correction, onSelectEc callback, target URL.
 * OUTPUTS: High-DPI canvas preview, reliability score badges, and accessibility alt labels.
 * DEPENDS_ON: React, lucide-react, types.ts.
 * WHY_THIS_DESIGN: Informs users of camera scan reliability and matrix density before they download or print.
 */

import React from 'react';
import { Check, ShieldAlert, Sparkles } from 'lucide-react';
import type { ErrorCorrectionLevel, QrMetrics } from '../lib/types';

interface QrPreviewSectionProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  metrics: QrMetrics | null;
  selectedEc: ErrorCorrectionLevel;
  onSelectEc: (ec: ErrorCorrectionLevel) => void;
  targetUrl: string;
}

const EC_OPTIONS: { id: ErrorCorrectionLevel; label: string; desc: string; percent: string }[] = [
  { id: 'L', label: 'Low', desc: 'Lowest density, cleanest pixels', percent: '7%' },
  { id: 'M', label: 'Medium', desc: 'Balanced reliability (recommended)', percent: '15%' },
  { id: 'Q', label: 'Quarter', desc: 'Higher resilience for logos/stains', percent: '25%' },
  { id: 'H', label: 'High', desc: 'Maximum error recovery', percent: '30%' }
];

export const QrPreviewSection: React.FC<QrPreviewSectionProps> = ({
  canvasRef,
  metrics,
  selectedEc,
  onSelectEc,
  targetUrl
}) => {
  return (
    <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h2
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--text-secondary)'
          }}
        >
          High-Density QR Matrix
        </h2>

        {metrics && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              backgroundColor: metrics.reliabilityScore >= 80 ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
              color: metrics.reliabilityScore >= 80 ? 'var(--color-success)' : 'var(--color-warning)'
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: 'currentColor'
              }}
            />
            <span>{metrics.reliabilityScore}/100 • {metrics.reliabilityLabel}</span>
          </div>
        )}
      </div>

      {/* QR Code Canvas Frame */}
      <div
        style={{
          width: '100%',
          maxWidth: 320,
          aspectRatio: '1 / 1',
          padding: 'var(--space-4)',
          backgroundColor: '#ffffff', // QR code must render on crisp white surface by default
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--space-4)',
          overflow: 'hidden'
        }}
        role="img"
        aria-label={`QR Code encoding URL: ${targetUrl || 'default'}`}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            imageRendering: 'pixelated'
          }}
        />
      </div>

      {/* Optical Metrics Bar */}
      {metrics && (
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-3)',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--space-4)'
          }}
        >
          <div>
            ISO Version: <strong>v{metrics.version}</strong> ({metrics.moduleCount}×{metrics.moduleCount})
          </div>
          <div>
            Contrast: <strong>{metrics.contrastRatio}:1</strong> {metrics.isContrastWcagAa ? '✓' : '⚠️'}
          </div>
        </div>
      )}

      {/* Error Correction Selector */}
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
          <label
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--text-secondary)'
            }}
          >
            Error Correction Recovery
          </label>
          {metrics && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Auto-rec: <strong>Level {metrics.recommendedEc}</strong>
            </span>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '6px'
          }}
          role="radiogroup"
          aria-label="Error Correction Level"
        >
          {EC_OPTIONS.map((opt) => {
            const isSelected = selectedEc === opt.id;
            const isRec = metrics?.recommendedEc === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelectEc(opt.id)}
                style={{
                  padding: '8px 4px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isSelected ? 'var(--accent)' : 'var(--bg-subtle)',
                  color: isSelected ? 'var(--accent-contrast)' : 'var(--text-primary)',
                  border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border-subtle)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  transition: 'all var(--motion-fast)'
                }}
                title={`${opt.label}: ${opt.desc} (recovers up to ${opt.percent} damage)`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: 'var(--text-xs)', fontWeight: 700 }}>
                  <span>{opt.id}</span>
                  {isRec && !isSelected && <Sparkles size={11} color="var(--accent)" />}
                  {isSelected && <Check size={11} strokeWidth={3} />}
                </div>
                <div style={{ fontSize: '10px', opacity: isSelected ? 0.9 : 0.6, fontFamily: 'var(--font-mono)' }}>
                  {opt.percent}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Warning if low contrast */}
      {metrics && !metrics.isContrastWcagAa && (
        <div
          style={{
            marginTop: 'var(--space-3)',
            width: '100%',
            padding: '8px 12px',
            backgroundColor: 'var(--color-warning-bg)',
            color: 'var(--color-warning)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-xs)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ShieldAlert size={16} strokeWidth={2} />
          <span>Low optical contrast ({metrics.contrastRatio}:1). Increase foreground/background contrast for camera scannability.</span>
        </div>
      )}
    </div>
  );
};

export default QrPreviewSection;
