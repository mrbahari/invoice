'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUser } from '@/context/user-context';
import Link from 'next/link';
import { signOut, sendPasswordResetLink } from '@/app/auth/actions';
import { AuthForm } from '../auth-form';
import {
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { createFirebaseAdminApp } from '@/firebase/admin-config';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function handleSession(idToken: string) {
  'use server';
  const adminApp = createFirebaseAdminApp();
  if (!adminApp) {
    throw new Error('Firebase Admin SDK not initialized');
  }
  const adminAuth = getAuth(adminApp);
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
  cookies().set('__session', sessionCookie, { maxAge: expiresIn, httpOnly: true, secure: true });
}

async function handleGoogleSignIn() {
  'use server';
  try {
    // This is a server action, it cannot directly trigger client-side popups.
    // The client-side part of AuthForm will handle the popup.
    // This function will be called by the client with the token.
    // This is a conceptual simplification. In a real app, you'd have an API route.
    console.log("Google Sign-In server-side logic invoked. This should be an API endpoint.");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function handleEmailPasswordAction(state: any, formData: FormData) {
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
    
    // We cannot redirect from here as it's part of a component.
    // The client will handle the UI change.
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


export function UserNav() {
  const { user, isUserLoading } = useUser();

  const handleClientGoogleSignIn = async () => {
    try {
      const { auth: clientAuth } = initializeFirebase();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(clientAuth, provider);
      const idToken = await result.user.getIdToken();
      
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }
      // UI will update automatically via onAuthStateChanged
      return { success: true };
    } catch (error: any) {
      console.error('Google Sign-In Error', error);
      return { success: false, error: error.message };
    }
  };

  if (isUserLoading) {
    return <div className="w-24 h-8 bg-muted rounded-md animate-pulse" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <AuthForm
          formType="login"
          onSubmit={handleEmailPasswordAction}
          onGoogleSignIn={handleClientGoogleSignIn}
          onPasswordReset={sendPasswordResetLink}
        />
        <AuthForm
          formType="signup"
          onSubmit={handleEmailPasswordAction}
          onGoogleSignIn={handleClientGoogleSignIn}
          onPasswordReset={sendPasswordResetLink}
        />
      </div>
    );
  }

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) return name.slice(0, 2).toUpperCase();
    if (email) return email.slice(0, 2).toUpperCase();
    return '..';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={user.photoURL ?? `https://avatar.vercel.sh/${user.uid}.png`}
              alt={user.displayName ?? 'User Avatar'}
            />
            <AvatarFallback>
              {getInitials(user.displayName, user.email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.displayName ?? 'کاربر مهمان'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email ?? 'ایمیل ثبت نشده'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            پروفایل
          </DropdownMenuItem>
          <DropdownMenuItem>
            تنظیمات
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <form action={signOut}>
          <button type="submit" className="w-full">
            <DropdownMenuItem>
              خروج
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
