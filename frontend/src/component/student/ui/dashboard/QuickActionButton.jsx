import React from 'react';

const QuickActionButton = ({ icon, label, onClick, iconColor, hoverColor }) => {
  const Icon = icon;
  
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg ${hoverColor} transition-all`}
    >
      <Icon className="w-6 h-6" style={{ color: iconColor }} />
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  );
};

export default QuickActionButton;
