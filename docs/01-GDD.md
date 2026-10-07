# GAME DESIGN DOCUMENT (GDD)
## Dự án: **VƯỜN MƠ** (*Harvest Hearth*) — Cozy 3D Farm Life Sim

| Thông tin | Chi tiết |
|---|---|
| **Tên dự án (working title)** | Vườn Mơ / Harvest Hearth |
| **Thể loại** | Cozy Life-Sim + Farming Sim + Light Social Sim |
| **Góc nhìn** | Third-person 3D (over-the-shoulder, camera xoay tự do 360°) |
| **Engine** | Unity 6 (URP) — bản Unreal Engine 5 nằm ở phụ lục §16 |
| **Nền tảng** | PC (Steam/Epic) → Nintendo Switch → PS5/Xbox Series → Mobile (cloud/port sau) |
| **Số người chơi** | 1 người chơi; Co-op 2–4 người (post-launch, kiến trúc chừa sẵn) |
| **Đối tượng** | 12–40 tuổi, người chơi casual/cozy, fan Animal Crossing + Stardew Valley + Story of Seasons |
| **Xếp hạng** | ESRB E / PEGI 3 |
| **Thời lượng 1 phiên** | 20–60 phút; 1 mùa in-game ≈ 7.5 giờ thực |
| **Thời gian phát triển** | 18 tháng (5 sprint lớn) — xem §15 |
| **Ngôn ngữ** | VI, EN, JP, ZH, KR, ES, PT-BR, FR |

**USP (điểm bán riêng):**
1. **Diorama Farm** — trang trại như một mô hình đồ chơi thủ công đặt trong hộp gỗ: low-poly mềm, màu sắc "ấm" (warm), không có chi tiết gây nhiễu.
2. **Living Grid** — hệ thống lưới đất sống: mỗi ô đất có độ ẩm, dinh dưỡng, cỏ dại và "ký ức mùa vụ" (crop rotation bonus) hiển thị trực quan bằng màu đất.
3. **Seamless Season Shift** — chuyển mùa mượt trong 8 giây cinematic ngay tại chỗ người chơi đang đứng, không có loading screen.
4. **Không áp lực** — không có "ngất vì hết năng lượng" kiểu phạt nặng; thất bại chỉ là mất mùa, không mất save.

---

## 1. TẦM NHÌN & TRỤ CỘT THIẾT KẾ

| # | Trụ cột | Ý nghĩa trong gameplay | Kiểm chứng (test) |
|---|---|---|---|
| P1 | **Ấm cúng (Cozy)** | Không timer gây căng thẳng, không combat, nhạc ambient, nhịp chậm | Người chơi có thể ngồi ngắm cảnh 5 phút mà không bị phạt |
| P2 | **Nhịp điệu thiên nhiên** | Mùa/thời tiết là "designer vô hình" quyết định nên trồng gì | Mỗi mùa có ít nhất 1 cây trồng & 1 sự kiện độc quyền |
| P3 | **Của tôi / Của chúng ta** | Trang trại và mối quan hệ đều do người chơi xây, không cho sẵn | Không có "đúng/sai", chỉ có lựa chọn thẩm mỹ |
| P4 | **Mọi thứ đều phản hồi** | Mỗi hành động có âm thanh, animation và phản hồi hình ảnh | 100% tương tác phải có SFX + Animation + VFX |

---

## 2. PHONG CÁCH ĐỒ HỌA 3D (VISUAL STYLE)

### 2.1 Định hướng nghệ thuật

| Thuộc tính | Đặc tả |
|---|---|
| **Phong cách chính** | **Stylized Low-poly 3D** ("Handcrafted Diorama"): khối hình học đơn giản, mặt phẳng (faceted) hơi lộ cạnh, tỉ lệ đầu-to-thân dễ thương (chibi-lite, đầu ≈ 1/4.5 chiều cao) |
| **Chất liệu** | Flat/Matte material + roughness cao (0.7–0.9). **Không dùng PBR realistic.** Gỗ, đất sét (clay), vải dệt, gốm sứ là 4 "cảm giác vật liệu" chủ đạo |
| **Outline** | Có, kiểu "soft outline" 1.5–2 px, **màu nâu tối `#3E2C24`** thay vì đen tuyệt đối → giữ cảm giác ấm |
| **Ánh sáng** | 1 Directional (mặt trời/mặt trăng) + Hemisphere fill + Light Probe; **không dùng bóng đổ cứng trong hang/chuồng**, chỉ ambient occlusion baked |
| **Bóng đổ** | Soft shadow, tỉ lệ mềm (shadow blur 0.25–0.4). Bóng nhân vật là **blob shadow** ở chế độ performance thấp |
| **Post-processing** | Bloom nhẹ (0.15), Color Grading warm (LUT "Golden Hour"), Vignette 0.2, **tắt DOF khi chơi**, bật DOF khi chụp ảnh/Photo Mode |
| **Camera** | FOV 45–55°, camera thứ ba cao 2.2 m sau lưng 4.5 m, xoay/zoom bằng chuột-phải hoặc gamepad, không va vào vật cản (dùng Camera Collision whitelist) |
| **Tỉ lệ thế giới** | 1 Unity Unit = 1 mét. Ô đất = **2×2 m**. Người chơi cao 1.7 m. Cửa nhà cao 2.6 m |
| **Độ phân giải texture** | 256×256 (props nhỏ, atlas) → 1024×1024 (địa hình, building). Dùng **Texture Atlas** + Palette texture 256 màu |
| **Phong cách UI** | Gỗ + giấy da (paper texture), bo góc 12 px, font **Nunito / Baloo 2** (hỗ trợ tiếng Việt có dấu), icon vẽ tay dạng badge tròn |

