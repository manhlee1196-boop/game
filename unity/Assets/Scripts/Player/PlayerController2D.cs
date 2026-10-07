// ============================================================================
//  PlayerController2D.cs — Di chuyển nhân vật 2D pixel top-down (8 hướng, sprite 4 hướng)
//  Đặt tại: Assets/Scripts/Player/
//  Gắn vào: GameObject "Player" (Rigidbody2D + BoxCollider2D + SpriteRenderer + Animator)
// ============================================================================
using UnityEngine;
using VuonMo.Core;

namespace VuonMo.Player
{
    [RequireComponent(typeof(Rigidbody2D))]
    public class PlayerController2D : MonoBehaviour
    {
        [Header("Tốc độ (world unit/giây; 1 tile = 1 unit = 16 px)")]
        [Tooltip("≈ 4.5 tile/giây — nhịp đi bộ chuẩn của Stardew Valley.")]
        public float walkSpeed = 4.5f;
        public float runSpeed = 6.8f;
        [Tooltip("Gia tốc để chuyển hướng mượt nhưng vẫn 'chắc tay' kiểu pixel.")]
        public float acceleration = 40f;

        [Header("Tham chiếu")]
        public SpriteRenderer spriteRenderer;
        public Animator animator;
        public Transform shadow;              // sprite bóng đổ pixel (ellipse 16×6)

        [Header("Thông số Animator (khớp Animator Controller)")]
        public string speedParam = "Speed";
        public string directionParam = "Direction";   // 0=Down, 1=Left, 2=Right, 3=Up
        public string toolParam = "UseTool";          // trigger

        [Header("Trạng thái")]
        public bool canMove = true;
        [SerializeField] private Direction facing = Direction.Down;
        [SerializeField] private bool running;

        public Direction Facing => facing;
        public Vector2 Velocity => _rb.linearVelocity;
        public bool IsMoving => _rb.linearVelocity.sqrMagnitude > 0.02f;

        private Rigidbody2D _rb;
        private Vector2 _desired;

        private void Awake()
        {
            _rb = GetComponent<Rigidbody2D>();
            _rb.gravityScale = 0f;
            _rb.freezeRotation = true;
            _rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
            _rb.interpolation = RigidbodyInterpolation2D.Interpolate; // mượt ở 60fps, pixel vẫn sắc nét
            if (spriteRenderer == null) spriteRenderer = GetComponentInChildren<SpriteRenderer>();
            if (animator == null) animator = GetComponentInChildren<Animator>();
        }

        private void Update()
        {
            if (!canMove) { _desired = Vector2.zero; return; }

            float ix = Input.GetAxisRaw("Horizontal");
            float iy = Input.GetAxisRaw("Vertical");
            Vector2 input = new Vector2(ix, iy).normalized;

            running = Input.GetKey(KeyCode.LeftShift) && input.sqrMagnitude > 0.01f;
            _desired = input;

            if (input.sqrMagnitude > 0.01f)
            {
                // Chỉ đổi hướng sprite khi trục ngang/đứng rõ ràng (chéo giữ sprite ngang)
                facing = DirectionUtil.FromVector(input);
            }

            UpdateAnimation();
        }

        private void FixedUpdate()
        {
            Vector2 targetVelocity = _desired * (running ? runSpeed : walkSpeed);
            _rb.linearVelocity = Vector2.MoveTowards(_rb.linearVelocity, targetVelocity, acceleration * Time.fixedDeltaTime);
        }

        private void LateUpdate()
        {
            // Bóng đổ nằm dưới chân, không xoay theo nhân vật
            if (shadow != null) shadow.position = new Vector3(transform.position.x, transform.position.y - 0.05f, shadow.position.z);
        }

        private void UpdateAnimation()
        {
            if (animator == null) return;
            animator.SetFloat(speedParam, _rb.linearVelocity.magnitude);
            animator.SetInteger(directionParam, (int)facing);
        }

        // ------------------------------------------------------------------
        //  API cho hệ thống khác
        // ------------------------------------------------------------------

        /// <summary>Khoá di chuyển (khi dùng công cụ, hội thoại, ngủ, festival).</summary>
        public void SetBusy(bool busy)
        {
            canMove = !busy;
            if (busy)
            {
                _desired = Vector2.zero;
                _rb.linearVelocity = Vector2.zero;
                if (animator != null) animator.SetFloat(speedParam, 0f);
            }
        }

        /// <summary>Phát animation dùng công cụ (cuốc, tưới, thu hoạch).</summary>
        public void PlayToolAnimation()
        {
            if (animator != null) animator.SetTrigger(toolParam);
        }

        /// <summary>Ô lưới ngay trước mặt nhân vật (ô người chơi đang nhắm tới).</summary>
        public Vector3Int FacingCell()
        {
            Vector2Int d = DirectionUtil.ToCell(facing);
            Vector3 p = transform.position + new Vector3(d.x, d.y, 0f);
            return new Vector3Int(Mathf.FloorToInt(p.x), Mathf.FloorToInt(p.y), 0);
        }

        /// <summary>Ô lưới nhân vật đang đứng.</summary>
        public Vector3Int CurrentCell()
            => new Vector3Int(Mathf.FloorToInt(transform.position.x), Mathf.FloorToInt(transform.position.y), 0);

        /// <summary>Áp hệ số tốc độ theo thời tiết (mưa −8%, bão −20%, tuyết −12%).</summary>
        public void ApplyWeatherSlowdown(float multiplier)
        {
            walkSpeed = 4.5f * multiplier;
            runSpeed = 6.8f * multiplier;
        }
    }
}
