
'use client';

import { ProductForm } from '@/components/dashboard/product-form';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Product } from '@/lib/definitions';
import { initialData } from '@/lib/data';
import { useRouter, useParams } from 'next/navigation';
import { useMemo } from 'react';

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const [products] = useLocalStorage<Product[]>('products', initialData.products);

    const product = useMemo(() => {
        return products.find(p => p.id === params.id);
    }, [products, params.id]);

    const handleSuccess = () => {
        router.push('/dashboard/products');
    };
    
    if (!product) {
        // This can momentarily show while data is loading.
        // A better approach would be a loading skeleton.
        return null;
    }

    return <ProductForm product={product} onSave={handleSuccess} onCancel={handleSuccess} />;
}
