// ============================================================================
//  VuonMoDataSeeder.cs — TẠO DỮ LIỆU MẪU (ScriptableObject) bằng code
//  Đặt tại: Assets/Editor/
//  Menu: Vườn Mơ ▸ 2 · Tạo Dữ Liệu Mẫu
//
//  Tạo ra:
//   · Tile (cho Tilemap): 4 cỏ theo mùa, đường đất, đất cuốc, đất tưới, cỏ dại, sâu
//   · ItemData: 8 nông sản + 8 túi hạt + gỗ + đá
//   · CropData: 8 cây — số liệu LẤY ĐÚNG theo GDD §4.2 (ngày/giai đoạn, giá, mùa, mùa Đông)
//   · SeasonTheme: 4 mùa (tile cỏ + màu nền + cây cối)
//   · CropDatabase + ItemDatabase (gom hết để tra cứu khi load save)
//
//  Đây là "công thức nấu ăn" của bản đầy đủ — chạy lại nhiều lần vẫn an toàn
//  (asset đã có thì ghi đè, không nhân bản).
// ============================================================================
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;
using UnityEngine.Tilemaps;
using VuonMo.Core;
using VuonMo.Data;
using VuonMo.SaveSystem;

namespace VuonMo.EditorTools
{
    public static class VuonMoDataSeeder
    {
        /// <summary>Kết quả trả về để SceneBuilder dùng lại, khỏi phải load lại từ đĩa.</summary>
        public class Result
        {
            public CropDatabase cropDb;
            public ItemDatabase itemDb;
            public SeasonTheme[] themes = new SeasonTheme[4];
            public Tile[] grassBySeason = new Tile[4];
            public Tile tilled, watered, weed, pest, dirtPath;
            public List<CropData> crops = new List<CropData>();
            public List<ItemData> seeds = new List<ItemData>();
            public Dictionary<string, Sprite> sprites;
        }

        [MenuItem("Vườn Mơ/2 · Tạo Dữ Liệu Mẫu (CropData/ItemData/Theme)", false, 2)]
        public static void MenuSeed()
        {
            Result r = SeedAll(true);
            VuonMoUtil.Report("ĐÃ TẠO DỮ LIỆU MẪU",
                "Cây trồng: " + r.crops.Count + " (mỗi cây 4 sprite giai đoạn + héo + chết)\n" +
                "Vật phẩm: 8 nông sản + 8 túi hạt + gỗ + đá\n" +
                "Mùa: 4 SeasonTheme · Tile: " + (VuonMoPaths.TileDir) + "\n" +
                "Database: " + VuonMoPaths.CropDbPath + " · " + VuonMoPaths.ItemDbPath);
        }

        // ===================================================================== DỮ LIỆU CÂY
        private class CropDef
        {
            public string id, name, shape;
            public Season season;
            public int[] days;              // [GĐ1, GĐ2, GĐ3, ngày mọc lại]
            public int seedPrice, sell, xp, minYield, maxYield;
            public bool regrows, winterHardy;
        }

        // Số liệu theo GDD §4.2 — sửa ở ĐÂY là sửa cả game (không rải rác trong scene)
        private static readonly CropDef[] Defs = new CropDef[]
        {
            new CropDef { id="turnip",   name="Củ cải",    shape="bush",    season=Season.Spring, days=new int[]{1,1,1,0}, seedPrice=20,  sell=35,  xp=6,  minYield=1, maxYield=2, regrows=false, winterHardy=false },
            new CropDef { id="potato",   name="Khoai tây",  shape="bush",    season=Season.Spring, days=new int[]{1,2,2,0}, seedPrice=50,  sell=60,  xp=8,  minYield=1, maxYield=3, regrows=false, winterHardy=false },
            new CropDef { id="tomato",   name="Cà chua",    shape="trellis", season=Season.Summer, days=new int[]{1,2,3,2}, seedPrice=45,  sell=55,  xp=8,  minYield=1, maxYield=3, regrows=true,  winterHardy=false },
            new CropDef { id="corn",     name="Ngô",        shape="stalk",   season=Season.Summer, days=new int[]{2,3,4,3}, seedPrice=70,  sell=80,  xp=12, minYield=1, maxYield=2, regrows=true,  winterHardy=false },
            new CropDef { id="pumpkin",  name="Bí ngô",     shape="vine",    season=Season.Fall,   days=new int[]{2,4,4,0}, seedPrice=130, sell=200, xp=16, minYield=1, maxYield=1, regrows=false, winterHardy=false },
            new CropDef { id="grape",    name="Nho",        shape="trellis", season=Season.Fall,   days=new int[]{2,3,5,4}, seedPrice=100, sell=110, xp=14, minYield=1, maxYield=3, regrows=true,  winterHardy=false },
            new CropDef { id="snowdrop", name="Bông tuyết", shape="flower",  season=Season.Winter, days=new int[]{3,4,3,5}, seedPrice=180, sell=150, xp=18, minYield=1, maxYield=2, regrows=true,  winterHardy=true  },
            new CropDef { id="rice",     name="Lúa nước",   shape="stalk",   season=Season.Summer, days=new int[]{2,3,5,0}, seedPrice=60,  sell=95,  xp=14, minYield=1, maxYield=2, regrows=false, winterHardy=false },
        };

