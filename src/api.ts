// ===== Thao tác dữ liệu (CRUD) trên SQLite =====
import type { DbLike } from './db';
import type { Product, Customer, Invoice, InvoiceItem } from './types';
import { uid, nowIso, round2 } from './utils';
import { getMeta, setMeta } from './db';

// ---------- Chuyển đổi hàng SQLite -> đối tượng ----------

function mapProduct(r: any): Product {
  return {
    id: r.id, name: r.name, sku: r.sku || '', category: r.category || '',
    unit: r.unit || 'cái', costPrice: +r.cost_price || 0, salePrice: +r.sale_price || 0,
    stock: +r.stock || 0, minStock: +r.min_stock || 0, note: r.note || '',
    updatedAt: r.updated_at, deleted: r.deleted,
  };
}
function mapCustomer(r: any): Customer {
  return {
    id: r.id, name: r.name, phone: r.phone || '', address: r.address || '',
    note: r.note || '', updatedAt: r.updated_at, deleted: r.deleted,
  };
}
function mapInvoice(r: any): Invoice {
  return {
    id: r.id, invoiceNo: r.invoice_no, customerId: r.customer_id || null,
    customerName: r.customer_name || '', customerPhone: r.customer_phone || '',
    customerAddress: r.customer_address || '', subtotal: +r.subtotal || 0,
    discount: +r.discount || 0, vatRate: +r.vat_rate || 0, vatAmount: +r.vat_amount || 0,
    total: +r.total || 0, note: r.note || '', createdAt: r.created_at,
    updatedAt: r.updated_at, deleted: r.deleted,
  };
}
function mapItem(r: any): InvoiceItem {
  return {
    id: r.id, invoiceId: r.invoice_id, productId: r.product_id || null,
    productName: r.product_name, sku: r.sku || '', unit: r.unit || '',
    unitPrice: +r.unit_price || 0, quantity: +r.quantity || 0,
    lineTotal: +r.line_total || 0, updatedAt: r.updated_at,
  };
}

// ---------- Sản phẩm ----------

export function listProducts(db: DbLike, q?: string, includeDeleted = false): Product[] {
  const like = q && q.trim() ? `%${q.trim()}%` : null;
  const where = like ? "deleted = 0 AND (name LIKE ? OR sku LIKE ? OR category LIKE ?)" : 'deleted = 0';
  const params: any[] = like ? [like, like, like] : [];
  const rows = db.getAllSync<any>(
    `SELECT * FROM products WHERE ${where} ORDER BY name COLLATE NOCASE`,
    params
  );
  if (includeDeleted) {
    const del = db.getAllSync<any>('SELECT * FROM products WHERE deleted = 1');
    rows.push(...del);
  }
  return rows.map(mapProduct);
}

export function getProduct(db: DbLike, id: string): Product | null {
  const r = db.getFirstSync<any>('SELECT * FROM products WHERE id = ?', id);
  return r ? mapProduct(r) : null;
}

export function saveProduct(db: DbLike, p: Partial<Product> & { name: string }): Product {
  const now = nowIso();
  const id = p.id || uid();
  db.runSync(
    `INSERT INTO products (id, name, sku, category, unit, cost_price, sale_price, stock, min_stock, note, updated_at, deleted)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,0)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name, sku=excluded.sku, category=excluded.category, unit=excluded.unit,
       cost_price=excluded.cost_price, sale_price=excluded.sale_price, stock=excluded.stock,
       min_stock=excluded.min_stock, note=excluded.note, updated_at=excluded.updated_at, deleted=0`,
    [id, p.name, p.sku || '', p.category || '', p.unit || 'cái',
     p.costPrice || 0, p.salePrice || 0, p.stock || 0, p.minStock || 0, p.note || '', now]
  );
  return getProduct(db, id)!;
}

export function deleteProduct(db: DbLike, id: string): void {
  db.runSync('UPDATE products SET deleted = 1, updated_at = ? WHERE id = ?', [nowIso(), id]);
}

// ---------- Khách hàng ----------

export function listCustomers(db: DbLike, q?: string, includeDeleted = false): Customer[] {
  const like = q && q.trim() ? `%${q.trim()}%` : null;
  const where = like ? "deleted = 0 AND (name LIKE ? OR phone LIKE ?)" : 'deleted = 0';
  const params: any[] = like ? [like, like] : [];
  const rows = db.getAllSync<any>(
    `SELECT * FROM customers WHERE ${where} ORDER BY name COLLATE NOCASE`,
    params
  );
  if (includeDeleted) {
    const del = db.getAllSync<any>('SELECT * FROM customers WHERE deleted = 1');
    rows.push(...del);
  }
  return rows.map(mapCustomer);
}

