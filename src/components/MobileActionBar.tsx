/*
 * PURPOSE: Sticky mobile action bar with large 44px touch targets for primary actions.
 * INPUTS: shortUrl, onCopy, onDownload, isCopied state.
 * OUTPUTS: Safe-area-inset bottom bar visible only on mobile screens (<=640px).
 * DEPENDS_ON: React, lucide-react.
 * WHY_THIS_DESIGN: Meets WCAG AA 44x44px touch target requirement and eliminates reaching for controls on phones.
 */

import React from 'react';
import { Copy, Download, Check } from 'lucide-react';

interface MobileActionBarProps {
  shortUrl: string;
  onCopy: () => void;
  onDownload: () => void;
  isCopied: boolean;
  disabled?: boolean;
}

export const MobileActionBar: React.FC<MobileActionBarProps> = ({
  shortUrl,
  onCopy,
  onDownload,
  isCopied,
  disabled
}) => {
  return (
    <div className="mobile-action-bar" role="region" aria-label="Quick Actions">
      <button
        type="button"
        onClick={onCopy}
        disabled={disabled || !shortUrl}
        className="btn btn-primary"
        style={{ flex: 1, minHeight: 46 }}
        aria-label="Copy short link to clipboard"
      >
        {isCopied ? <Check size={16} strokeWidth={2.5} /> : <Copy size={16} strokeWidth={2} />}
        <span>{isCopied ? 'Link Copied' : 'Copy Link'}</span>
      </button>

      <button
        type="button"
        onClick={onDownload}
        disabled={disabled || !shortUrl}
        className="btn btn-secondary"
        style={{ flex: 1, minHeight: 46 }}
        aria-label="Download QR Code PNG"
      >
        <Download size={16} strokeWidth={2} />
        <span>Save QR</span>
      </button>
    </div>
  );
};

export default MobileActionBar;