### 2.2 Bảng phối màu (Color Script)

| Mùa | Bầu trời (Sky) | Ánh nắng (Key light) | Đất / Cỏ | Nước | Accent |
|---|---|---|---|---|---|
| **Xuân (Spring)** | `#A8DCF0` | `#FFE9B8` (4000K) | `#9BD07A` / `#7A5230` | `#7FD3E8` | Hồng đào `#F7A8B8` |
| **Hạ (Summer)** | `#7EC8F2` | `#FFF3C4` (5200K) | `#6FBF57` / `#8A5F33` | `#5FC8E0` | Vàng nắng `#FFD34E` |
| **Thu (Fall)** | `#C9D6E8` | `#FFC98A` (3600K) | `#C99A4E` / `#7A5230` | `#8FA6A8` | Cam bí `#E5762C` |
| **Đông (Winter)** | `#C6D6E4` | `#DCE9F5` (6500K) | Tuyết `#F2F7FB` / `#4A3B33` | Đá `#BFE3EE` | Xanh lạnh `#7C9CC4` |

Quy tắc: **độ tương phản màu tối đa 60%** — không dùng màu bão hòa 100% cho mảng lớn, chỉ dùng cho accent (quả chín, biển hiệu, cá).

### 2.3 Chu kỳ ánh sáng ngày/đêm

| Khung giờ game | Trạng thái | Ánh sáng | Gameplay ảnh hưởng |
|---|---|---|---|
| 05:00–07:00 | Bình minh | Key 2400K, intensity 0.5→1.1, fog hồng nhạt | Sương mù giảm tầm nhìn xa 40 m; tưới nước được |
| 07:00–17:00 | Ban ngày | Key 5200K, intensity 1.4, ambient xanh lá | **Người bán hàng mở cửa**, NPC ra ngoài |
| 17:00–19:30 | Hoàng hôn | Key 3200K, intensity 1.0→0.4, warm LUT | Xuất hiện đom đóm; câu cá cá quý tăng tỉ lệ |
| 19:30–22:00 | Tối | Moonlight 7000K, intensity 0.25, đèn lồng tự bật | Đa số shop đóng; NPC về nhà; cây trồng ngừng nhận nước |
| 22:00–02:00 | Đêm khuya | Moonlight 0.15, blue fog | Chỉ còn cú mèo, câu cá đêm, NPC bí ẩn |
| 02:00–05:00 | (tùy chọn) | — | **Auto-sleep + bảng tổng kết ngày** (doanh thu, thu hoạch, quan hệ) |

> **Quy tắc mềm:** Thức sau 24:00 không bị phạt tiền (khác Stardew); chỉ mất buff "Ngủ đủ giấc" (+10% tốc chạy, +5% chất lượng nông sản ngày hôm sau).

---

## 3. VÒNG LẶP GAMEPLAY CHÍNH (CORE LOOP)

### 3.1 Vòng lặp theo nhịp thời gian

| Vòng lặp | Thời lượng | Hành động | Phần thưởng |
|---|---|---|---|
| **Micro (5–30 giây)** | Liên tục | Tới ô đất → tưới/thu hoạch → nhặt loot → xem hạt bay | +1 nông sản, +XP Farming |
| **Meso (1 ngày game ~16 phút thực)** | 1 chu kỳ sáng-tối | Tưới cây, cho gia súc ăn, hái trứng/sữa, giao hàng, nói chuyện NPC | Tiền, quan hệ +, hạt giống mới |
| **Macro (1 mùa ~7.5 giờ thực)** | 28 ngày | Gieo vụ mùa, xây chuồng, mở khóa công trình, hoàn thành nhiệm vụ cộng đồng | Mở vùng mới, mở công thức chế biến |
| **Meta (1 năm = 4 mùa)** | ~30 giờ thực | Cải tạo trang trại, kết hôn/kết bạn, hoàn thành Lễ hội năm, đạt danh hiệu | Ending mùa nở hoa + New Game+ |

### 3.2 Sơ đồ Core Loop (dạng chuỗi phễu)

```
 ┌──────────────────────────── VÒNG LẶP MỘT NGÀY ────────────────────────────┐
 │                                                                           │
 │  1. Thức dậy (bảng tổng kết)                                              │
 │        ↓                                                                  │
 │  2. Kiểm tra thời tiết & mùa  ──► quyết định hôm nay trồng/tưới gì         │
 │        ↓                                                                  │
 │  3. Ra đồng: CUỐC (xới đất) → GIEO HẠT → TƯỚI NƯỚC → BÓN PHÂN             │
 │        ↓                                                                  │
 │  4. Chăn nuôi: cho ăn → vuốt ve → thu TRỨNG/SỮA/LÔNG                       │
 │        ↓                                                                  │
 │  5. THU HOẠCH (cây chín) → tự động nhặt loot vào túi                      │
 │        ↓                                                                  │
 │  6. CHẾ BIẾN (bếp/xưởng): Sữa → Phô mai; Cà chua → Sốt cà; Hoa → Mật ong   │
 │        ↓                                                                  │
 │  7. GIAO THƯƠNG: bán ở Chợ / bán cho NPC / đóng thùng vận chuyển           │
 │        ↓                                                                  │
 │  8. XÃ HỘI: tặng quà, làm nhiệm vụ phụ, hẹn hò, dự lễ hội                 │
 │        ↓                                                                  │
 │  9. MỞ RỘNG TRANG TRẠI: mua ô đất, xây chuồng, mua máy móc, đổi nội thất   │
 │        ↓                                                                  │
 │  10. Ngủ → bảng tổng kết → NGÀY MỚI                                       │
 └───────────────────────────────────────────────────────────────────────────┘
```

