import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NavbarSimple } from "./studentsidebar";
import { authenticatedFetch } from "../../utils/auth";
import {
  IconCalendarEvent,
  IconClock,
  IconBook,
  IconArchive,
  IconCertificate,
  IconPlus,
  IconEye,
  IconChartBar,
} from "@tabler/icons-react";
import moment from "moment";

const StudentDashboard = () => {
  const navigate = useNavigate();
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

  const eventTypeColors = {
    quiz: "bg-red-100 text-red-800 border-red-300",
    laboratory: "bg-yellow-100 text-yellow-800 border-yellow-300",
    exam: "bg-blue-100 text-blue-800 border-blue-300",
    assignment: "bg-orange-100 text-orange-800 border-orange-300",
    project: "bg-green-100 text-green-800 border-green-300",
    other: "bg-gray-100 text-gray-800 border-gray-300",
  };

  // Get first 5 sections for display
  const displayedSections = sections.slice(0, 5);

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
      <NavbarSimple />
      <h3 className="pt-10 text-2xl sm:text-3xl font-bold text-[#1E3A5F] mb-6 sm:mb-8 font-outfit max-[880px]:mt-10">
        Student Dashboard
      </h3>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4 mb-8">
        {/* Upcoming Events Card */}
        <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <IconCalendarEvent size={40} color="#3b82f6" />
            <span className="text-3xl font-bold">
              {upcomingSchedules.length}
            </span>
          </div>
          <h4 className="mt-3 text-sm text-blue-600">Upcoming Schedule</h4>
        </div>

        {/* Active Subjects Card */}
        <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <IconBook size={40} color="#10b981" />
            <span className="text-3xl font-bold">{sections.length}</span>
          </div>
          <h4 className="mt-3 text-sm text-green-600">Active Subjects</h4>
        </div>

        {/* Archived Subjects Card */}
        <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <IconArchive size={40} color="#f59e0b" />
            <span className="text-3xl font-bold">{archivedCount}</span>
          </div>
          <h4 className="mt-3 text-sm text-orange-600">Archived Subjects</h4>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <IconPlus className="w-5 h-5 text-blue-600" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => navigate("/student/subjects")}
            className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all"
          >
            <IconBook className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              My Subjects
            </span>
          </button>

          <button
            onClick={() => navigate("/student/schedule")}
            className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-all"
          >
            <IconCalendarEvent className="w-6 h-6 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Schedule</span>
          </button>

          <button
            onClick={() => navigate("/student/grades")}
            className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all"
          >
            <IconCertificate className="w-6 h-6 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Grades</span>
          </button>

          <button
            onClick={() => navigate("/student/archive")}
            className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-all"
          >
            <IconArchive className="w-6 h-6 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">Archive</span>
          </button>
        </div>
      </div>
      {/* Upcoming Schedule Section */}
      <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <IconCalendarEvent className="w-5 h-5 text-blue-600" />
            Upcoming Schedule
          </h3>
          <button
            onClick={() => navigate("/student/schedule")}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All →
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : upcomingSchedules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingSchedules.map((schedule) => (
              <div
                key={schedule._id}
                className={`p-4 rounded-lg border ${
                  eventTypeColors[schedule.eventType]
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-semibold uppercase">
                    {schedule.eventType}
                  </span>
                  <IconClock className="w-4 h-4" />
                </div>
                <h4 className="font-semibold text-sm mb-1">{schedule.title}</h4>
                <p className="text-xs mb-1">
                  {schedule.subject?.subjectCode || "N/A"}
                </p>
                <p className="text-xs">
                  {moment(schedule.startDateTime).format("MMM D, h:mm A")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <IconCalendarEvent className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No upcoming events</p>
            <p className="text-sm text-gray-400 mt-1">
              Check back later for new schedule items
            </p>
          </div>
        )}
      </div>
      {/* Current Subjects Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <IconBook className="w-5 h-5 text-blue-600" />
            Current Subjects
          </h3>
          <button
            onClick={() => navigate('/student/subjects')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All →
          </button>
        </div>

        {/* Subjects Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : displayedSections.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Section
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Instructor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Units
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedSections.map((section) => (
                  <tr key={section._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {section.subject?.subjectCode || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {section.subject?.subjectName || "Unknown Subject"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {section.sectionName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {section.instructor?.fullName || "No Instructor"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {section.subject?.units || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => navigate(`/student/sections/${section._id}/activities`)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <IconBook className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-lg">No subjects available</p>
            <p className="text-sm text-gray-400 mt-1">
              You are not enrolled in any subjects yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
