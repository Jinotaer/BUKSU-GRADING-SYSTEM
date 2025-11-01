import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconPlus,
  IconBook,
  IconCalendarEvent,
  IconCertificate,
  IconArchive,
} from '@tabler/icons-react';
import QuickActionButton from './QuickActionButton';

const QuickActionsCard = () => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: IconBook,
      label: 'My Subjects',
      onClick: () => navigate('/student/subjects'),
      iconColor: '#3b82f6',
      hoverColor: 'hover:bg-blue-50 hover:border-blue-300',
    },
    {
      icon: IconCalendarEvent,
      label: 'Schedule',
      onClick: () => navigate('/student/schedule'),
      iconColor: '#10b981',
      hoverColor: 'hover:bg-green-50 hover:border-green-300',
    },
    {
      icon: IconCertificate,
      label: 'Grades',
      onClick: () => navigate('/student/grades'),
      iconColor: '#8b5cf6',
      hoverColor: 'hover:bg-purple-50 hover:border-purple-300',
    },
    {
      icon: IconArchive,
      label: 'Archive',
      onClick: () => navigate('/student/archive'),
      iconColor: '#f59e0b',
      hoverColor: 'hover:bg-orange-50 hover:border-orange-300',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <IconPlus className="w-5 h-5 text-blue-600" />
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action, index) => (
          <QuickActionButton key={index} {...action} />
        ))}
      </div>
    </div>
  );
};

export default QuickActionsCard;
