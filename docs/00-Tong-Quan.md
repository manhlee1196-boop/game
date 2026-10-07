# 🌱 VƯỜN MƠ (*Harvest Hearth*) — Gói thiết kế & mã nguồn (bản 2D PIXEL)

Bộ tài liệu + code cho tựa game **nông trại 2D pixel art top-down, phong cách cozy** (Stardew Valley × Harvest Moon × Animal Crossing).

## Bản đồ 4 prompt → sản phẩm

| Prompt | Nội dung yêu cầu | Sản phẩm trong repo |
|---|---|---|
| **1. GDD** | Game Design Document chi tiết | 📄 [`docs/01-GDD.md`](01-GDD.md) — 16 mục: **visual style pixel 2D (320×180 @ PPU 16, palette 48 màu)**, core loop, trồng trọt, chăn nuôi, chế biến, tương tác 2D, grid 16×16 px, 4 mùa & 8 thời tiết, 10 NPC + 13 lễ hội, kinh tế, HUD pixel, audio, save, tech spec 2D, lộ trình 15 tháng |
| **2. Code** | CropScript 4 giai đoạn + E để tưới/thu hoạch + spawn loot + cách gắn script | 💻 [`unity/Assets/Scripts/`](../unity/Assets/Scripts/) (**22 file C#**) · 📄 [`docs/02-Unity-Setup.md`](02-Unity-Setup.md) |
| **3. Bảng asset** | Danh sách asset kèm polygon/animation, phân nhóm | 📄 [`docs/03-Asset-2D-Sprite-Spec.md`](03-Asset-2D-Sprite-Spec.md) — **~1.920 khung sprite**, 4 nhóm, kích thước/kHung animation/palette, checklist QA |
| **4. Prompt concept art** | Câu lệnh cho Midjourney/DALL·E | 📄 [`docs/04-Concept-Art-Prompts.md`](04-Concept-Art-Prompts.md) — 2 prompt gốc (bản pixel) + ~25 prompt theo mùa/thời tiết/asset sheet + workflow Aseprite |

## Cấu trúc repo

```
game/
├── README.md
├── docs/
│   ├── 00-Tong-Quan.md                ← bạn đang ở đây
│   ├── 01-GDD.md                      ← Prompt 1
│   ├── 02-Unity-Setup.md              ← Prompt 2 (lắp script vào Unity 2D)
│   ├── 03-Asset-2D-Sprite-Spec.md     ← Prompt 3
│   └── 04-Concept-Art-Prompts.md      ← Prompt 4
├── playtest/                          ← bản CHƠI THỬ trên trình duyệt (JS/Canvas, không cần Unity)
├── unity/Assets/Editor/              ← 4 TOOL dựng nhanh (menu "Vườn Mơ": sinh sprite tạm · tạo dữ liệu · dựng scene · kiểm tra)
├── unity/Assets/Scripts/              ← code Unity 2D (C#, 23 file)
│   ├── Core/         PixelArtGlobal · GameBootstrap · TimeManager · WeatherSystem · Enums · GameServices · WorldHelpers2D · CameraFollow2D
│   ├── Data/         CropData (4 sprite) · ItemData · SeasonTheme
│   ├── Farming/      CropInstance · FarmGrid (Tilemap + dữ liệu) · LootSpawner · ItemPickup
│   ├── Player/       PlayerController2D · PlayerInteractor2D (phím E)
│   ├── Inventory/    Inventory
│   ├── NPC/          NPCRelationship2D · NPCRegistry2D
│   ├── Weather/      WeatherFX2D
│   ├── UI/           HudController2D
│   └── Save/         SaveSystem · CropDatabase · ItemDatabase
└── art/              3 ảnh concept pixel art sinh từ Prompt 4
```

## Trạng thái "làm được gì ngay"

| Hệ thống | Trạng thái | Ghi chú |
|---|---|---|
| Chống mờ / chống rung pixel | ✅ | `PixelArtGlobal`: ép Filter Point, tắt AA, snap camera nửa pixel, **tự cảnh báo sprite import sai** |
| Di chuyển 8 hướng, sprite 4 hướng | ✅ | `PlayerController2D` (Rigidbody2D + Animator 4 tham số) |
| Cây trồng **4 giai đoạn = 4 sprite** | ✅ | `CropInstance` + `CropData.stageSprites[4]` |
| Lớn theo ngày game, cần nước, héo/chết | ✅ | Nghe `OnDayChanged`, đọc độ ẩm ô đất + thời tiết |
| Bấm **E** để tưới / thu hoạch | ✅ | `PlayerInteractor2D` nhắm **ô lưới trước mặt** + ưu tiên `Interactable2D` (NPC/giếng/giường) |
| **Nhả loot** khi thu hoạch | ✅ | `LootSpawner` (parabol pixel) + `ItemPickup` (bob 2 khung, nam châm hút, viền sáng theo phẩm chất) |
| Lưới đất bằng Tilemap + dữ liệu struct | ✅ | `FarmGrid` — **không tạo GameObject mỗi ô**, 200×200 ô vẫn nhẹ |
| 4 mùa đổi tile + màu nền | ✅ | `SeasonTheme` + `FarmGrid.ApplySeasonTheme()` (đổi tại chỗ, không loading) |
| Ngày/đêm + mưa/tuyết/bão/sét | ✅ | `DayNightTint2D` + `WeatherFX2D` (rung camera 1.5 px, nháy sét 2 khung) |
| Y-sort nhân vật đi sau cây | ✅ | `YSort2D` |
| Túi đồ, tiền, tim NPC, save/load | ✅ | `Inventory`, `NPCRelationship2D`, `SaveSystem` (3 khe + checksum + migrate) |
| HUD pixel đầy đủ | ✅ | `HudController2D` (đồng hồ, thời tiết, tiền, nước, XP, hotbar, prompt [E], toast) |
| Chăn nuôi, chế biến, lễ hội, co-op | 📋 Đặc tả trong GDD | Chờ triển khai ở milestone M2–M3 |

## Bắt đầu nhanh

**Đường nhanh (~10 phút):** copy `unity/Assets/` vào project Unity 6 – 2D → menu **`Vườn Mơ ▸ 3 · DỰNG SCENE MẪU`** → bấm Play. Tool tự sinh sprite tạm + dữ liệu + cả scene.
Chi tiết & việc còn phải làm tay: `docs/05-Cach-Choi-Ban-Day-Du.md` Phần B.

**Đường thủ công (để hiểu từng chi tiết):**

1. **Đọc GDD** → `docs/01-GDD.md` (mục 2: đặc tả pixel; mục 7: tương tác & grid).
2. **Tạo project Unity 6 – template 2D** → copy `unity/Assets/Scripts` vào `Assets/`.
3. **Làm theo** `docs/02-Unity-Setup.md` mục 0 (Pixel Perfect Camera + import texture) rồi mục 1–4 (scene, FarmGrid, CropInstance, Player).
4. **Bấm Play** → `1` + `E` cuốc đất → `8` + `E` gieo hạt → `2` + `E` tưới → để ngày trôi → `E` thu hoạch.
5. **Vẽ sprite** theo `docs/03-Asset-2D-Sprite-Spec.md`, tạo mood trước bằng prompt ở `docs/04-Concept-Art-Prompts.md`.
6. **Muốn chơi ngay mà chưa dựng Unity?** → `playtest/index.html` (bản chơi thử trên trình duyệt).
7. **Hướng dẫn chơi đầy đủ** (điều khiển, vòng ngày, mùa vụ, lễ hội, kinh tế) → `docs/05-Cach-Choi-Ban-Day-Du.md`.

> Tài liệu là **living document** — thay đổi cân bằng ghi vào Changelog cuối GDD.
> Bản 3D low-poly trước đây vẫn nằm trong **lịch sử git** (commit `899b8e0`) nếu bạn muốn tham khảo lại.
