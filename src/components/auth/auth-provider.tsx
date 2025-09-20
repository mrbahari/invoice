'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { DataProvider, useData } from '@/context/data-context'; // Import useData

// Auth is removed, so we create a simple provider that just renders children
// after data is initialized.

export function AuthProvider({ children }: { children: ReactNode }) {
    const { isInitialized: dataInitialized } = useData();
    
    // While data is loading, show a full-screen loader.
    if (!dataInitialized) {
        return null; // The DataProvider will show its own loading spinner
    }

    return <>{children}</>;
}

// A dummy useAuth hook to prevent errors in other components that might still call it.
// It doesn't need to return anything as user/loading is no longer managed here.
export function useAuth() {
  return { user: true, loading: false }; // Return dummy values to prevent crashes
}
