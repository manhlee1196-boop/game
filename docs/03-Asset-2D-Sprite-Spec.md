# BẢNG ĐẶC TẢ SPRITE PIXEL 2D — *Vườn Mơ / Harvest Hearth*

**Chuẩn chung cho TOÀN BỘ sprite:**
- **Pixels Per Unit = 16** · 1 tile = **16×16 px** = 1 world unit.
- **Palette: 48 màu cố định** (file `vuonmo.pal` phát cho toàn team). Mỗi sprite dùng **≤ 8 màu** kể cả viền.
- **Viền ngoài (outline): 1 px màu `#3B2A33`** — không dùng đen tuyệt đối. Vật thể nằm trong bóng tối viền `#2A1E26`.
- Đổ bóng trong sprite: **2 tông + dithering 50%**, nguồn sáng giả định từ **trên-trái**.
- **Không anti-aliasing**, không gradient trong suốt dần, không hiệu ứng blur.
- **Pivot:** nhân vật/động vật/cây = **Bottom Center** (chân đứng ở đáy sprite) · icon/UI = Center · công trình = Bottom Center.
- **Export:** `PNG-8` (indexed), sprite sheet đặt tên `CAT_Name_Suffix.png`, mỗi khung cách nhau đúng 0 px (tight) và ghi rõ trong file `.json`/`.aseprite` đi kèm.
- **Nguồn gốc file:** `.aseprite` (Aseprite) hoặc `.kra`, commit cả file gốc lẫn PNG export.
- **Naming:** `SPR_<nhóm>_<tên>_<biến thể>` (VD `SPR_crop_tomato_ripe`, `SPR_char_farmer_walk_down_04`).

> **Quy ước khung animation:** `IDLE(2)` = 2 khung; `WALK(4)@8fps` = 4 khung chạy 8 khung/giây.

---

## NHÓM 1 — CÂY TRỒNG & NÔNG SẢN

### 1.1 Cây trồng 4 giai đoạn (mỗi cây = 4 sprite + 3 sprite trạng thái)

| # | Tên sprite | Kích thước | Số màu | Animation | Palette chính | Ghi chú |
|---|---|---|---|---|---|---|
| 1.1 | `crop_turnip_seed/sprout/adult/ripe` | 16×16 | 5–7 | GĐ3–4: `sway(2)@2fps`; GĐ4: `blink(2)@1.6Hz` | Lá `#8FD06B` `#6FBF57`, củ `#F2EAD8` | Củ nhô 30% khỏi đất |
| 1.2 | `crop_potato_*` | 16×16 | 5–7 | Như trên | Lá `#5FA84C` `#3E8036` | Bụi thấp, hợp trồng hàng |
| 1.3 | `crop_tomato_*` | 16×32 | 6–8 | GĐ3–4: `sway(2)`; GĐ4: quả đỏ `#E5484D`, `blink(2)` | Thân `#6E4726`, quả `#E5484D` `#FFD34E` (highlight) | Có cọc giàn ở khung adult/ripe |
| 1.4 | `crop_corn_*` | 16×32 | 6–8 | `sway(3)@2fps` mạnh hơn cây khác | Lá `#57A845`, bắp `#FFD34E` | Lá dài vượt khung 16 px theo chiều dọc |
| 1.5 | `crop_pumpkin_*` | 32×16 | 6–8 | Dây bò; GĐ4 quả to `#E5762C` | Dây `#4E9A45`, quả `#E5762C` | Chiếm 2 ô khi chín (cờ `occupiesCells=2`) |
| 1.6 | `crop_grape_*` | 16×32 | 6–8 | Chùm nho lắc `sway(2)` | Nho `#8E6BC8` `#B49BE0` | Có giàn gỗ `prop_trellis` 16×32 |
| 1.7 | `crop_snowberry_*` | 16×16 | 5–7 | GĐ4: `glow(2)@1.5Hz` | Xanh băng `#BFE3EE` `#E8F7FF` | Chỉ mùa Đông / nhà kính |
| 1.8 | `crop_rice_*` | 16×16 | 5–7 | GĐ4: bông cúi `bend(2)` | `#E8C46B` `#C9A14E` | Cần tile nước ngập |
| 1.9 | `crop_strawberry_*` | 16×16 | 6–8 | Quả `sparkle(2)` khi ≥ Bạc | `#F0556B` | Regrow 2 ngày |
| 1.10 | `crop_daikon_*` | 16×16 | 5 | GĐ4 `pop(3)` khi thu hoạch | Rễ `#F2EAD8` | — |
| 1.11 | **Sprite trạng thái chung** `crop_*_wither`, `crop_*_dead` | 16×16 | 4–6 | `wither(2)@1fps` (khẽ rung) | Nâu khô `#8A6330` `#6E4726` | Dùng cho mọi cây |

