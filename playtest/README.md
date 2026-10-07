# 🎮 Vườn Mơ — Bản chơi thử (Playtest) chạy trên trình duyệt

> **Đây là bản mô phỏng lại các hệ thống trong game Unity bằng JavaScript/Canvas để bạn CHƠI THỬ NGAY.**
> Không phải bản phát hành. Unity không chạy được trong môi trường này, nên bản chơi thử
> được viết lại bằng cùng công thức thiết kế (cây trồng, nước, mùa, thời tiết, giá cả)
> để bạn cảm nhận vòng chơi trước khi dựng art thật trong Unity/Godot.

---

## 1. Chạy bản chơi thử

**Cách 1 — mở trực tiếp:** mở file `playtest/index.html` bằng trình duyệt (Chrome/Edge/Firefox).
Không cần internet, không cần cài gì.

**Cách 2 — chạy qua máy chủ tĩnh** (nếu trình duyệt chặn file local):

```bash
cd playtest
python3 -m http.server 8080 --bind 0.0.0.0
# rồi mở http://localhost:8080
```

**Cách 3 — trong Arena:** bấm vào khung **Live Preview** (máy chủ ở cách 2 đang chạy sẵn).

Độ phân giải nội bộ **384×216 px** (24×13,5 ô, mỗi ô **16×16 px**), phóng to theo bội số nguyên
(`image-rendering: pixelated`) nên hình luôn sắc nét, không bị mờ.

---

## 2. Điều khiển

| Phím | Tác dụng |
|---|---|
| `W A S D` / phím mũi tên | Đi bộ |
| `Shift` (giữ) | Chạy |
| **`E`** | **Tương tác** với ô phía trước (ô này **nhấp nháy viền vàng**) |
| `1` … `6` | Chọn: Cuốc · Bình tưới · Liềm · Rìu · Cuốc chim · Cần câu |
| `8` hoặc `Q` | Đổi loại hạt giống đang cầm |
| `B` | Mua hạt tại sạp hàng |
| `T` | **Tua nhanh 1 ngày** (để thử cây lớn / thời tiết / mùa) |
| `R` | Đổi thời tiết hôm nay (chỉ để thử) |
| `P` | Ẩn/hiện HUD |
| `H` | Bảng hướng dẫn trong game |
| `Esc` | Tạm dừng (hiện bảng hướng dẫn) |

**Mẹo:** đứng cạnh ô đất, nhìn ô nhấp nháy vàng rồi bấm `E` — mọi hành động đều qua `E`.

---

## 3. Vòng chơi cốt lõi (làm được trong 5 phút)

```
1 + E (cuốc đất)  →  8 + E (gieo hạt)  →  2 + E (tưới nước)
        →  ngủ (E ở cửa nhà) hoặc bấm T  →  E (thu hoạch khi cây chín)
        →  loot tự bay vào túi  →  E ở sạp hàng (quầy gỗ cạnh bà Hòa) để bán
```

- **Tưới nước là bắt buộc**: đất khô (độ ẩm < 0,3) thì cây **không lớn**; khô 5 ngày liên tiếp cây **chết**.
  Trời **mưa/bão tự tưới miễn phí** cả ruộng → đây là "ngày nghỉ" của người chơi.
- **Ngày kết thúc** khi bạn ngủ (bấm `E` trước cửa nhà) hoặc khi đồng hồ tới **2:00 sáng** (tự ngủ, mất 1 phần năng lượng theo thiết kế).
- **Mùa đổi sau 7 ngày** (bản chơi thử rút ngắn từ 28 ngày để bạn thấy đủ 4 mùa nhanh).
  **Mùa Đông làm mọi cây ngoài trời chết** — đúng như GDD §8.2, muốn trồng Đông phải có nhà kính (chưa làm).
- **Tiến trình được lưu tự động** vào `localStorage` (khóa `vuonmo_playtest_save_v1`) mỗi khi ngủ.

---

## 4. Bảng dữ liệu khớp với thiết kế (dùng chung công thức với code C#)

### 4.1 Cây trồng — 4 giai đoạn, số ngày mỗi giai đoạn

| Cây | Hình dạng | Ngày mỗi giai đoạn | Tổng ngày | Mọc lại | Bán (G) | Hạt (G) | Mùa |
|---|---|---|---|---|---|---|---|
| Củ cải (turnip) | bụi thấp | 1 / 1 / 1 | 3 | – | 35 | 20 | Xuân |
| Cà chua (tomato) | giàn leo | 1 / 2 / 3 | 6 | +2 ngày/lần | 55 | 45 | Hạ |
| Ngô (corn) | thân cao | 2 / 3 / 4 | 9 | +3 ngày/lần | 80 | 70 | Hạ |
| Bí ngô (pumpkin) | dây bò | 2 / 4 / 4 | 10 | – | 200 | 130 | Thu |

