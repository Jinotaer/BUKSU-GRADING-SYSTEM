import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconUsers,
  IconBook,
  IconX,
  IconCheck,
  IconAlertCircle,
  IconChalkboard,
  IconEye,
  IconUser,
  IconArchive,
} from "@tabler/icons-react";
import { NavbarSimple } from "./adminsidebar";
import { authenticatedFetch } from "../../utils/auth";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationProvider } from "../common/NotificationModals";

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <IconX size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function SectionManagement() {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const [selectedSection, setSelectedSection] = useState(null);

  // Inputs – keep as strings while typing
  const [formData, setFormData] = useState({
    semesterId: "",
    subjectId: "",
    instructorId: "",
    sectionName: "",
    gradingSchema: {
      classStanding: "40",
      laboratory: "30",
      majorOutput: "30",
    },
  });

  // Invite/search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Notifications
  const notifications = useNotifications();
  const { showError, showSuccess, showConfirmDialog } = notifications;

  // Fetch data
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [secRes, subRes, instRes, semRes] = await Promise.all([
          authenticatedFetch("http://localhost:5000/api/admin/sections"),
          authenticatedFetch("http://localhost:5000/api/admin/subjects"),
          authenticatedFetch("http://localhost:5000/api/admin/instructors"),
          authenticatedFetch("http://localhost:5000/api/semesters"),
        ]);

        if (secRes.ok) {
          const d = await secRes.json();
          setSections(d.sections || []);
        }
        if (subRes.ok) {
          const d = await subRes.json();
          setSubjects(d.subjects || []);
        }
        if (instRes.ok) {
          const d = await instRes.json();
          setInstructors(d.instructors || []);
        }
        if (semRes.ok) {
          const d = await semRes.json();
          setSemesters(d.semesters || d || []);
        }
      } catch (e) {
        console.error(e);
        showError("Failed to load initial data.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch("http://localhost:5000/api/admin/sections");
      if (res.ok) {
        const data = await res.json();
        setSections(data.sections || []);
      }
    } catch (err) {
      console.error("Error fetching sections:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Universal change handlers (smooth typing) ---------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // Keep subjects filtered in sync with semester
      if (name === "semesterId") {
        next.subjectId = "";
        if (value) {
          const filtered = subjects.filter(
            (s) => s.semester && (s.semester._id || s.semester) === value
          );
          setFilteredSubjects(filtered);
        } else {
          setFilteredSubjects([]);
        }
      }
      return next;
    });
  };

  const handleSchemaChange = (e) => {
    const { name, value } = e.target; // keep string while typing
    setFormData((prev) => ({
      ...prev,
      gradingSchema: {
        ...prev.gradingSchema,
        [name]: value,
      },
    }));
  };

  const resetForm = () => {
    setFormData({
      semesterId: "",
      subjectId: "",
      instructorId: "",
      sectionName: "",
      gradingSchema: {
        classStanding: "40",
        laboratory: "30",
        majorOutput: "30",
      },
    });
    setFilteredSubjects([]);
    setSelectedSection(null);
  };

  const openEditModal = (section) => {
    setSelectedSection(section);
    const semesterId = section.subject?.semester?._id || section.subject?.semester || "";
    const filtered = semesterId
      ? subjects.filter((s) => s.semester && (s.semester._id || s.semester) === semesterId)
      : [];
    setFilteredSubjects(filtered);

    setFormData({
      semesterId,
      subjectId: section.subject?._id || section.subject || "",
      instructorId: section.instructor?._id || section.instructor || "",
      sectionName: section.sectionName || "",
      gradingSchema: {
        classStanding: String(section.gradingSchema?.classStanding ?? "40"),
        laboratory: String(section.gradingSchema?.laboratory ?? "30"),
        majorOutput: String(section.gradingSchema?.majorOutput ?? "30"),
      },
    });
    setShowEditModal(true);
  };

  const getSubjectName = (subjectId) => {
    const subject = subjects.find((s) => s._id === subjectId);
    return subject ? `${subject.subjectCode} - ${subject.subjectName}` : "Unknown Subject";
    };
  const getInstructorName = (instructorId) => {
    const instructor = instructors.find((i) => i._id === instructorId);
    return instructor ? instructor.fullName : "Unassigned";
  };

  /* -------------------------- Invite/search logic -------------------------- */
  const searchStudentsByStudid = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      setIsSearching(true);
      const res = await authenticatedFetch(
        `http://localhost:5000/api/admin/students?search=${encodeURIComponent(query)}&limit=50`
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.students || []);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Error searching students:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!showInviteModal) return;
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => searchStudentsByStudid(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery, showInviteModal]); // eslint-disable-line

  const handleStudentSelection = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleInviteStudents = async () => {
    if (selectedStudents.length === 0) {
      showError("Please select at least one student to invite");
      return;
    }
    try {
      const res = await authenticatedFetch(
        `http://localhost:5000/api/admin/sections/${selectedSection._id}/invite-students`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentIds: selectedStudents }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        setShowInviteModal(false);
        setSelectedStudents([]);
        setSelectedSection(null);
        await fetchSections();
        showSuccess(
          `Successfully invited ${data.invitedStudents?.length || selectedStudents.length} students to the section!`
        );
      } else {
        const data = await res.json();
        showError(data.message || "Failed to invite students");
      }
    } catch (err) {
      console.error(err);
      showError("Error inviting students");
    }
  };

  /* ------------------------------ Submit logic ----------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    // validate total
    const total =
      (parseInt(formData.gradingSchema.classStanding, 10) || 0) +
      (parseInt(formData.gradingSchema.laboratory, 10) || 0) +
      (parseInt(formData.gradingSchema.majorOutput, 10) || 0);

    if (total !== 100) {
      showError("Grading schema percentages must total 100%");
      return;
    }

    // map semesterId -> schoolYear/term (backend expects these)
    const selectedSem = semesters.find((s) => s._id === formData.semesterId);
    if (!selectedSem) {
      showError("Please select a valid semester");
      return;
    }

    const payload = {
      subjectId: formData.subjectId,
      instructorId: formData.instructorId,
      sectionName: formData.sectionName,
      schoolYear: selectedSem.schoolYear,
      term: selectedSem.term,
      gradingSchema: {
        classStanding: parseInt(formData.gradingSchema.classStanding, 10) || 0,
        laboratory: parseInt(formData.gradingSchema.laboratory, 10) || 0,
        majorOutput: parseInt(formData.gradingSchema.majorOutput, 10) || 0,
      },
    };

    try {
      const url = selectedSection
        ? `http://localhost:5000/api/admin/sections/${selectedSection._id}`
        : "http://localhost:5000/api/admin/sections";
      const method = selectedSection ? "PUT" : "POST";

      const res = await authenticatedFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchSections();
        resetForm();
        setShowAddModal(false);
        setShowEditModal(false);
        showSuccess(selectedSection ? "Section updated successfully!" : "Section created successfully!");
      } else {
        const data = await res.json();
        showError(data.message || "Failed to save section");
      }
    } catch (err) {
      console.error(err);
      showError("Error saving section");
    }
  };

  /* ---------------------------- Archive a section --------------------------- */
  const handleArchiveSection = async (id) => {
    if (!id) {
      showError("Invalid section ID");
      return;
    }
    const section = sections.find((s) => (s._id || s.id) === id);
    const sectionName = section?.sectionName || "this section";

    showConfirmDialog(
      "Archive Section",
      `Are you sure you want to archive "${sectionName}"? This will hide the section from normal operations but it can be restored later.`,
      async () => {
        try {
          const res = await authenticatedFetch(
            `http://localhost:5000/api/admin/sections/${id}/archive`,
            { method: "PUT" }
          );
          if (res.ok) {
            setSections((prev) => prev.filter((s) => (s._id || s.id) !== id));
            showSuccess(`Section "${sectionName}" archived successfully!`);
          } else {
            const errorData = await res.json().catch(() => ({}));
            showError(errorData.message || "Failed to archive section.");
          }
        } catch (err) {
          console.error("Archive section error:", err);
          showError("There was an error processing your request.");
        }
      }
    );
  };

  /* ---------------------------------- UI ---------------------------------- */
  const gradingTotal =
    (parseInt(formData.gradingSchema.classStanding, 10) || 0) +
    (parseInt(formData.gradingSchema.laboratory, 10) || 0) +
    (parseInt(formData.gradingSchema.majorOutput, 10) || 0);

  return (
    <NotificationProvider notifications={notifications}>
      <div className="flex min-h-screen bg-gray-50">
        <NavbarSimple />
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="pt-4 sm:pt-6 md:pt-4 lg:pt-6 font-outfit text-[#1E3A5F] text-xl sm:text-2xl lg:text-3xl font-bold">
                Section Management
              </h2>
              <p className="text-gray-600 mt-1">Create and manage all class sections</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <IconPlus size={20} />
              Add Section
            </button>
          </div>

          {/* Sections Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sections.map((section) => (
                <div
                  key={section._id}
                  className="rounded-lg border border-blue-200 bg-blue-50/30 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <IconChalkboard className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-lg">{section.sectionName}</h3>
                        <p className="text-gray-600 text-sm">
                          {section.schoolYear} - {section.term} Semester
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(section)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Section"
                      >
                        <IconEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleArchiveSection(section._id || section.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Archive Section"
                      >
                        <IconArchive size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <IconBook size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {getSubjectName(section.subject?._id || section.subject)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconUser size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Instructor: {getInstructorName(section.instructor?._id || section.instructor)}
                      </span>
                    </div>
                    {section.students && (
                      <div className="flex items-center gap-2">
                        <IconUsers size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {section.students.length} Students Enrolled
                        </span>
                      </div>
                    )}

                    {section.subject && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                        <p className="text-sm font-medium text-blue-800">Subject Details:</p>
                        <p className="text-sm text-blue-600">
                          Units: {section.subject.units || "N/A"} | College: {section.subject.college || "N/A"}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-blue-100">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setSelectedSection(section);
                            setShowInviteModal(true);
                            setSearchQuery("");
                            setSearchResults([]);
                            setSelectedStudents([]);
                          }}
                          className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          <IconUsers size={16} />
                          Invite Students
                        </button>
                        <button
                          onClick={() => navigate(`/admin/view-invite-student/${section._id}`)}
                          className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          <IconEye size={16} />
                          View Students
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500">
                    Created: {new Date(section.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}

              {sections.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <IconChalkboard className="mx-auto text-gray-300 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No sections created yet</h3>
                  <p className="text-gray-500 mb-4">Create your first section to get started</p>
                  <button
                    onClick={() => {
                      resetForm();
                      setShowAddModal(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Your First Section
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Add Section Modal */}
          <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Section">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Semester *</label>
                <select
                  name="semesterId"
                  value={formData.semesterId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none "
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                <select
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none "
                  required
                  disabled={!formData.semesterId}
                >
                  <option value="">Select Subject</option>
                  {filteredSubjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.subjectCode} - {subject.subjectName} ({subject.units} units)
                    </option>
                  ))}
                </select>
                {!formData.semesterId && (
                  <p className="text-xs text-gray-500 mt-1">Please select a semester first</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instructor *</label>
                <select
                  name="instructorId"
                  value={formData.instructorId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none "
                  required
                >
                  <option value="">Select Instructor</option>
                  {instructors.map((instructor) => (
                    <option key={instructor._id} value={instructor._id}>
                      {instructor.fullName} - {instructor.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Section Code *</label>
                <input
                  type="text"
                  name="sectionName"
                  value={formData.sectionName}
                  onChange={handleChange}
                  autoComplete="off"
                  placeholder="e.g., BSCS 1A, BSIT 2B"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  required
                />
              </div>

              {/* Grading Schema */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grading Schema (Percentages - must total 100%)
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Class Standing</label>
                    <input
                      type="number"
                      name="classStanding"
                      min="0"
                      max="100"
                      value={formData.gradingSchema.classStanding}
                      onChange={handleSchemaChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent  focus:outline-none "
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Laboratory</label>
                    <input
                      type="number"
                      name="laboratory"
                      min="0"
                      max="100"
                      value={formData.gradingSchema.laboratory}
                      onChange={handleSchemaChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent  focus:outline-none "
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Major Output</label>
                    <input
                      type="number"
                      name="majorOutput"
                      min="0"
                      max="100"
                      value={formData.gradingSchema.majorOutput}
                      onChange={handleSchemaChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent  focus:outline-none "
                    />
                  </div>
                </div>
                <p className={`text-xs mt-1 ${gradingTotal === 100 ? "text-green-600" : "text-orange-600"}`}>
                  Total: {gradingTotal}%
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <IconCheck size={16} />
                  Add Section
                </button>
              </div>
            </form>
          </Modal>

          {/* Edit Section Modal */}
          <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Section">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Semester *</label>
                <select
                  name="semesterId"
                  value={formData.semesterId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent  focus:outline-none "
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                <select
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent  focus:outline-none "
                  required
                  disabled={!formData.semesterId}
                >
                  <option value="">Select Subject</option>
                  {filteredSubjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.subjectCode} - {subject.subjectName} ({subject.units} units)
                    </option>
                  ))}
                </select>
                {!formData.semesterId && (
                  <p className="text-xs text-gray-500 mt-1">Please select a semester first</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instructor *</label>
                <select
                  name="instructorId"
                  value={formData.instructorId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent  focus:outline-none "
                  required
                >
                  <option value="">Select Instructor</option>
                  {instructors.map((instructor) => (
                    <option key={instructor._id} value={instructor._id}>
                      {instructor.fullName} - {instructor.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Section Code *</label>
                <input
                  type="text"
                  name="sectionName"
                  value={formData.sectionName}
                  onChange={handleChange}
                  autoComplete="off"
                  placeholder="e.g., BSCS 1A, BSIT 2B"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent  focus:outline-none "
                  required
                />
              </div>

              {/* Grading Schema */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grading Schema (Percentages - must total 100%)
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Class Standing</label>
                    <input
                      type="number"
                      name="classStanding"
                      min="0"
                      max="100"
                      value={formData.gradingSchema.classStanding}
                      onChange={handleSchemaChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent  focus:outline-none "
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Laboratory</label>
                    <input
                      type="number"
                      name="laboratory"
                      min="0"
                      max="100"
                      value={formData.gradingSchema.laboratory}
                      onChange={handleSchemaChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent  focus:outline-none "
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Major Output</label>
                    <input
                      type="number"
                      name="majorOutput"
                      min="0"
                      max="100"
                      value={formData.gradingSchema.majorOutput}
                      onChange={handleSchemaChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent  focus:outline-none "
                    />
                  </div>
                </div>
                <p className={`text-xs mt-1 ${gradingTotal === 100 ? "text-green-600" : "text-orange-600"}`}>
                  Total: {gradingTotal}%
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <IconCheck size={16} />
                  Update Section
                </button>
              </div>
            </form>
          </Modal>

          {/* Invite Students Modal */}
          <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="Invite Students to Section">
            <div className="space-y-4">
              {selectedSection && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Section Information:</h4>
                  <p className="text-sm text-blue-600">
                    <strong>Subject:</strong>{" "}
                    {getSubjectName(selectedSection.subject?._id || selectedSection.subject)}
                  </p>
                  <p className="text-sm text-blue-600">
                    <strong>Section:</strong> {selectedSection.sectionName}
                  </p>
                  <p className="text-sm text-blue-600">
                    <strong>Instructor:</strong>{" "}
                    {getInstructorName(selectedSection.instructor?._id || selectedSection.instructor)}
                  </p>
                  <p className="text-sm text-blue-600">
                    <strong>Current Students:</strong> {selectedSection.students?.length || 0}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Students by Student ID or Email:
                </label>
                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter student ID or email (e.g., 2021-001234 or 2301106754@student.buksu.edu.ph)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none pr-10"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Type the student's ID number or institutional email address to search
                  </p>
                </div>

                <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg">
                  {searchQuery.trim() === "" ? (
                    <div className="p-4 text-center text-gray-500">
                      <IconUsers className="mx-auto mb-2 text-gray-300" size={24} />
                      <p>Enter a student ID or email to search for students</p>
                      <p className="text-xs mt-1">Examples: 2021-001234 or 2301106754@student.buksu.edu.ph</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="p-2 space-y-2">
                      {searchResults.map((student) => (
                        <label key={student._id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student._id)}
                            onChange={() => handleStudentSelection(student._id)}
                            className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500  focus:outline-none "
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                            <div className="text-xs text-gray-500">
                              {student.studid} • {student.yearLevel} • {student.course}
                            </div>
                            <div className="text-xs text-blue-600">Email: {student.email}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : !isSearching && searchQuery.trim() !== "" ? (
                    <div className="p-4 text-center text-gray-500">
                      <IconAlertCircle className="mx-auto mb-2 text-orange-400" size={24} />
                      <p>No students found for: "{searchQuery}"</p>
                      <p className="text-xs mt-1">Please check the student ID or email and try again</p>
                    </div>
                  ) : null}
                </div>

                {selectedStudents.length > 0 && (
                  <p className="text-sm text-blue-600 mt-2">
                    {selectedStudents.length} student{selectedStudents.length !== 1 ? "s" : ""} selected
                  </p>
                )}
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-700">
                  📧 Selected students will receive email invitations with section details and login instructions.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setSelectedStudents([]);
                    setSelectedSection(null);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSearching}
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteStudents}
                  disabled={isSearching || selectedStudents.length === 0}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <IconUsers size={16} />
                  Invite {selectedStudents.length} Student{selectedStudents.length !== 1 ? "s" : ""}
                </button>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </NotificationProvider>
  );
}
