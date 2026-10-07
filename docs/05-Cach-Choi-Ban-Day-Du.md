# 🎮 CÁCH CHƠI BẢN ĐẦY ĐỦ — *Vườn Mơ*

> **Nói thẳng trước:** repo này chứa **mã nguồn + thiết kế** của bản đầy đủ, **không kèm file `.exe`**.
> Lý do: môi trường soạn tài liệu không có Unity Editor, và art (sprite) còn chưa vẽ xong.
> Muốn chơi bản đầy đủ, bạn **dựng project Unity theo Phần B** (60–90 phút, làm 1 lần).
> Muốn chơi ngay bây giờ thì dùng **bản chơi thử** đã có sẵn (mục 0 bên dưới).

---

## 0. Ba cách "chơi", chọn theo thời gian bạn có

| Cách | Bạn cần chuẩn bị | Chơi được gì | Chơi ở đâu |
|---|---|---|---|
| **A. Bản chơi thử** *(khuyến nghị để thử trước)* | 0 phút | 5 hệ thống lõi: trồng trọt 4 giai đoạn, nước, mùa/thời tiết, loot, bán hàng, 1 NPC | [`playtest/index.html`](../playtest/index.html) — xem [`playtest/README.md`](../playtest/README.md) |
| **B. Bản đầy đủ trong Unity** | 1 lần: 60–90 phút dựng scene | **Toàn bộ code C# trong repo**: tilemap 200×200, 8 cây trồng, 4 mùa đổi tile, save 3 khe, XP/level, NPC, HUD đầy đủ, ngày/đêm, thời tiết | Trên máy bạn (Unity 6 LTS) — **Phần B** |
| **C. Mở rộng bản chơi thử** | Nói với tôi 1 câu | Thêm chăn nuôi / chế biến / lễ hội… nhưng ở dạng mô phỏng JS (không phải Unity) | Tôi code tiếp vào `playtest/` — **Phần F** |

---

## PHẦN A — Bản đầy đủ khác bản chơi thử ở đâu

| Hệ thống | Bản chơi thử (JS) | Bản đầy đủ (Unity) | Code C# đã có? |
|---|---|---|---|
| Bản đồ | 40×30 ô, vẽ bằng code | Tilemap **tới 200×200 ô**, Rule Tile tự nối viền, ô đất không tạo GameObject | ✅ `FarmGrid` |
| Cây trồng | 4 cây | **8 cây** (thêm khoai tây, nho, bông tuyết, lúa nước) | ✅ `CropData` + `CropInstance` |
| Giai đoạn cây | 4 sprite vẽ bằng code | 4 sprite **+ sprite héo + sprite chết + quầng sáng quả chín** | ✅ |
| Mùa | 7 ngày/mùa (rút ngắn) | **28 ngày/mùa · 112 ngày/năm**, đổi tile cỏ không cần loading | ✅ `SeasonTheme` |
| Thời tiết | 6 loại | **8 loại** (thêm Cầu vồng *+1 bậc phẩm chất* và Mưa sao băng) | ✅ `WeatherSystem` |
| Phẩm chất | 4 mức, ×1 / 1,25 / 1,5 / 2 | Y hệt, **cộng thêm** công thức roll có buff (cầu vồng, ngủ ngon, phân bón) | ✅ `QualityUtil` |
| Nâng cấp | ✖ | **XP nông nghiệp 10 cấp** (0/100/250/500/900/1500/2400/3600/5200/7500) | ✅ `PlayerStats` |
| Save | 1 khe (localStorage) | **3 khe**, JSON + checksum MD5, có `saveVersion` để migrate | ✅ `SaveSystem` |
| Chăn nuôi (7 loài) | ✖ (chuồng chỉ có thông báo) | Gà/vịt/bò/dê/cừu/ong/mèo chó, đói–tim–sản phẩm | 📋 đặc tả GDD §5, chưa có code |
| Chế biến (6 trạm) | ✖ | Bếp, xưởng, máy dệt, ép dầu, mộc, ủ — giá ×1,5–×5 | 📋 đặc tả GDD §6 |
| NPC | 1 (bà Hòa) | **10 NPC** + quest + hẹn hò + lễ hội | 🟡 `NPCRelationship2D` + `NPCRegistry2D` (khung quan hệ), nội dung NPC chưa có |
| Lễ hội | ✖ | **13 lễ hội/năm** | 📋 đặc tả GDD §9.4 |
| Câu cá / hầm mỏ / nhà kính | ✖ | Câu cá (minigame), hầm mỏ, nhà kính trồng mùa Đông | 🟡 đã có `ToolType.FishingRod`, ô `isGreenhouse`; minigame chưa có |
| Co-op 4 người | ✖ | Netcode for GameObjects, host-authoritative | 📋 GDD §13, chưa làm |

