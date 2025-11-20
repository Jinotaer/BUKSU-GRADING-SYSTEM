import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { InstructorSidebar } from "./instructorSidebar";
import { authenticatedFetch } from "../../utils/auth";
import Pagination from "../common/Pagination";
import { NotificationModal } from "../common/NotificationModals";
import {
  PageHeader,
  ErrorMessage,
  LoadingSpinner,
  Filters,
  StatsCards,
  SectionsTable,
  EmptyState,
  UnarchiveModal,
} from "./ui/archive";

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
    return [{ value: "all", label: "All Academic Year" }].concat(
      arr.map((y) => ({ value: y, label: y }))
    );
  }, [archivedSections]);

  // const semesters = useMemo(() => {
  //   const set = new Set(archivedSections.map((s) => s.term).filter(Boolean));
  //   const arr = Array.from(set);
  //   return [{ value: "all", label: "All Semesters" }].concat(
  //     arr.map((t) => ({ value: t, label: `${t} Semester` }))
  //   );
  // }, [archivedSections]);
    const semesters = [
      { value: '1st Semester', label: '1st Semester' },
      { value: '2nd Semester', label: '2nd Semester' },
      { value: 'Summer', label: 'Summer' },
    ];
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
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <InstructorSidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        <PageHeader />

        <ErrorMessage error={error} />

        <Filters
          searchTerm={searchTerm}
          onSearchChange={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
          selectedYear={selectedYear}
          onYearChange={(value) => {
            setSelectedYear(value);
            setCurrentPage(1);
          }}
          selectedSemester={selectedSemester}
          onSemesterChange={(value) => {
            setSelectedSemester(value);
            setCurrentPage(1);
          }}
          academicYears={academicYears}
          semesters={semesters}
        />

        <StatsCards
          totalArchived={archivedSections.length}
          filteredCount={filteredSections.length}
          currentPage={currentPage}
          totalPages={totalPages}
        />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {paginatedSections.length > 0 ? (
            <>
              <SectionsTable
                sections={paginatedSections}
                onViewDetails={handleViewDetails}
                onUnarchive={(section) => {
                  setSelectedSection(section);
                  setShowUnarchiveModal(true);
                }}
                formatDate={formatDate}
              />

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
            <EmptyState
              searchTerm={searchTerm}
              selectedYear={selectedYear}
              selectedSemester={selectedSemester}
              onClearFilters={() => {
                setSearchTerm("");
                setSelectedYear("all");
                setSelectedSemester("all");
                setCurrentPage(1);
              }}
            />
          )}
        </div>

        <UnarchiveModal
          isOpen={showUnarchiveModal}
          section={selectedSection}
          onClose={() => {
            setShowUnarchiveModal(false);
            setSelectedSection(null);
          }}
          onConfirm={handleUnarchive}
          isLoading={actionLoading}
        />

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
