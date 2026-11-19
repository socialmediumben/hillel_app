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
