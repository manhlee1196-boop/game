// ============================================================================
//  PlayerFarmerComponent.h — Component gắn vào Character người chơi:
//    - giữ công cụ đang cầm & số nước trong bình
//    - raycast tìm InteractableInterface và xử lý phím E
//    - hiển thị toast thông báo
//  Đặt tại: Source/VuonMo/Public/Interaction/PlayerFarmerComponent.h
// ============================================================================
#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "Interaction/InteractableInterface.h"
#include "PlayerFarmerComponent.generated.h"

UENUM(BlueprintType)
enum class EToolType : uint8
{
    None, Hoe, WateringCan, Sickle, Harvester, Axe, Pickaxe, FishingRod, SeedBag, Harvest
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnPromptChanged, const FText&, Prompt);

UCLASS(ClassGroup = (VuonMo), meta = (BlueprintSpawnableComponent))
class VUONMO_API UPlayerFarmerComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UPlayerFarmerComponent();

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Vườn Mơ") float InteractReach = 300.f;   // 3 m
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Vườn Mơ") EToolType CurrentTool = EToolType::None;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Vườn Mơ") int32 WaterCharges = 20;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Vườn Mơ") int32 MaxWaterCharges = 20;

    UPROPERTY(BlueprintAssignable, Category = "Vườn Mơ") FOnPromptChanged OnPromptChanged;

    virtual void BeginPlay() override;
    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

    /** Trừ 1 đơn vị nước; false nếu hết */
    UFUNCTION(BlueprintCallable, Category = "Vườn Mơ") bool ConsumeWater();
    UFUNCTION(BlueprintCallable, Category = "Vườn Mơ") void RefillWater();
    UFUNCTION(BlueprintCallable, Category = "Vườn Mơ") void SetTool(EToolType NewTool);
    UFUNCTION(BlueprintCallable, Category = "Vườn Mơ") void ShowToast(const FString& Message);

    UFUNCTION(BlueprintPure, Category = "Vườn Mơ") AActor* GetFocusedActor() const { return FocusedActor.Get(); }

protected:
    void TraceForInteractable();
    void HandleInteractInput();

    UPROPERTY() TWeakObjectPtr<AActor> FocusedActor;
    FText LastPrompt;
};
