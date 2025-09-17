
'use client';

import { useRouter } from 'next/navigation';

export default function NewCustomerPage() {
  const router = useRouter();
  
  // This page is now handled within CustomersPage.
  // We redirect to the main customers page.
  if (typeof window !== 'undefined') {
    router.replace('/dashboard/customers');
  }

  return null; // or a loading indicator
}
