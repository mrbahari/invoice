
'use client';

import { ProductForm } from '@/components/dashboard/product-form';
import { useRouter } from 'next/navigation';

export default function NewProductPage() {
  const router = useRouter();
  const handleSuccess = () => {
    router.push('/dashboard/products');
  };

  return <ProductForm onSave={handleSuccess} onCancel={handleSuccess} />;
}
