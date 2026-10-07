// ============================================================================
//  VuonMoSceneBuilder.cs — DỰNG SCENE MẪU HOÀN CHỈNH BẰNG 1 CÚ BẤM
//  Đặt tại: Assets/Editor/
//  Menu: Vườn Mơ ▸ 3 · DỰNG SCENE MẪU (chạy tất cả)
//
//  Tool này làm hết những việc "kéo thả 60–90 phút" trong docs/05:
//   0. Thêm Tag/Layer cần thiết (Player, NPC, Interactable, Collision, FarmTile, Water, Loot)
//   1. Sinh sprite tạm + tạo dữ liệu (gọi VuonMoDataSeeder)
//   2. GameManagers + ĐIỀN WeatherSystem.profiles (để trống sẽ crash ở profiles[0]!)
//   3. Grid + 5 Tilemap (Ground/Soil/Decor/Building/Collision) + tô cỏ toàn map
//   4. FarmGrid + prefab Crop_Base + prefab Loot_Base + StarterPlot2D
//   5. Player (Rigidbody2D, CapsuleCollider2D, controller, interactor, YSort2D)
//   6. Camera (Orthographic 5.625 + Pixel Perfect Camera nếu đã cài package) + CameraFollow2D
//   7. Giường ngủ (Bed2D), giếng nước (WaterSource2D), NPC bà Hòa
//   8. WeatherFX + DayNightOverlay + HUD (Canvas 320×180)
//   9. Lưu scene → Assets/VuonMo/Scenes/VuonMo_Sample.unity
//
//  Chạy lại nhiều lần vẫn an toàn (tạo scene mới + ghi đè asset cũ).
//  ⚠️ Tool sẽ ĐÓNG scene đang mở mà không hỏi lại (giống New Scene) — có hộp thoại xác nhận trước.
// ============================================================================
using System.Collections.Generic;
using System.Reflection;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Tilemaps;
using UnityEngine.UI;
using VuonMo.Core;
using VuonMo.Data;
using VuonMo.Farming;
using VuonMo.NPCSystem;
using VuonMo.Player;
using VuonMo.SaveSystem;
using VuonMo.UI;
using VuonMo.WeatherVisual;

namespace VuonMo.EditorTools
{
    public static class VuonMoSceneBuilder
    {
        private const int GroundOrder   = -30000;
        private const int SoilOrder     = -29000;
        private const int DecorOrder    = -28500;
        private const int BuildingOrder = -28000;
        private const int CollisionOrder = -27000;
        private const int OverlayOrder  =  20000;

        private static readonly Vector2Int MapSize = new Vector2Int(80, 80);

        // ===================================================================== MENU
        [MenuItem("Vườn Mơ/3 · DỰNG SCENE MẪU (chạy tất cả)", false, 3)]
        public static void BuildAll()
        {
            if (!EditorUtility.DisplayDialog("Vườn Mơ — Dựng scene mẫu",
                "Tool sẽ:\n" +
                "· sinh sprite tạm + tạo dữ liệu (8 cây, item, 4 mùa)\n" +
                "· ĐÓNG scene đang mở và tạo scene mới\n" +
                "· lưu vào " + VuonMoPaths.ScenePath + "\n\nTiếp tục?",
                "Dựng luôn", "Huỷ"))
                return;

            EnsureProjectSetup();
            VuonMoDataSeeder.Result data = VuonMoDataSeeder.SeedAll(false);

            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            Camera cam = CreateCamera(data.themes[0]);
            GameObject cropContainer = CreateContainer("CropContainer");
            GameObject lootContainer = CreateContainer("LootContainer");
            GameObject player = CreatePlayer();
            FarmGrid grid = CreateWorld(data, player, cam, cropContainer);
            CreateBed();
            CreateWaterSource();
            NPCRelationship2D npc = CreateNpc();
            WeatherFX2D weatherFx = CreateWeatherFx(data.themes);
            DayNightTint2D tint = CreateDayNightOverlay(cam, data.themes);
            if (weatherFx != null) weatherFx.dayNightTint = tint;

            GameObject hudGo = CreateHud();
            CreateManagers(data, grid, npc, cam, lootContainer, hudGo);

            // ---------------------------------------------------------------- LƯU SCENE
            VuonMoUtil.EnsureFolder(VuonMoPaths.SceneDir);
            bool saved = EditorSceneManager.SaveScene(scene, VuonMoPaths.ScenePath);
            AssetDatabase.SaveAssets();

            Selection.activeGameObject = GameObject.Find("GameManagers");
            VuonMoUtil.Report("DỰNG SCENE XONG" + (saved ? "" : " (⚠ LƯU THẤT BẠI)"),
                "Scene: " + VuonMoPaths.ScenePath + "\n\n" +
                "BẤM PLAY ĐỂ CHƠI. Kiểm tra nhanh:\n" +
                "· 1 (Cuốc) + E → cuốc đất   ·   8 (Hạt) + E → gieo   ·   2 (Bình tưới) + E → tưới\n" +
                "· Muốn cây lớn ngay: GameManagers ▸ TimeManager ▸ minutesPerSecond = 60\n" +
                "· Ngủ ở giường (E) để sang ngày + tự lưu   ·   Múc nước ở giếng (E)\n" +
                "· Bà Hòa: E để nói chuyện / tặng quà, tăng tim\n\n" +
                "CÒN THIẾU (làm thêm khi cần):\n" +
                "· Va chạm tường/nước: vẽ tile lên Tilemap_Collision (renderer đã tắt sẵn)\n" +
                "· Hạt mưa/tuyết: gán ParticleSystem vào WeatherFX2D (không có cũng không lỗi)\n" +
                "· Vật nuôi, chế biến, câu cá: chưa có code (mới có đặc tả trong GDD §5–6)");
        }

