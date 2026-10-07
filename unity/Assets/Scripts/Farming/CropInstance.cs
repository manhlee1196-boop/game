// ============================================================================
//  CropInstance.cs  (tên cũ trong Prompt: "CropScript")
//  ---------------------------------------------------------------------------
//  Quản lý vòng đời 1 cây trồng:
//    - 4 giai đoạn: Seed → Sprout → Mature → Fruiting (4 model 3D khác nhau)
//    - Lớn lên theo NGÀY GAME (không phải giây thực), yêu cầu nước tưới
//    - Tương tác: bấm E để TƯỚI (khi thiếu nước) hoặc THU HOẠCH (khi chín)
//    - Nhả loot (spawn vật phẩm) khi thu hoạch thành công
//
//  Đặt tại: Assets/Scripts/Farming/
//  Gắn vào: Prefab "Crop_<tên cây>" — xem docs/02-Unity-Setup.md để biết cách gắn
// ============================================================================
using System;
using UnityEngine;
using VuonMo.Core;
using VuonMo.Data;
using VuonMo.Interaction;
using VuonMo.InventorySystem;

namespace VuonMo.Farming
{
    [DisallowMultipleComponent]
    public class CropInstance : MonoBehaviour, IInteractable
    {
        // ---------------------------------------------------------------- Dữ liệu
        [Header("1) CẤU HÌNH CÂY (gán trong Inspector hoặc gọi Initialize())")]
        [SerializeField] private CropData data;

        [Header("2) 4 MODEL 3D THEO GIAI ĐOẠN")]
        [Tooltip("Thứ tự: 0=Seed(hạt), 1=Sprout(mầm), 2=Mature(trưởng thành), 3=Fruiting(có quả).\n" +
                 "Có thể để trống nếu đã gán stagePrefabs bên trong CropData.")]
        [SerializeField] private GameObject[] stageVisuals = new GameObject[4];

        [Header("3) TRẠNG THÁI (Runtime — không sửa tay)")]
        [SerializeField] private GrowthStage stage = GrowthStage.Seed;
        [Tooltip("Số ngày có nước đã tích luỹ (đây là 'tuổi' của cây).")]
        [SerializeField] private int wateredDays = 0;
        [SerializeField] private int dryStreak = 0;
        [SerializeField] private CropQuality quality = CropQuality.Normal;
        [SerializeField] private bool isDead = false;
        [SerializeField] private bool hasFertilizer = false;

        [Header("4) THAM CHIẾU")]
        [SerializeField] private FarmTile tile;
        [SerializeField] private Transform visualRoot;      // node cha chứa 4 model
        [SerializeField] private Animator animator;         // tuỳ chọn
        [SerializeField] private string animStageParam = "Stage"; // int param trong Animator

        [Header("5) THU HOẠCH")]
        [SerializeField] private Transform lootOrigin;      // điểm nhả loot (mặc định = vị trí cây)

        // ---------------------------------------------------------------- Runtime
        private Season plantedSeason;
        private GameObject[] runtimeVisuals = new GameObject[4];
        private int plantedDayIndex;

        public CropData Data => data;
        public GrowthStage Stage => stage;
        public bool IsRipe => stage == GrowthStage.Fruiting && !isDead;
        public bool IsDead => isDead;
        public CropQuality Quality => quality;
        public int WateredDays => wateredDays;
        public FarmTile Tile => tile;

        /// <summary>Event phát ra khi cây đổi giai đoạn (UI, âm thanh, thành tích...).</summary>
        public event Action<CropInstance, GrowthStage> OnStageChanged;
        /// <summary>Event khi cây được thu hoạch.</summary>
        public event Action<CropInstance, int> OnHarvested;

        // =================================================================
        //  KHỞI TẠO
        // =================================================================

        /// <summary>Gọi ngay sau khi tạo cây (từ FarmTile.Plant hoặc khi load save).</summary>
        public void Initialize(CropData cropData, FarmTile ownerTile, int dayIndex, Season season,
                               int startingWateredDays = 0, CropQuality startQuality = CropQuality.Normal)
        {
            data = cropData;
            tile = ownerTile;
            plantedDayIndex = dayIndex;
            plantedSeason = season;
            wateredDays = startingWateredDays;
            quality = startQuality;

            EnsureVisuals();
            ApplyStageImmediately(data.StageFromDays(wateredDays));
            HookTimeEvents();
        }

