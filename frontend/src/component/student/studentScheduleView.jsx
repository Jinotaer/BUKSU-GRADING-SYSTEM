import React, { useState, useEffect } from 'react';
import { NavbarSimple } from './studentsidebar';
import { authenticatedFetch } from '../../utils/auth';
import {
  ScheduleHeader,
  EventTypeFilter,
  CalendarNavigation,
  MonthCalendarView,
  ListCalendarView,
  EventTypeLegend,
  UpcomingEvents,
  ScheduleStatistics,
  ScheduleDetailModal,
  LoadingState,
} from './ui/schedules';

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

  const monthSchedules = getSchedulesForMonth();
  
  const thisWeekCount = schedules.filter(s => {
    const startDate = new Date(s.startDateTime);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return startDate >= now && startDate <= weekFromNow;
  }).length;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <NavbarSimple />
        <div className="flex-1 p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65">
          <LoadingState />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <NavbarSimple />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        <ScheduleHeader />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <EventTypeFilter filter={filter} onFilterChange={setFilter} />

            <CalendarNavigation
              currentDate={currentDate}
              view={view}
              onPreviousMonth={previousMonth}
              onNextMonth={nextMonth}
              onToday={goToToday}
              onViewChange={setView}
            />

            {view === 'month' ? (
              <MonthCalendarView
                generateCalendarDays={generateCalendarDays}
                getSchedulesForDay={getSchedulesForDay}
                isToday={isToday}
                onEventClick={handleEventClick}
              />
            ) : (
              <ListCalendarView
                monthSchedules={monthSchedules}
                onEventClick={handleEventClick}
              />
            )}

            <EventTypeLegend />
          </div>

          <div className="lg:col-span-1">
            <UpcomingEvents
              upcomingEvents={upcomingEvents}
              onEventClick={handleEventClick}
            />

            <ScheduleStatistics
              totalEvents={schedules.length}
              upcomingCount={upcomingEvents.length}
              thisWeekCount={thisWeekCount}
            />
          </div>
        </div>

        <ScheduleDetailModal
          isOpen={showDetailModal}
          schedule={selectedSchedule}
          onClose={() => setShowDetailModal(false)}
        />
      </div>
    </div>
  );
}
