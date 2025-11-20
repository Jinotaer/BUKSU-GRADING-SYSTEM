import React from 'react';

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
const ActivityBreakdown = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Categories */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Activities by Category</h3>
        <div className="space-y-3">
          {stats.breakdown?.categories?.map((cat) => (
            <div key={cat._id} className="flex justify-between items-center">
              <span className={`px-2 py-1 rounded text-sm ${categoryColors[cat._id] || 'bg-gray-100 text-gray-800'}`}>
                {cat._id}
              </span>
              <div className="flex space-x-4 text-sm">
                <span className="text-green-600">{cat.count - cat.failureCount} success</span>
                <span className="text-red-600">{cat.failureCount} failed</span>
              </div>
            </div>
          ))}
        </div>
      </div>


    </div>
  );
};

export default ActivityBreakdown;