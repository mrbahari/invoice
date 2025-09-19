import type { Category, Customer, Invoice, Product, UnitOfMeasurement, Store } from '@/lib/definitions';

// This acts as the single source of truth for the application's initial state for a new user.
export const getDefaultData = () => {

  const stores: Omit<Store, 'id'>[] = [
    { 
      "name": "دکوربند", 
      "address": "میدان پونک، برج تجاری، واحد ۱۱۰",
      "phone": "۰۲۱-۴۴۴۴۸۸۸۸",
      "logoUrl": "https://picsum.photos/seed/kanaf/110/110",
      "bankAccountHolder": "اسماعیل بهاری",
      "bankName": "سامان",
      "bankAccountNumber": "123-456-789",
      "bankIban": "IR690560081680002151791001",
      "bankCardNumber": "6219861051578325"
    }
  ];

  // Placeholder IDs that will be replaced by Firestore's auto-generated IDs
  // We use them to link categories and products to the store
  const tempStoreId = "store-dekorband";

  const categories: Omit<Category, 'id'>[] = [
    { "name": "کناف", "storeId": tempStoreId },
    { "name": "پروفیل‌های گالوانیزه", "storeId": tempStoreId, "parentId": "cat-kanaf" },
    { "name": "پانل‌های گچی", "storeId": tempStoreId, "parentId": "cat-kanaf" },
  ];

  const products: Omit<Product, 'id'>[] = [
    { "name": "سازه F47", "description": "پروفیل گالوانیزه برای زیرسازی سقف کاذب", "price": 100000, "imageUrl": "https://picsum.photos/seed/f47/400/300", "storeId": tempStoreId, "subCategoryId": "cat-profiles", "unit": "شاخه" },
    { "name": "سازه U36", "description": "پروفیل گالوانیزه رانر برای دیوار و سقف", "price": 80000, "imageUrl": "https://picsum.photos/seed/u36/400/300", "storeId": tempStoreId, "subCategoryId": "cat-profiles", "unit": "شاخه" },
    { "name": "پانل گچی (RG)", "description": "پانل گچی معمولی برای استفاده عمومی", "price": 150000, "imageUrl": "https://picsum.photos/seed/rg-panel/400/300", "storeId": tempStoreId, "subCategoryId": "cat-panels", "unit": "عدد" }
  ];

  const customers: Omit<Customer, 'id'>[] = [
    { "name": "مشتری نمونه", "email": "customer@example.com", "phone": "09120000000", "address": "تهران، خیابان آزادی", "purchaseHistory": "مشتری جدید" }
  ];

  const units: Omit<UnitOfMeasurement, 'id'>[] = [
    { "name": "عدد", "defaultQuantity": 1 },
    { "name": "متر طول", "defaultQuantity": 1 },
    { "name": "متر مربع", "defaultQuantity": 1 },
    { "name": "بسته", "defaultQuantity": 1 },
    { "name": "شاخه", "defaultQuantity": 1 },
    { "name": "کارتن", "defaultQuantity": 1 },
  ];

  const invoices: Omit<Invoice, 'id'>[] = [];

  return {
    stores,
    categories,
    products,
    customers,
    units,
    invoices
  };
};
