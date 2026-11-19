'use client';

import React from 'react';
import { User, ArrowLeft, ChevronRight } from 'lucide-react';
import { StudentProfile, getStudentDisplayName } from '@/lib/types';

interface KioskResultsProps {
  students: StudentProfile[];
  onSelect: (student: StudentProfile) => void;
  onBack: () => void;
}

export function KioskResults({ students, onSelect, onBack }: KioskResultsProps) {
  return (
    <div className="w-full max-w-2xl mx-auto text-left">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Select Your Account</h2>
          <p className="text-xs font-semibold text-slate-500">
            Found {students.length} matching student{students.length === 1 ? '' : 's'}
          </p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Search</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {students.map((student) => {
          const displayName = getStudentDisplayName(student);
          return (
            <button
              key={student.id}
              onClick={() => onSelect(student)}
              className="p-5 bg-white hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-500 rounded-2xl text-left shadow-sm transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 font-black text-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {student.firstName[0] || 'S'}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-700 transition-colors">
                    {displayName}
                  </h3>
                  <div className="text-xs text-slate-500 font-semibold space-x-1">
                    {student.classYear && <span>Class of '{student.classYear.slice(-2)}</span>}
                    {student.pronouns && <span>• ({student.pronouns})</span>}
                  </div>
                  {student.major && (
                    <div className="text-[11px] text-slate-400 font-medium truncate max-w-[180px]">
                      {student.major}
                    </div>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
