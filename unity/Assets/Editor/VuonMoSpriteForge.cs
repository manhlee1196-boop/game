// ============================================================================
//  VuonMoSpriteForge.cs — SINH SPRITE TẠM (placeholder) bằng code
//  Đặt tại: Assets/Editor/
//  Menu: Vườn Mơ ▸ 1 · Sinh Sprite Tạm
//
//  Vì sao có file này: chưa vẽ art thật thì SpriteRenderer sẽ trắng trơn / ô hồng,
//  không cảm nhận được cây lớn theo giai đoạn. File này vẽ tay bằng code (pixel 16×16)
//  rồi ghi ra PNG đúng chuẩn import (Point filter · PPU 16 · không nén).
//
//  Sinh ra 109 sprite: ô đất 4 mùa/nước/đường, 8 cây × 6 giai đoạn, 8 nông sản,
//  8 túi hạt, nhân vật 4 hướng × 2 khung, 8 icon công cụ, 8 công trình, 6 icon thời tiết, UI.
// → Thay dần bằng art thật trong Assets/VuonMo/Art/Placeholder (giữ nguyên tên file).
// ============================================================================
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;

namespace VuonMo.EditorTools
{
    public static class VuonMoSpriteForge
    {
        // ===================================================================== BẢNG MÀU
        public static readonly Color32 Clear   = new Color32(0, 0, 0, 0);
        public static readonly Color32 Ink     = new Color32(0x3B, 0x2A, 0x33, 255);

        public static readonly Color32 GrassSp = new Color32(0x8F, 0xD0, 0x6B, 255);
        public static readonly Color32 GrassSu = new Color32(0x6F, 0xBF, 0x57, 255);
        public static readonly Color32 GrassFa = new Color32(0xB5, 0x9B, 0x4E, 255);
        public static readonly Color32 GrassWi = new Color32(0xDD, 0xE7, 0xF0, 255);
        public static readonly Color32 GrassSp2 = new Color32(0x6F, 0xBF, 0x57, 255);
        public static readonly Color32 GrassSu2 = new Color32(0x57, 0xA8, 0x45, 255);
        public static readonly Color32 GrassFa2 = new Color32(0x9C, 0x83, 0x3C, 255);
        public static readonly Color32 GrassWi2 = new Color32(0xC3, 0xD2, 0xE0, 255);

        public static readonly Color32 Soil     = new Color32(0x8A, 0x5F, 0x33, 255);
        public static readonly Color32 SoilDark = new Color32(0x6E, 0x47, 0x26, 255);
        public static readonly Color32 SoilWet  = new Color32(0x5A, 0x3A, 0x1E, 255);
        public static readonly Color32 Water    = new Color32(0x4F, 0xA8, 0xD8, 255);
        public static readonly Color32 WaterHi  = new Color32(0x7F, 0xD3, 0xE8, 255);
        public static readonly Color32 Wood     = new Color32(0xB5, 0x82, 0x52, 255);
        public static readonly Color32 WoodDark = new Color32(0x8A, 0x5F, 0x33, 255);
        public static readonly Color32 WoodDeep = new Color32(0x6E, 0x47, 0x26, 255);
        public static readonly Color32 Stone    = new Color32(0x9A, 0xA5, 0xB1, 255);
        public static readonly Color32 StoneDk  = new Color32(0x6E, 0x7A, 0x88, 255);
        public static readonly Color32 Cream    = new Color32(0xFF, 0xE9, 0xB8, 255);
        public static readonly Color32 Gold     = new Color32(0xFF, 0xD3, 0x4E, 255);
        public static readonly Color32 Skin     = new Color32(0xF2, 0xC9, 0xA0, 255);
        public static readonly Color32 Cloth    = new Color32(0x5A, 0x78, 0xB8, 255);
        public static readonly Color32 ClothDk  = new Color32(0x3B, 0x4E, 0x82, 255);
        public static readonly Color32 Leaf     = new Color32(0x6F, 0xBF, 0x57, 255);
        public static readonly Color32 LeafDk   = new Color32(0x4E, 0x9A, 0x45, 255);
        public static readonly Color32 Weed     = new Color32(0x57, 0xA8, 0x45, 255);
        public static readonly Color32 Pest     = new Color32(0x8B, 0x3A, 0x62, 255);
        public static readonly Color32 Snow     = new Color32(0xF2, 0xF7, 0xFF, 255);
        public static readonly Color32 White    = new Color32(0xFF, 0xFF, 0xFF, 255);