### 3.3 "Câu chuyện 30 phút đầu" (First-Time User Experience)

| Phút | Trải nghiệm |
|---|---|
| 0–2 | Cảnh mở: xe tải chở người chơi tới thung lũng; ông ngoại qua đời để lại mảnh đất + 1 cuốc + 1 bình tưới + 3 túi hạt cà chua |
| 2–5 | Hướng dẫn di chuyển WASD + camera chuột phải, dạy tương tác bằng **E** |
| 5–10 | Dạy: cuốc đất → gieo hạt → tưới nước. Cây cà chua đầu tiên mọc sau **1 ngày game**, "chín nhanh" đặc biệt để tạo dopamine |
| 10–15 | Gặp **bà Hòa** (chủ tiệm tạp hóa) — tặng 20G và 5 hạt cải; mở hệ thống Shop |
| 15–25 | Thu hoạch cà chua đầu tiên → bán được 35G → mua túi hạt mới + dạy "Sleep to save" |
| 25–30 | Ngày 2: thời tiết chuyển mưa → dạy "mưa tưới cây miễn phí" → mở bản đồ + mở cửa hầm mỏ |

---

## 4. HỆ THỐNG TRỒNG TRỌT (FARMING)

### 4.1 Chu kỳ sinh trưởng chuẩn (4 giai đoạn)

| Giai đoạn | Tên | Mô hình 3D | Biểu hiện | Chi phí | Điều kiện chuyển tiếp |
|---|---|---|---|---|---|
| **GĐ 1** | `Seed` — Hạt giống | `Mound_Seeded` (đống đất nhỏ + 3 hạt nhô lên) | Đất sẫm màu, có icon 💧 nếu khô | 1 hạt giống | Cần **≥1 ngày có nước** |
| **GĐ 2** | `Sprout` — Mầm | `Sprout_01` (2 lá mầm, 8–14 tri) | Lá lay nhẹ theo gió (wind shader) | — | Cần **N ngày có nước** (N theo cây) |
| **GĐ 3** | `Mature` — Cây trưởng thành | `Plant_Adult` (thân + tán lá đầy đủ, 150–400 tri) | Có quả non màu xanh nhạt | — | Cần **M ngày có nước** |
| **GĐ 4** | `Fruiting` — Có quả (CHÍN) | `Plant_Fruitful` (quả phồng + đường viền glow nhẹ) | Quả đổi màu sang accent, **nhấp nháy nhẹ 0.5 Hz**, có icon ❗ trên đầu | — | Người chơi bấm **E** để thu hoạch |

Sau thu hoạch: nếu cây là **Regrow** (cà chua, dâu, ớt, cà tím) → quay lại GĐ 3 và đếm lại `regrowDays`; nếu là **Single-harvest** (củ cải, bí, lúa) → về GĐ 1 và xóa, để lại "dư lượng đất" (soil memory).

### 4.2 Cây trồng khởi đầu (bảng cân bằng)

| Cây | Mùa | Ngày mọc (mỗi GĐ) | Tổng ngày | Regrow | Nước/ngày | Bán gốc | Bán chế biến | Hạt |
|---|---|---|---|---|---|---|---|---|
| Củ cải (Turnip) | Xuân | 1 / 1 / 1 | 3 | ✖ | 1 | 35G | 120G (Củ cải muối) | 20G |
| Khoai tây | Xuân | 1 / 2 / 2 | 5 | ✖ | 1 | 60G | 190G (Khoai chiên) | 50G |
| **Cà chua** | Hạ | 1 / 2 / 3 | 6 | ✔ 2 ngày | 1 | 55G | 210G (Sốt cà) | 45G |
| Ngô | Hạ | 2 / 3 / 4 | 9 | ✔ 3 ngày | 2 | 80G | 300G (Bắp rang bơ) | 70G |
| Bí ngô | Thu | 2 / 4 / 4 | 10 | ✖ | 2 | 200G | 620G (Bánh bí) | 130G |
| Nho | Thu | 2 / 3 / 5 | 10 | ✔ 4 ngày | 2 | 110G | 380G (Rượu nho) | 100G |
| Bông tuyết (Snowberry) | Đông | 3 / 4 / 3 | 10 | ✔ 5 ngày | 1 (+nhà kính) | 150G | 450G (Trà tuyết) | 180G |
| Lúa nước | Hạ | 2 / 3 / 5 | 10 | ✖ | 3 (ngập) | 95G | 340G (Rượu gạo) | 60G |

**Công thức tăng trưởng (dùng cho code & cân bằng):**
```
Tổng ngày game để chín = Σ (daysPerStage[i])
Mỗi ngày, cây chỉ được cộng "ngày ẩm" nếu:
    soilMoisture ≥ 30%  HOẶC  (thời tiết = Rain/Storm)  HOẶC  (tưới nước trong ngày)
Cây bị khô > 2 ngày liên tiếp → chuyển sang trạng thái Withering (héo)
Cây héo > 3 ngày liên tiếp → chết (Dead) → cuốc lên để lấy lại ô đất, mất hạt
```

### 4.3 Chất lượng nông sản (Quality)

| Hạng | Điều kiện | Giá | Visual |
|---|---|---|---|
| Thường | Mặc định | ×1.0 | Không hiệu ứng |
| Bạc ★ | Bón phân cơ bản + tưới đủ 100% | ×1.25 | Lấp lánh bạc |
| Vàng ★★ | Phân hữu cơ + đất ≥80% dinh dưỡng + không bị sâu | ×1.5 | Vòng sáng vàng |
| Cầu vồng ★★★ | Thời tiết mưa nắng xen kẽ + buff ngủ đủ + may mắn ngày | ×2.0 | Cầu vồng bay quanh |

