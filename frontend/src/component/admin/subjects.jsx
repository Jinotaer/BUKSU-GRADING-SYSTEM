import React, { useState, useEffect, useCallback } from "react";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconBook,
  IconSchool,
  IconX,
  IconCheck,
  IconSearch,
  IconArchive,
} from "@tabler/icons-react";
import { NavbarSimple } from "./adminsidebar";
import { authenticatedFetch } from "../../utils/auth";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationProvider } from "../common/NotificationModals";
import { useLock, useBatchLockStatus } from "../../hooks/useLock";

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5000";

/* ---------- Small shared Modal (kept outside to avoid parser issues) ---------- */
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-3 sm:p-4 md:p-6">
      <div className="bg-white/95 backdrop-blur-md rounded-lg w-full max-w-lg mx-auto max-h-[90vh] sm:max-h-[85vh] overflow-y-auto shadow-2xl border border-white/20">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md flex justify-between items-center p-4 sm:p-5 md:p-6 border-b border-gray-200 z-10">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 pr-2">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg flex-shrink-0 touch-manipulation"
            aria-label="Close modal"
          >
            <IconX size={20} className="sm:w-5 sm:h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-5 md:p-6">{children}</div>
      </div>
    </div>
  );
}

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterCollege, setFilterCollege] = useState("");

  // keep units as string while typing; convert on submit
  const [formData, setFormData] = useState({
    subjectCode: "",
    subjectName: "",
    units: "3",
    college: "",
    department: "",
    semester: "",
  });

  const [submitting, setSubmitting] = useState(false);

  // Notification system
  const notifications = useNotifications();
  const {
    // showNotification,
    // hideNotification,
    showError,
    showSuccess,
    showConfirmDialog,
    // notification,
    // confirmDialog
  } = notifications;

  // Lock management
  const subjectIds = subjects.map((s) => s._id);
  const {
    isLocked,
    getLockedBy,
    refresh: refreshLocks,
  } = useBatchLockStatus("subject", subjectIds);
  const refreshLocksWithDelay = useCallback(() => {
    refreshLocks();
    setTimeout(() => refreshLocks(), 5000);
  }, [refreshLocks]);

  // Lock for editing
  const { acquireLock, releaseLock } = useLock("subject", selectedSubject?._id);

  // College options
  const collegeOptions = [
    "College of Technology",
    "College of Business",
    "College of Education",
    "College of Arts and Sciences",
    "College of Public Administration",
    "College of Nursing",
    "College of Medicine",
    "College of Law",
  ];

  // Fetch data
  useEffect(() => {
    fetchSubjects();
    fetchSemesters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSubjects = useCallback(async () => {
    try {
      // Clean up expired locks first
      try {
        const cleanupRes = await authenticatedFetch(
          `${API_BASE}/api/locks/cleanup`,
          {
            method: "POST",
          }
        );
        if (cleanupRes.ok) {
          const cleanupData = await cleanupRes.json();
          console.log("🧹 Cleaned up expired locks:", cleanupData.message);
        }
      } catch (cleanupErr) {
        console.error("Cleanup error:", cleanupErr);
      }

      setLoading(true);
      const res = await authenticatedFetch(`${API_BASE}/api/admin/subjects`);
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.subjects || []);
      } else {
        showError("Failed to fetch subjects");
      }
    } catch (err) {
      console.error(err);
      showError("Error fetching subjects");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const fetchSemesters = async () => {
    try {
      const res = await authenticatedFetch(`${API_BASE}/api/admin/semesters`);
      if (res.ok) {
        const data = await res.json();
        setSemesters(data.semesters || []);
      }
    } catch (err) {
      console.error("Error fetching semesters:", err);
    }
  };

  /* ---------------- Universal input handler (smooth typing) ---------------- */
  const handleChange = (e) => {
    const { name, value } = e.target; // read before setState (avoids pooled event pitfalls)
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      subjectCode: "",
      subjectName: "",
      units: "3",
      college: "",
      department: "",
      semester: "",
    });
    setSelectedSubject(null);
  };

  const openEditModal = async (subject) => {
    const subjectId = subject._id;

    if (isLocked(subjectId)) {
      const lockedBy = getLockedBy(subjectId);
      showError(
        `This subject is currently being edited by ${lockedBy}. Please try again later.`
      );
      return;
    }

    const lockAcquired = await acquireLock(subjectId, "subject");
    if (!lockAcquired) {
      showError(
        "Unable to acquire lock for editing. Another admin may have started editing."
      );
      refreshLocksWithDelay();
      return;
    }

    setSelectedSubject(subject);
    setFormData({
      subjectCode: subject?.subjectCode || "",
      subjectName: subject?.subjectName || "",
      units: String(subject?.units ?? "3"),
      college: subject?.college || "",
      department: subject?.department || "",
      semester: subject?.semester?._id || subject?.semester || "",
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = selectedSubject
        ? `${API_BASE}/api/admin/subjects/${selectedSubject._id}`
        : `${API_BASE}/api/admin/subjects`;

      const method = selectedSubject ? "PUT" : "POST";

      const res = await authenticatedFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          units: parseInt(formData.units, 10),
        }),
      });

      if (res.ok) {
        await fetchSubjects();

        // Release lock if editing
        if (selectedSubject?._id) {
          await releaseLock(selectedSubject._id, "subject");
        }

        resetForm();
        setShowAddModal(false);
        setShowEditModal(false);

        // Refresh lock statuses
        refreshLocksWithDelay();

        showSuccess(
          selectedSubject
            ? "Subject updated successfully!"
            : "Subject added successfully!"
        );
      } else {
        const data = await res.json();
        showError(data.message || "Failed to save subject");
      }
    } catch (err) {
      console.error(err);
      showError("Error saving subject");
    } finally {
      setSubmitting(false);
    }
  };

  // const handleDelete = async (subjectId) => {
  //   const subject = subjects.find((s) => s._id === subjectId);
  //   const subjectName = subject?.subjectCode || "this subject";

  //   showConfirmDialog(
  //     "Delete Subject",
  //     `Are you sure you want to delete "${subjectName}"? This action cannot be undone.`,
  //     async () => {
  //       try {
  //         const res = await authenticatedFetch(
  //           `${API_BASE}/api/admin/subjects/${subjectId}`,
  //           { method: "DELETE" }
  //         );
  //         if (res.ok) {
  //           await fetchSubjects();
  //           showSuccess("Subject deleted successfully!");
  //         } else {
  //           const data = await res.json();
  //           showError(data.message || "Failed to delete subject");
  //         }
  //       } catch (err) {
  //         console.error(err);
  //         showError("Error deleting subject");
  //       }
  //     }
  //   );
  // };

  const handleArchive = async (subjectId) => {
    if (!subjectId) return;
    if (isLocked(subjectId)) {
      const lockedBy = getLockedBy(subjectId);
      showError(
        `This subject is currently being edited by ${lockedBy}. Please try again later.`
      );
      return;
    }

    const subject = subjects.find((s) => s._id === subjectId);
    if (!subject) return;

    const ok = await acquireLock(subjectId, "subject");
    if (!ok) {
      showError(
        "Unable to acquire lock for archiving. Another admin may have started editing."
      );
      refreshLocksWithDelay();
      return;
    }

    refreshLocksWithDelay();

    const subjectName = subject.subjectCode || "this subject";

    showConfirmDialog(
      "Archive Subject",
      `Are you sure you want to archive "${subjectName}"? It will be hidden from normal operations but can be restored later.`,
      async () => {
        try {
          const res = await authenticatedFetch(
            `${API_BASE}/api/admin/subjects/${subjectId}/archive`,
            { method: "PUT" }
          );

          if (res.ok) {
            await fetchSubjects();
            showSuccess("Subject archived successfully!");
          } else {
            const data = await res.json();
            showError(data.message || "Failed to archive subject");
          }
        } catch (err) {
          console.error(err);
          showError("Error archiving subject");
        } finally {
          await releaseLock(subjectId, "subject");
          refreshLocksWithDelay();
        }
      },
      async () => {
        await releaseLock(subjectId, "subject");
        refreshLocksWithDelay();
      }
    );
  };

  /* ----------------------------- Helpers/Labels ---------------------------- */
  const getSemesterLabel = (sem) => {
    if (!sem) return "N/A";
    if (typeof sem === "string") {
      const found = semesters.find((s) => s._id === sem);
      return found ? `${found.schoolYear} - ${found.term} Semester` : "N/A";
    }
    return `${sem.schoolYear} - ${sem.term} Semester`;
  };

  /* -------------------------------- Filters -------------------------------- */
  const filteredSubjects = subjects.filter((subject) => {
    const code = (subject?.subjectCode || "").toLowerCase();
    const name = (subject?.subjectName || "").toLowerCase();
    const term = searchTerm.toLowerCase();

    const matchesSearch = code.includes(term) || name.includes(term);
    const subjSemId = subject?.semester?._id || subject?.semester; // id or object
    const matchesSemester = !filterSemester || subjSemId === filterSemester;
    const matchesCollege = !filterCollege || subject?.college === filterCollege;

    return matchesSearch && matchesSemester && matchesCollege;
  });

  return (
    <NotificationProvider notifications={notifications}>
      <div className="flex min-h-screen bg-gray-50">
        <NavbarSimple />
        <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 w-full mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 pt-4 sm:pt-6 md:pt-8 lg:pt-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
            <div className="w-full sm:w-auto">
              <h2 className="pt-2 sm:pt-4 md:pt-6 lg:pt-10 font-outfit text-[#1E3A5F] text-xl sm:text-2xl md:text-3xl lg:text-3xl font-bold leading-tight">
                Subject Management
              </h2>
              <p className="text-gray-600 mt-1 sm:mt-2 text-xs sm:text-sm md:text-base">
                Manage academic subjects and courses
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors w-full sm:w-auto text-sm sm:text-base shadow-sm hover:shadow-md flex-shrink-0"
            >
              <IconPlus size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">Add Subject</span>
              <span className="sm:hidden whitespace-nowrap">Add Subject</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-5 mb-4 sm:mb-6 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="relative order-1">
                <IconSearch
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search subjects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base transition-shadow hover:border-gray-400"
                />
              </div>

              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base order-2 transition-shadow hover:border-gray-400 bg-white"
              >
                <option value="">All Semesters</option>
                {semesters.map((semester) => (
                  <option key={semester._id} value={semester._id}>
                    {semester.schoolYear} - {semester.term} Semester
                  </option>
                ))}
              </select>

              <select
                value={filterCollege}
                onChange={(e) => setFilterCollege(e.target.value)}
                className="px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base order-3 sm:col-span-2 lg:col-span-1 transition-shadow hover:border-gray-400 bg-white"
              >
                <option value="">All Colleges</option>
                {collegeOptions.map((college) => (
                  <option key={college} value={college}>
                    {college}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subjects List */}
          {loading ? (
            <div className="flex justify-center items-center py-16 sm:py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-500">Loading subjects...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              {filteredSubjects.length > 0 ? (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subject Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subject Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Units
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            College
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Department
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Semester
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredSubjects.map((subject) => (
                          <tr key={subject._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                  <IconBook
                                    className="text-blue-600"
                                    size={16}
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {subject.subjectCode}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 font-medium">
                                {subject.subjectName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {subject.units} units
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                {subject.college}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                {subject.department}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {getSemesterLabel(subject.semester)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openEditModal(subject)}
                                  disabled={isLocked(subject._id)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    isLocked(subject._id)
                                      ? "text-gray-300 cursor-not-allowed bg-gray-50"
                                      : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                  }`}
                                  title={
                                    isLocked(subject._id)
                                      ? `Locked by ${getLockedBy(subject._id)}`
                                      : "Edit Subject"
                                  }
                                >
                                  <IconEdit size={16} />
                                </button>
                                <button
                                  onClick={() => handleArchive(subject._id)}
                                  disabled={isLocked(subject._id)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    isLocked(subject._id)
                                      ? "text-gray-300 cursor-not-allowed bg-gray-50"
                                      : "text-gray-400 hover:text-orange-600 hover:bg-orange-50"
                                  }`}
                                  title={
                                    isLocked(subject._id)
                                      ? `Locked by ${getLockedBy(subject._id)}`
                                      : "Archive Subject"
                                  }
                                >
                                  <IconArchive size={16} />
                                </button>
                                {/* <button
                                  onClick={() => handleDelete(subject._id)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Subject"
                                >
                                  <IconTrash size={16} />
                                </button> */}
                                {isLocked(subject._id || subject.id) && (
                                  <span
                                    className="flex gap-1 text-xs font-regular text-red-500 spx-2 py-2"
                                    title={`Locked by ${getLockedBy(
                                      subject._id || subject.id
                                    )}`}
                                    aria-live="polite"
                                  >
                                    {/* <IconLock size={14} className="text-red-800" /> */}
                                    Locked
                                    {/* by {getLockedBy(semester._id || semester.id)} */}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile/Tablet Card View */}
                  <div className="lg:hidden divide-y divide-gray-200">
                    {filteredSubjects.map((subject) => (
                      <div
                        key={subject._id}
                        className="p-4 sm:p-5 md:p-6 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex flex-col space-y-3 sm:space-y-4">
                          {/* Header with Subject Code and Actions */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center min-w-0 flex-1">
                              <div className="p-2 bg-blue-100 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                                <IconBook className="text-blue-600" size={18} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                                  {subject.subjectCode}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                                  {subject.subjectName}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1 sm:gap-2 flex-shrink-0 items-start">
                              {isLocked(subject._id || subject.id) && (
                                <span
                                  className="flex gap-1 text-[10px] sm:text-xs font-medium text-red-500 px-2 py-1.5 sm:py-2 whitespace-nowrap"
                                  title={`Locked by ${getLockedBy(
                                    subject._id || subject.id
                                  )}`}
                                  aria-live="polite"
                                >
                                  {/* <IconLock size={14} className="text-red-800" /> */}
                                  Locked
                                  {/* by {getLockedBy(semester._id || semester.id)} */}
                                </span>
                              )}
                              <button
                                onClick={() => openEditModal(subject)}
                                disabled={isLocked(subject._id)}
                                className={`p-2 rounded-lg transition-colors touch-manipulation ${
                                  isLocked(subject._id)
                                    ? "text-gray-300 cursor-not-allowed bg-gray-50"
                                    : "text-gray-400 hover:text-blue-600 hover:bg-blue-50 active:bg-blue-100"
                                }`}
                                title={
                                  isLocked(subject._id)
                                    ? `Locked by ${getLockedBy(subject._id)}`
                                    : "Edit Subject"
                                }
                              >
                                <IconEdit size={18} className="sm:w-4 sm:h-4" />
                              </button>
                              <button
                                onClick={() => handleArchive(subject._id)}
                                disabled={isLocked(subject._id)}
                                className={`p-2 rounded-lg transition-colors touch-manipulation ${
                                  isLocked(subject._id)
                                    ? "text-gray-300 cursor-not-allowed bg-gray-50"
                                    : "text-gray-400 hover:text-orange-600 hover:bg-orange-50 active:bg-orange-100"
                                }`}
                                title={
                                  isLocked(subject._id)
                                    ? `Locked by ${getLockedBy(subject._id)}`
                                    : "Archive Subject"
                                }
                              >
                                <IconArchive size={18} className="sm:w-4 sm:h-4" />
                              </button>
                              {/* <button
                                onClick={() => handleDelete(subject._id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Subject"
                              >
                                <IconTrash size={16} />
                              </button> */}
                            </div>
                          </div>

                          {/* Subject Details */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 font-medium text-xs sm:text-sm block">
                                Units:
                              </span>
                              <div className="mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {subject.units} units
                                </span>
                              </div>
                            </div>
                            <div className="sm:col-span-2">
                              <span className="text-gray-500 font-medium text-xs sm:text-sm block">
                                College:
                              </span>
                              <div className="mt-1 text-gray-900 text-xs sm:text-sm break-words">
                                {subject.college}
                              </div>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                              <span className="text-gray-500 font-medium text-xs sm:text-sm block">
                                Department:
                              </span>
                              <div className="mt-1 text-gray-900 text-xs sm:text-sm break-words">
                                {subject.department}
                              </div>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-500 font-medium text-xs sm:text-sm block">
                                Semester:
                              </span>
                              <div className="mt-1 text-gray-900 text-xs sm:text-sm break-words">
                                {getSemesterLabel(subject.semester)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 sm:py-16 px-4 sm:px-6">
                  <IconSchool
                    className="mx-auto text-gray-300 mb-4"
                    size={48}
                  />
                  <h3 className="text-base sm:text-lg font-medium text-gray-600 mb-2">
                    {searchTerm || filterSemester || filterCollege
                      ? "No subjects found"
                      : "No subjects found"}
                  </h3>
                  <p className="text-gray-500 text-xs sm:text-sm md:text-base max-w-md mx-auto">
                    {searchTerm || filterSemester || filterCollege
                      ? "Try adjusting your search or filters"
                      : "Get started by adding your first subject"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Add Subject Modal */}
          <Modal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            title="Add New Subject"
          >
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Subject Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subjectCode"
                    value={formData.subjectCode}
                    onChange={handleChange}
                    autoComplete="off"
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base transition-shadow hover:border-gray-400"
                    placeholder="e.g. CS101"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Units <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="units"
                    min="1"
                    max="6"
                    value={formData.units}
                    onChange={handleChange}
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base transition-shadow hover:border-gray-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Subject Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="subjectName"
                  value={formData.subjectName}
                  onChange={handleChange}
                  autoComplete="off"
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base transition-shadow hover:border-gray-400"
                  placeholder="e.g. Introduction to Computer Science"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  College <span className="text-red-500">*</span>
                </label>
                <select
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base transition-shadow hover:border-gray-400 bg-white"
                  required
                >
                  <option value="">Select College</option>
                  {collegeOptions.map((college) => (
                    <option key={college} value={college}>
                      {college}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  autoComplete="off"
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base transition-shadow hover:border-gray-400"
                  placeholder="e.g. Computer Science Department"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Semester <span className="text-red-500">*</span>
                </label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base transition-shadow hover:border-gray-400 bg-white"
                  required
                >
                  <option value="">Select Semester</option>
                  {semesters.map((semester) => (
                    <option key={semester._id} value={semester._id}>
                      {semester.schoolYear} - {semester.term} Semester
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200 mt-4 sm:mt-5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 sm:py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm sm:text-base font-medium touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 sm:py-2.5 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base font-medium shadow-sm hover:shadow-md touch-manipulation"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <IconCheck size={16} className="flex-shrink-0" />
                      <span>Add Subject</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </Modal>

          {/* Edit Subject Modal */}
          <Modal
            isOpen={showEditModal}
            onClose={async () => {
              const id = selectedSubject?._id;
              if (id) {
                await releaseLock(id, "subject");
              }
              setShowEditModal(false);
              refreshLocksWithDelay();
            }}
            title="Edit Subject"
          >
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Subject Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subjectCode"
                    value={formData.subjectCode}
                    onChange={handleChange}
                    autoComplete="off"
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base transition-shadow hover:border-gray-400"
                    placeholder="e.g. CS101"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Units <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="units"
                    min="1"
                    max="6"
                    value={formData.units}
                    onChange={handleChange}
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base transition-shadow hover:border-gray-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Subject Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="subjectName"
                  value={formData.subjectName}
                  onChange={handleChange}
                  autoComplete="off"
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base transition-shadow hover:border-gray-400"
                  placeholder="e.g. Introduction to Computer Science"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  College <span className="text-red-500">*</span>
                </label>
                <select
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base transition-shadow hover:border-gray-400 bg-white"
                  required
                >
                  <option value="">Select College</option>
                  {collegeOptions.map((college) => (
                    <option key={college} value={college}>
                      {college}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  autoComplete="off"
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base transition-shadow hover:border-gray-400"
                  placeholder="e.g. Computer Science Department"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Semester <span className="text-red-500">*</span>
                </label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base transition-shadow hover:border-gray-400 bg-white"
                  required
                >
                  <option value="">Select Semester</option>
                  {semesters.map((semester) => (
                    <option key={semester._id} value={semester._id}>
                      {semester.schoolYear} - {semester.term} Semester
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200 mt-4 sm:mt-5">
                <button
                  type="button"
                  onClick={async () => {
                    const id = selectedSubject?._id;
                    if (id) {
                      await releaseLock(id, "subject");
                    }
                    setShowEditModal(false);
                    refreshLocksWithDelay();
                  }}
                  className="flex-1 px-4 py-2 sm:py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm sm:text-base font-medium touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 sm:py-2.5 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base font-medium shadow-sm hover:shadow-md touch-manipulation"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <IconCheck size={16} className="flex-shrink-0" />
                      <span>Update Subject</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </Modal>
        </div>
      </div>
    </NotificationProvider>
  );
}
