// ============================================================================
//  CropActor.h — Bản UE5 của CropInstance (Unity): cây trồng 4 giai đoạn
//  Đặt tại: Source/VuonMo/Public/Farming/CropActor.h
//  Gắn vào: BP_Crop_Tomato (Blueprint kế thừa ACropActor)
// ============================================================================
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "Data/CropDataAsset.h"
#include "Interaction/InteractableInterface.h"
#include "CropActor.generated.h"

class UStaticMeshComponent;
class UTextRenderComponent;

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnCropStageChanged, ACropActor*, Crop, EGrowthStage, NewStage);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnCropHarvested, ACropActor*, Crop, int32, Amount);

/**
 *  Một cây trồng trong thế giới.
 *   - Đổi Static Mesh theo 4 giai đoạn
 *   - Lớn lên theo NGÀY GAME (GameTimeSubsystem), cần nước
 *   - Bấm E để tưới / thu hoạch, thu hoạch thì spawn loot
 */
UCLASS(Blueprintable, ClassGroup = (VuonMo))
class VUONMO_API ACropActor : public AActor, public IInteractableInterface
{
    GENERATED_BODY()

public:
    ACropActor();

    // ---------------------------------------------------------------------
    //  CẤU HÌNH
    // ---------------------------------------------------------------------
    /** Asset cây trồng (gán trong Blueprint hoặc khi gieo hạt) */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Vườn Mơ|Cấu hình")
    TObjectPtr<UCropDataAsset> CropData;

    /** 4 mesh con: 0=Seed, 1=Sprout, 2=Mature, 3=Fruiting (tuỳ chọn; nếu trống sẽ load từ CropData) */
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Vườn Mơ|Components")
    TArray<TObjectPtr<UStaticMeshComponent>> StageComponents;

    // ---------------------------------------------------------------------
    //  TRẠNG THÁI
    // ---------------------------------------------------------------------
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Vườn Mơ|Trạng thái")
    EGrowthStage CurrentStage = EGrowthStage::Seed;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Vườn Mơ|Trạng thái")
    int32 WateredDays = 0;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Vườn Mơ|Trạng thái")
    int32 DryStreak = 0;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Vườn Mơ|Trạng thái")
    ECropQuality Quality = ECropQuality::Normal;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Vườn Mơ|Trạng thái")
    bool bIsDead = false;

    /** Ô đất đang chứa cây (gán khi gieo hạt) */
    UPROPERTY(BlueprintReadWrite, Category = "Vườn Mơ|Tham chiếu")
    TObjectPtr<AActor> OwningTile;

    // ---------------------------------------------------------------------
    //  EVENT
    // ---------------------------------------------------------------------
    UPROPERTY(BlueprintAssignable, Category = "Vườn Mơ|Event") FOnCropStageChanged OnStageChanged;
    UPROPERTY(BlueprintAssignable, Category = "Vườn Mơ|Event") FOnCropHarvested  OnHarvested;

    // ---------------------------------------------------------------------
    //  API
    // ---------------------------------------------------------------------
    UFUNCTION(BlueprintCallable, Category = "Vườn Mơ|Cây trồng")
    void InitializeCrop(UCropDataAsset* InData, AActor* InTile, int32 StartingWateredDays = 0);

    /** Ngày mới: tính nước, tăng trưởng, héo/chết */
    UFUNCTION(BlueprintCallable, Category = "Vườn Mơ|Cây trồng")
    void OnNewDay(int32 NewDayIndex, ESeason Season, EWeatherType Weather, float TileMoisture, bool bIsGreenhouse);

    /** Thu hoạch — spawn loot, trả về số lượng nhả ra */
    UFUNCTION(BlueprintCallable, Category = "Vườn Mơ|Cây trồng")
    int32 Harvest();

    UFUNCTION(BlueprintPure, Category = "Vườn Mơ|Cây trồng")
    bool IsRipe() const { return !bIsDead && CurrentStage == EGrowthStage::Fruiting; }

    UFUNCTION(BlueprintPure, Category = "Vườn Mơ|Cây trồng")
    bool IsThirsty(float TileMoisture, bool bRaining) const;

    UFUNCTION(BlueprintPure, Category = "Vườn Mơ|Cây trồng")
    int32 DaysLeftToRipe() const;

    UFUNCTION(BlueprintCallable, Category = "Vườn Mơ|Cây trồng")
    void WaterIt();

    /** Hàm nhận event từ GameTimeSubsystem (bind động, không cần Tick mỗi khung hình) */
    UFUNCTION()
    void HandleNewDayInternal(int32 NewDayIndex, ESeason Season, EWeatherType Weather);

    // ---- IInteractableInterface ----
    virtual FText GetInteractPrompt_Implementation(APawn* InstigatorPawn) const override;
    virtual bool CanInteract_Implementation(APawn* InstigatorPawn) const override;
    virtual void Interact_Implementation(APawn* InstigatorPawn) override;

protected:
    virtual void BeginPlay() override;

private:
    /** Bật đúng 1 trong 4 mesh theo giai đoạn */
    void ApplyStageVisual(EGrowthStage Stage);

    void Die();

    /** Nhả loot ra thế giới (spawn actor vật phẩm) */
    void SpawnLoot(int32 Amount);

    /** Roll phẩm chất khi cây chín */
    void RollQuality(bool bRainbowDay, bool bWellRested, float TileNutrients);

    UPROPERTY(VisibleAnywhere, Category = "Vườn Mơ|Components")
    TObjectPtr<USceneComponent> Root;

    UPROPERTY(VisibleAnywhere, Category = "Vườn Mơ|Components")
    TObjectPtr<USceneComponent> LootOrigin;

    /** Cache mesh đã load từ CropData (tránh load lại mỗi lần đổi giai đoạn) */
    UPROPERTY()
    TArray<TObjectPtr<UStaticMesh>> CachedStageMeshes;

    bool bCached = false;
};
