import * as THREE from 'three';

/* ============================================================
 * Bầu trời gradient + mặt trời + mây + hải âu + đảo xa
 * ============================================================ */

export function createSky() {
  const group = new THREE.Group();

  // --- Sky dome gradient ---
  const skyGeo = new THREE.SphereGeometry(420, 32, 20);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTop: { value: new THREE.Color('#2e7fc4') },
      uMid: { value: new THREE.Color('#8ec9ee') },
      uHorizon: { value: new THREE.Color('#f7e3b5') },
      uSunDir: { value: new THREE.Vector3(0.45, 0.32, -0.7).normalize() },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop;
      uniform vec3 uMid;
      uniform vec3 uHorizon;
      uniform vec3 uSunDir;
      varying vec3 vDir;

      void main() {
        float h = normalize(vDir).y;
        vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.18, h));
        col = mix(col, uTop, smoothstep(0.12, 0.62, h));

        // Ánh hào quang quanh mặt trời
        float sunAmt = max(dot(normalize(vDir), uSunDir), 0.0);
        col += vec3(1.0, 0.86, 0.55) * pow(sunAmt, 18.0) * 0.55;
        col += vec3(1.0, 0.75, 0.42) * pow(sunAmt, 90.0) * 0.9;

        // Dưới chân trời
        col = mix(col, uHorizon * 0.85, smoothstep(0.0, -0.08, h));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  sky.renderOrder = -10;
  group.add(sky);

  // --- Mặt trời (disc) ---
  const sunDir = skyMat.uniforms.uSunDir.value.clone();
  const sunPos = sunDir.clone().multiplyScalar(380);
  const sun = new THREE.Mesh(
    new THREE.CircleGeometry(22, 40),
    new THREE.MeshBasicMaterial({ color: 0xfff2c0, fog: false, transparent: true, opacity: 0.98 })
  );
  sun.position.copy(sunPos);
  sun.lookAt(0, 40, 0);
  sun.renderOrder = -9;
  group.add(sun);

  // Glow sprite quanh mặt trời
  const glowTex = makeRadialTexture(['rgba(255,240,190,0.9)', 'rgba(255,210,140,0.25)', 'rgba(255,200,120,0)']);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  glow.position.copy(sunPos);
  glow.scale.setScalar(180);
  glow.renderOrder = -9;
  group.add(glow);

  // --- Mây ---
  const cloudTex = makeCloudTexture();
  const clouds = [];
  for (let i = 0; i < 14; i++) {
    const mat = new THREE.SpriteMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.55 + Math.random() * 0.35,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    const angle = Math.random() * Math.PI * 2;
    const radius = 150 + Math.random() * 200;
    sprite.position.set(
      Math.cos(angle) * radius,
      55 + Math.random() * 75,
      Math.sin(angle) * radius
    );
    const s = 55 + Math.random() * 90;
    sprite.scale.set(s * (1.3 + Math.random() * 0.8), s * 0.55, 1);
    sprite.userData.speed = 0.8 + Math.random() * 1.4;
    group.add(sprite);
    clouds.push(sprite);
  }

  // --- Đảo xa ---
  const islands = new THREE.Group();
  const islandData = [
    { x: -130, z: -180, r: 38, h: 22 },
    { x: 110, z: -210, r: 46, h: 28 },
    { x: -220, z: -60, r: 30, h: 16 },
    { x: 230, z: -90, r: 36, h: 19 },
    { x: -60, z: -260, r: 52, h: 32 },
    { x: 190, z: -240, r: 30, h: 15 },
    { x: -250, z: -200, r: 40, h: 24 },
    { x: 40, z: -300, r: 60, h: 36 },
  ];
  for (const d of islandData) {
    islands.add(makeIsland(d.x, d.z, d.r, d.h));
  }
  group.add(islands);

  // --- Hải âu ---
  const gulls = [];
  for (let i = 0; i < 5; i++) {
    const gull = makeGull();
    Object.assign(gull.userData, {
      angle: Math.random() * Math.PI * 2,
      radius: 55 + Math.random() * 90,
      height: 22 + Math.random() * 26,
      speed: (0.12 + Math.random() * 0.12) * (Math.random() > 0.5 ? 1 : -1),
      flap: Math.random() * Math.PI * 2,
    });
    group.add(gull);
    gulls.push(gull);
  }

  function update(dt, elapsed) {
    for (const c of clouds) {
      c.position.x += c.userData.speed * dt * 1.2;
      if (c.position.x > 320) c.position.x = -320;
    }
    for (const g of gulls) {
      const u = g.userData;
      u.angle += u.speed * dt;
      g.position.set(
        Math.cos(u.angle) * u.radius,
        u.height + Math.sin(elapsed * 0.5 + u.angle * 3) * 2.5,
        Math.sin(u.angle) * u.radius
      );
      g.rotation.y = -u.angle + (u.speed > 0 ? -Math.PI / 2 : Math.PI / 2);
      u.flap += dt * 9;
      const t = Math.sin(u.flap) * 0.55;
      g.userData.leftWing.rotation.x = t;
      g.userData.rightWing.rotation.x = -t;
    }
  }

  return { group, update, sunDir };
}

