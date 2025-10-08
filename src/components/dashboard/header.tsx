'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSearch } from './search-provider';
import type { DashboardTab } from '@/app/dashboard/page';
import { LiveClock } from './live-clock';
import { UserNav } from './user-nav';


const tabToNameMapping: Record<DashboardTab, string> = {
  dashboard: 'داشبورد',
  invoices: 'فاکتورها',
  products: 'محصولات',
  customers: 'مشتریان',
  categories: 'فروشگاه‌ها',
  estimators: 'برآورد مصالح',
  settings: 'تنظیمات',
  profile: 'پروفایل کاربری',
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
  const { searchTerm, setSearchTerm, isSearchVisible } = useSearch();

  const showSearch = isSearchVisible && showSearchTabs.includes(activeTab);
  const pageTitle = tabToNameMapping[activeTab] || 'داشبورد';

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4 no-print">
      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex items-center gap-x-6 gap-y-2">
            <h1 className="text-xl font-bold hidden md:block shrink-0">{pageTitle}</h1>
            <div className="flex">
             <LiveClock />
            </div>
        </div>

        <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-lg">
                {showSearch && (
                    <>
                    <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="جستجو..."
                        className="w-full rounded-lg bg-background pr-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    </>
                )}
            </div>
            <UserNav />
        </div>
      </div>
    </header>
  );
}
