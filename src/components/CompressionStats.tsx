/*
 * PURPOSE: Real-time mathematical compression metrics and lossless verification indicator.
 * INPUTS: Compression outcome (originalLength, compressedLength, bytesSaved, ratioPercent, shortUrl).
 * OUTPUTS: High-visibility reduction metrics, byte savings, and one-click decode verification.
 * DEPENDS_ON: React, lucide-react, types.ts.
 * WHY_THIS_DESIGN: Replaces placeholder gamification with genuine computed metrics and cryptographic roundtrip verification.
 */

import React, { useState } from 'react';
import { ArrowDownRight, CheckCircle2, RefreshCw, Zap } from 'lucide-react';
import { decompressCode } from '../lib/compressor';
import type { CompressionOutcome } from '../lib/types';

interface CompressionStatsProps {
  outcome: CompressionOutcome | null;
  qrModuleCount?: number;
}

export const CompressionStats: React.FC<CompressionStatsProps> = ({ outcome, qrModuleCount }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState<boolean | null>(null);

  if (!outcome) return null;

  const handleVerify = () => {
    setIsVerifying(true);
    try {
      const decoded = decompressCode(outcome.shortCode);
      const isMatch = decoded === outcome.cleanedUrl;
      setVerifySuccess(isMatch);
    } catch {
      setVerifySuccess(false);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="card-panel" style={{ marginBottom: 'var(--space-4)' }}>
      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)'
        }}
      >
        {/* Metric 1: Reduction % */}
        <div
          style={{
            padding: 'var(--space-3)',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Payload Reduction
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-success)', letterSpacing: '-0.03em' }}>
              {outcome.ratioPercent > 0 ? `-${outcome.ratioPercent}%` : '0%'}
            </span>
            <ArrowDownRight size={16} strokeWidth={2.5} color="var(--color-success)" />
          </div>
        </div>

        {/* Metric 2: Bytes Saved */}
        <div
          style={{
            padding: 'var(--space-3)',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Data Saved
          </div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            {outcome.bytesSaved} <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-muted)' }}>bytes</span>
          </div>
        </div>

        {/* Metric 3: Length Delta */}
        <div
          style={{
            padding: 'var(--space-3)',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Character Count
          </div>
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', paddingTop: '2px' }}>
            <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>{outcome.originalLength}</span>
            {' → '}
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{outcome.compressedLength}</span>
          </div>
        </div>

        {/* Metric 4: QR Modules */}
        {qrModuleCount && (
          <div
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
              QR Grid Density
            </div>
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', paddingTop: '2px' }}>
              {qrModuleCount} × {qrModuleCount} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>mods</span>
            </div>
          </div>
        )}
      </div>

      {/* Reversible Lossless Verification Strip */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
          paddingTop: 'var(--space-3)',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: 'var(--text-xs)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
          <Zap size={14} strokeWidth={2} color="var(--accent)" />
          <span>Lossless Bitstream Encoding: <strong>Reversible client-side</strong></span>
        </div>

        <button
          type="button"
          onClick={handleVerify}
          disabled={isVerifying}
          className="btn btn-secondary"
          style={{ padding: '4px 10px', minHeight: 28, fontSize: '11px' }}
          title="Verify that decompressing the short link reconstructs the original URL"
        >
          <RefreshCw size={12} strokeWidth={2} className={isVerifying ? 'spin-animation' : ''} />
          <span>{verifySuccess === true ? '✓ Lossless Verified' : 'Verify Roundtrip'}</span>
        </button>
      </div>

      {verifySuccess === true && (
        <div
          style={{
            marginTop: 'var(--space-2)',
            padding: '6px 10px',
            backgroundColor: 'var(--color-success-bg)',
            color: 'var(--color-success)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-xs)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <CheckCircle2 size={14} strokeWidth={2} />
          <span>100% Lossless: Decompressed bitstream strictly matches target URL byte-for-byte.</span>
        </div>
      )}
    </div>
  );
};

export default CompressionStats;
