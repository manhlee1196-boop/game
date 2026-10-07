// ============================================================================
//  CropInstance.cs — MỘT CÂY TRỒNG 2D PIXEL
//  ---------------------------------------------------------------------------
//  · 4 giai đoạn: Hạt giống → Mầm → Trưởng thành → Có quả (4 SPRITE khác nhau)
//  · Lớn lên theo NGÀY GAME, yêu cầu nước tưới
//  · Bấm E để TƯỚI (khi khát) hoặc THU HOẠCH (khi chín)
//  · Nhả loot khi thu hoạch (sprite rơi trên đất)
//
//  Đặt tại: Assets/Scripts/Farming/
//  Gắn vào: Prefab "Crop_Base" (SpriteRenderer con tên "Visual")
// ============================================================================
using System;
using UnityEngine;
using VuonMo.Core;
using VuonMo.Data;
using VuonMo.Player;

namespace VuonMo.Farming
{
    [DisallowMultipleComponent]
    public class CropInstance : MonoBehaviour
    {
        [Header("Cấu hình cây")]
        [SerializeField] private CropData data;

        [Header("Tham chiếu (gán trong prefab)")]
        [Tooltip("SpriteRenderer sẽ hiển thị 4 giai đoạn.")]
        public SpriteRenderer visual;
        [Tooltip("Sprite 'lấp lánh' hiện khi cây đã chín (16×16, 2 khung).")]
        public SpriteRenderer ripeGlow;
        [Tooltip("Sprite bóng đổ dưới chân cây.")]
        public SpriteRenderer shadow;

        [Header("Trạng thái (Runtime)")]
        [SerializeField] private GrowthStage stage = GrowthStage.Seed;
        [SerializeField] private int wateredDays;
        [SerializeField] private int dryStreak;
        [SerializeField] private CropQuality quality = CropQuality.Normal;
        [SerializeField] private bool isDead;
        [SerializeField] private bool hasFertilizer;

        [Header("Hiệu ứng chín")]
        [Tooltip("Tần số nhấp nháy của sprite lấp lánh (Hz).")]
        public float blinkHz = 1.6f;

        private FarmGrid _grid;
        private Vector3Int _cell;
        private Season _plantedSeason;
        private bool _hooked;
        private float _blinkTimer;
        private bool _blinkOn;

        public CropData Data => data;
        public GrowthStage Stage => stage;
        public CropQuality Quality => quality;
        public bool IsRipe => stage == GrowthStage.Fruiting && !isDead;
        public bool IsDead => isDead;
        public int WateredDays => wateredDays;
        public Vector3Int Cell => _cell;

        public event Action<CropInstance, GrowthStage> OnStageChanged;
        public event Action<CropInstance, int> OnHarvested;

        // ==================================================================
        private void Awake()
        {
            if (visual == null) visual = GetComponentInChildren<SpriteRenderer>();
            if (ripeGlow != null) ripeGlow.enabled = false;
        }

        private void Start()
        {
            if (data != null)
            {
                ApplyStageVisual(stage);
                HookEvents();
            }
        }

        /// <summary>Khởi tạo khi gieo hạt hoặc khi load save.</summary>
        public void Initialize(CropData cropData, FarmGrid grid, Vector3Int cell, Season season,
                               int startingWateredDays = 0, CropQuality startQuality = CropQuality.Normal)
        {
            data = cropData;
            _grid = grid;
            _cell = cell;
            _plantedSeason = season;
            wateredDays = startingWateredDays;
            quality = startQuality;
            isDead = false;

            HookEvents();
            ApplyStageVisual(data.StageFromDays(wateredDays));
        }

        private void HookEvents()
        {
            if (_hooked || TimeManager.Instance == null) return;
            TimeManager.Instance.OnDayChanged += HandleNewDay;
            TimeManager.Instance.OnSeasonChanged += HandleSeasonChanged;
            _hooked = true;
        }

