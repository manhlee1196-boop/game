# BẢNG ĐẶC TẢ ASSET 3D — *Vườn Mơ / Harvest Hearth*

**Phong cách chuẩn cho TOÀN BỘ asset:** Stylized Low-poly 3D · Vibrant colors · Soft shadows · Faceted (giữ cạnh khối) · Palette giới hạn (48 màu) · Outline nâu `#3E2C24` · Không texture realistic, chỉ màu phẳng + texture nhỏ để tạo vân.

**Quy ước đọc bảng**
- **Tris** = số tam giác tối đa (ngân sách, không phải mục tiêu tối thiểu). Đo bằng `Blender → Statistics` hoặc `Unity Profiler`.
- **LOD** = 3 cấp: LOD0 (full) / LOD1 (60%) / LOD2 (30% + billboard).
- **Pivot** = gốc tọa độ: `Ground` (đáy vật thể, y=0) hoặc `Grid` (tâm ô 2×2 m).
- **Scale** = kích thước thật trong Unity (1 unit = 1 m).
- **Export**: `.fbx` / `.glb`, Y-up, -Z forward, tangent space, 1 material/submesh (tối đa 3), texture atlas 1024².
- **Naming**: `CAT_SubName_Variant` (ví dụ `CROP_Tomato_Stage03`, `PROP_Barn_Lvl02`).

---

## NHÓM 1 — CÂY TRỒNG & NÔNG SẢN (Crops & Produce)

### 1.1 Cây trồng 4 giai đoạn (mỗi cây = 4 model)

| # | Tên Asset | Phong cách | Tris (LOD0/1/2) | Animation / Trạng thái | Pivot / Scale | Ghi chú kỹ thuật |
|---|---|---|---|---|---|---|
| 1.1 | `CROP_Turnip_Stage01..04` (Củ cải trắng) | Stylized low-poly, lá xanh non `#8FD06B`, củ trắng ngà | 24 / 40 / 180 / 260 (LOD2 billboard) | Stage04 có **idle sway 2 giây** (vertex wind, không skin); khi thu hoạch: **Pop-up 0.35 s** rồi biến mất | Grid, 0.6 m | Củ nhô 30% khỏi đất để dễ nhận biết |
| 1.2 | `CROP_Potato_Stage01..04` (Khoai tây) | Lá thấp, màu xanh đậm `#5FA84C` | 24 / 44 / 200 / 240 | Stage03–04 có **củ nhô lên dần** (shape key hoặc hoán đổi mesh) | Grid, 0.7 m | Bụi thấp, phù hợp hàng dài |
| 1.3 | `CROP_Tomato_Stage01..04` (Cà chua) | Thân leo có cọc gỗ nhỏ, quả đỏ `#E5484D` | 28 / 60 / 380 / 520 | Stage04: quả **pulse nhẹ 0.5 Hz**; có animation **rung khi bấm E** | Grid, 1.4 m | Biến thể `_Fruiting` có 5 quả, `_Harvested` còn 2 quả (regrow) |
| 1.4 | `CROP_Corn_Stage01..04` (Ngô) | Cao, lá dài, bắp vàng `#FFD34E` | 24 / 56 / 420 / 560 | Stage04: lá **đung đưa mạnh theo gió** (wind weight 0.8) | Grid, 2.2 m | Có biến thể `_Wind` qua shader, không cần clip riêng |
| 1.5 | `CROP_Pumpkin_Stage01..04` (Bí ngô) | Dây leo bò, quả cam `#E5762C` | 30 / 70 / 460 / 620 | Stage03→04 có **quả to dần** (3 sub-mesh hoán đổi) | Grid, 1.1 m (dây lan 2 m) | Quả chiếm 2 ô khi chín — dùng cờ `occupiesCells = 2` |
| 1.6 | `CROP_Grape_Stage01..04` (Nho) | Giàn gỗ + chùm nho tím `#8E6BC8` | 26 / 64 / 480 / 640 | Chùm nho **lắc nhẹ**, lá rơi particle khi thu hoạch | Grid, 2.0 m | Cần giàn — asset phụ `PROP_Trellis_01` |
| 1.7 | `CROP_Snowberry_Stage01..04` (Bông tuyết) | Cây nhỏ phát sáng xanh băng `#BFE3EE` | 22 / 48 / 260 / 320 | Stage04 có **emissive nhấp nháy 0.25 Hz** | Grid, 0.9 m | Chỉ sống mùa Đông; dùng trong nhà kính |
| 1.8 | `CROP_Rice_Stage01..04` (Lúa nước) | Ruộng ngập có bùn, thân lúa vàng `#E8C46B` | 20 / 40 / 300 / 400 | Stage04: bông lúa **cúi xuống** (bent) | Grid, 0.9 m | Cần asset nước `PROP_PaddyWater_01` |
| 1.9 | `CROP_Daikon_Stage01..04` (Củ cải trắng dài) | Rễ trắng dài nhô khỏi đất | 24 / 42 / 200 / 240 | Pop-up khi thu hoạch | Grid, 0.7 m | — |
| 1.10 | `CROP_Strawberry_Stage01..04` (Dâu tây) | Bụi thấp, quả đỏ hồng `#F0556B` | 24 / 46 / 220 / 280 | Quả **lấp lánh** (sparkle particle) khi chất lượng ≥ Bạc | Grid, 0.5 m | Regrow mỗi 2 ngày |