> 🟡 = có "khung xương" trong code, thiếu nội dung · 📋 = mới có đặc tả, chưa có code.

---

## PHẦN B — Dựng & chơi bản đầy đủ trong Unity (làm 1 lần)

> **Có 2 đường:** dùng **bộ công cụ tự động** (~10 phút, khuyến nghị — mục ⚡ ngay dưới) hoặc **kéo thả thủ công** (mục 🐢, ~60–90 phút) nếu muốn hiểu từng chi tiết.

### ⚡ CÁCH NHANH — bộ công cụ tự động trong `unity/Assets/Editor/`

Repo kèm sẵn **4 file tool chạy thật** (không phải hướng dẫn giấy). Sau khi copy `unity/Assets/` vào project Unity, thanh menu sẽ có mục **`Vườn Mơ`**:

| Menu | Tool làm gì |
|---|---|
| **Vườn Mơ ▸ 1 · Sinh Sprite Tạm** | Vẽ bằng code **~109 sprite pixel** (cỏ 4 mùa · nước · đường · 8 cây × 6 giai đoạn · nhân vật 4 hướng × 2 khung · 8 icon công cụ · nhà/kho/chuồng/giếng/cây/hàng rào/biển · 6 icon thời tiết · UI) → ghi vào `Assets/VuonMo/Art/Placeholder/` với **đúng cấu hình import** (Point filter · PPU 16 · không nén · không mipmap · pivot Bottom Center cho cây & nhân vật) |
| **Vườn Mơ ▸ 2 · Tạo Dữ Liệu Mẫu** | Tạo `Tile` cho Tilemap · **8 CropData** đúng số liệu GDD §4.2 (ngày/giai đoạn, giá hạt & giá bán, mùa, XP, cây chịu Đông) · 8 nông sản + **8 túi hạt** + gỗ/đá · **4 SeasonTheme** · `CropDatabase` + `ItemDatabase` |
| **Vườn Mơ ▸ 3 · DỰNG SCENE MẪU (chạy tất cả)** | Làm **TẤT CẢ** trong 1 cú bấm: tag/layer → gọi tool 1 + 2 → `GameManagers` (điền sẵn **8 weather profile**, tránh crash `profiles[0]`) → `Grid` + 5 Tilemap (tô cỏ 80×80) → `FarmGrid` + prefab `Crop_Base` + prefab `Loot_Base` + luống đất dọn sẵn → `Player` (Rigidbody2D, capsule, controller, interactor, Y-sort) → `Camera` (orthographic 5.625 + Pixel Perfect nếu có package) + `CameraFollow2D` → giường ngủ (`Bed2D`) · giếng (`WaterSource2D`) · **NPC bà Hòa** → `WeatherFX` + overlay ngày/đêm → **HUD đầy đủ** (đồng hồ, thời tiết, tiền, XP, thanh nước, hotbar 8 ô, prompt `[E]`, toast) → **lưu scene** `Assets/VuonMo/Scenes/VuonMo_Sample.unity` |
| **Vườn Mơ ▸ Kiểm tra cấu hình project** | Báo cáo nhanh: gravity 2D, tag/layer, package 2D Pixel Perfect, sprite tạm, dữ liệu, scene — để biết còn thiếu gì trước khi bấm Play |

**Quy trình 10 phút:**

```
1. Unity Hub → New project → 2D (URP) → tên project (đường dẫn KHÔNG dấu, KHÔNG khoảng trắng)
2. Package Manager → cài: 2D Pixel Perfect · 2D Tilemap Editor · 2D Sprite
3. Copy nguyên cây unity/Assets/ (Scripts + Editor) vào <project>/Assets/
4. Chờ compile (Console phải 0 lỗi đỏ)
5. Menu Vườn Mơ ▸ 3 · DỰNG SCENE MẪU → bấm "Dựng luôn"
6. Bấm ▶ PLAY. Mở lại scene bất cứ lúc nào tại Assets/VuonMo/Scenes/VuonMo_Sample.unity
```

**Bộ tool cũng sửa sẵn 2 lỗi của code cũ** (đã ghi vào Changelog GDD):

| Lỗi | Triệu chứng nếu không sửa | Cách sửa |
|---|---|---|
| `WeatherSystem.profiles` để trống | Gắn component xong bấm Play → `IndexOutOfRangeException` ngay ở `GetProfile()` (hàm trả về `profiles[0]`) | Tool điền sẵn 8 profile theo trọng số GDD §8.2; `Roll()` cần list này để chọn thời tiết |
| Gieo hạt trừ **nông sản** thay vì **hạt** | Mua "Hạt cà chua" nhưng gieo lại mất "Cà chua" trong túi → chỉ có hạt thì không gieo được | `CropData` thêm trường `seedItem`; `Inventory.HasSeed/RemoveSeed` dùng `seedItem` (tự lùi về `harvestItem` với dữ liệu cũ) |

