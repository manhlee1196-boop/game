import * as THREE from 'three';
import { createWater, getWaveHeight, getWaveNormal } from './water.js';
import { createSky } from './sky.js';
import { FishSchool, rollSpecies, rollFishStats, createFishMesh, SPECIES } from './fish.js';
import { SFX } from './audio.js';

/* ============================================================
 * CÂU CÁ 3D — game chính
 * ============================================================ */

// ---------- DOM ----------
const canvas = document.getElementById('game-canvas');
const elLoading = document.getElementById('loading');
const elStatus = document.getElementById('status');
const elPowerWrap = document.getElementById('power-wrap');
const elPowerFill = document.getElementById('power-fill');
const elReelWrap = document.getElementById('reel-wrap');
const elTensionFill = document.getElementById('tension-fill');
const elTensionText = document.getElementById('tension-text');
const elDistanceFill = document.getElementById('distance-fill');
const elDistanceText = document.getElementById('distance-text');
const elStaminaFill = document.getElementById('stamina-fill');
const elStaminaText = document.getElementById('stamina-text');
const elReelHint = document.getElementById('reel-hint');
const elModal = document.getElementById('catch-modal');
const elModalName = document.getElementById('modal-name');
const elModalRarity = document.getElementById('modal-rarity');
const elModalWeight = document.getElementById('modal-weight');
const elModalLength = document.getElementById('modal-length');
const elModalPoints = document.getElementById('modal-points');
const elModalDesc = document.getElementById('modal-desc');
const elCollection = document.getElementById('collection');
const elCollectionList = document.getElementById('collection-list');
const elStatScore = document.getElementById('stat-score');
const elStatCount = document.getElementById('stat-count');
const elStatBest = document.getElementById('stat-best');
const elToastWrap = document.getElementById('toast-wrap');

// ---------- Renderer / Scene ----------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xbfe0f2, 150, 460);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 900);
camera.position.set(0, 3.55, 7.2);

// ---------- Ánh sáng ----------
const hemi = new THREE.HemisphereLight(0xbfe6ff, 0x2a5f7a, 1.15);
scene.add(hemi);

const sunLight = new THREE.DirectionalLight(0xfff2d0, 2.1);
sunLight.position.set(60, 90, -110);
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0x9fd8ff, 0.55);
fillLight.position.set(-50, 30, 60);
scene.add(fillLight);

// ---------- Nước ----------
const water = createWater(700, 170);
scene.add(water.mesh);

// ---------- Bầu trời ----------
const sky = createSky();
scene.add(sky.group);
water.uniforms.uSunDir.value.copy(sky.sunDir);

