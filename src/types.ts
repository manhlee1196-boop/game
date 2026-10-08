// ===== Kiểu dữ liệu của ứng dụng =====

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  note: string;
  updatedAt: string;
  deleted: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  note: string;
  updatedAt: string;
  deleted: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  subtotal: number;
  discount: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  note: string;
  createdAt: string;
  updatedAt: string;
  deleted: number;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string | null;
  productName: string;
  sku: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  updatedAt: string;
}

export interface ShopInfo {
  name: string;
  address: string;
  taxCode: string;
  phone: string;
}

export interface CartLine {
  product: Product;
  qty: number;
  unitPrice: number;
}

export type ReportPeriod = 'today' | '7d' | 'month' | 'year' | 'all';