export function getCustomer(db: DbLike, id: string): Customer | null {
  const r = db.getFirstSync<any>('SELECT * FROM customers WHERE id = ?', id);
  return r ? mapCustomer(r) : null;
}

export function saveCustomer(db: DbLike, c: Partial<Customer> & { name: string }): Customer {
  const now = nowIso();
  const id = c.id || uid();
  db.runSync(
    `INSERT INTO customers (id, name, phone, address, note, updated_at, deleted)
     VALUES (?,?,?,?,?,?,0)
     ON CONFLICT(id) DO UPDATE SET name=excluded.name, phone=excluded.phone,
       address=excluded.address, note=excluded.note, updated_at=excluded.updated_at, deleted=0`,
    [id, c.name, c.phone || '', c.address || '', c.note || '', now]
  );
  return getCustomer(db, id)!;
}

export function deleteCustomer(db: DbLike, id: string): void {
  db.runSync('UPDATE customers SET deleted = 1, updated_at = ? WHERE id = ?', [nowIso(), id]);
}

// ---------- Hóa đơn ----------

export function listInvoices(db: DbLike, limit = 200): Invoice[] {
  return db
    .getAllSync<any>('SELECT * FROM invoices WHERE deleted = 0 ORDER BY created_at DESC, rowid DESC LIMIT ?', limit)
    .map(mapInvoice);
}

export function getInvoice(db: DbLike, id: string): Invoice | null {
  const r = db.getFirstSync<any>('SELECT * FROM invoices WHERE id = ?', id);
  return r ? mapInvoice(r) : null;
}

export function getInvoiceItems(db: DbLike, invoiceId: string): InvoiceItem[] {
  return db
    .getAllSync<any>('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY rowid', invoiceId)
    .map(mapItem);
}

export function listAllInvoices(db: DbLike): Invoice[] {
  return db.getAllSync<any>('SELECT * FROM invoices').map(mapInvoice);
}

export function listAllInvoiceItems(db: DbLike): InvoiceItem[] {
  return db.getAllSync<any>('SELECT * FROM invoice_items').map(mapItem);
}

export interface CreateInvoiceArgs {
  lines: Array<{ product: Product; qty: number; unitPrice: number }>;
  customerId?: string | null;
  discount?: number;
  vatRate?: number;
  note?: string;
}

