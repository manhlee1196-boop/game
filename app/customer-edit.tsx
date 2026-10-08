import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Header, Input, Button } from '../src/components/ui';
import { getCustomer, saveCustomer, deleteCustomer } from '../src/api';
import { colors } from '../src/theme';

export default function CustomerEditScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = id ? getCustomer(db, id) : null;

  const [name, setName] = useState(existing?.name || '');
  const [phone, setPhone] = useState(existing?.phone || '');
  const [address, setAddress] = useState(existing?.address || '');
  const [note, setNote] = useState(existing?.note || '');

  const save = () => {
    if (!name.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên khách hàng.');
      return;
    }
    saveCustomer(db, {
      id: existing?.id,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      note: note.trim(),
    });
    router.back();
  };

  const remove = () => {
    if (!existing) return;
    Alert.alert(
      'Xóa khách hàng?',
      `"${existing.name}" sẽ bị xóa khỏi danh mục. Các hóa đơn cũ vẫn giữ nguyên.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            deleteCustomer(db, existing.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title={existing ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng'}
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
        <Input label="Tên khách hàng *" value={name} onChangeText={setName} placeholder="VD: Cửa hàng Minh Anh" />
        <Input label="Số điện thoại" value={phone} onChangeText={setPhone} placeholder="VD: 0912 345 678" keyboardType="phone-pad" />
        <Input label="Địa chỉ" value={address} onChangeText={setAddress} placeholder="Tùy chọn" />
        <Input label="Ghi chú" value={note} onChangeText={setNote} placeholder="Tùy chọn" multiline />
        <Button title={existing ? 'Lưu thay đổi' : 'Thêm khách hàng'} icon="checkmark" size="lg" onPress={save} />
      </ScrollView>
    </View>
  );
}
