import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDb } from '../src/store';
import { Header, Card, Button, RowKV, Input } from '../src/components/ui';
import { getInvoice, getInvoiceItems, deleteInvoice } from '../src/api';
import { getMeta } from '../src/db';
import { fmtMoney, fmtDateTime, fmtQty } from '../src/utils';
import { colors, radius } from '../src/theme';
import { shareInvoicePdf, saveInvoicePdf } from '../src/share';

export default function InvoiceDetailScreen() {
  const db = useDb();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [tick, setTick] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState('');

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const inv = id ? getInvoice(db, id) : null;
  const items = id ? getInvoiceItems(db, id) : [];

  if (!inv) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Header title="Hóa đơn" onBack={() => router.back()} />
        <Text style={{ textAlign: 'center', color: colors.sub, marginTop: 40 }}>Không tìm thấy hóa đơn.</Text>
      </View>
    );
  }

  const shop = {
    name: getMeta(db, 'shop_name') || '',
    address: getMeta(db, 'shop_address') || '',
    taxCode: getMeta(db, 'shop_tax') || '',
    phone: getMeta(db, 'shop_phone') || '',
  };

  const doShare = async () => {
    try {
      await shareInvoicePdf(inv, items, shop);
    } catch (e: any) {
      setMsg('Lỗi tạo PDF: ' + (e?.message || e));
    }
  };

  const doSave = () => {
    try {
      const { fileName } = saveInvoicePdf(inv, items, shop);
      setMsg(`Đã lưu file "${fileName}" vào thư mục tài liệu của app.`);
    } catch (e: any) {
      setMsg('Lỗi lưu file: ' + (e?.message || e));
    }
  };

  const doDelete = () => {
    Alert.alert(
      'Xóa hóa đơn?',
      `Hóa đơn ${inv.invoiceNo} sẽ bị xóa vĩnh viễn khỏi danh sách.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa (giữ tồn kho)',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            await deleteInvoice(db, inv.id, false);
            setDeleting(false);
            router.back();
          },
        },
        {
          text: 'Xóa + hoàn trả tồn kho',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            await deleteInvoice(db, inv.id, true);
            setDeleting(false);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title={inv.invoiceNo} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 14, gap: 10 }}>
        {/* Thông tin */}
        <Card style={{ padding: 12 }}>
          <RowKV label="Ngày bán" value={fmtDateTime(inv.createdAt)} />
          <RowKV label="Khách hàng" value={inv.customerName || 'Khách lẻ'} />
          {inv.customerPhone ? <RowKV label="SĐT" value={inv.customerPhone} /> : null}
          {inv.customerAddress ? <RowKV label="Địa chỉ" value={inv.customerAddress} /> : null}
        </Card>

        {/* Chi tiết */}
        <Card style={{ padding: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.sub }}>Sản phẩm</Text>
            <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.sub }}>Số tiền</Text>
          </View>
          {items.map((it, idx) => (
            <View key={it.id} style={{ paddingVertical: 8, borderBottomWidth: idx < items.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ flex: 1, fontSize: 13.5, fontWeight: '600', color: colors.text, marginRight: 10 }}>
                  {idx + 1}. {it.productName}
                </Text>
                <Text style={{ fontSize: 13.5, fontWeight: '700', color: colors.text }}>{fmtMoney(it.lineTotal)}</Text>
              </View>
              <Text style={{ fontSize: 12, color: colors.sub, marginTop: 2 }}>
                {fmtMoney(it.unitPrice)} × {fmtQty(it.quantity)} {it.unit}
              </Text>
            </View>
          ))}
        </Card>

        {/* Tổng tiền */}
        <Card style={{ padding: 12 }}>
          <RowKV label="Tổng tiền hàng" value={fmtMoney(inv.subtotal)} />
          {inv.discount > 0 ? <RowKV label="Giảm giá" value={'- ' + fmtMoney(inv.discount)} /> : null}
          <RowKV label={`Thuế VAT ${inv.vatRate}%`} value={fmtMoney(inv.vatAmount)} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>TỔNG CỘNG</Text>
            <Text style={{ fontSize: 17, fontWeight: '800', color: colors.primary }}>{fmtMoney(inv.total)}</Text>
          </View>
        </Card>

        {inv.note ? (
          <Card style={{ padding: 12 }}>
            <Text style={{ fontSize: 12, color: colors.sub, marginBottom: 4 }}>Ghi chú</Text>
            <Text style={{ fontSize: 13, color: colors.text }}>{inv.note}</Text>
          </Card>
        ) : null}

        {msg ? (
          <Text style={{ fontSize: 12.5, color: msg.startsWith('Lỗi') ? colors.danger : colors.success, fontWeight: '600', textAlign: 'center' }}>
            {msg}
          </Text>
        ) : null}

        <Button title="Chia sẻ / In hóa đơn PDF" icon="paper-plane" size="lg" onPress={doShare} />
        <Button title="Lưu PDF vào máy" icon="download" variant="soft" size="lg" onPress={doSave} />
        <Button title="Xóa hóa đơn" icon="trash" variant="danger" loading={deleting} onPress={doDelete} />
      </ScrollView>
    </View>
  );
}
