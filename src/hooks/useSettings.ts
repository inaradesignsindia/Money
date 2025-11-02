
import { useState, useEffect, useCallback } from 'react';
import { Settings } from '../types.ts';

const SETTINGS_STORAGE_KEY = 'hf-scalping-settings';

const DEFAULT_SETTINGS: Settings = {
    gcpVmIp: '34.123.45.67',
    backendApiKey: 'your-secret-api-key-123',
    geminiApiKey: '',
    lotSize: 0.01,
    maxPositions: 3,
    maxDailyLoss: 50,
    maxSpreadPips: 2.0,
    tickBatchSize: 500,
    signalPollIntervalMs: 500,
};

export const useSettings = (): [Settings, (newSettings: Settings) => void] => {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

    useEffect(() => {
        try {
            const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (storedSettings) {
                setSettings(JSON.parse(storedSettings));
            }
        } catch (error) {
            console.error("Failed to load settings from localStorage", error);
        }
    }, []);

    const saveSettings = useCallback((newSettings: Settings) => {
        try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
            setSettings(newSettings);
        } catch (error) {
            console.error("Failed to save settings to localStorage", error);
        }
    }, []);

    return [settings, saveSettings];
};
