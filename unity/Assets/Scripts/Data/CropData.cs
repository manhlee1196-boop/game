// ============================================================================
//  CropData.cs — ScriptableObject "công thức" của một loại cây trồng (bản 2D PIXEL)
//  Đặt tại: Assets/Scripts/Data/
//  Tạo asset: Chuột phải trong Project > Create > Vườn Mơ > Crop Data
//
//  Khác bản 3D: thay vì 4 prefab model, mỗi giai đoạn là 1 SPRITE 16×16 (hoặc 16×32).
// ============================================================================
using UnityEngine;
using VuonMo.Core;

namespace VuonMo.Data
{
    [CreateAssetMenu(fileName = "Crop_New", menuName = "Vườn Mơ/Crop Data", order = 0)]
    public class CropData : ScriptableObject
    {
        [Header("Định danh")]
        public string cropId = "tomato";
        public string displayName = "Cà chua";
        public Sprite icon;                       // icon túi đồ 16×16

        [Header("SPRITE THEO 4 GIAI ĐOẠN (Hạt → Mầm → Trưởng thành → Có quả)")]
        [Tooltip("Đúng 4 phần tử. Kích thước khuyến nghị: 16×16 (cây thấp) hoặc 16×32 (ngô, nho).")]
        public Sprite[] stageSprites = new Sprite[4];

        [Header("Sprite trạng thái xấu")]
        public Sprite witheringSprite;             // héo (nâu khô)
        public Sprite deadSprite;                  // chết (gốc khô)

        [Header("Sản phẩm thu hoạch (sprite rơi trên đất)")]
        public Sprite harvestSprite;
        public Sprite harvestSpriteSilver;
        public Sprite harvestSpriteGold;

        [Header("Thời gian sinh trưởng (theo NGÀY GAME có nước)")]
        [Tooltip("Seed→Sprout, Sprout→Mature, Mature→Fruiting, Fruiting→(regrow lần sau)")]
        public int[] daysPerStage = new int[] { 1, 2, 3, 2 };

        [Header("Điều kiện sinh trưởng")]
        public bool needsWater = true;
        [Range(0f, 1f)] public float requiredMoisture = 0.3f;
        public int dryDaysBeforeWither = 2;
        public int witherDaysBeforeDeath = 3;
        [Tooltip("Mùa trồng được. Để trống = quanh năm.")]
        public Season[] allowedSeasons = new Season[0];
        public bool survivesWinterOutdoor = false;

        [Header("Thu hoạch")]
        public ItemData harvestItem;
        public int minYield = 1;
        public int maxYield = 3;
        [Tooltip("Cây tái sinh (cà chua, nho...): sau thu hoạch về lại giai đoạn Trưởng thành.")]
        public bool regrows = true;

        [Header("Xác suất phẩm chất (0–1)")]
        [Range(0f, 1f)] public float silverChance = 0.30f;
        [Range(0f, 1f)] public float goldChance = 0.12f;
        [Range(0f, 1f)] public float rainbowChance = 0.01f;

        [Header("Kinh tế & cảm giác")]
        public int seedPrice = 45;
        public int baseSellPrice = 55;
        public int farmingXp = 8;
        [Tooltip("Cây nhấp nháy khi chín (animation pixel 2 khung).")]
        public bool blinkWhenRipe = true;
        [Tooltip("Prefab hiệu ứng pixel khi thu hoạch (lá bay, bụi).")]
        public GameObject harvestVfxPrefab;

        // ------------------------------------------------------------------
        public int TotalDaysToRipe => daysPerStage[0] + daysPerStage[1] + daysPerStage[2];

        public int CumulativeDays(int stageIndex)
        {
            int sum = 0;
            for (int i = 0; i < stageIndex && i < daysPerStage.Length; i++) sum += daysPerStage[i];
            return sum;
        }

        public int StageFromDays(int wateredDays)
        {
            if (wateredDays >= CumulativeDays(3)) return 3;
            if (wateredDays >= CumulativeDays(2)) return 2;
            if (wateredDays >= CumulativeDays(1)) return 1;
            return 0;
        }

        public Sprite GetStageSprite(int stageIndex)
        {
            if (stageSprites == null || stageSprites.Length == 0) return null;
            return stageSprites[Mathf.Clamp(stageIndex, 0, stageSprites.Length - 1)];
        }

        /// <summary>Sprite theo phẩm chất — dùng khi vẽ loot rơi trên đất.</summary>
        public Sprite GetHarvestSprite(CropQuality quality)
        {
            switch (quality)
            {
                case CropQuality.Gold:
                case CropQuality.Rainbow:
                    return harvestSpriteGold != null ? harvestSpriteGold : harvestSprite;
                case CropQuality.Silver:
                    return harvestSpriteSilver != null ? harvestSpriteSilver : harvestSprite;
                default:
                    return harvestSprite;
            }
        }

        public bool CanPlantInSeason(Season s)
        {
            if (allowedSeasons == null || allowedSeasons.Length == 0) return true;
            foreach (var season in allowedSeasons) if (season == s) return true;
            return false;
        }

        private void OnValidate()
        {
            if (daysPerStage == null || daysPerStage.Length < 4)
            {
                int[] fixedArr = new int[4];
                for (int i = 0; i < 4; i++)
                    fixedArr[i] = (daysPerStage != null && i < daysPerStage.Length) ? daysPerStage[i] : 1;
                daysPerStage = fixedArr;
            }
            if (stageSprites == null || stageSprites.Length != 4) System.Array.Resize(ref stageSprites, 4);
        }
    }
}
