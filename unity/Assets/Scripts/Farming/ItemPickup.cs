// ============================================================================
//  ItemPickup.cs — Nông sản nằm dưới đất (sprite pixel 16×16)
//  Đặt tại: Assets/Scripts/Farming/
//  Gắn vào: Prefab "Loot_Base" (SpriteRenderer + CircleCollider2D isTrigger)
//
//  Hành vi:
//   · Nảy lên theo vòng cung pixel khi vừa rơi ra
//   · Nhấp nhô 2 khung (bob) để dễ nhận biết
//   · Người chơi lại gần 1.2 ô -> tự hút về và bay vào túi
// ============================================================================
using UnityEngine;
using VuonMo.Core;
using VuonMo.Data;
using VuonMo.InventorySystem;

namespace VuonMo.Farming
{
    public class ItemPickup : MonoBehaviour
    {
        [Header("Nội dung")]
        [SerializeField] private CropData crop;
        [SerializeField] private ItemData item;
        [SerializeField] private int amount = 1;
        [SerializeField] private CropQuality quality = CropQuality.Normal;

        [Header("Hiển thị")]
        public SpriteRenderer spriteRenderer;
        [Tooltip("Biên độ nhấp nhô (tính bằng pixel; 1 px = 1/16 world unit).")]
        public float bobPixels = 2f;
        public float bobSpeed = 4f;

        [Header("Nam châm hút")]
        public bool magnetToPlayer = true;
        [Tooltip("Bán kính hút (world unit; 1.2 ≈ 1.2 ô).")]
        public float magnetRadius = 1.2f;
        public float magnetSpeed = 7f;
        [Tooltip("Khoảng cách được coi là đã nhặt.")]
        public float collectDistance = 0.35f;

        [Header("Tự động")]
        [Tooltip("Tự vào túi sau bao nhiêu giây nằm dưới đất (0 = tắt).")]
        public float autoCollectDelay = 0f;

        [Header("Âm thanh")]
        public bool playPickupSound = true;

        private Vector3 _restPos;
        private float _spawnTime;
        private Transform _player;
        private bool _collected;
        private bool _popping;
        private Vector3 _popFrom, _popTo;
        private float _popT, _popDur, _popHeight;

        private void Awake()
        {
            if (spriteRenderer == null) spriteRenderer = GetComponentInChildren<SpriteRenderer>();
        }

        private void Start()
        {
            _spawnTime = Time.time;
            var pc = GameObject.FindGameObjectWithTag("Player");
            if (pc != null) _player = pc.transform;

            if (item != null && item.bobInWorld) { /* bob chạy trong Update */ }

            if (autoCollectDelay > 0f || (item != null && item.autoCollectDelay > 0f))
            {
                float delay = item != null && item.autoCollectDelay > 0f ? item.autoCollectDelay : autoCollectDelay;
                Invoke(nameof(Collect), delay);
            }
        }

        /// <summary>Gán dữ liệu loot (gọi ngay sau khi Instantiate).</summary>
        public void Setup(CropData cropData, int count, CropQuality q)
        {
            crop = cropData;
            item = cropData != null ? cropData.harvestItem : null;
            amount = count;
            quality = q;

            if (spriteRenderer == null) spriteRenderer = GetComponentInChildren<SpriteRenderer>();
            if (spriteRenderer != null && crop != null)
            {
                spriteRenderer.sprite = crop.GetHarvestSprite(q);
                if (spriteRenderer.sprite == null) spriteRenderer.sprite = crop.harvestSprite;
            }

            // Phẩm chất cao: viền sáng pixel (dùng chính sprite glow ở sorting layer trên)
            if (q != CropQuality.Normal && spriteRenderer != null)
                spriteRenderer.color = q == CropQuality.Gold ? new Color(1f, 0.95f, 0.75f)
                                     : q == CropQuality.Rainbow ? new Color(1f, 0.85f, 1f)
                                     : new Color(0.92f, 0.96f, 1f);
        }

        /// <summary>Bắt đầu cú nảy vòng cung (thay cho Rigidbody2D để tiết kiệm vật lý).</summary>
        public void StartPop(Vector3 from, Vector3 to, float height, float duration)
        {
            _popFrom = from;
            _popTo = to;
            _popHeight = height;
            _popDur = Mathf.Max(0.05f, duration);
            _popT = 0f;
            _popping = true;
            _restPos = to;
        }

        private void Update()
        {
            if (_collected) return;

            // ---- 1) Cú nảy vòng cung ----
            if (_popping)
            {
                _popT += Time.deltaTime;
                float n = Mathf.Clamp01(_popT / _popDur);
                Vector3 p = Vector3.Lerp(_popFrom, _popTo, n);
                p.y += Mathf.Sin(n * Mathf.PI) * _popHeight;      // parabol pixel
                transform.position = p;
                if (n >= 1f) { _popping = false; _restPos = _popTo; }
                return;
            }

            // ---- 2) Nhấp nhô 2 khung (bob) ----
            float bobWorld = (bobPixels / 16f);
            float bob = Mathf.Sin((Time.time - _spawnTime) * bobSpeed) * bobWorld;
            transform.position = new Vector3(_restPos.x, _restPos.y + bob, _restPos.z);

            // ---- 3) Nam châm hút người chơi ----
            if (magnetToPlayer && _player != null)
            {
                float d = Vector2.Distance(transform.position, _player.position);
                if (d < magnetRadius)
                {
                    transform.position = Vector3.MoveTowards(transform.position, _player.position, magnetSpeed * Time.deltaTime);
                    if (Vector2.Distance(transform.position, _player.position) < collectDistance) Collect();
                }
            }
        }

        public void Collect()
        {
            if (_collected) return;

            var target = crop != null ? crop.harvestItem : item;
            if (target == null) { Destroy(gameObject); return; }

            int leftover = Inventory.Instance != null ? Inventory.Instance.Add(target, amount, quality) : amount;

            if (leftover > 0)
            {
                // Túi đầy -> để lại dưới đất và báo
                if (FloatingText.Instance != null)
                    FloatingText.Instance.Show("Túi đầy!", transform.position + Vector3.up * 0.4f, Color.red);
                return;
            }

            _collected = true;
            if (playPickupSound && AudioManager.Instance != null) AudioManager.Instance.PlayPickUp();
            if (FloatingText.Instance != null)
                FloatingText.Instance.Show($"+{amount}", transform.position + Vector3.up * 0.4f, Color.white);

            Destroy(gameObject);
        }
    }
}
