'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, UserPlus, CreditCard, Sparkles, RefreshCw } from 'lucide-react';
import { useConfig } from '@/context/ConfigContext';
import { isWebNfcSupported, startNfcScanner, normalizeNfcTapCard } from '@/lib/hardware';

interface KioskSearchProps {
  onSearch: (query: string) => void;
  onOpenSignUp: (cardId?: string) => void;
  isLoading?: boolean;
}

export function KioskSearch({ onSearch, onOpenSignUp, isLoading }: KioskSearchProps) {
  const { config } = useConfig();
  const [query, setQuery] = useState('');
  const [isNfcActive, setIsNfcActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Background NFC Reader Loop
  useEffect(() => {
    let stopNfc: (() => void) | null = null;

    if (isWebNfcSupported()) {
      startNfcScanner({
        onScan: (cardId) => {
          const norm = normalizeNfcTapCard(cardId);
          setQuery(norm);
          onSearch(norm);
        },
        onError: () => setIsNfcActive(false),
      })
        .then((cleanup) => {
          stopNfc = cleanup;
          setIsNfcActive(true);
        })
        .catch(() => setIsNfcActive(false));
    }

    return () => {
      if (stopNfc) stopNfc();
    };
  }, [onSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query.trim());
  };

  return (
    <div className="w-full max-w-xl mx-auto text-center py-6">
      {/* Title & Badge */}
      <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black tracking-wide uppercase mb-4 shadow-sm">
        <Sparkles className="w-4 h-4 text-blue-600" />
        <span>{config.campusName} Front Desk Check-In</span>
      </div>

      <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-3">
        Welcome to {config.orgName}
      </h1>
      <p className="text-base text-slate-500 font-medium mb-8">
        Tap your Student ID / Card or enter your Last Name to check in.
      </p>

      {/* Main Search Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tap Card or Enter Last Name..."
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            className="w-full py-5 px-6 text-2xl md:text-3xl font-bold bg-white text-slate-900 placeholder-slate-300 border-2 border-slate-200 rounded-3xl text-center shadow-lg focus:border-blue-600 focus:outline-none transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="w-full py-5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-2xl text-2xl font-black shadow-xl transition-transform active:scale-98 flex items-center justify-center space-x-2 cursor-pointer"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span>Looking up account...</span>
            </>
          ) : (
            <>
              <Search className="w-6 h-6" />
              <span>Continue</span>
            </>
          )}
        </button>
      </form>

      {/* Web NFC Status Indicator */}
      {isNfcActive && (
        <div className="mt-4 flex items-center justify-center space-x-2 text-xs font-bold text-emerald-600">
          <CreditCard className="w-4 h-4 animate-pulse" />
          <span>Tap Card Reader Active — Tap anytime</span>
        </div>
      )}

      {/* Divider */}
      <div className="my-8 flex items-center space-x-4">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs font-black uppercase text-slate-400 tracking-wider">First time here?</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* First-time Student Sign Up Button (Replaces "Sign the waiver") */}
      <div>
        <button
          onClick={() => onOpenSignUp(query)}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xl font-black shadow-md transition-transform active:scale-98 flex items-center justify-center space-x-2 cursor-pointer"
        >
          <UserPlus className="w-6 h-6" />
          <span>First Time? Sign Up Here</span>
        </button>
        <p className="mt-2 text-xs text-slate-400 font-semibold">
          Takes only 30 seconds to join our student community!
        </p>
      </div>
    </div>
  );
}
