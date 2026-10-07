#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
vuonmo_pixel.py — THƯ VIỆN VẼ PIXEL dùng cho bộ QA (KHÔNG phải code game)

Mục đích: mô phỏng lại từng bước (trung thực từng dòng lệnh) các hàm vẽ trong
  unity/Assets/Editor/VuonMoSpriteForge.cs
để (1) render ảnh xem trước bộ sprite, (2) dựng ảnh giả lập màn chơi ở tỉ lệ thật
320×180 — tất cả đều kiểm tra được trong môi trường không có Unity.

Mọi thay đổi bên VuonMoSpriteForge.cs PHẢI được phản chiếu vào file này thì ảnh
xem trước mới đúng. Quy ước toạ độ: y = 0 là hàng TRÊN (giống C#); ToTexture() lật
dọc khi ghi ra PNG/Unity Texture2D (ảnh PNG xem trước cũng lật y khi ghi).
"""
import struct, zlib

# ============================================================ CANVAS PIXEL
CLIP = []      # ghi lai cac lan ve tran canvas

class Pix:
    def __init__(self, w, h, name="?"):
        self.W, self.H = w, h
        self.name = name
        self.px = [[(0, 0, 0, 0)] * w for _ in range(h)]   # y=0 la TREN (giong C#)

    def P(self, x, y, c):
        if x < 0 or y < 0 or x >= self.W or y >= self.H:
            CLIP.append((self.name, 'P', x, y))
            return
        self.px[y][x] = c

    def R(self, x, y, w, h, c):
        if x < 0 or y < 0 or x + w > self.W or y + h > self.H:
            CLIP.append((self.name, 'R', x, y, w, h, self.W, self.H))
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                self.P(xx, yy, c)

    def to_rows(self):
        """Lật dọc như Texture2D.SetPixels32 (Unity gốc dưới-trái)."""
        return list(reversed(self.px))


def C(r, g, b, a=255):
    return (r, g, b, a)

# ============================================================ BANG MAU (khop C#)
Clear   = C(0, 0, 0, 0)
Ink     = C(0x3B, 0x2A, 0x33)
GrassSp, GrassSp2 = C(0x8F, 0xD0, 0x6B), C(0x6F, 0xBF, 0x57)
GrassSu, GrassSu2 = C(0x6F, 0xBF, 0x57), C(0x57, 0xA8, 0x45)
GrassFa, GrassFa2 = C(0xB5, 0x9B, 0x4E), C(0x9C, 0x83, 0x3C)
GrassWi, GrassWi2 = C(0xDD, 0xE7, 0xF0), C(0xC3, 0xD2, 0xE0)
Soil     = C(0x8A, 0x5F, 0x33)
SoilDark = C(0x6E, 0x47, 0x26)
SoilWet  = C(0x5A, 0x3A, 0x1E)
Water    = C(0x4F, 0xA8, 0xD8)
WaterHi  = C(0x7F, 0xD3, 0xE8)
Wood     = C(0xB5, 0x82, 0x52)
WoodDark = C(0x8A, 0x5F, 0x33)
WoodDeep = C(0x6E, 0x47, 0x26)
Stone    = C(0x9A, 0xA5, 0xB1)
StoneDk  = C(0x6E, 0x7A, 0x88)
Cream    = C(0xFF, 0xE9, 0xB8)
Gold     = C(0xFF, 0xD3, 0x4E)
Skin     = C(0xF2, 0xC9, 0xA0)
Cloth    = C(0x5A, 0x78, 0xB8)
ClothDk  = C(0x3B, 0x4E, 0x82)
Leaf     = C(0x6F, 0xBF, 0x57)
LeafDk   = C(0x4E, 0x9A, 0x45)
Weed     = C(0x57, 0xA8, 0x45)
Pest     = C(0x8B, 0x3A, 0x62)
Snow     = C(0xF2, 0xF7, 0xFF)
White    = C(0xFF, 0xFF, 0xFF)

# ============================================================ VE: O DAT
def grass(p, base, fleck):
    p.R(0, 0, 16, 16, base)
    p.R(2, 3, 2, 1, fleck); p.R(7, 8, 2, 1, fleck); p.R(11, 2, 1, 1, fleck)
    p.R(4, 12, 2, 1, fleck); p.R(13, 10, 1, 1, fleck); p.R(9, 14, 1, 1, fleck)

def dirt_path(p):
    p.R(0, 0, 16, 16, Wood)
    p.R(2, 2, 2, 1, WoodDark); p.R(8, 5, 3, 1, WoodDark); p.R(12, 9, 2, 1, WoodDark)
    p.R(1, 11, 2, 1, WoodDark); p.R(6, 13, 2, 1, WoodDark); p.R(10, 1, 1, 1, WoodDark)

def soil_tile(p, wet):
    p.R(0, 0, 16, 16, SoilWet if wet else Soil)
    p.R(1, 5, 5, 1, SoilDark); p.R(10, 5, 5, 1, SoilDark)
    p.R(5, 10, 6, 1, SoilDark)
    p.P(3, 2, SoilDark); p.P(11, 3, SoilDark); p.P(7, 7, SoilDark)
    p.P(2, 12, SoilDark); p.P(13, 9, SoilDark); p.P(9, 14, SoilDark)
    p.P(6, 3, Soil); p.P(12, 13, Soil)
    if wet:
        p.P(4, 3, WaterHi); p.P(9, 12, WaterHi); p.P(13, 6, WaterHi)
        p.P(2, 8, WaterHi); p.P(7, 14, WaterHi)

def water_tile(p):
    p.R(0, 0, 16, 16, Water)
    p.R(0, 4, 16, 1, WaterHi); p.R(0, 11, 16, 1, C(0x3E, 0x8F, 0xC0))
    p.R(3, 7, 3, 1, WaterHi); p.R(10, 2, 2, 1, WaterHi)

def weed_tile(p):
    p.R(1, 11, 1, 4, Weed); p.R(3, 10, 1, 5, Weed)
    p.R(11, 11, 1, 4, Weed); p.R(13, 9, 1, 6, Weed); p.R(7, 12, 1, 3, Weed)

def pest_tile(p):
    p.R(7, 6, 2, 2, Pest); p.P(6, 5, Ink); p.P(9, 5, Ink)
    p.R(6, 8, 1, 1, Pest); p.R(9, 8, 1, 1, Pest)

# ============================================================ VE: CAY
class CropArt:
    def __init__(self, cid, shape, leaf, leafdk, fruit, fruitdk):
        self.id, self.shape = cid, shape
        self.leaf, self.leafDk, self.fruit, self.fruitDk = leaf, leafdk, fruit, fruitdk

CROPS = [
    CropArt("turnip",   "bush",    C(0x8F,0xD0,0x6B), C(0x4E,0x9A,0x45), C(0xF2,0xF0,0xE4), C(0xC9,0xC6,0xB4)),
    CropArt("potato",   "bush",    C(0x7F,0xC4,0x5F), C(0x4E,0x9A,0x45), C(0xC9,0xA2,0x6A), C(0x9C,0x7A,0x4A)),
    CropArt("tomato",   "trellis", C(0x6F,0xBF,0x57), C(0x3E,0x80,0x36), C(0xE5,0x48,0x4D), C(0xB0,0x2F,0x38)),
    CropArt("corn",     "stalk",   C(0x9A,0xD1,0x5C), C(0x57,0xA8,0x45), C(0xFF,0xD3,0x4E), C(0xD8,0xA8,0x28)),
    CropArt("pumpkin",  "vine",    C(0x6F,0xBF,0x57), C(0x40,0x7C,0x38), C(0xE5,0x76,0x2C), C(0xB5,0x55,0x1C)),
    CropArt("grape",    "trellis", C(0x74,0xC4,0x6A), C(0x46,0x8E,0x44), C(0x8E,0x5B,0xC4), C(0x6A,0x3F,0x98)),
    CropArt("snowdrop", "flower",  C(0xA8,0xD8,0xC4), C(0x62,0xA0,0x94), C(0xF2,0xF7,0xFF), C(0xC3,0xD2,0xE0)),
    CropArt("rice",     "stalk",   C(0x86,0xC9,0x5A), C(0x4E,0x8E,0x40), C(0xE8,0xD8,0x8A), C(0xC0,0xAE,0x60)),
]

def crop_tile(p, c, stage):
    """stage: 0 seed, 1 sprout, 2 mature, 3 ripe, 4 wither, 5 dead"""
    if stage == 0:
        p.R(4, 14, 8, 2, SoilDark); p.R(4, 14, 8, 1, Soil)
        p.P(5, 13, Ink); p.P(8, 13, Ink); p.P(10, 13, Ink)
        return
    if stage == 1:
        p.R(7, 10, 1, 6, c.leafDk)
        p.R(4, 10, 3, 1, c.leaf); p.R(9, 10, 3, 1, c.leaf)
        p.R(7, 9, 1, 1, c.leaf)
        return
    if stage == 4:
        p.R(7, 11, 1, 5, C(0x8A, 0x6A, 0x3A))
        p.R(5, 12, 2, 1, C(0xA8, 0x86, 0x4A))
        p.R(9, 13, 2, 1, C(0xA8, 0x86, 0x4A))
        return
    if stage == 5:
        p.R(6, 15, 4, 1, SoilDark)
        p.R(7, 13, 1, 2, C(0x8A, 0x6A, 0x3A))
        return

    if c.shape == "trellis":
        p.R(3, 7, 1, 9, WoodDark); p.R(12, 7, 1, 9, WoodDark)
        p.R(3, 10, 10, 1, WoodDark); p.R(3, 13, 10, 1, WoodDark)
        p.R(4, 8, 8, 2, c.leaf); p.R(4, 11, 8, 2, c.leafDk)
        p.R(5, 14, 6, 1, c.leaf)
    elif c.shape == "stalk":
        p.R(7, 3, 2, 13, c.leafDk)
        p.R(3, 5, 4, 1, c.leaf); p.R(3, 9, 4, 1, c.leaf)
        p.R(9, 7, 4, 1, c.leaf); p.R(9, 11, 4, 1, c.leaf)
        p.R(3, 13, 4, 1, c.leaf)
        p.R(5, 15, 6, 1, c.leafDk)
    elif c.shape == "vine":
        p.R(2, 15, 12, 1, c.leafDk)
        p.R(3, 12, 4, 3, c.leaf); p.R(9, 12, 4, 3, c.leaf)
        p.R(6, 10, 4, 2, c.leafDk)
        p.R(2, 9, 4, 1, c.leaf)
    elif c.shape == "flower":
        p.R(4, 11, 8, 4, c.leaf)
        p.R(5, 15, 6, 1, c.leafDk)
        p.R(3, 12, 1, 3, c.leafDk); p.R(12, 12, 1, 3, c.leafDk)
    else:  # bush
        p.R(4, 10, 8, 5, c.leaf)
        p.R(4, 15, 8, 1, c.leafDk)
        p.R(3, 12, 1, 3, c.leafDk); p.R(12, 12, 1, 3, c.leafDk)
        p.R(6, 9, 4, 1, c.leafDk)

    if stage == 3:
        if c.shape == "stalk":
            p.R(6, 9, 2, 4, c.fruit); p.R(9, 5, 2, 4, c.fruit)
            p.P(6, 9, c.fruitDk); p.P(7, 9, White)
        elif c.shape == "trellis":
            p.R(4, 11, 2, 2, c.fruit); p.R(9, 11, 2, 2, c.fruit)
            p.R(7, 14, 2, 1, c.fruit)
            p.P(4, 11, c.fruitDk); p.P(5, 11, White)
        elif c.shape == "flower":
            p.R(5, 9, 2, 2, c.fruit); p.R(9, 9, 2, 2, c.fruit)
            p.R(7, 12, 2, 2, c.fruit)
            p.P(9, 9, c.fruitDk); p.P(10, 9, White)
        else:
            p.R(4, 12, 2, 2, c.fruit); p.R(10, 12, 2, 2, c.fruit)
            p.R(7, 13, 2, 2, c.fruit)
            p.P(4, 12, c.fruitDk); p.P(5, 12, White)

# ============================================================ VE: VAT PHAM
def produce(p, fruit, fruitdk):
    p.R(4, 5, 8, 8, fruit); p.R(4, 4, 8, 1, fruit)
    p.P(5, 6, White); p.P(6, 6, White)
    p.R(4, 12, 8, 1, fruitdk)
    p.R(7, 2, 2, 3, LeafDk); p.R(9, 3, 2, 1, Leaf)

def seed_bag(p, fruit):
    p.R(4, 6, 8, 8, C(0xD8, 0xC8, 0xA8))
    p.R(4, 6, 8, 1, C(0xB8, 0xA8, 0x88))
    p.R(6, 3, 4, 3, C(0xB8, 0xA8, 0x88))
    p.R(6, 8, 4, 3, fruit)
    p.P(9, 6, Ink)

def wood_item(p):
    p.R(2, 7, 12, 3, Wood); p.R(2, 10, 12, 3, WoodDark)
    p.R(2, 7, 12, 1, C(0xD0, 0xA0, 0x6A)); p.R(2, 12, 12, 1, WoodDeep)

def stone_item(p):
    p.R(4, 6, 8, 7, Stone); p.R(5, 5, 6, 1, Stone)
    p.R(4, 11, 8, 2, StoneDk); p.P(6, 7, White)

def tool_icon(p, tool):
    if tool == 0:      # cuoc
        p.R(3, 3, 2, 10, WoodDark); p.R(5, 3, 5, 2, Stone)
    elif tool == 1:    # binh tuoi
        p.R(4, 7, 7, 6, Stone); p.R(4, 7, 7, 1, StoneDk)
        p.R(10, 5, 4, 2, StoneDk); p.R(11, 4, 2, 1, Stone)
        p.R(5, 4, 3, 3, StoneDk)
    elif tool == 2:    # liem
        p.R(4, 3, 2, 9, WoodDark); p.R(6, 3, 6, 2, Stone); p.R(11, 4, 2, 3, StoneDk)
    elif tool == 3:    # riu
        p.R(7, 4, 2, 9, WoodDark); p.R(4, 3, 4, 4, Stone); p.R(4, 6, 5, 1, StoneDk)
    elif tool == 4:    # cuoc chim
        p.R(7, 4, 2, 9, WoodDark); p.R(3, 4, 9, 2, StoneDk)
    elif tool == 5:    # can cau
        p.R(4, 3, 1, 11, WoodDark); p.R(5, 3, 6, 1, StoneDk)
        p.P(11, 4, White); p.R(11, 5, 1, 2, WaterHi)
    elif tool == 6:    # tui hat
        p.R(4, 7, 8, 6, C(0xD8, 0xC8, 0xA8))
        p.R(6, 4, 4, 3, C(0xB8, 0xA8, 0x88))
        p.R(6, 9, 4, 2, LeafDk)
    else:              # tay khong
        p.R(6, 6, 4, 6, Skin); p.R(6, 12, 4, 1, C(0xD8, 0xA8, 0x7C))

# ============================================================ VE: CONG TRINH
def house(p):
    wall, wallDk, roof = C(0xE8,0xDC,0xC0), C(0xC8,0xBC,0xA0), C(0x8C,0x4A,0x3A)
    p.R(6, 16, 36, 24, wall); p.R(6, 16, 36, 1, wallDk)
    for i in range(8):
        p.R(20 - i*2, 6 + i, 8 + i*4, 1, roof)
    p.R(4, 15, 40, 2, roof)
    p.R(20, 28, 8, 12, WoodDark); p.P(26, 34, Gold)
    p.R(10, 20, 6, 6, C(0x9A,0xC8,0xE0)); p.R(32, 20, 6, 6, C(0x9A,0xC8,0xE0))

def barn(p):
    wall, wallDk, roof = C(0xB0,0x4A,0x3A), C(0x8A,0x38,0x2C), C(0x6E,0x47,0x26)
    p.R(4, 14, 40, 26, wall); p.R(4, 14, 40, 1, wallDk)
    for i in range(6):
        p.R(19 - i*3, 8 + i, 10 + i*6, 1, roof)
    p.R(2, 13, 44, 2, roof)
    p.R(16, 24, 16, 16, wallDk); p.R(18, 26, 12, 12, C(0x5A,0x2E,0x22))
    p.R(16, 24, 16, 1, Cream); p.R(24, 24, 1, 16, Cream)

def coop(p):
    wall, roof = C(0xD8,0xB0,0x78), C(0x8A,0x5F,0x33)
    p.R(3, 14, 26, 18, wall)
    for i in range(6):
        p.R(12 - i*2, 8 + i, 8 + i*4, 1, roof)
    p.R(2, 13, 28, 2, roof)
    p.R(12, 23, 8, 9, WoodDeep); p.R(7, 18, 4, 4, C(0x9A,0xC8,0xE0))

def well(p):
    p.R(2, 16, 12, 8, Stone); p.R(2, 16, 12, 1, StoneDk)
    p.R(4, 18, 8, 5, C(0x2E,0x4A,0x6E))
    p.R(3, 8, 2, 8, WoodDark); p.R(11, 8, 2, 8, WoodDark)
    p.R(1, 5, 14, 3, C(0x8C,0x4A,0x3A)); p.R(6, 8, 4, 1, WoodDark)

def tree(p, winter):
    p.R(14, 24, 4, 24, WoodDeep); p.R(14, 24, 1, 24, WoodDark)
    if winter:
        p.R(10, 30, 12, 1, WoodDeep); p.R(12, 26, 8, 1, WoodDeep)
        p.R(8, 22, 16, 2, Snow); p.R(18, 18, 10, 2, Snow)
        return
    p.R(6, 6, 20, 16, LeafDk); p.R(8, 2, 16, 8, Leaf)
    p.R(4, 12, 12, 8, Leaf); p.R(16, 10, 12, 8, Leaf)
    p.R(9, 5, 6, 4, C(0x9A,0xE0,0x78)); p.R(17, 13, 5, 3, C(0x57,0xA8,0x45))

def fence(p):
    p.R(0, 8, 16, 2, Wood); p.R(0, 12, 16, 2, Wood)
    p.R(2, 4, 3, 12, WoodDark); p.R(11, 4, 3, 12, WoodDark)
    p.R(2, 4, 3, 1, Wood); p.R(11, 4, 3, 1, Wood)

def sign(p):
    p.R(6, 10, 4, 6, WoodDeep)
    p.R(2, 3, 12, 8, Wood); p.R(2, 3, 12, 1, WoodDark); p.R(2, 10, 12, 1, WoodDeep)
    p.R(4, 6, 8, 1, WoodDeep); p.R(4, 8, 5, 1, WoodDeep)

# ============================================================ VE: THOI TIET & UI
def weather_icon(p, kind):
    if kind == 0:
        p.R(5, 5, 6, 6, Gold); p.R(6, 4, 4, 8, Gold); p.R(4, 6, 8, 4, Gold)
        p.P(7, 7, C(0xFF,0xF2,0xB8))
    elif kind == 1:
        p.R(4, 7, 9, 5, White); p.R(6, 5, 5, 3, White); p.R(4, 11, 9, 1, Stone)
    elif kind == 2:
        p.R(3, 4, 10, 5, Stone); p.R(5, 2, 5, 3, Stone)
        p.R(4, 10, 1, 3, WaterHi); p.R(8, 10, 1, 4, WaterHi); p.R(11, 10, 1, 2, WaterHi)
    elif kind == 3:
        p.R(3, 3, 10, 5, StoneDk); p.R(5, 1, 5, 3, StoneDk)
        p.R(8, 8, 2, 3, Gold); p.R(6, 11, 3, 2, Gold); p.R(7, 12, 2, 3, Gold)
    elif kind == 4:
        p.R(4, 4, 9, 5, White); p.R(6, 2, 5, 3, White)
        p.P(5, 11, Snow); p.P(9, 12, Snow); p.P(12, 10, Snow)
    else:
        p.R(2, 4, 12, 2, C(0xC8,0xD4,0xE0)); p.R(3, 7, 10, 2, C(0xB0,0xBC,0xCC))
        p.R(2, 10, 12, 2, C(0xC8,0xD4,0xE0))

def panel(p):
    p.R(0, 0, 16, 16, C(20, 16, 24, 210))
    p.R(0, 0, 16, 1, Cream); p.R(0, 15, 16, 1, Cream)
    p.R(0, 0, 1, 16, Cream); p.R(15, 0, 1, 16, Cream)

def shadow(p):
    p.R(3, 6, 10, 2, C(0,0,0,70)); p.R(4, 5, 8, 3, C(0,0,0,70))

# ============================================================ VE: NHAN VAT (16x24)
def player(p, direction, frame):
    flip = (frame == 1)
    p.R(6, 20, 2, 3 + (0 if flip else 1), ClothDk)
    p.R(9, 20, 2, 3 + (1 if flip else 0), ClothDk)
    p.R(6, 19, 5, 2, Ink)
    p.R(5, 14, 7, 6, Cloth); p.R(5, 14, 7, 1, ClothDk)
    p.R(4, 15, 1, 4, ClothDk); p.R(12, 15, 1, 4, ClothDk)
    p.R(6, 10, 5, 5, Skin)
    p.R(3, 7, 11, 4, C(0xD8,0xB0,0x6A))
    p.R(5, 4, 7, 4, C(0xC9,0xA2,0x5A))

    if direction == 0:
        p.P(7, 12, Ink); p.P(10, 12, Ink); p.R(7, 14, 3, 1, C(0xD8,0xA8,0x7C))
    elif direction == 1:
        p.R(5, 10, 7, 5, C(0xE0,0xC0,0x90)); p.R(4, 12, 1, 3, ClothDk)
    elif direction == 2:
        p.P(6, 12, Ink); p.R(4, 11, 1, 2, Skin); p.R(11, 15, 1, 4, ClothDk)
    else:
        p.P(11, 12, Ink); p.R(13, 11, 1, 2, Skin); p.R(4, 15, 1, 4, ClothDk)

# ============================================================ PNG WRITER
def write_png(path, W, H, get_pixel, scale=1):
    """get_pixel(x, y) -> (r,g,b,a) với y=0 là TRÊN."""
    out_w, out_h = W * scale, H * scale
    raw = bytearray()
    for y in range(out_h):
        raw.append(0)
        sy = y // scale
        for x in range(out_w):
            r, g, b, a = get_pixel(x // scale, sy)
            raw += bytes((r, g, b, a))

    def chunk(tag, data):
        return (struct.pack('>I', len(data)) + tag + data +
                struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF))

    ihdr = struct.pack('>IIBBBBB', out_w, out_h, 8, 6, 0, 0, 0)
    png = (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) +
           chunk(b'IDAT', zlib.compress(bytes(raw), 9)) + chunk(b'IEND', b''))
    with open(path, 'wb') as f:
        f.write(png)

# ============================================================ CONTACT SHEET
BG = C(0x22, 0x22, 0x2C)
sprites = []          # (name, Pix) — xem build_sprites()

def add(name, w, h, fn):
    p = Pix(w, h, name)
    fn(p)
    sprites.append((name, p))

def build_sprites():
    """Vẽ toàn bộ sprite tạm; trả về [(tên, Pix), ...] (đúng thứ tự như C#)."""
    del sprites[:]
    # ô đất
    add("tile_grass_spring", 16, 16, lambda p: grass(p, GrassSp, GrassSp2))
    add("tile_grass_summer", 16, 16, lambda p: grass(p, GrassSu, GrassSu2))
    add("tile_grass_fall",   16, 16, lambda p: grass(p, GrassFa, GrassFa2))
    add("tile_grass_winter", 16, 16, lambda p: grass(p, GrassWi, GrassWi2))
    add("tile_dirt_path",    16, 16, dirt_path)
    add("tile_soil",         16, 16, lambda p: soil_tile(p, False))
    add("tile_soil_wet",     16, 16, lambda p: soil_tile(p, True))
    add("tile_water",        16, 16, water_tile)
    add("tile_weed",         16, 16, weed_tile)
    add("tile_pest",         16, 16, pest_tile)
    # cây: 8 cây × 6 giai đoạn
    for c in CROPS:
        for st in range(6):
            add("crop_" + c.id + "_" + ["seed","sprout","mature","ripe","wither","dead"][st], 16, 16,
                (lambda cc, ss: (lambda p: crop_tile(p, cc, ss)))(c, st))
    # vật phẩm
    for c in CROPS:
        add("item_" + c.id, 16, 16, (lambda cc: (lambda p: produce(p, cc.fruit, cc.fruitDk)))(c))
    for c in CROPS:
        add("item_seed_" + c.id, 16, 16, (lambda cc: (lambda p: seed_bag(p, cc.fruit)))(c))
    add("item_wood",  16, 16, wood_item)
    add("item_stone", 16, 16, stone_item)
    # công cụ
    for i, n in enumerate(["hoe","wateringcan","sickle","axe","pickaxe","fishingrod","seedbag","hand"]):
        add("tool_" + n, 16, 16, (lambda k: (lambda p: tool_icon(p, k)))(i))
    # công trình
    add("prop_house", 48, 40, house)
    add("prop_barn",  48, 40, barn)
    add("prop_coop",  32, 32, coop)
    add("prop_well",  16, 24, well)
    add("prop_tree",  32, 48, lambda p: tree(p, False))
    add("prop_tree_winter", 32, 48, lambda p: tree(p, True))
    add("prop_fence", 16, 16, fence)
    add("prop_sign",  16, 16, sign)
    # thời tiết + UI
    for i, n in enumerate(["sunny","cloudy","rain","storm","snow","fog"]):
        add("weather_" + n, 16, 16, (lambda k: (lambda p: weather_icon(p, k)))(i))
    add("ui_white", 8, 8, lambda p: p.R(0, 0, 8, 8, White))
    add("ui_panel", 16, 16, panel)
    add("player_shadow", 16, 8, shadow)
    # nhân vật
    for d, dn in enumerate(["down","up","left","right"]):
        for f in range(2):
            add("player_" + dn + "_" + str(f), 16, 24, (lambda dd, ff: (lambda p: player(p, dd, ff)))(d, f))
    return sprites
