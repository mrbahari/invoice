
'use client';

import { InvoiceEditor } from '@/components/dashboard/invoice-editor';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Invoice } from '@/lib/definitions';
import { initialData } from '@/lib/data';
import { useRouter, useParams } from 'next/navigation';
import { useMemo } from 'react';

export default function EditInvoicePage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const [invoices] = useLocalStorage<Invoice[]>('invoices', initialData.invoices);
    
    const invoice = useMemo(() => {
        return invoices.find(inv => inv.id === params.id);
    }, [invoices, params.id]);

    const handleSaveAndPreview = (invoiceId: string) => {
        router.push(`/dashboard/invoices/${invoiceId}`);
    }

    const handleCancel = () => {
        router.push('/dashboard/invoices');
    }
    
    if (!invoice) {
        return null; // Or a loading skeleton
    }

    return <InvoiceEditor invoice={invoice} onSaveAndPreview={handleSaveAndPreview} onCancel={handleCancel} />;
}
