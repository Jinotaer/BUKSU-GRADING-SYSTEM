import React, { useState, useEffect } from "react";
import {
  IconArchive,
  IconArchiveOff,
  IconUsers,
  IconSchool,
  IconCalendar,
  IconBook,
  IconChalkboard,
  IconRefresh,
} from "@tabler/icons-react";
import { NavbarSimple } from "./adminsidebar";
import { authenticatedFetch } from "../../utils/auth";

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

  const tabs = [
    { id: "students", label: "Students", icon: IconUsers },
    { id: "instructors", label: "Instructors", icon: IconSchool },
    { id: "semesters", label: "Semesters", icon: IconCalendar },
    { id: "subjects", label: "Subjects", icon: IconBook },
    { id: "sections", label: "Sections", icon: IconChalkboard },
  ];

  const fetchData = async (type) => {
    setLoading(true);
    setError("");
    try {
      // Always fetch archived items for this component
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

      const response = await authenticatedFetch(`http://localhost:5000${endpoint}`);
      if (response.ok) {
        const result = await response.json();
        const items = result[type] || result[type + 's'] || result.data || [];
        
        // Filter to show only archived items by default, or all items if toggle is on
        const filteredItems = showArchived 
          ? items 
          : items.filter(item => item.isArchived === true);
          
        setData(prev => ({
          ...prev,
          [type]: filteredItems
        }));
      } else {
        setError(`Failed to fetch ${type}`);
      }
    } catch (err) {
      setError(`Error fetching ${type}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const archiveItem = async (type, id) => {
    try {
      const pluralType = type.endsWith('s') ? type : `${type}s`;
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
  };

  const unarchiveItem = async (type, id) => {
    try {
      const pluralType = type.endsWith('s') ? type : `${type}s`;
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
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, showArchived]);

  const renderItem = (item, type) => {
    const isArchived = item.isArchived;
    
    return (
      <div
        key={item._id}
        className={`p-4 rounded-lg border ${
          isArchived 
            ? "bg-gray-100 border-gray-300 opacity-75" 
            : "bg-white border-gray-200"
        } hover:shadow-md transition-shadow`}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {item.fullName || item.subjectName || item.sectionName || `${item.schoolYear} - ${item.term}`}
            </h3>
            <p className="text-sm text-gray-600">
              {item.email || item.subjectCode || item.instructor?.fullName || item.term}
            </p>
            {item.college && (
              <p className="text-xs text-gray-500">{item.college}</p>
            )}
            {isArchived && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <IconArchive className="w-3 h-3 mr-1" />
                  Archived
                </span>
                {item.archivedAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    Archived on: {new Date(item.archivedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {isArchived ? (
              <button
                onClick={() => unarchiveItem(type, item._id)}
                className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 transition-colors"
              >
                <IconArchiveOff className="w-4 h-4 mr-1" />
                Unarchive
              </button>
            ) : (
              <button
                onClick={() => archiveItem(type, item._id)}
                className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
              >
                <IconArchive className="w-4 h-4 mr-1" />
                Archive
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <NavbarSimple />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E3A5F] mb-2">
            Archive Management
          </h1>
          <p className="text-gray-600">
            Manage archived students, instructors, semesters, subjects, and sections.
          </p>
        </div>

        {/* Toggle for showing all items vs only archived */}
        <div className="mb-6 flex items-center gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Show all items (including active)
            </span>
          </label>
          <button
            onClick={() => fetchData(activeTab)}
            disabled={loading}
            className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <IconRefresh className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {data[activeTab] && data[activeTab].length > 0 ? (
                data[activeTab].map((item) => renderItem(item, activeTab.slice(0, -1))) // Remove 's' from plural
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {showArchived ? "No items found" : "No archived items found"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
