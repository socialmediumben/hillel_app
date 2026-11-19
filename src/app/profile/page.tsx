'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Mail, Phone, Calendar, BookOpen, Utensils, Sparkles, CheckCircle2, AlertCircle, RefreshCw, LogOut, QrCode } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/context/AuthContext';
import { useConfig } from '@/context/ConfigContext';
import { StudentProfile, getStudentDisplayName } from '@/lib/types';
import { searchStudents, createStudent } from '@/lib/sheets';
import { INITIAL_SANDBOX_STUDENTS } from '@/lib/sandbox';

const COMMON_DIETARY = [
  'Strictly Kosher',
  'Kosher-style',
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Nut Allergy',
  'Dairy-Free',
  'No Restrictions',
];

const COMMON_INTERESTS = [
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

export default function ProfilePage() {
  const { student, login, logout, updateStudent } = useAuth();
  const { config } = useConfig();

  // Sign In / Search State for unauthenticated users
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StudentProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Edit Profile Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [classYear, setClassYear] = useState('');
  const [major, setMajor] = useState('');
  const [dietary, setDietary] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Populate form when student is loaded
  useEffect(() => {
    if (student) {
      setFirstName(student.firstName || '');
      setLastName(student.lastName || '');
      setPreferredName(student.preferredName || student.firstName || '');
      setPronouns(student.pronouns || '');
      setEmail(student.email || '');
      setPhone(student.phone || '');
      setClassYear(student.classYear || '2026');
      setMajor(student.major || '');
      setDietary(student.dietaryRestrictions || []);
      setInterests(student.interests || []);
    }
  }, [student]);

  const handleSearchLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);

    try {
      const results = await searchStudents(searchQuery.trim(), config);
      if (results.length === 0) {
        setSearchError('No matching student found. Try your last name or email.');
      } else if (results.length === 1) {
        login(results[0]);
      } else {
        setSearchResults(results);
      }
    } catch (err: any) {
      setSearchError(err.message || 'Error searching student directory.');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleDietary = (item: string) => {
    setDietary((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleInterest = (item: string) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const ok = await updateStudent({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        preferredName: preferredName.trim() || firstName.trim(),
        pronouns: pronouns.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        classYear: classYear.trim(),
        major: major.trim(),
        dietaryRestrictions: dietary,
        interests,
      });

      if (ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setSaveError('Failed to save profile changes to Google Sheet.');
      }
    } catch (err: any) {
      setSaveError(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        {!student ? (
          /* =========================================================================
             UNAUTHENTICATED: LOGIN / SIGN IN
             ========================================================================= */
          <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 font-black text-2xl flex items-center justify-center mx-auto">
              <User className="w-8 h-8" />
            </div>

            <div>
              <h1 className="text-3xl font-black text-slate-900">Student Profile Sign In</h1>
              <p className="text-sm text-slate-500 font-semibold mt-1">
                Enter your Last Name, Email, or Tap Card ID to access your profile.
              </p>
            </div>

            <form onSubmit={handleSearchLogin} className="space-y-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Last Name, Email, or Card UID..."
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 text-center text-base focus:bg-white focus:border-blue-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="w-full py-3.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-black rounded-2xl text-base shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {isSearching ? 'Searching Directory...' : 'Sign In'}
              </button>
            </form>

            {searchError && (
              <div className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
                {searchError}
              </div>
            )}

            {/* Multiple Match Results */}
            {searchResults.length > 0 && (
              <div className="text-left space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase">Select Your Account:</span>
                {searchResults.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => login(s)}
                    className="w-full p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="font-extrabold text-sm text-slate-900 block">{getStudentDisplayName(s)}</span>
                      <span className="text-xs text-slate-500">{s.email}</span>
                    </div>
                    <span className="text-xs font-black text-blue-700">Select →</span>
                  </button>
                ))}
              </div>
            )}

            {/* Quick Demo Logins */}
            <div className="pt-6 border-t border-slate-100">
              <span className="text-xs font-black uppercase text-slate-400 block mb-3">Quick Sandbox Sign-In:</span>
              <div className="flex flex-wrap justify-center gap-2">
                {INITIAL_SANDBOX_STUDENTS.map((demo) => (
                  <button
                    key={demo.id}
                    onClick={() => login(demo)}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition-colors cursor-pointer"
                  >
                    {getStudentDisplayName(demo)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
             AUTHENTICATED: EDIT PROFILE MODULE
             ========================================================================= */
          <div className="space-y-6">
            {/* Profile Overview Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-700 text-white font-black text-2xl flex items-center justify-center shadow-md">
                  {student.firstName[0] || 'S'}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                    {getStudentDisplayName(student)}
                  </h1>
                  <p className="text-xs sm:text-sm font-semibold text-slate-500">
                    ID: {student.id} {student.tapCard ? `• Card: ${student.tapCard}` : '• No Card Linked'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Link
                  href="/kiosk"
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Kiosk Mode
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center space-x-1 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>

            {/* Notification Alerts */}
            {saveSuccess && (
              <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 border border-emerald-300 p-4 rounded-2xl text-xs font-extrabold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>Your profile changes were saved successfully to Google Sheets!</span>
              </div>
            )}

            {saveError && (
              <div className="flex items-center space-x-2 bg-rose-50 text-rose-800 border border-rose-300 p-4 rounded-2xl text-xs font-extrabold">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {/* Edit Form */}
            <form onSubmit={handleSaveProfile} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">Update Your Information</h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Keep your dietary preferences and interests up to date for event catering and printed nametags.
                </p>
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                    Preferred Name (On Nametag)
                  </label>
                  <input
                    type="text"
                    value={preferredName}
                    onChange={(e) => setPreferredName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Pronouns, Email, Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                    Pronouns
                  </label>
                  <input
                    type="text"
                    value={pronouns}
                    onChange={(e) => setPronouns(e.target.value)}
                    placeholder="they/them, she/her, he/him"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                    Mobile Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Class Year & Major */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                    Class / Graduation Year
                  </label>
                  <input
                    type="text"
                    value={classYear}
                    onChange={(e) => setClassYear(e.target.value)}
                    placeholder="e.g. 2026"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                    Major / Field of Study
                  </label>
                  <input
                    type="text"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Dietary Restrictions */}
              <div>
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-2">
                  Dietary Restrictions (For Shabbat & Event Dinners)
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_DIETARY.map((item) => {
                    const selected = dietary.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleDietary(item)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          selected
                            ? 'bg-blue-700 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {item} {selected ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interests */}
              <div>
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-2">
                  Interests & Involvement (Printed on Nametag)
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_INTERESTS.map((item) => {
                    const selected = interests.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleInterest(item)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          selected
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {item} {selected ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center space-x-2 px-8 py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-extrabold rounded-2xl text-base shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
