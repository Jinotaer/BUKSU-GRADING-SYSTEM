import React, { useEffect, useState } from "react";
import { NavbarSimple } from "./adminsidebar";
import { authenticatedFetch } from "../../utils/auth";
import Pagination from "../common/Pagination";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationProvider } from "../common/NotificationModals";

export default function AllUserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Notification system
  const notifications = useNotifications();
  const { showError, showSuccess, showConfirmDialog, hideConfirmDialog } = notifications;

  useEffect(() => {
    fetchAllUsers();
  }, []);
  const fetchAllUsers = async () => {
    try {
      setLoading(true);

      // Fetch both students and instructors in parallel
      const [studentsRes, instructorsRes] = await Promise.all([
        authenticatedFetch("http://localhost:5000/api/admin/students"),
        authenticatedFetch("http://localhost:5000/api/admin/instructors"),
      ]);

      let allUsers = [];

      // Process students
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        const students = (studentsData.students || []).map((student) => ({
          id: student.studid || student._id,
          _id: student._id,
          name: student.fullName,
          email: student.email,
          college: student.college,
          department: student.course, // Using course as department for students
          role: "Student",
          userType: "student",
          status: student.status,
          originalData: student,
        }));
        allUsers = [...allUsers, ...students];
      }

      // Process instructors
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
  };

  // Filter users based on search term and role filter
  useEffect(() => {
    let filtered = users;

    // Filter by role
    if (roleFilter !== "All") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Filter by search term
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
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, roleFilter, users]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleDelete = async (user) => {
    const confirmMessage = `Are you sure you want to delete ${user.role.toLowerCase()} "${
      user.name
    }"? This action cannot be undone.`;

    showConfirmDialog(
      `Delete ${user.role}`,
      confirmMessage,
      async () => {
        try {
          setLoading(true);

          let endpoint;
          if (user.userType === "student") {
            endpoint = `http://localhost:5000/api/admin/students/${user._id}`;
          } else {
            endpoint = `http://localhost:5000/api/admin/instructors/${user._id}`;
          }

          const res = await authenticatedFetch(endpoint, {
            method: "DELETE",
          });

          if (res.ok) {
            // Remove user from state
            setUsers((prev) => prev.filter((u) => u._id !== user._id));
            // Close confirmation dialog first
            hideConfirmDialog();
            // Then show success notification
            setTimeout(() => {
              showSuccess(`${user.role} deleted successfully!`);
            }, 100);
          } else {
            const errorData = await res.json().catch(() => ({}));
            hideConfirmDialog();
            setTimeout(() => {
              showError(
                errorData.message || `Failed to delete ${user.role.toLowerCase()}`
              );
            }, 100);
          }
        } catch (err) {
          hideConfirmDialog();
          setTimeout(() => {
            showError("There was an error processing your request.");
          }, 100);
          console.error("Delete error:", err);
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
          <h1 className="pt-8 text-xl sm:text-2xl md:text-3xl font-bold text-[#1E3A5F] mb-4 sm:mb-6 md:mb-8 font-outfit max-[880px]:mt-8 sm:max-[880px]:mt-10">
            All Users
          </h1>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 border-2 border-gray-200">
              {/* Search and Filter Section */}
              <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 min-w-[250px] max-w-[500px] px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                  />

                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full sm:w-auto sm:min-w-[120px] px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm bg-white"
                  >
                    <option value="All">All Roles</option>
                    <option value="Student">Students</option>
                    <option value="Instructor">Instructors</option>
                  </select>
                </div>

                <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                  Total: {filteredUsers.length} users
                </div>
              </div>

              {paginatedUsers.length === 0 ? (
                <p className="text-gray-500 text-center py-6 sm:py-8 text-xs sm:text-sm md:text-base">
                  {searchTerm || roleFilter !== "All"
                    ? `No users found matching your criteria`
                    : "No users found."}
                </p>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden xl:block overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-2 lg:px-4 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            ID
                          </th>
                          <th className="px-2 lg:px-4 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Name
                          </th>
                          <th className="px-2 lg:px-4 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Email
                          </th>
                          <th className="px-2 lg:px-4 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            College
                          </th>
                          <th className="px-2 lg:px-4 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Department
                          </th>
                          <th className="px-2 lg:px-4 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Role
                          </th>
                          <th className="px-2 lg:px-4 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-2 lg:px-4 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {paginatedUsers.map((user, index) => (
                          <tr
                            key={`${user.userType}-${user._id}-${index}`}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-2 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm font-medium truncate max-w-[80px]">
                              {user.id}
                            </td>
                            <td className="px-2 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm truncate max-w-[120px]">
                              {user.name}
                            </td>
                            <td className="px-2 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm text-blue-600 truncate max-w-[150px]">
                              {user.email}
                            </td>
                            <td className="px-2 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm truncate max-w-[100px]">
                              {user.college}
                            </td>
                            <td className="px-2 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm truncate max-w-[100px]">
                              {user.department}
                            </td>
                            <td className="px-2 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.role === "Student"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {user.role}
                              </span>
                            </td>
                            <td className="px-2 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm">
                              {getStatusBadge(user)}
                            </td>
                            <td className="px-2 lg:px-4 py-2 lg:py-3">
                              <button
                                onClick={() => handleDelete(user)}
                                className="px-2 lg:px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                                disabled={loading}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Tablet Table View - Simplified columns */}
                  <div className="hidden md:block xl:hidden overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Name
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Email
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            College
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Role
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {paginatedUsers.map((user, index) => (
                          <tr
                            key={`${user.userType}-${user._id}-${index}`}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-3 py-2 text-sm">
                              <div className="font-medium">{user.name}</div>
                              <div className="text-xs text-gray-500">
                                ID: {user.id}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm text-blue-600 truncate max-w-[150px]">
                              {user.email}
                            </td>
                            <td className="px-3 py-2 text-sm">
                              <div>{user.college}</div>
                              <div className="text-xs text-gray-500">
                                {user.department}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm">
                              <div className="flex flex-col gap-1">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${
                                    user.role === "Student"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-purple-100 text-purple-800"
                                  }`}
                                >
                                  {user.role}
                                </span>
                                {getStatusBadge(user)}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <button
                                onClick={() => handleDelete(user)}
                                className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                                disabled={loading}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {paginatedUsers.map((user, index) => (
                      <div
                        key={`${user.userType}-${user._id}-${index}`}
                        className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-sm truncate">
                                {user.name}
                              </h3>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    user.role === "Student"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-purple-100 text-purple-800"
                                  }`}
                                >
                                  {user.role}
                                </span>
                                {getStatusBadge(user)}
                              </div>
                            </div>

                            <button
                              onClick={() => handleDelete(user)}
                              className="px-3 py-2 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors whitespace-nowrap self-start xs:self-center"
                              disabled={loading}
                            >
                              Delete
                            </button>
                          </div>

                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              <div>
                                <span className="font-medium">ID:</span>{" "}
                                {user.id}
                              </div>
                              <div className="break-all">
                                <span className="font-medium">Email:</span>{" "}
                                <span className="text-blue-600">
                                  {user.email}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              <div>
                                <span className="font-medium">College:</span>{" "}
                                {user.college}
                              </div>
                              <div>
                                <span className="font-medium">Dept:</span>{" "}
                                {user.department}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
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
