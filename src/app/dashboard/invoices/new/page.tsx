
'use client';

import { customers, products } from '@/lib/data';
import dynamic from 'next/dynamic';

const InvoiceEditorDynamic = dynamic(
  () => import('@/components/dashboard/invoice-editor').then(mod => mod.InvoiceEditor),
  { ssr: false, loading: () => <p>در حال بارگذاری...</p> }
);


export default function NewInvoicePage() {
    // In a real app, you'd fetch this data from a database
    return <InvoiceEditorDynamic customers={customers} products={products} />;
}
