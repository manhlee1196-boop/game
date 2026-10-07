// ============================================================================
//  GameTimeSubsystem.h — Đồng hồ game (năm/mùa/ngày/giờ) cho UE5
//  Đặt tại: Source/VuonMo/Public/Core/GameTimeSubsystem.h
//  Dùng: UGameTimeSubsystem* TimeSys = GetGameInstance()->GetSubsystem<UGameTimeSubsystem>();
// ============================================================================
#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "Data/CropDataAsset.h"     // dùng ESeason / EWeatherType
#include "GameTimeSubsystem.generated.h"

/** (Ngày index, Mùa, Thời tiết) — mọi cây trồng/gia súc đăng ký event này */
DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(FOnNewDaySignature, int32, DayIndex, ESeason, Season, EWeatherType, Weather);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnSeasonChangedSignature, ESeason, NewSeason);

UCLASS()
class VUONMO_API UGameTimeSubsystem : public UGameInstanceSubsystem, public FTickableGameObject
{
    GENERATED_BODY()

public:
    // ---- Cấu hình ----
    /** Số phút trong game mỗi giây thực (1.25 => 1 ngày game ≈ 16 phút thực) */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Thời gian")
    float MinutesPerSecond = 1.25f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Thời gian")
    int32 DaysPerSeason = 28;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Thời gian")
    int32 DayStartHour = 6;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Thời gian")
    int32 DayEndHour = 26;   // 2 giờ sáng -> auto-sleep

    // ---- Trạng thái ----
    UPROPERTY(BlueprintReadOnly, Category = "Thời gian") int32 Year = 1;
    UPROPERTY(BlueprintReadOnly, Category = "Thời gian") ESeason CurrentSeason = ESeason::Spring;
    UPROPERTY(BlueprintReadOnly, Category = "Thời gian") int32 DayOfSeason = 1;
    UPROPERTY(BlueprintReadOnly, Category = "Thời gian") int32 Hour = 6;
    UPROPERTY(BlueprintReadOnly, Category = "Thời gian") int32 Minute = 0;
    UPROPERTY(BlueprintReadOnly, Category = "Thời gian") double TotalMinutes = 0.0;

    UPROPERTY(BlueprintAssignable, Category = "Thời gian") FOnNewDaySignature OnNewDay;
    UPROPERTY(BlueprintAssignable, Category = "Thời gian") FOnSeasonChangedSignature OnSeasonChanged;

    // ---- API ----
    UFUNCTION(BlueprintCallable, Category = "Thời gian") void Sleep(bool bBeforeMidnight = true);
    UFUNCTION(BlueprintCallable, Category = "Thời gian") int32 GetDayIndex() const;
    UFUNCTION(BlueprintCallable, Category = "Thời gian") FString GetTimeString() const;
    UFUNCTION(BlueprintCallable, Category = "Thời gian") void ForceTime(int32 InYear, ESeason InSeason, int32 InDay, int32 InHour, int32 InMinute);

    /** Bật/tắt đồng hồ: dùng khi mở menu, hội thoại, cinematic */
    UFUNCTION(BlueprintCallable, Category = "Thời gian") void SetPaused(bool bPaused) { bTimePaused = bPaused; }

    // FTickableGameObject
    virtual void Tick(float DeltaTime) override;
    virtual TStatId GetStatId() const override { RETURN_QUICK_DECLARE_CYCLE_STAT(UGameTimeSubsystem, STATGROUP_Tickables); }

private:
    void AdvanceMinute();
    void AdvanceDay();
    void NextSeason();
    UPROPERTY() bool bTimePaused = false;
    double MinuteAccumulator = 0.0;
};
