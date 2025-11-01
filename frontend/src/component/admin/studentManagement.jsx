import React, { useEffect, useState } from "react";
import { NavbarSimple } from "./adminsidebar";
import { authenticatedFetch } from "../../utils/auth";
import Pagination from "../common/Pagination";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationProvider } from "../common/NotificationModals";
import {
  PageHeader,
  LoadingSpinner,
  SearchBar,
  EmptyState,
  StudentTableDesktop,
  StudentTableTablet,
  StudentCardMobile,
} from "./ui/students";

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Notification system
  const notifications = useNotifications();
  const { showError, showSuccess, showConfirmDialog } = notifications;

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const res = await authenticatedFetch("http://localhost:5000/api/admin/students?status=Approved");
        if (res.ok) {
          const data = await res.json();
          setStudents(data.students || []);
          setFilteredStudents(data.students || []);
        } else {
          showError("Failed to fetch students");
        }
      } catch {
        showError("There was an error processing your request.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Filter students based on search term
  useEffect(() => {
    const filtered = students.filter(student =>
      student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studid?.includes(searchTerm) ||
      student.college?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.course?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, students]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // const handleDelete = async (studentId) => {
  //   showConfirmDialog(
  //     'Delete Student',
  //     'Are you sure you want to delete this student? This action cannot be undone.',
  //     async () => {
  //       try {
  //         const res = await authenticatedFetch(`http://localhost:5000/api/admin/students/${studentId}`, {
  //           method: "DELETE",
  //         });
          
  //         if (res.ok) {
  //           setStudents(prev => prev.filter(s => s._id !== studentId));
  //           showSuccess("Student deleted successfully!");
  //         } else {
  //           showError("Failed to delete student");
  //         }
  //       } catch {
  //         showError("There was an error processing your request.");
  //       }
  //     }
  //   );
  // };

  const handleArchive = async (studentId) => {
    showConfirmDialog(
      'Archive Student',
      'Are you sure you want to archive this student? They will be hidden from normal operations but can be restored later.',
      async () => {
        try {
          const res = await authenticatedFetch(`http://localhost:5000/api/admin/students/${studentId}/archive`, {
            method: "PUT",
          });
          
          if (res.ok) {
            setStudents(prev => prev.filter(s => s._id !== studentId));
            showSuccess("Student archived successfully!");
          } else {
            const errorData = await res.json();
            showError(errorData.message || "Failed to archive student");
          }
        } catch {
          showError("There was an error processing your request.");
        }
      }
    );
  };

  return (
    <NotificationProvider notifications={notifications}>
      <div className="flex min-h-screen bg-[#E8EDF2]">
        <NavbarSimple />
        <div className="flex-1 p-2 xs:p-4 sm:p-6 lg:p-8 ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-16 xs:max-[880px]:pt-20">
          <div className="max-w-full mx-auto">
            <PageHeader />

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-3 xs:p-4 sm:p-6 border-2 border-gray-200 mx-2 xs:mx-0">
              <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

              {paginatedStudents.length === 0 ? (
                <EmptyState searchTerm={searchTerm} />
              ) : (
                <>
                  <StudentTableDesktop students={paginatedStudents} onArchive={handleArchive} />
                  <StudentTableTablet students={paginatedStudents} onArchive={handleArchive} />
                  <StudentCardMobile students={paginatedStudents} onArchive={handleArchive} />

                  {/* Pagination */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredStudents.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </NotificationProvider>
  );
}
