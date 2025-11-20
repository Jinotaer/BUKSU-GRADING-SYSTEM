import React from 'react';

// User type color mapping
const userTypeColors = {
  admin: 'bg-red-100 text-red-800',
  instructor: 'bg-blue-100 text-blue-800',
  student: 'bg-green-100 text-green-800'
};

const UserStatistics = ({ userStats, formatDate, pagination }) => {
  return (
    <div className="space-y-6">
      {/* User Type Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Admin Activities</p>
              <p className="text-3xl font-bold text-red-600">{userStats.admin?.totalActivities || 0}</p>
              <p className="text-sm text-gray-500">{userStats.admin?.failedActivities || 0} failed</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${userTypeColors.admin}`}>
              Admin
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Instructor Activities</p>
              <p className="text-3xl font-bold text-blue-600">{userStats.instructor?.totalActivities || 0}</p>
              <p className="text-sm text-gray-500">{userStats.instructor?.failedActivities || 0} failed</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${userTypeColors.instructor}`}>
              Instructor
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Student Activities</p>
              <p className="text-3xl font-bold text-green-600">{userStats.student?.totalActivities || 0}</p>
              <p className="text-sm text-gray-500">{userStats.student?.failedActivities || 0} failed</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${userTypeColors.student}`}>
              Student
            </div>
          </div>
        </div>
      </div>

      {/* Most Active Users Table */}
      {userStats.activeUsers && userStats.activeUsers.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Most Active Users</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userStats.activeUsers.map((user, index) => {
                  const rowNumber = pagination ? (pagination.currentPage - 1) * pagination.itemsPerPage + index + 1 : index + 1;
                  return (
                    <tr key={`${user._id.userEmail}-${user._id.userType}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {rowNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${userTypeColors[user._id.userType] || 'bg-gray-100 text-gray-800'}`}>
                          {user._id.userType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user._id.userEmail}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.activityCount} activities
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.lastActivity)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {userStats.activeUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No active users found</p>
              <p className="text-xs text-gray-400">User activity data will appear here when available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserStatistics;