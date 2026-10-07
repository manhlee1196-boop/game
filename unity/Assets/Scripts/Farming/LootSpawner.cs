// ============================================================================
//  LootSpawner.cs — Nhả nông sản ra đất dưới dạng SPRITE PIXEL
//  Đặt tại: Assets/Scripts/Farming/
//  Gắn vào: GameObject "LootSpawner" trong scene
//
//  Khác bản 3D: loot là sprite 16×16 nảy lên theo vòng cung pixel,
//  có hiệu ứng "nam châm" hút về người chơi và bay vào túi (2–3 khung hình).
// ============================================================================
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using VuonMo.Core;
using VuonMo.Data;
using VuonMo.InventorySystem;

namespace VuonMo.Farming
{
    public class LootSpawner : MonoBehaviour
    {
        public static LootSpawner Instance { get; private set; }

        [Header("Cấu hình")]
        [Tooltip("Bật: loot bay thẳng vào túi (khuyến nghị cho mobile/Switch).")]
        public bool autoCollect = false;
        [Tooltip("Số món tối đa nằm dưới đất cùng lúc.")]
        public int maxWorldLoot = 40;
        [Tooltip("Chiều cao nảy tối đa (world unit).")]
        public float popHeight = 0.6f;
        [Tooltip("Thời gian nảy (giây).")]
        public float popDuration = 0.45f;
        [Tooltip("Bán kính rải quanh cây (world unit).")]
        public float scatterRadius = 0.55f;

        [Header("Tham chiếu")]
        [Tooltip("Prefab loot mặc định nếu CropData.harvestItem.worldSprite dùng chung.")]
        public GameObject lootPrefab;
        public Transform lootParent;

        private readonly List<GameObject> _spawned = new List<GameObject>();

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            if (lootParent == null) lootParent = transform;
        }

        /// <summary>Sinh loot cho một cây vừa thu hoạch.</summary>
        public void SpawnLoot(CropData crop, int amount, Vector3 origin, CropQuality quality, Camera cam)
        {
            if (crop == null || crop.harvestItem == null || amount <= 0) return;

            // --- Chế độ tự nhặt: vào túi ngay + chữ "+N" bay lên ---
            if (autoCollect || crop.harvestItem.autoPickup)
            {
                Inventory.Instance?.Add(crop.harvestItem, amount, quality);
                if (FloatingText.Instance != null)
                    FloatingText.Instance.Show($"+{amount}", origin + Vector3.up * 0.4f, QualityColor(quality));
                return;
            }

            // --- Rơi ra đất: gom thành tối đa 3 cụm ---
            int clusters = Mathf.Clamp(amount, 1, 3);
            int perCluster = Mathf.CeilToInt(amount / (float)clusters);

            for (int i = 0; i < clusters; i++)
            {
                int stack = (i == clusters - 1) ? amount - perCluster * (clusters - 1) : perCluster;
                if (stack <= 0) continue;

                Vector3 target = origin + (Vector3)(Random.insideUnitCircle.normalized * Random.Range(0.15f, scatterRadius));
                target = SnapToHalfPixel(target, cam);
                target.z = origin.z;

                GameObject go = CreateLootObject(crop, stack, quality, origin);
                var pickup = go.GetComponent<ItemPickup>() ?? go.AddComponent<ItemPickup>();
                pickup.Setup(crop, stack, quality);
                pickup.StartPop(origin, target, popHeight, popDuration);

                TrackAndCleanup(go);
            }
        }

        private GameObject CreateLootObject(CropData crop, int amount, CropQuality quality, Vector3 pos)
        {
            GameObject go;
            if (lootPrefab != null)
                go = Instantiate(lootPrefab, pos, Quaternion.identity, lootParent);
            else
            {
                go = new GameObject($"Loot_{crop.cropId}");
                go.transform.SetParent(lootParent, false);
                go.transform.position = pos;
                go.AddComponent<SpriteRenderer>();
            }
            go.name = $"Loot_{crop.cropId}_x{amount}";
            return go;
        }

        private void TrackAndCleanup(GameObject go)
        {
            _spawned.Add(go);
            if (_spawned.Count <= maxWorldLoot) return;

            for (int i = 0; i < _spawned.Count; i++)
            {
                if (_spawned[i] != null) Destroy(_spawned[i]);
                _spawned.RemoveAt(i);
                break;
            }
        }

        /// <summary>Nhả loot theo từng món một (dùng cho máy gặt hàng loạt).</summary>
        public IEnumerator SpawnLootSpread(CropData crop, int amount, Vector3 origin, CropQuality quality, Camera cam, float interval = 0.08f)
        {
            for (int i = 0; i < amount; i++)
            {
                SpawnLoot(crop, 1, origin, quality, cam);
                yield return new WaitForSeconds(interval);
            }
        }

        private Color QualityColor(CropQuality q)
        {
            switch (q)
            {
                case CropQuality.Silver: return new Color(0.85f, 0.92f, 1f);
                case CropQuality.Gold: return new Color(1f, 0.9f, 0.45f);
                case CropQuality.Rainbow: return new Color(1f, 0.65f, 1f);
                default: return Color.white;
            }
        }

        /// <summary>Snap về nửa pixel để sprite không bị "rung" khi nảy.</summary>
        public static Vector3 SnapToHalfPixel(Vector3 world, Camera cam)
        {
            if (cam == null || !cam.orthographic) return world;
            float pixelSize = (cam.orthographicSize * 2f) / Mathf.Max(1, Screen.height);
            float half = pixelSize * 0.5f;
            return new Vector3(
                Mathf.Round(world.x / half) * half,
                Mathf.Round(world.y / half) * half,
                world.z);
        }
    }
}
