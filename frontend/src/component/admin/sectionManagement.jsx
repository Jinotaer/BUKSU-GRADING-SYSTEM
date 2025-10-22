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
} from "@tabler/icons-react";
import { NavbarSimple } from "./adminsidebar";
import { authenticatedFetch } from "../../utils/auth";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationProvider } from "../common/NotificationModals";
import { IconArchive } from "@tabler/icons-react";

export default function SectionManagement() {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]); // All subjects (admin can see all)
  const [instructors, setInstructors] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Notification system
  const notifications = useNotifications();
  const { showError, showSuccess, showConfirmDialog } = notifications;
  const [formData, setFormData] = useState({
    semesterId: "",
    subjectId: "",
    instructorId: "", // Admin assigns instructor
    sectionName: "",
    gradingSchema: {
      classStanding: 40,
      laboratory: 30,
      majorOutput: 30,
    },
  });
  const [filteredSubjects, setFilteredSubjects] = useState([]); // Subjects filtered by selected semester
  const [submitting, setSubmitting] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchSections();
    fetchSubjects();
    fetchInstructors();
    fetchSemesters();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch(
        "http://localhost:5000/api/admin/sections"
      );
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

  const fetchSubjects = async () => {
    try {
      const res = await authenticatedFetch(
        "http://localhost:5000/api/admin/subjects"
      );
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.subjects || []);
      }
    } catch (err) {
      console.error("Error fetching subjects:", err);
    }
  };

  const fetchInstructors = async () => {
    try {
      const res = await authenticatedFetch(
        "http://localhost:5000/api/admin/instructors"
      );
      if (res.ok) {
        const data = await res.json();
        setInstructors(data.instructors || []);
      }
    } catch (err) {
      console.error("Error fetching instructors:", err);
    }
  };

  const fetchSemesters = async () => {
    try {
      const res = await authenticatedFetch(
        "http://localhost:5000/api/semesters"
      );
      if (res.ok) {
        const data = await res.json();
        setSemesters(data.semesters || data || []);
      }
    } catch (err) {
      console.error("Error fetching semesters:", err);
    }
  };

  // Search students by student ID or email
  const searchStudentsByStudid = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const res = await authenticatedFetch(
        `http://localhost:5000/api/admin/students?search=${encodeURIComponent(
          query
        )}&limit=50`
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

  // ✅ Fixed: Debounced search to prevent re-render lag when typing
  useEffect(() => {
    if (!showInviteModal) return; // only run when invite modal is open

    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    // Wait 400ms after the user stops typing before searching
    const delayDebounce = setTimeout(() => {
      searchStudentsByStudid(searchQuery);
    }, 400);

    // Cleanup if user types again before delay finishes
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, showInviteModal]);

  const handleInviteStudents = async () => {
    if (selectedStudents.length === 0) {
      showError("Please select at least one student to invite");
      return;
    }

    try {
      setSubmitting(true);
      const res = await authenticatedFetch(
        `http://localhost:5000/api/admin/sections/${selectedSection._id}/invite-students`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ studentIds: selectedStudents }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setShowInviteModal(false);
        setSelectedStudents([]);
        setSelectedSection(null);
        await fetchSections(); // Refresh the sections
        showSuccess(
          `Successfully invited ${
            data.invitedStudents?.length || selectedStudents.length
          } students to the section!`
        );
      } else {
        const data = await res.json();
        showError(data.message || "Failed to invite students");
      }
    } catch (err) {
      showError("Error inviting students");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Validate grading schema totals to 100%
    const total =
      formData.gradingSchema.classStanding +
      formData.gradingSchema.laboratory +
      formData.gradingSchema.majorOutput;

    if (total !== 100) {
      showError("Grading schema percentages must total 100%");
      setSubmitting(false);
      return;
    }

    try {
      // Find the selected semester to get schoolYear and term
      const selectedSemester = semesters.find(
        (s) => s._id === formData.semesterId
      );
      if (!selectedSemester) {
        showError("Please select a valid semester");
        setSubmitting(false);
        return;
      }

      // Prepare the payload with schoolYear and term (as expected by backend)
      const payload = {
        subjectId: formData.subjectId,
        instructorId: formData.instructorId,
        sectionName: formData.sectionName,
        schoolYear: selectedSemester.schoolYear,
        term: selectedSemester.term,
        gradingSchema: formData.gradingSchema,
      };

      const url = selectedSection
        ? `http://localhost:5000/api/admin/sections/${selectedSection._id}`
        : "http://localhost:5000/api/admin/sections";

      const method = selectedSection ? "PUT" : "POST";

      const res = await authenticatedFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchSections(); // Refresh sections
        resetForm();
        setShowAddModal(false);
        setShowEditModal(false);
        showSuccess(
          selectedSection
            ? "Section updated successfully!"
            : "Section created successfully!"
        );
      } else {
        const data = await res.json();
        showError(data.message || "Failed to save section");
      }
    } catch (err) {
      showError("Error saving section");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // const handleDelete = async (sectionId) => {
  //   const section = sections.find((s) => s._id === sectionId);
  //   const sectionName = section?.sectionName || "this section";

  //   showConfirmDialog(
  //     "Delete Section",
  //     `Are you sure you want to delete "${sectionName}"? This action cannot be undone.`,
  //     async () => {
  //       try {
  //         const res = await authenticatedFetch(
  //           `http://localhost:5000/api/admin/sections/${sectionId}`,
  //           {
  //             method: "DELETE",
  //           }
  //         );

  //         if (res.ok) {
  //           await fetchSections(); // Refresh sections
  //           showSuccess("Section deleted successfully!");
  //         } else {
  //           const data = await res.json();
  //           showError(data.message || "Failed to delete section");
  //         }
  //       } catch (err) {
  //         showError("Error deleting section");
  //         console.error(err);
  //       }
  //     }
  //   );
  // };

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
        setLoading(true);
        const res = await authenticatedFetch(
          `http://localhost:5000/api/admin/sections/${id}/archive`,
          { method: "PUT" }
        );

        if (res.ok) {
          // Update UI
          setSections((prev) => prev.filter((s) => (s._id || s.id) !== id));
          showConfirmDialog();
          setTimeout(() => {
            showSuccess(`Section "${sectionName}" archived successfully!`);
          }, 100);
        } else {
          const errorData = await res.json().catch(() => ({}));
         showConfirmDialog();
          setTimeout(() => {
            showError(errorData.message || "Failed to archive section.");
          }, 100);
        }
      } catch (err) {
        showConfirmDialog();
        console.error("Archive section error:", err);
        setTimeout(() => {
          showError("There was an error processing your request.");
        }, 100);
      } finally {
        setLoading(false);
      }
    }
  ); // ✅ make sure this closes showConfirmDialog properly
};



  const resetForm = () => {
    setFormData({
      semesterId: "",
      subjectId: "",
      instructorId: "",
      sectionName: "",
      gradingSchema: {
        classStanding: 40,
        laboratory: 30,
        majorOutput: 30,
      },
    });
    setSelectedSection(null);
    setFilteredSubjects([]);
  };

  const openEditModal = (section) => {
    setSelectedSection(section);

    // Get the semester ID from the subject
    const semesterId =
      section.subject?.semester?._id || section.subject?.semester;

    // Filter subjects for the semester
    if (semesterId) {
      const filtered = subjects.filter(
        (subject) => subject.semester && subject.semester._id === semesterId
      );
      setFilteredSubjects(filtered);
    }

    setFormData({
      semesterId: semesterId || "",
      subjectId: section.subject?._id || section.subject,
      instructorId: section.instructor?._id || section.instructor,
      sectionName: section.sectionName,
      gradingSchema: section.gradingSchema || {
        classStanding: 40,
        laboratory: 30,
        majorOutput: 30,
      },
    });
    setShowEditModal(true);
  };

  const getSubjectName = (subjectId) => {
    const subject = subjects.find((s) => s._id === subjectId);
    return subject
      ? `${subject.subjectCode} - ${subject.subjectName}`
      : "Unknown Subject";
  };

  const getInstructorName = (instructorId) => {
    const instructor = instructors.find((i) => i._id === instructorId);
    return instructor ? instructor.fullName : "Unassigned";
  };

  const openInviteModal = async (section) => {
    setSelectedSection(section);
    setShowInviteModal(true);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedStudents([]);
  };

  const openViewStudentsModal = (section) => {
    navigate(`/admin/view-invite-student/${section._id}`);
  };

  const handleStudentSelection = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50">
        <div className="bg-white/95 backdrop-blur-md rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <IconX size={20} />
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  };

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
              <p className="text-gray-600 mt-1">
                Create and manage all class sections
              </p>
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
                        <h3 className="font-semibold text-gray-800 text-lg">
                          {section.sectionName}
                        </h3>
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
                        title="Delete Section"
                      >
                        <IconArchive size={16} />
                      </button>
                       {/* <button
                        onClick={() => handleDelete(section._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Section"
                      >
                        <IconTrash size={16} />
                      </button> */}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <IconBook size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {getSubjectName(
                          section.subject?._id || section.subject
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconUser size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Instructor:{" "}
                        {getInstructorName(
                          section.instructor?._id || section.instructor
                        )}
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

                    {/* Show subject details */}
                    {section.subject && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                        <p className="text-sm font-medium text-blue-800">
                          Subject Details:
                        </p>
                        <p className="text-sm text-blue-600">
                          Units: {section.subject.units || "N/A"} | College:{" "}
                          {section.subject.college || "N/A"}
                        </p>
                      </div>
                    )}

                    {/* Invite Students Button */}
                    <div className="mt-4 pt-3 border-t border-blue-100">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => openInviteModal(section)}
                          className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          <IconUsers size={16} />
                          Invite Students
                        </button>
                        <button
                          onClick={() => openViewStudentsModal(section)}
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

              {/* Empty state */}
              {sections.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <IconChalkboard
                    className="mx-auto text-gray-300 mb-4"
                    size={48}
                  />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    No sections created yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Create your first section to get started
                  </p>
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
          <Modal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            title="Add New Section"
          >
            <form onSubmit={handleSubmit} className="space-y-4 ">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester *
                </label>
                <select
                  value={formData.semesterId}
                  onChange={(e) => {
                    const semesterId = e.target.value;
                    setFormData({ ...formData, semesterId, subjectId: "" }); // Reset subject when semester changes
                    // Filter subjects by selected semester
                    if (semesterId) {
                      const filtered = subjects.filter(
                        (subject) =>
                          subject.semester &&
                          subject.semester._id === semesterId
                      );
                      setFilteredSubjects(filtered);
                    } else {
                      setFilteredSubjects([]);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  value={formData.subjectId}
                  onChange={(e) =>
                    setFormData({ ...formData, subjectId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={!formData.semesterId}
                >
                  <option value="">Select Subject</option>
                  {filteredSubjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.subjectCode} - {subject.subjectName} (
                      {subject.units} units)
                    </option>
                  ))}
                </select>
                {!formData.semesterId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Please select a semester first
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructor *
                </label>
                <select
                  value={formData.instructorId}
                  onChange={(e) =>
                    setFormData({ ...formData, instructorId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Code *
                </label>
                <input
                  type="text"
                  value={formData.sectionName}
                  onChange={(e) =>
                    setFormData({ ...formData, sectionName: e.target.value })
                  }
                  placeholder="e.g., BSCS 1A, BSIT 2B"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <label className="block text-xs text-gray-600 mb-1">
                      Class Standing
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.gradingSchema.classStanding}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gradingSchema: {
                            ...formData.gradingSchema,
                            classStanding: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Laboratory
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.gradingSchema.laboratory}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gradingSchema: {
                            ...formData.gradingSchema,
                            laboratory: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Major Output
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.gradingSchema.majorOutput}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gradingSchema: {
                            ...formData.gradingSchema,
                            majorOutput: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Total:{" "}
                  {formData.gradingSchema.classStanding +
                    formData.gradingSchema.laboratory +
                    formData.gradingSchema.majorOutput}
                  %
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
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <IconCheck size={16} />
                      Add Section
                    </>
                  )}
                </button>
              </div>
            </form>
          </Modal>

          {/* Edit Section Modal - Similar structure with instructor selection */}
          <Modal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            title="Edit Section"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester *
                </label>
                <select
                  value={formData.semesterId}
                  onChange={(e) => {
                    const semesterId = e.target.value;
                    setFormData({ ...formData, semesterId, subjectId: "" }); // Reset subject when semester changes
                    // Filter subjects by selected semester
                    if (semesterId) {
                      const filtered = subjects.filter(
                        (subject) =>
                          subject.semester &&
                          subject.semester._id === semesterId
                      );
                      setFilteredSubjects(filtered);
                    } else {
                      setFilteredSubjects([]);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  value={formData.subjectId}
                  onChange={(e) =>
                    setFormData({ ...formData, subjectId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={!formData.semesterId}
                >
                  <option value="">Select Subject</option>
                  {filteredSubjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.subjectCode} - {subject.subjectName} (
                      {subject.units} units)
                    </option>
                  ))}
                </select>
                {!formData.semesterId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Please select a semester first
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructor *
                </label>
                <select
                  value={formData.instructorId}
                  onChange={(e) =>
                    setFormData({ ...formData, instructorId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Code *
                </label>
                <input
                  type="text"
                  value={formData.sectionName}
                  onChange={(e) =>
                    setFormData({ ...formData, sectionName: e.target.value })
                  }
                  placeholder="e.g., BSCS 1A, BSIT 2B"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <label className="block text-xs text-gray-600 mb-1">
                      Class Standing
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.gradingSchema.classStanding}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gradingSchema: {
                            ...formData.gradingSchema,
                            classStanding: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Laboratory
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.gradingSchema.laboratory}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gradingSchema: {
                            ...formData.gradingSchema,
                            laboratory: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Major Output
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.gradingSchema.majorOutput}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gradingSchema: {
                            ...formData.gradingSchema,
                            majorOutput: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Total:{" "}
                  {formData.gradingSchema.classStanding +
                    formData.gradingSchema.laboratory +
                    formData.gradingSchema.majorOutput}
                  %
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
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <IconCheck size={16} />
                      Update Section
                    </>
                  )}
                </button>
              </div>
            </form>
          </Modal>

          {/* Invite Students Modal */}
          <Modal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            title="Invite Students to Section"
          >
            <div className="space-y-4">
              {selectedSection && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">
                    Section Information:
                  </h4>
                  <p className="text-sm text-blue-600">
                    <strong>Subject:</strong>{" "}
                    {getSubjectName(
                      selectedSection.subject?._id || selectedSection.subject
                    )}
                  </p>
                  <p className="text-sm text-blue-600">
                    <strong>Section:</strong> {selectedSection.sectionName}
                  </p>
                  <p className="text-sm text-blue-600">
                    <strong>Instructor:</strong>{" "}
                    {getInstructorName(
                      selectedSection.instructor?._id ||
                        selectedSection.instructor
                    )}
                  </p>
                  <p className="text-sm text-blue-600">
                    <strong>Current Students:</strong>{" "}
                    {selectedSection.students?.length || 0}
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
                    Type the student's ID number or institutional email address
                    to search
                  </p>
                </div>

                <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg">
                  {searchQuery.trim() === "" ? (
                    <div className="p-4 text-center text-gray-500">
                      <IconUsers
                        className="mx-auto mb-2 text-gray-300"
                        size={24}
                      />
                      <p>Enter a student ID or email to search for students</p>
                      <p className="text-xs mt-1">
                        Examples: 2021-001234 or 2301106754@student.buksu.edu.ph
                      </p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="p-2 space-y-2">
                      {searchResults.map((student) => (
                        <label
                          key={student._id}
                          className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student._id)}
                            onChange={() => handleStudentSelection(student._id)}
                            className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {student.fullName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {student.studid} • {student.yearLevel} •{" "}
                              {student.course}
                            </div>
                            <div className="text-xs text-blue-600">
                              Email: {student.email}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : !isSearching && searchQuery.trim() !== "" ? (
                    <div className="p-4 text-center text-gray-500">
                      <IconAlertCircle
                        className="mx-auto mb-2 text-orange-400"
                        size={24}
                      />
                      <p>No students found for: "{searchQuery}"</p>
                      <p className="text-xs mt-1">
                        Please check the student ID or email and try again
                      </p>
                    </div>
                  ) : null}
                </div>
                {selectedStudents.length > 0 && (
                  <p className="text-sm text-blue-600 mt-2">
                    {selectedStudents.length} student
                    {selectedStudents.length !== 1 ? "s" : ""} selected
                  </p>
                )}
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-700">
                  📧 Selected students will receive email invitations with
                  section details and login instructions.
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
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteStudents}
                  disabled={submitting || selectedStudents.length === 0}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending Invites...
                    </>
                  ) : (
                    <>
                      <IconUsers size={16} />
                      Invite {selectedStudents.length} Student
                      {selectedStudents.length !== 1 ? "s" : ""}
                    </>
                  )}
                </button>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </NotificationProvider>
  );
}
