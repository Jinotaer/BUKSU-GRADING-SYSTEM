import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { NavbarSimple } from "./adminsidebar";
import { authenticatedFetch } from "../../utils/auth";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationProvider } from "../common/NotificationModals";
import { useLock, useBatchLockStatus } from "../../hooks/useLock";
import {
  Modal,
  PageHeader,
  SearchAndFilters,
  LoadingSpinner,
  SectionCard,
  EmptyState,
  SectionForm,
  InviteStudentsModal,
} from "./ui/sections";

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5000";

export default function SectionManagement() {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const [selectedSection, setSelectedSection] = useState(null);
  // Search & filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterCollege, setFilterCollege] = useState("");

  // Inputs – keep as strings while typing
  const [formData, setFormData] = useState({
    semesterId: "",
    subjectId: "",
    instructorId: "",
    sectionName: "",
    gradingSchema: {
      classStanding: "30",
      laboratory: "30",
      majorOutput: "40",
    },
  });

  // Invite/search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isSearching, setIsSearching] = useState(false);


  // Notifications
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
  const sectionIds = sections.map((s) => s._id);
  const {
    isLocked,
    getLockedBy,
    refresh: refreshLocks,
  } = useBatchLockStatus("section", sectionIds);
  const refreshLocksWithDelay = useCallback(() => {
    refreshLocks();
    setTimeout(() => refreshLocks(), 5000);
  }, [refreshLocks]);

  // Lock for editing
  const { acquireLock, releaseLock } = useLock("section", selectedSection?._id);

  // Fetch data
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [secRes, subRes, instRes, semRes] = await Promise.all([
          authenticatedFetch(`${API_BASE}/api/admin/sections`),
          authenticatedFetch(`${API_BASE}/api/admin/subjects`),
          authenticatedFetch(`${API_BASE}/api/admin/instructors?limit=12000`),
          authenticatedFetch(`${API_BASE}/api/semesters`),
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
  // Unique college list (from subjects)
  // const collegeOptions = React.useMemo(() => {
  //   const set = new Set((subjects || []).map((s) => s.college).filter(Boolean));
  //   return Array.from(set).sort();
  // }, [subjects]);

  // College options
  const collegeOptions = [
    "College of Technologies",
    "College of Business",
    "College of Education",
    "College of Arts and Science",
    "College of Public Administration",
    "College of Nursing",
    "College of Law",
  ];
  // Apply search + filters to sections
  const filteredSections = React.useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return (sections || []).filter((section) => {
      // text search across a few fields
      const matchesSearch = q
        ? [
            section.sectionName,
            section?.subject?.subjectName,
            section?.subject?.subjectCode,
            section?.instructor?.fullName,
          ]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q))
        : true;

      // college filter (by subject.college)
      const matchesCollege = filterCollege
        ? section?.subject?.college === filterCollege
        : true;

      // semester filter (prefer subject.semester id; fallback to schoolYear+term)
      let matchesSemester = true;
      if (filterSemester) {
        const fromSubject =
          section?.subject?.semester?._id || section?.subject?.semester;
        if (fromSubject) {
          matchesSemester = String(fromSubject) === String(filterSemester);
        } else {
          const sem = semesters.find(
            (s) => String(s._id) === String(filterSemester)
          );
          matchesSemester = sem
            ? section.schoolYear === sem.schoolYear && section.term === sem.term
            : true;
        }
      }

      return matchesSearch && matchesCollege && matchesSemester;
    });
  }, [sections, searchTerm, filterCollege, filterSemester, semesters]);

  const fetchSections = useCallback(async () => {
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
      const res = await authenticatedFetch(`${API_BASE}/api/admin/sections`);
      if (res.ok) {
        const data = await res.json();
        setSections(data.sections || []);
      }
    } catch (err) {
      console.error("Error fetching sections:", err);
    } finally {
      setLoading(false);
    }
  }, []);

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
        classStanding: "30",
        laboratory: "30",
        majorOutput: "40",
      },
    });
    setFilteredSubjects([]);
    setSelectedSection(null);
  };

  const openEditModal = async (section) => {
    const sectionId = section._id;

    if (isLocked(sectionId)) {
      const lockedBy = getLockedBy(sectionId);
      showError(
        `This section is currently being edited by ${lockedBy}. Please try again later.`
      );
      return;
    }

    const lockAcquired = await acquireLock(sectionId, "section");
    if (!lockAcquired) {
      showError(
        "Unable to acquire lock for editing. Another admin may have started editing."
      );
      refreshLocksWithDelay();
      return;
    }

    setSelectedSection(section);
    
    // Find the semester ID - try multiple approaches
    let semesterId = "";
    
    // Method 1: From subject.semester (most common)
    if (section.subject?.semester) {
      semesterId = section.subject.semester._id || section.subject.semester;
    }
    
    // Method 2: Find semester by schoolYear and term if subject.semester not available
    if (!semesterId && section.schoolYear && section.term) {
      const matchingSemester = semesters.find(
        (s) => s.schoolYear === section.schoolYear && s.term === section.term
      );
      if (matchingSemester) {
        semesterId = matchingSemester._id;
      }
    }
    
    console.log('📝 Edit section - semester detection:', {
      sectionSchoolYear: section.schoolYear,
      sectionTerm: section.term,
      subjectSemester: section.subject?.semester,
      detectedSemesterId: semesterId,
      availableSemesters: semesters.map(s => ({ id: s._id, schoolYear: s.schoolYear, term: s.term }))
    });
    
    // Filter subjects based on the detected semester
    const filtered = semesterId
      ? subjects.filter((s) => {
          const subjectSemesterId = s.semester?._id || s.semester;
          return subjectSemesterId === semesterId;
        })
      : [];
    
    console.log('📚 Filtered subjects:', {
      semesterId,
      totalSubjects: subjects.length,
      filteredCount: filtered.length,
      selectedSubjectId: section.subject?._id || section.subject
    });
    
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
    return subject
      ? `${subject.subjectCode} - ${subject.subjectName}`
      : "Unknown Subject";
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
        `${API_BASE}/api/admin/students?search=${encodeURIComponent(
          query
        )}&limit=12000`
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
  }, [searchQuery, showInviteModal]);

  const handleStudentSelection = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleInviteStudents = async () => {
    if (selectedStudents.length === 0) {
      showError("Please select at least one student to invite");
      return;
    }
    try {
      const res = await authenticatedFetch(
        `${API_BASE}/api/admin/sections/${selectedSection._id}/invite-students`,
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
          `Successfully invited ${
            data.invitedStudents?.length || selectedStudents.length
          } students to the section!`
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

    setSubmitting(true);
    try {
      const url = selectedSection
        ? `${API_BASE}/api/admin/sections/${selectedSection._id}`
        : `${API_BASE}/api/admin/sections`;
      const method = selectedSection ? "PUT" : "POST";

      const res = await authenticatedFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchSections();

        // Release lock if editing
        if (selectedSection?._id) {
          await releaseLock(selectedSection._id, "section");
        }

        resetForm();
        setShowAddModal(false);
        setShowEditModal(false);

        // Refresh lock statuses
        refreshLocksWithDelay();

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
      console.error(err);
      showError("Error saving section");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------- Archive a section --------------------------- */
  const handleArchiveSection = async (id) => {
    if (!id) {
      showError("Invalid section ID");
      return;
    }
    if (isLocked(id)) {
      const lockedBy = getLockedBy(id);
      showError(
        `This section is currently being edited by ${lockedBy}. Please try again later.`
      );
      return;
    }
    const section = sections.find((s) => (s._id || s.id) === id);
    if (!section) {
      showError("Section not found");
      return;
    }

    const ok = await acquireLock(id, "section");
    if (!ok) {
      showError(
        "Unable to acquire lock for archiving. Another admin may have started editing."
      );
      refreshLocksWithDelay();
      return;
    }

    refreshLocksWithDelay();

    const sectionName = section.sectionName || "this section";

    showConfirmDialog(
      "Archive Section",
      `Are you sure you want to archive "${sectionName}"? This will hide the section from normal operations but it can be restored later.`,
      async () => {
        try {
          const res = await authenticatedFetch(
            `${API_BASE}/api/admin/sections/${id}/archive`,
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
        } finally {
          await releaseLock(id, "section");
          refreshLocksWithDelay();
        }
      },
      async () => {
        await releaseLock(id, "section");
        refreshLocksWithDelay();
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
          <PageHeader
            onAddClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
          />

          <SearchAndFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterSemester={filterSemester}
            onSemesterChange={setFilterSemester}
            filterCollege={filterCollege}
            onCollegeChange={setFilterCollege}
            semesters={semesters}
            collegeOptions={collegeOptions}
          />

          {/* Sections Grid */}
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSections.map((section) => (
                <SectionCard
                  key={section._id}
                  section={section}
                  isLocked={isLocked}
                  getLockedBy={getLockedBy}
                  onEdit={openEditModal}
                  onArchive={handleArchiveSection}
                  onInviteStudents={(section) => {
                    setSelectedSection(section);
                    setShowInviteModal(true);
                    setSearchQuery("");
                    setSearchResults([]);
                    setSelectedStudents([]);
                  }}
                  onViewStudents={(sectionId) => navigate(`/admin/view-invite-student/${sectionId}`)}
                  getSubjectName={getSubjectName}
                  getInstructorName={getInstructorName}
                />
              ))}

              {sections.length === 0 && (
                <EmptyState
                  onAddClick={() => {
                    resetForm();
                    setShowAddModal(true);
                  }}
                />
              )}
            </div>
          )}

          {/* Add Section Modal */}
          <Modal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            title="Add New Section"
          >
            <SectionForm
              formData={formData}
              filteredSubjects={filteredSubjects}
              semesters={semesters}
              instructors={instructors}
              gradingTotal={gradingTotal}
              isEdit={false}
              onSubmit={handleSubmit}
              onChange={handleChange}
              onSchemaChange={handleSchemaChange}
              onCancel={() => setShowAddModal(false)}
              submitting={submitting}
            />
          </Modal>

          {/* Edit Section Modal */}
          <Modal
            isOpen={showEditModal}
            onClose={async () => {
              const id = selectedSection?._id || selectedSection?.id;
              if (id) {
                await releaseLock(id, "section");
                refreshLocksWithDelay();
              }
              setShowEditModal(false);
            }}
            title="Edit Section"
          >
            <SectionForm
              formData={formData}
              filteredSubjects={filteredSubjects}
              semesters={semesters}
              instructors={instructors}
              gradingTotal={gradingTotal}
              isEdit={true}
              onSubmit={handleSubmit}
              onChange={handleChange}
              onSchemaChange={handleSchemaChange}
              onCancel={async () => {
                const id = selectedSection?._id || selectedSection?.id;
                if (id) {
                  await releaseLock(id, "section");
                }
                setShowEditModal(false);
                refreshLocksWithDelay();
              }}
              submitting={submitting}
            />
          </Modal>

          {/* Invite Students Modal */}
          <Modal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            title="Add Students to Section"
          >
            <InviteStudentsModal
              selectedSection={selectedSection}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchResults={searchResults}
              isSearching={isSearching}
              selectedStudents={selectedStudents}
              onStudentSelection={handleStudentSelection}
              onInvite={handleInviteStudents}
              onCancel={() => {
                setShowInviteModal(false);
                setSelectedStudents([]);
                setSelectedSection(null);
                setSearchQuery("");
                setSearchResults([]);
              }}
              getSubjectName={getSubjectName}
              getInstructorName={getInstructorName}
            />
          </Modal>
        </div>
      </div>
    </NotificationProvider>
  );
}
