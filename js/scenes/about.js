import { THREE, createStage, DOT, particleField } from './common.js';

// ---------- Dotted globe with animated arcs from Casablanca ----------
const canvas = document.querySelector('#hero-canvas');
const { scene, camera, size, loop } = createStage(canvas, { camZ: 9, env: false });

const R = 2.6;
const toVec = (lat, lon, r = R) => {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const th = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
};

const globe = new THREE.Group();
scene.add(globe);

// fibonacci sphere of dots
const N = 4000;
const pts = new Float32Array(N * 3);
const cols = new Float32Array(N * 3);
const home = toVec(31.8, -7.1).normalize();
const c = new THREE.Color();
for (let i = 0; i < N; i++) {
  const y = 1 - (i / (N - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const a = i * Math.PI * (3 - Math.sqrt(5));
  const v = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
  pts.set([v.x * R, v.y * R, v.z * R], i * 3);
  const near = v.dot(home);
  near > 0.985 ? c.set(0xf2643a) : near > 0.93 ? c.set(0xf2b544) : c.setRGB(0.35, 0.5, 1.0);
  cols.set([c.r, c.g, c.b], i * 3);
}
const dg = new THREE.BufferGeometry();
dg.setAttribute('position', new THREE.BufferAttribute(pts, 3));
dg.setAttribute('color', new THREE.BufferAttribute(cols, 3));
globe.add(new THREE.Points(dg, new THREE.PointsMaterial({ size: 0.11, map: DOT, vertexColors: true, transparent: true, depthWrite: false })));

// inner sphere + atmosphere
globe.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.985, 64, 64), new THREE.MeshBasicMaterial({ color: 0x070b14 })));
const atmo = new THREE.Mesh(
  new THREE.SphereGeometry(R * 1.06, 64, 64),
  new THREE.ShaderMaterial({
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    vertexShader: `varying vec3 vN; varying vec3 vV;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec3 vN; varying vec3 vV;
      void main(){ float i = pow(1.0 - max(dot(vN, vV), 0.0), 2.5); gl_FragColor = vec4(vec3(0.95,0.55,0.25) * i * 0.9, i); }`,
  })
);
scene.add(atmo);

// arcs
const CASA = [33.57, -7.59];
const cities = [[48.85, 2.35], [40.42, -3.7], [51.5, -0.12], [25.2, 55.27], [40.71, -74], [14.7, -17.4], [5.35, -4.0], [45.5, -73.56], [52.52, 13.4], [24.7, 46.7]];
const pulses = [];
cities.forEach(([lat, lon], i) => {
  const a = toVec(...CASA), b = toVec(lat, lon);
  const mid = a.clone().add(b).multiplyScalar(0.5);
  mid.normalize().multiplyScalar(R + a.distanceTo(b) * 0.45);
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  const line = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 64, 0.008, 6, false),
    new THREE.MeshBasicMaterial({ color: i % 2 ? 0xf2b544 : 0x20c9a5, transparent: true, opacity: 0.55 })
  );
  globe.add(line);
  const p = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  globe.add(p);
  const ping = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.08, 32), new THREE.MeshBasicMaterial({ color: 0xf2b544, transparent: true, side: THREE.DoubleSide }));
  ping.position.copy(b);
  ping.lookAt(0, 0, 0);
  globe.add(ping);
  pulses.push({ curve, p, ping, o: Math.random() });
});
const hq = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), new THREE.MeshBasicMaterial({ color: 0xf2643a }));
hq.position.copy(toVec(...CASA));
globe.add(hq);

scene.add(particleField(900, 40));

// start facing Morocco
globe.rotation.y = -1.2;
globe.rotation.x = 0.45;

let drag = false, lx = 0, vy = 0;
canvas.style.pointerEvents = 'auto';
canvas.addEventListener('pointerdown', (e) => { drag = true; lx = e.clientX; });
addEventListener('pointerup', () => (drag = false));
addEventListener('pointermove', (e) => { if (drag) { vy = (e.clientX - lx) * 0.004; lx = e.clientX; } });

loop((t, dt, mouse) => {
  const wide = camera.aspect > 1.25;
  globe.position.x += ((wide ? Math.min(camera.aspect * 1.6, 3.4) : 0) - globe.position.x) * 0.1;
  globe.position.y += ((wide ? -0.35 : -3) - globe.position.y) * 0.1;
  globe.scale.setScalar(wide ? Math.min(camera.aspect / 1.7, 1) : 0.6);
  atmo.position.copy(globe.position);
  atmo.scale.copy(globe.scale);

  vy *= 0.95;
  globe.rotation.y += vy + (drag ? 0 : dt * 0.06);
  globe.rotation.x += (0.45 + mouse.y * 0.15 - globe.rotation.x) * 0.05;

  pulses.forEach((pl) => {
    const k = (t * 0.25 + pl.o) % 1;
    pl.p.position.copy(pl.curve.getPoint(k));
    const s = 1 + ((t + pl.o * 3) % 1.5) * 1.6;
    pl.ping.scale.setScalar(s);
    pl.ping.material.opacity = Math.max(0, 1 - s / 3.4);
  });
  hq.scale.setScalar(1 + Math.sin(t * 4) * 0.25);

  camera.position.y += (-Math.min(scrollY / innerHeight, 1) * 1.5 - camera.position.y) * 0.05;
});
