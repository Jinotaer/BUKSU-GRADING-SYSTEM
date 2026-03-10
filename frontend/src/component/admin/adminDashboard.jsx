import React from "react";
import {
  IconUser,
  IconSchool,
  IconCalendar,
  IconBook,
} from "@tabler/icons-react";
import { NavbarSimple } from "./adminsidebar";
import {
  StatCard,
  QuickActionsSection,
  RecentActivityCard,
  DashboardHeader,
  LoadingState,
  ErrorMessage,
} from "./ui/dashboard";
import { useAuthenticatedQuery } from "../../hooks/useAuthenticatedQuery";

export default function AdminDashboard() {
  const { data, isLoading, error } = useAuthenticatedQuery({
    queryKey: ["admin", "dashboard"],
    url: "http://localhost:5000/api/admin/dashboard/stats",
  });

  const stats = data?.stats || {
    students: { total: 0, approved: 0 },
    instructors: { total: 0, active: 0, invited: 0 },
    subjects: { total: 0 },
    semesters: { total: 0 },
  };
  const recentActivities = data?.recentActivities || {
    students: [],
    instructors: [],
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <NavbarSimple />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        <DashboardHeader />
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorMessage message={error.message || "Failed to fetch dashboard stats"} />
        ) : (
          <>
            {/* Top cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={IconSchool}
                total={stats.students.total}
                label="Total Students"
                sublabel="Approved Students"
                sublabelColor="text-blue-600"
                iconColor="#3b82f6"
              />
              <StatCard
                icon={IconUser}
                total={stats.instructors.total}
                label="Total Instructors"
                sublabel="Instructor Accounts"
                sublabelColor="text-green-600"
                iconColor="#10b981"
              />
              <StatCard
                icon={IconCalendar}
                total={stats.semesters?.total || 0}
                label="Total Semesters"
                sublabel="Academic semesters"
                sublabelColor="text-orange-600"
                iconColor="#f59e0b"
              />
              <StatCard
                icon={IconBook}
                total={stats.subjects?.total || 0}
                label="Total Subjects"
                sublabel="Course subjects"
                sublabelColor="text-purple-600"
                iconColor="#8b5cf6"
              />
            </div>

            {/* Quick Actions */}
            <QuickActionsSection />

            {/* Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <RecentActivityCard
                title="Recent Students"
                activities={recentActivities.students}
                emptyMessage="No recent student registrations"
              />
              <RecentActivityCard
                title="Recent Instructors"
                activities={recentActivities.instructors}
                emptyMessage="No recent instructor activities"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
