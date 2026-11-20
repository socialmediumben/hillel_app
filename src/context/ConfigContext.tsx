'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppConfig } from '@/lib/types';

export const CANONICAL_APPS_SCRIPT_URL =
  process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbyg3ZTZnTTq-KrVSyjxukEdp5lrkwGouTVY6w1sewMtk7_VVUmIQI3e35i2BM64scUG/exec';

const DEFAULT_CONFIG: AppConfig = {
  orgName: 'Hillel',
  campusName: 'Campus Hillel',
  logoUrl: '',
  primaryColor: '#1d4ed8', // Hillel Blue
  sheetId: '1vRSAacNlDyCs7Fs0gEXiTtkO8vzcoXmZbWvHFqm1zm0',
  appsScriptUrl: CANONICAL_APPS_SCRIPT_URL,
  isSandbox: false, // Default to live spreadsheet data
  stationId: 'front-desk-kiosk-01',
};

interface ConfigContextType {
  config: AppConfig;
  updateConfig: (partial: Partial<AppConfig>) => void;
  resetConfig: () => void;
  isSandbox: boolean;
  toggleSandbox: () => void;
  isDevUnlocked: boolean;
  unlockDevMode: (password: string) => boolean;
  lockDevMode: () => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const LS_CONFIG_KEY = 'hillel_app_config';
const DEV_MODE_PASSWORD = 'Plummer17729!';
const SS_DEV_UNLOCKED_KEY = 'hillel_dev_unlocked';

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDevUnlocked, setIsDevUnlocked] = useState(false);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(LS_CONFIG_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Ensure canonical Apps Script URL is used if cache is empty or legacy
        if (!parsed.appsScriptUrl || !parsed.appsScriptUrl.trim()) {
          parsed.appsScriptUrl = CANONICAL_APPS_SCRIPT_URL;
        }
        // Default isSandbox to false unless explicitly forced
        setConfig((prev) => ({ ...prev, ...parsed, isSandbox: false }));
      } else {
        setConfig(DEFAULT_CONFIG);
      }
      const unlocked = sessionStorage.getItem(SS_DEV_UNLOCKED_KEY) === 'true';
      if (unlocked) setIsDevUnlocked(true);
    } catch (_) {}
    setIsLoaded(true);
  }, []);

  const unlockDevMode = (password: string): boolean => {
    if (password === DEV_MODE_PASSWORD) {
      setIsDevUnlocked(true);
      try {
        sessionStorage.setItem(SS_DEV_UNLOCKED_KEY, 'true');
      } catch (_) {}
      return true;
    }
    return false;
  };

  const lockDevMode = () => {
    setIsDevUnlocked(false);
    try {
      sessionStorage.removeItem(SS_DEV_UNLOCKED_KEY);
    } catch (_) {}
  };

  const updateConfig = (partial: Partial<AppConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(LS_CONFIG_KEY, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
    try {
      localStorage.setItem(LS_CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG));
    } catch (_) {}
  };

  const toggleSandbox = () => {
    updateConfig({ isSandbox: !config.isSandbox });
  };

  return (
    <ConfigContext.Provider
      value={{
        config,
        updateConfig,
        resetConfig,
        isSandbox: config.isSandbox,
        toggleSandbox,
        isDevUnlocked,
        unlockDevMode,
        lockDevMode,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