### 1.11 Cây ăn quả & cây cảnh (cây lớn, chiếm 3×3)

| # | Tên Asset | Tris (trưởng thành) | Animation / Trạng thái | Ghi chú |
|---|---|---|---|---|
| 1.11 | `TREE_Apple_01` | 1.200 | 4 trạng thái: chồi → ra hoa → quả → trụi lá (mùa Đông); có **rung khi thu hoạch** (vertex anim 0.4 s) | Trồng 1 lần, sống 3 năm |
| 1.12 | `TREE_Peach_01` | 1.150 | Tương tự, màu hồng `#F7A8B8` | — |
| 1.13 | `TREE_Pine_01` | 900 | Rung lá mùa Đông, tuyết đọng (blend material) | Cây cảnh + gỗ |
| 1.14 | `TREE_Oak_01` | 1.400 | Có thể chặt (4 giai đoạn nảy chồi) | Rơi gỗ + hạt |
| 1.15 | `TREE_Maple_01` | 1.300 | **Đổi màu lá theo mùa bằng shader blend** (xanh → đỏ) | Nhựa phong mùa Thu |
| 1.16 | `BUSH_Berry_01` | 340 | Quả chín → pop | Wild forage, mọc lại 3 ngày |
| 1.17 | `FLOWER_Daisy_01` / `FLOWER_Tulip_01` / `FLOWER_Sunflower_01` | 120 / 140 / 220 | Idle sway; sunflower **xoay theo mặt trời** (script) | Hoa cho Bee House |

### 1.12 Nông sản & Nấm ký sinh dạng 3D (item rơi/loot)

| Tên Asset | Tris | Animation | Ghi chú |
|---|---|---|---|
| `ITEM_Produce_Generic_01` | 90–180 | Idle xoay 360°/2 giây + bob 0.15 m | Mesh dùng chung, đổi màu theo nông sản để tiết kiệm |
| `ITEM_Produce_QualityGold_01` | 220 | Outline vàng + particle hạt sáng | Chuẩn cho hạng ★★ |
| `ITEM_Produce_QualityRainbow_01` | 260 | Cầu vồng chạy quanh (shader UV scroll) | Hạng ★★★ |
| `ITEM_Egg_01` / `_Golden` | 70 / 120 | Rung nhẹ khi rơi | Trong tổ gà |
| `ITEM_MilkBucket_01` / `_Cheese` | 150 / 200 | Nắp mở khi chế biến xong | Trạm Artisan |
| `ITEM_Wool_01` / `ITEM_Fabric_01` | 130 / 180 | — | Từ cừu |
| `ITEM_Honey_01` / `ITEM_HoneyJar_01` | 110 / 210 | Ong bay quanh (particle) | Từ Bee House |
| `ITEM_Fish_*` (12 loài) | 120–300 | Quẫy 3 khung (shape key hoặc 3 mesh) | Bể cá có biến thể sống |
| `ITEM_Mushroom_*` (6 loài) | 90–160 | Phát sáng nhẹ loài quý | Forage ở rừng |

