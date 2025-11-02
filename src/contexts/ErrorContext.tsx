import React, { createContext, useContext, useState, useCallback } from 'react';

interface ErrorContextType {
    error: string | null;
    setError: (error: string | null) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const useError = () => {
    const context = useContext(ErrorContext);
    if (!context) {
        throw new Error('useError must be used within an ErrorProvider');
    }
    return context;
};

export const ErrorProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [error, setError] = useState<string | null>(null);

    const dismissError = useCallback(() => {
        setError(null);
    }, []);

    return (
        <ErrorContext.Provider value={{ error, setError }}>
            {children}
            {error && (
                <div 
                    aria-live="assertive" 
                    className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start"
                >
                    <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
                        <div className="max-w-sm w-full bg-red-500 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
                            <div className="p-4">
                                <div className="flex items-start">
                                    <div className="ml-3 w-0 flex-1 pt-0.5">
                                        <p className="text-sm font-medium text-white">Error</p>
                                        <p className="mt-1 text-sm text-red-100">{error}</p>
                                    </div>
                                    <div className="ml-4 flex-shrink-0 flex">
                                        <button onClick={dismissError} className="inline-flex text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-500 focus:ring-white">
                                            <span className="sr-only">Close</span>
                                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ErrorContext.Provider>
    );
};
