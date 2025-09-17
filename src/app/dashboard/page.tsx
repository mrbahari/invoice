
'use client';

import InvoicesPage from './invoices/page';
import ProductsPage from './products/page';
import CustomersPage from './customers/page';
import CategoriesPage from './categories/page';
import ReportsPage from './reports/page';
import SettingsPage from './settings/page';
import DashboardHomePageContent from './home/page';
import type { DashboardTab } from './layout';

// This is a placeholder for the old home page content to avoid breaking everything.
function HomePagePlaceholder() {
  return <div>Welcome to the Dashboard!</div>;
}

// We define the main page component that will render the correct "content" based on the active tab.
export default function DashboardPage({ activeTab }: { activeTab: DashboardTab }) {
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
            return <HomePagePlaceholder />;
    }
}
