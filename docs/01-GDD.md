# GAME DESIGN DOCUMENT (GDD)
## Dự án: **VƯỜN MƠ** (*Harvest Hearth*) — Cozy 2D Pixel Farm Life Sim

| Thông tin | Chi tiết |
|---|---|
| **Tên dự án** | Vườn Mơ / Harvest Hearth |
| **Thể loại** | Cozy Life-Sim + Farming Sim + Social Sim |
| **Góc nhìn** | **2D Top-down pixel art** (nhìn từ trên xuống kiểu Stardew Valley / Harvest Moon) |
| **Engine** | Unity 6 LTS — **2D (URP 2D Renderer hoặc Built-in 2D)** · Tilemap + Sprite Atlas |
| **Độ phân giải nội bộ** | **320×180 pixel** (upscale nguyên ×6 = 1920×1080, ×4 = 1280×720) |
| **Kích thước 1 tile** | **16×16 pixel** = **1 world unit** (Pixels Per Unit = 16) |
| **Nền tảng** | PC (Steam) → Nintendo Switch → Mobile (port sau) |
| **Số người chơi** | 1 (co-op 2–4 post-launch, kiến trúc chừa sẵn) |
| **Đối tượng** | 12–45 tuổi, fan Stardew Valley / Harvest Moon / Animal Crossing |
| **Xếp hạng** | ESRB E / PEGI 3 |
| **Thời lượng phiên** | 20–60 phút · 1 mùa in-game ≈ 7.5 giờ thực |
| **Thời gian phát triển** | 15 tháng (5 sprint lớn) — xem §15 |
| **Ngôn ngữ** | VI, EN, JP, ZH, KR, ES, PT-BR, FR |

**USP:**
1. **Pixel ấm (Cozy Pixels)** — palette giới hạn 48 màu theo 4 mùa, đổ bóng bằng dithering thủ công, không có pixel "bẩn" lẫn màu hiện đại.
2. **Living Grid** — ô đất sống: độ ẩm, dinh dưỡng, cỏ dại, ký ức vụ mùa, hiển thị bằng **4 biến thể tile** (cỏ / đất cuốc / đất tưới sẫm / cỏ dại).
3. **Seamless Season Shift** — chuyển mùa trong 6 giây: tile toàn bản đồ đổi màu + lá/hoa rơi + nhạc chuyển, **không có loading screen**.
4. **Không áp lực** — thất bại chỉ là mất vụ, không mất save; không combat.

---

## 1. TẦM NHÌN & TRỤ CỘT THIẾT KẾ

| # | Trụ cột | Ý nghĩa | Kiểm chứng |
|---|---|---|---|
| P1 | **Ấm cúng** | Không timer gây căng, nhạc chiptune nhẹ, nhịp chậm | Người chơi ngồi ngắm cảnh 5 phút không bị phạt |
| P2 | **Nhịp thiên nhiên** | Mùa & thời tiết quyết định nên trồng gì | Mỗi mùa có ≥1 cây & 1 sự kiện độc quyền |
| P3 | **Của tôi / Của chúng ta** | Trang trại & quan hệ do người chơi dựng | Không có "đúng/sai", chỉ có lựa chọn thẩm mỹ |
| P4 | **Mọi hành động đều có phản hồi** | Mỗi tương tác có SFX + khung hình animation + hạt bụi/lá | 100% tương tác có 3 lớp phản hồi |
| P5 | **Pixel sạch** | Không anti-aliasing, không scale lẻ, không pixel rung | Test: chụp ảnh 100%, mọi pixel nằm đúng lưới |

---

## 2. PHONG CÁCH ĐỒ HỌA PIXEL (VISUAL STYLE)

### 2.1 Thông số kỹ thuật nền tảng

| Thuộc tính | Đặc tả |
|---|---|
| **Phong cách** | Pixel art 16-bit cao cấp ("modern retro"): viền tối 1 px màu nâu tím `#3B2A33` (KHÔNG dùng đen tuyệt đối), đổ bóng 2 tông kèm dithering 50% |
| **Độ phân giải sprite cơ bản** | Nhân vật 16×24 px · cây trồng 16×16 (cây leo/ngô 16×32) · công trình 32×32 → 96×96 · túi đồ icon 16×16 |
| **Tile** | 16×16 px. Bản đồ dùng **Tilemap** + **Rule Tile** (tự nối viền cỏ/đường/nước) |
| **Palette** | **48 màu tổng**, chia 4 nhóm mùa (mỗi mùa 12 màu chủ đạo + 6 màu dùng chung cho UI/nhân vật) |
| **Dithering** | Checkerboard 50% cho chuyển sáng-tối, Bayer 4×4 cho bóng cây |
| **Chống rung** | Pixel Perfect Camera (`PPU = 16`, `Reference Resolution 320×180`, `Upscale Render Texture = ON`, `Pixel Snapping = ON`) |
| **Camera** | Orthographic, follow nhân vật có dead-zone 2×2 tile, không xoay. Zoom 2 mức: gần (250×140 px vùng nhìn) và xa (400×225) |
| **Animation** | Nhân vật: 4 hướng × (Idle 2 khung, Walk 4 khung, Run 6 khung, Tool 4 khung) @ 8 fps · Nước/lửa/đèn: 3–4 khung @ 6–8 fps · Cây: 1 sprite/giai đoạn + 2 khung nhấp nháy khi chín |
| **Bóng đổ** | Ellipse 12×5 px, alpha 35%, KHÔNG đổ bóng realtime |
| **Ánh sáng** | Chỉ dùng **lớp phủ màu toàn màn hình** (không dùng ánh sáng động) + điểm sáng giả cho đèn lồng/đom đóm |
| **UI** | Bitmap font 8×8 (hỗ trợ tiếng Việt có dấu — dùng font "Pixel Operator"/"Silkscreen" + bộ dấu vẽ tay), khung gỗ 9-slice 24×24 px |
| **Giới hạn màn hình** | Tối đa ~400 sprite động cùng lúc; ngoài vùng nhìn → tắt (culling) |

