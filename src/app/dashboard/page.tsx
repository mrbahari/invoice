'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { Invoice, Product } from '@/lib/definitions';
import { ProductForm } from '@/components/dashboard/product-form';
import { useData } from '@/context/data-context';


// Define types for dynamic components and props
export type DashboardTab = 'dashboard' | 'invoices' | 'products' | 'customers' | 'categories' | 'settings' | 'estimators' | 'profile';

const componentMap: Record<DashboardTab, React.ComponentType<any>> = {
  dashboard: dynamic(() => import('@/components/dashboard/reports-page'), { loading: () => <LoadingSpinner />, ssr: false }),
  invoices: dynamic(() => import('@/components/dashboard/invoices-page'), { loading: () => <LoadingSpinner /> }),
  products: dynamic(() => import('@/components/dashboard/products-page'), { loading: () => <LoadingSpinner /> }),
  customers: dynamic(() => import('@/components/dashboard/customers-page'), { loading: () => <LoadingSpinner /> }),
  categories: dynamic(() => import('@/components/dashboard/stores-page'), { loading: () => <LoadingSpinner /> }),
  estimators: dynamic(() => import('@/components/dashboard/estimators-page'), { loading: () => <LoadingSpinner /> }),
  settings: dynamic(() => import('@/components/dashboard/settings-page'), { loading: () => <LoadingSpinner /> }),
  profile: dynamic(() => import('@/components/dashboard/profile-page'), { loading: () => <LoadingSpinner /> }),
};


export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as DashboardTab) || 'dashboard';
  
  const [draftInvoice, setDraftInvoice] = useState<Partial<Invoice> | null>(null);

  useEffect(() => {
    if (!searchParams.get('tab')) {
        router.replace('/dashboard?tab=dashboard', { scroll: false });
    }
  }, [searchParams, router]);

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  const handleNavigation = (tab: DashboardTab, data?: { invoice: Partial<Invoice>}) => {
    if (tab === 'invoices' && data?.invoice) {
        setDraftInvoice(data.invoice);
    }
    router.push(`/dashboard?tab=${tab}`, { scroll: false });
  };

  // Get the component for the active tab
  const ActiveComponent = componentMap[activeTab] || componentMap.dashboard;

  // Prepare props for the active component
  const componentProps: any = {
    onNavigate: handleNavigation,
    draftInvoice: draftInvoice,
    setDraftInvoice: setDraftInvoice,
  };

  return <ActiveComponent {...componentProps} />;
}
