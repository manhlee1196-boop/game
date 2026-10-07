// ============================================================================
//  GameServices.cs — Các service dùng chung (bản 2D PIXEL)
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
    //  1) ÂM THANH — nhạc chiptune theo mùa + SFX 8-bit
    // -------------------------------------------------------------------------
    public class AudioManager : MonoBehaviour
    {
        public static AudioManager Instance { get; private set; }

        [Header("Nguồn phát")]
        public AudioSource sfxSource;
        public AudioSource musicSource;
        public AudioSource weatherSource;    // tiếng mưa/tuyết lặp

        [Header("SFX hành động (định dạng 8-bit/16-bit, 22.05 kHz)")]
        public AudioClip hoeHit;
        public AudioClip waterPour;
        public AudioClip harvestPop;
        public AudioClip pickUp;
        public AudioClip toolSwitch;
        public AudioClip uiClick;
        public AudioClip levelUp;
        public AudioClip menuOpen;

        [Header("Nhạc theo mùa + đêm + lễ hội")]
        public AudioClip springTheme, summerTheme, fallTheme, winterTheme, nightTheme, festivalTheme, titleTheme;

        [Header("Thời tiết")]
        public AudioClip rainLoop, stormLoop, snowLoop, windLoop;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
        }

        private void Start()
        {
            if (TimeManager.Instance != null)
            {
                TimeManager.Instance.OnSeasonChanged += PlaySeasonMusic;
                TimeManager.Instance.OnHourChanged += HandleHourChanged;
            }
            if (WeatherSystem.Instance != null)
                WeatherSystem.Instance.OnWeatherChanged += (now, old) => PlayWeatherLoop(now);

            PlaySeasonMusic(TimeManager.Instance != null ? TimeManager.Instance.CurrentSeason : Season.Spring);
        }

        private void OnDestroy()
        {
            if (TimeManager.Instance != null)
            {
                TimeManager.Instance.OnSeasonChanged -= PlaySeasonMusic;
                TimeManager.Instance.OnHourChanged -= HandleHourChanged;
            }
        }

        private void HandleHourChanged(int hour)
        {
            // 20:00 -> nhạc đêm; 6:00 -> nhạc mùa
            if (hour == 20) PlayMusic(nightTheme);
            else if (hour == 6 && TimeManager.Instance != null) PlaySeasonMusic(TimeManager.Instance.CurrentSeason);
        }

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

        public void PlayOneShot(AudioClip clip, float volume = 1f, float pitchVariance = 0.06f)
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
        public void PlayLevelUp() => PlayOneShot(levelUp, 0.9f);

        /// <summary>Tiếng mưa/tuyết lặp theo thời tiết.</summary>
        public void PlayWeatherLoop(WeatherType weather)
        {
            if (weatherSource == null) return;
            AudioClip clip = null;
            float vol = 0.5f;

            switch (weather)
            {
                case WeatherType.Rain: clip = rainLoop; vol = 0.5f; break;
                case WeatherType.Storm: clip = stormLoop; vol = 0.75f; break;
                case WeatherType.Snow: clip = snowLoop; vol = 0.45f; break;
                case WeatherType.Fog: clip = windLoop; vol = 0.4f; break;
            }

            if (clip == null) { weatherSource.Stop(); return; }
            if (weatherSource.clip == clip && weatherSource.isPlaying) { weatherSource.volume = vol; return; }
            weatherSource.clip = clip;
            weatherSource.loop = true;
            weatherSource.volume = vol;
            weatherSource.Play();
        }
    }

    // -------------------------------------------------------------------------
    //  2) CHỮ NỔI PIXEL + TOAST
    // -------------------------------------------------------------------------
    public class FloatingText : MonoBehaviour
    {
        public static FloatingText Instance { get; private set; }

        [Header("Prefab chữ nổi ngoài thế giới (pixel bitmap font, có Animator tuỳ chọn)")]
        public GameObject floatingTextPrefab;

        [Header("Toast (thanh thông báo dưới màn hình)")]
        public Text toastLabel;
        public float toastDuration = 2.2f;

        [Header("Chống rung")]
        public bool snapToPixel = true;

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

        /// <summary>Chữ bay lên tại vị trí world (ví dụ "+3 Cà chua").</summary>
        public void Show(string text, Vector3 worldPos, Color color)
        {
            if (floatingTextPrefab == null) return;

            Vector3 pos = snapToPixel && PixelArtGlobal.Instance != null
                ? PixelArtGlobal.Instance.SnapToHalfPixel(worldPos)
                : worldPos;

            GameObject go = Instantiate(floatingTextPrefab, pos, Quaternion.identity);
            var t = go.GetComponentInChildren<Text>();
            if (t != null) { t.text = text; t.color = color; }
            Destroy(go, 1.4f);
        }

        public void ShowToast(string text)
        {
            if (toastLabel != null) { toastLabel.text = text; _toastTimer = toastDuration; }
            else Debug.Log("[Toast] " + text);
        }
    }

    // -------------------------------------------------------------------------
    //  3) KINH NGHIỆM & CẤP ĐỘ
    // -------------------------------------------------------------------------
    public class PlayerStats : MonoBehaviour
    {
        public static PlayerStats Instance { get; private set; }

        public int farmingXp;
        public int farmingLevel = 1;
        public int[] xpPerLevel = new int[] { 0, 100, 250, 500, 900, 1500, 2400, 3600, 5200, 7500 };

        public System.Action<int> OnLevelUp;
        public System.Action<int, int> OnXpChanged;   // (xp hiện tại, ngưỡng kế tiếp)

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
                AudioManager.Instance?.PlayLevelUp();
                FloatingText.Instance?.ShowToast($"Lên cấp Nông trại {farmingLevel}!");
            }
            OnXpChanged?.Invoke(farmingXp, NextThreshold());
        }

        private int NextThreshold()
        {
            int idx = Mathf.Clamp(farmingLevel, 0, xpPerLevel.Length - 1);
            return xpPerLevel[idx];
        }
    }

    // -------------------------------------------------------------------------
    //  4) QUẢN LÝ GAME (pause, chụp ảnh pixel, thoát)
    // -------------------------------------------------------------------------
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }
        public bool paused;

        [Header("Chụp ảnh pixel (giấu HUD)")]
        public GameObject hudRoot;
        public KeyCode photoModeKey = KeyCode.P;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
        }

        private void Update()
        {
            if (Input.GetKeyDown(KeyCode.Escape)) TogglePause();
            if (Input.GetKeyDown(photoModeKey) && hudRoot != null) hudRoot.SetActive(!hudRoot.activeSelf);
        }

        public void TogglePause()
        {
            paused = !paused;
            Time.timeScale = paused ? 0f : 1f;
        }

        public void SetPaused(bool value)
        {
            paused = value;
            Time.timeScale = value ? 0f : 1f;
        }
    }
}
