'use client';

import React from 'react';
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
  SheetTrigger,
} from '@/components/ui/sheet';
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
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/components/auth/auth-provider';

const mobileNavItems = [
    { href: '/dashboard', icon: Home, label: 'داشبورد' },
    { href: '/dashboard/invoices', icon: FileText, label: 'فاکتورها' },
    { href: '/dashboard/products', icon: Package, label: 'محصولات' },
    { href: '/dashboard/customers', icon: Users, label: 'مشتریان' },
    { href: '/dashboard/categories', icon: Shapes, label: 'دسته‌بندی‌ها' },
    { href: '/dashboard/reports', icon: LineChart, label: 'گزارشات' },
];

function generateBreadcrumbs(pathname: string) {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs = pathSegments.map((segment, index) => {
        const href = '/' + pathSegments.slice(0, index + 1).join('/');
        const isLast = index === pathSegments.length - 1;
        let name = segment;
        
        switch (segment) {
            case 'dashboard': name = 'خانه'; break;
            case 'invoices': name = 'فاکتورها'; break;
            case 'new': name = 'جدید'; break;
            case 'products': name = 'محصولات'; break;
            case 'customers': name = 'مشتریان'; break;
            case 'categories': name = 'دسته‌بندی‌ها'; break;
            case 'reports': name = 'گزارشات'; break;
            case 'settings': name = 'تنظیمات'; break;
            default:
                if (pathSegments[1] === 'invoices' && index === 2) {
                    name = `فاکتور #${pathSegments[2]}`;
                } else {
                    name = segment.charAt(0).toUpperCase() + segment.slice(1);
                }
        }
        return { href, name, isLast };
    });

    if (breadcrumbs.length > 0 && breadcrumbs[0].name === 'خانه') {
        breadcrumbs[0].href = '/dashboard';
    }
    
    return breadcrumbs.slice(1); // Remove "Dashboard"
}

export function Header() {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname);
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 no-print">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">باز کردن منو</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="#"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <Package2 className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">حسابگر</span>
            </Link>
            {mobileNavItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                </Link>
            ))}
             <Link
                href="/dashboard/settings"
                className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
                <Settings className="h-5 w-5" />
                تنظیمات
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">خانه</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                {!crumb.isLast ? (
                    <BreadcrumbLink asChild>
                        <Link href={crumb.href}>{crumb.name}</Link>
                    </BreadcrumbLink>
                ) : (
                    <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                )}
                </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="جستجو..."
          className="w-full rounded-lg bg-background pr-8 md:w-[200px] lg:w-[336px]"
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
          >
            <Image
              src={`https://picsum.photos/seed/${user?.email || 'avatar'}/32/32`}
              width={36}
              height={36}
              alt="آواتار"
              className="overflow-hidden"
              data-ai-hint="user avatar"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{user?.email || 'حساب کاربری'}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings">تنظیمات</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>پشتیبانی</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <LogOut className="ml-2 h-4 w-4" />
            خروج
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
