import React, { useState, useEffect } from "react";
import { NavbarSimple } from "./studentsidebar";
import { authenticatedFetch } from "../../utils/auth";
import {
  IconCalendarEvent,
  IconBook,
  IconArchive,
} from "@tabler/icons-react";
import StatsCard from "./ui/dashboard/StatsCard";
import QuickActionsCard from "./ui/dashboard/QuickActionsCard";
import UpcomingScheduleSection from "./ui/dashboard/UpcomingScheduleSection";
import CurrentSubjectsSection from "./ui/dashboard/CurrentSubjectsSection";

const StudentDashboard = () => {
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);
  const [sections, setSections] = useState([]);
  const [archivedCount, setArchivedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load upcoming schedules
      const scheduleRes = await authenticatedFetch(
        "http://localhost:5000/api/schedule/upcoming?limit=3"
      );
      if (scheduleRes.ok) {
        const scheduleData = await scheduleRes.json();
        setUpcomingSchedules(scheduleData.schedules || []);
      }

      // Load active sections
      const sectionsRes = await authenticatedFetch(
        "http://localhost:5000/api/student/sections"
      );
      if (sectionsRes.ok) {
        const sectionsData = await sectionsRes.json();
        setSections(sectionsData.sections || []);
      }

      // Load archived sections count
      const archivedRes = await authenticatedFetch(
        "http://localhost:5000/api/student/sections?includeArchived=true"
      );
      if (archivedRes.ok) {
        const archivedData = await archivedRes.json();
        setArchivedCount(archivedData.sections?.length || 0);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get first 5 sections for display
  const displayedSections = sections.slice(0, 5);

  const statsCards = [
    {
      icon: IconCalendarEvent,
      count: upcomingSchedules.length,
      label: 'Upcoming Schedule',
      iconColor: '#3b82f6',
    },
    {
      icon: IconBook,
      count: sections.length,
      label: 'Active Subjects',
      iconColor: '#10b981',
    },
    {
      icon: IconArchive,
      count: archivedCount,
      label: 'Archived Subjects',
      iconColor: '#f59e0b',
    },
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
      <NavbarSimple />
      <h3 className="pt-10 text-2xl sm:text-3xl font-bold text-[#1E3A5F] mb-6 sm:mb-2 font-outfit max-[880px]:mt-10">
        Student Dashboard
      </h3>
      <p className="text-gray-600 mt-1  text-xs sm:text-sm md:text-base mb-8">
        Welcome! View your schedule, active subjects, and archived subjects here.
      </p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4 mb-8">
        {statsCards.map((card, index) => (
          <StatsCard key={index} {...card} />
        ))}
      </div>

      {/* Quick Actions */}
      <QuickActionsCard />

      {/* Upcoming Schedule Section */}
      <UpcomingScheduleSection 
        upcomingSchedules={upcomingSchedules}
        loading={loading}
      />

      {/* Current Subjects Section */}
      <CurrentSubjectsSection 
        sections={displayedSections}
        loading={loading}
      />
    </div>
  );
};

export default StudentDashboard;
