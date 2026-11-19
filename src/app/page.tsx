'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, User, Monitor, Sparkles, Clock, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/context/AuthContext';
import { useConfig } from '@/context/ConfigContext';
import { AppEvent, getStudentDisplayName, isEventUpcomingOrToday } from '@/lib/types';
import { fetchEvents, recordEventRsvp } from '@/lib/sheets';
import { getTodayDateString } from '@/lib/sandbox';

export default function HomePage() {
  const { student } = useAuth();
  const { config } = useConfig();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [rsvpdIds, setRsvpdIds] = useState<Set<string>>(new Set());

  const todayStr = getTodayDateString();

  useEffect(() => {
    fetchEvents(config)
      .then((data) => setEvents(data))
      .catch(console.error)
      .finally(() => setIsLoadingEvents(false));
  }, [config]);

  const upcomingEvents = events.filter((e) => e.active && isEventUpcomingOrToday(e.date)).slice(0, 3);

  const handleQuickRsvp = async (event: AppEvent) => {
    if (!student) return;
    try {
      const res = await recordEventRsvp(student, event, config);
      if (res.success) {
        setRsvpdIds((prev) => new Set([...Array.from(prev), event.id]));
      }
    } catch (err) {
      console.error(err);
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
              Your home for vibrant Jewish life, community Shabbat dinners, learning, social action, and lasting friendships on campus.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/events"
                className="inline-flex items-center space-x-2 bg-white text-blue-800 hover:bg-blue-50 px-5 py-3 rounded-2xl font-black text-sm shadow-md transition-all active:scale-95"
              >
                <Calendar className="w-4 h-4" />
                <span>Explore Upcoming Events</span>
              </Link>
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

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/events"
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-black text-slate-900 text-lg mb-1 group-hover:text-blue-700 transition-colors">
              App Events
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Browse Shabbat dinners, bagel brunches, and fellowship programs. Free RSVP.
            </p>
          </Link>

          <Link
            href="/profile"
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold mb-4 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <User className="w-6 h-6" />
            </div>
            <h3 className="font-black text-slate-900 text-lg mb-1 group-hover:text-amber-700 transition-colors">
              Student Profile
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Update your preferred name, pronouns, dietary needs, interests, and digital pass.
            </p>
          </Link>

          <Link
            href="/kiosk"
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Monitor className="w-6 h-6" />
            </div>
            <h3 className="font-black text-slate-900 text-lg mb-1 group-hover:text-indigo-700 transition-colors">
              Check-In Kiosk
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Check-in via card tap or last name, print thermal nametag, and sign up.
            </p>
          </Link>
        </div>

        {/* Featured Upcoming Events Section */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Upcoming at {config.orgName}</h2>
              <p className="text-xs text-slate-500 font-semibold">Synchronized directly from the 'App Events' sheet tab</p>
            </div>
            <Link
              href="/events"
              className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>View All Events</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoadingEvents ? (
            <div className="py-12 text-center text-slate-400 font-bold text-sm">
              Loading upcoming events...
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-bold text-sm">
              No upcoming events scheduled right now. Check back soon!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {upcomingEvents.map((evt) => {
                const isRsvpd = rsvpdIds.has(evt.id);
                return (
                  <div
                    key={evt.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between hover:border-blue-300 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                          {evt.category || 'Event'}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Free
                        </span>
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-base mb-2 leading-snug">
                        {evt.title}
                      </h4>

                      <div className="space-y-1 text-xs text-slate-500 font-semibold mb-3">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{evt.date}</span>
                          {evt.startTime && <span>• {evt.startTime}</span>}
                        </div>
                        {evt.location && (
                          <div className="flex items-center space-x-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{evt.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200">
                      {student ? (
                        <button
                          onClick={() => handleQuickRsvp(evt)}
                          disabled={isRsvpd}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isRsvpd
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-700 hover:bg-blue-800 text-white shadow-sm'
                          }`}
                        >
                          {isRsvpd ? 'RSVP Confirmed ✓' : 'RSVP (Free)'}
                        </button>
                      ) : (
                        <Link
                          href="/events"
                          className="block text-center w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                        >
                          RSVP Details
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

      <footer className="py-6 text-center text-xs font-semibold text-slate-400 border-t border-slate-200 bg-white">
        {config.orgName} • {config.campusName}
      </footer>
    </div>
  );
}
