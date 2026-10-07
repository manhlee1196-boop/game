# 🌱 VƯỜN MƠ — *Harvest Hearth*

Gói **Game Design Document + mã nguồn + đặc tả asset 3D + prompt concept art** cho một tựa game
**nông trại 3D góc nhìn thứ ba, phong cách cozy** (Animal Crossing × Stardew Valley).

> Đây là repo tài liệu & mã nguồn (không chứa Unity/Unreal Engine). Mở bằng Unity 6 (URP) hoặc UE 5.3+.

## 📚 Tài liệu (4 prompt → 4 sản phẩm)

| # | Tài liệu | Nội dung |
|---|---|---|
| 0 | [`docs/00-Tong-Quan.md`](docs/00-Tong-Quan.md) | Tổng quan gói, trạng thái từng hệ thống, cách bắt đầu nhanh |
| 1 | [`docs/01-GDD.md`](docs/01-GDD.md) | **Game Design Document**: visual style 3D, core loop, trồng trọt, chăn nuôi, chế biến, tương tác 3D + grid 2×2 m, 4 mùa & thời tiết, 10 NPC + 13 lễ hội, kinh tế, UI, audio, save, tech spec, lộ trình 18 tháng, so sánh Unity ↔ UE5 |
| 2 | [`docs/02-Unity-Setup.md`](docs/02-Unity-Setup.md) | **Hướng dẫn gắn script vào Object** (Unity), bảng phím, thứ tự thực thi, xử lý sự cố |
| 3 | [`docs/03-Asset-3D-Spec.md`](docs/03-Asset-3D-Spec.md) | **Bảng đặc tả ~370 asset 3D**: tên, phong cách, số polygon, animation, pivot/scale, ngân sách tris, checklist QA |
| 4 | [`docs/04-Concept-Art-Prompts.md`](docs/04-Concept-Art-Prompts.md) | **Bộ prompt Midjourney/DALL·E**: 2 prompt gốc + ~20 prompt nâng cấp, negative prompt, template sinh hàng loạt, workflow giữ nhất quán |
| + | [`unreal/README-Unreal-Setup.md`](unreal/README-Unreal-Setup.md) | Bản UE5 tương đương + hướng dẫn lắp vào Blueprint |

## 💻 Mã nguồn

```
unity/Assets/Scripts/          # Unity 6 URP · C# · 17 file ~3.500 dòng
├── Core/         TimeManager (ngày/mùa/năm) · WeatherSystem · Enums · GameServices (audio, HUD, XP…)
├── Data/         CropData (ScriptableObject 4 model) · ItemData
├── Farming/      CropInstance (cây 4 giai đoạn) · FarmTile · FarmGrid (lưới 2×2 m) · LootSpawner · ItemPickup
├── Interaction/  IInteractable · PlayerInteractor (phím E) · ThirdPersonController
├── Inventory/    Inventory (48→96 ô, tiền, phẩm chất)
├── NPC/          NPCRelationship (10 tim, quà tặng) · NPCRegistry
├── Weather/      WeatherVisualDriver (ánh sáng ngày/đêm, mưa/tuyết/bão)
└── Save/         SaveSystem (JSON + checksum) · CropDatabase · ItemDatabase

unreal/Source/VuonMo/          # Bản UE5 tương đương
├── Data/CropDataAsset.h · Core/GameTimeSubsystem · Core/WeatherSubsystem
├── Farming/CropActor (+ .cpp) · Interaction/InteractableInterface · PlayerFarmerComponent
```

### Tính năng cốt lõi đã code xong
- 🌱 Cây trồng **4 giai đoạn** (Hạt → Mầm → Trưởng thành → Có quả) đổi **4 model 3D**.
- 💧 Lớn theo **ngày game**, yêu cầu nước; thiếu nước → héo → chết; mưa tưới miễn phí.
- ⌨️ Bấm **E** để tưới / thu hoạch / cuốc đất / nói chuyện NPC (raycast + phễu quét).
- 📦 **Nhả loot** khi thu hoạch: rơi theo cụm, nam châm hút, viền sáng theo phẩm chất ★–★★★.
- 🗓️ Ngày/đêm, 4 mùa, 8 loại thời tiết, dự báo 3 ngày, ánh sáng & particle theo thời tiết.
- 🧱 Lưới **2×2 m**, đặt công trình snap với preview xanh/đỏ, xoay 90°.
- ❤️ Quan hệ NPC 0–10 tim, tặng quà, hội thoại theo thời tiết/giờ.
- 💾 Save/load JSON 3 khe + checksum, tự lưu khi ngủ.

## 🎨 Concept art mẫu (`art/`)

| File | Prompt |
|---|---|
| `concept-01-farm-isometric.png` | Bối cảnh trang trại tổng thể, góc isometric |
| `concept-02-character-watering.png` | Góc nhìn third-person, nhân vật tưới cà chua |

Xem [`art/README.md`](art/README.md) để có prompt đầy đủ (kèm tham số) và danh sách prompt còn lại.

## 🚀 Bắt đầu nhanh

1. Đọc [`docs/01-GDD.md`](docs/01-GDD.md) để nắm thiết kế.
2. Tạo project **Unity 6 (URP)** → copy `unity/Assets/Scripts` vào thư mục `Assets/` của project.
3. Làm theo [`docs/02-Unity-Setup.md`](docs/02-Unity-Setup.md) (mục 2–5) để gắn `CropInstance`, `FarmTile`, `Player`.
4. Bấm **Play** → cuốc đất (phím `1` + `E`) → gieo hạt → tưới nước (phím `2` + `E`) → cho ngày trôi → bấm `E` để thu hoạch.

## 🗺️ Lộ trình nội dung (theo GDD §15)

| Mốc | Thời điểm | Nội dung |
|---|---|---|
| M1 Prototype | Tháng 2 | Di chuyển, cuốc/gieo/tưới, 1 cây, vòng ngày ✅ *(code đã có)* |
| M2 Vertical Slice | Tháng 5 | 1 mùa Xuân, 6 cây, gà, shop, 3 NPC, 1 lễ hội |
| M3 Alpha | Tháng 9 | 4 mùa, 30 cây, 7 vật nuôi, 24 NPC, chế biến, save |
| M4 Beta | Tháng 13 | Polish, âm thanh, cân bằng, accessibility, localization |
| M5 Launch | Tháng 16–18 | Store page, trailer, demo festival, co-op beta |

---
*Made with 🧡 cho một thung lũng ấm cúng.*
