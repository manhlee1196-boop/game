// Bọc babel-transformer mặc định của Expo:
// - File .wasm: ĐỌC TRỰC TIẾP TỪ ĐĨA (bỏ qua args.src — chuỗi trong pipeline
//   đã bị chuyển mã UTF-8 làm hỏng byte nhị phân), nhúng vào module JS dạng data URI.
// - Mọi file khác: chuyển tiếp nguyên vẹn.
const fs = require('fs');
const path = require('path');

const expoPkgPath = require.resolve('expo/package.json');
const defaultTransformer = require(
  path.join(path.dirname(expoPkgPath), 'node_modules', '@expo', 'metro-config', 'build', 'babel-transformer.js')
);

function isWasm(filename) {
  return typeof filename === 'string' && filename.endsWith('.wasm');
}

module.exports = {
  transform(args) {
    if (isWasm(args.filename)) {
      // Đọc byte gốc từ đĩa để giữ nguyên nhị phân
      const raw = fs.readFileSync(args.filename);
      const b64 = raw.toString('base64');
      const js = `module.exports = "data:application/wasm;base64,${b64}";\n`;
      return defaultTransformer.transform({ ...args, src: js });
    }
    return defaultTransformer.transform(args);
  },
};
