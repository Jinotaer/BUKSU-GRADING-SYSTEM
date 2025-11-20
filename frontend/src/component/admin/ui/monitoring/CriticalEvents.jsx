import React from 'react';
import {
  IconAlertTriangle
} from '@tabler/icons-react';



const CriticalEvents = ({ stats, formatDate }) => {
  if (!stats.recentCritical || stats.recentCritical.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <IconAlertTriangle className="mr-2 text-orange-500" />
        Recent Critical Events
      </h3>
      <div className="space-y-2">
        {stats.recentCritical.slice(0, 5).map((event, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded">
            <div>
              <p className="text-sm font-medium">{event.description}</p>
              <p className="text-xs text-gray-500">{event.adminEmail}</p>
            </div>
            <div className="text-right">
              <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                SECURITY
              </span>
              <p className="text-xs text-gray-500 mt-1">{formatDate(event.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CriticalEvents;