### 2.2 Bảng màu theo mùa (Color Script)

| Mùa | Trời / nền | Cỏ (3 tông) | Đất | Nước | Accent |
|---|---|---|---|---|---|
| **Xuân** | `#7EC0EE` / `#B8E0F0` | `#8FD06B` `#6FBF57` `#4E9A45` | `#8A5F33` `#6E4726` | `#4FA8D8` `#7FD3E8` | Hồng đào `#F7A8B8` |
| **Hạ** | `#5FB8F0` / `#9FE0FF` | `#6FBF57` `#57A845` `#3E8036` | `#8A5F33` `#6E4726` | `#4FA8D8` `#9FE8F5` | Vàng nắng `#FFD34E` |
| **Thu** | `#C9D6E8` / `#E8D9C0` | `#C99A4E` `#A87B3C` `#8A6330` | `#7A5230` `#5E3E24` | `#8FA6A8` `#A8BFC0` | Cam bí `#E5762C` |
| **Đông** | `#C6D6E4` / `#EAF2F8` | `#F2F7FB` `#D6E4F0` `#B8CCDE` | `#4A3B33` `#3A2E28` | `#BFE3EE` `#D8F0F8` | Xanh lạnh `#7C9CC4` |

**Quy tắc phối màu:**
- Mỗi sprite chỉ dùng **tối đa 8 màu** (kể cả viền) → dễ đọc ở 320×180.
- Vùng tối của màu nào thì **dịch hue về phía tím/xanh** (không chỉ giảm sáng) — đây là "chìa khoá" để pixel art trông ấm mà không bị bùn.
- Tương phản giá trị (value) tối thiểu 20% giữa lớp nền và lớp vật thể để nhân vật luôn nổi bật.

### 2.3 Ánh sáng ngày/đêm (lớp phủ)

| Khung giờ | Lớp phủ (overlay) | Gameplay ảnh hưởng |
|---|---|---|
| 05:00–07:00 Bình minh | `#FFE9B8` alpha 8% | Sương mù giảm tầm nhìn (overlay xám 12%) |
| 07:00–11:00 Sáng | Alpha 0% | Shop mở, NPC ra đường |
| 11:00–17:00 Trưa | Alpha 0%, cộng nhẹ vàng 4% | Tốc chạy bình thường |
| 17:00–20:00 Hoàng hôn | `#FFB066` alpha 20% | Đom đóm xuất hiện, cá quý tăng tỉ lệ |
| 20:00–23:00 Tối | `#26396E` alpha 55% | Đèn lồng bật, phần lớn shop đóng |
| 23:00–02:00 Khuya | `#16204A` alpha 68% | NPC về nhà, chỉ còn câu cá đêm |
| 02:00 | Auto-sleep → bảng tổng kết ngày | — |

> Thức sau 24:00 **không bị phạt tiền**; chỉ mất buff "Ngủ đủ giấc" (+5% chất lượng nông sản hôm sau).

---

## 3. VÒNG LẶP GAMEPLAY CHÍNH (CORE LOOP)

| Vòng lặp | Thời lượng | Hành động | Phần thưởng |
|---|---|---|---|
| **Micro** | 5–30 giây | Đi tới ô đất → cuốc/tưới/thu hoạch → nhặt loot → xem chữ "+3" bay lên | +nông sản, +XP |
| **Meso** | 1 ngày game (~16 phút thực) | Tưới cây, cho gia súc ăn, hái trứng/sữa, nói chuyện NPC, mua bán | Tiền, tim NPC, hạt mới |
| **Macro** | 1 mùa (28 ngày ≈ 7.5 giờ) | Gieo vụ mùa, xây chuồng, mở công trình, quest cộng đồng | Mở vùng mới, công thức mới |
| **Meta** | 1 năm (4 mùa ≈ 30 giờ) | Cải tạo trang trại, kết bạn/kết hôn, hoàn thành lễ hội năm | Ending mùa nở hoa + New Game+ |