        // ===================================================================== TẠO TOÀN BỘ
        public static Result SeedAll(bool verbose)
        {
            var r = new Result();
            VuonMoUtil.EnsureFolder(VuonMoPaths.TileDir);
            VuonMoUtil.EnsureFolder(VuonMoPaths.CropDir);
            VuonMoUtil.EnsureFolder(VuonMoPaths.ItemDir);
            VuonMoUtil.EnsureFolder(VuonMoPaths.ThemeDir);
            VuonMoUtil.EnsureFolder(VuonMoPaths.DbDir);

            // --- 1) Sprite: thiếu thì sinh (không sinh lại nếu đã có → giữ art thật của bạn)
            r.sprites = new Dictionary<string, Sprite>();
            string[] neededKeys = NeededSpriteKeys();
            bool missing = false;
            foreach (string k in neededKeys)
            {
                Sprite s = VuonMoSpriteForge.Get(k);
                if (s == null) { missing = true; break; }
                r.sprites[k] = s;
            }
            if (missing)
            {
                if (verbose) Debug.Log("[Vườn Mơ] Thiếu sprite → sinh sprite tạm trước...");
                r.sprites = VuonMoSpriteForge.GenerateAll(false);
            }

            // --- 2) Tile cho Tilemap
            r.grassBySeason[0] = MakeTile("Tile_grass_spring", "tile_grass_spring");
            r.grassBySeason[1] = MakeTile("Tile_grass_summer", "tile_grass_summer");
            r.grassBySeason[2] = MakeTile("Tile_grass_fall",   "tile_grass_fall");
            r.grassBySeason[3] = MakeTile("Tile_grass_winter", "tile_grass_winter");
            r.dirtPath = MakeTile("Tile_dirt_path", "tile_dirt_path");
            r.tilled   = MakeTile("Tile_soil",      "tile_soil");
            r.watered  = MakeTile("Tile_soil_wet",  "tile_soil_wet");
            r.weed     = MakeTile("Tile_weed",      "tile_weed");
            r.pest     = MakeTile("Tile_pest",      "tile_pest");

            // --- 3) ItemData: nông sản + túi hạt + nguyên liệu
            foreach (CropDef d in Defs)
            {
                ItemData produce = MakeItem(d.id, d.name, ItemCategory.Produce, d.sell, "item_" + d.id, null);
                ItemData seed = MakeItem("seed_" + d.id, "Hạt " + d.name, ItemCategory.Seed,
                                         Mathf.Max(1, d.seedPrice / 2), "item_seed_" + d.id, null);
                seed.seedOfCrop = null;   // gán sau khi có CropData
            }
            MakeItem("wood",  "Gỗ",  ItemCategory.Material, 12, "item_wood",  null);
            MakeItem("stone", "Đá",  ItemCategory.Material, 8,  "item_stone", null);

            // --- 4) CropData: 8 cây, nối đủ 4 sprite giai đoạn + héo + chết + nông sản + hạt
            r.crops.Clear();
            r.seeds.Clear();
            foreach (CropDef d in Defs)
            {
                string path = VuonMoPaths.CropDir + "/Crop_" + Capitalize(d.id) + ".asset";
                CropData crop = VuonMoUtil.CreateOrReplace<CropData>(path);

                crop.cropId = d.id;
                crop.displayName = d.name;
                crop.stageSprites = new Sprite[4];
                crop.stageSprites[0] = LoadSprite("crop_" + d.id + "_seed");
                crop.stageSprites[1] = LoadSprite("crop_" + d.id + "_sprout");
                crop.stageSprites[2] = LoadSprite("crop_" + d.id + "_mature");
                crop.stageSprites[3] = LoadSprite("crop_" + d.id + "_ripe");
                crop.witheringSprite = LoadSprite("crop_" + d.id + "_wither");
                crop.deadSprite = LoadSprite("crop_" + d.id + "_dead");
                crop.icon = crop.stageSprites[3];
                crop.harvestSprite = LoadSprite("item_" + d.id);
                crop.harvestSpriteSilver = crop.harvestSprite;
                crop.harvestSpriteGold = crop.harvestSprite;

                crop.daysPerStage = new int[4];
                for (int i = 0; i < 4; i++) crop.daysPerStage[i] = (i < d.days.Length) ? d.days[i] : 0;
                crop.needsWater = true;
                crop.requiredMoisture = 0.3f;
                crop.dryDaysBeforeWither = 2;
                crop.witherDaysBeforeDeath = 3;
                crop.allowedSeasons = new Season[] { d.season };
                crop.survivesWinterOutdoor = d.winterHardy;
                crop.minYield = d.minYield;
                crop.maxYield = d.maxYield;
                crop.regrows = d.regrows;
                crop.seedPrice = d.seedPrice;
                crop.baseSellPrice = d.sell;
                crop.farmingXp = d.xp;
                crop.blinkWhenRipe = true;
                crop.harvestItem = VuonMoUtil.LoadOrNull<ItemData>(VuonMoPaths.ItemDir + "/Item_" + d.id + ".asset");
                if (crop.harvestItem == null) Debug.LogWarning("[Vườn Mơ] Thiếu ItemData nông sản cho cây " + d.id + " → loot sẽ không rơi!");
                crop.seedItem = VuonMoUtil.LoadOrNull<ItemData>(VuonMoPaths.ItemDir + "/Item_seed_" + d.id + ".asset");

                EditorUtility.SetDirty(crop);
                r.crops.Add(crop);
                if (crop.seedItem != null) r.seeds.Add(crop.seedItem);
            }

            // nối ngược: túi hạt biết nó là hạt của cây nào
            foreach (CropData c in r.crops)
            {
                if (c.seedItem == null) continue;
                c.seedItem.seedOfCrop = c;
                EditorUtility.SetDirty(c.seedItem);
            }

            // --- 5) SeasonTheme × 4
            var treeSp   = new Sprite[] { LoadSprite("prop_tree") };
            var treeHerm = new Sprite[] { LoadSprite("prop_tree_winter") };
            var props    = new Sprite[] { LoadSprite("prop_fence"), LoadSprite("prop_well"), LoadSprite("prop_sign") };

            SetTheme(Season.Spring, r.grassBySeason[0], new Color(0.55f, 0.78f, 0.45f), treeSp,   props, r);
            SetTheme(Season.Summer, r.grassBySeason[1], new Color(0.42f, 0.68f, 0.34f), treeSp,   props, r);
            SetTheme(Season.Fall,   r.grassBySeason[2], new Color(0.72f, 0.58f, 0.30f), treeSp,   props, r);
            SetTheme(Season.Winter, r.grassBySeason[3], new Color(0.82f, 0.88f, 0.94f), treeHerm, props, r);

            // --- 6) Database
            CropDatabase cropDb = VuonMoUtil.CreateOrReplace<CropDatabase>(VuonMoPaths.CropDbPath);
            cropDb.crops = new List<CropData>(r.crops);
            EditorUtility.SetDirty(cropDb);
            r.cropDb = cropDb;

            ItemDatabase itemDb = VuonMoUtil.CreateOrReplace<ItemDatabase>(VuonMoPaths.ItemDbPath);
            itemDb.items = new List<ItemData>();
            foreach (string guid in AssetDatabase.FindAssets("t:ItemData", new string[] { VuonMoPaths.ItemDir }))
            {
                ItemData it = AssetDatabase.LoadAssetAtPath<ItemData>(AssetDatabase.GUIDToAssetPath(guid));
                if (it != null) itemDb.items.Add(it);
            }
            EditorUtility.SetDirty(itemDb);
            r.itemDb = itemDb;

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            return r;
        }

