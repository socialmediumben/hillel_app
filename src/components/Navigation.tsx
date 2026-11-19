'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, User, Monitor, Wrench, Sparkles, LogOut, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useConfig } from '@/context/ConfigContext';
import { getStudentDisplayName } from '@/lib/types';

export function Navigation() {
  const pathname = usePathname();
  const { student, logout } = useAuth();
  const { config, isDevUnlocked, lockDevMode } = useConfig();

  // If in dedicated fullscreen kiosk mode, hide standard app navigation
  if (pathname === '/kiosk' || pathname === '/kiosk/') {
    return null;
  }

  const baseNavLinks = [
    { href: '/', label: 'Home', icon: Sparkles },
    { href: '/events', label: 'Events', icon: Calendar },
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/kiosk', label: 'Kiosk', icon: Monitor },
  ];

  const adminLink = { href: '/developer', label: 'Admin', icon: Wrench };
  const navLinks = isDevUnlocked ? [...baseNavLinks, adminLink] : baseNavLinks;

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

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname === `${link.href}/`;
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
          {isDevUnlocked ? (
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <Link href="/developer" className="hover:underline">Admin Mode</Link>
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
              className="p-2 text-slate-300 hover:text-slate-500 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
            </Link>
          )}

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
          const isActive = pathname === link.href || pathname === `${link.href}/`;
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
