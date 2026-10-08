// ===== Web: SQLite chạy bằng WebAssembly (sql.js) + lưu IndexedDB =====
// File này CHỈ được Metro nạp khi build cho platform 'web'.
// (Khi build Android/iOS, Metro nạp `web-provider.tsx` thay thế — xem ghi chú ở đó.)
import React, { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { DbContext } from '../db-context';
import { initDb } from '../db';
import { colors } from '../theme';
import { WebSqlDatabase } from './web-db';

export function WebProvider({ children }: { children: ReactNode }) {
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

const loadingStyles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  text: { marginTop: 12, color: colors.sub, fontSize: 14 },
});
