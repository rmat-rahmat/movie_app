"use client";

import React, { useEffect, useRef, useState } from 'react';

type Props = {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  multi?: boolean; // when true, selection appends to comma-separated list
  required?: boolean;
  allowCustom?: boolean; // when true, allows custom values not in the suggestions
};

export default function SearchableDropdown({ id, value, onChange, suggestions = [], placeholder, className = '', multi = false, required = false, allowCustom = false }: Props) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [highlight, setHighlight] = useState<number>(-1);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Keep a local display copy so typing doesn't immediately overwrite external value
  useEffect(() => {
    setFilter(value ?? '');
  }, [value]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setHighlight(-1);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const tokensFrom = (v: string) => v.split(',').map(s => s.trim()).filter(Boolean);

  // Get the current token being typed (after the last comma)
  const getCurrentToken = (text: string): string => {
    if (!multi) return text;
    const lastCommaIndex = text.lastIndexOf(',');
    if (lastCommaIndex === -1) return text.trim();
    return text.substring(lastCommaIndex + 1).trim();
  };

  // Get all tokens except the current one being typed
  const getPreviousTokens = (text: string): string[] => {
    if (!multi) return [];
    const lastCommaIndex = text.lastIndexOf(',');
    if (lastCommaIndex === -1) return [];
    const previousText = text.substring(0, lastCommaIndex);
    return tokensFrom(previousText);
  };

  const currentToken = getCurrentToken(filter);
  const selectedSet = new Set(multi ? [...tokensFrom(value), ...getPreviousTokens(filter)] : []);

  const filtered = suggestions
    .filter(s => {
      if (!s) return false;
      // In multi mode, if currentToken is empty (right after comma), show all suggestions
      if (multi && currentToken === '') return true;
      // Otherwise filter by current token
      return s.toLowerCase().includes(currentToken.toLowerCase());
    })
    .filter(s => !selectedSet.has(s));

  const selectSuggestion = (s: string) => {
    if (multi) {
      const previousTokens = getPreviousTokens(filter);
      const allTokens = [...previousTokens, s];
      const joined = allTokens.join(', ') + ', ';
      onChange(joined);
      setFilter(joined);
    } else {
      onChange(s);
      setFilter(s);
    }
    setOpen(false);
    setHighlight(-1);
    inputRef.current?.focus();
  };

  const onInputChange = (v: string) => {
    setFilter(v);

    if(allowCustom){
      onChange(v);
      return;
    }
    
    if (multi) {
      // Show suggestions after comma or when typing
      const endsWithComma = v.trim().endsWith(',');
      const currentToken = getCurrentToken(v);
      
      // Open dropdown if user typed a comma (to start new value) or if typing a token
      if (endsWithComma || currentToken.length > 0) {
        setOpen(true);
      }
    } else {
      setOpen(true);
    }
    setHighlight(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) setOpen(true);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight(h => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && highlight >= 0 && highlight < filtered.length) {
        e.preventDefault();
        selectSuggestion(filtered[highlight]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setHighlight(-1);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <input
        // id={id}
        ref={inputRef}
        type="text"
        value={filter}
        placeholder={placeholder}
        onBlur={()=>{
          if(value !== filter && allowCustom ==false){
            setTimeout(() => {
              if (!filter.includes(value)) {
                setFilter(value);
              }
              else setFilter("")
            }, 200);
          }
        }}
        onChange={(e) => onInputChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="w-full px-4 py-3 z-2 border border-[#fbb033] rounded-3xl focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
        autoComplete="off"
      />
      <input
        id={id}
        type="text"
        required={required}
        value={value===filter ? value : ''}
        // placeholder={placeholder}
        // onChange={(e) => onInputChange(e.target.value)}
        // onFocus={() => setOpen(true)}
        // onKeyDown={onKeyDown}
        className="absolute z-[-1] left-0  w-full px-4 py-3  border border-[#fbb033] rounded-3xl focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
        autoComplete="off"
      />

      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto bg-black border border-[#fbb033] rounded-3xl shadow-lg">
          {filtered.map((s, i) => (
            <li
              key={s + i}
              onMouseDown={(ev) => { ev.preventDefault(); selectSuggestion(s); }}
              onMouseEnter={() => setHighlight(i)}
              className={`px-3 py-2 cursor-pointer text-sm ${i === highlight ? 'bg-[#fbb033] text-white' : 'text-gray-300 hover:bg-[#fbb033]/20'}`}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
