
import { AuthForm } from '@/components/auth-form';
import { sendPasswordResetLink } from '@/app/auth/actions';

export default function ForgotPasswordPage() {
  return <AuthForm formType="forgot-password" onSubmit={sendPasswordResetLink} />;
}
