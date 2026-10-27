import { NativeModule, requireOptionalNativeModule } from 'expo-modules-core';

/** Một khung hình đã được OCR. */
export type OcrResult = {
  text: string;
  lines: string[];
  numbers: string[];
  timestamp: number;
  width: number;
  height: number;
  error: string | null;
};

/** Trạng thái của service đọc màn hình. */
export type OcrState = {
  state: 'running' | 'stopped' | 'error' | 'overlay_denied';
  message: string;
  running: boolean;
};

export type StartScreenOcrOptions = {
  /** Chu kỳ đọc, 500–10000ms */
  intervalMs?: number;
  /** Vùng đọc (tỉ lệ 0..1 theo chiều dọc) */
  cropTop?: number;
  cropBottom?: number;
  /** Hiện bảng kết quả nổi trên game */
  showOverlay?: boolean;
  /** Trên bảng nổi chỉ hiện các dòng có số */
  numbersOnly?: boolean;
  maxLines?: number;
};

export type ScreenOcrEvents = {
  onOcr: (result: OcrResult) => void;
  onState: (state: OcrState) => void;
};

declare class ScreenOcrNativeModule extends NativeModule<ScreenOcrEvents> {
  startAsync(options: StartScreenOcrOptions): Promise<boolean>;
  stopAsync(): Promise<boolean>;
  isRunningAsync(): Promise<boolean>;
  /** JSON string của lần đọc gần nhất (null nếu chưa có) */
  getLatestResultAsync(): Promise<string | null>;
  hasOverlayPermissionAsync(): Promise<boolean>;
  openOverlaySettingsAsync(): Promise<boolean>;
}

/**
 * `null` khi chạy trên web / Expo Go / bản build chưa có module native.
 * Muốn dùng phải build APK (development build hoặc EAS build).
 */
const ScreenOcr: ScreenOcrNativeModule | null =
  requireOptionalNativeModule<ScreenOcrNativeModule>('ScreenOcr');

export default ScreenOcr;
