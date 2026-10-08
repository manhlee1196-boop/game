# 📦 Kho Hàng & Hóa Đơn — App quản lý hàng hóa, xuất hóa đơn cho Android

App di động (Android) giúp cửa hàng nhỏ quản lý **sản phẩm, tồn kho, khách hàng, bán hàng và xuất hóa đơn PDF** — làm việc **offline hoàn toàn**, có **đồng bộ dữ liệu lên Google Sheets** để sao lưu và dùng chung cho nhiều máy.

![Công nghệ](https://img.shields.io/badge/Expo_SDK-57-blue) ![Giao diện](https://img.shields.io/badge/GUI-Vietnamese-green) ![Storage](https://img.shields.io/badge/SQLite-local-orange)

## ✨ Tính năng

| Tính năng | Mô tả |
|---|---|
|  Trang chủ | Doanh thu hôm nay, số hóa đơn, cảnh báo hàng sắp hết, hóa đơn gần đây |
| 🛒 Bán hàng (POS) | Chọn hàng chạm, giỏ hàng, giảm giá, VAT 0/5/8/10%, tự trừ tồn kho |
| 📄 Xuất hóa đơn PDF | Hóa đơn tiếng Việt chuẩn (font Roboto), chia sẻ qua Zalo/email/WhatsApp hoặc lưu vào máy |
| 📦 Quản lý sản phẩm | Tên, mã hàng, danh mục, đơn vị, giá vốn/giá bán, tồn kho, cảnh báo tồn tối thiểu |
| 👥 Quản lý khách hàng | Tên, SĐT, địa chỉ; gán khách vào hóa đơn |
| 📊 Báo cáo | Doanh thu, lãi gộp, biên lãi theo Hôm nay/7 ngày/Tháng/Năm; top 10 sản phẩm bán chạy; giá trị tồn kho; hàng sắp hết |
| ☁️ Đồng bộ Google Sheets | Sao lưu & lấy dữ liệu 2 chiều qua Google Apps Script (không cần Firebase/máy chủ) |
| ⚙️ Cài đặt | Thông tin cửa hàng in trên hóa đơn, tiền tố số hóa đơn, VAT mặc định, xóa dữ liệu |

## 🚀 Chạy app

### 1. Xem trước trên trình duyệt (nhanh nhất)

```bash
npm install
npx expo start --web
```

Mở địa chỉ `http://localhost:8081` trên trình duyệt.

### 2. Chạy thử trên điện thoại Android (Expo Go)

1. Cài app **Expo Go** trên điện thoại Android (CH Play).
2. Chạy `npx expo start` trên máy tính (cùng mạng/WiFi với điện thoại).
3. Mở Expo Go → **Scan QR code** → app chạy ngay, không cần build gì.

> Điện thoại và máy tính cần cùng mạng. Dữ liệu lưu ngay trên điện thoại.

### 3. Đóng gói thành APK để cài đặt

```bash
npm i -g eas-cli
eas login
eas build --platform android --profile preview
```

Hoặc dùng **EAS Build** trên [expo.dev](https://expo.dev) (tạo tài khoản Expo miễn phí, liên kết repo). Bản build `preview` cho APK/Expo Development Client; bản `production` cho AAB lên CH Play.

## ☁️ Kết nối Google Sheets (bắt buộc đọc kỹ nếu dùng)

Dữ liệu **mặc định lưu trong điện thoại** — app chạy tốt 100% khi offline.
Google Sheets dùng để **sao lưu & xem dữ liệu dạng bảng tính** (và dùng chung cho nhiều máy).

### Các bước (làm 1 lần, ~5 phút)

1. Đăng nhập Google → mở [Google Sheets](https://sheets.google.com) → tạo bảng tính mới (VD: "Kho hàng của tôi").
2. Menu **Extensions → Apps Script**.
3. Xóa code mẫu, **dán toàn bộ nội dung file [`google-sheets-backend/Code.gs`](google-sheets-backend/Code.gs)** rồi lưu.
4. Nhấn nút **Deploy → New deployment** → chọn biểu tượng ⚙️ **Web app**.
5. Khai báo:
   - **Execute as:** `Me (tên bạn)`
   - **Who has access:** `Anyone` ← quan trọng, để app gọi được
6. Nhấn **Deploy** → Google hỏi cấp quyền → **Authorize**.
7. Copy **Web app URL** (có dạng `https://script.google.com/macros/s/XXXX/exec`).
8. Mở app → **Cài đặt → Đồng bộ Google Sheets** → dán URL → nhấn **Đồng bộ 2 chiều**.

✅ Xong! Các tab **Products, Customers, Invoices, Items, Meta** sẽ tự tạo trong bảng tính và cập nhật mỗi lần đồng bộ.

### Quy tắc đồng bộ

- **Push (Sao lưu lên Sheet):** gửi toàn bộ dữ liệu trong máy lên bảng tính (ghi đè theo `id`).
- **Pull (Lấy dữ liệu):** tải dữ liệu từ bảng tính về, gộp theo nguyên tắc *ai mới hơn (updated_at) thì thắng*.
- Xóa trong app là **xóa mềm** (đánh dấu `deleted`) nên khi sync về máy khác, dòng bị xóa vẫn được "đồng bộ sự xóa".
- Nếu có xung đột (cùng 1 sản phẩm sửa trên 2 máy), bản ghi có `updated_at` muộn hơn sẽ thắng.

## 📁 Cấu trúc dự án

```
app/                      # Giao diện (expo-router)
  (tabs)/                 # 5 tab chính: Trang chủ, Bán hàng, Sản phẩm, Hóa đơn, Khách hàng
  product-edit.tsx        # Thêm/sửa sản phẩm
  customer-edit.tsx       # Thêm/sửa khách hàng
  invoice-detail.tsx      # Chi tiết hóa đơn + chia sẻ PDF
  reports.tsx             # Báo cáo
  settings.tsx            # Cài đặt + đồng bộ Google Sheets
src/
  db.ts                   # Schema SQLite + dữ liệu mẫu lần đầu
  api.ts                  # CRUD, tạo hóa đơn, báo cáo
  sync.ts                 # Đồng bộ 2 chiều với Apps Script
  pdf.ts                  # Sinh hóa đơn PDF (jsPDF + Roboto tiếng Việt)
  share.ts                # Chia sẻ / lưu PDF
  fonts/roboto.ts         # Font Roboto base64 (hỗ trợ tiếng Việt)
  components/ui.tsx       # Component UI dùng chung
google-sheets-backend/
  Code.gs                 # Backend Google Apps Script (dán vào Apps Script)
```

## 🗄️ Dữ liệu mẫu

Lần chạy đầu app tự tạo **8 sản phẩm mẫu + 2 khách hàng mẫu** (ghi chú "Dữ liệu mẫu") để bạn dễ trải nghiệm — xóa bình thường như dữ liệu thật.

## 🔒 Quyền riêng tư

- Dữ liệu chỉ nằm trong điện thoại + Google Sheet của bạn (kết nối qua tài khoản Google của chính bạn).
- App không gửi dữ liệu đến server nào khác.

## 🧪 Chạy test (không cần điện thoại)

```bash
npm run test:core    # test logic: database, tạo hóa đơn, VAT, báo cáo, PDF (27 test)
npm run test:sheets  # test backend Google Apps Script (21 test)
npm run typecheck    # kiểm tra TypeScript
```

## 🛠️ Công nghệ

- [Expo SDK 57](https://expo.dev) + React Native 0.86 + TypeScript
- [expo-router](https://expo.dev/router) (Điều hướng), [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (Lưu trữ)
- [jsPDF](https://github.com/parallax/jsPDF) + font Roboto (Xuất PDF tiếng Việt)
- [Google Apps Script](https://developers.google.com/apps-script) (Backend Sheets, không cần server)

## ❓ Câu hỏi thường gặp

**Q: Mất điện thoại thì sao?**
A: Nếu đã từng "Sao lưu lên Sheet", tạo tài khoản Google → mở lại app → dán cùng URL → "Lấy dữ liệu" là dữ liệu về lại (sản phẩm, khách, hóa đơn).

**Q: Dùng được cho 2 điện thoại không?**
A: Có. Cả 2 máy dán cùng 1 URL, thường xuyên "Đồng bộ 2 chiều". Lưu ý nên có 1 máy là chính (bán hàng ở đó), máy kia lấy dữ liệu.

**Q: Hóa đơn có chuẩn theo mẫu của Tổng cục Thuế không?**
A: App xuất **hóa đơn bán hàng nội bộ** (dùng cho quán, tiệm, cửa hàng nhỏ bán lẻ). Nếu bạn là doanh nghiệp cần **hóa đơn điện tử có mã** gửi cơ quan thuế, cần kết nối thêm nhà cung cấp hóa đơn điện tử (MISA, VTOS, Happy CTA...) — app này không thay thế phần mềm đó.

**Q: Số hóa đơn bị trùng sau khi xóa?**
A: Số thứ tự chỉ tăng, không lặp lại kể cả sau khi xóa hóa đơn.