        private void OnDestroy()
        {
            if (_hooked && TimeManager.Instance != null)
            {
                TimeManager.Instance.OnDayChanged -= HandleNewDay;
                TimeManager.Instance.OnSeasonChanged -= HandleSeasonChanged;
            }
            if (_grid != null) _grid.NotifyCropRemoved(_cell, this);
        }

        // ==================================================================
        //  SINH TRƯỞNG — chạy 1 lần mỗi NGÀY GAME
        // ==================================================================
        private void HandleNewDay(int dayIndex, Season season)
        {
            if (isDead || data == null) return;

            bool raining = WeatherSystem.Instance != null && WeatherSystem.Instance.IsRaining();
            float moisture = _grid != null ? _grid.GetMoisture(_cell) : 0f;
            bool tileWet = moisture >= data.requiredMoisture;
            bool gotWater = !data.needsWater || raining || tileWet;

            if (gotWater) { dryStreak = 0; wateredDays++; }
            else dryStreak++;

            // 1) Khô hạn kéo dài -> chết
            if (dryStreak >= data.dryDaysBeforeWither + data.witherDaysBeforeDeath) { Die(); return; }

            // 2) Khô hạn -> héo (vẫn cứu được nếu tưới lại)
            if (dryStreak >= data.dryDaysBeforeWither) { SetStage(GrowthStage.Withering); return; }

            // 3) Mùa Đông giết cây ngoài trời
            if (season == Season.Winter && !data.survivesWinterOutdoor)
            {
                var t = _grid != null ? _grid.GetTile(_cell) : null;
                bool greenhouse = t.HasValue && t.Value.isGreenhouse;
                if (!greenhouse) { Die(); return; }
            }

            // 4) Bão/tuyết làm gãy cây
            if (WeatherSystem.Instance != null)
            {
                float breakChance = WeatherSystem.Instance.GetProfile(WeatherSystem.Instance.Today).cropBreakChance;
                if (breakChance > 0f && UnityEngine.Random.value < breakChance) { Die(); return; }
            }

            // 5) Lớn lên theo số ngày ẩm tích luỹ
            int targetIndex = data.StageFromDays(wateredDays);
            var target = (GrowthStage)targetIndex;
            if (target != stage)
            {
                if (target == GrowthStage.Fruiting) RollQuality();
                SetStage(target);
            }
        }

        private void HandleSeasonChanged(Season newSeason)
        {
            if (isDead || data == null) return;
            if (newSeason != Season.Winter || data.survivesWinterOutdoor) return;

            var t = _grid != null ? _grid.GetTile(_cell) : null;
            if (!(t.HasValue && t.Value.isGreenhouse)) Die();
        }

        // ==================================================================
        //  ĐỔI SPRITE THEO GIAI ĐOẠN
        // ==================================================================
        private void SetStage(GrowthStage newStage)
        {
            if (stage == newStage) return;
            stage = newStage;
            ApplyStageVisual(stage);
            OnStageChanged?.Invoke(this, stage);
        }

        private void ApplyStageVisual(GrowthStage s)
        {
            if (visual == null || data == null) return;

            switch (s)
            {
                case GrowthStage.Seed:
                case GrowthStage.Sprout:
                case GrowthStage.Mature:
                case GrowthStage.Fruiting:
                    visual.sprite = data.GetStageSprite((int)s);
                    visual.color = Color.white;
                    break;
                case GrowthStage.Withering:
                    visual.sprite = data.witheringSprite != null ? data.witheringSprite : data.GetStageSprite(2);
                    visual.color = new Color(0.85f, 0.75f, 0.55f);   // ngả vàng khô
                    break;
                case GrowthStage.Dead:
                    visual.sprite = data.deadSprite != null ? data.deadSprite : data.GetStageSprite(0);
                    visual.color = new Color(0.55f, 0.45f, 0.38f);
                    break;
            }

            // Sprite cao (ngô/nho 16×32) cần neo ở chân
            if (visual.sprite != null) visual.transform.localPosition = Vector3.zero;

            if (ripeGlow != null) ripeGlow.enabled = false;
            _blinkOn = false;
        }

