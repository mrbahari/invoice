
'use client';

import { CustomerForm } from '@/components/dashboard/customer-form';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Customer } from '@/lib/definitions';
import { initialData } from '@/lib/data';
import { useRouter, useParams, notFound } from 'next/navigation';
import { useMemo } from 'react';

export default function EditCustomerPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const [customers] = useLocalStorage<Customer[]>('customers', initialData.customers);

    const customer = useMemo(() => {
        return customers.find(p => p.id === params.id);
    }, [customers, params.id]);

    const handleSuccess = () => {
        router.push('/dashboard/customers');
    };
    
    if (!customer) {
        // This can momentarily show while data is loading.
        // A better approach would be a loading skeleton.
        return null;
    }

    return <CustomerForm customer={customer} onSave={handleSuccess} onCancel={handleSuccess} />;
}
