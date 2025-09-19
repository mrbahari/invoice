
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
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


  const handleTabChange = (tab: DashboardTab) => {
    router.push(`/dashboard?tab=${tab}`, { scroll: false });
    if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  if (loading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background/80 backdrop-blur-sm">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <SearchProvider>
      <div className="flex min-h-screen w-full flex-col pb-24 md:pb-0">
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
