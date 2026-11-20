import { StudentProfile, AppEvent, CheckInRecord, EventRsvpRecord, AppConfig, normalizeDate } from './types';
import {
  getSandboxStudents,
  saveSandboxStudents,
  getSandboxEvents,
  saveSandboxEvents,
  getSandboxCheckIns,
  saveSandboxCheckIn,
  getSandboxRsvps,
  saveSandboxRsvp,
  getTodayDateString,
} from './sandbox';
import { normalizeNfcTapCard } from './hardware';

export const DEFAULT_APPS_SCRIPT_URL =
  process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbyg3ZTZnTTq-KrVSyjxukEdp5lrkwGouTVY6w1sewMtk7_VVUmIQI3e35i2BM64scUG/exec';

export function getEffectiveAppsScriptUrl(config?: AppConfig): string {
  return (config && config.appsScriptUrl && config.appsScriptUrl.trim()) || DEFAULT_APPS_SCRIPT_URL;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

/**
 * Tests connection to Google Apps Script endpoint and verifies events tab
 */
export async function testSheetConnection(appsScriptUrl: string): Promise<{
  ok: boolean;
  message: string;
  sheetName?: string;
  eventCount?: number;
  eventTitles?: string[];
}> {
  if (!appsScriptUrl || !appsScriptUrl.trim()) {
    return { ok: false, message: 'Google Apps Script URL is empty.' };
  }
  try {
    const pingUrl = `${appsScriptUrl.trim()}${appsScriptUrl.includes('?') ? '&' : '?'}action=ping&t=${Date.now()}`;
    const res = await fetch(pingUrl);
    if (!res.ok) {
      return { ok: false, message: `HTTP Error: ${res.status} ${res.statusText}` };
    }
    const data = await res.json();
    if (data.status !== 'success') {
      return { ok: false, message: data.message || 'Error response from Google Apps Script.' };
    }

    // Also test event fetching directly
    let eventCount = 0;
    let eventTitles: string[] = [];
    try {
      const eventsUrl = `${appsScriptUrl.trim()}${appsScriptUrl.includes('?') ? '&' : '?'}action=get_events&t=${Date.now()}`;
      const evRes = await fetch(eventsUrl);
      if (evRes.ok) {
        const evData = await evRes.json();
        if (evData.status === 'success' && Array.isArray(evData.events)) {
          eventCount = evData.events.length;
          eventTitles = evData.events.map((e: any) => e.title).filter(Boolean);
        }
      }
    } catch (_) {}

    return {
      ok: true,
      message: eventCount > 0
        ? `Connected to "${data.sheetName || 'Sheet'}"! Found ${eventCount} event(s): ${eventTitles.slice(0, 3).join(', ')}${eventTitles.length > 3 ? '...' : ''}`
        : `Connected to "${data.sheetName || 'Sheet'}", but 0 events found in 'App Events' tab.`,
      sheetName: data.sheetName,
      eventCount,
      eventTitles,
    };
  } catch (err: any) {
    return { ok: false, message: err.message || 'Network request failed.' };
  }
}

/**
 * Fetch events directly from Google Sheet 'App Events' tab
 */
export async function fetchEvents(config: AppConfig): Promise<AppEvent[]> {
  if (config.isSandbox) {
    return getSandboxEvents();
  }

  const effectiveUrl = getEffectiveAppsScriptUrl(config);
  if (!effectiveUrl) {
    return [];
  }

  try {
    const url = `${effectiveUrl}${effectiveUrl.includes('?') ? '&' : '?'}action=get_events&t=${Date.now()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status === 'success' && Array.isArray(data.events)) {
      return data.events.map((e: any) => {
        let title = e.title;
        let date = e.date;
        let startTime = e.startTime;

        // If title looks like a Date string (e.g. "Thu Dec 03 2026 ...") and id looks like an event title (e.g. "Event 1", "Shabbat")
        const titleIsDate = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/i.test(String(e.title || '').trim());
        if (titleIsDate && e.id && !/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i.test(String(e.id))) {
          date = e.title;
          title = e.id;
        }

        // If date is "1899-12-30" (Excel/Sheets time placeholder), try pulling from title if title was date
        if (date === '1899-12-30' && titleIsDate) {
          date = e.title;
        }

        // Clean up startTime if it has "Sat Dec 30 1899 18:00:00..."
        if (typeof startTime === 'string' && startTime.includes('1899')) {
          const matchTime = startTime.match(/(\d{2}:\d{2})/);
          if (matchTime) {
            const [h, m] = matchTime[1].split(':').map(Number);
            const period = h >= 12 ? 'PM' : 'AM';
            const displayH = h % 12 || 12;
            startTime = `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
          }
        }

        return {
          ...e,
          title: title || e.title,
          date: normalizeDate(date),
          startTime: startTime || e.startTime,
          active: true,
        };
      });
    }
    return [];
  } catch (err) {
    console.warn('Error fetching events from Google Apps Script:', err);
    return [];
  }
}

