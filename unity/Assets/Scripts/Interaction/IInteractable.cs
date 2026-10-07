// ============================================================================
//  IInteractable.cs — Hợp đồng cho mọi thứ có thể bấm phím E trong game
//  Đặt tại: Assets/Scripts/Interaction/
// ============================================================================
using UnityEngine;

namespace VuonMo.Interaction
{
    public interface IInteractable
    {
        /// <summary>Transform để tính khoảng cách & hiện prompt.</summary>
        Transform InteractTransform { get; }

        /// <summary>Dòng chữ hiện trên HUD, ví dụ: "[E] Tưới nước".</summary>
        string GetPrompt(PlayerInteractor player);

        /// <summary>Có cho phép tương tác ngay bây giờ không (đủ gần, đúng điều kiện).</summary>
        bool CanInteract(PlayerInteractor player);

        /// <summary>Thực thi hành động khi người chơi bấm E.</summary>
        void Interact(PlayerInteractor player);
    }
}
