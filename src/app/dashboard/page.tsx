'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { Invoice } from '@/lib/definitions';

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

  useEffect(() => {
    if (!searchParams.get('tab')) {
        router.replace('/dashboard?tab=dashboard', { scroll: false });
    }
  }, [searchParams, router]);

  const handleNavigation = (tab: DashboardTab, data?: { invoice: Partial<Invoice>}) => {
    if (tab === 'invoices' && data?.invoice) {
        setDraftInvoice(data.invoice);
    } else if (tab !== 'invoices') {
      // Clear draft when navigating away from invoices tab if needed,
      // but the user wants to preserve it, so we comment this out.
      // setDraftInvoice(null);
    }
    // We need to push to trigger a re-render that shows the correct tab
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


  return (
    <>
      {Object.keys(componentMap).map(tabKey => {
        const tab = tabKey as DashboardTab;
        const Component = componentMap[tab];
        return (
          <div key={tab} className={activeTab === tab ? '' : 'hidden'}>
            {activeTab === tab && <Component {...componentProps} />}
          </div>
        );
      })}
    </>
  );
}
