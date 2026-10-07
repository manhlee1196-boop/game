/* ============================================================================
 *  render.js — Rasterize bản chơi thử ra PNG để KIỂM TRA BẰNG MẮT (không cần trình duyệt)
 *  Cách dùng:  node playtest/tools/render.js <thư-mục-xuất>
 *
 *  Vì môi trường CI không có trình duyệt/node-canvas, script này tự cài:
 *    · một canvas mềm chỉ hỗ trợ đúng các lệnh game dùng (fillRect, drawImage, strokeRect…)
 *    · bộ mã hoá PNG tối giản (zlib của Node)
 *  Chữ (fillText) không được vẽ — ảnh dùng để kiểm tra ĐỊA HÌNH, SPRITE, MÙA, ÁNH SÁNG.
 * ==========================================================================*/
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/* ======================================================== 1) CANVAS MỀM */
function parseColor(css) {
  if (typeof css !== 'string') return [255, 0, 255, 1];
  css = css.trim();
  if (css[0] === '#') {
    if (css.length === 7) return [parseInt(css.substr(1, 2), 16), parseInt(css.substr(3, 2), 16), parseInt(css.substr(5, 2), 16), 1];
    if (css.length === 4) return [parseInt(css[1] + css[1], 16), parseInt(css[2] + css[2], 16), parseInt(css[3] + css[3], 16), 1];
  }
  const m = css.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const p = m[1].split(',').map((s) => parseFloat(s.trim()));
    return [p[0] | 0, p[1] | 0, p[2] | 0, p.length > 3 ? p[3] : 1];
  }
  return [255, 0, 255, 1];
}

class SoftCtx {
  constructor(cv) {
    this.canvas = cv;
    this.fillStyle = '#000';
    this.strokeStyle = '#000';
    this.globalAlpha = 1;
    this.lineWidth = 1;
    this.font = '8px monospace';
    this.textAlign = 'left';
    this.textBaseline = 'top';
    this.imageSmoothingEnabled = false;
    this.filter = 'none';
    this.lineCap = 'butt';
    this.lineJoin = 'miter';
    this.shadowBlur = 0;
  }
  setTransform() { } resetTransform() { } translate() { } scale() { }
  createLinearGradient() { return { addColorStop() { } }; }
  createRadialGradient() { return { addColorStop() { } }; }
  createPattern() { return null; }
  putImageData() { } getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h }; }
  _blend(x, y, r, g, b, a) {
    const cv = this.canvas;
    if (x < 0 || y < 0 || x >= cv.width || y >= cv.height) return;
    const i = (y * cv.width + x) * 4;
    const d = cv.data;
    if (a >= 1) { d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; return; }
    const ia = 1 - a;
    d[i] = Math.round(d[i] * ia + r * a);
    d[i + 1] = Math.round(d[i + 1] * ia + g * a);
    d[i + 2] = Math.round(d[i + 2] * ia + b * a);
    d[i + 3] = Math.max(d[i + 3], Math.round(255 * a));
  }
  fillRect(x, y, w, h) {
    if (global.TRACE) {
      const rec = { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h), c: this.fillStyle };
      if (rec.w * rec.h > 600) global.TRACE.push(rec);
      if (typeof this.fillStyle === 'string' && !/^#|^rgb/.test(this.fillStyle)) global.BADCOLOR.add(this.fillStyle);
    }
    const [r, g, b, a0] = parseColor(this.fillStyle);
    const a = a0 * this.globalAlpha;
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this._blend(xx, yy, r, g, b, a);
  }
  clearRect(x, y, w, h) { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this._clear(xx, yy); }
  _clear(x, y) {
    const cv = this.canvas;
    if (x < 0 || y < 0 || x >= cv.width || y >= cv.height) return;
    const i = (y * cv.width + x) * 4;
    cv.data[i] = cv.data[i + 1] = cv.data[i + 2] = cv.data[i + 3] = 0;
  }
  strokeRect(x, y, w, h) {
    this.fillRect(x, y, w, 1); this.fillRect(x, y + h - 1, w, 1);
    this.fillRect(x, y, 1, h); this.fillRect(x + w - 1, y, 1, h);
  }
  drawImage(src, sx, sy, sw, sh, dx, dy) {
    if (arguments.length === 3) { dx = sx; dy = sy; sx = 0; sy = 0; sw = src.width; sh = src.height; }
    if (arguments.length === 5) { dx = sx; dy = sy; sx = 0; sy = 0; sw = src.width; sh = src.height; }
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const si = ((sy + y) * src.width + (sx + x)) * 4;
        if (si < 0 || si >= src.data.length) continue;
        const a = (src.data[si + 3] / 255) * this.globalAlpha;
        if (a <= 0) continue;
        this._blend(Math.round(dx) + x, Math.round(dy) + y, src.data[si], src.data[si + 1], src.data[si + 2], a);
      }
    }
  }
  // Không có font trong môi trường offline → vẽ KHỐI CHỮ ước lượng
  // (monospace: rộng ≈ 0.62 × cỡ chữ) để soi chữ tràn khung / đè nhau.
  _fontSize() { const m = /(\d+(?:\.\d+)?)px/.exec(this.font || ''); return m ? parseFloat(m[1]) : 8; }
  measureText(t) { return { width: (t || '').length * this._fontSize() * 0.62 }; }
  fillText(t, x, y) {
    if (global.NOTEXT) return;
    const fs = this._fontSize();
    const w = this.measureText(t).width;
    let sx = x;
    if (this.textAlign === 'center') sx = x - w / 2;
    else if (this.textAlign === 'right') sx = x - w;
    this.fillRect(sx, y, Math.max(1, w), fs);
  }
  save() { } restore() { } beginPath() { } moveTo() { } lineTo() { } stroke() { } fill() { } closePath() { }
}

