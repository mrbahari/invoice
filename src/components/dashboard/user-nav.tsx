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
import { signOut, handleEmailPasswordAction, sendPasswordResetLink } from '@/app/auth/actions';
import { AuthForm } from '../auth-form';
import {
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';


export function UserNav() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

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
      
      // Instead of redirecting, just refresh the router to update the server session
      router.refresh();
      
      return { success: true };
    } catch (error: any) {
      console.error('Google Sign-In Error', error);
      return { success: false, error: error.message };
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.refresh(); // Refresh to clear server-side user state
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
          <DropdownMenuItem onClick={() => router.push('/dashboard?tab=settings')}>
            تنظیمات
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
            خروج
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
