import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Switch, Alert, Share, AppState, Platform,
  PermissionsAndroid,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header, Card, Button, Chip } from '../src/components/ui';
import { colors, radius } from '../src/theme';
import {
  SCREEN_OCR_AVAILABLE,
  REGION_LABELS,
  type ReadRegion,
  type OcrResult,
  type OcrState,
  addOcrListener,
  addStateListener,
  startScreenReading,
  stopScreenReading,
  isScreenReading,
  getLatestOcrResult,
  hasOverlayPermission,
  openOverlaySettings,
  buildReportText,
  formatTime,
} from '../src/screen-ocr';

const INTERVALS = [
  { label: '0,5 giây', value: 500 },
  { label: '1 giây', value: 1000 },
  { label: '2 giây', value: 2000 },
  { label: '3 giây', value: 3000 },
];

const REGIONS: ReadRegion[] = ['full', 'top', 'bottom'];

type Snapshot = { id: number; result: OcrResult };

export default function ScreenReaderScreen() {
  const router = useRouter();

  const [running, setRunning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [intervalMs, setIntervalMs] = useState(1500);
  const [region, setRegion] = useState<ReadRegion>('full');
  const [showOverlay, setShowOverlay] = useState(false);
  const [numbersOnly, setNumbersOnly] = useState(true);
  const [overlayAllowed, setOverlayAllowed] = useState(true);
  const [latest, setLatest] = useState<OcrResult | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const nextId = useRef(1);

  // Đăng ký nhận kết quả OCR + thay đổi trạng thái từ native
  useEffect(() => {
    if (!SCREEN_OCR_AVAILABLE) return;
    const resultSub = addOcrListener((result) => {
      setLatest(result);
      if (result.error) {
        setErrorMsg(result.error);
        return;
      }
      setErrorMsg('');
      setSnapshots((prev) => [{ id: nextId.current++, result }, ...prev].slice(0, 30));
    });
    const stateSub = addStateListener((state: OcrState) => {
      setStatusMsg(state.message);
      setRunning(state.state === 'running');
      if (state.state === 'overlay_denied') {
        setOverlayAllowed(false);
      }
    });
    return () => {
      resultSub.remove();
      stateSub.remove();
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!SCREEN_OCR_AVAILABLE) return;
    const isRunning = await isScreenReading();
    setRunning(isRunning);
    setOverlayAllowed(await hasOverlayPermission());
    const last = await getLatestOcrResult();
    if (last) setLatest(last);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
      const sub = AppState.addEventListener('change', (state) => {
        if (state === 'active') refresh();
      });
      return () => sub.remove();
    }, [refresh])
  );

  const handleStart = async () => {
    setErrorMsg('');
    if (showOverlay && !overlayAllowed) {
      Alert.alert(
        'Cần quyền hiển thị trên ứng dụng khác',
        'Bảng kết quả nổi cần quyền "Hiển thị trên ứng dụng khác". Bấm mở cài đặt để cấp quyền, hoặc tắt bảng nổi.',
        [
          { text: 'Để sau', style: 'cancel' },
          { text: 'Mở cài đặt', onPress: () => openOverlaySettings() },
        ]
      );
      return;
    }
    // Android 13+: xin quyền hiện thông báo để người dùng thấy và dừng được dịch vụ.
    if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
      try {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      } catch {
        // người dùng từ chối => dịch vụ vẫn chạy, chỉ không hiện thông báo
      }
    }
    setStarting(true);
    try {
      await startScreenReading({
        intervalMs,
        region,
        showOverlay,
        numbersOnly,
      });
      setRunning(true);
      setStatusMsg('Đang đọc màn hình');
    } catch (e: any) {
      const message = e?.message ?? 'Không bắt đầu được việc đọc màn hình.';
      if (message.includes('chưa cho phép')) {
        // Người dùng bấm "Hủy" ở hộp thoại hệ thống: chỉ báo nhẹ, không làm phiền.
        setStatusMsg('Bạn đã huỷ hộp thoại cho phép ghi màn hình');
        setErrorMsg('');
      } else {
        setErrorMsg(message);
        Alert.alert('Không thể bắt đầu', message);
      }
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async () => {
    setStarting(true);
    try {
      await stopScreenReading();
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Không dừng được việc đọc màn hình.');
    } finally {
      setRunning(false);
      setStatusMsg('Đã dừng đọc màn hình');
      setStarting(false);
    }
  };

  const shareText = async () => {
    const text = buildReportText(latest) || latest?.text || '';
    if (!text.trim()) {
      Alert.alert('Chưa có dữ liệu', 'Hãy bắt đầu đọc màn hình trước đã.');
      return;
    }
    try {
      await Share.share({ message: text });
    } catch {
      // người dùng huỷ
    }
  };

  // ---------- Chưa có module native (web / Expo Go) ----------
  if (!SCREEN_OCR_AVAILABLE) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Header title="Đọc dữ liệu màn hình" onBack={() => router.back()} />
        <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}>
          <Card style={{ padding: 14, backgroundColor: colors.warningSoft, borderColor: '#FEDF89' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Ionicons name="warning" size={18} color={colors.warning} />
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#B54708' }}>
                Chưa dùng được ở đây
              </Text>
            </View>
            <Text style={{ fontSize: 12.5, color: '#B54708', lineHeight: 19 }}>
              Tính năng đọc chữ trên màn hình cần quyền hệ thống Android (MediaProjection) và
              thư viện OCR native, nên <Text style={{ fontWeight: '800' }}>không chạy trên trình duyệt web</Text> và{' '}
              <Text style={{ fontWeight: '800' }}>không chạy trong Expo Go</Text>.
            </Text>
          </Card>

          <Card style={{ padding: 14 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 8 }}>
              Cách bật tính năng
            </Text>
            {[
              'Build APK từ mã nguồn này (xem XAY-DUNG-APK.md) — module native được biên dịch kèm.',
              'Cài APK lên máy Android thật (máy ảo cũng được, nhưng OCR chậm hơn).',
              'Mở app → mục "Đọc dữ liệu màn hình" → bấm Bắt đầu và đồng ý cho phép ghi màn hình.',
              'Bật "Bảng nổi" nếu muốn xem kết quả ngay trên game (cần quyền Hiển thị trên ứng dụng khác).',
            ].map((step, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.primary }}>{i + 1}.</Text>
                <Text style={{ flex: 1, fontSize: 12.5, color: colors.sub, lineHeight: 19 }}>{step}</Text>
              </View>
            ))}
            <Text style={{ fontSize: 11.5, color: colors.faint, marginTop: 4 }}>
              Nền tảng hiện tại: {Platform.OS}
            </Text>
          </Card>
        </ScrollView>
      </View>
    );
  }

  // ---------- Giao diện chính ----------
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Đọc dữ liệu màn hình" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 28, gap: 12 }}>
        {/* Trạng thái */}
        <Card style={{ padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 38, height: 38, borderRadius: 12,
                backgroundColor: running ? colors.successSoft : colors.primarySoft,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons
                name={running ? 'radio' : 'scan'}
                size={20}
                color={running ? colors.success : colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                {running ? 'Đang đọc màn hình' : 'Chưa chạy'}
              </Text>
              <Text style={{ fontSize: 11.5, color: colors.sub, marginTop: 2 }}>
                {statusMsg || 'Chọn chu kỳ & vùng đọc, sau đó bấm Bắt đầu'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Button
              title={running ? 'Đang chạy' : 'Bắt đầu'}
              icon="play"
              size="lg"
              style={{ flex: 1 }}
              disabled={running}
              loading={starting && !running}
              onPress={handleStart}
            />
            <Button
              title="Dừng"
              icon="stop"
              size="lg"
              variant="outline"
              style={{ flex: 1 }}
              disabled={!running}
              loading={starting && running}
              onPress={handleStop}
            />
          </View>

          {errorMsg ? (
            <Text style={{ fontSize: 12, color: colors.danger, marginTop: 10 }}>{errorMsg}</Text>
          ) : null}
        </Card>

        {/* Cấu hình */}
        <Card style={{ padding: 14 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text, marginBottom: 6 }}>
            Chu kỳ đọc
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {INTERVALS.map((item) => (
              <Chip
                key={item.value}
                label={item.label}
                selected={intervalMs === item.value}
                onPress={() => setIntervalMs(item.value)}
              />
            ))}
          </View>

          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text, marginTop: 10, marginBottom: 6 }}>
            Vùng đọc
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {REGIONS.map((r) => (
              <Chip
                key={r}
                label={REGION_LABELS[r]}
                selected={region === r}
                onPress={() => setRegion(r)}
              />
            ))}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                Bảng kết quả nổi trên game
              </Text>
              <Text style={{ fontSize: 11.5, color: colors.sub, marginTop: 2 }}>
                {overlayAllowed ? 'Đã có quyền hiển thị trên ứng dụng khác' : 'Chưa được cấp quyền'}
              </Text>
            </View>
            <Switch
              value={showOverlay}
              onValueChange={(v) => setShowOverlay(v)}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>

          {!overlayAllowed ? (
            <Pressable
              onPress={() => openOverlaySettings()}
              style={{
                marginTop: 8, paddingVertical: 9, paddingHorizontal: 12,
                borderRadius: radius.sm, backgroundColor: colors.primarySoft,
                flexDirection: 'row', alignItems: 'center', gap: 6,
              }}
            >
              <Ionicons name="open-outline" size={15} color={colors.primary} />
              <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.primary }}>
                Mở cài đặt cấp quyền hiển thị
              </Text>
            </Pressable>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                Bảng nổi chỉ hiện dòng có số
              </Text>
              <Text style={{ fontSize: 11.5, color: colors.sub, marginTop: 2 }}>
                Lọc bớt chữ trang trí của game
              </Text>
            </View>
            <Switch
              value={numbersOnly}
              onValueChange={setNumbersOnly}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
        </Card>

        {/* Số liệu mới nhất */}
        <Card style={{ padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>
              Kết quả mới nhất
            </Text>
            <Pressable onPress={shareText} hitSlop={8}>
              <Ionicons name="share-social-outline" size={18} color={colors.primary} />
            </Pressable>
          </View>

          {latest ? (
            <>
              <Text style={{ fontSize: 11.5, color: colors.faint, marginTop: 4 }}>
                {formatTime(latest.timestamp)} · khung {latest.width}×{latest.height}
              </Text>
              {latest.numbers.length ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {latest.numbers.slice(0, 12).map((n, i) => (
                    <View
                      key={`${n}-${i}`}
                      style={{
                        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
                        backgroundColor: colors.successSoft,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#067647' }}>{n}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              <Text
                selectable
                style={{ fontSize: 13, color: colors.text, lineHeight: 20, marginTop: 10 }}
              >
                {latest.lines.length ? latest.lines.slice(0, 20).join('\n') : latest.text || 'Không có chữ nào.'}
              </Text>
            </>
          ) : (
            <Text style={{ fontSize: 12.5, color: colors.sub, marginTop: 8, lineHeight: 19 }}>
              Chưa có dữ liệu. Bấm Bắt đầu, đồng ý cho phép ghi màn hình rồi mở game lên —
              kết quả sẽ xuất hiện ở đây và trên bảng nổi.
            </Text>
          )}
        </Card>

        {/* Lịch sử */}
        {snapshots.length > 0 ? (
          <Card style={{ padding: 14 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text, marginBottom: 8 }}>
              Lịch sử ({snapshots.length})
            </Text>
            {snapshots.slice(0, 10).map((snap) => (
              <View
                key={snap.id}
                style={{
                  paddingVertical: 7,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 11.5, color: colors.faint, width: 52 }}>
                  {formatTime(snap.result.timestamp)}
                </Text>
                <Text
                  style={{ flex: 1, fontSize: 12.5, color: colors.text }}
                  numberOfLines={2}
                >
                  {snap.result.numbers.length
                    ? snap.result.numbers.slice(0, 8).join(' · ')
                    : snap.result.lines.slice(0, 2).join(' / ')}
                </Text>
              </View>
            ))}
          </Card>
        ) : null}

        {/* Lưu ý */}
        <Card style={{ padding: 14, backgroundColor: colors.warningSoft, borderColor: '#FEDF89' }}>
          <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#B54708', marginBottom: 6 }}>
            Lưu ý khi dùng
          </Text>
          {[
            'Android luôn hiện hộp thoại xin phép ghi màn hình — không thể bỏ qua, và mỗi lần bắt đầu phải đồng ý lại.',
            'Khi app chạy nền, hệ thống hiện thông báo "Đang đọc màn hình"; bấm vào đó để dừng bất cứ lúc nào.',
            'OCR đọc chữ tiếng Việt/Anh/số. Chữ quá nhỏ, nền phức tạp hoặc hiệu ứng mờ sẽ đọc sai — hãy chọn "Vùng đọc" hẹp hơn.',
            'Màn hình tắt/khóa thì không đọc được (khung hình đen).',
            'Tôn trọng điều khoản của game: nhiều game cấm công cụ đọc/hiển thị hỗ trợ. Chỉ dùng cho dữ liệu của chính bạn.',
          ].map((note, i) => (
            <Text key={i} style={{ fontSize: 12, color: '#B54708', lineHeight: 18, marginBottom: 4 }}>
              • {note}
            </Text>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}
