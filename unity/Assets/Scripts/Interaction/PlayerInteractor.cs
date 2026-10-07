// ============================================================================
//  PlayerInteractor.cs — Phát hiện vật thể trước mặt & xử lý phím E
//  Đặt tại: Assets/Scripts/Interaction/
//  Gắn vào: GameObject "Player" (cùng chỗ với ThirdPersonController)
// ============================================================================
using System;
using UnityEngine;
using VuonMo.Core;
using VuonMo.Data;
using VuonMo.InventorySystem;

namespace VuonMo.Interaction
{
    [RequireComponent(typeof(ThirdPersonController))]
    public class PlayerInteractor : MonoBehaviour
    {
        [Header("Phát hiện tương tác")]
        [Tooltip("Khoảng cách tối đa để tương tác (m).")]
        public float reach = 3.0f;
        [Tooltip("Bán kính phễu quét (m).")]
        public float probeRadius = 0.35f;
        [Tooltip("Camera dùng để raycast. Bỏ trống -> Camera.main")]
        public Camera viewCamera;
        public LayerMask interactMask = ~0;

        [Header("Công cụ & hạt giống")]
        [SerializeField] private ToolType currentTool = ToolType.None;
        [SerializeField] private CropData selectedSeed;
        [SerializeField] private int waterCharges = 20;   // số lần tưới còn lại
        public int maxWaterCharges = 20;

        [Header("UI")]
        public bool showDebugRay = false;

        /// <summary>Dòng prompt hiện tại (HUD subscribe event này).</summary>
        public event Action<string> OnPromptChanged;
        public event Action<ToolType> OnToolChanged;
        public event Action<CropData> OnSeedChanged;

        public ToolType CurrentTool => currentTool;
        public CropData SelectedSeed => selectedSeed;
        public int WaterCharges => waterCharges;

        private ThirdPersonController _motor;
        private IInteractable _current;
        private string _lastPrompt = "";

        private void Awake()
        {
            _motor = GetComponent<ThirdPersonController>();
            if (viewCamera == null) viewCamera = Camera.main;
        }

        private void Update()
        {
            Scan();
            HandleHotkeys();
        }

        // ------------------------------------------------------------------
        //  QUÉT VẬT THỂ
        // ------------------------------------------------------------------
        private void Scan()
        {
            IInteractable found = null;

            if (viewCamera != null)
            {
                Ray ray = new Ray(viewCamera.transform.position, viewCamera.transform.forward);
                if (Physics.SphereCast(ray, probeRadius, out RaycastHit hit, reach, interactMask, QueryTriggerInteraction.Collide))
                {
                    // Tìm IInteractable "gần nhất về mặt logic": chính nó -> con -> cha
                    found = hit.collider.GetComponent<IInteractable>();
                    if (found == null) found = hit.collider.GetComponentInParent<IInteractable>();
                    if (found == null) found = hit.collider.GetComponentInChildren<IInteractable>();

                    if (showDebugRay) Debug.DrawLine(ray.origin, hit.point, Color.green);
                }
            }

            // Fallback: nếu raycast trượt (ví dụ camera nhìn xuống đất), quét quanh chân nhân vật
            if (found == null)
            {
                Collider[] near = Physics.OverlapSphere(transform.position + Vector3.up * 0.6f, 1.6f, interactMask, QueryTriggerInteraction.Collide);
                float best = float.MaxValue;
                foreach (var c in near)
                {
                    var candidate = c.GetComponentInParent<IInteractable>();
                    if (candidate == null) continue;
                    float d = Vector3.Distance(transform.position, candidate.InteractTransform.position);
                    if (d < best) { best = d; found = candidate; }
                }
            }

            if (found != _current)
            {
                _current = found;
                _lastPrompt = ""; // buộc refresh
            }

            string prompt = _current != null && _current.CanInteract(this) ? _current.GetPrompt(this) : "";
            if (prompt != _lastPrompt)
            {
                _lastPrompt = prompt;
                OnPromptChanged?.Invoke(prompt);
            }

            // Bấm E để tương tác
            if (Input.GetKeyDown(KeyCode.E) && _current != null && _current.CanInteract(this))
                _current.Interact(this);
        }

