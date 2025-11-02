
import React, { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings.ts';
import { Settings as SettingsType } from '../types';
import { Page } from '../App';
import ConnectionSettings from './ConnectionSettings.tsx';
import TradingParameters from './TradingParameters.tsx';

interface SettingsProps {
    setPage: (page: Page) => void;
}

const Settings: React.FC<SettingsProps> = ({ setPage }) => {
    const [savedSettings, saveSettings] = useSettings();
    const [formState, setFormState] = useState<SettingsType>(savedSettings);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        setFormState(savedSettings);
    }, [savedSettings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormState(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value,
        }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        saveSettings(formState);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const inputClass = "mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500";
    const labelClass = "block text-sm font-medium text-gray-300";

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">System Configuration</h2>
            <form onSubmit={handleSave} className="bg-gray-800 p-8 rounded-xl shadow-lg space-y-8">
                
                <ConnectionSettings formState={formState} handleChange={handleChange} inputClass={inputClass} labelClass={labelClass} />

                <TradingParameters formState={formState} handleChange={handleChange} inputClass={inputClass} labelClass={labelClass} />

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                        Save Settings
                    </button>
                </div>
            </form>

            {/* Save Confirmation Toast */}
            <div aria-live="assertive" className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start">
                <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
                    {showToast && (
                        <div className="max-w-sm w-full bg-green-500 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
                            <div className="p-4">
                                <div className="flex items-start">
                                    <div className="ml-3 w-0 flex-1 pt-0.5">
                                        <p className="text-sm font-medium text-white">Settings Saved!</p>
                                        <p className="mt-1 text-sm text-green-100">Your configuration has been updated.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
