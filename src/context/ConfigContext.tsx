'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AppConfig,
  RegistrationFieldConfig,
  CheckInFieldConfig,
  DEFAULT_REGISTRATION_FIELDS,
  DEFAULT_CHECKIN_FIELDS,
} from '@/lib/types';
import { fetchRemoteConfig, saveRemoteConfig } from '@/lib/sheets';

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
  registrationFields: DEFAULT_REGISTRATION_FIELDS,
  checkInFields: DEFAULT_CHECKIN_FIELDS,
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
  updateRegistrationFields: (fields: RegistrationFieldConfig[]) => Promise<boolean>;
  updateCheckInFields: (fields: CheckInFieldConfig[]) => Promise<boolean>;
  saveCloudConfig: (partial?: Partial<AppConfig>) => Promise<{ success: boolean; error?: string }>;
  isSavingCloud: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const LS_CONFIG_KEY = 'hillel_app_config';
const DEV_MODE_PASSWORD = 'Plummer17729!';
const SS_DEV_UNLOCKED_KEY = 'hillel_dev_unlocked';

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDevUnlocked, setIsDevUnlocked] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);

  useEffect(() => {
    let initialConfig = DEFAULT_CONFIG;
    try {
      const cached = localStorage.getItem(LS_CONFIG_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Ensure canonical Apps Script URL is used if cache is empty or legacy
        if (!parsed.appsScriptUrl || !parsed.appsScriptUrl.trim()) {
          parsed.appsScriptUrl = CANONICAL_APPS_SCRIPT_URL;
        }
        if (!parsed.registrationFields || !Array.isArray(parsed.registrationFields)) {
          parsed.registrationFields = DEFAULT_REGISTRATION_FIELDS;
        }
        if (!parsed.checkInFields || !Array.isArray(parsed.checkInFields)) {
          parsed.checkInFields = DEFAULT_CHECKIN_FIELDS;
        }
        initialConfig = { ...DEFAULT_CONFIG, ...parsed, isSandbox: false };
      }
      const unlocked = sessionStorage.getItem(SS_DEV_UNLOCKED_KEY) === 'true';
      if (unlocked) setIsDevUnlocked(true);
    } catch (_) {}
    setConfig(initialConfig);
    setIsLoaded(true);

    // Asynchronously fetch remote config from Google Sheet to ensure latest settings across all devices
    fetchRemoteConfig(initialConfig).then((remote) => {
      if (remote) {
        setConfig((prev) => {
          const next = { ...prev };
          if (remote.orgName) next.orgName = remote.orgName;
          if (remote.campusName) next.campusName = remote.campusName;
          if (remote.primaryColor) next.primaryColor = remote.primaryColor;
          if (remote.logoUrl) next.logoUrl = remote.logoUrl;
          if (remote.registrationFieldsConfig) {
            try {
              const parsed = JSON.parse(remote.registrationFieldsConfig);
              if (Array.isArray(parsed) && parsed.length > 0) {
                next.registrationFields = parsed;
              }
            } catch (_) {}
          }
          if (remote.checkInFieldsConfig) {
            try {
              const parsed = JSON.parse(remote.checkInFieldsConfig);
              if (Array.isArray(parsed) && parsed.length > 0) {
                next.checkInFields = parsed;
              }
            } catch (_) {}
          }
          try {
            localStorage.setItem(LS_CONFIG_KEY, JSON.stringify(next));
          } catch (_) {}
          return next;
        });
      }
    });
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

  const saveCloudConfig = async (partial?: Partial<AppConfig>): Promise<{ success: boolean; error?: string }> => {
    setIsSavingCloud(true);
    const updated: AppConfig = { ...config, ...(partial || {}) };
    updateConfig(updated);

    const payload: Record<string, any> = {
      orgName: updated.orgName,
      campusName: updated.campusName,
      primaryColor: updated.primaryColor,
      logoUrl: updated.logoUrl,
      stationId: updated.stationId,
      registrationFieldsConfig: JSON.stringify(updated.registrationFields),
      checkInFieldsConfig: JSON.stringify(updated.checkInFields),
    };

    const res = await saveRemoteConfig(updated, payload);
    setIsSavingCloud(false);
    return res;
  };

  const updateRegistrationFields = async (fields: RegistrationFieldConfig[]): Promise<boolean> => {
    const res = await saveCloudConfig({ registrationFields: fields });
    return res.success;
  };

  const updateCheckInFields = async (fields: CheckInFieldConfig[]): Promise<boolean> => {
    const res = await saveCloudConfig({ checkInFields: fields });
    return res.success;
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
        updateRegistrationFields,
        updateCheckInFields,
        saveCloudConfig,
        isSavingCloud,
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
