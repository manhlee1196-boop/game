// ============================================================================
//  LootSpawner.cs — Nhả vật phẩm ra thế giới 3D khi thu hoạch
//  Đặt tại: Assets/Scripts/Farming/  (gắn vào GameObject "LootSpawner" trong scene)
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

        [Header("Cấu hình nhả loot")]
        [Tooltip("Bật: loot bay thẳng vào túi (khuyên dùng cho Switch/mobile).")]
        public bool autoCollect = false;
        [Tooltip("Số vật phẩm tối đa rơi ra ngoài thế giới cùng lúc (tránh lag).")]
        public int maxWorldLoot = 60;
        [Tooltip("Lực nảy ban đầu khi vật phẩm rơi ra.")]
        public float popForce = 2.2f;
        [Tooltip("Bán kính rải vật phẩm quanh cây.")]
        public float scatterRadius = 0.6f;

        [Header("Tham chiếu")]
        public GameObject fallbackLootPrefab;    // dùng khi ItemData.worldPrefab = null
        public Transform lootParent;             // node cha chứa loot (mặc định = chính nó)

        private readonly List<GameObject> _spawned = new List<GameObject>();

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            if (lootParent == null) lootParent = transform;
        }

        /// <summary>Sinh loot từ một vị trí. Đây là API chính mà CropInstance gọi.</summary>
        public void SpawnLoot(ItemData item, int amount, Vector3 origin, CropQuality quality, Vector3 facing)
        {
            if (item == null || amount <= 0) return;

            // --- Chế độ tự nhặt: cộng thẳng vào túi, kèm hiệu ứng "bay vào túi" ---
            if (autoCollect || item.autoPickup)
            {
                Inventory.Instance?.Add(item, amount, quality);
                SpawnFlyToPlayerVfx(item, origin, amount);
                return;
            }

            GameObject prefab = item.worldPrefab != null ? item.worldPrefab : fallbackLootPrefab;
            if (prefab == null)
            {
                // Không có model 3D -> cộng thẳng vào túi để không chặn gameplay
                Inventory.Instance?.Add(item, amount, quality);
                return;
            }

            // --- Rơi nhiều món: gom thành tối đa 3 cụm để tránh spam object ---
            int clusters = Mathf.Clamp(amount, 1, 3);
            int perCluster = Mathf.CeilToInt(amount / (float)clusters);

            for (int i = 0; i < clusters; i++)
            {
                int stack = (i == clusters - 1) ? amount - perCluster * (clusters - 1) : perCluster;
                if (stack <= 0) continue;

                Vector3 dir = Quaternion.Euler(0f, Random.Range(-35f, 35f), 0f) * (facing.sqrMagnitude > 0.01f ? facing : Vector3.forward);
                Vector3 pos = origin + dir.normalized * Random.Range(0.1f, scatterRadius) + Vector3.up * 0.15f;

                GameObject go = Instantiate(prefab, pos, Quaternion.identity, lootParent);
                go.name = $"Loot_{item.itemId}_x{stack}";

                var pickup = go.GetComponent<ItemPickup>() ?? go.AddComponent<ItemPickup>();
                pickup.Setup(item, stack, quality);
                pickup.PopUp(dir.normalized * popForce + Vector3.up * popForce * 0.8f);

                TrackAndCleanup(go);
            }
        }

        private void TrackAndCleanup(GameObject go)
        {
            _spawned.Add(go);
            if (_spawned.Count <= maxWorldLoot) return;

            // Xoá vật phẩm cũ nhất (đã bị nhặt thì bỏ qua)
            for (int i = 0; i < _spawned.Count; i++)
            {
                if (_spawned[i] == null) { _spawned.RemoveAt(i); i--; continue; }
                Destroy(_spawned[i]);
                _spawned.RemoveAt(i);
                break;
            }
        }

        private void SpawnFlyToPlayerVfx(ItemData item, Vector3 origin, int amount)
        {
            // Hiệu ứng nhẹ: 1 particle + chữ "+N" bay lên (dùng FloatingText nếu có)
            if (FloatingText.Instance != null)
                FloatingText.Instance.Show($"{(item.icon != null ? "" : "")}+{amount} {item.displayName}", origin, Color.yellow);
        }

        /// <summary>Nhả loot theo đường cong (dùng cho cây ăn quả cao).</summary>
        public IEnumerator SpawnLootSpread(ItemData item, int amount, Vector3 origin, CropQuality quality, float duration = 0.4f)
        {
            int chunks = Mathf.Max(1, amount);
            for (int i = 0; i < chunks; i++)
            {
                SpawnLoot(item, 1, origin, quality, Vector3.forward);
                yield return new WaitForSeconds(duration / chunks);
            }
        }
    }
}