**Xem trước khi cần mở Unity** (không cần cài gì, chỉ cần Python):

```bash
python3 docs/tools/preview-sprite-tam.py    # → art/preview-sprite-tam.png  (109 sprite xếp lưới)
python3 docs/tools/mock-scene-tam.py        # → art/mock-scene-320x180.png  (giả lập màn chơi, tỉ lệ thật)
```

Hai script này **vẽ lại y hệt** cách `VuonMoSpriteForge.cs` vẽ sprite, nên bạn thấy trước được bộ art tạm
(kể cả HUD) mà không phải mở Unity. Chúng cũng tự kiểm tra: vẽ tràn canvas · sprite rỗng · cây/công trình
bị "nổi" trên mặt đất (pivot Bottom Center). **Sửa file C# thì nhớ sửa file Python tương ứng** rồi chạy lại.

**Sau khi chạy tool, art vẫn là "tạm"** — thay dần bằng art thật theo `docs/03-Asset-2D-Sprite-Spec.md`, **giữ nguyên tên file** là mọi thứ tự nối lại (không phải sửa Inspector).

**Tool cố tình KHÔNG làm (để bạn kiểm soát):**

| Việc | Gợi ý |
|---|---|
| Va chạm tường/nước/hàng rào | `Tilemap_Collision` đã có TilemapCollider2D + CompositeCollider2D + Rigidbody2D static (renderer tắt sẵn) — chỉ cần **vẽ tile** lên đó |
| Hạt mưa/tuyết/bão | Tạo ParticleSystem rồi gán vào `WeatherFX2D` (để trống vẫn chạy, chỉ thiếu hiệu ứng) |
| Cây cối, chuồng trại trang trí | Kéo sprite `prop_tree`, `prop_barn`, `prop_coop`… vào scene, nhớ gắn `YSort2D` |
| Vật nuôi / chế biến / câu cá / lễ hội | **Chưa có code** — mới có đặc tả trong GDD §5, §6, §9.4 |

---

### 🐢 CÁCH THỦ CÔNG — kéo thả từng bước

**Tổng thời gian: ~60–90 phút.** Trong đó 20 phút cài Unity, 30–45 phút dựng scene, 15 phút tạo sprite tạm.

#### B0. Máy bạn cần gì

| Mục | Yêu cầu |
|---|---|
| Unity | **Unity 6 LTS** (hoặc 2022.3 LTS) — tải qua Unity Hub |
| Template | **2D (URP)** — code không phụ thuộc URP nên Built-in cũng chạy |
| Package | `2D Pixel Perfect` · `2D Tilemap Editor` · `2D Sprite` · `Unity UI` |
| Đĩa trống | ~8 GB (Unity + project) |
| Kiến thức | Không cần biết lập trình — chỉ cần kéo thả trong Inspector |

> ⚠️ **Đặt đường dẫn project bằng chữ không dấu, không khoảng trắng** (ví dụ `D:\VuonMo`), tránh lỗi lạ khi Unity build.

#### B1. Tạo project & copy code (10 phút)

1. Unity Hub → **New project** → chọn **2D (URP)** → tên `VuonMo` → Create.
2. Chờ Unity mở xong → **Window > Package Manager** → cài `2D Pixel Perfect`, `2D Tilemap Editor`, `2D Sprite`.
3. Mở thư mục repo, chép **nguyên cây** `unity/Assets/Scripts` vào `VuonMo/Assets/`.
4. Quay lại Unity, chờ compile → **Console phải 0 lỗi đỏ**.
   - Nếu có lỗi: xem Phần E bên dưới.

#### B2. Cấu hình project (5 phút)

| Thiết lập | Ở đâu | Giá trị |
|---|---|---|
| Gravity | Edit > Project Settings > Physics 2D | `X = 0`, `Y = 0` |
| Layers | Edit > Project Settings > Tags and Layers | thêm `Player` `NPC` `Interactable` `Collision` `FarmTile` `Water` `Loot` |
| Tag | cùng chỗ, tab Tags | GameObject người chơi phải có tag **`Player`** |
| PPU mặc định | Edit > Project Settings > Editor | Default Sprite PPU = **16** |
| Frame rate | `PixelArtGlobal` trong scene (B4) | `targetFrameRate = 60` |

#### B3. Tạo dữ liệu (ScriptableObject) — 15 phút

Chuột phải trong `Assets` → menu **`Create > Vườn Mơ > …`**:

