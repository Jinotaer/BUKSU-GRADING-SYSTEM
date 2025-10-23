import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconListDetails,
  IconCalendar,
  IconTarget,
  IconUsers,
  IconX,
  IconCheck,
  IconSearch,
} from "@tabler/icons-react";
import { InstructorSidebar } from "./instructorSidebar";
import { authenticatedFetch } from "../../utils/auth";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationProvider } from "../common/NotificationModals";

/* Same modal look & feel */
function Modal({ isOpen, onClose, title, children }) {
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
}

const categories = [
  { key: "classStanding", label: "Class Standing" },
  { key: "laboratory", label: "Laboratory" },
  { key: "majorOutput", label: "Major Output" },
];

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

  // modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [selectedActivity, setSelectedActivity] = useState(null);

  // form state (keep as strings while typing)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "classStanding",
    maxScore: "100",
    dueDate: "", // optional
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

  const getSectionName = (id) => {
    const s = sections.find((x) => (x._id || x.id) === id);
    return s?.sectionName || "Unknown";
  };

  const getAssignedSectionNames = (ids = []) =>
    ids.map(getSectionName).filter(Boolean).join(", ");

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

      return inSearch && inSection;
    });
  }, [activities, searchTerm, filterSection]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "classStanding",
      maxScore: "100",
      dueDate: "",
      sectionIds: [],
    });
    setSelectedActivity(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
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
      category: activity.category || "classStanding",
      maxScore: String(activity.maxScore ?? activity.points ?? "100"),
      dueDate: activity.dueDate
        ? new Date(activity.dueDate).toISOString().slice(0, 16)
        : "",
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

    const payloadBase = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      maxScore: parseInt(formData.maxScore, 10) || 0,
      ...(formData.dueDate
        ? { dueDate: new Date(formData.dueDate).toISOString() }
        : {}),
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

  // >>> FIXED DELETE <<<
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
          if (!res.ok) throw new Error("Failed to delete");
          
          if (res.ok) {
            setActivities((prev) => prev.filter((a) => (a._id || a.id) !== (activity._id || activity.id)));
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
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="pt-4 sm:pt-6 md:pt-4 lg:pt-6 font-outfit text-[#1E3A5F] text-xl sm:text-2xl lg:text-3xl font-bold">
                Activity Management
              </h2>
              <p className="text-gray-600 mt-1">
                Create, assign, and manage activities
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
              Add Activity
            </button>
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="relative order-1">
                <IconSearch
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search activities / description / sections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base"
                />
              </div>

              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base order-2 sm:col-span-1"
              >
                <option value="">All Sections</option>
                {sections.map((s) => (
                  <option key={s._id || s.id} value={s._id || s.id}>
                    {s.sectionName}
                  </option>
                ))}
              </select>

              <div className="order-3 lg:col-span-1 text-sm text-gray-600 hidden lg:block self-center">
                Showing {filteredActivities.length} of {activities.length}
              </div>
            </div>
          </div>

          {/* Activities Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredActivities.map((activity) => (
                <div
                  key={activity._id || activity.id}
                  className="rounded-lg border border-blue-200 bg-blue-50/30 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <IconListDetails className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-lg">
                          {activity.title}
                        </h3>
                        <p className="text-gray-600 text-sm flex items-center gap-1">
                          <IconCalendar size={16} className="text-gray-400" />{" "}
                          Due: {formatDate(activity.dueDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(activity)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Activity"
                      >
                        <IconEdit size={16} />
                      </button>
                      <button
                        onClick={() => deleteActivity(activity)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Activity"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2">
                      <IconTarget size={16} className="mt-0.5 text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {activity.description || "No description"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <IconUsers size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Assigned to:{" "}
                        {getAssignedSectionNames(activity.sectionIds || []) ||
                          "None"}
                      </span>
                    </div>

                    <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-800">
                        Activity Details:
                      </p>
                      <p className="text-sm text-blue-600">
                        Category: {activity.category || "—"}
                      </p>
                      <p className="text-sm text-blue-600">
                        Max Score: {activity.maxScore ?? activity.points ?? 0}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500">
                    Created: {formatDate(activity.createdAt)}
                  </div>
                </div>
              ))}

              {filteredActivities.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <IconListDetails
                    className="mx-auto text-gray-300 mb-4"
                    size={48}
                  />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    No matching activities
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Try adjusting your search or add a new activity.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Add Activity Modal */}
          <Modal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            title="Add New Activity"
          >
            <form onSubmit={saveActivity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  autoComplete="off"
                  placeholder="e.g., Quiz 1, Lab Exercise 2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Brief details or instructions"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Score
                  </label>
                  <input
                    type="number"
                    name="maxScore"
                    min="0"
                    value={formData.maxScore}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  />
                </div>
              </div>

              {/* Optional due date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date (optional)
                </label>
                <input
                  type="datetime-local"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                />
              </div>

              {/* Assign to sections */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to Sections
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-white">
                  {sections.length === 0 ? (
                    <p className="text-sm text-gray-500 p-2">
                      No sections available.
                    </p>
                  ) : (
                    sections.map((s) => (
                      <label
                        key={s._id || s.id}
                        className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          checked={formData.sectionIds.includes(s._id || s.id)}
                          onChange={() => handleToggleSection(s._id || s.id)}
                        />
                        <div className="text-sm">
                          <div className="text-gray-900 font-medium">
                            {s.sectionName}
                          </div>
                          <div className="text-gray-500">
                            {s.schoolYear} - {s.term} • {s.subject?.subjectCode}{" "}
                            {s.subject?.subjectName}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <IconCheck size={16} />
                  Add Activity
                </button>
              </div>
            </form>
          </Modal>

          {/* Edit Activity Modal */}
          <Modal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            title="Edit Activity"
          >
            <form onSubmit={saveActivity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  autoComplete="off"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Score
                  </label>
                  <input
                    type="number"
                    name="maxScore"
                    min="0"
                    value={formData.maxScore}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to Sections
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-white">
                  {sections.length === 0 ? (
                    <p className="text-sm text-gray-500 p-2">
                      No sections available.
                    </p>
                  ) : (
                    sections.map((s) => (
                      <label
                        key={s._id || s.id}
                        className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          checked={formData.sectionIds.includes(s._id || s.id)}
                          onChange={() => handleToggleSection(s._id || s.id)}
                        />
                        <div className="text-sm">
                          <div className="text-gray-900 font-medium">
                            {s.sectionName}
                          </div>
                          <div className="text-gray-500">
                            {s.schoolYear} - {s.term} • {s.subject?.subjectCode}{" "}
                            {s.subject?.subjectName}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <IconCheck size={16} />
                  Update Activity
                </button>
              </div>
            </form>
          </Modal>
        </div>
      </div>
    </NotificationProvider>
  );
}
