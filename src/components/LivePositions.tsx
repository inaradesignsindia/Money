
import React from 'react';
import { LivePosition } from '../types';
import { format } from 'date-fns';

interface LivePositionsProps {
    positions: LivePosition[];
}

const LivePositions: React.FC<LivePositionsProps> = ({ positions }) => {
    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">Live Positions</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-700 text-gray-400 text-sm">
                            <th className="py-3 px-4 font-medium">Pair</th>
                            <th className="py-3 px-4 font-medium">Action</th>
                            <th className="py-3 px-4 font-medium">Entry Price</th>
                            <th className="py-3 px-4 font-medium">Entry Time</th>
                            <th className="py-3 px-4 font-medium text-right">P&L ($)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {positions.length > 0 ? positions.map((pos) => (
                            <tr key={pos.id} className="border-b border-gray-700 hover:bg-gray-700/50 text-sm">
                                <td className="py-3 px-4 font-semibold text-white">{pos.pair}</td>
                                <td className={`py-3 px-4 font-semibold ${pos.action === 'BUY' ? 'text-cyan-400' : 'text-fuchsia-400'}`}>
                                    {pos.action}
                                </td>
                                <td className="py-3 px-4">{pos.entryPrice.toFixed(5)}</td>
                                <td className="py-3 px-4">{format(pos.entryTime, 'HH:mm:ss')}</td>
                                <td className={`py-3 px-4 font-semibold text-right ${pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {pos.pnl.toFixed(2)}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-gray-500">No live positions.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LivePositions;
