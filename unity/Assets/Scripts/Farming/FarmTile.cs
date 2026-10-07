// ============================================================================
//  FarmTile.cs — Một ô đất 2×2 m trong hệ thống lưới (Grid System)
//  Đặt tại: Assets/Scripts/Farming/
//  Gắn vào: Prefab "Tile_2x2" (có BoxCollider + 3 Renderer cho 3 trạng thái hình ảnh)
// ============================================================================
using UnityEngine;
using VuonMo.Core;
using VuonMo.Data;
using VuonMo.Interaction;

namespace VuonMo.Farming
{
    public class FarmTile : MonoBehaviour, IInteractable
    {
        [Header("Lưới")]
        public Vector2Int gridCoord;          // Toạ độ trên lưới trang trại
        public float tileSize = 2f;           // 2 m × 2 m
        public bool isBuildZone = false;      // Ô thuộc vùng cho phép xây dựng?

        [Header("Trạng thái đất")]
        [SerializeField] private TileState state = TileState.Grass;
        [Range(0f, 1f)] public float moisture = 0f;      // Độ ẩm 0–1
        [Range(0f, 1f)] public float nutrients = 0.6f;   // Dinh dưỡng 0–1
        [Range(0, 3)] public int weedLevel = 0;          // Cỏ dại 0–3
        public bool hasPest = false;                     // Sâu bệnh
        public bool isGreenhouse = false;                // Trong nhà kính (miễn nhiễm mùa Đông)

        [Header("Tham chiếu")]
        public CropInstance crop;                        // Cây đang trồng (null nếu trống)
        [SerializeField] private Transform cropAnchor;   // Vị trí đặt cây (giữa ô, cao 0)
        [SerializeField] private GameObject grassVisual;
        [SerializeField] private GameObject tilledVisual;
        [SerializeField] private GameObject wateredVisual;
        [SerializeField] private GameObject wetDarkVisual; // lớp đất sẫm khi ẩm cao

        [Header("Cân bằng")]
        [Tooltip("Lượng ẩm giảm mỗi ngày (0.35 = mất 35%/ngày).")]
        public float dailyMoistureLoss = 0.35f;
        [Tooltip("Lượng ẩm nhận được mỗi lần tưới.")]
        public float waterPerUse = 0.4f;
        [Tooltip("Dinh dưỡng mất mỗi vụ thu hoạch.")]
        public float nutrientLossPerHarvest = 0.05f;
        [Tooltip("Tỉ lệ mọc cỏ dại mỗi ngày.")]
        public float weedChancePerDay = 0.04f;

        public TileState State => state;
        public bool IsEmpty => state == TileState.Tilled && crop == null;
        public bool CanPlantHere => state == TileState.Tilled && crop == null;

        // ------------------------------------------------------------------
        private void Start()
        {
            if (cropAnchor == null)
            {
                cropAnchor = new GameObject("CropAnchor").transform;
                cropAnchor.SetParent(transform, false);
                cropAnchor.localPosition = new Vector3(0f, 0f, 0f);
            }
            RefreshVisual();

            // Nghe event ngày mới để: giảm ẩm, mọc cỏ dại, sâu bệnh
            if (TimeManager.Instance != null)
                TimeManager.Instance.OnDayChanged += HandleNewDay;
        }

        private void OnDestroy()
        {
            if (TimeManager.Instance != null)
                TimeManager.Instance.OnDayChanged -= HandleNewDay;
        }

        private void HandleNewDay(int dayIndex, Season season)
        {
            if (state == TileState.Grass || state == TileState.Blocked) return;

            // 1) Mưa/bão thì tưới đầy ô đất
            if (WeatherSystem.Instance != null && WeatherSystem.Instance.IsRaining())
                moisture = 1f;
            else
                moisture = Mathf.Clamp01(moisture - dailyMoistureLoss);

            // 2) Cỏ dại mọc
            if (Random.value < weedChancePerDay && weedLevel < 3)
                weedLevel++;

            // 3) Sâu bệnh khi đất bạc màu
            if (!hasPest && nutrients < 0.4f && Random.value < 0.02f)
                hasPest = true;

            // 4) Đất khô quá lâu -> độ ẩm tối thiểu
            if (moisture < 0.05f) moisture = 0f;

            RefreshVisual();
        }

        // ------------------------------------------------------------------
        // HÀNH ĐỘNG TRÊN Ô ĐẤT
        // ------------------------------------------------------------------

        /// <summary>Cuốc đất (yêu cầu công cụ Hoe).</summary>
        public bool Till()
        {
            if (state == TileState.Blocked) return false;
            if (state == TileState.Planted) return false;
            if (state == TileState.Tilled) return false;
            if (weedLevel > 0) { weedLevel = 0; }   // cuốc luôn dọn cỏ dại

            state = TileState.Tilled;
            RefreshVisual();
            return true;
        }

        /// <summary>Tưới nước. Trả về true nếu có tác dụng.</summary>
        public bool Water(float amount = -1f)
        {
            if (state == TileState.Grass || state == TileState.Blocked) return false;
            float add = amount > 0f ? amount : waterPerUse;
            bool changed = moisture < 1f;
            moisture = Mathf.Clamp01(moisture + add);
            RefreshVisual();
            return changed;
        }