```
┌──────────────── VÒNG LẶP MỘT NGÀY ────────────────┐
│ 1. Thức dậy → bảng tổng kết ngày                  │
│ 2. Xem thời tiết & mùa (góc phải HUD)             │
│ 3. Ra ruộng: CUỐC → GIEO → TƯỚI → BÓN PHÂN        │
│ 4. Chăn nuôi: cho ăn → vuốt ve → thu trứng/sữa    │
│ 5. THU HOẠCH (cây chín nhấp nháy) → nhặt loot     │
│ 6. CHẾ BIẾN (bếp/xưởng)                           │
│ 7. BÁN ở chợ / giao hàng / thùng vận chuyển       │
│ 8. XÃ HỘI: tặng quà, quest, lễ hội                │
│ 9. MỞ RỘNG: mua đất, xây chuồng, nâng cấp         │
│ 10. Ngủ (tự lưu) → NGÀY MỚI                       │
└───────────────────────────────────────────────────┘
```

### "Câu chuyện 30 phút đầu"

| Phút | Trải nghiệm |
|---|---|
| 0–2 | Cutscene pixel: xe tải chở người chơi tới thung lũng; ông ngoại để lại mảnh đất + cuốc + bình tưới + 3 hạt cà chua |
| 2–5 | Dạy WASD di chuyển (8 hướng), phím **E** tương tác — đúng "ô trước mặt" có khung nhấp nháy chỉ ô đang nhắm |
| 5–10 | Cuốc → gieo → tưới. Cây cà chua đầu tiên mọc chỉ sau 1 ngày game (fast-track để tạo dopamine) |
| 10–15 | Gặp **bà Hòa**, nhận 20G + 5 hạt cải, mở shop |
| 15–25 | Thu hoạch đầu tiên → bán 35G → mua hạt mới → dạy "ngủ để lưu" |
| 25–30 | Ngày 2: mưa → dạy "mưa tưới miễn phí" → mở bản đồ + mở hầm mỏ |

---

## 4. HỆ THỐNG TRỒNG TRỌT (FARMING)

### 4.1 Chu kỳ sinh trưởng — 4 giai đoạn = 4 SPRITE

| Giai đoạn | Sprite | Biểu hiện pixel | Điều kiện chuyển tiếp |
|---|---|---|---|
| **GĐ1 Seed** | `crop_seed` (16×16: 3 hạt nhô khỏi đất) | Đất có 3 chấm sẫm | Cần ≥1 ngày có nước |
| **GĐ2 Sprout** | `crop_sprout` (2 lá mầm, 8–12 px cao) | Lay nhẹ theo gió (2 khung, 2 fps) | Cần N ngày có nước |
| **GĐ3 Mature** | `crop_adult` (thân + tán lá) | Có quả non xanh nhạt | Cần M ngày có nước |
| **GĐ4 Fruiting** | `crop_ripe` (quả đổi màu accent) | **Nhấp nháy `crop_glow` 2 khung @ 1.6 Hz** + icon ❗ trên đầu | Người chơi bấm **E** |

Sau thu hoạch: cây **Regrow** (cà chua, dâu, ớt) → về GĐ3 rồi đếm lại; cây **Single-harvest** (củ cải, bí, lúa) → biến mất, ô đất còn lại "dư lượng" (nutrient −5%).

### 4.2 Cây trồng khởi đầu (cân bằng)

| Cây | Mùa | Ngày mỗi GĐ | Tổng ngày | Regrow | Nước/ngày | Bán gốc | Bán chế biến | Hạt |
|---|---|---|---|---|---|---|---|---|
| Củ cải | Xuân | 1/1/1 | 3 | ✖ | 1 | 35G | 120G | 20G |
| Khoai tây | Xuân | 1/2/2 | 5 | ✖ | 1 | 60G | 190G | 50G |
| **Cà chua** | Hạ | 1/2/3 | 6 | ✔ 2 ngày | 1 | 55G | 210G | 45G |
| Ngô | Hạ | 2/3/4 | 9 | ✔ 3 ngày | 2 | 80G | 300G | 70G |
| Bí ngô | Thu | 2/4/4 | 10 | ✖ | 2 | 200G | 620G | 130G |
| Nho | Thu | 2/3/5 | 10 | ✔ 4 ngày | 2 | 110G | 380G | 100G |
| Bông tuyết | Đông | 3/4/3 | 10 | ✔ 5 ngày | 1 (nhà kính) | 150G | 450G | 180G |
| Lúa nước | Hạ | 2/3/5 | 10 | ✖ | 3 (ngập) | 95G | 340G | 60G |

```
Tổng ngày chín = Σ daysPerStage
Mỗi ngày chỉ +1 "ngày ẩm" nếu: đất ẩm ≥ 30% HOẶC mưa/bão HOẶC vừa tưới
Khô > 2 ngày liên tiếp → Withering (héo, cứu được)
Khô > 5 ngày liên tiếp → Dead (chỉ cuốc bỏ, mất hạt)
```

### 4.3 Chất lượng nông sản

| Hạng | Điều kiện | Giá | Sprite loot |
|---|---|---|---|
| Thường | Mặc định | ×1.0 | `item_x` |
| Bạc ★ | Bón phân cơ bản + tưới đủ | ×1.25 | `item_x_silver` (viền xám sáng) |
| Vàng ★★ | Phân hữu cơ + đất ≥80% dinh dưỡng | ×1.5 | `item_x_gold` (viền vàng + hạt sáng 2 khung) |
| Cầu vồng ★★★ | Mưa-nắng xen kẽ + buff ngủ + may mắn | ×2.0 | `item_x_rainbow` (2 khung, đổi màu hue-shift) |

