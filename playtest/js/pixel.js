/* ============================================================================
 *  pixel.js — Lớp vẽ pixel art (palette, helper, sprite vẽ bằng code)
 *  Bám đúng thông số trong docs/01-GDD.md §2:
 *    · tile 16×16 px = 1 world unit · palette 48 màu · viền #3B2A33
 *  Không dùng ảnh ngoài — mọi sprite được vẽ bằng hình chữ nhật 1px
 *  (tương đương "vẽ tay trong Aseprite", chỉ khác là vẽ bằng code).
 * ==========================================================================*/
(function () {
  const VM = (window.VM = window.VM || {});

  VM.W = 384;            // độ phân giải nội bộ (24×13.5 tile hiển thị)
  VM.H = 216;
  VM.TS = 16;            // Tile Size = 16 px (khớp PPU 16)

  /* ---------------------------------------------------------------- PALETTE */
  VM.PAL = {
    ink:      '#3B2A33',   // viền (không dùng đen tuyệt đối)
    inkSoft:  '#2A1E26',
    cream:    '#FFE9B8',
    gold:     '#FFD34E',
    goldDark: '#C9A227',
    rose:     '#F7A8B8',
    terra:    '#E5762C',
    wood:     '#B58252',
    woodDark: '#8A5F33',
    woodDeep: '#6E4726',
    soil:     '#8A5F33',
    soilDark: '#6E4726',
    soilWet:  '#5A3A1E',
    stone:    '#9AA5B1',
    stoneDark:'#6E7A88',
    skin:     '#F2C9A0',
    skinDark: '#D8A87C',
    cloth:    '#5A78B8',
    clothDark:'#3B4E82',
    white:    '#FFFFFF',
    gray:     '#C8D4E0',
    leaf1:    '#8FD06B',
    leaf2:    '#6FBF57',
    leaf3:    '#4E9A45',
    leaf4:    '#3E8036',
    water1:   '#4FA8D8',
    water2:   '#7FD3E8',
    water3:   '#2E6FA8',
  };

  /* ---------------------------------------------------------------- HELPERS */
  const P = VM.PAL;

  /** Vẽ 1 hình chữ nhật theo đơn vị PIXEL (đã làm tròn) */
  VM.rect = function (ctx, x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };

  /** Vẽ 1 pixel đơn lẻ */
  VM.px1 = function (ctx, x, y, c) { VM.rect(ctx, x, y, 1, 1, c); };

  /** Vẽ chữ kiểu bitmap (dùng font monospace ở kích thước pixel) */
  VM.text = function (ctx, str, x, y, color, size) {
    ctx.font = (size || 8) + 'px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = color || P.ink;
    ctx.fillText(str, Math.round(x), Math.round(y));
  };

  VM.textCenter = function (ctx, str, cx, y, color, size) {
    ctx.font = (size || 8) + 'px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = color || P.ink;
    ctx.fillText(str, Math.round(cx), Math.round(y));
  };

  /** Khung gỗ 9-slice 8-bit cho UI */
  VM.panel = function (ctx, x, y, w, h, fill, border) {
    fill = fill || 'rgba(20,16,24,0.82)';
    border = border || P.cream;
    VM.rect(ctx, x, y, w, h, fill);
    VM.rect(ctx, x, y, w, 1, border);
    VM.rect(ctx, x, y + h - 1, w, 1, border);
    VM.rect(ctx, x, y, 1, h, border);
    VM.rect(ctx, x + w - 1, y, 1, h, border);
  };

  /* --------------------------------------------------------------- MÙA */
  VM.SEASONS = [
    { id: 'spring', name: 'Xuân', g1: '#8FD06B', g2: '#6FBF57', g3: '#4E9A45', sky: '#7EC0EE', tint: 'rgba(255,233,184,0.05)' },
    { id: 'summer', name: 'Hạ',   g1: '#6FBF57', g2: '#57A845', g3: '#3E8036', sky: '#5FB8F0', tint: 'rgba(255,211,78,0.05)' },
    { id: 'fall',   name: 'Thu',  g1: '#C99A4E', g2: '#A87B3C', g3: '#8A6330', sky: '#C9D6E8', tint: 'rgba(229,118,44,0.08)' },
    { id: 'winter', name: 'Đông', g1: '#F2F7FB', g2: '#D6E4F0', g3: '#B8CCDE', sky: '#C6D6E4', tint: 'rgba(191,227,238,0.10)' },
  ];

  /* ------------------------------------------------------------- CÂY TRỒNG */
  // Khớp bảng cân bằng GDD §4.2 (bản chơi thử cho trồng mọi mùa để dễ thử)
  VM.CROPS = {
    turnip: {
      name: 'Củ cải', leaf: '#8FD06B', leafDark: '#6FBF57', fruit: '#F2EAD8', fruitHi: '#FFFFFF',
      shape: 'bush', days: [1, 1, 1], regrow: 0, sell: 35, seedPrice: 20, seasons: ['spring'],
    },
    tomato: {
      name: 'Cà chua', leaf: '#6FBF57', leafDark: '#4E9A45', fruit: '#E5484D', fruitHi: '#FF8A8A',
      shape: 'trellis', days: [1, 2, 3], regrow: 2, sell: 55, seedPrice: 45, seasons: ['summer'],
    },
    corn: {
      name: 'Ngô', leaf: '#8FD06B', leafDark: '#57A845', fruit: '#FFD34E', fruitHi: '#FFF0B8',
      shape: 'stalk', days: [2, 3, 4], regrow: 3, sell: 80, seedPrice: 70, seasons: ['summer'],
    },
    pumpkin: {
      name: 'Bí ngô', leaf: '#6FBF57', leafDark: '#4E9A45', fruit: '#E5762C', fruitHi: '#FFB066',
      shape: 'vine', days: [2, 4, 4], regrow: 0, sell: 200, seedPrice: 130, seasons: ['fall'],
    },
  };

  VM.cropTotalDays = function (c) { return c.days[0] + c.days[1] + c.days[2]; };
  VM.cropDaysTo = function (c, stage) {
    let s = 0;
    for (let i = 0; i < stage; i++) s += c.days[i];
    return s;
  };
  VM.cropStageFromDays = function (c, d) {
    if (d >= VM.cropDaysTo(c, 3)) return 3;
    if (d >= VM.cropDaysTo(c, 2)) return 2;
    if (d >= VM.cropDaysTo(c, 1)) return 1;
    return 0;
  };

  /* ------------------------------------------------------------- NHÂN VẬT */
  /**
   * Nhân vật 14×20 px, hướng down/left/right/up, 4 khung đi.
   * (px, pyFeet) = toạ độ chân.
   */
  VM.drawPlayer = function (ctx, x, yFeet, dir, frame, opt) {
    opt = opt || {};
    const skin = opt.skin || P.skin;
    const cloth = opt.cloth || P.cloth;
    const cloth2 = opt.cloth2 || P.clothDark;
    const hat = opt.hat || P.gold;
    const hatDark = opt.hatDark || P.goldDark;

    x = Math.round(x); yFeet = Math.round(yFeet);
    const top = yFeet - 20;
    const walking = frame > 0;
    const bob = (frame === 1 || frame === 3) ? 1 : 0;   // nhún nhẹ khi bước

    // ---- bóng đổ
    VM.rect(ctx, x - 5, yFeet - 1, 10, 2, 'rgba(59,42,51,0.28)');

    // ---- mũ rơm
    VM.rect(ctx, x - 5, top + 3 + bob, 11, 2, hat);
    VM.rect(ctx, x - 5, top + 4 + bob, 11, 1, hatDark);
    VM.rect(ctx, x - 3, top + bob, 7, 3, hat);
    VM.rect(ctx, x - 3, top + 2 + bob, 7, 1, hatDark);

    // ---- đầu
    VM.rect(ctx, x - 3, top + 5 + bob, 7, 6, skin);
    VM.rect(ctx, x - 3, top + 10 + bob, 7, 1, P.skinDark);

    // ---- tóc mái
    VM.rect(ctx, x - 3, top + 5 + bob, 7, 1, '#6E4726');

    // ---- mắt theo hướng
    if (dir === 'down') {
      VM.px1(ctx, x - 2, top + 7 + bob, P.ink);
      VM.px1(ctx, x + 1, top + 7 + bob, P.ink);
    } else if (dir === 'left') {
      VM.px1(ctx, x - 3, top + 7 + bob, P.ink);
      VM.px1(ctx, x - 1, top + 7 + bob, P.ink);
    } else if (dir === 'right') {
      VM.px1(ctx, x + 1, top + 7 + bob, P.ink);
      VM.px1(ctx, x - 0, top + 7 + bob, P.ink);
    }
    // dir === 'up' : không vẽ mắt (nhìn từ sau)

    // ---- thân (áo yếm)
    VM.rect(ctx, x - 3, top + 11 + bob, 7, 6, cloth);
    VM.rect(ctx, x - 3, top + 11 + bob, 7, 1, cloth2);
    VM.rect(ctx, x - 2, top + 13 + bob, 5, 2, cloth2);

    // ---- tay
    VM.rect(ctx, x - 5, top + 12 + bob, 2, 4, skin);
    VM.rect(ctx, x + 4, top + 12 + bob, 2, 4, skin);

    // ---- chân (đổi theo khung để tạo bước đi)
    const legY = top + 17 + bob;
    if (!walking) {
      VM.rect(ctx, x - 3, legY, 2, 3, cloth2);
      VM.rect(ctx, x + 1, legY, 2, 3, cloth2);
    } else if (frame === 1) {
      VM.rect(ctx, x - 4, legY, 2, 3, cloth2);
      VM.rect(ctx, x + 2, legY, 2, 2, cloth2);
    } else if (frame === 3) {
      VM.rect(ctx, x - 4, legY, 2, 2, cloth2);
      VM.rect(ctx, x + 2, legY, 2, 3, cloth2);
    } else {
      VM.rect(ctx, x - 3, legY, 2, 2, cloth2);
      VM.rect(ctx, x + 1, legY, 2, 2, cloth2);
    }

    // ---- bóng tay cầm công cụ (nếu có)
    if (opt.tool) VM.drawToolInHand(ctx, x, yFeet, dir, opt.tool, frame);
  };

  /** Công cụ cầm trên tay (vẽ chồng lên nhân vật) */
  VM.drawToolInHand = function (ctx, x, yFeet, dir, tool, frame) {
    const top = Math.round(yFeet) - 20;
    const side = dir === 'left' ? -1 : 1;
    const bx = Math.round(x) + (dir === 'left' ? -7 : 4);
    const by = top + 11;

    switch (tool) {
      case 'hoe':
        VM.rect(ctx, bx, by, 1, 8, P.wood);
        VM.rect(ctx, bx + side * -3, by + 7, 4, 1, P.stone);
        break;
      case 'water':
        VM.rect(ctx, bx, by + 1, 5, 5, P.stone);
        VM.rect(ctx, bx, by + 1, 5, 1, P.gray);
        VM.rect(ctx, bx + (side > 0 ? 5 : -2), by + 2, 2, 1, P.stoneDark);
        break;
      case 'sickle':
        VM.rect(ctx, bx, by, 1, 7, P.wood);
        VM.rect(ctx, bx + side, by - 1, 3, 1, P.gray);
        break;
      case 'axe':
        VM.rect(ctx, bx, by, 1, 8, P.wood);
        VM.rect(ctx, bx + side * -3, by, 4, 3, P.stone);
        VM.rect(ctx, bx + side * -3, by, 4, 1, P.gray);
        break;
      case 'pick':
        VM.rect(ctx, bx, by, 1, 8, P.wood);
        VM.rect(ctx, bx - 3, by - 1, 7, 1, P.stone);
        break;
      case 'rod':
        VM.rect(ctx, bx, by - 4, 1, 12, P.woodDark);
        VM.rect(ctx, bx + side * 3, by - 5, 3, 1, P.gray);
        break;
      case 'seed':
        VM.rect(ctx, bx, by + 2, 4, 4, P.wood);
        VM.rect(ctx, bx + 1, by + 1, 2, 1, P.gold);
        break;
    }
  };

  /* ----------------------------------------------------------------- NPC */
  VM.drawNPC = function (ctx, x, yFeet, dir, frame, palette, name) {
    // Bà Hòa: tạp dề nâu, tóc bạc
    VM.drawPlayer(ctx, x, yFeet, dir, frame, palette);
  };

  /* -------------------------------------------------------------- CÂY TRỒNG */
  /**
   * Vẽ cây theo giai đoạn (đúng 4 giai đoạn như CropInstance.cs)
   * @param tx,ty toạ độ pixel góc trên-trái của ô 16×16
   */
  VM.drawCrop = function (ctx, tx, ty, cropKey, stage, opts) {
    const c = VM.CROPS[cropKey];
    if (!c) return;
    opts = opts || {};
    const ripe = stage === 3;
    const sway = opts.sway ? 1 : 0;       // 2 khung lay nhẹ
    const sparkle = opts.sparkle;         // hiệu ứng chớp khi chín
    const dead = opts.dead;
    const cx = tx + 8;
    const baseY = ty + 15;

    const leaf = dead ? '#8A6330' : c.leaf;
    const leafD = dead ? '#6E4726' : c.leafDark;

    // ---------- GĐ1: HẠT GIỐNG ----------
    if (stage === 0) {
      VM.rect(ctx, cx - 3, baseY - 1, 6, 1, P.soilDark);
      VM.px1(ctx, cx - 2, baseY - 2, P.inkSoft);
      VM.px1(ctx, cx, baseY - 2, P.inkSoft);
      VM.px1(ctx, cx + 2, baseY - 2, P.inkSoft);
      return;
    }

    // ---------- GĐ2: MẦM ----------
    if (stage === 1) {
      VM.rect(ctx, cx - 1 + sway, baseY - 5, 1, 5, leafD);
      VM.rect(ctx, cx - 4, baseY - 6, 3, 2, leaf);
      VM.rect(ctx, cx + 2 - sway, baseY - 7, 3, 2, leaf);
      return;
    }

    // ---------- GĐ3/GĐ4: TRƯỞNG THÀNH & CÓ QUẢ ----------
    if (c.shape === 'stalk') {
      // Ngô: thân cao 14 px + 4 lá
      VM.rect(ctx, cx - 1, baseY - 15, 2, 15, dead ? leafD : '#7A9B4E');
      VM.rect(ctx, cx - 6, baseY - 13 + sway, 5, 2, leaf);
      VM.rect(ctx, cx + 2, baseY - 11 - sway, 5, 2, leaf);
      VM.rect(ctx, cx - 5, baseY - 8, 4, 2, leafD);
      VM.rect(ctx, cx + 2, baseY - 6, 4, 2, leafD);
      if (ripe) {
        VM.rect(ctx, cx + 1, baseY - 12, 3, 6, c.fruit);
        VM.rect(ctx, cx + 1, baseY - 12, 3, 1, c.fruitHi);
      }
    } else if (c.shape === 'trellis') {
      // Cà chua: 2 cọc giàn + tán lá + quả
      VM.rect(ctx, cx - 6, baseY - 14, 1, 14, P.wood);
      VM.rect(ctx, cx + 5, baseY - 14, 1, 14, P.wood);
      VM.rect(ctx, cx - 6, baseY - 12, 12, 1, P.woodDark);
      VM.rect(ctx, cx - 5, baseY - 11, 10, 5, leafD);
      VM.rect(ctx, cx - 4, baseY - 12, 8, 3, leaf);
      VM.rect(ctx, cx - 3, baseY - 8, 6, 3, leafD);
      if (ripe) {
        VM.rect(ctx, cx - 4, baseY - 11, 2, 2, c.fruit);
        VM.rect(ctx, cx + 1, baseY - 9, 2, 2, c.fruit);
        VM.rect(ctx, cx - 1, baseY - 6, 2, 2, c.fruit);
        VM.px1(ctx, cx - 4, baseY - 11, c.fruitHi);
      } else {
        VM.rect(ctx, cx - 3, baseY - 10, 2, 2, '#7FA85A');
        VM.rect(ctx, cx + 2, baseY - 8, 2, 2, '#7FA85A');
      }
    } else if (c.shape === 'vine') {
      // Bí ngô: dây bò rộng + quả to
      VM.rect(ctx, cx - 7, baseY - 4, 14, 3, leafD);
      VM.rect(ctx, cx - 6, baseY - 6, 5, 3, leaf);
      VM.rect(ctx, cx + 2, baseY - 7, 5, 3, leaf);
      VM.rect(ctx, cx - 2, baseY - 3, 3, 3, leafD);
      if (ripe) {
        VM.rect(ctx, cx - 5, baseY - 10, 11, 7, c.fruit);
        VM.rect(ctx, cx - 5, baseY - 10, 11, 2, c.fruitHi);
        VM.rect(ctx, cx - 2, baseY - 11, 2, 1, P.leaf3);
        VM.rect(ctx, cx + 2, baseY - 11, 2, 1, P.leaf3);
      }
    } else {
      // Củ cải / bụi thấp
      VM.rect(ctx, cx - 5, baseY - 6, 11, 5, leafD);
      VM.rect(ctx, cx - 4, baseY - 8 + sway, 9, 3, leaf);
      VM.rect(ctx, cx - 2, baseY - 9, 5, 2, leaf);
      if (ripe) {
        VM.rect(ctx, cx - 3, baseY - 4, 6, 4, c.fruit);
        VM.rect(ctx, cx - 3, baseY - 4, 6, 1, c.fruitHi);
      }
    }

    // ---------- Hiệu ứng "đã chín": chấm lấp lánh 2 khung ----------
    if (ripe && sparkle) {
      VM.px1(ctx, cx + 6, baseY - 14, P.white);
      VM.px1(ctx, cx - 7, baseY - 10, P.gold);
      VM.px1(ctx, cx + 3, baseY - 16, P.white);
    }
  };

  /* --------------------------------------------------------------- ĐỊA HÌNH */
  /** Tile nền (cỏ / đường / nước / cát) — dùng khi nướng (bake) bản đồ */
  VM.drawGroundTile = function (ctx, kind, x, y, season, variant, t) {
    const S = VM.SEASONS[season] || VM.SEASONS[0];
    if (kind === 'water') {
      VM.rect(ctx, x, y, 16, 16, P.water1);
      VM.rect(ctx, x, y + 4, 16, 1, P.water2);
      VM.rect(ctx, x, y + 11, 16, 1, '#3E8FC0');
      return;
    }
    if (kind === 'path') {
      VM.rect(ctx, x, y, 16, 16, P.wood);
      VM.rect(ctx, x + 2, y + 5, 2, 1, P.woodDark);
      VM.rect(ctx, x + 9, y + 3, 1, 1, P.woodDark);
      VM.rect(ctx, x + 12, y + 11, 2, 1, P.woodDark);
      VM.rect(ctx, x + 5, y + 12, 1, 1, P.woodDark);
      return;
    }
    // cỏ
    VM.rect(ctx, x, y, 16, 16, S.g1);
    // vân cỏ theo seed để mỗi ô hơi khác nhau (tránh "ô vuông lặp")
    const v = variant || 0;
    VM.rect(ctx, x + (v % 5) * 2, y + 3 + (v % 3), 2, 1, S.g2);
    VM.rect(ctx, x + 4 + (v % 4) * 3, y + 10 - (v % 2), 3, 1, S.g2);
    VM.rect(ctx, x + 1 + (v % 7), y + 14 - (v % 4), 1, 1, S.g3);
    if (v % 5 === 0) VM.rect(ctx, x + 6, y + 6, 1, 3, S.g2);
  };

  /** Lớp đất nông nghiệp: đã cuốc / đã tưới / cỏ dại / sâu bệnh */
  VM.drawSoilTile = function (ctx, x, y, cell, t) {
    // nền đất đã cuốc (+ luống)
    VM.rect(ctx, x, y, 16, 16, P.soil);
    VM.rect(ctx, x, y, 16, 1, P.soilDark);
    VM.rect(ctx, x, y + 5, 16, 1, P.soilDark);
    VM.rect(ctx, x, y + 10, 16, 1, P.soilDark);
    VM.rect(ctx, x, y + 15, 16, 1, P.soilDark);
    VM.rect(ctx, x + 3, y + 2, 2, 1, '#9C6E3C');
    VM.rect(ctx, x + 10, y + 7, 2, 1, '#9C6E3C');

    if (cell.moisture >= 0.3) {
      // đất tưới: sẫm hơn + 2 khung gợn nước
      VM.rect(ctx, x, y, 16, 16, 'rgba(46,60,90,0.30)');
      const f = (t % 2) === 0 ? 0 : 1;
      VM.rect(ctx, x + 2 + f * 2, y + 3, 3, 1, 'rgba(127,211,232,0.65)');
      VM.rect(ctx, x + 9 - f, y + 8, 4, 1, 'rgba(127,211,232,0.5)');
      VM.rect(ctx, x + 4 + f, y + 12, 2, 1, 'rgba(127,211,232,0.45)');
    }

    if (cell.weed > 0) {
      const g = ['#6FBF57', '#57A845', '#4E9A45'][Math.min(2, cell.weed - 1)];
      VM.rect(ctx, x + 1, y + 12, 1, 3, g);
      VM.rect(ctx, x + 3, y + 11, 1, 4, g);
      VM.rect(ctx, x + 12, y + 12, 1, 3, g);
      if (cell.weed > 1) { VM.rect(ctx, x + 13, y + 10, 1, 4, g); }
    }
    if (cell.pest) {
      VM.rect(ctx, x + 7, y + 6, 2, 2, '#8B3A62');
      VM.px1(ctx, x + 6, y + 5, '#2A1E26');
    }
  };

  /** Ô đất đã cuốc nhưng khô (dùng khi bake lớp đất tĩnh) */

  /* ----------------------------------------------------------------- CÔNG TRÌNH */
  VM.drawBarn = function (ctx, x, y) {
    const w = 64, h = 56;
    // thân
    VM.rect(ctx, x, y + 20, w, h - 20, P.woodDark);
    VM.rect(ctx, x, y + 20, w, 2, P.ink);
    VM.rect(ctx, x + 2, y + 24, w - 4, h - 28, '#9C6E3C');
    // mái đỏ
    VM.rect(ctx, x - 2, y + 14, w + 4, 8, '#B5533F');
    VM.rect(ctx, x + 2, y + 8, w - 4, 8, '#C25E45');
    VM.rect(ctx, x + 10, y + 2, w - 20, 8, '#C25E45');
    VM.rect(ctx, x - 2, y + 21, w + 4, 1, P.ink);
    // cửa lớn
    VM.rect(ctx, x + 22, y + 34, 20, 22, P.woodDeep);
    VM.rect(ctx, x + 22, y + 34, 20, 1, P.ink);
    VM.rect(ctx, x + 31, y + 34, 1, 22, P.ink);
    VM.rect(ctx, x + 24, y + 40, 6, 1, P.wood);
    VM.rect(ctx, x + 34, y + 40, 6, 1, P.wood);
    // cửa sổ nhỏ trên mái
    VM.rect(ctx, x + 28, y + 12, 8, 6, P.cream);
    VM.rect(ctx, x + 28, y + 12, 8, 1, P.ink);
    // cỏ khô bên hông
    VM.rect(ctx, x + 58, y + 40, 6, 14, P.gold);
    VM.rect(ctx, x + 58, y + 44, 6, 1, P.goldDark);
  };

  VM.drawHouse = function (ctx, x, y) {
    const w = 56, h = 52;
    VM.rect(ctx, x, y + 18, w, h - 18, '#D8C8A8');
    VM.rect(ctx, x, y + 18, w, 1, P.ink);
    // mái
    VM.rect(ctx, x - 3, y + 12, w + 6, 7, '#8A5F52');
    VM.rect(ctx, x + 3, y + 5, w - 6, 8, '#A06E5E');
    VM.rect(ctx, x + 12, y, w - 24, 6, '#A06E5E');
    VM.rect(ctx, x - 3, y + 19, w + 6, 1, P.ink);
    // cửa
    VM.rect(ctx, x + 22, y + 34, 12, 18, P.woodDeep);
    VM.rect(ctx, x + 30, y + 42, 2, 2, P.gold);
    // cửa sổ + đèn
    VM.rect(ctx, x + 6, y + 26, 10, 9, '#5A6E8A');
    VM.rect(ctx, x + 6, y + 26, 10, 1, P.ink);
    VM.rect(ctx, x + 11, y + 26, 1, 9, P.ink);
    VM.rect(ctx, x + 40, y + 26, 10, 9, '#5A6E8A');
    VM.rect(ctx, x + 40, y + 26, 10, 1, P.ink);
    VM.rect(ctx, x + 45, y + 26, 1, 9, P.ink);
    // ống khói
    VM.rect(ctx, x + 42, y - 4, 7, 10, P.stoneDark);
    VM.rect(ctx, x + 42, y - 4, 7, 1, P.ink);
  };

  VM.drawWell = function (ctx, x, y) {
    VM.rect(ctx, x + 1, y + 8, 14, 7, P.stone);
    VM.rect(ctx, x + 1, y + 8, 14, 1, P.gray);
    VM.rect(ctx, x + 1, y + 14, 14, 1, P.ink);
    VM.rect(ctx, x + 4, y + 9, 8, 5, '#2E3440');
    VM.rect(ctx, x + 2, y, 2, 9, P.wood);
    VM.rect(ctx, x + 12, y, 2, 9, P.wood);
    VM.rect(ctx, x + 2, y, 12, 3, '#B5533F');
    VM.rect(ctx, x + 2, y + 3, 12, 1, P.ink);
  };

  VM.drawShop = function (ctx, x, y) {
    // sạp hàng của bà Hòa
    VM.rect(ctx, x, y + 10, 40, 6, P.woodDark);
    VM.rect(ctx, x, y + 6, 40, 5, '#B5533F');
    VM.rect(ctx, x, y + 6, 40, 1, P.ink);
    VM.rect(ctx, x + 1, y + 16, 38, 12, P.wood);
    VM.rect(ctx, x + 1, y + 27, 38, 1, P.ink);
    VM.rect(ctx, x + 3, y + 11, 4, 4, '#E5484D');
    VM.rect(ctx, x + 9, y + 11, 4, 4, P.gold);
    VM.rect(ctx, x + 15, y + 11, 4, 4, P.leaf2);
    VM.rect(ctx, x + 21, y + 11, 4, 4, P.terra);
    VM.rect(ctx, x + 2, y + 18, 1, 12, P.woodDark);
    VM.rect(ctx, x + 37, y + 18, 1, 12, P.woodDark);
  };

  VM.drawTree = function (ctx, x, y, season, variant) {
    const S = VM.SEASONS[season] || VM.SEASONS[0];
    const trunkH = 14;
    VM.rect(ctx, x - 3, y - 2, 8, 3, 'rgba(59,42,51,0.22)');   // bóng
    VM.rect(ctx, x, y - trunkH, 4, trunkH, '#6E4726');
    VM.rect(ctx, x, y - trunkH, 1, trunkH, '#5A3A1E');

    if (season === 3) {  // Đông: cây trụi + tuyết
      VM.rect(ctx, x - 6, y - trunkH - 4, 16, 4, '#E8F0F7');
      VM.rect(ctx, x - 3, y - trunkH - 8, 10, 5, '#D6E4F0');
      VM.rect(ctx, x - 5, y - trunkH - 3, 14, 1, '#B8CCDE');
      return;
    }

    const crown = (variant % 2 === 0) ? S.g2 : S.g1;
    const crownD = S.g3;
    VM.rect(ctx, x - 8, y - trunkH - 10, 20, 12, crownD);
    VM.rect(ctx, x - 6, y - trunkH - 14, 16, 6, crown);
    VM.rect(ctx, x - 3, y - trunkH - 17, 10, 5, crown);
    VM.rect(ctx, x + 2, y - trunkH - 9, 4, 3, crown);
    // quả khi mùa Thu
    if (season === 2) {
      VM.rect(ctx, x - 4, y - trunkH - 10, 2, 2, '#C25E45');
      VM.rect(ctx, x + 5, y - trunkH - 6, 2, 2, '#C25E45');
    }
  };

  VM.drawFence = function (ctx, x, y, horiz) {
    VM.rect(ctx, x + 2, y + 6, 2, 9, P.wood);
    VM.rect(ctx, x + 12, y + 6, 2, 9, P.wood);
    VM.rect(ctx, x, y + 7, 16, 2, P.woodDark);
    VM.rect(ctx, x, y + 11, 16, 2, P.woodDark);
  };

  /* ------------------------------------------------------------- ICON / ITEM */
  VM.drawItemIcon = function (ctx, x, y, itemKey, quality) {
    const q = quality || 0;
    const rim = q === 3 ? '#FF9CF0' : q === 2 ? P.gold : q === 1 ? P.gray : null;
    if (rim) VM.rect(ctx, x, y, 8, 8, rim);

    const inner = rim ? 1 : 0;
    const s = 8 - inner * 2;
    const ox = x + inner, oy = y + inner;

    if (itemKey === 'turnip') { VM.rect(ctx, ox + 1, oy + 3, s - 2, s - 4, '#F2EAD8'); VM.rect(ctx, ox + 2, oy + 1, s - 4, 2, P.leaf2); }
    else if (itemKey === 'tomato') { VM.rect(ctx, ox, oy + 1, s, s - 1, '#E5484D'); VM.px1(ctx, ox + 2, oy + 2, '#FF8A8A'); VM.px1(ctx, ox + 3, oy, P.leaf3); }
    else if (itemKey === 'corn') { VM.rect(ctx, ox + 1, oy + 1, s - 2, s - 2, P.gold); VM.rect(ctx, ox + 2, oy + 2, 1, s - 4, '#FFF0B8'); VM.rect(ctx, ox + 4, oy + 1, 1, s - 2, '#C9A227'); }
    else if (itemKey === 'pumpkin') { VM.rect(ctx, ox, oy + 1, s, s - 1, P.terra); VM.rect(ctx, ox + 1, oy + 2, 1, s - 4, '#FFB066'); VM.px1(ctx, ox + 3, oy, P.leaf4); }
    else if (itemKey === 'wood') { VM.rect(ctx, ox, oy + 2, s, s - 4, P.woodDark); VM.rect(ctx, ox, oy + 3, s, 1, P.wood); }
    else if (itemKey === 'stone') { VM.rect(ctx, ox, oy + 2, s, s - 3, P.stone); VM.rect(ctx, ox + 1, oy + 3, s - 3, 1, P.gray); }
    else if (itemKey.indexOf('seed_') === 0) {
      VM.rect(ctx, ox + 1, oy + 2, s - 2, s - 3, P.wood);
      const k = itemKey.replace('seed_', '');
      const col = (VM.CROPS[k] || {}).fruit || P.leaf2;
      VM.rect(ctx, ox + 2, oy + 3, 2, 2, col);
    } else VM.rect(ctx, ox, oy, s, s, P.gray);
  };

  /** Icon công cụ cho hotbar */
  VM.drawToolIcon = function (ctx, x, y, tool) {
    const s = 12, ox = x + 2, oy = y + 2;
    if (tool === 'hoe') { VM.rect(ctx, ox + 5, oy, 2, s, P.wood); VM.rect(ctx, ox + 1, oy + s - 3, 6, 2, P.stone); }
    else if (tool === 'water') { VM.rect(ctx, ox + 1, oy + 2, 8, 8, P.stone); VM.rect(ctx, ox + 1, oy + 2, 8, 1, P.gray); VM.rect(ctx, ox + 9, oy + 3, 3, 2, P.stoneDark); }
    else if (tool === 'sickle') { VM.rect(ctx, ox + 2, oy + 2, 2, 9, P.wood); VM.rect(ctx, ox + 4, oy + 1, 6, 2, P.gray); }
    else if (tool === 'axe') { VM.rect(ctx, ox + 5, oy + 2, 2, 10, P.wood); VM.rect(ctx, ox + 2, oy, 6, 4, P.stone); }
    else if (tool === 'pick') { VM.rect(ctx, ox + 5, oy + 2, 2, 10, P.wood); VM.rect(ctx, ox + 1, oy, 10, 2, P.stone); }
    else if (tool === 'rod') { VM.rect(ctx, ox + 4, oy, 2, 12, P.woodDark); VM.rect(ctx, ox + 6, oy, 3, 2, P.gray); }
    else if (tool === 'seed') { VM.rect(ctx, ox + 2, oy + 3, 8, 7, P.wood); VM.rect(ctx, ox + 3, oy + 2, 6, 1, P.gold); }
  };

  /** Icon thời tiết 16×16 */
  VM.drawWeatherIcon = function (ctx, x, y, weather) {
    if (weather === 'sunny') {
      VM.rect(ctx, x + 4, y + 4, 8, 8, P.gold);
      VM.rect(ctx, x + 4, y + 4, 8, 1, '#FFF0B8');
      VM.rect(ctx, x + 8, y, 1, 3, P.gold); VM.rect(ctx, x + 8, y + 13, 1, 3, P.gold);
      VM.rect(ctx, x, y + 8, 3, 1, P.gold); VM.rect(ctx, x + 13, y + 8, 3, 1, P.gold);
    } else if (weather === 'cloudy') {
      VM.rect(ctx, x + 3, y + 6, 10, 5, P.gray);
      VM.rect(ctx, x + 5, y + 4, 6, 3, P.white);
    } else if (weather === 'rain') {
      VM.rect(ctx, x + 3, y + 3, 10, 5, P.gray);
      VM.rect(ctx, x + 4, y + 9, 1, 3, P.water2); VM.rect(ctx, x + 7, y + 10, 1, 3, P.water2); VM.rect(ctx, x + 10, y + 9, 1, 3, P.water2);
    } else if (weather === 'storm') {
      VM.rect(ctx, x + 2, y + 2, 11, 6, '#6E7A88');
      VM.rect(ctx, x + 7, y + 8, 4, 2, P.gold); VM.rect(ctx, x + 5, y + 10, 4, 2, P.gold); VM.rect(ctx, x + 7, y + 12, 3, 2, P.gold);
    } else if (weather === 'snow') {
      VM.rect(ctx, x + 3, y + 3, 10, 5, P.white);
      VM.rect(ctx, x + 4, y + 10, 2, 2, P.white); VM.rect(ctx, x + 9, y + 11, 2, 2, P.white);
    } else {
      VM.rect(ctx, x + 2, y + 6, 12, 3, P.gray);
      VM.rect(ctx, x + 4, y + 4, 8, 2, '#DCE4EC');
    }
  };

  VM.drawHeart = function (ctx, x, y, filled) {
    const c = filled ? '#E5484D' : '#6E7A88';
    VM.rect(ctx, x + 1, y + 2, 3, 3, c); VM.rect(ctx, x + 6, y + 2, 3, 3, c);
    VM.rect(ctx, x, y + 4, 10, 3, c);
    VM.rect(ctx, x + 2, y + 7, 6, 2, c);
    VM.rect(ctx, x + 4, y + 9, 2, 2, c);
  };
})();
