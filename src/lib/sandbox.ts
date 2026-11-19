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

// Clean empty starter defaults: absolutely no fake students or fake events
export const INITIAL_SANDBOX_STUDENTS: StudentProfile[] = [];
export const INITIAL_SANDBOX_EVENTS: AppEvent[] = [];

// LocalStorage Persistence Keys
const LS_STUDENTS_KEY = 'hillel_sandbox_students';
const LS_EVENTS_KEY = 'hillel_sandbox_events';
const LS_CHECKINS_KEY = 'hillel_sandbox_checkins';
const LS_RSVPS_KEY = 'hillel_sandbox_rsvps';

/**
 * Permanently purges any legacy demo/mock data that may have been cached
 * in the user's browser local storage from early versions.
 */
export function purgeLegacyTestData(): void {
  if (typeof window === 'undefined') return;
  try {
    const rawEvents = localStorage.getItem(LS_EVENTS_KEY);
    if (rawEvents && (
      rawEvents.includes('evt-shabbat') ||
      rawEvents.includes('evt-bagel') ||
      rawEvents.includes('evt-jlf') ||
      rawEvents.includes('evt-tikkun') ||
      rawEvents.includes('Community Shabbat Dinner') ||
      rawEvents.includes('Sunday Bagels & Schmear')
    )) {
      localStorage.removeItem(LS_EVENTS_KEY);
    }

    const rawStudents = localStorage.getItem(LS_STUDENTS_KEY);
    if (rawStudents && (
      rawStudents.includes('HIL-1001') ||
      rawStudents.includes('Jordan') ||
      rawStudents.includes('Taylor') ||
      rawStudents.includes('Sarah Levine')
    )) {
      localStorage.removeItem(LS_STUDENTS_KEY);
    }
  } catch (_) {}
}

export function getSandboxStudents(): StudentProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    purgeLegacyTestData();
    const cached = localStorage.getItem(LS_STUDENTS_KEY);
    if (cached) {
      const parsed: StudentProfile[] = JSON.parse(cached);
      return parsed.filter(
        (s) => s.id !== 'HIL-1001' && s.id !== 'HIL-1002' && s.id !== 'HIL-1003' && s.lastName !== 'Taylor' && s.lastName !== 'Levine'
      );
    }
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
    purgeLegacyTestData();
    const cached = localStorage.getItem(LS_EVENTS_KEY);
    if (cached) {
      const parsed: AppEvent[] = JSON.parse(cached);
      return parsed.filter(
        (e) => !e.id?.startsWith('evt-shabbat') &&
               !e.id?.startsWith('evt-bagel') &&
               !e.id?.startsWith('evt-jlf') &&
               !e.id?.startsWith('evt-tikkun') &&
               !e.id?.startsWith('evt-next-shabbat') &&
               e.title !== 'Community Shabbat Dinner' &&
               e.title !== 'Sunday Bagels & Schmear'
      );
    }
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