        // ===================================================================== ĐƯỜNG DẪN
        public static string PathOf(string key) { return VuonMoPaths.Art + "/" + key + ".png"; }

        public static Sprite Get(string key)
        {
            return AssetDatabase.LoadAssetAtPath<Sprite>(PathOf(key));
        }

        // ===================================================================== MENU
        [MenuItem("Vườn Mơ/1 · Sinh Sprite Tạm (placeholder)", false, 1)]
        public static void MenuGenerate()
        {
            Dictionary<string, Sprite> map = GenerateAll(true);
            VuonMoUtil.Report("ĐÃ SINH SPRITE TẠM",
                "Số sprite: " + map.Count + "\nThư mục: " + VuonMoPaths.Art +
                "\n\nĐây là art TẠM để chơi được ngay — vẽ art thật theo docs/03 rồi ghi đè cùng tên file.");
        }

        /// <summary>Sinh toàn bộ sprite tạm. force=false → chỉ tạo file còn thiếu.</summary>
        public static Dictionary<string, Sprite> GenerateAll(bool force)
        {
            VuonMoUtil.EnsureFolder(VuonMoPaths.Art);
            var map = new Dictionary<string, Sprite>();

            // ---------------------------------------------------------- 1) Ô ĐẤT
            Add(map, "tile_grass_spring", 16, 16, force, delegate (Pix p) { Grass(p, GrassSp, GrassSp2); });
            Add(map, "tile_grass_summer", 16, 16, force, delegate (Pix p) { Grass(p, GrassSu, GrassSu2); });
            Add(map, "tile_grass_fall",   16, 16, force, delegate (Pix p) { Grass(p, GrassFa, GrassFa2); });
            Add(map, "tile_grass_winter", 16, 16, force, delegate (Pix p) { Grass(p, GrassWi, GrassWi2); });
            Add(map, "tile_dirt_path",    16, 16, force, delegate (Pix p) { DirtPath(p); });
            Add(map, "tile_soil",         16, 16, force, delegate (Pix p) { SoilTile(p, false); });
            Add(map, "tile_soil_wet",     16, 16, force, delegate (Pix p) { SoilTile(p, true); });
            Add(map, "tile_water",        16, 16, force, delegate (Pix p) { WaterTile(p); });
            Add(map, "tile_weed",         16, 16, force, delegate (Pix p) { WeedTile(p); });
            Add(map, "tile_pest",         16, 16, force, delegate (Pix p) { PestTile(p); });

            // ---------------------------------------------------------- 2) CÂY TRỒNG
            foreach (CropArt c in Crops)
            {
                string[] suffix = { "seed", "sprout", "mature", "ripe", "wither", "dead" };
                for (int s = 0; s < suffix.Length; s++)
                {
                    int stage = s;
                    CropArt crop = c;
                    Add(map, "crop_" + c.id + "_" + suffix[s], 16, 16, force,
                        delegate (Pix p) { CropTile(p, crop, stage); });
                }
                // nông sản + túi hạt
                CropArt c2 = c;
                Add(map, "item_" + c.id, 16, 16, force, delegate (Pix p) { Produce(p, c2.fruit, c2.fruitDk); });
                CropArt c3 = c;
                Add(map, "item_seed_" + c.id, 16, 16, force, delegate (Pix p) { SeedBag(p, c3.fruit); });
            }
            Add(map, "item_wood",  16, 16, force, delegate (Pix p) { WoodItem(p); });
            Add(map, "item_stone", 16, 16, force, delegate (Pix p) { StoneItem(p); });

            // ---------------------------------------------------------- 3) NHÂN VẬT
            string[] dirs = { "down", "up", "left", "right" };
            for (int d = 0; d < dirs.Length; d++)
            {
                int dir = d;
                for (int f = 0; f < 2; f++)
                {
                    int frame = f;
                    Add(map, "player_" + dirs[d] + "_" + f, 16, 24, force,
                        delegate (Pix p) { Player(p, dir, frame); }, new Vector2(0.5f, 0f));
                }
            }
            Add(map, "player_shadow", 16, 8, force, delegate (Pix p) { Shadow(p); }, new Vector2(0.5f, 0.5f));

            // ---------------------------------------------------------- 4) CÔNG CỤ
            string[] tools = { "hoe", "wateringcan", "sickle", "axe", "pickaxe", "fishingrod", "seedbag", "hand" };
            for (int t = 0; t < tools.Length; t++)
            {
                int tool = t;
                Add(map, "tool_" + tools[t], 16, 16, force, delegate (Pix p) { ToolIcon(p, tool); });
            }

            // ---------------------------------------------------------- 5) CÔNG TRÌNH
            Add(map, "prop_house", 48, 40, force, delegate (Pix p) { House(p); }, new Vector2(0.5f, 0f));
            Add(map, "prop_barn",  48, 40, force, delegate (Pix p) { Barn(p); },  new Vector2(0.5f, 0f));
            Add(map, "prop_coop",  32, 32, force, delegate (Pix p) { Coop(p); },  new Vector2(0.5f, 0f));
            Add(map, "prop_well",  16, 24, force, delegate (Pix p) { Well(p); },  new Vector2(0.5f, 0f));
            Add(map, "prop_tree",  32, 48, force, delegate (Pix p) { Tree(p, false); }, new Vector2(0.5f, 0f));
            Add(map, "prop_tree_winter", 32, 48, force, delegate (Pix p) { Tree(p, true); }, new Vector2(0.5f, 0f));
            Add(map, "prop_fence", 16, 16, force, delegate (Pix p) { Fence(p); });
            Add(map, "prop_sign",  16, 16, force, delegate (Pix p) { Sign(p); });

            // ---------------------------------------------------------- 6) THỜI TIẾT & UI
            string[] weather = { "sunny", "cloudy", "rain", "storm", "snow", "fog" };
            for (int w = 0; w < weather.Length; w++)
            {
                int kind = w;
                Add(map, "weather_" + weather[w], 16, 16, force, delegate (Pix p) { WeatherIcon(p, kind); });
            }
            Add(map, "ui_white", 8, 8, force, delegate (Pix p) { p.R(0, 0, 8, 8, White); });
            Add(map, "ui_panel", 16, 16, force, delegate (Pix p) { Panel(p); });

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            return map;
        }

