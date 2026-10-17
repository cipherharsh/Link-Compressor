/*
 * PURPOSE: Ambient background dust particles and atmospheric fog providing depth in 3D scene.
 * INPUTS: Uniform particle positions (1500 count), frame tick.
 * OUTPUTS: Instantiated Points mesh and three fog attached to scene.
 * DEPENDS_ON: React, Three.js, R3F.
 * WHY_THIS_DESIGN: Low particle count (1500) ensures rich atmospheric depth with negligible draw call cost.
 */

import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export const Ambient: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const COUNT = 1500;

  const { geometry } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return { geometry: geo };
  }, []);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime() * 0.04;
    pointsRef.current.rotation.y = t;
    pointsRef.current.rotation.x = t * 0.5;
  });

  return (
    <>
      <fog attach="fog" args={['#0B0D12', 6, 18]} />
      <points ref={pointsRef} geometry={geometry}>
        <pointsMaterial
          size={0.04}
          color="#8A93A6"
          transparent
          opacity={0.35}
          sizeAttenuation
        />
      </points>
    </>
  );
};

export default Ambient;
