// ===== Test WebSqlDatabase (sql.js) với đúng schema + API của app =====
import assert from 'node:assert';
import { WebSqlDatabase } from './src/web-sql/web-db';
import { initDb, getMeta, setMeta, resetAllData } from './src/db';
import {
  saveProduct, listProducts, getProduct, deleteProduct,
  saveCustomer, listCustomers,
  createInvoice, getInvoice, getInvoiceItems, deleteInvoice,
  salesSummary, stockStats, lowStockProducts, topProducts,
  findProductByBarcode,
} from './src/api';

let passed = 0;
function ok(name: string, fn: () => void) {
  fn();
  passed++;
  console.log('  ✓', name);
}

console.log('1) Khởi tạo WebSqlDatabase + initDb');
const db = await WebSqlDatabase.create();
await initDb(db);

ok('schema + seed products', () => {
  const list = listProducts(db);
  assert.ok(list.length >= 8, 'có đủ hàng mẫu, thực tế: ' + list.length);
});
ok('meta mặc định', () => {
  assert.strictEqual(getMeta(db, 'shop_name'), 'Cửa hàng của tôi');
  assert.strictEqual(getMeta(db, 'next_invoice_no'), '1');
});
ok('setMeta upsert', () => {
  setMeta(db, 'next_invoice_no', '99');
  assert.strictEqual(getMeta(db, 'next_invoice_no'), '99');
});

console.log('2) CRUD product (kể cả dạng tham số đơn)');
const p1 = saveProduct(db, { name: 'Test hàng', salePrice: 10000, costPrice: 8000, stock: 10, unit: 'cái' });
ok('saveProduct trả về id', () => assert.ok(p1.id));
ok('getProduct tìm được', () => assert.strictEqual(getProduct(db, p1.id)!.name, 'Test hàng'));

console.log('3) createInvoice: giảm kho + tính VAT');
const c1 = saveCustomer(db, { name: 'Khách test', phone: '0900000000' });
const before = getProduct(db, p1.id)!.stock;
const inv = await createInvoice(db, {
  customerId: c1.id,
  lines: [{ product: p1, qty: 3, unitPrice: 10000 }],
  vatRate: 10,
});
ok('subtotal = 30000', () => assert.strictEqual(inv.subtotal, 30000));
ok('vat 10% = 3000', () => assert.strictEqual(inv.vatAmount, 3000));
ok('total = 33000', () => assert.strictEqual(inv.total, 33000));
ok('kho giảm 10 -> 7', () => assert.strictEqual(getProduct(db, p1.id)!.stock, before - 3));
ok('invoice_no tự tăng (HD-xxxxx)', () => assert.ok(/^HD-\d{5}$/.test(inv.invoiceNo), inv.invoiceNo));

console.log('4) getInvoice/getInvoiceItems/salesSummary/topProducts/stockStats');
const inv2 = getInvoice(db, inv.id)!;
ok('đọc lại invoice', () => assert.strictEqual(inv2.total, 33000));
const items = getInvoiceItems(db, inv.id);
ok('đọc lại chi tiết', () => assert.strictEqual(items.length, 1));
const sum = salesSummary(db, null, null);
ok('summary doanh thu = 33000', () => assert.strictEqual(sum.revenue, 33000));
ok('summary 1 hóa đơn', () => assert.strictEqual(sum.count, 1));
const top = topProducts(db, null, null);
ok('topProducts có hàng test', () => assert.ok(top.some((t) => t.name === 'Test hàng')));
const stats = stockStats(db);
ok('stockStats tổng > 0', () => assert.ok(stats.costValue > 0));

console.log('5) deleteInvoice khôi phục kho');
await deleteInvoice(db, inv.id, true);
ok('kho được khôi phục về ' + before, () => assert.strictEqual(getProduct(db, p1.id)!.stock, before));

console.log('6) lowStockProducts + xóa product mềm');
const low = lowStockProducts(db);
ok('lowStock trả về array', () => assert.ok(Array.isArray(low)));
deleteProduct(db, p1.id);
ok('xóa mềm: đánh dấu deleted=1', () => assert.strictEqual(getProduct(db, p1.id)?.deleted, 1));
ok('xóa mềm: không còn trong listProducts', () => assert.strictEqual(listProducts(db).some((x) => x.id === p1.id), false));

