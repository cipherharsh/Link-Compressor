/*
 * PURPOSE: Primary URL input form with live validation, tracking stripper toggle, and parameter diff view.
 * INPUTS: url input state, onChange handler, stripTracking state, onToggleStripTracking, onPaste, onClear.
 * OUTPUTS: Accessible text input, clipboard paste integration, and real-time parameter diff tags.
 * DEPENDS_ON: React, lucide-react, types.ts.
 * WHY_THIS_DESIGN: Immediate diff feedback visibly proves tracking parameter removal without technical jargon.
 */

import React, { useRef } from 'react';
import { Link2, X, Clipboard, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import type { StrippedParam } from '../lib/types';

interface UrlInputSectionProps {
  inputUrl: string;
  onChangeUrl: (val: string) => void;
  stripTracking: boolean;
  onToggleStripTracking: (val: boolean) => void;
  strippedParams: StrippedParam[];
  errorMessage?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onAnnounce: (msg: string) => void;
}

export const UrlInputSection: React.FC<UrlInputSectionProps> = ({
  inputUrl,
  onChangeUrl,
  stripTracking,
  onToggleStripTracking,
  strippedParams,
  errorMessage,
  inputRef,
  onAnnounce
}) => {
  const [isDiffOpen, setIsDiffOpen] = React.useState(false);
  const fallbackRef = useRef<HTMLInputElement>(null);
  const activeInputRef = inputRef || fallbackRef;

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          onChangeUrl(text);
          onAnnounce('URL pasted from clipboard');
          activeInputRef.current?.focus();
        }
      }
    } catch {
      // Permission denied or unsecure context; focus input for manual paste
      activeInputRef.current?.focus();
    }
  };

  const handleClear = () => {
    onChangeUrl('');
    onAnnounce('Input cleared');
    activeInputRef.current?.focus();
  };

  return (
    <section aria-label="URL Input and Cleaning Controls">
      {/* Editorial Headline & Microcopy */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <h1
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-xl)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            lineHeight: 1.15,
            marginBottom: 'var(--space-2)'
          }}
        >
          Shorten the link. Sharpen the QR.
        </h1>
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.5
          }}
        >
          Runs entirely in your browser. Your URLs never leave your device.
        </p>
      </div>

      {/* Main Input Field */}
      <div className="card-panel" style={{ marginBottom: 'var(--space-4)' }}>
        <label
          htmlFor="url-target-input"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--space-2)'
          }}
        >
          <span>Target Web Address</span>
          {inputUrl.length > 0 && (
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 400, color: 'var(--text-muted)' }}>
              {inputUrl.length} characters
            </span>
          )}
        </label>

        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-canvas)',
            border: `1px solid ${errorMessage ? 'var(--color-error)' : 'var(--border-strong)'}`,
            borderRadius: 'var(--radius-sm)',
            transition: 'border-color var(--motion-fast)'
          }}
        >
          <div
            style={{
              paddingLeft: 'var(--space-3)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center'
            }}
            aria-hidden="true"
          >
            <Link2 size={16} strokeWidth={1.75} />
          </div>

          <input
            id="url-target-input"
            ref={activeInputRef}
            type="text"
            value={inputUrl}
            onChange={(e) => onChangeUrl(e.target.value)}
            placeholder="Paste any link (e.g. https://github.com/user/repo?utm_source=...)"
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            style={{
              flex: 1,
              padding: '12px var(--space-3)',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-primary)',
              minWidth: 0
            }}
          />

          {/* Action Buttons inside Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingRight: 'var(--space-2)' }}>
            {inputUrl.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="btn btn-ghost"
                style={{ padding: '6px', minHeight: 28, borderRadius: 'var(--radius-sm)' }}
                aria-label="Clear URL input"
                title="Clear input"
              >
                <X size={15} strokeWidth={2} />
              </button>
            )}

            <button
              type="button"
              onClick={handlePaste}
              className="btn btn-secondary"
              style={{ padding: '6px 10px', minHeight: 30, fontSize: 'var(--text-xs)' }}
              title="Paste from clipboard"
            >
              <Clipboard size={13} strokeWidth={1.75} />
              <span>Paste</span>
            </button>
          </div>
        </div>

        {/* Inline Error Announcement */}
        {errorMessage && (
          <div
            role="alert"
            style={{
              marginTop: 'var(--space-2)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-error)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>•</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Privacy Tracking Strip Option */}
        <div
          style={{
            marginTop: 'var(--space-4)',
            paddingTop: 'var(--space-3)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            <label
              htmlFor="strip-tracking-checkbox"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: 'var(--text-primary)',
                userSelect: 'none'
              }}
            >
              <input
                id="strip-tracking-checkbox"
                type="checkbox"
                checked={stripTracking}
                onChange={(e) => onToggleStripTracking(e.target.checked)}
                style={{
                  width: 16,
                  height: 16,
                  accentColor: 'var(--accent)',
                  cursor: 'pointer'
                }}
              />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={14} strokeWidth={1.75} color="var(--color-success)" />
                Strip tracking parameters (utm_*, fbclid, gclid)
              </span>
            </label>

            {/* Parameter Diff Indicator Button */}
            {strippedParams.length > 0 && (
              <button
                type="button"
                onClick={() => setIsDiffOpen(!isDiffOpen)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  color: 'var(--color-success)',
                  backgroundColor: 'var(--color-success-bg)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)'
                }}
                aria-expanded={isDiffOpen}
                aria-controls="stripped-params-diff"
              >
                <span>{strippedParams.length} tracking tag{strippedParams.length > 1 ? 's' : ''} removed</span>
                {isDiffOpen ? <ChevronUp size={13} strokeWidth={2} /> : <ChevronDown size={13} strokeWidth={2} />}
              </button>
            )}
          </div>

          {/* Collapsible Diff View */}
          {strippedParams.length > 0 && isDiffOpen && (
            <div
              id="stripped-params-diff"
              style={{
                marginTop: 'var(--space-2)',
                padding: 'var(--space-3)',
                backgroundColor: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-mono)'
              }}
            >
              <div style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-2)', fontSize: '11px', textTransform: 'uppercase' }}>
                Removed query parameters:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {strippedParams.map((param) => (
                  <span
                    key={param.key}
                    style={{
                      padding: '2px 6px',
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-error)'
                    }}
                    title={`Value: ${param.value}`}
                  >
                    -{param.key}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default UrlInputSection;
