// ============================================================================
//  WorldHelpers2D.cs — Component nhỏ phục vụ thế giới 2D pixel
//  Đặt tại: Assets/Scripts/Core/
//  Gồm: YSort2D · SimpleFrameAnimator2D · PixelBobber · WaterSource2D · Bed2D ·
//        Interactable2D (cho NPC, thùng, cửa…) · DayNightTint2D
// ============================================================================
using System.Collections.Generic;
using UnityEngine;
using VuonMo.Data;
using VuonMo.Player;

namespace VuonMo.Core
{
    // -------------------------------------------------------------------------
    //  1) Y-SORT: vật ở dưới (y nhỏ) được vẽ trước -> nhân vật đi sau cây bị che đúng
    //     Dùng: gắn vào MỌI object động trong scene (nhân vật, NPC, cây, loot)
    // -------------------------------------------------------------------------
    [DefaultExecutionOrder(100)]
    public class YSort2D : MonoBehaviour
    {
        [Tooltip("Độ lệch theo trục Y (world unit × 100). Cao hơn = vẽ trên.")]
        public int sortOffset = 0;

        [Tooltip("Tự tìm tất cả SpriteRenderer trong object và con (tắt để tối ưu khi gọi tay).")]
        public bool autoCollect = true;

        [Tooltip("Bật: cập nhật mỗi khung hình (đối tượng động). Tắt: chỉ cập nhật khi Start (vật tĩnh).")]
        public bool dynamic = true;

        private SpriteRenderer[] _renderers;

        private void Awake()
        {
            if (autoCollect) RefreshRenderers();
        }

        public void RefreshRenderers() => _renderers = GetComponentsInChildren<SpriteRenderer>(true);

        public void SetDynamic(bool value) => dynamic = value;

        private void Start() => Apply();

        private void LateUpdate() { if (dynamic) Apply(); }

        public void Apply()
        {
            if (_renderers == null || _renderers.Length == 0) return;
            int order = Mathf.RoundToInt(transform.position.y * -100f) + sortOffset;
            foreach (var r in _renderers)
            {
                if (r == null) continue;
                r.sortingOrder = order;
            }
            // Nếu object có nhiều sprite con cần lệch nhau (ví dụ NPC có bong bóng hội thoại),
            // hãy cho sprite đó sang Sorting Layer riêng phía trên.
        }
    }

    // -------------------------------------------------------------------------
    //  2) ANIMATION KHUNG HÌNH PIXEL (2–8 khung, không cần Animator)
    //     Dùng cho: nước chảy, lửa, đèn nhấp nháy, cờ bay, gia súc nhỏ
    // -------------------------------------------------------------------------
    public class SimpleFrameAnimator2D : MonoBehaviour
    {
        public SpriteRenderer target;
        public Sprite[] frames;
        [Tooltip("Số khung hình mỗi giây.")]
        public float fps = 6f;
        public bool loop = true;
        public bool playOnAwake = true;
        [Tooltip("Ngẫu nhiên hoá khung bắt đầu để nhiều object không nhảy cùng lúc.")]
        public bool randomizeStart = true;

        private float _timer;
        private int _index;
        private bool _playing;

        private void Awake()
        {
            if (target == null) target = GetComponent<SpriteRenderer>();
            if (randomizeStart && frames != null && frames.Length > 0) _index = Random.Range(0, frames.Length);
        }

        private void OnEnable() { if (playOnAwake) Play(); }

        public void Play()
        {
            _playing = true;
            if (frames == null || frames.Length == 0) return;
            target.sprite = frames[Mathf.Clamp(_index, 0, frames.Length - 1)];
        }

        public void Stop() => _playing = false;
        public void SetFrames(Sprite[] newFrames, float newFps = -1f)
        {
            frames = newFrames;
            if (newFps > 0f) fps = newFps;
            _index = 0;
            if (_playing && frames.Length > 0) target.sprite = frames[0];
        }

        private void Update()
        {
            if (!_playing || frames == null || frames.Length <= 1) return;
            _timer += Time.deltaTime;
            float frameTime = 1f / Mathf.Max(0.5f, fps);
            if (_timer < frameTime) return;
            _timer -= frameTime;
            _index++;
            if (_index >= frames.Length)
            {
                if (loop) _index = 0;
                else { _index = frames.Length - 1; _playing = false; }
            }
            target.sprite = frames[_index];
        }
    }