| Tạo gì | Số lượng | Điền gì |
|---|---|---|
| `Crop Data` | 8 (hoặc 1–2 để test trước) | 4 sprite giai đoạn, `daysPerStage`, mùa, giá hạt/giá bán, `harvestItem` |
| `Item Data` | 1–2 để test | tên, giá bán gốc, icon 16×16 |
| `Season Theme` | **4** (Xuân/Hạ/Thu/Đông) | tile cỏ 4 mùa, màu overlay, particle |
| `Crop Database` | 1 | kéo **tất cả** CropData vào danh sách |
| `Item Database` | 1 | kéo **tất cả** ItemData vào danh sách |

> 💡 **Mẹo "chơi trước, vẽ sau":** chưa có sprite pixel? Vào `Assets > Create > 2D > Sprites > Square` (và `Capsule`) để có sprite trắng, kéo tạm vào các ô sprite. Chơi được ngay, cảm nhận vòng lặp trước, rồi mới vẽ art thật theo `docs/03-Asset-2D-Sprite-Spec.md`.

#### B4. Dựng scene "chuẩn" — 20 phút

Bản đầy đủ cần **cây phân cấp** như trong `docs/02-Unity-Setup.md` §1. Checklist gọn (theo thứ tự thêm từ trên xuống):

| # | GameObject | Gắn component | Gán gì trong Inspector |
|---|---|---|---|
| 1 | `GameManagers` | `PixelArtGlobal`, `TimeManager`, `WeatherSystem`, `Inventory`, `LootSpawner`, `PlayerStats`, `GameManager`, `NPCRegistry2D`, `GameBootstrap` | `GameBootstrap`: 4 SeasonTheme, CropDatabase, ItemDatabase, `farmGrid` |
| 2 | `UI_Canvas` (Screen Space – Overlay, Canvas Scaler 320×180) | — | — |
| 3 | └ `HUD` | `HudController2D` | kéo các Text/Image con vào ô tương ứng |
| 4 | `Grid` | Grid (Cell Size 1,1,0) | — |
| 5 | └ `Tilemap_Ground` / `_Soil` / `_Decor` / `_Building` | Tilemap + TilemapRenderer | Sorting Layer: Ground / Farm / Decor / Buildings |
| 6 | └ `Tilemap_Collision` (renderer TẮT) | Tilemap + TilemapCollider2D + CompositeCollider2D (Polygons) | vẽ tường/nước/hàng rào lên đây |
| 7 | └ `FarmGrid` | `FarmGrid` | 3 tilemap, tile assets, `cropPrefab`, `cropParent`, `width/height` |
| 8 | `CropContainer`, `LootContainer` | — | node cha rỗng để chứa cây & loot |
| 9 | `Crop_Base` (prefab) | `CropInstance` + con `Visual` (SpriteRenderer, pivot Bottom Center) | kéo vào `FarmGrid.cropPrefab` |
| 10 | `Player` *(tag Player)* | Rigidbody2D (Gravity 0, Freeze Rotation Z), CapsuleCollider2D (0.6×0.35, offset −0.25), `PlayerController2D`, `PlayerInteractor2D`, `YSort2D` | Animator 4 tham số: `Speed`, `Direction`, `UseTool`, `ToolType` |
| 11 | `Main Camera` | **Pixel Perfect Camera** + `CameraFollow2D` (+ `PixelArtGlobal` tự snap) | PPU 16, Reference Resolution 320×180, Upscale Render Texture ✔, Size 5.625 |
| 12 | `WeatherFX` | `WeatherFX2D` | 4 theme mùa |
| 13 | `DayNightOverlay` | SpriteRenderer trắng 1×1 + `DayNightTint2D` | 4 theme mùa |

**Import texture pixel art** (khi có art thật) — bắt buộc 3 dòng này, nếu không hình sẽ mờ:
```
Filter Mode = Point (no filter)   ·   Compression = None   ·   Generate Mip Maps = OFF
Pixels Per Unit = 16   ·   Mesh Type = Full Rect   ·   Max Size = 2048
```
> Chọn nhiều file cùng lúc rồi sửa 1 lần cho cả loạt.

#### B5. Bấm Play và kiểm thử 1 phút

| Bước | Làm gì | Thấy gì |
|---|---|---|
| 1 | Chọn `1` (Cuốc) → đứng cạnh ô cỏ → **E** | ô đổi sang tile đất đã cuốc |
| 2 | Chọn `8` (Túi hạt) → **E** | cây hiện ở giai đoạn Hạt |
| 3 | Chọn `2` (Bình tưới) → **E** | đất sẫm lại, thanh nước giảm 1 vạch |
| 4 | Chờ ngày trôi (hoặc `TimeManager.Sleep()`) | cây đổi sprite lên Mầm |
| 5 | Đủ `Σ daysPerStage` ngày có nước | quả **nhấp nháy** = chín |
| 6 | **E** lúc chín | loot rơi theo hình parabol → bị hút vào túi |

