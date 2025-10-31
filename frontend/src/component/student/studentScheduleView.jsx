import React, { useState, useEffect } from 'react';
import { NavbarSimple } from './studentsidebar';
import { authenticatedFetch } from '../../utils/auth';
import {
  IconX,
  IconClock,
  IconMapPin,
  IconNotes,
  IconChalkboard,
  IconBook,
  IconUser,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';

const eventTypeColors = {
  quiz: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', dot: 'bg-red-500' },
  laboratory: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', dot: 'bg-yellow-500' },
  exam: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', dot: 'bg-blue-500' },
  assignment: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', dot: 'bg-orange-500' },
  project: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', dot: 'bg-green-500' },
  other: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300', dot: 'bg-gray-500' },
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export default function StudentScheduleView() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [filter, setFilter] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:5000/api/schedule/student/schedules');
      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (event) => {
    setSelectedSchedule(event);
    setShowDetailModal(true);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getSchedulesForMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.startDateTime);
      const matchesMonth = scheduleDate.getFullYear() === year && scheduleDate.getMonth() === month;
      const matchesFilter = filter === 'all' || schedule.eventType === filter;
      return matchesMonth && matchesFilter;
    });
  };

  const getSchedulesForDay = (day) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.startDateTime);
      const matchesDay = scheduleDate.getFullYear() === year && 
             scheduleDate.getMonth() === month && 
             scheduleDate.getDate() === day;
      const matchesFilter = filter === 'all' || schedule.eventType === filter;
      return matchesDay && matchesFilter;
    });
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
  };

  const upcomingEvents = schedules
    .filter(schedule => new Date(schedule.startDateTime) > new Date())
    .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <NavbarSimple />
        <div className="flex-1 p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  const monthSchedules = getSchedulesForMonth();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <NavbarSimple />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        <div className="mb-6">
          <h1 className="pt-4 sm:pt-6 md:pt-4 lg:pt-6 font-outfit text-[#1E3A5F] text-2xl sm:text-3xl lg:text-4xl font-bold">
            My Schedule
          </h1>
          <p className="text-gray-600 mt-2">View all your upcoming quizzes, exams, and activities</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Event Type</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Events</option>
                <option value="quiz">Quizzes</option>
                <option value="laboratory">Laboratory</option>
                <option value="exam">Exams</option>
                <option value="assignment">Assignments</option>
                <option value="project">Projects</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <button onClick={previousMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <IconChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-bold text-gray-900">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h2>
                  <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <IconChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={goToToday} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Today
                  </button>
                  <select value={view} onChange={(e) => setView(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="month">Month</option>
                    <option value="list">List</option>
                  </select>
                </div>
              </div>
            </div>

            {view === 'month' ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-7 bg-gray-50">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-3 text-center text-sm font-semibold text-gray-700 border-b border-gray-200">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {generateCalendarDays().map((day, index) => {
                    const daySchedules = day ? getSchedulesForDay(day) : [];
                    return (
                      <div
                        key={index}
                        className={`min-h-[120px] p-2 border-b border-r border-gray-200 ${
                          !day ? 'bg-gray-50' : isToday(day) ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        {day && (
                          <>
                            <div className={`text-sm font-semibold mb-1 ${isToday(day) ? 'text-blue-600' : 'text-gray-700'}`}>
                              {day}
                            </div>
                            <div className="space-y-1">
                              {daySchedules.slice(0, 3).map(schedule => (
                                <button
                                  key={schedule._id}
                                  onClick={() => handleEventClick(schedule)}
                                  className={`w-full text-left px-2 py-1 rounded text-xs ${eventTypeColors[schedule.eventType].bg} ${eventTypeColors[schedule.eventType].text} hover:opacity-80 transition-opacity`}
                                >
                                  <div className="font-medium truncate">{schedule.title}</div>
                                  <div className="truncate">{formatTime(schedule.startDateTime)}</div>
                                </button>
                              ))}
                              {daySchedules.length > 3 && (
                                <div className="text-xs text-gray-500 pl-2">+{daySchedules.length - 3} more</div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="divide-y divide-gray-200">
                  {monthSchedules.length > 0 ? (
                    monthSchedules.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)).map(schedule => (
                      <div
                        key={schedule._id}
                        onClick={() => handleEventClick(schedule)}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-1 h-16 rounded ${eventTypeColors[schedule.eventType].dot}`}></div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-gray-900">{schedule.title}</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  {schedule.subject.subjectCode} - {schedule.section.sectionName}
                                </p>
                              </div>
                              <span className={`px-2 py-1 text-xs font-semibold rounded ${eventTypeColors[schedule.eventType].bg} ${eventTypeColors[schedule.eventType].text}`}>
                                {schedule.eventType.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <IconClock className="w-4 h-4" />
                                {formatDate(schedule.startDateTime)} at {formatTime(schedule.startDateTime)}
                              </div>
                              {schedule.location && (
                                <div className="flex items-center gap-1">
                                  <IconMapPin className="w-4 h-4" />
                                  {schedule.location}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      No schedules for this month
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Event Types</h3>
              <div className="flex flex-wrap gap-4">
                {Object.entries(eventTypeColors).map(([type, colors]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${colors.dot}`}></div>
                    <span className="text-sm text-gray-700 capitalize">{type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h2>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((schedule) => (
                    <div
                      key={schedule._id}
                      onClick={() => handleEventClick(schedule)}
                      className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                        eventTypeColors[schedule.eventType].bg
                      } ${eventTypeColors[schedule.eventType].border}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm">{schedule.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded ${eventTypeColors[schedule.eventType].text}`}>
                          {schedule.eventType}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 mb-1">
                        {schedule.subject.subjectCode}
                      </p>
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <IconClock className="w-3 h-3" />
                        {formatDate(schedule.startDateTime)} {formatTime(schedule.startDateTime)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No upcoming events</p>
                </div>
              )}
            </div>

            <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Events</span>
                  <span className="font-semibold text-gray-900">{schedules.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Upcoming</span>
                  <span className="font-semibold text-blue-600">{upcomingEvents.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">This Week</span>
                  <span className="font-semibold text-green-600">
                    {schedules.filter(s => {
                      const startDate = new Date(s.startDateTime);
                      const now = new Date();
                      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                      return startDate >= now && startDate <= weekFromNow;
                    }).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showDetailModal && selectedSchedule && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedSchedule.title}</h2>
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded mt-2 ${eventTypeColors[selectedSchedule.eventType].bg} ${eventTypeColors[selectedSchedule.eventType].text}`}>
                      {selectedSchedule.eventType.toUpperCase()}
                    </span>
                  </div>
                  <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700">
                    <IconX className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <IconChalkboard className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Section</p>
                      <p className="font-medium">{selectedSchedule.section?.sectionName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <IconBook className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Subject</p>
                      <p className="font-medium">{selectedSchedule.subject?.subjectCode} - {selectedSchedule.subject?.subjectName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <IconUser className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Instructor</p>
                      <p className="font-medium">
                        {selectedSchedule.instructor?.firstName} {selectedSchedule.instructor?.lastName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <IconClock className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Schedule</p>
                      <p className="font-medium">
                        {formatDateTime(selectedSchedule.startDateTime)} - 
                        {formatTime(selectedSchedule.endDateTime)}
                      </p>
                    </div>
                  </div>

                  {selectedSchedule.location && (
                    <div className="flex items-start gap-3">
                      <IconMapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-medium">{selectedSchedule.location}</p>
                      </div>
                    </div>
                  )}

                  {selectedSchedule.description && (
                    <div className="flex items-start gap-3">
                      <IconNotes className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Description</p>
                        <p className="font-medium">{selectedSchedule.description}</p>
                      </div>
                    </div>
                  )}

                  {selectedSchedule.notes && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-900 mb-1">Notes</p>
                      <p className="text-sm text-blue-800">{selectedSchedule.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-6">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
