// ============================================================================
//  WeatherVisualDriver.cs — Điều khiển ánh sáng ngày/đêm, màu mùa, mưa/tuyết/bão
//  Đặt tại: Assets/Scripts/Weather/
//  Gắn vào: GameObject "DayNightLighting" (chứa Directional Light + các ParticleSystem)
// ============================================================================
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Rendering;
using VuonMo.Core;

namespace VuonMo.WeatherVisual
{
    public class WeatherVisualDriver : MonoBehaviour
    {
        [Header("Ánh sáng")]
        public Light sun;                       // Directional Light
        public Gradient sunColorByTime;         // 0h → 24h
        public AnimationCurve sunIntensityByTime = AnimationCurve.EaseInOut(0f, 0.05f, 1f, 1.4f);
        public Gradient ambientByTime;
        public Gradient fogColorByTime;
        public float fogDensityDefault = 0.008f;

        [Header("Bảng màu theo mùa (Color Script §2.2 của GDD)")]
        public Color springSky = new Color(0.66f, 0.86f, 0.94f);
        public Color summerSky = new Color(0.49f, 0.78f, 0.95f);
        public Color fallSky = new Color(0.79f, 0.84f, 0.91f);
        public Color winterSky = new Color(0.78f, 0.84f, 0.89f);

        [Header("Hiệu ứng thời tiết (ParticleSystem)")]
        public ParticleSystem rainParticles;
        public ParticleSystem snowParticles;
        public ParticleSystem leafParticles;
        public ParticleSystem stormDebris;
        public ParticleSystem fireflies;
        public ParticleSystem fallingLeavesAutumn;

        [Header("Trời & mây")]
        public Renderer skyDome;
        public int skyColorPropertyId = 0;   // đặt bằng Shader.PropertyToID("_SkyColor")
        public Transform[] clouds;
        public float cloudSpeed = 0.3f;

        [Header("Âm thanh thời tiết")]
        public AudioSource weatherAudio;
        public AudioClip rainLoop, stormLoop, snowLoop, windLoop;

        private Camera _cam;
        private float _targetFogDensity;
        private Color _targetSky;

        private void Awake()
        {
            if (sun == null) sun = GetComponentInChildren<Light>();
            if (skyColorPropertyId == 0) skyColorPropertyId = Shader.PropertyToID("_SkyColor");
            _cam = Camera.main;
        }

        private void Start()
        {
            if (TimeManager.Instance != null)
            {
                TimeManager.Instance.OnMinuteTick += _ => UpdateSun();
                TimeManager.Instance.OnSeasonChanged += s => { ApplySeasonPalette(s); };
                ApplySeasonPalette(TimeManager.Instance.CurrentSeason);
            }
            if (WeatherSystem.Instance != null)
                WeatherSystem.Instance.OnWeatherChanged += (now, before) => ApplyWeather(now);
            if (WeatherSystem.Instance != null) ApplyWeather(WeatherSystem.Instance.Today);
        }

        private void Update()
        {
            // 1) Ánh sáng theo giờ
            UpdateSun();

            // 2) Mây trôi
            if (clouds != null)
                foreach (var c in clouds)
                    if (c != null) c.position += Vector3.right * cloudSpeed * Time.deltaTime;

            // 3) Sương mù mượt
            RenderSettings.fogDensity = Mathf.Lerp(RenderSettings.fogDensity, _targetFogDensity, Time.deltaTime * 1.5f);

            // 4) Đom đóm bật ban đêm mùa Hạ
            if (fireflies != null)
            {
                bool shouldPlay = TimeManager.Instance != null && TimeManager.Instance.IsNight
                                  && TimeManager.Instance.CurrentSeason == Season.Summer;
                SetParticleState(fireflies, shouldPlay);
            }

            // 5) Lá rơi mùa Thu
            if (fallingLeavesAutumn != null)
                SetParticleState(fallingLeavesAutumn, TimeManager.Instance != null && TimeManager.Instance.CurrentSeason == Season.Fall);
        }

