'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { initializeFirebase } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

const SESSION_COOKIE_NAME = '__session';

// This function is kept for reference but is no longer the primary sign-out mechanism.
// The client-side will handle sign-out and this can be removed later if not needed.
export async function signOut() {
  // The primary sign-out logic is now on the client in UserNav.tsx.
  // This server action can serve as a fallback or be removed.
  // For now, it just clears the cookie if it exists.
  if (cookies().has(SESSION_COOKIE_NAME)) {
    cookies().delete(SESSION_COOKIE_NAME);
  }
  revalidatePath('/', 'layout'); 
  redirect('/');
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
