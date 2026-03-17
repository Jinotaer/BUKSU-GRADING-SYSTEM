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
  InstructorTable,
  InstructorMobileCard,
  InviteInstructorModal,
} from "./ui/instructors";

const normalizeLookupValue = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";
const ALLOWED_INSTRUCTOR_EMAIL_DOMAINS = [
  "@gmail.com",
  "@buksu.edu.ph",
  "@student.buksu.edu.ph",
];
const isAllowedInstructorEmail = (email) =>
  ALLOWED_INSTRUCTOR_EMAIL_DOMAINS.some((domain) => email.endsWith(domain));

export default function InstructorManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [inviteData, setInviteData] = useState({
    instructorid: "",
    email: "",
    fullName: "",
    college: "",
    department: "",
  });

  const notifications = useNotifications();
  const { showError, showSuccess, showConfirmDialog } = notifications;
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useAuthenticatedQuery({
    queryKey: ["admin", "instructors", "all"],
    url: "http://localhost:5000/api/admin/instructors?limit=12000",
  });

  const instructors = data?.instructors || [];
  const filteredInstructors = useMemo(
    () =>
      instructors.filter(
        (instructor) =>
          instructor.fullName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          instructor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          instructor.instructorid?.includes(searchTerm) ||
          instructor._id?.includes(searchTerm) ||
          instructor.college?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          instructor.department
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      ),
    [instructors, searchTerm]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const colleges = [
    "College of Technologies",
    "College of Education",
    "College of Business",
    "College of Arts and Science",
    "College of Public Administration",
    "College of Nursing",
    "College of Law",
  ];

  const totalPages = Math.ceil(filteredInstructors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInstructors = filteredInstructors.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePageChange = (page) => setCurrentPage(page);
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleInvite = async (event) => {
    event.preventDefault();

    const payload = {
      instructorid: inviteData.instructorid.trim(),
      email: normalizeLookupValue(inviteData.email),
      fullName: inviteData.fullName.trim(),
      college: inviteData.college.trim(),
      department: inviteData.department.trim(),
    };

    if (
      !payload.instructorid ||
      !payload.email ||
      !payload.fullName ||
      !payload.college ||
      !payload.department
    ) {
      showError("All fields are required.");
      return;
    }

    const duplicateById = instructors.find(
      (instructor) =>
        normalizeLookupValue(instructor.instructorid) ===
        normalizeLookupValue(payload.instructorid)
    );
    const duplicateByEmail = instructors.find(
      (instructor) =>
        normalizeLookupValue(instructor.email) ===
        normalizeLookupValue(payload.email)
    );

    if (duplicateById && duplicateByEmail) {
      showError("Instructor ID and email already exist.");
      return;
    }

    if (duplicateById) {
      showError("Instructor ID already exists.");
      return;
    }

    if (duplicateByEmail) {
      showError("Instructor email already exists.");
      return;
    }

    if (!isAllowedInstructorEmail(payload.email)) {
      showError(
        "Invalid instructor email domain. Use @gmail.com, @buksu.edu.ph, or @student.buksu.edu.ph."
      );
      return;
    }

    try {
      setIsMutating(true);
      const res = await authenticatedFetch(
        "http://localhost:5000/api/admin/instructors/invite",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        showSuccess("Instructor invitation sent successfully!");
        setShowInviteModal(false);
        setInviteData({
          instructorid: "",
          email: "",
          fullName: "",
          college: "",
          department: "",
        });
        await queryClient.invalidateQueries({
          queryKey: ["admin", "instructors"],
        });
        await queryClient.invalidateQueries({ queryKey: ["admin", "all-users"] });
      } else {
        const errorData = await res.json().catch(() => ({}));
        showError(errorData.message || "Failed to send invitation.");
      }
    } catch {
      showError("Network error occurred while sending invitation.");
    } finally {
      setIsMutating(false);
    }
  };

  const handleArchiveInstructor = async (id) => {
    if (!id) {
      showError("Invalid instructor ID");
      return;
    }

    const instructor = instructors.find((item) => (item._id || item.id) === id);
    const instructorName =
      instructor?.fullName || instructor?.name || "this instructor";

    showConfirmDialog(
      "Archive Instructor",
      `Are you sure you want to archive "${instructorName}"? They will be hidden from normal operations but can be restored later.`,
      async () => {
        try {
          setIsMutating(true);
          const res = await authenticatedFetch(
            `http://localhost:5000/api/admin/instructors/${id}/archive`,
            { method: "PUT" }
          );

          if (res.ok) {
            queryClient.setQueryData(
              ["admin", "instructors", "all"],
              (previous) =>
                previous
                  ? {
                      ...previous,
                      instructors: (previous.instructors || []).filter(
                        (item) => (item._id || item.id) !== id
                      ),
                    }
                  : previous
            );
            queryClient.invalidateQueries({ queryKey: ["admin", "all-users"] });
            showSuccess("Instructor archived successfully!");
          } else {
            const errorData = await res.json().catch(() => ({}));
            showError(errorData.message || "Failed to archive instructor");
          }
        } catch (err) {
          showError("There was an error processing your request.");
          console.error("Archive instructor error:", err);
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

        <div className="flex-1 p-4 sm:p-6 lg:p-8 ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20">
          <div className="max-w-full mx-auto">
            <PageHeader />

            {isLoading || isMutating ? (
              <LoadingSpinner />
            ) : error ? (
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-2 border-gray-200 text-red-500">
                {error.message || "Failed to fetch instructors"}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-2 border-gray-200">
                <SearchBar
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  onInviteClick={() => setShowInviteModal(true)}
                />

                {paginatedInstructors.length === 0 ? (
                  <EmptyState searchTerm={searchTerm} />
                ) : (
                  <>
                    <InstructorTable
                      instructors={paginatedInstructors}
                      onArchive={handleArchiveInstructor}
                    />

                    <InstructorMobileCard
                      instructors={paginatedInstructors}
                      onArchive={handleArchiveInstructor}
                    />

                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filteredInstructors.length}
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

        <InviteInstructorModal
          show={showInviteModal}
          inviteData={inviteData}
          onClose={() => {
            setShowInviteModal(false);
            setInviteData({
              instructorid: "",
              email: "",
              fullName: "",
              college: "",
              department: "",
            });
          }}
          onSubmit={handleInvite}
          onChange={setInviteData}
          colleges={colleges}
        />
      </div>
    </NotificationProvider>
  );
}
