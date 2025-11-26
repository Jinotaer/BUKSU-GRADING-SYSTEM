import React, { useState, useEffect, useMemo } from "react";
import { InstructorSidebar } from "./instructorSidebar";
import { authenticatedFetch } from "../../utils/auth";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationProvider } from "../common/NotificationModals";
import Pagination from "../common/Pagination";
import {
  PageHeader,
  SectionControls,
  LoadingSpinner,
  EmptyState,
  StudentsTableHeader,
  StudentsTable,
  InviteModal,
} from "./ui/students";

export default function SectionsStudentTable() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [selectedSection, setSelectedSection] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Search (for invite modal)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Search for students in current section
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Notifications
  const notifications = useNotifications();
  const { showError, showSuccess, showConfirmDialog } = notifications;

  // ===== Effects =====
  useEffect(() => {
    fetchSections({ setDefault: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search for invite modal
  useEffect(() => {
    const t = setTimeout(() => {
      performStudentSearch(searchQuery);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]); // performStudentSearch is stable

  // ===== Data fetching =====
  const fetchSections = async ({
    keepSelected = false,
    setDefault = false,
  } = {}) => {
    try {
      setLoading(true);
      const res = await authenticatedFetch(
        "http://localhost:5000/api/instructor/sections"
      );
      if (!res.ok) {
        const err = await res.json();
        showError(err.message || "Failed to fetch sections");
        console.error("Sections fetch error:", err);
        setSections([]);
        return;
      }
      const data = await res.json();
      console.log("Fetched sections data:", data);
      const fetched = Array.isArray(data.sections) ? data.sections : [];
      setSections(fetched);

      if (keepSelected && selectedSection) {
        const updated =
          fetched.find((s) => s._id === selectedSection._id) || null;
        setSelectedSection(updated);
      } else if (setDefault && !selectedSection && fetched.length > 0) {
        setSelectedSection(fetched[0]);
      } else if (fetched.length === 0) {
        setSelectedSection(null);
      }
    } catch (e) {
      console.error("Error fetching sections", e);
      showError("Error fetching sections");
      setSections([]);
      setSelectedSection(null);
    } finally {
      setLoading(false);
    }
  };

  const performStudentSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      setIsSearching(true);
      const res = await authenticatedFetch(
        `http://localhost:5000/api/instructor/search-students?q=${encodeURIComponent(
          query
        )}`
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.students || []);
      } else {
        setSearchResults([]);
      }
    } catch (e) {
      console.error("Error searching students", e);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // ===== Invite flow =====
  const handleStudentSelection = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const inviteStudents = async () => {
    if (!selectedSection || selectedStudents.length === 0) return;
    try {
      setSubmitting(true);
      const res = await authenticatedFetch(
        `http://localhost:5000/api/instructor/sections/${selectedSection._id}/invite-students?limit=12000`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentIds: selectedStudents }),
        }
      );
      if (res.ok) {
        showSuccess("Students invited successfully!");
        setShowInviteModal(false);
        setSelectedStudents([]);
        setSearchQuery("");
        setSearchResults([]);
        // refresh and keep the same section selected
        await fetchSections({ keepSelected: true });
      } else {
        const err = await res.json();
        showError(err.message || "Failed to invite students");
      }
    } catch (e) {
      console.error("Error inviting students", e);
      showError("Error inviting students");
    } finally {
      setSubmitting(false);
    }
  };

  const openInvite = () => {
    if (!selectedSection) return;
    setShowInviteModal(true);
    setSelectedStudents([]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveStudent = (studentId) => {
    if (!selectedSection || !studentId) return;
    
    // Find the student name for confirmation
    const student = students.find(s => s._id === studentId);
    const studentName = student ? `${student.first_name} ${student.last_name}`.trim() : 'this student';
    
    showConfirmDialog(
      'Remove Student',
      `Are you sure you want to remove ${studentName} from this section? This action cannot be undone.`,
      async () => {
        try {
          const res = await authenticatedFetch(
            `http://localhost:5000/api/instructor/sections/${selectedSection._id}/students/${studentId}`,
            {
              method: "DELETE",
            }
          );
          
          if (res.ok) {
            showSuccess("Student removed successfully!");
            // Refresh sections to update the student list
            await fetchSections({ keepSelected: true });
          } else {
            const err = await res.json();
            showError(err.message || "Failed to remove student");
          }
        } catch (e) {
          console.error("Error removing student", e);
          showError("Error removing student");
        }
      }
    );
  };

  // ===== Derived =====
  const students = useMemo(() => {
    if (!selectedSection) return [];
    if (!Array.isArray(selectedSection.students)) {
      console.warn(
        "selectedSection.students is not an array",
        selectedSection.students
      );
      return [];
    }
    console.log("Processing students:", selectedSection.students);
    return selectedSection.students.map((s) => ({
      _id: s._id,
      first_name: s.fullName
        ? s.fullName.split(" ")[0]
        : s.first_name || s.firstName || "",
      last_name: s.fullName
        ? s.fullName.split(" ").slice(1).join(" ")
        : s.last_name || s.lastName || "",
      student_id: s.studid || s.student_id || s.studentId || "",
      email: s.email || "",
      status: s.status || "Active",
    }));
  }, [selectedSection]);

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) {
      return students;
    }
    
    const query = studentSearchQuery.toLowerCase();
    return students.filter((student) => {
      const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
      const studentId = student.student_id.toLowerCase();
      const email = student.email.toLowerCase();
      
      return fullName.includes(query) || 
             studentId.includes(query) || 
             email.includes(query);
    });
  }, [students, studentSearchQuery]);

  const totalStudents = students.length;
  const filteredStudentsCount = filteredStudents.length;

  // Pagination calculations
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  // Reset to page 1 when search query or section changes
  useEffect(() => {
    setCurrentPage(1);
  }, [studentSearchQuery, selectedSection]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // ===== Helpers =====
  const sectionLabel = (sec) => {
    // Backend uses different field names
    const subject =
      sec.subject?.subjectName || sec.subject?.subject_name || "No Subject";
    const schoolYear = sec.schoolYear || sec.semester?.academic_year || "N/A";
    const term = sec.term || sec.semester?.semester_name || "No Term";
    return `${
      sec.sectionName || sec.section_name
    } — ${subject} — ${term} ${schoolYear}`;
  };

  // ===== Render =====
  return (
    <NotificationProvider notifications={notifications}>
      <div className="flex min-h-screen bg-gray-50">
        <InstructorSidebar />

        <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-16 sm:max-[880px]:pt-20 mt-6 sm:mt-8 md:mt-10">
          <div className="max-w-7xl mx-auto w-full">
            <PageHeader />

            <SectionControls
              sections={sections}
              selectedSection={selectedSection}
              onSectionChange={setSelectedSection}
              onRefresh={() => fetchSections({ keepSelected: true })}
              onAddStudents={openInvite}
              loading={loading}
              sectionLabel={sectionLabel}
            />

            {/* Content */}
            {loading ? (
              <LoadingSpinner />
            ) : sections.length === 0 ? (
              <EmptyState type="no-sections" />
            ) : !selectedSection ? (
              <EmptyState type="no-selection" />
            ) : (
              <div className="mt-4 sm:mt-6 bg-white rounded-lg sm:rounded-xl border border-gray-200 overflow-hidden">
                <StudentsTableHeader
                  selectedSection={selectedSection}
                  totalStudents={totalStudents}
                  filteredStudentsCount={filteredStudentsCount}
                  searchQuery={studentSearchQuery}
                  onSearchChange={setStudentSearchQuery}
                  onClearSearch={() => setStudentSearchQuery("")}
                />

                <StudentsTable
                  students={students}
                  filteredStudents={paginatedStudents}
                  onRemoveStudent={handleRemoveStudent}
                  onClearSearch={() => setStudentSearchQuery("")}
                />

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredStudents.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                />
              </div>
            )}
          </div>
        </div>

        <InviteModal
          isOpen={showInviteModal}
          selectedSection={selectedSection}
          totalStudents={totalStudents}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchResults={searchResults}
          isSearching={isSearching}
          selectedStudents={selectedStudents}
          onStudentSelection={handleStudentSelection}
          onInvite={inviteStudents}
          onClose={() => setShowInviteModal(false)}
          submitting={submitting}
        />
      </div>
    </NotificationProvider>
  );
}
