
'use client';

import React from 'react';
import {
  Search,
  LogOut,
  Sparkles,
  Settings,
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
import type { DashboardTab } from '@/app/dashboard/dashboard-client';
import { LiveClock } from './live-clock';

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
  const [isSupportDialogOpen, setIsSupportDialogOpen] = React.useState(false);

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
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm sm:h-auto sm:px-6 no-print">
        <div className="flex items-center gap-4">
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
        </div>

        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
           {showSearch && (
              <div className="relative flex-1 md:grow-0">
                <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="جستجو..."
                  className="w-full rounded-lg bg-background pr-8 md:w-[200px] lg:w-[30%]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
          )}
          <div className="flex items-center gap-2 md:ml-auto">
            <LiveClock />
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleSettingsClick}>
                <Settings className="h-4 w-4" />
                <span className="sr-only">تنظیمات</span>
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="overflow-hidden rounded-full h-9 w-9"
                >
                    <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.photoURL ?? undefined} alt="آواتار" data-ai-hint="user avatar" />
                    <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
                    </Avatar>
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.displayName || user?.email || 'حساب کاربری'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setIsSupportDialogOpen(true)}>پشتیبانی</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                    <LogOut className="ml-2 h-4 w-4" />
                    خروج
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
           </div>
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
