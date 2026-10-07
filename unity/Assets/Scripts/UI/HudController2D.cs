// ============================================================================
//  HudController2D.cs — HUD pixel: đồng hồ, thời tiết, tiền, prompt [E],
//                       hotbar công cụ, thanh nước, toast
//  Đặt tại: Assets/Scripts/UI/
//  Gắn vào: GameObject "HUD" (Canvas)
// ============================================================================
using UnityEngine;
using UnityEngine.UI;
using VuonMo.Core;
using VuonMo.Data;
using VuonMo.InventorySystem;
using VuonMo.Player;

namespace VuonMo.UI
{
    public class HudController2D : MonoBehaviour
    {
        [Header("Thông tin thời gian")]
        public Text clockLabel;
        public Text dayLabel;
        public Text seasonLabel;
        public Text weatherLabel;
        public Image weatherIcon;
        [Tooltip("Sprite icon thời tiết theo thứ tự: Nắng, Mây, Mưa, Bão, Tuyết, Sương")]
        public Sprite[] weatherIcons = new Sprite[6];

        [Header("Tiền & chỉ số")]
        public Text goldLabel;
        public Image waterGaugeFill;         // Image type = Filled, Horizontal
        public Text waterLabel;

        [Header("Prompt tương tác")]
        public Text promptLabel;
        public GameObject promptPanel;

        [Header("Hotbar")]
        public Image[] hotbarSlots = new Image[8];
        [Tooltip("Icon công cụ theo ToolType: None, Hoe, WateringCan, Sickle, Axe, Pickaxe, FishingRod, SeedBag")]
        public Sprite[] toolIcons = new Sprite[8];
        public Sprite hotbarHighlight;
        public Color highlightColor = new Color(1f, 0.92f, 0.55f, 1f);

        [Header("Thanh XP")]
        public Image xpFill;
        public Text levelLabel;

        [Header("Toast")]
        public Text toastLabel;

        private PlayerInteractor2D _player;

        private void Start()
        {
            var playerGo = GameObject.FindGameObjectWithTag("Player");
            if (playerGo != null) _player = playerGo.GetComponent<PlayerInteractor2D>();

            // --- Đăng ký event ---
            if (TimeManager.Instance != null)
            {
                TimeManager.Instance.OnMinuteTick += _ => RefreshTime();
                TimeManager.Instance.OnDayChanged += (d, s) => RefreshTime();
                TimeManager.Instance.OnSeasonChanged += s => RefreshTime();
            }
            if (WeatherSystem.Instance != null)
                WeatherSystem.Instance.OnWeatherChanged += (now, old) => RefreshWeather();

            if (Inventory.Instance != null)
            {
                Inventory.Instance.OnGoldChanged += _ => RefreshGold();
                Inventory.Instance.OnInventoryChanged += RefreshHotbar;
            }
            if (PlayerStats.Instance != null)
            {
                PlayerStats.Instance.OnLevelUp += _ => RefreshXp();
                PlayerStats.Instance.OnXpChanged += (xp, next) => RefreshXp();
            }

            if (_player != null)
            {
                _player.OnPromptChanged += SetPrompt;
                _player.OnToolChanged += _ => RefreshHotbar();
                _player.OnSeedChanged += _ => RefreshHotbar();
                _player.OnWaterChanged += _ => RefreshWater();
            }

            // --- Vẽ lần đầu ---
            RefreshTime();
            RefreshWeather();
            RefreshGold();
            RefreshHotbar();
            RefreshWater();
            RefreshXp();
            SetPrompt("");
        }

        // ------------------------------------------------------------------
        //  THỜI GIAN
        // ------------------------------------------------------------------
        private void RefreshTime()
        {
            var tm = TimeManager.Instance;
            if (tm == null) return;

            if (clockLabel != null) clockLabel.text = tm.GetTimeString();
            if (dayLabel != null) dayLabel.text = $"Ngày {tm.DayOfSeason}";
            if (seasonLabel != null) seasonLabel.text = $"{tm.SeasonName(tm.CurrentSeason)} · Năm {tm.Year}";
        }