// ---------- Sàn hồ (nhìn xuyên qua nước) ----------
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(700, 700),
  new THREE.MeshStandardMaterial({ color: 0x2f6b7c, roughness: 1 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -14;
scene.add(floor);

// ---------- Bờ biển + cầu cảng ----------
buildDockAndBeach(scene);

// ---------- Đá ngầm gần cầu ----------
buildUnderwaterRocks(scene);

// ---------- Đàn cá ----------
const school = new FishSchool(24);
scene.add(school.group);

// ---------- Cần câu (gắn với camera) ----------
const rod = buildRod();
camera.add(rod.group);
scene.add(camera);

// ---------- Phao ----------
const bobber = buildBobber();
bobber.visible = false;
scene.add(bobber);

// ---------- Dây câu ----------
const LINE_POINTS = 26;
const linePositions = new Float32Array(LINE_POINTS * 3);
const lineGeo = new THREE.BufferGeometry();
lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
const lineMat = new THREE.LineBasicMaterial({
  color: 0xe8f4ff,
  transparent: true,
  opacity: 0.75,
  depthWrite: false,
});
const fishingLine = new THREE.Line(lineGeo, lineMat);
fishingLine.renderOrder = 5;
fishingLine.visible = false;
scene.add(fishingLine);

// ---------- Dấu "!" khi cá cắn ----------
const biteSprite = makeBiteSprite();
biteSprite.visible = false;
scene.add(biteSprite);

// ---------- Hạt bọt nước ----------
const splashPool = [];
const splashGeo = new THREE.SphereGeometry(0.09, 6, 5);
const splashMat = new THREE.MeshBasicMaterial({
  color: 0xd8f3ff,
  transparent: true,
  opacity: 0.9,
  depthWrite: false,
});

// ---------- Audio ----------
const sfx = new SFX();
let soundOn = true;

// ---------- Trạng thái game ----------
const STATE = {
  IDLE: 'idle',
  CHARGING: 'charging',
  CASTING: 'casting',
  WAITING: 'waiting',
  BITE: 'bite',
  REELING: 'reeling',
  CAUGHT: 'caught',
};

let state = STATE.IDLE;

// Nhìn
let yaw = 0;
let pitch = -0.06;
let lookDragging = false;
const keys = new Set();

// Ném
let power = 0;
let powerDir = 1;
const bobberVel = new THREE.Vector3();
const bobberPos = new THREE.Vector3();

// Chờ cá
let waitTimer = 0;
let biteTimer = 0;
let currentFish = null;      // { species, stats, mesh }
let attractedFish = null;

// Kéo cá
const reel = {
  distance: 0,
  maxDistance: 30,
  tension: 0,
  stamina: 100,
  snapTimer: 0,
  fightPhase: Math.random() * 10,
  runTimer: 4,
  running: false,
  holding: false,
  clickTick: 0,
};

// Điểm
const save = loadSave();

// ---------- Vòng lặp ----------
const clock = new THREE.Clock();
let elapsed = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;

  // Camera nhìn
  const rotSpeed = 1.7 * dt;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) yaw += rotSpeed;
  if (keys.has('KeyD') || keys.has('ArrowRight')) yaw -= rotSpeed;
  if (keys.has('KeyW') || keys.has('ArrowUp')) pitch += rotSpeed * 0.7;
  if (keys.has('KeyS') || keys.has('ArrowDown')) pitch -= rotSpeed * 0.7;
  pitch = THREE.MathUtils.clamp(pitch, -0.85, 0.75);
  camera.rotation.order = 'YXZ';
  camera.rotation.set(pitch, yaw, 0);

  // Nhấp nhô nhẹ như đứng trên cầu
  const camBob = getWaveHeight(camera.position.x, camera.position.z, elapsed) * 0.12;
  camera.position.y = 3.55 + camBob + Math.sin(elapsed * 0.9) * 0.035;

  // Cập nhật môi trường
  water.uniforms.uTime.value = elapsed;
  water.uniforms.uCameraPos.value.copy(camera.position);
  sky.update(dt, elapsed);
  school.update(dt, elapsed);
  updateSplash(dt);
  updateRod(dt);
  updateGame(dt);
  updateLine();

  renderer.render(scene, camera);
}

/* ============================================================
 * GAME LOGIC
 * ============================================================ */

function updateGame(dt) {
  switch (state) {
    case STATE.CHARGING: {
      power += powerDir * dt * 0.85;
      if (power >= 1) { power = 1; powerDir = -1; }
      if (power <= 0) { power = 0; powerDir = 1; }
      elPowerFill.style.width = `${(power * 100).toFixed(1)}%`;
      break;
    }

    case STATE.CASTING: {
      // Vật lý đạn đạo
      bobberVel.y -= 26 * dt;
      bobberPos.addScaledVector(bobberVel, dt);

      const waveY = getWaveHeight(bobberPos.x, bobberPos.z, elapsed);
      if (bobberPos.y <= waveY && bobberVel.y < 0) {
        bobberPos.y = waveY;
        spawnSplash(bobberPos, 18);
        sfx.splash();
        setState(STATE.WAITING);
        waitTimer = 2.5 + Math.random() * 5.5;
        attractedFish = school.attractNearest(bobberPos, 30);
        showStatus('Đợi cá cắn... thả lỏng tay nào!');
      } else {
        bobber.position.copy(bobberPos);
        bobber.rotation.x = Math.min(bobberVel.y * -0.04, 0.6);
      }
      break;
    }

    case STATE.WAITING: {
      // Phao nổi theo sóng
      const waveY = getWaveHeight(bobberPos.x, bobberPos.z, elapsed);
      bobberPos.y += (waveY + 0.12 - bobberPos.y) * 0.12;
      bobber.position.copy(bobberPos);
      const n = getWaveNormal(bobberPos.x, bobberPos.z, elapsed);
      bobber.rotation.x = n.z * 0.7;
      bobber.rotation.z = -n.x * 0.7;

      waitTimer -= dt;
      if (waitTimer <= 0) {
        // CÁ CẮN!
        if (!attractedFish || attractedFish.state !== 'attracted') {
          attractedFish = school.attractNearest(bobberPos, 30);
        }
        setState(STATE.BITE);
        biteTimer = 2.1;
        sfx.bite();
        showStatus('🎣 CÁ CẮN CÂU! NHẤN CHUỘT TRÁI NGAY!', true);
        biteSprite.visible = true;
      }
      break;
    }

    case STATE.BITE: {
      const waveY = getWaveHeight(bobberPos.x, bobberPos.z, elapsed);
      // Phao giật chìm
      const dip = Math.abs(Math.sin(elapsed * 12)) * 0.32 + 0.18;
      bobberPos.y += (waveY - dip - bobberPos.y) * 0.35;
      bobber.position.copy(bobberPos);
      bobber.rotation.z = Math.sin(elapsed * 18) * 0.25;

      biteSprite.position.set(bobberPos.x, bobberPos.y + 1.7, bobberPos.z);
      const s = 1 + Math.sin(elapsed * 14) * 0.12;
      biteSprite.scale.set(s, s, 1);

      biteTimer -= dt;
      if (biteTimer <= 0) {
        // Bỏ lỡ cơ hội
        biteSprite.visible = false;
        sfx.plip();
        showStatus('Tiếc quá... cá nhả mồi mất rồi');
        school.releaseAll();
        attractedFish = school.attractNearest(bobberPos, 30);
        setState(STATE.WAITING);
        waitTimer = 3 + Math.random() * 5;
      }
      break;
    }

    case STATE.REELING: {
      updateReeling(dt);
      break;
    }

    default:
      break;
  }

  // Nảy nhẹ "!" sprite
  if (biteSprite.visible) {
    biteSprite.position.y += Math.sin(elapsed * 10) * 0.004;
  }
}

