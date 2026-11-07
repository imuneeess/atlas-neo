import { THREE, createStage, addLights, createCard, CARD_THEMES, particleField, starGeometry } from './common.js';

const INFO = {
  gold: { title: 'Atlas Gold', desc: 'Premium metal card with airport lounge access, travel insurance and 1.5% cashback on international spending.', fee: '49 MAD', cash: '1.5%', limit: '80K' },
  noir: { title: 'Noir Infinite', desc: 'Our most exclusive tier. Dedicated concierge, unlimited lounges and zero FX fees in 150+ currencies.', fee: '199 MAD', cash: '2.5%', limit: '250K' },
  majorelle: { title: 'Majorelle', desc: 'The everyday card inspired by the iconic blue of Marrakech. Instant notifications and free withdrawals.', fee: 'Free', cash: '0.5%', limit: '20K' },
  sahara: { title: 'Sahara Rose', desc: 'Built for students and young creators. Round-ups to savings, split bills and budgeting insights.', fee: 'Free', cash: '1%', limit: '10K' },
};

const canvas = document.querySelector('#card-canvas');
const { scene, camera, size, loop } = createStage(canvas, { camZ: 6.5 });
const lights = addLights(scene);

const card = createCard(CARD_THEMES.gold);
scene.add(card);

// pedestal ring + floating stars
const ringMat = new THREE.MeshBasicMaterial({ color: 0xf2b544, transparent: true, opacity: 0.4 });
const rings = [1.9, 2.3, 2.7].map((r, i) => {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.006, 8, 160), ringMat.clone());
  m.material.opacity = 0.4 - i * 0.1;
  m.rotation.x = Math.PI / 2;
  m.position.y = -1.7;
  scene.add(m);
  return m;
});
const starMat = new THREE.MeshStandardMaterial({ color: 0xf2b544, metalness: 1, roughness: 0.25 });
const minis = Array.from({ length: 6 }, (_, i) => {
  const m = new THREE.Mesh(starGeometry(0.18, 0.13, 0.05), starMat);
  m.userData.o = (i / 6) * Math.PI * 2;
  scene.add(m);
  return m;
});
scene.add(particleField(600, 20));

// ---- drag to rotate (with inertia) ----
let rotY = -0.4, rotX = 0.1, velY = 0, velX = 0, dragging = false, lastX = 0, lastY = 0, flip = 0;
canvas.addEventListener('pointerdown', (e) => {
  dragging = true; lastX = e.clientX; lastY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  velY = (e.clientX - lastX) * 0.01;
  velX = (e.clientY - lastY) * 0.006;
  lastX = e.clientX; lastY = e.clientY;
});
const end = () => (dragging = false);
canvas.addEventListener('pointerup', end);
canvas.addEventListener('pointercancel', end);
canvas.addEventListener('dblclick', () => (flip += Math.PI));
document.querySelector('#flip-btn')?.addEventListener('click', () => (flip += Math.PI));

// ---- theme switching ----
let spin = 0, pending = null;
const title = document.querySelector('#card-title');
const desc = document.querySelector('#card-desc');
const meta = document.querySelector('.card-meta');
document.querySelectorAll('.swatch').forEach((sw) => {
  sw.addEventListener('click', () => {
    const key = sw.dataset.theme;
    document.querySelectorAll('.swatch').forEach((s) => s.classList.toggle('active', s === sw));
    pending = key;
    spin = 1;
    const info = INFO[key];
    title.textContent = info.title;
    desc.textContent = info.desc;
    meta.querySelector('[data-k=fee]').textContent = info.fee;
    meta.querySelector('[data-k=cash]').textContent = info.cash;
    meta.querySelector('[data-k=limit]').textContent = info.limit + ' MAD';
    [title, desc, meta].forEach((el) => { el.classList.remove('fade-swap'); void el.offsetWidth; el.classList.add('fade-swap'); });
    const edge = new THREE.Color(CARD_THEMES[key].edge);
    rings.forEach((r) => r.material.color.copy(edge));
    lights.rim.color.copy(edge);
  });
});

let spinAngle = 0;
loop((t, dt, mouse) => {
  if (!dragging) {
    velY *= 0.94; velX *= 0.9;
    rotY += 0.003; // idle auto-rotate
    rotX += (0.1 - rotX) * 0.03;
  }
  rotY += velY;
  rotX = THREE.MathUtils.clamp(rotX + velX, -0.8, 0.8);

  // spin transition when theme changes: swap texture at the midpoint
  if (spin > 0) {
    spin = Math.max(0, spin - dt * 1.4);
    spinAngle = (1 - spin) * Math.PI * 2;
    if (pending && spin < 0.5) { card.userData.setTheme(CARD_THEMES[pending]); pending = null; }
  } else spinAngle = 0;
  const pop = spin > 0 ? Math.sin(spin * Math.PI) * 0.15 : 0;

  card.rotation.y += (rotY + flip + spinAngle - card.rotation.y) * 0.12;
  card.rotation.x = rotX + mouse.y * 0.1;
  card.position.y = Math.sin(t * 1.2) * 0.12 + pop;
  card.scale.setScalar((size.w < 500 ? 0.75 : 1) * (1 + pop));

  rings.forEach((r, i) => { r.scale.setScalar(1 + Math.sin(t * 1.5 + i) * 0.03); r.rotation.z = t * (0.1 + i * 0.05); });
  minis.forEach((m, i) => {
    const a = m.userData.o + t * 0.4;
    m.position.set(Math.cos(a) * 2.6, Math.sin(t + i) * 0.6, Math.sin(a) * 1.2);
    m.rotation.set(t, t * 1.3, 0);
  });
  camera.position.x = mouse.x * 0.4;
  camera.lookAt(0, 0, 0);
});
