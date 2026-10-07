// ============================================================================
//  PlayerInteractor2D.cs — Người chơi bấm E: tưới nước, thu hoạch, cuốc đất, nói chuyện
//  Đặt tại: Assets/Scripts/Player/
//  Gắn vào: GameObject "Player" (sau PlayerController2D)
//
//  Điểm khác bản 3D: KHÔNG dùng raycast. Game 2D pixel top-down nhắm mục tiêu bằng
//  Ô LƯỚI NGAY TRƯỚC MẶT nhân vật (theo hướng đang quay) — chính xác và "đã tay" hơn.
// ============================================================================
using System;
using UnityEngine;
using VuonMo.Core;
using VuonMo.Data;
using VuonMo.Farming;
using VuonMo.InventorySystem;

namespace VuonMo.Player
{
    public class PlayerInteractor2D : MonoBehaviour
    {
        [Header("Tầm với")]
        [Tooltip("Số ô có thể tương tác về phía trước (1 = ô kề mặt).")]
        public int reachCells = 1;

        [Header("Vật thể tương tác tự do (NPC, giếng, giường, thùng...)")]
        [Tooltip("Layer chứa các Interactable2D. Để 0 nếu chỉ tương tác theo lưới đất.")]
        public LayerMask interactableMask;

        [Header("Công cụ & hạt giống")]
        [SerializeField] private ToolType currentTool = ToolType.None;
        [SerializeField] private CropData selectedSeed;
        [SerializeField] private int waterCharges = 20;
        public int maxWaterCharges = 20;

        [Header("Thời gian khoá khi dùng công cụ (giây)")]
        public float toolUseTime = 0.35f;

        /// <summary>UI nghe các event này để cập nhật HUD.</summary>
        public event Action<string> OnPromptChanged;
        public event Action<ToolType> OnToolChanged;
        public event Action<CropData> OnSeedChanged;
        public event Action<int> OnWaterChanged;

        public ToolType CurrentTool => currentTool;
        public CropData SelectedSeed => selectedSeed;
        public int WaterCharges => waterCharges;

        private PlayerController2D _motor;
        private float _busyUntil;
        private string _lastPrompt = "";

        private void Awake()
        {
            _motor = GetComponent<PlayerController2D>();
        }

        private void Update()
        {
            HandleHotkeys();

            bool busy = Time.time < _busyUntil;
            _motor.SetBusy(busy);

            UpdatePrompt();

            if (!busy && Input.GetKeyDown(KeyCode.E))
                DoInteract();
        }

        // ------------------------------------------------------------------
        //  NHẮM MỤC TIÊU: ô lưới trước mặt
        // ------------------------------------------------------------------
        private Vector3Int TargetCell()
        {
            Vector2Int dir = DirectionUtil.ToCell(_motor.Facing);
            Vector3Int cell = _motor.CurrentCell() + new Vector3Int(dir.x * reachCells, dir.y * reachCells, 0);
            return cell;
        }

        /// <summary>Tìm Interactable2D (NPC, giếng, giường, thùng...) trong ô trước mặt.</summary>
        private Interactable2D FindInteractableInFront()
        {
            if (interactableMask == 0) return null;
            Vector3 center = (Vector3)TargetCell() + new Vector3(0.5f, 0.5f, 0f);
            Collider2D hit = Physics2D.OverlapCircle(center, 0.55f, interactableMask);
            if (hit == null) return null;
            var component = hit.GetComponentInParent<Interactable2D>();
            return component;
        }

        private void UpdatePrompt()
        {
            string prompt = BuildPrompt();
            if (prompt != _lastPrompt)
            {
                _lastPrompt = prompt;
                OnPromptChanged?.Invoke(prompt);
            }
        }

        private string BuildPrompt()
        {
            var grid = FarmGrid.Instance;
            if (grid == null) return "";

            // 0) Vật thể tương tác tự do (NPC, giếng, giường...) được ưu tiên trước
            var interactable = FindInteractableInFront();
            if (interactable != null)
            {
                string p = interactable.GetPrompt(this);
                if (!string.IsNullOrEmpty(p)) return p;
            }

            Vector3Int cell = TargetCell();

            // 1) Có cây -> ưu tiên cây
            var crop = grid.GetCrop(cell);
            if (crop != null) return crop.GetPrompt(this);

            // 2) Ô đất trống
            var data = grid.GetTile(cell);
            if (data == null) return "";

            switch (data.Value.state)
            {
                case TileState.Grass:
                    return currentTool == ToolType.Hoe ? "[E] Cuốc đất" : "[E] Cần cầm Cuốc (phím 1)";
                case TileState.Tilled:
                    if (data.Value.weedLevel > 0) return "[E] Dọn cỏ dại";
                    if (currentTool == ToolType.WateringCan)
                        return waterCharges > 0 ? "[E] Tưới nước" : "Bình đã hết nước — ra giếng múc";
                    if (selectedSeed != null) return $"[E] Gieo {selectedSeed.displayName}";
                    return "Chọn hạt giống (phím 8) để gieo";
                case TileState.Planted:
                    return "";
                case TileState.Blocked:
                    return "";
            }
            return "";
        }

