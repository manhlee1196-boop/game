// ============================================================================
//  GameTimeSubsystem.cpp — Cài đặt đồng hồ game
// ============================================================================
#include "Core/GameTimeSubsystem.h"
#include "Core/WeatherSubsystem.h"
#include "Engine/GameInstance.h"

void UGameTimeSubsystem::Tick(float DeltaTime)
{
    if (bTimePaused) return;

    MinuteAccumulator += DeltaTime * MinutesPerSecond;
    while (MinuteAccumulator >= 1.0)
    {
        MinuteAccumulator -= 1.0;
        AdvanceMinute();
    }
}

void UGameTimeSubsystem::AdvanceMinute()
{
    TotalMinutes += 1.0;
    ++Minute;
    if (Minute >= 60)
    {
        Minute = 0;
        ++Hour;
        if (Hour >= DayEndHour) AdvanceDay();
    }
}

void UGameTimeSubsystem::AdvanceDay()
{
    ++DayOfSeason;
    Hour = DayStartHour;
    Minute = 0;

    if (DayOfSeason > DaysPerSeason)
    {
        DayOfSeason = 1;
        NextSeason();
    }

    EWeatherType Today = EWeatherType::Sunny;
    if (UGameInstance* GI = GetGameInstance())
    {
        if (UWeatherSubsystem* WS = GI->GetSubsystem<UWeatherSubsystem>())
        {
            WS->RollNextDay();          // cập nhật dự báo 3 ngày
            Today = WS->GetTodayWeather();
        }
    }

    // Báo cho toàn bộ cây trồng / gia súc / NPC
    OnNewDay.Broadcast(GetDayIndex(), CurrentSeason, Today);
}

void UGameTimeSubsystem::NextSeason()
{
    if (CurrentSeason == ESeason::Winter)
    {
        CurrentSeason = ESeason::Spring;
        ++Year;
    }
    else
    {
        CurrentSeason = static_cast<ESeason>(static_cast<uint8>(CurrentSeason) + 1);
    }
    OnSeasonChanged.Broadcast(CurrentSeason);
}

void UGameTimeSubsystem::Sleep(bool bBeforeMidnight)
{
    // Sleep trước 24h -> buff "ngủ đủ giấc" (+5% chất lượng nông sản ngày mai)
    AdvanceDay();
}

int32 UGameTimeSubsystem::GetDayIndex() const
{
    return (Year - 1) * 4 * DaysPerSeason + static_cast<int32>(CurrentSeason) * DaysPerSeason + (DayOfSeason - 1);
}

FString UGameTimeSubsystem::GetTimeString() const
{
    return FString::Printf(TEXT("%02d:%02d"), Hour % 24, Minute);
}

void UGameTimeSubsystem::ForceTime(int32 InYear, ESeason InSeason, int32 InDay, int32 InHour, int32 InMinute)
{
    Year = FMath::Max(1, InYear);
    CurrentSeason = InSeason;
    DayOfSeason = FMath::Clamp(InDay, 1, DaysPerSeason);
    Hour = FMath::Clamp(InHour, 0, 27);
    Minute = FMath::Clamp(InMinute, 0, 59);
}