        private void Update()
        {
            // Nhấp nháy lấp lánh khi cây đã chín (thay cho "animation" của bản 3D)
            if (data == null || !data.blinkWhenRipe) return;
            if (ripeGlow == null) return;

            if (!IsRipe)
            {
                if (ripeGlow.enabled) ripeGlow.enabled = false;
                _blinkOn = false;
                return;
            }

            _blinkTimer += Time.deltaTime;
            float period = 1f / Mathf.Max(0.1f, blinkHz);
            if (_blinkTimer >= period * 0.5f)
            {
                _blinkTimer = 0f;
                _blinkOn = !_blinkOn;
                ripeGlow.enabled = _blinkOn;
                // Phẩm chất cao -> lấp lánh màu
                ripeGlow.color = quality == CropQuality.Rainbow ? new Color(1f, 0.6f, 1f)
                               : quality == CropQuality.Gold ? new Color(1f, 0.9f, 0.45f)
                               : quality == CropQuality.Silver ? new Color(0.85f, 0.92f, 1f)
                               : Color.white;
            }
        }

        // ==================================================================
        //  PHẨM CHẤT
        // ==================================================================
        private void RollQuality()
        {
            float nutrientBonus = (_grid != null ? _grid.GetNutrients(_cell) - 0.5f : 0f) * 0.4f;
            bool rainbowDay = WeatherSystem.Instance != null && WeatherSystem.Instance.Today == WeatherType.Rainbow;
            bool rested = TimeManager.Instance != null && TimeManager.Instance.wellRestedBuff;

            float roll = UnityEngine.Random.value + nutrientBonus
                       + (hasFertilizer ? 0.15f : 0f)
                       + (rainbowDay ? 0.25f : 0f)
                       + (rested ? 0.05f : 0f);

            if (roll >= 1.0f - data.rainbowChance) quality = CropQuality.Rainbow;
            else if (roll >= 0.85f - data.goldChance) quality = CropQuality.Gold;
            else if (roll >= 0.60f - data.silverChance) quality = CropQuality.Silver;
            else quality = CropQuality.Normal;
        }

        public void ApplyFertilizer() => hasFertilizer = true;

        // ==================================================================
        //  THU HOẠCH & NHẢ LOOT
        // ==================================================================
        public int Harvest()
        {
            if (!IsRipe || data == null) return 0;

            int amount = UnityEngine.Random.Range(data.minYield, data.maxYield + 1);
            if (quality == CropQuality.Rainbow) amount += 1;

            // 1) Nhả loot ra đất (hoặc vào túi nếu autoCollect)
            if (LootSpawner.Instance != null)
                LootSpawner.Instance.SpawnLoot(data, amount, transform.position, quality, Camera.main);
            else
            {
                for (int i = 0; i < amount; i++)
                    InventorySystem.Inventory.Instance?.Add(data.harvestItem, 1, quality);
            }

            // 2) VFX pixel
            if (data.harvestVfxPrefab != null)
                Instantiate(data.harvestVfxPrefab, transform.position + Vector3.up * 0.3f, Quaternion.identity);

            if (AudioManager.Instance != null) AudioManager.Instance.PlayHarvest(data.cropId);
            if (PlayerStats.Instance != null) PlayerStats.Instance.AddFarmingXp(data.farmingXp);

            if (_grid != null) _grid.Fertilize(_cell, -_grid.nutrientLossPerHarvest);   // trừ dinh dưỡng đất

            OnHarvested?.Invoke(this, amount);

            // 3) Cây tái sinh hoặc kết thúc
            if (data.regrows)
            {
                int matureThreshold = data.CumulativeDays(3);
                wateredDays = matureThreshold - Mathf.Max(1, data.daysPerStage[3]);
                quality = CropQuality.Normal;
                isDead = false;
                SetStage(GrowthStage.Mature);
            }
            else
            {
                _grid?.ClearCrop(_cell, keepTilled: true);
            }
            return amount;
        }

