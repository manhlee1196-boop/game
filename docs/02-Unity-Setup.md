# HƯỚNG DẪN LẮP CODE VÀO UNITY 2D — *Vườn Mơ*

> Trả lời phần "**giải thích cách gắn Script vào Object**" cho bản **2D pixel top-down**.
> Code nằm trong `unity/Assets/Scripts/` → copy nguyên cây thư mục vào `Assets/` của project Unity 6.

---

## 0. Yêu cầu & thiết lập project

| Mục | Giá trị |
|---|---|
| Unity | 6 LTS (hoặc 2022.3 LTS) |
| Template | **2D (URP)** — hoặc 2D Built-in cũng chạy được (code không phụ thuộc URP) |
| Package | `2D Tilemap Editor`, `2D Sprite`, `2D Pixel Perfect`, `Unity UI` |
| PPU | **16** (khớp mọi texture) |
| Resolution nội bộ | **320×180**, upscale nguyên (×6 = 1080p) |
| Physics2D | Gravity `(0, 0)` — xem `Edit > Project Settings > Physics 2D` |
| Layers đề xuất | `Player` `NPC` `Interactable` `Collision` `Loot` `Water` `FarmTile` |
| Tag bắt buộc | GameObject người chơi phải có tag **`Player`** |

### Thiết lập Pixel Perfect Camera (bắt buộc để không mờ/rung)
1. Chọn **Main Camera** → Add Component → **Pixel Perfect Camera**.
2. Đặt: `Assets Pixels Per Unit = 16`, `Reference Resolution = 320 × 180`, `Upscale Render Texture = ✔`, `Pixel Snapping = ✔`, `Crop Frame = Off`, `Stretch Fill = ✔` (để giữ tỉ lệ khi cửa sổ lạ thường).
3. Camera: **Projection = Orthographic**, `Size = 5.625` (= 180 / 16 / 2).
4. Gắn thêm script `PixelArtGlobal` vào `GameManagers` — nó sẽ **snap camera nửa pixel** mỗi `LateUpdate` và **cảnh báo sprite import sai**.

### Cấu hình import MỌI texture pixel art
Chọn file PNG → Inspector:
```
Texture Type      = Sprite (2D and UI)
Sprite Mode       = Multiple (nếu là sprite sheet) / Single
Pixels Per Unit   = 16
Mesh Type         = Full Rect
Extrude Edges     = 0
Filter Mode       = Point (no filter)      ← BẮT BUỘC
Compression       = None                    ← BẮT BUỘC
Generate Mip Maps = OFF                     ← BẮT BUỘC
Wrap Mode         = Clamp
Max Size          = 2048
```
> Mẹo: chọn nhiều file cùng lúc → sửa 1 lần cho cả loạt. Hoặc viết một `AssetPostprocessor` để tự áp (nằm trong `Assets/Editor/PixelArtImporter.cs`).

---

## 1. Cấu trúc Scene chuẩn

```
SampleScene
├── GameManagers                ← GẮN: PixelArtGlobal, TimeManager, WeatherSystem, Inventory,
│   │                                   LootSpawner, AudioManager, FloatingText, PlayerStats,
│   │                                   GameManager, NPCRegistry2D, GameBootstrap
│   └── UI_Canvas (Screen Space - Overlay, Canvas Scaler = Scale With Screen Size 320×180)
│       ├── HUD                 ← GẮN: HudController2D
│       │   ├── ClockLabel / DayLabel / SeasonLabel / WeatherLabel / WeatherIcon
│       │   ├── GoldLabel / WaterGauge / WaterLabel / XpFill / LevelLabel
│       │   ├── PromptPanel + PromptLabel       (khung "[E] Tưới nước")
│       │   ├── Hotbar (8 Image) + ToastLabel
│       └── TalkBubble, ShopCanvas, PauseCanvas …
├── Grid                        ← GẮN: Grid (Cell Size = 1,1,0) — component có sẵn của Unity
│   ├── Tilemap_Ground          ← Tilemap + TilemapRenderer (Sorting Layer: Ground)
│   ├── Tilemap_Soil            ← Tilemap + TilemapRenderer (layer: Farm)
│   ├── Tilemap_Decor           ← Tilemap + TilemapRenderer (layer: Decor)
│   ├── Tilemap_Building        ← Tilemap + TilemapRenderer (layer: Buildings)
│   ├── Tilemap_Collision       ← Tilemap + TilemapRenderer (ẩn) + TilemapCollider2D
│   │                                    + CompositeCollider2D (Geometry Type: Polygons)
│   └── FarmGrid                ← GẮN: FarmGrid  (kéo 3 Tilemap trên vào ô tương ứng)
├── CropContainer               ← node cha chứa mọi cây trồng (gán vào FarmGrid.cropParent)
├── LootContainer               ← node cha chứa loot (gán vào LootSpawner.lootParent)
├── Player                      ← Tag = Player
│   ├── Visual (SpriteRenderer 16×24, pivot Bottom Center) + Animator
│   ├── Shadow (ellipse 12×5)
│   └── (Rigidbody2D + CapsuleCollider2D + YSort2D)
├── NPCs / BuildingProps        ← YSort2D trên từng object
├── WeatherFX                   ← GẮN: WeatherFX2D  (Rain/Snow/Leaves/Fireflies particles)
├── DayNightOverlay             ← SpriteRenderer 1×1 pixel trắng + GẮN: DayNightTint2D
└── CameraRig / Main Camera     ← Pixel Perfect Camera + CameraFollow2D + YSort2D(Optional)
```

