import React, { useEffect, useState } from "react";
import { NavbarSimple } from "./adminsidebar";
import { authenticatedFetch } from "../../utils/auth";
import Pagination from "../common/Pagination";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationProvider } from "../common/NotificationModals";
import { IconArchive, IconArchiveOff } from "@tabler/icons-react";

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
    "College of Arts and Sciences",
    "College of Public Administration",
    "College of Nursing",
  ];

  // Fetch instructors function
  const fetchInstructors = async () => {
    try {
      setLoading(true);

      const res = await authenticatedFetch(
        "http://localhost:5000/api/admin/instructors"
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
          <h1 className="pt-10 text-2xl sm:text-3xl font-bold text-[#1E3A5F] mb-6 sm:mb-8 font-outfit max-[880px]:mt-10">
            Instructor Management
          </h1>

          {/* Loading / Error / Table */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-2 border-gray-200">
              {/* Search + Invite */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <input
                  type="text"
                  placeholder="Search instructors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:max-w-sm md:max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium transition text-sm w-full sm:w-auto"
                >
                  Invite Instructor
                </button>
              </div>

              {/* Table View (Desktop) */}
              {paginatedInstructors.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-sm sm:text-base">
                  {searchTerm
                    ? `No instructors found matching "${searchTerm}"`
                    : "No instructors found."}
                </p>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Email
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            College
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Department
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paginatedInstructors.map((inst, i) => (
                          <tr
                            key={`${
                              inst.instructorid || inst._id || inst.id
                            }-${i}`}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 text-xs md:text-sm truncate max-w-[80px]">
                              {inst.instructorid ||
                                inst._id ||
                                inst.id ||
                                "N/A"}
                            </td>
                            <td className="px-4 py-3 text-xs md:text-sm">
                              {inst.fullName || inst.name || "N/A"}
                            </td>
                            <td className="px-4 py-3 text-xs md:text-sm text-blue-600 truncate">
                              {inst.email || "N/A"}
                            </td>
                            <td className="px-4 py-3 text-xs md:text-sm">
                              {inst.college || "N/A"}
                            </td>
                            <td className="px-4 py-3 text-xs md:text-sm">
                              {inst.department || "N/A"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    handleArchiveInstructor(inst._id || inst.id)
                                  }
                                  className="inline-flex items-center px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                                >
                                  <IconArchive className="w-3 h-3 mr-1" />
                                  Archive
                                </button>
                                {/* <button
                                  onClick={() =>
                                    handleDeleteInstructor(inst._id || inst.id)
                                  }
                                  className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                                >
                                  Delete
                                </button> */}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-4">
                    {paginatedInstructors.map((inst, i) => (
                      <div
                        key={`${inst.instructorid || inst._id || inst.id}-${i}`}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="space-y-2">
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {inst.fullName || inst.name || "N/A"}
                          </h3>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>
                              <span className="font-medium">ID:</span>{" "}
                              {inst.instructorid ||
                                inst._id ||
                                inst.id ||
                                "N/A"}
                            </div>
                            <div>
                              <span className="font-medium">Email:</span>{" "}
                              <span className="text-blue-600">
                                {inst.email || "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">College:</span>{" "}
                              {inst.college || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium">Department:</span>{" "}
                              {inst.department || "N/A"}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleArchiveInstructor(inst._id || inst.id)
                              }
                              className="inline-flex items-center px-3 py-2 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition"
                            >
                              <IconArchive className="w-3 h-3 mr-1" />
                              Archive
                            </button>
                            {/* <button
                              onClick={() =>
                                handleDeleteInstructor(inst._id || inst.id)
                              }
                              className="px-3 py-2 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition"
                            >
                              Delete
                            </button> */}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredInstructors.length}
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

      {/* Invite Instructor Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md mx-4 shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Invite Instructor</h2>
            <form onSubmit={handleInvite}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ID</label>
                  <input
                    type="text"
                    placeholder=""
                    value={inviteData.instructorid}
                    onChange={(e) =>
                      setInviteData((prev) => ({
                        ...prev,
                        instructorid: e.target.value,
                      }))
                    }
                    required
                   className="w-full px-3 py-2 border rounded-md text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"

                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="instructor@buksu.edu.ph"
                    value={inviteData.email}
                    onChange={(e) =>
                      setInviteData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-3 py-2 border rounded-md text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={inviteData.fullName}
                    onChange={(e) =>
                      setInviteData((prev) => ({
                        ...prev,
                        fullName: e.target.value,
                      }))
                    }
                    required
                className="w-full px-3 py-2 border rounded-md text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    College
                  </label>
                  <select
                    value={inviteData.college}
                    onChange={(e) =>
                      setInviteData((prev) => ({
                        ...prev,
                        college: e.target.value,
                      }))
                    }
                    required
                 className="w-full px-3 py-2 border rounded-md text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select college</option>
                    {colleges.map((college) => (
                      <option key={college} value={college}>
                        {college}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="BSIT"
                    value={inviteData.department}
                    onChange={(e) =>
                      setInviteData((prev) => ({
                        ...prev,
                        department: e.target.value,
                      }))
                    }
                    required
                  className="w-full px-3 py-2 border rounded-md text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false);
                      setInviteData({
                        instructorid: "",
                        email: "",
                        fullName: "",
                        college: "",
                        department: "",
                      });
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium"
                  >
                    Send Invitation
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </NotificationProvider>
  );
}
