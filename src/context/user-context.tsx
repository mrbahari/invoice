
'use client';

import { createContext, useContext } from 'react';
import type { User } from 'firebase/auth';
import { useFirebase } from '@/firebase/provider'; // Use the central provider

interface UserContextType {
  user: User | null;
  isUserLoading: boolean;
  error: Error | null;
}

// User context is now managed by FirebaseProvider, we just need a way to access it.
// This context is now redundant but kept for any components that might still be using `useUser` from this file.
const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  // Get user state directly from the FirebaseProvider
  const { user, isUserLoading, userError } = useFirebase();

  return (
    <UserContext.Provider value={{ user, isUserLoading, error: userError }}>
      {children}
    </UserContext.Provider>
  );
}

// This hook is now a simple proxy to the `useFirebase` hook's user state.
export function useUser() {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, error: userError };
}
