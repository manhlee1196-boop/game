import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useDb } from '../../src/store';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button, Input, Chip, ModalSheet, EmptyState } from '../../src/components/ui';
import { listProducts, listCustomers, getCustomer, createInvoice } from '../../src/api';
import { getMeta } from '../../src/db';
import { fmtMoney, fmtQty, parseNum } from '../../src/utils';
import { colors, radius } from '../../src/theme';
import type { Product, Customer, CartLine, Invoice } from '../../src/types';
import { shareInvoicePdf } from '../../src/share';
import { getInvoiceItems } from '../../src/api';

const VAT_RATES = [0, 5, 8, 10];

export default function SellScreen() {
  const db = useDb();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [showCustomer, setShowCustomer] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [customerQ, setCustomerQ] = useState('');
  const [discount, setDiscount] = useState('');
  const [vatRate, setVatRate] = useState<number>(() => {
    const v = parseInt(getMeta(db, 'default_vat') || '8', 10);
    return VAT_RATES.includes(v) ? v : 8;
  });
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<Invoice | null>(null);

  const products = listProducts(db, q);
  const customer = customerId ? getCustomer(db, customerId) : null;

  const subtotal = useMemo(() => cart.reduce((s, l) => s + l.unitPrice * l.qty, 0), [cart]);
  const discountVal = parseNum(discount);
  const vatAmount = Math.max(0, Math.round(((subtotal - Math.min(discountVal, subtotal)) * vatRate) / 100));
  const total = Math.max(0, subtotal - Math.min(discountVal, subtotal) + vatAmount);

  const addToCart = (p: Product) => {
    if (p.stock <= 0) {
      Alert.alert('Hết hàng', `"${p.name}" hiện không còn tồn kho.`);
      return;
    }
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.product.id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { product: p, qty: 1, unitPrice: p.salePrice }];
    });
  };

  const changeQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.product.id === id ? { ...l, qty: Math.max(0, l.qty + delta) } : l))
        .filter((l) => l.qty > 0)
    );
  };

  const finishSale = async () => {
    if (cart.length === 0) return;
    setSaving(true);
    try {
      const inv = await createInvoice(db, {
        lines: cart,
        customerId,
        discount: discountVal,
        vatRate,
        note: note.trim(),
      });
      setDone(inv);
      setCart([]);
      setDiscount('');
      setNote('');
      reload();
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không tạo được hóa đơn');
    } finally {
      setSaving(false);
    }
  };

  // ===== Màn hình thành công =====
  if (done) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Ionicons name="checkmark" size={40} color={colors.success} />
        </View>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>Đã tạo hóa đơn!</Text>
        <Text style={{ fontSize: 14, color: colors.sub, marginTop: 6 }}>{done.invoiceNo} · {done.customerName || 'Khách lẻ'}</Text>
        <Text style={{ fontSize: 26, fontWeight: '800', color: colors.primary, marginTop: 12 }}>{fmtMoney(done.total)}</Text>
        <View style={{ width: '100%', marginTop: 28, gap: 10 }}>
          <Button
            title="Chia sẻ / In hóa đơn PDF" icon="paper-plane" size="lg"
            onPress={async () => {
              const items = getInvoiceItems(db, done.id);
              await shareInvoicePdf(done, items, {
                name: getMeta(db, 'shop_name') || '',
                address: getMeta(db, 'shop_address') || '',
                taxCode: getMeta(db, 'shop_tax') || '',
                phone: getMeta(db, 'shop_phone') || '',
              });
            }}
          />
          <Button
            title="Xem hóa đơn" icon="receipt" variant="soft" size="lg"
            onPress={() => {
              const id = done.id;
              setDone(null);
              router.push('/invoice-detail?id=' + id);
            }}
          />
          <Button title="Bán tiếp" icon="add-circle" variant="ghost" size="lg" onPress={() => setDone(null)} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* Chọn khách hàng */}
      <Pressable onPress={() => { setCustomerQ(''); setShowCustomer(true); }} style={{ margin: 14, marginBottom: 8 }}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', padding: 11 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: customer ? colors.primarySoft : colors.bg, alignItems: 'center', justifyContent: 'center', marginRight: 9 }}>
            <Ionicons name="person" size={17} color={customer ? colors.primary : colors.faint} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13.5, fontWeight: '700', color: colors.text }}>
              {customer ? customer.name : 'Khách lẻ (không chọn)'}
            </Text>
            {customer?.phone ? <Text style={{ fontSize: 11.5, color: colors.sub, marginTop: 1 }}>{customer.phone}</Text> : null}
          </View>
          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12.5 }}>Đổi</Text>
        </Card>
      </Pressable>

      {/* Tìm kiếm */}
      <View style={{ marginHorizontal: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 10 }}>
        <Ionicons name="search" size={17} color={colors.faint} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Tìm sản phẩm để bán..."
          placeholderTextColor={colors.faint}
          style={{ flex: 1, paddingVertical: 10, fontSize: 14, color: colors.text, marginLeft: 6 }}
        />
      </View>

      {/* Danh sách sản phẩm */}
      <FlatList
        data={products}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ paddingHorizontal: 14, gap: 8, paddingBottom: 96 }}
        numColumns={2}
        renderItem={({ item }) => {
          const inCart = cart.find((l) => l.product.id === item.id)?.qty || 0;
          const out = item.stock <= 0;
          return (
            <Pressable
              onPress={() => addToCart(item)}
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: inCart > 0 ? colors.primary : colors.border,
                borderRadius: radius.md,
                padding: 10,
                width: '48.5%',
                marginRight: '3%',
                opacity: out ? 0.55 : 1,
              }}
            >
              {inCart > 0 ? (
                <View style={{ position: 'absolute', top: 8, right: 8, minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>{fmtQty(inCart)}</Text>
                </View>
              ) : null}
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, lineHeight: 17 }} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={{ fontSize: 11, color: colors.sub, marginTop: 4 }} numberOfLines={1}>
                Tồn: {fmtQty(item.stock)} {item.unit}
              </Text>
              <Text style={{ fontSize: 13.5, fontWeight: '800', color: colors.primary, marginTop: 6 }}>
                {fmtMoney(item.salePrice)}
              </Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState icon="cart-outline" title={q ? 'Không tìm thấy' : 'Chưa có sản phẩm'} subtitle={q ? 'Thử từ khóa khác' : 'Vào tab Sản phẩm để thêm hàng trước'} />
        }
      />

      {/* Thanh giỏ hàng */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, paddingBottom: 16, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, ...{ shadowColor: '#101828', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: -4 }, elevation: 6 } }}>
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }} onPress={() => setShowCart(true)}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <Ionicons name="cart" size={22} color="#fff" />
              {cart.length > 0 ? (
                <View style={{ position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: colors.card }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{cart.length}</Text>
                </View>
              ) : null}
            </View>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={{ fontSize: 12, color: colors.sub }}>
                {cart.length > 0 ? `${cart.length} mặt hàng` : 'Giỏ hàng trống — chọn sản phẩm phía trên'}
              </Text>
              <Text style={{ fontSize: 17, fontWeight: '800', color: colors.primary, marginTop: 1 }}>
                {fmtMoney(total)}
              </Text>
            </View>
            <View style={{ backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 18 }}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Xem giỏ</Text>
            </View>
          </View>
        </Pressable>
      </View>

      {/* Sheet giỏ hàng */}
      <ModalSheet visible={showCart} title={`Giỏ hàng (${cart.length})`} onClose={() => setShowCart(false)}>
        {cart.length === 0 ? (
          <Text style={{ textAlign: 'center', color: colors.sub, paddingVertical: 20, fontSize: 13.5 }}>Giỏ hàng trống.</Text>
        ) : (
          <>
            <View style={{ maxHeight: 240, overflow: 'scroll', marginBottom: 8 }}>
              {cart.map((l) => {
                const overStock = l.qty > l.product.stock;
                return (
                  <View key={l.product.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }} numberOfLines={1}>{l.product.name}</Text>
                      <Text style={{ fontSize: 11.5, color: overStock ? colors.danger : colors.sub, marginTop: 1 }}>
                        {fmtMoney(l.unitPrice)} × {fmtQty(l.qty)}
                        {overStock ? ` — quá tồn kho (${fmtQty(l.product.stock)})` : ''}
                      </Text>
                    </View>
                    <Pressable onPress={() => changeQty(l.product.id, -1)} style={stepBtn}>
                      <Ionicons name="remove" size={16} color={colors.text} />
                    </Pressable>
                    <Text style={{ minWidth: 34, textAlign: 'center', fontSize: 13.5, fontWeight: '800', color: colors.text }}>{fmtQty(l.qty)}</Text>
                    <Pressable onPress={() => changeQty(l.product.id, 1)} style={stepBtn}>
                      <Ionicons name="add" size={16} color={colors.text} />
                    </Pressable>
                    <Text style={{ width: 84, textAlign: 'right', fontSize: 13, fontWeight: '700', color: colors.text }}>
                      {fmtMoney(l.unitPrice * l.qty)}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 4 }}>
              <View style={{ flex: 1 }}>
                <Input label="Giảm giá (₫)" value={discount} onChangeText={setDiscount} placeholder="0" keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.sub, marginBottom: 5 }}>Thuế VAT</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                  {VAT_RATES.map((r) => (
                    <Chip key={r} label={r === 0 ? '0%' : r + '%'} small selected={vatRate === r} onPress={() => setVatRate(r)} />
                  ))}
                </View>
              </View>
            </View>
            <Input label="Ghi chú hóa đơn" value={note} onChangeText={setNote} placeholder="Tùy chọn" />

            <View style={{ backgroundColor: colors.bg, borderRadius: radius.md, padding: 12, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={{ fontSize: 13, color: colors.sub }}>Tổng tiền hàng</Text>
                <Text style={{ fontSize: 13, color: colors.text, fontWeight: '600' }}>{fmtMoney(subtotal)}</Text>
              </View>
              {discountVal > 0 ? (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontSize: 13, color: colors.sub }}>Giảm giá</Text>
                  <Text style={{ fontSize: 13, color: colors.danger, fontWeight: '600' }}>- {fmtMoney(discountVal)}</Text>
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={{ fontSize: 13, color: colors.sub }}>Thuế VAT {vatRate}%</Text>
                <Text style={{ fontSize: 13, color: colors.text, fontWeight: '600' }}>{fmtMoney(vatAmount)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 7, marginTop: 3 }}>
                <Text style={{ fontSize: 14, color: colors.text, fontWeight: '800' }}>Tổng cộng</Text>
                <Text style={{ fontSize: 16, color: colors.primary, fontWeight: '800' }}>{fmtMoney(total)}</Text>
              </View>
            </View>

            <Button title="Hoàn tất bán hàng" icon="checkmark-done" size="lg" loading={saving} onPress={finishSale} />
          </>
        )}
      </ModalSheet>

      {/* Sheet chọn khách hàng */}
      <ModalSheet visible={showCustomer} title="Chọn khách hàng" onClose={() => setShowCustomer(false)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: radius.md, paddingHorizontal: 10, marginBottom: 10 }}>
          <Ionicons name="search" size={16} color={colors.faint} />
          <TextInput
            value={customerQ}
            onChangeText={setCustomerQ}
            placeholder="Tìm tên hoặc số điện thoại..."
            placeholderTextColor={colors.faint}
            style={{ flex: 1, paddingVertical: 9, fontSize: 13.5, color: colors.text, marginLeft: 6 }}
          />
        </View>
        <Pressable
          onPress={() => { setCustomerId(null); setShowCustomer(false); }}
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 4 }}
        >
          <Ionicons name="person-outline" size={18} color={colors.sub} style={{ marginRight: 10 }} />
          <Text style={{ fontSize: 13.5, color: colors.text, fontWeight: customerId === null ? '700' : '400' }}>Khách lẻ (không chọn)</Text>
        </Pressable>
        {listCustomers(db, customerQ).map((c) => (
          <Pressable
            key={c.id}
            onPress={() => { setCustomerId(c.id); setShowCustomer(false); }}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}
          >
            <Ionicons name="person-circle" size={22} color={colors.primary} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13.5, color: colors.text, fontWeight: customerId === c.id ? '700' : '400' }}>{c.name}</Text>
              {c.phone ? <Text style={{ fontSize: 11.5, color: colors.sub }}>{c.phone}</Text> : null}
            </View>
          </Pressable>
        ))}
      </ModalSheet>
    </SafeAreaView>
  );
}

const stepBtn: any = {
  width: 28, height: 28, borderRadius: 8,
  backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
  alignItems: 'center', justifyContent: 'center',
};
