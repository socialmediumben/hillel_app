'use client';

import React, { useState } from 'react';
import { X, UserPlus, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { StudentProfile } from '@/lib/types';
import { useConfig } from '@/context/ConfigContext';
import { createStudent } from '@/lib/sheets';

interface KioskSignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newStudent: StudentProfile) => void;
  initialTapCard?: string;
}

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

export function KioskSignUpModal({ isOpen, onClose, onSuccess, initialTapCard }: KioskSignUpModalProps) {
  const { config } = useConfig();
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
  const [tapCard, setTapCard] = useState(initialTapCard || '');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

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
        onSuccess(res.student);
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to sign up. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto no-print">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-blue-700 p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-800/80 rounded-2xl">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black">Welcome to {config.orgName}!</h2>
              <p className="text-xs text-blue-100 font-medium">First-time student sign-up</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-blue-200 hover:text-white hover:bg-blue-800 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 text-left max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="flex items-center space-x-2 text-rose-700 bg-rose-50 p-4 rounded-2xl border border-rose-200 text-sm font-bold">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Name & Pronouns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Jordan"
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
                placeholder="e.g. Taylor"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                Preferred Name (For Nametag)
              </label>
              <input
                type="text"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                placeholder="e.g. Jordy"
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
                placeholder="e.g. they/them, she/her, he/him"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                Campus Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@campus.edu"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                Cell Phone
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                Class / Graduation Year
              </label>
              <select
                value={classYear}
                onChange={(e) => setClassYear(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
              >
                <option value="2025">Class of 2025 (Senior)</option>
                <option value="2026">Class of 2026 (Junior)</option>
                <option value="2027">Class of 2027 (Sophomore)</option>
                <option value="2028">Class of 2028 (First-Year)</option>
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
                placeholder="e.g. Psychology, Engineering"
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

          {/* Submit */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2 px-8 py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-extrabold rounded-2xl text-base shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Complete Sign-Up</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
