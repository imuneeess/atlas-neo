// Shared Three.js helpers
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export { THREE };
export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Creates renderer + scene + camera bound to a canvas, with resize, mouse and offscreen pausing. */
export function createStage(canvas, { camZ = 8, fov = 45, env = true } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  if (env) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  }
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 200);
  camera.position.z = camZ;

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / innerWidth) * 2 - 1;
    mouse.ty = -((e.clientY / innerHeight) * 2 - 1);
  });

  const size = { w: 1, h: 1 };
  const resize = () => {
    size.w = canvas.clientWidth || 1;
    size.h = canvas.clientHeight || 1;
    renderer.setSize(size.w, size.h, false);
    camera.aspect = size.w / size.h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  let visible = true;
  new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(canvas);

  const clock = new THREE.Clock();
  const loop = (update) => {
    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.05);
      if (!visible || document.hidden) return;
      const t = clock.elapsedTime * (reduceMotion ? 0.15 : 1);
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      update(t, dt, mouse);
      renderer.render(scene, camera);
    });
  };
  return { renderer, scene, camera, mouse, size, loop };
}

export function addLights(scene, { key = 0xffffff, rim = 0xf2643a, fill = 0x2f5bff } = {}) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const k = new THREE.DirectionalLight(key, 2.2);
  k.position.set(4, 6, 6);
  const r = new THREE.PointLight(rim, 40, 30);
  r.position.set(-5, 2, -2);
  const f = new THREE.PointLight(fill, 40, 30);
  f.position.set(5, -3, 2);
  scene.add(k, r, f);
  return { key: k, rim: r, fill: f };
}

// ---------- Card ----------
export const CARD_THEMES = {
  gold: { name: 'Atlas Gold', bg: ['#2a1a06', '#c98b22', '#f6d27a'], ink: '#1b1003', edge: 0xd9a23f, metal: 0.9 },
  noir: { name: 'Noir Infinite', bg: ['#050608', '#1b1f2a', '#3a4152'], ink: '#e9ecf3', edge: 0x2a2f3b, metal: 0.7 },
  majorelle: { name: 'Majorelle', bg: ['#0a1a6b', '#2f5bff', '#7aa2ff'], ink: '#ffffff', edge: 0x2f5bff, metal: 0.6 },
  sahara: { name: 'Sahara Rose', bg: ['#5a1f12', '#f2643a', '#ffb38a'], ink: '#fff7f0', edge: 0xf2643a, metal: 0.6 },
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawStar(ctx, cx, cy, r, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (let k = 0; k < 2; k++) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((k * Math.PI) / 4);
    ctx.strokeRect(-r, -r, r * 2, r * 2);
    ctx.restore();
  }
  ctx.restore();
}