function updateReeling(dt) {
  const r = reel;
  const strength = currentFish.species.strength;

  // Cá quẫy: cơ bản + các đợt "bứt tốc"
  r.runTimer -= dt;
  if (r.runTimer <= 0) {
    r.running = !r.running;
    r.runTimer = r.running ? 1.2 + Math.random() * 1.4 : 3.5 + Math.random() * 4;
  }
  const runBoost = r.running ? 1.75 : 1.0;
  const staminaFactor = 0.35 + (r.stamina / 100) * 0.65;
  const fight =
    strength * runBoost * staminaFactor *
    (0.55 + 0.45 * Math.sin(elapsed * 2.3 + r.fightPhase));

  if (r.holding) {
    // Kéo dây
    const reelRate = 2.6 + (1 - strength) * 2.2 + (1 - r.stamina / 100) * 1.6;
    r.distance = Math.max(0, r.distance - reelRate * dt);
    r.tension += (16 + fight * 46) * dt;
    r.stamina = Math.max(0, r.stamina - (6 + fight * 6) * dt);

    r.clickTick -= dt;
    if (r.clickTick <= 0) {
      sfx.reelClick();
      r.clickTick = 0.11;
    }
  } else {
    // Thả tay: cá kéo ra xa, dây chùng xuống
    r.distance += fight * 2.1 * dt;
    r.distance = Math.min(r.distance, r.maxDistance * 1.15);
    r.tension -= 34 * dt;
    r.stamina = Math.max(0, r.stamina - 3.2 * dt);
  }
  r.tension = THREE.MathUtils.clamp(r.tension, 0, 100);

  // Phao đuổi theo "con cá" — đặt trên đường nhìn từ camera ra xa
  const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  lookDir.y = 0;
  lookDir.normalize();
  bobberPos.x += (camera.position.x + lookDir.x * r.distance - bobberPos.x) * 0.08;
  bobberPos.z += (camera.position.z + lookDir.z * r.distance - bobberPos.z) * 0.08;
  const waveY = getWaveHeight(bobberPos.x, bobberPos.z, elapsed);
  bobberPos.y += (waveY - 0.15 - bobberPos.y) * 0.15;
  bobber.position.copy(bobberPos);
  bobber.rotation.z = Math.sin(elapsed * 9) * 0.3 * (r.tension / 100 + 0.3);

  // Cá bám theo phao, hướng mặt về phía người câu
  if (currentFish.mesh) {
    const fm = currentFish.mesh;
    fm.position.lerp(
      new THREE.Vector3(bobberPos.x, waveY - 1.1, bobberPos.z),
      0.06
    );
    fm.rotation.y = yaw - Math.PI / 2 + Math.sin(elapsed * 6) * 0.35 * (r.tension / 100);
    fm.rotation.z = Math.sin(elapsed * 11) * 0.3;
  }

  // UI
  const tensionPct = r.tension;
  elTensionFill.style.width = `${tensionPct}%`;
  elTensionText.textContent = `${Math.round(tensionPct)}%`;
  elDistanceFill.style.width = `${Math.min(100, (r.distance / r.maxDistance) * 100)}%`;
  elDistanceText.textContent = `${r.distance.toFixed(1)} m`;
  elStaminaFill.style.width = `${r.stamina}%`;
  elStaminaText.textContent = `${Math.round(r.stamina)}%`;

  if (tensionPct > 78) {
    elReelHint.textContent = '🔴 THẢ CHUỘT NGAY! DÂY SẮP ĐỨT!';
    elReelHint.style.color = '#ff7b6e';
  } else if (r.running) {
    elReelHint.textContent = '⚡ Cá đang quẫy mạnh — cẩn thận!';
    elReelHint.style.color = '#ffd166';
  } else if (r.holding) {
    elReelHint.textContent = '🎣 Đang kéo... giữ vững!';
    elReelHint.style.color = '#8fc6e8';
  } else {
    elReelHint.textContent = '💪 Thả lỏng cho dây chùng, rồi kéo tiếp!';
    elReelHint.style.color = '#8fc6e8';
  }

  // Đứt dây
  if (r.tension >= 99.5) {
    r.snapTimer += dt;
    if (r.snapTimer >= 1.15) {
      loseFish('💥 ĐỨT DÂY! Con cá đã thoát mất...');
      return;
    }
  } else {
    r.snapTimer = Math.max(0, r.snapTimer - dt * 1.5);
  }

  // Câu được!
  if (r.distance <= 1.6) {
    catchFish();
  }
}