/**
 * Search students directly from Google Sheet 'Students_Directory' tab
 */
export async function searchStudents(query: string, config: AppConfig): Promise<StudentProfile[]> {
  const cleanQ = query.trim().toLowerCase();

  if (config.isSandbox) {
    const all = getSandboxStudents();
    if (!cleanQ) return all;
    return all.filter((s) => {
      const matchName = `${s.firstName} ${s.lastName}`.toLowerCase().includes(cleanQ) ||
        (s.preferredName && s.preferredName.toLowerCase().includes(cleanQ));
      const matchCard = s.tapCard ? normalizeNfcTapCard(s.tapCard).toLowerCase() === cleanQ : false;
      const matchEmail = s.email ? s.email.toLowerCase().includes(cleanQ) : false;
      const matchId = s.id.toLowerCase().includes(cleanQ);
      return matchName || matchCard || matchEmail || matchId;
    });
  }

  const effectiveUrl = getEffectiveAppsScriptUrl(config);
  if (!effectiveUrl) {
    return [];
  }

  try {
    const url = `${effectiveUrl}${effectiveUrl.includes('?') ? '&' : '?'}action=get_students&query=${encodeURIComponent(cleanQ)}&t=${Date.now()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status === 'success' && Array.isArray(data.students)) {
      return data.students;
    }
    return [];
  } catch (err) {
    console.warn('Error searching students from Google Apps Script:', err);
    return [];
  }
}

/**
 * Find student by Tap Card ID
 */
export async function getStudentByCard(cardId: string, config: AppConfig): Promise<StudentProfile | null> {
  const norm = normalizeNfcTapCard(cardId).toLowerCase();
  const results = await searchStudents(norm, config);
  const exact = results.find((s) => s.tapCard && normalizeNfcTapCard(s.tapCard).toLowerCase() === norm);
  return exact || results[0] || null;
}

/**
 * Record Check-In to today's event or general visit
 */
export async function recordCheckIn(
  student: StudentProfile,
  event: { id: string; title: string },
  stationId: string,
  config: AppConfig
): Promise<{ success: boolean; checkInId?: string; error?: string }> {
  const checkInRecord: CheckInRecord = {
    id: `chk_${Date.now()}`,
    timestamp: new Date().toISOString(),
    date: getTodayDateString(),
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`.trim(),
    tapCard: student.tapCard,
    eventId: event.id,
    eventName: event.title,
    stationId,
    email: student.email || '',
    phone: student.phone || '',
    classYear: student.classYear || '',
    major: student.major || '',
    dietaryRestrictions: Array.isArray(student.dietaryRestrictions) ? student.dietaryRestrictions.join(', ') : '',
    interests: Array.isArray(student.interests) ? student.interests.join(', ') : '',
  };

  const effectiveUrl = getEffectiveAppsScriptUrl(config);
  if (!effectiveUrl) {
    saveSandboxCheckIn(checkInRecord);
    return { success: true, checkInId: checkInRecord.id };
  }

  try {
    const res = await fetch(effectiveUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'checkin',
        studentId: student.id,
        studentName: checkInRecord.studentName,
        tapCard: student.tapCard || '',
        eventId: event.id,
        eventName: event.title,
        stationId,
        email: student.email || '',
        phone: student.phone || '',
        classYear: student.classYear || '',
        major: student.major || '',
        dietaryRestrictions: checkInRecord.dietaryRestrictions,
        interests: checkInRecord.interests,
        checkInFields: config.checkInFields,
      }),
    });
    const data = await res.json();
    if (data.status === 'success') {
      saveSandboxCheckIn(checkInRecord);
      return { success: true, checkInId: data.checkInId || checkInRecord.id };
    }
    return { success: false, error: data.message || 'Check-in failed' };
  } catch (err: any) {
    console.warn('Network error recording check-in, saving locally to cache:', err);
    saveSandboxCheckIn(checkInRecord);
    return { success: true, checkInId: checkInRecord.id };
  }
}

