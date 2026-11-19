'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { LogOut, RefreshCw, Home, CheckCircle2, UserCheck } from 'lucide-react';
import { StudentProfile, AppEvent, getStudentDisplayName } from '@/lib/types';
import { useConfig } from '@/context/ConfigContext';
import { searchStudents, fetchEvents } from '@/lib/sheets';
import { KioskSearch } from '@/components/kiosk/KioskSearch';
import { KioskResults } from '@/components/kiosk/KioskResults';
import { KioskNametag } from '@/components/kiosk/KioskNametag';
import { KioskCheckInOptions } from '@/components/kiosk/KioskCheckInOptions';
import { KioskEventRsvp } from '@/components/kiosk/KioskEventRsvp';
import { KioskCardLink } from '@/components/kiosk/KioskCardLink';
import { KioskSignUpModal } from '@/components/kiosk/KioskSignUpModal';

type KioskStage = 'search' | 'results' | 'session';

export default function KioskPage() {
  const { config, isSandbox } = useConfig();
  const [stage, setStage] = useState<KioskStage>('search');
  const [searchResults, setSearchResults] = useState<StudentProfile[]>([]);
  const [activeStudent, setActiveStudent] = useState<StudentProfile | null>(null);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [signUpCardHint, setSignUpCardHint] = useState<string | undefined>(undefined);
  const [notification, setNotification] = useState<string | null>(null);

  // Load events
  const loadEventsData = useCallback(async () => {
    try {
      const data = await fetchEvents(config);
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events in kiosk:', err);
    }
  }, [config]);

  useEffect(() => {
    loadEventsData();
  }, [loadEventsData]);

  // Auto-reset idle timer when in session mode (90 seconds of inactivity)
  useEffect(() => {
    if (stage !== 'session') return;

    const timeout = setTimeout(() => {
      handleReset();
    }, 90000);

    return () => clearTimeout(timeout);
  }, [stage, activeStudent]);

  const handleReset = () => {
    setActiveStudent(null);
    setSearchResults([]);
    setStage('search');
    setNotification(null);
  };

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setNotification(null);

    try {
      const results = await searchStudents(query, config);

      if (results.length === 0) {
        // No match found -> Prompt sign-up with query as card hint
        setSignUpCardHint(query);
        setIsSignUpOpen(true);
      } else if (results.length === 1) {
        // Single match -> Directly enter student session (NO automatic generic check-in)
        setActiveStudent(results[0]);
        setStage('session');
      } else {
        // Multiple matches -> Show selection list
        setSearchResults(results);
        setStage('results');
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectStudent = (student: StudentProfile) => {
    setActiveStudent(student);
    setStage('session');
  };

  const handleSignUpSuccess = (newStudent: StudentProfile) => {
    setActiveStudent(newStudent);
    setStage('session');
    setNotification(`Welcome to Hillel, ${getStudentDisplayName(newStudent)}!`);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between select-none">
      {/* Top Kiosk Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between no-print shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-700 flex items-center justify-center text-white font-black text-xl shadow-md">
            H
          </div>
          <div>
            <span className="font-extrabold text-slate-900 text-lg block leading-tight">
              {config.orgName} Check-In Kiosk
            </span>
            <span className="text-xs font-semibold text-slate-500 block leading-none">
              {config.campusName} • Station: {config.stationId}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isSandbox && (
            <span className="bg-amber-100 text-amber-800 text-xs font-extrabold px-3 py-1.5 rounded-full border border-amber-300">
              Sandbox Mode
            </span>
          )}

          {stage !== 'search' && (
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Done / Start Over</span>
            </button>
          )}

          <Link
            href="/"
            title="Exit Kiosk to App"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <Home className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Main Kiosk Content Area */}
      <main className="flex-1 flex flex-col justify-center items-center p-4 md:p-8 max-w-7xl w-full mx-auto">
        {/* Stage 1: Search / Tap Card */}
        {stage === 'search' && (
          <KioskSearch
            onSearch={handleSearch}
            onOpenSignUp={(cardHint) => {
              setSignUpCardHint(cardHint);
              setIsSignUpOpen(true);
            }}
            isLoading={isLoading}
          />
        )}

        {/* Stage 2: Account Selection Results */}
        {stage === 'results' && (
          <KioskResults
            students={searchResults}
            onSelect={handleSelectStudent}
            onBack={handleReset}
          />
        )}

        {/* Stage 3: Active Student Session */}
        {stage === 'session' && activeStudent && (
          <div className="w-full space-y-6">
            {/* Greeting Banner */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-700 text-white font-black text-2xl flex items-center justify-center shadow-md">
                  <UserCheck className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-900">
                    Welcome, {getStudentDisplayName(activeStudent)}!
                  </h1>
                  <p className="text-sm font-semibold text-slate-500">
                    {activeStudent.classYear && `Class of '${activeStudent.classYear.slice(-2)}`}
                    {activeStudent.major && ` • ${activeStudent.major}`}
                    {activeStudent.pronouns && ` • (${activeStudent.pronouns})`}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  onClick={handleReset}
                  className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-black text-white font-extrabold rounded-2xl text-base shadow-md transition-transform active:scale-95 cursor-pointer"
                >
                  Finished / Done
                </button>
              </div>
            </div>

            {/* Notification Toast */}
            {notification && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-2xl flex items-center space-x-3 no-print">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                <span className="font-extrabold text-sm">{notification}</span>
              </div>
            )}

            {/* Two-Column Session Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Nametag & Card Link (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                <KioskNametag
                  student={activeStudent}
                  onPrint={() => setNotification('Printing nametag...')}
                />

                <KioskCardLink
                  student={activeStudent}
                  onCardUpdated={(newCardId) => {
                    setActiveStudent((prev) => (prev ? { ...prev, tapCard: newCardId } : null));
                    setNotification(`Card ${newCardId} linked!`);
                  }}
                />
              </div>

              {/* Right Column: Check-In Options & Upcoming RSVPs (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                <KioskCheckInOptions
                  student={activeStudent}
                  events={events}
                  onCheckedIn={(evtName) => {
                    setNotification(`Checked in to ${evtName}! 🎉`);
                  }}
                />

                <KioskEventRsvp
                  student={activeStudent}
                  events={events}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs font-semibold text-slate-400 no-print">
        {config.orgName} Interactive Check-In Platform • Tap Card to Begin
      </footer>

      {/* First-Time Student Sign-Up Modal */}
      <KioskSignUpModal
        isOpen={isSignUpOpen}
        onClose={() => setIsSignUpOpen(false)}
        onSuccess={handleSignUpSuccess}
        initialTapCard={signUpCardHint}
      />
    </div>
  );
}