/* ============================================================
 * CÁC HÀNH ĐỘNG
 * ============================================================ */

function startCharge() {
  if (state !== STATE.IDLE) return;
  power = 0;
  powerDir = 1;
  setState(STATE.CHARGING);
  elPowerWrap.style.display = 'block';
  showStatus('Đang nạp lực...');
}

function releaseCast() {
  if (state !== STATE.CHARGING) return;
  elPowerWrap.style.display = 'none';
  hideStatus();

  // Vị trí & hướng quăng
  const tip = rod.getTipWorld();
  const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  lookDir.y = 0;
  lookDir.normalize();
  const launchAngle = THREE.MathUtils.degToRad(26 + power * 8);
  const dir = lookDir.clone().multiplyScalar(Math.cos(launchAngle));
  dir.y = Math.sin(launchAngle);

  const speed = 11 + power * 27;
  bobberPos.copy(tip);
  bobberVel.copy(dir).multiplyScalar(speed);

  bobber.visible = true;
  fishingLine.visible = true;
  sfx.cast();

  setState(STATE.CASTING);
  showStatus('Ào...');
}

function hookFish() {
  if (state !== STATE.BITE) return;
  biteSprite.visible = false;
  sfx.hook();

  // Chọn loài + chỉ số
  const species = rollSpecies();
  const stats = rollFishStats(species);

  // Tạo mesh cá (xóa con cũ nếu có)
  if (currentFish?.mesh) scene.remove(currentFish.mesh);
  const mesh = createFishMesh(species, stats.sizeFactor);
  mesh.position.set(bobberPos.x, -1.2, bobberPos.z);
  scene.add(mesh);

  currentFish = { species, stats, mesh };

  // Thiết lập mini-game kéo cá
  const dist = camera.position.distanceTo(
    new THREE.Vector3(bobberPos.x, camera.position.y, bobberPos.z)
  );
  reel.distance = THREE.MathUtils.clamp(dist, 6, 46);
  reel.maxDistance = reel.distance;
  reel.tension = 28 + Math.random() * 18;
  reel.stamina = 100;
  reel.snapTimer = 0;
  reel.runTimer = 2.5 + Math.random() * 3;
  reel.running = false;
  reel.fightPhase = Math.random() * 10;

  setState(STATE.REELING);
  elReelWrap.style.display = 'block';
  hideStatus();

  const powerWord = species.strength > 0.8 ? 'CỰC NẶNG!' : species.strength > 0.55 ? 'Khá nặng!' : 'Nhẹ phết!';
  showStatus(`🎣 CÓ RỒI! ${powerWord} Kéo cá về bờ nào!`);
  setTimeout(hideStatus, 1800);
}

function catchFish() {
  const { species, stats } = currentFish;
  elReelWrap.style.display = 'none';

  if (currentFish.mesh) {
    // Cá bay về phía camera rồi biến mất
    scene.remove(currentFish.mesh);
    currentFish.mesh = null;
  }

  sfx.catchFish();
  spawnSplash(bobberPos, 10);

  // Lưu kết quả
  save.score += stats.points;
  save.count += 1;
  if (!save.best || stats.weight > save.best.weight) {
    save.best = { weight: stats.weight, name: species.name };
  }
  const rec = save.caught[species.id] || { count: 0, bestWeight: 0 };
  rec.count += 1;
  rec.bestWeight = Math.max(rec.bestWeight, stats.weight);
  save.caught[species.id] = rec;
  persistSave();
  updateStatsUI();
  renderCollection();

  // Modal
  elModalName.textContent = species.name;
  elModalName.style.color = species.rarityColor;
  elModalRarity.textContent = species.rarity;
  elModalRarity.style.background = species.rarityColor + '33';
  elModalRarity.style.color = species.rarityColor;
  elModalRarity.style.border = `1px solid ${species.rarityColor}66`;
  elModalWeight.textContent = `${stats.weight.toFixed(2)} kg`;
  elModalLength.textContent = `${stats.length.toFixed(0)} cm`;
  elModalPoints.textContent = `+${stats.points}`;
  elModalDesc.textContent = species.desc;

  setState(STATE.CAUGHT);
  elModal.classList.add('show');

  toast(`🎉 Câu được ${species.name} — +${stats.points} điểm!`);
}

