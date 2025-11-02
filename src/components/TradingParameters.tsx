import React from 'react';
import { Settings } from '../types';

interface TradingParametersProps {
    formState: Settings;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    inputClass: string;
    labelClass: string;
}

const TradingParameters: React.FC<TradingParametersProps> = ({ formState, handleChange, inputClass, labelClass }) => {
    return (
        <div>
            <h3 className="text-lg font-semibold text-white mb-4">Trading Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                    <label htmlFor="lotSize" className={labelClass}>Lot Size</label>
                    <input type="number" name="lotSize" id="lotSize" value={formState.lotSize} onChange={handleChange} step="0.01" className={inputClass} />
                </div>
                <div>
                    <label htmlFor="maxPositions" className={labelClass}>Max Open Positions</label>
                    <input type="number" name="maxPositions" id="maxPositions" value={formState.maxPositions} onChange={handleChange} step="1" className={inputClass} />
                </div>
                <div>
                    <label htmlFor="maxDailyLoss" className={labelClass}>Max Daily Loss ($)</label>
                    <input type="number" name="maxDailyLoss" id="maxDailyLoss" value={formState.maxDailyLoss} onChange={handleChange} step="1" className={inputClass} />
                </div>
                <div>
                    <label htmlFor="maxSpreadPips" className={labelClass}>Max Spread (pips)</label>
                    <input type="number" name="maxSpreadPips" id="maxSpreadPips" value={formState.maxSpreadPips} onChange={handleChange} step="0.1" className={inputClass} />
                </div>
                <div>
                    <label htmlFor="tickBatchSize" className={labelClass}>Tick Batch Size</label>
                    <input type="number" name="tickBatchSize" id="tickBatchSize" value={formState.tickBatchSize} onChange={handleChange} step="100" className={inputClass} />
                </div>
                <div>
                    <label htmlFor="signalPollIntervalMs" className={labelClass}>Signal Poll Interval (ms)</label>
                    <input type="number" name="signalPollIntervalMs" id="signalPollIntervalMs" value={formState.signalPollIntervalMs} onChange={handleChange} step="50" className={inputClass} />
                </div>
            </div>
        </div>
    );
};

export default TradingParameters;
