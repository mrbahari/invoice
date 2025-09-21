
import { Suspense } from 'react';
import DashboardClientComponent from './dashboard-client';
import { redirect } from 'next/navigation';

// A simple loading component to show while the client component is loading
function Loading() {
  return null; // Removed the loading text as DataProvider handles the main spinner
}

export default function DashboardPage() {
  
  return (
      <DashboardClientComponent />
  );
}
