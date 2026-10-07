# Ảnh concept pixel art mẫu — *Vườn Mơ*

Ba ảnh dưới đây được sinh **trực tiếp từ 2 prompt gốc trong yêu cầu**, đã thêm khối `STYLE TOKENS` pixel
(xem `docs/04-Concept-Art-Prompts.md` mục 0 và 1) để bám đúng phong cách dự án.

> ⚠️ Ảnh AI là **concept/mood reference**, KHÔNG phải sprite dùng được trong game (pixel AI thường lệch lưới
> và sai palette). Sprite production phải vẽ tay trong Aseprite theo `docs/03-Asset-2D-Sprite-Spec.md`.

---

## 1. `concept-01-farm-overview.png` — Bản đồ trang trại (top-down)

**Prompt đã dùng:**
```
Pixel art top-down 2D farming game map, 32x32 pixel tiles, cozy small farm viewed from directly above,
neat rectangular soil plots with tomatoes, corn and pumpkins in different growth stages,
wooden barn with red roof, small pond with lily pads and a well, dirt paths, cherry blossom tree,
flower patches, wooden fence, pixel chickens, limited warm palette, crisp hard pixels, no anti-aliasing,
dithered shading, 16-bit SNES style, 16:9 view
```

**Kiểm chứng theo spec:**
- ✅ Lưới ô đất 16×16 px đọc rõ → dùng làm reference cho `tile_grass_*`, `tile_soil_*`
- ✅ Bố cục vùng: ruộng – chuồng – nhà – hồ nước – đường đất (đúng sơ đồ làng ở GDD §7.3)
- ✅ Có cây anh đào, giếng, hàng rào, gà pixel = đúng nhóm asset 3.25–3.34

**Dùng cho:** reference bản đồ làng, layout vùng trang trại, tham chiếu palette mùa Xuân.

---

## 2. `concept-02-gameplay.png` — Gameplay: nhân vật tưới cà chua

**Prompt đã dùng:**
```
Pixel art 2D top-down farming game screenshot, cute pixel farmer with straw hat and blue overalls
watering tomato plants with a watering can, pixel water droplets and sparkles, neat crop rows
in different growth stages, wooden fence and small barn background, pond on the left, sunny warm day,
32x32 pixel tiles, limited warm palette, crisp hard pixels, no anti-aliasing, 16-bit SNES style,
pixel HUD with heart and energy bar in the corner, 16:9 view
```

**Kiểm chứng:**
- ✅ **HUD pixel đúng thiết kế**: thanh tim, thanh năng lượng/nước, đồng hồ 10:15 AM, hotbar+tên công cụ
  → tham chiếu trực tiếp cho `HudController2D`
- ✅ Nhân vật tỉ lệ chibi-lite, mũ rơm + overall → `char_farmer_base_*`, `outfit_overall_*`
- ✅ **Cây cà chua có giàn** đúng như spec (`crop_tomato_*` 16×32 có cọc giàn)
- ✅ Nước bắn + hạt lấp lánh = `fx_water_splash(4)` + `fx_sparkle(3)`
- ✅ Tile đường đất có **bờ dither** đúng quy tắc Rule Tile ở GDD §2.1

**Dùng cho:** reference mood gameplay, HUD, animation tưới nước, đèn/ánh sáng ban ngày.

---

## 3. `pixel-03-sprite-sheet.png` — Sprite sheet mẫu (nhân vật, cây, gia súc, công cụ)

**Prompt đã dùng:**
```
Pixel art sprite sheet for a 2D farming game on a clean neutral background, organized in neat rows:
row 1 four growth stages of a tomato plant ... row 2 four growth stages of a corn plant
... row 3 a cute pixel farmer character in four facing directions (down, up, left, right)
... row 4 farm animals: chicken, cow, sheep, duck ... row 5 tools: hoe, watering can, sickle, axe;
limited palette, crisp hard pixels, no anti-aliasing, black outlines, 16-bit SNES style,
evenly spaced grid layout, white background
```

**Dùng cho:** trao đổi với artist về **tỉ lệ tương đối** giữa các asset (cây cao bao nhiêu so với nhân vật,
bò to gấp mấy lần gà) và thứ tự khung animation — **không** dùng làm asset thật.

---

## Sinh tiếp ảnh cho mùa khác (chạy ngay)

Lấy prompt ở `docs/04-Concept-Art-Prompts.md` mục 2 (4 mùa) hoặc mục 3 (thời tiết/đêm), giữ nguyên
`STYLE TOKENS`, rồi thêm cờ giữ phong cách của Midjourney:

```
--sref art/concept-01-farm-overview.png --sw 60 --stylize 250 --ar 16:9
```

> `--sref` = style reference (giữ phong cách) · `--sw` = độ mạnh tham chiếu (0–100) · `--seed` = tái lập kết quả.

## Lưu ý sử dụng
Ảnh AI **chỉ dùng làm concept/reference nội bộ**. Sprite đưa vào game phải do artist vẽ tay trong Aseprite
(hoặc asset mua có license thương mại) — không ship trực tiếp ảnh AI vào sản phẩm.
