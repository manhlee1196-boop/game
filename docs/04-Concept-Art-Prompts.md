# BỘ PROMPT TẠO CONCEPT ART & ASSET 3D — *Vườn Mơ*
### Dùng cho Midjourney v6.1 / v7 · DALL·E 3 · Stable Diffusion XL · Flux · Firefly · Leonardo

> **Cách dùng nhanh:** copy nguyên dòng prompt → dán vào công cụ. Các tham số `--ar`, `--stylize`, `--no` chỉ có tác dụng với Midjourney; với DALL·E/Flux hãy bỏ phần sau dấu `--` và viết phần "negative" thành câu: *"tránh: …"*.

---

## 0. KHỐI STYLE CHUẨN (dùng lặp lại cho MỌI prompt để giữ tính nhất quán)

```
STYLE TOKENS (chèn vào giữa prompt):
stylized low-poly 3D, faceted geometry, soft rounded shapes, vibrant yet warm color palette,
soft global illumination, gentle soft shadows, subtle warm brown outline, matte clay-and-wood materials,
handcrafted diorama look, clean uncluttered composition, cozy wholesome atmosphere,
Unreal Engine 5 render, Blender Cycles render, high detail, 8k

NEGATIVE (--no):
photorealistic, hyperrealistic skin pores, gritty texture, horror, desaturated, dull colors,
heavy sharp shadows, lens flare overload, watermark, text, logo, distorted hands, extra fingers,
blurry, low poly jagged artifacts, dark gloomy mood
```

**Bảng màu tham chiếu (dán vào prompt khi cần khoá màu):**
`palette: sage green #9BD07A, warm cream #FFE9B8, honey gold #FFD34E, terracotta #E5762C, dusty rose #F7A8B8, sky blue #A8DCF0, soft brown #7A5230`

---

## 1. HAI PROMPT GỐC (giữ nguyên — dùng trực tiếp)

### 1.1 Bối cảnh trang trại tổng thể
```
3D stylized cozy farm concept art, Isometric view, vibrant colorful crops, wooden barn, small pond, warm sunlight, clean low-poly models, Blender render style, Unreal Engine 5, highly detailed, soft shadows --ar 16:9
```

### 1.2 Nhân vật đang làm nông (third-person)
```
Third-person gameplay view of a cute character watering tomato plants in a vibrant 3D farm, stylized 3D graphics, bright sunny day, Studio Ghibli inspired colors, rendered in Octane Render --ar 16:9
```

---

## 2. PHIÊN BẢN NÂNG CẤP (đã thêm style token, chi tiết hơn — khuyên dùng)

### 2.1 Trang trại tổng thể — 4 mùa

**Xuân**
```
Isometric 3D stylized cozy farm diorama, spring season, cherry blossom trees in soft pink bloom,
young green sprouts in neat 2x2 grid plots, small wooden barn with red roof, tiny pond reflecting sky,
warm morning sunlight, stylized low-poly, faceted geometry, vibrant pastel palette sage green and dusty rose,
soft shadows, Blender Cycles render, Unreal Engine 5, highly detailed, clean composition --ar 16:9 --stylize 250
```

**Hạ**
```
Isometric 3D stylized cozy farm diorama, summer season, lush tomato and corn field in perfect grid rows,
sunflowers along the fence, wooden windmill, sparkling pond, bright noon sunlight with warm golden haze,
stylized low-poly, faceted geometry, vibrant saturated greens and honey golds, soft shadows,
Blender Cycles render, Unreal Engine 5, high detail --ar 16:9 --stylize 250
```

**Thu**
```
Isometric 3D stylized cozy farm diorama, autumn season, pumpkin patch and grape trellis,
orange and amber maple trees, wooden barn with hay bales, geese walking on a dirt path,
golden hour light, gentle mist, stylized low-poly, faceted geometry, terracotta and honey palette,
soft shadows, Blender Cycles render, Unreal Engine 5 --ar 16:9 --stylize 250
```

**Đông**
```
Isometric 3D stylized cozy farm diorama, winter season, snow-covered roofs and fields,
chimney smoke curling upward, frozen pond with skating marks, glowing greenhouse full of green plants,
lanterns along the path, blue-hour ambient light with warm window glow, stylized low-poly, faceted geometry,
cool blue and cream palette, soft shadows, Blender Cycles render, Unreal Engine 5 --ar 16:9 --stylize 250
```

### 2.2 Thời tiết đặc biệt
```
Isometric 3D stylized cozy farm diorama, gentle rain, visible rain streaks, puddles with ripple rings,
wet reflective dirt paths, saturated greens, cozy warm-lit farmhouse window, stylized low-poly,
soft volumetric mist, Blender Cycles render, Unreal Engine 5 --ar 16:9
```
```
Isometric 3D stylized cozy farm diorama, night scene, fireflies drifting over the field,
oil lanterns glowing warm orange, starry sky with vivid milky way, distant carnival tent,
stylized low-poly, deep blue night palette with warm accents, soft shadows --ar 16:9
```

