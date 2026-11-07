import { THREE, createStage, addLights, starGeometry, particleField } from './common.js';

// ---------- Background: morphing torus knot + glass stars ----------
const canvas = document.querySelector('#bg-canvas');
const { scene, camera, size, loop } = createStage(canvas, { camZ: 10 });
addLights(scene);

const knot = new THREE.Mesh(
  new THREE.TorusKnotGeometry(2.2, 0.55, 260, 32, 2, 3),
  new THREE.MeshPhysicalMaterial({ color: 0xf2643a, metalness: 0.6, roughness: 0.18, clearcoat: 1, transparent: true, opacity: 0.85, iridescence: 0.6, iridescenceIOR: 1.4 })
);
const wire = new THREE.Mesh(
  new THREE.TorusKnotGeometry(2.2, 0.75, 120, 12, 2, 3),
  new THREE.MeshBasicMaterial({ color: 0xf2b544, wireframe: true, transparent: true, opacity: 0.08 })
);
const group = new THREE.Group();
group.add(knot, wire);
scene.add(group);

const glass = new THREE.MeshStandardMaterial({ color: 0xf2b544, metalness: 1, roughness: 0.25 });
const geo = starGeometry(0.6, 0.43, 0.2);
const floaters = Array.from({ length: 6 }, (_, i) => {
  const m = new THREE.Mesh(geo, glass);
  m.userData = { a: (i / 6) * Math.PI * 2, r: 4 + (i % 2) };
  scene.add(m);
  return m;
});
scene.add(particleField(1000, 30));

// react to form focus: knot speeds up and turns gold
let energy = 0, target = 0;
document.querySelectorAll('.form input, .form textarea, .form select').forEach((el) => {
  el.addEventListener('focus', () => (target = 1));
  el.addEventListener('blur', () => (target = 0));
  el.addEventListener('input', () => (energy = Math.min(energy + 0.15, 1.6)));
});
const cA = new THREE.Color(0xf2643a), cB = new THREE.Color(0xf2b544);

loop((t, dt, mouse) => {
  energy += (target - energy) * 0.04;
  const wide = camera.aspect > 1.25;
  group.position.x += ((wide ? 0.6 : 0) - group.position.x) * 0.1;
  group.position.y = Math.sin(t * 0.4) * 0.3;
  group.position.z = -6;
  group.scale.setScalar(wide ? 1 : 0.7);
  group.rotation.x = t * (0.15 + energy * 0.3) + mouse.y * 0.3;
  group.rotation.y = t * (0.2 + energy * 0.4) + mouse.x * 0.3;
  knot.material.color.copy(cA).lerp(cB, Math.min(energy, 1));
  floaters.forEach((f, i) => {
    const a = f.userData.a + t * 0.2;
    f.position.set(Math.cos(a) * f.userData.r * 1.6, Math.sin(a * 1.3) * 3, Math.sin(a) * 2 - 4);
    f.rotation.set(t * 0.5 + i, t * 0.7, 0);
  });
});

// ---------- Form (demo only: nothing is sent) ----------
const form = document.querySelector('#contact-form');
const toast = document.querySelector('.toast');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  form.reset();
  toast.classList.add('show');
  energy = 2;
  setTimeout(() => toast.classList.remove('show'), 3500);
});
