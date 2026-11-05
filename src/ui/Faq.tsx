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
      'Most QR generators store links in 8-bit byte mode. LinkZip writes the QR version of your link in the QR specification’s alphanumeric mode instead: an uppercase address (web addresses ignore case in the domain) followed by a code drawn from the QR character set. Alphanumeric mode packs two characters into 11 bits (5.5 bits per character), so the code often fits one QR version smaller, with bigger squares that cameras lock onto faster. Parts that must keep lowercase letters, like a GitHub Pages project path, stay in byte mode automatically.',
  },
  {
    id: 'faq-4',
    question: 'How do I scan my QR code?',
    answer:
      'The 3D voxel QR is the animated version of your code; it tilts and drifts, so it is not the best thing to scan. To scan, press "Show QR code" after compressing: it opens a large, flat code with dark squares on white and a proper border, plus download and share buttons. "Flatten 3D QR" also turns the 3D code into a flat, dark-on-white, scannable version.',
  },
  {
    id: 'faq-5',
    question: 'Can I use my own custom domain?',
    answer:
      'Yes. LinkZip runs on any static host (GitHub Pages, Vercel, Cloudflare Pages, Netlify). Short links always use the domain the site is served from, so deploy it on your own domain and the links follow. As long as the host serves 404.html for unknown paths, every link on your domain decodes and redirects.',
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