### 4.4 Cơ chế đất (Soil)

| Chỉ số | Giá trị | Ảnh hưởng |
|---|---|---|
| **Độ ẩm** | 0–100% | <30% = cây không lớn; tưới +40%; mưa = 100% |
| **Dinh dưỡng** | 0–100% | Giảm 5%/vụ; phân bón +30%; ảnh hưởng chất lượng |
| **Cỏ dại** | 0–3 cấp | Xuất hiện 4%/ngày; giảm 15% tốc độ lớn mỗi cấp; dùng cuốc để dọn |
| **Sâu bệnh** | Có/Không | Xuất hiện 2%/ngày khi dinh dưỡng <40%; dùng thuốc để xử lý |
| **Ký ức vụ mùa** | Ghi 2 vụ trước | Trồng luân canh khác họ → +10% tốc độ, +10% chất lượng |

---

## 5. HỆ THỐNG CHĂN NUÔI (ANIMALS)

| Vật nuôi | Chuồng | Mua | Thức ăn | Sản phẩm | Chu kỳ | Quan hệ | Điều kiện đặc biệt |
|---|---|---|---|---|---|---|---|
| Gà | Chicken Coop (3 cấp) | 400G | Hạt ngũ cốc, cỏ | Trứng → Trứng vàng | 1/ngày | ♥0–10 | Gà vàng khi ♥10 + blessing |
| Vịt | Coop | 800G | Ngũ cốc | Trứng vịt → Lông vịt | 1/2 ngày | ♥0–10 | Thích mưa: +1 sản phẩm khi mưa |
| Bò | Barn | 1.500G | Cỏ khô, Silage | Sữa → Phô mai lớn | 1/ngày | ♥0–10 | Sữa vàng khi ăn cỏ tươi ngoài trời |
| Dê | Barn | 1.200G | Cỏ | Sữa dê → Phô mai dê | 1/2 ngày | ♥0–10 | Cho sữa nhiều hơn khi được vuốt ve |
| Cừu | Barn | 1.000G | Cỏ | Len → Vải | 1/5 ngày | ♥0–10 | Nhung khi được chải lông |
| Ong | Bee House | 250G | Hoa gần đó | Mật ong → Tổ ong | 1/4 ngày | — | Cần ≥5 ô hoa trong bán kính 6 m; **ngừng hoạt động mùa Đông** |
| Mèo/Chó | Nhà | 300G | Hạt thú cưng | Nước, +1 may mắn/ngày | 1/ngày | ♥0–10 | Mèo đuổi chim ăn hạt; chó nhặt loot hộ |

**Cơ chế chung:** `Đói (Hunger)` giảm 25%/ngày; đói → tụt quan hệ 5%/ngày; ≥♥8 → có biến thể sản phẩm quý. Mùa Đông: gia súc không ra ngoài, cần lò sưởi trong chuồng (mua 500G/lò, giảm 50% sụt quan hệ).

---

## 6. CHẾ BIẾN & CHẾ TÁC (CRAFTING)

| Trạm | Mở khóa | Công thức mẫu | Thời gian | Đầu vào → Đầu ra |
|---|---|---|---|---|
| **Bếp (Kitchen)** | Nâng cấp nhà lần 1 (10.000G) | Sốt cà, Bắp rang bơ, Bánh bí, Trà tuyết | 1–3 giờ game | 1 Cà chua → 1 Sốt cà |
| **Xưởng chế biến (Artisan)** | 5.000G | Phô mai, Bơ, Rượu nho, Rượu gạo, Dưa chua | 4–12 giờ game | 1 Sữa → 1 Phô mai |
| **Máy dệt (Loom)** | 3.000G | Vải từ Len | 3 giờ | 1 Len → 1 Vải |
| **Máy ép dầu** | 2.500G | Dầu, Nước hoa, Xà phòng | 6 giờ | 5 Hoa → 1 Nước hoa |
| **Xưởng mộc** | 4.000G | Hàng rào, Cầu, Thuyền, Nội thất | 8 giờ | 10 Gỗ + 5 Đá |
| **Máy ủ (Preserve Jar)** | 2.000G | Mứt, Rượu, Nước ép | 24 giờ game | 1 quả → 1 mứt |

Bảng cân bằng: **chế biến luôn cho ×1.5 đến ×5 giá gốc**, đổi lại cần thời gian (bị chặn theo ngày game) — tạo động lực quay lại mỗi sáng.

---

## 7. HỆ THỐNG TƯƠNG TÁC & DI CHUYỂN 3D

### 7.1 Di chuyển nhân vật (Third-person)

| Hành động | Input (PC / Gamepad) | Thông số |
|---|---|---|
| Đi bộ | WASD / Left Stick | 3.0 m/s |
| Chạy | Shift / L3 | 5.6 m/s (tiêu hao stamina) |
| Nhảy (thấp) | Space / A | Cao 0.9 m, chỉ để vượt hàng rào thấp |
| Cuộn camera | Chuột phải kéo / R-Stick | Yaw 360°, Pitch −20°…+45° |
| Zoom | Scroll / D-Pad | 3 m → 12 m |
| Chụp ảnh (Photo Mode) | P | Đóng băng thế giới, có filter mùa |
| Tương tác | **E** / Ⓐ | Raycast xa 3 m, phễu 25° |
| Đổi công cụ | 1–5 hoặc Q/RB | Radial menu khi giữ |
| Mở túi | Tab / Start | — |
| Bản đồ | M / Back | — |

