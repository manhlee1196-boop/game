// ===== Provider dữ liệu: chọn engine SQLite theo platform =====
// - Native (Android/iOS): expo-sqlite (SQLite native)
// - Web: WebSqlDatabase — SQLite chạy bằng WebAssembly (sql.js) trên main thread
//   + lưu trong IndexedDB. Trình duyệt không có SQLite native; sql.js chạy trên
//   main thread nên KHÔNG cần SharedArrayBuffer / cross-origin isolation / web
//   worker — hoạt động ở mọi ngữ cảnh web (tab thường, iframe, http...).
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { initDb, type DbLike } from './db';
import { colors } from './theme';
import { WebSqlDatabase } from './web-sql/web-db';

const DbContext = createContext<DbLike | null>(null);

/** Lấy database ở bất kỳ màn hình nào */
export function useDb(): DbLike {
  const db = useContext(DbContext);
  if (!db) throw new Error('useDb() phải được dùng bên trong <DataProvider>');
  return db;
}

// ---------- Native (Android/iOS): expo-sqlite ----------

function NativeBridge({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
}

// ---------- Web: sql.js + IndexedDB ----------

function WebProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<WebSqlDatabase | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let alive = true;
    WebSqlDatabase.create()
      .then(async (d) => {
        await initDb(d);
        if (alive) setDb(d);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e : new Error(String(e)));
      });
    return () => {
      alive = false;
    };
  }, []);

  // Lưu ngay khi đóng/trang ẩn (tránh mất dữ liệu trong thời gian debounce)
  useEffect(() => {
    if (!db || typeof window === 'undefined') return;
    const onUnload = () => {
      void db.flush?.();
    };
    window.addEventListener('pagehide', onUnload);
    return () => window.removeEventListener('pagehide', onUnload);
  }, [db]);

  if (error) throw error;
  if (!db) {
    return (
      <View style={loadingStyles.wrap}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={loadingStyles.text}>Đang khởi động...</Text>
      </View>
    );
  }
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

const loadingStyles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  text: { marginTop: 12, color: colors.sub, fontSize: 14 },
});
