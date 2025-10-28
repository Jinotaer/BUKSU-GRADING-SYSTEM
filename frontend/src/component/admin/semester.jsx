import React, { useState, useEffect, useCallback } from "react";
import {
  IconPlus,
  IconEdit,
  IconCalendarEvent,
  IconSchool,
  IconX,
  IconCheck,
  IconAlertCircle,
  IconCircleCheck,
  IconArchive,
  IconChevronDown,
  IconLock,
} from "@tabler/icons-react";
import { NavbarSimple } from "./adminsidebar";
import { authenticatedFetch } from "../../utils/auth";
import { useLock, useBatchLockStatus } from "../../hooks/useLock";

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5000";

/**
 * Standalone components kept OUTSIDE the main component to avoid
 * accidental brace/closure issues that can lead to
 * "return outside of function" parser errors.
 */

function SchoolYearCombo({
  id,
  value,
  onChange,
  options,
  placeholder = "e.g., 2025-2026",
  required,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [active, setActive] = useState(-1);

  // Keep local input in sync if parent changes (e.g., when opening Edit)
  useEffect(() => {
    if ((value || "") !== query) setQuery(value || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes((query || "").toLowerCase())
  );

  const commit = (val) => {
    setQuery(val);
    onChange(val);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % Math.max(filtered.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(
        (i) =>
          (i - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1)
      );
    } else if (e.key === "Enter") {
      if (active >= 0 && filtered[active]) {
        e.preventDefault();
        commit(filtered[active]);
      } else {
        // Enter commits whatever is typed
        commit(query);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <div className="flex">
        <input
          id={id}
          type="text"
          value={query}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            onChange(v); // keep parent in sync so submit has latest value
            if (v.length >= 2) setOpen(true); // only open when user has typed a bit
          }}
          onKeyDown={onKeyDown}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          className="w-full px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
          required={required}
        />
        <button
          type="button"
          aria-label="Toggle suggestions"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen((o) => !o)}
          className="px-3 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-50"
        >
          <IconChevronDown size={18} className="text-gray-600" />
        </button>
      </div>
      {open && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto"
        >
          {filtered.length ? (
            filtered.map((opt, idx) => (
              <li key={opt} role="option" aria-selected={idx === active}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commit(opt)}
                  className={`block w-full text-left px-3 py-2 hover:bg-blue-50 ${
                    idx === active ? "bg-blue-50" : ""
                  }`}
                >
                  {opt}
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-gray-500">No matches</li>
          )}
        </ul>
      )}
    </div>
  );
}

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
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
}

function NotificationModal({ isOpen, onClose, type, title, message }) {
  if (!isOpen) return null;
  const isSuccess = type === "success";
  const iconColor = isSuccess ? "text-green-500" : "text-red-500";
  const bgColor = isSuccess ? "bg-green-50" : "bg-red-50";
  const buttonColor = isSuccess
    ? "bg-blue-600 hover:bg-blue-700"
    : "bg-red-600 hover:bg-red-700";
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="text-center">
          <div
            className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${bgColor} mb-4`}
          >
            {isSuccess ? (
              <IconCircleCheck className={iconColor} size={24} />
            ) : (
              <IconX className={iconColor} size={24} />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          <button
            onClick={onClose}
            className={`w-full text-white px-4 py-2 rounded-lg transition-colors ${buttonColor}`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmationModal({ isOpen, onClose, title, message, onConfirm }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-50 mb-4">
            <IconAlertCircle className="text-red-500" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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

      const res = await authenticatedFetch(
        `${API_BASE}/api/admin/semesters`
      );
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="pt-4 sm:pt-6 md:pt-4 lg:pt-6 font-outfit text-[#1E3A5F] text-xl sm:text-2xl lg:text-3xl font-bold">
              Semester Management
            </h2>
            <p className="text-gray-600 mt-1">
              Manage academic semesters and terms
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
            Add Semester
          </button>
        </div>

        {/* Semesters Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {semesters.map((semester) => (
              <div
                key={semester._id || semester.id}
                className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <IconCalendarEvent className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {semester.schoolYear}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {semester.term} Semester
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(semester)}
                      disabled={isLocked(semester._id || semester.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        isLocked(semester._id || semester.id)
                          ? "text-gray-300 cursor-not-allowed bg-gray-50"
                          : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                      }`}
                      title={
                        isLocked(semester._id || semester.id)
                          ? `Locked by ${getLockedBy(
                              semester._id || semester.id
                            )}`
                          : "Edit semester"
                      }
                    >
                      <IconEdit size={16} />
                    </button>
                    <button
                      onClick={() =>
                        handleArchiveSemester(semester._id || semester.id)
                      }
                      disabled={isLocked(semester._id || semester.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        isLocked(semester._id || semester.id)
                          ? "text-gray-300 cursor-not-allowed bg-gray-50"
                          : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                      }`}
                      title={
                        isLocked(semester._id || semester.id)
                          ? `Locked by ${getLockedBy(
                              semester._id || semester.id
                            )}`
                          : "Archive semester"
                      }
                    >
                      <IconArchive size={16} />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Created: {new Date(semester.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}

            {semesters.length === 0 && (
              <div className="col-span-full text-center py-12">
                <IconSchool className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  No semesters found
                </h3>
                <p className="text-gray-500">
                  Get started by adding your first semester
                </p>
              </div>
            )}
          </div>
        )}

        {/* Add Semester Modal */}
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add New Semester"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="schoolYearAdd"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                School Year
              </label>
              <SchoolYearCombo
                id="schoolYearAdd"
                value={formData.schoolYear}
                onChange={(v) => setFormData({ ...formData, schoolYear: v })}
                options={generateSchoolYearOptions()}
                required
              />
            </div>

            <div>
              <label
                htmlFor="termAdd"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Term
              </label>
              <select
                id="termAdd"
                value={formData.term}
                onChange={(e) =>
                  setFormData({ ...formData, term: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="1st">1st Semester</option>
                <option value="2nd">2nd Semester</option>
                <option value="Summer">Summer</option>
              </select>
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
                    Add Semester
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* Edit Semester Modal */}
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="schoolYearEdit"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                School Year
              </label>
              <SchoolYearCombo
                id="schoolYearEdit"
                value={formData.schoolYear}
                onChange={(v) => setFormData({ ...formData, schoolYear: v })}
                options={generateSchoolYearOptions()}
                required
              />
            </div>

            <div>
              <label
                htmlFor="termEdit"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Term
              </label>
              <select
                id="termEdit"
                value={formData.term}
                onChange={(e) =>
                  setFormData({ ...formData, term: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="1st">1st Semester</option>
                <option value="2nd">2nd Semester</option>
                <option value="Summer">Summer</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={async () => {
                  const id = selectedSemester?._id || selectedSemester?.id;
                  if (id) {
                    await releaseLock(id, "semester");
                    refreshLocksWithDelay();
                  }
                  setShowEditModal(false);
                }}
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
                    Update Semester
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* Notification Modal */}
        <NotificationModal
          isOpen={notification.show}
          onClose={hideNotification}
          type={notification.type}
          title={notification.title}
          message={notification.message}
        />

        {/* Confirmation Modal */}
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
