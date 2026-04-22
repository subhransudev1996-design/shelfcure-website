'use client';

import { Search, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  debounceMs?: number;
  className?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  placeholder = 'Search...',
  value: externalValue,
  onChange,
  debounceMs = 300,
  className = '',
  autoFocus = false,
}: SearchInputProps) {
  const [internal, setInternal] = useState(externalValue ?? '');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (externalValue !== undefined) setInternal(externalValue);
  }, [externalValue]);

  const handleChange = (val: string) => {
    setInternal(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(val), debounceMs);
  };

  const clear = () => {
    setInternal('');
    onChange('');
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
      <input
        type="text"
        value={internal}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full pl-10 pr-10 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 font-medium focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
      />
      {internal && (
        <button
          onClick={clear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
