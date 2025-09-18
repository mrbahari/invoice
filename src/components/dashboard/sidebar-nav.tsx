
'use client';

import {
  Home,
  Package,
  Users,
  LineChart,
  Settings,
  FileText,
  Building,
  Package2,
  Calculator,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { DashboardTab } from '@/app/dashboard/page';

const navItems: { tab: DashboardTab; icon: React.ElementType; label: string }[] = [
  { tab: 'dashboard', icon: Home, label: 'داشبورد' },
  { tab: 'invoices', icon: FileText, label: 'فاکتورها' },
  { tab: 'products', icon: Package, label: 'محصولات' },
  { tab: 'customers', icon: Users, label: 'مشتریان' },
  { tab: 'categories', icon: Building, label: 'فروشگاه‌ها' },
  { tab: 'estimators', icon: Calculator, label: 'برآورد مصالح' },
  { tab: 'reports', icon: LineChart, label: 'گزارشات' },
];

interface SidebarNavProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

export function SidebarNav({ activeTab, onTabChange }: SidebarNavProps) {
  return (
    <aside className="fixed inset-y-0 right-0 z-10 hidden w-14 flex-col border-l bg-background sm:flex no-print">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <button
          onClick={() => onTabChange('dashboard')}
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          <Package2 className="h-4 w-4 transition-all group-hover:scale-110" />
          <span className="sr-only">حسابگر</span>
        </button>
        <TooltipProvider>
          {navItems.map((item) => (
            <Tooltip key={item.tab}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onTabChange(item.tab)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                    activeTab === item.tab && 'bg-accent text-accent-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </button>
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
              <button
                onClick={() => onTabChange('settings')}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                  activeTab === 'settings' && 'bg-accent text-accent-foreground'
                )}
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">تنظیمات</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">تنظیمات</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </nav>
    </aside>
  );
}
