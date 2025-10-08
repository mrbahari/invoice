'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { Invoice, Product } from '@/lib/definitions';
import { ProductForm } from '@/components/dashboard/product-form';
import { useData } from '@/context/data-context';


// Define types for dynamic components and props
export type DashboardTab = 'dashboard' | 'invoices' | 'products' | 'customers' | 'categories' | 'settings' | 'estimators';

const componentMap: Record<DashboardTab, React.ComponentType<any>> = {
  dashboard: dynamic(() => import('@/components/dashboard/reports-page'), { loading: () => <LoadingSpinner />, ssr: false }),
  invoices: dynamic(() => import('@/components/dashboard/invoices-page'), { loading: () => <LoadingSpinner /> }),
  products: dynamic(() => import('@/components/dashboard/products-page'), { loading: () => <LoadingSpinner /> }),
  customers: dynamic(() => import('@/components/dashboard/customers-page'), { loading: () => <LoadingSpinner /> }),
  categories: dynamic(() => import('@/components/dashboard/stores-page'), { loading: () => <LoadingSpinner /> }),
  estimators: dynamic(() => import('@/components/dashboard/estimators-page'), { loading: () => <LoadingSpinner /> }),
  settings: dynamic(() => import('@/components/dashboard/settings-page'), { loading: () => <LoadingSpinner /> }),
};


export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as DashboardTab) || 'dashboard';
  
  const [draftInvoice, setDraftInvoice] = useState<Partial<Invoice> | null>(null);

  // State for Product Form
  const { data } = useData();
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const editingProduct = editingProductId ? data.products.find(p => p.id === editingProductId) : undefined;
  const scrollPositionRef = useRef(0);


  useEffect(() => {
    if (!searchParams.get('tab')) {
        router.replace('/dashboard?tab=dashboard', { scroll: false });
    }
  }, [searchParams, router]);

  // Restore scroll position when returning to the product list
  useEffect(() => {
    if (activeTab === 'products' && editingProductId === null && scrollPositionRef.current > 0 && typeof window !== 'undefined') {
        setTimeout(() => {
            window.scrollTo({ top: scrollPositionRef.current, behavior: 'smooth' });
            scrollPositionRef.current = 0; // Reset after restoring
        }, 100); // A small delay can help ensure the list is rendered
    }
  }, [activeTab, editingProductId]);

  const handleNavigation = (tab: DashboardTab, data?: { invoice: Partial<Invoice>}) => {
    if (tab === 'invoices' && data?.invoice) {
        setDraftInvoice(data.invoice);
    }
    router.push(`/dashboard?tab=${tab}`, { scroll: false });
  };
  
  // Handlers for ProductForm
  const handleEditProduct = (productId: string) => {
    if (typeof window !== 'undefined') {
        scrollPositionRef.current = window.scrollY; // Save current scroll position
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top for the form
    }
    setEditingProductId(productId);
  };

  const handleProductFormCancel = () => {
    setEditingProductId(null);
  };

  const handleProductFormSave = () => {
    setEditingProductId(null);
    // Scroll restoration will be handled by the useEffect
  };


  // Special handling for products tab to show the form
  if (activeTab === 'products' && editingProductId !== null) {
      return (
          <ProductForm
              product={editingProduct}
              onSave={handleProductFormSave}
              onCancel={handleProductFormCancel}
          />
      );
  }

  // Get the component for the active tab
  const ActiveComponent = componentMap[activeTab] || componentMap.dashboard;

  // Prepare props for the active component
  const componentProps: any = {
    onNavigate: handleNavigation,
    draftInvoice: draftInvoice,
    setDraftInvoice: setDraftInvoice,
  };

  if (activeTab === 'products') {
      componentProps.onEdit = handleEditProduct;
  }

  return <ActiveComponent {...componentProps} />;
}
