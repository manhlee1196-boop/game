// ===== WebSqlDatabase: SQLite chạy trên main thread (sql.js wasm) =====
// Dùng khi trang web KHÔNG cross-origin isolated (mở trong iframe, http thường...)
// — lúc đó expo-sqlite web không hoạt động được vì thiếu SharedArrayBuffer.
// Giao diện tương thích DbLike (sync API giống expo-sqlite),
// dữ liệu lưu bền vững trong IndexedDB.
import initSqlJs, { type Database as SqlJsDatabase, type SqlJsStatic } from 'sql.js';
import { SQL_WASM_B64 } from './sql-wasm-b64';
import { idbAvailable, idbGet, idbSet } from './idb';
import type { DbLike } from '../db';

let sqlJsPromise: Promise<SqlJsStatic> | null = null;

function getSqlJs() {
  if (!sqlJsPromise) {
    // @types/emscripten khai báo wasmBinary: ArrayBuffer, nhưng runtime nhận cả Uint8Array
    sqlJsPromise = initSqlJs({ wasmBinary: b64ToBytes(SQL_WASM_B64) as unknown as ArrayBuffer });
  }
  return sqlJsPromise;
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Nhận cả `runSync(sql, [a, b])` lẫn `runSync(sql, a, b)` */
function flatten(params: any[]): any[] {
  if (params.length === 1 && Array.isArray(params[0])) return params[0];
  return params;
}

export class WebSqlDatabase implements DbLike {
  private sql: SqlJsDatabase;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  private constructor(sql: SqlJsDatabase) {
    this.sql = sql;
  }

  /** Tạo DB mới hoặc nạp dữ liệu đã lưu trong IndexedDB */
  static async create(): Promise<WebSqlDatabase> {
    const SQL = await getSqlJs();
    let data: Uint8Array | null = null;
    if (idbAvailable()) {
      try {
        data = await idbGet('sqlite-data');
      } catch (e) {
        console.warn('[web-db] Không đọc được IndexedDB, dùng DB mới:', e);
      }
    }
    const sql = data && data.length > 0 ? new SQL.Database(new Uint8Array(data)) : new SQL.Database();
    return new WebSqlDatabase(sql);
  }

  /** Lưu xuống IndexedDB (debounce 300ms) */
  private markDirty(): void {
    if (!idbAvailable()) return;
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      try {
        void idbSet('sqlite-data', this.sql.export());
      } catch (e) {
        console.warn('[web-db] Không lưu được IndexedDB:', e);
      }
    }, 300);
  }

  /** Lưu ngay (dùng trước khi tải PDF / đóng trang) */
  async flush(): Promise<void> {
    if (!idbAvailable()) return;
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    await idbSet('sqlite-data', this.sql.export());
  }

  execSync(source: string): void {
    this.sql.run(source);
    this.markDirty();
  }

  runSync(source: string, ...params: any[]): { changes: number; lastInsertRowId: number } {
    const stmt = this.sql.prepare(source);
    try {
      stmt.bind(flatten(params));
      stmt.step();
      return { changes: this.sql.getRowsModified(), lastInsertRowId: 0 };
    } finally {
      stmt.free();
    }
  }

  getAllSync<T = any>(source: string, ...params: any[]): T[] {
    const stmt = this.sql.prepare(source);
    try {
      stmt.bind(flatten(params));
      const rows: any[] = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      return rows as T[];
    } finally {
      stmt.free();
    }
  }

  getFirstSync<T = any>(source: string, ...params: any[]): T | null {
    const stmt = this.sql.prepare(source);
    try {
      stmt.bind(flatten(params));
      if (stmt.step()) return stmt.getAsObject() as T;
      return null;
    } finally {
      stmt.free();
    }
  }

  async withTransactionAsync(task: (txn?: any) => Promise<void>): Promise<void> {
    this.sql.run('BEGIN');
    try {
      await task();
      this.sql.run('COMMIT');
      this.markDirty();
    } catch (e) {
      this.sql.run('ROLLBACK');
      throw e;
    }
  }
}
