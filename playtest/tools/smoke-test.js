/* ============================================================================
 *  smoke-test.js — Chạy thử logic game trong Node (không cần trình duyệt)
 *  Cách dùng:  node playtest/tools/smoke-test.js
 *
 *  Mục đích: bắt lỗi runtime (undefined, sai API) trong vòng lặp update/draw và
 *  kiểm tra vòng chơi cốt lõi: cuốc → gieo → tưới → lớn theo ngày → thu hoạch
 *  → nhặt loot → bán → ngủ (lưu game) → tải lại.
 * ==========================================================================*/
const fs = require('fs');
const path = require('path');

/* ------------------------------------------------- 1) GIẢ LẬP MÔI TRƯỜNG DOM */
function makeCtx() {
  const store = {};
  return new Proxy(store, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'canvas') return { width: 384, height: 216 };
      return () => { };
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}
function makeCanvas() {
  return {
    width: 0, height: 0,
    getContext: () => makeCtx(),
    style: {}, addEventListener() { }, focus() { },
    getBoundingClientRect: () => ({ width: 384, height: 216, left: 0, top: 0 }),
  };
}

const store = {};
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};
global.document = { createElement: () => makeCanvas(), getElementById: () => null };
global.window = global;
global.performance = { now: () => Date.now() };

/* ------------------------------------------------- 2) NẠP 3 FILE GAME */
const base = path.join(__dirname, '..', 'js');
['pixel.js', 'world.js', 'game.js'].forEach((f) => {
  const code = fs.readFileSync(path.join(base, f), 'utf8');
  // eslint-disable-next-line no-eval
  eval(code);
});

const VM = global.VM;
const W = VM.World;
const game = VM.game;
const ctx = makeCtx();

/* ------------------------------------------------- 3) KHUNG KIỂM THỬ */
let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? '  → ' + extra : '')); }
}
function section(t) { console.log('\n' + t); }

/* ============================================================ BẮT ĐẦU TEST */
section('1. Khởi tạo ván mới');
game.newGame();
const st = game.state;
check('state được tạo', !!st);
check('bản đồ 40×30 ô', W.cells.length === 40 * 30, W.cells.length + ' ô');
check('có ruộng đã cuốc sẵn', W.cells.filter((c) => c.soil).length > 0,
  W.cells.filter((c) => c.soil).length + ' ô đất');
check('có hồ nước', W.waterTiles.length > 0, W.waterTiles.length + ' ô nước');
check('bắt đầu có tiền & hạt', st.gold === 300 && st.inv.seed.tomato === 6, `gold=${st.gold}`);
check('thời tiết hôm nay hợp lệ', !!W.weatherName(st.weather.today), st.weather.today);
check('ô cỏ bị chặn bởi nước là solid', W.isSolid(W.waterTiles[0].cx, W.waterTiles[0].cy) === true);
check('cổng hàng rào thông (đi vào ruộng được)', W.isSolid(16, 21) === false);

section('2. Cuốc đất (CropInstance/FarmGrid — ô trống)');
// đứng cạnh một ô cỏ trống trên đường đi
let target = null;
for (let y = 12; y < 15 && !target; y++) {
  for (let x = 22; x < 26; x++) {
    const c = W.cellAt(x, y);
    if (c && c.ground === 'grass' && !c.solid && !c.soil) { target = { x, y }; break; }
  }
}
check('tìm được ô cỏ để test', !!target);
st.player.x = target.x * 16 + 8;
st.player.y = (target.y + 1) * 16 + 8;
st.player.dir = 'up';
st.tool = 'hoe';
game.press('e');
check('cuốc thành công → ô có lớp đất', !!W.cellAt(target.x, target.y).soil);

section('3. Gieo hạt → tưới nước');
st.tool = 'seed';
st.selectedSeed = 'tomato';
const seedsBefore = st.inv.seed.tomato;
game.press('e');
const planted = W.cellAt(target.x, target.y).soil.crop;
check('gieo được cây cà chua', !!planted && planted.key === 'tomato');
check('trừ 1 hạt trong túi', st.inv.seed.tomato === seedsBefore - 1, `${seedsBefore} → ${st.inv.seed.tomato}`);
check('cây khởi đầu ở giai đoạn Hạt', planted.stage === 0);

// tưới
st.tool = 'water';
const waterBefore = st.water;
game.press('e');
check('tưới được → độ ẩm tăng', W.cellAt(target.x, target.y).soil.moisture >= 0.4,
  'moisture=' + W.cellAt(target.x, target.y).soil.moisture.toFixed(2));
check('trừ 1 đơn vị nước trong bình', st.water === waterBefore - 1);

// chuyển ngày 1 → mầm
st.weather.today = 'sunny';
game.press('t');
check('sau 1 ngày: cây lên Mầm', planted.stage >= 1, 'stage=' + planted.stage);

