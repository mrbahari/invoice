
'use client';

import { LoginForm } from '@/components/auth/login-form';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    // اگر در حال بارگذاری باشد یا کاربر قبلاً وارد شده باشد، فرم را نمایش نده
    return null;
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <LoginForm />
    </div>
  );
}
