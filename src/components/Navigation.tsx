'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock, ShieldCheck } from 'lucide-react';
import { useConfig } from '@/context/ConfigContext';

export function Navigation() {
  const pathname = usePathname();
  const { config, isDevUnlocked, lockDevMode } = useConfig();

  // If in dedicated fullscreen kiosk mode, hide standard app navigation
  if (pathname === '/kiosk' || pathname === '/kiosk/') {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & Org Name */}
        <Link href="/" className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center text-white font-black text-xl shadow-md">
            H
          </div>
          <div>
            <span className="font-extrabold text-slate-900 text-lg tracking-tight block leading-tight">
              {config.orgName}
            </span>
            <span className="text-xs font-semibold text-slate-500 block leading-none">
              {config.campusName}
            </span>
          </div>
        </Link>

        {/* Right Action: Admin / Developer Access */}
        <div className="flex items-center space-x-2">
          {isDevUnlocked ? (
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <Link href="/developer" className="hover:underline font-extrabold">Admin Mode</Link>
              <button
                onClick={lockDevMode}
                title="Lock Admin Mode"
                className="ml-1 text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/developer"
              title="Admin Mode"
              className="p-2 text-slate-300 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
