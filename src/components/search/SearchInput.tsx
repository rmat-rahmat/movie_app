'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface SearchInputProps {
  placeholder?: string;
  className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({ 
  placeholder = "Search videos...", 
  className = "" 
}) => {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize from URL param `q` or from sessionStorage fallback so header retains value across navigation
  useEffect(() => {
    try {
      const qParam = searchParams?.get('q') || '';
      const stored = typeof window !== 'undefined' ? sessionStorage.getItem('seefu_search_query') : null;
      const initial = qParam || stored || '';
      setQuery(initial);
    } catch (e) {
      // ignore storage errors
    }
  }, [searchParams?.toString()]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const value = query.trim();
    try {
      if (typeof window !== 'undefined') sessionStorage.setItem('seefu_search_query', value);
    } catch (err) {
      // ignore
    }
    if (value) {
      router.push(`/search?q=${encodeURIComponent(value)}`);
    } else {
      router.push('/search');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // call handleSearch without passing keyboard event (it expects FormEvent)
      handleSearch();
    }
  };

  return (
    <form onSubmit={handleSearch} className={`relative ${className}`}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          const v = e.target.value;
          setQuery(v);
          try {
            if (typeof window !== 'undefined') sessionStorage.setItem('seefu_search_query', v);
          } catch (err) {
            // ignore
          }
        }}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className="w-full px-4 py-2 pr-10 bg-[#0b0b0b] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#fbb033] focus:ring-1 focus:ring-[#fbb033] text-sm"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
      >
        <svg 
          className="w-4 h-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
          />
        </svg>
      </button>
    </form>
  );
};

export default SearchInput;
