
'use client';

import { CategoryForm } from '@/components/dashboard/category-form';
import { useRouter } from 'next/navigation';

export default function NewCategoryPage() {
    const router = useRouter();
    const handleSuccess = () => {
        router.push('/dashboard/categories');
        // A full refresh might be needed if data isn't updating across pages.
        // router.refresh(); 
    };

    return <CategoryForm onSave={handleSuccess} onCancel={handleSuccess} />;
}
