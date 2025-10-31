import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconArchive,
  IconRestore,
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
} from "@tabler/icons-react";
import { InstructorSidebar } from "./instructorSidebar";
import { authenticatedFetch } from "../../utils/auth";
import Pagination from "../common/Pagination";
import { NotificationModal } from "../common/NotificationModals";

export default function ArchiveManagement() {
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
  const itemsPerPage = 10;

  // Modals
  const [showUnarchiveModal, setShowUnarchiveModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Notifications
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
        "http://localhost:5000/api/instructor/sections?includeArchived=true"
      );
      if (res.ok) {
        const data = await res.json();
        // Filter only archived sections
        const archived = (data.sections || []).filter(
          (section) => section.isArchived
        );
        setArchivedSections(archived);
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
      const matchYear = selectedYear === "all" || section.schoolYear === selectedYear;
      const matchSem = selectedSemester === "all" || section.term === selectedSemester;
      return matchSearch && matchYear && matchSem;
    });
  }, [archivedSections, searchTerm, selectedYear, selectedSemester]);

  // Pagination
  const totalPages = Math.ceil(filteredSections.length / itemsPerPage);
  const paginatedSections = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSections.slice(start, start + itemsPerPage);
  }, [filteredSections, currentPage]);

  const handleUnarchive = async () => {
    if (!selectedSection) return;

    try {
      setActionLoading(true);
      const res = await authenticatedFetch(
        `http://localhost:5000/api/section/${selectedSection._id}/unarchive`,
        { method: "PUT" }
      );

      if (res.ok) {
        setNotification({
          show: true,
          type: "success",
          message: "Section unarchived successfully!",
        });
        await fetchArchivedSections();
        setShowUnarchiveModal(false);
        setSelectedSection(null);
      } else {
        const errorData = await res.json();
        setNotification({
          show: true,
          type: "error",
          message: errorData.message || "Failed to unarchive section",
        });
      }
    } catch (err) {
      console.error("Error unarchiving section:", err);
      setNotification({
        show: true,
        type: "error",
        message: "Error unarchiving section",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = (section) => {
    navigate(`/instructor/sections/${section._id}/activities`, {
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
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-outfit text-[#1E3A5F] text-2xl sm:text-2xl lg:text-3sxl font-bold">
              Archived Sections
            </h1>
          </div>
          <p className="text-gray-600">
            View and manage your archived sections. You can restore or permanently delete them.
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
                placeholder="Search sections..."
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
                <p className="text-2xl font-bold text-gray-900">{archivedSections.length}</p>
              </div>
              <IconArchive className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Filtered Results</p>
                <p className="text-2xl font-bold text-gray-900">{filteredSections.length}</p>
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

        {/* Sections List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {paginatedSections.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Section
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Academic Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Students
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Archived Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedSections.map((section) => (
                      <tr key={section._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <IconChalkboard className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {section.sectionName}
                              </div>
                              <div className="text-xs text-gray-500">{section.term}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {section.subject?.subjectCode}
                          </div>
                          <div className="text-xs text-gray-500">
                            {section.subject?.subjectName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <IconCalendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {section.schoolYear}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <IconUsers className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {section.students?.length || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <IconClock className="w-4 h-4" />
                            {formatDate(section.archivedAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewDetails(section)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <IconEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedSection(section);
                                setShowUnarchiveModal(true);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Unarchive Section"
                            >
                              <IconRestore className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <IconArchive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Archived Sections
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedYear !== "all" || selectedSemester !== "all"
                  ? "No sections match your search criteria"
                  : "You don't have any archived sections yet"}
              </p>
              {(searchTerm || selectedYear !== "all" || selectedSemester !== "all") && (
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

        {/* Unarchive Modal */}
        {showUnarchiveModal && selectedSection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Unarchive Section
                </h3>
                <button
                  onClick={() => {
                    setShowUnarchiveModal(false);
                    setSelectedSection(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <IconX className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg mb-4">
                  <IconRestore className="w-8 h-8 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedSection.sectionName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedSection.subject?.subjectCode} -{" "}
                      {selectedSection.schoolYear} {selectedSection.term}
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 mb-2">
                  Are you sure you want to unarchive this section? It will be moved back
                  to your active sections list.
                </p>
                <p className="text-sm text-gray-500">
                  Students: {selectedSection.students?.length || 0}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowUnarchiveModal(false);
                    setSelectedSection(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnarchive}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? "Unarchiving..." : "Unarchive Section"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        <NotificationModal
          isOpen={notification.show}
          type={notification.type}
          title={notification.type === "success" ? "Success" : "Error"}
          message={notification.message}
          onClose={() => setNotification({ show: false, type: "", message: "" })}
        />
      </div>
    </div>
  );
}
