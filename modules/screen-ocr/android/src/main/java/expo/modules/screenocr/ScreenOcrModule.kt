package expo.modules.screenocr

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.activityresult.AppContextActivityResultLauncher
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import kotlinx.coroutines.launch

/** Tuỳ chọn từ JavaScript khi bắt đầu đọc màn hình. */
class StartOptions : Record {
  @Field
  var intervalMs: Int = 1500
  @Field
  var cropTop: Double = 0.0
  @Field
  var cropBottom: Double = 1.0
  @Field
  var showOverlay: Boolean = false
  @Field
  var numbersOnly: Boolean = false
  @Field
  var maxLines: Int = 6
}

class ScreenOcrException(message: String) : Exception(message)

class ScreenOcrModule : Module() {
  private lateinit var consentLauncher:
    AppContextActivityResultLauncher<ConsentOptions, ConsentResult>

  override fun definition() = ModuleDefinition {
    Name("ScreenOcr")

    Events("onOcr", "onState")

    RegisterActivityContracts {
      consentLauncher = registerForActivityResult(ScreenCaptureConsentContract())
    }

    OnCreate {
      ScreenOcrBus.onResult = { payload ->
        appContext.mainQueue.launch {
          try {
            sendEvent("onOcr", payload)
          } catch (t: Throwable) {
            // runtime đã bị huỷ
          }
        }
      }
      ScreenOcrBus.onState = { payload ->
        appContext.mainQueue.launch {
          try {
            sendEvent("onState", payload)
          } catch (t: Throwable) {
            // runtime đã bị huỷ
          }
        }
      }
    }

    OnDestroy {
      ScreenOcrBus.onResult = null
      ScreenOcrBus.onState = null
    }

    // ---- Trạng thái ----

    AsyncFunction("isRunningAsync") { ScreenCaptureService.isRunning }

    AsyncFunction("getLatestResultAsync") {
      // Trả về JSON string cho an toàn kiểu dữ liệu qua cầu nối JS.
      ScreenOcrBus.latest?.let { payload ->
        try {
          org.json.JSONObject(payload as Map<*, *>).toString()
        } catch (t: Throwable) {
          null
        }
      }
    }

    AsyncFunction("hasOverlayPermissionAsync") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        Settings.canDrawOverlays(context)
      } else {
        true
      }
    }

    AsyncFunction("openOverlaySettingsAsync") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        val intent = Intent(
          Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
          Uri.parse("package:" + context.packageName)
        )
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
      }
      true
    }

    // ---- Điều khiển ----

    AsyncFunction("startAsync") Coroutine { options: StartOptions ->
      // Cần Activity để hiện hộp thoại xin quyền ghi màn hình của hệ thống.
      appContext.currentActivity ?: throw ScreenOcrException(
        "Không tìm thấy Activity. Hãy mở lại app rồi thử tiếp."
      )

      val consent = consentLauncher.launch(ConsentOptions())
      val data = consent.data
      if (consent.resultCode != Activity.RESULT_OK || data == null) {
        throw ScreenOcrException("Bạn chưa cho phép ứng dụng ghi màn hình.")
      }

      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      val top = options.cropTop.coerceIn(0.0, 1.0).toFloat()
      val bottom = options.cropBottom.coerceIn(0.0, 1.0).toFloat()

      val config = CaptureConfig(
        intervalMs = options.intervalMs.coerceIn(500, 10000),
        cropTop = minOf(top, bottom - 0.01f).coerceAtLeast(0f),
        cropBottom = maxOf(bottom, top + 0.01f).coerceAtMost(1f),
        showOverlay = options.showOverlay,
        numbersOnly = options.numbersOnly,
        maxLines = options.maxLines.coerceIn(1, 20)
      )

      ScreenCaptureService.start(context, consent.resultCode, data, config)
      true
    }

    AsyncFunction("stopAsync") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      ScreenCaptureService.stop(context)
      ScreenOcrBus.latest = null
      true
    }
  }
}
