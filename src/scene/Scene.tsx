/** Root R3F canvas: camera rig, postprocessing, and the 3D scene objects. */

import React, { useMemo, useRef, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useSceneStore } from '../state/sceneStore';
import { useSceneTheme } from './sceneTheme';
import WildStrand from './WildStrand';
import HuffmanTree from './HuffmanTree';
import VoxelQR from './VoxelQR';
import Ambient from './Ambient';

// Camera controller with CatmullRom spline path, drift, and parallax
/** Largest flattened card (QR + 4-module quiet zone) across all QR sizes, in world units. */
const FLAT_CARD = 4.45;

const CameraRig: React.FC = () => {
  const { camera, pointer, size } = useThree();
  const scrollProgress = useSceneStore((s) => s.scrollProgress);
  const flattenQR = useSceneStore((s) => s.flattenQR);

  // Define camera spline trajectory across the 4 narrative chapters
  const cameraPath = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 9),      // Chapter 1: Overview
      new THREE.Vector3(0.5, 0.4, 7.5), // Chapter 2: Compress / Tree
      new THREE.Vector3(0, -0.1, 6.2),  // Chapter 3: Play / Voxel QR
      new THREE.Vector3(0, 0.5, 8.5)    // Chapter 4: Join / Pullback
    ]);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (flattenQR) {
      // Top-down scan mode view
      // Back off just enough that the white code card (QR + quiet zone, about
      // FLAT_CARD world units wide) fills ~70% of the screen's shorter side.
      const fov = THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov);
      const aspect = size.width / Math.max(1, size.height);
      const heightNeeded = FLAT_CARD / 0.7 / Math.min(1, aspect);
      const distance = heightNeeded / (2 * Math.tan(fov / 2));
      camera.position.lerp(new THREE.Vector3(0, -0.2, distance), 0.1);
      camera.lookAt(0, -0.2, 0);
      return;
    }

    // Spline position based on normalized scroll progress
    const splinePos = cameraPath.getPoint(Math.min(1.0, Math.max(0.0, scrollProgress)));

    // Subtle sinusoidal drift (0.15 units)
    const driftX = Math.sin(t * 0.6) * 0.15;
    const driftY = Math.cos(t * 0.8) * 0.12;

    // Pointer parallax (0.3 units max)
    const parallaxX = pointer.x * 0.3;
    const parallaxY = pointer.y * 0.2;

    const targetPos = new THREE.Vector3(
      splinePos.x + driftX + parallaxX,
      splinePos.y + driftY + parallaxY,
      splinePos.z
    );

    camera.position.lerp(targetPos, 0.08);
    camera.lookAt(0, 0, 0);
  });

  return null;
};

export const Scene: React.FC = () => {
  const isCollapsing = useSceneStore((s) => s.isCollapsing);
  const qualityTier = useSceneStore((s) => s.qualityTier);
  const setFpsAndTier = useSceneStore((s) => s.setFpsAndTier);
  const flattenQR = useSceneStore((s) => s.flattenQR);
  const colors = useSceneTheme();

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  // Glow and edge-darkening blur QR edges and wash out the light theme.
  const usePostFx = qualityTier !== 'low' && !isMobile && colors.postFx && !flattenQR;
  const dprCap = isMobile ? 1.5 : 2.0;

  // Adaptive quality: a slow patch drops to the lighter 'low' tier (fewer particles,
  // no post effects) and a fast one restores 'high'. If the frame rate keeps swinging
  // between the two, stay on 'low' for the rest of the visit. Frame rate never
  // switches the page to 2D: that is only for devices where WebGL fails outright.
  const tierLocked = useRef(false);
  const handleDecline = ({ fps }: { fps: number }) => {
    // Browsers throttle hidden tabs, so those readings say nothing about the device.
    if (!document.hidden) setFpsAndTier(fps, 'low');
  };
  const handleIncline = ({ fps }: { fps: number }) => {
    if (!tierLocked.current) setFpsAndTier(fps, 'high');
  };
  const handleFallback = ({ fps }: { fps: number }) => {
    tierLocked.current = true;
    setFpsAndTier(fps, 'low');
  };

  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 40 }}
      dpr={[1, dprCap]}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        outputColorSpace: THREE.SRGBColorSpace
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <PerformanceMonitor
        flipflops={4}
        onDecline={handleDecline}
        onIncline={handleIncline}
        onFallback={handleFallback}
      />
      <CameraRig />

      {/* Orbit controls with bounded rotation in 3D play chapter */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 2 - 0.6} // +/- 35 deg polar
        maxPolarAngle={Math.PI / 2 + 0.6}
        minAzimuthAngle={-1.05}           // +/- 60 deg azimuth
        maxAzimuthAngle={1.05}
        enabled={!flattenQR}
      />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 6, 8]} intensity={1.2} color="#FFFFFF" />
      <pointLight position={[-4, -2, 4]} intensity={0.8} color={colors.lightA} />
      <pointLight position={[4, -2, 4]} intensity={0.8} color={colors.lightB} />

      {/* 3D Scene Components */}
      <Suspense fallback={null}>
        {/* While the QR is flattened for scanning, nothing may sit in front of it. */}
        <group visible={!flattenQR}>
          <Ambient />
          <WildStrand />
          <HuffmanTree />
        </group>
        <VoxelQR />
      </Suspense>

      {/* Postprocessing: dark theme only, off on low tier/mobile and while the QR is flattened */}
      {usePostFx && (
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={isCollapsing ? 1.2 : 0.6}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
          />
          <Vignette eskil={false} offset={0.15} darkness={0.8} />
          {isCollapsing && (
            <ChromaticAberration
              blendFunction={BlendFunction.NORMAL}
              offset={new THREE.Vector2(0.003, 0.003)}
              radialModulation={false}
              modulationOffset={0}
            />
          )}
        </EffectComposer>
      )}
    </Canvas>
  );
};

export default Scene;
