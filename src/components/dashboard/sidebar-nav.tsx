'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Package,
  Users,
  LineChart,
  Settings,
  FileText,
  Shapes,
  Package2,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'داشبورد' },
  { href: '/dashboard/invoices', icon: FileText, label: 'فاکتورها' },
  { href: '/dashboard/products', icon: Package, label: 'محصولات' },
  { href: '/dashboard/customers', icon: Users, label: 'مشتریان' },
  { href: '/dashboard/categories', icon: Shapes, label: 'دسته‌بندی‌ها' },
  { href: '/dashboard/reports', icon: LineChart, label: 'گزارشات' },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 right-0 z-10 hidden w-14 flex-col border-l bg-background sm:flex no-print">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          href="/dashboard"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          <Package2 className="h-4 w-4 transition-all group-hover:scale-110" />
          <span className="sr-only">حسابگر</span>
        </Link>
        <TooltipProvider>
          {navItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                    (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))) && 'bg-accent text-accent-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="left">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/dashboard/settings"
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                  pathname.startsWith('/dashboard/settings') && 'bg-accent text-accent-foreground'
                )}
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">تنظیمات</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="left">تنظیمات</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </nav>
    </aside>
  );
}
