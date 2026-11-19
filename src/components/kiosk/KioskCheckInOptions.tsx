'use client';

import React, { useState } from 'react';
import { CheckCircle2, Calendar, Clock, MapPin } from 'lucide-react';
import { StudentProfile, AppEvent } from '@/lib/types';
import { useConfig } from '@/context/ConfigContext';
import { recordCheckIn } from '@/lib/sheets';
import { getTodayDateString } from '@/lib/sandbox';

interface KioskCheckInOptionsProps {
  student: StudentProfile;
  events: AppEvent[];
  onCheckedIn?: (eventName: string) => void;
}

export function KioskCheckInOptions({ student, events, onCheckedIn }: KioskCheckInOptionsProps) {
  const { config } = useConfig();
  const [checkedInEvents, setCheckedInEvents] = useState<Set<string>>(new Set());
  const [loadingEventId, setLoadingEventId] = useState<string | null>(null);

  const todayStr = getTodayDateString();
  const todaysEvents = events.filter((e) => e.active && e.date === todayStr);

  const handleCheckIn = async (eventId: string, eventTitle: string) => {
    if (checkedInEvents.has(eventId) || loadingEventId) return;
    setLoadingEventId(eventId);
    try {
      const res = await recordCheckIn(student, { id: eventId, title: eventTitle }, config.stationId, config);
      if (res.success) {
        setCheckedInEvents((prev) => new Set([...Array.from(prev), eventId]));
        if (onCheckedIn) onCheckedIn(eventTitle);
      }
    } catch (err) {
      console.error('Check-in error:', err);
    } finally {
      setLoadingEventId(null);
    }
  };

  return (
    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-left">
      <div className="flex items-center space-x-2.5 mb-4">
        <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800">Check-In Options</h2>
          <p className="text-xs text-slate-500 font-semibold">Select what you are attending today</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {todaysEvents.map((evt) => {
          const isDone = checkedInEvents.has(evt.id);
          const isLoading = loadingEventId === evt.id;

          return (
            <button
              key={evt.id}
              onClick={() => handleCheckIn(evt.id, evt.title)}
              disabled={isDone || isLoading}
              className={`p-4 rounded-2xl text-left border-2 transition-all flex flex-col justify-between cursor-pointer ${
                isDone
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-sm'
                  : 'bg-white hover:bg-blue-50 border-slate-200 hover:border-blue-400 text-slate-900 shadow-sm active:scale-98'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="font-extrabold text-base leading-snug">{evt.title}</span>
                  {isDone && <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 ml-2" />}
                </div>

                {(evt.startTime || evt.location) && (
                  <div className="mt-2 space-y-1 text-xs font-semibold text-slate-500">
                    {evt.startTime && (
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{evt.startTime} {evt.endTime ? `- ${evt.endTime}` : ''}</span>
                      </div>
                    )}
                    {evt.location && (
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{evt.location}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <span className={isDone ? 'text-emerald-700 font-extrabold' : 'text-blue-600'}>
                  {isDone ? 'Checked In! ✅' : isLoading ? 'Checking in...' : 'Check In →'}
                </span>
                {evt.category && (
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">
                    {evt.category}
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {/* General Lounge / Visit Option */}
        <button
          onClick={() => handleCheckIn('general_visit', 'General Visit & Study Lounge')}
          disabled={checkedInEvents.has('general_visit') || loadingEventId === 'general_visit'}
          className={`p-4 rounded-2xl text-left border-2 transition-all flex flex-col justify-between cursor-pointer ${
            checkedInEvents.has('general_visit')
              ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-sm'
              : 'bg-white hover:bg-blue-50 border-slate-200 hover:border-blue-400 text-slate-900 shadow-sm active:scale-98'
          }`}
        >
          <div>
            <div className="flex items-start justify-between">
              <span className="font-extrabold text-base leading-snug">General Visit & Study Lounge</span>
              {checkedInEvents.has('general_visit') && (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 ml-2" />
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500 font-semibold">
              Studying, hanging out with friends, meeting with staff, or grabbing coffee.
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 text-xs font-bold">
            <span className={checkedInEvents.has('general_visit') ? 'text-emerald-700 font-extrabold' : 'text-blue-600'}>
              {checkedInEvents.has('general_visit') ? 'Checked In! ✅' : 'Check In →'}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
