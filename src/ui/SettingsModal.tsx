import React, { useEffect, useRef, useState } from 'react';
import { getDomain, setDomain, clearDomain, detectCurrentDomain } from '../config.js';
import { normalizeDomain } from '../engine/domain';
import { useDialogFocus } from './useDialogFocus';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Lets the visitor choose which domain new short links (and QR codes) point at. */
const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useDialogFocus(isOpen, dialogRef, inputRef, onClose);

  // Load the current setting each time the dialog opens.
  useEffect(() => {
    if (!isOpen) return;
    setValue(getDomain());
    setError(null);
    setSaved(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentSite = detectCurrentDomain();
  const preview = normalizeDomain(value);
  // Links take the page's scheme (see shortLinkBase), so preview it the same way.
  const scheme = window.location.protocol === 'http:' ? 'http' : 'https';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const domain = normalizeDomain(value);
    if (!domain) {
      setError('Enter a domain like lz.io or example.com/links, without spaces or a query.');
      return;
    }
    if (domain === currentSite) clearDomain();
    else setDomain(domain);
    setValue(domain);
    setSaved(true);
  };

  const handleUseThisSite = () => {
    clearDomain();
    setValue(currentSite);
    setError(null);
    setSaved(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSave}>
          <div className="modal__head">
            <h3 id="settings-title" className="modal__title">Short-link domain</h3>
            <button type="button" className="modal__close" onClick={onClose} aria-label="Close settings">
              ✕
            </button>
          </div>

          <p className="modal__intro">
            New links and QR codes point at this domain. It must serve this LinkZip site (including its
            404.html), or the links won't open.
          </p>

          <div className="modal__field">
            <label htmlFor="settings-domain" className="field-label">DOMAIN</label>
            <input
              id="settings-domain"
              ref={inputRef}
              className="modal__input"
              type="text"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
                setSaved(false);
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby="settings-domain-help"
            />
          </div>

          <p id="settings-domain-help" className="settings__preview">
            {error ? (
              <span className="settings__error">{error}</span>
            ) : preview ? (
              <>Links will look like <code>{scheme}://{preview}/144f…</code></>
            ) : (
              'Enter a domain to see a preview.'
            )}
          </p>

          {saved && <p className="settings__saved" role="status">Saved. New links will use this domain.</p>}

          <div className="modal__actions">
            <button type="button" className="modal__btn-cancel" onClick={handleUseThisSite}>
              Use this site
            </button>
            <button type="submit" className="modal__btn-save">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
