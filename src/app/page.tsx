'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, User, Monitor, Sparkles, Clock, MapPin, CheckCircle2, Lock, Check } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/context/AuthContext';
import { useConfig } from '@/context/ConfigContext';
import { AppEvent, getStudentDisplayName, isEventToday, isEventUpcomingOrToday } from '@/lib/types';
import { fetchEvents, recordEventRsvp } from '@/lib/sheets';
import { getTodayDateString } from '@/lib/sandbox';

export default function HomePage() {
  const { student } = useAuth();
  const { config } = useConfig();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [rsvpdIds, setRsvpdIds] = useState<Set<string>>(new Set());
  const [rsvpLoadingId, setRsvpLoadingId] = useState<string | null>(null);
  const [rsvpFeedback, setRsvpFeedback] = useState<string | null>(null);

  const todayStr = getTodayDateString();

  useEffect(() => {
    fetchEvents(config)
      .then((data) => setEvents(data))
      .catch(console.error)
      .finally(() => setIsLoadingEvents(false));
  }, [config]);

  const categories = ['All', 'Shabbat', 'Social', 'Learning', 'Tikkun Olam'];

  const filteredEvents = events.filter((e) => {
    if (!e.active) return false;
    if (selectedCategory === 'All') return true;
    return e.category && e.category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const handleRsvp = async (event: AppEvent) => {
    if (!student) {
      setRsvpFeedback('Please sign in to your student profile first to RSVP in one click!');
      return;
    }
    setRsvpLoadingId(event.id);
    setRsvpFeedback(null);
    try {
      const res = await recordEventRsvp(student, event, config);
      if (res.success) {
        setRsvpdIds((prev) => new Set([...Array.from(prev), event.id]));
        setRsvpFeedback(`You're confirmed for "${event.title}"! See you there.`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRsvpLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Hero Greeting Card */}
        <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-blue-600/40 border border-blue-400/30 px-3.5 py-1 rounded-full text-xs font-black tracking-wider uppercase mb-4">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{config.campusName}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-3">
              {student ? `Shalom, ${getStudentDisplayName(student)}!` : `Welcome to ${config.orgName}`}
            </h1>
            <p className="text-blue-100 text-sm sm:text-base font-medium leading-relaxed mb-6">
              Your community hub for vibrant campus life, Shabbat dinners, bagel brunches, learning, and lasting friendships.
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="#events-section"
                className="inline-flex items-center space-x-2 bg-white text-blue-800 hover:bg-blue-50 px-5 py-3 rounded-2xl font-black text-sm shadow-md transition-all active:scale-95"
              >
                <Calendar className="w-4 h-4" />
                <span>Browse Events Calendar</span>
              </a>
              <Link
                href="/kiosk"
                className="inline-flex items-center space-x-2 bg-blue-600/60 hover:bg-blue-600 text-white border border-blue-400/40 px-5 py-3 rounded-2xl font-black text-sm transition-all active:scale-95"
              >
                <Monitor className="w-4 h-4" />
                <span>Open Front Desk Kiosk</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Portal Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/profile"
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 transition-all group flex items-start space-x-4"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold flex-shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg mb-1 group-hover:text-amber-700 transition-colors">
                Student Profile & Pass
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {student ? `Signed in as ${getStudentDisplayName(student)}. Edit your info or tap pass.` : 'Sign in to update your graduation year, dietary needs, interests, and 1-click RSVP.'}
              </p>
            </div>
          </Link>

          <Link
            href="/kiosk"
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 transition-all group flex items-start space-x-4"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg mb-1 group-hover:text-indigo-700 transition-colors">
                Check-In Kiosk Terminal
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Self-service front desk check-in via tap card or student search with instant thermal nametag printing.
              </p>
            </div>
          </Link>
        </div>

        {/* Integrated Events Calendar Section */}
        <div id="events-section" className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-black uppercase mb-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Events Calendar</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Upcoming Hillel Programs</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold">
                Synchronized live with the Google Sheet. All programs are completely free!
              </p>
            </div>

            {!student && (
              <Link
                href="/profile"
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-extrabold rounded-2xl text-xs shadow-md transition-all self-start sm:self-auto"
              >
                Sign In for 1-Click RSVP
              </Link>
            )}
          </div>

          {/* Feedback banner */}
          {rsvpFeedback && (
            <div className="bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-2xl text-xs font-bold flex items-center justify-between">
              <span>{rsvpFeedback}</span>
              <button
                onClick={() => setRsvpFeedback(null)}
                className="text-blue-500 hover:text-blue-700 font-extrabold ml-4 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-blue-700 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Events Grid */}
          {isLoadingEvents ? (
            <div className="py-16 text-center text-slate-400 font-bold text-sm">
              Loading events from Google Sheet...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-lg font-bold text-slate-700">No events found in this category</h4>
              <p className="text-xs text-slate-400">Add events to the 'App Events' tab in your Google Sheet to view them here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEvents.map((evt) => {
                const isRsvpd = rsvpdIds.has(evt.id);
                const isToday = isEventToday(evt.date);
                const isPast = !isEventUpcomingOrToday(evt.date) && !isToday;

                return (
                  <div
                    key={evt.id}
                    className={`rounded-3xl border p-5 flex flex-col justify-between transition-all ${
                      isToday
                        ? 'border-blue-400 ring-2 ring-blue-100 bg-blue-50/30'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                          {evt.category || 'Event'}
                        </span>
                        <div className="flex items-center space-x-1.5">
                          {isToday && (
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              Today
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Free
                          </span>
                        </div>
                      </div>

                      <h3 className="font-extrabold text-slate-900 text-lg mb-2 leading-snug">
                        {evt.title}
                      </h3>

                      {evt.description && (
                        <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-4 leading-relaxed">
                          {evt.description}
                        </p>
                      )}

                      <div className="space-y-1.5 text-xs text-slate-600 font-semibold mb-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{evt.date}</span>
                          {evt.startTime && <span>• {evt.startTime} {evt.endTime ? `- ${evt.endTime}` : ''}</span>}
                        </div>
                        {evt.location && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{evt.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      {isPast ? (
                        <div className="text-center py-2 text-xs font-bold text-slate-400 bg-slate-100 rounded-xl">
                          Past Event
                        </div>
                      ) : student ? (
                        <button
                          onClick={() => handleRsvp(evt)}
                          disabled={isRsvpd || rsvpLoadingId === evt.id}
                          className={`w-full py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                            isRsvpd
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-700 hover:bg-blue-800 text-white shadow-sm active:scale-95'
                          }`}
                        >
                          {isRsvpd ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>RSVP Confirmed ✓</span>
                            </>
                          ) : rsvpLoadingId === evt.id ? (
                            <span>Saving RSVP...</span>
                          ) : (
                            <span>RSVP (Free)</span>
                          )}
                        </button>
                      ) : (
                        <Link
                          href="/profile"
                          className="block text-center w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                        >
                          Sign In to RSVP
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <footer className="py-6 text-xs font-semibold text-slate-400 border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{config.orgName} • {config.campusName}</span>
          <Link href="/developer" className="hover:text-slate-600 transition-colors flex items-center space-x-1.5">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Admin & Developer Mode</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
