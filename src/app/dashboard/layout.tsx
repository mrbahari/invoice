
import type { ReactNode } from 'react';
import DashboardLayoutClient from '@/components/dashboard/layout-client';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    // Suspense was removed to prevent double-loading screens.
    // The main loading is handled by AuthProvider.
    <DashboardLayoutClient>{children}</DashboardLayoutClient>
  );
}
