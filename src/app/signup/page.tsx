
import { AuthForm } from '@/components/auth-form';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createFirebaseAdminApp } from '@/firebase/admin-config';
import { getAuth } from 'firebase-admin/auth';


export default function SignupPage() {
  
  async function signup(state: any, formData: FormData) {
    'use server';

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const displayName = `${firstName} ${lastName}`;
    
    try {
      const { auth: clientAuth } = initializeFirebase();
      const userCredential = await createUserWithEmailAndPassword(clientAuth, email, password);
      
      await updateProfile(userCredential.user, { displayName });

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
       let message = 'خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.';
       if (error.code === 'auth/email-already-in-use') {
         message = 'این ایمیل قبلاً استفاده شده است.';
       }
      return { message, success: false };
    }
  }

  return <AuthForm formType="signup" onSubmit={signup} />;
}
