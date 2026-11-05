/** Ambient background dust particles and fog for scene depth. */

import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSceneTheme } from './sceneTheme';

export const Ambient: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const colors = useSceneTheme();
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
      <fog attach="fog" args={[colors.fog, 6, 18]} />
      <points ref={pointsRef} geometry={geometry}>
        <pointsMaterial
          size={0.04}
          color={colors.dust}
          transparent
          opacity={colors.dustOpacity}
          sizeAttenuation
        />
      </points>
    </>
  );
};

export default Ambient;
