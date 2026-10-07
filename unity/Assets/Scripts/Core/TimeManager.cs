// ============================================================================
//  TimeManager.cs — Đồng hồ game (năm/mùa/ngày/giờ/phút) + phát event theo ngày
//  Đặt tại: Assets/Scripts/Core/
//  Gắn vào: GameObject "GameManagers" (singleton, DontDestroyOnLoad)
// ============================================================================
using System;
using UnityEngine;

namespace VuonMo.Core
{
    public class TimeManager : MonoBehaviour
    {
        public static TimeManager Instance { get; private set; }

        [Header("Nhịp thời gian")]
        [Tooltip("Số phút trong game trôi qua mỗi 1 giây thực. 1.25 => 1 ngày game ≈ 16 phút thực.")]
        [Range(0.1f, 10f)] public float minutesPerSecond = 1.25f;

        [Header("Khung giờ trong ngày")]
        public int dayStartHour = 6;    // Ngày bắt đầu 6:00
        public int dayEndHour = 26;     // 26 = 2:00 sáng hôm sau (auto-sleep)
        public int daysPerSeason = 28;

        [Header("Bonus")]
        [Tooltip("Người chơi ngủ trước 24h => buff chất lượng nông sản ngày mai")]
        public bool wellRestedBuff = false;

        // ---- Trạng thái thời gian -------------------------------------------------
        public int Year { get; private set; } = 1;
        public Season CurrentSeason { get; private set; } = Season.Spring;
        public int DayOfSeason { get; private set; } = 1;   // 1..28
        public int Hour { get; private set; } = 6;
        public int Minute { get; private set; } = 0;

        /// <summary>Tổng số phút trong game kể từ đầu file save (double để tránh sai số).</summary>
        public double TotalMinutes { get; private set; }
        private double _minuteAccumulator;

        public bool IsNight => Hour >= 20 || Hour < 5;
        public int DayIndex => (Year - 1) * 4 * daysPerSeason + (int)CurrentSeason * daysPerSeason + (DayOfSeason - 1);

        // ---- Event ---------------------------------------------------------------
        /// <summary>(phút trong game vừa trôi qua) — dùng cho máy móc, đồng hồ UI.</summary>
        public event Action<double> OnMinuteTick;
        /// <summary>(giờ mới) — dùng cho đèn, mở/đóng shop.</summary>
        public event Action<int> OnHourChanged;
        /// <summary>(ngày mới, mùa hiện tại) — QUAN TRỌNG: cây trồng, gia súc nghe event này.</summary>
        public event Action<int, Season> OnDayChanged;
        /// <summary>(mùa mới) — đổi màu địa hình, đổi nhạc nền.</summary>
        public event Action<Season> OnSeasonChanged;
        /// <summary>(năm mới) — tổng kết năm.</summary>
        public event Action<int> OnYearChanged;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
        }

        private void Update()
        {
            _minuteAccumulator += Time.deltaTime * minutesPerSecond;
            while (_minuteAccumulator >= 1f)
            {
                _minuteAccumulator -= 1f;
                AdvanceMinute();
            }
        }

        private void AdvanceMinute()
        {
            TotalMinutes += 1;
            Minute++;
            if (Minute >= 60)
            {
                Minute = 0;
                Hour++;
                OnHourChanged?.Invoke(Hour);

                if (Hour >= dayEndHour)
                {
                    // Quá 2 giờ sáng -> tự động ngủ, sang ngày mới
                    wellRestedBuff = false;
                    AdvanceDay();
                }
            }
            OnMinuteTick?.Invoke(TotalMinutes);
        }

        /// <summary>Ngủ / hết ngày. Cũng gọi khi người chơi bấm ngủ trên giường.</summary>
        public void Sleep(bool sleptBefore24 = true)
        {
            wellRestedBuff = sleptBefore24 && Hour < 24;
            AdvanceDay();
        }

        private void AdvanceDay()
        {
            DayOfSeason++;
            Hour = dayStartHour;
            Minute = 0;

            if (DayOfSeason > daysPerSeason)
            {
                DayOfSeason = 1;
                NextSeason();
            }

            // Báo cho toàn bộ hệ thống: cây trồng lớn, gia súc đói, NPC reset quest...
            OnDayChanged?.Invoke(DayIndex, CurrentSeason);
        }

        private void NextSeason()
        {
            if (CurrentSeason == Season.Winter)
            {
                CurrentSeason = Season.Spring;
                Year++;
                OnYearChanged?.Invoke(Year);
            }
            else
            {
                CurrentSeason = (Season)((int)CurrentSeason + 1);
            }
            OnSeasonChanged?.Invoke(CurrentSeason);
        }

        // ---- Tiện ích -------------------------------------------------------------
        public string SeasonName(Season s)
        {
            switch (s)
            {
                case Season.Spring: return "Xuân";
                case Season.Summer: return "Hạ";
                case Season.Fall: return "Thu";
                default: return "Đông";
            }
        }

        public string GetTimeString() => $"{Hour % 24:00}:{Minute:00}";

        // ---- Lưu / tải ------------------------------------------------------------
        public void LoadFrom(int year, Season season, int day, int hour, int minute, double totalMinutes)
        {
            Year = Mathf.Max(1, year);
            CurrentSeason = season;
            DayOfSeason = Mathf.Clamp(day, 1, daysPerSeason);
            Hour = Mathf.Clamp(hour, 0, 27);
            Minute = Mathf.Clamp(minute, 0, 59);
            TotalMinutes = totalMinutes;
        }
    }
}
