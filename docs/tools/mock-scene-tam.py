#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
mock-scene-tam.py — ảnh GIẢ LẬP MÀN CHƠI ở tỉ lệ thật 320×180 (x4 để xem)

Trả lời câu hỏi: "bộ sprite tạm ở tỉ lệ thật trong game có đọc được không?"
Bố cục lấy đúng theo VuonMoSceneBuilder.cs: camera orthographic 5.625 → 320×180,
tile 16 px, pixel perfect (ảnh phóng to 4× bằng lệnh nearest, không nội suy).

Chạy:  python3 docs/tools/mock-scene-tam.py
Xuất:  art/mock-scene-320x180.png
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vuonmo_pixel import Pix, write_png, build_sprites, CLIP, C

SPR = dict(build_sprites())
TS = 16                      # tile size
W, H = 320, 180              # độ phân giải nội bộ (khớp camera 5.625 @ 16 PPU)
SCALE = 4                    # phóng to khi ghi PNG

# ---------------------------------------------------------------- bảng "chữ" 3×5 (chỉ số + vài ký hiệu)
FONT = {
    '0': ("111", "101", "101", "101", "111"),
    '1': ("010", "110", "010", "010", "111"),
    '2': ("111", "001", "111", "100", "111"),
    '3': ("111", "001", "111", "001", "111"),
    '4': ("101", "101", "111", "001", "001"),
    '5': ("111", "100", "111", "001", "111"),
    '6': ("111", "100", "111", "101", "111"),
    '7': ("111", "001", "001", "001", "001"),
    '8': ("111", "101", "111", "101", "111"),
    '9': ("111", "101", "111", "001", "111"),
    ':': ("000", "010", "000", "010", "000"),
    '/': ("001", "001", "010", "100", "100"),
    '-': ("000", "000", "111", "000", "000"),
    ' ': ("000", "000", "000", "000", "000"),
}


def text(scr, x, y, s, color, shadow=True):
    """Vẽ chuỗi bằng font 3×5, mỗi ký tự cách 4 px."""
    cx = x
    for ch in s:
        g = FONT.get(ch)
        if g:
            for ry, row in enumerate(g):
                for rx, bit in enumerate(row):
                    if bit == '1':
                        if shadow:
                            scr.P(cx + rx + 1, y + ry + 1, C(0, 0, 0, 160))
                        scr.P(cx + rx, y + ry, color)
        cx += 4
    return cx


def blit(dst, name, x, y):
    """Dán sprite (gốc trên-trái), bỏ qua pixel trong suốt."""
    p = SPR[name]
    for sy in range(p.H):
        py = y + sy
        if py < 0 or py >= dst.H:
            continue
        for sx in range(p.W):
            px = x + sx
            if px < 0 or px >= dst.W:
                continue
            c = p.px[sy][sx]
            if c[3] > 0:
                dst.px[py][px] = c


def blit_bottom(dst, name, x_center, y_bottom):
    """Dán sprite theo pivot Bottom Center (đúng như sprite trong Unity)."""
    p = SPR[name]
    blit(dst, name, int(x_center - p.W / 2), int(y_bottom - p.H))


scr = Pix(W, H, 'mock')

