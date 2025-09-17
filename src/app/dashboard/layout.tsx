
'use client';

import type { ReactNode } from 'react';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { Header } from '@/components/dashboard/header';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SearchProvider } from '@/components/dashboard/search-provider';

export type DashboardTab = 'dashboard' | 'invoices' | 'products' | 'customers' | 'categories' | 'reports' | 'settings';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return null;
  }

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
  };

  return (
    <SearchProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <SidebarNav activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pr-14">
          <Header activeTab={activeTab} onTabChange={handleTabChange} />
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
             {/* Pass activeTab to the page component */}
            {React.cloneElement(children as React.ReactElement, { activeTab })}
          </main>
        </div>
      </div>
    </SearchProvider>
  );
}
