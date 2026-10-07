# 🎣 Câu Cá 3D

Game câu cá 3D trên trình duyệt, xây bằng **Three.js** + **Vite**. Đứng trên cầu cảng, quăng câu xuống mặt hồ sóng nước, giật câu đúng lúc và kéo cá về bờ!

## 🚀 Chạy game

```bash
npm install
npm run dev
```

Mở `http://localhost:5173` trên trình duyệt.

Build sản phẩm:

```bash
npm run build
npm run preview
```

## 🎮 Cách chơi

| Thao tác | Tác dụng |
|---|---|
| **Giữ Chuột trái** | Nạp lực quăng câu (thanh lực rung qua rung lại) |
| **Thả Chuột trái** | Quăng phao ra hồ |
| **Click Chuột trái** khi phao chìm, có dấu `!` | Giật câu! |
| **Giữ / thả Chuột trái** khi đang kéo cá | Kéo dây / thả lỏng (tránh đứt dây!) |
| **Kéo Chuột phải** | Ngắm nhìn quanh cảnh |
| **A / D** (hoặc ← →) | Xoay trái phải |
| **W / S** (hoặc ↑ ↓) | Ngẩng / cúi |
| **R** | Thu dây về |
| **C** | Mở / đóng sổ tay câu cá |
| **M** | Bật / tắt âm thanh |

## 🐟 Mini-game kéo cá

- Thanh **độ căng dây**: giữ chuột để kéo cá lại gần, thả ra khi dây căng đỏ — **căng 100% quá lâu là đứt dây!**
- Cá có **sức khỏe** (stamina): cá to khỏe quẫy mạnh hơn, có những đợt "bứt tốc" nguy hiểm.
- Kéo được cá về sát bờ (`0 m`) là **câu được**!

## 📖 8 loài cá

| Loài | Độ hiếm |
|---|---|
| Cá Rô, Cá Chép | Thường |
| Cá Hồi, Cá Thu, Cá Vàng | Hiếm |
| Cá Ngừ | Rất hiếm |
| Cá Mập, Cá Mặt Trời | Huyền thoại |

Mỗi loài có cân nặng, chiều dài, độ khó riêng — cá hiếm cho nhiều điểm hơn. Kết quả được lưu vào **localStorage** kèm sổ tay tra cứu.

## ✨ Tính năng

- Nước shader thời gian thực (sóng sine chồng, fresnel, lóng lánh mặt trời)
- Bầu trời gradient, mặt trời, mây trôi, hải âu, đảo xa
- Đàn cá 3D procedural bơi tự do trong hồ (8 loài, vẫy đuôi)
- Cần câu + dây câu bezier + phao nổi theo sóng
- Hiệu ứng bọt nước, âm thanh WebAudio tổng hợp (không cần file mp3)
- UI tiếng Việt: điểm, kỷ lục, sổ tay, thông báo

## 🛠 Cấu trúc dự án

```
index.html        UI + stylesheet
src/main.js       Game loop, trạng thái, input, môi trường
src/water.js      Shader nước + hàm sóng dùng chung (JS ↔ GLSL)
src/sky.js        Bầu trời, mặt trời, mây, hải âu, đảo
src/fish.js       Loài cá, mesh procedural, đàn cá
src/audio.js      Âm thanh WebAudio
```
