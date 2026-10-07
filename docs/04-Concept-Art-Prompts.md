# BỘ PROMPT TẠO CONCEPT ART & SPRITE PIXEL — *Vườn Mơ*
### Dùng cho Midjourney v6.1/v7 · DALL·E 3 · Stable Diffusion XL · Flux · Firefly · Leonardo · **Aseprite (vẽ tay)**

> **Cách dùng:** copy nguyên dòng prompt → dán vào công cụ. Tham số `--ar`, `--stylize`, `--no`, `--sref` chỉ có tác dụng với Midjourney; với DALL·E/Flux hãy bỏ phần sau `--` và viết negative thành câu: *"tránh: …"*.
> ⚠️ **Quan trọng:** AI tạo ảnh **không** ra sprite sheet dùng được trực tiếp trong game (pixel sẽ lệch lưới, sai palette). Ảnh AI = **concept / bố cục / mood**; sprite production phải **vẽ tay trong Aseprite** theo spec ở `docs/03-Asset-2D-Sprite-Spec.md`.

---

## 0. KHỐI STYLE CHUẨN (dán vào MỌI prompt để giữ nhất quán)

```
STYLE TOKENS:
pixel art, 16-bit SNES style, 32x32 pixel tiles, crisp hard pixels, NO anti-aliasing,
1px dark brown outline (#3B2A33), dithered shading (checkerboard), 2-tone shadows,
limited palette of 48 warm colors (sage green, cream, honey gold, terracotta, soft brown),
cozy wholesome mood, top-down view, clean readable composition, focused source of light from upper-left

NEGATIVE (--no):
anti-aliasing, blurry, smooth gradients, 3D render, vector art, watercolor, photo, glow bloom,
modern objects, text, watermark, logo, signature, extra limbs, distorted anatomy, dark gloomy mood,
neon colors, oversaturated, mixed pixel sizes, blurry edges
```

**Palette chính (dán khi cần khoá màu):**
`palette: grass #8FD06B #6FBF57 #4E9A45, soil #8A5F33 #6E4726, wood #B58252 #8A5F33, cream #FFE9B8, gold #FFD34E, terracotta #E5762C, rose #F7A8B8, sky #7EC0EE, water #4FA8D8, outline #3B2A33`

---

## 1. HAI PROMPT GỐC — PHIÊN BẢN PIXEL

### 1.1 Bối cảnh trang trại tổng thể (top-down)
```
Pixel art top-down 2D farming game map, 32x32 pixel tiles, cozy small farm viewed from directly above,
neat rectangular soil plots with tomatoes, corn and pumpkins in different growth stages,
wooden barn with red roof, small pond with lily pads and a well, dirt paths, cherry blossom tree,
flower patches, wooden fence, pixel chickens, limited warm palette, crisp hard pixels, no anti-aliasing,
dithered shading, 16-bit SNES style --ar 16:9 --stylize 250
```

### 1.2 Gameplay — nhân vật đang tưới cây (top-down)
```
Pixel art 2D top-down farming game screenshot, cute pixel farmer with straw hat and blue overalls
watering tomato plants with a watering can, pixel water droplets and sparkles, neat crop rows
in different growth stages, wooden fence and small barn background, pond on the left, sunny warm day,
32x32 pixel tiles, limited warm palette, crisp hard pixels, no anti-aliasing, 16-bit SNES style,
pixel HUD with heart and energy bar in the corner --ar 16:9 --stylize 250
```

---

## 2. PROMPT THEO 4 MÙA (đổi tile & bảng màu)

**Xuân**
```
Pixel art top-down farm map, spring, cherry blossom petals drifting, young green sprouts in neat plots,
pastel pink and sage green palette, small puddles, lambs in the fenced yard, sunny soft morning light,
16-bit SNES pixel art, crisp pixels, dithered shadows --ar 16:9
```

**Hạ**
```
Pixel art top-down farm map, summer, lush corn and tomato fields, sunflowers along the fence,
pond sparkling, straw hat scarecrow, bright warm noon light with slight golden overlay,
saturated greens and honey golds, 16-bit SNES pixel art, crisp pixels --ar 16:9
```

**Thu**
```
Pixel art top-down farm map, autumn, pumpkin patch and grape trellis, orange and amber maple trees,
hay bales near the barn, dead leaves on dirt paths, warm terracotta palette, golden hour light,
16-bit SNES pixel art, crisp pixels, dithered shadows --ar 16:9
```

