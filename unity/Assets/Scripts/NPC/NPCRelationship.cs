// ============================================================================
//  NPCRelationship.cs — Hệ thống quan hệ với NPC (tim, quà tặng, hội thoại)
//  Đặt tại: Assets/Scripts/NPC/
//  Gắn vào: mỗi Prefab NPC "NPC_Hoa", "NPC_Bay"...
// ============================================================================
using System;
using System.Collections.Generic;
using UnityEngine;
using VuonMo.Core;
using VuonMo.Data;
using VuonMo.Farming;
using VuonMo.Interaction;
using VuonMo.InventorySystem;

namespace VuonMo.NPCSystem
{
    public class NPCRelationship : MonoBehaviour, IInteractable
    {
        [Header("Thông tin NPC")]
        public string npcId = "hoa";
        public string displayName = "Bà Hòa";
        [TextArea] public string[] dialoguesMorning;
        [TextArea] public string[] dialoguesEvening;
        [TextArea] public string[] dialoguesRainy;

        [Header("Mối quan hệ")]
        [Tooltip("Điểm tích luỹ. Mỗi 250 điểm = 1 tim (tối đa 10 tim).")]
        [SerializeField] private int heartPoints = 0;
        public const int PointsPerHeart = 250;
        public const int MaxHearts = 10;

        [Header("Quà tặng")]
        public List<ItemData> lovedGifts = new List<ItemData>();   // +80
        public List<ItemData> likedGifts = new List<ItemData>();   // +50
        public List<ItemData> hatedGifts = new List<ItemData>();   // −40
        public int giftPointsDefault = 20;

        [Header("Tham chiếu")]
        public Transform interactPoint;
        public GameObject heartVfx;

        private bool talkedToday;
        private bool gaveGiftToday;

        public int Hearts => Mathf.Clamp(heartPoints / PointsPerHeart, 0, MaxHearts);
        public int HeartPoints => heartPoints;

        public event Action<NPCRelationship, int> OnHeartsChanged;

        private void Start()
        {
            if (TimeManager.Instance != null)
                TimeManager.Instance.OnDayChanged += (_, __) => { talkedToday = false; gaveGiftToday = false; };
        }

        // ------------------------------------------------------------------
        //  QUÀ TẶNG & HỘI THOẠI
        // ------------------------------------------------------------------
        public void AddPoints(int amount)
        {
            int before = Hearts;
            heartPoints = Mathf.Clamp(heartPoints + amount, 0, PointsPerHeart * MaxHearts);
            if (Hearts != before)
            {
                OnHeartsChanged?.Invoke(this, Hearts);
                if (heartVfx != null) Instantiate(heartVfx, transform.position + Vector3.up * 2f, Quaternion.identity);
            }
        }

        /// <summary>Tặm một món quà (lấy 1 item từ túi). Trả về số điểm nhận được.</summary>
        public int GiveGift(ItemData item, CropQuality quality = CropQuality.Normal)
        {
            if (item == null) return 0;
            if (gaveGiftToday) { if (FloatingText.Instance != null) FloatingText.Instance.ShowToast($"{displayName} đã nhận quà hôm nay rồi"); return 0; }
            if (Inventory.Instance == null || !Inventory.Instance.Remove(item, 1)) return 0;

            int points = giftPointsDefault;
            if (lovedGifts.Contains(item)) points = 80;
            else if (likedGifts.Contains(item)) points = 50;
            else if (hatedGifts.Contains(item)) points = -40;

            points += Mathf.RoundToInt((QualityUtil.PriceMultiplier(quality) - 1f) * 40f); // quà phẩm chất cao được thích hơn
            gaveGiftToday = true;
            AddPoints(points);

            string line = points >= 80 ? "Ôi, món này tuyệt quá!" :
                          points >= 0 ? "Cảm ơn cháu nhé." : "Hừm... thôi cũng được.";
            if (FloatingText.Instance != null) FloatingText.Instance.Show($"{displayName}: {line}", transform.position, points >= 0 ? Color.green : Color.red);
            return points;
        }

        public void Talk()
        {
            string[] pool = PickDialoguePool();
            string line = pool != null && pool.Length > 0 ? pool[UnityEngine.Random.Range(0, pool.Length)] : "Chào cháu!";
            if (FloatingText.Instance != null) FloatingText.Instance.Show($"{displayName}: {line}", transform.position, Color.white);

            if (!talkedToday)
            {
                talkedToday = true;
                AddPoints(20);
            }
        }

        private string[] PickDialoguePool()
        {
            var ws = WeatherSystem.Instance;
            var tm = TimeManager.Instance;
            if (ws != null && ws.IsRaining() && dialoguesRainy != null && dialoguesRainy.Length > 0) return dialoguesRainy;
            if (tm != null && tm.IsNight && dialoguesEvening != null && dialoguesEvening.Length > 0) return dialoguesEvening;
            return dialoguesMorning;
        }

        // ------------------------------------------------------------------
        //  IInteractable
        // ------------------------------------------------------------------
        public Transform InteractTransform => interactPoint != null ? interactPoint : transform;

        public string GetPrompt(PlayerInteractor player)
        {
            return $"♥{Hearts}  [E] Nói chuyện với {displayName}";
        }

        public bool CanInteract(PlayerInteractor player) => true;

        public void Interact(PlayerInteractor player)
        {
            Talk();

            // Nếu đang cầm nông sản ở ô hotbar đầu -> tự động tặng quà
            var inv = Inventory.Instance;
            if (inv != null && !gaveGiftToday)
            {
                foreach (var s in inv.Slots)
                {
                    if (s == null || s.item == null) continue;
                    if (s.item.category == ItemCategory.Produce || s.item.category == ItemCategory.Artisan)
                    {
                        GiveGift(s.item, s.quality);
                        break;
                    }
                }
            }
        }
    }

    // -------------------------------------------------------------------------
    //  Registry: giữ danh sách NPC để lưu/tải tim và reset theo ngày
    // -------------------------------------------------------------------------
    public class NPCRegistry : MonoBehaviour
    {
        public static NPCRegistry Instance { get; private set; }
        public List<NPCRelationship> npcs = new List<NPCRelationship>();

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            if (npcs.Count == 0) npcs.AddRange(FindObjectsOfType<NPCRelationship>());
        }

        public List<int> GetHeartPoints()
        {
            var list = new List<int>();
            foreach (var n in npcs) list.Add(n != null ? n.HeartPoints : 0);
            return list;
        }

        public void LoadHeartPoints(List<int> points)
        {
            for (int i = 0; i < npcs.Count && i < points.Count; i++)
            {
                if (npcs[i] == null) continue;
                int delta = points[i] - npcs[i].HeartPoints;
                if (delta != 0) npcs[i].AddPoints(delta);
            }
        }

        public List<bool> GetTalkedFlags() => new List<bool>(new bool[npcs.Count]);
        public void LoadTalkedFlags(List<bool> flags) { /* mở rộng nếu cần */ }

        public NPCRelationship Find(string id) => npcs.Find(n => n != null && n.npcId == id);

        /// <summary>Tặng quà cho NPC gần nhất (dùng khi kéo item vào NPC).</summary>
        public NPCRelationship GetNearest(Vector3 pos, float maxDist = 3f)
        {
            NPCRelationship best = null; float bestD = maxDist;
            foreach (var n in npcs)
            {
                if (n == null) continue;
                float d = Vector3.Distance(pos, n.transform.position);
                if (d < bestD) { bestD = d; best = n; }
            }
            return best;
        }
    }
}
