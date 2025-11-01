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

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterSemester, filterCollege]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSubjects = filteredSubjects.slice(startIndex, endIndex);

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
            />
          </Modal>
        </div>
      </div>
    </NotificationProvider>
  );
}