        private static void Add(Dictionary<string, Sprite> map, string key, int w, int h, bool force,
                                System.Action<Pix> draw, Vector2? pivot = null)
        {
            string diskPath = PathOf(key);
            Sprite existing = AssetDatabase.LoadAssetAtPath<Sprite>(diskPath);
            if (existing == null || force)
            {
                Pix p = new Pix(w, h);
                draw(p);
                existing = VuonMoUtil.SaveSprite(p.ToTexture(), VuonMoPaths.Art, key,
                                                 pivot.HasValue ? pivot.Value : new Vector2(0.5f, 0.5f));
            }
            map[key] = existing;
        }

        // ===================================================================== BẢNG CÂY
        public class CropArt
        {
            public string id;
            public string shape;      // "bush" | "trellis" | "stalk" | "vine" | "flower"
            public Color32 leaf, leafDk, fruit, fruitDk;
            public CropArt(string id, string shape, Color32 leaf, Color32 leafDk, Color32 fruit, Color32 fruitDk)
            { this.id = id; this.shape = shape; this.leaf = leaf; this.leafDk = leafDk; this.fruit = fruit; this.fruitDk = fruitDk; }
        }

        public static readonly CropArt[] Crops = new CropArt[]
        {
            new CropArt("turnip",   "bush",    C(0x8F,0xD0,0x6B), C(0x4E,0x9A,0x45), C(0xF2,0xF0,0xE4), C(0xC9,0xC6,0xB4)),
            new CropArt("potato",   "bush",    C(0x7F,0xC4,0x5F), C(0x4E,0x9A,0x45), C(0xC9,0xA2,0x6A), C(0x9C,0x7A,0x4A)),
            new CropArt("tomato",   "trellis", C(0x6F,0xBF,0x57), C(0x3E,0x80,0x36), C(0xE5,0x48,0x4D), C(0xB0,0x2F,0x38)),
            new CropArt("corn",     "stalk",   C(0x9A,0xD1,0x5C), C(0x57,0xA8,0x45), C(0xFF,0xD3,0x4E), C(0xD8,0xA8,0x28)),
            new CropArt("pumpkin",  "vine",    C(0x6F,0xBF,0x57), C(0x40,0x7C,0x38), C(0xE5,0x76,0x2C), C(0xB5,0x55,0x1C)),
            new CropArt("grape",    "trellis", C(0x74,0xC4,0x6A), C(0x46,0x8E,0x44), C(0x8E,0x5B,0xC4), C(0x6A,0x3F,0x98)),
            new CropArt("snowdrop", "flower",  C(0xA8,0xD8,0xC4), C(0x62,0xA0,0x94), C(0xF2,0xF7,0xFF), C(0xC3,0xD2,0xE0)),
            new CropArt("rice",     "stalk",   C(0x86,0xC9,0x5A), C(0x4E,0x8E,0x40), C(0xE8,0xD8,0x8A), C(0xC0,0xAE,0x60)),
        };

