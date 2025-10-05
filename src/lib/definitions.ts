
export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  avatarUrl?: string;
  purchaseHistory: string; // Simplified for AI prompt
};

export type Store = {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
  // Bank details for the store
  bankAccountHolder?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIban?: string;
  bankCardNumber?: string;
};


export type Category = {
  id:string;
  name: string;
  storeId: string;
  parentId?: string;
  description?: string;
};

export type Product = {
  id: string;
  name: string;
  code?: string;
  description: string;
  price: number;
  imageUrl: string;
  storeId: string;
  subCategoryId: string;
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
  additions: number;
  tax: number; // Assuming a fixed tax rate for simplicity
  total: number;
  description: string;
};

export type UnitOfMeasurement = {
  id: string;
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
  imageUrl?: string;
};

export type AuthFormValues = {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
};

export type DailySales = {
  date: string;
  paid: number;
  unpaid: number;
};

export type DashboardTab = 'dashboard' | 'invoices' | 'products' | 'customers' | 'categories' | 'settings' | 'estimators';

export type ToolbarPosition = { x: number, y: number };
