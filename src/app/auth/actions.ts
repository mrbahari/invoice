'use server';

import { redirect } from 'next/navigation';
import { createFirebaseAdminApp } from '@/firebase/admin-config';
import { getAuth } from 'firebase-admin/auth';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { initializeFirebase } from '@/firebase';
import { sendPasswordResetEmail, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth';

const SESSION_COOKIE_NAME = '__session';

export async function handleSession(idToken: string) {
  const adminApp = createFirebaseAdminApp();
  if (!adminApp) {
    throw new Error('Firebase Admin SDK not initialized');
  }
  const adminAuth = getAuth(adminApp);
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
  cookies().set(SESSION_COOKIE_NAME, sessionCookie, { maxAge: expiresIn, httpOnly: true, secure: true });
}

export async function signOut() {
  cookies().delete(SESSION_COOKIE_NAME);
  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function handleEmailPasswordAction(state: any, formData: FormData) {
  'use server';
  const formType = formData.get('formType') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  const { auth: clientAuth } = initializeFirebase();

  try {
    let userCredential;
    if (formType === 'signup') {
      const firstName = formData.get('firstName') as string;
      const lastName = formData.get('lastName') as string;
      const displayName = `${firstName} ${lastName}`;
      userCredential = await createUserWithEmailAndPassword(clientAuth, email, password);
      await updateProfile(userCredential.user, { displayName });
    } else {
      userCredential = await signInWithEmailAndPassword(clientAuth, email, password);
    }
    
    const idToken = await userCredential.user.getIdToken();
    await handleSession(idToken);
    
    revalidatePath('/', 'layout');
    return { success: true, message: 'عملیات موفقیت‌آمیز بود' };

  } catch (error: any) {
    let message = 'خطا در عملیات. لطفاً دوباره تلاش کنید.';
    if (error.code === 'auth/email-already-in-use') {
      message = 'این ایمیل قبلاً استفاده شده است.';
    } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      message = 'ایمیل یا کلمه عبور نامعتبر است.';
    }
    return { message, success: false };
  }
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
