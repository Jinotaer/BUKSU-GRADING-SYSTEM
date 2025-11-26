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
  InstructorTable,
  InstructorMobileCard,
  InviteInstructorModal,
} from "./ui/instructors";

export default function InstructorManagement() {
  const [instructors, setInstructors] = useState([]);
  const [filteredInstructors, setFilteredInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Notification system
  const notifications = useNotifications();
  const { showError, showSuccess, showConfirmDialog, hideConfirmDialog } = notifications;

  // Invite form data
  const [inviteData, setInviteData] = useState({
    instructorid: "",
    email: "",
    fullName: "",
    college: "",
    department: "",
  });

  const colleges = [
    "College of Technologies",
    "College of Education",
    "College of Business",
    "College of Arts and Science",
    "College of Public Administration",
    "College of Nursing",
    "College of Law",
  ];

  // Fetch instructors function
  const fetchInstructors = async () => {
    try {
      setLoading(true);

      const res = await authenticatedFetch(
        "http://localhost:5000/api/admin/instructors?limit=12000"
      );

      if (res.ok) {
        const data = await res.json();
        const list = data.instructors || [];
        setInstructors(list);
        setFilteredInstructors(list);
      } else {
        const errorData = await res.json();
        showError(errorData.message || "Failed to fetch instructors");
      }
    } catch (err) {
      showError("There was an error processing your request.");
      console.error("Error fetching instructors:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch instructors on component mount
  useEffect(() => {
    fetchInstructors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Filter instructors
  useEffect(() => {
    const filtered = instructors.filter(
      (instructor) =>
        instructor.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.instructorid?.includes(searchTerm) ||
        instructor._id?.includes(searchTerm) ||
        instructor.college?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredInstructors(filtered);
    setCurrentPage(1);
  }, [searchTerm, instructors]);

  // Pagination
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

  // Invite handler
  const handleInvite = async (e) => {
    e.preventDefault();

    if (
      !inviteData.instructorid ||
      !inviteData.email ||
      !inviteData.fullName ||
      !inviteData.college ||
      !inviteData.department
    ) {
      showError("All fields are required.");
      return;
    }

    if (!inviteData.email.endsWith("@gmail.com")) {
      showError("Email must be a valid @buksu.edu.ph domain.");
      return;
    }

    try {
      setLoading(true);
      const res = await authenticatedFetch(
        "http://localhost:5000/api/admin/instructors/invite",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inviteData),
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
        await fetchInstructors();
      } else {
        const errorData = await res.json();
        showError(errorData.message || "Failed to send invitation.");
      }
    } catch {
      showError("Network error occurred while sending invitation.");
    } finally {
      setLoading(false);
    }
  };

  // Delete handler
  // const handleDeleteInstructor = async (id) => {
  //   if (!id) {
  //     showError("Invalid instructor ID");
  //     return;
  //   }

  //   const instructor = instructors.find(inst => (inst._id || inst.id) === id);
  //   const instructorName = instructor?.fullName || instructor?.name || "this instructor";

  //   showConfirmDialog(
  //     "Delete Instructor",
  //     `Are you sure you want to delete "${instructorName}"? This action cannot be undone.`,
  //     async () => {
  //       try {
  //         setLoading(true);
  //         const res = await authenticatedFetch(
  //           `http://localhost:5000/api/admin/instructors/${id}`,
  //           { method: "DELETE" }
  //         );

  //         if (res.ok) {
  //           setInstructors((prev) =>
  //             prev.filter((inst) => (inst._id || inst.id) !== id)
  //           );
  //           setFilteredInstructors((prev) =>
  //             prev.filter((inst) => (inst._id || inst.id) !== id)
  //           );
  //           // Close confirmation dialog first
  //           hideConfirmDialog();
  //           // Then show success notification
  //           setTimeout(() => {
  //             showSuccess("Instructor deleted successfully!");
  //           }, 100);
  //         } else {
  //           const errorData = await res.json().catch(() => ({}));
  //           hideConfirmDialog();
  //           setTimeout(() => {
  //             showError(errorData.message || "Failed to delete instructor");
  //           }, 100);
  //         }
  //       } catch (err) {
  //         hideConfirmDialog();
  //         setTimeout(() => {
  //           showError("There was an error processing your request.");
  //         }, 100);
  //         console.error("Delete instructor error:", err);
  //       } finally {
  //         setLoading(false);
  //       }
  //     }
  //   );
  // };

  // Archive handler
  const handleArchiveInstructor = async (id) => {
    if (!id) {
      showError("Invalid instructor ID");
      return;
    }

    const instructor = instructors.find(inst => (inst._id || inst.id) === id);
    const instructorName = instructor?.fullName || instructor?.name || "this instructor";

    showConfirmDialog(
      "Archive Instructor",
      `Are you sure you want to archive "${instructorName}"? They will be hidden from normal operations but can be restored later.`,
      async () => {
        try {
          setLoading(true);
          const res = await authenticatedFetch(
            `http://localhost:5000/api/admin/instructors/${id}/archive`,
            { method: "PUT" }
          );

          if (res.ok) {
            setInstructors((prev) =>
              prev.filter((inst) => (inst._id || inst.id) !== id)
            );
            setFilteredInstructors((prev) =>
              prev.filter((inst) => (inst._id || inst.id) !== id)
            );
            hideConfirmDialog();
            setTimeout(() => {
              showSuccess("Instructor archived successfully!");
            }, 100);
          } else {
            const errorData = await res.json().catch(() => ({}));
            hideConfirmDialog();
            setTimeout(() => {
              showError(errorData.message || "Failed to archive instructor");
            }, 100);
          }
        } catch (err) {
          hideConfirmDialog();
          setTimeout(() => {
            showError("There was an error processing your request.");
          }, 100);
          console.error("Archive instructor error:", err);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  return (
    <NotificationProvider notifications={notifications}>
    <div className="flex min-h-screen bg-[#E8EDF2]">
      <NavbarSimple />

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20">
        <div className="max-w-full mx-auto">
          <PageHeader />

          {/* Loading / Error / Table */}
          {loading ? (
            <LoadingSpinner />
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
