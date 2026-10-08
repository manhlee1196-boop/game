import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useDb } from '../src/store';
import { Ionicons } from '@expo/vector-icons';
import { Header, Card, Stat, Chip, EmptyState } from '../src/components/ui';
import { salesSummary, topProducts, stockStats, lowStockProducts } from '../src/api';
import { periodRange, PERIOD_LABELS, fmtMoney, fmtQty } from '../src/utils';
import { colors } from '../src/theme';
import type { ReportPeriod } from '../src/types';

const PERIODS: ReportPeriod[] = ['today', '7d', 'month', 'year', 'all'];

export default function ReportsScreen() {
  const db = useDb();
  const router = useRouter();
  const [period, setPeriod] = useState<ReportPeriod>('7d');

  const { from, to } = periodRange(period);
  const sales = salesSummary(db, from, to);
  const top = topProducts(db, from, to, 10);
  const st = stockStats(db);
  const low = lowStockProducts(db, 8);
  const maxTop = top.length ? Math.max(...top.map((t) => t.revenue)) : 1;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Báo cáo" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}>
        {/* Chọn khoảng thời gian */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {PERIODS.map((p) => (
            <Chip key={p} label={PERIOD_LABELS[p]} selected={period === p} onPress={() => setPeriod(p)} />
          ))}
        </View>

        {/* Số liệu kinh doanh */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Stat icon="cash" label="Doanh thu" value={fmtMoney(sales.revenue)} tint={colors.primary} />
          <Stat icon="receipt" label="Số hóa đơn" value={String(sales.count)} tint="#7A5AF8" />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Stat icon="trending-up" label="Lãi gộp ước tính" value={fmtMoney(sales.profit)} tint={sales.profit >= 0 ? colors.success : colors.danger} />
          <Stat icon="pie-chart" label="Biên lãi" value={sales.net > 0 ? Math.round((sales.profit / sales.net) * 100) + '%' : '—'} tint={colors.warning} />
        </View>
        <Card style={{ padding: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: 12.5, color: colors.sub }}>Giá vốn hàng đã bán</Text>
            <Text style={{ fontSize: 12.5, color: colors.text, fontWeight: '700' }}>{fmtMoney(sales.cost)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12.5, color: colors.sub }}>Tiền hàng trước thuế</Text>
            <Text style={{ fontSize: 12.5, color: colors.text, fontWeight: '700' }}>{fmtMoney(sales.net)}</Text>
          </View>
        </Card>

        {/* Sản phẩm bán chạy */}
        <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>Sản phẩm bán chạy</Text>
        {top.length === 0 ? (
          <Card style={{ padding: 16 }}>
            <Text style={{ fontSize: 13, color: colors.sub, textAlign: 'center' }}>Chưa có dữ liệu bán hàng trong khoảng thời gian này.</Text>
          </Card>
        ) : (
          <Card style={{ padding: 12 }}>
            {top.map((t, idx) => (
              <View key={idx} style={{ paddingVertical: 7, borderBottomWidth: idx < top.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: colors.text }} numberOfLines={1}>
                    {idx + 1}. {t.name}
                  </Text>
                  <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.primary, marginLeft: 8 }}>{fmtMoney(t.revenue)}</Text>
                </View>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.bg, overflow: 'hidden' }}>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.primary, width: `${Math.max(4, (t.revenue / maxTop) * 100)}%` }} />
                </View>
                <Text style={{ fontSize: 11, color: colors.faint, marginTop: 3 }}>Đã bán {fmtQty(t.qty)} sản phẩm</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Tồn kho */}
        <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>Tồn kho hiện tại</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Stat icon="cube" label="Số loại hàng" value={String(st.count)} tint="#7A5AF8" />
          <Stat icon="pricetag" label="Giá vốn tồn kho" value={fmtMoney(st.costValue)} tint={colors.primary} />
        </View>
        <Card style={{ padding: 12, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12.5, color: colors.sub }}>Giá bán (nếu bán hết)</Text>
            <Text style={{ fontSize: 12.5, color: colors.text, fontWeight: '700' }}>{fmtMoney(st.saleValue)}</Text>
          </View>
        </Card>

        {/* Hàng sắp hết */}
        <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>
          Hàng sắp hết <Text style={{ color: st.lowCount ? colors.warning : colors.success, fontSize: 13 }}>({st.lowCount})</Text>
        </Text>
        {low.length === 0 ? (
          <Card style={{ padding: 14, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 13, color: colors.sub }}>Tồn kho đang ổn, không có mặt hàng nào chạm mức cảnh báo.</Text>
          </Card>
        ) : (
          <Card style={{ padding: 12 }}>
            {low.map((p, idx) => (
              <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: idx < low.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
                <Text style={{ flex: 1, fontSize: 13, color: colors.text }} numberOfLines={1}>{p.name}</Text>
                <View style={{ backgroundColor: p.stock <= 0 ? colors.dangerSoft : colors.warningSoft, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: p.stock <= 0 ? colors.danger : '#B54708' }}>
                    {p.stock <= 0 ? 'Hết hàng' : `Còn ${fmtQty(p.stock)} ${p.unit}`}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}
