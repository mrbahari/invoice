
'use client';

import { useAuth } from '@/components/auth/auth-provider';
import { SignupForm } from '@/components/auth/signup-form';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useEffect } from 'react';

export default function SignupPage() {
  const { user, loading } = useAuth();
  
  // AuthProvider now handles the redirection logic.
  // We just need to handle the display of the loading spinner or the form.
  if (loading || user) {
    return null; // AuthProvider is showing a loading spinner, so we show nothing.
  }

  return (
     <main className="relative flex h-screen items-center justify-center overflow-hidden p-4">
      <div className="z-10 w-full max-w-md">
        <SignupForm />
      </div>
    </main>
  );
}
