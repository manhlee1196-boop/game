# 🎮 Đọc dữ liệu trên màn hình game (OCR) — hướng dẫn & tài liệu kỹ thuật

Tính năng **“Đọc dữ liệu trên màn hình”** trong app này cho phép đọc chữ/số đang
hiển thị trên màn hình điện thoại (game, app khác, hoặc chính app này), rồi hiển thị
lại dưới dạng danh sách dòng + các con số tách được. Có thể bật **bảng nổi (overlay)**
để xem kết quả ngay trên game mà không cần chuyển app.

> ⚠️ Cách này **đọc những gì đang hiển thị** (chụp màn hình + OCR), **không** đọc file
> lưu game trong bộ nhớ máy. Muốn đọc file save/`/data/data/<game>` thì cần root hoặc
> người dùng tự chọn file (xem mục “Hướng khác” ở cuối).

---

## 1. Kiến trúc — chạy như thế nào?

```
┌──────────────────────────── App JS (Expo Router) ────────────────────────────┐
│ app/screen-reader.tsx  — UI: chọn chu kỳ, vùng đọc, bật bảng nổi, xem kết quả │
│ src/screen-ocr.ts      — lớp bọc: start/stop, nghe event, tách số, ghép báo cáo│
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │ JSI (requireOptionalNativeModule)
┌───────────────────────────────────▼─────────────────────────────────────────┐
│ Module native: modules/screen-ocr (Kotlin, Expo Modules API)                 │
│  ScreenOcrModule.kt        — hàm startAsync / stopAsync / … + bắn event      │
│  ScreenCaptureConsentContract.kt — hộp thoại xin quyền ghi màn hình          │
│  ScreenCaptureService.kt   — foreground service, VirtualDisplay, chụp khung  │
│  ScreenReaderOverlay.kt    — bảng nổi kết quả (TYPE_APPLICATION_OVERLAY)     │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
        MediaProjection ──► ImageReader ──► Bitmap ──► ML Kit Text Recognition
                                    │
                              ScreenOcrBus ──► event "onOcr" ──► JS
```

Chuỗi thao tác khi bấm **Bắt đầu**:

1. JS gọi `startAsync()`. Module mở hộp thoại hệ thống
   *“Bắt đầu ghi hoặc truyền màn hình của bạn?”* → người dùng phải bấm đồng ý
   (Android **không cho phép** bỏ qua bước này).
2. Module `startForegroundService()` → service gọi `startForeground(..., 
   FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION)`.
   Thứ tự này là bắt buộc từ **Android 14**: foreground service phải chạy trước khi
   gọi `getMediaProjection()`.
3. `getMediaProjection()` → `createVirtualDisplay()` gắn với `ImageReader`
   (`RGBA_8888`), kích thước bằng màn hình thật.
4. Vòng lặp `Handler.postDelayed` mỗi `intervalMs` (0,5–10 giây):
   `acquireLatestImage()` → copy pixel vào Bitmap → cắt vùng đọc (nửa trên/nửa dưới)
   → thu nhỏ còn tối đa 1600px → `InputImage.fromBitmap()` → ML Kit OCR.
5. Kết quả → `ScreenOcrBus` → (a) event `onOcr` cho JS, (b) cập nhật bảng nổi,
   đồng thời lưu lại để `getLatestResultAsync()` trả về khi mở lại app.
6. Máy ảnh không đổi hình thì `acquireLatestImage()` trả `null` — dùng lại khung gần
   nhất, nên vẫn có kết quả đều đặn.
7. **Dừng**: nút Dừng trong app, nút ✕ trên bảng nổi, thông báo hệ thống,
   hoặc người dùng chọn “Dừng chia sẻ” trên thanh trạng thái (`MediaProjection.Callback`).

**Chống vòng lặp tự đọc chính mình:** cửa sổ overlay được gắn `FLAG_SECURE`, nên
chính app không chụp lại được bảng nổi của mình (nếu không, chữ trên bảng nổi sẽ bị
OCR đọc lại và lặp vô hạn).

---

## 2. Thư viện & quyền đã thêm