### 1.12 Cây lớn & hoa

| # | Tên sprite | Kích thước | Animation | Ghi chú |
|---|---|---|---|---|
| 1.12 | `tree_apple_spring/summer/fall/winter` | 48×64 | `sway(4)@4fps`; `shake(3)` khi thu hoạch | 4 sprite theo mùa (hoa → quả → lá vàng → trụi) |
| 1.13 | `tree_pine_*` | 48×64 | `sway(4)` | Có bản phủ tuyết |
| 1.14 | `tree_maple_*` | 48×64 | `sway(4)` + `leaf_fall(4)` | Đổi màu lá theo mùa |
| 1.15 | `bush_berry_*` | 16×16 | `sway(2)`, quả chín `blink(2)` | Hái lượm hoang |
| 1.16 | `flower_daisy/tulip/sunflower_*` | 16×16 (sunflower 16×32) | `sway(2)@2fps` | Sunflower quay theo giờ (đổi sprite nhẹ) |
| 1.17 | `grass_tuft_01..05` | 16×16 | `sway(2)` | Rải trên lớp decor, mọc lại 3 ngày sau khi cắt |

### 1.18 Nông sản & loot (item rơi)

| Tên sprite | Kích thước | Animation | Ghi chú |
|---|---|---|---|
| `item_<produce>` (16 loại) | 16×16 | `bob(2)@4fps` ngoài đất | Nảy parabol khi mới rơi (code, không phải sprite) |
| `item_<produce>_silver` | 16×16 | `sparkle(2)@2fps` | Viền xám sáng `#C8D4E0` |
| `item_<produce>_gold` | 16×16 | `sparkle(3)@3fps` | Viền vàng `#FFD34E` |
| `item_<produce>_rainbow` | 16×16 | `hue_shift(4)@4fps` | 4 khung đổi hue |
| `item_egg`, `item_egg_gold` | 12×12 | `blink(2)` (bản vàng) | Trong ổ rơm |
| `item_milk`, `item_cheese`, `item_wool`, `item_fabric` | 16×16 | `none` / `bob(2)` | Từ gia súc |
| `item_honey`, `item_honey_jar` | 12×12 / 16×16 | `buzz(2)` hạt vàng quanh | Từ Bee House |
| `icon_<item>` (UI) | 16×16 | `none` | Bản thu gọn của sprite world, **nét 1 px rõ** |

---

## NHÓM 2 — GIA SÚC & VẬT NUÔI

**Chuẩn động vật:** mỗi con có 4 hướng × (Idle 2, Walk 4, Eat 4) + 1 khung Sleep + 1 khung đặc biệt. Con lớn (bò, ngựa) vẽ ở kích thước lớn hơn nhưng **cùng số khung** để tiết kiệm thời gian.

