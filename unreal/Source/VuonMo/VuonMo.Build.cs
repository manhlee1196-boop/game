// ============================================================================
//  VuonMo.Build.cs — Khai báo module & dependency cho UE5
//  Đặt tại: Source/VuonMo/VuonMo.Build.cs
// ============================================================================
using UnrealBuildTool;

public class VuonMo : ModuleRules
{
    public VuonMo(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

        PublicDependencyModuleNames.AddRange(new string[]
        {
            "Core",
            "CoreUObject",
            "Engine",
            "InputCore",
            "EnhancedInput",   // Input System mới (IA_Interact = phím E)
            "UMG",             // HUD, prompt [E], túi đồ
            "Niagara",         // VFX mưa/tuyết/thu hoạch
            "GameplayTags",    // tag "Greenhouse", "Crop.Tomato"...
        });

        PrivateDependencyModuleNames.AddRange(new string[]
        {
            "Slate",
            "SlateCore",
            "AIModule",        // NPC đi lại (Behavior Tree)
            "NavigationSystem",
        });
    }
}
