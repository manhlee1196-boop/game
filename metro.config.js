// Config Metro: thêm hỗ trợ file .wasm (dùng bởi expo-sqlite trên web)
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Cho phép resolve file .wasm
config.resolver = {
  ...config.resolver,
  sourceExts: [...(config.resolver.sourceExts || []), 'wasm'],
};

// Bọc babel-transformer mặc định của Expo để xử lý file .wasm
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('./metro.wasm-transformer.js'),
};

module.exports = config;
