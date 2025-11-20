import React from 'react';
import {
  IconActivity,
  IconX,
  IconShield,
  IconCheck
} from '@tabler/icons-react';

const SummaryCards = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Activities</p>
            <p className="text-3xl font-bold text-gray-900">{stats.summary?.totalActivities || 0}</p>
          </div>
          <IconActivity className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Failed Activities</p>
            <p className="text-3xl font-bold text-red-600">{stats.summary?.failedActivities || 0}</p>
          </div>
          <IconX className="h-8 w-8 text-red-600" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Security Events</p>
            <p className="text-3xl font-bold text-orange-600">{stats.summary?.securityEvents || 0}</p>
          </div>
          <IconShield className="h-8 w-8 text-orange-600" />
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;