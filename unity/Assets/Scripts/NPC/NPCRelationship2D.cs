// ============================================================================
//  NPCRelationship2D.cs — NPC pixel: hội thoại, quà tặng, tim (0–10)
//  Đặt tại: Assets/Scripts/NPC/
//  Gắn vào: Prefab NPC (SpriteRenderer + Animator + CircleCollider2D trigger
//           + Interactable2D đã có sẵn vì class này kế thừa nó)
// ============================================================================
using System;
using System.Collections.Generic;
using UnityEngine;
using VuonMo.Core;
using VuonMo.Data;
using VuonMo.InventorySystem;
using VuonMo.Player;

namespace VuonMo.NPCSystem
{
    public class NPCRelationship2D : Interactable2D
    {
        [Header("Thông tin NPC")]
        public string npcId = "hoa";
        public string displayName = "Bà Hòa";

        [TextArea] public string[] dialoguesMorning;
        [TextArea] public string[] dialoguesEvening;
        [TextArea] public string[] dialoguesRainy;
        [TextArea] public string[] dialoguesFestival;

        [Header("Sprite cảm xúc (pixel 8×8 hoặc 16×16)")]
        public SpriteRenderer emotionBubble;
        public Sprite heartSprite;      // ♥ khi tăng tim
        public Sprite giftSprite;       // hộp quà khi nhận quà
        public Sprite talkSprite;       // dấu "…" khi đang nói

        [Header("Mối quan hệ")]
        [SerializeField] private int heartPoints;
        public const int PointsPerHeart = 250;
        public const int MaxHearts = 10;

        [Header("Sở thích quà tặng")]
        public List<ItemData> lovedGifts = new List<ItemData>();
        public List<ItemData> likedGifts = new List<ItemData>();
        public List<ItemData> hatedGifts = new List<ItemData>();
        public int giftPointsDefault = 20;

        [Header("Đi lại (tuỳ chọn — NPC lang thang trong làng)")]
        public bool wanders = true;
        public float wanderRadius = 4f;
        public float wanderSpeed = 1.6f;

        private bool _talkedToday, _gaveGiftToday;
        private Vector3 _home;
        private Vector3 _wanderTarget;
        private float _wanderTimer;
        private float _emotionTimer;
        private bool _moving;

        public int Hearts => Mathf.Clamp(heartPoints / PointsPerHeart, 0, MaxHearts);
        public int HeartPoints => heartPoints;

        public event Action<NPCRelationship2D, int> OnHeartsChanged;

        // ==================================================================
        protected override void Start()
        {
            base.Start();
            _home = transform.position;
            _wanderTarget = _home;
            promptText = $"[E] Nói chuyện với {displayName}";

            if (emotionBubble != null) emotionBubble.enabled = false;

            if (TimeManager.Instance != null)
                TimeManager.Instance.OnDayChanged += (_, __) => { _talkedToday = false; _gaveGiftToday = false; };
        }

        // ==================================================================
        //  QUAN HỆ
        // ==================================================================
        public void AddPoints(int amount)
        {
            int before = Hearts;
            heartPoints = Mathf.Clamp(heartPoints + amount, 0, PointsPerHeart * MaxHearts);
            if (Hearts != before)
            {
                OnHeartsChanged?.Invoke(this, Hearts);
                ShowEmotion(heartSprite, 1.2f);
            }
        }

        public int GiveGift(ItemData item, CropQuality quality = CropQuality.Normal)
        {
            if (item == null) return 0;
            if (_gaveGiftToday)
            {
                FloatingText.Instance?.ShowToast($"{displayName} đã nhận quà hôm nay rồi");
                return 0;
            }
            if (Inventory.Instance == null || !Inventory.Instance.Remove(item, 1)) return 0;

            int points = giftPointsDefault;
            if (lovedGifts.Contains(item)) points = 80;
            else if (likedGifts.Contains(item)) points = 50;
            else if (hatedGifts.Contains(item)) points = -40;

            points += Mathf.RoundToInt((QualityUtil.PriceMultiplier(quality) - 1f) * 40f);
            _gaveGiftToday = true;
            AddPoints(points);

            string line = points >= 80 ? "Ôi, tuyệt quá!" : points >= 0 ? "Cảm ơn nhé." : "Hừm...";
            FloatingText.Instance?.Show($"{line}", transform.position + Vector3.up * 0.9f,
                points >= 0 ? new Color(0.6f, 1f, 0.6f) : new Color(1f, 0.5f, 0.5f));
            ShowEmotion(giftSprite != null ? giftSprite : heartSprite, 1.2f);
            return points;
        }

