'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Invoice } from '@/lib/definitions';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { DashboardTab } from '@/lib/definitions';

// Import all page components directly
import ReportsPage from '@/components/dashboard/reports-page';
import InvoicesPage from '@/components/dashboard/invoices-page';
import ProductsPage from '@/components/dashboard/products-page';
import CustomersPage from '@/components/dashboard/customers-page';
import StoresPage from '@/components/dashboard/stores-page';
import EstimatorsPage from '@/components/dashboard/estimators-page';
import SettingsPage from '@/components/dashboard/settings-page';
import ProfilePage from '@/components/dashboard/profile-page';


const componentMap: Record<DashboardTab, React.ComponentType<any>> = {
  dashboard: ReportsPage,
  invoices: InvoicesPage,
  products: ProductsPage,
  customers: CustomersPage,
  categories: StoresPage,
  estimators: EstimatorsPage,
  settings: SettingsPage,
  profile: ProfilePage,
};

const PageContainer = ({
  isActive,
  children,
}: {
  isActive: boolean;
  children: React.ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3, ease: 'easeInOut' }}
    className={cn(!isActive && 'hidden')}
  >
    {children}
  </motion.div>
);


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
  
  const componentProps = {
    onNavigate: handleNavigation,
    draftInvoice: draftInvoice,
    setDraftInvoice: setDraftInvoice,
  };

  return (
    <>
      {Object.entries(componentMap).map(([tab, Component]) => (
        <PageContainer key={tab} isActive={activeTab === tab}>
          <Component {...componentProps} />
        </PageContainer>
      ))}
    </>
  );
}
