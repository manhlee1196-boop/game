import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { Card, EmptyState } from '../../src/components/ui';
import { listCustomers, listInvoices } from '../../src/api';
import { colors, radius } from '../../src/theme';

export default function CustomersScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const customers = listCustomers(db, q);
  const invoices = listInvoices(db, 1000);
  const countOf = (id: string) => invoices.filter((i) => i.customerId === id).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ padding: 14, paddingBottom: 6 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 10 }}>
            <Ionicons name="search" size={17} color={colors.faint} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Tìm tên hoặc số điện thoại..."
              placeholderTextColor={colors.faint}
              style={{ flex: 1, paddingVertical: 10, fontSize: 14, color: colors.text, marginLeft: 6 }}
            />
          </View>
          <Pressable
            onPress={() => router.push('/customer-edit')}
            style={{ width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="add" size={26} color="#fff" />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={customers}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 14, paddingTop: 4, gap: 8 }}
        renderItem={({ item }) => (
          <Card style={{ padding: 12 }} onPress={() => router.push('/customer-edit?id=' + item.id)}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 11 }}>
                <Ionicons name="person" size={19} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{item.name}</Text>
                <Text style={{ fontSize: 12, color: colors.sub, marginTop: 2 }}>
                  {[item.phone, item.address].filter(Boolean).join(' · ') || 'Chưa có thông tin'}
                </Text>
              </View>
              <View style={{ backgroundColor: colors.bg, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 }}>
                <Text style={{ fontSize: 11.5, color: colors.sub, fontWeight: '700' }}>{countOf(item.id)} đơn</Text>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={q ? 'Không tìm thấy khách hàng' : 'Chưa có khách hàng'}
            subtitle={q ? 'Thử từ khóa khác' : 'Nhấn nút + để thêm khách hàng'}
          />
        }
      />
    </SafeAreaView>
  );
}
