// ===== React context chứa DbLike =====
// Tách ra file riêng (thay vì nằm trong store.tsx) để cả provider native
// (expo-sqlite) lẫn provider web (sql.js) dùng chung mà không import chéo.
import { createContext, useContext } from 'react';
import type { DbLike } from './db';

export const DbContext = createContext<DbLike | null>(null);

/** Lấy database ở bất kỳ màn hình nào */
export function useDb(): DbLike {
  const db = useContext(DbContext);
  if (!db) throw new Error('useDb() phải được dùng bên trong <DataProvider>');
  return db;
}
