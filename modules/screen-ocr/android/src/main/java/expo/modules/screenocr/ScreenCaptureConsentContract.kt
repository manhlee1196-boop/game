package expo.modules.screenocr

import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionManager
import expo.modules.kotlin.activityresult.AppContextActivityResultContract
import java.io.Serializable

/** Input của contract (không dùng dữ liệu gì, chỉ cần một kiểu Serializable). */
class ConsentOptions : Serializable

/** Kết quả người dùng đồng ý/từ chối cho phép ghi màn hình. */
class ConsentResult(val resultCode: Int, val data: Intent?)

/**
 * Hiện hộp thoại hệ thống "Bắt đầu ghi hoặc truyền màn hình của bạn?".
 * Không thể tự động cấp quyền này bằng code — luôn cần người dùng bấm đồng ý.
 */
class ScreenCaptureConsentContract :
  AppContextActivityResultContract<ConsentOptions, ConsentResult> {

  override fun createIntent(context: Context, input: ConsentOptions): Intent {
    val manager = context.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
    return manager.createScreenCaptureIntent()
  }

  override fun parseResult(input: ConsentOptions, resultCode: Int, intent: Intent?): ConsentResult =
    ConsentResult(resultCode, intent)
}