**Đông**
```
Pixel art top-down farm map, winter, snow-covered crop plots and rooftops, frozen pond with skate marks,
glowing greenhouse full of green plants, footprints in snow, chimney smoke, cool blue palette
with warm lantern light, blue-hour mood, 16-bit SNES pixel art, crisp pixels --ar 16:9
```

---

## 3. PROMPT THEO THỜI TIẾT & THỜI ĐIỂM

```
Pixel art top-down farm, gentle rain, visible pixel rain streaks, ripple rings in puddles,
wet dark soil, warm window light from the farmhouse, saturated greens, cozy mood,
16-bit SNES pixel art, crisp pixels --ar 16:9
```
```
Pixel art top-down farm at night, fireflies drifting over the field, lanterns glowing warm orange,
starry sky, dark blue overlay tint, deep blue and amber palette, 16-bit SNES pixel art, crisp pixels --ar 16:9
```
```
Pixel art top-down farm during a storm, diagonal heavy rain, wind-bent crops, flying leaves,
bright white lightning flash in two frames, dramatic dark blue palette, 16-bit SNES pixel art --ar 16:9
```

---

## 4. SPRITE SHEET & ASSET SHEET (dùng làm reference cho Aseprite)

**Cây trồng 4 giai đoạn**
```
Pixel art sprite sheet, four growth stages of a tomato plant in a row on a plain light background,
each stage in a 16x32 pixel frame: seed mound in soil, two-leaf sprout, leafy plant with green fruits,
ripe plant heavy with red tomatoes, 1px dark brown outline, crisp pixels, no anti-aliasing,
16-bit SNES style, evenly spaced grid
```

**Nhân vật 4 hướng**
```
Pixel art character sprite sheet, cute farmer character wearing straw hat and blue overalls,
four facing directions (down, up, left, right), 2 idle frames and 4 walk frames each,
16x24 pixel frames, side view grid layout, clear 1px outline, palette limited to 8 colors,
crisp pixels, no anti-aliasing, 16-bit SNES style
```

**Gia súc**
```
Pixel art sprite sheet, farm animals in a grid: white chicken, brown cow, gray sheep, white duck,
pig, each animal drawn in side view and in 3 poses (idle, walk, eat), 16x16 to 32x32 pixel frames,
1px outline, crisp pixels, 16-bit SNES style, plain background
```

**Công cụ**
```
Pixel art asset sheet, farm tools arranged in a row on plain background: hoe, watering can, sickle,
axe, pickaxe, fishing rod, seed bag, each 16x16 pixels, bright readable shapes, 1px dark outline,
crisp pixels, 16-bit SNES style
```

**Tile set (địa hình)**
```
Pixel art tileset sheet, 16x16 pixel tiles arranged in a grid: grass with 4 random variants,
tilled soil, watered dark soil, dirt path, stone path, water with animated wave frames, cliff faces,
shoreline with foam, fence pieces, each tile clearly separated on a plain background,
1px outline, limited palette, crisp pixels, 16-bit SNES style
```

**Công trình**
```
Pixel art building sheet, cozy farm buildings in isometric-free side-front elevation:
small wooden farmhouse with red roof, barn with sliding door, chicken coop, greenhouse,
windmill, well, each with a door-open variant, 64x64 to 112x96 pixel sprites, 1px dark outline,
limited warm palette, crisp pixels, 16-bit SNES style, plain background
```

**UI / HUD**
```
Pixel art game UI kit, 9-slice wooden and parchment panels, rounded pixel corners, item slots 20x20,
heart icons, coin icon, weather icons (sun, cloud, rain, storm, snow, fog) 16x16,
bitmap 8x8 font sample, warm cream and sage palette, crisp pixels, no anti-aliasing,
16-bit SNES style, plain background
```

**Bìa / key art (cho Steam)**
```
Pixel art key art poster, cute pixel farmer standing on a hill overlooking a cozy valley farm
at golden hour, villagers waving from the village below, four seasons blended across the landscape,
birds in the sky, warm limited palette, crisp pixels with dithering, 16-bit SNES style,
vertical capsule composition with space for a title at the top --ar 3:4 --stylize 400
```

---

## 5. TEMPLATE "SẢN XUẤT HÀNG LOẠT" (khớp bảng spec `03-Asset-2D-Sprite-Spec.md`)

```
[CAMERA/GÓC] + [TÊN SPRITE + mô tả + màu] + [KHUNG/ SỐ KHUNG] + [STYLE TOKENS] + [NỀN] + [THAM SỐ]
```

