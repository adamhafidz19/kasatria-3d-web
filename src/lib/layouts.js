import * as THREE from 'three';
import { LAYOUT } from '../config.js';

function createTarget(x = 0, y = 0, z = 0) {
  const target = new THREE.Object3D();
  target.position.set(x, y, z);
  return target;
}

export function generateTableTargets(count) {
  const { COLS, ROWS, X_SPACING, Y_SPACING } = LAYOUT.TABLE;
  const targets = [];

  for (let i = 0; i < count; i += 1) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = (col - (COLS - 1) / 2) * X_SPACING;
    const y = ((ROWS - 1) / 2 - row) * Y_SPACING;

    targets.push(createTarget(x, y, 0));
  }

  return targets;
}

export function generateSphereTargets(count) {
  const { RADIUS } = LAYOUT.SPHERE;
  const targets = [];
  const lookTarget = new THREE.Vector3();

  for (let i = 0; i < count; i += 1) {
    const phi = Math.acos(-1 + (2 * i) / count);
    const theta = Math.sqrt(count * Math.PI) * phi;
    const target = new THREE.Object3D();

    target.position.setFromSphericalCoords(RADIUS, phi, theta);
    lookTarget.copy(target.position).multiplyScalar(2);
    target.lookAt(lookTarget);
    targets.push(target);
  }

  return targets;
}

export function generateHelixTargets(count) {
  const { RADIUS, ANGLE_STEP, Y_STEP, Y_OFFSET } = LAYOUT.HELIX;
  const targets = [];
  const lookTarget = new THREE.Vector3();

  for (let i = 0; i < count; i += 1) {
    const pairIndex = Math.floor(i / 2);
    const strand = i % 2;
    const theta = pairIndex * ANGLE_STEP + Math.PI + strand * Math.PI;
    const y = -(pairIndex * Y_STEP) + Y_OFFSET;
    const target = new THREE.Object3D();

    target.position.setFromCylindricalCoords(RADIUS, theta, y);
    lookTarget.set(
      target.position.x * 2,
      target.position.y,
      target.position.z * 2
    );
    target.lookAt(lookTarget);
    targets.push(target);
  }

  return targets;
}

export function generateGridTargets(count) {
  const { X, Y, Z, X_SPACING, Y_SPACING, Z_SPACING } = LAYOUT.GRID;
  const layerSize = X * Y;
  const targets = [];

  for (let i = 0; i < count; i += 1) {
    const xIndex = i % X;
    const yIndex = Math.floor(i / X) % Y;
    const zIndex = Math.floor(i / layerSize) % Z;
    const x = (xIndex - (X - 1) / 2) * X_SPACING;
    const y = ((Y - 1) / 2 - yIndex) * Y_SPACING;
    const z = (zIndex - (Z - 1) / 2) * Z_SPACING;

    targets.push(createTarget(x, y, z));
  }

  return targets;
}

export function generateAllTargets(count) {
  return {
    table: generateTableTargets(count),
    sphere: generateSphereTargets(count),
    helix: generateHelixTargets(count),
    grid: generateGridTargets(count),
  };
}
