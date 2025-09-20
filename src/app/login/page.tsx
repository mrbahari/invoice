
import { redirect } from 'next/navigation';

// This page is no longer needed as authentication is removed.
// Redirect any access to the main dashboard page.
export default function LoginPage() {
  redirect('/dashboard?tab=dashboard');
}