| # | Tên sprite | Kích thước | Animation (khung) | Ghi chú |
|---|---|---|---|---|
| 2.1 | `ani_chicken_white/brown/black` | 16×16 | Idle(2), Walk(4), Peck(4), Sleep(1), **Happy_Flap(4)**, Lay(3), Pet(2) | 3 biến thể = palette swap |
| 2.2 | `ani_chicken_golden` | 16×16 | như trên + `glow(2)` | Chỉ khi ♥10 |
| 2.3 | `ani_duck` | 16×16 | Idle(2), Walk(4), **Swim(4)**, Eat(4), Sleep(1), Lay(3) | Có khung bơi trên tile nước |
| 2.4 | `ani_cow_white/brown` | 32×32 | Idle(2), Walk(4), Graze(4), Eat(4), Sleep(2), **Milk_Ready(2)**, Pet(2) | Nhai cỏ 4 khung là điểm nhấn "cozy" |
| 2.5 | `ani_goat` | 24×32 | Idle(2), Walk(4), Eat(4), Jump(3), Sleep(1), Milk_Ready(2) | — |
| 2.6 | `ani_sheep_wool` / `ani_sheep_sheared` | 24×24 | Idle(2), Walk(4), Eat(4), Sleep(1), **Shear(3)** | **2 phiên bản sprite: có lông / đã cắt** |
| 2.7 | `ani_horse` | 32×32 | Idle(2), Walk(4), Trot(6), Gallop(6), Eat(4), Sleep(1) | Phương tiện nhanh cấp 3 |
| 2.8 | `ani_dog_corgi/shiba/golden` | 20×16 | Idle(2), Walk(4), Run(4), Sit(1), Sleep(1), Bark(2), Tail_Wag(2), Fetch(4) | Palette swap cho 3 giống |
| 2.9 | `ani_cat_tabby/black/white` | 16×16 | Idle(2), Walk(4), Sit(1), Sleep(2), Stretch(4), Meow(2) | — |
| 2.10 | `fx_bees(8)`, `ani_butterfly(6)` | 8×8 | bay vòng (path code) | Dùng particle/instancing |
| 2.11 | `ani_frog(4)`, `ani_firefly(3)`, `ani_owl(4)` | 16×16 | Frog: Hop(4) · Firefly: Glow(3) · Owl: Blink(2), Hoot(2) | Sinh vật đêm ambient |

---

## NHÓM 3 — CÔNG TRÌNH, ĐỊA HÌNH & TRANG TRÍ

### 3.1 Công trình (mỗi công trình có 3 cấp)

| # | Tên sprite | Kích thước (px) | Animation | Số ô | Ghi chú |
|---|---|---|---|---|---|
| 3.1 | `build_farmhouse_lvl1..3` | 80×64 / 96×80 / 112×96 | Cửa mở(2), khói ống khói(4), đèn bật đêm(2) | 5×4 / 6×5 / 7×6 | Lvl3 có tầng 2 + ban công |
| 3.2 | `build_barn_lvl1..3` | 64×48 → 96×72 | **Cửa trượt mở(4)**, máng cỏ đầy/trống(2) | 3×4 | Chuồng bò/dê |
| 3.3 | `build_coop_lvl1..3` | 48×32 → 64×48 | **Cửa sập(3)**, ổ rơm có/không trứng(2) | 2×2 | Chuồng gà/vịt |
| 3.4 | `build_greenhouse` | 96×80 | Cửa kính(2), hơi nước(4) | 6×5 | Bảo vệ cây mùa Đông |
| 3.5 | `build_silo` | 32×48 | Hạt chảy khi xả(3) | 2×2 | Chứa thức ăn |
| 3.6 | `build_artisan_station` | 48×32 | Bánh răng xoay(4), đèn báo(2) | 2×2 | Palette-swap cho từng loại máy |
| 3.7 | `build_windmill` | 64×80 | **Cánh xoay(8)@6fps** | 4×3 | Biểu tượng của làng |
| 3.8 | `build_pier`, `build_boat` | 32×112 / 32×32 | Thuyền nhấp nhô(2) | 2×7 / 2×2 | Đánh cá |
| 3.9 | `build_bridge_wood/stone` | 16×48 | none · có bản hỏng(2) | 1×3 | Quest cộng đồng |
| 3.10 | `build_shop_general` | 96×80 | Cửa mở(2), biển đung đưa(4), đèn đêm(2) | 6×5 | Tạp hóa bà Hòa |
| 3.11 | `build_townhall` | 112×96 | Đồng hồ chạy(4), cờ(4) | 7×6 | Quest cộng đồng |
| 3.12 | `build_mine_entrance` | 64×64 | Xe goòng(4), đèn nhấp nháy(2) | 4×4 | Vào hầm mỏ |
| 3.13 | `build_festival_stage` | 160×96 | Đèn nháy(4), cờ(4) — 4 bản theo mùa | 10×6 | Tái dùng cho 4 lễ hội |
| 3.14 | `build_chapel` | 80×80 | Chuông rung(4) | 5×5 | Lễ cưới |
| 3.15 | `build_npc_house_01..06` | 64×64 | Cửa mở(2), đèn đêm(2) | 4×4 | 6 kiểu khác nhau |

