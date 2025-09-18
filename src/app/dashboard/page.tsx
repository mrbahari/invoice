import { redirect } from 'next/navigation';

export default function DashboardRootPage() {
  // The root of the dashboard should redirect to the default tab.
  redirect('/dashboard/home');
}
