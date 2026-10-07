/* ============================================================================
 *  world.js — Bản đồ, ô đất, va chạm, ngày/mùa/thời tiết, lưu game
 *  Tương đương: FarmGrid.cs + TimeManager.cs + WeatherSystem.cs (bản Unity)
 * ==========================================================================*/
(function () {
  const VM = window.VM;
  const W = VM.World = {};

  const P = VM.PAL;
  const TS = VM.TS;

  W.COLS = 40;                 // 40 × 16 px = 640 px rộng
  W.ROWS = 30;
  W.DAYS_PER_SEASON = 7;       // bản chơi thử rút ngắn còn 7 ngày/mùa (thiết kế đầy đủ: 28)

  W.cells = [];
  W.props = [];                // cây, công trình… (có y-sort)
  W.waterTiles = [];           // ô nước (để vẽ gợn động)

  /* ------------------------------------------------------------------ TIỆN ÍCH */
  W.idx = (cx, cy) => cy * W.COLS + cx;
  W.inBounds = (cx, cy) => cx >= 0 && cy >= 0 && cx < W.COLS && cy < W.ROWS;
  W.cellAt = (cx, cy) => (W.inBounds(cx, cy) ? W.cells[W.idx(cx, cy)] : null);

  /* ------------------------------------------------------------------ KHỞI TẠO BẢN ĐỒ */
  W.generate = function (season) {
    W.cells = [];
    W.props = [];
    W.waterTiles = [];

    // 1) nền cỏ
    for (let y = 0; y < W.ROWS; y++) {
      for (let x = 0; x < W.COLS; x++) {
        W.cells.push({
          ground: 'grass', variant: (x * 7 + y * 13) % 9,
          soil: null, obj: null, solid: false, fog: false,
        });
      }
    }

    // 2) đường đất: ngang y=15, dọc x=21
    for (let x = 0; x < W.COLS; x++) W.at(x, 15).ground = 'path';
    for (let y = 12; y < 24; y++) W.at(21, y).ground = 'path';

    // 3) hồ nước góc dưới-trái (hình oval)
    for (let y = 20; y < 27; y++) {
      for (let x = 3; x < 12; x++) {
        const dx = (x - 7.5) / 4.5, dy = (y - 23.5) / 3.5;
        if (dx * dx + dy * dy < 1) {
          const c = W.at(x, y);
          c.ground = 'water';
          c.solid = true;
          W.waterTiles.push({ cx: x, cy: y });
        }
      }
    }

    // 4) ruộng đã cuốc sẵn (6×4) để chơi ngay
    for (let y = 17; y < 21; y++) {
      for (let x = 14; x < 20; x++) W.tillCell(x, y, 0.35);
    }

    // 5) công trình
    W.addProp('barn', 27, 6, 4, 4, true);
    W.addProp('house', 5, 5, 4, 4, true);
    W.addProp('shop', 27, 18, 3, 2, true);
    W.addProp('well', 13, 14, 1, 1, true);

    // 6) cây rải rác (không đè lên ruộng/đường/nhà)
    const treeSpots = [[2, 3], [9, 2], [16, 3], [24, 2], [33, 4], [36, 9], [2, 12],
    [34, 14], [37, 20], [30, 25], [24, 27], [17, 26], [26, 13], [12, 8], [3, 17]];
    treeSpots.forEach(([x, y], i) => W.addProp('tree', x, y, 1, 1, true, i));
    // cây là vật cản: phải đi vòng hoặc dùng Rìu (4) để chặt

    // 7) hàng rào quanh ruộng
    for (let x = 13; x <= 20; x++) {
      W.addProp('fence_h', x, 16, 1, 1, true);
      if (x === 16 || x === 17) continue;          // ← cổng vào ruộng
      W.addProp('fence_h', x, 21, 1, 1, true);
    }
    for (let y = 17; y <= 20; y++) { W.addProp('fence_v', 13, y, 1, 1, true); W.addProp('fence_v', 20, y, 1, 1, true); }

    W.bakeGround(season);
  };

  W.at = (cx, cy) => W.cells[W.idx(cx, cy)];

  /** Chặt cây: cây biến thành gốc, ô đi qua được, sau REGROW_DAYS ngày mọc lại */
  W.REGROW_DAYS = 5;
  W.chopTree = function (pr) {
    if (!pr || pr.type !== 'tree') return false;
    pr.type = 'stump';
    pr.days = W.REGROW_DAYS;
    pr.solidNow = false;
    const c = W.cellAt(pr.cx, pr.cy);
    if (c) c.solid = false;
    return true;
  };

  W.addProp = function (type, cx, cy, w, h, solid, variant) {
    W.props.push({ type, cx, cy, w, h, variant: variant || 0, solidNow: true });
    if (!solid) return;
    for (let y = cy; y < cy + h; y++) {
      for (let x = cx; x < cx + w; x++) {
        const c = W.cellAt(x, y);
        if (c) c.solid = true;
      }
    }
  };

  /* ------------------------------------------------------------------ NƯỚNG NỀN */
  W.bakeGround = function (seasonOverride) {
    if (typeof document === 'undefined' || !document.createElement) return;
    const cv = document.createElement('canvas');
    cv.width = W.COLS * TS;
    cv.height = W.ROWS * TS;
    const g = cv.getContext('2d');
    if (!g) return;

    const season = (seasonOverride != null) ? seasonOverride : 0;
    for (let y = 0; y < W.ROWS; y++) {
      for (let x = 0; x < W.COLS; x++) {
        const c = W.at(x, y);
        VM.drawGroundTile(g, c.ground, x * TS, y * TS, season, c.variant, 0);
      }
    }
    W.groundCanvas = cv;
  };

  /* ------------------------------------------------------------------ VA CHẠM */
  W.isSolid = function (cx, cy) {
    const c = W.cellAt(cx, cy);
    if (!c) return true;
    return !!c.solid;
  };

  /* ------------------------------------------------------------------ HÀNH ĐỘNG */
  W.tillCell = function (cx, cy, moisture) {
    const c = W.cellAt(cx, cy);
    if (!c || c.ground !== 'grass' || c.solid) return false;
    if (c.soil) return false;
    c.soil = { moisture: moisture || 0, weed: 0, pest: false, crop: null };
    return true;
  };

  W.waterCell = function (cx, cy) {
    const c = W.cellAt(cx, cy);
    if (!c || !c.soil) return false;
    c.soil.moisture = Math.min(1, c.soil.moisture + 0.4);
    return true;
  };

  W.clearWeeds = function (cx, cy) {
    const c = W.cellAt(cx, cy);
    if (!c || !c.soil) return false;
    c.soil.weed = 0; c.soil.pest = false;
    return true;
  };

  W.plantCrop = function (cx, cy, cropKey) {
    const c = W.cellAt(cx, cy);
    if (!c || !c.soil || c.soil.crop) return false;
    c.soil.crop = { key: cropKey, wateredDays: 0, stage: 0, dryStreak: 0, dead: false, quality: 0, seed: (cx * 31 + cy * 17) % 7 };
    return true;
  };

  W.harvestCrop = function (cx, cy) {
    const c = W.cellAt(cx, cy);
    if (!c || !c.soil || !c.soil.crop) return null;
    const crop = c.soil.crop;
    const def = VM.CROPS[crop.key];
    if (crop.stage !== 3 || crop.dead) return null;

    // số lượng: 1–3 (+1 nếu phẩm chất cầu vồng)
    const qty = 1 + Math.floor(Math.random() * 3) + (crop.quality === 3 ? 1 : 0);

    if (def.regrow > 0) {
      crop.stage = 2;
      crop.wateredDays = VM.cropDaysTo(def, 3) - Math.max(1, def.regrow);
      crop.quality = 0;
      crop.dryStreak = 0;
    } else {
      c.soil.crop = null;
      c.soil.moisture = Math.max(0, c.soil.moisture - 0.15);
    }
    return { key: crop.key, qty, quality: crop.quality };
  };

  W.removeDeadCrop = function (cx, cy) {
    const c = W.cellAt(cx, cy);
    if (!c || !c.soil || !c.soil.crop || !c.soil.crop.dead) return false;
    c.soil.crop = null;
    return true;
  };

  /* ------------------------------------------------------------------ THỜI TIẾT */
  const WEIGHTS = [
    { id: 'sunny', w: 45, autoWater: false, breakChance: 0 },
    { id: 'cloudy', w: 20, autoWater: false, breakChance: 0 },
    { id: 'rain', w: 18, autoWater: true, breakChance: 0 },
    { id: 'storm', w: 5, autoWater: true, breakChance: 0.10 },
    { id: 'snow', w: 10, autoWater: false, breakChance: 0.05, winterOnly: true },
    { id: 'fog', w: 2, autoWater: false, breakChance: 0 },
  ];

  W.rollWeather = function (season) {
    const pool = WEIGHTS.filter((x) => !(x.winterOnly && season !== 3));
    const total = pool.reduce((s, x) => s + x.w, 0);
    let r = Math.random() * total;
    for (const p of pool) { r -= p.w; if (r <= 0) return p.id; }
    return 'sunny';
  };

  W.weatherName = function (id) {
    return ({ sunny: 'Nắng', cloudy: 'Nhiều mây', rain: 'Mưa', storm: 'Bão', snow: 'Tuyết', fog: 'Sương mù' })[id] || id;
  };

  W.weatherInfo = function (id) {
    return WEIGHTS.find((w) => w.id === id) || WEIGHTS[0];
  };

  /* ------------------------------------------------------------------ NGÀY MỚI */
  /**
   * Chạy 1 lần mỗi ngày game — đúng như FarmGrid.HandleNewDay + CropInstance.HandleNewDay bản Unity.
   * @returns {{killed:number, broke:number, grown:number, rain:boolean}}
   */
  W.newDay = function (state) {
    const info = W.weatherInfo(state.weather.today);
    const rain = info.autoWater;
    const breakChance = info.breakChance;
    const season = state.season;
    let killed = 0, broke = 0, grown = 0, regrown = 0;

    // ----------------------------------------------------------------
    //  LƯỢT 1 — TĂNG TRƯỞNG: kiểm tra "có nước" bằng độ ẩm NGAY LÚC QUA NGÀY
    //  (tưới hôm nay => sáng mai cây lớn 1 bậc). Nếu trừ ẩm trước khi kiểm tra
    //  thì tưới xong cây vẫn không lớn — đây là bug đã bị smoke-test bắt được.
    // ----------------------------------------------------------------
    for (let i = 0; i < W.cells.length; i++) {
      const c = W.cells[i];
      if (!c.soil) continue;
      const crop = c.soil.crop;
      if (!crop || crop.dead) continue;

      const def = VM.CROPS[crop.key];
      const gotWater = rain || c.soil.moisture >= 0.3;

      if (gotWater) { crop.dryStreak = 0; crop.wateredDays++; grown++; }
      else crop.dryStreak++;

      // khô hạn kéo dài -> chết
      if (crop.dryStreak >= 5) { crop.dead = true; killed++; continue; }

      // mùa Đông giết cây ngoài trời (bản chơi thử chưa có nhà kính)
      if (season === 3) { crop.dead = true; killed++; continue; }

      // bão/tuyết làm gãy cây
      if (breakChance > 0 && Math.random() < breakChance) { crop.dead = true; broke++; continue; }

      // lên giai đoạn theo số ngày ẩm tích luỹ
      const target = VM.cropStageFromDays(def, crop.wateredDays);
      if (target !== crop.stage) {
        crop.stage = target;
        if (target === 3) {
          const r = Math.random();                        // roll phẩm chất (GDD §4.3)
          crop.quality = r > 0.94 ? 3 : r > 0.82 ? 2 : r > 0.55 ? 1 : 0;
        }
      }
    }

    // ----------------------------------------------------------------
    //  LƯỢT 2 — ĐẤT: khô dần, mọc cỏ dại, sâu bệnh
    // ----------------------------------------------------------------
    for (let i = 0; i < W.cells.length; i++) {
      const c = W.cells[i];
      if (!c.soil) continue;

      c.soil.moisture = rain ? 1 : Math.max(0, c.soil.moisture - 0.35);
      if (c.soil.moisture < 0.05) c.soil.moisture = 0;

      if (Math.random() < 0.04 && c.soil.weed < 3) c.soil.weed++;
      if (!c.soil.pest && Math.random() < 0.02) c.soil.pest = true;
    }

    // ----------------------------------------------------------------
    //  LƯỢT 3 — RỪNG: gốc cây mọc lại sau khi bị chặt
    // ----------------------------------------------------------------
    for (let i = 0; i < W.props.length; i++) {
      const pr = W.props[i];
      if (pr.type !== 'stump') continue;
      pr.days--;
      if (pr.days <= 0) {
        pr.type = 'tree';
        pr.solidNow = true;
        const c = W.cellAt(pr.cx, pr.cy);
        if (c) c.solid = true;
        regrown++;
      }
    }

    return { killed, broke, grown, regrown, rain };
  };

  /* ------------------------------------------------------------------ LƯU / TẢI */
  W.serialize = function (state) {
    const soil = [];
    for (let i = 0; i < W.cells.length; i++) {
      const c = W.cells[i];
      if (!c.soil) continue;
      soil.push({
        i,
        m: +c.soil.moisture.toFixed(2),
        w: c.soil.weed,
        p: c.soil.pest ? 1 : 0,
        c: c.soil.crop ? { k: c.soil.crop.key, d: c.soil.crop.wateredDays, s: c.soil.crop.stage, q: c.soil.crop.quality, x: c.soil.crop.dead ? 1 : 0, ds: c.soil.crop.dryStreak } : null,
      });
    }
    // gốc cây: lưu chỉ số prop + số ngày còn lại (thứ tự props sinh ra luôn giống nhau)
    const stumps = [];
    for (let i = 0; i < W.props.length; i++) {
      const pr = W.props[i];
      if (pr.type === 'stump') stumps.push({ i, d: pr.days });
    }
    return {
      v: 1, soil, stumps,
      player: { x: state.player.x, y: state.player.y, dir: state.player.dir },
      time: { day: state.day, season: state.season, year: state.year, minutes: state.minutes },
      weather: state.weather,
      inv: state.inv, gold: state.gold,
      hearts: state.npc.hearts, stats: state.stats,
    };
  };

  W.deserialize = function (state, data) {
    if (!data) return false;
    W.generate();
    (data.soil || []).forEach((s) => {
      const c = W.cells[s.i];
      if (!c) return;
      c.soil = {
        moisture: s.m, weed: s.w, pest: !!s.p,
        crop: s.c ? { key: s.c.k, wateredDays: s.c.d, stage: s.c.s, quality: s.c.q, dead: !!s.c.x, dryStreak: s.c.ds || 0, seed: (s.i * 13) % 7 } : null,
      };
    });
    if (data.player) { state.player.x = data.player.x; state.player.y = data.player.y; state.player.dir = data.player.dir; }
    if (data.time) { state.day = data.time.day; state.season = data.time.season; state.year = data.time.year; state.minutes = data.time.minutes; }
    if (data.weather) state.weather = data.weather;
    if (data.inv) state.inv = data.inv;
    if (typeof data.gold === 'number') state.gold = data.gold;
    if (data.hearts != null) state.npc.hearts = data.hearts;
    if (data.stats) state.stats = data.stats;
    // khôi phục gốc cây đã chặt
    (data.stumps || []).forEach((s2) => {
      const pr = W.props[s2.i];
      if (!pr || pr.type !== 'tree') return;
      pr.type = 'stump'; pr.days = s2.d; pr.solidNow = false;
      const c = W.cellAt(pr.cx, pr.cy);
      if (c) c.solid = false;
    });
    W.bakeGround(state.season);
    return true;
  };
})();
