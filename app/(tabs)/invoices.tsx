import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { Card, EmptyState } from '../../src/components/ui';
import { listInvoices } from '../../src/api';
import { fmtMoney, fmtDateTime } from '../../src/utils';
import { colors, radius } from '../../src/theme';

export default function InvoicesScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [tick, setTick] = useState(0);
  const [q, setQ] = useState('');
  const reload = useCallback(() => setTick((t) => t + 1), []);
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  let invoices = listInvoices(db, 500);
  if (q.trim()) {
    const s = q.trim().toLowerCase();
    invoices = invoices.filter((i) => i.invoiceNo.toLowerCase().includes(s) || i.customerName.toLowerCase().includes(s));
  }
  const total = invoices.reduce((s, i) => s + i.total, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ padding: 14, paddingBottom: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 10, marginBottom: 8 }}>
          <Ionicons name="search" size={17} color={colors.faint} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Tìm theo số hóa đơn hoặc tên khách..."
            placeholderTextColor={colors.faint}
            style={{ flex: 1, paddingVertical: 10, fontSize: 14, color: colors.text, marginLeft: 6 }}
          />
        </View>
        <Text style={{ fontSize: 12.5, color: colors.sub }}>
          {invoices.length} hóa đơn · tổng: {fmtMoney(total)}
        </Text>
      </View>

      <FlatList
        data={invoices}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 14, paddingTop: 4, gap: 8 }}
        renderItem={({ item }) => (
          <Card style={{ padding: 12 }} onPress={() => router.push('/invoice-detail?id=' + item.id)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{item.invoiceNo}</Text>
                <Text style={{ fontSize: 12, color: colors.sub, marginTop: 3 }}>
                  {item.customerName || 'Khách lẻ'} · {fmtDateTime(item.createdAt)}
                </Text>
                {item.vatRate > 0 ? (
                  <Text style={{ fontSize: 11, color: colors.faint, marginTop: 1 }}>Bao gồm VAT {item.vatRate}%</Text>
                ) : null}
              </View>
              <Text style={{ fontSize: 14.5, fontWeight: '800', color: colors.primary }}>{fmtMoney(item.total)}</Text>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title={q ? 'Không tìm thấy hóa đơn' : 'Chưa có hóa đơn'}
            subtitle={q ? 'Thử từ khóa khác' : 'Tạo hóa đơn mới tại tab Bán hàng'}
          />
        }
      />
    </SafeAreaView>
  );
}
