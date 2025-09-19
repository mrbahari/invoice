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
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (loading) { // Only run redirect logic after initial load state is handled
                if (currentUser) {
                    const targetPath = (pathname.includes('/login') || pathname.includes('/signup')) ? '/dashboard?tab=dashboard' : pathname;
                    router.push(targetPath);
                } else {
                    if (!pathname.includes('/login') && !pathname.includes('/signup')) {
                        router.push('/login');
                    }
                }
            }
            setLoading(false);
        });

        // Handle redirect result
        getRedirectResult(auth)
            .then((result) => {
                if (result) {
                    // This is the signed-in user
                    const user = result.user;
                    setUser(user);
                    router.push('/dashboard?tab=dashboard');
                }
            })
            .catch((error) => {
                console.error("Google Redirect Result Error:", error);
            }).finally(() => {
                setLoading(false);
            });


        return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);

    const signInWithGoogle = async () => {
        setLoading(true);
        const provider = new GoogleAuthProvider();
        await signInWithRedirect(auth, provider);
        // The page will redirect, and the result will be handled by getRedirectResult
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
        // onAuthStateChanged will handle redirect
        return userCredential.user;
    };
    
    const signInWithEmail = async (values: AuthFormValues) => {
        setLoading(true);
        if (!values.email || !values.password) {
            throw new Error("Email or password missing.");
        }
        const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
        // onAuthStateChanged will handle redirect
        return userCredential.user;
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    const logout = async () => {
        await signOut(auth);
        // onAuthStateChanged will handle redirect to /login
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
