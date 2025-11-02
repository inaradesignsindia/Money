import React from 'react';
import { Settings } from '../types';

interface ConnectionSettingsProps {
    formState: Settings;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    inputClass: string;
    labelClass: string;
}

const ConnectionSettings: React.FC<ConnectionSettingsProps> = ({ formState, handleChange, inputClass, labelClass }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-gray-700 pb-8">
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">Connection & API Keys</h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="gcpVmIp" className={labelClass}>GCP VM IP Address</label>
                        <input type="text" name="gcpVmIp" id="gcpVmIp" value={formState.gcpVmIp} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="backendApiKey" className={labelClass}>Backend API Key</label>
                        <input type="password" name="backendApiKey" id="backendApiKey" value={formState.backendApiKey} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="geminiApiKey" className={labelClass}>Gemini API Key (for Market Analysis)</label>
                        <input type="password" name="geminiApiKey" id="geminiApiKey" value={formState.geminiApiKey} onChange={handleChange} className={inputClass} />
                    </div>
                </div>
            </div>
            <div className="text-gray-400 text-sm bg-gray-900/50 p-4 rounded-lg">
                <p className="font-semibold text-gray-300">Connection Details</p>
                <p className="mt-2">Enter the IP address of your GCP VM and the secret API key used to authenticate with the Flask backend.</p>
                <p className="mt-4 font-semibold text-gray-300">Gemini API Key</p>
                <p className="mt-2">This key is used by the dashboard to fetch real-time market analysis. It is stored securely in your browser's local storage.</p>
            </div>
        </div>
    );
};

export default ConnectionSettings;
