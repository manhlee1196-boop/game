// ===== Lưu & chia sẻ hóa đơn PDF =====
import { Platform, Alert } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Invoice, InvoiceItem, ShopInfo } from './types';
import { buildInvoicePdfBytes } from './pdf';

export interface PdfOutput {
  uri: string;
  fileName: string;
}

function safeFileName(invoice: Invoice): string {
  return 'ho-don-' + invoice.invoiceNo.replace(/[^A-Za-z0-9_-]/g, '') + '.pdf';
}

/** Lưu PDF vào thư mục tài liệu, trả về uri */
export function saveInvoicePdf(invoice: Invoice, items: InvoiceItem[], shop: ShopInfo): PdfOutput {
  const bytes = buildInvoicePdfBytes(invoice, items, shop);
  const file = new File(Paths.document, safeFileName(invoice));
  file.write(bytes);
  return { uri: file.uri, fileName: safeFileName(invoice) };
}

/** Chia sẻ PDF qua ứng dụng khác (Zalo, email, WhatsApp...) */
export async function shareInvoicePdf(invoice: Invoice, items: InvoiceItem[], shop: ShopInfo): Promise<void> {
  if (Platform.OS === 'web') {
    const bytes = buildInvoicePdfBytes(invoice, items, shop);
    const blob = new Blob([bytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    return;
  }
  const { uri } = saveInvoicePdf(invoice, items, shop);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Chia sẻ hóa đơn',
    });
  } else {
    Alert.alert('Không chia sẻ được', 'Thiết bị không hỗ trợ chia sẻ. File đã lưu trong thư mục tài liệu của app.');
  }
}
