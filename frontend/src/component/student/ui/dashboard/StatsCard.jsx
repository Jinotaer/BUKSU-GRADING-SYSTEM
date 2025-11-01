import React from 'react';

const StatsCard = ({ icon, count, label, iconColor }) => {
  const Icon = icon;
  
  return (
    <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <Icon size={40} color={iconColor} />
        <span className="text-3xl font-bold">{count}</span>
      </div>
      <h4 className="mt-3 text-sm" style={{ color: iconColor }}>
        {label}
      </h4>
    </div>
  );
};

export default StatsCard;
