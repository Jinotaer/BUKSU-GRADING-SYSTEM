import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { NavbarSimple } from "./adminsidebar";
import { authenticatedFetch } from "../../utils/auth";
import { useAuthenticatedQuery } from "../../hooks/useAuthenticatedQuery";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [isMutating, setIsMutating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const notifications = useNotifications();
  const { showError, showSuccess, showConfirmDialog } = notifications;
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useAuthenticatedQuery({
    queryKey: ["admin", "students", "approved"],
    url: "http://localhost:5000/api/admin/students?status=Approved&limit=12000",
  });

  const students = data?.students || [];
  const filteredStudents = useMemo(
    () =>
      students.filter(
        (student) =>
          student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.studid?.includes(searchTerm) ||
          student.college?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.course?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [searchTerm, students]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleArchive = async (studentId) => {
    showConfirmDialog(
      "Archive Student",
      "Are you sure you want to archive this student? They will be hidden from normal operations but can be restored later.",
      async () => {
        try {
          setIsMutating(true);
          const res = await authenticatedFetch(
            `http://localhost:5000/api/admin/students/${studentId}/archive`,
            {
              method: "PUT",
            }
          );

          if (res.ok) {
            queryClient.setQueryData(
              ["admin", "students", "approved"],
              (previous) =>
                previous
                  ? {
                      ...previous,
                      students: (previous.students || []).filter(
                        (student) => student._id !== studentId
                      ),
                    }
                  : previous
            );
            queryClient.invalidateQueries({ queryKey: ["admin", "all-users"] });
            showSuccess("Student archived successfully!");
          } else {
            const errorData = await res.json().catch(() => ({}));
            showError(errorData.message || "Failed to archive student");
          }
        } catch {
          showError("There was an error processing your request.");
        } finally {
          setIsMutating(false);
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

            {isLoading || isMutating ? (
              <LoadingSpinner />
            ) : error ? (
              <div className="bg-white rounded-lg shadow-sm p-3 xs:p-4 sm:p-6 border-2 border-gray-200 mx-2 xs:mx-0 text-red-500">
                {error.message || "Failed to fetch students"}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-3 xs:p-4 sm:p-6 border-2 border-gray-200 mx-2 xs:mx-0">
                <SearchBar
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                />

                {paginatedStudents.length === 0 ? (
                  <EmptyState searchTerm={searchTerm} />
                ) : (
                  <>
                    <StudentTableDesktop
                      students={paginatedStudents}
                      onArchive={handleArchive}
                    />
                    <StudentTableTablet
                      students={paginatedStudents}
                      onArchive={handleArchive}
                    />
                    <StudentCardMobile
                      students={paginatedStudents}
                      onArchive={handleArchive}
                    />

                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filteredStudents.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={handlePageChange}
                      onItemsPerPageChange={handleItemsPerPageChange}
                      rowsPerPageOptions={[5, 10, 25, 50, 100]}
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
