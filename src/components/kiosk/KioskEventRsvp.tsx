'use client';

import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Check, Sparkles } from 'lucide-react';
import { StudentProfile, AppEvent } from '@/lib/types';
import { useConfig } from '@/context/ConfigContext';
import { recordEventRsvp } from '@/lib/sheets';
import { getTodayDateString } from '@/lib/sandbox';

interface KioskEventRsvpProps {
  student: StudentProfile;
  events: AppEvent[];
}

export function KioskEventRsvp({ student, events }: KioskEventRsvpProps) {
  const { config } = useConfig();
  const [rsvpdEventIds, setRsvpdEventIds] = useState<Set<string>>(new Set());
  const [loadingEventId, setLoadingEventId] = useState<string | null>(null);

  const todayStr = getTodayDateString();
  const upcomingEvents = events.filter((e) => e.active && e.date >= todayStr);

  const handleRsvp = async (event: AppEvent) => {
    if (rsvpdEventIds.has(event.id) || loadingEventId) return;
    setLoadingEventId(event.id);
    try {
      const res = await recordEventRsvp(student, event, config);
      if (res.success) {
        setRsvpdEventIds((prev) => new Set([...Array.from(prev), event.id]));
      }
    } catch (err) {
      console.error('RSVP error:', err);
    } finally {
      setLoadingEventId(null);
    }
  };

  if (upcomingEvents.length === 0) {
    return (
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-left">
        <h3 className="font-extrabold text-slate-800 text-lg mb-2">Upcoming Events</h3>
        <p className="text-slate-400 text-sm">No upcoming events found on the schedule.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-left flex flex-col h-full">
      <div className="flex items-center space-x-2.5 mb-4 flex-shrink-0">
        <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-black text-slate-800 text-lg">Upcoming Events (Free RSVP)</h3>
          <p className="text-xs text-slate-500 font-semibold">Reserve your spot in advance</p>
        </div>
      </div>

      <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1 flex-1">
        {upcomingEvents.map((evt) => {
          const isRsvpd = rsvpdEventIds.has(evt.id);
          const isLoading = loadingEventId === evt.id;

          return (
            <div
              key={evt.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-slate-900 text-sm leading-snug">{evt.title}</span>
                  {evt.category && (
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0">
                      {evt.category}
                    </span>
                  )}
                </div>

                <div className="mt-2 space-y-1 text-xs text-slate-500 font-semibold">
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

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Free
                </span>
                <button
                  onClick={() => handleRsvp(evt)}
                  disabled={isRsvpd || isLoading}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                    isRsvpd
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-700 hover:bg-blue-800 text-white shadow-sm active:scale-95'
                  }`}
                >
                  {isRsvpd ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>RSVP Confirmed</span>
                    </>
                  ) : isLoading ? (
                    <span>Saving...</span>
                  ) : (
                    <span>RSVP Now</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