/**
 * Record RSVP for an event
 */
export async function recordEventRsvp(
  student: StudentProfile,
  event: AppEvent,
  config: AppConfig
): Promise<{ success: boolean; rsvpId?: string; error?: string }> {
  const rsvpRecord: EventRsvpRecord = {
    id: `rsvp_${Date.now()}`,
    timestamp: new Date().toISOString(),
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`.trim(),
    email: student.email,
    eventId: event.id,
    eventName: event.title,
    status: 'Confirmed',
  };

  const effectiveUrl = getEffectiveAppsScriptUrl(config);
  if (!effectiveUrl) {
    saveSandboxRsvp(rsvpRecord);
    return { success: true, rsvpId: rsvpRecord.id };
  }

  try {
    const res = await fetch(effectiveUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'rsvp',
        studentId: student.id,
        studentName: rsvpRecord.studentName,
        email: student.email || '',
        eventId: event.id,
        eventName: event.title,
        status: 'Confirmed',
      }),
    });
    const data = await res.json();
    if (data.status === 'success') {
      saveSandboxRsvp(rsvpRecord);
      return { success: true, rsvpId: data.rsvpId || rsvpRecord.id };
    }
    return { success: false, error: data.message || 'RSVP failed' };
  } catch (err: any) {
    console.warn('Network error registering RSVP, saving locally to cache:', err);
    saveSandboxRsvp(rsvpRecord);
    return { success: true, rsvpId: rsvpRecord.id };
  }
}

/**
 * First-Time Student Sign-Up
 */
export async function createStudent(
  newStudentData: Omit<StudentProfile, 'id' | 'createdAt'>,
  config: AppConfig
): Promise<{ success: boolean; student?: StudentProfile; error?: string }> {
  const tempId = `HIL-${1000 + Math.floor(Math.random() * 9000)}`;
  const fullStudent: StudentProfile = {
    ...newStudentData,
    id: tempId,
    createdAt: new Date().toISOString(),
  };

  const effectiveUrl = getEffectiveAppsScriptUrl(config);
  if (!effectiveUrl) {
    const current = getSandboxStudents();
    current.push(fullStudent);
    saveSandboxStudents(current);
    return { success: true, student: fullStudent };
  }

  try {
    const res = await fetch(effectiveUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'create_student',
        ...newStudentData,
      }),
    });
    const data = await res.json();
    if (data.status === 'success' && data.student) {
      const current = getSandboxStudents();
      current.push(data.student);
      saveSandboxStudents(current);
      return { success: true, student: data.student };
    }
    return { success: false, error: data.message || 'Failed to create student' };
  } catch (err: any) {
    console.warn('Network error creating student, saving locally:', err);
    const current = getSandboxStudents();
    current.push(fullStudent);
    saveSandboxStudents(current);
    return { success: true, student: fullStudent };
  }
}

/**
 * Update Student Profile
 */
export async function updateStudentProfile(
  student: StudentProfile,
  config: AppConfig
): Promise<{ success: boolean; error?: string }> {
  const effectiveUrl = getEffectiveAppsScriptUrl(config);
  if (!effectiveUrl) {
    const current = getSandboxStudents();
    const idx = current.findIndex((s) => s.id === student.id);
    if (idx >= 0) {
      current[idx] = student;
      saveSandboxStudents(current);
    }
    return { success: true };
  }

  try {
    const res = await fetch(effectiveUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'update_student',
        ...student,
      }),
    });
    const data = await res.json();
    if (data.status === 'success') {
      const current = getSandboxStudents();
      const idx = current.findIndex((s) => s.id === student.id);
      if (idx >= 0) {
        current[idx] = student;
        saveSandboxStudents(current);
      }
      return { success: true };
    }
    return { success: false, error: data.message || 'Failed to update student profile' };
  } catch (err: any) {
    console.warn('Network error updating student profile, saving locally:', err);
    const current = getSandboxStudents();
    const idx = current.findIndex((s) => s.id === student.id);
    if (idx >= 0) {
      current[idx] = student;
      saveSandboxStudents(current);
    }
    return { success: true };
  }
}

/**
 * Link / Update Tap Card
 */
export async function linkCardToStudent(
  studentId: string,
  tapCard: string,
  config: AppConfig
): Promise<{ success: boolean; error?: string }> {
  const norm = normalizeNfcTapCard(tapCard);

  const effectiveUrl = getEffectiveAppsScriptUrl(config);
  if (!effectiveUrl) {
    const current = getSandboxStudents();
    const student = current.find((s) => s.id === studentId);
    if (student) {
      student.tapCard = norm;
      saveSandboxStudents(current);
      return { success: true };
    }
    return { success: false, error: 'Student not found.' };
  }

  try {
    const res = await fetch(effectiveUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'link_card',
        contactId: studentId,
        tapCard: norm,
      }),
    });
    const data = await res.json();
    if (data.status === 'success') {
      const current = getSandboxStudents();
      const student = current.find((s) => s.id === studentId);
      if (student) {
        student.tapCard = norm;
        saveSandboxStudents(current);
      }
      return { success: true };
    }
    return { success: false, error: data.message || 'Failed to link card' };
  } catch (err: any) {
    console.warn('Network error linking card, saving locally:', err);
    const current = getSandboxStudents();
    const student = current.find((s) => s.id === studentId);
    if (student) {
      student.tapCard = norm;
      saveSandboxStudents(current);
    }
    return { success: true };
  }
}

/**
 * Fetches remote app configuration from Google Sheet 'App_Config' tab
 */
export async function fetchRemoteConfig(config: AppConfig): Promise<Record<string, any> | null> {
  const effectiveUrl = getEffectiveAppsScriptUrl(config);
  if (!effectiveUrl) return null;
  try {
    const url = `${effectiveUrl}${effectiveUrl.includes('?') ? '&' : '?'}action=get_config&t=${Date.now()}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 'success' && data.config) {
      return data.config;
    }
  } catch (err) {
    console.warn('Could not fetch remote config:', err);
  }
  return null;
}

/**
 * Saves configuration to Google Sheet 'App_Config' tab
 */
export async function saveRemoteConfig(
  config: AppConfig,
  remoteConfig: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  const effectiveUrl = getEffectiveAppsScriptUrl(config);
  if (!effectiveUrl) return { success: false, error: 'No Apps Script URL configured.' };
  try {
    const res = await fetch(effectiveUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'save_config',
        config: remoteConfig,
      }),
    });
    const data = await res.json();
    if (data.status === 'success') {
      return { success: true };
    }
    return { success: false, error: data.message || 'Failed to save config.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error saving config.' };
  }
}
