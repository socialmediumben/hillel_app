'use client';

import React, { useState } from 'react';
import { Wrench, Database, CheckCircle2, AlertCircle, RefreshCw, Sparkles, Sliders, ExternalLink, Copy, Check } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { useConfig } from '@/context/ConfigContext';
import { testSheetConnection } from '@/lib/sheets';

export default function DeveloperPage() {
  const { config, updateConfig, resetConfig, isSandbox, toggleSandbox } = useConfig();

  // Local form state
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
  const [copiedScript, setCopiedScript] = useState(false);

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

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      appsScriptUrl: appsScriptUrl.trim(),
      sheetId: sheetId.trim(),
      orgName: orgName.trim() || 'Hillel',
      campusName: campusName.trim() || 'Campus Hillel',
      primaryColor: primaryColor.trim() || '#1d4ed8',
      logoUrl: logoUrl.trim(),
      stationId: stationId.trim() || 'front-desk-kiosk-01',
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const copyScriptInstructions = () => {
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Developer & Admin Settings</h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-500">
                Configure your linked Google Sheet, branding colors, and kiosk terminal identity.
              </p>
            </div>
          </div>

          {/* Sandbox Toggle Pill */}
          <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl self-start sm:self-auto">
            <button
              onClick={() => updateConfig({ isSandbox: false })}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                !isSandbox ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Live Sheet
            </button>
            <button
              onClick={() => updateConfig({ isSandbox: true })}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                isSandbox ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sandbox Mode
            </button>
          </div>
        </div>

        {savedSuccess && (
          <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 border border-emerald-300 p-4 rounded-2xl text-xs font-extrabold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        {/* Section 1: Google Sheet Connection */}
        <form onSubmit={handleSaveSettings} className="space-y-6">
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
                  Deploy the script located at <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">src/scripts/google_apps_script.gs</code> to your Google Sheet as a Web App ("Execute as Me", "Who has access: Anyone").
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

          {/* Section 2: Organization Branding & Kiosk Station */}
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
                  placeholder="e.g. Maryland Hillel"
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
              className="flex items-center space-x-2 px-8 py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-black rounded-2xl text-base shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