function loseFish(msg) {
  elReelWrap.style.display = 'none';
  if (currentFish?.mesh) {
    scene.remove(currentFish.mesh);
    currentFish.mesh = null;
  }
  currentFish = null;
  school.releaseAll();
  sfx.lineBreak();
  showStatus(msg, true);
  toast(msg);
  resetLine();
  setState(STATE.IDLE);
  setTimeout(hideStatus, 2600);
}

function continueAfterCatch() {
  elModal.classList.remove('show');
  sfx.ui();
  resetLine();
  setState(STATE.IDLE);
  school.releaseAll();
  currentFish = null;
}

function resetLine() {
  bobber.visible = false;
  fishingLine.visible = false;
  biteSprite.visible = false;
  elPowerWrap.style.display = 'none';
  elReelWrap.style.display = 'none';
}

function retrieveLine() {
  if (state === STATE.WAITING || state === STATE.BITE || state === STATE.CASTING) {
    resetLine();
    school.releaseAll();
    attractedFish = null;
    setState(STATE.IDLE);
    sfx.plip();
    showStatus('Thu dây về.');
    setTimeout(hideStatus, 1200);
  }
}

function setState(s) {
  state = s;
}

/* ============================================================
 * DÂY CÂU
 * ============================================================ */

function updateLine() {
  if (!fishingLine.visible) return;

  const tip = rod.getTipWorld();
  const mid = new THREE.Vector3().addVectors(tip, bobberPos).multiplyScalar(0.5);

  // Độ chùng dây: nhiều khi thả, ít khi căng
  let sag = 1.6;
  if (state === STATE.REELING) {
    sag = 0.15 + (1 - reel.tension / 100) * 1.6;
  } else if (state === STATE.CASTING) {
    sag = 0.25;
  }
  mid.y -= sag + Math.sin(elapsed * 1.7) * 0.06;

  for (let i = 0; i < LINE_POINTS; i++) {
    const t = i / (LINE_POINTS - 1);
    // Bezier bậc 2: tip → mid → bobber
    const a = new THREE.Vector3().lerpVectors(tip, mid, t);
    const b = new THREE.Vector3().lerpVectors(mid, bobberPos, t);
    const p = new THREE.Vector3().lerpVectors(a, b, t);
    linePositions[i * 3] = p.x;
    linePositions[i * 3 + 1] = p.y;
    linePositions[i * 3 + 2] = p.z;
  }
  lineGeo.attributes.position.needsUpdate = true;
}

/* ============================================================
 * CẦN CÂU
 * ============================================================ */

function buildRod() {
  const group = new THREE.Group();
  group.position.set(0.62, -0.42, -0.85);
  group.rotation.set(0.42, -0.28, -0.18);

  const rodMat = new THREE.MeshStandardMaterial({ color: 0x2b4560, roughness: 0.45, metalness: 0.35 });
  const rodMat2 = new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.6, metalness: 0.2 });
  const gripMat = new THREE.MeshStandardMaterial({ color: 0x1c2733, roughness: 0.85 });

  // Tay cầm
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.052, 0.62, 10), gripMat);
  grip.rotation.x = Math.PI / 2;
  grip.position.z = 0.12;
  group.add(grip);

  // Trục cần (nhiều đoạn vót nhọn)
  const segLens = [0.75, 0.85, 0.9, 0.8];
  let z = -0.28;
  let radius = 0.032;
  for (const len of segLens) {
    const seg = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.78, radius, len, 8),
      rodMat
    );
    seg.rotation.x = Math.PI / 2;
    seg.position.z = z - len / 2;
    // Nghiêng nhẹ lên trên
    seg.position.y = (-z - 0.28) * 0.16;
    group.add(seg);
    z -= len;
    radius *= 0.78;
  }

  // Mũi cần (tip) — điểm neo dây câu
  const tip = new THREE.Object3D();
  tip.position.set(0, 0.62, z + 0.05);
  group.add(tip);

  // Máy câu (reel)
  const reelBody = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.14, 14), rodMat2);
  reelBody.rotation.z = Math.PI / 2;
  reelBody.position.set(-0.12, -0.06, 0.05);
  group.add(reelBody);

  const reelHandle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.016, 6, 16), gripMat);
  reelHandle.position.set(-0.21, -0.06, 0.05);
  group.add(reelHandle);

  // Khuyên dẫn dây
  for (const dz of [-0.7, -1.6, -2.4]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.01, 6, 12), rodMat2);
    ring.position.set(0, (-dz - 0.28) * 0.16 + 0.05, dz);
    group.add(ring);
  }

  return {
    group,
    getTipWorld() {
      return tip.getWorldPosition(new THREE.Vector3());
    },
  };
}

