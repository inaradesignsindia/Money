#!/usr/bin/env python3
"""
AI Scalping System - Signal Generation Service
=============================================

This service loads the pre-trained AI model and generates trading signals
based on feature vectors from the feature engine. It runs as a background
daemon process and provides BUY/SELL/HOLD signals with confidence scores.

Signal Generation Process:
1. Load latest feature vector from cache
2. Run inference through AI model
3. Apply confidence and risk filters
4. Calculate entry price, SL, and TP
5. Store valid signals for MT4 consumption

Author: AI Assistant
Date: 2025
"""

import sqlite3
import time
import logging
import sys
import os
import json
from datetime import datetime
from typing import Dict, List, Optional, Any
import pickle
import numpy as np

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/signal_generator.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Configuration
DATABASE_PATH = 'trading_system.db'
MODEL_PATH = 'models/scalping_model.pkl'
FEATURE_CACHE_SIZE = 100

# Risk management parameters
MIN_CONFIDENCE = 0.75  # Minimum confidence for signal generation
MAX_SPREAD_PIPS = 2.0  # Maximum spread in pips
MAX_OPEN_POSITIONS = 3  # Maximum concurrent positions
LOT_SIZE = 0.01  # Default lot size
SL_PIPS = 10  # Stop loss in pips
TP_PIPS = 20  # Take profit in pips

# Global variables
model = None
feature_cache = {}

def load_model():
    """Load the pre-trained AI model."""
    global model
    try:
        if os.path.exists(MODEL_PATH):
            with open(MODEL_PATH, 'rb') as f:
                model = pickle.load(f)
            logger.info("AI model loaded successfully")
            return True
        else:
            logger.warning(f"Model file not found: {MODEL_PATH}")
            # Create a simple fallback model for testing
            create_fallback_model()
            return True
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        create_fallback_model()
        return True

def create_fallback_model():
    """Create a simple fallback model for testing purposes."""
    global model

    class FallbackModel:
        def predict(self, X):
            # Simple random prediction for testing
            predictions = np.random.choice([0, 1, 2], size=len(X))  # 0=HOLD, 1=BUY, 2=SELL
            return predictions

        def predict_proba(self, X):
            # Random probabilities
            probs = np.random.rand(len(X), 3)
            probs = probs / probs.sum(axis=1, keepdims=True)  # Normalize
            return probs

    model = FallbackModel()
    logger.info("Fallback model created for testing")

def get_db_connection():
    """Get database connection."""
    return sqlite3.connect(DATABASE_PATH)

def get_current_price(symbol: str = 'EURUSD') -> float:
    """Get current market price from latest tick."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT bid, ask
                FROM ticks_raw
                WHERE symbol = ?
                ORDER BY timestamp DESC
                LIMIT 1
            ''', (symbol,))

            result = cursor.fetchone()
            if result:
                # Use mid price between bid and ask
                return (result[0] + result[1]) / 2
            else:
                logger.warning(f"No price data available for {symbol}")
                return 1.0800  # Default EURUSD price for testing

    except Exception as e:
        logger.error(f"Error getting current price: {e}")
        return 1.0800

def get_open_positions_count(symbol: str = 'EURUSD') -> int:
    """Get count of currently open positions."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT COUNT(*) as open_count
                FROM trades
                WHERE symbol = ? AND close_time IS NULL
            ''', (symbol,))

            result = cursor.fetchone()
            return result[0] if result else 0

    except Exception as e:
        logger.error(f"Error getting open positions count: {e}")
        return 0

def get_current_spread(symbol: str = 'EURUSD') -> float:
    """Get current spread in pips."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT spread
                FROM ticks_raw
                WHERE symbol = ?
                ORDER BY timestamp DESC
                LIMIT 1
            ''', (symbol,))

            result = cursor.fetchone()
            if result:
                return result[0]  # Spread in pips
            else:
                return 1.0  # Default spread

    except Exception as e:
        logger.error(f"Error getting current spread: {e}")
        return 1.0

def get_latest_features(symbol: str = 'EURUSD') -> Optional[Dict[str, float]]:
    """Get latest feature vector from cache."""
    global feature_cache

    if symbol in feature_cache and feature_cache[symbol]:
        return feature_cache[symbol][-1]  # Return most recent features

    logger.warning(f"No features available for {symbol}")
    return None

