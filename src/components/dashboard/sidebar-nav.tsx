
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


interface SidebarNavProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

export function SidebarNav({ activeTab, onTabChange }: SidebarNavProps) {
  const handleTabClick = (tab: DashboardTab) => {
    onTabChange(tab);
  };

  return null;
}
