# 🌱 VƯỜN MƠ — *Harvest Hearth*

Gói **Game Design Document + mã nguồn + đặc tả sprite + prompt concept art** cho một tựa game
**nông trại 2D pixel art top-down, phong cách cozy** (Stardew Valley × Harvest Moon × Animal Crossing).

> Repo tài liệu & mã nguồn (không chứa engine). Mở bằng **Unity 6 LTS – template 2D**.
> Thông số hình ảnh: **PPU 16 · độ phân giải nội bộ 320×180 · tile 16×16 px · palette 48 màu**.

## 📚 Tài liệu (4 prompt → 4 sản phẩm)

| # | Tài liệu | Nội dung |
|---|---|---|
| 0 | [`docs/00-Tong-Quan.md`](docs/00-Tong-Quan.md) | Tổng quan gói, trạng thái từng hệ thống, cách bắt đầu nhanh |
| 1 | [`docs/01-GDD.md`](docs/01-GDD.md) | **GDD**: visual style pixel 2D, core loop, trồng trọt, chăn nuôi, chế biến, tương tác 2D + grid 16×16 px, 4 mùa & 8 thời tiết, 10 NPC + 13 lễ hội, kinh tế, HUD, audio, save, tech spec 2D, lộ trình 15 tháng |
| 2 | [`docs/02-Unity-Setup.md`](docs/02-Unity-Setup.md) | **Cách gắn script vào Object** (Unity 2D): Pixel Perfect Camera, cấu hình import texture, scene mẫu, Animator, xử lý sự cố |
| 3 | [`docs/03-Asset-2D-Sprite-Spec.md`](docs/03-Asset-2D-Sprite-Spec.md) | **Bảng đặc tả ~1.920 khung sprite**: tên, kích thước, số khung animation, palette, pivot, ngân sách thời gian, checklist QA |
| 4 | [`docs/04-Concept-Art-Prompts.md`](docs/04-Concept-Art-Prompts.md) | **Prompt Midjourney/DALL·E/SDXL**: 2 prompt gốc (bản pixel) + ~25 prompt theo mùa/thời tiết/asset sheet, negative prompt, workflow Aseprite |
| 5 | [`docs/05-Cach-Choi-Ban-Day-Du.md`](docs/05-Cach-Choi-Ban-Day-Du.md) | 🎮 **Cách chơi bản đầy đủ**: 3 cách chơi, checklist dựng Unity (60–90 phút), hướng dẫn chơi (điều khiển, vòng ngày, mùa vụ, 13 lễ hội, kinh tế, 10 NPC), tra cứu nhanh, xử lý sự cố |

## 💻 Mã nguồn — `unity/Assets/Scripts/` (22 file C#, ~4.470 dòng)

```
Core/       PixelArtGlobal · GameBootstrap · TimeManager · WeatherSystem · Enums · GameServices · WorldHelpers2D
Data/       CropData (4 sprite) · ItemData · SeasonTheme (tile + màu theo mùa)
Farming/    CropInstance (cây 4 giai đoạn) · FarmGrid (Tilemap + dữ liệu ô) · LootSpawner · ItemPickup
Player/     PlayerController2D (8 hướng) · PlayerInteractor2D (phím E)
Inventory/  Inventory (48→96 ô, tiền, phẩm chất ★–★★★)
NPC/        NPCRelationship2D (10 tim, quà tặng, lang thang) · NPCRegistry2D
Weather/    WeatherFX2D (mưa/tuyết/bão/sét/đom đóm + rung camera pixel)
UI/         HudController2D (đồng hồ, thời tiết, tiền, nước, XP, hotbar, prompt [E])
Save/       SaveSystem (JSON + checksum + migrate) · CropDatabase · ItemDatabase
```

