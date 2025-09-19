
'use client';

import { useState, useEffect, useCallback } from 'react';

// This hook is designed to work on the client side only.
// It will not work with Server-Side Rendering (SSR) out of the box
// because it directly accesses the `window.localStorage` object.
// To use it with Next.js or other SSR frameworks, ensure the component
// using this hook is dynamically imported with `ssr: false`.

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void, () => void] {
    // A function to safely get the value from localStorage
    const readValue = useCallback((): T => {
        // Prevent build errors "window is not defined"
        if (typeof window === 'undefined') {
            return initialValue;
        }

        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                return JSON.parse(item) as T;
            }
            // If no item exists, set it to the initial value and return it
            window.localStorage.setItem(key, JSON.stringify(initialValue));
            return initialValue;
        } catch (error) {
            console.warn(`Error handling localStorage key “${key}”:`, error);
            return initialValue;
        }
    }, [initialValue, key]);

    // State to store our value
    // Pass initial state function to useState so logic is only executed once
    const [storedValue, setStoredValue] = useState<T>(initialValue);

    // Return a wrapped version of useState's setter function that ...
    // ... persists the new value to localStorage.
    const setValue = (value: T | ((val: T) => T)) => {
        // Prevent build errors "window is not defined"
        if (typeof window === 'undefined') {
            console.warn(
                `Tried setting localStorage key “${key}” even though no window was found`
            );
        }

        try {
            // Allow value to be a function so we have same API as useState
            const valueToStore =
                value instanceof Function ? value(storedValue) : value;
            // Save state
            setStoredValue(valueToStore);
            // Save to local storage
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
            // Dispatch a storage event so other hooks in the same window can update
            window.dispatchEvent(new StorageEvent('storage', { key }));
        } catch (error) {
            console.warn(`Error setting localStorage key “${key}”:`, error);
        }
    };
    
    const reload = useCallback(() => {
        setStoredValue(readValue());
    }, [readValue]);
    
    // Read the value from local storage on mount
    useEffect(() => {
        // This check ensures we only read from localStorage on the client side
        if (typeof window !== 'undefined') {
            setStoredValue(readValue());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Listen for changes to the local storage from other tabs
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === key) {
                reload();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key, reload]);


    return [storedValue, setValue, reload];
}
