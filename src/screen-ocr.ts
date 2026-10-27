// ===== Lớp bọc JS cho module native "screen-ocr" (đọc chữ trên màn hình) =====
import { Platform } from 'react-native';
import ScreenOcrNative, {
  type OcrResult,
  type OcrState,
  type StartScreenOcrOptions,
} from '../modules/screen-ocr';

export type { OcrResult, OcrState, StartScreenOcrOptions };

/** Module chỉ có trên Android và chỉ trong bản build native (không có trên web/Expo Go). */
export const SCREEN_OCR_AVAILABLE = Platform.OS === 'android' && ScreenOcrNative != null;

/** Vùng đọc màn hình (tỉ lệ theo chiều dọc). */
export type ReadRegion = 'full' | 'top' | 'bottom';

export const REGION_CROP: Record<ReadRegion, { cropTop: number; cropBottom: number }> = {
  full: { cropTop: 0, cropBottom: 1 },
  top: { cropTop: 0, cropBottom: 0.5 },
  bottom: { cropTop: 0.5, cropBottom: 1 },
};

export const REGION_LABELS: Record<ReadRegion, string> = {
  full: 'Toàn màn hình',
  top: 'Nửa trên',
  bottom: 'Nửa dưới',
};

export type StartReadingOptions = {
  intervalMs: number;
  region: ReadRegion;
  showOverlay: boolean;
  numbersOnly: boolean;
  maxLines?: number;
};

export async function startScreenReading(
  options: StartReadingOptions
): Promise<boolean> {
  if (!ScreenOcrNative) {
    throw new Error('Bản build này chưa có module đọc màn hình (cần APK native, không dùng được trên web/Expo Go).');
  }
  const crop = REGION_CROP[options.region] ?? REGION_CROP.full;
  return ScreenOcrNative.startAsync({
    intervalMs: options.intervalMs,
    cropTop: crop.cropTop,
    cropBottom: crop.cropBottom,
    showOverlay: options.showOverlay,
    numbersOnly: options.numbersOnly,
    maxLines: options.maxLines ?? 6,
  });
}

export async function stopScreenReading(): Promise<boolean> {
  if (!ScreenOcrNative) return false;
  return ScreenOcrNative.stopAsync();
}

export async function isScreenReading(): Promise<boolean> {
  if (!ScreenOcrNative) return false;
  return ScreenOcrNative.isRunningAsync();
}

export async function getLatestOcrResult(): Promise<OcrResult | null> {
  if (!ScreenOcrNative) return null;
  const raw = await ScreenOcrNative.getLatestResultAsync();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<OcrResult>;
    return {
      text: parsed.text ?? '',
      lines: parsed.lines ?? [],
      numbers: parsed.numbers ?? [],
      timestamp: parsed.timestamp ?? Date.now(),
      width: parsed.width ?? 0,
      height: parsed.height ?? 0,
      error: parsed.error ?? null,
    };
  } catch {
    return null;
  }
}

export async function hasOverlayPermission(): Promise<boolean> {
  if (!ScreenOcrNative) return false;
  return ScreenOcrNative.hasOverlayPermissionAsync();
}

export async function openOverlaySettings(): Promise<boolean> {
  if (!ScreenOcrNative) return false;
  return ScreenOcrNative.openOverlaySettingsAsync();
}

export function addOcrListener(callback: (result: OcrResult) => void): { remove: () => void } {
  if (!ScreenOcrNative) return { remove: () => {} };
  return ScreenOcrNative.addListener('onOcr', callback);
}

export function addStateListener(callback: (state: OcrState) => void): { remove: () => void } {
  if (!ScreenOcrNative) return { remove: () => {} };
  return ScreenOcrNative.addListener('onState', callback);
}

// ===== Xử lý văn bản OCR =====

const NUMBER_REGEX =
  /[-+]?\d[\d.,]*(?:\s?(?:%|k|K|M|tr|tỷ|tỉ|xu|kn|KN|vàng|kim cương))?/g;

/** Tách mọi con số (kèm hậu tố đơn vị) xuất hiện trong văn bản OCR. */
export function extractNumbers(text: string): string[] {
  const matches = text.match(NUMBER_REGEX) ?? [];
  return matches.map((m) => m.trim()).filter(Boolean).slice(0, 50);
}

/**
 * Lấy giá trị theo nhãn, ví dụ tìm "Vàng: 1.234" hoặc "Kim cương 56".
 * Trả về map nhãn -> giá trị tìm được gần nhất.
 */
export function pickLabels(
  lines: string[],
  labels: string[]
): Record<string, string> {
  const out: Record<string, string> = {};
  const normalized = lines.map((l) => l.toLowerCase());
  labels.forEach((label) => {
    const needle = label.toLowerCase();
    const line = normalized.find((l) => l.includes(needle));
    if (!line) return;
    const numbers = extractNumbers(line);
    if (numbers.length) out[label] = numbers[0];
  });
  return out;
}

/** Ghép vài dòng OCR thành một chuỗi gọn để chia sẻ / sao chép. */
export function buildReportText(result: OcrResult | null, labels?: string[]): string {
  if (!result) return '';
  const parts: string[] = [];
  if (labels?.length) {
    const picked = pickLabels(result.lines, labels);
    Object.entries(picked).forEach(([k, v]) => parts.push(`${k}: ${v}`));
    if (parts.length) return parts.join('\n');
  }
  if (result.numbers.length) parts.push(result.numbers.join(' · '));
  return parts.length ? parts.join('\n') : result.text;
}

export function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
