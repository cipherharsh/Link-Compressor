/** 3D tree visualizer for the compression stages / Huffman dictionary hits. */

import React, { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useSceneStore } from '../state/sceneStore';
import { useSceneTheme } from './sceneTheme';

interface TreeNode {
  id: string;
  label: string;
  position: THREE.Vector3;
  parentIndex: number | null;
  savedBits: number;
}

export const HuffmanTree: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const colors = useSceneTheme();
  const activeStages = useSceneStore((s) => s.activeStages);
  const scrollProgress = useSceneStore((s) => s.scrollProgress);
  const collapseProgress = useSceneStore((s) => s.collapseProgress);
  const [hoveredNode, setHoveredNode] = useState<TreeNode | null>(null);

  // Compute node hierarchy from stages
  const { nodes, lineGeometry } = useMemo(() => {
    const rawStages = activeStages.length > 0 ? activeStages : [
      { id: '1', label: 'Protocol Strip', bitsBefore: 128, bitsAfter: 104 },
      { id: '2', label: 'TLD Dictionary', bitsBefore: 104, bitsAfter: 88 },
      { id: '3', label: 'Domain Huffman', bitsBefore: 88, bitsAfter: 56 },
      { id: '4', label: 'Path Packing', bitsBefore: 56, bitsAfter: 42 },
      { id: '5', label: 'QR Serialization', bitsBefore: 42, bitsAfter: 28 }
    ];

    const computedNodes: TreeNode[] = [];
    const rootPos = new THREE.Vector3(0, 1.8, 0);
    computedNodes.push({
      id: 'root',
      label: 'URL Root',
      position: rootPos,
      parentIndex: null,
      savedBits: 0
    });

    // Spread stage nodes downwards like a binary/hierarchical tree
    rawStages.forEach((stage, idx) => {
      const level = Math.floor(idx / 2) + 1;
      const angle = (idx % 2 === 0 ? -1 : 1) * (0.8 / level);
      const x = Math.sin(angle) * (1.2 * level);
      const y = 1.8 - level * 1.1;
      const z = (idx % 2 === 0 ? 0.3 : -0.3);

      computedNodes.push({
        id: stage.id,
        label: stage.label,
        position: new THREE.Vector3(x, y, z),
        parentIndex: Math.floor(idx / 2),
        savedBits: Math.max(0, stage.bitsBefore - stage.bitsAfter)
      });
    });

    // Build branch lines connecting children to parents
    const linePoints: number[] = [];
    for (let i = 1; i < computedNodes.length; i++) {
      const node = computedNodes[i];
      const parent = computedNodes[node.parentIndex ?? 0];
      linePoints.push(parent.position.x, parent.position.y, parent.position.z);
      linePoints.push(node.position.x, node.position.y, node.position.z);
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePoints, 3));

    return { nodes: computedNodes, lineGeometry: lineGeo };
  }, [activeStages]);

  // Clean up line geometry
  useEffect(() => {
    return () => {
      lineGeometry.dispose();
    };
  }, [lineGeometry]);

  // Initialize and animate instance matrices
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!meshRef.current) return;

    // Visibility maps to chapter 2 scroll range (0.2 to 0.55) or during collapse
    const chapter2Factor = THREE.MathUtils.smoothstep(scrollProgress, 0.15, 0.35);
    const chapter2Fade = 1.0 - THREE.MathUtils.smoothstep(scrollProgress, 0.55, 0.7);
    const collapseFactor = 1.0 - collapseProgress;
    const visibility = Math.max(0, chapter2Factor * chapter2Fade * collapseFactor);

    nodes.forEach((node, i) => {
      dummy.position.copy(node.position);
      // Nodes scale into view according to progress
      const nodeScale = (i === 0 ? 0.22 : 0.16) * visibility;
      dummy.scale.set(nodeScale, nodeScale, nodeScale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Tree Nodes */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, nodes.length]}
        onPointerOver={(e) => {
          e.stopPropagation();
          const instanceId = e.instanceId;
          if (instanceId !== undefined && nodes[instanceId]) {
            setHoveredNode(nodes[instanceId]);
          }
        }}
        onPointerOut={() => setHoveredNode(null)}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color={colors.treeNode}
          emissive={colors.treeNode}
          emissiveIntensity={colors.additive ? 0.4 : 0.1}
          roughness={0.2}
          metalness={0.8}
        />
      </instancedMesh>

      {/* Connecting Branch Segments */}
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial
          color={colors.treeLine}
          transparent
          opacity={0.4 * (1.0 - collapseProgress)}
        />
      </lineSegments>

      {/* Active Hover Label Tooltip */}
      {hoveredNode && (
        <Html position={[hoveredNode.position.x, hoveredNode.position.y + 0.3, hoveredNode.position.z]}>
          <div
            style={{
              background: 'var(--color-panel)',
              border: '1px solid var(--color-accent-line)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--color-text)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              boxShadow: '0 4px 16px var(--shadow-color)'
            }}
          >
            <strong>{hoveredNode.label}</strong>
            {hoveredNode.savedBits > 0 && (
              <div style={{ color: 'var(--color-accent-text)' }}>
                -{hoveredNode.savedBits} bits saved
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

export default HuffmanTree;
