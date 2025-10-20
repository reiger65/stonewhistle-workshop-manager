import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SearchContextProps {
  filter: string;
  setFilter: (filter: string) => void;
}

const SearchContext = createContext<SearchContextProps | undefined>(undefined);

interface SearchProviderProps {
  children: ReactNode;
}

export function SearchProvider({ children }: SearchProviderProps) {
  const [filter, setFilter] = useState('');

  return (
    <SearchContext.Provider value={{ filter, setFilter }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch(): SearchContextProps {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}