# HƯỚNG DẪN LẮP CODE VÀO UNREAL ENGINE 5 — *Vườn Mơ*

Đây là bản port tương đương của hệ thống Trồng trọt & Thu hoạch (Unity `CropInstance`) sang UE 5.3+.

---

## 1. Cấu trúc file

```
unreal/Source/VuonMo/
├── VuonMo.Build.cs
├── Public/
│   ├── Data/CropDataAsset.h                 ← "CropData" bản UE (Primary Data Asset)
│   ├── Core/GameTimeSubsystem.h             ← Đồng hồ ngày/mùa (thay TimeManager)
│   ├── Core/WeatherSubsystem.h              ← Thời tiết + dự báo 3 ngày
│   ├── Farming/CropActor.h                  ← CÂY TRỒNG 4 giai đoạn
│   └── Interaction/
│       ├── InteractableInterface.h          ← IInteractable bản UE (UINTERFACE)
│       └── PlayerFarmerComponent.h          ← Raycast + phím E + bình tưới
└── Private/
    ├── Core/GameTimeSubsystem.cpp
    ├── Core/WeatherSubsystem.cpp
    ├── Farming/CropActor.cpp
    └── Interaction/PlayerFarmerComponent.cpp
```

Copy thư mục `unreal/Source/VuonMo` vào `YourProject/Source/VuonMo` rồi thêm vào `<TênProject>.uproject`:

```json
"Modules": [
  { "Name": "VuonMo", "Type": "Runtime", "LoadingPhase": "Default" }
]
```

Sau đó chuột phải file `.uproject` → **Generate Visual Studio project files** → build.

---

## 2. GẮN SCRIPT VÀO ACTOR — các bước cụ thể

### 2.1 Tạo dữ liệu cây trồng (`UCropDataAsset`)

1. Trong Content Browser: `Content/Data/Crops/` → chuột phải → **Miscellaneous > Data Asset** → chọn **CropDataAsset** → đặt tên `DA_Crop_Tomato`.
2. Điền:
   - `CropId = tomato`, `DisplayName = Cà chua`
   - **StageMeshes** (4 phần tử, đúng thứ tự): `SM_Tomato_Seed`, `SM_Tomato_Sprout`, `SM_Tomato_Mature`, `SM_Tomato_Fruiting`
   - `DaysPerStage = [1, 2, 3, 2]`, `bNeedsWater = true`, `RequiredMoisture = 0.3`
   - `HarvestItem`: `ItemId = tomato`, `WorldActorClass = BP_Loot_Produce`
   - `HarvestVFX`: một Niagara System (ví dụ `NS_Leaves_Pop`)

### 2.2 Tạo Blueprint cây trồng

1. Chuột phải → **Blueprint Class** → tìm **CropActor** → đặt tên `BP_Crop_Tomato`.
2. Mở Blueprint → trong **Class Defaults**:
   - `Crop Data` → kéo `DA_Crop_Tomato` vào.
   - (Tuỳ chọn) mở **Components**: đã có sẵn `Root`, `LootOrigin` và 4 `StageComponents` (`Stage0_Seed` … `Stage3_Fruiting`). Nếu muốn model khác nhau theo Blueprint, gán Static Mesh trực tiếp cho từng component — code sẽ **ưu tiên mesh trong Blueprint** nếu bạn ghi đè, còn không thì load từ Data Asset.
3. Lưu & compile.

### 2.3 Gắn vào Level — 2 cách

**Cách A (động, giống Unity):** Blueprint `BP_FarmTileActor` gọi node **Spawn Actor from Class → BP_Crop_Tomato** tại vị trí ô đất khi người chơi gieo hạt, rồi gọi **Initialize Crop** (Data Asset, Tile, 0).

**Cách B (đặt tay để test):**
1. Kéo `BP_Crop_Tomato` vào Level.
2. Trong Details → `Crop Data` → chọn `DA_Crop_Tomato`.
3. `Owning Tile` → chọn `BP_FarmTile` tương ứng (Actor đang chứa cây).
4. Bấm **Play** → vào console gõ:
   `VuonMo.TimeDay 1` (hoặc gọi `GameTimeSubsystem → Sleep`) để thấy cây đổi giai đoạn.

### 2.4 Gắn vào Player Character

1. Mở `BP_ThirdPersonCharacter` (hoặc Character của bạn).
2. **Add Component** → tìm **Player Farmer Component**.
3. Trong Details: `Interact Reach = 300` (3 m), `Max Water Charges = 20`, `Current Tool = Hoe`.
4. Tạo Widget `WBP_HUD` có Text Block "Prompt", bind vào event **On Prompt Changed** của component.
5. Bấm **Play** → đi tới cây cà chua, HUD hiện `[E] Tưới nước`, bấm **E** → cây được tưới; khi chín → `[E] Thu hoạch` → loot spawn ra (`BP_Loot_Produce`).

---

## 3. Vòng đời cây trồng trong UE5 (so sánh với Unity)

| Giai đoạn | Unity (`CropInstance`) | Unreal (`ACropActor`) |
|---|---|---|
| Nghe sự kiện ngày mới | `TimeManager.OnDayChanged += HandleNewDay` | `GameTimeSubsystem.OnNewDay.AddDynamic(...)` |
| Đổi model 4 giai đoạn | Bật/tắt 4 `GameObject` con | Bật/tắt 4 `UStaticMeshComponent`; hoặc `SetStaticMesh()` nếu muốn tiết kiệm component |
| Tăng trưởng | `wateredDays++` khi đủ ẩm/mưa | Giống hệt (`WateredDays`) |
| Kiểm tra cần nước | `tile.moisture >= data.requiredMoisture` | `TileMoisture >= CropData->RequiredMoisture` (lấy qua BP interface `GetMoisture`) |
| Thu hoạch | `LootSpawner.SpawnLoot(...)` | `SpawnLoot()` → `SpawnActor<AActor>` + gọi event `SetLootAmount` |
| Tương tác E | `IInteractable` (C# interface) | `IInteractableInterface` (UINTERFACE, `Execute_Interact`) |
| Héo/chết | `GrowthStage.Withering` / `Dead` | `EGrowthStage::Withering` / `Dead` + Dynamic Material tint |

> **Mẹo tối ưu UE5:** với 1.000+ cây, đừng spawn 1 Actor/cây. Dùng **Instanced Static Mesh (ISM)** cho từng giai đoạn rồi chỉ giữ dữ liệu logic trong một `UDataAsset`/`UStruct` mảng — bản `ACropActor` này dùng cho số lượng vừa (≤ 400 cây/khu), đủ và dễ debug.

---

## 4. Kiểm thử nhanh trong UE5

```
1. Play In Editor
2. Console:  ke * VuonMo        → xem log
3. Gọi subsystem từ Blueprint:
     Get Game Instance → Get Subsystem (GameTimeSubsystem) → Sleep
   → mỗi cây nhận OnNewDay, cập nhật WateredDays và đổi mesh
4. Ép thời tiết mưa:
     Get Subsystem (WeatherSubsystem) → Force Weather (Rain)
   → cây được tính "có nước" miễn phí, không cần tưới
```
