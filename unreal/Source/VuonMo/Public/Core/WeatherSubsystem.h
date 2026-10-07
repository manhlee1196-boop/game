// ============================================================================
//  WeatherSubsystem.h — Sinh thời tiết theo mùa + dự báo 3 ngày (bản UE5)
//  Đặt tại: Source/VuonMo/Public/Core/WeatherSubsystem.h
// ============================================================================
#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "Data/CropDataAsset.h"
#include "WeatherSubsystem.generated.h"

USTRUCT(BlueprintType)
struct FWeatherProfileUnreal
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite) EWeatherType Type = EWeatherType::Sunny;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) float Weight = 0.2f;
    /** Thời tiết này có tưới cây miễn phí không? */
    UPROPERTY(EditAnywhere, BlueprintReadWrite) bool bAutoWatersCrops = false;
    /** Tỉ lệ làm gãy cây mỗi ngày */
    UPROPERTY(EditAnywhere, BlueprintReadWrite) float CropBreakChance = 0.f;
    /** Hệ số tốc độ lớn của cây */
    UPROPERTY(EditAnywhere, BlueprintReadWrite) float GrowthSpeedMultiplier = 1.f;
    /** Gia súc phải ở trong chuồng */
    UPROPERTY(EditAnywhere, BlueprintReadWrite) bool bKeepsAnimalsInside = false;
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnWeatherChangedSignature, EWeatherType, NewWeather, EWeatherType, OldWeather);

UCLASS()
class VUONMO_API UWeatherSubsystem : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Thời tiết")
    TArray<FWeatherProfileUnreal> Profiles;

    UPROPERTY(BlueprintReadOnly, Category = "Thời tiết") EWeatherType TodayWeather = EWeatherType::Sunny;
    UPROPERTY(BlueprintReadOnly, Category = "Thời tiết") EWeatherType TomorrowWeather = EWeatherType::Sunny;
    UPROPERTY(BlueprintReadOnly, Category = "Thời tiết") EWeatherType DayAfterWeather = EWeatherType::Sunny;

    UPROPERTY(BlueprintAssignable, Category = "Thời tiết") FOnWeatherChangedSignature OnWeatherChanged;

    virtual void Initialize(FSubsystemCollectionBase& Collection) override;

    UFUNCTION(BlueprintCallable, Category = "Thời tiết") EWeatherType RollWeather(ESeason Season) const;
    UFUNCTION(BlueprintCallable, Category = "Thời tiết") void RollNextDay();
    UFUNCTION(BlueprintCallable, Category = "Thời tiết") EWeatherType GetTodayWeather() const { return TodayWeather; }
    UFUNCTION(BlueprintCallable, Category = "Thời tiết") bool IsRaining() const;
    UFUNCTION(BlueprintCallable, Category = "Thời tiết") float GetCropBreakChance(EWeatherType Weather) const;
    UFUNCTION(BlueprintCallable, Category = "Thời tiết") void ForceWeather(EWeatherType NewWeather);

private:
    bool IsAllowedInSeason(EWeatherType Weather, ESeason Season) const;
};