        private static Color32 C(int r, int g, int b) { return new Color32((byte)r, (byte)g, (byte)b, 255); }

        // ===================================================================== VẼ: Ô ĐẤT
        private static void Grass(Pix p, Color32 baseC, Color32 fleck)
        {
            p.R(0, 0, 16, 16, baseC);
            p.R(2, 3, 2, 1, fleck); p.R(7, 8, 2, 1, fleck); p.R(11, 2, 1, 1, fleck);
            p.R(4, 12, 2, 1, fleck); p.R(13, 10, 1, 1, fleck); p.R(9, 14, 1, 1, fleck);
        }

        private static void DirtPath(Pix p)
        {
            p.R(0, 0, 16, 16, Wood);
            p.R(2, 2, 2, 1, WoodDark); p.R(8, 5, 3, 1, WoodDark); p.R(12, 9, 2, 1, WoodDark);
            p.R(1, 11, 2, 1, WoodDark); p.R(6, 13, 2, 1, WoodDark); p.R(10, 1, 1, 1, WoodDark);
        }

        private static void SoilTile(Pix p, bool wet)
        {
            // Đất đã cuốc: nền phẳng + cục đất lổm chổm + 2 luống ngắn (KHÔNG kẻ kín
            // cả chiều ngang, nếu không sẽ trông như ván gỗ).
            p.R(0, 0, 16, 16, wet ? SoilWet : Soil);
            // luống ngắn, so le
            p.R(1, 5, 5, 1, SoilDark); p.R(10, 5, 5, 1, SoilDark);
            p.R(5, 10, 6, 1, SoilDark);
            // cục đất
            p.P(3, 2, SoilDark); p.P(11, 3, SoilDark); p.P(7, 7, SoilDark);
            p.P(2, 12, SoilDark); p.P(13, 9, SoilDark); p.P(9, 14, SoilDark);
            p.P(6, 3, Soil); p.P(12, 13, Soil);
            if (wet)
            {
                p.P(4, 3, WaterHi); p.P(9, 12, WaterHi); p.P(13, 6, WaterHi);
                p.P(2, 8, WaterHi); p.P(7, 14, WaterHi);
            }
        }

        private static void WaterTile(Pix p)
        {
            p.R(0, 0, 16, 16, Water);
            p.R(0, 4, 16, 1, WaterHi); p.R(0, 11, 16, 1, new Color32(0x3E, 0x8F, 0xC0, 255));
            p.R(3, 7, 3, 1, WaterHi); p.R(10, 2, 2, 1, WaterHi);
        }

        private static void WeedTile(Pix p)
        {
            p.R(1, 11, 1, 4, Weed); p.R(3, 10, 1, 5, Weed);
            p.R(11, 11, 1, 4, Weed); p.R(13, 9, 1, 6, Weed); p.R(7, 12, 1, 3, Weed);
        }

        private static void PestTile(Pix p)
        {
            p.R(7, 6, 2, 2, Pest); p.P(6, 5, Ink); p.P(9, 5, Ink);
            p.R(6, 8, 1, 1, Pest); p.R(9, 8, 1, 1, Pest);
        }