---

## NHÓM 2 — GIA SÚC & VẬT NUÔI (Animals & Pets)

**Chuẩn rig cho tất cả động vật:** 1 armature, ≤ 28 bone, skin weight 4 ảnh hưởng, dùng **mesh hoán đổi theo tuổi** (Baby → Adult → Old) chứ không rig riêng.

| # | Tên Asset | Tris (Adult / Baby) | Animation (bắt buộc) | Animation (tuỳ chọn) | Ghi chú |
|---|---|---|---|---|---|
| 2.1 | `ANI_Chicken_White` (+ nâu, đen) | 620 / 380 | Idle_Peck, Walk, Run, Eat, Sit, Sleep, **Happy_Flap**, Laying_Egg, Pet | Scared (khi thời tiết Bão) | 3 biến thể màu = cùng mesh, đổi material |
| 2.2 | `ANI_Chicken_Golden` | 700 | Như trên + **Glow_Idle** | Fly (ngắn) | Chỉ khi ♥10 |
| 2.3 | `ANI_Duck` | 700 / 400 | Idle, Walk (lạch bạch), Swim (bơi trên nước), Eat, Sleep, Laying, Pet | Feather_Shake (rơi lông) | Có animation bơi — cần asset nước |
| 2.4 | `ANI_Cow_White` (+ nâu) | 1.500 / 800 | Idle_Chew, Walk, Graze (mùa Hạ), Eat, Drink, Sleep, **Milk_Ready**, Pet, Walk_Into_Barn | Tail_Swing | Rig 26 bone, có udder sub-mesh |
| 2.5 | `ANI_Goat` | 1.250 / 700 | Idle, Walk, Jump, Headbutt (hài), Eat, Milk_Ready, Pet, Sleep | Climb (trèo đá cảnh) | — |
| 2.6 | `ANI_Sheep` | 1.400 (lông bông) / 700 | Idle, Walk, Graze, Eat, Sleep, Sheared (mesh 400 tris), Pet | Loom_Seat (ngồi cạnh máy dệt) | **2 mesh: có lông / đã cắt lông** |
| 2.7 | `ANI_Horse` | 2.200 | Idle, Walk, Trot, Gallop, Eat, Sleep, Mount/Dismount, Pet | Jump (vượt hàng rào) | Phương tiện di chuyển nhanh cấp 3 |
| 2.8 | `ANI_Dog` (3 giống) | 900 | Idle, Walk, Run, Sit, Sleep, Bark, Tail_Wag, Fetch (mang loot về) | Dig (đào kho báu) | Giống: Corgi, Shiba, Golden |
| 2.9 | `ANI_Cat` (3 giống) | 850 | Idle, Walk, Sit, Sleep, Stretch, Meow, Purr, Hunt_Bird (đuổi chim) | — | — |
| 2.10 | `ANI_Bee_Swarm` | 60 (mesh đơn) ×20 instance | Idle (bay vòng theo đường cong), Work (vào/ra Bee House) | — | Dùng VFX/particle + instancing, không rig |
| 2.11 | `ANI_Owl` / `ANI_Firefly` | 500 / 40 | Owl: Idle, Blink, FlyOut, Hoot. Firefly: bay lượn | — | Sinh vật đêm ambient |
| 2.12 | `ANI_Frog` / `ANI_Butterfly` | 300 / 120 | Frog: Idle, Hop, Croak. Butterfly: bay theo hoa | — | Ambient sống động |

**Quy tắc chung cho động vật:** mỗi clip ≤ 60 khung @24 fps; loop phải liền mạch (khung cuối = khung đầu); 100% động vật có **animation Pet/Eat/Sleep** để "cozy feel".

---

## NHÓM 3 — CÔNG TRÌNH & TRANG TRÍ (Buildings & Decor)

### 3.1 Công trình chính (mỗi công trình có 3 cấp nâng cấp)

