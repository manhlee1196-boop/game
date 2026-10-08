import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { Card, StockBadge, EmptyState } from '../../src/components/ui';
import { listProducts } from '../../src/api';
import { fmtMoney } from '../../src/utils';
import { colors, radius } from '../../src/theme';
import type { Product } from '../../src/types';

export default function ProductsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const products = listProducts(db, q);
  const totalValue = products.reduce((s, p) => s + p.stock * p.salePrice, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ padding: 14, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ fontSize: 12.5, color: colors.sub }}>
            {products.length} sản phẩm · trị giá tồn kho: {fmtMoney(totalValue)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 10 }}>
            <Ionicons name="search" size={17} color={colors.faint} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Tìm tên, mã hàng, danh mục..."
              placeholderTextColor={colors.faint}
              style={{ flex: 1, paddingVertical: 10, fontSize: 14, color: colors.text, marginLeft: 6 }}
            />
          </View>
          <Pressable
            onPress={() => router.push('/product-edit')}
            style={{ width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="add" size={26} color="#fff" />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={products}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 14, paddingTop: 4, gap: 8 }}
        renderItem={({ item }) => (
          <Card style={{ padding: 12 }} onPress={() => router.push('/product-edit?id=' + item.id)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={{ fontSize: 12, color: colors.sub, marginTop: 3 }}>
                  {[item.sku, item.category, item.unit].filter(Boolean).join(' · ') || ' '}
                </Text>
                <StockBadge stock={item.stock} minStock={item.minStock} />
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.primary }}>{fmtMoney(item.salePrice)}</Text>
                <Text style={{ fontSize: 11, color: colors.faint, marginTop: 2 }}>Giá vốn: {fmtMoney(item.costPrice)}</Text>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="cube-outline"
            title={q ? 'Không tìm thấy sản phẩm' : 'Chưa có sản phẩm'}
            subtitle={q ? 'Thử từ khóa khác' : 'Nhấn nút + để thêm sản phẩm đầu tiên'}
          />
        }
      />
    </SafeAreaView>
  );
}
