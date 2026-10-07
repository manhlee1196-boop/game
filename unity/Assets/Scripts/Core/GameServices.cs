// ============================================================================
//  GameServices.cs — Các service nhỏ dùng chung (âm thanh, UI, hiệu ứng, XP)
//  Đặt tại: Assets/Scripts/Core/
//  Gắn tất cả lên GameObject "GameManagers".
// ============================================================================
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using VuonMo.InventorySystem;

namespace VuonMo.Core
{
    // -------------------------------------------------------------------------
    //  1) ÂM THANH
    // -------------------------------------------------------------------------
    public class AudioManager : MonoBehaviour
    {
        public static AudioManager Instance { get; private set; }

        [Header("Nguồn phát")]
        public AudioSource sfxSource;
        public AudioSource musicSource;

        [Header("Clip SFX")]
        public AudioClip hoeHit;
        public AudioClip waterPour;
        public AudioClip harvestPop;
        public AudioClip pickUp;
        public AudioClip toolSwitch;
        public AudioClip uiClick;

        [Header("Nhạc theo mùa")]
        public AudioClip springTheme, summerTheme, fallTheme, winterTheme, nightTheme;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
        }

        private void Start()
        {
            if (TimeManager.Instance != null)
            {
                TimeManager.Instance.OnSeasonChanged += OnSeasonChanged;
                TimeManager.Instance.OnHourChanged += OnHourChanged;
            }
        }

        private void OnDestroy()
        {
            if (TimeManager.Instance != null)
            {
                TimeManager.Instance.OnSeasonChanged -= OnSeasonChanged;
                TimeManager.Instance.OnHourChanged -= OnHourChanged;
            }
        }

        private void OnSeasonChanged(Season s) => PlaySeasonMusic(s);
        private void OnHourChanged(int h) { if (h == 20) PlayMusic(nightTheme); if (h == 6) PlaySeasonMusic(TimeManager.Instance.CurrentSeason); }

        public void PlaySeasonMusic(Season s)
        {
            switch (s)
            {
                case Season.Spring: PlayMusic(springTheme); break;
                case Season.Summer: PlayMusic(summerTheme); break;
                case Season.Fall: PlayMusic(fallTheme); break;
                case Season.Winter: PlayMusic(winterTheme); break;
            }
        }

        public void PlayMusic(AudioClip clip)
        {
            if (musicSource == null || clip == null || musicSource.clip == clip) return;
            musicSource.clip = clip;
            musicSource.loop = true;
            musicSource.Play();
        }

        public void PlayOneShot(AudioClip clip, float volume = 1f, float pitchVariance = 0.08f)
        {
            if (clip == null || sfxSource == null) return;
            sfxSource.pitch = 1f + Random.Range(-pitchVariance, pitchVariance);
            sfxSource.PlayOneShot(clip, volume);
        }