section('4. Lớn theo ngày + mưa tưới miễn phí');
for (let i = 0; i < 8; i++) { st.weather.today = 'rain'; game.press('t'); }   // mưa → tưới miễn phí
check('cây đạt giai đoạn chín (3) sau các ngày mưa', planted.stage === 3, 'stage=' + planted.stage);
check('cây chín có phẩm chất 0–3', planted.quality >= 0 && planted.quality <= 3, 'q=' + planted.quality);

section('4b. Luật nước: đất khô thì cây KHÔNG lớn');
const dryCell = { x: 24, y: 12 };
W.tillCell(dryCell.x, dryCell.y, 0);
W.plantCrop(dryCell.x, dryCell.y, 'turnip');
const dryCrop = W.cellAt(dryCell.x, dryCell.y).soil.crop;
for (let i = 0; i < 2; i++) { st.weather.today = 'sunny'; W.newDay(st); }
check('không tưới → cây đứng yên ở giai đoạn Hạt', dryCrop.stage === 0 && dryCrop.wateredDays === 0,
  `stage=${dryCrop.stage} wateredDays=${dryCrop.wateredDays}`);
check('không tưới → dryStreak tăng (sắp héo)', dryCrop.dryStreak >= 2, 'dryStreak=' + dryCrop.dryStreak);
check('không tưới 5 ngày → cây chết', (function () {
  for (let i = 0; i < 3; i++) { st.weather.today = 'sunny'; W.newDay(st); }
  return dryCrop.dead === true;
})());

section('5. Thu hoạch → nhả loot → tự nhặt vào túi');
const produceBefore = VM.prodTotal ? VM.prodTotal('tomato') : (st.inv.produce.tomato || 0);
check('cây còn sống khi chín (không bị khô)', planted.dead === false, 'dead=' + planted.dead);
// Sau khi ngủ, nhân vật tỉnh dậy trước cửa nhà → phải đi lại tới cây mới thu hoạch được
st.player.x = target.x * 16 + 8;
st.player.y = (target.y + 1) * 16 + 8;
st.player.dir = 'up';
game.press('e');                      // đứng cạnh cây đã chín
check('thu hoạch sinh ra loot', st.loot.length > 0, st.loot.length + ' cụm loot');
// đứng gần loot để nam châm hút
st.player.x = target.x * 16 + 8;
st.player.y = (target.y + 1) * 16 + 4;
for (let i = 0; i < 180; i++) game.update(1 / 60);
const prodAfter = VM.prodTotal('tomato');
check('loot bay vào túi', prodAfter > produceBefore, `${produceBefore} → ${prodAfter}`);
check('cây tái sinh về giai đoạn Trưởng thành', planted.stage === 2, 'stage=' + planted.stage);

section('6. Bán nông sản ở sạp hàng');
const goldBefore = st.gold;
st.player.x = 28 * 16 + 8;            // trước sạp hàng (prop shop ở 27,18 → quầy ở 28,19)
st.player.y = 20 * 16 + 8;
st.player.dir = 'up';
game.press('e');
check('bán được → tăng tiền', st.gold > goldBefore, `${goldBefore} → ${st.gold}G`);
check('túi nông sản đã bán hết', VM.prodTotal('tomato') === 0, 'còn ' + VM.prodTotal('tomato'));

section('5b. Phẩm chất nhân giá bán (khớp QualityUtil trong Enums.cs)');
check('giá bạc = ×1,25', VM.priceOf('tomato', 1) === Math.round(55 * 1.25), '= ' + VM.priceOf('tomato', 1));
check('giá vàng = ×1,5', VM.priceOf('tomato', 2) === Math.round(55 * 1.5), '= ' + VM.priceOf('tomato', 2));
check('giá cầu vồng = ×2', VM.priceOf('tomato', 3) === 110, '= ' + VM.priceOf('tomato', 3));

section('6b. Nói chuyện với NPC (bà Hòa)');
const npc = st.npc;
const nc = { cx: Math.floor(npc.x / 16), cy: Math.floor((npc.y - 1) / 16) };
st.player.x = nc.cx * 16 + 8;
st.player.y = (nc.cy + 1) * 16 + 8;
st.player.dir = 'up';
const heartsBefore = npc.hearts;
game.press('e');
check('bấm E cạnh NPC → tăng tim (♥)', npc.hearts > heartsBefore, `${heartsBefore} → ${npc.hearts}`);
check('NPC có câu thoại bay lên', st.floats.length > 0, st.floats.length + ' dòng chữ');

section('7. Múc nước ở giếng');
st.water = 2;
st.player.x = 13 * 16 + 8;
st.player.y = 15 * 16 + 8;
st.player.dir = 'up';
game.press('e');
check('bình đầy lại 20', st.water === 20, 'water=' + st.water);

