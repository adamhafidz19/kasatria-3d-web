import test from 'node:test';
import assert from 'node:assert/strict';
import { LAYOUT } from '../config.js';
import {
  generateAllTargets,
  generateGridTargets,
  generateHelixTargets,
  generateSphereTargets,
  generateTableTargets,
} from './layouts.js';

const COUNT = 200;
const EPSILON = 1e-6;

function assertClose(actual, expected, message) {
  assert.ok(
    Math.abs(actual - expected) < EPSILON,
    `${message}: expected ${expected}, received ${actual}`
  );
}

test('table uses a 20x10 grid', () => {
  const targets = generateTableTargets(COUNT);
  const { COLS, X_SPACING, Y_SPACING } = LAYOUT.TABLE;

  assert.equal(targets.length, COUNT);
  assertClose(targets[0].position.x, (-(COLS - 1) / 2) * X_SPACING, 'first x');
  assertClose(targets[0].position.y, 4.5 * Y_SPACING, 'first y');
  assertClose(targets[19].position.x, 9.5 * X_SPACING, 'last column x');
  assertClose(targets[20].position.y, 3.5 * Y_SPACING, 'second row y');
  assertClose(targets[199].position.x, 9.5 * X_SPACING, 'final x');
  assertClose(targets[199].position.y, -4.5 * Y_SPACING, 'final y');
});

test('sphere places every target on the configured radius', () => {
  const targets = generateSphereTargets(COUNT);

  assert.equal(targets.length, COUNT);
  targets.forEach((target, index) => {
    assertClose(target.position.length(), LAYOUT.SPHERE.RADIUS, `radius ${index}`);
  });
});

test('helix creates two opposing strands with paired heights', () => {
  const targets = generateHelixTargets(COUNT);

  assert.equal(targets.length, COUNT);
  assertClose(targets[0].position.y, targets[1].position.y, 'paired height');
  assertClose(targets[0].position.x, -targets[1].position.x, 'opposite x');
  assertClose(targets[0].position.z, -targets[1].position.z, 'opposite z');
  assertClose(
    Math.hypot(targets[0].position.x, targets[0].position.z),
    LAYOUT.HELIX.RADIUS,
    'helix radius'
  );

  const heights = new Set(targets.map((target) => target.position.y.toFixed(4)));
  assert.equal(heights.size, COUNT / 2);

  for (let i = 0; i < targets.length - 2; i += 2) {
    const current = targets[i].position;
    const nextOnStrand = targets[i + 2].position;
    const spacing = Math.hypot(
      nextOnStrand.x - current.x,
      nextOnStrand.y - current.y,
      nextOnStrand.z - current.z
    );

    assert.ok(spacing > 250, `strand spacing ${i} was only ${spacing}`);
  }
});

test('grid has 5 columns, 4 rows, and 10 layers', () => {
  const targets = generateGridTargets(COUNT);
  const { X, Y, Z, X_SPACING, Y_SPACING, Z_SPACING } = LAYOUT.GRID;

  assert.equal(targets.length, COUNT);
  assert.equal(X * Y * Z, COUNT);

  assertClose(targets[0].position.x, (-(X - 1) / 2) * X_SPACING, 'first x');
  assertClose(targets[0].position.y, ((Y - 1) / 2) * Y_SPACING, 'first y');
  assertClose(targets[0].position.z, (-(Z - 1) / 2) * Z_SPACING, 'first z');
  assertClose(targets[199].position.x, ((X - 1) / 2) * X_SPACING, 'final x');
  assertClose(targets[199].position.y, (-(Y - 1) / 2) * Y_SPACING, 'final y');
  assertClose(targets[199].position.z, ((Z - 1) / 2) * Z_SPACING, 'final z');

  const layers = new Set(targets.map((target) => target.position.z.toFixed(4)));
  assert.equal(layers.size, Z);
  assert.equal(targets.filter((target) => target.position.z === targets[0].position.z).length, X * Y);
});

test('generateAllTargets returns all four layouts', () => {
  const targets = generateAllTargets(COUNT);

  assert.deepEqual(Object.keys(targets), ['table', 'sphere', 'helix', 'grid']);
  Object.values(targets).forEach((layout) => {
    assert.equal(layout.length, COUNT);
  });
});
