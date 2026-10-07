# Ảnh concept art mẫu — *Vườn Mơ*

Hai ảnh dưới đây được sinh **trực tiếp từ 2 prompt gốc** trong yêu cầu (đã thêm style token ở `docs/04-Concept-Art-Prompts.md` mục 2 để bám đúng phong cách dự án).
Dùng chúng làm **reference board** cho 3D Artist hoặc làm ảnh `--sref` trong Midjourney.

---

## 1. `concept-01-farm-isometric.png` — Bối cảnh trang trại tổng thể

**Prompt đã dùng:**
```
3D stylized cozy farm concept art, isometric view of a small valley farm, vibrant colorful crops
in neat 2x2 grid plots (tomatoes, corn, pumpkins), wooden barn with red roof, small pond reflecting the sky,
windmill, dirt path, cherry blossom tree, warm morning sunlight with soft long shadows, clean low-poly faceted models,
matte clay-and-wood materials, subtle warm brown outline, Studio Ghibli inspired warm color palette,
Blender Cycles render style, Unreal Engine 5, highly detailed, wide 16:9 composition
```

**Kiểm chứng theo checklist GDD §2:**
- ✅ Lưới ruộng 2×2 m đọc rõ (dùng làm reference cho `TERRAIN_FarmTile_Base`)
- ✅ Có "điểm ấm" (nắng vàng buổi sáng) trên nền mát
- ✅ Silhouette rõ: cối xay gió, chuồng đỏ, cây anh đào, hồ nhỏ
- ✅ Tỉ lệ diorama: mọi thứ nằm trong một "hộp cảnh" dễ đọc

**Dùng cho:** ảnh store page nháp, reference layout làng, tham chiếu bảng màu mùa Xuân.

---

## 2. `concept-02-character-watering.png` — Góc nhìn third-person khi làm nông

**Prompt đã dùng:**
```
Third-person over-the-shoulder gameplay view of a cute stylized low-poly farmer character watering
tomato plants with a wooden-handled watering can in a vibrant 3D farm, water sparkles catching sunlight,
neat grid of vegetable plots, wooden fence and barn in the background, stylized 3D graphics, faceted low-poly models,
chibi-lite proportions, bright sunny day, Studio Ghibli inspired colors, soft shadows, volumetric light rays,
cinematic game screenshot, rendered in Octane Render, wide 16:9 composition
```

**Kiểm chứng:**
- ✅ Đúng khung hình third-person (nhân vật chiếm 1/3 khung, camera sau-vai phải)
- ✅ Cây cà chua có **cọc giàn** — khớp asset `PROP_Trellis_01` trong bảng đặc tả
- ✅ Nước bắn lấp lánh = VFX `Water_Pour` + particle sáng khi trời nắng (xem GDD §7.2)
- ✅ Nhân vật tỉ lệ chibi-lite, đội mũ rơm — khớp `ACC_Hat` và `CHAR_Player_Base`
- ⚠️ Ảnh có thêm HUD (tim + thanh nước) — khi dựng model thật **bỏ HUD**, thanh nước chỉ là UI overlay

**Dùng cho:** reference cho `CHAR_Player_Base`, `TOOL_WateringCan`, camera gameplay, mood ánh sáng ban ngày.

---

## Sinh tiếp ảnh cho mùa khác (chạy ngay)

Copy 1 trong các prompt ở `docs/04-Concept-Art-Prompts.md` mục 2.1 (Xuân/Hạ/Thu/Đông) hoặc 2.2 (mưa/đêm),
giữ nguyên phần `STYLE TOKENS`, rồi thêm cờ giữ phong cách của Midjourney:

```
--sref art/concept-01-farm-isometric.png --sw 60 --stylize 250 --ar 16:9
```

> `--sref` = style reference (giữ phong cách), `--sw` = độ mạnh tham chiếu style (0–100), `--seed` = tái lập kết quả.

## Lưu ý sử dụng
Ảnh AI **chỉ dùng làm concept/reference nội bộ**. Asset đưa vào game phải do artist dựng tay trong Blender/Maya
(hoặc asset mua có license thương mại) — không ship trực tiếp ảnh AI vào sản phẩm.
