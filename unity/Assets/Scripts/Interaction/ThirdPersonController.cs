// ============================================================================
//  ThirdPersonController.cs — Di chuyển nhân vật góc nhìn thứ ba
//  Đặt tại: Assets/Scripts/Interaction/  (hoặc Scripts/Player/)
//  Gắn vào: GameObject "Player" có CharacterController + Animator
// ============================================================================
using UnityEngine;

namespace VuonMo.Interaction
{
    [RequireComponent(typeof(CharacterController))]
    public class ThirdPersonController : MonoBehaviour
    {
        [Header("Tốc độ")]
        public float walkSpeed = 3.0f;
        public float runSpeed = 5.6f;
        public float rotationSmoothTime = 0.12f;
        public float acceleration = 12f;

        [Header("Nhảy & trọng lực")]
        public float jumpHeight = 0.9f;
        public float gravity = -18f;
        public float groundedOffset = -0.14f;

        [Header("Camera")]
        public Transform cameraPivot;          // node cha của Camera, thường là "PlayerCameraRoot"
        public float cameraDistance = 4.5f;
        public float mouseSensitivity = 2.2f;
        public float minPitch = -20f;
        public float maxPitch = 45f;
        public float cameraHeight = 1.55f;
        public float cameraCollisionRadius = 0.25f;

        [Header("Thời tiết ảnh hưởng")]
        public bool weatherAffectsSpeed = true;

        [Header("Animator (tuỳ chọn)")]
        public Animator animator;
        public string speedParam = "Speed";
        public string groundedParam = "Grounded";
        public string jumpParam = "Jump";

        private CharacterController _cc;
        private float _yaw, _pitch = 12f;
        private float _verticalVel;
        private Vector3 _moveVelocity;
        private float _turnVelocity;
        private bool _busy;                    // khoá di chuyển khi đang chặt cây/hội thoại
        private float _speedMultiplier = 1f;

        public bool IsRunning { get; private set; }
        public float CurrentSpeed => _moveVelocity.magnitude;

        private void Awake()
        {
            _cc = GetComponent<CharacterController>();
            if (animator == null) animator = GetComponentInChildren<Animator>();
            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
        }

        private void Update()
        {
            if (!_busy) HandleCamera();
            HandleMovement();
        }

        private void HandleCamera()
        {
            float mx = Input.GetAxis("Mouse X") * mouseSensitivity;
            float my = Input.GetAxis("Mouse Y") * mouseSensitivity;

            _yaw += mx;
            _pitch = Mathf.Clamp(_pitch - my, minPitch, maxPitch);

            if (cameraPivot == null) return;

            // Xoay thân camera theo yaw/pitch
            cameraPivot.rotation = Quaternion.Euler(_pitch, _yaw, 0f);

            // Chống camera xuyên tường
            Vector3 desired = cameraPivot.position - cameraPivot.forward * cameraDistance;
            if (Physics.SphereCast(cameraPivot.position, cameraCollisionRadius, -cameraPivot.forward,
                                   out RaycastHit hit, cameraDistance, ~0, QueryTriggerInteraction.Ignore))
            {
                desired = cameraPivot.position - cameraPivot.forward * Mathf.Max(0.6f, hit.distance - 0.1f);
            }
            cameraPivot.position = Vector3.Lerp(cameraPivot.position, desired + Vector3.up * cameraHeight * 0.1f, Time.deltaTime * 12f);
        }

        private void HandleMovement()
        {
            bool grounded = _cc.isGrounded;
            Vector3 input = new Vector3(Input.GetAxisRaw("Horizontal"), 0f, Input.GetAxisRaw("Vertical"));
            input = Vector3.ClampMagnitude(input, 1f);

            IsRunning = Input.GetKey(KeyCode.LeftShift) && input.magnitude > 0.1f;

            // Hướng di chuyển theo camera
            Vector3 camForward = cameraPivot != null ? cameraPivot.forward : transform.forward;
            camForward.y = 0f; camForward.Normalize();
            Vector3 camRight = cameraPivot != null ? cameraPivot.right : transform.right;
            camRight.y = 0f; camRight.Normalize();

            Vector3 targetMove = (camForward * input.z + camRight * input.x);

            if (!_busy && targetMove.sqrMagnitude > 0.01f)
            {
                float speed = (IsRunning ? runSpeed : walkSpeed) * _speedMultiplier;

                // Xoay nhân vật về hướng đi
                float targetAngle = Mathf.Atan2(targetMove.x, targetMove.z) * Mathf.Rad2Deg;
                float angle = Mathf.SmoothDampAngle(transform.eulerAngles.y, targetAngle, ref _turnVelocity, rotationSmoothTime);
                transform.rotation = Quaternion.Euler(0f, angle, 0f);

                _moveVelocity = Vector3.Lerp(_moveVelocity, targetMove.normalized * speed, Time.deltaTime * acceleration);
            }
            else
            {
                _moveVelocity = Vector3.Lerp(_moveVelocity, Vector3.zero, Time.deltaTime * acceleration);
            }

            // Nhảy
            if (grounded && _verticalVel < 0f) _verticalVel = groundedOffset;
            if (!_busy && grounded && Input.GetButtonDown("Jump"))
            {
                _verticalVel = Mathf.Sqrt(jumpHeight * -2f * gravity);
                if (animator != null) animator.SetTrigger(jumpParam);
            }
            _verticalVel += gravity * Time.deltaTime;

            Vector3 motion = _moveVelocity + Vector3.up * _verticalVel;
            _cc.Move(motion * Time.deltaTime);

            // Cập nhật Animator
            if (animator != null)
            {
                animator.SetFloat(speedParam, new Vector2(_moveVelocity.x, _moveVelocity.z).magnitude, 0.1f, Time.deltaTime);
                animator.SetBool(groundedParam, grounded);
            }
        }

        /// <summary>Khoá/mở di chuyển (khi hội thoại, ngồi, dùng máy móc).</summary>
        public void SetBusy(bool value) => _busy = value;

        /// <summary>Áp hệ số tốc độ do thời tiết/trang phục (mưa −10%, tuyết −15%...).</summary>
        public void SetWeatherSpeedMultiplier(float mul) => _speedMultiplier = Mathf.Clamp(mul, 0.5f, 1.5f);

        private void LateUpdate()
        {
            // Áp ảnh hưởng thời tiết mỗi khung hình (rẻ, không dùng event)
            if (!weatherAffectsSpeed) return;
            var ws = Core.WeatherSystem.Instance;
            if (ws == null) return;
            float mul = 1f;
            switch (ws.Today)
            {
                case Core.WeatherType.Rain: mul = 0.92f; break;
                case Core.WeatherType.Storm: mul = 0.8f; break;
                case Core.WeatherType.Snow: mul = 0.88f; break;
            }
            SetWeatherSpeedMultiplier(mul);
        }
    }
}
