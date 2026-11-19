'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, QrCode, Smartphone, CreditCard, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { useConfig } from '@/context/ConfigContext';
import { StudentProfile } from '@/lib/types';
import { KioskSignUpModal } from './KioskSignUpModal';

interface KioskSignUpQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newStudent: StudentProfile) => void;
  initialTapCard?: string;
}

export function KioskSignUpQrModal({ isOpen, onClose, onSuccess, initialTapCard }: KioskSignUpQrModalProps) {
  const { config } = useConfig();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [showManualForm, setShowManualForm] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowManualForm(false);
      return;
    }

    // Build the mobile registration URL
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      // Handle GitHub Pages path prefix if present (e.g. /hillel_app)
      const pathname = window.location.pathname;
      const basePath = pathname.includes('/hillel_app') ? '/hillel_app' : '';
      const params = new URLSearchParams();
      if (initialTapCard && initialTapCard.trim()) {
        params.set('card', initialTapCard.trim());
      }
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const fullUrl = `${origin}${basePath}/register/${queryString}`;
      setTargetUrl(fullUrl);

      // Generate crisp QR code
      QRCode.toDataURL(fullUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR code generation failed:', err));
    }
  }, [isOpen, initialTapCard]);

  if (!isOpen) return null;

  // Fallback to manual on-screen form if requested
  if (showManualForm) {
    return (
      <KioskSignUpModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={onSuccess}
        initialTapCard={initialTapCard}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative text-center space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Badge & Header */}
        <div>
          <div className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-700 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2">
            <Smartphone className="w-3.5 h-3.5 text-blue-600" />
            <span>Mobile Sign Up</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Scan to Join {config.orgName}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1 max-w-sm mx-auto">
            Point your phone camera at this QR code to fill out your student registration on your own device.
          </p>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center">
          <div className="p-3 bg-white border-2 border-slate-200 rounded-3xl shadow-lg inline-block">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Registration QR Code"
                className="w-56 h-56 sm:w-64 sm:h-64 rounded-2xl block"
              />
            ) : (
              <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center text-slate-400 text-xs font-bold">
                Generating QR code...
              </div>
            )}
          </div>

          {/* Tap Card Detected Pill */}
          {initialTapCard && (
            <div className="mt-4 inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-extrabold">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tap Card detected ({initialTapCard}) — will be linked automatically!</span>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2">
          <div className="flex items-center space-x-2.5 text-xs font-bold text-slate-700">
            <div className="w-5 h-5 rounded-full bg-blue-700 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0">
              1
            </div>
            <span>Open your phone's Camera app</span>
          </div>
          <div className="flex items-center space-x-2.5 text-xs font-bold text-slate-700">
            <div className="w-5 h-5 rounded-full bg-blue-700 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0">
              2
            </div>
            <span>Point camera at the QR code above</span>
          </div>
          <div className="flex items-center space-x-2.5 text-xs font-bold text-slate-700">
            <div className="w-5 h-5 rounded-full bg-blue-700 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0">
              3
            </div>
            <span>Tap the link to complete registration on your phone</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-3">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-slate-900 hover:bg-black text-white rounded-2xl text-base font-extrabold shadow-md transition-transform active:scale-95 cursor-pointer"
          >
            Finished / Close
          </button>

          <button
            type="button"
            onClick={() => setShowManualForm(true)}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            No smartphone? Sign up on this kiosk screen instead →
          </button>
        </div>
      </div>
    </div>
  );
}
