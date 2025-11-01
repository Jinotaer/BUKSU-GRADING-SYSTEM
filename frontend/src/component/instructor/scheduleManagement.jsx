import React, { useState, useEffect } from 'react';
import { InstructorSidebar } from './instructorSidebar';
import { authenticatedFetch } from '../../utils/auth';
import {
  PageHeader,
  Notification,
  CalendarHeader,
  MonthView,
  ListView,
  EventTypeLegend,
  ScheduleForm,
  ScheduleDetailModal,
  LoadingSpinner,
} from './ui/schedules';

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
          <LoadingSpinner />
        </div>
      </div>
    );
  };

  const monthSchedules = getSchedulesForMonth();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <InstructorSidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        <PageHeader onCreateClick={openCreateModal} />

        <Notification
          show={notification.show}
          message={notification.message}
          type={notification.type}
        />

        <CalendarHeader
          currentDate={currentDate}
          onPreviousMonth={previousMonth}
          onNextMonth={nextMonth}
          onToday={goToToday}
          view={view}
          onViewChange={setView}
        />

        {view === 'month' ? (
          <MonthView
            calendarDays={generateCalendarDays()}
            getSchedulesForDay={getSchedulesForDay}
            isToday={isToday}
            onScheduleClick={(schedule) => {
              setSelectedSchedule(schedule);
              setShowDetailModal(true);
            }}
          />
        ) : (
          <ListView
            schedules={monthSchedules}
            onScheduleClick={(schedule) => {
              setSelectedSchedule(schedule);
              setShowDetailModal(true);
            }}
          />
        )}

        <EventTypeLegend />

        <ScheduleForm
          isOpen={showModal}
          isEdit={!!selectedSchedule}
          formData={formData}
          sections={sections}
          subjects={subjects}
          onClose={() => {
            setShowModal(false);
            resetForm();
          }}
          onSubmit={handleSubmit}
          onChange={handleInputChange}
        />

        <ScheduleDetailModal
          isOpen={showDetailModal}
          schedule={selectedSchedule}
          onClose={() => setShowDetailModal(false)}
          onEdit={() => openEditModal(selectedSchedule)}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
