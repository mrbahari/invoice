
'use client';

import React, { useState } from 'react';
import DashboardLayout from './layout';

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
  const initialTab = (searchParams.get('tab') as DashboardTab) || 'dashboard';

  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    // Update URL to reflect the new tab state
    router.push(`/dashboard?tab=${tab}`, { scroll: false });
  };
  
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
        return <DashboardHomePageContent />;
    }
  };

  // If someone lands on /dashboard, redirect them to the default tab view
  if (!searchParams.get('tab')) {
      redirect('/dashboard?tab=dashboard');
  }

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={handleTabChange}>
      {renderContent()}
    </DashboardLayout>
  );
}