### 3.2 Địa hình & Tilemap

| # | Tên tile | Kích thước | Số khung | Ghi chú |
|---|---|---|---|---|
| 3.16 | `tile_grass_<mùa>` | 16×16 | 4 biến thể ngẫu nhiên | Rule Tile tự nối viền |
| 3.17 | `tile_grass_scatter_<mùa>` | 16×16 | 6 biến thể (hoa, sỏi, cỏ nhỏ) | Rải tự động theo seed |
| 3.18 | `tile_soil_tilled` / `tile_soil_watered` | 16×16 | 1 / **watered(2)@1fps** | Đất tưới sẫm hơn 1 tone |
| 3.19 | `tile_soil_weed_01..03`, `tile_soil_pest` | 16×16 | weed(2), pest(2) | Lớp decor |
| 3.20 | `tile_path_dirt`, `tile_path_stone` | 16×16 | Rule Tile | Nối viền tự động |
| 3.21 | `tile_water_center/edge` | 16×16 | **water(4)@4fps** | 4 khung gợn sóng |
| 3.22 | `tile_cliff_*` (12 tile) | 16×16 | none | Modular, ghép được mọi địa hình |
| 3.23 | `tile_shore_*` (8 tile) | 16×16 | foam(3)@3fps | Bờ nước có bọt |
| 3.24 | `tile_rail`, `tile_puddle` | 16×16 | puddle(2) | Đường mỏ, vũng mưa |

### 3.25 Trang trí & nội thất

| # | Tên sprite | Kích thước | Animation | Ghi chú |
|---|---|---|---|---|
| 3.25 | `prop_fence_*` (6 kiểu) | 16×16 | Cổng mở(3) | Hàng rào |
| 3.26 | `prop_furniture_*` (24 món, 5 theme) | 16×16 → 48×32 | Ngăn kéo mở(3), kệ có đồ(2) | Theme Mộc/Thôn/Đông/Pháp/Nhật |
| 3.27 | `prop_lamp_lantern_01..04` | 16×24 | **lit(2)@1.5fps** | Đèn bật theo giờ |
| 3.28 | `prop_chest_lvl1..3` | 16×16 | Nắp mở(3) | 20/40/80 ô |
| 3.29 | `prop_sign_wood/board` | 16×16 | đung đưa(2) | Bảng tin quest |
| 3.30 | `prop_scarecrow` | 16×24 | sway(2); quạ bay đi(4) | Giảm 100% quạ phá |
| 3.31 | `prop_sprinkler` | 16×16 | Spray(4) | Tự tưới 4 ô |
| 3.32 | `prop_beehive` | 16×24 | Ong ra vào(4) | — |
| 3.33 | `prop_weathervane` | 16×24 | **quay theo gió(8)** | Báo thời tiết trực quan |
| 3.34 | `prop_well`, `prop_fountain` | 32×32 / 48×48 | Nước(4), gàu lên xuống(4) | Nguồn nước |
| 3.35 | `prop_picnic`, `prop_swing` | 32×24 | Swing(4) | NPC ngồi cùng → +tim |
| 3.36 | `prop_postbox`, `prop_noticeboard` | 16×24 | Cờ đỏ bật lên(2) | Báo thư/quest |
| 3.37 | `fx_smoke(4)`, `fx_dust(3)`, `fx_leaf(4)`, `fx_water_splash(4)`, `fx_sparkle(3)` | 16×16 | — | Hiệu ứng dùng chung cho mọi hành động |
| 3.38 | `fx_emote_love/question/angry/happy/sleep(2 mỗi loại)` | 16×16 | bounce(2) | Bong bóng cảm xúc NPC |

