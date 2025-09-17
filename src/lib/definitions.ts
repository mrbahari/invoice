
export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  purchaseHistory: string; // Simplified for AI prompt
};

export type Category = {
  id: string;
  name: string;
  description?: string;
  storeName?: string;
  logoUrl?: string;
  storeAddress?: string;
  storePhone?: string;
  themeColor?: string;
};

export type Product = {
  id: string;
  name: string;
  code?: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  unit: string;
  subUnit?: string;
  subUnitQuantity?: number;
  subUnitPrice?: number;
};

export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue';

export type Invoice = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  invoiceNumber: string;
  date: string; // ISO 8601 format
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number; // Assuming a fixed tax rate for simplicity
  total: number;
  description: string;
};

export type UnitOfMeasurement = {
  name: string;
  defaultQuantity: number;
};

export type InvoiceItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit: string;
};

export type AuthFormValues = {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
};
