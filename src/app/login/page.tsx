import { LoginForm } from '@/components/auth/login-form';
import { AuthProvider } from '@/components/auth/auth-provider';

export default function LoginPage() {
  return (
    <AuthProvider>
        <div className="flex min-h-screen items-center justify-center bg-muted/40">
            <LoginForm />
        </div>
    </AuthProvider>
  );
}
