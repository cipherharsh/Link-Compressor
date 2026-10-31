# LinkZip (v2.0)

> **Client-side URL compressor, privacy sanitizer, and high-density QR code optimizer.**  
> Zero backend. Zero tracking. Zero external API calls. Works 100% offline in your browser.

LinkZip transforms long, cluttered web addresses into compact bitstream-compressed short links and camera-optimized ISO QR codes directly in your browser. All encoding, tracking parameter removal, and QR rendering occur strictly client-side using Web standards.

---

## Key Capabilities

- **Zero-Backend Architecture**: All compression, decompression, and QR generation execute in local memory. URLs are never transmitted to external servers.
- **Privacy-First Tracking Stripper**: Automatically strips tracking artifacts (`utm_*`, `fbclid`, `gclid`, `mc_eid`, `yclid`, etc.) and displays a clear parameter diff before compressing.
- **Lossless Bitstream Compression**: Multi-tier pipeline utilizing sub-alphabet minimization and Huffman dictionary tables for common domains, TLDs, and path segments.
- **Optical Scan Reliability Scoring**: QR engine calculates real relative luminance contrast ratios (WCAG AA compliance) and evaluates camera readability from 0 to 100.
- **Multi-Format Export & Sharing**: 1-click clipboard link copying, direct QR image clipboard copying, multi-resolution PNG downloads (up to 2048px), and vector SVG export.
- **Mobile First & Fully Responsive**: Tested down to 320px width with zero horizontal overflow, 46px minimum touch targets, and a thumb-accessible sticky bottom action bar.
- **Lazy-Loaded 3D Density Inspector**: Three.js `InstancedMesh` voxel visualizer isolated in a separate bundle chunk (`vendor-three`), capped at 60fps, off by default on mobile, and strictly respecting `prefers-reduced-motion`.

---

## Replaced AI Clichés & Design Evolution

LinkZip was rebuilt from the ground up to replace generic "AI-generated" vibe-coded patterns with authentic, functional product design:

| Generic AI Cliché Replaced | Problem with Previous Approach | Replaced With (LinkZip v2.0) |
|---|---|---|
| **Neon Gradients & Glassmorphism Blobs** | Visual noise, poor text contrast, unprofessional aesthetic. | **Strict 9-step Neutral Design System**: Clean typography, subtle borders, high contrast ratios, and deliberate Sapphire/Cobalt accent tokens. |
| **Fake Gamification & XP Streaks** | Artificial complexity (levels, sound effects, fake rewards) in a utility tool. | **Real Mathematical Metrics**: Exact byte delta, % payload reduction, character counts, and cryptographic 1-click roundtrip verification. |
| **Blocking 3D Canvas on Initial Load** | Heavy initial bundle, high CPU/GPU battery drain, blocked simple mobile copy tasks. | **Instant Rendering + Lazy 3D**: Primary QR renders instantly on 2D Canvas/SVG; 3D voxel inspection is lazy-loaded on demand and code-split. |
| **Emoji Overuse in Labels & UI** | Inconsistent rendering across OSes and informal visual clutter. | **Purposeful Vector Icons**: Lucide SVG icons rendered with consistent 1.5px to 1.75px strokes and semantic aria labels. |
| **Mobile Layout Breakages & Small Targets** | Truncated inputs, sub-30px buttons, and horizontal overflow on narrow mobile screens. | **Certified Mobile Layout**: Single-column layout on `<=640px`, zero overflow at 320px, 46px touch targets, and sticky bottom action bar. |
| **Slow Multi-Step Modals** | Frustrating friction delaying access to links and downloads. | **<= 3 Interaction Flow**: Paste link -> View instant output -> Copy or Download in one click. Keyboard shortcut `⌘K` / `Ctrl+K`. |

---

## Technical Architecture

```
                       Original URL (Pasted or Typed)
                                     │
                                     ▼
                ┌─────────────────────────────────────────┐
                │ 1. Privacy Sanitizer                    │
                │    - Strips utm_*, fbclid, gclid        │
                │    - Sanitizes malicious protocols      │
                │    - Calculates stripped diff & savings │
                └────────────────────┬────────────────────┘
                                     │ Cleaned URL
                                     ▼
                ┌─────────────────────────────────────────┐
                │ 2. Huffman Bitstream Encoder            │
                │    - Protocol & www flag bits           │
                │    - TLD dictionary lookup (2-4 bits)   │
                │    - Domain dictionary (~200 domains)   │
                │    - Sub-alphabet selection (4-7 bits)  │
                │    - Base-78 URL-safe string packing    │
                └────────────────────┬────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
       ┌────────────────────────┐        ┌─────────────────────────┐
       │ 3. Short Link State    │        │ 4. ISO QR Code Engine   │
       │    - Instant Copy      │        │    - Matrix evaluation  │
       │    - History Cache     │        │    - Contrast ratio calc│
       │    - 404.html Decoder  │        │    - SVG & Canvas render│
       └────────────────────────┘        │    - Scan score (0-100) │
                                         └────────────┬────────────┘
                                                      │ (Optional)
                                                      ▼
                                         ┌─────────────────────────┐
                                         │ 5. Lazy 3D Inspector    │
                                         │    - InstancedMesh      │
                                         │    - 60fps capped       │
                                         │    - Reduced-motion safe│
                                         └─────────────────────────┘
```

