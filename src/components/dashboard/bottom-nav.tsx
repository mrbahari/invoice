
'use client';

import {
  Home,
  Package,
  Users,
  LineChart,
  FileText,
  Store,
  Calculator,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardTab } from '@/app/dashboard/dashboard-client';

const navItems: { tab: DashboardTab; icon: React.ElementType; label: string }[] = [
  { tab: 'dashboard', icon: Home, label: 'داشبورد' },
  { tab: 'products', icon: Package, label: 'محصولات' },
  { tab: 'customers', icon: Users, label: 'مشتریان' },
  // Central button placeholder
  { tab: 'categories', icon: Store, label: 'فروشگاه‌ها' },
  { tab: 'estimators', icon: Calculator, label: 'برآورد' },
  { tab: 'settings', icon: Settings, label: 'تنظیمات' },
];

interface BottomNavProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const handleTabClick = (tab: DashboardTab) => {
    onTabChange(tab);
  };

  return (
    <footer className="left-0 right-0 z-40 border-b bg-white bg-opacity-95 no-print dark:bg-zinc-900/90">
      <div className="grid grid-cols-7 items-center justify-items-center">
        {navItems.slice(0, 3).map((item) => (
          <button
            key={item.tab}
            onClick={() => handleTabClick(item.tab)}
            className="flex flex-col items-center gap-1 text-muted-foreground py-2"
          >
            <div className="relative">
              <item.icon className={cn("h-6 w-6", activeTab === item.tab && "text-primary")} />
              <span className={cn(
                "absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary opacity-0",
                activeTab === item.tab && "opacity-100"
              )} />
            </div>
            <span className={cn("text-xs", activeTab === item.tab && "text-primary font-semibold")}>{item.label}</span>
          </button>
        ))}

        {/* Central Action Button */}
        <div className="flex h-full w-full items-center justify-center">
            <button 
              onClick={() => handleTabClick('invoices')}
              className="group flex h-16 w-16 translate-y-4 items-center justify-center rounded-full border bg-card text-primary shadow-lg shadow-black/10 backdrop-blur-sm"
            >
              <FileText className="h-8 w-8" />
              <span className="sr-only">ایجاد فاکتور</span>
            </button>
        </div>


        {navItems.slice(3, 6).map((item) => (
           <button
            key={item.tab}
            onClick={() => handleTabClick(item.tab)}
            className="flex flex-col items-center gap-1 text-muted-foreground py-2"
          >
            <div className="relative">
              <item.icon className={cn("h-6 w-6", activeTab === item.tab && "text-primary")} />
               <span className={cn(
                "absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary opacity-0",
                activeTab === item.tab && "opacity-100"
              )} />
            </div>
            <span className={cn("text-xs", activeTab === item.tab && "text-primary font-semibold")}>{item.label}</span>
          </button>
        ))}
      </div>
    </footer>
  );
}
