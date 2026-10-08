// Bọc babel-transformer mặc định của Expo:
// - File .wasm: chuyển nội dung nhị phân thành module JS xuất chuỗi data URI (base64),
//   rồi để pipeline Babel xử lý như một file JS bình thường.
// - Mọi file khác: chuyển tiếp nguyên vẹn.
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
      const raw = args.src;
      const b64 = Buffer.isBuffer(raw) ? raw.toString('base64') : Buffer.from(String(raw)).toString('base64');
      const js = `module.exports = "data:application/wasm;base64,${b64}";\n`;
      return defaultTransformer.transform({ ...args, src: js });
    }
    return defaultTransformer.transform(args);
  },
};
