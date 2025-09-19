
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
import { checkUserHasData, batchAdd } from '@/lib/firestore-service';
import { getDefaultData } from '@/lib/default-data';

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

const seedInitialData = async (userId: string) => {
    const defaultData = getDefaultData();
    await batchAdd(userId, 'stores', defaultData.stores);
    await batchAdd(userId, 'categories', defaultData.categories);
    await batchAdd(userId, 'products', defaultData.products);
    await batchAdd(userId, 'customers', defaultData.customers);
    await batchAdd(userId, 'units', defaultData.units);
    await batchAdd(userId, 'invoices', defaultData.invoices);
};


export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userHasData = await checkUserHasData(currentUser.uid);
                if (!userHasData) {
                    await seedInitialData(currentUser.uid);
                }
            }
            setUser(currentUser);
            setLoading(false);
        });

        // Handle redirect result from Google sign-in
        getRedirectResult(auth)
            .then(async (result) => {
                if (result) {
                    const user = result.user;
                    const userHasData = await checkUserHasData(user.uid);
                    if (!userHasData) {
                       await seedInitialData(user.uid);
                    }
                    setUser(user);
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
            return; // Don't do anything while loading
        }

        const isPublicRoute = publicRoutes.includes(pathname);

        if (user && isPublicRoute) {
            router.push('/dashboard?tab=dashboard');
        } else if (!user && !isPublicRoute) {
            router.push('/login');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, loading, pathname]);

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
        
        // Seed data for new user
        await seedInitialData(userCredential.user.uid);
        
        setUser(userCredential.user);
        return userCredential.user;
    };
    
    const signInWithEmail = async (values: AuthFormValues) => {
        setLoading(true);
        if (!values.email || !values.password) {
            throw new Error("Email or password missing.");
        }
        const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
        setUser(userCredential.user);
        return userCredential.user;
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null);
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
    
    if (loading || (user && publicRoutes.includes(pathname)) || (!user && !publicRoutes.includes(pathname))) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background/80 backdrop-blur-sm">
                <LoadingSpinner />
                <div className="fixed bottom-4 left-4 text-xs text-muted-foreground/50">
                    <p>v1.0.0</p>
                    <p>Created by Esmaeil Bahari</p>
                </div>
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
