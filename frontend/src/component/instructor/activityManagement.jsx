import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { InstructorSidebar } from "./instructorSidebar";
import { authenticatedFetch } from "../../utils/auth";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationProvider } from "../common/NotificationModals";
import Pagination from "../common/Pagination";
import {
  Modal,
  PageHeader,
  SearchAndFilters,
  LoadingSpinner,
  ActivityCard,
  EmptyState,
  ActivityForm,
} from "./ui/activitiesM";

export default function ActivityManagement() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const { showError, showSuccess, showConfirmDialog } = notifications;

  const [activities, setActivities] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters/search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterTerm, setFilterTerm] = useState("");

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  // modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [selectedActivity, setSelectedActivity] = useState(null);

  // form state (keep as strings while typing)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    notes: "",
    category: "classStanding",
    maxScore: "100",
    eventType: "quiz",
    location: "",
    startDateTime: "",
    endDateTime: "",
    syncToGoogleCalendar: false,
    sectionIds: [],
  });

  const didFetchRef = useRef(false);

  const formatDate = (iso) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  const fetchAll = async () => {
    try {
      setLoading(true);

      // Load instructor's sections
      const secRes = await authenticatedFetch(
        "http://localhost:5000/api/instructor/sections"
      );
      if (secRes.status === 401) {
        showError("Your session has expired. Please log in again.");
        navigate("/login");
        return;
      }
      const secData = await secRes.json().catch(() => ({}));
      const secs = secData.sections || [];
      setSections(secs);

      // For each section, load its activities and aggregate
      const perSection = await Promise.all(
        secs.map(async (s) => {
          try {
            const r = await authenticatedFetch(
              `http://localhost:5000/api/instructor/sections/${s._id}/activities`
            );
            if (!r.ok) return { sectionId: s._id, activities: [] };
            const j = await r.json().catch(() => ({}));
            return { sectionId: s._id, activities: j.activities || [] };
          } catch {
            return { sectionId: s._id, activities: [] };
          }
        })
      );

      const map = new Map();
      perSection.forEach(({ sectionId, activities }) => {
        activities.forEach((a) => {
          const id = a._id || a.id;
          if (!id) return;
          if (!map.has(id)) {
            map.set(id, { ...a, sectionIds: [sectionId] });
          } else {
            const existing = map.get(id);
            if (!existing.sectionIds.includes(sectionId))
              existing.sectionIds.push(sectionId);
            map.set(id, existing);
          }
        });
      });

      setActivities(Array.from(map.values()));
    } catch (e) {
      console.error(e);
      showError("Failed to load activities or sections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getSectionName = React.useCallback(
    (id) => {
      const s = sections.find((x) => (x._id || x.id) === id);
      if (!s) return "Unknown";
      
      // Include subject name if available
      const subjectName = s.subject?.subjectName || s.subject?.subjectCode;
      if (subjectName) {
        return `${s.sectionName} (${subjectName})`;
      }
      return s.sectionName;
    },
    [sections]
  );

  const getAssignedSectionNames = React.useCallback(
    (ids = []) => ids.map(getSectionName).filter(Boolean).join(", "),
    [getSectionName]
  );

  const filteredActivities = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return (activities || []).filter((a) => {
      const inSearch = q
        ? [a.title, a.description, getAssignedSectionNames(a.sectionIds || [])]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q))
        : true;

      const inSection = filterSection
        ? (a.sectionIds || []).some(
            (sid) => String(sid) === String(filterSection)
          )
        : true;

      const inTerm = filterTerm
        ? a.term === filterTerm
        : true;

      return inSearch && inSection && inTerm;
    });
  }, [activities, searchTerm, filterSection, filterTerm, getAssignedSectionNames]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterSection, filterTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedActivities = filteredActivities.slice(startIndex, endIndex);

  const handlePageChange = (page) => setCurrentPage(page);
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      notes: "",
      term: "Midterm",
      category: "classStanding",
      maxScore: "100",
      eventType: "quiz",
      location: "",
      startDateTime: "",
      endDateTime: "",
      syncToGoogleCalendar: false,
      sectionIds: [],
    });
    setSelectedActivity(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({ 
      ...p, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleToggleSection = (id) => {
    setFormData((p) => {
      const exists = p.sectionIds.includes(id);
      return {
        ...p,
        sectionIds: exists
          ? p.sectionIds.filter((x) => x !== id)
          : [...p.sectionIds, id],
      };
    });
  };

  const openEdit = (activity) => {
    setSelectedActivity(activity);
    setFormData({
      title: activity.title || "",
      description: activity.description || "",
      notes: activity.notes || "",
      term: activity.term || "Midterm",
      category: activity.category || "classStanding",
      maxScore: String(activity.maxScore ?? activity.points ?? "100"),
      eventType: activity.eventType || "quiz",
      location: activity.location || "",
      startDateTime: activity.startDateTime
        ? new Date(activity.startDateTime).toISOString().slice(0, 16)
        : "",
      endDateTime: activity.endDateTime
        ? new Date(activity.endDateTime).toISOString().slice(0, 16)
        : "",
      syncToGoogleCalendar: activity.syncToGoogleCalendar || false,
      sectionIds: activity.sectionIds ? [...activity.sectionIds] : [],
    });
    setShowEditModal(true);
  };

  const saveActivity = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showError("Title is required");
      return;
    }

    // Validate schedule fields for new activities
    if (!selectedActivity) {
      if (!formData.startDateTime || !formData.endDateTime) {
        showError("Start and end date/time are required");
        return;
      }

      const startObj = new Date(formData.startDateTime);
      const endObj = new Date(formData.endDateTime);

      if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
        showError("Invalid date/time format");
        return;
      }

      if (startObj >= endObj) {
        showError("End date/time must be after start date/time");
        return;
      }
    }

    const payloadBase = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      notes: formData.notes?.trim() || "",
      term: formData.term || "Midterm",
      category: formData.category,
      maxScore: parseInt(formData.maxScore, 10) || 0,
      eventType: formData.eventType || "quiz",
      location: formData.location?.trim() || "",
      startDateTime: formData.startDateTime,
      endDateTime: formData.endDateTime,
      syncToGoogleCalendar: formData.syncToGoogleCalendar || false,
    };

    try {
      if (selectedActivity) {
        // UPDATE
        const url = `http://localhost:5000/api/instructor/activities/${
          selectedActivity._id || selectedActivity.id
        }`;
        const res = await authenticatedFetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadBase),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to update activity");
        }
      } else {
        // CREATE per selected section (same style as SectionActivities)
        const chosen = formData.sectionIds;
        if (!chosen.length) {
          showError("Select at least one section to assign this activity");
          return;
        }
        const errors = [];
        for (const sid of chosen) {
          const sec = sections.find((s) => (s._id || s.id) === sid);
          const subjectId = sec?.subject?._id || sec?.subject;
          if (!subjectId) {
            errors.push(`Missing subject for section ${getSectionName(sid)}`);
            continue;
          }
          const res = await authenticatedFetch(
            `http://localhost:5000/api/instructor/subjects/${subjectId}/activities`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...payloadBase, sectionId: sid }),
            }
          );
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            errors.push(
              data.message || `Failed to create for ${getSectionName(sid)}`
            );
          }
        }
        if (errors.length) throw new Error(errors.join("; "));
      }

      await fetchAll();
      resetForm();
      setShowAddModal(false);
      setShowEditModal(false);
      showSuccess(
        selectedActivity
          ? "Activity updated"
          : "Activity created for selected sections"
      );
    } catch (err) {
      console.error(err);
      showError(err.message || "Error saving activity");
    }
  };

  const deleteActivity = async (activity) => {
    showConfirmDialog(
      "Delete Activity",
      `Are you sure you want to delete "${activity.title}"? This cannot be undone.`,
      async () => {
        try {
          const res = await authenticatedFetch(
            `http://localhost:5000/api/instructor/activities/${activity._id || activity.id}`,
            { method: "DELETE" }
          );
          
          if (res.ok) {
            // Refresh the activities list to ensure sync with backend
            await fetchAll();
            showSuccess("Activity deleted");
          } else if (res.status === 403) {
            showError("You do not have permission to delete this activity.");
          } else if (res.status === 404) {
            showError("Activity not found or already deleted.");
          } else {
            const data = await res.json().catch(() => ({}));
            showError(data.message || "Failed to delete activity");
          }
        } catch (e) {
          console.error(e);
          showError("Error deleting activity");
        }
      }
    );
  };

  return (
    <NotificationProvider notifications={notifications}>
      <div className="flex min-h-screen bg-gray-50">
        <InstructorSidebar />
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
            filterSection={filterSection}
            onFilterChange={setFilterSection}
            filterTerm={filterTerm}
            onFilterTermChange={setFilterTerm}
            sections={sections}
            filteredCount={filteredActivities.length}
            totalCount={activities.length}
          />

          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedActivities.map((activity) => (
                  <ActivityCard
                    key={activity._id || activity.id}
                    activity={activity}
                    getAssignedSectionNames={getAssignedSectionNames}
                    formatDate={formatDate}
                    onEdit={openEdit}
                    onDelete={deleteActivity}
                  />
                ))}

                {filteredActivities.length === 0 && <EmptyState />}
              </div>

              {filteredActivities.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredActivities.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  rowsPerPageOptions={[6, 9, 12, 18]}
                />
              )}
            </>
          )}

          <Modal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            title="Add New Activity"
          >
            <ActivityForm
              formData={formData}
              onChange={handleChange}
              onSubmit={saveActivity}
              onCancel={() => setShowAddModal(false)}
              sections={sections}
              onToggleSection={handleToggleSection}
              isEditMode={false}
            />
          </Modal>

          <Modal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            title="Edit Activity"
          >
            <ActivityForm
              formData={formData}
              onChange={handleChange}
              onSubmit={saveActivity}
              onCancel={() => setShowEditModal(false)}
              sections={sections}
              onToggleSection={handleToggleSection}
              isEditMode={true}
            />
          </Modal>
        </div>
      </div>
    </NotificationProvider>
  );
}
