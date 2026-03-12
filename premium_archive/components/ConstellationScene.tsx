"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { CONFIG, generateNodes, NodeData } from "./constellationData";

// ── Shared temp vectors (avoid allocation in hot loop) ────────────────────────
const _tempVec = new THREE.Vector3();
const _cursorWorld = new THREE.Vector3();

// ── Nodes Mesh ────────────────────────────────────────────────────────────────

function ConstellationNodes({
  nodes,
  cursorRef,
}: {
  nodes: NodeData[];
  cursorRef: React.MutableRefObject<THREE.Vector3>;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const anchorMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  const regularNodes = useMemo(() => nodes.filter((n) => !n.isAnchor), [nodes]);
  const anchorNodes = useMemo(() => nodes.filter((n) => n.isAnchor), [nodes]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const cursor = cursorRef.current;

    // Update regular nodes
    if (meshRef.current) {
      regularNodes.forEach((node, i) => {
        // Brownian drift
        node.position.x =
          node.basePosition.x +
          Math.sin(time * CONFIG.DRIFT_SPEED * 300 + node.phase) * 0.3 +
          Math.sin(time * 0.1 + node.phase * 2) * 0.1;
        node.position.y =
          node.basePosition.y +
          Math.cos(time * CONFIG.DRIFT_SPEED * 250 + node.phase * 1.3) * 0.25 +
          Math.cos(time * 0.08 + node.phase * 3) * 0.1;
        node.position.z =
          node.basePosition.z +
          Math.sin(time * CONFIG.DRIFT_SPEED * 200 + node.phase * 0.7) * 0.2;

        // Cursor attraction
        const distToCursor = node.position.distanceTo(cursor);
        if (distToCursor < CONFIG.CURSOR_RADIUS && distToCursor > 0.01) {
          _tempVec
            .copy(cursor)
            .sub(node.position)
            .normalize()
            .multiplyScalar(
              CONFIG.CURSOR_ATTRACTION * (1 - distToCursor / CONFIG.CURSOR_RADIUS)
            );
          node.position.add(_tempVec);
        }

        // Scale pulse
        const basePulse = 1 + Math.sin(time * 1.5 + node.phase) * 0.15;
        const cursorBoost =
          distToCursor < CONFIG.CURSOR_RADIUS
            ? 1 + (1 - distToCursor / CONFIG.CURSOR_RADIUS) * CONFIG.CURSOR_GLOW_STRENGTH
            : 1;
        const scale = node.size * basePulse * cursorBoost * 10;

        dummy.position.copy(node.position);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);

        // Subtle HDR values to trigger gentle bloom
        if (distToCursor < CONFIG.CURSOR_RADIUS) {
          const t = 1 - distToCursor / CONFIG.CURSOR_RADIUS;
          color.copy(CONFIG.COLORS.node).lerp(CONFIG.COLORS.glow, t * 0.6);
          color.multiplyScalar(0.8 + t * 1.2);
        } else {
          color.copy(CONFIG.COLORS.node).multiplyScalar(0.7);
        }
        meshRef.current!.setColorAt(i, color);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor)
        meshRef.current.instanceColor.needsUpdate = true;
    }

    // Update anchor nodes
    if (anchorMeshRef.current) {
      anchorNodes.forEach((node, i) => {
        node.position.x =
          node.basePosition.x +
          Math.sin(time * CONFIG.DRIFT_SPEED * 150 + node.phase) * 0.15;
        node.position.y =
          node.basePosition.y +
          Math.cos(time * CONFIG.DRIFT_SPEED * 120 + node.phase * 1.5) * 0.15;
        node.position.z =
          node.basePosition.z +
          Math.sin(time * CONFIG.DRIFT_SPEED * 100 + node.phase * 0.5) * 0.1;

        const distToCursor = node.position.distanceTo(cursor);
        const cursorBoost =
          distToCursor < CONFIG.CURSOR_RADIUS
            ? 1 + (1 - distToCursor / CONFIG.CURSOR_RADIUS) * 2
            : 1;
        const pulse = 1 + Math.sin(time * 0.8 + node.phase) * 0.2;
        const scale = node.size * pulse * cursorBoost * 12;

        dummy.position.copy(node.position);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        anchorMeshRef.current!.setMatrixAt(i, dummy.matrix);

        // Anchors glow a bit brighter
        if (distToCursor < CONFIG.CURSOR_RADIUS) {
          const t = 1 - distToCursor / CONFIG.CURSOR_RADIUS;
          color.copy(CONFIG.COLORS.anchor).lerp(CONFIG.COLORS.glow, t);
          color.multiplyScalar(1.0 + t * 1.5);
        } else {
          color.copy(CONFIG.COLORS.anchor).multiplyScalar(1.0);
        }
        anchorMeshRef.current!.setColorAt(i, color);
      });
      anchorMeshRef.current.instanceMatrix.needsUpdate = true;
      if (anchorMeshRef.current.instanceColor)
        anchorMeshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, regularNodes.length]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </instancedMesh>
      <instancedMesh
        ref={anchorMeshRef}
        args={[undefined, undefined, anchorNodes.length]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </instancedMesh>
    </>
  );
}

// ── Connection Lines ──────────────────────────────────────────────────────────

function ConstellationLines({
  nodes,
  cursorRef,
}: {
  nodes: NodeData[];
  cursorRef: React.MutableRefObject<THREE.Vector3>;
}) {
  const lineRef = useRef<THREE.BufferGeometry>(null);
  const maxLines = 2500;
  const positionsArray = useMemo(() => new Float32Array(maxLines * 6), []);
  const colorsArray = useMemo(() => new Float32Array(maxLines * 6), []);

  useFrame(() => {
    if (!lineRef.current) return;

    const cursor = cursorRef.current;
    let lineCount = 0;
    const dist = CONFIG.LINE_DISTANCE;
    const distSq = dist * dist;

    for (let i = 0; i < nodes.length && lineCount < maxLines; i++) {
      for (let j = i + 1; j < nodes.length && lineCount < maxLines; j++) {
        const a = nodes[i];
        const b = nodes[j];

        const dx = a.position.x - b.position.x;
        const dy = a.position.y - b.position.y;
        const dz = a.position.z - b.position.z;
        const dSq = dx * dx + dy * dy + dz * dz;

        if (dSq > distSq) continue;

        const sameZone = a.zone === b.zone;

        // Cross-cluster lines only appear near cursor
        if (!sameZone) {
          const midX = (a.position.x + b.position.x) / 2;
          const midY = (a.position.y + b.position.y) / 2;
          const midZ = (a.position.z + b.position.z) / 2;
          _tempVec.set(midX, midY, midZ);
          const midDist = _tempVec.distanceTo(cursor);
          if (midDist > CONFIG.CURSOR_RADIUS * 1.5) continue;
        }

        const d = Math.sqrt(dSq);
        let alpha = (1 - d / dist) * CONFIG.LINE_OPACITY;

        if (!sameZone) {
          alpha *= 0.4;
        }

        // Boost lines near cursor
        const midX = (a.position.x + b.position.x) / 2;
        const midY = (a.position.y + b.position.y) / 2;
        const midZ = (a.position.z + b.position.z) / 2;
        _tempVec.set(midX, midY, midZ);
        const cursorDist = _tempVec.distanceTo(cursor);
        if (cursorDist < CONFIG.CURSOR_RADIUS) {
          const boost = 1 - cursorDist / CONFIG.CURSOR_RADIUS;
          alpha = Math.min(0.8, alpha + boost * 0.5);
        }

        const idx = lineCount * 6;
        positionsArray[idx] = a.position.x;
        positionsArray[idx + 1] = a.position.y;
        positionsArray[idx + 2] = a.position.z;
        positionsArray[idx + 3] = b.position.x;
        positionsArray[idx + 4] = b.position.y;
        positionsArray[idx + 5] = b.position.z;

        // HDR line colors for bloom pickup
        const lineColor =
          cursorDist < CONFIG.CURSOR_RADIUS
            ? CONFIG.COLORS.lineActive
            : CONFIG.COLORS.line;
        const intensity = cursorDist < CONFIG.CURSOR_RADIUS ? alpha * 2.5 : alpha * 1.5;

        colorsArray[idx] = lineColor.r * intensity;
        colorsArray[idx + 1] = lineColor.g * intensity;
        colorsArray[idx + 2] = lineColor.b * intensity;
        colorsArray[idx + 3] = lineColor.r * intensity;
        colorsArray[idx + 4] = lineColor.g * intensity;
        colorsArray[idx + 5] = lineColor.b * intensity;

        lineCount++;
      }
    }

    // Zero out unused
    for (let i = lineCount * 6; i < maxLines * 6; i++) {
      positionsArray[i] = 0;
      colorsArray[i] = 0;
    }

    lineRef.current.setAttribute(
      "position",
      new THREE.BufferAttribute(positionsArray.slice(0, lineCount * 6), 3)
    );
    lineRef.current.setAttribute(
      "color",
      new THREE.BufferAttribute(colorsArray.slice(0, lineCount * 6), 3)
    );
    lineRef.current.computeBoundingSphere();
  });

  return (
    <lineSegments frustumCulled={false}>
      <bufferGeometry ref={lineRef} />
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={1}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </lineSegments>
  );
}

// ── Manifold Field ────────────────────────────────────────────────────────────

function ManifoldField() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const shaderArgs = useMemo(
    () => ({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: CONFIG.COLORS.manifold },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }
        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p *= 2.0;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec2 uv = vUv * 3.0;
          float n = fbm(uv + uTime * 0.05);
          float n2 = fbm(uv * 1.5 - uTime * 0.03 + 10.0);
          float combined = n * 0.6 + n2 * 0.4;
          float alpha = combined * 0.08;
          float edgeFade = smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x)
                         * smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
          alpha *= edgeFade;
          gl_FragColor = vec4(uColor * 1.5, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
    }),
    []
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh position={[0, 0, -4]} frustumCulled={false}>
      <planeGeometry args={[35, 25, 1, 1]} />
      <shaderMaterial ref={materialRef} {...shaderArgs} />
    </mesh>
  );
}