console.log('7) export / reload (bền vững)');
const bytes = (db as any).sql.export();
const db2 = await WebSqlDatabase.create().then(async (d2) => {
  // db2 là DB mới trong memory (IDB không có trong Node) — kiểm tra initDb idempotent
  await initDb(d2);
  return d2;
});
ok('DB thứ 2 chạy độc lập, seed idempotent', () => {
  const list = listProducts(db2);
  assert.ok(list.length >= 8 && list.length < 20, 'không seed trùng, thực tế: ' + list.length);
});

console.log('8) Mã vạch');
const pBar = saveProduct(db, {
  name: 'Sữa có mã vạch', barcode: '8935049800123', salePrice: 30000, costPrice: 25000, stock: 5, unit: 'hộp',
});
ok('lưu sản phẩm có barcode', () => assert.strictEqual(pBar.barcode, '8935049800123'));
ok('tìm theo barcode', () => assert.strictEqual(findProductByBarcode(db, '8935049800123')?.id, pBar.id));
ok('tìm theo barcode có khoảng trắng', () => assert.strictEqual(findProductByBarcode(db, ' 8935049800123 ')?.id, pBar.id));
const pSku = saveProduct(db, { name: 'Hàng có mã NS001', sku: 'NS001', salePrice: 1000, stock: 1 });
ok('tìm theo sku khi không có barcode trùng', () => {
  const seed = findProductByBarcode(db, 'NS001');
  assert.ok(seed, 'phải tìm thấy hàng có sku NS001');
});
ok('barcode ưu tiên hơn sku', () => {
  // sản phẩm A có barcode X; sản phẩm B có sku X → quét X phải ra A
  const a = saveProduct(db, { name: 'A', barcode: 'X123', salePrice: 1, stock: 1 });
  saveProduct(db, { name: 'B', sku: 'X123', salePrice: 2, stock: 1 });
  assert.strictEqual(findProductByBarcode(db, 'X123')?.id, a.id);
});
ok('không tìm thấy → null', () => assert.strictEqual(findProductByBarcode(db, '999999'), null));
ok('rỗng → null', () => assert.strictEqual(findProductByBarcode(db, '   '), null));
ok('sản phẩm đã xóa mềm không trả về', () => {
  deleteProduct(db, pBar.id);
  assert.strictEqual(findProductByBarcode(db, '8935049800123'), null);
});

console.log('9) resetAllData');
resetAllData(db);
ok('sau reset: không còn hóa đơn', () => assert.strictEqual(salesSummary(db, null, null).count, 0));
ok('meta shop_name giữ nguyên', () => assert.strictEqual(getMeta(db, 'shop_name'), 'Cửa hàng của tôi'));

console.log('10) Migration DB cũ (không có cột barcode)');
const oldDb = await WebSqlDatabase.create();
oldDb.execSync(`
  CREATE TABLE products (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, sku TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT '', unit TEXT NOT NULL DEFAULT 'cái',
    cost_price REAL NOT NULL DEFAULT 0, sale_price REAL NOT NULL DEFAULT 0,
    stock REAL NOT NULL DEFAULT 0, min_stock REAL NOT NULL DEFAULT 0,
    note TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL, deleted INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL);
  INSERT INTO products (id, name, sku, unit, cost_price, sale_price, stock, min_stock, note, updated_at, deleted)
  VALUES ('old-1', 'Hàng cũ', 'OLD1', 'chai', 1000, 2000, 3, 1, '', '2026-01-01T00:00:00Z', 0);
`);
await initDb(oldDb);
ok('DB cũ được thêm cột barcode, dữ liệu cũ giữ nguyên', () => {
  const p = getProduct(oldDb, 'old-1');
  assert.strictEqual(p?.name, 'Hàng cũ');
  assert.strictEqual(p?.barcode, '');
});
ok('sau migration: lưu + tìm theo barcode được', () => {
  saveProduct(oldDb, { id: 'old-1', name: 'Hàng cũ', sku: 'OLD1', barcode: '111222333', salePrice: 2000, stock: 3 });
  assert.strictEqual(findProductByBarcode(oldDb, '111222333')?.id, 'old-1');
});

console.log(`\nTẤT CẢ ${passed} TEST ĐỀU ĐẠT`);
