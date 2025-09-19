
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
    onAuthStateChanged, 
    signOut, 
    GoogleAuthProvider, 
    signInWithRedirect,
    getRedirectResult,
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile,
    type User
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { AuthFormValues } from '@/lib/definitions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useRouter, usePathname } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (values: AuthFormValues) => Promise<User | null>;
  signInWithEmail: (values: AuthFormValues) => Promise<User | null>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const processAuth = async () => {
            try {
                // Check for redirect result first
                const result = await getRedirectResult(auth);
                if (result) {
                    // This means a sign-in via redirect just happened.
                    // onAuthStateChanged will handle setting the user, so we can just redirect.
                    router.push('/dashboard?tab=dashboard');
                    // We might not need to setLoading(false) here because onAuthStateChanged will do it.
                    // But if there's a delay, the loading spinner is good.
                    return; // Stop further execution in this effect
                }
            } catch (error) {
                console.error("Google Redirect Result Error:", error);
                // Fall through to onAuthStateChanged
            }

            // If no redirect, set up the normal auth state listener
            const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
                setUser(currentUser);
                setLoading(false);
            });
            
            return unsubscribe;
        };

        let unsubscribe: (() => void) | undefined;
        processAuth().then(unsub => {
            if (unsub) {
                unsubscribe = unsub;
            }
        });

        // Cleanup function
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const signInWithGoogle = async () => {
        setLoading(true);
        const provider = new GoogleAuthProvider();
        await signInWithRedirect(auth, provider);
        // The page will redirect, and the result will be handled by the useEffect above.
    };

    const signUpWithEmail = async (values: AuthFormValues) => {
        setLoading(true);
        if (!values.email || !values.password || !values.firstName) {
            throw new Error("Missing fields for sign up");
        }
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        await updateProfile(userCredential.user, {
            displayName: `${values.firstName} ${values.lastName || ''}`.trim()
        });
        // onAuthStateChanged will handle the user state update, and router is handled by page
        return userCredential.user;
    };
    
    const signInWithEmail = async (values: AuthFormValues) => {
        setLoading(true);
        if (!values.email || !values.password) {
            throw new Error("Email or password missing.");
        }
        const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
        // onAuthStateChanged will handle the user state update, and router is handled by page
        return userCredential.user;
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    const logout = async () => {
        await signOut(auth);
        // onAuthStateChanged will set user to null, and router is handled by dashboard layout
        router.push('/login');
    };

    const value: AuthContextType = {
        user,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        resetPassword,
        logout,
        loading,
    };
    
    // The AuthProvider no longer handles redirects, just the loading state.
    // Page components and layout components will handle redirects.
    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background/80 backdrop-blur-sm">
                <LoadingSpinner />
            </div>
        );
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