        private void Awake()
        {
            if (tile == null) tile = GetComponentInParent<FarmTile>();
            if (visualRoot == null) visualRoot = transform;
            if (lootOrigin == null) lootOrigin = transform;
        }

        private void Start()
        {
            // Trường hợp script được gắn tay vào prefab và đặt sẵn trong scene
            if (data != null)
            {
                EnsureVisuals();
                ApplyStageImmediately(data.StageFromDays(wateredDays));
            }
            HookTimeEvents();
        }

        private bool _hooked;
        private void HookTimeEvents()
        {
            if (_hooked || TimeManager.Instance == null) return;
            TimeManager.Instance.OnDayChanged += HandleNewDay;
            TimeManager.Instance.OnSeasonChanged += HandleSeasonChanged;
            if (WeatherSystem.Instance != null)
                WeatherSystem.Instance.OnWeatherChanged += HandleWeatherChanged;
            _hooked = true;
        }

        private void OnDestroy()
        {
            if (!_hooked) return;
            if (TimeManager.Instance != null)
            {
                TimeManager.Instance.OnDayChanged -= HandleNewDay;
                TimeManager.Instance.OnSeasonChanged -= HandleSeasonChanged;
            }
            if (WeatherSystem.Instance != null)
                WeatherSystem.Instance.OnWeatherChanged -= HandleWeatherChanged;
        }

        // =================================================================
        //  LOGIC SINH TRƯỞNG — chạy 1 lần mỗi NGÀY GAME
        // =================================================================

        private void HandleNewDay(int dayIndex, Season season)
        {
            if (isDead) return;

            bool tileIsWet = tile != null && tile.moisture >= (data != null ? data.requiredMoisture : 0.3f);
            bool rainWatered = WeatherSystem.Instance != null && WeatherSystem.Instance.IsRaining();
            bool gotWater = rainWatered || tileIsWet || (data != null && !data.needsWater);

            if (gotWater)
            {
                dryStreak = 0;
                wateredDays++;
            }
            else
            {
                dryStreak++;
            }

            // --- Cây héo dần rồi chết nếu không được tưới ---
            if (dryStreak >= data.dryDaysBeforeWither + data.witherDaysBeforeDeath)
            {
                Die();
                return;
            }

            bool withering = dryStreak >= data.dryDaysBeforeWither;
            if (withering)
            {
                SetStage(GrowthStage.Withering);
                return;
            }

            // --- Mùa Đông làm cây ngoài trời chết (trừ cây chịu lạnh / nhà kính) ---
            if (season == Season.Winter
                && !data.survivesWinterOutdoor
                && (tile == null || !tile.isGreenhouse))
            {
                Die();
                return;
            }

            // --- Thời tiết làm gãy cây (bão/tuyết) ---
            if (WeatherSystem.Instance != null)
            {
                float breakChance = WeatherSystem.Instance.GetProfile(WeatherSystem.Instance.Today).cropBreakChance;
                if (breakChance > 0f && UnityEngine.Random.value < breakChance)
                {
                    Die();
                    return;
                }
            }

            // --- Lớn lên theo số ngày ẩm tích luỹ ---
            int targetStageIndex = data.StageFromDays(wateredDays);
            GrowthStage target = (GrowthStage)targetStageIndex;
            if (target != stage)
            {
                if (target == GrowthStage.Fruiting)
                    RollQuality();
                SetStage(target);
            }
            else if (stage == GrowthStage.Fruiting)
            {
                UpdateReadyFeedback();  // vẫn còn quả -> tiếp tục hiệu ứng nhấp nháy
            }
        }

        private void HandleSeasonChanged(Season newSeason)
        {
            if (isDead) return;
            if (newSeason == Season.Winter && !data.survivesWinterOutdoor && (tile == null || !tile.isGreenhouse))
                Die();
        }

        private void HandleWeatherChanged(WeatherType now, WeatherType before) { /* dành cho VFX mưa/bão nếu cần */ }

