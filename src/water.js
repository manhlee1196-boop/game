import * as THREE from 'three';

/**
 * Sóng được tính bằng tổng các sine — công thức DÙNG CHUNG
 * cho shader (vertex) và JS (phao, cá nổi) để mọi thứ khớp nhau.
 *
 * w(x,z,t) = Σ amp_i * sin(dot(p, dir_i) * freq_i + t * speed_i)
 */
export const WAVES = [
  { dir: [1.0, 0.6], freq: 0.12, speed: 1.05, amp: 0.34 },
  { dir: [-0.7, 1.0], freq: 0.19, speed: 1.35, amp: 0.22 },
  { dir: [0.3, -1.0], freq: 0.32, speed: 1.85, amp: 0.11 },
  { dir: [-1.0, -0.4], freq: 0.48, speed: 2.30, amp: 0.055 },
];

// Chuẩn hóa hướng (phải khớp với GLSL normalize)
const NORM = WAVES.map((w) => {
  const len = Math.hypot(w.dir[0], w.dir[1]);
  return [w.dir[0] / len, w.dir[1] / len];
});

/** Chiều cao sóng tại (x, z) — dùng cho phao, bóng cá... */
export function getWaveHeight(x, z, t) {
  let w = 0;
  for (let i = 0; i < WAVES.length; i++) {
    const d = NORM[i];
    w += WAVES[i].amp * Math.sin((x * d[0] + z * d[1]) * WAVES[i].freq + t * WAVES[i].speed);
  }
  return w;
}

/** Đạo hàm sóng → pháp tuyến dùng cho vật nổi nghiêng theo sóng */
export function getWaveNormal(x, z, t, target = new THREE.Vector3()) {
  let dx = 0, dz = 0;
  for (let i = 0; i < WAVES.length; i++) {
    const d = NORM[i];
    const c = WAVES[i].amp * WAVES[i].freq * Math.cos((x * d[0] + z * d[1]) * WAVES[i].freq + t * WAVES[i].speed);
    dx += c * d[0];
    dz += c * d[1];
  }
  return target.set(-dx, 1, -dz).normalize();
}

const WAVE_GLSL = WAVES.map((w, i) => {
  const d = NORM[i];
  return `  w += ${w.amp.toFixed(4)} * sin(dot(p, vec2(${d[0].toFixed(5)}, ${d[1].toFixed(5)})) * ${w.freq.toFixed(5)} + t * ${w.speed.toFixed(5)});`;
}).join('\n');

const WAVE_DX_GLSL = WAVES.map((w, i) => {
  const d = NORM[i];
  return `  dwx += ${w.amp.toFixed(4)} * ${w.freq.toFixed(5)} * ${d[0].toFixed(5)} * cos(dot(p, vec2(${d[0].toFixed(5)}, ${d[1].toFixed(5)})) * ${w.freq.toFixed(5)} + t * ${w.speed.toFixed(5)});`;
}).join('\n');

const WAVE_DZ_GLSL = WAVES.map((w, i) => {
  const d = NORM[i];
  return `  dwz += ${w.amp.toFixed(4)} * ${w.freq.toFixed(5)} * ${d[1].toFixed(5)} * cos(dot(p, vec2(${d[0].toFixed(5)}, ${d[1].toFixed(5)})) * ${w.freq.toFixed(5)} + t * ${w.speed.toFixed(5)});`;
}).join('\n');

const vertexShader = /* glsl */ `
uniform float uTime;

varying vec3 vWorldPos;
varying vec3 vNormalW;
varying float vWave;

float waveH(vec2 p, float t) {
  float w = 0.0;
${WAVE_GLSL}
  return w;
}

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  float t = uTime;
  vec2 p = worldPos.xz;

  float w = waveH(p, t);
  worldPos.y += w;

  float dwx = 0.0;
  float dwz = 0.0;
${WAVE_DX_GLSL}
${WAVE_DZ_GLSL}

  vNormalW = normalize(vec3(-dwx, 1.0, -dwz));
  vWave = w;
  vWorldPos = worldPos.xyz;

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uShallowColor;
uniform vec3 uDeepColor;
uniform vec3 uSkyColor;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uCameraPos;
uniform float uOpacity;

varying vec3 vWorldPos;
varying vec3 vNormalW;
varying float vWave;

void main() {
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(uCameraPos - vWorldPos);
  vec3 L = normalize(uSunDir);

  float fresnel = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);
  fresnel = clamp(fresnel, 0.0, 1.0);

  // Màu nước: nông trên đỉnh sóng, sâu ở chân sóng
  float heightMix = smoothstep(-0.35, 0.45, vWave);
  vec3 waterCol = mix(uDeepColor, uShallowColor, heightMix);

  // Trộn màu phản chiếu bầu trời theo fresnel
  vec3 col = mix(waterCol, uSkyColor, fresnel * 0.62);

  // Ánh sáng mặt trời khuếch tán
  float diff = clamp(dot(N, L), 0.0, 1.0);
  col += uSunColor * diff * 0.18;

  // Lóng lánh (Blinn-Phong specular)
  vec3 H = normalize(L + V);
  float spec = pow(clamp(dot(N, H), 0.0, 1.0), 240.0);
  col += uSunColor * spec * 1.4;

  // Bọt nhẹ trên đỉnh sóng cao
  float foam = smoothstep(0.38, 0.58, vWave);
  col = mix(col, vec3(0.92, 0.97, 1.0), foam * 0.35);

  // Sương xa
  float dist = length(uCameraPos - vWorldPos);
  float fog = 1.0 - exp(-0.0022 * dist);
  col = mix(col, uSkyColor, fog * 0.55);

  gl_FragColor = vec4(col, uOpacity);
}
`;

export function createWater(size = 600, segments = 160) {
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const uniforms = {
    uTime: { value: 0 },
    uShallowColor: { value: new THREE.Color('#3ec6c9') },
    uDeepColor: { value: new THREE.Color('#0d4d6b') },
    uSkyColor: { value: new THREE.Color('#a8d8f0') },
    uSunDir: { value: new THREE.Vector3(0.45, 0.55, -0.7).normalize() },
    uSunColor: { value: new THREE.Color('#fff3c4') },
    uCameraPos: { value: new THREE.Vector3() },
    uOpacity: { value: 0.88 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: true,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = 0;
  mesh.renderOrder = 2;

  return { mesh, uniforms };
}
