// ============================================================================
//  CameraFollow2D.cs — Camera bám theo người chơi (kiểu Stardew: mượt, có dead-zone)
//  Đặt tại: Assets/Scripts/Core/
//  Gắn vào: Main Camera (cùng object với Pixel Perfect Camera + PixelArtGlobal)
//
//  Vì sao cần file này:
//   · docs/02-Unity-Setup.md §4 mục 6 ghi "tạo script CameraFollow2D" nhưng repo chưa có.
//   · Nếu dùng Cinemachine 2D thì KHÔNG cần file này — bỏ qua cũng được.
//
//  Thứ tự thực thi: -550 → chạy TRƯỚC PixelArtGlobal (-500) trong LateUpdate,
//  để camera snap nửa pixel SAU KHI đã di chuyển (nếu chạy sau, hình sẽ rung 1 pixel).
// ============================================================================
using UnityEngine;

namespace VuonMo.Core
{
    [DefaultExecutionOrder(-550)]
    public class CameraFollow2D : MonoBehaviour
    {
        [Header("Mục tiêu")]
        public Transform target;
        [Tooltip("Lệch theo trục Y để thấy nhiều đất phía trước nhân vật hơn (kiểu top-down).")]
        public Vector2 offset = new Vector2(0f, 0.5f);

        [Header("Dead-zone (đơn vị world = tile)")]
        [Tooltip("Trong khoảng này camera đứng yên → đỡ mỏi mắt khi nhân vật đi loanh quanh.")]
        public Vector2 deadZone = new Vector2(0.5f, 0.35f);

        [Header("Độ mượt")]
        [Range(1f, 40f)] public float smoothSpeed = 12f;

        [Header("Giới hạn bản đồ (tuỳ chọn)")]
        public bool clampToBounds = false;
        public Vector2 minBounds = new Vector2(0f, 0f);
        public Vector2 maxBounds = new Vector2(200f, 200f);

        private void Start()
        {
            if (target == null)
            {
                // Tự tìm GameObject có tag "Player" nếu chưa gán trong Inspector
                GameObject p = GameObject.FindGameObjectWithTag("Player");
                if (p != null) target = p.transform;
            }
            if (target != null) SnapToTarget();
        }

        private void LateUpdate()
        {
            if (target == null) return;

            float z = transform.position.z;
            Vector3 desired = new Vector3(target.position.x + offset.x,
                                          target.position.y + offset.y,
                                          z);

            // dead-zone: chỉ đuổi theo khi nhân vật ra khỏi vùng giữa
            if (Mathf.Abs(desired.x - transform.position.x) < deadZone.x) desired.x = transform.position.x;
            if (Mathf.Abs(desired.y - transform.position.y) < deadZone.y) desired.y = transform.position.y;

            if (clampToBounds)
            {
                desired.x = Mathf.Clamp(desired.x, minBounds.x, maxBounds.x);
                desired.y = Mathf.Clamp(desired.y, minBounds.y, maxBounds.y);
            }

            // làm mượt kiểu hàm mũ (khung hình không ổn định vẫn mượt)
            float t = 1f - Mathf.Exp(-smoothSpeed * Time.deltaTime);
            transform.position = Vector3.Lerp(transform.position, desired, t);
            // LƯU Ý: không snap ở đây — PixelArtGlobal.SnapCamera() lo việc đó (chạy sau).
        }

        /// <summary>Đặt camera đúng vị trí mục tiêu ngay lập tức (dùng khi bắt đầu ván / sau khi load).</summary>
        public void SnapToTarget()
        {
            if (target == null) return;
            transform.position = new Vector3(target.position.x + offset.x,
                                             target.position.y + offset.y,
                                             transform.position.z);
        }
    }
}
