// ===== Component UI dùng chung =====
import React from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, Modal,
  ActivityIndicator, TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../theme';

// ---------- Nền màn hình ----------
export function Screen({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

// ---------- Thẻ ----------
export function Card({ children, style, onPress }: {
  children: React.ReactNode; style?: any; onPress?: () => void;
}) {
  const base: any = {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  };
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [base, style, pressed && { opacity: 0.92 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}

// ---------- Nút ----------
export function Button({ title, onPress, variant = 'primary', icon, disabled, loading, style, size = 'md' }: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'success' | 'soft' | 'outline' | 'ghost';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  style?: any;
  size?: 'md' | 'lg';
}) {
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const bg =
    variant === 'primary' ? colors.primary :
    variant === 'danger' ? colors.danger :
    variant === 'success' ? colors.success :
    variant === 'soft' ? colors.primarySoft :
    isOutline || isGhost ? colors.card : '#fff';
  const fg =
    variant === 'soft' ? colors.primary :
    isOutline ? colors.primary :
    isGhost ? colors.sub : '#fff';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: radius.md,
          paddingVertical: size === 'lg' ? 14 : 11,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: isOutline ? 1 : 0,
          borderColor: isOutline ? colors.primary : 'transparent',
          ...(!isGhost ? shadow.sm : null),
        },
        pressed && !disabled && { opacity: 0.85 },
        (disabled || loading) && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={size === 'lg' ? 20 : 17} color={fg} style={{ marginRight: 7 }} /> : null}
          <Text style={{ color: fg, fontWeight: '700', fontSize: size === 'lg' ? 16 : 14 }}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

// ---------- Ô nhập ----------
export function Input({ label, style, ...rest }: { label?: string; style?: any } & TextInputProps) {
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.faint}
        style={[styles.input, rest.multiline && { minHeight: 64, textAlignVertical: 'top' }, style]}
        {...rest}
      />
    </View>
  );
}

// ---------- Chip lựa chọn ----------
export function Chip({ label, onPress, selected, small }: {
  label: string; onPress: () => void; selected?: boolean; small?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          paddingHorizontal: small ? 10 : 12,
          paddingVertical: small ? 5 : 7,
          borderRadius: 999,
          borderWidth: 1,
          marginRight: 8,
          marginBottom: 8,
          backgroundColor: selected ? colors.primary : colors.card,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Text style={{
        color: selected ? '#fff' : colors.text,
        fontSize: small ? 12 : 13,
        fontWeight: selected ? '700' : '500',
      }}>{label}</Text>
    </Pressable>
  );
}

// ---------- Sheet trượt lên từ đáy ----------
export function ModalSheet({ visible, title, onClose, children }: {
  visible: boolean; title: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(16,24,40,0.45)' }} onPress={onClose} />
        <View style={{
          backgroundColor: colors.card,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingBottom: 20,
          maxHeight: '82%',
        }}>
          <View style={{ height: 4, width: 40, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: 8 }} />
          <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.sub} />
            </Pressable>
          </View>
          <View style={{ paddingHorizontal: 16 }}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

// ---------- Thanh tiêu đề màn hình phụ ----------
export function Header({ title, onBack, right }: {
  title: string; onBack?: () => void; right?: React.ReactNode;
}) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 10, paddingVertical: 10,
      minHeight: 54, backgroundColor: colors.bg,
    }}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={10} style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
      ) : null}
      <Text style={{
        flex: 1, fontSize: 17, fontWeight: '800', color: colors.text,
        textAlign: onBack ? 'left' : 'center',
      }} numberOfLines={1}>{title}</Text>
      {right || (onBack ? <View style={{ width: 38 }} /> : null)}
    </View>
  );
}

// ---------- Trạng thái trống ----------
export function EmptyState({ icon, title, subtitle }: {
  icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string;
}) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Ionicons name={icon} size={30} color={colors.primary} />
      </View>
      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{title}</Text>
      {subtitle ? <Text style={{ fontSize: 13, color: colors.sub, marginTop: 4, textAlign: 'center' }}>{subtitle}</Text> : null}
    </View>
  );
}

// ---------- Thẻ số liệu ----------
export function Stat({ icon, label, value, tint }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; value: string; tint: string;
}) {
  return (
    <Card style={{ flex: 1, padding: 12, minWidth: 0 }}>
      <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: tint + '1F', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={17} color={tint} />
      </View>
      <Text style={{ marginTop: 8, fontSize: 15, fontWeight: '800', color: colors.text }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={{ fontSize: 11, color: colors.sub, marginTop: 1 }} numberOfLines={1}>{label}</Text>
    </Card>
  );
}

// ---------- Hàng nhãn / giá trị ----------
export function RowKV({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, gap: 12 }}>
      <Text style={{ fontSize: 13, color: colors.sub, flexShrink: 1 }}>{label}</Text>
      <Text style={{ fontSize: 13, color: bold ? colors.text : colors.sub, fontWeight: bold ? '700' : '400', flexShrink: 1, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}

// ---------- Hạng mục cảnh báo tồn kho ----------
export function StockBadge({ stock, minStock }: { stock: number; minStock: number }) {
  let bg = colors.successSoft;
  let fg = colors.success;
  let label = `Tồn: ${stock.toLocaleString('vi-VN')}`;
  if (stock <= 0) {
    bg = colors.dangerSoft; fg = colors.danger; label = 'Hết hàng';
  } else if (minStock > 0 && stock <= minStock) {
    bg = colors.warningSoft; fg = '#B54708'; label = `Sắp hết: ${stock.toLocaleString('vi-VN')}`;
  }
  return (
    <View style={{ backgroundColor: bg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start' }}>
      <Text style={{ color: fg, fontSize: 11, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  label: { fontSize: 13, fontWeight: '600', color: colors.sub, marginBottom: 5 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14.5,
    color: colors.text,
  },
});