    // -------------------------------------------------------------------------
    //  3) NHẤP NHÔ PIXEL (vật phẩm trang trí, hoa, bong bóng hội thoại)
    // -------------------------------------------------------------------------
    public class PixelBobber : MonoBehaviour
    {
        [Tooltip("Biên độ tính bằng pixel (1 px = 1/16 world unit).")]
        public float amplitudePixels = 2f;
        public float speed = 3f;
        public bool randomPhase = true;
        [Tooltip("Lắc ngang nhẹ (dùng cho bong bóng hội thoại).")]
        public float swayX = 0f;

        private Vector3 _base;
        private float _phase;

        private void Start()
        {
            _base = transform.localPosition;
            _phase = randomPhase ? Random.Range(0f, Mathf.PI * 2f) : 0f;
        }

        private void LateUpdate()
        {
            float amp = amplitudePixels / 16f;
            float t = Time.time * speed + _phase;
            transform.localPosition = _base + new Vector3(Mathf.Sin(t * 1.3f) * swayX, Mathf.Sin(t) * amp, 0f);
        }
    }

    // -------------------------------------------------------------------------
    //  4) NGUỒN NƯỚC (giếng, hồ, máy bơm) — đến gần bấm E để múc đầy bình
    // -------------------------------------------------------------------------
    public class WaterSource2D : Interactable2D
    {
        private void Reset() { promptText = "[E] Múc đầy bình tưới"; }

        protected override void OnInteract(PlayerInteractor2D player)
        {
            player.RefillWater();
        }
    }

    // -------------------------------------------------------------------------
    //  5) GIƯỜNG — ngủ để sang ngày mới và tự động lưu game
    // -------------------------------------------------------------------------
    public class Bed2D : Interactable2D
    {
        [Header("Lưu game khi ngủ")]
        public bool autoSave = true;
        public int saveSlot = 0;

        [Header("Âm thanh / hiệu ứng")]
        public AudioClip sleepSound;

        private void Reset() { promptText = "[E] Ngủ (sang ngày mới)"; }

        protected override void OnInteract(PlayerInteractor2D player)
        {
            if (TimeManager.Instance == null) return;

            bool beforeMidnight = TimeManager.Instance.Hour < 24;

            if (autoSave && SaveSystem.SaveSystem.Save(saveSlot, null))
                FloatingText.Instance?.ShowToast("Đã lưu game");

            TimeManager.Instance.Sleep(beforeMidnight);
            FloatingText.Instance?.ShowToast($"Ngày {TimeManager.Instance.DayOfSeason} — {TimeManager.Instance.SeasonName(TimeManager.Instance.CurrentSeason)}");
        }
    }

    // -------------------------------------------------------------------------
    //  6) INTERACTABLE2D — lớp cơ sở cho mọi thứ bấm E được (NPC, thùng, cửa, biển…)
    //     Không cần collider nếu PlayerInteractor2D quét theo lưới; nhưng nếu muốn
    //     tương tác tự do (không theo lưới) thì gắn thêm Collider2D và dùng trigger.
    // -------------------------------------------------------------------------
    public class Interactable2D : MonoBehaviour
    {
        [Header("Hiển thị")]
        public string promptText = "[E] Tương tác";
        [Tooltip("Sprite biểu tượng '!' hoặc dấu '…' hiện khi người chơi lại gần.")]
        public GameObject indicator;

        [Header("Chỉ hoạt động trong khung giờ")]
        public bool limitByHours = false;
        public int openHour = 8;
        public int closeHour = 18;

        protected virtual void Start()
        {
            if (indicator != null) indicator.SetActive(false);
        }

        public virtual bool CanInteract(PlayerInteractor2D player)
        {
            if (limitByHours && TimeManager.Instance != null)
            {
                int h = TimeManager.Instance.Hour;
                return h >= openHour && h < closeHour;
            }
            return true;
        }

        public virtual string GetPrompt(PlayerInteractor2D player)
            => CanInteract(player) ? promptText : "";

        /// <summary>Được PlayerInteractor2D gọi khi bấm E.</summary>
        public void Interact(PlayerInteractor2D player)
        {
            if (!CanInteract(player)) return;
            OnInteract(player);
        }

        protected virtual void OnInteract(PlayerInteractor2D player) { }

        protected virtual void OnTriggerEnter2D(Collider2D other)
        {
            if (indicator != null && other.CompareTag("Player")) indicator.SetActive(true);
        }

        protected virtual void OnTriggerExit2D(Collider2D other)
        {
            if (indicator != null && other.CompareTag("Player")) indicator.SetActive(false);
        }
    }

