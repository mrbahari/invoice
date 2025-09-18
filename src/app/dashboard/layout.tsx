
'use client';

import type { ReactNode } from 'react';
import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { Header } from '@/components/dashboard/header';
import { useAuth } from '@/components/auth/auth-provider';
import { SearchProvider } from '@/components/dashboard/search-provider';
import type { DashboardTab } from './page';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as DashboardTab) || 'dashboard';

  const handleTabChange = (tab: DashboardTab) => {
    router.push(`/dashboard?tab=${tab}`, { scroll: false });
  };
  
  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="flex h-screen items-center justify-center"><LoadingSpinner /></div>;
  }

  return (
    <SearchProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <SidebarNav activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pr-14">
          <Header activeTab={activeTab} onTabChange={handleTabChange} />
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
             {children}
          </main>
        </div>
      </div>
    </SearchProvider>
  );
}
