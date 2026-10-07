// ============================================================================
//  Inventory.cs — Túi đồ của người chơi (48 ô, mở rộng 96)
//  Đặt tại: Assets/Scripts/Inventory/
// ============================================================================
using System;
using System.Collections.Generic;
using UnityEngine;
using VuonMo.Core;
using VuonMo.Data;

namespace VuonMo.InventorySystem
{
    [Serializable]
    public class ItemStack
    {
        public ItemData item;
        public int amount;
        public CropQuality quality;
    }

    public class Inventory : MonoBehaviour
    {
        public static Inventory Instance { get; private set; }

        [Header("Cấu hình")]
        public int slotCount = 48;
        public int maxSlotCount = 96;

        [SerializeField] private List<ItemStack> slots = new List<ItemStack>();
        [SerializeField] private int gold = 500;

        public IReadOnlyList<ItemStack> Slots => slots;
        public int Gold => gold;

        public event Action OnInventoryChanged;
        public event Action<int> OnGoldChanged;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            while (slots.Count < slotCount) slots.Add(null);
        }

        // ------------------------------------------------------------------
        /// <summary>Thêm vật phẩm. Trả về số lượng KHÔNG nhét vừa (0 = thành công hoàn toàn).</summary>
        public int Add(ItemData item, int amount, CropQuality quality = CropQuality.Normal)
        {
            if (item == null || amount <= 0) return 0;

            // 1) Gộp vào stack cùng loại & cùng phẩm chất
            for (int i = 0; i < slots.Count; i++)
            {
                if (slots[i] == null || slots[i].item != item || slots[i].quality != quality) continue;
                int space = item.maxStack - slots[i].amount;
                if (space <= 0) continue;
                int moved = Mathf.Min(space, amount);
                slots[i].amount += moved;
                amount -= moved;
                if (amount <= 0) { OnInventoryChanged?.Invoke(); return 0; }
            }

            // 2) Chiếm ô trống
            for (int i = 0; i < slots.Count; i++)
            {
                if (slots[i] != null) continue;
                int moved = Mathf.Min(item.maxStack, amount);
                slots[i] = new ItemStack { item = item, amount = moved, quality = quality };
                amount -= moved;
                if (amount <= 0) break;
            }

            OnInventoryChanged?.Invoke();
            return amount;   // còn dư -> túi đầy
        }

        public bool Remove(ItemData item, int amount, CropQuality? quality = null)
        {
            if (CountOf(item, quality) < amount) return false;
            for (int i = 0; i < slots.Count && amount > 0; i++)
            {
                var s = slots[i];
                if (s == null || s.item != item) continue;
                if (quality.HasValue && s.quality != quality.Value) continue;
                int taken = Mathf.Min(s.amount, amount);
                s.amount -= taken;
                amount -= taken;
                if (s.amount <= 0) slots[i] = null;
            }
            OnInventoryChanged?.Invoke();
            return true;
        }

        public int CountOf(ItemData item, CropQuality? quality = null)
        {
            int total = 0;
            foreach (var s in slots)
            {
                if (s == null || s.item != item) continue;
                if (quality.HasValue && s.quality != quality.Value) continue;
                total += s.amount;
            }
            return total;
        }

        // ---- Hạt giống ----------------------------------------------------
        public bool HasSeed(CropData crop) => crop != null && crop.harvestItem != null && CountOf(crop.harvestItem) > 0;

        public void RemoveSeed(CropData crop)
        {
            if (crop?.harvestItem == null) return;
            Remove(crop.harvestItem, 1);
        }

        // ---- Tiền ---------------------------------------------------------
        public void AddGold(int amount)
        {
            gold = Mathf.Max(0, gold + amount);
            OnGoldChanged?.Invoke(gold);
        }

        public bool SpendGold(int amount)
        {
            if (gold < amount) return false;
            gold -= amount;
            OnGoldChanged?.Invoke(gold);
            return true;
        }

        /// <summary>Bán toàn bộ một loại nông sản (tính luôn hệ số phẩm chất).</summary>
        public int SellAll(ItemData item)
        {
            int total = 0;
            for (int i = 0; i < slots.Count; i++)
            {
                var s = slots[i];
                if (s == null || s.item != item) continue;
                total += Mathf.RoundToInt(s.item.baseSellPrice * QualityUtil.PriceMultiplier(s.quality)) * s.amount;
                slots[i] = null;
            }
            if (total > 0) { AddGold(total); OnInventoryChanged?.Invoke(); }
            return total;
        }

        /// <summary>Tăng số ô (khi mua nâng cấp túi).</summary>
        public void Expand(int extraSlots)
        {
            slotCount = Mathf.Min(maxSlotCount, slotCount + extraSlots);
            while (slots.Count < slotCount) slots.Add(null);
            OnInventoryChanged?.Invoke();
        }

        public void ExpandTo(int newCount)
        {
            slotCount = Mathf.Clamp(newCount, 8, maxSlotCount);
            while (slots.Count < slotCount) slots.Add(null);
        }

        // ---- Lưu / tải ----------------------------------------------------
        [Serializable]
        public class SaveData
        {
            public int slotCount;
            public int gold;
            public List<string> itemIds = new List<string>();
            public List<int> amounts = new List<int>();
            public List<int> qualities = new List<int>();
        }

        public SaveData GetSave()
        {
            var data = new SaveData { slotCount = slotCount, gold = gold };
            foreach (var s in slots)
            {
                if (s == null) continue;
                data.itemIds.Add(s.item != null ? s.item.itemId : "");
                data.amounts.Add(s.amount);
                data.qualities.Add((int)s.quality);
            }
            return data;
        }

        public void LoadSave(SaveData data, Func<string, ItemData> lookup)
        {
            slots.Clear();
            slotCount = data.slotCount;
            gold = data.gold;
            for (int i = 0; i < slotCount; i++) slots.Add(null);

            for (int i = 0; i < data.itemIds.Count; i++)
            {
                var item = lookup?.Invoke(data.itemIds[i]);
                if (item == null) continue;
                Add(item, data.amounts[i], (CropQuality)data.qualities[i]);
            }
            OnInventoryChanged?.Invoke();
        }
    }
}
