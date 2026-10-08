// ===== Provider dữ liệu: chọn engine SQLite theo platform =====
// - Native (Android/iOS): expo-sqlite (SQLite native)
// - Web: WebSqlDatabase — SQLite chạy bằng WebAssembly (sql.js) trên main thread
//   + lưu trong IndexedDB. Trình duyệt không có SQLite native; sql.js chạy trên
//   main thread nên KHÔNG cần SharedArrayBuffer / cross-origin isolation / web
//   worker — hoạt động ở mọi ngữ cảnh web (tab thường, iframe, http...).
//
// LƯU Ý BUILD APK: phần web nằm ở `./web-sql/web-provider.web.tsx` và chỉ được
// Metro nạp cho platform web. Đừng import `./web-sql/web-db` (hay `sql.js`)
// trực tiếp ở đây — bundle Android/iOS sẽ fail vì `sql.js` cần `node:fs`.
// Chi tiết: ghi chú trong `src/web-sql/web-provider.tsx`.
import React, { type ReactNode } from 'react';
import { Platform } from 'react-native';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { DbContext } from './db-context';
import { initDb } from './db';
import { WebProvider } from './web-sql/web-provider';

// Giữ nguyên API cũ: các màn hình vẫn `import { useDb } from '.../src/store'`.
export { useDb } from './db-context';

// ---------- Native (Android/iOS): expo-sqlite ----------

function NativeBridge({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
}

// ---------- DataProvider (chọn engine theo platform) ----------

export function DataProvider({ children }: { children: ReactNode }) {
  if (Platform.OS === 'web') {
    return <WebProvider>{children}</WebProvider>;
  }
  return (
    <SQLiteProvider databaseName="kho.db" onInit={initDb}>
      <NativeBridge>{children}</NativeBridge>
    </SQLiteProvider>
  );
}