        // ===================================================================== HÀM PHỤ
        private static void SetTheme(Season season, Tile grass, Color bg, Sprite[] trees, Sprite[] props, Result r)
        {
            string path = VuonMoPaths.ThemeDir + "/Theme_" + season + ".asset";
            SeasonTheme t = VuonMoUtil.CreateOrReplace<SeasonTheme>(path);
            t.season = season;
            t.grassTile = grass;
            t.grassVariantTile = grass;
            t.dirtPathTile = r.dirtPath;
            t.cliffTile = null;
            t.tilledTile = r.tilled;
            t.wateredTile = r.watered;
            t.scatterDecorTiles = new TileBase[] { r.weed };
            t.treeSprites = trees;
            t.bushSprites = null;
            t.propSprites = props;
            t.globalLightColor = Color.white;
            t.backgroundColor = bg;
            t.referencePalette = new Color[]
            {
                bg, new Color(0.55f, 0.82f, 0.42f), new Color(0.42f, 0.62f, 0.31f),
                new Color(0.54f, 0.37f, 0.20f), new Color(0.31f, 0.36f, 0.54f),
                new Color(1f, 0.83f, 0.31f), new Color(1f, 0.91f, 0.72f), Color.white,
            };
            EditorUtility.SetDirty(t);
            r.themes[(int)season] = t;
        }