### Source Structure

```
├── index.html                  # Semantic entrypoint with anti-flash theme script
├── vercel.json                 # Vercel static routing & Content Security Policy (CSP)
├── vite.config.ts              # Vite configuration with Three.js code-splitting
├── src/
│   ├── main.tsx                # React 19 application mount
│   ├── App.tsx                 # Two-pane workspace state orchestration
│   ├── styles/
│   │   ├── tokens.css          # Design tokens (colors, typography, spacing, shadows)
│   │   └── app.css             # Layout grids, button classes, print styles
│   ├── lib/
│   │   ├── types.ts            # Core TypeScript interfaces & contracts
│   │   ├── trackingStripper.ts # Tracking parameter stripper & URL sanitizer
│   │   ├── compressor.ts       # Huffman bitstream compression facade
│   │   ├── qrEngine.ts         # QR generation, contrast math & export utilities
│   │   └── historyStorage.ts   # Safe localStorage link history manager
│   └── components/
│       ├── Header.tsx          # Branding, 100% client-side pill, theme & history triggers
│       ├── UrlInputSection.tsx # URL input, paste/clear buttons, parameter diff view
│       ├── CompressionStats.tsx# Payload reduction metrics & roundtrip verification
│       ├── QrPreviewSection.tsx# High-density QR canvas, ISO specs, scan score
│       ├── QrCustomizer.tsx    # Color presets, resolution picker, export buttons
│       ├── HistoryDrawer.tsx   # Searchable modal drawer with pinning & copy actions
│       ├── MobileActionBar.tsx # Sticky bottom action bar for mobile devices (<=640px)
│       ├── ToastAnnouncer.tsx  # Screen reader aria-live announcements & toasts
│       └── VoxelPreview.tsx    # Lazy-loaded Three.js 3D voxel density inspector
├── scripts/
│   └── verify-layout.mjs       # Automated Playwright viewport & overflow test runner
└── tests/
    ├── core-logic.test.ts      # Vitest unit tests for tracking, contrast & scoring
    ├── roundtrip.test.js       # 300+ real-world URL lossless roundtrip tests
    ├── extension.test.js       # Extension bundle parity verification
    ├── qr.test.js              # QR generation & camera scan reliability tests
    └── screenshots/            # Automated verification captures (375px, 768px, 1440px)
```

---

## Getting Started

### Prerequisites

- Node.js (v18.0.0 or later)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/cipherharsh/Link-Compressor.git
cd Link-Compressor

# Install dependencies
npm install
```

### Development Server

```bash
# Start Vite development server
npm run dev
```

Visit `http://localhost:5173` to interact with the local development instance.

---

## Verification & Testing Suites

LinkZip includes automated testing covering unit logic, round-trip compression, optical scan integrity, and multi-device viewport layouts.

```bash
# 1. Typecheck TypeScript across all components
npm run typecheck

# 2. Run unit tests with Vitest
npm run test:adapter

# 3. Run full roundtrip and QR accuracy suite (312 URLs, 624 QR scans)
npm run test

# 4. Run automated layout and responsive verification (Playwright)
npm run test:layout

# 5. Run all test suites combined
npm run test:all
```

---

## Production Build & Deployment

```bash
# Compile and bundle for production
npm run build

# Preview production build locally
npm run preview
```

### Static Hosting on Vercel

LinkZip is configured for zero-configuration static deployment on Vercel via [`vercel.json`](./vercel.json):
- Strict Content Security Policy headers preventing data exfiltration
- `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff`
- SPA rewrites directing all paths to `index.html` for client-side decoding

### Custom Domain Short Links

1. Deploy the repository to Vercel, GitHub Pages, or Cloudflare Pages.
2. Assign your custom short domain (e.g. `lz.io` or `linkcp.vercel.app`).
3. Compressed short links formatted as `https://yourdomain.com/<shortCode>` will be decoded instantly client-side without any server redirect latency.

---

## Accessibility & Keyboard Shortcuts

- `⌘K` / `Ctrl+K`: Focus and select URL input field
- `Esc`: Close open drawers and modals
- `Enter`: Trigger compression / refresh output
- `Tab`: Logical focus order with high-contrast visible focus rings (`--focus-ring`)
- `aria-live="polite"`: Screen reader announcements on link copy, QR save, and history updates
- **Minimum 44x44px touch targets** on all interactive mobile buttons

---

## License

MIT © [CipherHarsh](https://github.com/cipherharsh) & LinkZip Contributors.
