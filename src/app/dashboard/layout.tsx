
'use client';

import type { ReactNode } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { Header } from '@/components/dashboard/header';
import { useAuth } from '@/components/auth/auth-provider';
import { SearchProvider } from '@/components/dashboard/search-provider';
import type { DashboardTab } from './page';

export default function DashboardLayout({ children, activeTab, onTabChange }: { children: ReactNode, activeTab: DashboardTab, onTabChange: (tab: DashboardTab) => void }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="flex h-screen items-center justify-center">در حال بارگذاری...</div>;
  }

  return (
    <SearchProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <SidebarNav activeTab={activeTab} onTabChange={onTabChange} />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pr-14">
          <Header activeTab={activeTab} onTabChange={onTabChange} />
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
             {children}
          </main>
        </div>
      </div>
    </SearchProvider>
  );
}
