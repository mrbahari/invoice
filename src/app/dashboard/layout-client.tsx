
'use client';

import type { ReactNode } from 'react';
import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { Header } from '@/components/dashboard/header';
import { SearchProvider } from '@/components/dashboard/search-provider';
import { BottomNav } from '@/components/dashboard/bottom-nav';
import { useAuth } from '@/components/auth/auth-provider';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { DashboardTab } from './dashboard-client';

export default function DashboardLayoutClient({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as DashboardTab) || 'dashboard';
  const { user, loading } = useAuth(); // AuthProvider now handles redirects

  const handleTabChange = (tab: DashboardTab) => {
    router.push(`/dashboard?tab=${tab}`, { scroll: false });
  };
  
  // AuthProvider shows a spinner until auth state is resolved, so this check is simpler.
  if (loading || !user) {
    return null; // Or a spinner, but AuthProvider is already doing that.
  }

  return (
    <SearchProvider>
      <div className="flex min-h-screen w-full flex-col bg-transparent pb-24 md:pb-0">
        <SidebarNav activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="flex flex-col sm:gap-4 sm:py-4 md:pr-14">
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
