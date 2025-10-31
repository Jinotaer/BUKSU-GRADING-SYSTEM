import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconArchive,
  IconX,
  IconAlertCircle,
  IconChalkboard,
  IconBook,
  IconUsers,
  IconCalendar,
  IconSearch,
  IconFilter,
  IconEye,
  IconClock,
  IconSchool,
  IconRestore,
} from "@tabler/icons-react";
import { NavbarSimple } from "./studentsidebar";
import { authenticatedFetch } from "../../utils/auth";
import { NotificationModal } from "../common/NotificationModals";

export default function StudentArchiveManagement() {
  const navigate = useNavigate();
  const [archivedSections, setArchivedSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 3x3 grid

  // Unarchive modal
  const [showUnarchiveModal, setShowUnarchiveModal] = useState(false);
  const [sectionToUnarchive, setSectionToUnarchive] = useState(null);
  const [unarchiving, setUnarchiving] = useState(false);

  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    type: "",
    message: "",
  });

  useEffect(() => {
    fetchArchivedSections();
  }, []);

  const fetchArchivedSections = async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch(
        "http://localhost:5000/api/student/sections?includeArchived=true"
      );
      if (res.ok) {
        const data = await res.json();
        setArchivedSections(data.sections || []);
        setError("");
      } else {
        const errorData = await res.json();
        setError(errorData.message || "Failed to fetch archived sections");
      }
    } catch (err) {
      console.error("Error fetching archived sections:", err);
      setError("Error fetching archived sections");
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchiveClick = (section, e) => {
    e.stopPropagation();
    setSectionToUnarchive(section);
    setShowUnarchiveModal(true);
  };

  const confirmUnarchive = async () => {
    if (!sectionToUnarchive) return;

    try {
      setUnarchiving(true);
      const res = await authenticatedFetch(
        `http://localhost:5000/api/student/sections/${sectionToUnarchive._id}/unarchive`,
        { method: "PUT" }
      );

      if (res.ok) {
        setNotification({
          show: true,
          type: "success",
          message: "Subject unarchived successfully!",
        });
        setShowUnarchiveModal(false);
        setSectionToUnarchive(null);
        // Refresh the sections list
        await fetchArchivedSections();
      } else {
        const errorData = await res.json();
        setNotification({
          show: true,
          type: "error",
          message: errorData.message || "Failed to unarchive subject",
        });
      }
    } catch (error) {
      console.error("Error unarchiving subject:", error);
      setNotification({
        show: true,
        type: "error",
        message: "Error unarchiving subject",
      });
    } finally {
      setUnarchiving(false);
    }
  };

  // Derived filter options
  const academicYears = useMemo(() => {
    const set = new Set(
      archivedSections.map((s) => s.schoolYear).filter(Boolean)
    );
    const arr = Array.from(set).sort((a, b) => (a > b ? -1 : 1));
    return [{ value: "all", label: "All Years" }].concat(
      arr.map((y) => ({ value: y, label: y }))
    );
  }, [archivedSections]);

  const semesters = useMemo(() => {
    const set = new Set(archivedSections.map((s) => s.term).filter(Boolean));
    const arr = Array.from(set);
    return [{ value: "all", label: "All Semesters" }].concat(
      arr.map((t) => ({ value: t, label: `${t} Semester` }))
    );
  }, [archivedSections]);

  // Apply filters
  const filteredSections = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return archivedSections.filter((section) => {
      const matchSearch =
        !q ||
        section.sectionName?.toLowerCase().includes(q) ||
        section.subject?.subjectCode?.toLowerCase().includes(q) ||
        section.subject?.subjectName?.toLowerCase().includes(q);
      const matchYear =
        selectedYear === "all" || section.schoolYear === selectedYear;
      const matchSem =
        selectedSemester === "all" || section.term === selectedSemester;
      return matchSearch && matchYear && matchSem;
    });
  }, [archivedSections, searchTerm, selectedYear, selectedSemester]);

  // Pagination
  const totalPages = Math.ceil(filteredSections.length / itemsPerPage);
  const paginatedSections = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSections.slice(start, start + itemsPerPage);
  }, [filteredSections, currentPage]);

  const handleViewDetails = (section) => {
    navigate(`/student/sections/${section._id}/activities`, { 
      state: { 
        section: section,
        subject: section.subject,
        fromArchive: true // Add flag to indicate coming from archive
      } 
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <NavbarSimple />
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
      <NavbarSimple />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <IconArchive className="w-8 h-8 text-gray-600" />
            <h1 className="font-outfit text-[#1E3A5F] text-2xl sm:text-3xl lg:text-4xl font-bold">
              Archived Subjects
            </h1>
          </div>
          <p className="text-gray-600">
            View your past subjects that have been archived by your instructors.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <IconAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <IconFilter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search subjects..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Academic Year Filter */}
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {academicYears.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>

            {/* Semester Filter */}
            <select
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {semesters.map((sem) => (
                <option key={sem.value} value={sem.value}>
                  {sem.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Archived</p>
                <p className="text-2xl font-bold text-gray-900">
                  {archivedSections.length}
                </p>
              </div>
              <IconArchive className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Filtered Results</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredSections.length}
                </p>
              </div>
              <IconFilter className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Page</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentPage} / {totalPages || 1}
                </p>
              </div>
              <IconBook className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Subjects Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {paginatedSections.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {paginatedSections.map((section) => (
                  <div
                    key={section._id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden border border-gray-200"
                    onClick={() => handleViewDetails(section)}
                  >
                    {/* Card Header with gradient */}
                    <div className="h-32 bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center relative">
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 bg-white/90 text-xs font-semibold text-gray-700 rounded-full">
                          ARCHIVED
                        </span>
                      </div>
                      <div className="text-white text-center">
                        <div className="text-2xl font-bold mb-1">
                          {section.subject?.subjectCode || "SUBJ"}
                        </div>
                        <div className="text-sm opacity-90">
                          {section.sectionName}
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                        {section.subject?.subjectName || "Untitled Subject"}
                      </h3>

                      <div className="space-y-2 mb-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <IconCalendar className="w-4 h-4" />
                          <span>
                            {section.schoolYear} - {section.term}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <IconSchool className="w-4 h-4" />
                          <span>{section.instructor?.fullName || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <IconUsers className="w-4 h-4" />
                          <span>{section.students?.length || 0} students</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 text-xs">
                          <IconClock className="w-3 h-3" />
                          <span>Archived {formatDate(section.archivedAt)}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                        <button
                          onClick={(e) => handleUnarchiveClick(section, e)}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          <IconRestore className="w-4 h-4" />
                          Unarchive
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(section);
                          }}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <IconEye className="w-4 h-4" />
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <IconArchive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Archived Subjects
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedYear !== "all" || selectedSemester !== "all"
                  ? "No subjects match your search criteria"
                  : "You don't have any archived subjects yet"}
              </p>
              {(searchTerm ||
                selectedYear !== "all" ||
                selectedSemester !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedYear("all");
                    setSelectedSemester("all");
                    setCurrentPage(1);
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Unarchive Confirmation Modal */}
        {showUnarchiveModal && sectionToUnarchive && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <IconRestore className="w-5 h-5 mr-2 text-green-500" />
                  Unarchive Subject
                </h3>
                <button
                  onClick={() => setShowUnarchiveModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={unarchiving}
                >
                  <IconX className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to unarchive this subject? It will appear back in your active subjects list.
                </p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">
                    {sectionToUnarchive.subject?.subjectCode} - {sectionToUnarchive.subject?.subjectName}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Section: {sectionToUnarchive.sectionName}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowUnarchiveModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={unarchiving}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUnarchive}
                  disabled={unarchiving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-300 flex items-center"
                >
                  <IconRestore className="w-4 h-4 mr-2" />
                  {unarchiving ? "Unarchiving..." : "Unarchive"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Modal */}
        <NotificationModal
          isOpen={notification.show}
          type={notification.type}
          title={notification.type === "success" ? "Success" : "Error"}
          message={notification.message}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      </div>
    </div>
  );
}
