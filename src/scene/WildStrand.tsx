/** Interactive particle strand representing the uncompressed URL ribbon. */

import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useSceneStore } from '../state/sceneStore';
import { useSceneTheme } from './sceneTheme';
import vertShader from './shaders/strand.vert.glsl?raw';
import fragShader from './shaders/strand.frag.glsl?raw';

export const WildStrand: React.FC = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const collapseProgress = useSceneStore((s) => s.collapseProgress);
  const qualityTier = useSceneStore((s) => s.qualityTier);
  const colors = useSceneTheme();

  const { gl } = useThree();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Particle count budget based on device and performance tier
  const particleCount = useMemo(() => {
    if (qualityTier === 'low') return 4000;
    if (isMobile || qualityTier === 'medium') return 7000;
    return 16000;
  }, [isMobile, qualityTier]);

  // Each particle has a fixed place along the wave (aProgress) plus a small
  // thickness offset; the shader computes the actual wave shape every frame.
  const { geometry, uniforms } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3); // placed by the shader
    const aRandom = new Float32Array(particleCount);
    const aProgress = new Float32Array(particleCount);
    const aOffset = new Float32Array(particleCount * 2);

    // Roughly Gaussian spread, so the ribbon is dense in the middle and soft at its edges.
    const bell = () => Math.random() + Math.random() + Math.random() - 1.5;

    for (let i = 0; i < particleCount; i++) {
      aProgress[i] = i / (particleCount - 1);
      aRandom[i] = Math.random();
      aOffset[i * 2] = bell() * 0.12;
      aOffset[i * 2 + 1] = bell() * 0.2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aRandom', new THREE.BufferAttribute(aRandom, 1));
    geo.setAttribute('aProgress', new THREE.BufferAttribute(aProgress, 1));
    geo.setAttribute('aOffset', new THREE.BufferAttribute(aOffset, 2));

    const u = {
      uTime: { value: 0 },
      uCollapse: { value: 0 },
      uPixelRatio: { value: gl.getPixelRatio() },
      uSpanScale: { value: 1 },
      uColorA: { value: new THREE.Color() },
      uColorB: { value: new THREE.Color() }
    };

    return { geometry: geo, uniforms: u };
  }, [particleCount, gl]);

  // Clean up GPU allocations on unmount
  useEffect(() => {
    const material = materialRef.current;
    return () => {
      geometry.dispose();
      material?.dispose();
    };
  }, [geometry]);

  useFrame(({ clock, camera, size }) => {
    if (!materialRef.current) return;
    const u = materialRef.current.uniforms;
    u.uTime.value = clock.getElapsedTime();
    u.uCollapse.value = collapseProgress;

    // Fit the wave to the visible width at the camera's distance, a bit wider than
    // the screen so both ends sit just past the edges on phones and laptops alike.
    const cam = camera as THREE.PerspectiveCamera;
    const distance = Math.abs(cam.position.z);
    const visibleHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const visibleWidth = visibleHeight * (size.width / Math.max(1, size.height));
    u.uSpanScale.value = (visibleWidth * 1.08) / 14;
  });

  // Theme colours feed the shader; additive glow only suits the dark theme.
  useEffect(() => {
    uniforms.uColorA.value.set(colors.strandA);
    uniforms.uColorB.value.set(colors.strandB);
  }, [uniforms, colors.strandA, colors.strandB]);

  return (
    // Positions come from the shader, so the geometry's bounds can't be used for culling.
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        // Blending is baked into the compiled program, so remount when it changes.
        key={colors.additive ? 'additive' : 'normal'}
        ref={materialRef}
        vertexShader={vertShader}
        fragmentShader={fragShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={colors.additive ? THREE.AdditiveBlending : THREE.NormalBlending}
      />
    </points>
  );
};

export default WildStrand;
