
'use client';

import { InvoiceEditor } from '@/components/dashboard/invoice-editor';
import { useRouter } from 'next/navigation';

export default function NewInvoicePage() {
    const router = useRouter();

    const handleSaveAndPreview = (invoiceId: string) => {
        router.push(`/dashboard/invoices/${invoiceId}`);
    }

    const handleCancel = () => {
        router.push('/dashboard/invoices');
    }

    return <InvoiceEditor onSaveAndPreview={handleSaveAndPreview} onCancel={handleCancel} />;
}