        // ===================================================================== 0) PROJECT
        [MenuItem("Vườn Mơ/Kiểm tra cấu hình project", false, 20)]
        public static void CheckProject()
        {
            System.Text.StringBuilder sb = new System.Text.StringBuilder();
            sb.AppendLine("Gravity 2D: " + Physics2D.gravity +
                          (Physics2D.gravity.sqrMagnitude < 0.001f ? "  ✔" : "  ✖ → Edit ▸ Project Settings ▸ Physics 2D ▸ Gravity = (0, 0)"));
            sb.AppendLine("Tag 'Player': " + (HasTag("Player") ? "có ✔" : "THIẾU ✖ (tool dựng scene sẽ tự thêm)"));
            string[] layers = { "Player", "NPC", "Interactable", "Collision", "FarmTile", "Water", "Loot" };
            foreach (string l in layers)
                sb.AppendLine("Layer '" + l + "': " + (HasLayer(l) ? "có ✔" : "THIẾU ✖ (tool dựng scene sẽ tự thêm)"));
            sb.AppendLine("Package 2D Pixel Perfect: " + (PixelPerfectType() != null ? "có ✔" : "chưa cài ✖ → Window ▸ Package Manager"));
            sb.AppendLine("Sprite tạm: " + (VuonMoSpriteForge.Get("tile_soil") != null ? "đã sinh ✔" : "chưa sinh (chạy menu 1)"));
            sb.AppendLine("Dữ liệu: " + (VuonMoUtil.LoadOrNull<CropDatabase>(VuonMoPaths.CropDbPath) != null ? "đã tạo ✔" : "chưa tạo (chạy menu 2)"));
            sb.AppendLine("Scene mẫu: " + (VuonMoUtil.LoadOrNull<SceneAsset>(VuonMoPaths.ScenePath) != null ? "đã có ✔" : "chưa dựng (chạy menu 3)"));
            VuonMoUtil.Report("KIỂM TRA CẤU HÌNH", sb.ToString());
        }

        private static void EnsureProjectSetup()
        {
            VuonMoUtil.EnsureTag("Player");
            VuonMoUtil.EnsureLayer("Player");
            VuonMoUtil.EnsureLayer("NPC");
            VuonMoUtil.EnsureLayer("Interactable");
            VuonMoUtil.EnsureLayer("Collision");
            VuonMoUtil.EnsureLayer("FarmTile");
            VuonMoUtil.EnsureLayer("Water");
            VuonMoUtil.EnsureLayer("Loot");
        }

        private static bool HasTag(string tag)
        {
            try { return GameObject.FindGameObjectWithTag(tag) != null || IsTagDeclared(tag); }
            catch { return IsTagDeclared(tag); }
        }

        private static bool IsTagDeclared(string tag)
        {
            try
            {
                Object[] assets = AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/TagManager.asset");
                if (assets == null || assets.Length == 0) return false;
                SerializedObject so = new SerializedObject(assets[0]);
                SerializedProperty tags = so.FindProperty("tags");
                for (int i = 0; i < tags.arraySize; i++)
                    if (tags.GetArrayElementAtIndex(i).stringValue == tag) return true;
            }
            catch { }
            return false;
        }

        private static bool HasLayer(string layer) { return LayerMask.NameToLayer(layer) >= 0; }

        // ===================================================================== CAMERA
        private static Camera CreateCamera(SeasonTheme theme)
        {
            GameObject go = new GameObject("Main Camera");
            go.tag = "MainCamera";
            Camera cam = go.AddComponent<Camera>();
            cam.orthographic = true;
            cam.orthographicSize = 5.625f;                  // 180 px ÷ 16 PPU ÷ 2
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = theme != null ? theme.backgroundColor : new Color(0.30f, 0.35f, 0.42f);
            cam.transform.position = new Vector3(8.5f, 10.5f, -10f);
            go.AddComponent<AudioListener>();

            AddPixelPerfectCamera(go);

            CameraFollow2D follow = go.AddComponent<CameraFollow2D>();
            follow.offset = new Vector2(0f, 0.5f);
            follow.smoothSpeed = 12f;
            return cam;
        }

