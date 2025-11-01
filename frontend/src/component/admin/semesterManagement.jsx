import React, { useState, useEffect, useCallback } from "react";
import { NavbarSimple } from "./adminsidebar";
import { authenticatedFetch } from "../../utils/auth";
import { useLock, useBatchLockStatus } from "../../hooks/useLock";
import {
  PageHeader,
  LoadingSpinner,
  EmptyState,
  SemesterCard,
  SemesterForm,
  Modal,
  NotificationModal,
  ConfirmationModal,
} from "./ui/semester";

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5000";

export default function SemesterManagement() {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [formData, setFormData] = useState({ schoolYear: "", term: "1st" });
  const [submitting, setSubmitting] = useState(false);

  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    type: "",
    title: "",
    message: "",
  });

  // Confirmation modal state
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  // Lock management
  const semesterIds = semesters.map((s) => s._id || s.id);
  const {
    isLocked,
    getLockedBy,
    refresh: refreshLocks,
  } = useBatchLockStatus("semester", semesterIds);
  const refreshLocksWithDelay = useCallback(() => {
    refreshLocks();
    setTimeout(() => refreshLocks(), 5000);
  }, [refreshLocks]);

  // Lock for editing - only create when we have a selected semester
  const lockHook = useLock(
    "semester",
    selectedSemester?._id || selectedSemester?.id
  );
  const acquireLock = lockHook.acquireLock;
  const releaseLock = lockHook.releaseLock;

  // Notification helpers
  const showNotification = (type, title, message) =>
    setNotification({ show: true, type, title, message });
  const hideNotification = () =>
    setNotification({ show: false, type: "", title: "", message: "" });

  // Confirmation helpers
  const showConfirmDialog = (title, message, onConfirm) =>
    setConfirmDialog({ show: true, title, message, onConfirm });
  const hideConfirmDialog = () =>
    setConfirmDialog({ show: false, title: "", message: "", onConfirm: null });

  const fetchSemesters = useCallback(async () => {
    try {
      setLoading(true);

      // Clean up expired locks first
      try {
        await authenticatedFetch(`${API_BASE}/api/locks/cleanup`, {
          method: "POST",
        });
        console.log("🧹 Cleaned up expired locks");
      } catch (err) {
        console.warn("Failed to cleanup locks:", err);
      }

      const res = await authenticatedFetch(`${API_BASE}/api/admin/semesters`);
      if (res.ok) {
        const data = await res.json();
        setSemesters(data.semesters || []);
      } else {
        showNotification("error", "Error", "Failed to fetch semesters");
      }
    } catch (err) {
      showNotification(
        "error",
        "Error",
        "There was an error processing your request."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSemesters();
  }, [fetchSemesters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = selectedSemester
        ? `${API_BASE}/api/admin/semesters/${selectedSemester._id}`
        : `${API_BASE}/api/admin/semesters`;
      const method = selectedSemester ? "PUT" : "POST";
      const res = await authenticatedFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        // await fetchSemesters();

        // // Release lock if editing
        // if (selectedSemester) {
        //   await releaseLock();
        // }
        if (selectedSemester) {
          const id = selectedSemester._id || selectedSemester.id;
          await releaseLock(id, "semester");
        }
        await fetchSemesters();

        resetForm();
        setShowAddModal(false);
        setShowEditModal(false);

        // Refresh lock statuses
        refreshLocksWithDelay();

        showNotification(
          "success",
          "Success",
          selectedSemester
            ? "Semester updated successfully!"
            : "Semester added successfully!"
        );
      } else {
        const data = await res.json();
        showNotification(
          "error",
          "Error",
          data.message || "Failed to save semester"
        );
      }
    } catch (err) {
      showNotification(
        "error",
        "Error",
        "There was an error processing your request."
      );
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveSemester = async (id) => {
    if (!id) {
      showNotification("error", "Error", "Invalid semester ID");
      return;
    }
    const semester = semesters.find((s) => (s._id || s.id) === id);
    if (!semester) {
      showNotification("error", "Error", "Semester not found");
      return;
    }

    const ok = await acquireLock(id, "semester");
    if (!ok) {
      showNotification(
        "error",
        "Locked",
        "Unable to acquire an edit lock for this semester. Please try again."
      );
      refreshLocksWithDelay();
      return;
    }

    refreshLocksWithDelay();

    const semesterLabel = `${semester.schoolYear} - ${semester.term} Semester`;

    showConfirmDialog(
      "Archive Semester",
      `Are you sure you want to archive "${semesterLabel}"? This will hide the semester from normal operations but it can be restored later.`,
      async () => {
        try {
          const res = await authenticatedFetch(
            `${API_BASE}/api/admin/semesters/${id}/archive`,
            { method: "PUT" }
          );
          if (res.ok) {
            setSemesters((prev) => prev.filter((s) => (s._id || s.id) !== id));
            showNotification(
              "success",
              "Success",
              `Semester "${semesterLabel}" archived successfully!`
            );
          } else {
            const errorData = await res.json().catch(() => ({}));
            showNotification(
              "error",
              "Error",
              errorData.message || "Failed to archive semester."
            );
          }
        } catch (err) {
          console.error("Archive semester error:", err);
          showNotification(
            "error",
            "Error",
            "There was an error processing your request."
          );
        } finally {
          await releaseLock(id, "semester");
          refreshLocksWithDelay();
        }
      },
      async () => {
        await releaseLock(id, "semester");
        refreshLocksWithDelay();
      }
    );
  };

  const resetForm = () => {
    setFormData({ schoolYear: "", term: "1st" });
    setSelectedSemester(null);
  };

  const openEditModal = async (semester) => {
    const id = semester._id || semester.id;

    console.log(`🔍 Checking lock status for semester: ${id}`);

    // list-level check first
    if (isLocked(id)) {
      const lockedBy = getLockedBy(id);
      console.log(`❌ Semester is locked by: ${lockedBy}`);
      showNotification(
        "error",
        "Locked",
        `This semester is currently being edited by ${lockedBy}. Please try again later.`
      );
      return;
    }

    console.log(`🔒 Attempting to acquire lock for semester: ${id}`);
    // acquire the lock using the explicit id/type
    const ok = await acquireLock(id, "semester");
    if (!ok) {
      console.log(`❌ Failed to acquire lock for semester: ${id}`);
      refreshLocksWithDelay(); // reflect who holds it now
      return;
    }

    console.log(`✅ Lock acquired successfully for semester: ${id}`);
    // only set state and open after lock succeeds
    setSelectedSemester(semester);
    setFormData({ schoolYear: semester.schoolYear, term: semester.term });
    setShowEditModal(true);
  };

  const generateSchoolYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const options = [];
    for (let i = 0; i < 10; i++) {
      const startYear = currentYear - 2 + i;
      const endYear = startYear + 1;
      options.push(`${startYear}-${endYear}`);
    }
    return options;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <NavbarSimple />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        <PageHeader
          onAddClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
        />

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {semesters.map((semester) => (
              <SemesterCard
                key={semester._id || semester.id}
                semester={semester}
                isLocked={isLocked}
                lockedBy={getLockedBy}
                onEdit={openEditModal}
                onArchive={handleArchiveSemester}
              />
            ))}

            {semesters.length === 0 && <EmptyState />}
          </div>
        )}

        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add New Semester"
        >
          <SemesterForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onCancel={() => setShowAddModal(false)}
            submitting={submitting}
            isEdit={false}
            schoolYearOptions={generateSchoolYearOptions()}
          />
        </Modal>

        <Modal
          isOpen={showEditModal}
          onClose={async () => {
            const id = selectedSemester?._id || selectedSemester?.id;
            if (id) {
              await releaseLock(id, "semester");
              refreshLocksWithDelay();
            }
            setShowEditModal(false);
          }}
          title="Edit Semester"
        >
          <SemesterForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onCancel={async () => {
              const id = selectedSemester?._id || selectedSemester?.id;
              if (id) {
                await releaseLock(id, "semester");
                refreshLocksWithDelay();
              }
              setShowEditModal(false);
            }}
            submitting={submitting}
            isEdit={true}
            schoolYearOptions={generateSchoolYearOptions()}
          />
        </Modal>

        <NotificationModal
          isOpen={notification.show}
          onClose={hideNotification}
          type={notification.type}
          title={notification.title}
          message={notification.message}
        />

        <ConfirmationModal
          isOpen={confirmDialog.show}
          onClose={hideConfirmDialog}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
        />
      </div>
    </div>
  );
}
