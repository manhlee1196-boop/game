// ============================================================================
//  WeatherSubsystem.cpp
// ============================================================================
#include "Core/WeatherSubsystem.h"

void UWeatherSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
    Super::Initialize(Collection);

    // Trọng số mặc định theo GDD §8.2
    Profiles.Empty();
    auto Add = [this](EWeatherType T, float W, bool bWater, float Break, float Growth, bool bInside)
    {
        FWeatherProfileUnreal P;
        P.Type = T; P.Weight = W; P.bAutoWatersCrops = bWater;
        P.CropBreakChance = Break; P.GrowthSpeedMultiplier = Growth; P.bKeepsAnimalsInside = bInside;
        Profiles.Add(P);
    };

    Add(EWeatherType::Sunny,  0.45f, false, 0.00f, 1.0f, false);
    Add(EWeatherType::Cloudy, 0.20f, false, 0.00f, 1.0f, false);
    Add(EWeatherType::Rain,   0.18f, true,  0.00f, 1.1f, false);
    Add(EWeatherType::Storm,  0.05f, true,  0.10f, 0.8f, true);
    Add(EWeatherType::Snow,   0.10f, false, 0.05f, 0.5f, true);
    Add(EWeatherType::Fog,    0.02f, false, 0.00f, 0.9f, false);

    TodayWeather = RollWeather(ESeason::Spring);
    TomorrowWeather = RollWeather(ESeason::Spring);
    DayAfterWeather = RollWeather(ESeason::Spring);
}

bool UWeatherSubsystem::IsAllowedInSeason(EWeatherType Weather, ESeason Season) const
{
    if (Weather == EWeatherType::Snow) return Season == ESeason::Winter;
    if (Weather == EWeatherType::MeteorShower) return Season == ESeason::Summer || Season == ESeason::Fall;
    return true;
}

EWeatherType UWeatherSubsystem::RollWeather(ESeason Season) const
{
    float Total = 0.f;
    for (const FWeatherProfileUnreal& P : Profiles)
        if (IsAllowedInSeason(P.Type, Season)) Total += P.Weight;

    if (Total <= 0.f) return EWeatherType::Sunny;

    float Roll = FMath::FRandRange(0.f, Total);
    for (const FWeatherProfileUnreal& P : Profiles)
    {
        if (!IsAllowedInSeason(P.Type, Season)) continue;
        Roll -= P.Weight;
        if (Roll <= 0.f) return P.Type;
    }
    return EWeatherType::Sunny;
}

void UWeatherSubsystem::RollNextDay()
{
    const EWeatherType Old = TodayWeather;
    TodayWeather = TomorrowWeather;
    TomorrowWeather = DayAfterWeather;
    DayAfterWeather = RollWeather(ESeason::Spring);  // mùa thật được truyền từ GameTimeSubsystem nếu cần chính xác

    OnWeatherChanged.Broadcast(TodayWeather, Old);
}

bool UWeatherSubsystem::IsRaining() const
{
    return TodayWeather == EWeatherType::Rain || TodayWeather == EWeatherType::Storm;
}

float UWeatherSubsystem::GetCropBreakChance(EWeatherType Weather) const
{
    for (const FWeatherProfileUnreal& P : Profiles)
        if (P.Type == Weather) return P.CropBreakChance;
    return 0.f;
}

void UWeatherSubsystem::ForceWeather(EWeatherType NewWeather)
{
    const EWeatherType Old = TodayWeather;
    TodayWeather = NewWeather;
    OnWeatherChanged.Broadcast(TodayWeather, Old);
}
