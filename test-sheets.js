// Test logic của Code.gs (Google Apps Script) bằng các stub mô phỏng SpreadsheetApp
const fs = require('fs');
const vm = require('vm');

// ===== STUBS =====
class FakeRange {
  constructor(sheet, r1, c1, r2, c2) {
    this.sheet = sheet; this.r1 = r1; this.c1 = c1; this.r2 = r2; this.c2 = c2;
  }
  setValues(values) {
    for (let r = 0; r < values.length; r++) {
      for (let c = 0; c < values[r].length; c++) {
        this.sheet.set(this.r1 + r, this.c1 + c, values[r][c]);
      }
    }
    this.sheet._dirty = true;
    return this;
  }
  getValues() {
    const out = [];
    for (let r = this.r1; r <= this.r2; r++) {
      const row = [];
      for (let c = this.c1; c <= this.c2; c++) row.push(this.sheet.get(r, c));
      out.push(row);
    }
    return out;
  }
  setFontWeight() { return this; }
  setBackground() { return this; }
  setFontColor() { return this; }
}
class FakeSheet {
  constructor(name) { this.name = name; this.data = {}; this._dirty = false; }
  set(r, c, v) { this.data[r + ',' + c] = v; }
  get(r, c) { return this.data[r + ',' + c]; }
  clearContents() { this.data = {}; }
  getLastRow() {
    let max = 0;
    for (const k of Object.keys(this.data)) {
      const r = parseInt(k.split(',')[0]);
      if (r > max) max = r;
    }
    return max;
  }
  getRange(r1, c1, nRows, nCols) {
    return new FakeRange(this, r1, c1, r1 + nRows - 1, c1 + nCols - 1);
  }
}
class FakeSS {
  constructor() { this.sheets = {}; }
  getSheetByName(name) { return this.sheets[name] || null; }
  insertSheet(name) { const sh = new FakeSheet(name); this.sheets[name] = sh; return sh; }
}

// ===== CHẠY CODE.GS =====
const ss = new FakeSS();
const sandbox = {
  console,
  JSON,
  Date,
  LockService: {
    _lock: null,
    getScriptLock() {
      const self = this;
      return {
        tryLock() { self._lock = true; return true; },
        releaseLock() { self._lock = null; },
      };
    },
  },
  SpreadsheetApp: { getActiveSpreadsheet: () => ss },
  ContentService: {
    MimeType: { JSON: 'application/json' },
    createTextOutput(text) { return { setMimeType: () => ({ _text: text }) }; },
  },
};
sandbox.ContentService.createTextOutput = (text) => ({
  setMimeType: () => ({ text }),
});
const code = fs.readFileSync('google-sheets-backend/Code.gs', 'utf8');
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log('  ✓', name); }
  else { fail++; console.log('  ✗', name); }
}

console.log('1) PUSH lần đầu (tạo sheet + ghi dữ liệu):');
const pushPayload = {
  op: 'push',
  products: [
    { id: 'p1', name: 'Nước suối', sku: 'NS001', unit: 'lốc', costPrice: 28000, salePrice: 32000, stock: 10, minStock: 2, note: '', updatedAt: '2026-10-08T00:00:00.000Z', deleted: 0 },
    { id: 'p2', name: 'Đường cát', sku: 'DG003', unit: 'gói', costPrice: 26000, salePrice: 29500, stock: 5, minStock: 1, note: '', updatedAt: '2026-10-08T00:00:00.000Z', deleted: 0 },
  ],
  customers: [
    { id: 'c1', name: 'Chị Hoa', phone: '0987', address: 'Nga Sơn', note: '', updatedAt: '2026-10-08T00:00:00.000Z', deleted: 0 },
  ],
  invoices: [
    { id: 'i1', invoiceNo: 'HD-00001', customerId: 'c1', customerName: 'Chị Hoa', customerPhone: '0987', customerAddress: 'Nga Sơn', subtotal: 100000, discount: 0, vatRate: 8, vatAmount: 8000, total: 108000, note: '', createdAt: '2026-10-08T00:00:00.000Z', updatedAt: '2026-10-08T00:00:00.000Z', deleted: 0 },
  ],
  items: [
    { id: 'it1', invoiceId: 'i1', productId: 'p1', productName: 'Nước suối', sku: 'NS001', unit: 'lốc', unitPrice: 32000, quantity: 3, lineTotal: 96000, updatedAt: '2026-10-08T00:00:00.000Z' },
  ],
  meta: [
    { key: 'shop_name', value: 'Cửa hàng Test', updatedAt: '2026-10-08T00:00:00.000Z' },
    { key: 'next_invoice_no', value: '2', updatedAt: '2026-10-08T00:00:00.000Z' },
  ],
};
const res1 = sandbox.doPost({ postData: { contents: JSON.stringify(pushPayload) } });
const json1 = JSON.parse(res1.text);
check('doPost trả về ok', json1.ok === true);
check('counts.total = 7', json1.counts.total === 7);
check('tạo tab Products', !!ss.sheets['Products']);
check('tạo tab Meta', !!ss.sheets['Meta']);
const pHeader = ss.sheets['Products'].get(1, 1);
check('header Products bắt đầu "id"', pHeader === 'id');
check('ghi đúng tên sản phẩm', ss.sheets['Products'].get(2, 2) === 'Nước suối');
// cột 4 = barcode (mới thêm) → salePrice dịch sang cột 8
check('ghi đúng giá (number)', ss.sheets['Products'].get(2, 8) === 32000);
check('cột 4 là barcode', ss.sheets['Products'].get(1, 4) === 'barcode');