/* ============================================================
 * PHAO + HIỆU ỨNG
 * ============================================================ */

function buildBobber() {
  const g = new THREE.Group();

  const bottom = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.35 })
  );
  bottom.rotation.x = Math.PI;
  g.add(bottom);

  const top = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xe23b2e, roughness: 0.35 })
  );
  top.position.y = 0.001;
  g.add(top);

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.3, 8),
    new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.4 })
  );
  stem.position.y = 0.28;
  g.add(stem);

  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.3, emissive: 0x664400, emissiveIntensity: 0.4 })
  );
  knob.position.y = 0.44;
  g.add(knob);

  return g;
}

function makeBiteSprite() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.font = 'bold 110px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#fff';
  ctx.strokeText('!', 64, 70);
  ctx.fillStyle = '#ff3b2e';
  ctx.fillText('!', 64, 70);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.9, 0.9, 1);
  sprite.renderOrder = 20;
  return sprite;
}

function spawnSplash(pos, count) {
  for (let i = 0; i < count; i++) {
    const m = new THREE.Mesh(splashGeo, splashMat.clone());
    m.position.copy(pos);
    m.position.x += (Math.random() - 0.5) * 0.5;
    m.position.z += (Math.random() - 0.5) * 0.5;
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 3.2,
      1.6 + Math.random() * 3.4,
      (Math.random() - 0.5) * 3.2
    );
    const life = 0.55 + Math.random() * 0.5;
    splashPool.push({ mesh: m, vel, life, maxLife: life });
    scene.add(m);
  }
}

function updateSplash(dt) {
  for (let i = splashPool.length - 1; i >= 0; i--) {
    const p = splashPool[i];
    p.life -= dt;
    if (p.life <= 0) {
      scene.remove(p.mesh);
      p.mesh.material.dispose();
      splashPool.splice(i, 1);
      continue;
    }
    p.vel.y -= 9.5 * dt;
    p.mesh.position.addScaledVector(p.vel, dt);
    p.mesh.material.opacity = (p.life / p.maxLife) * 0.95;
    p.mesh.scale.setScalar(0.5 + (p.life / p.maxLife) * 0.8);
  }
}

function updateRod(dt) {
  // Rung cần khi căng dây
  if (state === STATE.REELING && reel.tension > 55) {
    const shake = (reel.tension - 55) / 45 * 0.02;
    rod.group.rotation.x = 0.42 + (Math.random() - 0.5) * shake;
    rod.group.rotation.z = -0.18 + (Math.random() - 0.5) * shake;
    rod.group.position.y = -0.42 + (Math.random() - 0.5) * shake * 0.5;
  } else {
    rod.group.rotation.x += (0.42 - rod.group.rotation.x) * 0.1;
    rod.group.rotation.z += (-0.18 - rod.group.rotation.z) * 0.1;
    rod.group.position.y += (-0.42 - rod.group.position.y) * 0.1;
  }

  // Giật cần khi quăng
  if (state === STATE.CHARGING) {
    rod.group.rotation.x = 0.42 - power * 0.35;
  }
}

/* ============================================================
 * MÔI TRƯỜNG (bờ + cầu cảng + đá ngầm)
 * ============================================================ */

