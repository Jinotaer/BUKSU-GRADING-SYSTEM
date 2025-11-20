import React from 'react';
import {
  IconShield
} from '@tabler/icons-react';

// Category color mapping
const categoryColors = {
  AUTHENTICATION: 'bg-purple-100 text-purple-800',
  USER_MANAGEMENT: 'bg-green-100 text-green-800',
  ACADEMIC_MANAGEMENT: 'bg-blue-100 text-blue-800',
  GRADE_MANAGEMENT: 'bg-indigo-100 text-indigo-800',
  SYSTEM: 'bg-gray-100 text-gray-800',
  SECURITY: 'bg-red-100 text-red-800',
  STUDENT_ACTIVITY: 'bg-cyan-100 text-cyan-800',
  INSTRUCTOR_ACTIVITY: 'bg-emerald-100 text-emerald-800',
  PROFILE_MANAGEMENT: 'bg-pink-100 text-pink-800'
};
const SecurityEvents = ({ securityEvents, formatDate }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <IconShield className="mr-2 text-red-500" />
          Security Events
        </h3>
      </div>
      
      {securityEvents.length === 0 ? (
        <div className="text-center py-12">
          <IconShield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No security events</h3>
          <p className="mt-1 text-sm text-gray-500">No security events found for the selected period.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {securityEvents.map((event) => (
                <tr key={event._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(event.timestamp)}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs ${categoryColors[event.category] || 'bg-gray-100 text-gray-800'}`}>
                      {event.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-col">
                      <span>{event.userEmail || event.adminEmail || 'Unknown'}</span>
                      {event.ipAddress && (
                        <span className="text-xs text-gray-500">IP: {event.ipAddress}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {event.success ? (
                        <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">SUCCESS</span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">FAILED</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={event.description}>
                    {event.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SecurityEvents;