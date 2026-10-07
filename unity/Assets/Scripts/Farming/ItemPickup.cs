// ============================================================================
//  ItemPickup.cs — Vật phẩm nằm dưới đất: nhấp nhô, xoay, bấm E (hoặc auto) để nhặt
//  Đặt tại: Assets/Scripts/Farming/
//  Gắn vào: Prefab loot (ví dụ Item_Tomato.prefab có SphereCollider isTrigger)
// ============================================================================
using UnityEngine;
using VuonMo.Core;
using VuonMo.Data;
using VuonMo.InventorySystem;
using VuonMo.Interaction;

namespace VuonMo.Farming
{
    public class ItemPickup : MonoBehaviour, IInteractable
    {
        [Header("Nội dung vật phẩm")]
        [SerializeField] private ItemData item;
        [SerializeField] private int amount = 1;
        [SerializeField] private CropQuality quality = CropQuality.Normal;

        [Header("Chuyển động")]
        public float bobHeight = 0.12f;
        public float bobSpeed = 2.4f;
        public float spinSpeed = 90f;
        [Tooltip("Bật: vật phẩm tự bay tới người chơi khi lại gần 3 m.")]
        public bool magnetToPlayer = true;
        public float magnetRadius = 3f;
        public float magnetSpeed = 6f;
        [Tooltip("Tự nhặt sau bao nhiêu giây nằm dưới đất (0 = tắt).")]
        public float autoCollectDelay = 0f;

        [Header("Vật lý (tuỳ chọn)")]
        public bool usePhysicsPop = true;

        private Vector3 _restPos;
        private float _spawnTime;
        private Rigidbody _rb;
        private Transform _player;
        private bool _collected;

        private void Awake()
        {
            _rb = GetComponent<Rigidbody>();
            if (_rb != null)
            {
                _rb.interpolation = RigidbodyInterpolation.Interpolate;
                _rb.collisionDetectionMode = CollisionDetectionMode.ContinuousSpeculative;
            }
        }

        private void Start()
        {
            _spawnTime = Time.time;
            _restPos = transform.position;
            var pc = GameObject.FindGameObjectWithTag("Player");
            if (pc != null) _player = pc.transform;

            if (autoCollectDelay > 0f)
                Invoke(nameof(AutoCollect), autoCollectDelay);
        }

        public void Setup(ItemData data, int count, CropQuality q)
        {
            item = data;
            amount = count;
            quality = q;

            // Phẩm chất cao -> thêm hiệu ứng phát sáng
            if (q != CropQuality.Normal)
            {
                var light = gameObject.GetComponentInChildren<Light>();
                if (light == null)
                {
                    GameObject glow = new GameObject("QualityGlow");
                    glow.transform.SetParent(transform, false);
                    light = glow.AddComponent<Light>();
                    light.type = LightType.Point;
                    light.range = 1.2f;
                    light.intensity = 0.6f;
                }
                light.color = q == CropQuality.Gold ? new Color(1f, 0.85f, 0.3f)
                            : q == CropQuality.Rainbow ? Color.magenta
                            : new Color(0.8f, 0.9f, 1f);
            }
        }

        public void PopUp(Vector3 force)
        {
            if (!usePhysicsPop || _rb == null)
            {
                // Không có Rigidbody: mô phỏng vòng cung bằng code
                StartCoroutine(SimpleArc());
                return;
            }
            _rb.isKinematic = false;
            _rb.AddForce(force, ForceMode.Impulse);
            _rb.AddTorque(Random.insideUnitSphere * 2f, ForceMode.Impulse);
        }

        private System.Collections.IEnumerator SimpleArc()
        {
            Vector3 start = transform.position;
            Vector3 end = start + new Vector3(Random.Range(-0.6f, 0.6f), 0f, Random.Range(-0.6f, 0.6f));
            float t = 0f, dur = 0.45f;
            while (t < dur)
            {
                t += Time.deltaTime;
                float n = t / dur;
                Vector3 p = Vector3.Lerp(start, end, n);
                p.y += Mathf.Sin(n * Mathf.PI) * 0.55f;
                transform.position = p;
                yield return null;
            }
            _restPos = end;
        }

        private void Update()
        {
            if (_collected) return;

            // Nhấp nhô + xoay (cozy feel)
            float bob = Mathf.Sin((Time.time - _spawnTime) * bobSpeed) * bobHeight;
            transform.position = new Vector3(transform.position.x, Mathf.Max(_restPos.y, transform.position.y) + bob * Time.deltaTime * 10f, transform.position.z);
            transform.Rotate(Vector3.up, spinSpeed * Time.deltaTime, Space.World);

            // Nam châm hút về người chơi
            if (magnetToPlayer && _player != null)
            {
                float d = Vector3.Distance(transform.position, _player.position);
                if (d < magnetRadius)
                {
                    transform.position = Vector3.MoveTowards(transform.position, _player.position + Vector3.up * 0.9f, magnetSpeed * Time.deltaTime);
                    if (d < 0.55f) Collect();
                }
            }
        }

        private void AutoCollect() => Collect();

        private void Collect()
        {
            if (_collected || item == null) return;
            _collected = true;

            int leftover = Inventory.Instance != null ? Inventory.Instance.Add(item, amount, quality) : 0;
            if (leftover > 0)
            {
                _collected = false;
                if (FloatingText.Instance != null)
                    FloatingText.Instance.Show("Túi đã đầy!", transform.position, Color.red);
                return;
            }

            if (FloatingText.Instance != null)
                FloatingText.Instance.Show($"+{amount} {item.displayName}", transform.position, Color.white);

            Destroy(gameObject);
        }

        // ---- IInteractable ----
        public Transform InteractTransform => transform;

        public string GetPrompt(PlayerInteractor player)
            => $"[E] Nhặt {item.displayName}{(amount > 1 ? $" x{amount}" : "")} {QualityUtil.Suffix(quality)}";

        public bool CanInteract(PlayerInteractor player) => !_collected;

        public void Interact(PlayerInteractor player) => Collect();
    }
}
