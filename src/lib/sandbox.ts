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

const todayStr = getTodayDateString();

export const INITIAL_SANDBOX_STUDENTS: StudentProfile[] = [
  {
    id: 'HIL-1001',
    tapCard: '1414309466',
    firstName: 'Jordan',
    lastName: 'Taylor',
    preferredName: 'Jordan',
    pronouns: 'they/them',
    email: 'jordan.taylor@campus.edu',
    phone: '(555) 234-5678',
    classYear: '2026',
    major: 'Computer Science',
    dietaryRestrictions: ['Vegetarian', 'Kosher-style'],
    interests: ['Shabbat & Holidays', 'Social Action / Tikkun Olam', 'Bagel Brunches'],
    createdAt: '2026-09-01T12:00:00Z',
  },
  {
    id: 'HIL-1002',
    tapCard: '2525309876',
    firstName: 'Sarah',
    lastName: 'Levine',
    preferredName: 'Sari',
    pronouns: 'she/her',
    email: 'sarah.levine@campus.edu',
    phone: '(555) 876-5432',
    classYear: '2025',
    major: 'Biology & Pre-Med',
    dietaryRestrictions: ['Strictly Kosher', 'Gluten-Free'],
    interests: ['Leadership Council', 'Jewish Learning Fellowship (JLF)', 'Shabbat & Holidays'],
    createdAt: '2026-08-20T10:30:00Z',
  },
  {
    id: 'HIL-1003',
    tapCard: '3636401234',
    firstName: 'Noah',
    lastName: 'Cohen',
    preferredName: 'Noah',
    pronouns: 'he/him',
    email: 'noah.cohen@campus.edu',
    phone: '(555) 456-7890',
    classYear: '2027',
    major: 'Business Administration',
    dietaryRestrictions: ['No Restrictions'],
    interests: ['Intramural Sports', 'Social Events', 'Challah Baking'],
    createdAt: '2026-09-10T14:15:00Z',
  },
];

export const INITIAL_SANDBOX_EVENTS: AppEvent[] = [
  {
    id: 'evt-shabbat-today',
    title: 'Community Shabbat Dinner',
    date: todayStr,
    startTime: '6:30 PM',
    endTime: '9:00 PM',
    location: 'Hillel Dining Hall',
    description: 'Welcoming Shabbat with candle lighting, songs, warm homemade challah, and a four-course dinner. All students welcome!',
    category: 'Shabbat',
    active: true,
  },
  {
    id: 'evt-bagel-today',
    title: 'Sunday Bagels & Schmear',
    date: todayStr,
    startTime: '11:00 AM',
    endTime: '1:00 PM',
    location: 'Hillel Student Lounge',
    description: 'Fresh hot bagels, cream cheese, lox, fresh fruit, hot coffee, and chill study vibes before the week kicks off.',
    category: 'Social',
    active: true,
  },
  {
    id: 'evt-jlf-upcoming',
    title: 'Jewish Learning Fellowship (JLF) Cohort',
    date: getUpcomingDateString(3),
    startTime: '5:30 PM',
    endTime: '7:00 PM',
    location: 'Library Conference Room',
    description: 'Weekly text study, discussion, dinner, and stipend for participating fellows.',
    category: 'Learning',
    active: true,
  },
  {
    id: 'evt-tikkun-upcoming',
    title: 'Community Food Drive & Sandwich Making',
    date: getUpcomingDateString(5),
    startTime: '2:00 PM',
    endTime: '4:00 PM',
    location: 'Hillel Kitchen',
    description: 'Packing meals and essentials for the local campus food pantry.',
    category: 'Tikkun Olam',
    active: true,
  },
  {
    id: 'evt-next-shabbat',
    title: 'Next Week: Musical Shabbat',
    date: getUpcomingDateString(7),
    startTime: '7:00 PM',
    endTime: '9:30 PM',
    location: 'Hillel Sanctuary & Terrace',
    description: 'Acoustic musical Kabbalat Shabbat followed by a Mediterranean feast.',
    category: 'Shabbat',
    active: true,
  },
];

// LocalStorage Persistence Keys
const LS_STUDENTS_KEY = 'hillel_sandbox_students';
const LS_EVENTS_KEY = 'hillel_sandbox_events';
const LS_CHECKINS_KEY = 'hillel_sandbox_checkins';
const LS_RSVPS_KEY = 'hillel_sandbox_rsvps';

export function getSandboxStudents(): StudentProfile[] {
  if (typeof window === 'undefined') return INITIAL_SANDBOX_STUDENTS;
  try {
    const cached = localStorage.getItem(LS_STUDENTS_KEY);
    if (cached) return JSON.parse(cached);
  } catch (_) {}
  saveSandboxStudents(INITIAL_SANDBOX_STUDENTS);
  return INITIAL_SANDBOX_STUDENTS;
}

export function saveSandboxStudents(students: StudentProfile[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_STUDENTS_KEY, JSON.stringify(students));
  } catch (_) {}
}

export function getSandboxEvents(): AppEvent[] {
  if (typeof window === 'undefined') return INITIAL_SANDBOX_EVENTS;
  try {
    const cached = localStorage.getItem(LS_EVENTS_KEY);
    if (cached) return JSON.parse(cached);
  } catch (_) {}
  saveSandboxEvents(INITIAL_SANDBOX_EVENTS);
  return INITIAL_SANDBOX_EVENTS;
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
    // remove any prior rsvp for this student and event
    const filtered = current.filter(
      (r) => !(r.studentId === record.studentId && r.eventId === record.eventId)
    );
    filtered.unshift(record);
    localStorage.setItem(LS_RSVPS_KEY, JSON.stringify(filtered));
  } catch (_) {}
}
