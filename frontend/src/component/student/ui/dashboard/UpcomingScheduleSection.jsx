import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconCalendarEvent } from '@tabler/icons-react';
import ScheduleCard from './ScheduleCard';

const UpcomingScheduleSection = ({ upcomingSchedules, loading }) => {
  const navigate = useNavigate();

  const eventTypeColors = {
    quiz: 'bg-red-100 text-red-800 border-red-300',
    laboratory: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    exam: 'bg-blue-100 text-blue-800 border-blue-300',
    assignment: 'bg-orange-100 text-orange-800 border-orange-300',
    project: 'bg-green-100 text-green-800 border-green-300',
    other: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  return (
    <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <IconCalendarEvent className="w-5 h-5 text-blue-600" />
          Upcoming Schedule
        </h3>
        <button
          onClick={() => navigate('/student/schedule')}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All →
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : upcomingSchedules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {upcomingSchedules.map((schedule) => (
            <ScheduleCard
              key={schedule._id}
              schedule={schedule}
              eventTypeColors={eventTypeColors}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <IconCalendarEvent className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No upcoming events</p>
          <p className="text-sm text-gray-400 mt-1">
            Check back later for new schedule items
          </p>
        </div>
      )}
    </div>
  );
};

export default UpcomingScheduleSection;