        // ===================================================================== VẼ: CÂY
        private static void CropTile(Pix p, CropArt c, int stage)
        {
            // Mọi giai đoạn đều chạm hàng cuối (y = 15) để cây đứng trên mặt đất,
            // vì sprite dùng pivot Bottom Center.
            switch (stage)
            {
                case 0:   // Hạt: gò đất + 3 hạt
                    p.R(4, 14, 8, 2, SoilDark); p.R(4, 14, 8, 1, Soil);
                    p.P(5, 13, Ink); p.P(8, 13, Ink); p.P(10, 13, Ink);
                    return;
                case 1:   // Mầm: thân + 2 lá mầm
                    p.R(7, 10, 1, 6, c.leafDk);
                    p.R(4, 10, 3, 1, c.leaf); p.R(9, 10, 3, 1, c.leaf);
                    p.R(7, 9, 1, 1, c.leaf);
                    return;
                case 4:   // Héo: khô, rũ
                    p.R(7, 11, 1, 5, new Color32(0x8A, 0x6A, 0x3A, 255));
                    p.R(5, 12, 2, 1, new Color32(0xA8, 0x86, 0x4A, 255));
                    p.R(9, 13, 2, 1, new Color32(0xA8, 0x86, 0x4A, 255));
                    return;
                case 5:   // Chết: gốc khô
                    p.R(6, 15, 4, 1, SoilDark);
                    p.R(7, 13, 1, 2, new Color32(0x8A, 0x6A, 0x3A, 255));
                    return;
            }

            bool ripe = stage == 3;
            switch (c.shape)
            {
                case "trellis":   // cà chua, nho: 2 cọc + 2 giàn ngang + tán lá
                    p.R(3, 7, 1, 9, WoodDark); p.R(12, 7, 1, 9, WoodDark);
                    p.R(3, 10, 10, 1, WoodDark); p.R(3, 13, 10, 1, WoodDark);
                    p.R(4, 8, 8, 2, c.leaf); p.R(4, 11, 8, 2, c.leafDk);
                    p.R(5, 14, 6, 1, c.leaf);
                    break;
                case "stalk":     // ngô, lúa: thân cao + 5 lá so le
                    p.R(7, 3, 2, 13, c.leafDk);
                    p.R(3, 5, 4, 1, c.leaf); p.R(3, 9, 4, 1, c.leaf);
                    p.R(9, 7, 4, 1, c.leaf); p.R(9, 11, 4, 1, c.leaf);
                    p.R(3, 13, 4, 1, c.leaf);
                    p.R(5, 15, 6, 1, c.leafDk);                       // gốc chạm đất
                    break;
                case "vine":      // bí ngô: dây bò ngang + 2 lá to
                    p.R(2, 15, 12, 1, c.leafDk);                      // dây sát đất
                    p.R(3, 12, 4, 3, c.leaf); p.R(9, 12, 4, 3, c.leaf);
                    p.R(6, 10, 4, 2, c.leafDk);
                    p.R(2, 9, 4, 1, c.leaf);
                    break;
                case "flower":    // bông tuyết: bụi + nụ trắng
                    p.R(4, 11, 8, 4, c.leaf);
                    p.R(5, 15, 6, 1, c.leafDk);
                    p.R(3, 12, 1, 3, c.leafDk); p.R(12, 12, 1, 3, c.leafDk);
                    break;
                default:          // bush: củ cải, khoai tây
                    p.R(4, 10, 8, 5, c.leaf);
                    p.R(4, 15, 8, 1, c.leafDk);                       // gốc chạm đất
                    p.R(3, 12, 1, 3, c.leafDk); p.R(12, 12, 1, 3, c.leafDk);
                    p.R(6, 9, 4, 1, c.leafDk);
                    break;
            }

            if (ripe)
            {
                // quả chín: chấm màu to + điểm sáng nhấp nháy (mỗi dáng đặt khác nhau)
                switch (c.shape)
                {
                    case "stalk":     // 2 bắp trên thân
                        p.R(6, 9, 2, 4, c.fruit); p.R(9, 5, 2, 4, c.fruit);
                        p.P(6, 9, c.fruitDk); p.P(7, 9, White);
                        break;
                    case "trellis":   // chùm quả dưới giàn
                        p.R(4, 11, 2, 2, c.fruit); p.R(9, 11, 2, 2, c.fruit);
                        p.R(7, 14, 2, 1, c.fruit);
                        p.P(4, 11, c.fruitDk); p.P(5, 11, White);
                        break;
                    case "flower":    // nụ trắng nổi trên bụi
                        p.R(5, 9, 2, 2, c.fruit); p.R(9, 9, 2, 2, c.fruit);
                        p.R(7, 12, 2, 2, c.fruit);
                        p.P(9, 9, c.fruitDk); p.P(10, 9, White);
                        break;
                    default:          // bush & vine: quả nằm trên luống
                        p.R(4, 12, 2, 2, c.fruit); p.R(10, 12, 2, 2, c.fruit);
                        p.R(7, 13, 2, 2, c.fruit);
                        p.P(4, 12, c.fruitDk); p.P(5, 12, White);
                        break;
                }
            }
        }

        // ===================================================================== VẼ: VẬT PHẨM
        private static void Produce(Pix p, Color32 fruit, Color32 fruitDk)
        {
            p.R(4, 5, 8, 8, fruit);
            p.R(4, 4, 8, 1, fruit);
            p.P(5, 6, White); p.P(6, 6, White);            // điểm sáng
            p.R(4, 12, 8, 1, fruitDk);
            p.R(7, 2, 2, 3, LeafDk); p.R(9, 3, 2, 1, Leaf); // cuống + lá
        }

