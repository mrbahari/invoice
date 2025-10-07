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
import { signOut, handleSession, sendPasswordResetLink } from '@/app/auth/actions';
import { AuthForm } from '../auth-form';
import {
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import type { AuthFormValues } from '@/lib/definitions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';


export function UserNav() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const handleClientGoogleSignIn = async () => {
    try {
      const { auth: clientAuth } = initializeFirebase();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(clientAuth, provider);
      const idToken = await result.user.getIdToken();
      
      await handleSession(idToken);
      
      router.refresh();
      
      return { success: true };
    } catch (error: any) {
      console.error('Google Sign-In Error', error);
      return { success: false, error: error.message };
    }
  };

  const handleEmailPasswordAction = async (values: AuthFormValues, formType: 'login' | 'signup') => {
    const { auth: clientAuth } = initializeFirebase();
    const { email, password, firstName, lastName } = values;

    if (!password) {
        return { success: false, message: 'کلمه عبور الزامی است.' };
    }

    try {
        let userCredential;
        if (formType === 'signup') {
            const displayName = `${firstName} ${lastName}`;
            userCredential = await createUserWithEmailAndPassword(clientAuth, email, password);
            await updateProfile(userCredential.user, { displayName });
        } else {
            userCredential = await signInWithEmailAndPassword(clientAuth, email, password);
        }
        
        const idToken = await userCredential.user.getIdToken();
        await handleSession(idToken);
        
        router.refresh();
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


  const handleSignOut = async () => {
    await signOut();
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
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut} className="bg-destructive hover:bg-destructive/90">تایید و خروج</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
  );
}
