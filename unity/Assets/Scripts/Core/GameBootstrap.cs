// ============================================================================
//  GameBootstrap.cs — "Dây nối" mọi hệ thống khi vào game
//  Đặt tại: Assets/Scripts/Core/
//  Gắn vào: GameObject "GameManagers" (chạy sau PixelArtGlobal, trước mọi thứ khác)
//
//  Nhiệm vụ:
//   · Gán 4 SeasonTheme vào FarmGrid, WeatherFX2D, DayNightTint2D
//   · Gán CropDatabase / ItemDatabase vào các singleton
//   · Bắt đầu ván mới (tặng đồ khởi đầu) hoặc tải save
//   · Đặt thời tiết & mùa ban đầu cho đúng với ngày hiện tại
// ============================================================================
using UnityEngine;
using VuonMo.Data;
using VuonMo.Farming;
using VuonMo.InventorySystem;
using VuonMo.SaveSystem;

namespace VuonMo.Core
{
    [DefaultExecutionOrder(-450)]
    public class GameBootstrap : MonoBehaviour
    {
        [Header("Bốn theme theo mùa (Xuân, Hạ, Thu, Đông)")]
        public SeasonTheme springTheme;
        public SeasonTheme summerTheme;
        public SeasonTheme fallTheme;
        public SeasonTheme winterTheme;

        [Header("Cơ sở dữ liệu")]
        public CropDatabase cropDatabase;
        public ItemDatabase itemDatabase;

        [Header("Bắt đầu ván chơi")]
        [Tooltip("Slot save cần tải. Đặt −1 để bắt đầu ván mới.")]
        public int loadSlot = -1;

        [Tooltip("Tặng đồ khi bắt đầu ván mới.")]
        public bool giveStarterItems = true;
        public ItemData[] starterItems;        // ví dụ: 3 hạt cà chua, 1 cuốc...
        public int starterGold = 500;

        [Header("Tham chiếu hệ thống")]
        public FarmGrid farmGrid;

        private void Awake()
        {
            ApplyDatabases();
            ApplySeasonThemes();
            ApplySaveOrNewGame();
        }

        // ------------------------------------------------------------------
        private void ApplyDatabases()
        {
            // CropDatabase/ItemDatabase tự đăng ký trong OnEnable của chúng,
            // nhưng nếu chưa nạp (chưa được tham chiếu ở đâu) thì gán ở đây cho chắc.
            if (cropDatabase != null && CropDatabase.Instance == null) CropDatabase.Instance = cropDatabase;
            if (itemDatabase != null && ItemDatabase.Instance == null) ItemDatabase.Instance = itemDatabase;
        }

        private void ApplySeasonThemes()
        {
            var themes = new SeasonTheme?[] { springTheme, summerTheme, fallTheme, winterTheme };
            var list = new System.Collections.Generic.List<SeasonTheme>();
            foreach (var t in themes) if (t != null) list.Add(t);
            if (list.Count == 0) return;

            if (farmGrid == null) farmGrid = FindFirstObjectByType<FarmGrid>();
            farmGrid?.SetThemes(list.ToArray());

            // Gán cho các hệ thống hình ảnh (nếu có trong scene)
            foreach (var fx in FindObjectsByType<WeatherVisual.WeatherFX2D>(FindObjectsSortMode.None))
                fx.themes = list.ToArray();

            foreach (var tint in FindObjectsByType<DayNightTint2D>(FindObjectsSortMode.None))
                tint.themes = list.ToArray();
        }

        private void ApplySaveOrNewGame()
        {
            bool loaded = false;

            if (loadSlot >= 0 && SaveSystem.SaveSystem.HasSave(loadSlot))
                loaded = SaveSystem.SaveSystem.Load(loadSlot, cropDatabase);

            if (!loaded) StartNewGame();

            // Áp lại mùa/thời tiết hiện tại cho hình ảnh
            if (farmGrid != null && TimeManager.Instance != null)
                farmGrid.ApplySeasonTheme(TimeManager.Instance.CurrentSeason);

            if (WeatherSystem.Instance != null)
                WeatherSystem.Instance.ForceWeather(WeatherSystem.Instance.Today);
        }

        private void StartNewGame()
        {
            if (!giveStarterItems) return;

            if (Inventory.Instance != null)
            {
                if (starterGold > 0) Inventory.Instance.AddGold(starterGold);
                foreach (var item in starterItems)
                    if (item != null) Inventory.Instance.Add(item, 1);
            }

            FloatingText.Instance?.ShowToast("Chào mừng tới Vườn Mơ!");
        }
    }
}
