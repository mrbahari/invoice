
'use client';

import React, { useState, useEffect } from 'react';
import CustomersPage from '@/components/dashboard/customers-page';
import ProductsPage from '@/components/dashboard/products-page';
import StoresPage from '@/components/dashboard/stores-page';
import InvoicesPage from '@/components/dashboard/invoices-page';
import ReportsPage from '@/components/dashboard/reports-page';
import SettingsPage from '@/components/dashboard/settings-page';
import EstimatorsPage from '@/components/dashboard/estimators-page';
import DashboardHomePageContent from '@/components/dashboard/home-page';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Invoice } from '@/lib/definitions';


export type DashboardTab = 'dashboard' | 'invoices' | 'products' | 'customers' | 'categories' | 'reports' | 'settings' | 'estimators';

export default function DashboardClientComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as DashboardTab) || 'dashboard';
  
  // A state to hold data for navigation, e.g., an invoice to edit
  const [navigationData, setNavigationData] = useState<any>(null);

  useEffect(() => {
    // If someone lands on /dashboard without a tab, redirect them to the default tab view
    if (!searchParams.get('tab')) {
        router.replace('/dashboard?tab=dashboard', { scroll: false });
    }
  }, [searchParams, router]);

  const handleNavigation = (tab: DashboardTab, data?: any) => {
    setNavigationData(data); // Set data BEFORE pushing route
    router.push(`/dashboard?tab=${tab}`, { scroll: false });
  };
  

  return (
      <>
        <div className={activeTab === 'dashboard' ? '' : 'hidden'}>
          <DashboardHomePageContent onNavigate={handleNavigation} />
        </div>
        <div className={activeTab === 'invoices' ? '' : 'hidden'}>
          <InvoicesPage initialInvoice={navigationData?.invoice} setInitialInvoice={(inv) => setNavigationData(inv ? { invoice: inv } : null)} />
        </div>
        <div className={activeTab === 'products' ? '' : 'hidden'}>
          <ProductsPage />
        </div>
        <div className={activeTab === 'customers' ? '' : 'hidden'}>
          <CustomersPage />
        </div>
        <div className={activeTab === 'categories' ? '' : 'hidden'}>
          <StoresPage />
        </div>
        <div className={activeTab === 'estimators' ? '' : 'hidden'}>
          <EstimatorsPage onNavigate={handleNavigation} />
        </div>
        <div className={activeTab === 'reports' ? '' : 'hidden'}>
          <ReportsPage onNavigate={handleNavigation} />
        </div>
        <div className={activeTab === 'settings' ? '' : 'hidden'}>
          <SettingsPage />
        </div>
      </>
  );
}
