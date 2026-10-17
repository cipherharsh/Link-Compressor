# Architecture & Design Decisions Log

This document logs non-obvious engineering and design decisions for the LinkZip 3D gamified frontend.

---

### DEC-001: Keep Legacy Compression Engine Untouched and Wrap in TypeScript
- **Context**: The existing compression engine in `src/compress.js`, `src/alphabets.js`, and `src/qrcode.js` is fully tested and verified against roundtrip and QR scanner tests.
- **Decision**: Rather than rewriting 1000+ lines of bit-level arithmetic into TypeScript immediately, expose a strongly-typed adapter layer `src/engine/localCompress.ts` that dynamically loads and interfaces with the verified ES modules.
- **Rationale**: Eliminates regression risk on the bit-packing, Huffman coding, and QR error-correction matrices, while still satisfying strict TypeScript checks across the entire React UI.

### DEC-002: Dual-Mode API Adapter Pattern (`adapter.ts`)
- **Context**: Backend deployment might be headless, on another host (`VITE_API_BASE_URL`), or completely static (GitHub Pages / offline).
- **Decision**: `adapter.ts` provides uniform typed methods (`compress`, `decompress`, `getStats`, `getLeaderboard`). If `VITE_API_BASE_URL` is empty, or any fetch call fails/times out (8s limit), it automatically falls back to `localCompress.ts` and local mock stats without crashing.
- **Rationale**: Ensures the frontend functions seamlessly whether deployed as a static client-side single-page app or backed by a cloud API.

### DEC-003: Design System Tokens via Pure CSS Variables
- **Context**: High-performance WebGL + DOM animations require zero-runtime styling overhead and immediate reactivity.
- **Decision**: Define all palette colors, typography (Space Grotesk, Inter, JetBrains Mono), spacing, and glassmorphic variables in `src/styles/tokens.css` rather than pulling in bulky CSS-in-JS or heavy UI frameworks.
- **Rationale**: Minimal JS bundle size (<450KB budget target) and immediate availability to both DOM components and Three.js canvas shaders/materials.

### DEC-004: Decoupled State Stores (Zustand)
- **Context**: 3D rendering updates on every frame (60fps) while gamification (XP, level, streak, achievements) updates asynchronously on user actions.
- **Decision**: Split state into `sceneStore.ts` (scroll progress, chapter, collapse trigger, camera state, WebGL capability) and `gameStore.ts` (persisted XP, streaks, level, unlockables, achievements).
- **Rationale**: Prevents expensive re-renders across the DOM hierarchy when 3D scene progress updates at 60fps.

### DEC-005: Deterministic Capability Probing with Testing Overrides
- **Context**: The app must handle four distinct unsupported hardware/browser states ("Not supported device", "Not supported browser", "Not supported WebGL", "Not supported orientation").
- **Decision**: Probing runs in `evaluateCapabilities()` checking canvas WebGL context, `navigator.deviceMemory`, and viewport dimensions. It supports testing query parameters (`?webgl=0`, `?unsupported=webgl|browser|device|orientation`).
- **Rationale**: Allows automated testing and users on accessibility screen readers or low-end hardware to reliably toggle the 2D fallback mode.

### DEC-006: 800ms Minimum Loader Duration
- **Context**: On fast devices, loader steps can resolve in under 100ms, causing an irritating visual flicker.
- **Decision**: Measure elapsed duration from initialization and pad with `setTimeout` to guarantee at least 800ms display time, followed by a 400ms fadeout transition.
- **Rationale**: Delivers a deliberate, studio-grade aesthetic matching the synthetic-humans reference pattern.

### DEC-007: Web Worker Offloading for QR Matrix Voxel Construction
- **Context**: Constructing a high-version QR matrix involves Reed-Solomon polynomial division, masking evaluation, and coordinate extraction.
- **Decision**: Run `generateQR` inside `qrMatrix.worker.ts` and postMessage the computed 2D boolean array back to the main thread.
- **Rationale**: Keeps the main thread and 60fps render loop completely stutter-free when compressing long URLs.

### DEC-008: Custom Curl-Noise Vertex Shader Over CPU Spline Sampling
- **Context**: Animating 20,000 points on the CPU every frame would trigger heavy GC pressure and drop frame rates below 60fps.
- **Decision**: Compute simplex/curl noise and collapse attraction entirely in GLSL (`strand.vert.glsl`), driving displacement with uniform floats (`uTime`, `uProgress`, `uCollapse`).
- **Rationale**: Offloads computation to the GPU shader cores, maintaining 60fps at 1080p even on integrated GPUs.

### DEC-009: Scan-Safety Flatten Mode with Instant High-Contrast Projection
- **Context**: Extruded 3D voxels viewed from dynamic perspective angles cause shadow occlusions and geometric distortion that phone cameras struggle to parse.
- **Decision**: Introduce a `flattenQR` toggle in `sceneStore` that smoothly animates camera position to (0, -0.2, 5.0) perpendicular to the plane, flattens voxel heights, and renders pure white-on-dark contrast.
- **Rationale**: Preserves 100% camera scannability directly off the user's screen while retaining 3D tactile aesthetics by default.

### DEC-010: Collapsible Header Dropdown for Player HUD
- **Context**: A permanently pinned floating HUD card in the top-right viewport consumed substantial screen space, obscured header navigation buttons, and overlapped hero content across smaller screens.
- **Decision**: Replaced the static card with an interactive trigger pill (`👤 handle • LVL N • 🔥 Streak ▾`) positioned in the header navigation bar, expanding into a glassmorphic dropdown panel upon click with click-outside and Escape key dismissal.
- **Rationale**: Eliminates visual clutter and layout collisions while keeping player progression, audio controls, and achievements instantly accessible from anywhere in the page.

### DEC-011: Multi-Format Short Link Payload Extraction & Auto-Redirection
- **Context**: Users copying compressed short links (`localhost:3000/CODE`, `http://.../CODE`, `https://lz.io/#CODE`, `?c=CODE`) into the "Round Trip Decode" playground encountered decompression failures because the decoder attempted to parse the domain/host characters directly as encoded bitstream.
- **Decision**: Implemented `extractPayload()` supporting scheme-less hostnames (`localhost:3000`), URL protocols, hash fragments, query strings, and trailing slashes. Enhanced `localDecompress()` to prioritize ASCII error reporting when lowercase letters are detected (avoiding deceptive QR alphabet fallback errors) and equipped `App.tsx` with automatic URL detection to instantly redirect on visiting or camera-scanning any short link.
- **Rationale**: Guarantees seamless roundtrip decoding regardless of how the user pastes or enters the link, while ensuring 100% camera scanning redirection works across mobile devices.

### DEC-012: Decode Rush Dynamic Randomization & Domain Expansion
- **Context**: The Decode Rush sprint was initially limited to 5 domains served in a static, predictable sequence, causing repetitive gameplay and predictability.
- **Decision**: Expanded the target pool to 32 major web domains (tech, dev, streaming, social, productivity), implemented Fisher-Yates array shuffling on every new game/replay, added domain alias matching (e.g. `gh`, `yt`, `x`, `fb`, `chatgpt`), and added non-blocking skip functionality and visual feedback indicators.
- **Rationale**: Delivers high replayability, unpredictable gameplay challenges, and immediate answer verification without player frustration.



