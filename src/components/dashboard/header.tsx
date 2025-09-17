
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
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { initialCategories, initialCustomers, initialProducts } from '@/lib/data';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Category, Customer, Product } from '@/lib/definitions';
import { useSearch } from './search-provider';
import { cn } from '@/lib/utils';
import { LiveClock } from './live-clock';

function generateBreadcrumbs(pathname: string, data: {categories: Category[], customers: Customer[], products: Product[]}) {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs = pathSegments.map((segment, index) => {
        const href = '/' + pathSegments.slice(0, index + 1).join('/');
        const isLast = index === pathSegments.length - 1;
        let name: string = segment;
        
        switch (segment) {
            case 'dashboard': name = 'خانه'; break;
            case 'invoices': name = 'فاکتورها'; break;
            case 'new': name = 'جدید'; break;
            case 'edit': name = 'ویرایش'; break;
            case 'products': name = 'محصولات'; break;
            case 'customers': name = 'مشتریان'; break;
            case 'categories': name = 'دسته‌بندی‌ها'; break;
            case 'reports': name = 'گزارشات'; break;
            case 'settings': name = 'تنظیمات'; break;
            default:
                if (pathSegments[index-1] === 'invoices' && !isLast) {
                    name = `فاکتور`;
                } else if (pathSegments[index-1] === 'categories' && !isLast) {
                    const category = data.categories.find(c => c.id === segment);
                    name = category ? `دسته ${category.name}` : segment;
                } else if (pathSegments[index-1] === 'customers' && !isLast) {
                    const customer = data.customers.find(c => c.id === segment);
                    name = customer ? customer.name : segment;
                } else if (pathSegments[index-1] === 'products' && !isLast) {
                    const product = data.products.find(p => p.id === segment);
                    name = product ? product.name : segment;
                } else {
                    name = segment.charAt(0).toUpperCase() + segment.slice(1);
                }
        }
        return { href, name, isLast };
    });

    if (breadcrumbs.length > 0 && breadcrumbs[0].name === 'خانه') {
        breadcrumbs[0].href = '/dashboard';
    }
    
    return breadcrumbs.slice(1);
}

const searchableRoutes = ['/dashboard/products', '/dashboard/customers', '/dashboard/categories', '/dashboard/invoices'];

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { searchTerm, setSearchTerm } = useSearch();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const [categories] = useLocalStorage<Category[]>('categories', initialCategories);
  const [customers] = useLocalStorage<Customer[]>('customers', initialCustomers);
  const [products] = useLocalStorage<Product[]>('products', initialProducts);
  
  const breadcrumbs = generateBreadcrumbs(pathname, { categories, customers, products });

  const getInitials = (name?: string | null) => name ? name.split(' ').map(n => n[0]).join('') : '';
  
  const handleSheetLinkClick = () => {
    setIsSheetOpen(false);
  };
  
  const showSearch = searchableRoutes.some(route => pathname.startsWith(route));
  
  // Reset search term when navigating away from searchable pages
  useEffect(() => {
    if (!showSearch) {
      setSearchTerm('');
    }
  }, [pathname, showSearch, setSearchTerm]);

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
            <Link
              href="#"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
              onClick={handleSheetLinkClick}
            >
              <Package2 className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">حسابگر</span>
            </Link>
            {mobileNavItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                    onClick={handleSheetLinkClick}
                >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                </Link>
            ))}
             <Link
                href="/dashboard/settings"
                className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                onClick={handleSheetLinkClick}
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
      <div className={cn("relative mr-auto flex-1 md:grow-0", !showSearch && 'hidden')}>
          <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
          type="search"
          placeholder="جستجو..."
          className="w-full rounded-lg bg-background pr-8 md:w-[200px] lg:w-[336px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          />
      </div>
      <div className="flex items-center gap-4 ml-auto">
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
                  <Link href="/dashboard/settings">تنظیمات</Link>
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
                            طراحی و توسعه توسط اسماعیل بهاری
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

const mobileNavItems = [
    { href: '/dashboard', icon: Home, label: 'داشبورد' },
    { href: '/dashboard/invoices', icon: FileText, label: 'فاکتورها' },
    { href: '/dashboard/products', icon: Package, label: 'محصولات' },
    { href: '/dashboard/customers', icon: Users, label: 'مشتریان' },
    { href: '/dashboard/categories', icon: Shapes, label: 'دسته‌بندی‌ها' },
    { href: '/dashboard/reports', icon: LineChart, label: 'گزارشات' },
];

    

