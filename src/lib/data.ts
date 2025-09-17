
import { Category, Customer, Invoice, Product, InvoiceItem, UnitOfMeasurement } from '@/lib/definitions';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export const initialUnitsOfMeasurement: UnitOfMeasurement[] = [
  { name: 'عدد', defaultQuantity: 1 },
  { name: 'متر طول', defaultQuantity: 1 },
  { name: 'متر مربع', defaultQuantity: 1 },
  { name: 'بسته', defaultQuantity: 1 },
];

export const initialCategories: Category[] = [
  { 
    id: 'cat-1', 
    name: 'الکترونیک', 
    storeName: 'فروشگاه سپهر الکترونیک', 
    logoUrl: 'https://picsum.photos/seed/sepehr/48/48',
    storeAddress: 'میدان توحید، خیابان ولیعصر، پلاک ۱۲',
    storePhone: '۰۲۱-۸۸۴۴۴۴۰۰',
    themeColor: '#4f46e5', // Indigo
  },
  { 
    id: 'cat-2', 
    name: 'مبلمان اداری',
    storeName: 'مبلمان اداری آرتین',
    logoUrl: 'https://picsum.photos/seed/artin/48/48',
    storeAddress: 'خیابان سهروردی، برج اداری، طبقه ۴',
    storePhone: '۰۲۱-۸۸۵۵۵۵۰۰',
    themeColor: '#0d9488', // Teal
  },
  { 
    id: 'cat-3', 
    name: 'لوازم جانبی',
    storeName: 'جانبی سنتر',
    logoUrl: 'https://picsum.photos/seed/janebi/48/48',
    storeAddress: 'پاساژ علاالدین، طبقه ۲، پلاک ۴۰۴',
    storePhone: '۰۲۱-۶۶۷۷۸۸۹۹',
    themeColor: '#db2777', // Pink
  },
];

export const initialProducts: Product[] = [
  { id: 'prod-1', code: 'LP-001', name: 'لپتاپ پرو', description: 'لپتاپ با کارایی بالا برای حرفه‌ای‌ها.', price: 1499.99, imageUrl: PlaceHolderImages.find(p => p.id === 'prod-1')!.imageUrl, categoryId: 'cat-1', unit: 'عدد' },
  { id: 'prod-2', code: 'MS-002', name: 'موس بی‌سیم', description: 'موس بی‌سیم ارگونومیک.', price: 49.99, imageUrl: PlaceHolderImages.find(p => p.id === 'prod-2')!.imageUrl, categoryId: 'cat-3', unit: 'عدد' },
  { id: 'prod-3', code: 'KB-003', name: 'کیبورد مکانیکی', description: 'کیبورد مکانیکی با نورپردازی RGB.', price: 129.99, imageUrl: PlaceHolderImages.find(p => p.id === 'prod-3')!.imageUrl, categoryId: 'cat-3', unit: 'عدد' },
  { id: 'prod-4', code: 'MN-004', name: 'مانیتور 4K', description: 'مانیتور ۲۷ اینچ 4K UHD.', price: 499.99, imageUrl: PlaceHolderImages.find(p => p.id === 'prod-4')!.imageUrl, categoryId: 'cat-1', unit: 'عدد' },
  { id: 'prod-5', code: 'CH-005', name: 'صندلی ارگونومیک', description: 'صندلی اداری ارگونومیک.', price: 399.00, imageUrl: PlaceHolderImages.find(p => p.id === 'prod-5')!.imageUrl, categoryId: 'cat-2', unit: 'عدد' },
  { id: 'prod-6', code: 'HP-006', name: 'هدفون نویز کنسلینگ', description: 'هدفون روی گوش با قابلیت حذف نویز.', price: 249.50, imageUrl: PlaceHolderImages.find(p => p.id === 'prod-6')!.imageUrl, categoryId: 'cat-3', unit: 'عدد' },
];

export const initialCustomers: Customer[] = [
    { id: 'cust-1', name: 'اصغر حسن زاده | شرکت همراه کوشا کیش', email: 'a.hassanzadeh@example.com', phone: '09121372580', address: 'فرودگاه امام خمینی', purchaseHistory: 'مشتری جدید' },
    { id: 'cust-2', name: 'راهکارهای خلاق', email: 'hello@creative.io', phone: '021-5550102', address: 'خیابان هنر، تهران', purchaseHistory: 'خریدار لوازم جانبی و گاهی مبلمان. مجموع خرج: ۱,۲۰۰ تومان در ۵ سفارش.' },
];

const invoiceItems1: InvoiceItem[] = [
    { productId: 'prod-1', productName: 'لپتاپ پرو', quantity: 1, unitPrice: 480310000, totalPrice: 480310000, unit: 'عدد' },
    ];
const invoiceItems2: InvoiceItem[] = [
      { productId: 'prod-2', productName: 'موس بی‌سیم', quantity: 5, unitPrice: 49.99, totalPrice: 249.95, unit: 'عدد' },
      { productId: 'prod-3', productName: 'کیبورد مکانیکی', quantity: 5, unitPrice: 129.99, totalPrice: 649.95, unit: 'عدد' },
    ];
const invoiceItems3: InvoiceItem[] = [
      { productId: 'prod-5', productName: 'صندلی ارگونومیک', quantity: 10, unitPrice: 399.00, totalPrice: 3990.00, unit: 'عدد' },
    ];
const invoiceItems4: InvoiceItem[] = [
      { productId: 'prod-6', productName: 'هدفون نویز کنسلینگ', quantity: 1, unitPrice: 249.50, totalPrice: 249.50, unit: 'عدد' },
    ];


export const initialInvoices: Invoice[] = [
  {
    id: 'inv-z0w7l3lgr',
    invoiceNumber: 'HIS-1546',
    customerId: 'cust-1',
    customerName: 'اصغر حسن زاده | شرکت همراه کوشا کیش',
    customerEmail: 'a.hassanzadeh@example.com',
    date: '2024-08-05T08:21:44.223Z',
    status: 'Pending',
    items: invoiceItems1,
    subtotal: 480310000,
    discount: 0,
    additions: 0,
    tax: 0,
    total: 480310000,
    description: 'فاکتور ایجاد شده',
  },
];
