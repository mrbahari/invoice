
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
import { seedInitialData, getCollection } from '@/lib/firestore-service';

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
            setUser(currentUser);

            // If a user is newly created (e.g., first sign-in), seed their data.
            if (currentUser) {
                const stores = await getCollection(currentUser.uid, 'stores');
                if (stores.length === 0) {
                   await seedInitialData(currentUser.uid);
                }
            }
            setLoading(false);
        });

        // Handle Google sign-in redirect result
        getRedirectResult(auth)
            .then(async (result) => {
                if (result) {
                    const currentUser = result.user;
                    setUser(currentUser);
                     // Check if it's a new user
                    const stores = await getCollection(currentUser.uid, 'stores');
                    if (stores.length === 0) {
                        await seedInitialData(currentUser.uid);
                    }
                }
            })
            .catch((error) => {
                console.error("Error getting redirect result:", error);
            })
            .finally(() => {
                setLoading(false);
            });
        
        return () => unsubscribe();
    }, []);
    
    useEffect(() => {
        if (loading) {
            return; 
        }

        const isPublicRoute = publicRoutes.includes(pathname);

        if (user && isPublicRoute) {
            router.push('/dashboard?tab=dashboard');
        } else if (!user && !isPublicRoute) {
            router.push('/login');
        }
    }, [user, loading, pathname, router]);

    const signInWithGoogle = async () => {
        setLoading(true);
        const provider = new GoogleAuthProvider();
        await signInWithRedirect(auth, provider);
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
        await seedInitialData(userCredential.user.uid);
        setUser(userCredential.user);
        setLoading(false);
        return userCredential.user;
    };
    
    const signInWithEmail = async (values: AuthFormValues) => {
        setLoading(true);
        if (!values.email || !values.password) {
            throw new Error("Email or password missing.");
        }
        const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
        setUser(userCredential.user);
        setLoading(false);
        return userCredential.user;
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null);
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
    
    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background/80 backdrop-blur-sm">
                <LoadingSpinner />
            </div>
        );
    }
    
    // This logic prevents flashing content by ensuring routing happens first.
    const isPublic = publicRoutes.includes(pathname);
    if (!user && !isPublic) {
        return null; // or loading spinner
    }
    if (user && isPublic) {
        return null; // or loading spinner
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