        /// <summary>Thêm Pixel Perfect Camera qua reflection → không phụ thuộc package lúc compile.</summary>
        private static void AddPixelPerfectCamera(GameObject go)
        {
            System.Type t = PixelPerfectType();
            if (t == null)
            {
                Debug.LogWarning("[Vườn Mơ] Chưa cài package '2D Pixel Perfect'.\n" +
                                 "  → Window ▸ Package Manager ▸ Unity Registry ▸ 2D Pixel Perfect ▸ Install,\n" +
                                 "    rồi gắn component Pixel Perfect Camera vào Main Camera\n" +
                                 "    (Assets PPU 16 · Reference Resolution 320×180 · Upscale Render Texture ✔).");
                return;
            }
            Component comp = go.GetComponent(t);
            if (comp == null) comp = go.AddComponent(t);
            SetField(comp, "assetsPPU", 16);
            SetField(comp, "refResolutionX", 320);
            SetField(comp, "refResolutionY", 180);
            SetField(comp, "upscaleRT", true);
            SetField(comp, "pixelSnapping", true);
            SetField(comp, "stretchFill", true);
        }

        private static System.Type PixelPerfectType()
        {
            System.Type t = System.Type.GetType("UnityEngine.U2D.PixelPerfectCamera, Unity.2D.PixelPerfect");
            if (t != null) return t;
            Assembly[] asms = System.AppDomain.CurrentDomain.GetAssemblies();
            foreach (Assembly asm in asms)
            {
                t = asm.GetType("UnityEngine.U2D.PixelPerfectCamera");
                if (t != null) return t;
            }
            return null;
        }

        private static void SetField(object target, string name, object value)
        {
            if (target == null) return;
            try
            {
                FieldInfo f = target.GetType().GetField(name, BindingFlags.Public | BindingFlags.Instance);
                if (f != null) f.SetValue(target, value);
            }
            catch { /* tên field khác ở phiên bản package này → bỏ qua */ }
        }

        private static void SetProperty(object target, string name, object value)
        {
            if (target == null) return;
            try
            {
                PropertyInfo p = target.GetType().GetProperty(name, BindingFlags.Public | BindingFlags.Instance);
                if (p != null && p.CanWrite) p.SetValue(target, value);
            }
            catch { }
        }

        // ===================================================================== PLAYER
        private static GameObject CreatePlayer()
        {
            GameObject go = new GameObject("Player");
            go.tag = "Player";
            if (HasLayer("Player")) go.layer = LayerMask.NameToLayer("Player");
            go.transform.position = new Vector3(8.5f, 7.5f, 0f);

            GameObject visual = new GameObject("Visual");
            visual.transform.SetParent(go.transform, false);
            SpriteRenderer sr = visual.AddComponent<SpriteRenderer>();
            sr.sprite = VuonMoSpriteForge.Get("player_down_0");

            GameObject shadow = new GameObject("Shadow");
            shadow.transform.SetParent(go.transform, false);
            shadow.transform.localPosition = new Vector3(0f, 0.02f, 0f);
            SpriteRenderer ssr = shadow.AddComponent<SpriteRenderer>();
            ssr.sprite = VuonMoSpriteForge.Get("player_shadow");
            ssr.color = new Color(1f, 1f, 1f, 0.6f);

            Rigidbody2D rb = go.AddComponent<Rigidbody2D>();
            rb.gravityScale = 0f;
            rb.freezeRotation = true;
            rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
            rb.interpolation = RigidbodyInterpolation2D.Interpolate;

            CapsuleCollider2D col = go.AddComponent<CapsuleCollider2D>();
            col.size = new Vector2(0.6f, 0.35f);
            col.offset = new Vector2(0f, -0.25f);

            PlayerController2D ctrl = go.AddComponent<PlayerController2D>();
            ctrl.spriteRenderer = sr;
            ctrl.shadow = shadow.transform;

            PlayerInteractor2D inter = go.AddComponent<PlayerInteractor2D>();
            inter.reachCells = 1;
            inter.maxWaterCharges = 20;
            if (HasLayer("Interactable")) inter.interactableMask = LayerMask.GetMask("Interactable");
            else Debug.LogWarning("[Vườn Mơ] Thiếu layer 'Interactable' → E sẽ không nói chuyện được NPC/giường/giếng.");

            YSort2D sort = go.AddComponent<YSort2D>();
            sort.dynamic = true;
            return go;
        }

