import React, { useState, useEffect, useCallback } from "react";
import { NavbarSimple } from "./adminsidebar";
import { authenticatedFetch } from "../../utils/auth";
import Pagination from "../common/Pagination";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationProvider } from "../common/NotificationModals";
import { useLock, useBatchLockStatus } from "../../hooks/useLock";
import {
  PageHeader,
  SearchAndFilters,
  LoadingSpinner,
  EmptyState,
  SubjectTableDesktop,
  SubjectCardMobile,
  SubjectForm,
  Modal,
} from "./ui/subjects";

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5000";

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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
    "College of Arts and Science",
    "College of Public Administration",
    "College of Nursing",
    "College of Law",
  ];

  // Fetch data
  useEffect(() => {
    fetchSubjects();
    fetchSemesters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debug semesters and subjects state
  useEffect(() => {
    console.log('🎓 Semesters state updated:', semesters);
    console.log('🎓 Semesters count:', semesters?.length);
    
    // Show current status
    if (semesters?.length === 0) {
      console.log('🚨 No semesters available - Subject form will show empty dropdown');
    } else if (semesters?.length > 0) {
      console.log('✅ Semesters loaded successfully:', semesters.map(s => `${s.schoolYear} - ${s.term}`));
    }
  }, [semesters]);

  // Debug subjects state
  useEffect(() => {
    console.log('📚 Subjects state updated:', subjects);
    console.log('📚 Subjects count:', subjects?.length);
    console.log('📚 Loading status:', loading);
    
    if (subjects?.length === 0 && !loading) {
      console.log('📭 No subjects in state after loading completed');
    } else if (subjects?.length > 0) {
      console.log('✅ Subjects loaded successfully:', subjects.map(s => `${s.subjectCode} - ${s.subjectName}`));
    }
  }, [subjects, loading]);

  // Function to determine current semester based on current date
  const getCurrentSemester = useCallback(() => {
    if (!semesters || semesters.length === 0) return null;
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
    
    // Determine current academic year and term
    let currentAcademicYear;
    let currentTerm;
    
    if (currentMonth >= 8) {
      // August onwards = new academic year starts
      currentAcademicYear = `${currentYear}-${currentYear + 1}`;
      currentTerm = "1st";
    } else if (currentMonth >= 1 && currentMonth <= 5) {
      // January to May = 2nd semester
      currentAcademicYear = `${currentYear - 1}-${currentYear}`;
      currentTerm = "2nd";
    } else {
      // June to July = Summer
      currentAcademicYear = `${currentYear - 1}-${currentYear}`;
      currentTerm = "Summer";
    }
    
    // Find matching semester
    const currentSemester = semesters.find(
      sem => sem.schoolYear === currentAcademicYear && sem.term === currentTerm
    );
    
    // If exact match not found, return the most recent semester
    if (!currentSemester) {
      return semesters.sort((a, b) => {
        const yearA = parseInt(a.schoolYear.split('-')[0]);
        const yearB = parseInt(b.schoolYear.split('-')[0]);
        if (yearA !== yearB) return yearB - yearA;
        
        const termOrder = { "1st": 1, "2nd": 2, "Summer": 3 };
        return termOrder[b.term] - termOrder[a.term];
      })[0];
    }
    
    return currentSemester;
  }, [semesters]);

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

      console.log("🔄 Fetching subjects from:", `${API_BASE}/api/admin/subjects`);
      console.log("🔐 Authentication check - token exists:", !!localStorage.getItem('token'));
      setLoading(true);
      
      const res = await authenticatedFetch(`${API_BASE}/api/admin/subjects`);
      console.log("📡 Fetch subjects response status:", res.status);
      console.log("📡 Response headers:", res.headers);
      
      if (res.ok) {
        const data = await res.json();
        console.log("📋 Raw API response:", data);
        console.log("📋 Subjects array:", data.subjects);
        console.log("📋 Subjects fetched:", data.subjects?.length || 0, "items");
        
        if (!data.subjects) {
          console.warn("⚠️ No subjects array in response");
          setSubjects([]);
          showError("No subjects data received from server");
        } else if (data.subjects.length === 0) {
          console.log("📭 No subjects found in database");
          setSubjects([]);
          showError("No subjects found in the database. Please add some subjects first.");
        } else {
          console.log("✅ Setting subjects state with:", data.subjects.length, "items");
          setSubjects(data.subjects);
        }
      } else if (res.status === 401) {
        console.error("🔒 Authentication failed");
        showError("Session expired. Please log in again.");
        // Optionally redirect to login
        // window.location.href = '/admin/login';
      } else if (res.status === 403) {
        console.error("🚫 Access forbidden");
        showError("Access denied. You don't have permission to view subjects.");
      } else if (res.status === 500) {
        console.error("💥 Server error");
        showError("Server error. Please try again later.");
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
        console.error("❌ Failed to fetch subjects:", res.status, errorData);
        showError(`Failed to fetch subjects: ${errorData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("💥 Error fetching subjects:", err);
      
      // Check different types of errors
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        showError("Cannot connect to the server. Please ensure the backend is running on http://localhost:5000");
      } else if (err.message.includes('NetworkError')) {
        showError("Network error. Please check your internet connection.");
      } else {
        showError(`Error fetching subjects: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const fetchSemesters = async () => {
    try {
      console.log('🔄 Fetching semesters from:', `${API_BASE}/api/semesters`);
      const res = await authenticatedFetch(`${API_BASE}/api/semesters`);
      console.log('📡 Semesters API response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('📋 Semesters API response data:', data);
        setSemesters(data.semesters || []);
        console.log('✅ Semesters set in state:', data.semesters?.length || 0, 'items');
        
        // If no semesters found, show helpful message
        if (!data.semesters || data.semesters.length === 0) {
          console.log('⚠️ No semesters found in database');
          showError("No semesters found. Please go to 'Semester Management' and add at least one semester first (e.g., 2024-2025 - 1st Semester).");
        }
      } else {
        console.error('❌ Failed to fetch semesters:', res.status, res.statusText);
        const errorData = await res.json().catch(() => ({}));
        console.error('❌ Error details:', errorData);
        
        // Check if it's a connection error
        if (res.status === 0 || !res.status) {
          showError("Cannot connect to server. Please ensure the backend is running.");
        } else {
          showError(`Failed to fetch semesters: ${errorData.message || res.statusText}`);
        }
      }
    } catch (err) {
      console.error("💥 Error fetching semesters:", err);
      
      // Check if it's a network error
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        showError("Cannot connect to server. Please start the backend server first.");
      } else {
        showError("Error fetching semesters from server. Check console for details.");
      }
    }
  };

  /* ---------------- Universal input handler (smooth typing) ---------------- */
  const handleChange = (e) => {
    const { name, value } = e.target; // read before setState (avoids pooled event pitfalls)
    
    // If college changes, reset department
    if (name === "college") {
      setFormData((prev) => ({ ...prev, [name]: value, department: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    const currentSemester = getCurrentSemester();
    setFormData({
      subjectCode: "",
      subjectName: "",
      units: "3",
      college: "",
      department: "",
      // Automatically set current semester as default
      semester: currentSemester?._id || "",
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
      // Keep the original semester when editing
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

      const requestData = {
        ...formData,
        units: parseInt(formData.units, 10),
      };

      console.log(`📤 ${method} Request to:`, url);
      console.log("📦 Request data:", requestData);
      console.log("🎯 Selected subject:", selectedSubject);

      const res = await authenticatedFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      console.log("📡 Response status:", res.status);

      if (res.ok) {
        const responseData = await res.json();
        console.log("✅ Response data:", responseData);
        
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
        console.error("❌ Error response:", data);
        showError(data.message || "Failed to save subject");
      }
    } catch (err) {
      console.error("💥 Submit error:", err);
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
  const filteredSubjects = React.useMemo(() => {
    console.log('🔍 Filtering subjects:', {
      totalSubjects: subjects?.length || 0,
      searchTerm,
      filterSemester,
      filterCollege
    });

    if (!subjects || subjects.length === 0) {
      console.log('📭 No subjects to filter');
      return [];
    }

    const filtered = subjects.filter((subject) => {
      const code = (subject?.subjectCode || "").toLowerCase();
      const name = (subject?.subjectName || "").toLowerCase();
      const term = searchTerm.toLowerCase();

      const matchesSearch = !term || code.includes(term) || name.includes(term);
      const subjSemId = subject?.semester?._id || subject?.semester; // id or object
      const matchesSemester = !filterSemester || subjSemId === filterSemester;
      const matchesCollege = !filterCollege || subject?.college === filterCollege;

      const passes = matchesSearch && matchesSemester && matchesCollege;
      
      if (!passes) {
        console.log('🚫 Subject filtered out:', {
          subjectCode: subject.subjectCode,
          matchesSearch,
          matchesSemester,
          matchesCollege,
          subjSemId,
          filterSemester
        });
      }

      return passes;
    });

    console.log('✅ Filtered subjects result:', {
      originalCount: subjects.length,
      filteredCount: filtered.length,
      subjects: filtered.map(s => s.subjectCode)
    });

    return filtered;
  }, [subjects, searchTerm, filterSemester, filterCollege]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterSemester, filterCollege]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSubjects = filteredSubjects.slice(startIndex, endIndex);

  // Debug pagination
  React.useEffect(() => {
    console.log('📄 Pagination state:', {
      filteredCount: filteredSubjects.length,
      currentPage,
      itemsPerPage,
      totalPages,
      startIndex,
      endIndex,
      paginatedCount: paginatedSubjects.length,
      paginatedSubjects: paginatedSubjects.map(s => s.subjectCode)
    });
  }, [filteredSubjects.length, currentPage, itemsPerPage, totalPages, startIndex, endIndex, paginatedSubjects]);

  const handlePageChange = (page) => setCurrentPage(page);
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return (
    <NotificationProvider notifications={notifications}>
      <div className="flex min-h-screen bg-gray-50">
        <NavbarSimple />
        <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 w-full mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 pt-4 sm:pt-6 md:pt-8 lg:pt-10">
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
            onFilterSemesterChange={setFilterSemester}
            filterCollege={filterCollege}
            onFilterCollegeChange={setFilterCollege}
            semesters={semesters}
            collegeOptions={collegeOptions}
          />

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              {filteredSubjects.length > 0 ? (
                <>
                  <SubjectTableDesktop
                    subjects={paginatedSubjects}
                    isLocked={isLocked}
                    getLockedBy={getLockedBy}
                    onEdit={openEditModal}
                    onArchive={handleArchive}
                    getSemesterLabel={getSemesterLabel}
                  />
                  <SubjectCardMobile
                    subjects={paginatedSubjects}
                    isLocked={isLocked}
                    getLockedBy={getLockedBy}
                    onEdit={openEditModal}
                    onArchive={handleArchive}
                    getSemesterLabel={getSemesterLabel}
                  />
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredSubjects.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                  />
                </>
              ) : (
                <EmptyState
                  hasFilters={!!(searchTerm || filterSemester || filterCollege)}
                />
              )}
            </div>
          )}

          <Modal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            title="Add New Subject"
          >
            <SubjectForm
              formData={formData}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onCancel={() => setShowAddModal(false)}
              submitting={submitting}
              isEdit={false}
              collegeOptions={collegeOptions}
              semesters={semesters}
              currentSemester={getCurrentSemester()}
            />
          </Modal>

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
            <SubjectForm
              formData={formData}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onCancel={async () => {
                const id = selectedSubject?._id;
                if (id) {
                  await releaseLock(id, "subject");
                }
                setShowEditModal(false);
                refreshLocksWithDelay();
              }}
              submitting={submitting}
              isEdit={true}
              collegeOptions={collegeOptions}
              semesters={semesters}
              currentSemester={getCurrentSemester()}
            />
          </Modal>
        </div>
      </div>
    </NotificationProvider>
  );
}