> Muốn ngày trôi nhanh khi test: chọn `GameManagers > TimeManager`, đặt `minutesPerSecond = 60` (mặc định 1,25).

#### B6. (Tuỳ chọn) Script Execution Order

Đa số script đã tự khai báo `[DefaultExecutionOrder]` trong code, **không cần chỉnh tay**. Nếu vẫn muốn đặt thủ công: `Edit > Project Settings > Script Execution Order` theo bảng ở `docs/02-Unity-Setup.md` §6.

#### B7. Art thật & âm thanh

| Việc | Xem tài liệu |
|---|---|
| Vẽ sprite (kích thước, số khung, tên file) | `docs/03-Asset-2D-Sprite-Spec.md` |
| Prompt AI để lấy mood trước khi vẽ | `docs/04-Concept-Art-Prompts.md` |
| Bản đồ 22 file C# ↔ hệ thống nào | `docs/00-Tong-Quan.md` |

---

## PHẦN C — HƯỚNG DẪN CHƠI BẢN ĐẦY ĐỦ

### C1. Điều khiển

| Phím | Hành động |
|---|---|
| `WASD` / mũi tên | Đi 8 hướng (sprite vẽ 4 hướng) |
| `Left Shift` | Chạy |
| **`E`** | **Tương tác ô trước mặt**: cuốc · gieo · tưới · thu hoạch · nói chuyện · tương tác (NPC/giếng/giường) |
| `1` `2` `3` `4` `5` `6` | Cuốc · Bình tưới · Liềm · Rìu · Cuốc chim · Cần câu |
| `8` / `Q` | Túi hạt giống (gieo hạt đang chọn) |
| Cuộn chuột | Đổi công cụ nhanh |
| `Tab` | Túi đồ · `M`: bản đồ · `P`: chụp ảnh (giấu HUD) · `Esc`: pause |

**Nguyên tắc vàng:** mọi hành động đều là **`E` vào ô trước mặt** (có khung nhấp nháy chỉ đúng ô đang nhắm) — không cần click chuột.

### C2. Một ngày trong game (≈16 phút thực)

Ngày bắt đầu **6:00**, kết thúc **2:00 sáng hôm sau** (tự ngủ nếu quá giờ; ngủ trước 24:00 được **buff ngủ ngon**).

```
1. Thức dậy → bảng tổng kết ngày (đã bán gì, cây nào chín)
2. Xem thời tiết + dự báo 3 ngày ở HUD (góc phải)
3. Ra ruộng: CUỐC → GIEO → TƯỚI → BÓN PHÂN
4. Chăn nuôi: cho ăn → vuốt ve → thu trứng/sữa          (đặc tả GDD §5)
5. THU HOẠCH cây chín (nhấp nháy) → nhặt loot
6. CHẾ BIẾN ở bếp/xưởng                                (đặc tả GDD §6)
7. BÁN ở chợ / thùng vận chuyển
8. XÃ HỘI: nói chuyện, tặng quà, nhận quest, lễ hội
9. MỞ RỘNG: mua đất, xây chuồng, nâng cấp nhà
10. Ngủ (tự lưu game) → NGÀY MỚI
```

**Luật nước (quan trọng nhất):**

| Chỉ số | Giá trị |
|---|---|
| Ngưỡng đủ nước để cây lớn | độ ẩm ô đất ≥ **30 %** |
| Tưới 1 lần | **+40 %**, bình chứa **20 lần** (múc lại ở giếng/hồ) |
| Mưa / bão | **tự tưới 100 %** cả ruộng — ngày nghỉ của bạn |
| Khô 2 ngày liên tiếp | cây **héo** (còn cứu được bằng cách tưới) |
| Tổng 5 ngày khô | cây **chết** — chỉ còn cách cuốc bỏ, mất hạt |
| Cỏ dại | −15 % tốc độ lớn mỗi cấp (0–3) · Sâu bệnh: giảm 1 bậc phẩm chất |

### C3. Bốn mùa — trồng gì, khi nào

| Mùa | Ngày trong năm | Màu chủ đạo | Cây trồng được | Lễ hội lớn |
|---|---|---|---|---|
| **Xuân** | 1–28 | Xanh non, hồng | Củ cải, Khoai tây, Dâu, Hành | Lễ Hoa Nở (ngày 13) |
| **Hạ** | 29–56 | Xanh đậm, vàng | Cà chua, Ngô, Lúa nước, Dưa hấu | Hội Chợ Biển (40) |
| **Thu** | 57–84 | Cam, nâu gạch | Bí ngô, Nho, Cà rốt, Táo | Lễ Đèn Lồng (70) |
| **Đông** | 85–112 | Trắng, xanh lạnh | Bông tuyết, cải **nhà kính** | Lễ Tri Ân (98) |

