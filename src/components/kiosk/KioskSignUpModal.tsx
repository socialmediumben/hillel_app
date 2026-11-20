'use client';

import React, { useState } from 'react';
import { X, UserPlus, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { StudentProfile, DEFAULT_REGISTRATION_FIELDS } from '@/lib/types';
import { useConfig } from '@/context/ConfigContext';
import { createStudent } from '@/lib/sheets';

interface KioskSignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newStudent: StudentProfile) => void;
  initialTapCard?: string;
}

export function KioskSignUpModal({ isOpen, onClose, onSuccess, initialTapCard }: KioskSignUpModalProps) {
  const { config } = useConfig();

  const fields = config.registrationFields && config.registrationFields.length > 0
    ? config.registrationFields
    : DEFAULT_REGISTRATION_FIELDS;
  const enabledFields = fields.filter((f) => f.enabled);

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
    tapCard: initialTapCard || '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

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
        onSuccess(res.student);
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to create student account.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 md:p-8 bg-blue-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center font-black">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black">First-Time Student Sign-Up</h2>
              <p className="text-xs md:text-sm text-blue-100 font-semibold">
                Takes only 30 seconds to join {config.campusName}!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
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

          {formData.tapCard && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Card ID {formData.tapCard} will be bound to your new profile!</span>
            </div>
          )}

          {/* Dynamic Fields */}
          <div className="space-y-4">
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
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-slate-500 hover:text-slate-800 font-bold rounded-2xl text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-extrabold rounded-2xl text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Complete Sign Up</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}