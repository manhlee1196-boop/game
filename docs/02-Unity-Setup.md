# HƯỚNG DẪN LẮP CODE VÀO UNITY — *Vườn Mơ*

> Trả lời trực tiếp phần "**Đi kèm giải thích ngắn gọn cách gắn Script này vào Object trong Game Engine**" của Prompt 2.
> Code nằm trong `unity/Assets/Scripts/` → copy nguyên cây thư mục vào `Assets/` của project Unity 6 (URP).

---

## 0. Yêu cầu môi trường

| Mục | Giá trị |
|---|---|
| Unity | 6 LTS (hoặc 2022.3 LTS), render pipeline **URP** |
| Package cần có | Input System (hoặc dùng Input cũ — code hiện tại dùng API cũ cho dễ hiểu), TextMeshPro (tuỳ chọn cho UI), Unity UI |
| Scripting Backend | IL2CPP (khi build Switch/console), Mono khi dev |
| Layer đề xuất | `Player`, `Interactable`, `FarmTile`, `Terrain`, `Water`, `Building`, `Animal`, `NPC` |
| Tag bắt buộc | GameObject người chơi phải có tag **`Player`** (loot tự tìm, save/load) |

---

## 1. Cấu trúc Scene chuẩn

```
SampleScene
├── GameManagers                ← GẮN: TimeManager, WeatherSystem, Inventory, LootSpawner,
│   │                                   AudioManager, FloatingText, PlayerStats, GameManager, NPCRegistry
│   ├── DayNightLighting        ← GẮN: WeatherVisualDriver (Directional Light là con)
│   │   ├── Directional Light (Sun)
│   │   ├── RainParticles / SnowParticles / StormDebris / Fireflies
│   ├── LootContainer           ← node cha chứa loot rơi ra
│   └── UI_Canvas
│       ├── HudClock            ← GẮN: HudClock (gán Text: clockLabel, dayLabel, weatherLabel, goldLabel)
│       ├── ToastLabel (Text)   ← gán vào FloatingText.toastLabel
│       └── PromptLabel (Text)  ← nghe event PlayerInteractor.OnPromptChanged
├── FarmGrid                    ← GẮN: FarmGrid (tileSize = 2)
│   └── Tile_0_0 ... Tile_59_59 ← mỗi ô GẮN: FarmTile (có BoxCollider ở mặt đất)
├── Player                      ← GẮN: ThirdPersonController + PlayerInteractor
│   ├── PlayerCameraRoot        ← gán vào ThirdPersonController.cameraPivot
│   │   └── Main Camera
│   ├── Visual (SkinnedMesh)    ← Animator đặt ở đây
│   └── GroundCheck
├── NPC_Hoa / NPC_Bay / ...     ← GẮN: NPCRelationship (có CapsuleCollider)
└── WaterSources                ← Giếng, hồ: GẮN: WaterSource
```

---

## 2. GẮN SCRIPT CÂY TRỒNG (CropInstance / “CropScript”) — 2 CÁCH

### CÁCH A — Dùng ScriptableObject (khuyên dùng, đúng chuẩn data-driven)

**Bước 1 — Tạo dữ liệu cây:** Chuột phải trong Project → `Create > Vườn Mơ > Crop Data` → đặt tên `Crop_Tomato`.

**Bước 2 — Gán 4 model 3D vào asset đó:** kéo 4 prefab (hoặc 4 mesh) vào mảng `Stage Prefabs` theo đúng thứ tự:

| Index | Giai đoạn | Ví dụ prefab |
|---|---|---|
| `0` | Hạt giống | `CROP_Tomato_Stage01` |
| `1` | Mầm | `CROP_Tomato_Stage02` |
| `2` | Trưởng thành | `CROP_Tomato_Stage03` |
| `3` | Có quả (chín) | `CROP_Tomato_Stage04` |

> Nếu model chỉ là **Mesh** (không phải prefab) thì kéo vào mảng `Stage Meshes` — code sẽ tự dựng `MeshFilter/MeshRenderer`. Cách này nhẹ hơn và không tạo quá nhiều GameObject.

**Bước 3 — Điền thông số:** `daysPerStage = [1,2,3,2]`, `needsWater = ✔`, `requiredMoisture = 0.3`, `regrows = ✔`, `harvestItem` = asset Item_Cà chua, `minYield/maxYield`…

