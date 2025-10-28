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

/* ---------- Small shared Modal (kept outside to avoid parser issues) ---------- */
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-lg w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <IconX size={20} />
          </button>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
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
  const { showError, showSuccess, showConfirmDialog } = notifications;

  // Lock management
  const subjectIds = subjects.map(s => s._id);
  const { isLocked, getLockedBy, refresh: refreshLocks } = useBatchLockStatus('subject', subjectIds);
  
  // Lock for editing
  const {
    acquireLock,
    releaseLock,
  } = useLock('subject', selectedSubject?._id);

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
        const cleanupRes = await authenticatedFetch("http://localhost:5000/api/locks/cleanup", {
          method: "POST",
        });
        if (cleanupRes.ok) {
          const cleanupData = await cleanupRes.json();
          console.log("🧹 Cleaned up expired locks:", cleanupData.message);
        }
      } catch (cleanupErr) {
        console.error("Cleanup error:", cleanupErr);
      }
      
      setLoading(true);
      const res = await authenticatedFetch("http://localhost:5000/api/admin/subjects");
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
      const res = await authenticatedFetch("http://localhost:5000/api/admin/semesters");
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
      showError(`This subject is currently being edited by ${lockedBy}. Please try again later.`);
      return;
    }

    const lockAcquired = await acquireLock(subjectId, "subject");
    if (!lockAcquired) {
      showError("Unable to acquire lock for editing. Another admin may have started editing.");
      await refreshLocks();
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
        ? `http://localhost:5000/api/admin/subjects/${selectedSubject._id}`
        : "http://localhost:5000/api/admin/subjects";

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
        if (selectedSubject) {
          await releaseLock();
        }
        
        resetForm();
        setShowAddModal(false);
        setShowEditModal(false);
        
        // Refresh lock statuses
        await refreshLocks();
        
        showSuccess(selectedSubject ? "Subject updated successfully!" : "Subject added successfully!");
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

  const handleDelete = async (subjectId) => {
    const subject = subjects.find((s) => s._id === subjectId);
    const subjectName = subject?.subjectCode || "this subject";

    showConfirmDialog(
      "Delete Subject",
      `Are you sure you want to delete "${subjectName}"? This action cannot be undone.`,
      async () => {
        try {
          const res = await authenticatedFetch(
            `http://localhost:5000/api/admin/subjects/${subjectId}`,
            { method: "DELETE" }
          );
          if (res.ok) {
            await fetchSubjects();
            showSuccess("Subject deleted successfully!");
          } else {
            const data = await res.json();
            showError(data.message || "Failed to delete subject");
          }
        } catch (err) {
          console.error(err);
          showError("Error deleting subject");
        }
      }
    );
  };

  const handleArchive = async (subjectId) => {
    const subject = subjects.find((s) => s._id === subjectId);
    const subjectName = subject?.subjectCode || "this subject";

    showConfirmDialog(
      "Archive Subject",
      `Are you sure you want to archive "${subjectName}"? It will be hidden from normal operations but can be restored later.`,
      async () => {
        try {
          const res = await authenticatedFetch(
            `http://localhost:5000/api/admin/subjects/${subjectId}/archive`,
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
        }
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
        <div className=" flex-1 p-2 sm:p-4 md:p-6 lg:p-8 w-full mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 pt-4 sm:pt-6 md:pt-8 lg:pt-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-4">
            <div className="w-full sm:w-auto">
              <h2 className="pt-4 sm:pt-6 md:pt-10 lg:pt-10 font-outfit text-[#1E3A5F] text-xl sm:text-2xl lg:text-3xl font-bold">
                Subject Management
              </h2>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage academic subjects and courses</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto text-sm sm:text-base"
            >
              <IconPlus size={18} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Add Subject</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="relative order-1">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search subjects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none  text-sm sm:text-base"
                />
              </div>

              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base order-2"
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
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base order-3 sm:col-span-2 lg:col-span-1"
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
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                                  <IconBook className="text-blue-600" size={16} />
                                </div>
                                <span className="text-sm font-medium text-gray-900">{subject.subjectCode}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 font-medium">{subject.subjectName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {subject.units} units
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{subject.college}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{subject.department}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{getSemesterLabel(subject.semester)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openEditModal(subject)}
                                  disabled={isLocked(subject._id)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    isLocked(subject._id)
                                      ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                                      : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                                  }`}
                                  title={isLocked(subject._id) ? `Locked by ${getLockedBy(subject._id)}` : 'Edit Subject'}
                                >
                                  <IconEdit size={16} />
                                </button>
                                <button
                                  onClick={() => handleArchive(subject._id)}
                                  disabled={isLocked(subject._id)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    isLocked(subject._id)
                                      ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                                      : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                                  }`}
                                  title={isLocked(subject._id) ? `Locked by ${getLockedBy(subject._id)}` : 'Archive Subject'}
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
                      <div key={subject._id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col space-y-3">
                          {/* Header with Subject Code and Actions */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center">
                              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                <IconBook className="text-blue-600" size={16} />
                              </div>
                              <div>
                                <div className="text-base sm:text-lg font-semibold text-gray-900">
                                  {subject.subjectCode}
                                </div>
                                <div className="text-sm text-gray-600">{subject.subjectName}</div>
                              </div>
                            </div>
                            <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                              <button
                                onClick={() => openEditModal(subject)}
                                disabled={isLocked(subject._id)}
                                className={`p-2 rounded-lg transition-colors ${
                                  isLocked(subject._id)
                                    ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                                    : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                                }`}
                                title={isLocked(subject._id) ? `Locked by ${getLockedBy(subject._id)}` : 'Edit Subject'}
                              >
                                <IconEdit size={16} />
                              </button>
                              <button
                                onClick={() => handleArchive(subject._id)}
                                disabled={isLocked(subject._id)}
                                className={`p-2 rounded-lg transition-colors ${
                                  isLocked(subject._id)
                                    ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                                    : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                                }`}
                                title={isLocked(subject._id) ? `Locked by ${getLockedBy(subject._id)}` : 'Archive Subject'}
                              >
                                <IconArchive size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(subject._id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Subject"
                              >
                                <IconTrash size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Subject Details */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500 font-medium">Units:</span>
                              <div className="mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {subject.units} units
                                </span>
                              </div>
                            </div>
                            <div className="sm:col-span-2">
                              <span className="text-gray-500 font-medium">College:</span>
                              <div className="mt-1 text-gray-900 text-xs sm:text-sm">{subject.college}</div>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                              <span className="text-gray-500 font-medium">Department:</span>
                              <div className="mt-1 text-gray-900 text-xs sm:text-sm">{subject.department}</div>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-500 font-medium">Semester:</span>
                              <div className="mt-1 text-gray-900 text-xs sm:text-sm">{getSemesterLabel(subject.semester)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 px-4">
                  <IconSchool className="mx-auto text-gray-300 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    {searchTerm || filterSemester || filterCollege ? "No subjects found" : "No subjects found"}
                  </h3>
                  <p className="text-gray-500 text-sm sm:text-base">
                    {searchTerm || filterSemester || filterCollege
                      ? "Try adjusting your search or filters"
                      : "Get started by adding your first subject"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Add Subject Modal */}
          <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Subject">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 ">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject Code</label>
                  <input
                    type="text"
                    name="subjectCode"
                    value={formData.subjectCode}
                    onChange={handleChange}
                    autoComplete="off"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base"
                    placeholder="e.g. CS101"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Units</label>
                  <input
                    type="number"
                    name="units"
                    min="1"
                    max="6"
                    value={formData.units}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject Name</label>
                <input
                  type="text"
                  name="subjectName"
                  value={formData.subjectName}
                  onChange={handleChange}
                  autoComplete="off"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base"
                  placeholder="e.g. Introduction to Computer Science"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">College</label>
                <select
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  autoComplete="off"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base"
                  placeholder="e.g. Computer Science Department"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base"
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

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="hidden sm:inline">Adding...</span>
                      <span className="sm:hidden">Adding</span>
                    </>
                  ) : (
                    <>
                      <IconCheck size={16} />
                      <span className="hidden sm:inline">Add Subject</span>
                      <span className="sm:hidden">Add</span>
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
              await releaseLock();
              setShowEditModal(false);
              await refreshLocks();
            }} 
            title="Edit Subject"
          >
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject Code</label>
                  <input
                    type="text"
                    name="subjectCode"
                    value={formData.subjectCode}
                    onChange={handleChange}
                    autoComplete="off"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base"
                    placeholder="e.g. CS101"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Units</label>
                  <input
                    type="number"
                    name="units"
                    min="1"
                    max="6"
                    value={formData.units}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject Name</label>
                <input
                  type="text"
                  name="subjectName"
                  value={formData.subjectName}
                  onChange={handleChange}
                  autoComplete="off"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base"
                  placeholder="e.g. Introduction to Computer Science"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">College</label>
                <select
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  autoComplete="off"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base"
                  placeholder="e.g. Computer Science Department"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base"
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

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={async () => {
                    await releaseLock();
                    setShowEditModal(false);
                    await refreshLocks();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="hidden sm:inline">Updating...</span>
                      <span className="sm:hidden">Updating</span>
                    </>
                  ) : (
                    <>
                      <IconCheck size={16} />
                      <span className="hidden sm:inline">Update Subject</span>
                      <span className="sm:hidden">Update</span>
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
