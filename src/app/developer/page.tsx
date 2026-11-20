'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wrench,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  ListChecks,
  Plus,
  Trash2,
  Check,
  Save,
  Table,
  FileText,
  RotateCcw,
  BookOpen,
  History,
  Tag,
  HelpCircle,
  QrCode,
  CreditCard,
  Sparkles,
  Terminal,
  Copy,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { useConfig } from '@/context/ConfigContext';
import { testSheetConnection } from '@/lib/sheets';
import {
  RegistrationFieldConfig,
  CheckInFieldConfig,
  DEFAULT_REGISTRATION_FIELDS,
  DEFAULT_CHECKIN_FIELDS,
  APP_VERSION,
  APP_BUILD_DATE
} from '@/lib/types';

export default function DeveloperPage() {
  const {
    config,
    updateConfig,
    resetConfig,
    isSandbox,
    isDevUnlocked,
    unlockDevMode,
    lockDevMode,
    updateRegistrationFields,
    updateCheckInFields,
    saveCloudConfig,
    isSavingCloud
  } = useConfig();

  // Active sub-tab: 'general' | 'signup_fields' | 'checkin_fields' | 'guide' | 'changelog'
  const [activeDevTab, setActiveDevTab] = useState<'general' | 'signup_fields' | 'checkin_fields' | 'guide' | 'changelog'>('general');

  // Password gate state
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // General settings state
  const [appsScriptUrl, setAppsScriptUrl] = useState(config.appsScriptUrl || '');
  const [sheetId, setSheetId] = useState(config.sheetId || '');
  const [orgName, setOrgName] = useState(config.orgName || '');
  const [campusName, setCampusName] = useState(config.campusName || '');
  const [primaryColor, setPrimaryColor] = useState(config.primaryColor || '#1d4ed8');
  const [logoUrl, setLogoUrl] = useState(config.logoUrl || '');
  const [stationId, setStationId] = useState(config.stationId || 'front-desk-kiosk-01');

  // Connection testing state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
    sheetName?: string;
    eventCount?: number;
    eventTitles?: string[];
  } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Configurable Sign-Up Fields State
  const [fieldsList, setFieldsList] = useState<RegistrationFieldConfig[]>(config.registrationFields || DEFAULT_REGISTRATION_FIELDS);
  const [newOptionInputs, setNewOptionInputs] = useState<Record<string, string>>({});
  const [customQuestionLabel, setCustomQuestionLabel] = useState('');
  const [customQuestionType, setCustomQuestionType] = useState<'text' | 'multiselect'>('text');
  const [fieldsSavedSuccess, setFieldsSavedSuccess] = useState(false);

  // Configurable Check-In Fields State
  const [checkInList, setCheckInList] = useState<CheckInFieldConfig[]>(config.checkInFields || DEFAULT_CHECKIN_FIELDS);
  const [checkInSavedSuccess, setCheckInSavedSuccess] = useState(false);

  // User Guide open sections state
  const [openGuideSection, setOpenGuideSection] = useState<string | null>('sheets_setup');
  const [copiedCode, setCopiedCode] = useState(false);

  // Sync state with config
  useEffect(() => {
    setAppsScriptUrl(config.appsScriptUrl || '');
    setSheetId(config.sheetId || '');
    setOrgName(config.orgName || '');
    setCampusName(config.campusName || '');
    setPrimaryColor(config.primaryColor || '#1d4ed8');
    setLogoUrl(config.logoUrl || '');
    setStationId(config.stationId || 'front-desk-kiosk-01');
    if (config.registrationFields && config.registrationFields.length > 0) {
      setFieldsList(config.registrationFields);
    }
    if (config.checkInFields && config.checkInFields.length > 0) {
      setCheckInList(config.checkInFields);
    }
  }, [config]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const success = unlockDevMode(passwordInput);
    if (!success) {
      setPasswordError(true);
    } else {
      setPasswordError(false);
      setPasswordInput('');
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSheetConnection(appsScriptUrl);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ ok: false, message: err.message || 'Request failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      appsScriptUrl: appsScriptUrl.trim(),
      sheetId: sheetId.trim(),
      orgName: orgName.trim() || 'Hillel',
      campusName: campusName.trim() || 'Campus Hillel',
      primaryColor: primaryColor.trim() || '#1d4ed8',
      logoUrl: logoUrl.trim(),
      stationId: stationId.trim() || 'front-desk-kiosk-01',
    };
    updateConfig(updated);
    await saveCloudConfig(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Sign-Up Fields Handlers
  const handleToggleFieldEnabled = (fieldId: string) => {
    setFieldsList((prev) =>
      prev.map((f) => {
        if (f.id === fieldId) {
          if (f.id === 'firstName' || f.id === 'lastName') return f;
          return { ...f, enabled: !f.enabled };
        }
        return f;
      })
    );
  };

  const handleToggleFieldRequired = (fieldId: string) => {
    setFieldsList((prev) =>
      prev.map((f) => {
        if (f.id === fieldId) {
          if (f.id === 'firstName' || f.id === 'lastName') return f;
          return { ...f, required: !f.required };
        }
        return f;
      })
    );
  };

  const handleUpdateFieldLabel = (fieldId: string, newLabel: string) => {
    setFieldsList((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, label: newLabel } : f))
    );
  };

  const handleUpdateFieldPlaceholder = (fieldId: string, newPlaceholder: string) => {
    setFieldsList((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, placeholder: newPlaceholder } : f))
    );
  };

  const handleAddOption = (fieldId: string) => {
    const val = (newOptionInputs[fieldId] || '').trim();
    if (!val) return;
    setFieldsList((prev) =>
      prev.map((f) => {
        if (f.id === fieldId) {
          const currentOpts = f.options || [];
          if (!currentOpts.includes(val)) {
            return { ...f, options: [...currentOpts, val] };
          }
        }
        return f;
      })
    );
    setNewOptionInputs((prev) => ({ ...prev, [fieldId]: '' }));
  };

  const handleRemoveOption = (fieldId: string, optToRemove: string) => {
    setFieldsList((prev) =>
      prev.map((f) => {
        if (f.id === fieldId) {
          return { ...f, options: (f.options || []).filter((o) => o !== optToRemove) };
        }
        return f;
      })
    );
  };

  const handleAddCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestionLabel.trim()) return;
    const newId = `custom_${Date.now()}`;
    const newField: RegistrationFieldConfig = {
      id: newId,
      label: customQuestionLabel.trim(),
      placeholder: 'Enter answer...',
      type: customQuestionType,
      enabled: true,
      required: false,
      options: customQuestionType === 'multiselect' ? ['Option 1', 'Option 2'] : undefined,
      isCustom: true,
    };
    setFieldsList((prev) => [...prev, newField]);
    setCustomQuestionLabel('');
  };

  const handleDeleteCustomQuestion = (fieldId: string) => {
    setFieldsList((prev) => prev.filter((f) => f.id !== fieldId));
  };

  const handleResetRegistrationFields = () => {
    if (window.confirm('Reset all sign-up fields back to standard Hillel defaults?')) {
      setFieldsList(DEFAULT_REGISTRATION_FIELDS);
    }
  };

  const handleSaveRegistrationFields = async () => {
    const ok = await updateRegistrationFields(fieldsList);
    if (ok) {
      setFieldsSavedSuccess(true);
      setTimeout(() => setFieldsSavedSuccess(false), 3000);
    }
  };

  // Check-In Columns Handlers
  const handleToggleCheckInCol = (key: string) => {
    if (key === 'checkInId' || key === 'timestamp' || key === 'date') return;
    setCheckInList((prev) =>
      prev.map((c) => (c.key === key ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const handleResetCheckInFields = () => {
    if (window.confirm('Reset check-in columns back to default?')) {
      setCheckInList(DEFAULT_CHECKIN_FIELDS);
    }
  };

  const handleSaveCheckInFields = async () => {
    const ok = await updateCheckInFields(checkInList);
    if (ok) {
      setCheckInSavedSuccess(true);
      setTimeout(() => setCheckInSavedSuccess(false), 3000);
    }
  };

  const toggleGuideSection = (id: string) => {
    setOpenGuideSection(openGuideSection === id ? null : id);
  };

  const copyAppsScriptLocation = () => {
    navigator.clipboard.writeText('src/scripts/google_apps_script.gs');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // If developer mode is locked, display password prompt
  if (!isDevUnlocked) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navigation />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 mx-auto flex items-center justify-center">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center justify-center space-x-2">
                <h1 className="text-2xl font-black text-slate-900">Developer & Admin Access</h1>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-black uppercase">
                  v{APP_VERSION}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Enter your administrative password to access developer settings and configuration.
              </p>
            </div>
            <form onSubmit={handleUnlock} className="space-y-4 text-left">
              <div>
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                  Developer Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setPasswordError(false);
                    }}
                    placeholder="Enter password..."
                    autoFocus
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs font-bold text-rose-600 mt-1.5 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Incorrect password. Please try again.</span>
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={!passwordInput.trim()}
                className="w-full py-3.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-black rounded-xl text-sm shadow-md transition-all cursor-pointer"
              >
                Unlock Developer Mode
              </button>
            </form>
            <div className="pt-2 border-t border-slate-100">
              <Link href="/" className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
                ← Return to Student Hub
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Top Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Developer & Admin Center</h1>
                <button
                  type="button"
                  onClick={() => setActiveDevTab('changelog')}
                  className="px-2.5 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-full text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                  title="View Changelog"
                >
                  v{APP_VERSION}
                </button>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-500">
                Configure sign-up questions, spreadsheet check-in columns, and cloud database settings.
              </p>
            </div>
          </div>

          {/* Sandbox Toggle & Lock Button */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => updateConfig({ isSandbox: false })}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  !isSandbox ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Live Sheet
              </button>
              <button
                type="button"
                onClick={() => updateConfig({ isSandbox: true })}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  isSandbox ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sandbox Mode
              </button>
            </div>

            <button
              type="button"
              onClick={lockDevMode}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-2xl text-xs font-black transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Lock Mode</span>
            </button>
          </div>
        </div>

        {/* Tab Selector: General, Sign-Up Fields, Check-In Columns, User Guide, Changelog */}
        <div className="flex items-center space-x-2 bg-slate-200/80 p-1.5 rounded-2xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveDevTab('general')}
            className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeDevTab === 'general' ? 'bg-blue-700 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>General & Database</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDevTab('signup_fields')}
            className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeDevTab === 'signup_fields' ? 'bg-blue-700 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Sign-Up Fields ({fieldsList.filter((f) => f.enabled).length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDevTab('checkin_fields')}
            className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeDevTab === 'checkin_fields' ? 'bg-blue-700 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Check-In Columns ({checkInList.filter((c) => c.enabled).length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDevTab('guide')}
            className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeDevTab === 'guide' ? 'bg-blue-700 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>User Guide</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDevTab('changelog')}
            className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeDevTab === 'changelog' ? 'bg-blue-700 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Changelog</span>
          </button>
        </div>

        {/* =========================================================================
            TAB 1: GENERAL & DATABASE
            ========================================================================= */}
        {activeDevTab === 'general' && (
          <form onSubmit={handleSaveGeneralSettings} className="space-y-6 animate-fade-in">
            {savedSuccess && (
              <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 border border-emerald-300 p-4 rounded-2xl text-xs font-extrabold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>General settings saved and synchronized to Google Sheet!</span>
              </div>
            )}

            {/* Google Sheet Connection */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Google Sheet Database Connection</h2>
                  <p className="text-xs text-slate-500 font-semibold">
                    Connect your live Google Sheet via the Google Apps Script Web App bridge.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                    Google Sheet Spreadsheet ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={sheetId}
                      onChange={(e) => setSheetId(e.target.value)}
                      placeholder="e.g. 1vRSAacNlDyCs7Fs0gEXiTtkO8vzcoXmZbWvHFqm1zm0"
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-colors"
                    >
                      <span>Open Sheet</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                    Google Apps Script Web App URL
                  </label>
                  <input
                    type="url"
                    value={appsScriptUrl}
                    onChange={(e) => setAppsScriptUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    This URL connects your front-end apps to your spreadsheet automatically across all devices.
                  </p>
                </div>

                {/* Test Connection Button */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting || !appsScriptUrl.trim()}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Testing Connection...</span>
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4" />
                        <span>Test Sheet Connection</span>
                      </>
                    )}
                  </button>

                  {testResult && (
                    <div
                      className={`flex items-center space-x-2 text-xs font-bold px-3 py-2 rounded-xl border ${
                        testResult.ok
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {testResult.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                      <span>{testResult.message} {testResult.sheetName ? `("${testResult.sheetName}")` : ''}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Organization Branding & Kiosk Station */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Organization & Branding</h2>
                  <p className="text-xs text-slate-500 font-semibold">
                    Customize the organization display names, logo, and theme color.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Hillel"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                    Campus / Chapter Name
                  </label>
                  <input
                    type="text"
                    value={campusName}
                    onChange={(e) => setCampusName(e.target.value)}
                    placeholder="e.g. Campus Hillel"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                    Primary Theme Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-11 p-1 bg-white border border-slate-200 rounded-xl cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                    Kiosk Station ID
                  </label>
                  <input
                    type="text"
                    value={stationId}
                    onChange={(e) => setStationId(e.target.value)}
                    placeholder="e.g. front-desk-kiosk-01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                  Custom Logo URL (SVG or PNG)
                </label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.svg"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Save Action */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={resetConfig}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 underline cursor-pointer"
              >
                Reset to Defaults
              </button>
              <button
                type="submit"
                disabled={isSavingCloud}
                className="flex items-center space-x-2 px-8 py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-black rounded-2xl text-base shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSavingCloud ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                <span>Save General Settings</span>
              </button>
            </div>
          </form>
        )}

        {/* =========================================================================
            TAB 2: SIGN-UP FORM FIELDS CUSTOMIZER
            ========================================================================= */}
        {activeDevTab === 'signup_fields' && (
          <div className="space-y-6 animate-fade-in">
            {fieldsSavedSuccess && (
              <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 border border-emerald-300 p-4 rounded-2xl text-xs font-extrabold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>Sign-up form configuration saved and synchronized across all devices!</span>
              </div>
            )}

            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Student Sign-Up Fields</h2>
                  <p className="text-xs text-slate-500 font-semibold">
                    Toggle which questions are asked on the mobile QR registration form and kiosk sign-up modal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetRegistrationFields}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Fields</span>
                </button>
              </div>

              {/* Fields List */}
              <div className="space-y-4">
                {fieldsList.map((f) => (
                  <div
                    key={f.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      f.enabled ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-200/60 bg-slate-50/70 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center space-x-3">
                        {/* Enabled Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleFieldEnabled(f.id)}
                          disabled={f.id === 'firstName' || f.id === 'lastName'}
                          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                            f.enabled ? 'bg-blue-700' : 'bg-slate-300'
                          } ${f.id === 'firstName' || f.id === 'lastName' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                              f.enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>

                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-sm text-slate-900">{f.label}</span>
                          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {f.type}
                          </span>
                          {f.isCustom && (
                            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                              Custom Question
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Required / Optional Toggle & Delete Custom */}
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => handleToggleFieldRequired(f.id)}
                          disabled={!f.enabled || f.id === 'firstName' || f.id === 'lastName'}
                          className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            f.required
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-500 hover:text-slate-800'
                          } ${!f.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {f.required ? 'Required *' : 'Optional'}
                        </button>

                        {f.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomQuestion(f.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete custom question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Field Editing (Labels & Placeholders) */}
                    {f.enabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                            Field Label
                          </label>
                          <input
                            type="text"
                            value={f.label}
                            onChange={(e) => handleUpdateFieldLabel(f.id, e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:bg-white focus:border-blue-600 focus:outline-none"
                          />
                        </div>
                        {f.type !== 'multiselect' && f.type !== 'select' && (
                          <div>
                            <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                              Placeholder / Helper Text
                            </label>
                            <input
                              type="text"
                              value={f.placeholder || ''}
                              onChange={(e) => handleUpdateFieldPlaceholder(f.id, e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:bg-white focus:border-blue-600 focus:outline-none"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tag Options Editor for Multi-Select Lists (Dietary & Interests) */}
                    {f.enabled && f.options && (
                      <div className="pt-3 border-t border-slate-100 mt-3 space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 block">
                          Selectable Options / Tags ({f.options.length})
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {f.options.map((opt) => (
                            <span
                              key={opt}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-xs font-bold"
                            >
                              <span>{opt}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(f.id, opt)}
                                className="text-blue-400 hover:text-rose-600 ml-1 font-black cursor-pointer"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>

                        {/* Add Option Input */}
                        <div className="flex gap-2 max-w-sm pt-1">
                          <input
                            type="text"
                            value={newOptionInputs[f.id] || ''}
                            onChange={(e) =>
                              setNewOptionInputs((prev) => ({ ...prev, [f.id]: e.target.value }))
                            }
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption(f.id))}
                            placeholder="Add new tag option..."
                            className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddOption(f.id)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Custom Question Card */}
              <div className="p-5 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-3">
                <div className="flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-blue-700" />
                  <h3 className="text-sm font-black text-blue-900 uppercase tracking-wider">
                    Add a Custom Sign-Up Question
                  </h3>
                </div>
                <form onSubmit={handleAddCustomQuestion} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={customQuestionLabel}
                    onChange={(e) => setCustomQuestionLabel(e.target.value)}
                    placeholder="e.g. Instagram Handle, Campus Dorm, etc."
                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                  <select
                    value={customQuestionType}
                    onChange={(e) => setCustomQuestionType(e.target.value as any)}
                    className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="text">Text Input</option>
                    <option value="multiselect">Multi-Select Tags</option>
                  </select>
                  <button
                    type="submit"
                    disabled={!customQuestionLabel.trim()}
                    className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                  >
                    Add Question
                  </button>
                </form>
              </div>

              {/* Save Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveRegistrationFields}
                  disabled={isSavingCloud}
                  className="flex items-center space-x-2 px-8 py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-black rounded-2xl text-base shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isSavingCloud ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  <span>Save & Sync Sign-Up Fields</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: CHECK-IN COLUMNS CUSTOMIZER
            ========================================================================= */}
        {activeDevTab === 'checkin_fields' && (
          <div className="space-y-6 animate-fade-in">
            {checkInSavedSuccess && (
              <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 border border-emerald-300 p-4 rounded-2xl text-xs font-extrabold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>Check-in spreadsheet columns saved and synchronized across all kiosks!</span>
              </div>
            )}

            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Attendance Check-In Spreadsheet Columns</h2>
                  <p className="text-xs text-slate-500 font-semibold">
                    Choose what student data and event metadata gets recorded in the <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">Attendance_CheckIns</code> Google Sheet tab on each check-in.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetCheckInFields}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Columns</span>
                </button>
              </div>

              {/* Checklist Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {checkInList.map((col) => {
                  const isLocked = col.key === 'checkInId' || col.key === 'timestamp' || col.key === 'date';
                  return (
                    <div
                      key={col.key}
                      onClick={() => !isLocked && handleToggleCheckInCol(col.key)}
                      className={`p-4 rounded-2xl border transition-all flex items-start space-x-3 ${
                        isLocked
                          ? 'border-slate-200 bg-slate-50 opacity-80 cursor-not-allowed'
                          : col.enabled
                          ? 'border-blue-300 bg-blue-50/40 cursor-pointer shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={col.enabled}
                        disabled={isLocked}
                        onChange={() => {}}
                        className="w-4 h-4 mt-1 rounded text-blue-700 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-sm text-slate-900">{col.columnHeader}</span>
                          {isLocked && (
                            <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                              Core
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">{col.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Live Spreadsheet Row Preview */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2">
                  <Table className="w-4 h-4 text-blue-700" />
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Live Spreadsheet Row Preview ({checkInList.filter((c) => c.enabled).length} Columns Enabled)
                  </h3>
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-blue-700 text-white font-mono text-[11px]">
                        {checkInList
                          .filter((c) => c.enabled)
                          .map((c) => (
                            <th key={c.key} className="px-3 py-2 border-r border-blue-600 whitespace-nowrap">
                              {c.columnHeader}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-slate-600 font-medium border-t border-slate-100 text-[11px]">
                        {checkInList
                          .filter((c) => c.enabled)
                          .map((c) => {
                            let sample = '...';
                            if (c.key === 'checkInId') sample = 'chk_1732060800';
                            if (c.key === 'timestamp') sample = '2026-11-19T18:00:00Z';
                            if (c.key === 'date') sample = '2026-11-19';
                            if (c.key === 'studentId') sample = 'HIL-1042';
                            if (c.key === 'studentName') sample = 'Sarah Cohen';
                            if (c.key === 'tapCard') sample = '1414309466';
                            if (c.key === 'eventId') sample = 'evt_shabbat_01';
                            if (c.key === 'eventName') sample = 'Community Shabbat';
                            if (c.key === 'stationId') sample = 'kiosk-01';
                            if (c.key === 'email') sample = 'sarah@campus.edu';
                            if (c.key === 'phone') sample = '(555) 234-5678';
                            if (c.key === 'classYear') sample = '2027';
                            if (c.key === 'major') sample = 'Biology';
                            if (c.key === 'dietaryRestrictions') sample = 'Vegetarian';
                            if (c.key === 'interests') sample = 'Shabbat, Bagels';
                            return (
                              <td key={c.key} className="px-3 py-2 border-r border-slate-100 whitespace-nowrap font-mono text-[10px]">
                                {sample}
                              </td>
                            );
                          })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveCheckInFields}
                  disabled={isSavingCloud}
                  className="flex items-center space-x-2 px-8 py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-black rounded-2xl text-base shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isSavingCloud ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  <span>Save & Sync Check-In Columns</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: USER GUIDE
            ========================================================================= */}
        {activeDevTab === 'guide' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fade-in text-left">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-2xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Administrator & Developer User Guide</h2>
                <p className="text-xs text-slate-500 font-semibold">
                  Complete operational manual for managing sheets, onboarding forms, NFC tap cards, and kiosk terminals.
                </p>
              </div>
            </div>

            {/* Guide Sections Accordion */}
            <div className="space-y-4 text-xs sm:text-sm">
              {/* Section 1: Google Sheets Architecture */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleGuideSection('sheets_setup')}
                  className="w-full p-4 bg-slate-50 hover:bg-blue-50/50 flex items-center justify-between text-left font-black text-slate-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span>1. Google Sheets Database & Architecture</span>
                  </div>
                  {openGuideSection === 'sheets_setup' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openGuideSection === 'sheets_setup' && (
                  <div className="p-5 space-y-3 bg-white text-slate-600 border-t border-slate-100 leading-relaxed">
                    <p>
                      Your Google Sheet (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px] text-slate-800">{config.sheetId}</code>) acts as your core CRM database. The application operates across 5 dedicated sheet tabs:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs">
                      <li>
                        <strong><code>App Events</code></strong>: Lists all campus programs. Columns: <code className="text-slate-800">Event_ID, Title, Date, Start_Time, End_Time, Location, Description, Category, Active</code>. You can add or edit events directly in the sheet!
                      </li>
                      <li>
                        <strong><code>Students_Directory</code></strong>: Student contact profiles. Columns: <code className="text-slate-800">Contact_ID, Tap_Card_ID, First_Name, Last_Name, Preferred_Name, Pronouns, Email, Phone, Class_Year, Major, Dietary_Restrictions, Interests, Created_At</code>.
                      </li>
                      <li>
                        <strong><code>Attendance_CheckIns</code></strong>: Event and kiosk attendance records. Logs: <code className="text-slate-800">CheckIn_ID, Timestamp, Date, Contact_ID, Student_Name, Tap_Card_ID, Event_ID, Event_Name, Station_ID</code>, plus any additional columns you enable in the Check-In Columns customizer!
                      </li>
                      <li>
                        <strong><code>Event_RSVPs</code></strong>: Stores 1-click student RSVPs from the mobile events calendar.
                      </li>
                      <li>
                        <strong><code>App_Config</code></strong>: Key/Value store that saves your custom form questions and check-in columns directly in the sheet.
                      </li>
                    </ul>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs">
                      <strong>How to Deploy or Update the Script:</strong> Open your Google Sheet &gt; Extensions &gt; Apps Script. Paste the code from <code className="font-mono bg-blue-100 px-1 py-0.5 rounded">src/scripts/google_apps_script.gs</code>. Run <code className="font-mono font-bold">initializeSheets</code>, then Deploy &gt; New deployment &gt; Web app (Execute as: <strong>Me</strong>, Access: <strong>Anyone</strong>).
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Form Fields Customizer */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleGuideSection('form_customizer')}
                  className="w-full p-4 bg-slate-50 hover:bg-blue-50/50 flex items-center justify-between text-left font-black text-slate-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span>2. Customizing Student Sign-Up Questions</span>
                  </div>
                  {openGuideSection === 'form_customizer' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openGuideSection === 'form_customizer' && (
                  <div className="p-5 space-y-3 bg-white text-slate-600 border-t border-slate-100 leading-relaxed">
                    <p>
                      You have full no-code control over what new students see when registering at <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px] text-slate-800">/register</code> or on the kiosk:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs">
                      <li>
                        <strong>Toggle Visibility</strong>: Use the switch on any field to turn it on or off. Disabled fields are immediately hidden from both the mobile QR sign-up and kiosk modals.
                      </li>
                      <li>
                        <strong>Required vs Optional</strong>: Toggle whether students must fill out a question to complete registration. Required fields show a red asterisk <span className="text-rose-600 font-bold">*</span> and block submission if left blank.
                      </li>
                      <li>
                        <strong>Customizing Tags (Dietary & Interests)</strong>: For multi-select fields, click <span className="text-rose-500 font-bold">✕</span> on any tag to remove it, or type a new tag name into the input and click <strong>+ Add</strong>.
                      </li>
                      <li>
                        <strong>Adding Custom Questions</strong>: Use the "Add a Custom Sign-Up Question" box to ask campus-specific questions (e.g. <em>Instagram Handle</em>, <em>Campus Dorm</em>, <em>Graduation Semester</em>).
                      </li>
                      <li>
                        <strong>Cloud Sync</strong>: Clicking <strong>Save & Sync Sign-Up Fields</strong> automatically updates the Google Sheet so all devices load the new questions instantly.
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Section 3: Check-In Columns Customizer */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleGuideSection('checkin_columns')}
                  className="w-full p-4 bg-slate-50 hover:bg-blue-50/50 flex items-center justify-between text-left font-black text-slate-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <Table className="w-4 h-4 text-indigo-600" />
                    <span>3. Customizing Attendance Check-In Columns</span>
                  </div>
                  {openGuideSection === 'checkin_columns' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openGuideSection === 'checkin_columns' && (
                  <div className="p-5 space-y-3 bg-white text-slate-600 border-t border-slate-100 leading-relaxed">
                    <p>
                      When a student checks in at the front desk kiosk or on a mobile check-in link, you can choose exactly what data is recorded:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs">
                      <li>
                        <strong>Core Columns</strong>: <code className="text-slate-800">CheckIn_ID, Timestamp, Date</code> are always recorded to maintain chronological audit trails.
                      </li>
                      <li>
                        <strong>Optional Metadata</strong>: Check or uncheck <code className="text-slate-800">Email, Phone, Class_Year, Major, Dietary_Restrictions, Interests, Station_ID</code> to log these directly alongside attendance.
                      </li>
                      <li>
                        <strong>Automatic Sheet Header Creation</strong>: If you enable a column that does not yet exist in your <code className="text-slate-800">Attendance_CheckIns</code> sheet, the Apps Script backend will automatically add the new column header with a blue bold format upon the next check-in!
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Section 4: NFC Tap Cards & Badges */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleGuideSection('nfc_cards')}
                  className="w-full p-4 bg-slate-50 hover:bg-blue-50/50 flex items-center justify-between text-left font-black text-slate-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    <span>4. NFC Tap Cards & Hardware Integration</span>
                  </div>
                  {openGuideSection === 'nfc_cards' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openGuideSection === 'nfc_cards' && (
                  <div className="p-5 space-y-3 bg-white text-slate-600 border-t border-slate-100 leading-relaxed">
                    <p>
                      The platform supports physical RFID/NFC cards, silicone wristbands, keyfobs, and stickers (Mifare Classic, Mifare Ultralight, NTAG213/215/216, 13.56MHz):
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs">
                      <li>
                        <strong>Phone NFC (Android Chrome)</strong>: Tapping <em>"Tap Card to Back of Phone"</em> activates Chromium Web NFC (<code className="text-slate-800">NDEFReader</code>) directly in the browser with haptic vibration and chime.
                      </li>
                      <li>
                        <strong>Front Desk Kiosk Readers</strong>: USB or Bluetooth desktop RFID readers (such as ACR122U or keyboard-emulating card wedges) type the card ID into the search bar automatically.
                      </li>
                      <li>
                        <strong>Self-Service Card Linking</strong>: Authenticated students can navigate to their digital pass at <code className="text-slate-800">app.hillel818.org</code>, click <strong>Link / Update Tap Card</strong>, and bind their card to their account anytime.
                      </li>
                      <li>
                        <strong>Unlinking Lost Cards</strong>: If a card is lost, clicking <strong>Unlink Current Card</strong> clears it safely from their account.
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Section 5: Front Desk Kiosk Operations */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleGuideSection('kiosk_ops')}
                  className="w-full p-4 bg-slate-50 hover:bg-blue-50/50 flex items-center justify-between text-left font-black text-slate-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <QrCode className="w-4 h-4 text-amber-600" />
                    <span>5. Front Desk Kiosk Operations & Thermal Printing</span>
                  </div>
                  {openGuideSection === 'kiosk_ops' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openGuideSection === 'kiosk_ops' && (
                  <div className="p-5 space-y-3 bg-white text-slate-600 border-t border-slate-100 leading-relaxed">
                    <p>
                      The Kiosk (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px] text-slate-800">kiosk.hillel818.org</code>) is optimized for touchscreens, iPads, Android tablets, or front desk laptops:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs">
                      <li>
                        <strong>90-Second Auto-Reset</strong>: If an authenticated student walks away without signing out, the kiosk automatically clears the session after 90 seconds to preserve privacy.
                      </li>
                      <li>
                        <strong>Check-In Options</strong>: Tapping a card opens today's event check-in options (e.g. <em>Community Shabbat Dinner</em>, <em>Bagels &amp; Schmear</em>, or <em>General Visit &amp; Study Lounge</em>).
                      </li>
                      <li>
                        <strong>2" x 3" Thermal Nametag Printing</strong>: Formatted for standard desktop label printers (Zebra, Rollo, Brother, MUNBYN). Prints auto-scaling Preferred Name, Pronouns, and Interests.
                      </li>
                      <li>
                        <strong>Contactless QR Sign-Up</strong>: When a first-time student taps <em>First Time? Sign Up Here</em>, the kiosk generates a QR code linking to <code className="text-slate-800">/register?card=&lt;CARD_ID&gt;</code> so they can complete sign-up on their own phone while keeping the kiosk line moving!
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Section 6: Domains & Security */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleGuideSection('domains_security')}
                  className="w-full p-4 bg-slate-50 hover:bg-blue-50/50 flex items-center justify-between text-left font-black text-slate-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-rose-600" />
                    <span>6. Domain Routing & Security</span>
                  </div>
                  {openGuideSection === 'domains_security' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openGuideSection === 'domains_security' && (
                  <div className="p-5 space-y-3 bg-white text-slate-600 border-t border-slate-100 leading-relaxed">
                    <ul className="list-disc pl-5 space-y-1.5 text-xs">
                      <li>
                        <strong>Student App</strong>: <a href="https://app.hillel818.org" target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold">https://app.hillel818.org/</a> (CNAME pointing to <code className="text-slate-800">socialmediumben.github.io</code>).
                      </li>
                      <li>
                        <strong>Kiosk Station</strong>: <a href="https://kiosk.hillel818.org" target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold">https://kiosk.hillel818.org/</a> (Configured on Squarespace DNS with a 301 forwarding rule to <code className="text-slate-800">https://app.hillel818.org/kiosk/</code>).
                      </li>
                      <li>
                        <strong>Developer Password</strong>: Access to this developer panel is secured by password <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-900">Plummer17729!</code>. Click <strong>Lock Mode</strong> in the top right to end your session.
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: CHANGELOG & VERSION HISTORY
            ========================================================================= */}
        {activeDevTab === 'changelog' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fade-in text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-2xl">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Platform Changelog & Release Notes</h2>
                  <p className="text-xs text-slate-500 font-semibold">
                    Current Version: <span className="font-bold text-slate-800">v{APP_VERSION}</span> • Build Date: <span className="font-bold text-slate-800">{APP_BUILD_DATE}</span>
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-black rounded-full text-xs uppercase tracking-wider self-start sm:self-auto">
                Stable Release
              </span>
            </div>

            {/* Releases Timeline */}
            <div className="space-y-6">
              {/* Release v2.4.0 */}
              <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/20 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 bg-blue-700 text-white rounded-xl text-xs font-black">
                      v2.4.0
                    </span>
                    <span className="text-xs font-bold text-slate-500">November 19, 2026</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase">
                      Current
                    </span>
                  </div>
                  <span className="text-xs font-bold text-blue-700">Dynamic Field Customizer &amp; Cloud Config</span>
                </div>
                <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                  <li><strong>Sign-Up Fields Customizer</strong>: Admin control in Developer Mode to toggle fields on/off, set required/optional, edit labels, and customize Dietary &amp; Interests tag options.</li>
                  <li><strong>Custom Sign-Up Questions</strong>: Added ability to add custom questions (text inputs or tag chips) to the registration form.</li>
                  <li><strong>Check-In Columns Customizer</strong>: Select which student metadata (Email, Phone, Major, Class Year, etc.) is posted to the spreadsheet, with live table preview.</li>
                  <li><strong>No-Code Google Sheet Sync</strong>: Saves configuration to the <code className="text-slate-800">App_Config</code> tab and syncs across all devices automatically.</li>
                  <li><strong>Intelligent Column Creation</strong>: Updated Apps Script backend to automatically create missing column headers in <code className="text-slate-800">Attendance_CheckIns</code>.</li>
                  <li><strong>Interactive Developer User Guide</strong>: Built full user manual and changelog directly into Developer Mode.</li>
                </ul>
              </div>

              {/* Release v2.3.0 */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 bg-slate-800 text-white rounded-xl text-xs font-black">
                      v2.3.0
                    </span>
                    <span className="text-xs font-bold text-slate-500">November 19, 2026</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700">Permanent Cloud Connection &amp; Self-Healing</span>
                </div>
                <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                  <li><strong>Permanent Web App Baking</strong>: Embedded canonical Apps Script Web App URL into <code className="text-slate-800">DEFAULT_CONFIG</code> and build environment.</li>
                  <li><strong>Self-Healing Cache</strong>: Automatically migrates any device with a blank local URL to the canonical live sheet connector.</li>
                  <li><strong>Column Order Resilience</strong>: Frontend date/title parser automatically handles varied column ordering from Google Sheets.</li>
                </ul>
              </div>

              {/* Release v2.2.0 */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 bg-slate-800 text-white rounded-xl text-xs font-black">
                      v2.2.0
                    </span>
                    <span className="text-xs font-bold text-slate-500">November 19, 2026</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700">Profile NFC Tap Card Management</span>
                </div>
                <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                  <li><strong>Student Self-Service Card Linking</strong>: Added prominent "Link / Update Tap Card" module into the student digital pass.</li>
                  <li><strong>Web NFC Phone Scanning</strong>: Students can tap physical cards against the back of their phone on Android Chrome with haptic buzz and chime.</li>
                  <li><strong>Manual Entry &amp; Unlinking</strong>: Supported typing Card UID and unlinking lost cards.</li>
                </ul>
              </div>

              {/* Release v2.1.0 */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 bg-slate-800 text-white rounded-xl text-xs font-black">
                      v2.1.0
                    </span>
                    <span className="text-xs font-bold text-slate-500">November 19, 2026</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700">Streamlined Student Hub &amp; Gate</span>
                </div>
                <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                  <li><strong>Sign-In Gate</strong>: Greets unauthenticated visitors with Card Tap, Tap ID, or Last Name search.</li>
                  <li><strong>Tabbed Experience</strong>: Clean switch between "My Profile" and "Events Calendar" once logged in.</li>
                  <li><strong>Clean Navigation</strong>: Removed redundant Profile and Kiosk tabs from the student navigation bar.</li>
                </ul>
              </div>

              {/* Release v2.0.0 */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 bg-slate-800 text-white rounded-xl text-xs font-black">
                      v2.0.0
                    </span>
                    <span className="text-xs font-bold text-slate-500">November 19, 2026</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700">Mobile QR Kiosk Onboarding &amp; Custom Domains</span>
                </div>
                <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                  <li><strong>Custom Domains</strong>: Live at <code className="text-slate-800">app.hillel818.org</code> with 301 forwarding from <code className="text-slate-800">kiosk.hillel818.org</code>.</li>
                  <li><strong>Kiosk QR Mobile Sign-Up</strong>: Kiosk shows an on-screen QR code linking to mobile registration with card binding.</li>
                  <li><strong>Password Protection</strong>: Secured Developer Mode behind password <code className="text-slate-800">Plummer17729!</code>.</li>
                  <li><strong>Mock Data Purge</strong>: Removed all sample data and test events.</li>
                </ul>
              </div>

              {/* Release v1.0.0 */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 bg-slate-800 text-white rounded-xl text-xs font-black">
                      v1.0.0
                    </span>
                    <span className="text-xs font-bold text-slate-500">November 19, 2026</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700">Initial Hillel Platform Launch</span>
                </div>
                <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                  <li>Initial port from makerspace architecture to Hillel campus operations.</li>
                  <li>Google Sheet backend with Google Apps Script Web App connector.</li>
                  <li>Front desk check-in kiosk with 2" x 3" printable thermal label nametags.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}