import { Category, Customer, Invoice, Product } from '@/lib/definitions';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export const categories: Category[] = [
  { id: 'cat-1', name: 'Electronics' },
  { id: 'cat-2', name: 'Office Furniture' },
  { id: 'cat-3', name: 'Accessories' },
];

export const products: Product[] = [
  { id: 'prod-1', name: 'Laptop Pro', description: 'High-performance laptop for professionals.', price: 1499.99, imageUrl: PlaceHolderImages.find(p => p.id === 'prod-1')?.imageUrl!, categoryId: 'cat-1' },
  { id: 'prod-2', name: 'Wireless Mouse', description: 'Ergonomic wireless mouse.', price: 49.99, imageUrl: PlaceHolderImages.find(p => p.id === 'prod-2')?.imageUrl!, categoryId: 'cat-3' },
  { id: 'prod-3', name: 'Mechanical Keyboard', description: 'RGB mechanical keyboard.', price: 129.99, imageUrl: PlaceHolderImages.find(p => p.id === 'prod-3')?.imageUrl!, categoryId: 'cat-3' },
  { id: 'prod-4', name: '4K Monitor', description: '27-inch 4K UHD monitor.', price: 499.99, imageUrl: PlaceHolderImages.find(p => p.id === 'prod-4')?.imageUrl!, categoryId: 'cat-1' },
  { id: 'prod-5', name: 'Ergo Chair', description: 'Ergonomic office chair.', price: 399.00, imageUrl: PlaceHolderImages.find(p => p.id === 'prod-5')?.imageUrl!, categoryId: 'cat-2' },
  { id: 'prod-6', name: 'Noise-Cancelling Headphones', description: 'Over-ear noise-cancelling headphones.', price: 249.50, imageUrl: PlaceHolderImages.find(p => p.id === 'prod-6')?.imageUrl!, categoryId: 'cat-3' },
];

export const customers: Customer[] = [
  { id: 'cust-1', name: 'Innovate Corp', email: 'contact@innovate.com', phone: '555-0101', address: '123 Tech Park, Silicon Valley, CA', purchaseHistory: 'Frequent buyer of high-end electronics. Total spent: $8,500 over 12 orders.' },
  { id: 'cust-2', name: 'Creative Solutions', email: 'hello@creative.io', phone: '555-0102', address: '456 Design Ave, Arts District, NY', purchaseHistory: 'Buys accessories and occasional furniture. Total spent: $1,200 over 5 orders.' },
  { id: 'cust-3', name: 'Startup Hub', email: 'admin@startuphub.co', phone: '555-0103', address: '789 Enterprise Rd, Austin, TX', purchaseHistory: 'New customer, first large order for office setup. Total spent: $4,500 over 1 order.' },
  { id: 'cust-4', name: 'John Doe', email: 'john.doe@email.com', phone: '555-0104', address: '101 Maple St, Anytown, USA', purchaseHistory: 'Infrequent purchases of personal accessories. Total spent: $350 over 3 orders.' },
];

export const invoices: Invoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'HIS-001',
    customerId: 'cust-1',
    customerName: 'Innovate Corp',
    customerEmail: 'contact@innovate.com',
    date: '2023-10-26T00:00:00.000Z',
    dueDate: '2023-11-25T00:00:00.000Z',
    status: 'Paid',
    items: [
      { productId: 'prod-1', productName: 'Laptop Pro', quantity: 2, unitPrice: 1499.99, totalPrice: 2999.98 },
      { productId: 'prod-4', productName: '4K Monitor', quantity: 2, unitPrice: 499.99, totalPrice: 999.98 },
    ],
    subtotal: 3999.96,
    discount: 200.00,
    tax: 304.00,
    total: 4103.96,
    description: 'Purchase of 2 Laptop Pros and 2 4K Monitors.'
  },
  {
    id: 'inv-002',
    invoiceNumber: 'HIS-002',
    customerId: 'cust-2',
    customerName: 'Creative Solutions',
    customerEmail: 'hello@creative.io',
    date: '2023-10-28T00:00:00.000Z',
    dueDate: '2023-11-27T00:00:00.000Z',
    status: 'Pending',
    items: [
      { productId: 'prod-2', productName: 'Wireless Mouse', quantity: 5, unitPrice: 49.99, totalPrice: 249.95 },
      { productId: 'prod-3', productName: 'Mechanical Keyboard', quantity: 5, unitPrice: 129.99, totalPrice: 649.95 },
    ],
    subtotal: 899.90,
    discount: 0,
    tax: 72.00,
    total: 971.90,
    description: 'Order of 5 Wireless Mice and 5 Mechanical Keyboards.'
  },
  {
    id: 'inv-003',
    invoiceNumber: 'HIS-003',
    customerId: 'cust-3',
    customerName: 'Startup Hub',
    customerEmail: 'admin@startuphub.co',
    date: '2023-09-15T00:00:00.000Z',
    dueDate: '2023-10-15T00:00:00.000Z',
    status: 'Overdue',
    items: [
      { productId: 'prod-5', productName: 'Ergo Chair', quantity: 10, unitPrice: 399.00, totalPrice: 3990.00 },
    ],
    subtotal: 3990.00,
    discount: 0,
    tax: 319.20,
    total: 4309.20,
    description: 'Bulk order of 10 Ergo Chairs for new office.'
  },
  {
    id: 'inv-004',
    invoiceNumber: 'HIS-004',
    customerId: 'cust-4',
    customerName: 'John Doe',
    customerEmail: 'john.doe@email.com',
    date: '2023-11-01T00:00:00.000Z',
    dueDate: '2023-12-01T00:00:00.000Z',
    status: 'Pending',
    items: [
      { productId: 'prod-6', productName: 'Noise-Cancelling Headphones', quantity: 1, unitPrice: 249.50, totalPrice: 249.50 },
    ],
    subtotal: 249.50,
    discount: 25.00,
    tax: 17.96,
    total: 242.46,
    description: '1x Noise-Cancelling Headphones.'
  },
];
