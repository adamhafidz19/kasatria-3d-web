import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { ANIMATION, CAMERA, NET_WORTH_TIERS } from '../config.js';
import { generateAllTargets } from '../lib/layouts.js';
import { createTile } from '../lib/tile.js';

const LAYOUTS = [
  { id: 'table', label: 'Table' },
  { id: 'sphere', label: 'Sphere' },
  { id: 'helix', label: 'Helix' },
  { id: 'grid', label: 'Grid' },
];

const LEGEND = [
  { tier: 'low', ...NET_WORTH_TIERS.low },
  { tier: 'medium', ...NET_WORTH_TIERS.medium },
  { tier: 'high', ...NET_WORTH_TIERS.high },
];

export default function PeriodicTable({ people, headerActions }) {
  const mountRef = useRef(null);
  const layoutRef = useRef(null);
  const [activeLayout, setActiveLayout] = useState('table');

  useEffect(() => {
    const container = mountRef.current;
    if (!container || people.length === 0) {
      return undefined;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      CAMERA.FOV,
      container.clientWidth / container.clientHeight,
      CAMERA.NEAR,
      CAMERA.FAR
    );
    camera.position.set(0, 0, CAMERA.INITIAL_Z);

    const renderer = new CSS3DRenderer();
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.domElement.className = 'css3d-layer';
    container.appendChild(renderer.domElement);

    const controls = new TrackballControls(camera, renderer.domElement);
    controls.minDistance = CAMERA.MIN_DISTANCE;
    controls.maxDistance = CAMERA.MAX_DISTANCE;
    controls.rotateSpeed = 2.2;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.6;

    const objects = people.map((person) => {
      const object = new CSS3DObject(createTile(person));
      object.position.set(
        Math.random() * 4000 - 2000,
        Math.random() * 4000 - 2000,
        Math.random() * 4000 - 2000
      );
      scene.add(object);
      return object;
    });

    const targets = generateAllTargets(people.length);
    const tweenGroup = new TWEEN.Group();
    const render = () => renderer.render(scene, camera);

    const applyLayout = (name) => {
      const layoutTargets = targets[name];

      if (!layoutTargets) {
        return;
      }

      tweenGroup.removeAll();

      objects.forEach((object, index) => {
        const target = layoutTargets[index];

        if (!target) {
          return;
        }

        const duration =
          ANIMATION.DEFAULT_DURATION * (0.65 + Math.random() * 0.7);

        new TWEEN.Tween(object.position, tweenGroup)
          .to(
            {
              x: target.position.x,
              y: target.position.y,
              z: target.position.z,
            },
            duration
          )
          .easing(TWEEN.Easing.Exponential.InOut)
          .start();

        new TWEEN.Tween(object.rotation, tweenGroup)
          .to(
            {
              x: target.rotation.x,
              y: target.rotation.y,
              z: target.rotation.z,
            },
            duration
          )
          .easing(TWEEN.Easing.Exponential.InOut)
          .start();
      });

      const frame = CAMERA.FRAMES[name];

      if (frame) {
        const frameDuration = ANIMATION.DEFAULT_DURATION * 0.9;

        new TWEEN.Tween(camera.position, tweenGroup)
          .to(
            {
              x: frame.position[0],
              y: frame.position[1],
              z: frame.position[2],
            },
            frameDuration
          )
          .easing(TWEEN.Easing.Exponential.InOut)
          .start();

        new TWEEN.Tween(controls.target, tweenGroup)
          .to(
            {
              x: frame.target[0],
              y: frame.target[1],
              z: frame.target[2],
            },
            frameDuration
          )
          .easing(TWEEN.Easing.Exponential.InOut)
          .start();
      }

      new TWEEN.Tween({ opacity: 0 }, tweenGroup)
        .to({ opacity: 1 }, ANIMATION.DEFAULT_DURATION * 2)
        .onUpdate(render)
        .onComplete(render)
        .start();

      setActiveLayout(name);
    };

    layoutRef.current = applyLayout;

    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      tweenGroup.update();
      controls.update();
    };

    const onResize = () => {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      render();
    };

    controls.addEventListener('change', render);
    window.addEventListener('resize', onResize);

    applyLayout('table');
    animate();
    onResize();

    return () => {
      cancelAnimationFrame(frameId);
      tweenGroup.removeAll();
      layoutRef.current = null;
      controls.removeEventListener('change', render);
      controls.dispose();
      window.removeEventListener('resize', onResize);
      scene.traverse((object) => {
        if (object.isCSS3DObject) {
          object.element.remove();
        }
      });
      scene.clear();
      renderer.domElement.remove();
    };
  }, [people]);

  return (
    <div className="scene-shell">
      <div ref={mountRef} className="scene-canvas" />

      <header className="scene-header">
        <div className="scene-brand">
          <span className="scene-brand-mark">Kasatria</span>
          <span className="scene-brand-subtitle">3D Data Visualization</span>
        </div>
        <div className="scene-header-actions">
          <span className="scene-count">{people.length} records</span>
          {headerActions}
        </div>
      </header>

      <aside className="legend" aria-label="Net worth color legend">
        <span className="legend-title">Net Worth</span>
        {LEGEND.map((item) => (
          <span className="legend-item" key={item.tier}>
            <span className={`legend-swatch ${item.tier}`} />
            <span>{item.label}</span>
          </span>
        ))}
      </aside>

      <nav className="menu" aria-label="Layout selection">
        {LAYOUTS.map((layout) => (
          <button
            key={layout.id}
            type="button"
            className={`layout-button${
              activeLayout === layout.id ? ' active' : ''
            }`}
            aria-pressed={activeLayout === layout.id}
            onClick={() => layoutRef.current?.(layout.id)}
          >
            {layout.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
