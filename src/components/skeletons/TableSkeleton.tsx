import React from 'react';

const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
                {[...Array(rows)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-900/50 p-3 rounded-lg">
                        <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TableSkeleton;
