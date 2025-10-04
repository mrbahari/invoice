
import { AuthForm } from '@/components/auth-form';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createFirebaseAdminApp } from '@/firebase/admin-config';
import { getAuth } from 'firebase-admin/auth';

export default function LoginPage() {
  
  async function login(state: any, formData: FormData) {
    'use server';
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    try {
      const { auth: clientAuth } = initializeFirebase();
      const userCredential = await signInWithEmailAndPassword(clientAuth, email, password);
      
      const idToken = await userCredential.user.getIdToken();
      
      const adminApp = createFirebaseAdminApp();
      const adminAuth = getAuth(adminApp);

      const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
      const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

      cookies().set('__session', sessionCookie, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: true,
      });

      return redirect('/dashboard?tab=dashboard');

    } catch (error: any) {
      let message = 'خطا در ورود. لطفاً دوباره تلاش کنید.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = 'ایمیل یا کلمه عبور نامعتبر است.';
      }
      return { message, success: false };
    }
  }

  return <AuthForm formType="login" onSubmit={login} />;
}
