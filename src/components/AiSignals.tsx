
import React from 'react';
import { AiSignal } from '../types';

interface AiSignalsProps {
    signals: AiSignal[];
}

const SignalBadge: React.FC<{ action: AiSignal['action'] }> = ({ action }) => {
    const styles = {
        BUY: 'bg-cyan-500/20 text-cyan-300 border-cyan-500',
        SELL: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500',
        HOLD: 'bg-gray-600/20 text-gray-400 border-gray-600',
    };
    return (
        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${styles[action]}`}>
            {action}
        </span>
    );
};

const AiSignals: React.FC<AiSignalsProps> = ({ signals }) => {
    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">AI Signals</h2>
            <div className="space-y-4">
                {signals.map((signal) => (
                    <div key={signal.pair} className="flex justify-between items-center bg-gray-900/50 p-3 rounded-lg">
                        <span className="font-semibold text-white">{signal.pair}</span>
                        <div className="flex items-center space-x-3">
                            {signal.action !== 'HOLD' && (
                                <span className="text-sm text-gray-400">
                                    Conf: <span className="font-bold text-white">{(signal.confidence * 100).toFixed(0)}%</span>
                                </span>
                            )}
                            <SignalBadge action={signal.action} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AiSignals;
