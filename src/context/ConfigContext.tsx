'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppConfig } from '@/lib/types';

const DEFAULT_CONFIG: AppConfig = {
  orgName: 'Hillel',
  campusName: 'Campus Hillel',
  logoUrl: '',
  primaryColor: '#1d4ed8', // Hillel Blue
  sheetId: '1vRSAacNlDyCs7Fs0gEXiTtkO8vzcoXmZbWvHFqm1zm0',
  appsScriptUrl: '',
  isSandbox: true, // Default to sandbox until user pastes Google Apps Script URL
  stationId: 'front-desk-kiosk-01',
};

interface ConfigContextType {
  config: AppConfig;
  updateConfig: (partial: Partial<AppConfig>) => void;
  resetConfig: () => void;
  isSandbox: boolean;
  toggleSandbox: () => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const LS_CONFIG_KEY = 'hillel_app_config';

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(LS_CONFIG_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setConfig((prev) => ({ ...prev, ...parsed }));
      }
    } catch (_) {}
    setIsLoaded(true);
  }, []);

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
