
'use client';

import DashboardClientComponent from './dashboard-client';

// The Suspense boundary has been removed as it's not the recommended pattern
// for this use case in recent Next.js versions. The client component
// will handle its own loading states internally.
export default function DashboardPage() {
  return <DashboardClientComponent />;
}
