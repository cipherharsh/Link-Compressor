import React from 'react';

const CURRENT_YEAR = new Date().getFullYear();

const Footer: React.FC = () => {
  return (
    <footer id="contact" className="site-footer">
      <div className="site-footer__contact">
        <div className="eyebrow">Get In Touch</div>
        <h2 className="site-footer__title">GOT QUESTIONS?</h2>
        <a className="site-footer__mail" href="mailto:contact@linkzip.dev?subject=LinkZip%20Inquiry">
          contact@linkzip.dev ↗
        </a>
      </div>

      <div className="footer-links-grid">
        <div>
          <div className="footer-col__head">ENGINE</div>
          <ul className="footer-col__list">
            <li><a href="#playground">URL Compressor</a></li>
            <li><a href="#playground">QR Code Optimizer</a></li>
            <li><a href="#playground">Round-Trip Decode</a></li>
            <li><a href="#playground">Daily Squeeze Challenge</a></li>
          </ul>
        </div>

        <div>
          <div className="footer-col__head">DEVELOPERS</div>
          <ul className="footer-col__list">
            <li>
              <a href="https://github.com/cipherharsh/Link-Compressor" target="_blank" rel="noreferrer">
                GitHub Repository ↗
              </a>
            </li>
            <li><a href="#faq">404.html Redirect Specs</a></li>
            <li><a href="#faq">Alphanumeric QR Modes</a></li>
            <li><a href="#faq">Custom Domain CNAME</a></li>
          </ul>
        </div>

        <div>
          <div className="footer-col__head">PRIVACY & ETHICS</div>
          <p className="footer-col__note">
            LinkZip never stores, tracks, or transmits uncompressed user URLs to third parties. All
            bitstream encoding executes directly in your browser session.
          </p>
        </div>
      </div>

      <div className="site-footer__bar">
        <div>© {CURRENT_YEAR} LinkZip. Client-side URL compressor. MIT License.</div>
        <div>Zero database. Zero tracking. 100% reversible.</div>
      </div>
    </footer>
  );
};

export default Footer;
