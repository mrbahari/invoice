
'use client';

import type { ReactNode } from 'react';
import DashboardLayoutClient from './layout-client';

// The Suspense boundary has been removed. Client components are now directly
// rendered, and they will manage their internal loading states.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
