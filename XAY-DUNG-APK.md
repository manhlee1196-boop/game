# 📦 Hướng dẫn tạo file APK (cài lên điện thoại Android)

App đã được cấu hình sẵn (app.json + eas.json). Có 4 cách, khuyến nghị theo thứ tự:

---

## Cách 1: Dùng ngay với Expo Go — KHÔNG cần APK (nhanh nhất)

Chỉ để **thử app**:

1. Cài **Expo Go** trên điện thoại (CH Play, miễn phí).
2. Trên máy tính chạy: `npx expo start`
3. Mở Expo Go → **Scan QR code** trên màn hình → app chạy ngay.

> Cách này tiện để test nhanh nhưng app "chạy trong Expo Go". Muốn có file
> APK cài độc lập → dùng Cách 2 hoặc 3.

---

## Cách 2: EAS Build — build trên cloud của Expo (KHUYẾN NGHỊ)

Không cần cài Android Studio, không cần Gradle, JDK... Chỉ cần:
máy tính có Node.js 18+ và **tài khoản Expo miễn phí** (dùng Google để đăng ký
tại [expo.dev](https://expo.dev)).

```bash
# 1) Cài công cụ EAS (một lần thôi)
npm i -g eas-cli

# 2) Đăng nhập tài khoản Expo
eas login

# 3) Build APK (chạy trong thư mục dự án)
npm run build:apk:eas
# = eas build --platform android --profile preview
```

- Lần đầu EAS sẽ hỏi **liên kết project** với tài khoản: chọn **Create a new
  project** (hoặc liên kết repo GitHub nếu được hỏi).
- Build chạy trên server của Expo, mất khoảng **5–15 phút**. Theo dõi tại:
  [expo.dev/dashboard](https://expo.dev/dashboard) → project của bạn → tab **Builds**.
- Xong: bấm **Download** → được file **APK** (mới nhất có tên dạng
  `app-...-android.apk`).

**Cài lên điện thoại:**
1. Copy file APK sang điện thoại (Zalo/Facebook gửi cho chính mình, Google
   Drive, USB...).
2. Bấm vào file APK trên điện thoại → cho phép *"Cài ứng dụng từ nguồn chưa
   biết"* → **Cài đặt**.

> Bản `preview` này là **APK debug** — dùng cá nhân/cửa hàng hoàn toàn bình
> thường. Muốn lên CH Play sau này dùng bản `production` (AAB + ký số, EAS tự
> quản lý khóa ký).

---

## Cách 3: Build ngay trên máy tính (cần Android Studio)

Nếu máy bạn đã cài **Android Studio** (kèm JDK 17 — cài theo gói luôn):

```bash
# 1) Tạo thư mục android/ (tự động, chỉ cần chạy 1 lần; lần sau app đổi mới
#    thì chạy lại để đồng bộ)
npm run prebuild:android
# = expo prebuild --platform android --no-install

# 2) Build APK debug
cd android
./gradlew assembleDebug        # Windows: gradlew.bat assembleDebug
```

File APK nằm tại:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

> Lần build đầu Gradle tải dependencies, mất ~10–20 phút, lần sau nhanh hơn.
>
> Hoặc lười hơn: `npm run android` (`expo run:android`) — tự build rồi cài
> thẳng vào điện thoại đang cắm USB (bật *USB debugging*).

---

## Cách 4: GitHub Actions (đã cấu hình sẵn)

Repo có sẵn workflow **Build APK (Android)** (`.github/workflows/build-apk.yml`).
Để dùng được cần 2 điều:

1. Nhánh `arena/b82602a5-game` được **merge vào `main`** (GitHub chỉ nhận
   workflow nằm trên nhánh mặc định).
2. Repo bật GitHub Actions (Settings → Actions → General → *Allow all
   actions and workflows*).

Sau đó: tab **Actions** → chọn **"Build APK (Android)"** → **Run workflow** →
chờ ~10–20 phút → vào trang run → mục **Artifacts** → tải file APK.

---

## Ghi chú

- **Cỡ APK**: khoảng 60–120 MB (chứa cả runtime React Native).
- **Thay đổi app rồi muốn APK mới**: build lại (Cách 2: chạy lại lệnh; mỗi
  build tạo bản mới trong tab Builds).
- **APK debug vs release**: bản debug (Cách 2/3/4) cài dùng cá nhân thoải mái;
  không thể "cập nhật đè" lên bản release và ngược lại — khi đổi loại thì gỡ
  bản cũ trước.
- Dữ liệu app lưu **trên điện thoại** (SQLite) + đồng bộ Google Sheets (xem
  mục ☁️ trong README).
