
'use client';

import React, { useState } from 'react';
import { Search, Sparkles, Settings, Package2, Phone, Copy, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useSearch } from './search-provider';
import type { DashboardTab } from '@/app/dashboard/dashboard-client';
import { LiveClock } from './live-clock';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
  const { searchTerm, setSearchTerm } = useSearch();

  // Determine if the search bar should be visible on the current tab
  const isSearchVisible = showSearchTabs.includes(activeTab);

  React.useEffect(() => {
    // Clear search term when navigating away from a searchable tab
    if (!isSearchVisible) {
      setSearchTerm('');
    }
  }, [activeTab, isSearchVisible, setSearchTerm]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white bg-opacity-95 px-4 sm:px-6 no-print dark:bg-zinc-900/90">
         <div className="h-10 w-10 md:hidden" /> 

        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <button onClick={() => onTabChange('dashboard')}>خانه</button>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{tabToNameMapping[activeTab]}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
         <div className="flex flex-1 items-center justify-center">
          <LiveClock />
        </div>


        <div className="relative ml-auto flex-1 md:grow-0">
          {isSearchVisible && (
            <div className="relative">
              <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="جستجو..."
                className="w-full rounded-lg bg-background pr-8 md:w-[200px] lg:w-[336px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
        </div>

      </header>
    </>
  );
}
