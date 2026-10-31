/*
 * PURPOSE: Studio-style editorial footer with link columns and "GOT QUESTIONS?" mailto CTA.
 * INPUTS: Contact email, repo link, documentation links.
 * OUTPUTS: Responsive footer with social links and mailto contact block.
 * DEPENDS_ON: React, tokens.css.
 * WHY_THIS_DESIGN: Bold editorial typography creates a lasting impression while providing essential links.
 */

import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        width: '100%',
        maxWidth: '960px',
        margin: '0 auto',
        padding: '64px 20px 80px 20px',
        borderTop: '1px solid var(--color-border)',
        textAlign: 'left'
      }}
    >
      {/* Editorial Contact Header */}
      <div style={{ marginBottom: '48px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '12px'
          }}
        >
          Get In Touch
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
            marginBottom: '20px'
          }}
        >
          GOT QUESTIONS?
        </h2>
        <a
          href="mailto:contact@linkzip.dev?subject=LinkZip%20Inquiry"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-body)',
            color: 'var(--color-accent)',
            textDecoration: 'none',
            borderBottom: '2px solid var(--color-accent)',
            paddingBottom: '4px'
          }}
        >
          contact@linkzip.dev ↗
        </a>
      </div>

      {/* Link Columns */}
      <div
        className="footer-links-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '32px',
          marginBottom: '56px'
        }}
      >
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>
            ENGINE
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--text-small)' }}>
            <li><a href="#playground" style={{ color: 'var(--color-text)', textDecoration: 'none' }}>URL Compressor</a></li>
            <li><a href="#playground" style={{ color: 'var(--color-text)', textDecoration: 'none' }}>QR Code Optimizer</a></li>
            <li><a href="#playground" style={{ color: 'var(--color-text)', textDecoration: 'none' }}>Round-Trip Decode</a></li>
            <li><a href="#playground" style={{ color: 'var(--color-text)', textDecoration: 'none' }}>Daily Squeeze Challenge</a></li>
          </ul>
        </div>

        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>
            DEVELOPERS
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--text-small)' }}>
            <li><a href="https://github.com/cipherharsh/Link-Compressor" target="_blank" rel="noreferrer" style={{ color: 'var(--color-text)', textDecoration: 'none' }}>GitHub Repository ↗</a></li>
            <li><a href="#faq" style={{ color: 'var(--color-text)', textDecoration: 'none' }}>404.html Redirect Specs</a></li>
            <li><a href="#faq" style={{ color: 'var(--color-text)', textDecoration: 'none' }}>Alphanumeric QR Modes</a></li>
            <li><a href="#faq" style={{ color: 'var(--color-text)', textDecoration: 'none' }}>Custom Domain CNAME</a></li>
          </ul>
        </div>

        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>
            PRIVACY & ETHICS
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-small)', color: 'var(--color-muted)', lineHeight: 1.5 }}>
            LinkZip never stores, tracks, or transmits uncompressed user URLs to third parties. All bitstream encoding executes directly in your browser session.
          </p>
        </div>
      </div>

      {/* Copyright Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-muted)',
          borderTop: '1px solid var(--color-border)',
          paddingTop: '24px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>© {new Date().getFullYear()} LinkZip. Client-side URL compressor. MIT License.</div>
        <div>Zero database. Zero tracking. 100% reversible.</div>
      </div>
    </footer>
  );
};

export default Footer;
