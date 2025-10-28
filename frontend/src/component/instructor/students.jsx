import React, { useState, useEffect, useMemo } from "react";
import {
  IconUsers,
  IconBook,
  IconX,
  IconChalkboard,
  IconUserPlus,
  IconRefresh,
  IconSearch,
} from "@tabler/icons-react";

import { InstructorSidebar } from "./instructorSidebar";
import { authenticatedFetch } from "../../utils/auth";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationProvider } from "../common/NotificationModals";

export default function SectionsStudentTable() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [selectedSection, setSelectedSection] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Search (for invite modal)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Search for students in current section
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  // Notifications
  const notifications = useNotifications();
  const { showError, showSuccess, showConfirmDialog } = notifications;

  // ===== Effects =====
  useEffect(() => {
    fetchSections({ setDefault: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search for invite modal
  useEffect(() => {
    const t = setTimeout(() => {
      performStudentSearch(searchQuery);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // ===== Data fetching =====
  const fetchSections = async ({
    keepSelected = false,
    setDefault = false,
  } = {}) => {
    try {
      setLoading(true);
      const res = await authenticatedFetch(
        "http://localhost:5000/api/instructor/sections"
      );
      if (!res.ok) {
        const err = await res.json();
        showError(err.message || "Failed to fetch sections");
        console.error("Sections fetch error:", err);
        setSections([]);
        return;
      }
      const data = await res.json();
      console.log("Fetched sections data:", data);
      const fetched = Array.isArray(data.sections) ? data.sections : [];
      setSections(fetched);

      if (keepSelected && selectedSection) {
        const updated =
          fetched.find((s) => s._id === selectedSection._id) || null;
        setSelectedSection(updated);
      } else if (setDefault && !selectedSection && fetched.length > 0) {
        setSelectedSection(fetched[0]);
      } else if (fetched.length === 0) {
        setSelectedSection(null);
      }
    } catch (e) {
      console.error("Error fetching sections", e);
      showError("Error fetching sections");
      setSections([]);
      setSelectedSection(null);
    } finally {
      setLoading(false);
    }
  };

  const performStudentSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      setIsSearching(true);
      const res = await authenticatedFetch(
        `http://localhost:5000/api/instructor/search-students?q=${encodeURIComponent(
          query
        )}`
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.students || []);
      } else {
        setSearchResults([]);
      }
    } catch (e) {
      console.error("Error searching students", e);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // ===== Invite flow =====
  const handleStudentSelection = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const inviteStudents = async () => {
    if (!selectedSection || selectedStudents.length === 0) return;
    try {
      setSubmitting(true);
      const res = await authenticatedFetch(
        `http://localhost:5000/api/instructor/sections/${selectedSection._id}/invite-students`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentIds: selectedStudents }),
        }
      );
      if (res.ok) {
        showSuccess("Students invited successfully!");
        setShowInviteModal(false);
        setSelectedStudents([]);
        setSearchQuery("");
        setSearchResults([]);
        // refresh and keep the same section selected
        await fetchSections({ keepSelected: true });
      } else {
        const err = await res.json();
        showError(err.message || "Failed to invite students");
      }
    } catch (e) {
      console.error("Error inviting students", e);
      showError("Error inviting students");
    } finally {
      setSubmitting(false);
    }
  };

  const openInvite = () => {
    if (!selectedSection) return;
    setShowInviteModal(true);
    setSelectedStudents([]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveStudent = (studentId) => {
    if (!selectedSection || !studentId) return;
    
    // Find the student name for confirmation
    const student = students.find(s => s._id === studentId);
    const studentName = student ? `${student.first_name} ${student.last_name}`.trim() : 'this student';
    
    showConfirmDialog(
      'Remove Student',
      `Are you sure you want to remove ${studentName} from this section? This action cannot be undone.`,
      async () => {
        try {
          const res = await authenticatedFetch(
            `http://localhost:5000/api/instructor/sections/${selectedSection._id}/students/${studentId}`,
            {
              method: "DELETE",
            }
          );
          
          if (res.ok) {
            showSuccess("Student removed successfully!");
            // Refresh sections to update the student list
            await fetchSections({ keepSelected: true });
          } else {
            const err = await res.json();
            showError(err.message || "Failed to remove student");
          }
        } catch (e) {
          console.error("Error removing student", e);
          showError("Error removing student");
        }
      }
    );
  };

  // ===== Derived =====
  const students = useMemo(() => {
    if (!selectedSection) return [];
    if (!Array.isArray(selectedSection.students)) {
      console.warn(
        "selectedSection.students is not an array",
        selectedSection.students
      );
      return [];
    }
    console.log("Processing students:", selectedSection.students);
    return selectedSection.students.map((s) => ({
      _id: s._id,
      first_name: s.fullName
        ? s.fullName.split(" ")[0]
        : s.first_name || s.firstName || "",
      last_name: s.fullName
        ? s.fullName.split(" ").slice(1).join(" ")
        : s.last_name || s.lastName || "",
      student_id: s.studid || s.student_id || s.studentId || "",
      email: s.email || "",
      status: s.status || "Active",
    }));
  }, [selectedSection]);

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) {
      return students;
    }
    
    const query = studentSearchQuery.toLowerCase();
    return students.filter((student) => {
      const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
      const studentId = student.student_id.toLowerCase();
      const email = student.email.toLowerCase();
      
      return fullName.includes(query) || 
             studentId.includes(query) || 
             email.includes(query);
    });
  }, [students, studentSearchQuery]);

  const totalStudents = students.length;
  const filteredStudentsCount = filteredStudents.length;

  // ===== Helpers =====
  const sectionLabel = (sec) => {
    // Backend uses different field names
    const subject =
      sec.subject?.subjectName || sec.subject?.subject_name || "No Subject";
    const schoolYear = sec.schoolYear || sec.semester?.academic_year || "N/A";
    const term = sec.term || sec.semester?.semester_name || "No Term";
    return `${
      sec.sectionName || sec.section_name
    } — ${subject} — ${term} ${schoolYear}`;
  };

  // ===== Render =====
  return (
    <NotificationProvider notifications={notifications}>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <InstructorSidebar/>

        <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-16 sm:max-[880px]:pt-20 mt-6 sm:mt-8 md:mt-10">
          {/* Header */}
          <div className="max-w-7xl mx-auto w-full">
            <div className="mb-3 sm:mb-4">
              <h1 className="font-outfit text-[#1E3A5F] text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mt-2 sm:mt-4 md:mt-6">Students</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Select a section, review students in a table, and add more.
              </p>
            </div>

            {/* Controls Row */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Section
                </label>
                <select
                  className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm p-2 sm:p-2.5 border truncate"
                  value={selectedSection?._id || ""}
                  onChange={(e) => {
                    const sec = sections.find((s) => s._id === e.target.value);
                    setSelectedSection(sec || null);
                  }}
                  disabled={loading || sections.length === 0}
                >
                  {sections.length === 0 ? (
                    <option value="">No sections</option>
                  ) : (
                    sections.map((sec) => (
                      <option key={sec._id} value={sec._id}>
                        {sectionLabel(sec)}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => fetchSections({ keepSelected: true })}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-lg border text-xs sm:text-sm bg-white hover:bg-gray-50 border-gray-300 disabled:opacity-50 whitespace-nowrap flex-1 sm:flex-initial"
                >
                  <IconRefresh
                    className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${loading ? "animate-spin" : ""}`}
                  />
                  <span className="hidden xs:inline">Refresh</span>
                </button>
                <button
                  onClick={openInvite}
                  disabled={!selectedSection}
                  className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap flex-1 sm:flex-initial"
                >
                  <IconUserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Add Students</span>
                </button>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : sections.length === 0 ? (
              <div className="mt-4 sm:mt-6 bg-white rounded-lg sm:rounded-xl border border-gray-200 p-6 sm:p-8 md:p-10 text-center">
                <IconBook className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  No Sections Assigned
                </h3>
                <p className="text-sm sm:text-base text-gray-500 mt-1">
                  You don't have any sections yet.
                </p>
              </div>
            ) : !selectedSection ? (
              <div className="mt-4 sm:mt-6 bg-white rounded-lg sm:rounded-xl border border-gray-200 p-6 sm:p-8 md:p-10 text-center">
                <IconChalkboard className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Choose a section
                </h3>
                <p className="text-sm sm:text-base text-gray-500 mt-1">
                  Use the dropdown above to view students.
                </p>
              </div>
            ) : (
              <div className="mt-4 sm:mt-6 bg-white rounded-lg sm:rounded-xl border border-gray-200 overflow-hidden">
                {/* Table header */}
                <div className="px-3 sm:px-4 py-3 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">
                        {selectedSection.sectionName ||
                          selectedSection.section_name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">
                        {selectedSection.subject?.subjectName ||
                          selectedSection.subject?.subject_name ||
                          "No Subject"}{" "}
                        ·{" "}
                        {selectedSection.term ||
                          selectedSection.semester?.semester_name ||
                          "No Term"}{" "}
                        {selectedSection.schoolYear ||
                          selectedSection.semester?.academic_year ||
                          ""}
                      </p>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 flex-shrink-0">
                      <IconUsers className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> 
                      {studentSearchQuery.trim() ? `${filteredStudentsCount} of ${totalStudents}` : totalStudents}
                    </div>
                  </div>
                  
                  {/* Search input */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex-1 sm:max-w-xs relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
                        <IconSearch className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        className="w-full pl-8 sm:pl-10 pr-2.5 sm:pr-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    {studentSearchQuery.trim() && (
                      <button
                        onClick={() => setStudentSearchQuery("")}
                        className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 whitespace-nowrap"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Student ID
                        </th>
                        <th
                          scope="col"
                          className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Name
                        </th>
                        <th
                          scope="col"
                          className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Email
                        </th>
                        <th
                          scope="col"
                          className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-3 sm:px-4 py-6 sm:py-8 text-center text-xs sm:text-sm text-gray-500"
                          >
                            No students yet. Click{" "}
                            <span className="font-medium">Add Students</span> to
                            invite.
                          </td>
                        </tr>
                      ) : filteredStudents.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-3 sm:px-4 py-6 sm:py-8 text-center text-xs sm:text-sm text-gray-500"
                          >
                            No students match your search criteria.{" "}
                            <button
                              onClick={() => setStudentSearchQuery("")}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              Clear search
                            </button>
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((s) => (
                          <tr key={s._id} className="hover:bg-gray-50">
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                              {s.student_id || "—"}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 font-medium">
                              <div className="max-w-[150px] sm:max-w-none">
                                <div className="truncate">
                                  {`${s.first_name} ${s.last_name}`.trim() || "—"}
                                </div>
                                {/* Show email on mobile under name */}
                                {s.email && (
                                  <a
                                    href={`mailto:${s.email}`}
                                    className="md:hidden text-xs text-blue-600 hover:underline truncate block mt-0.5"
                                  >
                                    {s.email}
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="hidden md:table-cell px-4 py-3 text-sm">
                              {s.email ? (
                                <a
                                  href={`mailto:${s.email}`}
                                  className="text-blue-600 hover:underline"
                                >
                                  {s.email}
                                </a>
                              ) : (
                                <span className="text-gray-600">—</span>
                              )}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                              <button
                                onClick={() => handleRemoveStudent(s._id)}
                                className="inline-flex items-center px-2 sm:px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 whitespace-nowrap"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white rounded-lg sm:rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-start sm:items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-200 flex-shrink-0">
                <div className="flex-1 min-w-0 pr-2">
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 truncate">
                    Invite Students
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                    {selectedSection?.sectionName ||
                      selectedSection?.section_name}{" "}
                    ·{" "}
                    {selectedSection?.subject?.subjectName ||
                      selectedSection?.subject?.subject_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Current students: {totalStudents}
                  </p>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-1"
                >
                  <IconX className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>

              {/* Body */}
              <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Search by name, ID, or email
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Start typing…"
                    className="w-full px-2.5 sm:px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                  />
                </div>

                <div className="max-h-40 sm:max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  {searchQuery.trim() === "" ? (
                    <div className="p-4 sm:p-6 text-center text-gray-500">
                      <IconUsers className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 text-gray-300" />
                      <p className="text-xs sm:text-sm">Enter a query to find students</p>
                    </div>
                  ) : isSearching ? (
                    <div className="p-4 text-center text-xs sm:text-sm text-gray-500">
                      Searching…
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-xs sm:text-sm text-gray-500">
                      No students found
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {searchResults.map((student) => (
                        <li
                          key={student._id}
                          className="p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student._id)}
                            onChange={() => handleStudentSelection(student._id)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {student.student_id} · {student.email}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {selectedStudents.length > 0 && (
                  <p className="text-xs sm:text-sm text-blue-600 font-medium">
                    {selectedStudents.length} selected
                  </p>
                )}

                <div className="bg-green-50 p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm text-green-700">
                  📧 Selected students will receive email invitations with
                  section details and login instructions.
                </div>

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 sm:pt-3 border-t border-gray-200">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-xs sm:text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={inviteStudents}
                    disabled={selectedStudents.length === 0 || submitting}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-xs sm:text-sm"
                  >
                    {submitting
                      ? "Inviting…"
                      : `Invite ${selectedStudents.length} student${
                          selectedStudents.length !== 1 ? "s" : ""
                        }`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </NotificationProvider>
  );
}