### 4.4 Cơ chế đất (Soil)

| Chỉ số | Giá trị | Ảnh hưởng | Hiển thị |
|---|---|---|---|
| Độ ẩm | 0–100% | <30% cây ngừng lớn; tưới +40%; mưa 100% | Tile tưới sẫm màu hơn + vài giọt nước 2 khung |
| Dinh dưỡng | 0–100% | −5%/vụ; phân +30%; ảnh hưởng phẩm chất | Không hiện (xem ở UI khi đứng trên ô) |
| Cỏ dại | 0–3 | −15% tốc độ lớn/cấp | Sprite cỏ dại trên lớp decor |
| Sâu bệnh | Có/Không | Giảm chất lượng 1 bậc | Sprite con bọ 2 khung |
| Ký ức vụ mùa | 2 vụ trước | Luân canh khác họ → +10% tốc độ & chất lượng | Icon nhỏ ở UI ô đất |

---

## 5. HỆ THỐNG CHĂN NUÔI (ANIMALS)

| Vật nuôi | Chuồng | Mua | Thức ăn | Sản phẩm | Chu kỳ | Sprite |
|---|---|---|---|---|---|---|
| Gà | Coop | 400G | Hạt, cỏ | Trứng → Trứng vàng | 1/ngày | 16×16, 4 hướng + mổ/Eat |
| Vịt | Coop | 800G | Ngũ cốc | Trứng vịt → Lông | 1/2 ngày | Thêm khung bơi trên nước |
| Bò | Barn | 1.500G | Cỏ khô | Sữa → Phô mai | 1/ngày | 24×32, nhai cỏ 4 khung |
| Dê | Barn | 1.200G | Cỏ | Sữa dê | 1/2 ngày | 20×24 |
| Cừu | Barn | 1.000G | Cỏ | Len → Vải | 1/5 ngày | **2 phiên bản sprite: có lông / đã cắt** |
| Ong | Bee House | 250G | Hoa gần đó | Mật → Tổ ong | 1/4 ngày | Hạt vàng bay vòng (8 khung) |
| Mèo/Chó | Nhà | 300G | Hạt thú cưng | +1 may mắn/ngày | 1/ngày | 16×16, ngồi/ngủ/đuôi vẫy |

**Cơ chế chung:** đói tăng 25%/ngày; đói → tụt tim 5%/ngày; ≥♥8 → biến thể sản phẩm quý. Mùa Đông cần lò sưởi trong chuồng (500G, giảm 50% sụt tim). Gia súc ra ngoài ban ngày theo đường đi tự do (đơn giản: lang thang trong bán kính 5 tile quanh chuồng), tự về khi trời mưa/bão/tuyết.

---

## 6. CHẾ BIẾN & CHẾ TÁC (CRAFTING)

| Trạm | Mở khóa | Công thức mẫu | Thời gian | Vào → Ra |
|---|---|---|---|---|
| Bếp | Nâng nhà 1 (10.000G) | Sốt cà, Bắp rang, Bánh bí, Trà tuyết | 1–3 giờ game | 1 Cà chua → 1 Sốt cà |
| Xưởng chế biến | 5.000G | Phô mai, Bơ, Rượu nho, Rượu gạo | 4–12 giờ | 1 Sữa → 1 Phô mai |
| Máy dệt | 3.000G | Vải từ Len | 3 giờ | 1 Len → 1 Vải |
| Máy ép dầu | 2.500G | Dầu, Nước hoa, Xà phòng | 6 giờ | 5 Hoa → 1 Nước hoa |
| Xưởng mộc | 4.000G | Hàng rào, Cầu, Nội thất | 8 giờ | 10 Gỗ + 5 Đá |
| Máy ủ | 2.000G | Mứt, Rượu, Nước ép | 24 giờ | 1 quả → 1 mứt |

Định luật cân bằng: **chế biến cho ×1.5–×5 giá gốc**, đổi lại tốn thời gian trong ngày game → tạo động lực quay lại mỗi sáng.

---

## 7. HỆ THỐNG TƯƠNG TÁC 2D & GRID

### 7.1 Di chuyển nhân vật (top-down 8 hướng, sprite 4 hướng)

| Hành động | Input | Thông số |
|---|---|---|
| Đi bộ | WASD / Left Stick | 4.5 tile/giây (≈ 4.5 world unit/s) |
| Chạy | Shift / L3 | 6.8 tile/giây |
| Nhảy | — | **Không có nhảy** (2D top-down không cần) |
| Tương tác | **E** / Ⓐ | Nhắm **ô lưới ngay trước mặt** (không dùng chuột) |
| Đổi công cụ | 1–6, 8 / D-Pad | Hotbar 8 ô dưới màn hình |
| Túi đồ | Tab / Start | 48 ô → mở rộng 96 |
| Bản đồ | M / Back | Minimap góc trên-trái (madness 32×32 px) |
| Pause | Esc | Dừng thời gian game |
| Chụp ảnh | P | Giấu HUD, giữ nguyên pixel |