// ── Camera Controller ─────────────────────────────────────────────────────────

function CameraController({
  cursorRef,
}: {
  cursorRef: React.MutableRefObject<THREE.Vector3>;
}) {
  const { camera, pointer } = useThree();
  const targetPosition = useMemo(() => new THREE.Vector3(0, 0, 18), []);
  const targetLookAt = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame(() => {
    targetPosition.x = pointer.x * CONFIG.CAMERA_SENSITIVITY;
    targetPosition.y = pointer.y * CONFIG.CAMERA_SENSITIVITY * 0.6;
    targetPosition.z = 18;

    camera.position.lerp(targetPosition, CONFIG.CAMERA_DAMPING);
    camera.lookAt(targetLookAt);
  });

  return null;
}

// ── Cursor Tracker ────────────────────────────────────────────────────────────

function CursorTracker({
  cursorRef,
}: {
  cursorRef: React.MutableRefObject<THREE.Vector3>;
}) {
  const { camera, pointer } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    []
  );

  useFrame(() => {
    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(plane, _cursorWorld);
    cursorRef.current.lerp(_cursorWorld, 0.1);
  });

  return null;
}

// ── Main Scene ────────────────────────────────────────────────────────────────

function Scene() {
  const nodes = useMemo(() => generateNodes(), []);
  const cursorRef = useRef(new THREE.Vector3(100, 100, 100));

  return (
    <>
      <CameraController cursorRef={cursorRef} />
      <CursorTracker cursorRef={cursorRef} />
      <ManifoldField />
      <ConstellationNodes nodes={nodes} cursorRef={cursorRef} />
      <ConstellationLines nodes={nodes} cursorRef={cursorRef} />

      {/* Bloom postprocessing for the ethereal glow */}
      <EffectComposer>
        <Bloom
          intensity={0.4}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.9}
          mipmapBlur
          radius={0.6}
        />
      </EffectComposer>
    </>
  );
}

// ── Exported Component ────────────────────────────────────────────────────────

export default function ConstellationScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 18], fov: 50, near: 0.1, far: 100 }}
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      }}
      style={{ background: CONFIG.COLORS.bg }}
    >
      <color attach="background" args={[CONFIG.COLORS.bg]} />
      <Scene />
    </Canvas>
  );
}