/** Tạo hóa đơn: ghi hóa đơn + chi tiết + giảm tồn kho + tăng số thứ tự */
export async function createInvoice(db: DbLike, args: CreateInvoiceArgs): Promise<Invoice> {
  if (!args.lines.length) throw new Error('Hóa đơn chưa có sản phẩm');
  const now = nowIso();
  const seq = parseInt(getMeta(db, 'next_invoice_no') || '1', 10) || 1;
  const prefix = getMeta(db, 'invoice_prefix') || 'HD';
  const invoiceNo = `${prefix}-${String(seq).padStart(5, '0')}`;
  const id = uid();

  let customer: Customer | null = null;
  if (args.customerId) customer = getCustomer(db, args.customerId);

  const subtotal = round2(args.lines.reduce((s, l) => s + l.unitPrice * l.qty, 0));
  const discount = round2(args.discount || 0);
  const vatRate = args.vatRate || 0;
  const vatAmount = round2(((subtotal - discount) * vatRate) / 100);
  const total = round2(subtotal - discount + vatAmount);

  await db.withTransactionAsync(async () => {
    const t = db;
    t.runSync(
      `INSERT INTO invoices (id, invoice_no, customer_id, customer_name, customer_phone, customer_address,
        subtotal, discount, vat_rate, vat_amount, total, note, created_at, updated_at, deleted)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,0)`,
      [id, invoiceNo, customer?.id || null, customer?.name || 'Khách lẻ',
       customer?.phone || '', customer?.address || '',
       subtotal, discount, vatRate, vatAmount, total, args.note || '', now, now]
    );
    for (const l of args.lines) {
      t.runSync(
        `INSERT INTO invoice_items (id, invoice_id, product_id, product_name, sku, unit, unit_price, quantity, line_total, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [uid(), id, l.product.id, l.product.name, l.product.sku, l.product.unit,
         l.unitPrice, l.qty, round2(l.unitPrice * l.qty), now]
      );
      t.runSync('UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ?', [l.qty, now, l.product.id]);
    }
  });

  // Tăng số thứ tự (ngoài transaction để tránh khóa dài)
  setMeta(db, 'next_invoice_no', String(seq + 1));
  return getInvoice(db, id)!;
}

/** Xóa hóa đơn (mềm), có thể khôi phục tồn kho */
export async function deleteInvoice(db: DbLike, id: string, restoreStock: boolean): Promise<void> {
  const items = getInvoiceItems(db, id);
  const now = nowIso();
  await db.withTransactionAsync(async () => {
    const t = db;
    if (restoreStock) {
      for (const it of items) {
        if (!it.productId) continue;
        t.runSync('UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?', [it.quantity, now, it.productId]);
      }
    }
    t.runSync('DELETE FROM invoice_items WHERE invoice_id = ?', id);
    t.runSync('UPDATE invoices SET deleted = 1, updated_at = ? WHERE id = ?', [now, id]);
  });
}

// ---------- Báo cáo ----------

export interface SalesSummary {
  count: number;
  revenue: number; // tổng tiền thu (bao gồm VAT, trừ giảm giá)
  net: number; // tiền hàng trước thuế
  cost: number; // giá vốn
  profit: number; // lãi gộp
}

export function salesSummary(db: DbLike, from: Date | null, to: Date | null): SalesSummary {
  const where: string[] = [];
  const params: any[] = [];
  if (from) { where.push('i.created_at >= ?'); params.push(from.toISOString()); }
  if (to) { where.push('i.created_at < ?'); params.push(to.toISOString()); }
  const w = where.length ? ' AND ' + where.join(' AND ') : '';

  const row = db.getFirstSync<any>(
    `SELECT COUNT(*) AS c, COALESCE(SUM(i.total),0) AS revenue, COALESCE(SUM(i.subtotal - i.discount),0) AS net
     FROM invoices i WHERE i.deleted = 0${w}`,
    params
  );
  const costRow = db.getFirstSync<any>(
    `SELECT COALESCE(SUM(ii.line_total * p.cost_price / NULLIF(ii.unit_price, 0)), 0) AS cost
     FROM invoice_items ii
     JOIN invoices i ON i.id = ii.invoice_id
     LEFT JOIN products p ON p.id = ii.product_id
     WHERE i.deleted = 0${w}`,
    params
  );
  const revenue = +row?.revenue || 0;
  const net = +row?.net || 0;
  const cost = +costRow?.cost || 0;
  return { count: row?.c || 0, revenue, net, cost, profit: round2(net - cost) };
}

export interface TopProductRow {
  name: string;
  qty: number;
  revenue: number;
}

export function topProducts(db: DbLike, from: Date | null, to: Date | null, limit = 10): TopProductRow[] {
  const where: string[] = [];
  const params: any[] = [];
  if (from) { where.push('i.created_at >= ?'); params.push(from.toISOString()); }
  if (to) { where.push('i.created_at < ?'); params.push(to.toISOString()); }
  const w = where.length ? ' AND ' + where.join(' AND ') : '';
  params.push(limit);
  return db.getAllSync<any>(
    `SELECT ii.product_name AS name, COALESCE(SUM(ii.quantity),0) AS qty, COALESCE(SUM(ii.line_total),0) AS revenue
     FROM invoice_items ii
     JOIN invoices i ON i.id = ii.invoice_id
     WHERE i.deleted = 0${w}
     GROUP BY ii.product_id, ii.product_name
     ORDER BY revenue DESC
     LIMIT ?`,
    params
  );
}

export interface StockStats {
  count: number;
  costValue: number;
  saleValue: number;
  lowCount: number;
}

export function stockStats(db: DbLike): StockStats {
  const row = db.getFirstSync<any>(
    `SELECT COUNT(*) AS c,
      COALESCE(SUM(stock * cost_price),0) AS cv,
      COALESCE(SUM(stock * sale_price),0) AS sv,
      COALESCE(SUM(CASE WHEN stock <= min_stock THEN 1 ELSE 0 END),0) AS low
     FROM products WHERE deleted = 0`
  );
  return { count: row?.c || 0, costValue: +row?.cv || 0, saleValue: +row?.sv || 0, lowCount: +row?.low || 0 };
}

export function lowStockProducts(db: DbLike, limit = 20): Product[] {
  return db
    .getAllSync<any>('SELECT * FROM products WHERE deleted = 0 AND stock <= min_stock ORDER BY stock ASC LIMIT ?', limit)
    .map(mapProduct);
}
