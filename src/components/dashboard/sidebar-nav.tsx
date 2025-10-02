'use client';

import {
  Home,
  Package,
  Users,
  LineChart,
  Settings,
  FileText,
  Store,
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
import type { DashboardTab } from '@/app/dashboard/dashboard-client';

const navItems: { tab: DashboardTab; icon: React.ElementType; label: string }[] = [
  { tab: 'dashboard', icon: Home, label: 'داشبورد' },
  { tab: 'invoices', icon: FileText, label: 'فاکتورها' },
  { tab: 'products', icon: Package, label: 'محصولات' },
  { tab: 'customers', icon: Users, label: 'مشتریان' },
  { tab: 'categories', icon: Store, label: 'فروشگاه‌ها' },
  { tab: 'estimators', icon: Calculator, label: 'برآورد' },
  { tab: 'settings', icon: Settings, label: 'تنظیمات' },
];

interface SidebarNavProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

export function SidebarNav({ activeTab, onTabChange }: SidebarNavProps) {
  const handleTabClick = (tab: DashboardTab) => {
    onTabChange(tab);
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-10 hidden w-60 flex-col border-l bg-background sm:flex no-print">
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
             <div className="h-12 w-full flex items-center justify-center p-4">
                <Package2 className="h-7 w-7 text-primary" />
                <span className="sr-only">حسابگر</span>
            </div>
            {navItems.map((item) => (
                <TooltipProvider key={item.tab}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <button
                                onClick={() => handleTabClick(item.tab)}
                                className={cn(
                                'flex h-12 w-full items-center justify-start gap-4 rounded-lg px-4 text-muted-foreground transition-colors hover:text-foreground',
                                activeTab === item.tab && 'bg-primary text-primary-foreground hover:text-primary-foreground'
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                <span className="">{item.label}</span>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                            {item.label}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ))}
        </nav>
    </aside>
  );
}