Phẩm chất khi chín (roll 1 lần khi cây đạt giai đoạn 4, xác suất):
**Cầu vồng \*\*\*** nếu > 94 %, **Vàng \*\*** > 82 %, **Bạc \*** > 55 %, còn lại **Thường**.

| Phẩm chất | Hệ số giá bán (khớp `QualityUtil.PriceMultiplier`) | Cà chua (giá gốc 55G) |
|---|---|---|
| Thường | ×1,00 | 55 G |
| Bạc `*` | ×1,25 | 69 G |
| Vàng `**` | ×1,50 | 83 G |
| Cầu vồng `***` | ×2,00 | 110 G |

Túi đồ lưu **riêng từng phẩm chất**, nên bán 1 món Cầu vồng đúng bằng 2 món Thường.

### 4.2 Thời tiết — trọng số & hệ quả

| Thời tiết | Trọng số | Tự tưới | Làm gãy cây |
|---|---|---|---|
| Nắng | 45 | – | – |
| Nhiều mây | 20 | – | – |
| Mưa | 18 | ✅ | – |
| Bão | 5 | ✅ | 10 % |
| Tuyết (chỉ mùa Đông) | 10 | – | 5 % |
| Sương mù | 2 | – | – |

### 4.3 Đất & cây

| Thông số | Giá trị |
|---|---|
| Độ ẩm khô đi mỗi ngày | −0,35 |
| Tưới 1 lần | +0,40 (tối đa 1,0) |
| Ngưỡng "đủ nước để lớn" | 0,30 |
| Cỏ dại mọc | 4 %/ngày/ô (tối đa 3 bậc) |
| Sâu bệnh | 2 %/ngày/ô |
| Chết vì khô hạn | 5 ngày liên tiếp không nước |
| Bình tưới | 20 đơn vị (múc lại ở giếng) |
| Nhặt loot tự động | bán kính 40 px |

---

## 5. Có gì trong bản chơi thử (và còn thiếu gì)

| Hệ thống | Trạng thái | Ghi chú |
|---|---|---|
| Cuốc / gieo / tưới / thu hoạch | ✅ | 4 giai đoạn hình vẽ khác nhau hoàn toàn |
| Nước & khô hạn, cây chết | ✅ | ràng buộc chiến lược chính |
| Ngày/giờ, mùa, thời tiết + dự báo 3 ngày | ✅ | 4 mùa, 6 loại thời tiết |
| Loot khi thu hoạch + nam châm tự nhặt | ✅ | như thiết kế Prompt 2 |
| Mua hạt & bán nông sản | ✅ | ở sạp hàng (quầy gỗ) |
| NPC (bà Hòa): nói chuyện, tặng quà, tim | ✅ | 1 NPC mẫu |
| Lưu/tải | ✅ | localStorage |
| Cỏ dại, sâu bệnh | ✅ | hiện trên hình, dùng liềm dọn |
| Chặt cây lấy gỗ | ✅ | cây là **vật cản**; chặt bằng Rìu (4) → **+2 Gỗ**, còn **gốc cây đi qua được**, sau **5 ngày gốc mọc lại** (trạng thái gốc lưu vào save) |
| Đánh cá, vật nuôi, chế biến, lễ hội | ⏳ | **chưa làm** — thuộc bản Unity đầy đủ |
| Nhà kính trồng mùa Đông | ⏳ | chuồng trại hiện chỉ hiện thông báo "sắp có" |

---

## 6. Bản chơi thử này tương ứng file nào trong code Unity

| File JS (bản chơi thử) | File C# tương ứng | Việc nó làm |
|---|---|---|
| `js/pixel.js` | `Core/PixelArtGlobal.cs` + `Data/*` | bảng màu, vẽ nhân vật/cây/công trình bằng pixel, dữ liệu cây & mùa |
| `js/world.js` | `Farming/FarmGrid.cs`, `Farming/CropInstance.cs`, `Core/TimeManager.cs`, `Core/WeatherSystem.cs`, `Save/SaveSystem.cs` | bản đồ ô, va chạm, lớn theo ngày, thời tiết, lưu game |
| `js/game.js` | `Player/PlayerController2D.cs`, `Player/PlayerInteractor2D.cs`, `Farming/LootSpawner.cs`, `Farming/ItemPickup.cs`, `UI/HudController2D.cs`, `NPC/NPCRelationship2D.cs` | điều khiển, tương tác `E`, loot, HUD, NPC |
| `index.html` | `Core/GameBootstrap.cs`, `Core/GameServices.cs` | khởi động, vòng lặp, độ phân giải, vào game |

