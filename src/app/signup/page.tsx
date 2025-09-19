
'use client';

import { useAuth } from '@/components/auth/auth-provider';
import { SignupForm } from '@/components/auth/signup-form';
import { redirect } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import CanvasBackground from '@/components/canvas-background';

export default function SignupPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <main className="flex h-screen items-center justify-center bg-background"><LoadingSpinner /></main>;
  }

  if (user) {
    redirect('/dashboard');
  }

  return (
     <main className="relative flex h-screen items-center justify-center overflow-hidden bg-background p-4">
      <CanvasBackground />
      <div className="z-10 w-full max-w-md">
        <SignupForm />
      </div>
    </main>
  );
}