        private static void SeedBag(Pix p, Color32 fruit)
        {
            p.R(4, 6, 8, 8, new Color32(0xD8, 0xC8, 0xA8, 255));
            p.R(4, 6, 8, 1, new Color32(0xB8, 0xA8, 0x88, 255));
            p.R(6, 3, 4, 3, new Color32(0xB8, 0xA8, 0x88, 255));
            p.R(6, 8, 4, 3, fruit);                         // nhãn màu nông sản
            p.P(9, 6, Ink);
        }

        private static void WoodItem(Pix p)
        {
            p.R(2, 7, 12, 3, Wood); p.R(2, 10, 12, 3, WoodDark);
            p.R(2, 7, 12, 1, new Color32(0xD0, 0xA0, 0x6A, 255));
            p.R(2, 12, 12, 1, WoodDeep);
        }

        private static void StoneItem(Pix p)
        {
            p.R(4, 6, 8, 7, Stone); p.R(5, 5, 6, 1, Stone);
            p.R(4, 11, 8, 2, StoneDk); p.P(6, 7, White);
        }

        private static void ToolIcon(Pix p, int tool)
        {
            switch (tool)
            {
                case 0:  // cuốc
                    p.R(3, 3, 2, 10, WoodDark); p.R(5, 3, 5, 2, Stone);
                    break;
                case 1:  // bình tưới
                    p.R(4, 7, 7, 6, Stone); p.R(4, 7, 7, 1, StoneDk);
                    p.R(10, 5, 4, 2, StoneDk); p.R(11, 4, 2, 1, Stone);
                    p.R(5, 4, 3, 3, StoneDk);
                    break;
                case 2:  // liềm
                    p.R(4, 3, 2, 9, WoodDark); p.R(6, 3, 6, 2, Stone);
                    p.R(11, 4, 2, 3, StoneDk);
                    break;
                case 3:  // rìu
                    p.R(7, 4, 2, 9, WoodDark); p.R(4, 3, 4, 4, Stone);
                    p.R(4, 6, 5, 1, StoneDk);
                    break;
                case 4:  // cuốc chim
                    p.R(7, 4, 2, 9, WoodDark); p.R(3, 4, 9, 2, StoneDk);
                    break;
                case 5:  // cần câu
                    p.R(4, 3, 1, 11, WoodDark); p.R(5, 3, 6, 1, StoneDk);
                    p.P(11, 4, White); p.R(11, 5, 1, 2, WaterHi);
                    break;
                case 6:  // túi hạt
                    p.R(4, 7, 8, 6, new Color32(0xD8, 0xC8, 0xA8, 255));
                    p.R(6, 4, 4, 3, new Color32(0xB8, 0xA8, 0x88, 255));
                    p.R(6, 9, 4, 2, LeafDk);
                    break;
                default: // tay không
                    p.R(6, 6, 4, 6, Skin); p.R(6, 12, 4, 1, new Color32(0xD8, 0xA8, 0x7C, 255));
                    break;
            }
        }

        // ===================================================================== VẼ: CÔNG TRÌNH
        private static void House(Pix p)
        {
            Color32 wall = new Color32(0xE8, 0xDC, 0xC0, 255);
            Color32 wallDk = new Color32(0xC8, 0xBC, 0xA0, 255);
            Color32 roof = new Color32(0x8C, 0x4A, 0x3A, 255);
            p.R(6, 16, 36, 24, wall); p.R(6, 16, 36, 1, wallDk);
            for (int i = 0; i < 8; i++) p.R(20 - i * 2, 6 + i, 8 + i * 4, 1, roof);     // mái dốc (hẹp trên → rộng dưới)
            p.R(4, 15, 40, 2, roof);
            p.R(20, 28, 8, 12, new Color32(0x8A, 0x5F, 0x33, 255));                        // cửa
            p.P(26, 34, Gold);
            p.R(10, 20, 6, 6, new Color32(0x9A, 0xC8, 0xE0, 255));                         // cửa sổ
            p.R(32, 20, 6, 6, new Color32(0x9A, 0xC8, 0xE0, 255));
        }

        private static void Barn(Pix p)
        {
            Color32 wall = new Color32(0xB0, 0x4A, 0x3A, 255);
            Color32 wallDk = new Color32(0x8A, 0x38, 0x2C, 255);
            Color32 roof = new Color32(0x6E, 0x47, 0x26, 255);
            p.R(4, 14, 40, 26, wall);
            p.R(4, 14, 40, 1, wallDk);
            for (int i = 0; i < 6; i++) p.R(19 - i * 3, 8 + i, 10 + i * 6, 1, roof);
            p.R(2, 13, 44, 2, roof);
            p.R(16, 24, 16, 16, wallDk); p.R(18, 26, 12, 12, new Color32(0x5A, 0x2E, 0x22, 255));
            p.R(16, 24, 16, 1, Cream);
            p.R(24, 24, 1, 16, Cream);
        }