        // =================================================================
        //  CHUYỂN GIAI ĐOẠN (ĐỔI MODEL 3D)
        // =================================================================

        private void SetStage(GrowthStage newStage)
        {
            if (stage == newStage) return;
            stage = newStage;
            ApplyStageImmediately(stage);
            OnStageChanged?.Invoke(this, stage);
        }

        /// <summary>Bật đúng 1 trong 4 model giai đoạn (đổi mô hình 3D).</summary>
        private void ApplyStageImmediately(GrowthStage targetStage)
        {
            EnsureVisuals();

            int index = Mathf.Clamp((int)targetStage, 0, 3);

            // Héo/chết: dùng model giai đoạn cuối đã có nhưng đổi màu, hoặc ẩn hết nếu chết hẳn
            bool deadOrWithering = targetStage == GrowthStage.Withering || targetStage == GrowthStage.Dead;

            for (int i = 0; i < runtimeVisuals.Length; i++)
            {
                if (runtimeVisuals[i] == null) continue;
                bool active = deadOrWithering ? (i == Mathf.Clamp((int)GrowthStage.Mature, 0, 3) && targetStage == GrowthStage.Withering)
                                              : (i == index);
                runtimeVisuals[i].SetActive(active);
            }

            if (deadOrWithering)
                ApplyWitherColor(targetStage == GrowthStage.Dead);

            if (animator != null)
                animator.SetInteger(animStageParam, index);

            if (IsRipe)
                UpdateReadyFeedback();
        }

        /// <summary>Tạo/cập nhật 4 model con từ stageVisuals hoặc từ CropData.stagePrefabs.</summary>
        private void EnsureVisuals()
        {
            Transform root = visualRoot != null ? visualRoot : transform;

            for (int i = 0; i < 4; i++)
            {
                if (runtimeVisuals[i] != null) continue;

                // a) Ưu tiên model đã gán trực tiếp trong Inspector
                if (stageVisuals != null && stageVisuals.Length > i && stageVisuals[i] != null)
                {
                    runtimeVisuals[i] = stageVisuals[i];
                    runtimeVisuals[i].SetActive(false);
                    continue;
                }

                // b) Nếu không có, tự tạo từ CropData.stagePrefabs
                if (data != null && data.stagePrefabs != null && data.stagePrefabs.Length > i && data.stagePrefabs[i] != null)
                {
                    GameObject go = Instantiate(data.stagePrefabs[i], root);
                    go.transform.localPosition = Vector3.zero;
                    go.transform.localRotation = Quaternion.identity;
                    go.name = $"Stage{i}_{data.cropId}";
                    runtimeVisuals[i] = go;
                    go.SetActive(false);
                    continue;
                }

                // c) Nếu CropData chỉ có Mesh (tối ưu), tạo GameObject + MeshFilter
                if (data != null && data.stageMeshes != null && data.stageMeshes.Length > i && data.stageMeshes[i] != null)
                {
                    GameObject go = new GameObject($"Stage{i}_{data.cropId}");
                    go.transform.SetParent(root, false);
                    var mf = go.AddComponent<MeshFilter>();
                    mf.sharedMesh = data.stageMeshes[i];
                    go.AddComponent<MeshRenderer>();
                    runtimeVisuals[i] = go;
                    go.SetActive(false);
                }
            }
        }

        private void ApplyWitherColor(bool dead)
        {
            Color tint = dead ? new Color(0.35f, 0.28f, 0.2f) : new Color(0.75f, 0.65f, 0.35f);
            foreach (var go in runtimeVisuals)
            {
                if (go == null) continue;
                var renderers = go.GetComponentsInChildren<Renderer>();
                foreach (var r in renderers)
                {
                    var mpb = new MaterialPropertyBlock();
                    r.GetPropertyBlock(mpb);
                    mpb.SetColor("_BaseColor", tint); // URP: _BaseColor; Built-in: _Color
                    mpb.SetColor("_Color", tint);
                    r.SetPropertyBlock(mpb);
                }
            }
        }