### 2.3 Nhân vật (third-person gameplay)

**Tưới cà chua — nâng cấp từ prompt gốc**
```
Third-person over-the-shoulder gameplay view of a cute stylized farmer character watering tomato plants,
holding a wooden-handled watering can, water sparkles catching sunlight, neat grid of 4x6 vegetable plots,
wooden fence and barn in background, bright sunny morning, stylized low-poly 3D, chibi-lite proportions,
Ghibli-inspired warm colors, soft shadows, volumetric light rays, Octane Render, Unreal Engine 5,
cinematic game screenshot --ar 16:9 --stylize 300
```

**Thu hoạch bí ngô**
```
Third-person gameplay screenshot of a cute farmer picking a ripe orange pumpkin, pumpkins scattered in the field,
autumn leaves drifting, warm golden hour backlight, stylized low-poly 3D, faceted geometry, soft shadows,
cozy wholesome mood, Octane Render, Unreal Engine 5 --ar 16:9
```

**Dắt chó đi dạo trong làng**
```
Third-person gameplay view of a cute farmer walking a corgi along a cobblestone village path,
cottages with flower boxes, villagers chatting, market stalls with fruit crates,
afternoon sunlight, stylized low-poly 3D, warm inviting colors, soft shadows, Unreal Engine 5 --ar 16:9
```

### 2.4 Cận cảnh cây trồng 4 giai đoạn (dùng làm reference cho 3D Artist)

```
Sprite-sheet style concept: four growth stages of a tomato plant shown left to right,
1) tiny seed mound in dark soil, 2) two-leaf sprout, 3) full leafy plant with small green fruits,
4) ripe plant heavy with bright red tomatoes, each stage on a small square of farmland,
stylized low-poly 3D, faceted, vibrant green and red palette, soft shadows,
clean white background, game asset turnaround --ar 21:9
```
> Với Midjourney: gõ `--ar 21:9 --style raw`, sau đó dùng **Vary (Region)** để tách từng giai đoạn thành asset riêng.

### 2.5 Gia súc (turnaround 4 hướng để dựng model)

```
Character turnaround sheet, cute stylized low-poly 3D cow with white and brown spots,
front view, side view, back view, three-quarter view, neutral T-pose, big friendly eyes,
clean flat lighting, white background, game asset reference, Blender render --ar 16:9
```
```
Character turnaround sheet, cute stylized low-poly 3D golden chicken, front, side, back, 3/4 view,
warm cream and honey gold feathers, tiny red comb, clean flat lighting, white background,
game asset reference --ar 16:9
```

### 2.6 Công trình & nội thất

```
Isometric 3D stylized low-poly chicken coop with three upgrade tiers shown side by side,
level 1 small wooden hut, level 2 with fenced yard and lamp, level 3 large barn-style with red roof and weathervane,
openable door, straw nest visible, tidy farmland base, soft shadows, Blender render --ar 16:9
```
```
3D stylized low-poly cozy farmhouse interior, warm wooden kitchen with hanging copper pots,
small fireplace, checked curtains, wooden table with fresh bread and tomatoes, soft afternoon light through window,
isometric cutaway view, warm cozy palette, Blender Cycles render, Unreal Engine 5 --ar 16:9
```

### 2.7 Công cụ & trang phục (asset sheet)

```
Game asset sheet, four stylized low-poly 3D farm tools arranged in a row on clean white background:
hoe with wooden handle, shiny metal watering can, sickle, orange hand-held harvester machine,
faceted geometry, vibrant clean materials, soft shadows, Blender render --ar 21:9
```
```
3D stylized low-poly character outfit sheet: farmer overalls, yellow raincoat with boots,
winter puffer coat with scarf, festival kimono, wedding outfit,
displayed on mannequins in a row, clean background, soft lighting, game asset reference --ar 21:9
```

### 2.8 UI / HUD

```
Game UI design sheet for a cozy 3D farming game, wooden and parchment texture panels,
circular badge item icons for tomato, corn, pumpkin, milk, egg, honey,
rounded 12px corners, hand-drawn friendly look, warm cream and sage green palette,
Nunito-style rounded typography placeholder, HUD mockup with clock, season wheel, hotbar,
clean layout, high detail --ar 16:9
```

### 2.9 Bìa & Poster (store page)

```
Key art poster for a cozy 3D farming game, cute farmer standing on a small hill overlooking a valley farm
at golden hour, diverse villagers waving from the village below, four seasons blended across the landscape,
stylized low-poly 3D, warm cinematic lighting, Ghibli inspired, epic but wholesome,
vertical steam capsule composition with title space at top --ar 3:4 --stylize 400
```

---