| # | Tên Asset | Tris (Lvl1/2/3) | Animation / Trạng thái | Kích thước (ô 2×2 m) | Ghi chú |
|---|---|---|---|---|---|
| 3.1 | `PROP_FarmHouse_Lvl01..03` | 4.500 / 7.200 / 11.000 | Cửa mở/đóng, rèm lay, đèn bật ban đêm, ống khói có khói (VFX) | 5×6 / 7×8 / 9×10 | Lvl3 có tầng 2 + ban công |
| 3.2 | `PROP_Barn_Lvl01..03` (Chuồng bò/dê) | 3.200 / 4.800 / 6.400 | **Cửa trượt mở/đóng**, gia súc đi vào (nav), máng cỏ đổi trạng thái | 4×6 | Cần rig cửa (2 bone) |
| 3.3 | `PROP_Coop_Lvl01..03` (Chuồng gà/vịt) | 2.100 / 3.000 / 3.900 | **Cửa sập mở**, ổ rơm đổi trạng thái (có/không trứng), gà ra vào | 3×3 | Có asset con gà bay ra |
| 3.4 | `PROP_Greenhouse` | 5.500 | Cửa kính mở, hơi nước bên trong, cây trồng bên trong hiển thị | 6×8 | Bảo vệ cây 100% mùa Đông |
| 3.5 | `PROP_Silo` | 2.400 | Cửa xả, hạt chảy (particle) | 3×3 | Chứa thức ăn gia súc |
| 3.6 | `PROP_Artisan_Station` (xưởng chế biến) | 1.400 | Bánh răng xoay, đèn báo chạy/xong, nắp mở khi có sản phẩm | 2×3 | Có biến thể màu theo loại máy |
| 3.7 | `PROP_Kitchen_Interior` (nội thất bếp) | 2.800 | Ngăn kéo mở, bếp lửa, nồi sôi (particle) | Nội thất | Chỉ dùng trong nhà |
| 3.8 | `PROP_Tractor` | 3.600 | Bánh xoay (2 bone), ống xả khói, ghế nghiêng, càng nâng/hạ | 3×2 | Phương tiện + công cụ |
| 3.9 | `PROP_Mill_Windmill` (cối xay gió) | 3.000 | **Cánh xoay** (1 bone, tốc độ theo gió), cửa quay | 4×4 | Biểu tượng của làng |
| 3.10 | `PROP_Pier` / `PROP_Boat_Small` | 1.800 / 1.500 | Thuyền **lắc nhẹ trên sóng** (vertex), mái chèo xoay | 3×8 / 3×2 | Đánh cá biển |
| 3.11 | `PROP_Bridge_Wood` / `_Stone` | 900 / 1.200 | Không (tĩnh), có biến thể hỏng/đã sửa | 2×6 | Quest cộng đồng |
| 3.12 | `PROP_Shop_General` (tạp hóa bà Hòa) | 5.000 | Cửa mở, biển hiệu đung đưa, đèn lồng theo giờ, quầy hàng thu ngân | 6×8 | Có interior riêng |
| 3.13 | `PROP_TownHall` | 6.800 | Đồng hồ chạy, cờ bay (cloth sim đơn giản 6 khung), cửa mở | 8×10 | Nơi nhận quest cộng đồng |
| 3.14 | `PROP_Mine_Entrance` | 2.200 | Đường ray, xe goòng chạy ra/vào, đèn nhấp nháy | 5×5 | Cửa vào hang động |
| 3.15 | `PROP_Festival_Stage` | 3.400 | Đèn nháy, cờ, sân khấu mở theo lễ hội (4 biến thể) | 10×10 | Tái sử dụng cho 4 mùa |
| 3.16 | `PROP_Chapel_Small` | 4.000 | Chuông rung (1 bone), cửa mở | 6×8 | Lễ cưới/kết nghĩa |
| 3.17 | `PROP_House_NPC_01..06` | 3.200–4.800 | Cửa mở, đèn theo giờ, biến thể trang trí theo NPC | 5×6 | 6 kiểu kiến trúc khác nhau |

### 3.2 Địa hình & thiên nhiên (Terrain & Nature)

