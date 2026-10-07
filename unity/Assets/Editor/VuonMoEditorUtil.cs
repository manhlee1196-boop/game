// ============================================================================
//  VuonMoEditorUtil.cs — Tiện ích dùng chung cho bộ công cụ dựng nhanh
//  Đặt tại: Assets/Editor/  (thư mục Editor → chỉ chạy trong Unity Editor)
//
//  Nội dung:
//   · VuonMoPaths  — mọi đường dẫn asset do tool sinh ra (1 chỗ duy nhất)
//   · VuonMoUtil   — tạo thư mục, ghi PNG + cấu hình import pixel, tạo Tag/Layer
//
//  ⚠️ Các file trong Assets/Editor KHÔNG được build vào game — chỉ là tool.
// ============================================================================
using System.IO;
using UnityEditor;
using UnityEngine;

namespace VuonMo.EditorTools
{
    /// <summary>Đường dẫn chuẩn — đổi ở đây là đổi toàn bộ tool.</summary>
    public static class VuonMoPaths
    {
        public const string Root      = "Assets/VuonMo";
        public const string Art       = Root + "/Art/Placeholder";
        public const string TileDir   = Root + "/Data/Tiles";
        public const string CropDir   = Root + "/Data/Crops";
        public const string ItemDir   = Root + "/Data/Items";
        public const string ThemeDir  = Root + "/Data/Themes";
        public const string DbDir     = Root + "/Data/Databases";
        public const string PrefabDir = Root + "/Prefabs";
        public const string SceneDir  = Root + "/Scenes";

        public const string CropDbPath = DbDir + "/CropDatabase.asset";
        public const string ItemDbPath = DbDir + "/ItemDatabase.asset";
        public const string ScenePath  = SceneDir + "/VuonMo_Sample.unity";
        public const string CropPrefabPath = PrefabDir + "/Crop_Base.prefab";
        public const string LootPrefabPath = PrefabDir + "/Loot_Base.prefab";
    }

    public static class VuonMoUtil
    {
        // ---------------------------------------------------------------- THƯ MỤC
        /// <summary>Tạo thư mục theo đường dẫn "Assets/a/b/c" (tạo cả cấp cha còn thiếu).</summary>
        public static void EnsureFolder(string assetFolderPath)
        {
            if (string.IsNullOrEmpty(assetFolderPath)) return;
            if (AssetDatabase.IsValidFolder(assetFolderPath)) return;

            string[] parts = assetFolderPath.Split('/');
            string current = parts[0];                      // "Assets"
            for (int i = 1; i < parts.Length; i++)
            {
                string next = current + "/" + parts[i];
                if (!AssetDatabase.IsValidFolder(next))
                    AssetDatabase.CreateFolder(current, parts[i]);
                current = next;
            }
        }

        // ---------------------------------------------------------------- SPRITE
        /// <summary>
        /// Ghi Texture2D thành PNG trong Assets, cấu hình import đúng chuẩn pixel art
        /// (Point filter, PPU 16, không nén, không mipmap) rồi trả về Sprite đã import.
        /// </summary>
        public static Sprite SaveSprite(Texture2D tex, string folder, string fileName, Vector2 pivot)
        {
            EnsureFolder(folder);
            string path = folder + "/" + fileName + ".png";

            byte[] png = tex.EncodeToPNG();
            File.WriteAllBytes(path, png);
            Object.DestroyImmediate(tex);
            AssetDatabase.ImportAsset(path, ImportAssetOptions.ForceUpdate);
            ConfigureImporter(path, pivot);

            Sprite sp = AssetDatabase.LoadAssetAtPath<Sprite>(path);
            if (sp == null) Debug.LogWarning("[Vườn Mơ] Không load được sprite: " + path);
            return sp;
        }

