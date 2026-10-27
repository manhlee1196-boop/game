package expo.modules.screenocr

import android.content.Context
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView
import kotlin.math.roundToInt

/**
 * Bảng nổi (overlay) hiển thị trên game.
 * Cần quyền SYSTEM_ALERT_WINDOW — người dùng cấp trong Cài đặt > Ứng dụng > Hiển thị trên ứng dụng khác.
 * Kéo được để dời chỗ, bấm ✕ để dừng.
 */
class ScreenReaderOverlay(
  private val context: Context,
  private val onClose: () -> Unit
) {
  private val windowManager =
    context.getSystemService(Context.WINDOW_SERVICE) as WindowManager

  private var container: LinearLayout? = null
  private var bodyView: TextView? = null
  private var numbersView: TextView? = null
  private var attached = false

  private fun dp(value: Int): Int =
    (value * context.resources.displayMetrics.density).roundToInt()

  @Suppress("DEPRECATION")
  fun show() {
    if (attached) return

    val root = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(dp(12), dp(10), dp(12), dp(12))
      background = GradientDrawable().apply {
        setColor(Color.parseColor("#E6101828"))
        cornerRadius = dp(14).toFloat()
        setStroke(dp(1), Color.parseColor("#552757D6"))
      }
    }

    val headerRow = LinearLayout(context).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER_VERTICAL
    }

    val title = TextView(context).apply {
      text = "Đọc màn hình"
      setTextColor(Color.parseColor("#C7D2FE"))
      textSize = 11f
      setTypeface(typeface, Typeface.BOLD)
    }

    val close = TextView(context).apply {
      text = "✕"
      setTextColor(Color.parseColor("#FFB4AB"))
      textSize = 15f
      setPadding(dp(12), 0, 0, dp(2))
      setOnClickListener { onClose() }
    }

    headerRow.addView(title, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
    headerRow.addView(close)

    val body = TextView(context).apply {
      setTextColor(Color.WHITE)
      textSize = 13f
      typeface = Typeface.MONOSPACE
      setLineSpacing(0f, 1.15f)
      setPadding(0, dp(4), 0, 0)
      maxWidth = dp(300)
      text = "Đang chờ chữ trên màn hình..."
    }

    val numbers = TextView(context).apply {
      setTextColor(Color.parseColor("#7DF3B0"))
      textSize = 12f
      typeface = Typeface.DEFAULT_BOLD
      setPadding(0, dp(6), 0, 0)
      maxWidth = dp(300)
      visibility = View.GONE
    }

    root.addView(headerRow)
    root.addView(body)
    root.addView(numbers)

    val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
    } else {
      WindowManager.LayoutParams.TYPE_PHONE
    }

    val params = WindowManager.LayoutParams(
      WindowManager.LayoutParams.WRAP_CONTENT,
      WindowManager.LayoutParams.WRAP_CONTENT,
      type,
      // FLAG_SECURE: bảng nổi không bị chính app chụp lại => tránh đọc nhầm chữ của chính nó.
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
        WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
        WindowManager.LayoutParams.FLAG_SECURE,
      PixelFormat.TRANSLUCENT
    ).apply {
      gravity = Gravity.TOP or Gravity.START
      x = dp(12)
      y = dp(72)
    }

    var startX = 0
    var startY = 0
    var touchX = 0f
    var touchY = 0f

    headerRow.setOnTouchListener { _, event ->
      when (event.action) {
        MotionEvent.ACTION_DOWN -> {
          startX = params.x
          startY = params.y
          touchX = event.rawX
          touchY = event.rawY
          true
        }
        MotionEvent.ACTION_MOVE -> {
          params.x = startX + (event.rawX - touchX).toInt()
          params.y = startY + (event.rawY - touchY).toInt()
          try {
            windowManager.updateViewLayout(root, params)
          } catch (t: Throwable) {
            // góc nhìn đã bị gỡ
          }
          true
        }
        else -> false
      }
    }

    windowManager.addView(root, params)

    container = root
    bodyView = body
    numbersView = numbers
    attached = true
  }

  fun update(lines: List<String>, numbers: List<String>) {
    val body = bodyView ?: return
    body.text = if (lines.isEmpty()) "Chưa đọc được chữ nào" else lines.joinToString("\n")
    val numbersView = numbersView ?: return
    val text = numbers.joinToString(" · ")
    numbersView.text = text
    numbersView.visibility = if (text.isBlank()) View.GONE else View.VISIBLE
  }

  fun hide() {
    if (!attached) return
    attached = false
    try {
      container?.let { windowManager.removeView(it) }
    } catch (t: Throwable) {
      // view đã bị gỡ trước đó
    }
    container = null
    bodyView = null
    numbersView = null
  }
}