        // ===================================================================== BẢN ĐỒ
        private static FarmGrid CreateWorld(VuonMoDataSeeder.Result data, GameObject player, Camera cam, GameObject cropContainer)
        {
            GameObject gridRoot = new GameObject("Grid");
            Grid gridComp = gridRoot.AddComponent<Grid>();
            gridComp.cellSize = new Vector3(1f, 1f, 0f);

            Tilemap ground    = NewTilemap(gridRoot.transform, "Tilemap_Ground",    GroundOrder);
            Tilemap soil      = NewTilemap(gridRoot.transform, "Tilemap_Soil",      SoilOrder);
            NewTilemap(gridRoot.transform, "Tilemap_Decor",     DecorOrder);
            NewTilemap(gridRoot.transform, "Tilemap_Building",  BuildingOrder);
            Tilemap collision = NewTilemap(gridRoot.transform, "Tilemap_Collision", CollisionOrder);
            collision.GetComponent<TilemapRenderer>().enabled = false;

            // va chạm: Rigidbody2D static + TilemapCollider2D + CompositeCollider2D
            Rigidbody2D crb = collision.gameObject.AddComponent<Rigidbody2D>();
            crb.bodyType = RigidbodyType2D.Static;
            TilemapCollider2D tcol = collision.gameObject.AddComponent<TilemapCollider2D>();
            CompositeCollider2D comp = collision.gameObject.AddComponent<CompositeCollider2D>();
            comp.geometryType = CompositeCollider2D.GeometryType.Polygons;
            if (!SetCompositeMerge(tcol))
                Debug.LogWarning("[Vườn Mơ] Không tự bật được 'Used By Composite' cho TilemapCollider2D.\n" +
                                 "  → Tự tick: chọn Tilemap_Collision ▸ Tilemap Collider 2D ▸ Used By Composite ✔");
            tcol.enabled = false;   // map mới chưa có tile va chạm nào

            // ---- tô cỏ toàn bản đồ
            TileBase[] fill = new TileBase[MapSize.x * MapSize.y];
            for (int i = 0; i < fill.Length; i++) fill[i] = data.grassBySeason[0];
            ground.SetTilesBlock(new BoundsInt(0, 0, 0, MapSize.x, MapSize.y, 1), fill);

            // ---- FarmGrid
            GameObject fgGo = new GameObject("FarmGrid");
            fgGo.transform.SetParent(gridRoot.transform, false);
            FarmGrid fg = fgGo.AddComponent<FarmGrid>();
            fg.width = MapSize.x;
            fg.height = MapSize.y;
            fg.groundTilemap = ground;
            fg.soilTilemap = soil;
            fg.decorTilemap = gridRoot.transform.Find("Tilemap_Decor").GetComponent<Tilemap>();
            fg.grassTile = data.grassBySeason[0];
            fg.tilledTile = data.tilled;
            fg.wateredTile = data.watered;
            fg.weedTile = data.weed;
            fg.pestTile = data.pest;
            fg.cropParent = cropContainer.transform;
            fg.SetThemes(data.themes);
            fg.cropPrefab = BuildCropPrefab();

            // ---- luống đất dọn sẵn cho người chơi mới
            StarterPlot2D starter = fgGo.AddComponent<StarterPlot2D>();
            starter.from = new Vector2Int(6, 8);
            starter.size = new Vector2Int(6, 4);

            // ---- camera bám người chơi
            CameraFollow2D follow = cam.GetComponent<CameraFollow2D>();
            if (follow != null && player != null)
            {
                follow.target = player.transform;
                follow.SnapToTarget();
            }
            return fg;
        }

        /// <summary>Bật "Used By Composite" — tên API đổi theo phiên bản Unity nên thử cả hai.</summary>
        private static bool SetCompositeMerge(Collider2D col)
        {
            if (col == null) return false;
            try
            {
                PropertyInfo p = col.GetType().GetProperty("usedByComposite", BindingFlags.Public | BindingFlags.Instance);
                if (p != null && p.CanWrite) { p.SetValue(col, true); return true; }

                PropertyInfo p2 = col.GetType().GetProperty("compositeOperation", BindingFlags.Public | BindingFlags.Instance);
                if (p2 != null && p2.CanWrite)
                {
                    // CompositeOperation.Merge = 1 (enum CompositeCollider2D.CompositeOperation)
                    p2.SetValue(col, System.Enum.ToObject(p2.PropertyType, 1));
                    return true;
                }
            }
            catch { }
            return false;
        }

        private static Tilemap NewTilemap(Transform parent, string name, int order)
        {
            GameObject go = new GameObject(name);
            go.transform.SetParent(parent, false);
            Tilemap tm = go.AddComponent<Tilemap>();
            TilemapRenderer tr = go.AddComponent<TilemapRenderer>();
            tr.sortingOrder = order;
            return tm;
        }

        private static GameObject CreateContainer(string name)
        {
            GameObject go = new GameObject(name);
            go.transform.position = Vector3.zero;
            return go;
        }