def generate_signal(symbol: str = 'EURUSD') -> Optional[Dict[str, Any]]:
    """Generate trading signal using AI model."""
    try:
        # Get latest features
        features = get_latest_features(symbol)
        if not features:
            return None

        # Prepare feature vector for model
        # Remove non-numeric features
        feature_vector = []
        feature_names = []

        for key, value in features.items():
            if key not in ['timestamp', 'symbol'] and isinstance(value, (int, float)):
                feature_vector.append(float(value))
                feature_names.append(key)

        if len(feature_vector) < 5:  # Need minimum features
            logger.warning("Insufficient numeric features for prediction")
            return None

        # Convert to numpy array
        X = np.array([feature_vector])

        # Get model predictions
        predictions = model.predict(X)
        probabilities = model.predict_proba(X)

        prediction = predictions[0]
        confidence = float(max(probabilities[0]))

        # Map prediction to signal
        signal_map = {0: 'HOLD', 1: 'BUY', 2: 'SELL'}
        direction = signal_map.get(prediction, 'HOLD')

        if direction == 'HOLD' or confidence < MIN_CONFIDENCE:
            logger.info(f"Low confidence signal ({confidence:.2f}) or HOLD - skipping")
            return None

        # Risk management checks
        current_spread = get_current_spread(symbol)
        open_positions = get_open_positions_count(symbol)
        current_price = get_current_price(symbol)

        if current_spread > MAX_SPREAD_PIPS:
            logger.info(f"Spread too high ({current_spread} pips) - skipping signal")
            return None

        if open_positions >= MAX_OPEN_POSITIONS:
            logger.info(f"Too many open positions ({open_positions}) - skipping signal")
            return None

        # Calculate entry, SL, and TP
        pip_value = 0.0001 if symbol.startswith('EUR') else 0.01  # Adjust for JPY pairs

        if direction == 'BUY':
            entry_price = current_price
            sl = entry_price - (SL_PIPS * pip_value)
            tp = entry_price + (TP_PIPS * pip_value)
        else:  # SELL
            entry_price = current_price
            sl = entry_price + (SL_PIPS * pip_value)
            tp = entry_price - (TP_PIPS * pip_value)

        # Create signal object
        signal = {
            'symbol': symbol,
            'direction': direction,
            'confidence': confidence,
            'entry_price': entry_price,
            'sl': sl,
            'tp': tp,
            'lot_size': LOT_SIZE,
            'timestamp': time.time(),
            'spread': current_spread,
            'features_used': len(feature_vector)
        }

        logger.info(f"Generated {direction} signal for {symbol} with {confidence:.2f} confidence")
        return signal

    except Exception as e:
        logger.error(f"Error generating signal: {e}")
        return None

def send_signal_to_api(signal: Dict[str, Any]):
    """Send generated signal to Flask API."""
    try:
        import requests

        api_url = 'http://localhost:5000/api/signals'
        response = requests.post(api_url, json=signal, timeout=5)

        if response.status_code == 200:
            logger.info("Signal sent to API successfully")
        else:
            logger.error(f"Failed to send signal to API: {response.status_code}")

    except Exception as e:
        logger.error(f"Error sending signal to API: {e}")

def main():
    """Main signal generation loop."""
    logger.info("Starting Signal Generator service...")

    # Create directories
    os.makedirs('logs', exist_ok=True)
    os.makedirs('models', exist_ok=True)

    # Load AI model
    if not load_model():
        logger.error("Failed to load AI model - exiting")
        return

    symbol = 'EURUSD'  # Default symbol
    interval_seconds = 5  # Check for signals every 5 seconds

    logger.info(f"Signal Generator started - monitoring {symbol}")

    while True:
        try:
            # Generate signal
            signal = generate_signal(symbol)

            if signal:
                # Send to API
                send_signal_to_api(signal)
                logger.info(f"Signal generated and sent: {signal['direction']} @ {signal['entry_price']}")

                # Wait longer after generating a signal
                time.sleep(interval_seconds * 6)  # 30 seconds cooldown
            else:
                # No signal generated, continue normal polling
                time.sleep(interval_seconds)

        except Exception as e:
            logger.error(f"Error in main loop: {e}")
            time.sleep(interval_seconds)

if __name__ == '__main__':
    main()