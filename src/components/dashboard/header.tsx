
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
  File as FileIcon,
  User,
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
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/components/auth/auth-provider';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { initialCategories, initialCustomers, initialProducts } from '@/lib/data';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Category, Customer, Product } from '@/lib/definitions';

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

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const [categories] = useLocalStorage<Category[]>('categories', initialCategories);
  const [customers] = useLocalStorage<Customer[]>('customers', initialCustomers);
  const [products] = useLocalStorage<Product[]>('products', initialProducts);
  
  const breadcrumbs = generateBreadcrumbs(pathname, { categories, customers, products });

  const getInitials = (name?: string | null) => name ? name.split(' ').map(n => n[0]).join('') : '';
  
  const handleSheetLinkClick = () => {
    setIsSheetOpen(false);
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        e.preventDefault()
        setIsSearchOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, []);

  const runCommand = (command: () => unknown) => {
    setIsSearchOpen(false)
    command()
  }

  const navLinks = [
    { name: 'داشبورد', href: '/dashboard', icon: Home },
    { name: 'فاکتورها', href: '/dashboard/invoices', icon: FileIcon },
    { name: 'محصولات', href: '/dashboard/products', icon: Package },
    { name: 'مشتریان', href: '/dashboard/customers', icon: Users },
    { name: 'دسته‌بندی‌ها', href: '/dashboard/categories', icon: Shapes },
    { name: 'گزارشات', href: '/dashboard/reports', icon: LineChart },
    { name: 'تنظیمات', href: '/dashboard/settings', icon: Settings },
  ];


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
      <div className="relative ml-auto flex-1 md:grow-0">
        <Button
            variant="outline"
            className="flex items-center gap-2 text-muted-foreground w-full justify-between md:w-[200px] lg:w-[336px]"
            onClick={() => setIsSearchOpen(true)}
        >
            <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span>جستجو...</span>
            </div>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
        </Button>
        <CommandDialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <CommandInput placeholder="یک فرمان تایپ کنید یا جستجو کنید..." />
          <CommandList>
            <CommandEmpty>نتیجه‌ای یافت نشد.</CommandEmpty>
            <CommandGroup heading="لینک‌ها">
              {navLinks.map(link => (
                <CommandItem
                  key={link.href}
                  value={link.name}
                  onSelect={() => runCommand(() => router.push(link.href))}
                >
                  <link.icon className="ml-2 h-4 w-4" />
                  <span>{link.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="مشتریان">
              {customers.map(customer => (
                <CommandItem
                  key={customer.id}
                  value={customer.name}
                  onSelect={() => runCommand(() => router.push(`/dashboard/customers/${customer.id}`))}
                >
                  <User className="ml-2 h-4 w-4" />
                  <span>{customer.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="محصولات">
               {products.map(product => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => runCommand(() => router.push(`/dashboard/products/${product.id}/edit`))}
                >
                  <Package className="ml-2 h-4 w-4" />
                  <span>{product.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </CommandDialog>
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

const mobileNavItems = [
    { href: '/dashboard', icon: Home, label: 'داشبورد' },
    { href: '/dashboard/invoices', icon: FileText, label: 'فاکتورها' },
    { href: '/dashboard/products', icon: Package, label: 'محصولات' },
    { href: '/dashboard/customers', icon: Users, label: 'مشتریان' },
    { href: '/dashboard/categories', icon: Shapes, label: 'دسته‌بندی‌ها' },
    { href: '/dashboard/reports', icon: LineChart, label: 'گزارشات' },
];

    