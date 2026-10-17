/*
 * PURPOSE: Accessible 5-item FAQ accordion explaining LinkZip mechanics and deployment requirements.
 * INPUTS: Active accordion item index state, keyboard click/toggle events.
 * OUTPUTS: Fully accessible collapsible questions with aria-expanded attributes.
 * DEPENDS_ON: React, tokens.css.
 * WHY_THIS_DESIGN: Single-open accordion with strict aria-expanded attributes guarantees WCAG AA compliance.
 */

import React, { useState } from 'react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'How does LinkZip compress URLs without a backend database?',
    answer: 'Traditional shorteners write long URLs into a remote SQL database and return a random 7-character primary key. LinkZip uses bit-level algorithmic compression: common schemes/protocols are mapped to flag bits, top domains and TLDs are matched against precomputed Huffman trees, and remaining paths are packed into fitted subalphabets. The compressed string itself contains all the information needed to reconstruct the original URL client-side.'
  },
  {
    id: 'faq-2',
    question: 'How does redirection work when someone clicks my short link?',
    answer: 'When a user visits https://your-domain.com/ABC123, GitHub Pages or any static host serves 404.html for unmatched paths. LinkZip’s 404.html contains an inlined zero-dependency decode engine that reads window.location.pathname, instantly decodes the bitstream, and performs window.location.replace() to the original destination.'
  },
  {
    id: 'faq-3',
    question: 'Why are LinkZip QR codes easier for phone cameras to scan?',
    answer: 'Standard QR generators use 8-bit byte mode for URLs. LinkZip encodes compressed strings using the QR specification’s alphanumeric mode (45 characters: 0-9, A-Z, and special symbols). Alphanumeric mode packs pairs of characters into 11 bits (5.5 bits/char), resulting in significantly smaller matrix sizes (often 1 to 2 QR versions lower) with larger module pixels that cameras lock onto instantly.'
  },
  {
    id: 'faq-4',
    question: 'What is the "Flatten QR" toggle in the 3D HUD?',
    answer: 'The 3D voxel QR code renders extruded cubes that tilt and rotate dynamically with camera drift. While visually striking, angled perspectives can cause shadow occlusions. Clicking "Flatten QR" animates the camera to a perfectly flat, top-down perspective with maximum black-and-white contrast so you can scan the code directly off your monitor with a smartphone.'
  },
  {
    id: 'faq-5',
    question: 'Can I use my own custom domain?',
    answer: 'Yes! LinkZip supports any static host (GitHub Pages, Cloudflare Pages, Netlify). You can configure your custom domain in the settings or deploy a CNAME file. As long as 404.html is served for unknown routes, any custom domain will decode and redirect your links seamlessly.'
  }
];

export const Faq: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('faq-1');

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '840px',
        margin: '0 auto 64px auto',
        padding: '0 20px',
        textAlign: 'left'
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '10px'
          }}
        >
          Frequently Asked Questions
        </div>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-h2)',
            fontWeight: 700,
            letterSpacing: '-0.03em'
          }}
        >
          Everything you need to know.
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {FAQS.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div
              key={faq.id}
              style={{
                background: 'var(--color-surface-glass)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${isOpen ? 'var(--color-accent)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-card)',
                overflow: 'hidden',
                transition: 'border-color 0.2s ease'
              }}
            >
              <button
                id={`accordion-btn-${faq.id}`}
                aria-expanded={isOpen}
                aria-controls={`accordion-panel-${faq.id}`}
                onClick={() => toggleItem(faq.id)}
                style={{
                  width: '100%',
                  padding: '20px 24px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.1rem',
                  fontWeight: 600
                }}
              >
                <span>{faq.question}</span>
                <span
                  style={{
                    color: isOpen ? 'var(--color-accent)' : 'var(--color-muted)',
                    fontSize: '1.4rem',
                    transition: 'transform 0.2s ease',
                    transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)'
                  }}
                >
                  +
                </span>
              </button>

              {isOpen && (
                <div
                  id={`accordion-panel-${faq.id}`}
                  role="region"
                  aria-labelledby={`accordion-btn-${faq.id}`}
                  style={{
                    padding: '0 24px 24px 24px',
                    color: 'var(--color-muted)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-small)',
                    lineHeight: 1.6
                  }}
                >
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Faq;
