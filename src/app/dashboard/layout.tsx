'use client';

import type { ReactNode } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SearchProvider } from '@/components/dashboard/search-provider';
import { Header } from '@/components/dashboard/header';
import { BottomNav } from '@/components/dashboard/bottom-nav';
import type { DashboardTab } from '@/app/dashboard/page';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as DashboardTab) || 'dashboard';

  const handleTabChange = (tab: DashboardTab) => {
    router.push(`/dashboard?tab=${tab}`, { scroll: false });
  };
  
  return (
    <SearchProvider>
        <div className="relative flex min-h-screen w-full flex-col">
            <Header activeTab={activeTab} onTabChange={handleTabChange} />
            <main className="flex-1 overflow-auto bg-muted/40 p-4 pt-20 pb-24 sm:p-6 sm:pt-20 sm:pb-24">
                {children}
            </main>
            <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
    </SearchProvider>
  );
}
