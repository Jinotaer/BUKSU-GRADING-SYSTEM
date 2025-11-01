import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { authenticatedFetch } from "../../utils/auth";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationProvider } from "../common/NotificationModals";
import Pagination from "../common/Pagination";
import { NavbarSimple } from "./adminsidebar";
import {
  PageHeader,
  SectionInfo,
  SearchBar,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  StudentTable,
} from "./ui/viewStudents";

export default function ViewInviteStudentPage() {
  const { sectionId } = useParams();
  // const navigate = useNavigate();

  const [sectionDetails, setSectionDetails] = useState(null);
  const [invitedStudents, setInvitedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // Notification system
  const notifications = useNotifications();
  const { showError, showSuccess, showConfirmDialog } = notifications;

  // ✅ Fetch Section Details
  const fetchSectionDetails = useCallback(async () => {
    try {
      const res = await authenticatedFetch(
        `http://localhost:5000/api/admin/sections/${sectionId}`
      );
      if (res.ok) {
        const data = await res.json();
        setSectionDetails(data.section);
      }
    } catch (err) {
      console.error("Error fetching section details:", err);
    }
  }, [sectionId]);

  // ✅ Fetch Invited Students
  const fetchInvitedStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authenticatedFetch(
        `http://localhost:5000/api/admin/sections/${sectionId}/students`
      );
      if (res.ok) {
        const data = await res.json();
        setInvitedStudents(data.students || []);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to fetch invited students");
      }
    } catch (err) {
      console.error("Error fetching invited students:", err);
      setError("Error fetching invited students");
    } finally {
      setLoading(false);
    }
  }, [sectionId]);

  // ✅ Remove Student
  const handleRemoveStudent = async (studentId, studentName) => {
    showConfirmDialog(
      "Remove Student",
      `Are you sure you want to remove "${studentName}" from this section?`,
      async () => {
        try {
          setSubmitting(true);
          const res = await authenticatedFetch(
            `http://localhost:5000/api/admin/sections/${sectionId}/remove-student`,
            {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ studentId }),
            }
          );

          const data = await res.json();
          if (res.ok) {
            await fetchInvitedStudents();
            showSuccess(`${studentName} has been removed successfully!`);
          } else {
            showError(data.message || "Failed to remove student");
          }
        } catch (err) {
          console.error("Error removing student:", err);
          showError("Error removing student: " + err.message);
        } finally {
          setSubmitting(false);
        }
      }
    );
  };

  useEffect(() => {
    if (sectionId) {
      fetchSectionDetails();
      fetchInvitedStudents();
    }
  }, [sectionId, fetchSectionDetails, fetchInvitedStudents]);

  // const handleGoBack = () => navigate("/admin/sections");

  const getSubjectName = () =>
    sectionDetails?.subject
      ? `${sectionDetails.subject.subjectCode} - ${sectionDetails.subject.subjectName}`
      : "Unknown Subject";

  const getInstructorName = () =>
    sectionDetails?.instructor?.fullName || "Unassigned";

  // ✅ Search + Pagination
  const filteredStudents = invitedStudents.filter((s) =>
    [s.fullName, s.email, s.studid]
      .filter(Boolean)
      .some((f) => f.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <NotificationProvider notifications={notifications}>
      <div className="flex flex-col lg:flex-row h-screen bg-gray-100 overflow-hidden">
        {/* Sidebar */}
        <div className="flex-shrink-0">
          <NavbarSimple />
        </div>

        {/* Main Content */}
        <div className="flex-1 mt-8 p-2 sm:p-4 md:p-6 w-full mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 pt-4 sm:pt-6 md:pt-8 lg:pt-10">
          <PageHeader />

          {/* Student Table */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
            {loading ? (
              <LoadingSpinner />
            ) : error ? (
              <ErrorState error={error} onRetry={fetchInvitedStudents} />
            ) : invitedStudents.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-100 p-4 sm:p-6 mb-6">
                  <SectionInfo
                    sectionDetails={sectionDetails}
                    invitedStudents={invitedStudents}
                    getSubjectName={getSubjectName}
                    getInstructorName={getInstructorName}
                  />

                  <SearchBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                  />

                  <StudentTable
                    students={paginatedStudents}
                    submitting={submitting}
                    onRemoveStudent={handleRemoveStudent}
                  />
                </div>

                {/* Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </NotificationProvider>
  );
}