**Bước 4 — Trong scene:** chỉ cần `FarmTile` là đủ. Người chơi bấm **E** trên ô đất → code gọi `FarmTile.Plant(data)` → tự tạo GameObject cây và gắn `CropInstance` bằng `AddComponent`. **Không cần kéo tay từng cây vào scene.**

### CÁCH B — Gắn tay vào Prefab (để test nhanh 1 cây)

1. Trong Hierarchy, tạo Empty `Crop_Tomato_Test` (đặt tại vị trí ô đất).
2. Kéo 4 model con vào làm **con của nó**, đặt tên `Stage0_Seed` … `Stage3_Fruiting`, `localPosition = (0,0,0)`, `localRotation = identity`, **bỏ tick** ở cả 4 (code sẽ tự bật cái cần thiết).
3. Chọn `Crop_Tomato_Test` → **Add Component** → tìm **Crop Instance** (script `CropInstance.cs`).
4. Trong Inspector của component:
   - **Data** → kéo `Crop_Tomato` (asset vừa tạo). Nếu bỏ trống, cây vẫn chạy nhưng không có thông số thu hoạch.
   - **Stage Visuals** (size 4) → kéo lần lượt 4 model con vào đúng thứ tự.
   - **Visual Root** → để trống (mặc định là chính nó).
   - **Animator** (tuỳ chọn) → kéo Animator nếu model có animation; `animStageParam` = tên tham số int trong Animator (mặc định `Stage`).
5. Bấm **Play** → thử: cây ở `Stage0`; tăng `wateredDays` trong Inspector khi đang chạy để thấy model đổi theo giai đoạn.

> ⚠️ Nếu `CropInstance` được gắn tay mà **không** nằm trong một `FarmTile`, hãy gán trường `Tile` bằng tay (thường là object cha) để cây đọc được độ ẩm đất.

---

## 3. GẮN SCRIPT Ô ĐẤT (FarmTile)

1. Tạo Prefab `Tile_2x2`:
   - Empty `Tile_2x2`, scale `(1,1,1)`, kích thước hình học 2×2 m (dùng Plane/Quad hoặc Cube dẹt).
   - Add **BoxCollider** (center `(0,0,0)`, size `(2, 0.2, 2)`) → **Is Trigger = false**, layer `FarmTile`.
   - 3 object con: `Visual_Grass`, `Visual_Tilled`, `Visual_Watered` (3 material khác nhau).
2. **Add Component → Farm Tile**. Gán `grassVisual`, `tilledVisual`, `wateredVisual` vào đúng ô.
3. `tileSize = 2`, `dailyMoistureLoss = 0.35`, `waterPerUse = 0.4`.
4. Rải prefab này thành lưới (hoặc tick `generateOnStart` trong `FarmGrid` để sinh tự động).
5. Trong `FarmGrid`, gán `tilePrefab` và kéo toàn bộ tile vào làm con của `FarmGrid`.

---

## 4. GẮN SCRIPT NGƯỜI CHƠI

1. Tạo Empty `Player` (**Tag = Player**), Add **Character Controller**:
   - Height `1.7`, Radius `0.3`, Slope Limit `45`, Step Offset `0.35`.
2. Add **Third Person Controller** (`ThirdPersonController.cs`):
   - `cameraPivot` → object `PlayerCameraRoot` (đặt ở vai, y ≈ 1.45).
   - Kéo `Animator` của model vào trường `Animator`; tạo các parameter: `Speed (float)`, `Grounded (bool)`, `Jump (trigger)`.
3. Add **Player Interactor** (`PlayerInteractor.cs`) — có `[RequireComponent(ThirdPersonController)]` nên phải thêm sau bước 2:
   - `viewCamera` → Main Camera; `reach = 3`; `probeRadius = 0.35`.
   - `interactMask` → tick đúng các layer `Interactable`, `FarmTile`, `Animal`, `NPC`.
4. Nối UI: script `HudPrompt` (hoặc tự viết) nghe `playerInteractor.OnPromptChanged` → gán text vào `PromptLabel`.

### Bảng phím

