// Test nhanh core: schema + CRUD + tạo hóa đơn + báo cáo + PDF (chạy trên Node với sql.js)
import initSqlJs from 'sql.js';
import { writeFileSync } from 'fs';
import { initDb, getMeta, setMeta } from './src/db';
import * as api from './src/api';
import { buildInvoicePdfBytes } from './src/pdf';

// Adapter giả lập API của expo-sqlite (SQLiteDatabase) bằng sql.js
const norm = (params = []) => (Array.isArray(params) ? params : [params]);
class FakeDB {
  constructor(db) {
    this.db = db;
  }
  execSync(sql) {
    this.db.run(sql);
  }
  runSync(sql, params) {
    const st = this.db.prepare(sql);
    st.bind(norm(params));
    st.step();
    const changes = this.db.getRowsModified();
    st.free();
    return { lastInsertRowId: 0, changes };
  }
  getAllSync(sql, params) {
    const st = this.db.prepare(sql);
    st.bind(norm(params));
    const rows = [];
    while (st.step()) rows.push(st.getAsObject());
    st.free();
    return rows;
  }
  getFirstSync(sql, params) {
    const rows = this.getAllSync(sql, params);
    return rows.length ? rows[0] : null;
  }
  async withTransactionAsync(fn) {
    this.db.run('BEGIN');
    try {
      await fn();
      this.db.run('COMMIT');
    } catch (e) {
      this.db.run('ROLLBACK');
      throw e;
    }
  }
}

const SQL = await initSqlJs();
const raw = new SQL.Database();
const db = new FakeDB(raw);

let pass = 0;
let fail = 0;
function check(name, cond) {
  if (cond) {
    pass++;
    console.log('  ✓', name);
  } else {
    fail++;
    console.log('  ✗', name);
  }
}

console.log('1) Khởi tạo DB + seed:');
await initDb(db);
check('seed 8 sản phẩm', api.listProducts(db).length === 8);
check('seed 2 khách hàng', api.listCustomers(db).length === 2);
check('meta shop_name', getMeta(db, 'shop_name') === 'Cửa hàng của tôi');

console.log('2) Tìm kiếm sản phẩm:');
check('tìm "nước suối"', api.listProducts(db, 'nước suối').length === 1);
check('tìm theo mã NS001', api.listProducts(db, 'NS001')[0].name.includes('Lavie'));

console.log('3) Tạo sản phẩm + cập nhật:');
const p = api.saveProduct(db, { name: 'Bánh mì sandwich', sku: 'BM001', unit: 'gói', costPrice: 15000, salePrice: 18000, stock: 10, minStock: 3 });
check('tạo mới có id', !!p.id);
api.saveProduct(db, { id: p.id, name: 'Bánh mì sandwich', salePrice: 20000, stock: 10 });
check('cập nhật giá bán', api.getProduct(db, p.id).salePrice === 20000);

console.log('4) Tạo hóa đơn (trừ tồn kho, tính VAT 8%):');
const prod = api.getProduct(db, p.id);
const inv = await api.createInvoice(db, {
  lines: [
    { product: prod, qty: 2, unitPrice: 20000 },
    { product: api.getProduct(db, api.listProducts(db, 'Lavie')[0].id), qty: 3, unitPrice: 32000 },
  ],
  discount: 10000,
  vatRate: 8,
  note: 'Giao hàng',
});
check('số hóa đơn HD-00001', inv.invoiceNo === 'HD-00001');
check('subtotal = 2*20000 + 3*32000 = 136000', inv.subtotal === 136000);
check('discount 10000', inv.discount === 10000);
check('vat = (136000-10000)*8% = 10080', inv.vatAmount === 10080);
check('total = 136000-10000+10080 = 136080', inv.total === 136080);
check('tồn kho bánh mì: 10-2=8', api.getProduct(db, p.id).stock === 8);
check('4 chi tiết hóa đơn' , api.getInvoiceItems(db, inv.id).length === 2);

console.log('5) Hóa đơn 2: số thứ tự tăng:');
const inv2 = await api.createInvoice(db, {
  lines: [{ product: api.getProduct(db, p.id), qty: 1, unitPrice: 20000 }],
  vatRate: 10,
});
check('số HD-00002', inv2.invoiceNo === 'HD-00002');
check('vat 10% = 2000', inv2.vatAmount === 2000);
check('total = 22000', inv2.total === 22000);

console.log('6) Báo cáo:');
const { from, to } = (await import('./src/utils')).periodRange('today');
const s = api.salesSummary(db, from, to);
check('2 hóa đơn hôm nay', s.count === 2);
check('doanh thu = 136080+22000 = 158080', s.revenue === 158080);
check('top products có bánh mì', api.topProducts(db, from, to, 5).some((t) => t.name.includes('Bánh mì')));
const st = api.stockStats(db);
check('9 sản phẩm trong kho', st.count === 9);

console.log('7) Xóa hóa đơn + hoàn tồn kho:');
await api.deleteInvoice(db, inv2.id, true);
check('hóa đơn bị xóa (không còn trong danh sách)', api.listInvoices(db).every((i) => i.id !== inv2.id));
check('tồn kho hoàn trả: 7+1=8', api.getProduct(db, p.id).stock === 8);

console.log('8) Xóa sản phẩm (mềm):');
api.deleteProduct(db, p.id);
check('không còn trong danh sách', !api.listProducts(db).some((x) => x.id === p.id));
check('vẫn có trong list includeDeleted', api.listProducts(db, undefined, true).some((x) => x.id === p.id && x.deleted === 1));

console.log('9) Sinh PDF hóa đơn:');
const items = api.getInvoiceItems(db, inv.id);
const bytes = buildInvoicePdfBytes(inv, items, {
  name: 'Cửa hàng Test',
  address: '123 Nguyễn Huệ, Q.1, TP.HCM',
  taxCode: '0101234567',
  phone: '0912 000 111',
});
check('PDF > 20KB', bytes.length > 20000);
check('đầu file là %PDF', Buffer.from(bytes.slice(0, 5)).toString() === '%PDF-');
writeFileSync('/tmp/test-hoa-don.pdf', Buffer.from(bytes));
console.log('   (đã lưu mẫu: /tmp/test-hoa-don.pdf,', bytes.length, 'bytes)');

console.log('');
console.log(fail === 0 ? `✅ TẤT CẢ ${pass} TEST ĐỀU QUA` : `❌ ${fail} test thất bại / ${pass} qua`);
process.exit(fail === 0 ? 0 : 1);