/* ---------- Helpers ---------- */

function makeIsland(x, z, radius, height) {
  const g = new THREE.Group();
  g.position.set(x, -2, z);

  // Núi đá (cone nhấp nhô)
  const rockGeo = new THREE.ConeGeometry(radius, height, 9, 3);
  // Làm biến dạng nhẹ đỉnh
  const pos = rockGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i), vy = pos.getY(i), vz = pos.getZ(i);
    const n = (Math.sin(vx * 0.21 + vz * 0.13) + Math.cos(vy * 0.3)) * radius * 0.06;
    pos.setX(i, vx + n);
    pos.setZ(i, vz + n * 0.7);
  }
  rockGeo.computeVertexNormals();

  const rock = new THREE.Mesh(
    rockGeo,
    new THREE.MeshStandardMaterial({ color: 0x7d6b52, roughness: 0.95, flatShading: true })
  );
  rock.position.y = height / 2 - 2;
  g.add(rock);

  // Vỏ cây xanh
  const cap = new THREE.Mesh(
    new THREE.ConeGeometry(radius * 0.82, height * 0.55, 9, 1),
    new THREE.MeshStandardMaterial({ color: 0x2e7d46, roughness: 0.9, flatShading: true })
  );
  cap.position.y = height * 0.55;
  g.add(cap);

  const cap2 = new THREE.Mesh(
    new THREE.ConeGeometry(radius * 0.5, height * 0.4, 8, 1),
    new THREE.MeshStandardMaterial({ color: 0x3c9155, roughness: 0.9, flatShading: true })
  );
  cap2.position.y = height * 0.85;
  g.add(cap2);

  return g;
}

function makeGull() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5, roughness: 0.7, side: THREE.DoubleSide,
  });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), mat);
  body.scale.set(1.5, 0.55, 0.55);
  g.add(body);

  // Cánh dùng pivot riêng để vẫy quanh gốc cánh (cánh hướng ra ±Z)
  const leftWingGeo = new THREE.BoxGeometry(0.12, 0.05, 1.9);
  leftWingGeo.translate(0, 0, -0.95);
  const rightWingGeo = new THREE.BoxGeometry(0.12, 0.05, 1.9);
  rightWingGeo.translate(0, 0, 0.95);

  const leftWing = new THREE.Group();
  leftWing.position.set(0, 0.15, -0.3);
  leftWing.add(new THREE.Mesh(leftWingGeo, mat));
  g.add(leftWing);

  const rightWing = new THREE.Group();
  rightWing.position.set(0, 0.15, 0.3);
  rightWing.add(new THREE.Mesh(rightWingGeo, mat));
  g.add(rightWing);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), mat);
  head.position.set(0.75, 0.25, 0);
  g.add(head);

  const beak = new THREE.Mesh(
    new THREE.ConeGeometry(0.09, 0.42, 6),
    new THREE.MeshStandardMaterial({ color: 0xf3a33c, roughness: 0.6 })
  );
  beak.rotation.z = -Math.PI / 2;
  beak.position.set(1.1, 0.22, 0);
  g.add(beak);

  g.userData.leftWing = leftWing;
  g.userData.rightWing = rightWing;
  return g;
}

function makeRadialTexture(stops) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach((s, i) => grad.addColorStop(i / (stops.length - 1), s));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function makeCloudTexture() {
  const w = 256, h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  // Nhiều blob tròn tạo thành đám mây
  const blobs = 9;
  for (let i = 0; i < blobs; i++) {
    const x = w * (0.2 + Math.random() * 0.6);
    const y = h * (0.35 + Math.random() * 0.3);
    const r = h * (0.18 + Math.random() * 0.22);
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(255,255,255,0.85)');
    grad.addColorStop(0.55, 'rgba(255,255,255,0.32)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  return new THREE.CanvasTexture(canvas);
}
