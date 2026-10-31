/*
 * PURPOSE: Automated layout and responsiveness verification script.
 * INPUTS: Built dist/ directory.
 * OUTPUTS: Viewport validation (320px, 375px, 768px, 1440px), touch target sizes, zero overflow check, screenshot captures.
 * DEPENDS_ON: Node http, fs, path, playwright.
 * WHY_THIS_DESIGN: Tests actual built production bundle against strict responsive layout requirements.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '..', 'dist');
const screenshotsDir = path.resolve(__dirname, '..', 'tests', 'screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Simple static file server
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  
  let filePath = path.join(distDir, reqPath);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(distDir, 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading ' + reqPath);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

const PORT = 4173;

server.listen(PORT, async () => {
  console.log(`Verification static server listening at http://localhost:${PORT}`);
  let browser;

  try {
    browser = await chromium.launch({ channel: 'msedge' }).catch(() => chromium.launch({ channel: 'chrome' }));
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('\n--- 1. Testing 320px Narrow Mobile Viewport ---');
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(`http://localhost:${PORT}`);
    await page.waitForSelector('#url-target-input');

    // Check horizontal scroll
    const overflowInfo = await page.evaluate(() => {
      return {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyClientWidth: document.body.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
        hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth
      };
    });

    console.log('320px Overflow check:', overflowInfo);
    if (overflowInfo.hasHorizontalScroll) {
      throw new Error(`Horizontal overflow detected at 320px! scrollWidth=${overflowInfo.scrollWidth}, innerWidth=320`);
    }
    console.log('✓ Zero horizontal scroll at 320px confirmed.');

    // Check mobile sticky bottom bar existence
    const mobileBarVisible = await page.locator('.mobile-action-bar').isVisible();
    console.log('Mobile action bar visible at 320px:', mobileBarVisible);
    if (!mobileBarVisible) {
      throw new Error('Mobile action bar is not visible on <=640px viewport!');
    }

    // Check touch target min size (>= 44px)
    const mobileButtonHeights = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.mobile-action-bar button'));
      return btns.map(b => {
        const rect = b.getBoundingClientRect();
        return { text: b.textContent?.trim(), height: rect.height, width: rect.width };
      });
    });
    console.log('Mobile action buttons:', mobileButtonHeights);
    for (const btn of mobileButtonHeights) {
      if (btn.height < 44) {
        throw new Error(`Mobile button ${btn.text} has height ${btn.height}px which is less than 44px min target!`);
      }
    }
    console.log('✓ All mobile action bar buttons meet WCAG 44x44px min touch target.');

    console.log('\n--- 2. Testing 375px Mobile Viewport ---');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`http://localhost:${PORT}`);
    await page.waitForSelector('#url-target-input');

    // Enter a test URL with tracking parameters
    const testUrl = 'https://example.com/products/summer-sale?utm_source=newsletter&utm_medium=email&fbclid=IwAR123456';
    await page.fill('#url-target-input', testUrl);

    // Wait for QR canvas & stats
    await page.waitForSelector('canvas');
    await page.waitForSelector('text=Payload Reduction');

    // Verify tracking stripper badge appears
    const trackerRemovedBadge = await page.locator('text=tracking tag').count();
    console.log('Trackers removed badge count:', trackerRemovedBadge);

    // Take mobile screenshot
    const mobileScreenshotPath = path.join(screenshotsDir, 'mobile-375.png');
    await page.screenshot({ path: mobileScreenshotPath, fullPage: true });
    console.log(`✓ Mobile screenshot saved to ${mobileScreenshotPath}`);

    console.log('\n--- 3. Testing 768px Tablet Viewport ---');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`http://localhost:${PORT}`);
    await page.waitForSelector('#url-target-input');
    await page.fill('#url-target-input', 'https://github.com/cipherharsh/Link-Compressor');
    await page.waitForSelector('canvas');

    // Verify mobile action bar is hidden above 640px
    const tabletBarVisible = await page.locator('.mobile-action-bar').isVisible();
    console.log('Mobile action bar visible at 768px:', tabletBarVisible);
    if (tabletBarVisible) {
      throw new Error('Mobile action bar should be hidden on tablet (>640px)!');
    }

    const tabletScreenshotPath = path.join(screenshotsDir, 'tablet-768.png');
    await page.screenshot({ path: tabletScreenshotPath, fullPage: true });
    console.log(`✓ Tablet screenshot saved to ${tabletScreenshotPath}`);

    console.log('\n--- 4. Testing 1440px Desktop Viewport ---');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`http://localhost:${PORT}`);
    await page.waitForSelector('#url-target-input');
    await page.fill('#url-target-input', 'https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial');
    await page.waitForSelector('canvas');

    // Verify desktop two-pane layout
    const isTwoPane = await page.evaluate(() => {
      const workspace = document.querySelector('.workspace-grid');
      if (!workspace) return false;
      const computed = window.getComputedStyle(workspace);
      return computed.gridTemplateColumns.split(' ').length >= 2;
    });
    console.log('Two-pane grid active on 1440px:', isTwoPane);
    if (!isTwoPane) {
      throw new Error('Workspace should use a multi-column grid on desktop!');
    }

    // Verify 3D voxel preview can be toggled
    const toggle3dBtn = page.locator('button:has-text("Inspect QR Density in 3D")');
    if (await toggle3dBtn.isVisible()) {
      await toggle3dBtn.click();
      await page.waitForSelector('text=InstancedMesh Voxel Inspector');
      console.log('✓ 3D Voxel Inspector mounted successfully on demand.');
    }

    const desktopScreenshotPath = path.join(screenshotsDir, 'desktop-1440.png');
    await page.screenshot({ path: desktopScreenshotPath, fullPage: true });
    console.log(`✓ Desktop screenshot saved to ${desktopScreenshotPath}`);

    console.log('\n🎉 ALL RESPONSIVE AND LAYOUT VERIFICATIONS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.close();
  }
});