        private static void Coop(Pix p)
        {
            Color32 wall = new Color32(0xD8, 0xB0, 0x78, 255);
            Color32 roof = new Color32(0x8A, 0x5F, 0x33, 255);
            p.R(3, 14, 26, 18, wall);
            for (int i = 0; i < 6; i++) p.R(12 - i * 2, 8 + i, 8 + i * 4, 1, roof);
            p.R(2, 13, 28, 2, roof);
            p.R(12, 23, 8, 9, new Color32(0x6E, 0x47, 0x26, 255));
            p.R(7, 18, 4, 4, new Color32(0x9A, 0xC8, 0xE0, 255));
        }

        private static void Well(Pix p)
        {
            p.R(2, 16, 12, 8, Stone); p.R(2, 16, 12, 1, StoneDk);
            p.R(4, 18, 8, 5, new Color32(0x2E, 0x4A, 0x6E, 255));
            p.R(3, 8, 2, 8, WoodDark); p.R(11, 8, 2, 8, WoodDark);
            p.R(1, 5, 14, 3, new Color32(0x8C, 0x4A, 0x3A, 255));
            p.R(6, 8, 4, 1, WoodDark);
        }

        private static void Tree(Pix p, bool winter)
        {
            p.R(14, 24, 4, 24, WoodDeep); p.R(14, 24, 1, 24, WoodDark);
            if (winter)
            {
                p.R(10, 30, 12, 1, WoodDeep); p.R(12, 26, 8, 1, WoodDeep);
                p.R(8, 22, 16, 2, Snow); p.R(18, 18, 10, 2, Snow);
                return;
            }
            p.R(6, 6, 20, 16, LeafDk);
            p.R(8, 2, 16, 8, Leaf);
            p.R(4, 12, 12, 8, Leaf);
            p.R(16, 10, 12, 8, Leaf);
            p.R(9, 5, 6, 4, new Color32(0x9A, 0xE0, 0x78, 255));
            p.R(17, 13, 5, 3, new Color32(0x57, 0xA8, 0x45, 255));
        }

        private static void Fence(Pix p)
        {
            p.R(0, 8, 16, 2, Wood); p.R(0, 12, 16, 2, Wood);
            p.R(2, 4, 3, 12, WoodDark); p.R(11, 4, 3, 12, WoodDark);
            p.R(2, 4, 3, 1, Wood); p.R(11, 4, 3, 1, Wood);
        }

        private static void Sign(Pix p)
        {
            p.R(6, 10, 4, 6, WoodDeep);
            p.R(2, 3, 12, 8, Wood); p.R(2, 3, 12, 1, WoodDark); p.R(2, 10, 12, 1, WoodDeep);
            p.R(4, 6, 8, 1, WoodDeep); p.R(4, 8, 5, 1, WoodDeep);
        }

        // ===================================================================== VẼ: THỜI TIẾT
        private static void WeatherIcon(Pix p, int kind)
        {
            switch (kind)
            {
                case 0:  // nắng
                    p.R(5, 5, 6, 6, Gold); p.R(6, 4, 4, 8, Gold); p.R(4, 6, 8, 4, Gold);
                    p.P(7, 7, new Color32(0xFF, 0xF2, 0xB8, 255));
                    break;
                case 1:  // nhiều mây
                    p.R(4, 7, 9, 5, White); p.R(6, 5, 5, 3, White); p.R(4, 11, 9, 1, Stone);
                    break;
                case 2:  // mưa
                    p.R(3, 4, 10, 5, Stone); p.R(5, 2, 5, 3, Stone);
                    p.R(4, 10, 1, 3, WaterHi); p.R(8, 10, 1, 4, WaterHi); p.R(11, 10, 1, 2, WaterHi);
                    break;
                case 3:  // bão
                    p.R(3, 3, 10, 5, StoneDk); p.R(5, 1, 5, 3, StoneDk);
                    p.R(8, 8, 2, 3, Gold); p.R(6, 11, 3, 2, Gold); p.R(7, 12, 2, 3, Gold);
                    break;
                case 4:  // tuyết
                    p.R(4, 4, 9, 5, White); p.R(6, 2, 5, 3, White);
                    p.P(5, 11, Snow); p.P(9, 12, Snow); p.P(12, 10, Snow);
                    break;
                default: // sương mù
                    p.R(2, 4, 12, 2, new Color32(0xC8, 0xD4, 0xE0, 255));
                    p.R(3, 7, 10, 2, new Color32(0xB0, 0xBC, 0xCC, 255));
                    p.R(2, 10, 12, 2, new Color32(0xC8, 0xD4, 0xE0, 255));
                    break;
            }
        }

