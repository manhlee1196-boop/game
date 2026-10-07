import * as THREE from 'three';

/* ============================================================
 * Danh sách loài cá + factory tạo cá 3D procedural
 * ============================================================ */

export const SPECIES = [
  {
    id: 'ca_ro',
    name: 'Cá Rô',
    rarity: 'Thường',
    rarityColor: '#9aa5b1',
    body: 0x6fae7d,
    fin: 0x4c7f58,
    belly: 0xd8e8c8,
    weightRange: [0.25, 1.4],   // kg
    lengthRange: [14, 32],      // cm
    points: 40,
    strength: 0.35,
    desc: 'Cá rô đồng quen thuộc, nhỏ nhưng khỏe — món kho quẹt lý tưởng sau buổi câu.',
  },
  {
    id: 'ca_chep',
    name: 'Cá Chép',
    rarity: 'Thường',
    rarityColor: '#9aa5b1',
    body: 0xd98846,
    fin: 0xb5652e,
    belly: 0xf2d9b0,
    weightRange: [0.8, 5.5],
    lengthRange: [24, 58],
    points: 70,
    strength: 0.5,
    desc: 'Cá chép vàng óng, hay quẫy mạnh khi bị câu. Biểu tượng "cá chép hóa rồng".',
  },
  {
    id: 'ca_hoi',
    name: 'Cá Hồi',
    rarity: 'Hiếm',
    rarityColor: '#4aa3ff',
    body: 0xe8846b,
    fin: 0xc45c4a,
    belly: 0xf7ddd2,
    weightRange: [1.5, 9.0],
    lengthRange: [40, 90],
    points: 150,
    strength: 0.72,
    desc: 'Cá hồi hồng tươi, bơi khỏe ngược dòng. Thịt cam đặc biệt được ưa chuộng.',
  },
  {
    id: 'ca_thu',
    name: 'Cá Thu',
    rarity: 'Hiếm',
    rarityColor: '#4aa3ff',
    body: 0x4b7fa8,
    fin: 0x2f5f85,
    belly: 0xcfe4ef,
    weightRange: [1.2, 6.5],
    lengthRange: [35, 75],
    points: 140,
    strength: 0.68,
    desc: 'Cá thu thân thon, vằn xanh biếc, bơi cực nhanh — thử thách thực sự cho cần thủ.',
  },
  {
    id: 'ca_vang',
    name: 'Cá Vàng',
    rarity: 'Hiếm',
    rarityColor: '#4aa3ff',
    body: 0xf0b429,
    fin: 0xd98e0b,
    belly: 0xffe9a8,
    weightRange: [0.5, 3.2],
    lengthRange: [18, 42],
    points: 180,
    strength: 0.55,
    desc: 'Cá vàng lấp lánh như thỏi vàng dưới nước. Ai câu được sẽ gặp may cả ngày!',
  },
  {
    id: 'ca_ngu',
    name: 'Cá Ngừ',
    rarity: 'Rất hiếm',
    rarityColor: '#a855f7',
    body: 0x2c4c7c,
    fin: 0x1c3457,
    belly: 0x9db8d6,
    weightRange: [8, 45],
    lengthRange: [90, 190],
    points: 320,
    strength: 0.9,
    desc: 'Khổng lồ đại dương! Cá ngừ vây xanh nặng hàng chục kg, giật dây mỏi tay.',
  },
  {
    id: 'ca_map',
    name: 'Cá Mập',
    rarity: 'Huyền thoại',
    rarityColor: '#f59e0b',
    body: 0x7a8794,
    fin: 0x5c6873,
    belly: 0xd7dee4,
    weightRange: [30, 160],
    lengthRange: [150, 320],
    points: 700,
    strength: 1.0,
    desc: 'Vua đại dương. Chỉ cần thủ lão luyện mới đủ sức đưa nó vào bờ — huyền thoại!',
  },
  {
    id: 'ca_mat_troi',
    name: 'Cá Mặt Trời',
    rarity: 'Huyền thoại',
    rarityColor: '#f59e0b',
    body: 0x67e8c3,
    fin: 0x2dd4a7,
    belly: 0xc9f7e8,
    weightRange: [20, 110],
    lengthRange: [110, 240],
    points: 650,
    strength: 0.95,
    desc: 'Cá mặt trời khổng lồ thân hình đĩa, phát sáng lân tinh cực hiếm gặp.',
  },
];