        /// <summary>Kiểm tra có thể gieo hạt giống này không.</summary>
        public bool CanPlant(CropData data, Season season, out string reason)
        {
            reason = "";
            if (state == TileState.Blocked) { reason = "Ô đất bị chặn."; return false; }
            if (state == TileState.Grass) { reason = "Cần cuốc đất trước (phím 1)."; return false; }
            if (!IsEmpty) { reason = "Ô này đã có cây."; return false; }
            if (!data.CanPlantInSeason(season)) { reason = $"{data.displayName} không trồng được vào mùa này."; return false; }
            if (season == Season.Winter && !data.survivesWinterOutdoor && !isGreenhouse)
            {
                reason = "Mùa Đông: hãy trồng trong nhà kính.";
                return false;
            }
            return true;
        }

        /// <summary>Gieo hạt: nhận vào CropData, tạo CropInstance thật trong scene.</summary>
        public CropInstance Plant(CropData data)
        {
            if (data == null || !IsEmpty) return null;

            // Ưu tiên dùng prefab cây đã cấu hình trong CropData
            GameObject cropGo = new GameObject($"Crop_{data.cropId}");
            cropGo.transform.SetParent(cropAnchor != null ? cropAnchor : transform, false);
            cropGo.transform.localPosition = Vector3.zero;

            CropInstance instance = cropGo.AddComponent<CropInstance>();
            instance.Initialize(data, this, TimeManager.Instance.DayIndex, TimeManager.Instance.CurrentSeason);

            crop = instance;
            state = TileState.Planted;
            RefreshVisual();
            return instance;
        }

        /// <summary>Gỡ cây (khi chết hoặc thu hoạch xong cây một vụ).</summary>
        public void ClearCrop(bool keepTilled = true, bool consumeNutrients = false)
        {
            if (crop != null)
            {
                Destroy(crop.gameObject);
                crop = null;
            }
            state = keepTilled ? TileState.Tilled : TileState.Grass;
            if (consumeNutrients)
                nutrients = Mathf.Clamp01(nutrients - nutrientLossPerHarvest);
            RefreshVisual();
        }

        /// <summary>Bón phân.</summary>
        public void Fertilize(float nutrientAmount = 0.3f)
        {
            nutrients = Mathf.Clamp01(nutrients + nutrientAmount);
            hasPest = false; // Phân hữu cơ xử lý luôn sâu bệnh đơn giản
            RefreshVisual();
        }

        /// <summary>Dữ liệu để lưu game.</summary>
        public float Moisture => moisture;
        public float Nutrients => nutrients;

        public void LoadState(int stateInt, float moistureValue, float nutrientValue, int weeds, bool pest)
        {
            state = (TileState)stateInt;
            moisture = moistureValue;
            nutrients = nutrientValue;
            weedLevel = weeds;
            hasPest = pest;
            RefreshVisual();
        }

        // ------------------------------------------------------------------
        private void RefreshVisual()
        {
            if (grassVisual) grassVisual.SetActive(state == TileState.Grass || state == TileState.Blocked);
            if (tilledVisual) tilledVisual.SetActive(state != TileState.Grass && state != TileState.Blocked);
            if (wateredVisual) wateredVisual.SetActive(state != TileState.Grass && moisture > 0.55f);
            if (wetDarkVisual) wetDarkVisual.SetActive(state != TileState.Grass && moisture > 0.3f);
        }

        // ------------------------------------------------------------------
        // IInteractable — người chơi bấm E lên ô đất
        // ------------------------------------------------------------------
        public Transform InteractTransform => transform;

        public string GetPrompt(PlayerInteractor player)
        {
            // Nếu có cây con thì ưu tiên cây (được xử lý ở CropInstance trước khi tới đây)
            if (crop != null) return crop.GetPrompt(player);

            switch (state)
            {
                case TileState.Grass:
                    return player.CurrentTool == ToolType.Hoe
                        ? "[E] Cuốc đất"
                        : "[E] Cần cầm Cuốc (phím 1) để cuốc đất";
                case TileState.Tilled:
                    if (weedLevel > 0) return "[E] Dọn cỏ dại";
                    if (player.CurrentTool == ToolType.WateringCan) return "[E] Tưới nước";
                    if (player.SelectedSeed != null) return $"[E] Gieo {player.SelectedSeed.displayName}";
                    return "[E] Đất đã sẵn sàng — chọn hạt giống (Q) rồi bấm E";
                case TileState.Blocked:
                    return "";
                default:
                    return "";
            }
        }

        public bool CanInteract(PlayerInteractor player) => state != TileState.Blocked;

        public void Interact(PlayerInteractor player)
        {
            if (crop != null)
            {
                crop.Interact(player);
                return;
            }

            switch (state)
            {
                case TileState.Grass:
                    if (player.CurrentTool == ToolType.Hoe) Till();
                    else player.ShowToast("Hãy chọn Cuốc (phím 1)");
                    break;

                case TileState.Tilled:
                    if (weedLevel > 0 && player.CurrentTool == ToolType.Hoe)
                    {
                        weedLevel = 0;
                        player.ShowToast("Đã dọn cỏ dại");
                        break;
                    }
                    if (player.CurrentTool == ToolType.WateringCan)
                    {
                        if (player.ConsumeWater()) Water();
                        else player.ShowToast("Bình đã hết nước — hãy ra giếng/hồ múc nước");
                        break;
                    }
                    if (player.SelectedSeed != null)
                    {
                        CropData seed = player.SelectedSeed;
                        if (CanPlant(seed, TimeManager.Instance.CurrentSeason, out string reason))
                        {
                            Plant(seed);
                            player.ConsumeSelectedSeed();
                        }
                        else player.ShowToast(reason);
                        break;
                    }
                    player.ShowToast("Chọn hạt giống trong túi (Q) để gieo");
                    break;
            }
        }
    }
}
