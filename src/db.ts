// ===== Khởi tạo database + dữ liệu mẫu =====
import { uid, nowIso } from './utils';

/**
 * Giao diện DB dùng chung cho toàn app — hoạt động với cả
 * SQLiteDatabase (expo-sqlite) và WebSqlDatabase (sql.js fallback trên web).
 */
export interface DbLike {
  execSync(source: string): void;
  runSync(source: string, ...params: any[]): { changes: number; lastInsertRowId: number };
  getAllSync<T = any>(source: string, ...params: any[]): T[];
  getFirstSync<T = any>(source: string, ...params: any[]): T | null;
  withTransactionAsync(task: (txn?: any) => Promise<void>): Promise<void>;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT 'cái',
  cost_price REAL NOT NULL DEFAULT 0,
  sale_price REAL NOT NULL DEFAULT 0,
  stock REAL NOT NULL DEFAULT 0,
  min_stock REAL NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_no TEXT NOT NULL,
  customer_id TEXT,
  customer_name TEXT NOT NULL DEFAULT '',
  customer_phone TEXT NOT NULL DEFAULT '',
  customer_address TEXT NOT NULL DEFAULT '',
  subtotal REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  vat_rate REAL NOT NULL DEFAULT 0,
  vat_amount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_invoices_created ON invoices(created_at);

CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  product_id TEXT,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT '',
  unit_price REAL NOT NULL DEFAULT 0,
  quantity REAL NOT NULL DEFAULT 0,
  line_total REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_items_invoice ON invoice_items(invoice_id);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

/** Khởi tạo schema + dữ liệu mặc định */
export async function initDb(db: DbLike): Promise<void> {
  db.execSync(SCHEMA);
  ensureDefaultMeta(db);
  seedIfEmpty(db);
}

function ensureDefaultMeta(db: DbLike): void {
  const defaults: Record<string, string> = {
    shop_name: 'Cửa hàng của tôi',
    shop_address: '',
    shop_tax: '',
    shop_phone: '',
    invoice_prefix: 'HD',
    default_vat: '8',
    next_invoice_no: '1',
    seeded: '0',
    last_sync_at: '',
    sync_url: '',
  };
  for (const [k, v] of Object.entries(defaults)) {
    const row = db.getFirstSync<{ v: string }>('SELECT value AS v FROM meta WHERE key = ?', k);
    if (!row) {
      db.runSync('INSERT INTO meta (key, value, updated_at) VALUES (?, ?, ?)', [k, v, nowIso()]);
    }
  }
}

/** Dữ liệu mẫu khi chạy lần đầu (xóa được) */
function seedIfEmpty(db: DbLike): void {
  const flag = getMeta(db, 'seeded');
  if (flag === '1') return;
  const row = db.getFirstSync<{ c: number }>('SELECT COUNT(*) AS c FROM products');
  if (row && row.c > 0) return;

  const now = nowIso();
  const products: Array<[string, string, string, string, number, number, number, number]> = [
    // [name, sku, category, unit, cost, sale, stock, minStock]
    ['Nước suối Lavie 225ml (lốc 20)', 'NS001', 'Đồ uống', 'lốc', 28000, 32000, 50, 10],
    ['Dầu ăn Neptune 1L', 'DA002', 'Bếp núc', 'chai', 34000, 38000, 36, 10],
    ['Đường cát Biên Hòa 1kg', 'DG003', 'Bếp núc', 'gói', 26000, 29500, 24, 10],
    ['Gạo ST25 5kg', 'GD004', 'Bếp núc', 'túi', 165000, 185000, 15, 5],
    ['Sữa tươi Vinamilk 1L', 'SU005', 'Đồ uống', 'hộp', 29000, 33000, 40, 12],
    ['Trứng gà ta (vỉ 10 quả)', 'TG006', 'Thực phẩm', 'vỉ', 22000, 25000, 20, 8],
    ['Mì Hảo Hảo 40g', 'MI007', 'Thực phẩm', 'gói', 3000, 3500, 200, 50],
    ['Xà phòng 101 250g', 'XP008', 'Hóa mỹ phẩm', 'bánh', 11000, 13000, 30, 10],
  ];
  for (const [name, sku, category, unit, cost, sale, stock, minStock] of products) {
    db.runSync(
      'INSERT INTO products (id, name, sku, category, unit, cost_price, sale_price, stock, min_stock, note, updated_at, deleted) VALUES (?,?,?,?,?,?,?,?,?,?,?,0)',
      [uid(), name, sku, category, unit, cost, sale, stock, minStock, 'Dữ liệu mẫu', now]
    );
  }
  const customers: Array<[string, string, string]> = [
    ['Cửa hàng Minh Anh', '0912 345 678', '12 Nguyễn Trãi, TP. Thanh Hóa'],
    ['Chị Hoa tạp hóa', '0987 654 321', 'TT. Nga Sơn'],
  ];
  for (const [name, phone, address] of customers) {
    db.runSync(
      'INSERT INTO customers (id, name, phone, address, note, updated_at, deleted) VALUES (?,?,?,?,?,?,0)',
      [uid(), name, phone, address, 'Dữ liệu mẫu', now]
    );
  }
  setMeta(db, 'seeded', '1');
}

/** Đọc 1 giá trị meta */
export function getMeta(db: DbLike, key: string): string | null {
  const row = db.getFirstSync<{ v: string }>('SELECT value AS v FROM meta WHERE key = ?', key);
  return row ? row.v : null;
}

/** Ghi giá trị meta */
export function setMeta(db: DbLike, key: string, value: string): void {
  const now = nowIso();
  db.runSync(
    'INSERT INTO meta (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
    [key, value, now]
  );
}

/** Xóa toàn bộ dữ liệu, giữ cấu hình */
export function resetAllData(db: DbLike): void {
  db.execSync('DELETE FROM invoice_items; DELETE FROM invoices; DELETE FROM products; DELETE FROM customers;');
  db.runSync('UPDATE meta SET value = ?, updated_at = ? WHERE key IN (\'next_invoice_no\', \'seeded\')', ['1', nowIso()]);
}