function buildDockAndBeach(scene) {
  const wood = new THREE.MeshStandardMaterial({ color: 0x9c6b3f, roughness: 0.85 });
  const woodDark = new THREE.MeshStandardMaterial({ color: 0x7a5232, roughness: 0.9 });
  const sand = new THREE.MeshStandardMaterial({ color: 0xe8d29a, roughness: 1 });

  // Bãi cát
  const beach = new THREE.Mesh(new THREE.BoxGeometry(120, 3, 70), sand);
  beach.position.set(0, -0.4, 52);
  scene.add(beach);

  // Cỏ bụi trên bờ
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x3e8b4d, roughness: 0.95, flatShading: true });
  for (let i = 0; i < 8; i++) {
    const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(1 + Math.random() * 1.6, 0), bushMat);
    bush.position.set((Math.random() - 0.5) * 70, 1.2, 38 + Math.random() * 22);
    bush.scale.y = 0.7;
    scene.add(bush);
  }

  // Cầu cảng: ván gỗ
  const dockGroup = new THREE.Group();
  for (let z = 4; z <= 17; z += 0.62) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.16, 0.52), Math.random() > 0.5 ? wood : woodDark);
    plank.position.set((Math.random() - 0.5) * 0.05, 1.28 + (Math.random() - 0.5) * 0.03, z);
    plank.rotation.y = (Math.random() - 0.5) * 0.02;
    dockGroup.add(plank);
  }
  // Thanh dọc
  for (const x of [-1.95, 1.95]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 13.6), woodDark);
    beam.position.set(x, 1.12, 10.5);
    dockGroup.add(beam);
  }
  // Cọc
  for (const x of [-1.85, 1.85]) {
    for (const z of [4.6, 8.5, 12.4, 16.3]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 3.2, 8), woodDark);
      post.position.set(x, 0.15, z);
      dockGroup.add(post);
    }
  }
  // Chỗ ngồi + xô + hộp đồ câu
  const bench = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.14, 0.55), wood);
  bench.position.set(-1.15, 1.85, 8.2);
  dockGroup.add(bench);
  for (const lx of [-1.8, -0.5]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.4), woodDark);
    leg.position.set(lx, 1.55, 8.2);
    dockGroup.add(leg);
  }

  const bucket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.26, 0.55, 12),
    new THREE.MeshStandardMaterial({ color: 0x3a7ca5, roughness: 0.6, metalness: 0.2 })
  );
  bucket.position.set(1.35, 1.62, 7.1);
  dockGroup.add(bucket);

  const tackle = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.32, 0.45),
    new THREE.MeshStandardMaterial({ color: 0xc2452d, roughness: 0.55 })
  );
  tackle.position.set(1.25, 1.52, 11.4);
  dockGroup.add(tackle);

  scene.add(dockGroup);

  // Cây dừa
  for (const [px, pz, scale] of [[-14, 42, 1.15], [16, 46, 1.0], [-22, 55, 1.3]]) {
    scene.add(makePalm(px, pz, scale));
  }
}

function makePalm(x, z, scale = 1) {
  const g = new THREE.Group();
  g.position.set(x, 1.1, z);
  g.scale.setScalar(scale);

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b6844, roughness: 0.9, flatShading: true });
  let ty = 0;
  for (let i = 0; i < 5; i++) {
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.32 - i * 0.035, 0.42 - i * 0.035, 1.5, 7), trunkMat);
    seg.position.set(Math.sin(i * 0.7) * 0.35, ty + 0.75, Math.cos(i * 0.5) * 0.18);
    seg.rotation.z = Math.sin(i * 0.7) * -0.18;
    g.add(seg);
    ty += 1.42;
  }

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x2f9e4f, roughness: 0.85, side: THREE.DoubleSide, flatShading: true,
  });
  const topY = ty + 0.4;
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2;
    const pivot = new THREE.Group();
    pivot.position.set(0, topY, 0);
    pivot.rotation.y = -angle;
    // Lá: quay trục lá hướng ra ngoài-chúc xuống trước, rồi dịch ra
    const leafGeo = new THREE.ConeGeometry(0.5, 3.8, 4);
    leafGeo.rotateZ(-Math.PI / 2 - 0.5);
    leafGeo.translate(1.25, -0.15, 0);
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    pivot.add(leaf);
    g.add(pivot);
  }

  // Dừa
  const cocoMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 0.8 });
  for (let i = 0; i < 3; i++) {
    const coco = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), cocoMat);
    coco.position.set(Math.cos(i * 2.1) * 0.5, topY - 0.55, Math.sin(i * 2.1) * 0.5);
    g.add(coco);
  }

  return g;
}

function buildUnderwaterRocks(scene) {
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x4a6b7a, roughness: 1, flatShading: true });
  const positions = [
    [6, -8, -6], [-7, -9, -14], [12, -10, -22], [-15, -11, -30],
    [3, -8, -36], [-5, -12, -48], [18, -9, -40], [-22, -10, -18],
  ];
  for (const [x, y, z] of positions) {
    const r = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4 + Math.random() * 2.2, 0), rockMat);
    r.position.set(x, y, z);
    r.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    scene.add(r);
  }
}

/* ============================================================
 * UI
 * ============================================================ */

let statusTimeout = null;

function showStatus(text, alert = false) {
  elStatus.textContent = text;
  elStatus.classList.add('show');
  elStatus.classList.toggle('alert', alert);
  if (statusTimeout) clearTimeout(statusTimeout);
  if (!alert) {
    statusTimeout = setTimeout(() => elStatus.classList.remove('show'), 3200);
  }
}

