package expo.modules.screenocr

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.Image
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.IBinder
import android.os.Looper
import android.provider.Settings
import android.util.DisplayMetrics
import android.view.WindowManager
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.Text
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.TextRecognizer
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import java.util.concurrent.atomic.AtomicBoolean

/** Tuỳ chọn đọc màn hình, được truyền từ JS xuống service. */
data class CaptureConfig(
  val intervalMs: Int = 1500,
  val cropTop: Float = 0f,
  val cropBottom: Float = 1f,
  val showOverlay: Boolean = false,
  val numbersOnly: Boolean = false,
  val maxLines: Int = 6
)

/**
 * Dịch vụ foreground: xin quyền MediaProjection (do Module xin trước), tạo VirtualDisplay
 * phủ lên màn hình, chụp khung hình theo chu kỳ rồi đưa qua ML Kit để nhận dạng chữ.
 */
class ScreenCaptureService : Service() {

  companion object {
    const val ACTION_START = "expo.modules.screenocr.action.START"
    const val ACTION_STOP = "expo.modules.screenocr.action.STOP"

    private const val EXTRA_RESULT_CODE = "resultCode"
    private const val EXTRA_DATA = "data"
    private const val EXTRA_INTERVAL = "intervalMs"
    private const val EXTRA_CROP_TOP = "cropTop"
    private const val EXTRA_CROP_BOTTOM = "cropBottom"
    private const val EXTRA_OVERLAY = "showOverlay"
    private const val EXTRA_NUMBERS_ONLY = "numbersOnly"
    private const val EXTRA_MAX_LINES = "maxLines"

    private const val CHANNEL_ID = "screen-ocr"
    private const val NOTIFICATION_ID = 8842
    private const val MAX_OCR_DIMENSION = 1600

    @Volatile
    var isRunning: Boolean = false
      private set

    fun start(context: Context, resultCode: Int, data: Intent, config: CaptureConfig) {
      val intent = Intent(context, ScreenCaptureService::class.java).apply {
        action = ACTION_START
        putExtra(EXTRA_RESULT_CODE, resultCode)
        putExtra(EXTRA_DATA, data)
        putExtra(EXTRA_INTERVAL, config.intervalMs)
        putExtra(EXTRA_CROP_TOP, config.cropTop)
        putExtra(EXTRA_CROP_BOTTOM, config.cropBottom)
        putExtra(EXTRA_OVERLAY, config.showOverlay)
        putExtra(EXTRA_NUMBERS_ONLY, config.numbersOnly)
        putExtra(EXTRA_MAX_LINES, config.maxLines)
      }
      ContextCompat.startForegroundService(context, intent)
    }

    fun stop(context: Context) {
      isRunning = false
      context.stopService(Intent(context, ScreenCaptureService::class.java))
    }
  }

  private val mainHandler = Handler(Looper.getMainLooper())
  private var captureThread: HandlerThread? = null
  private var captureHandler: Handler? = null

  private var mediaProjection: MediaProjection? = null
  private var virtualDisplay: VirtualDisplay? = null
  private var imageReader: ImageReader? = null
  private var recognizer: TextRecognizer? = null
  private var overlay: ScreenReaderOverlay? = null

  private var frameBitmap: Bitmap? = null
  private var config = CaptureConfig()
  private var screenWidth = 0
  private var screenHeight = 0
  private var active = false
  private val busy = AtomicBoolean(false)