Các con số trong hai bên là **cùng một nguồn**: sửa bảng ở `js/pixel.js` thì cũng phải sửa
`unity/Assets/Data/Crops/*.asset` cho khớp.

---

## 7. Bộ kiểm thử tự động (không cần trình duyệt)

Bản chơi thử có 3 công cụ trong `playtest/tools/` để máy tự kiểm tra — chạy bằng Node.js:

```bash
node playtest/tools/smoke-test.js     # 54 phép thử: vòng chơi, lớn theo ngày, loot, bán, ngủ, chặt cây, lưu game
node playtest/tools/boot-test.js      # 17 phép thử: chạy index.html trong DOM giả (nút bấm, phím, vòng lặp)
node playtest/tools/render.js         # xuất ảnh PNG vào playtest/screenshots (không cần trình duyệt)
```

**Kết quả hiện tại: 54/54 và 17/17 PASS.**

Ba lỗi thật do bộ test tìm ra và đã sửa (ghi lại để bạn biết test có giá trị):

1. **Cây đã tưới vẫn không lớn** — code trừ độ ẩm *trước* khi kiểm tra "đủ nước", nên nước tưới hôm nay
   bị trừ sạch trước khi cây được tính. Đã tách thành 2 lượt: **tăng trưởng trước, khô đất sau**.
2. **Bà Hòa đứng chắn ô bán hàng** — ưu tiên tương tác đổi thành: công trình (sạp/giếng/cửa) → NPC → cây trồng,
   và NPC chỉ đi lang thang loanh quanh sạp chứ không đứng lên ô quầy.
3. **Khung gợi ý `[E] …` bị tràn chữ** — khung được tính theo độ dài chuỗi thay vì đo chữ thật; đã đổi sang
   đo bằng `measureText` và thu ngắn dòng nếu quá rộng.
4. **Bán hàng bỏ qua phẩm chất** — code cũ nhân giá gốc, không dùng hệ số phẩm chất như
   `QualityUtil.PriceMultiplier` bên C#. Đã đổi túi đồ sang lưu 4 mức phẩm chất riêng và nhân giá đúng.
5. **Cây đi xuyên qua được** — cây rừng lúc đầu đặt `solid = false`, nên chặt cây chỉ để lấy gỗ mà
   không có ý nghĩa không gian. Đã cho cây thành vật cản và thêm gốc cây mọc lại sau 5 ngày.

---

## 8. Ảnh chụp bản chơi thử (`playtest/screenshots/`)

Ảnh do `tools/render.js` sinh ra, dùng để soi sprite mà không cần mở trình duyệt:

| Ảnh | Nội dung |
|---|---|
| `00-bang-sprite.png` | **Bảng sprite 6×**: 4 cây × 4 giai đoạn, cây chết, đất khô/ẩm/ướt, nhân vật 4 hướng, công cụ, vật phẩm, thời tiết, tim, công trình |
| `01-van-moi-buoi-sang.png` | Ván mới, 8 giờ sáng mùa Xuân |
| `02-bon-giai-doan-cay.png` | Ruộng có đủ 4 giai đoạn + cỏ dại + sâu bệnh |
| `03-mua-buoi-chieu.png` | Mưa 15 giờ (trời tối hơn, hạt mưa) |
| `04-dem-mua-ha.png` | 21 giờ 30 mùa Hạ (ánh đêm xanh, đom đóm) |
| `05-mua-thu-bao.png` | Bão mùa Thu (tối nhất, sét nháy) |
| `06-mua-dong-tuyet.png` | Mùa Đông: cỏ trắng, cây trụi lá, tuyết rơi |
| `07-toan-canh-ban-do.png` | Toàn cảnh bản đồ 40×30 ô |

---

## 9. Ghi chú kỹ thuật

- **Không CDN, không internet, không `fetch`** — mọi tài nguyên vẽ bằng code (`fillRect` pixel),
  nên chạy được cả trong iframe bị chặn mạng.
- Cấu trúc: `index.html` (menu + vòng lặp) → `js/pixel.js` (vẽ & dữ liệu) → `js/world.js` (thế giới & luật)
  → `js/game.js` (điều khiển, tương tác, HUD). Nạp theo đúng thứ tự này.
- `window.__VUONMO__ = { game, ctx, canvas }` được mở ra để tự động hoá kiểm thử từ console:
  `__VUONMO__.game.press('t')` = tua 1 ngày, `__VUONMO__.game.state.gold` = xem tiền.
