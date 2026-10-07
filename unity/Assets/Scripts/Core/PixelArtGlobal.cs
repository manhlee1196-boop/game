// ============================================================================
//  PixelArtGlobal.cs — Bộ "khoá" phong cách pixel art cho toàn game
//  Đặt tại: Assets/Scripts/Core/
//  Gắn vào: GameObject "GameManagers" (chạy đầu tiên, trước mọi thứ khác)
//
//  Nhiệm vụ:
//   1. Ép mọi texture sprite sang Filter Mode = Point (chống mờ), tắt mipmap.
//   2. Khoá các thiết lập render gây mờ/hở pixel: AA, vSync, target frame rate.
//   3. Cung cấp hàm snap vị trí camera & vật thể về lưới pixel (chống "pixel rung").
//   4. Cảnh báo trong Console những sprite bị import sai cấu hình pixel art.
// ============================================================================
using System.Collections.Generic;
using UnityEngine;

namespace VuonMo.Core
{
    [DefaultExecutionOrder(-500)]
    public class PixelArtGlobal : MonoBehaviour
    {
        public static PixelArtGlobal Instance { get; private set; }

        [Header("Cấu hình pixel")]
        [Tooltip("Pixels Per Unit — phải khớp với mọi texture trong dự án. Chuẩn của game: 16.")]
        public int pixelsPerUnit = 16;

        [Tooltip("Độ phân giải nội bộ (render target). 320×180 upscale ×6 = 1920×1080.")]
        public Vector2Int referenceResolution = new Vector2Int(320, 180);

        [Tooltip("Khoá 60 FPS để animation pixel không bị nhảy khung.")]
        public int targetFrameRate = 60;

        [Header("Chống rung pixel")]
        [Tooltip("Tự động snap camera về nửa pixel mỗi LateUpdate.")]
        public bool snapCamera = true;
        public Camera targetCamera;

        [Header("Kiểm tra chất lượng import (chỉ trong Editor)")]
        [Tooltip("Quét toàn bộ sprite đang nạp và cảnh báo sprite bị import sai cấu hình pixel art.")]
        public bool validateSpritesOnStart = true;

        [Header("Độ phân giải hiển thị")]
        [Tooltip("Pixel Perfect Camera sẽ lo phần upscale; ở đây chỉ đảm bảo tỉ lệ khung hình.")]
        public bool logConfigOnStart = true;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            ApplyGlobalSettings();
        }

        private void Start()
        {
            if (targetCamera == null) targetCamera = Camera.main;
            if (validateSpritesOnStart) ValidateAllSprites();
            if (logConfigOnStart)
                Debug.Log($"[PixelArt] PPU={pixelsPerUnit} · nội bộ {referenceResolution.x}×{referenceResolution.y} · " +
                          $"tỉ lệ 1 tile = {pixelsPerUnit}px = 1 world unit.");
        }

        private void ApplyGlobalSettings()
        {
            QualitySettings.antiAliasing = 0;            // AA làm nhoè pixel
            QualitySettings.vSyncCount = 1;
            QualitySettings.anisotropicFiltering = AnisotropicFiltering.Disable;
            Application.targetFrameRate = targetFrameRate;
        }

        private void LateUpdate()
        {
            if (!snapCamera || targetCamera == null || !targetCamera.orthographic) return;
            SnapCamera(targetCamera);
        }

        // ------------------------------------------------------------------
        //  SNAP VỀ LƯỚI PIXEL
        // ------------------------------------------------------------------

        /// <summary>Snap camera để các pixel thẳng hàng tuyệt đối với màn hình → hết "pixel rung".</summary>
        public void SnapCamera(Camera cam)
        {
            if (cam == null) return;

            int screenH = Mathf.Max(1, Screen.height);
            float pixelSize = (cam.orthographicSize * 2f) / screenH;   // kích thước 1 pixel trong world unit

            Vector3 p = cam.transform.position;
            p.x = Mathf.Round(p.x / pixelSize) * pixelSize;
            p.y = Mathf.Round(p.y / pixelSize) * pixelSize;
            cam.transform.position = p;
        }

        /// <summary>Snap 1 điểm về giữa ô lưới tile (dùng khi đặt cây/công trình).</summary>
        public Vector3 SnapToTile(Vector3 world)
        {
            float s = 1f;  // 1 tile = 1 world unit (vì PPU = 16 = kích thước tile)
            return new Vector3(Mathf.Floor(world.x) + 0.5f * s, Mathf.Floor(world.y) + 0.5f * s, world.z);
        }

        /// <summary>Snap về nửa pixel (dùng cho icon bay, số damage, chữ nổi).</summary>
        public Vector3 SnapToHalfPixel(Vector3 world, Camera cam = null)
        {
            if (cam == null) cam = targetCamera;
            if (cam == null) return world;
            float pixelSize = (cam.orthographicSize * 2f) / Mathf.Max(1, Screen.height);
            return new Vector3(
                Mathf.Round(world.x / pixelSize) * pixelSize,
                Mathf.Round(world.y / pixelSize) * pixelSize,
                world.z);
        }

        // ------------------------------------------------------------------
        //  KIỂM TRA IMPORT
        // ------------------------------------------------------------------
        [ContextMenu("Kiểm tra toàn bộ sprite")]
        public void ValidateAllSprites()
        {
            var sprites = Resources.FindObjectsOfTypeAll<Sprite>();
            var badFilter = new List<string>();
            var badPpu = new List<string>();
            var badCompression = new List<string>();

            foreach (var s in sprites)
            {
                if (s == null || s.texture == null) continue;

                if (s.texture.filterMode != FilterMode.Point) badFilter.Add(s.name);
                if (Mathf.RoundToInt(s.pixelsPerUnit) != pixelsPerUnit) badPpu.Add(s.name);
#if UNITY_EDITOR
                if (s.texture.mipmapCount > 1) badCompression.Add(s.name);
#endif
            }

            Report("Filter Mode != Point (sẽ bị mờ)", badFilter);
            Report($"Pixels Per Unit != {pixelsPerUnit}", badPpu);
            Report("Có mipmap (tốn bộ nhớ, gây mờ khi zoom)", badCompression);
        }

        private void Report(string title, List<string> items)
        {
            if (items.Count == 0) return;
            string list = string.Join(", ", items.GetRange(0, Mathf.Min(items.Count, 12))) +
                          (items.Count > 12 ? $" … (+{items.Count - 12})" : "");
            Debug.LogWarning($"[PixelArt] {items.Count} sprite sai cấu hình — {title}:\n{list}\n" +
                             "→ Chọn texture > Inspector: Filter Mode = Point (no filter), Compression = None, " +
                             "Generate Mip Maps = OFF, Pixels Per Unit = 16, Mesh Type = Full Rect.");
        }

        /// <summary>Đổi camera sang chế độ pixel chuẩn (gọi khi tạo scene mới).</summary>
        [ContextMenu("Chuẩn hoá camera pixel")]
        public void NormalizeCamera()
        {
            var cam = targetCamera != null ? targetCamera : Camera.main;
            if (cam == null) return;

            cam.orthographic = true;
            // Với PPU = 16 và vùng nhìn rộng 20 tile: orthographic size = (180 / 16) / 2
            cam.orthographicSize = (referenceResolution.y / (float)pixelsPerUnit) * 0.5f;
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.30f, 0.35f, 0.42f, 1f);
            cam.allowHDR = false;
            cam.allowMSAA = false;
        }
    }
}
