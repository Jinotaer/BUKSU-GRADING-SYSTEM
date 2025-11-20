import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { NavbarSimple } from "./studentsidebar";
import { authenticatedFetch } from "../../utils/auth";
import Pagination from "../common/Pagination";
import { NotificationModal } from "../common/NotificationModals";
import {
  HiddenHeader,
  HiddenFilters,
  HiddenStats,
  HiddenGrid,
  ErrorMessage,
} from "./ui/hidden";

export default function HiddenSubjectsManagement() {
  const navigate = useNavigate();
  const [hiddenSections, setHiddenSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9); // 3x3 grid default

  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    type: "",
    message: "",
  });
const semesters = [
  { value: '1st Semester', label: '1st Semester' },
  { value: '2nd Semester', label: '2nd Semester' },
  { value: 'Summer', label: 'Summer' },
];
  useEffect(() => {
    fetchHiddenSections();
  }, []);

  const fetchHiddenSections = async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch(
        "http://localhost:5000/api/student/sections/hidden"
      );
      if (res.ok) {
        const data = await res.json();
        setHiddenSections(data.sections || []);
        setError("");
      } else {
        const errorData = await res.json();
        setError(errorData.message || "Failed to fetch hidden sections");
      }
    } catch (err) {
      console.error("Error fetching hidden sections:", err);
      setError("Error fetching hidden sections");
    } finally {
      setLoading(false);
    }
  };

  const handleUnhideClick = async (section, e) => {
    e.stopPropagation();
    
    try {
      const res = await authenticatedFetch(
        `http://localhost:5000/api/student/sections/${section._id}/unhide`,
        { method: "PUT" }
      );

      if (res.ok) {
        setNotification({
          show: true,
          type: "success",
          message: "Subject unhidden successfully!",
        });
        await fetchHiddenSections();
      } else {
        const errorData = await res.json();
        setNotification({
          show: true,
          type: "error",
          message: errorData.message || "Failed to unhide subject",
        });
      }
    } catch (error) {
      console.error("Error unhiding subject:", error);
      setNotification({
        show: true,
        type: "error",
        message: "Error unhiding subject",
      });
    }
  };

  // Derived filter options
  const academicYears = useMemo(() => {
    const set = new Set(
      hiddenSections.map((s) => s.schoolYear).filter(Boolean)
    );
    const arr = Array.from(set).sort((a, b) => (a > b ? -1 : 1));
    return [{ value: "all", label: "All Academic Year" }].concat(
      arr.map((y) => ({ value: y, label: y }))
    );
  }, [hiddenSections]);

  // const semesters = useMemo(() => {
  //   const set = new Set(hiddenSections.map((s) => s.term).filter(Boolean));
  //   const arr = Array.from(set);
  //   return [{ value: "all", label: "All Semesters" }].concat(
  //     arr.map((t) => ({ value: t, label: `${t} Semester` }))
  //   );
  // }, [hiddenSections]);

  // Apply filters
  const filteredSections = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return hiddenSections.filter((section) => {
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
  }, [hiddenSections, searchTerm, selectedYear, selectedSemester]);

  // Pagination
  const totalPages = Math.ceil(filteredSections.length / itemsPerPage);
  const paginatedSections = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSections.slice(start, start + itemsPerPage);
  }, [filteredSections, currentPage, itemsPerPage]);

  const handleViewDetails = (section) => {
    navigate(`/student/sections/${section._id}/activities`, { 
      state: { 
        section: section,
        subject: section.subject,
        fromHidden: true
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

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedYear("all");
    setSelectedSemester("all");
    setCurrentPage(1);
  };

  const handlePageChange = (page) => setCurrentPage(page);
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <NavbarSimple />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        <HiddenHeader />

        <ErrorMessage error={error} />

        <HiddenFilters
          searchTerm={searchTerm}
          selectedYear={selectedYear}
          selectedSemester={selectedSemester}
          academicYears={academicYears}
          semesters={semesters}
          onSearchChange={setSearchTerm}
          onYearChange={setSelectedYear}
          onSemesterChange={setSelectedSemester}
          onPageReset={() => setCurrentPage(1)}
        />

        {/* <HiddenStats
          totalHidden={hiddenSections.length}
          filteredCount={filteredSections.length}
          currentPage={currentPage}
          totalPages={totalPages}
        /> */}

        <HiddenGrid
          paginatedSections={paginatedSections}
          searchTerm={searchTerm}
          selectedYear={selectedYear}
          selectedSemester={selectedSemester}
          currentPage={currentPage}
          totalPages={totalPages}
          onViewDetails={handleViewDetails}
          onUnhideClick={handleUnhideClick}
          onClearFilters={handleClearFilters}
          onPageChange={setCurrentPage}
          formatDate={formatDate}
        />

        {filteredSections.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredSections.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            rowsPerPageOptions={[9, 18, 27, 36]}
          />
        )}

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
