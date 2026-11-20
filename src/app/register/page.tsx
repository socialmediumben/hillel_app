'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { UserPlus, CheckCircle2, AlertCircle, RefreshCw, CreditCard, Sparkles, ArrowLeft } from 'lucide-react';
import { useConfig } from '@/context/ConfigContext';
import { useAuth } from '@/context/AuthContext';
import { createStudent } from '@/lib/sheets';
import { StudentProfile, DEFAULT_REGISTRATION_FIELDS, RegistrationFieldConfig } from '@/lib/types';

function RegisterContent() {
  const searchParams = useSearchParams();
  const { config } = useConfig();
  const { login } = useAuth();

  const cardParam = searchParams.get('card') || '';

  const fields = config.registrationFields && config.registrationFields.length > 0
    ? config.registrationFields
    : DEFAULT_REGISTRATION_FIELDS;
  const enabledFields = fields.filter((f) => f.enabled);

  // Form values state
  const [formData, setFormData] = useState<Record<string, any>>({
    firstName: '',
    lastName: '',
    preferredName: '',
    pronouns: '',
    email: '',
    phone: '',
    classYear: '2027',
    major: '',
    dietary: [] as string[],
    interests: [] as string[],
    tapCard: cardParam || '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdStudent, setCreatedStudent] = useState<StudentProfile | null>(null);

  useEffect(() => {
    if (cardParam) {
      setFormData((prev) => ({ ...prev, tapCard: cardParam }));
    }
  }, [cardParam]);

  const updateField = (id: string, value: any) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const toggleMultiselect = (fieldId: string, item: string) => {
    setFormData((prev) => {
      const currentList: string[] = Array.isArray(prev[fieldId]) ? prev[fieldId] : [];
      const nextList = currentList.includes(item)
        ? currentList.filter((x) => x !== item)
        : [...currentList, item];
      return { ...prev, [fieldId]: nextList };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    for (const f of enabledFields) {
      if (f.required) {
        const val = formData[f.id];
        const isEmpty =
          val === undefined ||
          val === null ||
          (typeof val === 'string' && !val.trim()) ||
          (Array.isArray(val) && val.length === 0);
        if (isEmpty) {
          setErrorMsg(`${f.label} is required.`);
          return;
        }
      }
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const customFields: Record<string, any> = {};
      for (const f of enabledFields) {
        if (f.isCustom) {
          customFields[f.id] = formData[f.id];
        }
      }

      const res = await createStudent(
        {
          firstName: (formData.firstName || '').trim(),
          lastName: (formData.lastName || '').trim(),
          preferredName: (formData.preferredName || formData.firstName || '').trim(),
          pronouns: (formData.pronouns || '').trim(),
          email: (formData.email || '').trim().toLowerCase(),
          phone: (formData.phone || '').trim(),
          classYear: (formData.classYear || '').trim(),
          major: (formData.major || '').trim(),
          dietaryRestrictions: Array.isArray(formData.dietary) ? formData.dietary : [],
          interests: Array.isArray(formData.interests) ? formData.interests : [],
          tapCard: (formData.tapCard || '').trim(),
          customFields,
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
        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-xl border border-slate-200 text-center space-y-6 animate-fade-in">
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

        {formData.tapCard && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-2xl text-xs font-extrabold flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Tap Card ({formData.tapCard}) will be linked to your new profile!</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-300 text-rose-800 p-4 rounded-2xl text-xs font-bold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Dynamic Fields */}
          {enabledFields.map((field) => {
            if (field.type === 'multiselect') {
              const selectedItems: string[] = Array.isArray(formData[field.id]) ? formData[field.id] : [];
              const options = field.options || [];
              return (
                <div key={field.id} className="pt-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-2">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {options.map((item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => toggleMultiselect(field.id, item)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                          selectedItems.includes(item)
                            ? 'bg-blue-700 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            if (field.id === 'classYear') {
              return (
                <div key={field.id}>
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  <select
                    value={formData.classYear || '2027'}
                    onChange={(e) => updateField('classYear', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
                  >
                    <option value="2025">Class of 2025 (Senior)</option>
                    <option value="2026">Class of 2026 (Junior)</option>
                    <option value="2027">Class of 2027 (Sophomore)</option>
                    <option value="2028">Class of 2028 (Freshman)</option>
                    <option value="Grad">Graduate Student</option>
                  </select>
                </div>
              );
            }

            return (
              <div key={field.id}>
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                  {field.label} {field.required && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'}
                  value={formData[field.id] || ''}
                  onChange={(e) => updateField(field.id, e.target.value)}
                  placeholder={field.placeholder || ''}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>
            );
          })}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-2xl text-base font-black shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Creating Your Account...</span>
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

        <div className="text-center pt-2 border-t border-slate-100">
          <Link
            href="/"
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Already have an account? Sign in here</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400">
          Loading sign-up form...
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}