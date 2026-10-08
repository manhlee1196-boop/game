import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { Header, Card, Button, Input, Chip } from '../src/components/ui';
import { getMeta, setMeta, resetAllData } from '../src/db';
import { getSyncUrl, setSyncUrl, syncNow, getLastSyncAt } from '../src/sync';
import { fmtDateTime } from '../src/utils';
import { colors } from '../src/theme';

const VAT_RATES = [0, 5, 8, 10];

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();

  const [shopName, setShopName] = useState(getMeta(db, 'shop_name') || '');
  const [shopAddress, setShopAddress] = useState(getMeta(db, 'shop_address') || '');
  const [shopTax, setShopTax] = useState(getMeta(db, 'shop_tax') || '');
  const [shopPhone, setShopPhone] = useState(getMeta(db, 'shop_phone') || '');
  const [prefix, setPrefix] = useState(getMeta(db, 'invoice_prefix') || 'HD');
  const [vat, setVat] = useState(parseInt(getMeta(db, 'default_vat') || '8', 10));
  const [syncUrl, setSyncUrlState] = useState(getSyncUrl(db));
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  const saveShop = () => {
    setMeta(db, 'shop_name', shopName.trim() || 'Cửa hàng của tôi');
    setMeta(db, 'shop_address', shopAddress.trim());
    setMeta(db, 'shop_tax', shopTax.trim());
    setMeta(db, 'shop_phone', shopPhone.trim());
    setMeta(db, 'invoice_prefix', prefix.trim() || 'HD');
    setMeta(db, 'default_vat', String(vat));
    Alert.alert('Đã lưu', 'Thông tin cửa hàng đã được cập nhật.');
  };

  const runSync = async (opts: { push?: boolean; pull?: boolean }) => {
    const url = syncUrl.trim();
    setSyncUrl(db, url);
    setSyncing(true);
    setSyncMsg('');
    const r = await syncNow(db, opts);
    setSyncMsg(r.message);
    setSyncing(false);
  };

  const resetAll = () => {
    Alert.alert(
      'Xóa toàn bộ dữ liệu?',
      'Toàn bộ sản phẩm, khách hàng và hóa đơn sẽ bị XÓA VĨNH VIỄN khỏi điện thoại này (dữ liệu trên Google Sheets không bị ảnh hưởng). Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: () => {
            resetAllData(db);
            Alert.alert('Đã xóa', 'Toàn bộ dữ liệu đã được xóa.');
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Cài đặt" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }} keyboardShouldPersistTaps="handled">
        {/* Thông tin cửa hàng */}
        <Text style={sectionTitle}>THÔNG TIN CỬA HÀNG (hiện trên hóa đơn)</Text>
        <Card style={{ padding: 12 }}>
          <Input label="Tên cửa hàng" value={shopName} onChangeText={setShopName} />
          <Input label="Địa chỉ" value={shopAddress} onChangeText={setShopAddress} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Input label="Mã số thuế" value={shopTax} onChangeText={setShopTax} placeholder="Tùy chọn" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Số điện thoại" value={shopPhone} onChangeText={setShopPhone} placeholder="Tùy chọn" keyboardType="phone-pad" />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 4 }}>
            <View style={{ width: 110 }}>
              <Input label="Tiền tố hóa đơn" value={prefix} onChangeText={setPrefix} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.sub, marginBottom: 5 }}>VAT mặc định</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                {VAT_RATES.map((r) => (
                  <Chip key={r} label={r === 0 ? '0%' : r + '%'} small selected={vat === r} onPress={() => setVat(r)} />
                ))}
              </View>
            </View>
          </View>
          <Button title="Lưu thông tin" icon="checkmark" onPress={saveShop} />
        </Card>

        {/* Đồng bộ Google Sheets */}
        <Text style={sectionTitle}>ĐỒNG BỘ GOOGLE SHEETS</Text>
        <Card style={{ padding: 12 }}>
          <Text style={{ fontSize: 12.5, color: colors.sub, marginBottom: 8, lineHeight: 18 }}>
            Dữ liệu luôn lưu trong điện thoại (dùng được cả khi offline). Khi kết nối Google Sheets,
            bạn có thể sao lưu & xem dữ liệu trên bảng tính, dùng chung cho nhiều điện thoại.
          </Text>
          <Input
            label="Địa chỉ Web App (Apps Script)"
            value={syncUrl}
            onChangeText={setSyncUrlState}
            placeholder="https://script.google.com/macros/s/.../exec"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            <Button title="Lấy dữ liệu" icon="cloud-download" variant="soft" style={{ flex: 1 }} loading={syncing} onPress={() => runSync({ push: false, pull: true })} />
            <Button title="Sao lưu lên Sheet" icon="cloud-upload" variant="soft" style={{ flex: 1 }} loading={syncing} onPress={() => runSync({ push: true, pull: false })} />
          </View>
          <Button title="Đồng bộ 2 chiều" icon="sync" size="lg" loading={syncing} onPress={() => runSync({ push: true, pull: true })} />
          {syncMsg ? (
            <Text style={{ fontSize: 12.5, marginTop: 10, fontWeight: '600', color: syncMsg.startsWith('Lỗi') ? colors.danger : colors.success }}>
              {syncMsg}
            </Text>
          ) : null}
          {getLastSyncAt(db) ? (
            <Text style={{ fontSize: 11.5, color: colors.faint, marginTop: 6 }}>
              Lần đồng bộ gần nhất: {fmtDateTime(getLastSyncAt(db))}
            </Text>
          ) : null}

          <Pressable onPress={() => setShowGuide((s) => !s)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
            <Ionicons name={showGuide ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700', marginLeft: 5 }}>
              {showGuide ? 'Ẩn hướng dẫn kết nối' : 'Xem hướng dẫn kết nối Google Sheets'}
            </Text>
          </Pressable>
          {showGuide ? (
            <View style={{ backgroundColor: colors.bg, borderRadius: 10, padding: 12, marginTop: 8 }}>
              <Text style={{ fontSize: 12.5, color: colors.text, lineHeight: 20 }}>
                1. Mở Google Sheets trên máy tính, tạo bảng tính mới.{'\n'}
                2. Chọn menu <Text style={{ fontWeight: '700' }}>Extensions → Apps Script</Text>.{'\n'}
                3. Xóa code mẫu, dán toàn bộ nội dung file{' '}
                <Text style={{ fontWeight: '700' }}>google-sheets-backend/Code.gs</Text> trong thư mục dự án (bạn có thể gửi file này cho mình hoặc sao chép từ repo).{'\n'}
                4. Nhấn <Text style={{ fontWeight: '700' }}>Deploy → New deployment → Web app</Text>.{'\n'}
                5. Chọn <Text style={{ fontWeight: '700' }}>Execute as: Me</Text> và{' '}
                <Text style={{ fontWeight: '700' }}>Who has access: Anyone</Text>, rồi Deploy.{'\n'}
                6. Copy <Text style={{ fontWeight: '700' }}>Web app URL</Text> (kết thúc bằng /exec) dán vào ô bên trên.{'\n'}
                7. Nhấn “Đồng bộ 2 chiều” — các tab (Products, Customers, Invoices, Items, Meta) sẽ tự tạo trong bảng tính.
              </Text>
            </View>
          ) : null}
        </Card>

        {/* Dữ liệu */}
        <Text style={sectionTitle}>DỮ LIỆU</Text>
        <Card style={{ padding: 12 }}>
          <Text style={{ fontSize: 12.5, color: colors.sub, marginBottom: 10, lineHeight: 18 }}>
            Dữ liệu lưu trong SQLite trên điện thoại. Hãy thường xuyên “Sao lưu lên Sheet” để không mất dữ liệu.
          </Text>
          <Button title="Xóa toàn bộ dữ liệu" icon="trash" variant="danger" onPress={resetAll} />
        </Card>

        <Text style={{ fontSize: 11.5, color: colors.faint, textAlign: 'center', paddingBottom: 8 }}>
          Kho Hàng & Hóa Đơn — phiên bản 1.0
        </Text>
      </ScrollView>
    </View>
  );
}

const sectionTitle: any = { fontSize: 12, fontWeight: '800', color: colors.sub, letterSpacing: 0.5 };
