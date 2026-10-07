/* ============================================================================
 *  game.js — Vòng lặp game, input, tương tác, HUD  (bản chơi thử trên trình duyệt)
 *  Port từ: PlayerController2D / PlayerInteractor2D / CropInstance / LootSpawner
 *           HudController2D / WeatherFX2D / DayNightTint2D (Unity C#)
 * ==========================================================================*/
(function () {
  const VM = window.VM;
  const W = VM.World;
  const P = VM.PAL;
  const TS = VM.TS;

  /* ============================================================== CẤU HÌNH */
  const CFG = {
    walkSpeed: 58,          // px/giây (≈ 3.6 tile/s)
    runSpeed: 88,
    playerW: 10,
    playerH: 8,
    secondsPerHour: 3.5,    // 1 giờ game = 3.5 giây thực
    dayStart: 360,          // 6:00
    dayEnd: 1560,           // 26:00 = 2:00 sáng -> tự ngủ
    waterMax: 20,
    magnetRadius: 40,
    lootMax: 40,
    startGold: 300,
    startSeeds: { turnip: 6, tomato: 6, corn: 6 },
  };

  const TOOLS = ['hoe', 'water', 'sickle', 'axe', 'pick', 'rod', 'none', 'seed'];
  const TOOL_NAMES = { hoe: 'Cuốc', water: 'Bình tưới', sickle: 'Liềm', axe: 'Rìu', pick: 'Cuốc chim', rod: 'Cần câu', none: 'Tay không', seed: 'Túi hạt giống' };

  /* ================================================================= STATE */
  const S = VM.game = {
    state: null,
    ready: false,
    paused: false,
    showHelp: true,
    time: 0,
  };

  function newState() {
    return {
      player: { x: 21 * 16 + 8, y: 17 * 16 + 10, dir: 'down', frame: 0, animT: 0, moving: false, running: false },
      tool: 'hoe',
      selectedSeed: 'tomato',
      water: CFG.waterMax,
      gold: CFG.startGold,
      inv: { seed: Object.assign({}, CFG.startSeeds), produce: {} },
      minutes: CFG.dayStart,
      day: 1, season: 0, year: 1,
      weather: { today: 'sunny', tomorrow: 'sunny', dayAfter: 'sunny' },
      npc: { x: 28 * 16, y: 21 * 16, dir: 'down', hearts: 0, talkedToday: false, giftToday: false },
      loot: [], particles: [], floats: [], toasts: [],
      stats: { harvested: 0, earned: 0, daysPlayed: 1 },
      flash: 0, shakeX: 0, shakeY: 0, hintShown: {},
    };
  }

  /* ==================================================== TÚI NÔNG SẢN THEO PHẨM CHẤT
   *  Số liệu khớp Unity: ItemData.baseSellPrice × QualityUtil.PriceMultiplier(q)
   *  q: 0 = Thường, 1 = Bạc, 2 = Vàng, 3 = Cầu vồng
   * ====================================================================== */
  const QUALITY_MULT = [1.00, 1.25, 1.50, 2.00];
  const QUALITY_NAME = ['Thường', 'Bạc', 'Vàng', 'Cầu vồng'];
  const Q_SUFFIX = ['', ' *', ' **', ' ***'];   // khớp QualityUtil.Suffix trong Enums.cs

  /** Mảng 4 phẩm chất của 1 mặt hàng (tự tạo; tự chuyển từ save cũ dạng số) */
  function prodArr(key) {
    let v = S.state.inv.produce[key];
    if (typeof v === 'number') v = [v, 0, 0, 0];
    if (!Array.isArray(v)) v = [0, 0, 0, 0];
    while (v.length < 4) v.push(0);
    S.state.inv.produce[key] = v;
    return v;
  }
  function prodTotal(key) { return prodArr(key).reduce((a, b) => a + b, 0); }
  function prodAdd(key, qty, quality) {
    prodArr(key)[Math.max(0, Math.min(3, quality | 0))] += qty;
  }
  /** Lấy ra 1 món ngon nhất trong túi (dùng khi tặng quà) */
  function prodTakeBest(key) {
    const a = prodArr(key);
    for (let q = 3; q >= 0; q--) { if (a[q] > 0) { a[q]--; return q; } }
    return -1;
  }
  function prodAllKeys() { return Object.keys(S.state.inv.produce).filter((k) => prodTotal(k) > 0); }
  /** Giá 1 món theo phẩm chất (nông sản theo bảng CROPS; gỗ/đá giá cố định) */
  function priceOf(key, q) {
    if (VM.CROPS[key]) return Math.round(VM.CROPS[key].sell * QUALITY_MULT[q]);
    if (key === 'wood') return 12;
    if (key === 'stone') return 8;
    return 10;
  }

  /* =============================================================== HELPERS */
  function toast(msg, color) {
    S.state.toasts.push({ msg, t: 2.6, color: color || P.cream });
    if (S.state.toasts.length > 3) S.state.toasts.shift();
  }

  function floatText(x, y, msg, color) {
    S.state.floats.push({ x, y, msg, color: color || P.white, t: 1.1 });
  }

  function burst(x, y, color, n, spread) {
    n = n || 6; spread = spread || 26;
    for (let i = 0; i < n; i++) {
      S.state.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * spread,
        vy: -Math.random() * (spread * 0.8) - 6,
        life: 0.5 + Math.random() * 0.3,
        t: 0,
        color,
        size: Math.random() < 0.3 ? 2 : 1,
      });
    }
  }

  const isRaining = () => W.weatherInfo(S.state.weather.today).autoWater;

  function hourFloat() { return S.state.minutes / 60; }

  function clockString() {
    const m = Math.floor(S.state.minutes);
    const h = Math.floor(m / 60) % 24;
    const mm = m % 60;
    return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  }

  function facingCell() {
    const p = S.state.player;
    const cx = Math.floor(p.x / TS);
    const cy = Math.floor((p.y - 1) / TS);
    const d = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[p.dir];
    return { cx: cx + d[0], cy: cy + d[1], ownX: cx, ownY: cy };
  }

  function propAt(cx, cy) {
    for (const pr of W.props) {
      if (cx >= pr.cx && cx < pr.cx + pr.w && cy >= pr.cy && cy < pr.cy + pr.h) return pr;
    }
    return null;
  }

  /** Ô tương tác của công trình (cửa nhà, quầy hàng…) */
  function interactionSpot(pr) {
    if (!pr) return null;
    if (pr.type === 'house') return { cx: pr.cx + 1, cy: pr.cy + pr.h - 1, kind: 'sleep' };
    if (pr.type === 'shop') return { cx: pr.cx + 1, cy: pr.cy + pr.h - 1, kind: 'shop' };
    if (pr.type === 'well') return { cx: pr.cx, cy: pr.cy, kind: 'water' };
    if (pr.type === 'barn') return { cx: pr.cx + 1, cy: pr.cy + pr.h - 1, kind: 'barn' };
    return null;
  }

  function npcCell() {
    const n = S.state.npc;
    return { cx: Math.floor(n.x / TS), cy: Math.floor((n.y - 1) / TS) };
  }

  /* ================================================================== INPUT */
  const keys = {};

  S.press = function (k) {
    switch (k) {
      case '1': S.state.tool = 'hoe'; toast('Cầm: Cuốc'); break;
      case '2': S.state.tool = 'water'; toast('Cầm: Bình tưới'); break;
      case '3': S.state.tool = 'sickle'; toast('Cầm: Liềm'); break;
      case '4': S.state.tool = 'axe'; toast('Cầm: Rìu'); break;
      case '5': S.state.tool = 'pick'; toast('Cầm: Cuốc chim'); break;
      case '6': S.state.tool = 'rod'; toast('Cầm: Cần câu (chưa có trong bản chơi thử)'); break;
      case '8': case 'q': cycleSeed(); break;
      case 'b': buySeed(); break;
      case 'e': interact(); break;
      case 't': skipDay('Bạn bấm T — tua nhanh 1 ngày'); break;
      case 'r': forceWeather(); break;
      case 'h': S.showHelp = !S.showHelp; break;
      case 'escape': S.paused = !S.paused; break;
      case 'p': S.hideHud = !S.hideHud; break;
    }
  };

  S.hold = function (k, down) { keys[k] = down; };

  function cycleSeed() {
    const owned = Object.keys(VM.CROPS).filter((k) => (S.state.inv.seed[k] || 0) > 0);
    const list = owned.length ? owned : Object.keys(VM.CROPS);
    const i = list.indexOf(S.state.selectedSeed);
    S.state.selectedSeed = list[(i + 1) % list.length];
    S.state.tool = 'seed';
    const left = S.state.inv.seed[S.state.selectedSeed] || 0;
    toast(`Hạt: ${VM.CROPS[S.state.selectedSeed].name} (còn ${left})`);
  }

  function buySeed() {
    const key = S.state.selectedSeed;
    const price = VM.CROPS[key].seedPrice;
    if (S.state.gold < price) { toast('Không đủ tiền mua hạt!', '#FF8A8A'); return; }
    S.state.gold -= price;
    S.state.inv.seed[key] = (S.state.inv.seed[key] || 0) + 1;
    toast(`Mua 1 hạt ${VM.CROPS[key].name} (−${price}G)`);
  }

  function forceWeather() {
    const s = S.state.season;
    const list = ['sunny', 'cloudy', 'rain', 'storm', 'fog'].concat(s === 3 ? ['snow'] : []);
    S.state.weather.today = list[Math.floor(Math.random() * list.length)];
    toast(`Thời tiết đổi: ${W.weatherName(S.state.weather.today)}`);
    if (S.state.weather.today === 'storm') S.state.flash = 0.6;
  }

  /* ============================================================ TƯƠNG TÁC (E) */
  function interact() {
    const st = S.state;
    const f = facingCell();

    // 1) công trình (quầy hàng / giếng / cửa nhà) — ưu tiên trước NPC,
    //    để bà Hòa đứng gần sạp không "che" mất chức năng bán hàng
    const pr = propAt(f.cx, f.cy);
    if (pr) {
      const spot = interactionSpot(pr);
      if (spot && spot.cx === f.cx && spot.cy === f.cy) {
        if (spot.kind === 'sleep') { sleep(); return; }
        if (spot.kind === 'shop') { useShop(); return; }
        if (spot.kind === 'water') {
          st.water = CFG.waterMax;
          floatText(st.player.x, st.player.y - 26, 'Nước đầy!', '#7FD3E8');
          toast('Đã múc đầy bình tưới');
          return;
        }
        if (spot.kind === 'barn') { toast('Chuồng sẽ có gia súc ở bản đầy đủ 🐔'); return; }
      }
      if (pr.type === 'tree') {
        if (st.tool === 'axe') {
          if (W.chopTree(pr)) {
            prodAdd('wood', 2, 0);
            burst(f.cx * TS + 8, f.cy * TS + 8, P.wood, 10, 30);
            floatText(st.player.x, st.player.y - 28, '+2 Gỗ', P.wood);
            toast(`Đã chặt cây, nhận 2 Gỗ — gốc mọc lại sau ${W.REGROW_DAYS} ngày`);
          }
        } else toast('Cần Rìu (phím 4) để chặt cây');
        return;
      }
      if (pr.type.indexOf('fence') === 0) { toast('Hàng rào — dùng máy cày hoặc rìu ở bản đầy đủ'); return; }
      return; // các prop khác chặn

    }

    // 2) NPC
    const nc = npcCell();
    if ((f.cx === nc.cx && f.cy === nc.cy) || (f.ownX === nc.cx && f.ownY === nc.cy)) { talkNPC(); return; }

    // 3) ô đất / cây trồng
    const cell = W.cellAt(f.cx, f.cy);
    if (!cell) { toast('Ngoài khu vực canh tác'); return; }

    if (cell.ground === 'water') { toast(isRaining() ? 'Trời đang mưa…' : 'Hồ nước — câu cá sẽ có ở bản đầy đủ'); return; }

    // --- có cây ---
    if (cell.soil && cell.soil.crop) {
      const crop = cell.soil.crop;
      const def = VM.CROPS[crop.key];

      if (crop.dead) {
        if (st.tool === 'hoe') {
          W.removeDeadCrop(f.cx, f.cy);
          toast('Đã dọn cây chết');
        } else toast('Cây đã chết — cần Cuốc (phím 1) để dọn');
        return;
      }

      if (crop.stage === 3) {
        const got = W.harvestCrop(f.cx, f.cy);
        if (got) {
          st.stats.harvested += got.qty;
          spawnLoot(f.cx, f.cy, got.key, got.qty, got.quality);
          burst(f.cx * TS + 8, f.cy * TS + 8, def.fruit, 8, 24);
          return;
        }
      }

      const thirsty = !isRaining() && cell.soil.moisture < 0.3;
      if (thirsty) {
        if (st.tool !== 'water' && st.tool !== 'none') { toast('Cây đang khát — chọn Bình tưới (phím 2)'); return; }
        if (st.water <= 0) { toast('Bình đã hết nước — ra giếng múc (E vào giếng)'); return; }
        st.water--;
        W.waterCell(f.cx, f.cy);
        burst(f.cx * TS + 8, f.cy * TS + 4, '#7FD3E8', 6, 18);
        floatText(f.cx * TS + 8, f.cy * TS - 6, 'Đã tưới', '#7FD3E8');
        return;
      }

      const left = Math.max(0, VM.cropDaysTo(def, 3) - crop.wateredDays);
      toast(`${def.name}: ${['Hạt giống', 'Mầm', 'Trưởng thành', 'Đã chín'][crop.stage]} — còn ${left} ngày`);
      return;
    }

    // --- ô đất trống ---
    if (cell.soil) {
      if (cell.soil.weed > 0 && st.tool === 'hoe') {
        W.clearWeeds(f.cx, f.cy);
        burst(f.cx * TS + 8, f.cy * TS + 8, P.leaf3, 5, 16);
        toast('Đã dọn cỏ dại');
        return;
      }
      if (st.tool === 'water') {
        if (st.water <= 0) { toast('Bình đã hết nước — ra giếng múc'); return; }
        st.water--;
        W.waterCell(f.cx, f.cy);
        burst(f.cx * TS + 8, f.cy * TS + 4, '#7FD3E8', 5, 16);
        return;
      }
      if (st.tool === 'seed') {
        const key = st.selectedSeed;
        const have = st.inv.seed[key] || 0;
        if (have <= 0) { toast(`Hết hạt ${VM.CROPS[key].name} — bấm B để mua (hoặc Q đổi loại)`); return; }
        W.plantCrop(f.cx, f.cy, key);
        st.inv.seed[key] = have - 1;
        burst(f.cx * TS + 8, f.cy * TS + 10, P.soilDark, 5, 14);
        floatText(f.cx * TS + 8, f.cy * TS, `Gieo ${VM.CROPS[key].name}`, '#8FD06B');
        if (st.inv.seed[key] === 0) toast(`Hết hạt ${VM.CROPS[key].name}!`);
        return;
      }
      toast('Đất đã cuốc sẵn — chọn Túi hạt (phím 8/Q) để gieo, hoặc Bình tưới (2)');
      return;
    }

    // --- cỏ (chưa cuốc) ---
    if (cell.ground === 'grass') {
      if (st.tool === 'hoe') {
        W.tillCell(f.cx, f.cy, 0.1);
        burst(f.cx * TS + 8, f.cy * TS + 8, P.soil, 7, 20);
        return;
      }
      toast('Cần Cuốc (phím 1) để cuốc đất');
      return;
    }
    toast('Không thể làm gì ở đây');
  }

  /* --------------------------------------------------------------- NPC & SHOP */
  function talkNPC() {
    const st = S.state;
    const lines = isRaining()
      ? ['Trời mưa thế này đỡ phải tưới, cháu nhỉ!', 'Mưa tốt cho cây lắm đấy.']
      : hourFloat() >= 18
        ? ['Muộn rồi, nhớ ngủ trước 2 giờ sáng nhé.', 'Đêm ở thung lũng đẹp lắm.']
        : ['Chào cháu! Hôm nay định trồng gì?', 'Cà chua mùa Hạ là ngon nhất đấy!', 'Bí ngô mùa Thu bán được giá lắm.'];

    const line = lines[Math.floor(Math.random() * lines.length)];
    floatText(st.npc.x, st.npc.y - 34, line, P.cream);

    if (!st.npc.talkedToday) {
      st.npc.talkedToday = true;
      st.npc.hearts += 1;
      floatText(st.npc.x, st.npc.y - 46, '♥ +1', '#E5484D');
    }

    // tặng quà: nếu có nông sản thì tặng 1 món
    if (!st.npc.giftToday) {
      const key = prodAllKeys().find((k) => VM.CROPS[k]);
      if (key) {
        const q = prodTakeBest(key);
        st.npc.giftToday = true;
        st.npc.hearts += 1;
        floatText(st.npc.x, st.npc.y - 58,
          `Tặng ${VM.CROPS[key].name}${Q_SUFFIX[q]} ♥+1`, '#E5484D');
      }
    }
    return;
  }

  function useShop() {
    const st = S.state;
    let total = 0, sold = 0;
    for (const key of Object.keys(st.inv.produce)) {
      const arr = prodArr(key);
      for (let q = 0; q < 4; q++) {
        const n = arr[q];
        if (!n) continue;
        total += priceOf(key, q) * n;     // phẩm chất cao bán được nhiều tiền hơn
        sold += n;
      }
      st.inv.produce[key] = [0, 0, 0, 0];
    }
    if (sold === 0) { toast('Chưa có gì để bán — hãy thu hoạch trước! (B để mua hạt)'); return; }
    st.gold += total;
    st.stats.earned += total;
    floatText(st.player.x, st.player.y - 30, `+${total}G`, P.gold);
    toast(`Bán ${sold} món, nhận ${total}G`);
  }

  /* --------------------------------------------------------------- LƯU LƯỢNG TỬ */
  function spawnLoot(cx, cy, key, qty, quality) {
    const st = S.state;
    const ox = cx * TS + 8, oy = cy * TS + 10;
    const clusters = Math.min(3, qty);
    const per = Math.ceil(qty / clusters);
    for (let i = 0; i < clusters; i++) {
      const n = (i === clusters - 1) ? qty - per * (clusters - 1) : per;
      if (n <= 0) continue;
      const tx = ox + (Math.random() - 0.5) * 22;
      const ty = oy + (Math.random() - 0.5) * 14;
      st.loot.push({
        x: ox, y: oy, fromX: ox, fromY: oy, toX: tx, toY: ty,
        t: 0, dur: 0.45, popping: true,
        key, qty: n, quality: quality || 0,
        restX: tx, restY: ty, bobT: Math.random() * 6,
      });
    }
    if (st.loot.length > CFG.lootMax) st.loot.splice(0, st.loot.length - CFG.lootMax);
  }

  function collectLoot(l) {
    const st = S.state;
    const def = VM.CROPS[l.key];
    prodAdd(l.key, l.qty, l.quality || 0);
    st.gold += 0; // bán ở sạp hàng
    floatText(l.x, l.y - 6, `+${l.qty} ${def ? def.name : l.key}`, def ? def.fruit : P.white);
    burst(l.x, l.y, def ? def.fruit : P.white, 4, 12);
  }

  /* ---------------------------------------------------------------- NGÀY MỚI */
  function skipDay(why) {
    const st = S.state;
    const res = W.newDay(st);

    st.day++;
    st.stats.daysPlayed++;
    if (st.day > W.DAYS_PER_SEASON) {
      st.day = 1;
      st.season = (st.season + 1) % 4;
      if (st.season === 0) st.year++;
      W.bakeGround(st.season);
      toast(`🍃 Sang mùa ${VM.SEASONS[st.season].name}!`, '#8FD06B');
    }

    // thời tiết trôi
    st.weather.today = st.weather.tomorrow;
    st.weather.tomorrow = st.weather.dayAfter;
    st.weather.dayAfter = W.rollWeather(st.season);

    st.minutes = CFG.dayStart;
    st.npc.talkedToday = false;
    st.npc.giftToday = false;
    st.player.x = 6 * 16 + 8;   // thức dậy trước cửa nhà
    st.player.y = 9 * 16 + 12;

    // tổng kết ngày
    if (why) toast(why);
    if (res.regrown > 0) toast(`🌱 ${res.regrown} gốc cây đã mọc lại`, P.leaf2);
    const parts = [`Ngày ${st.day} · ${VM.SEASONS[st.season].name} · ${W.weatherName(st.weather.today)}`];
    if (res.killed) parts.push(`${res.killed} cây chết khô`);
    if (res.broke) parts.push(`${res.broke} cây gãy do bão`);
    if (res.rain) parts.push('mưa tưới hộ toàn bộ ruộng');
    toast(parts.join(' · '));

    save();
  }

  function sleep() {
    const st = S.state;
    if (st.minutes < 1080) { toast('Còn sớm mà! (Ngủ để sang ngày mới — vẫn được, nhưng phí ngày đẹp)'); }
    skipDay('Bạn đã ngủ một giấc');
  }

  /* ---------------------------------------------------------------- LƯU GAME */
  const SAVE_KEY = 'vuonmo_playtest_save_v1';

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(W.serialize(S.state)));
    } catch (e) { /* bỏ qua nếu trình duyệt chặn localStorage */ }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      S.state = newState();
      return W.deserialize(S.state, data);
    } catch (e) { return false; }
  }

  function hasSave() {
    try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
  }

  S.newGame = function () {
    S.state = newState();
    S.state.npc.hearts = 0;
    W.generate();
    S.ready = true;
    S.showHelp = true;
    toast('Chào mừng tới Vườn Mơ! Bấm H để xem hướng dẫn.', '#8FD06B');
  };

  S.continueGame = function () {
    const ok = load();
    S.ready = true;
    if (ok) toast('Đã tải ván đã lưu');
    else S.newGame();
  };

  S.hasSave = hasSave;
  S.save = save;                 // API cho kiểm thử
  S.skipDay = skipDay;

  /* ================================================================ UPDATE */
  S.update = function (dt) {
    if (!S.ready || S.paused) return;
    const st = S.state;
    S.time += dt;

    /* ---- 1) THỜI GIAN ---- */
    st.minutes += dt * (60 / CFG.secondsPerHour);
    if (st.minutes >= CFG.dayEnd) skipDay('Bạn gục xuống ngủ lúc 2 giờ sáng…');

    /* ---- 2) DI CHUYỂN ---- */
    const p = st.player;
    let dx = 0, dy = 0;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    p.running = !!(keys['shift']);

    const len = Math.hypot(dx, dy);
    p.moving = len > 0;
    if (p.moving) {
      dx /= len; dy /= len;
      const spd = (p.running ? CFG.runSpeed : CFG.walkSpeed) * (isRaining() ? 0.9 : 1);
      // trục X
      let nx = p.x + dx * spd * dt;
      if (!blocked(nx, p.y)) p.x = nx;
      // trục Y
      let ny = p.y + dy * spd * dt;
      if (!blocked(p.x, ny)) p.y = ny;

      // hướng sprite: ưu tiên trục ngang (giống DirectionUtil.FromVector)
      if (Math.abs(dx) >= Math.abs(dy)) p.dir = dx > 0 ? 'right' : 'left';
      else p.dir = dy > 0 ? 'down' : 'up';

      p.animT += dt * (p.running ? 10 : 7);
      p.frame = Math.floor(p.animT) % 4;
    } else {
      p.animT = 0; p.frame = 0;
    }

    // kẹp trong bản đồ
    p.x = Math.max(10, Math.min(W.COLS * TS - 10, p.x));
    p.y = Math.max(14, Math.min(W.ROWS * TS - 6, p.y));

    /* ---- 3) LOOT ---- */
    for (let i = st.loot.length - 1; i >= 0; i--) {
      const l = st.loot[i];
      if (l.popping) {
        l.t += dt;
        const n = Math.min(1, l.t / l.dur);
        l.x = l.fromX + (l.toX - l.fromX) * n;
        l.y = l.fromY + (l.toY - l.fromY) * n - Math.sin(n * Math.PI) * 10;
        if (n >= 1) { l.popping = false; l.restX = l.toX; l.restY = l.toY; }
      } else {
        l.bobT += dt * 4;
        l.y = l.restY - Math.abs(Math.sin(l.bobT)) * 1.5;
        const d = Math.hypot(l.x - p.x, l.y - (p.y - 10));
        if (d < CFG.magnetRadius) {
          l.x += (p.x - l.x) * Math.min(1, dt * 9);
          l.y += ((p.y - 10) - l.y) * Math.min(1, dt * 9);
          if (d < 7) { collectLoot(l); st.loot.splice(i, 1); }
        }
      }
    }

    /* ---- 4) PARTICLE + CHỮ NỔI ---- */
    for (let i = st.particles.length - 1; i >= 0; i--) {
      const q = st.particles[i];
      q.t += dt;
      q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 42 * dt;
      if (q.t >= q.life) st.particles.splice(i, 1);
    }
    for (let i = st.floats.length - 1; i >= 0; i--) {
      const f = st.floats[i];
      f.t -= dt; f.y -= dt * 12;
      if (f.t <= 0) st.floats.splice(i, 1);
    }
    for (let i = st.toasts.length - 1; i >= 0; i--) {
      st.toasts[i].t -= dt;
      if (st.toasts[i].t <= 0) st.toasts.splice(i, 1);
    }

    /* ---- 5) SÉT / RUNG CAMERA ---- */
    if (st.flash > 0) st.flash -= dt;
    if (st.weather.today === 'storm' && Math.random() < dt * 0.18) st.flash = 0.12;
    if (st.weather.today === 'storm') {
      st.shakeX = (Math.random() - 0.5) * 1.5;
      st.shakeY = (Math.random() - 0.5) * 1.5;
    } else { st.shakeX = st.shakeY = 0; }

    /* ---- 6) NPC đi lang thang nhẹ ---- */
    const n = st.npc;
    if (!n.talkedToday || true) {
      n.wanderT = (n.wanderT || 0) - dt;
      if (n.wanderT <= 0) {
        n.wanderT = 2 + Math.random() * 3;
        // vùng đi lang thang: tile x 25–29, y 20–22 (không đè lên ô quầy hàng 28,19)
        n.tx = 25 * TS + Math.random() * 64;
        n.ty = 20 * TS + Math.random() * 36 + 6;
      }
      if (n.tx != null) {
        const ddx = n.tx - n.x, ddy = n.ty - n.y;
        const dl = Math.hypot(ddx, ddy);
        if (dl > 1) {
          n.x += (ddx / dl) * 16 * dt;
          n.y += (ddy / dl) * 16 * dt;
          n.dir = Math.abs(ddx) > Math.abs(ddy) ? (ddx > 0 ? 'right' : 'left') : (ddy > 0 ? 'down' : 'up');
        }
      }
    }
  };

  function blocked(px, py) {
    const hw = CFG.playerW / 2, hh = CFG.playerH;
    const pts = [[px - hw, py - 1], [px + hw, py - 1], [px - hw, py - hh], [px + hw, py - hh]];
    for (const [x, y] of pts) {
      const cx = Math.floor(x / TS), cy = Math.floor(y / TS);
      if (W.isSolid(cx, cy)) return true;
    }
    return false;
  }

  /* ================================================================== DRAW */
  S.draw = function (ctx) {
    if (!S.ready) return;
    const st = S.state;
    const camX = Math.round(Math.max(0, Math.min(W.COLS * TS - VM.W, st.player.x - VM.W / 2 + st.shakeX)));
    const camY = Math.round(Math.max(0, Math.min(W.ROWS * TS - VM.H, st.player.y - VM.H / 2 + st.shakeY)));

    ctx.imageSmoothingEnabled = false;

    /* 1) NỀN (đã nướng) */
    if (W.groundCanvas) ctx.drawImage(W.groundCanvas, camX, camY, VM.W, VM.H, 0, 0, VM.W, VM.H);

    /* 2) Gợn nước động */
    const t = S.time;
    for (const wt of W.waterTiles) {
      const x = wt.cx * TS - camX, y = wt.cy * TS - camY;
      if (x < -TS || y < -TS || x > VM.W || y > VM.H) continue;
      const f = Math.floor(t * 3 + wt.cx * 0.7 + wt.cy * 1.3) % 3;
      VM.rect(ctx, x + 2 + f * 3, y + 5, 4, 1, 'rgba(127,211,232,0.75)');
      VM.rect(ctx, x + 8 - f, y + 11, 3, 1, 'rgba(127,211,232,0.55)');
    }

    /* 3) LỚP ĐẤT + CÂY (y-sort cùng nhân vật) */
    const drawables = [];

    // ô đất có cây / cỏ dại
    const seenProp = new Set();
    for (let cy = Math.floor(camY / TS) - 2; cy <= Math.floor((camY + VM.H) / TS) + 2; cy++) {
      for (let cx = Math.floor(camX / TS) - 2; cx <= Math.floor((camX + VM.W) / TS) + 2; cx++) {
        const c = W.cellAt(cx, cy);
        if (!c || !c.soil) continue;
        const sx = cx * TS - camX, sy = cy * TS - camY;
        VM.drawSoilTile(ctx, sx, sy, c.soil, t);
        if (c.soil.crop) {
          const crop = c.soil.crop;
          const sway = Math.floor(t * 2 + crop.seed) % 2 === 0;
          const sparkle = crop.stage === 3 && Math.floor(t * 1.6) % 2 === 0;
          drawables.push({
            sortY: cy * TS + 16,
            fn: () => VM.drawCrop(ctx, sx, sy, crop.key, crop.stage,
              { sway, sparkle, dead: crop.dead }),
          });
        }
      }
    }

    // props
    for (const pr of W.props) {
      const bx = pr.cx * TS - camX;
      const byBottom = (pr.cy + pr.h) * TS - camY;
      if (bx < -140 || bx > VM.W + 140 || byBottom < -140 || byBottom > VM.H + 140) continue;
      drawables.push({
        sortY: (pr.cy + pr.h) * TS,
        fn: () => drawProp(ctx, pr, bx, byBottom),
      });
    }

    // NPC
    drawables.push({
      sortY: st.npc.y,
      fn: () => {
        VM.drawPlayer(ctx, st.npc.x - camX, st.npc.y - camY, st.npc.dir, 0,
          { cloth: '#8A5F33', cloth2: '#6E4726', hat: '#C8D4E0', hatDark: '#9AA5B1', skin: '#F2C9A0' });
        // tim trên đầu
        for (let i = 0; i < 3; i++) VM.drawHeart(ctx, st.npc.x - camX - 15 + i * 11, st.npc.y - camY - 34, i < st.npc.hearts);
      },
    });

    // NGƯỜI CHƠI
    drawables.push({
      sortY: st.player.y,
      fn: () => VM.drawPlayer(ctx, st.player.x - camX, st.player.y - camY, st.player.dir,
        st.player.moving ? st.player.frame : 0, { tool: st.tool === 'none' ? null : st.tool }),
    });

    // LOOT
    for (const l of st.loot) {
      drawables.push({
        sortY: l.y + 1,
        fn: () => {
          const bob = l.popping ? 0 : 1;
          VM.drawItemIcon(ctx, l.x - camX - 4, l.y - camY - 8 - bob, l.key, l.quality);
        },
      });
    }

    drawables.sort((a, b) => a.sortY - b.sortY);
    drawables.forEach((d) => d.fn());

    /* 4) PARTICLES */
    for (const q of st.particles) {
      ctx.globalAlpha = Math.max(0, 1 - q.t / q.life);
      VM.rect(ctx, q.x - camX, q.y - camY, q.size, q.size, q.color);
      ctx.globalAlpha = 1;
    }

    /* 5) THỜI TIẾT */
    drawWeather(ctx, camX, camY, t);

    /* 6) CHỮ NỔI */
    for (const f of st.floats) {
      ctx.globalAlpha = Math.min(1, f.t * 1.6);
      VM.textCenter(ctx, f.msg, f.x - camX, f.y - camY, P.ink, 8);
      VM.textCenter(ctx, f.msg, f.x - camX - 1, f.y - camY - 1, f.color, 8);
      ctx.globalAlpha = 1;
    }

    /* 7) Ô ĐANG NHẮM (khung nhấp nháy) */
    const fc = facingCell();
    const bx = fc.cx * TS - camX, by = fc.cy * TS - camY;
    if (Math.floor(t * 3) % 2 === 0) {
      ctx.strokeStyle = 'rgba(255,233,184,0.9)';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 0.5, by + 0.5, TS - 1, TS - 1);
    }

    /* 8) LỚP PHỦ NGÀY/ĐÊM + MÙA */
    drawLighting(ctx, t);

    /* 9) SÉT */
    if (st.flash > 0.06) {
      VM.rect(ctx, 0, 0, VM.W, VM.H, 'rgba(255,255,255,' + Math.min(0.7, st.flash * 3) + ')');
    }

    /* 10) HUD */
    if (!S.hideHud) drawHUD(ctx);
  };

  function drawProp(ctx, pr, bx, byBottom) {
    switch (pr.type) {
      case 'barn': VM.drawBarn(ctx, bx, byBottom - 56); break;
      case 'house': VM.drawHouse(ctx, bx, byBottom - 52); break;
      case 'shop': VM.drawShop(ctx, bx, byBottom - 28); break;
      case 'well': VM.drawWell(ctx, bx, byBottom - 16); break;
      case 'tree': VM.drawTree(ctx, bx + 8, byBottom, S.state.season, pr.variant); break;
      case 'stump': {
        // gốc cây sau khi chặt: đi qua được, sau W.REGROW_DAYS ngày mọc lại thành cây
        VM.rect(ctx, bx + 3, byBottom - 7, 10, 6, P.woodDark);
        VM.rect(ctx, bx + 3, byBottom - 7, 10, 1, P.wood);
        VM.rect(ctx, bx + 6, byBottom - 5, 4, 2, '#D8C8A8');
        if (pr.days <= 1) VM.rect(ctx, bx + 7, byBottom - 9, 1, 2, P.leaf2);   // mầm nhú
        break;
      }
      case 'fence_h': VM.drawFence(ctx, bx, byBottom - 16, true); break;
      case 'fence_v':
        VM.rect(ctx, bx + 6, byBottom - 16, 3, 16, P.wood);
        VM.rect(ctx, bx + 6, byBottom - 12, 3, 1, P.woodDark);
        VM.rect(ctx, bx + 6, byBottom - 6, 3, 1, P.woodDark);
        break;
    }
  }

  function drawWeather(ctx, camX, camY, t) {
    const st = S.state;
    const w = st.weather.today;
    const seed = Math.floor(t * 60);

    if (w === 'rain' || w === 'storm') {
      const n = w === 'storm' ? 90 : 55;
      for (let i = 0; i < n; i++) {
        const x = (i * 37 + seed * (w === 'storm' ? 9 : 6)) % (VM.W + 40) - 20;
        const y = (i * 71 + seed * (w === 'storm' ? 14 : 10)) % (VM.H + 20) - 10;
        const len = w === 'storm' ? 6 : 4;
        VM.rect(ctx, x, y, 1, len, 'rgba(200,230,255,0.55)');
        if (w === 'storm') VM.rect(ctx, x - 1, y + 2, 1, len - 2, 'rgba(200,230,255,0.35)');
      }
    } else if (w === 'snow') {
      for (let i = 0; i < 60; i++) {
        const x = (i * 53 + Math.sin(t * 0.6 + i) * 8 + seed * 2) % VM.W;
        const y = (i * 29 + seed * 2) % VM.H;
        VM.rect(ctx, x, y, 1, 1, 'rgba(255,255,255,0.85)');
      }
    } else if (w === 'fog') {
      for (let i = 0; i < 3; i++) {
        const y = ((i * 70 + t * 8) % (VM.H + 60)) - 30;
        VM.rect(ctx, 0, y, VM.W, 18, 'rgba(220,228,236,0.12)');
      }
    }

    // đom đóm ban đêm mùa Hạ
    const h = hourFloat();
    if (st.season === 1 && (h >= 19 || h < 5)) {
      for (let i = 0; i < 14; i++) {
        const x = (i * 61 + Math.sin(t * 0.5 + i * 2) * 12) % VM.W;
        const y = (i * 43 + Math.cos(t * 0.4 + i) * 10) % VM.H;
        VM.px1(ctx, x, y, 'rgba(255,233,120,' + (0.5 + 0.5 * Math.sin(t * 3 + i)) + ')');
      }
    }
  }

  function drawLighting(ctx, t) {
    const st = S.state;
    const h = hourFloat();
    let c = null;

    if (h < 7) c = 'rgba(255,233,184,0.10)';
    else if (h < 11) { const a = 0.10 * (1 - (h - 7) / 4); c = a > 0.01 ? `rgba(255,233,184,${a})` : null; }
    else if (h >= 17 && h < 20) { const a = 0.20 * ((h - 17) / 3); c = `rgba(255,176,102,${a})`; }
    else if (h >= 20 && h < 23) { const a = 0.20 + 0.35 * ((h - 20) / 3); c = `rgba(38,57,110,${a})`; }
    else if (h >= 23 || h < 5) c = 'rgba(22,32,74,0.68)';

    // thời tiết xấu làm tối cả khung hình (không chỉ vẽ hạt mưa)
    const wx = st.weather.today;
    if (wx === 'rain') c = c ? c : 'rgba(64,86,118,0.22)';
    else if (wx === 'storm') c = c ? c : 'rgba(38,50,80,0.36)';
    if (wx === 'fog') c = c ? c : 'rgba(206,216,226,0.22)';
    if (wx === 'snow') c = c ? c : 'rgba(214,228,244,0.16)';
    if (wx === 'cloudy') c = c ? c : 'rgba(120,130,150,0.10)';

    if (c) { ctx.fillStyle = c; ctx.fillRect(0, 0, VM.W, VM.H); }
    // mưa/bão: lớp tối thứ hai để nền rõ ràng là "trời mưa"
    if (wx === 'rain' || wx === 'storm') {
      ctx.fillStyle = wx === 'storm' ? 'rgba(24,34,58,0.26)' : 'rgba(46,64,94,0.16)';
      ctx.fillRect(0, 0, VM.W, VM.H);
    }
    // sắc thái mùa
    const seasonTint = VM.SEASONS[st.season].tint;
    if (seasonTint) { ctx.fillStyle = seasonTint; ctx.fillRect(0, 0, VM.W, VM.H); }
  }

  /* =================================================================== HUD */
  /** Đo bề rộng chữ an toàn: có measureText thì dùng, không thì ước lượng */
  function textWidth(ctx, str, size) {
    if (ctx.measureText) {
      const m = ctx.measureText(str);
      if (m && typeof m.width === 'number' && m.width > 0) return m.width;
    }
    return str.length * (size || 8) * 0.62;
  }

  function drawHUD(ctx) {
    const st = S.state;
    const t = S.time;

    /* --- góc trên trái: ngày/mùa/giờ --- */
    VM.panel(ctx, 4, 4, 108, 30);
    VM.text(ctx, clockString(), 9, 8, P.cream, 10);
    VM.drawWeatherIcon(ctx, 46, 6, st.weather.today);
    VM.text(ctx, `${W.weatherName(st.weather.today)}`, 64, 8, P.gray, 8);
    VM.text(ctx, `Ngày ${st.day} · ${VM.SEASONS[st.season].name} · Năm ${st.year}`, 9, 22, P.gold, 8);

    /* --- góc trên phải: tiền --- */
    VM.panel(ctx, VM.W - 74, 4, 70, 16);
    VM.rect(ctx, VM.W - 70, 8, 8, 8, P.gold);
    VM.rect(ctx, VM.W - 70, 8, 8, 2, '#FFF0B8');
    VM.text(ctx, `${st.gold}G`, VM.W - 58, 8, P.cream, 9);

    /* --- dự báo 3 ngày --- */
    VM.panel(ctx, VM.W - 74, 22, 70, 16);
    VM.drawWeatherIcon(ctx, VM.W - 71, 22, st.weather.tomorrow);
    VM.drawWeatherIcon(ctx, VM.W - 54, 22, st.weather.dayAfter);
    VM.text(ctx, 'dự báo', VM.W - 36, 26, P.gray, 8);

    /* --- thanh nước --- */
    VM.panel(ctx, 4, VM.H - 40, 62, 14);
    VM.text(ctx, 'Nước', 8, VM.H - 38, P.gray, 8);
    VM.rect(ctx, 30, VM.H - 36, 32, 6, '#2A2E3A');
    VM.rect(ctx, 31, VM.H - 35, Math.round(30 * (st.water / CFG.waterMax)), 4, P.water2);

    /* --- hotbar --- */
    const slots = TOOLS;
    const slotW = 22;
    const hbW = slots.length * slotW + 4;
    const hbX = Math.round((VM.W - hbW) / 2);
    const hbY = VM.H - 26;
    VM.panel(ctx, hbX, hbY, hbW, 22);
    for (let i = 0; i < slots.length; i++) {
      const x = hbX + 2 + i * slotW;
      const active = slots[i] === st.tool;
      VM.rect(ctx, x, hbY + 2, 20, 18, active ? 'rgba(255,211,78,0.22)' : 'rgba(0,0,0,0.25)');
      if (active && Math.floor(t * 3) % 2 === 0) VM.rect(ctx, x, hbY + 2, 20, 1, P.gold);
      VM.drawToolIcon(ctx, x, hbY + 2, slots[i]);
      VM.text(ctx, String(i < 6 ? i + 1 : (i === 7 ? '8' : '')), x + 2, hbY + 13, P.gray, 7);

      // ô hạt giống: hiện số lượng + loại hạt đang chọn
      if (slots[i] === 'seed') {
        const n = st.inv.seed[st.selectedSeed] || 0;
        VM.text(ctx, String(n), x + 15, hbY + 13, n > 0 ? P.cream : '#FF8A8A', 7);
        const c = VM.CROPS[st.selectedSeed];
        VM.rect(ctx, x + 14, hbY + 4, 4, 4, c.fruit);
      }
    }

    /* --- tên công cụ + hạt --- */
    let toolLine = `${TOOL_NAMES[st.tool]}  ·  Hạt: ${VM.CROPS[st.selectedSeed].name} (${st.inv.seed[st.selectedSeed] || 0})`;
    while (textWidth(ctx, toolLine, 8) > VM.W - 12 && toolLine.length > 10) {
      toolLine = toolLine.slice(0, -2);   // thu ngắn nếu màn hình/font quá rộng
    }
    VM.textCenter(ctx, toolLine, VM.W / 2, hbY - 11, P.cream, 8);

    /* --- prompt [E] --- */
    const prompt = buildPrompt();
    if (prompt) {
      // đo bề rộng chữ thật (font tỉ lệ khác nhau giữa các máy) rồi mới vẽ khung
      const tw = textWidth(ctx, prompt, 8);
      const w = Math.min(VM.W - 12, Math.ceil(tw) + 14);
      VM.panel(ctx, Math.round((VM.W - w) / 2), hbY - 26, w, 13, 'rgba(20,16,24,0.85)', P.gold);
      VM.textCenter(ctx, prompt, VM.W / 2, hbY - 23, P.cream, 8);
    }

    /* --- túi đồ (nông sản) --- */
    const items = prodAllKeys();
    if (items.length) {
      let x = 70;
      const y = VM.H - 24;
      VM.panel(ctx, x - 4, y - 2, Math.min(VM.W - x - 4, items.length * 34 + 8), 18);
      for (const k of items.slice(0, 8)) {
        const best = prodArr(k).reduce((acc, n, q) => (n > 0 ? q : acc), 0);
        VM.drawItemIcon(ctx, x, y + 1, k, best);
        VM.text(ctx, 'x' + prodTotal(k), x + 9, y + 3, P.cream, 8);
        x += 34;
      }
    }

    /* --- hearts NPC --- */
    if (st.npc.hearts > 0) {
      VM.text(ctx, `♥ Bà Hòa: ${st.npc.hearts}`, 6, VM.H - 54, P.rose, 8);
    }

    /* --- toast --- */
    const y0 = 44;
    st.toasts.forEach((tt, i) => {
      const a = Math.min(1, tt.t);
      ctx.globalAlpha = a;
      const w = Math.min(VM.W - 24, tt.msg.length * 5 + 16);
      VM.panel(ctx, Math.round((VM.W - w) / 2), y0 + i * 15, w, 13);
      VM.textCenter(ctx, tt.msg, VM.W / 2, y0 + 3 + i * 15, tt.color, 8);
      ctx.globalAlpha = 1;
    });
  }

  function buildPrompt() {
    const st = S.state;
    const f = facingCell();

    const pr = propAt(f.cx, f.cy);
    if (pr) {
      const spot = interactionSpot(pr);
      if (spot && spot.cx === f.cx && spot.cy === f.cy) {
        if (spot.kind === 'sleep') return '[E] Ngủ (sang ngày mới + lưu game)';
        if (spot.kind === 'shop') return '[E] Bán nông sản cho bà Hòa';
        if (spot.kind === 'water') return '[E] Múc đầy bình tưới';
        if (spot.kind === 'barn') return '[E] Xem chuồng';
      }
      if (pr.type === 'tree') return st.tool === 'axe' ? '[E] Chặt cây' : 'Cần Rìu (4) để chặt cây';
      if (pr.type.indexOf('fence') === 0) return '';
      return '';
    }

    const nc = npcCell();
    if (f.cx === nc.cx && f.cy === nc.cy) return '[E] Nói chuyện với bà Hòa';

    const cell = W.cellAt(f.cx, f.cy);
    if (!cell) return '';
    if (cell.ground === 'water') return 'Hồ nước';

    if (cell.soil && cell.soil.crop) {
      const crop = cell.soil.crop;
      const def = VM.CROPS[crop.key];
      if (crop.dead) return st.tool === 'hoe' ? '[E] Dọn cây chết' : 'Cây chết (cần Cuốc)';
      if (crop.stage === 3) return `[E] Thu hoạch ${def.name}${['', ' ★', ' ★★', ' ★★★'][crop.quality]}`;
      const thirsty = !isRaining() && cell.soil.moisture < 0.3;
      if (thirsty) return st.tool === 'water' ? '[E] Tưới nước' : 'Cây khát — chọn Bình tưới (2)';
      const left = Math.max(0, VM.cropDaysTo(def, 3) - crop.wateredDays);
      return `${def.name} — ${['Hạt', 'Mầm', 'Trưởng thành', 'Chín'][crop.stage]} · còn ${left} ngày`;
    }

    if (cell.soil) {
      if (cell.soil.weed > 0 && st.tool === 'hoe') return '[E] Dọn cỏ dại';
      if (st.tool === 'water') return '[E] Tưới nước';
      if (st.tool === 'seed') return `[E] Gieo ${VM.CROPS[st.selectedSeed].name}`;
      return 'Đất đã cuốc — chọn Túi hạt (8/Q) hoặc Bình tưới (2)';
    }

    if (cell.ground === 'grass') return st.tool === 'hoe' ? '[E] Cuốc đất' : 'Cần Cuốc (1) để cuốc đất';
    return '';
  }

  /* ============================================ API CHO KIỂM THỬ (không dùng trong game) */
  VM.prodTotal = prodTotal;      // tổng số món trong túi theo loại
  VM.prodArr = prodArr;          // [Thường, Bạc, Vàng, Cầu vồng]
  VM.priceOf = priceOf;          // giá 1 món theo phẩm chất

  /* ============================================================ HƯỚNG DẪN */
  S.drawHelp = function (ctx) {
    if (!S.showHelp) return;
    const w = 256, h = 192;
    const x = Math.round((VM.W - w) / 2), y = Math.round((VM.H - h) / 2);
    VM.panel(ctx, x, y, w, h, 'rgba(16,12,20,0.94)', P.gold);
    VM.textCenter(ctx, 'HƯỚNG DẪN CHƠI THỬ', VM.W / 2, y + 7, P.gold, 10);

    const lines = [
      'WASD / mũi tên : đi bộ    Shift : chạy',
      '1 Cuốc · 2 Bình tưới · 3 Liềm · 4 Rìu (chặt cây)',
      '5 Cuốc chim · 6 Cần câu  ·  8/Q : đổi hạt   B : mua hạt',
      'E : tương tác ô TRƯỚC MẶT (khung nhấp nháy)',
      '',
      'Vòng chơi: 1+E cuốc đất → 8+E gieo hạt',
      '→ 2+E tưới nước → chờ ngày trôi (hoặc ngủ',
      'ở cửa nhà, hoặc bấm T) → E thu hoạch.',
      'Thu hoạch xong, loot sẽ tự bay vào túi.',
      'Mang nông sản tới sạp hàng (E) để bán lấy G.',
      'Phẩm chất Bạc/Vàng/Cầu vồng bán được ×1,25/1,5/2.',
      'Chặt cây bằng Rìu (4) → +2 Gỗ; gốc cây mọc lại sau 5 ngày.',
      '',
      'T : tua 1 ngày   R : đổi thời tiết',
      'P : ẩn HUD       Esc : tạm dừng',
      '',
      'Bấm H để đóng/mở bảng này',
    ];
    lines.forEach((l, i) => VM.text(ctx, l, x + 10, y + 24 + i * 9, l ? P.cream : P.gray, 8));
  };
})();
