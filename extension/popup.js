document.addEventListener('DOMContentLoaded', () => {
  const originalUrlEl = document.getElementById('original-url');
  const compressedUrlEl = document.getElementById('compressed-url');
  const statsEl = document.getElementById('stats');
  const copyBtn = document.getElementById('copy-btn');
  const qrContainer = document.getElementById('qr-container');
  const qrDisplay = document.getElementById('qr-display');

  const BASE_DOMAIN = "linkzip.pages.dev";

  // Check if context menu saved a URL
  chrome.storage.local.get(['targetUrl', 'mode', 'baseDomain'], (result) => {
    const domain = result.baseDomain || BASE_DOMAIN;
    if (result.targetUrl) {
      processUrl(result.targetUrl, result.mode, domain);
      chrome.storage.local.remove(['targetUrl', 'mode']);
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
          processUrl(tabs[0].url, 'compress', domain);
        } else {
          originalUrlEl.textContent = "Unable to get current tab URL.";
        }
      });
    }
  });

  function processUrl(url, mode, domain) {
    originalUrlEl.textContent = url;
    
    try {
      if (!window.LinkZip || typeof window.LinkZip.encode !== "function") {
        throw new Error("LinkZip engine not loaded.");
      }
      
      const targetMode = mode === 'qr' ? 'qr' : 'ascii';
      const result = window.LinkZip.encode(url, targetMode);
      const encodedStr = result.encoded;
      const finalUrl = `https://${domain}/${encodedStr}`;
      
      compressedUrlEl.textContent = finalUrl;
      
      const origLen = url.length;
      const compLen = encodedStr.length;
      const ratio = origLen > 0 ? Math.round((1 - compLen / origLen) * 100) : 0;
      
      statsEl.textContent = `${origLen} → ${compLen} chars (${ratio}% smaller)`;
      
      if (mode === 'qr') {
        qrContainer.classList.remove('hidden');
        qrDisplay.innerHTML = `<strong>QR Alphanumeric Payload:</strong><br><code style="font-size:11px">${encodedStr}</code><br><br><small>Ready for QR encoding in Alphanumeric mode</small>`;
      }
    } catch (err) {
      compressedUrlEl.textContent = "Error: " + err.message;
      statsEl.textContent = "";
    }
  }

  copyBtn.addEventListener('click', () => {
    const text = compressedUrlEl.textContent;
    if (text && !text.startsWith("Error")) {
      navigator.clipboard.writeText(text).then(() => {
        const oldText = copyBtn.textContent;
        copyBtn.textContent = "Copied!";
        setTimeout(() => {
          copyBtn.textContent = oldText;
        }, 2000);
      });
    }
  });
});
