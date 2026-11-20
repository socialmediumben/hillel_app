'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Sparkles,
  Clock,
  MapPin,
  CheckCircle2,
  Lock,
  Check,
  User,
  CreditCard,
  LogOut,
  Smartphone,
  Radio,
  Search,
  RefreshCw,
  AlertCircle,
  Edit3,
  Save,
  X,
  UserPlus
} from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { useConfig } from '@/context/ConfigContext';
import { useAuth } from '@/context/AuthContext';
import { AppEvent, StudentProfile, getStudentDisplayName, isEventToday, isEventUpcomingOrToday, DEFAULT_DIETARY_OPTIONS, DEFAULT_INTEREST_OPTIONS } from '@/lib/types';
import { fetchEvents, recordEventRsvp, searchStudents, getStudentByCard, updateStudentProfile, linkCardToStudent } from '@/lib/sheets';
import { isWebNfcSupported, startNfcScanner, triggerHapticFeedback, playSuccessChime, normalizeNfcTapCard } from '@/lib/hardware';

export default function HomePage() {
  const { config } = useConfig();
  const { student, login, logout, updateStudent } = useAuth();

  const dietaryOptions = config.registrationFields?.find((f) => f.id === 'dietary')?.options || DEFAULT_DIETARY_OPTIONS;
  const interestOptions = config.registrationFields?.find((f) => f.id === 'interests')?.options || DEFAULT_INTEREST_OPTIONS;

  // App Tab State: 'profile' | 'events'
  const [activeTab, setActiveTab] = useState<'profile' | 'events'>('profile');

  // Sign-In State (When not logged in)
  const [cardInput, setCardInput] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Secondary Name/Email Search for Sign-In
  const [showSearchLogin, setShowSearchLogin] = useState(false);
  const [searchNameQuery, setSearchNameQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StudentProfile[]>([]);

  // Phone NFC State
  const [isNfcActive, setIsNfcActive] = useState(false);
  const [nfcError, setNfcError] = useState<string | null>(null);
  const [isNfcSupported, setIsNfcSupported] = useState(false);

  // Events State
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [rsvpdIds, setRsvpdIds] = useState<Set<string>>(new Set());
  const [rsvpLoadingId, setRsvpLoadingId] = useState<string | null>(null);
  const [rsvpFeedback, setRsvpFeedback] = useState<string | null>(null);

  // Edit Profile State (When logged in)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPreferredName, setEditPreferredName] = useState('');
  const [editPronouns, setEditPronouns] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editClassYear, setEditClassYear] = useState('');
  const [editMajor, setEditMajor] = useState('');
  const [editDietary, setEditDietary] = useState<string[]>([]);
  const [editInterests, setEditInterests] = useState<string[]>([]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Link / Update Card State (Inside Profile Tab)
  const [isLinkingCard, setIsLinkingCard] = useState(false);
  const [newCardInput, setNewCardInput] = useState('');
  const [isLinkingLoading, setIsLinkingLoading] = useState(false);
  const [linkCardSuccessMsg, setLinkCardSuccessMsg] = useState<string | null>(null);
  const [linkCardErrorMsg, setLinkCardErrorMsg] = useState<string | null>(null);
  const [isProfileNfcActive, setIsProfileNfcActive] = useState(false);
  const stopProfileNfcRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setIsNfcSupported(isWebNfcSupported());
  }, []);

  // Fetch Events from Sheet
  useEffect(() => {
    fetchEvents(config)
      .then((data) => setEvents(data))
      .catch(console.error)
      .finally(() => setIsLoadingEvents(false));
  }, [config]);

  // Sync edit form with current student
  useEffect(() => {
    if (student) {
      setEditFirstName(student.firstName || '');
      setEditLastName(student.lastName || '');
      setEditPreferredName(student.preferredName || student.firstName || '');
      setEditPronouns(student.pronouns || '');
      setEditEmail(student.email || '');
      setEditPhone(student.phone || '');
      setEditClassYear(student.classYear || '2027');
      setEditMajor(student.major || '');
      setEditDietary(student.dietaryRestrictions || []);
      setEditInterests(student.interests || []);
    }
  }, [student]);

  // NFC Scan Handler
  const handleActivateNfc = async () => {
    setNfcError(null);
    setSignInError(null);
    try {
      setIsNfcActive(true);
      await startNfcScanner({
        onScan: async (serialNumber) => {
          setIsNfcActive(false);
          setIsSigningIn(true);
          try {
            const found = await getStudentByCard(serialNumber, config);
            if (found) {
              login(found);
            } else {
              setSignInError(`Card ${serialNumber} not found. Are you new to Hillel? Register below.`);
            }
          } catch (err: any) {
            setSignInError(err.message || 'Error looking up card.');
          } finally {
            setIsSigningIn(false);
          }
        },
        onError: (err) => {
          setNfcError(err.message || 'NFC read error. Make sure NFC is enabled in phone settings.');
          setIsNfcActive(false);
        },
      });
    } catch (err: any) {
      setNfcError(err.message || 'Could not start NFC. Ensure NFC is enabled on your phone.');
      setIsNfcActive(false);
    }
  };

  // Sign In by typing Tap ID / Card number
  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardInput.trim()) return;

    setIsSigningIn(true);
    setSignInError(null);

    try {
      const cleanCard = cardInput.trim();
      const found = await getStudentByCard(cleanCard, config);
      if (found) {
        login(found);
        setCardInput('');
      } else {
        setSignInError(`No account found for Tap ID "${cleanCard}". Please check the ID or register.`);
      }
    } catch (err: any) {
      setSignInError(err.message || 'Error verifying Tap ID.');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Search by Name or Email
  const handleNameSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchNameQuery.trim()) return;

    setIsSigningIn(true);
    setSignInError(null);

    try {
      const results = await searchStudents(searchNameQuery.trim(), config);
      if (results.length === 0) {
        setSignInError(`No student found matching "${searchNameQuery}".`);
        setSearchResults([]);
      } else if (results.length === 1) {
        login(results[0]);
        setSearchResults([]);
        setShowSearchLogin(false);
      } else {
        setSearchResults(results);
      }
    } catch (err: any) {
      setSignInError(err.message || 'Error searching student directory.');
    } finally {
      setIsSigningIn(false);
    }
  };

  // RSVP Handler (1-Click for Logged In Student)
  const handleRsvp = async (event: AppEvent) => {
    if (!student) return;
    setRsvpLoadingId(event.id);
    setRsvpFeedback(null);
    try {
      const res = await recordEventRsvp(student, event, config);
      if (res.success) {
        setRsvpdIds((prev) => new Set([...Array.from(prev), event.id]));
        setRsvpFeedback(`You're confirmed for "${event.title}"! See you there.`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRsvpLoadingId(null);
    }
  };

  // Save Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    setIsSavingProfile(true);
    setSaveSuccessMsg(null);

    try {
      const updatedData: Partial<StudentProfile> = {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        preferredName: editPreferredName.trim() || editFirstName.trim(),
        pronouns: editPronouns.trim(),
        email: editEmail.trim().toLowerCase(),
        phone: editPhone.trim(),
        classYear: editClassYear.trim(),
        major: editMajor.trim(),
        dietaryRestrictions: editDietary,
        interests: editInterests,
      };

      const success = await updateStudent(updatedData);
      if (success) {
        setIsEditingProfile(false);
        setSaveSuccessMsg('Profile updated successfully!');
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const toggleDietary = (item: string) => {
    setEditDietary((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleInterest = (item: string) => {
    setEditInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  // Card Linking Handlers for Profile Module
  useEffect(() => {
    return () => {
      if (stopProfileNfcRef.current) stopProfileNfcRef.current();
    };
  }, []);

  const handleActivateProfileNfc = async () => {
    setLinkCardErrorMsg(null);
    setLinkCardSuccessMsg(null);
    try {
      const stop = await startNfcScanner({
        onScan: async (scanned) => {
          const norm = normalizeNfcTapCard(scanned);
          setNewCardInput(norm);
          await handleSaveCardLink(norm);
        },
        onError: () => setIsProfileNfcActive(false),
      });
      stopProfileNfcRef.current = stop;
      setIsProfileNfcActive(true);
    } catch (err: any) {
      setLinkCardErrorMsg(err.message || 'Could not start phone NFC scanner.');
      setIsProfileNfcActive(false);
    }
  };

  const handleSaveCardLink = async (cardToLink?: string) => {
    if (!student) return;
    const cardId = normalizeNfcTapCard(cardToLink !== undefined ? cardToLink : newCardInput);
    if (!cardId) {
      setLinkCardErrorMsg('Please tap a card or type a Card UID.');
      return;
    }

    setIsLinkingLoading(true);
    setLinkCardErrorMsg(null);
    setLinkCardSuccessMsg(null);

    try {
      const res = await linkCardToStudent(student.id, cardId, config);
      if (res.success) {
        await updateStudent({ tapCard: cardId });
        setLinkCardSuccessMsg(`Tap card ${cardId} successfully linked to your profile!`);
        setNewCardInput('');
        triggerHapticFeedback();
        playSuccessChime();
        if (stopProfileNfcRef.current) {
          stopProfileNfcRef.current();
          stopProfileNfcRef.current = null;
          setIsProfileNfcActive(false);
        }
      } else {
        setLinkCardErrorMsg(res.error || 'Failed to link card to account.');
      }
    } catch (err: any) {
      setLinkCardErrorMsg(err.message || 'Error communicating with server.');
    } finally {
      setIsLinkingLoading(false);
    }
  };

  const handleUnlinkCard = async () => {
    if (!student) return;
    if (!window.confirm('Are you sure you want to unlink your physical tap card?')) return;
    setIsLinkingLoading(true);
    setLinkCardErrorMsg(null);
    setLinkCardSuccessMsg(null);
    try {
      const res = await linkCardToStudent(student.id, '', config);
      if (res.success) {
        await updateStudent({ tapCard: '' });
        setLinkCardSuccessMsg('Card unlinked from your account.');
      } else {
        setLinkCardErrorMsg(res.error || 'Failed to unlink card.');
      }
    } catch (err: any) {
      setLinkCardErrorMsg(err.message || 'Error unlinking card.');
    } finally {
      setIsLinkingLoading(false);
    }
  };

  const categories = ['All', 'Shabbat', 'Social', 'Learning', 'Tikkun Olam'];

  const filteredEvents = events.filter((e) => {
    if (!e.active) return false;
    if (selectedCategory === 'All') return true;
    return e.category && e.category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {/* =========================================================================
            STATE 1: NOT LOGGED IN -> SIGN IN SCREEN (TAP CARD OR ENTER TAP ID)
            ========================================================================= */}
        {!student ? (
          <div className="max-w-md w-full mx-auto py-6 space-y-6 text-center animate-fade-in">
            {/* Greeting Header */}
            <div>
              <div className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-700 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>{config.campusName}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Welcome to {config.orgName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1.5">
                Sign in with your student card or enter your Tap ID to view your profile and RSVP for events.
              </p>
            </div>

            {/* Error Alerts */}
            {signInError && (
              <div className="bg-rose-50 border border-rose-300 text-rose-800 p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 text-left">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                <span>{signInError}</span>
              </div>
            )}

            {nfcError && (
              <div className="bg-amber-50 border border-amber-300 text-amber-800 p-3.5 rounded-2xl text-xs font-bold text-left">
                <span>{nfcError}</span>
              </div>
            )}

            {/* Main Sign-In Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-5 text-left">
              {/* Option 1: Mobile Phone NFC Tap */}
              {isNfcSupported && (
                <div>
                  {!isNfcActive ? (
                    <button
                      type="button"
                      onClick={handleActivateNfc}
                      disabled={isSigningIn}
                      className="w-full py-4 px-5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-2xl shadow-md flex items-center justify-center space-x-3 transition-transform active:scale-95 cursor-pointer border border-blue-500/30"
                    >
                      <Smartphone className="w-6 h-6 animate-pulse" />
                      <div className="text-left">
                        <span className="block font-black text-base leading-tight">
                          📱 Tap Card to Back of Phone
                        </span>
                        <span className="block text-xs text-blue-200 font-medium">
                          Hold your physical card to your phone to sign in
                        </span>
                      </div>
                    </button>
                  ) : (
                    <div className="bg-emerald-50 border-2 border-emerald-400 p-4 rounded-2xl text-center space-y-1 animate-pulse">
                      <div className="flex items-center justify-center space-x-2 text-emerald-800 font-black text-sm">
                        <Radio className="w-5 h-5 text-emerald-600 animate-spin" />
                        <span>Ready! Tap Card to Back of Phone Now</span>
                      </div>
                      <p className="text-xs text-emerald-600 font-medium">
                        Hold your card firmly against the back of your device...
                      </p>
                    </div>
                  )}

                  <div className="my-5 flex items-center space-x-3">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                      Or Type Your Tap ID
                    </span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                </div>
              )}

              {/* Option 2: Enter Tap ID / Card UID */}
              <form onSubmit={handleCardSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                    Student Tap Card ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardInput}
                      onChange={(e) => setCardInput(e.target.value)}
                      placeholder="e.g. 1414309466 or 04A23B4C"
                      autoFocus={!isNfcSupported}
                      className="w-full px-4 py-3.5 pl-11 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 text-sm focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                    />
                    <CreditCard className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSigningIn || !cardInput.trim()}
                  className="w-full py-3.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-black rounded-2xl text-sm shadow-md transition-transform active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
                >
                  {isSigningIn ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <span>Sign In With Tap ID</span>
                  )}
                </button>
              </form>

              {/* Option 3: Fallback Name/Email Search */}
              <div className="pt-2 text-center">
                {!showSearchLogin ? (
                  <button
                    type="button"
                    onClick={() => setShowSearchLogin(true)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Don't have your card? Look up by last name or email →
                  </button>
                ) : (
                  <form onSubmit={handleNameSearchSubmit} className="space-y-3 pt-2 text-left border-t border-slate-100">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                      Search Name or Email
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchNameQuery}
                        onChange={(e) => setSearchNameQuery(e.target.value)}
                        placeholder="e.g. Cohen or student@campus.edu"
                        className="w-full px-4 py-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>

                    <button
                      type="submit"
                      disabled={isSigningIn || !searchNameQuery.trim()}
                      className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs transition-colors"
                    >
                      Search Account
                    </button>

                    {searchResults.length > 1 && (
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[11px] font-bold text-slate-400 block">Select your account:</span>
                        {searchResults.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => login(s)}
                            className="w-full p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl text-left flex items-center justify-between text-xs font-bold text-slate-800 transition-colors"
                          >
                            <span>{getStudentDisplayName(s)} ({s.email})</span>
                            <span className="text-blue-700">Select →</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </form>
                )}
              </div>
            </div>

            {/* First-Time Student Link */}
            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-700 font-extrabold rounded-2xl text-xs shadow-sm transition-all"
              >
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <span>First time at Hillel? Register here</span>
              </Link>
            </div>
          </div>
        ) : (
          /* =========================================================================
             STATE 2: LOGGED IN -> SHOW PROFILE & EVENTS TABS
             ========================================================================= */
          <div className="space-y-6 animate-fade-in">
            {/* Top User Greeting & Status Bar */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-700 text-white font-black text-2xl flex items-center justify-center shadow-md">
                  {student.firstName[0] || 'S'}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                    Shalom, {getStudentDisplayName(student)}!
                  </h1>
                  <p className="text-xs sm:text-sm font-semibold text-slate-500">
                    {student.classYear && `Class of '${student.classYear.slice(-2)}`}
                    {student.major && ` • ${student.major}`}
                    {student.tapCard && ` • 💳 Card: ${student.tapCard}`}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-colors cursor-pointer self-start sm:self-auto"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* TAB SELECTOR: PROFILE VS EVENTS */}
            <div className="flex items-center space-x-2 bg-slate-200/80 p-1.5 rounded-2xl max-w-md mx-auto sm:mx-0">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-blue-700 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-4 h-4" />
                <span>My Profile</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('events')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  activeTab === 'events'
                    ? 'bg-blue-700 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Events Calendar</span>
              </button>
            </div>

            {/* =========================================================================
                TAB 1: PROFILE VIEW
                ========================================================================= */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {saveSuccessMsg && (
                  <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}

                {/* Digital Student Pass Card */}
                <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 bg-blue-600/50 px-2.5 py-0.5 rounded-full">
                        {config.campusName} Digital Pass
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black mt-2">
                        {getStudentDisplayName(student)}
                      </h2>
                      <p className="text-xs text-blue-200 font-semibold">
                        {student.firstName} {student.lastName} {student.pronouns && `(${student.pronouns})`}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsLinkingCard(!isLinkingCard);
                          setIsEditingProfile(false);
                          setLinkCardSuccessMsg(null);
                          setLinkCardErrorMsg(null);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-95 ${
                          isLinkingCard
                            ? 'bg-blue-600 text-white border border-blue-400'
                            : 'bg-white text-blue-900 hover:bg-blue-50 border border-white/30'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                        <span>{student.tapCard ? 'Update Tap Card' : 'Link Tap Card'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingProfile(!isEditingProfile);
                          setIsLinkingCard(false);
                        }}
                        className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-colors flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isEditingProfile ? 'Cancel Edit' : 'Edit Information'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold pt-4 border-t border-blue-400/30">
                    <div>
                      <span className="text-blue-300 text-[10px] uppercase font-black block">Class Year</span>
                      <span>{student.classYear || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="text-blue-300 text-[10px] uppercase font-black block">Major</span>
                      <span>{student.major || 'Undeclared'}</span>
                    </div>
                    <div>
                      <span className="text-blue-300 text-[10px] uppercase font-black block">Tap Card</span>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="font-bold">{student.tapCard || 'None linked'}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsLinkingCard(true);
                            setIsEditingProfile(false);
                            setLinkCardSuccessMsg(null);
                            setLinkCardErrorMsg(null);
                          }}
                          className="text-[10px] text-blue-200 hover:text-white underline font-extrabold cursor-pointer"
                        >
                          {student.tapCard ? 'Change' : 'Link'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-blue-300 text-[10px] uppercase font-black block">Email</span>
                      <span className="truncate block">{student.email}</span>
                    </div>
                  </div>
                </div>

                {/* Link / Update Tap Card Module (Toggled via Link / Update Tap Card button) */}
                {isLinkingCard && (
                  <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-blue-500 shadow-md space-y-5 animate-fade-in">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl font-black text-slate-900">
                            {student.tapCard ? 'Update Your Tap Card' : 'Link a New Tap Card'}
                          </h3>
                          <p className="text-xs text-slate-500 font-semibold">
                            {student.tapCard
                              ? `Currently linked to card ID: ${student.tapCard}. Tapping or typing a new card will update it.`
                              : 'Link a physical card, wristband, or tag to enable 1-second front-desk check-in!'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsLinkingCard(false);
                          if (stopProfileNfcRef.current) {
                            stopProfileNfcRef.current();
                            stopProfileNfcRef.current = null;
                            setIsProfileNfcActive(false);
                          }
                        }}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                      >
                        ✕ Close
                      </button>
                    </div>

                    {/* Success / Error Banners */}
                    {linkCardSuccessMsg && (
                      <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3.5 rounded-2xl text-xs font-bold flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{linkCardSuccessMsg}</span>
                      </div>
                    )}
                    {linkCardErrorMsg && (
                      <div className="bg-rose-50 border border-rose-300 text-rose-800 p-3.5 rounded-2xl text-xs font-bold flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <span>{linkCardErrorMsg}</span>
                      </div>
                    )}

                    {/* Method 1: Phone NFC Tap */}
                    {isWebNfcSupported() && (
                      <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2">
                        <div className="flex items-center space-x-2 text-xs font-black text-blue-900 uppercase tracking-wider">
                          <Smartphone className="w-4 h-4 text-blue-600" />
                          <span>Option 1: Phone NFC Tap (Android Chrome)</span>
                        </div>
                        {!isProfileNfcActive ? (
                          <button
                            type="button"
                            onClick={handleActivateProfileNfc}
                            disabled={isLinkingLoading}
                            className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-black rounded-xl text-xs shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                          >
                            <Smartphone className="w-4 h-4" />
                            <span>Tap Card to Back of Phone</span>
                          </button>
                        ) : (
                          <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-black flex items-center justify-center space-x-2 animate-pulse">
                            <Radio className="w-4 h-4 text-emerald-700 animate-spin" />
                            <span>Ready to link! Hold physical card against the back of your phone now...</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Method 2: Manual Card UID Entry */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                        {isWebNfcSupported() ? 'Option 2: Enter Card UID or Tap ID' : 'Enter Card UID or Tap ID'}
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={newCardInput}
                            onChange={(e) => setNewCardInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveCardLink()}
                            placeholder="e.g. 1414309466 or 04A23B4C"
                            className="w-full px-4 py-3 pl-11 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:bg-white focus:border-blue-600 focus:outline-none"
                          />
                          <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSaveCardLink()}
                          disabled={isLinkingLoading || !newCardInput.trim()}
                          className="px-6 py-3 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-black rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center space-x-2"
                        >
                          {isLinkingLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          <span>Save & Link Card</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">
                        You can find the UID printed on your card or by scanning it at any Hillel kiosk scanner.
                      </p>
                    </div>

                    {/* Unlink Option if already linked */}
                    {student.tapCard && (
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-semibold">
                          Lost your physical card or want to disconnect it?
                        </span>
                        <button
                          type="button"
                          onClick={handleUnlinkCard}
                          disabled={isLinkingLoading}
                          className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                        >
                          Unlink Current Card
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Edit Profile Form (Toggled via Edit Information) */}
                {isEditingProfile ? (
                  <form onSubmit={handleSaveProfile} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-black text-slate-900">Update Profile Details</h3>
                        <p className="text-xs text-slate-500 font-semibold">
                          Your updates are synchronized directly to the Google Sheet.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600"
                      >
                        ✕ Close
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                          Preferred Name
                        </label>
                        <input
                          type="text"
                          value={editPreferredName}
                          onChange={(e) => setEditPreferredName(e.target.value)}
                          placeholder="Name for greeting & nametag"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                          Pronouns
                        </label>
                        <input
                          type="text"
                          value={editPronouns}
                          onChange={(e) => setEditPronouns(e.target.value)}
                          placeholder="e.g. she/her, they/them"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="(555) 000-0000"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                          Major
                        </label>
                        <input
                          type="text"
                          value={editMajor}
                          onChange={(e) => setEditMajor(e.target.value)}
                          placeholder="e.g. Computer Science"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Dietary Restrictions */}
                    <div>
                      <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-2">
                        Dietary Restrictions & Kosher Preferences
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {dietaryOptions.map((item) => (
                          <button
                            type="button"
                            key={item}
                            onClick={() => toggleDietary(item)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                              editDietary.includes(item)
                                ? 'bg-blue-700 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Interests */}
                    <div>
                      <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-2">
                        Interests & Programs
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {interestOptions.map((item) => (
                          <button
                            type="button"
                            key={item}
                            onClick={() => toggleInterest(item)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                              editInterests.includes(item)
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center space-x-3">
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center space-x-2"
                      >
                        {isSavingProfile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Save Profile Changes</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-4 py-3 text-slate-500 hover:text-slate-700 font-bold rounded-xl text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Profile Details View Cards */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Dietary Details */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                      <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                        <span>🥗 Dietary Needs</span>
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {student.dietaryRestrictions && student.dietaryRestrictions.length > 0 ? (
                          student.dietaryRestrictions.map((item) => (
                            <span key={item} className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
                              {item}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">No dietary restrictions specified</span>
                        )}
                      </div>
                    </div>

                    {/* Interests Details */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                      <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                        <span>✨ Interests & Programs</span>
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {student.interests && student.interests.length > 0 ? (
                          student.interests.map((item) => (
                            <span key={item} className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold">
                              {item}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">No interests selected</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =========================================================================
                TAB 2: EVENTS CALENDAR VIEW (1-CLICK RSVP FOR LOGGED IN STUDENT)
                ========================================================================= */}
            {activeTab === 'events' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center space-x-1.5 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-black uppercase mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Events Calendar</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Upcoming Hillel Programs</h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-semibold">
                      All programs are completely free! RSVP with 1 click below.
                    </p>
                  </div>
                </div>

                {/* Feedback banner */}
                {rsvpFeedback && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-2xl text-xs font-bold flex items-center justify-between">
                    <span>{rsvpFeedback}</span>
                    <button
                      onClick={() => setRsvpFeedback(null)}
                      className="text-blue-500 hover:text-blue-700 font-extrabold ml-4 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Category Filter Pills */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                        selectedCategory === cat
                          ? 'bg-blue-700 text-white shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Events Grid */}
                {isLoadingEvents ? (
                  <div className="py-16 text-center text-slate-400 font-bold text-sm">
                    Loading events from Google Sheet...
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="py-16 text-center space-y-2">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
                    <h4 className="text-lg font-bold text-slate-700">No events found in this category</h4>
                    <p className="text-xs text-slate-400">Add events to the 'App Events' tab in your Google Sheet to view them here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredEvents.map((evt) => {
                      const isRsvpd = rsvpdIds.has(evt.id);
                      const isToday = isEventToday(evt.date);
                      const isPast = !isEventUpcomingOrToday(evt.date) && !isToday;

                      return (
                        <div
                          key={evt.id}
                          className={`rounded-3xl border p-5 flex flex-col justify-between transition-all ${
                            isToday
                              ? 'border-blue-400 ring-2 ring-blue-100 bg-blue-50/30'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                                {evt.category || 'Event'}
                              </span>
                              <div className="flex items-center space-x-1.5">
                                {isToday && (
                                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                    Today
                                  </span>
                                )}
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  Free
                                </span>
                              </div>
                            </div>

                            <h3 className="font-extrabold text-slate-900 text-lg mb-2 leading-snug">
                              {evt.title}
                            </h3>

                            {evt.description && (
                              <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-4 leading-relaxed">
                                {evt.description}
                              </p>
                            )}

                            <div className="space-y-1.5 text-xs text-slate-600 font-semibold mb-4">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span>{evt.date}</span>
                                {evt.startTime && <span>• {evt.startTime} {evt.endTime ? `- ${evt.endTime}` : ''}</span>}
                              </div>
                              {evt.location && (
                                <div className="flex items-center space-x-2">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                  <span>{evt.location}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100">
                            {isPast ? (
                              <div className="text-center py-2.5 text-xs font-bold text-slate-400 bg-slate-100 rounded-xl">
                                Past Event
                              </div>
                            ) : (
                              <button
                                onClick={() => handleRsvp(evt)}
                                disabled={isRsvpd || rsvpLoadingId === evt.id}
                                className={`w-full py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                                  isRsvpd
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-blue-700 hover:bg-blue-800 text-white shadow-sm active:scale-95'
                                }`}
                              >
                                {isRsvpd ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>RSVP Confirmed ✓</span>
                                  </>
                                ) : rsvpLoadingId === evt.id ? (
                                  <span>Saving RSVP...</span>
                                ) : (
                                  <span>1-Click Free RSVP</span>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-6 text-xs font-semibold text-slate-400 border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{config.orgName} • {config.campusName}</span>
          <Link href="/developer" className="hover:text-slate-600 transition-colors flex items-center space-x-1.5">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Admin & Developer Mode</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
