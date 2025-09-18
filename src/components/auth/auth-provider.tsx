
'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import type { AuthFormValues } from '@/lib/definitions';


type AuthContextType = {
  user: User | null;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (values: AuthFormValues) => Promise<User | null>;
  signInWithEmail: (values: AuthFormValues) => Promise<User | null>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Authentication is disabled.
  const value: AuthContextType = {
    user: null,
    signInWithGoogle: async () => {},
    signUpWithEmail: async () => null,
    signInWithEmail: async () => null,
    resetPassword: async () => {},
    logout: () => {},
    loading: false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
