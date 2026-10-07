// ============================================================================
//  CropActor.cpp — Cài đặt logic cây trồng (bản UE5 tương đương CropInstance)
// ============================================================================
#include "Farming/CropActor.h"
#include "Components/StaticMeshComponent.h"
#include "Kismet/GameplayStatics.h"
#include "Engine/StaticMesh.h"
#include "Core/GameTimeSubsystem.h"
#include "Core/WeatherSubsystem.h"
#include "Interaction/PlayerFarmerComponent.h"
#include "NiagaraFunctionLibrary.h"

ACropActor::ACropActor()
{
    PrimaryActorTick.bCanEverTick = false;   // Không tick — mọi thứ chạy theo event ngày mới

    Root = CreateDefaultSubobject<USceneComponent>(TEXT("Root"));
    SetRootComponent(Root);

    LootOrigin = CreateDefaultSubobject<USceneComponent>(TEXT("LootOrigin"));
    LootOrigin->SetupAttachment(Root);
    LootOrigin->SetRelativeLocation(FVector(0.f, 0.f, 30.f));

    // Tạo sẵn 4 component mesh cho 4 giai đoạn
    StageComponents.SetNum(4);
    const TCHAR* Names[4] = { TEXT("Stage0_Seed"), TEXT("Stage1_Sprout"), TEXT("Stage2_Mature"), TEXT("Stage3_Fruiting") };
    for (int32 i = 0; i < 4; ++i)
    {
        UStaticMeshComponent* Comp = CreateDefaultSubobject<UStaticMeshComponent>(Names[i]);
        Comp->SetupAttachment(Root);
        Comp->SetCollisionEnabled(ECollisionEnabled::NoCollision);
        Comp->SetGenerateOverlapEvents(false);
        Comp->SetVisibility(i == 0);
        StageComponents[i] = Comp;
    }
}

void ACropActor::BeginPlay()
{
    Super::BeginPlay();

    // Đăng ký nhận event ngày mới từ GameTimeSubsystem (thay cho Update() mỗi khung hình)
    if (UGameInstance* GI = GetGameInstance())
    {
        if (UGameTimeSubsystem* TimeSys = GI->GetSubsystem<UGameTimeSubsystem>())
        {
            TimeSys->OnNewDay.AddDynamic(this, &ACropActor::HandleNewDayInternal);
        }
    }

    if (CropData && !bCached) InitializeCrop(CropData, OwningTile, WateredDays);
}

void ACropActor::InitializeCrop(UCropDataAsset* InData, AActor* InTile, int32 StartingWateredDays)
{
    CropData = InData;
    OwningTile = InTile;
    WateredDays = FMath::Max(0, StartingWateredDays);
    bIsDead = false;

    // Cache 4 mesh từ Data Asset
    CachedStageMeshes.SetNum(4);
    for (int32 i = 0; i < 4; ++i)
    {
        CachedStageMeshes[i] = (CropData && CropData->StageMeshes.IsValidIndex(i))
            ? CropData->StageMeshes[i].LoadSynchronous()
            : nullptr;

        if (StageComponents.IsValidIndex(i))
        {
            StageComponents[i]->SetStaticMesh(CachedStageMeshes[i]);
            if (CropData && CropData->StageMeshScale.IsValidIndex(i))
                StageComponents[i]->SetRelativeScale3D(CropData->StageMeshScale[i]);
        }
    }
    bCached = true;

    ApplyStageVisual(CropData ? CropData->StageFromDays(WateredDays) : EGrowthStage::Seed);
}

// ---------------------------------------------------------------------------
//  NGÀY MỚI: tăng trưởng / héo / chết  (tương đương CropInstance.HandleNewDay)
// ---------------------------------------------------------------------------
void ACropActor::OnNewDay(int32 NewDayIndex, ESeason Season, EWeatherType Weather, float TileMoisture, bool bIsGreenhouse)
{
    if (bIsDead || !CropData) return;

    const bool bRainWaters = (Weather == EWeatherType::Rain || Weather == EWeatherType::Storm);
    const bool bTileWet = TileMoisture >= CropData->RequiredMoisture;
    const bool bGotWater = !CropData->bNeedsWater || bRainWaters || bTileWet;

    if (bGotWater) { DryStreak = 0; WateredDays++; }
    else           { DryStreak++; }

    // 1) Chết vì khô hạn
    if (DryStreak >= CropData->DryDaysBeforeWither + CropData->WitherDaysBeforeDeath)
    {
        Die();
        return;
    }

    // 2) Héo
    if (DryStreak >= CropData->DryDaysBeforeWither)
    {
        ApplyStageVisual(EGrowthStage::Withering);
        return;
    }

    // 3) Mùa Đông giết cây ngoài trời
    if (Season == ESeason::Winter && !CropData->bSurvivesWinterOutdoor && !bIsGreenhouse)
    {
        Die();
        return;
    }

    // 4) Bão/tuyết làm gãy cây
    if (UGameInstance* GI = GetGameInstance())
    {
        if (UWeatherSubsystem* WS = GI->GetSubsystem<UWeatherSubsystem>())
        {
            const float BreakChance = WS->GetCropBreakChance(Weather);
            if (BreakChance > 0.f && FMath::FRand() < BreakChance) { Die(); return; }
        }
    }

    // 5) Lớn lên theo số ngày có nước tích luỹ
    const EGrowthStage Target = CropData->StageFromDays(WateredDays);
    if (Target != CurrentStage)
    {
        if (Target == EGrowthStage::Fruiting)
        {
            const bool bRainbowDay = (Weather == EWeatherType::Rainbow);
            RollQuality(bRainbowDay, /*bWellRested*/ false, TileMoisture);
        }
        ApplyStageVisual(Target);
    }
}

