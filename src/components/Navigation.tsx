'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, User, Monitor, Wrench, Sparkles, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useConfig } from '@/context/ConfigContext';
import { getStudentDisplayName } from '@/lib/types';

export function Navigation() {
  const pathname = usePathname();
  const { student, logout } = useAuth();
  const { config, isSandbox } = useConfig();

  // If in dedicated fullscreen kiosk mode, hide standard app navigation
  if (pathname === '/kiosk') {
    return null;
  }

  const navLinks = [
    { href: '/', label: 'Home', icon: Sparkles },
    { href: '/events', label: 'Events', icon: Calendar },
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/kiosk', label: 'Kiosk', icon: Monitor },
    { href: '/developer', label: 'Developer', icon: Wrench },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Banner for Sandbox Mode */}
      {isSandbox && (
        <div className="bg-amber-500 text-white text-xs font-bold py-1 px-4 text-center tracking-wide">
          SANDBOX DEMO MODE (Local Offline Storage Active) • <Link href="/developer" className="underline hover:text-amber-100">Configure Google Sheet</Link>
        </div>
      )}

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

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Status / Login Badge */}
        <div className="flex items-center space-x-2">
          {student ? (
            <div className="flex items-center space-x-2">
              <Link
                href="/profile"
                className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-blue-700 text-white text-xs font-black flex items-center justify-center">
                  {student.firstName[0] || 'S'}
                </div>
                <span className="text-xs font-bold text-slate-800 hidden sm:inline">
                  {getStudentDisplayName(student)}
                </span>
              </Link>
              <button
                onClick={logout}
                title="Log out"
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/profile"
              className="text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white px-3.5 py-2 rounded-xl shadow-sm transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 px-2 py-1.5 flex justify-around items-center shadow-lg">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-bold transition-colors ${
                isActive ? 'text-blue-700' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
