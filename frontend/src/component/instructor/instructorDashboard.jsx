import React from "react";
import { InstructorSidebar } from "./instructorSidebar";
import {
  PageHeader,
  StatsGrid,
  QuickActions,
  RecentSections,
  UpcomingSchedules,
  ErrorMessage,
  LoadingSpinner,
} from "./ui/dashboard";
import { useAuthenticatedQuery } from "../../hooks/useAuthenticatedQuery";

export default function InstructorDashboard() {
  const { data, isLoading, error } = useAuthenticatedQuery({
    queryKey: ["instructor", "dashboard"],
    url: "http://localhost:5000/api/instructor/dashboard/stats",
  });
  const {
    data: sectionsData,
    isLoading: isSectionsLoading,
    error: sectionsError,
  } =
    useAuthenticatedQuery({
      queryKey: ["instructor", "sections"],
      url: "http://localhost:5000/api/instructor/sections",
    });
  const {
    data: schedulesData,
    isLoading: isSchedulesLoading,
    error: schedulesError,
  } =
    useAuthenticatedQuery({
      queryKey: ["instructor", "upcoming-schedules", 5],
      url: "http://localhost:5000/api/schedule/upcoming?limit=5",
    });

  const stats = {
    totalSections: data?.stats?.totalSections || 0,
    totalStudents: data?.stats?.totalStudents || 0,
    totalSubjects: data?.stats?.totalSubjects || 0,
    totalSchedules:
      schedulesData?.count || (schedulesData?.schedules || []).length || 0,
  };
  const recentSections = (sectionsData?.sections || []).slice(0, 5);
  const upcomingSchedules = schedulesData?.schedules || [];

  if (isLoading || isSectionsLoading || isSchedulesLoading) {
    return <LoadingSpinner />;
  }

  const dashboardError = error || sectionsError || schedulesError;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <InstructorSidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        <PageHeader />

        <ErrorMessage message={dashboardError?.message || ""} />

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
