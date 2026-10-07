# 🌱 VƯỜN MƠ (*Harvest Hearth*) — Gói Thiết kế & Mã nguồn hoàn chỉnh

Bộ tài liệu + code này là kết quả thực thi **4 prompt** trong yêu cầu, cho tựa game nông trại 3D góc nhìn thứ ba phong cách cozy (Animal Crossing × Stardew Valley).

## Bản đồ 4 prompt → sản phẩm đã làm

| Prompt | Nội dung yêu cầu | Sản phẩm trong repo |
|---|---|---|
| **1. GDD** | Game Design Document chi tiết | 📄 [`docs/01-GDD.md`](01-GDD.md) — 16 mục: visual style, core loop, farming, chăn nuôi, chế biến, tương tác 3D, grid, thời tiết/mùa, NPC & 13 lễ hội, kinh tế, UI, audio, save, tech spec, lộ trình, so sánh Unity↔UE5 |
| **2. Code** | CropScript 4 giai đoạn + tương tác E + spawn loot + hướng dẫn gắn script | 💻 [`unity/Assets/Scripts/`](../unity/Assets/Scripts/) (17 file C#) · [`unreal/Source/VuonMo/`](../unreal/Source/VuonMo/) (bản UE5) · 📄 [`docs/02-Unity-Setup.md`](02-Unity-Setup.md) |
| **3. Bảng asset 3D** | Danh sách asset kèm polygon, animation, phân nhóm | 📄 [`docs/03-Asset-3D-Spec.md`](03-Asset-3D-Spec.md) — ~370 asset, 4 nhóm, ngân sách tris, checklist QA |
| **4. Prompt concept art** | Câu lệnh dùng cho Midjourney/DALL·E | 📄 [`docs/04-Concept-Art-Prompts.md`](04-Concept-Art-Prompts.md) — 2 prompt gốc + ~20 prompt nâng cấp, negative prompt, workflow nhất quán |

## Cấu trúc repo

```
game/
├── README.md
├── docs/
│   ├── 00-Tong-Quan.md            ← bạn đang ở đây
│   ├── 01-GDD.md                  ← Prompt 1 (Game Design Document)
│   ├── 02-Unity-Setup.md          ← Prompt 2 (hướng dẫn lắp script vào Unity)
│   ├── 03-Asset-3D-Spec.md        ← Prompt 3 (bảng đặc tả asset 3D)
│   └── 04-Concept-Art-Prompts.md  ← Prompt 4 (prompt tạo concept art)
├── unity/Assets/Scripts/          ← mã nguồn Unity 6 (URP), C#
│   ├── Core/       TimeManager · WeatherSystem · Enums · GameServices
│   ├── Data/       CropData (ScriptableObject) · ItemData
│   ├── Farming/    CropInstance · FarmTile · FarmGrid · LootSpawner · ItemPickup
│   ├── Interaction/ IInteractable · PlayerInteractor · ThirdPersonController
│   ├── Inventory/  Inventory
│   ├── NPC/        NPCRelationship · NPCRegistry
│   ├── Weather/    WeatherVisualDriver
│   └── Save/       SaveSystem · CropDatabase · ItemDatabase
├── unreal/         bản UE5 tương đương + hướng dẫn
└── art/            ảnh concept art mẫu sinh từ Prompt 4
```

## Trạng thái "làm được gì ngay"

| Hệ thống | Trạng thái | Ghi chú |
|---|---|---|
| Đồng hồ ngày/mùa/năm + event | ✅ Code xong | `TimeManager` phát `OnDayChanged` — không dùng `Update()` cho từng cây |
| Cây trồng 4 giai đoạn + 4 model | ✅ Code xong | `CropInstance` / `ACropActor` |
| Tưới nước, thiếu nước → héo → chết | ✅ Code xong | Đọc độ ẩm `FarmTile` + thời tiết |
| Bấm **E** để tưới / thu hoạch | ✅ Code xong | `PlayerInteractor` + `IInteractable` |
| Nhả loot khi thu hoạch | ✅ Code xong | `LootSpawner` + `ItemPickup` (nam châm hút, phẩm chất có viền sáng) |
| Phẩm chất ★ / ★★ / ★★★ | ✅ Code xong | Ảnh hưởng giá bán, có hệ số trong `QualityUtil` |
| Lưới 2×2 m + đặt công trình snap | ✅ Code xong | `FarmGrid` với preview xanh/đỏ |
| Thời tiết theo mùa + dự báo 3 ngày | ✅ Code xong | `WeatherSystem` |
| Ánh sáng ngày/đêm + mưa/tuyết/bão | ✅ Code xong | `WeatherVisualDriver` |
| Túi đồ, tiền, quan hệ NPC, save/load | ✅ Code xong | JSON + checksum |
| Chăn nuôi, chế biến, lễ hội, co-op | 📋 Đặc tả trong GDD | Chờ triển khai theo milestone M2–M3 |

## Bắt đầu nhanh

1. **Đọc GDD** → `docs/01-GDD.md`.
2. **Tạo project Unity 6 (URP)** → copy `unity/Assets/Scripts` vào `Assets/`.
3. **Làm theo** `docs/02-Unity-Setup.md` mục 2–4 để gắn `CropInstance`, `FarmTile`, `Player`.
4. **Bấm Play** → thử tưới cây, cho ngày trôi qua, thu hoạch.
5. **Làm asset** theo `docs/03-Asset-3D-Spec.md`, dùng prompt ở `docs/04-Concept-Art-Prompts.md` để vẽ concept trước.

> Tài liệu là **living document** — mọi thay đổi cân bằng nên ghi vào mục Changelog ở cuối GDD.