> ☠️ **Mùa Đông giết mọi cây ngoài trời** (trừ Bông tuyết). Muốn trồng Đông phải có **nhà kính** — ô đất có cờ `isGreenhouse`, code đã xử lý sẵn (`FarmGrid.isGreenhouse`).

**8 cây trồng và số liệu cân bằng:**

| Cây | Mùa | Ngày mỗi GĐ | Tổng ngày | Mọc lại | Bán gốc | Bán chế biến | Hạt |
|---|---|---|---|---|---|---|---|
| Củ cải | Xuân | 1/1/1 | 3 | ✖ | 35G | 120G | 20G |
| Khoai tây | Xuân | 1/2/2 | 5 | ✖ | 60G | 190G | 50G |
| **Cà chua** | Hạ | 1/2/3 | 6 | ✔ 2 ngày | 55G | 210G | 45G |
| Ngô | Hạ | 2/3/4 | 9 | ✔ 3 ngày | 80G | 300G | 70G |
| Bí ngô | Thu | 2/4/4 | 10 | ✖ | 200G | 620G | 130G |
| Nho | Thu | 2/3/5 | 10 | ✔ 4 ngày | 110G | 380G | 100G |
| Bông tuyết | Đông | 3/4/3 | 10 | ✔ 5 ngày | 150G | 450G | 180G |
| Lúa nước | Hạ | 2/3/5 | 10 | ✖ | 95G | 340G | 60G |

**Phẩm chất (roll 1 lần khi hái) — code thật trong `CropInstance`:**

```
Điểm may mắn = ngẫu nhiên + (0,25 nếu hôm nay CẦU VỒNG) + (0,05 nếu ngủ ngon) + buff phân bón
Xác suất mặc định trong CropData:  Bạc 30 %  ·  Vàng 12 %  ·  Cầu vồng 1 %
Giá bán:  Thường ×1,0  ·  Bạc ×1,25  ·  Vàng ×1,5  ·  Cầu vồng ×2,0   và Cầu vồng +1 sản phẩm
```

### C4. Lịch lễ hội (13 mốc/năm)

| Ngày | Lễ hội | Hoạt động | Phần thưởng |
|---|---|---|---|
| Xuân 7 | Hội Chợ Hạt Giống | Hạt rẻ 40 %, đổi hạt hiếm | Hạt độc quyền |
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

### C5. Kinh tế & tiến trình (bạn nên nhắm gì ở mỗi giai đoạn)

| Giai đoạn | Tiền kỳ vọng | Nguồn thu chính | Mở khoá |
|---|---|---|---|
| Ngày 1–14 | 0 → 3.000G | Củ cải, khoai tây | Túi 12 ô, **Chuồng gà (Coop)** |
| Ngày 15–40 | 3.000 → 25.000G | Phô mai, mứt, cá | Barn, 24 ô, Xưởng chế biến, Hầm mỏ |
| Ngày 41–80 | 25.000 → 120.000G | Rượu, nước hoa, hải sản quý | **Nhà kính**, máy cày, vùng Đông |
| Ngày 81+ | 120.000G → ∞ | Cá hiếm, nấm truffle, du lịch | Thuyền, rừng cổ, nhà thứ 2 |

**Chống lạm phát (có trong thiết kế):** giá bán có trần theo catalog; bảo trì máy móc +10 %/năm; bán quá nhiều cùng 1 loại trong mùa → giảm dần 1 % giá (tối đa 15 %).

### C6. NPC, tim & quest

| Chỉ số | Cách tính |
|---|---|
| Tim | 0–10, mỗi tim **250 điểm** |
| Nói chuyện | +20 điểm/ngày (mỗi NPC 1 lần/ngày) |
| Tặng quà | +50 điểm (món NPC **yêu thích**: +80) · tặng món **ghét**: −40 |
| Quest | +100 điểm |
| Bỏ bê | 7 ngày không gặp: −20 điểm |
| Ngưỡng mở khoá | ♥2 quest cá nhân · ♥4 công thức · ♥6 sự kiện · ♥8 hẹn hò · ♥10 quà đặc biệt |

**10 NPC và quà "hợp gu" nhất:**

