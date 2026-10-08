// ===== Quét mã vạch: camera (expo-camera) + nhập tay dự phòng =====
// - Android/iOS: camera native + Google Code Scanner
// - Web: camera của trình duyệt + BarcodeDetector (Chrome/Edge); nếu trình duyệt
//   không hỗ trợ hoặc không cho quyền camera thì dùng ô nhập tay
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CameraType, CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

const BARCODE_TYPES = [
  'ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39',
  'code93', 'codabar', 'itf14', 'datamatrix', 'aztec', 'pdf417', 'qr',
] as const;

export function BarcodeScanner({ onScan, onClose, title = 'Quét mã vạch' }: {
  onScan: (code: string) => void;
  onClose: () => void;
  title?: string;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [manual, setManual] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [camError, setCamError] = useState<string | null>(null);
  const doneRef = useRef(false);

  const webNoDetector =
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    !('BarcodeDetector' in window);

  useEffect(() => {
    // Native: tự xin quyền camera khi chưa quyết định
    if (Platform.OS !== 'web' && permission?.status === 'undetermined') {
      void requestPermission();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission?.status]);

  const handleScanned = (res: BarcodeScanningResult) => {
    if (doneRef.current) return;
    const code = String(res?.data || '').trim();
    if (!code) return;
    doneRef.current = true;
    onScan(code);
  };

  const useManualCode = () => {
    const code = manualCode.trim();
    if (!code) return;
    doneRef.current = true;
    onScan(code);
  };

  const waitingPermission = !!permission && permission.status === 'undetermined';
  const camDenied = permission?.status === 'denied';
  const showCamera = !manual && !camDenied && !waitingPermission && !camError;
  const showNoCam = !manual && !showCamera;

  return (
    <View style={styles.overlay}>
      {/* Camera (điền toàn bộ màn hình) */}
      {showCamera ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
          onBarcodeScanned={handleScanned}
          onMountError={() => setCamError('Không mở được camera')}
        />
      ) : null}

      {/* Khung quét + gợi ý */}
      {showCamera ? (
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.frameWrap} pointerEvents="none">
            <View style={styles.frame} />
            <Text style={styles.hint}>Đưa mã vạch vào trong khung</Text>
            {webNoDetector ? (
              <Text style={styles.hintSub}>Trình duyệt này không hỗ trợ quét tự động — dùng nút "Nhập mã tay" bên dưới</Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Chờ quyền camera (native) */}
      {!manual && waitingPermission ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.hint}>Đang xin quyền sử dụng camera...</Text>
        </View>
      ) : null}

      {/* Camera không khả dụng: thông báo + hướng dẫn */}
      {showNoCam ? (
        <View style={styles.centerWrap}>
          <Ionicons name="camera-outline" size={44} color={colors.faint} />
          {camDenied ? (
            <>
              <Text style={styles.noCamTitle}>Quyền camera bị từ chối</Text>
              <Text style={styles.hint}>Cấp quyền camera trong cài đặt, hoặc nhập mã tay bên dưới.</Text>
              <Pressable
                style={styles.retryBtn}
                onPress={() => { setCamError(null); void requestPermission(); }}
              >
                <Text style={styles.retryText}>Thử xin quyền lại</Text>
              </Pressable>
            </>
          ) : camError ? (
            <>
              <Text style={styles.noCamTitle}>{camError}</Text>
              <Text style={styles.hint}>Bạn có thể nhập mã vạch bằng tay.</Text>
            </>
          ) : (
            <>
              <Text style={styles.noCamTitle}>Không dùng được camera</Text>
              <Text style={styles.hint}>Nhập mã vạch bằng tay ở bên dưới.</Text>
            </>
          )}
        </View>
      ) : null}

      {/* Thanh trên: tiêu đề + nút đóng */}
      <View style={styles.topBar} pointerEvents="box-none">
        <View style={styles.topSpacer} />
        <View style={styles.topTitleBox}>
          <Text style={styles.topTitleText}>{title}</Text>
        </View>
        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Nút chuyển: nhập tay / camera */}
      <Pressable
        style={styles.manualToggle}
        onPress={() => { setManual((m) => !m); setManualCode(''); }}
      >
        <Ionicons name={manual ? 'camera' : 'create-outline'} size={16} color="#fff" />
        <Text style={styles.manualToggleText}>{manual ? 'Quét bằng camera' : 'Nhập mã tay'}</Text>
      </Pressable>

      {/* Ô nhập tay */}
      {manual ? (
        <View style={styles.manualPanel}>
          <Text style={styles.manualLabel}>Nhập mã vạch / mã hàng</Text>
          <TextInput
            value={manualCode}
            onChangeText={setManualCode}
            onSubmitEditing={useManualCode}
            placeholder="VD: 8935049800123"
            placeholderTextColor={colors.faint}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.manualInput}
          />
          <Pressable style={styles.manualOkBtn} onPress={useManualCode} disabled={!manualCode.trim()}>
            <Text style={styles.manualOkText}>Dùng mã này</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#0B1220',
    zIndex: 1000,
  },
  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 58,
    paddingHorizontal: 14,
    paddingBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  topSpacer: { width: 36 },
  topTitleBox: { flex: 1 },
  topTitleText: { color: '#fff', fontSize: 15.5, fontWeight: '700' },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  frameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: {
    width: 230,
    height: 140,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14,
  },
  hint: { color: 'rgba(255,255,255,0.92)', fontSize: 14, fontWeight: '600', marginTop: 14, textAlign: 'center', paddingHorizontal: 30 },
  hintSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 6, textAlign: 'center', paddingHorizontal: 30 },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  noCamTitle: { color: '#fff', fontSize: 15.5, fontWeight: '700', marginTop: 12, textAlign: 'center' },
  retryBtn: { marginTop: 18, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 20 },
  retryText: { color: '#fff', fontSize: 13.5, fontWeight: '700' },
  manualToggle: {
    position: 'absolute',
    bottom: 26,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  manualToggleText: { color: '#fff', fontSize: 13.5, fontWeight: '700' },
  manualPanel: {
    position: 'absolute',
    bottom: 74,
    left: 16,
    right: 16,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    ...{ shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 10 },
  },
  manualLabel: { fontSize: 13, fontWeight: '600', color: colors.sub, marginBottom: 6 },
  manualInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    marginBottom: 10,
    backgroundColor: colors.bg,
  },
  manualOkBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 11,
    alignItems: 'center',
  },
  manualOkText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