const RARITY_WEIGHTS = {
  ca_ro: 26, ca_chep: 24, ca_hoi: 13, ca_thu: 13,
  ca_vang: 11, ca_ngu: 7, ca_map: 3, ca_mat_troi: 3,
};

/** Chọn loài ngẫu nhiên theo độ hiếm */
export function rollSpecies() {
  const entries = Object.entries(RARITY_WEIGHTS);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [id, w] of entries) {
    r -= w;
    if (r <= 0) return SPECIES.find((s) => s.id === id);
  }
  return SPECIES[0];
}

/** Tạo thông số cá (cân nặng, chiều dài) */
export function rollFishStats(species) {
  // sizeFactor bias về giá trị nhỏ để cá to vẫn hiếm
  const t = Math.pow(Math.random(), 1.6);
  const weight = species.weightRange[0] + t * (species.weightRange[1] - species.weightRange[0]);
  const length = species.lengthRange[0] + t * (species.lengthRange[1] - species.lengthRange[0]);
  const points = Math.round(species.points * (0.7 + t * 1.3));
  return { weight, length, points, sizeFactor: t };
}

/* ============================================================
 * Mesh cá 3D procedural
 * ============================================================ */

export function createFishMesh(species, sizeFactor = 0.5) {
  const group = new THREE.Group();

  // Scale tổng thể theo size (0.35 → 1.25)
  const s = 0.35 + sizeFactor * 0.9;
  group.scale.setScalar(s);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: species.body,
    roughness: 0.38,
    metalness: 0.18,
  });
  const finMat = new THREE.MeshStandardMaterial({
    color: species.fin,
    roughness: 0.5,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });
  const bellyMat = new THREE.MeshStandardMaterial({
    color: species.belly,
    roughness: 0.45,
    metalness: 0.08,
  });

  // Thân: ellipsoid
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 14), bodyMat);
  body.scale.set(1.75, 0.85, 0.55);
  group.add(body);

  // Bụng
  const belly = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), bellyMat);
  belly.scale.set(1.45, 0.55, 0.42);
  belly.position.set(0.05, -0.32, 0);
  group.add(belly);

  // Đuôi (nhóm để vẫy)
  const tailPivot = new THREE.Group();
  tailPivot.position.set(-1.7, 0, 0);
  group.add(tailPivot);

  const tailShape = new THREE.Shape();
  tailShape.moveTo(0, 0);
  tailShape.lineTo(-1.05, 0.85);
  tailShape.lineTo(-0.75, 0);
  tailShape.lineTo(-1.05, -0.85);
  tailShape.lineTo(0, 0);
  const tailGeo = new THREE.ShapeGeometry(tailShape);
  const tail = new THREE.Mesh(tailGeo, finMat);
  tailPivot.add(tail);

  // Vây lưng
  const dorsalShape = new THREE.Shape();
  dorsalShape.moveTo(-0.6, 0);
  dorsalShape.lineTo(0.25, 0);
  dorsalShape.lineTo(-0.15, 0.85);
  dorsalShape.lineTo(-0.6, 0);
  const dorsal = new THREE.Mesh(new THREE.ShapeGeometry(dorsalShape), finMat);
  dorsal.rotation.x = Math.PI / 2;
  dorsal.position.set(0, 0.82, 0);
  group.add(dorsal);

  // Vây ngực (2 bên)
  const pecGeo = new THREE.ConeGeometry(0.28, 0.85, 4);
  const pecL = new THREE.Mesh(pecGeo, finMat);
  pecL.rotation.set(Math.PI / 2.4, 0, 0.6);
  pecL.position.set(0.55, -0.25, 0.5);
  group.add(pecL);
  const pecR = new THREE.Mesh(pecGeo, finMat);
  pecR.rotation.set(-Math.PI / 2.4, 0, 0.6);
  pecR.position.set(0.55, -0.25, -0.5);
  group.add(pecR);

  // Vây bụng
  const pelvic = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 4), finMat);
  pelvic.rotation.set(Math.PI / 2.6, 0, Math.PI);
  pelvic.position.set(-0.35, -0.72, 0);
  group.add(pelvic);

  // Mắt
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.2 });
  for (const side of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), eyeWhiteMat);
    eye.position.set(1.12, 0.28, 0.36 * side);
    group.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.095, 8, 6), pupilMat);
    pupil.position.set(1.23, 0.30, 0.43 * side);
    group.add(pupil);
  }

  // Mang (đường cong nhỏ)
  const gill = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.035, 6, 12, Math.PI * 0.9), finMat);
  gill.rotation.set(0, Math.PI / 2, -Math.PI * 0.35);
  gill.position.set(0.78, 0.05, 0.36);
  group.add(gill);
  const gill2 = gill.clone();
  gill2.position.z = -0.36;
  gill2.rotation.y = -Math.PI / 2;
  group.add(gill2);

  // Miệng
  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.035, 6, 10, Math.PI),
    finMat
  );
  mouth.rotation.set(Math.PI / 2, 0, Math.PI);
  mouth.position.set(1.68, -0.12, 0);
  group.add(mouth);

  group.userData.tailPivot = tailPivot;
  group.userData.species = species;

  return group;
}

