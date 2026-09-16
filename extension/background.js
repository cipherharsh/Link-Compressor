chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'compress-url',
    title: 'Compress this URL',
    contexts: ['page', 'link']
  });

  chrome.contextMenus.create({
    id: 'generate-qr',
    title: 'Generate QR Code',
    contexts: ['page', 'link']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const url = info.linkUrl || info.pageUrl || tab.url;
  
  if (info.menuItemId === 'compress-url' || info.menuItemId === 'generate-qr') {
    const isQR = info.menuItemId === 'generate-qr';
    
    // Store in storage so popup can pick it up
    chrome.storage.local.set({ 
      targetUrl: url,
      mode: isQR ? 'qr' : 'compress'
    }, () => {
      // Attempt to open the popup programmatically (experimental feature in Chrome MV3)
      if (chrome.action.openPopup) {
        chrome.action.openPopup().catch(err => {
          console.log('Could not open popup programmatically, please click the extension icon.', err);
        });
      } else {
        console.log('Target URL saved. Please click the extension icon.');
      }
    });
  }
});
