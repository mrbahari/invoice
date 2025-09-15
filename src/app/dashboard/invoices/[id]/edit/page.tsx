
'use client';

import { customers, products, invoices } from '@/lib/data';
import dynamic from 'next/dynamic';
import { notFound, useParams } from 'next/navigation';

const InvoiceEditorDynamic = dynamic(
  () => import('@/components/dashboard/invoice-editor').then(mod => mod.InvoiceEditor),
  { ssr: false, loading: () => <p>در حال بارگذاری...</p> }
);


export default function EditInvoicePage() {
    const params = useParams<{ id: string }>();
    const invoice = invoices.find(inv => inv.id === params.id);

    if (!invoice) {
        notFound();
    }

    return <InvoiceEditorDynamic customers={customers} products={products} invoice={invoice} />;
}
