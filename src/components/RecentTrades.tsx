
import React from 'react';
import { RecentTrade } from '../types';
import { format } from 'date-fns';

interface RecentTradesProps {
    trades: RecentTrade[];
}

const RecentTrades: React.FC<RecentTradesProps> = ({ trades }) => {
    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">Recent Trades</h2>
            <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-700 text-gray-400 text-sm sticky top-0 bg-gray-800">
                            <th className="py-3 px-4 font-medium">Time</th>
                            <th className="py-3 px-4 font-medium">Pair</th>
                            <th className="py-3 px-4 font-medium">Action</th>
                            <th className="py-3 px-4 font-medium">Entry</th>
                            <th className="py-3 px-4 font-medium">Exit</th>
                            <th className="py-3 px-4 font-medium text-right">P&L ($)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trades.length > 0 ? trades.map((trade) => (
                            <tr key={trade.id} className="border-b border-gray-700 hover:bg-gray-700/50 text-sm">
                                <td className="py-3 px-4">{format(trade.exitTime, 'HH:mm:ss')}</td>
                                <td className="py-3 px-4 font-semibold text-white">{trade.pair}</td>
                                <td className={`py-3 px-4 font-semibold ${trade.action === 'BUY' ? 'text-cyan-400' : 'text-fuchsia-400'}`}>
                                    {trade.action}
                                </td>
                                <td className="py-3 px-4">{trade.entryPrice.toFixed(5)}</td>
                                <td className="py-3 px-4">{trade.exitPrice.toFixed(5)}</td>
                                <td className={`py-3 px-4 font-semibold text-right ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {trade.pnl >= 0 ? `+${trade.pnl.toFixed(2)}` : trade.pnl.toFixed(2)}
                                </td>
                            </tr>
                        )) : (
                             <tr>
                                <td colSpan={6} className="text-center py-8 text-gray-500">No recent trades.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecentTrades;
