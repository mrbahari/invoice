'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { useFirebase } from '@/firebase/provider'; // Use the central provider

interface UserContextType {
  user: User | null;
  isUserLoading: boolean;
  error: Error | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  // Get user state directly from the FirebaseProvider
  const { user, isUserLoading, userError } = useFirebase();

  return (
    <UserContext.Provider value={{ user, isUserLoading, error: userError }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
