import React, { useState, useEffect } from "react";
import {
  IconUsers,
  IconBook,
  IconChalkboard,
  IconAward,
  IconCalendarEvent,
  IconTrendingUp,
  IconClipboardList,
  IconUserCheck,
} from "@tabler/icons-react";
import { InstructorSidebar } from "./instructorSidebar";
import { authenticatedFetch } from "../../utils/auth";

export default function InstructorDashboard() {
  const [stats, setStats] = useState({
    totalSections: 0,
    totalStudents: 0,
    totalSubjects: 0,
    pendingGrades: 0,
  });
  const [recentSections, setRecentSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch instructor stats and recent sections
        const statsRes = await authenticatedFetch("http://localhost:5000/api/instructor/dashboard/stats");
        const sectionsRes = await authenticatedFetch("http://localhost:5000/api/section");
        
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(prevStats => statsData.stats || prevStats);
        }
        
        if (sectionsRes.ok) {
          const sectionsData = await sectionsRes.json();
          setRecentSections((sectionsData.sections || []).slice(0, 5)); // Get latest 5 sections
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

  const StatCard = ({ icon: Icon, title, value, color, bgColor }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({ 
  icon: Icon, title, description, action, color, bgColor }) => (
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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <InstructorSidebar />
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <InstructorSidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="pt-4 sm:pt-6 md:pt-4 lg:pt-6 font-outfit text-[#1E3A5F] text-2xl sm:text-3xl lg:text-4xl font-bold">
            Instructor Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome back! Here's an overview of your teaching activities.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={IconChalkboard}
            title="Active Sections"
            value={stats.totalSections}
            color="text-blue-600"
            bgColor="bg-blue-100"
          />
          <StatCard
            icon={IconUsers}
            title="Total Students"
            value={stats.totalStudents}
            color="text-green-600"
            bgColor="bg-green-100"
          />
          <StatCard
            icon={IconBook}
            title="Subjects Teaching"
            value={stats.totalSubjects}
            color="text-purple-600"
            bgColor="bg-purple-100"
          />
          <StatCard
            icon={IconClipboardList}
            title="Pending Grades"
            value={stats.pendingGrades}
            color="text-orange-600"
            bgColor="bg-orange-100"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-4">
              <QuickActionCard
                icon={IconChalkboard}
                title="Add New Section"
                description="Create a new class section for your subjects"
                action={() => window.location.href = '/instructor/add-sections'}
                color="text-blue-600"
                bgColor="bg-blue-100"
              />
              <QuickActionCard
                icon={IconAward}
                title="Manage Grades"
                description="Input and update student grades"
                action={() => window.location.href = '/instructor/grades'}
                color="text-green-600"
                bgColor="bg-green-100"
              />
              <QuickActionCard
                icon={IconUsers}
                title="View Students"
                description="See all students in your sections"
                action={() => window.location.href = '/instructor/students'}
                color="text-purple-600"
                bgColor="bg-purple-100"
              />
              <QuickActionCard
                icon={IconTrendingUp}
                title="Grade Reports"
                description="Generate and view grade reports"
                action={() => window.location.href = '/instructor/grade-reports'}
                color="text-orange-600"
                bgColor="bg-orange-100"
              />
            </div>
          </div>

          {/* Recent Sections */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Sections</h2>
            {recentSections.length > 0 ? (
              <div className="space-y-4">
                {recentSections.map((section) => (
                  <div
                    key={section._id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <IconChalkboard className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {section.sectionName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {section.subject?.subjectCode} - {section.schoolYear} {section.term}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {section.students?.length || 0} students
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <IconChalkboard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No sections created yet</p>
                <button
                  onClick={() => window.location.href = '/instructor/add-sections'}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Your First Section
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Tasks or Notifications */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Tasks</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <IconCalendarEvent className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Grade Submission Deadline</p>
                <p className="text-sm text-yellow-700">Submit grades for current semester by next Friday</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <IconUserCheck className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">Attendance Review</p>
                <p className="text-sm text-blue-700">Review and update student attendance records</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
