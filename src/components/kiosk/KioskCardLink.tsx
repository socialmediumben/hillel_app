'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { StudentProfile } from '@/lib/types';
import { useConfig } from '@/context/ConfigContext';
import { linkCardToStudent } from '@/lib/sheets';
import { normalizeNfcTapCard, isWebNfcSupported, startNfcScanner } from '@/lib/hardware';

interface KioskCardLinkProps {
  student: StudentProfile;
  onCardUpdated: (newCardId: string) => void;
}

export function KioskCardLink({ student, onCardUpdated }: KioskCardLinkProps) {
  const { config } = useConfig();
  const [inputCard, setInputCard] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isNfcListening, setIsNfcListening] = useState(false);

  // Background Web NFC scanning for quick badge tapping
  useEffect(() => {
    let stopListening: (() => void) | null = null;

    if (isWebNfcSupported()) {
      startNfcScanner({
        onScan: (scanned) => {
          setInputCard(scanned);
          handleLink(scanned);
        },
        onError: () => setIsNfcListening(false),
      })
        .then((cleanup) => {
          stopListening = cleanup;
          setIsNfcListening(true);
        })
        .catch(() => setIsNfcListening(false));
    }

    return () => {
      if (stopListening) stopListening();
    };
  }, [student.id]);

  const handleLink = async (cardToLink?: string) => {
    const cardId = normalizeNfcTapCard(cardToLink || inputCard);
    if (!cardId) {
      setErrorMsg('Please tap or enter a card number.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await linkCardToStudent(student.id, cardId, config);
      if (res.success) {
        setSuccessMsg(`Card ${cardId} successfully linked to your account!`);
        onCardUpdated(cardId);
      } else {
        setErrorMsg(res.error || 'Failed to link card.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error linking card.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-left">
      <div className="flex items-center space-x-2.5 mb-3">
        <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
          <CreditCard className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-black text-slate-800 text-lg">Link or Update Tap Card</h3>
          <p className="text-xs text-slate-500 font-semibold">
            {student.tapCard ? `Currently linked card: ${student.tapCard}` : 'No card currently linked'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputCard}
            onChange={(e) => setInputCard(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLink()}
            placeholder={isNfcListening ? 'Tap card to reader or type ID...' : 'Enter Card UID or Student ID...'}
            className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm font-bold focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => handleLink()}
            disabled={isLoading}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Link Card'}
          </button>
        </div>

        {isNfcListening && (
          <p className="text-[11px] font-semibold text-emerald-600 flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block mr-1" />
            NFC card reader active — ready to tap your card.
          </p>
        )}

        {successMsg && (
          <div className="flex items-center space-x-2 text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center space-x-2 text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 text-xs font-bold">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
