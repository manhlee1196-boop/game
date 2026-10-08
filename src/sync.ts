// ===== Đồng bộ với Google Sheets (qua Google Apps Script web app) =====
import type { DbLike } from './db';
import {
  listProducts, listCustomers, listAllInvoices, listAllInvoiceItems,
} from './api';
import { getMeta, setMeta } from './db';
import { nowIso, fmtDateTime } from './utils';

export function getSyncUrl(db: DbLike): string {
  return getMeta(db, 'sync_url') || '';
}

export function setSyncUrl(db: DbLike, url: string): void {
  setMeta(db, 'sync_url', url.trim());
}

export function getLastSyncAt(db: DbLike): string {
  return getMeta(db, 'last_sync_at') || '';
}

export interface SyncResult {
  ok: boolean;
  message: string;
}

/** Đồng bộ 2 chiều: push toàn bộ dữ liệu lên Sheet, sau đó pull về và gộp */
export async function syncNow(db: DbLike, opts: { push?: boolean; pull?: boolean } = {}): Promise<SyncResult> {
  const url = getSyncUrl(db);
  if (!url) {
    return { ok: false, message: 'Chưa có địa chỉ Google Sheets. Vào Cài đặt → Đồng bộ Google Sheets để cấu hình.' };
  }
  try {
    let pushed = 0;
    let pulled = 0;
    if (opts.push !== false) pushed = await pushToSheets(url, db);
    if (opts.pull !== false) pulled = await pullFromSheets(url, db);
    const at = nowIso();
    setMeta(db, 'last_sync_at', at);
    return {
      ok: true,
      message: `Đồng bộ thành công lúc ${fmtDateTime(at)} — gửi lên: ${pushed} bản ghi, nhận về: ${pulled} bản ghi.`,
    };
  } catch (e: any) {
    const msg = e?.message || String(e);
    return { ok: false, message: `Lỗi đồng bộ: ${msg}` };
  }
}

// ---------- PUSH: app -> Sheets ----------

function collectMeta(db: DbLike): Array<{ key: string; value: string; updatedAt: string }> {
  return db.getAllSync<any>('SELECT key, value, updated_at FROM meta').map((r) => ({
    key: r.key, value: r.value, updatedAt: r.updated_at,
  }));
}

async function pushToSheets(url: string, db: DbLike): Promise<number> {
  const payload = {
    op: 'push',
    products: listProducts(db, undefined, true),
    customers: listCustomers(db, undefined, true),
    invoices: listAllInvoices(db),
    items: listAllInvoiceItems(db),
    meta: collectMeta(db),
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // tránh preflight CORS
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => null);
  if (!json || !json.ok) {
    throw new Error((json && json.error) || `Server trả về mã ${res.status}`);
  }
  return (json.counts && json.counts.total) || 0;
}

// ---------- PULL: Sheets -> app ----------
// Dữ liệu nhận về từ Apps Script đã được chuyển về camelCase.

async function pullFromSheets(url: string, db: DbLike): Promise<number> {
  const sep = url.includes('?') ? '&' : '?';
  const res = await fetch(url + sep + 'op=pull');
  const json = await res.json().catch(() => null);
  if (!json || !json.ok) {
    throw new Error((json && json.error) || `Lấy dữ liệu thất bại (mã ${res.status})`);
  }
  let n = 0;
  await db.withTransactionAsync(async () => {
    const t = db;
    n += mergeProducts(t, json.products || []);
    n += mergeCustomers(t, json.customers || []);
    n += mergeInvoices(t, json.invoices || []);
    n += mergeItems(t, json.items || []);
    n += mergeMeta(t, json.meta || []);
  });
  return n;
}

function isNewer(localTime: string | null, remoteTime: string): boolean {
  if (!localTime) return true;
  return (remoteTime || '') > localTime; // chuỗi ISO so được theo từ điển
}

function mergeProducts(t: DbLike, rows: any[]): number {
  let n = 0;
  for (const r of rows) {
    if (!r.id) continue;
    const local = t.getFirstSync<{ u: string }>('SELECT updated_at FROM products WHERE id = ? LIMIT 1', r.id);
    if (isNewer(local?.u || null, r.updatedAt || '')) {
      t.runSync(
        `INSERT INTO products (id, name, sku, category, unit, cost_price, sale_price, stock, min_stock, note, updated_at, deleted)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET name=excluded.name, sku=excluded.sku, category=excluded.category,
           unit=excluded.unit, cost_price=excluded.cost_price, sale_price=excluded.sale_price,
           stock=excluded.stock, min_stock=excluded.min_stock, note=excluded.note,
           updated_at=excluded.updated_at, deleted=excluded.deleted`,
        [r.id, r.name || '', r.sku || '', r.category || '', r.unit || 'cái',
         +r.costPrice || 0, +r.salePrice || 0, +r.stock || 0, +r.minStock || 0,
         r.note || '', r.updatedAt || '', r.deleted ? 1 : 0]
      );
      n++;
    }
  }
  return n;
}