| # | Tên Asset | Tris | Animation | Ghi chú |
|---|---|---|---|---|
| 3.18 | `TERRAIN_FarmTile_Base` (ô đất) | 12 (2 tri × 6) | 5 biến thể vật liệu: Cỏ / Đã cuốc / Đã tưới (sẫm) / Có hạt / Héo | Dùng **3 material blend bằng vertex color** để tiết kiệm |
| 3.19 | `TERRAIN_Cliff_Rock_*` (8 khối) | 200–900 | Không | Modular, ghép được mọi địa hình |
| 3.20 | `TERRAIN_GrassPatch_01..05` | 40–160 | Sway theo gió (vertex shader) | Rải bằng GPU instancing, ~2.000 instance/sector |
| 3.21 | `TERRAIN_Water_Surface` | 200 | Sóng gợn (UV scroll 2 lớp), phản chiếu đơn giản | Stylized, không reflection thật |
| 3.22 | `TERRAIN_Path_Dirt` / `_Stone` | 60 / 120 | Không | Đường đi, snap theo lưới |
| 3.23 | `TERRAIN_Fence_Wood` (5 kiểu) | 90–260 | Cổng mở/đóng | Hàng rào trang trại |
| 3.24 | `TERRAIN_TreeStump` / `TERRAIN_Pebble_Set` | 60 / 20 | Không | Chi tiết nhỏ rải map |
| 3.25 | `SKY_Dome` + `SKY_Clouds_01..06` | 300 / 120 | Mây trôi 0.3 m/s; 4 profile màu theo mùa | Shader procedural, không texture lớn |

### 3.3 Trang trí, nội thất & tiện ích (Decor & Utility)

| # | Tên Asset | Tris | Animation | Ghi chú |
|---|---|---|---|---|
| 3.26 | `PROP_Furniture_Set` (bàn, ghế, giường, kệ, tủ, thảm) | 120–800 mỗi món | Ngăn kéo mở, kệ có/không đồ | 24 món, 5 theme (Mộc/Thôn/Đông/Pháp/Nhật) |
| 3.27 | `PROP_Lamp_Lantern` (4 kiểu) | 180–420 | Ánh sáng bật theo giờ (point light), lắc nhẹ | Bán trong shop decor |
| 3.28 | `PROP_Chest_Storage` | 700 | Nắp mở + hiện đồ bên trong | 3 cấp: 20 / 40 / 80 ô |
| 3.29 | `PROP_Sign_Wood` / `PROP_Sign_Board` | 220 | Đung đưa nhẹ | Chỉ đường + bảng tin quest |
| 3.30 | `PROP_Scarecrow` | 480 | Đung đưa theo gió, chim bay đi khi lại gần | Giảm 100% phá hoại của quạ |
| 3.31 | `PROP_Sprinkler` | 260 | Phun nước xoay 360°, bật theo hẹn giờ | Tự động tưới 4 ô xung quanh |
| 3.32 | `PROP_Beehive_Box` | 340 | Ong ra/vào (particle + instance), nắp mở khi lấy mật | — |
| 3.33 | `PROP_Weathervane` | 150 | **Xoay theo hướng/độ mạnh gió** | Báo thời tiết trực quan |
| 3.34 | `PROP_Picnic_Area` / `PROP_Swing` | 520 / 640 | Đu quay nhẹ, NPC có thể ngồi | Tăng quan hệ khi ngồi cùng |
| 3.35 | `PROP_Postbox` / `PROP_Noticeboard` | 260 / 380 | Cờ đỏ bật lên khi có thư/nhiệm vụ mới | Chỉ dẫn nhiệm vụ |
| 3.36 | `PROP_Fountain_Town` | 1.600 | Nước phun + sương, đèn ban đêm | Trung tâm quảng trường |
| 3.37 | `PROP_Statue_Hero` | 900 | Chim đậu (ambient) | Decor đạt thành tích |

---

## NHÓM 4 — CÔNG CỤ & TRANG PHỤC (Tools & Outfits)

### 4.1 Công cụ cầm tay (mỗi công cụ: 3 cấp **Cơ bản / Sắt / Vàng**)