// ---------------------------------------------------------------------------
//  ĐỔI MODEL 3D THEO GIAI ĐOẠN
// ---------------------------------------------------------------------------
void ACropActor::ApplyStageVisual(EGrowthStage NewStage)
{
    CurrentStage = NewStage;

    bool bWithering = (NewStage == EGrowthStage::Withering);
    int32 ActiveIndex = FMath::Clamp(static_cast<int32>(NewStage), 0, 3);
    if (bWithering) ActiveIndex = 2;   // dùng model trưởng thành + tint khô

    for (int32 i = 0; i < StageComponents.Num(); ++i)
    {
        if (!StageComponents[i]) continue;
        const bool bVisible = (NewStage == EGrowthStage::Dead) ? false : (i == ActiveIndex);
        StageComponents[i]->SetVisibility(bVisible);
    }

    // Héo: đổi màu vật liệu sang nâu khô bằng Dynamic Material Instance
    if (bWithering && StageComponents.IsValidIndex(ActiveIndex))
    {
        if (UMaterialInstanceDynamic* MID = StageComponents[ActiveIndex]->CreateAndSetMaterialInstanceDynamic(0))
            MID->SetVectorParameterValue(TEXT("TintColor"), FLinearColor(0.75f, 0.65f, 0.35f, 1.f));
    }

    OnStageChanged.Broadcast(this, CurrentStage);
}

void ACropActor::Die()
{
    bIsDead = true;
    ApplyStageVisual(EGrowthStage::Dead);
    for (auto* Comp : StageComponents) if (Comp) Comp->SetVisibility(false);
}

// ---------------------------------------------------------------------------
//  PHẨM CHẤT
// ---------------------------------------------------------------------------
void ACropActor::RollQuality(bool bRainbowDay, bool bWellRested, float TileNutrients)
{
    if (!CropData) return;
    const float NutrientBonus = (TileNutrients - 0.5f) * 0.4f;
    const float Roll = FMath::FRand() + NutrientBonus + (bRainbowDay ? 0.25f : 0.f) + (bWellRested ? 0.05f : 0.f);

    if (Roll >= 1.0f - CropData->RainbowChance)     Quality = ECropQuality::Rainbow;
    else if (Roll >= 0.85f - CropData->GoldChance)  Quality = ECropQuality::Gold;
    else if (Roll >= 0.60f - CropData->SilverChance)Quality = ECropQuality::Silver;
    else                                            Quality = ECropQuality::Normal;
}

// ---------------------------------------------------------------------------
//  THU HOẠCH + NHẢ LOOT
// ---------------------------------------------------------------------------
int32 ACropActor::Harvest()
{
    if (!IsRipe() || !CropData) return 0;

    int32 Amount = FMath::RandRange(CropData->MinYield, CropData->MaxYield);
    if (Quality == ECropQuality::Rainbow) Amount += 1;

    SpawnLoot(Amount);

    // VFX (Niagara) + âm thanh
    if (!CropData->HarvestVFX.IsNull())
        UNiagaraFunctionLibrary::SpawnSystemAtLocation(this, CropData->HarvestVFX.LoadSynchronous(), LootOrigin->GetComponentLocation());

    OnHarvested.Broadcast(this, Amount);

    // Cây tái sinh -> quay lại giai đoạn trưởng thành
    if (CropData->bRegrows)
    {
        const int32 MatureThreshold = CropData->CumulativeDays(3);
        const int32 RegrowDays = CropData->DaysPerStage.IsValidIndex(3) ? CropData->DaysPerStage[3] : 2;
        WateredDays = MatureThreshold - FMath::Max(1, RegrowDays);
        Quality = ECropQuality::Normal;
        ApplyStageVisual(EGrowthStage::Mature);
    }
    else
    {
        Destroy();   // cây một vụ: xoá actor, ô đất được PlayerFarmerComponent dọn lại
    }
    return Amount;
}

