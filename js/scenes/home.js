import { THREE, createStage, addLights, createCard, CARD_THEMES, starGeometry, particleField } from './common.js';

// ---------- Hero: floating card + orbiting zellige stars ----------
{
  const canvas = document.querySelector('#hero-canvas');
  const { scene, camera, size, loop } = createStage(canvas, { camZ: 9 });
  addLights(scene);

  const rig = new THREE.Group();
  scene.add(rig);

  const card = createCard(CARD_THEMES.gold);
  card.rotation.set(-0.2, -0.5, 0.15);
  rig.add(card);

  const card2 = createCard(CARD_THEMES.majorelle);
  card2.position.set(-0.9, -0.7, -1.4);
  card2.rotation.set(-0.1, -0.3, 0.35);
  card2.scale.setScalar(0.85);
  rig.add(card2);

  const starMat = new THREE.MeshStandardMaterial({ color: 0xf2b544, metalness: 1, roughness: 0.22 });
  const starMat2 = new THREE.MeshStandardMaterial({ color: 0xf2643a, metalness: 0.8, roughness: 0.3 });
  const geo = starGeometry(0.5, 0.36, 0.12);
  const stars = [];
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(geo, i % 3 ? starMat : starMat2);
    m.userData = { r: 3 + Math.random() * 1.8, s: 0.15 + Math.random() * 0.25, o: (i / 9) * Math.PI * 2, y: (Math.random() - 0.5) * 3 };
    m.scale.setScalar(0.4 + Math.random() * 0.6);
    rig.add(m);
    stars.push(m);
  }

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.6, 0.008, 8, 200),
    new THREE.MeshBasicMaterial({ color: 0xf2b544, transparent: true, opacity: 0.35 })
  );
  ring.rotation.x = Math.PI / 2.3;
  rig.add(ring);

  const dust = particleField(1800, 34);
  scene.add(dust);

  let scroll = 0;
  loop((t, dt, mouse) => {
    const wide = camera.aspect > 1.25;
    rig.position.x += ((wide ? Math.min(camera.aspect * 1.6, 3.4) : 0) - rig.position.x) * 0.1;
    rig.position.y += ((wide ? 0 : -2.6) - rig.position.y) * 0.1;
    rig.scale.setScalar(wide ? Math.min(camera.aspect / 1.7, 1) : 0.55);

    scroll += (Math.min(scrollY / innerHeight, 1) - scroll) * 0.08;

    card.position.y = Math.sin(t * 1.1) * 0.15;
    card.rotation.y = -0.5 + mouse.x * 0.5 + scroll * Math.PI * 1.2 + Math.sin(t * 0.5) * 0.08;
    card.rotation.x = -0.2 - mouse.y * 0.35;
    card2.position.y = -0.7 + Math.sin(t * 0.9 + 1) * 0.12;
    card2.rotation.y = -0.3 + mouse.x * 0.3 - scroll * 0.8;

    stars.forEach((s) => {
      const { r, s: sp, o, y } = s.userData;
      const a = o + t * sp;
      s.position.set(Math.cos(a) * r, y + Math.sin(t + o) * 0.3, Math.sin(a) * r * 0.6);
      s.rotation.x += dt * 0.6;
      s.rotation.y += dt * 0.9;
    });
    ring.rotation.z = t * 0.1;

    dust.rotation.y = t * 0.02;
    camera.position.x += (mouse.x * 0.6 - camera.position.x) * 0.05;
    camera.position.y += (mouse.y * 0.4 - scroll * 2 - camera.position.y) * 0.05;
    camera.lookAt(0, -scroll * 2, 0);
  });
}

// ---------- Security viz: shield vault ----------
{
  const canvas = document.querySelector('#vault-canvas');
  if (canvas) {
    const { scene, camera, loop } = createStage(canvas, { camZ: 6 });
    addLights(scene, { rim: 0x20c9a5 });

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1, 4),
      new THREE.MeshPhysicalMaterial({ color: 0x2f5bff, metalness: 0.2, roughness: 0.1, transmission: 0.6, thickness: 1, clearcoat: 1, emissive: 0x0b1a66 })
    );
    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.7, 1),
      new THREE.MeshBasicMaterial({ color: 0xf2b544, wireframe: true, transparent: true, opacity: 0.5 })
    );
    const outer = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.2, 2),
      new THREE.MeshBasicMaterial({ color: 0x20c9a5, wireframe: true, transparent: true, opacity: 0.12 })
    );
    const orbit = new THREE.Group();
    const lock = new THREE.Mesh(starGeometry(0.3, 0.22, 0.08), new THREE.MeshStandardMaterial({ color: 0xf2b544, metalness: 1, roughness: 0.2 }));
    lock.position.x = 2.2;
    orbit.add(lock);
    scene.add(core, shell, outer, orbit);

    loop((t, dt, mouse) => {
      core.rotation.y = t * 0.3;
      shell.rotation.set(t * 0.2, t * 0.25, 0);
      outer.rotation.set(-t * 0.1, -t * 0.12, 0);
      const s = 1 + Math.sin(t * 2) * 0.04;
      core.scale.setScalar(s);
      orbit.rotation.set(0.4, t * 0.8, 0.2);
      lock.rotation.z = t * 2;
      camera.position.x = mouse.x * 0.8;
      camera.position.y = mouse.y * 0.5;
      camera.lookAt(0, 0, 0);
    });
  }
}