| Thành phần | Ở đâu |
|---|---|
| `com.google.mlkit:text-recognition:16.0.1` (model Latin bundled, đọc được tiếng Việt có dấu) | `modules/screen-ocr/android/build.gradle` |
| `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PROJECTION` | manifest của module |
| `POST_NOTIFICATIONS` (Android 13+, xin runtime trong UI) | manifest + `PermissionsAndroid` |
| `SYSTEM_ALERT_WINDOW` (quyền “Hiển thị trên ứng dụng khác”, người dùng cấp trong Cài đặt) | manifest + `hasOverlayPermissionAsync()` |
| Service `ScreenCaptureService` với `android:foregroundServiceType="mediaProjection"` | manifest của module |

Không cần sửa `app.json` thủ công: manifest của module được tự động gộp (manifest
merging) và module được autolink nhờ `expo-module.config.json` + thư mục `modules/`.

Kiểm tra autolink:

```bash
npx expo-modules-autolinking search --platform android
# phải thấy: screen-ocr → modules/screen-ocr
```

---

## 3. Build & chạy

Tính năng này **không chạy trên web và không chạy trong Expo Go** (Expo Go không chứa
code native của bạn, và trình duyệt không có MediaProjection). Phải build APK/dev build:

```bash
# Cách A — build trên máy (cần JDK 17 + Android SDK)
npx expo prebuild --platform android --clean
npx expo run:android

# Cách B — build trên đám mây, không cần Android SDK
npx eas-cli@latest build --platform android --profile preview
```

Trong app: **Trang chủ → “Đọc dữ liệu trên màn hình”** (hoặc đường dẫn `/screen-reader`).

Lần đầu dùng bảng nổi, bấm *“Mở cài đặt cấp quyền hiển thị”* → bật
**Cho phép hiển thị trên ứng dụng khác** cho app.

Thử nhanh: bật chế độ đọc với chu kỳ 1 giây, vùng “Toàn màn hình”, rồi mở một app bất
kỳ có chữ số (đồng hồ, bảng giá, game) — kết quả sẽ hiện trong app và/hoặc bảng nổi.

---

## 4. Dùng trong code

```ts
import {
  startScreenReading, stopScreenReading, addOcrListener,
  getLatestOcrResult, extractNumbers, pickLabels, buildReportText,
} from '../src/screen-ocr';

// Bắt đầu: 1 giây/lần, chỉ nửa trên màn hình, có bảng nổi
await startScreenReading({
  intervalMs: 1000,
  region: 'top',          // 'full' | 'top' | 'bottom'
  showOverlay: true,
  numbersOnly: true,      // bảng nổi chỉ hiện dòng có số
});

// Nghe kết quả realtime (chỉ khi app đang mở)
const sub = addOcrListener((result) => {
  console.log(result.lines, result.numbers);
});

// Lấy kết quả mới nhất (kể cả khi vừa quay lại app từ game)
const latest = await getLatestOcrResult();

// Lấy vài chỉ số theo nhãn
const stats = pickLabels(latest?.lines ?? [], ['Vàng', 'Kim cương', 'Cấp', 'Sức mạnh']);
// → { 'Vàng': '1.234', 'Cấp': '57', ... }

// Chép/chia sẻ nhanh
const text = buildReportText(latest, ['Vàng', 'Cấp']);

await stopScreenReading();
sub.remove();
```

`OcrResult` có dạng:

```ts
type OcrResult = {
  text: string;       // toàn bộ chữ nhận dạng được
  lines: string[];    // từng dòng (đã lọc nếu numbersOnly)
  numbers: string[];  // các số tách được, kèm hậu tố %/k/M/tr/tỷ/xu…
  timestamp: number;
  width: number;      // kích thước khung đã OCR
  height: number;
  error: string | null;
};
```

Muốn đẩy kết quả lên Google Sheets đang dùng trong app: gọi `pickLabels()` rồi ghi
bằng `setMeta(db, 'last_game_stats', JSON.stringify(stats))` hoặc mở rộng `src/sync.ts`.

---

## 5. Tinh chỉnh