void ACropActor::SpawnLoot(int32 Amount)
{
    if (!CropData) return;

    UClass* LootClass = CropData->HarvestItem.WorldActorClass.LoadSynchronous();
    if (!LootClass) return;

    const int32 Clusters = FMath::Clamp(Amount, 1, 3);
    const int32 PerCluster = FMath::CeilToInt(Amount / static_cast<float>(Clusters));

    for (int32 i = 0; i < Clusters; ++i)
    {
        const int32 Stack = (i == Clusters - 1) ? Amount - PerCluster * (Clusters - 1) : PerCluster;
        if (Stack <= 0) continue;

        const FVector Dir = FRotator(0.f, FMath::FRandRange(-35.f, 35.f), 0.f).Vector();
        const FVector SpawnLoc = LootOrigin->GetComponentLocation() + Dir * FMath::FRandRange(10.f, 60.f);

        FActorSpawnParameters Params;
        Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AdjustIfPossibleButAlwaysSpawn;
        AActor* Loot = GetWorld()->SpawnActor<AActor>(LootClass, SpawnLoc, FRotator::ZeroRotator, Params);

        // Nếu loot actor có interface "Pickupable", truyền số lượng & phẩm chất
        if (Loot && Loot->GetClass()->ImplementsInterface(UInteractableInterface::StaticClass()))
        {
            // Gọi Blueprint event SetLootAmount(Stack, Quality) nếu có, hoặc set property trực tiếp
            if (UFunction* Fn = Loot->FindFunction(TEXT("SetLootAmount")))
            {
                struct { int32 Amount; ECropQuality Q; } Args{ Stack, Quality };
                Loot->ProcessEvent(Fn, &Args);
            }
        }
    }
}

void ACropActor::HandleNewDayInternal(int32 NewDayIndex, ESeason Season, EWeatherType Weather)
{
    // Lấy độ ẩm ô đất qua Blueprint interface GetMoisture() nếu có
    float Moisture = 0.f;
    if (OwningTile)
    {
        if (UFunction* Fn = OwningTile->FindFunction(TEXT("GetMoisture")))
        {
            struct { float ReturnValue; } Args{ 0.f };
            OwningTile->ProcessEvent(Fn, &Args);
            Moisture = Args.ReturnValue;
        }
    }

    bool bGreenhouse = false;
    // (tuỳ chọn) kiểm tra nhà kính qua tag "Greenhouse"
    if (OwningTile) bGreenhouse = OwningTile->ActorHasTag(TEXT("Greenhouse"));

    OnNewDay(NewDayIndex, Season, Weather, Moisture, bGreenhouse);
}

void ACropActor::WaterIt()
{
    DryStreak = 0;
    // Tăng ẩm cho ô đất: gọi Blueprint event trên OwningTile nếu có
    if (OwningTile)
    {
        if (UFunction* Fn = OwningTile->FindFunction(TEXT("AddMoisture")))
        {
            struct { float Amount; } Args{ 0.4f };
            OwningTile->ProcessEvent(Fn, &Args);
        }
    }
}

// ---------------------------------------------------------------------------
//  TRUY VẤN
// ---------------------------------------------------------------------------
bool ACropActor::IsThirsty(float TileMoisture, bool bRaining) const
{
    if (!CropData || !CropData->bNeedsWater) return false;
    if (bRaining) return false;
    return TileMoisture < CropData->RequiredMoisture;
}

int32 ACropActor::DaysLeftToRipe() const
{
    if (!CropData) return 0;
    return FMath::Max(0, CropData->CumulativeDays(3) - WateredDays);
}

// ---------------------------------------------------------------------------
//  TƯƠNG TÁC (phím E) — tương đương IInteractable bên Unity
// ---------------------------------------------------------------------------
FText ACropActor::GetInteractPrompt_Implementation(APawn* InstigatorPawn) const
{
    if (!CropData) return FText::GetEmpty();
    if (bIsDead) return FText::FromString(TEXT("[E] Dọn cây chết"));
    if (IsRipe()) return FText::FromString(FString::Printf(TEXT("[E] Thu hoạch %s"), *CropData->DisplayName.ToString()));

    if (IsThirsty(0.0f, false)) return FText::FromString(TEXT("[E] Tưới nước"));

    return FText::FromString(FString::Printf(TEXT("%s — còn %d ngày"),
        *CropData->DisplayName.ToString(), DaysLeftToRipe()));
}

bool ACropActor::CanInteract_Implementation(APawn* InstigatorPawn) const
{
    return !bIsDead || true;
}

void ACropActor::Interact_Implementation(APawn* InstigatorPawn)
{
    if (bIsDead) { Destroy(); return; }

    if (IsRipe())
    {
        const int32 Got = Harvest();
        if (UPlayerFarmerComponent* Farmer = InstigatorPawn ? InstigatorPawn->FindComponentByClass<UPlayerFarmerComponent>() : nullptr)
            Farmer->ShowToast(FString::Printf(TEXT("Thu hoạch +%d"), Got));
        return;
    }

    if (UPlayerFarmerComponent* Farmer = InstigatorPawn ? InstigatorPawn->FindComponentByClass<UPlayerFarmerComponent>() : nullptr)
    {
        // Cần bình tưới còn nước
        if (Farmer->ConsumeWater())
        {
            WaterIt();
            Farmer->ShowToast(TEXT("Đã tưới cây"));
        }
        else
        {
            Farmer->ShowToast(TEXT("Bình đã hết nước"));
        }
    }
}
