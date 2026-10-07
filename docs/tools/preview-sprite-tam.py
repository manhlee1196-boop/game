#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
preview-sprite-tam.py — ảnh xem trước (contact sheet) 109 sprite tạm.

Chạy:  python3 docs/tools/preview-sprite-tam.py
Xuat:  art/preview-sprite-tam.png
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vuonmo_pixel import BG, C, CLIP, write_png, build_sprites

sprites = build_sprites()

COLS = 14
CELL = 54          # kích thước ô trong bản xem trước (đủ chứa sprite 48x48)
SCALE = 4
sheet_w = COLS * CELL
sheet_h = ((len(sprites) + COLS - 1) // COLS) * CELL

def sheet_pixel(x, y):
    """y=0 là TRÊN: sprite vẽ bằng toạ độ trên-xuống, nên truy cập trực tiếp."""
    col, row = x // CELL, y // CELL
    i = row * COLS + col
    if i >= len(sprites):
        return BG
    name, p = sprites[i]
    ox = col * CELL + (CELL - p.W) // 2
    oy = row * CELL + (CELL - p.H) // 2
    sx, sy = x - ox, y - oy
    if 0 <= sx < p.W and 0 <= sy < p.H:
        px = p.px[sy][sx]                 # toạ độ trên-xuống, khớp với y của sheet
        if px[3] == 0:
            return BG
        if px[3] < 255:                    # pha trộn với nền
            a = px[3] / 255.0
            return tuple(int(px[k] * a + BG[k] * (1 - a)) for k in range(3)) + (255,)
        return px
    # kẻ ô lưới mờ
    if x % CELL == 0 or y % CELL == 0:
        return C(0x2E, 0x2E, 0x38)
    return BG

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'art', 'preview-sprite-tam.png')
out = os.path.normpath(out)
os.makedirs(os.path.dirname(out), exist_ok=True)
write_png(out, sheet_w, sheet_h, sheet_pixel, SCALE)

print("So sprite sinh ra :", len(sprites))
print("Kich thuoc anh    :", sheet_w * SCALE, "x", sheet_h * SCALE, "px  (", SCALE, "x )")
print("Da ghi            :", out)

# ---- KIỂM TRA: vẽ tràn canvas (mô phỏng đúng hành vi đầu tiên của C#: bỏ qua)
print("\nSprite PIVOT BOTTOM CENTER phai cham hang cuoi (y = H-1):")
floaters = []
for n, p in sprites:
    if n.startswith(("crop_", "prop_")):
        lowest = max(y for y in range(p.H) for x in range(p.W) if p.px[y][x][3] > 0)
        if lowest != p.H - 1:
            floaters.append((n, lowest, p.H - 1))
print("   -> sprite bi noi (khong cham dat):", len(floaters))
for f in floaters[:12]: print("      ", f)

print("\nLan ve tran canvas (toa do am / vuot kich thuoc):", len(CLIP))
for c in CLIP[:20]:
    print("   ⚠", c)

# ---- KIỂM TRA: sprite rỗng / gần rỗng
empty = [n for n, p in sprites if all(px[3] == 0 for row in p.px for px in row)]
print("Sprite rong hoan toan:", len(empty), empty if empty else "(khong co)")

# ---- KIỂM TRA: nhan vat co cham chan y=23 (pivot Bottom Center)?
for n, p in sprites:
    if n.startswith("player_"):
        lowest = max(y for y in range(p.H) for x in range(p.W) if p.px[y][x][3] > 0)
        if lowest != p.H - 1:
            print("   ⚠", n, "— pixel thap nhat o y =", lowest, "khong phai", p.H - 1)
print("Kiem tra chan nhan vat: xong")
