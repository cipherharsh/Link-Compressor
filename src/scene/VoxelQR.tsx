/*
 * PURPOSE: Extruded 3D Voxel QR Code with ripple reveal, interactive pulse, and top-down scan mode.
 * INPUTS: Boolean matrix computed by qrMatrix.worker, flattenQR state, collapse timeline.
 * OUTPUTS: InstancedMesh rendering dark QR modules with height variance and scan safety view.
 * DEPENDS_ON: React, Three.js, R3F, sceneStore.ts, gameStore.ts.
 * WHY_THIS_DESIGN: Instanced boxes create a tactile voxel look while Flatten mode allows direct camera scanning.
 */

import React, { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSceneStore } from '../state/sceneStore';
import { useGameStore } from '../state/gameStore';

interface VoxelData {
  r: number;
  c: number;
  baseHeight: number;
}

export const VoxelQR: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  const activeQrPayload = useSceneStore((s) => s.activeQrPayload);
  const scrollProgress = useSceneStore((s) => s.scrollProgress);
  const collapseProgress = useSceneStore((s) => s.collapseProgress);
  const flattenQR = useSceneStore((s) => s.flattenQR);
  const recordScanReady = useGameStore((s) => s.recordScanReady);

  const [pulseTime, setPulseTime] = useState<number>(0);
  const [matrixData, setMatrixData] = useState<boolean[][] | null>(null);

  // Compute QR matrix asynchronously using qrMatrix.worker
  useEffect(() => {
    const textToEncode = activeQrPayload || 'https://lz.io';
    const worker = new Worker(new URL('../engine/qrMatrix.worker.ts', import.meta.url), {
      type: 'module'
    });

    worker.onmessage = (e) => {
      if (e.data.matrix) {
        setMatrixData(e.data.matrix);
      }
      worker.terminate();
    };

    worker.postMessage({ text: textToEncode, ecLevel: 'M' });

    return () => {
      worker.terminate();
    };
  }, [activeQrPayload]);

  // Extract dark module coordinates
  const { voxels, size } = useMemo(() => {
    if (!matrixData || matrixData.length === 0) {
      return { voxels: [] as VoxelData[], size: 21 };
    }
    const s = matrixData.length;
    const vList: VoxelData[] = [];
    for (let r = 0; r < s; r++) {
      for (let c = 0; c < s; c++) {
        if (matrixData[r][c]) {
          // Extrude height 0.2 to 0.6 based on distance from center
          const dist = Math.sqrt(Math.pow(r - s / 2, 2) + Math.pow(c - s / 2, 2));
          const h = 0.2 + (Math.sin(dist * 0.5) * 0.5 + 0.5) * 0.4;
          vList.push({ r, c, baseHeight: h });
        }
      }
    }
    return { voxels: vList, size: s };
  }, [matrixData]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Frame loop handling ripple reveal, flatten animation, and click pulse
  useFrame(({ clock }) => {
    if (!meshRef.current || !groupRef.current || voxels.length === 0) return;

    const time = clock.getElapsedTime();

    // Visibility in Chapter 3 & 4 (0.55 to 1.0) or during collapse animation
    const chapterVisible = THREE.MathUtils.smoothstep(scrollProgress, 0.45, 0.65);
    const effectiveVisibility = Math.max(chapterVisible, collapseProgress);

    // Flatten mode interpolation (smoothly rotate to top-down flat view)
    const targetRotX = flattenQR ? 0 : 0.35;
    const targetRotY = flattenQR ? 0 : 0.45;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.1);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.1);

    // Click pulse effect: scale 1.04 for 0.25s
    const pulseDelta = time - pulseTime;
    let pulseScale = 1.0;
    if (pulseDelta < 0.25) {
      pulseScale = 1.0 + Math.sin((pulseDelta / 0.25) * Math.PI) * 0.04;
    }

    const baseScale = (3.2 / size) * pulseScale * effectiveVisibility;
    const offset = size / 2;

    voxels.forEach((v, i) => {
      const posX = (v.c - offset) * (3.2 / size);
      const posY = (offset - v.r) * (3.2 / size);

      // Height variation (flat in flatten mode for maximum scanning contrast)
      const ripple = Math.sin(time * 3.0 - (v.r + v.c) * 0.2) * 0.1;
      const height = flattenQR ? 0.05 : v.baseHeight + ripple;
      const posZ = height / 2;

      dummy.position.set(posX, posY, posZ);
      dummy.scale.set(baseScale * 0.95, baseScale * 0.95, height * effectiveVisibility);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setPulseTime(performance.now() / 1000);
    recordScanReady();
  };

  if (voxels.length === 0) return null;

  return (
    <group ref={groupRef} position={[0, -0.2, 0]} onClick={handleClick}>
      {/* Voxel modules */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, voxels.length]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={flattenQR ? '#FFFFFF' : '#6CF2C2'}
          emissive={flattenQR ? '#FFFFFF' : '#6CF2C2'}
          emissiveIntensity={flattenQR ? 0.8 : 0.3}
          roughness={flattenQR ? 0.9 : 0.2}
          metalness={flattenQR ? 0.1 : 0.6}
        />
      </instancedMesh>

      {/* QR Background Plane for high contrast scanning */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[3.6, 3.6]} />
        <meshBasicMaterial color="#0B0D12" />
      </mesh>
    </group>
  );
};

export default VoxelQR;