---

## 2. GẮN SCRIPT CÂY TRỒNG (CropInstance) — 2 CÁCH

### CÁCH A — Data-driven (khuyên dùng)

**Bước 1:** Chuột phải trong Project → `Create > Vườn Mơ > Crop Data` → đặt tên `Crop_Tomato`.

**Bước 2:** Kéo **4 sprite** vào mảng `Stage Sprites` theo đúng thứ tự:

| Index | Giai đoạn | Ví dụ file |
|---|---|---|
| `0` | Hạt giống | `crop_tomato_seed.png` |
| `1` | Mầm | `crop_tomato_sprout.png` |
| `2` | Trưởng thành | `crop_tomato_adult.png` |
| `3` | Có quả (chín) | `crop_tomato_ripe.png` |

Kéo tiếp `witheringSprite`, `deadSprite`, `harvestSprite` (+ bản `_silver`, `_gold`, `_rainbow`), và **`icon`** (16×16 cho hotbar).

**Bước 3:** Điền thông số: `daysPerStage = [1,2,3,2]`, `needsWater = ✔`, `requiredMoisture = 0.3`, `regrows = ✔`, `harvestItem` = asset `Item_Tomato`, `minYield/maxYield`.

**Bước 4:** Tạo `CropDatabase` (`Create > Vườn Mơ > Crop Database`) rồi kéo **tất cả CropData** vào danh sách — cần cho việc tra cứu khi load save.

**Bước 5:** Trong scene, tạo **1 prefab duy nhất** `Crop_Base`:
```
Crop_Base (GameObject rỗng)
└── Visual     (SpriteRenderer, sorting layer: Crops, pivot Bottom Center)
└── (gắn CropInstance, kéo Visual vào ô "Visual")
```
Gán prefab này vào `FarmGrid.cropPrefab`. **Không cần kéo tay từng cây vào scene** — khi người chơi gieo hạt, `FarmGrid.Plant()` sẽ tự `Instantiate` và gán sprite theo `CropData`.

### CÁCH B — Gắn tay vào prefab (để test nhanh 1 cây)

1. Tạo GameObject `Crop_Tomato_Test` (đặt trong scene, ngay trên ô đất).
2. Thêm con `Visual` với **SpriteRenderer** ở `localPosition = (0, 0)`, **pivot = Bottom Center**.
3. Chọn `Crop_Tomato_Test` → **Add Component → Crop Instance**.
4. Trong Inspector:
   - `Data` → kéo `Crop_Tomato` (asset vừa tạo).
   - `Visual` → kéo object `Visual` vào.
   - `Ripe Glow` (tuỳ chọn) → 1 SpriteRenderer con hiển thị `crop_tomato_glow.png` (để trống nếu không dùng).
   - `Shadow` (tuỳ chọn) → sprite bóng ellipse.
5. Gắn thêm `YSort2D` vào `Crop_Tomato_Test` để cây che/bị che đúng khi nhân vật đi qua.
6. **Bấm Play** → tăng `wateredDays` trong Inspector khi đang chạy để thấy sprite đổi theo giai đoạn.

> Nếu `CropInstance` không nằm trong lưới, hãy gọi `Initialize(data, FarmGrid.Instance, cell, season)` từ một script test, hoặc để `FarmGrid.Plant()` tạo giúp.

---

