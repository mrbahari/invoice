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
import { useUser, useAuth } from '@/firebase';
import { sendPasswordResetLink } from '@/app/auth/actions';
import { AuthForm } from '../auth-form';
import {
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithRedirect,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import type { AuthFormValues } from '@/lib/definitions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';


export function UserNav() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await firebaseSignOut(auth);
      // The onAuthStateChanged listener in FirebaseProvider will handle the user state update.
      // We can redirect or refresh to ensure a clean state.
      toast({ variant: 'success', title: 'خروج موفق', description: 'شما با موفقیت از حساب خود خارج شدید.' });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
      toast({ variant: 'destructive', title: 'خطا در خروج', description: 'مشکلی در فرآیند خروج رخ داد.' });
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleClientGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // First, try to sign in with a popup. This is better for desktop.
      await signInWithPopup(auth, provider);
      return { success: true };
    } catch (error: any) {
      // If the popup fails (e.g., blocked on mobile), fall back to redirect.
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, provider);
          // No return here as the page will redirect. The result is handled on the next page load.
          return { success: true }; // Technically this won't be used, but for consistency
        } catch (redirectError: any) {
          console.error('Google Sign-In Redirect Error', redirectError);
          return { success: false, error: redirectError.message };
        }
      } else {
        // Handle other errors (e.g., user closes popup)
        console.error('Google Sign-In Popup Error', error);
        return { success: false, error: error.message };
      }
    }
  };

  const handleEmailPasswordAction = async (values: AuthFormValues, formType: 'login' | 'signup') => {
    const { email, password, firstName, lastName } = values;

    if (!password) {
        return { success: false, message: 'کلمه عبور الزامی است.' };
    }

    try {
        if (formType === 'signup') {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const displayName = `${firstName} ${lastName}`;
            await updateProfile(userCredential.user, { displayName });
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
        // onAuthStateChanged will handle the rest
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
    <AlertDialog>
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
            <DropdownMenuItem onClick={() => router.push('/dashboard?tab=profile')}>
              پروفایل کاربری
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard?tab=settings')}>
              تنظیمات
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
            <AlertDialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  خروج
              </DropdownMenuItem>
            </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
       <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>خروج از حساب</AlertDialogTitle>
            <AlertDialogDescription>
              آیا برای خروج از حساب کاربری خود مطمئن هستید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid-cols-2">
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut} disabled={isSigningOut} className="bg-destructive hover:bg-destructive/90">
                {isSigningOut && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                تایید و خروج
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
  );
}
