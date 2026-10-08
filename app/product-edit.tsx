import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Header, Input, Button, Chip } from '../src/components/ui';
import { getProduct, saveProduct, deleteProduct, listInvoices } from '../src/api';
import { parseNum, fmtNumInput } from '../src/utils';
import { colors } from '../src/theme';

const UNITS = ['cái', 'hộp', 'gói', 'chai', 'kg', 'lốc', 'túi', 'thùng', 'vỉ', 'bánh', 'lọ'];

export default function ProductEditScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = id ? getProduct(db, id) : null;

  const [name, setName] = useState(existing?.name || '');
  const [sku, setSku] = useState(existing?.sku || '');
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
    </View>
  );
}
