// ===== Provider dữ liệu: chọn engine SQLite phù hợp =====
// - Native (Android/iOS): expo-sqlite (native SQLite)
// - Web + cross-origin isolated (mở tab riêng, có header COOP/COEP): expo-sqlite web (wasm + OPFS)
// - Web không isolated (mở trong iframe / http thường): WebSqlDatabase (sql.js wasm + IndexedDB)
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { initDb, type DbLike } from './db';
import { WebSqlDatabase } from './web-sql/web-db';

const DbContext = createContext<DbLike | null>(null);

/** Lấy database ở bất kỳ màn hình nào */
export function useDb(): DbLike {
  const db = useContext(DbContext);
  if (!db) throw new Error('useDb() phải được dùng bên trong <DataProvider>');
  return db;
}

function needsWebFallback(): boolean {
  if (Platform.OS !== 'web') return false;
  const gi = globalThis as unknown as { crossOriginIsolated?: boolean };
  return !gi.crossOriginIsolated;
}

/** Cầu nối cho expo-sqlite (native + web isolated) */
function ExpoSqliteBridge({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
}

/** Chế độ web không isolated: nạp WebSqlDatabase async */
function WebFallback({ children }: { children: ReactNode }) {
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

  if (error) throw error;
  if (!db) {
    return (
      <React.Suspense fallback={null}>
        <div
          style={{
            display: 'flex',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'sans-serif',
            color: '#6b7280',
          }}
        >
          Đang khởi động...
        </div>
      </React.Suspense>
    );
  }
  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
}

export function DataProvider({ children }: { children: ReactNode }) {
  if (needsWebFallback()) {
    return <WebFallback>{children}</WebFallback>;
  }
  return (
    <SQLiteProvider databaseName="kho.db" onInit={initDb}>
      <ExpoSqliteBridge>{children}</ExpoSqliteBridge>
    </SQLiteProvider>
  );
}