        private static GameObject BuildCropPrefab()
        {
            GameObject root = new GameObject("Crop_Base");
            CropInstance inst = root.AddComponent<CropInstance>();

            GameObject visual = new GameObject("Visual");
            visual.transform.SetParent(root.transform, false);
            visual.transform.localPosition = new Vector3(0f, -0.5f, 0f);   // sprite pivot = Bottom Center
            SpriteRenderer sr = visual.AddComponent<SpriteRenderer>();
            inst.visual = sr;

            YSort2D sort = root.AddComponent<YSort2D>();
            sort.dynamic = true;

            VuonMoUtil.EnsureFolder(VuonMoPaths.PrefabDir);
            GameObject prefab = PrefabUtility.SaveAsPrefabAsset(root, VuonMoPaths.CropPrefabPath);
            Object.DestroyImmediate(root);
            return prefab;
        }

        private static GameObject BuildLootPrefab()
        {
            GameObject root = new GameObject("Loot_Base");
            GameObject sprite = new GameObject("Sprite");
            sprite.transform.SetParent(root.transform, false);
            SpriteRenderer sr = sprite.AddComponent<SpriteRenderer>();

            ItemPickup pick = root.AddComponent<ItemPickup>();
            pick.spriteRenderer = sr;
            pick.magnetToPlayer = true;
            pick.magnetRadius = 1.2f;
            pick.magnetSpeed = 7f;

            VuonMoUtil.EnsureFolder(VuonMoPaths.PrefabDir);
            GameObject prefab = PrefabUtility.SaveAsPrefabAsset(root, VuonMoPaths.LootPrefabPath);
            Object.DestroyImmediate(root);
            return prefab;
        }

        // ===================================================================== GIƯỜNG / NƯỚC / NPC
        private static void CreateBed()
        {
            GameObject go = new GameObject("Bed");
            go.transform.position = new Vector3(4.5f, 12.6f, 0f);
            go.transform.localScale = new Vector3(1.5f, 1f, 1f);
            SpriteRenderer sr = go.AddComponent<SpriteRenderer>();
            sr.sprite = VuonMoSpriteForge.Get("ui_panel");
            sr.color = new Color(0.85f, 0.88f, 0.95f);

            BoxCollider2D col = go.AddComponent<BoxCollider2D>();
            col.size = new Vector2(1.1f, 0.8f);
            col.isTrigger = true;

            Bed2D bed = go.AddComponent<Bed2D>();
            bed.autoSave = true;
            bed.saveSlot = 0;

            AddYsort(go);
            SetInteractableLayer(go);
        }

        private static void CreateWaterSource()
        {
            GameObject go = new GameObject("Well_Water");
            go.transform.position = new Vector3(13.5f, 9.5f, 0f);
            SpriteRenderer sr = go.AddComponent<SpriteRenderer>();
            sr.sprite = VuonMoSpriteForge.Get("prop_well");

            CircleCollider2D col = go.AddComponent<CircleCollider2D>();
            col.radius = 0.6f;
            col.isTrigger = true;

            go.AddComponent<WaterSource2D>();
            AddYsort(go);
            SetInteractableLayer(go);
        }

        private static NPCRelationship2D CreateNpc()
        {
            GameObject go = new GameObject("NPC_Hoa");
            go.transform.position = new Vector3(11.5f, 12.5f, 0f);

            GameObject visual = new GameObject("Visual");
            visual.transform.SetParent(go.transform, false);
            SpriteRenderer sr = visual.AddComponent<SpriteRenderer>();
            sr.sprite = VuonMoSpriteForge.Get("player_down_0");
            sr.color = new Color(0.95f, 0.85f, 0.75f);

            CapsuleCollider2D col = go.AddComponent<CapsuleCollider2D>();
            col.size = new Vector2(0.7f, 0.5f);
            col.offset = new Vector2(0f, 0.25f);
            col.isTrigger = true;

            NPCRelationship2D npc = go.AddComponent<NPCRelationship2D>();
            npc.npcId = "hoa";
            npc.displayName = "Bà Hòa";
            npc.wanders = true;
            npc.wanderRadius = 3f;

            ItemData pumpkin = VuonMoUtil.LoadOrNull<ItemData>(VuonMoPaths.ItemDir + "/Item_pumpkin.asset");
            if (pumpkin != null) npc.lovedGifts.Add(pumpkin);
            ItemData turnip = VuonMoUtil.LoadOrNull<ItemData>(VuonMoPaths.ItemDir + "/Item_turnip.asset");
            if (turnip != null) npc.likedGifts.Add(turnip);

            AddYsort(go);
            SetInteractableLayer(go);
            return npc;
        }

        private static void AddYsort(GameObject go)
        {
            YSort2D s = go.GetComponent<YSort2D>();
            if (s == null) s = go.AddComponent<YSort2D>();
            s.dynamic = true;
        }

        private static void SetInteractableLayer(GameObject go)
        {
            if (HasLayer("Interactable")) go.layer = LayerMask.NameToLayer("Interactable");
        }

