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
    answer:
      'Traditional shorteners write long URLs into a remote SQL database and return a random 7-character primary key. LinkZip uses bit-level algorithmic compression: common schemes/protocols are mapped to flag bits, top domains and TLDs are matched against precomputed Huffman trees, and remaining paths are packed into fitted subalphabets. The compressed string itself contains all the information needed to reconstruct the original URL client-side.',
  },
  {
    id: 'faq-2',
    question: 'How does redirection work when someone clicks my short link?',
    answer:
      'When a user visits https://your-domain.com/ABC123, GitHub Pages or any static host serves 404.html for unmatched paths. LinkZip’s 404.html contains an inlined zero-dependency decode engine that reads window.location.pathname, instantly decodes the bitstream, and performs window.location.replace() to the original destination.',
  },
  {
    id: 'faq-3',
    question: 'Why are LinkZip QR codes easier for phone cameras to scan?',
    answer:
      'Standard QR generators use 8-bit byte mode for URLs. LinkZip encodes compressed strings using the QR specification’s alphanumeric mode (45 characters: 0-9, A-Z, and special symbols). Alphanumeric mode packs pairs of characters into 11 bits (5.5 bits/char), resulting in significantly smaller matrix sizes (often 1 to 2 QR versions lower) with larger module pixels that cameras lock onto instantly.',
  },
  {
    id: 'faq-4',
    question: 'What is the "Flatten QR" toggle in the 3D HUD?',
    answer:
      'The 3D voxel QR code renders extruded cubes that tilt and rotate dynamically with camera drift. While visually striking, angled perspectives can cause shadow occlusions. Clicking "Flatten QR" animates the camera to a perfectly flat, top-down perspective with maximum black-and-white contrast so you can scan the code directly off your monitor with a smartphone.',
  },
  {
    id: 'faq-5',
    question: 'Can I use my own custom domain?',
    answer:
      'Yes! LinkZip supports any static host (GitHub Pages, Cloudflare Pages, Netlify). You can configure your custom domain in the settings or deploy a CNAME file. As long as 404.html is served for unknown routes, any custom domain will decode and redirect your links seamlessly.',
  },
];

export const Faq: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('faq-1');

  const toggleItem = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <div id="faq" className="faq">
      <div className="faq__head">
        <div className="eyebrow">Frequently Asked Questions</div>
        <h3 className="faq__title">Everything you need to know.</h3>
      </div>

      <div className="faq__list">
        {FAQS.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div key={faq.id} className={`faq-item${isOpen ? ' is-open' : ''}`}>
              <button
                id={`accordion-btn-${faq.id}`}
                className="faq-item__btn"
                aria-expanded={isOpen}
                aria-controls={`accordion-panel-${faq.id}`}
                onClick={() => toggleItem(faq.id)}
              >
                <span>{faq.question}</span>
                <span className="faq-item__icon" aria-hidden="true">+</span>
              </button>

              {isOpen && (
                <div
                  id={`accordion-panel-${faq.id}`}
                  className="faq-item__panel"
                  role="region"
                  aria-labelledby={`accordion-btn-${faq.id}`}
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