/* ============================================================
 * Đàn cá bơi tự do trong hồ
 * ============================================================ */

export class FishSchool {
  constructor(count = 22) {
    this.group = new THREE.Group();
    this.fishes = [];

    for (let i = 0; i < count; i++) {
      const species = SPECIES[Math.floor(Math.random() * SPECIES.length)];
      const sizeFactor = Math.random();
      const mesh = createFishMesh(species, sizeFactor);

      const f = {
        mesh,
        species,
        angle: Math.random() * Math.PI * 2,
        radius: 12 + Math.random() * 55,
        center: new THREE.Vector3(
          (Math.random() - 0.5) * 120,
          -1.2 - Math.random() * 4.5,
          -20 - Math.random() * 130
        ),
        speed: (0.12 + Math.random() * 0.22) * (Math.random() > 0.5 ? 1 : -1),
        wobble: Math.random() * Math.PI * 2,
        state: 'wander',       // wander | attracted
        target: new THREE.Vector3(),
        attractedTime: 0,
      };
      this.group.add(mesh);
      this.fishes.push(f);
    }

    this._tmp = new THREE.Vector3();
  }

  /** Gọi 1 con cá tới gần vị trí phao */
  attractNearest(bobberPos, duration = 8) {
    let best = null;
    let bestDist = Infinity;
    for (const f of this.fishes) {
      if (f.state === 'attracted') continue;
      const d = f.mesh.position.distanceTo(bobberPos);
      if (d < bestDist) { bestDist = d; best = f; }
    }
    if (best) {
      best.state = 'attracted';
      best.target.copy(bobberPos);
      best.target.y = -0.7 - Math.random() * 1.2;
      best.attractedTime = duration;
    }
    return best;
  }

  releaseAll() {
    for (const f of this.fishes) {
      f.state = 'wander';
    }
  }

  update(dt, elapsed) {
    const tmp = this._tmp;

    for (const f of this.fishes) {
      const mesh = f.mesh;

      if (f.state === 'attracted') {
        f.attractedTime -= dt;
        // Bơi về phía phao
        tmp.copy(f.target).sub(mesh.position);
        const dist = tmp.length();
        if (dist > 0.2) {
          tmp.normalize().multiplyScalar(Math.min(3.2 * dt, dist));
          mesh.position.add(tmp);
          // Cá hướng mặt (+X) theo hướng bơi
          const targetAngle = Math.atan2(-tmp.z, tmp.x);
          mesh.rotation.y += (targetAngle - mesh.rotation.y) * 0.15;
        }
        if (f.attractedTime <= 0) f.state = 'wander';
      } else {
        // Đi lang thang theo quỹ đạo tròn + dao động
        f.angle += f.speed * dt;
        const x = f.center.x + Math.cos(f.angle) * f.radius;
        const z = f.center.z + Math.sin(f.angle) * f.radius;
        const y = f.center.y + Math.sin(elapsed * 0.6 + f.wobble) * 0.9;

        tmp.set(x - mesh.position.x, y - mesh.position.y, z - mesh.position.z);
        const d = tmp.length();
        if (d > 0.05) {
          tmp.normalize().multiplyScalar(Math.min(d * 2.2 * dt, 2.6 * dt));
          mesh.position.add(tmp);
          // Cá hướng mặt (+X) theo hướng bơi
          const targetAngle = Math.atan2(-tmp.z, tmp.x);
          mesh.rotation.y += (targetAngle - mesh.rotation.y) * 0.1;
        }
      }

      // Nghiêng nhẹ theo hướng cua
      mesh.rotation.z = Math.sin(elapsed * 1.2 + f.wobble) * 0.12;

      // Vẫy đuôi
      const tail = mesh.userData.tailPivot;
      const flapSpeed = f.state === 'attracted' ? 11 : 6;
      tail.rotation.y = Math.sin(elapsed * flapSpeed + f.wobble) * 0.55;
    }
  }
}
