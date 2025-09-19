
'use client';

import {
  Home,
  Package,
  Users,
  LineChart,
  FileText,
  Store,
  Calculator,
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
  { tab: 'reports', icon: LineChart, label: 'گزارشات' },
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
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-sm md:hidden no-print">
      <div className="grid h-20 grid-cols-7 items-center justify-items-center">
        {navItems.slice(0, 3).map((item) => (
          <button
            key={item.tab}
            onClick={() => handleTabClick(item.tab)}
            className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-primary"
          >
            <div className="relative">
              <item.icon className={cn("h-6 w-6 transition-transform", activeTab === item.tab && "scale-125 text-primary")} />
              <span className={cn(
                "absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary opacity-0 transition-all",
                activeTab === item.tab && "opacity-100 w-4"
              )} />
            </div>
            <span className={cn("text-xs", activeTab === item.tab && "text-primary font-semibold")}>{item.label}</span>
          </button>
        ))}

        {/* Central Action Button */}
        <div className="flex h-full w-full items-center justify-center">
            <button 
              onClick={() => handleTabClick('invoices')}
              className="group flex h-16 w-16 -translate-y-4 items-center justify-center rounded-full border bg-background/80 text-primary shadow-lg shadow-black/10 backdrop-blur-sm transition-all hover:scale-110 hover:shadow-primary/20 active:scale-95"
            >
              <FileText className="h-8 w-8 transition-transform group-hover:rotate-[-5deg] group-active:rotate-[-10deg]" />
              <span className="sr-only">ایجاد فاکتور</span>
            </button>
        </div>


        {navItems.slice(3, 6).map((item) => (
           <button
            key={item.tab}
            onClick={() => handleTabClick(item.tab)}
            className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-primary"
          >
            <div className="relative">
              <item.icon className={cn("h-6 w-6 transition-transform", activeTab === item.tab && "scale-125 text-primary")} />
              <span className={cn(
                "absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary opacity-0 transition-all",
                activeTab === item.tab && "opacity-100 w-4"
              )} />
            </div>
            <span className={cn("text-xs", activeTab === item.tab && "text-primary font-semibold")}>{item.label}</span>
          </button>
        ))}
      </div>
    </footer>
  );
}