## 3. GẮN SCRIPT Ô ĐẤT (FarmGrid + Tilemap)

1. Tạo **Grid** (GameObject > 2D Object > Tilemap > Rectangular) → Unity tự tạo `Tilemap` con.
2. Tạo thêm 3 Tilemap con nữa: `Tilemap_Soil`, `Tilemap_Decor`, `Tilemap_Building` (mỗi cái có `Tilemap` + `TilemapRenderer`).
3. Vẽ nền cỏ bằng **Rule Tile** (`Assets > Create > 2D > Tiles > Rule Tile`) để tự nối viền.
4. Thêm GameObject `FarmGrid` → **Add Component → Farm Grid**; kéo:
   - `groundTilemap` → `Tilemap_Ground`
   - `soilTilemap` → `Tilemap_Soil`
   - `decorTilemap` → `Tilemap_Decor`
   - `grassTile` / `tilledTile` / `wateredTile` / `weedTile` / `pestTile` → các Tile asset tương ứng (mỗi Tile = 1 sprite 16×16, Collider Type = None)
   - `cropPrefab` → `Crop_Base`, `cropParent` → `CropContainer`
   - `width` / `height` → kích thước bản đồ (ví dụ 80×80)
5. **Va chạm:** vẽ tường/nước/hàng rào trên `Tilemap_Collision` (TilemapRenderer tắt) → `TilemapCollider2D` + `CompositeCollider2D` (Geometry Type = **Polygons**), Rigidbody2D = Static.
6. **Không cần collider cho ô đất nông nghiệp** — việc nhắm mục tiêu là theo toạ độ lưới (nhanh hơn raycast rất nhiều).

---

## 4. GẮN SCRIPT NGƯỜI CHƠI

1. Tạo GameObject `Player` (**Tag = Player**, Layer = `Player`):
   - `Rigidbody2D`: **Body Type = Dynamic**, `Gravity Scale = 0`, `Freeze Rotation Z = ✔`, `Collision Detection = Continuous`, `Interpolate = Interpolate`.
   - `CapsuleCollider2D`: size `(0.6, 0.35)`, offset `(0, -0.25)` (chỉ phần chân → đi sát tường/hàng rào vẫn đẹp).
2. Thêm con `Visual` (SpriteRenderer 16×24, pivot **Bottom Center**) + `Animator` có các parameter:

| Parameter | Kiểu | Ý nghĩa |
|---|---|---|
| `Speed` | Float | 0 = idle, >0 = walk/run |
| `Direction` | Int | 0 = Down, 1 = Left, 2 = Right, 3 = Up |
| `UseTool` | Trigger | Phát animation cuốc/tưới/thu hoạch |
| `ToolType` | Int | 0–7 chọn animation công cụ tương ứng |

3. **Add Component → Player Controller 2D** (kéo `Visual`, `Animator`, `Shadow` vào).
4. **Add Component → Player Interactor 2D**:
   - `reachCells = 1`
   - `interactableMask` → tick layer `Interactable` (cho NPC, giếng, giường, thùng)
   - `maxWaterCharges = 20`
5. **Add Component → YSort2D** (để nhân vật đi sau cây bị che đúng).
6. **Camera follow:** tạo script `CameraFollow2D` (hoặc dùng Cinemachine 2D với `Framing Transposer`, dead-zone 2×2 tile), gắn vào Main Camera. `PixelArtGlobal` sẽ tự snap.

### Bảng phím

| Phím | Hành động |
|---|---|
| `WASD` / mũi tên | Di chuyển 8 hướng |
| `Left Shift` | Chạy |
| **`E`** | **Tương tác: cuốc / tưới / gieo / thu hoạch / nói chuyện** |
| `1`–`6` | Cuốc · Bình tưới · Liềm · Rìu · Cuốc chim · Cần câu |
| `8` / `Q` | Túi hạt giống (dùng hạt đang chọn) |
| Cuộn chuột | Đổi công cụ nhanh |
| `Tab` | Túi đồ |
| `M` | Bản đồ |
| `P` | Chụp ảnh (giấu HUD) |
| `Esc` | Pause |

---

## 5. Animator Controller cho nhân vật