| # | Tên Asset | Tris (Cơ bản) | Tris (Vàng) | Animation cần có | Ghi chú |
|---|---|---|---|---|---|
| 4.1 | `TOOL_Hoe` (Cuốc) | 320 | 480 | `Hoe_Swing` (0.9 s), `Hoe_Impact`, `Idle_Hold` | Cán gỗ + lưỡi sắt; cấp Vàng có VFX lấp lánh |
| 4.2 | `TOOL_WateringCan` (Bình tưới) | 380 | 520 | `Water_Idle`, `Water_Pour` (0.7 s), `Water_Shake` (khi gần hết), `Water_Empty` | Có **vertex animation nước chảy** (scale 1 trục) |
| 4.3 | `TOOL_Sickle` (Liềm) | 260 | 380 | `Sickle_Sweep` (0.6 s), `Sickle_Idle` | Thu hoạch nhanh, ×1 sản phẩm |
| 4.4 | `TOOL_HarvesterMachine` (Máy gặt cầm tay) | 900 | 1.100 | `Machine_Start` (dây kéo), `Machine_Run` (rung 5 Hz), `Machine_Overheat`, `Machine_Stop` | Thu 2×1 ô, tốn xăng 1%/cây |
| 4.5 | `TOOL_Axe` (Rìu) | 300 | 440 | `Axe_Chop_01`, `Axe_Chop_02`, `Axe_Stuck` | 2 clip chặt luân phiên cho tự nhiên |
| 4.6 | `TOOL_Pickaxe` (Cuốc chim) | 340 | 460 | `Pick_Swing`, `Pick_Impact_Metal`, `Pick_Impact_Rock` | Vào hầm mỏ |
| 4.7 | `TOOL_FishingRod` (Cần câu) | 240 | 360 | `Rod_Equip`, `Rod_Cast`, `Rod_Wait`, `Rod_Hook`, `Rod_Reel` | Dây câu dùng **Line Renderer + spline**, không rig |
| 4.8 | `TOOL_SeedBag` / `TOOL_Basket` | 180 / 220 | — | `Kneel_Plant`, `Basket_Fill`, `Basket_Empty` | Túi hạt có 8 biến thể màu theo loại |
| 4.9 | `TOOL_Scythe_Grass` (liềm cắt cỏ) | 240 | — | `Scythe_Sweep`, `Grass_Cut` | Cắt cỏ → cỏ khô cho gia súc |
| 4.10 | `TOOL_Watering_Upgrade_Sprinkler` | 400 | — | `Deploy` (đặt xuống), `Spray_Loop` | Vật phẩm đặt, không cầm |

> **Quy tắc chung:** mọi công cụ phải có **cùng pivot & cùng trục cầm (grip socket)** để chỉ cần 1 bộ animation tay cho tất cả. Cấp Vàng/Sắt chỉ đổi **material + 1 sub-mesh**, không dựng model mới → tiết kiệm 60% thời gian.

### 4.2 Nhân vật người chơi (Player Character)

| # | Tên Asset | Tris | Animation | Ghi chú |
|---|---|---|---|---|
| 4.11 | `CHAR_Player_Base` (nam/nữ, 4 tông da) | 3.800 (LOD1: 2.200) | Locomotion: Idle, Idle_Cold, Walk (F/B/L/R), Run, Sprint, Jump_Start/Loop/Land, Sit, Sleep, Swim | Rig **Mixamo-compatible**, 52 bone, root motion cho Walk/Run |
| 4.12 | `CHAR_Player_Actions` (dùng chung) | — | 20 clip: Hoe, Water, Plant, Harvest, Pet, Talk, Wave, Cheer, Think, Laugh, Cry, Dance, Hold_Item, Climb, Push, Pull, Water_Splash, Fish_*  | Dùng **Animation Layer + Avatar Mask** upper-body |
| 4.13 | `OUTFIT_Everyday` (4 màu) | 900 | Skinned mesh, blend shape cho váy/quần | Trang phục mặc định |
| 4.14 | `OUTFIT_Farmer` (overall, 6 màu) | 1.100 | Có animation tạp dề bay nhẹ | Bộ "đi làm ruộng" |
| 4.15 | `OUTFIT_Raincoat` (+ ủng) | 1.200 | **Mở khóa khi mưa** — giảm 100% chậm chạp khi mưa | Bán ở shop mùa Xuân |
| 4.16 | `OUTFIT_Winter` (áo phao, khăn, mũ) | 1.350 | Idle_Cold được thay bằng Idle_Warm | Mùa Đông |
| 4.17 | `OUTFIT_Festival_Xuan/Ha/Thu/Dong` | 1.100–1.400 | Có phụ kiện bay (ruy băng, hoa, đèn) | 4 bộ lễ hội |
| 4.18 | `OUTFIT_Wedding` | 1.500 | — | Sự kiện cưới ♥8+ |
| 4.19 | `ACC_Hat` (7 kiểu) | 200–420 | Xoay theo hướng gió nhẹ | Mũ rơm, beanie, mũ lưỡi trai… |
| 4.20 | `ACC_Bag` (3 cấp) | 300–560 | Túi **phồng lên theo số ô đã dùng** (blend shape) | Feedback trực quan cho túi đầy |
| 4.21 | `ACC_Glasses` / `ACC_Scarf` / `ACC_Earring` | 80–180 | — | Phụ kiện nhỏ, mix-match |

