import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { authenticatedFetch } from "../../utils/auth";
import { InstructorSidebar } from "./instructorSidebar";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationProvider } from "../common/NotificationModals";
import Pagination from "../common/Pagination";
import {
  PageHeader,
  SectionInfo,
  CategoryTabs,
  ActivityCard,
  ActivityFormModal,
} from "./ui/sectionsAct";

export default function SectionActivities() {
  const { sectionId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [section, setSection] = useState(state?.section || null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "classStanding",
    maxScore: 100,
  });

  const notifications = useNotifications();
  const { showError, showSuccess, showConfirmDialog } = notifications;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // Ensure section is loaded (for subjectId on create)
        if (!section) {
          const res = await authenticatedFetch(
            `http://localhost:5000/api/instructor/sections`
          );
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data?.message || "Failed to fetch sections");
          }
          const found = (data.sections || []).find(
            (s) => String(s._id) === String(sectionId)
          );
          setSection(found || null);
        }

        // Fetch activities (fix double-read of body)
        const res2 = await authenticatedFetch(
          `http://localhost:5000/api/instructor/sections/${sectionId}/activities`
        );
        const d2 = await res2.json();
        if (!res2.ok) {
          throw new Error(d2?.message || "Failed to fetch activities");
        }
        setActivities(d2.activities || []);
        setError("");
      } catch (err) {
        console.error(err);
        setError(err.message || "Error loading activities");
        showError(err.message || "Error loading activities");
      } finally {
        setLoading(false);
      }
    })();
  }, [sectionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    if (tab === "all") return activities;
    return activities.filter((a) => a.category === tab);
  }, [activities, tab]);

  // Reset to page 1 when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [tab]);

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedActivities = filtered.slice(startIndex, endIndex);

  const handlePageChange = (page) => setCurrentPage(page);
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({
      title: "",
      description: "",
      category: "classStanding",
      maxScore: 100,
    });
    setShowForm(true);
  };

  const openEdit = (a) => {
    setEditingId(a._id);
    setForm({
      title: a.title || "",
      description: a.description || "",
      category: a.category || "classStanding",
      maxScore: a.maxScore || 100,
    });
    setShowForm(true);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (!section) return;
    try {
      setSaving(true);

      if (editingId) {
        // UPDATE
        const res = await authenticatedFetch(
          `http://localhost:5000/api/instructor/activities/${editingId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, maxScore: Number(form.maxScore) }),
          }
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data?.message || "Failed to update activity");
        }
      } else {
        // CREATE
        const res = await authenticatedFetch(
          `http://localhost:5000/api/instructor/subjects/${section?.subject?._id}/activities`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...form,
              maxScore: Number(form.maxScore),
              sectionId,
            }),
          }
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data?.message || "Failed to create activity");
        }
      }

      // Refresh list
      const res2 = await authenticatedFetch(
        `http://localhost:5000/api/instructor/sections/${sectionId}/activities`
      );
      const d2 = await res2.json();
      setActivities(d2.activities || []);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      showError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    showConfirmDialog(
      "Delete Activity",
      "Are you sure you want to delete this activity? This action cannot be undone.",
      async () => {
        try {
          const res = await authenticatedFetch(
            `http://localhost:5000/api/instructor/activities/${id}`,
            { method: "DELETE" }
          );
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data?.message || "Failed to delete");
          }
          setActivities((prev) => prev.filter((a) => a._id !== id));
          showSuccess("Activity deleted");
        } catch (err) {
          console.error(err);
          showError(err.message || "Delete failed");
        }
      }
    );
  };

  const goToScores = (activity) => {
    navigate(
      `/instructor/sections/${sectionId}/activities/${activity._id}/scores`,
      { state: { section, activity } }
    );
  };

  const handleBack = () => {
    if (state?.fromArchive) {
      navigate("/instructor/archive");
    } else {
      navigate(-1);
    }
  };

  return (
    <NotificationProvider notifications={notifications}>
      <div className="flex min-h-screen bg-gray-50">
        <InstructorSidebar />
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
          <PageHeader onBack={handleBack} onAdd={openAdd} />

          <SectionInfo section={section} />

          <CategoryTabs activeTab={tab} onTabChange={setTab} />

          {/* List */}
          <div className="mt-4">
            {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-gray-500 text-sm py-10 text-center">
                No activities found.
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {paginatedActivities.map((a) => (
                    <ActivityCard
                      key={a._id}
                      activity={a}
                      onEdit={openEdit}
                      onDelete={remove}
                      onClick={goToScores}
                    />
                  ))}
                </div>

                {filtered.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filtered.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    rowsPerPageOptions={[5, 10, 15, 20, 30, 50]}
                  />
                )}
              </>
            )}
          </div>

          <ActivityFormModal
            isOpen={showForm}
            isEdit={!!editingId}
            form={form}
            saving={saving}
            onClose={() => setShowForm(false)}
            onSubmit={submitForm}
            onChange={setForm}
          />
        </div>
      </div>
    </NotificationProvider>
  );
}