Animation: `Idle_Breathe`, `Walk_Root`, `Run`, `Jump_Start/Loop/Land`, `Hoe_Swing`, `Water_Pour`, `Harvest_Pluck`, `Plant_Kneel`, `Pet_Animal`, `Sit`, `Sleep`, `Emote_Wave/Cheer/Think` — **tổng 14 clip locomotion + 12 clip hành động**, blend bằng Animator Layer (Upper-body override).

### 7.2 Sử dụng công cụ trong không gian 3D

| Công cụ | Phím | Animation | Cơ chế 3D | VFX/SFX |
|---|---|---|---|---|
| **Cuốc (Hoe)** | 1 | 3 pha: vung → chạm đất → rút | Spherecast xuống từ tâm ô → tìm `FarmTile` trong 1.5 m; đập đất → `Tiled` | Bụi đất, âm "bộp" khô |
| **Bình tưới (Watering Can)** | 2 | Nghiêng bình 0.6 s | Phễu 45° trước mặt, bán kính 1.8 m; mỗi ô +40% ẩm; hết nước ở giếng | Particle nước + cầu vồng mini khi nắng |
| **Máy gặt / Liềm (Harvester)** | 3 | Gạt ngang | Vùng 2×1 ô; thu hoạch tối đa 4 cây/lần; giảm 1 XL gốc | Lưỡi xoay, tiếng "xoẹt" |
| **Rìu (Axe)** | 4 | 2 pha | Phá cây, gốc, hàng rào gỗ (HP riêng từng loại) | Dăm gỗ |
| **Cần câu (Rod)** | 5 | Cast → Hook → Reel (mini-game 3 bước) | Sphere vùng nước, minigame thanh lực 3 giây | Nước bắn, cá quẫy |
| **Chuột giống (Seed Bag)** | tự động khi chọn hạt | Quỳ gieo | Chỉ hoạt động trên ô `Tiled` & trống & đúng mùa | Đất rắc, hạt nảy |
| **Máy cày (Tractor)** ⭐ | mua 20.000G | Lái (đổi state) | Xới + gieo + thu hoạch hàng loạt trong 1 lượt, tốn xăng | Động cơ, khói |
| **Máy bay phun thuốc** ⭐ | 45.000G | Bay theo lộ trình | Tưới/bón toàn bộ khu vực 10×10 | Cánh quạt, sương |

### 7.3 Grid System (đặt cây & công trình)

| Thông số | Giá trị |
|---|---|
| Kích thước ô | **2×2 m** (`FarmTile` = 1 cell) |
| Ma trận vùng farm | Tối đa **120 × 120 ô** (240×240 m), chia tilemap 16×16 cho streaming |
| Đặt công trình | Chỉ snap vào **vùng lưới xây dựng (Build Zone)** đã mở khóa; công trình chiếm N×M ô (barn = 4×6) |
| Snap | 0.1 s ease → vị trí lưới; preview xanh (hợp lệ) / đỏ (xung đột) + hiện lưới mờ |
| Cây trồng | Chỉ 1 cây/1 ô; cây lớn (cây ăn quả) chiếm 3×3 |
| Xoay | Q/E hoặc chuột phải, snap 90° |
| Va chạm | Mỗi ô có `NavCost` để NPC tìm đường tránh luống cây |

---

## 8. HỆ THỐNG THỜI TIẾT & MÙA

### 8.1 Bảng mùa

| Mùa | Ngày | Nhiệt độ | Màu chủ đạo | Cây trồng được | Sự kiện đặc biệt |
|---|---|---|---|---|---|
| Xuân | 1–28 | 18–24°C | Xanh non, hồng | Turnip, Khoai tây, Dâu, Hành | Lễ Hoa Nở (ngày 13) |
| Hạ | 29–56 | 28–34°C | Xanh đậm, vàng | Cà chua, Ngô, Lúa, Dưa hấu | Hội Chợ Biển (ngày 40) |
| Thu | 57–84 | 15–22°C | Cam, đỏ gạch | Bí ngô, Nho, Cà rốt, Táo | Lễ Đèn Lồng (ngày 70) |
| Đông | 85–112 | −5–8°C | Trắng, xanh lạnh | Snowberry, cải trong nhà kính | Lễ Tuyết & Tri Ân (ngày 98) |

### 8.2 Loại thời tiết & ảnh hưởng (ma trận)

| Thời tiết | Tỉ lệ | Cây trồng | Gia súc | Người chơi / NPC | Visual |
|---|---|---|---|---|---|
| **Nắng** | 45% | Tưới thủ công cần thiết; +5% tốc độ lớn | Thả ra ngoài, +5% quan hệ | Tốc chạy bình thường | Nắng vàng, đom đóm đêm |
| **Nhiều mây** | 20% | Tốc độ bình thường | Bình thường | Bình thường | Ánh sáng tản, dịu |
| **Mưa** | 18% | **Tự tưới 100%**, +10% tốc độ lớn | Bò/vịt +1 sản phẩm; gà bớt vui (−2 quan hệ) | Tốc chạy −10%, cần ô/áo mưa | Mưa hạt, vũng nước có gợn |
| **Bão** | 5% | **10% cây bị gãy**, hàng rào có thể hư, ngã cây | Không cho ra ngoài, −5 quan hệ/tối nếu chuồng chưa nâng cấp | Cấm câu cá, tầm nhìn giảm, cây cối nghiêng | Gió mạnh, lá bay, tối sầm |
| **Tuyết** | 10% (chỉ nếu Đông) | Cây ngoài trời chết ngay (trừ Snowberry); nhà kính bảo vệ 100% | Cần lò sưởi; sản phẩm −25% nếu thiếu | Tốc chạy −15%, có thể trượt trên băng | Tuyết rơi, hơi thở, mặt nước đóng băng |
| **Sương mù** | 2% | +20% sâu bệnh | Bình thường | Tầm nhìn 25 m, NPC bí ẩn xuất hiện | Fog layer, đèn lồng nổi |
| **Cầu vồng** | Đặc biệt (sau mưa) | +1 chất lượng cho mọi cây thu hoạch trong ngày | +1 quan hệ khi vuốt ve | Nhân đôi may mắn | Vòm cầu vồng, hạt sáng |
| **Mưa sao băng** | 1% (Hạ/Thu) | — | — | Điều ước: +buff ngẫu nhiên 1 ngày | Sao rơi, nguyện ước |

