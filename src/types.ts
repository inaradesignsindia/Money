
export type SystemStatus = 'OPERATIONAL' | 'DEGRADED' | 'OFFLINE';

export type TradeAction = 'BUY' | 'SELL';

export interface LivePosition {
    id: string;
    pair: string;
    action: TradeAction;
    entryPrice: number;
    currentPrice: number;
    pnl: number;
    lotSize: number;
    entryTime: number;
}

export interface RecentTrade {
    id: string;
    pair: string;
    action: TradeAction;
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    exitTime: number;
}

export type SignalAction = 'BUY' | 'SELL' | 'HOLD';

export interface AiSignal {
    pair: string;
    action: SignalAction;
    confidence: number;
    timestamp: number;
}

export interface Metrics {
    todayPnl: number;
    winRate: number;
    wins: number;
    totalTrades: number;
    signalsToday: number;
}

export interface Settings {
    gcpVmIp: string;
    backendApiKey: string;
    geminiApiKey: string;
    lotSize: number;
    maxPositions: number;
    maxDailyLoss: number;
    maxSpreadPips: number;
    tickBatchSize: number;
    signalPollIntervalMs: number;
}
