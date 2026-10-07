// ============================================================================
//  WeatherSystem.cs — Sinh thời tiết theo mùa, dự báo 3 ngày, phát event
//  Đặt tại: Assets/Scripts/Core/
// ============================================================================
using System;
using System.Collections.Generic;
using UnityEngine;

namespace VuonMo.Core
{
    public class WeatherSystem : MonoBehaviour
    {
        public static WeatherSystem Instance { get; private set; }

        [Serializable]
        public class WeatherProfile
        {
            public WeatherType type;
            [Range(0f, 1f)] public float weight = 0.2f;
            [Tooltip("Cây cối có được tưới miễn phí không?")]
            public bool autoWatersCrops;
            [Tooltip("Tỉ lệ cây bị gãy mỗi ngày (bão/tuyết).")]
            [Range(0f, 1f)] public float cropBreakChance;
            [Tooltip("Hệ số tốc độ lớn của cây khi gặp thời tiết này.")]
            public float growthSpeedMultiplier = 1f;
            [Tooltip("Gia súc không được ra ngoài?")]
            public bool keepsAnimalsInside;
        }

        [Header("Cấu hình thời tiết (chỉnh trong Inspector)")]
        public List<WeatherProfile> profiles = new List<WeatherProfile>
        {
            new WeatherProfile { type = WeatherType.Sunny,        weight = 0.45f, autoWatersCrops = false, cropBreakChance = 0f,    growthSpeedMultiplier = 1.0f },
            new WeatherProfile { type = WeatherType.Cloudy,       weight = 0.20f, autoWatersCrops = false, cropBreakChance = 0f,    growthSpeedMultiplier = 1.0f },
            new WeatherProfile { type = WeatherType.Rain,         weight = 0.18f, autoWatersCrops = true,  cropBreakChance = 0f,    growthSpeedMultiplier = 1.1f },
            new WeatherProfile { type = WeatherType.Storm,        weight = 0.05f, autoWatersCrops = true,  cropBreakChance = 0.10f, growthSpeedMultiplier = 0.8f, keepsAnimalsInside = true },
            new WeatherProfile { type = WeatherType.Snow,         weight = 0.10f, autoWatersCrops = false, cropBreakChance = 0.05f, growthSpeedMultiplier = 0.5f, keepsAnimalsInside = true },
            new WeatherProfile { type = WeatherType.Fog,          weight = 0.02f, autoWatersCrops = false, cropBreakChance = 0f,    growthSpeedMultiplier = 0.9f },
        };

        [Header("Trạng thái hiện tại")]
        [SerializeField] private WeatherType today = WeatherType.Sunny;
        [SerializeField] private WeatherType tomorrow = WeatherType.Sunny;
        [SerializeField] private WeatherType dayAfter = WeatherType.Sunny;

        public WeatherType Today => today;
        public WeatherType Tomorrow => tomorrow;
        public WeatherType DayAfter => dayAfter;

        /// <summary>(thời tiết mới, thời tiết cũ)</summary>
        public event Action<WeatherType, WeatherType> OnWeatherChanged;

        private System.Random _rng;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
        }

        private void Start()
        {
            _rng = new System.Random(Environment.TickCount);
            RollForecast(TimeManager.Instance.CurrentSeason);
            if (TimeManager.Instance != null)
                TimeManager.Instance.OnDayChanged += HandleDayChanged;
        }

        private void OnDestroy()
        {
            if (TimeManager.Instance != null)
                TimeManager.Instance.OnDayChanged -= HandleDayChanged;
        }

        private void HandleDayChanged(int dayIndex, Season season)
        {
            WeatherType old = today;
            today = tomorrow;
            tomorrow = dayAfter;
            dayAfter = Roll(season);
            OnWeatherChanged?.Invoke(today, old);
        }

        private void RollForecast(Season season)
        {
            today = Roll(season);
            tomorrow = Roll(season);
            dayAfter = Roll(season);
        }

        /// <summary>Chọn 1 loại thời tiết theo trọng số, có lọc theo mùa.</summary>
        public WeatherType Roll(Season season)
        {
            List<WeatherProfile> pool = new List<WeatherProfile>();
            float total = 0f;
            foreach (var p in profiles)
            {
                if (!IsAllowedInSeason(p.type, season)) continue;
                pool.Add(p);
                total += p.weight;
            }
            if (pool.Count == 0 || total <= 0f) return WeatherType.Sunny;

            float roll = (float)_rng.NextDouble() * total;
            foreach (var p in pool)
            {
                roll -= p.weight;
                if (roll <= 0f) return p.type;
            }
            return pool[pool.Count - 1].type;
        }

        private bool IsAllowedInSeason(WeatherType w, Season s)
        {
            if (w == WeatherType.Snow) return s == Season.Winter;              // Tuyết chỉ mùa Đông
            if (w == WeatherType.MeteorShower) return s == Season.Summer || s == Season.Fall;
            return true;
        }

        public WeatherProfile GetProfile(WeatherType t)
        {
            foreach (var p in profiles) if (p.type == t) return p;
            return profiles[0];
        }

        /// <summary>Hôm nay có tự tưới cây không (mưa/bão)?</summary>
        public bool IsRaining() => GetProfile(today).autoWatersCrops;

        /// <summary>Tên tiếng Việt của thời tiết để hiển thị HUD.</summary>
        public string WeatherName(WeatherType w)
        {
            switch (w)
            {
                case WeatherType.Sunny: return "Nắng";
                case WeatherType.Cloudy: return "Nhiều mây";
                case WeatherType.Rain: return "Mưa";
                case WeatherType.Storm: return "Bão";
                case WeatherType.Snow: return "Tuyết";
                case WeatherType.Fog: return "Sương mù";
                case WeatherType.Rainbow: return "Cầu vồng";
                case WeatherType.MeteorShower: return "Mưa sao băng";
                default: return "?";
            }
        }

        public void ForceWeather(WeatherType t)
        {
            WeatherType old = today;
            today = t;
            OnWeatherChanged?.Invoke(today, old);
        }
    }
}
