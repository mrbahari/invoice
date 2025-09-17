
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Home,
  Package,
  Users,
  LineChart,
  Settings,
  FileText,
  Shapes,
  Package2,
  PanelLeft,
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
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
import type { DashboardTab } from '@/app/dashboard/layout';

const tabToNameMapping: Record<DashboardTab, string> = {
    dashboard: 'خانه',
    invoices: 'فاکتورها',
    products: 'محصولات',
    customers: 'مشتریان',
    categories: 'دسته‌بندی‌ها',
    reports: 'گزارشات',
    settings: 'تنظیمات',
};

const mobileNavItems: { tab: DashboardTab; icon: React.ElementType; label: string }[] = [
    { tab: 'dashboard', icon: Home, label: 'داشبورد' },
    { tab: 'invoices', icon: FileText, label: 'فاکتورها' },
    { tab: 'products', icon: Package, label: 'محصولات' },
    { tab: 'customers', icon: Users, label: 'مشتریان' },
    { tab: 'categories', icon: Shapes, label: 'دسته‌بندی‌ها' },
    { tab: 'reports', icon: LineChart, label: 'گزارشات' },
];

const showSearchTabs: DashboardTab[] = ['products', 'categories', 'customers', 'invoices'];

interface HeaderProps {
    activeTab: DashboardTab;
    onTabChange: (tab: DashboardTab) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const { user, logout } = useAuth();
  const { searchTerm, setSearchTerm } = useSearch();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const getInitials = (name?: string | null) => name ? name.split(' ').map(n => n[0]).join('') : '';
  
  const handleSheetLinkClick = (tab: DashboardTab) => {
    onTabChange(tab);
    setIsSheetOpen(false);
  };

  const showSearch = showSearchTabs.includes(activeTab);
  
  useEffect(() => {
    if (!showSearch) {
      setSearchTerm('');
    }
  }, [activeTab, showSearch, setSearchTerm]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 no-print">
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">باز کردن منو</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="sm:max-w-xs">
          <SheetHeader>
              <SheetTitle className="sr-only">منوی ناوبری اصلی</SheetTitle>
          </SheetHeader>
          <nav className="grid gap-6 text-lg font-medium">
            <button
              onClick={() => handleSheetLinkClick('dashboard')}
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <Package2 className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">حسابگر</span>
            </button>
            {mobileNavItems.map((item) => (
                <button
                    key={item.tab}
                    onClick={() => handleSheetLinkClick(item.tab)}
                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                </button>
            ))}
             <button
                onClick={() => handleSheetLinkClick('settings')}
                className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
                <Settings className="h-5 w-5" />
                تنظیمات
            </button>
          </nav>
        </SheetContent>
      </Sheet>
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
      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="جستجو..."
          className={cn("w-full rounded-lg bg-background pr-8 md:w-[200px] lg:w-[336px]", !showSearch && 'hidden')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="ml-auto flex items-center gap-4">
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
            <DropdownMenuItem asChild>
                <button onClick={() => onTabChange('settings')} className="w-full text-right">تنظیمات</button>
            </DropdownMenuItem>
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
