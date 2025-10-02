'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { Invoice } from '@/lib/definitions';
import { useData } from '@/context/data-context';
import type { DashboardTab } from './dashboard-client';
import { Header } from '@/components/dashboard/header';
import { BottomNav } from '@/components/dashboard/bottom-nav';


const componentMap: Record<DashboardTab, React.ComponentType<any>> = {
  dashboard: dynamic(() => import('@/components/dashboard/reports-page'), { loading: () => <LoadingSpinner /> }),
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
  
  const [initialInvoice, setInitialInvoice] = useState<Omit<Invoice, 'id'> | null>(null);
  const { isInitialized } = useData();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !searchParams.get('tab')) {
        router.replace('/dashboard?tab=dashboard', { scroll: false });
    }
  }, [isClient, searchParams, router]);

  useEffect(() => {
    if (isClient) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab, isClient]);

  const handleNavigation = (tab: DashboardTab, data?: { invoice: Omit<Invoice, 'id'>}) => {
    if (tab === 'invoices' && data?.invoice) {
        setInitialInvoice(data.invoice);
    } else {
        setInitialInvoice(null);
    }
    router.push(`/dashboard?tab=${tab}`, { scroll: false });
  };
  
  if (!isClient || !isInitialized) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background/80 backdrop-blur-sm">
            <LoadingSpinner />
        </div>
    );
  }
  
  const ActiveComponent = componentMap[activeTab] || componentMap.dashboard;

  const componentProps: any = {
    onNavigate: handleNavigation,
    initialInvoice: initialInvoice,
    setInitialInvoice: setInitialInvoice,
  };

  return (
      <div className="flex min-h-screen w-full flex-col">
        <div className="flex flex-col sm:gap-4 sm:py-4">
          <Header activeTab={activeTab} onTabChange={handleNavigation} />
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 pb-24 md:pb-8 overflow-x-hidden">
             <ActiveComponent {...componentProps} />
          </main>
        </div>
        <BottomNav activeTab={activeTab} onTabChange={handleNavigation} />
      </div>
  );
}
