import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDb } from '../src/store';
import { Header, Input, Button, Chip } from '../src/components/ui';
import { BarcodeScanner } from '../src/components/BarcodeScanner';
import { getProduct, saveProduct, deleteProduct, findProductByBarcode } from '../src/api';
import { parseNum, fmtNumInput } from '../src/utils';
import { colors } from '../src/theme';

const UNITS = ['cái', 'hộp', 'gói', 'chai', 'kg', 'lốc', 'túi', 'thùng', 'vỉ', 'bánh', 'lọ'];

export default function ProductEditScreen() {
  const db = useDb();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  // overrideId: khi quét thấy sản phẩm có sẵn → chuyển sang chỉnh sửa sản phẩm đó
  const [overrideId, setOverrideId] = useState<string | null>(null);
  const effectiveId = overrideId ?? id;
  const existing = effectiveId ? getProduct(db, effectiveId) : null;

  const [name, setName] = useState(existing?.name || '');
  const [sku, setSku] = useState(existing?.sku || '');
  const [barcode, setBarcode] = useState(existing?.barcode || '');
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState('');
  const [category, setCategory] = useState(existing?.category || '');
  const [unit, setUnit] = useState(existing?.unit || 'cái');
  const [costPrice, setCostPrice] = useState(existing ? fmtNumInput(existing.costPrice) : '');
  const [salePrice, setSalePrice] = useState(existing ? fmtNumInput(existing.salePrice) : '');
  const [stock, setStock] = useState(existing ? fmtNumInput(existing.stock) : '');
  const [minStock, setMinStock] = useState(existing ? fmtNumInput(existing.minStock) : '');
  const [note, setNote] = useState(existing?.note || '');

  const save = () => {
    if (!name.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên sản phẩm.');
      return;
    }
    saveProduct(db, {
      id: existing?.id,
      name: name.trim(),
      sku: sku.trim(),
      barcode: barcode.trim(),
      category: category.trim(),
      unit,
      costPrice: parseNum(costPrice),
      salePrice: parseNum(salePrice),
      stock: parseNum(stock),
      minStock: parseNum(minStock),
      note: note.trim(),
    });
    router.back();
  };

  // Quét xong: điền mã + (nếu có sản phẩm sẵn với mã đó) điền luôn thông tin
  const handleScanned = (code: string) => {
    setScanning(false);
    setBarcode(code);
    const found = findProductByBarcode(db, code);
    if (found && found.id !== existing?.id) {
      setOverrideId(found.id);
      setName(found.name);
      setSku(found.sku);
      setCategory(found.category);
      setUnit(found.unit);
      setCostPrice(fmtNumInput(found.costPrice));
      setSalePrice(fmtNumInput(found.salePrice));
      setStock(fmtNumInput(found.stock));
      setMinStock(fmtNumInput(found.minStock));
      setScanMsg(`Mã này thuộc sản phẩm "${found.name}" — các trường đã được điền sẵn, lưu sẽ cập nhật sản phẩm đó.`);
    } else if (found) {
      setScanMsg('Mã thuộc chính sản phẩm này.');
    } else {
      setScanMsg('Chưa có sản phẩm nào với mã này — nhập thông tin bên dưới rồi lưu.');
    }
  };

  const remove = () => {
    if (!existing) return;
    Alert.alert(
      'Xóa sản phẩm?',
      `Sản phẩm "${existing.name}" sẽ bị xóa khỏi danh mục. Các hóa đơn cũ vẫn giữ nguyên thông tin.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            deleteProduct(db, existing.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title={existing ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}
        onBack={() => router.back()}
        right={
          existing ? (
            <Pressable onPress={remove} hitSlop={10}>
              <Text style={{ color: colors.danger, fontSize: 13.5, fontWeight: '700' }}>Xóa</Text>
            </Pressable>
          ) : null
        }
      />
      <ScrollView contentContainerStyle={{ padding: 14 }} keyboardShouldPersistTaps="handled">
        <Input label="Tên sản phẩm *" value={name} onChangeText={setName} placeholder="VD: Nước suối Lavie 225ml" />

        {/* Mã vạch */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.sub, marginBottom: 5 }}>Mã vạch (barcode)</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Input
              value={barcode}
              onChangeText={(t) => { setBarcode(t); setScanMsg(''); }}
              placeholder="Quét hoặc nhập mã vạch / mã hàng"
              style={{ flex: 1, marginBottom: 0 }}
            />
            <Pressable
              onPress={() => setScanning(true)}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
              hitSlop={4}
            >
              <Ionicons name="barcode-outline" size={17} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Quét</Text>
            </Pressable>
          </View>
          {scanMsg ? <Text style={{ fontSize: 12, color: colors.warning, marginTop: 5 }}>{scanMsg}</Text> : null}
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Input label="Mã hàng" value={sku} onChangeText={setSku} placeholder="VD: NS001" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Danh mục" value={category} onChangeText={setCategory} placeholder="VD: Đồ uống" />
          </View>
        </View>

        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.sub, marginBottom: 6 }}>Đơn vị tính</Text>
        <View style={{ marginBottom: 12, flexDirection: 'row', flexWrap: 'wrap' }}>
          {UNITS.map((u) => (
            <Chip key={u} label={u} selected={unit === u} onPress={() => setUnit(u)} />
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Input label="Giá vốn (₫)" value={costPrice} onChangeText={setCostPrice} placeholder="0" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Giá bán (₫) *" value={salePrice} onChangeText={setSalePrice} placeholder="0" keyboardType="numeric" />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Input label="Tồn kho" value={stock} onChangeText={setStock} placeholder="0" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Cảnh báo khi ≤ (tồn tối thiểu)" value={minStock} onChangeText={setMinStock} placeholder="0" keyboardType="numeric" />
          </View>
        </View>
        <Input label="Ghi chú" value={note} onChangeText={setNote} placeholder="Tùy chọn" multiline />

        <Button title={existing ? 'Lưu thay đổi' : 'Thêm sản phẩm'} icon="checkmark" size="lg" onPress={save} />
      </ScrollView>

      {scanning ? (
        <BarcodeScanner
          title="Quét mã vạch sản phẩm"
          onScan={handleScanned}
          onClose={() => setScanning(false)}
        />
      ) : null}
    </View>
  );
}
