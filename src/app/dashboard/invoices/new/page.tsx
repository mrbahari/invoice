
'use client';

import dynamic from 'next/dynamic';

const InvoiceEditorDynamic = dynamic(
  () => import('@/components/dashboard/invoice-editor').then(mod => mod.InvoiceEditor),
  { ssr: false, loading: () => <p>در حال بارگذاری...</p> }
);


export default function NewInvoicePage() {
    return <InvoiceEditorDynamic />;
}