        /// <summary>Cấu hình TextureImporter cho pixel art. Pivot = (0.5, 0) là chân sprite.</summary>
        public static void ConfigureImporter(string path, Vector2 pivot)
        {
            TextureImporter imp = AssetImporter.GetAtPath(path) as TextureImporter;
            if (imp == null) return;

            imp.textureType = TextureImporterType.Sprite;
            imp.spriteImportMode = SpriteImportMode.Single;
            imp.spritePixelsPerUnit = 16f;
            imp.filterMode = FilterMode.Point;
            imp.textureCompression = TextureImporterCompression.Uncompressed;
            imp.mipmapEnabled = false;
            imp.wrapMode = TextureWrapMode.Clamp;
            imp.alphaIsTransparency = true;
            imp.maxTextureSize = 2048;

            // Pivot tuỳ chỉnh (Bottom Center cho nhân vật/cây) — đọc/ghi qua TextureImporterSettings
            try
            {
                TextureImporterSettings st = new TextureImporterSettings();
                imp.ReadTextureSettings(st);
                st.spriteAlignment = (int)AlignmentFromPivot(pivot);
                st.spritePivot = pivot;
                imp.SetTextureSettings(st);
            }
            catch (System.Exception e)
            {
                Debug.LogWarning("[Vườn Mơ] Không đặt được pivot cho " + path + " → dùng mặc định. " + e.Message);
            }

            imp.SaveAndReimport();
        }

        private static SpriteAlignment AlignmentFromPivot(Vector2 pivot)
        {
            bool left = pivot.x < 0.25f, right = pivot.x > 0.75f;
            bool bottom = pivot.y < 0.25f, top = pivot.y > 0.75f;
            if (bottom && !left && !right) return SpriteAlignment.BottomCenter;
            if (top && !left && !right) return SpriteAlignment.TopCenter;
            if (left && !bottom && !top) return SpriteAlignment.LeftCenter;
            if (right && !bottom && !top) return SpriteAlignment.RightCenter;
            if (!left && !right && !bottom && !top) return SpriteAlignment.Center;
            return SpriteAlignment.Custom;
        }

        // ---------------------------------------------------------------- ASSET
        public static T LoadOrNull<T>(string path) where T : Object
        {
            return AssetDatabase.LoadAssetAtPath<T>(path);
        }

        /// <summary>Tạo asset mới hoặc ghi đè asset đã có (an toàn khi chạy tool nhiều lần).</summary>
        public static T CreateOrReplace<T>(string path) where T : ScriptableObject
        {
            T existing = AssetDatabase.LoadAssetAtPath<T>(path);
            if (existing != null) return existing;
            EnsureFolder(Path.GetDirectoryName(path).Replace('\\', '/'));
            T asset = ScriptableObject.CreateInstance<T>();
            AssetDatabase.CreateAsset(asset, path);
            return asset;
        }

        // ---------------------------------------------------------------- TAG / LAYER
        public static void EnsureTag(string tag)
        {
            if (string.IsNullOrEmpty(tag)) return;
            SerializedObject so = TagManager();
            if (so == null) return;
            SerializedProperty tags = so.FindProperty("tags");
            for (int i = 0; i < tags.arraySize; i++)
                if (tags.GetArrayElementAtIndex(i).stringValue == tag) return;
            tags.InsertArrayElementAtIndex(tags.arraySize);
            tags.GetArrayElementAtIndex(tags.arraySize - 1).stringValue = tag;
            so.ApplyModifiedProperties();
        }

        /// <summary>Thêm layer vào ô trống đầu tiên (ô 0–7 là layer mặc định của Unity, không đụng vào).</summary>
        public static void EnsureLayer(string layer)
        {
            if (string.IsNullOrEmpty(layer)) return;
            SerializedObject so = TagManager();
            if (so == null) return;
            SerializedProperty layers = so.FindProperty("layers");
            for (int i = 0; i < layers.arraySize; i++)
                if (layers.GetArrayElementAtIndex(i).stringValue == layer) return;   // đã có
            for (int i = 8; i < layers.arraySize; i++)
            {
                SerializedProperty slot = layers.GetArrayElementAtIndex(i);
                if (string.IsNullOrEmpty(slot.stringValue))
                {
                    slot.stringValue = layer;
                    so.ApplyModifiedProperties();
                    return;
                }
            }
            so.ApplyModifiedProperties();
            Debug.LogWarning("[Vườn Mơ] Hết ô layer trống (8–31) để thêm: " + layer);
        }

        private static SerializedObject TagManager()
        {
            try
            {
                Object[] assets = AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/TagManager.asset");
                if (assets == null || assets.Length == 0) return null;
                return new SerializedObject(assets[0]);
            }
            catch (System.Exception e)
            {
                Debug.LogWarning("[Vườn Mơ] Không sửa được TagManager: " + e.Message);
                return null;
            }
        }

        // ---------------------------------------------------------------- BÁO CÁO
        public static void Report(string title, string body)
        {
            Debug.Log("══════════ " + title + " ══════════\n" + body);
        }
    }
}