**Animation nhân vật:** Idle (2 khung, 4 hướng) · Walk (4 khung, 4 hướng, 8 fps) · Run (6 khung) · Watering (4 khung) · Hoe (4 khung) · Harvest (3 khung) · Fish (8 khung) · Sit (2 khung) · Sleep (2 khung) — **tổng 46 sprite sheet frame**.

### 7.2 Công cụ & tương tác theo ô lưới

| Công cụ | Phím | Hiệu ứng | Vùng tác dụng |
|---|---|---|---|
| Cuốc | 1 | Vung 4 khung, hạt đất bắn 3 px | 1 ô trước mặt |
| Bình tưới | 2 | Nghiêng bình, giọt nước 3 khung, cầu vồng mini khi nắng | 1 ô (nâng cấp: 3×3) |
| Liềm | 3 | Gạt ngang | 1 ô (cắt cỏ, thu hoạch cây hạt) |
| Rìu | 4 | 2 khung luân phiên | 1 ô (cây, gốc, hàng rào) |
| Cuốc chim | 5 | Vung mạnh | Đá, quặng trong mỏ |
| Cần câu | 6 | Cast → minigame thanh lực 8-bit | Vùng nước gần nhất |
| Túi hạt | 8/Q | Quỳ gieo, 3 khung | 1 ô đất đã cuốc |
| Máy gặt ⭐ | mua 20.000G | Lái, thu 2×1 ô/lần | Hàng loạt, tốn xăng |
| Máy cày ⭐ | 45.000G | Xới + gieo hàng loạt | 10×10 ô theo lộ trình |

### 7.3 Grid System 2D

| Thông số | Giá trị |
|---|---|
| Kích thước ô | **1 × 1 world unit** = 16×16 px = 1 tile |
| Bản đồ | Tối đa **200×200 ô** (3.200×3.200 px), chia 4 khu vực để culling |
| Tilemap layer | `Ground` (cỏ/đường/nước) · `Soil` (đất nông nghiệp) · `Decor` (cỏ dại, hoa, vật rơi) · `Building` · `Collision` |
| Rule Tile | Cỏ, đường đất, nước, bờ biển tự nối viền |
| Đặt công trình | Snap theo ô, footprint N×M (Barn 3×4 ô), preview **xanh lá 60% alpha / đỏ 60% alpha** |
| Va chạm | BoxCollider2D trên layer `Collision` + `CompositeCollider2D` gộp lại (giảm số collider) |
| Y-sorting | `sortingOrder = -round(y × 100)` để nhân vật đi sau cây bị che đúng |

---

## 8. HỆ THỐNG THỜI TIẾT & MÙA

### 8.1 Bảng mùa

| Mùa | Ngày | Màu chủ đạo | Cây trồng được | Sự kiện |
|---|---|---|---|---|
| Xuân | 1–28 | Xanh non, hồng | Củ cải, Khoai tây, Dâu, Hành | Lễ Hoa Nở (13) |
| Hạ | 29–56 | Xanh đậm, vàng | Cà chua, Ngô, Lúa, Dưa hấu | Hội Chợ Biển (40) |
| Thu | 57–84 | Cam, nâu gạch | Bí ngô, Nho, Cà rốt, Táo | Lễ Đèn Lồng (70) |
| Đông | 85–112 | Trắng, xanh lạnh | Bông tuyết, cải nhà kính | Lễ Tri Ân (98) |

**Cách đổi mùa (không loading):** đổi `SeasonTheme` → tilemap đổi tile cỏ → particles (hoa anh đào/lá vàng/tuyết) → nhạc → overlay tint. Toàn bộ trong **6 giây**.

### 8.2 Thời tiết & ảnh hưởng

| Thời tiết | Tỉ lệ | Cây trồng | Gia súc | Người chơi | Hình ảnh pixel |
|---|---|---|---|---|---|
| **Nắng** | 45% | +5% tốc độ lớn | Ra ngoài, +5% tim | Bình thường | Overlay vàng nhẹ 4%, đom đóm ban đêm |
| **Nhiều mây** | 20% | Bình thường | Bình thường | Bình thường | Overlay xám 6% |
| **Mưa** | 18% | **Tự tưới 100%**, +10% tốc | Bò/vịt +1 sản phẩm; gà −2 tim | −8% tốc chạy | Hạt mưa 3 khung + gợn nước 4 khung trên ô đất |
| **Bão** | 5% | **10% cây gãy** | Không ra ngoài, −5 tim nếu chuồng chưa nâng | Cấm câu cá | Mưa xiên + lá bay + **sét nháy trắng 2 khung** + camera rung 1.5 px |
| **Tuyết** | 10% (Đông) | Cây ngoài trời chết (trừ Bông tuyết); nhà kính an toàn | Cần lò sưởi; −25% sản phẩm nếu thiếu | −12% tốc chạy | Tuyết 3 khung + hơi thở nhân vật |
| **Sương mù** | 2% | +20% sâu bệnh | Bình thường | Overlay xám 25%, tầm nhìn giảm | Lớp sương 2 lớp trôi chậm |
| **Cầu vồng** | sau mưa | +1 bậc phẩm chất mọi cây hái trong ngày | +1 tim khi vuốt ve | ×2 may mắn | Cầu vồng 7 màu 4 khung trên trời |
| **Mưa sao băng** | 1% (Hạ/Thu) | — | — | Điều ước: buff ngẫu nhiên 1 ngày | Sao rơi 4 khung, nền tối hơn 10% |