  private val numberRegex = Regex(
    """[-+]?\d[\d.,]*(?:\s?(?:%|k|K|M|tr|tỷ|tỉ|xu|kn|KN|vàng|hột xoàn|diamond))?"""
  )

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    val thread = HandlerThread("screen-ocr-capture").also { it.start() }
    captureThread = thread
    captureHandler = Handler(thread.looper)
    recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
      stopSelf()
      return START_NOT_STICKY
    }

    // Bắt buộc: phải vào foreground (đúng loại mediaProjection) TRƯỚC khi getMediaProjection,
    // nếu không Android 14+ sẽ ném SecurityException.
    try {
      startForegroundSafely()
    } catch (t: Throwable) {
      publishError(t.message ?: "Không khởi động được dịch vụ đọc màn hình.")
      stopSelf()
      return START_NOT_STICKY
    }

    config = CaptureConfig(
      intervalMs = (intent?.getIntExtra(EXTRA_INTERVAL, 1500) ?: 1500).coerceIn(500, 10000),
      cropTop = (intent?.getFloatExtra(EXTRA_CROP_TOP, 0f) ?: 0f).coerceIn(0f, 1f),
      cropBottom = (intent?.getFloatExtra(EXTRA_CROP_BOTTOM, 1f) ?: 1f).coerceIn(0f, 1f),
      showOverlay = intent?.getBooleanExtra(EXTRA_OVERLAY, false) ?: false,
      numbersOnly = intent?.getBooleanExtra(EXTRA_NUMBERS_ONLY, false) ?: false,
      maxLines = (intent?.getIntExtra(EXTRA_MAX_LINES, 6) ?: 6).coerceIn(1, 20)
    )

    val resultCode = intent?.getIntExtra(EXTRA_RESULT_CODE, 0) ?: 0
    val data = extractProjectionData(intent)
    if (data == null) {
      publishError("Không nhận được quyền ghi màn hình. Hãy thử lại và bấm “Bắt đầu ngay”.")
      stopSelf()
      return START_NOT_STICKY
    }

    return try {
      startProjection(resultCode, data)
      START_NOT_STICKY
    } catch (t: Throwable) {
      publishError(t.message ?: "Không bắt đầu được việc ghi màn hình.")
      stopSelf()
      START_NOT_STICKY
    }
  }

  // ---------------------------------------------------------------- foreground

  private fun startForegroundSafely() {
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(CHANNEL_ID, "Đọc màn hình", NotificationManager.IMPORTANCE_LOW)
      channel.setShowBadge(false)
      manager.createNotificationChannel(channel)
    }

    val icon = if (applicationInfo.icon != 0) applicationInfo.icon else android.R.drawable.ic_menu_view
    val notification = NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle("Đang đọc màn hình")
      .setContentText("Chữ trên màn hình đang được nhận dạng")
      .setSmallIcon(icon)
      .setOngoing(true)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .build()

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION)
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
  }

  // ---------------------------------------------------------------- projection

  private fun extractProjectionData(intent: Intent?): Intent? {
    if (intent == null) return null
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      intent.getParcelableExtra(EXTRA_DATA, Intent::class.java)
    } else {
      @Suppress("DEPRECATION")
      (intent.getParcelableExtra(EXTRA_DATA) as? Intent)
    }
  }

  @Suppress("DEPRECATION")
  private fun currentDisplayMetrics(): DisplayMetrics {
    val fallback = resources.displayMetrics
    return try {
      val windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        val bounds = windowManager.maximumWindowMetrics.bounds
        DisplayMetrics().apply {
          widthPixels = bounds.width()
          heightPixels = bounds.height()
          densityDpi = fallback.densityDpi
          density = fallback.density
        }
      } else {
        DisplayMetrics().also { windowManager.defaultDisplay.getRealMetrics(it) }
      }
    } catch (t: Throwable) {
      DisplayMetrics().also {
        it.widthPixels = fallback.widthPixels
        it.heightPixels = fallback.heightPixels
        it.densityDpi = fallback.densityDpi
        it.density = fallback.density
      }
    }
  }

  private fun startProjection(resultCode: Int, data: Intent) {
    val manager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
    val projection = manager.getMediaProjection(resultCode, data)
      ?: throw IllegalStateException("Hệ thống không cấp MediaProjection. Hãy thử lại.")
    mediaProjection = projection

    val metrics = currentDisplayMetrics()
    screenWidth = metrics.widthPixels
    screenHeight = metrics.heightPixels
    if (screenWidth <= 0 || screenHeight <= 0) {
      throw IllegalStateException("Không đọc được kích thước màn hình.")
    }

    val reader = ImageReader.newInstance(screenWidth, screenHeight, PixelFormat.RGBA_8888, 2)
    imageReader = reader

    val handler = captureHandler ?: throw IllegalStateException("Luồng chụp chưa sẵn sàng.")

    virtualDisplay = projection.createVirtualDisplay(
      "screen-ocr",
      screenWidth,
      screenHeight,
      metrics.densityDpi,
      DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
      reader.surface,
      null,
      handler
    )

    projection.registerCallback(
      object : MediaProjection.Callback() {
        override fun onStop() {
          // Người dùng bấm "Dừng chia sẻ" trên thanh trạng thái.
          stopSelf()
        }
      },
      handler
    )

    active = true
    isRunning = true
    showOverlayIfNeeded()
    publishState("running", "Đang đọc màn hình")
    handler.post(tick)
  }

  // ---------------------------------------------------------------- capture loop

  private val tick = object : Runnable {
    override fun run() {
      if (!active) return
      try {
        captureOnce()
      } catch (t: Throwable) {
        publishError(t.message ?: "Lỗi khi chụp màn hình.")
      }
      captureHandler?.postDelayed(this, config.intervalMs.toLong())
    }
  }

  private fun captureOnce() {
    // Bỏ qua khung hình mới nếu ML Kit còn đang xử lý khung trước (tránh dồn hàng đợi).
    if (!busy.compareAndSet(false, true)) return

    val reader = imageReader
    if (reader == null) {
      busy.set(false)
      return
    }

    var image: Image? = null
    try {
      image = reader.acquireLatestImage()
    } catch (t: Throwable) {
      image = null
    }

    if (image != null) {
      try {
        copyImageToFrame(image)
      } finally {
        image.close()
      }
    }

    val frame = frameBitmap
    if (frame == null) {
      // Màn hình chưa thay đổi lần nào và chưa có khung hình => thử lại sau.
      busy.set(false)
      return
    }

    try {
      val region = cropRegion(frame)
      runOcr(region)
    } catch (t: Throwable) {
      // Không để cờ "bận" bị kẹt => vòng lặp chụp sẽ dừng vĩnh viễn.
      busy.set(false)
      publishError(t.message ?: "Nhận dạng chữ thất bại.")
    }
  }

  /** Copy pixel của ImageReader vào bitmap dùng lại được (giảm cấp phát bộ nhớ). */
  private fun copyImageToFrame(image: Image) {
    val plane = image.planes.firstOrNull() ?: return
    val buffer = plane.buffer
    val pixelStride = plane.pixelStride
    val rowStride = plane.rowStride
    if (pixelStride <= 0 || rowStride <= 0) return

    val padding = (rowStride - pixelStride * screenWidth).coerceAtLeast(0)
    val paddedWidth = screenWidth + padding / pixelStride
    val target = frameBitmap?.takeIf { it.width == paddedWidth && it.height == screenHeight }
      ?: Bitmap.createBitmap(paddedWidth, screenHeight, Bitmap.Config.ARGB_8888).also {
        frameBitmap = it
      }

    try {
      buffer.rewind()
      target.copyPixelsFromBuffer(buffer)
    } catch (t: Throwable) {
      frameBitmap = null
    }
  }

  /** Cắt vùng quan tâm (theo tỉ lệ 0..1) và thu nhỏ để OCR nhanh hơn. */
  private fun cropRegion(source: Bitmap): Bitmap {
    val width = if (source.width == screenWidth) source.width else screenWidth
    val base = if (source.width == width && source.height == screenHeight) {
      source
    } else {
      Bitmap.createBitmap(source, 0, 0, minOf(width, source.width), minOf(screenHeight, source.height))
    }

    val top = (config.cropTop * base.height).toInt().coerceIn(0, base.height - 1)
    val bottom = (config.cropBottom * base.height).toInt().coerceIn(top + 1, base.height)
    val cropped = if (top == 0 && bottom == base.height) {
      base
    } else {
      Bitmap.createBitmap(base, 0, top, base.width, bottom - top)
    }

    val maxSide = maxOf(cropped.width, cropped.height)
    if (maxSide <= MAX_OCR_DIMENSION) return cropped
    val scale = MAX_OCR_DIMENSION.toFloat() / maxSide
    return Bitmap.createScaledBitmap(
      cropped,
      (cropped.width * scale).toInt().coerceAtLeast(1),
      (cropped.height * scale).toInt().coerceAtLeast(1),
      true
    )
  }

  private fun runOcr(bitmap: Bitmap) {
    val client = recognizer
    if (client == null) {
      busy.set(false)
      return
    }

    client.process(InputImage.fromBitmap(bitmap, 0))
      .addOnSuccessListener { result -> handleText(result, bitmap) }
      .addOnFailureListener { t -> publishError(t.message ?: "Nhận dạng chữ thất bại.") }
      .addOnCompleteListener { busy.set(false) }
  }

  private fun handleText(result: Text, bitmap: Bitmap) {
    val lines = ArrayList<String>()
    for (block in result.textBlocks) {
      for (line in block.lines) {
        val text = line.text.trim()
        if (text.isNotEmpty()) lines.add(text)
      }
    }
    val numbers = numberRegex.findAll(result.text)
      .map { it.value.trim() }
      .filter { it.isNotEmpty() }
      .take(50)
      .toList()

    val displayed = if (config.numbersOnly) lines.filter { line -> line.any { it.isDigit() } } else lines

    val payload: Map<String, Any?> = mapOf(
      "text" to result.text,
      "lines" to displayed,
      "numbers" to numbers,
      "timestamp" to System.currentTimeMillis(),
      "width" to bitmap.width,
      "height" to bitmap.height,
      "error" to null
    )
    ScreenOcrBus.publish(payload)

    val shown = displayed.take(config.maxLines)
    mainHandler.post { overlay?.update(shown, numbers) }
  }

  // ---------------------------------------------------------------- overlay

  private fun showOverlayIfNeeded() {
    if (!config.showOverlay) return
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
      publishState("overlay_denied", "Chưa được cấp quyền hiển thị trên ứng dụng khác.")
      return
    }

    mainHandler.post {
      if (!active) return@post
      try {
        val hud = ScreenReaderOverlay(this) { stopSelf() }
        hud.show()
        hud.update(listOf("Đang chờ chữ trên màn hình..."), emptyList<String>())
        overlay = hud
      } catch (t: Throwable) {
        publishState("overlay_denied", t.message ?: "Không hiển thị được bảng nổi.")
      }
    }
  }

  // ---------------------------------------------------------------- events

  private fun publishError(message: String) {
    ScreenOcrBus.publish(
      mapOf(
        "text" to "",
        "lines" to emptyList<String>(),
        "numbers" to emptyList<String>(),
        "timestamp" to System.currentTimeMillis(),
        "width" to 0,
        "height" to 0,
        "error" to message
      )
    )
    publishState("error", message)
  }

  private fun publishState(state: String, message: String) {
    ScreenOcrBus.publishState(
      mapOf(
        "state" to state,
        "message" to message,
        "running" to isRunning
      )
    )
  }

  // ---------------------------------------------------------------- lifecycle

  override fun onDestroy() {
    active = false
    isRunning = false

    captureHandler?.removeCallbacksAndMessages(null)

    mainHandler.post {
      overlay?.hide()
      overlay = null
    }

    try {
      virtualDisplay?.release()
    } catch (t: Throwable) {
      // ignore
    }
    virtualDisplay = null

    try {
      imageReader?.close()
    } catch (t: Throwable) {
      // ignore
    }
    imageReader = null

    try {
      mediaProjection?.stop()
    } catch (t: Throwable) {
      // ignore
    }
    mediaProjection = null

    try {
      recognizer?.close()
    } catch (t: Throwable) {
      // ignore
    }
    recognizer = null

    frameBitmap = null
    captureThread?.quitSafely()
    captureThread = null
    captureHandler = null

    publishState("stopped", "Đã dừng đọc màn hình")
    super.onDestroy()
  }
}
