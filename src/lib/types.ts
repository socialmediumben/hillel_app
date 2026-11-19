export interface StudentProfile {
  id: string; // Contact_ID
  tapCard?: string; // Tap_Card_ID
  firstName: string;
  lastName: string;
  preferredName?: string;
  pronouns?: string;
  email: string;
  phone?: string;
  classYear?: string;
  major?: string;
  dietaryRestrictions?: string[];
  interests?: string[];
  createdAt?: string;
}

export interface AppEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  location?: string;
  description?: string;
  category?: string;
  active: boolean;
}

export interface CheckInRecord {
  id: string;
  timestamp: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  studentName: string;
  tapCard?: string;
  eventId: string;
  eventName: string;
  stationId?: string;
}

export interface EventRsvpRecord {
  id: string;
  timestamp: string;
  studentId: string;
  studentName: string;
  email?: string;
  eventId: string;
  eventName: string;
  status: 'Confirmed' | 'Cancelled';
}

export interface AppConfig {
  orgName: string;
  campusName: string;
  logoUrl?: string;
  primaryColor: string;
  sheetId: string;
  appsScriptUrl: string;
  isSandbox: boolean;
  stationId: string;
}

/**
 * Returns the name to use when greeting the student, prioritizing Preferred Name
 */
export function getStudentDisplayName(student: StudentProfile | null | undefined): string {
  if (!student) return 'Student';
  if (student.preferredName && student.preferredName.trim()) {
    return student.preferredName.trim();
  }
  if (student.firstName && student.firstName.trim()) {
    return student.firstName.trim();
  }
  return `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student';
}

/**
 * Normalizes an array or comma-separated string of tags
 */
export function normalizeTagList(input: string[] | string | undefined | null): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter(Boolean).map((s) => s.trim());
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Normalizes any date format (YYYY-MM-DD, MM/DD/YYYY, M/D/YYYY, Date object)
 * into a standardized YYYY-MM-DD string for dependable comparisons.
 */
export function normalizeDate(raw: any): string {
  if (!raw) return '';
  if (raw instanceof Date) {
    const y = raw.getFullYear();
    const m = String(raw.getMonth() + 1).padStart(2, '0');
    const d = String(raw.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(raw).trim();
  const m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const mm = m[1].padStart(2, '0');
    const dd = m[2].padStart(2, '0');
    return `${m[3]}-${mm}-${dd}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }
  return str;
}

export function isSameDay(date1: any, date2: any): boolean {
  return normalizeDate(date1) === normalizeDate(date2);
}

export function isEventToday(eventDate: any): boolean {
  return isSameDay(eventDate, new Date());
}

export function isEventUpcomingOrToday(eventDate: any): boolean {
  const normEvent = normalizeDate(eventDate);
  const normToday = normalizeDate(new Date());
  return normEvent >= normToday;
}
