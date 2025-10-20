import React, { useEffect, useState } from "react";
import {
  IconUser,
  IconSchool,
  IconCalendar,
  IconBook,
  IconUserCog,
  IconUsersGroup,
} from "@tabler/icons-react";
import { NavbarSimple } from "./adminsidebar";
import { authenticatedFetch } from "../../utils/auth";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    students: { total: 0, approved: 0 },
    instructors: { total: 0, active: 0, invited: 0 },
    subjects: { total: 0 },
    semesters: { total: 0 },
  });
  const [recentActivities, setRecentActivities] = useState({
    students: [],
    instructors: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch dashboard stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await authenticatedFetch(
          "http://localhost:5000/api/admin/dashboard/stats"
        );
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setStats(data.stats);
            setRecentActivities(data.recentActivities);
          } else {
            setError(data.message || "Failed to fetch dashboard stats");
          }
        } else {
          const errorData = await res.json();
          setError(errorData.message || "Failed to fetch dashboard stats");
        }
      } catch (err) {
        setError("Error fetching dashboard stats");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const QuickActionCard = ({ icon: Icon, title, description, action, color, bgColor 
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={action}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <NavbarSimple />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        <h2 className="mb-6 mt-4 font-outfit text-[#1E3A5F] text-2xl sm:text-3xl font-bold">
          Admin Dashboard
        </h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <>
            {/* Top cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center gap-4">
                  <IconSchool size={40} color="#3b82f6" />
                  <div>
                    <p className="text-xl font-bold text-gray-800">
                      {stats.students.total}
                    </p>
                    <p className="text-sm text-gray-500">Total Students</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-green-600">
                  Approved Students
                </p>
              </div>

              <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center gap-4">
                  <IconUser size={40} color="#10b981" />
                  <div>
                    <p className="text-xl font-bold text-gray-800">
                      {stats.instructors.total}
                    </p>
                    <p className="text-sm text-gray-500">Total Instructors</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-green-600">
                  Instructor Accounts
                </p>
              </div>

              <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center gap-4">
                  <IconCalendar size={40} color="#f59e0b" />
                  <div>
                    <p className="text-xl font-bold text-gray-800">
                      {stats.semesters?.total || 0}
                    </p>
                    <p className="text-sm text-gray-500">Total Semesters</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-orange-600">
                  Academic semesters
                </p>
              </div>

              <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center gap-4">
                  <IconBook size={40} color="#8b5cf6" />
                  <div>
                    <p className="text-xl font-bold text-gray-800">
                      {stats.subjects?.total || 0}
                    </p>
                    <p className="text-sm text-gray-500">Total Subjects</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-purple-600">
                  Course subjects
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-10">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <QuickActionCard
                  icon={IconUsersGroup}
                  title="Student Management"
                  description="View and manage all student accounts"
                  action={() =>
                    (window.location.href = "/admin/students")
                  }
                  color="text-blue-600"
                  bgColor="bg-blue-100"
                />
                <QuickActionCard
                  icon={IconUserCog}
                  title="Instructor Management"
                  description="Manage instructor accounts and invitations"
                  action={() => (window.location.href = "/admin/instructors")}
                  color="text-green-600"
                  bgColor="bg-green-100"
                />
                <QuickActionCard
                  icon={IconCalendar}
                  title="Add Semester"
                  description="Create and manage academic semesters"
                  action={() => (window.location.href = "/admin/semestral-period")}
                  color="text-purple-600"
                  bgColor="bg-purple-100"
                />
                <QuickActionCard
                  icon={IconBook}
                  title="Add Subjects"
                  description="Create and manage course subjects"
                  action={() =>
                    (window.location.href = "/admin/subjects")
                  }
                  color="text-orange-600"
                  bgColor="bg-orange-100"
                />
                 <QuickActionCard
                  icon={IconBook}
                  title="Add Sections"
                  description="Create and manage course sections"
                  action={() =>
                    (window.location.href = "/admin/subjects")
                  }
                  color="text-orange-600"
                  bgColor="bg-orange-100"
                />
              </div>
            </div>

            {/* Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
                <h4 className="font-outfit text-gray-800 font-semibold mb-4">
                  Recent Students
                </h4>
                <div className="space-y-3">
                  {recentActivities.students.length > 0 ? (
                    recentActivities.students.map((student, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {student.fullName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {student.email}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {student.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No recent student registrations
                    </p>
                  )}
                </div>
              </div>

              <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
                <h4 className="font-outfit text-gray-800 font-semibold mb-4">
                  Recent Instructors
                </h4>
                <div className="space-y-3">
                  {recentActivities.instructors.length > 0 ? (
                    recentActivities.instructors.map((instructor, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {instructor.fullName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {instructor.email}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            instructor.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {instructor.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No recent instructor activities
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
