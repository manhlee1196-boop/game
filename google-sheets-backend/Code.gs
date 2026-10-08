/**
 * ============================================================
 *  BACKEND GOOGLE SHEETS — App "Kho Hàng & Hóa Đơn"
 * ============================================================
 *  CÁCH DÙNG:
 *  1. Tạo Google Sheet mới → Extensions → Apps Script.
 *  2. Xóa code mẫu, dán toàn bộ file này vào.
 *  3. Deploy → New deployment → loại "Web app":
 *       - Execute as:  Me (tài khoản của bạn)
 *       - Who has access: Anyone
 *  4. Copy "Web app URL" (kết thúc bằng /exec) vào app
 *     (mục Cài đặt → Đồng bộ Google Sheets).
 *
 *  Các tab (Products, Customers, Invoices, Items, Meta)
 *  sẽ tự động được tạo khi đồng bộ lần đầu.
 *
 *  Giao tiếp:
 *  - GET  ?op=pull   → trả về toàn bộ dữ liệu (JSON)
 *  - POST (body JSON: {op:'push', products:[], customers:[],
 *                      invoices:[], items:[], meta:[]})
 *    → ghi đè/cập nhật các dòng theo id.
 * ============================================================
 */

var LOCK_TIMEOUT = 20000;

var SHEETS = {
  products: {
    tab: 'Products',
    idField: 'id',
    headers: ['id', 'name', 'sku', 'category', 'unit', 'costPrice', 'salePrice', 'stock', 'minStock', 'note', 'updatedAt', 'deleted']
  },
  customers: {
    tab: 'Customers',
    idField: 'id',
    headers: ['id', 'name', 'phone', 'address', 'note', 'updatedAt', 'deleted']
  },
  invoices: {
    tab: 'Invoices',
    idField: 'id',
    headers: ['id', 'invoiceNo', 'customerId', 'customerName', 'customerPhone', 'customerAddress',
              'subtotal', 'discount', 'vatRate', 'vatAmount', 'total', 'note', 'createdAt', 'updatedAt', 'deleted']
  },
  items: {
    tab: 'Items',
    idField: 'id',
    headers: ['id', 'invoiceId', 'productId', 'productName', 'sku', 'unit', 'unitPrice', 'quantity', 'lineTotal', 'updatedAt']
  },
  meta: {
    tab: 'Meta',
    idField: 'key',
    headers: ['key', 'value', 'updatedAt']
  }
};

// ===================== HTTP HANDLERS =====================

function doGet(e) {
  var op = e && e.parameter ? e.parameter.op : null;
  if (op === 'ping') {
    return out_({ ok: true, pong: new Date().toISOString() });
  }
  // op = 'pull' (mặc định)
  var data = {
    ok: true,
    op: 'pull',
    products: safeRead_(SHEETS.products),
    customers: safeRead_(SHEETS.customers),
    invoices: safeRead_(SHEETS.invoices),
    items: safeRead_(SHEETS.items),
    meta: safeRead_(SHEETS.meta),
    serverTime: new Date().toISOString()
  };
  return out_(data);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_TIMEOUT)) {
    return out_({ ok: false, error: 'Đang có thao tác khác, vui lòng thử lại sau 5 giây.' });
  }
  try {
    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (err) {
      return out_({ ok: false, error: 'Body không phải JSON hợp lệ.' });
    }
    if (!data || data.op !== 'push') {
      return out_({ ok: false, error: 'Chỉ hỗ trợ op = "push".' });
    }
    var counts = {
      products: upsert_(SHEETS.products, data.products || []),
      customers: upsert_(SHEETS.customers, data.customers || []),
      invoices: upsert_(SHEETS.invoices, data.invoices || []),
      items: upsert_(SHEETS.items, data.items || []),
      meta: upsert_(SHEETS.meta, data.meta || [])
    };
    counts.total = counts.products + counts.customers + counts.invoices + counts.items + counts.meta;
    return out_({ ok: true, counts: counts, serverTime: new Date().toISOString() });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// ===================== NỘI BỘ =====================

function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function ensureTab_(def) {
  var ss = ss_();
  var sh = ss.getSheetByName(def.tab);
  if (!sh) {
    sh = ss.insertSheet(def.tab);
  }
  return sh;
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function cleanValue_(v) {
  if (v === undefined || v === null) return '';
  return v;
}

/** Đọc toàn bộ tab thành mảng object */
function safeRead_(def) {
  var sh = ss_().getSheetByName(def.tab);
  if (!sh || sh.getLastRow() < 2) return [];
  var values = sh.getRange(2, 1, sh.getLastRow() - 1, def.headers.length).getValues();
  var result = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    if (row[0] === '' && row[0] === null) continue;
    var o = {};
    for (var h = 0; h < def.headers.length; h++) {
      o[def.headers[h]] = row[h];
    }
    result.push(o);
  }
  return result;
}

/**
 * Cập nhật/thêm các dòng theo idField.
 * incoming: mảng object (camelCase, giống data của app).
 * Trả về số dòng đã nhận.
 */
function upsert_(def, incoming) {
  if (!incoming.length) return 0;
  var sh = ensureTab_(def);
  var headers = def.headers;
  var idField = def.idField;

  // Đọc dữ liệu cũ thành map
  var map = {};
  var old = safeRead_(def);
  for (var i = 0; i < old.length; i++) {
    var key = old[i][idField];
    if (key !== undefined && key !== null && key !== '') map[String(key)] = old[i];
  }

  // Gộp: dòng mới ghi đè dòng cũ theo id
  var n = 0;
  for (var j = 0; j < incoming.length; j++) {
    var row = incoming[j];
    var id = row[idField];
    if (id === undefined || id === null || id === '') continue;
    map[String(id)] = row;
    n++;
  }

  // Viết lại toàn bộ tab
  var rows = [];
  for (var key in map) {
    if (!map.hasOwnProperty(key)) continue;
    var r = map[key];
    var arr = [];
    for (var h2 = 0; h2 < headers.length; h2++) {
      arr.push(cleanValue_(r[headers[h2]]));
    }
    rows.push(arr);
  }

  sh.clearContents();
  sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#2757D6').setFontColor('#FFFFFF');
  if (rows.length) {
    sh.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  return n;
}
