
import type { ReactNode } from 'react';
import DashboardLayoutClient from './layout-client';
import { Suspense } from 'react';

// A simple loading component to show while the client component is loading
function Loading() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 items-center justify-center">
        <h1 className="text-2xl text-gray-900">Loading Dashboard...</h1>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    // Suspense is kept in case client components have heavy logic
    <Suspense fallback={<Loading />}>
      <DashboardLayoutClient>{children}</DashboardLayoutClient>
    </Suspense>
  );
}
