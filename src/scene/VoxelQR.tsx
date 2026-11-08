/** Extruded 3D voxel QR code with ripple reveal and top-down flatten/scan mode. */

import React, { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSceneStore } from '../state/sceneStore';
import { useGameStore } from '../state/gameStore';
import { useThemeStore } from '../state/themeStore';
import { SCENE_THEMES, FLAT_QR } from './sceneTheme';

const QR_WIDTH = 3.2; // world units across the module grid
const QUIET_ZONE = 4; // modules of empty border required for scanning

interface VoxelData {
  r: number;
  c: number;
  baseHeight: number;
}

export const VoxelQR: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const planeRef = useRef<THREE.Mesh>(null);

  const activeQrPayload = useSceneStore((s) => s.activeQrPayload);
  const scrollProgress = useSceneStore((s) => s.scrollProgress);
  const collapseProgress = useSceneStore((s) => s.collapseProgress);
  const flattenQR = useSceneStore((s) => s.flattenQR);
  const recordScanReady = useGameStore((s) => s.recordScanReady);
  const theme = useThemeStore((s) => s.theme);
  const colors = SCENE_THEMES[theme];

  const [pulseTime, setPulseTime] = useState<number>(0);
  const [matrixData, setMatrixData] = useState<boolean[][] | null>(null);

  // Compute QR matrix asynchronously using qrMatrix.worker. Until a link is
  // compressed, the code points at this site so the 3D QR always has something to show.
  useEffect(() => {
    const textToEncode = activeQrPayload || window.location.href.split(/[?#]/)[0];
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

    // Rises into view in the Pipeline and Join chapters, and grows in again with each
    // new compression (the collapse animation). Flatten mode always shows it.
    const chapterVisible = THREE.MathUtils.smoothstep(scrollProgress, 0.45, 0.65);
    const effectiveVisibility = flattenQR ? 1 : Math.max(chapterVisible, collapseProgress);
    groupRef.current.visible = effectiveVisibility > 0.01;
    // The backing plane fades with the code; otherwise it hides the wave behind it.
    planeRef.current?.scale.setScalar(Math.max(0.001, effectiveVisibility));

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

    const baseScale = (QR_WIDTH / size) * pulseScale * effectiveVisibility;
    const offset = size / 2;

    voxels.forEach((v, i) => {
      const posX = (v.c - offset) * (QR_WIDTH / size);
      const posY = (offset - v.r) * (QR_WIDTH / size);

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

  // Flattened, the QR must scan: dark modules on white with a full quiet zone.
  const ink = FLAT_QR.ink[theme];
  const planeSize = flattenQR ? (size + QUIET_ZONE * 2) * (QR_WIDTH / size) : QR_WIDTH + 0.4;

  return (
    <group ref={groupRef} position={[0, -0.2, 0]} onClick={handleClick}>
      {/* Voxel modules */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, voxels.length]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={flattenQR ? ink : colors.voxel}
          emissive={flattenQR ? ink : colors.voxel}
          emissiveIntensity={flattenQR ? 0 : colors.voxelEmissive}
          roughness={flattenQR ? 1 : 0.2}
          metalness={flattenQR ? 0 : 0.6}
        />
      </instancedMesh>

      {/* Backing plane: theme background normally, white paper when flattened for scanning */}
      <mesh ref={planeRef} position={[0, 0, -0.02]}>
        <planeGeometry args={[planeSize, planeSize]} />
        {/* No tone mapping: the plane must match the page/paper colour exactly. */}
        <meshBasicMaterial color={flattenQR ? FLAT_QR.paper : colors.fog} toneMapped={false} />
      </mesh>
    </group>
  );
};

export default VoxelQR;
