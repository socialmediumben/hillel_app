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
  customFields?: Record<string, any>;
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
  [key: string]: any;
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

export interface RegistrationFieldConfig {
  id: string;               // Unique key (e.g. 'firstName', 'phone', 'custom_instagram')
  label: string;            // Human-readable label (e.g. 'Phone Number')
  placeholder?: string;     // Helper text (e.g. '(555) 000-0000')
  type: 'text' | 'email' | 'tel' | 'select' | 'multiselect';
  enabled: boolean;         // Whether this field is visible on the registration form
  required: boolean;        // Whether form validation requires this field
  options?: string[];       // Tag chips or dropdown options for select/multiselect
  isCustom?: boolean;       // User-created custom field
}

export interface CheckInFieldConfig {
  key: string;              // Key in data payload (e.g. 'studentName', 'tapCard', 'email', 'classYear')
  columnHeader: string;     // Column header in Google Sheet (e.g. 'Student_Name', 'Tap_Card_ID', 'Email')
  enabled: boolean;         // Included in the check-in post payload
  description: string;      // Admin explanation (e.g. 'Full name of the student checking in')
}

export const DEFAULT_DIETARY_OPTIONS: string[] = [
  'Strictly Kosher',
  'Kosher-style',
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Nut Allergy',
  'Dairy-Free',
  'No Restrictions',
];

export const DEFAULT_INTEREST_OPTIONS: string[] = [
  'Shabbat & Holidays',
  'Bagel Brunches',
  'Social Action / Tikkun Olam',
  'Jewish Learning Fellowship (JLF)',
  'Leadership & Committees',
  'Challah Baking',
  'Greek Life / Chavurot',
  'Arts & Jewish Culture',
  'Career & Networking',
];

export const DEFAULT_REGISTRATION_FIELDS: RegistrationFieldConfig[] = [
  { id: 'firstName', label: 'First Name', placeholder: 'e.g. Sarah', type: 'text', enabled: true, required: true },
  { id: 'lastName', label: 'Last Name', placeholder: 'e.g. Cohen', type: 'text', enabled: true, required: true },
  { id: 'preferredName', label: 'Preferred Name', placeholder: 'Name for greeting & nametag', type: 'text', enabled: true, required: false },
  { id: 'pronouns', label: 'Pronouns', placeholder: 'e.g. she/her, they/them', type: 'text', enabled: true, required: false },
  { id: 'email', label: 'Email Address', placeholder: 'student@campus.edu', type: 'email', enabled: true, required: true },
  { id: 'phone', label: 'Phone Number', placeholder: '(555) 000-0000', type: 'tel', enabled: true, required: false },
  { id: 'classYear', label: 'Graduation Year', placeholder: 'e.g. 2027', type: 'text', enabled: true, required: false },
  { id: 'major', label: 'Major / Field of Study', placeholder: 'e.g. Psychology or Biology', type: 'text', enabled: true, required: false },
  { id: 'dietary', label: 'Dietary Restrictions & Kosher Needs', type: 'multiselect', enabled: true, required: false, options: DEFAULT_DIETARY_OPTIONS },
  { id: 'interests', label: 'Interests & Hillel Programs', type: 'multiselect', enabled: true, required: false, options: DEFAULT_INTEREST_OPTIONS },
];

export const DEFAULT_CHECKIN_FIELDS: CheckInFieldConfig[] = [
  { key: 'checkInId', columnHeader: 'CheckIn_ID', enabled: true, description: 'Unique check-in receipt ID' },
  { key: 'timestamp', columnHeader: 'Timestamp', enabled: true, description: 'ISO Date & Time of check-in' },
  { key: 'date', columnHeader: 'Date', enabled: true, description: 'Calendar date (YYYY-MM-DD)' },
  { key: 'studentId', columnHeader: 'Contact_ID', enabled: true, description: 'Student identifier' },
  { key: 'studentName', columnHeader: 'Student_Name', enabled: true, description: 'Full name of the student' },
  { key: 'tapCard', columnHeader: 'Tap_Card_ID', enabled: true, description: 'NFC card UID / badge ID' },
  { key: 'eventId', columnHeader: 'Event_ID', enabled: true, description: 'Event identifier or general_visit' },
  { key: 'eventName', columnHeader: 'Event_Name', enabled: true, description: 'Name of the event attended' },
  { key: 'stationId', columnHeader: 'Station_ID', enabled: true, description: 'Kiosk or mobile station ID' },
  { key: 'email', columnHeader: 'Email', enabled: false, description: 'Student email address' },
  { key: 'phone', columnHeader: 'Phone', enabled: false, description: 'Student phone number' },
  { key: 'classYear', columnHeader: 'Class_Year', enabled: false, description: 'Student graduation class year' },
  { key: 'major', columnHeader: 'Major', enabled: false, description: 'Student major or department' },
  { key: 'dietaryRestrictions', columnHeader: 'Dietary_Restrictions', enabled: false, description: 'Known dietary restrictions' },
  { key: 'interests', columnHeader: 'Interests', enabled: false, description: 'Student interests & programs' },
];

export interface AppConfig {
  orgName: string;
  campusName: string;
  logoUrl?: string;
  primaryColor: string;
  sheetId: string;
  appsScriptUrl: string;
  isSandbox: boolean;
  stationId: string;
  registrationFields: RegistrationFieldConfig[];
  checkInFields: CheckInFieldConfig[];
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
