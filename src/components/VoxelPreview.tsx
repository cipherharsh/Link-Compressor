/*
 * PURPOSE: Optional 3D voxel QR matrix visualizer demonstrating module density savings.
 * INPUTS: QR boolean matrix, module count, prefersReducedMotion.
 * OUTPUTS: Lazy-loaded Three.js canvas displaying extruded modules.
 * DEPENDS_ON: React, three.js.
 * WHY_THIS_DESIGN: Isolated as an optional docked view so 3D overhead never blocks the primary workflow.
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface VoxelPreviewProps {
  matrix: boolean[][];
  size: number;
}

export const VoxelPreview: React.FC<VoxelPreviewProps> = ({ matrix, size }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current || !matrix || matrix.length === 0) return;

    const container = mountRef.current;
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x16191f);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, -size * 0.95, size * 1.35);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Cap DPR for efficiency
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(size, size * 1.5, size * 2);
    scene.add(dirLight);

    // 3. Voxel Grid Construction using InstancedMesh for maximum 60fps performance
    const darkCount = matrix.flat().filter(Boolean).length;
    const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.5);
    const material = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      roughness: 0.35,
      metalness: 0.2
    });

    const instancedMesh = new THREE.InstancedMesh(geometry, material, darkCount);
    const dummy = new THREE.Object3D();
    const offset = size / 2;

    let index = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (matrix[r][c]) {
          dummy.position.set(c - offset, -(r - offset), 0.25);
          dummy.updateMatrix();
          instancedMesh.setMatrixAt(index, dummy.matrix);
          index++;
        }
      }
    }
    instancedMesh.instanceMatrix.needsUpdate = true;

    // Base plate
    const baseGeo = new THREE.BoxGeometry(size + 2, size + 2, 0.2);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x0c0e12, roughness: 0.8 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(0, 0, -0.1);

    const group = new THREE.Group();
    group.add(baseMesh);
    group.add(instancedMesh);
    scene.add(group);

    // 4. Animation loop
    let reqId: number;

    const animate = () => {
      reqId = requestAnimationFrame(animate);

      if (!prefersReducedMotion) {
        group.rotation.z += 0.003;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      baseGeo.dispose();
      baseMat.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [matrix, size]);

  return (
    <div
      style={{
        width: '100%',
        height: 280,
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        position: 'relative',
        backgroundColor: '#16191f'
      }}
    >
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 10,
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: '#94a3b8',
          backgroundColor: 'rgba(12, 14, 18, 0.8)',
          padding: '2px 8px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid #242934'
        }}
      >
        3D Voxel Extrusion • {size}×{size} grid
      </div>
    </div>
  );
};

export default VoxelPreview;