**Kiến trúc code:** `WeatherSystem` sinh dự báo 3 ngày (dùng cho TV/radio/NPC báo tin) và phát event `OnWeatherChanged`, để `CropInstance` và `AnimalAI` subscribe — không có `Update()` polling toàn bộ cây (tối ưu cho 120×120 ô).

---

## 9. NPC, CỘNG ĐỒNG & LỄ HỘI

### 9.1 Quan hệ (Relationship)

| Chỉ số | Thang | Tăng bằng | Giảm bằng | Ngưỡng mở khóa |
|---|---|---|---|---|
| Điểm tim (Hearts) | 0–10 (mỗi ♥ = 250 điểm) | Nói chuyện +20/ngày; tặng quà +50 (yêu thích +80); làm nhiệm vụ +100 | Tặng đồ ghét −40; không gặp 7 ngày −20 | ♥2 = mở nhiệm vụ cá nhân; ♥4 = mở công thức; ♥6 = sự kiện đặc biệt; ♥8 = hẹn hò/marriage; ♥10 = quà đặc biệt |
| Trạng thái | Lạ → Quen → Bạn → Thân → Tri kỷ | — | — | Mỗi mốc có 1 cutscene ngắn 20 s |

### 9.2 Danh sách NPC chính (10 người, mở rộng lên 24)

| NPC | Vai trò | Tính cách | Quà yêu thích | Nhiệm vụ tuyến |
|---|---|---|---|---|
| **Bà Hòa** | Chủ tạp hóa | Ấm áp, hay kể chuyện xưa | Trà hoa cúc, Bánh bí | Mở shop & hướng dẫn chợ |
| **Ông Bảy** | Ngư dân | Lầm lì, hài hước khô | Cá chép, Rượu gạo | Dạy câu cá, mở thuyền |
| **Linh** | Thú y | Năng lượng cao | Sữa tươi, Trứng vàng | Mở chuồng, chữa gia súc |
| **Minh** | Kỹ sư nông nghiệp | Nghiêm túc, mê máy móc | Phụ tùng, Đá quý | Mở công trình, máy móc |
| **Hân** | Họa sĩ | Mơ mộng | Hoa, Đá phát sáng | Mở Photo Mode, décor |
| **Bảo** | Đầu bếp | Cầu toàn, nóng tính | Nấm, Cá hồi | Mở bếp, nhà hàng |
| **Thư** | Nhạc công | Dịu dàng | Nước hoa, Vải | Mở festival âm nhạc |
| **Nam** | Học sinh | Năng động, tò mò | Nước ép, Mứt | Nhiệm vụ khám phá hang động |
| **Cô Tuyết** | Thị trưởng | Trang trọng | Trà tuyết, Bánh mì | Mở rộng đất, dự án cộng đồng |
| **??? / Người Bí Ẩn** | Nhà thảo dược | Bí hiểm | Nấm lạ, Mật ong | Mở khu rừng cổ & phép màu đất |

### 9.3 Nhiệm vụ phụ (Side Quest) — cấu trúc

| Loại | Ví dụ | Thời hạn | Thưởng |
|---|---|---|---|
| Giao hàng | "Mang 5 quả trứng tới nhà Linh trước 18:00" | 1 ngày | 200G + ♥1 |
| Nuôi trồng | "Trồng 10 cây ngô" | 1 mùa | 800G + hạt mới |
| Câu chuyện | "Tìm cuốn nhật ký của ông Bảy ở bờ sông" | Không giới hạn | Mở bản đồ kho báu |
| Cộng đồng | "Quyên góp 5.000G xây cầu làng" | 1 mùa | Mở vùng mới |
| Chế biến | "Làm 3 Phô mai cho Bảo" | 3 ngày | Công thức Bánh phô mai |
| Bí ẩn | "Điều gì xảy ra trong rừng lúc nửa đêm?" | Không giới hạn | Linh vật đất |

### 9.4 Lịch Lễ Hội (Festival Calendar)