        public void Talk()
        {
            string line = PickLine();
            FloatingText.Instance?.Show(line, transform.position + Vector3.up * 1.0f, Color.white);
            ShowEmotion(talkSprite != null ? talkSprite : heartSprite, 1.4f);

            if (!_talkedToday)
            {
                _talkedToday = true;
                AddPoints(20);
            }
        }

        private string PickLine()
        {
            var ws = WeatherSystem.Instance;
            var tm = TimeManager.Instance;

            if (ws != null && ws.IsRaining() && Has(dialoguesRainy)) return Pick(dialoguesRainy);
            if (tm != null && (tm.IsNight || tm.Hour >= 18) && Has(dialoguesEvening)) return Pick(dialoguesEvening);
            if (Has(dialoguesMorning)) return Pick(dialoguesMorning);
            return "Chào cháu!";
        }

        private bool Has(string[] arr) => arr != null && arr.Length > 0;
        private string Pick(string[] arr) => arr[UnityEngine.Random.Range(0, arr.Length)];

        private void ShowEmotion(Sprite sprite, float duration)
        {
            if (emotionBubble == null) return;
            if (sprite != null) emotionBubble.sprite = sprite;
            emotionBubble.enabled = true;
            _emotionTimer = duration;
        }

        // ==================================================================
        //  TƯƠNG TÁC
        // ==================================================================
        protected override void OnInteract(PlayerInteractor2D player)
        {
            Talk();

            // Nếu túi có nông sản -> tặng 1 món (giống bản 3D)
            var inv = Inventory.Instance;
            if (inv != null && !_gaveGiftToday)
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

        public override string GetPrompt(PlayerInteractor2D player)
            => $"♥{Hearts}  [E] Nói chuyện với {displayName}";

        // ==================================================================
        //  ĐI LANG THANG + CẢM XÚC
        // ==================================================================
        private void Update()
        {
            // Ẩn bong bóng cảm xúc sau thời gian
            if (emotionBubble != null && emotionBubble.enabled)
            {
                _emotionTimer -= Time.deltaTime;
                if (_emotionTimer <= 0f) emotionBubble.enabled = false;
            }

            if (!wanders) return;
            var tm = TimeManager.Instance;
            if (tm != null && (tm.IsNight || tm.Hour >= 19)) { MoveTowards(_home); return; }

            _wanderTimer -= Time.deltaTime;
            if (_wanderTimer <= 0f)
            {
                _wanderTimer = UnityEngine.Random.Range(3f, 8f);
                _wanderTarget = _home + (Vector3)(UnityEngine.Random.insideUnitCircle * wanderRadius);
            }
            MoveTowards(_wanderTarget);
        }

        private void MoveTowards(Vector3 target)
        {
            Vector3 dir = (target - transform.position);
            if (dir.sqrMagnitude < 0.05f) { _moving = false; return; }

            _moving = true;
            transform.position = Vector3.MoveTowards(transform.position, target, wanderSpeed * Time.deltaTime);

            var sr = GetComponentInChildren<SpriteRenderer>();
            if (sr != null && Mathf.Abs(dir.x) > 0.05f) sr.flipX = dir.x < 0f;
        }

        // ==================================================================
        //  LƯU / TẢI
        // ==================================================================
        public void LoadHeartPoints(int points)
        {
            int delta = points - heartPoints;
            if (delta != 0) AddPoints(delta);
        }
    }

    // -------------------------------------------------------------------------
    //  Registry: giữ danh sách NPC để lưu/tải
    // -------------------------------------------------------------------------
    public class NPCRegistry2D : MonoBehaviour
    {
        public static NPCRegistry2D Instance { get; private set; }
        public List<NPCRelationship2D> npcs = new List<NPCRelationship2D>();

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            if (npcs.Count == 0) npcs.AddRange(FindObjectsByType<NPCRelationship2D>(FindObjectsSortMode.None));
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
                if (npcs[i] != null) npcs[i].LoadHeartPoints(points[i]);
        }

        public NPCRelationship2D Find(string id) => npcs.Find(n => n != null && n.npcId == id);
    }
}