# ---------------------------------------------------------------- 1) NỀN CỎ
for ty in range(0, H // TS + 1):
    for tx in range(0, W // TS + 1):
        blit(scr, 'tile_grass_spring', tx * TS, ty * TS)

# ---------------------------------------------------------------- 2) AO NƯỚC (góc phải-dưới, xa HUD)
for ty in range(9, 12):
    for tx in range(16, 20):
        blit(scr, 'tile_water', tx * TS, ty * TS)

# ---------------------------------------------------------------- 3) ĐƯỜNG ĐẤT ngang
for tx in range(0, W // TS):
    blit(scr, 'tile_dirt_path', tx * TS, 5 * TS)

# ---------------------------------------------------------------- 4) RUỘNG: 8 cột × 3 hàng, mỗi cây 1 giai đoạn
plot_x, plot_y = 6, 6
stages = ["seed", "sprout", "mature", "ripe", "wither", "dead"]
crop_ids = ["turnip", "potato", "tomato", "corn", "pumpkin", "grape", "snowdrop", "rice"]
k = 0
for row in range(3):
    for col in range(8):
        cx, cy = (plot_x + col) * TS, (plot_y + row) * TS
        wet = (k % 3 == 0)                      # 1/3 ô đã tưới
        blit(scr, 'tile_soil_wet' if wet else 'tile_soil', cx, cy)
        cid = crop_ids[col]
        st = stages[(row * 3 + col) % 6] if row < 2 else stages[k % 6]
        blit_bottom(scr, 'crop_' + cid + '_' + st, cx + 8, cy + 16)
        k += 1

# 2 ô có cỏ dại / sâu để kiểm tra đọc được
blit(scr, 'tile_weed', 5 * TS, 9 * TS)
blit(scr, 'tile_pest', 14 * TS, 9 * TS)

# ---------------------------------------------------------------- 5) CÔNG TRÌNH (pivot Bottom Center)
blit_bottom(scr, 'prop_house', 40, 5 * TS)
blit_bottom(scr, 'prop_barn', 128, 5 * TS)
blit_bottom(scr, 'prop_coop', 192, 5 * TS)
blit_bottom(scr, 'prop_tree', 248, 5 * TS)
blit_bottom(scr, 'prop_well', 88, 5 * TS)
blit_bottom(scr, 'prop_sign', 64, 5 * TS)
for tx in range(15, 20):                        # hàng rào
    blit(scr, 'prop_fence', tx * TS, 4 * TS)

# ---------------------------------------------------------------- 6) NHÂN VẬT + BÓNG
px, py = 152, 140                              # chân nhân vật (y = mặt đất)
blit(scr, 'player_shadow', px - 8, py - 6)
blit_bottom(scr, 'player_down_0', px, py)

# ---------------------------------------------------------------- 7) HUD (như VuonMoSceneBuilder.cs)
# thanh trên: đồng hồ + thời tiết + tiền
blit(scr, 'ui_panel', 4, 4)
text(scr, 8, 9, '6:00', C(0xFF, 0xE9, 0xB8))
blit(scr, 'weather_sunny', 30, 4)
text(scr, 50, 9, 'D1', C(0xFF, 0xE9, 0xB8))
text(scr, 64, 9, '-', C(0x9A, 0xA5, 0xB1))

blit(scr, 'ui_panel', 250, 4)
blit(scr, 'item_turnip', 252, 4)
text(scr, 270, 9, '500', C(0xFF, 0xD3, 0x4E))

# thanh nước (góc trái-dưới)
blit(scr, 'ui_panel', 4, 160)
blit(scr, 'tool_wateringcan', 6, 160)
for i in range(40):                            # 12/20 = 60% nước
    col = C(0x4F, 0xA8, 0xD8) if i < 24 else C(0x33, 0x3A, 0x44)
    for yy in range(3):
        scr.P(24 + i, 166 + yy, col)
text(scr, 68, 164, '12/20', C(0xFF, 0xFF, 0xFF))

# hotbar 8 ô (20 px) giữa-dưới
slot_w, gap = 20, 2
total = 8 * slot_w + 7 * gap
x0 = (W - total) // 2
tools = ['tool_hoe', 'tool_wateringcan', 'tool_sickle', 'tool_axe',
         'tool_pickaxe', 'tool_fishingrod', 'tool_seedbag', 'tool_hand']
for i in range(8):
    sx = x0 + i * (slot_w + gap)
    blit(scr, 'ui_panel', sx, 156)
    blit(scr, tools[i], sx + 2, 158)
if True:                                        # ô đang chọn (số 2 = bình tưới)
    sx = x0 + 1 * (slot_w + gap)
    for x in range(sx, sx + slot_w):
        scr.P(x, 156, C(0xFF, 0xE9, 0xB8))
        scr.P(x, 175, C(0xFF, 0xE9, 0xB8))
    for y in range(156, 176):
        scr.P(sx, y, C(0xFF, 0xE9, 0xB8))
        scr.P(sx + slot_w - 1, y, C(0xFF, 0xE9, 0xB8))

# prompt [E] khi đứng cạnh cây chín
blit(scr, 'ui_panel', 118, 112)
text(scr, 122, 117, 'E', C(0xFF, 0xE9, 0xB8))
for i in range(3):                              # 3 vạch = chữ "Thu hoạch"
    for yy in range(2):
        scr.P(130 + i * 5, 115 + yy, C(0xFF, 0xE9, 0xB8))
    for yy in range(1):
        scr.P(130 + i * 5, 119, C(0xFF, 0xE9, 0xB8))

# ---------------------------------------------------------------- GHI ẢNH
out = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                    '..', '..', 'art', 'mock-scene-320x180.png'))
write_png(out, W, H, lambda x, y: scr.px[y][x], SCALE)
print("Man choi gia lap :", W, "x", H, "-> PNG", W * SCALE, "x", H * SCALE)
print("Da ghi           :", out)
print("Ve tran canvas   :", len(CLIP))
print("HUD: dong ho 6:00 | thoi tiet nang | tui 500G | nuoc 12/20 | hotbar 8 o | prompt [E]")
