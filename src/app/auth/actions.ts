'use server';

import { redirect } from 'next/navigation';
import { createFirebaseAdminApp } from '@/firebase/admin-config';
import { getAuth } from 'firebase-admin/auth';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { initializeFirebase } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

const SESSION_COOKIE_NAME = '__session';

export async function signOut() {
  const adminApp = createFirebaseAdminApp();
  if (!adminApp) {
      console.error('Firebase Admin SDK not initialized for sign-out');
      return;
  }
  
  cookies().delete(SESSION_COOKIE_NAME);
  
  revalidatePath('/', 'layout');
  
  redirect('/login');
}

export async function sendPasswordResetLink(state: any, formData: FormData) {
  const email = formData.get('email') as string;
  if (!email) {
    return { message: 'ایمیل الزامی است.', success: false };
  }

  try {
    const { auth: clientAuth } = initializeFirebase();
    await sendPasswordResetEmail(clientAuth, email);
    return {
      message: 'لینک بازیابی کلمه عبور به ایمیل شما ارسال شد. لطفاً پوشه اسپم را نیز بررسی کنید.',
      success: true,
    };
  } catch (error: any) {
    console.error('Password reset error:', error);
    let message = 'خطا در ارسال لینک بازیابی. لطفاً دوباره تلاش کنید.';
    if (error.code === 'auth/user-not-found') {
      message = 'کاربری با این ایمیل یافت نشد.';
    }
    return { message, success: false };
  }
}