function mergeCustomers(t: DbLike, rows: any[]): number {
  let n = 0;
  for (const r of rows) {
    if (!r.id) continue;
    const local = t.getFirstSync<{ u: string }>('SELECT updated_at FROM customers WHERE id = ? LIMIT 1', r.id);
    if (isNewer(local?.u || null, r.updatedAt || '')) {
      t.runSync(
        `INSERT INTO customers (id, name, phone, address, note, updated_at, deleted)
         VALUES (?,?,?,?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET name=excluded.name, phone=excluded.phone,
           address=excluded.address, note=excluded.note, updated_at=excluded.updated_at, deleted=excluded.deleted`,
        [r.id, r.name || '', r.phone || '', r.address || '', r.note || '', r.updatedAt || '', r.deleted ? 1 : 0]
      );
      n++;
    }
  }
  return n;
}

function mergeInvoices(t: DbLike, rows: any[]): number {
  let n = 0;
  for (const r of rows) {
    if (!r.id) continue;
    const local = t.getFirstSync<{ u: string }>('SELECT updated_at FROM invoices WHERE id = ? LIMIT 1', r.id);
    if (isNewer(local?.u || null, r.updatedAt || '')) {
      t.runSync(
        `INSERT INTO invoices (id, invoice_no, customer_id, customer_name, customer_phone, customer_address,
           subtotal, discount, vat_rate, vat_amount, total, note, created_at, updated_at, deleted)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET invoice_no=excluded.invoice_no, customer_id=excluded.customer_id,
           customer_name=excluded.customer_name, customer_phone=excluded.customer_phone,
           customer_address=excluded.customer_address, subtotal=excluded.subtotal,
           discount=excluded.discount, vat_rate=excluded.vat_rate, vat_amount=excluded.vat_amount,
           total=excluded.total, note=excluded.note, created_at=excluded.created_at,
           updated_at=excluded.updated_at, deleted=excluded.deleted`,
        [r.id, r.invoiceNo || '', r.customerId || null, r.customerName || '', r.customerPhone || '',
         r.customerAddress || '', +r.subtotal || 0, +r.discount || 0, +r.vatRate || 0,
         +r.vatAmount || 0, +r.total || 0, r.note || '', r.createdAt || '', r.updatedAt || '', r.deleted ? 1 : 0]
      );
      n++;
    }
  }
  return n;
}

function mergeItems(t: DbLike, rows: any[]): number {
  let n = 0;
  for (const r of rows) {
    if (!r.id) continue;
    const local = t.getFirstSync<{ u: string }>('SELECT updated_at FROM invoice_items WHERE id = ? LIMIT 1', r.id);
    if (isNewer(local?.u || null, r.updatedAt || '')) {
      t.runSync(
        `INSERT INTO invoice_items (id, invoice_id, product_id, product_name, sku, unit, unit_price, quantity, line_total, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET invoice_id=excluded.invoice_id, product_id=excluded.product_id,
           product_name=excluded.product_name, sku=excluded.sku, unit=excluded.unit,
           unit_price=excluded.unit_price, quantity=excluded.quantity,
           line_total=excluded.line_total, updated_at=excluded.updated_at`,
        [r.id, r.invoiceId || '', r.productId || null, r.productName || '', r.sku || '', r.unit || '',
         +r.unitPrice || 0, +r.quantity || 0, +r.lineTotal || 0, r.updatedAt || '']
      );
      n++;
    }
  }
  return n;
}

function mergeMeta(t: DbLike, rows: any[]): number {
  let n = 0;
  for (const r of rows) {
    if (!r.key) continue;
    const local = t.getFirstSync<{ u: string }>('SELECT updated_at FROM meta WHERE key = ? LIMIT 1', r.key);
    if (isNewer(local?.u || null, r.updatedAt || '')) {
      t.runSync(
        'INSERT INTO meta (key, value, updated_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at',
        [r.key, r.value ?? '', r.updatedAt || '']
      );
      n++;
    }
  }
  return n;
}