        // ------------------------------------------------------------------
        private void UpdateSun()
        {
            if (sun == null || TimeManager.Instance == null) return;

            float hour = TimeManager.Instance.Hour + TimeManager.Instance.Minute / 60f;

            // Xoay mặt trời: 6h -> mọc ở phía Đông, 18h -> lặn ở phía Tây
            float t = Mathf.InverseLerp(5f, 21f, hour);
            sun.transform.rotation = Quaternion.Euler(Mathf.Lerp(-15f, 190f, t), -30f, 0f);

            // Cường độ
            float intensity = sunIntensityByTime.Evaluate(t);
            if (hour >= 19.5f || hour < 5.5f) intensity *= 0.25f;   // đêm: còn ánh trăng
            sun.intensity = intensity;

            // Màu nắng theo giờ
            sun.color = sunColorByTime.Evaluate(Mathf.Clamp01(hour / 24f));

            // Ambient + fog
            RenderSettings.ambientLight = ambientByTime.Evaluate(Mathf.Clamp01(hour / 24f));
            RenderSettings.fogColor = Color.Lerp(RenderSettings.fogColor, fogColorByTime.Evaluate(Mathf.Clamp01(hour / 24f)), Time.deltaTime);
        }

        // ------------------------------------------------------------------
        public void ApplySeasonPalette(Season season)
        {
            switch (season)
            {
                case Season.Spring: _targetSky = springSky; RenderSettings.fog = true; _targetFogDensity = 0.008f; break;
                case Season.Summer: _targetSky = summerSky; RenderSettings.fog = true; _targetFogDensity = 0.006f; break;
                case Season.Fall: _targetSky = fallSky; RenderSettings.fog = true; _targetFogDensity = 0.010f; break;
                case Season.Winter: _targetSky = winterSky; RenderSettings.fog = true; _targetFogDensity = 0.014f; break;
            }
            if (skyDome != null && skyDome.material != null && skyDome.material.HasProperty(skyColorPropertyId))
                skyDome.material.SetColor(skyColorPropertyId, _targetSky);
        }

        /// <summary>Bật/tắt particle + âm thanh theo thời tiết hiện tại.</summary>
        public void ApplyWeather(WeatherType weather)
        {
            SetParticleState(rainParticles, weather == WeatherType.Rain || weather == WeatherType.Storm);
            SetParticleState(stormDebris, weather == WeatherType.Storm);
            SetParticleState(snowParticles, weather == WeatherType.Snow);
            SetParticleState(leafParticles, weather == WeatherType.Storm);

            switch (weather)
            {
                case WeatherType.Rain: _targetFogDensity = 0.016f; PlayLoop(rainLoop, 0.55f); break;
                case WeatherType.Storm: _targetFogDensity = 0.030f; PlayLoop(stormLoop, 0.8f); break;
                case WeatherType.Snow: _targetFogDensity = 0.022f; PlayLoop(snowLoop, 0.5f); break;
                case WeatherType.Fog: _targetFogDensity = 0.055f; PlayLoop(windLoop, 0.4f); break;
                case WeatherType.Sunny: _targetFogDensity = 0.006f; StopLoop(); break;
                default: _targetFogDensity = 0.010f; StopLoop(); break;
            }

            // Cầu vồng / mưa sao băng: đổi màu trời đặc biệt
            if (weather == WeatherType.Rainbow && skyDome != null && skyDome.material != null)
                skyDome.material.SetColor(skyColorPropertyId, new Color(0.85f, 0.95f, 1f));
        }

        // ------------------------------------------------------------------
        private void SetParticleState(ParticleSystem ps, bool play)
        {
            if (ps == null) return;
            if (play && !ps.isPlaying) ps.Play();
            else if (!play && ps.isPlaying) ps.Stop(true, ParticleSystemStopBehavior.StopEmitting);
        }

        private void PlayLoop(AudioClip clip, float volume)
        {
            if (weatherAudio == null || clip == null) return;
            if (weatherAudio.clip == clip && weatherAudio.isPlaying) { weatherAudio.volume = volume; return; }
            weatherAudio.clip = clip;
            weatherAudio.loop = true;
            weatherAudio.volume = volume;
            weatherAudio.Play();
        }

        private void StopLoop()
        {
            if (weatherAudio != null) weatherAudio.Stop();
        }
    }
}
