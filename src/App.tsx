
import React, { useState } from 'react';
import Header from './components/Header.tsx';
import Dashboard from './components/Dashboard.tsx';
import Settings from './components/Settings.tsx';
import { useTradingData } from './hooks/useTradingData.ts';

export type Page = 'dashboard' | 'settings';

const App: React.FC = () => {
    const [page, setPage] = useState<Page>('dashboard');
    const tradingData = useTradingData();

    return (
        <div className="min-h-screen bg-gray-900 text-gray-300 p-4 lg:p-8 font-sans">
            <Header 
                systemStatus={tradingData.systemStatus} 
                currentPage={page}
                setPage={setPage}
            />
            <main className="mt-8">
                {page === 'dashboard' && <Dashboard {...tradingData} />}
                {page === 'settings' && <Settings setPage={setPage} />}
            </main>
        </div>
    );
};

export default App;
