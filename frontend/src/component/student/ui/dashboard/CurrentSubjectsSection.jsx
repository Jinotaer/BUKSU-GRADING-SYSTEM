import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconBook } from '@tabler/icons-react';
import SubjectsTable from './SubjectsTable';

const CurrentSubjectsSection = ({ sections, loading }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <IconBook className="w-5 h-5 text-green-600" />
          Current Subjects
        </h3>
        <button
          onClick={() => navigate('/student/subjects')}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All →
        </button>
      </div>

      <SubjectsTable sections={sections} loading={loading} />
    </div>
  );
};

export default CurrentSubjectsSection;