---

## NHÓM 4 — NHÂN VẬT, TRANG PHỤC & CÔNG CỤ

### 4.1 Nhân vật người chơi

| # | Tên sprite sheet | Kích thước khung | Số khung | Ghi chú |
|---|---|---|---|---|
| 4.1 | `char_farmer_base_idle` | 16×24 | 4 hướng × 2 = 8 | Hô hấp nhẹ 2 khung |
| 4.2 | `char_farmer_base_walk` | 16×24 | 4 hướng × 4 = 16 @8fps | Khung 3 = chân trái, khung 6 = chân phải |
| 4.3 | `char_farmer_base_run` | 16×24 | 4 hướng × 6 = 24 @10fps | — |
| 4.4 | `char_tool_hoe` | 16×24 | 4 khung (4 hướng dùng chung 2 bản trái/phải) | Vung + chạm đất |
| 4.5 | `char_tool_water` | 16×24 | 4 khung | Nghiêng bình, giọt nước |
| 4.6 | `char_tool_harvest` | 16×24 | 3 khung | Cúi nhặt |
| 4.7 | `char_tool_fish` | 16×24 | 8 khung (Cast→Wait→Hook→Reel) | Dây câu vẽ 1 px |
| 4.8 | `char_emote_*` (Wave, Cheer, Think, Laugh, Sit, Sleep) | 16×24 | 2–4 khung mỗi cái | — |
| 4.9 | `char_hair_01..08` | 16×24 | phủ lên base (layer riêng) | 8 kiểu tóc, tái dùng animation base |
| 4.10 | `outfit_overall_<6 màu>` | 16×24 | palette swap | Bộ mặc định |
| 4.11 | `outfit_raincoat`, `outfit_winter`, `outfit_festival_xuan/ha/thu/dong`, `outfit_wedding` | 16×24 | palette swap + 1 lớp phụ kiện | Mở khóa theo mùa/sự kiện |
| 4.12 | `acc_hat_01..07`, `acc_glasses`, `acc_scarf` | 16×16 | theo base | Layer trên đầu/cổ |
| 4.13 | `acc_bag_lvl1..3` | 16×16 | **túi phồng dần theo số ô đã dùng (3 sprite)** | Feedback trực quan |

> **Tiết kiệm thời gian:** nhân vật + NPC dùng **cùng 1 base animation set**; mọi khác biệt (da, tóc, quần áo) là **layer phủ + palette swap**. Một artist chỉ cần vẽ 1 bộ base là có 10 NPC.

### 4.2 NPC chính (10 người)

| # | Tên sprite | Kích thước | Animation | Ghi chú |
|---|---|---|---|---|
| 4.14 | `npc_hoa` (Bà Hòa) | 16×24 | Base + `Shop_Idle(2)`, `Sweep(4)` | Tạp dề, tóc bạc |
| 4.15 | `npc_bay` (Ông Bảy) | 16×24 | Base + `Cast_Rod(6)`, `Sit_Smoke(2)` | Mũ rơm cũ, cần câu |
| 4.16 | `npc_linh`, `npc_minh`, `npc_han`, `npc_bao`, `npc_thu`, `npc_tuyet` | 16×24 | Base + 1 animation đặc trưng mỗi người | Tóc + phụ kiện phân biệt |
| 4.17 | `npc_nam` (học sinh) | 16×24 | Base + `Run_Bouncy(6)`, `Play_Ball(4)` | Nhỏ hơn 2 px |
| 4.18 | `npc_mysterious` | 16×28 | Base + `Float_Idle(2)`, `Vanish(4)` | Áo choàng, hiệu ứng tan biến |

