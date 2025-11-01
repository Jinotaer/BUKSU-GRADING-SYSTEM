import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconBook } from '@tabler/icons-react';

const SubjectsTable = ({ sections, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="text-center py-12">
        <IconBook className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-lg">No subjects available</p>
        <p className="text-sm text-gray-400 mt-1">
          You are not enrolled in any subjects yet
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Subject Code
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Subject Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Section
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Instructor
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Units
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sections.map((section) => (
            <tr key={section._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {section.subject?.subjectCode || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {section.subject?.subjectName || 'Unknown Subject'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {section.sectionName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {section.instructor?.fullName || 'No Instructor'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {section.subject?.units || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  onClick={() =>
                    navigate(`/student/sections/${section._id}/activities`)
                  }
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SubjectsTable;