console.log('2) PULL (đọc lại):');
const res2 = sandbox.doGet({ parameter: { op: 'pull' } });
const json2 = JSON.parse(res2.text);
check('ok', json2.ok === true);
check('2 products', json2.products.length === 2);
check('product p1 name', json2.products.find((p) => p.id === 'p1').name === 'Nước suối');
check('customer p2', json2.customers.length === 1 && json2.customers[0].name === 'Chị Hoa');
check('invoice', json2.invoices.length === 1 && json2.invoices[0].invoiceNo === 'HD-00001');
check('item', json2.items.length === 1 && json2.items[0].lineTotal === 96000);
check('meta shop_name', json2.meta.find((m) => m.key === 'shop_name').value === 'Cửa hàng Test');

console.log('3) PUSH cập nhật (upsert theo id):');
pushPayload.products[0].stock = 7;
pushPayload.products[0].updatedAt = '2026-10-09T00:00:00.000Z';
pushPayload.products.push({ id: 'p3', name: 'Gạo ST25', sku: 'GD004', unit: 'túi', costPrice: 165000, salePrice: 185000, stock: 4, minStock: 2, note: '', updatedAt: '2026-10-09T00:00:00.000Z', deleted: 0 });
const res3 = sandbox.doPost({ postData: { contents: JSON.stringify(pushPayload) } });
const json3 = JSON.parse(res3.text);
check('ok', json3.ok === true);
const res4 = sandbox.doGet({ parameter: { op: 'pull' } });
const json4 = JSON.parse(res4.text);
check('vẫn 3 products (không nhân đôi p1)', json4.products.length === 3);
const p1 = json4.products.find((p) => p.id === 'p1');
check('stock p1 cập nhật thành 7', p1.stock === 7);
check('p3 mới xuất hiện', !!json4.products.find((p) => p.id === 'p3'));

console.log('4) Xóa mềm (deleted=1) được đồng bộ:');
pushPayload.products[0].deleted = 1;
pushPayload.products[0].updatedAt = '2026-10-10T00:00:00.000Z';
const res5 = sandbox.doPost({ postData: { contents: JSON.stringify(pushPayload) } });
const res6 = sandbox.doGet({ parameter: { op: 'pull' } });
const json6 = JSON.parse(res6.text);
check('p1 deleted=1 trong pull', json6.products.find((p) => p.id === 'p1').deleted === 1);

console.log('5) op không hỗ trợ:');
const res7 = sandbox.doPost({ postData: { contents: JSON.stringify({ op: 'xyz' }) } });
const json7 = JSON.parse(res7.text);
check('trả về ok=false', json7.ok === false);
const res8 = sandbox.doGet({ parameter: { op: 'ping' } });
check('ping ok', JSON.parse(res8.text).ok === true);

console.log('');
console.log(fail === 0 ? `✅ TẤT CẢ ${pass} TEST ĐỀU QUA` : `❌ ${fail} test thất bại / ${pass} qua`);
process.exit(fail === 0 ? 0 : 1);
