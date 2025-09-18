
'use client';

import { CustomerForm } from '@/components/dashboard/customer-form';
import { useRouter } from 'next/navigation';

export default function NewCustomerPage() {
    const router = useRouter();
    const handleSuccess = () => {
        router.push('/dashboard/customers');
    };

    return <CustomerForm onSave={handleSuccess} onCancel={handleSuccess} />;
}