        public void PlayHoe() => PlayOneShot(hoeHit, 0.8f);
        public void PlayWaterPour() => PlayOneShot(waterPour, 0.7f);
        public void PlayPickUp() => PlayOneShot(pickUp, 0.7f);
        public void PlayToolSwitch() => PlayOneShot(toolSwitch, 0.5f);
        public void PlayUIClick() => PlayOneShot(uiClick, 0.6f);
        public void PlayHarvest(string cropId) => PlayOneShot(harvestPop, 0.9f);
    }

    // -------------------------------------------------------------------------
    //  2) CHỮ NỔI / THÔNG BÁO
    // -------------------------------------------------------------------------
    public class FloatingText : MonoBehaviour
    {
        public static FloatingText Instance { get; private set; }

        [Header("Prefab chữ nổi (có Text + Animator tuỳ chọn)")]
        public GameObject floatingTextPrefab;
        [Header("Bảng thông báo toast (Text UI)")]
        public Text toastLabel;
        public float toastDuration = 2.2f;

        private float _toastTimer;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
        }

        private void Update()
        {
            if (_toastTimer > 0f)
            {
                _toastTimer -= Time.deltaTime;
                if (_toastTimer <= 0f && toastLabel != null) toastLabel.text = "";
            }
        }

        public void Show(string text, Vector3 worldPos, Color color)
        {
            if (floatingTextPrefab == null) return;
            GameObject go = Instantiate(floatingTextPrefab, worldPos + Vector3.up * 0.8f, Quaternion.identity);
            var t = go.GetComponentInChildren<Text>();
            if (t != null) { t.text = text; t.color = color; }
            Destroy(go, 1.6f);
        }

        public void ShowToast(string text)
        {
            if (toastLabel != null)
            {
                toastLabel.text = text;
                _toastTimer = toastDuration;
            }
            else Debug.Log("[Toast] " + text);
        }
    }

    // -------------------------------------------------------------------------
    //  3) KINH NGHIỆM & CẤP ĐỘ NGƯỜI CHƠI
    // -------------------------------------------------------------------------
    public class PlayerStats : MonoBehaviour
    {
        public static PlayerStats Instance { get; private set; }

        public int farmingXp;
        public int farmingLevel = 1;
        public int[] xpPerLevel = new int[] { 0, 100, 250, 500, 900, 1500, 2400, 3600, 5200, 7500 };

        public System.Action<int> OnLevelUp;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
        }

        public void AddFarmingXp(int amount)
        {
            farmingXp += amount;
            int newLevel = farmingLevel;
            for (int i = 0; i < xpPerLevel.Length; i++)
                if (farmingXp >= xpPerLevel[i]) newLevel = i + 1;

            if (newLevel != farmingLevel)
            {
                farmingLevel = newLevel;
                OnLevelUp?.Invoke(farmingLevel);
                if (FloatingText.Instance != null) FloatingText.Instance.ShowToast($"Lên cấp Nông trại {farmingLevel}!");
            }
        }
    }

    // -------------------------------------------------------------------------
    //  4) HIỆU ỨNG "CÂY ĐÃ CHÍN" — nhấp nháy + lấp lánh
    // -------------------------------------------------------------------------
    public class ReadyPulse : MonoBehaviour
    {
        public float pulseSpeed = 3f;
        public float pulseAmount = 0.04f;
        public ParticleSystem sparkles;
        public Light glow;

        private Vector3 _baseScale;
        private CropQuality _quality;

        private void Awake() => _baseScale = transform.localScale;

        public void SetQuality(CropQuality q)
        {
            _quality = q;
            if (sparkles != null) { var main = sparkles.main; main.startColor = QualityColor(q); }
        }

        private void Update()
        {
            float s = 1f + Mathf.Sin(Time.time * pulseSpeed) * pulseAmount;
            transform.localScale = _baseScale * s;
            if (glow != null) glow.intensity = 0.4f + Mathf.Sin(Time.time * pulseSpeed * 0.7f) * 0.2f;
        }

        private Color QualityColor(CropQuality q)
        {
            switch (q)
            {
                case CropQuality.Silver: return new Color(0.85f, 0.92f, 1f);
                case CropQuality.Gold: return new Color(1f, 0.85f, 0.35f);
                case CropQuality.Rainbow: return Color.magenta;
                default: return new Color(1f, 1f, 0.9f, 0.6f);
            }
        }
    }

    // -------------------------------------------------------------------------
    //  5) BỂ NƯỚC / GIẾNG — múc nước đầy bình
    // -------------------------------------------------------------------------
    public class WaterSource : MonoBehaviour, Interaction.IInteractable
    {
        public Transform InteractTransform => transform;
        public string GetPrompt(Interaction.PlayerInteractor p) => "[E] Múc đầy bình tưới";
        public bool CanInteract(Interaction.PlayerInteractor p) => true;
        public void Interact(Interaction.PlayerInteractor p) => p.RefillWater();
    }

    // -------------------------------------------------------------------------
    //  6) ĐỒNG HỒ HUD ĐƠN GIẢN
    // -------------------------------------------------------------------------
    public class HudClock : MonoBehaviour
    {
        public Text clockLabel;
        public Text dayLabel;
        public Text weatherLabel;
        public Text goldLabel;

        private void Start()
        {
            if (TimeManager.Instance != null) TimeManager.Instance.OnMinuteTick += _ => Refresh();
            if (WeatherSystem.Instance != null) WeatherSystem.Instance.OnWeatherChanged += (_, __) => Refresh();
            if (Inventory.Instance != null)
            {
                Inventory.Instance.OnGoldChanged += _ => Refresh();
                Inventory.Instance.OnInventoryChanged += Refresh;
            }
            Refresh();
        }

        private void Refresh()
        {
            var tm = TimeManager.Instance;
            if (tm == null) return;
            if (clockLabel) clockLabel.text = tm.GetTimeString();
            if (dayLabel) dayLabel.text = $"Năm {tm.Year} · {tm.SeasonName(tm.CurrentSeason)} {tm.DayOfSeason}";
            if (weatherLabel && WeatherSystem.Instance != null) weatherLabel.text = WeatherSystem.Instance.WeatherName(WeatherSystem.Instance.Today);
            if (goldLabel && Inventory.Instance != null)
                goldLabel.text = $"{Inventory.Instance.Gold:N0} G";
        }
    }

    // -------------------------------------------------------------------------
    //  7) QUẢN LÝ ĐỒNG HỒ GAME (pause, đổi tốc độ)
    // -------------------------------------------------------------------------
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }
        public bool paused;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
        }

        private void Update()
        {
            if (Input.GetKeyDown(KeyCode.Escape)) TogglePause();
        }

        public void TogglePause()
        {
            paused = !paused;
            Time.timeScale = paused ? 0f : 1f;
            Cursor.lockState = paused ? CursorLockMode.None : CursorLockMode.Locked;
            Cursor.visible = paused;
        }
    }
}