        /// <summary>Hiệu ứng "cây đã chín": nhấp nháy nhẹ + particle lấp lánh.</summary>
        private void UpdateReadyFeedback()
        {
            var pulse = GetComponent<ReadyPulse>();
            if (pulse != null) pulse.SetQuality(quality);
        }

        // =================================================================
        //  PHẨM CHẤT
        // =================================================================

        private void RollQuality()
        {
            float nutrientBonus = tile != null ? (tile.nutrients - 0.5f) * 0.4f : 0f;
            bool rainbowDay = WeatherSystem.Instance != null && WeatherSystem.Instance.Today == WeatherType.Rainbow;
            bool rested = TimeManager.Instance != null && TimeManager.Instance.wellRestedBuff;

            float roll = UnityEngine.Random.value + nutrientBonus + (hasFertilizer ? 0.15f : 0f) + (rainbowDay ? 0.25f : 0f) + (rested ? 0.05f : 0f);

            if (roll >= 1.0f - data.rainbowChance) quality = CropQuality.Rainbow;
            else if (roll >= 0.85f - data.goldChance) quality = CropQuality.Gold;
            else if (roll >= 0.60f - data.silverChance) quality = CropQuality.Silver;
            else quality = CropQuality.Normal;
        }

        public void ApplyFertilizer() => hasFertilizer = true;

        // =================================================================
        //  THU HOẠCH — NHẢ LOOT
        // =================================================================

        /// <summary>Thu hoạch cây. Trả về số lượng nông sản đã nhả ra (0 nếu thất bại).</summary>
        public int Harvest()
        {
            if (!IsRipe)
            {
                Debug.Log($"[Crop] {data?.displayName} chưa chín (giai đoạn {stage}).");
                return 0;
            }

            int amount = UnityEngine.Random.Range(data.minYield, data.maxYield + 1);
            if (quality == CropQuality.Rainbow) amount += 1;

            // ---- 1) Sinh loot ----
            if (data.harvestItem != null && LootSpawner.Instance != null)
                LootSpawner.Instance.SpawnLoot(data.harvestItem, amount, lootOrigin.position, quality, transform.forward);
            else if (data.harvestItem != null)
                Inventory.Instance?.Add(data.harvestItem, amount, quality); // fallback nếu không có LootSpawner

            // ---- 2) VFX + âm thanh ----
            if (data.harvestVfxPrefab != null)
                Instantiate(data.harvestVfxPrefab, lootOrigin.position, Quaternion.identity);
            if (AudioManager.Instance != null)
                AudioManager.Instance.PlayHarvest(data.cropId);

            // ---- 3) Cộng XP / thành tích ----
            if (PlayerStats.Instance != null)
                PlayerStats.Instance.AddFarmingXp(data.farmingXp);
            if (tile != null)
                tile.nutrients = Mathf.Clamp01(tile.nutrients - tile.nutrientLossPerHarvest);

            OnHarvested?.Invoke(this, amount);

            // ---- 4) Cây tái sinh hoặc kết thúc vòng đời ----
            if (data.regrows)
            {
                // Quay lại giai đoạn Mature và cần đúng regrowDays ngày ẩm để chín lại
                int matureThreshold = data.CumulativeDays(3);
                wateredDays = matureThreshold - Mathf.Max(1, data.daysPerStage[3]);
                quality = CropQuality.Normal;
                isDead = false;
                SetStage(GrowthStage.Mature);
            }
            else
            {
                if (tile != null) tile.ClearCrop(keepTilled: true, consumeNutrients: false);
                else Destroy(gameObject);
            }

            return amount;
        }

        private void Die()
        {
            isDead = true;
            stage = GrowthStage.Dead;
            ApplyStageImmediately(GrowthStage.Dead);
            ApplyWitherColor(true);
            if (data != null && data.regrows) { /* cây tái sinh cũng chết hẳn */ }

            // Cây chết sẽ bị ẩn model và chỉ còn "gốc khô" để người chơi cuốc bỏ
            foreach (var go in runtimeVisuals) if (go != null) go.SetActive(true);
            ApplyWitherColor(true);
        }