class SoftCanvas {
  constructor(w, h) { this._w = w || 300; this._h = h || 150; this._alloc(); }
  _alloc() { this.data = new Uint8ClampedArray(this._w * this._h * 4); }
  // QUAN TRỌNG: gán .width/.height sau khi tạo (như bakeGround làm) phải cấp phát lại bộ đệm
  get width() { return this._w; }
  set width(v) { this._w = v | 0; this._alloc(); }
  get height() { return this._h; }
  set height(v) { this._h = v | 0; this._alloc(); }
  getContext() { return new SoftCtx(this); }
  addEventListener() { }
}

/* ======================================================== 2) MÃ HOÁ PNG */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function writePNG(file, canvas, scale) {
  scale = scale || 1;
  const W = canvas.width * scale, H = canvas.height * scale;
  const raw = Buffer.alloc(H * (W * 4 + 1));
  let o = 0;
  for (let y = 0; y < H; y++) {
    raw[o++] = 0;
    const sy = Math.floor(y / scale);
    for (let x = 0; x < W; x++) {
      const sx = Math.floor(x / scale);
      const si = (sy * canvas.width + sx) * 4;
      raw[o++] = canvas.data[si]; raw[o++] = canvas.data[si + 1];
      raw[o++] = canvas.data[si + 2]; raw[o++] = canvas.data[si + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
  return file;
}

/* ======================================================== 3) NẠP GAME */
const store = {};
global.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
global.document = { createElement: () => new SoftCanvas(), getElementById: () => null };
global.window = global;
global.performance = { now: () => Date.now() };

const jsDir = path.join(__dirname, '..', 'js');
['pixel.js', 'world.js', 'game.js'].forEach((f) => eval(fs.readFileSync(path.join(jsDir, f), 'utf8')));

const VM = global.VM, W = VM.World, game = VM.game;
const outDir = process.argv[2] || path.join(__dirname, '..', 'screenshots');
fs.mkdirSync(outDir, { recursive: true });

const canvas = new SoftCanvas(VM.W, VM.H);
const ctx = canvas.getContext('2d');

function shot(name, scale) {
  // vẽ 2 khung để các hiệu ứng nhấp nháy ổn định
  game.draw(ctx);
  game.draw(ctx);
  const p = writePNG(path.join(outDir, name + '.png'), canvas, scale || 3);
  console.log('  → ' + p);
}

function step(n, dt) { for (let i = 0; i < n; i++) game.update(dt || 1 / 60); }

console.log('Rendering screenshots…');
global.BADCOLOR = new Set();

/* ---- ẢNH 0: BẢNG SPRITE (soi ở độ phóng đại 6×) ---- */
(function spriteSheet() {
  const SW = 340, SH = 300;
  const c = new SoftCanvas(SW, SH);
  const g = c.getContext('2d');
  VM.rect(g, 0, 0, SW, SH, '#2B2B38');
  const keys = ['turnip', 'tomato', 'corn', 'pumpkin'];

  // 4 cây trồng × 4 giai đoạn
  keys.forEach((k, row) => {
    for (let stg = 0; stg < 4; stg++) {
      const x = 8 + stg * 42, y = 8 + row * 46;
      VM.rect(g, x, y, 36, 40, '#5A4632');
      VM.rect(g, x, y, 36, 1, '#7A6448');
      VM.drawCrop(g, x + 2, y + 2, k, stg, { sparkle: true, quality: 3 });
    }
  });

  // cây chết + cỏ dại + sâu
  const demoCell = { moisture: 0.6, weed: 2, pest: true, crop: null };
  VM.rect(g, 8, 200, 36, 40, '#5A4632');
  VM.drawCrop(g, 10, 202, 'tomato', 3, { dead: true });
  VM.rect(g, 50, 200, 36, 40, '#5A4632');
  VM.drawSoilTile(g, 52, 202, demoCell, 0.5);

  // đất khô / ẩm / tưới đẫm ở 3 mức
  [0.05, 0.55, 1].forEach((m, i) => {
    VM.rect(g, 92 + i * 40, 200, 36, 40, '#5A4632');
    VM.drawSoilTile(g, 94 + i * 40, 202, { moisture: m, weed: 0, pest: false, crop: null }, 0.4);
  });

  // nhân vật 4 hướng × 2 khung
  ['down', 'up', 'left', 'right'].forEach((d, i) => {
    VM.drawPlayer(g, 12 + i * 26, 288, d, 0, {});
    VM.drawPlayer(g, 12 + i * 26 + 13, 288, d, 1, {});
  });

  // công cụ + vật phẩm + thời tiết + tim
  ['hoe', 'water', 'sickle', 'axe', 'pick', 'rod'].forEach((t, i) => VM.drawToolIcon(g, 130 + i * 18, 254, t));
  ['turnip', 'tomato', 'corn', 'pumpkin'].forEach((k, i) => VM.drawItemIcon(g, 130 + i * 18, 274, k, 3));
  ['sunny', 'cloudy', 'rain', 'storm', 'snow', 'fog'].forEach((w, i) => VM.drawWeatherIcon(g, 224 + (i % 3) * 22, 254 + Math.floor(i / 3) * 22, w));
  [true, false].forEach((f, i) => VM.drawHeart(g, 226 + i * 18, 296, f));

  // công trình thu nhỏ
  VM.drawHouse(g, 10, 254, 0);
  VM.drawBarn(g, 60, 254, 0);
  VM.drawWell(g, 108, 254);
  VM.drawShop(g, 292, 254);
  VM.drawTree(g, 268, 254, 0, 0);
  VM.drawTree(g, 268, 296, 3, 1);
  VM.drawFence(g, 150, 296, true);
  // gốc cây (sau khi chặt) — vẽ đúng như trong game.drawProp
  (function stump() {
    const bx = 190, byBottom = 296;
    VM.rect(g, 0, 0, 0, 0, '#000');
    VM.rect(g, bx + 3, byBottom - 7, 10, 6, VM.PAL.woodDark);
    VM.rect(g, bx + 3, byBottom - 7, 10, 1, VM.PAL.wood);
    VM.rect(g, bx + 6, byBottom - 5, 4, 2, '#D8C8A8');
    VM.rect(g, bx + 7, byBottom - 9, 1, 2, VM.PAL.leaf2);
  })();
  VM.drawGroundTile(g, 'grass', 8, 296, 0, 0, 0);
  VM.drawGroundTile(g, 'water', 44, 296, 0, 0, 0);
  VM.drawGroundTile(g, 'path', 80, 296, 0, 0, 0);
  VM.drawGroundTile(g, 'grass', 116, 296, 3, 1, 0);
  VM.drawGroundTile(g, 'water', 152, 296, 2, 0, 0);

  writePNG(path.join(outDir, '00-bang-sprite.png'), c, 6);
  console.log('  → ' + path.join(outDir, '00-bang-sprite.png'));
})();

/* ---- ẢNH 1: ván mới, buổi sáng mùa Xuân ---- */
game.newGame();
game.state.showHelp = false;
game.state.minutes = 8 * 60;
game.state.weather.today = 'sunny';
step(30);
shot('01-van-moi-buoi-sang');

/* ---- TRACE: in các hình chữ nhật lớn để tìm lỗi vẽ ---- */
if (process.env.TRACE) {
  global.TRACE = [];
  game.draw(ctx);
  console.log('\n--- TOP RECT >600px (scene 01) ---');
  global.TRACE.sort((a, b) => b.w * b.h - a.w * a.h).slice(0, 14)
    .forEach((r) => console.log(`   x=${r.x} y=${r.y} w=${r.w} h=${r.h}  ${r.c}`));
  console.log('--- MÀU KHÔNG PHẢI HEX/RGB:', [...global.BADCOLOR].slice(0, 12).join(' | ') || '(không có)', '---\n');
  global.TRACE = null;
}

/* ---- ẢNH 2: trồng đủ 4 giai đoạn để kiểm tra sprite cây ---- */
const st = game.state;
// gieo cây ở các giai đoạn khác nhau trên ruộng
const demo = [
  [14, 17, 'tomato', 0], [15, 17, 'tomato', 1], [16, 17, 'tomato', 2], [17, 17, 'tomato', 3],
  [14, 18, 'corn', 0], [15, 18, 'corn', 1], [16, 18, 'corn', 2], [17, 18, 'corn', 3],
  [14, 19, 'turnip', 3], [15, 19, 'pumpkin', 2], [16, 19, 'pumpkin', 3], [17, 19, 'turnip', 1],
];
demo.forEach(([x, y, key, stage], i) => {
  W.tillCell(x, y, 0.5);
  W.plantCrop(x, y, key);
  const c = W.cellAt(x, y).soil.crop;
  if (c) {
    c.stage = stage;
    c.wateredDays = VM.cropDaysTo(VM.CROPS[key], stage);
    c.quality = i % 4;
    c.seed = i;
  }
});
// vài ô có cỏ dại + sâu bệnh để kiểm tra lớp decor
W.cellAt(19, 17).soil.weed = 2;
W.cellAt(19, 18).soil.pest = true;
W.cellAt(18, 19).soil.weed = 3;
st.player.x = 16 * 16 + 8;
st.player.y = 20 * 16 + 10;
st.player.dir = 'up';
step(10);
shot('02-bon-giai-doan-cay');

/* ---- ẢNH 3: mưa buổi chiều (kiểm tra hạt mưa + đất sẫm) ---- */
st.weather.today = 'rain';
st.minutes = 15 * 60;
step(60);
shot('03-mua-buoi-chieu');

/* ---- ẢNH 4: đêm mùa Hạ + đom đóm ---- */
st.weather.today = 'sunny';
st.season = 1;
W.bakeGround(1);
st.minutes = 21 * 60 + 30;
step(60);
shot('04-dem-mua-ha');

/* ---- ẢNH 5: mùa Thu + bão + sét (kiểm tra rung/nháy) ---- */
st.season = 2;
W.bakeGround(2);
st.weather.today = 'storm';
st.minutes = 16 * 60;
st.flash = 0.5;
step(20);
shot('05-mua-thu-bao');

/* ---- ẢNH 6: mùa Đông (tuyết) + bản đồ tổng thể từ xa ---- */
st.season = 3;
W.bakeGround(3);
st.weather.today = 'snow';
st.minutes = 10 * 60;
st.player.x = 20 * 16;
st.player.y = 17 * 16;
step(60);
shot('06-mua-dong-tuyet');

/* ---- ẢNH 7: bản đồ toàn cảnh (ghép 4 khung để xem layout) ---- */
(function panorama() {
  const big = new SoftCanvas(W.COLS * 16, W.ROWS * 16);
  const bctx = big.getContext('2d');
  bctx.drawImage(W.groundCanvas, 0, 0);
  // vẽ đè các công trình + cây + cây trồng lên toàn cảnh
  const savedCam = { x: st.player.x, y: st.player.y };
  W.props.forEach((pr) => {
    const bx = pr.cx * 16, byBottom = (pr.cy + pr.h) * 16;
    if (pr.type === 'barn') VM.drawBarn(bctx, bx, byBottom - 56);
    else if (pr.type === 'house') VM.drawHouse(bctx, bx, byBottom - 52);
    else if (pr.type === 'shop') VM.drawShop(bctx, bx, byBottom - 28);
    else if (pr.type === 'well') VM.drawWell(bctx, bx, byBottom - 16);
    else if (pr.type === 'tree') VM.drawTree(bctx, bx + 8, byBottom, 0, pr.variant);
    else if (pr.type === 'fence_h') VM.drawFence(bctx, bx, byBottom - 16, true);
  });
  for (let y = 0; y < W.ROWS; y++) {
    for (let x = 0; x < W.COLS; x++) {
      const c = W.cellAt(x, y);
      if (!c.soil) continue;
      VM.drawSoilTile(bctx, x * 16, y * 16, c.soil, 0);
      if (c.soil.crop) {
        VM.drawCrop(bctx, x * 16, y * 16, c.soil.crop.key, c.soil.crop.stage, { sparkle: true, dead: c.soil.crop.dead });
      }
    }
  }
  st.player.x = savedCam.x; st.player.y = savedCam.y;
  writePNG(path.join(outDir, '07-toan-canh-ban-do.png'), big, 1);
  console.log('  → ' + path.join(outDir, '07-toan-canh-ban-do.png'));
})();

console.log('Xong.');
