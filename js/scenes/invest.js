import { THREE, createStage, addLights, starGeometry } from './common.js';

// ---------- Hero: shader wave terrain + floating coins ----------
{
  const canvas = document.querySelector('#hero-canvas');
  const { scene, camera, size, loop } = createStage(canvas, { camZ: 10, fov: 50 });
  addLights(scene);
  camera.position.set(0, 3, 10);

  const COLS = 160, ROWS = 90;
  const pos = new Float32Array(COLS * ROWS * 3);
  for (let i = 0; i < ROWS; i++)
    for (let j = 0; j < COLS; j++) {
      const k = (i * COLS + j) * 3;
      pos[k] = (j / COLS - 0.5) * 40;
      pos[k + 1] = 0;
      pos[k + 2] = (i / ROWS - 0.5) * 24;
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const uniforms = { uTime: { value: 0 }, uMouse: { value: new THREE.Vector2() }, uPixel: { value: Math.min(devicePixelRatio, 2) } };
  const wave = new THREE.Points(geo, new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uTime; uniform vec2 uMouse; uniform float uPixel;
      varying float vH; varying float vD;
      void main() {
        vec3 p = position;
        float h = sin(p.x * 0.35 + uTime * 0.9) * 0.6
                + cos(p.z * 0.45 + uTime * 0.7) * 0.5
                + sin((p.x + p.z) * 0.18 + uTime * 0.5) * 0.9;
        float md = distance(p.xz, uMouse * vec2(18.0, 10.0));
        h += exp(-md * md * 0.04) * 1.6;
        p.y = h - 2.5;
        vH = h;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vD = -mv.z;
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uPixel * (3.0 + h) * (14.0 / vD);
      }`,
    fragmentShader: /* glsl */ `
      varying float vH; varying float vD;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        vec3 low = vec3(0.18, 0.36, 1.0);
        vec3 high = vec3(0.95, 0.71, 0.27);
        vec3 c = mix(low, high, smoothstep(-1.0, 2.0, vH));
        float fade = smoothstep(32.0, 6.0, vD);
        gl_FragColor = vec4(c, (1.0 - d * 2.0) * fade * 0.9);
      }`,
  }));
  scene.add(wave);

  // coins
  const coinGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.1, 48);
  const coinMat = new THREE.MeshStandardMaterial({ color: 0xf2b544, metalness: 1, roughness: 0.25 });
  const emblem = starGeometry(0.32, 0.24, 0.04);
  const coins = Array.from({ length: 7 }, (_, i) => {
    const g = new THREE.Group();
    const c = new THREE.Mesh(coinGeo, coinMat);
    c.rotation.x = Math.PI / 2;
    const e = new THREE.Mesh(emblem, coinMat);
    e.position.z = 0.06;
    const e2 = e.clone(); e2.position.z = -0.06;
    g.add(c, e, e2);
    g.userData = { x: 1.5 + i * 1.2 + (Math.random() - 0.5), y: -0.5 + Math.random() * 2, z: -1 - Math.random() * 4, sp: 0.6 + Math.random() };
    g.scale.setScalar(0.6 + Math.random() * 0.6);
    scene.add(g);
    return g;
  });

  loop((t, dt, mouse) => {
    uniforms.uTime.value = t;
    uniforms.uMouse.value.lerp(new THREE.Vector2(mouse.x, -mouse.y), 0.08);
    const mobile = size.w < 760;
    coins.forEach((c, i) => {
      const u = c.userData;
      c.position.set(mobile ? (u.x - 5) * 0.6 : u.x, u.y + Math.sin(t * u.sp + i) * 0.4, u.z);
      c.rotation.y = t * u.sp;
      c.rotation.z = Math.sin(t * 0.5 + i) * 0.3;
    });
    const s = Math.min(scrollY / innerHeight, 1);
    camera.position.x += (mouse.x * 1.5 - camera.position.x) * 0.04;
    camera.position.y += (3 + mouse.y * 0.8 + s * 3 - camera.position.y) * 0.04;
    camera.lookAt(0, -1 - s, 0);
  });
}

// ---------- Savings calculator ----------
{
  const $ = (s) => document.querySelector(s);
  const inputs = { start: $('#c-start'), monthly: $('#c-monthly'), years: $('#c-years'), rate: $('#c-rate') };
  const bars = $('#bars');
  const fmt = (n) => Math.round(n).toLocaleString('en-US') + ' MAD';

  function calc() {
    const P = +inputs.start.value, M = +inputs.monthly.value, Y = +inputs.years.value, r = +inputs.rate.value / 100;
    $('#v-start').textContent = fmt(P);
    $('#v-monthly').textContent = fmt(M);
    $('#v-years').textContent = Y + ' yrs';
    $('#v-rate').textContent = (+inputs.rate.value).toFixed(1) + '%';

    const rows = [];
    for (let y = 1; y <= Y; y++) {
      const n = y * 12, i = r / 12;
      const total = i ? P * Math.pow(1 + i, n) + M * ((Math.pow(1 + i, n) - 1) / i) : P + M * n;
      rows.push({ total, contributed: P + M * n });
    }
    const last = rows[rows.length - 1];
    $('#r-total').textContent = fmt(last.total);
    $('#r-gain').textContent = fmt(last.total - last.contributed);

    const max = last.total;
    while (bars.children.length < Y) bars.append(Object.assign(document.createElement('div'), { className: 'bar', innerHTML: '<i></i>' }));
    while (bars.children.length > Y) bars.lastChild.remove();
    rows.forEach((row, k) => {
      const b = bars.children[k];
      b.style.height = (row.total / max) * 100 + '%';
      b.firstChild.style.height = ((row.total - row.contributed) / row.total) * 100 + '%';
      b.title = `Year ${k + 1}: ${fmt(row.total)}`;
    });
  }
  Object.values(inputs).forEach((el) => el.addEventListener('input', calc));
  calc();
}