### 4.3 NPC (10 nhân vật chính)

| # | Tên Asset | Tris | Animation | Ghi chú |
|---|---|---|---|---|
| 4.22 | `CHAR_NPC_Hoa` (Bà Hòa) | 3.200 | Idle_Shop, Walk, Talk, Laugh, HandOver_Item, Sweep, Sit | Rig giống Player để dùng chung clip |
| 4.23 | `CHAR_NPC_Bay` (Ông Bảy) | 3.400 | Idle_Fish, Cast, Walk, Talk, Nod, Sit_Smoke | — |
| 4.24 | `CHAR_NPC_Linh`..`CHAR_NPC_Tuyet` (7 người còn lại) | 3.100–3.700 | Bộ 12 clip chung + 2 clip đặc trưng mỗi NPC | Biến thể qua tóc/phụ kiện + màu |
| 4.25 | `CHAR_NPC_Child_Nam` | 2.600 | Walk_Bouncy, Run, Jump, Talk, Play_Ball | Tỉ lệ đầu to hơn 10% |
| 4.26 | `CHAR_NPC_Mysterious` | 3.900 | Idle_Float (nhẹ), Talk_Whisper, Vanish (dissolve) | Có shader tan biến |

---

## TỔNG KẾT NGÂN SÁCH ASSET

| Nhóm | Số model | Tổng tris ước tính | Thời gian sản xuất (1 artist) | Ghi chú |
|---|---|---|---|---|
| 1. Cây trồng & nông sản | ~150 (10 cây × 4 GĐ + cây lớn + item) | ~120.000 | 10 tuần | Ưu tiên: 4 cây trước, 6 cây sau |
| 2. Gia súc & vật nuôi | 12 loài × 2–3 biến thể | ~90.000 | 9 tuần (rig là chính) | Có thể mua base rig + chỉnh |
| 3. Công trình & trang trí | ~120 | ~230.000 | 14 tuần | Modular, tái sử dụng nhiều |
| 4. Công cụ, trang phục, nhân vật | ~90 | ~120.000 | 11 tuần | 1 rig dùng chung cho Player + NPC |
| **TỔNG** | **~370 asset** | **~560.000 tris** | **~44 tuần (≈ 11 tháng với 1 artist, 5.5 tháng với 2)** | Ngân sách texture: ~450 MB sau nén |

### Checklist kiểm tra chất lượng (mỗi asset trước khi giao)
1. **Silhouette test:** tô đen hoàn toàn, vẫn nhận ra vật thể ở khoảng cách 20 m.
2. **Palette test:** màu nằm trong 48 màu cho phép (kiểm bằng palette texture).
3. **Poly budget:** không vượt bảng trên (đo bằng Blender Statistics).
4. **Pivot/Scale:** đúng quy ước, đứng ở y=0, không scale khác 1.
5. **LOD:** 3 cấp, LOD2 ≤ 30% LOD0, chuyển LOD không "nhảy" hình.
6. **Naming & thư mục:** đúng convention, không có `Cube.001`.
7. **Test trong engine:** bỏ vào scene thử, chạy 60 fps, không lỗi material hồng.