**Kiến trúc code:** `WeatherSystem` sinh dự báo 3 ngày, phát `OnWeatherChanged`; `CropInstance`, `FarmGrid`, `WeatherFX2D`, `DayNightTint2D` subscribe — **không có `Update()` quét toàn bộ cây**.

---

## 9. NPC, CỘNG ĐỒNG & LỄ HỘI

### 9.1 Quan hệ

| Chỉ số | Thang | Tăng | Giảm | Ngưỡng |
|---|---|---|---|---|
| Tim | 0–10 (250 điểm/tim) | Nói chuyện +20/ngày; quà +50 (yêu thích +80); quest +100 | Quà ghét −40; 7 ngày không gặp −20 | ♥2 quest cá nhân · ♥4 công thức · ♥6 sự kiện · ♥8 hẹn hò · ♥10 quà đặc biệt |

### 9.2 NPC chính

| NPC | Vai trò | Tính cách | Quà yêu thích | Mở khóa |
|---|---|---|---|---|
| Bà Hòa | Tạp hóa | Ấm áp, hay kể chuyện | Trà hoa cúc, Bánh bí | Shop, hướng dẫn chợ |
| Ông Bảy | Ngư dân | Lầm lì, hài hước khô | Cá chép, Rượu gạo | Câu cá, thuyền |
| Linh | Thú y | Năng lượng cao | Sữa tươi, Trứng vàng | Chuồng, chữa gia súc |
| Minh | Kỹ sư | Nghiêm túc, mê máy móc | Phụ tùng, Đá quý | Công trình, máy móc |
| Hân | Họa sĩ | Mơ mộng | Hoa, Đá phát sáng | Photo Mode, décor |
| Bảo | Đầu bếp | Cầu toàn, nóng tính | Nấm, Cá hồi | Bếp, nhà hàng |
| Thư | Nhạc công | Dịu dàng | Nước hoa, Vải | Festival âm nhạc |
| Nam | Học sinh | Năng động, tò mò | Nước ép, Mứt | Hầm mỏ |
| Cô Tuyết | Thị trưởng | Trang trọng | Trà tuyết, Bánh mì | Mở rộng đất, quest cộng đồng |
| Người Bí Ẩn | Thảo dược | Bí hiểm | Nấm lạ, Mật ong | Rừng cổ & phép màu đất |

### 9.3 Nhiệm vụ phụ

| Loại | Ví dụ | Thời hạn | Thưởng |
|---|---|---|---|
| Giao hàng | "Mang 5 trứng tới nhà Linh trước 18:00" | 1 ngày | 200G + ♥1 |
| Nuôi trồng | "Trồng 10 cây ngô" | 1 mùa | 800G + hạt mới |
| Câu chuyện | "Tìm nhật ký ông Bảy ở bờ sông" | Không giới hạn | Bản đồ kho báu |
| Cộng đồng | "Quyên góp 5.000G xây cầu làng" | 1 mùa | Mở vùng mới |
| Chế biến | "Làm 3 Phô mai cho Bảo" | 3 ngày | Công thức bánh phô mai |
| Bí ẩn | "Chuyện gì xảy ra trong rừng lúc nửa đêm?" | Không giới hạn | Linh vật đất |

### 9.4 Lịch lễ hội

| Ngày | Lễ hội | Hoạt động | Phần thưởng |
|---|---|---|---|
| Xuân 7 | Hội Chợ Hạt Giống | Hạt rẻ 40%, đổi hạt hiếm | Hạt độc quyền |
| Xuân 13 | Lễ Hoa Nở | Thi cắm hoa, tặng hoa NPC | Trang phục hoa |
| Xuân 23 | Ngày Câu Cá Xuân | Minigame câu cá theo giờ | Cần câu nâng cấp |
| Hạ 11 | Cuộc Thi Nông Sản | Nộp nông sản chất lượng cao | Cúp vàng + 1.000G |
| Hạ 20 | Hội Chợ Biển | BBQ, câu mực đêm | Công thức hải sản |
| Hạ 26 | Đua Thuyền | Đua thuyền với NPC | Thuyền cá nhân |
| Thu 8 | Lễ Thu Hoạch | Nấu ăn chung | Công thức mùa |
| Thu 15 | Lễ Đèn Lồng | Thả đèn, nhạc sống | Trang phục + quest tình cảm |
| Thu 24 | Hội Cây Ăn Quả | Trồng cây kỷ niệm | Cây ăn quả 5 sao |
| Đông 5 | Lễ Ánh Sáng | Trang trí cây, quà bí mật | Quà cao cấp |
| Đông 12 | Đêm Sao Băng | Ngắm sao, minigame | Buff may mắn 3 ngày |
| Đông 20 | Lễ Tri Ân | Tổng kết năm | Danh hiệu |
| Đông 28 | Giao Thừa | Đếm ngược, pháo hoa pixel | Buff năm mới |