        // ------------------------------------------------------------------
        //  THỜI TIẾT
        // ------------------------------------------------------------------
        private void RefreshWeather()
        {
            var ws = WeatherSystem.Instance;
            if (ws == null) return;

            if (weatherLabel != null) weatherLabel.text = ws.WeatherName(ws.Today);
            if (weatherIcon != null && weatherIcons != null)
            {
                int idx = (int)ws.Today;
                if (idx >= 0 && idx < weatherIcons.Length && weatherIcons[idx] != null)
                    weatherIcon.sprite = weatherIcons[idx];
            }
        }

        // ------------------------------------------------------------------
        //  TIỀN / NƯỚC / XP
        // ------------------------------------------------------------------
        private void RefreshGold()
        {
            if (goldLabel != null && Inventory.Instance != null)
                goldLabel.text = $"{Inventory.Instance.Gold:N0} G";
        }

        private void RefreshWater()
        {
            if (_player == null) return;
            float ratio = _player.maxWaterCharges > 0 ? (float)_player.WaterCharges / _player.maxWaterCharges : 0f;

            if (waterGaugeFill != null) waterGaugeFill.fillAmount = Mathf.Clamp01(ratio);
            if (waterLabel != null) waterLabel.text = $"{_player.WaterCharges}/{_player.maxWaterCharges}";
        }

        private void RefreshXp()
        {
            if (PlayerStats.Instance == null) return;
            if (levelLabel != null) levelLabel.text = $"Lv {PlayerStats.Instance.farmingLevel}";

            if (xpFill != null)
            {
                int lvl = PlayerStats.Instance.farmingLevel;
                int[] table = PlayerStats.Instance.xpPerLevel;
                int prev = (lvl - 1 >= 0 && lvl - 1 < table.Length) ? table[lvl - 1] : 0;
                int next = (lvl < table.Length) ? table[lvl] : prev + 1000;
                xpFill.fillAmount = Mathf.InverseLerp(prev, Mathf.Max(prev + 1, next), PlayerStats.Instance.farmingXp);
            }
        }

        // ------------------------------------------------------------------
        //  PROMPT [E]
        // ------------------------------------------------------------------
        public void SetPrompt(string text)
        {
            if (promptLabel != null) promptLabel.text = text;
            if (promptPanel != null) promptPanel.SetActive(!string.IsNullOrEmpty(text));
        }

        // ------------------------------------------------------------------
        //  HOTBAR
        // ------------------------------------------------------------------
        private void RefreshHotbar()
        {
            if (_player == null || hotbarSlots == null) return;

            // Ô đang chọn = công cụ hiện tại
            int active = (int)_player.CurrentTool;

            for (int i = 0; i < hotbarSlots.Length; i++)
            {
                var slot = hotbarSlots[i];
                if (slot == null) continue;

                // Icon công cụ
                if (toolIcons != null && i < toolIcons.Length && toolIcons[i] != null)
                {
                    slot.sprite = toolIcons[i];
                    slot.color = (i == active) ? highlightColor : Color.white;
                }
                else
                {
                    slot.color = new Color(1f, 1f, 1f, 0.35f);
                }
            }

            // Nếu đang cầm túi hạt và đã chọn hạt -> hiện icon hạt ở ô cuối
            if (_player.CurrentTool == ToolType.SeedBag && _player.SelectedSeed != null &&
                hotbarSlots.Length > 7 && hotbarSlots[7] != null && _player.SelectedSeed.icon != null)
            {
                hotbarSlots[7].sprite = _player.SelectedSeed.icon;
                hotbarSlots[7].color = highlightColor;
            }
        }

        // ------------------------------------------------------------------
        //  TOAST (dự phòng nếu FloatingText không có)
        // ------------------------------------------------------------------
        public void ShowToast(string text, float duration = 2f)
        {
            if (toastLabel == null) return;
            toastLabel.text = text;
            CancelInvoke(nameof(ClearToast));
            Invoke(nameof(ClearToast), duration);
        }

        private void ClearToast() { if (toastLabel != null) toastLabel.text = ""; }
    }
}
