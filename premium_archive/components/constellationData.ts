import * as THREE from "three";

// ── Tuning Constants ──────────────────────────────────────────────────────────
// Adjust these to control the look and feel of the constellation.

export const CONFIG = {
  // Node counts
  NODE_COUNT: 280,
  ANCHOR_COUNT: 12,

  // Connection lines
  LINE_DISTANCE: 3.8,
  LINE_OPACITY: 0.35,
  CROSS_CLUSTER_OPACITY: 0.08,

  // Cursor interaction
  CURSOR_RADIUS: 4.5,
  CURSOR_GLOW_STRENGTH: 2.5,
  CURSOR_ATTRACTION: 0.15,

  // Animation
  DRIFT_SPEED: 0.0015,
  DAMPING: 0.94,
  CAMERA_SENSITIVITY: 0.8,
  CAMERA_DAMPING: 0.05,

  // Colors
  COLORS: {
    bg: "#020617",
    node: new THREE.Color("#93c5fd"),
    nodeEmissive: new THREE.Color("#3b82f6"),
    anchor: new THREE.Color("#60a5fa"),
    anchorEmissive: new THREE.Color("#2563eb"),
    line: new THREE.Color("#38bdf8"),
    lineActive: new THREE.Color("#60a5fa"),
    glow: new THREE.Color("#38bdf8"),
    manifold: new THREE.Color("#1e3a5f"),
  },
} as const;

// ── Zone Definitions ──────────────────────────────────────────────────────────
// Three spatial clusters representing Brain, Body, and Environment.

export interface Zone {
  name: string;
  center: THREE.Vector3;
  radius: number;
  nodeCount: number;
  anchorCount: number;
}

export const ZONES: Zone[] = [
  {
    name: "brain",
    center: new THREE.Vector3(-5, 3, 0),
    radius: 4.5,
    nodeCount: 100,
    anchorCount: 4,
  },
  {
    name: "body",
    center: new THREE.Vector3(4, -1, 1),
    radius: 5,
    nodeCount: 90,
    anchorCount: 4,
  },
  {
    name: "environment",
    center: new THREE.Vector3(0, -4, -2),
    radius: 5.5,
    nodeCount: 90,
    anchorCount: 4,
  },
];

// ── Node Data ─────────────────────────────────────────────────────────────────

export interface NodeData {
  position: THREE.Vector3;
  basePosition: THREE.Vector3;
  velocity: THREE.Vector3;
  isAnchor: boolean;
  zone: number;
  size: number;
  phase: number; // for individual animation offset
}

function randomInSphere(center: THREE.Vector3, radius: number): THREE.Vector3 {
  const u = Math.random();
  const v = Math.random();
  const theta = u * 2 * Math.PI;
  const phi = Math.acos(2 * v - 1);
  const r = radius * Math.cbrt(Math.random());
  return new THREE.Vector3(
    center.x + r * Math.sin(phi) * Math.cos(theta),
    center.y + r * Math.sin(phi) * Math.sin(theta),
    center.z + r * Math.cos(phi)
  );
}

export function generateNodes(): NodeData[] {
  const nodes: NodeData[] = [];

  ZONES.forEach((zone, zoneIdx) => {
    // Anchors
    for (let i = 0; i < zone.anchorCount; i++) {
      const pos = randomInSphere(zone.center, zone.radius * 0.5);
      nodes.push({
        position: pos.clone(),
        basePosition: pos.clone(),
        velocity: new THREE.Vector3(),
        isAnchor: true,
        zone: zoneIdx,
        size: 0.08 + Math.random() * 0.04,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Regular nodes
    for (let i = 0; i < zone.nodeCount; i++) {
      const pos = randomInSphere(zone.center, zone.radius);
      nodes.push({
        position: pos.clone(),
        basePosition: pos.clone(),
        velocity: new THREE.Vector3(),
        isAnchor: false,
        zone: zoneIdx,
        size: 0.025 + Math.random() * 0.025,
        phase: Math.random() * Math.PI * 2,
      });
    }
  });

  return nodes;
}
