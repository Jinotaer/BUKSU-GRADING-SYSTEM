import React, { useEffect, useState, useCallback } from "react";
import { NavbarSimple } from "./adminsidebar";
import { authenticatedFetch } from "../../utils/auth";
import Pagination from "../common/Pagination";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationProvider } from "../common/NotificationModals";
import {
  PageHeader,
  LoadingSpinner,
  SearchAndFilters,
  EmptyState,
  UserTableDesktop,
  UserTableTablet,
  UserCardMobile,
} from "./ui/users";

export default function AllUserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const notifications = useNotifications();
  const { showError, showSuccess, showConfirmDialog, hideConfirmDialog } =
    notifications;

  const fetchAllUsers = useCallback(async () => {
    try {
      setLoading(true);
      const [studentsRes, instructorsRes] = await Promise.all([
        authenticatedFetch("http://localhost:5000/api/admin/students?limit=12000"),
        authenticatedFetch("http://localhost:5000/api/admin/instructors?limit=12000"),
      ]);

      let allUsers = [];

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        const students = (studentsData.students || []).map((student) => ({
          id: student.studid || student._id,
          _id: student._id,
          name: student.fullName,
          email: student.email,
          college: student.college,
          department: student.course,
          role: "Student",
          userType: "student",
          status: student.status,
          originalData: student,
        }));
        allUsers = [...allUsers, ...students];
      }

      if (instructorsRes.ok) {
        const instructorsData = await instructorsRes.json();
        const instructors = (instructorsData.instructors || []).map(
          (instructor) => ({
            id: instructor.instructorid || instructor._id,
            _id: instructor._id,
            name: instructor.fullName,
            email: instructor.email,
            college: instructor.college,
            department: instructor.department,
            role: "Instructor",
            userType: "instructor",
            status: instructor.status,
            originalData: instructor,
          })
        );
        allUsers = [...allUsers, ...instructors];
      }

      setUsers(allUsers);
      setFilteredUsers(allUsers);

      if (!studentsRes.ok && !instructorsRes.ok) {
        showError("Failed to fetch users");
      }
    } catch (err) {
      showError("There was an error processing your request.");
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  useEffect(() => {
    let filtered = users;

    if (roleFilter !== "All") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.id
            ?.toString()
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          user.college?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, users]);

  // Reset to page 1 when search term or role filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const handlePageChange = (page) => setCurrentPage(page);
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleArchive = async (id, type) => {
    if (!id || !type) {
      showError("Invalid user or missing type");
      return;
    }

    const endpoint =
      type === "instructor"
        ? `http://localhost:5000/api/admin/instructors/${id}/archive`
        : `http://localhost:5000/api/admin/students/${id}/archive`;

    const user = users.find((u) => (u._id || u.id) === id);
    const userName = user?.fullName || user?.name || "this user";

    showConfirmDialog(
      `Archive ${type === "instructor" ? "Instructor" : "Student"}`,
      `Are you sure you want to archive "${userName}"? They will be hidden from normal operations but can be restored later.`,
      async () => {
        try {
          setLoading(true);
          const res = await authenticatedFetch(endpoint, { method: "PUT" });

          if (res.ok) {
            setUsers((prev) => prev.filter((u) => (u._id || u.id) !== id));
            setFilteredUsers((prev) =>
              prev.filter((u) => (u._id || u.id) !== id)
            );
            hideConfirmDialog();
            setTimeout(() => {
              showSuccess(`${type} archived successfully!`);
            }, 100);
          } else {
            const errorData = await res.json().catch(() => ({}));
            hideConfirmDialog();
            setTimeout(() => {
              showError(errorData.message || `Failed to archive ${type}`);
            }, 100);
          }
        } catch (err) {
          hideConfirmDialog();
          setTimeout(() => {
            showError("There was an error processing your request.");
          }, 100);
          console.error(`Archive ${type} error:`, err);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const getStatusBadge = (user) => {
    const status = user.status || "Active";
    const colors = {
      Active: "bg-green-100 text-green-800",
      Approved: "bg-green-100 text-green-800",
      Invited: "bg-yellow-100 text-yellow-800",
      Pending: "bg-yellow-100 text-yellow-800",
      Rejected: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs ${
          colors[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <NotificationProvider notifications={notifications}>
      <div className="flex min-h-screen bg-[#E8EDF2]">
        <NavbarSimple />
        <div className="flex-1 p-2 sm:p-4 md:p-6 lg:p-8 ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-16 sm:max-[880px]:pt-20">
          <div className="max-w-full mx-auto">
            <PageHeader />

            {loading ? (
              <LoadingSpinner />
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 border-2 border-gray-200">
                <SearchAndFilters
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  roleFilter={roleFilter}
                  onRoleFilterChange={setRoleFilter}
                  totalUsers={filteredUsers.length}
                />

                {paginatedUsers.length === 0 ? (
                  <EmptyState
                    hasFilters={searchTerm || roleFilter !== "All"}
                  />
                ) : (
                  <>
                    <UserTableDesktop
                      users={paginatedUsers}
                      onArchive={handleArchive}
                      getStatusBadge={getStatusBadge}
                    />

                    <UserTableTablet
                      users={paginatedUsers}
                      onArchive={handleArchive}
                      getStatusBadge={getStatusBadge}
                    />

                    <UserCardMobile
                      users={paginatedUsers}
                      onArchive={handleArchive}
                      getStatusBadge={getStatusBadge}
                    />

                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filteredUsers.length}
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
