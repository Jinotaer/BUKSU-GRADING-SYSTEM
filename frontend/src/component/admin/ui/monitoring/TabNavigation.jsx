import React from 'react';
import {
  IconActivity,
  IconEye,
  IconShield,
  IconUser
} from '@tabler/icons-react';

const TabNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { key: 'overview', label: 'Overview', icon: IconActivity },
    { key: 'users', label: 'User Statistics', icon: IconUser },
    { key: 'logs', label: 'Activity Logs', icon: IconEye },
    { key: 'security', label: 'Security Events', icon: IconShield }
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map(({ key, label, icon }) => {
          const IconComponent = icon;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <IconComponent size={20} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default TabNavigation;