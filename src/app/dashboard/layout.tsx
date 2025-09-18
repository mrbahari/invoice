
'use client';

import type { ReactNode } from 'react';
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { Header } from '@/components/dashboard/header';
import { useAuth } from '@/components/auth/auth-provider';
import { SearchProvider } from '@/components/dashboard/search-provider';

export type DashboardTab = 'dashboard' | 'invoices' | 'products' | 'customers' | 'categories' | 'reports' | 'settings';

const pathToTabMapping: Record<string, DashboardTab> = {
  '/dashboard/home': 'dashboard',
  '/dashboard/invoices': 'invoices',
  '/dashboard/products': 'products',
  '/dashboard/customers': 'customers',
  '/dashboard/categories': 'categories',
  '/dashboard/reports': 'reports',
  '/dashboard/settings': 'settings',
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = React.useMemo(() => {
    for (const path in pathToTabMapping) {
      if (pathname.startsWith(path)) {
        return pathToTabMapping[path];
      }
    }
    return 'dashboard';
  }, [pathname]);


  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="flex h-screen items-center justify-center">در حال بارگذاری...</div>;
  }
  
  const handleTabChange = (tab: DashboardTab) => {
    const newPath = tab === 'dashboard' ? '/dashboard/home' : `/dashboard/${tab}`;
    router.push(newPath);
  };

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
