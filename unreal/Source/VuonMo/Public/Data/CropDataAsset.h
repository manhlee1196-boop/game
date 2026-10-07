// ============================================================================
//  CropDataAsset.h — Bản Unreal Engine 5 (UE 5.3+) của CropData (Unity)
//  Đặt tại: Source/VuonMo/Public/Data/CropDataAsset.h
//  Tạo asset: Content Browser > Chuột phải > Miscellaneous > Data Asset > CropDataAsset
// ============================================================================
#pragma once

#include "CoreMinimal.h"
#include "Engine/DataAsset.h"
#include "CropDataAsset.generated.h"

UENUM(BlueprintType)
enum class EGrowthStage : uint8
{
    Seed        UMETA(DisplayName = "Hạt giống"),
    Sprout      UMETA(DisplayName = "Mầm"),
    Mature      UMETA(DisplayName = "Trưởng thành"),
    Fruiting    UMETA(DisplayName = "Có quả (chín)"),
    Withering   UMETA(DisplayName = "Héo"),
    Dead        UMETA(DisplayName = "Chết")
};

UENUM(BlueprintType)
enum class ECropQuality : uint8
{
    Normal, Silver, Gold, Rainbow
};

UENUM(BlueprintType)
enum class ESeason : uint8
{
    Spring, Summer, Fall, Winter
};

UENUM(BlueprintType)
enum class EWeatherType : uint8
{
    Sunny, Cloudy, Rain, Storm, Snow, Fog, Rainbow, MeteorShower
};

/** Vật phẩm thu hoạch (đơn giản hoá: dùng Primary Data Asset riêng nếu cần sâu hơn) */
USTRUCT(BlueprintType)
struct FItemStackUnreal
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite) FName ItemId = NAME_None;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) FText DisplayName;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 BaseSellPrice = 10;
    /** Prefab rơi ra (BP_Vật phẩm) */
    UPROPERTY(EditAnywhere, BlueprintReadWrite) TSoftClassPtr<AActor> WorldActorClass;
};

/**
 *  "Công thức" của một loại cây trồng — tương đương CropData : ScriptableObject bên Unity.
 */
UCLASS(BlueprintType)
class VUONMO_API UCropDataAsset : public UPrimaryDataAsset
{
    GENERATED_BODY()

public:
    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Định danh")
    FName CropId = TEXT("tomato");

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Định danh")
    FText DisplayName;

    // ---------------------------------------------------------------------
    //  4 MODEL 3D THEO GIAI ĐOẠN (Seed → Sprout → Mature → Fruiting)
    // ---------------------------------------------------------------------
    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Giai đoạn|Model 3D",
              meta = (ToolTip = "Đúng 4 phần tử: Hạt giống, Mầm, Trưởng thành, Có quả"))
    TArray<TSoftObjectPtr<UStaticMesh>> StageMeshes;

    /** Skeletal mesh tuỳ chọn cho cây có animation (ví dụ cây ăn quả rung khi thu hoạch) */
    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Giai đoạn|Model 3D")
    TArray<TSoftObjectPtr<USkeletalMesh>> StageSkeletalMeshes;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Giai đoạn|Model 3D")
    TArray<FVector> StageMeshScale = { FVector(1), FVector(1), FVector(1), FVector(1) };

    // ---------------------------------------------------------------------
    //  THỜI GIAN SINH TRƯỞNG (theo NGÀY GAME)
    // ---------------------------------------------------------------------
    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Sinh trưởng",
              meta = (ClampMin = "0", ToolTip = "Seed→Sprout, Sprout→Mature, Mature→Fruiting, Fruiting→(regrow)"))
    TArray<int32> DaysPerStage = { 1, 2, 3, 2 };

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Sinh trưởng")
    bool bNeedsWater = true;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Sinh trưởng", meta = (ClampMin = "0.0", ClampMax = "1.0"))
    float RequiredMoisture = 0.3f;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Sinh trưởng")
    int32 DryDaysBeforeWither = 2;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Sinh trưởng")
    int32 WitherDaysBeforeDeath = 3;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Sinh trưởng")
    TArray<ESeason> AllowedSeasons;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Sinh trưởng")
    bool bSurvivesWinterOutdoor = false;

    // ---------------------------------------------------------------------
    //  THU HOẠCH
    // ---------------------------------------------------------------------
    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Thu hoạch")
    FItemStackUnreal HarvestItem;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Thu hoạch")
    int32 MinYield = 1;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Thu hoạch")
    int32 MaxYield = 3;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Thu hoạch")
    bool bRegrows = true;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Thu hoạch")
    TSoftObjectPtr<UNiagaraSystem> HarvestVFX;

    // ---------------------------------------------------------------------
    //  PHẨM CHẤT & KINH TẾ
    // ---------------------------------------------------------------------
    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Phẩm chất", meta = (ClampMin = "0.0", ClampMax = "1.0"))
    float SilverChance = 0.30f;
    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Phẩm chất", meta = (ClampMin = "0.0", ClampMax = "1.0"))
    float GoldChance = 0.12f;
    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Phẩm chất", meta = (ClampMin = "0.0", ClampMax = "1.0"))
    float RainbowChance = 0.01f;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Kinh tế") int32 SeedPrice = 45;
    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Kinh tế") int32 BaseSellPrice = 55;
    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Kinh tế") int32 FarmingXp = 8;

    // ---------------------------------------------------------------------
    //  HÀM TIỆN ÍCH
    // ---------------------------------------------------------------------
    UFUNCTION(BlueprintPure, Category = "Cây trồng")
    int32 TotalDaysToRipe() const
    {
        int32 Sum = 0;
        for (int32 i = 0; i < 3 && DaysPerStage.IsValidIndex(i); ++i) Sum += DaysPerStage[i];
        return Sum;
    }

    UFUNCTION(BlueprintPure, Category = "Cây trồng")
    int32 CumulativeDays(int32 StageIndex) const
    {
        int32 Sum = 0;
        for (int32 i = 0; i < StageIndex && DaysPerStage.IsValidIndex(i); ++i) Sum += DaysPerStage[i];
        return Sum;
    }

    UFUNCTION(BlueprintPure, Category = "Cây trồng")
    EGrowthStage StageFromDays(int32 WateredDays) const
    {
        if (WateredDays >= CumulativeDays(3)) return EGrowthStage::Fruiting;
        if (WateredDays >= CumulativeDays(2)) return EGrowthStage::Mature;
        if (WateredDays >= CumulativeDays(1)) return EGrowthStage::Sprout;
        return EGrowthStage::Seed;
    }

    UFUNCTION(BlueprintPure, Category = "Cây trồng")
    bool CanPlantInSeason(ESeason Season) const
    {
        return AllowedSeasons.Num() == 0 || AllowedSeasons.Contains(Season);
    }
};
