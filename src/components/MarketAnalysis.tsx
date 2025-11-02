
import React, { useState, useCallback } from 'react';
import { getMarketAnalysis } from '../services/geminiService.ts';
import { useSettings } from '../hooks/useSettings.ts';
import { SparklesIcon } from './Icons.tsx';

const MarketAnalysis: React.FC = () => {
    const [analysis, setAnalysis] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [settings] = useSettings();

    const handleAnalysisRequest = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setAnalysis('');
        try {
            const result = await getMarketAnalysis(settings.geminiApiKey);
            if (result.startsWith('Error:')) {
                setError(result);
            } else {
                setAnalysis(result);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [settings.geminiApiKey]);

    const renderFormattedText = (text: string) => {
        const sections = text.split(/(\*\*.*?\*\*)/g).filter(Boolean);
        return sections.map((section, index) => {
            if (section.startsWith('**') && section.endsWith('**')) {
                return <strong key={index} className="text-white font-bold">{section.slice(2, -2)}</strong>;
            }
            const lines = section.split('\n').map((line, lineIndex) => {
                if (line.trim().startsWith('* ')) {
                    return <li key={`${index}-${lineIndex}`} className="ml-4 list-disc list-inside">{line.trim().substring(2)}</li>;
                }
                return <span key={`${index}-${lineIndex}`}>{line}<br/></span>;
            });
            return <div key={index}>{lines}</div>;
        });
    };

    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">Gemini Market Analysis</h2>
            <div className="space-y-4">
                <button
                    onClick={handleAnalysisRequest}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    aria-label="Get AI market analysis"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="w-5 h-5 mr-2" />
                            Get AI Analysis
                        </>
                    )}
                </button>
                {(analysis || error) && (
                    <div className="mt-4 p-4 bg-gray-900/50 rounded-lg text-sm text-gray-300 min-h-[150px]">
                        {error ? (
                            <p className="text-red-400">{error}</p>
                        ) : (
                            <div className="prose prose-invert prose-sm max-w-none">
                                {renderFormattedText(analysis)}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketAnalysis;
