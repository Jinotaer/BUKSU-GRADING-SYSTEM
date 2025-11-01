import React, { useState, useEffect, useCallback } from "react";
import { NavbarSimple } from "./adminsidebar";
import { authenticatedFetch } from "../../utils/auth";
import Pagination from "../common/Pagination";
import {
  PageHeader,
  LoadingSpinner,
  ToolbarControls,
  ErrorMessage,
  TabNavigation,
  ArchiveItem,
  EmptyState,
} from "./ui/archive";

export default function ArchiveManagement() {
  const [activeTab, setActiveTab] = useState("students");
  const [data, setData] = useState({
    students: [],
    instructors: [],
    semesters: [],
    subjects: [],
    sections: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchData = useCallback(async (type) => {
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

      const response = await authenticatedFetch(
        `http://localhost:5000${endpoint}`
      );
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
  }, [showArchived]);

  const archiveItem = useCallback(
    async (type, id) => {
      try {
        const pluralType = type.endsWith("s") ? type : `${type}s`;
        const response = await authenticatedFetch(
          `http://localhost:5000/api/admin/${pluralType}/${id}/archive`,
          { method: "PUT" }
        );

        if (response.ok) {
          await fetchData(activeTab);
        } else {
          const errorData = await response.json();
          setError(errorData.message || `Failed to archive ${type}`);
        }
      } catch (err) {
        setError(`Error archiving ${type}: ${err.message}`);
      }
    },
    [activeTab, fetchData]
  );

  const unarchiveItem = useCallback(
    async (type, id) => {
      try {
        const pluralType = type.endsWith("s") ? type : `${type}s`;
        const response = await authenticatedFetch(
          `http://localhost:5000/api/admin/${pluralType}/${id}/unarchive`,
          { method: "PUT" }
        );

        if (response.ok) {
          await fetchData(activeTab);
        } else {
          const errorData = await response.json();
          setError(errorData.message || `Failed to unarchive ${type}`);
        }
      } catch (err) {
        setError(`Error unarchiving ${type}: ${err.message}`);
      }
    },
    [activeTab, fetchData]
  );

  useEffect(() => {
    fetchData(activeTab);
    setCurrentPage(1); // Reset to first page when changing tabs
  }, [activeTab, fetchData]);

  // Pagination calculations
  const currentItems = data[activeTab] || [];
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
    </div>
  );
}
