// ============================================================================
//  CropData.cs — ScriptableObject: "công thức" của một loại cây trồng
//  Đặt tại: Assets/Scripts/Data/
//  Tạo asset: Chuột phải trong Project > Create > Vườn Mơ > Crop Data
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
        public Sprite icon;

        [Header("4 MODEL 3D THEO GIAI ĐOẠN (Seed → Sprout → Mature → Fruiting)")]
        [Tooltip("Đúng 4 phần tử. Prefab chứa MeshFilter/MeshRenderer của model tương ứng.")]
        public GameObject[] stagePrefabs = new GameObject[4];

        [Tooltip("Tuỳ chọn: nếu chỉ muốn đổi Mesh (nhẹ hơn Prefab). Được ưu tiên nếu có phần tử.")]
        public Mesh[] stageMeshes = new Mesh[4];

        [Header("Thời gian sinh trưởng (tính theo NGÀY GAME có nước)")]
        [Tooltip("Số ngày để đi từ: Seed→Sprout, Sprout→Mature, Mature→Fruiting, Fruiting→(regrow lần sau)")]
        public int[] daysPerStage = new int[] { 1, 2, 3, 2 };

        [Header("Điều kiện sinh trưởng")]
        public bool needsWater = true;
        [Tooltip("Độ ẩm tối thiểu của đất để tính là 'có nước' trong ngày.")]
        [Range(0f, 1f)] public float requiredMoisture = 0.3f;
        [Tooltip("Số ngày khô liên tiếp thì cây héo.")]
        public int dryDaysBeforeWither = 2;
        [Tooltip("Số ngày héo thêm thì cây chết (chỉ được cuốc bỏ).")]
        public int witherDaysBeforeDeath = 3;
        [Tooltip("Mùa có thể trồng. Để trống = quanh năm.")]
        public Season[] allowedSeasons = new Season[0];
        [Tooltip("Có sống được qua mùa Đông khi ở ngoài trời không?")]
        public bool survivesWinterOutdoor = false;

        [Header("Thu hoạch")]
        public ItemData harvestItem;
        public int minYield = 1;
        public int maxYield = 3;
        [Tooltip("Cây tái sinh (cà chua, nho...): sau thu hoạch quay lại giai đoạn 3.")]
        public bool regrows = true;

        [Header("Xác suất phẩm chất cơ bản (0–1)")]
        [Range(0f, 1f)] public float silverChance = 0.30f;
        [Range(0f, 1f)] public float goldChance = 0.12f;
        [Range(0f, 1f)] public float rainbowChance = 0.01f;

        [Header("Kinh tế")]
        public int seedPrice = 45;
        public int baseSellPrice = 55;
        public int farmingXp = 8;

        [Header("Hình ảnh phụ trợ")]
        [Tooltip("Prefab hiệu ứng khi thu hoạch (bụi, lá bay...).")]
        public GameObject harvestVfxPrefab;

        /// <summary>Tổng số ngày ẩm để cây chín (không tính regrow).</summary>
        public int TotalDaysToRipe => daysPerStage[0] + daysPerStage[1] + daysPerStage[2];

        /// <summary>Mốc tích luỹ: cumulative[i] = số ngày ẩm cần để đạt giai đoạn i.</summary>
        public int CumulativeDays(int stageIndex)
        {
            int sum = 0;
            for (int i = 0; i < stageIndex && i < daysPerStage.Length; i++) sum += daysPerStage[i];
            return sum;
        }

        /// <summary>Trả về giai đoạn (0–3) tương ứng với số ngày ẩm đã tích luỹ.</summary>
        public int StageFromDays(int wateredDays)
        {
            if (wateredDays >= CumulativeDays(3)) return 3; // Fruiting
            if (wateredDays >= CumulativeDays(2)) return 2; // Mature
            if (wateredDays >= CumulativeDays(1)) return 1; // Sprout
            return 0;                                       // Seed
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
            if (stagePrefabs == null || stagePrefabs.Length != 4) System.Array.Resize(ref stagePrefabs, 4);
            if (stageMeshes == null || stageMeshes.Length != 4) System.Array.Resize(ref stageMeshes, 4);
        }
    }

    // -------------------------------------------------------------------------
    //  ItemData.cs — dữ liệu vật phẩm (nông sản, hạt giống, loot)
    // -------------------------------------------------------------------------
    [CreateAssetMenu(fileName = "Item_New", menuName = "Vườn Mơ/Item Data", order = 1)]
    public class ItemData : ScriptableObject
    {
        public string itemId = "tomato";
        public string displayName = "Cà chua";
        public Sprite icon;
        [TextArea] public string description;

        public ItemCategory category = ItemCategory.Produce;
        public int baseSellPrice = 55;
        public int maxStack = 99;

        [Header("Hiển thị trong thế giới 3D (dùng khi rơi loot)")]
        public GameObject worldPrefab;
        [Tooltip("Nhấp nhô & xoay khi nằm dưới đất.")]
        public bool floatsInWorld = true;
        [Tooltip("Nhặt tự động khi ở gần (không cần bấm E).")]
        public bool autoPickup = false;
    }

    public enum ItemCategory
    {
        Produce,    // Nông sản
        Seed,       // Hạt giống
        Tool,       // Công cụ
        Animal,     // Sản phẩm gia súc
        Artisan,    // Đồ chế biến
        Forage,     // Hái lượm
        Fish,       // Cá
        Material,   // Nguyên liệu (gỗ, đá)
        Decor       // Trang trí
    }
}