| Ngày | Tên lễ hội | Địa điểm | Hoạt động chính | Phần thưởng |
|---|---|---|---|---|
| Xuân 7 | **Hội Chợ Hạt Giống** | Quảng trường | Mua hạt rẻ 40%, đổi hạt hiếm | Hạt giống độc quyền |
| Xuân 13 | **Lễ Hoa Nở** | Đồi hoa | Thi cắm hoa, tặng hoa cho NPC | Trang phục hoa, ♥+ |
| Xuân 23 | **Ngày Câu Cá Xuân** | Hồ lớn | Mini-game câu cá theo giờ | Cần câu nâng cấp |
| Hạ 11 | **Cuộc Thi Nông Sản** | Quảng trường | Nộp nông sản chất lượng cao để tính điểm | Cúp vàng, 1.000G |
| Hạ 20 | **Hội Chợ Biển** | Bãi biển | BBQ, câu mực đêm, đốt lửa | Công thức hải sản |
| Hạ 26 | **Đua Thuyền** | Sông | Đua thuyền lá với NPC | Thuyền cá nhân |
| Thu 8 | **Lễ Thu Hoạch** | Trang trại | Nộp 5 món ăn ngon; NPC nấu chung | Công thức mùa |
| Thu 15 | **Lễ Đèn Lồng** | Ven sông | Thả đèn, điều ước, nhạc sống | Trang phục, quest tình cảm |
| Thu 24 | **Hội Cây Ăn Quả** | Vườn | Trồng cây kỷ niệm, mỗi NPC 1 cây | Cây ăn quả 5 sao |
| Đông 5 | **Lễ Ánh Sáng** | Quảng trường | Trang trí cây, tặng quà bí mật | Quà ngẫu nhiên cao cấp |
| Đông 12 | **Đêm Sao Băng** | Đồi | Cả làng cùng ngắm sao, chơi mini-game | Buff may mắn 3 ngày |
| Đông 20 | **Lễ Tri Ân** | Nhà thờ/Nhà văn hóa | Tổng kết năm, xem lại thành tích | Danh hiệu, giấy khen |
| Đông 28 | **Giao Thừa** | Quảng trường | Đếm ngược, pháo hoa, chuyển năm | Mở khóa mùa mới, buff năm mới |

---

## 10. KINH TẾ & TIẾN TRÌNH (ECONOMY)

| Giai đoạn | Tiền kỳ vọng | Nguồn thu chính | Mở khóa |
|---|---|---|---|
| Ngày 1–14 | 0 → 3.000G | Bán củ cải/khoai tây | Túi 12 ô, chuồng gà |
| Ngày 15–40 | 3.000 → 25.000G | Chế biến phô mai/mứt + câu cá | Barn, 24 ô, Artisan, Mine |
| Ngày 41–80 | 25.000 → 120.000G | Rượu, nước hoa, hải sản quý | Nhà kính, máy cày, mở vùng East |
| Ngày 81–112+ | 120.000 → ∞ | Cá hiếm, nấm truffle, trang trại du lịch | Thuyền, khu rừng cổ, ngôi nhà thứ 2 |

**Chống lạm phát:** mỗi năm, giá bán có trần theo catalog; chi phí bảo trì máy móc tăng 10%/năm; hàng hóa bán quá nhiều cùng 1 loại trong 1 mùa bị giảm 1% giá (tối đa 15%).

---

## 11. UI / HUD & TRẢI NGHIỆM NGƯỜI DÙNG

| Thành phần | Mô tả |
|---|---|
| HUD chính | Góc trên-trái: ngày/mùa/thời tiết/giờ + tiền. Góc dưới-phải: 8 ô hotbar + ô công cụ đang cầm. Góc dưới-trái: stamina (vòng cung, nhạt dần) |
| Prompt tương tác | Hiện giữa màn hình khi raycast trúng: `[E] Tưới nước`, `[E] Thu hoạch`, `[E] Nói chuyện` |
| Bản đồ | Minimap tròn khi chơi, bản đồ lớn (M) chia vùng, có cắm cờ |
| Túi đồ | 6 ngăn × 8 ô = 48 (+ mở rộng 96), sắp xếp kéo-thả, có bộ lọc |
| Nhật ký | Ghi nhiệm vụ, mùa vụ, NPC, thu hoạch kỷ lục |
| Accessibility | Chế độ không màu (color-blind), cỡ chữ 3 mức, tắt rung camera, tự động tưới (assist mode), chế độ thời gian chậm 0.7×, phụ đề đầy đủ cho mọi câu thoại |

---

## 12. ÂM THANH & ÂM NHẠC

| Lớp | Nội dung |
|---|---|
| **Nhạc nền** | 4 bản theo mùa + 4 bản đêm + 1 bản lễ hội + 1 bản menu; dàn nhạc nhỏ (piano, guitar acoustic, accordion, sáo, cello) tông trưởng, tempo 70–95 BPM |
| **Ambient** | Chim, dế, suối, gió, tuyết, tiếng gỗ kêu, tiếng bếp; thay đổi theo mùa & giờ |
| **SFX hành động** | Cuốc, xẻng, nước, thu hoạch, hái, bước chân 4 bề mặt (cỏ, đất, gỗ, tuyết) |
| **SFX sinh vật** | 6 loài gia súc (3 biến thể vui/buồn/đói) |
| **Audio kể chuyện** | Tiếng "blip" khi hội thoại (kiểu Animal Crossing), không lồng tiếng đầy đủ |
| **Tổng ngân sách** | ~420 file, 350 MB (nén Vorbis 128 kbps) |

---

## 13. LƯU TRỮ & NHIỀU NGƯỜI CHƠI

| Vấn đề | Giải pháp |
|---|---|
| Save | 3 khe + auto-save khi ngủ & khi rời nhà; JSON nén (`System.IO.Compression`) + checksum; lưu idempotent theo `saveVersion` để migrate |
| Ghi gì | Vị trí cây (ô, giống, ngày tuổi, ẩm, chất lượng), gia súc (tên, ♥, đói), NPC (♥, quest), túi, tiền, công trình, thời tiết 3 ngày tới, RNG seed |
| Co-op (post-launch) | Host-authoritative; `Netcode for GameObjects`; đồng bộ state theo event (không sync Transform cây), dùng `NetworkVariable<CropState>` |
| Chống bug tiềm ẩn | Không dùng `float` cho tiền/ngày → dùng `int`; mọi thời gian tính bằng `double totalGameMinutes` |

---

## 14. THÔNG SỐ KỸ THUẬT (TECH SPEC)

