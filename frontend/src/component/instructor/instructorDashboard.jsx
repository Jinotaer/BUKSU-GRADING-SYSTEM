import React, { useState, useEffect } from "react";
import { InstructorSidebar } from "./instructorSidebar";
import { authenticatedFetch } from "../../utils/auth";
import {
  PageHeader,
  StatsGrid,
  QuickActions,
  RecentSections,
  UpcomingSchedules,
  ErrorMessage,
  LoadingSpinner,
} from "./ui/dashboard";

export default function InstructorDashboard() {
  const [stats, setStats] = useState({
    totalSections: 0,
    totalStudents: 0,
    totalSubjects: 0,
    totalSchedules: 0,
  });
  const [recentSections, setRecentSections] = useState([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch instructor stats, recent sections, and upcoming schedules
        const statsRes = await authenticatedFetch("http://localhost:5000/api/instructor/dashboard/stats");
        const sectionsRes = await authenticatedFetch("http://localhost:5000/api/instructor/sections");
        const schedulesRes = await authenticatedFetch("http://localhost:5000/api/schedule/upcoming?limit=5");
        
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(prevStats => statsData.stats || prevStats);
        }
        
        if (sectionsRes.ok) {
          const sectionsData = await sectionsRes.json();
          setRecentSections((sectionsData.sections || []).slice(0, 5)); // Get latest 5 sections
        }

        if (schedulesRes.ok) {
          const schedulesData = await schedulesRes.json();
          setUpcomingSchedules(schedulesData.schedules || []);
          // Update the schedule count in stats
          setStats(prevStats => ({
            ...prevStats,
            totalSchedules: schedulesData.count || (schedulesData.schedules || []).length
          }));
        }
      } catch (err) {
        setError("Error fetching dashboard data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <InstructorSidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        <PageHeader />

        <ErrorMessage message={error} />

        <StatsGrid stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <QuickActions />
          <RecentSections sections={recentSections} />
        </div>

        <UpcomingSchedules schedules={upcomingSchedules} />
      </div>
    </div>
  );
}
