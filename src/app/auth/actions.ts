'use server';

import { redirect } from 'next/navigation';
import { createFirebaseAdminApp } from '@/firebase/admin-config';
import { getAuth } from 'firebase-admin/auth';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

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