### 4.3 Công cụ (mỗi công cụ 3 cấp: Gỗ → Sắt → Vàng)

| # | Tên sprite | Kích thước | Animation khi dùng | Ghi chú |
|---|---|---|---|---|
| 4.19 | `tool_hoe_wood/iron/gold` | 16×16 | Vung(4 khung, chung cho mọi cấp) | Cấp mới = palette swap + 1 chi tiết lấp lánh |
| 4.20 | `tool_wateringcan_*` | 16×16 | Nghiêng(4) + `empty(2)` khi hết nước | Giọt nước 1 px |
| 4.21 | `tool_sickle_*` | 16×16 | Gạt(4) | — |
| 4.22 | `tool_axe_*` | 16×16 | Chặt A/B(2×3) | 2 clip luân phiên cho tự nhiên |
| 4.23 | `tool_pickaxe_*` | 16×16 | Vung(4) | Vào mỏ |
| 4.24 | `tool_fishingrod_*` | 16×16 | Cast(4) + dây câu (line renderer pixel) | — |
| 4.25 | `tool_seedbag_*` (8 biến thể màu) | 16×16 | Gieo(3) | Đổi màu theo loại hạt |
| 4.26 | `vehicle_machine_harvester` | 32×32 | Idle(2), Chạy(4) + bánh xoay(4) | Máy gặt cầm tay |
| 4.27 | `vehicle_tractor` | 48×32 | Chạy(4) + bánh xoay(4) + khói(4) | Máy cày |
| 4.28 | `vehicle_plane_cropduster` | 64×32 | Bay(4) + cánh(4) | Máy bay phun thuốc |

---

## TỔNG KẾT NGÂN SÁCH SẢN XUẤT

| Nhóm | Số sprite/khung | Thời gian (1 artist) | Ghi chú |
|---|---|---|---|
| 1. Cây trồng & nông sản | ~420 khung | 8 tuần | 10 cây × 7 sprite + cây lớn + loot |
| 2. Gia súc & vật nuôi | ~380 khung | 7 tuần | 12 loài × (4 hướng × 8–10 khung) |
| 3. Công trình, địa hình, trang trí | ~600 khung (tile dùng lại nhiều) | 10 tuần | Ưu tiên tile + Rule Tile trước |
| 4. Nhân vật, trang phục, công cụ | ~520 khung | 9 tuần | **1 base dùng cho cả Player + 10 NPC** |
| **TỔNG** | **~1.920 khung sprite** | **≈ 34 tuần (1 artist) · 17 tuần (2 artist)** | Kèm 1 file palette `.pal` dùng chung |

> So sánh với bản 3D (≈ 370 model, 44 tuần): **pixel art nhanh hơn ~25%** nhưng đòi hỏi **kỷ luật palette** cao hơn — vì chỉ cần lệch 1 tone là cả sprite "lạc quẻ".

### Checklist kiểm tra chất lượng (mỗi sprite trước khi giao)

- [ ] **Silhouette test:** đổ đen toàn bộ → vẫn nhận ra vật thể ở 100% zoom và khi thu nhỏ 50%.
- [ ] **Palette test:** mọi màu nằm trong `vuonmo.pal`, ≤ 8 màu/sprite.
- [ ] **Outline test:** viền 1 px liền mạch, không có pixel đơn lẻ lạc (stray pixel) ở các góc.
- [ ] **Dither test:** vùng chuyển sáng-tối dùng checkerboard đều, không bị "nhiễu hạt".
- [ ] **Pivot & PPU:** pivot Bottom Center, PPU = 16, kích thước chia hết cho 16 khi cần.
- [ ] **Loop test:** khung cuối → khung đầu của walk/idle không bị "giật" (kiểm bằng cách chạy 10 vòng).
- [ ] **Test trong engine:** bỏ vào scene, chạy 60 fps, **không bị blur** (Filter Mode = Point), không rung khi camera di chuyển.
- [ ] **Naming & thư mục:** đúng convention, không có `sprite_final_final2.png`.