        // ------------------------------------------------------------------
        //  THỰC THI HÀNH ĐỘNG
        // ------------------------------------------------------------------
        private void DoInteract()
        {
            // 0) Vật thể tương tác tự do trước (NPC, giếng, giường, thùng...)
            var interactable = FindInteractableInFront();
            if (interactable != null && interactable.CanInteract(this))
            {
                LockForTool();
                interactable.Interact(this);
                return;
            }

            var grid = FarmGrid.Instance;
            if (grid == null) return;

            Vector3Int cell = TargetCell();

            // 1) Cây trồng
            var crop = grid.GetCrop(cell);
            if (crop != null)
            {
                LockForTool();
                crop.Interact(this);
                return;
            }

            var tileOpt = grid.GetTile(cell);
            if (tileOpt == null) return;
            var tile = tileOpt.Value;

            switch (tile.state)
            {
                case TileState.Grass:
                    if (currentTool == ToolType.Hoe)
                    {
                        LockForTool();
                        if (grid.Till(cell)) ShowToast("Đã cuốc đất");
                    }
                    else ShowToast("Hãy chọn Cuốc (phím 1)");
                    break;

                case TileState.Tilled:
                    if (tile.weedLevel > 0 && currentTool == ToolType.Hoe)
                    {
                        LockForTool();
                        grid.ClearWeeds(cell);
                        ShowToast("Đã dọn cỏ dại");
                        break;
                    }
                    if (currentTool == ToolType.WateringCan)
                    {
                        LockForTool();
                        if (ConsumeWater())
                        {
                            grid.Water(cell);
                            ShowToast("Đã tưới nước");
                        }
                        else ShowToast("Bình đã hết nước!");
                        break;
                    }
                    if (selectedSeed != null)
                    {
                        LockForTool();
                        if (grid.CanPlant(cell, selectedSeed, TimeManager.Instance.CurrentSeason, out string reason))
                        {
                            grid.Plant(cell, selectedSeed);
                            ConsumeSelectedSeed();
                        }
                        else ShowToast(reason);
                        break;
                    }
                    ShowToast("Chọn hạt giống trong túi (phím 8)");
                    break;
            }
        }

        private void LockForTool()
        {
            _busyUntil = Time.time + toolUseTime;
            _motor.PlayToolAnimation();
            var animator = GetComponentInChildren<Animator>();
            if (animator != null) animator.SetInteger("ToolType", (int)currentTool);
        }

        // ------------------------------------------------------------------
        //  CHỌN CÔNG CỤ / HẠT GIỐNG
        // ------------------------------------------------------------------
        private void HandleHotkeys()
        {
            if (Input.GetKeyDown(KeyCode.Alpha1)) SetTool(ToolType.Hoe);
            if (Input.GetKeyDown(KeyCode.Alpha2)) SetTool(ToolType.WateringCan);
            if (Input.GetKeyDown(KeyCode.Alpha3)) SetTool(ToolType.Sickle);
            if (Input.GetKeyDown(KeyCode.Alpha4)) SetTool(ToolType.Axe);
            if (Input.GetKeyDown(KeyCode.Alpha5)) SetTool(ToolType.Pickaxe);
            if (Input.GetKeyDown(KeyCode.Alpha6)) SetTool(ToolType.FishingRod);
            if (Input.GetKeyDown(KeyCode.Alpha8) || Input.GetKeyDown(KeyCode.Q)) SetTool(ToolType.SeedBag);

            float scroll = Input.GetAxis("Mouse ScrollWheel");
            if (Mathf.Abs(scroll) > 0.01f)
            {
                int count = Enum.GetValues(typeof(ToolType)).Length;
                int t = ((int)currentTool + (scroll > 0f ? 1 : -1)) % count;
                t = (t + count) % count;
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
                case ToolType.Axe: return "Rìu";
                case ToolType.Pickaxe: return "Cuốc chim";
                case ToolType.FishingRod: return "Cần câu";
                case ToolType.SeedBag: return "Túi hạt giống";
                default: return "Tay không";
            }
        }

        // ------------------------------------------------------------------
        //  TIỆN ÍCH
        // ------------------------------------------------------------------
        public bool ConsumeWater()
        {
            if (waterCharges <= 0) return false;
            waterCharges--;
            OnWaterChanged?.Invoke(waterCharges);
            if (AudioManager.Instance != null) AudioManager.Instance.PlayWaterPour();
            return true;
        }

        public void RefillWater()
        {
            waterCharges = maxWaterCharges;
            OnWaterChanged?.Invoke(waterCharges);
            ShowToast("Đã múc đầy bình tưới");
        }

        public void ConsumeSelectedSeed()
        {
            if (selectedSeed == null) return;
            Inventory.Instance?.RemoveSeed(selectedSeed);
            if (Inventory.Instance != null && !Inventory.Instance.HasSeed(selectedSeed))
            {
                selectedSeed = null;
                OnSeedChanged?.Invoke(null);
            }
        }

        public void ShowToast(string message)
        {
            if (FloatingText.Instance != null) FloatingText.Instance.ShowToast(message);
            else Debug.Log("[Toast] " + message);
        }
    }
}
