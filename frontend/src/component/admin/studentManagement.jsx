import React, { useEffect, useState } from "react";
import { NavbarSimple } from "./adminsidebar";
import { authenticatedFetch } from "../../utils/auth";
import Pagination from "../common/Pagination";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationProvider } from "../common/NotificationModals";
import { IconArchive, IconArchiveOff } from "@tabler/icons-react";

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
            <h1 className="xs:mt-6 sm:mt-10 text-xl xs:text-2xl sm:text-3xl font-bold text-[#1E3A5F] mb-4 xs:mb-6 sm:mb-8 font-outfit max-[880px]:mt-6 xs:max-[880px]:mt-10">
              Student Management
            </h1>

          {loading ? (
            <div className="flex justify-center py-6 xs:py-8">
              <div className="animate-spin rounded-full h-6 w-6 xs:h-8 xs:w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-3 xs:p-4 sm:p-6 border-2 border-gray-200 mx-2 xs:mx-0">
              {/* Search Section - Responsive */}
              <div className="flex flex-col sm:flex-row sm:items-center mb-4 xs:mb-6 gap-3 xs:gap-4">
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:max-w-sm md:max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm xs:text-sm "
                />
              </div>

              {paginatedStudents.length === 0 ? (
                <p className="text-gray-500 text-center py-6 xs:py-8 text-xs xs:text-sm sm:text-base px-4">
                  {searchTerm ? `No students found matching "${searchTerm}"` : "No students found."}
                </p>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden xl:block overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">College</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year Level</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {paginatedStudents.map((student) => (
                          <tr key={student._id} className="hover:bg-gray-50">
                            <td className="px-3 py-3 text-sm">{student.studid}</td>
                            <td className="px-3 py-3 text-sm font-medium">{student.fullName}</td>
                            <td className="px-3 py-3 text-sm text-blue-600 break-all">{student.email}</td>
                            <td className="px-3 py-3 text-sm">{student.college}</td>
                            <td className="px-3 py-3 text-sm">{student.course}</td>
                            <td className="px-3 py-3 text-sm">{student.yearLevel}</td>  
                            <td className="px-3 py-3 text-sm">
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                {student.status}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleArchive(student._id)}
                                  className="inline-flex items-center px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                                >
                                  <IconArchive className="w-3 h-3 mr-1" />
                                  Archive
                                </button>
                                {/* <button
                                  onClick={() => handleDelete(student._id)}
                                  className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
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

                  {/* Tablet Table View - Simplified */}
                  <div className="hidden md:block xl:hidden overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course Info</th>
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {paginatedStudents.map((student) => (
                          <tr key={student._id} className="hover:bg-gray-50">
                            <td className="px-2 py-3">
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">{student.fullName}</div>
                                <div className="text-xs text-gray-500">{student.studid}</div>
                                <div className="text-xs text-blue-600 break-all">{student.email}</div>
                              </div>
                            </td>
                            <td className="px-2 py-3">
                              <div className="text-xs text-gray-600">
                                <div><span className="font-medium">{student.college}</span></div>
                                <div>{student.course}</div>
                                <div>Year {student.yearLevel}</div>
                              </div>
                            </td>
                            <td className="px-2 py-3">
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                {student.status}
                              </span>
                            </td>
                            <td className="px-2 py-3">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleArchive(student._id)}
                                  className="inline-flex items-center px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                                >
                                  <IconArchive className="w-3 h-3 mr-1" />
                                  Archive
                                </button>
                                {/* <button
                                  onClick={() => handleDelete(student._id)}
                                  className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
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
                  <div className="md:hidden space-y-3">
                    {paginatedStudents.map((student) => (
                      <div key={student._id} className="bg-gray-50 rounded-lg p-3 xs:p-4 border border-gray-200">
                        <div className="flex flex-col gap-3">
                          {/* Header with name and status */}
                          <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-sm xs:text-base">{student.fullName}</h3>
                              <p className="text-xs text-gray-500">ID: {student.studid}</p>
                            </div>
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs w-fit">
                              {student.status}
                            </span>
                          </div>
                          
                          {/* Student details */}
                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="break-all">
                              <span className="font-medium">Email:</span> 
                              <span className="text-blue-600 ml-1">{student.email}</span>
                            </div>
                            <div>
                              <span className="font-medium">College:</span> {student.college}
                            </div>
                            <div className="flex flex-col xs:flex-row xs:gap-4">
                              <div>
                                <span className="font-medium">Course:</span> {student.course}
                              </div>
                              <div>
                                <span className="font-medium">Year:</span> {student.yearLevel}
                              </div>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                            <button
                              onClick={() => handleArchive(student._id)}
                              className="inline-flex items-center px-3 py-2 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 transition-colors"
                            >
                              <IconArchive className="w-3 h-3 mr-1" />
                              Archive
                            </button>
                            {/* <button
                              onClick={() => handleDelete(student._id)}
                              className="px-3 py-2 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 transition-colors"
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