| Hạng mục | Mục tiêu |
|---|---|
| Engine | Unity 6 LTS, URP (Forward+), C# 9, Input System 1.7 |
| Nền tảng build | Windows/macOS; Switch (downgrade LOD, resolution scale 0.8) |
| FPS mục tiêu | PC 60 fps @1080p (min spec GTX 1050 Ti, 8 GB RAM, 4 GB VRAM); Switch 30 fps docked |
| Draw call | ≤ 900 (PC) / ≤ 600 (Switch) |
| Tam giác/khung hình | ≤ 1.2 M |
| Shadow | 1 cascade 40 m; bóng xa dùng baked AO |
| Tối ưu cây trồng | Dùng **Batched Mesh / GPU Instancing** cho cây cùng giống + cùng giai đoạn; mỗi cây không có `MonoBehaviour.Update()` riêng — dùng `TimeManager` tick theo event |
| Streaming | Địa hình chia 4 sector; cây chỉ active trong bán kính 60 m, xa hơn → impostor 2D |
| Physics layer | `FarmTile`, `Interactable`, `Building`, `Animal`, `Water`, `Player`, `Terrain` |
| Đa nền tảng | URP Asset riêng cho từng tier; Quality Setting tự chọn theo `SystemInfo.graphicsMemorySize` |

---

## 15. LỘ TRÌNH PHÁT TRIỂN & RỦI RO

### 15.1 Milestones (18 tháng)

| Mốc | Thời điểm | Nội dung | Tiêu chí hoàn thành (Definition of Done) |
|---|---|---|---|
| **M1 – Prototype** | Tháng 2 | Di chuyển 3rd person, cuốc đất, gieo hạt, tưới, 1 loại cây 4 giai đoạn, vòng ngày | Chơi được 1 ngày game không crash, cây lớn đúng |
| **M2 – Vertical Slice** | Tháng 5 | 1 mùa Xuân đầy đủ, 6 cây, gà, shop, 3 NPC, 1 lễ hội, art pass | Demo 30 phút cho 10 tester ngoài, ≥8/10 "muốn chơi tiếp" |
| **M3 – Alpha** | Tháng 9 | 4 mùa, 30 cây, 7 vật nuôi, 24 NPC, chế biến, mùa/thời tiết, save/load | Nội dung hoàn tất 100%, có thể chơi từ đầu tới hết năm |
| **M4 – Beta** | Tháng 13 | Polish, âm thanh hoàn chỉnh, cân bằng, accessibility, localization | 0 bug P0/P1, fps đạt mục tiêu, ≥40 giờ nội dung đo được |
| **M5 – Launch** | Tháng 16–18 | Store page, trailer, demo festival, co-op beta | Wishlist ≥ 60.000, refund rate < 5% tuần đầu |

### 15.2 Rủi ro & Giảm thiểu

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Scope quá lớn (24 NPC + 30 cây) | Cao | Cắt theo "thang nội dung": ưu tiên 4 mùa × 6 cây × 10 NPC cho launch, còn lại DLC |
| Hiệu năng cây trồng nhiều | Cao | Kiến trúc event-driven, GPU instancing, LOD/impostor — đã đặc tả §14 |
| Cảm giác "chậm" với người chơi mới | Trung bình | First 30 minutes có "fast-track" cây lớn 1 ngày + hướng dẫn theo ngữ cảnh |
| Phong cách nghệ thuật bị "generic low-poly" | Trung bình | Quy tắc màu §2.2 + outline nâu + diorama framing; test "silhouette test" mỗi asset |
| Co-op phá vỡ cân bằng kinh tế | Thấp | Giá bán giảm nhẹ khi ≥3 người chơi; loot rơi chia đều |

---

## 16. PHỤ LỤC: ĐỐI CHIẾU UNITY ↔ UNREAL ENGINE 5

| Hạng mục | Unity 6 (URP) | Unreal Engine 5 |
|---|---|---|
| Script cây trồng | `CropInstance : MonoBehaviour` + `CropData : ScriptableObject` | `ACropActor : AActor` + `UCropDataAsset : UPrimaryDataAsset` |
| Thời gian game | `TimeManager` singleton + event | `UGameTimeSubsystem : UGameInstanceSubsystem` |
| Đổi mô hình theo giai đoạn | `GameObject.SetActive` 4 prefab con / hoặc array `Mesh` + `MeshFilter.sharedMesh` | Mảng `UStaticMesh*` + `UStaticMeshComponent::SetStaticMesh()` |
| Tương tác E | `Physics.SphereCast` + `IInteractable` | `LineTraceSingleByChannel` + `IInteractableInterface` (UINTERFACE) |
| Đặt cây theo lưới | `Grid<FarmTile>` + `Instantiate` | `Grid` + `SpawnActor` với `SnapToGrid` |
| Thời tiết | ScriptableObject profile + Particle System + `Shader.SetGlobalFloat` | Niagara + Material Parameter Collection + `UWeatherSubsystem` |
| Lưu game | JSON (Newtonsoft) / BinaryFormatter | `USaveGame` + `SaveGameToSlot` |

> Chọn Unity làm engine chính vì: build nhanh cho Switch, hệ sinh thái asset low-poly phong phú, chi phí license rõ ràng cho team 4–6 người. UE5 chỉ dùng nếu ưu tiên Nanite/Lumen cinematic trailer.

---

*Tài liệu này là bản sống (living document) — mọi thay đổi cân bằng phải được ghi vào mục Changelog phía dưới.*

### Changelog
| Phiên bản | Ngày | Thay đổi |
|---|---|---|
| v1.0 | 2026-10-07 | Bản GDD đầy đủ đầu tiên (4 mùa, 8 cây, 7 vật nuôi, 10 NPC, 13 lễ hội) |
