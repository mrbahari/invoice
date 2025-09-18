
'use client';

import React from 'react';
import CustomersPage from '@/components/dashboard/customers-page';
import ProductsPage from '@/components/dashboard/products-page';
import CategoriesPage from '@/components/dashboard/categories-page';
import InvoicesPage from '@/components/dashboard/invoices-page';
import ReportsPage from '@/components/dashboard/reports-page';
import SettingsPage from '@/components/dashboard/settings-page';
import DashboardHomePageContent from '@/components/dashboard/home-page';
import { redirect, useSearchParams, useRouter } from 'next/navigation';


export type DashboardTab = 'dashboard' | 'invoices' | 'products' | 'customers' | 'categories' | 'reports' | 'settings';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as DashboardTab) || 'dashboard';

  
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardHomePageContent />;
      case 'invoices':
        return <InvoicesPage />;
      case 'products':
        return <ProductsPage />;
      case 'customers':
        return <CustomersPage />;
      case 'categories':
        return <CategoriesPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        // Redirect to a default tab if the tab is invalid
        if (typeof window !== 'undefined') {
            router.replace('/dashboard?tab=dashboard');
        }
        return <DashboardHomePageContent />;
    }
  };

  // If someone lands on /dashboard without a tab, redirect them to the default tab view
  if (!searchParams.get('tab')) {
      redirect('/dashboard?tab=dashboard');
  }

  return (
      <>
        {renderContent()}
      </>
  );
}
