#!/usr/bin/env python3
"""
AI Scalping System - Feature Engineering Service
===============================================

This service continuously processes raw tick data and generates technical
features for the AI model. It runs as a background daemon process.

Features Generated:
- Momentum indicators (RSI, Stochastic)
- Moving averages (SMA, EMA)
- Volatility measures (ATR, Bollinger Bands)
- Volume indicators
- Price action patterns
- Time-based features

Author: AI Assistant
Date: 2025
"""

import sqlite3
import time
import logging
import sys
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import pandas as pd
import numpy as np
import ta  # Technical Analysis library

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/feature_engine.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_PATH = 'trading_system.db'

# In-memory cache for features
feature_cache = {}
CACHE_SIZE = 1000  # Keep last 1000 feature vectors

def get_db_connection():
    """Get database connection."""
    return sqlite3.connect(DATABASE_PATH)

def get_recent_ticks(symbol: str = 'EURUSD', limit: int = 1000) -> pd.DataFrame:
    """Fetch recent tick data from database."""
    try:
        with get_db_connection() as conn:
            query = '''
                SELECT timestamp, bid, ask, spread, volume
                FROM ticks_raw
                WHERE symbol = ?
                ORDER BY timestamp DESC
                LIMIT ?
            '''

            df = pd.read_sql_query(query, conn, params=[symbol, limit])

            if df.empty:
                logger.warning(f"No tick data found for {symbol}")
                return pd.DataFrame()

            # Convert to OHLC format (using bid price as close)
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='s')
            df = df.sort_values('timestamp')

            # Resample to 1-minute OHLC
            df.set_index('timestamp', inplace=True)
            ohlc = df['bid'].resample('1min').agg({
                'open': 'first',
                'high': 'max',
                'low': 'min',
                'close': 'last',
                'volume': 'sum'
            }).dropna()

            return ohlc

    except Exception as e:
        logger.error(f"Error fetching ticks: {e}")
        return pd.DataFrame()

def calculate_technical_features(ohlc_df: pd.DataFrame) -> Dict[str, float]:
    """Calculate technical indicators from OHLC data."""
    try:
        if ohlc_df.empty or len(ohlc_df) < 50:
            logger.warning("Insufficient data for feature calculation")
            return {}

        close = ohlc_df['close']
        high = ohlc_df['high']
        low = ohlc_df['low']
        volume = ohlc_df['volume']

        features = {}

        # Momentum Indicators
        features['rsi'] = ta.momentum.RSIIndicator(close).rsi().iloc[-1]
        stoch = ta.momentum.StochasticOscillator(high, low, close)
        features['stoch_k'] = stoch.stoch().iloc[-1]
        features['stoch_d'] = stoch.stoch_signal().iloc[-1]

        # Moving Averages
        features['sma_20'] = ta.trend.SMAIndicator(close, window=20).sma_indicator().iloc[-1]
        features['sma_50'] = ta.trend.SMAIndicator(close, window=50).sma_indicator().iloc[-1]
        features['ema_12'] = ta.trend.EMAIndicator(close, window=12).ema_indicator().iloc[-1]
        features['ema_26'] = ta.trend.EMAIndicator(close, window=26).ema_indicator().iloc[-1]

        # MACD
        macd = ta.trend.MACD(close)
        features['macd'] = macd.macd().iloc[-1]
        features['macd_signal'] = macd.macd_signal().iloc[-1]
        features['macd_diff'] = macd.macd_diff().iloc[-1]

        # Volatility Indicators
        features['atr'] = ta.volatility.AverageTrueRange(high, low, close).average_true_range().iloc[-1]
        bb = ta.volatility.BollingerBands(close)
        features['bb_upper'] = bb.bollinger_hband().iloc[-1]
        features['bb_lower'] = bb.bollinger_lband().iloc[-1]
        features['bb_middle'] = bb.bollinger_mavg().iloc[-1]

        # Volume Indicators
        features['volume_sma'] = ta.trend.SMAIndicator(volume, window=20).sma_indicator().iloc[-1]
        features['volume_ratio'] = volume.iloc[-1] / features['volume_sma'] if features['volume_sma'] > 0 else 1

        # Price Action Features
        features['close_to_sma20_ratio'] = close.iloc[-1] / features['sma_20']
        features['close_to_bb_upper_ratio'] = close.iloc[-1] / features['bb_upper']
        features['close_to_bb_lower_ratio'] = close.iloc[-1] / features['bb_lower']

        # Trend Features
        features['ema_12_26_ratio'] = features['ema_12'] / features['ema_26']
        features['price_trend'] = 1 if close.iloc[-1] > features['sma_20'] else -1

        # Recent Price Changes
        features['price_change_1m'] = (close.iloc[-1] - close.iloc[-2]) / close.iloc[-2] if len(close) > 1 else 0
        features['price_change_5m'] = (close.iloc[-1] - close.iloc[-6]) / close.iloc[-6] if len(close) > 5 else 0

        # Spread and Market Conditions
        spread_data = ohlc_df['spread']
        features['avg_spread'] = spread_data.mean()
        features['spread_ratio'] = spread_data.iloc[-1] / features['avg_spread'] if features['avg_spread'] > 0 else 1

        # Time-based features
        current_time = datetime.now()
        features['hour_of_day'] = current_time.hour
        features['day_of_week'] = current_time.weekday()

        # Normalize features (simple z-score normalization)
        feature_values = list(features.values())
        if len(feature_values) > 1:
            mean_val = np.mean(feature_values)
            std_val = np.std(feature_values)
            if std_val > 0:
                features = {k: (v - mean_val) / std_val for k, v in features.items()}

        return features

    except Exception as e:
        logger.error(f"Error calculating features: {e}")
        return {}

def update_feature_cache(symbol: str, features: Dict[str, float]):
    """Update the in-memory feature cache."""
    global feature_cache

    if symbol not in feature_cache:
        feature_cache[symbol] = []

    # Add timestamp
    feature_vector = {
        'timestamp': time.time(),
        'symbol': symbol,
        **features
    }

    feature_cache[symbol].append(feature_vector)

    # Keep only recent features
    if len(feature_cache[symbol]) > CACHE_SIZE:
        feature_cache[symbol] = feature_cache[symbol][-CACHE_SIZE:]

    logger.debug(f"Updated feature cache for {symbol}: {len(feature_cache[symbol])} vectors")

def main():
    """Main feature engineering loop."""
    logger.info("Starting Feature Engine service...")

    # Create logs directory
    os.makedirs('logs', exist_ok=True)

    symbol = 'EURUSD'  # Default symbol
    interval_seconds = 30  # Calculate features every 30 seconds

    while True:
        try:
            # Get recent tick data
            ohlc_data = get_recent_ticks(symbol)

            if not ohlc_data.empty:
                # Calculate technical features
                features = calculate_technical_features(ohlc_data)

                if features:
                    # Update cache
                    update_feature_cache(symbol, features)
                    logger.info(f"Generated {len(features)} features for {symbol}")
                else:
                    logger.warning(f"No features generated for {symbol}")
            else:
                logger.warning(f"No OHLC data available for {symbol}")

        except Exception as e:
            logger.error(f"Error in main loop: {e}")

        # Wait for next iteration
        time.sleep(interval_seconds)

if __name__ == '__main__':
    main()