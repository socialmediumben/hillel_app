import { StudentProfile, AppEvent, CheckInRecord, EventRsvpRecord } from './types';

// Get today's date formatted as YYYY-MM-DD
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getUpcomingDateString(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Clean empty starter defaults: no fake students or fake events
export const INITIAL_SANDBOX_STUDENTS: StudentProfile[] = [];
export const INITIAL_SANDBOX_EVENTS: AppEvent[] = [];

// LocalStorage Persistence Keys
const LS_STUDENTS_KEY = 'hillel_sandbox_students';
const LS_EVENTS_KEY = 'hillel_sandbox_events';
const LS_CHECKINS_KEY = 'hillel_sandbox_checkins';
const LS_RSVPS_KEY = 'hillel_sandbox_rsvps';

export function getSandboxStudents(): StudentProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    const cached = localStorage.getItem(LS_STUDENTS_KEY);
    if (cached) return JSON.parse(cached);
  } catch (_) {}
  return [];
}

export function saveSandboxStudents(students: StudentProfile[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_STUDENTS_KEY, JSON.stringify(students));
  } catch (_) {}
}

export function getSandboxEvents(): AppEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const cached = localStorage.getItem(LS_EVENTS_KEY);
    if (cached) return JSON.parse(cached);
  } catch (_) {}
  return [];
}

export function saveSandboxEvents(events: AppEvent[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_EVENTS_KEY, JSON.stringify(events));
  } catch (_) {}
}

export function getSandboxCheckIns(): CheckInRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const cached = localStorage.getItem(LS_CHECKINS_KEY);
    if (cached) return JSON.parse(cached);
  } catch (_) {}
  return [];
}

export function saveSandboxCheckIn(record: CheckInRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getSandboxCheckIns();
    current.unshift(record);
    localStorage.setItem(LS_CHECKINS_KEY, JSON.stringify(current));
  } catch (_) {}
}

export function getSandboxRsvps(): EventRsvpRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const cached = localStorage.getItem(LS_RSVPS_KEY);
    if (cached) return JSON.parse(cached);
  } catch (_) {}
  return [];
}

export function saveSandboxRsvp(record: EventRsvpRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getSandboxRsvps();
    const filtered = current.filter(
      (r) => !(r.studentId === record.studentId && r.eventId === record.eventId)
    );
    filtered.unshift(record);
    localStorage.setItem(LS_RSVPS_KEY, JSON.stringify(filtered));
  } catch (_) {}
}
