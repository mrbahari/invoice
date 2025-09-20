'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type SearchContextType = {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isSearchVisible: boolean;
  setSearchVisible: (visible: boolean) => void;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchVisible, setSearchVisible] = useState(true);

  const value = {
    searchTerm,
    setSearchTerm,
    isSearchVisible,
    setSearchVisible,
  };

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
