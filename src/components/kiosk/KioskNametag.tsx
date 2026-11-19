'use client';

import React from 'react';
import { Printer } from 'lucide-react';
import { StudentProfile, getStudentDisplayName } from '@/lib/types';
import { useConfig } from '@/context/ConfigContext';

interface KioskNametagProps {
  student: StudentProfile;
  onPrint?: () => void;
}

export function KioskNametag({ student, onPrint }: KioskNametagProps) {
  const { config } = useConfig();
  const displayName = getStudentDisplayName(student);

  // Dynamic font sizing for long names
  const nameLength = displayName.length;
  let nameClass = '';
  if (nameLength > 18) {
    nameClass = 'very-long-name';
  } else if (nameLength > 12) {
    nameClass = 'long-name';
  }

  const interestsList = Array.isArray(student.interests)
    ? student.interests.filter(Boolean).join(', ')
    : student.interests || '';

  const handlePrint = () => {
    if (onPrint) onPrint();
    window.print();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* On-Screen Preview */}
      <div className="nametag-preview-wrap">
        <div className="nametag-card shadow-xl">
          <div className="nametag-header">
            <div>
              <div className={`nametag-name ${nameClass}`}>{displayName}</div>
              {student.pronouns && (
                <div className="nametag-pronouns">({student.pronouns})</div>
              )}
            </div>
            <div className="text-right">
              <span className="nametag-org">{config.orgName}</span>
              {student.classYear && (
                <div className="text-xs font-bold text-slate-500">'{student.classYear.slice(-2)}</div>
              )}
            </div>
          </div>

          <div className="nametag-body">
            {interestsList && (
              <>
                <div className="nametag-nerdy-label">Interests & Passions</div>
                <div className="nametag-interests">{interestsList}</div>
              </>
            )}
          </div>

          <div className="nametag-footer">
            <span>{config.campusName}</span>
            <span>Welcome!</span>
          </div>
        </div>
      </div>

      {/* Print Button */}
      <div className="mt-4 no-print flex justify-center">
        <button
          onClick={handlePrint}
          className="flex items-center justify-center space-x-2 w-full py-4 bg-blue-700 hover:bg-blue-800 text-white rounded-2xl text-xl font-bold shadow-lg transition-transform active:scale-95 cursor-pointer"
        >
          <Printer className="w-6 h-6" />
          <span>Print Nametag</span>
        </button>
      </div>

      {/* Hidden print payload that activates exclusively under @media print */}
      <div id="nametag-to-print">
        <div className="nametag-preview-wrap">
          <div className="nametag-card">
            <div className="nametag-header">
              <div>
                <div className={`nametag-name ${nameClass}`}>{displayName}</div>
                {student.pronouns && (
                  <div className="nametag-pronouns">({student.pronouns})</div>
                )}
              </div>
              <div className="text-right">
                <span className="nametag-org">{config.orgName}</span>
                {student.classYear && (
                  <div className="text-xs font-bold text-slate-500">'{student.classYear.slice(-2)}</div>
                )}
              </div>
            </div>

            <div className="nametag-body">
              {interestsList && (
                <>
                  <div className="nametag-nerdy-label">Interests & Passions</div>
                  <div className="nametag-interests">{interestsList}</div>
                </>
              )}
            </div>

            <div className="nametag-footer">
              <span>{config.campusName}</span>
              <span>Welcome!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
