import React, { useState, useEffect } from 'react';
import { InstructorSidebar } from './instructorSidebar';
import { authenticatedFetch } from '../../utils/auth';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconX,
  IconClock,
  IconMapPin,
  IconNotes,
  IconChalkboard,
  IconBook,
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

export default function ScheduleManagement() {
  const [schedules, setSchedules] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'quiz',
    startDateTime: '',
    endDateTime: '',
    sectionId: '',
    subjectId: '',
    location: '',
    notes: '',
    syncToGoogleCalendar: false,
  });

  useEffect(() => {
    loadSchedules();
    loadSections();
    loadSubjects();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSchedules = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:5000/api/schedule/instructor/schedules');
      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
      showNotification('Error loading schedules', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:5000/api/section/instructor/my-sections');
      if (response.ok) {
        const data = await response.json();
        setSections(data.sections || []);
        
        // Extract unique subjects from sections
        const uniqueSubjects = [];
        const subjectIds = new Set();
        
        data.sections.forEach(section => {
          if (section.subject && !subjectIds.has(section.subject._id)) {
            subjectIds.add(section.subject._id);
            uniqueSubjects.push(section.subject);
          }
        });
        
        setSubjects(uniqueSubjects);
      }
    } catch (error) {
      console.error('Error loading sections:', error);
    }
  };

  const loadSubjects = async () => {
    // Subjects are now loaded from sections, so this function is no longer needed
    // Kept for backward compatibility but does nothing
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = selectedSchedule
        ? `http://localhost:5000/api/schedule/${selectedSchedule._id}`
        : 'http://localhost:5000/api/schedule/create';
      
      const method = selectedSchedule ? 'PUT' : 'POST';

      const response = await authenticatedFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showNotification(
          selectedSchedule ? 'Schedule updated successfully' : 'Schedule created successfully',
          'success'
        );
        setShowModal(false);
        resetForm();
        loadSchedules();
      } else {
        const data = await response.json();
        showNotification(data.message || 'Error saving schedule', 'error');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      showNotification('Error saving schedule', 'error');
    }
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const response = await authenticatedFetch(`http://localhost:5000/api/schedule/${scheduleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showNotification('Schedule deleted successfully', 'success');
        setShowDetailModal(false);
        loadSchedules();
      } else {
        showNotification('Error deleting schedule', 'error');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      showNotification('Error deleting schedule', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      eventType: 'quiz',
      startDateTime: '',
      endDateTime: '',
      sectionId: '',
      subjectId: '',
      location: '',
      notes: '',
      syncToGoogleCalendar: false,
    });
    setSelectedSchedule(null);
  };

  const openEditModal = (schedule) => {
    setSelectedSchedule(schedule);
    const startDate = new Date(schedule.startDateTime);
    const endDate = new Date(schedule.endDateTime);
    setFormData({
      title: schedule.title,
      description: schedule.description || '',
      eventType: schedule.eventType,
      startDateTime: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}T${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`,
      endDateTime: `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}T${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`,
      sectionId: schedule.section._id,
      subjectId: schedule.subject._id,
      location: schedule.location || '',
      notes: schedule.notes || '',
      syncToGoogleCalendar: schedule.isGoogleCalendarSynced,
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
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
      return scheduleDate.getFullYear() === year && scheduleDate.getMonth() === month;
    });
  };

  const getSchedulesForDay = (day) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.startDateTime);
      return scheduleDate.getFullYear() === year && 
             scheduleDate.getMonth() === month && 
             scheduleDate.getDate() === day;
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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <InstructorSidebar />
        <div className="flex-1 p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  };

  const monthSchedules = getSchedulesForMonth();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <InstructorSidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="pt-4 sm:pt-6 md:pt-4 lg:pt-6 font-outfit text-[#1E3A5F] text-2xl sm:text-3xl lg:text-4xl font-bold">
              Schedule Management
            </h1>
            <p className="text-gray-600 mt-2">Create and manage your class schedules</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <IconPlus className="w-5 h-5" />
            Create Schedule
          </button>
        </div>

        {notification.show && (
          <div className={`mb-4 p-4 rounded-lg ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {notification.message}
          </div>
        )}

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
                              onClick={() => {
                                setSelectedSchedule(schedule);
                                setShowDetailModal(true);
                              }}
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
                    onClick={() => {
                      setSelectedSchedule(schedule);
                      setShowDetailModal(true);
                    }}
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

        {showModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedSchedule ? 'Edit Schedule' : 'Create Schedule'}
                  </h2>
                  <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-500 hover:text-gray-700">
                    <IconX className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                      <select
                        name="sectionId"
                        value={formData.sectionId}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Section</option>
                        {sections.map(section => (
                          <option key={section._id} value={section._id}>{section.sectionName}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                      <select
                        name="subjectId"
                        value={formData.subjectId}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Subject</option>
                        {subjects.map(subject => (
                          <option key={subject._id} value={subject._id}>
                            {subject.subjectCode} - {subject.subjectName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Type *</label>
                    <select
                      name="eventType"
                      value={formData.eventType}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="quiz">Quiz</option>
                      <option value="laboratory">Laboratory</option>
                      <option value="exam">Exam</option>
                      <option value="assignment">Assignment</option>
                      <option value="project">Project</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time *</label>
                      <input
                        type="datetime-local"
                        name="startDateTime"
                        value={formData.startDateTime}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time *</label>
                      <input
                        type="datetime-local"
                        name="endDateTime"
                        value={formData.endDateTime}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., Room 101, Online"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="syncToGoogleCalendar"
                      checked={formData.syncToGoogleCalendar}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="text-sm font-medium text-gray-700">Sync to Google Calendar</label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {selectedSchedule ? 'Update' : 'Create'} Schedule
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowModal(false); resetForm(); }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showDetailModal && selectedSchedule && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
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

                  {selectedSchedule.isGoogleCalendarSynced && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-800">
                        ✓ Synced with Google Calendar
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-6">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      openEditModal(selectedSchedule);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <IconEdit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(selectedSchedule._id)}
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <IconTrash className="w-4 h-4" />
                    Delete
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