        private void Die()
        {
            isDead = true;
            stage = GrowthStage.Dead;
            ApplyStageVisual(GrowthStage.Dead);
            if (ripeGlow != null) ripeGlow.enabled = false;
        }

        /// <summary>Dọn cây chết (bằng cuốc).</summary>
        public void ClearDead()
        {
            if (_grid != null) _grid.ClearCrop(_cell, keepTilled: true);
            else Destroy(gameObject);
        }

        // ==================================================================
        //  TƯƠNG TÁC (gọi từ PlayerInteractor2D khi bấm E)
        // ==================================================================
        public string GetPrompt(PlayerInteractor2D player)
        {
            if (data == null) return "";
            if (isDead) return "[E] Dọn cây chết (cần Cuốc)";
            if (IsRipe) return $"[E] Thu hoạch {data.displayName}{QualityUtil.Suffix(quality)}";
            if (IsThirsty()) return "[E] Tưới nước";

            return $"{data.displayName} — {StageName(stage)} (còn {DaysLeftToRipe()} ngày)";
        }

        public void Interact(PlayerInteractor2D player)
        {
            if (isDead)
            {
                if (player.CurrentTool == ToolType.Hoe) ClearDead();
                else player.ShowToast("Cần Cuốc để dọn cây chết");
                return;
            }

            // 1) Cây chín -> thu hoạch
            if (IsRipe)
            {
                int got = Harvest();
                if (got > 0 && data != null)
                    player.ShowToast($"Thu hoạch +{got} {data.displayName}");
                return;
            }

            // 2) Cây khát -> tưới
            if (IsThirsty())
            {
                if (player.CurrentTool != ToolType.WateringCan && player.CurrentTool != ToolType.None)
                {
                    player.ShowToast("Hãy chọn Bình tưới (phím 2)");
                    return;
                }
                if (!player.ConsumeWater()) { player.ShowToast("Bình đã hết nước"); return; }
                _grid?.Water(_cell);
                player.ShowToast($"Đã tưới {data.displayName}");
                return;
            }

            // 3) Bình thường
            player.ShowToast($"{data.displayName}: {StageName(stage)} — còn {DaysLeftToRipe()} ngày");
        }

        // ==================================================================
        //  TIỆN ÍCH
        // ==================================================================
        public bool IsThirsty()
        {
            if (data == null || !data.needsWater) return false;
            if (WeatherSystem.Instance != null && WeatherSystem.Instance.IsRaining()) return false;
            return _grid != null && _grid.GetMoisture(_cell) < data.requiredMoisture;
        }

        public int DaysLeftToRipe()
        {
            if (data == null) return 0;
            return Mathf.Max(0, data.CumulativeDays(3) - wateredDays);
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

        // ==================================================================
        //  LƯU / TẢI
        // ==================================================================
        [Serializable]
        public struct CropSave
        {
            public string cropId;
            public int wateredDays;
            public int stageIndex;
            public int qualityIndex;
            public bool dead;
        }

        public CropSave GetSave()
        {
            return new CropSave
            {
                cropId = data != null ? data.cropId : "",
                wateredDays = wateredDays,
                stageIndex = (int)stage,
                qualityIndex = (int)quality,
                dead = isDead
            };
        }

        public void LoadSave(CropSave save, CropData cropData, FarmGrid grid, Vector3Int cell)
        {
            data = cropData;
            _grid = grid;
            _cell = cell;
            wateredDays = save.wateredDays;
            quality = (CropQuality)save.qualityIndex;
            isDead = save.dead;
            stage = (GrowthStage)save.stageIndex;

            HookEvents();
            ApplyStageVisual(stage);
        }
    }
}
