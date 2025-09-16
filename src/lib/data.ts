
import { Category, Customer, Invoice, Product, InvoiceItem } from '@/lib/definitions';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export const initialCategories: Category[] = [
  { 
    id: 'cat-1', 
    name: 'الکترونیک', 
    storeName: 'فروشگاه سپهر الکترونیک', 
    logoUrl: 'https://picsum.photos/seed/sepehr/48/48',
    storeAddress: 'میدان توحید، خیابان ولیعصر، پلاک ۱۲',
    storePhone: '۰۲۱-۸۸۴۴۴۴۰۰',
  },
  { 
    id: 'cat-2', 
    name: 'مبلمان اداری',
    storeName: 'مبلمان اداری آرتین',
    logoUrl: 'https://picsum.photos/seed/artin/48/48',
    storeAddress: 'خیابان سهروردی، برج اداری، طبقه ۴',
    storePhone: '۰۲۱-۸۸۵۵۵۵۰۰',
  },
  { 
    id: 'cat-3', 
    name: 'لوازم جانبی',
    storeName: 'جانبی سنتر',
    logoUrl: 'https://picsum.photos/seed/janebi/48/48',
    storeAddress: 'پاساژ علاالدین، طبقه ۲، پلاک ۴۰۴',
    storePhone: '۰۲۱-۶۶۷۷۸۸۹۹',
  },
];

export const initialProducts: Product[] = [
  { id: 'prod-1', name: 'لپتاپ پرو', description: 'لپتاپ با کارایی بالا برای حرفه‌ای‌ها.', price: 1499.99, imageUrl: PlaceHolderImages.find(p => p.id === 'prod-1')!.imageUrl, categoryId: 'cat-1' },
  { id: 'prod-2', name: 'موس بی‌سیم', description: 'موس بی‌سیم ارگونومیک.', price: 49.99, imageUrl: PlaceHolderImages.find(p => p.id === 'prod-2')!.imageUrl, categoryId: 'cat-3' },
  { id: 'prod-3', name: 'کیبورد مکانیکی', description: 'کیبورد مکانیکی با نورپردازی RGB.', price: 129.99, imageUrl: PlaceHolderImages.find(p => p.id === 'prod-3')!.imageUrl, categoryId: 'cat-3' },
  { id: 'prod-4', name: 'مانیتور 4K', description: 'مانیتور ۲۷ اینچ 4K UHD.', price: 499.99, imageUrl: PlaceHolderImages.find(p => p.id === 'prod-4')!.imageUrl, categoryId: 'cat-1' },
  { id: 'prod-5', name: 'صندلی ارگونومیک', description: 'صندلی اداری ارگونومیک.', price: 399.00, imageUrl: PlaceHolderImages.find(p => p.id === 'prod-5')!.imageUrl, categoryId: 'cat-2' },
  { id: 'prod-6', name: 'هدفون نویز کنسلینگ', description: 'هدفون روی گوش با قابلیت حذف نویز.', price: 249.50, imageUrl: PlaceHolderImages.find(p => p.id === 'prod-6')!.imageUrl, categoryId: 'cat-3' },
];

export const initialCustomers: Customer[] = [
  { id: 'cust-1', name: 'شرکت نوآوران', email: 'contact@innovate.com', phone: '021-5550101', address: 'پارک علم و فناوری، تهران', purchaseHistory: 'خریدار دائمی لوازم الکترونیکی پیشرفته. مجموع خرج: ۸,۵۰۰ تومان در ۱۲ سفارش.' },
  { id: 'cust-2', name: 'راهکارهای خلاق', email: 'hello@creative.io', phone: '021-5550102', address: 'خیابان هنر، تهران', purchaseHistory: 'خریدار لوازم جانبی و گاهی مبلمان. مجموع خرج: ۱,۲۰۰ تومان در ۵ سفارش.' },
  { id: 'cust-3', name: 'مرکز استارتاپ', email: 'admin@startuphub.co', phone: '021-5550103', address: 'بزرگراه کارآفرینی، تهران', purchaseHistory: 'مشتری جدید، اولین سفارش بزرگ برای تجهیز دفتر. مجموع خرج: ۴,۵۰۰ تومان در ۱ سفارش.' },
  { id: 'cust-4', name: 'رضا رضایی', email: 'john.doe@email.com', phone: '0912-5550104', address: 'خیابان افرا، هر شهری', purchaseHistory: 'خریدهای نادر لوازم جانبی شخصی. مجموع خرج: ۳۵۰ تومان در ۳ سفارش.' },
];

const invoiceItems1: InvoiceItem[] = [
      { productId: 'prod-1', productName: 'لپتاپ پرو', quantity: 2, unitPrice: 1499.99, totalPrice: 2999.98, unit: 'عدد' },
      { productId: 'prod-4', productName: 'مانیتور 4K', quantity: 2, unitPrice: 499.99, totalPrice: 999.98, unit: 'عدد' },
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
    id: 'inv-001',
    invoiceNumber: 'HIS-001',
    customerId: 'cust-1',
    customerName: 'شرکت نوآوران',
    customerEmail: 'contact@innovate.com',
    date: '2023-10-26T00:00:00.000Z',
    status: 'Paid',
    items: invoiceItems1,
    subtotal: 3999.96,
    discount: 0,
    tax: 0,
    total: 3999.96,
    description: 'خرید ۲ عدد لپتاپ پرو و ۲ عدد مانیتور 4K.'
  },
  {
    id: 'inv-002',
    invoiceNumber: 'HIS-002',
    customerId: 'cust-2',
    customerName: 'راهکارهای خلاق',
    customerEmail: 'hello@creative.io',
    date: '2023-10-28T00:00:00.000Z',
    status: 'Pending',
    items: invoiceItems2,
    subtotal: 899.90,
    discount: 0,
    tax: 0,
    total: 899.90,
    description: 'سفارش ۵ عدد موس بی‌سیم و ۵ عدد کیبورد مکانیکی.'
  },
  {
    id: 'inv-003',
    invoiceNumber: 'HIS-003',
    customerId: 'cust-3',
    customerName: 'مرکز استارتاپ',
    customerEmail: 'admin@startuphub.co',
    date: '2023-09-15T00:00:00.000Z',
    status: 'Overdue',
    items: invoiceItems3,
    subtotal: 3990.00,
    discount: 0,
    tax: 0,
    total: 3990.00,
    description: 'سفارش عمده ۱۰ عدد صندلی ارگونومیک برای دفتر جدید.'
  },
  {
    id: 'inv-004',
    invoiceNumber: 'HIS-004',
    customerId: 'cust-4',
    customerName: 'رضا رضایی',
    customerEmail: 'john.doe@email.com',
    date: '2023-11-01T00:00:00.000Z',
    status: 'Pending',
    items: invoiceItems4,
    subtotal: 249.50,
    discount: 0,
    tax: 0,
    total: 249.50,
    description: '۱ عدد هدفون نویز کنسلینگ.'
  },
];
