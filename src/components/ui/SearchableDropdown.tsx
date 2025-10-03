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
};

export default function SearchableDropdown({ id, value, onChange, suggestions = [], placeholder, className = '', multi = false, required = false }: Props) {
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

  const selectedSet = new Set(multi ? tokensFrom(value) : []);

  const filtered = suggestions
    .filter(s => s && s.toLowerCase().includes(filter.toLowerCase()))
    .filter(s => !selectedSet.has(s));

  const selectSuggestion = (s: string) => {
    if (multi) {
      const existing = tokensFrom(value);
      if (!existing.includes(s)) existing.push(s);
      const joined = existing.join(', ');
      onChange(joined);
      setFilter(joined);
    } else {
      onChange(s);
      setFilter(s);
    }
    setOpen(false);
    inputRef.current?.focus();
  };

  const onInputChange = (v: string) => {
    if (multi) {
      // allow typing partially; we update filter but don't call onChange until blur or selection
      setFilter(v);
      // also update actual value to reflect manual typing if user typed a comma-separated list
      onChange(v);
    } else {
      setFilter(v);
      onChange(v);
    }
    setOpen(true);
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
        id={id}
        ref={inputRef}
        type="text"
        value={filter}
        placeholder={placeholder}
        required={required}
        onChange={(e) => onInputChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="w-full px-4 py-3  border border-[#fbb033] rounded-3xl focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
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
