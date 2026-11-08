# LinkZip 3D System Architecture & Scene Graph

## 1. System Overview

LinkZip is a client-side, zero-backend URL compressor and high-density QR code optimizer. It transforms uncompressed, high-entropy URLs into compact ISO/IEC 18004 alphanumeric codes and visualizes the process through a live 3D WebGL scene synchronized with gamified player progression.

```
┌────────────────────────────────────────────────────────────────────────┐
│                              BROWSER DOM                               │
│                                                                        │
│  ┌──────────────┐     ┌──────────────┐     ┌────────────────────────┐  │
│  │  App.tsx     │────▶│ Chapters.tsx │────▶│ Playground / HUD / FAQ │  │
│  └──────┬───────┘     └──────┬───────┘     └───────────┬────────────┘  │
└─────────┼────────────────────┼─────────────────────────┼───────────────┘
          │                    │                         │
          ▼                    ▼                         ▼
┌──────────────────┐  ┌──────────────────┐  ┌────────────────────────────┐
│ sceneStore.ts    │  │ gameStore.ts     │  │ adapter.ts                 │
│ - scrollProgress │  │ - XP & Level     │  │ - 8s timeout + 1 retry     │
│ - currentChapter │  │ - Streaks        │  │ - offline fallback         │
│ - collapseAnim   │  │ - Achievements   │  │                            │
│ - flattenQR      │  │ - localStorage   │  │ ┌────────────────────────┐ │
└────────┬─────────┘  └──────────────────┘  │ │ localCompress.ts       │ │
         │                                  │ │ - BitWriter / Huffman  │ │
         │                                  │ │ - Subalphabets         │ │
         │                                  │ └────────────────────────┘ │
         │                                  └────────────┬───────────────┘
         ▼                                               │
┌──────────────────────────────────────────┐             ▼
│ R3F Canvas (WebGL 2.0 Pinned Full-Screen)│  ┌──────────────────────────┐
│ - 60fps adaptive quality monitor         │  │ qrMatrix.worker.ts       │
│ - ACESFilmic tone mapping                │  │ - Off-thread QR ISO math │
└──────────────────────────────────────────┘  └──────────────────────────┘
```

---

## 2. 3D Scene Graph (Text Diagram)

```
[Canvas Root: Scene.tsx]
 ├── [PerformanceMonitor] (telemetry: 60fps target; degrades <45 to low tier, <30 to 2D shell)
 ├── [CameraRig]
 │    ├── Camera: THREE.PerspectiveCamera (FOV: 40°, Initial Position: [0, 0, 9])
 │    ├── Trajectory: CatmullRomCurve3 (Interpolates across Chapters 1 -> 2 -> 3 -> 4)
 │    ├── Drift: Sinusoidal drift (0.15 units)
 │    ├── Parallax: Pointer coordinates (max 0.3 units)
 │    └── Scan Mode: Top-down projection [0, -0.2, 5.0] when flattenQR is toggled
 ├── [OrbitControls] (azimuth ±60°, polar ±35°, disabled in flatten mode)
 ├── [Lighting Hierarchy]
 │    ├── THREE.AmbientLight (intensity: 0.4)
 │    ├── THREE.DirectionalLight (position: [5, 6, 8], intensity: 1.2, #FFFFFF)
 │    ├── THREE.PointLight (position: [-4, -2, 4], intensity: 0.8, color: #6CF2C2)
 │    └── THREE.PointLight (position: [4, -2, 4], intensity: 0.8, color: #7C8CFF)
 ├── [Ambient Dust & Fog: Ambient.tsx]
 │    ├── THREE.Fog (color: #0B0D12, near: 6, far: 18)
 │    └── THREE.Points (1,500 particles, low draw cost, continuous slow rotation)
 ├── [WildStrand: WildStrand.tsx]
 │    ├── Geometry: THREE.BufferGeometry (16,000 desktop / 7,000 mobile / 4,000 low-tier points)
 │    ├── Material: THREE.ShaderMaterial (additive in dark theme, transparent, depthWrite: false)
 │    │    ├── Vertex Shader (strand.vert.glsl): screen-wide travelling sine wave + uGather pull
 │    │    └── Fragment Shader (strand.frag.glsl): circular radial alpha falloff + dual glow
 │    └── Uniforms: uTime, uGather, uSpanScale, uPixelRatio, uColorA, uColorB
 ├── [VoxelQR: VoxelQR.tsx]
 │    ├── Group (tilt rotation lerped; zeroed in flattenQR mode)
 │    ├── Voxels: THREE.InstancedMesh (THREE.BoxGeometry, instance per dark QR module)
 │    │    ├── Heights: 1.0 to 2.8 modules with a ripple wave (scaled to module size)
 │    │    └── Click: haptic-style pulse (scale 1.04 for 0.25s)
 │    └── Backdrop: THREE.Mesh (theme background; white paper with quiet zone when flattened)
 └── [Postprocessing: EffectComposer] (disabled on mobile & low tier)
      ├── Bloom (intensity 0.6 normal / 1.2 on collapse, luminanceThreshold 0.2)
      ├── Vignette (darkness 0.8, offset 0.15)
      └── ChromaticAberration (active during 1.8s collapse trigger)
```

---

## 3. Data Pipeline & Collapse Timeline (1.8s)

When a URL is submitted:

1. **Collapse (0.0s – 1.8s, GSAP `power3.inOut`)**:
   - `collapseProgress` animates from `0.0` to `1.0` in the scene store.
   - The WildStrand wave is drawn in towards the centre and dims (`uGather`).
   - The VoxelQR grows in with its ripple wave; bloom and chromatic aberration flash (dark theme).
2. **Release (after 1.8s)**:
   - The wave flows back out to full width; the QR stays.
   - User can orbit the 3D QR or toggle **Flatten QR** to scan with a phone camera directly.

---

## 4. Gamification Mechanics

- **XP Calculation**: $\lfloor (1 - \frac{\text{compressedLength}}{\text{originalLength}}) \times 1000 \rfloor$
- **Bonuses**:
  - Dictionary hit: $+50\text{ XP}$
  - First compression of calendar day: $+100\text{ XP}$
  - Consecutive day streak: $+10\%$ per day up to $2.0\times$
- **Level Curve**: $\text{XP}(n) = \text{round}(100 \times n^{1.5})$
- **Persistence**: Game state survives page reloads via key `linkzip_player_gamestate_v1`.
