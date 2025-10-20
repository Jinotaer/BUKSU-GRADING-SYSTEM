import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconUsers,
  IconBook,
  IconX,
  IconAlertCircle,
  IconChalkboard,
  IconEye,
  IconUserPlus,
  IconRefresh,
} from "@tabler/icons-react";

import { InstructorSidebar } from "./instructorSidebar";
import { authenticatedFetch } from "../../utils/auth";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationProvider } from "../common/NotificationModals";

export default function SectionsStudent() {
  const navigate = useNavigate();

  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Notifications
  const notifications = useNotifications();
  const { showError, showSuccess } = notifications;

  // Fetch initial data
  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch("http://localhost:5000/api/instructor/sections");

      if (res.ok) {
        const data = await res.json();
        setSections(data.sections || []);
      } else {
        const errorData = await res.json();
        showError(errorData.message || "Failed to fetch assigned sections");
      }
    } catch (err) {
      console.error("Error fetching sections:", err);
      showError("Error fetching assigned sections");
    } finally {
      setLoading(false);
    }
  };

  // Search for students
  const searchStudents = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const res = await authenticatedFetch(
        `http://localhost:5000/api/instructor/search-students?q=${encodeURIComponent(query)}`
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.students || []);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Error searching students:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      searchStudents(searchQuery);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Checkbox selection for students
  const handleStudentSelection = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Remove selected student by id
  // const removeSelectedStudent = (id) => {
  //   setSelectedStudents(selectedStudents.filter((studentId) => studentId !== id));
  // };

  const inviteStudents = async () => {
    if (!selectedSection || selectedStudents.length === 0) return;

    try {
      setSubmitting(true);
      const studentIds = selectedStudents;
      const res = await authenticatedFetch(
        `http://localhost:5000/api/instructor/sections/${selectedSection._id}/invite-students`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentIds }),
        }
      );
      if (res.ok) {
        showSuccess("Students invited successfully!");
        setShowInviteModal(false);
        setSelectedStudents([]);
        setSelectedSection(null);
        fetchSections();
      } else {
        const errorData = await res.json();
        showError(errorData.message || "Failed to invite students");
      }
    } catch (err) {
      console.error("Error inviting students:", err);
      showError("Error inviting students");
    } finally {
      setSubmitting(false);
    }
  };

  const openInviteModal = (section) => {
    setSelectedSection(section);
    setShowInviteModal(true);
    setSelectedStudents([]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setSelectedSection(null);
    setSelectedStudents([]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const viewSectionStudents = (section) => {
    navigate(`/instructor/sections/${section._id}/students`);
  };

  return (
    <NotificationProvider notifications={notifications}>
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
        <div className="w-full md:w-64">
          <InstructorSidebar />
        </div>

        <div className="flex-1 p-2 sm:p-4 md:p-6">
          <div className="max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="mb-4 sm:mb-6 px-2 sm:px-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">My Sections</h1>
              <p className="text-gray-600 text-sm sm:text-base">Manage your assigned sections and students</p>
            </div>

            {/* Loading */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {sections.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <IconBook className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Sections Assigned</h3>
                    <p className="text-gray-500">You don't have any sections assigned yet.</p>
                  </div>
                ) : (
                  sections.map((section) => (
                    <div
                      key={section._id}
                      className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow flex flex-col justify-between h-full"
                    >
                      {/* Section Header */}
                      <div className="flex flex-col sm:flex-row items-start justify-between mb-2 sm:mb-4 gap-2">
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                            {section.section_name}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
                            {section.subject?.subject_name || "No Subject"}
                          </p>
                          <div className="flex items-center text-xs sm:text-sm text-gray-500">
                            <IconChalkboard className="h-4 w-4 mr-1" />
                            <span>
                              {section.semester?.semester_name || "No Semester"} -{" "}
                              {section.semester?.academic_year || "N/A"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center text-xs sm:text-sm text-gray-500">
                          <IconUsers className="h-4 w-4 mr-1" />
                          <span>{section.students?.length || 0}</span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="space-y-1 sm:space-y-2 mb-2 sm:mb-4">
                        <div className="text-xs sm:text-sm">
                          <span className="font-medium text-gray-700">Schedule:</span>
                          <span className="ml-2 text-gray-600">{section.schedule || "Not specified"}</span>
                        </div>
                        <div className="text-xs sm:text-sm">
                          <span className="font-medium text-gray-700">Room:</span>
                          <span className="ml-2 text-gray-600">{section.room || "Not specified"}</span>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => viewSectionStudents(section)}
                          className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <IconEye className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">View Students</span>
                          <span className="sm:hidden">View</span>
                        </button>
                        <button
                          onClick={() => openInviteModal(section)}
                          className="flex items-center justify-center px-3 py-2 bg-green-600 text-white text-xs sm:text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                        >
                          <IconUserPlus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Refresh Button */}
            <div className="mt-4 sm:mt-6 flex justify-center">
              <button
                onClick={fetchSections}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors text-xs sm:text-sm"
              >
                <IconRefresh className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh Sections
              </button>
            </div>
          </div>
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Invite Students to Section</h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    {selectedSection?.section_name} - {selectedSection?.subject?.subject_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Current Students: {selectedSection?.students?.length || 0}
                  </p>
                </div>
                <button
                  onClick={closeInviteModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <IconX className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-6 space-y-4">
                {/* Search */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Search Students by Name, ID, or Email:
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, student ID, or email..."
                    className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                  />
                </div>

                {/* Search Results */}
                <div className="max-h-32 sm:max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                  {searchQuery.trim() === "" ? (
                    <div className="p-4 text-center text-gray-500">
                      <IconUsers className="mx-auto mb-2 text-gray-300" />
                      <p>Enter a student name, ID, or email to search for students</p>
                    </div>
                  ) : isSearching ? (
                    <div className="p-2 sm:p-3 text-center text-gray-500">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    <div className="p-2 space-y-2">
                      {searchResults.map((student) => (
                        <label
                          key={student._id}
                          className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student._id)}
                            onChange={() => handleStudentSelection(student._id)}
                            className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="text-xs sm:text-sm font-medium text-gray-900">
                              {student.first_name} {student.last_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {student.student_id} • {student.email}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2 sm:p-3 text-center text-gray-500">No students found</div>
                  )}
                </div>

                {selectedStudents.length > 0 && (
                  <p className="text-xs text-blue-600 mt-2">
                    {selectedStudents.length} student{selectedStudents.length !== 1 ? "s" : ""} selected
                  </p>
                )}

                <div className="bg-green-50 p-2 sm:p-4 rounded-lg">
                  <p className="text-xs sm:text-sm text-green-700">
                    📧 Selected students will receive email invitations with section details and login instructions.
                  </p>
                </div>

                {/* Modal Actions */}
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
                  <button
                    onClick={closeInviteModal}
                    className="px-3 sm:px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-xs sm:text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={inviteStudents}
                    disabled={selectedStudents.length === 0 || submitting}
                    className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
                  >
                    {submitting
                      ? "Inviting..."
                      : `Invite ${selectedStudents.length} Student${
                          selectedStudents.length !== 1 ? "s" : ""
                        }`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </NotificationProvider>
  );
}