- Tạo **Blend Tree 2D (Simple Directional)** hoặc 4 state theo `Direction`, mỗi state có `Idle` (2 khung) → `Walk` (4 khung, 8 fps) → `Run` (6 khung, 10 fps).
- Cách gọn nhất: **1 Blend Tree** với 2 tham số `Speed` (0–7) và `Direction` (0–3), dùng 4 cột sprite sheet.
- **Animation Events:** đặt event ở khung "chạm đất" của clip Hoe/Water để gọi `AudioManager.PlayHoe()` và sinh particle — đúng thời điểm, không lệch cảm giác.
- **Cây trồng không có Animator** — "animation" của cây là **đổi sprite theo giai đoạn** + **component `SimpleFrameAnimator2D`** cho hiệu ứng lay/nhấp nháy.

---

## 6. Thứ tự thực thi script (Script Execution Order)

| Script | Thứ tự |
|---|---|
| `PixelArtGlobal` | −500 |
| `TimeManager` | −200 |
| `WeatherSystem` | −190 |
| `Inventory` | −100 |
| `FarmGrid` | −50 |
| `CropInstance`, `ItemPickup`, `NPCRelationship2D` | 0 |
| `PlayerController2D`, `PlayerInteractor2D` | 10 |
| `YSort2D` | 100 |
| `WeatherFX2D`, `DayNightTint2D` | 150 (LateUpdate) |
| `HudController2D` | 200 |

---

## 7. Kiểm thử nhanh (1 phút)

1. Bấm **Play**. Vào `GameManagers > TimeManager`, đổi `minutesPerSecond = 60` để ngày trôi cực nhanh khi test.
2. Chọn `1` (Cuốc) → đứng cạnh ô cỏ → bấm **E** → ô đổi sang tile đất đã cuốc.
3. Chọn `8` (Túi hạt) sau khi gán `selectedSeed` → bấm **E** → cây xuất hiện ở giai đoạn Hạt.
4. Chọn `2` (Bình tưới) → bấm **E** → tile đất sẫm lại, thanh nước giảm 1 vạch.
5. Chờ ngày trôi (hoặc gọi `TimeManager.Instance.Sleep(false)` từ nút debug) → cây đổi sprite lên Mầm.
6. Sau `Σ daysPerStage` ngày có nước → cây ở giai đoạn chín (**nhấp nháy**) → bấm **E** → loot rơi ra và bị hút vào túi.

### Sự cố thường gặp

| Triệu chứng | Nguyên nhân | Cách sửa |
|---|---|---|
| Hình bị **mờ / nhoè** | Filter Mode ≠ Point, hoặc Compression ≠ None | Sửa trong Inspector texture (hoặc chạy `PixelArtGlobal > Kiểm tra toàn bộ sprite`) |
| Hình **rung giật** khi camera đi | Camera không snap, hoặc dùng scale lẻ | Bật `PixelArtGlobal.snapCamera`, đặt `Upscale Render Texture = ✔` trong Pixel Perfect Camera |
| Pixel **nhoè ở viền** | Sprite bị scale ≠ 1 hoặc dùng Rect tool kéo giãn | Reset `Transform.scale = 1`; thay đổi kích thước bằng cách vẽ lại sprite |
| Bấm E không có gì xảy ra | `interactableMask` chưa tick layer, hoặc `FarmGrid.Instance` null | Tick layer `Interactable`; đảm bảo `FarmGrid` có trong scene và chạy trước |
| Cây không lớn | Đất khô (moisture < required) và không mưa | Tưới cây, hoặc test bằng `WeatherSystem.ForceWeather(Rain)` |
| Nhân vật đi **xuyên qua** cây/nhà | Thiếu `TilemapCollider2D` trên `Tilemap_Collision` | Vẽ collision tile + thêm `CompositeCollider2D` |
| Nhân vật bị **cây che sai** | Thiếu `YSort2D` | Gắn `YSort2D` cho cả Player, cây, NPC, loot |
| Sprite hiện **ô hồng** | Thiếu sprite reference trong `CropData` | Kiểm tra mảng `stageSprites` đủ 4 phần tử |
| Loot rơi nhưng không nhặt được | Loot nằm ngoài `magnetRadius` hoặc túi đầy | Tăng `magnetRadius`, hoặc bật `LootSpawner.autoCollect = true` |

---

## 8. Chạy thử không cần Unity?

Repo này chỉ chứa **mã nguồn + tài liệu** (Unity không nằm trong Git theo convention: không commit `Library/`, `Temp/`, `Build/`).
Các script đã được kiểm tra cú pháp (cân bằng ngoặc/khối) nhưng **chưa compile trong Unity Editor** — hãy mở project Unity để kiểm chứng thực tế.
