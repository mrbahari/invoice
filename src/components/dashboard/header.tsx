
'use client';

import React from 'react';
import Link from 'next/link';
import {
  Search,
  LogOut,
  Sparkles,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useAuth } from '@/components/auth/auth-provider';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useSearch } from './search-provider';
import { cn } from '@/lib/utils';
import { LiveClock } from './live-clock';
import type { DashboardTab } from '@/app/dashboard/page';

const tabToNameMapping: Record<DashboardTab, string> = {
    dashboard: 'خانه',
    invoices: 'فاکتورها',
    products: 'محصولات',
    customers: 'مشتریان',
    categories: 'فروشگاه‌ها',
    estimators: 'برآورد مصالح',
    reports: 'گزارشات',
    settings: 'تنظیمات',
};

const showSearchTabs: DashboardTab[] = ['products', 'categories', 'customers', 'invoices'];

interface HeaderProps {
    activeTab: DashboardTab;
    onTabChange: (tab: DashboardTab) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const { user, logout } = useAuth();
  const { searchTerm, setSearchTerm } = useSearch();

  const getInitials = (name?: string | null) => name ? name.split(' ').map(n => n[0]).join('') : '';
  
  const handleSettingsClick = () => {
      onTabChange('settings');
  };

  const showSearch = showSearchTabs.includes(activeTab);
  
  React.useEffect(() => {
    if (!showSearch) {
      setSearchTerm('');
    }
  }, [activeTab, showSearch, setSearchTerm]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 no-print">
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
      <div className={cn("relative ml-auto md:grow-0", !showSearch && 'hidden')}>
        <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="جستجو..."
          className="w-full rounded-lg bg-background pr-8 md:w-[200px] lg:w-[336px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-4 ml-4">
        <div className="hidden md:flex">
            <LiveClock />
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button
                variant="outline"
                size="icon"
                className="overflow-hidden rounded-full"
            >
                <Avatar>
                    <AvatarImage src={user?.photoURL ?? undefined} alt="آواتار" data-ai-hint="user avatar" />
                    <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
                </Avatar>
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.displayName || user?.email || 'حساب کاربری'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSettingsClick}>تنظیمات</DropdownMenuItem>
            <Dialog>
                <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>پشتیبانی</DropdownMenuItem>
                </DialogTrigger>
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
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
                <LogOut className="ml-2 h-4 w-4" />
                خروج
            </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