        private static Tile MakeTile(string fileName, string spriteKey)
        {
            string path = VuonMoPaths.TileDir + "/" + fileName + ".asset";
            Tile tile = AssetDatabase.LoadAssetAtPath<Tile>(path);
            if (tile == null)
            {
                tile = ScriptableObject.CreateInstance<Tile>();
                AssetDatabase.CreateAsset(tile, path);
            }
            tile.sprite = LoadSprite(spriteKey);
            tile.colliderType = Tile.ColliderType.None;   // ô đất không có collider (đúng thiết kế)
            EditorUtility.SetDirty(tile);
            return tile;
        }

        private static ItemData MakeItem(string id, string name, ItemCategory cat, int price, string spriteKey, CropData seedOf)
        {
            string path = VuonMoPaths.ItemDir + "/Item_" + id + ".asset";
            ItemData it = VuonMoUtil.CreateOrReplace<ItemData>(path);
            it.itemId = id;
            it.displayName = name;
            it.category = cat;
            it.baseSellPrice = price;
            it.maxStack = 99;
            it.bobInWorld = true;
            it.autoPickup = false;
            it.icon = LoadSprite(spriteKey);
            it.worldSprite = it.icon;
            it.seedOfCrop = seedOf;
            EditorUtility.SetDirty(it);
            return it;
        }

        private static Sprite LoadSprite(string key)
        {
            Sprite s = VuonMoSpriteForge.Get(key);
            if (s == null) Debug.LogWarning("[Vườn Mơ] Thiếu sprite tạm: " + key);
            return s;
        }

        private static string Capitalize(string s)
        {
            if (string.IsNullOrEmpty(s)) return s;
            return char.ToUpper(s[0]) + s.Substring(1);
        }

        private static string[] NeededSpriteKeys()
        {
            var list = new List<string>
            {
                "tile_grass_spring", "tile_grass_summer", "tile_grass_fall", "tile_grass_winter",
                "tile_dirt_path", "tile_soil", "tile_soil_wet", "tile_weed", "tile_pest",
                "item_wood", "item_stone", "prop_tree", "prop_tree_winter", "prop_fence", "prop_well", "prop_sign",
            };
            foreach (CropDef d in Defs)
            {
                list.Add("crop_" + d.id + "_seed");
                list.Add("crop_" + d.id + "_sprout");
                list.Add("crop_" + d.id + "_mature");
                list.Add("crop_" + d.id + "_ripe");
                list.Add("crop_" + d.id + "_wither");
                list.Add("crop_" + d.id + "_dead");
                list.Add("item_" + d.id);
                list.Add("item_seed_" + d.id);
            }
            return list.ToArray();
        }
    }
}
