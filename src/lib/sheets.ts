import { StudentProfile, AppEvent, CheckInRecord, EventRsvpRecord, AppConfig } from './types';
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

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

/**
 * Tests connection to Google Apps Script endpoint
 */
export async function testSheetConnection(appsScriptUrl: string): Promise<{ ok: boolean; message: string; sheetName?: string }> {
  if (!appsScriptUrl || !appsScriptUrl.trim()) {
    return { ok: false, message: 'Google Apps Script URL is empty.' };
  }
  try {
    const url = `${appsScriptUrl.trim()}${appsScriptUrl.includes('?') ? '&' : '?'}action=ping&t=${Date.now()}`;
    const res = await fetch(url);
    if (!res.ok) {
      return { ok: false, message: `HTTP Error: ${res.status} ${res.statusText}` };
    }
    const data = await res.json();
    if (data.status === 'success') {
      return { ok: true, message: data.message || 'Connected successfully!', sheetName: data.sheetName };
    }
    return { ok: false, message: data.message || 'Error response from Google Apps Script.' };
  } catch (err: any) {
    return { ok: false, message: err.message || 'Network request failed.' };
  }
}

/**
 * Fetch events from Google Sheet or Sandbox
 */
export async function fetchEvents(config: AppConfig): Promise<AppEvent[]> {
  if (config.isSandbox || !config.appsScriptUrl) {
    return getSandboxEvents();
  }

  try {
    const url = `${config.appsScriptUrl}${config.appsScriptUrl.includes('?') ? '&' : '?'}action=get_events&t=${Date.now()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status === 'success' && Array.isArray(data.events)) {
      return data.events;
    }
    return getSandboxEvents();
  } catch (err) {
    console.warn('Failed to fetch events from Google Apps Script, falling back to cached/sandbox events:', err);
    return getSandboxEvents();
  }
}

/**
 * Search students from Google Sheet or Sandbox
 */
export async function searchStudents(query: string, config: AppConfig): Promise<StudentProfile[]> {
  const cleanQ = query.trim().toLowerCase();

  if (config.isSandbox || !config.appsScriptUrl) {
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

  try {
    const url = `${config.appsScriptUrl}${config.appsScriptUrl.includes('?') ? '&' : '?'}action=get_students&query=${encodeURIComponent(cleanQ)}&t=${Date.now()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status === 'success' && Array.isArray(data.students)) {
      return data.students;
    }
    return [];
  } catch (err) {
    console.warn('Failed to search students from Google Apps Script, falling back to sandbox:', err);
    return searchStudents(cleanQ, { ...config, isSandbox: true });
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
  };

  if (config.isSandbox || !config.appsScriptUrl) {
    saveSandboxCheckIn(checkInRecord);
    return { success: true, checkInId: checkInRecord.id };
  }

  try {
    const res = await fetch(config.appsScriptUrl, {
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
      }),
    });
    const data = await res.json();
    if (data.status === 'success') {
      saveSandboxCheckIn(checkInRecord); // local mirror
      return { success: true, checkInId: data.checkInId || checkInRecord.id };
    }
    return { success: false, error: data.message || 'Check-in failed' };
  } catch (err: any) {
    console.warn('Network error recording check-in, saving locally to sandbox cache:', err);
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

  if (config.isSandbox || !config.appsScriptUrl) {
    saveSandboxRsvp(rsvpRecord);
    return { success: true, rsvpId: rsvpRecord.id };
  }

  try {
    const res = await fetch(config.appsScriptUrl, {
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
    console.warn('Network error registering RSVP, saving locally to sandbox cache:', err);
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

  if (config.isSandbox || !config.appsScriptUrl) {
    const current = getSandboxStudents();
    current.push(fullStudent);
    saveSandboxStudents(current);
    return { success: true, student: fullStudent };
  }

  try {
    const res = await fetch(config.appsScriptUrl, {
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
    console.warn('Network error creating student, saving locally to sandbox:', err);
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
  if (config.isSandbox || !config.appsScriptUrl) {
    const current = getSandboxStudents();
    const idx = current.findIndex((s) => s.id === student.id);
    if (idx >= 0) {
      current[idx] = student;
      saveSandboxStudents(current);
    }
    return { success: true };
  }

  try {
    const res = await fetch(config.appsScriptUrl, {
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
    console.warn('Network error updating student profile, saving locally to sandbox:', err);
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

  if (config.isSandbox || !config.appsScriptUrl) {
    const current = getSandboxStudents();
    const student = current.find((s) => s.id === studentId);
    if (student) {
      student.tapCard = norm;
      saveSandboxStudents(current);
      return { success: true };
    }
    return { success: false, error: 'Student not found in sandbox.' };
  }

  try {
    const res = await fetch(config.appsScriptUrl, {
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
    console.warn('Network error linking card, saving locally to sandbox:', err);
    const current = getSandboxStudents();
    const student = current.find((s) => s.id === studentId);
    if (student) {
      student.tapCard = norm;
      saveSandboxStudents(current);
    }
    return { success: true };
  }
}
