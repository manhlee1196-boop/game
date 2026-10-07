/* ============================================================================
 *  boot-test.js — Chạy thử TOÀN BỘ index.html (kể cả script trong trang) với DOM giả,
 *  để bắt lỗi mà smoke-test không thấy: sai id phần tử, nút bấm không hoạt động,
 *  thiếu canvas, lỗi trong vòng lặp requestAnimationFrame…
 *
 *  Cách dùng:  node playtest/tools/boot-test.js
 * ==========================================================================*/
const fs = require('fs');
const path = require('path');

/* ---------------------------------------------- 1) DOM GIẢ (đủ dùng) */
const listeners = {};           // window: sự kiện -> [fn]
const elements = {};            // id -> phần tử giả

class FakeEl {
  constructor(tag) {
    this.tagName = (tag || 'div').toUpperCase();
    this.style = {};
    this.children = [];
    this.dataset = {};
    this._listeners = {};
    this.textContent = '';
    this.disabled = false;
    this.offsetWidth = 384; this.offsetHeight = 216;
  }
  addEventListener(type, fn) { (this._listeners[type] = this._listeners[type] || []).push(fn); }
  removeEventListener() { }
  dispatch(type, ev) { (this._listeners[type] || []).forEach((f) => f(ev || {})); }
  appendChild(c) { this.children.push(c); return c; }
  getContext() { return makeCtx(this._soft); }
  focus() { fakeDoc.activeElement = this; }
  getBoundingClientRect() { return { width: 384, height: 216, left: 0, top: 0 }; }
  classList = { add() { }, remove() { }, toggle() { }, contains: () => false };
}

let FakeCanvas = null;   // gán sau khi SoftCanvas được eval

