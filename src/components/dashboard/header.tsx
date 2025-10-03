'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSearch } from './search-provider';
import type { DashboardTab } from '@/app/dashboard/dashboard-client';
import { LiveClock } from './live-clock';

const tabToNameMapping: Record<DashboardTab, string> = {
  dashboard: 'داشبورد',
  invoices: 'فاکتورها',
  products: 'محصولات',
  customers: 'مشتریان',
  categories: 'فروشگاه‌ها',
  estimators: 'برآورد مصالح',
  settings: 'تنظیمات',
};

// Only show search bar on these specific tabs
const showSearchTabs: DashboardTab[] = [
  'products',
  'categories',
  'customers',
  'invoices',
];

interface HeaderProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const { searchTerm, setSearchTerm, isSearchVisible: isSearchContextVisible } = useSearch();

  // Determine if the search bar should be visible based on both tab and context
  const isSearchAllowedOnTab = showSearchTabs.includes(activeTab);
  const isSearchVisible = isSearchAllowedOnTab && isSearchContextVisible;


  React.useEffect(() => {
    // Clear search term when navigating away from a searchable tab
    if (!isSearchVisible) {
      setSearchTerm('');
    }
  }, [activeTab, isSearchVisible, setSearchTerm]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white bg-opacity-95 px-4 sm:px-6 no-print dark:bg-zinc-900/90">
        
         <div className="ml-auto flex items-center justify-center">
          <LiveClock />
        </div>

      </header>
    </>
  );
}