| Muốn đổi gì | Sửa ở đâu |
|---|---|
| Tách số khác (thêm đơn vị game của bạn) | `NUMBER_REGEX` trong `src/screen-ocr.ts` và `numberRegex` trong `ScreenCaptureService.kt` |
| Đọc nhanh hơn / chậm hơn | `INTERVALS` trong `app/screen-reader.tsx` (native chặn 500–10000ms) |
| Vùng đọc | `REGION_CROP` trong `src/screen-ocr.ts` (có thể thêm vùng tuỳ ý theo tỉ lệ 0–1) |
| Số dòng hiện trên bảng nổi | `maxLines` (1–20) trong `startScreenReading` |
| Màu/cỡ chữ bảng nổi | `ScreenReaderOverlay.kt` |
| Đọc cả tiếng Trung/Nhật/Hàn | thêm `com.google.mlkit:text-recognition-chinese` (…) và dùng recognizer tương ứng trong `ScreenCaptureService.onCreate()` |
| Nhận dạng offline không cần Google Play services | đã dùng bản **bundled** (`com.google.mlkit:...`), model nằm trong APK |

---

## 6. Giới hạn thật của Android (đọc kỹ trước khi kỳ vọng)

1. **Luôn phải có sự đồng ý của người dùng.** Mỗi phiên ghi màn hình đều hiện hộp
   thoại hệ thống; không thể tự động hoá, không thể “ghi nhớ” cho lần sau
   (Android 14+ còn cấm dùng lại token cũ).
2. **Không đọc được app có `FLAG_SECURE`** (ngân hàng, Netflix, một số game chống
   chụp màn hình): khung hình sẽ đen.
3. **Màn hình khoá/tắt** → không có khung hình.
4. **OCR là “đọc ảnh”, không phải đọc dữ liệu gốc**: chữ nhỏ, font lạ, hiệu ứng mờ,
   nền phức tạp, hiệu ứng chuyển động → đọc sai. Mẹo: thu hẹp “Vùng đọc”, tăng chu kỳ,
   đặt bảng nổi ở chỗ trống để nó không che vùng cần đọc.
5. **Tốn pin/nóng máy**: mỗi khung hình là một bitmap toàn màn hình + một lần OCR.
   Chu kỳ 1–2 giây là hợp lý; đừng để 0,5 giây rồi chạy hàng giờ.
6. **Bảng nổi nằm trên cùng** — một số game/launcher ẩn overlay khi vào trò chơi; khi đó
   chỉ còn cách xem kết quả trong app.
7. **Không đọc được nút/ô nhập của game qua Accessibility** thay thế được: game vẽ
   bằng OpenGL/Canvas nên cây view rỗng; muốn chính xác 100% phải đọc bộ nhớ game
   (cần root / hook) — ngoài phạm vi app này.
8. **Không đọc được `/data/data/<game>` của app khác** nếu không root: từ Android 11+
   thư mục `Android/data` cũng bị chặn. Hướng hợp lệ duy nhất là để người dùng tự chọn
   file qua hộp thoại hệ thống (`expo-file-system` `pickFileAsync` / SAF).

---

## 7. Pháp lý & điều khoản

- Chỉ dùng với **dữ liệu của chính bạn** và nội dung bạn có quyền xem.
- Đọc màn hình để tự động hoá hành vi trong game, đặc biệt game online nhiều người,
  thường **vi phạm điều khoản sử dụng** và có thể bị khoá tài khoản. Tài liệu này chỉ
  mô tả kỹ thuật, không khuyến khích gian lận.
- Phát hành lên Google Play với MediaProjection cần mô tả rõ mục đích sử dụng; app
  “trợ thủ game” có thể bị từ chối.

---

## 8. Hướng khác nếu bạn cần dữ liệu *chính xác* thay vì OCR

| Cách | Ưu | Nhược |
|---|---|---|
| Người dùng tự chọn file save (JSON/SQLite) qua SAF, đọc bằng `expo-sqlite` / `expo-file-system` | Không cần quyền đặc biệt, dữ liệu gốc, chính xác | Phải mở file bằng tay; file có thể mã hoá/định dạng nhị phân |
| Root + `su` đọc `/data/data/<game>` | Chính xác, tự động | Cần root, rủi ro bảo mật, không phát hành được lên Play |
| Gọi API của game (bắt request bằng mitmproxy trên tài khoản của bạn) | Dữ liệu đúng, realtime | API đổi liên tục, vi phạm ToS, dễ bị chặn |
| Game do bạn tự làm | Sạch nhất: export JSON/ContentProvider | Chỉ áp dụng cho game của bạn |
