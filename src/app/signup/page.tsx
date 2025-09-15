import { SignupForm } from '@/components/auth/signup-form';
import { AuthProvider } from '@/components/auth/auth-provider';

export default function SignupPage() {
  return (
    <AuthProvider>
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <SignupForm />
      </div>
    </AuthProvider>
  );
}