## 3. PROMPT TEMPLATE "SẢN XUẤT HÀNG LOẠT" (khớp với bảng asset ở `03-Asset-3D-Spec.md`)

Dùng công thức sau để tự sinh prompt cho **từng asset** trong bảng đặc tả:

```
[CAMERA] + [TÊN ASSET + mô tả vật liệu/màu] + [BỐI CẢNH/ NỀN] + [STYLE TOKENS] + [ÁNH SÁNG] + [THAM SỐ]
```

| Thành phần | Lựa chọn |
|---|---|
| **CAMERA** | `Isometric view` (công trình) · `Character turnaround sheet` (động vật/nhân vật) · `Third-person gameplay screenshot` (cảnh chơi) · `Asset sheet on white background` (công cụ, icon 3D) · `Macro close-up` (nông sản, chi tiết) |
| **TÊN ASSET** | Lấy đúng tên trong bảng đặc tả, ví dụ: `cute stylized low-poly 3D golden chicken coop with openable door` |
| **NỀN** | `clean white background` (asset) · `tidy farmland with 2x2 grid plots` (in-game) · `soft gradient studio backdrop` (turnaround) |
| **ÁNH SÁNG** | `soft morning light` · `bright noon sun` · `golden hour backlight` · `blue-hour with warm lamp glow` · `flat studio lighting` (asset sheet) |
| **THAM SỐ** | Midjourney: `--ar 16:9 --stylize 250 --v 6.1`; SDXL: `steps 30, CFG 6, sampler DPM++ 2M Karras, 1024×1024`; DALL·E 3: viết câu tự nhiên, bỏ `--` |

### Ví dụ sinh tự động

| Asset | Prompt sinh ra |
|---|---|
| `PROP_Mill_Windmill` | `Isometric view of a stylized low-poly 3D wooden windmill with rotating blades, tidy farmland with 2x2 grid plots, STYLE TOKENS, warm afternoon sunlight --ar 16:9 --stylize 250` |
| `ANI_Duck` | `Character turnaround sheet, cute stylized low-poly 3D duck, front/side/back/3-4 views, clean white background, flat studio lighting --ar 16:9` |
| `CROP_Pumpkin_Stage04` | `Macro close-up of a stylized low-poly 3D ripe orange pumpkin with faceted surface, on dark tilled soil, soft morning light --ar 1:1` |
| `TOOL_Hoe_Gold` | `Asset sheet on white background, stylized low-poly 3D golden hoe with wooden handle, faceted geometry, soft shadows --ar 1:1` |

---

## 4. GIỮ TÍNH NHẤT QUÁN GIỮA NHIỀU ẢNH (workflow chuyên nghiệp)

| Công cụ | Kỹ thuật |
|---|---|
| **Midjourney** | Dùng `--sref <url ảnh chuẩn>` (style reference) cho mọi prompt; `--cref <url nhân vật>` để giữ mặt/trang phục nhân vật; `--seed 12345` để tái lập; `--no` cho negative |
| **Stable Diffusion / Flux** | Dùng **ControlNet** (depth/canny) trên blockout 3D đơn giản; **IP-Adapter** để giữ style; **LoRA** style riêng train từ 20–30 ảnh chuẩn của dự án |
| **DALL·E 3 / ChatGPT Images** | Viết mô tả theo câu tự nhiên, luôn nhắc lại "cùng phong cách stylized low-poly 3D, bảng màu ấm như ảnh trước" |
| **Quy trình chuẩn của dự án** | 1) Tạo 1 ảnh "master style" → 2) tạo 8 ảnh biến thể → 3) chọn 1 → 4) **blockout trong Blender** → 5) render lại 3D thật làm reference phụ → 6) mới dựng model production |

> ⚠️ **Lưu ý pháp lý & sản xuất:** ảnh AI chỉ dùng làm **concept/reference**. Mọi asset đưa vào game phải là model 3D do artist dựng tay (hoặc asset mua có license thương mại), không ship trực tiếp ảnh AI vào game.

---

## 5. CHECKLIST CHẤT LƯỢNG ẢNH CONCEPT TRƯỚC KHI DUYỆT

- [ ] Đúng 1 trong 4 bảng màu mùa (Xuân/Hạ/Thu/Đông) — không pha trộn lung tung.
- [ ] Silhouette rõ ràng khi zoom out 25% (test khả năng đọc hình).
- [ ] Có "điểm ấm" (một nguồn sáng vàng cam) dù cảnh lạnh/mưa.
- [ ] Không có chi tiết gây nhiễu (ống khói lạ, cột điện, biển quảng cáo hiện đại).
- [ ] Tỉ lệ nhân vật chibi-lite: đầu ≈ 1/4.5 chiều cao, tay chân ngắn, mắt to tròn.
- [ ] Nếu là asset sheet: nền trắng sạch, cùng góc nhìn, cùng tỉ lệ giữa các asset.
