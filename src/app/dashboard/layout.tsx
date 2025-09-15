import type { ReactNode } from 'react';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { Header } from '@/components/dashboard/header';
import { AuthProvider } from '@/components/auth/auth-provider';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <SidebarNav />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pr-14">
          <Header />
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
