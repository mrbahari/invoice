
'use client';

import type { ReactNode } from 'react';
import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { Header } from '@/components/dashboard/header';
import { SearchProvider } from '@/components/dashboard/search-provider';
import type { DashboardTab } from './page'; // Assuming this type is still relevant and accessible
import { BottomNav } from '@/components/dashboard/bottom-nav';

export default function DashboardLayoutClient({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as DashboardTab) || 'dashboard';

  const handleTabChange = (tab: DashboardTab) => {
    router.push(`/dashboard?tab=${tab}`, { scroll: false });
    if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <SearchProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40 pb-24 sm:pb-0">
        <SidebarNav activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
          <Header activeTab={activeTab} onTabChange={handleTabChange} />
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
             {children}
          </main>
        </div>
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </SearchProvider>
  );
}