        // ------------------------------------------------------------------
        //  CHỌN CÔNG CỤ / HẠT GIỐNG
        // ------------------------------------------------------------------
        private void HandleHotkeys()
        {
            if (Input.GetKeyDown(KeyCode.Alpha1)) SetTool(ToolType.Hoe);
            if (Input.GetKeyDown(KeyCode.Alpha2)) SetTool(ToolType.WateringCan);
            if (Input.GetKeyDown(KeyCode.Alpha3)) SetTool(ToolType.Sickle);
            if (Input.GetKeyDown(KeyCode.Alpha4)) SetTool(ToolType.Harvester);
            if (Input.GetKeyDown(KeyCode.Alpha5)) SetTool(ToolType.Axe);
            if (Input.GetKeyDown(KeyCode.Alpha0) || Input.GetKeyDown(KeyCode.Q)) SetTool(ToolType.SeedBag);

            // Cuộn chuột để đổi công cụ nhanh
            float scroll = Input.GetAxis("Mouse ScrollWheel");
            if (Mathf.Abs(scroll) > 0.01f)
            {
                int t = (int)currentTool + (scroll > 0f ? 1 : -1);
                int count = Enum.GetValues(typeof(ToolType)).Length;
                t = (t % count + count) % count;
                SetTool((ToolType)t);
            }
        }

        public void SetTool(ToolType tool)
        {
            if (currentTool == tool) return;
            currentTool = tool;
            OnToolChanged?.Invoke(tool);
            if (AudioManager.Instance != null) AudioManager.Instance.PlayToolSwitch();
            ShowToast($"Đang cầm: {ToolName(tool)}");
        }

        public void SetSeed(CropData seed)
        {
            selectedSeed = seed;
            OnSeedChanged?.Invoke(seed);
        }

        public string ToolName(ToolType t)
        {
            switch (t)
            {
                case ToolType.Hoe: return "Cuốc";
                case ToolType.WateringCan: return "Bình tưới";
                case ToolType.Sickle: return "Liềm";
                case ToolType.Harvester: return "Máy gặt";
                case ToolType.Axe: return "Rìu";
                case ToolType.Pickaxe: return "Cuốc chim";
                case ToolType.FishingRod: return "Cần câu";
                case ToolType.SeedBag: return "Túi hạt giống";
                case ToolType.Harvest: return "Hái bằng tay";
                default: return "Tay không";
            }
        }

        // ------------------------------------------------------------------
        //  TIỆN ÍCH CHO IInteractable
        // ------------------------------------------------------------------

        /// <summary>Tiêu hao 1 đơn vị nước trong bình. Trả về false nếu hết.</summary>
        public bool ConsumeWater()
        {
            if (waterCharges <= 0) return false;
            waterCharges--;
            if (AudioManager.Instance != null) AudioManager.Instance.PlayWaterPour();
            return true;
        }

        /// <summary>Múc đầy bình (gọi ở giếng/hồ nước).</summary>
        public void RefillWater()
        {
            waterCharges = maxWaterCharges;
            ShowToast("Đã múc đầy bình tưới");
        }

        /// <summary>Tiêu 1 hạt giống trong túi sau khi gieo.</summary>
        public void ConsumeSelectedSeed()
        {
            if (selectedSeed == null) return;
            if (selectedSeed.harvestItem != null)
                Inventory.Instance?.RemoveSeed(selectedSeed);

            // Hết hạt -> tự bỏ chọn
            if (Inventory.Instance != null && !Inventory.Instance.HasSeed(selectedSeed))
            {
                selectedSeed = null;
                OnSeedChanged?.Invoke(null);
            }
        }

        public void ShowToast(string message)
        {
            if (FloatingText.Instance != null)
                FloatingText.Instance.ShowToast(message);
            else
                Debug.Log("[Toast] " + message);
        }
    }
}
