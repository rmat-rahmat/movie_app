'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSearchSuggestions,getHotKeywords } from '@/lib/movieApi';
import { FiChevronLeft } from 'react-icons/fi';

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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLFormElement | null>(null);

  // Initialize from URL param `q`
  useEffect(() => {
    try {
      const qParam = searchParams?.get('q') || '';
      setQuery(qParam);

      // Clear searchParams if the current URL is not '/search'
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/search')) {
        setQuery('');
      }
    } catch (_e) {
      // ignore errors
    }
  }, [searchParams?.toString()]);

  // Fetch suggestions when query changes (debounced)
  useEffect(() => {
    if (!query || query.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // debounce
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const list = await getSearchSuggestions(query.trim(), 8);
        if (Array.isArray(list)) {
          setSuggestions(list);
          setShowSuggestions(list.length > 0);
          setActiveIndex(-1);
        }
      } catch (_e) {
        // ignore
      }
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  // close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const value = query.trim();
    if (value) {
      router.push(`/search?q=${encodeURIComponent(value)}`);
    } else {
      router.push('/search');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showSuggestions && activeIndex >= 0 && suggestions[activeIndex]) {
        setQuery(suggestions[activeIndex]);
        setShowSuggestions(false);
        router.push(`/search?q=${encodeURIComponent(suggestions[activeIndex])}`);
        return;
      }
      handleSearch();
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
      setShowSuggestions(true);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
  };
  const handleFocus = () => {
    setIsFocused(true);
    if (!query) {
      (async () => {
        try {
          const list = await getHotKeywords(12);
          if (Array.isArray(list)) {
          setSuggestions(list);
          setShowSuggestions(list.length > 0);
          setActiveIndex(-1);
        }
        } catch (_e) {
          // ignore
        }
      })();
    } else if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Delay to allow click events on suggestions to fire
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
    }, 150);
  };

  return (
    <div className='flex flex-row w-full'>
      <FiChevronLeft onClick={()=>router.back()} className='md:hidden mt-1 w-7 h-7' />
    <form ref={containerRef} onSubmit={handleSearch} className={`relative ${className} w-full`}>
     
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="w-full px-4 py-2 pr-10 bg-[#0b0b0b] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#fbb033] focus:ring-1 focus:ring-[#fbb033] text-sm"
      />
      {/* Clear button */}
      {query && (
        <button
          type="button"
          className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#fbb033] focus:outline-none"
          onClick={() => setQuery('')}
          tabIndex={-1}
          aria-label="Clear search"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 8.586l4.95-4.95a1 1 0 111.414 1.414L11.414 10l4.95 4.95a1 1 0 01-1.414 1.414L10 11.414l-4.95 4.95a1 1 0 01-1.414-1.414L8.586 10l-4.95-4.95A1 1 0 115.05 3.636L10 8.586z" clipRule="evenodd" />
          </svg>
        </button>
      )}
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
      {/* Suggestions dropdown */}
      {isFocused && showSuggestions && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 mt-1 bg-[#0b0b0b] border border-gray-700 rounded-md shadow-lg z-50 max-h-56 overflow-auto">
          {suggestions.map((s, idx) => (
            <li
              key={s + idx}
              onMouseDown={(ev) => {
                // use onMouseDown to avoid losing focus before click
                ev.preventDefault();
                setQuery(s);
                setShowSuggestions(false);
                router.push(`/search?q=${encodeURIComponent(s)}`);
              }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-800 ${idx === activeIndex ? 'bg-gray-800' : ''}`}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </form>
    </div>
  );
};

export default SearchInput;
