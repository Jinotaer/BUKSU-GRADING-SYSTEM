import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  IconUsers,
  IconTrash,
  IconArrowLeft,
  IconAlertCircle,
  IconCalendar,
  IconUser,
  IconSchool,
} from "@tabler/icons-react";
import { authenticatedFetch } from "../../utils/auth";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationProvider } from "../common/NotificationModals";
import Pagination from "../common/Pagination";
import { NavbarSimple } from "./adminsidebar";

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
        <div className="flex-1 mt-8 p-2 sm:p-4 md:p-6  w-full mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65  max-[880px]:pt-20 pt-4 sm:pt-6 md:pt-8 lg:pt-10 ">
          {/* Header */}
          {/* <div className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-6 lg:px-10 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleGoBack}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <IconArrowLeft size={20} />
                  <span className="hidden sm:inline">Back to Sections</span>
                </button>
                <div>
                  <h1 className="text-lg sm:text-2xl font-semibold text-gray-800 flex items-center gap-2">
                    <IconUsers size={24} className="text-green-600" />
                    Invited Students
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 mt-1 truncate">
                    Section: {sectionDetails?.sectionName || "Loading..."}
                  </p>
                </div>
              </div>
            </div>
          </div> */}
          <h1 className="ml-2  pt-2 text-2xl sm:text-3xl font-bold text-[#1E3A5F] mb-4 sm:mb-8 font-outfit max-[880px]:mt-10">
            Invited Students
          </h1>
          {/* Section Info */}
          {/* {sectionDetails && (
            <div className="bg-blue-50 border-b border-blue-100 px-4 sm:px-6 lg:px-10 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <IconSchool size={16} className="text-blue-600" />
                  <span className="text-sm">
                    <strong>Subject:</strong> {getSubjectName()}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <IconUser size={16} className="text-blue-600" />
                  <span className="text-sm">
                    <strong>Instructor:</strong> {getInstructorName()}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <IconCalendar size={16} className="text-blue-600" />
                  <span className="text-sm">
                    <strong>Semester:</strong> {sectionDetails.schoolYear} -{" "}
                    {sectionDetails.term}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <IconUsers size={16} className="text-blue-600" />
                  <span className="text-sm">
                    <strong>Total:</strong> {invitedStudents.length} students
                  </span>
                </div>
              </div>
            </div>
          )} */}

          {/* Student Table */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <IconAlertCircle
                  className="mx-auto text-red-300 mb-4"
                  size={48}
                />
                <h3 className="text-lg font-medium text-red-600 mb-2">
                  Error Loading Students
                </h3>
                <p className="text-red-500 mb-4">{error}</p>
                <button
                  onClick={fetchInvitedStudents}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : invitedStudents.length === 0 ? (
              <div className="text-center py-12">
                <IconUsers className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  No students invited yet
                </h3>
                <p className="text-gray-500">
                  Use the "Invite Students" button to add students.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-100 p-4 sm:p-6 mb-6">
                  <div className=" mb-10 p-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <IconSchool size={20} className="text-blue-600" />
                      <span className="text-md">
                        <strong>Subject:</strong> {getSubjectName()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <IconUser size={20} className="text-blue-600" />
                      <span className="text-md">
                        <strong>Instructor:</strong> {getInstructorName()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <IconCalendar size={20} className="text-blue-600" />
                      <span className="text-md">
                        <strong>Semester:</strong> {sectionDetails.schoolYear} -{" "}
                        {sectionDetails.term}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <IconUsers size={20} className="text-blue-600" />
                      <span className="text-md">
                        <strong>Total:</strong> {invitedStudents.length}{" "}
                        students
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <h2 className="text-lg font-bold text-blue-900 tracking-tight">
                      Student List
                    </h2>
                    <input
                      type="text"
                      className="w-fulls sm:w-80 px-5 py-2 border border-gray-300 rounded-lg  focus:outline-none focus:ring-2 focus:ring-blue-500  text-gray-800 transition"
                      placeholder="Search students"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm sm:text-base border-collapse">
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
                           COURSE
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            YEAR LEVEL
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedStudents.map((student) => (
                          <tr
                            key={student._id}
                            className="hover:bg-blue-50 transition"
                          >
                            <td className="px-4 py-3 text-xs md:text-sm  max-w-[80px]">
                              {student.studid}
                            </td>
                            <td className="px-4 py-3 text-xs md:text-sm truncate max-w-[120px] whitespace-nowrap">
                              {student.fullName || "Unknown Student"}
                            </td>
                            <td className="px-4 py-3 text-xs md:text-sm text-blue-600 truncate">
                              {student.email}
                            </td>
                            <td className="px-4 py-3 text-xs md:text-sm truncate max-w-[120px]">
                              {student.course}
                            </td>
                            <td className="px-4 py-3 text-xs md:text-sm">
                              {student.yearLevel}
                            </td>
                            <td className="px-3 sm:px-5 py-3 ">
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-semibold shadow-sm">
                                Invited
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() =>
                                  handleRemoveStudent(
                                    student._id,
                                    student.fullName || "Student"
                                  )
                                }
                                disabled={submitting}
                                className=" px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
