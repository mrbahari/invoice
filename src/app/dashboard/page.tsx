
import { Suspense } from 'react';
import DashboardClientComponent from './dashboard-client';

// A simple loading component to show while the client component is loading
function Loading() {
  return <h1 className="text-xl text-gray-800">Loading...</h1>;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<Loading />}>
      <DashboardClientComponent />
    </Suspense>
  );
}