---

## 10. KINH TẾ & TIẾN TRÌNH

| Giai đoạn | Tiền kỳ vọng | Nguồn thu chính | Mở khóa |
|---|---|---|---|
| Ngày 1–14 | 0 → 3.000G | Củ cải, khoai tây | Túi 12 ô, Coop |
| Ngày 15–40 | 3.000 → 25.000G | Phô mai, mứt, cá | Barn, 24 ô, Xưởng, Mỏ |
| Ngày 41–80 | 25.000 → 120.000G | Rượu, nước hoa, hải sản quý | Nhà kính, máy cày, vùng Đông |
| Ngày 81+ | 120.000G → ∞ | Cá hiếm, nấm truffle, du lịch | Thuyền, rừng cổ, nhà thứ 2 |

**Chống lạm phát:** giá bán có trần theo catalog; bảo trì máy móc +10%/năm; bán quá nhiều cùng 1 loại trong mùa → giảm 1% giá (tối đa 15%).

---

## 11. UI / HUD PIXEL

| Thành phần | Mô tả |
|---|---|
| HUD trên-trái | Ngày + mùa + giờ + tiền (khung gỗ 9-slice) |
| HUD trên-phải | Icon thời tiết 16×16 + dự báo 3 ngày (3 icon nhỏ) |
| Hotbar dưới | 8 ô 20×20 px, ô đang chọn viền sáng vàng (nhấp nháy 2 khung) |
| Thanh nước | 20×4 px, chia 20 vạch |
| Prompt | Khung chữ "[E] Tưới nước" hiện góc dưới-giữa + **khung nhấp nháy quanh ô đang nhắm** |
| Toast | Dải chữ chạy ở đáy màn hình, nền đen 60% |
| Bản đồ | Minimap 48×48 px góc trên-phải (mở bản đồ lớn bằng M) |
| Túi đồ | Lưới 8×6 ô 20×20 px, tooltip nền da |
| Shop | 2 cột, icon + giá, nút "Bán cả" |
| Accessibility | Font 3 cỡ (8/10/12 px), chế độ không màu, tắt camera shake, tắt nhấp nháy (cho người nhạy cảm ánh sáng), auto-tưới ở chế độ assist |

---

## 12. ÂM THANH

| Lớp | Nội dung |
|---|---|
| Nhạc | 4 bản mùa + 4 bản đêm + 1 lễ hội + 1 menu — **chiptune 8-bit** (2 kênh pulse, 1 triangle, 1 noise) @ 90–110 BPM |
| Ambient | Chim, dế, suối, gió, gỗ kêu; thay theo mùa & giờ |
| SFX | Cuốc, nước, thu hoạch, bước chân 4 bề mặt (cỏ/đất/gỗ/tuyết), 6 loài gia súc ×3 trạng thái (vui/đói/buồn) |
| Định dạng | WAV 22.05 kHz mono cho SFX, OGG cho nhạc · **tổng ~180 file, 45 MB** |

---

## 13. LƯU TRỮ & NHIỀU NGƯỜI CHƠI

| Vấn đề | Giải pháp |
|---|---|
| Save | 3 khe + tự lưu khi ngủ; JSON + checksum MD5; `saveVersion` để migrate |
| Ghi gì | `TileData[]` (ô đất + cây), túi đồ, tiền, tim NPC, vị trí/hướng người chơi, thời gian, dự báo thời tiết, XP |
| Kích thước | ~120 KB/save (200×200 ô) — dùng struct + ghi gọn chỉ ô có thay đổi |
| Co-op | Host-authoritative, `Netcode for GameObjects`; đồng bộ theo event, không sync Transform cây |
| Chống bug | Tiền & ngày là `int`; thời gian là `double totalGameMinutes` (không dùng `float`) |

---

## 14. THÔNG SỐ KỸ THUẬT (TECH SPEC)

| Hạng mục | Mục tiêu |
|---|---|
| Engine | Unity 6 LTS, **2D (URP 2D Renderer)**, C# 9, New Input System |
| PPU / Resolution | PPU **16** · internal **320×180** · Pixel Perfect Camera ON |
| FPS | PC 60 fps @1080p (min spec GTX 750 Ti / iGPU, 4 GB RAM) · Switch 60 fps / 30 fps docked |
| Draw call | ≤ 200 (PC) / ≤ 150 (Switch) — nhờ **Sprite Atlas** + Tilemap gộp batch |
| Sprite động | ≤ 400 cùng lúc; ngoài camera → culling group tắt |
| Bộ nhớ sprite | ≤ 120 MB VRAM (atlas 2048², Compression None cho pixel art) |
| Tối ưu | Tilemap gộp (không dùng hàng nghìn GameObject) · Struct array cho dữ liệu ô · Object pool cho loot & particle |
| Vật lý | Chỉ dùng Collider2D cho nhân vật/NPC/công trình; **ô đất không có collider** |
| Layer | `Player` `NPC` `Interactable` `Collision` `FarmTile`(logic) `Water` `Loot` |
| Build | Windows/macOS; Switch giảm internal resolution xuống 256×144 |

