// ============================================================================
//  WeatherFX2D.cs — Hiệu ứng thời tiết & mùa cho game 2D pixel
//  Đặt tại: Assets/Scripts/Weather/
//  Gắn vào: GameObject "WeatherFX" (chứa các ParticleSystem + reference)
//
//  Nội dung:
//   · Bật/tắt mưa, tuyết, lá bay, mảnh bão, đom đóm theo thời tiết & mùa
//   · Sét đánh khi bão (nháy trắng + rung camera)
//   · Đổi màu hạt mưa/tuyết, màu trời theo mùa
//   · Gió thổi lá rơi mùa Thu
// ============================================================================
using UnityEngine;
using VuonMo.Core;
using VuonMo.Data;

namespace VuonMo.WeatherVisual
{
    public class WeatherFX2D : MonoBehaviour
    {
        [Header("Particle (dùng Particle System ở chế độ 2D/Orthographic)")]
        public ParticleSystem rainParticles;
        public ParticleSystem snowParticles;
        public ParticleSystem stormDebris;
        public ParticleSystem fallingLeaves;
        public ParticleSystem fireflies;

        [Header("Lớp phủ ban ngày/đêm")]
        public DayNightTint2D dayNightTint;

        [Header("Sét khi bão")]
        public bool lightningEnabled = true;
        [Tooltip("Khoảng thời gian giữa các lần sét (giây).")]
        public Vector2 lightningInterval = new Vector2(4f, 11f);
        public AudioClip thunderClip;

        [Header("Rung camera khi bão")]
        public bool cameraShake = true;
        public float shakeAmplitudePixels = 1.5f;    // rung nhẹ cho đúng chất pixel
        public float shakeSpeed = 18f;

        [Header("Mùa")]
        public SeasonTheme[] themes = new SeasonTheme[4];
        [Tooltip("Bụi/hoa anh đào rơi mùa Xuân.")]
        public ParticleSystem petalParticles;

        [Tooltip("Sprite nền trời đổi theo mùa (tuỳ chọn).")]
        public SpriteRenderer skyBackground;

        private Camera _cam;
        private Vector3 _camBase;
        private float _nextLightning;
        private bool _stormActive;

        private void Awake()
        {
            _cam = Camera.main;
            if (_cam != null) _camBase = _cam.transform.position;
        }

        private void Start()
        {
            if (WeatherSystem.Instance != null)
                WeatherSystem.Instance.OnWeatherChanged += (now, before) => ApplyWeather(now);
            if (TimeManager.Instance != null)
                TimeManager.Instance.OnSeasonChanged += ApplySeason;

            if (WeatherSystem.Instance != null) ApplyWeather(WeatherSystem.Instance.Today);
            if (TimeManager.Instance != null) ApplySeason(TimeManager.Instance.CurrentSeason);
        }

        private void LateUpdate()
        {
            // Lấy vị trí camera "chuẩn" tại đầu khung hình (do script camera-follow cập nhật ở Update),
            // rồi mới cộng offset rung -> không bị trôi (drift) theo thời gian.
            if (_cam == null) return;
            _camBase = _cam.transform.position;

            if (_stormActive && cameraShake)
            {
                float px = 1f / 16f * shakeAmplitudePixels;   // rung theo đơn vị PIXEL cho đúng chất pixel art
                float ox = (Mathf.PerlinNoise(Time.time * shakeSpeed, 0.37f) - 0.5f) * 2f * px;
                float oy = (Mathf.PerlinNoise(0.71f, Time.time * shakeSpeed) - 0.5f) * 2f * px;
                _cam.transform.position = _camBase + new Vector3(ox, oy, 0f);
            }

            // Sét đánh khi bão
            if (_stormActive && lightningEnabled && Time.time >= _nextLightning)
            {
                _nextLightning = Time.time + Random.Range(lightningInterval.x, lightningInterval.y);
                dayNightTint?.FlashLightning(0.12f);
                if (AudioManager.Instance != null && thunderClip != null)
                    AudioManager.Instance.PlayOneShot(thunderClip, 0.7f);
            }
        }

        // ------------------------------------------------------------------
        public void ApplyWeather(WeatherType weather)
        {
            _stormActive = weather == WeatherType.Storm;

            bool isWinter = TimeManager.Instance != null && TimeManager.Instance.CurrentSeason == Season.Winter;
            bool lightWinterSnow = isWinter && (weather == WeatherType.Cloudy || weather == WeatherType.Fog);

            SetParticle(rainParticles, weather == WeatherType.Rain || weather == WeatherType.Storm);
            SetParticle(stormDebris, weather == WeatherType.Storm);
            SetParticle(snowParticles, weather == WeatherType.Snow || lightWinterSnow);

            if (_stormActive && lightningEnabled)
                _nextLightning = Time.time + Random.Range(1f, 3f);

            // Mưa to -> hạt dài và nhanh hơn
            if (rainParticles != null)
            {
                var main = rainParticles.main;
                main.startSpeed = weather == WeatherType.Storm ? 18f : 12f;
                var emission = rainParticles.emission;
                emission.rateOverTime = weather == WeatherType.Storm ? 320f : 180f;
            }
        }

        public void ApplySeason(Season season)
        {
            SeasonTheme theme = null;
            if (themes != null)
                foreach (var t in themes)
                    if (t != null && t.season == season) { theme = t; break; }

            // Lá vàng mùa Thu, hoa anh đào mùa Xuân, đom đóm mùa Hạ
            SetParticle(fallingLeaves, season == Season.Fall);
            SetParticle(petalParticles, season == Season.Spring);

            if (skyBackground != null && theme != null)
                skyBackground.color = theme.backgroundColor;

            if (_cam != null && theme != null)
                _cam.backgroundColor = theme.backgroundColor;

            // Mùa Đông: tuyết rơi chậm và dày hơn
            if (season == Season.Winter && snowParticles != null)
            {
                var main = snowParticles.main;
                main.startSpeed = 1.6f;
                var emission = snowParticles.emission;
                emission.rateOverTime = 120f;
            }
            // Sau khi đổi mùa, áp lại thời tiết hiện tại để bật/tắt tuyết cho đúng
            if (WeatherSystem.Instance != null) ApplyWeather(WeatherSystem.Instance.Today);
        }

        // ------------------------------------------------------------------
        private void SetParticle(ParticleSystem ps, bool play)
        {
            if (ps == null) return;
            if (play && !ps.isPlaying) ps.Play();
            else if (!play && ps.isPlaying) ps.Stop(true, ParticleSystemStopBehavior.StopEmitting);
        }

        /// <summary>Được gọi khi camera di chuyển (nếu dùng camera follow riêng).</summary>
        public void SetCameraBase(Vector3 position) => _camBase = position;
    }
}