| NPC | Vai trò | Quà yêu thích | Mở khoá |
|---|---|---|---|
| Bà Hòa | Tạp hoá | Trà hoa cúc, Bánh bí | Shop, hướng dẫn chợ |
| Ông Bảy | Ngư dân | Cá chép, Rượu gạo | Câu cá, thuyền |
| Linh | Thú y | Sữa tươi, Trứng vàng | Chuồng, chữa gia súc |
| Minh | Kỹ sư | Phụ tùng, Đá quý | Công trình, máy móc |
| Hân | Hoạ sĩ | Hoa, Đá phát sáng | Photo Mode, décor |
| Bảo | Đầu bếp | Nấm, Cá hồi | Bếp, nhà hàng |
| Thư | Nhạc công | Nước hoa, Vải | Festival âm nhạc |
| Nam | Học sinh | Nước ép, Mứt | Hầm mỏ |
| Cô Tuyết | Thị trưởng | Trà tuyết, Bánh mì | Mở rộng đất, quest cộng đồng |
| Người Bí Ẩn | Thảo dược | Nấm lạ, Mật ong | Rừng cổ & phép màu đất |

### C7. Chăn nuôi & chế biến (đặc tả — chưa có code, đọc để biết sẽ chơi thế nào)

**Chăn nuôi:** đói tăng 25 %/ngày → đói thì tụt tim 5 %/ngày → tim ≥ ♥8 cho **sản phẩm quý**. Mùa Đông cần **lò sưởi** trong chuồng (500G). Gia súc tự ra ngoài ban ngày, tự về khi mưa/bão/tuyết.

| Vật nuôi | Chuồng | Mua | Sản phẩm | Chu kỳ |
|---|---|---|---|---|
| Gà | Coop | 400G | Trứng → Trứng vàng | 1/ngày |
| Vịt | Coop | 800G | Trứng vịt → Lông | 1/2 ngày |
| Bò | Barn | 1.500G | Sữa → Phô mai | 1/ngày |
| Dê | Barn | 1.200G | Sữa dê | 1/2 ngày |
| Cừu | Barn | 1.000G | Len → Vải | 1/5 ngày |
| Ong | Bee House | 250G | Mật → Tổ ong | 1/4 ngày |
| Mèo / Chó | Nhà | 300G | +1 may mắn/ngày | 1/ngày |

**Chế biến — chế biến cho ×1,5–×5 giá gốc, đổi lại tốn thời gian trong ngày:**

| Trạm | Mở khoá | Ví dụ |
|---|---|---|
| Bếp | Nâng nhà 1 (10.000G) | 1 Cà chua → 1 Sốt cà (1–3 giờ game) |
| Xưởng chế biến | 5.000G | 1 Sữa → 1 Phô mai (4–12 giờ) |
| Máy dệt | 3.000G | 1 Len → 1 Vải (3 giờ) |
| Máy ép dầu | 2.500G | 5 Hoa → 1 Nước hoa (6 giờ) |
| Xưởng mộc | 4.000G | 10 Gỗ + 5 Đá → hàng rào, cầu, nội thất |
| Máy ủ | 2.000G | 1 quả → 1 mứt (24 giờ) |

### C8. Mẹo chơi (đúc kết từ cơ chế trong code)

1. **Tưới trước, ngủ sau** — cây chỉ tăng "ngày ẩm" khi đất đủ ẩm *ngay lúc qua ngày*.
2. **Ngủ trước 24:00** để lấy buff ngủ ngon (+5 % may mắn phẩm chất, có ảnh hưởng thật trong công thức roll).
3. **Ngày mưa = ngày đi xã hội**: ruộng tự tưới, bạn rảnh để nói chuyện/tặng quà/đi hầm mỏ.
4. **Trồng xen kẽ mùa** — cây khác họ trên cùng ô cho +10 % tốc độ và phẩm chất (luân canh, GDD §4.4).
5. **Giữ 1 ô đất trống mỗi mùa** để tận dụng hạt sự kiện (Hội Chợ Hạt Giống ngày Xuân 7 giảm 40 %).
6. **Câu trước khi trời tối**: `IsNight` = từ 20:00 → 5:00, một số cá chỉ câu được ban đêm.
7. **Đừng để bình tưới cạn giữa ruộng lớn** — múc ở giếng/hồ, bình chứa 20 lần = tưới được 20 ô.
8. **Cây chín thì hái ngay**: bão (5 % xác suất mỗi ngày) có thể làm gãy 10 % số cây ngoài trời.
9. **Cầu vồng là "ngày vàng"**: +25 % may mắn phẩm chất cho *mọi cây hái trong ngày* → dồn việc thu hoạch vào hôm đó.
10. **Bí ngô là cây kiếm tiền tốt nhất mùa Thu** (200G gốc / 620G chế biến) nhưng 10 ngày mới chín → gieo sớm, nhớ tưới đều.

---

## PHẦN D — Tra cứu nhanh (số liệu chuẩn của bản đầy đủ)