### Tính năng cốt lõi đã code xong
- 🌱 Cây trồng **4 giai đoạn** (Hạt → Mầm → Trưởng thành → Có quả) = **4 sprite**, đổi theo ngày game.
- 💧 Yêu cầu nước: đất khô → héo → chết; mưa tưới miễn phí; mùa Đông/bão có thể giết cây.
- ⌨️ Bấm **E** để cuốc / tưới / gieo / thu hoạch — nhắm **ô lưới ngay trước mặt** (không raycast, rất nhẹ).
- 📦 **Nhả loot**: nảy parabol pixel, nhấp nhô 2 khung, nam châm hút, viền sáng theo phẩm chất.
- 🧱 Lưới bằng **Tilemap + mảng struct** — 200×200 ô vẫn chạy 60 fps, không tạo GameObject mỗi ô.
- 🗓️ 4 mùa đổi tile + màu nền **tại chỗ (không loading)**, ngày/đêm overlay, 8 loại thời tiết, dự báo 3 ngày.
- 👾 **Chống mờ & chống rung pixel**: ép Filter Point, tắt AA, snap camera nửa pixel, tự cảnh báo sprite import sai.
- ❤️ Quan hệ NPC 0–10 tim, quà tặng, NPC đi lang thang, tự về nhà khi tối/mưa.
- 💾 Save/load 3 khe + checksum, tự lưu khi ngủ, migrate save từ bản 3D cũ.

## 🎨 Concept art mẫu (`art/`)

| File | Nội dung |
|---|---|
| `concept-01-farm-overview.png` | Bản đồ trang trại top-down (mood Xuân) |
| `concept-02-gameplay.png` | Gameplay: nhân vật tưới cà chua + HUD pixel |
| `pixel-03-sprite-sheet.png` | Sprite sheet mẫu: cây, nhân vật 4 hướng, gia súc, công cụ |

Prompt đầy đủ (kèm tham số) nằm trong [`art/README.md`](art/README.md).

## 🎮 Chơi thử ngay (không cần Unity)

**[`playtest/index.html`](playtest/index.html)** — bản mô phỏng JS/Canvas của các hệ thống lõi (trồng trọt 4 giai đoạn,
nước, mùa/thời tiết, loot, bán hàng, NPC). Mở file bằng trình duyệt là chơi được, không cần internet.
Hướng dẫn & bảng đối chiếu: [`playtest/README.md`](playtest/README.md).

## 🚀 Bắt đầu nhanh

> Muốn chơi **bản đầy đủ**? Làm theo [`docs/05-Cach-Choi-Ban-Day-Du.md`](docs/05-Cach-Choi-Ban-Day-Du.md) — có checklist từng bước + thời gian ước tính.

1. Đọc [`docs/01-GDD.md`](docs/01-GDD.md) (mục 2 và 7 là phần pixel + tương tác).
2. Tạo project **Unity 6 – 2D** → copy `unity/Assets/Scripts` vào `Assets/`.
3. Làm theo [`docs/02-Unity-Setup.md`](docs/02-Unity-Setup.md):
   mục 0 (Pixel Perfect Camera + cấu hình import texture) → mục 1 (scene) → mục 2–4 (FarmGrid, CropInstance, Player).
4. Bấm **Play**: `1` + `E` cuốc đất → `8` + `E` gieo hạt → `2` + `E` tưới → cho ngày trôi → `E` thu hoạch.
5. Vẽ sprite theo [`docs/03-Asset-2D-Sprite-Spec.md`](docs/03-Asset-2D-Sprite-Spec.md); tạo mood bằng prompt ở
   [`docs/04-Concept-Art-Prompts.md`](docs/04-Concept-Art-Prompts.md).

## 🗺️ Lộ trình nội dung (GDD §15)

| Mốc | Thời điểm | Nội dung |
|---|---|---|
| M1 Prototype | Tháng 2 | Di chuyển 8 hướng, cuốc/gieo/tưới, 1 cây 4 sprite, vòng ngày, pixel camera ✅ *(code đã có)* |
| M2 Vertical Slice | Tháng 4 | Mùa Xuân đầy đủ, 6 cây, gà, shop, 3 NPC, 1 lễ hội |
| M3 Alpha | Tháng 8 | 4 mùa, 30 cây, 7 vật nuôi, 24 NPC, chế biến, save |
| M4 Beta | Tháng 12 | Polish, âm thanh, cân bằng, accessibility, localization |
| M5 Launch | Tháng 15 | Store page, trailer, demo festival, co-op beta |

---
*Made with 🧡 cho một thung lũng ấm cúng — 16 pixel một lần.*