function hideStatus() {
  elStatus.classList.remove('show', 'alert');
  if (statusTimeout) clearTimeout(statusTimeout);
}

function toast(text) {
  const div = document.createElement('div');
  div.className = 'panel toast';
  div.textContent = text;
  elToastWrap.appendChild(div);
  setTimeout(() => div.remove(), 3800);
}

function updateStatsUI() {
  elStatScore.textContent = save.score.toLocaleString('vi-VN');
  elStatCount.textContent = save.count;
  elStatBest.textContent = save.best
    ? `${save.best.weight.toFixed(2)} kg`
    : '—';
}

function renderCollection() {
  elCollectionList.innerHTML = '';
  for (const sp of SPECIES) {
    const rec = save.caught[sp.id];
    const item = document.createElement('div');
    item.className = 'coll-item' + (rec ? ' has' : ' locked');
    item.innerHTML = `
      <div class="swatch" style="background:${'#' + sp.body.toString(16).padStart(6, '0')}"></div>
      <div class="info">
        <div class="name">${sp.name}</div>
        <div class="sub">${rec ? `${rec.count} con · kỷ lục ${rec.bestWeight.toFixed(2)} kg` : 'Chưa bắt được'}</div>
      </div>
    `;
    elCollectionList.appendChild(item);
  }
}

// ---------- Lưu / tải ----------
function loadSave() {
  try {
    const raw = localStorage.getItem('fishing3d_save');
    if (raw) {
      const data = JSON.parse(raw);
      return {
        score: data.score || 0,
        count: data.count || 0,
        best: data.best || null,
        caught: data.caught || {},
      };
    }
  } catch (e) { /* ignore */ }
  return { score: 0, count: 0, best: null, caught: {} };
}

function persistSave() {
  try {
    localStorage.setItem('fishing3d_save', JSON.stringify(save));
  } catch (e) { /* ignore */ }
}

/* ============================================================
 * INPUT
 * ============================================================ */

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

canvas.addEventListener('pointerdown', (e) => {
  sfx.init();
  sfx.resume();

  // Bắt toàn bộ chuột để không bỏ lỡ pointerup khi rê qua UI
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }

  if (e.button === 2) {
    lookDragging = true;
    return;
  }

  if (e.button === 0) {
    switch (state) {
      case STATE.IDLE:
        startCharge();
        break;
      case STATE.BITE:
        hookFish();
        reel.holding = true; // giữ chuột là kéo cá luôn
        break;
      case STATE.REELING:
        reel.holding = true;
        break;
      default:
        break;
    }
  }
});

canvas.addEventListener('pointermove', (e) => {
  if (!lookDragging) return;
  yaw -= e.movementX * 0.0032;
  pitch -= e.movementY * 0.0028;
  pitch = THREE.MathUtils.clamp(pitch, -0.85, 0.75);
});

canvas.addEventListener('pointerup', (e) => {
  if (e.button === 2) {
    lookDragging = false;
    return;
  }
  if (e.button === 0) {
    if (state === STATE.CHARGING) {
      releaseCast();
    }
    if (state === STATE.REELING) {
      reel.holding = false;
    }
  }
});

canvas.addEventListener('pointercancel', () => {
  reel.holding = false;
  lookDragging = false;
});

window.addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (e.code === 'KeyR') retrieveLine();
  if (e.code === 'KeyC') toggleCollection();
  if (e.code === 'KeyM') toggleSound();
});

window.addEventListener('keyup', (e) => {
  keys.delete(e.code);
});

// Nút bấm
document.getElementById('btn-continue').addEventListener('click', continueAfterCatch);
document.getElementById('btn-collection').addEventListener('click', toggleCollection);
document.getElementById('btn-sound').addEventListener('click', toggleSound);

function toggleCollection() {
  sfx.init();
  sfx.ui();
  elCollection.style.display = elCollection.style.display === 'block' ? 'none' : 'block';
}

function toggleSound() {
  sfx.init();
  soundOn = sfx.toggle();
  document.getElementById('btn-sound').textContent = soundOn ? '🔊 Âm thanh' : '🔇 Tắt tiếng';
  if (soundOn) sfx.ui();
}

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ============================================================
 * KHỞI ĐỘNG
 * ============================================================ */

updateStatsUI();
renderCollection();

// Bỏ màn hình chờ
requestAnimationFrame(() => {
  setTimeout(() => {
    elLoading.style.opacity = '0';
    setTimeout(() => { elLoading.style.display = 'none'; }, 650);
    showStatus('🎣 Chào mừng! Giữ chuột trái để quăng câu nhé!');
  }, 400);
});

animate();
