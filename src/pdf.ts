// ===== Tạo hóa đơn PDF (jsPDF, font Roboto hỗ trợ tiếng Việt) =====
import { jsPDF } from 'jspdf';
import { ROBOTO_REGULAR_B64, ROBOTO_BOLD_B64 } from './fonts/roboto';
import type { Invoice, InvoiceItem, ShopInfo } from './types';
import { fmtMoneyPdf, fmtDateTime, fmtQty } from './utils';

const W = 210; // A4 ngang (mm)
const M = 14; // lề
const RIGHT = W - M; // 196

function loadFonts(doc: jsPDF): void {
  doc.addFileToVFS('Roboto-Regular.ttf', ROBOTO_REGULAR_B64);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', ROBOTO_BOLD_B64);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
  doc.setFont('Roboto', 'normal');
}

export interface PdfShop {
  name: string;
  address: string;
  taxCode: string;
  phone: string;
}

/** Sinh byte PDF của hóa đơn */
export function buildInvoicePdfBytes(invoice: Invoice, items: InvoiceItem[], shop: ShopInfo): Uint8Array {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  loadFonts(doc);

  // ===== PHẦN THƯỞNG: thông tin cửa hàng =====
  let y = 16;
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(15);
  doc.text(shop.name || 'CỬA HÀNG', M, y);

  doc.setFont('Roboto', 'normal');
  doc.setFontSize(9);
  const shopLines: string[] = [];
  if (shop.address) shopLines.push(shop.address);
  if (shop.taxCode) shopLines.push('MST: ' + shop.taxCode);
  if (shop.phone) shopLines.push('SĐT: ' + shop.phone);
  let leftY = y + 6;
  for (const line of shopLines) {
    doc.text(line, M, leftY);
    leftY += 4.2;
  }

  // Tiêu đề bên phải
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(14);
  doc.text('HÓA ĐƠN BÁN HÀNG', RIGHT, y, { align: 'right' });
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(9.5);
  doc.text('Số: ' + invoice.invoiceNo, RIGHT, y + 6, { align: 'right' });
  doc.text('Ngày: ' + fmtDateTime(invoice.createdAt), RIGHT, y + 11, { align: 'right' });

  // Khối khách hàng
  let cy = Math.max(leftY + 1, y + 16);
  doc.setFontSize(10);
  doc.setFont('Roboto', 'bold');
  doc.text('Khách hàng: ', M, cy);
  const nameW = doc.getTextWidth('Khách hàng: ');
  doc.setFont('Roboto', 'normal');
  const customerLine = [invoice.customerName || 'Khách lẻ', invoice.customerPhone, invoice.customerAddress]
    .filter(Boolean).join('  —  ');
  // nếu dài thì xuống dòng
  const first = doc.splitTextToSize(customerLine, RIGHT - M - nameW);
  doc.text(first, M + nameW, cy);
  cy += first.length * 4.4;

  const ruleY = cy + 4;
  doc.setDrawColor(16, 24, 40);
  doc.setLineWidth(0.4);
  doc.line(M, ruleY, RIGHT, ruleY);

  // ===== BẢNG CHI TIẾT =====
  const COL = {
    stt: M,
    name: M + 9,
    nameW: 72,
    unit: 98,
    priceR: 136,
    qtyR: 152,
    totalR: RIGHT,
  };
  let ty = ruleY + 2;

  const drawTableHeader = () => {
    doc.setFillColor(238, 242, 255);
    doc.rect(M, ty, RIGHT - M, 7.5, 'F');
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 66, 168);
    doc.text('STT', COL.stt, ty + 5);
    doc.text('Tên sản phẩm', COL.name, ty + 5);
    doc.text('ĐV', COL.unit, ty + 5);
    doc.text('Đơn giá', COL.priceR, ty + 5, { align: 'right' });
    doc.text('SL', COL.qtyR, ty + 5, { align: 'right' });
    doc.text('Thành tiền', COL.totalR, ty + 5, { align: 'right' });
    doc.setTextColor(16, 24, 40);
    ty += 7.5;
  };
  drawTableHeader();

  doc.setFont('Roboto', 'normal');
  doc.setFontSize(9);
  items.forEach((it, idx) => {
    const nameLines = doc.splitTextToSize(it.productName, COL.nameW);
    const lines = Math.min(nameLines.length, 3);
    const rowH = 5 + (lines - 1) * 3.8 + 2;
    if (ty + rowH > 268) {
      doc.addPage();
      ty = 14;
      drawTableHeader();
      doc.setFont('Roboto', 'normal');
      doc.setFontSize(9);
    }
    const baseY = ty + 4.6;
    doc.text(String(idx + 1), COL.stt, baseY);
    doc.text(nameLines.slice(0, lines), COL.name, baseY);
    doc.text(it.unit, COL.unit, baseY);
    doc.text(fmtMoneyPdf(it.unitPrice), COL.priceR, baseY, { align: 'right' });
    doc.text(fmtQty(it.quantity), COL.qtyR, baseY, { align: 'right' });
    doc.text(fmtMoneyPdf(it.lineTotal), COL.totalR, baseY, { align: 'right' });
    ty += rowH;
  });

  doc.setDrawColor(228, 231, 236);
  doc.setLineWidth(0.2);
  doc.line(M, ty, RIGHT, ty);
  ty += 4;

  // ===== TỔNG TIỀN =====
  const labelX = 128;
  const totalBlock: Array<{ label: string; value: string; bold?: boolean; big?: boolean }> = [
    { label: 'Tổng tiền', value: fmtMoneyPdf(invoice.subtotal) },
  ];
  if (invoice.discount > 0) totalBlock.push({ label: 'Giảm giá', value: '- ' + fmtMoneyPdf(invoice.discount) });
  totalBlock.push({ label: 'Thuế VAT ' + invoice.vatRate + '%', value: fmtMoneyPdf(invoice.vatAmount) });
  totalBlock.push({ label: 'TỔNG CỘNG', value: fmtMoneyPdf(invoice.total), bold: true, big: true });

  let noteY = ty;
  for (const row of totalBlock) {
    const lineH = row.big ? 7 : 5.4;
    if (ty + lineH > 268) {
      doc.addPage();
      ty = 14;
      noteY = ty;
    }
    if (row.big) {
      doc.setFillColor(238, 242, 255);
      doc.rect(labelX - 4, ty - 4.4, RIGHT - labelX + 4, lineH + 1.2, 'F');
    }
    doc.setFont('Roboto', row.bold ? 'bold' : 'normal');
    doc.setFontSize(row.big ? 11.5 : 9.5);
    doc.text(row.label, labelX, ty + (row.big ? 1.5 : 0));
    doc.text(row.value, RIGHT, ty + (row.big ? 1.5 : 0), { align: 'right' });
    ty += lineH;
  }

  // Ghi chú
  if (invoice.note) {
    ty = Math.max(ty, noteY) + 2;
    if (ty + 12 > 268) {
      doc.addPage();
      ty = 14;
    }
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(102, 112, 133);
    const noteLines = doc.splitTextToSize('Ghi chú: ' + invoice.note, RIGHT - M);
    doc.text(noteLines, M, ty + 4);
    doc.setTextColor(16, 24, 40);
    ty += noteLines.length * 4 + 2;
  }

  // ===== CHỮ KÝ =====
  const sigY = Math.max(ty + 16, 240);
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(10);
  doc.text('Xác nhận của người bán', 55, sigY, { align: 'center' });
  doc.text('Khách hàng', 155, sigY, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(102, 112, 133);
  doc.text('(Ký, ghi rõ họ tên)', 55, sigY + 5, { align: 'center' });
  doc.text('(Ký, ghi rõ họ tên)', 155, sigY + 5, { align: 'center' });
  doc.setTextColor(16, 24, 40);

  // ===== CHÂN TRANG =====
  doc.setFontSize(9);
  doc.setTextColor(102, 112, 133);
  doc.text('Cảm ơn quý khách đã tin tưởng và ủng hộ cửa hàng!', W / 2, 290, { align: 'center' });
  doc.setTextColor(16, 24, 40);

  return new Uint8Array(doc.output('arraybuffer'));
}
