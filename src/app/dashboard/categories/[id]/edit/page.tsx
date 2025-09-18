
'use client';

import { CategoryForm } from '@/components/dashboard/category-form';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Category } from '@/lib/definitions';
import { initialData } from '@/lib/data';
import { useRouter, useParams, notFound } from 'next/navigation';
import { useMemo } from 'react';

export default function EditCategoryPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const [categories] = useLocalStorage<Category[]>('categories', initialData.categories);

    const category = useMemo(() => {
        return categories.find(c => c.id === params.id);
    }, [categories, params.id]);

    const handleSuccess = () => {
        router.push('/dashboard/categories');
    };
    
    if (!category) {
        // This can momentarily show while data is loading.
        // A better approach would be a loading skeleton.
        return null;
    }

    return <CategoryForm category={category} onSave={handleSuccess} onCancel={handleSuccess} />;
}