        // ===================================================================== THỜI TIẾT / ÁNH SÁNG
        private static WeatherFX2D CreateWeatherFx(SeasonTheme[] themes)
        {
            GameObject go = new GameObject("WeatherFX");
            WeatherFX2D fx = go.AddComponent<WeatherFX2D>();
            fx.lightningEnabled = true;
            fx.cameraShake = true;
            fx.themes = themes;                     // 4 mùa: lá rơi / hoa anh đào / màu nền trời
            return fx;
        }

        private static DayNightTint2D CreateDayNightOverlay(Camera cam, SeasonTheme[] themes)
        {
            GameObject go = new GameObject("DayNightOverlay");
            SpriteRenderer sr = go.AddComponent<SpriteRenderer>();
            sr.sprite = VuonMoSpriteForge.Get("ui_white");
            sr.color = new Color(1f, 1f, 1f, 0f);
            sr.sortingOrder = OverlayOrder;
            go.transform.SetParent(cam.transform, false);
            go.transform.localPosition = new Vector3(0f, 0f, 1f);
            go.transform.localScale = new Vector3(200f, 200f, 1f);   // phủ kín màn hình

            DayNightTint2D tint = go.AddComponent<DayNightTint2D>();
            tint.overlay = sr;
            tint.themes = themes;
            return tint;
        }

        // ===================================================================== HUD
        private static GameObject CreateHud()
        {
            GameObject canvasGo = new GameObject("UI_Canvas");
            Canvas canvas = canvasGo.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 100;
            CanvasScaler scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(320f, 180f);
            scaler.matchWidthOrHeight = 0.5f;
            canvasGo.AddComponent<GraphicRaycaster>();

            GameObject hudGo = new GameObject("HUD");
            hudGo.transform.SetParent(canvasGo.transform, false);
            HudController2D hud = hudGo.AddComponent<HudController2D>();

            Font font = BuiltinFont();

            // --- góc trên trái
            hud.clockLabel   = NewText(hudGo.transform, "ClockLabel",   font, 10, TextAnchor.UpperLeft, new Vector2(6f, -6f),  new Vector2(70f, 14f));
            hud.dayLabel     = NewText(hudGo.transform, "DayLabel",     font, 8,  TextAnchor.UpperLeft, new Vector2(6f, -22f), new Vector2(120f, 12f));
            hud.seasonLabel  = NewText(hudGo.transform, "SeasonLabel",  font, 8,  TextAnchor.UpperLeft, new Vector2(6f, -34f), new Vector2(90f, 12f));
            hud.weatherIcon  = NewImage(hudGo.transform, "WeatherIcon", VuonMoSpriteForge.Get("weather_sunny"), new Vector2(32f, -6f), new Vector2(16f, 16f));
            hud.weatherLabel = NewText(hudGo.transform, "WeatherLabel", font, 8,  TextAnchor.UpperLeft, new Vector2(52f, -6f), new Vector2(80f, 12f));
            hud.weatherIcons = new Sprite[]
            {
                VuonMoSpriteForge.Get("weather_sunny"), VuonMoSpriteForge.Get("weather_cloudy"),
                VuonMoSpriteForge.Get("weather_rain"),  VuonMoSpriteForge.Get("weather_storm"),
                VuonMoSpriteForge.Get("weather_snow"),  VuonMoSpriteForge.Get("weather_fog"),
            };

            // --- góc trên phải
            hud.goldLabel  = NewText(hudGo.transform, "GoldLabel",  font, 10, TextAnchor.UpperRight, new Vector2(-6f, -6f),  new Vector2(110f, 14f));
            hud.xpFill     = NewImage(hudGo.transform, "XpFill", VuonMoSpriteForge.Get("ui_white"), new Vector2(-6f, -22f), new Vector2(64f, 6f), new Vector2(1f, 1f));
            SetFilled(hud.xpFill, 0f);
            hud.levelLabel = NewText(hudGo.transform, "LevelLabel", font, 8,  TextAnchor.UpperRight, new Vector2(-6f, -32f), new Vector2(110f, 12f));

            // --- thanh nước
            hud.waterLabel     = NewText(hudGo.transform, "WaterLabel", font, 8, TextAnchor.UpperRight, new Vector2(-6f, -48f), new Vector2(110f, 12f));
            hud.waterGaugeFill = NewImage(hudGo.transform, "WaterGauge", VuonMoSpriteForge.Get("ui_white"), new Vector2(-6f, -62f), new Vector2(64f, 6f), new Vector2(1f, 1f));
            SetFilled(hud.waterGaugeFill, 1f);

            // --- hotbar 8 ô (giữa-dưới)
            hud.hotbarSlots = new Image[8];
            for (int i = 0; i < 8; i++)
            {
                hud.hotbarSlots[i] = NewImage(hudGo.transform, "Hotbar" + i, VuonMoSpriteForge.Get("ui_panel"),
                                              new Vector2(-77f + i * 22f, 6f), new Vector2(20f, 20f), new Vector2(0.5f, 0f));
            }
            hud.toolIcons = new Sprite[]
            {
                VuonMoSpriteForge.Get("tool_hoe"), VuonMoSpriteForge.Get("tool_wateringcan"),
                VuonMoSpriteForge.Get("tool_sickle"), VuonMoSpriteForge.Get("tool_axe"),
                VuonMoSpriteForge.Get("tool_pickaxe"), VuonMoSpriteForge.Get("tool_fishingrod"),
                VuonMoSpriteForge.Get("tool_hand"), VuonMoSpriteForge.Get("tool_seedbag"),
            };
            hud.hotbarHighlight = VuonMoSpriteForge.Get("ui_panel");

            // --- prompt [E] + toast
            GameObject promptPanel = new GameObject("PromptPanel");
            promptPanel.transform.SetParent(hudGo.transform, false);
            RectTransform prt = promptPanel.AddComponent<RectTransform>();
            prt.anchorMin = new Vector2(0.5f, 0f);
            prt.anchorMax = new Vector2(0.5f, 0f);
            prt.pivot = new Vector2(0.5f, 0f);
            prt.anchoredPosition = new Vector2(0f, 32f);
            prt.sizeDelta = new Vector2(180f, 14f);
            Image pbg = promptPanel.AddComponent<Image>();
            pbg.sprite = VuonMoSpriteForge.Get("ui_panel");
            pbg.color = new Color(1f, 1f, 1f, 0.85f);
            hud.promptPanel = promptPanel;
            hud.promptLabel = NewText(promptPanel.transform, "PromptLabel", font, 8, TextAnchor.MiddleCenter, Vector2.zero, Vector2.zero, true);

            hud.toastLabel = NewText(hudGo.transform, "ToastLabel", font, 8, TextAnchor.LowerCenter, new Vector2(0f, 52f), new Vector2(260f, 14f));

            if (font == null)
                Debug.LogWarning("[Vườn Mơ] Không load được font built-in → chữ HUD sẽ trống.\n" +
                                 "  → Sửa tay: chọn các Text trong UI_Canvas/HUD và gán 1 font bất kỳ vào ô Font.");

            return hudGo;
        }