    // -------------------------------------------------------------------------
    //  7) TINT NGÀY/ĐÊM — lớp phủ toàn màn hình (không cần URP Light2D)
    //     Chạy được ở cả Built-in và URP → an toàn cho mọi cấu hình project.
    // -------------------------------------------------------------------------
    public class DayNightTint2D : MonoBehaviour
    {
        [Header("Lớp phủ (SpriteRenderer 1×1 pixel trắng, sorting layer trên cùng)")]
        public SpriteRenderer overlay;

        [Header("Màu theo khung giờ")]
        public Color morningTint = new Color(1f, 0.95f, 0.85f, 0.08f);
        public Color dayTint = new Color(1f, 1f, 1f, 0f);
        public Color sunsetTint = new Color(1f, 0.7f, 0.45f, 0.20f);
        public Color nightTint = new Color(0.15f, 0.22f, 0.45f, 0.55f);
        public Color lateNightTint = new Color(0.08f, 0.12f, 0.32f, 0.68f);

        [Header("Mùa ảnh hưởng thêm")]
        public SeasonTheme[] themes = new SeasonTheme[4];
        public bool blendSeasonTint = true;

        private Season _season = Season.Spring;
        private Color _seasonTint = Color.white;

        private void Start()
        {
            if (overlay != null) FitOverlayToCamera();
            if (TimeManager.Instance != null)
            {
                TimeManager.Instance.OnMinuteTick += _ => Refresh();
                TimeManager.Instance.OnSeasonChanged += s => { _season = s; CacheSeasonTint(); Refresh(); };
                _season = TimeManager.Instance.CurrentSeason;
            }
            CacheSeasonTint();
            Refresh();
        }

        private void LateUpdate() { if (overlay != null) FitOverlayToCamera(); }

        private void CacheSeasonTint()
        {
            _seasonTint = Color.white;
            if (!blendSeasonTint || themes == null) return;
            foreach (var t in themes)
                if (t != null && t.season == _season) { _seasonTint = t.globalLightColor; break; }
        }

        private void Refresh()
        {
            if (overlay == null || TimeManager.Instance == null) return;
            var tm = TimeManager.Instance;
            float hour = tm.Hour + tm.Minute / 60f;

            Color tint;
            if (hour < 7f) tint = Color.Lerp(lateNightTint, morningTint, Mathf.InverseLerp(5f, 7f, hour));
            else if (hour < 11f) tint = Color.Lerp(morningTint, dayTint, Mathf.InverseLerp(7f, 11f, hour));
            else if (hour < 17f) tint = dayTint;
            else if (hour < 20f) tint = Color.Lerp(dayTint, sunsetTint, Mathf.InverseLerp(17f, 20f, hour));
            else if (hour < 23f) tint = Color.Lerp(sunsetTint, nightTint, Mathf.InverseLerp(20f, 23f, hour));
            else tint = nightTint;

            // Áp thêm sắc thái mùa (nhân màu, không đổi alpha)
            tint = new Color(tint.r * _seasonTint.r, tint.g * _seasonTint.g, tint.b * _seasonTint.b, tint.a);

            overlay.color = tint;
        }

        /// <summary>Giãn lớp phủ vừa khung camera (gọi mỗi khung hình vì camera di chuyển).</summary>
        private void FitOverlayToCamera()
        {
            var cam = Camera.main;
            if (cam == null || overlay == null || overlay.sprite == null) return;

            float h = cam.orthographicSize * 2f;
            float w = h * cam.aspect;
            overlay.transform.position = new Vector3(cam.transform.position.x, cam.transform.position.y, 10f);
            // sprite gốc là 1×1 pixel với PPU 16 -> tỉ lệ cần = kích thước world × PPU
            overlay.transform.localScale = new Vector3(w * overlay.sprite.pixelsPerUnit * 1.02f,
                                                       h * overlay.sprite.pixelsPerUnit * 1.02f, 1f);
        }

        /// <summary>Nhá sáng trắng khi sét đánh (gọi từ WeatherFX2D).</summary>
        public void FlashLightning(float duration = 0.12f)
        {
            StopAllCoroutines();
            StartCoroutine(FlashRoutine(duration));
        }

        private System.Collections.IEnumerator FlashRoutine(float duration)
        {
            if (overlay == null) yield break;
            Color before = overlay.color;
            overlay.color = new Color(1f, 1f, 1f, 0.85f);
            yield return new WaitForSeconds(duration);
            overlay.color = before;
        }
    }
}
