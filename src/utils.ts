// ===== Tiện ích chung =====
import type { ReportPeriod } from './types';

/** Sinh id duy nhất */
export function uid(): string {
  try {
    return (globalThis.crypto as any).randomUUID();
  } catch {
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }
}

/** Giờ hiện tại dạng ISO */
export function nowIso(): string {
  return new Date().toISOString();
}

/** Làm tròn tiền (2 số thập phân) */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Định dạng tiền: 1.250.000 ₫ */
export function fmtMoney(n: number): string {
  const v = Math.round(n || 0);
  return v.toLocaleString('vi-VN') + ' ₫';
}

/** Định dạng tiền không ký hiệu (cho PDF): 1.250.000 VNĐ */
export function fmtMoneyPdf(n: number): string {
  const v = Math.round(n || 0);
  return v.toLocaleString('vi-VN') + ' VNĐ';
}

/** Định dạng số lượng: bỏ số 0 thừa */
export function fmtQty(n: number): string {
  const r = Math.round((n || 0) * 1000) / 1000;
  return r.toLocaleString('vi-VN', { maximumFractionDigits: 3 });
}

/** dd/MM/yyyy */
export function fmtDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** dd/MM/yyyy HH:mm */
export function fmtDateTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${fmtDate(iso)} ${hh}:${mi}`;
}

/** Bắt đầu ngày (offset theo ngày) */
export function startOfDay(offsetDays = 0): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d;
}

/** Khoảng thời gian cho báo cáo */
export function periodRange(period: ReportPeriod): { from: Date | null; to: Date | null } {
  const now = new Date();
  switch (period) {
    case 'today':
      return { from: startOfDay(0), to: startOfDay(1) };
    case '7d':
      return { from: startOfDay(-6), to: startOfDay(1) };
    case 'month': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from, to: startOfDay(1) };
    }
    case 'year':
      return { from: new Date(now.getFullYear(), 0, 1), to: startOfDay(1) };
    case 'all':
      return { from: null, to: null };
  }
}

export const PERIOD_LABELS: Record<ReportPeriod, string> = {
  today: 'Hôm nay',
  '7d': '7 ngày',
  month: 'Tháng này',
  year: 'Năm nay',
  all: 'Tất cả',
};

/** Chuyển text nhập tiền thành số: "1.250.000" -> 1250000 */
export function parseNum(s: string | number): number {
  if (typeof s === 'number') return isNaN(s) ? 0 : s;
  const t = String(s).replace(/\./g, '').replace(/,/g, '').replace(/[^0-9.-]/g, '');
  const n = parseFloat(t);
  return isNaN(n) ? 0 : n;
}

/** Định dạng số thành chuỗi hiển thị (chấm phân cách hàng nghìn) */
export function fmtNumInput(n: number): string {
  if (!n) return '';
  return n.toLocaleString('vi-VN');
}
