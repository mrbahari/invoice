
'use client';

import { initialCustomers, initialProducts, initialInvoices } from '@/lib/data';
import dynamic from 'next/dynamic';
import { notFound, useParams } from 'next/navigation';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Customer, Product, Invoice } from '@/lib/definitions';


const InvoiceEditorDynamic = dynamic(
  () => import('@/components/dashboard/invoice-editor').then(mod => mod.InvoiceEditor),
  { ssr: false, loading: () => <p>در حال بارگذاری...</p> }
);


export default function EditInvoicePage() {
    const params = useParams<{ id: string }>();
    const [invoices] = useLocalStorage<Invoice[]>('invoices', initialInvoices);
    const invoice = invoices.find(inv => inv.id === params.id);

    if (!invoice) {
        notFound();
    }

    return <InvoiceEditorDynamic invoice={invoice} />;
}
