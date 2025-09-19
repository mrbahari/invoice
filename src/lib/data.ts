
import type { Category, Customer, Invoice, Product, UnitOfMeasurement, Store } from '@/lib/definitions';
import products from '@/database/products.json';
import categories from '@/database/categories.json';
import customers from '@/database/customers.json';
import invoices from '@/database/invoices.json';
import units from '@/database/units.json';
import stores from '@/database/stores.json';

// This acts as the single source of truth for the application's initial state.
// All components now read from these structured JSON files via this module.
export const initialData = {
  products: products as Product[],
  categories: categories as Category[],
  customers: customers as Customer[],
  invoices: invoices as Invoice[],
  units: units as UnitOfMeasurement[],
  stores: stores as Store[],
};
