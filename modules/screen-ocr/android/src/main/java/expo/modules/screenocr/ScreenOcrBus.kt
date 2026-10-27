package expo.modules.screenocr

/**
 * Cầu nối giữa Service (chạy nền) và Module (JS bridge).
 * Service đẩy kết quả vào đây, Module lấy ra và bắn event sang JavaScript.
 */
object ScreenOcrBus {
  @Volatile
  var latest: Map<String, Any?>? = null

  @Volatile
  var onResult: ((Map<String, Any?>) -> Unit)? = null

  @Volatile
  var onState: ((Map<String, Any?>) -> Unit)? = null

  fun publish(payload: Map<String, Any?>) {
    latest = payload
    onResult?.invoke(payload)
  }

  fun publishState(payload: Map<String, Any?>) {
    onState?.invoke(payload)
  }
}
