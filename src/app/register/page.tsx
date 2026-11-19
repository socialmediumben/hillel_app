'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { UserPlus, CheckCircle2, AlertCircle, RefreshCw, CreditCard, Sparkles, ArrowLeft } from 'lucide-react';
import { useConfig } from '@/context/ConfigContext';
import { useAuth } from '@/context/AuthContext';
import { createStudent } from '@/lib/sheets';
import { StudentProfile } from '@/lib/types';

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

function RegisterContent() {
  const searchParams = useSearchParams();
  const { config } = useConfig();
  const { login } = useAuth();

  const cardParam = searchParams.get('card') || '';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [classYear, setClassYear] = useState('2027');
  const [major, setMajor] = useState('');
  const [dietary, setDietary] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [tapCard, setTapCard] = useState(cardParam);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdStudent, setCreatedStudent] = useState<StudentProfile | null>(null);

  useEffect(() => {
    if (cardParam) {
      setTapCard(cardParam);
    }
  }, [cardParam]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setErrorMsg('First Name, Last Name, and Email are required.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await createStudent(
        {
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
          tapCard: tapCard.trim(),
        },
        config
      );

      if (res.success && res.student) {
        setCreatedStudent(res.student);
        login(res.student);
        setIsSuccess(true);
      } else {
        setErrorMsg(res.error || 'Failed to complete registration.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error submitting registration.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess && createdStudent) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-xl border border-slate-200 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <h1 className="text-3xl font-black text-slate-900">
              Welcome, {createdStudent.preferredName || createdStudent.firstName}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-2 leading-relaxed">
              You are now registered with {config.orgName}. Your profile has been created and you can now check in at any kiosk terminal!
            </p>
          </div>

          {createdStudent.tapCard && (
            <div className="bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2">
              <CreditCard className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>Tap Card Linked: {createdStudent.tapCard}</span>
            </div>
          )}

          <div className="pt-2 space-y-3">
            <Link
              href="/"
              className="block w-full py-4 bg-blue-700 hover:bg-blue-800 text-white rounded-2xl text-base font-black shadow-md transition-transform active:scale-95"
            >
              Go to Student App & Events
            </Link>
            <Link
              href="/profile"
              className="block w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors"
            >
              View Your Digital Pass
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 flex justify-center">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>{config.campusName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Join {config.orgName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Fill out your student info to connect with Jewish campus life and check in at events.
          </p>
        </div>

        {tapCard && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-2xl text-xs font-extrabold flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Tap Card ({tapCard}) will be linked to your new profile!</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-300 text-rose-800 p-4 rounded-2xl text-xs font-bold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Name Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Rachel"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Cohen"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Preferred Name & Pronouns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                Preferred Name
              </label>
              <input
                type="text"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                placeholder="Name for your nametag"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                Pronouns
              </label>
              <input
                type="text"
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                placeholder="e.g. she/her, they/them"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@campus.edu"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 000-0000"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Class Year & Major */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                Class Year
              </label>
              <select
                value={classYear}
                onChange={(e) => setClassYear(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
              >
                <option value="2025">Class of 2025 (Senior)</option>
                <option value="2026">Class of 2026 (Junior)</option>
                <option value="2027">Class of 2027 (Sophomore)</option>
                <option value="2028">Class of 2028 (Freshman)</option>
                <option value="Grad">Graduate Student</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                Major / Field of Study
              </label>
              <input
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="e.g. Psychology, Business"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Dietary Restrictions */}
          <div>
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-2">
              Dietary Needs & Kosher Preferences
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_DIETARY.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => toggleDietary(item)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    dietary.includes(item)
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
              What are you interested in at Hillel?
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_INTERESTS.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => toggleInterest(item)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    interests.includes(item)
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-extrabold rounded-2xl text-base shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Submitting Registration...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Complete Registration</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center pt-2">
          <Link href="/" className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
            ← Return to App Home
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold text-sm">Loading Registration...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
