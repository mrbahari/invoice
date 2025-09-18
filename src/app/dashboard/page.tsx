
'use client';

import React, { useState } from 'react';
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

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as DashboardTab) || 'dashboard';
  
  // A state to hold data for navigation, e.g., an invoice to edit
  const [navigationData, setNavigationData] = useState<any>(null);

  const handleNavigation = (tab: DashboardTab, data?: any) => {
    setNavigationData(data);
    router.push(`/dashboard?tab=${tab}`, { scroll: false });
  };
  
  // If someone lands on /dashboard without a tab, redirect them to the default tab view
  if (typeof window !== 'undefined' && !searchParams.get('tab')) {
      router.replace('/dashboard?tab=dashboard');
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardHomePageContent onNavigate={handleNavigation} />;
      case 'invoices':
        return <InvoicesPage initialInvoice={navigationData?.invoice} />;
      case 'products':
        return <ProductsPage />;
      case 'customers':
        return <CustomersPage />;
      case 'categories':
        return <StoresPage />;
      case 'estimators':
        return <EstimatorsPage onNavigate={handleNavigation} />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        // Redirect to a default tab if the tab is invalid
        if (typeof window !== 'undefined') {
            router.replace('/dashboard?tab=dashboard');
        }
        return <DashboardHomePageContent onNavigate={handleNavigation} />;
    }
  };


  return (
      <>
        {renderContent()}
      </>
  );
}