| Phím | Hành động |
|---|---|
| `WASD` | Di chuyển |
| `Left Shift` | Chạy |
| `Space` | Nhảy |
| Chuột phải (kéo) | Xoay camera |
| **`E`** | **Tương tác: tưới nước / thu hoạch / cuốc đất / nói chuyện** |
| `1`–`5`, `0`/`Q` | Chọn công cụ: Cuốc, Bình tưới, Liềm, Máy gặt, Rìu, Túi hạt |
| Cuộn chuột | Đổi công cụ nhanh |
| `Tab` | Túi đồ |
| `Esc` | Pause |

---

## 5. Thiết lập Animator cho cây / nhân vật

- **Nhân vật:** Animator Controller với Blend Tree `Speed` (Idle → Walk → Run), layer `UpperBody` (Avatar Mask nửa trên) để chạy clip Hoe/Water/Harvest mà không phá animation chân.
- **Cây trồng:** *không cần* Animator. Việc "đổi animation" = **đổi model theo giai đoạn** (đúng yêu cầu Prompt 2). Nếu muốn cây đung đưa, dùng **vertex wind shader** trên material (rẻ hơn 1000 lần so với clip).
- Nếu muốn cây có hiệu ứng "quả căng lên", thêm component `ReadyPulse` (có sẵn trong `GameServices.cs`) vào prefab cây chín.

---

## 6. Thứ tự thực thi script (Script Execution Order)

Vào `Edit > Project Settings > Script Execution Order`, đặt:

| Script | Thứ tự |
|---|---|
| `TimeManager` | −200 |
| `WeatherSystem` | −190 |
| `Inventory` | −100 |
| `FarmGrid` | −50 |
| `CropInstance`, `FarmTile` | 0 (mặc định) |
| `PlayerInteractor` | 10 |
| `HudClock` | 100 |

Lý do: cây trồng và ô đất phải nghe được event ngày mới **sau khi** `TimeManager` phát ra.

---

## 7. Kiểm thử nhanh (30 giây)

1. Bấm **Play**. `TimeManager` tăng `minutesPerSecond = 1.25` → 1 phút game ≈ 0.8 giây thực; tạm đặt `minutesPerSecond = 60` khi test để ngày trôi cực nhanh.
2. Chọn `1` (Cuốc) → bấm **E** lên ô cỏ → ô đổi sang đất đã cuốc (`TileState.Tilled`).
3. Chọn `0` (Túi hạt) + gán `selectedSeed` (hoặc thêm UI chọn hạt) → bấm **E** → cây xuất hiện ở `Stage0`.
4. Chọn `2` (Bình tưới) → bấm **E** → `moisture` tăng lên ≥ 0.3.
5. Cho thời gian trôi qua ngày (hoặc gọi `TimeManager.Instance.Sleep(false)` từ một nút debug) → cây lên `Stage1`.
6. Sau `Σ daysPerStage` ngày có nước → cây ở `Stage3` (Fruiting) → bấm **E** → loot rơi ra (`LootSpawner`) hoặc vào túi nếu `autoCollect = true`.

### Sự cố thường gặp

| Triệu chứng | Nguyên nhân | Cách sửa |
|---|---|---|
| Bấm E không có gì xảy ra | Layer của ô đất không nằm trong `interactMask`, hoặc collider là Trigger | Bật đúng layer, `QueryTriggerInteraction.Collide` đã bật sẵn trong code |
| Cây không lớn | `moisture` < `requiredMoisture` và chưa tưới; hoặc chưa gán `CropData` | Tưới cây hoặc bật `ForceWeather(Rain)` để test |
| Model cây trắng/hồng | Material dùng shader Built-in trên URP | Đổi sang `Universal Render Pipeline/Lit` |
| Loot rơi xuống đất vô tận | Loot prefab có Rigidbody nhưng không có Collider địa hình | Thêm Collider cho Terrain, hoặc set loot `usePhysicsPop = false` |
| Prompt `[E]` hiện sai vật thể | Raycast trúng collider con | Đảm bảo `CropInstance` nằm trên chính GameObject có collider, hoặc để collider ở con của nó |

---

## 8. Chạy game trên máy ảo/CI không có Unity

Repo này chỉ chứa **mã nguồn + tài liệu** (Unity Engine không nằm trong Git theo đúng convention: không commit `Library/`, `Temp/`, `Build/`).
File `.gitignore` đã chuẩn bị sẵn các mục cần bỏ qua — xem `.gitignore` ở gốc repo.
