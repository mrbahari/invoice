
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
        <div className="grid h-screen w-full grid-rows-[auto_1fr_auto]">
            <Header activeTab={activeTab} onTabChange={handleTabChange} />
            <main className="overflow-auto bg-muted/40 p-4 sm:p-6">
                {children}
            </main>
            <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
    </SearchProvider>
  );
}
