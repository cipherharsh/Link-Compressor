# 🔗 LinkZip

**Client-side URL compressor & QR code optimizer** — no server, no database, all logic runs in your browser.

Inspired by [p2r3/ha.mr](https://github.com/p2r3/ha.mr).

---

## How It Works

LinkZip compresses URLs using a multi-stage pipeline:

```
Original URL
    │
    ▼
┌──────────────────────────────┐
│  1. Boilerplate Stripping    │  protocol, www., /index.html → 5 flag bits
├──────────────────────────────┤
│  2. TLD Huffman Lookup       │  "com" → 2 bits, "org" → 4 bits, …
├──────────────────────────────┤
│  3. Domain Huffman Lookup    │  "google" → 4 bits, "github" → 8 bits, …
├──────────────────────────────┤
│  4. Path Segment Encoding    │  Each segment → cheapest sub-alphabet
├──────────────────────────────┤
│  5. Query / Fragment Packing │  Sub-alphabet encoded
├──────────────────────────────┤
│  6. Bitstream → String       │  Base-78 (URL-safe) or Base-42 (QR-safe)
└──────────────────────────────┘
    │
    ▼
Compressed String  →  Short Link + QR Code
```

### Encoding Details

| Stage | Method | Example |
|-------|--------|---------|
| Protocol | 1 flag bit | `https://` → bit `1` |
| www. prefix | 1 flag bit | `www.` → bit `1` |
| TLD | Huffman dictionary (~100 TLDs) | `.com` → `00` (2 bits) |
| Domain | Huffman dictionary (~200 domains) | `youtube` → 6 bits |
| Path segments | Cheapest sub-alphabet (4–7 bits/char) | `/watch` → Huffman hit |
| Output | Base conversion with sentinel bit | Bitstream → URL-safe chars |

### Sub-Alphabets

The encoder picks the smallest character set that covers each path segment:

| Index | Characters | Size | Bits/char |
|-------|-----------|------|-----------|
| 0 | `0-9 - _` | 12 | 4 |
| 1 | `A-Z - _` | 28 | 5 |
| 2 | `a-z - _` | 28 | 5 |
| 3 | `A-Z 0-9 - _` | 38 | 6 |
| 4 | `a-z 0-9 - _` | 38 | 6 |
| 5 | `A-Za-z - _` | 54 | 6 |
| 6 | `A-Za-z 0-9 - _` | 64 | 6 |
| 7 | Full URL charset | 80 | 7 |

---

## Quick Start

### Use the Web App

1. Open `index.html` in any modern browser
2. Paste a URL → get a compressed link + QR code instantly
3. Copy the link or download the QR code

### Deploy to GitHub Pages

This repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`)
that builds the Vite app and publishes it to GitHub Pages on every push to
`main`. LinkZip is a bundled single-page app, so it must be **built** — Pages
cannot serve the repo source directly.

1. In your fork, open **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Push to `main` (or run the "Deploy to GitHub Pages" workflow manually). The
   site goes live at `https://<username>.github.io/<repo>/`.
3. If your repository is **not** named `Link-Compressor`, change `base` in
   `vite.config.ts` to `/<your-repo-name>/` so the built assets resolve.

The build copies `404.html` (a self-contained, zero-dependency decoder) into the
output, so any `https://<username>.github.io/<repo>/<code>` short link is decoded
and redirected entirely client-side.

### Custom Domain Setup

To serve LinkZip from your own domain (e.g., `lz.io`):

1. **Buy a short domain** and point its DNS at GitHub Pages (a `CNAME` record to
   `<username>.github.io`, or `A` records to GitHub's Pages IPs).
2. Add a `CNAME` file (or set the custom domain under **Settings → Pages**).
3. Because a custom domain serves from the root, set `base` back to `/` in
   `vite.config.ts`.
4. The `404.html` catch-all then handles all compressed paths on your domain.

**DNS Configuration:**
```
Type: CNAME
Name: @  (or your subdomain)
Value: <username>.github.io  (or your hosting provider's domain)
```

---

## Browser Extension

The included Chrome extension lets you compress URLs without opening the web app.

### Installation

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` directory

### Usage

- Right-click any page → **"Compress this URL"** or **"Generate QR Code"**
- Or click the extension icon to compress the current tab's URL
- Copy the compressed link or download the QR code from the popup

---

## File Structure

```
├── index.html              Vite entry for the 3D React app
├── 404.html                Redirect/decode page (inlined decode engine)
├── CNAME                   Custom domain (edit this)
├── LICENSE                 MIT
├── src/
│   ├── alphabets.js        Character sets & Huffman dictionaries
│   ├── compress.js         Core encode/decode engine
│   ├── standalone.js       Re-export for 404.html & extension
│   ├── qrcode.js           QR code generator (alphanumeric mode)
│   ├── config.js           Domain profiles & settings (localStorage)
│   ├── *.d.ts              Type declarations for the JS engine above
│   ├── api/                UI-facing adapter (zero-backend)
│   ├── engine/             Typed engine wrapper + QR matrix worker
│   ├── scene/              Three.js / R3F scene, shaders, timeline
│   ├── state/              Zustand stores (scene + gamification)
│   ├── styles/             tokens.css (design tokens) + app.css (components)
│   ├── ui/                 React UI components
│   └── main.tsx            React entry point
├── legacy/                 Archived vanilla UI (index.html, style.css, main.js, …)
├── extension/
│   ├── manifest.json       Chrome MV3 manifest
│   ├── background.js       Context menu service worker
│   ├── popup.html          Extension popup UI
│   ├── popup.js            Extension popup logic
│   └── standalone-bundle.js IIFE bundle of the compression engine
└── tests/
    ├── roundtrip.test.js   Round-trip accuracy tests
    ├── phase*.test.ts      Adapter, loader, scene, scroll, gamification, content, live
    └── test-urls.js        100+ real-world test URLs
```

---

## Testing

```bash
# Run the round-trip test suite
node tests/roundtrip.test.js
```

The test suite verifies:
- ✅ 100+ real-world URLs round-trip correctly (encode → decode = original)
- ✅ Both ASCII and QR output alphabets produce lossless results
- ✅ Edge cases: ports, unicode, fragments, IP hosts, empty paths
- ✅ Compression ratio statistics

---

## Compression Benchmarks

Typical results on real-world URLs:

| URL Type | Original Length | Compressed | Ratio |
|----------|----------------|------------|-------|
| `https://google.com` | 20 | ~14 | ~30% |
| YouTube video URL | 43 | ~22 | ~49% |
| Amazon product URL | 60+ | ~30 | ~50% |
| Wikipedia article | 55 | ~28 | ~49% |
| URL with query params | 80+ | ~40 | ~50% |

> Compression effectiveness depends on dictionary hits. URLs with common domains/TLDs compress significantly better.

---

## How the Redirect Works

```
User visits: https://your-domain.com/COMPRESSED_STRING
                         │
                         ▼
            GitHub Pages serves 404.html
            (all unknown paths hit this)
                         │
                         ▼
            JavaScript reads pathname
            Strips leading "/"
                         │
                         ▼
            decode(path, "ascii")
            Reconstructs original URL
                         │
                         ▼
            window.location.replace(url)
            Browser navigates to original
```

This works because:
- The compressed string is a valid URL path (URL-safe chars only)
- `404.html` is served for any unmatched route on GitHub Pages
- All decode logic runs client-side — no server needed
- Works identically on any domain serving this static site

---

## 3D Gamified Frontend (React 18 + R3F + Vite)

LinkZip features a live, real-time 3D gamified frontend with 1.8s particle-to-voxel collapse animations, XP progression, streaks, and phone-scannable QR codes.

### Setup & Development

```bash
# Install dependencies
npm install

# Start Vite dev server (port 3000)
npm run dev

# Run TypeScript strict typecheck
npm run typecheck

# Production build (creates dist/ with JS bundle <450KB gzip)
npm run build

# Run all test suites (roundtrip + extension + QR scanner + vitest phases)
npm run test:all
```

### Zero-Backend Architecture

LinkZip has no backend. The UI talks to a thin adapter in `src/api/adapter.ts`, which runs
the in-browser compression engine (`src/engine/localCompress.ts`) directly — there is no remote
API to configure, no network round-trip, and no data leaves the browser.

### Code Quality

```bash
npm run typecheck   # strict TypeScript, no emit
npm run lint        # oxlint (fast, TS-7 compatible)
npm run format      # Prettier write
```

---

## License

MIT — see [LICENSE](./LICENSE).
