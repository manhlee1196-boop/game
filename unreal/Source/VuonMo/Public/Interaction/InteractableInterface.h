// ============================================================================
//  InteractableInterface.h — Interface tương tác (tương đương IInteractable bên Unity)
//  Đặt tại: Source/VuonMo/Public/Interaction/InteractableInterface.h
//  Dùng: thêm "InteractableInterface" vào Class Settings của Blueprint
// ============================================================================
#pragma once

#include "CoreMinimal.h"
#include "UObject/Interface.h"
#include "InteractableInterface.generated.h"

UINTERFACE(MinimalAPI, Blueprintable)
class UInteractableInterface : public UInterface
{
    GENERATED_BODY()
};

class VUONMO_API IInteractableInterface
{
    GENERATED_BODY()

public:
    /** Dòng chữ gợi ý hiện trên HUD, ví dụ "[E] Tưới nước" */
    UFUNCTION(BlueprintNativeEvent, BlueprintCallable, Category = "Vườn Mơ|Tương tác")
    FText GetInteractPrompt(APawn* InstigatorPawn) const;
    virtual FText GetInteractPrompt_Implementation(APawn* InstigatorPawn) const { return FText::GetEmpty(); }

    /** Có cho phép bấm E lúc này không */
    UFUNCTION(BlueprintNativeEvent, BlueprintCallable, Category = "Vườn Mơ|Tương tác")
    bool CanInteract(APawn* InstigatorPawn) const;
    virtual bool CanInteract_Implementation(APawn* InstigatorPawn) const { return true; }

    /** Thực thi hành động khi bấm E */
    UFUNCTION(BlueprintNativeEvent, BlueprintCallable, Category = "Vườn Mơ|Tương tác")
    void Interact(APawn* InstigatorPawn);
    virtual void Interact_Implementation(APawn* InstigatorPawn) {}
};
