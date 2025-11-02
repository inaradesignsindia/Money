
import React from 'react';
import { SystemStatus } from '../types';
import { Page } from '../App';
import { SignalIcon, Cog6ToothIcon, ChartPieIcon } from './Icons.tsx';

interface HeaderProps {
    systemStatus: SystemStatus;
    currentPage: Page;
    setPage: (page: Page) => void;
}

const Header: React.FC<HeaderProps> = ({ systemStatus, currentPage, setPage }) => {
    const statusInfo = {
        OPERATIONAL: { text: 'Operational', color: 'bg-green-500' },
        DEGRADED: { text: 'Degraded', color: 'bg-yellow-500' },
        OFFLINE: { text: 'Offline', color: 'bg-red-500' },
    };

    const currentStatus = statusInfo[systemStatus];

    return (
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
                <h1 className="text-3xl font-bold text-white">AI Scalping System</h1>
                <p className="text-gray-400 mt-1">Real-time performance and signal dashboard</p>
            </div>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                <div className="flex items-center bg-gray-800 px-4 py-2 rounded-lg shadow-md">
                    <SignalIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="mr-3 text-white font-medium">Status:</span>
                    <div className="flex items-center">
                        <span className={`h-3 w-3 rounded-full ${currentStatus.color} mr-2 animate-pulse`}></span>
                        <span className="font-semibold text-white">{currentStatus.text}</span>
                    </div>
                </div>
                {currentPage === 'dashboard' ? (
                    <button onClick={() => setPage('settings')} className="flex items-center bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg shadow-md transition-colors" aria-label="Go to settings">
                        <Cog6ToothIcon className="w-5 h-5 text-white" />
                        <span className="ml-2 text-white font-medium">Settings</span>
                    </button>
                ) : (
                     <button onClick={() => setPage('dashboard')} className="flex items-center bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg shadow-md transition-colors" aria-label="Go to dashboard">
                        <ChartPieIcon className="w-5 h-5 text-white" />
                        <span className="ml-2 text-white font-medium">Dashboard</span>
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
