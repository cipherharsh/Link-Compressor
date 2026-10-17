/*
 * PURPOSE: Interactive 3D particle strand representing the uncompressed "wild" URL ribbon.
 * INPUTS: Uniform values (uTime, uProgress, uCollapse, uLength), device tier particle counts.
 * OUTPUTS: Instantiated Points object with custom ShaderMaterial attached to the R3F scene.
 * DEPENDS_ON: React, Three.js, R3F, strand.vert.glsl, strand.frag.glsl, sceneStore.ts.
 * WHY_THIS_DESIGN: Spline-distributed particles with curl-noise shaders convey link length and entropy organically.
 */

import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useSceneStore } from '../state/sceneStore';
import vertShader from './shaders/strand.vert.glsl';
import fragShader from './shaders/strand.frag.glsl';

export const WildStrand: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const scrollProgress = useSceneStore((s) => s.scrollProgress);
  const collapseProgress = useSceneStore((s) => s.collapseProgress);
  const activeUrl = useSceneStore((s) => s.activeUrl);
  const qualityTier = useSceneStore((s) => s.qualityTier);

  const { gl } = useThree();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Particle count budget based on device and performance tier
  const particleCount = useMemo(() => {
    if (qualityTier === 'low') return 4000;
    if (isMobile || qualityTier === 'medium') return 6000;
    return 20000;
  }, [isMobile, qualityTier]);

  // Construct ribbon geometry along a 3D CatmullRom spline
  const { geometry, uniforms } = useMemo(() => {
    // Generate spline control points
    const points: THREE.Vector3[] = [
      new THREE.Vector3(-4.5, 2.0, -2.0),
      new THREE.Vector3(-2.0, -1.2, 0.5),
      new THREE.Vector3(0.0, 1.5, 1.0),
      new THREE.Vector3(2.5, -0.8, -0.5),
      new THREE.Vector3(4.5, 1.2, -2.5)
    ];
    const curve = new THREE.CatmullRomCurve3(points);

    const positions = new Float32Array(particleCount * 3);
    const aRandom = new Float32Array(particleCount);
    const aProgress = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const point = curve.getPoint(t);

      // Offset perpendicularly to give strand thickness
      const spread = 0.35;
      positions[i * 3 + 0] = point.x + (Math.random() - 0.5) * spread;
      positions[i * 3 + 1] = point.y + (Math.random() - 0.5) * spread;
      positions[i * 3 + 2] = point.z + (Math.random() - 0.5) * spread;

      aRandom[i] = Math.random();
      aProgress[i] = t;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aRandom', new THREE.BufferAttribute(aRandom, 1));
    geo.setAttribute('aProgress', new THREE.BufferAttribute(aProgress, 1));

    const u = {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uCollapse: { value: 0 },
      uLength: { value: 0.8 },
      uPixelRatio: { value: gl.getPixelRatio() }
    };

    return { geometry: geo, uniforms: u };
  }, [particleCount, gl]);

  // Clean up GPU allocations on unmount
  useEffect(() => {
    return () => {
      geometry.dispose();
      materialRef.current?.dispose();
    };
  }, [geometry]);

  // Dynamic animation updates on every frame
  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    materialRef.current.uniforms.uProgress.value = scrollProgress;
    materialRef.current.uniforms.uCollapse.value = collapseProgress;
    // Map URL length to [0.2, 1.0]
    const lenNorm = activeUrl ? Math.min(1.0, Math.max(0.2, activeUrl.length / 80)) : 0.8;
    materialRef.current.uniforms.uLength.value = lenNorm;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertShader}
        fragmentShader={fragShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default WildStrand;