        /// <summary>Dọn xác cây chết (dùng cuốc).</summary>
        public void ClearDead()
        {
            if (tile != null) tile.ClearCrop(keepTilled: true);
            else Destroy(gameObject);
        }

        // =================================================================
        //  IInteractable — BẤM PHÍM E
        // =================================================================

        public Transform InteractTransform => transform;

        public string GetPrompt(PlayerInteractor player)
        {
            if (isDead) return "[E] Dọn cây chết (cần Cuốc)";

            if (IsRipe)
                return $"[E] Thu hoạch {data.displayName} {QualityUtil.Suffix(quality)}";

            if (IsThirsty())
                return "[E] Tưới nước";

            return $"{data.displayName} — {StageName(stage)} (còn {DaysLeftToRipe()} ngày)";
        }

        public bool CanInteract(PlayerInteractor player) => true;

        public void Interact(PlayerInteractor player)
        {
            if (isDead)
            {
                if (player.CurrentTool == ToolType.Hoe) ClearDead();
                else player.ShowToast("Cần Cuốc để dọn cây chết");
                return;
            }

            // 1) Cây chín -> thu hoạch (không cần công cụ, hoặc cần Liềm nếu là cây hạt)
            if (IsRipe)
            {
                int got = Harvest();
                if (got > 0) player.ShowToast($"Thu hoạch +{got} {data.harvestItem?.displayName ?? data.displayName}");
                return;
            }

            // 2) Cây thiếu nước -> tưới
            if (IsThirsty())
            {
                if (player.CurrentTool != ToolType.WateringCan && player.CurrentTool != ToolType.None)
                {
                    player.ShowToast("Hãy chọn Bình tưới (phím 2)");
                    return;
                }
                if (!player.ConsumeWater())
                {
                    player.ShowToast("Bình đã hết nước");
                    return;
                }
                tile?.Water();
                player.ShowToast($"Đã tưới {data.displayName}");
                return;
            }

            // 3) Bình thường -> chỉ thông báo trạng thái
            player.ShowToast($"{data.displayName}: {StageName(stage)} — còn {DaysLeftToRipe()} ngày nữa chín");
        }

        // =================================================================
        //  TIỆN ÍCH
        // =================================================================

        /// <summary>Cây có đang thiếu nước không (đất khô & chưa mưa & cây cần nước)?</summary>
        public bool IsThirsty()
        {
            if (data == null || !data.needsWater) return false;
            if (WeatherSystem.Instance != null && WeatherSystem.Instance.IsRaining()) return false;
            return tile != null && tile.moisture < data.requiredMoisture;
        }

        public int DaysLeftToRipe()
        {
            if (data == null) return 0;
            int need = data.CumulativeDays(3);
            return Mathf.Max(0, need - wateredDays);
        }

        public string StageName(GrowthStage s)
        {
            switch (s)
            {
                case GrowthStage.Seed: return "Hạt giống";
                case GrowthStage.Sprout: return "Mầm";
                case GrowthStage.Mature: return "Trưởng thành";
                case GrowthStage.Fruiting: return "Đã chín";
                case GrowthStage.Withering: return "Héo (cần nước!)";
                default: return "Đã chết";
            }
        }

        // =================================================================
        //  LƯU / TẢI
        // =================================================================
        [Serializable]
        public struct CropSave
        {
            public string cropId;
            public int wateredDays;
            public int stageIndex;
            public int qualityIndex;
            public bool dead;
            public bool fertilized;
        }

        public CropSave GetSave()
        {
            return new CropSave
            {
                cropId = data != null ? data.cropId : "",
                wateredDays = wateredDays,
                stageIndex = (int)stage,
                qualityIndex = (int)quality,
                dead = isDead,
                fertilized = hasFertilizer
            };
        }

        public void LoadSave(CropSave save, CropData cropData, FarmTile ownerTile, Season season)
        {
            data = cropData;
            tile = ownerTile;
            wateredDays = save.wateredDays;
            quality = (CropQuality)save.qualityIndex;
            hasFertilizer = save.fertilized;
            isDead = save.dead;
            HookTimeEvents();
            EnsureVisuals();
            stage = (GrowthStage)save.stageIndex;
            ApplyStageImmediately(stage);
        }
    }
}
