'use client';

import type { ReactNode } from 'react';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { Header } from '@/components/dashboard/header';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SearchProvider } from '@/components/dashboard/search-provider';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (!user) {
    // در حین بارگذاری یا اگر کاربری وجود ندارد، چیزی نمایش داده نمی‌شود تا از فلش محتوا جلوگیری شود
    return null;
  }

  return (
    <SearchProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <SidebarNav />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pr-14">
          <Header />
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
          </main>
        </div>
      </div>
    </SearchProvider>
  );
}
