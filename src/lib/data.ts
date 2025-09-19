
import type { Category, Customer, Invoice, Product, UnitOfMeasurement, Store } from '@/lib/definitions';
import rawDb from '@/database/defaultdb.json';

// Handle cases where the JSON is nested under a `default` property
const defaultDb = (rawDb as any).default || rawDb;

// This acts as the single source of truth for the application's initial state.
// All components now read from the structured defaultdb.json file via this module.
export const initialData = {
  products: (defaultDb.products || []) as Product[],
  categories: (defaultDb.categories || []) as Category[],
  customers: (defaultDb.customers || []) as Customer[],
  invoices: (defaultDb.invoices || []) as Invoice[],
  units: (defaultDb.units || []) as UnitOfMeasurement[],
  stores: (defaultDb.stores || []) as Store[],
};
