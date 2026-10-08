// Dev proxy cho preview web:
// Thêm header Cross-Origin-Opener-Policy + Cross-Origin-Embedder-Policy
// để trang được "cross-origin isolated" — yêu cầu bắt buộc của expo-sqlite trên web
// (SharedArrayBuffer cho lệnh đồng bộ + SyncAccessHandle cho lưu trữ OPFS).
//
// Chạy: node dev-proxy.js  (tự khởi động Expo dev server ở 127.0.0.1:8081)
const http = require('http');
const net = require('net');
const { spawn } = require('child_process');

const PROXY_PORT = 8080;
// Expo `--host localhost` bind trên IPv6 ::1 trong môi trường này
const UPSTREAM_HOST = '::1';
const UPSTREAM_PORT = 8081;

// Khởi động Expo dev server (chỉ lắng nghe 127.0.0.1 — chỉ proxy mới expose ra ngoài)
const expo = spawn(
  'npx',
  ['expo', 'start', '--web', '--port', String(UPSTREAM_PORT), '--host', 'localhost'],
  {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env, CI: '1' },
  }
);
expo.on('exit', (code) => {
  console.log('[proxy] expo exited with code', code);
  process.exit(code ?? 0);
});

const server = http.createServer((req, res) => {
  // Giữ nguyên Host header gốc (Metro làm `new URL()` từ nó — IPv6 cần dấu [])
  const proxyReq = http.request(
    { host: UPSTREAM_HOST, port: UPSTREAM_PORT, method: req.method, path: req.url, headers: req.headers },
    (proxyRes) => {
      const outHeaders = { ...proxyRes.headers };
      outHeaders['cross-origin-opener-policy'] = 'same-origin';
      outHeaders['cross-origin-embedder-policy'] = 'require-corp';
      res.writeHead(proxyRes.statusCode, outHeaders);
      proxyRes.pipe(res);
    }
  );
  proxyReq.on('error', (e) => {
    console.error('[proxy] upstream error:', e.message);
    if (!res.headersSent) res.writeHead(502);
    res.end('Bad Gateway: ' + e.message);
  });
  req.pipe(proxyReq);
});

// Chuyển tiếp WebSocket (HMR của Metro)
server.on('upgrade', (req, socket, head) => {
  const upstream = net.connect(UPSTREAM_PORT, UPSTREAM_HOST, () => {
    const lines = [
      `${req.method} ${req.url} HTTP/1.1`,
      ...Object.entries(req.headers).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`),
      '',
      '',
    ];
    upstream.write(lines.join('\r\n'));
    if (head && head.length) upstream.write(head);
  });
  upstream.on('error', () => socket.destroy());
  socket.on('error', () => upstream.destroy());
  upstream.pipe(socket);
  socket.pipe(upstream);
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`[proxy] COOP/COEP proxy sẵn sàng trên 0.0.0.0:${PROXY_PORT} -> ${UPSTREAM_HOST}:${UPSTREAM_PORT}`);
});
