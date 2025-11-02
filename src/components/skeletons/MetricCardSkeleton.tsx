import React from 'react';

const MetricCardSkeleton: React.FC = () => {
    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg animate-pulse">
            <div className="flex justify-between items-start">
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                <div className="h-8 w-8 bg-gray-700 rounded-full"></div>
            </div>
            <div className="mt-4">
                <div className="h-10 bg-gray-700 rounded w-3/4"></div>
            </div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mt-4"></div>
        </div>
    );
};

export default MetricCardSkeleton;
