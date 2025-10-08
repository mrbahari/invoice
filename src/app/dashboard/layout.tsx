
import type { ReactNode } from 'react';
import { SearchProvider } from '@/components/dashboard/search-provider';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SearchProvider>
      {children}
    </SearchProvider>
  );
}
