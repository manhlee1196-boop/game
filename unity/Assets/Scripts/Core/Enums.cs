// ============================================================================
//  Enums.cs — Kiểu dữ liệu dùng chung (bản 2D PIXEL)
//  Đặt tại: Assets/Scripts/Core/
// ============================================================================
namespace VuonMo.Core
{
    /// <summary>4 hướng nhân vật (pixel art dùng 4 hướng sprite, di chuyển 8 hướng).</summary>
    public enum Direction
    {
        Down = 0,
        Left = 1,
        Right = 2,
        Up = 3
    }

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
        Sunny = 0,
        Cloudy = 1,
        Rain = 2,
        Storm = 3,
        Snow = 4,
        Fog = 5,
        Rainbow = 6,
        MeteorShower = 7
    }

    /// <summary>4 giai đoạn sinh trưởng + 2 trạng thái xấu (mỗi giai đoạn = 1 sprite).</summary>
    public enum GrowthStage
    {
        Seed = 0,
        Sprout = 1,
        Mature = 2,
        Fruiting = 3,
        Withering = 4,
        Dead = 5
    }

    /// <summary>Công cụ người chơi có thể chọn (hotbar).</summary>
    public enum ToolType
    {
        None = 0,
        Hoe = 1,
        WateringCan = 2,
        Sickle = 3,
        Axe = 4,
        Pickaxe = 5,
        FishingRod = 6,
        SeedBag = 7
    }

    /// <summary>Hạng chất lượng nông sản -> nhân giá.</summary>
    public enum CropQuality
    {
        Normal = 0,
        Silver = 1,
        Gold = 2,
        Rainbow = 3
    }

    /// <summary>Trạng thái ô đất trên lưới.</summary>
    public enum TileState
    {
        Grass = 0,
        Tilled = 1,
        Planted = 2,
        Blocked = 3
    }

    public static class QualityUtil
    {
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

        /// <summary>Hậu tố hiển thị trên HUD pixel (dùng icon ngôi sao 8×8 trong game).</summary>
        public static string Suffix(CropQuality q)
        {
            switch (q)
            {
                case CropQuality.Silver: return "*";
                case CropQuality.Gold: return "**";
                case CropQuality.Rainbow: return "***";
                default: return "";
            }
        }
    }

    public static class DirectionUtil
    {
        /// <summary>Vector đơn vị trên lưới (ô 1×1 world unit).</summary>
        public static UnityEngine.Vector2Int ToCell(Direction d)
        {
            switch (d)
            {
                case Direction.Up: return new UnityEngine.Vector2Int(0, 1);
                case Direction.Left: return new UnityEngine.Vector2Int(-1, 0);
                case Direction.Right: return new UnityEngine.Vector2Int(1, 0);
                default: return new UnityEngine.Vector2Int(0, -1);
            }
        }

        public static UnityEngine.Vector2 ToVector(Direction d)
        {
            switch (d)
            {
                case Direction.Up: return UnityEngine.Vector2.up;
                case Direction.Left: return UnityEngine.Vector2.left;
                case Direction.Right: return UnityEngine.Vector2.right;
                default: return UnityEngine.Vector2.down;
            }
        }

        /// <summary>Chọn hướng sprite từ vector di chuyển (8 hướng -> 4 sprite, chéo vẫn dùng sprite ngang).</summary>
        public static Direction FromVector(UnityEngine.Vector2 v)
        {
            if (UnityEngine.Mathf.Abs(v.x) > UnityEngine.Mathf.Abs(v.y))
                return v.x > 0f ? Direction.Right : Direction.Left;
            return v.y > 0f ? Direction.Up : Direction.Down;
        }
    }
}
