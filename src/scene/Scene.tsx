/** Root R3F canvas: camera rig, postprocessing, and the 3D scene objects. */

import React, { useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useSceneStore } from '../state/sceneStore';
import WildStrand from './WildStrand';
import HuffmanTree from './HuffmanTree';
import VoxelQR from './VoxelQR';
import Ambient from './Ambient';

// Camera controller with CatmullRom spline path, drift, and parallax
const CameraRig: React.FC = () => {
  const { camera, pointer } = useThree();
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
      camera.position.lerp(new THREE.Vector3(0, -0.2, 5.0), 0.1);
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
  const setCapability = useSceneStore((s) => s.setCapability);
  const flattenQR = useSceneStore((s) => s.flattenQR);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const dprCap = isMobile ? 1.5 : 2.0;

  // Adaptive performance thresholds
  const handlePerformanceChange = ({ fps }: { fps: number }) => {
    if (fps < 30) {
      // Degrade to 2D fallback shell if FPS drops critically
      setCapability(false, 'Not supported WebGL');
    } else if (fps < 45) {
      setFpsAndTier(fps, 'low');
    } else {
      setFpsAndTier(fps, 'high');
    }
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
      <PerformanceMonitor onChange={handlePerformanceChange} />
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
      <pointLight position={[-4, -2, 4]} intensity={0.8} color="#6CF2C2" />
      <pointLight position={[4, -2, 4]} intensity={0.8} color="#7C8CFF" />

      {/* 3D Scene Components */}
      <Suspense fallback={null}>
        <Ambient />
        <WildStrand />
        <HuffmanTree />
        <VoxelQR />
      </Suspense>

      {/* Postprocessing (disabled on low tier or mobile for performance budget) */}
      {qualityTier !== 'low' && !isMobile && (
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
