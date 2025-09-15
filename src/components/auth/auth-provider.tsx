
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, User, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { AuthFormValues } from '@/lib/definitions';


type AuthContextType = {
  user: User | null;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (values: AuthFormValues) => Promise<User | null>;
  signInWithEmail: (values: AuthFormValues) => Promise<User | null>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/login' || pathname === '/signup';

    if (!user && !isAuthPage) {
      router.push('/login');
    } else if (user && isAuthPage) {
      router.push('/dashboard');
    }
  }, [user, loading, router, pathname]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const signUpWithEmail = async ({ email, password }: AuthFormValues) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
      return userCredential.user;
    } catch (error) {
      console.error("Error signing up with email", error);
      throw error;
    }
  };

  const signInWithEmail = async ({ email, password }: AuthFormValues) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
      return userCredential.user;
    } catch (error) {
      console.error("Error signing in with email", error);
      throw error;
    }
  };


  const logout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const value = { user, signInWithGoogle, signUpWithEmail, signInWithEmail, logout, loading };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">در حال بارگذاری...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
