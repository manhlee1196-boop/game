// ============================================================================
//  SeasonTheme.cs — "Bảng màu + tileset + props" cho từng mùa (bản 2D PIXEL)
//  Đặt tại: Assets/Scripts/Data/
//  Tạo 4 asset: Theme_Spring, Theme_Summer, Theme_Fall, Theme_Winter
//
//  Đây là cách game đổi mùa rẻ nhất về hiệu năng trên 2D: chỉ đổi TILE + TINT,
//  không cần vẽ lại bản đồ.
// ============================================================================
using UnityEngine;
using UnityEngine.Tilemaps;
using VuonMo.Core;

namespace VuonMo.Data
{
    [CreateAssetMenu(fileName = "Theme_New", menuName = "Vườn Mơ/Season Theme", order = 2)]
    public class SeasonTheme : ScriptableObject
    {
        public Season season = Season.Spring;

        [Header("Tile nền theo mùa (Tilemap 'Ground')")]
        public TileBase grassTile;
        public TileBase grassVariantTile;
        public TileBase dirtPathTile;
        public TileBase cliffTile;

        [Header("Tile hoa/cỏ trang trí rải rác")]
        public TileBase[] scatterDecorTiles;

        [Header("Tile đất nông nghiệp (dùng chung mọi mùa, có thể khác nhau)")]
        public TileBase tilledTile;
        public TileBase wateredTile;

        [Header("Cây cối & props theo mùa")]
        public Sprite[] treeSprites;              // cây lớn 48×64 pixel
        public Sprite[] bushSprites;              // bụi 32×32
        public Sprite[] propSprites;              // thùng gỗ, đá, hàng rào...

        [Header("Ánh sáng toàn cục (Global Light 2D) theo mùa")]
        [Tooltip("Màu tint phủ toàn cảnh — tạo cảm giác mùa rõ rệt.")]
        public Color globalLightColor = Color.white;
        [Range(0f, 1f)] public float globalLightIntensity = 1f;

        [Header("Palette tham chiếu (để artist đối chiếu, 8 màu chủ đạo)")]
        public Color[] referencePalette = new Color[8];

        [Header("Màu nền trời (khi camera ở ngoài rìa bản đồ)")]
        public Color backgroundColor = new Color(0.30f, 0.35f, 0.42f);
    }
}
