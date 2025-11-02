
import React from 'react';

interface MetricCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    trendIcon?: React.ReactNode;
    valueColor?: string;
    footerText?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, trendIcon, valueColor = 'text-white', footerText }) => {
    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col justify-between transition-transform transform hover:scale-105">
            <div className="flex justify-between items-start">
                <span className="text-gray-400 font-medium">{title}</span>
                <div className="text-blue-400">{icon}</div>
            </div>
            <div className="mt-4">
                <span className={`text-4xl font-bold ${valueColor}`}>{value}</span>
                {trendIcon && <div className={`inline-block ml-2 ${valueColor}`}>{trendIcon}</div>}
            </div>
            {footerText && <p className="text-sm text-gray-500 mt-4">{footerText}</p>}
        </div>
    );
};

export default MetricCard;