| Thành phần | Lựa chọn |
|---|---|
| **GÓC** | `top-down view` (bản đồ) · `side-front elevation` (công trình, công cụ) · `side view` (động vật) · `four facing directions` (nhân vật) · `sprite sheet grid on plain background` (asset sheet) |
| **KHUNG** | `16x16 pixel frame` · `16x24 pixel frame` (nhân vật) · `16x32` (ngô, nho) · `32x32` (bò, máy) · `48x64` (cây lớn) |
| **NỀN** | `plain light background` (asset sheet) · `in-game map with 32x32 tiles` (screenshot) |
| **THAM SỐ** | MJ: `--ar 16:9 --stylize 250 --v 6.1` · SDXL: `steps 30, CFG 6, DPM++ 2M Karras, 1024×1024, Pixel Art LoRA` · DALL·E 3: câu tự nhiên, bỏ `--` |

### Ví dụ sinh tự động

| Asset | Prompt |
|---|---|
| `crop_pumpkin_ripe` | `sprite sheet grid on plain background, pixel art ripe orange pumpkin on a vine with 2 leaves, 32x16 pixel frame, 1px dark outline, crisp pixels, 16-bit SNES style` |
| `ani_duck` | `side view sprite sheet on plain background, pixel art white duck, 3 poses (idle, walk, eat) and a swimming pose, 16x16 pixel frames, crisp pixels, 16-bit SNES style` |
| `build_windmill` | `side-front elevation on plain background, pixel art cozy wooden windmill with rotating blade frames, 64x80 pixel sprite, warm limited palette, crisp pixels, 16-bit SNES style` |
| `tool_wateringcan_gold` | `sprite on plain background, pixel art golden watering can, 16x16 pixel frame, sparkle detail, 1px outline, crisp pixels` |
| `tile_water` | `pixel art animated water tile, 4 frames of gentle wave ripples, 16x16 pixel frames, blue palette #4FA8D8 #7FD3E8, crisp pixels, 16-bit SNES style` |

---

## 6. GIỮ NHẤT QUÁN (workflow chuẩn của dự án)

| Công cụ | Kỹ thuật |
|---|---|
| **Midjourney** | `--sref <ảnh chuẩn>` giữ phong cách · `--cref <ảnh nhân vật>` giữ nhân vật · `--seed 12345` tái lập · `--no anti-aliasing, 3D` |
| **Stable Diffusion** | Dùng **Pixel Art LoRA** + `ControlNet` (trên blockout đơn giản) · **IP-Adapter** giữ style · luôn thêm negative `anti-aliasing, blurry, smooth gradient` |
| **DALL·E 3** | Viết câu tự nhiên, luôn nhắc lại "cùng phong cách pixel art 16-bit, palette giới hạn, không anti-aliasing" |
| **Aseprite (sản xuất thật)** | 1) Import `vuonmo.pal` (48 màu) khoá cứng · 2) Vẽ ở 100% zoom, tắt smoothing · 3) Dùng Onion Skin cho animation · 4) Export PNG-8 + JSON metadata · 5) **Pixel Perfect brush = ON** |
| **Quy trình 6 bước** | ① Tạo mood/concept AI → ② Chọn & tinh chỉnh bố cục → ③ Blockout pixel thô (silhouette) → ④ Vẽ chi tiết trong Aseprite → ⑤ Kiểm tra palette/outline → ⑥ Test trong engine ở 100% và sau upscale |

> ⚠️ **Pháp lý:** ảnh AI chỉ dùng làm **concept/reference nội bộ**. Mọi sprite đưa vào game phải do artist vẽ tay (hoặc asset mua có license thương mại) — không ship ảnh AI trực tiếp vào sản phẩm.

---

## 7. CHECKLIST DUYỆT ẢNH/SPRITE

- [ ] Đúng bảng màu mùa (Xuân/Hạ/Thu/Đông) — không pha trộn lung tung.
- [ ] Silhouette đọc được khi zoom 100% **và** khi thu nhỏ 50%.
- [ ] Không anti-aliasing, không gradient mượt, không viền mờ.
- [ ] Viền 1 px màu `#3B2A33`, liền mạch, không có pixel lạc.
- [ ] Đổ bóng dùng dithering, nguồn sáng từ trên-trái (thống nhất mọi sprite).
- [ ] Nếu là asset sheet: cùng tỉ lệ, cùng hướng nhìn, nền phẳng, các khung cách đều.
- [ ] Nhân vật: tỉ lệ chibi-lite (đầu ≈ 8 px trên thân 16 px), mắt 1–2 px rõ ràng.