        private static void Panel(Pix p)
        {
            p.R(0, 0, 16, 16, new Color32(20, 16, 24, 210));
            p.R(0, 0, 16, 1, Cream); p.R(0, 15, 16, 1, Cream);
            p.R(0, 0, 1, 16, Cream); p.R(15, 0, 1, 16, Cream);
        }

        // ===================================================================== VẼ: NHÂN VẬT
        private static void Shadow(Pix p)
        {
            p.R(3, 6, 10, 2, new Color32(0, 0, 0, 70));
            p.R(4, 5, 8, 3, new Color32(0, 0, 0, 70));
        }

        private static void Player(Pix p, int dir, int frame)
        {
            // 16×24, chân ở y = 23 (pivot Bottom Center)
            bool flip = (frame == 1);
            p.R(6, 20, 2, 3 + (flip ? 0 : 1), new Color32(0x3B, 0x4E, 0x82, 255));   // chân trái
            p.R(9, 20, 2, 3 + (flip ? 1 : 0), new Color32(0x3B, 0x4E, 0x82, 255));   // chân phải
            p.R(6, 19, 5, 2, Ink);                                                    // giày
            p.R(5, 14, 7, 6, Cloth);                                                  // thân
            p.R(5, 14, 7, 1, ClothDk);
            p.R(4, 15, 1, 4, ClothDk); p.R(12, 15, 1, 4, ClothDk);
            p.R(6, 10, 5, 5, Skin);                                                   // đầu
            p.R(3, 7, 11, 4, new Color32(0xD8, 0xB0, 0x6A, 255));                     // vành nón
            p.R(5, 4, 7, 4, new Color32(0xC9, 0xA2, 0x5A, 255));                      // chóp nón

            switch (dir)
            {
                case 0:  // xuống
                    p.P(7, 12, Ink); p.P(10, 12, Ink);
                    p.R(7, 14, 3, 1, new Color32(0xD8, 0xA8, 0x7C, 255));
                    break;
                case 1:  // lên
                    p.R(5, 10, 7, 5, new Color32(0xE0, 0xC0, 0x90, 255));             // gáy
                    p.R(4, 12, 1, 3, ClothDk);
                    break;
                case 2:  // trái
                    p.P(6, 12, Ink);
                    p.R(4, 11, 1, 2, Skin);
                    p.R(11, 15, 1, 4, ClothDk);
                    break;
                default: // phải
                    p.P(11, 12, Ink);
                    p.R(13, 11, 1, 2, Skin);
                    p.R(4, 15, 1, 4, ClothDk);
                    break;
            }
        }

        // ===================================================================== CANVAS NHỎ
        /// <summary>Canvas pixel tối giản: toạ độ (0,0) ở TRÊN-TRÁI như lúc vẽ tay.</summary>
        public class Pix
        {
            public readonly int W, H;
            private readonly Color32[] px;

            public Pix(int w, int h)
            {
                W = w; H = h;
                px = new Color32[w * h];
                for (int i = 0; i < px.Length; i++) px[i] = VuonMoSpriteForge.Clear;
            }

            public void P(int x, int y, Color32 c)
            {
                if (x < 0 || y < 0 || x >= W || y >= H) return;
                px[y * W + x] = c;
            }

            public void R(int x, int y, int w, int h, Color32 c)
            {
                for (int yy = y; yy < y + h; yy++)
                    for (int xx = x; xx < x + w; xx++) P(xx, yy, c);
            }

            /// <summary>Đổi sang Texture2D (Unity có gốc toạ độ ở DƯỚI-TRÁI → phải lật dọc).</summary>
            public Texture2D ToTexture()
            {
                Texture2D tex = new Texture2D(W, H, TextureFormat.RGBA32, false);
                Color32[] outPx = new Color32[W * H];
                for (int y = 0; y < H; y++)
                    for (int x = 0; x < W; x++)
                        outPx[y * W + x] = px[(H - 1 - y) * W + x];
                tex.SetPixels32(outPx);
                tex.filterMode = FilterMode.Point;
                tex.Apply();
                return tex;
            }
        }
    }
}