---

## 15. LỘ TRÌNH & RỦI RO

### 15.1 Milestones (15 tháng)

| Mốc | Thời điểm | Nội dung | Định nghĩa hoàn thành |
|---|---|---|---|
| **M1 Prototype** | Tháng 2 | Di chuyển 8 hướng, cuốc/gieo/tưới, 1 cây 4 sprite, vòng ngày, pixel camera | Chơi 1 ngày game không lỗi, pixel không rung |
| **M2 Vertical Slice** | Tháng 4 | Mùa Xuân đầy đủ, 6 cây, gà, shop, 3 NPC, 1 lễ hội, art pass | Demo 30 phút cho 10 tester ngoài, ≥8/10 "muốn chơi tiếp" |
| **M3 Alpha** | Tháng 8 | 4 mùa, 30 cây, 7 vật nuôi, 24 NPC, chế biến, save/load | Chơi trọn 1 năm game |
| **M4 Beta** | Tháng 12 | Polish, âm thanh, cân bằng, accessibility, localization | 0 bug P0/P1, 60 fps đạt, ≥40 giờ nội dung |
| **M5 Launch** | Tháng 15 | Store page, trailer, demo festival, co-op beta | Wishlist ≥ 60.000, refund < 5% tuần đầu |

### 15.2 Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Số lượng sprite khổng lồ (nhân vật × 4 hướng × nhiều hành động) | **Cao** | Dùng chung base sprite + palette swap; mỗi hành động chỉ 3–6 khung; bộ công cụ Aseprite script để flip/đổi hướng |
| Pixel art bị "bẩn"/không nhất quán giữa các artist | Cao | Palette file `.pal` chung + **quy tắc 8 màu/sprite** + review theo checklist §2 |
| Pixel rung / scale lẻ | Trung bình | Pixel Perfect Camera + `PixelArtGlobal` snap; test ở 1080p, 1440p, 720p |
| Nội dung quá lớn (24 NPC × 30 cây) | Trung bình | Thang nội dung: launch chỉ 4 mùa × 6 cây × 10 NPC; còn lại DLC |
| Cảm giác "chậm" với người mới | Thấp | First 30 phút có fast-track cây 1 ngày |

---

## 16. PHỤ LỤC: TRIỂN KHAI 2D TRONG UNITY (bảng ánh xạ)

| Hạng mục thiết kế | Cách làm trong Unity 2D | Script trong repo |
|---|---|---|
| Di chuyển 8 hướng | `Rigidbody2D` (dynamic, gravity 0) + `MoveTowards` để đổi hướng "chắc tay" | `PlayerController2D.cs` |
| Nhắm ô đất trước mặt | `FacingCell()` = vị trí + vector hướng (không raycast) | `PlayerInteractor2D.cs` |
| Lưới ô đất | `Tilemap` (hình ảnh) + `TileData[]` (dữ liệu) — **không tạo GameObject mỗi ô** | `FarmGrid.cs` |
| 4 giai đoạn cây | Đổi `SpriteRenderer.sprite` theo `CropData.stageSprites[4]` | `CropInstance.cs` |
| 4 mùa | `SeasonTheme` (tile + sprite cây + màu) đổi khi mùa chuyển | `SeasonTheme.cs` |
| Ngày/đêm | Lớp overlay `SpriteRenderer` 1×1 phủ màn hình, đổi màu theo giờ | `DayNightTint2D.cs` |
| Thời tiết | Particle System 2D (mưa/tuyết/lá) + sét nháy + rung camera | `WeatherFX2D.cs` |
| Nhân vật đi sau cây | Y-sort: `sortingOrder = -y × 100` | `YSort2D.cs` |
| Hiệu ứng chín | Nhấp nháy sprite glow 2 khung | `CropInstance.Update()` + `ReadyPulse` logic |
| Loot rơi | Parabol pixel bằng code (không Rigidbody) + nam châm hút | `LootSpawner.cs`, `ItemPickup.cs` |
| Chống mờ/rung | `PixelArtGlobal` (Point filter, tắt AA, snap camera, kiểm tra import) | `PixelArtGlobal.cs` |
| Chống loading khi đổi mùa | Đổi tile + tint + particle ngay tại chỗ | `FarmGrid.ApplySeasonTheme()` |

> Đặc tả sprite chi tiết (kích thước, số khung, palette) nằm trong `docs/03-Asset-2D-Sprite-Spec.md`.

### Changelog
| Phiên bản | Ngày | Thay đổi |
|---|---|---|
| v2.0 | 2026-10-07 | **Chuyển toàn bộ sang 2D pixel art top-down**: 320×180 @ PPU 16, palette 48 màu, animation sprite, HUD pixel, tech spec 2D, lộ trình rút còn 15 tháng |
| v1.0 | 2026-10-07 | Bản GDD 3D low-poly đầu tiên (đã lưu trữ trong lịch sử git, commit `899b8e0`) |
