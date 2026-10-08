import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useDb } from '../../src/store';
import { Ionicons } from '@expo/vector-icons';
import { Card, Stat, Button } from '../../src/components/ui';
import { listProducts, listInvoices, stockStats } from '../../src/api';
import { salesSummary } from '../../src/api';
import { periodRange } from '../../src/utils';
import { colors, radius } from '../../src/theme';
import { fmtMoney, fmtDateTime } from '../../src/utils';
import { getMeta, setMeta } from '../../src/db';
import { syncNow } from '../../src/sync';

export default function HomeScreen() {
  const db = useDb();
  const router = useRouter();
  const [tick, setTick] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const reload = useCallback(() => setTick((t) => t + 1), []);
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  // Số liệu
  const todayRange = periodRange('today');
  const today = salesSummary(db, todayRange.from, todayRange.to);
  const st = stockStats(db);
  const recent = listInvoices(db, 5);
  const syncUrl = getMeta(db, 'sync_url') || '';
  const lastSync = getMeta(db, 'last_sync_at') || '';

  const doSync = async () => {
    setSyncing(true);
    setSyncMsg('');
    const r = await syncNow(db);
    setSyncMsg(r.message);
    setSyncing(false);
    reload();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 28 }}>
        {/* Chào mừng */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={{ fontSize: 19, fontWeight: '800', color: colors.text }} numberOfLines={1}>
              {getMeta(db, 'shop_name') || 'Cửa hàng của tôi'}
            </Text>
            <Text style={{ fontSize: 12.5, color: colors.sub, marginTop: 2 }}>
              Quản lý hàng hóa & xuất hóa đơn
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/settings')}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="settings" size={20} color={colors.sub} />
          </Pressable>
        </View>

        {/* Số liệu hôm nay */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <Stat icon="cash" label="Doanh thu hôm nay" value={fmtMoney(today.revenue)} tint={colors.primary} />
          <Stat icon="receipt" label="Hóa đơn hôm nay" value={String(today.count)} tint={colors.success} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          <Stat icon="cube" label="Số sản phẩm" value={String(st.count)} tint="#7A5AF8" />
          <Stat icon="alert-circle" label="Hàng sắp hết" value={String(st.lowCount)} tint={st.lowCount > 0 ? colors.warning : colors.success} />
        </View>

        {/* Thao tác nhanh */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <Button
            title="Bán hàng" icon="cart" size="lg"
            style={{ flex: 1 }}
            onPress={() => router.push('/(tabs)/sell')}
          />
          <Button
            title="Báo cáo" icon="bar-chart" variant="soft" size="lg"
            style={{ flex: 1 }}
            onPress={() => router.push('/reports')}
          />
          <Button
            title="Đồng bộ" icon="cloud-upload" variant="soft" size="lg" loading={syncing}
            style={{ flex: 1 }}
            onPress={doSync}
          />
        </View>

        {syncMsg ? (
          <Card style={{ padding: 12, marginBottom: 14, backgroundColor: syncMsg.startsWith('Lỗi') ? colors.dangerSoft : colors.successSoft, borderColor: syncMsg.startsWith('Lỗi') ? '#FBD5D5' : '#A6F4C5' }}>
            <Text style={{ fontSize: 12.5, color: syncMsg.startsWith('Lỗi') ? colors.danger : '#067647', fontWeight: '600' }}>{syncMsg}</Text>
          </Card>
        ) : null}

        {/* Trạng thái đồng bộ */}
        <Pressable onPress={() => router.push('/settings')}>
          <Card style={{ padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: syncUrl ? colors.successSoft : colors.warningSoft, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
              <Ionicons name="cloud" size={18} color={syncUrl ? colors.success : colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                {syncUrl ? 'Đã kết nối Google Sheets' : 'Chưa kết nối Google Sheets'}
              </Text>
              <Text style={{ fontSize: 11.5, color: colors.sub, marginTop: 1 }}>
                {lastSync ? `Lần đồng bộ gần nhất: ${fmtDateTime(lastSync)}` : 'Chưa đồng bộ lần nào'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.faint} />
          </Card>
        </Pressable>

        {/* Hóa đơn gần đây */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>Hóa đơn gần đây</Text>
          <Pressable onPress={() => router.push('/(tabs)/invoices')}>
            <Text style={{ fontSize: 12.5, color: colors.primary, fontWeight: '700' }}>Xem tất cả</Text>
          </Pressable>
        </View>

        {recent.length === 0 ? (
          <Card style={{ padding: 20, alignItems: 'center' }}>
            <Ionicons name="receipt-outline" size={34} color={colors.faint} />
            <Text style={{ fontSize: 13.5, color: colors.sub, marginTop: 8 }}>
              Chưa có hóa đơn nào. Nhấn “Bán hàng” để tạo hóa đơn đầu tiên!
            </Text>
          </Card>
        ) : (
          <View style={{ gap: 8 }}>
            {recent.map((inv) => (
              <Card key={inv.id} style={{ padding: 12 }} onPress={() => router.push('/invoice-detail?id=' + inv.id)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{inv.invoiceNo}</Text>
                    <Text style={{ fontSize: 12, color: colors.sub, marginTop: 2 }}>
                      {inv.customerName || 'Khách lẻ'} · {fmtDateTime(inv.createdAt)}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14.5, fontWeight: '800', color: colors.primary }}>{fmtMoney(inv.total)}</Text>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