export function cardTexture(theme, side = 'front') {
  const W = 1024, H = 646, R = 48;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  roundRect(ctx, 0, 0, W, H, R);
  ctx.clip();

  const g = ctx.createLinearGradient(0, H, W, 0);
  g.addColorStop(0, theme.bg[0]);
  g.addColorStop(0.55, theme.bg[1]);
  g.addColorStop(1, theme.bg[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // zellige pattern
  for (let y = 0; y < H + 120; y += 120)
    for (let x = (y / 120) % 2 ? 60 : 0; x < W + 120; x += 120) drawStar(ctx, x, y, 26, theme.ink, 0.07);

  // sheen
  const s = ctx.createLinearGradient(0, 0, W, H);
  s.addColorStop(0.3, 'rgba(255,255,255,0)');
  s.addColorStop(0.5, 'rgba(255,255,255,0.18)');
  s.addColorStop(0.7, 'rgba(255,255,255,0)');
  ctx.fillStyle = s;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = theme.ink;
  ctx.font = '600 30px "Space Grotesk", sans-serif';

  if (side === 'front') {
    // logo
    ctx.font = '700 46px "Space Grotesk", sans-serif';
    ctx.fillText('ATLAS', 70, 105);
    ctx.globalAlpha = 0.6;
    ctx.font = '500 46px "Space Grotesk", sans-serif';
    ctx.fillText('neo', 228, 105);
    ctx.globalAlpha = 1;
    // chip
    const cg = ctx.createLinearGradient(70, 230, 200, 330);
    cg.addColorStop(0, '#f8e3a1'); cg.addColorStop(0.5, '#c99a3b'); cg.addColorStop(1, '#f3d58a');
    ctx.fillStyle = cg;
    roundRect(ctx, 70, 220, 130, 100, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    [[70, 255, 200, 255], [70, 287, 200, 287], [135, 220, 135, 320]].forEach(([a, b, cc, d]) => {
      ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(cc, d); ctx.stroke();
    });
    // contactless
    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(240, 270, 18 + i * 16, -Math.PI / 4, Math.PI / 4);
      ctx.stroke();
    }
    // number
    ctx.fillStyle = theme.ink;
    ctx.font = '500 58px "Space Grotesk", monospace';
    ctx.fillText('5412  ••••  ••••  2026', 70, 450);
    ctx.font = '500 24px "Space Grotesk", sans-serif';
    ctx.globalAlpha = 0.7;
    ctx.fillText('CARD HOLDER', 70, 530);
    ctx.fillText('VALID THRU', 620, 530);
    ctx.globalAlpha = 1;
    ctx.font = '600 34px "Space Grotesk", sans-serif';
    ctx.fillText('YOUR NAME', 70, 575);
    ctx.fillText('11/31', 620, 575);
    // network circles
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#f2643a';
    ctx.beginPath(); ctx.arc(860, 550, 46, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2b544';
    ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.arc(920, 550, 46, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 70, W, 110);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    roundRect(ctx, 70, 240, 640, 80, 10);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.font = 'italic 600 34px "Space Grotesk", sans-serif';
    ctx.fillText('736', 740, 295);
    ctx.fillStyle = theme.ink;
    ctx.font = '500 22px "Space Grotesk", sans-serif';
    ctx.globalAlpha = 0.7;
    ctx.fillText('Concept card — Atlas Neo portfolio project. Not a real payment card.', 70, 400);
    ctx.fillText('atlas-neo.demo  •  24/7 support +000 000 000', 70, 440);
    ctx.globalAlpha = 1;
    drawStar(ctx, 880, 520, 60, theme.ink, 0.5);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Builds a 3D card: rounded extruded body + textured front and back. */
export function createCard(theme = CARD_THEMES.gold) {
  const w = 3.4, h = 2.14, r = 0.16, d = 0.035;
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 + r, -h / 2);
  shape.lineTo(w / 2 - r, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  shape.lineTo(w / 2, h / 2 - r);
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  shape.lineTo(-w / 2 + r, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  shape.lineTo(-w / 2, -h / 2 + r);
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);

  const body = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 3, curveSegments: 16 }),
    new THREE.MeshStandardMaterial({ color: theme.edge, metalness: theme.metal, roughness: 0.3 })
  );
  body.geometry.translate(0, 0, -d / 2);

  const faceMat = (tex) => new THREE.MeshPhysicalMaterial({
    map: tex, transparent: true, alphaTest: 0.5, metalness: theme.metal * 0.6, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.15,
  });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(w, h), faceMat(cardTexture(theme, 'front')));
  front.position.z = d / 2 + 0.012;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), faceMat(cardTexture(theme, 'back')));
  back.position.z = -d / 2 - 0.012;
  back.rotation.y = Math.PI;

  const group = new THREE.Group();
  group.add(body, front, back);
  group.userData = {
    setTheme(t) {
      body.material.color.setHex(t.edge);
      body.material.metalness = t.metal;
      [[front, 'front'], [back, 'back']].forEach(([m, side]) => {
        m.material.map.dispose();
        m.material.map = cardTexture(t, side);
        m.material.metalness = t.metal * 0.6;
        m.material.needsUpdate = true;
      });
    },
  };
  return group;
}

// ---------- Moroccan 8-point star ----------
export function starGeometry(outer = 1, inner = 0.72, depth = 0.25) {
  const s = new THREE.Shape();
  const n = 8;
  for (let i = 0; i <= n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const rr = i % 2 ? inner : outer;
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
    i ? s.lineTo(x, y) : s.moveTo(x, y);
  }
  const hole = new THREE.Path();
  hole.absarc(0, 0, inner * 0.45, 0, Math.PI * 2, true);
  s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 3 });
  g.center();
  return g;
}

// ---------- Particles ----------
function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.6)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
export const DOT = dotTexture();

export function particleField(count = 1500, spread = 30, colors = [0xf2b544, 0xf2643a, 0x2f5bff, 0xffffff]) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spread;
    pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
    pos[i * 3 + 2] = (Math.random() - 0.5) * spread - 4;
    c.setHex(colors[i % colors.length]);
    col.set([c.r, c.g, c.b], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({
    size: 0.09, map: DOT, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8,
  }));
}

/** Scroll progress of the page 0..1 (smoothed by caller). */
export const scrollProgress = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  return max > 0 ? scrollY / max : 0;
};
