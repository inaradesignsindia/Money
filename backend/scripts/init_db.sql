-- AI Scalping System Database Initialization
-- ==========================================

-- Create ticks_raw table for storing raw tick data from MT4
CREATE TABLE IF NOT EXISTS ticks_raw (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp REAL NOT NULL,
    symbol TEXT NOT NULL DEFAULT 'EURUSD',
    bid REAL NOT NULL,
    ask REAL NOT NULL,
    spread REAL NOT NULL DEFAULT 0,
    volume INTEGER DEFAULT 0,
    created_at REAL DEFAULT (strftime('%s', 'now'))
);

-- Create index on timestamp for faster queries
CREATE INDEX IF NOT EXISTS idx_ticks_timestamp ON ticks_raw(timestamp);
CREATE INDEX IF NOT EXISTS idx_ticks_symbol ON ticks_raw(symbol);

-- Create trades table for storing executed trades
CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket INTEGER UNIQUE,
    symbol TEXT NOT NULL,
    type TEXT NOT NULL, -- BUY or SELL
    lots REAL NOT NULL DEFAULT 0.01,
    open_price REAL NOT NULL,
    close_price REAL,
    profit REAL DEFAULT 0,
    swap REAL DEFAULT 0,
    commission REAL DEFAULT 0,
    open_time REAL NOT NULL,
    close_time REAL,
    sl REAL,
    tp REAL,
    comment TEXT,
    created_at REAL DEFAULT (strftime('%s', 'now'))
);

-- Create indexes for trades table
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_open_time ON trades(open_time);
CREATE INDEX IF NOT EXISTS idx_trades_close_time ON trades(close_time);
CREATE INDEX IF NOT EXISTS idx_trades_ticket ON trades(ticket);

-- Create signals table for storing AI-generated signals
CREATE TABLE IF NOT EXISTS signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    direction TEXT NOT NULL, -- BUY, SELL, HOLD
    confidence REAL NOT NULL,
    entry_price REAL NOT NULL,
    sl REAL,
    tp REAL,
    timestamp REAL NOT NULL,
    executed INTEGER DEFAULT 0, -- 0=pending, 1=executed, 2=rejected
    created_at REAL DEFAULT (strftime('%s', 'now'))
);

-- Create indexes for signals table
CREATE INDEX IF NOT EXISTS idx_signals_symbol ON signals(symbol);
CREATE INDEX IF NOT EXISTS idx_signals_timestamp ON signals(timestamp);
CREATE INDEX IF NOT EXISTS idx_signals_executed ON signals(executed);

-- Create system_logs table for storing system events
CREATE TABLE IF NOT EXISTS system_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level TEXT NOT NULL, -- INFO, WARNING, ERROR
    service TEXT NOT NULL, -- api, feature_engine, signal_generator
    message TEXT NOT NULL,
    data TEXT, -- JSON data if needed
    created_at REAL DEFAULT (strftime('%s', 'now'))
);

-- Create index for system logs
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_service ON system_logs(service);

-- Create performance_metrics table for storing daily performance
CREATE TABLE IF NOT EXISTS performance_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL, -- YYYY-MM-DD format
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    win_rate REAL DEFAULT 0,
    total_pnl REAL DEFAULT 0,
    max_drawdown REAL DEFAULT 0,
    sharpe_ratio REAL DEFAULT 0,
    created_at REAL DEFAULT (strftime('%s', 'now')),
    UNIQUE(date)
);

-- Create index for performance metrics
CREATE INDEX IF NOT EXISTS idx_performance_date ON performance_metrics(date);

-- Insert sample data for testing (optional)
-- Uncomment the following lines if you want to insert test data

-- INSERT OR IGNORE INTO ticks_raw (timestamp, symbol, bid, ask, spread, volume)
-- VALUES
--     (strftime('%s', 'now', '-1 hour'), 'EURUSD', 1.0800, 1.0802, 0.2, 100),
--     (strftime('%s', 'now', '-59 minutes'), 'EURUSD', 1.0801, 1.0803, 0.2, 95);

-- INSERT OR IGNORE INTO performance_metrics (date, total_trades, winning_trades, win_rate, total_pnl)
-- VALUES (date('now'), 0, 0, 0, 0);