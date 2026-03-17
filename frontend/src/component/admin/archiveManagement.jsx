import React, { useState, useEffect, useCallback } from "react";
import { NavbarSimple } from "./adminsidebar";
import { authenticatedFetch } from "../../utils/auth";
import { getFreshCachedJson } from "../../lib/apiCache";
import { useLock } from "../../hooks/useLock";
import Pagination from "../common/Pagination";
import { ConfirmationModal } from "../common/NotificationModals";
import {
  PageHeader,
  LoadingSpinner,
  ToolbarControls,
  ErrorMessage,
  TabNavigation,
  ArchiveItem,
  EmptyState,
} from "./ui/archive";
import { NotificationModal } from "./ui/semester/NotificationModal";

const LOCK_REQUIRED_TYPES = new Set(["semesters", "subjects", "sections"]);
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5000";

export default function ArchiveManagement() {
  const [activeTab, setActiveTab] = useState("students");
  const cachedStudents =
    getFreshCachedJson(
      `${API_BASE}/api/admin/students?includeArchived=true`,
    )?.students || [];
  const [data, setData] = useState({
    students: cachedStudents.filter((item) => item.isArchived === true),
    instructors: [],
    semesters: [],
    subjects: [],
    sections: [],
  });
  const [loading, setLoading] = useState(cachedStudents.length === 0);
  const [error, setError] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  const { acquireLock, releaseLock } = useLock();
  const [notification, setNotification] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const hideConfirmDialog = useCallback(() => {
    setConfirmDialog({
      show: false,
      title: "",
      message: "",
      onConfirm: null,
    });
  }, []);

  const showConfirmDialog = useCallback((title, message, onConfirm) => {
    setConfirmDialog({
      show: true,
      title,
      message,
      onConfirm,
    });
  }, []);

  const fetchData = useCallback(
    async (type) => {
      setLoading(true);
      setError("");
      try {
        const includeArchived = "?includeArchived=true";
        let endpoint = "";

        switch (type) {
          case "students":
            endpoint = `/api/admin/students${includeArchived}`;
            break;
          case "instructors":
            endpoint = `/api/admin/instructors${includeArchived}`;
            break;
          case "semesters":
            endpoint = `/api/admin/semesters${includeArchived}`;
            break;
          case "subjects":
            endpoint = `/api/admin/subjects${includeArchived}`;
            break;
          case "sections":
            endpoint = `/api/admin/sections${includeArchived}`;
            break;
          default:
            return;
        }

        const response = await authenticatedFetch(`${API_BASE}${endpoint}`);
        if (response.ok) {
          const result = await response.json();
          const items = result[type] || result[type + "s"] || result.data || [];

          const filteredItems = showArchived
            ? items
            : items.filter((item) => item.isArchived === true);

          setData((prev) => ({
            ...prev,
            [type]: filteredItems,
          }));
        } else {
          setError(`Failed to fetch ${type}`);
        }
      } catch (err) {
        setError(`Error fetching ${type}: ${err.message}`);
      } finally {
        setLoading(false);
      }
    },
    [showArchived],
  );

  const archiveItem = useCallback(
    async (type, id) => {
      let lockAcquired = false;
      try {
        const pluralType = type.endsWith("s") ? type : `${type}s`;
        if (LOCK_REQUIRED_TYPES.has(pluralType)) {
          lockAcquired = await acquireLock(id, pluralType.slice(0, -1));
          if (!lockAcquired) {
            setError(`Unable to acquire a lock for ${type}. Please try again.`);
            return;
          }
        }

        const response = await authenticatedFetch(
          `${API_BASE}/api/admin/${pluralType}/${id}/archive`,
          { method: "PUT" },
        );

        if (response.ok) {
          await fetchData(activeTab);
        } else {
          const errorData = await response.json();
          setError(errorData.message || `Failed to archive ${type}`);
        }
      } catch (err) {
        setError(`Error archiving ${type}: ${err.message}`);
      } finally {
        const pluralType = type.endsWith("s") ? type : `${type}s`;
        if (lockAcquired && LOCK_REQUIRED_TYPES.has(pluralType)) {
          await releaseLock(id, pluralType.slice(0, -1));
        }
      }
    },
    [acquireLock, activeTab, fetchData, releaseLock],
  );

  const unarchiveItem = useCallback(
    async (type, id) => {
      try {
        const pluralType = type.endsWith("s") ? type : `${type}s`;
        const response = await authenticatedFetch(
          `${API_BASE}/api/admin/${pluralType}/${id}/unarchive`,
          { method: "PUT" },
        );

        if (response.ok) {
          const result = await response.json();
          await fetchData(activeTab);
          if (result.warning) {
            setNotification({
              isOpen: true,
              type: "warning",
              title: "Attention Required",
              message: result.message,
            });
          }
        } else {
          const errorData = await response.json().catch(() => ({}));

          if (
            pluralType === "semesters" &&
            response.status === 409 &&
            errorData.canAutoRestore
          ) {
            const summary = errorData.dependencies?.summary
              ? `\n\nAffected dependencies: ${errorData.dependencies.summary}.`
              : "";

            showConfirmDialog(
              "Restore Dependencies",
              `${errorData.message || "Some associated sections/subjects are still archived. Do you want to unarchive them automatically, or block this action?"}${summary}`,
              async () => {
                try {
                  setError("");
                  const confirmResponse = await authenticatedFetch(
                    `${API_BASE}/api/admin/${pluralType}/${id}/unarchive?autoRestoreDependencies=true`,
                    { method: "PUT" },
                  );

                  if (confirmResponse.ok) {
                    const confirmResult = await confirmResponse.json();
                    await fetchData(activeTab);
                    if (confirmResult.warning) {
                      setNotification({
                        isOpen: true,
                        type: "warning",
                        title: "Attention Required",
                        message: confirmResult.message,
                      });
                    }
                  } else {
                    const confirmError = await confirmResponse
                      .json()
                      .catch(() => ({}));
                    setError(
                      confirmError.message ||
                        `Failed to unarchive ${type}`,
                    );
                  }
                } catch (confirmErr) {
                  setError(
                    `Error unarchiving ${type}: ${confirmErr.message}`,
                  );
                }
              },
            );
            return;
          }

          setError(errorData.message || `Failed to unarchive ${type}`);
        }
      } catch (err) {
        setError(`Error unarchiving ${type}: ${err.message}`);
      }
    },
    [activeTab, fetchData, showConfirmDialog],
  );

  useEffect(() => {
    fetchData(activeTab);
    setCurrentPage(1); // Reset to first page when changing tabs
  }, [activeTab, fetchData]);

  // D074: Filter items by search term across all relevant fields
  const allItems = data[activeTab] || [];
  const currentItems = allItems.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.fullName || "").toLowerCase().includes(term) ||
      (item.email || "").toLowerCase().includes(term) ||
      (item.sectionName || "").toLowerCase().includes(term) ||
      (item.subjectCode || "").toLowerCase().includes(term) ||
      (item.subjectName || "").toLowerCase().includes(term) ||
      (item.schoolYear || "").toLowerCase().includes(term) ||
      (item.term || "").toLowerCase().includes(term) ||
      (item.college || "").toLowerCase().includes(term) ||
      (item.department || "").toLowerCase().includes(term)
    );
  });
  const totalPages = Math.ceil(currentItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = currentItems.slice(startIndex, endIndex);

  const handlePageChange = (page) => setCurrentPage(page);
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <NavbarSimple />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        <PageHeader />

        <ToolbarControls
          showArchived={showArchived}
          onShowArchivedChange={setShowArchived}
          onRefresh={() => fetchData(activeTab)}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
        />

        <ErrorMessage error={error} />

        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="space-y-4">
                {currentItems.length > 0 ? (
                  paginatedItems.map((item) => (
                    <ArchiveItem
                      key={item._id}
                      item={item}
                      type={activeTab.slice(0, -1)}
                      onArchive={archiveItem}
                      onUnarchive={unarchiveItem}
                    />
                  ))
                ) : (
                  <EmptyState showArchived={showArchived} />
                )}
              </div>

              {currentItems.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={currentItems.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                />
              )}
            </>
          )}
        </div>
      </div>

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification((prev) => ({ ...prev, isOpen: false }))}
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
  );
}
