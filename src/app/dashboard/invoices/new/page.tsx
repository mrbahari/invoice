'use client';

import { customers, products } from '@/lib/data';
import dynamic from 'next/dynamic';

const InvoiceCreatorDynamic = dynamic(
  () => import('@/components/dashboard/invoice-creator').then(mod => mod.InvoiceCreator),
  { ssr: false, loading: () => <p>در حال بارگذاری...</p> }
);


export default function NewInvoicePage() {
    // In a real app, you'd fetch this data from a database
    return <InvoiceCreatorDynamic customers={customers} products={products} />;
}
