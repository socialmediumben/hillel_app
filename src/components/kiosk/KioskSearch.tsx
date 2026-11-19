'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, UserPlus, CreditCard, Sparkles, RefreshCw, Smartphone, Radio, CheckCircle2 } from 'lucide-react';
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
  const [nfcError, setNfcError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const stopNfcRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setIsSupported(isWebNfcSupported());
  }, []);

  // Cleanup NFC scanner on unmount
  useEffect(() => {
    return () => {
      if (stopNfcRef.current) {
        stopNfcRef.current();
      }
    };
  }, []);

  const handleActivatePhoneNfc = async () => {
    setNfcError(null);
    try {
      const stop = await startNfcScanner({
        onScan: (scannedId) => {
          const norm = normalizeNfcTapCard(scannedId);
          setQuery(norm);
          onSearch(norm);
        },
        onError: (err) => {
          console.warn('NFC Scan warning:', err);
        },
      });
      stopNfcRef.current = stop;
      setIsNfcActive(true);
    } catch (err: any) {
      console.error('NFC start error:', err);
      setNfcError(err.message || 'Could not start phone NFC. Make sure NFC is enabled in phone settings.');
      setIsNfcActive(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query.trim());
  };

  return (
    <div className="w-full max-w-xl mx-auto text-center py-4">
      {/* Title & Badge */}
      <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black tracking-wide uppercase mb-3 shadow-sm">
        <Sparkles className="w-4 h-4 text-blue-600" />
        <span>{config.campusName} Front Desk Check-In</span>
      </div>

      <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-2">
        Welcome to {config.orgName}
      </h1>
      <p className="text-sm md:text-base text-slate-500 font-medium mb-6">
        Tap your card or student ID to this phone, or search by last name.
      </p>

      {/* PHONE BUILT-IN NFC TAP CARD BUTTON (FOR ANDROID & MOBILE PHONES) */}
      <div className="mb-6">
        {isSupported ? (
          !isNfcActive ? (
            <button
              type="button"
              onClick={handleActivatePhoneNfc}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-2xl shadow-lg flex items-center justify-center space-x-3 transition-transform active:scale-95 cursor-pointer border border-blue-500/30"
            >
              <Smartphone className="w-6 h-6 animate-bounce" />
              <div className="text-left">
                <span className="block font-black text-base md:text-lg leading-tight">
                  📱 Tap Card to Back of Phone
                </span>
                <span className="block text-xs text-blue-200 font-medium">
                  Tap here to activate this phone's built-in NFC reader
                </span>
              </div>
            </button>
          ) : (
            <div className="bg-emerald-50 border-2 border-emerald-400 p-4 rounded-2xl shadow-sm text-center animate-pulse">
              <div className="flex items-center justify-center space-x-2 text-emerald-800 font-black text-sm md:text-base mb-1">
                <Radio className="w-5 h-5 text-emerald-600 animate-spin" />
                <span>Phone NFC Reader Active!</span>
              </div>
              <p className="text-xs text-emerald-700 font-semibold">
                Hold student ID, wristband, or card against the <strong>back of this phone</strong> (near camera).
              </p>
            </div>
          )
        ) : (
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-left text-xs text-slate-500 flex items-start space-x-2">
            <CreditCard className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-700">Card Scanner Ready: </span>
              <span>Tap a card using an external USB/Bluetooth reader, or type your last name below. (Built-in phone NFC is natively supported on Android Chrome).</span>
            </div>
          </div>
        )}

        {nfcError && (
          <div className="mt-2 text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 text-left">
            {nfcError}
          </div>
        )}
      </div>

      {/* Manual Input / Search Bar */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Or enter Last Name / Card UID..."
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            className="w-full py-4 px-6 text-xl md:text-2xl font-bold bg-white text-slate-900 placeholder-slate-300 border-2 border-slate-200 rounded-2xl text-center shadow-md focus:border-blue-600 focus:outline-none transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="w-full py-4 bg-slate-900 hover:bg-black disabled:opacity-40 text-white rounded-2xl text-xl font-black shadow-lg transition-transform active:scale-98 flex items-center justify-center space-x-2 cursor-pointer"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Looking up account...</span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>Search & Check-In</span>
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center space-x-4">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs font-black uppercase text-slate-400 tracking-wider">New to Hillel?</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* First-time Student Sign Up Button */}
      <div>
        <button
          onClick={() => onOpenSignUp(query)}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-lg font-black shadow-md transition-transform active:scale-98 flex items-center justify-center space-x-2 cursor-pointer"
        >
          <UserPlus className="w-5 h-5" />
          <span>First Time? Sign Up Here</span>
        </button>
        <p className="mt-2 text-xs text-slate-400 font-semibold">
          Takes only 30 seconds to join our student community!
        </p>
      </div>
    </div>
  );
}