        private static Font BuiltinFont()
        {
            Font f = null;
            try { f = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf"); } catch { }
            if (f == null) { try { f = Resources.GetBuiltinResource<Font>("Arial.ttf"); } catch { } }
            return f;
        }

        private static Text NewText(Transform parent, string name, Font font, int size, TextAnchor anchor,
                                    Vector2 anchoredPos, Vector2 sizeDelta, bool stretch = false)
        {
            GameObject go = new GameObject(name);
            go.transform.SetParent(parent, false);
            Text t = go.AddComponent<Text>();
            t.font = font;
            t.fontSize = size;
            t.color = new Color(1f, 0.91f, 0.72f);
            t.alignment = anchor;
            t.horizontalOverflow = HorizontalWrapMode.Overflow;
            t.verticalOverflow = VerticalWrapMode.Overflow;
            t.raycastTarget = false;
            t.text = name;

            float ax = (anchor == TextAnchor.UpperRight || anchor == TextAnchor.LowerRight) ? 1f
                     : (anchor == TextAnchor.MiddleCenter || anchor == TextAnchor.LowerCenter || anchor == TextAnchor.UpperCenter) ? 0.5f : 0f;
            float ay = (anchor == TextAnchor.UpperLeft || anchor == TextAnchor.UpperRight || anchor == TextAnchor.UpperCenter) ? 1f
                     : (anchor == TextAnchor.LowerLeft || anchor == TextAnchor.LowerRight || anchor == TextAnchor.LowerCenter) ? 0f : 0.5f;

            RectTransform rt = t.rectTransform;
            rt.anchorMin = new Vector2(ax, ay);
            rt.anchorMax = new Vector2(ax, ay);
            rt.pivot = new Vector2(ax, ay);
            rt.anchoredPosition = anchoredPos;
            rt.sizeDelta = sizeDelta;

            if (stretch)
            {
                rt.anchorMin = Vector2.zero;
                rt.anchorMax = Vector2.one;
                rt.offsetMin = Vector2.zero;
                rt.offsetMax = Vector2.zero;
            }
            return t;
        }

        private static Image NewImage(Transform parent, string name, Sprite sprite, Vector2 anchoredPos,
                                      Vector2 sizeDelta, Vector2? anchorOverride = null)
        {
            GameObject go = new GameObject(name);
            go.transform.SetParent(parent, false);
            Image img = go.AddComponent<Image>();
            img.sprite = sprite;
            img.color = Color.white;
            img.raycastTarget = false;

            Vector2 a = anchorOverride.HasValue ? anchorOverride.Value : new Vector2(0f, 1f);
            RectTransform rt = img.rectTransform;
            rt.anchorMin = a;
            rt.anchorMax = a;
            rt.pivot = a;
            rt.anchoredPosition = anchoredPos;
            rt.sizeDelta = sizeDelta;
            return img;
        }

        private static void SetFilled(Image img, float amount)
        {
            if (img == null) return;
            img.type = Image.Type.Filled;
            img.fillMethod = Image.FillMethod.Horizontal;
            img.fillOrigin = 0;
            img.fillAmount = Mathf.Clamp01(amount);
        }

        // ===================================================================== MANAGERS
        private static void CreateManagers(VuonMoDataSeeder.Result data, FarmGrid grid, NPCRelationship2D npc,
                                           Camera cam, GameObject lootContainer, GameObject hudGo)
        {
            GameObject go = new GameObject("GameManagers");

            PixelArtGlobal pixel = go.AddComponent<PixelArtGlobal>();
            pixel.pixelsPerUnit = 16;
            pixel.referenceResolution = new Vector2Int(320, 180);
            pixel.targetFrameRate = 60;
            pixel.snapCamera = true;
            pixel.targetCamera = cam;
            pixel.validateSpritesOnStart = true;

            TimeManager time = go.AddComponent<TimeManager>();
            time.dayStartHour = 6;
            time.dayEndHour = 26;
            time.daysPerSeason = 28;

            WeatherSystem weather = go.AddComponent<WeatherSystem>();
            FillWeatherProfiles(weather);

            go.AddComponent<Inventory>();
            go.AddComponent<PlayerStats>();
            go.AddComponent<AudioManager>();

            FloatingText text = go.AddComponent<FloatingText>();
            text.toastDuration = 2.2f;

            GameManager gm = go.AddComponent<GameManager>();
            gm.hudRoot = hudGo;

            LootSpawner loot = go.AddComponent<LootSpawner>();
            loot.lootPrefab = BuildLootPrefab();
            loot.lootParent = lootContainer != null ? lootContainer.transform : null;
            loot.autoCollect = false;
            loot.maxWorldLoot = 40;

            NPCRegistry2D registry = go.AddComponent<NPCRegistry2D>();
            if (npc != null) registry.npcs.Add(npc);

            GameBootstrap boot = go.AddComponent<GameBootstrap>();
            boot.springTheme = data.themes[0];
            boot.summerTheme = data.themes[1];
            boot.fallTheme = data.themes[2];
            boot.winterTheme = data.themes[3];
            boot.cropDatabase = data.cropDb;
            boot.itemDatabase = data.itemDb;
            boot.farmGrid = grid;
            boot.loadSlot = -1;
            boot.giveStarterItems = true;
            boot.starterGold = 500;
            boot.starterItems = ExpandStarters(data.seeds, 3);   // 3 hạt mỗi loại
        }

        /// <summary>GameBootstrap tặng 1 vật phẩm cho mỗi phần tử → nhân bản để tặng nhiều hạt.</summary>
        private static ItemData[] ExpandStarters(List<ItemData> seeds, int countEach)
        {
            var list = new List<ItemData>();
            foreach (ItemData s in seeds)
            {
                if (s == null) continue;
                for (int i = 0; i < countEach; i++) list.Add(s);
            }
            return list.ToArray();
        }

        private static void FillWeatherProfiles(WeatherSystem weather)
        {
            weather.profiles = new List<WeatherSystem.WeatherProfile>();
            weather.profiles.Add(Profile(WeatherType.Sunny,        0.45f, false, 0.00f, 1.05f, false));
            weather.profiles.Add(Profile(WeatherType.Cloudy,       0.20f, false, 0.00f, 1.00f, false));
            weather.profiles.Add(Profile(WeatherType.Rain,         0.18f, true,  0.00f, 1.10f, false));
            weather.profiles.Add(Profile(WeatherType.Storm,        0.05f, true,  0.10f, 1.05f, true));
            weather.profiles.Add(Profile(WeatherType.Snow,         0.10f, false, 0.05f, 0.60f, true));
            weather.profiles.Add(Profile(WeatherType.Fog,          0.02f, false, 0.00f, 1.00f, false));
            weather.profiles.Add(Profile(WeatherType.Rainbow,      0.00f, false, 0.00f, 1.15f, false));  // chỉ xuất hiện sau mưa
            weather.profiles.Add(Profile(WeatherType.MeteorShower, 0.01f, false, 0.00f, 1.05f, false));
        }

        private static WeatherSystem.WeatherProfile Profile(WeatherType type, float weight, bool autoWater,
                                                            float breakChance, float growth, bool keepInside)
        {
            return new WeatherSystem.WeatherProfile
            {
                type = type,
                weight = weight,
                autoWatersCrops = autoWater,
                cropBreakChance = breakChance,
                growthSpeedMultiplier = growth,
                keepsAnimalsInside = keepInside,
            };
        }
    }
}
