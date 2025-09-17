
'use client';

import { useRouter } from 'next/navigation';

export default function NewInvoicePage() {
  const router = useRouter();
  
  // This page is now handled within InvoicesPage.
  // We redirect to the main invoices page.
  if (typeof window !== 'undefined') {
    router.replace('/dashboard/invoices');
  }

  return null; // or a loading indicator
}
