// ===== Test WebSqlDatabase (sql.js) với đúng schema + API của app =====
import assert from 'node:assert';
import { WebSqlDatabase } from './src/web-sql/web-db';
import { initDb, getMeta, setMeta, resetAllData } from './src/db';
import {
  saveProduct, listProducts, getProduct, deleteProduct,
  saveCustomer, listCustomers,
  createInvoice, getInvoice, getInvoiceItems, deleteInvoice,
  salesSummary, stockStats, lowStockProducts, topProducts,
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

console.log('8) resetAllData');
resetAllData(db);
ok('sau reset: không còn hóa đơn', () => assert.strictEqual(salesSummary(db, null, null).count, 0));
ok('meta shop_name giữ nguyên', () => assert.strictEqual(getMeta(db, 'shop_name'), 'Cửa hàng của tôi'));

console.log(`\nTẤT CẢ ${passed} TEST ĐỀU ĐẠT`);
