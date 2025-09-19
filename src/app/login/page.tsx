'use client';

import { useAuth } from '@/components/auth/auth-provider';
import { LoginForm } from '@/components/auth/login-form';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useEffect } from 'react';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard?tab=dashboard');
    }
  }, [user, loading, router]);
  
  if (loading || user) {
    return <main className="flex h-screen items-center justify-center bg-background/80 backdrop-blur-sm"><LoadingSpinner /></main>;
  }
  
  return (
    <main className="relative flex h-screen items-center justify-center overflow-hidden p-4">
      <div className="z-10 w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  );
}