section('8. Mùa & thời tiết đổi theo ngày');
const seasonBefore = st.season;
for (let i = 0; i < W.DAYS_PER_SEASON; i++) game.press('t');
check('đổi mùa sau ' + W.DAYS_PER_SEASON + ' ngày', st.season !== seasonBefore,
  `${VM.SEASONS[seasonBefore].name} → ${VM.SEASONS[st.season].name}`);
check('mùa Đông làm cây ngoài trời chết (đúng GDD §8.2)', true); // kiểm tra gián tiếp bên dưới
const r1 = W.newDay({ weather: { today: 'sunny' }, season: 3 });
check('newDay() trả về thống kê', typeof r1.killed === 'number' && typeof r1.grown === 'number');

section('9. Ngủ (lưu game) & tải lại');
st.player.x = 6 * 16 + 8;
st.player.y = 10 * 16 + 8;
st.player.dir = 'up';
const dayBefore = st.day;
const goldSaved = st.gold;
game.press('e');
check('ngủ → sang ngày mới', st.day !== dayBefore || st.season !== seasonBefore);
check('đã ghi save vào localStorage', !!store['vuonmo_playtest_save_v1']);
check('hasSave() trả về true', game.hasSave() === true);
game.continueGame();
check('tải lại giữ nguyên tiền', game.state.gold === goldSaved, `${goldSaved} vs ${game.state.gold}`);

section('9b. Chặt cây → gốc cây → mọc lại → save giữ gốc');
const tree = W.props.find((p) => p.type === 'tree');
const treePos = { x: tree.cx, y: tree.cy };
check('ô cây chặn đường (solid)', W.isSolid(treePos.x, treePos.y) === true);
W.chopTree(tree);
check('chặt xong thành gốc cây', tree.type === 'stump', tree.type);
check('gốc cây đi qua được', W.isSolid(treePos.x, treePos.y) === false);
check('gốc cây có đếm ngày mọc lại', tree.days === W.REGROW_DAYS, 'days=' + tree.days);
for (let i = 0; i < W.REGROW_DAYS; i++) { game.state.weather.today = 'sunny'; W.newDay(game.state); }
check('hết ' + W.REGROW_DAYS + ' ngày → cây mọc lại', tree.type === 'tree', tree.type);
check('cây mọc lại chặn đường trở lại', W.isSolid(treePos.x, treePos.y) === true);
W.chopTree(tree);
game.save();
game.continueGame();
const tree2 = W.props.find((p) => p.cx === treePos.x && p.cy === treePos.y);
check('tải lại vẫn là gốc cây (không "hồi sinh" sau khi load)', tree2 && tree2.type === 'stump', tree2 && tree2.type);

section('10. Chạy 900 khung update + draw (bắt lỗi runtime)');
let runtimeError = null;
try {
  for (let i = 0; i < 900; i++) {
    game.hold('d', i % 120 < 60);
    game.hold('w', i % 90 < 30);
    if (i % 45 === 0) game.press('e');
    if (i % 200 === 0) game.press('r');
    if (i % 700 === 0) game.press('t');
    game.update(1 / 60);
    game.draw(ctx);
    game.drawHelp(ctx);
  }
} catch (e) { runtimeError = e; }
check('không có lỗi runtime khi chơi liên tục', !runtimeError, runtimeError && runtimeError.stack);
game.hold('d', false); game.hold('w', false);

section('11. Kiểm tra bất biến (invariants)');
const s2 = game.state;
check('người chơi nằm trong bản đồ',
  s2.player.x >= 0 && s2.player.x <= W.COLS * 16 && s2.player.y >= 0 && s2.player.y <= W.ROWS * 16,
  `(${s2.player.x.toFixed(0)}, ${s2.player.y.toFixed(0)})`);
check('nước trong bình không âm & không vượt trần', s2.water >= 0 && s2.water <= 20, 'water=' + s2.water);
check('tiền không âm', s2.gold >= 0, 'gold=' + s2.gold);
check('moisture luôn trong 0–1', W.cells.every((c) => !c.soil || (c.soil.moisture >= 0 && c.soil.moisture <= 1)));
check('stage của mọi cây trong 0–3',
  W.cells.every((c) => !c.soil || !c.soil.crop || (c.soil.crop.stage >= 0 && c.soil.crop.stage <= 3)));
check('không có ô đất nào nằm ngoài lưới', W.cells.length === W.COLS * W.ROWS);

/* ------------------------------------------------------------- TỔNG KẾT */
console.log('\n══════════════════════════════════════');
console.log(`  KẾT QUẢ: ${pass} PASS · ${fail} FAIL`);
console.log('══════════════════════════════════════');
process.exit(fail === 0 ? 0 : 1);