| Thông số | Giá trị |
|---|---|
| Độ phân giải nội bộ | **320×180**, upscale nguyên ×6 = 1080p |
| PPU (Pixels Per Unit) | **16** · camera Size **5.625** |
| Kích thước ô đất | 16×16 px · nhân vật 16×24 px (pivot Bottom Center) |
| Một ngày game | 6:00 → 2:00 = 20 giờ game ≈ **16 phút thực** (`minutesPerSecond` 1,25) |
| Một giờ game | **48 giây thực** |
| Mùa / Năm | **28 ngày**/mùa · **112 ngày**/năm ≈ 30 giờ chơi |
| Auto-sleep | quá **2:00 sáng** tự ngủ (mất buff ngủ ngon) |
| Bình tưới | 20 lần · tưới +40 % độ ẩm · ngưỡng cây lớn 30 % |
| Héo / Chết | khô 2 ngày → héo · tổng 5 ngày → chết |
| Sản lượng | 1–3 món/cây (`minYield`/`maxYield`), Cầu vồng +1 |
| XP nông nghiệp | 10 cấp: 0 / 100 / 250 / 500 / 900 / 1500 / 2400 / 3600 / 5200 / 7500 |
| Save | 3 khe JSON (`slot0.json`…), tự lưu khi ngủ, có checksum MD5 |
| Thời tiết | Nắng 45 % · Mây 20 % · Mưa 18 % · Bão 5 % · Tuyết 10 % (Đông) · Sương mù 2 % · Cầu vồng (sau mưa) · Mưa sao băng 1 % (Hạ/Thu) |
| Vị trí lưu game | Windows: `%USERPROFILE%\AppData\LocalLow\<tên hãng>\VuonMo\` |

---

## PHẦN E — Khi bị kẹt

| Triệu chứng | Cách sửa nhanh |
|---|---|
| Unity báo **lỗi compile** sau khi copy code | Console → đọc dòng lỗi đầu tiên. 90 % là do **thiếu package** `2D Tilemap Editor` (lỗi `UnityEngine.Tilemaps`) hoặc project tạo nhầm template 3D |
| Hình **mờ / nhoè** | Texture chưa để `Filter Mode = Point`, `Compression = None`, `Mip Maps = OFF` |
| Hình **rung giật** khi đi | Chưa có Pixel Perfect Camera, hoặc `PixelArtGlobal.targetCamera` chưa gán |
| Bấm **E không có gì xảy ra** | `interactableMask` chưa tick layer `Interactable`, hoặc `FarmGrid` chưa có trong scene |
| **Cây không lớn** | Đất khô (< 30 %) và hôm nay không mưa → tưới, hoặc test bằng `WeatherSystem.ForceWeather(...)` |
| Đi **xuyên qua** cây/nhà | Thiếu `TilemapCollider2D` + `CompositeCollider2D` trên `Tilemap_Collision` |
| Nhân vật **bị cây che sai** | Thiếu `YSort2D` trên Player/cây/NPC/loot |
| Sprite hiện **ô hồng** | `CropData.stageSprites` chưa đủ 4 phần tử |
| Loot rơi nhưng **không nhặt được** | Loot ngoài `magnetRadius`, hoặc túi đầy → bật `LootSpawner.autoCollect` |

> Bảng đầy đủ 20+ sự cố: `docs/02-Unity-Setup.md` §7.

---

## PHẦN F — Muốn "chơi được nhiều hơn" mà không phải dựng Unity?

Nói với tôi một trong các hướng sau, tôi làm tiếp trong repo:

| Hướng | Nội dung | Thời gian của tôi |
|---|---|---|
| **Mở rộng bản chơi thử** | Thêm chăn nuôi (gà/bò: cho ăn → thu trứng/sữa), chế biến (bếp: cà chua → sốt), lễ hội (đếm ngày + minigame nhỏ), NPC thứ 2 | 1 lượt |
| **Dựng "scene mẫu" bằng code** | Viết script Editor `[MenuItem]` tự tạo scene Unity (GameManagers, Grid, Player, Camera) để bạn mở là chạy, đỡ phải kéo thả | 1 lượt |
| **Sinh sprite tạm tự động** | Script Python/C# sinh bộ sprite 16×16 màu phẳng (cây 4 giai đoạn, nhân vật 4 hướng, ô đất, công trình) để bạn có art tạm dùng ngay | 1 lượt |
| **Chuyển sang engine khác** | Nếu bạn muốn chơi trên web lâu dài: port bản đầy đủ sang Godot 4 (HTML5 export) — nhẹ hơn Unity cho 2D pixel | nhiều lượt |

---

*Tài liệu liên quan:* [`00-Tong-Quan.md`](00-Tong-Quan.md) · [`01-GDD.md`](01-GDD.md) · [`02-Unity-Setup.md`](02-Unity-Setup.md) · [`03-Asset-2D-Sprite-Spec.md`](03-Asset-2D-Sprite-Spec.md) · [`04-Concept-Art-Prompts.md`](04-Concept-Art-Prompts.md) · [`../playtest/README.md`](../playtest/README.md)
