
'use client';

import { CustomerForm } from '@/components/dashboard/customer-form';
import { initialCustomers } from '@/lib/data';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Customer } from '@/lib/definitions';
import { notFound, useParams } from 'next/navigation';

export default function EditCustomerPage() {
  const params = useParams<{ id: string }>();
  const [customers] = useLocalStorage<Customer[]>('customers', initialCustomers);
  const customer = customers.find((c) => c.id === params.id);

  if (!customer) {
    notFound();
  }

  return <CustomerForm customer={customer} />;
}
