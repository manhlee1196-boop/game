// ============================================================================
//  Enums.cs — Các kiểu dữ liệu dùng chung cho toàn bộ game Vườn Mơ
//  Đặt tại: Assets/Scripts/Core/
// ============================================================================
namespace VuonMo.Core
{
    /// <summary>4 mùa trong năm (mỗi mùa 28 ngày).</summary>
    public enum Season
    {
        Spring = 0,
        Summer = 1,
        Fall = 2,
        Winter = 3
    }

    /// <summary>Loại thời tiết. Ảnh hưởng trực tiếp tới cây trồng & gia súc.</summary>
    public enum WeatherType
    {
        Sunny = 0,      // Nắng
        Cloudy = 1,     // Nhiều mây
        Rain = 2,       // Mưa   -> tưới cây miễn phí
        Storm = 3,      // Bão   -> có thể làm gãy cây
        Snow = 4,       // Tuyết (chỉ mùa Đông)
        Fog = 5,        // Sương mù
        Rainbow = 6,    // Cầu vồng (sau mưa)
        MeteorShower = 7// Mưa sao băng
    }

    /// <summary>4 giai đoạn sinh trưởng của cây + 2 trạng thái xấu.</summary>
    public enum GrowthStage
    {
        Seed = 0,       // Hạt giống  -> Model 1
        Sprout = 1,     // Mầm         -> Model 2
        Mature = 2,     // Trưởng thành-> Model 3
        Fruiting = 3,   // Có quả (chín)-> Model 4  => có thể thu hoạch
        Withering = 4,  // Héo (thiếu nước)
        Dead = 5        // Chết
    }

    /// <summary>Công cụ người chơi có thể chọn.</summary>
    public enum ToolType
    {
        None = 0,
        Hoe = 1,            // Cuốc
        WateringCan = 2,    // Bình tưới
        Sickle = 3,         // Liềm
        Harvester = 4,      // Máy gặt
        Axe = 5,            // Rìu
        Pickaxe = 6,        // Cuốc chim
        FishingRod = 7,     // Cần câu
        SeedBag = 8,        // Túi hạt giống
        Harvest = 9         // Tay không (hái quả)
    }

    /// <summary>Hạng chất lượng nông sản -> nhân giá.</summary>
    public enum CropQuality
    {
        Normal = 0,     // x1.0
        Silver = 1,     // x1.25
        Gold = 2,       // x1.5
        Rainbow = 3     // x2.0
    }

    /// <summary>Loại ô đất.</summary>
    public enum TileState
    {
        Grass = 0,      // Cỏ hoang
        Tilled = 1,     // Đã cuốc
        Planted = 2,    // Có cây
        Blocked = 3     // Có vật cản / công trình
    }

    public static class QualityUtil
    {
        /// <summary>Hệ số giá bán theo phẩm chất.</summary>
        public static float PriceMultiplier(CropQuality q)
        {
            switch (q)
            {
                case CropQuality.Silver: return 1.25f;
                case CropQuality.Gold: return 1.50f;
                case CropQuality.Rainbow: return 2.00f;
                default: return 1.00f;
            }
        }

        public static string Suffix(CropQuality q)
        {
            switch (q)
            {
                case CropQuality.Silver: return "★";
                case CropQuality.Gold: return "★★";
                case CropQuality.Rainbow: return "★★★";
                default: return "";
            }
        }
    }
}
