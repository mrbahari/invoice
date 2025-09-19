
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

const publicRoutes = ['/login', '/signup'];

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            try {
                // First, check if a redirect just happened
                const result = await getRedirectResult(auth);
                if (result) {
                    // Google sign-in successful, `onAuthStateChanged` will fire again with the user.
                    // We can already set loading to false and let the next check handle the redirect.
                    setUser(result.user);
                } else {
                    setUser(currentUser);
                }
            } catch (error) {
                console.error("Auth state change error:", error);
                setUser(currentUser); // Set user even if getRedirectResult fails
            } finally {
                setLoading(false);
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);
    
    useEffect(() => {
        if (loading) {
            return; // Don't do anything while loading
        }

        const isPublicRoute = publicRoutes.includes(pathname);

        if (user && isPublicRoute) {
            router.push('/dashboard?tab=dashboard');
        } else if (!user && !isPublicRoute) {
            router.push('/login');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, loading, pathname, router]);

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
        // onAuthStateChanged will handle the user state update, and the effect will handle routing
        return userCredential.user;
    };
    
    const signInWithEmail = async (values: AuthFormValues) => {
        setLoading(true);
        if (!values.email || !values.password) {
            throw new Error("Email or password missing.");
        }
        const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
        // onAuthStateChanged will handle the user state update, and the effect will handle routing
        return userCredential.user;
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    const logout = async () => {
        await signOut(auth);
        // The effect will handle the redirect to /login
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
    
    // While loading, or if routing hasn't happened yet, show a full-screen loader.
    // This prevents flashing the wrong page.
    if (loading || (user && publicRoutes.includes(pathname)) || (!user && !publicRoutes.includes(pathname))) {
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
