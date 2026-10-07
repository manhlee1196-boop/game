// ============================================================================
//  ItemData.cs — Dữ liệu vật phẩm (pixel sprite)
//  Đặt tại: Assets/Scripts/Data/
// ============================================================================
using UnityEngine;

namespace VuonMo.Data
{
    public enum ItemCategory
    {
        Produce,    // Nông sản
        Seed,       // Hạt giống
        Tool,       // Công cụ
        Animal,     // Sản phẩm gia súc (trứng, sữa, len)
        Artisan,    // Đồ chế biến
        Forage,     // Hái lượm
        Fish,       // Cá
        Material,   // Nguyên liệu (gỗ, đá)
        Decor       // Trang trí
    }

    [CreateAssetMenu(fileName = "Item_New", menuName = "Vườn Mơ/Item Data", order = 1)]
    public class ItemData : ScriptableObject
    {
        [Header("Định danh")]
        public string itemId = "tomato";
        public string displayName = "Cà chua";
        public Sprite icon;                        // 16×16 cho túi đồ / hotbar
        public Sprite worldSprite;                 // 16×16 sprite rơi trên đất
        [TextArea] public string description;

        [Header("Phân loại & kinh tế")]
        public ItemCategory category = ItemCategory.Produce;
        public int baseSellPrice = 55;
        public int maxStack = 99;

        [Header("Hành vi khi rơi")]
        [Tooltip("Nhấp nhô lên xuống theo nhịp 2 khung (pixel bob).")]
        public bool bobInWorld = true;
        [Tooltip("Nhặt tự động khi người chơi lại gần (không cần bấm E).")]
        public bool autoPickup = false;
        [Tooltip("Delay trước khi tự động vào túi (0 = không).")]
        public float autoCollectDelay = 0f;

        [Header("Nếu là hạt giống")]
        [Tooltip("Cây sẽ mọc khi gieo hạt này.")]
        public CropData seedOfCrop;
    }
}
