// ============================================================================
//  PlayerFarmerComponent.cpp
// ============================================================================
#include "Interaction/PlayerFarmerComponent.h"
#include "GameFramework/Pawn.h"
#include "GameFramework/PlayerController.h"
#include "Camera/PlayerCameraManager.h"
#include "Kismet/GameplayStatics.h"
#include "Engine/World.h"
#include "DrawDebugHelpers.h"

UPlayerFarmerComponent::UPlayerFarmerComponent()
{
    PrimaryComponentTick.bCanEverTick = true;
}

void UPlayerFarmerComponent::BeginPlay()
{
    Super::BeginPlay();
    WaterCharges = MaxWaterCharges;
}

void UPlayerFarmerComponent::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction)
{
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);
    TraceForInteractable();
    HandleInteractInput();
}

void UPlayerFarmerComponent::TraceForInteractable()
{
    APawn* Owner = Cast<APawn>(GetOwner());
    if (!Owner) return;

    APlayerController* PC = Cast<APlayerController>(Owner->GetController());
    if (!PC || !PC->PlayerCameraManager) return;

    const FVector Start = PC->PlayerCameraManager->GetCameraLocation();
    const FVector End = Start + PC->PlayerCameraManager->GetCameraRotation().Vector() * InteractReach;

    FHitResult Hit;
    FCollisionQueryParams Params;
    Params.AddIgnoredActor(Owner);
    Params.bTraceComplex = true;

    AActor* Found = nullptr;
    if (GetWorld()->LineTraceSingleByChannel(Hit, Start, End, ECC_Visibility, Params))
    {
        if (Hit.GetActor() && Hit.GetActor()->GetClass()->ImplementsInterface(UInteractableInterface::StaticClass()))
            Found = Hit.GetActor();
    }

    FocusedActor = Found;

    FText Prompt = FText::GetEmpty();
    if (Found)
    {
        IInteractableInterface::Execute_GetInteractPrompt(Found, Owner);
        Prompt = IInteractableInterface::Execute_GetInteractPrompt(Found, Owner);
    }

    if (!Prompt.EqualTo(LastPrompt))
    {
        LastPrompt = Prompt;
        OnPromptChanged.Broadcast(Prompt);
    }
}

void UPlayerFarmerComponent::HandleInteractInput()
{
    if (!FocusedActor.IsValid()) return;
    // Phím E — dùng Input Action "IA_Interact" trong Enhanced Input nếu muốn thống nhất toàn dự án
    if (GetWorld()->GetFirstPlayerController() &&
        GetWorld()->GetFirstPlayerController()->WasInputKeyJustPressed(EKeys::E))
    {
        APawn* Owner = Cast<APawn>(GetOwner());
        IInteractableInterface::Execute_Interact(FocusedActor.Get(), Owner);
    }
}

bool UPlayerFarmerComponent::ConsumeWater()
{
    if (WaterCharges <= 0) return false;
    --WaterCharges;
    return true;
}

void UPlayerFarmerComponent::RefillWater()
{
    WaterCharges = MaxWaterCharges;
    ShowToast(TEXT("Đã múc đầy bình tưới"));
}

void UPlayerFarmerComponent::SetTool(EToolType NewTool)
{
    CurrentTool = NewTool;
}

void UPlayerFarmerComponent::ShowToast(const FString& Message)
{
    // Gọi Blueprint event để UI hiển thị (WBP_Toast)
    if (GetOwner()) GetOwner()->ProcessEvent(GetOwner()->FindFunction(TEXT("BP_ShowToast")), nullptr);
    UE_LOG(LogTemp, Log, TEXT("[Vườn Mơ] %s"), *Message);
}
