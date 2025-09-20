'use client';

import React from 'react';
import { Search, Sparkles, Settings, Package2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

const tabToNameMapping: Record<DashboardTab, string> = {
  dashboard: 'گزارشات', // Changed to reflect new default
  invoices: 'فاکتورها',
  products: 'محصولات',
  customers: 'مشتریان',
  categories: 'فروشگاه‌ها',
  estimators: 'برآورد مصالح',
  settings: 'تنظیمات',
};

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
  const [isSupportDialogOpen, setIsSupportDialogOpen] = React.useState(false);

  const handleSettingsClick = () => {
    onTabChange('settings');
  };

  const showSearch = showSearchTabs.includes(activeTab) && isSearchVisible;

  React.useEffect(() => {
    if (!showSearch) {
      setSearchTerm('');
    }
  }, [activeTab, showSearch, setSearchTerm]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm sm:px-6 no-print">
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
        
        <div className="flex md:hidden items-center gap-2">
            <Package2 className="h-6 w-6" />
            <span className="font-bold">حسابگر</span>
        </div>


        <div className="relative ml-auto flex-1 md:grow-0">
          {showSearch && (
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

        <div className="hidden sm:flex items-center gap-2">
          <LiveClock />
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={handleSettingsClick}
          >
            <Settings className="h-4 w-4" />
            <span className="sr-only">تنظیمات</span>
          </Button>

           <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setIsSupportDialogOpen(true)}
          >
            <Sparkles className="h-4 w-4" />
            <span className="sr-only">پشتیبانی</span>
          </Button>

        </div>
      </header>

      <Dialog open={isSupportDialogOpen} onOpenChange={setIsSupportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <Sparkles className="h-8 w-8 text-primary" />
            <DialogTitle className="mt-2">پشتیبانی و توسعه</DialogTitle>
            <DialogDescription className="text-base !mt-4">
              اسماعیل بهاری
            </DialogDescription>
          </DialogHeader>
          <div className="text-center font-mono text-lg tracking-widest p-2 bg-muted rounded-md">
            09125486083
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
