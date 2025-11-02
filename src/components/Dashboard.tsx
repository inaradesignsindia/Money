
import React from 'react';
import MetricCard from './MetricCard.tsx';
import LivePositions from './LivePositions.tsx';
import RecentTrades from './RecentTrades.tsx';
import AiSignals from './AiSignals.tsx';
import MarketAnalysis from './MarketAnalysis.tsx';
import { ArrowUpIcon, ArrowDownIcon, CurrencyDollarIcon, ScaleIcon, ClockIcon, CpuChipIcon } from './Icons.tsx';
import { Metrics, LivePosition, RecentTrade, AiSignal } from '../types';
import MetricCardSkeleton from './skeletons/MetricCardSkeleton.tsx';
import TableSkeleton from './skeletons/TableSkeleton.tsx';
import AiSignalsSkeleton from './skeletons/AiSignalsSkeleton.tsx';

interface DashboardProps {
    metrics: Metrics;
    livePositions: LivePosition[];
    recentTrades: RecentTrade[];
    aiSignals: AiSignal[];
}

const Dashboard: React.FC<DashboardProps> = ({ metrics, livePositions, recentTrades, aiSignals }) => {
    const pnlColor = metrics.todayPnl >= 0 ? 'text-green-400' : 'text-red-400';
    const pnlIcon = metrics.todayPnl >= 0 ? <ArrowUpIcon className="w-5 h-5" /> : <ArrowDownIcon className="w-5 h-5" />;

    const isLoading = !metrics.totalTrades && !livePositions.length && !recentTrades.length && !aiSignals.length;

    if (isLoading) {
        return (
            <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <MetricCardSkeleton key={i} />)}
                </div>
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <TableSkeleton />
                        <TableSkeleton />
                    </div>
                    <div className="space-y-8">
                        <AiSignalsSkeleton />
                        <MarketAnalysis />
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Today's P&L"
                    value={`$${metrics.todayPnl.toFixed(2)}`}
                    icon={<CurrencyDollarIcon className="w-8 h-8" />}
                    trendIcon={pnlIcon}
                    valueColor={pnlColor}
                />
                <MetricCard
                    title="Win Rate"
                    value={`${(metrics.winRate * 100).toFixed(1)}%`}
                    icon={<ScaleIcon className="w-8 h-8" />}
                    footerText={`${metrics.wins} Wins / ${metrics.totalTrades} Trades`}
                />
                <MetricCard
                    title="Live Positions"
                    value={livePositions.length.toString()}
                    icon={<ClockIcon className="w-8 h-8" />}
                    footerText="Across all pairs"
                />
                <MetricCard
                    title="AI Signals Today"
                    value={metrics.signalsToday.toString()}
                    icon={<CpuChipIcon className="w-8 h-8" />}
                    footerText="Generated signals"
                />
            </div>

            {/* Main Content Grid */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <LivePositions positions={livePositions} />
                    <RecentTrades trades={recentTrades} />
                </div>
                <div className="space-y-8">
                    <AiSignals signals={aiSignals} />
                    <MarketAnalysis />
                </div>
            </div>
        </>
    );
};

export default Dashboard;
