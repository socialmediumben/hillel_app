'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Check, Filter, Sparkles, AlertCircle } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/context/AuthContext';
import { useConfig } from '@/context/ConfigContext';
import { AppEvent, isEventToday, isEventUpcomingOrToday } from '@/lib/types';
import { fetchEvents, recordEventRsvp } from '@/lib/sheets';
import { getTodayDateString } from '@/lib/sandbox';

export default function EventsPage() {
  const { student } = useAuth();
  const { config } = useConfig();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [rsvpdEventIds, setRsvpdEventIds] = useState<Set<string>>(new Set());
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const todayStr = getTodayDateString();

  useEffect(() => {
    fetchEvents(config)
      .then((data) => setEvents(data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [config]);

  const categories = ['All', 'Shabbat', 'Social', 'Learning', 'Tikkun Olam'];

  const filteredEvents = events.filter((e) => {
    if (!e.active) return false;
    if (selectedCategory === 'All') return true;
    return e.category && e.category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const handleRsvp = async (event: AppEvent) => {
    if (!student) {
      setFeedback('Please sign in to your student profile first to RSVP in one click!');
      return;
    }

    setLoadingId(event.id);
    setFeedback(null);

    try {
      const res = await recordEventRsvp(student, event, config);
      if (res.success) {
        setRsvpdEventIds((prev) => new Set([...Array.from(prev), event.id]));
        setFeedback(`You're confirmed for "${event.title}"! See you there.`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-black uppercase mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>App Events Calendar</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900">Upcoming Hillel Programs</h1>
            <p className="text-sm font-semibold text-slate-500">
              All events are completely free for students. Reserve your spot below!
            </p>
          </div>

          {!student && (
            <Link
              href="/profile"
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-2xl text-xs shadow-md transition-all self-start sm:self-auto"
            >
              Sign In to 1-Click RSVP
            </Link>
          )}
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div className="bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-2xl text-xs font-bold flex items-center justify-between">
            <span>{feedback}</span>
            <button onClick={() => setFeedback(null)} className="text-blue-500 hover:text-blue-700 font-extrabold ml-4">
              ✕
            </button>
          </div>
        )}

        {/* Category Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-blue-700 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center font-bold text-slate-400">
            Loading events from sheet...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700">No events found in this category</h3>
            <p className="text-xs text-slate-400 mt-1">Check back soon or pick another category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredEvents.map((evt) => {
              const isRsvpd = rsvpdEventIds.has(evt.id);
              const isToday = isEventToday(evt.date);
              const isPast = !isEventUpcomingOrToday(evt.date) && !isToday;

              return (
                <div
                  key={evt.id}
                  className={`bg-white rounded-3xl border p-6 shadow-sm flex flex-col justify-between transition-all ${
                    isToday ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {evt.category && (
                          <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                            {evt.category}
                          </span>
                        )}
                        {isToday && (
                          <span className="text-[11px] font-black uppercase text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full animate-pulse">
                            Happening Today!
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                        Free
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 mb-2 leading-snug">
                      {evt.title}
                    </h3>

                    {evt.description && (
                      <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">
                        {evt.description}
                      </p>
                    )}

                    <div className="space-y-1.5 text-xs text-slate-500 font-semibold mb-6">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{evt.date}</span>
                        {evt.startTime && <span>• {evt.startTime} {evt.endTime ? `- ${evt.endTime}` : ''}</span>}
                      </div>
                      {evt.location && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span>{evt.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold">
                      {isPast ? 'Past Event' : 'Open Registration'}
                    </span>

                    <button
                      onClick={() => handleRsvp(evt)}
                      disabled={isRsvpd || loadingId === evt.id || isPast}
                      className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer ${
                        isRsvpd
                          ? 'bg-emerald-100 text-emerald-800'
                          : isPast
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-blue-700 hover:bg-blue-800 text-white shadow-md active:scale-95'
                      }`}
                    >
                      {isRsvpd ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>You're Attending!</span>
                        </>
                      ) : loadingId === evt.id ? (
                        <span>Saving RSVP...</span>
                      ) : (
                        <span>RSVP (Free)</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