function makeCtx(cv) {
  const c = new SoftCtx(cv || new SoftCanvas(384, 216));
  return new Proxy(c, {
    get(t, k) {
      if (k in t) return t[k];
      return () => { };
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}

// 2 lớp canvas tối giản (tái dùng từ render.js)
const src = fs.readFileSync(path.join(__dirname, 'render.js'), 'utf8');
const cut = src.indexOf('/* ======================================================== 3) NẠP GAME */');
eval(src.slice(0, cut) + '\nglobal.SoftCanvas=SoftCanvas; global.SoftCtx=SoftCtx;');

FakeCanvas = class extends SoftCanvas {
  constructor(w, h) { super(w || 384, h || 216); this.style = {}; this._listeners = {}; }
  getContext() { return makeCtx(this); }
  addEventListener() { } focus() { }
  getBoundingClientRect() { return { width: this.width, height: this.height, left: 0, top: 0 }; }
};

const fakeDoc = {
  activeElement: null,
  getElementById(id) { return elements[id] || null; },
  createElement(tag) { return (String(tag).toLowerCase() === 'canvas') ? new FakeCanvas(300, 150) : new FakeEl(tag); },
  addEventListener() { },
};

global.document = fakeDoc;
global.window = global;
global.performance = { now: () => Date.now() };
global.localStorage = { _s: {}, getItem(k) { return k in this._s ? this._s[k] : null; }, setItem(k, v) { this._s[k] = String(v); }, removeItem(k) { delete this._s[k]; } };
global.addEventListener = (t, fn) => { (listeners[t] = listeners[t] || []).push(fn); };
global.removeEventListener = () => { };
const rafQueue = [];
global.requestAnimationFrame = (fn) => { rafQueue.push(fn); return rafQueue.length; };
global.devicePixelRatio = 2;

/* ---------------------------------------------- 2) ĐỌC index.html */
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// tìm các id mà trang tham chiếu và tạo phần tử tương ứng
const ids = [...new Set([...html.matchAll(/getElementById\(['"]([\w-]+)['"]\)/g)].map((m) => m[1]))];
elements['game'] = new FakeCanvas(384, 216);
ids.forEach((id) => { if (!elements[id]) elements[id] = new FakeEl('div'); });

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? '  → ' + extra : '')); }
}

/* ---------------------------------------------- 3) NẠP 3 FILE JS GAME */
const jsDir = path.join(__dirname, '..', 'js');
['pixel.js', 'world.js', 'game.js'].forEach((f) => {
  eval(fs.readFileSync(path.join(jsDir, f), 'utf8'));
});

/* ---------------------------------------------- 4) CHẠY SCRIPT TRONG TRANG */
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
check(`index.html có ${scripts.length} khối <script> nội tuyến`, scripts.length >= 1);

console.log('\n1. Nạp script trong trang');
let err = null;
try { scripts.forEach((code) => eval(code)); } catch (e) { err = e; }
check('script trang chạy không lỗi', !err, err && err.stack.split('\n').slice(0, 3).join(' | '));

console.log('\n2. Trang tham chiếu phần tử nào');
check('có canvas #game', !!elements['game']);
ids.forEach((id) => check(`phần tử #${id} tồn tại`, !!elements[id]));
const missing = ids.filter((id) => !elements[id]);
check('không thiếu phần tử nào', missing.length === 0, missing.join(', '));

console.log('\n3. Nút "CHƠI MỚI" hoạt động');
const startEl = elements['start'];
const btnNew = elements['btnNew'];
check('có nút #btnNew', !!btnNew);
let clickErr = null;
try { btnNew.dispatch('click', {}); } catch (e) { clickErr = e; }
check('bấm nút không lỗi', !clickErr, clickErr && clickErr.message);
check('menu khởi đầu đã ẩn (display = none)', startEl && startEl.style.display === 'none', startEl && startEl.style.display);
check('đã tạo ván chơi (VM.game.state)', !!(global.VM && global.VM.game && global.VM.game.state));

console.log('\n4. Vòng lặp requestAnimationFrame chạy được 60 khung');
check('trang có gọi requestAnimationFrame', rafQueue.length > 0, rafQueue.length + ' khung xếp hàng');
let loopErr = null, frames = 0;
try {
  // mô phỏng: bấm giữ phím D + W vài khung, bấm E vài lần
  for (let i = 0; i < 60; i++) {
    (listeners['keydown'] || []).forEach((fn) => fn({ key: i % 3 === 0 ? 'd' : (i % 7 === 0 ? 'e' : 'w'), preventDefault() { } }));
    if (i % 25 === 0) (listeners['keyup'] || []).forEach((fn) => fn({ key: 'w', preventDefault() { } }));
    const q = rafQueue.splice(0, rafQueue.length);
    q.forEach((fn) => { fn(Date.now() + i * 16); frames++; });
  }
} catch (e) { loopErr = e; }
check(`chạy ${frames} khung không lỗi`, !loopErr, loopErr && loopErr.stack.split('\n').slice(0, 3).join(' | '));

console.log('\n5. Sự kiện bàn phím & mất tiêu điểm');
let keyErr = null;
try {
  (listeners['blur'] || []).forEach((fn) => fn({}));
  (listeners['keydown'] || []).forEach((fn) => fn({ key: 'Escape', preventDefault() { } }));
  (listeners['resize'] || []).forEach((fn) => fn({}));
  (listeners['keyup'] || []).forEach((fn) => fn({ key: 'd', preventDefault() { } }));
} catch (e) { keyErr = e; }
check('blur/esc/resize không lỗi', !keyErr, keyErr && keyErr.message);

console.log('\n6. Không có tham chiếu mạng ngoài (bắt buộc cho iframe offline)');
const ext = [...html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)].map((m) => m[1])
  .filter((u) => /^(https?:)?\/\//.test(u));
check('không nạp CDN/font/file ngoài', ext.length === 0, ext.join(', '));
const netCalls = /fetch\(|XMLHttpRequest|WebSocket|import\s*\(/.test(html +
  fs.readFileSync(path.join(jsDir, 'game.js'), 'utf8') +
  fs.readFileSync(path.join(jsDir, 'world.js'), 'utf8') +
  fs.readFileSync(path.join(jsDir, 'pixel.js'), 'utf8'));
check('mã game không gọi mạng', !netCalls);

console.log('\n══════════════════════════════════════');
console.log(`  KẾT QUẢ: ${pass} PASS · ${fail} FAIL`);
console.log('══════════════════════════════════════');
process.exit(fail === 0 ? 0 : 1);
